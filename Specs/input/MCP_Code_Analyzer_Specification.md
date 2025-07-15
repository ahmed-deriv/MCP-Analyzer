# MCP Server Code Analysis & Reporting Tool - Detailed Specification

## 1. Introduction

### 1.1 Purpose
This document specifies the design and implementation of an MCP (Model Context Protocol) server that provides comprehensive code analysis and reporting capabilities. The tool performs automated analysis of local git repositories, integrates with Large Language Models (LLMs) for advanced insights, and generates detailed HTML reports on demand.

### 1.2 Target Users
- Software developers working in modern editors (VS Code, Cursor, Windsurf, etc.)
- Development teams requiring comprehensive code quality insights
- DevOps engineers integrating code analysis into CI/CD pipelines
- Technical leads and architects monitoring code health

### 1.3 High-Level Overview
The MCP server operates as a single-command solution that:
- Analyzes local git repositories with branch selection capability
- Executes multiple analysis tools in parallel/sequence
- Integrates with LLMs for intelligent code review and suggestions
- Generates a comprehensive, navigable HTML report
- Provides actionable recommendations for code improvement

---

## 2. Features

### 2.1 Git Repository Operations
- **Branch Listing**: Enumerate all available branches in the repository
- **Branch Selection**: Allow user to select specific branch for analysis
- **Branch Checkout**: Automatically switch to selected branch before analysis
- **Repository Status**: Display current branch, commit hash, and repository state

### 2.2 Unit Test Execution & Coverage
- **Multi-Language Support**: JavaScript/TypeScript (Jest, Mocha), Python (pytest), Java (JUnit), etc.
- **Test Execution**: Run complete test suites and capture results
- **Coverage Analysis**: Generate code coverage reports with line-by-line coverage
- **Test Metrics**: Total tests, passed/failed counts, execution time
- **Coverage Visualization**: Interactive coverage maps in HTML report

### 2.3 Security & Dependency Analysis
- **Dependency Auditing**: Scan for known vulnerabilities in dependencies
- **Static Security Analysis**: Identify security patterns and anti-patterns
- **License Compliance**: Check for license compatibility issues
- **Vulnerability Scoring**: CVSS scores and severity classifications
- **Remediation Suggestions**: Automated fix recommendations

### 2.4 Code Metrics & Large File Detection
- **Lines of Code**: Count total lines, code lines, comment lines, blank lines
- **File Size Analysis**: Identify files exceeding configurable thresholds
- **Complexity Metrics**: Cyclomatic complexity, cognitive complexity
- **Maintainability Index**: Calculate maintainability scores
- **Technical Debt**: Estimate technical debt hours

### 2.5 Duplicate Code Detection
- **Cross-File Duplication**: Identify duplicate code blocks across files
- **Similarity Analysis**: Detect near-duplicate code with configurable similarity thresholds
- **Refactoring Opportunities**: Suggest consolidation strategies
- **Duplication Metrics**: Percentage of duplicated code, affected files

### 2.6 Code Quality & Linting
- **Multi-Language Linting**: ESLint, Pylint, RuboCop, etc.
- **Style Guide Compliance**: Check adherence to coding standards
- **Best Practice Violations**: Identify anti-patterns and code smells
- **Quality Gates**: Configurable quality thresholds
- **Auto-Fix Suggestions**: Automated code improvement recommendations

### 2.7 Bug & Improvement Detection
- **Static Analysis**: Use tools like SonarQube, Semgrep for bug detection
- **LLM-Powered Review**: Intelligent code review using language models
- **Performance Issues**: Identify potential performance bottlenecks
- **Architectural Concerns**: Detect design pattern violations
- **Improvement Suggestions**: AI-generated code enhancement recommendations

### 2.8 AI vs Human Code Provenance
- **AI Code Detection**: Scan for AI-generated code markers and patterns
- **Provenance Tracking**: Identify code origin (human vs AI)
- **Compliance Reporting**: Generate reports for AI code usage policies
- **Pattern Recognition**: Use heuristics to identify AI-generated patterns
- **Integration with ShiftAI**: Support for existing AI provenance tools

