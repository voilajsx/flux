/**
 * FLUX Framework Lint Command - Code standards validation with target-specific support
 * @module @voilajsx/flux/scripts/commands/lint
 * @file scripts/commands/lint.js
 *
 * @llm-rule WHEN: Validating FLUX Framework coding standards and VoilaJSX patterns for reliability
 * @llm-rule AVOID: Linting without proper file structure validation - breaks endpoint isolation
 * @llm-rule NOTE: Enhanced with target-specific validation (project/feature/endpoint)
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('lint');

/**
 * Lint validation command with target-specific FLUX Framework standards checking
 * @llm-rule WHEN: Ensuring code follows FLUX conventions for project, feature, or endpoint
 * @llm-rule AVOID: Ignoring file structure violations - causes runtime failures in production
 * @llm-rule NOTE: Supports full project, feature-specific, and endpoint-specific validation
 */
export default async function lint(commandArgs) {
  const startTime = Date.now();
  const target = commandArgs.find((arg) => !arg.startsWith('-'));

  try {
    // Validate target exists if specified
    if (target) {
      const featuresPath = join(process.cwd(), 'src', 'features');

      if (target.includes('/')) {
        // Validate endpoint exists
        const [feature, endpoint] = target.split('/');
        const featurePath = join(featuresPath, feature);
        const endpointPath = join(featurePath, endpoint);

        try {
          await stat(featurePath);
          await stat(endpointPath);
        } catch (error) {
          log.human(`❌ Endpoint '${target}' not found`);
          return false;
        }
      } else {
        // Validate feature exists
        const featurePath = join(featuresPath, target);

        try {
          await stat(featurePath);
        } catch (error) {
          log.human(`❌ Feature '${target}' not found`);
          return false;
        }
      }
    }

    // Run validation based on target
    let violations = [];

    if (target) {
      if (target.includes('/')) {
        // Specific endpoint validation
        const [feature, endpoint] = target.split('/');
        violations = await lintEndpoint(
          join(process.cwd(), 'src', 'features'),
          feature,
          endpoint
        );
      } else {
        // Specific feature validation
        violations = await lintFeature(
          join(process.cwd(), 'src', 'features'),
          target
        );
      }
    } else {
      // Full project validation
      violations = await lintAllFeatures();
    }

    // Categorize violations by severity for proper handling
    const errors = violations.filter((v) => v.severity === 'error');
    const warnings = violations.filter((v) => v.severity === 'warning');
    const suggestions = violations.filter((v) => v.severity === 'suggestion');

    const duration = Date.now() - startTime;

    // Report results - errors block pipeline
    if (errors.length > 0) {
      log.human(`❌ ${errors.length} error(s):`);
      errors.forEach((error) => {
        log.human(`   ${error.file}: ${error.message}`);
      });
      return false;
    }

    // Show warnings (non-blocking)
    if (warnings.length > 0) {
      log.human(`⚠️  ${warnings.length} warning(s) (non-blocking)`);
      warnings.slice(0, 3).forEach((warning) => {
        log.human(`   ${warning.file}: ${warning.message}`);
      });
      if (warnings.length > 3) {
        log.human(`   ... and ${warnings.length - 3} more warnings`);
      }
    }

    // Show suggestions (informational)
    if (suggestions.length > 0 && suggestions.length <= 3) {
      log.human(`💡 ${suggestions.length} suggestion(s):`);
      suggestions.forEach((suggestion) => {
        log.human(`   ${suggestion.file}: ${suggestion.message}`);
      });
    }

    log.human(`✅ Passed (${duration}ms)`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.human(`❌ Setup failed: ${error.message} (${duration}ms)`);
    return false;
  }
}

/**
 * Lint all features in the FLUX Framework project
 * @llm-rule WHEN: Running complete project validation without specific target
 * @llm-rule AVOID: Processing disabled features (underscore prefix) - skip for performance
 * @llm-rule NOTE: Discovers enabled features automatically and processes each endpoint
 */
async function lintAllFeatures() {
  const violations = [];
  const featuresPath = join(process.cwd(), 'src', 'features');

  try {
    const features = await readdir(featuresPath);

    for (const feature of features) {
      if (feature.startsWith('_') || feature.startsWith('.')) continue;

      const featureViolations = await lintFeature(featuresPath, feature);
      violations.push(...featureViolations);
    }
  } catch (error) {
    violations.push({
      severity: 'error',
      file: 'src/features',
      message: `Cannot read features directory: ${error.message}`,
      suggestion: 'Create src/features directory with proper permissions',
    });
  }

  return violations;
}

/**
 * Lint all endpoints within a specific feature
 * @llm-rule WHEN: Validating complete feature including all endpoints and helper files
 * @llm-rule AVOID: Processing non-directory items as endpoints - causes validation errors
 * @llm-rule NOTE: Skips requirements.yml and other non-endpoint files automatically
 */
async function lintFeature(featuresPath, featureName) {
  const violations = [];
  const featurePath = join(featuresPath, featureName);

  try {
    // Check if feature directory exists
    await stat(featurePath);

    // Get all endpoint directories
    const items = await readdir(featurePath);

    for (const item of items) {
      if (item.startsWith('_') || item.startsWith('.')) continue;
      if (item.endsWith('.yml') || item.endsWith('.json')) continue;

      const itemPath = join(featurePath, item);
      const itemStat = await stat(itemPath);

      if (itemStat.isDirectory()) {
        const endpointViolations = await lintEndpoint(
          featuresPath,
          featureName,
          item
        );
        violations.push(...endpointViolations);
      }
    }
  } catch (error) {
    violations.push({
      severity: 'error',
      file: `src/features/${featureName}`,
      message: `Cannot read feature directory: ${error.message}`,
      suggestion: 'Check directory permissions and structure',
    });
  }

  return violations;
}

/**
 * Lint a specific endpoint including all required and helper files
 * @llm-rule WHEN: Validating endpoint structure including contract, logic, test, and helper files
 * @llm-rule AVOID: Missing helper file validation - breaks contract compliance
 * @llm-rule NOTE: Enhanced to validate helper files following {endpoint}.{service}.helper.ts pattern
 */
async function lintEndpoint(featuresPath, featureName, endpointName) {
  const violations = [];
  const endpointPath = join(featuresPath, featureName, endpointName);

  try {
    // Check required files exist
    const contractFile = join(endpointPath, `${endpointName}.contract.ts`);
    const logicFile = join(endpointPath, `${endpointName}.logic.ts`);
    const testFile = join(endpointPath, `${endpointName}.test.ts`);

    // Validate core files
    violations.push(
      ...(await lintFile(contractFile, 'contract', featureName, endpointName))
    );
    violations.push(
      ...(await lintFile(logicFile, 'logic', featureName, endpointName))
    );
    violations.push(
      ...(await lintFile(testFile, 'test', featureName, endpointName))
    );

    // Validate helper files
    violations.push(...(await lintHelperFiles(endpointPath, endpointName)));
  } catch (error) {
    violations.push({
      severity: 'error',
      file: `src/features/${featureName}/${endpointName}`,
      message: `Cannot read endpoint directory: ${error.message}`,
      suggestion: 'Verify endpoint structure and file permissions',
    });
  }

  return violations;
}

/**
 * Lint helper files in endpoint directory with naming convention validation
 * @llm-rule WHEN: Validating helper files following FLUX Framework patterns
 * @llm-rule AVOID: Processing non-helper TypeScript files as helpers - causes false violations
 * @llm-rule NOTE: Validates both simple helpers and service-specific helpers
 */
async function lintHelperFiles(endpointPath, endpointName) {
  const violations = [];

  try {
    const files = await readdir(endpointPath);

    // Find helper files following naming patterns
    const helperFiles = files.filter((file) => {
      if (!file.endsWith('.ts')) return false;

      // Match {endpoint}.helper.ts or {endpoint}.{service}.helper.ts
      const simpleHelper = file === `${endpointName}.helper.ts`;
      const serviceHelper =
        file.startsWith(`${endpointName}.`) &&
        file.endsWith('.helper.ts') &&
        file !== `${endpointName}.helper.ts`;

      return simpleHelper || serviceHelper;
    });

    // Validate each helper file
    for (const helperFile of helperFiles) {
      const helperPath = join(endpointPath, helperFile);
      violations.push(
        ...(await lintFile(
          helperPath,
          'helper',
          endpointName.split('/')[0],
          endpointName
        ))
      );
    }
  } catch (error) {
    violations.push({
      severity: 'warning',
      file: endpointPath,
      message: `Cannot read endpoint directory for helper validation: ${error.message}`,
      suggestion: 'Check directory permissions',
    });
  }

  return violations;
}

/**
 * Lint a specific file with comprehensive validation patterns
 * @llm-rule WHEN: Validating individual files for FLUX Framework compliance
 * @llm-rule AVOID: Skipping file existence checks - causes downstream validation failures
 * @llm-rule NOTE: Supports contract, logic, test, and helper file types with specific validations
 */
async function lintFile(filePath, fileType, featureName, endpointName) {
  const violations = [];
  const relativePath = filePath.replace(process.cwd() + '/', '');

  try {
    // Check if file exists
    await stat(filePath);

    // Read file content
    const content = await readFile(filePath, 'utf-8');

    // 1. Header comment validation
    violations.push(
      ...validateHeader(
        content,
        relativePath,
        fileType,
        featureName,
        endpointName
      )
    );

    // 2. VoilaJSX patterns validation
    violations.push(
      ...validateVoilaJSXPatterns(content, relativePath, fileType)
    );

    // 3. FLUX structure validation
    violations.push(...validateFLUXStructure(content, relativePath, fileType));

    // 4. Security patterns validation
    violations.push(
      ...validateSecurityPatterns(content, relativePath, fileType)
    );

    // 5. File-specific validations
    if (fileType === 'contract') {
      violations.push(...validateContractFile(content, relativePath));
    } else if (fileType === 'logic') {
      violations.push(...validateLogicFile(content, relativePath));
    } else if (fileType === 'test') {
      violations.push(...validateTestFile(content, relativePath));
    } else if (fileType === 'helper') {
      violations.push(...validateHelperFile(content, relativePath));
    }
  } catch (error) {
    violations.push({
      severity: 'error',
      file: relativePath,
      message: `Cannot read file: ${error.message}`,
      suggestion: 'Check file permissions and encoding',
    });
  }

  return violations;
}

/**
 * Validate VoilaJSX-compliant header comments with proper documentation
 * @llm-rule WHEN: Ensuring files have proper documentation for AI agents and developers
 * @llm-rule AVOID: Missing @llm-rule directives in logic/test files - breaks AI comprehension
 * @llm-rule NOTE: Contract files don't require @llm-rule but logic/test files must have them
 */
function validateHeader(
  content,
  filePath,
  fileType,
  featureName,
  endpointName
) {
  const violations = [];

  // Check for file header comment
  if (!content.startsWith('/**')) {
    violations.push({
      severity: 'error',
      file: filePath,
      message: 'Missing file header comment block',
      suggestion: 'Add /** comment block at top of file with @file directive',
    });
    return violations;
  }

  // Extract header comment
  const headerMatch = content.match(/^\/\*\*(.*?)\*\//s);
  if (!headerMatch) {
    violations.push({
      severity: 'error',
      file: filePath,
      message: 'Invalid header comment format',
      suggestion: 'Use proper /** comment block format',
    });
    return violations;
  }

  const header = headerMatch[1];

  // Check for @file directive
  if (!header.includes('@file')) {
    violations.push({
      severity: 'error',
      file: filePath,
      message: 'Missing @file directive in header',
      suggestion: 'Add @file directive with relative path',
    });
  }

  // Check for @llm-rule directives (logic, test, and helper files should have them)
  if (fileType === 'logic' || fileType === 'test' || fileType === 'helper') {
    if (!header.includes('@llm-rule')) {
      violations.push({
        severity: 'warning',
        file: filePath,
        message: 'Missing @llm-rule directives for AI guidance',
        suggestion:
          'Add @llm-rule WHEN/AVOID/NOTE comments for better AI comprehension',
      });
    }
  }

  return violations;
}

/**
 * Validate VoilaJSX AppKit import patterns and module usage
 * @llm-rule WHEN: Ensuring proper VoilaJSX AppKit integration for reliability
 * @llm-rule AVOID: Generic imports - use direct module imports for better tree-shaking
 * @llm-rule NOTE: Validates .get() pattern usage and module variable naming conventions
 */
function validateVoilaJSXPatterns(content, filePath, fileType) {
  const violations = [];

  // Check for bad import patterns
  if (
    content.includes("from '@voilajsx/appkit'") &&
    !content.includes("from '@voilajsx/appkit/")
  ) {
    violations.push({
      severity: 'error',
      file: filePath,
      message:
        'Use direct module imports: @voilajsx/appkit/utils instead of @voilajsx/appkit',
      suggestion:
        'Change import to @voilajsx/appkit/module-name for better tree-shaking',
    });
  }

  // Check for .get() pattern usage
  const moduleVariables = [
    'utils',
    'err',
    'config',
    'auth',
    'secure',
    'cache',
    'db',
  ];

  moduleVariables.forEach((varName) => {
    const getPattern = new RegExp(
      `const\\s+${varName}\\s*=\\s*\\w+\\.get\\(`,
      'g'
    );
    const hasGetPattern = getPattern.test(content);
    const hasVariable = content.includes(`const ${varName}`);

    if (hasVariable && !hasGetPattern) {
      violations.push({
        severity: 'warning',
        file: filePath,
        message: `Variable "${varName}" should use .get() pattern`,
        suggestion: `Change to: const ${varName} = module.get()`,
      });
    }
  });

  return violations;
}

/**
 * Validate FLUX Framework structure and naming conventions
 * @llm-rule WHEN: Ensuring files follow {endpoint}.{type}.ts naming convention
 * @llm-rule AVOID: Non-standard naming - breaks FLUX Framework auto-discovery
 * @llm-rule NOTE: Validates contract, logic, test, and helper file naming patterns
 */
function validateFLUXStructure(content, filePath, fileType) {
  const violations = [];

  // Validate filename convention
  const filename = basename(filePath);
  const expectedTypes = ['contract', 'logic', 'test', 'helper'];

  if (!expectedTypes.some((type) => filename.includes(`.${type}.ts`))) {
    violations.push({
      severity: 'error',
      file: filePath,
      message: 'Filename should follow {endpoint}.{type}.ts convention',
      suggestion:
        'Rename file to match pattern: endpoint-name.contract.ts, endpoint-name.logic.ts, etc.',
    });
  }

  return violations;
}

/**
 * Validate security patterns and best practices for production safety
 * @llm-rule WHEN: Ensuring secure coding patterns in logic and helper files
 * @llm-rule AVOID: Raw user input usage - causes security vulnerabilities
 * @llm-rule NOTE: Validates input sanitization, safe property access, and error handling
 */
function validateSecurityPatterns(content, filePath, fileType) {
  const violations = [];

  if (fileType === 'logic' || fileType === 'helper') {
    // Check for input sanitization
    if (content.includes('req.params') || content.includes('req.body')) {
      if (!content.includes('secure.input')) {
        violations.push({
          severity: 'error',
          file: filePath,
          message: 'User input should be sanitized with secure.input()',
          suggestion: 'Add secure.input() calls for all user input parameters',
        });
      }
    }

    // Check for safe property access
    if (content.includes('user.') && !content.includes('utils.get')) {
      violations.push({
        severity: 'warning',
        file: filePath,
        message: 'Consider using utils.get() for safe property access',
        suggestion:
          'Use utils.get(object, "property.path", defaultValue) to prevent crashes',
      });
    }

    // Check for proper error handling
    if (content.includes('throw ') && !content.includes('err.')) {
      violations.push({
        severity: 'warning',
        file: filePath,
        message:
          'Use VoilaJSX error types (err.badRequest, err.notFound, etc.)',
        suggestion: 'Import error module and use semantic error types',
      });
    }
  }

  return violations;
}

/**
 * Validate contract file structure and required properties
 * @llm-rule WHEN: Ensuring contract files have proper structure and helper declarations
 * @llm-rule AVOID: Missing CONTRACT export - breaks FLUX Framework validation
 * @llm-rule NOTE: Enhanced to validate helpers array for new helper file support
 */
function validateContractFile(content, filePath) {
  const violations = [];

  // Check for CONTRACT export
  if (!content.includes('export const CONTRACT')) {
    violations.push({
      severity: 'error',
      file: filePath,
      message: 'Contract file must export const CONTRACT',
      suggestion:
        'Add: export const CONTRACT = { routes: {...}, imports: {...}, helpers: [...] }',
    });
  }

  // Check for required contract properties
  const requiredProps = ['routes', 'imports', 'publishes', 'subscribes'];
  requiredProps.forEach((prop) => {
    if (!content.includes(`${prop}:`)) {
      violations.push({
        severity: 'warning',
        file: filePath,
        message: `Contract should include ${prop} property`,
        suggestion: `Add ${prop} property to CONTRACT object for completeness`,
      });
    }
  });

  return violations;
}

/**
 * Validate logic file structure and VoilaJSX patterns
 * @llm-rule WHEN: Ensuring logic files follow FLUX Framework patterns
 * @llm-rule AVOID: Missing function exports - breaks contract validation
 * @llm-rule NOTE: Validates function exports, request ID generation, and structured logging
 */
function validateLogicFile(content, filePath) {
  const violations = [];

  // Check for async function exports
  const exportFunctions = content.match(
    /export\s+(?:async\s+)?function\s+(\w+)/g
  );
  if (!exportFunctions) {
    violations.push({
      severity: 'error',
      file: filePath,
      message: 'Logic file should export at least one function',
      suggestion: 'Add exported functions that match contract route mappings',
    });
  }

  // Check for request ID generation
  if (!content.includes('utils.uuid()')) {
    violations.push({
      severity: 'suggestion',
      file: filePath,
      message:
        'Consider generating request IDs with utils.uuid() for correlation',
      suggestion: 'Add const requestId = utils.uuid() for better debugging',
    });
  }

  // Check for structured logging
  if (content.includes('log.') && !content.includes('requestId')) {
    violations.push({
      severity: 'suggestion',
      file: filePath,
      message: 'Include requestId in log entries for correlation',
      suggestion: 'Add requestId to log.info() calls for better tracing',
    });
  }

  return violations;
}

/**
 * Validate test file structure and comprehensive coverage
 * @llm-rule WHEN: Ensuring test files have proper structure and coverage
 * @llm-rule AVOID: Missing describe blocks - breaks test organization
 * @llm-rule NOTE: Validates test structure and encourages error scenario testing
 */
function validateTestFile(content, filePath) {
  const violations = [];

  // Check for describe blocks
  if (!content.includes('describe(')) {
    violations.push({
      severity: 'error',
      file: filePath,
      message: 'Test file should have describe blocks',
      suggestion: 'Add describe() blocks to organize test cases',
    });
  }

  // Check for test cases
  if (!content.includes('test(') && !content.includes('it(')) {
    violations.push({
      severity: 'error',
      file: filePath,
      message: 'Test file should have test cases',
      suggestion: 'Add test() or it() blocks with actual test cases',
    });
  }

  // Check for error testing (optional recommendation)
  if (content.includes('.expect(200)') && !content.includes('.expect(400)')) {
    violations.push({
      severity: 'suggestion',
      file: filePath,
      message:
        'Consider testing error scenarios (400, 404, etc.) for comprehensive coverage',
      suggestion: 'Add test cases for error conditions and edge cases',
    });
  }

  return violations;
}

/**
 * Validate helper file structure and VoilaJSX patterns
 * @llm-rule WHEN: Ensuring helper files follow FLUX Framework patterns
 * @llm-rule AVOID: Complex business logic in helpers - keep focused on utilities
 * @llm-rule NOTE: Helper files should contain reusable utility functions, not endpoint logic
 */
function validateHelperFile(content, filePath) {
  const violations = [];

  // Check for function exports
  const exportFunctions = content.match(
    /export\s+(?:async\s+)?function\s+(\w+)/g
  );
  const exportConsts = content.match(/export\s+const\s+(\w+)/g);

  if (!exportFunctions && !exportConsts) {
    violations.push({
      severity: 'error',
      file: filePath,
      message: 'Helper file should export at least one function or constant',
      suggestion: 'Add exported utility functions for use in endpoint logic',
    });
  }

  // Check for VoilaJSX imports if using AppKit
  if (content.includes('@voilajsx/appkit')) {
    if (!content.includes('.get()')) {
      violations.push({
        severity: 'warning',
        file: filePath,
        message: 'Helper file should use .get() pattern for VoilaJSX modules',
        suggestion:
          'Use module.get() pattern for consistency with FLUX Framework',
      });
    }
  }

  return violations;
}
