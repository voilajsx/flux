#!/usr/bin/env node

/**
 * FLUX Framework Action Reader - Agent execution resume helper
 * @module @voilajsx/flux/scripts/action-reader
 * @file scripts/action-reader.js
 *
 * @llm-rule WHEN: Agent needs to determine where to resume execution after interruption
 * @llm-rule AVOID: Manual log parsing - use this automated resume detection
 * @llm-rule NOTE: Analyzes action logs to provide clear next-step guidance
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Application entry point - determines execution status and next steps
 * @llm-rule WHEN: Agent starting execution or resuming after interruption
 * @llm-rule AVOID: Guessing where to start - always check action log first
 * @llm-rule NOTE: Provides clear guidance on next task to execute
 */
async function main() {
  try {
    const [feature] = process.argv.slice(2);

    if (!feature) {
      displayUsage();
      process.exit(1);
    }

    const resumeInfo = await analyzeExecutionStatus(feature);
    displayResumeGuidance(feature, resumeInfo);
  } catch (error) {
    console.error(`💥 Action reader failed: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Analyze action log to determine current execution status
 * @llm-rule WHEN: Need to understand what tasks have been completed
 * @llm-rule AVOID: Complex parsing - focus on key task completion markers
 * @llm-rule NOTE: Looks for TASK_X.Y_COMPLETE patterns to track progress
 */
async function analyzeExecutionStatus(feature) {
  const logFilePath = getLogFilePath(feature);

  if (!existsSync(logFilePath)) {
    return {
      status: 'not_started',
      message: 'No action log found - execution has not started',
      nextTask: '1.1',
      nextAction: 'Start with first task',
    };
  }

  const logContent = await readFile(logFilePath, 'utf8');
  const logLines = logContent
    .trim()
    .split('\n')
    .filter((line) => line.length > 0);

  if (logLines.length === 0) {
    return {
      status: 'not_started',
      message: 'Action log is empty - execution has not started',
      nextTask: '1.1',
      nextAction: 'Start with first task',
    };
  }

  // Find all completed tasks
  const completedTasks = [];
  const startedTasks = [];

  logLines.forEach((line) => {
    const completeMatch = line.match(/TASK_(\d+\.\d+)_COMPLETE/);
    const startMatch = line.match(/TASK_(\d+\.\d+)_START/);

    if (completeMatch) {
      completedTasks.push(completeMatch[1]);
    }
    if (startMatch) {
      startedTasks.push(startMatch[1]);
    }
  });

  // Determine current status
  if (completedTasks.length === 0 && startedTasks.length === 0) {
    return {
      status: 'not_started',
      message: 'No task markers found in log',
      nextTask: '1.1',
      nextAction: 'Start with first task',
      completedTasks: [],
      lastEntry: logLines[logLines.length - 1],
    };
  }

  // Find the latest completed task
  const lastCompleted =
    completedTasks.length > 0 ? getLatestTask(completedTasks) : null;

  // Find tasks that were started but not completed
  const incompleteTask = startedTasks.find(
    (task) => !completedTasks.includes(task)
  );

  let status, message, nextTask, nextAction;

  if (incompleteTask) {
    status = 'in_progress';
    message = `Task ${incompleteTask} was started but not completed`;
    nextTask = incompleteTask;
    nextAction = `Resume task ${incompleteTask}`;
  } else if (lastCompleted) {
    const nextTaskNumber = getNextTask(lastCompleted);
    status = 'ready_for_next';
    message = `Last completed: Task ${lastCompleted}`;
    nextTask = nextTaskNumber;
    nextAction = `Start task ${nextTaskNumber}`;
  } else {
    status = 'unknown';
    message = 'Unable to determine execution status';
    nextTask = '1.1';
    nextAction = 'Review log and start with first task';
  }

  return {
    status,
    message,
    nextTask,
    nextAction,
    completedTasks,
    incompleteTask,
    lastCompleted,
    lastEntry: logLines[logLines.length - 1],
    totalLogEntries: logLines.length,
  };
}

/**
 * Get the latest task number from completed tasks list
 * @llm-rule WHEN: Finding the most recent completed task
 * @llm-rule AVOID: String sorting - use proper numeric comparison
 * @llm-rule NOTE: Handles task numbers like 1.1, 1.2, 2.1, etc.
 */
function getLatestTask(tasks) {
  return tasks.sort((a, b) => {
    const [majorA, minorA] = a.split('.').map(Number);
    const [majorB, minorB] = b.split('.').map(Number);

    if (majorA !== majorB) return majorB - majorA;
    return minorB - minorA;
  })[0];
}

/**
 * Calculate next task number based on completed task
 * @llm-rule WHEN: Determining which task should be executed next
 * @llm-rule AVOID: Hardcoded task sequences - use incremental logic
 * @llm-rule NOTE: Increments minor version first, then major version
 */
function getNextTask(currentTask) {
  const [major, minor] = currentTask.split('.').map(Number);

  // Simple increment logic - can be enhanced based on task structure
  const nextMinor = minor + 1;

  // For most cases, just increment the minor version
  // In real implementation, this could check against instruction file
  return `${major}.${nextMinor}`;
}

/**
 * Display clear resume guidance for agent or human
 * @llm-rule WHEN: Showing execution status and next steps
 * @llm-rule AVOID: Information overload - focus on actionable guidance
 * @llm-rule NOTE: Provides both status summary and specific next actions
 */
function displayResumeGuidance(feature, resumeInfo) {
  console.log(`\n🤖 FLUX Execution Status for: ${feature}\n`);

  // Status indicator
  const statusIcon =
    {
      not_started: '🟡',
      in_progress: '🔄',
      ready_for_next: '✅',
      unknown: '❓',
    }[resumeInfo.status] || '❓';

  console.log(`${statusIcon} Status: ${resumeInfo.status.toUpperCase()}`);
  console.log(`📋 ${resumeInfo.message}\n`);

  // Execution progress
  if (resumeInfo.completedTasks && resumeInfo.completedTasks.length > 0) {
    console.log(`✅ Completed Tasks (${resumeInfo.completedTasks.length}):`);
    resumeInfo.completedTasks
      .sort((a, b) => {
        const [majorA, minorA] = a.split('.').map(Number);
        const [majorB, minorB] = b.split('.').map(Number);
        if (majorA !== majorB) return majorA - majorB;
        return minorA - minorB;
      })
      .forEach((task) => console.log(`   ✓ Task ${task}`));
    console.log('');
  }

  // Incomplete task warning
  if (resumeInfo.incompleteTask) {
    console.log(`⚠️  Incomplete Task: ${resumeInfo.incompleteTask}`);
    console.log(`   This task was started but not finished\n`);
  }

  // Next action guidance
  console.log(`🎯 Next Action:`);
  console.log(`   Execute Task ${resumeInfo.nextTask}`);
  console.log(`   ${resumeInfo.nextAction}\n`);

  // Latest log entry for context
  if (resumeInfo.lastEntry) {
    console.log(`📝 Latest Log Entry:`);
    console.log(`   ${resumeInfo.lastEntry}\n`);
  }
}

/**
 * Generate log file path for specific feature
 * @llm-rule WHEN: Determining where to read action logs
 * @llm-rule AVOID: Hardcoding paths - use consistent path generation
 * @llm-rule NOTE: Follows FLUX convention: src/features/{feature}/{feature}.actions.log
 */
function getLogFilePath(feature) {
  return join(
    process.cwd(),
    'src',
    'features',
    feature,
    `${feature}.actions.log`
  );
}

/**
 * Display usage information and examples
 * @llm-rule WHEN: User provides invalid arguments or requests help
 * @llm-rule AVOID: Verbose help text - keep focused on essential usage
 * @llm-rule NOTE: Shows practical examples for resuming execution
 */
function displayUsage() {
  console.log(`
🤖 FLUX Action Reader - Execution Resume Helper

USAGE:
  npm run flux:actionread <feature>

EXAMPLES:
  npm run flux:actionread weather     # Check weather feature status
  npm run flux:actionread auth        # Check auth feature status
  npm run flux:actionread hello       # Check hello feature status

WHAT IT SHOWS:
  ✅ Execution status (not started, in progress, ready for next)
  📋 Last completed task
  ⚠️  Incomplete tasks (started but not finished)
  🎯 Next task to execute
  📝 Latest log entry for context
  🔧 Helpful commands for further investigation

SETUP:
  Add to package.json:
  {
    "scripts": {
      "flux:actionread": "node scripts/action-reader.js"
    }
  }

AGENT USAGE:
  Always run this command when starting execution to determine
  where to resume from. Never guess - always check the log!
`);
}

// Execute main function
main();
