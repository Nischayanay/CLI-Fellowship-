/**
 * Project Detection Module
 * Automatically detects project frameworks and technologies
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface ProjectInfo {
  frameworks: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';
  projectType: string;
  hasTypeScript: boolean;
  detectedAt: string;
}

export interface FrameworkDetection {
  name: string;
  detected: boolean;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
}

/**
 * Detect project frameworks and technologies
 */
export async function detectProject(projectPath: string = process.cwd()): Promise<ProjectInfo> {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  // Default project info
  const projectInfo: ProjectInfo = {
    frameworks: [],
    dependencies: {},
    devDependencies: {},
    packageManager: 'unknown',
    projectType: 'unknown',
    hasTypeScript: false,
    detectedAt: new Date().toISOString(),
  };

  // Check if package.json exists
  if (!await fs.pathExists(packageJsonPath)) {
    return projectInfo;
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Extract dependencies
    projectInfo.dependencies = packageJson.dependencies || {};
    projectInfo.devDependencies = packageJson.devDependencies || {};

    // Detect frameworks
    projectInfo.frameworks = detectFrameworks(projectInfo.dependencies, projectInfo.devDependencies);

    // Detect package manager
    projectInfo.packageManager = await detectPackageManager(projectPath);

    // Detect project type
    projectInfo.projectType = detectProjectType(projectInfo.frameworks, packageJson);

    // Check for TypeScript
    projectInfo.hasTypeScript = 
      'typescript' in projectInfo.dependencies ||
      'typescript' in projectInfo.devDependencies ||
      await fs.pathExists(path.join(projectPath, 'tsconfig.json'));

    return projectInfo;
  } catch (error) {
    return projectInfo;
  }
}

/**
 * Detect frameworks from dependencies
 */
function detectFrameworks(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>
): string[] {
  const allDeps = { ...dependencies, ...devDependencies };
  const frameworks: string[] = [];

  // Framework detection rules
  const frameworkRules: Record<string, string[]> = {
    'Next.js': ['next'],
    'React': ['react', 'react-dom'],
    'Vue': ['vue'],
    'Svelte': ['svelte'],
    'Angular': ['@angular/core'],
    'Nuxt': ['nuxt'],
    'Remix': ['@remix-run/react'],
    'Astro': ['astro'],
    'Vite': ['vite'],
    'Express': ['express'],
    'Fastify': ['fastify'],
    'NestJS': ['@nestjs/core'],
    'Supabase': ['@supabase/supabase-js'],
    'Prisma': ['prisma', '@prisma/client'],
    'tRPC': ['@trpc/server'],
    'GraphQL': ['graphql'],
    'Apollo': ['@apollo/client', 'apollo-server'],
    'Tailwind CSS': ['tailwindcss'],
    'Electron': ['electron'],
    'React Native': ['react-native'],
    'Expo': ['expo'],
  };

  for (const [framework, indicators] of Object.entries(frameworkRules)) {
    if (indicators.some(indicator => indicator in allDeps)) {
      frameworks.push(framework);
    }
  }

  return frameworks;
}

/**
 * Detect package manager
 */
async function detectPackageManager(projectPath: string): Promise<'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown'> {
  // Check for lock files
  if (await fs.pathExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await fs.pathExists(path.join(projectPath, 'yarn.lock'))) {
    return 'yarn';
  }
  if (await fs.pathExists(path.join(projectPath, 'bun.lockb'))) {
    return 'bun';
  }
  if (await fs.pathExists(path.join(projectPath, 'package-lock.json'))) {
    return 'npm';
  }

  return 'unknown';
}

/**
 * Detect project type
 */
function detectProjectType(frameworks: string[], packageJson: any): string {
  // Check for specific project types
  if (frameworks.includes('Next.js')) return 'Next.js Application';
  if (frameworks.includes('Remix')) return 'Remix Application';
  if (frameworks.includes('Astro')) return 'Astro Application';
  if (frameworks.includes('Nuxt')) return 'Nuxt Application';
  if (frameworks.includes('React Native') || frameworks.includes('Expo')) return 'Mobile Application';
  if (frameworks.includes('Electron')) return 'Desktop Application';
  if (frameworks.includes('React') || frameworks.includes('Vue') || frameworks.includes('Svelte')) return 'Web Application';
  if (frameworks.includes('Express') || frameworks.includes('Fastify') || frameworks.includes('NestJS')) return 'Backend Service';
  
  // Check package.json type
  if (packageJson.type === 'module') return 'ES Module Project';
  
  return 'Node.js Project';
}

/**
 * Get detailed framework detection
 */
export async function getFrameworkDetection(projectPath: string = process.cwd()): Promise<FrameworkDetection[]> {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    return [];
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath);
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const detections: FrameworkDetection[] = [];

    // Next.js
    if ('next' in allDeps) {
      detections.push({
        name: 'Next.js',
        detected: true,
        confidence: 'high',
        indicators: ['next package', 'pages/ or app/ directory'],
      });
    }

    // Supabase
    if ('@supabase/supabase-js' in allDeps) {
      detections.push({
        name: 'Supabase',
        detected: true,
        confidence: 'high',
        indicators: ['@supabase/supabase-js package'],
      });
    }

    // Vite
    if ('vite' in allDeps) {
      detections.push({
        name: 'Vite',
        detected: true,
        confidence: 'high',
        indicators: ['vite package', 'vite.config file'],
      });
    }

    // Astro
    if ('astro' in allDeps) {
      detections.push({
        name: 'Astro',
        detected: true,
        confidence: 'high',
        indicators: ['astro package', 'astro.config file'],
      });
    }

    // Remix
    if ('@remix-run/react' in allDeps) {
      detections.push({
        name: 'Remix',
        detected: true,
        confidence: 'high',
        indicators: ['@remix-run/react package'],
      });
    }

    // Express
    if ('express' in allDeps) {
      detections.push({
        name: 'Express',
        detected: true,
        confidence: 'high',
        indicators: ['express package'],
      });
    }

    return detections;
  } catch (error) {
    return [];
  }
}

/**
 * Save project info to .promptbrain/project.json
 */
export async function saveProjectInfo(projectInfo: ProjectInfo, projectPath: string = process.cwd()): Promise<void> {
  const pbDir = path.join(projectPath, '.promptbrain');
  const projectFile = path.join(pbDir, 'project.json');

  await fs.ensureDir(pbDir);
  await fs.writeJson(projectFile, projectInfo, { spaces: 2 });
}

/**
 * Load project info from .promptbrain/project.json
 */
export async function loadProjectInfo(projectPath: string = process.cwd()): Promise<ProjectInfo | null> {
  const projectFile = path.join(projectPath, '.promptbrain', 'project.json');

  if (!await fs.pathExists(projectFile)) {
    return null;
  }

  try {
    return await fs.readJson(projectFile);
  } catch (error) {
    return null;
  }
}

/**
 * Get project summary for display
 */
export function getProjectSummary(projectInfo: ProjectInfo): string {
  const lines: string[] = [];

  lines.push(`Project Type: ${projectInfo.projectType}`);
  
  if (projectInfo.frameworks.length > 0) {
    lines.push(`Frameworks: ${projectInfo.frameworks.join(', ')}`);
  }

  if (projectInfo.packageManager !== 'unknown') {
    lines.push(`Package Manager: ${projectInfo.packageManager}`);
  }

  if (projectInfo.hasTypeScript) {
    lines.push('TypeScript: Yes');
  }

  return lines.join('\n');
}
