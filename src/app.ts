/**
 * FLUX Framework Express application with versioned API routing
 * @module @voilajsx/flux/app
 * @file src/app.ts
 * 
 * @llm-rule WHEN: Setting up Express app with versioned APIs and feature control
 * @llm-rule AVOID: Loading disabled features or inactive endpoints
 * @llm-rule NOTE: Versioned routing /api/{appname}/{version}/{feature} with feature flags + manifests
 */

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { join } from 'path';
import { readdir, stat, readFile } from 'fs/promises';
import { configClass } from '@voilajsx/appkit/config';
import { loggerClass } from '@voilajsx/appkit/logger';
import { errorClass } from '@voilajsx/appkit/error';
import { securityClass } from '@voilajsx/appkit/security';
import { utilClass } from '@voilajsx/appkit/util';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: any;
      apiVersion?: string;
      isLatestVersion?: boolean;
      isDeprecated?: boolean;
    }
  }
}

// Initialize VoilaJSX AppKit modules
const config = configClass.get();
const logger = loggerClass.get('app');
const error = errorClass.get();
const security = securityClass.get();
const util = utilClass.get();

/**
 * Feature configuration structure in consolidated config
 */
interface FeatureConfig {
  enabled: boolean;
  environments: string[];
  description?: string;
  endpoints?: string[];
}

/**
 * Consolidated app configuration structure
 */
interface AppConfig {
  app: string;
  version: string;
  release_date: string;
  is_latest: boolean;
  is_deprecated?: boolean;
  changelog?: string[];
  features: {
    [featureName: string]: FeatureConfig;
  };
  metadata: {
    owner: string;
    created: string;
    last_updated: string;
  };
}

/**
 * Versioned feature endpoint structure
 */
interface VersionedEndpoint {
  appname: string;
  version: string;
  feature: string;
  endpoint: string;
  manifestPath: string;
  logicPath: string;
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
  blocking_issues?: string[];
}

/**
 * Extended Express Request with custom properties
 */
interface ExtendedRequest extends Request {
  requestId: string;
  log: any;
  apiVersion?: string;
  isLatestVersion?: boolean;
  isDeprecated?: boolean;
  params: Request['params'] & {
    appname?: string;
    version?: string;
  };
}

/**
 * Route handler type for better typing
 */
type RouteHandler = (req: ExtendedRequest, res: Response, next: NextFunction) => void | Promise<void>;

/**
 * Load consolidated app configuration from {appname}/{version}/{appname}.config.json
 */
async function loadAppConfig(appname: string, version: string): Promise<AppConfig | null> {
  try {
    const configPath = join(process.cwd(), 'src', 'api', appname, version, `${appname}.config.json`);
    const configContent = await readFile(configPath, 'utf-8');
    return JSON.parse(configContent) as AppConfig;
  } catch (err) {
    logger.warn(`App config not found for ${appname}/${version}, skipping app`);
    return null;
  }
}

/**
 * Check if feature is enabled based on consolidated config and environment
 */
function isFeatureEnabled(appname: string, version: string, featureName: string, appConfig: AppConfig): boolean {
  const feature = appConfig.features[featureName];
  
  if (!feature?.enabled) return false;
  
  const currentEnv = process.env.NODE_ENV || 'development';
  return feature.environments.includes(currentEnv);
}

/**
 * Check if endpoint is ready for deployment
 */
function isEndpointReady(manifest: EndpointManifest): boolean {
  if (!manifest.active) return false;
  if (manifest.blocking_issues && manifest.blocking_issues.length > 0) return false;
  return true;
}

/**
 * Configure Express middleware stack
 */
function setupMiddleware(app: express.Application): void {
  // Basic Express middleware
  app.use(express.json({ 
    limit: config.get('server.json.limit', '10mb'),
    strict: true 
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: config.get('server.urlencoded.limit', '10mb')
  }));

  // CORS configuration
  const corsOrigin = config.get('cors.origin', '*');
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', corsOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Security middleware
  const rateLimitEnabled = config.get('rate.limit.enabled', true);
  if (rateLimitEnabled) {
    const windowMs = config.get('rate.limit.window.ms', 900000);
    const maxRequests = config.get('rate.limit.max', 100);
    
    const rateLimitMiddleware = security.requests(maxRequests, windowMs);
    app.use('/api', rateLimitMiddleware as RequestHandler);
  }

  // Request logging with route context and performance tracking
  app.use(requestLogging());

  logger.info('Express middleware configured', {
    cors: corsOrigin,
    rateLimiting: rateLimitEnabled
  });
}

