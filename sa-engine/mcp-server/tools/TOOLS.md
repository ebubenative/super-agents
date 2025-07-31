# Super Agents MCP Tools

Generated: 2025-07-30T23:43:36.792Z
Total Tools: 49

## Ux-expert Tools

### sa_accessibility_audit

**Description:** Conduct comprehensive accessibility audits with WCAG compliance checking, accessibility improvement suggestions, and audit reporting

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "auditId": {
      "type": "string",
      "minLength": 1
    },
    "target": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "url",
            "wireframes",
            "design-files",
            "specification"
          ]
        },
        "source": {
          "type": "string"
        },
        "description": {
          "type": "string"
        }
      }
    },
    "auditScope": {
      "type": "object",
      "properties": {
        "wcagLevel": {
          "type": "string",
          "enum": [
            "A",
            "AA",
            "AAA"
          ],
          "default": "AA"
        },
        "wcagVersion": {
          "type": "string",
          "enum": [
            "2.0",
            "2.1",
            "2.2"
          ],
          "default": "2.1"
        },
        "testTypes": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "automated",
              "manual",
              "screen-reader",
              "keyboard"
            ]
          },
          "default": [
            "automated",
            "manual",
            "keyboard"
          ]
        },
        "includeUserTesting": {
          "type": "boolean",
          "default": false
        }
      }
    },
    "context": {
      "type": "object",
      "properties": {
        "userTypes": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "primaryTasks": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "targetDevices": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "assistiveTech": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "projectPath": {
      "type": "string",
      "default": "/home/ebube/PROJECTS/super-agents"
    }
  },
  "required": [
    "auditId",
    "target"
  ]
}
```

---

### sa_create_frontend_spec

**Description:** Create comprehensive frontend specifications with UI/UX requirements, design system integration, and technical implementation details

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "specId": {
      "type": "string",
      "description": "Unique identifier for the frontend specification",
      "minLength": 1
    },
    "projectInfo": {
      "type": "object",
      "description": "Project information for the frontend spec",
      "properties": {
        "projectName": {
          "type": "string"
        },
        "version": {
          "type": "string"
        },
        "platform": {
          "type": "string",
          "enum": [
            "web",
            "mobile",
            "desktop",
            "responsive"
          ]
        },
        "framework": {
          "type": "string"
        },
        "targetAudience": {
          "type": "string"
        }
      }
    },
    "requirements": {
      "type": "object",
      "description": "UI/UX requirements",
      "properties": {
        "userStories": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "functionalRequirements": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "nonFunctionalRequirements": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "accessibilityRequirements": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "performanceRequirements": {
          "type": "object"
        }
      }
    },
    "designSystem": {
      "type": "object",
      "description": "Design system specifications",
      "properties": {
        "colorPalette": {
          "type": "object"
        },
        "typography": {
          "type": "object"
        },
        "spacing": {
          "type": "object"
        },
        "components": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "breakpoints": {
          "type": "object"
        }
      }
    },
    "technicalSpecs": {
      "type": "object",
      "description": "Technical implementation specifications",
      "properties": {
        "framework": {
          "type": "string"
        },
        "buildTools": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "dependencies": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "browserSupport": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "performanceTargets": {
          "type": "object"
        }
      }
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    }
  },
  "required": [
    "specId",
    "projectInfo"
  ]
}
```

---

### sa_design_wireframes

**Description:** Create wireframe specifications with user journey mapping, interface design patterns, and wireframe validation

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "wireframeId": {
      "type": "string",
      "minLength": 1
    },
    "projectInfo": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "platform": {
          "type": "string",
          "enum": [
            "web",
            "mobile",
            "tablet",
            "desktop"
          ]
        },
        "userTypes": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "userJourneys": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "user": {
            "type": "string"
          },
          "goal": {
            "type": "string"
          },
          "steps": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "wireframes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "page",
              "modal",
              "component",
              "flow"
            ]
          },
          "description": {
            "type": "string"
          },
          "elements": {
            "type": "array",
            "items": {
              "type": "object"
            }
          }
        }
      }
    },
    "designPatterns": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "projectPath": {
      "type": "string",
      "default": "/home/ebube/PROJECTS/super-agents"
    }
  },
  "required": [
    "wireframeId",
    "projectInfo"
  ]
}
```

---

### sa_generate_ui_prompt

**Description:** Generate AI UI generation prompts optimized for tools like v0, Lovable, and other AI design platforms

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "promptId": {
      "type": "string",
      "minLength": 1
    },
    "targetTool": {
      "type": "string",
      "enum": [
        "v0",
        "lovable",
        "cursor",
        "bolt",
        "claude-artifacts",
        "generic"
      ],
      "default": "generic"
    },
    "componentType": {
      "type": "string"
    },
    "requirements": {
      "type": "object",
      "properties": {
        "functionality": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "styling": {
          "type": "object"
        },
        "interactions": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "data": {
          "type": "object"
        }
      }
    },
    "constraints": {
      "type": "object",
      "properties": {
        "framework": {
          "type": "string"
        },
        "libraries": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "responsive": {
          "type": "boolean",
          "default": true
        },
        "accessibility": {
          "type": "boolean",
          "default": true
        }
      }
    },
    "projectPath": {
      "type": "string",
      "default": "/home/ebube/PROJECTS/super-agents"
    }
  },
  "required": [
    "promptId",
    "componentType"
  ]
}
```

---

## Dependencies Tools

### sa_add_dependency

**Description:** Add dependencies between tasks with cycle detection and dependency type specification

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "taskId": {
      "type": "string",
      "description": "ID of the task that depends on another task"
    },
    "dependsOn": {
      "type": "string",
      "description": "ID of the task that this task depends on"
    },
    "dependencyType": {
      "type": "string",
      "enum": [
        "blocking",
        "related",
        "optional",
        "finish-to-start",
        "start-to-start",
        "finish-to-finish",
        "start-to-finish"
      ],
      "description": "Type of dependency relationship",
      "default": "blocking"
    },
    "tasksFile": {
      "type": "string",
      "description": "Path to tasks file (optional, will use project tasks.json)"
    },
    "reason": {
      "type": "string",
      "description": "Reason for the dependency (optional but recommended)"
    },
    "force": {
      "type": "boolean",
      "description": "Force dependency creation even if warnings exist",
      "default": false
    },
    "validateCycles": {
      "type": "boolean",
      "description": "Perform cycle detection before adding dependency",
      "default": true
    }
  },
  "required": [
    "projectRoot",
    "taskId",
    "dependsOn"
  ]
}
```

---

### sa_dependency_graph

**Description:** Generate dependency graph visualization in multiple formats with interactive exploration capabilities

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "tasksFile": {
      "type": "string",
      "description": "Path to tasks file (optional, will use project tasks.json)"
    },
    "outputFormat": {
      "type": "string",
      "enum": [
        "ascii",
        "json",
        "dot",
        "mermaid",
        "html",
        "all"
      ],
      "description": "Output format for the dependency graph",
      "default": "ascii"
    },
    "outputFile": {
      "type": "string",
      "description": "Output file path (optional, will generate based on format)"
    },
    "includeOrphans": {
      "type": "boolean",
      "description": "Include tasks with no dependencies or dependents",
      "default": true
    },
    "maxDepth": {
      "type": "number",
      "description": "Maximum depth for dependency traversal (0 = unlimited)",
      "default": 0,
      "minimum": 0
    },
    "focusTask": {
      "type": "string",
      "description": "Focus on specific task and its immediate dependencies/dependents"
    },
    "groupBy": {
      "type": "string",
      "enum": [
        "none",
        "priority",
        "status",
        "assignee",
        "tags"
      ],
      "description": "Group tasks in visualization",
      "default": "none"
    },
    "showMetadata": {
      "type": "boolean",
      "description": "Include task metadata in visualization (priority, status, effort)",
      "default": true
    },
    "highlightCriticalPath": {
      "type": "boolean",
      "description": "Highlight critical path in the visualization",
      "default": false
    },
    "analyzeImpact": {
      "type": "boolean",
      "description": "Include impact analysis for each task",
      "default": false
    }
  },
  "required": [
    "projectRoot"
  ]
}
```

---

### sa_remove_dependency

**Description:** Remove dependencies between tasks with impact analysis and safe cascade handling

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "taskId": {
      "type": "string",
      "description": "ID of the task to remove dependency from"
    },
    "dependsOn": {
      "type": "string",
      "description": "ID of the dependency task to remove"
    },
    "tasksFile": {
      "type": "string",
      "description": "Path to tasks file (optional, will use project tasks.json)"
    },
    "reason": {
      "type": "string",
      "description": "Reason for removing the dependency (optional but recommended)"
    },
    "force": {
      "type": "boolean",
      "description": "Force removal even if warnings exist",
      "default": false
    },
    "cascadeRemoval": {
      "type": "boolean",
      "description": "Remove dependent relationships that become invalid",
      "default": false
    },
    "analyzeImpact": {
      "type": "boolean",
      "description": "Perform impact analysis before removal",
      "default": true
    }
  },
  "required": [
    "projectRoot",
    "taskId",
    "dependsOn"
  ]
}
```

---

### sa_validate_dependencies

**Description:** Comprehensive dependency validation with cycle detection, logical consistency checking, and dependency health assessment

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "tasksFile": {
      "type": "string",
      "description": "Path to tasks file (optional, will use project tasks.json)"
    },
    "validationType": {
      "type": "string",
      "enum": [
        "full",
        "cycles",
        "logical",
        "orphans",
        "redundant",
        "critical-path"
      ],
      "description": "Type of validation to perform",
      "default": "full"
    },
    "fixIssues": {
      "type": "boolean",
      "description": "Automatically fix issues where possible",
      "default": false
    },
    "generateReport": {
      "type": "boolean",
      "description": "Generate detailed validation report",
      "default": true
    },
    "severity": {
      "type": "string",
      "enum": [
        "all",
        "critical",
        "warning",
        "info"
      ],
      "description": "Minimum severity level to report",
      "default": "warning"
    },
    "includeMetrics": {
      "type": "boolean",
      "description": "Include dependency metrics in output",
      "default": true
    }
  },
  "required": [
    "projectRoot"
  ]
}
```

---

## Architect Tools

### sa_analyze_brownfield

