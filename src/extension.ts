import * as vscode from 'vscode';
import { MCPServerManager } from './server-manager';
import { MCPClient } from './mcp-client';

let serverManager: MCPServerManager;
let mcpClient: MCPClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP Code Analyzer extension is now active');

    // Initialize server manager (automatically displays server path)
    serverManager = new MCPServerManager(context);
    mcpClient = new MCPClient(serverManager);

    // Register commands
    const runAnalysisCommand = vscode.commands.registerCommand('mcpAnalyzer.runFullAnalysis', () => {
        runFullAnalysis();
    });

    const showServerPathCommand = vscode.commands.registerCommand('mcpAnalyzer.showServerPath', () => {
        serverManager.showServerPath();
    });

    const testConnectionCommand = vscode.commands.registerCommand('mcpAnalyzer.testConnection', () => {
        testMCPConnection();
    });

    const runHelloWorldCommand = vscode.commands.registerCommand('mcpAnalyzer.runHelloWorld', () => {
        runHelloWorldAnalyzer();
    });

    context.subscriptions.push(
        runAnalysisCommand, 
        showServerPathCommand, 
        testConnectionCommand,
        runHelloWorldCommand
    );

    // Show server path in status bar
    const config = vscode.workspace.getConfiguration('mcpCodeAnalyzer');
    if (config.get('ui.showInStatusBar', true)) {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = "$(server) MCP Analyzer";
        statusBarItem.tooltip = `MCP Server: ${serverManager.getServerPath()}`;
        statusBarItem.command = 'mcpAnalyzer.showServerPath';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
    }

    // Auto-start server if configured
    if (config.get('server.autoStart', true)) {
        serverManager.startServer();
    }
}

async function runFullAnalysis() {
    try {
        vscode.window.showInformationMessage('Starting full code analysis...');
        
        const result = await mcpClient.callTool('run_full_analysis', {
            workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd()
        });
        
        vscode.window.showInformationMessage('Analysis completed successfully!');
        console.log('Analysis result:', result);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Analysis failed: ${error}`);
        console.error('Analysis error:', error);
    }
}

async function testMCPConnection() {
    try {
        vscode.window.showInformationMessage('Testing MCP server connection...');
        
        const result = await mcpClient.callTool('get_server_info', {});
        
        vscode.window.showInformationMessage('MCP server connection successful!');
        console.log('Server info:', result);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Connection test failed: ${error}`);
        console.error('Connection error:', error);
    }
}

async function runHelloWorldAnalyzer() {
    try {
        vscode.window.showInformationMessage('Running Hello World analyzer...');
        
        const result = await mcpClient.callTool('hello_world_analyzer', {
            workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd()
        });
        
        vscode.window.showInformationMessage('Hello World analyzer completed!');
        console.log('Hello World result:', result);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Hello World analyzer failed: ${error}`);
        console.error('Hello World error:', error);
    }
}

export function deactivate() {
    if (serverManager) {
        serverManager.stopServer();
    }
}
