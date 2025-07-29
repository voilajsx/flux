#!/usr/bin/env node

/**
 * FLUX Framework Action Logger - Universal logging system for agent progress tracking
 * @module @voilajsx/flux/scripts/action-logger
 * @file scripts/action-logger.js
 *
 * @llm-rule WHEN: Agent needs to log execution progress or read action history
 * @llm-rule AVOID: Direct file system operations - use this centralized logging system
 * @llm-rule NOTE: Single command handles all features: flux:actionlog {feature} {action}
 */

import { readFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Application entry point - routes commands to appropriate handlers
 * @llm-rule WHEN: Processing npm run flux:actionlog commands from package.json
 * @llm-rule AVOID: Executing without proper argument validation
 * @llm-rule NOTE: Expects exactly 2 arguments: feature name and command
 */
async function main() {
  try {
    const [feature, action] = process.argv.slice(2);

    if (!feature || !action) {
      displayUsage();
      process.exit(1);
    }

    if (action.startsWith('write:')) {
      await writeToActionLog(feature, action);
    } else if (action.startsWith('read:')) {
      await readFromActionLog(feature, action);
    } else {
      console.error(`❌ Invalid action: ${action}`);
      displayUsage();
      process.exit(1);
    }
  } catch (error) {
    console.error(`💥 Action logger failed: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Write action entries to feature-specific log files
 * @llm-rule WHEN: Agent needs to record progress, milestones, or status updates
 * @llm-rule AVOID: Writing without proper timestamp and formatting
 * @llm-rule NOTE: Creates log directory structure automatically if missing
 */
async function writeToActionLog(feature, action) {
  const message = extractMessage(action);

  if (!message) {
    console.error('❌ No message provided for write action');
    console.error(
      `Usage: npm run flux:actionlog ${feature} write:"your message"`
    );
    process.exit(1);
  }

  const logFilePath = getLogFilePath(feature);
  const logDirectory = dirname(logFilePath);

  // Ensure log directory exists
  await ensureDirectoryExists(logDirectory);

  // Format log entry with timestamp
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;

  // Write to log file
  await appendFile(logFilePath, logEntry, 'utf8');

  console.log(`✅ Action logged: ${message}`);
  console.log(`📁 File: ${logFilePath}`);
}

/**
 * Read action entries from feature-specific log files
 * @llm-rule WHEN: Agent or human needs to review execution history
 * @llm-rule AVOID: Reading without proper error handling for missing files
 * @llm-rule NOTE: Supports multiple read modes: full, last, or specific count
 */
async function readFromActionLog(feature, action) {
  const readMode = extractReadMode(action);

  if (!readMode) {
    console.error('❌ Invalid read mode');
    console.error(
      `Usage: npm run flux:actionlog ${feature} read:full|last|<number>`
    );
    process.exit(1);
  }

  const logFilePath = getLogFilePath(feature);

  if (!existsSync(logFilePath)) {
    console.log(`📝 No action log found for feature: ${feature}`);
    console.log(`Expected location: ${logFilePath}`);
    return;
  }

  const logContent = await readFile(logFilePath, 'utf8');
  const logLines = logContent
    .trim()
    .split('\n')
    .filter((line) => line.length > 0);

  if (logLines.length === 0) {
    console.log(`📝 Action log is empty for feature: ${feature}`);
    return;
  }

  displayLogContent(feature, logLines, readMode);
}

/**
 * Extract message content from write action command
 * @llm-rule WHEN: Parsing write commands to get the actual message content
 * @llm-rule AVOID: Simple string splitting - handle quoted messages properly
 * @llm-rule NOTE: Supports both quoted and unquoted message formats
 */
function extractMessage(action) {
  const colonIndex = action.indexOf(':');
  if (colonIndex === -1) return null;

  return action.substring(colonIndex + 1).replace(/^["']|["']$/g, '');
}

/**
 * Extract read mode from read action command
 * @llm-rule WHEN: Parsing read commands to determine output format
 * @llm-rule AVOID: Complex regex - use simple string operations
 * @llm-rule NOTE: Returns null for invalid read modes
 */
function extractReadMode(action) {
  const colonIndex = action.indexOf(':');
  if (colonIndex === -1) return null;

  const mode = action.substring(colonIndex + 1);

  // Validate read mode
  if (mode === 'full' || mode === 'last') return mode;

  const numericMode = parseInt(mode);
  if (!isNaN(numericMode) && numericMode > 0) return numericMode;

  return null;
}

/**
 * Generate log file path for specific feature
 * @llm-rule WHEN: Determining where to store or read action logs
 * @llm-rule AVOID: Hardcoding paths - use consistent path generation
 * @llm-rule NOTE: Follows FLUX convention: src/features/{feature}/{feature}.actions.log
 */
function getLogFilePath(feature) {
  return join(
    process.cwd(),
    'src',
    'features',
    feature,
    `${feature}.actions.log`
  );
}

/**
 * Ensure directory exists, create if missing
 * @llm-rule WHEN: Creating log files in potentially non-existent directories
 * @llm-rule AVOID: Assuming directories exist - create recursively as needed
 * @llm-rule NOTE: Uses recursive creation to handle nested directory structures
 */
async function ensureDirectoryExists(directoryPath) {
  if (!existsSync(directoryPath)) {
    await mkdir(directoryPath, { recursive: true });
    console.log(`📁 Created directory: ${directoryPath}`);
  }
}

/**
 * Display log content based on read mode
 * @llm-rule WHEN: Outputting log entries to console in requested format
 * @llm-rule AVOID: Raw content dumps - format appropriately for readability
 * @llm-rule NOTE: Handles full logs, single entries, and partial logs
 */
function displayLogContent(feature, logLines, readMode) {
  if (readMode === 'full') {
    console.log(
      `📜 Complete action log for ${feature} (${logLines.length} entries):`
    );
    console.log('─'.repeat(60));
    logLines.forEach((line) => console.log(line));
  } else if (readMode === 'last') {
    console.log(`📄 Latest action for ${feature}:`);
    console.log(logLines[logLines.length - 1]);
  } else if (typeof readMode === 'number') {
    const entriesToShow = Math.min(readMode, logLines.length);
    const recentEntries = logLines.slice(-entriesToShow);

    console.log(`📄 Last ${entriesToShow} actions for ${feature}:`);
    console.log('─'.repeat(40));
    recentEntries.forEach((line) => console.log(line));
  }
}

/**
 * Display usage information and examples
 * @llm-rule WHEN: User provides invalid arguments or requests help
 * @llm-rule AVOID: Verbose help text - keep focused on essential usage
 * @llm-rule NOTE: Shows practical examples for both write and read operations
 */
function displayUsage() {
  console.log(`
🤖 FLUX Action Logger

USAGE:
  npm run flux:actionlog <feature> <action>

WRITE ACTIONS:
  npm run flux:actionlog <feature> write:"message"
  
  Examples:
  npm run flux:actionlog weather write:"TASK_1_START"
  npm run flux:actionlog weather write:"Contract validation complete"
  npm run flux:actionlog auth write:"User authentication implemented"

READ ACTIONS:
  npm run flux:actionlog <feature> read:full     # Show all entries
  npm run flux:actionlog <feature> read:last     # Show latest entry
  npm run flux:actionlog <feature> read:5        # Show last 5 entries
  
  Examples:
  npm run flux:actionlog weather read:full
  npm run flux:actionlog weather read:last
  npm run flux:actionlog weather read:10

SETUP:
  Add to package.json:
  {
    "scripts": {
      "flux:actionlog": "node scripts/action-logger.js"
    }
  }

LOG LOCATION:
  src/features/<feature>/<feature>.actions.log
`);
}

// Execute main function
main();