**Description:** Analyze existing brownfield systems with technical debt assessment, migration planning, and comprehensive risk analysis

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "systemName": {
      "type": "string",
      "description": "Name of the existing system to analyze",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "systemInfo": {
      "type": "object",
      "description": "Information about the existing system",
      "properties": {
        "age": {
          "type": "string"
        },
        "technology": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "size": {
          "type": "string"
        },
        "complexity": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "very-high"
          ]
        },
        "documentation": {
          "type": "string",
          "enum": [
            "none",
            "minimal",
            "partial",
            "comprehensive"
          ]
        },
        "testCoverage": {
          "type": "string"
        },
        "performanceIssues": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "securityConcerns": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "analysisScope": {
      "type": "string",
      "description": "Scope of brownfield analysis",
      "enum": [
        "architecture-only",
        "technical-debt",
        "migration-assessment",
        "comprehensive"
      ],
      "default": "comprehensive"
    },
    "migrationGoals": {
      "type": "object",
      "description": "Migration objectives",
      "properties": {
        "targetTechnology": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "performanceTargets": {
          "type": "string"
        },
        "scalabilityGoals": {
          "type": "string"
        },
        "maintainabilityGoals": {
          "type": "string"
        },
        "timeline": {
          "type": "string"
        }
      }
    },
    "constraints": {
      "type": "object",
      "description": "Migration constraints",
      "properties": {
        "budget": {
          "type": "string"
        },
        "downtime": {
          "type": "string"
        },
        "resources": {
          "type": "string"
        },
        "businessContinuity": {
          "type": "boolean"
        },
        "riskTolerance": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high"
          ]
        }
      }
    },
    "includeRiskAssessment": {
      "type": "boolean",
      "description": "Include detailed risk assessment",
      "default": true
    }
  },
  "required": [
    "systemName"
  ]
}
```

---

### sa_create_architecture

**Description:** Create comprehensive architecture documentation with template selection, documentation generation, diagram creation workflows, and architecture validation

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "systemName": {
      "type": "string",
      "description": "Name of the system for architecture documentation",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "architectureType": {
      "type": "string",
      "description": "Type of architecture to document",
      "enum": [
        "system-architecture",
        "software-architecture",
        "solution-architecture",
        "enterprise-architecture",
        "microservices-architecture"
      ],
      "default": "system-architecture"
    },
    "documentationType": {
      "type": "string",
      "description": "Type of documentation to create",
      "enum": [
        "comprehensive",
        "high-level",
        "technical-specification",
        "executive-summary"
      ],
      "default": "comprehensive"
    },
    "architectureComponents": {
      "type": "object",
      "description": "Architecture components to document",
      "properties": {
        "frontend": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "backend": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "database": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "infrastructure": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "integrations": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "security": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "qualityAttributes": {
      "type": "object",
      "description": "Quality attributes and requirements",
      "properties": {
        "performance": {
          "type": "string"
        },
        "scalability": {
          "type": "string"
        },
        "availability": {
          "type": "string"
        },
        "security": {
          "type": "string"
        },
        "maintainability": {
          "type": "string"
        },
        "usability": {
          "type": "string"
        }
      }
    },
    "designDecisions": {
      "type": "array",
      "description": "Key architecture design decisions",
      "items": {
        "type": "object",
        "properties": {
          "decision": {
            "type": "string"
          },
          "rationale": {
            "type": "string"
          },
          "alternatives": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "consequences": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "stakeholders": {
      "type": "array",
      "description": "Architecture stakeholders",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "concerns": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "includeValidation": {
      "type": "boolean",
      "description": "Include architecture validation framework",
      "default": true
    },
    "generateDiagrams": {
      "type": "boolean",
      "description": "Generate architecture diagram specifications",
      "default": true
    }
  },
  "required": [
    "systemName"
  ]
}
```

---

### sa_design_system

**Description:** Design comprehensive system architecture using established methodologies, architecture pattern selection, component design workflows, and design validation

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "systemName": {
      "type": "string",
      "description": "Name of the system to design",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "systemType": {
      "type": "string",
      "description": "Type of system being designed",
      "enum": [
        "web-application",
        "mobile-app",
        "api-service",
        "microservices",
        "monolith",
        "distributed-system",
        "data-platform",
        "iot-system"
      ],
      "default": "web-application"
    },
    "designMethodology": {
      "type": "string",
      "description": "Architecture design methodology to use",
      "enum": [
        "domain-driven-design",
        "clean-architecture",
        "hexagonal-architecture",
        "onion-architecture",
        "layered-architecture",
        "event-driven",
        "microservices-patterns"
      ],
      "default": "clean-architecture"
    },
    "requirements": {
      "type": "object",
      "description": "System requirements",
      "properties": {
        "functional": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "nonFunctional": {
          "type": "object",
          "properties": {
            "performance": {
              "type": "string"
            },
            "scalability": {
              "type": "string"
            },
            "availability": {
              "type": "string"
            },
            "security": {
              "type": "string"
            },
            "maintainability": {
              "type": "string"
            }
          }
        },
        "constraints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "assumptions": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "stakeholders": {
      "type": "array",
      "description": "Key stakeholders and their concerns",
      "items": {
        "type": "object",
        "properties": {
          "role": {
            "type": "string"
          },
          "concerns": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "priorities": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "technologyConstraints": {
      "type": "object",
      "description": "Technology constraints and preferences",
      "properties": {
        "preferredLanguages": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "requiredFrameworks": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "infrastructureConstraints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "integrationRequirements": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "designComplexity": {
      "type": "string",
      "description": "Desired level of design detail",
      "enum": [
        "high-level",
        "detailed",
        "comprehensive"
      ],
      "default": "detailed"
    },
    "includeValidation": {
      "type": "boolean",
      "description": "Include architecture validation framework",
      "default": true
    }
  },
  "required": [
    "systemName"
  ]
}
```

---

### sa_tech_recommendations

**Description:** Provide technology selection recommendations with stack analysis, framework comparison, performance considerations, and technology selection criteria

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectName": {
      "type": "string",
      "description": "Name of the project requiring technology recommendations",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "projectType": {
      "type": "string",
      "description": "Type of project",
      "enum": [
        "web-application",
        "mobile-app",
        "api-service",
        "microservices",
        "data-platform",
        "desktop-app",
        "iot-system"
      ],
      "default": "web-application"
    },
    "requirements": {
      "type": "object",
      "description": "Project requirements and constraints",
      "properties": {
        "performance": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ]
        },
        "scalability": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ]
        },
        "security": {
          "type": "string",
          "enum": [
            "basic",
            "standard",
            "high",
            "critical"
          ]
        },
        "maintainability": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high"
          ]
        },
        "timeToMarket": {
          "type": "string",
          "enum": [
            "flexible",
            "standard",
            "urgent"
          ]
        },
        "budget": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "unlimited"
          ]
        }
      }
    },
    "teamSkills": {
      "type": "object",
      "description": "Team skills and experience",
      "properties": {
        "languages": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "frameworks": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "databases": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "cloudPlatforms": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "experienceLevel": {
          "type": "string",
          "enum": [
            "junior",
            "intermediate",
            "senior",
            "expert"
          ]
        }
      }
    },
    "constraints": {
      "type": "object",
      "description": "Technology constraints",
      "properties": {
        "mustUse": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "cannotUse": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "preferredVendors": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "complianceRequirements": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "integrationRequirements": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "analysisDepth": {
      "type": "string",
      "description": "Depth of technology analysis",
      "enum": [
        "overview",
        "detailed",
        "comprehensive"
      ],
      "default": "detailed"
    },
    "includeAlternatives": {
      "type": "boolean",
      "description": "Include alternative technology options",
      "default": true
    }
  },
  "required": [
    "projectName"
  ]
}
```

---

## Task-master Tools

### sa_analyze_complexity

**Description:** AI-powered complexity analysis for tasks including difficulty estimation, effort analysis, and resource requirements

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "tasksFile": {
      "type": "string",
      "description": "Path to tasks file (optional, will use project tasks.json)"
    },
    "taskIds": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Specific task IDs to analyze (optional, will analyze all tasks if not provided)"
    },
    "analysisType": {
      "type": "string",
      "enum": [
        "basic",
        "detailed",
        "comprehensive"
      ],
      "description": "Level of complexity analysis to perform",
      "default": "detailed"
    },
    "useResearch": {
      "type": "boolean",
      "description": "Enable AI research mode for enhanced complexity analysis",
      "default": false
    },
    "factors": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "technical",
          "time",
          "resources",
          "dependencies",
          "risk",
          "skills",
          "testing"
        ]
      },
      "description": "Specific complexity factors to analyze",
      "default": [
        "technical",
        "time",
        "resources",
        "dependencies",
        "risk"
      ]
    },
    "teamExperience": {
      "type": "string",
      "enum": [
        "junior",
        "mixed",
        "senior"
      ],
      "description": "Team experience level for accurate effort estimation",
      "default": "mixed"
    },
    "generateReport": {
      "type": "boolean",
      "description": "Generate a detailed complexity analysis report",
      "default": true
    }
  },
  "required": [
    "projectRoot"
  ]
}
```

---

### sa_expand_task

**Description:** AI-powered task expansion to break down high-level tasks into detailed subtasks

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "taskId": {
      "type": "string",
      "description": "ID of the task to expand into subtasks"
    },
    "numSubtasks": {
      "type": "number",
      "description": "Number of subtasks to generate (default: auto-determine)",
      "minimum": 2,
      "maximum": 20
    },
    "tasksFile": {
      "type": "string",
      "description": "Path to tasks file (optional, will use project tasks.json)"
    },
    "useResearch": {
      "type": "boolean",
      "description": "Enable AI research mode for enhanced subtask generation",
      "default": false
    },
    "force": {
      "type": "boolean",
      "description": "Force expansion even if subtasks already exist",
      "default": false
    },
    "contextPrompt": {
      "type": "string",
      "description": "Additional context or specific requirements for subtask generation"
    },
    "skillLevel": {
      "type": "string",
      "enum": [
        "beginner",
        "intermediate",
        "advanced"
      ],
      "description": "Target skill level for subtask complexity",
      "default": "intermediate"
    }
  },
  "required": [
    "projectRoot",
    "taskId"
  ]
}
```

---

### sa_generate_tasks

