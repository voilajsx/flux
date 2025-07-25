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
 * @llm-rule WHEN: Checking TypeScript compilation for project, feature, or endpoint
 * @llm-rule AVOID: Verbose logging - keep output minimal and clean
 * @llm-rule NOTE: Always uses tsconfig.json to respect exclusions and project settings
 */
export default async function types(commandArgs) {
  const startTime = Date.now();
  const target = commandArgs.find((arg) => !arg.startsWith('-'));

  try {
    // ALWAYS run full project compilation to respect tsconfig.json
    const compileCommand = 'npx tsc --noEmit --pretty';

    const { stdout, stderr } = await execAsync(compileCommand);
    const duration = Date.now() - startTime;

    // No output means success
    if (!stdout && !stderr) {
      log.human(`✅ Passed (${duration}ms)`);
      return true;
    }

    // Check for errors
    const output = stderr || stdout;
    if (output.includes('error TS') || output.includes(': error')) {
      const errors = parseTypeScriptErrors(output);

      // Filter errors to target if specified
      let relevantErrors = errors;
      if (target) {
        relevantErrors = errors.filter((error) => {
          if (target.includes('/')) {
            const [feature, endpoint] = target.split('/');
            return error.includes(`src/features/${feature}/${endpoint}/`);
          } else {
            return error.includes(`src/features/${target}/`);
          }
        });
      }

      if (relevantErrors.length > 0) {
        log.human(`❌ ${relevantErrors.length} error(s):`);
        relevantErrors.forEach((error) => {
          log.human(`   ${error}`);
        });
        return false;
      } else if (target) {
        log.human(`✅ Passed (${duration}ms)`);
        return true;
      } else {
        log.human(`❌ ${errors.length} error(s):`);
        errors.forEach((error) => {
          log.human(`   ${error}`);
        });
        return false;
      }
    }

    log.human(`✅ Passed (${duration}ms)`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;

    // TypeScript compilation failed
    if (error.stdout || error.stderr) {
      const output = error.stdout || error.stderr;
      const errors = parseTypeScriptErrors(output);

      if (errors.length > 0) {
        log.human(`❌ TypeScript: Found ${errors.length} error(s):`);
        log.human('');

        errors.forEach((errorLine) => {
          log.human(`   ${errorLine}`);
        });

        log.human('');
        log.human(`💡 Run 'npx tsc --noEmit' for detailed output`);
        log.human(`   Duration: ${duration}ms`);

        return false;
      }
    }

    // Unknown error
    log.human(`❌ TypeScript: Compilation failed - ${error.message}`);
    log.human(`   Duration: ${duration}ms`);
    log.human(`💡 Check if TypeScript is installed: npm install typescript`);

    return false;
  }
}
