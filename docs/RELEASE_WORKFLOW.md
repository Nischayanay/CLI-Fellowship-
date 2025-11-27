# Release Workflow Documentation

Complete guide for maintainers on releasing new versions of PBCLI.

## Overview

PBCLI uses an automated release workflow that:
1. Builds and tests the CLI
2. Creates GitHub Release with artifacts
3. Publishes to npm
4. Updates Homebrew formula
5. Notifies users of updates

## Prerequisites

### Required Access

- **GitHub:** Write access to `promptbrain/cli` repository
- **npm:** Publish access to `promptbrain-cli` package
- **Homebrew:** Write access to `promptbrain/homebrew-tap` repository

### Required Secrets

Configure these in GitHub repository settings:

| Secret | Description | How to Get |
|--------|-------------|------------|
| `NPM_TOKEN` | npm authentication token | `npm login` then `npm token create` |
| `GITHUB_TOKEN` | Automatically provided | No action needed |

## Release Process

### 1. Prepare Release

**Update version and changelog:**

```bash
# Checkout main branch
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v0.2.0

# Update version in package.json
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0

# Or manually edit package.json
```

**Update CHANGELOG.md:**

```markdown
## [0.2.0] - 2024-01-15

### Added
- New feature X
- New command Y

### Changed
- Improved Z

### Fixed
- Bug fix A
```

**Commit changes:**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 0.2.0"
git push origin release/v0.2.0
```

### 2. Create Pull Request

1. Open PR from `release/v0.2.0` to `main`
2. Title: "Release v0.2.0"
3. Description: Copy changelog entries
4. Request review from team
5. Ensure all CI checks pass

### 3. Merge and Tag

**After PR approval:**

```bash
# Merge PR via GitHub UI or:
git checkout main
git merge release/v0.2.0
git push origin main

# Create and push tag
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

### 4. Automated Release

Pushing the tag triggers `.github/workflows/release.yml`:

1. **Build:** Compiles TypeScript to JavaScript
2. **Test:** Runs test suite
3. **Package:** Creates npm tarball
4. **SHA256:** Generates checksum
5. **GitHub Release:** Creates release with artifacts
6. **npm Publish:** Publishes to npm registry
7. **Homebrew Update:** Updates formula in tap repository

**Monitor progress:**
- GitHub Actions: https://github.com/promptbrain/cli/actions
- npm: https://www.npmjs.com/package/promptbrain-cli

### 5. Verify Release

**Check GitHub Release:**
```bash
# Visit: https://github.com/promptbrain/cli/releases/latest
```

**Check npm:**
```bash
npm view promptbrain-cli version
npm view promptbrain-cli
```

**Check Homebrew:**
```bash
brew update
brew info pb
```

**Test installation:**
```bash
# npm
npm install -g promptbrain-cli@latest
pb --version

# Homebrew
brew upgrade pb
pb --version
```

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR (1.0.0):** Breaking changes
- **MINOR (0.1.0):** New features, backward compatible
- **PATCH (0.0.1):** Bug fixes, backward compatible

### Examples

- `0.1.0 -> 0.1.1`: Bug fix
- `0.1.0 -> 0.2.0`: New feature
- `0.9.0 -> 1.0.0`: Stable release
- `1.0.0 -> 2.0.0`: Breaking change

## Release Types

### Patch Release (Bug Fixes)

```bash
npm version patch
git push --follow-tags
```

**Frequency:** As needed (weekly)
**Example:** 0.1.0 -> 0.1.1

### Minor Release (New Features)

```bash
npm version minor
git push --follow-tags
```

**Frequency:** Monthly
**Example:** 0.1.0 -> 0.2.0

### Major Release (Breaking Changes)

```bash
npm version major
git push --follow-tags
```

**Frequency:** Quarterly
**Example:** 0.9.0 -> 1.0.0

### Pre-release (Beta)

```bash
npm version prerelease --preid=beta
git push --follow-tags
```

**Example:** 0.1.0 -> 0.1.1-beta.0

## Manual Release (Fallback)

