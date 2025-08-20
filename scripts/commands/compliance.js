/**
 * FLUX Framework Compliance Command - Generic specification-driven validation
 * @module @voilajsx/flux/scripts/commands/compliance
 * @file scripts/commands/compliance.js
 *
 * @llm-rule WHEN: Validating feature implementation quality against specification requirements
 * @llm-rule AVOID: Code parsing or hardcoded validation - use manifest data and specification configuration
 * @llm-rule NOTE: Fully generic, works with any FLUX feature by reading manifests and specifications
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('compliance');

/**
 * Parse target path to extract app, version, feature, and endpoint components
 * @llm-rule WHEN: Processing command arguments to support multi-app architecture
 * @llm-rule AVOID: Legacy path support - enforce multi-app format only
 * @llm-rule NOTE: Follows patterns documented in docs/FLUX_COMMANDS.md
 */
function parseTarget(target) {
  if (!target) {
    return { type: 'all', description: 'all apps and features' };
  }

  const pathParts = target.split('/');

  if (pathParts.length >= 3) {
    // Multi-app format: {app}/{version}/{feature}/{endpoint}
    const appname = pathParts[0];
    const version = pathParts[1];
    const feature = pathParts[2];
    const endpoint = pathParts[3] || null;

    if (endpoint) {
      return {
        type: 'endpoint',
        appname,
        version,
        feature,
        endpoint,
        description: `${appname}/${version}/${feature}/${endpoint} endpoint`,
        path: `src/api/${appname}/${version}/${feature}/${endpoint}`,
        fullPath: `src/api/${appname}/${version}/${feature}/${endpoint}`,
      };
    } else {
      return {
        type: 'feature',
        appname,
        version,
        feature,
        description: `${appname}/${version}/${feature} feature`,
        path: `src/api/${appname}/${version}/${feature}`,
        fullPath: `src/api/${appname}/${version}/${feature}`,
      };
    }
  } else {
    // Invalid format - require full app/version/feature path
    throw new Error(`Invalid path format: ${target}. Expected: {app}/{version}/{feature} or {app}/{version}/{feature}/{endpoint}`);
  }
}

/**
 * Generic compliance validation command - specification-driven and manifest-based
 */
export default async function compliance(args) {
  const startTime = Date.now();
  const target = args[0];
  const targetInfo = parseTarget(target);

  try {
    log.human(
      `🔍 FLUX: compliance validation starting for ${targetInfo.description}`
    );

    // 1. Discover and validate target features
    const features = await discoverFeatures(targetInfo);

    if (features.length === 0) {
      log.human('❌ No valid features found for compliance validation');
      return false;
    }

    log.human(`📋 Found ${features.length} features for validation`);

    // 2. Process each feature
    let allFeaturesValid = true;
    const results = [];

    for (const feature of features) {
      try {
        log.human(`📊 Validating ${feature.appname}/${feature.version}/${feature.feature} feature...`);

        const featureResult = await validateFeatureCompliance(feature.appname, feature.version, feature.feature);
        results.push(featureResult);

        if (!featureResult.overall_compliant) {
          allFeaturesValid = false;
        }

        // Generate compliance report
        await generateComplianceReport(feature.appname, feature.version, feature.feature, featureResult);

        const status = featureResult.overall_compliant ? '✅' : '❌';
        log.human(
          `${status} ${feature.appname}/${feature.version}/${feature.feature}: ${featureResult.compliance_score}% compliant`
        );
      } catch (error) {
        log.human(`❌ Failed to validate ${feature.appname}/${feature.version}/${feature.feature}: ${error.message}`);
        allFeaturesValid = false;
      }
    }

    // 3. Summary
    const duration = Date.now() - startTime;
    const compliantCount = results.filter((r) => r.overall_compliant).length;

    if (allFeaturesValid) {
      log.human(
        `✅ Compliance validation passed for ${targetInfo.description} (${duration}ms)`
      );
    } else {
      log.human(`❌ Compliance validation failed (${duration}ms)`);
    }

    log.human(
      `📊 Summary: ${compliantCount}/${results.length} features compliant`
    );

    return allFeaturesValid;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.human(
      `❌ Compliance validation error (${duration}ms): ${error.message}`
    );
    return false;
  }
}

/**
 * Discover features based on target scope
 */