### 2.9 Bundle Size Analysis & Optimization
- **Build Tool Detection**: Support for Webpack, Vite, Rollup, Parcel, etc.
- **Bundle Analysis**: Analyze build output for size and composition
- **Large Asset Detection**: Identify oversized dependencies and assets
- **Tree-Shaking Analysis**: Detect unused code in bundles
- **Optimization Recommendations**: AI-powered bundle optimization suggestions
- **Performance Impact**: Estimate loading time impact of bundle size

### 2.10 HTML Report Generation
- **Interactive Dashboard**: Rich, navigable HTML interface
- **Data Visualization**: Charts, graphs, and interactive elements
- **Drill-Down Capability**: Navigate from summary to detailed findings
- **Export Options**: PDF export, JSON data export
- **Responsive Design**: Mobile and desktop compatible

---

## 3. Architecture

### 3.1 Technology Stack
- **Runtime**: Node.js (v18+)
- **MCP Framework**: Model Context Protocol server implementation
- **Git Operations**: simple-git library
- **Process Management**: child_process for tool execution
- **Template Engine**: Handlebars for HTML generation
- **LLM Integration**: OpenAI SDK, Anthropic SDK, or local LLM APIs
- **Visualization**: Chart.js, D3.js for interactive charts
- **Styling**: Bootstrap or Tailwind CSS for responsive design

### 3.2 Module Architecture

```
src/
├── core/
│   ├── mcp-server.js          # MCP server implementation
│   ├── orchestrator.js        # Analysis orchestration
│   └── config.js              # Configuration management
├── analyzers/
│   ├── git.js                 # Git operations
│   ├── test.js                # Test execution & coverage
│   ├── security.js            # Security analysis
│   ├── metrics.js             # Code metrics
│   ├── duplicate.js           # Duplicate detection
│   ├── lint.js                # Linting & quality
│   ├── ai-review.js           # LLM integration
│   ├── provenance.js          # AI/human code detection
│   └── bundle.js              # Bundle analysis
├── report/
│   ├── generator.js           # HTML report generation
│   ├── templates/             # Handlebars templates
│   └── assets/                # CSS, JS, images
└── utils/
    ├── file-utils.js          # File system utilities
    ├── process-utils.js       # Process execution utilities
    └── llm-client.js          # LLM API client
```

### 3.3 Data Flow

1. **Initialization**: MCP server starts, loads configuration
2. **Repository Analysis**: Git operations, branch selection
3. **Parallel Analysis**: Execute multiple analyzers concurrently
4. **LLM Integration**: Send relevant data to LLMs for insights
5. **Data Aggregation**: Combine results from all analyzers
6. **Report Generation**: Create HTML report with visualizations
7. **Output Delivery**: Serve or save report, notify completion

---

## 4. Implementation Details

### 4.1 Git Operations (git.js)
```javascript
// Key functions:
- listBranches(): Promise<string[]>
- selectBranch(branchName: string): Promise<void>
- getCurrentBranch(): Promise<string>
- getRepositoryInfo(): Promise<RepoInfo>
```

**Tools Used**: simple-git
**Implementation**: Wrapper around git commands with error handling

### 4.2 Test Execution (test.js)
```javascript
// Key functions:
- detectTestFramework(): Promise<TestFramework>
- runTests(): Promise<TestResults>
- generateCoverage(): Promise<CoverageReport>
```

**Tools Used**: 
- JavaScript: Jest, Mocha, nyc
- Python: pytest, coverage.py
- Java: JUnit, JaCoCo

### 4.3 Security Analysis (security.js)
```javascript
// Key functions:
- auditDependencies(): Promise<VulnerabilityReport>
- runStaticSecurityScan(): Promise<SecurityIssues>
- checkLicenseCompliance(): Promise<LicenseReport>
```

**Tools Used**: npm audit, semgrep, bandit, safety

### 4.4 Code Metrics (metrics.js)
```javascript
// Key functions:
- countLines(): Promise<LineMetrics>
- calculateComplexity(): Promise<ComplexityMetrics>
- identifyLargeFiles(): Promise<LargeFileReport>
```

**Tools Used**: cloc, complexity analyzers (eslint-plugin-complexity)

### 4.5 Duplicate Detection (duplicate.js)
```javascript
// Key functions:
- findDuplicates(): Promise<DuplicationReport>
- calculateSimilarity(): Promise<SimilarityMetrics>
```

