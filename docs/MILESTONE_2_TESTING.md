# Milestone 2 Testing Guide - Git Repository Operations

## Overview
This document provides step-by-step instructions for testing the Milestone 2 deliverable of the MCP Code Analyzer extension with Git repository operations.

## Deliverable
- **File**: `mcp-code-analyzer-0.2.0.vsix`
- **Status**: Ready for internal testing
- **Scope**: Git branch listing, selection, checkout, and repository information

## Prerequisites
- VS Code (version 1.74.0 or higher)
- Node.js (version 16.0.0 or higher)
- Git repository with multiple branches (for testing)
- Basic familiarity with VS Code extensions

## Installation Instructions

### Step 1: Install the Updated Extension
```bash
# Uninstall previous version if installed
code --uninstall-extension mcp-analyzer.mcp-code-analyzer

# Install the new version
code --install-extension mcp-code-analyzer-0.2.0.vsix

# Verify installation
code --list-extensions | grep mcp-code-analyzer
```

Expected output: `mcp-analyzer.mcp-code-analyzer`

## Testing Checklist

### ✅ Test 1: Extension Activation (Milestone 1 Features)
**Objective**: Verify all Milestone 1 features still work

**Steps**:
1. Open VS Code
2. Wait for extension to activate
3. Check VS Code Output panel for "MCP Code Analyzer"
4. Verify status bar shows "MCP Analyzer"

**Expected Results**:
- Extension activates without errors
- Server path information displayed
- Status bar integration working
- All Milestone 1 commands available

### ✅ Test 2: Updated Server Info
**Objective**: Verify server shows new git capabilities

**Steps**:
1. Open Command Palette (Ctrl+Shift+P)
2. Run "MCP Analyzer: Test MCP Server Connection"
3. Check console output for server capabilities

**Expected Results**:
- Server version shows 0.2.0
- Capabilities include new git tools:
  - `git_list_branches`
  - `git_get_current_branch`
  - `git_checkout_branch`
  - `git_get_repository_info`

### ✅ Test 3: Git Branch Listing
**Objective**: Test git branch listing functionality

**Prerequisites**: Open a git repository in VS Code

**Steps**:
1. Open Command Palette
2. Run "MCP Analyzer: List Git Branches"
3. Check notifications and console output

**Expected Results**:
- Success notification: "Git branches listed successfully!"
- Console shows branch information including:
  - Current branch
  - All available branches
  - Commit hashes

**Sample Output**:
```json
{
  "tool": "git_list_branches",
  "success": true,
  "data": {
    "current": "master",
    "all": [
      {
        "name": "master",
        "current": true,
        "commit": "abc123...",
        "label": "master"
      },
      {
        "name": "feature-branch",
        "current": false,
        "commit": "def456...",
        "label": "feature-branch"
      }
    ]
  }
}
```

### ✅ Test 4: Current Branch Detection
**Objective**: Test current branch detection

**Steps**:
1. Open Command Palette
2. Run "MCP Analyzer: Show Current Git Branch"
3. Check notifications and console output

**Expected Results**:
- Success notification: "Current git branch retrieved successfully!"
- Console shows current branch details:
  - Branch name
  - Ahead/behind status
  - Modified/staged files count

### ✅ Test 5: Branch Selection UI
**Objective**: Test interactive branch selection and checkout

**Prerequisites**: Git repository with multiple branches

**Steps**:
1. Open Command Palette
2. Run "MCP Analyzer: Select Git Branch"
3. Wait for Quick Pick to appear
4. Select a different branch
5. Confirm checkout

**Expected Results**:
- Quick Pick shows all available branches
- Current branch marked with "(current)"
- Branch commit hashes shown as details
- Successful checkout notification
- Git working directory switches to selected branch

**UI Elements**:
- Quick Pick placeholder: "Select a branch to checkout"
- Branch items show:
  - Label: Branch name
  - Description: "(current)" for active branch
  - Detail: Commit hash

### ✅ Test 6: Repository Information
**Objective**: Test comprehensive repository info

**Steps**:
1. Open Command Palette
2. Run "MCP Analyzer: Show Git Repository Info"
3. Check console output for detailed info

**Expected Results**:
- Success notification: "Git repository info retrieved successfully!"
- Console shows comprehensive repository data:
  - Remote repositories
  - Current status (staged, modified files)
  - Recent commits (last 5)
  - Branch tracking information

### ✅ Test 7: Error Handling
**Objective**: Test error handling for non-git directories

**Steps**:
1. Open a non-git directory in VS Code
2. Try running any git command
3. Verify error handling

**Expected Results**:
- Appropriate error messages for non-git repositories
- No crashes or unhandled exceptions
- Clear error descriptions in notifications

### ✅ Test 8: Command Palette Integration
**Objective**: Verify all new commands are available

**Steps**:
1. Open Command Palette
2. Type "MCP Analyzer"
3. Verify all commands appear

**Expected Commands**:
- `MCP Analyzer: Run Full Analysis`
- `MCP Analyzer: Show MCP Server Path`
- `MCP Analyzer: Test MCP Server Connection`
- `MCP Analyzer: Run Hello World Analyzer`
- **NEW**: `MCP Analyzer: List Git Branches`
- **NEW**: `MCP Analyzer: Show Current Git Branch`
- **NEW**: `MCP Analyzer: Select Git Branch`
- **NEW**: `MCP Analyzer: Show Git Repository Info`

## Advanced Testing Scenarios

### Scenario 1: Multi-Branch Repository
**Setup**: Repository with local and remote branches
**Test**: Verify all branch types are detected and can be checked out

### Scenario 2: Dirty Working Directory
**Setup**: Repository with uncommitted changes
**Test**: Verify branch switching handles dirty state appropriately

### Scenario 3: Remote Branch Checkout
**Setup**: Repository with remote branches not yet checked out locally
**Test**: Verify remote branches can be checked out and tracked

## Troubleshooting

### Issue: Git Commands Fail
**Symptoms**: "Not a git repository" errors
**Solutions**:
1. Ensure VS Code is opened in a git repository
2. Verify `.git` directory exists in workspace
3. Check git is installed and accessible

### Issue: Branch Selection Shows No Branches
**Symptoms**: Empty Quick Pick or error in branch listing
**Solutions**:
1. Verify repository has commits
2. Check git repository is properly initialized
3. Ensure user has read permissions

### Issue: Checkout Fails
**Symptoms**: Branch checkout returns error
**Solutions**:
1. Check for uncommitted changes
2. Verify branch exists and is accessible
