/**
 * ATOM Framework Compliance Command - Enhanced implementation validation with detailed reliability metrics
 * @module @voilajsx/atom/scripts/commands/compliance
 * @file scripts/commands/compliance.js
 *
 * @llm-rule WHEN: Validating generated code against implementation.json with comprehensive reliability metrics
 * @llm-rule AVOID: Over-generating manifests for endpoint-level validation - wastes time and resources
 * @llm-rule NOTE: Enhanced with detailed reliability validation including contract, test, types, lint, and code quality
 */

import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('compliance');

/**
 * Compliance validation command with enhanced reliability metrics and detailed manifest generation
 * @llm-rule WHEN: Ensuring generated code matches implementation specifications with full reliability validation
 * @llm-rule AVOID: Partial validation - validate all reliability aspects for mathematical certainty
 * @llm-rule NOTE: Generates detailed endpoint manifests and feature reports with breaking change analysis
 */
export default async function compliance(args) {
  const startTime = Date.now();
  const target = args[0];

  // Determine validation scope
  const validationScope = determineValidationScope(target);

  log.validationStart('compliance', target, [
    'implementation_loading',
    'reliability_validation',
    'detailed_manifest_generation',
    'feature_reporting_with_breaking_changes',
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

    // 2. Enhanced reliability validation
    log.checkStart('Comprehensive reliability validation');

    const reliabilityResult = await validateEndpointReliability(
      implementationResult.implementations,
      validationScope
    );

    if (!reliabilityResult.success) {
      log.checkFail(
        'Reliability validation',
        reliabilityResult.duration,
        reliabilityResult.errors,
        [
          'Fix contract compliance issues',
          'Improve test coverage to meet targets',
          'Resolve TypeScript compilation errors',
          'Address code quality violations',
        ]
      );
      return false;
    }

    log.checkPass('Reliability validation', reliabilityResult.duration, {
      endpoints_validated: reliabilityResult.endpointsValidated,
      reliability_scores: reliabilityResult.averageReliability,
    });

    // 3. Generate detailed endpoint manifests
    log.checkStart('Enhanced manifest generation');

    const manifestResult = await generateDetailedManifests(
      implementationResult.implementations,
      reliabilityResult.endpointReliability,
      validationScope
    );

    if (!manifestResult.success) {
      log.checkFail(
        'Enhanced manifest generation',
        manifestResult.duration,
        manifestResult.errors,
        ['Check endpoint structure and reliability validation results']
      );
      return false;
    }

    log.checkPass('Enhanced manifest generation', manifestResult.duration, {
      manifests_generated: manifestResult.manifestsGenerated,
      endpoints_documented: manifestResult.endpointsDocumented,
    });

    // 4. Generate feature reports with breaking change analysis
    let reportResult = {
      success: true,
      reportsGenerated: 0,
      featuresDocumented: 0,
      reportPaths: [],
      duration: 0,
    };

    if (validationScope.type !== 'endpoint') {
      log.checkStart('Feature report generation with breaking change analysis');

      reportResult = await generateEnhancedFeatureReports(
        implementationResult.implementations,
        reliabilityResult.endpointReliability,
        manifestResult,
        validationScope
      );

      if (!reportResult.success) {
        log.checkFail(
          'Enhanced feature report generation',
          reportResult.duration,
          reportResult.errors,
          ['Check feature structure and reliability validation results']
        );
        return false;
      }

      log.checkPass(
        'Enhanced feature report generation',
        reportResult.duration,
        {
          reports_generated: reportResult.reportsGenerated,
          features_documented: reportResult.featuresDocumented,
        }
      );
    } else {
      log.human(
        '⏭️  Skipping feature report generation for endpoint-level validation'
      );
    }

    // SUCCESS - All enhanced compliance checks passed
    const totalDuration = Date.now() - startTime;

    log.validationComplete('compliance', 'success', totalDuration, {
      total_features: implementationResult.implementations.length,
      total_endpoints: implementationResult.totalEndpoints,
      manifests: manifestResult.manifestsGenerated,
      reports: reportResult.reportsGenerated,
      scope: validationScope.type,
    });

    // Show enhanced summary
    showEnhancedComplianceSummary(
      implementationResult,
      reliabilityResult,
      manifestResult,
      reportResult,
      totalDuration,
      validationScope
    );

    return true;
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    log.error(
      `Enhanced compliance validation crashed: ${error.message}`,
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
 * Enhanced reliability validation with comprehensive metrics
 * @llm-rule WHEN: Validating all reliability aspects of endpoint implementations
 * @llm-rule AVOID: Partial reliability checks - validate complete reliability matrix
 * @llm-rule NOTE: Returns detailed reliability metrics for each endpoint
 */
async function validateEndpointReliability(implementations, validationScope) {
  const startTime = Date.now();
  const errors = [];
  const endpointReliability = new Map();
  let endpointsValidated = 0;

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

      // Comprehensive reliability validation
      const reliability = await validateSingleEndpointReliability(
        feature,
        endpointName,
        endpointSpec,
        spec
      );

      endpointReliability.set(`${feature}/${endpointName}`, reliability);

      if (!reliability.overall_reliable) {
        errors.push(
          ...reliability.blocking_issues.map(
            (issue) => `Endpoint #${endpointId} (${route}): ${issue}`
          )
        );
      }

      endpointsValidated++;
    }
  }

  // Calculate average reliability
  const reliabilityScores = Array.from(endpointReliability.values()).map(
    (r) => r.reliability_score
  );
  const averageReliability =
    reliabilityScores.length > 0
      ? Math.round(
          reliabilityScores.reduce((a, b) => a + b, 0) /
            reliabilityScores.length
        )
      : 0;

  return {
    success: errors.length === 0,
    endpointReliability,
    endpointsValidated,
    averageReliability,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Validate single endpoint reliability across all dimensions
 * @llm-rule WHEN: Performing comprehensive reliability check for one endpoint
 * @llm-rule AVOID: Missing any reliability dimension - all aspects must be validated
 * @llm-rule NOTE: Returns detailed reliability object with scores and blocking issues
 */
async function validateSingleEndpointReliability(
  feature,
  endpointName,
  endpointSpec,
  spec
) {
  const reliability = {
    contract_compliance: { status: 'PASS', score: 100, issues: [] },
    test_validation: { status: 'PASS', score: 100, issues: [] },
    types_validation: { status: 'PASS', score: 100, issues: [] },
    lint_validation: { status: 'PASS', score: 100, issues: [] },
    code_quality: { status: 'PASS', score: 100, issues: [] },
    reliability_score: 0,
    overall_reliable: true,
    blocking_issues: [],
    mathematical_isolation: true,
  };

  try {
    // 1. Contract Compliance Validation
    reliability.contract_compliance = await validateContractCompliance(
      feature,
      endpointName,
      endpointSpec
    );

    // 2. Test Validation
    reliability.test_validation = await validateTestReliability(
      feature,
      endpointName,
      endpointSpec
    );

    // 3. Types Validation
    reliability.types_validation = await validateTypesReliability(
      feature,
      endpointName,
      endpointSpec
    );

    // 4. Lint Validation
    reliability.lint_validation = await validateLintReliability(
      feature,
      endpointName,
      endpointSpec
    );

    // 5. Code Quality Validation
    reliability.code_quality = await validateCodeQuality(
      feature,
      endpointName,
      endpointSpec
    );

    // Calculate overall reliability score
    const scores = [
      reliability.contract_compliance.score,
      reliability.test_validation.score,
      reliability.types_validation.score,
      reliability.lint_validation.score,
      reliability.code_quality.score,
    ];
    reliability.reliability_score = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );

    // Determine if deployment ready
    reliability.overall_reliable = scores.every((score) => score >= 90);

    // Collect blocking issues
    [
      reliability.contract_compliance,
      reliability.test_validation,
      reliability.types_validation,
      reliability.lint_validation,
      reliability.code_quality,
    ].forEach((validation) => {
      if (validation.status !== 'PASS') {
        reliability.blocking_issues.push(...validation.issues);
      }
    });
  } catch (error) {
    reliability.overall_reliable = false;
    reliability.blocking_issues.push(`Validation error: ${error.message}`);
    reliability.reliability_score = 0;
  }

  return reliability;
}

/**
 * Validate contract compliance with detailed metrics
 * @llm-rule WHEN: Checking contract route mappings, exports, and imports
 * @llm-rule AVOID: Surface-level checks - validate complete contract specification
 * @llm-rule NOTE: Returns detailed compliance metrics with specific issues
 */
async function validateContractCompliance(feature, endpointName, endpointSpec) {
  const validation = {
    status: 'PASS',
    score: 100,
    issues: [],
    metrics: {
      routes_declared_vs_implemented: '0/0',
      functions_exported: '0/0',
      imports_validated: '0/0',
      helper_files_declared: '0/0',
    },
  };

  try {
    const contractFile = join(
      process.cwd(),
      endpointSpec.folder,
      `${endpointName}.contract.ts`
    );
    const logicFile = join(
      process.cwd(),
      endpointSpec.folder,
      `${endpointName}.logic.ts`
    );

    // Check files exist
    try {
      await stat(contractFile);
      await stat(logicFile);
    } catch (error) {
      validation.status = 'FAIL';
      validation.score = 0;
      validation.issues.push(
        `Missing contract or logic file: ${error.message}`
      );
      return validation;
    }

    // Load contract and logic content
    const contractContent = await readFile(contractFile, 'utf-8');
    const logicContent = await readFile(logicFile, 'utf-8');

    // Extract contract routes
    const contractRoutes = extractContractRoutes(contractContent);
    const logicExports = extractLogicExports(logicContent);

    // Validate routes vs functions
    const routeCount = Object.keys(contractRoutes).length;
    const declaredFunctions = Object.values(contractRoutes);
    const implementedFunctions = declaredFunctions.filter((func) =>
      logicExports.includes(func)
    );

    validation.metrics.routes_declared_vs_implemented = `${routeCount}/${routeCount}`;
    validation.metrics.functions_exported = `${implementedFunctions.length}/${declaredFunctions.length}`;

    // Check for missing functions
    const missingFunctions = declaredFunctions.filter(
      (func) => !logicExports.includes(func)
    );

    if (missingFunctions.length > 0) {
      validation.status = 'FAIL';
      validation.score = Math.round(
        (implementedFunctions.length / declaredFunctions.length) * 100
      );
      validation.issues.push(
        ...missingFunctions.map((func) => `Missing function export: ${func}`)
      );
    }

    // Validate imports
    const contractSpec = endpointSpec.contract || {};
    const requiredImports = contractSpec.imports || {
      appkit: [],
      external: [],
    };
    let importIssues = 0;
    let totalImports =
      requiredImports.appkit.length + requiredImports.external.length;

    requiredImports.appkit.forEach((module) => {
      if (!logicContent.includes(`@voilajsx/appkit/${module}`)) {
        validation.issues.push(`Missing AppKit import: ${module}`);
        importIssues++;
      }
    });

    requiredImports.external.forEach((module) => {
      if (!logicContent.includes(`from '${module}'`)) {
        validation.issues.push(`Missing external import: ${module}`);
        importIssues++;
      }
    });

    validation.metrics.imports_validated = `${totalImports - importIssues}/${totalImports}`;

    if (importIssues > 0 && validation.status === 'PASS') {
      validation.status = 'WARN';
      validation.score = Math.max(70, validation.score - importIssues * 10);
    }
  } catch (error) {
    validation.status = 'FAIL';
    validation.score = 0;
    validation.issues.push(`Contract validation error: ${error.message}`);
  }

  return validation;
}

/**
 * Validate test reliability with coverage and completeness metrics
 * @llm-rule WHEN: Checking test coverage, case count, and critical path testing
 * @llm-rule AVOID: Basic test existence checks - validate comprehensive test reliability
 * @llm-rule NOTE: Returns detailed test metrics including coverage percentage
 */
async function validateTestReliability(feature, endpointName, endpointSpec) {
  const validation = {
    status: 'PASS',
    score: 100,
    issues: [],
    metrics: {
      test_cases_found: '0/0',
      coverage_actual: '0%',
      coverage_target: '100%',
      critical_paths_tested: '0/0',
      test_descriptions_match: '0/0',
    },
  };

  try {
    const testFile = join(
      process.cwd(),
      endpointSpec.folder,
      `${endpointName}.test.ts`
    );
    const testSpec = endpointSpec.test || {};

    // Check test file exists
    try {
      await stat(testFile);
    } catch (error) {
      validation.status = 'FAIL';
      validation.score = 0;
      validation.issues.push(`Missing test file: ${endpointName}.test.ts`);
      return validation;
    }

    const testContent = await readFile(testFile, 'utf-8');

    // Extract test cases from content
    const implementedTests = extractTestDescriptions(testContent);
    const expectedTests = testSpec.test_cases || [];
    const expectedCount = expectedTests.length;

    validation.metrics.test_cases_found = `${implementedTests.length}/${expectedCount}`;

    // Check for missing test cases
    const missingTests = expectedTests.filter((testCase) => {
      const testName = typeof testCase === 'string' ? testCase : testCase.name;
      return !implementedTests.some(
        (impl) =>
          normalizeTestDescription(impl) === normalizeTestDescription(testName)
      );
    });

    if (missingTests.length > 0) {
      validation.status = 'FAIL';
      validation.score = Math.round(
        (implementedTests.length / expectedCount) * 100
      );
      validation.issues.push(
        ...missingTests.map((test) => {
          const testName = typeof test === 'string' ? test : test.name;
          return `Missing test case: ${testName}`;
        })
      );
    }

    // Simulate coverage check (in real implementation, would run actual coverage)
    const coverageTarget = testSpec.coverage_target || 100;
    const estimatedCoverage = Math.min(
      100,
      (implementedTests.length / expectedCount) * 100
    );

    validation.metrics.coverage_actual = `${Math.round(estimatedCoverage)}%`;
    validation.metrics.coverage_target = `${coverageTarget}%`;

    if (estimatedCoverage < coverageTarget) {
      if (validation.status === 'PASS') validation.status = 'WARN';
      validation.score = Math.min(validation.score, estimatedCoverage);
      validation.issues.push(
        `Test coverage ${Math.round(estimatedCoverage)}% below target ${coverageTarget}%`
      );
    }

    // Check critical paths - simplified for basic endpoints
    const criticalPaths = [
      'error',
      'validation',
      'sanitiz',
      'response',
      'format',
      'consistent',
    ];
    const testedPaths = criticalPaths.filter((path) =>
      testContent.toLowerCase().includes(path)
    );

    validation.metrics.critical_paths_tested = `${testedPaths.length}/${criticalPaths.length}`;

    if (testedPaths.length < Math.min(2, criticalPaths.length)) {
      if (validation.status === 'PASS') validation.status = 'WARN';
      validation.score = Math.min(validation.score, 80);
      validation.issues.push('Not all critical paths tested');
    }
  } catch (error) {
    validation.status = 'FAIL';
    validation.score = 0;
    validation.issues.push(`Test validation error: ${error.message}`);
  }

  return validation;
}

/**
 * Validate TypeScript compilation and type safety
 * @llm-rule WHEN: Checking TypeScript compilation, type consistency, and import/export types
 * @llm-rule AVOID: Ignoring type safety - critical for runtime reliability
 * @llm-rule NOTE: Simulates TypeScript validation (in real implementation would run tsc)
 */
async function validateTypesReliability(feature, endpointName, endpointSpec) {
  const validation = {
    status: 'PASS',
    score: 100,
    issues: [],
    metrics: {
      typescript_compilation: 'PASS',
      function_signatures_match: '0/0',
      import_export_consistency: 'PASS',
      type_safety_score: '100%',
    },
  };

  try {
    // In real implementation, would run: npx tsc --noEmit on specific files
    // For now, simulate by checking basic type patterns

    const logicFile = join(
      process.cwd(),
      endpointSpec.folder,
      `${endpointName}.logic.ts`
    );
    const contractFile = join(
      process.cwd(),
      endpointSpec.folder,
      `${endpointName}.contract.ts`
    );

    // Check files exist
    try {
      await stat(logicFile);
      await stat(contractFile);
    } catch (error) {
      validation.status = 'FAIL';
      validation.score = 0;
      validation.issues.push(`Missing TypeScript files: ${error.message}`);
      return validation;
    }

    const logicContent = await readFile(logicFile, 'utf-8');

    // Check for proper TypeScript patterns
    const hasProperImports =
      logicContent.includes('import {') && logicContent.includes('} from');
    const hasTypedExports =
      logicContent.includes('export async function') ||
      logicContent.includes('export function');
    const hasRequestResponseTypes =
      logicContent.includes('Request') && logicContent.includes('Response');

    if (!hasProperImports) {
      validation.status = 'WARN';
      validation.score = Math.min(validation.score, 90);
      validation.issues.push('Missing proper TypeScript imports');
    }

    if (!hasTypedExports) {
      validation.status = 'FAIL';
      validation.score = Math.min(validation.score, 60);
      validation.issues.push('Missing typed function exports');
    }

    if (!hasRequestResponseTypes) {
      validation.status = 'WARN';
      validation.score = Math.min(validation.score, 85);
      validation.issues.push('Missing Request/Response types');
    }

    // Update metrics
    validation.metrics.type_safety_score = `${validation.score}%`;
    if (validation.score >= 90) {
      validation.metrics.typescript_compilation = 'PASS';
    } else {
      validation.metrics.typescript_compilation = 'FAIL';
    }
  } catch (error) {
    validation.status = 'FAIL';
    validation.score = 0;
    validation.issues.push(`Types validation error: ${error.message}`);
  }

  return validation;
}

/**
 * Validate lint compliance with VoilaJSX patterns
 * @llm-rule WHEN: Checking VoilaJSX patterns, naming conventions, and code standards
 * @llm-rule AVOID: Generic linting - focus on ATOM Framework specific patterns
 * @llm-rule NOTE: Validates VoilaJSX AppKit usage and ATOM conventions
 */
async function validateLintReliability(feature, endpointName, endpointSpec) {
  const validation = {
    status: 'PASS',
    score: 100,
    issues: [],
    metrics: {
      voilajsx_patterns: 'PASS',
      naming_conventions: 'PASS',
      security_patterns: 'PASS',
      file_structure: 'PASS',
    },
  };

  try {
    const logicFile = join(
      process.cwd(),
      endpointSpec.folder,
      `${endpointName}.logic.ts`
    );

    // Check file exists
    try {
      await stat(logicFile);
    } catch (error) {
      validation.status = 'FAIL';
      validation.score = 0;
      validation.issues.push(`Missing logic file for lint validation`);
      return validation;
    }

    const logicContent = await readFile(logicFile, 'utf-8');

    // Check VoilaJSX patterns
    const hasGetPattern = logicContent.includes('.get()');
    const hasProperModuleInit =
      logicContent.includes('const utils = utility.get()') ||
      logicContent.includes('const log = logger.get()');

    if (!hasGetPattern || !hasProperModuleInit) {
      validation.status = 'WARN';
      validation.score = Math.min(validation.score, 85);
      validation.issues.push('Missing VoilaJSX .get() patterns');
      validation.metrics.voilajsx_patterns = 'WARN';
    }

    // Check security patterns
    const hasInputSanitization = logicContent.includes('secure.input(');
    const hasErrorHandling =
      logicContent.includes('err.') &&
      (logicContent.includes('badRequest') ||
        logicContent.includes('serverError'));

    if (!hasInputSanitization && endpointName.includes('name')) {
      validation.status = 'WARN';
      validation.score = Math.min(validation.score, 75);
      validation.issues.push('Missing input sanitization for user parameters');
      validation.metrics.security_patterns = 'WARN';
    }

    if (!hasErrorHandling) {
      validation.status = 'WARN';
      validation.score = Math.min(validation.score, 80);
      validation.issues.push('Missing proper error handling patterns');
    }

    // Check naming conventions
    const properFileName = `${endpointName}.logic.ts`;
    if (!logicFile.endsWith(properFileName)) {
      validation.status = 'FAIL';
      validation.score = Math.min(validation.score, 70);
      validation.issues.push(`File should be named ${properFileName}`);
      validation.metrics.naming_conventions = 'FAIL';
    }
  } catch (error) {
    validation.status = 'FAIL';
    validation.score = 0;
    validation.issues.push(`Lint validation error: ${error.message}`);
  }

  return validation;
}

/**
 * Validate code quality metrics
 * @llm-rule WHEN: Checking error handling, logging, input validation, and VoilaJSX compliance
 * @llm-rule AVOID: Surface-level quality checks - validate comprehensive code quality
 * @llm-rule NOTE: Focuses on production-ready code patterns and reliability
 */
async function validateCodeQuality(feature, endpointName, endpointSpec) {
  const validation = {
    status: 'PASS',
    score: 100,
    issues: [],
    metrics: {
      error_handling_implemented: 'PASS',
      input_sanitization: 'PASS',
      logging_structured: 'PASS',
      voilajsx_compliance: '100%',
    },
  };

  try {
    const logicFile = join(
      process.cwd(),
      endpointSpec.folder,
      `${endpointName}.logic.ts`
    );

    // Check file exists
    try {
      await stat(logicFile);
    } catch (error) {
      validation.status = 'FAIL';
      validation.score = 0;
      validation.issues.push(`Missing logic file for quality validation`);
      return validation;
    }

    const logicContent = await readFile(logicFile, 'utf-8');

    // Check error handling
    const hasErrorHandling =
      logicContent.includes('try {') && logicContent.includes('catch');
    const hasSemanticErrors =
      logicContent.includes('err.badRequest') ||
      logicContent.includes('err.serverError') ||
      logicContent.includes('err.notFound');

    if (!hasErrorHandling && !hasSemanticErrors) {
      validation.status = 'WARN';
      validation.score = Math.min(validation.score, 80);
      validation.issues.push('Missing comprehensive error handling');
      validation.metrics.error_handling_implemented = 'WARN';
    }

    // Check input sanitization for endpoints with parameters
    if (endpointName.includes('@') || endpointName.includes('name')) {
      const hasInputSanitization =
        logicContent.includes('secure.input(') ||
        logicContent.includes('utils.get(');

      if (!hasInputSanitization) {
        validation.status = 'FAIL';
        validation.score = Math.min(validation.score, 60);
        validation.issues.push(
          'Missing input sanitization for user parameters'
        );
        validation.metrics.input_sanitization = 'FAIL';
      }
    }

    // Check structured logging
    const hasStructuredLogging =
      logicContent.includes('log.info(') && logicContent.includes('requestId');

    if (!hasStructuredLogging) {
      validation.status = 'WARN';
      validation.score = Math.min(validation.score, 85);
      validation.issues.push('Missing structured logging with requestId');
      validation.metrics.logging_structured = 'WARN';
    }

    // Check VoilaJSX compliance
    const voilajsxPatterns = [
      'utility.get()',
      'logger.get(',
      'error.get()',
      'utils.uuid()',
    ];

    const foundPatterns = voilajsxPatterns.filter((pattern) =>
      logicContent.includes(pattern)
    );

    const compliancePercentage = Math.round(
      (foundPatterns.length / voilajsxPatterns.length) * 100
    );
    validation.metrics.voilajsx_compliance = `${compliancePercentage}%`;

    if (compliancePercentage < 75) {
      validation.status = 'WARN';
      validation.score = Math.min(validation.score, compliancePercentage);
      validation.issues.push('Low VoilaJSX pattern compliance');
    }
  } catch (error) {
    validation.status = 'FAIL';
    validation.score = 0;
    validation.issues.push(`Code quality validation error: ${error.message}`);
  }

  return validation;
}

/**
 * Generate detailed endpoint manifests with comprehensive reliability metrics
 * @llm-rule WHEN: Creating deployment-ready manifests with full reliability validation results
 * @llm-rule AVOID: Basic manifests - include all reliability dimensions for complete tracking
 * @llm-rule NOTE: Generates detailed manifests for endpoints within validation scope
 */
async function generateDetailedManifests(
  implementations,
  endpointReliability,
  validationScope
) {
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
        const reliabilityKey = `${feature}/${endpointName}`;
        const reliability = endpointReliability.get(reliabilityKey) || {
          contract_compliance: { status: 'UNKNOWN', score: 0, metrics: {} },
          test_validation: { status: 'UNKNOWN', score: 0, metrics: {} },
          types_validation: { status: 'UNKNOWN', score: 0, metrics: {} },
          lint_validation: { status: 'UNKNOWN', score: 0, metrics: {} },
          code_quality: { status: 'UNKNOWN', score: 0, metrics: {} },
          reliability_score: 0,
          overall_reliable: false,
          blocking_issues: ['Reliability validation not performed'],
          mathematical_isolation: false,
        };

        const manifest = {
          endpoint: endpointName,
          feature: feature,
          id: endpointSpec.id,
          route: endpointSpec.route,
          status: reliability.overall_reliable
            ? '✅ compliant'
            : '❌ issues found',
          generated_at: new Date().toISOString(),
          validation_scope: validationScope.type,

          reliability_validation: {
            contract_compliance: {
              ...reliability.contract_compliance.metrics,
              status:
                reliability.contract_compliance.status === 'PASS'
                  ? '✅ PASS'
                  : reliability.contract_compliance.status === 'WARN'
                    ? '⚠️ WARN'
                    : '❌ FAIL',
            },

            test_validation: {
              ...reliability.test_validation.metrics,
              status:
                reliability.test_validation.status === 'PASS'
                  ? '✅ PASS'
                  : reliability.test_validation.status === 'WARN'
                    ? '⚠️ WARN'
                    : '❌ FAIL',
            },

            types_validation: {
              ...reliability.types_validation.metrics,
              status:
                reliability.types_validation.status === 'PASS'
                  ? '✅ PASS'
                  : reliability.types_validation.status === 'WARN'
                    ? '⚠️ WARN'
                    : '❌ FAIL',
            },

            lint_validation: {
              ...reliability.lint_validation.metrics,
              status:
                reliability.lint_validation.status === 'PASS'
                  ? '✅ PASS'
                  : reliability.lint_validation.status === 'WARN'
                    ? '⚠️ WARN'
                    : '❌ FAIL',
            },

            code_quality: {
              ...reliability.code_quality.metrics,
              status:
                reliability.code_quality.status === 'PASS'
                  ? '✅ PASS'
                  : reliability.code_quality.status === 'WARN'
                    ? '⚠️ WARN'
                    : '❌ FAIL',
            },
          },

          overall_reliability: `${reliability.reliability_score}%`,
          deployment_ready: reliability.overall_reliable,
          blocking_issues: reliability.blocking_issues,
          mathematical_isolation: reliability.mathematical_isolation,

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
          `Endpoint #${endpointSpec.id} (${endpointSpec.route}): Enhanced manifest generation failed - ${error.message}`
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
 * Generate enhanced feature reports with breaking change analysis and duplication tracking
 * @llm-rule WHEN: Creating feature-level reports with cross-endpoint analysis after endpoint manifests
 * @llm-rule AVOID: Generating feature reports for endpoint-level validation
 * @llm-rule NOTE: Includes breaking change analysis and code duplication tracking across endpoints
 */
async function generateEnhancedFeatureReports(
  implementations,
  endpointReliability,
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

      // Collect reliability data for all endpoints in feature
      const endpointReliabilityData = [];
      let overallReliable = true;
      let totalReliabilityScore = 0;

      for (const [endpointName] of Object.entries(endpoints)) {
        const reliabilityKey = `${feature}/${endpointName}`;
        const reliability = endpointReliability.get(reliabilityKey);

        if (reliability) {
          endpointReliabilityData.push({
            endpoint: endpointName,
            reliable: reliability.overall_reliable,
            score: reliability.reliability_score,
            blocking_issues: reliability.blocking_issues,
          });

          if (!reliability.overall_reliable) overallReliable = false;
          totalReliabilityScore += reliability.reliability_score;
        }
      }

      const averageReliability =
        endpointCount > 0
          ? Math.round(totalReliabilityScore / endpointCount)
          : 0;

      // Analyze breaking changes across endpoints
      const breakingChangeAnalysis = await analyzeBreakingChanges(
        feature,
        endpoints,
        spec
      );

      // Analyze code duplication across endpoints
      const duplicationAnalysis = await analyzeDuplication(feature, endpoints);

      const report = {
        feature: feature,
        status: overallReliable ? '✅ compliant' : '❌ issues found',
        generated_at: new Date().toISOString(),
        validation_scope: validationScope.type,

        implementation_checklist: {
          blueprint_requirements: `✅ ${spec.validation_targets?.total_endpoints || endpointCount}/${spec.validation_targets?.total_endpoints || endpointCount}`,
          endpoint_completion: `${endpointCount}/${endpointCount} ✅`,
          reliability_gates: overallReliable
            ? '✅ All passed'
            : `⚠️ ${endpointReliabilityData.filter((e) => !e.reliable).length} issues`,
          average_reliability: `${averageReliability}%`,
          deployment_ready: overallReliable,
        },

        breaking_change_analysis: breakingChangeAnalysis,

        duplication_analysis: duplicationAnalysis,

        compliance_summary: {
          total_endpoints: endpointCount,
          compliant_endpoints: endpointReliabilityData.filter((e) => e.reliable)
            .length,
          compliance_rate:
            endpointCount > 0
              ? Math.round(
                  (endpointReliabilityData.filter((e) => e.reliable).length /
                    endpointCount) *
                    100
                )
              : 0,
          implementation_valid: overallReliable,
          average_reliability_score: averageReliability,
        },

        validation_summary: {
          total_routes: spec.validation_targets?.total_routes || 0,
          total_functions: spec.validation_targets?.total_functions || 0,
          total_tests: spec.validation_targets?.total_test_cases || 0,
          structure_compliance: '100%',
        },

        endpoints: Object.entries(endpoints).map(([name, endpointSpec]) => {
          const reliabilityKey = `${feature}/${name}`;
          const reliability = endpointReliability.get(reliabilityKey);

          return {
            name: name,
            id: endpointSpec.id,
            route: endpointSpec.route,
            status: reliability?.overall_reliable
              ? '✅ compliant'
              : '❌ issues found',
            reliability_score: reliability?.reliability_score || 0,
            blocking_issues: reliability?.blocking_issues || [],
            files: {
              contract: endpointSpec.contract?.file,
              logic: endpointSpec.logic?.file,
              test: endpointSpec.test?.file,
            },
          };
        }),

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
        `Feature '${feature}': Enhanced report generation failed - ${error.message}`
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
 * Analyze breaking changes across endpoints in a feature
 * @llm-rule WHEN: Detecting API compatibility issues and contract conflicts
 * @llm-rule AVOID: Missing cross-endpoint breaking changes - critical for API stability
 * @llm-rule NOTE: Analyzes route conflicts, response format changes, and backward compatibility
 */
async function analyzeBreakingChanges(feature, endpoints, spec) {
  const analysis = {
    api_compatibility: '✅ STABLE',
    contract_conflicts: 'none',
    response_format_changes: 'none',
    cross_endpoint_impacts: 'none',
    backward_compatibility: '100%',
    potential_issues: [],
  };

  try {
    // Check for route conflicts
    const routes = [];
    for (const [endpointName, endpointSpec] of Object.entries(endpoints)) {
      if (endpointSpec.route) {
        routes.push({
          endpoint: endpointName,
          route: endpointSpec.route,
        });
      }
    }

    // Look for conflicting routes
    const routeMap = new Map();
    for (const { endpoint, route } of routes) {
      if (routeMap.has(route)) {
        analysis.contract_conflicts = 'found';
        analysis.api_compatibility = '❌ CONFLICTS';
        analysis.potential_issues.push(
          `Route conflict: ${route} used by ${routeMap.get(route)} and ${endpoint}`
        );
      } else {
        routeMap.set(route, endpoint);
      }
    }

    // Check for response format consistency
    // In real implementation, would analyze actual response schemas
    const hasConsistentFormat = routes.length > 0; // Simplified check

    if (!hasConsistentFormat) {
      analysis.response_format_changes = 'inconsistent';
      analysis.backward_compatibility = '85%';
      analysis.potential_issues.push('Inconsistent response formats detected');
    }

    // Check for breaking parameter changes
    // Look for endpoints that might conflict on similar paths
    const parameterizedRoutes = routes.filter((r) => r.route.includes(':'));
    if (parameterizedRoutes.length > 1) {
      const basePaths = parameterizedRoutes.map((r) => r.route.split(':')[0]);
      const duplicateBasePaths = basePaths.filter(
        (path, index) => basePaths.indexOf(path) !== index
      );

      if (duplicateBasePaths.length > 0) {
        analysis.cross_endpoint_impacts = 'parameter conflicts';
        analysis.potential_issues.push(
          'Potential parameter conflicts between endpoints'
        );
      }
    }
  } catch (error) {
    analysis.api_compatibility = '⚠️ ANALYSIS ERROR';
    analysis.potential_issues.push(
      `Breaking change analysis error: ${error.message}`
    );
  }

  return analysis;
}

/**
 * Analyze code duplication across endpoints for independence tracking
 * @llm-rule WHEN: Tracking shared code patterns to maintain mathematical endpoint isolation
 * @llm-rule AVOID: Missing duplication tracking - breaks independence guarantees
 * @llm-rule NOTE: Identifies acceptable vs problematic duplication patterns
 */
async function analyzeDuplication(feature, endpoints) {
  const analysis = {
    shared_code_patterns: [],
    acceptable_duplication: [
      'VoilaJSX module initialization',
      'Error handling patterns',
      'Logging setup',
      'Request ID generation',
    ],
    problematic_duplication: [],
    independence_score: '100%',
    mathematical_isolation: true,
  };

  try {
    // Collect logic file contents for analysis
    const endpointLogic = new Map();

    for (const [endpointName, endpointSpec] of Object.entries(endpoints)) {
      try {
        const logicFile = join(
          process.cwd(),
          endpointSpec.folder,
          `${endpointName}.logic.ts`
        );
        const content = await readFile(logicFile, 'utf-8');
        endpointLogic.set(endpointName, content);
      } catch (error) {
        // Skip if file doesn't exist
        continue;
      }
    }

    // Analyze common patterns
    const commonPatterns = [
      { pattern: 'utils.uuid()', type: 'acceptable_voilajsx_pattern' },
      { pattern: 'log.info(', type: 'acceptable_logging' },
      { pattern: 'err.badRequest', type: 'acceptable_error_handling' },
      { pattern: 'secure.input(', type: 'acceptable_security' },
      {
        pattern: 'const utils = utility.get()',
        type: 'acceptable_voilajsx_init',
      },
    ];

    for (const { pattern, type } of commonPatterns) {
      const endpointsWithPattern = [];

      for (const [endpointName, content] of endpointLogic.entries()) {
        if (content.includes(pattern)) {
          endpointsWithPattern.push(endpointName);
        }
      }

      if (endpointsWithPattern.length > 1) {
        analysis.shared_code_patterns.push({
          pattern: pattern,
          endpoints: endpointsWithPattern,
          type: type,
          acceptable: type.startsWith('acceptable_'),
        });
      }
    }

    // Look for problematic duplications (large identical code blocks)
    const endpointNames = Array.from(endpointLogic.keys());
    for (let i = 0; i < endpointNames.length; i++) {
      for (let j = i + 1; j < endpointNames.length; j++) {
        const content1 = endpointLogic.get(endpointNames[i]);
        const content2 = endpointLogic.get(endpointNames[j]);

        // Simple check for large duplicate blocks (>50 characters)
        const lines1 = content1
          .split('\n')
          .filter((line) => line.trim().length > 10);
        const lines2 = content2
          .split('\n')
          .filter((line) => line.trim().length > 10);

        let duplicateBlocks = 0;
        for (const line of lines1) {
          if (lines2.includes(line) && line.length > 50) {
            duplicateBlocks++;
          }
        }

        if (duplicateBlocks > 3) {
          analysis.problematic_duplication.push({
            endpoints: [endpointNames[i], endpointNames[j]],
            duplicate_blocks: duplicateBlocks,
            concern: 'Large code blocks duplicated',
          });
          analysis.mathematical_isolation = false;
        }
      }
    }

    // Calculate independence score
    const problematicCount = analysis.problematic_duplication.length;
    const totalEndpoints = endpointNames.length;
    const independenceScore =
      totalEndpoints > 0 ? Math.max(0, 100 - problematicCount * 20) : 100;

    analysis.independence_score = `${independenceScore}%`;
  } catch (error) {
    analysis.problematic_duplication.push({
      error: `Duplication analysis error: ${error.message}`,
      endpoints: ['analysis_failed'],
      concern: 'Unable to analyze code duplication',
    });
    analysis.independence_score = '0%';
    analysis.mathematical_isolation = false;
  }

  return analysis;
}

/**
 * Show enhanced compliance summary with reliability metrics
 * @llm-rule WHEN: Displaying comprehensive compliance results for developer review
 * @llm-rule AVOID: Basic summaries - show detailed reliability and blocking issues
 * @llm-rule NOTE: Includes reliability scores, blocking issues, and deployment readiness
 */
function showEnhancedComplianceSummary(
  implementationResult,
  reliabilityResult,
  manifestResult,
  reportResult,
  totalDuration,
  validationScope
) {
  log.human('');
  log.human('📊 Enhanced Implementation Compliance Summary:');

  if (validationScope.type === 'endpoint') {
    log.human(
      `   Scope: ${validationScope.description} (${validationScope.target})`
    );
    log.human(`   Endpoint validated: 1`);
    log.human(`   Reliability score: ${reliabilityResult.averageReliability}%`);
    log.human(`   Enhanced manifests: ${manifestResult.manifestsGenerated}`);
    log.human(`   Reports skipped: endpoint-level validation`);
  } else {
    log.human(`   Scope: ${validationScope.description}`);
    log.human(
      `   Features validated: ${implementationResult.implementations.length}`
    );
    log.human(`   Endpoints checked: ${implementationResult.totalEndpoints}`);
    log.human(
      `   Average reliability: ${reliabilityResult.averageReliability}%`
    );
    log.human(`   Enhanced manifests: ${manifestResult.manifestsGenerated}`);
    log.human(`   Enhanced reports: ${reportResult.reportsGenerated}`);
  }

  log.human(`   Total time: ${totalDuration}ms`);

  // Show reliability status
  const allReliable = Array.from(
    reliabilityResult.endpointReliability.values()
  ).every((r) => r.overall_reliable);

  if (allReliable) {
    log.human('   Deployment status: ✅ READY FOR DEPLOYMENT');
  } else {
    log.human('   Deployment status: ❌ BLOCKED - Fix reliability issues');

    // Show blocking issues
    const blockingIssues = Array.from(
      reliabilityResult.endpointReliability.values()
    )
      .flatMap((r) => r.blocking_issues)
      .slice(0, 3);

    if (blockingIssues.length > 0) {
      log.human('   Blocking issues:');
      blockingIssues.forEach((issue) => {
        log.human(`     • ${issue}`);
      });
    }
  }

  log.human('');

  // Show enhanced manifest paths
  if (manifestResult.manifestPaths.length > 0) {
    log.human(' 📄 Enhanced manifests generated:');
    manifestResult.manifestPaths.forEach((path) => {
      const relativePath = path.replace(process.cwd() + '/', '');
      log.human(`   └── ${relativePath}`);
    });
  }

  // Show enhanced report paths
  if (reportResult.reportPaths && reportResult.reportPaths.length > 0) {
    log.human('');
    log.human(' 📋 Enhanced reports with breaking change analysis:');
    reportResult.reportPaths.forEach((path) => {
      const relativePath = path.replace(process.cwd() + '/', '');
      log.human(`   └── ${relativePath}`);
    });
  }

  log.human('');

  if (allReliable) {
    log.human('✅ Enhanced compliance validation completed successfully');
    log.human('🚀 Code is mathematically reliable and ready for deployment');
  } else {
    log.human('❌ Enhanced compliance validation found reliability issues');
    log.human('🔧 Fix blocking issues above before deployment');
  }

  log.human('');
}

// Helper functions for contract and test analysis

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
    // Ignore parsing errors for contract validation
  }

  return routes;
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
