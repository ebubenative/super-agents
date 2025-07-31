import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import { table, getBorderCharacters } from 'table';
import figlet from 'figlet';
import gradient from 'gradient-string';

export async function planCommand(options) {
  console.log(chalk.blue('📊 Interactive Planning Session\n'));
  
  try {
    // Show animated banner
    console.log(gradient(['cyan', 'blue']).multiline(
      figlet.textSync('PLAN', { horizontalLayout: 'full', font: 'Small' })
    ));
    console.log(chalk.gray('AI-Powered Project Planning\n'));
    
    // Agent selection
    let selectedAgent = options.agent || 'analyst';
    
    if (!options.agent) {
      const agentChoices = [
        { name: '🔍 Analyst - Market research and requirements gathering', value: 'analyst' },
        { name: '📋 Product Manager - PRD and feature planning', value: 'pm' },
        { name: '🏗️  Architect - System design and technical planning', value: 'architect' },
        { name: '👤 UX Expert - User experience planning', value: 'ux-expert' },
        { name: '🏃 Scrum Master - Sprint and workflow planning', value: 'scrum-master' }
      ];

      const agentAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'agent',
          message: 'Which agent should lead the planning session?',
          choices: agentChoices
        }
      ]);
      selectedAgent = agentAnswer.agent;
    }

    console.log(chalk.cyan(`\nLead Agent: ${selectedAgent.toUpperCase()}\n`));

    // Interactive or guided planning
    const planningMode = options.interactive ? 'interactive' : await selectPlanningMode();
    
    // Start planning session
    await startPlanningSession(selectedAgent, planningMode);
    
  } catch (error) {
    console.error(chalk.red('✗'), 'Planning session failed:', error.message);
    process.exit(1);
  }
}

async function selectPlanningMode() {
  const modeAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Select planning mode:',
      choices: [
        { name: '🎯 Quick Planning - Fast requirements and task breakdown', value: 'quick' },
        { name: '🔬 Deep Planning - Comprehensive analysis and detailed planning', value: 'deep' },
        { name: '💬 Interactive Planning - Guided conversation with AI agents', value: 'interactive' },
        { name: '📋 Template-Based - Use predefined planning templates', value: 'template' }
      ]
    }
  ]);
  
  return modeAnswer.mode;
}

async function startPlanningSession(agent, mode) {
  const spinner = ora('Initializing planning session...').start();
  
  try {
    // Simulate agent initialization
    await new Promise(resolve => setTimeout(resolve, 1500));
    spinner.succeed(`${agent.toUpperCase()} agent initialized`);
    
    // Project context gathering
    const projectContext = await gatherProjectContext();
    
    // Planning execution based on mode
    let planningResults;
    switch (mode) {
      case 'quick':
        planningResults = await executeQuickPlanning(agent, projectContext);
        break;
      case 'deep':
        planningResults = await executeDeepPlanning(agent, projectContext);
        break;
      case 'interactive':
        planningResults = await executeInteractivePlanning(agent, projectContext);
        break;
      case 'template':
        planningResults = await executeTemplatePlanning(agent, projectContext);
        break;
      default:
        throw new Error(`Unknown planning mode: ${mode}`);
    }
    
    // Display results
    await displayPlanningResults(planningResults);
    
    // Generate outputs
    await generatePlanningOutputs(planningResults);
    
  } catch (error) {
    spinner.fail('Planning session failed');
    throw error;
  }
}

