const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

class GitAnalyzer {
    constructor() {
        this.git = null;
        this.workspacePath = null;
    }

    async initialize(workspacePath) {
        this.workspacePath = workspacePath;
        
        // Check if the workspace is a git repository
        if (!fs.existsSync(path.join(workspacePath, '.git'))) {
            throw new Error(`Not a git repository: ${workspacePath}`);
        }
        
        this.git = simpleGit(workspacePath);
        return true;
    }

    async listBranches() {
        if (!this.git) {
            throw new Error('Git analyzer not initialized');
        }

        try {
            const branchSummary = await this.git.branch(['-a']);
            
            const branches = {
                current: branchSummary.current,
                local: branchSummary.branches,
                all: Object.keys(branchSummary.branches).map(name => ({
                    name: name,
                    current: name === branchSummary.current,
                    commit: branchSummary.branches[name].commit,
                    label: branchSummary.branches[name].label
                }))
            };

            return {
                success: true,
                data: branches,
                workspace: this.workspacePath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                workspace: this.workspacePath
            };
        }
    }

    async getCurrentBranch() {
        if (!this.git) {
            throw new Error('Git analyzer not initialized');
        }

        try {
            const branchSummary = await this.git.branch();
            const status = await this.git.status();
            
            return {
                success: true,
                data: {
                    current: branchSummary.current,
                    ahead: status.ahead,
                    behind: status.behind,
                    tracking: status.tracking,
                    modified: status.modified.length,
                    staged: status.staged.length,
                    created: status.created.length,
                    deleted: status.deleted.length
                },
                workspace: this.workspacePath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                workspace: this.workspacePath
            };
        }
    }

    async checkoutBranch(branchName) {
        if (!this.git) {
            throw new Error('Git analyzer not initialized');
        }

        try {
            // Check if branch exists locally
            const branchSummary = await this.git.branch();
            const branchExists = Object.keys(branchSummary.branches).includes(branchName);
            
            if (branchExists) {
                // Switch to existing branch
                await this.git.checkout(branchName);
            } else {
                // Check if it's a remote branch
                const remoteBranches = await this.git.branch(['-r']);
                const remoteBranchName = `origin/${branchName}`;
                
                if (Object.keys(remoteBranches.branches).includes(remoteBranchName)) {
                    // Create and checkout new branch from remote
                    await this.git.checkoutBranch(branchName, remoteBranchName);
                } else {
                    throw new Error(`Branch '${branchName}' not found locally or remotely`);
                }
            }

            // Get updated branch info
            const newBranchInfo = await this.getCurrentBranch();
            
            return {
                success: true,
                data: {
                    previousBranch: branchSummary.current,
                    currentBranch: branchName,
                    branchInfo: newBranchInfo.data
                },
                workspace: this.workspacePath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                workspace: this.workspacePath
            };
        }
    }

    async getRepositoryInfo() {
        if (!this.git) {
            throw new Error('Git analyzer not initialized');
        }

        try {
            const remotes = await this.git.getRemotes(true);
            const status = await this.git.status();
            const log = await this.git.log({ maxCount: 5 });
            
            return {
                success: true,
                data: {
                    remotes: remotes,
                    status: {
                        current: status.current,
                        tracking: status.tracking,
                        ahead: status.ahead,
                        behind: status.behind,
                        staged: status.staged,
                        modified: status.modified,
                        created: status.created,
                        deleted: status.deleted,
                        files: status.files
                    },
                    recentCommits: log.all.map(commit => ({
                        hash: commit.hash,
                        date: commit.date,
                        message: commit.message,
                        author: commit.author_name
                    }))
                },
                workspace: this.workspacePath
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                workspace: this.workspacePath
            };
        }
    }
}

module.exports = GitAnalyzer;
