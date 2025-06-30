/**
 * Flux Framework - Type-Safe Main Entry Point
 * @description Contract-driven TypeScript backend framework built on AppKit
 * @module @voilajsx/flux
 * @file flux.ts
 */

import dotenv from 'dotenv';
import { join } from 'path';
import { readdirSync, existsSync } from 'fs';

import Fastify, { type FastifyInstance, type FastifyPluginCallback } from 'fastify';

import { configure } from '@voilajsx/appkit/config';
import { error } from '@voilajsx/appkit/error';
import { logger } from '@voilajsx/appkit/logging';
import { 
  type FeatureContract, 
  type ContractItem,
  type ContractValidationResult,
  isPlatformService 
} from './contracts.js';

/**
 * Route configuration for a feature
 */
export interface FeatureRouteConfig {
  readonly file: string;
  readonly prefix?: string;
}

/**
 * Feature metadata
 */
export interface FeatureMeta {
  readonly name: string;
  readonly description?: string;
  readonly version?: string;
  readonly author?: string;
}

// Global variable to store discovered features for the root endpoint
let discoveredFeatures: DiscoveredFeature[] = [];

/**
 * Get discovered features (for root endpoint)
 */
function getDiscoveredFeatures(): DiscoveredFeature[] {
  return discoveredFeatures;
}

export interface FeatureConfig {
  readonly name: string;
  readonly contract?: FeatureContract;
  readonly routes?: readonly FeatureRouteConfig[];
  readonly meta?: FeatureMeta;
}

/**
 * Discovered feature with runtime information
 */
export interface DiscoveredFeature {
  readonly name: string;
  readonly path: string;
  readonly config: FeatureConfig;
  readonly contract: FeatureContract | null;
}

/**
 * Contract validation summary
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

/**
 * Main entry point for Flux framework
 */
async function main(): Promise<void> {
  // Load environment variables
  dotenv.config();

  // Debug environment loading FIRST
  console.log('✨ === ENVIRONMENT DEBUG ===');
  console.log(`✨ NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`✨ PORT: ${process.env.PORT}`);
  console.log(`✨ Has JWT_SECRET: ${!!process.env.JWT_SECRET}`);
  console.log(`✨ JWT_SECRET length: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0}`);
  console.log('✨ =========================');

  const log = logger.get('flux');
  const config = configure.get();

  try {
    log.info('✨ Starting Flux Framework...');

    // Discover features
    const features = await discoverFeatures(log);
    discoveredFeatures = features; // Store for root endpoint

    // Validate contracts
    validateContracts(features, log);

    // Create and configure Fastify app
    const app = await createFluxApp(config, log);

    // Register feature routes
    await registerFeatures(app, features, log);

    // Start server
    await startServer(app, config, log);

    // Setup graceful shutdown
    setupGracefulShutdown(app, log);

  } catch (err: unknown) {
    const errorLog = logger.get('startup');
    const error = err instanceof Error ? err : new Error(String(err));
    errorLog.error('✨ ❌ Flux startup failed', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
    process.exit(1);
  }
}

/**
 * Discover all features in the features directory
 */
async function discoverFeatures(log: any): Promise<DiscoveredFeature[]> {
  const featuresPath = join(process.cwd(), 'src', 'features');
  const features: DiscoveredFeature[] = [];

  if (!existsSync(featuresPath)) {
    log.warn('✨ Features directory not found - no features will be loaded', {
      expectedPath: featuresPath
    });
    return features;
  }

  const featureDirs = readdirSync(featuresPath, { withFileTypes: true })
    .filter(dir => dir.isDirectory() && !dir.name.startsWith('_'))
    .map(dir => dir.name);

  log.info(`✨ Discovering features...`, { 
    path: featuresPath,
    candidates: featureDirs.length 
  });

  for (const featureName of featureDirs) {
    try {
      const featurePath = join(featuresPath, featureName);
      const indexPath = join(featurePath, 'index.ts');
      const fallbackPath = join(featurePath, 'index.js');

      // Try TypeScript first, then JavaScript
      const configPath = existsSync(indexPath) ? indexPath : 
                        existsSync(fallbackPath) ? fallbackPath : null;

      if (!configPath) {
        log.warn(`✨ Feature '${featureName}' missing index file`, { 
          tried: ['index.ts', 'index.js'] 
        });
        continue;
      }

      // Import feature configuration
      const module = await import(`file://${configPath}`);
      const featureConfig: FeatureConfig = module.default;

      if (!featureConfig || !featureConfig.name) {
        log.warn(`✨ Feature '${featureName}' has invalid configuration`);
        continue;
      }

      features.push({
        name: featureName,
        path: featurePath,
        config: featureConfig,
        contract: featureConfig.contract || null
      });

      log.info(`✨ ✅ Discovered feature '${featureName}'`, {
        hasContract: !!featureConfig.contract,
        hasRoutes: !!(featureConfig.routes && featureConfig.routes.length > 0)
      });

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error(`✨ ❌ Failed to load feature '${featureName}'`, {
        error: error.message
      });
    }
  }

  log.info(`✨ Feature discovery complete`, { 
    total: features.length,
    features: features.map(f => f.name)
  });

  return features;
}

