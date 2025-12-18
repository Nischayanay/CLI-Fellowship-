import colors from './colors';
import { PALETTE } from './colors';
import chalk from 'chalk';

/**
 * Premium PromptBrain CLI Banner System
 * Creates stunning startup experiences for developers
 */
export class Banner {
  /**
   * Main PromptBrain ASCII art logo
   */
  private static readonly LOGO = `
██████╗ ██████╗  ██████╗ ███╗   ███╗██████╗ ████████╗██████╗ ██████╗  █████╗ ██╗███╗   ██╗
██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║
██████╔╝██████╔╝██║   ██║██╔████╔██║██████╔╝   ██║   ██████╔╝██████╔╝███████║██║██╔██╗ ██║
██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔═══╝    ██║   ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║
██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║██║        ██║   ██████╔╝██║  ██║██║  ██║██║██║ ╚████║
╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝`;

  /**
   * Compact logo for smaller displays
   */
  private static readonly COMPACT_LOGO = `
██████╗ ██████╗ 
██╔══██╗██╔══██╗
██████╔╝██████╔╝
██╔═══╝ ██╔══██╗
██║     ██████╔╝
╚═╝     ╚═════╝ `;

  /**
   * Display the main startup banner
   */
  static showStartup(version?: string): void {
    console.clear();
    
    // Determine terminal width for responsive design
    const terminalWidth = process.stdout.columns || 80;
    const useCompact = terminalWidth < 100;
    
    console.log('');
    
    // Display logo with gradient effect
    const logo = useCompact ? this.COMPACT_LOGO : this.LOGO;
    const logoLines = logo.split('\n').filter(line => line.trim());
    
    logoLines.forEach((line, index) => {
      const ratio = index / (logoLines.length - 1);
      if (ratio < 0.3) {
        console.log(chalk.hex(PALETTE.gradientStart)(line));
      } else if (ratio < 0.7) {
        console.log(chalk.hex(PALETTE.gradientMid)(line));
      } else {
        console.log(chalk.hex(PALETTE.gradientEnd)(line));
      }
    });
    
    console.log('');
    
    // Tagline with premium styling
    const tagline = 'Context across all apps you use';
    const centeredTagline = this.centerText(tagline, terminalWidth);
    console.log(colors.premium(centeredTagline));
    
    console.log('');
    
    // Version and status info
    if (version) {
      const versionText = `v${version}`;
      const centeredVersion = this.centerText(versionText, terminalWidth);
      console.log(colors.metadata(centeredVersion));
    }
    
    console.log('');
    
    // Premium separator
    const separator = '═'.repeat(Math.min(terminalWidth - 4, 80));
    const centeredSeparator = this.centerText(separator, terminalWidth);
    console.log(colors.accent(centeredSeparator));
    
    console.log('');
  }

  /**
   * Display command-specific banners
   */
  static showCommand(commandName: string, description: string): void {
    console.log('');
    
    // Command header with premium styling
    const header = `🚀 ${commandName.toUpperCase()}`;
    console.log(colors.brand(header));
    
    // Description with accent
    console.log(colors.metadata(`   ${description}`));
    
    console.log('');
    
    // Dynamic separator based on content length
    const maxLength = Math.max(header.length, description.length + 3);
    const separator = '─'.repeat(Math.min(maxLength, 60));
    console.log(colors.accent(separator));
    
    console.log('');
  }

  /**
   * Display success celebrations
   */
  static showSuccess(message: string, details?: string[]): void {
    console.log('');
    
    // Success header with animation effect
    const successHeader = '🎉 SUCCESS';
    console.log(colors.success(successHeader));
    
    // Main message
    console.log(colors.highlight(message));
    
    if (details && details.length > 0) {
      console.log('');
      details.forEach(detail => {
        console.log(colors.success(`  ✓ ${detail}`));
      });
    }
    
    console.log('');
    
    // Premium success separator
    const separator = '═'.repeat(50);
    console.log(colors.success(separator));
    
    console.log('');
  }

  /**
   * Display error messages with premium styling
   */
  static showError(message: string, suggestions?: string[]): void {
    console.log('');
    
    // Error header
    const errorHeader = '⚠️  ERROR';
    console.log(colors.error(errorHeader));
    
    // Main error message
    console.log(colors.error(message));
    
    if (suggestions && suggestions.length > 0) {
      console.log('');
      console.log(colors.warning('💡 Suggestions:'));
      suggestions.forEach(suggestion => {
        console.log(colors.metadata(`  • ${suggestion}`));
      });
    }
    
    console.log('');
    
    // Error separator
    const separator = '─'.repeat(50);
    console.log(colors.error(separator));
    
    console.log('');
  }

  /**
   * Display loading states with premium animations
   */
  static showLoading(message: string): NodeJS.Timeout {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;
    
    const interval = setInterval(() => {
      process.stdout.write(`\r${colors.brand(frames[frameIndex])} ${colors.metadata(message)}`);
      frameIndex = (frameIndex + 1) % frames.length;
    }, 100);
    
    return interval;
  }

  /**
   * Display premium progress bars
   */
  static showProgress(current: number, total: number, message: string): void {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((percentage / 100) * barLength);
    
    const filledBar = '█'.repeat(filledLength);
    const emptyBar = '░'.repeat(barLength - filledLength);
    
    const progressBar = colors.brand(filledBar) + colors.dim(emptyBar);
    const percentageText = colors.highlight(`${percentage}%`);
    
    process.stdout.write(`\r${progressBar} ${percentageText} ${colors.metadata(message)}`);
    
    if (current === total) {
      console.log(''); // New line when complete
    }
  }

  /**
   * Display contextual tips with premium styling
   */
  static showTip(tip: string): void {
    console.log('');
    console.log(colors.warning('💡 Pro Tip:'));
    console.log(colors.metadata(`   ${tip}`));
    console.log('');
  }

  /**
   * Display quick help with premium formatting
   */
  static showQuickHelp(commands: Array<{name: string, description: string}>): void {
    console.log('');
    console.log(colors.brand('🚀 Quick Commands:'));
    console.log('');
    
    commands.forEach(cmd => {
      const commandName = colors.highlight(cmd.name.padEnd(15));
      const description = colors.metadata(cmd.description);
      console.log(`  ${commandName} ${description}`);
    });
    
    console.log('');
    console.log(colors.dim('Run any command with --help for detailed information'));
    console.log('');
  }

  /**
   * Center text for the terminal width
   */
  private static centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  /**
   * Create animated text effects
   */
  static animateText(text: string, delay: number = 50): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          process.stdout.write(colors.brand(text[index]));
          index++;
        } else {
          clearInterval(interval);
          console.log(''); // New line
          resolve();
        }
      }, delay);
    });
  }

  /**
   * Display session info with premium styling
   */
  static showSessionInfo(info: {
    user?: string;
    project?: string;
    context?: string;
    uptime?: string;
  }): void {
    console.log('');
    console.log(colors.brand('📊 Session Info:'));
    console.log('');
    
    if (info.user) {
      console.log(`  ${colors.metadata('User:')}     ${colors.highlight(info.user)}`);
    }
    
    if (info.project) {
      console.log(`  ${colors.metadata('Project:')}  ${colors.highlight(info.project)}`);
    }
    
    if (info.context) {
      console.log(`  ${colors.metadata('Context:')}  ${colors.highlight(info.context)}`);
    }
    
    if (info.uptime) {
      console.log(`  ${colors.metadata('Uptime:')}   ${colors.highlight(info.uptime)}`);
    }
    
    console.log('');
  }
}

export default Banner;