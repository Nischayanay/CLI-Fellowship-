import { Command, Flags } from '@oclif/core';
import { detectProject, saveProjectInfo, getProjectSummary } from '../lib/project-detector';
import { logger } from '../utils/logger';
import colors from '../utils/colors';
import progress from '../utils/progress';
import ui from '../utils/ui';
import tips from '../utils/tips';
import jsonOutput from '../utils/json-output';
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
    };

    async run(): Promise<void> {
        const { flags } = await this.parse(Init);
        const projectPath = process.cwd();

        if (!flags.json) {
            console.log('');
            console.log(colors.heading('🚀 Initializing PromptBrain'));
            console.log('');
            progress.start('Detecting project structure...');
        }

        try {
            // Detect project
            const projectInfo = await detectProject(projectPath);

            if (!flags.json) {
                progress.update('Analyzing frameworks and dependencies...');
            }

            // Check if already initialized
            const pbDir = path.join(projectPath, '.promptbrain');
            const configFile = path.join(pbDir, 'config.json');
            const alreadyInitialized = await fs.pathExists(configFile);

            if (alreadyInitialized && !flags.json) {
                progress.stop();
                console.log('');
                console.log(colors.statusWarning('Project already initialized'));
                console.log('');
            } else {
                // Create .promptbrain directory
                await fs.ensureDir(pbDir);

                // Save project info
                await saveProjectInfo(projectInfo, projectPath);

                // Create config.json
                const config = {
                    version: '0.1.0',
                    projectInfo,
                    initializedAt: new Date().toISOString(),
                };

                await fs.writeJson(configFile, config, { spaces: 2 });

                if (!flags.json) {
                    progress.succeed('Project initialized successfully!');
                }
            }

            // Display results
            if (flags.json) {
                jsonOutput.success({
                    initialized: true,
                    projectInfo,
                    configPath: path.join('.promptbrain', 'config.json'),
                });
            } else {
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

                console.log('');
                ui.divider();
                console.log('');

                // Show what's been configured
                console.log(colors.success('✓ Created .promptbrain/ directory'));
                console.log(colors.success('✓ Saved project configuration'));
                console.log(colors.success('✓ Detected frameworks and dependencies'));
                console.log(colors.success('✓ Optimized templates for your stack'));
                console.log('');

                // Show contextual tip
                tips.showContextualTip('init', projectInfo);

                // Next steps
                console.log('');
                ui.section('Next Steps');
                console.log(colors.dim('  1. ') + colors.highlight('pb enhance "your prompt"') + colors.dim(' - Try framework-aware enhancements'));
                console.log(colors.dim('  2. ') + colors.highlight('pb devsync') + colors.dim(' - Get context for your current task'));
                console.log(colors.dim('  3. ') + colors.highlight('pb link') + colors.dim(' - Connect external tools'));
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