**Tools Used**: jscpd, simian, pmd-cpd

### 4.6 Linting & Quality (lint.js)
```javascript
// Key functions:
- runLinters(): Promise<LintResults>
- checkCodeStyle(): Promise<StyleViolations>
- calculateQualityScore(): Promise<QualityMetrics>
```

**Tools Used**: ESLint, Pylint, RuboCop, SonarQube

### 4.7 LLM Integration (ai-review.js)
```javascript
// Key functions:
- reviewCode(codeSnippet: string): Promise<AIReview>
- suggestImprovements(context: AnalysisContext): Promise<Suggestions>
- optimizeBundle(bundleInfo: BundleAnalysis): Promise<OptimizationTips>
```

**Implementation**:
- API client for OpenAI, Anthropic, or local LLMs
- Prompt engineering for different analysis types
- Rate limiting and error handling
- Response parsing and formatting

### 4.8 Code Provenance (provenance.js)
```javascript
// Key functions:
- scanForAIMarkers(): Promise<AICodeReport>
- analyzeCodePatterns(): Promise<ProvenanceAnalysis>
- generateProvenanceReport(): Promise<ProvenanceReport>
```

**Implementation**:
- Pattern matching for AI code markers
- Heuristic analysis for AI-generated patterns
- Integration with ShiftAI or similar tools

### 4.9 Bundle Analysis (bundle.js)
```javascript
// Key functions:
- detectBuildTool(): Promise<BuildTool>
- analyzeBundleSize(): Promise<BundleReport>
- identifyOptimizations(): Promise<OptimizationSuggestions>
```

**Tools Used**: webpack-bundle-analyzer, source-map-explorer, vite-plugin-visualizer

### 4.10 Report Generation (generator.js)
```javascript
// Key functions:
- generateReport(analysisResults: AnalysisResults): Promise<string>
- createVisualizations(data: any): Promise<ChartData>
- exportToPDF(htmlContent: string): Promise<Buffer>
```

**Implementation**:
- Handlebars templating with partials
- Chart.js integration for visualizations
- Responsive CSS framework
- PDF generation using Puppeteer

---

## 5. User Workflow

### 5.1 Installation & Setup
```bash
# Install globally
npm install -g mcp-code-analyzer

# Or run directly
npx mcp-code-analyzer
```

### 5.2 Configuration
```javascript
// .analyzer-config.json
{
  "llm": {
    "provider": "openai",
    "apiKey": "env:OPENAI_API_KEY",
    "model": "gpt-4"
  },
  "thresholds": {
    "largeFileLines": 500,
    "duplicateThreshold": 0.8,
    "coverageMinimum": 80
  },
  "analyzers": {
    "security": true,
    "bundle": true,
    "ai-review": true
  }
}
```

### 5.3 Execution
```bash
# Start MCP server
mcp-code-analyzer start

# Run full analysis (via MCP client or CLI)
mcp-code-analyzer analyze --branch main

# Generate report only
mcp-code-analyzer report --output ./reports/
```

### 5.4 Report Viewing
- HTML report opens automatically in default browser
- Interactive navigation through analysis sections
- Drill-down from summary to detailed findings
- Export options for sharing and archiving

---

## 6. Extensibility & Configuration

### 6.1 Adding New Analyzers
```javascript
// Create new analyzer module
class CustomAnalyzer {
  async analyze(projectPath) {
    // Implementation
    return results;
  }
}

// Register in orchestrator
orchestrator.registerAnalyzer('custom', new CustomAnalyzer());
```

### 6.2 Custom Report Sections
```handlebars
<!-- Add custom template partial -->
{{> custom-section data=customData}}
```

### 6.3 LLM Provider Integration
```javascript
// Add new LLM provider
class CustomLLMProvider {
  async generateReview(prompt) {
    // Implementation
  }
}
```

### 6.4 Editor Integration
- VS Code extension wrapper
- Cursor integration
- Windsurf plugin
- Generic MCP client support

---

## 7. VSIX Extension Integration & MCP Configuration

### 7.1 Overview
The VSIX extension acts as a frontend in VS Code, connecting to the MCP server for code analysis and reporting. Users can trigger analyses and view reports directly within the editor. The extension can be configured to work with Cline or other LLM-based extensions, leveraging MCP configuration for seamless tool discovery and invocation.

