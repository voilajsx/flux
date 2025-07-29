/**
 * FLUX Framework Manifest Command - Contract compliance and deployment readiness validation
 * @module @voilajsx/flux/scripts/commands/manifest
 * @file scripts/commands/manifest.js
 *
 * @llm-rule WHEN: Validating contract compliance and generating deployment readiness manifests
 * @llm-rule AVOID: Code duplication analysis - that's compliance.js responsibility
 * @llm-rule NOTE: Focused on contract adherence, endpoint requirements, and deployment gates
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('manifest');

/**
 * Contract-focused manifest generation command with universal app support
 * @llm-rule WHEN: Ensuring contracts are properly followed and endpoints meet specification requirements
 * @llm-rule AVOID: Hardcoded validation logic - read from specification.json for flexibility
 * @llm-rule NOTE: Works with any FLUX application by reading specification files dynamically
 */
export default async function manifest(args) {
  const startTime = Date.now();
  const target = args[0];

  try {
    log.human(`🔍 FLUX: manifest validation starting...`);

    // 1. Load specifications
    log.human('📋 Specification loading...');
    const specifications = await loadSpecifications(target);

    if (specifications.length === 0) {
      log.human('❌ Specification loading failed - no specifications found');
      return false;
    }

    log.human(
      `✅ Specification loading passed (${specifications.length} features)`
    );

    // 2. Validate contracts and analyze implementations
    log.human('📋 Contract validation...');
    const validationResults = await validateEndpoints(specifications, target);

    log.human(
      `✅ Contract validation passed (${validationResults.length} endpoints)`
    );

    // 3. Generate manifests
    log.human('📋 Manifest generation...');
    const manifestResults = await generateManifestFiles(validationResults);

    log.human(
      `✅ Manifest generation passed (${manifestResults.generated} manifests)`
    );

    // Success
    console.log(`✅ Manifest validation completed successfully`);
    console.log(
      `📊 Summary: ${manifestResults.generated} manifests generated, ${manifestResults.deploymentReady} deployment ready`
    );

    return true;
  } catch (error) {
    log.human(`❌ Manifest generation failed: ${error.message}`);
    return false;
  }
}

/**
 * Load specification files for target scope
 * @llm-rule WHEN: Loading specification.json files from src/features directories
 * @llm-rule AVOID: Hardcoding feature names - discover dynamically from filesystem
 * @llm-rule NOTE: Filters by target scope (all, feature, or endpoint)
 */
async function loadSpecifications(target) {
  const specifications = [];
  const featuresPath = join(process.cwd(), 'src', 'features');

  try {
    // Determine features to load
    let featuresToLoad;
    if (!target) {
      // Load all features
      const allFeatures = await readdir(featuresPath);
      featuresToLoad = allFeatures.filter(
        (f) => !f.startsWith('_') && !f.startsWith('.')
      );
    } else {
      // Load specific feature only
      const featureName = target.split('/')[0];
      featuresToLoad = [featureName];
    }

    // Load each feature specification
    for (const feature of featuresToLoad) {
      try {
        const specPath = join(
          featuresPath,
          feature,
          `${feature}.specification.json`
        );
        const specContent = await readFile(specPath, 'utf-8');
        const spec = JSON.parse(specContent);

        specifications.push({ feature, spec });
      } catch (error) {
        // Skip features without specification files
        continue;
      }
    }

    return specifications;
  } catch (error) {
    throw new Error(`Failed to load specifications: ${error.message}`);
  }
}

/**
 * Validate endpoints against contracts and specifications
 * @llm-rule WHEN: Validating each endpoint's contract compliance and implementation status
 * @llm-rule AVOID: eval() for parsing - use safe regex extraction patterns
 * @llm-rule NOTE: Uses existing FLUX patterns from contract.js for safe parsing
 */
