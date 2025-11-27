/**
 * Intelligent Tips System
 * Shows contextual tips and reinforcement metrics
 */

import colors from './colors';
import ui from './ui';

export interface EnhancementMetrics {
  memoryNodesUsed?: number;
  tokenSavings?: number;
  tokenSavingsPercent?: number;
  contextSources?: string[];
  processingTime?: number;
}

/**
 * Display enhancement metrics with reinforcement
 */
export function displayEnhancementMetrics(metrics: EnhancementMetrics): void {
  if (!metrics || Object.keys(metrics).length === 0) {
    return;
  }

  console.log('');
  ui.divider('─');
  console.log('');
  console.log(colors.success('✨ Enhancement Insights'));
  console.log('');

  // Memory nodes used
  if (metrics.memoryNodesUsed !== undefined && metrics.memoryNodesUsed > 0) {
    console.log(colors.primary('  ✓ ') + colors.neutral(`${metrics.memoryNodesUsed} Memory Node${metrics.memoryNodesUsed > 1 ? 's' : ''} Used`));
  }

  // Token savings
  if (metrics.tokenSavingsPercent !== undefined && metrics.tokenSavingsPercent > 0) {
    const savingsColor = metrics.tokenSavingsPercent >= 50 ? colors.success : colors.primary;
    console.log(savingsColor('  ✓ ') + colors.neutral(`Token Savings: ${Math.round(metrics.tokenSavingsPercent)}%`));
  }

  // Context sources
  if (metrics.contextSources && metrics.contextSources.length > 0) {
    const sources = metrics.contextSources.join(' + ');
    console.log(colors.primary('  ✓ ') + colors.neutral(`Source: ${sources}`));
  }

  // Processing time
  if (metrics.processingTime !== undefined) {
    const timeStr = metrics.processingTime > 1000 
      ? `${(metrics.processingTime / 1000).toFixed(2)}s`
      : `${metrics.processingTime}ms`;
    console.log(colors.metadata(`  ⏱  Processed in ${timeStr}`));
  }

  console.log('');
  ui.divider('─');
  console.log('');
}

/**
 * Show contextual tip based on command
 */
export function showContextualTip(command: string, context?: any): void {
  const tips: Record<string, string[]> = {
    enhance: [
      'Use specific, detailed prompts for better results',
      'Link your tools with "pb link" to improve context',
      'Run "pb init" in your project for framework-specific enhancements',
    ],
    devsync: [
      'Run "pb init" first to auto-detect your project structure',
      'Link Cursor or ChatGPT for richer context',
      'Use devsync regularly to keep context fresh',
    ],
    init: [
      'PBCLI auto-detected your frameworks and dependencies',
      'Templates are now optimized for your tech stack',
      'Run "pb enhance" to see framework-specific suggestions',
    ],
    login: [
      'Your session is stored securely in your OS keychain',
      'Create API keys with "pb api key create" for CI/CD',
      'Run "pb whoami" to verify your authentication',
    ],
    link: [
      'Linking tools improves context quality significantly',
      'You can link multiple tools for cross-app context',
      'Run "pb link list" to see all linked tools',
    ],
  };

  const commandTips = tips[command];
  if (!commandTips || commandTips.length === 0) {
    return;
  }

  // Pick a random tip
  const tip = commandTips[Math.floor(Math.random() * commandTips.length)];
  
  console.log('');
  ui.tip(tip);
}

/**
 * Show token savings celebration
 */
export function celebrateTokenSavings(savingsPercent: number): void {
  if (savingsPercent < 30) {
    return; // Don't celebrate small savings
  }

  console.log('');
  
  if (savingsPercent >= 70) {
    console.log(colors.success('🎉 Incredible! ') + colors.neutral(`${Math.round(savingsPercent)}% token savings!`));
    ui.tip('Your context graph is highly optimized');
  } else if (savingsPercent >= 50) {
    console.log(colors.success('✨ Great! ') + colors.neutral(`${Math.round(savingsPercent)}% token savings`));
    ui.tip('Keep using PBCLI to maximize efficiency');
  } else {
    console.log(colors.primary('💡 ') + colors.neutral(`${Math.round(savingsPercent)}% token savings`));
  }
  
  console.log('');
}

/**
 * Show memory graph insights
 */
export function showMemoryInsights(nodesUsed: number, totalNodes?: number): void {
  if (nodesUsed === 0) {
    return;
  }

  console.log('');
  console.log(colors.primary('🧠 Memory Graph: ') + colors.neutral(`${nodesUsed} node${nodesUsed > 1 ? 's' : ''} retrieved`));
  
  if (totalNodes && totalNodes > 0) {
    const hitRate = Math.round((nodesUsed / totalNodes) * 100);
    if (hitRate >= 80) {
      ui.goodNews('Your context graph is working excellently!');
    }
  }
  
  console.log('');
}

/**
 * Show cross-app context insights
 */
export function showCrossAppInsights(sources: string[]): void {
  if (!sources || sources.length === 0) {
    return;
  }

  console.log('');
  console.log(colors.primary('🔗 Cross-App Context: ') + colors.highlight(sources.join(', ')));
  
  if (sources.length >= 3) {
    ui.goodNews('Multiple tools are enriching your context!');
  } else if (sources.length === 1) {
    ui.tip(`Link more tools with "pb link" for richer context`);
  }
  
  console.log('');
}

/**
 * Show first-time command tip
 */
export function showFirstTimeTip(command: string): void {
  const firstTimeTips: Record<string, string> = {
    enhance: 'This is your first enhancement! PBCLI learns from your usage patterns.',
    devsync: 'DevSync analyzes your project and provides relevant context.',
    init: 'PBCLI has detected your project structure and optimized templates.',
    link: 'Linking tools creates a powerful cross-app context graph.',
  };

  const tip = firstTimeTips[command];
  if (tip) {
    console.log('');
    console.log(colors.success('💡 First Time: ') + colors.neutral(tip));
    console.log('');
  }
}

/**
 * Show upgrade suggestion for free users
 */
export function showUpgradeSuggestion(usage: number, limit: number): void {
  if (limit === null || limit === 0) {
    return; // Unlimited plan
  }

  const usagePercent = (usage / limit) * 100;

  if (usagePercent >= 90) {
    console.log('');
    console.log(colors.warning('⚠️  You\'re approaching your daily limit'));
    ui.tip('Upgrade to Pro for unlimited requests: https://promptbrain.io/pricing');
    console.log('');
  } else if (usagePercent >= 70) {
    console.log('');
    ui.tip('Consider upgrading to Pro for unlimited requests');
    console.log('');
  }
}

export default {
  displayEnhancementMetrics,
  showContextualTip,
  celebrateTokenSavings,
  showMemoryInsights,
  showCrossAppInsights,
  showFirstTimeTip,
  showUpgradeSuggestion,
};
