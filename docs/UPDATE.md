# PBCLI Update Guide

Complete guide for updating PBCLI to the latest version.

## Quick Update

```bash
pb update
```

PBCLI will automatically detect your installation method and update accordingly.

## Update Methods

### 1. Using `pb update` Command (Recommended)

The `pb update` command automatically detects how you installed PBCLI and uses the appropriate update method.

**Check for updates:**
```bash
pb update --check
```

**Install updates:**
```bash
pb update
```

**Force update (even if on latest):**
```bash
pb update --force
```

**JSON output:**
```bash
pb update --json
```

### 2. Manual Update Methods

#### npm Installation

```bash
npm update -g promptbrain-cli
```

Or install specific version:
```bash
npm install -g promptbrain-cli@latest
npm install -g promptbrain-cli@0.1.0
```

#### Homebrew Installation

```bash
brew upgrade pb
```

Or reinstall:
```bash
brew reinstall pb
```

#### From Source

```bash
cd /path/to/cli
git pull
npm install
npm run build
```

## Update Notifications

PBCLI automatically checks for updates periodically and notifies you when a new version is available.

**Disable update checks:**
```bash
pb config set checkUpdates false
```

**Enable update checks:**
```bash
pb config set checkUpdates true
```

## Version Information

**Check current version:**
```bash
pb --version
```

**Check latest available version:**
```bash
pb update --check
```

**View version details:**
```bash
pb doctor
```

## Update Behavior

### Automatic Detection

`pb update` detects your installation method:

| Installation Method | Detection | Update Command |
|---------------------|-----------|----------------|
| npm global | Checks for `node_modules` in path | `npm install -g promptbrain-cli@latest` |
| Homebrew | Checks for `/Cellar/` or `/opt/homebrew/` | `brew upgrade pb` |
| Local development | Checks for local git repository | Manual git pull + build |

### Safe Updates

- **Backup:** Your configuration and data are preserved
- **Rollback:** If update fails, previous version remains
- **Verification:** Update is verified before completion
- **Non-breaking:** Updates maintain backward compatibility

## Troubleshooting

### Update Fails

If `pb update` fails:

1. **Check internet connection:**
   ```bash
   pb doctor
   ```

2. **Try manual update:**
   ```bash
   # For npm
   npm install -g promptbrain-cli@latest --force
   
   # For Homebrew
   brew update && brew upgrade pb
   ```

3. **Clear npm cache (if npm):**
   ```bash
   npm cache clean --force
   npm install -g promptbrain-cli@latest
   ```

### Permission Errors

**npm (macOS/Linux):**
```bash
sudo npm install -g promptbrain-cli@latest
```

**npm (Windows):**
Run PowerShell as Administrator

**Homebrew:**
```bash
sudo chown -R $(whoami) $(brew --prefix)/*
brew upgrade pb
```

### Version Mismatch

If `pb --version` shows old version after update:

1. **Restart terminal**

2. **Check which pb is being used:**
   ```bash
   which pb
   ```

3. **Clear shell cache:**
   ```bash
   hash -r  # bash/zsh
   rehash   # zsh
   ```

4. **Verify installation:**
   ```bash
   pb doctor
   ```

### Conflicting Installations

If you have multiple installations:

1. **Find all installations:**
   ```bash
   # npm
   npm list -g promptbrain-cli
   
   # Homebrew
   brew list | grep pb
   
   # Manual
   which -a pb
   ```

2. **Remove unwanted installations:**
   ```bash
   # npm
   npm uninstall -g promptbrain-cli
   
   # Homebrew
   brew uninstall pb
   ```

3. **Reinstall preferred method:**
   ```bash
   # npm
   npm install -g promptbrain-cli
   
   # Homebrew
   brew install pb
   ```

## Release Channels

### Stable (Default)

```bash
npm install -g promptbrain-cli@latest
```

Recommended for production use.

### Specific Version

```bash
npm install -g promptbrain-cli@0.1.0
```

Pin to a specific version.

### Beta/Pre-release

```bash
npm install -g promptbrain-cli@beta
```

Test upcoming features (may be unstable).

## Update Frequency

- **Patch releases:** Bug fixes, weekly
- **Minor releases:** New features, monthly
- **Major releases:** Breaking changes, quarterly

## Changelog

View changes between versions:

**GitHub Releases:**
https://github.com/promptbrain/cli/releases

**In CLI:**
```bash
pb update --check
```

Shows release notes for available updates.

## Downgrading

If you need to downgrade to a previous version:

**npm:**
```bash
npm install -g promptbrain-cli@0.0.9
```

**Homebrew:**
```bash
brew uninstall pb
brew install pb@0.0.9
```

## Best Practices

1. **Regular Updates:** Update at least monthly
2. **Check Before Update:** Run `pb update --check` first
3. **Read Release Notes:** Review changes before updating
4. **Test After Update:** Run `pb doctor` after updating
5. **Backup Config:** Your config is preserved, but backup if customized

## Automated Updates

### CI/CD Pipelines

**GitHub Actions:**
```yaml
- name: Install PBCLI
  run: npm install -g promptbrain-cli@latest
```

**Docker:**
```dockerfile
RUN npm install -g promptbrain-cli@latest
```

### Scheduled Updates

**Cron (Linux/macOS):**
```bash
# Update weekly on Sunday at 2 AM
0 2 * * 0 npm update -g promptbrain-cli
```

## Support

- **Update Issues:** https://github.com/promptbrain/cli/issues
- **Documentation:** https://promptbrain.io/docs
- **Discord:** https://discord.gg/promptbrain

## Next Steps

- [Installation Guide](./INSTALL.md)
- [Configuration Guide](./CONFIG.md)
- [Command Reference](./COMMANDS.md)