async function discoverFeatures(targetInfo) {
  const apiPath = join(process.cwd(), 'src', 'api');

  try {
    if (targetInfo.type === 'feature' || targetInfo.type === 'endpoint') {
      // Validate specific feature exists
      const featurePath = join(apiPath, targetInfo.appname, targetInfo.version, targetInfo.feature);
      await stat(featurePath);
      return [{ appname: targetInfo.appname, version: targetInfo.version, feature: targetInfo.feature }];
    }

    // Discover all features (default to flux/v1 for 'all')
    const fluxPath = join(apiPath, 'flux', 'v1');
    try {
      const allFeatures = await readdir(fluxPath);
      return allFeatures
        .filter((f) => !f.startsWith('_') && !f.startsWith('.'))
        .map(feature => ({ appname: 'flux', version: 'v1', feature }));
    } catch {
      return [];
    }
  } catch (error) {
    if (targetInfo.type === 'feature' || targetInfo.type === 'endpoint') {
      throw new Error(`Feature '${targetInfo.appname}/${targetInfo.version}/${targetInfo.feature}' not found`);
    }
    throw new Error(`Failed to discover features: ${error.message}`);
  }
}

/**
 * Validate single feature compliance using specification and manifests
 */
async function validateFeatureCompliance(appname, version, featureName) {
  const featurePath = join(process.cwd(), 'src', 'api', appname, version, featureName);

  // 1. Load specification
  const specification = await loadSpecification(featurePath, featureName);

  // 2. Discover and load endpoint manifests
  const manifests = await discoverEndpointManifests(featurePath);

  // 3. Validate specification implementation
  const specImplementation = await validateSpecificationImplementation(
    specification,
    manifests
  );

  // 4. Calculate deployment readiness from manifests
  const deploymentReadiness = calculateDeploymentReadiness(
    manifests,
    specification
  );

  // 5. Analyze code patterns and duplication
  const codeAnalysis = analyzeCodePatterns(manifests, specification);

  // 6. Calculate overall compliance score
  const complianceScore = calculateOverallCompliance(
    specImplementation,
    deploymentReadiness,
    codeAnalysis,
    specification
  );

  return {
    feature: featureName,
    timestamp: new Date().toISOString(),
    overall_compliant:
      complianceScore >=
      (specification.validation_targets?.reliability_thresholds
        ?.overall_reliability_minimum || 90),
    active: complianceScore >= 75,
    compliance_score: complianceScore,
    specification_implementation: specImplementation,
    deployment_readiness: deploymentReadiness,
    code_analysis: codeAnalysis,
    endpoints_analyzed: manifests.length,
    configuration_source: `${featureName}.specification.json`,
    manifests: manifests, // Include manifests for detailed summary
  };
}

/**
 * Load and validate specification file
 */
async function loadSpecification(featurePath, featureName) {
  const specPath = join(featurePath, `${featureName}.specification.json`);

  try {
    const specContent = await readFile(specPath, 'utf-8');
    const specification = JSON.parse(specContent);

    // Validate required specification structure
    if (!specification.endpoints) {
      throw new Error('Specification missing endpoints configuration');
    }

    if (!specification.validation_targets) {
      throw new Error('Specification missing validation_targets configuration');
    }

    return specification;
  } catch (error) {
    throw new Error(`Failed to load specification: ${error.message}`);
  }
}

/**
 * Discover endpoint manifest files in feature directory
 */
async function discoverEndpointManifests(featurePath) {
  const manifests = [];

  try {
    // Find all subdirectories (endpoints)
    const entries = await readdir(featurePath, { withFileTypes: true });
    const endpointDirs = entries.filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('_') &&
        !entry.name.startsWith('.')
    );

    // Load manifest from each endpoint directory
    for (const endpointDir of endpointDirs) {
      const endpointPath = join(featurePath, endpointDir.name);
      const manifestFiles = await readdir(endpointPath);

      // Find .manifest.json file
      const manifestFile = manifestFiles.find((f) =>
        f.endsWith('.manifest.json')
      );

      if (manifestFile) {
        const manifestPath = join(endpointPath, manifestFile);
        const manifestContent = await readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        manifests.push({
          endpoint: endpointDir.name,
          manifest_file: manifestFile,
          ...manifest,
        });
      }
    }

    return manifests;
  } catch (error) {
    throw new Error(`Failed to discover manifests: ${error.message}`);
  }
}

/**
 * Validate how well the specification is implemented based on manifest data
 */
