/**
 * Flux Framework - Main Server Entry Point
 * @module @voilajsx/flux/server
 * @file flux.ts
 *
 * @llm-rule WHEN: Starting a Flux Framework backend server
 * @llm-rule AVOID: Running without contract validation - server blocks on invalid contracts
 * @llm-rule NOTE: Orchestrates feature discovery, contract enforcement, and Fastify server startup
 * 
 * WHAT THIS FILE DOES:
 * 1. 🔍 Feature Discovery - Scans src/features/ and loads configurations
 * 2. 🔒 Contract Enforcement - Validates all contracts before server start (BLOCKS if invalid)
 * 3. 🚀 Server Creation - Sets up Fastify with AppKit middleware and error handling
 * 4. 📡 Route Registration - Auto-registers all feature routes with prefixes
 * 5. 🌐 Server Startup - Starts HTTP server with graceful shutdown handling
 * 6. 🎯 Architecture Enforcement - Ensures service-only inter-feature communication
 */

import dotenv from 'dotenv';
import { join } from 'path';
import { readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

import Fastify, { type FastifyInstance, type FastifyPluginCallback, type FastifyRequest, type FastifyReply } from 'fastify';

import { configure } from '@voilajsx/appkit/config';
import { error } from '@voilajsx/appkit/error';
import { logger } from '@voilajsx/appkit/logging';
import { 
  type FeatureContract, 
  type ContractItem,
  type ContractValidationResult,
  isAppKitService 
} from './contracts.js';

// 🔧 FIXED: ES Module compatibility for __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ============================================================================
// 📋 TYPE DEFINITIONS
// ============================================================================

/**
 * Route configuration for a feature
 * @llm-rule WHEN: Defining how feature routes should be registered
 * @llm-rule AVOID: Manual route registration - use this config structure
 */
export interface FeatureRouteConfig {
  readonly file: string;
  readonly prefix?: string;
}

/**
 * Feature metadata for documentation and tooling
 * @llm-rule WHEN: Adding descriptive information to features
 * @llm-rule AVOID: Required metadata - all fields are optional except name
 */
export interface FeatureMeta {
  readonly name: string;
  readonly description?: string;
  readonly version?: string;
  readonly author?: string;
  
  // Extended metadata for better developer experience
  readonly capabilities?: readonly string[];      // What can this feature do?
  readonly permissions?: Record<string, string>;  // Role requirements per endpoint
  readonly notes?: readonly string[];             // Important gotchas/tips
}

/**
 * Feature configuration exported from index.ts files
 * @llm-rule WHEN: Creating feature index.ts configuration
 * @llm-rule AVOID: Missing contract - all features should have contracts
 */
export interface FeatureConfig {
  readonly name: string;
  readonly contract?: FeatureContract;
  readonly routes?: readonly FeatureRouteConfig[];
  readonly meta?: FeatureMeta;
}

/**
 * Discovered feature with runtime information
 * @llm-rule WHEN: Representing a loaded feature during server startup
 * @llm-rule AVOID: Direct creation - use discoverFeatures() function
 */
export interface DiscoveredFeature {
  readonly name: string;
  readonly path: string;
  readonly config: FeatureConfig;
  readonly contract: FeatureContract | null;
}

/**
 * Contract validation summary for startup reporting
 * @llm-rule WHEN: Need comprehensive validation results
 * @llm-rule AVOID: Ignoring validation - check results before deployment
 */
export interface ContractValidationSummary {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly summary: {
    readonly features: number;
    readonly services: number;
    readonly routes: number;
    readonly middleware: number;
    readonly models: number;
  };
}

// ============================================================================
// 🌐 FLUX ROUTER - Simple Route Registration
// ============================================================================

export interface RequestType extends Omit<FastifyRequest, 'query' | 'params' | 'body'> {
  query: Record<string, any>;
  params: Record<string, any>; 
  body: any;
}

export type RouteHandlerType = (req: FastifyRequest, reply: FastifyReply) => Promise<any> | any;
export type MiddlewareType = (request: FastifyRequest, reply: FastifyReply, done: Function) => void;

/**
 * Create a simple route registration helper - Fastify is completely hidden
 * @llm-rule WHEN: Creating feature routes with simplified syntax
 * @llm-rule AVOID: Direct Fastify usage in features - use this router helper
 * @llm-rule NOTE: Automatically adds feature metadata to responses
 */
export function router(featureName: string, registerRoutes: (routes: any) => void) {
  return async (fastify: FastifyInstance) => {
    const log = logger.get(`${featureName}-routes`);

    const routeRegistrar = {
      /**
       * Register a GET route - simple and clean
       */
      get(path: string, middlewareOrHandler: MiddlewareType | MiddlewareType[] | RouteHandlerType, handler?: RouteHandlerType) {
        registerRoute('get', path, middlewareOrHandler, handler);
      },

      /**
       * Register a POST route
       */
      post(path: string, middlewareOrHandler: MiddlewareType | MiddlewareType[] | RouteHandlerType, handler?: RouteHandlerType) {
        registerRoute('post', path, middlewareOrHandler, handler);
      },

      /**
       * Register a PUT route
       */
      put(path: string, middlewareOrHandler: MiddlewareType | MiddlewareType[] | RouteHandlerType, handler?: RouteHandlerType) {
        registerRoute('put', path, middlewareOrHandler, handler);
      },

      /**
       * Register a PATCH route
       */
      patch(path: string, middlewareOrHandler: MiddlewareType | MiddlewareType[] | RouteHandlerType, handler?: RouteHandlerType) {
        registerRoute('patch', path, middlewareOrHandler, handler);
      },

      /**
       * Register a DELETE route
       */
      delete(path: string, middlewareOrHandler: MiddlewareType | MiddlewareType[] | RouteHandlerType, handler?: RouteHandlerType) {
        registerRoute('delete', path, middlewareOrHandler, handler);
      }
    };

    // Call the user's route registration function
    registerRoutes(routeRegistrar);

    /**
     * Internal route registration logic
     * @llm-rule WHEN: Called by route registration methods above
     * @llm-rule AVOID: Direct usage - use the route methods instead
     */
    function registerRoute(
      method: 'get' | 'post' | 'put' | 'patch' | 'delete',
      path: string, 
      middlewareOrHandler: MiddlewareType | MiddlewareType[] | RouteHandlerType, 
      handler?: RouteHandlerType
    ) {
      let middleware: MiddlewareType[] = [];
      let routeHandler: RouteHandlerType;

      // Determine if first param is middleware or handler
      if (handler) {
        // First param is middleware, second is handler
        if (Array.isArray(middlewareOrHandler)) {
          middleware = middlewareOrHandler as MiddlewareType[];
        } else {
          middleware = [middlewareOrHandler as MiddlewareType];
        }
        routeHandler = handler;
      } else {
        // First param is handler, no middleware
        routeHandler = middlewareOrHandler as RouteHandlerType;
      }

      // Register with Fastify
      const fastifyHandler = async (request: FastifyRequest, reply: FastifyReply) => {
        log.info(`${method.toUpperCase()} ${path} called`, { 
          query: request.query, 
          params: request.params 
        });

        // Call handler directly with Fastify request - no conversion needed
        const result = await routeHandler(request, reply);
        
        // Add Flux metadata
        return {
          ...result,
          timestamp: new Date().toISOString(),
          feature: featureName,
        };
      };

      // Register route with Fastify (with optional middleware)
      if (middleware.length > 0) {
        (fastify as any)[method](path, { preHandler: middleware }, fastifyHandler);
      } else {
        (fastify as any)[method](path, fastifyHandler);
      }
    }
  };
}

// ============================================================================
// 🔍 FEATURE DISCOVERY SYSTEM
// ============================================================================

// Global variable to store discovered features for the root endpoint
let discoveredFeatures: DiscoveredFeature[] = [];

/**
 * Get discovered features (for root endpoint)
 * @llm-rule WHEN: Need to access discovered features from root endpoint
 * @llm-rule AVOID: Direct access to discoveredFeatures - use this getter
 */
function getDiscoveredFeatures(): DiscoveredFeature[] {
  return discoveredFeatures;
}

/**
 * Discover all features in the features directory
 * @llm-rule WHEN: Server startup needs to find all available features
 * @llm-rule AVOID: Manual feature registration - this auto-discovers all features
 * @llm-rule NOTE: Skips folders starting with _ (e.g., _templates, _archived)
 */
async function discoverFeatures(log: any): Promise<DiscoveredFeature[]> {
  const cwd = process.cwd();
  
  // 🔧 FIXED: Determine if running from compiled JS or source TS
  const runningFromDist = __filename.includes('dist') || __filename.includes('.js');
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 🔧 FIXED: Proper path resolution based on execution context
  const featuresPath = runningFromDist
    ? join(cwd, 'dist', 'src', 'features')  // Running compiled: use dist/src/features
    : join(cwd, 'src', 'features');         // Running source: use src/features
  
  const features: DiscoveredFeature[] = [];

  log.debug('Feature discovery starting', {
    runningFromDist,
    isProduction,
    featuresPath,
    cwd,
    currentFile: __filename,
    pathExists: existsSync(featuresPath)
  });

  if (!existsSync(featuresPath)) {
    log.warn('Features directory not found - no features will be loaded', {
      expectedPath: featuresPath,
      runningFromDist,
      isProduction,
      suggestion: runningFromDist 
        ? 'Run: npm run build to compile TypeScript files to dist/'
        : 'Create features directory: mkdir -p src/features'
    });
    return features;
  }

  // Get all directories in features folder
  const allDirs = readdirSync(featuresPath, { withFileTypes: true })
    .filter(dir => dir.isDirectory())
    .map(dir => dir.name);

  // Separate enabled and skipped features
  const enabledDirs = allDirs.filter(name => !name.startsWith('_'));
  const skippedDirs = allDirs.filter(name => name.startsWith('_'));

  log.debug('Feature directories found', {
    total: allDirs.length,
    enabled: enabledDirs.length,
    skipped: skippedDirs.length,
    enabledList: enabledDirs,
    skippedList: skippedDirs
  });

  // Load enabled features
  for (const featureName of enabledDirs) {
    // 🔧 FIXED: Declare variables outside try block for proper scope
    const featurePath = join(featuresPath, featureName);
    let configPath: string | null = null;
    
    try {
      // 🔧 FIXED: File extension selection based on execution context
      const preferredExtensions = runningFromDist 
        ? ['.js', '.ts']  // Running compiled: prefer .js, fallback to .ts
        : ['.ts', '.js']; // Running source: prefer .ts, fallback to .js
      
      const triedPaths: string[] = [];
      
      for (const ext of preferredExtensions) {
        const candidate = join(featurePath, `index${ext}`);
        triedPaths.push(candidate);
        if (existsSync(candidate)) {
          configPath = candidate;
          break;
        }
      }

      if (!configPath) {
        log.warn('Feature missing index file', { 
          feature: featureName,
          featurePath,
          tried: triedPaths,
          runningFromDist,
          isProduction,
          suggestion: runningFromDist 
            ? `Expected compiled file: ${join(featurePath, 'index.js')} - check if build completed successfully`
            : `Create source file: ${join(featurePath, 'index.ts')}`
        });
        continue;
      }

      log.debug('Loading feature config', {
        feature: featureName,
        configPath,
        runningFromDist,
        isProduction,
        extension: configPath.endsWith('.ts') ? 'TypeScript' : 'JavaScript'
      });

      // 🔧 IMPROVED: Better import with file:// protocol handling
      const normalizedPath = configPath.replace(/\\/g, '/');
      const moduleUrl = `file://${normalizedPath}`;
      
      log.debug('Importing feature module', {
        feature: featureName,
        moduleUrl,
        isTypeScript: configPath.endsWith('.ts')
      });
      
      const module = await import(moduleUrl);
      const featureConfig: FeatureConfig = module.default;

      // 🔧 IMPROVED: Better validation with specific error messages
      if (!featureConfig) {
        log.error('Feature has no default export', { 
          feature: featureName,
          configPath,
          availableExports: Object.keys(module),
          suggestion: 'Add: export default featureConfig;'
        });
        continue;
      }

      if (!featureConfig.name) {
        log.error('Feature config missing name property', { 
          feature: featureName,
          configPath,
          config: featureConfig,
          suggestion: 'Add: name: "feature-name" to your FeatureConfig'
        });
        continue;
      }

      if (featureConfig.name !== featureName) {
        log.warn('Feature name mismatch', {
          folderName: featureName,
          configName: featureConfig.name,
          suggestion: `Either rename folder to '${featureConfig.name}' or update config name to '${featureName}'`
        });
      }

      features.push({
        name: featureName,
        path: featurePath,
        config: featureConfig,
        contract: featureConfig.contract || null
      });

      log.debug('Feature loaded successfully', {
        feature: featureName,
        hasContract: !!featureConfig.contract,
        hasRoutes: !!(featureConfig.routes && featureConfig.routes.length > 0),
        routeCount: featureConfig.routes?.length || 0
      });

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // 🔧 ENHANCED: Better error categorization
      let errorCategory = 'unknown';
      let suggestions: string[] = [];
      
      if (error.message.includes('Unknown file extension ".ts"')) {
        errorCategory = 'typescript_runtime';
        suggestions = [
          `You are running compiled JavaScript (from dist/) but trying to import .ts files`,
          `Solutions:`,
          `1. Ensure TypeScript compilation includes features: npm run build`,
          `2. Or run directly from source: npx tsx flux.ts`,
          `3. Check if ${featurePath.replace(featuresPath, 'dist/src/features')} exists`,
          `4. Verify tsconfig.json includes src/features in compilation`
        ];
      } else if (error.message.includes('Cannot resolve module')) {
        errorCategory = 'module_resolution';
        suggestions = [
          'Module import path is incorrect',
          'Check if all dependencies are installed',
          'Verify file paths and extensions'
        ];
      } else if (error.message.includes('SyntaxError')) {
        errorCategory = 'syntax_error';
        suggestions = [
          'There is a syntax error in the feature file',
          'Check for missing semicolons, brackets, or quotes',
          'Verify TypeScript/JavaScript syntax is correct'
        ];
      }
      
      log.error('Failed to load feature', {
        feature: featureName,
        error: error.message,
        stack: error.stack,
        featurePath,
        configPath: configPath || 'not determined',
        runningFromDist,
        isProduction,
        nodeEnv: process.env.NODE_ENV,
        errorType: error.name || 'UnknownError',
        errorCategory,
        isTypeScriptFile: configPath?.endsWith('.ts') || false,
        expectedCompiledPath: runningFromDist ? join(cwd, 'dist', 'src', 'features', featureName, 'index.js') : null,
        suggestions
      });
      
      // Additional console output for immediate debugging
      console.error(`\n❌ FEATURE LOAD ERROR: ${featureName}`);
      console.error(`📂 Path: ${featurePath}`);
      console.error(`📄 Config: ${configPath || 'not found'}`);
      console.error(`🔍 Error: ${error.message}`);
      console.error(`📋 Category: ${errorCategory}`);
      console.error(`🏃 Running from: ${runningFromDist ? 'compiled (dist/)' : 'source (src/)'}`);
      
      if (runningFromDist && errorCategory === 'typescript_runtime') {
        const expectedPath = join(cwd, 'dist', 'src', 'features', featureName, 'index.js');
        console.error(`🎯 Expected: ${expectedPath}`);
        console.error(`❓ Exists: ${existsSync(expectedPath) ? 'YES' : 'NO'}`);
      }
      
      if (suggestions.length > 0) {
        console.error(`💡 Suggestions:`);
        suggestions.forEach(suggestion => {
          console.error(`   ${suggestion}`);
        });
      }
      
      if (error.stack) {
        console.error(`📋 Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
      console.error(''); // Empty line for readability
    }
  }

  // Crisp discovery summary
  const enabledList = features.map(f => f.name).join(', ') || 'none';
  const skippedList = skippedDirs.join(', ') || 'none';
  
  log.info(`Discovery: ${features.length} enabled [${enabledList}]${skippedDirs.length > 0 ? `, ${skippedDirs.length} skipped [${skippedList}]` : ''}`);

  return features;
}

// ============================================================================
// 🔒 CONTRACT ENFORCEMENT ENGINE
// ============================================================================

/**
 * Enforce contracts - Server WILL NOT START if contracts are invalid
 * @llm-rule WHEN: All features have been discovered and need validation
 * @llm-rule AVOID: Skipping validation - prevents runtime contract violations
 * @llm-rule NOTE: This is what makes Flux tamper-proof and architecture-safe
 */
async function enforceContracts(features: DiscoveredFeature[], log: any): Promise<void> {
  log.info('🔒 ENFORCING feature contracts...');

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. All features MUST have contracts
  for (const feature of features) {
    if (!feature.contract) {
      errors.push(`Feature '${feature.name}' MUST have a contract - add createBackendContract().build()`);
    }
  }

  // 2. Validate contract dependencies
  const providedServices = new Set<string>();
  const providedRoutes = new Set<string>();
  const providedMiddleware = new Set<string>();
  const providedModels = new Set<string>();

  // First pass: collect all provides
  for (const feature of features) {
    if (!feature.contract) continue;

    // Handle new contract structure
    if (feature.contract.provides) {
      // New structure: { routes: [], services: [] }
      const routes = feature.contract.provides.routes || [];
      const services = feature.contract.provides.services || [];

      routes.forEach(route => {
        if (providedRoutes.has(route)) {
          warnings.push(`Duplicate route '${route}' declared by '${feature.name}'`);
        } else {
          providedRoutes.add(route);
        }
      });

      services.forEach(service => {
        if (providedServices.has(service)) {
          errors.push(`DUPLICATE SERVICE: '${service}' provided by multiple features including '${feature.name}'`);
        } else {
          providedServices.add(service);
        }
      });
    } else {
      // Legacy structure: [{ type, value }]
      const provides = (feature.contract as any).provides || [];
      for (const provided of provides) {
        switch (provided.type) {
          case 'service':
            if (providedServices.has(provided.value)) {
              errors.push(`DUPLICATE SERVICE: '${provided.value}' provided by multiple features including '${feature.name}'`);
            } else {
              providedServices.add(provided.value);
            }
            break;
          case 'route':
            if (providedRoutes.has(provided.value)) {
              warnings.push(`Duplicate route '${provided.value}' declared by '${feature.name}'`);
            } else {
              providedRoutes.add(provided.value);
            }
            break;
          case 'middleware':
            if (providedMiddleware.has(provided.value)) {
              errors.push(`DUPLICATE MIDDLEWARE: '${provided.value}' provided by multiple features including '${feature.name}'`);
            } else {
              providedMiddleware.add(provided.value);
            }
            break;
          case 'model':
            if (providedModels.has(provided.value)) {
              errors.push(`DUPLICATE MODEL: '${provided.value}' provided by multiple features including '${feature.name}'`);
            } else {
              providedModels.add(provided.value);
            }
            break;
        }
      }
    }
  }

  // Second pass: validate all needs are satisfied
  for (const feature of features) {
    if (!feature.contract) continue;

    // Handle new contract structure
    if (feature.contract.needs) {
      // New structure: { services: [] }
      const neededServices = feature.contract.needs.services || [];
      
      neededServices.forEach(serviceName => {
        if (!providedServices.has(serviceName)) {
          errors.push(`MISSING DEPENDENCY: Feature '${feature.name}' needs service '${serviceName}' but no feature provides it`);
        }
      });
    } else {
      // Legacy structure: [{ type, value }]
      const needs = (feature.contract as any).needs || [];
      for (const need of needs) {
        switch (need.type) {
          case 'platform':
            if (!isAppKitService(need.value)) {
              errors.push(`Feature '${feature.name}' needs UNKNOWN AppKit service '${need.value}'`);
            }
            break;
          case 'service':
            if (!providedServices.has(need.value)) {
              errors.push(`MISSING DEPENDENCY: Feature '${feature.name}' needs service '${need.value}' but no feature provides it`);
            }
            break;
          case 'middleware':
            if (!providedMiddleware.has(need.value)) {
              errors.push(`MISSING DEPENDENCY: Feature '${feature.name}' needs middleware '${need.value}' but no feature provides it`);
            }
            break;
          case 'model':
            if (!providedModels.has(need.value)) {
              errors.push(`MISSING DEPENDENCY: Feature '${feature.name}' needs model '${need.value}' but no feature provides it`);
            }
            break;
        }
      }
    }

    // Validate AppKit imports
    if (feature.contract.imports?.appkit) {
      feature.contract.imports.appkit.forEach(appkitService => {
        if (!isAppKitService(appkitService)) {
          errors.push(`Feature '${feature.name}' imports UNKNOWN AppKit service '${appkitService}'`);
        }
      });
    }
  }

  // 🚨 CRITICAL: Stop server if any contract errors found
  if (errors.length > 0) {
    log.error('Contract enforcement failed - server startup blocked', {
      category: 'contract',
      errorType: 'CONTRACT_ENFORCEMENT',
      errors: errors.length,
      warnings: warnings.length,
      details: errors,
      warningDetails: warnings,
      fixActions: [
        'Add missing contracts: createBackendContract().build()',
        'Declare all routes: .provides("routes", ["GET /endpoint"])',
        'Provide missing services/dependencies',
        'Run: npm run flux:check'
      ]
    });
    
    // 🔥 Add this for better debugging
    console.log('\n❌ CONTRACT ERRORS:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    
    if (warnings.length > 0) {
      console.log('\n⚠️  CONTRACT WARNINGS:');
      warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    throw new Error(`🚨 CONTRACT ENFORCEMENT FAILED: ${errors.length} critical errors found. Server will not start until contracts are valid.`);
  }
}

// ============================================================================
// 🚀 FASTIFY SERVER CREATION
// ============================================================================

/**
 * Create and configure Fastify application
 * @llm-rule WHEN: Need to create the main HTTP server with AppKit integration
 * @llm-rule AVOID: Direct Fastify configuration - use this setup for consistency
 * @llm-rule NOTE: Includes error handling, logging, and health endpoints
 */
async function createFluxApp(config: any, log: any): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Use AppKit logging instead
    trustProxy: config.get('app.environment') === 'production'
  });

  const err = error.get();

  // Add AppKit error handling
  app.setErrorHandler((error, request, reply) => {
    const errorLog = (request as any).log || logger.get('error-handler');
    const statusCode = error.statusCode || 500;
    const isServerError = statusCode >= 500;
    const isDev = config.get('app.environment') === 'development';

    errorLog[isServerError ? 'error' : 'warn']('Request failed', {
      error: {
        name: error.name,
        message: error.message,
        stack: isServerError && isDev ? error.stack : undefined
      }
    });

    const responsePayload: Record<string, any> = {
      error: (error as any).type || error.name || 'InternalServerError',
      message: error.message
    };

    if (isDev && isServerError) {
      responsePayload.stack = error.stack;
    }

    reply.status(statusCode).send(responsePayload);
  });

  // Add request logging with compact format
  app.addHook('onRequest', async (request) => {
    (request as any).log = logger.get('http').child({
      requestId: request.id,
      method: request.method,
      url: request.url,
      ip: request.ip
    });
    
    if (!['/favicon.ico', '/robots.txt', '/health'].includes(request.url)) {
      const method = request.method;
      const path = request.url;
      const userAgent = request.headers['user-agent']?.split('/')[0] || 'Unknown'; // Just get browser/tool name
      
      (request as any).log.info(`→ ${method} ${path} (${userAgent})`);
    }
  });

  app.addHook('onResponse', async (request, reply) => {
    const requestLog = (request as any).log;
    if (requestLog && !['/favicon.ico', '/robots.txt', '/health'].includes(request.url)) {
      const duration = Math.round(reply.elapsedTime);
      const status = reply.statusCode;
      const method = request.method;
      const path = request.url;
      
      const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      
      requestLog[logLevel](`← ${method} ${path} → ${status} (${duration}ms)`);
    }
  });

  // Add health check endpoint
  app.get('/health', async (request, reply) => {
    reply.code(200).send({
      service: 'flux',
      healthy: true,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    });
  });

  // Add root welcome endpoint
  app.get('/', async (request, reply) => {
    const uptime = Math.floor(process.uptime());
    const features = getDiscoveredFeatures();
    
    return {
      message: '✨ Welcome to Flux Framework!',
      description: 'Contract-driven TypeScript backend framework built on AppKit',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      server: {
        status: 'running',
        uptime: `${uptime}s`,
        environment: config.get('app.environment', 'development'),
        nodeVersion: process.version,
        platform: process.platform
      },
      features: {
        total: features.length,
        available: features.map(f => f.name)
      },
      endpoints: {
        health: '/health',
        api: '/api/*',
        docs: 'Coming soon...'
      },
      links: {
        github: 'https://github.com/voilajsx/flux',
        documentation: 'https://flux.voilajsx.com'
      }
    };
  });

  log.info('✅ Fastify configured');
  return app;
}

// ============================================================================
// 🔧 ROUTE FILE RESOLUTION HELPER
// ============================================================================

/**
 * Resolve route file path with proper fallbacks for development and production
 * @llm-rule WHEN: Need to find route files in both .ts (dev) and .js (prod) environments
 * @llm-rule AVOID: Hardcoded path logic - use this helper for consistency
 * @llm-rule NOTE: Prefers .ts in development, .js in production
 */
function resolveRouteFilePath(featurePath: string, routeFile: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const basePath = join(featurePath, routeFile);
  
  // Remove extension if present and add both .ts and .js variants
  const withoutExt = basePath.replace(/\.(ts|js)$/, '');
  const jsPath = `${withoutExt}.js`;
  const tsPath = `${withoutExt}.ts`;
  
  // 🔧 FIXED: Proper extension priority based on environment
  const candidates = isProduction 
    ? [jsPath, tsPath]  // Production: prefer compiled .js, fallback to .ts
    : [tsPath, jsPath]; // Development: prefer source .ts, fallback to .js
  
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  
  throw new Error(`Route file not found: ${routeFile}. Environment: ${isProduction ? 'production' : 'development'}. Tried: ${candidates.join(', ')}`);
}

// ============================================================================
// 📡 ROUTE REGISTRATION SYSTEM - FIXED VERSION
// ============================================================================

/**
 * Register feature routes with CONTRACT ENFORCEMENT
 * @llm-rule WHEN: All features discovered and contracts validated
 * @llm-rule AVOID: Manual route registration - this auto-registers from contracts
 * @llm-rule NOTE: Routes get /api/{feature-name} prefix by default
 */
async function registerFeaturesWithEnforcement(app: FastifyInstance, features: DiscoveredFeature[], log: any): Promise<void> {
  let registeredRoutes = 0;

  for (const feature of features) {
    try {
      const { config } = feature;

      // Check if feature has routes
      if (!config.routes || config.routes.length === 0) {
        continue;
      }

      // Register routes for this feature
      for (const routeConfig of config.routes) {
        // ✅ Fixed: Use helper for clean, safe path resolution
        const routeFilePath = resolveRouteFilePath(feature.path, routeConfig.file);
        
        // Import and register route
        let module;
        try {
          // 🔧 IMPROVED: Better URL handling for file imports
          const normalizedPath = routeFilePath.replace(/\\/g, '/');
          const moduleUrl = `file://${normalizedPath}`;
          
          log.debug('Importing route module', {
            feature: feature.name,
            routeFile: routeConfig.file,
            resolvedPath: routeFilePath,
            moduleUrl
          });
          
          module = await import(moduleUrl);
        } catch (importError) {
          const error = importError instanceof Error ? importError : new Error(String(importError));
          
          log.error('Route import failed', {
            category: 'import',
            feature: feature.name,
            file: routeConfig.file,
            resolvedPath: routeFilePath,
            error: error.message,
            stack: error.stack,
            possibleCauses: [
              'Syntax error in route file',
              'Missing dependencies/imports',
              'TypeScript compilation issue',
              'Invalid file path',
              'Module resolution problem'
            ]
          });
          
          // Console output for immediate debugging
          console.error(`\n❌ ROUTE IMPORT ERROR: ${feature.name}/${routeConfig.file}`);
          console.error(`📂 Path: ${routeFilePath}`);
          console.error(`🔍 Error: ${error.message}`);
          console.error('');
          
          throw new Error(`Import failed: ${error.message}`);
        }

        const routeHandler: FastifyPluginCallback = module.default;

        if (typeof routeHandler !== 'function') {
          const availableExports = Object.keys(module);
          
          log.error('Invalid route export - must be a function', {
            category: 'route',
            feature: feature.name,
            file: routeConfig.file,
            expected: 'function',
            got: typeof routeHandler,
            availableExports,
            suggestion: availableExports.length > 0 
              ? `Available exports: ${availableExports.join(', ')}. Use 'export default' for your route handler.`
              : 'Add a default export function that registers routes.'
          });
          
          console.error(`\n❌ INVALID ROUTE EXPORT: ${feature.name}/${routeConfig.file}`);
          console.error(`Expected: function, Got: ${typeof routeHandler}`);
          console.error(`Available exports: ${availableExports.join(', ')}`);
          console.error('Fix: export default function(fastify) { ... }');
          console.error('');
          
          throw new Error(`Route file must export a function as default. Got: ${typeof routeHandler}`);
        }

        // Register with Fastify using prefix
        const prefix = routeConfig.prefix || `/api/${feature.name}`;
        
        try {
          log.debug('Registering route with Fastify', {
            feature: feature.name,
            prefix,
            file: routeConfig.file
          });
          
          await app.register(routeHandler, { prefix });
          
          log.debug('Route registered successfully', {
            feature: feature.name,
            prefix,
            file: routeConfig.file
          });
          
        } catch (registerError) {
          const error = registerError instanceof Error ? registerError : new Error(String(registerError));
          
          log.error('Fastify route registration failed', {
            category: 'route',
            feature: feature.name,
            prefix: prefix,
            file: routeConfig.file,
            error: error.message,
            stack: error.stack,
            possibleCauses: [
              'Route handler throws during registration',
              'Duplicate route definitions',
              'Invalid Fastify plugin structure',
              'Middleware setup errors',
              'Schema validation errors'
            ]
          });
          
          console.error(`\n❌ ROUTE REGISTRATION ERROR: ${feature.name}`);
          console.error(`📍 Prefix: ${prefix}`);
          console.error(`📄 File: ${routeConfig.file}`);
          console.error(`🔍 Error: ${error.message}`);
          console.error('');
          
          throw new Error(`Fastify registration failed: ${error.message}`);
        }

        registeredRoutes++;
      }

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      log.error('Route registration failed for feature', {
        category: 'startup',
        feature: feature.name,
        featurePath: feature.path,
        routeConfigs: feature.config.routes,
        error: error.message,
        stack: error.stack,
        troubleshooting: [
          'Check if route files exist and have correct exports',
          'Verify TypeScript compilation completed successfully',
          'Ensure all imports in route files are valid',
          'Check for syntax errors in route handlers',
          'Verify Fastify plugin structure is correct'
        ]
      });
      
      // 🔒 ENFORCEMENT: Fail startup if route registration fails
      console.error(`\n💥 FEATURE STARTUP FAILED: ${feature.name}`);
      console.error(`📂 Feature path: ${feature.path}`);
      console.error(`🔍 Root cause: ${error.message}`);
      console.error(`📋 Routes to register: ${feature.config.routes?.length || 0}`);
      if (feature.config.routes?.length) {
        feature.config.routes.forEach((route, i) => {
          console.error(`   ${i + 1}. ${route.file} → ${route.prefix || `/api/${feature.name}`}`);
        });
      }
      console.error('');
      
      throw new Error(`❌ ROUTE REGISTRATION FAILED for '${feature.name}': ${error.message}`);
    }
  }

  if (registeredRoutes > 0) {
    log.info(`Routes registered: ${registeredRoutes} endpoint groups`);
  }
}

// ============================================================================
// 🌐 SERVER STARTUP & LIFECYCLE
// ============================================================================

/**
 * Start the server
 * @llm-rule WHEN: All setup is complete and ready to accept HTTP requests
 * @llm-rule AVOID: Starting without contract validation - server must be safe
 */
async function startServer(app: FastifyInstance, config: any, log: any): Promise<void> {
  const host = config.get('server.host', '0.0.0.0');
  const port = config.get('server.port', 3000);

  await app.listen({ host, port });

  console.log(`\n✨ Flux Framework ready! 🚀`);
  console.log(`🌐 Server: http://${host}:${port}`);
  console.log(`🔗 Health: http://${host}:${port}/health\n`);
}

/**
 * Setup graceful shutdown handlers
 * @llm-rule WHEN: Server is running and needs proper shutdown handling
 * @llm-rule AVOID: Abrupt shutdowns - always handle SIGTERM/SIGINT gracefully
 */
function setupGracefulShutdown(app: FastifyInstance, log: any): void {
  const shutdown = async (signal: string) => {
    log.info(`${signal} received, shutting down gracefully`);
    try {
      await app.close();
      log.info('Server closed successfully');
      console.log('\n✨ 👋 Flux stopped gracefully');
      process.exit(0);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ============================================================================
// 🎯 MAIN ENTRY POINT - CONTINUED
// ============================================================================

/**
 * Main entry point for Flux framework
 * @llm-rule WHEN: Starting the Flux Framework server
 * @llm-rule AVOID: Calling this multiple times - single server instance only
 * @llm-rule NOTE: This orchestrates the entire startup sequence with complete error handling
 */
async function main(): Promise<void> {
  // Load environment variables
  dotenv.config();

  const log = logger.get('flux');
  const config = configure.get();

  // 🛡️ Setup comprehensive runtime error handling
  process.on('uncaughtException', (error) => {
    log.error('Uncaught exception - server will exit', { 
      category: 'runtime',
      error: error.message,
      stack: error.stack,
      errorType: 'UNCAUGHT_EXCEPTION'
    });
    console.log('\n💥 Uncaught exception occurred - check logs for details\n');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled promise rejection', {
      category: 'runtime', 
      reason: String(reason),
      errorType: 'UNHANDLED_REJECTION',
      promise: String(promise)
    });
    // Don't exit for unhandled rejections - just log them
  });

  try {
    log.info('Starting Flux Framework...', {
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      cwd: process.cwd(),
      nodeVersion: process.version
    });

    // Enable debug logging in development
    if (process.env.NODE_ENV !== 'production') {
      log.debug('Development mode - enabling detailed logging');
    }

    // 🔍 1. Discover features
    log.info('Step 1: Discovering features...');
    const features = await discoverFeatures(log);
    discoveredFeatures = features; // Store for root endpoint
    log.info(`Step 1 complete: Found ${features.length} features`);

    // 🔒 2. ENFORCE CONTRACTS - Server will not start if contracts are invalid
    log.info('Step 2: Enforcing contracts...');
    await enforceContracts(features, log);
    log.info('Step 2 complete: All contracts valid');

    // 🚀 3. Create and configure Fastify app
    log.info('Step 3: Creating Fastify app...');
    const app = await createFluxApp(config, log);
    log.info('Step 3 complete: Fastify app created');

    // 📡 4. Register feature routes with enforcement
    log.info('Step 4: Registering feature routes...');
    await registerFeaturesWithEnforcement(app, features, log);
    log.info('Step 4 complete: Routes registered');

    // 🌐 5. Start server
    log.info('Step 5: Starting server...');
    await startServer(app, config, log);
    log.info('Step 5 complete: Server started');

    // 🛡️ 6. Setup graceful shutdown
    log.info('Step 6: Setting up graceful shutdown...');
    setupGracefulShutdown(app, log);
    log.info('Step 6 complete: Startup finished successfully');

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    
    // 🔧 ENHANCED: Better startup error categorization
    let errorCategory = 'unknown';
    let suggestions: string[] = [];
    
    if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      errorCategory = 'missing_files';
      suggestions = [
        'Missing required files or directories',
        'Check if all dependencies are installed: npm install',
        'Verify file paths and directory structure',
        'Ensure TypeScript files are compiled: npm run build'
      ];
    } else if (error.message.includes('CONTRACT_ENFORCEMENT')) {
      errorCategory = 'contract_validation';
      suggestions = [
        'Feature contracts are invalid',
        'Run: npm run flux:contracts to see specific errors',
        'Add missing contracts to feature index.ts files',
        'Fix contract dependencies and provides/needs declarations'
      ];
    } else if (error.message.includes('EADDRINUSE') || error.message.includes('port')) {
      errorCategory = 'port_conflict';
      suggestions = [
        'Port is already in use',
        'Stop other processes using the port',
        'Change PORT environment variable',
        'Use different port: PORT=3001 node dist/flux.js'
      ];
    } else if (error.message.includes('permission') || error.message.includes('EACCES')) {
      errorCategory = 'permissions';
      suggestions = [
        'Permission denied',
        'Check file/directory permissions',
        'Run with proper permissions',
        'Ensure you have write access to log directories'
      ];
    } else if (error.message.includes('Cannot resolve') || error.message.includes('MODULE_NOT_FOUND')) {
      errorCategory = 'module_resolution';
      suggestions = [
        'Missing dependencies or incorrect imports',
        'Run: npm install to install dependencies',
        'Check import paths in your code',
        'Verify all required packages are in package.json'
      ];
    }
    
    log.error('Flux startup failed', {
      category: 'startup',
      errorType: 'STARTUP_FAILURE',
      errorCategory,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      },
      suggestions
    });
    
    // 🔧 ENHANCED: Better console error output
    console.error(`\n💥 FLUX STARTUP FAILED`);
    console.error(`📋 Category: ${errorCategory}`);
    console.error(`🔍 Error: ${error.message}`);
    console.error(`📍 Location: ${error.stack?.split('\n')[1] || 'unknown'}`);
    
    if (suggestions.length > 0) {
      console.error(`\n💡 Possible Solutions:`);
      suggestions.forEach((suggestion, i) => {
        console.error(`   ${i + 1}. ${suggestion}`);
      });
    }
    
    console.error(`\n🔧 Debug Info:`);
    console.error(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.error(`   CWD: ${process.cwd()}`);
    console.error(`   Node: ${process.version}`);
    
    if (error.stack) {
      console.error(`\n📋 Full Stack Trace:`);
      console.error(error.stack);
    }
    
    console.error(''); // Empty line
    process.exit(1);
  }
}

// Start the application
main().catch(err => {
  const error = err instanceof Error ? err : new Error(String(err));
  logger.get('flux').error('Unexpected error in main()', {
    category: 'startup',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
  process.exit(1);
});

// ============================================================================
// 🔄 EXPORTS FOR EXTERNAL USE
// ============================================================================