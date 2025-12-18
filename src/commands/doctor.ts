import { Command, Flags } from '@oclif/core';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/apiClient';
import { configManager } from '../lib/config';
import colors from '../utils/colors';
import ui from '../utils/ui';
import jsonOutput from '../utils/json-output';
import boxes from '../utils/boxes';

/**
 * Diagnostic check result
 */
interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  suggestion?: string;
}

/**
 * Overall diagnostic result
 */
interface DiagnosticResult {
  checks: DiagnosticCheck[];
  overallStatus: 'healthy' | 'issues' | 'critical';
  timestamp: string;
}

export default class Doctor extends Command {
  static description = 'Run diagnostics to check PBCLI health and configuration';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  static flags = {
    json: Flags.boolean({
      description: 'Output results in JSON format',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Doctor);

    if (!flags.json) {
      console.log('');
      console.log(colors.heading('🏥 PBCLI Health Check'));
      console.log('');
      console.log(colors.dim('Running diagnostics...'));
      console.log('');
    }

    // Run all diagnostic checks
    const checks: DiagnosticCheck[] = [];

    checks.push(await this.checkAuth());
    checks.push(await this.checkConnectivity());
    checks.push(await this.checkConfig());
    checks.push(await this.checkVersion());

    // Calculate overall status
    const overallStatus = this.calculateOverallStatus(checks);

    const result: DiagnosticResult = {
      checks,
      overallStatus,
      timestamp: new Date().toISOString(),
    };

    // Output results
    if (flags.json) {
      jsonOutput.success(result);
    } else {
      this.displayResults(result);
    }

    // Exit with appropriate code
    if (overallStatus === 'critical') {
      process.exit(1);
    }
  }

  /**
   * Check authentication status
   */
  private async checkAuth(): Promise<DiagnosticCheck> {
    try {
      const session = await auth.loadSession();

      if (!session) {
        return {
          name: 'Authentication',
          status: 'fail',
          message: 'Not logged in',
          suggestion: 'Run: pb login',
        };
      }

      // Check if token needs refresh
      const needsRefresh = await auth.needsRefresh();
      if (needsRefresh) {
        const refreshed = await auth.refreshToken();
        if (!refreshed) {
          return {
            name: 'Authentication',
            status: 'fail',
            message: 'Session expired and refresh failed',
            suggestion: 'Run: pb login',
          };
        }
      }

      const timeUntilExpiry = await auth.getTimeUntilExpiry();
      const hoursRemaining = timeUntilExpiry ? Math.floor(timeUntilExpiry / 3600) : 0;

      return {
        name: 'Authentication',
        status: 'pass',
        message: `Logged in as ${session.email || session.user_id} (${hoursRemaining}h remaining)`,
      };
    } catch (error) {
      return {
        name: 'Authentication',
        status: 'fail',
        message: 'Failed to check authentication',
        suggestion: 'Try logging in again: pb login',
      };
    }
  }

  /**
   * Check API connectivity
   */
  private async checkConnectivity(): Promise<DiagnosticCheck> {
    try {
      const response = await apiClient.get('/health', { timeout: 5000 });

      if (response.status === 200) {
        return {
          name: 'API Connectivity',
          status: 'pass',
          message: 'Connected to PromptBrain API',
        };
      }

      return {
        name: 'API Connectivity',
        status: 'warning',
        message: `API returned status ${response.status}`,
        suggestion: 'API may be experiencing issues',
      };
    } catch (error: any) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          name: 'API Connectivity',
          status: 'fail',
          message: 'Cannot reach PromptBrain API',
          suggestion: 'Check your internet connection',
        };
      }

      if (error.code === 'ETIMEDOUT') {
        return {
          name: 'API Connectivity',
          status: 'fail',
          message: 'API request timed out',
          suggestion: 'Check your internet connection or try again later',
        };
      }

      return {
        name: 'API Connectivity',
        status: 'warning',
        message: `Connection issue: ${error.message}`,
        suggestion: 'Check your network settings',
      };
    }
  }

  /**
   * Check configuration validity
   */
  private async checkConfig(): Promise<DiagnosticCheck> {
    try {
      const config = await configManager.load();

      // Validate required config fields
      if (!config.api?.baseUrl) {
        return {
          name: 'Configuration',
          status: 'fail',
          message: 'Missing API base URL in configuration',
          suggestion: 'Run: pb config reset',
        };
      }

      // Check for reasonable values
      if (config.api.timeout < 1000 || config.api.timeout > 60000) {
        return {
          name: 'Configuration',
          status: 'warning',
          message: 'API timeout value is unusual',
          suggestion: 'Consider resetting config: pb config reset',
        };
      }

      return {
        name: 'Configuration',
        status: 'pass',
        message: 'Configuration is valid',
      };
    } catch (error) {
      return {
        name: 'Configuration',
        status: 'fail',
        message: 'Failed to load configuration',
        suggestion: 'Try resetting config: pb config reset',
      };
    }
  }

  /**
   * Check CLI version and updates
   */
  private async checkVersion(): Promise<DiagnosticCheck> {
    try {
      const currentVersion = this.config.version;

      // For now, just confirm version is available
      // In the future, could check for updates
      if (currentVersion) {
        return {
          name: 'Version',
          status: 'pass',
          message: `PBCLI v${currentVersion}`,
        };
      }

      return {
        name: 'Version',
        status: 'warning',
        message: 'Could not determine CLI version',
      };
    } catch (error) {
      return {
        name: 'Version',
        status: 'warning',
        message: 'Version check failed',
      };
    }
  }

  /**
   * Calculate overall status from individual checks
   */
  private calculateOverallStatus(checks: DiagnosticCheck[]): 'healthy' | 'issues' | 'critical' {
    const hasCritical = checks.some(c => c.status === 'fail');
    const hasWarnings = checks.some(c => c.status === 'warning');

    if (hasCritical) return 'critical';
    if (hasWarnings) return 'issues';
    return 'healthy';
  }

  /**
   * Display diagnostic results
   */
  private displayResults(result: DiagnosticResult): void {
    // Display each check
    result.checks.forEach(check => {
      let statusIcon: string;
      let statusColor: (text: string) => string;

      switch (check.status) {
        case 'pass':
          statusIcon = '✓';
          statusColor = colors.success;
          break;
        case 'warning':
          statusIcon = '⚠';
          statusColor = colors.warning;
          break;
        case 'fail':
          statusIcon = '✗';
          statusColor = colors.error;
          break;
      }

      console.log(statusColor(`${statusIcon} ${check.name}`));
      console.log(`  ${check.message}`);

      if (check.suggestion) {
        console.log(colors.dim(`  💡 ${check.suggestion}`));
      }

      console.log('');
    });

    // Display overall status with rich boxes
    console.log('');

    switch (result.overallStatus) {
      case 'healthy':
        console.log(boxes.success(
          'All systems are running perfectly!\nPBCLI is ready to enhance your prompts.',
          'System Status: Healthy'
        ));
        break;
      case 'issues':
        console.log(boxes.warning(
          'Some non-critical issues were detected.\nPBCLI should work, but you may experience reduced functionality.',
          'System Status: Issues Detected'
        ));
        break;
      case 'critical':
        console.log(boxes.error(
          'Critical issues prevent PBCLI from working properly.\nPlease address the issues above before continuing.',
          'System Status: Critical'
        ));
        break;
    }

    console.log('');
  }
}
