import * as fs from 'fs-extra';
import * as path from 'path';
import colors from '../utils/colors';
import boxes from '../utils/boxes';

/**
 * Advanced project analysis for comprehensive understanding
 */
export class ProjectAnalyzer {
  private projectPath: string;
  private packageJson: any;
  private files: string[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Generate comprehensive project analysis report
   */
  async generateReport(): Promise<ProjectReport> {
    await this.scanProject();
    
    const basicInfo = await this.analyzeBasicInfo();
    const architecture = await this.analyzeArchitecture();
    const purpose = await this.analyzePurpose();
    const useCases = await this.generateUseCases();
    const techStack = await this.analyzeTechStack();
    const complexity = await this.analyzeComplexity();
    const recommendations = await this.generateRecommendations();

    return {
      basicInfo,
      architecture,
      purpose,
      useCases,
      techStack,
      complexity,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Scan project files and structure
   */
  private async scanProject(): Promise<void> {
    try {
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        this.packageJson = await fs.readJson(packageJsonPath);
      }

      // Get all files (excluding node_modules, .git, etc.)
      this.files = await this.getProjectFiles();
    } catch (error) {
      // Handle gracefully
    }
  }

  /**
   * Analyze basic project information
   */
  private async analyzeBasicInfo(): Promise<BasicInfo> {
    const name = this.packageJson?.name || path.basename(this.projectPath);
    const description = this.packageJson?.description || 'No description available';
    const version = this.packageJson?.version || '0.0.0';
    const author = this.packageJson?.author || 'Unknown';
    
    // Detect project age by checking git or file dates
    const age = await this.estimateProjectAge();
    
    // Count lines of code
    const linesOfCode = await this.countLinesOfCode();

    return {
      name,
      description,
      version,
      author,
      age,
      linesOfCode,
      fileCount: this.files.length,
    };
  }

  /**
   * Analyze project architecture and patterns
   */
  private async analyzeArchitecture(): Promise<Architecture> {
    const patterns = await this.detectArchitecturalPatterns();
    const structure = await this.analyzeDirectoryStructure();
    const apiEndpoints: string[] = []; // TODO: Implement API endpoint detection
    const databases = await this.detectDatabases();
    const deployment: string[] = []; // TODO: Implement deployment detection

    return {
      patterns,
      structure,
      apiEndpoints,
      databases,
      deployment,
    };
  }

  /**
   * Analyze project purpose and domain
   */
  private async analyzePurpose(): Promise<Purpose> {
    const domain = await this.detectDomain();
    const category = await this.categorizeProject();
    const features = await this.extractFeatures();
    const businessLogic = await this.identifyBusinessLogic();

    return {
      domain,
      category,
      features,
      businessLogic,
    };
  }

  /**
   * Generate realistic use cases
   */
  private async generateUseCases(): Promise<UseCase[]> {
    const useCases: UseCase[] = [];
    
    // Analyze based on detected patterns and features
    const features = await this.extractFeatures();
    const category = await this.categorizeProject();

    if (category === 'web-app') {
      if (features.includes('authentication')) {
        useCases.push({
          title: 'User Authentication & Management',
          description: 'Users can register, login, and manage their accounts securely',
          actors: ['End Users', 'System Administrators'],
          flow: [
            'User visits registration page',
            'Fills out registration form with validation',
            'Receives email verification',
            'Logs in with credentials',
            'Accesses protected features'
          ]
        });
      }

      if (features.includes('dashboard') || features.includes('admin')) {
        useCases.push({
          title: 'Dashboard Analytics & Monitoring',
          description: 'Administrators can view system metrics and user analytics',
          actors: ['Administrators', 'Managers'],
          flow: [
            'Admin logs into dashboard',
            'Views real-time metrics and charts',
            'Filters data by date ranges',
            'Exports reports for analysis',
            'Configures alerts and notifications'
          ]
        });
      }
    }

    if (category === 'api' || category === 'backend') {
      useCases.push({
        title: 'API Data Processing',
        description: 'External systems can integrate and exchange data through REST/GraphQL APIs',
        actors: ['Client Applications', 'Third-party Services'],
        flow: [
          'Client authenticates with API key',
          'Sends structured data requests',
          'System validates and processes data',
          'Returns formatted responses',
          'Handles rate limiting and errors'
        ]
      });
    }

    // Add more use cases based on detected technologies
    if (this.hasEcommerce()) {
      useCases.push({
        title: 'E-commerce Transaction Flow',
        description: 'Customers can browse products, add to cart, and complete purchases',
        actors: ['Customers', 'Merchants', 'Payment Processors'],
        flow: [
          'Customer browses product catalog',
          'Adds items to shopping cart',
          'Proceeds to secure checkout',
          'Enters payment and shipping info',
          'Receives order confirmation'
        ]
      });
    }

    return useCases.slice(0, 3); // Limit to top 3 most relevant
  }

  /**
   * Analyze technology stack in detail
   */
  private async analyzeTechStack(): Promise<TechStack> {
    const frontend = await this.detectFrontendTech();
    const backend = await this.detectBackendTech();
    const database = await this.detectDatabases();
    const devTools = await this.detectDevTools();
    const deployment: string[] = []; // TODO: Implement deployment detection
    const testing = await this.detectTestingFrameworks();

    return {
      frontend,
      backend,
      database,
      devTools,
      deployment,
      testing,
    };
  }

  /**
   * Analyze project complexity
   */
  private async analyzeComplexity(): Promise<Complexity> {
    const dependencies = Object.keys(this.packageJson?.dependencies || {}).length;
    const devDependencies = Object.keys(this.packageJson?.devDependencies || {}).length;
    const linesOfCode = await this.countLinesOfCode();
    const fileCount = this.files.length;

    let level: 'Simple' | 'Moderate' | 'Complex' | 'Enterprise' = 'Simple';
    let score = 0;

    // Calculate complexity score
    if (dependencies > 50) score += 3;
    else if (dependencies > 20) score += 2;
    else if (dependencies > 10) score += 1;

    if (linesOfCode > 10000) score += 3;
    else if (linesOfCode > 5000) score += 2;
    else if (linesOfCode > 1000) score += 1;

    if (fileCount > 100) score += 2;
    else if (fileCount > 50) score += 1;

    // Determine complexity level
    if (score >= 7) level = 'Enterprise';
    else if (score >= 5) level = 'Complex';
    else if (score >= 3) level = 'Moderate';

    return {
      level,
      score,
      factors: {
        dependencies,
        devDependencies,
        linesOfCode,
        fileCount,
      },
      maintainability: this.assessMaintainability(),
    };
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Analyze for improvement opportunities
    const hasTests = await this.hasTestingSetup();
    const hasTypeScript = await this.hasTypeScript();
    const hasLinting = await this.hasLinting();
    const hasCI = await this.hasCISetup();
    const hasDocumentation = await this.hasDocumentation();

    if (!hasTests) {
      recommendations.push({
        category: 'Testing',
        priority: 'High',
        title: 'Add Testing Framework',
        description: 'Implement unit and integration tests to ensure code reliability',
        action: 'Set up Jest, Vitest, or similar testing framework',
        impact: 'Reduces bugs, improves confidence in deployments'
      });
    }

    if (!hasTypeScript && this.isJavaScriptProject()) {
      recommendations.push({
        category: 'Type Safety',
        priority: 'Medium',
        title: 'Consider TypeScript Migration',
        description: 'Add type safety to catch errors at compile time',
        action: 'Gradually migrate JavaScript files to TypeScript',
        impact: 'Better IDE support, fewer runtime errors'
      });
    }

    if (!hasLinting) {
      recommendations.push({
        category: 'Code Quality',
        priority: 'Medium',
        title: 'Setup Code Linting',
        description: 'Enforce consistent code style and catch potential issues',
        action: 'Configure ESLint with appropriate rules',
        impact: 'Improved code consistency and quality'
      });
    }

    if (!hasCI) {
      recommendations.push({
        category: 'DevOps',
        priority: 'High',
        title: 'Implement CI/CD Pipeline',
        description: 'Automate testing and deployment processes',
        action: 'Setup GitHub Actions, GitLab CI, or similar',
        impact: 'Faster, more reliable deployments'
      });
    }

    return recommendations;
  }

  // Helper methods for analysis
  private async getProjectFiles(): Promise<string[]> {
    const files: string[] = [];
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
    
    const scanDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.projectPath, fullPath);
          
          if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
            await scanDir(fullPath);
          } else if (entry.isFile()) {
            files.push(relativePath);
          }
        }
      } catch (error) {
        // Handle permission errors gracefully
      }
    };

    await scanDir(this.projectPath);
    return files;
  }

  private async countLinesOfCode(): Promise<number> {
    let totalLines = 0;
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs', '.php'];
    
    for (const file of this.files) {
      const ext = path.extname(file);
      if (codeExtensions.includes(ext)) {
        try {
          const content = await fs.readFile(path.join(this.projectPath, file), 'utf-8');
          totalLines += content.split('\n').length;
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
    
    return totalLines;
  }

  private async estimateProjectAge(): Promise<string> {
    try {
      // Try to get git info first
      const gitDir = path.join(this.projectPath, '.git');
      if (await fs.pathExists(gitDir)) {
        // Could implement git log parsing here
        return 'Git repository detected';
      }
      
      // Fallback to package.json creation time
      const packagePath = path.join(this.projectPath, 'package.json');
      if (await fs.pathExists(packagePath)) {
        const stats = await fs.stat(packagePath);
        const ageInDays = Math.floor((Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60 * 24));
        
        if (ageInDays < 30) return `${ageInDays} days`;
        if (ageInDays < 365) return `${Math.floor(ageInDays / 30)} months`;
        return `${Math.floor(ageInDays / 365)} years`;
      }
    } catch (error) {
      // Handle gracefully
    }
    
    return 'Unknown';
  }

  private async detectArchitecturalPatterns(): Promise<string[]> {
    const patterns: string[] = [];
    
    // Check for common patterns
    if (this.files.some(f => f.includes('components/'))) patterns.push('Component-based');
    if (this.files.some(f => f.includes('pages/') || f.includes('routes/'))) patterns.push('Route-based');
    if (this.files.some(f => f.includes('store/') || f.includes('redux/'))) patterns.push('State Management');
    if (this.files.some(f => f.includes('api/') || f.includes('controllers/'))) patterns.push('API Layer');
    if (this.files.some(f => f.includes('models/') || f.includes('entities/'))) patterns.push('Data Models');
    if (this.files.some(f => f.includes('services/'))) patterns.push('Service Layer');
    if (this.files.some(f => f.includes('middleware/'))) patterns.push('Middleware Pattern');
    
    return patterns;
  }

  private async analyzeDirectoryStructure(): Promise<DirectoryStructure> {
    const structure: DirectoryStructure = {
      type: 'Unknown',
      organization: 'Mixed',
      depth: 0,
    };

    // Analyze directory depth and organization
    const maxDepth = Math.max(...this.files.map(f => f.split('/').length));
    structure.depth = maxDepth;

    // Determine organization type
    if (this.files.some(f => f.startsWith('src/'))) {
      structure.organization = 'Source-based';
      structure.type = 'Monolithic';
    }
    
    if (this.files.some(f => f.includes('packages/') || f.includes('apps/'))) {
      structure.type = 'Monorepo';
    }

    return structure;
  }

  private async detectDomain(): Promise<string> {
    const name = this.packageJson?.name?.toLowerCase() || '';
    const description = this.packageJson?.description?.toLowerCase() || '';
    const keywords = this.packageJson?.keywords || [];
    
    const text = `${name} ${description} ${keywords.join(' ')}`;
    
    // Domain detection based on keywords
    if (/e-?commerce|shop|store|cart|payment/.test(text)) return 'E-commerce';
    if (/blog|cms|content|article/.test(text)) return 'Content Management';
    if (/dashboard|admin|analytics|metrics/.test(text)) return 'Analytics & Monitoring';
    if (/social|chat|message|community/.test(text)) return 'Social Platform';
    if (/finance|bank|trading|crypto/.test(text)) return 'Financial Services';
    if (/health|medical|patient|doctor/.test(text)) return 'Healthcare';
    if (/education|learn|course|student/.test(text)) return 'Education';
    if (/game|gaming|player/.test(text)) return 'Gaming';
    if (/api|service|microservice/.test(text)) return 'API/Services';
    
    return 'General Purpose';
  }

  private async categorizeProject(): Promise<string> {
    const deps = this.packageJson?.dependencies || {};
    
    if (deps.react || deps.vue || deps['@angular/core']) return 'web-app';
    if (deps.express || deps.fastify || deps.koa) return 'backend';
    if (deps['@nestjs/core'] || deps.graphql) return 'api';
    if (deps.electron) return 'desktop-app';
    if (deps['react-native'] || deps.expo) return 'mobile-app';
    if (deps.gatsby || deps.next || deps.nuxt) return 'static-site';
    
    return 'library';
  }

  private async extractFeatures(): Promise<string[]> {
    const features: string[] = [];
    const deps = this.packageJson?.dependencies || {};
    const allText = this.files.join(' ').toLowerCase();
    
    // Authentication
    if (deps.passport || deps.auth0 || allText.includes('auth')) features.push('authentication');
    
    // Database
    if (deps.mongoose || deps.prisma || deps.sequelize) features.push('database');
    
    // API
    if (deps.axios || deps.fetch || allText.includes('api')) features.push('api-integration');
    
    // UI Components
    if (deps['@mui/material'] || deps.antd || deps.chakra) features.push('ui-components');
    
    // State Management
    if (deps.redux || deps.zustand || deps.mobx) features.push('state-management');
    
    // Testing
    if (deps.jest || deps.vitest || deps.cypress) features.push('testing');
    
    // Admin/Dashboard
    if (allText.includes('admin') || allText.includes('dashboard')) features.push('dashboard');
    
    return features;
  }

  private async identifyBusinessLogic(): Promise<string[]> {
    const logic: string[] = [];
    const files = this.files.join(' ').toLowerCase();
    
    if (files.includes('payment') || files.includes('billing')) logic.push('Payment Processing');
    if (files.includes('user') || files.includes('profile')) logic.push('User Management');
    if (files.includes('order') || files.includes('cart')) logic.push('Order Management');
    if (files.includes('notification') || files.includes('email')) logic.push('Communication');
    if (files.includes('report') || files.includes('analytics')) logic.push('Reporting');
    if (files.includes('inventory') || files.includes('product')) logic.push('Inventory Management');
    
    return logic;
  }

  private async detectFrontendTech(): Promise<string[]> {
    const deps = this.packageJson?.dependencies || {};
    const tech: string[] = [];
    
    if (deps.react) tech.push('React');
    if (deps.vue) tech.push('Vue.js');
    if (deps['@angular/core']) tech.push('Angular');
    if (deps.svelte) tech.push('Svelte');
    if (deps.next) tech.push('Next.js');
    if (deps.gatsby) tech.push('Gatsby');
    if (deps.nuxt) tech.push('Nuxt.js');
    
    return tech;
  }

  private async detectBackendTech(): Promise<string[]> {
    const deps = this.packageJson?.dependencies || {};
    const tech: string[] = [];
    
    if (deps.express) tech.push('Express.js');
    if (deps.fastify) tech.push('Fastify');
    if (deps.koa) tech.push('Koa.js');
    if (deps['@nestjs/core']) tech.push('NestJS');
    if (deps.apollo) tech.push('Apollo Server');
    
    return tech;
  }

  private async detectDevTools(): Promise<string[]> {
    const devDeps = this.packageJson?.devDependencies || {};
    const tools: string[] = [];
    
    if (devDeps.webpack) tools.push('Webpack');
    if (devDeps.vite) tools.push('Vite');
    if (devDeps.rollup) tools.push('Rollup');
    if (devDeps.eslint) tools.push('ESLint');
    if (devDeps.prettier) tools.push('Prettier');
    if (devDeps.typescript) tools.push('TypeScript');
    
    return tools;
  }

  private async detectTestingFrameworks(): Promise<string[]> {
    const deps = { 
      ...this.packageJson?.dependencies || {}, 
      ...this.packageJson?.devDependencies || {} 
    };
    const testing: string[] = [];
    
    if (deps.jest) testing.push('Jest');
    if (deps.vitest) testing.push('Vitest');
    if (deps.cypress) testing.push('Cypress');
    if (deps.playwright) testing.push('Playwright');
    if (deps.mocha) testing.push('Mocha');
    
    return testing;
  }

  private hasEcommerce(): boolean {
    const text = JSON.stringify(this.packageJson).toLowerCase();
    return /shop|store|cart|payment|ecommerce|commerce/.test(text);
  }

  private hasTestingSetup(): boolean {
    const deps = { 
      ...this.packageJson?.dependencies || {}, 
      ...this.packageJson?.devDependencies || {} 
    };
    return !!(deps.jest || deps.vitest || deps.cypress || deps.mocha);
  }

  private hasTypeScript(): boolean {
    return !!(this.packageJson?.devDependencies?.typescript || 
             this.files.some(f => f.endsWith('.ts') || f.endsWith('.tsx')));
  }

  private hasLinting(): boolean {
    return !!(this.packageJson?.devDependencies?.eslint);
  }

  private hasCISetup(): boolean {
    return this.files.some(f => 
      f.includes('.github/workflows') || 
      f.includes('.gitlab-ci') || 
      f.includes('jenkins') ||
      f === 'Dockerfile'
    );
  }

  private hasDocumentation(): boolean {
    return this.files.some(f => 
      f.toLowerCase().includes('readme') || 
      f.toLowerCase().includes('docs/') ||
      f.toLowerCase().includes('documentation')
    );
  }

  private isJavaScriptProject(): boolean {
    return this.files.some(f => f.endsWith('.js') || f.endsWith('.jsx'));
  }

  private assessMaintainability(): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    let score = 0;
    
    if (this.hasTypeScript()) score += 2;
    if (this.hasTestingSetup()) score += 2;
    if (this.hasLinting()) score += 1;
    if (this.hasDocumentation()) score += 1;
    
    if (score >= 5) return 'Excellent';
    if (score >= 3) return 'Good';
    if (score >= 2) return 'Fair';
    return 'Poor';
  }

  /**
   * Detect databases used in the project
   */
  private async detectDatabases(): Promise<string[]> {
    const deps = this.packageJson?.dependencies || {};
    const databases: string[] = [];
    
    if (deps.mongoose) databases.push('MongoDB');
    if (deps.prisma) databases.push('Prisma');
    if (deps.sequelize) databases.push('PostgreSQL/MySQL');
    if (deps.sqlite3) databases.push('SQLite');
    if (deps.redis) databases.push('Redis');
    if (deps.pg) databases.push('PostgreSQL');
    if (deps.mysql2) databases.push('MySQL');
    
    return databases;
  }
}

// Types for the analysis report
export interface ProjectReport {
  basicInfo: BasicInfo;
  architecture: Architecture;
  purpose: Purpose;
  useCases: UseCase[];
  techStack: TechStack;
  complexity: Complexity;
  recommendations: Recommendation[];
  generatedAt: string;
}

export interface BasicInfo {
  name: string;
  description: string;
  version: string;
  author: string;
  age: string;
  linesOfCode: number;
  fileCount: number;
}

export interface Architecture {
  patterns: string[];
  structure: DirectoryStructure;
  apiEndpoints: string[];
  databases: string[];
  deployment: string[];
}

export interface DirectoryStructure {
  type: string;
  organization: string;
  depth: number;
}

export interface Purpose {
  domain: string;
  category: string;
  features: string[];
  businessLogic: string[];
}

export interface UseCase {
  title: string;
  description: string;
  actors: string[];
  flow: string[];
}

export interface TechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  devTools: string[];
  deployment: string[];
  testing: string[];
}

export interface Complexity {
  level: 'Simple' | 'Moderate' | 'Complex' | 'Enterprise';
  score: number;
  factors: {
    dependencies: number;
    devDependencies: number;
    linesOfCode: number;
    fileCount: number;
  };
  maintainability: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface Recommendation {
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  action: string;
  impact: string;
}

export default ProjectAnalyzer;