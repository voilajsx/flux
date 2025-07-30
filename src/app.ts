/**
 * FLUX Framework Express application with three-layer feature control
 * @module @voilajsx/flux/app
 * @file src/app.ts
 * 
 * @llm-rule WHEN: Setting up Express app with feature flags + compliance + manifest control
 * @llm-rule AVOID: Loading disabled features or non-compliant endpoints
 * @llm-rule NOTE: Three-layer control: feature flags (human) + feature compliance (automated) + endpoint manifests (automated)
 */

import express from 'express';
import { join } from 'path';
import { readdir, stat, readFile } from 'fs/promises';
import { configClass } from '@voilajsx/appkit/config';
import { loggerClass } from '@voilajsx/appkit/logger';
import { errorClass } from '@voilajsx/appkit/error';
import { securityClass } from '@voilajsx/appkit/security';
import { utilClass } from '@voilajsx/appkit/util';

// Initialize VoilaJSX AppKit modules following standard patterns
const config = configClass.get();
const logger = loggerClass.get('app');
const error = errorClass.get();
const security = securityClass.get();
const util = utilClass.get();

// Create Express application
export const app = express();

/**
 * Feature flags configuration structure
 */
interface FeatureConfig {
  enabled: boolean;
  environments: string[];
}

/**
 * Feature flags configuration file structure
 */
interface FeatureFlags {
  [featureName: string]: FeatureConfig;
}

/**
 * Feature compliance structure from {feature}.compliance.json
 */
interface FeatureCompliance {
  feature: string;
  status: string;
  active: boolean;
  summary?: {
    compliance_score?: string;
    deployment_ready?: string;
  };
  deployment_readiness?: {
    meets_reliability_threshold?: boolean;
    blocking_issues_total?: number;
  };
}

/**
 * Feature endpoint structure for manifest-based routing
 */
interface FeatureEndpoint {
  feature: string;
  endpoint: string;
  manifestPath: string;
  logicPath: string;
  endpointPath: string;
}

/**
 * Manifest structure for endpoint validation
 */
interface EndpointManifest {
  endpoint: string;
  feature: string;
  route: string;
  status: string;
  active: boolean;
  routes: Record<string, string>;
  contract_compliance?: {
    score: string;
    routes_match: string;
    functions_match: string;
  };
  developer_gate?: {
    can_deploy: boolean;
    blocking_count: number;
  };
  blocking_issues?: string[];
  quick_status?: {
    overall: string;
  };
}

/**
 * Loads feature flags configuration from features.config.json
 * @llm-rule WHEN: Loading human-controlled feature flags for environment-based feature control
 * @llm-rule AVOID: Complex validation - keep simple and fast
 */
