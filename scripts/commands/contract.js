/**
 * FLUX Framework Contract Command - Enhanced contract validation with helper file support
 * @module @voilajsx/flux/scripts/commands/contract
 * @file scripts/commands/contract.js
 *
 * @llm-rule WHEN: Validating contract compliance across FLUX Framework features for mathematical reliability
 * @llm-rule AVOID: Partial contract validation - always validate complete contract-implementation consistency
 * @llm-rule NOTE: Enhanced to validate helper files, test implementations, and bidirectional consistency
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('contract');

/**
 * Contract validation command with comprehensive test and helper file validation
 * @llm-rule WHEN: Ensuring contract specifications match actual implementations before deployment
 * @llm-rule AVOID: Ignoring contract-implementation mismatches - causes runtime routing failures
 * @llm-rule NOTE: Validates routes, imports, helpers, tests, and events for complete consistency
 */
export default async function contract(args) {
  const startTime = Date.now();
  const target = args[0];

  // Start validation with comprehensive scope
  log.validationStart('contract', target, [
    'contract_discovery',
    'route_validation',
    'helper_validation',
    'import_consistency',
    'test_validation',
    'event_validation',
  ]);

  try {
    let validationResults = [];

    if (target) {
      // Validate specific feature or endpoint
      validationResults = await validateTarget(target);
    } else {
      // Validate all features
      validationResults = await validateAllFeatures();
    }

    // Analyze validation results
    const totalValidations = validationResults.length;
    const successfulValidations = validationResults.filter(
      (r) => r.valid
    ).length;
    const failedValidations = validationResults.filter((r) => !r.valid);

    const totalDuration = Date.now() - startTime;

    // Report comprehensive results
    if (failedValidations.length === 0) {
      const totalTests = validationResults.reduce(
        (sum, r) => sum + r.testCount,
        0
      );
      const totalRoutes = validationResults.reduce(
        (sum, r) => sum + r.routeCount,
        0
      );
      const totalHelpers = validationResults.reduce(
        (sum, r) => sum + r.helperCount,
        0
      );

      log.checkPass('Contract compliance validation', totalDuration, {
        validations_passed: totalValidations,
        features_checked: getUniqueFeatures(validationResults).length,
        total_routes: totalRoutes,
        total_tests: totalTests,
        total_helpers: totalHelpers,
      });

      // Add concise validation summary
      if (totalTests > 0) {
        log.human(`   ✅ All ${totalTests} contract tests implemented`);
      }
      if (totalHelpers > 0) {
        log.human(`   ✅ All ${totalHelpers} helper files validated`);
      }

      log.validationComplete('contract', 'success', totalDuration, {
        validations: totalValidations,
        target,
      });

      return true;
    } else {
      // Collect all errors and warnings for comprehensive reporting
      const allErrors = [];
      const allWarnings = [];

      failedValidations.forEach((result) => {
        result.errors.forEach((error) => {
          allErrors.push(`${result.feature}/${result.endpoint}: ${error}`);
        });
        result.warnings.forEach((warning) => {
          allWarnings.push(`${result.feature}/${result.endpoint}: ${warning}`);
        });
      });

      log.checkFail(
        'Contract compliance validation',
        totalDuration,
        allErrors,
        [
          'Fix contract-logic mismatches listed above',
          'Ensure all contract routes have corresponding exported functions',
          'Add missing imports to contract declarations',
          'Update contract routes to match actual function names',
          'Implement missing tests declared in contract tests array',
          'Fix test descriptions to match contract test declarations',
          'Validate helper files match contract helper declarations',
          'Add missing helper files or remove from contract',
        ]
      );

      // Show warnings to humans for context
      if (allWarnings.length > 0) {
        log.warn(
          `${allWarnings.length} contract warnings found`,
          {
            warnings: allWarnings.slice(0, 5),
          },
          allWarnings.map((w) => w.split(': ')[1]).filter(Boolean)
        );
      }

      return false;
    }
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log.error(
      `Contract validation crashed: ${error.message}`,
      {
        command: 'contract',
        error: error.message,
        duration: totalDuration,
        target,
      },
      [
        'Check if all contract and logic files exist and are readable',
        'Verify TypeScript compilation is working',
        'Check file permissions and paths',
        'Ensure test files exist and follow proper naming convention',
        'Validate helper files follow {endpoint}.helper.ts naming',
      ]
    );
    return false;
  }
}

