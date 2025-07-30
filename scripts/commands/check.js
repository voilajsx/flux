/**
 * FLUX Framework Check Command - Master validation pipeline
 * @module @voilajsx/flux/scripts/commands/check
 * @file scripts/commands/check.js
 *
 * @llm-rule WHEN: Running FLUX validation pipeline for full features or specific endpoints
 * @llm-rule AVOID: Running validation without proper scope determination
 * @llm-rule NOTE: Supports endpoint/feature/full validation with unified file-path targeting
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createLogger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = createLogger('check');

/**
 * Master validation command with comprehensive pipeline
 * @llm-rule WHEN: Ensuring validation scope matches development context
 * @llm-rule AVOID: Over-validating during endpoint development
 * @llm-rule NOTE: Forwards arguments to individual validation commands with unified file-path support
 */
export default async function check(args) {
  const totalStartTime = Date.now();
  const target = args.find((arg) => !arg.startsWith('-'));

  // Determine validation scope
  const validationScope = determineValidationScope(target);

  log.human(
    `🔍 FLUX: Starting ${validationScope.description} validation pipeline...`
  );
  if (validationScope.target) {
    log.human(`🎯 Target: ${validationScope.target}`);
  }
  log.human('');

  // Define validation sequence - reordered for optimal workflow:
  // 1. types: Ensure compilation safety first
  // 2. lint: Validate code standards and patterns
  // 3. test: Verify functionality works
  // 4. contract: Complete endpoint validation (contract-implementation consistency)
  const checks = [
    {
      name: 'types',
      description: 'TypeScript validation and type consistency',
    },
    {
      name: 'lint',
      description: 'Code standards and VoilaJSX patterns',
    },
    {
      name: 'test',
      description: 'Functionality testing',
    },
    {
      name: 'contract',
      description: 'Complete endpoint validation and consistency',
    },
  ];

  let passedChecks = 0;
  let results = [];

  // Execute validation pipeline in strict sequence
  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    const stepNum = i + 1;

    log.step(stepNum, checks.length, `${check.name} (${check.description})`);

    try {
      const startTime = Date.now();

      // Import and execute validation command with target
      // This automatically supports file-path syntax since individual commands have been updated
      const commandModule = await import(`./${check.name}.js`);
      const success = await commandModule.default(args);

      const duration = Date.now() - startTime;

      if (success) {
        log.commandComplete(check.name, duration, true);
        passedChecks++;
        results.push({ name: check.name, status: 'passed', duration });
      } else {
        log.commandComplete(check.name, duration, false);
        results.push({ name: check.name, status: 'failed', duration });

        // Stop on first failure - fail-fast for reliability
        log.pipelineFail(Date.now() - totalStartTime, stepNum, checks.length);
        printFailureSummary(results, totalStartTime, validationScope);
        return false;
      }

      // Add spacing between validation steps
      log.human('');
    } catch (error) {
      log.error(`${check.name} crashed: ${error.message}`, {
        check: check.name,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3),
        target: validationScope.target,
      });

      results.push({ name: check.name, status: 'crashed', duration: 0 });
      log.pipelineFail(Date.now() - totalStartTime, stepNum, checks.length);
      printFailureSummary(results, totalStartTime, validationScope);
      return false;
    }
  }

  // All validation checks passed successfully
  printSuccessSummary(results, totalStartTime, validationScope);
  return true;
}

/**
 * Determine validation scope based on target argument
 * @llm-rule WHEN: Deciding between full, feature, or endpoint-level validation
 * @llm-rule AVOID: Wrong validation scope - causes unnecessary work or missed issues
 * @llm-rule NOTE: Supports unified file-path syntax: feature, endpoint, and specific files
 */
function determineValidationScope(target) {
  if (!target) {
    return {
      type: 'full',
      description: 'complete project',
      target: null,
      scope: 'all features',
    };
  }

  // Handle specific file targeting (hello/main.contract.js)
  if (target.includes('.') && target.includes('/')) {
    const lastSlash = target.lastIndexOf('/');
    const pathPart = target.slice(0, lastSlash);
    const filePart = target.slice(lastSlash + 1);
    const [feature, endpoint] = pathPart.split('/');

    return {
      type: 'file',
      description: `specific file ${filePart}`,
      target: target,
      feature: feature,
      endpoint: endpoint,
      scope: `${pathPart}/${filePart} file only`,
    };
  }

  // Handle feature/endpoint syntax (hello/main)
  if (target.includes('/')) {
    const [feature, endpoint] = target.split('/');
    return {
      type: 'endpoint',
      description: 'endpoint-level',
      target: target,
      feature: feature,
      endpoint: endpoint,
      scope: `${feature}/${endpoint} endpoint only`,
    };
  }

  // Feature-specific validation (hello)
  return {
    type: 'feature',
    description: 'feature-level',
    target: target,
    feature: target,
    scope: `${target} feature only`,
  };
}

