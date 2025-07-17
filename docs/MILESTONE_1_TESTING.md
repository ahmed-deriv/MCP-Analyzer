# Milestone 1 Testing Guide - Project Scaffold & Core Infrastructure

## Overview
This document provides step-by-step instructions for testing the Milestone 1 deliverable of the MCP Code Analyzer extension.

## Deliverable
- **File**: `mcp-code-analyzer-0.1.0.vsix`
- **Status**: Ready for internal testing
- **Scope**: Extension activation, server bundling, server path display, and Hello World analyzer

## Prerequisites
- VS Code (version 1.74.0 or higher)
- Node.js (version 16.0.0 or higher)
- Basic familiarity with VS Code extensions

## Installation Instructions

### Step 1: Install the Extension
```bash
# Method 1: Command line installation
code --install-extension mcp-code-analyzer-0.1.0.vsix

# Method 2: VS Code UI installation
# 1. Open VS Code
# 2. Go to Extensions (Ctrl+Shift+X)
# 3. Click "..." menu → "Install from VSIX..."
# 4. Select mcp-code-analyzer-0.1.0.vsix
```

### Step 2: Verify Installation
```bash
# Check if extension is installed
code --list-extensions | grep mcp-code-analyzer
```

Expected output: `mcp-analyzer.mcp-code-analyzer`

## Testing Checklist

### ✅ Test 1: Extension Activation
**Objective**: Verify extension activates on VS Code startup

**Steps**:
1. Open VS Code
2. Wait for extension to activate (should happen automatically)
3. Check VS Code Output panel

**Expected Results**:
- Extension activates without errors
- "MCP Code Analyzer" output channel appears
- Server path information is displayed
- MCP configuration for Cline is shown

**Sample Output**:
```
============================================================
MCP Code Analyzer - Server Information
============================================================
Server Path: /path/to/extension/server/server.js
Server Status: Available
Extension Path: /path/to/extension

MCP Configuration for Cline:
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["/path/to/extension/server/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
============================================================
```

### ✅ Test 2: Status Bar Integration
**Objective**: Verify status bar shows MCP Analyzer

**Steps**:
1. Look at VS Code status bar (bottom of window)
2. Find "MCP Analyzer" item on the right side
3. Hover over the item to see tooltip

**Expected Results**:
- Status bar shows "🖥️ MCP Analyzer" icon and text
- Tooltip displays server path
- Clicking opens server information

### ✅ Test 3: Command Palette Integration
**Objective**: Verify all commands are available

**Steps**:
1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "MCP Analyzer"
3. Verify all commands appear

**Expected Commands**:
- `MCP Analyzer: Show MCP Server Path`
- `MCP Analyzer: Test MCP Server Connection`
- `MCP Analyzer: Run Hello World Analyzer`
- `MCP Analyzer: Run Full Analysis`

### ✅ Test 4: Server Path Display
**Objective**: Test server path display command

**Steps**:
1. Open Command Palette
2. Run "MCP Analyzer: Show MCP Server Path"
3. Check Output panel

**Expected Results**:
- Output panel shows detailed server information
- Server path is correct and file exists
- MCP configuration is properly formatted
- Extension path is displayed

### ✅ Test 5: Server Connection Test
**Objective**: Test MCP server connection

**Steps**:
1. Open Command Palette
2. Run "MCP Analyzer: Test MCP Server Connection"
3. Wait for completion
4. Check notifications and output

**Expected Results**:
- Success notification: "MCP server connection successful!"
- No error messages
- Server info appears in console/output

### ✅ Test 6: Hello World Analyzer
**Objective**: Test basic workspace detection

**Steps**:
1. Open a workspace/folder in VS Code
2. Open Command Palette
3. Run "MCP Analyzer: Run Hello World Analyzer"
4. Wait for completion

**Expected Results**:
- Success notification: "Hello World analyzer completed!"
- Workspace path is detected correctly
- Basic file listing appears (if workspace has files)
- System information is displayed

**Sample Result**:
```json
{
  "tool": "hello_world_analyzer",
  "message": "Hello World from MCP Code Analyzer!",
  "workspace": {
    "path": "/path/to/workspace",
    "exists": true,
    "isDirectory": true,
    "files": ["file1.js", "file2.md", "package.json"]
  },
  "systemInfo": {
    "platform": "darwin",
    "nodeVersion": "v18.17.0"
  }
}
```

### ✅ Test 7: Full Analysis Simulation
**Objective**: Test simulated full analysis

**Steps**:
1. Open Command Palette
2. Run "MCP Analyzer: Run Full Analysis"
3. Wait for completion

**Expected Results**:
- Success notification: "Analysis completed successfully!"
- Simulated analysis results showing future milestones
- Workspace information is included
- Recommendations for next steps

## Troubleshooting

### Issue: Extension Not Activating
**Symptoms**: No output channel, no status bar item
**Solutions**:
1. Check VS Code version (must be 1.74.0+)
2. Reinstall extension
3. Restart VS Code
4. Check Developer Tools console for errors

### Issue: Server Not Found
**Symptoms**: "MCP Server not found" error
**Solutions**:
1. Verify VSIX installation completed successfully
2. Check extension directory contains `server/server.js`
3. Reinstall extension
4. Verify Node.js is installed

### Issue: Commands Not Working
**Symptoms**: Commands fail with errors
**Solutions**:
1. Check Output panel for error details
2. Verify server process is running
3. Test server connection first
4. Restart VS Code

### Issue: No Workspace Detection
**Symptoms**: Hello World analyzer shows "unknown" workspace
**Solutions**:
1. Open a folder/workspace in VS Code first
2. Ensure workspace path is accessible
3. Check file permissions

## MCP Configuration for Cline

Copy this configuration to use with Cline:

```json
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["/path/to/your/extension/server/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Note**: Replace `/path/to/your/extension/server/server.js` with the actual path shown in the VS Code Output panel.

## Success Criteria

Milestone 1 is considered successful if:

- ✅ Extension installs without errors
- ✅ Extension activates on VS Code startup
- ✅ Server path is displayed in output panel
- ✅ Status bar integration works
- ✅ All commands are available in Command Palette
- ✅ Server connection test passes
- ✅ Hello World analyzer detects workspace
- ✅ Full analysis simulation completes
- ✅ MCP configuration is provided for Cline

## Next Steps

Upon successful completion of Milestone 1 testing:

1. **Approval**: Confirm all tests pass and functionality works as expected
2. **Feedback**: Provide any feedback or issues encountered
3. **Milestone 2**: Proceed to implement Git repository operations
4. **Documentation**: Update implementation plan with any lessons learned

## Support

If you encounter issues during testing:

1. Check the troubleshooting section above
2. Review VS Code Output panel for detailed error messages
3. Verify all prerequisites are met
4. Document any issues for feedback

---

**Testing Date**: _____________  
**Tester**: _____________  
**Status**: [ ] PASS [ ] FAIL  
**Notes**: _____________