async function validateSpecificationImplementation(specification, manifests) {
  const implementation = {
    business_logic_coverage: 0,
    error_scenarios_coverage: 0,
    external_integrations_compliance: 0,
    validation_targets_met: 0,
    issues: [],
    details: {},
  };

  try {
    const specEndpoints = Object.keys(specification.endpoints || {});
    const manifestEndpoints = manifests.map((m) => m.endpoint);

    // 1. Check endpoint completeness
    const missingEndpoints = specEndpoints.filter(
      (ep) => !manifestEndpoints.includes(ep)
    );
    const extraEndpoints = manifestEndpoints.filter(
      (ep) => !specEndpoints.includes(ep)
    );

    if (missingEndpoints.length > 0) {
      implementation.issues.push(
        `Missing endpoints: ${missingEndpoints.join(', ')}`
      );
    }

    if (extraEndpoints.length > 0) {
      implementation.issues.push(
        `Unexpected endpoints: ${extraEndpoints.join(', ')}`
      );
    }

    const endpointCompleteness =
      specEndpoints.length > 0
        ? Math.round(
            ((specEndpoints.length - missingEndpoints.length) /
              specEndpoints.length) *
              100
          )
        : 100;

    implementation.details.endpoint_completeness = `${endpointCompleteness}%`;

    // 2. Analyze business logic implementation from manifest contract compliance
    const contractScores = manifests.map((m) =>
      parseInt(m.contract_compliance?.score?.replace('%', '') || '0')
    );

    implementation.business_logic_coverage =
      contractScores.length > 0
        ? Math.round(
            contractScores.reduce((a, b) => a + b, 0) / contractScores.length
          )
        : 0;

    // 3. Analyze error handling from manifest validation details
    const errorHandlingScores = manifests.map((m) => {
      const validationDetails =
        m.specification_requirements?.validation_details || {};
      const passCount = Object.values(validationDetails).filter(
        (v) => v === 'PASSED'
      ).length;
      const totalCount = Object.keys(validationDetails).length;
      return totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
    });

    implementation.error_scenarios_coverage =
      errorHandlingScores.length > 0
        ? Math.round(
            errorHandlingScores.reduce((a, b) => a + b, 0) /
              errorHandlingScores.length
          )
        : 0;

    // 4. Check external integrations (based on import compliance from manifests)
    const importScores = manifests.map((m) =>
      m.contract_compliance?.imports_complete === 'COMPLETE' ? 100 : 0
    );

    implementation.external_integrations_compliance =
      importScores.length > 0
        ? Math.round(
            importScores.reduce((a, b) => a + b, 0) / importScores.length
          )
        : 0;

    // 5. Validate against all specification targets (excluding breaking_change_prevention)
    const validationTargets = specification.validation_targets || {};
    const targetsMet = [];

    // 1. Check total endpoints target
    if (validationTargets.total_endpoints) {
      const actualEndpoints = manifests.length;
      const expectedEndpoints = validationTargets.total_endpoints;
      if (actualEndpoints >= expectedEndpoints) {
        targetsMet.push('total_endpoints');
      } else {
        implementation.issues.push(
          `Expected ${expectedEndpoints} endpoints, found ${actualEndpoints}`
        );
      }
    }

    // 2. Check total contracts target
    if (validationTargets.total_contracts) {
      const contractsWithCompliance = manifests.filter(
        (m) => m.contract_compliance?.score
      ).length;
      const expectedContracts = validationTargets.total_contracts;
      if (contractsWithCompliance >= expectedContracts) {
        targetsMet.push('total_contracts');
      } else {
        implementation.issues.push(
          `Expected ${expectedContracts} contracts, found ${contractsWithCompliance}`
        );
      }
    }

    // 3. Check total logic files target
    if (validationTargets.total_logic_files) {
      const logicFilesImplemented = manifests.filter(
        (m) =>
          m.specification_requirements?.business_logic?.function_exports ===
          'IMPLEMENTED'
      ).length;
      const expectedLogicFiles = validationTargets.total_logic_files;
      if (logicFilesImplemented >= expectedLogicFiles) {
        targetsMet.push('total_logic_files');
      } else {
        implementation.issues.push(
          `Expected ${expectedLogicFiles} logic files, found ${logicFilesImplemented} implemented`
        );
      }
    }

    // 4. Check total test files target
    if (validationTargets.total_test_files) {
      const testFilesWithCoverage = manifests.filter(
        (m) => m.test_coverage?.score
      ).length;
      const expectedTestFiles = validationTargets.total_test_files;
      if (testFilesWithCoverage >= expectedTestFiles) {
        targetsMet.push('total_test_files');
      } else {
        implementation.issues.push(
          `Expected ${expectedTestFiles} test files, found ${testFilesWithCoverage}`
        );
      }
    }

    // 5. Check total routes target
    if (validationTargets.total_routes) {
      const totalRoutes = manifests.reduce(
        (sum, m) => sum + Object.keys(m.routes || {}).length,
        0
      );
      const expectedRoutes = validationTargets.total_routes;
      if (totalRoutes >= expectedRoutes) {
        targetsMet.push('total_routes');
      } else {
        implementation.issues.push(
          `Expected ${expectedRoutes} routes, found ${totalRoutes}`
        );
      }
    }

    // 6. Check total functions target
    if (validationTargets.total_functions) {
      const totalFunctions = manifests.reduce(
        (sum, m) => sum + Object.keys(m.routes || {}).length,
        0
      );
      const expectedFunctions = validationTargets.total_functions;
      if (totalFunctions >= expectedFunctions) {
        targetsMet.push('total_functions');
      } else {
        implementation.issues.push(
          `Expected ${expectedFunctions} functions, found ${totalFunctions}`
        );
      }
    }

    // 7. Check total test cases target
    if (validationTargets.total_test_cases) {
      const totalTestCases = manifests.reduce((sum, m) => {
        const testMapping = m.test_coverage?.test_case_mapping || {};
        return sum + Object.keys(testMapping).length;
      }, 0);
      const expectedTestCases = validationTargets.total_test_cases;
      if (totalTestCases >= expectedTestCases) {
        targetsMet.push('total_test_cases');
      } else {
        implementation.issues.push(
          `Expected ${expectedTestCases} test cases, found ${totalTestCases}`
        );
      }
    }

    // 8. Check required coverage target
    if (validationTargets.required_coverage) {
      const testScores = manifests.map((m) =>
        parseInt(m.test_coverage?.score?.replace('%', '') || '0')
      );
      const avgTestCoverage =
        testScores.length > 0
          ? Math.round(
              testScores.reduce((a, b) => a + b, 0) / testScores.length
            )
          : 0;

      if (avgTestCoverage >= validationTargets.required_coverage) {
        targetsMet.push('required_coverage');
      } else {
        implementation.issues.push(
          `Test coverage ${avgTestCoverage}% below target ${validationTargets.required_coverage}%`
        );
      }
    }

    // 9. Check VoilaJSX patterns target
    if (validationTargets.voilajsx_patterns) {
      const patternsCompliant = manifests.filter(
        (m) =>
          m.specification_requirements?.business_logic
            ?.module_initialization === 'IMPLEMENTED'
      ).length;
      if (patternsCompliant === manifests.length && manifests.length > 0) {
        targetsMet.push('voilajsx_patterns');
      } else {
        implementation.issues.push(
          `VoilaJSX patterns not fully implemented: ${patternsCompliant}/${manifests.length} endpoints compliant`
        );
      }
    }

    // 10. Check test requirements target
    if (validationTargets.test_requirements) {
      const testRequirementsMet = manifests.filter((m) => {
        const validationDetails =
          m.specification_requirements?.validation_details || {};
        return validationDetails.test_validation === 'PASSED';
      }).length;
      if (testRequirementsMet === manifests.length && manifests.length > 0) {
        targetsMet.push('test_requirements');
      } else {
        implementation.issues.push(
          `Test requirements not fully met: ${testRequirementsMet}/${manifests.length} endpoints passed`
        );
      }
    }

    // 11. Check code quality targets
    if (validationTargets.code_quality_targets) {
      const codeQualityMet = manifests.filter((m) => {
        const validationDetails =
          m.specification_requirements?.validation_details || {};
        return (
          validationDetails.schema_validation === 'PASSED' &&
          validationDetails.types_validation === 'PASSED' &&
          validationDetails.lint_validation === 'PASSED'
        );
      }).length;
      if (codeQualityMet === manifests.length && manifests.length > 0) {
        targetsMet.push('code_quality_targets');
      } else {
        implementation.issues.push(
          `Code quality targets not fully met: ${codeQualityMet}/${manifests.length} endpoints passed`
        );
      }
    }

    // 12. Check reliability thresholds
    if (validationTargets.reliability_thresholds) {
      const reliabilityMet = manifests.filter((m) => {
        const overallScore = parseInt(
          m.quick_status?.overall?.replace('%', '') || '0'
        );
        const minReliability =
          validationTargets.reliability_thresholds
            ?.overall_reliability_minimum || 90;
        return overallScore >= minReliability;
      }).length;
      if (reliabilityMet === manifests.length && manifests.length > 0) {
        targetsMet.push('reliability_thresholds');
      } else {
        implementation.issues.push(
          `Reliability thresholds not met: ${reliabilityMet}/${manifests.length} endpoints meet minimum reliability`
        );
      }
    }

    // Calculate validation targets met (excluding breaking_change_prevention)
    const validatableTargets = [
      'total_endpoints',
      'total_contracts',
      'total_logic_files',
      'total_test_files',
      'total_routes',
      'total_functions',
      'total_test_cases',
      'required_coverage',
      'voilajsx_patterns',
      'test_requirements',
      'code_quality_targets',
      'reliability_thresholds',
    ];

    const availableTargets = validatableTargets.filter(
      (target) => validationTargets[target] !== undefined
    );
    const totalTargets = availableTargets.length;

    implementation.validation_targets_met =
      totalTargets > 0
        ? Math.round((targetsMet.length / totalTargets) * 100)
        : 100;

    implementation.details.targets_met = `${targetsMet.length}/${totalTargets}`;
    implementation.details.available_targets = availableTargets;
    implementation.details.met_targets = targetsMet;

    // Create detailed breakdown with actual vs expected counts
    implementation.details.targets_breakdown = {};

    // 1. total_endpoints
    if (validationTargets.total_endpoints) {
      const actual = manifests.length;
      const expected = validationTargets.total_endpoints;
      implementation.details.targets_breakdown.total_endpoints = `${actual}/${expected}`;
    }

    // 2. total_contracts
    if (validationTargets.total_contracts) {
      const actual = manifests.filter(
        (m) => m.contract_compliance?.score
      ).length;
      const expected = validationTargets.total_contracts;
      implementation.details.targets_breakdown.total_contracts = `${actual}/${expected}`;
    }

    // 3. total_logic_files
    if (validationTargets.total_logic_files) {
      const actual = manifests.filter(
        (m) =>
          m.specification_requirements?.business_logic?.function_exports ===
          'IMPLEMENTED'
      ).length;
      const expected = validationTargets.total_logic_files;
      implementation.details.targets_breakdown.total_logic_files = `${actual}/${expected}`;
    }

    // 4. total_test_files
    if (validationTargets.total_test_files) {
      const actual = manifests.filter((m) => m.test_coverage?.score).length;
      const expected = validationTargets.total_test_files;
      implementation.details.targets_breakdown.total_test_files = `${actual}/${expected}`;
    }

    // 5. total_routes
    if (validationTargets.total_routes) {
      const actual = manifests.reduce(
        (sum, m) => sum + Object.keys(m.routes || {}).length,
        0
      );
      const expected = validationTargets.total_routes;
      implementation.details.targets_breakdown.total_routes = `${actual}/${expected}`;
    }

    // 6. total_functions
    if (validationTargets.total_functions) {
      const actual = manifests.reduce(
        (sum, m) => sum + Object.keys(m.routes || {}).length,
        0
      );
      const expected = validationTargets.total_functions;
      implementation.details.targets_breakdown.total_functions = `${actual}/${expected}`;
    }

    // 7. total_test_cases
    if (validationTargets.total_test_cases) {
      const actual = manifests.reduce((sum, m) => {
        const testMapping = m.test_coverage?.test_case_mapping || {};
        return sum + Object.keys(testMapping).length;
      }, 0);
      const expected = validationTargets.total_test_cases;
      implementation.details.targets_breakdown.total_test_cases = `${actual}/${expected}`;
    }

    // 8. required_coverage
    if (validationTargets.required_coverage) {
      const testScores = manifests.map((m) =>
        parseInt(m.test_coverage?.score?.replace('%', '') || '0')
      );
      const actual =
        testScores.length > 0
          ? Math.round(
              testScores.reduce((a, b) => a + b, 0) / testScores.length
            )
          : 0;
      const expected = validationTargets.required_coverage;
      implementation.details.targets_breakdown.required_coverage = `${actual}%/${expected}%`;
    }

    // 9. voilajsx_patterns
    if (validationTargets.voilajsx_patterns) {
      const actual = manifests.filter(
        (m) =>
          m.specification_requirements?.business_logic
            ?.module_initialization === 'IMPLEMENTED'
      ).length;
      const expected = manifests.length;
      implementation.details.targets_breakdown.voilajsx_patterns = `${actual}/${expected}`;
    }

    // 10. test_requirements
    if (validationTargets.test_requirements) {
      const actual = manifests.filter((m) => {
        const validationDetails =
          m.specification_requirements?.validation_details || {};
        return validationDetails.test_validation === 'PASSED';
      }).length;
      const expected = manifests.length;
      implementation.details.targets_breakdown.test_requirements = `${actual}/${expected}`;
    }

    // 11. code_quality_targets
    if (validationTargets.code_quality_targets) {
      const actual = manifests.filter((m) => {
        const validationDetails =
          m.specification_requirements?.validation_details || {};
        return (
          validationDetails.schema_validation === 'PASSED' &&
          validationDetails.types_validation === 'PASSED' &&
          validationDetails.lint_validation === 'PASSED'
        );
      }).length;
      const expected = manifests.length;
      implementation.details.targets_breakdown.code_quality_targets = `${actual}/${expected}`;
    }

    // 12. reliability_thresholds
    if (validationTargets.reliability_thresholds) {
      const actual = manifests.filter((m) => {
        const overallScore = parseInt(
          m.quick_status?.overall?.replace('%', '') || '0'
        );
        const minReliability =
          validationTargets.reliability_thresholds
            ?.overall_reliability_minimum || 90;
        return overallScore >= minReliability;
      }).length;
      const expected = manifests.length;
      implementation.details.targets_breakdown.reliability_thresholds = `${actual}/${expected}`;
    }
  } catch (error) {
    implementation.issues.push(
      `Specification validation error: ${error.message}`
    );
  }

  return implementation;
}

