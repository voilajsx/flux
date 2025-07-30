/**
 * FLUX Framework UAT Testing - Main Command Handler
 * @module @voilajsx/flux/scripts/commands/uat
 * @file scripts/commands/uat.js
 *
 * @llm-rule WHEN: Coordinating UAT test case generation and execution
 * @llm-rule AVOID: Business logic - delegate to helpers for maintainability
 * @llm-rule NOTE: Main entry point that imports and delegates to helper modules
 */

import { createLogger } from '../logger.js';
import {
  generateAllFeatureTestCases,
  generateFeatureTestCases,
} from '../helpers/generateTestCase.js';
import { runFeatureTests, runAllFeatureTests } from '../helpers/runTestCase.js';

const log = createLogger('uat');

/**
 * UAT testing command for FLUX Framework endpoints
 * @llm-rule WHEN: Generating test cases or running UAT tests
 * @llm-rule AVOID: Implementing business logic here - use helpers
 * @llm-rule NOTE: npm run flux:uat generate:feature [--overwrite] OR npm run flux:uat run:feature [--restart]
 *
 * Examples:
 * - npm run flux:uat generate:weather                    # Generate Excel test cases (timestamped)
 * - npm run flux:uat generate:weather --overwrite       # Generate Excel test cases (overwrite existing)
 * - npm run flux:uat generate:all                        # Generate test cases for all features
 * - npm run flux:uat run:weather                        # Run UAT tests against localhost:3000
 * - npm run flux:uat run:weather --restart              # Restart UAT execution from beginning
 * - npm run flux:uat run:all                            # Run all features against localhost:3000
 */
export default async function uat(args) {
  const startTime = Date.now();

  if (!args || args.length === 0) {
    showUATHelp();
    return false;
  }

  // Parse command and target
  const command = args[0]; // generate:weather or run:weather
  const [action, target] = command.split(':');

  if (!['generate', 'run'].includes(action)) {
    console.log('❌ Invalid action. Use generate:feature or run:feature');
    return false;
  }

  if (!target) {
    console.log('❌ Target required. Use generate:weather or run:weather');
    return false;
  }

  // Parse flags
  const hasOverwrite = args.includes('--overwrite');
  const hasRestart = args.includes('--restart');

  try {
    if (action === 'generate') {
      return await handleGenerateCommand(target, hasOverwrite, startTime);
    } else {
      return await handleRunCommand(target, hasRestart, startTime);
    }
  } catch (error) {
    console.log(`❌ UAT ${action} error: ${error.message}`);
    return false;
  }
}

/**
 * Handle generate command for UAT test cases
 * @param {string} target - Target feature or 'all'
 * @param {boolean} overwrite - Whether to overwrite existing files
 * @param {number} startTime - Command start timestamp
 * @returns {Promise<boolean>} Success status
 */
