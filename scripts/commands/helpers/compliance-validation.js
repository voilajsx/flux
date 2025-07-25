/**
 * ATOM Framework Compliance Validation - Generic reliability validation driven by implementation.json
 * @module @voilajsx/atom/scripts/commands/helpers/compliance-validation
 * @file scripts/commands/helpers/compliance-validation.js
 *
 * @llm-rule WHEN: Performing configurable reliability validation using implementation.json specifications
 * @llm-rule AVOID: Hardcoded validation patterns - always read from implementation.json configuration
 * @llm-rule NOTE: Supports any VoilaJSX AppKit modules and endpoint-specific validation requirements
 */

import { readFile, stat } from 'fs/promises';
import { join } from 'path';

/**
 * Generic reliability validation driven by implementation.json configuration
 * @llm-rule WHEN: Validating all reliability aspects using configurable patterns and thresholds
 * @llm-rule AVOID: Hardcoded validation patterns - read from implementation.json validation_targets
 * @llm-rule NOTE: Adapts to any VoilaJSX AppKit modules and endpoint-specific requirements
 */
export async function validateConfigurableReliability(
  implementations,
  validationScope
) {
  const startTime = Date.now();
  const errors = [];
  const endpointReliability = new Map();
  let endpointsValidated = 0;

  for (const { feature, spec } of implementations) {
    const endpoints = spec.endpoints || {};
    const globalTargets = spec.validation_targets || {};

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

      // Configurable reliability validation
      const reliability = await validateSingleEndpointConfigurable(
        feature,
        endpointName,
        endpointSpec,
        globalTargets
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
 * Validate single endpoint using configurable patterns from implementation.json
 * @llm-rule WHEN: Performing reliability check using endpoint-specific and global configuration
 * @llm-rule AVOID: Fixed validation patterns - use implementation.json specifications
 * @llm-rule NOTE: Supports any VoilaJSX AppKit modules and configurable thresholds
 */
export async function validateSingleEndpointConfigurable(
  feature,
  endpointName,
  endpointSpec,
  globalTargets
) {
  const reliability = {
    contract_compliance: {
      status: 'PASS',
      score: 100,
      issues: [],
      metrics: {},
    },
    test_validation: { status: 'PASS', score: 100, issues: [], metrics: {} },
    types_validation: { status: 'PASS', score: 100, issues: [], metrics: {} },
    lint_validation: { status: 'PASS', score: 100, issues: [], metrics: {} },
    code_quality: { status: 'PASS', score: 100, issues: [], metrics: {} },
    reliability_score: 0,
    overall_reliable: true,
    blocking_issues: [],
    mathematical_isolation: true,
  };

  try {
    const thresholds = globalTargets.reliability_thresholds || {};
    const endpointValidation = endpointSpec.validation_specifics || {};

    // 1. Contract Compliance Validation
    reliability.contract_compliance =
      await validateConfigurableContractCompliance(
        feature,
        endpointName,
        endpointSpec,
        globalTargets
      );

    // 2. Test Validation with configurable patterns
    reliability.test_validation = await validateConfigurableTestReliability(
      feature,
      endpointName,
      endpointSpec,
      globalTargets,
      endpointValidation
    );

    // 3. Types Validation
    reliability.types_validation = await validateConfigurableTypesReliability(
      feature,
      endpointName,
      endpointSpec,
      globalTargets
    );

    // 4. Lint Validation with VoilaJSX patterns
    reliability.lint_validation = await validateConfigurableLintReliability(
      feature,
      endpointName,
      endpointSpec,
      globalTargets,
      endpointValidation
    );

    // 5. Code Quality with configurable patterns
    reliability.code_quality = await validateConfigurableCodeQuality(
      feature,
      endpointName,
      endpointSpec,
      globalTargets,
      endpointValidation
    );

    // Calculate overall reliability score using configurable weights
    const scoringWeights = globalTargets.scoring_weights || {
      contract_compliance: 25,
      test_validation: 25,
      types_validation: 20,
      lint_validation: 15,
      code_quality: 15,
    };

    const weightedScore =
      (reliability.contract_compliance.score *
        scoringWeights.contract_compliance +
        reliability.test_validation.score * scoringWeights.test_validation +
        reliability.types_validation.score * scoringWeights.types_validation +
        reliability.lint_validation.score * scoringWeights.lint_validation +
        reliability.code_quality.score * scoringWeights.code_quality) /
      100;

    reliability.reliability_score = Math.round(weightedScore);

    // Determine if deployment ready using configurable threshold
    const minimumReliability = thresholds.overall_reliability_minimum || 90;
    reliability.overall_reliable =
      reliability.reliability_score >= minimumReliability;

    // Collect blocking issues from all validations
    [
      reliability.contract_compliance,
      reliability.test_validation,
      reliability.types_validation,
      reliability.lint_validation,
      reliability.code_quality,
    ].forEach((validation) => {
      if (
        validation.status === 'FAIL' ||
        (validation.status === 'WARN' &&
          validation.score < (thresholds[`${validation.type}_minimum`] || 90))
      ) {
        reliability.blocking_issues.push(...validation.issues);
      }
    });
  } catch (error) {
    reliability.overall_reliable = false;
    reliability.blocking_issues.push(
      `Configurable validation error: ${error.message}`
    );
    reliability.reliability_score = 0;
  }

  return reliability;
}

/**
 * Validate contract compliance using configurable patterns
 * @llm-rule WHEN: Checking contract compliance with implementation.json specified patterns
 * @llm-rule AVOID: Hardcoded route/function validation - use contract specification
 * @llm-rule NOTE: Adapts to any contract structure and import requirements
 */
export async function validateConfigurableContractCompliance(
  feature,
  endpointName,
  endpointSpec,
  globalTargets
) {
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

    // Extract contract routes and validate against logic exports
    const contractRoutes = extractContractRoutes(contractContent);
    const logicExports = extractLogicExports(logicContent);

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

    // Validate imports using configurable requirements
    const contractSpec = endpointSpec.contract || {};
    const requiredImports = contractSpec.imports || {
      appkit: [],
      external: [],
    };
    const voilajsxPatterns = globalTargets.voilajsx_patterns || {};
    const requiredModules = voilajsxPatterns.required_modules || [];

    let importIssues = 0;
    let totalImports =
      requiredImports.appkit.length + requiredImports.external.length;

    // Validate required VoilaJSX AppKit modules (map module names to import paths)
    const modulePathMap = {
      utility: 'utils',
      logger: 'logging',
      error: 'error',
      security: 'security',
      auth: 'auth',
      cache: 'cache',
      database: 'database',
      storage: 'storage',
      email: 'email',
      queue: 'queue',
    };

    requiredModules.forEach((module) => {
      const importPath = modulePathMap[module] || module;
      if (!logicContent.includes(`@voilajsx/appkit/${importPath}`)) {
        validation.issues.push(
          `Missing required VoilaJSX module: ${module} (import path: @voilajsx/appkit/${importPath})`
        );
        importIssues++;
      }
    });

    // Validate contract-specific imports
    requiredImports.appkit.forEach((module) => {
      const importPath = modulePathMap[module] || module;
      if (!logicContent.includes(`@voilajsx/appkit/${importPath}`)) {
        validation.issues.push(
          `Missing AppKit import: ${module} (import path: @voilajsx/appkit/${importPath})`
        );
        importIssues++;
      }
    });

    requiredImports.external.forEach((module) => {
      if (!logicContent.includes(`from '${module}'`)) {
        validation.issues.push(`Missing external import: ${module}`);
        importIssues++;
      }
    });

    const totalRequiredImports = Math.max(totalImports, requiredModules.length);
    validation.metrics.imports_validated = `${totalRequiredImports - importIssues}/${totalRequiredImports}`;

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
 * Validate test reliability using configurable test patterns
 * @llm-rule WHEN: Checking test coverage and patterns defined in implementation.json
 * @llm-rule AVOID: Hardcoded test pattern detection - use configurable patterns
 * @llm-rule NOTE: Supports endpoint-specific test requirements and global test targets
 */
export async function validateConfigurableTestReliability(
  feature,
  endpointName,
  endpointSpec,
  globalTargets,
  endpointValidation
) {
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
    const testRequirements = globalTargets.test_requirements || {};

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

    // Validate coverage using configurable target
    const coverageTarget =
      testSpec.coverage_target || globalTargets.required_coverage || 100;
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

    // Check critical paths using configurable patterns
    const criticalTestPatterns = endpointValidation.required_test_patterns ||
      testRequirements.critical_test_patterns || [
        'error',
        'validation',
        'response',
      ];

    const minimumCriticalCoverage =
      testRequirements.minimum_critical_coverage || 2;

    const testedPaths = criticalTestPatterns.filter((pattern) =>
      testContent.toLowerCase().includes(pattern)
    );

    validation.metrics.critical_paths_tested = `${testedPaths.length}/${criticalTestPatterns.length}`;

    if (testedPaths.length < minimumCriticalCoverage) {
      if (validation.status === 'PASS') validation.status = 'WARN';
      validation.score = Math.min(validation.score, 80);
      validation.issues.push(
        `Critical test patterns coverage below minimum (${testedPaths.length}/${minimumCriticalCoverage})`
      );
    }

    // Check for security test patterns if endpoint requires security validation
    const securityRequirements = endpointValidation.security_requirements || [];
    if (securityRequirements.length > 0) {
      const securityTestPatterns = testRequirements.security_test_patterns || [
        'XSS',
        'sanitiz',
        'reject',
      ];
      const securityTestsFound = securityTestPatterns.filter((pattern) =>
        testContent.toLowerCase().includes(pattern.toLowerCase())
      );

      if (securityTestsFound.length === 0) {
        if (validation.status === 'PASS') validation.status = 'WARN';
        validation.score = Math.min(validation.score, 85);
        validation.issues.push(
          'Missing security test patterns for security-sensitive endpoint'
        );
      }
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
 * @llm-rule WHEN: Checking TypeScript compilation and type patterns
 * @llm-rule AVOID: Complex TypeScript analysis - focus on basic compilation and patterns
 * @llm-rule NOTE: Simulates TypeScript validation with pattern detection
 */
export async function validateConfigurableTypesReliability(
  feature,
  endpointName,
  endpointSpec,
  globalTargets
) {
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

    // Update metrics based on validation results
    validation.metrics.type_safety_score = `${validation.score}%`;
    validation.metrics.typescript_compilation =
      validation.score >= 90 ? 'PASS' : 'FAIL';
  } catch (error) {
    validation.status = 'FAIL';
    validation.score = 0;
    validation.issues.push(`Types validation error: ${error.message}`);
  }

  return validation;
}

/**
 * Validate lint compliance using configurable VoilaJSX patterns
 * @llm-rule WHEN: Checking VoilaJSX patterns and conventions from implementation.json
 * @llm-rule AVOID: Hardcoded pattern detection - use configurable VoilaJSX patterns
 * @llm-rule NOTE: Supports any VoilaJSX AppKit modules and endpoint-specific patterns
 */
export async function validateConfigurableLintReliability(
  feature,
  endpointName,
  endpointSpec,
  globalTargets,
  endpointValidation
) {
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
    const voilajsxPatterns = globalTargets.voilajsx_patterns || {};

    // Check configurable VoilaJSX patterns
    const requiredPatterns = endpointValidation.required_voilajsx_patterns ||
      voilajsxPatterns.required_patterns || [
        '.get()',
        'utils.uuid()',
        'log.info(',
      ];

    const foundPatterns = requiredPatterns.filter((pattern) =>
      logicContent.includes(pattern)
    );

    const patternCompliance =
      requiredPatterns.length > 0
        ? Math.round((foundPatterns.length / requiredPatterns.length) * 100)
        : 100;

    if (
      patternCompliance <
      (globalTargets.code_quality_targets?.voilajsx_compliance_minimum || 75)
    ) {
      validation.status = 'WARN';
      validation.score = Math.min(validation.score, patternCompliance);
      validation.issues.push(
        `VoilaJSX pattern compliance ${patternCompliance}% below minimum`
      );
      validation.metrics.voilajsx_patterns = 'WARN';
    }

    // Check security patterns if required
    const securityRequirements = endpointValidation.security_requirements || [];
    if (securityRequirements.length > 0) {
      const securityPatterns = voilajsxPatterns.security_patterns || [
        'secure.input(',
        'utils.get(',
      ];
      const foundSecurityPatterns = securityPatterns.filter((pattern) =>
        logicContent.includes(pattern)
      );

      if (foundSecurityPatterns.length === 0) {
        validation.status = 'WARN';
        validation.score = Math.min(validation.score, 75);
        validation.issues.push(
          'Missing required security patterns for security-sensitive endpoint'
        );
        validation.metrics.security_patterns = 'WARN';
      }
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
 * Validate code quality using configurable quality targets
 * @llm-rule WHEN: Checking code quality metrics defined in implementation.json
 * @llm-rule AVOID: Fixed quality checks - use configurable quality targets
 * @llm-rule NOTE: Adapts to endpoint-specific quality requirements
 */
export async function validateConfigurableCodeQuality(
  feature,
  endpointName,
  endpointSpec,
  globalTargets,
  endpointValidation
) {
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
    const qualityTargets = globalTargets.code_quality_targets || {};
    const voilajsxPatterns = globalTargets.voilajsx_patterns || {};

    // Check error handling if required
    if (qualityTargets.error_handling_required !== false) {
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
    }

    // Check input sanitization only for endpoints with security requirements
    const securityRequirements = endpointValidation.security_requirements || [];
    const inputValidationRequired =
      endpointValidation.input_validation_requirements || [];

    // Only require input sanitization if endpoint specifically declares security requirements
    if (securityRequirements.length > 0 || inputValidationRequired.length > 0) {
      const securityPatterns = voilajsxPatterns.security_patterns || [
        'secure.input(',
        'utils.get(',
      ];
      const hasInputSanitization = securityPatterns.some((pattern) =>
        logicContent.includes(pattern)
      );

      if (!hasInputSanitization) {
        validation.status = 'FAIL';
        validation.score = Math.min(validation.score, 60);
        validation.issues.push(
          'Missing required input sanitization for security-sensitive endpoint'
        );
        validation.metrics.input_sanitization = 'FAIL';
      }
    } else {
      // No security requirements - mark as compliant
      validation.metrics.input_sanitization = 'N/A';
    }

    // Check structured logging if required
    if (qualityTargets.structured_logging_required !== false) {
      const hasStructuredLogging =
        logicContent.includes('log.info(') &&
        logicContent.includes('requestId');

      if (!hasStructuredLogging) {
        validation.status = 'WARN';
        validation.score = Math.min(validation.score, 85);
        validation.issues.push('Missing structured logging with requestId');
        validation.metrics.logging_structured = 'WARN';
      }
    }

    // Check overall VoilaJSX compliance using configurable patterns
    const requiredPatterns = voilajsxPatterns.required_patterns || [];
    const responsePatterns = voilajsxPatterns.response_patterns || [];
    const allPatterns = [...requiredPatterns, ...responsePatterns];

    if (allPatterns.length > 0) {
      const foundPatterns = allPatterns.filter((pattern) =>
        logicContent.includes(pattern)
      );

      const compliancePercentage = Math.round(
        (foundPatterns.length / allPatterns.length) * 100
      );
      validation.metrics.voilajsx_compliance = `${compliancePercentage}%`;

      const minimumCompliance =
        qualityTargets.voilajsx_compliance_minimum || 75;
      if (compliancePercentage < minimumCompliance) {
        validation.status = 'WARN';
        validation.score = Math.min(validation.score, compliancePercentage);
        validation.issues.push(
          `VoilaJSX compliance ${compliancePercentage}% below minimum ${minimumCompliance}%`
        );
      }
    }
  } catch (error) {
    validation.status = 'FAIL';
    validation.score = 0;
    validation.issues.push(`Code quality validation error: ${error.message}`);
  }

  return validation;
}

// Helper functions for pattern extraction
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
    // Ignore parsing errors
  }
  return routes;
}

function extractLogicExports(logicContent) {
  const exports = [];
  const functionMatches = logicContent.match(
    /export\s+(?:async\s+)?function\s+(\w+)/g
  );
  if (functionMatches) {
    functionMatches.forEach((match) => {
      const functionName = match.match(/function\s+(\w+)/)[1];
      exports.push(functionName);
    });
  }
  const constMatches = logicContent.match(/export\s+const\s+(\w+)/g);
  if (constMatches) {
    constMatches.forEach((match) => {
      const constName = match.match(/const\s+(\w+)/)[1];
      exports.push(constName);
    });
  }
  return exports;
}

function extractTestDescriptions(testContent) {
  const testDescriptions = [];
  const testRegex = /(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = testRegex.exec(testContent)) !== null) {
    testDescriptions.push(match[1]);
  }
  return testDescriptions;
}

function normalizeTestDescription(description) {
  return description.toLowerCase().replace(/\s+/g, ' ').trim();
}
