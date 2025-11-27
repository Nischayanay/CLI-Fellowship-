/**
 * Version Checker Module
 * Checks for updates and compares versions
 */

import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

const GITHUB_API = 'https://api.github.com/repos/promptbrain/cli/releases/latest';
const VERSION_CACHE_FILE = path.join(os.homedir(), '.pb', 'version-cache.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface VersionInfo {
  current: string;
  latest: string;
  updateAvailable: boolean;
  releaseUrl: string;
  releaseNotes?: string;
  publishedAt?: string;
}

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: ReleaseAsset[];
}

interface VersionCache {
  latestVersion: string;
  checkedAt: number;
  releaseUrl: string;
}

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  // Remove 'v' prefix if present
  const clean1 = v1.replace(/^v/, '');
  const clean2 = v2.replace(/^v/, '');

  const parts1 = clean1.split('.').map(Number);
  const parts2 = clean2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Check if an update is available
 */
export async function checkForUpdate(currentVersion: string, skipCache = false): Promise<VersionInfo> {
  try {
    // Try to load from cache first
    if (!skipCache) {
      const cached = await loadVersionCache();
      if (cached && Date.now() - cached.checkedAt < CACHE_TTL) {
        return {
          current: currentVersion,
          latest: cached.latestVersion,
          updateAvailable: compareVersions(cached.latestVersion, currentVersion) > 0,
          releaseUrl: cached.releaseUrl,
        };
      }
    }

    // Fetch latest release from GitHub
    const response = await axios.get<GitHubRelease>(GITHUB_API, {
      timeout: 5000,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'promptbrain-cli',
      },
    });

    const latestVersion = response.data.tag_name.replace(/^v/, '');
    const releaseUrl = response.data.html_url;

    // Cache the result
    await saveVersionCache({
      latestVersion,
      checkedAt: Date.now(),
      releaseUrl,
    });

    return {
      current: currentVersion,
      latest: latestVersion,
      updateAvailable: compareVersions(latestVersion, currentVersion) > 0,
      releaseUrl,
      releaseNotes: response.data.body,
      publishedAt: response.data.published_at,
    };
  } catch (error) {
    // If check fails, return no update available
    return {
      current: currentVersion,
      latest: currentVersion,
      updateAvailable: false,
      releaseUrl: 'https://github.com/promptbrain/cli/releases',
    };
  }
}

/**
 * Get the latest release information
 */
export async function getLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await axios.get<GitHubRelease>(GITHUB_API, {
      timeout: 10000,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'promptbrain-cli',
      },
    });

    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Load version cache from disk
 */
async function loadVersionCache(): Promise<VersionCache | null> {
  try {
    if (await fs.pathExists(VERSION_CACHE_FILE)) {
      return await fs.readJson(VERSION_CACHE_FILE);
    }
  } catch (error) {
    // Ignore cache errors
  }
  return null;
}

/**
 * Save version cache to disk
 */
async function saveVersionCache(cache: VersionCache): Promise<void> {
  try {
    await fs.ensureDir(path.dirname(VERSION_CACHE_FILE));
    await fs.writeJson(VERSION_CACHE_FILE, cache);
  } catch (error) {
    // Ignore cache errors
  }
}

/**
 * Clear version cache
 */
export async function clearVersionCache(): Promise<void> {
  try {
    if (await fs.pathExists(VERSION_CACHE_FILE)) {
      await fs.remove(VERSION_CACHE_FILE);
    }
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Detect installation method
 */
export function detectInstallMethod(): 'npm' | 'homebrew' | 'local' | 'unknown' {
  const execPath = process.execPath;
  const scriptPath = process.argv[1];

  // Check if installed via Homebrew
  if (execPath.includes('/Cellar/') || execPath.includes('/opt/homebrew/')) {
    return 'homebrew';
  }

  // Check if running from node_modules (npm global or local)
  if (scriptPath.includes('node_modules')) {
    return 'npm';
  }

  // Check if running from local development
  if (scriptPath.includes('/bin/pb') && !scriptPath.includes('node_modules')) {
    return 'local';
  }

  return 'unknown';
}

/**
 * Get update instructions based on installation method
 */
export function getUpdateInstructions(method: string): string {
  switch (method) {
    case 'npm':
      return 'npm install -g promptbrain-cli@latest';
    case 'homebrew':
      return 'brew upgrade pb';
    case 'local':
      return 'git pull && npm run build';
    default:
      return 'pb update';
  }
}
