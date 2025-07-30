/**
 * FLUX Framework Test Command - Pure test execution without manifest generation
 * @module @voilajsx/flux/scripts/commands/test
 * @file scripts/commands/test.js
 *
 * @llm-rule WHEN: Running FLUX Framework tests for functionality validation only
 * @llm-rule AVOID: Mixing test execution with compliance validation - use compliance.js for that
 * @llm-rule NOTE: Focused on test execution and reporting with unified file-path targeting
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const execAsync = promisify(exec);
const log = createLogger('test');

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

  // Handle specific file targeting (hello/main.test.ts)
  if (target.includes('.') && target.includes('/')) {
    const lastSlash = target.lastIndexOf('/');
    const pathPart = target.slice(0, lastSlash);
    const filePart = target.slice(lastSlash + 1);

    // Parse the file part to get endpoint name
    // main.test.ts -> main
    const fileNameParts = filePart.split('.');
    const endpoint = fileNameParts[0];

    // For simple paths like "weather/main.test.ts", pathPart is "weather"
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
      path: `src/api/${feature}/${endpoint}`,
    };
  }

  // Handle feature targeting (hello)
  return {
    type: 'feature',
    feature: target,
    description: `${target} feature`,
    path: `src/api/${target}`,
  };
}

/**
 * Test execution command with focused test running and clear reporting
 * @llm-rule WHEN: Validating endpoint functionality through test execution
 * @llm-rule AVOID: Generating manifests here - that's compliance.js responsibility
 * @llm-rule NOTE: Clean separation: test.js runs tests, compliance.js validates implementation
 */
