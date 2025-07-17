const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DuplicateAnalyzer {
    constructor() {
        this.workspace = null;
        this.supportedExtensions = {
            javascript: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
            python: ['.py', '.pyx', '.pyi'],
            java: ['.java'],
            csharp: ['.cs'],
            cpp: ['.cpp', '.cc', '.cxx', '.c', '.h', '.hpp'],
            go: ['.go'],
            rust: ['.rs'],
            php: ['.php'],
            ruby: ['.rb'],
            swift: ['.swift'],
            kotlin: ['.kt', '.kts'],
            scala: ['.scala']
        };
        this.thresholds = {
            minLines: 5,              // Minimum lines for duplicate detection
            similarityThreshold: 0.8,  // Similarity threshold (0.0 to 1.0)
            minTokens: 10,            // Minimum tokens for comparison
            maxFileSize: 1024 * 1024  // Max file size to analyze (1MB)
        };
        this.duplicateBlocks = [];
        this.fileHashes = new Map();
        this.tokenizedFiles = new Map();
    }

    async initialize(workspace, options = {}) {
        this.workspace = workspace;
        
        if (!fs.existsSync(workspace)) {
            throw new Error(`Workspace directory does not exist: ${workspace}`);
        }

        // Override default thresholds if provided
        this.thresholds = { ...this.thresholds, ...options.thresholds };

        console.error(`Duplicate analyzer initialized for workspace: ${workspace}`);
        console.error(`Thresholds:`, JSON.stringify(this.thresholds, null, 2));
    }

    async findDuplicates() {
        try {
            console.error('Starting duplicate code detection...');
            
            const results = {
                success: true,
                workspace: this.workspace,
                summary: {
                    totalFiles: 0,
                    analyzedFiles: 0,
                    duplicateBlocks: 0,
                    duplicateLines: 0,
                    duplicatePercentage: 0,
                    affectedFiles: 0
                },
                duplicates: [],
                exactDuplicates: [],
                similarDuplicates: [],
                fileAnalysis: [],
                recommendations: []
            };

            // Get all supported files
            const allFiles = await this.getAllFiles(this.workspace);
            results.summary.totalFiles = allFiles.length;

            // Analyze each file
            for (const filePath of allFiles) {
                try {
                    const fileAnalysis = await this.analyzeFile(filePath);
                    if (fileAnalysis) {
                        results.fileAnalysis.push(fileAnalysis);
                        results.summary.analyzedFiles++;
                    }
                } catch (error) {
                    console.error(`Error analyzing file ${filePath}:`, error.message);
                }
            }

            // Find exact duplicates using hashes
            await this.findExactDuplicates(results);

            // Find similar duplicates using token comparison
            await this.findSimilarDuplicates(results);

            // Calculate summary statistics
            this.calculateSummaryStats(results);

            // Generate recommendations
            results.recommendations = this.generateRecommendations(results);

            console.error('Duplicate code detection completed');
            return results;

        } catch (error) {
            console.error('Duplicate code detection error:', error.message);
            return {
                success: false,
                error: error.message,
                workspace: this.workspace,
                summary: {},
                duplicates: [],
                exactDuplicates: [],
                similarDuplicates: [],
                fileAnalysis: [],
                recommendations: []
            };
        }
    }

    async getAllFiles(dir, files = []) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Skip common directories that shouldn't be analyzed
                if (!this.shouldSkipDirectory(item)) {
                    await this.getAllFiles(fullPath, files);
                }
            } else if (stat.isFile()) {
                // Only include supported files under size limit
                if (this.isSupportedFile(fullPath) && stat.size <= this.thresholds.maxFileSize) {
                    files.push(fullPath);
                }
            }
        }
        
        return files;
    }

    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'target',
            'bin', 'obj', '.vscode', '.idea', '__pycache__', '.pytest_cache',
            'coverage', '.nyc_output', 'vendor', 'bower_components'
        ];
        return skipDirs.includes(dirName) || dirName.startsWith('.');
    }

    isSupportedFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return Object.values(this.supportedExtensions).some(exts => exts.includes(ext));
    }

    getLanguageFromExtension(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        for (const [language, extensions] of Object.entries(this.supportedExtensions)) {
            if (extensions.includes(ext)) {
                return language;
            }
        }
        
        return 'unknown';
    }

    async analyzeFile(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            const relativePath = path.relative(this.workspace, filePath);
            const language = this.getLanguageFromExtension(filePath);
            
            // Skip files that are too small
            if (lines.length < this.thresholds.minLines) {
                return null;
            }

            const analysis = {
                path: filePath,
                relativePath: relativePath,
                language: language,
                lines: lines.length,
                sizeBytes: stats.size,
                contentHash: this.calculateContentHash(content),
                blocks: [],
                tokens: []
            };

            // Extract code blocks for duplicate detection
            analysis.blocks = this.extractCodeBlocks(content, language);
            
            // Tokenize content for similarity analysis
            analysis.tokens = this.tokenizeContent(content, language);

            // Store for comparison
            this.fileHashes.set(analysis.contentHash, analysis);
            this.tokenizedFiles.set(filePath, analysis);

            return analysis;

        } catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error.message);
            return null;
        }
    }

    calculateContentHash(content) {
        // Normalize content by removing whitespace and comments for better duplicate detection
        const normalized = this.normalizeContent(content);
        return crypto.createHash('md5').update(normalized).digest('hex');
    }

    normalizeContent(content) {
        // Remove comments, normalize whitespace, and standardize formatting
        return content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, '')         // Remove line comments
            .replace(/#.*$/gm, '')            // Remove Python/shell comments
            .replace(/\s+/g, ' ')             // Normalize whitespace
            .trim()
            .toLowerCase();
    }

    extractCodeBlocks(content, language) {
        const lines = content.split('\n');
        const blocks = [];
        
        // Extract blocks of consecutive non-empty lines
        let currentBlock = [];
        let startLine = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line && !this.isCommentLine(line, language)) {
                if (currentBlock.length === 0) {
                    startLine = i;
                }
                currentBlock.push(line);
            } else {
                if (currentBlock.length >= this.thresholds.minLines) {
                    blocks.push({
                        startLine: startLine + 1,
                        endLine: i,
                        lines: currentBlock.slice(),
                        content: currentBlock.join('\n'),
                        hash: crypto.createHash('md5').update(currentBlock.join('\n')).digest('hex')
                    });
                }
                currentBlock = [];
            }
        }
        
        // Handle last block
        if (currentBlock.length >= this.thresholds.minLines) {
            blocks.push({
                startLine: startLine + 1,
                endLine: lines.length,
                lines: currentBlock.slice(),
                content: currentBlock.join('\n'),
                hash: crypto.createHash('md5').update(currentBlock.join('\n')).digest('hex')
            });
        }
        
        return blocks;
    }

    isCommentLine(line, language) {
        const commentPatterns = {
            javascript: ['//', '/*', '*/', '/**'],
            python: ['#', '"""', "'''"],
            java: ['//', '/*', '*/'],
            csharp: ['//', '/*', '*/'],
            cpp: ['//', '/*', '*/'],
            go: ['//', '/*', '*/'],
            rust: ['//', '/*', '*/'],
            php: ['//', '#', '/*', '*/'],
            ruby: ['#'],
            swift: ['//', '/*', '*/'],
            kotlin: ['//', '/*', '*/'],
            scala: ['//', '/*', '*/']
        };
        
        const patterns = commentPatterns[language] || [];
        return patterns.some(pattern => line.startsWith(pattern));
    }

    tokenizeContent(content, language) {
        // Simple tokenization - split by common delimiters and keywords
        const tokens = content
            .replace(/[{}();,.\[\]]/g, ' ')  // Replace delimiters with spaces
            .split(/\s+/)                    // Split by whitespace
            .filter(token => token.length > 1) // Filter out single characters
            .map(token => token.toLowerCase()); // Normalize case
        
        return tokens.filter(token => token.length >= 2); // Minimum token length
    }

    async findExactDuplicates(results) {
        const hashGroups = new Map();
        
        // Group files by content hash
        for (const analysis of results.fileAnalysis) {
            if (!hashGroups.has(analysis.contentHash)) {
                hashGroups.set(analysis.contentHash, []);
            }
            hashGroups.get(analysis.contentHash).push(analysis);
        }
        
        // Find groups with multiple files (exact duplicates)
        for (const [hash, files] of hashGroups) {
            if (files.length > 1) {
                const duplicateGroup = {
                    type: 'exact',
                    hash: hash,
                    files: files.map(f => ({
                        path: f.relativePath,
                        lines: f.lines,
                        sizeBytes: f.sizeBytes,
                        language: f.language
                    })),
                    duplicateLines: files[0].lines,
                    similarity: 1.0
                };
                
                results.exactDuplicates.push(duplicateGroup);
                results.duplicates.push(duplicateGroup);
            }
        }
        
        // Find block-level exact duplicates
        const blockHashes = new Map();
        
        for (const analysis of results.fileAnalysis) {
            for (const block of analysis.blocks) {
                if (!blockHashes.has(block.hash)) {
                    blockHashes.set(block.hash, []);
                }
                blockHashes.get(block.hash).push({
                    file: analysis,
                    block: block
                });
            }
        }
        
        // Find duplicate blocks
        for (const [hash, blockInstances] of blockHashes) {
            if (blockInstances.length > 1) {
                const duplicateBlock = {
                    type: 'exact-block',
                    hash: hash,
                    instances: blockInstances.map(instance => ({
                        path: instance.file.relativePath,
                        startLine: instance.block.startLine,
                        endLine: instance.block.endLine,
                        lines: instance.block.lines.length,
                        language: instance.file.language
                    })),
                    duplicateLines: blockInstances[0].block.lines.length,
                    similarity: 1.0,
                    content: blockInstances[0].block.content
                };
                
                results.exactDuplicates.push(duplicateBlock);
                results.duplicates.push(duplicateBlock);
            }
        }
    }

    async findSimilarDuplicates(results) {
        const analyses = results.fileAnalysis;
        
        // Compare each pair of files for similarity
        for (let i = 0; i < analyses.length; i++) {
            for (let j = i + 1; j < analyses.length; j++) {
                const file1 = analyses[i];
                const file2 = analyses[j];
                
                // Skip if already exact duplicates
                if (file1.contentHash === file2.contentHash) {
                    continue;
                }
                
                const similarity = this.calculateSimilarity(file1.tokens, file2.tokens);
                
                if (similarity >= this.thresholds.similarityThreshold) {
                    const similarDuplicate = {
                        type: 'similar',
                        files: [
                            {
                                path: file1.relativePath,
                                lines: file1.lines,
                                language: file1.language
                            },
                            {
                                path: file2.relativePath,
                                lines: file2.lines,
                                language: file2.language
                            }
                        ],
                        similarity: similarity,
                        duplicateLines: Math.min(file1.lines, file2.lines)
                    };
                    
                    results.similarDuplicates.push(similarDuplicate);
                    results.duplicates.push(similarDuplicate);
                }
            }
        }
        
        // Find similar code blocks within different files
        await this.findSimilarBlocks(results);
    }

    async findSimilarBlocks(results) {
        const allBlocks = [];
        
        // Collect all blocks from all files
        for (const analysis of results.fileAnalysis) {
            for (const block of analysis.blocks) {
                allBlocks.push({
                    file: analysis,
                    block: block,
                    tokens: this.tokenizeContent(block.content, analysis.language)
                });
            }
        }
        
        // Compare blocks for similarity
        for (let i = 0; i < allBlocks.length; i++) {
            for (let j = i + 1; j < allBlocks.length; j++) {
                const block1 = allBlocks[i];
                const block2 = allBlocks[j];
                
                // Skip if same file or already exact duplicates
                if (block1.file.path === block2.file.path || 
                    block1.block.hash === block2.block.hash) {
                    continue;
                }
                
                const similarity = this.calculateSimilarity(block1.tokens, block2.tokens);
                
                if (similarity >= this.thresholds.similarityThreshold) {
                    const similarBlock = {
                        type: 'similar-block',
                        instances: [
                            {
                                path: block1.file.relativePath,
                                startLine: block1.block.startLine,
                                endLine: block1.block.endLine,
                                lines: block1.block.lines.length,
                                language: block1.file.language
                            },
                            {
                                path: block2.file.relativePath,
                                startLine: block2.block.startLine,
                                endLine: block2.block.endLine,
                                lines: block2.block.lines.length,
                                language: block2.file.language
                            }
                        ],
                        similarity: similarity,
                        duplicateLines: Math.min(block1.block.lines.length, block2.block.lines.length)
                    };
                    
                    results.similarDuplicates.push(similarBlock);
                    results.duplicates.push(similarBlock);
                }
            }
        }
    }

    calculateSimilarity(tokens1, tokens2) {
        if (tokens1.length === 0 && tokens2.length === 0) return 1.0;
        if (tokens1.length === 0 || tokens2.length === 0) return 0.0;
        
        // Use Jaccard similarity coefficient
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    calculateSummaryStats(results) {
        let totalDuplicateLines = 0;
        const affectedFiles = new Set();
        
        for (const duplicate of results.duplicates) {
            totalDuplicateLines += duplicate.duplicateLines;
            
            if (duplicate.files) {
                duplicate.files.forEach(file => affectedFiles.add(file.path));
            }
            if (duplicate.instances) {
                duplicate.instances.forEach(instance => affectedFiles.add(instance.path));
            }
        }
        
        const totalLines = results.fileAnalysis.reduce((sum, file) => sum + file.lines, 0);
        
        results.summary.duplicateBlocks = results.duplicates.length;
        results.summary.duplicateLines = totalDuplicateLines;
        results.summary.duplicatePercentage = totalLines > 0 ? 
            Math.round((totalDuplicateLines / totalLines) * 100 * 100) / 100 : 0;
        results.summary.affectedFiles = affectedFiles.size;
    }

    generateRecommendations(results) {
        const recommendations = [];
        
        // Exact duplicate recommendations
        if (results.exactDuplicates.length > 0) {
            const exactFiles = results.exactDuplicates.filter(d => d.type === 'exact').length;
            const exactBlocks = results.exactDuplicates.filter(d => d.type === 'exact-block').length;
            
            if (exactFiles > 0) {
                recommendations.push(`🚨 ${exactFiles} exact duplicate files found - consider removing or consolidating`);
            }
            if (exactBlocks > 0) {
                recommendations.push(`🔄 ${exactBlocks} exact duplicate code blocks found - extract into shared functions`);
            }
        }
        
        // Similar duplicate recommendations
        if (results.similarDuplicates.length > 0) {
            const similarFiles = results.similarDuplicates.filter(d => d.type === 'similar').length;
            const similarBlocks = results.similarDuplicates.filter(d => d.type === 'similar-block').length;
            
            if (similarFiles > 0) {
                recommendations.push(`⚠️ ${similarFiles} similar files found - review for potential consolidation`);
            }
            if (similarBlocks > 0) {
                recommendations.push(`🔧 ${similarBlocks} similar code blocks found - consider refactoring into shared utilities`);
            }
        }
        
        // Duplication percentage recommendations
        if (results.summary.duplicatePercentage > 20) {
            recommendations.push(`📊 High duplication rate (${results.summary.duplicatePercentage}%) - significant refactoring opportunity`);
        } else if (results.summary.duplicatePercentage > 10) {
            recommendations.push(`📈 Moderate duplication rate (${results.summary.duplicatePercentage}%) - consider refactoring`);
        } else if (results.summary.duplicatePercentage > 0) {
            recommendations.push(`✅ Low duplication rate (${results.summary.duplicatePercentage}%) - good code reuse practices`);
        } else {
            recommendations.push(`🎉 No significant code duplication detected - excellent code organization`);
        }
        
        // General recommendations
        if (results.duplicates.length > 0) {
            recommendations.push('🏗️ Consider extracting common code into shared modules or libraries');
            recommendations.push('📋 Implement code review processes to catch duplication early');
            recommendations.push('🔍 Use automated tools to monitor code duplication in CI/CD pipeline');
        }
        
        recommendations.push('📊 Regular duplicate code analysis helps maintain code quality');
        recommendations.push('🎯 Aim for DRY (Don\'t Repeat Yourself) principles in code design');
        
        return recommendations;
    }
}

module.exports = DuplicateAnalyzer;
