/**
 * FLUX Framework Schema Validation - Requirements, Instructions, Specification validation
 * @module @voilajsx/flux/scripts/commands/schema
 * @file scripts/commands/schema.js
 *
 * @llm-rule WHEN: Validating FLUX Framework schema files for consistency and completeness
 * @llm-rule AVOID: Runtime validation - this is design-time schema checking only
 * @llm-rule NOTE: Validates requirements.yml, instructions.yml, and specification.json against schemas
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('schema');

/**
 * Schema validation command for FLUX Framework files with colon syntax support
 * @llm-rule WHEN: Validating schema files before agent execution or deployment
 * @llm-rule AVOID: Starting work with invalid schemas - guarantees agent failures
 * @llm-rule NOTE: npm run flux:schema [feature[:type]]
 *
 * Examples:
 * - npm run flux:schema                    # All features, all schemas
 * - npm run flux:schema hello              # Hello feature, all schemas
 * - npm run flux:schema hello:requirements # Hello feature, requirements only
 */
export default async function schema(args) {
  const startTime = Date.now();
  const target = args[0]; // Can be: undefined, "hello", "hello:requirements", etc.

  // Parse the target argument
  const scope = parseTarget(target);

  log.validationStart('schema', scope.description, [
    'scope_parsing',
    'feature_discovery',
    'schema_validation',
    'cross_reference_validation',
  ]);

  try {
    const validationResults = [];

    // Execute validation based on parsed scope
    if (scope.feature && scope.schemaType) {
      // Single file validation: hello:requirements
      validationResults.push(
        ...(await validateSingleSchema(scope.feature, scope.schemaType))
      );
    } else if (scope.feature) {
      // Single feature validation: hello
      validationResults.push(...(await validateFeatureSchemas(scope.feature)));
    } else {
      // All features validation: (no args)
      validationResults.push(...(await validateAllSchemas()));
    }

    // Report results
    const allValid = reportValidationResults(validationResults, scope);
    const totalDuration = Date.now() - startTime;

    if (allValid) {
      log.validationComplete('schema', 'success', totalDuration, {
        schemas_validated: validationResults.length,
        scope: scope.description,
      });
    } else {
      log.validationComplete('schema', 'failed', totalDuration, {
        schemas_validated: validationResults.length,
        failures: validationResults.filter((r) => !r.valid).length,
        scope: scope.description,
      });
    }

    return allValid;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log.error(`Schema validation crashed: ${error.message}`, {
      command: 'schema',
      error: error.message,
      duration: totalDuration,
      scope: scope.description,
    });
    return false;
  }
}

/**
 * Parse target argument with colon syntax support
 * @llm-rule WHEN: Processing command arguments to determine validation scope
 * @llm-rule AVOID: Complex parsing - keep simple and predictable
 * @llm-rule NOTE: Supports feature:type syntax like "hello:requirements"
 */
function parseTarget(target) {
  if (!target) {
    return {
      type: 'all',
      description: 'all features, all schemas',
      feature: null,
      schemaType: null,
    };
  }

  if (target.includes(':')) {
    const [feature, schemaType] = target.split(':');

    // Validate schema type
    const validTypes = ['requirements', 'instructions', 'specification'];
    if (!validTypes.includes(schemaType)) {
      throw new Error(
        `Invalid schema type: ${schemaType}. Valid types: ${validTypes.join(', ')}`
      );
    }

    return {
      type: 'single-schema',
      description: `${feature} feature, ${schemaType} schema only`,
      feature: feature,
      schemaType: schemaType,
    };
  }

  return {
    type: 'single-feature',
    description: `${target} feature, all schemas`,
    feature: target,
    schemaType: null,
  };
}

/**
 * Validate single schema file for specific feature
 * @llm-rule WHEN: User requests specific file validation like "hello:requirements"
 * @llm-rule AVOID: Loading unnecessary schemas - only validate requested file
 * @llm-rule NOTE: Most efficient validation for development workflow
 */
