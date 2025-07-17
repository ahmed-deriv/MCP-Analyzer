# Milestone 3 Testing Guide: Unit Test Execution & Coverage

## 📋 Testing Overview

This guide provides comprehensive testing instructions for Milestone 3: Unit Test Execution & Coverage features in the MCP Code Analyzer extension.

**Extension**: `mcp-code-analyzer-0.6.0.vsix`  
**Version**: 0.6.0  
**New Tools**: 3 test execution and coverage tools  
**Total Tools**: 19 (16 existing + 3 new)  

## 🛠️ Prerequisites

### Required Software
- **VS Code**: Version 1.74.0 or higher
- **Node.js**: Version 16+ (tested on v20.16.0)
- **Git**: For repository operations
- **Test Projects**: Projects with existing test frameworks for comprehensive testing

### Test Framework Dependencies (for testing)
```bash
# JavaScript/TypeScript testing
npm install -g jest mocha nyc vitest

# Python testing
pip install pytest coverage pytest-cov

# Java testing (requires Maven or Gradle)
# Ensure mvn or gradle is available in PATH

# .NET testing (requires .NET SDK)
# Ensure dotnet is available in PATH
```

## 📦 Installation Steps

### 1. Install Extension
```bash
# Method 1: VS Code UI
# 1. Open VS Code
# 2. Go to Extensions (Ctrl+Shift+X)
# 3. Click "..." menu > "Install from VSIX..."
# 4. Select mcp-code-analyzer-0.6.0.vsix

# Method 2: Command line (if available)
code --install-extension mcp-code-analyzer-0.6.0.vsix
```

### 2. Verify Installation
```bash
# Check if extension is installed
code --list-extensions | grep mcp-code-analyzer
# Expected: mcp-analyzer.mcp-code-analyzer-0.6.0
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
Server Path: /Users/[username]/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.6.0/server/server.js
Server Status: Available
Version: 0.6.0

MCP Configuration:
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["/Users/[username]/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.6.0/server/server.js"],
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

**Objective**: Confirm all 19 tools are properly registered including new test execution tools

**Manual Test**:
```bash
# Navigate to server directory
cd ~/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.6.0/server

# Test tools/list request
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node server.js
```

**Expected Tools List** (19 total):
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
14. `find_duplicate_code` - Comprehensive duplicate and similar code detection
15. `detect_exact_duplicates` - Exact duplicate detection using content hashing
16. `analyze_code_similarity` - Token-based similarity analysis
17. **`detect_test_frameworks`** - **NEW: Detect available test frameworks (Jest, Mocha, pytest, JUnit, etc.)**
18. **`run_tests`** - **NEW: Execute tests using detected frameworks and return results**
19. **`run_test_coverage`** - **NEW: Execute test coverage analysis and return detailed metrics**

## 🧪 Test Execution & Coverage Tools Testing

### Test 3: Test Framework Detection

**Objective**: Test the framework detection tool across different project types

#### Test 3a: JavaScript/TypeScript Project Detection
**Setup**:
```bash
# Create test JavaScript project with Jest
mkdir test-js-project
cd test-js-project
npm init -y
npm install --save-dev jest

# Add test script to package.json
echo '{
  "name": "test-js-project",
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}' > package.json

# Create a simple test file
echo 'test("sample test", () => {
  expect(1 + 1).toBe(2);
});' > sample.test.js
```

**Test Command**:
```bash
cd ~/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.6.0/server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "detect_test_frameworks", "arguments": {"workspace": "/path/to/test-js-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "detect_test_frameworks",
  "success": true,
  "workspace": "/path/to/test-js-project",
  "frameworks": [
    {
      "language": "javascript",
      "framework": "jest",
      "version": "^29.0.0",
      "configPath": "/path/to/test-js-project/package.json"
    }
  ],
  "supportedFrameworks": ["javascript", "python", "java", "csharp"],
  "recommendations": [
    "✅ 1 test framework(s) detected",
    "javascript: jest",
    "🚀 Run tests regularly during development",
    "📊 Consider adding code coverage analysis"
  ]
}
```

#### Test 3b: Python Project Detection
**Setup**:
```bash
# Create test Python project with pytest
mkdir test-python-project
cd test-python-project

# Create pytest configuration
echo '[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*' > pytest.ini

# Create test file
mkdir tests
echo 'def test_sample():
    assert 1 + 1 == 2

def test_another():
    assert "hello".upper() == "HELLO"' > tests/test_sample.py
