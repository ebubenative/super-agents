/**
 * SA Dependency Graph Tool
 * Dependency visualization generation with multiple output formats and interactive exploration
 */

export const saDependencyGraph = {
  name: 'sa_dependency_graph',
  description: 'Generate dependency graph visualization in multiple formats with interactive exploration capabilities',
  category: 'dependencies',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      tasksFile: {
        type: 'string',
        description: 'Path to tasks file (optional, will use project tasks.json)'
      },
      outputFormat: {
        type: 'string',
        enum: ['ascii', 'json', 'dot', 'mermaid', 'html', 'all'],
        description: 'Output format for the dependency graph',
        default: 'ascii'
      },
      outputFile: {
        type: 'string',
        description: 'Output file path (optional, will generate based on format)'
      },
      includeOrphans: {
        type: 'boolean',
        description: 'Include tasks with no dependencies or dependents',
        default: true
      },
      maxDepth: {
        type: 'number',
        description: 'Maximum depth for dependency traversal (0 = unlimited)',
        default: 0,
        minimum: 0
      },
      focusTask: {
        type: 'string',
        description: 'Focus on specific task and its immediate dependencies/dependents'
      },
      groupBy: {
        type: 'string',
        enum: ['none', 'priority', 'status', 'assignee', 'tags'],
        description: 'Group tasks in visualization',
        default: 'none'
      },
      showMetadata: {
        type: 'boolean',
        description: 'Include task metadata in visualization (priority, status, effort)',
        default: true
      },
      highlightCriticalPath: {
        type: 'boolean',
        description: 'Highlight critical path in the visualization',
        default: false
      },
      analyzeImpact: {
        type: 'boolean',
        description: 'Include impact analysis for each task',
        default: false
      }
    },
    required: ['projectRoot']
  },
  
  async execute({ projectRoot, tasksFile, outputFormat = 'ascii', outputFile, includeOrphans = true, maxDepth = 0, focusTask, groupBy = 'none', showMetadata = true, highlightCriticalPath = false, analyzeImpact = false }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Determine tasks file path
      const tasksPath = tasksFile || path.join(projectRoot, 'sa-engine', 'data', 'tasks', 'tasks.json');
      
      // Load tasks
      let tasksData;
      try {
        const tasksContent = await fs.readFile(tasksPath, 'utf-8');
        tasksData = JSON.parse(tasksContent);
      } catch (error) {
        throw new Error(`Failed to load tasks file: ${error.message}`);
      }
      
      if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
        throw new Error('Invalid tasks file format');
      }
      
      // Filter and prepare tasks
      let tasks = tasksData.tasks;
      
      // Focus on specific task if requested
      if (focusTask) {
        tasks = this.getTaskSubgraph(tasks, focusTask, maxDepth);
      }
      
      // Filter orphans if not included
      if (!includeOrphans) {
        tasks = tasks.filter(task => {
          const hasDependencies = task.dependencies && task.dependencies.length > 0;
          const hasDependent = tasks.some(t => 
            t.dependencies && t.dependencies.includes(task.id)
          );
          return hasDependencies || hasDependent;
        });
      }
      
      // Analyze critical path if requested
      let criticalPath = [];
      if (highlightCriticalPath) {
        criticalPath = this.findCriticalPath(tasks);
      }
      
      // Perform impact analysis if requested
      let impactAnalysis = {};
      if (analyzeImpact) {
        impactAnalysis = this.performImpactAnalysis(tasks);
      }
      
      // Generate visualizations based on format
      const results = {};
      const formats = outputFormat === 'all' ? 
        ['ascii', 'json', 'dot', 'mermaid', 'html'] : 
        [outputFormat];
      
      for (const format of formats) {
        const visualization = await this.generateVisualization(
          tasks, format, {
            groupBy,
            showMetadata,
            criticalPath,
            impactAnalysis,
            projectRoot
          }
        );
        
        results[format] = visualization;
        
        // Save to file if requested or if generating all formats
        if (outputFile || outputFormat === 'all') {
          const fileName = outputFile || 
            path.join(projectRoot, 'sa-engine', 'data', 'reports', `dependency-graph.${this.getFileExtension(format)}`);
          
          // Ensure output directory exists
          await fs.mkdir(path.dirname(fileName), { recursive: true });
          
          if (format === 'json') {
            await fs.writeFile(fileName, JSON.stringify(visualization, null, 2));
          } else {
            await fs.writeFile(fileName, visualization);
          }
          
          results[format + '_file'] = fileName;
        }
      }
      
      // Generate summary
      const summary = this.generateGraphSummary(tasks, criticalPath, impactAnalysis);
      
      // Build response
      const mainVisualization = results[outputFormat] || results.ascii;
      const responseText = `${summary}\\n\\n${mainVisualization}`;
      
      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        metadata: {
          totalTasks: tasks.length,
          totalDependencies: tasks.reduce((sum, task) => sum + (task.dependencies?.length || 0), 0),
          outputFormat,
          outputFiles: Object.keys(results).filter(key => key.endsWith('_file')).map(key => results[key]),
          criticalPathLength: criticalPath.length,
          focusTask,
          groupBy,
          includeOrphans,
          generatedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating dependency graph: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'dependency_graph_error'
        }
      };
    }
  },
  
  getTaskSubgraph(tasks, focusTaskId, maxDepth) {
    const subgraphTasks = new Set();
    const visited = new Set();
    
    // Find the focus task
    const focusTask = tasks.find(t => t.id === focusTaskId);
    if (!focusTask) {
      throw new Error(`Focus task not found: ${focusTaskId}`);
    }
    
    // BFS to find connected tasks within maxDepth
    const queue = [{ id: focusTaskId, depth: 0 }];
    visited.add(focusTaskId);
    subgraphTasks.add(focusTaskId);
    
    while (queue.length > 0) {
      const { id: currentId, depth } = queue.shift();
      
      if (maxDepth > 0 && depth >= maxDepth) continue;
      
      const currentTask = tasks.find(t => t.id === currentId);
      if (!currentTask) continue;
      
      // Add dependencies
      if (currentTask.dependencies) {
        currentTask.dependencies.forEach(depId => {
          subgraphTasks.add(depId);
          if (!visited.has(depId)) {
            visited.add(depId);
            queue.push({ id: depId, depth: depth + 1 });
          }
        });
      }
      
      // Add dependents
      tasks.forEach(task => {
        if (task.dependencies && task.dependencies.includes(currentId)) {
          subgraphTasks.add(task.id);
          if (!visited.has(task.id)) {
            visited.add(task.id);
            queue.push({ id: task.id, depth: depth + 1 });
          }
        }
      });
    }
    
    return tasks.filter(task => subgraphTasks.has(task.id));
  },
  
  findCriticalPath(tasks) {
    // Simple critical path calculation based on priorities and effort
    const criticalTasks = tasks.filter(task => {
      const hasHighPriority = task.priority === 'high';
      const hasHighEffort = task.effort && task.effort >= 4;
      const hasDependents = tasks.some(t => 
        t.dependencies && t.dependencies.includes(task.id)
      );
      
      return hasHighPriority || (hasHighEffort && hasDependents);
    });
    
    // Sort by priority and effort
    return criticalTasks
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityWeight[a.priority] || 1;
        const bPriority = priorityWeight[b.priority] || 1;
        const aEffort = a.effort || 1;
        const bEffort = b.effort || 1;
        
        return (bPriority * bEffort) - (aPriority * aEffort);
      })
      .map(task => task.id);
  },
  
  performImpactAnalysis(tasks) {
    const analysis = {};
    
    tasks.forEach(task => {
      // Count direct dependencies
      const directDependencies = task.dependencies?.length || 0;
      
      // Count direct dependents
      const directDependents = tasks.filter(t => 
        t.dependencies && t.dependencies.includes(task.id)
      ).length;
      
      // Calculate total impact (tasks affected if this task changes)
      const totalImpact = this.calculateTotalImpact(tasks, task.id);
      
      analysis[task.id] = {
        directDependencies,
        directDependents,
        totalImpact,
        impactScore: (directDependents * 2) + totalImpact,
        isCritical: directDependents >= 3 || totalImpact >= 5
      };
    });
    
    return analysis;
  },
  
  calculateTotalImpact(tasks, taskId, visited = new Set()) {
    if (visited.has(taskId)) return 0;
    
    visited.add(taskId);
    let impact = 0;
    
    // Find all tasks that depend on this task
    tasks.forEach(task => {
      if (task.dependencies && task.dependencies.includes(taskId)) {
        impact += 1 + this.calculateTotalImpact(tasks, task.id, new Set(visited));
      }
    });
    
    return impact;
  },
  
  async generateVisualization(tasks, format, options) {
    switch (format) {
      case 'ascii':
        return this.generateAsciiGraph(tasks, options);
      case 'json':
        return this.generateJsonGraph(tasks, options);
      case 'dot':
        return this.generateDotGraph(tasks, options);
      case 'mermaid':
        return this.generateMermaidGraph(tasks, options);
      case 'html':
        return this.generateHtmlGraph(tasks, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  },
  
  generateAsciiGraph(tasks, options) {
    const { groupBy, showMetadata, criticalPath, impactAnalysis } = options;
    
    let graph = `# Dependency Graph (ASCII)\\n\\n`;
    
    // Group tasks if requested
    const groups = this.groupTasks(tasks, groupBy);
    
    Object.entries(groups).forEach(([groupName, groupTasks]) => {
      if (groupBy !== 'none') {
        graph += `## ${groupName}\\n\\n`;
      }
      
      groupTasks.forEach(task => {
        const isCritical = criticalPath.includes(task.id);
        const prefix = isCritical ? '🎯 ' : '📋 ';
        
        graph += `${prefix}**${task.title}** (${task.id})\\n`;
        
        if (showMetadata) {
          graph += `   Priority: ${task.priority || 'medium'} | `;
          graph += `Status: ${task.status || 'pending'} | `;
          graph += `Effort: ${task.effort || 'N/A'}/5\\n`;
        }
        
        if (impactAnalysis[task.id]) {
          const impact = impactAnalysis[task.id];
          graph += `   Impact Score: ${impact.impactScore} | `;
          graph += `Dependencies: ${impact.directDependencies} | `;
          graph += `Dependents: ${impact.directDependents}\\n`;
        }
        
        // Show dependencies
        if (task.dependencies && task.dependencies.length > 0) {
          graph += `   Dependencies:\\n`;
          task.dependencies.forEach(depId => {
            const depTask = tasks.find(t => t.id === depId);
            const depName = depTask ? depTask.title : depId;
            const depCritical = criticalPath.includes(depId);
            const depPrefix = depCritical ? '🎯' : '└─';
            graph += `     ${depPrefix} ${depName} (${depId})\\n`;
          });
        }
        
        // Show dependents
        const dependents = tasks.filter(t => 
          t.dependencies && t.dependencies.includes(task.id)
        );
        if (dependents.length > 0) {
          graph += `   Dependents:\\n`;
          dependents.forEach(depTask => {
            const depCritical = criticalPath.includes(depTask.id);
            const depPrefix = depCritical ? '🎯' : '┌─';
            graph += `     ${depPrefix} ${depTask.title} (${depTask.id})\\n`;
          });
        }
        
        graph += '\\n';
      });
    });
    
    return graph;
  },
  
  generateJsonGraph(tasks, options) {
    const { criticalPath, impactAnalysis } = options;
    
    return {
      graph: {
        directed: true,
        nodes: tasks.map(task => ({
          id: task.id,
          label: task.title,
          priority: task.priority,
          status: task.status,
          effort: task.effort,
          isCritical: criticalPath.includes(task.id),
          impact: impactAnalysis[task.id] || null,
          metadata: {
            description: task.description,
            skills: task.skills || [],
            assignee: task.assignee,
            tags: task.tags || []
          }
        })),
        edges: tasks.flatMap(task => 
          (task.dependencies || []).map(depId => ({
            source: depId,
            target: task.id,
            type: 'dependency'
          }))
        )
      },
      metadata: {
        totalNodes: tasks.length,
        totalEdges: tasks.reduce((sum, task) => sum + (task.dependencies?.length || 0), 0),
        criticalPathLength: criticalPath.length,
        generatedAt: new Date().toISOString()
      }
    };
  },
  
  generateDotGraph(tasks, options) {
    const { groupBy, showMetadata, criticalPath, impactAnalysis } = options;
    
    let dot = `digraph DependencyGraph {\\n`;
    dot += `  rankdir=TB;\\n`;
    dot += `  node [shape=box, style=rounded];\\n\\n`;
    
    // Define node styles
    dot += `  // Node styles\\n`;
    tasks.forEach(task => {
      const isCritical = criticalPath.includes(task.id);
      const impact = impactAnalysis[task.id];
      
      let nodeStyle = 'fillcolor=lightblue, style="rounded,filled"';
      if (isCritical) {
        nodeStyle = 'fillcolor=orange, style="rounded,filled"';
      } else if (impact && impact.isCritical) {
        nodeStyle = 'fillcolor=yellow, style="rounded,filled"';
      }
      
      let label = task.title;
      if (showMetadata) {
        label += `\\\\n${task.priority || 'medium'} | ${task.status || 'pending'}`;
        if (task.effort) label += ` | ${task.effort}/5`;
      }
      
      dot += `  "${task.id}" [label="${label}", ${nodeStyle}];\\n`;
    });
    
    // Define edges
    dot += `\\n  // Dependencies\\n`;
    tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          const isCriticalEdge = criticalPath.includes(task.id) && criticalPath.includes(depId);
          const edgeStyle = isCriticalEdge ? 'color=red, penwidth=2' : 'color=black';
          dot += `  "${depId}" -> "${task.id}" [${edgeStyle}];\\n`;
        });
      }
    });
    
    dot += `}\\n`;
    
    return dot;
  },
  
  generateMermaidGraph(tasks, options) {
    const { criticalPath } = options;
    
    let mermaid = `graph TD\\n`;
    
    // Define nodes
    tasks.forEach(task => {
      const isCritical = criticalPath.includes(task.id);
      const nodeStyle = isCritical ? `${task.id}[${task.title}]:::critical` : `${task.id}[${task.title}]`;
      mermaid += `    ${nodeStyle}\\n`;
    });
    
    mermaid += `\\n`;
    
    // Define edges
    tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          mermaid += `    ${depId} --> ${task.id}\\n`;
        });
      }
    });
    
    // Define styles
    mermaid += `\\n    classDef critical fill:#ff9999,stroke:#333,stroke-width:2px\\n`;
    
    return mermaid;
  },
  
  generateHtmlGraph(tasks, options) {
    const { showMetadata, criticalPath, impactAnalysis } = options;
    
    const jsonGraph = this.generateJsonGraph(tasks, options);
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>Dependency Graph</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .graph-container { width: 100%; height: 600px; border: 1px solid #ccc; }
        .node { cursor: pointer; }
        .node.critical { fill: orange; }
        .node.high-impact { fill: yellow; }
        .link { stroke: #999; stroke-width: 2; }
        .link.critical-path { stroke: red; stroke-width: 3; }
        .tooltip { position: absolute; background: #333; color: white; padding: 10px; border-radius: 5px; pointer-events: none; opacity: 0; }
        .legend { margin-top: 20px; }
        .legend-item { display: inline-block; margin-right: 20px; }
        .legend-color { width: 20px; height: 20px; display: inline-block; margin-right: 5px; vertical-align: middle; }
    </style>
</head>
<body>
    <h1>Project Dependency Graph</h1>
    <div class="graph-container" id="graph"></div>
    
    <div class="legend">
        <div class="legend-item">
            <span class="legend-color" style="background: lightblue;"></span>
            Normal Task
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background: orange;"></span>
            Critical Path
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background: yellow;"></span>
            High Impact
        </div>
    </div>
    
    <script>
        const graphData = ${JSON.stringify(jsonGraph.graph, null, 2)};
        
        const width = 800;
        const height = 600;
        
        const svg = d3.select("#graph")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        
        const simulation = d3.forceSimulation(graphData.nodes)
            .force("link", d3.forceLink(graphData.edges).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));
        
        const link = svg.append("g")
            .selectAll("line")
            .data(graphData.edges)
            .join("line")
            .attr("class", "link");
        
        const node = svg.append("g")
            .selectAll("circle")
            .data(graphData.nodes)
            .join("circle")
            .attr("class", d => {
                let classes = "node";
                if (d.isCritical) classes += " critical";
                if (d.impact && d.impact.isCritical) classes += " high-impact";
                return classes;
            })
            .attr("r", 10)
            .attr("fill", d => {
                if (d.isCritical) return "orange";
                if (d.impact && d.impact.isCritical) return "yellow";
                return "lightblue";
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        
        const label = svg.append("g")
            .selectAll("text")
            .data(graphData.nodes)
            .join("text")
            .text(d => d.label)
            .attr("font-size", "12px")
            .attr("dx", 15)
            .attr("dy", 4);
        
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            
            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });
        
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    </script>
</body>
</html>`;
  },
  
  groupTasks(tasks, groupBy) {
    if (groupBy === 'none') {
      return { 'All Tasks': tasks };
    }
    
    const groups = {};
    
    tasks.forEach(task => {
      let groupKey;
      
      switch (groupBy) {
        case 'priority':
          groupKey = task.priority || 'medium';
          break;
        case 'status':
          groupKey = task.status || 'pending';
          break;
        case 'assignee':
          groupKey = task.assignee || 'Unassigned';
          break;
        case 'tags':
          groupKey = task.tags && task.tags.length > 0 ? task.tags[0] : 'No Tags';
          break;
        default:
          groupKey = 'Default';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    return groups;
  },
  
  getFileExtension(format) {
    const extensions = {
      ascii: 'txt',
      json: 'json',
      dot: 'dot',
      mermaid: 'mmd',
      html: 'html'
    };
    return extensions[format] || 'txt';
  },
  
  generateGraphSummary(tasks, criticalPath, impactAnalysis) {
    const totalDependencies = tasks.reduce((sum, task) => sum + (task.dependencies?.length || 0), 0);
    const tasksWithDependencies = tasks.filter(task => task.dependencies && task.dependencies.length > 0).length;
    const orphanedTasks = tasks.filter(task => {
      const hasDependencies = task.dependencies && task.dependencies.length > 0;
      const hasDependent = tasks.some(t => t.dependencies && t.dependencies.includes(task.id));
      return !hasDependencies && !hasDependent;
    }).length;
    
    let summary = `# Dependency Graph Summary\\n\\n`;
    summary += `**Total Tasks:** ${tasks.length}\\n`;
    summary += `**Total Dependencies:** ${totalDependencies}\\n`;
    summary += `**Tasks with Dependencies:** ${tasksWithDependencies}\\n`;
    summary += `**Orphaned Tasks:** ${orphanedTasks}\\n`;
    summary += `**Critical Path Length:** ${criticalPath.length}\\n`;
    
    if (Object.keys(impactAnalysis).length > 0) {
      const highImpactTasks = Object.values(impactAnalysis).filter(a => a.isCritical).length;
      summary += `**High Impact Tasks:** ${highImpactTasks}\\n`;
    }
    
    // Find potential bottlenecks
    const bottlenecks = tasks.filter(task => {
      const dependentCount = tasks.filter(t => 
        t.dependencies && t.dependencies.includes(task.id)
      ).length;
      return dependentCount >= 3;
    });
    
    if (bottlenecks.length > 0) {
      summary += `**Potential Bottlenecks:** ${bottlenecks.length}\\n`;
    }
    
    summary += `\\n**Generated:** ${new Date().toLocaleString()}`;
    
    return summary;
  }
};