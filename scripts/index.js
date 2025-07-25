#!/usr/bin/env node

/**
 * FLUX Framework Scripts - Main command router with validation pipeline orchestration
 * @module @voilajsx/flux/scripts/index
 * @file scripts/index.js
 *
 * @llm-rule WHEN: Routing FLUX Framework validation commands to specific handlers
 * @llm-rule AVOID: Running unknown commands - always validate command exists before execution
 * @llm-rule NOTE: Enhanced with schema command and feature-specific targeting support
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Available FLUX Framework validation commands with descriptions
 * @llm-rule WHEN: Defining available commands for help display and validation
 * @llm-rule AVOID: Adding commands without corresponding implementation files
 * @llm-rule NOTE: Schema command supports colon syntax for feature-specific validation
 */
const COMMANDS = {
  check:
    'Runs complete validation pipeline (types, lint, contract, test, compliance)',
  schema: 'Schema validation for requirements/instructions/specification files',
  types: 'TypeScript type checking and consistency validation',
  lint: 'Code standards and VoilaJSX pattern validation',
  contract: 'Contract validation and dependency checking',
  test: 'Endpoint functionality testing and coverage validation',
  compliance: 'Implementation validation and manifest generation',
};

/**
 * Command usage examples for user guidance
 * @llm-rule WHEN: Showing specific usage patterns for each command type
 * @llm-rule AVOID: Generic examples - provide realistic usage scenarios
 * @llm-rule NOTE: Emphasizes feature-specific validation for development workflow
 */
const COMMAND_EXAMPLES = {
  check: [
    'npm run flux:check                    # Full pipeline for all features',
    'npm run flux:check hello              # Full pipeline for hello feature only',
    'npm run flux:check hello/main         # Full pipeline for hello/main endpoint',
  ],
  schema: [
    'npm run flux:schema                   # All schemas for all features',
    'npm run flux:schema hello             # All schemas for hello feature',
    'npm run flux:schema hello:requirements # Only hello.requirements.yml',
    'npm run flux:schema hello:instructions # Only hello.instructions.yml',
    'npm run flux:schema hello:specification # Only hello.specification.json',
  ],
  types: [
    'npm run flux:types                    # TypeScript check all features',
    'npm run flux:types hello              # TypeScript check hello feature',
    'npm run flux:types hello/main         # TypeScript check hello/main endpoint',
  ],
  lint: [
    'npm run flux:lint                     # Code standards all features',
    'npm run flux:lint hello               # Code standards hello feature',
    'npm run flux:lint hello/main          # Code standards hello/main endpoint',
  ],
  contract: [
    'npm run flux:contract                 # Contract validation all features',
    'npm run flux:contract hello           # Contract validation hello feature',
    'npm run flux:contract hello/main      # Contract validation hello/main endpoint',
  ],
  test: [
    'npm run flux:test                     # Run tests all features',
    'npm run flux:test hello               # Run tests hello feature',
    'npm run flux:test hello/main          # Run tests hello/main endpoint',
  ],
  compliance: [
    'npm run flux:compliance               # Implementation compliance all features',
    'npm run flux:compliance hello         # Implementation compliance hello feature',
    'npm run flux:compliance hello/main    # Implementation compliance hello/main endpoint',
  ],
};

