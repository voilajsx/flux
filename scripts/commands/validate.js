/**
 * ATOM Framework Schema Validation - Blueprint, Agent, Implementation validation
 * @module @voilajsx/atom/scripts/commands/validate
 * @file scripts/commands/validate.js
 *
 * @llm-rule WHEN: Validating ATOM Framework schema files for consistency and completeness
 * @llm-rule AVOID: Runtime validation - this is design-time schema checking only
 * @llm-rule NOTE: Validates blueprint.yml, agent.yml, and implementation.json against schemas
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('validate');

/**
 * Schema validation command for ATOM Framework files
 * @llm-rule WHEN: Validating schema files before agent execution or deployment
 * @llm-rule AVOID: Starting work with invalid schemas - guarantees agent failures
 * @llm-rule NOTE: npm run atom:validate schema:blueprint|schema:agent|schema:implementation|all
 */
export default async function validate(args) {
  const startTime = Date.now();
  const target = args[0]; // schema:blueprint, schema:agent, schema:implementation, or all

  log.validationStart('validate', target, [
    'schema_discovery',
    'blueprint_validation',
    'agent_validation',
    'implementation_validation',
    'cross_reference_validation',
  ]);

  try {
    const validationResults = [];

    switch (target) {
      case 'schema:blueprint':
        validationResults.push(...(await validateBlueprintSchemas()));
        break;
      case 'schema:agent':
        validationResults.push(...(await validateAgentSchemas()));
        break;
      case 'schema:implementation':
        validationResults.push(...(await validateImplementationSchemas()));
        break;
      case 'all':
      default:
        validationResults.push(...(await validateAllSchemas()));
        break;
    }

    // Report results
    const allValid = reportValidationResults(validationResults);
    const totalDuration = Date.now() - startTime;

    if (allValid) {
      log.validationComplete('validate', 'success', totalDuration, {
        schemas_validated: validationResults.length,
        target,
      });
    } else {
      log.validationComplete('validate', 'failed', totalDuration, {
        schemas_validated: validationResults.length,
        failures: validationResults.filter((r) => !r.valid).length,
        target,
      });
    }

    return allValid;
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    log.error(`Schema validation crashed: ${error.message}`, {
      command: 'validate',
      error: error.message,
      duration: totalDuration,
      target,
    });
    return false;
  }
}

/**
 * Validates all schema types across all features
 */
async function validateAllSchemas() {
  const results = [];

  results.push(...(await validateBlueprintSchemas()));
  results.push(...(await validateAgentSchemas()));
  results.push(...(await validateImplementationSchemas()));

  // Cross-reference validation
  results.push(...(await validateCrossReferences()));

  return results;
}

/**
 * Validates blueprint.yml files against ATOM Blueprint Schema
 */
async function validateBlueprintSchemas() {
  const results = [];
  const features = await discoverFeatures();

  for (const feature of features) {
    const blueprintPath = join(
      process.cwd(),
      'src',
      'features',
      feature,
      `${feature}.blueprint.yml`
    );
    const result = await validateBlueprintFile(blueprintPath, feature);
    results.push(result);
  }

  return results;
}

/**
 * Validates agent.yml files against ATOM Agent Schema
 */
async function validateAgentSchemas() {
  const results = [];
  const features = await discoverFeatures();

  for (const feature of features) {
    const agentPath = join(
      process.cwd(),
      'src',
      'features',
      feature,
      `${feature}.agent.yml`
    );
    const result = await validateAgentFile(agentPath, feature);
    results.push(result);
  }

  return results;
}

/**
 * Validates implementation.json files against ATOM Implementation Schema
 */
async function validateImplementationSchemas() {
  const results = [];
  const features = await discoverFeatures();

  for (const feature of features) {
    const implementationPath = join(
      process.cwd(),
      'src',
      'features',
      feature,
      `${feature}.implementation.json`
    );
    const result = await validateImplementationFile(
      implementationPath,
      feature
    );
    results.push(result);
  }

  return results;
}

/**
 * Blueprint Schema Validation using JSON Schema
 */
