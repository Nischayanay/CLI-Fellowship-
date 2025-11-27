import { Command, Flags } from '@oclif/core';
import { checkForUpdate, detectInstallMethod, getUpdateInstructions, compareVersions } from '../lib/version-checker';
import colors from '../utils/colors';
import progress from '../utils/progress';
import ui from '../utils/ui';
import jsonOutput from '../utils/json-output';
import { logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default class Update extends Command {
  static description = 'Update PBCLI to the latest version';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --check',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    check: Flags.boolean({
      description: 'Check for updates without installing',
      default: false,
    }),
    force: Flags.boolean({
      description: 'Force update even if already on latest version',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output results in JSON format',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Update);
    const currentVersion = this.config.version;
    const installMethod = detectInstallMethod();

    if (!flags.json) {
      console.log('');
      console.log(colors.heading('🔄 PBCLI Update'));
      console.log('');
    }

    // Check for updates
    if (!flags.json) {
      progress.start('Checking for updates...');
    }

    const versionInfo = await checkForUpdate(currentVersion, true);

    if (!flags.json) {
      progress.stop();
    }

    // Display version information
    if (flags.json) {
      jsonOutput.success({
        current_version: versionInfo.current,
        latest_version: versionInfo.latest,
        update_available: versionInfo.updateAvailable,
        install_method: installMethod,
        release_url: versionInfo.releaseUrl,
      });
      return;
    }

    console.log('');
    ui.keyValue('Current Version', colors.primary(`v${versionInfo.current}`));
    ui.keyValue('Latest Version', colors.primary(`v${versionInfo.latest}`));
    ui.keyValue('Install Method', colors.metadata(installMethod));
    console.log('');

    // Check if update is available
    if (!versionInfo.updateAvailable && !flags.force) {
      console.log(colors.statusSuccess('You are already on the latest version!'));
      console.log('');
      return;
    }

    if (versionInfo.updateAvailable) {
      console.log(colors.success(`✨ New version available: v${versionInfo.latest}`));
      console.log('');
    }

    // If only checking, stop here
    if (flags.check) {
      if (versionInfo.updateAvailable) {
        ui.tip(`Update with: ${getUpdateInstructions(installMethod)}`);
      }
      console.log('');
      return;
    }

    // Perform update based on installation method
    await this.performUpdate(installMethod, versionInfo.latest, flags.force);
  }

  /**
   * Perform update based on installation method
   */
  private async performUpdate(method: string, latestVersion: string, force: boolean): Promise<void> {
    switch (method) {
      case 'npm':
        await this.updateNpm(latestVersion, force);
        break;
      case 'homebrew':
        await this.updateHomebrew();
        break;
      case 'local':
        await this.updateLocal();
        break;
      default:
        console.log(colors.statusWarning('Unable to determine installation method'));
        ui.tip('Please update manually using one of these methods:');
        console.log('');
        console.log(colors.dim('  npm:      npm install -g promptbrain-cli@latest'));
        console.log(colors.dim('  Homebrew: brew upgrade pb'));
        console.log('');
    }
  }

  /**
   * Update via npm
   */
  private async updateNpm(latestVersion: string, force: boolean): Promise<void> {
    try {
      progress.start('Updating via npm...');

      const command = force
        ? 'npm install -g promptbrain-cli@latest --force'
        : 'npm install -g promptbrain-cli@latest';

      await execAsync(command);

      progress.succeed(`Updated to v${latestVersion}`);
      console.log('');
      ui.goodNews('PBCLI has been updated successfully!');
      ui.tip('Restart your terminal or run "pb --version" to verify.');
      console.log('');
    } catch (error: any) {
      progress.fail('Update failed');
      console.log('');
      logger.error(`Failed to update: ${error.message}`);
      ui.tip('Try updating manually: npm install -g promptbrain-cli@latest');
      console.log('');
      process.exit(1);
    }
  }

  /**
   * Update via Homebrew
   */
  private async updateHomebrew(): Promise<void> {
    try {
      progress.start('Updating via Homebrew...');

      // Update Homebrew first
      await execAsync('brew update');

      // Upgrade pb
      const { stdout } = await execAsync('brew upgrade pb');

      progress.succeed('Updated successfully');
      console.log('');
      ui.goodNews('PBCLI has been updated via Homebrew!');
      
      if (stdout.includes('already installed')) {
        ui.tip('You were already on the latest version.');
      }
      
      console.log('');
    } catch (error: any) {
      progress.fail('Update failed');
      console.log('');

      if (error.message.includes('already installed')) {
        console.log(colors.statusSuccess('You are already on the latest version!'));
      } else {
        logger.error(`Failed to update: ${error.message}`);
        ui.tip('Try updating manually: brew upgrade pb');
      }
      
      console.log('');
    }
  }

  /**
   * Update local development installation
   */
  private async updateLocal(): Promise<void> {
    console.log(colors.statusWarning('Local development installation detected'));
    console.log('');
    ui.tip('Update your local installation:');
    console.log('');
    console.log(colors.dim('  1. git pull'));
    console.log(colors.dim('  2. npm install'));
    console.log(colors.dim('  3. npm run build'));
    console.log('');
  }
}