async function validateSingleSchema(feature, schemaType) {
  const results = [];

  // Check if feature exists
  const featureExists = await checkFeatureExists(feature);
  if (!featureExists) {
    results.push({
      type: schemaType,
      feature: feature,
      file: `${feature}.${schemaType}.yml/json`,
      valid: false,
      errors: [`Feature '${feature}' not found in src/features/`],
      warnings: [],
    });
    return results;
  }

  // Validate the specific schema type
  switch (schemaType) {
    case 'requirements':
      const requirementsPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.requirements.yml`
      );
      results.push(await validateRequirementsFile(requirementsPath, feature));
      break;
    case 'instructions':
      const instructionsPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.instructions.yml`
      );
      results.push(await validateInstructionsFile(instructionsPath, feature));
      break;
    case 'specification':
      const specificationPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.specification.json`
      );
      results.push(await validateSpecificationFile(specificationPath, feature));
      break;
  }

  return results;
}

/**
 * Validate all schemas for a specific feature
 * @llm-rule WHEN: User requests feature-level validation like "hello"
 * @llm-rule AVOID: Validating other features - scope to requested feature only
 * @llm-rule NOTE: Includes cross-reference validation within the feature
 */
async function validateFeatureSchemas(feature) {
  const results = [];

  // Check if feature exists
  const featureExists = await checkFeatureExists(feature);
  if (!featureExists) {
    results.push({
      type: 'feature',
      feature: feature,
      file: `${feature} feature`,
      valid: false,
      errors: [`Feature '${feature}' not found in src/features/`],
      warnings: [],
    });
    return results;
  }

  // Validate all schema files for this feature
  const requirementsPath = join(
    process.cwd(),
    'src',
    'features',
    feature,
    `${feature}.requirements.yml`
  );
  const instructionsPath = join(
    process.cwd(),
    'src',
    'features',
    feature,
    `${feature}.instructions.yml`
  );
  const specificationPath = join(
    process.cwd(),
    'src',
    'features',
    feature,
    `${feature}.specification.json`
  );

  results.push(await validateRequirementsFile(requirementsPath, feature));
  results.push(await validateInstructionsFile(instructionsPath, feature));
  results.push(await validateSpecificationFile(specificationPath, feature));

  // Add cross-reference validation for this feature
  results.push(...(await validateCrossReferences([feature])));

  return results;
}

/**
 * Validate all schemas across all features
 * @llm-rule WHEN: User requests complete project validation with no arguments
 * @llm-rule AVOID: Skipping any features - validate everything for deployment readiness
 * @llm-rule NOTE: Most comprehensive validation including cross-feature validation
 */
async function validateAllSchemas() {
  const results = [];
  const features = await discoverFeatures();

  if (features.length === 0) {
    results.push({
      type: 'system',
      feature: 'discovery',
      file: 'feature discovery',
      valid: false,
      errors: ['No features found in src/features/ directory'],
      warnings: [],
    });
    return results;
  }

  // Validate all schema files for all features
  for (const feature of features) {
    const requirementsPath = join(
      process.cwd(),
      'src',
      'features',
      feature,
      `${feature}.requirements.yml`
    );
    const instructionsPath = join(
      process.cwd(),
      'src',
      'features',
      feature,
      `${feature}.instructions.yml`
    );
    const specificationPath = join(
      process.cwd(),
      'src',
      'features',
      feature,
      `${feature}.specification.json`
    );

    results.push(await validateRequirementsFile(requirementsPath, feature));
    results.push(await validateInstructionsFile(instructionsPath, feature));
    results.push(await validateSpecificationFile(specificationPath, feature));
  }

  // Add cross-reference validation for all features
  results.push(...(await validateCrossReferences(features)));

  return results;
}

/**
 * Check if a feature directory exists
 * @llm-rule WHEN: Validating user input before attempting file operations
 * @llm-rule AVOID: Assuming features exist - always check first
 * @llm-rule NOTE: Prevents confusing error messages from file operations
 */
async function checkFeatureExists(feature) {
  try {
    const featurePath = join(process.cwd(), 'src', 'features', feature);
    const featureStat = await stat(featurePath);
    return featureStat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Requirements Schema Validation using JSON Schema
 */
async function validateRequirementsFile(filePath, feature) {
  const result = {
    type: 'requirements',
    feature,
    file: `${feature}.requirements.yml`,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    await stat(filePath);
    const content = await readFile(filePath, 'utf-8');
    const yaml = await import('js-yaml');
    const requirements = yaml.load(content);

    // Load schema and validate
    const schemaPath = join(
      process.cwd(),
      'scripts',
      'schemas',
      'requirements.schema.json'
    );
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    const Ajv = (await import('ajv')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(requirements);

    if (!valid) {
      validate.errors.forEach((error) => {
        const path = error.instancePath || 'root';
        result.errors.push(`${path}: ${error.message}`);
      });
    }

    result.valid = valid;
  } catch (error) {
    result.valid = false;
    if (error.code === 'ENOENT') {
      result.errors.push(`Requirements file not found: ${result.file}`);
    } else {
      result.errors.push(`Requirements validation failed: ${error.message}`);
    }
  }

  return result;
}

/**
 * Instructions Schema Validation using JSON Schema
 */
async function validateInstructionsFile(filePath, feature) {
  const result = {
    type: 'instructions',
    feature,
    file: `${feature}.instructions.yml`,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    await stat(filePath);
    const content = await readFile(filePath, 'utf-8');
    const yaml = await import('js-yaml');
    const instructions = yaml.load(content);

    // Load schema and validate
    const schemaPath = join(
      process.cwd(),
      'scripts',
      'schemas',
      'instructions.schema.json'
    );
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    const Ajv = (await import('ajv')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(instructions);

    if (!valid) {
      validate.errors.forEach((error) => {
        const path = error.instancePath || 'root';
        result.errors.push(`${path}: ${error.message}`);
      });
    }

    result.valid = valid;
  } catch (error) {
    result.valid = false;
    if (error.code === 'ENOENT') {
      result.errors.push(`Instructions file not found: ${result.file}`);
    } else {
      result.errors.push(`Instructions validation failed: ${error.message}`);
    }
  }

  return result;
}

/**
 * Specification Schema Validation using JSON Schema
 */
async function validateSpecificationFile(filePath, feature) {
  const result = {
    type: 'specification',
    feature,
    file: `${feature}.specification.json`,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    await stat(filePath);
    const content = await readFile(filePath, 'utf-8');
    const specification = JSON.parse(content);

    // Load schema and validate
    const schemaPath = join(
      process.cwd(),
      'scripts',
      'schemas',
      'specification.schema.json'
    );
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    const Ajv = (await import('ajv')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(specification);

    if (!valid) {
      validate.errors.forEach((error) => {
        const path = error.instancePath || 'root';
        result.errors.push(`${path}: ${error.message}`);
      });
    }

    result.valid = valid;
  } catch (error) {
    result.valid = false;
    if (error.code === 'ENOENT') {
      result.errors.push(`Specification file not found: ${result.file}`);
    } else {
      result.errors.push(`Specification validation failed: ${error.message}`);
    }
  }

  return result;
}

/**
 * Cross-reference validation between files for specified features
 * @llm-rule WHEN: Ensuring consistency between requirements, instructions, and specification
 * @llm-rule AVOID: Cross-validating unrelated features - scope to requested features only
 * @llm-rule NOTE: Critical for maintaining feature coherence and preventing mismatches
 */
async function validateCrossReferences(features) {
  const results = [];

  for (const feature of features) {
    const result = {
      type: 'cross-reference',
      feature,
      file: `${feature} cross-validation`,
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Load all three files
      const requirementsPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.requirements.yml`
      );
      const instructionsPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.instructions.yml`
      );
      const specificationPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.specification.json`
      );

      const yaml = await import('js-yaml');
      let requirements, instructions, specification;

      try {
        const requirementsContent = await readFile(requirementsPath, 'utf-8');
        requirements = yaml.load(requirementsContent);
      } catch (error) {
        result.errors.push(`Cannot load requirements: ${error.message}`);
      }

      try {
        const instructionsContent = await readFile(instructionsPath, 'utf-8');
        instructions = yaml.load(instructionsContent);
      } catch (error) {
        result.errors.push(`Cannot load instructions: ${error.message}`);
      }

      try {
        const specificationContent = await readFile(specificationPath, 'utf-8');
        specification = JSON.parse(specificationContent);
      } catch (error) {
        result.errors.push(`Cannot load specification: ${error.message}`);
      }

      // Cross-validation checks
      if (requirements && instructions && specification) {
        // Feature name consistency
        if (
          requirements.name !== instructions.feature ||
          instructions.feature !== specification.feature
        ) {
          result.errors.push(
            `Feature name mismatch: requirements="${requirements.name}", instructions="${instructions.feature}", specification="${specification.feature}"`
          );
        }

        // User stories vs endpoints mapping
        const userStoryCount = requirements.user_stories?.length || 0;
        const endpointCount = Object.keys(specification.endpoints || {}).length;

        if (userStoryCount > 0 && endpointCount === 0) {
          result.errors.push(
            'User stories defined but no endpoints implemented'
          );
        }

        // Instructions tasks vs specification endpoints
        const taskCount = Object.keys(instructions.tasks || {}).length;
        if (taskCount < endpointCount * 3) {
          // Rough estimate: contract + logic + tests per endpoint
          result.warnings.push(
            `Instructions tasks (${taskCount}) might be insufficient for endpoint implementation (${endpointCount} endpoints)`
          );
        }
      }

      result.valid = result.errors.length === 0;
    } catch (error) {
      result.valid = false;
      result.errors.push(`Cross-reference validation failed: ${error.message}`);
    }

    results.push(result);
  }

  return results;
}

