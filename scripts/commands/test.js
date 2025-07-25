/**
 * FLUX Framework Test Command - Pure test execution without manifest generation
 * @module @voilajsx/flux/scripts/commands/test
 * @file scripts/commands/test.js
 *
 * @llm-rule WHEN: Running FLUX Framework tests for functionality validation only
 * @llm-rule AVOID: Mixing test execution with compliance validation - use compliance.js for that
 * @llm-rule NOTE: Focused on test execution and reporting - manifest generation moved to compliance.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const execAsync = promisify(exec);
const log = createLogger('test');

/**
 * Test execution command with focused test running and clear reporting
 * @llm-rule WHEN: Validating endpoint functionality through test execution
 * @llm-rule AVOID: Generating manifests here - that's compliance.js responsibility
 * @llm-rule NOTE: Clean separation: test.js runs tests, compliance.js validates implementation
 */
export default async function test(args) {
  const startTime = Date.now();
  const target = args.find((arg) => !arg.startsWith('--'));

  log.validationStart('test', target, [
    'test_structure_validation',
    'vitest_execution',
    'coverage_validation',
  ]);

  try {
    // 1. Validate test file structure exists
    log.checkStart('Test file structure validation');

    const structureResult = await validateTestStructure(target);

    if (!structureResult.success) {
      log.checkFail(
        'Test structure validation',
        structureResult.duration,
        structureResult.errors,
        [
          'Create missing test files following {endpoint}.test.ts pattern',
          'Ensure test files exist for all endpoints',
          'Check file permissions and naming conventions',
        ]
      );
      return false;
    }

    log.checkPass('Test structure validation', structureResult.duration, {
      test_files_found: structureResult.filesFound,
      endpoints_covered: structureResult.endpointsCovered,
    });

    // 2. Execute Vitest tests
    log.checkStart('Vitest test execution');

    const testResults = await executeVitestTests(target);

    if (testResults.failedTests > 0) {
      showTestSummary(testResults);

      log.checkFail(
        'Test execution',
        testResults.duration,
        [`${testResults.failedTests} test(s) failed`],
        [
          'Fix failing tests before proceeding',
          'Run npm run test for detailed failure analysis',
          'Check test assertions and expected values',
        ]
      );
      return false;
    }

    log.checkPass('Test execution', testResults.duration, {
      total_tests: testResults.totalTests,
      passed_tests: testResults.passedTests,
      test_suites: testResults.testSuites?.length || 0,
    });

    showTestSummary(testResults);

    // 3. Coverage validation (if available)
    log.checkStart('Test coverage validation');

    const coverageResult = await validateCoverage(testResults.coverage);

    if (!coverageResult.success) {
      log.checkFail(
        'Coverage validation',
        coverageResult.duration,
        [`Coverage ${testResults.coverage}% below required 90%`],
        [
          'Add more test cases to improve coverage',
          'Test edge cases and error scenarios',
          'Ensure all functions are tested',
        ]
      );
      return false;
    }

    log.checkPass('Coverage validation', coverageResult.duration, {
      coverage_percentage: testResults.coverage,
      meets_requirement: coverageResult.success,
    });

    // SUCCESS - All tests passed
    const totalDuration = Date.now() - startTime;

    log.validationComplete('test', 'success', totalDuration, {
      total_tests: testResults.totalTests,
      passed_tests: testResults.passedTests,
      coverage: testResults.coverage,
      target,
    });

    // Final success message
    log.human('');
    log.human('🎉 All tests passed successfully!');
    log.human(
      `📊 Results: ${testResults.passedTests}/${testResults.totalTests} tests passed`
    );
    if (testResults.coverage > 0) {
      log.human(`📋 Coverage: ${testResults.coverage}%`);
    }
    log.human('');

    return true;
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    log.error(
      `Test execution crashed: ${error.message}`,
      {
        command: 'test',
        error: error.message,
        duration: totalDuration,
        target,
        stack: error.stack?.split('\n').slice(0, 3),
      },
      [
        'Check if Vitest is installed: npm list vitest',
        'Run npm run test manually to see detailed output',
        'Verify all test files exist and follow FLUX conventions',
        'Check for syntax errors in test files',
      ]
    );

    return false;
  }
}

