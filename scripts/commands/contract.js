/**
 * FLUX Framework Contract Command - Modern VoilaJSX AppKit pattern validation
 * @module @voilajsx/flux/scripts/commands/contract
 * @file scripts/commands/contract.js
 *
 * @llm-rule WHEN: Validating contract compliance with modern VoilaJSX AppKit patterns
 * @llm-rule AVOID: Old import patterns - enforce current VoilaJSX standards only
 * @llm-rule NOTE: Validates Class-based imports with .get() initialization patterns
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('contract');

/**
 * VoilaJSX AppKit module mapping for contract validation
 * @llm-rule WHEN: Mapping contract declaration names to actual import patterns
 * @llm-rule AVOID: Mixing contract names with import paths
 * @llm-rule NOTE: Contract declares simple names, logic uses Class-based imports
 */
const APPKIT_MODULE_MAP = {
  // Contract name → Import path (Class-based pattern)
  util: 'util', // import { utilClass } from '@voilajsx/appkit/util'
  config: 'config', // import { configClass } from '@voilajsx/appkit/config'
  auth: 'auth', // import { authClass } from '@voilajsx/appkit/auth'
  logger: 'logger', // import { loggerClass } from '@voilajsx/appkit/logger'
  database: 'database', // import { databaseClass } from '@voilajsx/appkit/database'
  cache: 'cache', // import { cacheClass } from '@voilajsx/appkit/cache'
  error: 'error', // import { errorClass } from '@voilajsx/appkit/error'
  security: 'security', // import { securityClass } from '@voilajsx/appkit/security'
  storage: 'storage', // import { storageClass } from '@voilajsx/appkit/storage'
  email: 'email', // import { emailClass } from '@voilajsx/appkit/email'
  queue: 'queue', // import { queueClass } from '@voilajsx/appkit/queue'
  event: 'event', // import { eventClass } from '@voilajsx/appkit/event'
};

/**
 * Expected variable names after .get() initialization
 * @llm-rule WHEN: Validating correct variable naming conventions
 * @llm-rule AVOID: Wrong variable name expectations - must match actual patterns
 * @llm-rule NOTE: Maps to actual VoilaJSX variable naming: util→utils, logger→log, error→err
 */

const EXPECTED_VARIABLE_NAMES = {
  util: 'util', // const util = utilClass.get();
  config: 'config', // const config = configClass.get();
  auth: 'auth', // const auth = authClass.get();
  logger: 'logger', // const logger = loggerClass.get('feature');
  database: 'database', // const database = databaseClass.get();
  cache: 'cache', // const cache = cacheClass.get('namespace');
  error: 'error', // const error = errorClass.get();
  security: 'security', // const security = securityClass.get();
  storage: 'storage', // const storage = storageClass.get();
  email: 'email', // const email = emailClass.get();
  queue: 'queue', // const queue = queueClass.get();
  event: 'event', // const event = eventClass.get('namespace');
};

/**
 * Contract validation command entry point
 * @llm-rule WHEN: Running contract validation with modern VoilaJSX patterns
 * @llm-rule AVOID: Partial validation - ensure complete consistency
 * @llm-rule NOTE: Supports file-path, endpoint, feature, and full project validation
 */
export default async function contract(args) {
  const startTime = Date.now();
  const target = args[0];
  const targetInfo = parseTarget(target);

  try {
    log.human(
      `🔍 Starting contract validation for ${targetInfo.description}...`
    );

    // Validate target exists if specified
    if (targetInfo.type !== 'all') {
      const isValid = await validateTargetExists(targetInfo);
      if (!isValid) return false;
    }

    // Run validation based on target type
    let validationResults = [];

    switch (targetInfo.type) {
      case 'file':
        validationResults = [
          await validateEndpoint(targetInfo.feature, targetInfo.endpoint),
        ];
        break;
      case 'endpoint':
        validationResults = [
          await validateEndpoint(targetInfo.feature, targetInfo.endpoint),
        ];
        break;
      case 'feature':
        validationResults = await validateFeature(targetInfo.feature);
        break;
      case 'all':
      default:
        validationResults = await validateAllFeatures();
        break;
    }

    // Report results
    return reportValidationResults(
      validationResults,
      targetInfo,
      Date.now() - startTime
    );
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log.human(
      `❌ Contract validation error (${totalDuration}ms): ${error.message}`
    );
    return false;
  }
}