/**
 * Main script router that dispatches commands to appropriate handlers
 * @llm-rule WHEN: Processing npm run flux:* commands from package.json scripts
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
    showSuggestions(command);
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

    // Show command start with scope information
    showCommandStart(command, commandArgs);

    const success = await commandModule.default(commandArgs);
    const duration = Date.now() - startTime;

    if (success) {
      console.log(`✅ FLUX: ${command} completed successfully (${duration}ms)`);
      process.exit(0);
    } else {
      console.log(`❌ FLUX: ${command} failed (${duration}ms)`);
      showFailureGuidance(command);
      process.exit(1);
    }
  } catch (error) {
    console.error(`💥 FLUX: ${command} crashed:`, error.message);

    // Show helpful error context
    if (error.message.includes('Cannot find module')) {
      console.error(
        '   💡 Check if all dependencies are installed: npm install'
      );
    } else if (error.message.includes('Permission denied')) {
      console.error(
        '   💡 Check file permissions or run with appropriate access'
      );
    } else if (error.code === 'MODULE_NOT_FOUND') {
      console.error(
        '   💡 Missing dependency - check package.json and run npm install'
      );
    }

    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Show command start information with scope awareness
 * @llm-rule WHEN: Starting command execution to provide context about what will be validated
 * @llm-rule AVOID: Generic start messages - show specific scope and target information
 * @llm-rule NOTE: Helps users understand what the command will actually do
 */
function showCommandStart(command, args) {
  const scope = determineScope(command, args);
  console.log(`🚀 FLUX: Running ${command} ${scope.description}`);

  if (scope.target) {
    console.log(`🎯 Target: ${scope.target}`);
  }

  if (scope.hint) {
    console.log(`💡 ${scope.hint}`);
  }

  console.log('');
}

/**
 * Determine command scope and provide helpful context
 * @llm-rule WHEN: Analyzing command arguments to understand validation scope
 * @llm-rule AVOID: Complex parsing - keep scope detection simple and reliable
 * @llm-rule NOTE: Provides user-friendly descriptions of what will be validated
 */
function determineScope(command, args) {
  const target = args[0];

  if (!target) {
    return {
      description: 'for all features',
      target: null,
      hint: null,
    };
  }

  // Special handling for schema command with colon syntax
  if (command === 'schema' && target.includes(':')) {
    const [feature, schemaType] = target.split(':');
    return {
      description: `for ${feature} feature`,
      target: `${feature}.${schemaType}.yml/json`,
      hint: `Validating single schema file only`,
    };
  }

  // Feature/endpoint detection
  if (target.includes('/')) {
    const [feature, endpoint] = target.split('/');
    return {
      description: `for ${feature}/${endpoint} endpoint`,
      target: target,
      hint: `Endpoint-specific validation`,
    };
  }

  return {
    description: `for ${target} feature`,
    target: target,
    hint: `Feature-specific validation`,
  };
}

/**
 * Show failure guidance based on command type
 * @llm-rule WHEN: Command fails to provide actionable next steps for users
 * @llm-rule AVOID: Generic failure messages - provide command-specific guidance
 * @llm-rule NOTE: Helps users understand how to fix common validation failures
 */
function showFailureGuidance(command) {
  console.log('');
  console.log('💡 Troubleshooting suggestions:');

  switch (command) {
    case 'schema':
      console.log(
        '   • Check if .requirements.yml, .instructions.yml, .specification.json files exist'
      );
      console.log('   • Verify YAML/JSON syntax is valid');
      console.log('   • Ensure feature directory exists in src/features/');
      break;
    case 'types':
      console.log('   • Fix TypeScript compilation errors shown above');
      console.log('   • Check import paths and type definitions');
      console.log('   • Run: npx tsc --noEmit for detailed error information');
      break;
    case 'lint':
      console.log('   • Fix code standard violations shown above');
      console.log('   • Follow FLUX Framework naming conventions');
      console.log('   • Add required VoilaJSX documentation patterns');
      break;
    case 'contract':
      console.log('   • Ensure contract.ts files export CONTRACT object');
      console.log(
        '   • Check that logic.ts files export all contract functions'
      );
      console.log('   • Verify import declarations match actual imports');
      break;
    case 'test':
      console.log('   • Fix failing tests shown above');
      console.log('   • Ensure test files follow {endpoint}.test.ts naming');
      console.log('   • Check test coverage meets minimum requirements');
      break;
    case 'compliance':
      console.log('   • Address reliability issues shown above');
      console.log('   • Ensure all validation checks pass individually');
      console.log('   • Check specification.json configuration');
      break;
    case 'check':
      console.log('   • Fix the failing validation step shown above');
      console.log('   • Run individual commands to isolate issues');
      console.log('   • Use feature-specific targeting for faster debugging');
      break;
  }

  console.log('   • Run with DEBUG=1 for detailed error information');
  console.log('');
}

