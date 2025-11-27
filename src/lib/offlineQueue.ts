/**
 * Offline Queue Manager
 * 
 * Manages queued operations when the CLI is offline.
 * Operations are persisted to disk and processed when connectivity is restored.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { checkConnectivity } from './apiClient';

const PB_DIR = path.join(os.homedir(), '.pb');
const QUEUE_FILE = path.join(PB_DIR, 'queue.json');
const MAX_QUEUE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_QUEUE_SIZE = 100;
const CONNECTIVITY_CHECK_INTERVAL = 30000; // 30 seconds

export interface QueuedOperation {
    id: string;
    method: string;
    path: string;
    body?: any;
    timestamp: number;
    retries: number;
    priority: 'high' | 'normal' | 'low';
    metadata?: Record<string, any>;
}

export interface QueueStatus {
    count: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
    totalSize: number;
}

export interface ProcessResult {
    operation: QueuedOperation;
    success: boolean;
    error?: string;
    response?: any;
}

type ConnectivityCallback = () => void;
type QueueProcessedCallback = (results: ProcessResult[]) => void;

class OfflineQueueManager {
    private queue: QueuedOperation[] = [];
    private isProcessing = false;
    private connectivityCallbacks: ConnectivityCallback[] = [];
    private queueProcessedCallbacks: QueueProcessedCallback[] = [];
    private connectivityCheckInterval: NodeJS.Timeout | null = null;
    private wasOffline = false;

    constructor() {
        this.loadQueue();
    }

    /**
     * Ensure the .pb directory exists
     */
    private async ensureDir(): Promise<void> {
        await fs.ensureDir(PB_DIR);
    }

    /**
     * Load queue from disk
     */
    private async loadQueue(): Promise<void> {
        try {
            await this.ensureDir();
            if (await fs.pathExists(QUEUE_FILE)) {
                const data = await fs.readJson(QUEUE_FILE);
                this.queue = Array.isArray(data) ? data : [];
                // Clean up expired operations
                await this.cleanupExpired();
            }
        } catch (error) {
            logger.debug(`Failed to load queue: ${error}`);
            this.queue = [];
        }
    }

    /**
     * Save queue to disk
     */
    private async saveQueue(): Promise<void> {
        try {
            await this.ensureDir();
            await fs.writeJson(QUEUE_FILE, this.queue, { spaces: 2 });
        } catch (error) {
            logger.debug(`Failed to save queue: ${error}`);
        }
    }

    /**
     * Remove expired operations from queue
     */
    private async cleanupExpired(): Promise<number> {
        const now = Date.now();
        const originalLength = this.queue.length;
        this.queue = this.queue.filter(op => (now - op.timestamp) < MAX_QUEUE_AGE_MS);
        const removed = originalLength - this.queue.length;
        if (removed > 0) {
            await this.saveQueue();
            logger.debug(`Cleaned up ${removed} expired queue operations`);
        }
        return removed;
    }

    /**
     * Check if an operation is a duplicate
     */
    private isDuplicate(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): boolean {
        return this.queue.some(op => 
            op.method === operation.method && 
            op.path === operation.path &&
            JSON.stringify(op.body) === JSON.stringify(operation.body)
        );
    }

    /**
     * Add an operation to the queue
     */
    async enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
        // Check for duplicates
        if (this.isDuplicate(operation)) {
            logger.debug(`Duplicate operation skipped: ${operation.method} ${operation.path}`);
            const existing = this.queue.find(op => 
                op.method === operation.method && 
                op.path === operation.path &&
                JSON.stringify(op.body) === JSON.stringify(operation.body)
            );
            return existing?.id || '';
        }

        // Check queue size limit
        if (this.queue.length >= MAX_QUEUE_SIZE) {
            // Remove oldest low-priority operation
            const lowPriorityIndex = this.queue.findIndex(op => op.priority === 'low');
            if (lowPriorityIndex !== -1) {
                this.queue.splice(lowPriorityIndex, 1);
            } else {
                // Remove oldest operation
                this.queue.shift();
            }
        }

        const queuedOp: QueuedOperation = {
            ...operation,
            id: uuidv4(),
            timestamp: Date.now(),
            retries: 0,
            priority: operation.priority || 'normal'
        };

        this.queue.push(queuedOp);
        await this.saveQueue();
        
        logger.debug(`Queued operation: ${queuedOp.method} ${queuedOp.path} (id: ${queuedOp.id})`);
        return queuedOp.id;
    }

    /**
     * Remove and return the next operation from the queue
     */
    async dequeue(): Promise<QueuedOperation | null> {
        // Sort by priority (high first) then by timestamp (oldest first)
        this.queue.sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return a.timestamp - b.timestamp;
        });

        const operation = this.queue.shift();
        if (operation) {
            await this.saveQueue();
        }
        return operation || null;
    }

    /**
     * Process all queued operations
     */
    async processAll(
        processor: (op: QueuedOperation) => Promise<any>
    ): Promise<ProcessResult[]> {
        if (this.isProcessing) {
            logger.debug('Queue processing already in progress');
            return [];
        }

        this.isProcessing = true;
        const results: ProcessResult[] = [];

        try {
            // Clean up expired first
            await this.cleanupExpired();

            // Process in batches of 10
            const batchSize = 10;
            while (this.queue.length > 0) {
                const batch = this.queue.splice(0, Math.min(batchSize, this.queue.length));
                
                for (const operation of batch) {
                    try {
                        const response = await processor(operation);
                        results.push({
                            operation,
                            success: true,
                            response
                        });
                        logger.debug(`Processed queued operation: ${operation.method} ${operation.path}`);
                    } catch (error: any) {
                        operation.retries++;
                        
                        // Re-queue if retries not exhausted
                        if (operation.retries < 3) {
                            this.queue.push(operation);
                            logger.debug(`Re-queued operation after failure: ${operation.method} ${operation.path} (retry ${operation.retries})`);
                        }
                        
                        results.push({
                            operation,
                            success: false,
                            error: error.message || 'Unknown error'
                        });
                    }
                }

                await this.saveQueue();
            }

            // Notify callbacks
            this.queueProcessedCallbacks.forEach(cb => cb(results));

        } finally {
            this.isProcessing = false;
        }

        return results;
    }

    /**
     * Clear all queued operations
     */
    async clear(): Promise<void> {
        this.queue = [];
        await this.saveQueue();
        logger.debug('Queue cleared');
    }

    /**
     * Get queue status
     */
    async getStatus(): Promise<QueueStatus> {
        await this.cleanupExpired();
        
        const timestamps = this.queue.map(op => op.timestamp);
        
        return {
            count: this.queue.length,
            oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null,
            newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : null,
            totalSize: JSON.stringify(this.queue).length
        };
    }

    /**
     * Get all queued operations (for display)
     */
    getOperations(): QueuedOperation[] {
        return [...this.queue];
    }

    /**
     * Register callback for connectivity restoration
     */
    onConnectivityRestored(callback: ConnectivityCallback): void {
        this.connectivityCallbacks.push(callback);
    }

    /**
     * Register callback for queue processed
     */
    onQueueProcessed(callback: QueueProcessedCallback): void {
        this.queueProcessedCallbacks.push(callback);
    }

    /**
     * Start monitoring connectivity
     */
    startConnectivityMonitor(): void {
        if (this.connectivityCheckInterval) return;

        this.connectivityCheckInterval = setInterval(async () => {
            const isOnline = await checkConnectivity(true);
            
            if (isOnline && this.wasOffline) {
                logger.debug('Connectivity restored');
                this.connectivityCallbacks.forEach(cb => cb());
            }
            
            this.wasOffline = !isOnline;
        }, CONNECTIVITY_CHECK_INTERVAL);
    }

    /**
     * Stop monitoring connectivity
     */
    stopConnectivityMonitor(): void {
        if (this.connectivityCheckInterval) {
            clearInterval(this.connectivityCheckInterval);
            this.connectivityCheckInterval = null;
        }
    }

    /**
     * Check if queue has pending operations
     */
    hasPendingOperations(): boolean {
        return this.queue.length > 0;
    }
}

// Singleton instance
export const offlineQueue = new OfflineQueueManager();
