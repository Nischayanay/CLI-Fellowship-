import clipboardy from 'clipboardy';
import colors from './colors';
import boxes from './boxes';

/**
 * Premium clipboard utility with amber-themed notifications
 */
export class ClipboardManager {
  /**
   * Copy enhanced prompt to clipboard with premium notification
   */
  static async copyEnhancedPrompt(prompt: string, showNotification: boolean = true): Promise<boolean> {
    try {
      await clipboardy.write(prompt);
      
      if (showNotification) {
        this.showCopySuccessNotification(prompt);
      }
      
      return true;
    } catch (error) {
      if (showNotification) {
        this.showCopyErrorNotification(error);
      }
      return false;
    }
  }

  /**
   * Show premium amber-themed success notification
   */
  private static showCopySuccessNotification(prompt: string): void {
    const previewLength = 60;
    const preview = prompt.length > previewLength 
      ? prompt.substring(0, previewLength) + '...'
      : prompt;

    console.log('');
    console.log(boxes.success(
      `✨ Enhanced prompt copied to clipboard!\n\n` +
      `${colors.dim('Preview:')} ${colors.neutral(preview)}\n\n` +
      `${colors.primary('Ready to paste:')} Ctrl+V (Windows/Linux) or Cmd+V (Mac)\n` +
      `${colors.dim('Length:')} ${prompt.length} characters`,
      '📋 Clipboard Ready'
    ));
  }

  /**
   * Show premium error notification
   */
  private static showCopyErrorNotification(error: any): void {
    console.log('');
    console.log(boxes.warning(
      `Failed to copy to clipboard: ${error?.message || 'Unknown error'}\n\n` +
      `${colors.dim('Manual copy:')} Select and copy the enhanced prompt above\n` +
      `${colors.dim('Alternative:')} Use --no-copy flag to disable auto-copy`,
      '⚠️ Clipboard Error'
    ));
  }

  /**
   * Check if clipboard is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      await clipboardy.read();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Show clipboard status in premium format
   */
  static async showStatus(): Promise<void> {
    const available = await this.isAvailable();
    
    if (available) {
      console.log(colors.success('📋 Clipboard: Available'));
    } else {
      console.log(colors.warning('📋 Clipboard: Not available'));
    }
  }

  /**
   * Copy with retry mechanism for reliability
   */
  static async copyWithRetry(text: string, maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await clipboardy.write(text);
        return true;
      } catch (error) {
        if (attempt === maxRetries) {
          console.log(colors.dim(`Clipboard copy failed after ${maxRetries} attempts`));
          return false;
        }
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    return false;
  }

  /**
   * Smart copy with platform detection
   */
  static async smartCopy(text: string): Promise<{ success: boolean; method: string }> {
    // Try primary clipboard first
    try {
      await clipboardy.write(text);
      return { success: true, method: 'primary' };
    } catch (primaryError) {
      // Fallback to retry mechanism
      const retrySuccess = await this.copyWithRetry(text, 2);
      if (retrySuccess) {
        return { success: true, method: 'retry' };
      }
      
      return { success: false, method: 'failed' };
    }
  }

  /**
   * Get clipboard content preview for debugging
   */
  static async getPreview(): Promise<string> {
    try {
      const content = await clipboardy.read();
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    } catch {
      return 'Unable to read clipboard';
    }
  }
}

export default ClipboardManager;