### 7.2 Extension Features
- **Command Palette Integration**: Add commands like "Run Full Code Analysis", "Show Last Report", "Select Branch for Analysis"
- **Webview Panel**: Display the HTML report generated by the MCP server inside VS Code with full interactivity
- **Status Bar Integration**: Show analysis status, progress indicators, and quick access buttons
- **Notifications**: Notify users when analysis is complete, if issues are found, or if errors occur
- **Settings UI**: Allow users to configure MCP server address, port, tool preferences, and thresholds
- **Cline Integration**: If Cline is present, expose MCP tools as chat commands or context actions
- **Tree View Provider**: Show analysis results in a dedicated sidebar panel
- **Code Actions**: Provide quick fixes and suggestions directly in the editor based on analysis results

### 7.3 MCP Configuration & Discovery
```json
// VS Code settings.json or .mcp-config.json
{
  "mcpCodeAnalyzer": {
    "server": {
      "host": "localhost",
      "port": 3000,
      "autoStart": true,
      "autoDiscovery": true
    },
    "tools": {
      "enabled": ["run_full_analysis", "generate_report", "run_security_scan"],
      "defaultBranch": "main",
      "autoAnalyzeOnSave": false
    },
    "ui": {
      "showInStatusBar": true,
      "openReportInWebview": true,
      "notificationLevel": "info"
    },
    "cline": {
      "integration": true,
      "chatCommands": ["analyze", "report", "security"],
      "contextActions": true
    }
  }
}
```

### 7.4 Extension Architecture
```
vscode-extension/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── mcp-client.ts            # MCP protocol client
│   ├── commands/
│   │   ├── analyze.ts           # Analysis commands
│   │   ├── report.ts            # Report commands
│   │   └── config.ts            # Configuration commands
│   ├── providers/
│   │   ├── tree-view.ts         # Analysis results tree view
│   │   ├── webview.ts           # HTML report webview
│   │   └── code-actions.ts      # Code action provider
│   ├── integrations/
│   │   ├── cline.ts             # Cline integration
│   │   └── mcp-discovery.ts     # MCP server discovery
│   └── utils/
│       ├── notifications.ts     # Notification helpers
│       └── settings.ts          # Settings management
├── package.json                 # Extension manifest
├── README.md
└── CHANGELOG.md
```

### 7.5 User Workflow
1. **Installation**: User installs the VSIX extension from VS Code marketplace or local installation
2. **Auto-Setup**: Extension automatically discovers or prompts user to configure MCP server
3. **Server Start**: Extension can auto-start the MCP server or user starts it manually
4. **Analysis Trigger**: User triggers analysis via:
   - Command palette: "MCP Analyzer: Run Full Analysis"
   - Status bar button
   - Context menu in file explorer
   - Cline chat command: "/analyze"
5. **Progress Tracking**: Extension shows progress in status bar and notifications
6. **Results Display**: Analysis results are displayed in:
   - Webview panel with full HTML report
   - Tree view sidebar with structured results
   - Inline code actions and diagnostics
7. **Action Taking**: User can act on findings through quick fixes, navigation, or export options

### 7.6 Cline Integration Details
- **Chat Commands**: Register MCP tools as Cline chat commands
  - `/analyze [branch]` - Run full analysis on specified branch
  - `/report` - Show last analysis report
  - `/security` - Run security-focused analysis
  - `/metrics` - Show code metrics summary
- **Context Actions**: Add MCP tools to Cline's context menu for files and selections
- **Result Streaming**: Stream analysis results to Cline chat for real-time feedback
- **LLM Enhancement**: Use Cline's LLM to interpret and explain analysis results

### 7.7 Extension Commands
```typescript
// Command contributions in package.json
"contributes": {
  "commands": [
    {
      "command": "mcpAnalyzer.runFullAnalysis",
      "title": "Run Full Analysis",
      "category": "MCP Analyzer"
    },
    {
      "command": "mcpAnalyzer.showReport",
      "title": "Show Last Report",
      "category": "MCP Analyzer"
    },
    {
      "command": "mcpAnalyzer.selectBranch",
      "title": "Select Branch for Analysis",
      "category": "MCP Analyzer"
    },
    {
      "command": "mcpAnalyzer.configureServer",
      "title": "Configure MCP Server",
      "category": "MCP Analyzer"
    }
  ]
}
```

