/**
 * FLUX Framework application entry point with production-ready startup
 * @module @voilajsx/flux/server
 * @file src/server.ts
 */

import 'dotenv/config';
import { configClass } from '@voilajsx/appkit/config';
import { loggerClass } from '@voilajsx/appkit/logger';
import { initializeApp } from './app.js'; // Import the initialization function
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { Server } from 'http';
import express from 'express';

// Extend NodeJS.Process to include server property
declare global {
  namespace NodeJS {
    interface Process {
      server?: Server;
    }
  }
}

// Initialize core modules
const config = configClass.get();
const logger = loggerClass.get('server');

// =========================================================================
// Helper Functions (Updated for new folder structure)
// =========================================================================

/**
 * Application discovery result
 */
interface AppDiscoveryResult {
  applications: string[];
  totalVersions: number;
  apiStructure: Record<string, string[]>;
}

/**
 * Discover applications and their versions from folder structure
 */
async function discoverApplications(): Promise<AppDiscoveryResult> {
  try {
    const apiPath = join(process.cwd(), 'src', 'api');
    const appDirs = await readdir(apiPath);
    const apiStructure: Record<string, string[]> = {};
    let totalVersions = 0;

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

        if (versions.length > 0) {
          apiStructure[appDir] = versions;
          totalVersions += versions.length;
        }
      } catch (err) {
        logger.warn(`Could not read versions for app ${appDir}`);
      }
    }

    return {
      applications: Object.keys(apiStructure),
      totalVersions,
      apiStructure
    };
  } catch (err) {
    logger.error('Failed to discover applications', {
      error: err instanceof Error ? err.message : 'Unknown error'
    });
    return {
      applications: [],
      totalVersions: 0,
      apiStructure: {}
    };
  }
}

/**
 * Validate required environment configuration
 */
async function validateEnvironment(): Promise<void> {
  try {
    // Check if src/api directory exists
    const apiPath = join(process.cwd(), 'src', 'api');
    try {
      await stat(apiPath);
    } catch {
      throw new Error('src/api directory not found');
    }

    // Discover applications
    const discovery = await discoverApplications();
    
    if (discovery.applications.length === 0) {
      throw new Error('No applications found in src/api/');
    }

    if (discovery.totalVersions === 0) {
      throw new Error('No API versions found in any application');
    }

    // Validate application names
    for (const appname of discovery.applications) {
      if (!appname.match(/^[a-zA-Z0-9-_]+$/)) {
        throw new Error(`Invalid application name: ${appname} (must be alphanumeric with hyphens/underscores)`);
      }
    }

    logger.info('Environment validation passed', {
      environment: configClass.getEnvironment(),
      applications: discovery.applications.length,
      totalVersions: discovery.totalVersions,
      apps: discovery.applications
    });

  } catch (err) {
    logger.error('Environment validation failed', {
      error: err instanceof Error ? err.message : 'Unknown error'
    });
    process.exit(1);
  }
}

/**
 * Start HTTP server with error handling
 */
async function startServer(app: express.Application): Promise<void> {
  const port = config.get('server.port') || process.env.PORT || 3000;
  const host = config.get('server.host') || process.env.HOST || '0.0.0.0';
  
  const server = app.listen(Number(port), host, async () => {
    const startupTime = Date.now() - startTime;
    const discovery = await discoverApplications();
    
    logger.info('FLUX Framework server ready', {
      port,
      host,
      applications: discovery.applications,
      totalVersions: discovery.totalVersions,
      environment: configClass.getEnvironment(),
      startupTime: `${startupTime}ms`,
      processId: process.pid
    });

    console.log(`\n🚀 FLUX Framework Server Started on http://${host}:${port}`);
    console.log(`📋 Health Check: http://localhost:${port}/health`);
    console.log(`🏠 Root:        http://localhost:${port}/`);
    console.log(`🌐 API Info:    http://localhost:${port}/api`);
    
    // Show discovered applications
    if (discovery.applications.length > 0) {
      console.log('\n📱 Discovered Applications:');
      discovery.applications.forEach(appname => {
        const versions = discovery.apiStructure[appname];
        if (versions && versions.length > 0) {
          const latestVersion = versions[versions.length - 1];
          console.log(`   • ${appname}: http://localhost:${port}/api/${appname} (latest: ${latestVersion})`);
        } else {
          console.log(`   • ${appname}: http://localhost:${port}/api/${appname} (no versions)`);
        }
      });
    }
    console.log('');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error('Port already in use', { port });
    } else {
      logger.error('Server startup failed', { error: err.message });
    }
    process.exit(1);
  });

  process.server = server;
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupSignalHandlers(): void {
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
  signals.forEach((signal) => {
    process.on(signal, () => {
      logger.info(`Received ${signal}, initiating graceful shutdown`);
      if (process.server) {
        process.server.close(() => {
          logger.info('Server closed successfully');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', {
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      promise: String(promise)
    });
    process.exit(1);
  });
}

// =========================================================================
// Main Entry Point
// The app is now fully initialized before starting the server.
// =========================================================================

const startTime = Date.now();

async function main(): Promise<void> {
  try {
    logger.info('Starting FLUX Framework server', {
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      environment: configClass.getEnvironment(),
      cwd: process.cwd()
    });

    // Validate environment first (includes application discovery)
    await validateEnvironment();
    
    // Initialize the Express app
    const app = await initializeApp();
    
    // Setup handlers and start server
    setupSignalHandlers();
    await startServer(app);
    
  } catch (err) {
    logger.error('Server startup failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });
    process.exit(1);
  }
}

// Run the main function
main().catch((err) => {
  logger.error('Unhandled error in main', {
    error: err instanceof Error ? err.message : 'Unknown error',
    stack: err instanceof Error ? err.stack : undefined
  });
  process.exit(1);
});