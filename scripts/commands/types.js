/**
 * FLUX Framework Types Command - Improved TypeScript compilation check
 * @module @voilajsx/flux/scripts/commands/types
 * @file scripts/commands/types.js
 *
 * @llm-rule WHEN: Running TypeScript compilation check with proper error detection
 * @llm-rule AVOID: Complex validation - run tsc in project context and properly parse all errors
 * @llm-rule NOTE: Always uses project-wide compilation for accurate module resolution
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const execAsync = promisify(exec);
const log = createLogger('types');

/**
 * Strip ANSI color codes from terminal output
 */
function stripAnsiCodes(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Parse TypeScript errors from compiler output with improved detection
 */
function parseTypeScriptErrors(output) {
  const cleanOutput = stripAnsiCodes(output);
  const lines = cleanOutput.split('\n');
  const errors = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Improved regex patterns to catch various TypeScript error formats
    const errorPatterns = [
      // Standard format: src/file.ts:12:34 - error TS2345: Message
      /\.ts:\d+:\d+\s*-\s*error\s+TS\d+:/,
      // Alternative format: file.ts(12,34): error TS2345: Message
      /\.ts\(\d+,\d+\):\s*error\s+TS\d+:/,
      // Simple format: error TS2345: Message (when file context is elsewhere)
      /^error\s+TS\d+:/,
      // Found X error(s) - summary line that indicates errors exist
      /^Found\s+\d+\s+error/i,
    ];

    // Check if line matches any error pattern
    const isError = errorPatterns.some((pattern) => pattern.test(trimmed));

    if (isError) {
      errors.push(trimmed);
    }
  }

  return errors;
}

/**
 * Parse target path to extract app, version, feature, and endpoint components
 * @llm-rule WHEN: Processing command arguments to support multi-app architecture
 * @llm-rule AVOID: Legacy path support - enforce multi-app format only
 * @llm-rule NOTE: Follows patterns documented in docs/FLUX_COMMANDS.md
 */
function parseTarget(target) {
  if (!target) {
    return { type: 'all', description: 'all apps and features' };
  }

  const pathParts = target.split('/');

  // Handle specific file targeting (greeting/v1/hello/main.contract.ts)
  if (target.includes('.') && target.includes('/')) {
    const lastSlash = target.lastIndexOf('/');
    const pathPart = target.slice(0, lastSlash);
    const filePart = target.slice(lastSlash + 1);
    
    const pathPartParts = pathPart.split('/');
    if (pathPartParts.length < 3) {
      throw new Error(`Invalid file path format: ${target}. Expected: {app}/{version}/{feature}/{endpoint}/{file}`);
    }

    const fileNameParts = filePart.split('.');
    const endpoint = fileNameParts[0];

    return {
      type: 'file',
      appname: pathPartParts[0],
      version: pathPartParts[1],
      feature: pathPartParts[2],
      endpoint: pathPartParts[3] || endpoint,
      fileName: filePart,
      description: `specific file ${filePart}`,
      path: target,
      fullPath: `src/api/${pathPartParts[0]}/${pathPartParts[1]}/${pathPartParts[2]}/${pathPartParts[3] || endpoint}/${filePart}`,
    };
  }

  if (pathParts.length >= 3) {
    // Multi-app format: {app}/{version}/{feature}/{endpoint}
    // Example: greeting/v1/hello/main or flux/v1/weather
    const appname = pathParts[0];
    const version = pathParts[1];
    const feature = pathParts[2];
    const endpoint = pathParts[3] || null;

    if (endpoint) {
      return {
        type: 'endpoint',
        appname,
        version,
        feature,
        endpoint,
        description: `${appname}/${version}/${feature}/${endpoint} endpoint`,
        path: `src/api/${appname}/${version}/${feature}/${endpoint}`,
        fullPath: `src/api/${appname}/${version}/${feature}/${endpoint}`,
      };
    } else {
      return {
        type: 'feature',
        appname,
        version,
        feature,
        description: `${appname}/${version}/${feature} feature`,
        path: `src/api/${appname}/${version}/${feature}`,
        fullPath: `src/api/${appname}/${version}/${feature}`,
      };
    }
  } else {
    // Invalid format - require full app/version/feature path
    throw new Error(`Invalid path format: ${target}. Expected: {app}/{version}/{feature} or {app}/{version}/{feature}/{endpoint}`);
  }
}

/**
 * Filter errors based on target with improved path matching
 */