### 7.8 Internal Testing & Development Setup

#### 7.8.1 Creating VSIX for Internal Testing

**Prerequisites**
```bash
# Install required tools
npm install -g @vscode/vsce
npm install -g typescript
```

**Project Setup**
```bash
# Clone or create the extension project
mkdir mcp-code-analyzer-extension
cd mcp-code-analyzer-extension

# Initialize package.json
npm init -y

# Install dependencies
npm install --save-dev @types/vscode @types/node typescript
npm install simple-git axios handlebars
```

**Extension Manifest (package.json)**
```json
{
  "name": "mcp-code-analyzer",
  "displayName": "MCP Code Analyzer",
  "description": "Comprehensive code analysis using MCP server",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onCommand:mcpAnalyzer.runFullAnalysis"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "mcpAnalyzer.runFullAnalysis",
        "title": "Run Full Analysis",
        "category": "MCP Analyzer"
      },
      {
        "command": "mcpAnalyzer.showReport",
        "title": "Show Last Report",
        "category": "MCP Analyzer"
      }
    ],
    "configuration": {
      "title": "MCP Code Analyzer",
      "properties": {
        "mcpCodeAnalyzer.server.host": {
          "type": "string",
          "default": "localhost",
          "description": "MCP server host"
        },
        "mcpCodeAnalyzer.server.port": {
          "type": "number",
          "default": 3000,
          "description": "MCP server port"
        }
      }
    }
  },
  "scripts": {
    "compile": "tsc -p ./",
    "package": "vsce package"
  }
}
```

**Build and Package for Testing**
```bash
# Compile TypeScript
npm run compile

# Create VSIX file for internal testing
vsce package --no-dependencies

# This creates: mcp-code-analyzer-0.1.0.vsix
```

#### 7.8.2 Internal Installation & Testing

**Install VSIX Locally**
```bash
# Method 1: Command line
code --install-extension mcp-code-analyzer-0.1.0.vsix

# Method 2: VS Code UI
# 1. Open VS Code
# 2. Go to Extensions (Ctrl+Shift+X)
# 3. Click "..." menu > "Install from VSIX..."
# 4. Select your .vsix file
```

**Verify Installation**
```bash
# Check if extension is installed
code --list-extensions | grep mcp-code-analyzer
```

#### 7.8.3 Bundled MCP Server Integration

**Extension Structure with Bundled Server**
```
mcp-code-analyzer-extension/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── mcp-client.ts            # MCP protocol client
│   └── server-manager.ts        # Server path management
├── server/                      # Bundled MCP server
│   ├── package.json             # Server dependencies
│   ├── server.js                # MCP server implementation
│   └── node_modules/            # Server dependencies
├── package.json                 # Extension manifest
└── README.md
```

**Extension Package.json with Server Bundling**
```json
{
  "name": "mcp-code-analyzer",
  "displayName": "MCP Code Analyzer",
  "description": "Comprehensive code analysis using MCP server",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "mcpAnalyzer.runFullAnalysis",
        "title": "Run Full Analysis",
        "category": "MCP Analyzer"
      },
      {
        "command": "mcpAnalyzer.showServerPath",
        "title": "Show MCP Server Path",
        "category": "MCP Analyzer"
      }
    ]
  },
  "scripts": {
    "compile": "tsc -p ./",
    "package": "npm run bundle-server && vsce package",
    "bundle-server": "cd server && npm install --production"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.1.0"
  }
}
```