async function handleGenerateCommand(target, overwrite, startTime) {
  log.info(`📋 Generating UAT test cases for ${target}`);

  const results = [];

  if (target === 'all') {
    // Generate test cases for all features
    results.push(...(await generateAllFeatureTestCases(overwrite)));
  } else {
    // Generate test cases for specific feature
    results.push(await generateFeatureTestCases(target, overwrite));
  }

  // Report results
  const duration = Date.now() - startTime;
  const successful = results.filter((r) => r.success).length;
  const total = results.length;

  if (successful === total) {
    console.log(
      `✅ UAT test cases generated (${successful}/${total}) ${duration}ms`
    );

    results.forEach((result) => {
      console.log(`   📊 ${result.excelFile}`);
      console.log(`      ${result.testCasesGenerated} test cases created`);
      if (result.wasOverwritten) {
        console.log(`      ⚠️  Existing file was overwritten`);
      }
    });

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review Excel files in __uat__ folders`);
    console.log(`   2. Customize test data if needed`);
    console.log(`   3. Run tests: npm run flux:uat run:${target}`);

    return true;
  } else {
    console.log(
      `❌ UAT test case generation failed (${successful}/${total}) ${duration}ms`
    );

    results
      .filter((r) => !r.success)
      .forEach((result) => {
        console.log(`   ❌ ${result.feature}: ${result.error}`);
      });

    return false;
  }
}

/**
 * Handle run command for UAT test execution
 * @param {string} target - Target feature or 'all'
 * @param {boolean} restart - Whether to restart from beginning
 * @param {number} startTime - Command start timestamp
 * @returns {Promise<boolean>} Success status
 */
async function handleRunCommand(target, restart, startTime) {
  log.info(`🧪 Running UAT tests for ${target} on localhost:3000`);

  const results = [];

  try {
    if (target === 'all') {
      // Run tests for all features
      results.push(...(await runAllFeatureTests(restart)));
    } else {
      // Run tests for specific feature
      results.push(await runFeatureTests(target, restart));
    }

    // Report results
    const duration = Date.now() - startTime;
    const successful = results.filter((r) => r.success).length;
    const total = results.length;

    if (successful === total) {
      console.log(
        `✅ UAT test execution completed (${successful}/${total}) ${duration}ms`
      );

      results.forEach((result) => {
        console.log(`   🧪 ${result.feature}: ${result.status}`);
        console.log(`      Tests run: ${result.testsRun}`);
        console.log(`      Passed: ${result.testsPassed}`);
        if (result.testsFailed > 0) {
          console.log(`      Failed: ${result.testsFailed} ⚠️`);
        }
        if (result.excelFile) {
          console.log(`      Excel updated: ${result.excelFile}`);
        }
      });

      return true;
    } else {
      console.log(
        `❌ UAT test execution failed (${successful}/${total}) ${duration}ms`
      );

      results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`   ❌ ${result.feature}: ${result.status}`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        });

      return false;
    }
  } catch (error) {
    console.log(`❌ UAT execution error: ${error.message}`);
    return false;
  }
}

/**
 * Show UAT command help and usage examples
 * @llm-rule WHEN: User provides invalid arguments or requests help
 * @llm-rule AVOID: Verbose help - keep focused on essential usage
 * @llm-rule NOTE: Shows comprehensive usage patterns and workflow
 */
function showUATHelp() {
  console.log(`
🧪 FLUX UAT Testing - Excel-Based User Acceptance Testing

GENERATE PHASE:
  npm run flux:uat generate:weather              # Generate Excel test cases (timestamped)
  npm run flux:uat generate:weather --overwrite # Generate Excel test cases (overwrite existing)
  npm run flux:uat generate:all                 # Generate test cases for all features

RUN PHASE:
  npm run flux:uat run:weather                   # Execute tests against localhost:3000
  npm run flux:uat run:weather --restart        # Restart execution from beginning
  npm run flux:uat run:all                       # Execute all features against localhost:3000
  npm run flux:uat run:all --restart            # Restart all features from beginning

WHAT IT CREATES:
  Generate Phase:
  - src/api/{feature}/__uat__/{feature}.testcases_YYYYMMDDHHMMSS.xlsx (timestamped)
  - src/api/{feature}/__uat__/{feature}.testcases.xlsx (overwrite mode)
  
  Run Phase:
  - Updates Excel files with test results and color coding
  - Creates {feature}.execution.state.json for resumable execution
  - Live browser automation with visual feedback

EXCEL STRUCTURE:
  - Test Cases Sheet: Comprehensive test scenarios targeting localhost:3000
  - Environment Config Sheet: Local development settings
  - Summary Sheet: Test statistics and overview

EXECUTION FEATURES:
  ✅ Visual browser automation with Playwright (Chromium)
  ✅ Live Excel updates with color-coded results
  ✅ Resumable execution - automatically continues from last failed test
  ✅ Row color coding: White (pending), Yellow (running), Green (pass), Red (fail)
  ✅ Execution state tracking with .state.json files
  ✅ Real-time progress reporting
  ✅ Automatic halt on first failure with recovery instructions

SPECIFICATION-DRIVEN TESTING:
  ✅ Test cases from specification.endpoints[endpoint].test.test_cases
  ✅ Real test data extracted from test case paths  
  ✅ Parameter replacement: /api/weather/:city → /api/weather/mumbai
  ✅ Security tests: XSS, SQL injection, input validation
  ✅ Edge cases: Unicode, encoding, boundary conditions

TEST CATEGORIES:
  📗 Happy Path: Successful scenarios with valid data
  📙 Validation: Input validation rules from specification
  📕 Security: XSS, SQL injection, malicious input protection  
  📘 Error Handling: External API failures and timeouts
  📔 Edge Cases: Unicode, encoding, boundary conditions

EXAMPLE WORKFLOW:
  1. npm run flux:uat generate:weather
  2. Open src/api/weather/__uat__/weather.testcases_YYYYMMDDHHMMSS.xlsx
  3. Review test cases (paths with actual values, not :parameters)
  4. Customize test data for query parameters if needed
  5. npm run flux:uat run:weather
  6. Watch browser automation execute tests with live Excel updates
  7. Fix any failures and resume with npm run flux:uat run:weather

RESUMABLE EXECUTION:
  🔄 Execution automatically saves state after each test
  🔄 If execution halts due to failure, simply run the same command to resume
  🔄 Use --restart flag to start fresh and ignore saved state
  🔄 State files stored as {feature}.execution.state.json in __uat__ folders

BROWSER AUTOMATION:
  🌐 Uses visible Chromium browser with 500ms slow motion
  🌐 Real-time test case titles shown in browser
  🌐 2-second delays between tests for visual feedback
  🌐 Automatic network waiting and timeout handling
  🌐 Supports both GET and POST/PUT/DELETE requests

EXCEL COLOR CODING:
  ⚪ White: Test pending execution
  🟡 Yellow: Test currently running
  🟢 Green: Test passed successfully
  🔴 Red: Test failed with error details
  🟣 Purple: Test skipped

ENVIRONMENT:
  All UAT tests run against: http://localhost:3000
  Perfect for agent-driven development and testing

FILE ORGANIZATION:
  src/api/weather/
  ├── __uat__/                                    # UAT test files
  │   ├── weather.testcases_20250730104002.xlsx   # Timestamped generations
  │   ├── weather.testcases_20250730105534.xlsx   # Multiple versions preserved
  │   ├── weather.testcases.xlsx                  # Overwrite mode (--overwrite)
  │   └── weather.execution.state.json            # Execution state for resuming
  ├── main/                                       # Feature implementation
  ├── @city/
  ├── weather.specification.json                 # Source for test cases
  └── weather.requirements.yml

SECURITY TESTS INCLUDED:
  🛡️  XSS Protection: Script tags, image tags, event handlers
  🛡️  SQL Injection: DROP tables, UNION selects, OR conditions
  🛡️  Input Validation: Empty inputs, extremely long inputs
  🛡️  Special Characters: Null bytes, control characters
  🛡️  Encoding Attacks: URL encoding bypass attempts
  🛡️  Boundary Values: Negative numbers, integer overflow

RECOVERY FROM FAILURES:
  When a test fails, execution continues to test all remaining cases.
  Failed tests are marked with red backgrounds in Excel.
  Only system errors (browser crashes, file issues) halt execution.
  
  System Error Recovery:
  - Fix the underlying system issue (browser, file permissions, etc.)
  - Run: npm run flux:uat run:feature (resumes from last successful test)
  
  Test Failure Review:
  - All test failures are recorded in Excel with red backgrounds
  - Review failed tests and fix issues in your API implementation
  - Re-run tests to verify fixes: npm run flux:uat run:feature

PERFORMANCE FEATURES:
  ⚡ Smart Excel file discovery (uses latest timestamped file)
  ⚡ Efficient browser reuse across test cases
  ⚡ Minimal memory footprint with streaming Excel updates
  ⚡ Parallel execution support for multiple features (run:all)
`);
}