If automated release fails:

### 1. Build Locally

```bash
npm run build
npm pack
```

### 2. Create GitHub Release

```bash
# Install GitHub CLI
brew install gh

# Create release
gh release create v0.2.0 \
  --title "v0.2.0" \
  --notes "Release notes here" \
  promptbrain-cli-0.2.0.tgz
```

### 3. Publish to npm

```bash
npm publish
```

### 4. Update Homebrew Formula

```bash
# Clone tap repository
git clone https://github.com/promptbrain/homebrew-tap.git
cd homebrew-tap

# Generate SHA256
SHA256=$(sha256sum ../promptbrain-cli-0.2.0.tgz | awk '{print $1}')

# Update formula
sed -i "s|url \".*\"|url \"https://github.com/promptbrain/cli/archive/refs/tags/v0.2.0.tar.gz\"|" Formula/pb.rb
sed -i "s|sha256 \".*\"|sha256 \"$SHA256\"|" Formula/pb.rb

# Commit and push
git add Formula/pb.rb
git commit -m "Update pb to v0.2.0"
git push
```

## Rollback

If a release has critical issues:

### 1. Unpublish from npm (within 72 hours)

```bash
npm unpublish promptbrain-cli@0.2.0
```

### 2. Delete GitHub Release

```bash
gh release delete v0.2.0
git push --delete origin v0.2.0
```

### 3. Revert Homebrew Formula

```bash
cd homebrew-tap
git revert HEAD
git push
```

### 4. Notify Users

- Post in Discord
- Update GitHub issue
- Send email to subscribers

## Hotfix Process

For critical bugs in production:

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/v0.1.1

# Fix the bug
# ... make changes ...

# Commit and push
git add .
git commit -m "fix: critical bug description"
git push origin hotfix/v0.1.1

# Create PR, review, merge
# Tag and release
git tag -a v0.1.1 -m "Hotfix v0.1.1"
git push origin v0.1.1
```

## Release Checklist

- [ ] All tests passing
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Migration guide (if needed)
- [ ] PR reviewed and approved
- [ ] Tag created and pushed
- [ ] GitHub Release created
- [ ] npm package published
- [ ] Homebrew formula updated
- [ ] Installation tested (npm + brew)
- [ ] Update command tested
- [ ] Discord announcement posted
- [ ] Twitter announcement posted

## Troubleshooting

### GitHub Actions Fails

1. Check workflow logs
2. Verify secrets are configured
3. Re-run failed jobs
4. Manual release if needed

### npm Publish Fails

```bash
# Check authentication
npm whoami

# Re-authenticate
npm login

# Publish manually
npm publish
```

### Homebrew Formula Update Fails

```bash
# Check tap repository access
git clone https://github.com/promptbrain/homebrew-tap.git

# Update manually (see Manual Release section)
```

### SHA256 Mismatch

```bash
# Regenerate checksum
node scripts/generate-sha256.js 0.2.0

# Update formula with new checksum
```

## Best Practices

1. **Test Thoroughly:** Run full test suite before release
2. **Document Changes:** Clear changelog entries
3. **Semantic Versioning:** Follow semver strictly
4. **Backward Compatibility:** Avoid breaking changes in minor/patch
5. **Communication:** Announce releases in Discord
6. **Monitoring:** Watch for issues after release
7. **Quick Hotfixes:** Fix critical bugs immediately

## Automation

### Scheduled Releases

Consider automated releases for:
- Weekly patch releases (bug fixes)
- Monthly minor releases (features)

### Release Candidates

For major releases:
```bash
npm version premajor --preid=rc
# 0.9.0 -> 1.0.0-rc.0
```

Test RC for 1-2 weeks before stable release.

## Support

- **Release Issues:** https://github.com/promptbrain/cli/issues
- **npm Support:** https://www.npmjs.com/support
- **Homebrew Support:** https://docs.brew.sh

## Resources

- [Semantic Versioning](https://semver.org/)
- [npm Publishing](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Homebrew Formula](https://docs.brew.sh/Formula-Cookbook)