export default async function test(args) {
  const startTime = Date.now();
  const target = args.find((arg) => !arg.startsWith('--'));
  const targetInfo = parseTarget(target);

  try {
    // Validate target exists if specified
    if (targetInfo.type !== 'all') {
      const featuresPath = join(process.cwd(), 'src', 'api');

      if (targetInfo.type === 'file') {
        // Validate specific file exists
        const filePath = join(
          process.cwd(),
          'src',
          'api',
          targetInfo.feature,
          targetInfo.endpoint,
          targetInfo.fileName
        );
        try {
          await stat(filePath);
        } catch (error) {
          log.human(
            `❌ Test file '${targetInfo.feature}/${targetInfo.endpoint}/${targetInfo.fileName}' not found`
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

    // 1. Validate test file structure exists
    const structureResult = await validateTestStructure(targetInfo);

    if (!structureResult.success) {
      log.human(`❌ Test structure validation failed`);
      structureResult.errors.forEach((error) => {
        log.human(`   ${error}`);
      });
      return false;
    }

    // 2. Execute tests
    const testResults = await executeTests(targetInfo);

    if (testResults.failedTests > 0) {
      showTestSummary(testResults, targetInfo);
      return false;
    }

    // 3. Show success summary
    showTestSummary(testResults, targetInfo);

    const duration = Date.now() - startTime;
    log.human(
      `✅ Test validation passed for ${targetInfo.description} (${duration}ms)`
    );

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.human(`❌ Test validation error (${duration}ms): ${error.message}`);
    return false;
  }
}

/**
 * Validate test file structure exists for the target
 */
async function validateTestStructure(targetInfo) {
  const startTime = Date.now();
  const featuresPath = join(process.cwd(), 'src', 'api');
  const errors = [];
  let filesFound = 0;
  let endpointsChecked = 0;

  try {
    if (targetInfo.type === 'file') {
      // Check specific test file
      const testFile = join(
        featuresPath,
        targetInfo.feature,
        targetInfo.endpoint,
        targetInfo.fileName
      );

      try {
        await stat(testFile);
        filesFound = 1;
        endpointsChecked = 1;
      } catch {
        errors.push(`Test file not found: ${targetInfo.path}`);
      }
    } else if (targetInfo.type === 'endpoint') {
      // Check endpoint test file
      const testFile = join(
        featuresPath,
        targetInfo.feature,
        targetInfo.endpoint,
        `${targetInfo.endpoint}.test.ts`
      );

      endpointsChecked = 1;
      try {
        await stat(testFile);
        filesFound = 1;
      } catch {
        errors.push(
          `Test file not found: ${targetInfo.feature}/${targetInfo.endpoint}/${targetInfo.endpoint}.test.ts`
        );
      }
    } else if (targetInfo.type === 'feature') {
      // Check all endpoints in feature
      const featurePath = join(featuresPath, targetInfo.feature);
      const items = await readdir(featurePath);

      for (const item of items) {
        if (
          item.startsWith('_') ||
          item.endsWith('.yml') ||
          item.endsWith('.json')
        )
          continue;

        const itemPath = join(featurePath, item);
        const itemStat = await stat(itemPath);

        if (itemStat.isDirectory()) {
          endpointsChecked++;
          const testFile = join(itemPath, `${item}.test.ts`);

          try {
            await stat(testFile);
            filesFound++;
          } catch {
            errors.push(
              `Test file not found: ${targetInfo.feature}/${item}/${item}.test.ts`
            );
          }
        }
      }
    } else {
      // Check all features
      const features = await readdir(featuresPath);

      for (const feature of features) {
        if (feature.startsWith('_') || feature.startsWith('.')) continue;

        const featurePath = join(featuresPath, feature);
        const featureStat = await stat(featurePath);

        if (!featureStat.isDirectory()) continue;

        const items = await readdir(featurePath);

        for (const item of items) {
          if (
            item.startsWith('_') ||
            item.endsWith('.yml') ||
            item.endsWith('.json')
          )
            continue;

          const itemPath = join(featurePath, item);
          const itemStat = await stat(itemPath);

          if (itemStat.isDirectory()) {
            endpointsChecked++;
            const testFile = join(itemPath, `${item}.test.ts`);

            try {
              await stat(testFile);
              filesFound++;
            } catch {
              errors.push(
                `Test file not found: ${feature}/${item}/${item}.test.ts`
              );
            }
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      errors,
      filesFound,
      endpointsChecked,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Test structure validation failed: ${error.message}`],
      filesFound: 0,
      endpointsChecked: 0,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Execute tests based on target
 */
async function executeTests(targetInfo) {
  const startTime = Date.now();

  try {
    let testCommand = 'npx vitest run --reporter=verbose';

    if (targetInfo.type === 'file') {
      // Test specific file
      testCommand += ` src/api/${targetInfo.feature}/${targetInfo.endpoint}/${targetInfo.fileName}`;
    } else if (targetInfo.type === 'endpoint') {
      // Test specific endpoint
      testCommand += ` src/api/${targetInfo.feature}/${targetInfo.endpoint}/${targetInfo.endpoint}.test.ts`;
    } else if (targetInfo.type === 'feature') {
      // Test specific feature
      testCommand += ` src/api/${targetInfo.feature}`;
    }
    // For 'all', no additional path needed

    const { stdout, stderr } = await execAsync(testCommand);
    return parseTestOutput(stdout, stderr, Date.now() - startTime);
  } catch (error) {
    // Vitest exits with non-zero code when tests fail
    return parseTestOutput(
      error.stdout || '',
      error.stderr || '',
      Date.now() - startTime
    );
  }
}

/**
 * Parse test output to extract results
 */
function parseTestOutput(stdout, stderr, duration) {
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    coverage: 0,
    duration,
    testSuites: [],
  };

  try {
    const output = stdout + '\n' + stderr;

    // Parse test summary
    const testsMatch = output.match(
      /Tests?\s+(?:(\d+)\s+failed\s*\|\s*)?(\d+)\s+passed\s*(?:\|\s*(\d+)\s*total)?/
    );

    if (testsMatch) {
      results.failedTests = parseInt(testsMatch[1]) || 0;
      results.passedTests = parseInt(testsMatch[2]) || 0;
      results.totalTests =
        parseInt(testsMatch[3]) || results.passedTests + results.failedTests;
    }

    // Alternative pattern
    if (results.totalTests === 0) {
      const altMatch = output.match(/(\d+)\s+passed/);
      if (altMatch) {
        results.passedTests = parseInt(altMatch[1]);
        results.totalTests = results.passedTests;
      }
    }

    // Extract coverage if available
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      results.coverage = parseFloat(coverageMatch[1]);
    }

    return results;
  } catch (error) {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 1,
      coverage: 0,
      duration,
      testSuites: [],
    };
  }
}

/**
 * Show test execution summary
 */
function showTestSummary(results, targetInfo) {
  if (results.totalTests === 0) {
    log.human('ℹ️ No tests found to execute');
    return;
  }

  if (results.failedTests > 0) {
    log.human(
      `❌ ${results.failedTests}/${results.totalTests} tests failed (${results.duration}ms)`
    );
  } else {
    log.human(
      `✅ ${results.passedTests}/${results.totalTests} tests passed (${results.duration}ms)`
    );
  }

  if (results.coverage > 0) {
    const coverageEmoji = results.coverage >= 80 ? '✅' : '⚠️';
    log.human(`${coverageEmoji} Coverage: ${results.coverage}%`);
  }
}
