/**
 * FLUX Framework Types Command - Simple TypeScript compilation check
 * @module @voilajsx/flux/scripts/commands/types
 * @file scripts/commands/types.js
 *
 * @llm-rule WHEN: Running TypeScript compilation check
 * @llm-rule AVOID: Complex validation - just run tsc and report errors
 * @llm-rule NOTE: Simple wrapper around TypeScript compiler with scope support
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
 * TypeScript compilation command - just runs tsc and reports results
 */
export default async function types(commandArgs) {
  const startTime = Date.now();
  const target = commandArgs.find((arg) => !arg.startsWith('-'));

  try {
    // Validate target exists if specified
    if (target) {
      const featuresPath = join(process.cwd(), 'src', 'features');

      if (target.includes('/')) {
        // Validate endpoint exists
        const [feature, endpoint] = target.split('/');
        const featurePath = join(featuresPath, feature);
        const endpointPath = join(featurePath, endpoint);

        try {
          await stat(featurePath);
          await stat(endpointPath);
        } catch (error) {
          log.human(`❌ Endpoint '${target}' not found`);
          return false;
        }
      } else {
        // Validate feature exists
        const featurePath = join(featuresPath, target);

        try {
          await stat(featurePath);
        } catch (error) {
          log.human(`❌ Feature '${target}' not found`);
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
        // No parseable errors found, show raw output
        log.human(`❌ Compilation failed (${duration}ms):`);
        log.human(output);
        return false;
      }

      // Filter errors to target if specified
      let relevantErrors = allErrors;
      if (target) {
        relevantErrors = allErrors.filter((error) => {
          if (target.includes('/')) {
            const [feature, endpoint] = target.split('/');
            return error.includes(`src/features/${feature}/${endpoint}/`);
          } else {
            return error.includes(`src/features/${target}/`);
          }
        });

        // If no relevant errors found but target was specified, target is clean
        if (relevantErrors.length === 0) {
          log.human(`✅ Passed (${duration}ms)`);
          return true;
        }
      }

      // Show the errors
      log.human(`❌ ${relevantErrors.length} error(s):`);
      relevantErrors.forEach((error) => {
        log.human(`   ${error}`);
      });
      return false;
    }

    // No errors found or no output
    if (!hasErrors || !output) {
      log.human(`✅ Passed (${duration}ms)`);
      return true;
    }

    // Has errors but couldn't parse them
    log.human(`❌ Compilation failed (${duration}ms)`);
    if (output) {
      log.human(`   Output: ${output.substring(0, 200)}...`);
    }
    return false;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.human(`❌ Setup failed: ${error.message} (${duration}ms)`);
    return false;
  }
}