/**
 * Parse target argument with unified file-path syntax support
 * @llm-rule WHEN: Processing command arguments to determine validation scope
 * @llm-rule AVOID: Complex parsing logic - keep simple and predictable
 * @llm-rule NOTE: Supports feature, endpoint, and file-path targeting
 */
function parseTarget(target) {
  if (!target) {
    return { type: 'all', description: 'all features' };
  }

  // Handle file targeting (weather/main.contract.ts)
  if (target.includes('.') && target.includes('/')) {
    const lastSlash = target.lastIndexOf('/');
    const pathPart = target.slice(0, lastSlash);
    const filePart = target.slice(lastSlash + 1);
    const endpoint = filePart.split('.')[0];
    const feature = pathPart;

    return {
      type: 'file',
      feature,
      endpoint,
      fileName: filePart,
      description: `file ${filePart}`,
      path: `src/features/${feature}/${endpoint}/${filePart}`,
    };
  }

  // Handle endpoint targeting (weather/main)
  if (target.includes('/')) {
    const [feature, endpoint] = target.split('/');
    return {
      type: 'endpoint',
      feature,
      endpoint,
      description: `endpoint ${feature}/${endpoint}`,
      path: `src/features/${feature}/${endpoint}`,
    };
  }

  // Handle feature targeting (weather)
  return {
    type: 'feature',
    feature: target,
    description: `feature ${target}`,
    path: `src/features/${target}`,
  };
}

/**
 * Validate that the specified target exists
 * @llm-rule WHEN: Ensuring target exists before attempting validation
 * @llm-rule AVOID: Processing non-existent targets - causes confusing errors
 * @llm-rule NOTE: Provides clear error messages for missing targets
 */
async function validateTargetExists(targetInfo) {
  const featuresPath = join(process.cwd(), 'src', 'features');

  try {
    if (targetInfo.type === 'file') {
      const filePath = join(process.cwd(), targetInfo.path);
      await stat(filePath);
    } else if (targetInfo.type === 'endpoint') {
      const endpointPath = join(
        featuresPath,
        targetInfo.feature,
        targetInfo.endpoint
      );
      await stat(endpointPath);
    } else if (targetInfo.type === 'feature') {
      const featurePath = join(featuresPath, targetInfo.feature);
      await stat(featurePath);
    }
    return true;
  } catch (error) {
    log.human(`❌ Target not found: ${targetInfo.description}`);
    return false;
  }
}

/**
 * Validate all features in the project
 * @llm-rule WHEN: Running complete project validation
 * @llm-rule AVOID: Processing disabled features (underscore prefix)
 * @llm-rule NOTE: Auto-discovers enabled features and validates each
 */
async function validateAllFeatures() {
  const results = [];
  const featuresPath = join(process.cwd(), 'src', 'features');

  try {
    const features = await readdir(featuresPath);

    for (const feature of features) {
      if (feature.startsWith('_') || feature.startsWith('.')) continue;

      const featureResults = await validateFeature(feature);
      results.push(...featureResults);
    }
  } catch (error) {
    results.push(
      createErrorResult('system', 'features', [
        `Cannot read features directory: ${error.message}`,
      ])
    );
  }

  return results;
}

/**
 * Validate all endpoints within a specific feature
 * @llm-rule WHEN: Validating complete feature including all endpoints
 * @llm-rule AVOID: Processing non-endpoint files as endpoints
 * @llm-rule NOTE: Skips requirements.yml and other configuration files
 */
async function validateFeature(featureName) {
  const results = [];
  const featurePath = join(process.cwd(), 'src', 'features', featureName);

  try {
    const items = await readdir(featurePath);

    for (const item of items) {
      if (item.startsWith('_') || item.startsWith('.')) continue;
      if (item.endsWith('.yml') || item.endsWith('.json')) continue;

      const itemPath = join(featurePath, item);
      const itemStat = await stat(itemPath);

      if (itemStat.isDirectory()) {
        const endpointResult = await validateEndpoint(featureName, item);
        results.push(endpointResult);
      }
    }
  } catch (error) {
    results.push(
      createErrorResult(featureName, 'all', [
        `Cannot read feature directory: ${error.message}`,
      ])
    );
  }

  return results;
}

