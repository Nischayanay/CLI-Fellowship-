import colors from './colors';

/**
 * Message formatting options
 */
interface MessageOptions {
  prefix?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'metadata';
  dim?: boolean;
  indent?: number;
}

/**
 * List formatting options
 */
interface ListOptions {
  bullet?: string;
  indent?: number;
}

/**
 * Table formatting options
 */
interface TableOptions {
  align?: 'left' | 'right';
}

/**
 * Key-value formatting options
 */
interface KeyValueOptions {
  keyWidth?: number;
}

/**
 * Maximum line width for readable output (80-100 chars)
 */
const MAX_LINE_WIDTH = 100;

/**
 * Default indentation (2 spaces)
 */
const INDENT_SIZE = 2;

/**
 * UI Formatter - High-level formatting utilities for consistent output
 */
export const ui = {
  /**
   * Display a tip message
   */
  tip(message: string): void {
    console.log(colors.primary('Tip: ') + message);
  },

  /**
   * Display a heads up message
   */
  headsUp(message: string): void {
    console.log(colors.warning('Heads up: ') + message);
  },

  /**
   * Display good news message
   */
  goodNews(message: string): void {
    console.log(colors.success('Good news: ') + message);
  },

  /**
   * Display done message
   */
  done(message?: string): void {
    if (message) {
      console.log(colors.success('Done. ') + message);
    } else {
      console.log(colors.success('Done.'));
    }
  },

  /**
   * Display a section with title
   */
  section(title: string, content?: string): void {
    console.log(colors.heading(title));
    if (content) {
      console.log(content);
    }
    console.log(''); // Blank line after section
  },

  /**
   * Display a subsection with title
   */
  subsection(title: string, content?: string): void {
    console.log(colors.primary(title));
    if (content) {
      console.log(content);
    }
  },

  /**
   * Display a bulleted list
   */
  list(items: string[], options: ListOptions = {}): void {
    const bullet = options.bullet || '•';
    const indent = ' '.repeat(options.indent || 0);
    
    items.forEach(item => {
      console.log(`${indent}${bullet} ${item}`);
    });
  },

  /**
   * Display a numbered list
   */
  numberedList(items: string[]): void {
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item}`);
    });
  },

  /**
   * Display a table from array of objects
   */
  table(data: Record<string, string>[], options: TableOptions = {}): void {
    if (data.length === 0) return;

    // Get all unique keys
    const keys = Array.from(new Set(data.flatMap(row => Object.keys(row))));
    
    // Calculate column widths
    const widths: Record<string, number> = {};
    keys.forEach(key => {
      const maxContentWidth = Math.max(
        key.length,
        ...data.map(row => (row[key] || '').length)
      );
      widths[key] = maxContentWidth;
    });

    // Print header
    const header = keys.map(key => key.padEnd(widths[key])).join('  ');
    console.log(colors.heading(header));
    console.log(colors.dim('─'.repeat(header.length)));

    // Print rows
    data.forEach(row => {
      const line = keys.map(key => {
        const value = row[key] || '';
        return options.align === 'right' 
          ? value.padStart(widths[key])
          : value.padEnd(widths[key]);
      }).join('  ');
      console.log(line);
    });
  },

  /**
   * Display a key-value pair
   */
  keyValue(key: string, value: string, options: KeyValueOptions = {}): void {
    const keyWidth = options.keyWidth || 20;
    const paddedKey = key.padEnd(keyWidth);
    console.log(`${colors.dim(paddedKey)} ${value}`);
  },

  /**
   * Add blank lines for spacing
   */
  spacer(lines: number = 1): void {
    for (let i = 0; i < lines; i++) {
      console.log('');
    }
  },

  /**
   * Display a divider line
   */
  divider(char: string = '─'): void {
    console.log(colors.dim(char.repeat(80)));
  },

  /**
   * Display a code block
   */
  codeBlock(code: string, language?: string): void {
    if (language) {
      console.log(colors.dim(`\`\`\`${language}`));
    }
    console.log(colors.code(code));
    if (language) {
      console.log(colors.dim('```'));
    }
  },

  /**
   * Format inline code
   */
  inlineCode(code: string): string {
    return colors.code(`\`${code}\``);
  },

  /**
   * Wrap text to maximum line width
   */
  wrapText(text: string, maxWidth: number = MAX_LINE_WIDTH): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  },

  /**
   * Indent text by specified levels
   */
  indent(text: string, levels: number = 1): string {
    const indentation = ' '.repeat(INDENT_SIZE * levels);
    return text.split('\n').map(line => `${indentation}${line}`).join('\n');
  },

  /**
   * Format a message with custom options
   */
  message(text: string, options: MessageOptions = {}): void {
    let output = text;

    // Apply prefix
    if (options.prefix) {
      output = `${options.prefix} ${output}`;
    }

    // Apply indentation
    if (options.indent) {
      output = this.indent(output, options.indent);
    }

    // Apply color
    if (options.color) {
      switch (options.color) {
        case 'primary':
          output = colors.primary(output);
          break;
        case 'success':
          output = colors.success(output);
          break;
        case 'warning':
          output = colors.warning(output);
          break;
        case 'error':
          output = colors.error(output);
          break;
        case 'metadata':
          output = colors.metadata(output);
          break;
      }
    }

    // Apply dim
    if (options.dim) {
      output = colors.dim(output);
    }

    console.log(output);
  },
};

/**
 * Export default ui object for convenience
 */
export default ui;
