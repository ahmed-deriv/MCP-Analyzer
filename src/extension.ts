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

    const listBranchesCommand = vscode.commands.registerCommand('mcpAnalyzer.listBranches', () => {
        listGitBranches();
    });

    const getCurrentBranchCommand = vscode.commands.registerCommand('mcpAnalyzer.getCurrentBranch', () => {
        getCurrentGitBranch();
    });

    const selectBranchCommand = vscode.commands.registerCommand('mcpAnalyzer.selectBranch', () => {
        selectGitBranch();
    });

    const getRepositoryInfoCommand = vscode.commands.registerCommand('mcpAnalyzer.getRepositoryInfo', () => {
        getGitRepositoryInfo();
    });

    context.subscriptions.push(
        runAnalysisCommand, 
        showServerPathCommand, 
        testConnectionCommand,
        runHelloWorldCommand,
        listBranchesCommand,
        getCurrentBranchCommand,
        selectBranchCommand,
        getRepositoryInfoCommand
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

async function listGitBranches() {
    try {
        vscode.window.showInformationMessage('Listing git branches...');
        
        const result = await mcpClient.callTool('git_list_branches', {
            workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd()
        });
        
        vscode.window.showInformationMessage('Git branches listed successfully!');
        console.log('Git branches result:', result);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to list git branches: ${error}`);
        console.error('Git branches error:', error);
    }
}

async function getCurrentGitBranch() {
    try {
        vscode.window.showInformationMessage('Getting current git branch...');
        
        const result = await mcpClient.callTool('git_get_current_branch', {
            workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd()
        });
        
        vscode.window.showInformationMessage('Current git branch retrieved successfully!');
        console.log('Current git branch result:', result);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to get current git branch: ${error}`);
        console.error('Current git branch error:', error);
    }
}

async function selectGitBranch() {
    try {
        const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
        
        // First, get the list of branches
        const branchesResult = await mcpClient.callTool('git_list_branches', { workspace });
        
        // Parse the result to extract branch names
        const branchesData = JSON.parse(branchesResult.content[0].text);
        
        if (!branchesData.success) {
            vscode.window.showErrorMessage(`Failed to get branches: ${branchesData.error}`);
            return;
        }
        
        const branchNames: vscode.QuickPickItem[] = branchesData.data.all.map((branch: any) => ({
            label: branch.name,
            description: branch.current ? '(current)' : '',
            detail: branch.commit
        }));
        
        // Show quick pick for branch selection
        const selectedBranch = await vscode.window.showQuickPick(branchNames, {
            placeHolder: 'Select a branch to checkout',
            matchOnDescription: true,
            matchOnDetail: true
        });
        
        if (selectedBranch) {
            vscode.window.showInformationMessage(`Checking out branch: ${selectedBranch.label}...`);
            
            const result = await mcpClient.callTool('git_checkout_branch', {
                workspace: workspace,
                branch: selectedBranch.label
            });
            
            const checkoutData = JSON.parse(result.content[0].text);
            
            if (checkoutData.success) {
                vscode.window.showInformationMessage(`Successfully checked out branch: ${selectedBranch.label}`);
            } else {
                vscode.window.showErrorMessage(`Failed to checkout branch: ${checkoutData.error}`);
            }
            
            console.log('Git checkout result:', result);
        }
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to select git branch: ${error}`);
        console.error('Select git branch error:', error);
    }
}

async function getGitRepositoryInfo() {
    try {
        vscode.window.showInformationMessage('Getting git repository info...');
        
        const result = await mcpClient.callTool('git_get_repository_info', {
            workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd()
        });
        
        vscode.window.showInformationMessage('Git repository info retrieved successfully!');
        console.log('Git repository info result:', result);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to get git repository info: ${error}`);
        console.error('Git repository info error:', error);
    }
}

export function deactivate() {
    if (serverManager) {
        serverManager.stopServer();
    }
}