/**
 * Calculate deployment readiness from manifest data
 */
function calculateDeploymentReadiness(manifests, specification) {
  const readiness = {
    endpoints_ready: 0,
    endpoints_total: manifests.length,
    blocking_issues_total: 0,
    deployment_score: 0,
    endpoint_status: {},
    summary: '',
  };

  try {
    let readyCount = 0;
    let totalBlockingIssues = 0;

    manifests.forEach((manifest) => {
      const canDeploy = manifest.active === true;
      const blockingCount = manifest.blocking_issues?.length || 0;

      readiness.endpoint_status[manifest.endpoint] = {
        ready: canDeploy,
        blocking_issues: blockingCount,
        overall_score: manifest.quick_status?.overall || '0%',
      };

      if (canDeploy) readyCount++;
      totalBlockingIssues += blockingCount;
    });

    readiness.endpoints_ready = readyCount;
    readiness.blocking_issues_total = totalBlockingIssues;
    readiness.deployment_score =
      manifests.length > 0
        ? Math.round((readyCount / manifests.length) * 100)
        : 0;

    readiness.summary = `${readyCount}/${manifests.length} endpoints ready for deployment`;

    // Check against specification reliability thresholds
    const reliabilityThresholds =
      specification.validation_targets?.reliability_thresholds || {};
    const minReliability =
      reliabilityThresholds.overall_reliability_minimum || 90;

    if (readiness.deployment_score < minReliability) {
      readiness.meets_reliability_threshold = false;
    } else {
      readiness.meets_reliability_threshold = true;
    }
  } catch (error) {
    readiness.summary = `Deployment readiness calculation error: ${error.message}`;
  }

  return readiness;
}