/**
 * Print comprehensive success summary with performance metrics
 * @llm-rule WHEN: All validation checks pass to provide clear success confirmation
 * @llm-rule AVOID: Generic success messages - show detailed validation results
 * @llm-rule NOTE: Includes performance metrics and scope information for context
 */
function printSuccessSummary(results, totalStartTime, validationScope) {
  const totalDuration = Date.now() - totalStartTime;

  log.human('');

  // Dynamic success message based on validation scope
  let successMessage = '🎉 FLUX: ';
  if (validationScope.type === 'endpoint') {
    successMessage += `Endpoint ${validationScope.feature}/${validationScope.endpoint} validation completed!`;
  } else if (validationScope.type === 'feature') {
    successMessage += `Feature ${validationScope.feature} validation completed!`;
  } else if (validationScope.type === 'file') {
    successMessage += `File ${validationScope.target} validation completed!`;
  } else {
    successMessage += 'Complete application validation completed!';
  }

  log.human(successMessage);

  // Validation scope summary with performance breakdown
  log.human(`📊 Summary: ${validationScope.scope} (${totalDuration}ms)`);
  results.forEach((result) => {
    log.human(`   ✅ ${result.name}: ${result.duration}ms`);
  });

  log.human('');
}

/**
 * Print detailed failure summary with debugging guidance
 * @llm-rule WHEN: Any validation check fails to provide actionable debugging information
 * @llm-rule AVOID: Generic failure messages - show specific failure context and suggestions
 * @llm-rule NOTE: Includes performance data and targeted debugging suggestions
 */
function printFailureSummary(results, totalStartTime, validationScope) {
  const totalDuration = Date.now() - totalStartTime;
  const passedChecks = results.filter((r) => r.status === 'passed').length;
  const failedChecks = results.filter((r) => r.status === 'failed').length;
  const crashedChecks = results.filter((r) => r.status === 'crashed').length;

  log.human('');
  log.human('❌ FLUX: Validation pipeline failed');
  log.human('');

  // Failure summary
  log.human(`📊 Failure Summary:`);
  log.human(`   Scope: ${validationScope.scope}`);
  log.human(`   Total Duration: ${totalDuration}ms`);
  log.human(
    `   Passed: ${passedChecks}, Failed: ${failedChecks}, Crashed: ${crashedChecks}`
  );
  log.human('');

  // Show results breakdown
  log.human(`🔍 Check Results:`);
  results.forEach((result) => {
    let emoji = '✅';
    if (result.status === 'failed') emoji = '❌';
    if (result.status === 'crashed') emoji = '💥';

    log.human(`   ${emoji} ${result.name}: ${result.duration}ms`);
  });

  log.human('');

  // Targeted debugging suggestions
  const firstFailure = results.find((r) => r.status !== 'passed');
  if (firstFailure) {
    log.human(`🔧 Next Steps:`);
    log.human(`   1. Focus on fixing: ${firstFailure.name}`);
    log.human(
      `   2. Run individually: npm run flux:${firstFailure.name} ${validationScope.target || ''}`
    );
    log.human(`   3. Check detailed error output above`);

    if (validationScope.type === 'full') {
      log.human(
        `   4. Try feature-specific validation: npm run flux:check <feature>`
      );
    }

    log.human('   5. Use DEBUG=1 for verbose error information');
  }

  log.human('');
}

/**
 * Show detailed failure context based on command type
 * @llm-rule WHEN: Command fails to provide actionable next steps
 * @llm-rule AVOID: Generic error messages - provide command-specific guidance
 * @llm-rule NOTE: Helps users quickly identify and fix common issues
 */
function showFailureHelp(command) {
  console.log('\n🔧 Next Steps:');

  switch (command) {
    case 'types':
      console.log('   • Fix TypeScript compilation errors shown above');
      console.log('   • Check import paths and module declarations');
      console.log('   • Ensure VoilaJSX AppKit types are properly imported');
      break;
    case 'lint':
      console.log('   • Fix code style violations shown above');
      console.log('   • Ensure VoilaJSX .get() patterns are used');
      console.log('   • Check file naming conventions match FLUX standards');
      break;
    case 'test':
      console.log('   • Fix failing tests shown above');
      console.log('   • Ensure test files exist for all endpoints');
      console.log('   • Check test coverage meets requirements');
      break;
    case 'contract':
      console.log('   • Ensure CONTRACT export exists in contract files');
      console.log('   • Verify route handlers exist in logic files');
      console.log('   • Check contract-implementation consistency');
      break;
    case 'check':
      console.log('   • Fix the failing validation step shown above');
      console.log('   • Run individual commands to isolate issues');
      console.log('   • Use feature-specific targeting for faster debugging');
      break;
  }

  console.log('   • Run with DEBUG=1 for detailed error information');
  console.log('');
}
