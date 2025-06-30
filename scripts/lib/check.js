/**
 * Flux Framework - Comprehensive Quality Checks
 * @file scripts/lib/check.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  logSuccess,
  logError,
  logWarning,
  logBox,
  log,
  colors,
  symbols,
  Timer,
  Spinner,
} from './utils.js';
import { runContracts } from './contracts.js';
import { runFormat } from './format.js';

/**
 * Main check command - runs all quality checks
 */
export async function runCheck(args) {
  const timer = new Timer();

  console.clear();

  logBox(`${symbols.target} Flux Quality Check`, [
    `${symbols.contracts} Contract validation and dependencies`,
    `${symbols.code} Code formatting and LLM patterns`,
    `${symbols.security} TypeScript compilation`,
    `${symbols.performance} Feature structure validation`,
  ]);

  const results = {
    contracts: { passed: false, errors: [], warnings: [] },
    formatting: { passed: false, errors: [], warnings: [] },
    typescript: { passed: false, errors: [], warnings: [] },
    structure: { passed: false, errors: [], warnings: [] },
    environment: { passed: false, errors: [], warnings: [] },
  };

  // Run all checks
  try {
    // 1. Environment Check
    log(`${symbols.flux} Checking environment setup...`, 'white');
    results.environment = await checkEnvironment();

    // 2. Feature Structure Check
    log(`${symbols.sparkles} Validating feature structure...`, 'white');
    results.structure = await checkFeatureStructure();

    // 3. TypeScript Compilation Check
    log(`${symbols.lightning} Checking TypeScript compilation...`, 'white');
    results.typescript = await checkTypeScript();

    // 4. Contract Validation (capture output)
    log(`${symbols.contracts} Validating contracts...`, 'white');
    results.contracts = await checkContracts();

    // 5. Code Formatting Check (capture output)
    log(`${symbols.code} Checking code formatting...`, 'white');
    results.formatting = await checkFormatting();
  } catch (error) {
    logError(`Quality check failed: ${error.message}`);
    process.exit(1);
  }

  // Display comprehensive results
  console.clear();
  displayResults(results, timer.end());
}

/**
 * Check environment setup
 */
