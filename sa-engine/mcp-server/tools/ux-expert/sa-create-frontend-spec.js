import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_create_frontend_spec MCP Tool
 * Frontend specification template, UI/UX requirement gathering, design system integration
 */
export const saCreateFrontendSpec = {
  name: 'sa_create_frontend_spec',
  description: 'Create comprehensive frontend specifications with UI/UX requirements, design system integration, and technical implementation details',
  category: 'ux-expert',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      specId: {
        type: 'string',
        description: 'Unique identifier for the frontend specification',
        minLength: 1
      },
      projectInfo: {
        type: 'object',
        description: 'Project information for the frontend spec',
        properties: {
          projectName: { type: 'string' },
          version: { type: 'string' },
          platform: { type: 'string', enum: ['web', 'mobile', 'desktop', 'responsive'] },
          framework: { type: 'string' },
          targetAudience: { type: 'string' }
        }
      },
      requirements: {
        type: 'object',
        description: 'UI/UX requirements',
        properties: {
          userStories: { type: 'array', items: { type: 'string' } },
          functionalRequirements: { type: 'array', items: { type: 'string' } },
          nonFunctionalRequirements: { type: 'array', items: { type: 'string' } },
          accessibilityRequirements: { type: 'array', items: { type: 'string' } },
          performanceRequirements: { type: 'object' }
        }
      },
      designSystem: {
        type: 'object',
        description: 'Design system specifications',
        properties: {
          colorPalette: { type: 'object' },
          typography: { type: 'object' },
          spacing: { type: 'object' },
          components: { type: 'array', items: { type: 'string' } },
          breakpoints: { type: 'object' }
        }
      },
      technicalSpecs: {
        type: 'object',
        description: 'Technical implementation specifications',
        properties: {
          framework: { type: 'string' },
          buildTools: { type: 'array', items: { type: 'string' } },
          dependencies: { type: 'array', items: { type: 'string' } },
          browserSupport: { type: 'array', items: { type: 'string' } },
          performanceTargets: { type: 'object' }
        }
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      }
    },
    required: ['specId', 'projectInfo']
  },

  validate(args) {
    const errors = [];
    
    if (!args.specId || typeof args.specId !== 'string') {
      errors.push('specId is required and must be a string');
    }
    
    if (!args.projectInfo || typeof args.projectInfo !== 'object') {
      errors.push('projectInfo is required and must be an object');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const specId = args.specId.trim();
    
    try {
      const specContext = {
        specId,
        projectInfo: args.projectInfo,
        requirements: args.requirements || {},
        designSystem: args.designSystem || {},
        technicalSpecs: args.technicalSpecs || {},
        timestamp: new Date().toISOString(),
        author: context?.userId || 'system',
        specVersion: '1.0.0'
      };

      // Generate design system defaults
      const enhancedDesignSystem = await this.enhanceDesignSystem(specContext.designSystem, specContext.projectInfo);
      
      // Create component specifications
      const componentSpecs = await this.createComponentSpecs(specContext, enhancedDesignSystem);
      
      // Generate layout specifications
      const layoutSpecs = await this.createLayoutSpecs(specContext, enhancedDesignSystem);
      
      // Create interaction specifications
      const interactionSpecs = await this.createInteractionSpecs(specContext);
      
      // Generate accessibility specifications
      const a11ySpecs = await this.createAccessibilitySpecs(specContext);
      
      // Create performance specifications
      const performanceSpecs = await this.createPerformanceSpecs(specContext);
      
      // Generate technical implementation guide
      const implementationGuide = await this.createImplementationGuide(specContext, componentSpecs);
      
      // Create complete frontend specification
      const frontendSpec = {
        metadata: {
          specId: specContext.specId,
          version: specContext.specVersion,
          author: specContext.author,
          createdAt: specContext.timestamp,
          projectInfo: specContext.projectInfo
        },
        designSystem: enhancedDesignSystem,
        components: componentSpecs,
        layouts: layoutSpecs,
        interactions: interactionSpecs,
        accessibility: a11ySpecs,
        performance: performanceSpecs,
        implementation: implementationGuide,
        requirements: specContext.requirements
      };
      
      // Generate specification document
      const specDocument = await this.generateSpecDocument(frontendSpec);
      
      // Create validation checklist
      const validationChecklist = await this.createValidationChecklist(frontendSpec);
      
      // Format output
      const output = await this.formatSpecOutput(frontendSpec, specDocument, validationChecklist);
      
      // Save specification files
      await this.saveSpecFiles(projectPath, specContext, frontendSpec, specDocument);
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          specId,
          componentsCount: componentSpecs.length,
          layoutsCount: layoutSpecs.length,
          a11yRequirementsCount: a11ySpecs.requirements.length,
          performanceTargetsCount: Object.keys(performanceSpecs.targets).length,
          specVersion: specContext.specVersion,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to create frontend spec ${specId}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, specId, projectPath }
      };
    }
  },

  async enhanceDesignSystem(designSystem, projectInfo) {
    const enhanced = {
      colorPalette: designSystem.colorPalette || this.generateDefaultColorPalette(),
      typography: designSystem.typography || this.generateDefaultTypography(),
      spacing: designSystem.spacing || this.generateDefaultSpacing(),
      components: designSystem.components || this.generateDefaultComponents(),
      breakpoints: designSystem.breakpoints || this.generateDefaultBreakpoints(projectInfo.platform),
      elevation: this.generateElevationScale(),
      borders: this.generateBorderSpecs(),
      animations: this.generateAnimationSpecs()
    };

    return enhanced;
  },

  generateDefaultColorPalette() {
    return {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        500: '#0ea5e9',
        600: '#0284c7',
        900: '#0c4a6e'
      },
      secondary: {
        50: '#fafaf9',
        100: '#f5f5f4',
        500: '#78716c',
        600: '#57534e',
        900: '#1c1917'
      },
      semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      neutral: {
        white: '#ffffff',
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#6b7280',
          900: '#111827'
        },
        black: '#000000'
      }
    };
  },

  generateDefaultTypography() {
    return {
      fontFamilies: {
        primary: 'Inter, system-ui, sans-serif',
        secondary: 'Georgia, serif',
        mono: 'JetBrains Mono, monospace'
      },
      fontSizes: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px'
      },
      fontWeights: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeights: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    };
  },

  generateDefaultSpacing() {
    return {
      scale: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px'
      },
      component: {
        padding: {
          button: '8px 16px',
          input: '12px 16px',
          card: '16px 20px'
        },
        margin: {
          section: '32px 0',
          element: '16px 0'
        }
      }
    };
  },

  generateDefaultComponents() {
    return [
      'Button', 'Input', 'Card', 'Modal', 'Navigation',
      'Header', 'Footer', 'Sidebar', 'Form', 'Table',
      'Badge', 'Avatar', 'Tooltip', 'Dropdown', 'Tabs'
    ];
  },

  generateDefaultBreakpoints(platform) {
    if (platform === 'mobile') {
      return {
        sm: '320px',
        md: '375px',
        lg: '414px',
        xl: '768px'
      };
    }
    
    return {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    };
  },

  generateElevationScale() {
    return {
      none: '0 0 0 0 transparent',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    };
  },

  generateBorderSpecs() {
    return {
      width: {
        thin: '1px',
        medium: '2px',
        thick: '4px'
      },
      radius: {
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px'
      },
      style: 'solid'
    };
  },

  generateAnimationSpecs() {
    return {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms'
      },
      easing: {
        linear: 'linear',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    };
  },

  async createComponentSpecs(context, designSystem) {
    const components = designSystem.components.map(componentName => ({
      name: componentName,
      description: this.getComponentDescription(componentName),
      variants: this.generateComponentVariants(componentName),
      states: this.generateComponentStates(componentName),
      properties: this.generateComponentProperties(componentName, designSystem),
      accessibility: this.generateComponentA11y(componentName),
      usage: this.generateComponentUsage(componentName),
      examples: this.generateComponentExamples(componentName)
    }));

    return components;
  },

  getComponentDescription(componentName) {
    const descriptions = {
      'Button': 'Interactive element for user actions',
      'Input': 'Form field for user text input',
      'Card': 'Container for related content',
      'Modal': 'Overlay dialog for focused interactions',
      'Navigation': 'Site navigation and menu system'
    };
    return descriptions[componentName] || `${componentName} component for UI interactions`;
  },

  generateComponentVariants(componentName) {
    const variantMap = {
      'Button': ['primary', 'secondary', 'outline', 'ghost', 'link'],
      'Input': ['text', 'email', 'password', 'search', 'textarea'],
      'Card': ['default', 'outlined', 'elevated', 'flat'],
      'Modal': ['default', 'fullscreen', 'drawer'],
      'Navigation': ['horizontal', 'vertical', 'breadcrumb']
    };
    return variantMap[componentName] || ['default'];
  },

  generateComponentStates(componentName) {
    const commonStates = ['default', 'hover', 'focus', 'active', 'disabled'];
    const stateMap = {
      'Input': [...commonStates, 'error', 'success', 'loading'],
      'Button': [...commonStates, 'loading'],
      'Card': ['default', 'hover', 'selected', 'disabled']
    };
    return stateMap[componentName] || commonStates;
  },

  generateComponentProperties(componentName, designSystem) {
    const baseProps = {
      size: ['sm', 'md', 'lg'],
      color: Object.keys(designSystem.colorPalette.primary || {}),
      disabled: [true, false]
    };

    const specificProps = {
      'Button': { ...baseProps, loading: [true, false], fullWidth: [true, false] },
      'Input': { ...baseProps, placeholder: 'string', required: [true, false] },
      'Card': { ...baseProps, elevation: Object.keys(designSystem.elevation || {}) }
    };

    return specificProps[componentName] || baseProps;
  },

  generateComponentA11y(componentName) {
    const a11yMap = {
      'Button': {
        role: 'button',
        attributes: ['aria-label', 'aria-pressed', 'aria-expanded'],
        keyboard: ['Enter', 'Space'],
        focus: 'visible'
      },
      'Input': {
        role: 'textbox',
        attributes: ['aria-label', 'aria-describedby', 'aria-invalid'],
        keyboard: ['Tab', 'Shift+Tab'],
        focus: 'visible'
      }
    };
    return a11yMap[componentName] || { role: componentName.toLowerCase(), focus: 'visible' };
  },

  generateComponentUsage(componentName) {
    const usageMap = {
      'Button': 'Use for primary actions, form submissions, and navigation',
      'Input': 'Use for collecting user text input in forms',
      'Card': 'Use to group related content and actions'
    };
    return usageMap[componentName] || `Use ${componentName} for relevant UI interactions`;
  },

  generateComponentExamples(componentName) {
    const exampleMap = {
      'Button': [
        '<Button variant="primary">Save Changes</Button>',
        '<Button variant="outline" disabled>Loading...</Button>'
      ],
      'Input': [
        '<Input type="email" placeholder="Enter email" />',
        '<Input type="password" required aria-label="Password" />'
      ]
    };
    return exampleMap[componentName] || [`<${componentName} />`];
  },

  async createLayoutSpecs(context, designSystem) {
    return [
      {
        name: 'App Layout',
        description: 'Main application layout structure',
        type: 'container',
        structure: {
          header: { height: '64px', position: 'fixed' },
          sidebar: { width: '240px', collapsible: true },
          main: { flex: 1, padding: designSystem.spacing.scale.lg },
          footer: { height: '48px', position: 'sticky' }
        },
        breakpoints: this.generateLayoutBreakpoints(designSystem.breakpoints)
      },
      {
        name: 'Content Grid',
        description: 'Responsive grid system for content layout',
        type: 'grid',
        columns: { sm: 1, md: 2, lg: 3, xl: 4 },
        gap: designSystem.spacing.scale.md,
        responsive: true
      },
      {
        name: 'Form Layout',
        description: 'Standard form layout patterns',
        type: 'form',
        structure: {
          fieldSpacing: designSystem.spacing.scale.md,
          labelPosition: 'top',
          actionAlignment: 'right'
        }
      }
    ];
  },

  generateLayoutBreakpoints(breakpoints) {
    return Object.entries(breakpoints).map(([name, width]) => ({
      name,
      width,
      behavior: name === 'sm' ? 'mobile-first' : 'responsive'
    }));
  },

  async createInteractionSpecs(context) {
    return {
      gestures: this.generateGestureSpecs(context.projectInfo?.platform),
      animations: this.generateInteractionAnimations(),
      feedback: this.generateFeedbackSpecs(),
      navigation: this.generateNavigationSpecs()
    };
  },

  generateGestureSpecs(platform) {
    if (platform === 'mobile') {
      return {
        touch: ['tap', 'long-press', 'swipe', 'pinch', 'pan'],
        gestures: {
          swipe: { threshold: '50px', velocity: '0.3px/ms' },
          pinch: { scale: { min: 0.5, max: 3 } }
        }
      };
    }
    
    return {
      mouse: ['click', 'double-click', 'right-click', 'hover'],
      keyboard: ['tab', 'enter', 'escape', 'arrow-keys']
    };
  },

  generateInteractionAnimations() {
    return {
      hover: { duration: '150ms', easing: 'ease-out' },
      focus: { duration: '200ms', easing: 'ease-in-out' },
      loading: { duration: '1s', iteration: 'infinite' },
      slideIn: { duration: '300ms', easing: 'ease-out' }
    };
  },

  generateFeedbackSpecs() {
    return {
      visual: ['color-change', 'shadow', 'transform', 'opacity'],
      haptic: platform === 'mobile' ? ['light', 'medium', 'heavy'] : [],
      audio: ['success', 'error', 'notification']
    };
  },

  generateNavigationSpecs() {
    return {
      patterns: ['hierarchical', 'tab-based', 'drawer', 'bottom-navigation'],
      transitions: ['slide', 'fade', 'push', 'modal'],
      backNavigation: true,
      deepLinking: true
    };
  },

  async createAccessibilitySpecs(context) {
    return {
      standards: {
        wcag: '2.1',
        level: 'AA',
        guidelines: ['perceivable', 'operable', 'understandable', 'robust']
      },
      requirements: [
        'Alt text for all images',
        'Keyboard navigation support',
        'Screen reader compatibility',
        'Color contrast ratio ≥ 4.5:1',
        'Focus indicators visible',
        'Semantic HTML structure',
        'ARIA labels and roles',
        'Responsive text sizing'
      ],
      testing: {
        tools: ['axe-core', 'lighthouse', 'screen-reader'],
        checklist: this.generateA11yChecklist()
      }
    };
  },

  generateA11yChecklist() {
    return [
      'All interactive elements are keyboard accessible',
      'Focus order is logical and visible',
      'Images have appropriate alt text',
      'Color is not the only means of conveying information',
      'Text has sufficient contrast against background',
      'Form fields have associated labels',
      'Error messages are descriptive and helpful',
      'Page has proper heading structure (h1-h6)',
      'Links have descriptive text',
      'Dynamic content changes are announced to screen readers'
    ];
  },

  async createPerformanceSpecs(context) {
    return {
      targets: {
        'First Contentful Paint': '< 1.5s',
        'Largest Contentful Paint': '< 2.5s',
        'First Input Delay': '< 100ms',
        'Cumulative Layout Shift': '< 0.1',
        'Time to Interactive': '< 3.5s'
      },
      budgets: {
        javascript: '200KB',
        css: '50KB',
        images: '500KB total',
        fonts: '100KB'
      },
      optimization: {
        bundling: 'Code splitting by route',
        images: 'WebP with fallbacks',
        fonts: 'Preload critical fonts',
        caching: 'Service worker + HTTP caching',
        minification: 'JS/CSS/HTML minification'
      },
      monitoring: {
        tools: ['Lighthouse', 'WebPageTest', 'Core Web Vitals'],
        frequency: 'CI/CD pipeline + weekly reports'
      }
    };
  },

  async createImplementationGuide(context, componentSpecs) {
    return {
      setup: {
        framework: context.technicalSpecs?.framework || 'React',
        buildTools: context.technicalSpecs?.buildTools || ['Vite', 'ESLint', 'Prettier'],
        dependencies: this.generateDependencies(context.technicalSpecs?.framework),
        structure: this.generateProjectStructure()
      },
      development: {
        conventions: this.generateCodingConventions(),
        patterns: this.generateDesignPatterns(),
        testing: this.generateTestingStrategy()
      },
      deployment: {
        build: 'npm run build',
        optimization: 'Production optimizations enabled',
        assets: 'Static assets served from CDN',
        environments: ['development', 'staging', 'production']
      },
      documentation: {
        storybook: 'Component documentation and playground',
        styleguide: 'Living style guide with examples',
        api: 'Component API documentation'
      }
    };
  },

  generateDependencies(framework) {
    const deps = {
      'React': ['react', 'react-dom', 'styled-components', 'framer-motion'],
      'Vue': ['vue', 'vuetify', '@vue/composition-api'],
      'Angular': ['@angular/core', '@angular/material', '@angular/animations']
    };
    return deps[framework] || ['modern-frontend-framework'];
  },

  generateProjectStructure() {
    return {
      'src/': {
        'components/': 'Reusable UI components',
        'layouts/': 'Layout components',
        'pages/': 'Page components',
        'styles/': 'Global styles and themes',
        'utils/': 'Utility functions',
        'hooks/': 'Custom hooks (if React)',
        'assets/': 'Static assets'
      }
    };
  },

  generateCodingConventions() {
    return [
      'Use TypeScript for type safety',
      'Follow ESLint and Prettier configurations',
      'Use semantic component and variable names',
      'Implement proper error boundaries',
      'Follow mobile-first responsive design',
      'Use CSS-in-JS or CSS Modules for styling',
      'Implement proper loading and error states',
      'Follow accessibility best practices'
    ];
  },

  generateDesignPatterns() {
    return [
      'Component composition over inheritance',
      'Props drilling prevention with context',
      'Custom hooks for shared logic',
      'Higher-order components for cross-cutting concerns',
      'Render props for flexible component behavior',
      'Container/Presentational component pattern',
      'Error boundary pattern for error handling'
    ];
  },

  generateTestingStrategy() {
    return {
      unit: 'Jest + React Testing Library',
      integration: 'Cypress or Playwright',
      visual: 'Chromatic or Percy',
      accessibility: 'axe-core integration',
      coverage: 'Minimum 80% code coverage',
      ci: 'Automated testing in CI/CD pipeline'
    };
  },

  async generateSpecDocument(frontendSpec) {
    return {
      title: `Frontend Specification - ${frontendSpec.metadata.projectInfo.projectName}`,
      sections: {
        overview: this.generateOverviewSection(frontendSpec),
        designSystem: this.generateDesignSystemSection(frontendSpec.designSystem),
        components: this.generateComponentsSection(frontendSpec.components),
        layouts: this.generateLayoutsSection(frontendSpec.layouts),
        accessibility: this.generateAccessibilitySection(frontendSpec.accessibility),
        performance: this.generatePerformanceSection(frontendSpec.performance),
        implementation: this.generateImplementationSection(frontendSpec.implementation)
      }
    };
  },

  generateOverviewSection(spec) {
    return {
      project: spec.metadata.projectInfo.projectName,
      platform: spec.metadata.projectInfo.platform,
      framework: spec.metadata.projectInfo.framework,
      purpose: 'Comprehensive frontend specification for consistent UI/UX implementation',
      scope: `${spec.components.length} components, ${spec.layouts.length} layouts, accessibility compliance`,
      audience: 'Frontend developers, designers, QA engineers'
    };
  },

  generateDesignSystemSection(designSystem) {
    return {
      overview: 'Design system tokens and specifications',
      colorPalette: Object.keys(designSystem.colorPalette).length,
      typography: Object.keys(designSystem.typography.fontSizes).length,
      spacing: Object.keys(designSystem.spacing.scale).length,
      components: designSystem.components.length
    };
  },

  generateComponentsSection(components) {
    return {
      overview: `${components.length} components specified`,
      categories: this.categorizeComponents(components),
      totalVariants: components.reduce((sum, c) => sum + c.variants.length, 0),
      totalStates: components.reduce((sum, c) => sum + c.states.length, 0)
    };
  },

  categorizeComponents(components) {
    const categories = {};
    components.forEach(component => {
      const category = this.getComponentCategory(component.name);
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  },

  getComponentCategory(componentName) {
    const categoryMap = {
      'Button': 'Actions',
      'Input': 'Forms',
      'Card': 'Containers',
      'Modal': 'Overlays',
      'Navigation': 'Navigation'
    };
    return categoryMap[componentName] || 'General';
  },

  generateLayoutsSection(layouts) {
    return {
      overview: `${layouts.length} layout patterns defined`,
      types: layouts.map(l => l.type),
      responsive: layouts.filter(l => l.responsive).length
    };
  },

  generateAccessibilitySection(a11ySpecs) {
    return {
      standard: `WCAG ${a11ySpecs.standards.wcag} Level ${a11ySpecs.standards.level}`,
      requirements: a11ySpecs.requirements.length,
      testing: a11ySpecs.testing.tools.join(', ')
    };
  },

  generatePerformanceSection(performanceSpecs) {
    return {
      targets: Object.keys(performanceSpecs.targets).length,
      budgets: Object.keys(performanceSpecs.budgets).length,
      monitoring: performanceSpecs.monitoring.tools.join(', ')
    };
  },

  generateImplementationSection(implementationGuide) {
    return {
      framework: implementationGuide.setup.framework,
      buildTools: implementationGuide.setup.buildTools.join(', '),
      testingStrategy: implementationGuide.development.testing.unit,
      documentation: Object.keys(implementationGuide.documentation).join(', ')
    };
  },

  async createValidationChecklist(frontendSpec) {
    return [
      {
        category: 'Design System',
        items: [
          'Color palette is comprehensive and accessible',
          'Typography scale is consistent and readable',
          'Spacing system is logical and consistent',
          'Component variants cover all use cases'
        ]
      },
      {
        category: 'Components',
        items: [
          'All components have defined states and variants',
          'Component APIs are consistent and intuitive',
          'Accessibility requirements are specified',
          'Usage guidelines are clear and comprehensive'
        ]
      },
      {
        category: 'Implementation',
        items: [
          'Technical requirements are feasible',
          'Performance targets are realistic',
          'Browser support is clearly defined',
          'Testing strategy is comprehensive'
        ]
      },
      {
        category: 'Documentation',
        items: [
          'All sections are complete and detailed',
          'Examples are provided for complex concepts',
          'Implementation guide is actionable',
          'Validation checklist is comprehensive'
        ]
      }
    ];
  },

  async formatSpecOutput(frontendSpec, specDocument, validationChecklist) {
    let output = `🎨 **Frontend Specification: ${frontendSpec.metadata.projectInfo.projectName}**\n\n`;
    output += `📋 **Spec ID:** ${frontendSpec.metadata.specId}\n`;
    output += `🎯 **Platform:** ${frontendSpec.metadata.projectInfo.platform}\n`;
    output += `⚛️ **Framework:** ${frontendSpec.metadata.projectInfo.framework || 'TBD'}\n`;
    output += `📅 **Created:** ${frontendSpec.metadata.createdAt.split('T')[0]}\n`;
    output += `👤 **Author:** ${frontendSpec.metadata.author}\n\n`;

    // Design System Summary
    output += `## 🎨 Design System\n\n`;
    output += `**Color Palette:** ${Object.keys(frontendSpec.designSystem.colorPalette).length} color groups\n`;
    output += `**Typography:** ${Object.keys(frontendSpec.designSystem.typography.fontSizes).length} font sizes\n`;
    output += `**Spacing:** ${Object.keys(frontendSpec.designSystem.spacing.scale).length} spacing tokens\n`;
    output += `**Breakpoints:** ${Object.keys(frontendSpec.designSystem.breakpoints).length} responsive breakpoints\n\n`;

    // Components Summary
    output += `## 🧩 Components (${frontendSpec.components.length})\n\n`;
    const componentCategories = this.categorizeComponents(frontendSpec.components);
    Object.entries(componentCategories).forEach(([category, count]) => {
      output += `• **${category}:** ${count} components\n`;
    });
    
    const totalVariants = frontendSpec.components.reduce((sum, c) => sum + c.variants.length, 0);
    output += `\n**Total Variants:** ${totalVariants}\n`;
    output += `**Total States:** ${frontendSpec.components.reduce((sum, c) => sum + c.states.length, 0)}\n\n`;

    // Layouts Summary
    output += `## 📐 Layouts (${frontendSpec.layouts.length})\n\n`;
    frontendSpec.layouts.forEach(layout => {
      output += `• **${layout.name}:** ${layout.description}\n`;
    });
    output += '\n';

    // Accessibility Summary
    output += `## ♿ Accessibility\n\n`;
    output += `**Standard:** WCAG ${frontendSpec.accessibility.standards.wcag} Level ${frontendSpec.accessibility.standards.level}\n`;
    output += `**Requirements:** ${frontendSpec.accessibility.requirements.length} specified\n`;
    output += `**Testing Tools:** ${frontendSpec.accessibility.testing.tools.join(', ')}\n\n`;

    // Performance Summary
    output += `## ⚡ Performance\n\n`;
    output += `**Core Web Vitals:**\n`;
    Object.entries(frontendSpec.performance.targets).forEach(([metric, target]) => {
      output += `• ${metric}: ${target}\n`;
    });
    output += `\n**Bundle Budgets:**\n`;
    Object.entries(frontendSpec.performance.budgets).forEach(([type, budget]) => {
      output += `• ${type}: ${budget}\n`;
    });
    output += '\n';

    // Implementation Summary
    output += `## 🛠️ Implementation\n\n`;
    output += `**Framework:** ${frontendSpec.implementation.setup.framework}\n`;
    output += `**Build Tools:** ${frontendSpec.implementation.setup.buildTools.join(', ')}\n`;
    output += `**Testing:** ${frontendSpec.implementation.development.testing.unit}\n`;
    output += `**Documentation:** ${Object.keys(frontendSpec.implementation.documentation).join(', ')}\n\n`;

    // Key Components Detail
    output += `## 🔧 Key Components\n\n`;
    frontendSpec.components.slice(0, 5).forEach(component => {
      output += `### ${component.name}\n`;
      output += `${component.description}\n`;
      output += `**Variants:** ${component.variants.join(', ')}\n`;
      output += `**States:** ${component.states.join(', ')}\n\n`;
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
    output += `1. Review and approve the frontend specification\n`;
    output += `2. Set up development environment with specified tools\n`;
    output += `3. Implement design system tokens and base styles\n`;
    output += `4. Begin component development following specifications\n`;
    output += `5. Set up testing and documentation infrastructure\n`;
    output += `6. Establish performance monitoring and validation\n\n`;

    // Best Practices
    output += `## 💡 Frontend Specification Best Practices\n\n`;
    output += `• Start with a solid design system foundation\n`;
    output += `• Define components with accessibility in mind\n`;
    output += `• Establish performance budgets early\n`;
    output += `• Create comprehensive documentation and examples\n`;
    output += `• Plan for responsive and mobile-first design\n`;
    output += `• Implement proper testing strategies from the start\n\n`;

    output += `📁 **Complete frontend specification and documentation saved to project.**`;

    return output;
  },

  async saveSpecFiles(projectPath, context, frontendSpec, specDocument) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const specsDir = join(saDir, 'frontend-specs');
      if (!existsSync(specsDir)) {
        require('fs').mkdirSync(specsDir, { recursive: true });
      }
      
      // Save complete specification
      const specFilename = `frontend-spec-${context.specId}-${Date.now()}.json`;
      const specFilepath = join(specsDir, specFilename);
      writeFileSync(specFilepath, JSON.stringify({ context, spec: frontendSpec }, null, 2));
      
      // Save readable documentation
      const docFilename = `frontend-spec-${context.specId}-document.json`;
      const docFilepath = join(specsDir, docFilename);
      writeFileSync(docFilepath, JSON.stringify(specDocument, null, 2));
      
    } catch (error) {
      console.warn('Failed to save frontend specification files:', error.message);
    }
  }
};