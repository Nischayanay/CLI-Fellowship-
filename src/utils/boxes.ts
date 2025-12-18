import colors from './colors';

/**
 * Box drawing characters for rich terminal UI
 */
const BOX_CHARS = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  cross: '┼',
  teeDown: '┬',
  teeUp: '┴',
  teeRight: '├',
  teeLeft: '┤',
} as const;

/**
 * Box styling options
 */
export interface BoxOptions {
  padding?: number;
  margin?: number;
  borderColor?: (text: string) => string;
  backgroundColor?: (text: string) => string;
  title?: string;
  width?: number;
}

/**
 * Rich terminal UI components with boxes and borders
 */
export const boxes = {
  /**
   * Create a bordered box around content
   */
  box(content: string, options: BoxOptions = {}): string {
    const lines = content.split('\n');
    const padding = options.padding || 1;
    const borderColor = options.borderColor || colors.dim;
    const title = options.title;
    
    // Calculate box width
    const contentWidth = Math.max(...lines.map(line => line.length));
    const boxWidth = options.width || contentWidth + (padding * 2);
    const innerWidth = boxWidth - 2; // Account for borders
    
    const result: string[] = [];
    
    // Top border with optional title
    if (title) {
      const titlePadding = Math.max(0, Math.floor((innerWidth - title.length) / 2));
      const titleLine = title.padStart(titlePadding + title.length).padEnd(innerWidth);
      result.push(borderColor(BOX_CHARS.topLeft + BOX_CHARS.horizontal.repeat(innerWidth) + BOX_CHARS.topRight));
      result.push(borderColor(BOX_CHARS.vertical) + colors.primary(titleLine) + borderColor(BOX_CHARS.vertical));
      result.push(borderColor(BOX_CHARS.teeRight + BOX_CHARS.horizontal.repeat(innerWidth) + BOX_CHARS.teeLeft));
    } else {
      result.push(borderColor(BOX_CHARS.topLeft + BOX_CHARS.horizontal.repeat(innerWidth) + BOX_CHARS.topRight));
    }
    
    // Add padding at top
    for (let i = 0; i < padding; i++) {
      result.push(borderColor(BOX_CHARS.vertical) + ' '.repeat(innerWidth) + borderColor(BOX_CHARS.vertical));
    }
    
    // Content lines
    lines.forEach(line => {
      const paddedLine = ' '.repeat(padding) + line.padEnd(innerWidth - padding * 2) + ' '.repeat(padding);
      result.push(borderColor(BOX_CHARS.vertical) + paddedLine + borderColor(BOX_CHARS.vertical));
    });
    
    // Add padding at bottom
    for (let i = 0; i < padding; i++) {
      result.push(borderColor(BOX_CHARS.vertical) + ' '.repeat(innerWidth) + borderColor(BOX_CHARS.vertical));
    }
    
    // Bottom border
    result.push(borderColor(BOX_CHARS.bottomLeft + BOX_CHARS.horizontal.repeat(innerWidth) + BOX_CHARS.bottomRight));
    
    return result.join('\n');
  },

  /**
   * Create an info box with icon
   */
  info(content: string, title?: string): string {
    return this.box(
      `ℹ️  ${content}`,
      {
        title,
        borderColor: colors.primary,
        padding: 1,
      }
    );
  },

  /**
   * Create a success box with icon
   */
  success(content: string, title?: string): string {
    return this.box(
      `✅ ${content}`,
      {
        title,
        borderColor: colors.success,
        padding: 1,
      }
    );
  },

  /**
   * Create a warning box with icon
   */
  warning(content: string, title?: string): string {
    return this.box(
      `⚠️  ${content}`,
      {
        title,
        borderColor: colors.warning,
        padding: 1,
      }
    );
  },

  /**
   * Create an error box with icon
   */
  error(content: string, title?: string): string {
    return this.box(
      `❌ ${content}`,
      {
        title,
        borderColor: colors.error,
        padding: 1,
      }
    );
  },

  /**
   * Create a code block with syntax highlighting
   */
  code(code: string, language?: string): string {
    const title = language ? `Code (${language})` : 'Code';
    return this.box(
      colors.code(code),
      {
        title,
        borderColor: colors.dim,
        padding: 1,
      }
    );
  },

  /**
   * Create a two-column layout
   */
  columns(left: string, right: string, options: { ratio?: number; separator?: string } = {}): string {
    const ratio = options.ratio || 0.5;
    const separator = options.separator || ' │ ';
    
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    const maxLines = Math.max(leftLines.length, rightLines.length);
    
    // Calculate column widths (assuming 80 char terminal)
    const totalWidth = 80;
    const separatorWidth = separator.length;
    const leftWidth = Math.floor((totalWidth - separatorWidth) * ratio);
    const rightWidth = totalWidth - leftWidth - separatorWidth;
    
    const result: string[] = [];
    
    for (let i = 0; i < maxLines; i++) {
      const leftLine = (leftLines[i] || '').padEnd(leftWidth);
      const rightLine = (rightLines[i] || '').padEnd(rightWidth);
      result.push(leftLine + colors.dim(separator) + rightLine);
    }
    
    return result.join('\n');
  },
};

export default boxes;