/**
 * Validate all features in the FLUX Framework project
 * @llm-rule WHEN: Running complete project contract validation without specific target
 * @llm-rule AVOID: Processing disabled features (underscore prefix) - skip for performance
 * @llm-rule NOTE: Discovers enabled features automatically and validates each endpoint
 */
async function validateAllFeatures() {
  const results = [];
  const featuresPath = join(process.cwd(), 'src', 'features');

  try {
    const features = await readdir(featuresPath);

    for (const feature of features) {
      if (feature.startsWith('_') || feature.startsWith('.')) continue;

      const featureResults = await validateFeature(featuresPath, feature);
      results.push(...featureResults);
    }
  } catch (error) {
    results.push({
      valid: false,
      feature: 'system',
      endpoint: 'features',
      errors: [`Cannot read features directory: ${error.message}`],
      warnings: [],
      routeCount: 0,
      testCount: 0,
      helperCount: 0,
    });
  }

  return results;
}

/**
 * Validate specific target (feature or endpoint) with precise scope
 * @llm-rule WHEN: Validating specific feature or endpoint during development or debugging
 * @llm-rule AVOID: Invalid target formats - use feature/endpoint pattern consistently
 * @llm-rule NOTE: Supports both feature-level and endpoint-level targeting for flexibility
 */
async function validateTarget(target) {
  const featuresPath = join(process.cwd(), 'src', 'features');
  const [featureName, endpointName] = target.split('/');

  if (endpointName) {
    // Validate specific endpoint
    const result = await validateEndpoint(
      featuresPath,
      featureName,
      endpointName
    );
    return [result];
  } else {
    // Validate specific feature
    return await validateFeature(featuresPath, featureName);
  }
}

/**
 * Validate all endpoints within a specific feature
 * @llm-rule WHEN: Validating complete feature including all endpoints and helper files
 * @llm-rule AVOID: Processing non-directory items as endpoints - causes validation errors
 * @llm-rule NOTE: Skips requirements.yml and other non-endpoint files automatically
 */
async function validateFeature(featuresPath, featureName) {
  const results = [];
  const featurePath = join(featuresPath, featureName);

  try {
    // Check if feature exists
    await stat(featurePath);

    // Get all endpoint directories
    const items = await readdir(featurePath);

    for (const item of items) {
      if (item.startsWith('_') || item.startsWith('.')) continue;
      if (item.endsWith('.yml') || item.endsWith('.json')) continue;

      const itemPath = join(featurePath, item);
      const itemStat = await stat(itemPath);

      if (itemStat.isDirectory()) {
        const result = await validateEndpoint(featuresPath, featureName, item);
        results.push(result);
      }
    }

    // If no endpoints found, that's an error condition
    if (results.length === 0) {
      results.push({
        valid: false,
        feature: featureName,
        endpoint: 'none',
        errors: ['No endpoint directories found in feature'],
        warnings: [],
        routeCount: 0,
        testCount: 0,
        helperCount: 0,
      });
    }
  } catch (error) {
    results.push({
      valid: false,
      feature: featureName,
      endpoint: 'system',
      errors: [`Cannot read feature directory: ${error.message}`],
      warnings: [],
      routeCount: 0,
      testCount: 0,
      helperCount: 0,
    });
  }

  return results;
}

/**
 * Validate a specific endpoint with enhanced helper file and test checking
 * @llm-rule WHEN: Validating endpoint contract compliance including helper files and tests
 * @llm-rule AVOID: Partial endpoint validation - validate all aspects for reliability
 * @llm-rule NOTE: Enhanced to validate helper files declared in contract helpers array
 */
