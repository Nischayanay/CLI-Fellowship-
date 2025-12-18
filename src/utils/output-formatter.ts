import colors from './colors';
import boxes from './boxes';

/**
 * Unified output formatter for consistent CLI presentation
 */
export class OutputFormatter {
  private static readonly SECTION_SPACING = '\n\n';
  private static readonly SUBSECTION_SPACING = '\n';

  /**
   * Create a standardized section header
   */
  static sectionHeader(title: string, icon?: string): string {
    const headerText = icon ? `${icon} ${title}` : title;
    return colors.heading(headerText) + this.SECTION_SPACING;
  }

  /**
   * Create a compact metadata card
   */
  static metadataCard(data: Record<string, any>): string {
    const entries = Object.entries(data)
      .map(([key, value]) => `${colors.dim(key + ':')} ${colors.highlight(String(value))}`)
      .join(' • ');
    
    return boxes.box(entries, {
      padding: 1,
      borderColor: colors.dim,
    });
  }

  /**
   * Create a status summary with metrics
   */
  static statusSummary(status: 'success' | 'warning' | 'error', message: string, metrics?: Record<string, any>): string {
    const statusColors = {
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
    };

    let content = statusColors[status](`${this.getStatusIcon(status)} ${message}`);
    
    if (metrics) {
      const metricLines = Object.entries(metrics)
        .map(([key, value]) => `  ${colors.dim(key)}: ${colors.highlight(String(value))}`)
        .join('\n');
      content += '\n' + metricLines;
    }

    return content + this.SECTION_SPACING;
  }

  /**
   * Create a before/after comparison
   */
  static comparison(before: string, after: string, beforeLabel = 'Original', afterLabel = 'Enhanced'): string {
    const beforeBox = boxes.box(before, {
      title: beforeLabel,
      borderColor: colors.dim,
      padding: 1,
    });

    const afterBox = boxes.box(after, {
      title: afterLabel,
      borderColor: colors.success,
      padding: 1,
    });

    return beforeBox + this.SUBSECTION_SPACING + afterBox + this.SECTION_SPACING;
  }

  /**
   * Create a compact info panel
   */
  static infoPanel(items: Array<{ label: string; value: string; type?: 'success' | 'warning' | 'info' }>): string {
    const lines = items.map(item => {
      const icon = this.getTypeIcon(item.type || 'info');
      return `${icon} ${colors.dim(item.label)}: ${colors.highlight(item.value)}`;
    });

    return lines.join('\n') + this.SECTION_SPACING;
  }

  /**
   * Create contextual suggestions
   */
  static suggestions(title: string, suggestions: string[]): string {
    const content = suggestions
      .map((suggestion, index) => `  ${colors.dim(`${index + 1}.`)} ${colors.highlight(suggestion)}`)
      .join('\n');

    return colors.primary(`💡 ${title}`) + '\n' + content + this.SECTION_SPACING;
  }

  private static getStatusIcon(status: 'success' | 'warning' | 'error'): string {
    const icons = {
      success: '✓',
      warning: '⚠️',
      error: '✗',
    };
    return icons[status];
  }

  private static getTypeIcon(type: 'success' | 'warning' | 'info'): string {
    const icons = {
      success: '✓',
      warning: '⚠️',
      info: '🔍',
    };
    return icons[type];
  }
}

export default OutputFormatter;