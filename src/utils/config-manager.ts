import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.promptbrain');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface UserConfig {
    name?: string;
    email?: string;
    plan?: string;
}

export const configManager = {
    ensureConfigDir: async () => {
        await fs.ensureDir(CONFIG_DIR);
    },
    writeConfig: async (config: UserConfig) => {
        await configManager.ensureConfigDir();
        const existing = await configManager.readConfig();
        await fs.writeJson(CONFIG_FILE, { ...existing, ...config }, { spaces: 2 });
    },
    readConfig: async (): Promise<UserConfig> => {
        try {
            return await fs.readJson(CONFIG_FILE);
        } catch (error) {
            return {};
        }
    },
    clearConfig: async () => {
        await fs.remove(CONFIG_FILE);
    }
};
