/**
 * ATOM Framework Types Command - TypeScript validation and type consistency enforcement
 * @module @voilajsx/atom/scripts/commands/types
 * @file scripts/commands/types.js
 *
 * @llm-rule WHEN: Validating TypeScript compilation and ATOM Framework type consistency
 * @llm-rule AVOID: Skipping type validation - causes runtime failures in production
 * @llm-rule NOTE: Enhanced to validate helper files and contract-logic type consistency
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const execAsync = promisify(exec);
const log = createLogger('types');

/**
 * Strip ANSI color codes from terminal output for clean parsing
 * @llm-rule WHEN: Processing TypeScript compiler output with color codes
 * @llm-rule AVOID: Parsing colored output directly - breaks error extraction
 * @llm-rule NOTE: Required for CI environments and consistent error parsing
 */
function stripAnsiCodes(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Parse TypeScript errors from compiler output with precise error extraction
 * @llm-rule WHEN: Extracting specific TypeScript errors for agent processing
 * @llm-rule AVOID: Generic error parsing - use specific TS error patterns
 * @llm-rule NOTE: Matches file:line:col - error TS#### pattern for accurate reporting
 */
function parseTypeScriptErrors(output) {
  const cleanOutput = stripAnsiCodes(output);
  const lines = cleanOutput.split('\n');
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for TypeScript error pattern: file:line:col - error TS####:
    if (line.match(/\.ts:\d+:\d+\s+-\s+error\s+TS\d+:/)) {
      // Extract the main error line
      const errorMatch = line.match(
        /^(.+\.ts:\d+:\d+)\s+-\s+error\s+(TS\d+:\s+.+)$/
      );
      if (errorMatch) {
        const [, location, errorMsg] = errorMatch;
        errors.push(`${location} - ${errorMsg}`);
      }
    }
  }

  return errors;
}

/**
 * TypeScript validation command with comprehensive type checking for ATOM Framework
 * @llm-rule WHEN: Ensuring type safety before code generation or deployment
 * @llm-rule AVOID: Proceeding with type errors - guarantees runtime failures
 * @llm-rule NOTE: Validates TypeScript compilation, contract consistency, and helper file types
 */
export default async function types(args) {
  const startTime = Date.now();
  const target = args[0];

  // Start validation with defined scope
  log.validationStart('types', target, [
    'typescript_compilation',
    'contract_consistency',
    'helper_validation',
    'import_exports',
  ]);

  try {
    // 1. TypeScript compilation check
    log.checkStart('TypeScript compilation check');

    const compileResult = await runTypeScriptCheck();

    if (!compileResult.success) {
      log.checkFail(
        'TypeScript compilation',
        compileResult.duration,
        compileResult.errors,
        [
          'Fix TypeScript errors listed above',
          'Check type annotations and imports',
          'Run npx tsc --noEmit for detailed output',
          'Ensure helper files have proper type exports',
        ]
      );
      return false;
    }

    log.checkPass('TypeScript compilation', compileResult.duration, {
      files_checked: compileResult.filesChecked,
      errors: 0,
    });

    // 2. ATOM type consistency validation
    log.checkStart('ATOM type consistency validation');

    const consistencyResult = await validateTypeConsistency(target);

    if (!consistencyResult.success) {
      log.checkFail(
        'Type consistency validation',
        consistencyResult.duration,
        consistencyResult.mismatches,
        [
          'Add missing function exports to logic files',
          'Remove unused exports or add to contract',
          'Check contract route mappings match function names',
          'Validate helper file exports match contract declarations',
        ]
      );
      return false;
    }

    log.checkPass('Type consistency validation', consistencyResult.duration, {
      features_checked: consistencyResult.featuresChecked,
      endpoints_validated: consistencyResult.endpointsValidated,
      mismatches: 0,
    });

    // 3. Import/export consistency validation
    log.checkStart('Import/export consistency validation');

    const importsResult = await validateImportExports(target);

    if (!importsResult.success) {
      log.checkFail(
        'Import/export validation',
        importsResult.duration,
        importsResult.issues,
        [
          'Fix import/export inconsistencies',
          'Check VoilaJSX import patterns',
          'Verify helper file imports',
        ]
      );
      return false;
    }

    log.checkPass(
      'Import/export consistency validation',
      importsResult.duration,
      {
        imports_validated: importsResult.importsValidated,
      }
    );

    // FINAL SUCCESS
    const totalDuration = Date.now() - startTime;
    log.validationComplete('types', 'success', totalDuration, {
      checks_passed: 3,
      target,
    });

    return true;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log.error(
      `Types validation crashed: ${error.message}`,
      {
        command: 'types',
        error: error.message,
        duration: totalDuration,
        target,
      },
      [
        'Check if TypeScript is installed: npm install typescript',
        'Verify tsconfig.json exists and is valid',
        'Check file permissions and paths',
        'Ensure all helper files are readable',
      ]
    );
    return false;
  }
}

