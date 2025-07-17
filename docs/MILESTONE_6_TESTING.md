# Milestone 6 Testing Guide: Duplicate Code Detection

## 📋 Testing Overview

This guide provides comprehensive testing instructions for Milestone 6: Duplicate Code Detection features in the MCP Code Analyzer extension.

**Extension**: `mcp-code-analyzer-0.5.0.vsix`  
**Version**: 0.5.0  
**New Tools**: 3 duplicate code detection tools  
**Total Tools**: 16 (13 existing + 3 new)  

## 🛠️ Prerequisites

### Required Software
- **VS Code**: Version 1.74.0 or higher
- **Node.js**: Version 16+ (tested on v20.16.0)
- **Git**: For repository operations
- **Test Projects**: Projects with potential duplicate code for comprehensive testing

### Optional Tools (for enhanced testing)
```bash
# For comparison with external tools
npm install -g jscpd  # JavaScript Copy/Paste Detector
pip install vulture  # Python duplicate code detector
```

## 📦 Installation Steps

### 1. Install Extension
```bash
# Method 1: VS Code UI
# 1. Open VS Code
# 2. Go to Extensions (Ctrl+Shift+X)
# 3. Click "..." menu > "Install from VSIX..."
# 4. Select mcp-code-analyzer-0.5.0.vsix

# Method 2: Command line (if available)
code --install-extension mcp-code-analyzer-0.5.0.vsix
```

### 2. Verify Installation
```bash
# Check if extension is installed
code --list-extensions | grep mcp-code-analyzer
# Expected: mcp-analyzer.mcp-code-analyzer-0.5.0
```

### 3. Restart VS Code
Close and reopen VS Code to ensure proper activation.

## 🧪 Core Testing Procedures

### Test 1: Extension Activation & Server Path Display

**Objective**: Verify extension activates and displays updated server information

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
Server Path: /Users/[username]/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.5.0/server/server.js
Server Status: Available
Version: 0.5.0