/**
 * Validate a single endpoint with complete contract-implementation consistency
 * @llm-rule WHEN: Performing comprehensive contract validation for endpoint
 * @llm-rule AVOID: Skipping validation steps - all are required for reliability
 * @llm-rule NOTE: Validates routes, imports, tests, and VoilaJSX patterns
 */
async function validateEndpoint(featureName, endpointName) {
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

  const endpointPath = join(
    process.cwd(),
    'src',
    'features',
    featureName,
    endpointName
  );
  const contractFile = join(endpointPath, `${endpointName}.contract.ts`);
  const logicFile = join(endpointPath, `${endpointName}.logic.ts`);
  const testFile = join(endpointPath, `${endpointName}.test.ts`);

  try {
    // 1. Check required files exist
    const contractExists = await fileExists(contractFile);
    const logicExists = await fileExists(logicFile);
    const testExists = await fileExists(testFile);

    if (!contractExists) {
      result.errors.push(`Contract file ${endpointName}.contract.ts not found`);
      result.valid = false;
      return result;
    }

    if (!logicExists) {
      result.errors.push(`Logic file ${endpointName}.logic.ts not found`);
      result.valid = false;
      return result;
    }

    // 2. Load and parse contract
    const contract = await loadContract(contractFile);
    if (!contract) {
      result.errors.push(`Contract file could not be loaded or parsed`);
      result.valid = false;
      return result;
    }

    // Store counts for reporting
    result.routeCount = Object.keys(contract.routes || {}).length;
    result.testCount = (contract.tests || []).length;
    result.helperCount = (contract.helpers || []).length;

    // 3. Load logic file content
    const logicContent = await readFile(logicFile, 'utf-8');

    // 4. Load test file content if exists
    let testContent = '';
    if (testExists) {
      testContent = await readFile(testFile, 'utf-8');
    }

    // 5. Perform all validations
    validateRouteImplementations(contract, logicContent, result);
    validateVoilaJSXImports(contract, logicContent, result);
    validateTestImplementations(contract, testContent, result);
    validateHelperFiles(contract, endpointPath, endpointName, result);

    // 6. Set final validation status
    if (result.errors.length > 0) {
      result.valid = false;
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation failed: ${error.message}`);
  }

  return result;
}

/**
 * Load and parse contract file to extract CONTRACT object
 * @llm-rule WHEN: Loading contract specifications for validation
 * @llm-rule AVOID: Runtime evaluation - use static parsing for security
 * @llm-rule NOTE: Extracts routes, imports, tests, and helpers using regex
 */
async function loadContract(contractPath) {
  try {
    const content = await readFile(contractPath, 'utf-8');

    // Extract CONTRACT object using regex
    const contractMatch = content.match(
      /export\s+const\s+CONTRACT\s*=\s*({[\s\S]*?})\s*(?:as\s+const)?;/
    );

    if (!contractMatch) return null;

    const contractStr = contractMatch[1];
    if (!contractStr.includes('routes:')) return null;

    // Parse contract components
    return {
      routes: extractRoutes(contractStr),
      imports: extractImports(contractStr),
      tests: extractArrayProperty(contractStr, 'tests'),
      helpers: extractArrayProperty(contractStr, 'helpers'),
      publishes: extractArrayProperty(contractStr, 'publishes'),
      subscribes: extractArrayProperty(contractStr, 'subscribes'),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extract routes object from contract string
 * @llm-rule WHEN: Parsing route definitions from contract
 * @llm-rule AVOID: Strict regex - handle various quote styles and spacing
 * @llm-rule NOTE: Handles both single and double quotes, with flexible spacing
 */
function extractRoutes(contractStr) {
  const routes = {};

  // Match routes object with flexible spacing and quote styles
  const routesMatch = contractStr.match(/routes:\s*{([^}]*)}/s);
  if (!routesMatch) return routes;

  const routesContent = routesMatch[1];

  // Handle both single and double quotes, with optional trailing commas
  const routeMatches = routesContent.match(
    /['"]([^'"]+)['"]:\s*['"]([^'"]+)['"],?/g
  );

  if (routeMatches) {
    routeMatches.forEach((match) => {
      const parts = match.match(/['"]([^'"]+)['"]:\s*['"]([^'"]+)['"],?/);
      if (parts) {
        routes[parts[1]] = parts[2];
      }
    });
  }

  return routes;
}

/**
 * Extract imports object from contract string
 * @llm-rule WHEN: Parsing import declarations from contract
 * @llm-rule AVOID: Strict quote matching - handle various quote styles
 * @llm-rule NOTE: Handles both single and double quotes with flexible spacing
 */
function extractImports(contractStr) {
  const imports = { appkit: [], external: [] };
  const importsMatch = contractStr.match(/imports:\s*{([^}]*)}/s);

  if (!importsMatch) return imports;

  const importsContent = importsMatch[1];

  // Extract appkit imports with flexible quote handling
  const appkitMatch = importsContent.match(/appkit:\s*\[([^\]]*)\]/s);
  if (appkitMatch) {
    const appkitItems = appkitMatch[1].match(/['"]([^'"]+)['"],?/g);
    if (appkitItems) {
      imports.appkit = appkitItems.map((item) =>
        item.replace(/['"],?$/g, '').replace(/^['"]/, '')
      );
    }
  }

  // Extract external imports with flexible quote handling
  const externalMatch = importsContent.match(/external:\s*\[([^\]]*)\]/s);
  if (externalMatch) {
    const externalItems = externalMatch[1].match(/['"]([^'"]+)['"],?/g);
    if (externalItems) {
      imports.external = externalItems.map((item) =>
        item.replace(/['"],?$/g, '').replace(/^['"]/, '')
      );
    }
  }

  return imports;
}

/**
 * Extract array property from contract string
 * @llm-rule WHEN: Parsing array properties like tests, helpers, publishes
 * @llm-rule AVOID: Strict quote matching - handle various formats flexibly
 * @llm-rule NOTE: Handles multiline arrays with single/double quotes and trailing commas
 */
function extractArrayProperty(contractStr, propertyName) {
  // Match array with flexible spacing and newlines
  const regex = new RegExp(`${propertyName}:\\s*\\[([^\\]]*)\\]`, 's');
  const match = contractStr.match(regex);

  if (!match) return [];

  const content = match[1];

  // Handle both single and double quotes, with optional trailing commas
  const items = content.match(/['"]([^'"]+)['"],?/g);

  if (items) {
    return items.map((item) => {
      // Extract content between quotes and remove trailing comma
      const cleaned = item.replace(/['"],?$/, '').replace(/^['"]/, '');
      return cleaned;
    });
  }

  return [];
}

/**
 * Validate that contract routes have corresponding function exports
 * @llm-rule WHEN: Ensuring contract routes map to actual function implementations
 * @llm-rule AVOID: Missing function validation - causes routing failures
 * @llm-rule NOTE: Checks both function declarations and const exports
 */
function validateRouteImplementations(contract, logicContent, result) {
  const routes = contract.routes || {};

  if (Object.keys(routes).length === 0) {
    result.warnings.push(
      `[${result.feature}/${result.endpoint}] No routes declared in contract`
    );
    return;
  }

  for (const [route, functionName] of Object.entries(routes)) {
    if (!functionName) {
      result.errors.push(
        `[${result.feature}/${result.endpoint}] Route '${route}' has empty function name`
      );
      continue;
    }

    // Check for function export patterns
    const functionRegex = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${functionName}\\s*\\(`
    );
    const constRegex = new RegExp(`export\\s+const\\s+${functionName}\\s*=`);

    const hasExport =
      functionRegex.test(logicContent) || constRegex.test(logicContent);

    if (!hasExport) {
      result.errors.push(
        `[${result.feature}/${result.endpoint}] Route '${route}' → '${functionName}' function not exported in logic file`
      );
    }
  }
}