/**
 * Analyze code patterns and duplication from manifest data
 */
function analyzeCodePatterns(manifests, specification) {
  const analysis = {
    shared_patterns: [],
    method_duplication: {},
    voilajsx_compliance: 0,
    refactor_suggestions: [],
    pattern_consistency: 100,
  };

  try {
    // 1. Analyze method duplication from manifest routes
    const allMethods = {};

    manifests.forEach((manifest) => {
      const routes = manifest.routes || {};
      Object.values(routes).forEach((methodName) => {
        if (!allMethods[methodName]) {
          allMethods[methodName] = [];
        }
        allMethods[methodName].push(manifest.endpoint);
      });
    });

    // Identify duplicated method names (indicating potential code duplication)
    Object.entries(allMethods).forEach(([methodName, endpoints]) => {
      if (endpoints.length > 1) {
        analysis.method_duplication[methodName] = endpoints;
        analysis.refactor_suggestions.push(
          `Method '${methodName}' appears in endpoints: ${endpoints.join(', ')} - consider extracting shared logic`
        );
      }
    });

    // 2. Analyze VoilaJSX pattern compliance from manifests
    const complianceScores = manifests.map((manifest) => {
      const businessLogic =
        manifest.specification_requirements?.business_logic || {};
      let score = 100;

      if (businessLogic.function_exports !== 'IMPLEMENTED') score -= 25;
      if (businessLogic.module_initialization !== 'IMPLEMENTED') score -= 25;

      return Math.max(0, score);
    });

    analysis.voilajsx_compliance =
      complianceScores.length > 0
        ? Math.round(
            complianceScores.reduce((a, b) => a + b, 0) /
              complianceScores.length
          )
        : 100;

    // 3. Check pattern consistency across endpoints
    const statusVariation = new Set(manifests.map((m) => m.status)).size;
    if (statusVariation > 1) {
      analysis.pattern_consistency = 75; // Reduce score for inconsistent implementation
      analysis.refactor_suggestions.push(
        'Inconsistent endpoint status - some endpoints have different compliance levels'
      );
    }

    // 4. Identify shared patterns that are acceptable
    const specPatterns =
      specification.validation_targets?.voilajsx_patterns?.required_patterns ||
      [];
    analysis.shared_patterns = specPatterns.map((pattern) => ({
      pattern,
      type: 'required_voilajsx_pattern',
      endpoints: manifests.length, // Assume all endpoints should have these patterns
      acceptable: true,
    }));
  } catch (error) {
    analysis.refactor_suggestions.push(`Code analysis error: ${error.message}`);
  }

  return analysis;
}

