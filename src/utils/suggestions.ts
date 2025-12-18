import colors from './colors';

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Available commands in the CLI
 */
const AVAILABLE_COMMANDS = [
  'enhance',
  'init',
  'login',
  'logout',
  'signup',
  'whoami',
  'usage',
  'quota',
  'doctor',
  'config',
  'update',
  'health',
  'devsync',
  'link',
  'billing',
  'api',
  'lib',
];

/**
 * Command suggestions and auto-completion utilities
 */
export const suggestions = {
  /**
   * Find the closest matching command
   */
  findClosestCommand(input: string): string | null {
    const distances = AVAILABLE_COMMANDS.map(cmd => ({
      command: cmd,
      distance: levenshteinDistance(input.toLowerCase(), cmd.toLowerCase()),
    }));

    // Sort by distance
    distances.sort((a, b) => a.distance - b.distance);

    // Only suggest if the distance is reasonable (less than half the command length)
    const closest = distances[0];
    if (closest.distance <= Math.ceil(closest.command.length / 2)) {
      return closest.command;
    }

    return null;
  },

  /**
   * Get fuzzy matches for partial input
   */
  getFuzzyMatches(input: string, limit: number = 5): string[] {
    if (!input) return AVAILABLE_COMMANDS.slice(0, limit);

    const matches = AVAILABLE_COMMANDS
      .filter(cmd => cmd.toLowerCase().includes(input.toLowerCase()))
      .slice(0, limit);

    // If no direct matches, try fuzzy matching
    if (matches.length === 0) {
      const fuzzyMatches = AVAILABLE_COMMANDS
        .map(cmd => ({
          command: cmd,
          distance: levenshteinDistance(input.toLowerCase(), cmd.toLowerCase()),
        }))
        .filter(item => item.distance <= 3) // Max distance of 3
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map(item => item.command);

      return fuzzyMatches;
    }

    return matches;
  },

  /**
   * Show "Did you mean?" suggestion
   */
  showDidYouMean(input: string): void {
    const suggestion = this.findClosestCommand(input);
    if (suggestion) {
      console.log('');
      console.log(colors.warning(`Command '${input}' not found.`));
      console.log(colors.primary(`Did you mean: ${colors.highlight('pb ' + suggestion)}?`));
      console.log('');
      console.log(colors.dim(`Run ${colors.code('pb --help')} to see all available commands.`));
    }
  },

  /**
   * Show available commands with descriptions
   */
  showAvailableCommands(): void {
    const commandDescriptions = {
      enhance: 'Enhance a prompt using the Context Engine',
      init: 'Initialize PromptBrain in your project',
      login: 'Login to your PromptBrain account',
      logout: 'Logout from your account',
      signup: 'Create a new PromptBrain account',
      whoami: 'Show current user information',
      usage: 'Check your API usage and quota',
      quota: 'View quota limits for your plan',
      doctor: 'Run health diagnostics',
      config: 'Manage CLI configuration',
      update: 'Update the CLI to latest version',
      health: 'Check system health',
      devsync: 'Sync development context',
      link: 'Link external integrations',
      billing: 'Manage billing and subscription',
      api: 'Manage API keys',
      lib: 'Manage prompt templates',
    };

    console.log('');
    console.log(colors.heading('Available Commands:'));
    console.log('');

    AVAILABLE_COMMANDS.forEach(cmd => {
      const description = commandDescriptions[cmd as keyof typeof commandDescriptions] || '';
      console.log(`  ${colors.primary(cmd.padEnd(12))} ${colors.dim(description)}`);
    });

    console.log('');
    console.log(colors.dim(`Run ${colors.code('pb <command> --help')} for detailed help on any command.`));
  },

  /**
   * Suggest next actions based on context
   */
  suggestNextActions(context: 'after-init' | 'after-login' | 'after-enhance' | 'general'): void {
    const suggestions = {
      'after-init': [
        'pb enhance "your first prompt"',
        'pb link notion',
        'pb doctor',
      ],
      'after-login': [
        'pb init',
        'pb whoami',
        'pb usage',
      ],
      'after-enhance': [
        'pb enhance --interactive',
        'pb lib list',
        'pb devsync',
      ],
      'general': [
        'pb enhance "prompt"',
        'pb init',
        'pb doctor',
      ],
    };

    const contextSuggestions = suggestions[context];
    
    console.log('');
    console.log(colors.primary('💡 Try these commands next:'));
    contextSuggestions.forEach((suggestion, index) => {
      console.log(`  ${colors.dim(`${index + 1}.`)} ${colors.highlight(suggestion)}`);
    });
    console.log('');
  },
};

export default suggestions;