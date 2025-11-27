/**
 * Progress Tracker
 * 
 * Provides real-time progress feedback for long-running operations
 * like ingestion, sync, and bulk processing.
 */

import chalk from 'chalk';
import { logger } from '../utils/logger';

export interface ProgressUpdate {
    phase: string;
    current: number;
    total: number;
    message: string;
    percentage: number;
    startTime: number;
    elapsedMs: number;
    estimatedRemainingMs?: number;
}

type ProgressCallback = (progress: ProgressUpdate) => void;

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const UPDATE_THROTTLE_MS = 100; // Minimum time between updates

class ProgressTracker {
    private phase: string = '';
    private current: number = 0;
    private total: number = 0;
    private message: string = '';
    private startTime: number = 0;
    private spinnerFrame: number = 0;
    private spinnerInterval: NodeJS.Timeout | null = null;
    private lastUpdateTime: number = 0;
    private callbacks: ProgressCallback[] = [];
    private isActive: boolean = false;

    /**
     * Start tracking progress
     */
    start(message: string, total: number = 0): void {
        this.phase = 'starting';
        this.current = 0;
        this.total = total;
        this.message = message;
        this.startTime = Date.now();
        this.isActive = true;

        this.startSpinner();
        this.render();
    }

    /**
     * Update progress
     */
    update(current: number, total?: number, message?: string, phase?: string): void {
        if (!this.isActive) return;

        const now = Date.now();
        if (now - this.lastUpdateTime < UPDATE_THROTTLE_MS) {
            return; // Throttle updates
        }
        this.lastUpdateTime = now;

        this.current = current;
        if (total !== undefined) this.total = total;
        if (message !== undefined) this.message = message;
        if (phase !== undefined) this.phase = phase;

        this.render();
        this.notifyCallbacks();
    }

    /**
     * Set the current phase
     */
    setPhase(phase: string, message?: string): void {
        this.phase = phase;
        if (message) this.message = message;
        this.render();
    }

    /**
     * Increment progress by 1
     */
    increment(message?: string): void {
        this.update(this.current + 1, undefined, message);
    }

    /**
     * Mark progress as successful
     */
    succeed(message: string): void {
        this.stopSpinner();
        this.isActive = false;
        this.clearLine();
        console.log(chalk.green('✔') + ' ' + message);
    }

    /**
     * Mark progress as failed
     */
    fail(message: string): void {
        this.stopSpinner();
        this.isActive = false;
        this.clearLine();
        console.log(chalk.red('✖') + ' ' + message);
    }

    /**
     * Mark progress as warning
     */
    warn(message: string): void {
        this.stopSpinner();
        this.isActive = false;
        this.clearLine();
        console.log(chalk.yellow('⚠') + ' ' + message);
    }

    /**
     * Stop tracking without success/fail message
     */
    stop(): void {
        this.stopSpinner();
        this.isActive = false;
        this.clearLine();
    }

    /**
     * Register callback for progress updates
     */
    onProgress(callback: ProgressCallback): void {
        this.callbacks.push(callback);
    }

    /**
     * Remove all callbacks
     */
    clearCallbacks(): void {
        this.callbacks = [];
    }

    /**
     * Get current progress state
     */
    getProgress(): ProgressUpdate {
        const elapsedMs = Date.now() - this.startTime;
        const percentage = this.total > 0 ? Math.round((this.current / this.total) * 100) : 0;
        
        let estimatedRemainingMs: number | undefined;
        if (this.current > 0 && this.total > 0) {
            const msPerItem = elapsedMs / this.current;
            const remaining = this.total - this.current;
            estimatedRemainingMs = Math.round(msPerItem * remaining);
        }

        return {
            phase: this.phase,
            current: this.current,
            total: this.total,
            message: this.message,
            percentage,
            startTime: this.startTime,
            elapsedMs,
            estimatedRemainingMs
        };
    }

    /**
     * Start the spinner animation
     */
    private startSpinner(): void {
        if (this.spinnerInterval) return;
        
        this.spinnerInterval = setInterval(() => {
            this.spinnerFrame = (this.spinnerFrame + 1) % SPINNER_FRAMES.length;
            this.render();
        }, 80);
    }

    /**
     * Stop the spinner animation
     */
    private stopSpinner(): void {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;
        }
    }

    /**
     * Clear the current line
     */
    private clearLine(): void {
        if (process.stdout.isTTY) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        }
    }

    /**
     * Render the progress display
     */
    private render(): void {
        if (!process.stdout.isTTY) {
            // Non-TTY: just log updates occasionally
            return;
        }

        this.clearLine();

        const spinner = chalk.cyan(SPINNER_FRAMES[this.spinnerFrame]);
        const progress = this.getProgress();
        
        let output = `${spinner} `;

        // Add phase if set
        if (this.phase) {
            output += chalk.dim(`[${this.phase}] `);
        }

        // Add message
        output += this.message;

        // Add progress bar if we have a total
        if (this.total > 0) {
            const barWidth = 20;
            const filled = Math.round((this.current / this.total) * barWidth);
            const empty = barWidth - filled;
            const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
            output += ` ${bar} ${progress.percentage}%`;
            output += chalk.dim(` (${this.current}/${this.total})`);
        }

        // Add ETA if available
        if (progress.estimatedRemainingMs && progress.estimatedRemainingMs > 1000) {
            const etaSeconds = Math.round(progress.estimatedRemainingMs / 1000);
            if (etaSeconds < 60) {
                output += chalk.dim(` ~${etaSeconds}s remaining`);
            } else {
                const minutes = Math.floor(etaSeconds / 60);
                const seconds = etaSeconds % 60;
                output += chalk.dim(` ~${minutes}m ${seconds}s remaining`);
            }
        }

        process.stdout.write(output);
    }

    /**
     * Notify all registered callbacks
     */
    private notifyCallbacks(): void {
        const progress = this.getProgress();
        this.callbacks.forEach(cb => cb(progress));
    }
}

/**
 * Create a simple progress tracker for a specific operation
 */
export function createProgressTracker(operation: string): ProgressTracker {
    const tracker = new ProgressTracker();
    return tracker;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format bytes in human-readable format
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Export singleton for simple use cases
export const progressTracker = new ProgressTracker();

// Export class for creating multiple trackers
export { ProgressTracker };