MCP Configuration:
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["/Users/[username]/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.5.0/server/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
=============================================================
```

**Status Bar**: Should show "$(server) MCP Analyzer" with updated server path tooltip

### Test 2: Tool Registration Verification

**Objective**: Confirm all 16 tools are properly registered including new duplicate detection tools

**Manual Test**:
```bash
# Navigate to server directory
cd ~/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.5.0/server

# Test tools/list request
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node server.js
```

**Expected Tools List** (16 total):
1. `get_server_info` - Server information
2. `hello_world_analyzer` - Basic workspace detection
3. `run_full_analysis` - Comprehensive analysis
4. `git_list_branches` - Git branch listing
5. `git_get_current_branch` - Current branch info
6. `git_checkout_branch` - Branch switching
7. `git_get_repository_info` - Repository details
8. `audit_dependencies` - Dependency vulnerability scan
9. `check_license_compliance` - License compliance check
10. `run_security_scan` - Comprehensive security analysis
11. `analyze_code_metrics` - Comprehensive code metrics analysis
12. `identify_large_files` - Large file detection and analysis
13. `calculate_complexity_metrics` - Complexity analysis and reporting
14. **`find_duplicate_code`** - **NEW: Comprehensive duplicate and similar code detection**
15. **`detect_exact_duplicates`** - **NEW: Exact duplicate detection using content hashing**
16. **`analyze_code_similarity`** - **NEW: Token-based similarity analysis**

## 🔍 Duplicate Code Detection Tools Testing

### Test 3: Comprehensive Duplicate Code Detection

**Objective**: Test the main duplicate detection tool across different scenarios

#### Test 3a: Create Test Project with Duplicates
**Setup**:
```bash
# Create test project with duplicate code
mkdir test-duplicate-project
cd test-duplicate-project

# Create identical files (exact duplicates)
echo 'function calculateSum(a, b) { return a + b; }' > math1.js
echo 'function calculateSum(a, b) { return a + b; }' > math2.js

# Create similar files (near duplicates)
echo 'function addNumbers(x, y) { return x + y; }' > add1.js
echo 'function addValues(a, b) { return a + b; }' > add2.js

# Create duplicate code blocks within different files
cat > utils1.js << 'EOF'
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function processData(data) {
    return data.map(item => item.value);
}
EOF

cat > utils2.js << 'EOF'
function checkEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function transformData(data) {
    return data.map(item => item.value);
}
EOF

# Create Python duplicates
echo 'def calculate_sum(a, b):\n    return a + b' > math1.py
echo 'def calculate_sum(a, b):\n    return a + b' > math2.py
```

**Test Command**:
```bash
cd ~/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.5.0/server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "find_duplicate_code", "arguments": {"workspace": "/path/to/test-duplicate-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "find_duplicate_code",
  "success": true,
  "workspace": "/path/to/test-duplicate-project",
  "summary": {
    "totalFiles": 7,
    "analyzedFiles": 7,
    "duplicateBlocks": 4,
    "duplicateLines": 8,
    "duplicatePercentage": 25.5,
    "affectedFiles": 6
  },
  "duplicates": [
    {
      "type": "exact",
      "files": [
        {"path": "math1.js", "lines": 1, "language": "javascript"},
        {"path": "math2.js", "lines": 1, "language": "javascript"}
      ],
      "similarity": 1.0
    },
    {
      "type": "exact",
      "files": [
        {"path": "math1.py", "lines": 2, "language": "python"},
        {"path": "math2.py", "lines": 2, "language": "python"}
      ],
      "similarity": 1.0
    }
  ],
  "exactDuplicates": [
    {
      "type": "exact",
      "hash": "abc123...",
      "files": [
        {"path": "math1.js", "lines": 1, "language": "javascript"},
        {"path": "math2.js", "lines": 1, "language": "javascript"}
      ]
    }
  ],
  "similarDuplicates": [
    {
      "type": "similar",
      "files": [
        {"path": "add1.js", "lines": 1, "language": "javascript"},
        {"path": "add2.js", "lines": 1, "language": "javascript"}
      ],
      "similarity": 0.85
    }
  ],
  "recommendations": [
    "🚨 2 exact duplicate files found - consider removing or consolidating",
    "🔄 2 exact duplicate code blocks found - extract into shared functions",
    "⚠️ 1 similar files found - review for potential consolidation",
    "📊 Moderate duplication rate (25.5%) - consider refactoring"
  ]
}
```

#### Test 3b: Custom Thresholds Testing
**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "find_duplicate_code", "arguments": {"workspace": "/path/to/test-project", "thresholds": {"minLines": 3, "similarityThreshold": 0.9}}}}' | node server.js
```

**Expected Results**: Should use stricter thresholds and detect fewer duplicates

#### Test 3c: Real Project Analysis
**Setup**: Use current AnalyzerMCP project

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "find_duplicate_code", "arguments": {"workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP"}}}' | node server.js
```

**Expected Results**: Should analyze the actual project and identify any duplicate code patterns

### Test 4: Exact Duplicate Detection Tool

**Objective**: Test focused exact duplicate detection with content hashing

#### Test 4a: Default Exact Duplicate Detection
**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "detect_exact_duplicates", "arguments": {"workspace": "/path/to/test-duplicate-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "detect_exact_duplicates",
  "success": true,
  "workspace": "/path/to/test-duplicate-project",
  "exactDuplicates": [
    {
      "type": "exact",
      "hash": "abc123def456",
      "files": [
        {
          "path": "math1.js",
          "lines": 1,
          "sizeBytes": 45,
          "language": "javascript"
        },
        {
          "path": "math2.js",
          "lines": 1,
          "sizeBytes": 45,
          "language": "javascript"
        }
      ],
      "duplicateLines": 1,
      "similarity": 1.0
    },
    {
      "type": "exact-block",
      "hash": "def456ghi789",
      "instances": [
        {
          "path": "utils1.js",
          "startLine": 2,
          "endLine": 4,
          "lines": 3,
          "language": "javascript"
        },
        {
          "path": "utils2.js",
          "startLine": 2,
          "endLine": 4,
          "lines": 3,
          "language": "javascript"
        }
      ],
      "duplicateLines": 3,
      "similarity": 1.0,
      "content": "const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nreturn regex.test(email);"
    }
  ],
  "summary": {
    "totalFiles": 7,
    "analyzedFiles": 7,
    "exactDuplicateBlocks": 2,
    "exactDuplicateLines": 4
  },
  "thresholds": {
    "minLines": 5,
    "similarityThreshold": 0.8,
    "minTokens": 10,
    "maxFileSize": 1048576
  },
  "recommendations": [
    "🚨 1 exact duplicate files found - consider removing or consolidating",
    "🔄 1 exact duplicate code blocks found - extract into shared functions"
  ]
}
```