/**
 * Validate test structure across FLUX Framework endpoints
 * @llm-rule WHEN: Ensuring test files exist and follow FLUX Framework conventions
 * @llm-rule AVOID: Skipping structure validation - missing tests break reliability guarantees
 * @llm-rule NOTE: Validates {endpoint}.test.ts naming convention and file existence
 */
async function validateTestStructure(target) {
  const startTime = Date.now();
  const errors = [];
  let filesFound = 0;
  let endpointsCovered = 0;

  try {
    const featuresPath = join(process.cwd(), 'src', 'features');
    const features = target
      ? [target.split('/')[0]]
      : await readdir(featuresPath);

    for (const feature of features) {
      if (feature.startsWith('_') || feature.startsWith('.')) continue;

      const featurePath = join(featuresPath, feature);
      let items;

      try {
        items = await readdir(featurePath);
      } catch {
        continue; // Skip if can't read feature directory
      }

      for (const item of items) {
        if (
          item.startsWith('_') ||
          item.endsWith('.yml') ||
          item.endsWith('.json')
        )
          continue;

        const itemPath = join(featurePath, item);
        let itemStat;

        try {
          itemStat = await stat(itemPath);
        } catch {
          continue; // Skip if can't stat item
        }

        if (itemStat.isDirectory()) {
          endpointsCovered++;
          const testFile = join(itemPath, `${item}.test.ts`);

          try {
            await stat(testFile);
            filesFound++;
          } catch {
            errors.push(
              `Missing test file for endpoint ${feature}/${item}: expected ${item}.test.ts`
            );
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      errors,
      filesFound,
      endpointsCovered,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Test structure validation failed: ${error.message}`],
      filesFound: 0,
      endpointsCovered: 0,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Execute Vitest tests with enhanced error handling and output parsing
 * @llm-rule WHEN: Running tests to validate endpoint functionality
 * @llm-rule AVOID: Ignoring test execution errors - handle gracefully for reliable results
 * @llm-rule NOTE: Supports both targeted and full test execution with comprehensive output parsing
 */
async function executeVitestTests(target) {
  const startTime = Date.now();

  try {
    let testCommand = 'npx vitest run --reporter=verbose';

    if (target) {
      const [featureName, endpointName] = target.split('/');

      if (endpointName) {
        testCommand += ` src/features/${featureName}/${endpointName}/${endpointName}.test.ts`;
      } else {
        testCommand += ` src/features/${featureName}`;
      }
    }

    log.agent('VITEST_EXECUTION_START', {
      command: testCommand,
      target: target || 'all',
    });

    const { stdout, stderr } = await execAsync(testCommand);

    return parseVitestOutput(stdout, stderr, Date.now() - startTime);
  } catch (error) {
    // Vitest exits with non-zero code when tests fail
    return parseVitestOutput(
      error.stdout || '',
      error.stderr || '',
      Date.now() - startTime
    );
  }
}

/**
 * Parse Vitest output with enhanced test result extraction
 * @llm-rule WHEN: Processing Vitest output to extract test results and performance data
 * @llm-rule AVOID: Incomplete parsing - extract all available test information
 * @llm-rule NOTE: Handles ANSI color codes and extracts detailed test timing information
 */
function parseVitestOutput(stdout, stderr, duration) {
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
    const lines = output.split('\n');

    // Parse test summary with multiple patterns
    const testsMatch = output.match(
      /Tests?\s+(?:(\d+)\s+failed\s*\|\s*)?(\d+)\s+passed\s*(?:\|\s*(\d+)\s*total)?/
    );

    if (testsMatch) {
      results.failedTests = parseInt(testsMatch[1]) || 0;
      results.passedTests = parseInt(testsMatch[2]) || 0;
      results.totalTests =
        parseInt(testsMatch[3]) || results.passedTests + results.failedTests;
    }

    // Alternative pattern for different Vitest output formats
    if (results.totalTests === 0) {
      const altMatch = output.match(/(\d+)\s+passed/);
      if (altMatch) {
        results.passedTests = parseInt(altMatch[1]);
        results.totalTests = results.passedTests;
      }
    }

    // Parse test files with enhanced pattern matching
    const testsByFile = {};

    lines.forEach((line) => {
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '').trim();

      // Match test results with file names
      const testMatch = cleanLine.match(
        /^([✓×])\s+(?:.*\/)?([^\/]+)\.test\.ts\s+>\s+(.+?)\s+>\s+(.+?)\s+(\d+ms)$/
      );

      if (testMatch) {
        const [, status, fileName, describeBlock, testName, timing] = testMatch;

        if (!testsByFile[fileName]) {
          testsByFile[fileName] = {
            name: fileName,
            passed: 0,
            failed: 0,
            total: 0,
            tests: [],
          };
        }

        const testResult = {
          name: testName,
          status: status === '✓' ? 'passed' : 'failed',
          timing: timing,
          describe: describeBlock.trim(),
        };

        testsByFile[fileName].tests.push(testResult);
        testsByFile[fileName].total++;

        if (status === '✓') {
          testsByFile[fileName].passed++;
        } else {
          testsByFile[fileName].failed++;
        }
      }
    });

    results.testSuites = Object.values(testsByFile).map((file) => ({
      file: file.name,
      status: file.failed > 0 ? 'failed' : 'passed',
      total: file.total,
      passed: file.passed,
      failed: file.failed,
      tests: file.tests,
    }));

    // Parse coverage if available
    const coverageMatch = output.match(/All files[^|]*\|\s*(\d+(?:\.\d+)?)/);
    if (coverageMatch) {
      results.coverage = parseFloat(coverageMatch[1]);
    }

    return results;
  } catch (error) {
    log.agent('VITEST_PARSE_ERROR', {
      error: error.message,
      stdout_length: stdout.length,
      stderr_length: stderr.length,
    });

    return results;
  }
}

/**
 * Show comprehensive test summary for developers
 * @llm-rule WHEN: Displaying test results for human review and debugging
 * @llm-rule AVOID: Overwhelming output - show structured, scannable results
 * @llm-rule NOTE: Provides both summary statistics and individual test details
 */
function showTestSummary(results) {
  log.human('');
  log.human('📊 Test Results Summary:');
  log.human(
    `   Total: ${results.totalTests} | Passed: ${results.passedTests} | Failed: ${results.failedTests}`
  );

  if (results.coverage > 0) {
    log.human(`   Coverage: ${results.coverage}%`);
  }

  if (results.testSuites?.length > 0) {
    log.human('');
    log.human('   Test Suites:');

    results.testSuites.forEach((suite) => {
      const icon = suite.status === 'passed' ? '✅' : '❌';
      const stats =
        suite.failed > 0
          ? `${suite.passed}/${suite.total} passed, ${suite.failed} failed`
          : `${suite.total}/${suite.total} passed`;

      log.human(`   ${icon} ${suite.file}: ${stats}`);

      if (suite.tests?.length > 0) {
        suite.tests.forEach((test) => {
          const testIcon = test.status === 'passed' ? '   ✓' : '   ×';
          const shortName =
            test.name.length > 55
              ? test.name.substring(0, 52) + '...'
              : test.name;

          log.human(`${testIcon} ${shortName} (${test.timing})`);
        });
      }
    });
  }

  log.human('');
}

/**
 * Validate test coverage against FLUX Framework requirements
 * @llm-rule WHEN: Ensuring test coverage meets 90% minimum requirement for deployment
 * @llm-rule AVOID: Accepting low coverage - breaks reliability guarantees
 * @llm-rule NOTE: Gracefully handles missing coverage data for development environments
 */
async function validateCoverage(coverage) {
  const startTime = Date.now();

  if (coverage === 0) {
    return { success: true, duration: Date.now() - startTime };
  }

  const success = coverage >= 90;

  if (!success) {
    log.agent('COVERAGE_BELOW_THRESHOLD', {
      actual_coverage: coverage,
      required_coverage: 90,
      gap: 90 - coverage,
    });
  }

  return { success, duration: Date.now() - startTime };
}