```

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "detect_test_frameworks", "arguments": {"workspace": "/path/to/test-python-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "detect_test_frameworks",
  "success": true,
  "workspace": "/path/to/test-python-project",
  "frameworks": [
    {
      "language": "python",
      "framework": "pytest",
      "version": "7.4.0",
      "configPath": "/path/to/test-python-project/pytest.ini"
    }
  ],
  "supportedFrameworks": ["javascript", "python", "java", "csharp"],
  "recommendations": [
    "✅ 1 test framework(s) detected",
    "python: pytest",
    "🚀 Run tests regularly during development",
    "📊 Consider adding code coverage analysis"
  ]
}
```

#### Test 3c: No Test Framework Detection
**Setup**: Test in directory with no test frameworks

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "detect_test_frameworks", "arguments": {"workspace": "/path/to/empty-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "detect_test_frameworks",
  "success": true,
  "workspace": "/path/to/empty-project",
  "frameworks": [],
  "supportedFrameworks": ["javascript", "python", "java", "csharp"],
  "recommendations": [
    "📦 No test frameworks detected - consider adding testing to your project",
    "🧪 Recommended frameworks: Jest (JavaScript), pytest (Python), JUnit (Java)",
    "✅ Testing improves code quality and reduces bugs"
  ]
}
```

### Test 4: Test Execution

**Objective**: Test the test execution tool with different frameworks

#### Test 4a: JavaScript Jest Test Execution
**Setup**: Use the JavaScript project from Test 3a

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "run_tests", "arguments": {"workspace": "/path/to/test-js-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "run_tests",
  "success": true,
  "workspace": "/path/to/test-js-project",
  "frameworks": [
    {
      "language": "javascript",
      "framework": "jest",
      "version": "^29.0.0",
      "configPath": "/path/to/test-js-project/package.json"
    }
  ],
  "testResults": [
    {
      "framework": "jest",
      "language": "javascript",
      "success": true,
      "totalTests": 1,
      "passed": 1,
      "failed": 0,
      "skipped": 0,
      "duration": 1250,
      "testFiles": ["sample.test.js"]
    }
  ],
  "summary": {
    "totalTests": 1,
    "passed": 1,
    "failed": 0,
    "skipped": 0,
    "duration": 1250
  },
  "recommendations": [
    "✅ 1 tests passing - good test coverage",
    "🧪 Run tests regularly during development",
    "🔄 Set up automated testing in CI/CD pipeline",
    "📊 Monitor test coverage and aim for >80% coverage"
  ]
}
```

#### Test 4b: Python pytest Test Execution
**Setup**: Use the Python project from Test 3b

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "run_tests", "arguments": {"workspace": "/path/to/test-python-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "run_tests",
  "success": true,
  "workspace": "/path/to/test-python-project",
  "frameworks": [
    {
      "language": "python",
      "framework": "pytest",
      "version": "7.4.0",
      "configPath": "/path/to/test-python-project/pytest.ini"
    }
  ],
  "testResults": [
    {
      "framework": "pytest",
      "language": "python",
      "success": true,
      "totalTests": 2,
      "passed": 2,
      "failed": 0,
      "skipped": 0,
      "duration": 890,
      "testFiles": ["tests/test_sample.py"]
    }
  ],
  "summary": {
    "totalTests": 2,
    "passed": 2,
    "failed": 0,
    "skipped": 0,
    "duration": 890
  },
  "recommendations": [
    "✅ 2 tests passing - good test coverage",
    "🧪 Run tests regularly during development",
    "🔄 Set up automated testing in CI/CD pipeline",
    "📊 Monitor test coverage and aim for >80% coverage"
  ]
}
```

#### Test 4c: Failed Test Execution
**Setup**: Create a test with intentional failures

**JavaScript Failing Test**:
```bash
echo 'test("failing test", () => {
  expect(1 + 1).toBe(3); // This will fail
});

test("passing test", () => {
  expect(2 + 2).toBe(4);
});' > failing.test.js
```

**Expected Results**:
```json
{
  "tool": "run_tests",
  "success": true,
  "testResults": [
    {
      "framework": "jest",
      "language": "javascript",
      "success": false,
      "totalTests": 2,
      "passed": 1,
      "failed": 1,
      "skipped": 0,
      "duration": 1450
    }
  ],
  "summary": {
    "totalTests": 2,
    "passed": 1,
    "failed": 1,
    "skipped": 0,
    "duration": 1450
  },
  "recommendations": [
    "❌ 1 tests failing - fix failing tests before deployment",
    "✅ 1 tests passing - good test coverage",
    "🧪 Run tests regularly during development"
  ]
}
```

### Test 5: Test Coverage Analysis

**Objective**: Test the coverage analysis tool with different frameworks

#### Test 5a: JavaScript Jest Coverage
**Setup**: Add coverage configuration to Jest project

**Update package.json**:
```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "collectCoverage": true,
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"]
  }
}
```

**Create source file to test**:
```bash
echo 'function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