**Description:** AI-powered task generation from requirements, contexts, or templates with intelligent task creation

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "generationType": {
      "type": "string",
      "enum": [
        "requirements",
        "template",
        "context",
        "feature",
        "bug-fix",
        "enhancement"
      ],
      "description": "Type of task generation to perform",
      "default": "requirements"
    },
    "input": {
      "type": "string",
      "description": "Input text for task generation (requirements, feature description, bug report, etc.)"
    },
    "templateName": {
      "type": "string",
      "description": "Name of template to use for template-based generation"
    },
    "numTasks": {
      "type": "number",
      "description": "Number of tasks to generate (default: auto-determine)",
      "minimum": 1,
      "maximum": 25,
      "default": 5
    },
    "outputFile": {
      "type": "string",
      "description": "Output file path (optional, will use project tasks.json)"
    },
    "priority": {
      "type": "string",
      "enum": [
        "high",
        "medium",
        "low"
      ],
      "description": "Default priority for generated tasks",
      "default": "medium"
    },
    "complexity": {
      "type": "string",
      "enum": [
        "low",
        "medium",
        "high"
      ],
      "description": "Target complexity level for generated tasks",
      "default": "medium"
    },
    "useResearch": {
      "type": "boolean",
      "description": "Enable AI research mode for enhanced task generation",
      "default": false
    },
    "append": {
      "type": "boolean",
      "description": "Append generated tasks to existing tasks",
      "default": false
    },
    "teamSize": {
      "type": "number",
      "description": "Team size for task scoping",
      "minimum": 1,
      "maximum": 20,
      "default": 3
    },
    "timeline": {
      "type": "string",
      "description": "Project timeline for effort estimation (e.g., \"2 weeks\", \"1 month\")",
      "default": "4 weeks"
    },
    "technologies": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Technologies being used in the project"
    }
  },
  "required": [
    "projectRoot",
    "generationType"
  ]
}
```

---

### sa_parse_prd

**Description:** Parse Product Requirements Document (PRD) and generate initial tasks using AI

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "prdPath": {
      "type": "string",
      "description": "Path to the PRD document file (.txt, .md, etc.)"
    },
    "numTasks": {
      "type": "number",
      "description": "Approximate number of top-level tasks to generate (default: 10)",
      "default": 10,
      "minimum": 1,
      "maximum": 50
    },
    "outputPath": {
      "type": "string",
      "description": "Output path for generated tasks (optional, will use project tasks.json)"
    },
    "force": {
      "type": "boolean",
      "description": "Overwrite existing tasks without prompting",
      "default": false
    },
    "append": {
      "type": "boolean",
      "description": "Append generated tasks to existing tasks",
      "default": false
    },
    "useResearch": {
      "type": "boolean",
      "description": "Enable AI research mode for enhanced task generation",
      "default": false
    },
    "complexity": {
      "type": "string",
      "enum": [
        "low",
        "medium",
        "high"
      ],
      "description": "Expected project complexity level",
      "default": "medium"
    }
  },
  "required": [
    "projectRoot",
    "prdPath"
  ]
}
```

---

## Analyst Tools

### sa_brainstorm_session

**Description:** Facilitate structured brainstorming sessions with idea collection, organization, session progress tracking, and output synthesis

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "topic": {
      "type": "string",
      "description": "Topic or challenge for brainstorming",
      "minLength": 1
    },
    "sessionType": {
      "type": "string",
      "description": "Type of brainstorming session",
      "enum": [
        "creative-ideation",
        "problem-solving",
        "feature-brainstorm",
        "strategic-planning",
        "risk-assessment",
        "opportunity-exploration"
      ],
      "default": "creative-ideation"
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "participants": {
      "type": "array",
      "description": "List of brainstorming participants",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "expertise": {
            "type": "string"
          }
        },
        "required": [
          "name",
          "role"
        ]
      }
    },
    "duration": {
      "type": "integer",
      "description": "Session duration in minutes",
      "minimum": 15,
      "maximum": 240,
      "default": 60
    },
    "technique": {
      "type": "string",
      "description": "Brainstorming technique to use",
      "enum": [
        "mind-mapping",
        "six-thinking-hats",
        "scamper",
        "brainwriting",
        "rapid-ideation",
        "affinity-mapping",
        "crazy-8s"
      ],
      "default": "rapid-ideation"
    },
    "context": {
      "type": "object",
      "description": "Additional context for the session",
      "properties": {
        "background": {
          "type": "string"
        },
        "constraints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "goals": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "successCriteria": {
          "type": "string"
        }
      }
    },
    "facilitationMode": {
      "type": "string",
      "description": "Level of facilitation guidance",
      "enum": [
        "guided",
        "structured",
        "freestyle"
      ],
      "default": "structured"
    },
    "outputFormat": {
      "type": "string",
      "description": "Format for session output",
      "enum": [
        "detailed-report",
        "action-items",
        "idea-catalog",
        "mind-map"
      ],
      "default": "detailed-report"
    }
  },
  "required": [
    "topic"
  ]
}
```

---

### sa_competitor_analysis

**Description:** Conduct comprehensive competitive analysis with competitor identification, analysis framework application, competitive landscape mapping, and strategic recommendations

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "industry": {
      "type": "string",
      "description": "Industry or market segment for analysis",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "competitors": {
      "type": "array",
      "description": "Known competitors to analyze",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "direct",
              "indirect",
              "substitute"
            ]
          },
          "url": {
            "type": "string"
          },
          "marketShare": {
            "type": "string"
          },
          "notes": {
            "type": "string"
          }
        },
        "required": [
          "name",
          "type"
        ]
      }
    },
    "analysisScope": {
      "type": "string",
      "description": "Scope of competitive analysis",
      "enum": [
        "comprehensive",
        "feature-focused",
        "market-positioning",
        "pricing-analysis",
        "swot-analysis"
      ],
      "default": "comprehensive"
    },
    "targetProduct": {
      "type": "object",
      "description": "Your product/service being positioned",
      "properties": {
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "targetMarket": {
          "type": "string"
        },
        "keyFeatures": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "valueProposition": {
          "type": "string"
        }
      }
    },
    "analysisFramework": {
      "type": "string",
      "description": "Analysis framework to use",
      "enum": [
        "porter-five-forces",
        "swot-matrix",
        "feature-comparison",
        "positioning-map",
        "blue-ocean"
      ],
      "default": "swot-matrix"
    },
    "geoScope": {
      "type": "string",
      "description": "Geographic scope for analysis",
      "enum": [
        "local",
        "national",
        "regional",
        "global"
      ],
      "default": "national"
    },
    "outputFormat": {
      "type": "string",
      "description": "Output format for analysis",
      "enum": [
        "detailed-report",
        "executive-summary",
        "comparison-matrix",
        "strategic-brief"
      ],
      "default": "detailed-report"
    },
    "includeRecommendations": {
      "type": "boolean",
      "description": "Include strategic recommendations",
      "default": true
    }
  },
  "required": [
    "industry"
  ]
}
```

---

### sa_create_brief

**Description:** Create comprehensive project briefs with interactive creation workflow and stakeholder input collection

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectName": {
      "type": "string",
      "description": "Name of the project for the brief",
      "minLength": 1
    },
    "projectType": {
      "type": "string",
      "description": "Type of project",
      "enum": [
        "software-development",
        "web-application",
        "mobile-app",
        "api-service",
        "data-analysis",
        "research",
        "product-launch",
        "other"
      ],
      "default": "software-development"
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "briefType": {
      "type": "string",
      "description": "Type of brief to create",
      "enum": [
        "standard",
        "enhanced",
        "technical",
        "executive"
      ],
      "default": "enhanced"
    },
    "stakeholders": {
      "type": "array",
      "description": "List of project stakeholders",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "influence": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          }
        },
        "required": [
          "name",
          "role"
        ]
      }
    },
    "businessContext": {
      "type": "object",
      "description": "Business context information",
      "properties": {
        "industry": {
          "type": "string"
        },
        "marketSize": {
          "type": "string"
        },
        "targetAudience": {
          "type": "string"
        },
        "businessModel": {
          "type": "string"
        },
        "revenue": {
          "type": "string"
        }
      }
    },
    "constraints": {
      "type": "object",
      "description": "Project constraints",
      "properties": {
        "budget": {
          "type": "string"
        },
        "timeline": {
          "type": "string"
        },
        "resources": {
          "type": "string"
        },
        "technical": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "regulatory": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "interactive": {
      "type": "boolean",
      "description": "Enable interactive brief creation workflow",
      "default": true
    },
    "outputFormat": {
      "type": "string",
      "description": "Output format for the brief",
      "enum": [
        "markdown",
        "yaml",
        "json",
        "interactive"
      ],
      "default": "interactive"
    }
  },
  "required": [
    "projectName"
  ]
}
```

---

### sa_research_market

**Description:** Conduct comprehensive market research analysis with data collection workflows and formatted output

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "marketArea": {
      "type": "string",
      "description": "The market area or industry to research",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "researchScope": {
      "type": "string",
      "description": "Scope of research",
      "enum": [
        "comprehensive",
        "focused",
        "quick-scan"
      ],
      "default": "comprehensive"
    },
    "targetAudience": {
      "type": "string",
      "description": "Target audience for the research"
    },
    "competitors": {
      "type": "array",
      "description": "Known competitors to include in research",
      "items": {
        "type": "string"
      }
    },
    "geoFocus": {
      "type": "string",
      "description": "Geographic focus for the research",
      "default": "global"
    },
    "outputFormat": {
      "type": "string",
      "description": "Output format for the research",
      "enum": [
        "detailed-report",
        "executive-summary",
        "presentation-notes"
      ],
      "default": "detailed-report"
    },
    "interactive": {
      "type": "boolean",
      "description": "Enable interactive research session",
      "default": true
    }
  },
  "required": [
    "marketArea"
  ]
}
```

---

## Product-owner Tools

### sa_correct_course

