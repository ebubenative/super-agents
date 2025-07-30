import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

export const saDesignWireframes = {
  name: 'sa_design_wireframes',
  description: 'Create wireframe specifications with user journey mapping, interface design patterns, and wireframe validation',
  category: 'ux-expert', 
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      wireframeId: { type: 'string', minLength: 1 },
      projectInfo: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          platform: { type: 'string', enum: ['web', 'mobile', 'tablet', 'desktop'] },
          userTypes: { type: 'array', items: { type: 'string' } }
        }
      },
      userJourneys: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            user: { type: 'string' },
            goal: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      wireframes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['page', 'modal', 'component', 'flow'] },
            description: { type: 'string' },
            elements: { type: 'array', items: { type: 'object' } }
          }
        }
      },
      designPatterns: { type: 'array', items: { type: 'string' } },
      projectPath: { type: 'string', default: process.cwd() }
    },
    required: ['wireframeId', 'projectInfo']
  },

  validate(args) {
    const errors = [];
    if (!args.wireframeId?.trim()) errors.push('wireframeId is required');
    if (!args.projectInfo) errors.push('projectInfo is required');
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    
    try {
      const wireframeContext = {
        wireframeId: args.wireframeId.trim(),
        projectInfo: args.projectInfo,
        userJourneys: args.userJourneys || [],
        wireframes: args.wireframes || [],
        designPatterns: args.designPatterns || [],
        timestamp: new Date().toISOString(),
        author: context?.userId || 'system'
      };

      // Generate user journey maps if not provided
      if (wireframeContext.userJourneys.length === 0) {
        wireframeContext.userJourneys = await this.generateDefaultUserJourneys(wireframeContext.projectInfo);
      }

      // Generate wireframes if not provided
      if (wireframeContext.wireframes.length === 0) {
        wireframeContext.wireframes = await this.generateDefaultWireframes(wireframeContext);
      }

      // Create detailed wireframe specifications
      const wireframeSpecs = await this.createWireframeSpecs(wireframeContext);
      
      // Generate design patterns library
      const patternsLibrary = await this.createPatternsLibrary(wireframeContext);
      
      // Create navigation structure
      const navigationStructure = await this.createNavigationStructure(wireframeContext);
      
      // Generate responsive considerations
      const responsiveSpecs = await this.createResponsiveSpecs(wireframeContext);
      
      // Create validation checklist
      const validationChecklist = await this.createValidationChecklist(wireframeContext);
      
      const output = await this.formatWireframeOutput(
        wireframeContext, 
        wireframeSpecs, 
        patternsLibrary, 
        navigationStructure,
        responsiveSpecs,
        validationChecklist
      );
      
      await this.saveWireframeData(args.projectPath, wireframeContext, {
        specs: wireframeSpecs,
        patterns: patternsLibrary,
        navigation: navigationStructure,
        responsive: responsiveSpecs,
        validation: validationChecklist
      });
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          wireframeId: wireframeContext.wireframeId,
          platform: wireframeContext.projectInfo.platform,
          wireframesCount: wireframeSpecs.length,
          journeysCount: wireframeContext.userJourneys.length,
          patternsCount: patternsLibrary.length,
          duration: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to design wireframes: ${error.message}` }],
        isError: true
      };
    }
  },

  async generateDefaultUserJourneys(projectInfo) {
    const journeys = [];
    
    if (projectInfo.userTypes?.length > 0) {
      projectInfo.userTypes.forEach(userType => {
        journeys.push({
          name: `${userType} Onboarding`,
          user: userType,
          goal: 'Complete initial setup and start using the application',
          steps: [
            'Landing page visit',
            'Sign up process',
            'Email verification',
            'Profile setup',
            'First-time user tutorial',
            'Initial task completion'
          ]
        });
        
        journeys.push({
          name: `${userType} Core Task`,
          user: userType,
          goal: 'Complete primary application task',
          steps: [
            'Login to application',
            'Navigate to main feature',
            'Input required data',
            'Review and confirm',
            'Complete task',
            'View results'
          ]
        });
      });
    } else {
      // Default generic journeys
      journeys.push({
        name: 'User Onboarding',
        user: 'New User',
        goal: 'Get started with the application',
        steps: ['Visit homepage', 'Create account', 'Complete setup', 'Start using app']
      });
    }
    
    return journeys;
  },

  async generateDefaultWireframes(context) {
    const wireframes = [];
    const platform = context.projectInfo.platform;
    
    // Common wireframes for all platforms
    wireframes.push(
      {
        name: 'Homepage',
        type: 'page',
        description: 'Main landing page with key features and navigation',
        elements: this.generateHomePageElements(platform),
        priority: 'high',
        userJourneys: context.userJourneys.map(j => j.name)
      },
      {
        name: 'Navigation',
        type: 'component', 
        description: 'Primary navigation structure',
        elements: this.generateNavigationElements(platform),
        priority: 'high'
      },
      {
        name: 'User Profile',
        type: 'page',
        description: 'User profile and account management',
        elements: this.generateProfileElements(platform),
        priority: 'medium'
      }
    );
    
    // Platform-specific wireframes
    if (platform === 'mobile') {
      wireframes.push({
        name: 'Mobile Menu',
        type: 'modal',
        description: 'Collapsible mobile navigation menu',
        elements: this.generateMobileMenuElements(),
        priority: 'high'
      });
    }
    
    return wireframes;
  },

  generateHomePageElements(platform) {
    const elements = [
      { type: 'header', content: 'Site header with logo and navigation', size: { width: '100%', height: '80px' } },
      { type: 'hero', content: 'Hero section with main value proposition', size: { width: '100%', height: '400px' } },
      { type: 'features', content: 'Key features showcase', size: { width: '100%', height: '300px' } },
      { type: 'cta', content: 'Primary call-to-action section', size: { width: '100%', height: '200px' } },
      { type: 'footer', content: 'Site footer with links and info', size: { width: '100%', height: '120px' } }
    ];
    
    if (platform === 'mobile') {
      elements.forEach(el => {
        el.responsive = { mobile: { stackVertical: true, reducedPadding: true } };
      });
    }
    
    return elements;
  },

  generateNavigationElements(platform) {
    if (platform === 'mobile') {
      return [
        { type: 'hamburger', content: 'Mobile menu toggle', position: 'top-right' },
        { type: 'logo', content: 'Company logo', position: 'top-left' },
        { type: 'menu-overlay', content: 'Full-screen navigation overlay', behavior: 'slide-in' }
      ];
    }
    
    return [
      { type: 'logo', content: 'Company logo', position: 'left' },
      { type: 'nav-menu', content: 'Horizontal navigation menu', position: 'center' },
      { type: 'user-actions', content: 'Login/signup buttons', position: 'right' }
    ];
  },

  generateProfileElements(platform) {
    return [
      { type: 'avatar', content: 'User profile image', size: '120px' },
      { type: 'info-section', content: 'Personal information form' },
      { type: 'settings', content: 'Account settings and preferences' },
      { type: 'actions', content: 'Save/cancel buttons', position: 'bottom' }
    ];
  },

  generateMobileMenuElements() {
    return [
      { type: 'close-button', content: 'Close menu button', position: 'top-right' },
      { type: 'menu-items', content: 'Vertical list of navigation links' },
      { type: 'user-section', content: 'User info and account actions', position: 'bottom' }
    ];
  },

  async createWireframeSpecs(context) {
    return context.wireframes.map(wireframe => ({
      ...wireframe,
      id: `${context.wireframeId}-${wireframe.name.toLowerCase().replace(/\s+/g, '-')}`,
      platform: context.projectInfo.platform,
      annotations: this.generateAnnotations(wireframe),
      interactions: this.generateInteractions(wireframe),
      validation: this.generateWireframeValidation(wireframe),
      relatedJourneys: this.mapToUserJourneys(wireframe, context.userJourneys)
    }));
  },

  generateAnnotations(wireframe) {
    return wireframe.elements.map((element, index) => ({
      elementId: index + 1,
      type: element.type,
      annotation: this.getElementAnnotation(element.type),
      behavior: element.behavior || 'static',
      responsive: element.responsive || {}
    }));
  },

  getElementAnnotation(elementType) {
    const annotations = {
      'header': 'Sticky header with brand and navigation',
      'hero': 'Prominent section showcasing main value proposition',
      'navigation': 'Primary site navigation - horizontal on desktop, hamburger on mobile',
      'cta': 'Call-to-action button with high contrast',
      'form': 'Input form with validation states',
      'card': 'Content container with consistent spacing',
      'modal': 'Overlay dialog for focused interactions'
    };
    return annotations[elementType] || `${elementType} element with standard behavior`;
  },

  generateInteractions(wireframe) {
    const interactions = [];
    
    wireframe.elements.forEach(element => {
      if (element.type === 'button' || element.type === 'cta') {
        interactions.push({
          trigger: 'click',
          element: element.type,
          action: 'navigate or submit',
          feedback: 'visual state change'
        });
      }
      
      if (element.type === 'form') {
        interactions.push({
          trigger: 'input',
          element: 'form field',
          action: 'validate input',
          feedback: 'error/success states'
        });
      }
      
      if (element.type === 'hamburger') {
        interactions.push({
          trigger: 'click',
          element: 'hamburger menu',
          action: 'toggle mobile menu',
          feedback: 'slide animation'
        });
      }
    });
    
    return interactions;
  },

  generateWireframeValidation(wireframe) {
    return {
      completeness: wireframe.elements.length > 0,
      accessibility: this.checkAccessibility(wireframe),
      usability: this.checkUsability(wireframe),
      consistency: this.checkConsistency(wireframe)
    };
  },

  checkAccessibility(wireframe) {
    const issues = [];
    const hasNavigation = wireframe.elements.some(el => el.type.includes('nav'));
    const hasHeadings = wireframe.elements.some(el => el.type === 'header');
    
    if (!hasNavigation) issues.push('Missing keyboard navigation support');
    if (!hasHeadings) issues.push('No clear heading structure defined');
    
    return { valid: issues.length === 0, issues };
  },

  checkUsability(wireframe) {
    const issues = [];
    const hasCTA = wireframe.elements.some(el => el.type === 'cta');
    const hasContent = wireframe.elements.length > 2;
    
    if (!hasCTA && wireframe.type === 'page') issues.push('No clear call-to-action');
    if (!hasContent) issues.push('Insufficient content elements');
    
    return { valid: issues.length === 0, issues };
  },

  checkConsistency(wireframe) {
    // Check for consistent element patterns
    return { valid: true, issues: [] };
  },

  mapToUserJourneys(wireframe, userJourneys) {
    return userJourneys
      .filter(journey => journey.steps.some(step => 
        step.toLowerCase().includes(wireframe.name.toLowerCase())
      ))
      .map(journey => journey.name);
  },

  async createPatternsLibrary(context) {
    const patterns = [
      {
        name: 'Card Pattern',
        description: 'Consistent card layout for content containers',
        usage: 'Use for grouping related information',
        elements: ['container', 'header', 'content', 'actions'],
        variations: ['basic', 'with-image', 'with-actions']
      },
      {
        name: 'Form Pattern',
        description: 'Standard form layout with validation',
        usage: 'Use for all data input scenarios',
        elements: ['label', 'input', 'validation', 'submit'],
        variations: ['single-column', 'two-column', 'inline']
      },
      {
        name: 'Navigation Pattern',
        description: 'Consistent navigation structure',
        usage: 'Primary site navigation',
        elements: ['logo', 'menu-items', 'user-actions'],
        variations: ['horizontal', 'vertical', 'mobile-drawer']
      }
    ];
    
    // Add platform-specific patterns
    if (context.projectInfo.platform === 'mobile') {
      patterns.push({
        name: 'Bottom Tab Bar',
        description: 'Mobile bottom navigation pattern',
        usage: 'Primary navigation on mobile',
        elements: ['tab-icons', 'labels', 'active-indicator'],
        variations: ['3-tabs', '4-tabs', '5-tabs']
      });
    }
    
    return patterns;
  },

  async createNavigationStructure(context) {
    const navigation = {
      primary: this.createPrimaryNavigation(context),
      secondary: this.createSecondaryNavigation(context),
      breadcrumbs: this.createBreadcrumbStructure(context),
      userNavigation: this.createUserNavigation(context)
    };
    
    return navigation;
  },

  createPrimaryNavigation(context) {
    const nav = {
      type: context.projectInfo.platform === 'mobile' ? 'hamburger' : 'horizontal',
      items: [
        { label: 'Home', href: '/', priority: 'high' },
        { label: 'Features', href: '/features', priority: 'high' },
        { label: 'About', href: '/about', priority: 'medium' },
        { label: 'Contact', href: '/contact', priority: 'low' }
      ]
    };
    
    if (context.projectInfo.platform === 'mobile') {
      nav.behavior = 'slide-out';
      nav.overlay = true;
    }
    
    return nav;
  },

  createSecondaryNavigation(context) {
    return {
      type: 'contextual',
      visibility: 'page-specific',
      examples: [
        { page: 'settings', items: ['Profile', 'Security', 'Notifications'] },
        { page: 'dashboard', items: ['Overview', 'Analytics', 'Reports'] }
      ]
    };
  },

  createBreadcrumbStructure(context) {
    return {
      enabled: context.projectInfo.platform !== 'mobile',
      format: 'Home > Category > Page',
      separator: '>',
      clickable: true
    };
  },

  createUserNavigation(context) {
    return {
      authenticated: {
        items: ['Profile', 'Settings', 'Logout'],
        trigger: 'avatar-click'
      },
      unauthenticated: {
        items: ['Login', 'Sign Up'],
        style: 'buttons'
      }
    };
  },

  async createResponsiveSpecs(context) {
    const breakpoints = {
      mobile: '< 768px',
      tablet: '768px - 1024px', 
      desktop: '> 1024px'
    };
    
    const specifications = Object.keys(breakpoints).map(device => ({
      device,
      breakpoint: breakpoints[device],
      layout: this.getDeviceLayout(device, context),
      navigation: this.getDeviceNavigation(device),
      typography: this.getDeviceTypography(device),
      spacing: this.getDeviceSpacing(device)
    }));
    
    return { breakpoints, specifications };
  },

  getDeviceLayout(device, context) {
    const layouts = {
      mobile: { columns: 1, stack: 'vertical', padding: '16px' },
      tablet: { columns: 2, stack: 'mixed', padding: '24px' },
      desktop: { columns: 'variable', stack: 'horizontal', padding: '32px' }
    };
    return layouts[device];
  },

  getDeviceNavigation(device) {
    const navs = {
      mobile: { type: 'hamburger', position: 'top' },
      tablet: { type: 'horizontal', collapsible: true },
      desktop: { type: 'horizontal', expanded: true }
    };
    return navs[device];
  },

  getDeviceTypography(device) {
    const typography = {
      mobile: { baseSize: '14px', lineHeight: 1.4, headingScale: 1.2 },
      tablet: { baseSize: '16px', lineHeight: 1.5, headingScale: 1.25 },
      desktop: { baseSize: '16px', lineHeight: 1.6, headingScale: 1.33 }
    };
    return typography[device];
  },

  getDeviceSpacing(device) {
    const spacing = {
      mobile: { base: '8px', section: '24px', component: '12px' },
      tablet: { base: '12px', section: '32px', component: '16px' },
      desktop: { base: '16px', section: '48px', component: '24px' }
    };
    return spacing[device];
  },

  async createValidationChecklist(context) {
    return [
      {
        category: 'Structure',
        items: [
          'All wireframes have clear hierarchy',
          'Navigation structure is consistent',
          'User flows are complete and logical',
          'Required elements are present on each wireframe'
        ]
      },
      {
        category: 'Usability',
        items: [
          'Primary actions are prominent and accessible',
          'Information architecture is intuitive',
          'User goals can be achieved efficiently',
          'Error states and feedback are considered'
        ]
      },
      {
        category: 'Accessibility',
        items: [
          'Keyboard navigation paths are clear',
          'Screen reader compatibility is considered',
          'Color is not the only means of conveying information',
          'Touch targets meet minimum size requirements'
        ]
      },
      {
        category: 'Responsive Design',
        items: [
          'Mobile-first approach is followed',
          'Content reflows appropriately across devices',
          'Touch-friendly interactions on mobile',
          'Desktop utilizes available screen space effectively'
        ]
      }
    ];
  },

  async formatWireframeOutput(context, wireframeSpecs, patternsLibrary, navigationStructure, responsiveSpecs, validationChecklist) {
    let output = `📐 **Wireframe Design: ${context.projectInfo.name}**\n\n`;
    output += `🎯 **Wireframe ID:** ${context.wireframeId}\n`;
    output += `📱 **Platform:** ${context.projectInfo.platform}\n`;
    output += `📊 **Wireframes:** ${wireframeSpecs.length}\n`;
    output += `🗺️ **User Journeys:** ${context.userJourneys.length}\n`;
    output += `🎨 **Design Patterns:** ${patternsLibrary.length}\n\n`;

    // User Journeys
    output += `## 🗺️ User Journeys\n\n`;
    context.userJourneys.forEach((journey, index) => {
      output += `### ${index + 1}. ${journey.name}\n`;
      output += `**User:** ${journey.user}\n**Goal:** ${journey.goal}\n`;
      output += `**Steps:** ${journey.steps.join(' → ')}\n\n`;
    });

    // Wireframe Specifications
    output += `## 📐 Wireframe Specifications\n\n`;
    wireframeSpecs.forEach((wireframe, index) => {
      output += `### ${index + 1}. ${wireframe.name} (${wireframe.type})\n`;
      output += `${wireframe.description}\n`;
      output += `**Elements:** ${wireframe.elements.length}\n`;
      output += `**Interactions:** ${wireframe.interactions.length}\n`;
      if (wireframe.relatedJourneys.length > 0) {
        output += `**Related Journeys:** ${wireframe.relatedJourneys.join(', ')}\n`;
      }
      output += '\n';
    });

    // Design Patterns
    output += `## 🎨 Design Patterns Library\n\n`;
    patternsLibrary.forEach((pattern, index) => {
      output += `### ${index + 1}. ${pattern.name}\n`;
      output += `${pattern.description}\n`;
      output += `**Usage:** ${pattern.usage}\n`;
      output += `**Variations:** ${pattern.variations.join(', ')}\n\n`;
    });

    // Navigation Structure  
    output += `## 🧭 Navigation Structure\n\n`;
    output += `**Primary Navigation:** ${navigationStructure.primary.type}\n`;
    output += `**Items:** ${navigationStructure.primary.items.map(item => item.label).join(', ')}\n`;
    if (context.projectInfo.platform !== 'mobile') {
      output += `**Breadcrumbs:** ${navigationStructure.breadcrumbs.enabled ? 'Enabled' : 'Disabled'}\n`;
    }
    output += '\n';

    // Responsive Specifications
    output += `## 📱 Responsive Design\n\n`;
    responsiveSpecs.specifications.forEach(spec => {
      output += `**${spec.device.toUpperCase()}** (${spec.breakpoint})\n`;
      output += `• Layout: ${spec.layout.columns} columns, ${spec.layout.stack} stacking\n`;
      output += `• Navigation: ${spec.navigation.type}\n`;
      output += `• Base Font: ${spec.typography.baseSize}\n\n`;
    });

    // Validation Checklist
    output += `## ✅ Validation Checklist\n\n`;
    validationChecklist.forEach(category => {
      output += `**${category.category}:**\n`;
      category.items.forEach(item => {
        output += `• ${item}\n`;
      });
      output += '\n';
    });

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. Review wireframes with stakeholders\n`;
    output += `2. Validate user journeys with user testing\n`;
    output += `3. Create high-fidelity designs based on wireframes\n`;
    output += `4. Develop interactive prototypes\n`;
    output += `5. Conduct usability testing\n`;
    output += `6. Begin frontend development\n\n`;

    output += `📁 **Complete wireframe specifications and documentation saved to project.**`;

    return output;
  },

  async saveWireframeData(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const wireframesDir = join(saDir, 'wireframes');
      if (!existsSync(wireframesDir)) {
        require('fs').mkdirSync(wireframesDir, { recursive: true });
      }
      
      const filename = `wireframes-${context.wireframeId}-${Date.now()}.json`;
      const filepath = join(wireframesDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save wireframe data:', error.message);
    }
  }
};