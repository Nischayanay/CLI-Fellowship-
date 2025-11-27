import colors from './colors';

/**
 * Sigil display options
 */
interface SigilOptions {
  color?: boolean;
  size?: 'small' | 'normal';
}

/**
 * PromptBrain ASCII Sigil
 * Minimalistic design representing a brain/neural network
 * Maximum 5 lines height as per requirements
 */
const SIGIL_NORMAL = `
 ██████╗ ██████╗ 
 ██╔══██╗██╔══██╗
 ██████╔╝██████╔╝
 ██╔═══╝ ██╔══██╗
 ██║     ██████╔╝
 ╚═╝     ╚═════╝ 
`.trim();

const SIGIL_SMALL = `
 ██████╗ ██████╗ 
 ██╔══██╗██╔══██╗
 ██████╔╝██████╔╝
`.trim();

/**
 * ASCII Sigil - Minimalistic brand identity display
 */
export const sigil = {
  /**
   * Display the sigil
   */
  show(options: SigilOptions = {}): void {
    const { color = true, size = 'normal' } = options;
    const art = size === 'small' ? SIGIL_SMALL : SIGIL_NORMAL;
    
    console.log('');
    if (color) {
      console.log(colors.primary(art));
    } else {
      console.log(art);
    }
    console.log('');
  },

  /**
   * Get sigil as string
   */
  toString(options: SigilOptions = {}): string {
    const { color = true, size = 'normal' } = options;
    const art = size === 'small' ? SIGIL_SMALL : SIGIL_NORMAL;
    
    return color ? colors.primary(art) : art;
  },

  /**
   * Get sigil height (for testing)
   */
  getHeight(size: 'small' | 'normal' = 'normal'): number {
    const art = size === 'small' ? SIGIL_SMALL : SIGIL_NORMAL;
    return art.split('\n').length;
  },

  /**
   * Verify sigil meets size constraints
   */
  verifySizeConstraints(): boolean {
    const normalHeight = this.getHeight('normal');
    const smallHeight = this.getHeight('small');
    
    // Requirements: sigil must not exceed 5 lines
    return normalHeight <= 5 && smallHeight <= 5;
  },
};

/**
 * Export default sigil object for convenience
 */
export default sigil;
