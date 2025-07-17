#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const path = require('path');
const fs = require('fs');
const GitAnalyzer = require('./git-analyzer');
const SecurityAnalyzer = require('./security-analyzer');
const MetricsAnalyzer = require('./metrics-analyzer');

class CodeAnalyzerServer {
    constructor() {
        this.server = new Server(
            {
                name: 'mcp-code-analyzer',
                version: '0.4.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.gitAnalyzer = new GitAnalyzer();
        this.securityAnalyzer = new SecurityAnalyzer();
        this.metricsAnalyzer = new MetricsAnalyzer();
        this.setupTools();
        this.setupToolHandlers();
        
        // Log server startup with path information
        console.error(`MCP Code Analyzer Server starting...`);
        console.error(`Server location: ${__filename}`);
        console.error(`Working directory: ${process.cwd()}`);
        console.error(`Node version: ${process.version}`);
        console.error(`Platform: ${process.platform}`);
    }

    setupTools() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'get_server_info',
                        description: 'Get information about the MCP server including version, capabilities, and status',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    },
                    {
                        name: 'hello_world_analyzer',
                        description: 'Basic workspace detection and system information analyzer',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the workspace directory'
                                }
                            },
                            required: []
                        }
                    },
                    {
                        name: 'run_full_analysis',
                        description: 'Run comprehensive code analysis on the workspace',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the workspace directory'
                                },
                                branch: {
                                    type: 'string',
                                    description: 'Git branch to analyze'
                                }
                            },
                            required: []
                        }
                    },
                    {
                        name: 'git_list_branches',
                        description: 'List all git branches in the repository',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the git repository'
                                }
                            },
                            required: ['workspace']
                        }
                    },
                    {
                        name: 'git_get_current_branch',
                        description: 'Get current git branch with status information',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the git repository'
                                }
                            },
                            required: ['workspace']
                        }
                    },
                    {
                        name: 'git_checkout_branch',
                        description: 'Checkout a specific git branch',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the git repository'
                                },
                                branch: {
                                    type: 'string',
                                    description: 'Name of the branch to checkout'
                                }
                            },
                            required: ['workspace', 'branch']
                        }
                    },
                    {
                        name: 'git_get_repository_info',
                        description: 'Get comprehensive git repository information including remotes, status, and recent commits',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the git repository'
                                }
                            },
                            required: ['workspace']
                        }
                    },
                    {
                        name: 'audit_dependencies',
                        description: 'Scan for vulnerable dependencies in package.json, requirements.txt, pom.xml, etc.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the project workspace'
                                }
                            },
                            required: ['workspace']
                        }
                    },
                    {
                        name: 'check_license_compliance',
                        description: 'Check for license compatibility issues and restrictive licenses',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the project workspace'
                                }
                            },
                            required: ['workspace']
                        }
                    },
                    {
                        name: 'run_security_scan',
                        description: 'Run comprehensive security analysis including dependency audit and license compliance',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the project workspace'
                                }
                            },
                            required: ['workspace']
                        }
                    },
                    {
                        name: 'analyze_code_metrics',
                        description: 'Analyze code metrics including lines of code, complexity, and file sizes across multiple languages',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the project workspace'
                                },
                                thresholds: {
                                    type: 'object',
                                    description: 'Custom thresholds for large files and complexity',
                                    properties: {
                                        largeFileLines: {
                                            type: 'number',
                                            description: 'Threshold for large files by line count (default: 500)'
                                        },
                                        largeFileSizeKB: {
                                            type: 'number',
                                            description: 'Threshold for large files by size in KB (default: 100)'
                                        },
                                        highComplexity: {
                                            type: 'number',
                                            description: 'Threshold for high complexity (default: 10)'
                                        }
                                    }
                                }
                            },
                            required: ['workspace']
                        }
                    },
                    {
                        name: 'identify_large_files',
                        description: 'Identify large files that may need refactoring based on configurable thresholds',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the project workspace'
                                },
                                thresholds: {
                                    type: 'object',
                                    description: 'Custom thresholds for large file detection',
                                    properties: {
                                        largeFileLines: {
                                            type: 'number',
                                            description: 'Threshold for large files by line count (default: 500)'
                                        },
                                        veryLargeFileLines: {
                                            type: 'number',
                                            description: 'Threshold for very large files by line count (default: 1000)'
                                        },
                                        largeFileSizeKB: {
                                            type: 'number',
                                            description: 'Threshold for large files by size in KB (default: 100)'
                                        }
                                    }
                                }
                            },
                            required: ['workspace']
                        }
                    },
                    {
                        name: 'calculate_complexity_metrics',
                        description: 'Calculate cyclomatic complexity and identify high-complexity files that need refactoring',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                workspace: {
                                    type: 'string',
                                    description: 'Path to the project workspace'
                                },
                                thresholds: {
                                    type: 'object',
                                    description: 'Custom complexity thresholds',
                                    properties: {
                                        highComplexity: {
                                            type: 'number',
                                            description: 'Threshold for high complexity (default: 10)'
                                        },
                                        veryHighComplexity: {
                                            type: 'number',
                                            description: 'Threshold for very high complexity (default: 20)'
                                        }
                                    }
                                }
                            },
                            required: ['workspace']
                        }
                    }
                ]
            };
        });
    }

    setupToolHandlers() {
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            console.error(`Tool called: ${name} with args:`, JSON.stringify(args, null, 2));

            switch (name) {
                case 'get_server_info':
                    return await this.getServerInfo();
                case 'hello_world_analyzer':
                    return await this.helloWorldAnalyzer(args);
                case 'run_full_analysis':
                    return await this.runFullAnalysis(args);
                case 'git_list_branches':
                    return await this.gitListBranches(args);
                case 'git_get_current_branch':
                    return await this.gitGetCurrentBranch(args);
                case 'git_checkout_branch':
                    return await this.gitCheckoutBranch(args);
                case 'git_get_repository_info':
                    return await this.gitGetRepositoryInfo(args);
                case 'audit_dependencies':
                    return await this.auditDependencies(args);
                case 'check_license_compliance':
                    return await this.checkLicenseCompliance(args);
                case 'run_security_scan':
                    return await this.runSecurityScan(args);
                case 'analyze_code_metrics':
                    return await this.analyzeCodeMetrics(args);
                case 'identify_large_files':
                    return await this.identifyLargeFiles(args);
                case 'calculate_complexity_metrics':
                    return await this.calculateComplexityMetrics(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }

    async getServerInfo() {
        const serverInfo = {
            serverPath: __filename,
            workingDirectory: process.cwd(),
            nodeVersion: process.version,
            platform: process.platform,
            timestamp: new Date().toISOString(),
            status: 'running',
            version: '0.4.0',
            capabilities: [
                'get_server_info',
                'hello_world_analyzer', 
                'run_full_analysis',
                'git_list_branches',
                'git_get_current_branch',
                'git_checkout_branch',
                'git_get_repository_info',
                'audit_dependencies',
                'check_license_compliance',
                'run_security_scan',
                'analyze_code_metrics',
                'identify_large_files',
                'calculate_complexity_metrics'
            ]
        };

        console.error('Server info requested:', JSON.stringify(serverInfo, null, 2));

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(serverInfo, null, 2)
                }
            ]
        };
    }

    async helloWorldAnalyzer(args) {
        const workspace = args.workspace || process.cwd();
        
        console.error('Hello World analyzer running for workspace:', workspace);
        
        // Basic workspace detection
        let workspaceInfo = {
            path: workspace,
            exists: false,
            isDirectory: false,
            files: []
        };

        try {
            if (fs.existsSync(workspace)) {
                workspaceInfo.exists = true;
                const stats = fs.statSync(workspace);
                workspaceInfo.isDirectory = stats.isDirectory();
                
                if (workspaceInfo.isDirectory) {
                    workspaceInfo.files = fs.readdirSync(workspace).slice(0, 10); // First 10 files
                }
            }
        } catch (error) {
            console.error('Error analyzing workspace:', error.message);
        }

        const result = {
            tool: 'hello_world_analyzer',
            message: 'Hello World from MCP Code Analyzer!',
            serverPath: __filename,
            timestamp: new Date().toISOString(),
            workspace: workspaceInfo,
            systemInfo: {
                platform: process.platform,
                nodeVersion: process.version,
                workingDirectory: process.cwd()
            }
        };

        console.error('Hello World result:', JSON.stringify(result, null, 2));
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }

    async runFullAnalysis(args) {
        const workspace = args.workspace || process.cwd();
        const branch = args.branch || 'main';
        
        console.error('Running full analysis for workspace:', workspace, 'branch:', branch);
        
        // Simulate analysis process
        const analysisResult = {
            tool: 'run_full_analysis',
            workspace: workspace,
            branch: branch,
            status: 'completed',
            serverPath: __filename,
            timestamp: new Date().toISOString(),
            results: {
                summary: 'Milestone 1: Basic analysis framework completed',
                workspace: {
                    path: workspace,
                    exists: fs.existsSync(workspace),
                    isDirectory: fs.existsSync(workspace) ? fs.statSync(workspace).isDirectory() : false
                },
                analyzers: {
                    git: { status: 'simulated', message: 'Git operations will be implemented in Milestone 2' },
                    tests: { status: 'pending', message: 'Test execution will be implemented in Milestone 3' },
                    security: { status: 'pending', message: 'Security analysis will be implemented in Milestone 4' },
                    metrics: { status: 'pending', message: 'Code metrics will be implemented in Milestone 5' }
                },
                recommendations: [
                    'Milestone 1 completed: Extension activation and server bundling working',
                    'Next: Implement git operations in Milestone 2',
                    'Server path is properly displayed in VS Code output panel',
                    'MCP configuration is available for Cline integration'
                ]
            }
        };

        console.error('Full analysis result:', JSON.stringify(analysisResult, null, 2));
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(analysisResult, null, 2)
                }
            ]
        };
    }

    async gitListBranches(args) {
        const workspace = args.workspace || process.cwd();
        
        try {
            await this.gitAnalyzer.initialize(workspace);
            const result = await this.gitAnalyzer.listBranches();
            
            console.error('Git list branches result:', JSON.stringify(result, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'git_list_branches',
                            ...result,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('Git list branches error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'git_list_branches',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async gitGetCurrentBranch(args) {
        const workspace = args.workspace || process.cwd();
        
        try {
            await this.gitAnalyzer.initialize(workspace);
            const result = await this.gitAnalyzer.getCurrentBranch();
            
            console.error('Git get current branch result:', JSON.stringify(result, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'git_get_current_branch',
                            ...result,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('Git get current branch error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'git_get_current_branch',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async gitCheckoutBranch(args) {
        const workspace = args.workspace || process.cwd();
        const branchName = args.branch;
        
        if (!branchName) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'git_checkout_branch',
                            success: false,
                            error: 'Branch name is required',
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
        
        try {
            await this.gitAnalyzer.initialize(workspace);
            const result = await this.gitAnalyzer.checkoutBranch(branchName);
            
            console.error('Git checkout branch result:', JSON.stringify(result, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'git_checkout_branch',
                            ...result,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('Git checkout branch error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'git_checkout_branch',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            branch: branchName,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async gitGetRepositoryInfo(args) {
        const workspace = args.workspace || process.cwd();
        
        try {
            await this.gitAnalyzer.initialize(workspace);
            const result = await this.gitAnalyzer.getRepositoryInfo();
            
            console.error('Git get repository info result:', JSON.stringify(result, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'git_get_repository_info',
                            ...result,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('Git get repository info error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'git_get_repository_info',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async auditDependencies(args) {
        const workspace = args.workspace || process.cwd();
        
        try {
            await this.securityAnalyzer.initialize(workspace);
            const result = await this.securityAnalyzer.auditDependencies();
            
            console.error('Dependency audit result:', JSON.stringify(result, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'audit_dependencies',
                            ...result,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('Dependency audit error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'audit_dependencies',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async checkLicenseCompliance(args) {
        const workspace = args.workspace || process.cwd();
        
        try {
            await this.securityAnalyzer.initialize(workspace);
            const result = await this.securityAnalyzer.checkLicenseCompliance();
            
            console.error('License compliance result:', JSON.stringify(result, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'check_license_compliance',
                            ...result,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('License compliance error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'check_license_compliance',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async runSecurityScan(args) {
        const workspace = args.workspace || process.cwd();
        
        try {
            await this.securityAnalyzer.initialize(workspace);
            
            console.error('Running comprehensive security scan...');
            
            // Run both dependency audit and license compliance check
            const [auditResult, licenseResult] = await Promise.all([
                this.securityAnalyzer.auditDependencies(),
                this.securityAnalyzer.checkLicenseCompliance()
            ]);
            
            const result = {
                success: true,
                workspace: workspace,
                security: {
                    dependencies: auditResult,
                    licenses: licenseResult
                },
                summary: {
                    vulnerabilities: auditResult.summary || { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
                    licenses: licenseResult.summary || { total: 0, restrictive: 0, permissive: 0, unknown: 0 },
                    packageManagers: auditResult.packageManagers || []
                },
                recommendations: this.generateSecurityRecommendations(auditResult, licenseResult)
            };
            
            console.error('Security scan result:', JSON.stringify(result, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'run_security_scan',
                            ...result,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('Security scan error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'run_security_scan',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    generateSecurityRecommendations(auditResult, licenseResult) {
        const recommendations = [];
        
        // Vulnerability recommendations
        if (auditResult.success && auditResult.summary) {
            const { critical, high, moderate, low, total } = auditResult.summary;
            
            if (total === 0) {
                recommendations.push('✅ No known vulnerabilities found in dependencies');
            } else {
                if (critical > 0) {
                    recommendations.push(`🚨 CRITICAL: ${critical} critical vulnerabilities found - immediate action required`);
                }
                if (high > 0) {
                    recommendations.push(`⚠️ HIGH: ${high} high-severity vulnerabilities found - update dependencies soon`);
                }
                if (moderate > 0) {
                    recommendations.push(`⚡ MODERATE: ${moderate} moderate vulnerabilities found - consider updating`);
                }
                if (low > 0) {
                    recommendations.push(`ℹ️ LOW: ${low} low-severity vulnerabilities found - monitor for updates`);
                }
                
                recommendations.push('Run `npm audit fix` or equivalent to automatically fix vulnerabilities');
            }
        }
        
        // License recommendations
        if (licenseResult.success && licenseResult.summary) {
            const { restrictive, permissive, unknown, total } = licenseResult.summary;
            
            if (total === 0) {
                recommendations.push('ℹ️ No license information available - install license checking tools');
            } else {
                if (restrictive > 0) {
                    recommendations.push(`⚖️ WARNING: ${restrictive} packages with restrictive licenses found - review legal implications`);
                }
                if (unknown > 0) {
                    recommendations.push(`❓ ${unknown} packages with unknown licenses - investigate license compatibility`);
                }
                if (permissive > 0) {
                    recommendations.push(`✅ ${permissive} packages with permissive licenses (MIT, BSD, Apache, etc.)`);
                }
            }
        }
        
        // General security recommendations
        recommendations.push('🔒 Regularly update dependencies to latest secure versions');
        recommendations.push('📋 Consider implementing automated security scanning in CI/CD pipeline');
        recommendations.push('🛡️ Review and establish security policies for dependency management');
        
        return recommendations;
    }

    async analyzeCodeMetrics(args) {
        const workspace = args.workspace || process.cwd();
        const thresholds = args.thresholds || {};
        
        try {
            await this.metricsAnalyzer.initialize(workspace, { thresholds });
            const result = await this.metricsAnalyzer.analyzeCodeMetrics();
            
            console.error('Code metrics analysis result:', JSON.stringify(result, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'analyze_code_metrics',
                            ...result,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('Code metrics analysis error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'analyze_code_metrics',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async identifyLargeFiles(args) {
        const workspace = args.workspace || process.cwd();
        const thresholds = args.thresholds || {};
        
        try {
            await this.metricsAnalyzer.initialize(workspace, { thresholds });
            const result = await this.metricsAnalyzer.analyzeCodeMetrics();
            
            // Extract only large files information
            const largeFilesResult = {
                success: result.success,
                workspace: result.workspace,
                largeFiles: result.largeFiles || [],
                summary: {
                    totalFiles: result.summary?.totalFiles || 0,
                    largeFiles: result.summary?.largeFiles || 0,
                    veryLargeFiles: result.summary?.veryLargeFiles || 0
                },
                thresholds: this.metricsAnalyzer.thresholds,
                recommendations: result.recommendations?.filter(rec => 
                    rec.includes('large files') || rec.includes('refactoring')
                ) || []
            };
            
            console.error('Large files identification result:', JSON.stringify(largeFilesResult, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'identify_large_files',
                            ...largeFilesResult,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('Large files identification error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'identify_large_files',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async calculateComplexityMetrics(args) {
        const workspace = args.workspace || process.cwd();
        const thresholds = args.thresholds || {};
        
        try {
            await this.metricsAnalyzer.initialize(workspace, { thresholds });
            const result = await this.metricsAnalyzer.analyzeCodeMetrics();
            
            // Extract only complexity information
            const complexityResult = {
                success: result.success,
                workspace: result.workspace,
                complexity: result.complexity || {
                    averageComplexity: 0,
                    highComplexityFiles: [],
                    totalFunctions: 0
                },
                languages: result.languages || {},
                thresholds: this.metricsAnalyzer.thresholds,
                recommendations: result.recommendations?.filter(rec => 
                    rec.includes('complexity') || rec.includes('refactoring')
                ) || []
            };
            
            console.error('Complexity metrics result:', JSON.stringify(complexityResult, null, 2));
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'calculate_complexity_metrics',
                            ...complexityResult,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            console.error('Complexity metrics calculation error:', error.message);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            tool: 'calculate_complexity_metrics',
                            success: false,
                            error: error.message,
                            workspace: workspace,
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('MCP Code Analyzer Server running on stdio');
        console.error(`Ready to accept connections at: ${__filename}`);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.error('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

const server = new CodeAnalyzerServer();
server.run().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
