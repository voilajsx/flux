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
 * @llm-rule AVOID: Required metadata - all fields are optional
 */
export interface FeatureMeta {
  readonly name: string;
  readonly description?: string;
  readonly version?: string;
  readonly author?: string;
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

// Use Fastify's request type directly - no abstraction needed
export type RequestType = FastifyRequest;

export interface ResponseType {
  [key: string]: any;
}

export type RouteHandlerType = (req: FastifyRequest, reply: FastifyReply) => Promise<ResponseType> | ResponseType;

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
  const featuresPath = join(process.cwd(), 'src', 'features');
  const features: DiscoveredFeature[] = [];

  if (!existsSync(featuresPath)) {
    log.warn('Features directory not found - no features will be loaded', {
      expectedPath: featuresPath
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

  // Load enabled features
  for (const featureName of enabledDirs) {
    try {
      const featurePath = join(featuresPath, featureName);
      const indexPath = join(featurePath, 'index.ts');
      const fallbackPath = join(featurePath, 'index.js');

      // Try TypeScript first, then JavaScript
      const configPath = existsSync(indexPath) ? indexPath : 
                        existsSync(fallbackPath) ? fallbackPath : null;

      if (!configPath) {
        log.warn('Feature missing index file', { 
          feature: featureName,
          tried: ['index.ts', 'index.js'] 
        });
        continue;
      }

      // Import feature configuration
      const module = await import(`file://${configPath}`);
      const featureConfig: FeatureConfig = module.default;

      if (!featureConfig || !featureConfig.name) {
        log.warn('Feature has invalid configuration', { feature: featureName });
        continue;
      }

      features.push({
        name: featureName,
        path: featurePath,
        config: featureConfig,
        contract: featureConfig.contract || null
      });

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error('Failed to load feature', {
        feature: featureName,
        error: error.message
      });
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
// 📡 ROUTE REGISTRATION SYSTEM
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
        const routePath = join(feature.path, routeConfig.file);
        const tsPath = routePath.replace(/\.js$/, '.ts');
        const finalPath = existsSync(tsPath) ? tsPath : routePath;

        if (!existsSync(finalPath)) {
          log.error('Route file not found', {
            category: 'filesystem',
            feature: feature.name,
            file: routeConfig.file,
            expectedPath: finalPath,
            triedPaths: [tsPath, routePath]
          });
          
          throw new Error(`Route file missing: ${routeConfig.file}`);
        }

        // Import and register route
        let module;
        try {
          module = await import(`file://${finalPath}`);
        } catch (importError) {
          log.error(`Import failed: ${importError instanceof Error ? importError.message : String(importError)}`, {
            category: 'import',
            feature: feature.name,
            file: routeConfig.file
          });
          
          throw new Error(`Import failed: ${importError instanceof Error ? importError.message : String(importError)}`);
        }

        const routeHandler: FastifyPluginCallback = module.default;

        if (typeof routeHandler !== 'function') {
          log.error(`Route file must export a function as default. Got: ${typeof routeHandler}`, {
            category: 'route',
            feature: feature.name,
            file: routeConfig.file,
            expected: 'function',
            got: typeof routeHandler,
            availableExports: Object.keys(module)
          });
          
          throw new Error(`Route file must export a function as default. Got: ${typeof routeHandler}`);
        }

        // Register with Fastify using prefix
        const prefix = routeConfig.prefix || `/api/${feature.name}`;
        
        try {
          await app.register(routeHandler, { prefix });
        } catch (registerError) {
          log.error(`Fastify registration failed: ${registerError instanceof Error ? registerError.message : String(registerError)}`, {
            category: 'route',
            feature: feature.name,
            prefix: prefix,
            file: routeConfig.file
          });
          
          throw new Error(`Fastify registration failed: ${registerError instanceof Error ? registerError.message : String(registerError)}`);
        }

        registeredRoutes++;
      }

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      log.error(`❌ ROUTE REGISTRATION FAILED for '${feature.name}': ${error.message}`, {
        category: 'startup',
        feature: feature.name,
        featurePath: feature.path,
        routeConfigs: feature.config.routes
      });
      
      // 🔒 ENFORCEMENT: Fail startup if route registration fails
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
// 🎯 MAIN ENTRY POINT
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
    log.info('Starting Flux Framework...');

    // 🔍 1. Discover features
    const features = await discoverFeatures(log);
    discoveredFeatures = features; // Store for root endpoint

    // 🔒 2. ENFORCE CONTRACTS - Server will not start if contracts are invalid
    await enforceContracts(features, log);

    // 🚀 3. Create and configure Fastify app
    const app = await createFluxApp(config, log);

    // 📡 4. Register feature routes with enforcement
    await registerFeaturesWithEnforcement(app, features, log);

    // 🌐 5. Start server
    await startServer(app, config, log);

    // 🛡️ 6. Setup graceful shutdown
    setupGracefulShutdown(app, log);

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    log.error('Flux startup failed', {
      category: 'startup',
      errorType: 'STARTUP_FAILURE',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
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