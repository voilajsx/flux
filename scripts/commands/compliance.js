/**
 * FLUX Framework Compliance Command - Generic implementation validation driven by specification.json
 * @module @voilajsx/flux/scripts/commands/compliance
 * @file scripts/commands/compliance.js
 *
 * @llm-rule WHEN: Validating generated code against specification.json with configurable patterns and thresholds
 * @llm-rule AVOID: Hardcoding validation patterns - always read from specification.json for flexibility
 * @llm-rule NOTE: Fully generic, works with any VoilaJSX AppKit modules and configurable validation rules with unified file-path syntax
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
 * Parse target argument with unified file-path syntax support
 * @llm-rule WHEN: Processing command arguments to determine scope
 * @llm-rule AVOID: Complex parsing - keep simple and predictable
 * @llm-rule NOTE: Supports feature, endpoint, and specific file targeting
 */
function parseTarget(target) {
  if (!target) {
    return { type: 'all', description: 'all features' };
  }

  // Handle specific file targeting (hello/main.logic.ts)
  if (target.includes('.') && target.includes('/')) {
    const lastSlash = target.lastIndexOf('/');
    const pathPart = target.slice(0, lastSlash);
    const filePart = target.slice(lastSlash + 1);

    // Parse the file part to get endpoint name
    // main.logic.ts -> main
    const fileNameParts = filePart.split('.');
    const endpoint = fileNameParts[0];

    // For simple paths like "weather/main.logic.ts", pathPart is "weather"
    const feature = pathPart;

    return {
      type: 'file',
      feature,
      endpoint,
      fileName: filePart,
      description: `specific file ${filePart}`,
      path: target,
      generateReports: false,
    };
  }

  // Handle feature specification files (hello.specification.json)
  if (target.includes('.') && !target.includes('/')) {
    const [feature, fileType, extension] = target.split('.');

    return {
      type: 'feature-file',
      feature,
      fileType,
      extension,
      description: `feature specification ${target}`,
      path: target,
      generateReports: false,
    };
  }

  // Handle endpoint targeting (hello/main)
  if (target.includes('/')) {
    const [feature, endpoint] = target.split('/');
    return {
      type: 'endpoint',
      feature,
      endpoint,
      description: `${feature}/${endpoint} endpoint`,
      path: `src/features/${feature}/${endpoint}`,
      generateReports: false,
    };
  }

  // Handle feature targeting (hello)
  return {
    type: 'feature',
    feature: target,
    description: `${target} feature`,
    path: `src/features/${target}`,
    generateReports: true,
  };
}

/**
 * Generic compliance validation command driven by specification.json specifications
 * @llm-rule WHEN: Ensuring generated code matches implementation specifications with configurable validation
 * @llm-rule AVOID: Fixed validation logic - adapt to any specification.json configuration
 * @llm-rule NOTE: Supports any VoilaJSX AppKit modules and endpoint-specific validation requirements
 */