/**
 * Run TypeScript compiler to check for compilation errors across all files
 * @llm-rule WHEN: Validating TypeScript compilation including helper files
 * @llm-rule AVOID: Ignoring compilation errors - causes deployment failures
 * @llm-rule NOTE: Uses --noEmit to check types without generating JavaScript output
 */
async function runTypeScriptCheck() {
  const startTime = Date.now();

  try {
    log.agent('TYPESCRIPT_COMPILE_START', {
      tool: 'tsc',
      flags: ['--noEmit', '--pretty'],
    });

    const { stdout, stderr } = await execAsync('npx tsc --noEmit --pretty');
    const duration = Date.now() - startTime;

    // If no output, compilation succeeded
    if (!stdout && !stderr) {
      return {
        success: true,
        duration,
        filesChecked: 'all_typescript_files',
        errors: [],
      };
    }

    // Check if there are actual errors (not just warnings)
    if (stderr && (stderr.includes('error TS') || stderr.includes(': error'))) {
      const errorLines = parseTypeScriptErrors(stderr);

      log.agent('TYPESCRIPT_ERRORS', {
        errors: errorLines,
        error_count: errorLines.length,
        duration,
      });

      return {
        success: false,
        duration,
        errors: errorLines,
      };
    }

    return {
      success: true,
      duration,
      filesChecked: 'all_typescript_files',
      errors: [],
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // exec throws on non-zero exit code (which means TS errors)
    if (error.stdout || error.stderr) {
      const output = error.stdout || error.stderr;
      const errorLines = parseTypeScriptErrors(output);

      log.agent('TYPESCRIPT_COMPILE_FAILED', {
        errors: errorLines,
        error_count: errorLines.length,
        duration,
        exit_code: error.code,
      });

      return {
        success: false,
        duration,
        errors: errorLines,
      };
    }

    return {
      success: false,
      duration,
      errors: [error.message],
    };
  }
}

/**
 * Validate type consistency between contract, logic, test, and helper files
 * @llm-rule WHEN: Ensuring contract declarations match actual implementations
 * @llm-rule AVOID: Contract-implementation mismatches - breaks runtime routing
 * @llm-rule NOTE: Enhanced to validate helper file exports and contract helper declarations
 */
async function validateTypeConsistency(target) {
  const startTime = Date.now();

  try {
    const featuresPath = join(process.cwd(), 'src', 'features');
    let featuresChecked = 0;
    let endpointsValidated = 0;
    let mismatches = [];

    log.agent('TYPE_CONSISTENCY_START', {
      target: target || 'all',
      features_path: featuresPath,
    });

    if (target) {
      // Validate specific feature or endpoint
      const result = await validateFeatureTypes(featuresPath, target);
      featuresChecked = 1;
      endpointsValidated = result.endpointsValidated || 0;
      if (!result.success) {
        mismatches = result.mismatches;
      }
    } else {
      // Validate all features
      const features = await readdir(featuresPath);

      for (const feature of features) {
        if (feature.startsWith('_') || feature.startsWith('.')) continue;

        const result = await validateFeatureTypes(featuresPath, feature);
        featuresChecked++;
        endpointsValidated += result.endpointsValidated || 0;

        if (!result.success) {
          mismatches.push(...result.mismatches);
        }
      }
    }

    const duration = Date.now() - startTime;

    if (mismatches.length > 0) {
      log.agent('TYPE_CONSISTENCY_FAILED', {
        features_checked: featuresChecked,
        endpoints_validated: endpointsValidated,
        mismatches,
        duration,
      });

      return {
        success: false,
        featuresChecked,
        endpointsValidated,
        mismatches,
        duration,
      };
    }

    log.agent('TYPE_CONSISTENCY_SUCCESS', {
      features_checked: featuresChecked,
      endpoints_validated: endpointsValidated,
      duration,
    });

    return {
      success: true,
      featuresChecked,
      endpointsValidated,
      mismatches: [],
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    log.agent('TYPE_CONSISTENCY_ERROR', {
      error: error.message,
      duration,
    });

    return {
      success: false,
      featuresChecked: 0,
      endpointsValidated: 0,
      mismatches: [error.message],
      duration,
    };
  }
}

/**
 * Validate types for a specific feature including all endpoints and helpers
 * @llm-rule WHEN: Validating feature-level type consistency including helper files
 * @llm-rule AVOID: Partial endpoint validation - validate complete feature scope
 * @llm-rule NOTE: Processes all endpoints in feature and validates helper file consistency
 */
async function validateFeatureTypes(featuresPath, target) {
  const [featureName, endpointName] = target.split('/');
  const featurePath = join(featuresPath, featureName);

  try {
    // Check if feature exists
    await stat(featurePath);

    if (endpointName) {
      // Validate specific endpoint
      const result = await validateEndpointTypes(featurePath, endpointName);
      return {
        success: result.success,
        mismatches: result.mismatches,
        endpointsValidated: 1,
      };
    } else {
      // Validate all endpoints in feature
      const endpoints = await readdir(featurePath);
      let allValid = true;
      const mismatches = [];
      let endpointsValidated = 0;

      for (const endpoint of endpoints) {
        if (endpoint.startsWith('_') || endpoint.startsWith('.')) continue;
        if (endpoint.endsWith('.yml') || endpoint.endsWith('.json')) continue;

        const endpointStat = await stat(join(featurePath, endpoint));
        if (!endpointStat.isDirectory()) continue;

        const result = await validateEndpointTypes(featurePath, endpoint);
        endpointsValidated++;

        if (!result.success) {
          allValid = false;
          mismatches.push(...result.mismatches);
        }
      }

      return {
        success: allValid,
        mismatches,
        endpointsValidated,
      };
    }
  } catch (error) {
    log.agent('FEATURE_VALIDATION_ERROR', {
      feature: target,
      error: error.message,
    });

    return {
      success: false,
      mismatches: [
        `Feature '${target}' not found or invalid: ${error.message}`,
      ],
      endpointsValidated: 0,
    };
  }
}

/**
 * Validate types for a specific endpoint including helper files
 * @llm-rule WHEN: Validating endpoint contract-logic consistency and helper file types
 * @llm-rule AVOID: Missing helper file validation - breaks endpoint functionality
 * @llm-rule NOTE: Validates contract routes, logic exports, and helper file consistency
 */
async function validateEndpointTypes(featurePath, endpointName) {
  const endpointPath = join(featurePath, endpointName);
  const mismatches = [];

  try {
    // Check for required files
    const contractFile = join(endpointPath, `${endpointName}.contract.ts`);
    const logicFile = join(endpointPath, `${endpointName}.logic.ts`);
    const testFile = join(endpointPath, `${endpointName}.test.ts`);

    // Verify core files exist
    await stat(contractFile);
    await stat(logicFile);
    await stat(testFile);

    // Read file contents for type analysis
    const contractContent = await readFile(contractFile, 'utf-8');
    const logicContent = await readFile(logicFile, 'utf-8');

    // Validate contract-logic consistency
    const contractRoutes = extractContractRoutes(contractContent);
    const contractHelpers = extractContractHelpers(contractContent);
    const logicExports = extractLogicExports(logicContent);

    // 1. Check if logic file exports functions declared in contract routes
    for (const [route, functionName] of Object.entries(contractRoutes)) {
      if (!logicExports.includes(functionName)) {
        mismatches.push(
          `Route '${route}' maps to function '${functionName}' but function not exported in logic file`
        );
      }
    }

    // 2. Validate helper files if declared in contract
    if (contractHelpers.length > 0) {
      const helperValidation = await validateHelperFileTypes(
        endpointPath,
        endpointName,
        contractHelpers
      );
      if (!helperValidation.success) {
        mismatches.push(...helperValidation.mismatches);
      }
    }

    // 3. Check for undeclared exports (warning level)
    for (const exportedFunction of logicExports) {
      if (!Object.values(contractRoutes).includes(exportedFunction)) {
        log.agent('EXTRA_EXPORT', {
          endpoint: endpointName,
          function: exportedFunction,
          message: 'Function exported but not declared in contract routes',
        });
      }
    }

    return {
      success: mismatches.length === 0,
      mismatches,
    };
  } catch (error) {
    return {
      success: false,
      mismatches: [
        `Error validating endpoint '${endpointName}': ${error.message}`,
      ],
    };
  }
}

/**
 * Validate helper file types and contract declarations
 * @llm-rule WHEN: Ensuring helper files exist and have proper exports for contract declarations
 * @llm-rule AVOID: Missing helper file validation - causes import errors at runtime
 * @llm-rule NOTE: Validates both helper file existence and export consistency
 */
async function validateHelperFileTypes(
  endpointPath,
  endpointName,
  contractHelpers
) {
  const mismatches = [];

  try {
    // Check each declared helper file exists and has exports
    for (const helperFile of contractHelpers) {
      const helperPath = join(endpointPath, helperFile);

      try {
        await stat(helperPath);

        // Read helper file and check for exports
        const helperContent = await readFile(helperPath, 'utf-8');
        const helperExports = extractHelperExports(helperContent);

        if (helperExports.length === 0) {
          mismatches.push(
            `Helper file '${helperFile}' declared in contract but has no exports`
          );
        }
      } catch (error) {
        mismatches.push(
          `Helper file '${helperFile}' declared in contract but file missing: ${error.message}`
        );
      }
    }

    // Check for existing helper files not declared in contract
    const files = await readdir(endpointPath);
    const existingHelpers = files.filter(
      (file) => file.endsWith('.helper.ts') && file.startsWith(endpointName)
    );

    for (const existingHelper of existingHelpers) {
      if (!contractHelpers.includes(existingHelper)) {
        log.agent('UNDECLARED_HELPER', {
          endpoint: endpointName,
          helper: existingHelper,
          message: 'Helper file exists but not declared in contract',
        });
      }
    }

    return {
      success: mismatches.length === 0,
      mismatches,
    };
  } catch (error) {
    return {
      success: false,
      mismatches: [`Helper validation error: ${error.message}`],
    };
  }
}

/**
 * Extract route mappings from contract file for validation
 * @llm-rule WHEN: Parsing contract files to extract route-function mappings
 * @llm-rule AVOID: Complex parsing - use simple regex for reliable extraction
 * @llm-rule NOTE: Handles standard ATOM contract route format with quoted strings
 */
function extractContractRoutes(contractContent) {
  const routes = {};

  try {
    const routesMatch = contractContent.match(/routes:\s*{([^}]+)}/s);
    if (routesMatch) {
      const routesContent = routesMatch[1];
      const routeMatches = routesContent.match(/"([^"]+)":\s*"([^"]+)"/g);

      if (routeMatches) {
        routeMatches.forEach((match) => {
          const [, route, functionName] = match.match(/"([^"]+)":\s*"([^"]+)"/);
          routes[route] = functionName;
        });
      }
    }
  } catch (error) {
    // Ignore parsing errors for type validation
  }

  return routes;
}

/**
 * Extract helper file declarations from contract file
 * @llm-rule WHEN: Parsing contract files to extract helper file declarations
 * @llm-rule AVOID: Missing helper array parsing - breaks helper file validation
 * @llm-rule NOTE: Supports new helpers array in ATOM Framework contracts
 */
function extractContractHelpers(contractContent) {
  const helpers = [];

  try {
    const helpersMatch = contractContent.match(/helpers:\s*\[([^\]]*)\]/s);
    if (helpersMatch) {
      const helpersContent = helpersMatch[1];
      const helperMatches = helpersContent.match(/"([^"]+)"/g);

      if (helperMatches) {
        helperMatches.forEach((match) => {
          const helperFile = match.replace(/"/g, '');
          helpers.push(helperFile);
        });
      }
    }
  } catch (error) {
    // Ignore parsing errors for type validation
  }

  return helpers;
}