/**
 * Request logging middleware with URL path, route context, and response time
 */
function requestLogging(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const extReq = req as ExtendedRequest;
    extReq.requestId = util.uuid();
    
    const routeContext = determineRouteContext(req.originalUrl, req.method);
    
    extReq.log = logger.child({
      requestId: extReq.requestId,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      route: routeContext,
      timestamp: new Date().toISOString()
    });

    const startTime = Date.now();
    
    // Log request start
    const contextLabel = routeContext || 'app';
    logger.info(`🔄 Request started ${req.originalUrl} [${contextLabel}]`, {
      requestId: extReq.requestId,
      method: req.method
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'warn' : 'info';
      const statusIcon = res.statusCode >= 400 ? '⚠️' : '✅';
      
      // Check for slow requests
      const slowThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000');
      const isSlowRequest = duration > slowThreshold;
      const performanceIcon = isSlowRequest ? '🐌' : statusIcon;
      
      // Log completion
      logger[level](`${performanceIcon} Request completed ${req.originalUrl} [${contextLabel}] ${duration}ms`, {
        requestId: extReq.requestId,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: duration,
        isSlowRequest
      });

      // Additional warning for slow requests
      if (isSlowRequest) {
        logger.warn(`🐌 SLOW REQUEST DETECTED ${req.originalUrl} [${contextLabel}] took ${duration}ms`, {
          requestId: extReq.requestId,
          threshold: slowThreshold,
          overThresholdBy: duration - slowThreshold
        });
      }
    });

    next();
  };
}

/**
 * Determine route context for consistent logging format
 */
function determineRouteContext(url: string, method: string): string | null {
  // Parse versioned API URLs: /api/myapp/v1/weather/mumbai -> myapp.features.weather.@city
  const versionedApiMatch = url.match(/^\/api\/([^\/]+)\/v\d+\/([^\/]+)(?:\/([^\/\?]+))?/);
  if (versionedApiMatch) {
    const [, appname, feature, param] = versionedApiMatch;
    if (feature && param && param !== '') {
      return `${appname}.features.${feature}.@${getEndpointType(feature, param)}`;
    } else if (feature) {
      return `${appname}.features.${feature}.main`;
    }
  }
  
  return null;
}

/**
 * Determine endpoint type based on feature and parameter
 */
function getEndpointType(feature: string, param: string): string {
  if (feature === 'weather') return 'city';
  if (feature === 'users') return 'id';
  return param.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Setup version middleware for API routing with appname
 */
function setupVersionMiddleware(app: express.Application, appnames: string[]): void {
  if (appnames.length === 0) return;

  // Add version info to requests for /api/{appname}/{version}/* pattern
  app.use('/api/:appname/:version/*', (req: Request, res: Response, next: NextFunction): void => {
    const extReq = req as ExtendedRequest;
    const requestedAppname = req.params.appname;
    const requestedVersion = req.params.version;
    
    if (!requestedAppname) {
      res.status(400).json({
        success: false,
        error: 'Missing app name',
        message: 'App name parameter is required'
      });
      return;
    }

    if (!requestedVersion) {
      res.status(400).json({
        success: false,
        error: 'Missing API version',
        message: 'API version parameter is required'
      });
      return;
    }
    
    extReq.apiVersion = requestedVersion;

    res.set({
      'X-API-Version': requestedVersion,
      'X-API-App-Name': requestedAppname
    });

    next();
  });

  logger.info('Version middleware configured', {
    appnames: appnames
  });
}

/**
 * Setup default routes with version information
 */
function setupDefaultRoutes(app: express.Application, appStructure: Record<string, string[]>): void {
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'FLUX Framework is active',
      status: 'active',
      timestamp: new Date().toISOString(),
      applications: Object.keys(appStructure).map(appname => {
        const versions = appStructure[appname] || [];
        return {
          appname,
          latest_version: versions.length > 0 ? versions[versions.length - 1] : 'none',
          supported_versions: versions,
          base_url: `/api/${appname}`
        };
      })
    });
  });

  app.get('/api', (req: Request, res: Response) => {
    res.json({
      message: 'FLUX Framework Versioned API',
      applications: Object.keys(appStructure).map(appname => {
        const versions = appStructure[appname] || [];
        return {
          appname,
          latest_version: versions.length > 0 ? versions[versions.length - 1] : 'none',
          supported_versions: versions,
          base_url: `/api/${appname}`,
          versions: versions.map(version => ({
            version,
            url: `/api/${appname}/${version}`,
            documentation: `/api/${appname}/${version}/docs`
          }))
        };
      })
    });
  });

  // Individual app routes
  Object.keys(appStructure).forEach(appname => {
    const versions = appStructure[appname];
    if (!versions || versions.length === 0) return;
    
    const latestVersion = versions[versions.length - 1] || 'none';

    app.get(`/api/${appname}`, (req: Request, res: Response) => {
      res.json({
        message: `${appname.toUpperCase()} API`,
        appname,
        latest_version: latestVersion,
        supported_versions: versions,
        base_url: `/api/${appname}`,
        timestamp: new Date().toISOString()
      });
    });
  });

  logger.info('Default routes configured', { 
    applications: Object.keys(appStructure).length,
    apps: Object.keys(appStructure)
  });
}

