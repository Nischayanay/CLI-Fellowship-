import colors from './colors';

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
 * Spinner frames for smooth animation
 */
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

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
   * Start an indeterminate spinner
   */
  start(message: string): void {
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
      
      state.intervalId = setInterval(() => {
        if (!state || !state.active) return;
        
        clearLine();
        const frame = SPINNER_FRAMES[frameIndex];
        write(`${colors.primary(frame)} ${state.message}`);
        
        frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
      }, 80);
    } else {
      // Fallback for terminals without cursor manipulation
      console.log(`${colors.primary('...')} ${message}`);
    }
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