/**
 * Extract exported functions and constants from logic file
 * @llm-rule WHEN: Analyzing logic files for function exports to match against contracts
 * @llm-rule AVOID: Missing export patterns - causes incomplete validation
 * @llm-rule NOTE: Handles both function declarations and const exports
 */
function extractLogicExports(logicContent) {
  const exports = [];

  // Find export function declarations
  const functionMatches = logicContent.match(
    /export\s+(?:async\s+)?function\s+(\w+)/g
  );
  if (functionMatches) {
    functionMatches.forEach((match) => {
      const functionName = match.match(/function\s+(\w+)/)[1];
      exports.push(functionName);
    });
  }

  // Find export const declarations
  const constMatches = logicContent.match(/export\s+const\s+(\w+)/g);
  if (constMatches) {
    constMatches.forEach((match) => {
      const constName = match.match(/const\s+(\w+)/)[1];
      exports.push(constName);
    });
  }

  return exports;
}

/**
 * Extract exported functions and constants from helper files
 * @llm-rule WHEN: Analyzing helper files for exports to ensure they provide functionality
 * @llm-rule AVOID: Missing helper export validation - breaks endpoint functionality
 * @llm-rule NOTE: Uses same pattern as logic file exports for consistency
 */
function extractHelperExports(helperContent) {
  const exports = [];

  // Find export function declarations
  const functionMatches = helperContent.match(
    /export\s+(?:async\s+)?function\s+(\w+)/g
  );
  if (functionMatches) {
    functionMatches.forEach((match) => {
      const functionName = match.match(/function\s+(\w+)/)[1];
      exports.push(functionName);
    });
  }

  // Find export const declarations
  const constMatches = helperContent.match(/export\s+const\s+(\w+)/g);
  if (constMatches) {
    constMatches.forEach((match) => {
      const constName = match.match(/const\s+(\w+)/)[1];
      exports.push(constName);
    });
  }

  return exports;
}

/**
 * Validate import/export consistency across ATOM Framework files
 * @llm-rule WHEN: Ensuring import/export patterns follow VoilaJSX and ATOM conventions
 * @llm-rule AVOID: Complex import validation - TypeScript compiler handles most cases
 * @llm-rule NOTE: Currently delegates to TypeScript compiler, extensible for custom validation
 */
async function validateImportExports(target) {
  const startTime = Date.now();

  try {
    log.agent('IMPORT_EXPORTS_START', { target: target || 'all' });

    // TypeScript compiler handles most import/export validation
    // This function can be extended for ATOM-specific patterns:
    // - VoilaJSX import patterns validation
    // - Helper file import consistency
    // - Circular dependency detection

    const duration = Date.now() - startTime;

    log.agent('IMPORT_EXPORTS_SUCCESS', {
      imports_validated: 'typescript_handled',
      duration,
    });

    return {
      success: true,
      importsValidated: 'typescript_handled',
      issues: [],
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    log.agent('IMPORT_EXPORTS_ERROR', {
      error: error.message,
      duration,
    });

    return {
      success: false,
      importsValidated: 0,
      issues: [error.message],
      duration,
    };
  }
}
