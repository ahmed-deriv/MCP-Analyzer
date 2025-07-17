const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityAnalyzer {
    constructor() {
        this.workspace = null;
        this.packageManagers = {
            npm: 'package.json',
            pip: 'requirements.txt',
            maven: 'pom.xml',
            gradle: 'build.gradle',
            composer: 'composer.json',
            cargo: 'Cargo.toml'
        };
    }

    async initialize(workspace) {
        this.workspace = workspace;
        
        if (!fs.existsSync(workspace)) {
            throw new Error(`Workspace directory does not exist: ${workspace}`);
        }

        console.error(`Security analyzer initialized for workspace: ${workspace}`);
    }

    async detectPackageManagers() {
        const detected = [];
        
        for (const [manager, file] of Object.entries(this.packageManagers)) {
            const filePath = path.join(this.workspace, file);
            if (fs.existsSync(filePath)) {
                detected.push({
                    manager,
                    file,
                    path: filePath
                });
            }
        }

        return detected;
    }

    async auditDependencies() {
        try {
            const packageManagers = await this.detectPackageManagers();
            const results = {
                success: true,
                vulnerabilities: [],
                summary: {
                    total: 0,
                    critical: 0,
                    high: 0,
                    moderate: 0,
                    low: 0,
                    info: 0
                },
                packageManagers: packageManagers.map(pm => pm.manager),
                workspace: this.workspace
            };

            for (const pm of packageManagers) {
                console.error(`Running dependency audit for ${pm.manager}...`);
                
                try {
                    let auditResult;
                    
                    switch (pm.manager) {
                        case 'npm':
                            auditResult = await this.runNpmAudit();
                            break;
                        case 'pip':
                            auditResult = await this.runPipAudit();
                            break;
                        case 'maven':
                            auditResult = await this.runMavenAudit();
                            break;
                        default:
                            auditResult = { vulnerabilities: [], summary: {} };
                    }

                    if (auditResult.vulnerabilities) {
                        results.vulnerabilities.push(...auditResult.vulnerabilities);
                    }

                    // Update summary counts
                    if (auditResult.summary) {
                        results.summary.total += auditResult.summary.total || 0;
                        results.summary.critical += auditResult.summary.critical || 0;
                        results.summary.high += auditResult.summary.high || 0;
                        results.summary.moderate += auditResult.summary.moderate || 0;
                        results.summary.low += auditResult.summary.low || 0;
                        results.summary.info += auditResult.summary.info || 0;
                    }

                } catch (error) {
                    console.error(`Error auditing ${pm.manager}:`, error.message);
                    results.vulnerabilities.push({
                        package: pm.manager,
                        severity: 'error',
                        title: `Failed to audit ${pm.manager} dependencies`,
                        description: error.message,
                        packageManager: pm.manager
                    });
                }
            }

            return results;

        } catch (error) {
            console.error('Dependency audit error:', error.message);
            return {
                success: false,
                error: error.message,
                vulnerabilities: [],
                summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
                workspace: this.workspace
            };
        }
    }

    async runNpmAudit() {
        try {
            // Check if package.json exists and has dependencies
            const packageJsonPath = path.join(this.workspace, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                return { vulnerabilities: [], summary: {} };
            }

            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const hasDependencies = packageJson.dependencies || packageJson.devDependencies;
            
            if (!hasDependencies) {
                return { 
                    vulnerabilities: [], 
                    summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 } 
                };
            }

            // Run npm audit
            const auditCommand = 'npm audit --json';
            const result = execSync(auditCommand, { 
                cwd: this.workspace, 
                encoding: 'utf8',
                timeout: 30000 
            });

            const auditData = JSON.parse(result);
            const vulnerabilities = [];

            // Parse npm audit results
            if (auditData.vulnerabilities) {
                for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
                    vulnerabilities.push({
                        package: packageName,
                        severity: vulnData.severity,
                        title: vulnData.title || `Vulnerability in ${packageName}`,
                        description: vulnData.overview || 'No description available',
                        version: vulnData.range || 'Unknown',
                        cwe: vulnData.cwe || [],
                        cvss: vulnData.cvss || null,
                        packageManager: 'npm',
                        fixAvailable: vulnData.fixAvailable || false,
                        url: vulnData.url || null
                    });
                }
            }

            const summary = {
                total: auditData.metadata?.vulnerabilities?.total || 0,
                critical: auditData.metadata?.vulnerabilities?.critical || 0,
                high: auditData.metadata?.vulnerabilities?.high || 0,
                moderate: auditData.metadata?.vulnerabilities?.moderate || 0,
                low: auditData.metadata?.vulnerabilities?.low || 0,
                info: auditData.metadata?.vulnerabilities?.info || 0
            };

            return { vulnerabilities, summary };

        } catch (error) {
            // npm audit returns non-zero exit code when vulnerabilities are found
            if (error.stdout) {
                try {
                    const auditData = JSON.parse(error.stdout);
                    return this.parseNpmAuditOutput(auditData);
                } catch (parseError) {
                    console.error('Failed to parse npm audit output:', parseError.message);
                }
            }

            console.error('npm audit error:', error.message);
            return { 
                vulnerabilities: [{
                    package: 'npm-audit',
                    severity: 'error',
                    title: 'npm audit failed',
                    description: error.message,
                    packageManager: 'npm'
                }], 
                summary: {} 
            };
        }
    }

    parseNpmAuditOutput(auditData) {
        const vulnerabilities = [];

        if (auditData.vulnerabilities) {
            for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
                vulnerabilities.push({
                    package: packageName,
                    severity: vulnData.severity,
                    title: vulnData.title || `Vulnerability in ${packageName}`,
                    description: vulnData.overview || 'No description available',
                    version: vulnData.range || 'Unknown',
                    cwe: vulnData.cwe || [],
                    cvss: vulnData.cvss || null,
                    packageManager: 'npm',
                    fixAvailable: vulnData.fixAvailable || false,
                    url: vulnData.url || null
                });
            }
        }

        const summary = {
            total: auditData.metadata?.vulnerabilities?.total || 0,
            critical: auditData.metadata?.vulnerabilities?.critical || 0,
            high: auditData.metadata?.vulnerabilities?.high || 0,
            moderate: auditData.metadata?.vulnerabilities?.moderate || 0,
            low: auditData.metadata?.vulnerabilities?.low || 0,
            info: auditData.metadata?.vulnerabilities?.info || 0
        };

        return { vulnerabilities, summary };
    }

    async runPipAudit() {
        try {
            // Check if requirements.txt exists
            const requirementsPath = path.join(this.workspace, 'requirements.txt');
            if (!fs.existsSync(requirementsPath)) {
                return { vulnerabilities: [], summary: {} };
            }

            // Try to use pip-audit if available, otherwise use safety
            let auditCommand;
            let usesPipAudit = false;

            try {
                execSync('pip-audit --version', { timeout: 5000 });
                auditCommand = 'pip-audit --format=json';
                usesPipAudit = true;
            } catch {
                try {
                    execSync('safety --version', { timeout: 5000 });
                    auditCommand = 'safety check --json';
                } catch {
                    return {
                        vulnerabilities: [{
                            package: 'pip-audit',
                            severity: 'warning',
                            title: 'Security audit tool not available',
                            description: 'Neither pip-audit nor safety is installed. Install with: pip install pip-audit',
                            packageManager: 'pip'
                        }],
                        summary: {}
                    };
                }
            }

            const result = execSync(auditCommand, { 
                cwd: this.workspace, 
                encoding: 'utf8',
                timeout: 30000 
            });

            const vulnerabilities = [];
            let summary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };

            if (usesPipAudit) {
                const auditData = JSON.parse(result);
                // Parse pip-audit JSON output
                if (auditData.vulnerabilities) {
                    auditData.vulnerabilities.forEach(vuln => {
                        vulnerabilities.push({
                            package: vuln.package,
                            severity: this.mapPipSeverity(vuln.severity),
                            title: vuln.id || `Vulnerability in ${vuln.package}`,
                            description: vuln.description || 'No description available',
                            version: vuln.installed_version,
                            packageManager: 'pip',
                            fixAvailable: !!vuln.fix_versions,
                            url: vuln.aliases?.[0] || null
                        });
                        summary.total++;
                        summary[this.mapPipSeverity(vuln.severity)]++;
                    });
                }
            } else {
                // Parse safety JSON output
                const safetyData = JSON.parse(result);
                safetyData.forEach(vuln => {
                    vulnerabilities.push({
                        package: vuln.package,
                        severity: 'high', // Safety doesn't provide severity levels
                        title: vuln.advisory,
                        description: vuln.advisory,
                        version: vuln.installed_version,
                        packageManager: 'pip',
                        fixAvailable: true,
                        url: null
                    });
                    summary.total++;
                    summary.high++;
                });
            }

            return { vulnerabilities, summary };

        } catch (error) {
            console.error('pip audit error:', error.message);
            return { 
                vulnerabilities: [{
                    package: 'pip-audit',
                    severity: 'error',
                    title: 'pip audit failed',
                    description: error.message,
                    packageManager: 'pip'
                }], 
                summary: {} 
            };
        }
    }

    async runMavenAudit() {
        try {
            // Check if pom.xml exists
            const pomPath = path.join(this.workspace, 'pom.xml');
            if (!fs.existsSync(pomPath)) {
                return { vulnerabilities: [], summary: {} };
            }

            // Use OWASP dependency check plugin
            const auditCommand = 'mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=0 -Dformat=JSON';
            
            execSync(auditCommand, { 
                cwd: this.workspace, 
                timeout: 60000 // Maven can be slow
            });

            // Read the generated report
            const reportPath = path.join(this.workspace, 'target', 'dependency-check-report.json');
            if (!fs.existsSync(reportPath)) {
                return { vulnerabilities: [], summary: {} };
            }

            const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            const vulnerabilities = [];
            let summary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };

            if (reportData.dependencies) {
                reportData.dependencies.forEach(dep => {
                    if (dep.vulnerabilities) {
                        dep.vulnerabilities.forEach(vuln => {
                            const severity = this.mapCvssSeverity(vuln.cvssv3?.baseScore || vuln.cvssv2?.score);
                            vulnerabilities.push({
                                package: dep.fileName,
                                severity: severity,
                                title: vuln.name,
                                description: vuln.description,
                                version: dep.version || 'Unknown',
                                cvss: vuln.cvssv3?.baseScore || vuln.cvssv2?.score,
                                packageManager: 'maven',
                                fixAvailable: false,
                                url: vuln.references?.[0]?.url || null
                            });
                            summary.total++;
                            summary[severity]++;
                        });
                    }
                });
            }

            return { vulnerabilities, summary };

        } catch (error) {
            console.error('maven audit error:', error.message);
            return { 
                vulnerabilities: [{
                    package: 'maven-audit',
                    severity: 'error',
                    title: 'maven audit failed',
                    description: error.message,
                    packageManager: 'maven'
                }], 
                summary: {} 
            };
        }
    }

    async checkLicenseCompliance() {
        try {
            const packageManagers = await this.detectPackageManagers();
            const results = {
                success: true,
                licenses: [],
                issues: [],
                summary: {
                    total: 0,
                    restrictive: 0,
                    permissive: 0,
                    unknown: 0
                },
                workspace: this.workspace
            };

            for (const pm of packageManagers) {
                console.error(`Checking license compliance for ${pm.manager}...`);
                
                try {
                    let licenseResult;
                    
                    switch (pm.manager) {
                        case 'npm':
                            licenseResult = await this.checkNpmLicenses();
                            break;
                        case 'pip':
                            licenseResult = await this.checkPipLicenses();
                            break;
                        default:
                            licenseResult = { licenses: [], issues: [] };
                    }

                    if (licenseResult.licenses) {
                        results.licenses.push(...licenseResult.licenses);
                    }
                    if (licenseResult.issues) {
                        results.issues.push(...licenseResult.issues);
                    }

                } catch (error) {
                    console.error(`Error checking licenses for ${pm.manager}:`, error.message);
                    results.issues.push({
                        package: pm.manager,
                        license: 'error',
                        issue: `Failed to check ${pm.manager} licenses: ${error.message}`,
                        severity: 'warning'
                    });
                }
            }

            // Calculate summary
            results.summary.total = results.licenses.length;
            results.licenses.forEach(license => {
                if (this.isRestrictiveLicense(license.license)) {
                    results.summary.restrictive++;
                } else if (this.isPermissiveLicense(license.license)) {
                    results.summary.permissive++;
                } else {
                    results.summary.unknown++;
                }
            });

            return results;

        } catch (error) {
            console.error('License compliance check error:', error.message);
            return {
                success: false,
                error: error.message,
                licenses: [],
                issues: [],
                summary: { total: 0, restrictive: 0, permissive: 0, unknown: 0 },
                workspace: this.workspace
            };
        }
    }

    async checkNpmLicenses() {
        try {
            // Use license-checker if available
            try {
                execSync('license-checker --version', { timeout: 5000 });
            } catch {
                return {
                    licenses: [],
                    issues: [{
                        package: 'license-checker',
                        license: 'missing',
                        issue: 'license-checker not installed. Install with: npm install -g license-checker',
                        severity: 'info'
                    }]
                };
            }

            const result = execSync('license-checker --json', { 
                cwd: this.workspace, 
                encoding: 'utf8',
                timeout: 30000 
            });

            const licenseData = JSON.parse(result);
            const licenses = [];
            const issues = [];

            for (const [packageName, data] of Object.entries(licenseData)) {
                const license = data.licenses || 'Unknown';
                licenses.push({
                    package: packageName,
                    license: license,
                    version: data.version || 'Unknown',
                    repository: data.repository || null,
                    packageManager: 'npm'
                });

                // Check for problematic licenses
                if (this.isProblematicLicense(license)) {
                    issues.push({
                        package: packageName,
                        license: license,
                        issue: `Potentially restrictive license: ${license}`,
                        severity: 'warning'
                    });
                }
            }

            return { licenses, issues };

        } catch (error) {
            console.error('npm license check error:', error.message);
            return { 
                licenses: [], 
                issues: [{
                    package: 'npm-licenses',
                    license: 'error',
                    issue: error.message,
                    severity: 'error'
                }] 
            };
        }
    }

    async checkPipLicenses() {
        try {
            // Use pip-licenses if available
            try {
                execSync('pip-licenses --version', { timeout: 5000 });
            } catch {
                return {
                    licenses: [],
                    issues: [{
                        package: 'pip-licenses',
                        license: 'missing',
                        issue: 'pip-licenses not installed. Install with: pip install pip-licenses',
                        severity: 'info'
                    }]
                };
            }

            const result = execSync('pip-licenses --format=json', { 
                cwd: this.workspace, 
                encoding: 'utf8',
                timeout: 30000 
            });

            const licenseData = JSON.parse(result);
            const licenses = [];
            const issues = [];

            licenseData.forEach(data => {
                const license = data.License || 'Unknown';
                licenses.push({
                    package: data.Name,
                    license: license,
                    version: data.Version || 'Unknown',
                    repository: null,
                    packageManager: 'pip'
                });

                // Check for problematic licenses
                if (this.isProblematicLicense(license)) {
                    issues.push({
                        package: data.Name,
                        license: license,
                        issue: `Potentially restrictive license: ${license}`,
                        severity: 'warning'
                    });
                }
            });

            return { licenses, issues };

        } catch (error) {
            console.error('pip license check error:', error.message);
            return { 
                licenses: [], 
                issues: [{
                    package: 'pip-licenses',
                    license: 'error',
                    issue: error.message,
                    severity: 'error'
                }] 
            };
        }
    }

    // Helper methods
    mapPipSeverity(severity) {
        const severityMap = {
            'critical': 'critical',
            'high': 'high',
            'medium': 'moderate',
            'moderate': 'moderate',
            'low': 'low',
            'info': 'info'
        };
        return severityMap[severity?.toLowerCase()] || 'moderate';
    }

    mapCvssSeverity(score) {
        if (!score) return 'moderate';
        if (score >= 9.0) return 'critical';
        if (score >= 7.0) return 'high';
        if (score >= 4.0) return 'moderate';
        if (score >= 0.1) return 'low';
        return 'info';
    }

    isRestrictiveLicense(license) {
        const restrictive = ['GPL', 'AGPL', 'LGPL', 'MPL', 'EPL', 'CDDL'];
        return restrictive.some(r => license.toUpperCase().includes(r));
    }

    isPermissiveLicense(license) {
        const permissive = ['MIT', 'BSD', 'Apache', 'ISC', 'Unlicense', 'WTFPL'];
        return permissive.some(p => license.toUpperCase().includes(p));
    }

    isProblematicLicense(license) {
        const problematic = ['GPL-3.0', 'AGPL', 'SSPL', 'Commons Clause'];
        return problematic.some(p => license.toUpperCase().includes(p.toUpperCase()));
    }
}

module.exports = SecurityAnalyzer;
