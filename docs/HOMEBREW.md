# Homebrew Installation Guide

Complete guide for installing and managing PBCLI via Homebrew on macOS.

## Quick Start

```bash
brew tap promptbrain/tap
brew install pb
```

## Prerequisites

- macOS 10.15 (Catalina) or later
- Homebrew installed ([install guide](https://brew.sh))
- Xcode Command Line Tools (installed automatically by Homebrew)

## Installation

### Step 1: Add the PromptBrain Tap

```bash
brew tap promptbrain/tap
```

This adds the PromptBrain Homebrew repository to your system.

### Step 2: Install PBCLI

```bash
brew install pb
```

### Step 3: Verify Installation

```bash
pb --version
```

You should see output like:
```
promptbrain-cli/0.1.0 darwin-arm64 node-v18.0.0
```

## Updating

### Automatic Update Check

PBCLI will notify you when updates are available:

```bash
pb update --check
```

### Update via Homebrew

```bash
brew upgrade pb
```

### Update via PBCLI

```bash
pb update
```

This will detect you're using Homebrew and run `brew upgrade pb` automatically.

## Uninstallation

```bash
brew uninstall pb
brew untap promptbrain/tap
```

## Architecture Support

The Homebrew formula supports both Intel and Apple Silicon Macs:

- **Intel (x86_64):** Fully supported
- **Apple Silicon (ARM64):** Fully supported via Rosetta 2 or native Node.js

## Troubleshooting

### Formula Not Found

If you get "Error: No available formula with the name 'pb'":

1. Update Homebrew:
   ```bash
   brew update
   ```

2. Verify the tap is added:
   ```bash
   brew tap
   ```
   Should show `promptbrain/tap`

3. Re-add the tap:
   ```bash
   brew untap promptbrain/tap
   brew tap promptbrain/tap
   brew install pb
   ```

### Permission Issues

If you encounter permission errors:

```bash
sudo chown -R $(whoami) $(brew --prefix)/*
```

### Conflicting Installations

If you have both npm and Homebrew installations:

1. **Check which one is active:**
   ```bash
   which pb
   ```

2. **Uninstall npm version (if desired):**
   ```bash
   npm uninstall -g promptbrain-cli
   ```

3. **Reinstall via Homebrew:**
   ```bash
   brew reinstall pb
   ```

### Node.js Version Issues

The Homebrew formula depends on `node@18`. If you have issues:

```bash
brew install node@18
brew link node@18
```

## Advanced Usage

### Install Specific Version

```bash
brew install pb@0.1.0
```

### Pin Version (Prevent Auto-Updates)

```bash
brew pin pb
```

To unpin:
```bash
brew unpin pb
```

### View Formula Information

```bash
brew info pb
```

### View Formula Source

```bash
brew cat pb
```

## Homebrew Tap Repository

The PBCLI Homebrew formula is maintained at:
https://github.com/promptbrain/homebrew-tap

### Formula Location

After tapping, the formula is located at:
```
$(brew --prefix)/Library/Taps/promptbrain/homebrew-tap/Formula/pb.rb
```

## Comparison: Homebrew vs npm

| Feature | Homebrew | npm |
|---------|----------|-----|
| Installation | `brew install pb` | `npm install -g promptbrain-cli` |
| Update | `brew upgrade pb` | `npm update -g promptbrain-cli` |
| Uninstall | `brew uninstall pb` | `npm uninstall -g promptbrain-cli` |
| Platform | macOS only | Cross-platform |
| Dependencies | Managed by Homebrew | Managed by npm |
| System Integration | Better | Good |
| Update Notifications | Via Homebrew | Via PBCLI |

**Recommendation:** Use Homebrew on macOS for better system integration and easier updates.

## Contributing

To contribute to the Homebrew formula:

1. Fork https://github.com/promptbrain/homebrew-tap
2. Make your changes to `Formula/pb.rb`
3. Test locally:
   ```bash
   brew install --build-from-source ./Formula/pb.rb
   ```
4. Submit a pull request

## Release Process

When a new version of PBCLI is released:

1. GitHub Actions automatically updates the formula
2. SHA256 checksum is calculated and updated
3. Formula is committed to the tap repository
4. Users can update via `brew upgrade pb`

## Support

- **Homebrew Issues:** https://github.com/promptbrain/homebrew-tap/issues
- **PBCLI Issues:** https://github.com/promptbrain/cli/issues
- **Homebrew Docs:** https://docs.brew.sh

## Next Steps

- [Installation Guide](./INSTALL.md)
- [Update Guide](./UPDATE.md)
- [Getting Started](../README.md)
