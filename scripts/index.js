#!/usr/bin/env node

/**
 * FLUX Framework Scripts - Main command router with validation pipeline orchestration
 * @module @voilajsx/flux/scripts/index
 * @file scripts/index.js
 *
 * @llm-rule WHEN: Routing FLUX Framework validation commands to specific handlers
 * @llm-rule AVOID: Running unknown commands - always validate command exists before execution
 * @llm-rule NOTE: Enhanced with schema command, git operations, and file-path syntax support
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
 * @llm-rule NOTE: Includes git operations and unified file-path syntax
 */
const COMMANDS = {
  check:
    'Runs complete validation pipeline (types, lint, contract, test, compliance)',
  schema:
    'Schema validation for requirements/instructions/specification/contract files',
  skim: 'Quick validation for development (schema + types + lint for specific files)',
  types: 'TypeScript type checking and consistency validation',
  lint: 'Code standards and VoilaJSX pattern validation',
  contract: 'Contract validation and dependency checking',
  test: 'Endpoint functionality testing and coverage validation',
  compliance: 'Implementation validation and manifest generation',
  manifest: 'Contract compliance validation and deployment readiness manifests',
  git: 'Smart git operations with FLUX context awareness',
  docs: 'Generate API documentation (markdown + JSON for agents)',
  uat: 'Run UAT tests against live endpoints with Playwright',
};

/**
 * Command usage examples for user guidance - Updated with file-path syntax
 * @llm-rule WHEN: Showing specific usage patterns for each command type
 * @llm-rule AVOID: Generic examples - provide realistic usage scenarios
 * @llm-rule NOTE: Demonstrates unified file-path syntax across all commands
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
    'npm run flux:schema hello.requirements.yml # Only hello.requirements.yml',
    'npm run flux:schema hello.instructions.yml # Only hello.instructions.yml',
    'npm run flux:schema hello.specification.json # Only hello.specification.json',
  ],
  manifest: [
    'npm run flux:manifest                 # Generate manifests for all features',
    'npm run flux:manifest hello           # Generate manifests for hello feature',
    'npm run flux:manifest hello/main      # Generate manifest for hello/main endpoint',
  ],
  skim: [
    'npm run flux:skim                     # Quick validation for all features',
    'npm run flux:skim hello               # Quick validation for hello feature',
    'npm run flux:skim hello/main          # Quick validation for hello/main endpoint',
    'npm run flux:skim hello/main.contract.ts # Validate specific file',
  ],
  types: [
    'npm run flux:types                    # All TypeScript files',
    'npm run flux:types hello              # hello feature only',
    'npm run flux:types hello/main         # hello/main endpoint only',
    'npm run flux:types hello/main.contract.js # Specific contract file',
  ],
  lint: [
    'npm run flux:lint                     # All files',
    'npm run flux:lint hello               # hello feature only',
    'npm run flux:lint hello/main          # hello/main endpoint only',
    'npm run flux:lint hello/main.logic.js # Specific logic file',
  ],
  contract: [
    'npm run flux:contract                 # All contracts',
    'npm run flux:contract hello           # hello feature contracts',
    'npm run flux:contract hello/main      # hello/main contract only',
    'npm run flux:contract hello/main.contract.js # Specific contract file',
  ],
  test: [
    'npm run flux:test                     # All tests',
    'npm run flux:test hello               # hello feature tests',
    'npm run flux:test hello/main          # hello/main tests only',
    'npm run flux:test hello/main.test.js  # Specific test file',
  ],
  compliance: [
    'npm run flux:compliance               # Full compliance check',
    'npm run flux:compliance hello         # hello feature compliance',
    'npm run flux:compliance hello/main    # hello/main endpoint compliance',
  ],
  git: [
    'npm run flux:git commit hello         # Smart commit with auto-detection',
    'npm run flux:git commit hello/main    # Commit endpoint changes',
    'npm run flux:git commit hello/main.contract.ts # Commit specific file + related',
    'npm run flux:git save                 # Emergency checkpoint',
    'npm run flux:git undo                 # Rollback last commit',
    'npm run flux:git sync                 # Pull + validate + resolve',
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
 * @llm-rule NOTE: Supports both legacy colon syntax and new file-path syntax
 */
