/**
 * FLUX Framework Schema Validation - Requirements, Instructions, Specification, Contract validation
 * @module @voilajsx/flux/scripts/commands/schema
 * @file scripts/commands/schema.js
 *
 * @llm-rule WHEN: Validating FLUX Framework schema files for consistency and completeness
 * @llm-rule AVOID: Runtime validation - this is design-time schema checking only
 * @llm-rule NOTE: Validates requirements.yml, instructions.yml, specification.json, and {endpoint}.contract.ts with unified file-path syntax
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('schema');

/**
 * Schema validation command for FLUX Framework files with unified file-path syntax
 * @llm-rule WHEN: Validating schema files before agent execution or deployment
 * @llm-rule AVOID: Starting work with invalid schemas - guarantees agent failures
 * @llm-rule NOTE: npm run flux:schema [target]
 *
 * Examples:
 * - npm run flux:schema                           # All features, all schemas
 * - npm run flux:schema hello                     # Hello feature, all schemas
 * - npm run flux:schema hello.requirements.yml   # Hello feature, requirements only
 * - npm run flux:schema hello.instructions.yml   # Hello feature, instructions only
 * - npm run flux:schema hello.specification.json # Hello feature, specification only
 * - npm run flux:schema hello/main.contract.ts   # Specific contract file
 */