#### Test 4b: Custom Minimum Lines Threshold
**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "detect_exact_duplicates", "arguments": {"workspace": "/path/to/project", "thresholds": {"minLines": 2}}}}' | node server.js
```

**Expected Results**: Should detect smaller duplicate blocks with 2+ lines

### Test 5: Code Similarity Analysis

**Objective**: Test token-based similarity analysis for near-duplicate detection

#### Test 5a: JavaScript Similarity Analysis
**Setup**:
```bash
# Create files with similar but not identical code
cat > similar1.js << 'EOF'
function processUserData(userData) {
    if (!userData || !userData.email) {
        throw new Error('Invalid user data');
    }
    
    const normalizedEmail = userData.email.toLowerCase().trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    
    if (!isValidEmail) {
        throw new Error('Invalid email format');
    }
    
    return {
        id: userData.id,
        email: normalizedEmail,
        name: userData.name || 'Unknown'
    };
}
EOF

cat > similar2.js << 'EOF'
function handleUserInfo(userInfo) {
    if (!userInfo || !userInfo.email) {
        throw new Error('User data is invalid');
    }
    
    const cleanEmail = userInfo.email.toLowerCase().trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    
    if (!emailValid) {
        throw new Error('Email format is invalid');
    }
    
    return {
        userId: userInfo.id,
        emailAddress: cleanEmail,
        userName: userInfo.name || 'Unknown User'
    };
}
EOF
```

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "analyze_code_similarity", "arguments": {"workspace": "/path/to/similar-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "analyze_code_similarity",
  "success": true,
  "workspace": "/path/to/similar-project",
  "similarDuplicates": [
    {
      "type": "similar",
      "files": [
        {
          "path": "similar1.js",
          "lines": 18,
          "language": "javascript"
        },
        {
          "path": "similar2.js",
          "lines": 18,
          "language": "javascript"
        }
      ],
      "similarity": 0.87,
      "duplicateLines": 18
    }
  ],
  "summary": {
    "totalFiles": 2,
    "analyzedFiles": 2,
    "similarDuplicateBlocks": 1,
    "averageSimilarity": 0.87,
    "duplicatePercentage": 50.0
  },
  "thresholds": {
    "similarityThreshold": 0.8,
    "minTokens": 10
  },
  "recommendations": [
    "⚠️ 1 similar files found - review for potential consolidation",
    "📊 High duplication rate (50.0%) - significant refactoring opportunity"
  ]
}
```

#### Test 5b: Python Similarity Analysis
**Setup**:
```bash
# Create similar Python files
cat > similar1.py << 'EOF'
def validate_user_input(user_data):
    if not user_data or 'email' not in user_data:
        raise ValueError('Invalid user data provided')
    
    email = user_data['email'].lower().strip()
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        raise ValueError('Invalid email format')
    
    return {
        'id': user_data.get('id'),
        'email': email,
        'name': user_data.get('name', 'Unknown')
    }
EOF

cat > similar2.py << 'EOF'
def process_user_info(user_info):
    if not user_info or 'email' not in user_info:
        raise ValueError('User information is invalid')
    
    email_addr = user_info['email'].lower().strip()
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email_addr):
        raise ValueError('Email format is invalid')
    
    return {
        'user_id': user_info.get('id'),
        'email_address': email_addr,
        'user_name': user_info.get('name', 'Unknown User')
    }
EOF
```