/**
 * Calculate overall compliance score using specification weights
 */
function calculateOverallCompliance(
  specImplementation,
  deploymentReadiness,
  codeAnalysis,
  specification
) {
  try {
    // Use specification scoring weights or defaults
    const scoringWeights = specification.validation_targets
      ?.scoring_weights || {
      specification_implementation: 40,
      deployment_readiness: 30,
      code_quality: 20,
      pattern_compliance: 10,
    };

    const specScore = Math.round(
      (specImplementation.business_logic_coverage +
        specImplementation.error_scenarios_coverage +
        specImplementation.external_integrations_compliance +
        specImplementation.validation_targets_met) /
        4
    );

    const weightedScore =
      (specScore * (scoringWeights.specification_implementation || 40) +
        deploymentReadiness.deployment_score *
          (scoringWeights.deployment_readiness || 30) +
        codeAnalysis.voilajsx_compliance * (scoringWeights.code_quality || 20) +
        codeAnalysis.pattern_consistency *
          (scoringWeights.pattern_compliance || 10)) /
      100;

    return Math.round(weightedScore);
  } catch (error) {
    return 0; // Conservative score on calculation error
  }
}

/**
 * Generate compliance report file
 */
async function generateComplianceReport(appname, version, featureName, complianceResult) {
  const reportPath = join(
    process.cwd(),
    'src',
    'api',
    appname,
    version,
    featureName,
    `${featureName}.compliance.json`
  );

  const report = {
    feature: featureName,
    version: '1.0.0',
    generated_at: complianceResult.timestamp,
    status: complianceResult.overall_compliant
      ? '✅ COMPLIANT'
      : '❌ NON-COMPLIANT',
    active: complianceResult.active,

    summary: {
      compliance_score: `${complianceResult.compliance_score}%`,
      endpoints_analyzed: complianceResult.endpoints_analyzed,
      deployment_ready: complianceResult.deployment_readiness.summary,
      specification_alignment: `${complianceResult.specification_implementation.validation_targets_met}%`,
    },

    detailed_summary: await generateDetailedSummary(
      appname,
      version,
      featureName,
      complianceResult
    ),

    specification_implementation: {
      business_logic_coverage: `${complianceResult.specification_implementation.business_logic_coverage}%`,
      error_scenarios_coverage: `${complianceResult.specification_implementation.error_scenarios_coverage}%`,
      external_integrations_compliance: `${complianceResult.specification_implementation.external_integrations_compliance}%`,
      validation_targets_met:
        complianceResult.specification_implementation.details.targets_met,
      validation_targets_breakdown:
        complianceResult.specification_implementation.details
          .targets_breakdown || {},
      issues: complianceResult.specification_implementation.issues,
    },

    deployment_readiness: {
      endpoints_status: complianceResult.deployment_readiness.endpoint_status,
      blocking_issues_total:
        complianceResult.deployment_readiness.blocking_issues_total,
      deployment_score: `${complianceResult.deployment_readiness.deployment_score}%`,
      meets_reliability_threshold:
        complianceResult.deployment_readiness.meets_reliability_threshold,
    },

    code_analysis: {
      voilajsx_compliance: `${complianceResult.code_analysis.voilajsx_compliance}%`,
      pattern_consistency: `${complianceResult.code_analysis.pattern_consistency}%`,
      method_duplication: complianceResult.code_analysis.method_duplication,
      refactor_suggestions: complianceResult.code_analysis.refactor_suggestions,
      shared_patterns: complianceResult.code_analysis.shared_patterns.length,
    },

    recommendations: generateRecommendations(complianceResult),

    metadata: {
      configuration_source: complianceResult.configuration_source,
      validation_timestamp: complianceResult.timestamp,
      generated_by: 'FLUX Framework Compliance Validator',
      specification_driven: true,
      manifest_based: true,
    },
  };

  await writeFile(reportPath, JSON.stringify(report, null, 2));
}

