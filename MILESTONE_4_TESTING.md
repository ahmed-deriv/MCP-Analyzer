# Milestone 4 Testing Guide: Security & Dependency Analysis

## 📋 Testing Overview

This guide provides comprehensive testing instructions for Milestone 4: Security & Dependency Analysis features in the MCP Code Analyzer extension.

**Extension**: `mcp-code-analyzer-0.3.0.vsix`  
**Version**: 0.3.0  
**New Tools**: 3 security analysis tools  
**Total Tools**: 10 (7 existing + 3 new)  

## 🛠️ Prerequisites

### Required Software
- **VS Code**: Version 1.74.0 or higher
- **Node.js**: Version 16+ (tested on v20.16.0)
- **Git**: For repository operations
- **npm**: For JavaScript dependency analysis

### Optional Security Tools (for enhanced testing)
```bash
# For comprehensive npm license checking
npm install -g license-checker

# For Python dependency auditing
pip install pip-audit
# OR
pip install safety

# For Python license checking
pip install pip-licenses
```

## 📦 Installation Steps

### 1. Install Extension
```bash
# Method 1: VS Code UI
# 1. Open VS Code
# 2. Go to Extensions (Ctrl+Shift+X)
# 3. Click "..." menu > "Install from VSIX..."
# 4. Select mcp-code-analyzer-0.3.0.vsix

# Method 2: Command line (if available)
code --install-extension mcp-code-analyzer-0.3.0.vsix
```

### 2. Verify Installation
```bash
# Check if extension is installed
code --list-extensions | grep mcp-code-analyzer
# Expected: mcp-analyzer.mcp-code-analyzer-0.3.0
```

### 3. Restart VS Code
Close and reopen VS Code to ensure proper activation.

## 🧪 Core Testing Procedures

### Test 1: Extension Activation & Server Path Display

**Objective**: Verify extension activates and displays server information

**Steps**:
1. Open VS Code
2. Open Command Palette (`Ctrl+Shift+P`)
3. Run: `MCP Analyzer: Show MCP Server Path`
4. Check Output panel for "MCP Code Analyzer"

**Expected Results**:
```
=============================================================
MCP Code Analyzer - Server Information
=============================================================
Server Path: /Users/[username]/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.3.0/server/server.js
Server Status: Available
Version: 0.3.0

MCP Configuration:
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["/Users/[username]/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.3.0/server/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
=============================================================
```

**Status Bar**: Should show "$(server) MCP Analyzer" with server path tooltip

### Test 2: MCP Server Connection Test

**Objective**: Verify MCP server responds correctly

**Steps**:
1. Open Command Palette
2. Run: `MCP Analyzer: Test MCP Server Connection`
3. Check for success message

**Expected Results**:
- Success notification: "MCP server connection successful"
- Server responds with version 0.3.0 and 10 available tools

### Test 3: Tool Registration Verification

**Objective**: Confirm all 10 tools are properly registered

**Manual Test**:
```bash
# Navigate to server directory
cd ~/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.3.0/server

# Test tools/list request
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node server.js
```

**Expected Tools List**:
1. `get_server_info` - Server information
2. `hello_world_analyzer` - Basic workspace detection
3. `run_full_analysis` - Comprehensive analysis
4. `git_list_branches` - Git branch listing
5. `git_get_current_branch` - Current branch info
6. `git_checkout_branch` - Branch switching
7. `git_get_repository_info` - Repository details
8. **`audit_dependencies`** - **NEW: Dependency vulnerability scan**
9. **`check_license_compliance`** - **NEW: License compliance check**
10. **`run_security_scan`** - **NEW: Comprehensive security analysis**

## 🔒 Security Tools Testing

### Test 4: Dependency Audit Tool

**Objective**: Test vulnerability scanning across different project types

#### Test 4a: JavaScript/npm Project
**Setup**:
```bash
# Create test project with dependencies
mkdir test-npm-project
cd test-npm-project
npm init -y
npm install express lodash
```

