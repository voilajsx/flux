/**
 * FLUX Framework Express application with contract validation and action-based routing
 * @module @voilajsx/flux/app
 * @file src/app.ts
 * 
 * @llm-rule WHEN: Setting up Express app with contract validation and action-based endpoint discovery
 * @llm-rule AVOID: Starting server without contract validation - guarantees runtime failures
 * @llm-rule NOTE: Uses {endpoint}.{type}.ts naming convention and contract route mappings for action functions
 */

import express from 'express';
import { join } from 'path';
import { configClass } from '@voilajsx/appkit/config';
import { loggerClass } from '@voilajsx/appkit/logger';
import { errorClass } from '@voilajsx/appkit/error';
import { securityClass } from '@voilajsx/appkit/security';
import { utilClass } from '@voilajsx/appkit/util';
import { validateAllContracts } from './contract.js'; // 🔒 CONTRACT VALIDATION

// Initialize VoilaJSX AppKit modules following standard patterns
const config = configClass.get();
const logger = loggerClass.get('app');
const error = errorClass.get();
const security = securityClass.get();
const util = utilClass.get();

// Create Express application
export const app = express();

/**
 * Standard FLUX actions for validation and guidance
 * @llm-rule WHEN: Validating action names against FLUX Framework standards
 * @llm-rule AVOID: Custom action names without guidance - use standard actions when possible
 */
export const STANDARD_ACTIONS = {
  // Collection actions
  'list': 'GET - Retrieve all items in collection',
  'create': 'POST - Create new item in collection',
  
  // Item actions  
  'get': 'GET - Retrieve specific item by ID',
  'update': 'PUT - Update specific item by ID',
  'delete': 'DELETE - Remove specific item by ID',
  
  // Common custom actions
  'search': 'GET - Search items with filters',
  'export': 'GET - Export data in various formats',
  'import': 'POST - Import data from files',
  'activate': 'POST - Activate/enable specific item',
  'deactivate': 'POST - Deactivate/disable specific item'
} as const;

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
      contractValidation: 'passed',
      actionBased: true,
      namingConvention: '{endpoint}.{type}.ts'
    });
  });

  logger.info('✅ Default routes configured');
}

/**
 * Discovers and registers FLUX Framework features using contract-validated action mapping
 * @llm-rule WHEN: Auto-discovering endpoint route files following contract specifications
 * @llm-rule AVOID: Manual route registration - use contract-validated auto-discovery
 * @llm-rule NOTE: Uses {endpoint}.{type}.ts naming and contract route mappings for action functions
 */
async function setupFeatureRouting(): Promise<void> {
  try {
    const featuresPath = join(process.cwd(), 'src', 'features');
    const { readdir, stat } = await import('fs/promises');
    
    logger.info('🔍 Starting contract-based feature routing with {endpoint}.{type}.ts naming', { featuresPath });
    
    // Check if features directory exists
    try {
      await stat(featuresPath);
      logger.info('✅ Features directory found', { path: featuresPath });
    } catch {
      logger.warn('📁 Features directory not found, skipping feature routing', { path: featuresPath });
      return;
    }

    const featureDirs = await readdir(featuresPath);
    
    // Filter valid feature directories
    const validItems: string[] = [];
    
    for (const item of featureDirs) {
      if (item.startsWith('.')) {
        logger.debug(`⏭️ Skipping hidden file: ${item}`);
        continue;
      }
      
      const fullPath = join(featuresPath, item);
      try {
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
          validItems.push(item);
        } else {
          logger.debug(`📄 Skipping non-directory item: ${item}`);
        }
      } catch {
        logger.debug(`⚠️ Could not stat item: ${item}`);
      }
    }
    
    logger.info(`📁 Found ${validItems.length} valid feature directories: [${validItems.join(', ')}]`);
    
    const enabledFeatures: string[] = [];
    const disabledFeatures: string[] = [];

    for (const dir of validItems) {
      if (dir.startsWith('_')) {
        disabledFeatures.push(dir);
        logger.info(`⏭️ Disabled feature: ${dir}`);
      } else {
        enabledFeatures.push(dir);
        logger.info(`✅ Enabled feature: ${dir}`);
      }
    }

    logger.info(`📁 Feature discovery completed - ${enabledFeatures.length} enabled [${enabledFeatures.join(', ')}], ${disabledFeatures.length} disabled [${disabledFeatures.join(', ')}]`);

    // Register enabled features using contract-based routing
    for (const featureName of enabledFeatures) {
      logger.info('🔄 Processing contract-validated feature', { feature: featureName });
      await registerContractBasedFeatureRoutes(featureName);
    }

    logger.info(`🚀 Contract-based feature routing completed - processed ${enabledFeatures.length} features: [${enabledFeatures.join(', ')}]`);

  } catch (error) {
    logger.error('❌ Feature routing setup failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check src/features/ directory structure and contract validation'
    });
    throw error;
  }
}

