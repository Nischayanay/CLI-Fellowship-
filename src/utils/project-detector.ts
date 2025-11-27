import fs from 'fs-extra';
import path from 'path';

export type ProjectFramework = 
  | 'Next.js' 
  | 'Remix' 
  | 'Nuxt' 
  | 'Laravel' 
  | 'FastAPI' 
  | 'Vite' 
  | 'Astro' 
  | 'React' 
  | 'Node' 
  | 'Supabase' 
  | 'Unknown';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export interface ProjectInfo {
  framework: ProjectFramework;
  version?: string;
  packageManager: PackageManager;
  hasSupabase: boolean;
  hasDatabase: boolean;
  configFiles: string[];
}

export const projectDetector = {
  /**
   * Detect project framework and configuration
   */
  detect: async (cwd: string = process.cwd()): Promise<ProjectInfo> => {
    const framework = await detectFramework(cwd);
    const packageManager = await detectPackageManager(cwd);
    const hasSupabase = await detectSupabase(cwd);
    const hasDatabase = await detectDatabase(cwd);
    const configFiles = await findConfigFiles(cwd);

    return {
      framework: framework.framework,
      version: framework.version,
      packageManager,
      hasSupabase,
      hasDatabase,
      configFiles,
    };
  },

  /**
   * Get recommended templates for framework
   */
  getRecommendedTemplates(framework: ProjectFramework): string[] {
    const templates: Record<ProjectFramework, string[]> = {
      'Next.js': ['nextjs-api-route', 'nextjs-component', 'nextjs-page'],
      'Remix': ['remix-loader', 'remix-action', 'remix-route'],
      'Nuxt': ['nuxt-composable', 'nuxt-page', 'nuxt-api'],
      'Laravel': ['laravel-controller', 'laravel-model', 'laravel-migration'],
      'FastAPI': ['fastapi-endpoint', 'fastapi-model', 'fastapi-router'],
      'Vite': ['vite-component', 'vite-config'],
      'Astro': ['astro-component', 'astro-page'],
      'React': ['react-component', 'react-hook'],
      'Node': ['node-express', 'node-api'],
      'Supabase': ['supabase-function', 'supabase-migration'],
      'Unknown': [],
    };

    return templates[framework] || [];
  },

  /**
   * Get framework-specific tips
   */
  getFrameworkTips(framework: ProjectFramework): string[] {
    const tips: Record<ProjectFramework, string[]> = {
      'Next.js': [
        'Try: pb enhance "create Next.js API route"',
        'Try: pb devsync for context-aware development',
        'Templates loaded: nextjs-api-route, nextjs-component, nextjs-page',
      ],
      'Remix': [
        'Try: pb enhance "create Remix loader"',
        'Try: pb devsync for Remix-specific context',
        'Templates loaded: remix-loader, remix-action, remix-route',
      ],
      'Nuxt': [
        'Try: pb enhance "create Nuxt composable"',
        'Try: pb devsync for Nuxt-specific context',
        'Templates loaded: nuxt-composable, nuxt-page, nuxt-api',
      ],
      'Laravel': [
        'Try: pb enhance "create Laravel controller"',
        'Try: pb devsync for Laravel-specific context',
        'Templates loaded: laravel-controller, laravel-model, laravel-migration',
      ],
      'FastAPI': [
        'Try: pb enhance "create FastAPI endpoint"',
        'Try: pb devsync for FastAPI-specific context',
        'Templates loaded: fastapi-endpoint, fastapi-model, fastapi-router',
      ],
      'Vite': [
        'Try: pb enhance "create Vite component"',
        'Try: pb devsync for Vite-specific context',
      ],
      'Astro': [
        'Try: pb enhance "create Astro component"',
        'Try: pb devsync for Astro-specific context',
      ],
      'React': [
        'Try: pb enhance "create React component"',
        'Try: pb devsync for React-specific context',
      ],
      'Node': [
        'Try: pb enhance "create Express API endpoint"',
        'Try: pb devsync for Node.js-specific context',
      ],
      'Supabase': [
        'Try: pb enhance "create Supabase Edge Function"',
        'Try: pb devsync for Supabase-specific context',
      ],
      'Unknown': [
        'Try: pb enhance "your prompt here"',
        'Try: pb devsync for context-aware development',
      ],
    };

    return tips[framework] || [];
  },
};

/**
 * Detect framework from project files
 */