**Description:** Identify project issues, plan course corrections, execute remediation workflows, and monitor progress for project recovery

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "correctionId": {
      "type": "string",
      "description": "Unique identifier for the course correction",
      "minLength": 1
    },
    "issueContext": {
      "type": "object",
      "description": "Context of the issue requiring course correction",
      "properties": {
        "issueType": {
          "type": "string",
          "enum": [
            "schedule-delay",
            "quality-issues",
            "scope-creep",
            "resource-constraints",
            "technical-blockers",
            "stakeholder-concerns",
            "team-performance",
            "custom"
          ],
          "default": "custom"
        },
        "severity": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ],
          "default": "medium"
        },
        "description": {
          "type": "string"
        },
        "impactArea": {
          "type": "string",
          "enum": [
            "timeline",
            "budget",
            "quality",
            "scope",
            "team",
            "stakeholders",
            "all"
          ]
        },
        "affectedComponents": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "discoveredDate": {
          "type": "string"
        },
        "reportedBy": {
          "type": "string"
        }
      },
      "required": [
        "issueType",
        "severity"
      ]
    },
    "currentState": {
      "type": "object",
      "description": "Current project state and metrics",
      "properties": {
        "projectHealth": {
          "type": "string",
          "enum": [
            "healthy",
            "at-risk",
            "critical",
            "failing"
          ]
        },
        "schedule": {
          "type": "object",
          "properties": {
            "originalEndDate": {
              "type": "string"
            },
            "currentEndDate": {
              "type": "string"
            },
            "delayDays": {
              "type": "number"
            },
            "completionPercentage": {
              "type": "number"
            }
          }
        },
        "budget": {
          "type": "object",
          "properties": {
            "originalBudget": {
              "type": "number"
            },
            "spentAmount": {
              "type": "number"
            },
            "remainingBudget": {
              "type": "number"
            },
            "projectedOverrun": {
              "type": "number"
            }
          }
        },
        "quality": {
          "type": "object",
          "properties": {
            "qualityScore": {
              "type": "number"
            },
            "defectCount": {
              "type": "number"
            },
            "testCoverage": {
              "type": "number"
            },
            "technicalDebt": {
              "type": "string"
            }
          }
        },
        "team": {
          "type": "object",
          "properties": {
            "availableCapacity": {
              "type": "number"
            },
            "utilizationRate": {
              "type": "number"
            },
            "velocityTrend": {
              "type": "string"
            },
            "teamMorale": {
              "type": "string"
            }
          }
        }
      }
    },
    "correctionScope": {
      "type": "string",
      "description": "Scope of the course correction",
      "enum": [
        "immediate",
        "sprint",
        "milestone",
        "project",
        "strategic"
      ],
      "default": "sprint"
    },
    "correctionStrategy": {
      "type": "string",
      "description": "Strategy for course correction",
      "enum": [
        "scope-reduction",
        "resource-addition",
        "timeline-extension",
        "quality-improvement",
        "process-optimization",
        "stakeholder-alignment",
        "comprehensive"
      ],
      "default": "comprehensive"
    },
    "constraints": {
      "type": "object",
      "description": "Constraints for the course correction",
      "properties": {
        "budgetConstraint": {
          "type": "number"
        },
        "timeConstraint": {
          "type": "string"
        },
        "resourceConstraint": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "qualityConstraint": {
          "type": "number"
        },
        "scopeConstraint": {
          "type": "boolean"
        }
      }
    },
    "stakeholders": {
      "type": "object",
      "description": "Stakeholder information",
      "properties": {
        "decisionMakers": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "affectedParties": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "communicationPlan": {
          "type": "boolean",
          "default": true
        },
        "approvalRequired": {
          "type": "boolean",
          "default": true
        }
      }
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "executionMode": {
      "type": "string",
      "description": "How to execute the course correction",
      "enum": [
        "plan-only",
        "plan-and-execute",
        "monitor-existing"
      ],
      "default": "plan-and-execute"
    }
  },
  "required": [
    "correctionId",
    "issueContext"
  ]
}
```

---

### sa_execute_checklist

**Description:** Load and execute checklists with progress tracking, validation criteria, and completion reporting for systematic workflow management

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "checklistId": {
      "type": "string",
      "description": "Unique identifier for the checklist to execute",
      "minLength": 1
    },
    "checklistType": {
      "type": "string",
      "description": "Type of checklist to execute",
      "enum": [
        "story-readiness",
        "sprint-planning",
        "release-preparation",
        "feature-validation",
        "requirements-review",
        "custom"
      ],
      "default": "custom"
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "checklistSource": {
      "type": "object",
      "description": "Source of the checklist",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "file",
            "template",
            "inline"
          ],
          "default": "template"
        },
        "path": {
          "type": "string"
        },
        "template": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "type": "object"
          }
        }
      }
    },
    "executionContext": {
      "type": "object",
      "description": "Context for checklist execution",
      "properties": {
        "storyId": {
          "type": "string"
        },
        "sprintId": {
          "type": "string"
        },
        "releaseId": {
          "type": "string"
        },
        "featureId": {
          "type": "string"
        },
        "assignee": {
          "type": "string"
        },
        "dueDate": {
          "type": "string"
        },
        "priority": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ]
        }
      }
    },
    "executionMode": {
      "type": "string",
      "description": "How to execute the checklist",
      "enum": [
        "interactive",
        "automated",
        "validation-only",
        "progress-check"
      ],
      "default": "interactive"
    },
    "validationRules": {
      "type": "object",
      "description": "Validation rules for checklist items",
      "properties": {
        "requireEvidence": {
          "type": "boolean",
          "default": false
        },
        "requireApproval": {
          "type": "boolean",
          "default": false
        },
        "allowPartialCompletion": {
          "type": "boolean",
          "default": true
        },
        "minimumScore": {
          "type": "number",
          "default": 80
        }
      }
    },
    "progressTracking": {
      "type": "object",
      "description": "Progress tracking configuration",
      "properties": {
        "saveProgress": {
          "type": "boolean",
          "default": true
        },
        "generateReport": {
          "type": "boolean",
          "default": true
        },
        "notifyStakeholders": {
          "type": "boolean",
          "default": false
        },
        "updateWorkflow": {
          "type": "boolean",
          "default": false
        }
      }
    }
  },
  "required": [
    "checklistId",
    "checklistType"
  ]
}
```

---

### sa_shard_document

**Description:** Analyze documents and break them into logical shards using intelligent strategies for better manageability and processing

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "documentId": {
      "type": "string",
      "description": "Unique identifier for the document to shard",
      "minLength": 1
    },
    "documentSource": {
      "type": "object",
      "description": "Source of the document to shard",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "file",
            "url",
            "text",
            "project"
          ],
          "default": "file"
        },
        "path": {
          "type": "string"
        },
        "url": {
          "type": "string"
        },
        "content": {
          "type": "string"
        },
        "projectPath": {
          "type": "string"
        }
      }
    },
    "shardingStrategy": {
      "type": "string",
      "description": "Strategy for document sharding",
      "enum": [
        "semantic",
        "structural",
        "length-based",
        "topic-based",
        "section-based",
        "custom"
      ],
      "default": "semantic"
    },
    "shardingConfig": {
      "type": "object",
      "description": "Configuration for sharding strategy",
      "properties": {
        "maxShardSize": {
          "type": "number",
          "default": 2000
        },
        "minShardSize": {
          "type": "number",
          "default": 100
        },
        "overlapSize": {
          "type": "number",
          "default": 50
        },
        "preserveStructure": {
          "type": "boolean",
          "default": true
        },
        "maintainContext": {
          "type": "boolean",
          "default": true
        },
        "targetShardCount": {
          "type": "number"
        },
        "splitMarkers": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "outputFormat": {
      "type": "string",
      "description": "Format for output shards",
      "enum": [
        "json",
        "markdown",
        "text",
        "structured"
      ],
      "default": "structured"
    },
    "validationRules": {
      "type": "object",
      "description": "Rules for validating shards",
      "properties": {
        "ensureCompleteness": {
          "type": "boolean",
          "default": true
        },
        "validateContext": {
          "type": "boolean",
          "default": true
        },
        "checkOverlap": {
          "type": "boolean",
          "default": true
        },
        "maintainReferences": {
          "type": "boolean",
          "default": true
        }
      }
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "outputPath": {
      "type": "string",
      "description": "Path to save sharded documents (optional)"
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata for the sharding operation",
      "properties": {
        "purpose": {
          "type": "string"
        },
        "author": {
          "type": "string"
        },
        "version": {
          "type": "string"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    }
  },
  "required": [
    "documentId",
    "documentSource"
  ]
}
```

---

### sa_validate_story_draft

**Description:** Validate story draft completeness, check quality criteria, validate dependencies, and manage approval workflow for user stories

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "storyId": {
      "type": "string",
      "description": "Unique identifier for the story being validated",
      "minLength": 1
    },
    "storyDraft": {
      "type": "object",
      "description": "The story draft to validate",
      "properties": {
        "title": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string"
        },
        "userRole": {
          "type": "string"
        },
        "action": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "acceptanceCriteria": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "priority": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ]
        },
        "storyPoints": {
          "type": "number"
        },
        "assignee": {
          "type": "string"
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "epicId": {
          "type": "string"
        },
        "sprintId": {
          "type": "string"
        }
      },
      "required": [
        "title"
      ]
    },
    "validationCriteria": {
      "type": "object",
      "description": "Criteria for story validation",
      "properties": {
        "requireUserStoryFormat": {
          "type": "boolean",
          "default": true
        },
        "requireAcceptanceCriteria": {
          "type": "boolean",
          "default": true
        },
        "requireEstimation": {
          "type": "boolean",
          "default": true
        },
        "requireDependencyCheck": {
          "type": "boolean",
          "default": true
        },
        "minimumDescriptionLength": {
          "type": "number",
          "default": 50
        },
        "minimumAcceptanceCriteria": {
          "type": "number",
          "default": 2
        },
        "qualityThreshold": {
          "type": "number",
          "default": 80
        }
      }
    },
    "dependencies": {
      "type": "object",
      "description": "Story dependencies to validate",
      "properties": {
        "blockedBy": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "blocks": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "relatedTo": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "childOf": {
          "type": "string"
        },
        "parentOf": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "projectContext": {
      "type": "object",
      "description": "Project context for validation",
      "properties": {
        "projectId": {
          "type": "string"
        },
        "teamCapacity": {
          "type": "number"
        },
        "sprintCapacity": {
          "type": "number"
        },
        "techStack": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "businessRules": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "approvalWorkflow": {
      "type": "object",
      "description": "Approval workflow configuration",
      "properties": {
        "requireStakeholderApproval": {
          "type": "boolean",
          "default": false
        },
        "requiredApprovers": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "approvalCriteria": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "autoApprovalThreshold": {
          "type": "number",
          "default": 95
        }
      }
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    }
  },
  "required": [
    "storyId",
    "storyDraft"
  ]
}
```

---

## Pm Tools

### sa_create_epic

**Description:** Create and manage epics with user story breakdown, epic prioritization, and comprehensive documentation

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "epicName": {
      "type": "string",
      "description": "Name of the epic",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "epicType": {
      "type": "string",
      "description": "Type of epic",
      "enum": [
        "feature-epic",
        "infrastructure-epic",
        "enhancement-epic",
        "maintenance-epic",
        "research-epic"
      ],
      "default": "feature-epic"
    },
    "businessValue": {
      "type": "object",
      "description": "Business value information",
      "properties": {
        "objective": {
          "type": "string"
        },
        "outcomes": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "impact": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        },
        "urgency": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        },
        "revenue": {
          "type": "string"
        }
      }
    },
    "userPersonas": {
      "type": "array",
      "description": "Target user personas for this epic",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "needs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "name",
          "role"
        ]
      }
    },
    "acceptanceCriteria": {
      "type": "array",
      "description": "High-level acceptance criteria for the epic",
      "items": {
        "type": "string"
      }
    },
    "constraints": {
      "type": "object",
      "description": "Epic constraints",
      "properties": {
        "timeline": {
          "type": "string"
        },
        "budget": {
          "type": "string"
        },
        "resources": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "technical": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "dependencies": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "generateUserStories": {
      "type": "boolean",
      "description": "Generate initial user stories breakdown",
      "default": true
    },
    "storyEstimation": {
      "type": "string",
      "description": "Estimation method for user stories",
      "enum": [
        "story-points",
        "t-shirt-sizes",
        "hours",
        "complexity"
      ],
      "default": "story-points"
    },
    "priority": {
      "type": "string",
      "description": "Epic priority",
      "enum": [
        "critical",
        "high",
        "medium",
        "low"
      ],
      "default": "medium"
    }
  },
  "required": [
    "epicName"
  ]
}
```

---

### sa_generate_prd

**Description:** Generate comprehensive Product Requirements Documents with template selection, interactive creation workflow, requirements gathering, and validation

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "productName": {
      "type": "string",
      "description": "Name of the product for the PRD",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "prdType": {
      "type": "string",
      "description": "Type of PRD to generate",
      "enum": [
        "standard",
        "brownfield",
        "feature-prd",
        "epic-prd",
        "mvp-prd"
      ],
      "default": "standard"
    },
    "projectType": {
      "type": "string",
      "description": "Type of project",
      "enum": [
        "greenfield",
        "brownfield",
        "enhancement",
        "new-feature"
      ],
      "default": "greenfield"
    },
    "productInfo": {
      "type": "object",
      "description": "Product information",
      "properties": {
        "vision": {
          "type": "string"
        },
        "mission": {
          "type": "string"
        },
        "targetMarket": {
          "type": "string"
        },
        "valueProposition": {
          "type": "string"
        },
        "businessGoals": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "stakeholders": {
      "type": "array",
      "description": "Product stakeholders",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "responsibility": {
            "type": "string"
          },
          "influence": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          }
        },
        "required": [
          "name",
          "role"
        ]
      }
    },
    "userPersonas": {
      "type": "array",
      "description": "Target user personas",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "goals": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "painPoints": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "demographics": {
            "type": "string"
          }
        },
        "required": [
          "name",
          "description"
        ]
      }
    },
    "requirements": {
      "type": "object",
      "description": "Initial requirements",
      "properties": {
        "functional": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "nonFunctional": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "technical": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "business": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "constraints": {
      "type": "object",
      "description": "Project constraints",
      "properties": {
        "timeline": {
          "type": "string"
        },
        "budget": {
          "type": "string"
        },
        "resources": {
          "type": "string"
        },
        "technical": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "regulatory": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "interactive": {
      "type": "boolean",
      "description": "Enable interactive PRD creation workflow",
      "default": true
    },
    "detailLevel": {
      "type": "string",
      "description": "Level of detail for the PRD",
      "enum": [
        "high-level",
        "detailed",
        "comprehensive"
      ],
      "default": "detailed"
    }
  },
  "required": [
    "productName"
  ]
}
```