/**
 * Generate comprehensive detailed summary as single source of truth
 */
async function generateDetailedSummary(appname, version, featureName, complianceResult) {
  const featurePath = join(process.cwd(), 'src', 'api', appname, version, featureName);
  const specification = await loadSpecification(featurePath, featureName);
  const manifests = complianceResult.manifests || [];

  const detailedSummary = {
    feature_overview: {
      name: featureName,
      total_endpoints: manifests.length,
      specification_endpoints: Object.keys(specification.endpoints || {})
        .length,
      endpoints_status:
        manifests.length === Object.keys(specification.endpoints || {}).length
          ? '✅ Complete'
          : '⚠️ Missing endpoints',
    },

    validation_targets_detailed:
      complianceResult.specification_implementation.details.targets_breakdown ||
      {},

    endpoints_breakdown: {},

    implementation_checklist: {
      contracts: `${manifests.filter((m) => m.contract_compliance?.score).length}/${manifests.length}`,
      logic_files: `${manifests.filter((m) => m.specification_requirements?.business_logic?.function_exports === 'IMPLEMENTED').length}/${manifests.length}`,
      test_files: `${manifests.filter((m) => m.test_coverage?.score).length}/${manifests.length}`,
      deployment_ready: `${manifests.filter((m) => m.active).length}/${manifests.length}`,
    },

    quick_reference: {
      all_endpoints_ready: manifests.every((m) => m.active),
      blocking_issues_total:
        complianceResult.deployment_readiness.blocking_issues_total,
      extra_test_cases: 0, // Will be calculated below
      specification_compliance: complianceResult.overall_compliant,
    },
  };

  // Generate detailed breakdown for each endpoint
  manifests.forEach((manifest) => {
    const specEndpoint = specification.endpoints?.[manifest.endpoint] || {};

    // Calculate extra test cases
    const testMapping = manifest.test_coverage?.test_case_mapping || {};
    const extraTests = Object.entries(testMapping).filter(
      ([name, status]) => status === 'EXTRA'
    ).length;
    detailedSummary.quick_reference.extra_test_cases += extraTests;

    detailedSummary.endpoints_breakdown[manifest.endpoint] = {
      // Basic Info
      route: manifest.route,
      status: manifest.status,
      deployment_ready: manifest.active
        ? '✅ Ready'
        : '❌ Blocked',
      overall_score: manifest.quick_status?.overall || '0%',

      // Routes Implementation
      routes: {
        implemented: manifest.routes || {},
        specification_routes: specEndpoint.contract?.routes || {},
        status:
          manifest.contract_compliance?.routes_match === 'PASS'
            ? '✅ Match'
            : '❌ Mismatch',
      },

      // Function Implementation
      functions: {
        implemented: Object.values(manifest.routes || {}),
        specification_functions: specEndpoint.logic?.exports || [],
        status:
          manifest.specification_requirements?.business_logic
            ?.function_exports === 'IMPLEMENTED'
            ? '✅ Implemented'
            : '❌ Missing',
      },

      // Test Cases Implementation
      test_cases: {
        total_implemented: Object.keys(testMapping).length,
        specification_required: Object.keys(testMapping).filter(
          (name) => testMapping[name] === 'IMPLEMENTED'
        ).length,
        extra_tests: extraTests,
        specification_tests:
          specEndpoint.test?.test_cases?.map((tc) => tc.name) || [],
        implemented_tests: Object.keys(testMapping),
        test_status_mapping: testMapping,
        status:
          manifest.test_coverage?.score === '100%'
            ? '✅ Complete'
            : '⚠️ Partial',
      },

      // Validation Details
      validation_status: {
        contract_compliance: manifest.contract_compliance?.score || '0%',
        types_validation:
          manifest.specification_requirements?.validation_details
            ?.types_validation || 'UNKNOWN',
        lint_validation:
          manifest.specification_requirements?.validation_details
            ?.lint_validation || 'UNKNOWN',
        test_validation:
          manifest.specification_requirements?.validation_details
            ?.test_validation || 'UNKNOWN',
        schema_validation:
          manifest.specification_requirements?.validation_details
            ?.schema_validation || 'UNKNOWN',
      },

      // Business Logic Status
      business_logic: {
        module_initialization:
          manifest.specification_requirements?.business_logic
            ?.module_initialization || 'UNKNOWN',
        function_exports:
          manifest.specification_requirements?.business_logic
            ?.function_exports || 'UNKNOWN',
        appkit_patterns:
          manifest.contract_compliance?.imports_complete === 'COMPLETE'
            ? '✅ Complete'
            : '❌ Missing',
      },

      // Issues and Warnings
      issues: {
        blocking_issues: manifest.blocking_issues || [],
        warnings: manifest.warnings || [],
        blocking_count: (manifest.blocking_issues || []).length,
        can_deploy: manifest.active || false,
      },

      // Files Status
      // Files Status
      files: {
        contract_file: `${manifest.endpoint}.contract.ts`,
        logic_file: `${manifest.endpoint}.logic.ts`,
        test_file: `${manifest.endpoint}.test.ts`,
        manifest_file: `${manifest.endpoint}.manifest.json`,
        all_files_present: true, // Assuming they exist if manifest exists
      },
    };
  });

  return detailedSummary;
}