/**
 * Validate feature contracts
 */
function validateContracts(features: DiscoveredFeature[], log: any): void {
  log.info('✨ Validating feature contracts...');

  const errors: string[] = [];
  const warnings: string[] = [];

  // Collect all provided services and routes
  const providedServices = new Set<string>();
  const providedRoutes = new Set<string>();
  const providedMiddleware = new Set<string>();
  const providedModels = new Set<string>();

  // Platform services that are automatically available
  const platformServices = new Set([
    'logging', 'config', 'security', 'validation', 'auth'
  ]);

  // First pass: collect all provides
  for (const feature of features) {
    if (!feature.contract) {
      warnings.push(`Feature '${feature.name}' has no contract`);
      continue;
    }

    const provides = feature.contract.provides || [];
    for (const provided of provides) {
      switch (provided.type) {
        case 'service':
          if (providedServices.has(provided.value)) {
            errors.push(`Duplicate service '${provided.value}' provided by '${feature.name}'`);
          } else {
            providedServices.add(provided.value);
          }
          break;
        case 'route':
          if (providedRoutes.has(provided.value)) {
            warnings.push(`Duplicate route '${provided.value}' provided by '${feature.name}'`);
          } else {
            providedRoutes.add(provided.value);
          }
          break;
        case 'middleware':
          if (providedMiddleware.has(provided.value)) {
            errors.push(`Duplicate middleware '${provided.value}' provided by '${feature.name}'`);
          } else {
            providedMiddleware.add(provided.value);
          }
          break;
        case 'model':
          if (providedModels.has(provided.value)) {
            errors.push(`Duplicate model '${provided.value}' provided by '${feature.name}'`);
          } else {
            providedModels.add(provided.value);
          }
          break;
      }
    }
  }

  // Second pass: validate all needs are satisfied
  for (const feature of features) {
    if (!feature.contract) continue;

    const needs = feature.contract.needs || [];
    for (const need of needs) {
      switch (need.type) {
        case 'platform':
          if (!isPlatformService(need.value)) {
            errors.push(`Feature '${feature.name}' needs unknown platform service '${need.value}'`);
          }
          break;
        case 'service':
          if (!providedServices.has(need.value)) {
            errors.push(`Feature '${feature.name}' needs service '${need.value}' but no feature provides it`);
          }
          break;
        case 'middleware':
          if (!providedMiddleware.has(need.value)) {
            errors.push(`Feature '${feature.name}' needs middleware '${need.value}' but no feature provides it`);
          }
          break;
        case 'model':
          if (!providedModels.has(need.value)) {
            errors.push(`Feature '${feature.name}' needs model '${need.value}' but no feature provides it`);
          }
          break;
      }
    }
  }

  // Log results
  if (errors.length > 0) {
    log.error('✨ ❌ Contract validation failed', { 
      errors: errors.length,
      warnings: warnings.length 
    });
    errors.forEach(error => log.error(`✨   • ${error}`));
    
    if (warnings.length > 0) {
      warnings.forEach(warning => log.warn(`✨   • ${warning}`));
    }
    
    throw new Error(`Contract validation failed: ${errors.length} errors found`);
  }

  if (warnings.length > 0) {
    log.warn('✨ ⚠️ Contract validation completed with warnings', { warnings: warnings.length });
    warnings.forEach(warning => log.warn(`✨   • ${warning}`));
  } else {
    log.info('✨ ✅ All contracts validated successfully', {
      features: features.length,
      services: providedServices.size,
      routes: providedRoutes.size,
      middleware: providedMiddleware.size,
      models: providedModels.size
    });
  }
}