/**
 * Discover all features for validation
 * @llm-rule WHEN: Finding available features for validation
 * @llm-rule AVOID: Including disabled features (underscore prefix) - skip for performance
 * @llm-rule NOTE: Only returns enabled features that can be validated
 */
async function discoverFeatures() {
  const features = [];
  const featuresPath = join(process.cwd(), 'src', 'features');

  try {
    const items = await readdir(featuresPath);

    for (const item of items) {
      if (item.startsWith('_') || item.startsWith('.')) continue;

      const itemPath = join(featuresPath, item);
      const itemStat = await stat(itemPath);

      if (itemStat.isDirectory()) {
        features.push(item);
      }
    }
  } catch (error) {
    log.warn('Cannot read features directory', { error: error.message });
  }

  return features;
}

/**
 * Report validation results with scope-aware summary
 * @llm-rule WHEN: Displaying validation results with context about what was validated
 * @llm-rule AVOID: Generic summaries - tailor output to validation scope
 * @llm-rule NOTE: Helps users understand exactly what was checked
 */
function reportValidationResults(results, scope) {
  let allValid = true;
  const summary = {
    requirements: { total: 0, valid: 0, errors: 0 },
    instructions: { total: 0, valid: 0, errors: 0 },
    specification: { total: 0, valid: 0, errors: 0 },
    'cross-reference': { total: 0, valid: 0, errors: 0 },
    feature: { total: 0, valid: 0, errors: 0 },
    system: { total: 0, valid: 0, errors: 0 },
  };

  console.log('\n📋 FLUX Framework Schema Validation Results');
  console.log(`   Scope: ${scope.description}\n`);

  results.forEach((result) => {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${result.type}: ${result.feature} (${result.file})`);

    // Update summary
    if (summary[result.type]) {
      summary[result.type].total++;
      if (result.valid) {
        summary[result.type].valid++;
      } else {
        allValid = false;
      }
      summary[result.type].errors += result.errors.length;
    }

    // Show errors
    if (result.errors.length > 0) {
      result.errors.forEach((error) => {
        console.log(`   ❌ ${error}`);
      });
    }

    // Show warnings
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        console.log(`   ⚠️  ${warning}`);
      });
    }

    if (
      result.valid &&
      result.errors.length === 0 &&
      result.warnings.length === 0
    ) {
      console.log(`   ✅ Schema validation passed`);
    }

    console.log('');
  });

  // Summary
  console.log('📊 Schema Validation Summary:');
  Object.entries(summary).forEach(([type, stats]) => {
    if (stats.total > 0) {
      console.log(
        `   ${type}: ${stats.valid}/${stats.total} valid (${stats.errors} errors)`
      );
    }
  });
  console.log('');

  if (!allValid) {
    console.log('❌ Schema validation FAILED - fix errors above');
  } else {
    console.log('✅ All schemas valid - ready for agent execution');
  }

  return allValid;
}
