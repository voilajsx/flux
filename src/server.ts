/**
 * ATOM Framework application entry point with production-ready startup and graceful shutdown
 * @module @voilajsx/atom/server
 * @file src/server.ts
 */

import 'dotenv/config'; // Load environment variables first
import { configure } from '@voilajsx/appkit/config';
import { logger } from '@voilajsx/appkit/logging';
import { utility } from '@voilajsx/appkit/utils';
import { app } from './app.js';

// Initialize core modules following VoilaJSX AppKit patterns
const config = configure.get();
const log = logger.get('server');
const utils = utility.get();

/**
 * Validates required environment configuration before server startup
 * FIXED: More flexible validation with defaults for development
 */
function validateEnvironment(): void {
  try {
    // Get values with fallback defaults for development
    const authSecret = config.get('auth.secret') || 
                      config.get('voila.auth.secret') || 
                      process.env.AUTH_SECRET ||
                      process.env.VOILA_AUTH_SECRET ||
                      'development-secret-change-in-production';

    const csrfSecret = config.get('security.csrf.secret') || 
                      config.get('voila.security.csrf.secret') || 
                      process.env.CSRF_SECRET ||
                      process.env.VOILA_SECURITY_CSRF_SECRET ||
                      'development-csrf-secret';

    const encryptionKey = config.get('security.encryption.key') || 
                         config.get('voila.security.encryption.key') || 
                         process.env.ENCRYPTION_KEY ||
                         process.env.VOILA_SECURITY_ENCRYPTION_KEY ||
                         'development-encryption-key-64-chars';

    // Warn if using defaults in any environment
    if (authSecret.includes('development')) {
      log.warn('⚠️ Using default auth secret - change in production!');
    }
    if (csrfSecret.includes('development')) {
      log.warn('⚠️ Using default CSRF secret - change in production!');
    }
    if (encryptionKey.includes('development')) {
      log.warn('⚠️ Using default encryption key - change in production!');
    }

    // Production-specific validation
    if (configure.isProduction()) {
      // In production, require actual secrets
      if (authSecret.includes('development') || authSecret.length < 32) {
        throw new Error('Production requires secure VOILA_AUTH_SECRET (32+ characters)');
      }
      if (csrfSecret.includes('development') || csrfSecret.length < 32) {
        throw new Error('Production requires secure VOILA_SECURITY_CSRF_SECRET (32+ characters)');
      }
      if (encryptionKey.includes('development') || encryptionKey.length < 64) {
        throw new Error('Production requires secure VOILA_SECURITY_ENCRYPTION_KEY (64+ characters)');
      }

      // Check optional production services
      const redisUrl = config.get('redis.url');
      const emailKey = config.get('email.api.key');
      
      if (!redisUrl) {
        log.warn('Production deployment without Redis - performance may be limited');
      }
      
      if (!emailKey) {
        log.warn('Production deployment without email service - notifications disabled');
      }
    }

    log.info('✅ Environment validation passed', {
      environment: configure.getEnvironment(),
      production: configure.isProduction(),
      nodeVersion: process.version,
      authConfigured: !!authSecret,
      csrfConfigured: !!csrfSecret,
      encryptionConfigured: !!encryptionKey
    });

  } catch (error) {
    log.error('❌ Environment validation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Create .env file with VOILA_AUTH_SECRET, VOILA_SECURITY_CSRF_SECRET, VOILA_SECURITY_ENCRYPTION_KEY'
    });
    process.exit(1);
  }
}

/**
 * Initializes ATOM Framework platform services and validates system health
 * FIXED: Handle missing platform services gracefully
 */
async function initializePlatform(): Promise<void> {
  try {
    // Try to import platform services, but don't fail if they don't exist
    try {
      const { monitor } = await import('./platform/monitor.js');
      
      // Initialize monitoring system
      await monitor.initialize();
      
      // Validate platform health
      const healthCheck = await monitor.checkSystemHealth();
      
      if (!healthCheck.healthy) {
        log.warn('⚠️ Platform health check warnings', { 
          errors: healthCheck.errors,
          services: healthCheck.services 
        });
      } else {
        log.info('🚀 Platform services initialized', {
          services: healthCheck.services,
          uptime: healthCheck.uptime,
          environment: configure.getEnvironment()
        });
      }
    } catch (platformError) {
      // Platform services are optional - continue without them
      log.info('ℹ️ Platform services not available, continuing without monitoring', {
        reason: platformError instanceof Error ? platformError.message : 'Unknown error'
      });
    }

    log.info('✅ Platform initialization completed');

  } catch (error) {
    log.error('💥 Platform initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Platform services are optional - this should not prevent startup'
    });
    // Don't exit - platform services are optional
  }
}

