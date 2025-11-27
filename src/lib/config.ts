/**
 * Configuration Manager
 * 
 * Manages PBCLI configuration stored in ~/.pb/config.json
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { logger } from '../utils/logger';

const PB_DIR = path.join(os.homedir(), '.pb');
const CONFIG_FILE = path.join(PB_DIR, 'config.json');

export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    factor: number;
}

export interface OfflineQueueConfig {
    enabled: boolean;
    maxAgeHours: number;
    maxSizeMb: number;
    maxItems: number;
}

export interface ProgressConfig {
    enabled: boolean;
    updateIntervalMs: number;
}

export interface ApiConfig {
    baseUrl: string;
    timeout: number;
}

export interface UIConfig {
    colorBlindMode: boolean;
    colors: boolean;
    jsonOutput: boolean;
}

export interface PBConfig {
    api: ApiConfig;
    retry: RetryConfig;
    offlineQueue: OfflineQueueConfig;
    progress: ProgressConfig;
    ui: UIConfig;
    debug: boolean;
}

const DEFAULT_CONFIG: PBConfig = {
    api: {
        baseUrl: 'https://promptbrain-context-engine.vercel.app',
        timeout: 15000,
    },
    retry: {
        maxRetries: 3,
        baseDelay: 500,
        maxDelay: 10000,
        factor: 3,
    },
    offlineQueue: {
        enabled: true,
        maxAgeHours: 24,
        maxSizeMb: 10,
        maxItems: 100,
    },
    progress: {
        enabled: true,
        updateIntervalMs: 100,
    },
    ui: {
        colorBlindMode: false,
        colors: true,
        jsonOutput: false,
    },
    debug: false,
};

class ConfigManager {
    private config: PBConfig = { ...DEFAULT_CONFIG };
    private loaded = false;

    /**
     * Ensure the .pb directory exists
     */
    private async ensureDir(): Promise<void> {
        await fs.ensureDir(PB_DIR);
    }

    /**
     * Load configuration from disk
     */
    async load(): Promise<PBConfig> {
        if (this.loaded) {
            return this.config;
        }

        try {
            await this.ensureDir();
            
            if (await fs.pathExists(CONFIG_FILE)) {
                const fileConfig = await fs.readJson(CONFIG_FILE);
                this.config = this.mergeConfig(DEFAULT_CONFIG, fileConfig);
            } else {
                this.config = { ...DEFAULT_CONFIG };
            }
            
            this.loaded = true;
        } catch (error) {
            logger.debug(`Failed to load config: ${error}`);
            this.config = { ...DEFAULT_CONFIG };
        }

        return this.config;
    }

    /**
     * Save configuration to disk
     */
    async save(): Promise<void> {
        try {
            await this.ensureDir();
            await fs.writeJson(CONFIG_FILE, this.config, { spaces: 2 });
        } catch (error) {
            logger.debug(`Failed to save config: ${error}`);
            throw new Error('Failed to save configuration');
        }
    }

    /**
     * Get current configuration
     */
    get(): PBConfig {
        return this.config;
    }

    /**
     * Get a specific config value by path
     */
    getValue<T>(path: string): T | undefined {
        const parts = path.split('.');
        let current: any = this.config;
        
        for (const part of parts) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = current[part];
        }
        
        return current as T;
    }

    /**
     * Set a specific config value by path
     */
    async setValue(path: string, value: any): Promise<void> {
        const parts = path.split('.');
        let current: any = this.config;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current)) {
                current[part] = {};
            }
            current = current[part];
        }
        
        current[parts[parts.length - 1]] = value;
        await this.save();
    }

    /**
     * Reset configuration to defaults
     */
    async reset(): Promise<void> {
        this.config = { ...DEFAULT_CONFIG };
        await this.save();
    }

    /**
     * Deep merge two config objects
     */
    private mergeConfig(defaults: any, overrides: any): any {
        const result = { ...defaults };
        
        for (const key of Object.keys(overrides)) {
            if (
                typeof overrides[key] === 'object' &&
                overrides[key] !== null &&
                !Array.isArray(overrides[key]) &&
                key in defaults &&
                typeof defaults[key] === 'object'
            ) {
                result[key] = this.mergeConfig(defaults[key], overrides[key]);
            } else {
                result[key] = overrides[key];
            }
        }
        
        return result;
    }

    /**
     * Get config file path
     */
    getConfigPath(): string {
        return CONFIG_FILE;
    }

    /**
     * Check if config file exists
     */
    async exists(): Promise<boolean> {
        return fs.pathExists(CONFIG_FILE);
    }
}

// Singleton instance
export const configManager = new ConfigManager();

// Export default config for reference
export { DEFAULT_CONFIG };
