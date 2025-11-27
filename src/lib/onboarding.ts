/**
 * User Onboarding System
 * First-run experience for new PBCLI users
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import colors from '../utils/colors';
import sigil from '../utils/sigil';
import ui from '../utils/ui';

const ONBOARDING_FILE = path.join(os.homedir(), '.pb', 'onboarding.json');

interface OnboardingState {
  completed: boolean;
  completedAt?: string;
  skipped: boolean;
  version: string;
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    if (!await fs.pathExists(ONBOARDING_FILE)) {
      return false;
    }

    const state: OnboardingState = await fs.readJson(ONBOARDING_FILE);
    return state.completed || state.skipped;
  } catch (error) {
    return false;
  }
}

/**
 * Mark onboarding as completed
 */
export async function markOnboardingComplete(): Promise<void> {
  const state: OnboardingState = {
    completed: true,
    completedAt: new Date().toISOString(),
    skipped: false,
    version: '0.1.0',
  };

  await fs.ensureDir(path.dirname(ONBOARDING_FILE));
  await fs.writeJson(ONBOARDING_FILE, state, { spaces: 2 });
}

/**
 * Mark onboarding as skipped
 */
export async function markOnboardingSkipped(): Promise<void> {
  const state: OnboardingState = {
    completed: false,
    skipped: true,
    version: '0.1.0',
  };

  await fs.ensureDir(path.dirname(ONBOARDING_FILE));
  await fs.writeJson(ONBOARDING_FILE, state, { spaces: 2 });
}

/**
 * Display welcome message
 */
export function displayWelcome(): void {
  console.log('');
  sigil.show({ color: true, size: 'normal' });
  console.log(colors.heading('Welcome to PromptBrain CLI! 🎉'));
  console.log('');
  console.log(colors.neutral('The intelligent CLI for AI-powered development'));
  console.log('');
}

/**
 * Display onboarding flow
 */
export async function runOnboarding(): Promise<void> {
  displayWelcome();

  console.log(colors.primary('Let\'s get you started with PBCLI'));
  console.log('');

  // Step 1: Authentication
  console.log(colors.heading('Step 1: Authentication'));
  console.log('');
  console.log(colors.neutral('To use PBCLI, you need to authenticate:'));
  console.log('');
  console.log(colors.dim('  • ') + colors.highlight('pb login') + colors.dim(' - Login with your PromptBrain account'));
  console.log(colors.dim('  • ') + colors.highlight('pb api key create') + colors.dim(' - Create an API key for CI/CD'));
  console.log('');

  // Step 2: Link Tools
  console.log(colors.heading('Step 2: Link Your Tools (Optional)'));
  console.log('');
  console.log(colors.neutral('Connect PBCLI to your favorite tools:'));
  console.log('');
  console.log(colors.dim('  • ') + colors.highlight('pb link chatgpt') + colors.dim(' - Import ChatGPT conversations'));
  console.log(colors.dim('  • ') + colors.highlight('pb link cursor') + colors.dim(' - Sync Cursor context'));
  console.log(colors.dim('  • ') + colors.highlight('pb link figma') + colors.dim(' - Connect Figma designs'));
  console.log(colors.dim('  • ') + colors.highlight('pb link notion') + colors.dim(' - Link Notion workspace'));
  console.log('');

  // Step 3: Initialize Project
  console.log(colors.heading('Step 3: Initialize Your Project'));
  console.log('');
  console.log(colors.neutral('Set up PBCLI in your current project:'));
  console.log('');
  console.log(colors.dim('  • ') + colors.highlight('pb init') + colors.dim(' - Auto-detect frameworks and configure'));
  console.log('');

  // Step 4: Start Using
  console.log(colors.heading('Step 4: Start Enhancing'));
  console.log('');
  console.log(colors.neutral('Try these commands:'));
  console.log('');
  console.log(colors.dim('  • ') + colors.highlight('pb enhance "your prompt"') + colors.dim(' - Enhance any prompt'));
  console.log(colors.dim('  • ') + colors.highlight('pb devsync') + colors.dim(' - Get context for your current task'));
  console.log(colors.dim('  • ') + colors.highlight('pb doctor') + colors.dim(' - Check system health'));
  console.log('');

  // Quick Tips
  ui.divider();
  console.log('');
  console.log(colors.success('✨ Quick Tips'));
  console.log('');
  console.log(colors.dim('  • Run ') + colors.code('pb --help') + colors.dim(' to see all commands'));
  console.log(colors.dim('  • Run ') + colors.code('pb <command> --help') + colors.dim(' for command details'));
  console.log(colors.dim('  • Use ') + colors.code('--json') + colors.dim(' flag for automation'));
  console.log('');

  // Documentation
  console.log(colors.primary('📚 Documentation: ') + colors.highlight('https://promptbrain.io/docs'));
  console.log(colors.primary('💬 Discord: ') + colors.highlight('https://discord.gg/promptbrain'));
  console.log('');

  ui.divider();
  console.log('');
  ui.goodNews('You\'re all set! Start with: pb login');
  console.log('');

  // Mark as completed
  await markOnboardingComplete();
}

/**
 * Show quick start tips
 */
export function showQuickStart(): void {
  console.log('');
  console.log(colors.heading('🚀 Quick Start'));
  console.log('');
  console.log(colors.dim('1. ') + colors.highlight('pb login') + colors.dim(' - Authenticate'));
  console.log(colors.dim('2. ') + colors.highlight('pb init') + colors.dim(' - Initialize project'));
  console.log(colors.dim('3. ') + colors.highlight('pb enhance "prompt"') + colors.dim(' - Enhance prompts'));
  console.log('');
  console.log(colors.dim('Run ') + colors.code('pb --help') + colors.dim(' for all commands'));
  console.log('');
}

/**
 * Check and run onboarding if needed
 */
export async function checkAndRunOnboarding(): Promise<void> {
  const completed = await hasCompletedOnboarding();
  
  if (!completed) {
    await runOnboarding();
  }
}