/**
 * Validate VoilaJSX AppKit imports match contract declarations
 * @llm-rule WHEN: Ensuring contract imports match actual VoilaJSX patterns
 * @llm-rule AVOID: False negatives - if .get() exists, module is implemented
 * @llm-rule NOTE: Validates implementation exists, suggests consistent naming for agents
 */
function validateVoilaJSXImports(contract, logicContent, result) {
  const contractImports = contract.imports || { appkit: [], external: [] };

  // Validate AppKit imports with Class-based pattern
  for (const module of contractImports.appkit) {
    if (!APPKIT_MODULE_MAP[module]) {
      result.warnings.push(
        `[${result.feature}/${result.endpoint}] Unknown AppKit module declared: '${module}'`
      );
      continue;
    }

    const importPath = APPKIT_MODULE_MAP[module];
    const className = `${module}Class`;
    const expectedVariableName = EXPECTED_VARIABLE_NAMES[module];

    // 1. Check for Class-based import
    const classImportPattern = new RegExp(
      `import\\s*{[^}]*${className}[^}]*}\\s*from\\s*['"\`]@voilajsx/appkit/${importPath}['"\`]`
    );
    if (!classImportPattern.test(logicContent)) {
      result.errors.push(
        `[${result.feature}/${result.endpoint}] Missing VoilaJSX import: import { ${className} } from '@voilajsx/appkit/${importPath}'`
      );
      continue;
    }

    // 2. Check if .get() pattern is used (any variable name)
    const anyGetPattern = new RegExp(`${className}\\.get\\(`);
    if (!anyGetPattern.test(logicContent)) {
      result.warnings.push(
        `[${result.feature}/${result.endpoint}] AppKit module '${module}' imported but not initialized with .get() pattern`
      );
      continue;
    }

    // 3. Check for consistent variable naming (suggestion only)
    const expectedGetPattern = new RegExp(
      `const\\s+${expectedVariableName}\\s*=\\s*${className}\\.get\\(`
    );
    if (!expectedGetPattern.test(logicContent)) {
      // Find what variable name they're actually using
      const actualVariableMatch = logicContent.match(
        new RegExp(`const\\s+(\\w+)\\s*=\\s*${className}\\.get\\(`)
      );
      const actualVariable = actualVariableMatch
        ? actualVariableMatch[1]
        : 'unknown';

      result.warnings.push(
        `[${result.feature}/${result.endpoint}] AppKit module '${module}' uses variable '${actualVariable}' - suggest '${expectedVariableName}' for agent consistency`
      );
    }
  }

  // Validate external imports
  for (const module of contractImports.external) {
    const importPattern = new RegExp(`from\\s*['"\`]${module}['"\`]`);
    if (!importPattern.test(logicContent)) {
      result.warnings.push(
        `[${result.feature}/${result.endpoint}] Declared external import '${module}' not found in logic file`
      );
    }
  }
}

