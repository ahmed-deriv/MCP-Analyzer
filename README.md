# MCP Code Analyzer

A comprehensive code analysis tool that integrates with VS Code and Cline through the Model Context Protocol (MCP).

## Overview

This extension provides automated code analysis capabilities including:
- Git repository operations
- Unit test execution and coverage
- Security and dependency analysis
- Code metrics and quality assessment
- Duplicate code detection
- AI-powered code review
- Bundle size analysis

## Installation

### For Internal Testing

1. Download the VSIX file: `mcp-code-analyzer-0.1.0.vsix`
2. Install in VS Code:
   ```bash
   code --install-extension mcp-code-analyzer-0.1.0.vsix
   ```
   Or use VS Code UI: Extensions → "..." menu → "Install from VSIX..."

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd mcp-code-analyzer

# Install dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Compile TypeScript
npm run compile

# Package extension
npm run package
```

## Usage

### VS Code Commands

- **MCP Analyzer: Show MCP Server Path** - Display server information and configuration
- **MCP Analyzer: Test MCP Server Connection** - Test connection to bundled server
- **MCP Analyzer: Run Hello World Analyzer** - Basic workspace detection test
- **MCP Analyzer: Run Full Analysis** - Execute comprehensive code analysis

### Status Bar

The extension adds a status bar item showing "MCP Analyzer" with server path tooltip.

### MCP Configuration for Cline

The extension automatically generates MCP configuration for Cline integration. Check the output panel for the configuration JSON.

## Milestone Progress

### ✅ Milestone 1: Project Scaffold & Core Infrastructure
- Extension activation and server bundling
- Server path display in VS Code output panel
- Basic MCP tool simulation
- Hello World analyzer for workspace detection
- Status bar integration
- Command palette integration

### 🔄 Milestone 2: Git Repository Operations (Next)
- Branch listing, selection, and checkout
- Repository status and information
- Git integration in MCP server

### ⏳ Future Milestones
- Unit test execution and coverage (Milestone 3)
- Security and dependency analysis (Milestone 4)
- Code metrics and large file detection (Milestone 5)
- Duplicate code detection (Milestone 6)
- Code quality and linting (Milestone 7)
- LLM integration for bug detection (Milestone 8)
- AI vs human code provenance (Milestone 9)
- Bundle size analysis (Milestone 10)
- Final integration and polish (Milestone 11)

## Architecture

```
mcp-code-analyzer/
├── src/                     # Extension source code
│   ├── extension.ts         # Main extension entry point
│   ├── server-manager.ts    # MCP server management
│   └── mcp-client.ts        # MCP protocol client
├── server/                  # Bundled MCP server
│   ├── server.js            # MCP server implementation
│   └── package.json         # Server dependencies
├── package.json             # Extension manifest
└── README.md
```

## Configuration

The extension supports the following VS Code settings:

- `mcpCodeAnalyzer.server.autoStart`: Auto-start MCP server (default: true)
- `mcpCodeAnalyzer.ui.showInStatusBar`: Show status bar item (default: true)
- `mcpCodeAnalyzer.debug`: Enable debug logging (default: false)

## Troubleshooting

### Server Not Found
If you see "MCP Server not found" error:
1. Reinstall the extension
2. Check that `server/server.js` exists in the extension directory
3. Verify Node.js is installed and accessible

### Connection Issues
1. Use "Test MCP Server Connection" command
2. Check VS Code Output panel for error messages
3. Ensure no other process is using the same resources

## Development

### Building
```bash
npm run compile
```

### Packaging
```bash
npm run package
```

### Testing
```bash
# Install extension locally
code --install-extension mcp-code-analyzer-0.1.0.vsix

# Test commands in VS Code
# Open Command Palette (Ctrl+Shift+P)
# Run: "MCP Analyzer: Show MCP Server Path"
```

## License

MIT License - see LICENSE file for details.

## Contributing

This project follows a milestone-based development approach. Each milestone must be completed and approved before proceeding to the next.

Current focus: Milestone 1 - Project Scaffold & Core Infrastructure