async function validateEndpoint(featuresPath, featureName, endpointName) {
  const result = {
    valid: true,
    feature: featureName,
    endpoint: endpointName,
    errors: [],
    warnings: [],
    routeCount: 0,
    testCount: 0,
    helperCount: 0,
  };

  const endpointPath = join(featuresPath, featureName, endpointName);

  try {
    log.agent(
      'ENDPOINT_VALIDATION_START',
      {
        feature: featureName,
        endpoint: endpointName,
      },
      true
    );

    // 1. Check required core files exist
    const contractFile = join(endpointPath, `${endpointName}.contract.ts`);
    const logicFile = join(endpointPath, `${endpointName}.logic.ts`);
    const testFile = join(endpointPath, `${endpointName}.test.ts`);

    let contractExists = false;
    let logicExists = false;
    let testExists = false;

    try {
      await stat(contractFile);
      contractExists = true;
    } catch {
      result.errors.push(`Missing contract file: ${endpointName}.contract.ts`);
    }

    try {
      await stat(logicFile);
      logicExists = true;
    } catch {
      result.errors.push(`Missing logic file: ${endpointName}.logic.ts`);
    }

    try {
      await stat(testFile);
      testExists = true;
    } catch {
      result.errors.push(`Missing test file: ${endpointName}.test.ts`);
    }

    if (!contractExists || !logicExists) {
      result.valid = false;
      return result;
    }

    // 2. Load and parse contract with helper support
    const contract = await loadContract(contractFile);
    if (!contract) {
      result.valid = false;
      result.errors.push(
        `Contract file ${endpointName}.contract.ts could not be loaded or parsed`
      );
      return result;
    }

    // Store validation counts
    result.routeCount = Object.keys(contract.routes || {}).length;
    result.testCount = (contract.tests || []).length;
    result.helperCount = (contract.helpers || []).length;

    // 3. Load logic file content
    let logicContent;
    try {
      logicContent = await readFile(logicFile, 'utf-8');
    } catch (error) {
      result.valid = false;
      result.errors.push(
        `Could not read ${endpointName}.logic.ts: ${error.message}`
      );
      return result;
    }

    // 4. Load test file content if it exists
    let testContent = '';
    if (testExists) {
      try {
        testContent = await readFile(testFile, 'utf-8');
      } catch (error) {
        result.warnings.push(
          `Could not read ${endpointName}.test.ts: ${error.message}`
        );
      }
    }

    // 5. Validate route functions
    await validateRouteFunctions(contract, logicContent, result);

    // 6. Validate imports
    await validateImports(contract, logicContent, result);

    // 7. Validate helper files (NEW - Enhanced)
    await validateHelperFiles(contract, endpointPath, endpointName, result);

    // 8. Validate test implementations
    if (testExists && testContent) {
      await validateTestImplementations(contract, testContent, result);
    } else if (contract.tests && contract.tests.length > 0) {
      result.errors.push(
        `Contract declares ${contract.tests.length} tests but test file missing or unreadable`
      );
    }

    // 9. Validate events
    await validateEvents(contract, logicContent, result);

    // 10. Set overall validation status
    result.valid = result.errors.length === 0;

    // Only log failures to agent - warnings are for humans only
    if (!result.valid) {
      log.agent('ENDPOINT_VALIDATION_FAILED', {
        feature: featureName,
        endpoint: endpointName,
        routes: result.routeCount,
        tests: result.testCount,
        helpers: result.helperCount,
        errors: result.errors,
        warnings: result.warnings,
      });
    }

    return result;
  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation error: ${error.message}`);
    return result;
  }
}

/**
 * Validate helper files declared in contract helpers array with bidirectional checking
 * @llm-rule WHEN: Ensuring helper files declared in contract actually exist and have proper exports
 * @llm-rule AVOID: Missing helper file validation - breaks endpoint functionality at runtime
 * @llm-rule NOTE: Validates both declared helpers exist and undeclared helpers are flagged
 */
async function validateHelperFiles(
  contract,
  endpointPath,
  endpointName,
  result
) {
  const declaredHelpers = contract.helpers || [];

  try {
    // 1. Validate declared helper files exist and have exports
    for (const helperFile of declaredHelpers) {
      const helperPath = join(endpointPath, helperFile);

      try {
        await stat(helperPath);

        // Read helper file content and check for exports
        const helperContent = await readFile(helperPath, 'utf-8');
        const hasExports = validateHelperExports(
          helperContent,
          helperFile,
          result
        );

        if (!hasExports) {
          result.errors.push(
            `Helper file '${helperFile}' declared in contract but has no function or const exports`
          );
        }
      } catch (error) {
        result.errors.push(
          `Helper file '${helperFile}' declared in contract but file missing: ${error.message}`
        );
      }
    }

    // 2. Check for existing helper files not declared in contract (bidirectional validation)
    const files = await readdir(endpointPath);
    const existingHelpers = files.filter((file) => {
      if (!file.endsWith('.helper.ts')) return false;

      // Match {endpoint}.helper.ts or {endpoint}.{service}.helper.ts patterns
      const simpleHelper = file === `${endpointName}.helper.ts`;
      const serviceHelper =
        file.startsWith(`${endpointName}.`) &&
        file.endsWith('.helper.ts') &&
        file !== `${endpointName}.helper.ts`;

      return simpleHelper || serviceHelper;
    });

    for (const existingHelper of existingHelpers) {
      if (!declaredHelpers.includes(existingHelper)) {
        result.warnings.push(
          `Helper file '${existingHelper}' exists but not declared in contract helpers array`
        );
      }
    }

    // Log helper validation results to agent
    if (declaredHelpers.length > 0 || existingHelpers.length > 0) {
      log.agent('HELPER_VALIDATION', {
        feature: result.feature,
        endpoint: result.endpoint,
        declared_helpers: declaredHelpers,
        existing_helpers: existingHelpers,
        validation_passed:
          result.errors.filter((e) => e.includes('Helper')).length === 0,
      });
    }
  } catch (error) {
    result.warnings.push(`Helper file validation error: ${error.message}`);
  }
}

/**
 * Validate helper file has proper exports (functions or constants)
 * @llm-rule WHEN: Ensuring helper files provide actual functionality through exports
 * @llm-rule AVOID: Empty helper files - they should export utility functions or constants
 * @llm-rule NOTE: Checks for both function declarations and const exports
 */
function validateHelperExports(helperContent, helperFile, result) {
  // Check for export function declarations
  const exportFunctions = helperContent.match(
    /export\s+(?:async\s+)?function\s+(\w+)/g
  );

  // Check for export const declarations
  const exportConsts = helperContent.match(/export\s+const\s+(\w+)/g);

  const hasExports =
    (exportFunctions && exportFunctions.length > 0) ||
    (exportConsts && exportConsts.length > 0);

  if (hasExports) {
    const exportCount =
      (exportFunctions?.length || 0) + (exportConsts?.length || 0);
    log.agent('HELPER_EXPORTS_FOUND', {
      helper: helperFile,
      export_functions: exportFunctions?.length || 0,
      export_consts: exportConsts?.length || 0,
      total_exports: exportCount,
    });
  }

  return hasExports;
}

/**
 * Load and parse {endpoint}.contract.ts file to extract CONTRACT object with helper support
 * @llm-rule WHEN: Loading contract specifications for comprehensive validation
 * @llm-rule AVOID: Runtime evaluation - use static parsing for security and reliability
 * @llm-rule NOTE: Enhanced to extract helpers array for new FLUX Framework helper file support
 */
async function loadContract(contractPath) {
  try {
    log.agent('CONTRACT_PARSE_START', {
      path: contractPath,
    });

    // Parse TypeScript file directly using static analysis
    const content = await readFile(contractPath, 'utf-8');

    // Extract CONTRACT object using regex
    const contractMatch = content.match(
      /export\s+const\s+CONTRACT\s*=\s*({[\s\S]*?})\s*(?:as\s+const)?;/
    );

    if (!contractMatch) {
      log.agent('CONTRACT_PARSE_FAILED', {
        path: contractPath,
        reason: 'No CONTRACT export found',
      });
      return null;
    }

    const contractStr = contractMatch[1];

    // Basic validation
    if (!contractStr.includes('routes:')) {
      log.agent('CONTRACT_PARSE_INVALID', {
        path: contractPath,
        reason: 'Missing routes property',
      });
      return null;
    }

    // Extract all contract components
    const routes = extractRoutes(contractStr);
    const imports = extractImports(contractStr);
    const helpers = extractArrayProperty(contractStr, 'helpers'); // NEW
    const publishes = extractArrayProperty(contractStr, 'publishes');
    const subscribes = extractArrayProperty(contractStr, 'subscribes');
    const tests = extractArrayProperty(contractStr, 'tests');

    log.agent('CONTRACT_PARSE_SUCCESS', {
      path: contractPath,
      routes: Object.keys(routes).length,
      imports: {
        appkit: imports.appkit.length,
        external: imports.external.length,
      },
      helpers: helpers.length, // NEW
      tests: tests.length,
    });

    return {
      routes,
      imports,
      helpers, // NEW
      publishes,
      subscribes,
      tests,
    };
  } catch (error) {
    log.agent('CONTRACT_PARSE_ERROR', {
      path: contractPath,
      error: error.message,
    });
    return null;
  }
}

/**
 * Validate that test implementations match contract test declarations
 * @llm-rule WHEN: Ensuring contract test declarations have corresponding test implementations
 * @llm-rule AVOID: Missing test implementations - breaks test coverage guarantees
 * @llm-rule NOTE: Uses bidirectional validation to catch both missing and extra tests
 */
async function validateTestImplementations(contract, testContent, result) {
  const contractTests = contract.tests || [];

  if (contractTests.length === 0) {
    result.warnings.push('No tests declared in contract tests array');
    return;
  }

  // Extract test descriptions from test file
  const implementedTests = extractTestDescriptions(testContent);
  const missingTests = [];
  const extraTests = [];

  // Check if each contract test has a corresponding implementation
  for (const contractTest of contractTests) {
    const testFound = implementedTests.some(
      (implTest) =>
        normalizeTestDescription(implTest) ===
        normalizeTestDescription(contractTest)
    );

    if (!testFound) {
      missingTests.push(contractTest);
      result.errors.push(`Contract test not implemented: "${contractTest}"`);
    }
  }

  // Check for implemented tests not in contract (bidirectional validation)
  for (const implementedTest of implementedTests) {
    const testInContract = contractTests.some(
      (contractTest) =>
        normalizeTestDescription(contractTest) ===
        normalizeTestDescription(implementedTest)
    );

    if (!testInContract) {
      extraTests.push(implementedTest);
      result.warnings.push(
        `Test implemented but not declared in contract: "${implementedTest}"`
      );
    }
  }

  // Log test validation issues to agent for processing
  if (missingTests.length > 0 || extraTests.length > 0) {
    log.agent('TEST_VALIDATION_ISSUES', {
      feature: result.feature,
      endpoint: result.endpoint,
      contract_tests: contractTests.length,
      implemented_tests: implementedTests.length,
      missing_tests: missingTests,
      extra_tests: extraTests.slice(0, 3), // Limit for readability
    });
  }
}

/**
 * Extract test descriptions from test file content using regex patterns
 * @llm-rule WHEN: Parsing test files to extract test case descriptions for validation
 * @llm-rule AVOID: Complex parsing - use simple regex for reliable extraction
 * @llm-rule NOTE: Handles both test() and it() function patterns with various quote styles
 */
function extractTestDescriptions(testContent) {
  const testDescriptions = [];

  // Match test() and it() function calls with string descriptions
  const testRegex = /(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = testRegex.exec(testContent)) !== null) {
    testDescriptions.push(match[1]);
  }

  return testDescriptions;
}

/**
 * Normalize test description for comparison with case and whitespace handling
 * @llm-rule WHEN: Comparing test descriptions between contract and implementation
 * @llm-rule AVOID: Exact string matching - use normalized comparison for flexibility
 * @llm-rule NOTE: Handles case differences and multiple spaces for robust matching
 */
function normalizeTestDescription(description) {
  return description.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Validate that all contract routes have corresponding function exports in logic file
 * @llm-rule WHEN: Ensuring contract route mappings match actual function implementations
 * @llm-rule AVOID: Route-function mismatches - causes 404 errors at runtime
 * @llm-rule NOTE: Uses bidirectional validation to catch both missing and extra function exports
 */
async function validateRouteFunctions(contract, logicContent, result) {
  const routes = contract.routes;
  const routeEntries = Object.entries(routes);

  if (routeEntries.length === 0) {
    result.warnings.push('No routes declared in contract');
    return;
  }

  for (const [route, functionName] of routeEntries) {
    if (!functionName) {
      result.errors.push(`Route '${route}' has empty function name`);
      continue;
    }

    // Check if function is exported
    const exportRegex = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${functionName}\\s*\\(`,
      'g'
    );
    const constExportRegex = new RegExp(
      `export\\s+const\\s+${functionName}\\s*=`,
      'g'
    );

    const hasExport =
      exportRegex.test(logicContent) || constExportRegex.test(logicContent);

    if (!hasExport) {
      result.errors.push(
        `Route '${route}' mapped to function '${functionName}' but function not exported in logic file`
      );
    }
  }

  // Bidirectional validation - check for exported functions not in contract
  const exportMatches =
    logicContent.match(/export\s+(?:async\s+)?function\s+(\w+)\s*\(/g) || [];
  const constExportMatches =
    logicContent.match(/export\s+const\s+(\w+)\s*=/g) || [];

  const exportedFunctions = [
    ...exportMatches.map((match) => {
      const nameMatch = match.match(/function\s+(\w+)/);
      return nameMatch ? nameMatch[1] : null;
    }),
    ...constExportMatches.map((match) => {
      const nameMatch = match.match(/const\s+(\w+)/);
      return nameMatch ? nameMatch[1] : null;
    }),
  ].filter((name) => name !== null);

  const contractFunctions = Object.values(routes);

  for (const exportedFunction of exportedFunctions) {
    if (!contractFunctions.includes(exportedFunction)) {
      result.warnings.push(
        `Function '${exportedFunction}' exported but not declared in contract routes`
      );
    }
  }
}

