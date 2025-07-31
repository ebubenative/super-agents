import { readdir, stat, copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

/**
 * Recursively copy a directory and all its contents
 * @param {string} source - Source directory path
 * @param {string} destination - Destination directory path
 * @param {Object} options - Copy options
 * @param {boolean} options.overwrite - Whether to overwrite existing files (default: false)
 * @param {boolean} options.verbose - Whether to log copy operations (default: false)
 * @param {Array<string>} options.exclude - File/directory patterns to exclude
 * @returns {Promise<{copied: number, skipped: number, errors: Array}>}
 */
export async function copyDirectoryRecursive(source, destination, options = {}) {
  const {
    overwrite = false,
    verbose = false,
    exclude = ['.git', 'node_modules', '.DS_Store', 'Thumbs.db']
  } = options;
  
  const results = {
    copied: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Check if source exists
    if (!existsSync(source)) {
      throw new Error(`Source directory does not exist: ${source}`);
    }

    // Create destination directory if it doesn't exist
    if (!existsSync(destination)) {
      await mkdir(destination, { recursive: true });
      if (verbose) {
        console.log(`${chalk.green('✓')} Created directory: ${destination}`);
      }
    }

    // Read source directory contents
    const items = await readdir(source);

    for (const item of items) {
      // Skip excluded items
      if (exclude.includes(item)) {
        results.skipped++;
        continue;
      }

      const sourcePath = join(source, item);
      const destPath = join(destination, item);

      try {
        const itemStats = await stat(sourcePath);

        if (itemStats.isDirectory()) {
          // Recursively copy subdirectory
          const subResults = await copyDirectoryRecursive(sourcePath, destPath, options);
          results.copied += subResults.copied;
          results.skipped += subResults.skipped;
          results.errors.push(...subResults.errors);
        } else {
          // Copy file
          const shouldCopy = overwrite || !existsSync(destPath);
          
          if (shouldCopy) {
            await copyFile(sourcePath, destPath);
            results.copied++;
            if (verbose) {
              console.log(`${chalk.green('✓')} Copied: ${sourcePath} → ${destPath}`);
            }
          } else {
            results.skipped++;
            if (verbose) {
              console.log(`${chalk.yellow('⚠')} Skipped existing: ${destPath}`);
            }
          }
        }
      } catch (error) {
        results.errors.push({
          item: sourcePath,
          error: error.message
        });
        if (verbose) {
          console.log(`${chalk.red('✗')} Error copying ${sourcePath}: ${error.message}`);
        }
      }
    }

    return results;

  } catch (error) {
    results.errors.push({
      item: source,
      error: error.message
    });
    throw error;
  }
}

/**
 * Find the Super Agents installation directory
 * @param {string} currentPath - Current file path to start search from
 * @returns {Promise<string>} Path to the sa-engine directory
 */
export async function findSuperAgentsInstallation(currentPath) {
  const { dirname, resolve } = await import('path');
  const { fileURLToPath } = await import('url');
  
  let searchPath = currentPath;
  
  // If currentPath looks like a file URL, convert it
  if (currentPath.startsWith('file://')) {
    searchPath = fileURLToPath(currentPath);
  }
  
  // If it's a file, get its directory
  try {
    const pathStats = await stat(searchPath);
    if (pathStats.isFile()) {
      searchPath = dirname(searchPath);
    }
  } catch (error) {
    // Assume it's already a directory path
  }
  
  // Search up the directory tree for sa-engine
  let currentDir = resolve(searchPath);
  
  while (currentDir !== dirname(currentDir)) { // Until we reach the root
    const saEnginePath = join(currentDir, 'sa-engine');
    
    if (existsSync(saEnginePath)) {
      // Verify it's a complete sa-engine installation
      const requiredDirs = ['agents', 'mcp-server', 'templates'];
      const hasRequiredDirs = requiredDirs.every(dir => 
        existsSync(join(saEnginePath, dir))
      );
      
      if (hasRequiredDirs) {
        return saEnginePath;
      }
    }
    
    currentDir = dirname(currentDir);
  }
  
  throw new Error('Could not find Super Agents installation. Please ensure sa-engine directory exists.');
}

/**
 * Verify that copied files have content (not empty)
 * @param {string} dirPath - Directory to verify
 * @param {Array<string>} criticalFiles - Files that must have content
 * @returns {Promise<{valid: boolean, emptyFiles: Array<string>}>}
 */
export async function verifyDirectoryContent(dirPath, criticalFiles = []) {
  const emptyFiles = [];
  
  for (const file of criticalFiles) {
    const filePath = join(dirPath, file);
    
    if (existsSync(filePath)) {
      try {
        const fileStats = await stat(filePath);
        if (fileStats.size === 0) {
          emptyFiles.push(file);
        }
      } catch (error) {
        emptyFiles.push(file);
      }
    } else {
      emptyFiles.push(file);
    }
  }
  
  return {
    valid: emptyFiles.length === 0,
    emptyFiles
  };
}