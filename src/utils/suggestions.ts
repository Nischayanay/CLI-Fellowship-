/**
 * Command Suggestion System
 * Provides "Did you mean?" suggestions for mistyped commands
 */

import colors from './colors';

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score (0-1, higher is more similar)
 */
function similarityScore(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

/**
 * Available PBCLI commands
 */
const AVAILABLE_COMMANDS = [
  'login',
  'logout',
  'whoami',
  'enhance',
  'devsync',
  'init',
  'config',
  'quota',
  'usage',
  'health',
  'doctor',
  'update',
  'link',
  'api',
  'billing',
  'lib',
];

/**
 * Find similar commands for a mistyped command
 */
export function findSimilarCommands(input: string, threshold = 0.6): string[] {
  const suggestions: Array<{ command: string; score: number }> = [];

  for (const command of AVAILABLE_COMMANDS) {
    const score = similarityScore(input, command);
    if (score >= threshold) {
      suggestions.push({ command, score });
    }
  }

  // Sort by similarity score (highest first)
  suggestions.sort((a, b) => b.score - a.score);

  // Return top 3 suggestions
  return suggestions.slice(0, 3).map(s => s.command);
}

/**
 * Display "Did you mean?" suggestion
 */
export function displaySuggestion(input: string): void {
  const suggestions = findSimilarCommands(input);

  if (suggestions.length === 0) {
    return;
  }

  console.log('');
  console.log(colors.error(`Command not found: ${input}`));
  console.log('');

  if (suggestions.length === 1) {
    console.log(colors.primary('Did you mean: ') + colors.highlight(suggestions[0]) + '?');
  } else {
    console.log(colors.primary('Did you mean one of these?'));
    suggestions.forEach(cmd => {
      console.log(colors.dim('  • ') + colors.highlight(cmd));
    });
  }

  console.log('');
  console.log(colors.dim('Run ') + colors.code('pb --help') + colors.dim(' to see all commands'));
  console.log('');
}

/**
 * Get command description
 */
export function getCommandDescription(command: string): string {
  const descriptions: Record<string, string> = {
    login: 'Login to your PromptBrain account',
    logout: 'Logout from PromptBrain',
    whoami: 'Display current user information',
    enhance: 'Enhance a prompt using the Context Engine',
    devsync: 'Get coding context for your current development task',
    init: 'Initialize PromptBrain in the current project',
    config: 'View or modify PBCLI configuration',
    quota: 'Check quota limits for your plan',
    usage: 'Check API usage and limits',
    health: 'Check the health of the CLI and connection',
    doctor: 'Run diagnostics to check PBCLI health',
    update: 'Update PBCLI to the latest version',
    link: 'Link external tools (ChatGPT, Cursor, Figma, Notion)',
    api: 'Manage API keys for authentication',
    billing: 'Open the billing portal in your browser',
    lib: 'Manage user templates',
  };

  return descriptions[command] || 'No description available';
}

/**
 * Get related commands
 */
export function getRelatedCommands(command: string): string[] {
  const related: Record<string, string[]> = {
    login: ['logout', 'whoami', 'api'],
    logout: ['login', 'whoami'],
    whoami: ['login', 'quota', 'usage'],
    enhance: ['devsync', 'init', 'lib'],
    devsync: ['enhance', 'init'],
    init: ['enhance', 'devsync', 'config'],
    config: ['init', 'doctor'],
    quota: ['usage', 'billing', 'whoami'],
    usage: ['quota', 'billing'],
    health: ['doctor', 'update'],
    doctor: ['health', 'update', 'config'],
    update: ['doctor', 'health'],
    link: ['init', 'enhance'],
    api: ['login', 'whoami'],
    billing: ['quota', 'usage'],
    lib: ['enhance', 'devsync'],
  };

  return related[command] || [];
}

export default {
  findSimilarCommands,
  displaySuggestion,
  getCommandDescription,
  getRelatedCommands,
};
