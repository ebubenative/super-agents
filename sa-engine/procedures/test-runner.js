#!/usr/bin/env node

import ProcedureRunner from './ProcedureRunner.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simple test script to demonstrate ProcedureRunner functionality
 */
async function main() {
  const args = process.argv.slice(2);
  const procedureId = args[0] || 'create-doc';
  
  console.log('🚀 Super Agents Procedure Runner Test');
  console.log('=====================================');
  console.log(`Executing procedure: ${procedureId}`);
  
  try {
    const runner = new ProcedureRunner({
      proceduresPath: __dirname,
      enableLogging: true
    });
    
    // Set up event listeners for demonstration
    runner.on('procedureLoaded', ({ procedure }) => {
      console.log(`✅ Loaded procedure: ${procedure.procedure.name} v${procedure.procedure.version}`);
    });
    
    runner.on('stepStarted', ({ step }) => {
      console.log(`▶️  Starting step: ${step.name}`);
    });
    
    runner.on('stepCompleted', ({ step, result }) => {
      console.log(`✅ Completed step: ${step.name}`);
    });
    
    runner.on('executionCompleted', (results) => {
      console.log('\n🎉 Procedure execution completed successfully!');
      console.log('Results:', {
        procedureId: results.procedureId,
        duration: `${Math.round(results.duration / 1000)}s`,
        stepsCompleted: results.stepsCompleted,
        userInteractions: results.userInteractions
      });
    });
    
    // Execute the procedure
    const initialVariables = {
      template_name: 'simple-architecture',
      output_filename: 'test-output.md'
    };
    
    const results = await runner.execute(procedureId, initialVariables);
    
    console.log('\n📊 Final Results:');
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('❌ Procedure execution failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Procedure execution cancelled by user');
  process.exit(0);
});

main().catch(console.error);