/**
 * Generate actionable recommendations based on compliance results
 */
function generateRecommendations(complianceResult) {
  const recommendations = [];

  // Specification implementation recommendations
  if (
    complianceResult.specification_implementation.business_logic_coverage < 90
  ) {
    recommendations.push({
      type: 'specification',
      priority: 'high',
      action: 'Improve business logic implementation',
      details:
        'Contract compliance scores below 90% - review endpoint implementations',
    });
  }

  // Deployment readiness recommendations
  if (complianceResult.deployment_readiness.blocking_issues_total > 0) {
    recommendations.push({
      type: 'deployment',
      priority: 'critical',
      action: 'Resolve blocking issues',
      details: `${complianceResult.deployment_readiness.blocking_issues_total} total blocking issues preventing deployment`,
    });
  }

  // Code quality recommendations
  if (
    Object.keys(complianceResult.code_analysis.method_duplication).length > 0
  ) {
    recommendations.push({
      type: 'refactoring',
      priority: 'medium',
      action: 'Reduce code duplication',
      details: 'Extract shared methods to helper functions',
    });
  }

  // VoilaJSX compliance recommendations
  if (complianceResult.code_analysis.voilajsx_compliance < 85) {
    recommendations.push({
      type: 'patterns',
      priority: 'medium',
      action: 'Improve VoilaJSX pattern compliance',
      details:
        'Ensure all endpoints follow VoilaJSX module initialization patterns',
    });
  }

  return recommendations;
}
