import colors from './colors';
import { PALETTE } from './colors';
import chalk from 'chalk';

/**
 * Progress state tracking
 */
interface ProgressState {
  type: 'spinner' | 'bar' | 'stage';
  active: boolean;
  message: string;
  current?: number;
  total?: number;
  startTime: number;
  intervalId?: NodeJS.Timeout;
}

/**
 * Premium spinner collections for different contexts
 */
const SPINNER_FRAMES = {
  premium: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  pulse: ['●', '○', '◐', '◑', '◒', '◓'],
  wave: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'],
  orbit: ['◜', '◠', '◝', '◞', '◡', '◟'],
  brain: ['🧠', '💭', '💡', '⚡', '🔥', '✨'],
  gradient: ['🔸', '🔶', '🟠', '🟡', '🟨', '🟩'],
};

/**
 * Progress bar characters
 */
const BAR_CHARS = {
  complete: '█',
  incomplete: '░',
  edge: '│',
};

/**
 * Current progress state
 */
let state: ProgressState | null = null;

/**
 * Check if terminal supports cursor manipulation
 */
function supportsCursorManipulation(): boolean {
  return process.stdout.isTTY && !process.env.CI;
}

/**
 * Clear current line
 */
function clearLine(): void {
  if (supportsCursorManipulation()) {
    process.stdout.write('\r\x1b[K');
  }
}

/**
 * Write to stdout without newline
 */
function write(text: string): void {
  process.stdout.write(text);
}

/**
 * Progress Indicator - Smooth, Apple-style progress indicators
 */