**Server Manager (src/server-manager.ts)**
```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class MCPServerManager {
    private serverPath: string;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('MCP Code Analyzer');
        
        // Get bundled server path
        this.serverPath = path.join(context.extensionPath, 'server', 'server.js');
        
        // Display server path on activation
        this.displayServerPath();
        
        // Ensure server is executable
        this.setupServer();
    }

    private displayServerPath() {
        this.outputChannel.clear();
        this.outputChannel.appendLine('='.repeat(60));
        this.outputChannel.appendLine('MCP Code Analyzer - Server Information');
        this.outputChannel.appendLine('='.repeat(60));
        this.outputChannel.appendLine(`Server Path: ${this.serverPath}`);
        this.outputChannel.appendLine(`Server Status: ${fs.existsSync(this.serverPath) ? 'Available' : 'Not Found'}`);
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('MCP Configuration:');
        this.outputChannel.appendLine(JSON.stringify({
            "mcpServers": {
                "code-analyzer": {
                    "command": "node",
                    "args": [this.serverPath],
                    "env": {
                        "NODE_ENV": "production"
                    }
                }
            }
        }, null, 2));
        this.outputChannel.appendLine('='.repeat(60));
        this.outputChannel.show();
    }

    private setupServer() {
        if (fs.existsSync(this.serverPath)) {
            // Make server executable on Unix systems
            if (process.platform !== 'win32') {
                try {
                    fs.chmodSync(this.serverPath, '755');
                } catch (error) {
                    console.error('Failed to make server executable:', error);
                }
            }
            
            this.outputChannel.appendLine(`✓ MCP Server ready at: ${this.serverPath}`);
        } else {
            this.outputChannel.appendLine(`✗ MCP Server not found at: ${this.serverPath}`);
            vscode.window.showErrorMessage('MCP Code Analyzer server not found. Please reinstall the extension.');
        }
    }

    public getServerPath(): string {
        return this.serverPath;
    }

    public showServerPath() {
        this.displayServerPath();
    }

    public getServerConfig() {
        return {
            command: 'node',
            args: [this.serverPath],
            cwd: path.dirname(this.serverPath)
        };
    }
}
```

**Updated Extension Entry Point (src/extension.ts)**
```typescript
import * as vscode from 'vscode';
import { MCPServerManager } from './server-manager';

let serverManager: MCPServerManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP Code Analyzer extension is now active');

    // Initialize server manager (automatically displays server path)
    serverManager = new MCPServerManager(context);

    // Register commands
    const runAnalysisCommand = vscode.commands.registerCommand('mcpAnalyzer.runFullAnalysis', () => {
        runFullAnalysis();
    });

    const showServerPathCommand = vscode.commands.registerCommand('mcpAnalyzer.showServerPath', () => {
        serverManager.showServerPath();
    });

    context.subscriptions.push(runAnalysisCommand, showServerPathCommand);

    // Show server path in status bar
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(server) MCP Analyzer";
    statusBarItem.tooltip = `MCP Server: ${serverManager.getServerPath()}`;
    statusBarItem.command = 'mcpAnalyzer.showServerPath';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

async function runFullAnalysis() {
    const config = serverManager.getServerConfig();
    
    vscode.window.showInformationMessage(
        `Running analysis with MCP server at: ${config.args[0]}`
    );
    
    // Your analysis logic here
    // This would connect to the MCP server using the bundled server path
}

export function deactivate() {}
```

**Bundled MCP Server (server/server.js)**
```javascript
#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const path = require('path');

class CodeAnalyzerServer {
    constructor() {
        this.server = new Server(
            {
                name: 'mcp-code-analyzer',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
        
        // Log server startup with path information
        console.error(`MCP Code Analyzer Server starting...`);
        console.error(`Server location: ${__filename}`);
        console.error(`Working directory: ${process.cwd()}`);
    }

    setupToolHandlers() {
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            console.error(`Tool called: ${name} with args:`, args);

            switch (name) {
                case 'run_full_analysis':
                    return await this.runFullAnalysis(args);
                case 'generate_report':
                    return await this.generateReport(args);
                case 'get_server_info':
                    return await this.getServerInfo();
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }

    async getServerInfo() {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        serverPath: __filename,
                        workingDirectory: process.cwd(),
                        nodeVersion: process.version,
                        platform: process.platform
                    }, null, 2)
                }
            ]
        };
    }

    async runFullAnalysis(args) {
        console.error('Running full analysis for branch:', args.branch || 'main');
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        status: 'completed',
                        serverPath: __filename,
                        branch: args.branch || 'main',
                        timestamp: new Date().toISOString(),
                        results: {
                            tests: { passed: 45, failed: 2, coverage: 85 },
                            security: { vulnerabilities: 3, severity: 'medium' },
                            metrics: { lines: 12500, files: 156 },
                            quality: { score: 7.8, issues: 12 }
                        }
                    }, null, 2)
                }
            ]
        };
    }

    async generateReport(args) {
        const reportPath = path.join(process.cwd(), 'reports', 'analysis-report.html');
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        reportPath: reportPath,
                        serverPath: __filename,
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }
            ]
        };
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('MCP Code Analyzer Server running on stdio');
        console.error(`Ready to accept connections at: ${__filename}`);
    }
}

const server = new CodeAnalyzerServer();
server.run().catch(console.error);
```