async function gatherProjectContext() {
  console.log(chalk.blue('\n📋 Project Context Gathering\n'));
  
  const questions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      default: 'My Super Agents Project'
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'What type of project is this?',
      choices: [
        'Web Application',
        'Mobile App',
        'Desktop Application',
        'API/Backend Service',
        'Library/Framework',
        'Data Science/ML Project',
        'DevOps/Infrastructure',
        'Other'
      ]
    },
    {
      type: 'list',
      name: 'projectStage',
      message: 'What stage is your project in?',
      choices: [
        'Concept/Idea Phase',
        'Requirements Gathering',
        'Design Phase',
        'Development',
        'Testing',
        'Deployment',
        'Maintenance/Enhancement'
      ]
    },
    {
      type: 'checkbox',
      name: 'stakeholders',
      message: 'Who are the key stakeholders? (Select all that apply)',
      choices: [
        'End Users/Customers',
        'Business Stakeholders',
        'Development Team',
        'QA Team',
        'DevOps Team',
        'Management',
        'External Partners',
        'Regulatory Bodies'
      ]
    },
    {
      type: 'input',
      name: 'timeline',
      message: 'What is your target timeline?',
      default: '3 months'
    },
    {
      type: 'input',
      name: 'budget',
      message: 'What is your approximate budget range?',
      default: 'Not specified'
    },
    {
      type: 'editor',
      name: 'description',
      message: 'Provide a brief description of your project goals and requirements:'
    }
  ];

  const answers = await inquirer.prompt(questions);
  
  return {
    ...answers,
    timestamp: new Date().toISOString(),
    workingDirectory: process.cwd()
  };
}

async function executeQuickPlanning(agent, context) {
  console.log(chalk.blue('\n⚡ Quick Planning Mode\n'));
  
  const phases = [
    { name: 'Requirements Analysis', duration: 2000 },
    { name: 'High-Level Architecture', duration: 1500 },
    { name: 'Task Breakdown', duration: 2500 },
    { name: 'Risk Assessment', duration: 1000 },
    { name: 'Timeline Estimation', duration: 1500 }
  ];
  
  const results = {
    agent,
    mode: 'quick',
    context,
    phases: [],
    recommendations: [],
    tasks: [],
    risks: [],
    timeline: {}
  };
  
  for (const phase of phases) {
    const spinner = ora(`${agent.toUpperCase()} executing: ${phase.name}...`).start();
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, phase.duration));
    
    const phaseResult = await generatePhaseResult(phase.name, context, agent);
    results.phases.push({
      name: phase.name,
      result: phaseResult,
      completed: true
    });
    
    spinner.succeed(`${phase.name} completed`);
  }
  
  // Generate consolidated recommendations
  results.recommendations = generateRecommendations(context, agent, 'quick');
  results.tasks = generateTaskBreakdown(context, 'quick');
  results.risks = generateRiskAssessment(context, 'quick');
  results.timeline = generateTimeline(context, 'quick');
  
  return results;
}

async function executeDeepPlanning(agent, context) {
  console.log(chalk.blue('\n🔬 Deep Planning Mode\n'));
  
  const phases = [
    { name: 'Market Research', duration: 3000 },
    { name: 'User Research', duration: 2500 },
    { name: 'Competitive Analysis', duration: 2000 },
    { name: 'Technical Feasibility', duration: 3500 },
    { name: 'Resource Planning', duration: 2000 },
    { name: 'Risk Analysis', duration: 2500 },
    { name: 'Success Metrics', duration: 1500 },
    { name: 'Implementation Strategy', duration: 3000 }
  ];
  
  const results = {
    agent,
    mode: 'deep',
    context,
    phases: [],
    recommendations: [],
    tasks: [],
    risks: [],
    timeline: {},
    insights: []
  };
  
  for (const phase of phases) {
    const spinner = ora(`${agent.toUpperCase()} executing: ${phase.name}...`).start();
    
    await new Promise(resolve => setTimeout(resolve, phase.duration));
    
    const phaseResult = await generatePhaseResult(phase.name, context, agent);
    results.phases.push({
      name: phase.name,
      result: phaseResult,
      completed: true
    });
    
    spinner.succeed(`${phase.name} completed`);
  }
  
  results.recommendations = generateRecommendations(context, agent, 'deep');
  results.tasks = generateTaskBreakdown(context, 'deep');
  results.risks = generateRiskAssessment(context, 'deep');
  results.timeline = generateTimeline(context, 'deep');
  results.insights = generateInsights(context, agent);
  
  return results;
}