async function detectFramework(cwd: string): Promise<{ framework: ProjectFramework; version?: string }> {
  // Check for Next.js
  if (await fs.pathExists(path.join(cwd, 'next.config.js')) ||
      await fs.pathExists(path.join(cwd, 'next.config.mjs')) ||
      await fs.pathExists(path.join(cwd, 'next.config.ts'))) {
    const version = await getPackageVersion(cwd, 'next');
    return { framework: 'Next.js', version };
  }

  // Check for Remix
  if (await fs.pathExists(path.join(cwd, 'remix.config.js')) ||
      await fs.pathExists(path.join(cwd, 'remix.config.ts'))) {
    const version = await getPackageVersion(cwd, '@remix-run/react');
    return { framework: 'Remix', version };
  }

  // Check for Nuxt
  if (await fs.pathExists(path.join(cwd, 'nuxt.config.js')) ||
      await fs.pathExists(path.join(cwd, 'nuxt.config.ts'))) {
    const version = await getPackageVersion(cwd, 'nuxt');
    return { framework: 'Nuxt', version };
  }

  // Check for Astro
  if (await fs.pathExists(path.join(cwd, 'astro.config.mjs')) ||
      await fs.pathExists(path.join(cwd, 'astro.config.ts'))) {
    const version = await getPackageVersion(cwd, 'astro');
    return { framework: 'Astro', version };
  }

  // Check for Laravel
  if (await fs.pathExists(path.join(cwd, 'artisan')) &&
      await fs.pathExists(path.join(cwd, 'composer.json'))) {
    try {
      const composer = await fs.readJson(path.join(cwd, 'composer.json'));
      if (composer.require?.['laravel/framework']) {
        return { framework: 'Laravel', version: composer.require['laravel/framework'] };
      }
    } catch {
      // Ignore
    }
    return { framework: 'Laravel' };
  }

  // Check for FastAPI
  if (await fs.pathExists(path.join(cwd, 'main.py'))) {
    try {
      const mainPy = await fs.readFile(path.join(cwd, 'main.py'), 'utf-8');
      if (mainPy.includes('from fastapi import') || mainPy.includes('import fastapi')) {
        return { framework: 'FastAPI' };
      }
    } catch {
      // Ignore
    }
  }

  // Check for FastAPI in requirements
  if (await fs.pathExists(path.join(cwd, 'requirements.txt'))) {
    try {
      const requirements = await fs.readFile(path.join(cwd, 'requirements.txt'), 'utf-8');
      if (requirements.includes('fastapi')) {
        return { framework: 'FastAPI' };
      }
    } catch {
      // Ignore
    }
  }

  // Check for FastAPI in pyproject.toml
  if (await fs.pathExists(path.join(cwd, 'pyproject.toml'))) {
    try {
      const pyproject = await fs.readFile(path.join(cwd, 'pyproject.toml'), 'utf-8');
      if (pyproject.includes('fastapi')) {
        return { framework: 'FastAPI' };
      }
    } catch {
      // Ignore
    }
  }

  // Check package.json for other frameworks
  const pkgPath = path.join(cwd, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['vite']) return { framework: 'Vite', version: deps['vite'] };
      if (deps['react']) return { framework: 'React', version: deps['react'] };
      if (deps['@supabase/supabase-js']) return { framework: 'Supabase', version: deps['@supabase/supabase-js'] };

      return { framework: 'Node' };
    } catch {
      // Ignore
    }
  }

  return { framework: 'Unknown' };
}

/**
 * Detect package manager
 */
async function detectPackageManager(cwd: string): Promise<PackageManager> {
  if (await fs.pathExists(path.join(cwd, 'bun.lockb'))) return 'bun';
  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

/**
 * Detect Supabase integration
 */
async function detectSupabase(cwd: string): Promise<boolean> {
  if (await fs.pathExists(path.join(cwd, 'supabase'))) return true;
  
  const pkgPath = path.join(cwd, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return !!deps['@supabase/supabase-js'];
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Detect database usage
 */
async function detectDatabase(cwd: string): Promise<boolean> {
  const pkgPath = path.join(cwd, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      const dbPackages = [
        'prisma',
        '@prisma/client',
        'mongoose',
        'sequelize',
        'typeorm',
        'pg',
        'mysql',
        'mysql2',
        'sqlite3',
        '@supabase/supabase-js',
      ];

      return dbPackages.some(pkg => deps[pkg]);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Find configuration files
 */
async function findConfigFiles(cwd: string): Promise<string[]> {
  const configFiles: string[] = [];
  const possibleConfigs = [
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
    'remix.config.js',
    'remix.config.ts',
    'nuxt.config.js',
    'nuxt.config.ts',
    'astro.config.mjs',
    'astro.config.ts',
    'vite.config.js',
    'vite.config.ts',
    'tsconfig.json',
    '.env',
    '.env.local',
  ];

  for (const file of possibleConfigs) {
    if (await fs.pathExists(path.join(cwd, file))) {
      configFiles.push(file);
    }
  }

  return configFiles;
}

/**
 * Get package version from package.json
 */
async function getPackageVersion(cwd: string, packageName: string): Promise<string | undefined> {
  const pkgPath = path.join(cwd, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      return deps[packageName];
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export default projectDetector;
