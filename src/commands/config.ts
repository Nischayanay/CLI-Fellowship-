import { Command, Args, Flags } from '@oclif/core';
import chalk from 'chalk';
import { configManager, DEFAULT_CONFIG, PBConfig } from '../lib/config';
import { logger } from '../utils/logger';

export default class Config extends Command {
    static description = 'View or modify PBCLI configuration';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> get retry.maxRetries',
        '<%= config.bin %> <%= command.id %> set retry.maxRetries 5',
        '<%= config.bin %> <%= command.id %> reset',
        '<%= config.bin %> <%= command.id %> path',
    ];

    static args = {
        action: Args.string({
            description: 'Action to perform (get, set, reset, path)',
            options: ['get', 'set', 'reset', 'path'],
        }),
        key: Args.string({
            description: 'Configuration key (e.g., retry.maxRetries)',
        }),
        value: Args.string({
            description: 'Value to set',
        }),
    };

    static flags = {
        json: Flags.boolean({
            description: 'Output as JSON',
            default: false,
        }),
    };

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Config);

        // Load config
        await configManager.load();

        switch (args.action) {
            case 'get':
                await this.handleGet(args.key, flags.json);
                break;
            case 'set':
                await this.handleSet(args.key, args.value);
                break;
            case 'reset':
                await this.handleReset();
                break;
            case 'path':
                this.handlePath();
                break;
            default:
                await this.handleShow(flags.json);
        }
    }

    /**
     * Show all configuration
     */
    private async handleShow(json: boolean): Promise<void> {
        const config = configManager.get();

        if (json) {
            console.log(JSON.stringify(config, null, 2));
            return;
        }

        console.log('');
        console.log(chalk.bold('PBCLI Configuration'));
        console.log(chalk.dim(`File: ${configManager.getConfigPath()}`));
        console.log('');

        this.displaySection('API', config.api);
        this.displaySection('Retry', config.retry);
        this.displaySection('Offline Queue', config.offlineQueue);
        this.displaySection('Progress', config.progress);
        
        console.log(chalk.bold('Debug:'));
        console.log(`  ${config.debug ? chalk.green('enabled') : chalk.dim('disabled')}`);
        console.log('');

        console.log(chalk.dim('Use `pb config set <key> <value>` to modify settings'));
        console.log(chalk.dim('Use `pb config reset` to restore defaults'));
        console.log('');
    }

    /**
     * Display a configuration section
     */
    private displaySection(name: string, section: Record<string, any>): void {
        console.log(chalk.bold(`${name}:`));
        for (const [key, value] of Object.entries(section)) {
            const displayValue = typeof value === 'boolean' 
                ? (value ? chalk.green('true') : chalk.dim('false'))
                : chalk.cyan(String(value));
            console.log(`  ${key}: ${displayValue}`);
        }
        console.log('');
    }

    /**
     * Get a specific configuration value
     */
    private async handleGet(key: string | undefined, json: boolean): Promise<void> {
        if (!key) {
            logger.error('Please specify a configuration key');
            logger.info('Example: pb config get retry.maxRetries');
            process.exit(1);
        }

        const value = configManager.getValue(key);

        if (value === undefined) {
            logger.error(`Configuration key not found: ${key}`);
            this.showAvailableKeys();
            process.exit(1);
        }

        if (json) {
            console.log(JSON.stringify({ [key]: value }, null, 2));
        } else {
            console.log(`${chalk.bold(key)}: ${chalk.cyan(JSON.stringify(value))}`);
        }
    }

    /**
     * Set a configuration value
     */
    private async handleSet(key: string | undefined, value: string | undefined): Promise<void> {
        if (!key) {
            logger.error('Please specify a configuration key');
            logger.info('Example: pb config set retry.maxRetries 5');
            process.exit(1);
        }

        if (value === undefined) {
            logger.error('Please specify a value');
            logger.info(`Example: pb config set ${key} <value>`);
            process.exit(1);
        }

        // Validate key exists in defaults
        const currentValue = configManager.getValue(key);
        if (currentValue === undefined) {
            logger.error(`Unknown configuration key: ${key}`);
            this.showAvailableKeys();
            process.exit(1);
        }

        // Parse value based on current type
        let parsedValue: any;
        const currentType = typeof currentValue;

        try {
            if (currentType === 'number') {
                parsedValue = Number(value);
                if (isNaN(parsedValue)) {
                    throw new Error('Invalid number');
                }
            } else if (currentType === 'boolean') {
                parsedValue = value.toLowerCase() === 'true' || value === '1';
            } else {
                parsedValue = value;
            }
        } catch (error) {
            logger.error(`Invalid value for ${key}. Expected ${currentType}.`);
            process.exit(1);
        }

        // Validate specific keys
        if (!this.validateValue(key, parsedValue)) {
            process.exit(1);
        }

        await configManager.setValue(key, parsedValue);
        logger.success(`Set ${key} = ${JSON.stringify(parsedValue)}`);
    }

    /**
     * Reset configuration to defaults
     */
    private async handleReset(): Promise<void> {
        await configManager.reset();
        logger.success('Configuration reset to defaults');
    }

    /**
     * Show config file path
     */
    private handlePath(): void {
        console.log(configManager.getConfigPath());
    }

    /**
     * Show available configuration keys
     */
    private showAvailableKeys(): void {
        console.log('');
        console.log(chalk.bold('Available configuration keys:'));
        console.log('');
        
        const keys = this.flattenKeys(DEFAULT_CONFIG);
        for (const key of keys) {
            const value = configManager.getValue(key);
            console.log(`  ${chalk.cyan(key)} (${typeof value})`);
        }
        console.log('');
    }

    /**
     * Flatten config object to dot-notation keys
     */
    private flattenKeys(obj: any, prefix = ''): string[] {
        const keys: string[] = [];
        
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                keys.push(...this.flattenKeys(value, fullKey));
            } else {
                keys.push(fullKey);
            }
        }
        
        return keys;
    }

    /**
     * Validate specific configuration values
     */
    private validateValue(key: string, value: any): boolean {
        // Retry config validation
        if (key === 'retry.maxRetries' && (value < 0 || value > 10)) {
            logger.error('maxRetries must be between 0 and 10');
            return false;
        }
        if (key === 'retry.baseDelay' && (value < 100 || value > 10000)) {
            logger.error('baseDelay must be between 100 and 10000 ms');
            return false;
        }
        if (key === 'retry.maxDelay' && (value < 1000 || value > 60000)) {
            logger.error('maxDelay must be between 1000 and 60000 ms');
            return false;
        }

        // API config validation
        if (key === 'api.timeout' && (value < 1000 || value > 120000)) {
            logger.error('timeout must be between 1000 and 120000 ms');
            return false;
        }

        // Offline queue validation
        if (key === 'offlineQueue.maxAgeHours' && (value < 1 || value > 168)) {
            logger.error('maxAgeHours must be between 1 and 168 (1 week)');
            return false;
        }
        if (key === 'offlineQueue.maxItems' && (value < 10 || value > 1000)) {
            logger.error('maxItems must be between 10 and 1000');
            return false;
        }

        return true;
    }
}
