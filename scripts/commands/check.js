/**
 * ATOM Framework Check Command - Master validation pipeline with auto-commit safety
 * @module @voilajsx/atom/scripts/commands/check
 * @file scripts/commands/check.js
 *
 * @llm-rule WHEN: Running ATOM validation pipeline for full features or specific endpoints with auto-commit
 * @llm-rule AVOID: Running validation without safety commits - loses progress on failures
 * @llm-rule NOTE: Supports endpoint/feature/full validation with intelligent auto-commit after success
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createLogger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

const log = createLogger('check');

/**
 * Master validation command with auto-commit safety after successful validation
 * @llm-rule WHEN: Ensuring validation scope matches development context with safety commits
 * @llm-rule AVOID: Over-validating during endpoint development or losing progress without commits
 * @llm-rule NOTE: Automatically commits after successful validation to provide rollback points
 */
export default async function check(args) {
  const totalStartTime = Date.now();
  const target = args.find((arg) => !arg.startsWith('-'));

  // Determine validation scope
  const validationScope = determineValidationScope(target);

  log.human(
    `🔍 ATOM: Starting ${validationScope.description} validation pipeline...`
  );
  if (validationScope.target) {
    log.human(`🎯 Target: ${validationScope.target}`);
  }
  log.human('');

  // Define validation sequence - order matters for dependency resolution
  const checks = [
    {
      name: 'types',
      description: 'TypeScript validation and type consistency',
    },
    { name: 'lint', description: 'Code standards and VoilaJSX patterns' },
    {
      name: 'contract',
      description: 'Contract compliance and helper validation',
    },
    {
      name: 'test',
      description: 'Functionality testing',
    },
    {
      name: 'compliance',
      description: 'Implementation validation and manifest generation',
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
  log.pipelineSuccess(Date.now() - totalStartTime, passedChecks, checks.length);

  // Auto-commit after successful validation
  await safeGitCommit(validationScope, args);

  printSuccessSummary(results, totalStartTime, validationScope);
  return true;
}

/**
 * Determine validation scope based on target argument
 * @llm-rule WHEN: Deciding between full, feature, or endpoint-level validation
 * @llm-rule AVOID: Wrong validation scope - causes unnecessary work or missed issues
 * @llm-rule NOTE: Endpoint format: feature/endpoint, Feature format: feature, Full: no target
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

  return {
    type: 'feature',
    description: 'feature-level',
    target: target,
    feature: target,
    scope: `${target} feature only`,
  };
}

/**
 * Safe git commit with intelligent message generation and graceful error handling
 * @llm-rule WHEN: Auto-committing after successful validation to provide rollback points
 * @llm-rule AVOID: Crashing on git errors - handle gracefully and inform user
 * @llm-rule NOTE: Detects git status and generates appropriate commit messages automatically
 */
async function safeGitCommit(validationScope, args) {
  try {
    // 1. Check if git is initialized
    await execAsync('git rev-parse --git-dir');

    // 2. Check if there's anything to commit
    const { stdout: gitStatus } = await execAsync('git status --porcelain');

    if (!gitStatus.trim()) {
      log.human('ℹ️ No changes to commit - validation checkpoint only');
      return;
    }

    // 3. Generate commit message (manual override or intelligent)
    const commitMessage = args.includes('-m')
      ? extractManualMessage(args)
      : generateIntelligentCommitMessage(validationScope, gitStatus);

    // 4. Commit changes
    await execAsync(`git add . && git commit -m "${commitMessage}"`);
    log.human(`✅ Auto-committed: ${commitMessage}`);
  } catch (error) {
    if (error.message.includes('not a git repository')) {
      log.human('ℹ️ Git not initialized - skipping auto-commit');
      log.human(
        '💡 Run: git init && git add . && git commit -m "Initial commit"'
      );
    } else if (error.message.includes('nothing to commit')) {
      log.human('ℹ️ No changes to commit');
    } else {
      log.human(`⚠️ Git commit failed: ${error.message}`);
    }
  }
}

/**
 * Extract manual commit message from command arguments
 * @llm-rule WHEN: User provides custom commit message with -m flag
 * @llm-rule AVOID: Missing message extraction - use fallback if not found
 * @llm-rule NOTE: Handles both -m "message" and -m message formats
 */
function extractManualMessage(args) {
  const messageIndex = args.findIndex((arg) => arg === '-m');

  if (messageIndex !== -1 && args[messageIndex + 1]) {
    return args[messageIndex + 1];
  }

  // Fallback if -m flag found but no message
  return 'chore: manual commit after validation';
}

/**
 * Generate intelligent commit message based on git status and validation scope
 * @llm-rule WHEN: Auto-generating commit messages based on file changes and validation context
 * @llm-rule AVOID: Generic messages - be specific about what changed and what was validated
 * @llm-rule NOTE: Follows conventional commit format with appropriate prefixes
 */
function generateIntelligentCommitMessage(validationScope, gitStatus) {
  const changedFiles = parseGitStatus(gitStatus);

  // Analyze what types of files changed
  const hasNewFiles = changedFiles.some((f) => f.status === 'A');
  const hasModified = changedFiles.some((f) => f.status === 'M');
  const hasTests = changedFiles.some((f) => f.file.includes('.test.'));
  const hasContracts = changedFiles.some((f) => f.file.includes('.contract.'));
  const hasLogic = changedFiles.some((f) => f.file.includes('.logic.'));

  // Generate appropriate commit message based on changes and scope
  if (validationScope.type === 'endpoint') {
    if (hasNewFiles) {
      return `feat(${validationScope.target}): implement endpoint`;
    } else if (hasTests && hasLogic) {
      return `fix(${validationScope.target}): update implementation and tests`;
    } else if (hasTests) {
      return `test(${validationScope.target}): update test coverage`;
    } else if (hasContracts) {
      return `feat(${validationScope.target}): update contract specification`;
    } else if (hasLogic) {
      return `fix(${validationScope.target}): update logic implementation`;
    } else {
      return `chore(${validationScope.target}): endpoint validation passed ✅`;
    }
  } else if (validationScope.type === 'feature') {
    if (hasNewFiles) {
      return `feat(${validationScope.target}): add feature implementation`;
    } else if (hasModified) {
      return `fix(${validationScope.target}): update feature implementation`;
    } else {
      return `chore(${validationScope.target}): feature validation complete ✅`;
    }
  } else {
    // Full project validation
    if (hasNewFiles) {
      return `feat: add new functionality`;
    } else if (hasModified) {
      return `fix: update project implementation`;
    } else {
      return `chore: full project validation passed ✅`;
    }
  }
}

/**
 * Parse git status output into structured file change data
 * @llm-rule WHEN: Analyzing git status to understand what files changed for commit message generation
 * @llm-rule AVOID: Complex parsing - use simple status code detection
 * @llm-rule NOTE: Handles standard git status codes (A=added, M=modified, D=deleted, etc.)
 */
function parseGitStatus(gitStatus) {
  return gitStatus
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const status = line.substring(0, 2).trim();
      const file = line.substring(3);

      return {
        status: status.includes('A')
          ? 'A'
          : status.includes('M')
            ? 'M'
            : status.includes('D')
              ? 'D'
              : 'U',
        file: file,
      };
    });
}