async function executeInteractivePlanning(agent, context) {
  console.log(chalk.blue('\n💬 Interactive Planning Mode\n'));
  
  const results = {
    agent,
    mode: 'interactive',
    context,
    conversation: [],
    recommendations: [],
    tasks: [],
    decisions: []
  };
  
  // Simulate interactive conversation
  const conversationTopics = [
    'Project Goals Clarification',
    'User Needs Assessment', 
    'Technical Constraints Discussion',
    'Resource Allocation Planning',
    'Success Criteria Definition'
  ];
  
  for (const topic of conversationTopics) {
    console.log(chalk.yellow(`\n🤖 ${agent.toUpperCase()}: Let's discuss ${topic}\n`));
    
    const response = await inquirer.prompt([
      {
        type: 'editor',
        name: 'userInput',
        message: `Please share your thoughts on ${topic}:`
      }
    ]);
    
    // Simulate AI processing
    const spinner = ora(`${agent.toUpperCase()} analyzing your input...`).start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiResponse = generateAIResponse(topic, response.userInput, context, agent);
    spinner.succeed('Analysis complete');
    
    console.log(chalk.cyan(`\n🤖 ${agent.toUpperCase()}:`));
    console.log(chalk.white(aiResponse));
    
    results.conversation.push({
      topic,
      userInput: response.userInput,
      aiResponse,
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate final recommendations
  results.recommendations = generateRecommendations(context, agent, 'interactive');
  results.tasks = generateTaskBreakdown(context, 'interactive');
  
  return results;
}

async function executeTemplatePlanning(agent, context) {
  console.log(chalk.blue('\n📋 Template-Based Planning\n'));
  
  // Select template
  const templateAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select a planning template:',
      choices: [
        'Agile Software Development',
        'Startup MVP Planning',
        'Enterprise System Migration', 
        'Data Science Project',
        'API Development',
        'Mobile App Launch',
        'Website Redesign'
      ]
    }
  ]);
  
  const results = {
    agent,
    mode: 'template',
    context,
    template: templateAnswer.template,
    sections: [],
    recommendations: [],
    tasks: []
  };
  
  // Apply template
  const templateSections = getTemplateStructure(templateAnswer.template);
  
  for (const section of templateSections) {
    const spinner = ora(`Processing template section: ${section.name}...`).start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const sectionResult = applyTemplateSection(section, context, agent);
    results.sections.push({
      ...section,
      result: sectionResult
    });
    
    spinner.succeed(`${section.name} completed`);
  }
  
  results.recommendations = generateRecommendations(context, agent, 'template');
  results.tasks = generateTaskBreakdown(context, 'template');
  
  return results;
}

async function generatePhaseResult(phaseName, context, agent) {
  // Simulate AI-generated results for each phase
  const results = {
    'Requirements Analysis': `Based on the project "${context.projectName}", identified key requirements: user authentication, data processing, API integration, and responsive UI. Critical success factors include scalability and security.`,
    
    'High-Level Architecture': `Recommended microservices architecture with React frontend, Node.js backend, and PostgreSQL database. Containerization with Docker and deployment on cloud infrastructure.`,
    
    'Task Breakdown': `Project divided into 15 major tasks across 4 sprints. Each task estimated with story points and assigned to appropriate team members based on skill requirements.`,
    
    'Risk Assessment': `Identified 8 potential risks including technical debt, third-party API changes, and resource constraints. Mitigation strategies proposed for each risk category.`,
    
    'Timeline Estimation': `Project estimated at ${context.timeline} with buffer time included. Critical path identified with key milestones and dependencies mapped.`,
    
    'Market Research': `Market analysis shows growing demand in this space with 3 main competitors. Opportunity for differentiation through innovative UX and advanced features.`,
    
    'Technical Feasibility': `All proposed technologies are mature and well-supported. No major technical blockers identified. Proof of concept recommended for complex integrations.`
  };
  
  return results[phaseName] || `${phaseName} completed successfully with actionable insights and recommendations.`;
}

function generateRecommendations(context, agent, mode) {
  const baseRecommendations = [
    'Start with MVP approach to validate core assumptions',
    'Implement CI/CD pipeline from the beginning',
    'Regular stakeholder reviews every 2 weeks',
    'Automated testing strategy for quality assurance'
  ];
  
  const agentSpecificRecommendations = {
    analyst: [
      'Conduct user interviews to validate requirements',
      'Perform competitive analysis quarterly',
      'Track key metrics from day one'
    ],
    pm: [
      'Use agile methodology with 2-week sprints',
      'Maintain detailed product roadmap',
      'Establish clear acceptance criteria'
    ],
    architect: [
      'Design for scalability from the start',
      'Document architectural decisions',
      'Plan for security and compliance'
    ]
  };
  
  return [
    ...baseRecommendations,
    ...(agentSpecificRecommendations[agent] || [])
  ];
}