**Expected Results**: Should detect high similarity between Python functions with similar logic

#### Test 5c: Custom Similarity Threshold
**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "analyze_code_similarity", "arguments": {"workspace": "/path/to/project", "thresholds": {"similarityThreshold": 0.95, "minTokens": 20}}}}' | node server.js
```

**Expected Results**: Should use stricter similarity threshold and detect fewer similar files

## 🔗 Cline Integration Testing

### Test 6: Cline MCP Integration

**Objective**: Verify duplicate detection tools work through Cline chat interface

**Prerequisites**: 
- Cline extension installed and configured
- MCP server configuration added to Cline

**MCP Configuration for Cline**:
```json
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["/Users/[username]/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.5.0/server/server.js"]
    }
  }
}
```

#### Step 1: Test Comprehensive Duplicate Detection

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer find_duplicate_code {"workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP"}
```

**Expected Cline Response**:
```
✅ MCP Tool Result: find_duplicate_code

{
  "tool": "find_duplicate_code",
  "success": true,
  "workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP",
  "summary": {
    "totalFiles": 10,
    "analyzedFiles": 8,
    "duplicateBlocks": 2,
    "duplicateLines": 15,
    "duplicatePercentage": 5.2,
    "affectedFiles": 4
  },
  "duplicates": [
    {
      "type": "exact-block",
      "instances": [
        {
          "path": "server/git-analyzer.js",
          "startLine": 45,
          "endLine": 52,
          "lines": 8,
          "language": "javascript"
        },
        {
          "path": "server/security-analyzer.js",
          "startLine": 78,
          "endLine": 85,
          "lines": 8,
          "language": "javascript"
        }
      ],
      "similarity": 1.0,
      "content": "// Error handling pattern"
    }
  ],
  "recommendations": [
    "🔄 2 exact duplicate code blocks found - extract into shared functions",
    "✅ Low duplication rate (5.2%) - good code reuse practices",
    "🏗️ Consider extracting common code into shared modules or libraries"
  ]
}
```

**What this means**:
- ✅ **SUCCESS**: Tool executed without errors
- 🔍 **DETECTION**: Found duplicate code blocks across different files
- 📊 **ANALYSIS**: Low duplication rate indicates good code practices
- 💡 **RECOMMENDATIONS**: Specific suggestions for code improvement

#### Step 2: Test Exact Duplicate Detection

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer detect_exact_duplicates {"workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP"}
```

**Expected Cline Response**:
```
✅ MCP Tool Result: detect_exact_duplicates

{
  "tool": "detect_exact_duplicates",
  "success": true,
  "exactDuplicates": [
    {
      "type": "exact-block",
      "hash": "a1b2c3d4e5f6",
      "instances": [
        {
          "path": "server/git-analyzer.js",
          "startLine": 25,
          "endLine": 30,
          "lines": 6,
          "language": "javascript"
        },
        {
          "path": "server/metrics-analyzer.js",
          "startLine": 15,
          "endLine": 20,
          "lines": 6,
          "language": "javascript"
        }
      ],
      "duplicateLines": 6,
      "similarity": 1.0,
      "content": "// File validation logic"
    }
  ],
  "summary": {
    "totalFiles": 10,
    "analyzedFiles": 8,
    "exactDuplicateBlocks": 1,
    "exactDuplicateLines": 6
  },
  "recommendations": [
    "🔄 1 exact duplicate code blocks found - extract into shared functions"
  ]
}
```

**What this means**:
- ✅ **FOCUSED**: Specific exact duplicate detection with content hashing
- 🎯 **PRECISE**: Exact matches with line numbers and file locations
- 🔧 **ACTIONABLE**: Clear recommendations for refactoring
- 📍 **DETAILED**: Shows exact content and locations of duplicates

#### Step 3: Test Code Similarity Analysis

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer analyze_code_similarity {"workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP"}
```