---

### sa_prioritize_features

**Description:** Prioritize features using impact analysis, priority matrix application, stakeholder feedback integration, and strategic priority recommendations

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "features": {
      "type": "array",
      "description": "List of features to prioritize",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "effort": {
            "type": "number",
            "minimum": 1,
            "maximum": 10
          },
          "businessValue": {
            "type": "number",
            "minimum": 1,
            "maximum": 10
          },
          "userImpact": {
            "type": "number",
            "minimum": 1,
            "maximum": 10
          },
          "urgency": {
            "type": "string",
            "enum": [
              "low",
              "medium",
              "high"
            ]
          },
          "riskLevel": {
            "type": "string",
            "enum": [
              "low",
              "medium",
              "high"
            ]
          },
          "dependencies": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "name",
          "description"
        ]
      },
      "minItems": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "prioritizationMethod": {
      "type": "string",
      "description": "Method for prioritization",
      "enum": [
        "rice",
        "moscow",
        "kano",
        "value-effort",
        "weighted-scoring",
        "cost-of-delay"
      ],
      "default": "rice"
    },
    "stakeholderWeights": {
      "type": "object",
      "description": "Weights for different stakeholder perspectives",
      "properties": {
        "business": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "technical": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "user": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "strategic": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        }
      }
    },
    "constraints": {
      "type": "object",
      "description": "Prioritization constraints",
      "properties": {
        "timeframe": {
          "type": "string"
        },
        "resourceLimits": {
          "type": "string"
        },
        "budgetConstraints": {
          "type": "string"
        },
        "technicalConstraints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "stakeholderFeedback": {
      "type": "array",
      "description": "Stakeholder feedback on features",
      "items": {
        "type": "object",
        "properties": {
          "stakeholder": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "featureId": {
            "type": "string"
          },
          "priority": {
            "type": "string",
            "enum": [
              "critical",
              "high",
              "medium",
              "low"
            ]
          },
          "comments": {
            "type": "string"
          }
        }
      }
    },
    "outputFormat": {
      "type": "string",
      "description": "Output format for prioritization results",
      "enum": [
        "detailed-analysis",
        "priority-matrix",
        "roadmap-view",
        "stakeholder-summary"
      ],
      "default": "detailed-analysis"
    }
  },
  "required": [
    "features"
  ]
}
```

---

### sa_stakeholder_analysis

**Description:** Conduct comprehensive stakeholder analysis with identification, influence/interest mapping, communication planning, and stakeholder management workflows

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectName": {
      "type": "string",
      "description": "Name of the project for stakeholder analysis",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "stakeholders": {
      "type": "array",
      "description": "Known stakeholders",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "role": {
            "type": "string"
          },
          "organization": {
            "type": "string"
          },
          "influence": {
            "type": "string",
            "enum": [
              "very-high",
              "high",
              "medium",
              "low",
              "very-low"
            ]
          },
          "interest": {
            "type": "string",
            "enum": [
              "very-high",
              "high",
              "medium",
              "low",
              "very-low"
            ]
          },
          "attitude": {
            "type": "string",
            "enum": [
              "champion",
              "supporter",
              "neutral",
              "critic",
              "blocker"
            ]
          },
          "contactInfo": {
            "type": "string"
          },
          "preferredCommunication": {
            "type": "string",
            "enum": [
              "email",
              "meetings",
              "slack",
              "phone",
              "formal-reports"
            ]
          },
          "availability": {
            "type": "string"
          },
          "expertise": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "concerns": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "expectations": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "name",
          "role"
        ]
      }
    },
    "projectPhase": {
      "type": "string",
      "description": "Current project phase",
      "enum": [
        "initiation",
        "planning",
        "execution",
        "monitoring",
        "closure"
      ],
      "default": "planning"
    },
    "analysisType": {
      "type": "string",
      "description": "Type of stakeholder analysis",
      "enum": [
        "comprehensive",
        "influence-interest",
        "communication-focused",
        "risk-assessment"
      ],
      "default": "comprehensive"
    },
    "communicationNeeds": {
      "type": "object",
      "description": "Communication requirements",
      "properties": {
        "frequency": {
          "type": "string",
          "enum": [
            "daily",
            "weekly",
            "bi-weekly",
            "monthly",
            "quarterly",
            "as-needed"
          ]
        },
        "formality": {
          "type": "string",
          "enum": [
            "formal",
            "semi-formal",
            "informal"
          ]
        },
        "channels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "reportingStructure": {
          "type": "string"
        }
      }
    },
    "riskFactors": {
      "type": "array",
      "description": "Known stakeholder-related risks",
      "items": {
        "type": "object",
        "properties": {
          "stakeholder": {
            "type": "string"
          },
          "risk": {
            "type": "string"
          },
          "probability": {
            "type": "string",
            "enum": [
              "very-high",
              "high",
              "medium",
              "low",
              "very-low"
            ]
          },
          "impact": {
            "type": "string",
            "enum": [
              "very-high",
              "high",
              "medium",
              "low",
              "very-low"
            ]
          },
          "mitigation": {
            "type": "string"
          }
        }
      }
    },
    "generateCommunicationPlan": {
      "type": "boolean",
      "description": "Generate detailed communication plan",
      "default": true
    }
  },
  "required": [
    "projectName"
  ]
}
```

---

## Scrum-master Tools

### sa_create_next_story

**Description:** Generate next story based on project context, dependency analysis, and story prioritization workflows

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "contextId": {
      "type": "string",
      "minLength": 1
    },
    "currentStory": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "status": {
          "type": "string"
        },
        "epic": {
          "type": "string"
        },
        "dependencies": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "projectContext": {
      "type": "object",
      "properties": {
        "backlog": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "completedStories": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "currentSprint": {
          "type": "object"
        },
        "teamCapacity": {
          "type": "number"
        },
        "businessPriorities": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "generationCriteria": {
      "type": "object",
      "properties": {
        "strategy": {
          "type": "string",
          "enum": [
            "dependency-based",
            "priority-based",
            "epic-continuation",
            "gap-filling",
            "user-journey"
          ],
          "default": "dependency-based"
        },
        "targetPoints": {
          "type": "number",
          "default": 5
        },
        "considerCapacity": {
          "type": "boolean",
          "default": true
        },
        "focusArea": {
          "type": "string"
        }
      }
    },
    "projectPath": {
      "type": "string",
      "default": "/home/ebube/PROJECTS/super-agents"
    }
  },
  "required": [
    "contextId"
  ]
}
```

---

### sa_create_story

**Description:** Create well-structured user stories with template selection, requirements breakdown, and story validation

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "storyTitle": {
      "type": "string",
      "minLength": 1
    },
    "storyTemplate": {
      "type": "string",
      "enum": [
        "user-story",
        "technical-story",
        "bug-fix",
        "spike",
        "epic-breakdown"
      ],
      "default": "user-story"
    },
    "storyDetails": {
      "type": "object",
      "properties": {
        "userRole": {
          "type": "string"
        },
        "action": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "priority": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ]
        },
        "storyPoints": {
          "type": "number"
        },
        "epicId": {
          "type": "string"
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "acceptanceCriteria": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "projectPath": {
      "type": "string",
      "default": "/home/ebube/PROJECTS/super-agents"
    }
  },
  "required": [
    "storyTitle"
  ]
}
```

