import { logger } from './logger';

/**
 * Opens a URL in the default browser
 * @param url - The URL to open
 */
export async function openBrowser(url: string): Promise<void> {
    try {
        // Use dynamic import for ES Module compatibility
        const { default: open } = await import('open');
        await open(url);
    } catch (error: any) {
        logger.error(`Failed to open browser: ${error.message}`);
        logger.info(`Please manually open this URL: ${url}`);
        throw error;
    }
}