**Server Package.json (server/package.json)**
```json
{
  "name": "mcp-code-analyzer-server",
  "version": "0.1.0",
  "main": "server.js",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.1.0",
    "simple-git": "^3.19.1"
  }
}
```

#### 7.8.4 Testing Configuration

**VS Code Settings for Testing (.vscode/settings.json)**
```json
{
  "mcpCodeAnalyzer": {
    "server": {
      "host": "localhost",
      "port": 3000,
      "autoStart": true,
      "command": "node",
      "args": ["./mcp-analyzer-server/server.js"]
    },
    "tools": {
      "enabled": ["run_full_analysis", "generate_report"],
      "defaultBranch": "main"
    },
    "debug": true
  }
}
```

**MCP Client Configuration (mcp-config.json)**
```json
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["./mcp-analyzer-server/server.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

#### 7.8.5 Testing Workflow

**Step 1: Start MCP Server**
```bash
# Terminal 1: Start MCP server
cd mcp-analyzer-server
node server.js
```

**Step 2: Test Extension**
```bash
# Open VS Code in your project
code .

# Open Command Palette (Ctrl+Shift+P)
# Type: "MCP Analyzer: Run Full Analysis"
# Execute command
```

**Step 3: Verify Results**
- Check VS Code Output panel for MCP communication logs
- Verify extension responds with analysis results
- Test report generation functionality

#### 7.8.6 Development & Debugging

**Extension Development Mode**
```bash
# Open extension source in VS Code
code ./mcp-code-analyzer-extension

# Press F5 to launch Extension Development Host
# Test extension in the new VS Code window
```

**MCP Server Debugging**
```javascript
// Add debug logging to server.js
console.error('Tool called:', name, 'with args:', args);
```

**Troubleshooting**
```bash
# Check extension logs
# VS Code > Help > Toggle Developer Tools > Console

# Check MCP server logs
# Terminal where server is running

# Reinstall extension if needed
code --uninstall-extension mcp-code-analyzer
code --install-extension mcp-code-analyzer-0.1.0.vsix
```

#### 7.8.7 Clarifications & Consistency Notes

**MCP Server Distribution Model**
The specification describes two approaches that need clarification:
1. **Bundled Server (Recommended for Internal Testing)**: MCP server is included in the VSIX extension package under `/server/` directory
2. **Standalone Server (For Production)**: Separate npm package installation

**Configuration Consistency**
- Section 7.3 shows MCP configuration with `host` and `port` properties
- Section 7.8.3 bundled server uses stdio transport (no host/port needed)
- **Resolution**: Bundled server uses stdio, standalone server can use TCP

**Updated Configuration for Bundled Server**
```json
// For bundled server (stdio transport)
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["/path/to/extension/server/server.js"]
    }
  }
}