---

### sa_track_progress

**Description:** Track sprint progress with burndown analysis, velocity tracking, team performance metrics, and predictive insights

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "trackingId": {
      "type": "string",
      "minLength": 1
    },
    "trackingPeriod": {
      "type": "object",
      "properties": {
        "startDate": {
          "type": "string"
        },
        "endDate": {
          "type": "string"
        },
        "sprintId": {
          "type": "string"
        },
        "trackingType": {
          "type": "string",
          "enum": [
            "sprint",
            "epic",
            "release",
            "team"
          ],
          "default": "sprint"
        }
      }
    },
    "currentData": {
      "type": "object",
      "properties": {
        "stories": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "team": {
          "type": "object"
        },
        "velocity": {
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "burndown": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "metrics": {
          "type": "object"
        }
      }
    },
    "historicalData": {
      "type": "object",
      "properties": {
        "previousSprints": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "teamHistory": {
          "type": "array",
          "items": {
            "type": "object"
          }
        }
      }
    },
    "goals": {
      "type": "object",
      "properties": {
        "velocityTarget": {
          "type": "number"
        },
        "completionTarget": {
          "type": "number"
        },
        "qualityTarget": {
          "type": "number"
        }
      }
    },
    "projectPath": {
      "type": "string",
      "default": "/home/ebube/PROJECTS/super-agents"
    }
  },
  "required": [
    "trackingId",
    "trackingPeriod"
  ]
}
```

---

### sa_update_workflow

**Description:** Update and manage agile workflows with status tracking, workflow optimization, and process improvement recommendations

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "workflowId": {
      "type": "string",
      "minLength": 1
    },
    "updateType": {
      "type": "string",
      "enum": [
        "status-update",
        "process-change",
        "optimization",
        "impediment-resolution",
        "team-adjustment"
      ],
      "default": "status-update"
    },
    "currentState": {
      "type": "object",
      "properties": {
        "sprint": {
          "type": "object"
        },
        "stories": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "team": {
          "type": "object"
        },
        "impediments": {
          "type": "array",
          "items": {
            "type": "object"
          }
        }
      }
    },
    "updates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          },
          "target": {
            "type": "string"
          },
          "change": {
            "type": "string"
          },
          "reason": {
            "type": "string"
          }
        }
      }
    },
    "improvements": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "projectPath": {
      "type": "string",
      "default": "/home/ebube/PROJECTS/super-agents"
    }
  },
  "required": [
    "workflowId"
  ]
}
```

---

## Tasks Tools

### sa_get_task

**Description:** Get detailed information about a specific task including dependencies, history, and related files

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "taskId": {
      "type": "string",
      "description": "ID of the task to retrieve",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "includeHistory": {
      "type": "boolean",
      "description": "Include task change history",
      "default": true
    },
    "includeDependencies": {
      "type": "boolean",
      "description": "Include task dependencies and dependents",
      "default": true
    },
    "includeFiles": {
      "type": "boolean",
      "description": "Include associated files and resources",
      "default": true
    },
    "includeRelated": {
      "type": "boolean",
      "description": "Include related tasks (same assignee, similar tags)",
      "default": false
    },
    "format": {
      "type": "string",
      "description": "Output format",
      "enum": [
        "detailed",
        "json",
        "summary"
      ],
      "default": "detailed"
    }
  },
  "required": [
    "taskId"
  ]
}
```

---

### sa_list_tasks

**Description:** List and filter tasks from the Super Agents task management system

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "status": {
      "type": "string",
      "description": "Filter tasks by status",
      "enum": [
        "pending",
        "in-progress",
        "completed",
        "cancelled",
        "blocked"
      ]
    },
    "assignee": {
      "type": "string",
      "description": "Filter tasks by assignee"
    },
    "priority": {
      "type": "string",
      "description": "Filter tasks by priority",
      "enum": [
        "low",
        "medium",
        "high",
        "critical"
      ]
    },
    "type": {
      "type": "string",
      "description": "Filter tasks by type",
      "enum": [
        "feature",
        "bug",
        "task",
        "epic",
        "story",
        "setup",
        "review",
        "testing",
        "devops",
        "research",
        "design",
        "documentation"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Filter tasks by tags"
    },
    "search": {
      "type": "string",
      "description": "Search tasks by title or description"
    },
    "limit": {
      "type": "integer",
      "description": "Maximum number of tasks to return",
      "minimum": 1,
      "maximum": 100,
      "default": 20
    },
    "sortBy": {
      "type": "string",
      "description": "Sort tasks by field",
      "enum": [
        "createdAt",
        "updatedAt",
        "priority",
        "title",
        "status",
        "dueDate"
      ],
      "default": "updatedAt"
    },
    "sortOrder": {
      "type": "string",
      "description": "Sort order",
      "enum": [
        "asc",
        "desc"
      ],
      "default": "desc"
    },
    "includeCompleted": {
      "type": "boolean",
      "description": "Include completed tasks in results",
      "default": true
    },
    "includeArchived": {
      "type": "boolean",
      "description": "Include archived tasks in results",
      "default": false
    },
    "format": {
      "type": "string",
      "description": "Output format",
      "enum": [
        "table",
        "json",
        "summary",
        "detailed"
      ],
      "default": "table"
    }
  },
  "required": []
}
```

---

### sa_update_task_status

**Description:** Update the status of a task with validation, notifications, and change tracking

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "taskId": {
      "type": "string",
      "description": "ID of the task to update",
      "minLength": 1
    },
    "status": {
      "type": "string",
      "description": "New status for the task",
      "enum": [
        "pending",
        "in-progress",
        "completed",
        "cancelled",
        "blocked"
      ]
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "comment": {
      "type": "string",
      "description": "Optional comment explaining the status change"
    },
    "assignee": {
      "type": "string",
      "description": "Update assignee along with status (optional)"
    },
    "priority": {
      "type": "string",
      "description": "Update priority along with status (optional)",
      "enum": [
        "low",
        "medium",
        "high",
        "critical"
      ]
    },
    "completionNotes": {
      "type": "string",
      "description": "Notes about task completion (when marking as completed)"
    },
    "blockingReason": {
      "type": "string",
      "description": "Reason for blocking the task (when marking as blocked)"
    },
    "estimatedHours": {
      "type": "number",
      "description": "Update estimated hours (optional)",
      "minimum": 0
    },
    "actualHours": {
      "type": "number",
      "description": "Actual hours spent (when completing task)",
      "minimum": 0
    },
    "notifyAssignee": {
      "type": "boolean",
      "description": "Send notification to assignee about status change",
      "default": false
    },
    "validateTransition": {
      "type": "boolean",
      "description": "Validate that status transition is allowed",
      "default": true
    }
  },
  "required": [
    "taskId",
    "status"
  ]
}
```

---

## Developer Tools

### sa_implement_story

**Description:** Implement user stories with code generation, testing setup, development planning, and implementation workflows

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "storyTitle": {
      "type": "string",
      "description": "Title of the user story to implement",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "storyDetails": {
      "type": "object",
      "description": "User story details",
      "properties": {
        "description": {
          "type": "string"
        },
        "acceptanceCriteria": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "priority": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ]
        },
        "storyPoints": {
          "type": "number"
        },
        "epic": {
          "type": "string"
        },
        "assignee": {
          "type": "string"
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "technicalSpecs": {
      "type": "object",
      "description": "Technical implementation specifications",
      "properties": {
        "framework": {
          "type": "string"
        },
        "language": {
          "type": "string"
        },
        "database": {
          "type": "string"
        },
        "apiEndpoints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "components": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "dependencies": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "testingStrategy": {
          "type": "string"
        }
      }
    },
    "implementationApproach": {
      "type": "string",
      "description": "Implementation approach",
      "enum": [
        "tdd",
        "bdd",
        "traditional",
        "prototype-first"
      ],
      "default": "traditional"
    },
    "codeStyle": {
      "type": "object",
      "description": "Code style preferences",
      "properties": {
        "indentation": {
          "type": "string",
          "enum": [
            "tabs",
            "2-spaces",
            "4-spaces"
          ]
        },
        "naming": {
          "type": "string",
          "enum": [
            "camelCase",
            "snake_case",
            "kebab-case"
          ]
        },
        "comments": {
          "type": "boolean"
        },
        "typescript": {
          "type": "boolean"
        }
      }
    },
    "integrationPoints": {
      "type": "array",
      "description": "Integration points with existing system",
      "items": {
        "type": "object",
        "properties": {
          "system": {
            "type": "string"
          },
          "method": {
            "type": "string"
          },
          "dataFormat": {
            "type": "string"
          },
          "authentication": {
            "type": "string"
          }
        }
      }
    },
    "generateCode": {
      "type": "boolean",
      "description": "Generate code templates and implementation",
      "default": true
    }
  },
  "required": [
    "storyTitle"
  ]
}
```

---

### sa_run_tests