**Expected Cline Response**:
```
✅ MCP Tool Result: analyze_code_similarity

{
  "tool": "analyze_code_similarity",
  "success": true,
  "similarDuplicates": [
    {
      "type": "similar",
      "files": [
        {
          "path": "server/git-analyzer.js",
          "lines": 150,
          "language": "javascript"
        },
        {
          "path": "server/security-analyzer.js",
          "lines": 180,
          "language": "javascript"
        }
      ],
      "similarity": 0.82,
      "duplicateLines": 150
    }
  ],
  "summary": {
    "totalFiles": 10,
    "analyzedFiles": 8,
    "similarDuplicateBlocks": 1,
    "averageSimilarity": 0.82,
    "duplicatePercentage": 8.5
  },
  "recommendations": [
    "⚠️ 1 similar files found - review for potential consolidation",
    "✅ Low duplication rate (8.5%) - good code reuse practices"
  ]
}
```

**What this means**:
- ✅ **SIMILARITY**: Token-based analysis detecting near-duplicates
- 📊 **METRICS**: Average similarity scores and percentages
- 🔍 **INSIGHTS**: Files with similar patterns and structures
- 💡 **GUIDANCE**: Recommendations for potential consolidation

#### Step 4: Test Custom Thresholds

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer find_duplicate_code {"workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP", "thresholds": {"minLines": 3, "similarityThreshold": 0.9}}
```

**Expected Results**: Should use stricter thresholds and detect fewer duplicates

#### Common Error Scenarios & Solutions

**❌ Error: "Unknown tool: find_duplicate_code"**
```
Error executing MCP tool:
MCP error -32603: Unknown tool: find_duplicate_code
```

**Solution**:
1. Check extension version: Should be `mcp-analyzer.mcp-code-analyzer-0.5.0`
2. Restart VS Code completely
3. Verify MCP server path in configuration
4. Test server manually: `cd ~/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.5.0/server && echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node server.js`

**❌ Error: "No files analyzed"**
```
{
  "success": true,
  "summary": {
    "totalFiles": 0,
    "analyzedFiles": 0
  }
}
```

**Solution**: 
1. Check workspace path is correct
2. Ensure project contains supported file types (.js, .py, .java, etc.)
3. Verify files are not too large (default max: 1MB)
4. Check that directories aren't being skipped (node_modules, .git, etc.)

**❌ Error: "Workspace directory does not exist"**
```
{
  "success": false,
  "error": "Workspace directory does not exist: /invalid/path"
}
```

**Solution**: Verify the workspace path exists and is accessible

**✅ Success Indicators**:
- No "Unknown tool" errors for duplicate detection tools
- JSON response with proper duplicate analysis structure
- Tools execute within reasonable time (< 120 seconds for large projects)
- Recommendations are relevant and actionable
- Language detection works correctly for supported file types

## 🚨 Error Handling Testing

### Test 7: Invalid Workspace Path

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "find_duplicate_code", "arguments": {"workspace": "/nonexistent/path"}}}' | node server.js
```

**Expected Results**: Graceful error handling with descriptive message

### Test 8: Empty Directory

**Setup**: Test in directory with no supported files

**Expected Results**: Should report 0 files analyzed, not crash

### Test 9: Very Large Files

**Setup**: Test with files larger than 1MB

**Expected Results**: Should skip large files and continue analysis

### Test 10: Binary Files

**Setup**: Test directory containing binary files (.exe, .jpg, .pdf)

**Expected Results**: Should skip binary files and analyze only supported text files

## 📊 Performance Benchmarks

**Expected Performance**:
- Tool registration: < 1 second
- Small project analysis (< 20 files): < 10 seconds
- Medium project analysis (< 100 files): < 60 seconds
- Large project analysis (< 500 files): < 300 seconds

**Memory Usage**: < 300MB for typical projects

**File Size Limits**:
- Default maximum file size: 1MB
- Configurable via `maxFileSize` threshold
- Files exceeding limit are skipped with warning

## ✅ Success Criteria Checklist