export default async function compliance(args) {
  const startTime = Date.now();
  const target = args[0];
  const targetInfo = parseTarget(target);

  try {
    // Validate target exists if specified
    if (targetInfo.type !== 'all') {
      const featuresPath = join(process.cwd(), 'src', 'features');

      if (targetInfo.type === 'file') {
        // Validate specific file exists
        const filePath = join(
          process.cwd(),
          'src',
          'features',
          targetInfo.feature,
          targetInfo.endpoint,
          targetInfo.fileName
        );
        try {
          await stat(filePath);
        } catch (error) {
          log.human(
            `❌ File '${targetInfo.feature}/${targetInfo.endpoint}/${targetInfo.fileName}' not found`
          );
          return false;
        }
      } else if (targetInfo.type === 'feature-file') {
        // Validate feature specification file exists
        const filePath = join(
          featuresPath,
          targetInfo.feature,
          `${targetInfo.feature}.${targetInfo.fileType}.${targetInfo.extension}`
        );
        try {
          await stat(filePath);
        } catch (error) {
          log.human(`❌ Feature file '${targetInfo.path}' not found`);
          return false;
        }
      } else if (targetInfo.type === 'endpoint') {
        // Validate endpoint exists
        const featurePath = join(featuresPath, targetInfo.feature);
        const endpointPath = join(featurePath, targetInfo.endpoint);

        try {
          await stat(featurePath);
          await stat(endpointPath);
        } catch (error) {
          log.human(
            `❌ Endpoint '${targetInfo.feature}/${targetInfo.endpoint}' not found`
          );
          return false;
        }
      } else if (targetInfo.type === 'feature') {
        // Validate feature exists
        const featurePath = join(featuresPath, targetInfo.feature);

        try {
          await stat(featurePath);
        } catch (error) {
          log.human(`❌ Feature '${targetInfo.feature}' not found`);
          return false;
        }
      }
    }

    // 1. Load implementation specifications
    const implementationResult = await loadImplementationSpecs(
      target,
      targetInfo
    );

    if (!implementationResult.success) {
      log.human(`❌ Implementation loading failed`);
      implementationResult.errors.forEach((error) => {
        log.human(`   ${error}`);
      });
      return false;
    }

    // 2. Generic reliability validation
    const reliabilityResult = await validateConfigurableReliability(
      implementationResult.implementations,
      targetInfo
    );

    if (!reliabilityResult.success) {
      log.human(`❌ Reliability validation failed`);
      reliabilityResult.errors.forEach((error) => {
        log.human(`   ${error}`);
      });
      return false;
    }

    // 3. Generate configurable manifests
    const manifestResult = await generateConfigurableManifests(
      implementationResult.implementations,
      reliabilityResult.endpointReliability,
      targetInfo
    );

    if (!manifestResult.success) {
      log.human(`❌ Manifest generation failed`);
      manifestResult.errors.forEach((error) => {
        log.human(`   ${error}`);
      });
      return false;
    }

    // 4. Feature reporting and comprehensive analysis
    if (targetInfo.generateReports) {
      const reportResult = await generateComprehensiveFeatureReports(
        implementationResult.implementations,
        reliabilityResult.endpointReliability,
        targetInfo
      );

      if (!reportResult.success) {
        log.human(`❌ Feature reporting failed`);
        reportResult.errors.forEach((error) => {
          log.human(`   ${error}`);
        });
        return false;
      }
    }

    const duration = Date.now() - startTime;
    log.human(
      `✅ Compliance validation passed for ${targetInfo.description} (${duration}ms)`
    );

    // Show summary
    if (implementationResult.implementations.length > 0) {
      log.human(
        `📊 Validated ${implementationResult.totalEndpoints} endpoints across ${implementationResult.implementations.length} features`
      );
      log.human(
        `📝 Generated ${manifestResult.manifestsGenerated || 0} manifests`
      );

      if (targetInfo.generateReports) {
        log.human(`📋 Created comprehensive feature reports`);
      }
    }

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.human(
      `❌ Compliance validation error (${duration}ms): ${error.message}`
    );
    return false;
  }
}

/**
 * Load implementation specifications with scope filtering
 * @llm-rule WHEN: Loading implementation specs to validate against generated code
 * @llm-rule AVOID: Loading all implementations for endpoint-level validation
 * @llm-rule NOTE: Filters implementations based on validation scope for efficiency
 */
async function loadImplementationSpecs(target, targetInfo) {
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
      // Feature, endpoint, or file validation - load specific feature only
      const featureName = targetInfo.feature;
      featuresToLoad = [featureName];
    }

    for (const featureName of featuresToLoad) {
      if (featureName.startsWith('_') || featureName.startsWith('.')) {
        continue; // Skip system files and directories
      }

      const featurePath = join(featuresPath, featureName);

      try {
        const featureStat = await stat(featurePath);
        if (!featureStat.isDirectory()) continue;

        // Load feature specification
        const specPath = join(featurePath, `${featureName}.specification.json`);

        try {
          const specContent = await readFile(specPath, 'utf-8');
          const specification = JSON.parse(specContent);

          // Validate specification has required structure
          if (
            !specification.implementation ||
            !specification.implementation.endpoints
          ) {
            errors.push(
              `${featureName}: specification.json missing implementation.endpoints`
            );
            continue;
          }

          // Filter endpoints based on validation scope if targeting specific endpoint or file
          let endpointsToValidate = specification.implementation.endpoints;

          if (targetInfo.type === 'endpoint' || targetInfo.type === 'file') {
            endpointsToValidate = specification.implementation.endpoints.filter(
              (endpoint) => endpoint.name === targetInfo.endpoint
            );
          }

          const implementation = {
            feature: featureName,
            specification: specification,
            endpoints: endpointsToValidate,
            featurePath: featurePath,
          };

          implementations.push(implementation);
          totalEndpoints += endpointsToValidate.length;
        } catch (specError) {
          errors.push(
            `${featureName}: Failed to load specification.json - ${specError.message}`
          );
        }
      } catch (featureError) {
        errors.push(
          `${featureName}: Failed to access feature directory - ${featureError.message}`
        );
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
      errors: [`Failed to load features: ${error.message}`],
      duration: Date.now() - startTime,
    };
  }
}
