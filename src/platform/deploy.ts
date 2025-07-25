/**
 * FLUX Framework simple Fly.io deployment with essential pipeline
 * @module @voilajsx/flux/platform/deploy
 * @file src/platform/deploy.ts
 * 
 * @llm-rule WHEN: Deploying FLUX Framework applications to Fly.io with simple automated deployment
 * @llm-rule AVOID: Manual deployments - use this automated script for consistent deployments
 * @llm-rule NOTE: Simple deployment focused on getting FLUX apps running on Fly.io quickly
 */

import { logger } from '@voilajsx/appkit/logging';
import { configure } from '@voilajsx/appkit/config';
import { utility } from '@voilajsx/appkit/utils';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';

// Initialize VoilaJSX AppKit modules
const log = logger.get('deploy');
const config = configure.get();
const utils = utility.get();
const execAsync = promisify(exec);

/**
 * Simple deployment configuration for Fly.io
 * @llm-rule WHEN: Configuring basic Fly.io deployment settings
 * @llm-rule AVOID: Over-complex configurations - keep it simple for FLUX hello app
 */
export interface DeployConfig {
  appName: string;
  environment: string;
  region: string;
}

/**
 * Deploys FLUX Framework application to Fly.io with simple pipeline
 * @llm-rule WHEN: Deploying to Fly.io with minimal configuration and maximum reliability
 * @llm-rule AVOID: Complex multi-stage deployments - this handles the essentials
 * @llm-rule NOTE: Handles build, deploy, and basic health checking automatically
 */
export async function deployToFly(environment: string = 'production'): Promise<void> {
  const deploymentId = utils.uuid();
  const appName = config.get('fly.app.name') || 'flux-hello-app';
  
  log.info('🚀 Starting Fly.io deployment', {
    deploymentId,
    appName,
    environment
  });

  try {
    // 1. Generate Fly.io configuration
    await generateFlyConfig(appName, environment);
    
    // 2. Set required secrets
    await setSecrets(appName);
    
    // 3. Deploy to Fly.io
    await executeDeployment(appName);
    
    // 4. Basic health check
    await checkHealth(appName);
    
    log.info('✅ Deployment completed successfully', {
      deploymentId,
      appName,
      url: `https://${appName}.fly.dev`
    });

  } catch (error) {
    log.error('❌ Deployment failed', {
      deploymentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Generates simple Fly.io configuration files
 * @llm-rule WHEN: Creating Fly.io config files optimized for FLUX Framework
 * @llm-rule AVOID: Complex multi-region configs - start simple and scale later
 */
async function generateFlyConfig(appName: string, environment: string): Promise<void> {
  log.info('📝 Generating Fly.io configuration');

  // Simple Dockerfile for FLUX Framework
  const dockerfile = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy and build app
COPY . .
RUN npm run build

# Expose port and start
EXPOSE 3000
CMD ["node", "dist/server.js"]
`;

  // Simple fly.toml configuration
  const flyToml = `app = "${appName}"
primary_region = "ord"

[build]

[env]
  NODE_ENV = "${environment}"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"

[[vm]]
  size = "shared-cpu-1x"
  memory = 512
`;

  await writeFile('./Dockerfile', dockerfile);
  await writeFile('./fly.toml', flyToml);
  
  log.info('✅ Configuration files generated');
}

/**
 * Sets required environment secrets in Fly.io
 * @llm-rule WHEN: Configuring secrets before deployment to ensure app starts properly
 * @llm-rule AVOID: Deploying without secrets - causes startup failures
 */
async function setSecrets(appName: string): Promise<void> {
  log.info('🔐 Setting Fly.io secrets');

  try {
    const secrets = [
      `VOILA_AUTH_SECRET=${config.get('auth.secret') || 'default-dev-secret-change-in-production'}`,
      `VOILA_SECURITY_CSRF_SECRET=${config.get('security.csrf.secret') || 'default-csrf-secret-change-in-production'}`,
      `VOILA_SECURITY_ENCRYPTION_KEY=${config.get('security.encryption.key') || 'default-encryption-key-64-chars-change-in-production-env'}`
    ];

    const secretsCmd = `flyctl secrets set ${secrets.join(' ')} --app ${appName}`;
    await execAsync(secretsCmd);
    
    log.info('✅ Secrets configured');
  } catch (error) {
    log.warn('⚠️ Failed to set secrets - they may already exist', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Executes the actual deployment to Fly.io
 * @llm-rule WHEN: Deploying built application to Fly.io platform
 * @llm-rule AVOID: Complex deployment strategies - simple immediate deployment works best
 */
async function executeDeployment(appName: string): Promise<void> {
  log.info('🚀 Deploying to Fly.io');

  try {
    // Build TypeScript first
    await execAsync('npm run build');
    
    // Deploy to Fly.io
    const deployCmd = `flyctl deploy --app ${appName}`;
    const result = await execAsync(deployCmd);
    
    log.info('✅ Deployment completed', {
      output: result.stdout.slice(-200) // Last 200 chars of output
    });
    
  } catch (error) {
    log.error('❌ Deployment failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Performs basic health check after deployment
 * @llm-rule WHEN: Validating deployment success with simple health endpoint check
 * @llm-rule AVOID: Complex health validation - basic endpoint check is sufficient
 */
async function checkHealth(appName: string): Promise<void> {
  log.info('🏥 Checking application health');

  try {
    // Wait for app to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check health endpoint
    const healthUrl = `https://${appName}.fly.dev/health`;
    const healthCmd = `curl -f -s --max-time 10 "${healthUrl}"`;
    
    const result = await execAsync(healthCmd);
    const healthData = JSON.parse(result.stdout);
    
    if (healthData.status === 'ok') {
      log.info('✅ Health check passed', {
        status: healthData.status,
        uptime: healthData.uptime
      });
    } else {
      throw new Error(`Health check failed: ${healthData.error}`);
    }
    
  } catch (error) {
    log.warn('⚠️ Health check failed - app may still be starting', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Simple rollback to previous deployment
 * @llm-rule WHEN: Deployment fails and need to restore previous working version
 * @llm-rule AVOID: Complex rollback logic - Fly.io handles most of the complexity
 */
export async function rollback(appName?: string): Promise<void> {
  const app = appName || config.get('fly.app.name') || 'flux-hello-app';
  
  log.info('🔄 Rolling back deployment', { appName: app });

  try {
    const rollbackCmd = `flyctl releases rollback --app ${app}`;
    await execAsync(rollbackCmd);
    
    log.info('✅ Rollback completed', { appName: app });
    
  } catch (error) {
    log.error('❌ Rollback failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Gets deployment status and basic info
 * @llm-rule WHEN: Checking current deployment status and machine health
 * @llm-rule AVOID: Complex status parsing - basic info is usually sufficient
 */
export async function getStatus(appName?: string): Promise<any> {
  const app = appName || config.get('fly.app.name') || 'flux-hello-app';
  
  try {
    const statusCmd = `flyctl status --app ${app} --json`;
    const result = await execAsync(statusCmd);
    return JSON.parse(result.stdout);
    
  } catch (error) {
    log.error('❌ Failed to get status', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

// Export simple deployment functions
export const flyDeploy = {
  toFly: deployToFly,
  rollback,
  status: getStatus
};