/**
 * Print comprehensive success summary with scope-aware messaging and commit confirmation
 * @llm-rule WHEN: All validation checks pass and pipeline completes successfully
 * @llm-rule AVOID: Generic success messages - tailor to validation scope and commit status
 * @llm-rule NOTE: Provides scope-appropriate deployment readiness and next steps
 */
function printSuccessSummary(results, startTime, validationScope) {
  const totalDuration = Date.now() - startTime;
  const passedCount = results.filter((r) => r.status === 'passed').length;
  const totalCount = results.length;

  log.human('');
  log.human('📊 ATOM Validation Summary:');
  log.human(
    `   Scope: ${validationScope.description} (${validationScope.scope})`
  );
  if (validationScope.target) {
    log.human(`   Target: ${validationScope.target}`);
  }
  log.human(`   Total time: ${totalDuration}ms`);
  log.human(`   Checks passed: ${passedCount}/${totalCount}`);
  log.human('   Status: ✅ ALL CHECKS PASSED');

  // Scope-appropriate next steps
  if (validationScope.type === 'endpoint') {
    log.human('   Ready for: 🔧 Endpoint integration testing');
    log.human(
      `   Next step: npm run atom:check ${validationScope.feature} (validate full feature)`
    );
  } else if (validationScope.type === 'feature') {
    log.human('   Ready for: 🧪 Feature integration testing');
    log.human('   Next step: npm run atom:check (validate complete project)');
  } else {
    log.human('   Ready for: 🚀 Production deployment');
    log.human('   Next step: Deploy to staging environment');
  }

  log.human('');
  log.human('   Individual results:');

  results.forEach((result) => {
    const icon =
      result.status === 'passed'
        ? '✅'
        : result.status === 'failed'
          ? '❌'
          : '💥';
    log.human(
      `     ${icon} ${result.name}: ${result.status} (${result.duration}ms)`
    );
  });

  log.human('');
  log.commandComplete('check', totalDuration, true);
}

/**
 * Print detailed failure summary with scope-aware debugging information
 * @llm-rule WHEN: Any validation check fails and pipeline stops execution
 * @llm-rule AVOID: Generic failure messages - provide scope-specific context and next steps
 * @llm-rule NOTE: Includes validation scope context for targeted debugging
 */
function printFailureSummary(results, startTime, validationScope) {
  const totalDuration = Date.now() - startTime;
  const passedCount = results.filter((r) => r.status === 'passed').length;
  const totalCount = results.length;

  log.human('');
  log.human('📊 ATOM Validation Summary:');
  log.human(
    `   Scope: ${validationScope.description} (${validationScope.scope})`
  );
  if (validationScope.target) {
    log.human(`   Target: ${validationScope.target}`);
  }
  log.human(`   Total time: ${totalDuration}ms`);
  log.human(`   Checks passed: ${passedCount}/${totalCount}`);
  log.human('   Status: ❌ VALIDATION FAILED');

  // Scope-appropriate debugging guidance
  if (validationScope.type === 'endpoint') {
    log.human('   Action: 🔧 Fix endpoint-specific issues above');
    log.human(`   Focus: Only ${validationScope.target} needs attention`);
  } else if (validationScope.type === 'feature') {
    log.human('   Action: 🔧 Fix feature-level issues above');
    log.human(`   Focus: Issues in ${validationScope.target} feature`);
  } else {
    log.human('   Action: 🔧 Fix project-wide issues above');
    log.human('   Focus: System-wide validation failures');
  }

  log.human('');
  log.human('   Individual results:');

  results.forEach((result) => {
    const icon =
      result.status === 'passed'
        ? '✅'
        : result.status === 'failed'
          ? '❌'
          : '💥';
    log.human(
      `     ${icon} ${result.name}: ${result.status} (${result.duration}ms)`
    );
  });

  log.human('');
  log.commandComplete('check', totalDuration, false);
}
