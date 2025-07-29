/**
 * FLUX Framework Lint Command - Code standards validation with target-specific support
 * @module @voilajsx/flux/scripts/commands/lint
 * @file scripts/commands/lint.js
 *
 * @llm-rule WHEN: Validating FLUX Framework coding standards and VoilaJSX patterns for reliability
 * @llm-rule AVOID: Linting without proper file structure validation - breaks endpoint isolation
 * @llm-rule NOTE: Enhanced with unified file-path targeting (project/feature/endpoint/file)
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('lint');

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
    // main.contract.ts -> main
    const fileNameParts = filePart.split('.');
    const endpoint = fileNameParts[0];

    // For simple paths like "weather/main.contract.ts", pathPart is "weather"
    const feature = pathPart;

    return {
      type: 'file',
      feature,
      endpoint,
      fileName: filePart,
      description: `specific file ${filePart}`,
      path: target,
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
    };
  }

  // Handle feature targeting (hello)
  return {
    type: 'feature',
    feature: target,
    description: `${target} feature`,
    path: `src/features/${target}`,
  };
}

/**
 * Lint validation command with target-specific FLUX Framework standards checking
 * @llm-rule WHEN: Ensuring code follows FLUX conventions for project, feature, endpoint, or specific file
 * @llm-rule AVOID: Ignoring file structure violations - causes runtime failures in production
 * @llm-rule NOTE: Supports full project, feature-specific, endpoint-specific, and file-specific validation
 */
