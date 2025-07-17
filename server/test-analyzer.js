const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestAnalyzer {
    constructor() {
        this.workspace = null;
        this.supportedFrameworks = {
            javascript: {
                jest: {
                    configFiles: ['jest.config.js', 'jest.config.json', 'jest.config.ts'],
                    packageJsonKey: 'jest',
                    testPatterns: ['**/*.test.js', '**/*.spec.js', '**/*.test.ts', '**/*.spec.ts'],
                    commands: {
                        test: 'npm test',
                        coverage: 'npm run test:coverage || npm test -- --coverage'
                    }
                },
                mocha: {
                    configFiles: ['.mocharc.json', '.mocharc.js', '.mocharc.yaml', 'mocha.opts'],
                    packageJsonKey: 'mocha',
                    testPatterns: ['test/**/*.js', 'test/**/*.ts', '**/*.test.js', '**/*.spec.js'],
                    commands: {
                        test: 'npm test',
                        coverage: 'nyc npm test'
                    }
                },
                vitest: {
                    configFiles: ['vitest.config.js', 'vitest.config.ts', 'vite.config.js', 'vite.config.ts'],
                    packageJsonKey: 'vitest',
                    testPatterns: ['**/*.test.js', '**/*.spec.js', '**/*.test.ts', '**/*.spec.ts'],
                    commands: {
                        test: 'npm test -- --run',
                        coverage: 'npm run test:coverage || npm test -- --coverage --run'
                    }
                }
            },
            python: {
                pytest: {
                    configFiles: ['pytest.ini', 'pyproject.toml', 'tox.ini', 'setup.cfg'],
                    testPatterns: ['test_*.py', '*_test.py', 'tests/**/*.py'],
                    commands: {
                        test: 'python -m pytest',
                        coverage: 'python -m pytest --cov=. --cov-report=json --cov-report=html'
                    }
                },
                unittest: {
                    configFiles: [],
                    testPatterns: ['test_*.py', '*_test.py', 'tests/**/*.py'],
                    commands: {
                        test: 'python -m unittest discover',
                        coverage: 'python -m coverage run -m unittest discover && python -m coverage report'
                    }
                }
            },
            java: {
                junit: {
                    configFiles: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
                    testPatterns: ['**/*Test.java', '**/*Tests.java', '**/Test*.java'],
                    commands: {
                        test: 'mvn test || gradle test',
                        coverage: 'mvn jacoco:report || gradle jacocoTestReport'
                    }
                }
            },
            csharp: {
                nunit: {
                    configFiles: ['*.csproj', '*.sln'],
                    testPatterns: ['**/*Test.cs', '**/*Tests.cs', '**/Test*.cs'],
                    commands: {
                        test: 'dotnet test',
                        coverage: 'dotnet test --collect:"XPlat Code Coverage"'
                    }
                }
            }
        };
        this.detectedFrameworks = [];
        this.testResults = null;
        this.coverageResults = null;
    }

    async initialize(workspace, options = {}) {
        this.workspace = workspace;
        
        if (!fs.existsSync(workspace)) {
            throw new Error(`Workspace directory does not exist: ${workspace}`);
        }

        console.error(`Test analyzer initialized for workspace: ${workspace}`);
        
        // Detect available test frameworks
        await this.detectTestFrameworks();
        
        console.error(`Detected test frameworks:`, this.detectedFrameworks);
    }

    async detectTestFrameworks() {
        this.detectedFrameworks = [];
        
        try {
            // Check for JavaScript/TypeScript frameworks
            await this.detectJavaScriptFrameworks();
            
            // Check for Python frameworks
            await this.detectPythonFrameworks();
            
            // Check for Java frameworks
            await this.detectJavaFrameworks();
            
            // Check for C# frameworks
            await this.detectCSharpFrameworks();
            
        } catch (error) {
            console.error('Error detecting test frameworks:', error.message);
        }
    }

    async detectJavaScriptFrameworks() {
        const packageJsonPath = path.join(this.workspace, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                // Check for Jest
                if (dependencies.jest || packageJson.jest || this.hasConfigFile('javascript', 'jest')) {
                    this.detectedFrameworks.push({
                        language: 'javascript',
                        framework: 'jest',
                        version: dependencies.jest || 'unknown',
                        configPath: this.findConfigFile('javascript', 'jest')
                    });
                }
                
                // Check for Mocha
                if (dependencies.mocha || packageJson.mocha || this.hasConfigFile('javascript', 'mocha')) {
                    this.detectedFrameworks.push({
                        language: 'javascript',
                        framework: 'mocha',
                        version: dependencies.mocha || 'unknown',
                        configPath: this.findConfigFile('javascript', 'mocha')
                    });
                }
                
                // Check for Vitest
                if (dependencies.vitest || packageJson.vitest || this.hasConfigFile('javascript', 'vitest')) {
                    this.detectedFrameworks.push({
                        language: 'javascript',
                        framework: 'vitest',
                        version: dependencies.vitest || 'unknown',
                        configPath: this.findConfigFile('javascript', 'vitest')
                    });
                }
                
            } catch (error) {
                console.error('Error reading package.json:', error.message);
            }
        }
    }

    async detectPythonFrameworks() {
        // Check for pytest
        if (this.hasConfigFile('python', 'pytest') || this.hasPythonTestFiles()) {
            try {
                // Try to get pytest version
                const version = execSync('python -m pytest --version', { 
                    encoding: 'utf8', 
                    timeout: 5000,
                    cwd: this.workspace 
                }).trim();
                
                this.detectedFrameworks.push({
                    language: 'python',
                    framework: 'pytest',
                    version: version.split(' ')[1] || 'unknown',
                    configPath: this.findConfigFile('python', 'pytest')
                });
            } catch (error) {
                // pytest not available, check for unittest
                if (this.hasPythonTestFiles()) {
                    this.detectedFrameworks.push({
                        language: 'python',
                        framework: 'unittest',
                        version: 'built-in',
                        configPath: null
                    });
                }
            }
        }
    }

    async detectJavaFrameworks() {
        // Check for Maven or Gradle projects with JUnit
        const pomPath = path.join(this.workspace, 'pom.xml');
        const gradlePath = path.join(this.workspace, 'build.gradle');
        const gradleKtsPath = path.join(this.workspace, 'build.gradle.kts');
        
        if (fs.existsSync(pomPath) || fs.existsSync(gradlePath) || fs.existsSync(gradleKtsPath)) {
            if (this.hasJavaTestFiles()) {
                this.detectedFrameworks.push({
                    language: 'java',
                    framework: 'junit',
                    version: 'unknown',
                    configPath: fs.existsSync(pomPath) ? pomPath : (fs.existsSync(gradlePath) ? gradlePath : gradleKtsPath)
                });
            }
        }
    }

    async detectCSharpFrameworks() {
        // Check for .NET projects
        const csprojFiles = this.findFiles('*.csproj');
        const slnFiles = this.findFiles('*.sln');
        
        if (csprojFiles.length > 0 || slnFiles.length > 0) {
            if (this.hasCSharpTestFiles()) {
                this.detectedFrameworks.push({
                    language: 'csharp',
                    framework: 'nunit',
                    version: 'unknown',
                    configPath: csprojFiles[0] || slnFiles[0]
                });
            }
        }
    }

    hasConfigFile(language, framework) {
        const config = this.supportedFrameworks[language][framework];
        return config.configFiles.some(file => fs.existsSync(path.join(this.workspace, file)));
    }

    findConfigFile(language, framework) {
        const config = this.supportedFrameworks[language][framework];
        const found = config.configFiles.find(file => fs.existsSync(path.join(this.workspace, file)));
        return found ? path.join(this.workspace, found) : null;
    }

    hasPythonTestFiles() {
        return this.findFiles('test_*.py').length > 0 || 
               this.findFiles('*_test.py').length > 0 || 
               fs.existsSync(path.join(this.workspace, 'tests'));
    }

    hasJavaTestFiles() {
        return this.findFiles('*Test.java').length > 0 || 
               this.findFiles('*Tests.java').length > 0 || 
               this.findFiles('Test*.java').length > 0;
    }

    hasCSharpTestFiles() {
        return this.findFiles('*Test.cs').length > 0 || 
               this.findFiles('*Tests.cs').length > 0 || 
               this.findFiles('Test*.cs').length > 0;
    }

    findFiles(pattern) {
        try {
            const files = execSync(`find "${this.workspace}" -name "${pattern}" -type f`, { 
                encoding: 'utf8',
                timeout: 10000 
            }).trim().split('\n').filter(f => f);
            return files;
        } catch (error) {
            return [];
        }
    }

    async runTests() {
        try {
            console.error('Starting test execution...');
            
            const results = {
                success: true,
                workspace: this.workspace,
                frameworks: this.detectedFrameworks,
                testResults: [],
                summary: {
                    totalTests: 0,
                    passed: 0,
                    failed: 0,
                    skipped: 0,
                    duration: 0,
                    coverage: null
                },
                recommendations: []
            };

            if (this.detectedFrameworks.length === 0) {
                return {
                    success: false,
                    error: 'No test frameworks detected',
                    workspace: this.workspace,
                    frameworks: [],
                    testResults: [],
                    summary: {},
                    recommendations: ['Install a test framework (Jest, Mocha, pytest, JUnit, etc.)', 'Add test files to your project']
                };
            }

            // Run tests for each detected framework
            for (const framework of this.detectedFrameworks) {
                try {
                    const frameworkResult = await this.runFrameworkTests(framework);
                    results.testResults.push(frameworkResult);
                    
                    // Update summary
                    results.summary.totalTests += frameworkResult.totalTests || 0;
                    results.summary.passed += frameworkResult.passed || 0;
                    results.summary.failed += frameworkResult.failed || 0;
                    results.summary.skipped += frameworkResult.skipped || 0;
                    results.summary.duration += frameworkResult.duration || 0;
                    
                } catch (error) {
                    console.error(`Error running tests for ${framework.framework}:`, error.message);
                    results.testResults.push({
                        framework: framework.framework,
                        language: framework.language,
                        success: false,
                        error: error.message,
                        totalTests: 0,
                        passed: 0,
                        failed: 0,
                        skipped: 0,
                        duration: 0
                    });
                }
            }

            // Generate recommendations
            results.recommendations = this.generateTestRecommendations(results);

            console.error('Test execution completed');
            return results;

        } catch (error) {
            console.error('Test execution error:', error.message);
            return {
                success: false,
                error: error.message,
                workspace: this.workspace,
                frameworks: this.detectedFrameworks,
                testResults: [],
                summary: {},
                recommendations: []
            };
        }
    }

    async runFrameworkTests(framework) {
        const config = this.supportedFrameworks[framework.language][framework.framework];
        const startTime = Date.now();
        
        try {
            console.error(`Running tests for ${framework.framework}...`);
            
            // Execute test command
            const output = execSync(config.commands.test, {
                cwd: this.workspace,
                encoding: 'utf8',
                timeout: 120000, // 2 minutes timeout
                stdio: 'pipe'
            });
            
            const duration = Date.now() - startTime;
            
            // Parse test results based on framework
            const parsed = this.parseTestOutput(framework.framework, output);
            
            return {
                framework: framework.framework,
                language: framework.language,
                success: true,
                output: output,
                totalTests: parsed.totalTests,
                passed: parsed.passed,
                failed: parsed.failed,
                skipped: parsed.skipped,
                duration: duration,
                testFiles: parsed.testFiles || []
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Even if command fails, try to parse partial results
            const parsed = this.parseTestOutput(framework.framework, error.stdout || error.message);
            
            return {
                framework: framework.framework,
                language: framework.language,
                success: false,
                error: error.message,
                output: error.stdout || '',
                totalTests: parsed.totalTests,
                passed: parsed.passed,
                failed: parsed.failed,
                skipped: parsed.skipped,
                duration: duration,
                testFiles: parsed.testFiles || []
            };
        }
    }

    parseTestOutput(framework, output) {
        const result = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            testFiles: []
        };

        try {
            switch (framework) {
                case 'jest':
                    return this.parseJestOutput(output);
                case 'mocha':
                    return this.parseMochaOutput(output);
                case 'vitest':
                    return this.parseVitestOutput(output);
                case 'pytest':
                    return this.parsePytestOutput(output);
                case 'unittest':
                    return this.parseUnittestOutput(output);
                case 'junit':
                    return this.parseJUnitOutput(output);
                case 'nunit':
                    return this.parseNUnitOutput(output);
                default:
                    return result;
            }
        } catch (error) {
            console.error(`Error parsing ${framework} output:`, error.message);
            return result;
        }
    }

    parseJestOutput(output) {
        const result = { totalTests: 0, passed: 0, failed: 0, skipped: 0, testFiles: [] };
        
        // Jest summary line: "Tests: 1 failed, 2 passed, 3 total"
        const summaryMatch = output.match(/Tests:\s*(?:(\d+)\s*failed,?\s*)?(?:(\d+)\s*passed,?\s*)?(?:(\d+)\s*skipped,?\s*)?(\d+)\s*total/);
        if (summaryMatch) {
            result.failed = parseInt(summaryMatch[1]) || 0;
            result.passed = parseInt(summaryMatch[2]) || 0;
            result.skipped = parseInt(summaryMatch[3]) || 0;
            result.totalTests = parseInt(summaryMatch[4]) || 0;
        }
        
        // Extract test files
        const fileMatches = output.match(/PASS|FAIL\s+(.+\.test\.(js|ts|jsx|tsx))/g);
        if (fileMatches) {
            result.testFiles = fileMatches.map(match => match.split(/\s+/).pop());
        }
        
        return result;
    }

    parseMochaOutput(output) {
        const result = { totalTests: 0, passed: 0, failed: 0, skipped: 0, testFiles: [] };
        
        // Mocha summary: "2 passing (15ms)" or "1 failing"
        const passingMatch = output.match(/(\d+)\s+passing/);
        const failingMatch = output.match(/(\d+)\s+failing/);
        const pendingMatch = output.match(/(\d+)\s+pending/);
        
        if (passingMatch) result.passed = parseInt(passingMatch[1]);
        if (failingMatch) result.failed = parseInt(failingMatch[1]);
        if (pendingMatch) result.skipped = parseInt(pendingMatch[1]);
        
        result.totalTests = result.passed + result.failed + result.skipped;
        
        return result;
    }

    parseVitestOutput(output) {
        const result = { totalTests: 0, passed: 0, failed: 0, skipped: 0, testFiles: [] };
        
        // Vitest output format: "Test Files  2 failed | 1 passed (3)"
        // and "Tests  5 failed | 74 passed (79)"
        const testFilesMatch = output.match(/Test Files\s+(?:(\d+)\s+failed\s*\|\s*)?(?:(\d+)\s+passed\s*)?\((\d+)\)/);
        const testsMatch = output.match(/Tests\s+(?:(\d+)\s+failed\s*\|\s*)?(?:(\d+)\s+passed\s*)?\((\d+)\)/);
        
        if (testsMatch) {
            result.failed = parseInt(testsMatch[1]) || 0;
            result.passed = parseInt(testsMatch[2]) || 0;
            result.totalTests = parseInt(testsMatch[3]) || 0;
            // Vitest doesn't show skipped in the same format, calculate from total
            result.skipped = result.totalTests - result.passed - result.failed;
        }
        
        // Extract test files from Vitest output
        // Look for patterns like "✓ src/components/loading/__tests__/LoadingSkeleton.test.tsx (28 tests)"
        const fileMatches = output.match(/[✓×]\s+([^\s]+\.test\.[jt]sx?)\s*\((\d+)\s+tests?\)/g);
        if (fileMatches) {
            result.testFiles = fileMatches.map(match => {
                const fileMatch = match.match(/[✓×]\s+([^\s]+\.test\.[jt]sx?)/);
                return fileMatch ? fileMatch[1] : '';
            }).filter(f => f);
        }
        
        return result;
    }

    parsePytestOutput(output) {
        const result = { totalTests: 0, passed: 0, failed: 0, skipped: 0, testFiles: [] };
        
        // pytest summary: "= 2 failed, 3 passed, 1 skipped in 0.12s ="
        const summaryMatch = output.match(/=+\s*(?:(\d+)\s*failed,?\s*)?(?:(\d+)\s*passed,?\s*)?(?:(\d+)\s*skipped,?\s*)?.*=+/);
        if (summaryMatch) {
            result.failed = parseInt(summaryMatch[1]) || 0;
            result.passed = parseInt(summaryMatch[2]) || 0;
            result.skipped = parseInt(summaryMatch[3]) || 0;
            result.totalTests = result.passed + result.failed + result.skipped;
        }
        
        return result;
    }

    parseUnittestOutput(output) {
        const result = { totalTests: 0, passed: 0, failed: 0, skipped: 0, testFiles: [] };
        
        // unittest output: "Ran 5 tests in 0.001s" and "OK" or "FAILED"
        const ranMatch = output.match(/Ran (\d+) tests/);
        if (ranMatch) {
            result.totalTests = parseInt(ranMatch[1]);
            
            if (output.includes('OK')) {
                result.passed = result.totalTests;
            } else {
                // Look for failure details
                const failureMatch = output.match(/FAILED \(failures=(\d+)(?:, errors=(\d+))?\)/);
                if (failureMatch) {
                    result.failed = parseInt(failureMatch[1]) + (parseInt(failureMatch[2]) || 0);
                    result.passed = result.totalTests - result.failed;
                }
            }
        }
        
        return result;
    }

    parseJUnitOutput(output) {
        const result = { totalTests: 0, passed: 0, failed: 0, skipped: 0, testFiles: [] };
        
        // Maven/Gradle test output varies, look for common patterns
        const testMatch = output.match(/Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)/);
        if (testMatch) {
            result.totalTests = parseInt(testMatch[1]);
            result.failed = parseInt(testMatch[2]) + parseInt(testMatch[3]); // Failures + Errors
            result.skipped = parseInt(testMatch[4]);
            result.passed = result.totalTests - result.failed - result.skipped;
        }
        
        return result;
    }

    parseNUnitOutput(output) {
        const result = { totalTests: 0, passed: 0, failed: 0, skipped: 0, testFiles: [] };
        
        // .NET test output
        const testMatch = output.match(/Total tests: (\d+)\. Passed: (\d+)\. Failed: (\d+)\. Skipped: (\d+)/);
        if (testMatch) {
            result.totalTests = parseInt(testMatch[1]);
            result.passed = parseInt(testMatch[2]);
            result.failed = parseInt(testMatch[3]);
            result.skipped = parseInt(testMatch[4]);
        }
        
        return result;
    }

    async runCoverage() {
        try {
            console.error('Starting coverage analysis...');
            
            const results = {
                success: true,
                workspace: this.workspace,
                frameworks: this.detectedFrameworks,
                coverageResults: [],
                summary: {
                    overallCoverage: 0,
                    lineCoverage: 0,
                    branchCoverage: 0,
                    functionCoverage: 0,
                    statementCoverage: 0
                },
                recommendations: []
            };

            if (this.detectedFrameworks.length === 0) {
                return {
                    success: false,
                    error: 'No test frameworks detected',
                    workspace: this.workspace,
                    frameworks: [],
                    coverageResults: [],
                    summary: {},
                    recommendations: ['Install a test framework with coverage support']
                };
            }

            // Run coverage for each detected framework
            for (const framework of this.detectedFrameworks) {
                try {
                    const coverageResult = await this.runFrameworkCoverage(framework);
                    results.coverageResults.push(coverageResult);
                    
                } catch (error) {
                    console.error(`Error running coverage for ${framework.framework}:`, error.message);
                    results.coverageResults.push({
                        framework: framework.framework,
                        language: framework.language,
                        success: false,
                        error: error.message,
                        coverage: {}
                    });
                }
            }

            // Calculate overall coverage
            this.calculateOverallCoverage(results);

            // Generate recommendations
            results.recommendations = this.generateCoverageRecommendations(results);

            console.error('Coverage analysis completed');
            return results;

        } catch (error) {
            console.error('Coverage analysis error:', error.message);
            return {
                success: false,
                error: error.message,
                workspace: this.workspace,
                frameworks: this.detectedFrameworks,
                coverageResults: [],
                summary: {},
                recommendations: []
            };
        }
    }

    async runFrameworkCoverage(framework) {
        const config = this.supportedFrameworks[framework.language][framework.framework];
        
        try {
            console.error(`Running coverage for ${framework.framework}...`);
            
            // Execute coverage command
            const output = execSync(config.commands.coverage, {
                cwd: this.workspace,
                encoding: 'utf8',
                timeout: 180000, // 3 minutes timeout
                stdio: 'pipe'
            });
            
            // Parse coverage results
            const coverage = this.parseCoverageOutput(framework.framework, output);
            
            return {
                framework: framework.framework,
                language: framework.language,
                success: true,
                output: output,
                coverage: coverage
            };
            
        } catch (error) {
            return {
                framework: framework.framework,
                language: framework.language,
                success: false,
                error: error.message,
                output: error.stdout || '',
                coverage: {}
            };
        }
    }

    parseCoverageOutput(framework, output) {
        const coverage = {
            lines: 0,
            branches: 0,
            functions: 0,
            statements: 0
        };

        try {
            switch (framework) {
                case 'jest':
                    return this.parseJestCoverage(output);
                case 'mocha':
                    return this.parseMochaCoverage(output);
                case 'pytest':
                    return this.parsePytestCoverage(output);
                default:
                    return coverage;
            }
        } catch (error) {
            console.error(`Error parsing ${framework} coverage:`, error.message);
            return coverage;
        }
    }

    parseJestCoverage(output) {
        const coverage = { lines: 0, branches: 0, functions: 0, statements: 0 };
        
        // Jest coverage table format
        const coverageMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
        if (coverageMatch) {
            coverage.statements = parseFloat(coverageMatch[1]);
            coverage.branches = parseFloat(coverageMatch[2]);
            coverage.functions = parseFloat(coverageMatch[3]);
            coverage.lines = parseFloat(coverageMatch[4]);
        }
        
        return coverage;
    }

    parseMochaCoverage(output) {
        const coverage = { lines: 0, branches: 0, functions: 0, statements: 0 };
        
        // nyc coverage output
        const linesMatch = output.match(/Lines\s*:\s*([\d.]+)%/);
        const branchesMatch = output.match(/Branches\s*:\s*([\d.]+)%/);
        const functionsMatch = output.match(/Functions\s*:\s*([\d.]+)%/);
        const statementsMatch = output.match(/Statements\s*:\s*([\d.]+)%/);
        
        if (linesMatch) coverage.lines = parseFloat(linesMatch[1]);
        if (branchesMatch) coverage.branches = parseFloat(branchesMatch[1]);
        if (functionsMatch) coverage.functions = parseFloat(functionsMatch[1]);
        if (statementsMatch) coverage.statements = parseFloat(statementsMatch[1]);
        
        return coverage;
    }

    parsePytestCoverage(output) {
        const coverage = { lines: 0, branches: 0, functions: 0, statements: 0 };
        
        // pytest-cov output: "TOTAL 100 0 100%"
        const totalMatch = output.match(/TOTAL\s+\d+\s+\d+\s+([\d.]+)%/);
        if (totalMatch) {
            coverage.lines = parseFloat(totalMatch[1]);
            coverage.statements = coverage.lines; // For Python, lines and statements are similar
        }
        
        return coverage;
    }

    calculateOverallCoverage(results) {
        if (results.coverageResults.length === 0) return;
        
        let totalLines = 0, totalBranches = 0, totalFunctions = 0, totalStatements = 0;
        let count = 0;
        
        for (const result of results.coverageResults) {
            if (result.success && result.coverage) {
                totalLines += result.coverage.lines || 0;
                totalBranches += result.coverage.branches || 0;
                totalFunctions += result.coverage.functions || 0;
                totalStatements += result.coverage.statements || 0;
                count++;
            }
        }
        
        if (count > 0) {
            results.summary.lineCoverage = Math.round(totalLines / count * 100) / 100;
            results.summary.branchCoverage = Math.round(totalBranches / count * 100) / 100;
            results.summary.functionCoverage = Math.round(totalFunctions / count * 100) / 100;
            results.summary.statementCoverage = Math.round(totalStatements / count * 100) / 100;
            results.summary.overallCoverage = Math.round((totalLines + totalBranches + totalFunctions + totalStatements) / (count * 4) * 100) / 100;
        }
    }

    generateTestRecommendations(results) {
        const recommendations = [];
        
        // Test execution recommendations
        if (results.summary.totalTests === 0) {
            recommendations.push('🚨 No tests found - add test files to your project');
        } else {
            if (results.summary.failed > 0) {
                recommendations.push(`❌ ${results.summary.failed} tests failing - fix failing tests before deployment`);
            }
            if (results.summary.passed > 0) {
                recommendations.push(`✅ ${results.summary.passed} tests passing - good test coverage`);
            }
            if (results.summary.skipped > 0) {
                recommendations.push(`⏭️ ${results.summary.skipped} tests skipped - review and enable skipped tests`);
            }
        }
        
        // Framework recommendations
        if (results.frameworks.length === 0) {
            recommendations.push('📦 Install a test framework (Jest for JavaScript, pytest for Python, JUnit for Java)');
        } else if (results.frameworks.length > 1) {
            recommendations.push('🔧 Multiple test frameworks detected - consider standardizing on one framework');
        }
        
        // Performance recommendations
        if (results.summary.duration > 60000) { // > 1 minute
            recommendations.push('⏱️ Tests taking longer than 1 minute - consider optimizing test performance');
        }
        
        // General recommendations
        recommendations.push('🧪 Run tests regularly during development');
        recommendations.push('🔄 Set up automated testing in CI/CD pipeline');
        recommendations.push('📊 Monitor test coverage and aim for >80% coverage');
        
        return recommendations;
    }

    generateCoverageRecommendations(results) {
        const recommendations = [];
        
        // Coverage recommendations
        if (results.summary.overallCoverage === 0) {
            recommendations.push('📊 No code coverage detected - enable coverage reporting');
        } else if (results.summary.overallCoverage < 50) {
            recommendations.push(`🚨 Low code coverage (${results.summary.overallCoverage}%) - add more tests`);
        } else if (results.summary.overallCoverage < 80) {
            recommendations.push(`⚠️ Moderate code coverage (${results.summary.overallCoverage}%) - aim for >80%`);
        } else {
            recommendations.push(`✅ Good code coverage (${results.summary.overallCoverage}%) - maintain this level`);
        }
        
        // Specific coverage type recommendations
        if (results.summary.branchCoverage < results.summary.lineCoverage - 10) {
            recommendations.push('🌿 Branch coverage lower than line coverage - add tests for conditional logic');
        }
        
        if (results.summary.functionCoverage < results.summary.lineCoverage - 10) {
            recommendations.push('🔧 Function coverage lower than line coverage - test all functions');
        }
        
        // General coverage recommendations
        recommendations.push('📊 Regular coverage monitoring helps maintain code quality');
        recommendations.push('🎯 Focus on testing critical business logic first');
        recommendations.push('🔍 Use coverage reports to identify untested code paths');
        
        return recommendations;
    }
}

module.exports = TestAnalyzer;