/**
 * Display help information with available commands and usage examples
 * @llm-rule WHEN: User requests help or provides invalid command
 * @llm-rule AVOID: Showing outdated command lists - keep in sync with COMMANDS object
 * @llm-rule NOTE: Examples use npm run flux:* format matching package.json scripts
 */
function showHelp() {
  console.log(`
🤖 FLUX Framework Scripts

Usage: npm run flux:<command> [arguments]

Available Commands:
`);

  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  flux:${cmd.padEnd(12)} ${desc}`);
  });

  console.log(`
Command Examples:
`);

  // Show examples for key commands
  ['check', 'schema', 'contract', 'test'].forEach((cmd) => {
    if (COMMAND_EXAMPLES[cmd]) {
      console.log(`  ${cmd}:`);
      COMMAND_EXAMPLES[cmd].forEach((example) => {
        console.log(`    ${example}`);
      });
      console.log('');
    }
  });

  console.log(`
Feature-Specific Validation:
  Most commands support feature and endpoint targeting:
  • npm run flux:<command>               # All features
  • npm run flux:<command> hello         # Hello feature only  
  • npm run flux:<command> hello/main    # Hello/main endpoint only

Schema Command Special Syntax:
  • npm run flux:schema hello:requirements    # Single schema file
  • npm run flux:schema hello:instructions    # Single schema file
  • npm run flux:schema hello:specification   # Single schema file

For help: npm run flux:help
Documentation: https://github.com/voilajsx/flux
`);
}

/**
 * Show command suggestions for typos and similar commands
 * @llm-rule WHEN: User provides invalid command that might be a typo
 * @llm-rule AVOID: Complex fuzzy matching - use simple similarity detection
 * @llm-rule NOTE: Helps users discover correct command names quickly
 */
function showSuggestions(invalidCommand) {
  const availableCommands = Object.keys(COMMANDS);

  // Simple similarity check for common typos
  const suggestions = availableCommands.filter((cmd) => {
    return (
      cmd.includes(invalidCommand) ||
      invalidCommand.includes(cmd) ||
      levenshteinDistance(cmd, invalidCommand) <= 2
    );
  });

  if (suggestions.length > 0) {
    console.log('💡 Did you mean:');
    suggestions.forEach((suggestion) => {
      console.log(`   npm run flux:${suggestion}`);
    });
    console.log('');
  } else {
    console.log('💡 Available commands:');
    availableCommands.forEach((cmd) => {
      console.log(`   npm run flux:${cmd}`);
    });
    console.log('');
  }
}

/**
 * Simple Levenshtein distance calculation for typo detection
 * @llm-rule WHEN: Detecting possible typos in command names
 * @llm-rule AVOID: Complex string matching algorithms - keep simple for performance
 * @llm-rule NOTE: Used only for providing helpful suggestions to users
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Configure global error handlers for graceful script termination
 * @llm-rule WHEN: Setting up process-level error handling for CI/CD reliability
 * @llm-rule AVOID: Letting uncaught errors crash without proper exit codes
 * @llm-rule NOTE: Uses consistent error formatting for both development and CI environments
 */
function setupErrorHandlers() {
  process.on('uncaughtException', (error) => {
    console.error('💥 FLUX: Uncaught exception:', error.message);
    console.error(
      '   💡 This indicates a serious issue in the validation code'
    );
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('💥 FLUX: Unhandled rejection:', reason);
    console.error(
      '   💡 Check for missing await keywords or unhandled promises'
    );
    process.exit(1);
  });
}

// Initialize error handlers and run main function
setupErrorHandlers();
main();
