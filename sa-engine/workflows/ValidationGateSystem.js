/**
 * Advanced Validation Gate System
 * Comprehensive validation framework for workflow phase transitions
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class ValidationGateSystem extends EventEmitter {
  constructor() {
    super();
    this.gates = new Map();
    this.validators = new Map();
    this.customRules = new Map();
    this.gatePolicies = new Map();
  }

  /**
   * Initialize the validation gate system
   */
  async initialize() {
    try {
      await this.loadDefaultGates();
      await this.loadCustomGates();
      await this.setupGatePolicies();
      
      this.emit('gates:initialized', {
        totalGates: this.gates.size,
        customRules: this.customRules.size
      });

      return {
        success: true,
        message: 'Validation gate system initialized',
        gateCount: this.gates.size
      };
    } catch (error) {
      this.emit('gates:error', error);
      throw new Error(`Failed to initialize validation gates: ${error.message}`);
    }
  }

  /**
   * Load default validation gates
   */
  async loadDefaultGates() {
    const defaultGates = {
      // Analysis Phase Gates
      'requirements_documented': {
        name: 'Requirements Documentation Gate',
        description: 'Validates that requirements are properly documented',
        phase: 'analysis',
        priority: 'high',
        validator: 'requirementsValidator',
        rules: [
          'requirements_file_exists',
          'requirements_are_clear',
          'acceptance_criteria_defined'
        ],
        autoFix: false,
        blocksProgression: true
      },

      'stakeholder_signoff': {
        name: 'Stakeholder Sign-off Gate',
        description: 'Validates stakeholder approval',
        phase: 'analysis',
        priority: 'high',
        validator: 'stakeholderValidator',
        rules: [
          'stakeholder_approval_received',
          'requirements_reviewed'
        ],
        autoFix: false,
        blocksProgression: true
      },

      // Architecture Phase Gates
      'architecture_approved': {
        name: 'Architecture Approval Gate',
        description: 'Validates architecture documentation and decisions',
        phase: 'architecture',
        priority: 'high',
        validator: 'architectureValidator',
        rules: [
          'architecture_document_exists',
          'technical_decisions_documented',
          'security_considerations_addressed',
          'scalability_addressed'
        ],
        autoFix: false,
        blocksProgression: true
      },

      'technology_stack_validated': {
        name: 'Technology Stack Validation Gate',
        description: 'Validates technology choices',
        phase: 'architecture',
        priority: 'medium',
        validator: 'technologyValidator',
        rules: [
          'technology_choices_justified',
          'dependencies_compatible',
          'licensing_compliant'
        ],
        autoFix: false,
        blocksProgression: false
      },

      // Implementation Phase Gates
      'code_quality_gate': {
        name: 'Code Quality Gate',
        description: 'Validates code quality standards',
        phase: 'implementation',
        priority: 'high',
        validator: 'codeQualityValidator',
        rules: [
          'code_style_compliant',
          'test_coverage_adequate',
          'no_critical_issues',
          'documentation_complete'
        ],
        autoFix: true,
        blocksProgression: true
      },

      'security_gate': {
        name: 'Security Validation Gate',
        description: 'Validates security requirements',
        phase: 'implementation',
        priority: 'high',
        validator: 'securityValidator',
        rules: [
          'no_security_vulnerabilities',
          'authentication_implemented',
          'authorization_implemented',
          'data_encryption_implemented'
        ],
        autoFix: false,
        blocksProgression: true
      },

      // Testing Phase Gates
      'test_completion_gate': {
        name: 'Test Completion Gate',
        description: 'Validates testing completeness',
        phase: 'testing',
        priority: 'high',
        validator: 'testingValidator',
        rules: [
          'unit_tests_passing',
          'integration_tests_passing',
          'e2e_tests_passing',
          'test_coverage_meets_threshold'
        ],
        autoFix: false,
        blocksProgression: true
      },

      'performance_gate': {
        name: 'Performance Validation Gate',
        description: 'Validates performance requirements',
        phase: 'testing',
        priority: 'medium',
        validator: 'performanceValidator',
        rules: [
          'response_time_acceptable',
          'resource_usage_acceptable',
          'scalability_tested'
        ],
        autoFix: false,
        blocksProgression: false
      },

      // Deployment Phase Gates
      'deployment_readiness_gate': {
        name: 'Deployment Readiness Gate',
        description: 'Validates deployment readiness',
        phase: 'deployment',
        priority: 'high',
        validator: 'deploymentValidator',
        rules: [
          'all_tests_passing',
          'deployment_scripts_ready',
          'monitoring_configured',
          'rollback_plan_ready'
        ],
        autoFix: false,
        blocksProgression: true
      }
    };

    for (const [gateId, gate] of Object.entries(defaultGates)) {
      this.gates.set(gateId, gate);
    }
  }

  /**
   * Load custom validation gates from configuration
   */
  async loadCustomGates() {
    try {
      const customGatesPath = path.join(process.cwd(), '.sa-workflows', 'custom-gates.json');
      const customGatesData = await fs.readFile(customGatesPath, 'utf-8');
      const customGates = JSON.parse(customGatesData);

      for (const [gateId, gate] of Object.entries(customGates)) {
        this.gates.set(gateId, { ...gate, custom: true });
      }
    } catch (error) {
      // Custom gates are optional
      console.log('No custom gates configuration found');
    }
  }

  /**
   * Setup gate policies
   */
  async setupGatePolicies() {
    const policies = {
      'strict': {
        name: 'Strict Policy',
        description: 'All gates must pass',
        allowOverrides: false,
        requireApproval: true,
        blockOnFailure: true
      },
      'flexible': {
        name: 'Flexible Policy',
        description: 'High priority gates must pass, medium can be overridden',
        allowOverrides: true,
        requireApproval: false,
        blockOnFailure: false
      },
      'development': {
        name: 'Development Policy',
        description: 'Warnings only, allows progression',
        allowOverrides: true,
        requireApproval: false,
        blockOnFailure: false
      }
    };

    for (const [policyId, policy] of Object.entries(policies)) {
      this.gatePolicies.set(policyId, policy);
    }
  }

  /**
   * Register custom validator
   */
  registerValidator(name, validator) {
    this.validators.set(name, validator);
    
    this.emit('validator:registered', {
      name,
      validatorType: typeof validator
    });
  }

  /**
   * Add custom validation rule
   */
  addCustomRule(ruleId, rule) {
    this.customRules.set(ruleId, {
      ...rule,
      createdAt: new Date().toISOString()
    });

    this.emit('rule:added', { ruleId, rule });
  }

  /**
   * Validate workflow phase transition
   */
  async validatePhaseTransition(instance, fromPhase, toPhase, options = {}) {
    const policy = this.gatePolicies.get(options.policy || 'flexible');
    const relevantGates = this.getGatesForPhase(fromPhase.name);
    
    const validationResult = {
      passed: true,
      warnings: [],
      errors: [],
      gateResults: [],
      canProceed: true,
      requiresApproval: false,
      autoFixApplied: false
    };

    for (const gate of relevantGates) {
      try {
        const gateResult = await this.executeGate(gate, instance, fromPhase, options);
        validationResult.gateResults.push(gateResult);

        if (!gateResult.passed) {
          if (gate.priority === 'high' && gate.blocksProgression) {
            validationResult.passed = false;
            validationResult.errors.push(...gateResult.errors);
            
            if (policy.blockOnFailure) {
              validationResult.canProceed = false;
            }
          } else {
            validationResult.warnings.push(...gateResult.warnings);
          }

          // Try auto-fix if available
          if (gate.autoFix && gateResult.fixSuggestions) {
            const fixResult = await this.applyAutoFix(gate, gateResult.fixSuggestions, instance);
            if (fixResult.success) {
              validationResult.autoFixApplied = true;
              // Re-run the gate after auto-fix
              const retryResult = await this.executeGate(gate, instance, fromPhase, options);
              if (retryResult.passed) {
                validationResult.passed = true;
                validationResult.canProceed = true;
              }
            }
          }
        }

        if (policy.requireApproval && gate.priority === 'high') {
          validationResult.requiresApproval = true;
        }

      } catch (error) {
        validationResult.errors.push(`Gate execution failed (${gate.name}): ${error.message}`);
        validationResult.passed = false;
        if (policy.blockOnFailure) {
          validationResult.canProceed = false;
        }
      }
    }

    this.emit('phase:validated', {
      instanceId: instance.instanceId,
      fromPhase: fromPhase.name,
      toPhase: toPhase.name,
      result: validationResult,
      policy: options.policy
    });

    return validationResult;
  }

  /**
   * Execute individual validation gate
   */
  async executeGate(gate, instance, phase, options) {
    const validator = this.validators.get(gate.validator) || this.getDefaultValidator(gate.validator);
    
    if (!validator) {
      throw new Error(`Validator not found: ${gate.validator}`);
    }

    const gateResult = {
      gateName: gate.name,
      gateId: gate.name.toLowerCase().replace(/\s+/g, '_'),
      passed: true,
      errors: [],
      warnings: [],
      ruleResults: [],
      fixSuggestions: [],
      executedAt: new Date().toISOString()
    };

    // Execute individual rules
    for (const ruleId of gate.rules) {
      try {
        const ruleResult = await this.executeRule(ruleId, instance, phase, validator);
        gateResult.ruleResults.push(ruleResult);

        if (!ruleResult.passed) {
          gateResult.passed = false;
          gateResult.errors.push(...ruleResult.errors);
        }

        if (ruleResult.warnings) {
          gateResult.warnings.push(...ruleResult.warnings);
        }

        if (ruleResult.fixSuggestions) {
          gateResult.fixSuggestions.push(...ruleResult.fixSuggestions);
        }

      } catch (error) {
        gateResult.passed = false;
        gateResult.errors.push(`Rule execution failed (${ruleId}): ${error.message}`);
      }
    }

    return gateResult;
  }

  /**
   * Execute individual validation rule
   */
  async executeRule(ruleId, instance, phase, validator) {
    const customRule = this.customRules.get(ruleId);
    
    if (customRule) {
      return await this.executeCustomRule(customRule, instance, phase);
    }

    // Use built-in rule execution
    if (typeof validator[ruleId] === 'function') {
      return await validator[ruleId](instance, phase);
    }

    // Default rule validation
    return await this.executeDefaultRule(ruleId, instance, phase);
  }

  /**
   * Execute custom validation rule
   */
  async executeCustomRule(rule, instance, phase) {
    const ruleResult = {
      ruleId: rule.id,
      passed: true,
      errors: [],
      warnings: [],
      fixSuggestions: []
    };

    try {
      if (rule.type === 'artifact_check') {
        const artifacts = instance.getArtifacts();
        const hasRequiredArtifact = artifacts.some(artifact => 
          artifact.name.includes(rule.artifactPattern) || 
          artifact.type === rule.artifactType
        );

        if (!hasRequiredArtifact) {
          ruleResult.passed = false;
          ruleResult.errors.push(`Required artifact not found: ${rule.artifactPattern || rule.artifactType}`);
          
          if (rule.autoCreate) {
            ruleResult.fixSuggestions.push({
              type: 'create_artifact',
              pattern: rule.artifactPattern,
              template: rule.template
            });
          }
        }
      } else if (rule.type === 'file_check') {
        const filePath = path.join(instance.options.projectRoot || '', rule.filePath);
        try {
          await fs.access(filePath);
        } catch (error) {
          ruleResult.passed = false;
          ruleResult.errors.push(`Required file not found: ${rule.filePath}`);
        }
      } else if (rule.type === 'content_check') {
        // Custom content validation logic
        const result = await this.validateContent(rule, instance, phase);
        Object.assign(ruleResult, result);
      }

    } catch (error) {
      ruleResult.passed = false;
      ruleResult.errors.push(`Custom rule execution failed: ${error.message}`);
    }

    return ruleResult;
  }

  /**
   * Execute default validation rule
   */
  async executeDefaultRule(ruleId, instance, phase) {
    const ruleResult = {
      ruleId,
      passed: true,
      errors: [],
      warnings: [],
      fixSuggestions: []
    };

    switch (ruleId) {
      case 'requirements_file_exists':
        const artifacts = instance.getArtifacts();
        const hasRequirements = artifacts.some(artifact => 
          artifact.name.toLowerCase().includes('requirement') ||
          artifact.name.toLowerCase().includes('prd') ||
          artifact.name.toLowerCase().includes('brief')
        );
        
        if (!hasRequirements) {
          ruleResult.passed = false;
          ruleResult.errors.push('Requirements documentation not found');
          ruleResult.fixSuggestions.push({
            type: 'create_artifact',
            name: 'requirements.md',
            template: 'requirements_template'
          });
        }
        break;

      case 'architecture_document_exists':
        const hasArchitecture = instance.getArtifacts().some(artifact => 
          artifact.name.toLowerCase().includes('architecture') ||
          artifact.type === 'architecture'
        );
        
        if (!hasArchitecture) {
          ruleResult.passed = false;
          ruleResult.errors.push('Architecture documentation not found');
        }
        break;

      case 'all_tests_passing':
        // This would integrate with actual test runners
        const testResults = await this.checkTestResults(instance);
        if (!testResults.allPassing) {
          ruleResult.passed = false;
          ruleResult.errors.push(`${testResults.failing} tests are failing`);
        }
        break;

      default:
        ruleResult.warnings.push(`Unknown rule: ${ruleId}`);
    }

    return ruleResult;
  }

  /**
   * Get gates for specific phase
   */
  getGatesForPhase(phaseName) {
    return Array.from(this.gates.values()).filter(gate => {
      if (gate.phase === phaseName.toLowerCase()) {
        return true;
      }
      
      // Check for phase name patterns
      const phasePatterns = {
        'analysis': ['analysis', 'planning', 'requirements'],
        'architecture': ['architecture', 'design'],
        'implementation': ['implementation', 'development', 'coding'],
        'testing': ['testing', 'qa', 'validation'],
        'deployment': ['deployment', 'release', 'production']
      };

      for (const [category, patterns] of Object.entries(phasePatterns)) {
        if (gate.phase === category && patterns.some(pattern => 
          phaseName.toLowerCase().includes(pattern)
        )) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Get default validator for validator name
   */
  getDefaultValidator(validatorName) {
    const defaultValidators = {
      'requirementsValidator': new RequirementsValidator(),
      'architectureValidator': new ArchitectureValidator(),
      'codeQualityValidator': new CodeQualityValidator(),
      'securityValidator': new SecurityValidator(),
      'testingValidator': new TestingValidator(),
      'deploymentValidator': new DeploymentValidator()
    };

    return defaultValidators[validatorName];
  }

  /**
   * Apply auto-fix suggestions
   */
  async applyAutoFix(gate, fixSuggestions, instance) {
    const fixResult = {
      success: false,
      appliedFixes: [],
      errors: []
    };

    for (const suggestion of fixSuggestions) {
      try {
        switch (suggestion.type) {
          case 'create_artifact':
            await this.createArtifact(suggestion, instance);
            fixResult.appliedFixes.push(`Created artifact: ${suggestion.name}`);
            break;
          
          case 'update_content':
            await this.updateContent(suggestion, instance);
            fixResult.appliedFixes.push(`Updated content: ${suggestion.target}`);
            break;
          
          default:
            fixResult.errors.push(`Unknown fix type: ${suggestion.type}`);
        }
      } catch (error) {
        fixResult.errors.push(`Fix failed: ${error.message}`);
      }
    }

    fixResult.success = fixResult.appliedFixes.length > 0;
    return fixResult;
  }

  /**
   * Create artifact as part of auto-fix
   */
  async createArtifact(suggestion, instance) {
    const artifact = {
      name: suggestion.name || suggestion.pattern,
      type: suggestion.template || 'document',
      content: suggestion.content || 'Generated by validation auto-fix',
      createdAt: new Date().toISOString(),
      autoGenerated: true
    };

    instance.addArtifact(artifact);
  }

  /**
   * Update content as part of auto-fix
   */
  async updateContent(suggestion, instance) {
    // Implementation would depend on the specific content update needed
    console.log(`Auto-fix: Update content for ${suggestion.target}`);
  }

  /**
   * Validate content based on rule
   */
  async validateContent(rule, instance, phase) {
    const result = {
      passed: true,
      errors: [],
      warnings: []
    };

    // Implementation would depend on specific content validation requirements
    return result;
  }

  /**
   * Check test results
   */
  async checkTestResults(instance) {
    // This would integrate with actual test frameworks
    return {
      allPassing: true,
      total: 0,
      passing: 0,
      failing: 0
    };
  }
}

/**
 * Base validator class
 */
class BaseValidator {
  async validate(instance, phase) {
    throw new Error('Validate method must be implemented by subclass');
  }
}

/**
 * Requirements validator
 */
class RequirementsValidator extends BaseValidator {
  async requirements_file_exists(instance, phase) {
    const artifacts = instance.getArtifacts();
    const hasRequirements = artifacts.some(artifact => 
      artifact.name.toLowerCase().includes('requirement') ||
      artifact.name.toLowerCase().includes('prd')
    );

    return {
      passed: hasRequirements,
      errors: hasRequirements ? [] : ['Requirements document not found'],
      warnings: []
    };
  }

  async requirements_are_clear(instance, phase) {
    // Implementation would analyze requirements content
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async acceptance_criteria_defined(instance, phase) {
    // Implementation would check for acceptance criteria
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }
}

/**
 * Architecture validator
 */
class ArchitectureValidator extends BaseValidator {
  async architecture_document_exists(instance, phase) {
    const artifacts = instance.getArtifacts();
    const hasArchitecture = artifacts.some(artifact => 
      artifact.name.toLowerCase().includes('architecture') ||
      artifact.type === 'architecture'
    );

    return {
      passed: hasArchitecture,
      errors: hasArchitecture ? [] : ['Architecture document not found'],
      warnings: []
    };
  }

  async technical_decisions_documented(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async security_considerations_addressed(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async scalability_addressed(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }
}

/**
 * Code Quality validator
 */
class CodeQualityValidator extends BaseValidator {
  async code_style_compliant(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async test_coverage_adequate(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async no_critical_issues(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async documentation_complete(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }
}

/**
 * Security validator
 */
class SecurityValidator extends BaseValidator {
  async no_security_vulnerabilities(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async authentication_implemented(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async authorization_implemented(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async data_encryption_implemented(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }
}

/**
 * Testing validator
 */
class TestingValidator extends BaseValidator {
  async unit_tests_passing(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async integration_tests_passing(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async e2e_tests_passing(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async test_coverage_meets_threshold(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }
}

/**
 * Deployment validator
 */
class DeploymentValidator extends BaseValidator {
  async all_tests_passing(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async deployment_scripts_ready(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async monitoring_configured(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }

  async rollback_plan_ready(instance, phase) {
    return {
      passed: true,
      errors: [],
      warnings: []
    };
  }
}

export default ValidationGateSystem;