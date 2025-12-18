import colors from './colors';
import { apiClient } from '../lib/apiClient';

/**
 * Integration context detection and spec extraction
 */
export class ContextDetector {
  private static readonly INTEGRATION_PATTERNS = {
    notion: {
      keywords: ['notion', 'database', 'page', 'block', 'property'],
      specs: ['colors', 'typography', 'spacing', 'components'],
    },
    figma: {
      keywords: ['figma', 'design', 'component', 'variant', 'token'],
      specs: ['design-tokens', 'components', 'colors', 'typography'],
    },
    github: {
      keywords: ['github', 'repository', 'issue', 'pull request', 'workflow'],
      specs: ['templates', 'workflows', 'conventions'],
    },
    slack: {
      keywords: ['slack', 'channel', 'message', 'bot', 'webhook'],
      specs: ['bot-patterns', 'message-formats', 'integrations'],
    },
  } as const;

  /**
   * Detect relevant integrations from prompt
   */
  static async detectIntegrations(prompt: string): Promise<DetectedIntegration[]> {
    const detected: DetectedIntegration[] = [];
    const lowerPrompt = prompt.toLowerCase();

    for (const [integration, config] of Object.entries(this.INTEGRATION_PATTERNS)) {
      const matches = config.keywords.filter(keyword => lowerPrompt.includes(keyword));
      
      if (matches.length > 0) {
        const confidence = matches.length / config.keywords.length;
        const specs = await this.extractSpecs(integration as keyof typeof this.INTEGRATION_PATTERNS);
        
        detected.push({
          name: integration,
          confidence,
          matchedKeywords: matches,
          availableSpecs: specs,
        });
      }
    }

    return detected.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract relevant specs for detected integrations
   */
  private static async extractSpecs(integration: keyof typeof ContextDetector.INTEGRATION_PATTERNS): Promise<IntegrationSpec[]> {
    try {
      // Try to fetch integration specs from API or local config
      const specs = await this.fetchIntegrationSpecs(integration);
      return specs;
    } catch (error) {
      // Fallback to default specs
      return this.getDefaultSpecs(integration);
    }
  }

  /**
   * Fetch integration specs from API
   */
  private static async fetchIntegrationSpecs(integration: string): Promise<IntegrationSpec[]> {
    try {
      const { data } = await apiClient.get(`/integrations/${integration}/specs`);
      return data.specs || [];
    } catch (error) {
      throw new Error(`Failed to fetch ${integration} specs`);
    }
  }

  /**
   * Get default specs for integration
   */
  private static getDefaultSpecs(integration: keyof typeof ContextDetector.INTEGRATION_PATTERNS): IntegrationSpec[] {
    const defaultSpecs: Record<string, IntegrationSpec[]> = {
      notion: [
        {
          type: 'colors',
          name: 'Notion Color Palette',
          content: {
            primary: '#2F3437',
            secondary: '#787774',
            accent: '#2383E2',
            background: '#FFFFFF',
          },
        },
        {
          type: 'components',
          name: 'Database Properties',
          content: {
            title: 'Title property for main content',
            select: 'Single select for categories',
            multiSelect: 'Multi-select for tags',
            date: 'Date property for timestamps',
          },
        },
      ],
      figma: [
        {
          type: 'design-tokens',
          name: 'Design System Tokens',
          content: {
            spacing: '4px, 8px, 16px, 24px, 32px',
            typography: 'Inter, SF Pro, system fonts',
            borderRadius: '4px, 8px, 12px',
          },
        },
      ],
      github: [
        {
          type: 'templates',
          name: 'Issue Templates',
          content: {
            bug: 'Bug report template with reproduction steps',
            feature: 'Feature request with use case description',
          },
        },
      ],
      slack: [
        {
          type: 'bot-patterns',
          name: 'Bot Interaction Patterns',
          content: {
            commands: 'Slash commands for quick actions',
            interactive: 'Buttons and modals for complex flows',
          },
        },
      ],
    };

    return defaultSpecs[integration] || [];
  }

  /**
   * Display detected integrations
   */
  static displayDetectedIntegrations(integrations: DetectedIntegration[]): string {
    if (integrations.length === 0) {
      return colors.dim('No integrations detected');
    }

    const lines = integrations.map(integration => {
      const confidence = Math.round(integration.confidence * 100);
      const specs = integration.availableSpecs.map(spec => spec.name).join(', ');
      
      return `  • ${colors.highlight(integration.name)} ${colors.dim(`(${confidence}% match)`)}` +
             (specs ? `\n    ${colors.dim('Available:')} ${colors.primary(specs)}` : '');
    });

    return colors.primary('🔍 Auto-detected integrations:') + '\n' + lines.join('\n');
  }

  /**
   * Generate context-enhanced prompt
   */
  static enhancePromptWithContext(originalPrompt: string, integrations: DetectedIntegration[]): string {
    if (integrations.length === 0) {
      return originalPrompt;
    }

    const contextAdditions: string[] = [];

    integrations.forEach(integration => {
      integration.availableSpecs.forEach(spec => {
        if (spec.type === 'colors' && typeof spec.content === 'object') {
          const colorInfo = Object.entries(spec.content)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          contextAdditions.push(`Use ${integration.name} colors: ${colorInfo}`);
        }
        
        if (spec.type === 'components' && typeof spec.content === 'object') {
          const componentInfo = Object.keys(spec.content).join(', ');
          contextAdditions.push(`Include ${integration.name} components: ${componentInfo}`);
        }
      });
    });

    if (contextAdditions.length === 0) {
      return originalPrompt;
    }

    return originalPrompt + '. ' + contextAdditions.join('. ');
  }
}

/**
 * Types for context detection
 */
export interface DetectedIntegration {
  name: string;
  confidence: number;
  matchedKeywords: string[];
  availableSpecs: IntegrationSpec[];
}

export interface IntegrationSpec {
  type: string;
  name: string;
  content: Record<string, any>;
}

export default ContextDetector;