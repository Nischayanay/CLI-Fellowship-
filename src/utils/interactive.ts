import readline from 'readline';
import colors from './colors';

/**
 * Interactive CLI utilities for rich user experiences
 */

export interface SelectOption {
  name: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface PromptOptions {
  message: string;
  default?: string;
  validate?: (input: string) => boolean | string;
  transform?: (input: string) => string;
  multiline?: boolean;
}

export interface SelectOptions {
  message: string;
  choices: SelectOption[];
  default?: string;
}

export interface ConfirmOptions {
  message: string;
  default?: boolean;
}

/**
 * Interactive prompt utilities
 */
export const interactive = {
  /**
   * Multi-line text input with rich editing
   */
  async multilineInput(options: PromptOptions): Promise<string> {
    console.log(colors.primary(options.message));
    console.log(colors.dim('(Press Ctrl+D when finished, Ctrl+C to cancel)'));
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const lines: string[] = [];
    let lineCount = 0;

    return new Promise((resolve, reject) => {
      const handleLine = (line: string) => {
        lines.push(line);
        lineCount++;
        
        // Show line numbers for better UX
        process.stdout.write(colors.dim(`${String(lineCount + 1).padStart(2)}: `));
      };

      const handleClose = () => {
        const result = lines.join('\n');
        console.log('');
        console.log(colors.success(`✓ Captured ${lineCount} lines (${result.length} characters)`));
        resolve(result);
      };

      rl.on('line', handleLine);
      rl.on('close', handleClose);
      rl.on('SIGINT', () => {
        console.log('\n' + colors.warning('Cancelled'));
        reject(new Error('User cancelled'));
      });

      // Start with first line prompt
      process.stdout.write(colors.dim(' 1: '));
    });
  },

  /**
   * Select from a list of options with arrow key navigation
   */
  async select(options: SelectOptions): Promise<string> {
    console.log(colors.primary(options.message));
    console.log('');

    // For now, use simple numbered selection
    // TODO: Implement arrow key navigation
    options.choices.forEach((choice, index) => {
      const number = colors.dim(`${index + 1}.`);
      const name = choice.disabled ? colors.dim(choice.name) : choice.name;
      const desc = choice.description ? colors.dim(` - ${choice.description}`) : '';
      console.log(`  ${number} ${name}${desc}`);
    });

    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve, reject) => {
      rl.question(colors.primary('Select (1-' + options.choices.length + '): '), (answer) => {
        rl.close();
        
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < options.choices.length && !options.choices[index].disabled) {
          resolve(options.choices[index].value);
        } else {
          console.log(colors.error('Invalid selection'));
          reject(new Error('Invalid selection'));
        }
      });
    });
  },

  /**
   * Yes/No confirmation with smart defaults
   */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const defaultText = options.default !== undefined 
      ? (options.default ? ' (Y/n)' : ' (y/N)')
      : ' (y/n)';

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(colors.primary(options.message + defaultText + ': '), (answer) => {
        rl.close();
        
        const normalized = answer.toLowerCase().trim();
        
        if (normalized === '') {
          resolve(options.default ?? false);
        } else if (normalized === 'y' || normalized === 'yes') {
          resolve(true);
        } else if (normalized === 'n' || normalized === 'no') {
          resolve(false);
        } else {
          // Invalid input, use default
          resolve(options.default ?? false);
        }
      });
    });
  },

  /**
   * Enhanced input with validation and transformation
   */
  async input(options: PromptOptions): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = options.default 
      ? `${options.message} (${colors.dim(options.default)}): `
      : `${options.message}: `;

    return new Promise((resolve, reject) => {
      const askQuestion = () => {
        rl.question(colors.primary(prompt), (answer) => {
          const value = answer.trim() || options.default || '';
          
          // Validate input
          if (options.validate) {
            const validation = options.validate(value);
            if (validation !== true) {
              console.log(colors.error(typeof validation === 'string' ? validation : 'Invalid input'));
              askQuestion(); // Ask again
              return;
            }
          }

          // Transform input
          const finalValue = options.transform ? options.transform(value) : value;
          
          rl.close();
          resolve(finalValue);
        });
      };

      askQuestion();
    });
  },
};

export default interactive;