/**
 * Validate test implementations match contract test declarations
 * @llm-rule WHEN: Ensuring declared tests are actually implemented
 * @llm-rule AVOID: Missing test validation - breaks test coverage guarantees
 * @llm-rule NOTE: Matches test descriptions between contract and test file
 */
function validateTestImplementations(contract, testContent, result) {
  const contractTests = contract.tests || [];

  if (contractTests.length === 0) {
    result.warnings.push(
      `[${result.feature}/${result.endpoint}] No tests declared in contract`
    );
    return;
  }

  if (!testContent) {
    result.errors.push(
      `[${result.feature}/${result.endpoint}] Contract declares ${contractTests.length} tests but test file missing`
    );
    return;
  }

  // Extract implemented test descriptions
  const implementedTests = extractTestDescriptions(testContent);

  // Check each contract test
  for (const contractTest of contractTests) {
    const testFound = implementedTests.some(
      (implTest) =>
        normalizeTestDescription(implTest) ===
        normalizeTestDescription(contractTest)
    );

    if (!testFound) {
      result.errors.push(
        `[${result.feature}/${result.endpoint}] Contract test not implemented: "${contractTest}"`
      );
    }
  }
}

/**
 * Validate helper files exist and have proper exports
 * @llm-rule WHEN: Ensuring declared helper files exist and are functional
 * @llm-rule AVOID: Missing helper validation - causes import failures
 * @llm-rule NOTE: Validates helper file existence and export patterns
 */