/**
 * Create and configure Fastify application
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

    errorLog[isServerError ? 'error' : 'warn']('✨ Request failed', {
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

  // Add request logging
  app.addHook('onRequest', async (request) => {
    (request as any).log = logger.get('http').child({
      requestId: request.id,
      method: request.method,
      url: request.url,
      ip: request.ip
    });
    
    if (!['/favicon.ico', '/robots.txt', '/health'].includes(request.url)) {
      (request as any).log.info('✨ Request started');
    }
  });

  app.addHook('onResponse', async (request, reply) => {
    const requestLog = (request as any).log;
    if (requestLog && !['/favicon.ico', '/robots.txt', '/health'].includes(request.url)) {
      requestLog.info('✨ Request completed', {
        statusCode: reply.statusCode,
        durationMs: reply.elapsedTime
      });
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

  log.info('✨ ✅ Fastify app configured with error handling and logging');
  return app;
}

/**
 * Register feature routes with Fastify
 */
async function registerFeatures(app: FastifyInstance, features: DiscoveredFeature[], log: any): Promise<void> {
  log.info('✨ Registering feature routes...');

  let registeredRoutes = 0;

  for (const feature of features) {
    try {
      const { config } = feature;

      // Check if feature has routes
      if (!config.routes || config.routes.length === 0) {
        log.debug(`✨ Feature '${feature.name}' has no routes to register`);
        continue;
      }

      // Register routes for this feature
      for (const routeConfig of config.routes) {
        const routePath = join(feature.path, routeConfig.file);
        const tsPath = routePath.replace(/\.js$/, '.ts');
        const finalPath = existsSync(tsPath) ? tsPath : routePath;

        if (!existsSync(finalPath)) {
          log.warn(`✨ Route file not found for feature '${feature.name}'`, {
            expectedPath: finalPath
          });
          continue;
        }

        // Import and register route
        const module = await import(`file://${finalPath}`);
        const routeHandler: FastifyPluginCallback = module.default;

        if (typeof routeHandler !== 'function') {
          log.error(`✨ Route file must export a function for feature '${feature.name}'`, {
            path: finalPath
          });
          continue;
        }

        // Register with Fastify using prefix
        await app.register(routeHandler, { 
          prefix: routeConfig.prefix || `/api/${feature.name}`
        });

        registeredRoutes++;
        log.info(`✨ ✅ Registered routes for '${feature.name}'`, {
          prefix: routeConfig.prefix || `/api/${feature.name}`,
          file: routeConfig.file
        });
      }

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error(`✨ ❌ Failed to register routes for feature '${feature.name}'`, {
        error: error.message
      });
    }
  }

  log.info('✨ Feature registration complete', { 
    features: features.length,
    routes: registeredRoutes 
  });
}

/**
 * Start the server
 */
async function startServer(app: FastifyInstance, config: any, log: any): Promise<void> {
  const host = config.get('server.host', '0.0.0.0');
  const port = config.get('server.port', 3000);

  await app.listen({ host, port });

  log.info('✨ 🎯 Flux server started', {
    url: `http://${host}:${port}`,
    pid: process.pid,
    environment: config.get('app.environment', 'development')
  });

  console.log(`\n✨ ✨ Flux Framework is ready!`);
  console.log(`✨ 🌐 Server: http://${host}:${port}`);
  console.log(`✨ 📁 Features directory: ./src/features/`);
  console.log(`✨ 🔗 Health check: http://${host}:${port}/health`);
  console.log(`✨ 📋 Contract-driven TypeScript features with AppKit integration\n`);
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(app: FastifyInstance, log: any): void {
  const shutdown = async (signal: string) => {
    log.info(`✨ ${signal} received, shutting down gracefully`);
    try {
      await app.close();
      log.info('✨ Server closed successfully');
      console.log('\n✨ 👋 Flux stopped gracefully');
      process.exit(0);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      log.error('✨ Error during shutdown', { error: error.message });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start the application
main();