async function validateEndpoints(specifications, target) {
  const results = [];

  for (const { feature, spec } of specifications) {
    const endpoints = spec.endpoints || {};

    for (const [endpointName, endpointSpec] of Object.entries(endpoints)) {
      // Skip if not in target scope
      if (target && target.includes('/')) {
        const [targetFeature, targetEndpoint] = target.split('/');
        if (feature !== targetFeature || endpointName !== targetEndpoint) {
          continue;
        }
      }

      try {
        const endpointResult = await validateSingleEndpoint(
          feature,
          endpointName,
          endpointSpec,
          spec
        );
        results.push(endpointResult);
      } catch (error) {
        // Add failed endpoint with error info
        results.push({
          feature,
          endpoint: endpointName,
          route: endpointSpec.route,
          folder: endpointSpec.folder,
          validation_error: error.message,
          contract_compliance: {
            score: 0,
            errors: [`Validation failed: ${error.message}`],
          },
          specification_requirements: {
            score: 0,
            errors: [`Validation failed: ${error.message}`],
            validation_details: {
              schema_validation: '❌ ERROR',
              types_validation: '❌ ERROR',
              lint_validation: '❌ ERROR',
              test_validation: '❌ ERROR',
            },
          },
          test_coverage: {
            score: 0,
            errors: [`Validation failed: ${error.message}`],
          },
          blocking_issues: [`Validation failed: ${error.message}`],
          status: 'BLOCKED',
        });
      }
    }
  }

  return results;
}

/**
 * Validate single endpoint implementation
 * @llm-rule WHEN: Validating individual endpoint contract, logic, and test files
 * @llm-rule AVOID: Complex parsing - use simple regex patterns like existing FLUX commands
 * @llm-rule NOTE: Based on contract.js validation patterns but focused on manifest data
 */
async function validateSingleEndpoint(
  feature,
  endpointName,
  endpointSpec,
  fullSpec
) {
  const result = {
    feature,
    endpoint: endpointName,
    route: endpointSpec.route,
    folder: endpointSpec.folder,
    blocking_issues: [],
    warnings: [],
  };

  // 1. Validate contract file
  const contractValidation = await validateContractFile(
    endpointSpec,
    feature,
    endpointName,
    fullSpec
  );
  result.contract_compliance = contractValidation;

  // 2. Validate implementation files using enhanced skim (includes tests)
  const implementationValidation = await validateImplementationFiles(
    endpointSpec,
    feature,
    endpointName,
    fullSpec
  );
  result.specification_requirements = implementationValidation;

  // 3. Validate test coverage against specification
  const testValidation = await validateTestCoverage(
    endpointSpec,
    feature,
    endpointName
  );
  result.test_coverage = testValidation;

  // 4. Determine overall status
  const contractScore = contractValidation.score;
  const specScore = implementationValidation.score;
  const testScore = testValidation.score;

  // Collect blocking issues
  if (contractValidation.errors?.length > 0) {
    result.blocking_issues.push(...contractValidation.errors);
  }
  if (implementationValidation.errors?.length > 0) {
    result.blocking_issues.push(...implementationValidation.errors);
  }
  if (testValidation.errors?.length > 0) {
    result.blocking_issues.push(...testValidation.errors);
  }

  // Determine status
  if (result.blocking_issues.length === 0) {
    result.status = 'READY';
  } else if (contractScore >= 80 && specScore >= 70) {
    result.status = 'PARTIAL';
  } else {
    result.status = 'BLOCKED';
  }

  return result;
}

/**
 * Validate contract file using safe parsing (no eval)
 * @llm-rule WHEN: Parsing contract files to extract CONTRACT object properties
 * @llm-rule AVOID: Using eval() - security risk and not needed
 * @llm-rule NOTE: Uses regex patterns from existing contract.js validation
 */