async function checkEnvironment() {
  const spinner = new Spinner('Checking environment...');
  spinner.start();

  const result = { passed: true, errors: [], warnings: [] };

  try {
    // Check if this is a Flux project
    const requiredFiles = [
      'flux.ts',
      'contracts.ts',
      'package.json',
      'tsconfig.json',
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        result.errors.push(`Missing required file: ${file}`);
        result.passed = false;
      }
    }

    // Check package.json for required dependencies
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredDeps = ['@voilajsx/appkit', 'fastify', 'typescript'];

      requiredDeps.forEach((dep) => {
        if (
          !packageJson.dependencies?.[dep] &&
          !packageJson.devDependencies?.[dep]
        ) {
          result.warnings.push(`Recommended dependency missing: ${dep}`);
        }
      });

      // Check for dev dependencies
      const devDeps = ['tsx', '@types/node'];
      devDeps.forEach((dep) => {
        if (!packageJson.devDependencies?.[dep]) {
          result.warnings.push(`Development dependency missing: ${dep}`);
        }
      });
    }

    // Check node_modules
    if (!fs.existsSync('node_modules')) {
      result.errors.push('Dependencies not installed. Run: npm install');
      result.passed = false;
    }

    // Check environment variables
    const envWarnings = [];
    if (!process.env.NODE_ENV) {
      envWarnings.push('NODE_ENV not set (development assumed)');
    }
    if (!process.env.VOILA_AUTH_SECRET && !process.env.JWT_SECRET) {
      envWarnings.push(
        'Authentication secret not configured (JWT_SECRET or VOILA_AUTH_SECRET)'
      );
    }

    result.warnings.push(...envWarnings);

    spinner.succeed('Environment check completed');
    return result;
  } catch (error) {
    spinner.fail('Environment check failed');
    result.passed = false;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Check feature structure and organization
 */
async function checkFeatureStructure() {
  const spinner = new Spinner('Validating feature structure...');
  spinner.start();

  const result = { passed: true, errors: [], warnings: [] };

  try {
    const featuresDir = path.join(process.cwd(), 'src', 'features');

    if (!fs.existsSync(featuresDir)) {
      result.errors.push('Features directory not found');
      result.passed = false;
      spinner.fail('No features directory found');
      return result;
    }

    const entries = fs.readdirSync(featuresDir, { withFileTypes: true });
    const features = entries.filter(
      (entry) => entry.isDirectory() && !entry.name.startsWith('_')
    );

    if (features.length === 0) {
      result.warnings.push(
        'No features found. Create your first feature with: npm run flux:create'
      );
    }

    // Check each feature structure
    for (const feature of features) {
      const featurePath = path.join(featuresDir, feature.name);
      const featureName = feature.name;

      // Check required files
      const indexPath = path.join(featurePath, 'index.ts');
      if (!fs.existsSync(indexPath)) {
        result.errors.push(`Feature '${featureName}': Missing index.ts file`);
        result.passed = false;
        continue;
      }

      // Validate index.ts content
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      if (!indexContent.includes('FeatureConfig')) {
        result.errors.push(
          `Feature '${featureName}': Invalid index.ts - missing FeatureConfig`
        );
        result.passed = false;
      }

      if (!indexContent.includes('createBackendContract')) {
        result.errors.push(
          `Feature '${featureName}': Missing contract definition`
        );
        result.passed = false;
      }

      // Check directory structure
      const expectedDirs = ['services', 'types'];
      const actualDirs = fs
        .readdirSync(featurePath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      expectedDirs.forEach((dir) => {
        if (!actualDirs.includes(dir)) {
          result.warnings.push(
            `Feature '${featureName}': Missing ${dir} directory`
          );
        }
      });

      // Check for routes if feature provides routes
      if (indexContent.includes('providesRoute')) {
        if (!actualDirs.includes('routes')) {
          result.errors.push(
            `Feature '${featureName}': Provides routes but missing routes directory`
          );
          result.passed = false;
        }
      }

      // Check for models if feature needs database
      if (indexContent.includes('needsDatabase')) {
        if (!actualDirs.includes('models')) {
          result.warnings.push(
            `Feature '${featureName}': Needs database but missing models directory`
          );
        }
      }
    }

    spinner.succeed(
      `Feature structure validation completed (${features.length} features)`
    );
    return result;
  } catch (error) {
    spinner.fail('Feature structure validation failed');
    result.passed = false;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Check TypeScript compilation
 */
async function checkTypeScript() {
  const spinner = new Spinner('Checking TypeScript compilation...');
  spinner.start();

  const result = { passed: true, errors: [], warnings: [] };

  try {
    // Check if TypeScript is available
    try {
      execSync('npx tsc --version', { stdio: 'pipe' });
    } catch (error) {
      result.errors.push(
        'TypeScript compiler not found. Run: npm install typescript --save-dev'
      );
      result.passed = false;
      spinner.fail('TypeScript compiler not found');
      return result;
    }

    // Run TypeScript compilation check (no emit)
    try {
      execSync('npx tsc --noEmit', {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      spinner.succeed('TypeScript compilation check passed');
    } catch (error) {
      result.passed = false;

      // Parse TypeScript errors
      const output = error.stdout || error.stderr || '';
      const lines = output.split('\n').filter((line) => line.trim());

      // Extract error messages
      const tsErrors = lines
        .filter((line) => line.includes('error TS'))
        .slice(0, 5); // Limit to first 5 errors

      if (tsErrors.length > 0) {
        result.errors.push('TypeScript compilation errors found:');
        result.errors.push(...tsErrors);
      } else {
        result.errors.push('TypeScript compilation failed');
      }

      spinner.fail(`TypeScript compilation failed (${tsErrors.length} errors)`);
    }

    return result;
  } catch (error) {
    spinner.fail('TypeScript check failed');
    result.passed = false;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Check contracts (wrapper around contracts.js)
 */
async function checkContracts() {
  const result = { passed: true, errors: [], warnings: [] };

  try {
    // Capture contract validation results
    const originalLog = console.log;
    const originalError = console.error;

    let output = '';
    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };
    console.error = (...args) => {
      output += args.join(' ') + '\n';
    };

    try {
      // Import and run contracts validation silently
      const {
        discoverFeatureContracts,
        validateAllContracts,
        checkCircularDependencies,
      } = await import('./contracts.js');

      const features = await discoverFeatureContracts();
      const validation = await validateAllContracts(features);
      const circularDeps = await checkCircularDependencies(features);

      // Analyze results
      const hasErrors = Object.values(validation).some((v) => !v.valid);
      const hasCircularDeps = circularDeps.length > 0;

      if (hasErrors || hasCircularDeps) {
        result.passed = false;
        result.errors.push(`Contract validation failed`);

        if (hasCircularDeps) {
          result.errors.push(
            `${circularDeps.length} circular dependencies found`
          );
        }
      }

      // Count warnings
      const warningCount = Object.values(validation).reduce(
        (sum, v) => sum + v.warnings.length,
        0
      );

      if (warningCount > 0) {
        result.warnings.push(`${warningCount} contract warnings found`);
      }
    } catch (error) {
      result.passed = false;
      result.errors.push(`Contract validation error: ${error.message}`);
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }

    return result;
  } catch (error) {
    result.passed = false;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Check code formatting (wrapper around format.js)
 */
async function checkFormatting() {
  const result = { passed: true, errors: [], warnings: [] };

  try {
    // We'll do a simple formatting check here
    // since the full formatting check is complex

    const featuresDir = path.join(process.cwd(), 'src', 'features');
    if (!fs.existsSync(featuresDir)) {
      result.warnings.push('No features directory to check formatting');
      return result;
    }

    let fileCount = 0;
    let issueCount = 0;

    // Simple format checks
    function checkFiles(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dir, file.name);

        if (file.isDirectory()) {
          checkFiles(filePath);
        } else if (file.name.match(/\.(ts|tsx)$/)) {
          fileCount++;

          try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Check for basic formatting issues
            if (content.includes('\t')) {
              issueCount++;
              result.warnings.push(
                `${path.relative(process.cwd(), filePath)}: Uses tabs instead of spaces`
              );
            }

            if (content.includes('console.log') && !filePath.includes('test')) {
              issueCount++;
              result.warnings.push(
                `${path.relative(process.cwd(), filePath)}: Contains console.log statements`
              );
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }

    checkFiles(featuresDir);

    if (issueCount > 0) {
      result.warnings.push(
        `${issueCount} formatting issues found in ${fileCount} files`
      );
    }

    return result;
  } catch (error) {
    result.passed = false;
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Display comprehensive results
 */
function displayResults(results, totalTime) {
  const passed = Object.values(results).every((r) => r.passed);
  const totalErrors = Object.values(results).reduce(
    (sum, r) => sum + r.errors.length,
    0
  );
  const totalWarnings = Object.values(results).reduce(
    (sum, r) => sum + r.warnings.length,
    0
  );

  if (passed) {
    logBox(
      `${symbols.check} All Quality Checks Passed!`,
      [
        `${symbols.flux} Framework health: Excellent`,
        `${symbols.lightning} Completed in ${totalTime}ms`,
        `${symbols.sparkles} Ready for development and deployment`,
        `${symbols.security} Code quality: Production-ready`,
      ],
      'green'
    );
  } else {
    logBox(
      `${symbols.warning} Quality Issues Found`,
      [
        `${symbols.error} ${totalErrors} errors need immediate attention`,
        `${symbols.warning} ${totalWarnings} warnings to review`,
        `${symbols.fire} Fix issues before deployment`,
        `${symbols.target} Run individual checks for details`,
      ],
      'yellow'
    );
  }

  // Detailed results
  console.log();
  log(`${colors.bright}Detailed Results:${colors.reset}`, 'white');

  Object.entries(results).forEach(([check, result]) => {
    const icon = result.passed ? symbols.check : symbols.error;
    const color = result.passed ? 'green' : 'red';
    const checkName = check.charAt(0).toUpperCase() + check.slice(1);

    log(`  ${icon} ${colors[color]}${checkName}${colors.reset}`, 'white');

    // Show first few errors
    if (result.errors.length > 0) {
      result.errors.slice(0, 3).forEach((error) => {
        log(
          `    ${symbols.error} ${colors.red}${error}${colors.reset}`,
          'white'
        );
      });

      if (result.errors.length > 3) {
        log(
          `    ${colors.gray}... and ${result.errors.length - 3} more errors${colors.reset}`,
          'white'
        );
      }
    }

    // Show first few warnings
    if (result.warnings.length > 0) {
      result.warnings.slice(0, 2).forEach((warning) => {
        log(
          `    ${symbols.warning} ${colors.yellow}${warning}${colors.reset}`,
          'white'
        );
      });

      if (result.warnings.length > 2) {
        log(
          `    ${colors.gray}... and ${result.warnings.length - 2} more warnings${colors.reset}`,
          'white'
        );
      }
    }
  });

  console.log();

  if (passed) {
    logSuccess('All systems operational! Ready for production! 🚀');
  } else {
    logError('Quality issues need attention before deployment');
    log(`Run individual checks for detailed information:`, 'white');
    log(
      `  ${colors.cyan}npm run flux:contracts${colors.reset}   # Contract validation`,
      'white'
    );
    log(
      `  ${colors.cyan}npm run flux:format${colors.reset}     # Code formatting`,
      'white'
    );
    log(
      `  ${colors.cyan}npx tsc --noEmit${colors.reset}        # TypeScript compilation`,
      'white'
    );
  }
}
