#!/usr/bin/env node

/**
 * ATOM Framework Scripts - Main command router with validation pipeline orchestration
 * @module @voilajsx/atom/scripts/index
 * @file scripts/index.js
 *
 * @llm-rule WHEN: Routing ATOM Framework validation commands to specific handlers
 * @llm-rule AVOID: Running unknown commands - always validate command exists before execution
 * @llm-rule NOTE: Removes perf command, focuses on 4 core validations (types, lint, contract, test)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Available ATOM Framework validation commands with descriptions
 * @llm-rule WHEN: Defining available commands for help display and validation
 * @llm-rule AVOID: Adding commands without corresponding implementation files
 * @llm-rule NOTE: Removed perf command - only 4 core validations remain
 */
const COMMANDS = {
  check: 'Runs all validation checks (types, lint, contract, test)',
  types: 'TypeScript type checking and consistency validation',
  lint: 'Code standards and VoilaJSX pattern validation',
  contract: 'Contract validation and dependency checking',
  test: 'Endpoint functionality testing and manifest generation',
  compliance: 'Implementation validation and manifest generation',
  validate: 'Schema validation for blueprint/agent/implementation files',
};

/**
 * Main script router that dispatches commands to appropriate handlers
 * @llm-rule WHEN: Processing npm run atom:* commands from package.json scripts
 * @llm-rule AVOID: Executing commands without proper validation and error handling
 * @llm-rule NOTE: Uses process.exit() codes for CI/CD integration compatibility
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  // Show help if no command or help requested
  if (
    !command ||
    command === 'help' ||
    command === '--help' ||
    command === '-h'
  ) {
    showHelp();
    process.exit(0);
  }

  // Validate command exists - show help on invalid command
  if (!COMMANDS[command]) {
    console.error(`❌ Unknown command: ${command}\n`);
    showHelp();
    process.exit(1);
  }

  // Check if command file exists
  const commandFile = join(__dirname, 'commands', `${command}.js`);
  if (!existsSync(commandFile)) {
    console.error(`❌ Command file not found: ${commandFile}`);
    console.error(`   Expected: scripts/commands/${command}.js`);
    process.exit(1);
  }

  try {
    // Import and execute command
    const commandModule = await import(commandFile);

    if (typeof commandModule.default !== 'function') {
      console.error(
        `❌ Command '${command}' does not export a default function`
      );
      process.exit(1);
    }

    // Execute command with arguments and timing
    const startTime = Date.now();
    console.log(`🚀 ATOM: Running ${command}...`);

    const success = await commandModule.default(commandArgs);
    const duration = Date.now() - startTime;

    if (success) {
      console.log(`✅ ATOM: ${command} completed successfully (${duration}ms)`);
      process.exit(0);
    } else {
      console.log(`❌ ATOM: ${command} failed (${duration}ms)`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`💥 ATOM: ${command} crashed:`, error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Display help information with available commands and usage examples
 * @llm-rule WHEN: User requests help or provides invalid command
 * @llm-rule AVOID: Showing outdated command lists - keep in sync with COMMANDS object
 * @llm-rule NOTE: Examples use npm run atom:* format matching package.json scripts
 */
function showHelp() {
  console.log(`
🤖 ATOM Framework Scripts

Usage: npm run atom:<command> [arguments]

Available Commands:
`);

  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  atom:${cmd.padEnd(10)} ${desc}`);
  });

  console.log(`
Examples:
  npm run atom:check                    # Full validation pipeline
  npm run atom:help                     # Show this help
  npm run atom:types                    # TypeScript checking only
  npm run atom:contract hello           # Validate hello feature contracts
  npm run atom:test hello/@name         # Test specific endpoint
  npm run atom:lint                     # Code standards validation

For help: npm run atom:help
Documentation: https://github.com/voilajsx/atom
`);
}

/**
 * Configure global error handlers for graceful script termination
 * @llm-rule WHEN: Setting up process-level error handling for CI/CD reliability
 * @llm-rule AVOID: Letting uncaught errors crash without proper exit codes
 * @llm-rule NOTE: Uses consistent error formatting for both development and CI environments
 */
function setupErrorHandlers() {
  process.on('uncaughtException', (error) => {
    console.error('💥 ATOM: Uncaught exception:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('💥 ATOM: Unhandled rejection:', reason);
    process.exit(1);
  });
}

// Initialize error handlers and run main function
setupErrorHandlers();
main();