/**
 * Registers routes for contract-validated FLUX Framework features using action mapping
 * @llm-rule WHEN: Loading endpoints that have passed contract validation with action-based routing
 * @llm-rule AVOID: Loading unvalidated endpoints - contract validation ensures they work
 * @llm-rule NOTE: Uses {endpoint}.{type}.ts naming and contract route mappings to call action functions
 */
async function registerContractBasedFeatureRoutes(featureName: string): Promise<void> {
  try {
    const featurePath = join(process.cwd(), 'src', 'features', featureName);
    const { readdir, stat } = await import('fs/promises');
    
    // Check if feature directory exists
    try {
      await stat(featurePath);
    } catch {
      logger.warn('⚠️ Feature directory not found', { feature: featureName, path: featurePath });
      return;
    }

    // Discover endpoint directories within feature
    const items = await readdir(featurePath);
    let routesFound = 0;
    
    logger.debug('🔍 Scanning contract-validated feature for endpoint folders', { 
      feature: featureName, 
      items: items 
    });
    
    for (const item of items) {
      const itemPath = join(featurePath, item);
      let stats;
      
      try {
        stats = await stat(itemPath);
      } catch {
        continue;
      }
      
      if (stats.isDirectory()) {
        logger.info(`📁 Found endpoint directory: ${featureName}/${item}`);
        
        // Look for {endpoint}.logic.ts files using new naming convention
        const endpointName = item;
        const logicFile = `${endpointName}.logic.ts`;
        const contractFile = `${endpointName}.contract.ts`;
        
        const logicPath = join(itemPath, logicFile);
        const contractPath = join(itemPath, contractFile);
        
        // Check if both files exist
        try {
          await stat(logicPath);
          await stat(contractPath);
          
          logger.info(`🔍 Found complete endpoint: ${featureName}/${item} with ${contractFile} + ${logicFile}`);
          
          await registerContractBasedEndpointRoute(featureName, endpointName, logicPath, contractPath, itemPath);
          routesFound++;
          
        } catch {
          logger.warn(`⚠️ Incomplete endpoint ${featureName}/${item} - missing ${contractFile} or ${logicFile}`);
        }
      }
    }

    if (routesFound === 0) {
      logger.info(`📝 No complete endpoints found in feature ${featureName} - create {endpoint}.contract.ts and {endpoint}.logic.ts files`);
    } else {
      logger.info(`✅ Feature ${featureName} registered ${routesFound} contract-based routes`);
    }

  } catch (error) {
    logger.warn('⚠️ Contract-based feature registration failed', {
      feature: featureName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Registers Express routes using contract route mappings to action functions
 * @llm-rule WHEN: Loading route handlers from contract-validated logic files with action mapping
 * @llm-rule AVOID: Using HTTP method names - use contract action mapping instead
 * @llm-rule NOTE: Contract validation guarantees both contract and action functions exist
 */
async function registerContractBasedEndpointRoute(
  featureName: string, 
  endpointName: string, 
  logicFilePath: string,
  contractFilePath: string,
  endpointPath: string
): Promise<void> {
  try {
    // Import the contract to get route mappings
    const contractImportPath = contractFilePath.replace(/\.ts$/, '.js');
    let contractModule;
    let contract;
    
    try {
      contractModule = await import(contractImportPath);
      contract = contractModule.CONTRACT;
    } catch (contractError) {
      logger.error(`❌ Contract import failed for ${featureName}/${endpointName}`, {
        contractPath: contractImportPath,
        error: contractError instanceof Error ? contractError.message : 'Unknown error'
      });
      return;
    }
    
    // Import endpoint logic handlers
    const logicImportPath = logicFilePath.replace(/\.ts$/, '.js');
    let logicModule;
    try {
      logicModule = await import(logicImportPath);
    } catch (logicError) {
      logger.error(`❌ Logic import failed for ${featureName}/${endpointName}`, {
        logicPath: logicImportPath,
        error: logicError instanceof Error ? logicError.message : 'Unknown error'
      });
      return;
    }
    
    let handlersRegistered = 0;
    
    // Use contract route mappings to register action functions
    for (const [route, actionName] of Object.entries(contract.routes || {}) as [string, string][]) {
      const handler = logicModule[actionName]; // e.g., logicModule.list, logicModule.get
      
      if (handler && typeof handler === 'function') {
        // Parse HTTP method and path from route
        const [method, contractPath] = route.split(' ', 2); // "GET /hello" → ["GET", "/hello"]
        
        if (!method || !contractPath) {
          logger.warn(`⚠️ Invalid route format '${route}' - expected 'METHOD /path'`);
          continue;
        }
        
        const expressPath = convertContractPathToExpress(featureName, contractPath, endpointName);
        
        // Register route based on HTTP method
        try {
          switch (method.toLowerCase()) {
            case 'get':
              app.get(expressPath, error.asyncRoute(handler));
              break;
            case 'post':
              app.post(expressPath, error.asyncRoute(handler));
              break;
            case 'put':
              app.put(expressPath, error.asyncRoute(handler));
              break;
            case 'delete':
              app.delete(expressPath, error.asyncRoute(handler));
              break;
            case 'patch':
              app.patch(expressPath, error.asyncRoute(handler));
              break;
            default:
              logger.warn(`⚠️ Unsupported HTTP method '${method}' in route '${route}'`);
              continue;
          }
          
          handlersRegistered++;
          
          // Check if using standard action
          const isStandardAction = actionName in STANDARD_ACTIONS;
          const actionType = isStandardAction ? '✅' : '⚠️';
          
          logger.info(`📍 Contract route registered: ${actionType} ${route} → ${actionName}() at ${expressPath}`, {
            feature: featureName,
            endpoint: endpointName,
            action: actionName,
            standard: isStandardAction
          });
          
          if (!isStandardAction) {
            logger.warn(`⚠️ Custom action '${actionName}' - consider standard actions: ${Object.keys(STANDARD_ACTIONS).join(', ')}`);
          }
          
        } catch (routeError) {
          logger.error(`❌ Route registration failed for ${route}`, {
            error: routeError instanceof Error ? routeError.message : 'Unknown error'
          });
        }
      } else {
        logger.error(`❌ Action function '${actionName}' not found or not a function in ${featureName}/${endpointName}/logic`);
      }
    }
    
    if (handlersRegistered === 0) {
      const availableExports = Object.keys(logicModule).join(', ');
      const contractActions = Object.values(contract.routes || {}).join(', ');
      logger.warn(`⚠️ No handlers registered for ${featureName}/${endpointName}`, {
        available: `[${availableExports}]`,
        expected: `[${contractActions}]`
      });
    } else {
      logger.info(`✅ Registered ${handlersRegistered} contract-based handlers for ${featureName}/${endpointName}`);
    }

  } catch (error) {
    logger.error('❌ Contract-based endpoint registration failed', {
      feature: featureName,
      endpoint: endpointName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Converts contract path to Express route pattern using FLUX naming conventions
 * @llm-rule WHEN: Converting contract paths to Express routes with feature context
 * @llm-rule AVOID: Hardcoded route mapping - use consistent conversion for predictable API structure
 * @llm-rule NOTE: Maps contract paths like "/hello" to "/api/hello" with feature and endpoint context
 */
function convertContractPathToExpress(featureName: string, contractPath: string, endpointName: string): string {
  // Handle different endpoint types
  if (endpointName === 'main') {
    // main endpoint: "/hello" → "/api/hello"
    return `/api${contractPath}`;
  } else if (endpointName.startsWith('@')) {
    // dynamic endpoint: "@name" with "/hello/:name" → "/api/hello/:name"
    return `/api${contractPath}`;
  } else {
    // other endpoints: use the contract path as-is with /api prefix
    return `/api${contractPath}`;
  }
}

/**
 * Sets up system health and monitoring endpoints
 * @llm-rule WHEN: Adding standard system endpoints for health checks and API documentation
 * @llm-rule AVOID: Exposing sensitive system information - keep health checks minimal and safe
 */
function setupSystemRoutes(): void {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      requestId: req.requestId,
      contractValidation: 'passed',
      actionBased: true,
      namingConvention: '{endpoint}.{type}.ts',
      standardActions: Object.keys(STANDARD_ACTIONS)
    });
  });
  
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content
  });

  logger.info('✅ System routes configured', {
    health: '/health',
    actionBased: true,
    namingConvention: '{endpoint}.{type}.ts'
  });
}

/**
 * Configures final error handling middleware
 * @llm-rule WHEN: Setting up global error handling as the last middleware in Express stack
 * @llm-rule AVOID: Adding middleware after error handlers - Express requires error handlers to be last
 */
function setupErrorHandling(): void {
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
 * Initializes complete FLUX Framework Express application with contract validation and action-based routing
 * @llm-rule WHEN: Application startup to configure all middleware, routes, and error handling
 * @llm-rule AVOID: Starting without contract validation - guarantees runtime failures
 * @llm-rule NOTE: Contract validation BLOCKS server startup and action mapping enables flexible endpoint design
 */
async function initializeApp(): Promise<void> {
  try {
    logger.info('🚀 Initializing FLUX Framework application with contract validation and action-based routing', {
      framework: 'FLUX',
      appkit: 'VoilaJSX',
      server: 'Express',
      modules: 'ES2022',
      routing: 'contract-action-based',
      namingConvention: '{endpoint}.{type}.ts'
    });

    // 🔒 STEP 1: CONTRACT VALIDATION (CRITICAL - BLOCKS STARTUP)
    logger.info('🔍 Starting contract validation...');
    const contractsValid = await validateAllContracts();
    
    if (!contractsValid) {
      logger.error('💥 Contract validation failed - application startup BLOCKED');
      throw new Error('Contract validation failed - see errors above');
    }
    
    logger.info('✅ Contract validation passed - proceeding with action-based routing initialization');

    // STEP 2: Initialize application components in strict order
    setupMiddleware();              // 1. Basic Express + VoilaJSX middleware
    setupDefaultRoutes();           // 2. Default root endpoint  
    await setupFeatureRouting();    // 3. Auto-discover and register contract-based action routes
    setupSystemRoutes();            // 4. Health and API info endpoints
    setupErrorHandling();           // 5. Global error handling (MUST BE LAST)

    logger.info('✅ FLUX Framework application ready', {
      contractValidation: 'passed',
      middleware: 'configured',
      features: 'contract-action-based',
      routing: 'dynamic-discovery',
      errors: 'handled',
      namingConvention: '{endpoint}.{type}.ts',
      standardActions: Object.keys(STANDARD_ACTIONS).length
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

// Initialize application with contract validation and action-based routing
await initializeApp();