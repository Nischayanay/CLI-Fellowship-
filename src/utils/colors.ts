import chalk from 'chalk';

/**
 * Official PromptBrain Color Palette
 * Based on color psychology for optimal developer experience
 */
export const PALETTE = {
  primary: '#38C9D6',    // Soft Cyan - Important information
  success: '#33E0A1',    // Mint Green - Success messages, progress
  warning: '#F5C04D',    // Amber - Warnings (non-threatening)
  error: '#E65C5C',      // Soft Red - Errors (non-hostile)
  metadata: '#9BA3AF',   // Stone Grey - Secondary information
  neutral: '#FFFFFF',    // White - Neutral text
} as const;

/**
 * Color system configuration
 */
interface ColorConfig {
  enabled: boolean;
  colorBlindMode: boolean;
}

let config: ColorConfig = {
  enabled: chalk.supportsColor !== false,
  colorBlindMode: false,
};

/**
 * Color-blind mode symbols
 */
const SYMBOLS = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
} as const;

/**
 * Core color functions using the official palette
 */
export const colors = {
  // Core palette colors
  primary: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.primary)(text);
  },

  success: (text: string): string => {
    if (!config.enabled) return text;
    const colored = chalk.hex(PALETTE.success)(text);
    return config.colorBlindMode ? `${SYMBOLS.success} ${colored}` : colored;
  },

  warning: (text: string): string => {
    if (!config.enabled) return text;
    const colored = chalk.hex(PALETTE.warning)(text);
    return config.colorBlindMode ? `${SYMBOLS.warning} ${colored}` : colored;
  },

  error: (text: string): string => {
    if (!config.enabled) return text;
    const colored = chalk.hex(PALETTE.error)(text);
    return config.colorBlindMode ? `${SYMBOLS.error} ${colored}` : colored;
  },

  metadata: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.metadata).dim(text);
  },

  neutral: (text: string): string => {
    return text; // No coloring for neutral text
  },

  // Semantic helpers
  heading: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.primary).bold(text);
  },

  highlight: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.primary).bold(text);
  },

  dim: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.metadata).dim(text);
  },

  code: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.primary).italic(text);
  },

  // Status indicators with consistent formatting
  statusSuccess: (text: string): string => {
    if (!config.enabled) return text;
    const symbol = config.colorBlindMode ? SYMBOLS.success : '✓';
    return chalk.hex(PALETTE.success)(`${symbol} ${text}`);
  },

  statusWarning: (text: string): string => {
    if (!config.enabled) return text;
    const symbol = config.colorBlindMode ? SYMBOLS.warning : '⚠';
    return chalk.hex(PALETTE.warning)(`${symbol} ${text}`);
  },

  statusError: (text: string): string => {
    if (!config.enabled) return text;
    const symbol = config.colorBlindMode ? SYMBOLS.error : '✗';
    return chalk.hex(PALETTE.error)(`${symbol} ${text}`);
  },

  statusInfo: (text: string): string => {
    if (!config.enabled) return text;
    const symbol = config.colorBlindMode ? SYMBOLS.info : 'ℹ';
    return chalk.hex(PALETTE.primary)(`${symbol} ${text}`);
  },
};

/**
 * Utility functions for color system management
 */
export const colorSystem = {
  /**
   * Check if colors are supported in the current terminal
   */
  isColorSupported(): boolean {
    return chalk.supportsColor !== false;
  },

  /**
   * Disable colors (useful for testing or piped output)
   */
  disableColors(): void {
    config.enabled = false;
  },

  /**
   * Enable colors
   */
  enableColors(): void {
    config.enabled = chalk.supportsColor !== false;
  },

  /**
   * Enable color-blind friendly mode
   */
  enableColorBlindMode(): void {
    config.colorBlindMode = true;
  },

  /**
   * Disable color-blind friendly mode
   */
  disableColorBlindMode(): void {
    config.colorBlindMode = false;
  },

  /**
   * Get current configuration
   */
  getConfig(): Readonly<ColorConfig> {
    return { ...config };
  },

  /**
   * Check if color-blind mode is enabled
   */
  isColorBlindMode(): boolean {
    return config.colorBlindMode;
  },
};

/**
 * Export default colors object for convenience
 */
export default colors;
