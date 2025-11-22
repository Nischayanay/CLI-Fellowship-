/**
 * Polls a function until a condition is met or timeout occurs
 * @param fn - The function to poll (should return true when condition is met)
 * @param interval - Polling interval in milliseconds
 * @param timeout - Maximum time to poll in milliseconds
 * @returns Promise that resolves when condition is met or rejects on timeout
 */
export async function poll(
    fn: () => Promise<boolean>,
    interval: number = 2000,
    timeout: number = 300000 // 5 minutes default
): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const intervalId = setInterval(async () => {
            try {
                const result = await fn();

                if (result) {
                    clearInterval(intervalId);
                    resolve();
                    return;
                }

                // Check timeout
                if (Date.now() - startTime > timeout) {
                    clearInterval(intervalId);
                    reject(new Error('Polling timeout exceeded'));
                }
            } catch (error) {
                clearInterval(intervalId);
                reject(error);
            }
        }, interval);
    });
}