function generateTaskBreakdown(context, mode) {
  const baseTasks = [
    { id: 'T001', title: 'Project Setup', priority: 'High', effort: '3 days' },
    { id: 'T002', title: 'Requirements Documentation', priority: 'High', effort: '5 days' },
    { id: 'T003', title: 'Architecture Design', priority: 'High', effort: '7 days' },
    { id: 'T004', title: 'Development Environment', priority: 'Medium', effort: '2 days' },
    { id: 'T005', title: 'Core Feature Implementation', priority: 'High', effort: '15 days' }
  ];
  
  if (mode === 'deep') {
    baseTasks.push(
      { id: 'T006', title: 'User Research', priority: 'High', effort: '4 days' },
      { id: 'T007', title: 'Performance Testing', priority: 'Medium', effort: '3 days' },
      { id: 'T008', title: 'Security Audit', priority: 'High', effort: '2 days' }
    );
  }
  
  return baseTasks;
}

function generateRiskAssessment(context, mode) {
  return [
    { risk: 'Technical complexity', probability: 'Medium', impact: 'High', mitigation: 'Proof of concept development' },
    { risk: 'Resource constraints', probability: 'High', impact: 'Medium', mitigation: 'Flexible resource allocation' },
    { risk: 'Scope creep', probability: 'Medium', impact: 'Medium', mitigation: 'Clear change management process' },
    { risk: 'Third-party dependencies', probability: 'Low', impact: 'High', mitigation: 'Alternative vendor evaluation' }
  ];
}

function generateTimeline(context, mode) {
  return {
    totalDuration: context.timeline,
    phases: [
      { name: 'Planning', duration: '2 weeks', startDate: 'Week 1' },
      { name: 'Development', duration: '8 weeks', startDate: 'Week 3' },
      { name: 'Testing', duration: '2 weeks', startDate: 'Week 11' },
      { name: 'Deployment', duration: '1 week', startDate: 'Week 13' }
    ],
    milestones: [
      { name: 'Requirements Approved', date: 'End of Week 2' },
      { name: 'MVP Ready', date: 'End of Week 6' },
      { name: 'Beta Release', date: 'End of Week 10' },
      { name: 'Production Launch', date: 'End of Week 13' }
    ]
  };
}

function generateInsights(context, agent) {
  return [
    'User-centered design approach will be critical for success',
    'Early validation of core assumptions recommended',
    'Consider progressive web app for broader reach',
    'Automation opportunities identified in testing and deployment'
  ];
}

function generateAIResponse(topic, userInput, context, agent) {
  const responses = {
    'Project Goals Clarification': `Thank you for clarifying your goals. I see that ${context.projectName} aims to ${userInput.substring(0, 100)}... This aligns well with current market trends. I recommend focusing on the core value proposition first.`,
    
    'User Needs Assessment': `Your insights about user needs are valuable. Based on what you've shared, I suggest we prioritize features that address the pain points you've identified. Let's create user personas to guide our development.`,
    
    'Technical Constraints Discussion': `Understanding your technical constraints helps shape our approach. Given the limitations you've mentioned, I recommend a phased implementation strategy that works within these boundaries while planning for future scalability.`,
    
    'Resource Allocation Planning': `Resource planning is crucial for project success. Based on your team composition and availability, I suggest an agile approach with cross-functional collaboration to maximize efficiency.`,
    
    'Success Criteria Definition': `Clear success criteria will guide our development and help measure progress. The metrics you've outlined are solid - I recommend adding user satisfaction and technical performance indicators as well.`
  };
  
  return responses[topic] || `That's a great point about ${topic}. Your perspective will help shape our planning approach.`;
}

