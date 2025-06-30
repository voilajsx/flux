/**
 * Flux Framework - Development Server
 * @file scripts/lib/dev.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  logSuccess,
  logError,
  logBox,
  log,
  colors,
  symbols,
  Timer,
} from './utils.js';

/**
 * Start development server with hot reload
 */
export async function runDev(args) {
  const timer = new Timer();

  console.clear();

  logBox(`${symbols.rocket} Starting Flux Development`, [
    `${symbols.lightning} TypeScript hot reload with tsx`,
    `${symbols.contracts} Feature auto-discovery`,
    `${symbols.security} AppKit authentication ready`,
    `${symbols.target} Contract validation on startup`,
  ]);

  try {
    // Pre-flight checks
    log(`${symbols.flux} Running pre-flight checks...`, 'white');

    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      logError('Dependencies not installed. Run: npm install');
      return;
    }

    // Check if main Flux files exist
    const requiredFiles = [
      'flux.ts',
      'contracts.ts',
      'src/features',
      'package.json',
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        logError(`Missing required file: ${file}`);
        log("Make sure you're in a Flux project directory", 'gray');
        return;
      }
    }

    // Check if src/features exists and has at least one feature
    const featuresDir = path.join(process.cwd(), 'src', 'features');
    if (!fs.existsSync(featuresDir)) {
      logError(
        'Features directory not found. Create your first feature with: npm run flux:create your-first-feature'
      );
      return;
    }

    // Check for at least one feature
    const features = fs
      .readdirSync(featuresDir, { withFileTypes: true })
      .filter((dir) => dir.isDirectory() && !dir.name.startsWith('_')).length;

    if (features === 0) {
      log('No features found. Creating a basic feature structure...', 'yellow');
      log('Run: npm run flux:create greeting', 'cyan');
      log('This will create a sample feature to get you started', 'gray');
      return;
    }

    logSuccess(`Pre-flight checks passed (${features} features found)`);

    // Validate environment
    log(`${symbols.security} Checking environment...`, 'white');

    const envChecks = [];

    // Check for JWT secret (optional but recommended)
    if (!process.env.JWT_SECRET) {
      envChecks.push(
        'JWT_SECRET not set - authentication will use default (not secure for production)'
      );
    }

    // Check for database URL (optional)
    if (!process.env.DATABASE_URL) {
      envChecks.push('DATABASE_URL not set - database features may not work');
    }

    if (envChecks.length > 0) {
      log('Environment warnings:', 'yellow');
      envChecks.forEach((check) => log(`  • ${check}`, 'yellow'));
      log('Add these to your .env file for production', 'gray');
    } else {
      logSuccess('Environment configuration looks good');
    }

    // Start tsx development server
    log(
      `${symbols.lightning} Starting TypeScript development server...`,
      'white'
    );

    const devArgs = [
      '--watch',
      'flux.ts',
      ...args.filter((arg) => !arg.startsWith('--flux')),
    ];

    // Add flux-specific development flags
    const env = {
      ...process.env,
      NODE_ENV: 'development',
      FLUX_DEV: 'true',
      FLUX_HOT_RELOAD: 'true',
    };

    if (args.includes('--debug')) {
      env.DEBUG = 'flux:*';
      log('Debug mode enabled', 'cyan');
    }

    if (args.includes('--verbose')) {
      env.FLUX_VERBOSE = 'true';
      log('Verbose logging enabled', 'cyan');
    }

    timer.endWithMessage('Development server starting...');

    console.log();
    logBox(
      'Development Information',
      [
        '✅ Hot reload enabled with tsx',
        '✅ Contract validation on file changes',
        '✅ AppKit authentication available',
        '✅ Feature auto-discovery active',
        '',
        'Press Ctrl+C to stop the server',
      ],
      'blue'
    );

    console.log();
    log(`${symbols.target} Starting Flux with tsx...`, 'white');
    log(`${symbols.info} File changes will trigger automatic restarts`, 'cyan');

    // Execute tsx with flux-specific environment
    execSync(`npx tsx ${devArgs.join(' ')}`, {
      stdio: 'inherit',
      env,
    });
  } catch (error) {
    if (error.status === 130 || error.signal === 'SIGINT') {
      // Ctrl+C - normal exit
      console.log();
      logSuccess('Development server stopped gracefully');
    } else {
      logError(`Development server failed: ${error.message}`);

      // Helpful error messages
      if (error.message.includes('EADDRINUSE')) {
        log('Port is already in use. Try:', 'white');
        log('  npm run flux:dev -- --port 3001', 'cyan');
      } else if (error.message.includes('tsx')) {
        log('tsx not found. Try:', 'white');
        log('  npm install tsx --save-dev', 'cyan');
      } else if (error.message.includes('TypeScript')) {
        log('TypeScript compilation errors found:', 'white');
        log('  Check your .ts files for syntax errors', 'cyan');
        log('  Run: npm run flux:check', 'cyan');
      } else if (error.message.includes('ENOENT')) {
        log('Flux files not found. Make sure you have:', 'white');
        log('  flux.ts (main entry point)', 'cyan');
        log('  contracts.ts (contract definitions)', 'cyan');
        log('  src/features/ (feature directory)', 'cyan');
      }

      if (process.env.DEBUG) {
        console.error('Full error details:', error);
      }
    }
  }
}