**Description:** Execute comprehensive test suites with coverage analysis, performance testing, and automated test management

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectName": {
      "type": "string",
      "description": "Name of the project to test",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "testTypes": {
      "type": "array",
      "description": "Types of tests to run",
      "items": {
        "type": "string",
        "enum": [
          "unit",
          "integration",
          "e2e",
          "performance",
          "security",
          "accessibility"
        ]
      },
      "default": [
        "unit",
        "integration"
      ]
    },
    "testScope": {
      "type": "string",
      "description": "Scope of testing",
      "enum": [
        "all",
        "changed-files",
        "specific-pattern",
        "failed-only"
      ],
      "default": "all"
    },
    "testPattern": {
      "type": "string",
      "description": "Test file pattern (when scope is specific-pattern)",
      "default": "**/*.test.js"
    },
    "coverage": {
      "type": "object",
      "description": "Coverage configuration",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": true
        },
        "threshold": {
          "type": "number",
          "default": 80
        },
        "format": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "text",
              "html",
              "json",
              "lcov"
            ]
          }
        },
        "collectFrom": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "environment": {
      "type": "string",
      "description": "Test environment",
      "enum": [
        "development",
        "ci",
        "staging",
        "production"
      ],
      "default": "development"
    },
    "parallel": {
      "type": "boolean",
      "description": "Run tests in parallel",
      "default": true
    },
    "watch": {
      "type": "boolean",
      "description": "Watch for changes and re-run tests",
      "default": false
    },
    "verbose": {
      "type": "boolean",
      "description": "Verbose test output",
      "default": false
    },
    "bail": {
      "type": "boolean",
      "description": "Stop on first test failure",
      "default": false
    },
    "testConfig": {
      "type": "object",
      "description": "Additional test configuration",
      "properties": {
        "timeout": {
          "type": "number",
          "default": 10000
        },
        "retries": {
          "type": "number",
          "default": 0
        },
        "setupFiles": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "teardownFiles": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "generateReport": {
      "type": "boolean",
      "description": "Generate comprehensive test report",
      "default": true
    }
  },
  "required": [
    "projectName"
  ]
}
```

---

### sa_validate_implementation

**Description:** Validate implementation with comprehensive code quality analysis, testing verification, performance assessment, and compliance checking

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "implementationName": {
      "type": "string",
      "description": "Name of the implementation to validate",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "validationScope": {
      "type": "array",
      "description": "Scope of validation",
      "items": {
        "type": "string",
        "enum": [
          "code-quality",
          "testing",
          "performance",
          "security",
          "accessibility",
          "compliance",
          "documentation"
        ]
      },
      "default": [
        "code-quality",
        "testing",
        "performance"
      ]
    },
    "validationLevel": {
      "type": "string",
      "description": "Level of validation rigor",
      "enum": [
        "basic",
        "standard",
        "comprehensive",
        "enterprise"
      ],
      "default": "standard"
    },
    "codeLocations": {
      "type": "array",
      "description": "Specific code locations to validate",
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "file",
              "directory",
              "module"
            ]
          },
          "priority": {
            "type": "string",
            "enum": [
              "low",
              "medium",
              "high",
              "critical"
            ]
          }
        }
      }
    },
    "qualityStandards": {
      "type": "object",
      "description": "Quality standards and thresholds",
      "properties": {
        "codeComplexity": {
          "type": "number",
          "default": 10
        },
        "testCoverage": {
          "type": "number",
          "default": 80
        },
        "duplication": {
          "type": "number",
          "default": 5
        },
        "maintainabilityIndex": {
          "type": "number",
          "default": 70
        },
        "performanceThreshold": {
          "type": "number",
          "default": 2000
        },
        "securityLevel": {
          "type": "string",
          "enum": [
            "basic",
            "standard",
            "high",
            "critical"
          ]
        }
      }
    },
    "complianceRequirements": {
      "type": "array",
      "description": "Compliance requirements to check",
      "items": {
        "type": "string",
        "enum": [
          "GDPR",
          "HIPAA",
          "SOX",
          "PCI-DSS",
          "WCAG",
          "ISO-27001",
          "company-standards"
        ]
      }
    },
    "automatedChecks": {
      "type": "boolean",
      "description": "Run automated validation checks",
      "default": true
    },
    "generateReport": {
      "type": "boolean",
      "description": "Generate comprehensive validation report",
      "default": true
    },
    "includeRecommendations": {
      "type": "boolean",
      "description": "Include improvement recommendations",
      "default": true
    }
  },
  "required": [
    "implementationName"
  ]
}
```

---

## Project Tools

### sa_initialize_project

**Description:** Initialize a new Super Agents project with templates, configuration, and initial task setup

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectName": {
      "type": "string",
      "description": "Name of the project to initialize",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path where the project should be created",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "template": {
      "type": "string",
      "description": "Project template to use (optional)",
      "enum": [
        "basic",
        "full-stack",
        "api",
        "frontend",
        "library"
      ],
      "default": "basic"
    },
    "description": {
      "type": "string",
      "description": "Project description (optional)"
    },
    "author": {
      "type": "string",
      "description": "Project author (optional)"
    },
    "license": {
      "type": "string",
      "description": "Project license (optional)",
      "default": "MIT"
    },
    "createTasks": {
      "type": "boolean",
      "description": "Create initial project tasks",
      "default": true
    },
    "createDocs": {
      "type": "boolean",
      "description": "Generate initial documentation",
      "default": true
    }
  },
  "required": [
    "projectName"
  ]
}
```

---

## Qa Tools

### sa_refactor_code

**Description:** Analyze code for refactoring opportunities with pattern detection, technical debt assessment, and automated refactoring plan generation

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "refactoringTarget": {
      "type": "string",
      "description": "Target code or component to refactor",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "refactoringGoals": {
      "type": "array",
      "description": "Refactoring objectives",
      "items": {
        "type": "string",
        "enum": [
          "reduce-complexity",
          "improve-performance",
          "enhance-readability",
          "eliminate-duplication",
          "improve-testability",
          "modernize-code",
          "fix-code-smells"
        ]
      },
      "default": [
        "reduce-complexity",
        "eliminate-duplication",
        "improve-readability"
      ]
    },
    "refactoringScope": {
      "type": "object",
      "description": "Scope of refactoring analysis",
      "properties": {
        "files": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "directories": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "includeTests": {
          "type": "boolean",
          "default": true
        },
        "excludePatterns": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "analysisDepth": {
      "type": "string",
      "description": "Depth of refactoring analysis",
      "enum": [
        "surface",
        "detailed",
        "comprehensive",
        "architectural"
      ],
      "default": "detailed"
    },
    "qualityThresholds": {
      "type": "object",
      "description": "Quality thresholds for refactoring decisions",
      "properties": {
        "complexity": {
          "type": "number",
          "default": 10
        },
        "duplication": {
          "type": "number",
          "default": 5
        },
        "maintainabilityIndex": {
          "type": "number",
          "default": 70
        },
        "testCoverage": {
          "type": "number",
          "default": 80
        }
      }
    },
    "refactoringPreferences": {
      "type": "object",
      "description": "Refactoring approach preferences",
      "properties": {
        "preserveAPI": {
          "type": "boolean",
          "default": true
        },
        "incrementalApproach": {
          "type": "boolean",
          "default": true
        },
        "automatedTools": {
          "type": "boolean",
          "default": true
        },
        "riskTolerance": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high"
          ],
          "default": "medium"
        }
      }
    },
    "codePatterns": {
      "type": "array",
      "description": "Specific code patterns to analyze",
      "items": {
        "type": "string",
        "enum": [
          "god-class",
          "long-method",
          "feature-envy",
          "data-clumps",
          "primitive-obsession",
          "switch-statements",
          "duplicate-code",
          "dead-code"
        ]
      }
    },
    "generatePlan": {
      "type": "boolean",
      "description": "Generate detailed refactoring plan",
      "default": true
    },
    "estimateEffort": {
      "type": "boolean",
      "description": "Estimate refactoring effort and risk",
      "default": true
    }
  },
  "required": [
    "refactoringTarget"
  ]
}
```

---

### sa_review_code