/**
 * Validate that all contract imports exist in logic file with bidirectional checking
 * @llm-rule WHEN: Ensuring contract import declarations match actual imports in implementation
 * @llm-rule AVOID: Import-declaration mismatches - causes module loading failures
 * @llm-rule NOTE: Validates both VoilaJSX AppKit and external module imports
 */
async function validateImports(contract, logicContent, result) {
  const imports = contract.imports;

  // Validate AppKit imports
  const appkitModules = imports.appkit || [];
  for (const appkitModule of appkitModules) {
    const importRegex = new RegExp(
      `import\\s+.*from\\s+['"]@voilajsx/appkit/${appkitModule}['"]`,
      'g'
    );

    if (!importRegex.test(logicContent)) {
      result.errors.push(
        `AppKit module '${appkitModule}' declared in contract but not imported in logic file`
      );
    }
  }

  // Validate external imports
  const externalModules = imports.external || [];
  for (const externalModule of externalModules) {
    const escapedModule = externalModule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const importRegex = new RegExp(
      `import\\s+.*from\\s+['"]${escapedModule}['"]`,
      'g'
    );

    if (!importRegex.test(logicContent)) {
      result.errors.push(
        `External module '${externalModule}' declared in contract but not imported in logic file`
      );
    }
  }

  // Bidirectional check - find undeclared imports
  const appkitImportMatches =
    logicContent.match(/import\s+.*from\s+['"]@voilajsx\/appkit\/(\w+)['"]/g) ||
    [];
  const externalImportMatches =
    logicContent.match(/import\s+.*from\s+['"]([^@][^'"]+)['"]/g) || [];

  for (const match of appkitImportMatches) {
    const moduleMatch = match.match(/appkit\/(\w+)/);
    if (
      moduleMatch &&
      moduleMatch[1] &&
      !appkitModules.includes(moduleMatch[1])
    ) {
      result.warnings.push(
        `AppKit module '${moduleMatch[1]}' imported but not declared in contract`
      );
    }
  }

  for (const match of externalImportMatches) {
    const moduleMatch = match.match(/['"]([^@][^'"]+)['"]/);
    if (
      moduleMatch &&
      moduleMatch[1] &&
      !externalModules.includes(moduleMatch[1])
    ) {
      result.warnings.push(
        `External module '${moduleMatch[1]}' imported but not declared in contract`
      );
    }
  }
}

/**
 * Validate that event publishing and subscription match contract declarations
 * @llm-rule WHEN: Ensuring event-driven communication is properly declared and implemented
 * @llm-rule AVOID: Undeclared event usage - breaks event discovery and dependency tracking
 * @llm-rule NOTE: Uses bidirectional validation for both published and subscribed events
 */
async function validateEvents(contract, logicContent, result) {
  const publishes = contract.publishes || [];
  const subscribes = contract.subscribes || [];

  // Validate published events
  for (const event of publishes) {
    const emitRegex = new RegExp(
      `eventBus\\.emit\\s*\\(\\s*['"]${event}['"]`,
      'g'
    );

    if (!emitRegex.test(logicContent)) {
      result.errors.push(
        `Event '${event}' declared as published but no eventBus.emit() found in logic file`
      );
    }
  }

  // Validate subscribed events
  for (const event of subscribes) {
    const onRegex = new RegExp(`eventBus\\.on\\s*\\(\\s*['"]${event}['"]`, 'g');

    if (!onRegex.test(logicContent)) {
      result.errors.push(
        `Event '${event}' declared as subscribed but no eventBus.on() found in logic file`
      );
    }
  }

  // Bidirectional check - find undeclared event usage
  const emitMatches =
    logicContent.match(/eventBus\.emit\s*\(\s*['"]([^'"]+)['"]/g) || [];
  const onMatches =
    logicContent.match(/eventBus\.on\s*\(\s*['"]([^'"]+)['"]/g) || [];

  for (const match of emitMatches) {
    const eventMatch = match.match(/['"]([^'"]+)['"]/);
    if (eventMatch && eventMatch[1] && !publishes.includes(eventMatch[1])) {
      result.warnings.push(
        `Event '${eventMatch[1]}' emitted but not declared in contract publishes`
      );
    }
  }

  for (const match of onMatches) {
    const eventMatch = match.match(/['"]([^'"]+)['"]/);
    if (eventMatch && eventMatch[1] && !subscribes.includes(eventMatch[1])) {
      result.warnings.push(
        `Event '${eventMatch[1]}' subscribed but not declared in contract subscribes`
      );
    }
  }
}

/**
 * Get unique features from validation results for summary reporting
 * @llm-rule WHEN: Generating summary statistics for contract validation results
 * @llm-rule AVOID: Duplicate feature counting - use Set for accurate counts
 * @llm-rule NOTE: Used for human-readable summary display in validation reports
 */
function getUniqueFeatures(results) {
  return [...new Set(results.map((r) => r.feature))];
}

/**
 * Extract routes from contract string using regex parsing
 * @llm-rule WHEN: Parsing contract files to extract route-function mappings
 * @llm-rule AVOID: Complex parsing - use simple regex for reliable extraction
 * @llm-rule NOTE: Handles standard FLUX contract route format with quoted strings
 */
function extractRoutes(contractStr) {
  const routes = {};

  try {
    const routesMatch = contractStr.match(/routes:\s*{([^}]+)}/s);
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
    // Ignore parsing errors for contract validation
  }

  return routes;
}

/**
 * Extract imports from contract string with VoilaJSX AppKit and external module support
 * @llm-rule WHEN: Parsing contract files to extract import declarations
 * @llm-rule AVOID: Missing import parsing - breaks import validation
 * @llm-rule NOTE: Separates VoilaJSX AppKit imports from external module imports
 */
function extractImports(contractStr) {
  const imports = { appkit: [], external: [] };

  try {
    const importsMatch = contractStr.match(/imports:\s*{([^}]+)}/s);
    if (importsMatch) {
      const importsContent = importsMatch[1];

      // Extract VoilaJSX AppKit imports
      const appkitMatch = importsContent.match(/appkit:\s*\[([^\]]+)\]/);
      if (appkitMatch) {
        const appkitStr = appkitMatch[1];
        const appkitModules = appkitStr.match(/"([^"]+)"/g);
        if (appkitModules) {
          imports.appkit = appkitModules.map((m) => m.replace(/"/g, ''));
        }
      }

      // Extract external module imports
      const externalMatch = importsContent.match(/external:\s*\[([^\]]+)\]/);
      if (externalMatch) {
        const externalStr = externalMatch[1];
        const externalModules = externalStr.match(/"([^"]+)"/g);
        if (externalModules) {
          imports.external = externalModules.map((m) => m.replace(/"/g, ''));
        }
      }
    }
  } catch (error) {
    // Ignore parsing errors for contract validation
  }

  return imports;
}

/**
 * Extract array property from contract string with flexible property support
 * @llm-rule WHEN: Parsing contract arrays like helpers, tests, publishes, subscribes
 * @llm-rule AVOID: Hardcoded property extraction - use generic function for all arrays
 * @llm-rule NOTE: Supports helpers array for new FLUX Framework helper file feature
 */
function extractArrayProperty(contractStr, propName) {
  const items = [];

  try {
    const propMatch = contractStr.match(
      new RegExp(`${propName}:\\s*\\[([^\\]]*)\\]`)
    );
    if (propMatch) {
      const propStr = propMatch[1];
      const itemMatches = propStr.match(/"([^"]+)"/g);
      if (itemMatches) {
        items.push(...itemMatches.map((m) => m.replace(/"/g, '')));
      }
    }
  } catch (error) {
    // Ignore parsing errors for contract validation
  }

  return items;
}