/**
 * Starts HTTP server with proper error handling and startup logging
 */
function startServer(): void {
  const port = config.get('server.port') || process.env.PORT || 3000;
  const host = config.get('server.host') || process.env.HOST || '0.0.0.0';
  
  const server = app.listen(port, host, () => {
    const startupTime = Date.now() - startTime;
    
    log.info('🌟 ATOM Framework server ready', {
      port,
      host,
      environment: configure.getEnvironment(),
      startupTime: `${startupTime}ms`,
      health: `http://localhost:${port}/health`,
      root: `http://localhost:${port}/`,
      processId: process.pid,
      nodeVersion: process.version
    });

    // Console output for developers
    console.log('');
    console.log('🚀 ATOM Framework Server Started Successfully!');
    console.log('');
    console.log(`📋 Health Check: http://localhost:${port}/health`);
    console.log(`🏠 Root:        http://localhost:${port}/`);
    console.log(`🌐 Features:    http://localhost:${port}/api/*`);
    console.log('');
    console.log('Ready for feature development! 🎉');
    console.log('');
  });

  // Handle server startup errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      log.error('❌ Port already in use', { 
        port, 
        suggestion: `Try: PORT=${Number(port) + 1} npm start` 
      });
    } else {
      log.error('❌ Server startup failed', { 
        error: error.message,
        code: error.code 
      });
    }
    process.exit(1);
  });

  // Store server reference for graceful shutdown
  process.server = server;
}

/**
 * Implements graceful shutdown for production deployments with proper cleanup
 */
async function gracefulShutdown(signal: string): Promise<void> {
  const shutdownId = utils.uuid();
  
  log.info(`🔄 Graceful shutdown initiated`, { 
    signal, 
    shutdownId,
    uptime: process.uptime() 
  });

  try {
    // 1. Stop accepting new connections
    if (process.server) {
      await new Promise<void>((resolve) => {
        process.server.close(() => {
          log.info('✅ HTTP server closed', { shutdownId });
          resolve();
        });
      });
    }

    // 2. Close platform services (if they exist)
    try {
      const { monitor } = await import('./platform/monitor.js');
      await monitor.shutdown();
      log.info('✅ Platform services closed', { shutdownId });
    } catch (error) {
      log.debug('ℹ️ Platform services not available for shutdown', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        shutdownId 
      });
    }

    // 3. Flush remaining logs
    try {
      await logger.clear();
    } catch (error) {
      // Ignore logger cleanup errors during shutdown
    }

    log.info('✅ Graceful shutdown completed', { 
      shutdownId,
      totalTime: Date.now() - startTime 
    });

    process.exit(0);

  } catch (error) {
    log.error('❌ Shutdown error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      shutdownId 
    });
    process.exit(1);
  }
}

/**
 * Configures process signal handlers for graceful shutdown in production
 */
function setupSignalHandlers(): void {
  let shutdownInProgress = false;

  const handleShutdown = (signal: string) => {
    if (shutdownInProgress) {
      log.warn('⚠️ Shutdown already in progress', { signal });
      return;
    }
    shutdownInProgress = true;
    gracefulShutdown(signal);
  };

  // Production container signals
  process.on('SIGTERM', () => handleShutdown('SIGTERM')); // Docker/Kubernetes stop
  process.on('SIGINT', () => handleShutdown('SIGINT'));   // Ctrl+C
  process.on('SIGUSR2', () => handleShutdown('SIGUSR2')); // Nodemon restart

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    log.error('💥 Uncaught exception', { 
      error: error.message,
      stack: error.stack 
    });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason) => {
    log.error('💥 Unhandled promise rejection', { 
      reason: reason instanceof Error ? reason.message : String(reason)
    });
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

// Track startup time for performance monitoring
const startTime = Date.now();

/**
 * Main server startup sequence with comprehensive error handling
 */
async function main(): Promise<void> {
  try {
    log.info('🚀 Starting ATOM Framework server', {
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      environment: configure.getEnvironment(),
      timestamp: new Date().toISOString()
    });

    // Initialize in strict order for reliability
    validateEnvironment();     // 1. Validate configuration (with flexible defaults)
    setupSignalHandlers();     // 2. Setup graceful shutdown
    await initializePlatform(); // 3. Initialize platform services (optional)
    startServer();             // 4. Start HTTP server

  } catch (error) {
    log.error('💥 Server startup failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      startupTime: Date.now() - startTime
    });
    process.exit(1);
  }
}

// Extend NodeJS.Process interface for server reference
declare global {
  namespace NodeJS {
    interface Process {
      server: any;
    }
  }
}

// Start the application
main().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});