function determineScope(command, args) {
  const target = args[0];

  if (!target) {
    return {
      description: 'for all features',
      hint:
        command === 'git'
          ? 'This will handle git operations for the entire project'
          : 'This will validate every feature in src/features/',
    };
  }

  // Handle git command context
  if (command === 'git') {
    const subcommand = args[0];
    const gitTarget = args[1];

    if (subcommand === 'commit' && gitTarget) {
      return {
        description: `git commit for ${gitTarget}`,
        target: gitTarget,
        hint: `Smart commit with auto-detection of related files`,
      };
    }

    return {
      description: `git ${subcommand}`,
      hint: 'Smart git operation with FLUX context awareness',
    };
  }

  // Handle file-path syntax (hello.requirements.yml)
  if (target.includes('.') && !target.includes('/')) {
    const parts = target.split('.');
    const feature = parts[0];
    const type = parts[1];
    const ext = parts[2];
    return {
      description: `for ${feature}.${type}.${ext}`,
      target: target,
      hint: `Validating specific ${type} file for ${feature} feature`,
    };
  }

  // Handle legacy schema command colon syntax (hello:requirements) - backwards compatibility
  if (command === 'schema' && target.includes(':')) {
    const [feature, schemaType] = target.split(':');
    return {
      description: `for ${feature}.${schemaType}`,
      target: `${feature}/${schemaType}`,
      hint: `⚠️ Colon syntax deprecated. Use: flux:schema ${feature}.${schemaType}.yml`,
    };
  }

  // Handle specific file with path (hello/main.contract.js)
  if (target.includes('.') && target.includes('/')) {
    const lastSlash = target.lastIndexOf('/');
    const pathPart = target.slice(0, lastSlash);
    const filePart = target.slice(lastSlash + 1);
    return {
      description: `for specific file ${filePart}`,
      target: target,
      hint: `Validating single file in ${pathPart}`,
    };
  }

  // Handle feature/endpoint syntax (hello/main)
  if (target.includes('/')) {
    const [feature, endpoint] = target.split('/');
    return {
      description: `for ${feature}/${endpoint} endpoint`,
      target: target,
      hint: `Validating single endpoint in ${feature} feature`,
    };
  }

  // Feature-only target (hello)
  return {
    description: `for ${target} feature`,
    target: target,
    hint: `Validating all endpoints in ${target} feature`,
  };
}

/**
 * Display comprehensive help information
 * @llm-rule WHEN: User requests help or provides invalid input
 * @llm-rule AVOID: Overwhelming help text - organize by priority and frequency of use
 * @llm-rule NOTE: Includes examples of new file-path syntax
 */
function showHelp() {
  console.log('⚡ FLUX Framework - Development & Validation Pipeline\n');

  console.log('📋 Available Commands:');
  Object.entries(COMMANDS).forEach(([cmd, description]) => {
    console.log(`   ${cmd.padEnd(12)} ${description}`);
  });

  console.log('\n💡 Usage Examples:');

  // Show most common examples first
  console.log('\n🔥 Most Common:');
  console.log(
    '   npm run flux:check hello              # Validate entire feature'
  );
  console.log(
    '   npm run flux:git commit hello/main    # Smart commit endpoint'
  );
  console.log(
    '   npm run flux:schema hello.requirements.yml # Validate specific schema'
  );

  console.log('\n📝 New File-Path Syntax:');
  console.log(
    '   npm run flux:types hello/main.contract.js   # Specific contract file'
  );
  console.log(
    '   npm run flux:lint hello/main.logic.js       # Specific logic file'
  );
  console.log(
    '   npm run flux:test hello/main.test.js        # Specific test file'
  );

  console.log('\n🎯 Targeting Options:');
  console.log('   npm run flux:<command>               # All features');
  console.log('   npm run flux:<command> hello         # Hello feature only');
  console.log(
    '   npm run flux:<command> hello/main    # Hello/main endpoint only'
  );
  console.log(
    '   npm run flux:<command> hello/main.contract.js # Specific file'
  );

  console.log('\n🔧 Git Operations:');
  console.log(
    '   npm run flux:git commit hello         # Auto-detect and commit feature'
  );
  console.log(
    '   npm run flux:git save                 # Emergency checkpoint'
  );
  console.log(
    '   npm run flux:git undo                 # Rollback last commit'
  );
  console.log(
    '   npm run flux:git sync                 # Pull + validate + resolve'
  );

  console.log('\n📚 For detailed examples: npm run flux:help <command>');
  console.log('📖 Documentation: https://github.com/voilajsx/flux');
}

/**
 * Show command suggestions for typos and similar commands
 * @llm-rule WHEN: User provides invalid command that might be a typo
 * @llm-rule AVOID: Complex fuzzy matching - use simple similarity detection
 * @llm-rule NOTE: Helps users discover correct command names quickly
 */
function showSuggestions(invalidCommand) {
  const availableCommands = Object.keys(COMMANDS);

  // Simple similarity detection based on string distance
  const suggestions = availableCommands.filter((cmd) => {
    const distance = levenshteinDistance(invalidCommand.toLowerCase(), cmd);
    return distance <= 2 && distance < cmd.length / 2;
  });

  if (suggestions.length > 0) {
    console.log('💡 Did you mean:');
    suggestions.forEach((suggestion) => {
      console.log(`   npm run flux:${suggestion}`);
    });
    console.log('');
  }
}

/**
 * Simple Levenshtein distance calculation for command suggestions
 * @llm-rule WHEN: Calculating similarity between user input and available commands
 * @llm-rule AVOID: Complex algorithms - simple implementation for basic suggestion
 * @llm-rule NOTE: Used to suggest corrections for typos in command names
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

// Execute the main function
main();
