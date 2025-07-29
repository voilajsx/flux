/**
 * FLUX Framework Types Command - Simple TypeScript compilation check
 * @module @voilajsx/flux/scripts/commands/types
 * @file scripts/commands/types.js
 *
 * @llm-rule WHEN: Running TypeScript compilation check
 * @llm-rule AVOID: Complex validation - just run tsc and report errors
 * @llm-rule NOTE: Simple wrapper around TypeScript compiler with unified file-path targeting
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
 * Parse TypeScript errors from compiler output
 */
function parseTypeScriptErrors(output) {
  const cleanOutput = stripAnsiCodes(output);
  const lines = cleanOutput.split('\n');
  const errors = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/\.ts:\d+:\d+\s+-\s+error\s+TS\d+:/)) {
      errors.push(trimmed);
    }
  }

  return errors;
}

/**
 * Parse target argument with unified file-path syntax support
 * @llm-rule WHEN: Processing command arguments to determine scope
 * @llm-rule AVOID: Complex parsing - keep simple and predictable
 * @llm-rule NOTE: Supports feature, endpoint, and specific file targeting
 */
function parseTarget(target) {
  if (!target) {
    return { type: 'all', description: 'all features' };
  }

  // Handle specific file targeting (hello/main.contract.ts)
  if (target.includes('.') && target.includes('/')) {
    const lastSlash = target.lastIndexOf('/');
    const pathPart = target.slice(0, lastSlash);
    const filePart = target.slice(lastSlash + 1);

    // Parse the file part to get endpoint name
    // main.contract.ts -> main
    const fileNameParts = filePart.split('.');
    const endpoint = fileNameParts[0];

    // For simple paths like "weather/main.contract.ts", pathPart is "weather"
    const feature = pathPart;

    return {
      type: 'file',
      feature,
      endpoint,
      fileName: filePart,
      description: `specific file ${filePart}`,
      path: target,
    };
  }

  // Handle endpoint targeting (hello/main)
  if (target.includes('/')) {
    const [feature, endpoint] = target.split('/');
    return {
      type: 'endpoint',
      feature,
      endpoint,
      description: `${feature}/${endpoint} endpoint`,
      path: `src/features/${feature}/${endpoint}`,
    };
  }

  // Handle feature targeting (hello)
  return {
    type: 'feature',
    feature: target,
    description: `${target} feature`,
    path: `src/features/${target}`,
  };
}

/**
 * TypeScript compilation command - just runs tsc and reports results
 */
export default async function types(commandArgs) {
  const startTime = Date.now();
  const target = commandArgs.find((arg) => !arg.startsWith('-'));
  const targetInfo = parseTarget(target);

  try {
    // Validate target exists if specified
    if (targetInfo.type !== 'all') {
      const featuresPath = join(process.cwd(), 'src', 'features');

      if (targetInfo.type === 'file') {
        // Validate specific file exists - construct correct path
        const filePath = join(
          process.cwd(),
          'src',
          'features',
          targetInfo.feature,
          targetInfo.endpoint,
          targetInfo.fileName
        );
        try {
          await stat(filePath);
        } catch (error) {
          log.human(
            `❌ File '${targetInfo.feature}/${targetInfo.endpoint}/${targetInfo.fileName}' not found`
          );
          return false;
        }
      } else if (targetInfo.type === 'endpoint') {
        // Validate endpoint exists
        const featurePath = join(featuresPath, targetInfo.feature);
        const endpointPath = join(featurePath, targetInfo.endpoint);

        try {
          await stat(featurePath);
          await stat(endpointPath);
        } catch (error) {
          log.human(
            `❌ Endpoint '${targetInfo.feature}/${targetInfo.endpoint}' not found`
          );
          return false;
        }
      } else if (targetInfo.type === 'feature') {
        // Validate feature exists
        const featurePath = join(featuresPath, targetInfo.feature);

        try {
          await stat(featurePath);
        } catch (error) {
          log.human(`❌ Feature '${targetInfo.feature}' not found`);
          return false;
        }
      }
    }

    // Run TypeScript compilation and handle both success and error cases
    let compileResult;
    let hasErrors = false;

    try {
      compileResult = await execAsync('npx tsc --noEmit --pretty');
    } catch (error) {
      // TypeScript found errors - this is the normal case when there are compilation errors
      compileResult = error;
      hasErrors = true;
    }

    const duration = Date.now() - startTime;

    // Get the output from either success or error case
    const output = compileResult.stdout || compileResult.stderr || '';

    // If we have output, check if it contains errors
    if (output && (output.includes('error TS') || output.includes(': error'))) {
      const allErrors = parseTypeScriptErrors(output);

      if (allErrors.length === 0) {
        // Output indicates errors but we couldn't parse them - show raw output
        log.human(`❌ TypeScript validation failed (${duration}ms)`);
        console.log(output);
        return false;
      }

      // Filter errors based on target if specified
      let relevantErrors = allErrors;
      if (targetInfo.type !== 'all') {
        relevantErrors = allErrors.filter((error) => {
          if (targetInfo.type === 'file') {
            // For file targeting, check if error is in the specific file
            const expectedPath = `src/features/${targetInfo.feature}/${targetInfo.endpoint}/${targetInfo.fileName}`;
            return error.includes(expectedPath);
          } else if (targetInfo.type === 'endpoint') {
            return error.includes(
              `src/features/${targetInfo.feature}/${targetInfo.endpoint}`
            );
          } else if (targetInfo.type === 'feature') {
            return error.includes(`src/features/${targetInfo.feature}/`);
          }
          return true;
        });
      }

      if (relevantErrors.length > 0) {
        log.human(
          `❌ TypeScript validation failed (${relevantErrors.length} errors) ${duration}ms`
        );
        console.log('');
        relevantErrors.forEach((error) => console.log(`   ${error}`));
        return false;
      } else if (targetInfo.type !== 'all') {
        // No relevant errors for the specified target
        log.human(
          `✅ TypeScript validation passed for ${targetInfo.description} (${duration}ms)`
        );
        return true;
      }
    }

    // No errors found or no relevant errors for target
    if (hasErrors && targetInfo.type === 'all') {
      // There were errors but not in our target scope
      log.human(`❌ TypeScript validation failed (${duration}ms)`);
      return false;
    }

    log.human(
      `✅ TypeScript validation passed for ${targetInfo.description} (${duration}ms)`
    );
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.human(
      `❌ TypeScript validation error (${duration}ms): ${error.message}`
    );
    return false;
  }
}