function getTemplateStructure(templateName) {
  const templates = {
    'Agile Software Development': [
      { name: 'Product Backlog', description: 'Define user stories and requirements' },
      { name: 'Sprint Planning', description: 'Plan development sprints' },
      { name: 'Technical Architecture', description: 'Design system architecture' },
      { name: 'Testing Strategy', description: 'Plan quality assurance approach' }
    ],
    'Startup MVP Planning': [
      { name: 'Market Validation', description: 'Validate product-market fit' },
      { name: 'Core Features', description: 'Define minimum viable features' },
      { name: 'Go-to-Market', description: 'Plan launch strategy' },
      { name: 'Success Metrics', description: 'Define key performance indicators' }
    ]
  };
  
  return templates[templateName] || templates['Agile Software Development'];
}

function applyTemplateSection(section, context, agent) {
  return `${section.description} for ${context.projectName}. This section addresses the specific needs of a ${context.projectType} project in the ${context.projectStage} stage.`;
}

async function displayPlanningResults(results) {
  console.log('\n' + boxen(
    `🎉 Planning Session Complete!\n\n` +
    `Agent: ${results.agent.toUpperCase()}\n` +
    `Mode: ${results.mode.toUpperCase()}\n` +
    `Project: ${results.context.projectName}\n` +
    `Type: ${results.context.projectType}`,
    {
      title: 'Planning Results',
      titleAlignment: 'center',
      padding: 1,
      borderStyle: 'round',
      borderColor: 'green'
    }
  ));
  
  // Recommendations table
  if (results.recommendations && results.recommendations.length > 0) {
    console.log(chalk.blue('\n📋 Key Recommendations:'));
    results.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  // Tasks table
  if (results.tasks && results.tasks.length > 0) {
    console.log(chalk.blue('\n📋 Task Breakdown:'));
    const taskData = [
      ['ID', 'Title', 'Priority', 'Effort']
    ];
    
    results.tasks.forEach(task => {
      taskData.push([task.id, task.title, task.priority, task.effort]);
    });
    
    const taskTable = table(taskData, {
      border: getBorderCharacters('ramac')
    });
    
    console.log(taskTable);
  }
  
  // Timeline
  if (results.timeline && results.timeline.phases) {
    console.log(chalk.blue('\n📅 Project Timeline:'));
    const timelineData = [
      ['Phase', 'Duration', 'Start']
    ];
    
    results.timeline.phases.forEach(phase => {
      timelineData.push([phase.name, phase.duration, phase.startDate]);
    });
    
    const timelineTable = table(timelineData, {
      border: getBorderCharacters('ramac')
    });
    
    console.log(timelineTable);
  }
}

async function generatePlanningOutputs(results) {
  console.log(chalk.blue('\n📝 Generating Planning Outputs...\n'));
  
  // Generate markdown report
  const reportContent = `# ${results.context.projectName} - Planning Report

## Project Overview
- **Type**: ${results.context.projectType}
- **Stage**: ${results.context.projectStage}
- **Timeline**: ${results.context.timeline}
- **Agent**: ${results.agent.toUpperCase()}
- **Planning Mode**: ${results.mode.toUpperCase()}

## Key Recommendations
${results.recommendations.map(rec => `- ${rec}`).join('\n')}

## Task Breakdown
${results.tasks.map(task => `- **${task.id}**: ${task.title} (${task.priority} priority, ${task.effort})`).join('\n')}

## Timeline
${results.timeline && results.timeline.phases ? 
  results.timeline.phases.map(phase => `- **${phase.name}**: ${phase.duration} (${phase.startDate})`).join('\n') : 
  'Timeline details available in planning session notes'
}

## Next Steps
1. Review and approve this planning document
2. Set up project infrastructure and tools
3. Begin development according to the proposed timeline
4. Schedule regular check-ins with stakeholders

---
Generated on ${new Date().toLocaleString()} by Super Agents Planning System
`;
  
  // Save report
  const reportPath = `./planning-report-${Date.now()}.md`;
  const fs = await import('fs/promises');
  await fs.writeFile(reportPath, reportContent);
  
  console.log(chalk.green(`✓ Planning report saved to ${reportPath}`));
  console.log(chalk.cyan('✓ Planning session completed successfully!'));
  console.log(chalk.gray('\n💡 Next: Run "sa workflow start" to begin development workflow'));
}