async function validateBlueprintFile(filePath, feature) {
  const result = {
    type: 'blueprint',
    feature,
    file: `${feature}.blueprint.yml`,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    await stat(filePath);
    const content = await readFile(filePath, 'utf-8');
    const yaml = await import('js-yaml');
    const blueprint = yaml.load(content);

    // Load schema and validate
    const schemaPath = join(
      process.cwd(),
      'scripts',
      'schemas',
      'blueprint.schema.json'
    );
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    const Ajv = (await import('ajv')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(blueprint);

    if (!valid) {
      validate.errors.forEach((error) => {
        const path = error.instancePath || 'root';
        result.errors.push(`${path}: ${error.message}`);
      });
    }

    result.valid = valid;
  } catch (error) {
    result.valid = false;
    result.errors.push(`File validation failed: ${error.message}`);
  }

  return result;
}

/**
 * Agent Schema Validation using JSON Schema
 */
async function validateAgentFile(filePath, feature) {
  const result = {
    type: 'agent',
    feature,
    file: `${feature}.agent.yml`,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    await stat(filePath);
    const content = await readFile(filePath, 'utf-8');
    const yaml = await import('js-yaml');
    const agent = yaml.load(content);

    // Load schema and validate
    const schemaPath = join(
      process.cwd(),
      'scripts',
      'schemas',
      'agent.schema.json'
    );
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    const Ajv = (await import('ajv')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(agent);

    if (!valid) {
      validate.errors.forEach((error) => {
        const path = error.instancePath || 'root';
        result.errors.push(`${path}: ${error.message}`);
      });
    }

    result.valid = valid;
  } catch (error) {
    result.valid = false;
    result.errors.push(`File validation failed: ${error.message}`);
  }

  return result;
}

/**
 * Implementation Schema Validation using JSON Schema
 */
async function validateImplementationFile(filePath, feature) {
  const result = {
    type: 'implementation',
    feature,
    file: `${feature}.implementation.json`,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    await stat(filePath);
    const content = await readFile(filePath, 'utf-8');
    const implementation = JSON.parse(content);

    // Load schema and validate
    const schemaPath = join(
      process.cwd(),
      'scripts',
      'schemas',
      'implementation.schema.json'
    );
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    const Ajv = (await import('ajv')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(implementation);

    if (!valid) {
      validate.errors.forEach((error) => {
        const path = error.instancePath || 'root';
        result.errors.push(`${path}: ${error.message}`);
      });
    }

    result.valid = valid;
  } catch (error) {
    result.valid = false;
    result.errors.push(`File validation failed: ${error.message}`);
  }

  return result;
}

/**
 * Cross-reference validation between files
 */
async function validateCrossReferences() {
  const results = [];
  const features = await discoverFeatures();

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
      const blueprintPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.blueprint.yml`
      );
      const agentPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.agent.yml`
      );
      const implementationPath = join(
        process.cwd(),
        'src',
        'features',
        feature,
        `${feature}.implementation.json`
      );

      const yaml = await import('js-yaml');

      let blueprint, agent, implementation;

      try {
        const blueprintContent = await readFile(blueprintPath, 'utf-8');
        blueprint = yaml.load(blueprintContent);
      } catch (error) {
        result.errors.push(`Cannot load blueprint: ${error.message}`);
      }

      try {
        const agentContent = await readFile(agentPath, 'utf-8');
        agent = yaml.load(agentContent);
      } catch (error) {
        result.errors.push(`Cannot load agent: ${error.message}`);
      }

      try {
        const implementationContent = await readFile(
          implementationPath,
          'utf-8'
        );
        implementation = JSON.parse(implementationContent);
      } catch (error) {
        result.errors.push(`Cannot load implementation: ${error.message}`);
      }

      // Cross-validation checks
      if (blueprint && agent && implementation) {
        // Feature name consistency
        if (
          blueprint.name !== agent.feature ||
          agent.feature !== implementation.feature
        ) {
          result.errors.push('Feature name mismatch across files');
        }

        // User stories vs endpoints mapping
        const userStoryCount = blueprint.user_stories?.length || 0;
        const endpointCount = Object.keys(
          implementation.endpoints || {}
        ).length;

        if (userStoryCount > 0 && endpointCount === 0) {
          result.errors.push(
            'User stories defined but no endpoints implemented'
          );
        }

        // Agent tasks vs implementation endpoints
        const taskCount = Object.keys(agent.tasks || {}).length;
        if (taskCount < endpointCount * 3) {
          // Rough estimate: contract + logic + tests per endpoint
          result.warnings.push(
            'Agent tasks might be insufficient for endpoint implementation'
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
 * Report validation results with detailed summary
 */
function reportValidationResults(results) {
  let allValid = true;
  const summary = {
    blueprint: { total: 0, valid: 0, errors: 0 },
    agent: { total: 0, valid: 0, errors: 0 },
    implementation: { total: 0, valid: 0, errors: 0 },
    'cross-reference': { total: 0, valid: 0, errors: 0 },
  };

  console.log('\n📋 ATOM Framework Schema Validation Results\n');

  results.forEach((result) => {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${result.type}: ${result.feature} (${result.file})`);

    // Update summary
    summary[result.type].total++;
    if (result.valid) {
      summary[result.type].valid++;
    } else {
      allValid = false;
    }
    summary[result.type].errors += result.errors.length;

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