module.exports = { add, multiply, divide };' > math.js
```

**Update test file**:
```bash
echo 'const { add, multiply, divide } = require("./math");

test("add function", () => {
  expect(add(2, 3)).toBe(5);
  expect(add(-1, 1)).toBe(0);
});

test("multiply function", () => {
  expect(multiply(3, 4)).toBe(12);
  expect(multiply(0, 5)).toBe(0);
});

test("divide function", () => {
  expect(divide(10, 2)).toBe(5);
  expect(() => divide(5, 0)).toThrow("Division by zero");
});' > math.test.js
```

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "run_test_coverage", "arguments": {"workspace": "/path/to/test-js-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "run_test_coverage",
  "success": true,
  "workspace": "/path/to/test-js-project",
  "frameworks": [
    {
      "language": "javascript",
      "framework": "jest",
      "version": "^29.0.0"
    }
  ],
  "coverageResults": [
    {
      "framework": "jest",
      "language": "javascript",
      "success": true,
      "coverage": {
        "lines": 95.5,
        "branches": 100.0,
        "functions": 100.0,
        "statements": 95.5
      }
    }
  ],
  "summary": {
    "overallCoverage": 97.75,
    "lineCoverage": 95.5,
    "branchCoverage": 100.0,
    "functionCoverage": 100.0,
    "statementCoverage": 95.5
  },
  "recommendations": [
    "✅ Good code coverage (97.75%) - maintain this level",
    "📊 Regular coverage monitoring helps maintain code quality",
    "🎯 Focus on testing critical business logic first",
    "🔍 Use coverage reports to identify untested code paths"
  ]
}
```

#### Test 5b: Python pytest Coverage
**Setup**: Add coverage to Python project

**Install coverage tools**:
```bash
pip install pytest-cov
```

**Create source file**:
```bash
echo 'def calculator_add(a, b):
    """Add two numbers."""
    return a + b

def calculator_subtract(a, b):
    """Subtract two numbers."""
    return a - b

def calculator_divide(a, b):
    """Divide two numbers."""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

def calculator_multiply(a, b):
    """Multiply two numbers."""
    return a * b' > calculator.py
```

**Update test file**:
```bash
echo 'from calculator import calculator_add, calculator_subtract, calculator_divide, calculator_multiply
import pytest

def test_add():
    assert calculator_add(2, 3) == 5
    assert calculator_add(-1, 1) == 0

def test_subtract():
    assert calculator_subtract(5, 3) == 2
    assert calculator_subtract(0, 5) == -5

def test_multiply():
    assert calculator_multiply(3, 4) == 12
    assert calculator_multiply(0, 5) == 0

def test_divide():
    assert calculator_divide(10, 2) == 5
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        calculator_divide(5, 0)' > tests/test_calculator.py
```

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "run_test_coverage", "arguments": {"workspace": "/path/to/test-python-project"}}}' | node server.js
```

**Expected Results**:
```json
{
  "tool": "run_test_coverage",
  "success": true,
  "workspace": "/path/to/test-python-project",
  "frameworks": [
    {
      "language": "python",
      "framework": "pytest",
      "version": "7.4.0"
    }
  ],
  "coverageResults": [
    {
      "framework": "pytest",
      "language": "python",
      "success": true,
      "coverage": {
        "lines": 100.0,
        "branches": 0,
        "functions": 0,
        "statements": 100.0
      }
    }
  ],
  "summary": {
    "overallCoverage": 100.0,
    "lineCoverage": 100.0,
    "branchCoverage": 0,
    "functionCoverage": 0,
    "statementCoverage": 100.0
  },
  "recommendations": [
    "✅ Good code coverage (100.0%) - maintain this level",
    "📊 Regular coverage monitoring helps maintain code quality",
    "🎯 Focus on testing critical business logic first"
  ]
}
```

## 🔗 Cline Integration Testing

### Test 6: Cline MCP Integration

**Objective**: Verify test execution tools work through Cline chat interface

**Prerequisites**: 
- Cline extension installed and configured
- MCP server configuration added to Cline

**MCP Configuration for Cline**:
```json
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": ["/Users/[username]/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.6.0/server/server.js"]
    }
  }
}
```

#### Step 1: Test Framework Detection

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer detect_test_frameworks {"workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP"}
```