/**
 * Discover all applications and their versioned endpoints
 */
async function discoverVersionedEndpoints(): Promise<{ endpoints: VersionedEndpoint[], appStructure: Record<string, string[]> }> {
  const endpoints: VersionedEndpoint[] = [];
  const appStructure: Record<string, string[]> = {};
  const apiPath = join(process.cwd(), 'src', 'api');
  
  try {
    const appDirs = await readdir(apiPath);
    
    for (const appDir of appDirs) {
      if (appDir.startsWith('_') || appDir.startsWith('.')) continue;
      
      const appPath = join(apiPath, appDir);
      const appStat = await stat(appPath);
      if (!appStat.isDirectory()) continue;

      try {
        const versionDirs = await readdir(appPath);
        const versions = versionDirs
          .filter(item => item.match(/^v\d+$/))
          .sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));

        if (versions.length === 0) continue;
        
        appStructure[appDir] = versions;

        for (const version of versions) {
          const appConfig = await loadAppConfig(appDir, version);
          if (!appConfig) continue; // Skip if no config found
          
          const versionPath = join(appPath, version);
          
          try {
            const featureDirs = await readdir(versionPath);

            for (const featureDir of featureDirs) {
              if (featureDir.startsWith('_') || featureDir.startsWith('.') || 
                  featureDir.endsWith('.json')) continue;

              if (!isFeatureEnabled(appDir, version, featureDir, appConfig)) continue;

              const featurePath = join(versionPath, featureDir);
              const featureStat = await stat(featurePath);
              if (!featureStat.isDirectory()) continue;

              const endpointDirs = await readdir(featurePath);

              for (const endpointDir of endpointDirs) {
                if (endpointDir.endsWith('.json')) continue;

                const endpointPath = join(featurePath, endpointDir);
                const endpointStat = await stat(endpointPath);
                if (!endpointStat.isDirectory()) continue;

                const manifestPath = join(endpointPath, `${endpointDir}.manifest.json`);
                const logicPath = join(endpointPath, `${endpointDir}.logic.ts`);

                try {
                  await stat(manifestPath);
                  endpoints.push({
                    appname: appDir,
                    version,
                    feature: featureDir,
                    endpoint: endpointDir,
                    manifestPath,
                    logicPath
                  });
                } catch {
                  // Skip if no manifest
                }
              }
            }
          } catch (err) {
            logger.warn(`Feature discovery failed for ${appDir}/${version}`);
          }
        }
      } catch (err) {
        logger.warn(`Version discovery failed for app ${appDir}`);
      }
    }
    
    logger.info('Endpoint discovery completed', {
      totalEndpoints: endpoints.length,
      applications: Object.keys(appStructure).length,
      enabledFeatures: [...new Set(endpoints.map(e => `${e.appname}/${e.version}/${e.feature}`))]
    });

    return { endpoints, appStructure };
  } catch (err) {
    logger.warn('Failed to discover endpoints', { error: err });
    return { endpoints: [], appStructure: {} };
  }
}

/**
 * Register endpoint from manifest and logic file
 */
