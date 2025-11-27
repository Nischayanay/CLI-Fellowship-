import colors from './colors';
import ui from './ui';

/**
 * Reinforcement metrics for habit formation
 */
export interface ReinforcementMetrics {
  tokensSaved?: number;
  memoryHits?: number;
  crossToolContext?: string[];
  processingTime?: number;
}

/**
 * Context source information
 */
export interface ContextSource {
  name: string;
  count: number;
}

/**
 * Reinforcement Display - Show positive feedback to build habit loops
 */
export const reinforcement = {
  /**
   * Show comprehensive metrics after successful operations
   */
  showMetrics(metrics: ReinforcementMetrics): void {
    if (!metrics || Object.keys(metrics).length === 0) return;

    console.log(''); // Spacing before metrics
    console.log(colors.dim('─'.repeat(60)));

    // Token savings
    if (metrics.tokensSaved !== undefined && metrics.tokensSaved > 0) {
      const savingsText = `${metrics.tokensSaved.toLocaleString()} tokens saved`;
      console.log(colors.success(`💰 ${savingsText}`));
    }

    // Memory graph hits
    if (metrics.memoryHits !== undefined && metrics.memoryHits > 0) {
      const hitsText = `${metrics.memoryHits} memory graph hit${metrics.memoryHits > 1 ? 's' : ''}`;
      console.log(colors.primary(`🧠 ${hitsText}`));
    }

    // Cross-tool context
    if (metrics.crossToolContext && metrics.crossToolContext.length > 0) {
      const toolsText = metrics.crossToolContext.join(', ');
      console.log(colors.primary(`🔗 Context from: ${toolsText}`));
    }

    // Processing time
    if (metrics.processingTime !== undefined) {
      const timeText = metrics.processingTime > 1000 
        ? `${(metrics.processingTime / 1000).toFixed(2)}s`
        : `${metrics.processingTime}ms`;
      console.log(colors.metadata(`⏱️  Processed in ${timeText}`));
    }

    console.log(colors.dim('─'.repeat(60)));
    console.log(''); // Spacing after metrics
  },

  /**
   * Show token savings with context
   */
  showTokenSavings(saved: number, total: number): void {
    if (saved <= 0) return;

    const percentage = total > 0 ? Math.round((saved / total) * 100) : 0;
    const savingsText = `Saved ${saved.toLocaleString()} tokens (${percentage}% reduction)`;
    
    console.log('');
    console.log(colors.success(`💰 ${savingsText}`));
    
    if (percentage >= 50) {
      ui.tip('Context reuse is working great! Keep using PBCLI to maximize efficiency.');
    }
  },

  /**
   * Show context sources used
   */
  showContextSources(sources: ContextSource[]): void {
    if (!sources || sources.length === 0) return;

    console.log('');
    console.log(colors.heading('Context Sources'));
    
    sources.forEach(source => {
      const snippetText = `${source.count} snippet${source.count > 1 ? 's' : ''}`;
      console.log(colors.primary(`  • ${source.name} `) + colors.metadata(`(${snippetText})`));
    });
    
    console.log('');
  },

  /**
   * Show efficiency gains summary
   */
  showEfficiencyGains(metrics: ReinforcementMetrics): void {
    const gains: string[] = [];

    if (metrics.tokensSaved && metrics.tokensSaved > 0) {
      gains.push(`${metrics.tokensSaved.toLocaleString()} tokens saved`);
    }

    if (metrics.memoryHits && metrics.memoryHits > 0) {
      gains.push(`${metrics.memoryHits} context hit${metrics.memoryHits > 1 ? 's' : ''}`);
    }

    if (metrics.crossToolContext && metrics.crossToolContext.length > 0) {
      gains.push(`${metrics.crossToolContext.length} tool${metrics.crossToolContext.length > 1 ? 's' : ''} connected`);
    }

    if (gains.length === 0) return;

    console.log('');
    console.log(colors.success('✨ Efficiency Gains'));
    gains.forEach(gain => {
      console.log(colors.primary(`  • ${gain}`));
    });
    console.log('');
  },

  /**
   * Show cross-tool context attribution
   */
  showCrossToolAttribution(tools: string[]): void {
    if (!tools || tools.length === 0) return;

    console.log('');
    const toolList = tools.map(tool => colors.highlight(tool)).join(', ');
    console.log(colors.primary('🔗 Using context from: ') + toolList);
  },

  /**
   * Show memory graph statistics
   */
  showMemoryStats(hits: number, total: number): void {
    if (hits <= 0) return;

    const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;
    
    console.log('');
    console.log(colors.primary(`🧠 Memory Graph: ${hits}/${total} hits (${hitRate}% hit rate)`));
    
    if (hitRate >= 80) {
      ui.goodNews('Your context graph is highly optimized!');
    }
  },

  /**
   * Show processing time with context
   */
  showProcessingTime(ms: number): void {
    const timeText = ms > 1000 
      ? `${(ms / 1000).toFixed(2)}s`
      : `${ms}ms`;
    
    console.log('');
    console.log(colors.metadata(`⏱️  Processing time: ${timeText}`));
    
    if (ms < 500) {
      console.log(colors.dim('   Lightning fast! ⚡'));
    }
  },

  /**
   * Show success confirmation with optional metrics
   */
  showSuccess(message: string, metrics?: ReinforcementMetrics): void {
    console.log('');
    console.log(colors.statusSuccess(message));
    
    if (metrics) {
      this.showMetrics(metrics);
    }
  },

  /**
   * Show habit-forming encouragement based on usage
   */
  showEncouragement(commandCount: number): void {
    if (commandCount <= 0) return;

    const milestones = [
      { count: 10, message: 'You\'re getting the hang of PBCLI!' },
      { count: 50, message: 'PBCLI power user! Keep it up!' },
      { count: 100, message: 'Century club! You\'re a PBCLI expert!' },
      { count: 500, message: 'Incredible! You\'ve mastered PBCLI!' },
    ];

    const milestone = milestones.reverse().find(m => commandCount >= m.count);
    
    if (milestone && commandCount === milestone.count) {
      console.log('');
      console.log(colors.success(`🎉 ${milestone.message}`));
      console.log(colors.metadata(`   ${commandCount} commands executed`));
      console.log('');
    }
  },
};

/**
 * Export default reinforcement object for convenience
 */
export default reinforcement;
