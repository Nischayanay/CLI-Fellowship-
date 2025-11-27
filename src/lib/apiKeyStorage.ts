import keytar from 'keytar';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { logger } from '../utils/logger';

const SERVICE_NAME = 'promptbrain-cli';
const API_KEY_ACCOUNT = 'api-key';
const CONFIG_DIR = path.join(os.homedir(), '.promptbrain');
const API_KEYS_FILE = path.join(CONFIG_DIR, 'api-keys.json');

interface StoredApiKey {
    id: string;
    key_encrypted: string;
    created_at: string;
    last_used?: string;
}

/**
 * Get machine-specific encryption key
 */
export const getMachineKey = (): string => {
    const machineId = os.hostname() + os.platform() + os.arch();
    return crypto.createHash('sha256').update(machineId).digest('hex');
};

/**
 * Encrypt API key for filesystem storage
 */
export const encryptKey = (key: string): string => {
    const algorithm = 'aes-256-cbc';
    const machineKey = getMachineKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        algorithm,
        Buffer.from(machineKey, 'hex').slice(0, 32),
        iv
    );
    
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt API key from filesystem storage
 */
export const decryptKey = (encryptedKey: string): string => {
    const algorithm = 'aes-256-cbc';
    const machineKey = getMachineKey();
    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(machineKey, 'hex').slice(0, 32),
        iv
    );
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};

export const apiKeyStorage = {
    /**
     * Store API key in both keytar and encrypted filesystem
     */
    storeKey: async (id: string, key: string): Promise<void> => {
        try {
            // Store in keytar
            await keytar.setPassword(SERVICE_NAME, API_KEY_ACCOUNT, key);
            logger.debug('[Storage] API key stored in keytar');
        } catch (error: any) {
            logger.debug(`[Storage] Keytar storage failed: ${error.message}`);
            // Continue to filesystem storage
        }
        
        // Store encrypted backup in filesystem
        try {
            await fs.ensureDir(CONFIG_DIR);
            const encrypted = encryptKey(key);
            const stored: StoredApiKey = {
                id,
                key_encrypted: encrypted,
                created_at: new Date().toISOString(),
            };
            
            await fs.writeJson(API_KEYS_FILE, stored, { spaces: 2, mode: 0o600 });
            
            // Ensure file permissions are correct (some systems don't respect mode in writeJson)
            await fs.chmod(API_KEYS_FILE, 0o600);
            
            logger.debug('[Storage] API key stored in filesystem (encrypted)');
        } catch (error: any) {
            logger.debug(`[Storage] Filesystem storage failed: ${error.message}`);
            throw new Error('Failed to store API key securely');
        }
    },
    
    /**
     * Get active API key (try keytar first, fallback to filesystem)
     */
    getActiveKey: async (): Promise<string | null> => {
        // Try keytar first
        try {
            const key = await keytar.getPassword(SERVICE_NAME, API_KEY_ACCOUNT);
            if (key) {
                logger.debug('[Storage] API key loaded from keytar');
                return key;
            }
        } catch (error: any) {
            logger.debug(`[Storage] Keytar retrieval failed: ${error.message}`);
            // Fallback to filesystem
        }
        
        // Fallback to filesystem
        try {
            if (await fs.pathExists(API_KEYS_FILE)) {
                const stored: StoredApiKey = await fs.readJson(API_KEYS_FILE);
                const key = decryptKey(stored.key_encrypted);
                logger.debug('[Storage] API key loaded from filesystem');
                return key;
            }
        } catch (error: any) {
            logger.debug(`[Storage] Filesystem retrieval failed: ${error.message}`);
        }
        
        return null;
    },
    
    /**
     * Remove active API key from both storages
     */
    removeActiveKey: async (): Promise<void> => {
        let keytarRemoved = false;
        let filesystemRemoved = false;
        
        // Remove from keytar
        try {
            const removed = await keytar.deletePassword(SERVICE_NAME, API_KEY_ACCOUNT);
            if (removed) {
                keytarRemoved = true;
                logger.debug('[Storage] API key removed from keytar');
            }
        } catch (error: any) {
            logger.debug(`[Storage] Keytar removal failed: ${error.message}`);
        }
        
        // Remove from filesystem
        try {
            if (await fs.pathExists(API_KEYS_FILE)) {
                await fs.remove(API_KEYS_FILE);
                filesystemRemoved = true;
                logger.debug('[Storage] API key removed from filesystem');
            }
        } catch (error: any) {
            logger.debug(`[Storage] Filesystem removal failed: ${error.message}`);
        }
        
        if (!keytarRemoved && !filesystemRemoved) {
            logger.debug('[Storage] No API key found to remove');
        }
    },
    
    /**
     * Get stored API key metadata
     */
    getKeyMetadata: async (): Promise<{ id: string; created_at: string } | null> => {
        try {
            if (await fs.pathExists(API_KEYS_FILE)) {
                const stored: StoredApiKey = await fs.readJson(API_KEYS_FILE);
                return {
                    id: stored.id,
                    created_at: stored.created_at,
                };
            }
        } catch (error: any) {
            logger.debug(`[Storage] Failed to read metadata: ${error.message}`);
        }
        return null;
    },
};
