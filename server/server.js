#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const path = require('path');
const fs = require('fs');

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
        console.error(`Node version: ${process.version}`);
        console.error(`Platform: ${process.platform}`);
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
            version: '0.1.0',
            capabilities: [
                'get_server_info',
                'hello_world_analyzer', 
                'run_full_analysis'
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