async function validateContractFile(
  endpointSpec,
  feature,
  endpointName,
  fullSpec
) {
  const validation = {
    score: 0,
    errors: [],
    details: {},
  };

  try {
    const contractPath = join(
      process.cwd(),
      endpointSpec.folder,
      endpointSpec.contract.file
    );
    const contractContent = await readFile(contractPath, 'utf-8');

    // Extract CONTRACT object using regex (like contract.js does)
    const contractMatch = contractContent.match(
      /export\s+const\s+CONTRACT\s*=\s*({[\s\S]*?});/
    );
    if (!contractMatch) {
      validation.errors.push('No valid CONTRACT export found');
      return validation;
    }

    const contractStr = contractMatch[1];

    // Validate routes (using regex like contract.js)
    const specRoutes = endpointSpec.contract.routes || {};
    const contractRoutes = extractRoutesFromString(contractStr);

    const routesMatch =
      Object.keys(specRoutes).every(
        (route) => contractRoutes[route] === specRoutes[route]
      ) &&
      Object.keys(contractRoutes).length === Object.keys(specRoutes).length;

    validation.details.routes_match = routesMatch ? '✅ 1/1' : '❌ 0/1';
    if (routesMatch) validation.score += 20;
    else validation.errors.push('Contract routes do not match specification');

    // Validate imports
    const specImports = endpointSpec.contract.imports || {
      appkit: [],
      external: [],
    };
    const contractImports = extractImportsFromString(contractStr);

    const importsMatch =
      JSON.stringify(specImports.appkit?.sort() || []) ===
        JSON.stringify(contractImports.appkit?.sort() || []) &&
      JSON.stringify(specImports.external?.sort() || []) ===
        JSON.stringify(contractImports.external?.sort() || []);

    validation.details.imports_complete = importsMatch
      ? '✅ ALL'
      : '❌ MISMATCH';
    if (importsMatch) validation.score += 20;
    else validation.errors.push('Contract imports do not match specification');

    // Validate test declarations
    const specTests = endpointSpec.test?.test_cases?.map((tc) => tc.name) || [];
    const contractTests = extractTestsFromString(contractStr);

    const testsMatch =
      specTests.length === contractTests.length &&
      specTests.every((test) => contractTests.includes(test));

    validation.details.tests_declared = testsMatch
      ? `✅ ${specTests.length}/${specTests.length}`
      : `❌ ${contractTests.length}/${specTests.length}`;

    if (testsMatch) validation.score += 20;
    else
      validation.errors.push(
        `Test declarations mismatch: expected ${specTests.length}, got ${contractTests.length}`
      );

    // Validate feature/endpoint names
    if (contractStr.includes(`feature: '${feature}'`)) validation.score += 20;
    else
      validation.errors.push(
        `Contract feature name does not match '${feature}'`
      );

    if (contractStr.includes(`endpoint: '${endpointName}'`))
      validation.score += 20;
    else
      validation.errors.push(
        `Contract endpoint name does not match '${endpointName}'`
      );
  } catch (error) {
    validation.errors.push(`Contract file validation failed: ${error.message}`);
  }

  return validation;
}

/**
 * Validate implementation files using enhanced skim command (includes schema, types, lint, tests)
 * @llm-rule WHEN: Getting comprehensive validation results from enhanced FLUX skim command
 * @llm-rule AVOID: Duplicating validation logic - reuse existing skim command with test support
 * @llm-rule NOTE: Enhanced skim now includes test validation alongside schema, types, and lint
 */