// For standalone server (TCP transport)
{
  "mcpCodeAnalyzer": {
    "server": {
      "host": "localhost",
      "port": 3000,
      "autoStart": true
    }
  }
}
```

**Testing vs Production Workflow**
- **Internal Testing**: Use bundled server approach (Section 7.8.3)
- **Production Deployment**: Use standalone server with proper distribution

**Package Naming Consistency**
- Extension: `mcp-code-analyzer` (VSIX)
- Server Package: `@mcp-analyzer/server` (npm)
- Docker Image: `mcp-code-analyzer` (Docker Hub)

### 7.9 Benefits
- **Seamless Developer Experience**: All analysis and reporting accessible from within VS Code
- **LLM Synergy**: Cline can use MCP server results for deeper code understanding and suggestions
- **Configurable**: Users can easily customize which tools to use and how results are displayed
- **Extensible**: New MCP tools automatically appear in the extension UI
- **Integrated Workflow**: Combines static analysis, LLM insights, and developer tools in one interface
- **Easy Distribution**: Multiple installation methods for different environments
- **Zero Configuration**: Works out-of-the-box with sensible defaults

---

## 8. Security & Privacy

### 8.1 Local Execution
- All analysis runs locally on developer machine
- No code transmitted to external services (except LLM APIs if configured)
- Sensitive data filtering before LLM submission

### 8.2 API Key Management
- Environment variable storage
- Encrypted configuration files
- Optional local LLM support (no API keys required)

### 8.3 Data Handling
- Temporary file cleanup
- Configurable data retention
- Audit logging for compliance

---

## 9. Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- MCP server setup
- Basic orchestrator
- Git operations module
- Configuration system

### Phase 2: Basic Analyzers (Week 2)
- Test execution & coverage
- Code metrics
- Linting integration
- Basic HTML report

### Phase 3: Advanced Analysis (Week 3)
- Security scanning
- Duplicate detection
- Bundle analysis
- LLM integration

### Phase 4: AI Features (Week 4)
- Code provenance detection
- AI-powered code review
- Advanced recommendations
- Report enhancements

### Phase 5: Polish & Documentation (Week 5)
- Error handling
- Performance optimization
- Documentation
- Testing & validation

### Phase 6: VSIX Extension Integration (Week 6)
- Develop VSIX extension using TypeScript and VS Code Extension API
- Implement MCP client logic for tool discovery and invocation
- Add webview panel for HTML report display within VS Code
- Create command palette integration and status bar components
- Integrate with Cline (if present) for chat-based tool invocation
- Provide settings UI for MCP configuration and tool preferences
- Implement tree view provider for structured analysis results
- Add code actions and diagnostics based on analysis findings
- Test end-to-end workflow with MCP server and extension
- Package extension for VS Code marketplace distribution

---

## 10. Example Output Structure

### 10.1 HTML Report Sections
1. **Executive Summary**: High-level metrics and scores
2. **Repository Information**: Branch, commit, statistics
3. **Test Results**: Coverage, pass/fail, performance
4. **Security Analysis**: Vulnerabilities, recommendations
5. **Code Quality**: Linting results, complexity metrics
6. **Duplication Report**: Duplicate code blocks, refactoring suggestions
7. **Bundle Analysis**: Size breakdown, optimization opportunities
8. **AI Code Analysis**: Provenance report, AI vs human code
9. **Recommendations**: Prioritized action items
10. **Appendix**: Detailed logs, raw data

### 10.2 Data Export Formats
- JSON: Raw analysis data
- PDF: Formatted report
- CSV: Metrics for spreadsheet analysis
- SARIF: Security findings in standard format

---

## 11. Appendix

### 11.1 Tool Dependencies
- **Git**: simple-git
- **Testing**: jest, pytest, junit
- **Security**: semgrep, bandit, npm-audit
- **Metrics**: cloc, complexity analyzers
- **Duplication**: jscpd, simian
- **Linting**: eslint, pylint, rubocop
- **Bundle**: webpack-bundle-analyzer, source-map-explorer
- **LLM**: openai, anthropic SDKs
- **Reporting**: handlebars, chart.js, puppeteer

### 11.2 Configuration Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "llm": {
      "type": "object",
      "properties": {
        "provider": {"type": "string", "enum": ["openai", "anthropic", "local"]},
        "apiKey": {"type": "string"},
        "model": {"type": "string"}
      }
    },
    "thresholds": {
      "type": "object",
      "properties": {
        "largeFileLines": {"type": "number"},
        "duplicateThreshold": {"type": "number"},
        "coverageMinimum": {"type": "number"}
      }
    }
  }
}
```

### 11.3 API Reference
- MCP Tools: `run_full_analysis`, `run_specific_analyzer`, `generate_report`
- CLI Commands: `start`, `analyze`, `report`, `config`
- Configuration: Environment variables, config files, CLI options

---

## Conclusion

This specification provides a comprehensive blueprint for building an MCP server-based code analysis and reporting tool that meets all the specified requirements. The modular architecture ensures extensibility, while the single-command workflow provides the simplicity developers need. The integration of LLMs adds intelligent insights that go beyond traditional static analysis tools.

The tool will serve as a powerful addition to any developer's toolkit, providing actionable insights for code quality, security, performance, and maintainability in a single, comprehensive report.