**Test Command**:
```bash
cd ~/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.3.0/server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "audit_dependencies", "arguments": {"workspace": "/path/to/test-npm-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "audit_dependencies",
  "success": true,
  "vulnerabilities": [...],
  "summary": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "moderate": 0,
    "low": 0,
    "info": 0
  },
  "packageManagers": ["npm"],
  "workspace": "/path/to/test-npm-project",
  "timestamp": "2025-07-15T..."
}
```

#### Test 4b: Python Project
**Setup**:
```bash
# Create test Python project
mkdir test-python-project
cd test-python-project
echo "requests==2.25.1" > requirements.txt
echo "flask==1.1.4" >> requirements.txt
```

**Test Command**: Same as above with Python project path

**Expected Results**: Should detect pip package manager and scan requirements.txt

#### Test 4c: Project Without Dependencies
**Setup**: Use current AnalyzerMCP project (clean dependencies)

**Expected Results**: Should report 0 vulnerabilities with clean summary

### Test 5: License Compliance Tool

**Objective**: Test license detection and compliance checking

#### Test 5a: npm License Check
**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "check_license_compliance", "arguments": {"workspace": "/path/to/test-npm-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "check_license_compliance",
  "success": true,
  "licenses": [
    {
      "package": "express@4.x.x",
      "license": "MIT",
      "version": "4.x.x",
      "packageManager": "npm"
    }
  ],
  "issues": [],
  "summary": {
    "total": 10,
    "restrictive": 0,
    "permissive": 8,
    "unknown": 2
  }
}
```

#### Test 5b: Missing License Tools
**Setup**: Test on system without license-checker installed

**Expected Results**: Should gracefully handle missing tools with informative message:
```json
{
  "issues": [{
    "package": "license-checker",
    "license": "missing",
    "issue": "license-checker not installed. Install with: npm install -g license-checker",
    "severity": "info"
  }]
}
```

### Test 6: Comprehensive Security Scan

**Objective**: Test unified security analysis combining dependency audit and license compliance

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "run_security_scan", "arguments": {"workspace": "/path/to/test-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "run_security_scan",
  "success": true,
  "workspace": "/path/to/test-project",
  "security": {
    "dependencies": { /* audit results */ },
    "licenses": { /* license results */ }
  },
  "summary": {
    "vulnerabilities": { "total": 0, "critical": 0, ... },
    "licenses": { "total": 10, "restrictive": 0, ... },
    "packageManagers": ["npm"]
  },
  "recommendations": [
    "✅ No known vulnerabilities found in dependencies",
    "✅ 8 packages with permissive licenses (MIT, BSD, Apache, etc.)",
    "🔒 Regularly update dependencies to latest secure versions",
    "📋 Consider implementing automated security scanning in CI/CD pipeline"
  ]
}
```

## 🔗 Cline Integration Testing

### Test 7: Cline MCP Integration

**Objective**: Verify security tools work through Cline chat interface

**Prerequisites**: 
- Cline extension installed and configured
- MCP server configuration added to Cline

#### Step 1: Configure Cline MCP Server

**Action**: Add MCP server configuration to Cline settings

**Configuration Path**: VS Code Settings → Extensions → Cline → MCP Settings

**Add this configuration**:
```json
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["/Users/[username]/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.3.0/server/server.js"]
    }
  }
}
```

**Replace `[username]` with your actual username**

#### Step 2: Restart Cline
1. Close Cline chat panel
2. Restart VS Code completely
3. Open Cline chat panel again

#### Step 3: Test Dependency Audit

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer audit_dependencies {"workspace": "/Users/muhammadahmed/Documents/option-core-ui/"}
```

**Expected Cline Response**:
```
✅ MCP Tool Result: audit_dependencies

