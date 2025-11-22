import { Command } from '@oclif/core';
import { projectDetector } from '../utils/project-detector';
import { configManager } from '../utils/config-manager';
import { logger } from '../utils/logger';
import chalk from 'chalk';

export default class Init extends Command {
    static description = 'Initialize PromptBrain in the current project';

    async run(): Promise<void> {
        logger.info('Detecting project framework...');

        const { framework, version } = await projectDetector.detect();

        logger.info(`Framework detected: ${chalk.bold(framework)} ${version ? `(${version})` : ''}`);

        // In a real scenario, we might create a specific config file for the project here
        // For now, we just ensure the global config exists and maybe set a project-specific context if needed
        // But per requirements, we just detect and print.

        // We could also create a local .promptbrainrc if that was a requirement, but the spec says .promptbrain/config.json
        // which usually implies global. However, "Create .promptbrain/config.json" in "pb init" section might imply local?
        // The spec says: "Create .promptbrain/config.json" under "pb init".
        // But under "Authentication", it says "~/.promptbrain/config.json only stores user metadata".
        // I will assume "pb init" creates a LOCAL configuration if needed, or just confirms setup.
        // Given "Create .promptbrain/config.json" is listed under "pb init", I will create a local config if it doesn't exist.
        // But wait, the auth config is global.
        // Let's assume `pb init` initializes the CURRENT directory for usage, maybe creating a `.promptbrain` folder locally?
        // The spec says "Create .promptbrain/config.json" under "pb init".
        // I will create a local `.promptbrain/config.json` in the current directory.

        try {
            // Check if we are already initialized
            // For Phase 1, we just create the folder and a basic config
            const localConfigDir = '.promptbrain';
            const fs = require('fs-extra');
            const path = require('path');

            await fs.ensureDir(localConfigDir);
            const localConfigFile = path.join(localConfigDir, 'config.json');

            if (await fs.pathExists(localConfigFile)) {
                logger.warning('Project already initialized.');
            } else {
                await fs.writeJson(localConfigFile, {
                    framework,
                    version,
                    initializedAt: new Date().toISOString()
                }, { spaces: 2 });
                logger.success('Project initialized!');
            }

        } catch (error: any) {
            logger.error(`Initialization failed: ${error.message}`);
        }
    }
}