export default async function lint(commandArgs) {
  const startTime = Date.now();
  const target = commandArgs.find((arg) => !arg.startsWith('-'));
  const targetInfo = parseTarget(target);

  try {
    // Validate target exists if specified
    if (targetInfo.type !== 'all') {
      const featuresPath = join(process.cwd(), 'src', 'features');

      if (targetInfo.type === 'file') {
        // Validate specific file exists - construct correct path
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

    // Run linting based on target type
    let violations = [];

    if (targetInfo.type === 'all') {
      violations = await lintAllFeatures();
    } else if (targetInfo.type === 'feature') {
      const featuresPath = join(process.cwd(), 'src', 'features');
      violations = await lintFeature(featuresPath, targetInfo.feature);
    } else if (targetInfo.type === 'endpoint') {
      const featuresPath = join(process.cwd(), 'src', 'features');
      violations = await lintEndpoint(
        featuresPath,
        targetInfo.feature,
        targetInfo.endpoint
      );
    } else if (targetInfo.type === 'file') {
      const filePath = join(
        process.cwd(),
        'src',
        'features',
        targetInfo.feature,
        targetInfo.endpoint,
        targetInfo.fileName
      );
      // Determine file type from extension
      const fileType = getFileType(targetInfo.fileName);
      violations = await lintFile(
        filePath,
        fileType,
        targetInfo.feature,
        targetInfo.endpoint
      );
    }

    const duration = Date.now() - startTime;

    // Separate violations by severity
    const errors = violations.filter((v) => v.severity === 'error');
    const warnings = violations.filter((v) => v.severity === 'warning');
    const suggestions = violations.filter((v) => v.severity === 'suggestion');

    // Report results
    if (errors.length > 0) {
      log.human(
        `❌ Lint validation failed for ${targetInfo.description} (${errors.length} errors) ${duration}ms`
      );
      console.log('');
      errors.slice(0, 5).forEach((error) => {
        log.human(`   ${error.file}: ${error.message}`);
      });
      if (errors.length > 5) {
        log.human(`   ... and ${errors.length - 5} more errors`);
      }
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

    log.human(
      `✅ Lint validation passed for ${targetInfo.description} (${duration}ms)`
    );
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.human(`❌ Lint validation error (${duration}ms): ${error.message}`);
    return false;
  }
}

/**
 * Determine file type from filename for targeted validation
 * @llm-rule WHEN: Processing specific file to apply appropriate lint rules
 * @llm-rule AVOID: Generic validation - use file-specific patterns
 */
function getFileType(fileName) {
  if (fileName.includes('.contract.')) return 'contract';
  if (fileName.includes('.logic.')) return 'logic';
  if (fileName.includes('.test.')) return 'test';
  if (fileName.includes('.helper.')) return 'helper';
  return 'unknown';
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

    // 5. File-specific validation
    violations.push(...validateFileSpecific(content, relativePath, fileType));
  } catch (error) {
    if (error.code === 'ENOENT') {
      violations.push({
        severity: 'error',
        file: relativePath,
        message: `Required ${fileType} file missing`,
        suggestion: `Create ${basename(filePath)} following FLUX Framework patterns`,
      });
    } else {
      violations.push({
        severity: 'error',
        file: relativePath,
        message: `Cannot read file: ${error.message}`,
        suggestion: 'Check file permissions and encoding',
      });
    }
  }

  return violations;
}

/**
 * Validate file header comment following FLUX Framework standards
 * @llm-rule WHEN: Checking file documentation standards for agent and developer clarity
 * @llm-rule AVOID: Missing or incorrect header comments - breaks agent understanding
 * @llm-rule NOTE: Required for all TypeScript files to maintain code quality
 */
function validateHeader(
  content,
  filePath,
  fileType,
  featureName,
  endpointName
) {
  const violations = [];

  // Check for proper header comment
  if (!content.includes('@file') || !content.includes('@llm-rule')) {
    violations.push({
      severity: 'error',
      file: filePath,
      message:
        'Missing required header comment with @file and @llm-rule documentation',
      suggestion: 'Add proper header comment following FLUX Framework patterns',
    });
  }

  return violations;
}

/**
 * Validate VoilaJSX AppKit integration patterns
 * @llm-rule WHEN: Ensuring proper AppKit module usage for reliability
 * @llm-rule AVOID: Direct imports - use module.get() pattern for dependency injection
 * @llm-rule NOTE: Critical for VoilaJSX AppKit compatibility and testing
 */
function validateVoilaJSXPatterns(content, filePath, fileType) {
  const violations = [];

  if (fileType === 'logic') {
    // Check for proper VoilaJSX module usage
    if (content.includes('import') && content.includes('@voilajsx/appkit')) {
      if (!content.includes('.get()')) {
        violations.push({
          severity: 'error',
          file: filePath,
          message:
            'Use module.get() pattern instead of direct imports for VoilaJSX AppKit',
          suggestion:
            'Replace direct imports with const utils = utility.get() pattern',
        });
      }
    }
  }

  return violations;
}

/**
 * Validate FLUX Framework structure requirements
 * @llm-rule WHEN: Ensuring files follow FLUX Framework conventions
 * @llm-rule AVOID: Non-standard structure - breaks agent execution and validation
 * @llm-rule NOTE: Validates exports, function naming, and structure patterns
 */
function validateFLUXStructure(content, filePath, fileType) {
  const violations = [];

  if (fileType === 'contract') {
    if (!content.includes('export const CONTRACT')) {
      violations.push({
        severity: 'error',
        file: filePath,
        message: 'Contract file must export CONTRACT constant',
        suggestion:
          'Add: export const CONTRACT = { routes: {...}, imports: {...} }',
      });
    }
  }

  if (fileType === 'logic') {
    if (
      !content.includes('export async function') &&
      !content.includes('export function')
    ) {
      violations.push({
        severity: 'warning',
        file: filePath,
        message: 'Logic file should export functions for endpoint handlers',
        suggestion: 'Add exported functions following contract specifications',
      });
    }
  }

  return violations;
}

/**
 * Validate security patterns and best practices
 * @llm-rule WHEN: Ensuring secure coding practices in user-facing code
 * @llm-rule AVOID: Security vulnerabilities in parameter handling and validation
 * @llm-rule NOTE: Critical for production deployment safety
 */
function validateSecurityPatterns(content, filePath, fileType) {
  const violations = [];

  if (fileType === 'logic') {
    // Check for parameter validation
    if (content.includes('req.params') && !content.includes('validate')) {
      violations.push({
        severity: 'warning',
        file: filePath,
        message: 'Consider adding parameter validation for security',
        suggestion: 'Use VoilaJSX security.get() for input validation',
      });
    }
  }

  return violations;
}

/**
 * File-type specific validation rules
 * @llm-rule WHEN: Applying type-specific validation patterns
 * @llm-rule AVOID: Generic validation - use targeted rules per file type
 * @llm-rule NOTE: Extensible for adding new file type validations
 */
function validateFileSpecific(content, filePath, fileType) {
  const violations = [];

  switch (fileType) {
    case 'test':
      if (!content.includes('describe') || !content.includes('test')) {
        violations.push({
          severity: 'error',
          file: filePath,
          message: 'Test file must contain describe and test blocks',
          suggestion:
            'Add proper test structure with describe() and test() functions',
        });
      }
      break;

    case 'helper':
      if (!content.includes('export')) {
        violations.push({
          severity: 'warning',
          file: filePath,
          message: 'Helper file should export utility functions',
          suggestion: 'Add exported helper functions for endpoint use',
        });
      }
      break;
  }

  return violations;
}
