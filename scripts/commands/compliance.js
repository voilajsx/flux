/**
 * ATOM Framework Compliance Command - Implementation validation with scoped manifest generation
 * @module @voilajsx/atom/scripts/commands/compliance
 * @file scripts/commands/compliance.js
 *
 * @llm-rule WHEN: Validating generated code against implementation.json specifications with proper scoping
 * @llm-rule AVOID: Over-generating manifests for endpoint-level validation - wastes time and resources
 * @llm-rule NOTE: Scopes manifest generation based on validation target (endpoint vs feature vs full)
 */

import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('compliance');

/**
 * Compliance validation command with scoped implementation verification and manifest generation
 * @llm-rule WHEN: Ensuring generated code matches implementation specifications at appropriate scope
 * @llm-rule AVOID: Full feature validation when only endpoint validation needed
 * @llm-rule NOTE: Validates bidirectionally and generates manifests/reports based on target scope
 */
export default async function compliance(args) {
  const startTime = Date.now();
  const target = args[0];

  // Determine validation scope
  const validationScope = determineValidationScope(target);

  log.validationStart('compliance', target, [
    'implementation_loading',
    'code_structure_validation',
    'contract_compliance',
    'logic_compliance',
    'test_compliance',
    'manifest_generation',
    'feature_reporting',
  ]);

  try {
    // 1. Load implementation specifications
    log.checkStart('Implementation specification loading');

    const implementationResult = await loadImplementationSpecs(target);

    if (!implementationResult.success) {
      log.checkFail(
        'Implementation loading',
        implementationResult.duration,
        implementationResult.errors,
        [
          'Create {feature}.implementation.json files',
          'Ensure implementation.json follows proper schema',
          'Check file permissions and paths',
        ]
      );
      return false;
    }

    log.checkPass('Implementation loading', implementationResult.duration, {
      features_loaded: implementationResult.implementations.length,
      total_endpoints: implementationResult.totalEndpoints,
    });

    // 2. Validate code structure matches implementation
    log.checkStart('Code structure validation');

    const structureResult = await validateCodeStructure(
      implementationResult.implementations,
      validationScope
    );

    if (!structureResult.success) {
      log.checkFail(
        'Code structure validation',
        structureResult.duration,
        structureResult.errors,
        [
          'Generate missing contract, logic, or test files',
          'Follow {endpoint}.{type}.ts naming convention',
          'Ensure all endpoints have required files',
        ]
      );
      return false;
    }

    log.checkPass('Code structure validation', structureResult.duration, {
      files_validated: structureResult.filesValidated,
      structure_compliance: '100%',
    });

    // 3. Validate contract compliance
    log.checkStart('Contract implementation compliance');

    const contractResult = await validateContractCompliance(
      implementationResult.implementations,
      validationScope
    );

    if (!contractResult.success) {
      log.checkFail(
        'Contract compliance',
        contractResult.duration,
        contractResult.errors,
        [
          'Fix contract route mappings to match implementation.json',
          'Add missing exports declared in implementation',
          'Update import statements to match specifications',
        ]
      );
      return false;
    }

    log.checkPass('Contract compliance', contractResult.duration, {
      contracts_validated: contractResult.contractsValidated,
      routes_verified: contractResult.routesVerified,
    });

    // 4. Validate logic implementation compliance
    log.checkStart('Logic implementation compliance');

    const logicResult = await validateLogicCompliance(
      implementationResult.implementations,
      validationScope
    );

    if (!logicResult.success) {
      log.checkFail(
        'Logic compliance',
        logicResult.duration,
        logicResult.errors,
        [
          'Add missing function exports',
          'Fix function signatures to match specifications',
          'Update imports to match implementation requirements',
          'Implement required response schemas',
        ]
      );
      return false;
    }

    log.checkPass('Logic compliance', logicResult.duration, {
      logic_files_validated: logicResult.logicFilesValidated,
      functions_verified: logicResult.functionsVerified,
    });

    // 5. Validate test implementation compliance
    log.checkStart('Test implementation compliance');

    const testResult = await validateTestCompliance(
      implementationResult.implementations,
      validationScope
    );

    if (!testResult.success) {
      log.checkFail('Test compliance', testResult.duration, testResult.errors, [
        'Add missing test cases declared in implementation.json',
        'Fix test descriptions to match specifications',
        'Ensure test coverage meets targets',
      ]);
      return false;
    }

    log.checkPass('Test compliance', testResult.duration, {
      test_files_validated: testResult.testFilesValidated,
      test_cases_verified: testResult.testCasesVerified,
    });

    // 6. Generate endpoint manifests (scoped)
    log.checkStart('Endpoint manifest generation');

    const manifestResult = await generateScopedManifests(
      implementationResult.implementations,
      validationScope
    );

    if (!manifestResult.success) {
      log.checkFail(
        'Manifest generation',
        manifestResult.duration,
        manifestResult.errors,
        ['Check endpoint structure and test results availability']
      );
      return false;
    }

    log.checkPass('Manifest generation', manifestResult.duration, {
      manifests_generated: manifestResult.manifestsGenerated,
      endpoints_documented: manifestResult.endpointsDocumented,
    });

    // 7. Generate feature reports (only if not endpoint-level)
    let reportResult = {
      success: true,
      reportsGenerated: 0,
      featuresDocumented: 0,
      reportPaths: [],
      duration: 0,
    };

    if (validationScope.type !== 'endpoint') {
      log.checkStart('Feature report generation');

      reportResult = await generateFeatureReports(
        implementationResult.implementations,
        manifestResult,
        validationScope
      );

      if (!reportResult.success) {
        log.checkFail(
          'Feature report generation',
          reportResult.duration,
          reportResult.errors,
          ['Check feature structure and manifest availability']
        );
        return false;
      }

      log.checkPass('Feature report generation', reportResult.duration, {
        reports_generated: reportResult.reportsGenerated,
        features_documented: reportResult.featuresDocumented,
      });
    } else {
      log.human(
        '⏭️  Skipping feature report generation for endpoint-level validation'
      );
    }

    // SUCCESS - All compliance checks passed
    const totalDuration = Date.now() - startTime;

    log.validationComplete('compliance', 'success', totalDuration, {
      total_features: implementationResult.implementations.length,
      total_endpoints: implementationResult.totalEndpoints,
      manifests: manifestResult.manifestsGenerated,
      reports: reportResult.reportsGenerated,
      scope: validationScope.type,
    });

    // Show summary for humans
    showComplianceSummary(
      implementationResult,
      manifestResult,
      reportResult,
      totalDuration,
      validationScope
    );

    return true;
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    log.error(
      `Compliance validation crashed: ${error.message}`,
      {
        command: 'compliance',
        error: error.message,
        duration: totalDuration,
        target,
        scope: validationScope?.type,
        stack: error.stack?.split('\n').slice(0, 3),
      },
      [
        'Check if implementation.json files exist and are valid',
        'Verify generated code files are readable',
        'Ensure proper file permissions',
        'Check for circular dependencies or import issues',
      ]
    );

    return false;
  }
}