export const progress = {
  /**
   * Stream text with typing effect (like ChatGPT)
   */
  async streamText(text: string, options: { delay?: number; color?: (text: string) => string } = {}): Promise<void> {
    const delay = options.delay || 20;
    const colorFn = options.color || ((t: string) => t);
    
    for (let i = 0; i < text.length; i++) {
      process.stdout.write(colorFn(text[i]));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.log(''); // New line at end
  },

  /**
   * Show progress with throughput metrics
   */
  showThroughput(processed: number, total: number, startTime: number): void {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processed / elapsed;
    const eta = total > processed ? (total - processed) / rate : 0;
    
    const throughputText = `${rate.toFixed(1)}/s`;
    const etaText = eta > 0 ? `ETA: ${Math.ceil(eta)}s` : 'Done';
    
    console.log(colors.dim(`  ${throughputText} • ${etaText}`));
  },
  /**
   * Start premium spinner with context awareness
   */
  start(message: string, spinnerType: keyof typeof SPINNER_FRAMES = 'premium'): void {
    // Clean up any existing progress
    this.stop();

    state = {
      type: 'spinner',
      active: true,
      message,
      startTime: Date.now(),
    };

    if (supportsCursorManipulation()) {
      let frameIndex = 0;
      const frames = SPINNER_FRAMES[spinnerType];
      
      state.intervalId = setInterval(() => {
        if (!state || !state.active) return;
        
        clearLine();
        const frame = frames[frameIndex];
        const coloredFrame = chalk.hex(PALETTE.brand)(frame);
        const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
        
        write(`${coloredFrame} ${colors.metadata(state.message)} ${colors.dim(`(${elapsed}s)`)}`);
        
        frameIndex = (frameIndex + 1) % frames.length;
      }, 80);
    } else {
      // Fallback for terminals without cursor manipulation
      console.log(`${colors.brand('...')} ${message}`);
    }
  },

  /**
   * Context-aware spinners for different operations
   */
  thinking(message: string = 'Analyzing context...'): void {
    this.start(message, 'brain');
  },

  processing(message: string = 'Processing...'): void {
    this.start(message, 'gradient');
  },

  network(message: string = 'Connecting...'): void {
    this.start(message, 'orbit');
  },

  /**
   * Update spinner message
   */
  update(message: string): void {
    if (!state || !state.active) return;
    
    state.message = message;
    
    if (!supportsCursorManipulation()) {
      console.log(`${colors.primary('...')} ${message}`);
    }
  },

  /**
   * Stop spinner without status
   */
  stop(): void {
    if (!state) return;

    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    if (supportsCursorManipulation()) {
      clearLine();
    }

    state = null;
  },

  /**
   * Stop spinner with success status
   */
  succeed(message?: string): void {
    if (!state) return;

    const finalMessage = message || state.message;
    
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    if (supportsCursorManipulation()) {
      clearLine();
    }

    console.log(colors.statusSuccess(finalMessage));
    state = null;
  },

  /**
   * Stop spinner with failure status
   */
  fail(message?: string): void {
    if (!state) return;

    const finalMessage = message || state.message;
    
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    if (supportsCursorManipulation()) {
      clearLine();
    }

    console.log(colors.statusError(finalMessage));
    state = null;
  },

  /**
   * Start a determinate progress bar
   */
  startBar(total: number, message?: string): void {
    // Clean up any existing progress
    this.stop();

    state = {
      type: 'bar',
      active: true,
      message: message || 'Progress',
      current: 0,
      total,
      startTime: Date.now(),
    };

    this.renderBar();
  },

  /**
   * Update progress bar
   */
  updateBar(current: number, message?: string): void {
    if (!state || state.type !== 'bar') return;

    state.current = current;
    if (message) {
      state.message = message;
    }

    this.renderBar();
  },

  /**
   * Complete progress bar
   */
  completeBar(message?: string): void {
    if (!state || state.type !== 'bar') return;

    state.current = state.total;
    this.renderBar();

    if (supportsCursorManipulation()) {
      write('\n');
    }

    if (message) {
      console.log(colors.statusSuccess(message));
    }

    state = null;
  },

  /**
   * Render progress bar
   */
  renderBar(): void {
    if (!state || state.type !== 'bar') return;

    const percentage = state.total ? (state.current! / state.total) * 100 : 0;
    const barWidth = 30;
    const completeWidth = Math.floor((percentage / 100) * barWidth);
    const incompleteWidth = barWidth - completeWidth;

    const bar = 
      BAR_CHARS.edge +
      BAR_CHARS.complete.repeat(completeWidth) +
      BAR_CHARS.incomplete.repeat(incompleteWidth) +
      BAR_CHARS.edge;

    const percentText = `${Math.round(percentage)}%`.padStart(4);
    const output = `${colors.primary(bar)} ${percentText} ${state.message}`;

    if (supportsCursorManipulation()) {
      clearLine();
      write(output);
    } else {
      console.log(output);
    }
  },

  /**
   * Start a multi-stage progress indicator
   */
  startStage(stageName: string, totalStages: number, currentStage: number): void {
    // Clean up any existing progress
    this.stop();

    const stageInfo = colors.metadata(`[${currentStage}/${totalStages}]`);
    const message = `${stageInfo} ${stageName}`;

    state = {
      type: 'stage',
      active: true,
      message,
      current: currentStage,
      total: totalStages,
      startTime: Date.now(),
    };

    console.log(colors.primary(message));
  },

  /**
   * Complete current stage
   */
  completeStage(): void {
    if (!state || state.type !== 'stage') return;

    const elapsed = Date.now() - state.startTime;
    const elapsedText = elapsed > 1000 ? `${(elapsed / 1000).toFixed(1)}s` : `${elapsed}ms`;
    
    console.log(colors.success(`✓ Completed in ${elapsedText}`));
    console.log(''); // Blank line between stages

    state = null;
  },

  /**
   * Get current progress state (for testing)
   */
  getState(): ProgressState | null {
    return state ? { ...state } : null;
  },
};

/**
 * Ensure cleanup on process exit
 */
process.on('exit', () => {
  if (state && state.intervalId) {
    clearInterval(state.intervalId);
  }
});

/**
 * Export default progress object for convenience
 */
export default progress;