**Expected Cline Response**:
```
✅ MCP Tool Result: detect_test_frameworks

{
  "tool": "detect_test_frameworks",
  "success": true,
  "workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP",
  "frameworks": [
    {
      "language": "javascript",
      "framework": "jest",
      "version": "unknown",
      "configPath": "/Users/muhammadahmed/Documents/AnalyzerMCP/package.json"
    }
  ],
  "supportedFrameworks": ["javascript", "python", "java", "csharp"],
  "recommendations": [
    "✅ 1 test framework(s) detected",
    "javascript: jest",
    "🚀 Run tests regularly during development",
    "📊 Consider adding code coverage analysis"
  ]
}
```

**What this means**:
- ✅ **SUCCESS**: Tool executed without errors
- 🔍 **DETECTION**: Found Jest test framework in the project
- 📊 **ANALYSIS**: Detected JavaScript testing setup
- 💡 **RECOMMENDATIONS**: Specific suggestions for test improvement

#### Step 2: Test Execution

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer run_tests {"workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP"}
```

**Expected Cline Response**:
```
✅ MCP Tool Result: run_tests

{
  "tool": "run_tests",
  "success": true,
  "workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP",
  "frameworks": [
    {
      "language": "javascript",
      "framework": "jest",
      "version": "unknown",
      "configPath": "/Users/muhammadahmed/Documents/AnalyzerMCP/package.json"
    }
  ],
  "testResults": [
    {
      "framework": "jest",
      "language": "javascript",
      "success": false,
      "error": "No tests found",
      "totalTests": 0,
      "passed": 0,
      "failed": 0,
      "skipped": 0,
      "duration": 1200
    }
  ],
  "summary": {
    "totalTests": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "duration": 1200
  },
  "recommendations": [
    "🚨 No tests found - add test files to your project",
    "📦 Install a test framework (Jest for JavaScript, pytest for Python, JUnit for Java)",
    "🧪 Run tests regularly during development"
  ]
}
```

**What this means**:
- ✅ **FRAMEWORK DETECTED**: Jest framework found but no test files
- 📊 **ANALYSIS**: No tests to execute in current project
- 💡 **ACTIONABLE**: Clear recommendations to add test files
- 🔧 **GUIDANCE**: Specific framework suggestions for different languages

#### Step 3: Test Coverage Analysis

**What to type in Cline chat**:
```
/use_mcp_tool code-analyzer run_test_coverage {"workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP"}
```

**Expected Cline Response**:
```
✅ MCP Tool Result: run_test_coverage

{
  "tool": "run_test_coverage",
  "success": false,
  "error": "No test frameworks detected",
  "workspace": "/Users/muhammadahmed/Documents/AnalyzerMCP",
  "frameworks": [],
  "coverageResults": [],
  "summary": {},
  "recommendations": [
    "Install a test framework with coverage support"
  ]
}
```

**What this means**:
- ✅ **GRACEFUL HANDLING**: Tool handles missing tests appropriately
- 📊 **CLEAR FEEDBACK**: Explains why coverage can't be run
- 💡 **GUIDANCE**: Provides actionable next steps
- 🔧 **EDUCATIONAL**: Explains coverage requirements

#### Common Error Scenarios & Solutions

**❌ Error: "Unknown tool: detect_test_frameworks"**
```
Error executing MCP tool:
MCP error -32603: Unknown tool: detect_test_frameworks
```

**Solution**:
1. Check extension version: Should be `mcp-analyzer.mcp-code-analyzer-0.6.0`
2. Restart VS Code completely
3. Verify MCP server path in configuration
4. Test server manually: `cd ~/.vscode/extensions/mcp-analyzer.mcp-code-analyzer-0.6.0/server && echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node server.js`

**❌ Error: "No test frameworks detected"**
```
{
  "success": false,
  "error": "No test frameworks detected"
}
```

**Solution**: 
1. Install a test framework in your project
2. Add test files with appropriate naming conventions
3. Ensure package.json includes test dependencies
4. Check that test configuration files exist

**❌ Error: "Test execution failed"**
```
{
  "success": false,
  "error": "Command failed: npm test"
}
```

**Solution**: 
1. Verify test script exists in package.json
2. Check that all test dependencies are installed
3. Ensure test files have correct syntax
4. Run tests manually to debug issues

**✅ Success Indicators**:
- No "Unknown tool" errors for test execution tools
- JSON response with proper test analysis structure
- Tools execute within reasonable time (< 120 seconds for large test suites)
- Recommendations are relevant and actionable
- Framework detection works correctly for supported languages

## 🚨 Error Handling Testing

### Test 7: Invalid Workspace Path

**Test Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "detect_test_frameworks", "arguments": {"workspace": "/nonexistent/path"}}}' | node server.js
```