**Description:** Conduct comprehensive code reviews with quality analysis, security assessment, performance evaluation, and improvement recommendations

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "reviewTitle": {
      "type": "string",
      "description": "Title or identifier for the code review",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "reviewScope": {
      "type": "object",
      "description": "Scope of the code review",
      "properties": {
        "files": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "directories": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "changedOnly": {
          "type": "boolean",
          "default": false
        },
        "excludePatterns": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "reviewCriteria": {
      "type": "array",
      "description": "Review criteria to evaluate",
      "items": {
        "type": "string",
        "enum": [
          "code-quality",
          "security",
          "performance",
          "maintainability",
          "readability",
          "testing",
          "documentation",
          "best-practices"
        ]
      },
      "default": [
        "code-quality",
        "security",
        "maintainability",
        "testing"
      ]
    },
    "reviewLevel": {
      "type": "string",
      "description": "Level of review depth",
      "enum": [
        "quick",
        "standard",
        "thorough",
        "comprehensive"
      ],
      "default": "standard"
    },
    "codingStandards": {
      "type": "object",
      "description": "Coding standards to enforce",
      "properties": {
        "styleGuide": {
          "type": "string"
        },
        "complexity": {
          "type": "number",
          "default": 10
        },
        "lineLength": {
          "type": "number",
          "default": 120
        },
        "functionLength": {
          "type": "number",
          "default": 50
        },
        "classSize": {
          "type": "number",
          "default": 300
        },
        "duplication": {
          "type": "number",
          "default": 5
        }
      }
    },
    "contextInfo": {
      "type": "object",
      "description": "Context information for the review",
      "properties": {
        "pullRequestId": {
          "type": "string"
        },
        "author": {
          "type": "string"
        },
        "reviewers": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "purpose": {
          "type": "string"
        },
        "relatedTickets": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "automatedChecks": {
      "type": "boolean",
      "description": "Run automated code analysis tools",
      "default": true
    },
    "generateReport": {
      "type": "boolean",
      "description": "Generate detailed review report",
      "default": true
    }
  },
  "required": [
    "reviewTitle"
  ]
}
```

---

### sa_review_story

**Description:** Review story completeness, validate acceptance criteria, and check implementation quality against requirements

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "storyId": {
      "type": "string",
      "description": "Unique identifier for the story being reviewed",
      "minLength": 1
    },
    "storyTitle": {
      "type": "string",
      "description": "Title of the story being reviewed",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "storyData": {
      "type": "object",
      "description": "Story data and details",
      "properties": {
        "description": {
          "type": "string"
        },
        "acceptanceCriteria": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "requirements": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "dependencies": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "estimatedEffort": {
          "type": "string"
        },
        "priority": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high",
            "critical"
          ]
        },
        "assignee": {
          "type": "string"
        },
        "status": {
          "type": "string",
          "enum": [
            "todo",
            "in-progress",
            "review",
            "done"
          ]
        }
      }
    },
    "implementationDetails": {
      "type": "object",
      "description": "Implementation details for validation",
      "properties": {
        "filesChanged": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "testFiles": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "documentation": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "pullRequestUrl": {
          "type": "string"
        },
        "commits": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "reviewCriteria": {
      "type": "array",
      "description": "Review criteria to evaluate",
      "items": {
        "type": "string",
        "enum": [
          "completeness",
          "acceptance-criteria",
          "implementation-quality",
          "testing",
          "documentation",
          "dependencies"
        ]
      },
      "default": [
        "completeness",
        "acceptance-criteria",
        "implementation-quality",
        "testing"
      ]
    },
    "reviewLevel": {
      "type": "string",
      "description": "Level of review depth",
      "enum": [
        "quick",
        "standard",
        "thorough"
      ],
      "default": "standard"
    },
    "contextInfo": {
      "type": "object",
      "description": "Context information for the review",
      "properties": {
        "sprintId": {
          "type": "string"
        },
        "epicId": {
          "type": "string"
        },
        "reviewer": {
          "type": "string"
        },
        "reviewDate": {
          "type": "string"
        },
        "stakeholders": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "generateReport": {
      "type": "boolean",
      "description": "Generate detailed review report",
      "default": true
    }
  },
  "required": [
    "storyId",
    "storyTitle"
  ]
}
```

---

### sa_validate_quality

**Description:** Validate code quality with comprehensive metrics analysis, standards compliance checking, quality gate enforcement, and continuous quality monitoring

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "validationTarget": {
      "type": "string",
      "description": "Target for quality validation (project, module, or specific component)",
      "minLength": 1
    },
    "projectPath": {
      "type": "string",
      "description": "Path to the project (defaults to current directory)",
      "default": "/home/ebube/PROJECTS/super-agents"
    },
    "qualityStandards": {
      "type": "object",
      "description": "Quality standards and thresholds",
      "properties": {
        "codeComplexity": {
          "type": "number",
          "default": 10
        },
        "testCoverage": {
          "type": "number",
          "default": 80
        },
        "maintainabilityIndex": {
          "type": "number",
          "default": 70
        },
        "duplicationThreshold": {
          "type": "number",
          "default": 5
        },
        "codeSmellThreshold": {
          "type": "number",
          "default": 10
        },
        "technicalDebtRatio": {
          "type": "number",
          "default": 5
        }
      }
    },
    "validationScopes": {
      "type": "array",
      "description": "Scopes of quality validation",
      "items": {
        "type": "string",
        "enum": [
          "code-metrics",
          "test-quality",
          "security-quality",
          "performance-quality",
          "maintainability",
          "documentation-quality",
          "architecture-quality"
        ]
      },
      "default": [
        "code-metrics",
        "test-quality",
        "maintainability",
        "security-quality"
      ]
    },
    "qualityGates": {
      "type": "array",
      "description": "Quality gates that must pass",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "metric": {
            "type": "string"
          },
          "threshold": {
            "type": "number"
          },
          "operator": {
            "type": "string",
            "enum": [
              ">",
              "<",
              ">=",
              "<=",
              "="
            ]
          },
          "required": {
            "type": "boolean",
            "default": true
          }
        }
      }
    },
    "complianceFrameworks": {
      "type": "array",
      "description": "Compliance frameworks to validate against",
      "items": {
        "type": "string",
        "enum": [
          "ISO-25010",
          "CISQ",
          "SOLID",
          "clean-code",
          "company-standards"
        ]
      }
    },
    "validationLevel": {
      "type": "string",
      "description": "Level of validation rigor",
      "enum": [
        "basic",
        "standard",
        "comprehensive",
        "enterprise"
      ],
      "default": "standard"
    },
    "trendAnalysis": {
      "type": "boolean",
      "description": "Include quality trend analysis",
      "default": true
    },
    "generateReport": {
      "type": "boolean",
      "description": "Generate comprehensive quality report",
      "default": true
    },
    "continuousMonitoring": {
      "type": "boolean",
      "description": "Set up continuous quality monitoring",
      "default": false
    }
  },
  "required": [
    "validationTarget"
  ]
}
```

---

## Workflow Tools

### sa_start_workflow

**Description:** Workflow initiation tool with template selection, parameter configuration, and initial state setup

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "workflowType": {
      "type": "string",
      "enum": [
        "greenfield-fullstack",
        "brownfield-fullstack",
        "greenfield-service",
        "brownfield-service",
        "greenfield-ui",
        "brownfield-ui"
      ],
      "description": "Type of workflow to start based on BMAD workflow definitions"
    },
    "projectName": {
      "type": "string",
      "description": "Name of the project for this workflow"
    },
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "parameters": {
      "type": "object",
      "properties": {
        "technology": {
          "type": "string",
          "description": "Primary technology stack (e.g., React, Node.js, Python)"
        },
        "complexity": {
          "type": "string",
          "enum": [
            "low",
            "medium",
            "high"
          ],
          "description": "Project complexity level"
        },
        "teamSize": {
          "type": "number",
          "description": "Number of team members working on this project"
        },
        "timeline": {
          "type": "string",
          "description": "Expected project timeline (e.g., \"2 weeks\", \"3 months\")"
        }
      },
      "additionalProperties": true
    },
    "templateOverrides": {
      "type": "object",
      "description": "Override default template configurations",
      "additionalProperties": true
    }
  },
  "required": [
    "workflowType",
    "projectName",
    "projectRoot"
  ]
}
```

---

### sa_workflow_status

**Description:** Status monitoring tool for workflow progress, active phases, and completion estimates

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "workflowId": {
      "type": "string",
      "description": "Specific workflow ID to check status (optional, will use active workflow if not provided)"
    },
    "includeDetails": {
      "type": "boolean",
      "description": "Include detailed phase and task information",
      "default": true
    },
    "includeMetrics": {
      "type": "boolean",
      "description": "Include performance and progress metrics",
      "default": true
    },
    "includeBlockers": {
      "type": "boolean",
      "description": "Include information about current blockers",
      "default": true
    }
  },
  "required": [
    "projectRoot"
  ]
}
```

---

### sa_workflow_validation

**Description:** Workflow validation tool for integrity checking, dependency validation, quality gates, and compliance verification

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project root directory"
    },
    "validationType": {
      "type": "string",
      "enum": [
        "integrity",
        "dependencies",
        "quality-gates",
        "compliance",
        "all"
      ],
      "description": "Type of validation to perform",
      "default": "all"
    },
    "severity": {
      "type": "string",
      "enum": [
        "info",
        "warning",
        "error",
        "critical"
      ],
      "description": "Minimum severity level to report",
      "default": "warning"
    },
    "autoFix": {
      "type": "boolean",
      "description": "Attempt to automatically fix issues where possible",
      "default": false
    },
    "generateReport": {
      "type": "boolean",
      "description": "Generate a detailed validation report",
      "default": true
    },
    "customRules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "validation": {
            "type": "string"
          },
          "severity": {
            "type": "string",
            "enum": [
              "info",
              "warning",
              "error",
              "critical"
            ]
          }
        }
      },
      "description": "Custom validation rules to apply"
    }
  },
  "required": [
    "projectRoot"
  ]
}
```

---

## Research Tools

### sa-follow-up-research

**Description:** Continue research conversations with previous context and perform follow-up queries

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "followUpQuery": {
      "type": "string",
      "description": "Follow-up research query building on previous research"
    },
    "previousQuery": {
      "type": "string",
      "description": "Previous research query for context (if not maintaining session)"
    },
    "sessionId": {
      "type": "string",
      "description": "Research session ID to continue (optional)"
    },
    "additionalContext": {
      "type": "string",
      "description": "Additional context for the follow-up query"
    },
    "taskIds": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Additional task IDs to include for follow-up context"
    },
    "filePaths": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Additional file paths to include for follow-up context"
    },
    "detailLevel": {
      "type": "string",
      "enum": [
        "low",
        "medium",
        "high"
      ],
      "description": "Detail level for the follow-up response (default: medium)"
    },
    "refreshTaskDiscovery": {
      "type": "boolean",
      "description": "Re-discover relevant tasks for the follow-up query (default: true)"
    },
    "saveToFile": {
      "type": "boolean",
      "description": "Save the complete conversation to file (default: false)"
    },
    "temperature": {
      "type": "number",
      "description": "AI temperature for follow-up query (0.0-1.0, default: 0.7)"
    }
  },
  "required": [
    "followUpQuery"
  ]
}
```

---

### sa-research

**Description:** Perform AI-powered research queries with project context awareness and intelligent task discovery

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Research query or question to investigate"
    },
    "taskIds": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Specific task IDs to include for context (e.g., [\"1\", \"2.3\", \"4\"])"
    },
    "filePaths": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "File paths to include for context (e.g., [\"src/api.js\", \"docs/readme.md\"])"
    },
    "customContext": {
      "type": "string",
      "description": "Additional custom context text to include in the research"
    },
    "includeProjectTree": {
      "type": "boolean",
      "description": "Include project file tree structure in context (default: false)"
    },
    "detailLevel": {
      "type": "string",
      "enum": [
        "low",
        "medium",
        "high"
      ],
      "description": "Detail level for the research response (default: medium)"
    },
    "autoDiscoverTasks": {
      "type": "boolean",
      "description": "Automatically discover relevant tasks using AI analysis (default: true)"
    },
    "maxDiscoveredTasks": {
      "type": "number",
      "description": "Maximum number of tasks to auto-discover (default: 8)"
    },
    "saveTo": {
      "type": "string",
      "description": "Save research results to specified task/subtask ID (e.g., \"15\" or \"15.2\")"
    },
    "saveToFile": {
      "type": "boolean",
      "description": "Save research results to .super-agents/research/ directory (default: false)"
    },
    "temperature": {
      "type": "number",
      "description": "AI temperature for research query (0.0-1.0, default: 0.7)"
    },
    "maxResponseTokens": {
      "type": "number",
      "description": "Maximum tokens for research response (default: 4000)"
    }
  },
  "required": [
    "query"
  ]
}
```

---

### sa-research-save

**Description:** Save research results and conversations to tasks, subtasks, or files with various formatting options

**Version:** 1.0.0

**Status:** ✅ Enabled

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "Research content to save (query + response + context)"
    },
    "saveTarget": {
      "type": "string",
      "enum": [
        "task",
        "subtask",
        "file"
      ],
      "description": "Where to save the research results"
    },
    "targetId": {
      "type": "string",
      "description": "Task ID (e.g., \"15\") or subtask ID (e.g., \"15.2\") when saving to task/subtask"
    },
    "fileName": {
      "type": "string",
      "description": "Custom filename when saving to file (optional, auto-generated if not provided)"
    },
    "format": {
      "type": "string",
      "enum": [
        "markdown",
        "text",
        "json"
      ],
      "description": "Format for saved content (default: markdown)"
    },
    "appendMode": {
      "type": "boolean",
      "description": "Append to existing content instead of replacing (default: true)"
    },
    "includeMetadata": {
      "type": "boolean",
      "description": "Include metadata like timestamps and context info (default: true)"
    },
    "conversationHistory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string"
          },
          "response": {
            "type": "string"
          },
          "timestamp": {
            "type": "string"
          },
          "type": {
            "type": "string"
          }
        }
      },
      "description": "Full conversation history to save"
    },
    "customMetadata": {
      "type": "object",
      "description": "Additional metadata to include in saved content"
    },
    "directory": {
      "type": "string",
      "description": "Custom directory for file saves (default: .super-agents/research)"
    }
  },
  "required": [
    "content",
    "saveTarget"
  ]
}
```

---