export default async function schema(args) {
  const startTime = Date.now();
  const target = args[0];
  const scope = parseTarget(target);

  try {
    const results = [];

    // Execute validation based on scope
    if (scope.type === 'single') {
      results.push(
        ...(await validateSingleSchema(scope.appname, scope.version, scope.feature, scope.schemaType))
      );
    } else if (scope.type === 'contract-file') {
      results.push(
        await validateContractFile(
          join(
            process.cwd(),
            'src',
            'api',
            scope.appname,
            scope.version,
            scope.feature,
            scope.endpoint,
            scope.fileName
          ),
          scope.appname,
          scope.version,
          scope.feature,
          scope.endpoint
        )
      );
    } else if (scope.feature) {
      results.push(...(await validateFeatureSchemas(scope.appname, scope.version, scope.feature)));
    } else {
      results.push(...(await validateAllSchemas()));
    }

    // Clean, minimal output
    reportResults(results, Date.now() - startTime);

    return results.every((r) => r.valid);
  } catch (error) {
    console.log(`❌ Schema validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Parse target path to extract app, version, feature, and endpoint components
 * @llm-rule WHEN: Processing command arguments to support multi-app architecture
 * @llm-rule AVOID: Legacy path support - enforce multi-app format only
 * @llm-rule NOTE: Follows patterns documented in docs/FLUX_COMMANDS.md
 */
function parseTarget(target) {
  if (!target) {
    return {
      type: 'all',
      description: 'all apps and features, all schemas',
      appname: null,
      version: null,
      feature: null,
      schemaType: null,
    };
  }

  const pathParts = target.split('/');

  // Handle contract file targeting (greeting/v1/hello/main.contract.ts)
  if (target.includes('/') && target.includes('.contract.')) {
    const lastSlash = target.lastIndexOf('/');
    const pathPart = target.slice(0, lastSlash);
    const filePart = target.slice(lastSlash + 1);
    
    const pathPartParts = pathPart.split('/');
    if (pathPartParts.length < 3) {
      throw new Error(`Invalid contract file path format: ${target}. Expected: {app}/{version}/{feature}/{endpoint}/{file}`);
    }

    // Parse the file part to get endpoint name
    // main.contract.ts -> main
    const fileNameParts = filePart.split('.');
    const endpoint = fileNameParts[0];

    return {
      type: 'contract-file',
      description: `contract file ${filePart}`,
      appname: pathPartParts[0],
      version: pathPartParts[1],
      feature: pathPartParts[2],
      endpoint: pathPartParts[3] || endpoint,
      fileName: filePart,
      fullPath: `src/api/${pathPartParts[0]}/${pathPartParts[1]}/${pathPartParts[2]}/${pathPartParts[3] || endpoint}/${filePart}`,
    };
  }

  // Handle feature schema file syntax (greeting/v1/hello.requirements.yml)
  if (target.includes('.') && target.includes('/')) {
    const lastDot = target.lastIndexOf('.');
    const beforeLastDot = target.lastIndexOf('.', lastDot - 1);
    
    if (beforeLastDot === -1) {
      throw new Error(`Invalid schema file format: ${target}. Expected: {app}/{version}/{feature}.{type}.{ext}`);
    }

    const pathAndFeature = target.slice(0, beforeLastDot);
    const type = target.slice(beforeLastDot + 1, lastDot);
    const extension = target.slice(lastDot + 1);

    const pathParts = pathAndFeature.split('/');
    if (pathParts.length < 3) {
      throw new Error(`Invalid schema file path format: ${target}. Expected: {app}/{version}/{feature}.{type}.{ext}`);
    }

    const appname = pathParts[0];
    const version = pathParts[1];
    const feature = pathParts[2];

    // Validate file-path syntax
    const validCombinations = {
      'requirements.yml': 'requirements',
      'instructions.yml': 'instructions',
      'specification.json': 'specification',
      'manifest.json': 'manifest',
    };

    const fileTypePart = `${type}.${extension}`;
    if (!validCombinations[fileTypePart]) {
      throw new Error(
        `Invalid file-path syntax: ${target}. Valid formats: {app}/{version}/{feature}.requirements.yml, {app}/{version}/{feature}.instructions.yml, {app}/{version}/{feature}.specification.json`
      );
    }

    return {
      type: 'single',
      description: `${appname}/${version}/${feature}.${type}.${extension}`,
      appname,
      version,
      feature,
      schemaType: validCombinations[fileTypePart],
      fullPath: `src/api/${appname}/${version}/${feature}/${feature}.${type}.${extension}`,
    };
  }

  if (pathParts.length >= 3) {
    // Multi-app format: {app}/{version}/{feature}
    const appname = pathParts[0];
    const version = pathParts[1];
    const feature = pathParts[2];

    return {
      type: 'feature',
      description: `${appname}/${version}/${feature} feature, all schemas`,
      appname,
      version,
      feature,
      schemaType: null,
      fullPath: `src/api/${appname}/${version}/${feature}`,
    };
  } else {
    // Invalid format - require full app/version/feature path
    throw new Error(`Invalid path format: ${target}. Expected: {app}/{version}/{feature} or {app}/{version}/{feature}.{type}.{ext}`);
  }
}

/**
 * Validate single schema file for specific feature and type
 * @llm-rule WHEN: User specifies exact schema file with file-path syntax
 * @llm-rule AVOID: Validating other files when user requests specific schema
 * @llm-rule NOTE: Fast validation for development workflow
 */
async function validateSingleSchema(appname, version, feature, schemaType) {
  const results = [];

  // Check if feature exists
  if (!(await checkFeatureExists(appname, version, feature))) {
    throw new Error(`Feature '${appname}/${version}/${feature}' not found in src/api/`);
  }

  const featurePath = join(process.cwd(), 'src', 'api', appname, version, feature);

  switch (schemaType) {
    case 'requirements':
      const requirementsPath = join(featurePath, `${feature}.requirements.yml`);
      results.push(await validateRequirementsFile(requirementsPath, appname, version, feature));
      break;

    case 'instructions':
      const instructionsPath = join(featurePath, `${feature}.instructions.yml`);
      results.push(await validateInstructionsFile(instructionsPath, appname, version, feature));
      break;

    case 'specification':
      const specificationPath = join(
        featurePath,
        `${feature}.specification.json`
      );
      results.push(await validateSpecificationFile(specificationPath, appname, version, feature));
      break;

    default:
      throw new Error(`Unknown schema type: ${schemaType}`);
  }

  return results;
}

/**
 * Validate all schemas for a specific feature including contracts
 * @llm-rule WHEN: User specifies feature without schema type
 * @llm-rule AVOID: Cross-feature validation when user wants specific feature only
 * @llm-rule NOTE: Includes requirements, instructions, specification, and all contracts
 */
async function validateFeatureSchemas(appname, version, feature) {
  const results = [];

  // Check if feature exists
  if (!(await checkFeatureExists(feature))) {
    throw new Error(`Feature '${feature}' not found in src/api/`);
  }

  const featurePath = join(process.cwd(), 'src', 'api', feature);

  // Validate the three main schema files
  const requirementsPath = join(featurePath, `${feature}.requirements.yml`);
  const instructionsPath = join(featurePath, `${feature}.instructions.yml`);
  const specificationPath = join(featurePath, `${feature}.specification.json`);

  results.push(await validateRequirementsFile(requirementsPath, feature));
  results.push(await validateInstructionsFile(instructionsPath, feature));
  results.push(await validateSpecificationFile(specificationPath, feature));

  // Validate all contract files for this feature
  const contractResults = await validateFeatureContracts(feature);
  results.push(...contractResults);

  return results;
}

/**
 * Validate all schemas for all features including contracts
 * @llm-rule WHEN: User runs schema command without arguments
 * @llm-rule AVOID: Processing disabled features (underscore prefix)
 * @llm-rule NOTE: Complete project schema validation for CI/CD
 */
async function validateAllSchemas() {
  const results = [];
  const featuresPath = join(process.cwd(), 'src', 'api');

  try {
    const features = await readdir(featuresPath);

    // Filter out disabled features and non-directories
    const enabledFeatures = [];
    for (const feature of features) {
      if (feature.startsWith('_') || feature.startsWith('.')) continue;

      const featurePath = join(featuresPath, feature);
      const featureStat = await stat(featurePath);
      if (featureStat.isDirectory()) {
        enabledFeatures.push(feature);
      }
    }

    // Validate each feature
    for (const feature of enabledFeatures) {
      const featurePath = join(featuresPath, feature);

      // Validate main schema files
      const requirementsPath = join(featurePath, `${feature}.requirements.yml`);
      const instructionsPath = join(featurePath, `${feature}.instructions.yml`);
      const specificationPath = join(
        featurePath,
        `${feature}.specification.json`
      );

      results.push(await validateRequirementsFile(requirementsPath, feature));
      results.push(await validateInstructionsFile(instructionsPath, feature));
      results.push(await validateSpecificationFile(specificationPath, feature));

      // Validate all contract files for this feature
      const contractResults = await validateFeatureContracts(feature);
      results.push(...contractResults);
    }

    // Add cross-reference validation for all features
    results.push(...(await validateCrossReferences(enabledFeatures)));

    return results;
  } catch (error) {
    throw new Error(`Schema validation failed: ${error.message}`);
  }
}

async function validateManifestFile(filePath, feature, endpoint) {
  const result = {
    type: 'manifest',
    feature,
    endpoint,
    file: `${endpoint}.manifest.json`,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    await stat(filePath);
    const content = await readFile(filePath, 'utf-8');
    const manifest = JSON.parse(content);

    // Load manifest schema and validate
    const schemaPath = join(
      process.cwd(),
      'scripts',
      'schemas',
      'manifest.schema.json'
    );
    const schemaContent = await readFile(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaContent);

    const Ajv = (await import('ajv')).default;
    const addFormats = (await import('ajv-formats')).default;
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

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
      result.errors.push(`Manifest file not found: ${result.file}`);
    } else {
      result.errors.push(`Manifest validation failed: ${error.message}`);
    }
  }

  return result;
}

/**
 * Validate contracts for all endpoints in a feature
 * @llm-rule WHEN: Validating contract files as part of schema validation
 * @llm-rule AVOID: Missing contract files that could cause runtime failures
 * @llm-rule NOTE: Finds all {endpoint}.contract.ts files in feature directory
 */
async function validateFeatureContracts(feature) {
  const results = [];
  const featurePath = join(process.cwd(), 'src', 'api', feature);

  try {
    const items = await readdir(featurePath);

    // Find all endpoint directories
    for (const item of items) {
      const itemPath = join(featurePath, item);
      const itemStat = await stat(itemPath);

      if (itemStat.isDirectory() && !item.startsWith('_')) {
        // Look for contract file in endpoint directory
        const contractFile = `${item}.contract.ts`;
        const contractPath = join(itemPath, contractFile);

        try {
          await stat(contractPath);
          results.push(await validateContractFile(contractPath, feature, item));
          // Also validate manifest if it exists
          const manifestFile = `${item}.manifest.json`;
          const manifestPath = join(itemPath, manifestFile);
          try {
            await stat(manifestPath);
            results.push(
              await validateManifestFile(manifestPath, feature, item)
            );
          } catch {
            // Manifest file optional - no error if missing
          }
        } catch {
          // Contract file doesn't exist - this might be ok for some endpoints
          results.push({
            type: 'contract',
            feature,
            endpoint: item,
            file: contractFile,
            valid: false,
            errors: [`Contract file not found: ${contractFile}`],
            warnings: [],
          });
        }
      }
    }

    return results;
  } catch (error) {
    throw new Error(
      `Failed to validate contracts for ${feature}: ${error.message}`
    );
  }
}

/**
 * Simple reporting that's clean and actionable
 * @llm-rule WHEN: Showing validation results to developers
 * @llm-rule AVOID: Verbose output that hides important information
 * @llm-rule NOTE: Groups by type and shows only errors for failed validations
 */
function reportResults(results, duration) {
  const valid = results.filter((r) => r.valid).length;
  const total = results.length;
  const failed = results.filter((r) => !r.valid);

  if (failed.length === 0) {
    // Success: one clean line
    console.log(
      `✅ Schema validation passed (${valid}/${total}) ${duration}ms`
    );
  } else {
    // Failure: show only errors
    console.log(
      `❌ Schema validation failed (${valid}/${total}) ${duration}ms`
    );
    console.log('');

    failed.forEach((result) => {
      if (result.type === 'contract') {
        console.log(`❌ ${result.feature}/${result.endpoint}.contract.ts`);
      } else {
        console.log(`❌ ${result.feature}.${result.type}`);
      }
      result.errors.forEach((error) => {
        console.log(`   ${error}`);
      });
    });
  }
}

/**
 * Check if a feature directory exists
 * @llm-rule WHEN: Validating user input before attempting file operations
 * @llm-rule AVOID: Assuming features exist - always check first
 * @llm-rule NOTE: Prevents confusing error messages from file operations
 */
async function checkFeatureExists(feature) {
  try {
    const featurePath = join(process.cwd(), 'src', 'api', feature);
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
 * Contract file validation with proper schema validation and import checking
 * @llm-rule WHEN: Validating contract files for schema compliance and structure
 * @llm-rule AVOID: Allowing TypeScript imports in contract files
 * @llm-rule NOTE: Contract files should be pure objects with no imports
 */
async function validateContractFile(filePath, appname, version, feature, endpoint) {
  const result = {
    type: 'contract',
    feature,
    endpoint,
    file: `${endpoint}.contract.ts`,
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    await stat(filePath);
    const content = await readFile(filePath, 'utf-8');

    // 1. Check for forbidden imports at top of file
    const hasImports = /^\s*import\s+.*from/m.test(content);
    if (hasImports) {
      result.errors.push(
        '❌ Contract files should NOT import any modules - remove all "import" statements from this file'
      );
      result.valid = false;
    }

    // 2. Extract CONTRACT object for schema validation
    let contractObject;
    try {
      // Basic check for export
      if (!content.includes('export')) {
        result.errors.push(
          '❌ Contract file must export a CONTRACT object: export const CONTRACT = { ... }'
        );
        result.valid = false;
        return result;
      }

      // Try to extract the CONTRACT object
      const contractMatch = content.match(
        /export\s+const\s+CONTRACT\s*=\s*({[\s\S]*?});/
      );
      if (!contractMatch) {
        result.errors.push(
          '❌ Contract file must have: export const CONTRACT = { ... } (check syntax)'
        );
        result.valid = false;
        return result;
      }

      // Parse the contract object (basic evaluation)
      const contractString = contractMatch[1];
      contractObject = eval(`(${contractString})`);
    } catch (error) {
      result.errors.push(`Failed to parse CONTRACT object: ${error.message}`);
      result.valid = false;
      return result;
    }

    // 3. Validate against contract schema
    try {
      const schemaPath = join(
        process.cwd(),
        'scripts',
        'schemas',
        'contract.schema.json'
      );
      const schemaContent = await readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);

      const Ajv = (await import('ajv')).default;
      const addFormats = (await import('ajv-formats')).default;
      const ajv = new Ajv({ allErrors: true });
      addFormats(ajv);

      const validate = ajv.compile(schema);
      const valid = validate(contractObject);

      if (!valid) {
        validate.errors.forEach((error) => {
          const path = error.instancePath || 'CONTRACT';
          const property = error.instancePath
            ? error.instancePath.replace('/', '')
            : 'root';

          if (error.keyword === 'required') {
            result.errors.push(
              `❌ Missing required field: ${error.params.missingProperty} (add this field to CONTRACT object)`
            );
          } else if (error.keyword === 'additionalProperties') {
            result.errors.push(
              `❌ Unknown field: ${error.params.additionalProperty} (remove this field from CONTRACT object)`
            );
          } else {
            result.errors.push(`❌ ${property}: ${error.message}`);
          }
        });
        result.valid = false;
      }
    } catch (schemaError) {
      result.errors.push(
        `Contract schema validation failed: ${schemaError.message}`
      );
      result.valid = false;
    }

    // 4. Verify feature and endpoint match
    if (contractObject && result.valid) {
      if (contractObject.feature !== feature) {
        result.errors.push(
          `Contract feature "${contractObject.feature}" does not match directory "${feature}"`
        );
        result.valid = false;
      }

      if (contractObject.endpoint !== endpoint) {
        result.errors.push(
          `Contract endpoint "${contractObject.endpoint}" does not match file name "${endpoint}"`
        );
        result.valid = false;
      }
    }

    // 5. Validate test signatures match specification
    try {
      const specPath = join(
        process.cwd(),
        'src',
        'api',
        feature,
        `${feature}.specification.json`
      );
      const specContent = await readFile(specPath, 'utf-8');
      const spec = JSON.parse(specContent);
      const endpointSpec = spec.endpoints[endpoint];

      if (endpointSpec?.test?.test_cases) {
        const specTestNames = endpointSpec.test.test_cases.map((tc) => tc.name);
        const contractTests = contractObject.tests || [];

        // Count check first
        const expectedCount = specTestNames.length;
        const actualCount = contractTests.length;

        if (actualCount !== expectedCount) {
          result.errors.push(
            `❌ Test count mismatch: expected ${expectedCount} tests, found ${actualCount} tests`
          );
          result.valid = false;
        }

        // Check each contract test case
        const extraTests = contractTests.filter(
          (name) => !specTestNames.includes(name)
        );
        const validTests = contractTests.filter((name) =>
          specTestNames.includes(name)
        );
        const missingTests = specTestNames.filter(
          (name) => !contractTests.includes(name)
        );

        // Show valid tests to retain
        if (validTests.length > 0) {
          result.errors.push(`✅ Valid tests (retain these):`);
          validTests.forEach((test) => {
            result.errors.push(`   ✓ '${test}'`);
          });
        }

        // Show extra tests to remove
        if (extraTests.length > 0) {
          result.errors.push(
            `❌ Extra tests (remove these ${extraTests.length}):`
          );
          extraTests.forEach((test) => {
            result.errors.push(`   ✗ '${test}'`);
          });
          result.valid = false;
        }

        // Show missing tests to add
        if (missingTests.length > 0) {
          result.errors.push(
            `⚠️  Missing tests (add these ${missingTests.length}):`
          );
          missingTests.forEach((test) => {
            result.errors.push(`   + '${test}'`);
          });
          result.valid = false;
        }

        if (
          missingTests.length === 0 &&
          extraTests.length === 0 &&
          actualCount === expectedCount
        ) {
          result.warnings.push(
            `✅ Test signatures match specification (${expectedCount} tests)`
          );
        }
      }
    } catch (specError) {
      result.warnings.push(
        `Could not validate test signatures: ${specError.message}`
      );
    }
  } catch (error) {
    result.valid = false;
    if (error.code === 'ENOENT') {
      result.errors.push(`Contract file not found: ${result.file}`);
    } else {
      result.errors.push(`Contract validation failed: ${error.message}`);
    }
  }

  return result;
}

/**
 * Cross-reference validation between features
 */
async function validateCrossReferences(features) {
  // Placeholder for cross-reference validation
  // This could check for consistent naming, dependencies, etc.
  return [];
}