function filterErrorsByTarget(errors, targetInfo) {
  if (targetInfo.type === 'all') {
    return errors;
  }

  return errors.filter((error) => {
    // Skip summary lines like "Found X error(s)"
    if (error.match(/^Found\s+\d+\s+error/i)) {
      return true; // Keep summary lines
    }

    // For specific targets, check if the error relates to our target path
    const pathsToCheck = [];

    if (targetInfo.type === 'file') {
      // Check for the specific file
      pathsToCheck.push(targetInfo.fullPath);
      pathsToCheck.push(
        `${targetInfo.appname}/${targetInfo.version}/${targetInfo.feature}/${targetInfo.endpoint}/${targetInfo.fileName}`
      );
    } else if (targetInfo.type === 'endpoint') {
      // Check for any file in the endpoint directory
      pathsToCheck.push(targetInfo.fullPath);
      pathsToCheck.push(`${targetInfo.appname}/${targetInfo.version}/${targetInfo.feature}/${targetInfo.endpoint}/`);
    } else if (targetInfo.type === 'feature') {
      // Check for any file in the feature directory
      pathsToCheck.push(targetInfo.fullPath);
      pathsToCheck.push(`${targetInfo.appname}/${targetInfo.version}/${targetInfo.feature}/`);
    }

    // Check if error mentions any of our target paths
    return pathsToCheck.some((path) => error.includes(path));
  });
}

/**
 * TypeScript compilation command - runs project-wide tsc and filters results
 */
export default async function types(commandArgs) {
  const startTime = Date.now();
  const target = commandArgs.find((arg) => !arg.startsWith('-'));
  const targetInfo = parseTarget(target);

  try {
    // Validate target exists if specified
    if (targetInfo.type !== 'all') {
      try {
        await stat(targetInfo.fullPath);
      } catch (error) {
        log.human(
          `❌ Target '${targetInfo.description}' not found at ${targetInfo.fullPath}`
        );
        return false;
      }
    }

    // CRITICAL: Always run project-wide TypeScript compilation for proper module resolution
    // This ensures we get accurate errors, not module resolution failures
    log.human(`🚀 FLUX: Running types for ${targetInfo.description}`);
    log.human(`🎯 Target: ${target || 'all'}`);
    log.human(
      `💡 Running project-wide TypeScript compilation for accurate results`
    );

    let compileResult;
    let hasErrors = false;

    try {
      // Run TypeScript compilation on entire project for proper context
      compileResult = await execAsync('npx tsc --noEmit --pretty', {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large outputs
      });
    } catch (error) {
      // TypeScript found errors - capture the output
      compileResult = error;
      hasErrors = true;
    }

    const duration = Date.now() - startTime;
    const output = compileResult.stdout || compileResult.stderr || '';

    // Parse all TypeScript errors from output
    const allErrors = parseTypeScriptErrors(output);

    // Debug output in development
    if (
      process.env.NODE_ENV === 'development' ||
      commandArgs.includes('--debug')
    ) {
      console.log('\n📊 Debug Info:');
      console.log(`Raw output length: ${output.length}`);
      console.log(`Total errors found: ${allErrors.length}`);
      console.log('All errors:', allErrors);
    }

    // If no errors were found and TypeScript didn't fail, we're good
    if (!hasErrors && allErrors.length === 0) {
      log.human(
        `✅ TypeScript validation passed for ${targetInfo.description} (${duration}ms)`
      );
      return true;
    }

    // If we have errors, filter them based on target
    const relevantErrors = filterErrorsByTarget(allErrors, targetInfo);

    if (
      process.env.NODE_ENV === 'development' ||
      commandArgs.includes('--debug')
    ) {
      console.log(`Relevant errors after filtering: ${relevantErrors.length}`);
      console.log('Relevant errors:', relevantErrors);
    }

    // Report results
    if (relevantErrors.length > 0) {
      log.human(
        `❌ TypeScript validation failed (${relevantErrors.length} errors) ${duration}ms`
      );
      console.log('');
      relevantErrors.forEach((error) => {
        // Format error output nicely
        if (error.match(/^Found\s+\d+\s+error/i)) {
          console.log(`📊 ${error}`);
        } else {
          console.log(`   ❌ ${error}`);
        }
      });
      return false;
    } else if (targetInfo.type !== 'all' && hasErrors) {
      // There were errors in the project, but none in our target
      log.human(
        `✅ TypeScript validation passed for ${targetInfo.description} (${duration}ms)`
      );
      log.human(`ℹ️  Note: Other files in the project have TypeScript errors`);
      return true;
    } else if (hasErrors) {
      // Project-wide errors when checking all
      log.human(`❌ TypeScript validation failed (${duration}ms)`);
      console.log('');
      allErrors.forEach((error) => console.log(`   ❌ ${error}`));
      return false;
    }

    // Fallback success case
    log.human(
      `✅ TypeScript validation passed for ${targetInfo.description} (${duration}ms)`
    );
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.human(
      `❌ TypeScript validation error (${duration}ms): ${error.message}`
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('Error details:', error);
    }

    return false;
  }
}