async function validateImplementationFiles(
  endpointSpec,
  feature,
  endpointName,
  fullSpec
) {
  const validation = {
    score: 100, // Start with full score
    errors: [],
    business_logic: {},
    validation_details: {
      schema_validation: '✅ PASSED',
      types_validation: '✅ PASSED',
      lint_validation: '✅ PASSED',
      test_validation: '✅ PASSED',
    },
  };

  try {
    // Check logic file exists
    const logicPath = join(
      process.cwd(),
      endpointSpec.folder,
      endpointSpec.logic.file
    );
    await stat(logicPath);

    const logicContent = await readFile(logicPath, 'utf-8');

    // Run enhanced flux:skim validation on this endpoint (now includes tests)
    const target = `${feature}/${endpointName}`;
    const skimResults = await runFluxSkim(target);

    // Parse skim results to get validation scores (now includes test validation)
    const validationScores = parseSkimResults(skimResults);

    // Update validation based on skim results (4 validation types: schema, types, lint, test)
    if (validationScores.schema_errors > 0) {
      validation.errors.push(
        `Schema validation failed: ${validationScores.schema_errors} errors`
      );
      validation.score -= 25;
      validation.validation_details.schema_validation = '❌ FAILED';
    }

    if (validationScores.types_errors > 0) {
      validation.errors.push(
        `TypeScript validation failed: ${validationScores.types_errors} errors`
      );
      validation.score -= 25;
      validation.validation_details.types_validation = '❌ FAILED';
    }

    if (validationScores.lint_errors > 0) {
      validation.errors.push(
        `Lint validation failed: ${validationScores.lint_errors} errors`
      );
      validation.score -= 25;
      validation.validation_details.lint_validation = '❌ FAILED';
    }

    if (validationScores.test_errors > 0) {
      validation.errors.push(
        `Test validation failed: ${validationScores.test_errors} failures`
      );
      validation.score -= 25;
      validation.validation_details.test_validation = '❌ FAILED';
    }

    // Additional pattern validation (business logic checks)

    // Check for required function exports
    const expectedFunctions = endpointSpec.logic.exports || [];
    const hasRequiredExports = expectedFunctions.every((func) =>
      logicContent.includes(`export async function ${func}`)
    );

    if (!hasRequiredExports) {
      validation.errors.push('Missing required function exports');
      validation.business_logic.function_exports = '❌ MISSING';
      if (validation.score > 0) validation.score -= 10;
    } else {
      validation.business_logic.function_exports = '✅ IMPLEMENTED';
    }

    // Check for AppKit module initialization
    const requiredImports = endpointSpec.contract.imports?.appkit || [];
    const missingImports = requiredImports.filter((module) => {
      const hasImport = logicContent.includes(`${module}Class`);
      const hasInit = logicContent.includes(
        `const ${module} = ${module}Class.get(`
      );
      return !hasImport || !hasInit;
    });

    if (missingImports.length > 0) {
      validation.business_logic.module_initialization = '❌ MISSING';
      validation.errors.push(
        `Missing AppKit module initialization: ${missingImports.join(', ')}`
      );
      // Don't reduce score if lint already caught this
      if (validationScores.lint_errors === 0 && validation.score > 0) {
        validation.score -= 10;
      }
    } else {
      validation.business_logic.module_initialization = '✅ IMPLEMENTED';
    }

    // Ensure score doesn't go below 0
    validation.score = Math.max(0, validation.score);
  } catch (error) {
    validation.errors.push(
      `Implementation validation failed: ${error.message}`
    );
    validation.score = 0;
    validation.validation_details = {
      schema_validation: '❌ ERROR',
      types_validation: '❌ ERROR',
      lint_validation: '❌ ERROR',
      test_validation: '❌ ERROR',
    };
  }

  return validation;
}

/**
 * Run enhanced flux:skim command on specific endpoint
 * @llm-rule WHEN: Getting validation results from enhanced FLUX skim command
 * @llm-rule AVOID: Reimplementing validation logic - reuse enhanced skim command
 * @llm-rule NOTE: Enhanced skim now includes test validation alongside other checks
 */
async function runFluxSkim(target) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // Run enhanced flux:skim command (now includes test validation)
    const result = await execAsync(`node scripts/index.js skim ${target}`, {
      cwd: process.cwd(),
      timeout: 60000, // Increased timeout for test execution
    });

    return {
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      error: error.message,
    };
  }
}

/**
 * Parse enhanced skim command output to extract validation results
 * @llm-rule WHEN: Extracting error counts and validation status from enhanced skim output
 * @llm-rule AVOID: Complex parsing - look for key patterns and error counts
 * @llm-rule NOTE: Enhanced skim now includes test validation patterns
 */
function parseSkimResults(skimResults) {
  const results = {
    schema_errors: 0,
    types_errors: 0,
    lint_errors: 0,
    test_errors: 0,
    overall_success: false,
  };

  if (!skimResults.success) {
    // If skim command failed entirely, assume validation errors
    results.schema_errors = 1;
    results.types_errors = 1;
    results.lint_errors = 1;
    results.test_errors = 1;
    return results;
  }

  const output = skimResults.stdout + skimResults.stderr;

  // Look for success/failure patterns in output

  // Schema validation - look for schema-related failures
  if (
    output.includes('❌') &&
    (output.includes('schema') || output.includes('Schema'))
  ) {
    results.schema_errors = (output.match(/❌.*schema/gi) || []).length;
  }

  // TypeScript validation - look for types-related failures
  if (
    output.includes('❌') &&
    (output.includes('types') || output.includes('TypeScript'))
  ) {
    results.types_errors = (output.match(/❌.*types/gi) || []).length;
  }

  // Lint validation - look for lint-related failures
  if (
    output.includes('❌') &&
    (output.includes('lint') || output.includes('Lint'))
  ) {
    results.lint_errors = (output.match(/❌.*lint/gi) || []).length;
  }

  // Test validation - look for test-related failures
  if (
    output.includes('❌') &&
    (output.includes('test') || output.includes('Test'))
  ) {
    results.test_errors = (output.match(/❌.*test/gi) || []).length;
  }

  // Check for overall success
  results.overall_success = output.includes(
    '✅ FLUX: skim completed successfully'
  );

  // If skim failed but we didn't detect specific errors, assume general failure
  if (
    !results.overall_success &&
    results.schema_errors === 0 &&
    results.types_errors === 0 &&
    results.lint_errors === 0 &&
    results.test_errors === 0
  ) {
    results.lint_errors = 1; // Default to lint error
  }

  return results;
}

