# Super Agents Framework: Detailed Plan & Roadmap

This document outlines the strategic plan and phased implementation roadmap for the "Super Agents" framework.

## 1. Core Vision & Architecture

### 1.1. Philosophy: "Separate the Engine from the Workspace"

The framework is built on a clear separation of concerns to ensure clarity, modularity, and ease of use.

*   **The Engine (`sa-core/`):** The Super Agents Core methodology. It contains all the agent personas, procedural prompts, and workflow definitions.
*   **The Integrations (`integrations/`):** Provider-specific packaging and instructions for different AI environments (e.g., Claude Code, Gemini CLI).
*   **The Workspace (`.super-agents/`):** The framework's private operational area, storing runtime state, logs, and reports.
*   **The Configuration (`super-agents.config.yaml`):** A single, discoverable configuration file at the project root.

### 1.2. Universal Compatibility by Design

*   **CLI-First:** The `sa` command-line tool is the primary interface, ensuring it can run in any terminal environment.
*   **Text-Based Definitions:** All core components are in human-readable files, making them universally consumable by any AI model.

## 2. The Framework Structure

```
/my-super-agents-project
|
├── sa-core/                          # The "Engine": Super Agents Core methodology.
│   ├── agents/
│   ├── procedures/
│   ├── templates/
│   └── workflows/
|
├── integrations/                     # Provider-specific packaging & instructions.
│   ├── claude-code/
│   │   ├── README.md               # Instructions for setting up with Claude Code sub-agents.
│   │   └── package.js              # Script to bundle agents for Claude Code.
│   └── gemini-cli/
│       └── README.md
|
├── docs/                             # The "Artifacts": User-generated planning documents.
|
├── src/                              # The "Code": The user's actual source code.
|
├── .super-agents/                    # The "Workspace": Runtime data, managed by the CLI.
│   ├── state.json
│   └── logs/
|
└── super-agents.config.yaml          # The "Configuration": Single config file at the root.
```

## 3. The Integrated Workflow & CLI Commands

The workflow remains a four-phase loop, now mapped to the new structure.

**Phase 1: Plan** (`sa plan`)
*   Uses definitions from `sa-core/` to guide the user in creating artifacts in `docs/`.

**Phase 2: Bridge** (`sa parse`)
*   Reads `docs/`, uses a procedure from `sa-core/procedures/`, and generates the initial `.super-agents/state.json`.

**Phase 3: Execute** (`sa next`, `sa done`, etc.)
*   The Developer agent interacts with the CLI to manipulate `.super-agents/state.json` and create code in `src/`.

**Phase 4: Verify** (`sa review`, `sa verify`)
*   The QA agent interacts with the CLI to review code and update the status of tasks in `.super-agents/state.json`.

## 4. Phased Implementation Roadmap

### Phase 1: Foundation & Core Execution Engine

*   **Goal:** Establish the new architecture and the core execution loop.
*   **Tasks:**
    1.  Set up the `super-agents` CLI project.
    2.  Implement `sa install` to scaffold the new directory structure (`sa-core/`, `integrations/`, `.super-agents/`, etc.).
    3.  Implement `sa config` to manage `super-agents.config.yaml`.
    4.  Build the core execution logic (`next`, `list`, `done`) to operate on `.super-agents/state.json`.

### Phase 2: Planning & Bridge Engines

*   **Goal:** Build the planning and parsing capabilities.
*   **Tasks:**
    1.  Implement the `sa plan` command, which reads agent and workflow definitions from the `sa-core/` directory.
    2.  Populate `sa-core/` with the initial set of agents, procedures, and templates.
    3.  Implement the `sa parse` command, which uses a core procedure from `sa-core/procedures/` to create the `state.json` file.

### Phase 3: Quality Loop & Integration

*   **Goal:** Build out the verification process and create provider-specific integrations.
*   **Tasks:**
    1.  Implement the `sa review` and `sa verify` commands.
    2.  Refine the QA agent's workflow within the new structure.
    3.  **Develop provider-specific integration packages in the `integrations/` directory, starting with detailed guides and packaging scripts for Claude Code and Gemini CLI.**

### Phase 4: Advanced Features & Community

*   **Goal:** Add advanced capabilities and foster community adoption.
*   **Tasks:**
    1.  Port advanced features like research-backed task expansion and complexity analysis.
    2.  Develop comprehensive user documentation and tutorials based on the final architecture.
    3.  Establish a contribution guide for users who want to add new agents to `sa-core/` or new guides to `integrations/`.
