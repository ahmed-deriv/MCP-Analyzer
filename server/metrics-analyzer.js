const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MetricsAnalyzer {
    constructor() {
        this.workspace = null;
        this.supportedExtensions = {
            javascript: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue'],
            typescript: ['.ts', '.tsx', '.d.ts'],
            python: ['.py', '.pyx', '.pyi', '.pyc', '.pyo', '.pyw'],
            java: ['.java', '.class', '.jar'],
            csharp: ['.cs', '.vb', '.fs', '.dll'],
            cpp: ['.cpp', '.cc', '.cxx', '.c', '.h', '.hpp', '.hxx', '.c++', '.h++'],
            go: ['.go', '.mod', '.sum'],
            rust: ['.rs', '.toml'],
            php: ['.php', '.phtml', '.php3', '.php4', '.php5', '.phps'],
            ruby: ['.rb', '.rbw', '.rake', '.gemspec'],
            swift: ['.swift'],
            kotlin: ['.kt', '.kts'],
            scala: ['.scala', '.sc'],
            html: ['.html', '.htm', '.xhtml', '.shtml'],
            css: ['.css', '.scss', '.sass', '.less', '.styl', '.stylus'],
            json: ['.json', '.jsonc', '.json5'],
            yaml: ['.yml', '.yaml'],
            xml: ['.xml', '.xsd', '.xsl', '.xslt', '.svg'],
            markdown: ['.md', '.markdown', '.mdown', '.mkd', '.mdx'],
            shell: ['.sh', '.bash', '.zsh', '.fish', '.bat', '.cmd', '.ps1'],
            sql: ['.sql', '.mysql', '.pgsql', '.sqlite'],
            r: ['.r', '.R', '.rmd', '.Rmd'],
            matlab: ['.m', '.mat'],
            perl: ['.pl', '.pm', '.perl'],
            lua: ['.lua'],
            dart: ['.dart'],
            elixir: ['.ex', '.exs'],
            erlang: ['.erl', '.hrl'],
            haskell: ['.hs', '.lhs'],
            clojure: ['.clj', '.cljs', '.cljc'],
            fsharp: ['.fs', '.fsi', '.fsx'],
            ocaml: ['.ml', '.mli'],
            nim: ['.nim', '.nims'],
            crystal: ['.cr'],
            zig: ['.zig'],
            assembly: ['.asm', '.s'],
            makefile: ['Makefile', 'makefile', '.mk'],
            dockerfile: ['Dockerfile', '.dockerfile'],
            config: ['.conf', '.config', '.ini', '.cfg', '.properties', '.env'],
            text: ['.txt', '.log', '.readme'],
            other: [] // Will catch any unmatched files
        };
        this.thresholds = {
            largeFileLines: 500,
            veryLargeFileLines: 1000,
            largeFileSizeKB: 100,
            veryLargeFileSizeKB: 500,
            highComplexity: 10,
            veryHighComplexity: 20
        };
    }

    async initialize(workspace, options = {}) {
        this.workspace = workspace;
        
        if (!fs.existsSync(workspace)) {
            throw new Error(`Workspace directory does not exist: ${workspace}`);
        }

        // Override default thresholds if provided
        this.thresholds = { ...this.thresholds, ...options.thresholds };

        console.error(`Metrics analyzer initialized for workspace: ${workspace}`);
        console.error(`Thresholds:`, JSON.stringify(this.thresholds, null, 2));
    }

    async analyzeCodeMetrics() {
        try {
            console.error('Starting comprehensive code metrics analysis...');
            
            const results = {
                success: true,
                workspace: this.workspace,
                summary: {
                    totalFiles: 0,
                    totalLines: 0,
                    totalCodeLines: 0,
                    totalCommentLines: 0,
                    totalBlankLines: 0,
                    totalSizeBytes: 0,
                    largeFiles: 0,
                    veryLargeFiles: 0
                },
                languages: {},
                largeFiles: [],
                fileMetrics: [],
                complexity: {
                    averageComplexity: 0,
                    highComplexityFiles: [],
                    totalFunctions: 0
                },
                recommendations: []
            };

            // Get all files in workspace
            const allFiles = await this.getAllFiles(this.workspace);
            
            // Analyze each file
            for (const filePath of allFiles) {
                try {
                    const fileMetrics = await this.analyzeFile(filePath);
                    if (fileMetrics) {
                        results.fileMetrics.push(fileMetrics);
                        this.updateSummary(results.summary, fileMetrics);
                        this.updateLanguageStats(results.languages, fileMetrics);
                        
                        // Check for large files
                        if (fileMetrics.lines > this.thresholds.largeFileLines || 
                            fileMetrics.sizeKB > this.thresholds.largeFileSizeKB) {
                            results.largeFiles.push({
                                path: fileMetrics.relativePath,
                                lines: fileMetrics.lines,
                                sizeKB: fileMetrics.sizeKB,
                                language: fileMetrics.language,
                                reason: this.getLargeFileReason(fileMetrics)
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error analyzing file ${filePath}:`, error.message);
                }
            }

            // Calculate complexity metrics
            await this.calculateComplexityMetrics(results);

            // Generate recommendations
            results.recommendations = this.generateRecommendations(results);

            console.error('Code metrics analysis completed');
            return results;

        } catch (error) {
            console.error('Code metrics analysis error:', error.message);
            return {
                success: false,
                error: error.message,
                workspace: this.workspace,
                summary: {},
                languages: {},
                largeFiles: [],
                fileMetrics: [],
                complexity: {},
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
                // Only include files with supported extensions
                if (this.isSupportedFile(fullPath)) {
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
        const fileName = path.basename(filePath);
        
        // Check if it matches any supported extension
        const hasMatchingExtension = Object.values(this.supportedExtensions).some(exts => exts.includes(ext));
        
        // Check for special files without extensions (like Dockerfile, Makefile)
        const isSpecialFile = Object.values(this.supportedExtensions).some(exts => 
            exts.some(pattern => fileName === pattern || fileName.toLowerCase() === pattern.toLowerCase())
        );
        
        // Include all files - if not in supported list, categorize as 'other'
        return hasMatchingExtension || isSpecialFile || true;
    }

    getLanguageFromExtension(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath);
        
        // Check for special files without extensions first
        for (const [language, extensions] of Object.entries(this.supportedExtensions)) {
            if (extensions.some(pattern => fileName === pattern || fileName.toLowerCase() === pattern.toLowerCase())) {
                return language;
            }
        }
        
        // Then check by extension
        for (const [language, extensions] of Object.entries(this.supportedExtensions)) {
            if (extensions.includes(ext)) {
                return language;
            }
        }
        
        return 'other';
    }

    async analyzeFile(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            const relativePath = path.relative(this.workspace, filePath);
            const language = this.getLanguageFromExtension(filePath);
            
            const metrics = {
                path: filePath,
                relativePath: relativePath,
                language: language,
                extension: path.extname(filePath),
                sizeBytes: stats.size,
                sizeKB: Math.round(stats.size / 1024 * 100) / 100,
                lines: lines.length,
                codeLines: 0,
                commentLines: 0,
                blankLines: 0,
                functions: 0,
                classes: 0,
                complexity: 0,
                lastModified: stats.mtime
            };

            // Analyze line types
            this.analyzeLineTypes(lines, metrics, language);
            
            // Analyze code structure
            this.analyzeCodeStructure(content, metrics, language);

            return metrics;

        } catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error.message);
            return null;
        }
    }

    analyzeLineTypes(lines, metrics, language) {
        const commentPatterns = this.getCommentPatterns(language);
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed === '') {
                metrics.blankLines++;
            } else if (this.isCommentLine(trimmed, commentPatterns)) {
                metrics.commentLines++;
            } else {
                metrics.codeLines++;
            }
        }
    }

    getCommentPatterns(language) {
        const patterns = {
            javascript: ['//', '/*', '*/', '/**', '*'],
            typescript: ['//', '/*', '*/', '/**', '*'],
            python: ['#', '"""', "'''"],
            java: ['//', '/*', '*/', '/**', '*'],
            csharp: ['//', '/*', '*/', '/**', '*'],
            cpp: ['//', '/*', '*/', '*'],
            go: ['//', '/*', '*/', '*'],
            rust: ['//', '/*', '*/', '*'],
            php: ['//', '#', '/*', '*/', '*'],
            ruby: ['#', '=begin', '=end'],
            swift: ['//', '/*', '*/', '/**', '*'],
            kotlin: ['//', '/*', '*/', '/**', '*'],
            scala: ['//', '/*', '*/', '/**', '*'],
            html: ['<!--', '-->', '<!'],
            css: ['/*', '*/', '*'],
            shell: ['#'],
            sql: ['--', '/*', '*/', '*'],
            yaml: ['#'],
            xml: ['<!--', '-->', '<!'],
            markdown: ['<!--', '-->', '<!'],
            config: ['#', ';', '//'],
            makefile: ['#'],
            dockerfile: ['#']
        };
        
        return patterns[language] || [];
    }

    isCommentLine(line, commentPatterns) {
        return commentPatterns.some(pattern => line.startsWith(pattern));
    }

    analyzeCodeStructure(content, metrics, language) {
        // Count functions and classes based on language
        const patterns = this.getStructurePatterns(language);
        
        // Count functions
        const functionMatches = content.match(patterns.function) || [];
        metrics.functions = functionMatches.length;
        
        // Count classes
        const classMatches = content.match(patterns.class) || [];
        metrics.classes = classMatches.length;
        
        // Calculate basic complexity (simplified)
        metrics.complexity = this.calculateBasicComplexity(content, language);
    }

    getStructurePatterns(language) {
        const patterns = {
            javascript: {
                function: /(?:function\s+\w+\s*\(|const\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>|function)|let\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>|function)|var\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|function)|\w+\s*:\s*(?:\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>|function)|async\s+function\s+\w+|export\s+(?:async\s+)?function\s+\w+|export\s+const\s+\w+\s*=\s*(?:\([^)]*\)\s*=>|function))/g,
                class: /(?:class\s+\w+|export\s+class\s+\w+|export\s+default\s+class\s+\w+)/g
            },
            typescript: {
                function: /(?:function\s+\w+\s*\(|const\s+\w+\s*:\s*[^=]*=\s*(?:\([^)]*\)\s*=>|async\s*\([^)]*\)\s*=>|function)|let\s+\w+\s*:\s*[^=]*=\s*(?:\([^)]*\)\s*=>|function)|var\s+\w+\s*:\s*[^=]*=\s*(?:\([^)]*\)\s*=>|function)|\w+\s*:\s*(?:\([^)]*\)\s*=>|function)|async\s+function\s+\w+|export\s+(?:async\s+)?function\s+\w+|export\s+const\s+\w+\s*:\s*[^=]*=\s*(?:\([^)]*\)\s*=>|function)|private\s+\w+\s*\(|public\s+\w+\s*\(|protected\s+\w+\s*\()/g,
                class: /(?:class\s+\w+|export\s+class\s+\w+|export\s+default\s+class\s+\w+|interface\s+\w+|type\s+\w+\s*=)/g
            },
            python: {
                function: /def\s+\w+\s*\(/g,
                class: /class\s+\w+/g
            },
            java: {
                function: /(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)*\w+\s*\([^)]*\)\s*{/g,
                class: /(?:public\s+)?(?:class|interface|enum)\s+\w+/g
            },
            csharp: {
                function: /(?:public|private|protected|internal)?\s*(?:static\s+)?(?:\w+\s+)*\w+\s*\([^)]*\)\s*{/g,
                class: /(?:public\s+)?(?:class|interface|struct|enum)\s+\w+/g
            },
            cpp: {
                function: /(?:\w+\s+)*\w+\s*\([^)]*\)\s*{/g,
                class: /(?:class|struct)\s+\w+/g
            },
            go: {
                function: /func\s+(?:\(\w+\s+\*?\w+\)\s+)?\w+\s*\(/g,
                class: /type\s+\w+\s+(?:struct|interface)/g
            },
            rust: {
                function: /fn\s+\w+\s*\(/g,
                class: /(?:struct|enum|trait|impl)\s+\w+/g
            },
            php: {
                function: /function\s+\w+\s*\(/g,
                class: /(?:class|interface|trait)\s+\w+/g
            },
            ruby: {
                function: /def\s+\w+/g,
                class: /class\s+\w+/g
            },
            swift: {
                function: /func\s+\w+\s*\(/g,
                class: /(?:class|struct|enum|protocol)\s+\w+/g
            }
        };
        
        // Use typescript patterns for .ts/.tsx files, javascript for .js/.jsx
        if (language === 'typescript') {
            return patterns.typescript;
        }
        
        return patterns[language] || { function: /$/g, class: /$/g };
    }

    calculateBasicComplexity(content, language) {
        // Simplified cyclomatic complexity calculation
        const complexityKeywords = this.getComplexityKeywords(language);
        let complexity = 1; // Base complexity
        
        for (const keyword of complexityKeywords) {
            // Escape special regex characters
            const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'g');
            const matches = content.match(regex) || [];
            complexity += matches.length;
        }
        
        return complexity;
    }

    getComplexityKeywords(language) {
        const keywords = {
            javascript: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', 'finally', '&&', '||', '?', 'forEach', 'map', 'filter', 'reduce'],
            typescript: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', 'finally', '&&', '||', '?', 'forEach', 'map', 'filter', 'reduce'],
            python: ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'and', 'or', 'with'],
            java: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', 'finally', '&&', '||', '?'],
            csharp: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', 'finally', '&&', '||', '?'],
            cpp: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?'],
            go: ['if', 'else', 'for', 'switch', 'case', 'select', '&&', '||'],
            rust: ['if', 'else', 'for', 'while', 'loop', 'match', '&&', '||'],
            php: ['if', 'else', 'elseif', 'for', 'while', 'do', 'switch', 'case', 'catch', 'finally', '&&', '||', '?'],
            ruby: ['if', 'else', 'elsif', 'for', 'while', 'case', 'when', 'rescue', 'and', 'or'],
            swift: ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'],
            kotlin: ['if', 'else', 'for', 'while', 'when', 'try', 'catch', 'finally', '&&', '||', '?'],
            scala: ['if', 'else', 'for', 'while', 'match', 'case', 'try', 'catch', 'finally', '&&', '||']
        };
        
        return keywords[language] || [];
    }

    updateSummary(summary, fileMetrics) {
        summary.totalFiles++;
        summary.totalLines += fileMetrics.lines;
        summary.totalCodeLines += fileMetrics.codeLines;
        summary.totalCommentLines += fileMetrics.commentLines;
        summary.totalBlankLines += fileMetrics.blankLines;
        summary.totalSizeBytes += fileMetrics.sizeBytes;
        
        if (fileMetrics.lines > this.thresholds.largeFileLines || 
            fileMetrics.sizeKB > this.thresholds.largeFileSizeKB) {
            summary.largeFiles++;
        }
        
        if (fileMetrics.lines > this.thresholds.veryLargeFileLines || 
            fileMetrics.sizeKB > this.thresholds.veryLargeFileSizeKB) {
            summary.veryLargeFiles++;
        }
    }

    updateLanguageStats(languages, fileMetrics) {
        const lang = fileMetrics.language;
        
        if (!languages[lang]) {
            languages[lang] = {
                files: 0,
                lines: 0,
                codeLines: 0,
                commentLines: 0,
                blankLines: 0,
                sizeBytes: 0,
                functions: 0,
                classes: 0,
                averageComplexity: 0
            };
        }
        
        const langStats = languages[lang];
        langStats.files++;
        langStats.lines += fileMetrics.lines;
        langStats.codeLines += fileMetrics.codeLines;
        langStats.commentLines += fileMetrics.commentLines;
        langStats.blankLines += fileMetrics.blankLines;
        langStats.sizeBytes += fileMetrics.sizeBytes;
        langStats.functions += fileMetrics.functions;
        langStats.classes += fileMetrics.classes;
        
        // Update average complexity
        langStats.averageComplexity = Math.round(
            (langStats.averageComplexity * (langStats.files - 1) + fileMetrics.complexity) / langStats.files * 100
        ) / 100;
    }

    getLargeFileReason(fileMetrics) {
        const reasons = [];
        
        if (fileMetrics.lines > this.thresholds.veryLargeFileLines) {
            reasons.push(`Very large file (${fileMetrics.lines} lines > ${this.thresholds.veryLargeFileLines})`);
        } else if (fileMetrics.lines > this.thresholds.largeFileLines) {
            reasons.push(`Large file (${fileMetrics.lines} lines > ${this.thresholds.largeFileLines})`);
        }
        
        if (fileMetrics.sizeKB > this.thresholds.veryLargeFileSizeKB) {
            reasons.push(`Very large size (${fileMetrics.sizeKB}KB > ${this.thresholds.veryLargeFileSizeKB}KB)`);
        } else if (fileMetrics.sizeKB > this.thresholds.largeFileSizeKB) {
            reasons.push(`Large size (${fileMetrics.sizeKB}KB > ${this.thresholds.largeFileSizeKB}KB)`);
        }
        
        return reasons.join(', ');
    }

    async calculateComplexityMetrics(results) {
        let totalComplexity = 0;
        let totalFunctions = 0;
        
        for (const fileMetrics of results.fileMetrics) {
            totalComplexity += fileMetrics.complexity;
            totalFunctions += fileMetrics.functions;
            
            // Identify high complexity files
            if (fileMetrics.complexity > this.thresholds.highComplexity) {
                results.complexity.highComplexityFiles.push({
                    path: fileMetrics.relativePath,
                    complexity: fileMetrics.complexity,
                    functions: fileMetrics.functions,
                    language: fileMetrics.language,
                    severity: fileMetrics.complexity > this.thresholds.veryHighComplexity ? 'very-high' : 'high'
                });
            }
        }
        
        results.complexity.totalFunctions = totalFunctions;
        results.complexity.averageComplexity = totalFunctions > 0 ? 
            Math.round(totalComplexity / totalFunctions * 100) / 100 : 0;
    }

    generateRecommendations(results) {
        const recommendations = [];
        
        // File size recommendations
        if (results.summary.veryLargeFiles > 0) {
            recommendations.push(`🚨 ${results.summary.veryLargeFiles} very large files found - consider breaking them down into smaller, focused modules`);
        }
        if (results.summary.largeFiles > 0) {
            recommendations.push(`⚠️ ${results.summary.largeFiles} large files found - review for refactoring opportunities`);
        }
        
        // Complexity recommendations
        if (results.complexity.highComplexityFiles.length > 0) {
            const veryHighCount = results.complexity.highComplexityFiles.filter(f => f.severity === 'very-high').length;
            if (veryHighCount > 0) {
                recommendations.push(`🔥 ${veryHighCount} files with very high complexity (>20) - immediate refactoring needed`);
            }
            recommendations.push(`⚡ ${results.complexity.highComplexityFiles.length} files with high complexity (>10) - consider simplification`);
        } else {
            recommendations.push(`✅ Excellent complexity metrics - all files below complexity threshold`);
        }
        
        // Language-specific recommendations
        const languages = Object.keys(results.languages);
        const jsFiles = (results.languages.javascript?.files || 0) + (results.languages.typescript?.files || 0);
        
        if (languages.length > 8) {
            recommendations.push(`🌐 ${languages.length} different languages detected - consider standardization for maintainability`);
        }
        
        if (jsFiles > 0) {
            const jsComplexity = ((results.languages.javascript?.averageComplexity || 0) + (results.languages.typescript?.averageComplexity || 0)) / 2;
            if (jsComplexity > 5) {
                recommendations.push(`🔧 JavaScript/TypeScript average complexity is ${jsComplexity.toFixed(1)} - consider using more functional programming patterns`);
            }
        }
        
        // Code quality recommendations
        const totalLines = results.summary.totalLines;
        const commentRatio = totalLines > 0 ? results.summary.totalCommentLines / totalLines : 0;
        
        if (commentRatio < 0.05) {
            recommendations.push(`📝 Very low comment ratio (${Math.round(commentRatio * 100)}%) - add JSDoc/docstrings for better maintainability`);
        } else if (commentRatio < 0.15) {
            recommendations.push(`📝 Low comment ratio (${Math.round(commentRatio * 100)}%) - consider adding more documentation`);
        } else {
            recommendations.push(`✅ Good documentation ratio (${Math.round(commentRatio * 100)}%)`);
        }
        
        // Function density recommendations
        const functionDensity = results.summary.totalLines > 0 ? results.complexity.totalFunctions / results.summary.totalLines * 1000 : 0;
        if (functionDensity < 5) {
            recommendations.push(`🔍 Low function density (${functionDensity.toFixed(1)} functions per 1000 lines) - consider breaking down large functions`);
        }
        
        // File type distribution
        const codeFiles = (results.languages.javascript?.files || 0) + 
                         (results.languages.typescript?.files || 0) + 
                         (results.languages.python?.files || 0) + 
                         (results.languages.java?.files || 0);
        const configFiles = (results.languages.json?.files || 0) + 
                           (results.languages.yaml?.files || 0) + 
                           (results.languages.config?.files || 0);
        
        if (configFiles > codeFiles) {
            recommendations.push(`⚙️ More configuration files (${configFiles}) than code files (${codeFiles}) - review if all configs are necessary`);
        }
        
        // Performance recommendations
        const avgFileSize = results.summary.totalSizeBytes / results.summary.totalFiles / 1024;
        if (avgFileSize > 50) {
            recommendations.push(`📦 Average file size is ${avgFileSize.toFixed(1)}KB - consider optimizing large files`);
        }
        
        // Security recommendations
        if (results.languages.shell?.files > 0) {
            recommendations.push(`🔒 Shell scripts detected - ensure proper input validation and security practices`);
        }
        
        // General best practices
        recommendations.push('📊 Regular code metrics monitoring helps maintain code quality');
        recommendations.push('🔧 Consider setting up automated code quality gates in CI/CD');
        recommendations.push('📈 Track metrics over time to identify trends and improvements');
        recommendations.push('🧪 Implement unit tests for high-complexity functions');
        recommendations.push('🔄 Consider code reviews for files with complexity > 15');
        
        return recommendations;
    }

    async runClocAnalysis() {
        try {
            // Try to use cloc if available for more accurate line counting
            const clocResult = execSync('cloc --json .', { 
                cwd: this.workspace, 
                encoding: 'utf8',
                timeout: 30000 
            });
            
            const clocData = JSON.parse(clocResult);
            return this.parseClocOutput(clocData);
            
        } catch (error) {
            console.error('cloc not available, using built-in analysis:', error.message);
            return null;
        }
    }

    parseClocOutput(clocData) {
        const languages = {};
        
        for (const [language, data] of Object.entries(clocData)) {
            if (language !== 'header' && language !== 'SUM') {
                languages[language.toLowerCase()] = {
                    files: data.nFiles || 0,
                    lines: data.nLines || 0,
                    codeLines: data.nCode || 0,
                    commentLines: data.nComment || 0,
                    blankLines: data.nBlank || 0
                };
            }
        }
        
        return languages;
    }
}

module.exports = MetricsAnalyzer;