{
  "tool": "audit_dependencies",
  "success": true,
  "vulnerabilities": [],
  "summary": {
    "total": 0,
    "critical": 0,
    "high": 0,
    "moderate": 0,
    "low": 0,
    "info": 0
  },
  "packageManagers": ["npm"],
  "workspace": "/Users/muhammadahmed/Documents/option-core-ui/",
  "timestamp": "2025-07-15T..."
}
```

**What this means**:
- ✅ **SUCCESS**: Tool executed without errors
- 🔍 **Detected**: npm package manager in the project
- 🛡️ **Security**: 0 vulnerabilities found (clean project)
- 📊 **Summary**: Breakdown by severity levels

#### Step 4: Test License Compliance

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer check_license_compliance {"workspace": "/Users/muhammadahmed/Documents/option-core-ui/"}
```

**Expected Cline Response**:
```
✅ MCP Tool Result: check_license_compliance

{
  "tool": "check_license_compliance",
  "success": true,
  "licenses": [],
  "issues": [
    {
      "package": "license-checker",
      "license": "missing",
      "issue": "license-checker not installed. Install with: npm install -g license-checker",
      "severity": "info"
    }
  ],
  "summary": {
    "total": 0,
    "restrictive": 0,
    "permissive": 0,
    "unknown": 0
  },
  "workspace": "/Users/muhammadahmed/Documents/option-core-ui/",
  "timestamp": "2025-07-15T..."
}
```

**What this means**:
- ✅ **SUCCESS**: Tool executed without errors
- ⚠️ **INFO**: license-checker tool not installed (optional)
- 📋 **Guidance**: Shows how to install license-checker for enhanced results
- 🔧 **Graceful**: Works even without optional tools

#### Step 5: Test Comprehensive Security Scan

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer run_security_scan {"workspace": "/Users/muhammadahmed/Documents/option-core-ui/"}
```

**Expected Cline Response**:
```
✅ MCP Tool Result: run_security_scan

{
  "tool": "run_security_scan",
  "success": true,
  "workspace": "/Users/muhammadahmed/Documents/option-core-ui/",
  "security": {
    "dependencies": {
      "success": true,
      "vulnerabilities": [],
      "summary": {
        "total": 0,
        "critical": 0,
        "high": 0,
        "moderate": 0,
        "low": 0,
        "info": 0
      },
      "packageManagers": ["npm"]
    },
    "licenses": {
      "success": true,
      "licenses": [],
      "issues": [
        {
          "package": "license-checker",
          "license": "missing",
          "issue": "license-checker not installed. Install with: npm install -g license-checker",
          "severity": "info"
        }
      ],
      "summary": {
        "total": 0,
        "restrictive": 0,
        "permissive": 0,
        "unknown": 0
      }
    }
  },
  "summary": {
    "vulnerabilities": {
      "total": 0,
      "critical": 0,
      "high": 0,
      "moderate": 0,
      "low": 0,
      "info": 0
    },
    "licenses": {
      "total": 0,
      "restrictive": 0,
      "permissive": 0,
      "unknown": 0
    },
    "packageManagers": ["npm"]
  },
  "recommendations": [
    "✅ No known vulnerabilities found in dependencies",
    "ℹ️ No license information available - install license checking tools",
    "🔒 Regularly update dependencies to latest secure versions",
    "📋 Consider implementing automated security scanning in CI/CD pipeline",
    "🛡️ Review and establish security policies for dependency management"
  ],
  "timestamp": "2025-07-15T..."
}
```

**What this means**:
- ✅ **COMPREHENSIVE**: Combined dependency audit + license compliance
- 🛡️ **SECURITY STATUS**: Clean project with 0 vulnerabilities
- 💡 **RECOMMENDATIONS**: 5 actionable security improvement suggestions
- 📊 **UNIFIED SUMMARY**: Complete security posture overview

#### Step 6: Test with Different Project

**What to type in Cline chat** (replace with your actual project path):
```
/use_mcp_tool code-analyzer run_security_scan {"workspace": "/path/to/your/project"}
```

**Try with different project types**:
- JavaScript project with package.json
- Python project with requirements.txt
- Empty directory (should handle gracefully)

#### Common Error Scenarios & Solutions

**❌ Error: "Unknown tool: audit_dependencies"**
```
Error executing MCP tool:
MCP error -32603: Unknown tool: audit_dependencies
```

**Solution**:
1. Check extension version: Should be `mcp-analyzer.mcp-code-analyzer-0.3.0`
2. Restart VS Code completely
3. Verify MCP server path in configuration
4. Test server manually: `cd ~/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.3.0/server && echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node server.js`

**❌ Error: "Server connection failed"**
```
Failed to connect to MCP server: code-analyzer
```

**Solution**:
1. Verify server file exists at configured path
2. Check Node.js version (requires v16+)
3. Test server manually with echo command
4. Check VS Code output panel for error details

**✅ Success Indicators**:
- No "Unknown tool" errors
- JSON response with proper structure
- Tools execute within reasonable time (< 30 seconds)
- Recommendations are relevant and actionable
- Error handling is graceful for missing tools

## 🚨 Error Handling Testing

### Test 8: Invalid Workspace Path

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "audit_dependencies", "arguments": {"workspace": "/nonexistent/path"}}}' | node server.js
```