async function loadFeatureFlags(): Promise<FeatureFlags> {
  try {
    const configPath = join(process.cwd(), 'src', 'api', 'features.config.json');
    const configContent = await readFile(configPath, 'utf-8');
    const featureFlags = JSON.parse(configContent) as FeatureFlags;
    
    logger.info('✅ Feature flags loaded', {
      features: Object.keys(featureFlags),
      path: configPath
    });
    
    return featureFlags;
  } catch (error) {
    logger.error('❌ Feature flags loading failed - using empty config', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return {};
  }
}

/**
 * Loads feature compliance from {feature}.compliance.json
 * @llm-rule WHEN: Loading automated compliance status for entire features
 * @llm-rule AVOID: Complex validation - trust compliance report
 */
async function loadFeatureCompliance(featureName: string): Promise<FeatureCompliance | null> {
  try {
    const compliancePath = join(process.cwd(), 'src', 'api', featureName, `${featureName}.compliance.json`);
    const complianceContent = await readFile(compliancePath, 'utf-8');
    const compliance = JSON.parse(complianceContent) as FeatureCompliance;
    
    logger.debug(`✅ Feature compliance loaded for ${featureName}`, {
      status: compliance.status,
      active: compliance.active
    });
    
    return compliance;
  } catch (error) {
    logger.warn(`⚠️ Feature compliance not found for ${featureName} - assuming compliant`, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

/**
 * Checks if a feature is enabled based on feature flags and current environment
 * @llm-rule WHEN: Determining if feature should be loaded based on human-controlled flags
 * @llm-rule AVOID: Complex logic - simple enabled + environment check
 */
function isFeatureEnabled(featureName: string, featureFlags: FeatureFlags): boolean {
  const feature = featureFlags[featureName];
  
  if (!feature) {
    logger.debug(`⚠️ Feature '${featureName}' not found in config - skipping`);
    return false;
  }
  
  if (!feature.enabled) {
    logger.debug(`⚠️ Feature '${featureName}' disabled in config`);
    return false;
  }
  
  const currentEnv = process.env.NODE_ENV || 'development';
  const envAllowed = feature.environments.includes(currentEnv);
  
  if (!envAllowed) {
    logger.debug(`⚠️ Feature '${featureName}' not allowed in environment '${currentEnv}'`, {
      allowedEnvironments: feature.environments
    });
    return false;
  }
  
  return true;
}

/**
 * Checks if a feature is compliant based on compliance report
 * @llm-rule WHEN: Determining if feature should be loaded based on automated compliance
 * @llm-rule AVOID: Loading non-compliant features - safety first
 */
function isFeatureCompliant(featureName: string, compliance: FeatureCompliance | null): { allowed: boolean; reason?: string } {
  if (!compliance) {
    // No compliance file means feature is assumed compliant (for dev)
    return { allowed: true };
  }
  
  // Primary gate: compliance active flag
  if (!compliance.active) {
    return {
      allowed: false,
      reason: `Feature '${featureName}' is inactive in compliance report (active: false)`
    };
  }
  
  // Secondary gate: deployment readiness
  if (compliance.deployment_readiness?.meets_reliability_threshold === false) {
    return {
      allowed: false,
      reason: `Feature '${featureName}' does not meet reliability threshold`
    };
  }
  
  // Tertiary gate: blocking issues
  if (compliance.deployment_readiness?.blocking_issues_total && compliance.deployment_readiness.blocking_issues_total > 0) {
    return {
      allowed: false,
      reason: `Feature '${featureName}' has ${compliance.deployment_readiness.blocking_issues_total} blocking issues`
    };
  }
  
  return { allowed: true };
}

/**
 * Checks if endpoint should be loaded based on manifest compliance
 * @llm-rule WHEN: Validating automated compliance gates for endpoint deployment
 * @llm-rule AVOID: Loading non-compliant endpoints - safety first
 */
function isEndpointCompliant(manifest: EndpointManifest): { allowed: boolean; reason?: string } {
  // Primary gate: manifest active flag
  if (!manifest.active) {
    return {
      allowed: false,
      reason: `Endpoint '${manifest.feature}/${manifest.endpoint}' is inactive in manifest (active: false)`
    };
  }
  
  // Secondary gate: deployment readiness
  if (manifest.developer_gate && !manifest.developer_gate.can_deploy) {
    return {
      allowed: false,
      reason: `Endpoint '${manifest.feature}/${manifest.endpoint}' blocked by developer gate (can_deploy: false)`
    };
  }
  
  // Tertiary gate: blocking issues
  if (manifest.blocking_issues && manifest.blocking_issues.length > 0) {
    return {
      allowed: false,
      reason: `Endpoint '${manifest.feature}/${manifest.endpoint}' has ${manifest.blocking_issues.length} blocking issues: ${manifest.blocking_issues.join(', ')}`
    };
  }
  
  return { allowed: true };
}

/**
 * Configures Express middleware stack with VoilaJSX AppKit integration
 * @llm-rule WHEN: Setting up middleware before route discovery to ensure proper request processing
 * @llm-rule AVOID: Adding middleware after routes - order matters for Express middleware stack
 */
function setupMiddleware(): void {
  // 1. Basic Express middleware for JSON APIs
  app.use(express.json({ 
    limit: config.get('server.json.limit', '10mb'),
    strict: true 
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: config.get('server.urlencoded.limit', '10mb')
  }));

  // 2. CORS configuration for stateless API access
  const corsOrigin = config.get('cors.origin', '*');
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', corsOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // 3. Security middleware with VoilaJSX AppKit
  const rateLimitEnabled = config.get('rate.limit.enabled', true);
  if (rateLimitEnabled) {
    const windowMs = config.get('rate.limit.window.ms', 900000); // 15 minutes
    const maxRequests = config.get('rate.limit.max', 100);
    
    const rateLimitMiddleware = security.requests(maxRequests, windowMs);
    app.use('/api', rateLimitMiddleware as express.RequestHandler);
    
    logger.info('✅ Rate limiting enabled', { maxRequests, windowMs });
  }

  // 4. Request logging and correlation IDs
  app.use((req, res, next) => {
    req.requestId = util.uuid();
    
    req.log = logger.child({
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    const startTime = Date.now();
    req.log.info('🔄 Request started');

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'warn' : 'info';
      
      req.log[level]('✅ Request completed', {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length')
      });
    });

    next();
  });

  logger.info('✅ Express middleware configured', {
    json: true,
    cors: corsOrigin,
    rateLimiting: rateLimitEnabled
  });
}

/**
 * Sets up simple default root endpoint
 * @llm-rule WHEN: Adding basic root endpoint to show system is active
 * @llm-rule AVOID: Complex logic in root endpoint - keep minimal for quick status
 */
function setupDefaultRoutes(): void {
  app.get('/', (req, res) => {
    res.json({
      message: 'Hello! FLUX Framework is active.',
      status: 'active',
      timestamp: new Date().toISOString(),
      routing: 'three-layer-control',
      validation: 'feature-flags + compliance + manifests'
    });
  });

  logger.info('✅ Default routes configured');
}

/**
 * Discovers all feature endpoints using three-layer control system
 * @llm-rule WHEN: Scanning for enabled features that pass compliance and have valid manifests
 * @llm-rule AVOID: Loading disabled, non-compliant, or blocked endpoints
 * @llm-rule NOTE: Three-layer filtering: feature flags → feature compliance → endpoint manifests
 */
async function discoverFeatures(featureFlags: FeatureFlags): Promise<FeatureEndpoint[]> {
  const features: FeatureEndpoint[] = [];
  const featuresPath = join(process.cwd(), 'src', 'api');

  try {
    const featureDirs = await readdir(featuresPath);

    for (const featureDir of featureDirs) {
      // Skip system files
      if (featureDir.startsWith('_') || featureDir.startsWith('.') || featureDir.endsWith('.json')) {
        continue;
      }

      // First gate: Check feature flags
      if (!isFeatureEnabled(featureDir, featureFlags)) {
        logger.debug(`⏭️ Feature '${featureDir}' disabled by feature flags`);
        continue;
      }

      // Second gate: Check feature compliance
      const compliance = await loadFeatureCompliance(featureDir);
      const complianceCheck = isFeatureCompliant(featureDir, compliance);
      
      if (!complianceCheck.allowed) {
        logger.warn(`⚠️ FEATURE COMPLIANCE BLOCKED: ${featureDir}`, {
          reason: complianceCheck.reason,
          status: compliance?.status,
          active: compliance?.active
        });
        continue;
      }

      const featurePath = join(featuresPath, featureDir);
      const featureStat = await stat(featurePath);

      if (!featureStat.isDirectory()) {
        continue;
      }

      // Discover endpoints within compliant feature
      const endpointDirs = await readdir(featurePath);

      for (const endpointDir of endpointDirs) {
        // Skip feature-level config files
        if (endpointDir.endsWith('.yml') || endpointDir.endsWith('.json') || endpointDir.endsWith('.log')) {
          continue;
        }

        const endpointPath = join(featurePath, endpointDir);
        const endpointStat = await stat(endpointPath);

        if (!endpointStat.isDirectory()) {
          continue;
        }

        // Check for manifest file
        const manifestPath = join(endpointPath, `${endpointDir}.manifest.json`);
        const logicPath = join(endpointPath, `${endpointDir}.logic.ts`);

        try {
          await stat(manifestPath);
          
          features.push({
            feature: featureDir,
            endpoint: endpointDir,
            manifestPath,
            logicPath,
            endpointPath
          });
        } catch {
          // No manifest file - skip endpoint
          logger.debug(`⚠️ No manifest found for ${featureDir}/${endpointDir}`);
        }
      }
    }

    logger.info('🔍 Feature discovery completed', {
      totalEndpoints: features.length,
      enabledFeatures: [...new Set(features.map(f => f.feature))]
    });

    return features;

  } catch (error) {
    logger.error('❌ Feature discovery failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

/**
 * Loads and parses endpoint manifest file
 * @llm-rule WHEN: Loading manifest to determine endpoint compliance and routing
 * @llm-rule AVOID: Complex validation - manifest is pre-validated during generation
 */
async function loadManifest(manifestPath: string): Promise<EndpointManifest | null> {
  try {
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as EndpointManifest;
    
    logger.debug('✅ Manifest loaded', {
      endpoint: manifest.endpoint,
      feature: manifest.feature,
      active: manifest.active,
      status: manifest.status
    });
    
    return manifest;

  } catch (error) {
    logger.error('❌ Manifest loading failed', {
      path: manifestPath,
      error: error instanceof Error ? error.message : 'Parse error'
    });
    return null;
  }
}

/**
 * Registers Express routes from endpoint manifest and logic file
 * @llm-rule WHEN: Loading route handlers from compliant, manifest-validated logic files
 * @llm-rule AVOID: Runtime validation - trust three-layer validation results
 * @llm-rule NOTE: Supports multiple routes per endpoint from manifest route mappings
 */
async function registerEndpointFromManifest(
  feature: FeatureEndpoint, 
  manifest: EndpointManifest
): Promise<void> {
  try {
    // Import the logic module
    const logicImportPath = feature.logicPath.replace(/\.ts$/, '.js');
    const logicModule = await import(logicImportPath);
    
    let handlersRegistered = 0;
    const registeredRoutes: string[] = [];
    
    // Register multiple routes based on manifest route mappings
    for (const [route, functionName] of Object.entries(manifest.routes)) {
      const handler = logicModule[functionName];
      
      if (!handler || typeof handler !== 'function') {
        logger.warn(`⚠️ Handler function '${functionName}' not found in logic module`, {
          feature: feature.feature,
          endpoint: feature.endpoint,
          route,
          availableFunctions: Object.keys(logicModule).filter(key => typeof logicModule[key] === 'function')
        });
        continue;
      }
      
      // Parse HTTP method and path from route
      const [method, routePath] = route.split(' ', 2);
      
      if (!method || !routePath) {
        logger.warn(`⚠️ Invalid route format '${route}' - expected 'METHOD /path'`);
        continue;
      }
      
      // Register route based on HTTP method with auto /api prefix
      try {
        // Auto-prepend /api to all feature routes for microservices standard
        const apiPath = `/api${routePath}`;
        
        switch (method.toLowerCase()) {
          case 'get':
            app.get(apiPath, error.asyncRoute(handler));
            break;
          case 'post':
            app.post(apiPath, error.asyncRoute(handler));
            break;
          case 'put':
            app.put(apiPath, error.asyncRoute(handler));
            break;
          case 'delete':
            app.delete(apiPath, error.asyncRoute(handler));
            break;
          case 'patch':
            app.patch(apiPath, error.asyncRoute(handler));
            break;
          case 'options':
            app.options(apiPath, error.asyncRoute(handler));
            break;
          default:
            logger.warn(`⚠️ Unsupported HTTP method '${method}' in route '${route}'`);
            continue;
        }
        
        handlersRegistered++;
        registeredRoutes.push(`${method} ${apiPath} → ${functionName}()`);
        
        logger.debug(`📍 Route registered: ${method} ${apiPath} → ${functionName}()`, {
          feature: feature.feature,
          endpoint: feature.endpoint,
          method: method.toUpperCase(),
          originalPath: routePath,
          apiPath: apiPath
        });
        
      } catch (routeError) {
        logger.error(`❌ Route registration failed for ${route}`, {
          feature: feature.feature,
          endpoint: feature.endpoint,
          error: routeError instanceof Error ? routeError.message : 'Unknown error'
        });
      }
    }
    
    if (handlersRegistered > 0) {
      logger.info(`✅ Endpoint registered: ${feature.feature}/${feature.endpoint}`, {
        routesRegistered: handlersRegistered,
        totalRoutes: Object.keys(manifest.routes).length,
        status: manifest.status,
        routes: registeredRoutes
      });
    } else {
      logger.warn(`⚠️ No routes registered for ${feature.feature}/${feature.endpoint}`, {
        declaredRoutes: Object.keys(manifest.routes).length,
        availableFunctions: Object.keys(logicModule).filter(key => typeof logicModule[key] === 'function')
      });
    }

  } catch (error) {
    logger.error(`❌ Endpoint registration failed for ${feature.feature}/${feature.endpoint}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      manifestPath: feature.manifestPath,
      logicPath: feature.logicPath
    });
  }
}

/**
 * Discovers and registers FLUX Framework features using three-layer control system
 * @llm-rule WHEN: Auto-discovering features with feature flags + compliance + manifest gates
 * @llm-rule AVOID: Loading disabled, non-compliant, or blocked endpoints
 * @llm-rule NOTE: Layer 1: feature flags (human), Layer 2: feature compliance (automated), Layer 3: endpoint manifests (automated)
 */
async function setupFeatureRouting(): Promise<void> {
  logger.info('🔍 Starting three-layer feature control system');
  
  // Load feature flags first
  const featureFlags = await loadFeatureFlags();
  
  // Discover features filtered by feature flags + compliance
  const features = await discoverFeatures(featureFlags);
  
  if (features.length === 0) {
    logger.warn('⚠️ No compliant features with manifests found');
    return;
  }
  
  let activeCount = 0;
  let skippedCount = 0;
  const skipReasons: { [key: string]: string } = {};
  
  for (const feature of features) {
    const manifest = await loadManifest(feature.manifestPath);
    
    if (!manifest) {
      logger.warn(`⚠️ Failed to load manifest for ${feature.feature}/${feature.endpoint}`);
      skippedCount++;
      skipReasons[`${feature.feature}/${feature.endpoint}`] = 'manifest_load_failed';
      continue;
    }
    
    // Third gate: Check endpoint manifest compliance
    const complianceCheck = isEndpointCompliant(manifest);
    if (complianceCheck.allowed) {
      await registerEndpointFromManifest(feature, manifest);
      activeCount++;
      logger.info(`✅ Loaded: ${feature.feature}/${feature.endpoint}`);
    } else {
      // Block with clear compliance message
      skippedCount++;
      skipReasons[`${feature.feature}/${feature.endpoint}`] = 'endpoint_blocked';
      
      logger.warn(`⚠️ ENDPOINT MANIFEST BLOCKED: ${feature.feature}/${feature.endpoint}`, {
        reason: complianceCheck.reason,
        status: manifest.status,
        active: manifest.active,
        canDeploy: manifest.developer_gate?.can_deploy,
        blockingCount: manifest.blocking_issues?.length || 0,
        blockingIssues: manifest.blocking_issues || []
      });
    }
  }
  
  logger.info('✅ Feature routing completed', {
    totalDiscovered: features.length,
    activeEndpoints: activeCount,
    skippedEndpoints: skippedCount,
    routing: 'three-layer-control',
    skipReasons
  });
}

/**
 * Sets up system health and information endpoints
 * @llm-rule WHEN: Adding system endpoints for monitoring and debugging
 * @llm-rule AVOID: Complex logic in system routes - keep lightweight
 */
function setupSystemRoutes(): void {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      routing: 'three-layer-control',
      validation: 'feature-flags + compliance + manifests'
    });
  });
  
  // API information endpoint
  app.get('/api', (req, res) => {
    res.json({
      message: 'FLUX Framework API',
      version: process.env.npm_package_version || '1.0.0',
      routing: 'three-layer-control',
      validation: 'feature-flags + compliance + manifests',
      timestamp: new Date().toISOString()
    });
  });
  
  // Favicon handler
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });

  logger.info('✅ System routes configured', {
    health: '/health',
    api: '/api',
    routing: 'three-layer-control'
  });
}

/**
 * Configures final error handling middleware
 * @llm-rule WHEN: Setting up global error handling as the last middleware in Express stack
 * @llm-rule AVOID: Adding middleware after error handlers - Express requires error handlers to be last
 */
function setupErrorHandling(): void {
  // Compliance blocked endpoints handler (before 404)
  app.use('/api/*', (req, res, next) => {
    // If we reach here, endpoint exists but was blocked by compliance
    const err = error.forbidden(
      'This endpoint is currently blocked due to compliance restrictions. Please check feature flags and manifest status.'
    );
    next(err);
  });

  // 404 handler for unmatched routes
  app.use('*', (req, res, next) => {
    const err = error.notFound(`Route not found: ${req.method} ${req.originalUrl}`);
    next(err);
  });

  // Global error handler (must be last)
  app.use(error.handleErrors());

  logger.info('✅ Error handling configured');
}

/**
 * Initializes complete FLUX Framework Express application with three-layer feature control
 * @llm-rule WHEN: Application startup to configure all middleware, routes, and error handling
 * @llm-rule AVOID: Loading disabled features or non-compliant endpoints
 * @llm-rule NOTE: Three-layer control: feature flags (human) + feature compliance (automated) + endpoint manifests (automated)
 */
async function initializeApp(): Promise<void> {
  try {
    logger.info('🚀 Initializing FLUX Framework application with three-layer feature control', {
      framework: 'FLUX',
      appkit: 'VoilaJSX',
      server: 'Express',
      modules: 'ES2022',
      routing: 'three-layer-control',
      validation: 'feature-flags + compliance + manifests'
    });

    // Initialize application components in strict order
    setupMiddleware();              // 1. Basic Express + VoilaJSX middleware
    setupDefaultRoutes();           // 2. Default root endpoint  
    await setupFeatureRouting();    // 3. Auto-discover and register three-layer controlled routes
    setupSystemRoutes();            // 4. Health and API info endpoints
    setupErrorHandling();           // 5. Global error handling (MUST BE LAST)

    logger.info('✅ FLUX Framework application ready', {
      middleware: 'configured',
      features: 'three-layer-control',
      routing: 'three-layer-controlled',
      errors: 'handled',
      validation: 'feature-flags + compliance + manifests'
    });

  } catch (error) {
    logger.error('💥 Application initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error; // Let server.ts handle the exit
  }
}

// Extend Express Request interface for FLUX Framework
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: any; // Logger instance with request context
    }
  }
}

// Initialize application with three-layer feature control
await initializeApp();