function validateHelperFiles(contract, endpointPath, endpointName, result) {
  const contractHelpers = contract.helpers || [];

  if (contractHelpers.length === 0) return;

  for (const helper of contractHelpers) {
    const helperFile = join(
      endpointPath,
      `${endpointName}.${helper}.helper.ts`
    );

    fileExists(helperFile).then((exists) => {
      if (!exists) {
        result.errors.push(
          `Declared helper file not found: ${endpointName}.${helper}.helper.ts`
        );
      }
    });
  }
}

/**
 * Extract test descriptions from test file content
 * @llm-rule WHEN: Parsing test descriptions for validation
 * @llm-rule AVOID: Complex parsing - use simple regex patterns
 * @llm-rule NOTE: Handles both test() and it() function patterns
 */
function extractTestDescriptions(testContent) {
  const descriptions = [];
  const testRegex = /(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = testRegex.exec(testContent)) !== null) {
    descriptions.push(match[1]);
  }

  return descriptions;
}

/**
 * Normalize test description for comparison
 * @llm-rule WHEN: Comparing test descriptions between contract and implementation
 * @llm-rule AVOID: Strict string matching - normalize for flexibility
 * @llm-rule NOTE: Handles case and whitespace differences
 */
function normalizeTestDescription(description) {
  return description.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Check if file exists without throwing errors
 * @llm-rule WHEN: Verifying file existence before processing
 * @llm-rule AVOID: Assuming files exist - always check first
 * @llm-rule NOTE: Returns boolean for clean conditional logic
 */
async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create standardized error result object
 * @llm-rule WHEN: Creating consistent error result structure
 * @llm-rule AVOID: Inconsistent error formats - use standard structure
 * @llm-rule NOTE: Ensures consistent reporting across all validation types
 */
function createErrorResult(feature, endpoint, errors) {
  return {
    valid: false,
    feature,
    endpoint,
    errors,
    warnings: [],
    routeCount: 0,
    testCount: 0,
    helperCount: 0,
  };
}

/**
 * Report comprehensive validation results
 * @llm-rule WHEN: Displaying validation results to user
 * @llm-rule AVOID: Generic reporting - provide detailed context and metrics
 * @llm-rule NOTE: Shows success/failure counts, performance metrics, and specific issues
 */
function reportValidationResults(validationResults, targetInfo, totalDuration) {
  const totalValidations = validationResults.length;
  const successfulValidations = validationResults.filter((r) => r.valid).length;
  const failedValidations = validationResults.filter((r) => !r.valid);

  // Calculate metrics
  const totalRoutes = validationResults.reduce(
    (sum, r) => sum + (r.routeCount || 0),
    0
  );
  const totalTests = validationResults.reduce(
    (sum, r) => sum + (r.testCount || 0),
    0
  );
  const totalHelpers = validationResults.reduce(
    (sum, r) => sum + (r.helperCount || 0),
    0
  );

  if (failedValidations.length === 0) {
    // Success reporting
    log.human(
      `✅ Contract validation passed for ${targetInfo.description} (${totalDuration}ms)`
    );

    if (totalValidations > 0) {
      log.human(
        `📊 Validated ${totalRoutes} routes across ${totalValidations} contracts`
      );
      if (totalTests > 0)
        log.human(`🧪 Verified ${totalTests} test implementations`);
      if (totalHelpers > 0)
        log.human(`🔧 Checked ${totalHelpers} helper files`);
    }

    // Show warnings if any
    const allWarnings = validationResults.flatMap((r) => r.warnings || []);
    if (allWarnings.length > 0) {
      log.human(`⚠️ ${allWarnings.length} warning(s):`);
      allWarnings.forEach((warning) => log.human(`   ${warning}`));
    }

    return true;
  } else {
    // Failure reporting
    log.human(
      `❌ Contract validation failed for ${targetInfo.description} (${totalDuration}ms)`
    );
    log.human(
      `📊 Results: ${successfulValidations}/${totalValidations} passed`
    );

    // Show first 5 errors
    const allErrors = failedValidations.flatMap((r) => r.errors);
    allErrors.slice(0, 5).forEach((error) => log.human(`   ${error}`));

    if (allErrors.length > 5) {
      log.human(`   ... and ${allErrors.length - 5} more errors`);
    }

    return false;
  }
}