async function registerEndpoint(app: express.Application, endpoint: VersionedEndpoint): Promise<boolean> {
  try {
    const manifestContent = await readFile(endpoint.manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as EndpointManifest;
    
    if (!isEndpointReady(manifest)) {
      const reasons = [];
      if (!manifest.active) reasons.push('manifest.active = false');
      if (manifest.blocking_issues && manifest.blocking_issues.length > 0) {
        reasons.push(`${manifest.blocking_issues.length} blocking issues`);
      }
      
      logger.warn(`⏭️ INACTIVE: ${endpoint.appname}/${endpoint.version}/${endpoint.feature}/${endpoint.endpoint}`, {
        reasons: reasons.join(', '),
        blocking_issues: manifest.blocking_issues || []
      });
      
      return false;
    }
    
    const logicImportPath = endpoint.logicPath.replace(/\.ts$/, '.js');
    const logicModule = await import(logicImportPath);
    
    let registeredCount = 0;
    
    for (const [route, functionName] of Object.entries(manifest.routes)) {
      const handler = logicModule[functionName];
      if (!handler || typeof handler !== 'function') continue;
      
      const [method, routePath] = route.split(' ', 2);
      if (!method || !routePath) continue;
      
      const versionedApiPath = `/api/${endpoint.appname}/${endpoint.version}${routePath}`;
      
      // Wrap handler with error handling
      const wrappedHandler = error.asyncRoute ? error.asyncRoute(handler) : handler;
      
      switch (method.toLowerCase()) {
        case 'get':
          app.get(versionedApiPath, wrappedHandler as RequestHandler);
          break;
        case 'post':
          app.post(versionedApiPath, wrappedHandler as RequestHandler);
          break;
        case 'put':
          app.put(versionedApiPath, wrappedHandler as RequestHandler);
          break;
        case 'delete':
          app.delete(versionedApiPath, wrappedHandler as RequestHandler);
          break;
        case 'patch':
          app.patch(versionedApiPath, wrappedHandler as RequestHandler);
          break;
        default:
          continue;
      }
      
      registeredCount++;
    }
    
    if (registeredCount > 0) {
      logger.info(`✅ ACTIVE: ${endpoint.appname}/${endpoint.version}/${endpoint.feature}/${endpoint.endpoint}`, {
        routesRegistered: registeredCount
      });
      return true;
    }
    
    logger.warn(`⚠️ NO ROUTES: ${endpoint.appname}/${endpoint.version}/${endpoint.feature}/${endpoint.endpoint} (no valid handlers found)`);
    return false;
  } catch (err) {
    logger.warn(`❌ FAILED: ${endpoint.appname}/${endpoint.version}/${endpoint.feature}/${endpoint.endpoint}`, {
      error: err instanceof Error ? err.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Setup versioned feature routing
 */
async function setupVersionedFeatureRouting(app: express.Application): Promise<{ appStructure: Record<string, string[]> }> {
  logger.info('Starting versioned feature routing');
  
  const { endpoints, appStructure } = await discoverVersionedEndpoints();
  const appnames = Object.keys(appStructure);
  
  if (appnames.length === 0) {
    logger.warn('No applications found');
    return { appStructure: {} };
  }

  setupVersionMiddleware(app, appnames);
  
  let activeCount = 0;
  let inactiveCount = 0;
  const inactiveEndpoints: string[] = [];
  
  for (const endpoint of endpoints) {
    const registered = await registerEndpoint(app, endpoint);
    if (registered) {
      activeCount++;
    } else {
      inactiveCount++;
      inactiveEndpoints.push(`${endpoint.appname}/${endpoint.version}/${endpoint.feature}/${endpoint.endpoint}`);
    }
  }
  
  if (inactiveCount > 0) {
    logger.warn('Inactive endpoints detected', {
      count: inactiveCount,
      endpoints: inactiveEndpoints
    });
    
    inactiveEndpoints.forEach(endpointPath => {
      logger.warn(`⏭️ SKIPPED: ${endpointPath} (inactive or blocked)`);
    });
  }
  
  logger.info('Versioned feature routing completed', {
    applications: appnames.length,
    totalDiscovered: endpoints.length,
    activeEndpoints: activeCount,
    inactiveEndpoints: inactiveCount,
    appStructure
  });

  return { appStructure };
}

/**
 * Setup system routes
 */
function setupSystemRoutes(app: express.Application, appStructure: Record<string, string[]>): void {
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      applications: Object.keys(appStructure).map(appname => {
        const versions = appStructure[appname] || [];
        return {
          appname,
          latest_version: versions.length > 0 ? versions[versions.length - 1] : 'none',
          supported_versions: versions
        };
      })
    });
  });
  
  // Per-app version routes
  Object.keys(appStructure).forEach(appname => {
    const versions = appStructure[appname];
    if (!versions || versions.length === 0) return;
    
    const latestVersion = versions[versions.length - 1] || 'none';

    versions.forEach(version => {
      app.get(`/api/${appname}/${version}`, (req: Request, res: Response) => {
        res.json({
          message: `FLUX Framework API ${version.toUpperCase()}`,
          appname,
          version: version,
          status: 'active',
          timestamp: new Date().toISOString(),
          is_latest: version === latestVersion,
          documentation: `/api/${appname}/${version}/docs`
        });
      });

      app.get(`/api/${appname}/${version}/docs`, (req: Request, res: Response) => {
        res.json({
          message: `API Documentation for ${appname}/${version}`,
          appname,
          version: version,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
  
  app.get('/favicon.ico', (req: Request, res: Response) => {
    res.status(204).end();
  });

  logger.info('System routes configured', {
    applications: Object.keys(appStructure).length,
    health: '/health'
  });
}

/**
 * Setup error handling
 */
function setupErrorHandling(app: express.Application, appStructure: Record<string, string[]>): void {
  const appnames = Object.keys(appStructure);

  // 404 handler for versioned API routes
  appnames.forEach(appname => {
    app.use(`/api/${appname}/:version/*`, (req: Request, res: Response, next: NextFunction): void => {
      const extReq = req as ExtendedRequest;
      const routeContext = determineRouteContext(req.originalUrl, req.method);
      const err = error.notFound ? 
        error.notFound(`API endpoint not found: ${req.method} ${req.originalUrl}`) :
        new Error(`API endpoint not found: ${req.method} ${req.originalUrl}`);
      
      if (routeContext) {
        logger.warn(`🔍 Endpoint not found ${req.originalUrl} [${routeContext}]`, {
          requestId: extReq.requestId,
          appname: req.params.appname,
          version: req.params.version
        });
      }
      
      next(err);
    });
  });

  // General 404 handler
  app.use('*', (req: Request, res: Response, next: NextFunction): void => {
    const extReq = req as ExtendedRequest;
    const err = error.notFound ? 
      error.notFound(`Route not found: ${req.method} ${req.originalUrl}`) :
      new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    
    logger.warn(`🔍 Route not found ${req.originalUrl} [app]`, {
      requestId: extReq.requestId
    });
    
    next(err);
  });

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
    const extReq = req as ExtendedRequest;
    const routeContext = determineRouteContext(req.originalUrl, req.method);
    
    const errorContext: any = {
      requestId: extReq.requestId,
      url: req.originalUrl,
      method: req.method,
      statusCode: err.statusCode || 500,
      errorMessage: err.message || 'Unknown error',
      route: routeContext
    };

    const logLevel = err.statusCode >= 500 ? 'error' : 'warn';
    const errorType = err.statusCode >= 500 ? 'SERVER ERROR' : 'CLIENT ERROR';
    const contextLabel = routeContext || 'app';
    
    logger[logLevel](`❌ ${errorType} ${req.originalUrl} [${contextLabel}]`, errorContext);

    // Add context to error response
    const originalHandler = error.handleErrors ? error.handleErrors() : null;
    
    if (originalHandler && typeof originalHandler === 'function') {
      const originalJson = res.json;
      
      res.json = function(body: any) {
        if (body && typeof body === 'object') {
          body.request_url = req.originalUrl;
          body.request_method = req.method;
          body.timestamp = new Date().toISOString();
        }
        return originalJson.call(this, body);
      };

      originalHandler(err, req, res, next);
    } else {
      // Fallback error handling if errorClass doesn't provide handleErrors
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        request_url: req.originalUrl,
        request_method: req.method,
        timestamp: new Date().toISOString()
      });
    }
  });

  logger.info('Error handling configured');
}

/**
 * Initialize FLUX Framework Express application
 */
export async function initializeApp(): Promise<express.Application> {
  try {
    logger.info('Initializing FLUX Framework application', {
      framework: 'FLUX',
      appkit: 'VoilaJSX',
      server: 'Express',
      routing: 'versioned-api'
    });

    // Create Express application
    const app = express();

    setupMiddleware(app);
    const { appStructure } = await setupVersionedFeatureRouting(app);
    
    setupDefaultRoutes(app, appStructure);
    setupSystemRoutes(app, appStructure);
    setupErrorHandling(app, appStructure);

    logger.info('FLUX Framework application ready', {
      middleware: 'configured',
      routing: 'versioned-api',
      errors: 'handled',
      applications: Object.keys(appStructure).length,
      apps: Object.keys(appStructure)
    });

    return app;

  } catch (err) {
    logger.error('Application initialization failed', {
      error: err instanceof Error ? err.message : 'Unknown error'
    });
    throw err;
  }
}