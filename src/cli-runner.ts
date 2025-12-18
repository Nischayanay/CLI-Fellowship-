#!/usr/bin/env node

import { run } from '@oclif/core';
import Banner from './utils/banner';
import colors from './utils/colors';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Premium PromptBrain CLI Runner
 * Handles startup experience and command routing
 */
class PromptBrainCLI {
  private version: string = '0.1.6';
  private shouldShowBanner: boolean = true;

  constructor() {
    this.detectVersion();
    this.handleStartup();
  }

  /**
   * Detect version from package.json
   */
  private detectVersion(): void {
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = fs.readJsonSync(packagePath);
        this.version = pkg.version || '0.1.6';
      }
    } catch (error) {
      // Use default version
    }
  }

  /**
   * Handle startup experience
   */
  private handleStartup(): void {
    const args = process.argv.slice(2);
    
    // Don't show banner for help commands or when piping output
    const skipBanner = 
      args.includes('--help') || 
      args.includes('-h') ||
      args.includes('--version') ||
      args.includes('-v') ||
      !process.stdout.isTTY ||
      process.env.CI;

    this.shouldShowBanner = !skipBanner;

    // Show banner for main commands or no args
    if (this.shouldShowBanner && (args.length === 0 || this.isMainCommand(args[0]))) {
      this.showStartupExperience();
    }
  }

  /**
   * Check if command should show banner
   */
  private isMainCommand(command: string): boolean {
    const mainCommands = [
      'enhance', 'init', 'devsync', 'login', 'signup', 
      'link', 'doctor', 'config', 'whoami'
    ];
    return mainCommands.includes(command);
  }

  /**
   * Show premium startup experience
   */
  private showStartupExperience(): void {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // Full banner for no arguments
      Banner.showStartup(this.version);
      this.showQuickStart();
    } else {
      // Command-specific banner
      const command = args[0];
      const descriptions: Record<string, string> = {
        enhance: 'AI-powered prompt enhancement with context intelligence',
        init: 'Initialize PromptBrain in your project with smart analysis',
        devsync: 'Sync development context across all your tools',
        login: 'Authenticate with your PromptBrain account',
        signup: 'Create your PromptBrain developer account',
        link: 'Connect external tools for richer context',
        doctor: 'Diagnose and fix PromptBrain configuration issues',
        config: 'Manage PromptBrain CLI configuration',
        whoami: 'Display current user and session information',
      };
      
      const description = descriptions[command] || 'PromptBrain CLI command';
      Banner.showCommand(command, description);
    }
  }

  /**
   * Show quick start guide
   */
  private showQuickStart(): void {
    const quickCommands = [
      { name: 'pb init', description: 'Initialize PromptBrain in your project' },
      { name: 'pb enhance "prompt"', description: 'Enhance any prompt with AI context' },
      { name: 'pb devsync', description: 'Get context for your current task' },
      { name: 'pb link notion', description: 'Connect Notion for richer context' },
      { name: 'pb doctor', description: 'Check system health and configuration' },
    ];

    Banner.showQuickHelp(quickCommands);

    // Show session info if logged in
    this.showSessionStatus();

    // Premium tip
    Banner.showTip('Use --help with any command for detailed information and examples');
  }

  /**
   * Show current session status
   */
  private showSessionStatus(): void {
    try {
      // Try to detect if user is logged in and show session info
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      const configPath = path.join(homeDir, '.promptbrain', 'session.json');
      
      if (fs.existsSync(configPath)) {
        const session = fs.readJsonSync(configPath);
        if (session.user) {
          Banner.showSessionInfo({
            user: session.user.email || session.user.username,
            project: this.detectCurrentProject(),
            context: 'Ready',
          });
        }
      }
    } catch (error) {
      // Silently handle errors - session info is optional
    }
  }

  /**
   * Detect current project name
   */
  private detectCurrentProject(): string {
    try {
      const cwd = process.cwd();
      const packagePath = path.join(cwd, 'package.json');
      
      if (fs.existsSync(packagePath)) {
        const pkg = fs.readJsonSync(packagePath);
        return pkg.name || path.basename(cwd);
      }
      
      return path.basename(cwd);
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Run the CLI
   */
  async run(): Promise<void> {
    try {
      await run();
    } catch (error: any) {
      // Enhanced error handling with premium styling
      if (error.oclif?.exit !== 0) {
        const suggestions = [
          'Check your command syntax with --help',
          'Ensure you\'re logged in with: pb login',
          'Run: pb doctor to diagnose issues',
        ];
        
        Banner.showError(error.message || 'An unexpected error occurred', suggestions);
      }
      
      process.exit(error.oclif?.exit ?? 1);
    }
  }
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const cli = new PromptBrainCLI();
  await cli.run();
}

// Handle unhandled rejections gracefully
process.on('unhandledRejection', (error: any) => {
  console.error(colors.error('Unhandled error:'), error.message || error);
  process.exit(1);
});

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  console.log('\n' + colors.warning('Operation cancelled by user'));
  process.exit(0);
});

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    console.error(colors.error('Fatal error:'), error.message || error);
    process.exit(1);
  });
}

export { PromptBrainCLI, main };