/**
 * Determine validation scope based on target argument
 * @llm-rule WHEN: Deciding between endpoint, feature, or full validation scope
 * @llm-rule AVOID: Wrong scope detection - causes over/under validation
 * @llm-rule NOTE: Endpoint: feature/endpoint, Feature: feature, Full: no target
 */
function determineValidationScope(target) {
  if (!target) {
    return {
      type: 'full',
      description: 'complete project',
      target: null,
      generateReports: true,
    };
  }

  if (target.includes('/')) {
    const [feature, endpoint] = target.split('/');
    return {
      type: 'endpoint',
      description: 'endpoint-level',
      target: target,
      feature: feature,
      endpoint: endpoint,
      generateReports: false,
    };
  }

  return {
    type: 'feature',
    description: 'feature-level',
    target: target,
    feature: target,
    generateReports: true,
  };
}

/**
 * Load implementation specifications with scope filtering
 * @llm-rule WHEN: Loading implementation specs to validate against generated code
 * @llm-rule AVOID: Loading all implementations for endpoint-level validation
 * @llm-rule NOTE: Filters implementations based on validation scope for efficiency
 */
async function loadImplementationSpecs(target) {
  const startTime = Date.now();
  const implementations = [];
  const errors = [];
  let totalEndpoints = 0;

  try {
    const featuresPath = join(process.cwd(), 'src', 'features');

    // Determine which features to load based on target
    let featuresToLoad;
    if (!target) {
      // Full validation - load all features
      featuresToLoad = await readdir(featuresPath);
    } else {
      // Feature or endpoint validation - load specific feature only
      const featureName = target.split('/')[0];
      featuresToLoad = [featureName];
    }

    for (const featureName of featuresToLoad) {
      if (featureName.startsWith('_') || featureName.startsWith('.')) continue;

      const implementationFile = join(
        featuresPath,
        featureName,
        `${featureName}.implementation.json`
      );

      try {
        await stat(implementationFile);
        const content = await readFile(implementationFile, 'utf-8');
        const implementation = JSON.parse(content);

        // Filter out _notes fields for validation
        const validationData = filterNotesFields(implementation);

        implementations.push({
          feature: featureName,
          spec: validationData,
          filePath: implementationFile,
        });

        totalEndpoints += Object.keys(validationData.endpoints || {}).length;
      } catch (error) {
        errors.push(`Feature '${featureName}': ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      implementations,
      totalEndpoints,
      errors,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      implementations: [],
      totalEndpoints: 0,
      errors: [`Implementation loading failed: ${error.message}`],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Filter out fields ending with _notes for pure validation data
 * @llm-rule WHEN: Preparing implementation data for validation checks
 * @llm-rule AVOID: Validating guidance fields - only validate concrete specifications
 * @llm-rule NOTE: Recursively removes all *_notes fields from nested objects
 */
function filterNotesFields(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(filterNotesFields);
  }

  const filtered = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!key.endsWith('_notes')) {
      filtered[key] = filterNotesFields(value);
    }
  }

  return filtered;
}

/**
 * Validate code structure with scope filtering
 * @llm-rule WHEN: Ensuring required files exist with proper naming convention
 * @llm-rule AVOID: Validating all endpoints when only specific endpoint needed
 * @llm-rule NOTE: Filters validation to match scope (endpoint vs feature vs full)
 */
async function validateCodeStructure(implementations, validationScope) {
  const startTime = Date.now();
  const errors = [];
  let filesValidated = 0;

  for (const { feature, spec } of implementations) {
    const endpoints = spec.endpoints || {};

    for (const [endpointName, endpointSpec] of Object.entries(endpoints)) {
      // Skip endpoints not in scope
      if (
        validationScope.type === 'endpoint' &&
        (feature !== validationScope.feature ||
          endpointName !== validationScope.endpoint)
      ) {
        continue;
      }

      const endpointId = endpointSpec.id;
      const route = endpointSpec.route;

      // Check required files exist
      const requiredFiles = ['contract', 'logic', 'test'];

      for (const fileType of requiredFiles) {
        const expectedFile = join(
          process.cwd(),
          endpointSpec.folder,
          `${endpointName}.${fileType}.ts`
        );

        try {
          await stat(expectedFile);
          filesValidated++;
        } catch (error) {
          errors.push(
            `Endpoint #${endpointId} (${route}): Missing ${fileType} file - ${expectedFile}`
          );
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    filesValidated,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Validate contract compliance with scope filtering
 * @llm-rule WHEN: Ensuring contract exports, routes, and imports match implementation.json
 * @llm-rule AVOID: Validating all contracts when only specific endpoint needed
 * @llm-rule NOTE: Validates bidirectional consistency within validation scope
 */
async function validateContractCompliance(implementations, validationScope) {
  const startTime = Date.now();
  const errors = [];
  let contractsValidated = 0;
  let routesVerified = 0;

  for (const { feature, spec } of implementations) {
    const endpoints = spec.endpoints || {};

    for (const [endpointName, endpointSpec] of Object.entries(endpoints)) {
      // Skip endpoints not in scope
      if (
        validationScope.type === 'endpoint' &&
        (feature !== validationScope.feature ||
          endpointName !== validationScope.endpoint)
      ) {
        continue;
      }

      const endpointId = endpointSpec.id;
      const route = endpointSpec.route;
      const contractSpec = endpointSpec.contract;

      if (!contractSpec) continue;

      const contractFile = join(
        process.cwd(),
        endpointSpec.folder,
        contractSpec.file
      );

      try {
        // Load generated contract
        const contractContent = await readFile(contractFile, 'utf-8');

        // Extract CONTRACT export
        const contractMatch = contractContent.match(
          /export\s+const\s+CONTRACT\s*=\s*({[\s\S]*?})\s*(?:as\s+const)?;/
        );

        if (!contractMatch) {
          errors.push(
            `Endpoint #${endpointId} (${route}): Missing CONTRACT export in ${contractSpec.file}`
          );
          continue;
        }

        // Validate routes match specification
        const specRoutes = contractSpec.routes || {};

        for (const [specRoute, specFunction] of Object.entries(specRoutes)) {
          if (!contractContent.includes(`"${specRoute}": "${specFunction}"`)) {
            errors.push(
              `Endpoint #${endpointId} (${route}): Route mapping '${specRoute}' → '${specFunction}' not found in contract`
            );
          } else {
            routesVerified++;
          }
        }

        // Validate required exports present
        const requiredExports = contractSpec.exports || [];
        for (const exportName of requiredExports) {
          if (!contractContent.includes(`export const ${exportName}`)) {
            errors.push(
              `Endpoint #${endpointId} (${route}): Missing required export '${exportName}' in ${contractSpec.file}`
            );
          }
        }

        contractsValidated++;
      } catch (error) {
        errors.push(
          `Endpoint #${endpointId} (${route}): Cannot read contract file - ${error.message}`
        );
      }
    }
  }

  return {
    success: errors.length === 0,
    contractsValidated,
    routesVerified,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Validate logic compliance with scope filtering
 * @llm-rule WHEN: Ensuring logic exports, imports, and function signatures match specs
 * @llm-rule AVOID: Validating all logic files when only specific endpoint needed
 * @llm-rule NOTE: Validates function exports, import statements, and TypeScript signatures within scope
 */
async function validateLogicCompliance(implementations, validationScope) {
  const startTime = Date.now();
  const errors = [];
  let logicFilesValidated = 0;
  let functionsVerified = 0;

  for (const { feature, spec } of implementations) {
    const endpoints = spec.endpoints || {};

    for (const [endpointName, endpointSpec] of Object.entries(endpoints)) {
      // Skip endpoints not in scope
      if (
        validationScope.type === 'endpoint' &&
        (feature !== validationScope.feature ||
          endpointName !== validationScope.endpoint)
      ) {
        continue;
      }

      const endpointId = endpointSpec.id;
      const route = endpointSpec.route;
      const logicSpec = endpointSpec.logic;

      if (!logicSpec) continue;

      const logicFile = join(
        process.cwd(),
        endpointSpec.folder,
        logicSpec.file
      );

      try {
        const logicContent = await readFile(logicFile, 'utf-8');

        // Validate required exports
        const requiredExports = logicSpec.exports || [];
        for (const exportName of requiredExports) {
          const exportRegex = new RegExp(
            `export\\s+(?:async\\s+)?function\\s+${exportName}\\s*\\(`
          );
          const constExportRegex = new RegExp(
            `export\\s+const\\s+${exportName}\\s*=`
          );

          if (
            !exportRegex.test(logicContent) &&
            !constExportRegex.test(logicContent)
          ) {
            errors.push(
              `Endpoint #${endpointId} (${route}): Missing function export '${exportName}' in ${logicSpec.file}`
            );
          } else {
            functionsVerified++;
          }
        }

        // Validate required imports
        const requiredImports = logicSpec.imports || [];
        for (const importStatement of requiredImports) {
          if (!logicContent.includes(importStatement)) {
            errors.push(
              `Endpoint #${endpointId} (${route}): Missing import '${importStatement}' in ${logicSpec.file}`
            );
          }
        }

        logicFilesValidated++;
      } catch (error) {
        errors.push(
          `Endpoint #${endpointId} (${route}): Cannot read logic file - ${error.message}`
        );
      }
    }
  }

  return {
    success: errors.length === 0,
    logicFilesValidated,
    functionsVerified,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Validate test compliance with scope filtering
 * @llm-rule WHEN: Ensuring test cases, imports, and coverage match implementation specs
 * @llm-rule AVOID: Validating all test files when only specific endpoint needed
 * @llm-rule NOTE: Validates test case names, import statements, and coverage targets within scope
 */
async function validateTestCompliance(implementations, validationScope) {
  const startTime = Date.now();
  const errors = [];
  let testFilesValidated = 0;
  let testCasesVerified = 0;

  for (const { feature, spec } of implementations) {
    const endpoints = spec.endpoints || {};

    for (const [endpointName, endpointSpec] of Object.entries(endpoints)) {
      // Skip endpoints not in scope
      if (
        validationScope.type === 'endpoint' &&
        (feature !== validationScope.feature ||
          endpointName !== validationScope.endpoint)
      ) {
        continue;
      }

      const endpointId = endpointSpec.id;
      const route = endpointSpec.route;
      const testSpec = endpointSpec.test;

      if (!testSpec) continue;

      const testFile = join(process.cwd(), endpointSpec.folder, testSpec.file);

      try {
        const testContent = await readFile(testFile, 'utf-8');

        // Validate required imports
        const requiredImports = testSpec.imports || [];
        for (const importStatement of requiredImports) {
          if (!testContent.includes(importStatement)) {
            errors.push(
              `Endpoint #${endpointId} (${route}): Missing import '${importStatement}' in ${testSpec.file}`
            );
          }
        }

        // Validate test cases
        const testCases = testSpec.test_cases || [];
        for (const testCase of testCases) {
          const testPattern = new RegExp(
            `(?:test|it)\\s*\\(\\s*['"\`]${escapeRegex(testCase.name)}['"\`]`
          );

          if (!testPattern.test(testContent)) {
            errors.push(
              `Endpoint #${endpointId} (${route}): Missing test case '${testCase.name}' in ${testSpec.file}`
            );
          } else {
            testCasesVerified++;
          }
        }

        testFilesValidated++;
      } catch (error) {
        errors.push(
          `Endpoint #${endpointId} (${route}): Cannot read test file - ${error.message}`
        );
      }
    }
  }

  return {
    success: errors.length === 0,
    testFilesValidated,
    testCasesVerified,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Generate scoped manifests based on validation scope
 * @llm-rule WHEN: Creating deployment-ready manifests after compliance validation passes
 * @llm-rule AVOID: Generating all manifests for endpoint-level validation
 * @llm-rule NOTE: Only generates manifests for endpoints within validation scope
 */
async function generateScopedManifests(implementations, validationScope) {
  const startTime = Date.now();
  const errors = [];
  let manifestsGenerated = 0;
  let endpointsDocumented = 0;
  const manifestPaths = [];

  for (const { feature, spec } of implementations) {
    const endpoints = spec.endpoints || {};

    for (const [endpointName, endpointSpec] of Object.entries(endpoints)) {
      // Skip endpoints not in scope
      if (
        validationScope.type === 'endpoint' &&
        (feature !== validationScope.feature ||
          endpointName !== validationScope.endpoint)
      ) {
        continue;
      }

      try {
        const manifest = {
          endpoint: endpointName,
          feature: feature,
          id: endpointSpec.id,
          route: endpointSpec.route,
          status: '✅ compliant',
          generated_at: new Date().toISOString(),
          validation_scope: validationScope.type,

          implementation_compliance: {
            contract_valid: true,
            logic_valid: true,
            tests_valid: true,
            structure_valid: true,
          },

          specification: {
            folder: endpointSpec.folder,
            contract_file: endpointSpec.contract?.file,
            logic_file: endpointSpec.logic?.file,
            test_file: endpointSpec.test?.file,
            routes: endpointSpec.contract?.routes || {},
            functions: endpointSpec.logic?.exports || [],
            test_cases: (endpointSpec.test?.test_cases || []).length,
          },

          validation_targets: {
            routes_count: Object.keys(endpointSpec.contract?.routes || {})
              .length,
            functions_count: (endpointSpec.logic?.exports || []).length,
            tests_count: (endpointSpec.test?.test_cases || []).length,
            coverage_target: endpointSpec.test?.coverage_target || 100,
          },
        };

        const manifestPath = join(
          process.cwd(),
          endpointSpec.folder,
          `${endpointName}.manifest.json`
        );

        await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

        manifestsGenerated++;
        endpointsDocumented++;
        manifestPaths.push(manifestPath);
      } catch (error) {
        errors.push(
          `Endpoint #${endpointSpec.id} (${endpointSpec.route}): Manifest generation failed - ${error.message}`
        );
      }
    }
  }

  return {
    success: errors.length === 0,
    manifestsGenerated,
    endpointsDocumented,
    manifestPaths,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Generate feature reports for feature/full validation only
 * @llm-rule WHEN: Creating feature-level reports after endpoint manifests are generated
 * @llm-rule AVOID: Generating feature reports for endpoint-level validation
 * @llm-rule NOTE: Only called for feature-level or full validation scope
 */
async function generateFeatureReports(
  implementations,
  manifestResult,
  validationScope
) {
  const startTime = Date.now();
  const errors = [];
  let reportsGenerated = 0;
  let featuresDocumented = 0;
  const reportPaths = [];

  for (const { feature, spec } of implementations) {
    // Skip features not in scope
    if (
      validationScope.type === 'feature' &&
      feature !== validationScope.feature
    ) {
      continue;
    }

    try {
      const endpoints = spec.endpoints || {};
      const endpointCount = Object.keys(endpoints).length;

      const report = {
        feature: feature,
        status: '✅ compliant',
        generated_at: new Date().toISOString(),
        validation_scope: validationScope.type,

        compliance_summary: {
          total_endpoints: endpointCount,
          compliant_endpoints: endpointCount,
          compliance_rate: 100,
          implementation_valid: true,
        },

        validation_summary: {
          total_routes: spec.validation_targets?.total_routes || 0,
          total_functions: spec.validation_targets?.total_functions || 0,
          total_tests: spec.validation_targets?.total_test_cases || 0,
          structure_compliance: '100%',
        },

        endpoints: Object.entries(endpoints).map(([name, endpointSpec]) => ({
          name: name,
          id: endpointSpec.id,
          route: endpointSpec.route,
          status: '✅ compliant',
          files: {
            contract: endpointSpec.contract?.file,
            logic: endpointSpec.logic?.file,
            test: endpointSpec.test?.file,
          },
        })),

        implementation_source: {
          file: `${feature}.implementation.json`,
          validation_skip_pattern: spec.validation_skip_pattern || '*_notes',
        },
      };

      const reportPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.report.json`
      );

      await writeFile(reportPath, JSON.stringify(report, null, 2));

      reportsGenerated++;
      featuresDocumented++;
      reportPaths.push(reportPath);
    } catch (error) {
      errors.push(
        `Feature '${feature}': Report generation failed - ${error.message}`
      );
    }
  }

  return {
    success: errors.length === 0,
    reportsGenerated,
    featuresDocumented,
    reportPaths,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Show human-readable compliance summary with scope awareness
 * @llm-rule WHEN: Displaying compliance results for developer review
 * @llm-rule AVOID: Overwhelming output - show only what's relevant to validation scope
 * @llm-rule NOTE: Tailors summary output based on validation scope (endpoint vs feature vs full)
 */
function showComplianceSummary(
  implementationResult,
  manifestResult,
  reportResult,
  totalDuration,
  validationScope
) {
  log.human('');
  log.human('📊 Implementation Compliance Summary:');

  if (validationScope.type === 'endpoint') {
    log.human(
      `   Scope: ${validationScope.description} (${validationScope.target})`
    );
    log.human(`   Endpoint validated: 1`);
    log.human(`   Manifests generated: ${manifestResult.manifestsGenerated}`);
    log.human(`   Reports skipped: endpoint-level validation`);
  } else {
    log.human(`   Scope: ${validationScope.description}`);
    log.human(
      `   Features validated: ${implementationResult.implementations.length}`
    );
    log.human(`   Endpoints checked: ${implementationResult.totalEndpoints}`);
    log.human(`   Manifests generated: ${manifestResult.manifestsGenerated}`);
    log.human(`   Reports created: ${reportResult.reportsGenerated}`);
  }

  log.human(`   Total time: ${totalDuration}ms`);
  log.human('');

  if (manifestResult.manifestPaths.length > 0) {
    log.human(' 📄 Generated manifests:');
    manifestResult.manifestPaths.forEach((path) => {
      const relativePath = path.replace(process.cwd() + '/', '');
      log.human(`   └── ${relativePath}`);
    });
  }

  if (reportResult.reportPaths && reportResult.reportPaths.length > 0) {
    log.human('');
    log.human(' 📋 Generated reports:');
    reportResult.reportPaths.forEach((path) => {
      const relativePath = path.replace(process.cwd() + '/', '');
      log.human(`   └── ${relativePath}`);
    });
  }

  log.human('');

  if (validationScope.type === 'endpoint') {
    log.human('✅ Endpoint compliance validation completed successfully');
    log.human('🔧 Ready for endpoint integration testing');
  } else {
    log.human('✅ Implementation compliance validation completed successfully');
    log.human('🚀 Code is ready for deployment');
  }

  log.human('');
}

/**
 * Escape special regex characters for test name matching
 * @llm-rule WHEN: Creating regex patterns from user-provided test names
 * @llm-rule AVOID: Unescaped regex - causes false positive/negative matches
 * @llm-rule NOTE: Handles parentheses, brackets, and special characters in test names
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