### Core Functionality
- [ ] Extension activates successfully with version 0.5.0
- [ ] Server path displays correctly in output panel
- [ ] Status bar shows MCP Analyzer with correct tooltip
- [ ] All 16 tools are registered and discoverable

### Duplicate Detection Tools
- [ ] `find_duplicate_code` provides comprehensive duplicate analysis
- [ ] `detect_exact_duplicates` identifies exact matches using content hashing
- [ ] `analyze_code_similarity` detects similar code using token comparison
- [ ] Custom thresholds work as expected for all tools
- [ ] Multi-language support functions properly (JavaScript, Python, Java, etc.)

### Analysis Quality
- [ ] Exact duplicates are correctly identified with 1.0 similarity
- [ ] Similar code is detected with appropriate similarity scores (0.8-0.99)
- [ ] Code blocks are properly extracted and compared
- [ ] File-level and block-level duplicates are both detected
- [ ] Content normalization works correctly (whitespace, comments)

### Integration
- [ ] Cline can discover and use all duplicate detection tools
- [ ] MCP protocol compliance maintained
- [ ] Error handling is graceful and informative
- [ ] Performance is acceptable for typical projects

### Edge Cases
- [ ] Handles missing files gracefully
- [ ] Works with projects having no duplicate code
- [ ] Proper error messages for invalid inputs
- [ ] Timeout handling for large projects
- [ ] Binary file filtering works correctly

## 🐛 Troubleshooting

### Common Issues

**Issue**: "find_duplicate_code not found" in Cline
**Solution**: 
1. Restart VS Code completely
2. Verify extension version is 0.5.0
3. Check MCP server path in configuration

**Issue**: Duplicate analysis takes too long
**Solution**: 
1. Check project size (very large projects may take time)
2. Adjust `maxFileSize` threshold to skip large files
3. Use `minLines` threshold to focus on larger duplicates

**Issue**: No duplicates detected in project with obvious duplicates
**Solution**:
1. Check similarity threshold (default 0.8 may be too strict)
2. Verify minimum lines threshold (default 5 may be too high)
3. Ensure files are in supported languages
4. Check that content normalization isn't removing too much

**Issue**: Too many false positives in similarity detection
**Solution**:
1. Increase similarity threshold (e.g., 0.9 or 0.95)
2. Increase minimum tokens threshold
3. Review language-specific tokenization patterns

### Debug Mode
Enable debug logging in VS Code settings:
```json
{
  "mcpCodeAnalyzer.debug": true
}
```

### Performance Optimization
For large projects:
```json
{
  "thresholds": {
    "minLines": 10,
    "maxFileSize": 524288,
    "similarityThreshold": 0.9
  }
}
```

## 🎯 Testing Completion

After completing all tests, you should have:
- ✅ Verified all 16 MCP tools are working
- ✅ Confirmed duplicate code detection capabilities
- ✅ Tested exact duplicate detection with content hashing
- ✅ Validated similarity analysis with token comparison
- ✅ Tested Cline integration with all duplicate detection tools
- ✅ Validated error handling and edge cases
- ✅ Tested performance with various project sizes
- ✅ Documented any issues or limitations

**Milestone 6 Testing Status**: Ready for approval and production use! 🔍🚀

## 📈 Advanced Testing Scenarios

### Multi-Language Duplicate Detection
Test duplicate detection across different programming languages:
- JavaScript/TypeScript duplicates
- Python duplicate functions
- Java duplicate classes
- Mixed-language similar patterns

### Large Codebase Testing
Test with real-world large projects:
- Open source repositories (React, Vue, Angular)
- Enterprise codebases with known duplication
- Legacy projects with copy-paste patterns

### Refactoring Validation
Use duplicate detection to validate refactoring efforts:
1. Run analysis before refactoring
2. Perform code consolidation
3. Run analysis again to verify reduction in duplicates
4. Measure improvement in duplication percentage

**Milestone 6: Duplicate Code Detection - COMPREHENSIVE TESTING COMPLETE! 🔍✨**
