/**
 * FLUX Framework Compliance Command - Generic implementation validation driven by specification.json
 * @module @voilajsx/flux/scripts/commands/compliance
 * @file scripts/commands/compliance.js
 *
 * @llm-rule WHEN: Validating generated code against specification.json with configurable patterns and thresholds
 * @llm-rule AVOID: Hardcoding validation patterns - always read from specification.json for flexibility
 * @llm-rule NOTE: Fully generic, works with any VoilaJSX AppKit modules and configurable validation rules
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';
import { validateConfigurableReliability } from './helpers/compliance-validation.js';
import {
  generateConfigurableManifests,
  generateComprehensiveFeatureReports,
} from './helpers/compliance-manifest.js';

const log = createLogger('compliance');

/**
 * Generic compliance validation command driven by specification.json specifications
 * @llm-rule WHEN: Ensuring generated code matches implementation specifications with configurable validation
 * @llm-rule AVOID: Fixed validation logic - adapt to any specification.json configuration
 * @llm-rule NOTE: Supports any VoilaJSX AppKit modules and endpoint-specific validation requirements
 */
export default async function compliance(args) {
  const startTime = Date.now();
  const target = args[0];

  // Determine validation scope
  const validationScope = determineValidationScope(target);

  log.validationStart('compliance', target, [
    'implementation_loading',
    'generic_reliability_validation',
    'configurable_manifest_generation',
    'feature_reporting_with_analysis',
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
          'Create {feature}.specification.json files',
          'Ensure specification.json follows proper schema',
          'Check file permissions and paths',
        ]
      );
      return false;
    }

    log.checkPass('Implementation loading', implementationResult.duration, {
      features_loaded: implementationResult.implementations.length,
      total_endpoints: implementationResult.totalEndpoints,
    });

    // 2. Generic reliability validation
    log.checkStart('Configurable reliability validation');

    const reliabilityResult = await validateConfigurableReliability(
      implementationResult.implementations,
      validationScope
    );

    if (!reliabilityResult.success) {
      log.checkFail(
        'Reliability validation',
        reliabilityResult.duration,
        reliabilityResult.errors,
        [
          'Fix contract compliance issues based on specification.json',
          'Meet test coverage targets defined in validation_targets',
          'Resolve TypeScript compilation errors',
          'Address VoilaJSX pattern compliance issues',
        ]
      );
      return false;
    }

    log.checkPass('Reliability validation', reliabilityResult.duration, {
      endpoints_validated: reliabilityResult.endpointsValidated,
      average_reliability: reliabilityResult.averageReliability,
    });

    // 3. Generate configurable manifests
    log.checkStart('Configurable manifest generation');

    const manifestResult = await generateConfigurableManifests(
      implementationResult.implementations,
      reliabilityResult.endpointReliability,
      validationScope
    );

    if (!manifestResult.success) {
      log.checkFail(
        'Configurable manifest generation',
        manifestResult.duration,
        manifestResult.errors,
        ['Check endpoint structure and reliability validation results']
      );
      return false;
    }

    log.checkPass('Configurable manifest generation', manifestResult.duration, {
      manifests_generated: manifestResult.manifestsGenerated,
      endpoints_documented: manifestResult.endpointsDocumented,
    });

    // 4. Generate enhanced feature reports
    let reportResult = {
      success: true,
      reportsGenerated: 0,
      featuresDocumented: 0,
      reportPaths: [],
      duration: 0,
    };

    if (validationScope.type !== 'endpoint') {
      log.checkStart('Feature report generation with comprehensive analysis');

      reportResult = await generateComprehensiveFeatureReports(
        implementationResult.implementations,
        reliabilityResult.endpointReliability,
        manifestResult,
        validationScope
      );

      if (!reportResult.success) {
        log.checkFail(
          'Feature report generation',
          reportResult.duration,
          reportResult.errors,
          ['Check feature structure and reliability validation results']
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

    // SUCCESS - All configurable compliance checks passed
    const totalDuration = Date.now() - startTime;

    log.validationComplete('compliance', 'success', totalDuration, {
      total_features: implementationResult.implementations.length,
      total_endpoints: implementationResult.totalEndpoints,
      manifests: manifestResult.manifestsGenerated,
      reports: reportResult.reportsGenerated,
      scope: validationScope.type,
    });

    // Show comprehensive summary
    showComprehensiveComplianceSummary(
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
      `Generic compliance validation crashed: ${error.message}`,
      {
        command: 'compliance',
        error: error.message,
        duration: totalDuration,
        target,
        scope: validationScope?.type,
        stack: error.stack?.split('\n').slice(0, 3),
      },
      [
        'Check if specification.json files exist and are valid',
        'Verify generated code files are readable',
        'Ensure specification.json follows expected schema',
        'Check for missing validation_targets configuration',
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
        `${featureName}.specification.json`
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
 * Show comprehensive compliance summary with configuration details
 * @llm-rule WHEN: Displaying compliance results with configuration-driven insights
 * @llm-rule AVOID: Generic summaries - highlight configuration-driven validation
 * @llm-rule NOTE: Shows how specification.json drove the validation process
 */
function showComprehensiveComplianceSummary(
  implementationResult,
  reliabilityResult,
  manifestResult,
  reportResult,
  totalDuration,
  validationScope
) {
  log.human('');
  log.human('📊 Configurable Implementation Compliance Summary:');

  if (validationScope.type === 'endpoint') {
    log.human(
      `   Scope: ${validationScope.description} (${validationScope.target})`
    );
    log.human(`   Endpoint validated: 1`);
    log.human(`   Reliability score: ${reliabilityResult.averageReliability}%`);
    log.human(
      `   Configurable manifests: ${manifestResult.manifestsGenerated}`
    );
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
    log.human(
      `   Configurable manifests: ${manifestResult.manifestsGenerated}`
    );
    log.human(`   Comprehensive reports: ${reportResult.reportsGenerated}`);
  }

  log.human(`   Total time: ${totalDuration}ms`);
  log.human(
    `   Validation approach: Configuration-driven (specification.json)`
  );

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

  // Show configuration-driven insights
  log.human(' 🔧 Configuration-Driven Validation:');
  log.human('   ✅ VoilaJSX patterns from specification.json');
  log.human('   ✅ Reliability thresholds from validation_targets');
  log.human('   ✅ Endpoint-specific requirements supported');
  log.human('   ✅ Breaking change prevention configured');

  log.human('');

  // Show manifest paths
  if (manifestResult.manifestPaths.length > 0) {
    log.human(' 📄 Configurable manifests generated:');
    manifestResult.manifestPaths.forEach((path) => {
      const relativePath = path.replace(process.cwd() + '/', '');
      log.human(`   └── ${relativePath}`);
    });
  }

  // Show report paths
  if (reportResult.reportPaths && reportResult.reportPaths.length > 0) {
    log.human('');
    log.human(' 📋 Comprehensive reports with configuration analysis:');
    reportResult.reportPaths.forEach((path) => {
      const relativePath = path.replace(process.cwd() + '/', '');
      log.human(`   └── ${relativePath}`);
    });
  }

  log.human('');

  if (allReliable) {
    log.human('✅ Configurable compliance validation completed successfully');
    log.human(
      '🚀 Code meets all specification.json requirements and is deployment-ready'
    );
  } else {
    log.human('❌ Configurable compliance validation found reliability issues');
    log.human('🔧 Fix blocking issues above before deployment');
  }

  log.human('');
}