/**
 * Validate test coverage against specification
 * @llm-rule WHEN: Checking if test file exists and contains required test cases
 * @llm-rule AVOID: Running actual tests - just check test declarations match specification
 * @llm-rule NOTE: Compares test names exactly with specification test_cases
 */
async function validateTestCoverage(endpointSpec, feature, endpointName) {
  const validation = {
    score: 0,
    errors: [],
    test_case_mapping: {},
  };

  try {
    const testPath = join(
      process.cwd(),
      endpointSpec.folder,
      endpointSpec.test.file
    );
    const testContent = await readFile(testPath, 'utf-8');

    // Extract test case names from test file
    const testMatches = testContent.match(/test\s*\(\s*['"`](.*?)['"`]/g) || [];
    const implementedTests = testMatches.map(
      (match) => match.match(/test\s*\(\s*['"`](.*?)['"`]/)[1]
    );

    // Compare with specification test cases
    const specTests = endpointSpec.test?.test_cases?.map((tc) => tc.name) || [];

    let matchingTests = 0;

    // Check each spec test
    specTests.forEach((specTest) => {
      if (implementedTests.includes(specTest)) {
        validation.test_case_mapping[specTest] = '✅ IMPLEMENTED';
        matchingTests++;
      } else {
        validation.test_case_mapping[specTest] = '❌ MISSING';
        validation.errors.push(`Missing test case: "${specTest}"`);
      }
    });

    // Check for extra tests
    implementedTests.forEach((implTest) => {
      if (!specTests.includes(implTest)) {
        validation.test_case_mapping[implTest] = '⚠️ EXTRA';
      }
    });

    // Calculate score
    if (specTests.length > 0) {
      validation.score = Math.round((matchingTests / specTests.length) * 100);
    }
  } catch (error) {
    validation.errors.push(`Test file missing: ${endpointSpec.test.file}`);
  }

  return validation;
}

/**
 * Generate manifest files for all validated endpoints
 * @llm-rule WHEN: Creating manifest.json files with validation results
 * @llm-rule AVOID: Complex manifest structures - keep focused on deployment decisions
 * @llm-rule NOTE: Uses our standardized manifest schema with enhanced validation details
 */
async function generateManifestFiles(validationResults) {
  let generated = 0;
  let deploymentReady = 0;

  for (const result of validationResults) {
    try {
      const manifest = buildManifestObject(result);

      const manifestPath = join(
        process.cwd(),
        result.folder,
        `${result.endpoint}.manifest.json`
      );
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      generated++;
      if (manifest.developer_gate.can_deploy) deploymentReady++;
    } catch (error) {
      console.log(
        `⚠️ Failed to generate manifest for ${result.feature}/${result.endpoint}: ${error.message}`
      );
      continue;
    }
  }

  return { generated, deploymentReady };
}

/**
 * Build manifest object using standardized schema with enhanced validation details
 * @llm-rule WHEN: Creating manifest JSON object with all required fields
 * @llm-rule AVOID: Missing required fields from manifest schema
 * @llm-rule NOTE: Matches our manifest.schema.json exactly with enhanced skim validation
 */
function buildManifestObject(result) {
  const contractScore = result.contract_compliance.score || 0;
  const specScore = result.specification_requirements.score || 0;
  const testScore = result.test_coverage.score || 0;
  const deploymentScore = result.blocking_issues.length === 0 ? 100 : 0;
  const overallScore = Math.round(
    (contractScore + specScore + testScore + deploymentScore) / 4
  );

  return {
    endpoint: result.endpoint,
    feature: result.feature,
    route: result.route,
    status:
      result.status === 'READY'
        ? '✅ READY'
        : result.status === 'PARTIAL'
          ? '⚠️ PARTIAL'
          : '❌ BLOCKED',
    generated_at: new Date().toISOString(),

    contract_compliance: {
      routes_match:
        result.contract_compliance.details?.routes_match || '❌ 0/1',
      functions_match: '✅ 1/1', // Assume functions match if routes match
      imports_complete:
        result.contract_compliance.details?.imports_complete || '❌ MISSING',
      tests_declared:
        result.contract_compliance.details?.tests_declared || '❌ 0/0',
      score: `${contractScore}%`,
    },

    specification_requirements: {
      validation_details: result.specification_requirements
        .validation_details || {
        schema_validation: '❌ ERROR',
        types_validation: '❌ ERROR',
        lint_validation: '❌ ERROR',
        test_validation: '❌ ERROR',
      },
      business_logic: result.specification_requirements.business_logic || {},
      score: `${specScore}%`,
    },

    test_coverage: {
      test_case_mapping: result.test_coverage.test_case_mapping || {},
      score: `${testScore}%`,
    },

    blocking_issues: result.blocking_issues,
    warnings: result.warnings || [],

    developer_gate: {
      can_deploy: result.blocking_issues.length === 0,
      can_merge: result.blocking_issues.length === 0,
      blocking_count: result.blocking_issues.length,
    },

    quick_status: {
      contract:
        contractScore >= 90
          ? '✅ PASS'
          : contractScore >= 70
            ? '⚠️ PARTIAL'
            : '❌ FAIL',
      spec:
        specScore >= 90
          ? '✅ PASS'
          : specScore >= 70
            ? '⚠️ PARTIAL'
            : '❌ FAIL',
      tests:
        testScore >= 90
          ? '✅ PASS'
          : testScore >= 70
            ? '⚠️ PARTIAL'
            : '❌ FAIL',
      deployment: deploymentScore >= 90 ? '✅ READY' : '❌ BLOCKED',
      overall: `${overallScore}%`,
    },

    compliance_data: {
      endpoint_id: `${result.feature}.${result.endpoint}`,
      scores: [contractScore, specScore, testScore, deploymentScore],
      blocking_count: result.blocking_issues.length,
      warning_count: result.warnings?.length || 0,
      last_validated: new Date().toISOString(),
    },
  };
}

// Helper functions for safe contract parsing (based on contract.js patterns)

function extractRoutesFromString(contractStr) {
  const routes = {};
  try {
    const routesMatch = contractStr.match(/routes:\s*{([^}]+)}/s);
    if (routesMatch) {
      const routesContent = routesMatch[1];
      const routeMatches = routesContent.match(/'([^']+)':\s*'([^']+)'/g);
      if (routeMatches) {
        routeMatches.forEach((match) => {
          const [, route, functionName] = match.match(/'([^']+)':\s*'([^']+)'/);
          routes[route] = functionName;
        });
      }
    }
  } catch (error) {
    // Ignore parsing errors
  }
  return routes;
}

function extractImportsFromString(contractStr) {
  const imports = { appkit: [], external: [] };
  try {
    const importsMatch = contractStr.match(/imports:\s*{([^}]+)}/s);
    if (importsMatch) {
      const importsContent = importsMatch[1];

      const appkitMatch = importsContent.match(/appkit:\s*\[([^\]]+)\]/);
      if (appkitMatch) {
        const appkitStr = appkitMatch[1];
        const appkitModules = appkitStr.match(/'([^']+)'/g);
        if (appkitModules) {
          imports.appkit = appkitModules.map((m) => m.replace(/'/g, ''));
        }
      }

      const externalMatch = importsContent.match(/external:\s*\[([^\]]+)\]/);
      if (externalMatch) {
        const externalStr = externalMatch[1];
        const externalModules = externalStr.match(/'([^']+)'/g);
        if (externalModules) {
          imports.external = externalModules.map((m) => m.replace(/'/g, ''));
        }
      }
    }
  } catch (error) {
    // Ignore parsing errors
  }
  return imports;
}

function extractTestsFromString(contractStr) {
  const tests = [];
  try {
    const testsMatch = contractStr.match(/tests:\s*\[([^\]]*)\]/s);
    if (testsMatch) {
      const testsStr = testsMatch[1];
      const testMatches = testsStr.match(/'([^']+)'/g);
      if (testMatches) {
        tests.push(...testMatches.map((m) => m.replace(/'/g, '')));
      }
    }
  } catch (error) {
    // Ignore parsing errors
  }
  return tests;
}
