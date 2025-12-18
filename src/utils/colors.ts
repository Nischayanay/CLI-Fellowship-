import chalk from 'chalk';

/**
 * Premium PromptBrain Color Palette
 * Amber-centric premium branding for confident developers
 */
export const PALETTE = {
  // Premium Amber Brand Colors
  primary: '#FF8C00',      // Dark Orange - Premium, confident, energizing
  brand: '#FFA500',        // Rich Amber - Warm, approachable premium
  accent: '#CC6600',       // Burnt Orange - Deep, sophisticated accent
  
  // Supporting Premium Palette
  success: '#32CD32',      // Lime Green - Fresh achievement
  warning: '#FFD700',      // Gold - Premium attention
  error: '#DC143C',        // Crimson - Clear but not harsh
  metadata: '#8B7355',     // Warm Gray - Sophisticated secondary
  contrast: '#4169E1',     // Royal Blue - Premium contrast
  neutral: '#FFFFFF',      // White - Clean text
  
  // Gradient Colors for Effects
  gradientStart: '#FF8C00',
  gradientMid: '#FFA500', 
  gradientEnd: '#FFD700',
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
 * Premium color functions using the amber-centric palette
 */
export const colors = {
  // Premium Brand Colors
  primary: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.primary)(text);
  },

  brand: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.brand).bold(text);
  },

  accent: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.accent)(text);
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

  contrast: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.contrast)(text);
  },

  neutral: (text: string): string => {
    return text; // No coloring for neutral text
  },

  // Premium Semantic Helpers
  heading: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.primary).bold(text);
  },

  highlight: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.brand).bold(text);
  },

  dim: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.metadata).dim(text);
  },

  code: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.contrast).italic(text);
  },

  // Premium Effects
  gradient: (text: string): string => {
    if (!config.enabled) return text;
    // Simple gradient effect using different shades
    const chars = text.split('');
    return chars.map((char, i) => {
      const ratio = i / (chars.length - 1);
      if (ratio < 0.5) {
        return chalk.hex(PALETTE.gradientStart)(char);
      } else {
        return chalk.hex(PALETTE.gradientEnd)(char);
      }
    }).join('');
  },

  glow: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.brand).bold.underline(text);
  },

  premium: (text: string): string => {
    if (!config.enabled) return text;
    return chalk.hex(PALETTE.primary).bold.italic(text);
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