**Expected Results**: Graceful error handling with descriptive message

### Test 8: Project Without Tests

**Setup**: Test in directory with no test files or frameworks

**Expected Results**: Should report no frameworks detected, not crash

### Test 9: Corrupted Test Files

**Setup**: Test with malformed test files

**Expected Results**: Should handle parsing errors gracefully

### Test 10: Long-Running Tests

**Setup**: Test with very slow test suite

**Expected Results**: Should handle timeouts appropriately (2-minute default)

## 📊 Performance Benchmarks

**Expected Performance**:
- Framework detection: < 5 seconds
- Small test suite (< 10 tests): < 30 seconds
- Medium test suite (< 100 tests): < 120 seconds
- Large test suite (< 1000 tests): < 300 seconds

**Memory Usage**: < 500MB for typical test execution

**Timeout Limits**:
- Test execution: 2 minutes (120 seconds)
- Coverage analysis: 3 minutes (180 seconds)
- Framework detection: 10 seconds

## ✅ Success Criteria Checklist

### Core Functionality
- [ ] Extension activates successfully with version 0.6.0
- [ ] Server path displays correctly in output panel
- [ ] Status bar shows MCP Analyzer with correct tooltip
- [ ] All 19 tools are registered and discoverable

### Test Execution Tools
- [ ] `detect_test_frameworks` identifies available test frameworks correctly
- [ ] `run_tests` executes tests and returns proper results
- [ ] `run_test_coverage` analyzes coverage and returns detailed metrics
- [ ] Multi-language support functions properly (JavaScript, Python, Java, C#)
- [ ] Framework auto-detection works as expected

### Test Analysis Quality
- [ ] Jest framework detection and execution works correctly
- [ ] Mocha framework detection and execution works correctly
- [ ] pytest framework detection and execution works correctly
- [ ] unittest framework detection and execution works correctly
- [ ] Coverage analysis provides accurate metrics
- [ ] Test result parsing works for different output formats

### Integration
- [ ] Cline can discover and use all test execution tools
- [ ] MCP protocol compliance maintained
- [ ] Error handling is graceful and informative
- [ ] Performance is acceptable for typical test suites

### Edge Cases
- [ ] Handles missing test frameworks gracefully
- [ ] Works with projects having no tests
- [ ] Proper error messages for invalid inputs
- [ ] Timeout handling for long-running tests
- [ ] Multiple framework detection works correctly

## 🐛 Troubleshooting

### Common Issues

**Issue**: "detect_test_frameworks not found" in Cline
**Solution**: 
1. Restart VS Code completely
2. Verify extension version is 0.6.0
3. Check MCP server path in configuration

**Issue**: Test execution takes too long
**Solution**: 
1. Check test suite size (very large suites may take time)
2. Verify test framework is properly configured
3. Check for infinite loops or hanging tests

**Issue**: No test frameworks detected in project with tests
**Solution**:
1. Verify test framework is installed in dependencies
2. Check test file naming conventions
3. Ensure configuration files exist (package.json, pytest.ini, etc.)
4. Verify test files are in expected locations

**Issue**: Coverage analysis fails
**Solution**:
1. Install coverage tools (jest --coverage, pytest-cov, etc.)
2. Verify coverage configuration in test framework
3. Check that source files are in expected locations
4. Ensure coverage commands are available

### Debug Mode
Enable debug logging in VS Code settings:
```json
{
  "mcpCodeAnalyzer.debug": true
}
```

### Framework-Specific Troubleshooting

**Jest Issues**:
- Verify jest is in devDependencies
- Check package.json test script
- Ensure test files match patterns (*.test.js, *.spec.js)

**pytest Issues**:
- Verify pytest is installed (`pip list | grep pytest`)
- Check pytest.ini or pyproject.toml configuration
- Ensure test files match patterns (test_*.py, *_test.py)

**Coverage Issues**:
- Install coverage dependencies (nyc, pytest-cov, etc.)
- Verify coverage configuration
- Check coverage output directory permissions

## 🎯 Testing Completion

After completing all tests, you should have:
- ✅ Verified all 19 MCP tools are working
- ✅ Confirmed test framework detection capabilities
- ✅ Tested test execution with multiple frameworks
- ✅ Validated coverage analysis functionality
- ✅ Tested Cline integration with all test execution tools
- ✅ Validated error handling and edge cases
- ✅ Tested performance with various test suite sizes
- ✅ Documented any issues or limitations

**Milestone 3 Testing Status**: Ready for approval and production
