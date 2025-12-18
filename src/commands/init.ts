import { Command, Flags } from '@oclif/core';
import { detectProject, saveProjectInfo, getProjectSummary } from '../lib/project-detector';
import { ProjectAnalyzer } from '../lib/project-analyzer';
import ReportFormatter from '../utils/report-formatter';
import { logger } from '../utils/logger';
import colors from '../utils/colors';
import progress from '../utils/progress';
import ui from '../utils/ui';
import tips from '../utils/tips';
import jsonOutput from '../utils/json-output';
import interactive from '../utils/interactive';
import * as fs from 'fs-extra';
import * as path from 'path';

export default class Init extends Command {
    static description = 'Initialize PromptBrain in the current project';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --json',
    ];

    static flags = {
        json: Flags.boolean({
            description: 'Output results in JSON format',
            default: false,
        }),
        report: Flags.boolean({
            description: 'Generate comprehensive project analysis report',
            char: 'r',
            default: true,
        }),
        save: Flags.boolean({
            description: 'Save analysis report to .promptbrain/analysis.md',
            default: false,
        }),
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(Init);
        const projectPath = process.cwd();

        if (!flags.json) {
            console.log('');
            console.log(colors.heading('🚀 Initializing PromptBrain'));
            console.log('');
            progress.thinking('Detecting project structure...');
        }

        try {
            // Detect project (basic detection)
            const projectInfo = await detectProject(projectPath);

            if (!flags.json) {
                progress.processing('Analyzing project architecture...');
            }

            // Generate comprehensive analysis report
            let analysisReport = null;
            if (flags.report) {
                const analyzer = new ProjectAnalyzer(projectPath);
                analysisReport = await analyzer.generateReport();
                
                if (!flags.json) {
                    progress.thinking('Generating insights and recommendations...');
                }
            }

            // Check if already initialized
            const pbDir = path.join(projectPath, '.promptbrain');
            const configFile = path.join(pbDir, 'config.json');
            const alreadyInitialized = await fs.pathExists(configFile);

            if (alreadyInitialized && !flags.json) {
                progress.stop();
                console.log('');
                console.log(colors.statusWarning('Project already initialized'));
                
                // Still show analysis if requested
                if (flags.report && analysisReport) {
                    console.log('');
                    console.log(ReportFormatter.formatQuickSummary(analysisReport));
                }
                console.log('');
            } else {
                // Create .promptbrain directory
                await fs.ensureDir(pbDir);

                // Save project info
                await saveProjectInfo(projectInfo, projectPath);

                // Create config.json with analysis
                const config = {
                    version: '0.1.0',
                    projectInfo,
                    analysisReport,
                    initializedAt: new Date().toISOString(),
                };

                await fs.writeJson(configFile, config, { spaces: 2 });

                // Save analysis report if requested
                if (flags.save && analysisReport) {
                    const reportPath = path.join(pbDir, 'analysis.md');
                    const reportContent = ReportFormatter.formatReport(analysisReport);
                    await fs.writeFile(reportPath, reportContent);
                }

                if (!flags.json) {
                    progress.succeed('Project analysis complete!');
                }
            }

            // Display results
            if (flags.json) {
                jsonOutput.success({
                    initialized: true,
                    projectInfo,
                    analysisReport,
                    configPath: path.join('.promptbrain', 'config.json'),
                });
            } else {
                // Show comprehensive analysis
                if (flags.report && analysisReport) {
                    console.log('');
                    console.log(ReportFormatter.formatQuickSummary(analysisReport));
                    
                    // Ask if user wants to see full report
                    console.log('');
                    const showFullReport = await interactive.confirm({
                        message: 'Would you like to see the detailed analysis report?',
                        default: false,
                    });

                    if (showFullReport) {
                        console.log('');
                        console.log(ReportFormatter.formatReport(analysisReport));
                    } else {
                        console.log('');
                        console.log(colors.dim(`Full report saved to ${colors.highlight('.promptbrain/config.json')}`));
                        if (flags.save) {
                            console.log(colors.dim(`Markdown report saved to ${colors.highlight('.promptbrain/analysis.md')}`));
                        }
                    }
                } else {
                    // Fallback to basic display
                    console.log('');
                    ui.section('Project Detection Results');
                    
                    console.log(colors.primary('Project Type:     ') + colors.highlight(projectInfo.projectType));
                    
                    if (projectInfo.frameworks.length > 0) {
                        console.log(colors.primary('Frameworks:       ') + colors.highlight(projectInfo.frameworks.join(', ')));
                    }
                    
                    if (projectInfo.packageManager !== 'unknown') {
                        console.log(colors.primary('Package Manager:  ') + colors.highlight(projectInfo.packageManager));
                    }
                    
                    if (projectInfo.hasTypeScript) {
                        console.log(colors.primary('TypeScript:       ') + colors.success('Yes'));
                    }

                    const depCount = Object.keys(projectInfo.dependencies).length;
                    if (depCount > 0) {
                        console.log(colors.primary('Dependencies:     ') + colors.neutral(`${depCount} packages`));
                    }
                }

                console.log('');
                ui.divider();
                console.log('');

                // Show what's been configured
                console.log(colors.success('✓ Created .promptbrain/ directory'));
                console.log(colors.success('✓ Saved project configuration'));
                console.log(colors.success('✓ Generated comprehensive analysis'));
                console.log(colors.success('✓ Optimized templates for your stack'));
                console.log('');

                // Next steps
                console.log('');
                ui.section('Next Steps');
                console.log(colors.dim('  1. ') + colors.highlight('pb enhance "your prompt"') + colors.dim(' - Get context-aware enhancements'));
                console.log(colors.dim('  2. ') + colors.highlight('pb devsync') + colors.dim(' - Sync your development context'));
                console.log(colors.dim('  3. ') + colors.highlight('pb link notion') + colors.dim(' - Connect external tools'));
                console.log('');
            }

        } catch (error: any) {
            if (!flags.json) {
                progress.fail('Initialization failed');
                console.log('');
            }

            if (flags.json) {
                jsonOutput.error('INIT_FAILED', `Initialization failed: ${error.message}`);
            } else {
                logger.error(`Initialization failed: ${error.message}`);
                ui.tip('Make sure you\'re in a valid project directory');
                console.log('');
            }
            process.exit(1);
        }
    }
}
