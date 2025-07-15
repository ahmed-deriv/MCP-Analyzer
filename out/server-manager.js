"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerManager = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
class MCPServerManager {
    constructor(context) {
        this.serverProcess = null;
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('MCP Code Analyzer');
        // Get bundled server path
        this.serverPath = path.join(context.extensionPath, 'server', 'server.js');
        // Display server path on activation
        this.displayServerPath();
        // Ensure server is executable
        this.setupServer();
    }
    displayServerPath() {
        this.outputChannel.clear();
        this.outputChannel.appendLine('='.repeat(60));
        this.outputChannel.appendLine('MCP Code Analyzer - Server Information');
        this.outputChannel.appendLine('='.repeat(60));
        this.outputChannel.appendLine(`Server Path: ${this.serverPath}`);
        this.outputChannel.appendLine(`Server Status: ${fs.existsSync(this.serverPath) ? 'Available' : 'Not Found'}`);
        this.outputChannel.appendLine(`Extension Path: ${this.context.extensionPath}`);
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('MCP Configuration for Cline:');
        this.outputChannel.appendLine(JSON.stringify({
            "mcpServers": {
                "code-analyzer": {
                    "command": "node",
                    "args": [this.serverPath],
                    "env": {
                        "NODE_ENV": "production"
                    }
                }
            }
        }, null, 2));
        this.outputChannel.appendLine('='.repeat(60));
        this.outputChannel.show();
    }
    setupServer() {
        if (fs.existsSync(this.serverPath)) {
            // Make server executable on Unix systems
            if (process.platform !== 'win32') {
                try {
                    fs.chmodSync(this.serverPath, '755');
                }
                catch (error) {
                    console.error('Failed to make server executable:', error);
                }
            }
            this.outputChannel.appendLine(`✓ MCP Server ready at: ${this.serverPath}`);
        }
        else {
            this.outputChannel.appendLine(`✗ MCP Server not found at: ${this.serverPath}`);
            vscode.window.showErrorMessage('MCP Code Analyzer server not found. Please reinstall the extension.');
        }
    }
    getServerPath() {
        return this.serverPath;
    }
    showServerPath() {
        this.displayServerPath();
    }
    getServerConfig() {
        return {
            command: 'node',
            args: [this.serverPath],
            cwd: path.dirname(this.serverPath)
        };
    }
    startServer() {
        return new Promise((resolve, reject) => {
            if (this.serverProcess) {
                this.outputChannel.appendLine('Server is already running');
                resolve();
                return;
            }
            if (!fs.existsSync(this.serverPath)) {
                const error = 'Server file not found';
                this.outputChannel.appendLine(`✗ ${error}: ${this.serverPath}`);
                reject(new Error(error));
                return;
            }
            this.outputChannel.appendLine('Starting MCP server...');
            this.serverProcess = (0, child_process_1.spawn)('node', [this.serverPath], {
                cwd: path.dirname(this.serverPath),
                stdio: ['pipe', 'pipe', 'pipe']
            });
            this.serverProcess.stdout?.on('data', (data) => {
                this.outputChannel.appendLine(`[SERVER OUT] ${data.toString()}`);
            });
            this.serverProcess.stderr?.on('data', (data) => {
                this.outputChannel.appendLine(`[SERVER ERR] ${data.toString()}`);
            });
            this.serverProcess.on('error', (error) => {
                this.outputChannel.appendLine(`✗ Server error: ${error.message}`);
                this.serverProcess = null;
                reject(error);
            });
            this.serverProcess.on('exit', (code) => {
                this.outputChannel.appendLine(`Server exited with code: ${code}`);
                this.serverProcess = null;
            });
            // Give server time to start
            setTimeout(() => {
                if (this.serverProcess) {
                    this.outputChannel.appendLine('✓ MCP server started successfully');
                    resolve();
                }
                else {
                    reject(new Error('Server failed to start'));
                }
            }, 1000);
        });
    }
    stopServer() {
        if (this.serverProcess) {
            this.outputChannel.appendLine('Stopping MCP server...');
            this.serverProcess.kill();
            this.serverProcess = null;
        }
    }
    isServerRunning() {
        return this.serverProcess !== null;
    }
}
exports.MCPServerManager = MCPServerManager;
//# sourceMappingURL=server-manager.js.map