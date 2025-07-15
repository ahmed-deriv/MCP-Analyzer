#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const path = require('path');
const fs = require('fs');
const GitAnalyzer = require('./git-analyzer');

class CodeAnalyzerServer {
    constructor() {
        this.server = new Server(
            {
                name: 'mcp-code-analyzer',
                version: '0.2.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.gitAnalyzer = new GitAnalyzer();
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
            version: '0.2.0',
            capabilities: [
                'get_server_info',
                'hello_world_analyzer', 
                'run_full_analysis',
                'git_list_branches',
                'git_get_current_branch',
                'git_checkout_branch',
                'git_get_repository_info'
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