**Expected Results**: Graceful error handling with descriptive message

### Test 9: Missing Package Manager Files

**Setup**: Test in directory without package.json, requirements.txt, or pom.xml

**Expected Results**: Should report no package managers detected, not crash

### Test 10: Network/Tool Timeout

**Objective**: Test behavior when external tools are slow or unresponsive

**Expected Results**: Should timeout gracefully and provide fallback information

## ✅ Success Criteria Checklist

### Core Functionality
- [ ] Extension activates successfully on VS Code startup
- [ ] Server path is displayed correctly in output panel
- [ ] Status bar shows MCP Analyzer with correct tooltip
- [ ] All 10 tools are registered and discoverable

### Security Tools
- [ ] `audit_dependencies` detects package managers correctly
- [ ] `audit_dependencies` parses vulnerability data properly
- [ ] `check_license_compliance` categorizes licenses correctly
- [ ] `run_security_scan` combines both analyses successfully
- [ ] Security recommendations are actionable and relevant

### Integration
- [ ] Cline can discover and use all security tools
- [ ] MCP protocol compliance maintained
- [ ] Error handling is graceful and informative
- [ ] Performance is acceptable for typical projects

### Edge Cases
- [ ] Handles missing security tools gracefully
- [ ] Works with projects having no dependencies
- [ ] Proper error messages for invalid inputs
- [ ] Timeout handling for slow operations

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Unknown tool: audit_dependencies" in Cline
**Solution**: 
1. Restart VS Code completely
2. Verify extension version is 0.3.0
3. Check MCP server path in configuration

**Issue**: Security tools report "tool not available"
**Solution**: Install optional security tools:
```bash
npm install -g license-checker
pip install pip-audit
pip install pip-licenses
```

**Issue**: Server connection fails
**Solution**:
1. Check Node.js version (requires v16+)
2. Verify server file exists at reported path
3. Test server manually with echo command

### Debug Mode
Enable debug logging in VS Code settings:
```json
{
  "mcpCodeAnalyzer.debug": true
}
```

## 📊 Performance Benchmarks

**Expected Performance**:
- Tool registration: < 1 second
- Dependency audit (small project): < 10 seconds
- License compliance check: < 5 seconds
- Comprehensive security scan: < 15 seconds

**Memory Usage**: < 50MB additional RAM usage

## 🎯 Testing Completion

After completing all tests, you should have:
- ✅ Verified all 10 MCP tools are working
- ✅ Confirmed security analysis capabilities
- ✅ Tested Cline integration
- ✅ Validated error handling
- ✅ Documented any issues or limitations

**Milestone 4 Testing Status**: Ready for approval and production use! 🚀
