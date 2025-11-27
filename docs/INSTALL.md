# PBCLI Installation Guide

Official installation guide for PromptBrain CLI (PBCLI).

## Quick Install

### npm (Recommended for all platforms)

```bash
npm install -g promptbrain-cli
```

Verify installation:
```bash
pb --version
```

### Homebrew (macOS)

```bash
brew tap promptbrain/tap
brew install pb
```

Verify installation:
```bash
pb --version
```

## Installation Methods

### 1. npm Global Installation

**Requirements:**
- Node.js >= 12.0.0
- npm >= 6.0.0

**Install:**
```bash
npm install -g promptbrain-cli
```

**Update:**
```bash
npm update -g promptbrain-cli
# or
pb update
```

**Uninstall:**
```bash
npm uninstall -g promptbrain-cli
```

### 2. Homebrew (macOS)

**Requirements:**
- macOS 10.15 or later
- Homebrew installed

**First-time setup:**
```bash
# Add the PromptBrain tap
brew tap promptbrain/tap

# Install PBCLI
brew install pb
```

**Update:**
```bash
brew upgrade pb
# or
pb update
```

**Uninstall:**
```bash
brew uninstall pb
brew untap promptbrain/tap
```

### 3. From Source (Development)

**Requirements:**
- Node.js >= 12.0.0
- Git

**Install:**
```bash
# Clone the repository
git clone https://github.com/promptbrain/cli.git
cd cli

# Install dependencies
npm install

# Build
npm run build

# Link globally (optional)
npm link
```

**Update:**
```bash
cd cli
git pull
npm install
npm run build
```

## Platform-Specific Notes

### macOS

Both npm and Homebrew installations work seamlessly on macOS (Intel and Apple Silicon).

**Recommended:** Homebrew for easier updates and system integration.

### Linux

npm installation is recommended for Linux.

**Ubuntu/Debian:**
```bash
# Install Node.js if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PBCLI
sudo npm install -g promptbrain-cli
```

**Fedora/RHEL:**
```bash
# Install Node.js if not already installed
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Install PBCLI
sudo npm install -g promptbrain-cli
```

### Windows

npm installation is recommended for Windows.

**PowerShell (Administrator):**
```powershell
# Install Node.js from https://nodejs.org if not already installed

# Install PBCLI
npm install -g promptbrain-cli
```

**Command Prompt (Administrator):**
```cmd
npm install -g promptbrain-cli
```

## Verification

After installation, verify PBCLI is working:

```bash
# Check version
pb --version

# Run diagnostics
pb doctor

# View help
pb --help
```

## Troubleshooting

### Permission Errors (npm)

If you encounter permission errors during npm installation:

**macOS/Linux:**
```bash
sudo npm install -g promptbrain-cli
```

Or configure npm to use a different directory:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g promptbrain-cli
```

**Windows:**
Run PowerShell or Command Prompt as Administrator.

### Command Not Found

If `pb` command is not found after installation:

1. **Check if npm global bin is in PATH:**
   ```bash
   npm config get prefix
   ```

2. **Add to PATH (if needed):**
   
   **macOS/Linux (bash):**
   ```bash
   echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

   **macOS/Linux (zsh):**
   ```bash
   echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

   **Windows:**
   Add `%APPDATA%\npm` to your PATH environment variable.

### Homebrew Installation Issues

If Homebrew installation fails:

1. **Update Homebrew:**
   ```bash
   brew update
   ```

2. **Check tap:**
   ```bash
   brew tap
   ```
   Should show `promptbrain/tap`

3. **Reinstall:**
   ```bash
   brew uninstall pb
   brew untap promptbrain/tap
   brew tap promptbrain/tap
   brew install pb
   ```

### Node.js Version Issues

PBCLI requires Node.js >= 12.0.0. Check your version:

```bash
node --version
```

If you need to upgrade:
- **macOS:** `brew upgrade node` or download from https://nodejs.org
- **Linux:** Use your package manager or nvm
- **Windows:** Download from https://nodejs.org

## Getting Started

After installation:

1. **Login to your account:**
   ```bash
   pb login
   ```

2. **Enhance your first prompt:**
   ```bash
   pb enhance "write a function to sort an array"
   ```

3. **Check your quota:**
   ```bash
   pb quota
   ```

4. **View all commands:**
   ```bash
   pb --help
   ```

## Support

- **Documentation:** https://promptbrain.io/docs
- **Issues:** https://github.com/promptbrain/cli/issues
- **Discord:** https://discord.gg/promptbrain

## Next Steps

- [Configuration Guide](./CONFIG.md)
- [Command Reference](./COMMANDS.md)
- [Update Guide](./UPDATE.md)
