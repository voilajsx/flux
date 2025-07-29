/**
 * FLUX Framework Git Operations - Smart git commands with FLUX context awareness
 * @module @voilajsx/flux/scripts/commands/git
 * @file scripts/commands/git.js
 *
 * @llm-rule WHEN: Providing git operations that understand FLUX project structure
 * @llm-rule AVOID: Generic git operations - always add FLUX-specific context and intelligence
 * @llm-rule NOTE: Auto-detects related files and generates intelligent commit messages with unified file-path syntax
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('git');

/**
 * Execute git command with error handling
 * @llm-rule WHEN: Running any git command to ensure proper error handling
 * @llm-rule AVOID: Unhandled git errors that crash the process
 */
function execGit(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    throw new Error(`Git command failed: ${error.message}`);
  }
}

/**
 * Check if git repository is initialized
 * @llm-rule WHEN: Before any git operation to ensure repository exists
 * @llm-rule AVOID: Running git commands in non-git directories
 */
function ensureGitRepository() {
  try {
    execGit('git rev-parse --git-dir');
    return true;
  } catch {
    log.human('❌ Not a git repository. Run: git init');
    return false;
  }
}

/**
 * Get current git status with improved file path handling
 * @llm-rule WHEN: Analyzing what files have changed for intelligent operations
 * @llm-rule AVOID: Incorrect file path extraction - handle all git status formats
 * @llm-rule NOTE: Git status format: XY filename, where X and Y are status codes
 */
function getGitStatus() {
  try {
    const status = execGit('git status --porcelain');
    return status
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        // Git status format: XY filename
        // Where X is staged status, Y is working tree status
        const statusCodes = line.substring(0, 2);

        // File path starts after the status codes and space
        // Handle both "XY filename" and "XY  filename" formats
        const filePath = line.substring(2).replace(/^[\s]+/, '');

        return {
          status: statusCodes.trim(),
          file: filePath,
          isNew: line.startsWith('A') || line.startsWith('??'),
          isModified: line.startsWith('M') || line.startsWith(' M'),
          isDeleted: line.startsWith('D'),
        };
      })
      .filter((item) => {
        // Filter out empty files
        return item.file && item.file.trim() !== '';
      });
  } catch (error) {
    console.log(`⚠️ Git status error: ${error.message}`);
    return [];
  }
}

/**
 * Parse target with unified file-path syntax support
 * @llm-rule WHEN: Understanding what the user wants to commit
 * @llm-rule AVOID: Incorrect target parsing - affects file detection
 * @llm-rule NOTE: Supports feature, endpoint, and specific file targeting with unified syntax
 */
function parseTarget(target) {
  if (!target) {
    return { type: 'all', description: 'all changes' };
  }

  // Handle specific file targeting (weather/main.contract.ts)
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
      fullPath: `src/features/${target}`,
      description: `file ${filePart}`,
    };
  }

  // Handle endpoint targeting (weather/main)
  if (target.includes('/') && !target.includes('.')) {
    const [feature, endpoint] = target.split('/');
    return {
      type: 'endpoint',
      feature,
      endpoint,
      path: `src/features/${feature}/${endpoint}`,
      description: `endpoint ${feature}/${endpoint}`,
    };
  }

  // Handle feature targeting (weather)
  return {
    type: 'feature',
    feature: target,
    path: `src/features/${target}`,
    description: `feature ${target}`,
  };
}

/**
 * Auto-detect files related to a target
 * @llm-rule WHEN: User specifies a target and we need to find all related files
 * @llm-rule AVOID: Missing related files - include contracts, tests, logic, types
 * @llm-rule NOTE: Understands FLUX project structure and file relationships
 */
function detectRelatedFiles(target) {
  const changedFiles = getGitStatus();

  if (!target) {
    // No target specified - return all changed files
    return changedFiles.map((f) => f.file);
  }

  const targetInfo = parseTarget(target);
  const relatedFiles = [];

  changedFiles.forEach(({ file }) => {
    if (shouldIncludeFile(file, targetInfo)) {
      relatedFiles.push(file);
    }
  });

  return relatedFiles;
}

/**
 * Determine if a file should be included based on target
 * @llm-rule WHEN: Filtering files to include only those related to the target
 * @llm-rule AVOID: Including unrelated files or missing related files
 */
function shouldIncludeFile(file, targetInfo) {
  switch (targetInfo.type) {
    case 'file':
      // Specific file + its related files (test, contract, etc.)
      if (file === targetInfo.fullPath) return true;

      // Include related files in the same endpoint
      if (targetInfo.feature && targetInfo.endpoint) {
        const endpointPath = `src/features/${targetInfo.feature}/${targetInfo.endpoint}`;
        return (
          file.startsWith(endpointPath) && file.includes(targetInfo.endpoint)
        );
      }

      return file.includes(targetInfo.fileName.split('.')[0]);

    case 'endpoint':
      // All files in the endpoint directory
      return file.startsWith(targetInfo.path);

    case 'feature':
      // All files in the feature directory
      return file.startsWith(targetInfo.path);

    default:
      return true;
  }
}

/**
 * Generate intelligent commit message based on changed files and target
 * @llm-rule WHEN: Auto-generating commit messages to follow conventional commit format
 * @llm-rule AVOID: Generic messages - be specific about what changed
 * @llm-rule NOTE: Analyzes file types and changes to determine appropriate message
 */
function generateCommitMessage(files, targetInfo) {
  const changedFileStatus = getGitStatus();
  const hasNewFiles = files.some((f) => {
    const status = changedFileStatus.find((s) => s.file === f);
    return status?.isNew;
  });

  const hasTests = files.some((f) => f.includes('.test.'));
  const hasContracts = files.some((f) => f.includes('.contract.'));
  const hasLogic = files.some((f) => f.includes('.logic.'));
  const hasSchemas = files.some(
    (f) =>
      f.includes('.requirements.') ||
      f.includes('.specification.') ||
      f.includes('.instructions.')
  );

  const scope = targetInfo ? getCommitScope(targetInfo) : '';

  // Determine commit type and message
  if (hasNewFiles) {
    if (targetInfo?.type === 'feature') {
      return `feat${scope}: implement ${targetInfo.feature} feature`;
    } else if (targetInfo?.type === 'endpoint') {
      return `feat${scope}: implement ${targetInfo.endpoint} endpoint`;
    } else if (targetInfo?.type === 'file') {
      if (hasContracts) return `feat${scope}: add contract specification`;
      if (hasTests) return `test${scope}: add test coverage`;
      if (hasLogic) return `feat${scope}: add logic implementation`;
      return `feat${scope}: add ${targetInfo.fileName}`;
    }
    return 'feat: add new functionality';
  }

  // Handle modifications
  if (hasTests && hasLogic) {
    return `fix${scope}: update implementation and tests`;
  } else if (hasTests) {
    return `test${scope}: update test coverage`;
  } else if (hasContracts) {
    return `feat${scope}: update contract specification`;
  } else if (hasLogic) {
    return `fix${scope}: update logic implementation`;
  } else if (hasSchemas) {
    return `docs${scope}: update specifications`;
  }

  return `chore${scope}: update implementation`;
}

/**
 * Get commit scope from target info
 * @llm-rule WHEN: Formatting commit scope for conventional commits
 * @llm-rule AVOID: Missing or incorrect scope formatting
 */
function getCommitScope(targetInfo) {
  if (targetInfo.type === 'endpoint') {
    return `(${targetInfo.feature}/${targetInfo.endpoint})`;
  } else if (targetInfo.type === 'feature') {
    return `(${targetInfo.feature})`;
  } else if (targetInfo.type === 'file' && targetInfo.feature) {
    return targetInfo.endpoint
      ? `(${targetInfo.feature}/${targetInfo.endpoint})`
      : `(${targetInfo.feature})`;
  }
  return '';
}

/**
 * Main git command handler
 * @llm-rule WHEN: Processing git commands with FLUX context awareness
 * @llm-rule AVOID: Generic git operations - always add FLUX intelligence
 */
export default async function gitCommand(args) {
  if (!ensureGitRepository()) {
    return false;
  }

  const [subcommand, ...subArgs] = args;

  try {
    switch (subcommand) {
      case 'commit':
        return await handleCommit(subArgs);
      case 'save':
        return await handleSave();
      case 'undo':
        return await handleUndo();
      case 'sync':
        return await handleSync();
      case 'clean':
        return await handleClean();
      case 'status':
        return await handleStatus();
      case 'history':
        return await handleHistory(subArgs);
      default:
        log.human('❌ Unknown git command');
        showGitHelp();
        return false;
    }
  } catch (error) {
    log.human(`❌ Git operation failed: ${error.message}`);
    return false;
  }
}

/**
 * Handle smart commit command with unified file-path syntax
 * @llm-rule WHEN: Committing changes with auto-detection and intelligent messages
 * @llm-rule AVOID: Committing without understanding what changed
 */
async function handleCommit(args) {
  const messageIndex = args.findIndex((arg) => arg === '-m');
  const hasCustomMessage = messageIndex !== -1;
  const customMessage = hasCustomMessage ? args[messageIndex + 1] : null;

  // Get target (everything before -m flag, or all args if no -m)
  const targetArgs = hasCustomMessage ? args.slice(0, messageIndex) : args;
  const target = targetArgs.join(' ') || null;

  // Detect related files
  const files = detectRelatedFiles(target);

  if (files.length === 0) {
    log.human('ℹ️ No changes detected for target');
    log.human('💡 Run: git status to see current changes');
    return true;
  }

  // Generate commit message
  const targetInfo = target ? parseTarget(target) : null;
  const commitMessage =
    customMessage || generateCommitMessage(files, targetInfo);

  // Show what will be committed
  log.human(`📦 Staging ${files.length} file(s) for commit:`);
  files.forEach((file) => log.human(`   📁 ${file}`));
  log.human(`📝 Message: ${commitMessage}`);
  log.human('');

  // Add and commit files
  try {
    const fileList = files.map((f) => `"${f}"`).join(' ');
    execGit(`git add ${fileList}`);
    execGit(`git commit -m "${commitMessage}"`);

    log.human(`✅ Successfully committed ${files.length} file(s)`);
    return true;
  } catch (error) {
    log.human(`❌ Commit failed: ${error.message}`);
    return false;
  }
}

/**
 * Handle emergency save (checkpoint)
 * @llm-rule WHEN: Creating quick checkpoint of current state
 * @llm-rule AVOID: Losing work - always create recoverable checkpoint
 */
async function handleSave() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
  const message = `chore: emergency checkpoint ${timestamp}`;

  try {
    execGit('git add .');
    execGit(`git commit -m "${message}"`);

    log.human(`✅ Emergency checkpoint created`);
    log.human(`📝 Message: ${message}`);
    return true;
  } catch (error) {
    log.human(`❌ Save failed: ${error.message}`);
    return false;
  }
}

/**
 * Handle undo last commit
 * @llm-rule WHEN: Rolling back the last commit safely
 * @llm-rule AVOID: Losing work - use soft reset to preserve changes
 */
async function handleUndo() {
  try {
    const lastCommit = execGit('git log -1 --oneline');
    execGit('git reset --soft HEAD~1');

    log.human(`✅ Undid last commit: ${lastCommit}`);
    log.human('💡 Changes are preserved and staged');
    log.human('💡 Run: git status to see current state');
    return true;
  } catch (error) {
    log.human('❌ No commits to undo or undo failed');
    return false;
  }
}

/**
 * Handle sync (pull + validate + resolve conflicts)
 * @llm-rule WHEN: Syncing with remote and handling conflicts intelligently
 * @llm-rule AVOID: Merge conflicts without guidance
 */
async function handleSync() {
  try {
    const status = execGit('git status --porcelain');

    if (status) {
      log.human('⚠️ Uncommitted changes detected. Stashing...');
      execGit('git stash push -m "auto-stash before sync"');
    }

    log.human('🔄 Pulling from remote...');
    execGit('git pull');
    log.human('✅ Synced with remote');

    if (status) {
      try {
        log.human('🔄 Restoring local changes...');
        execGit('git stash pop');
        log.human('✅ Local changes restored');
      } catch {
        log.human('⚠️ Merge conflicts detected');
        log.human('💡 Run: git stash pop manually to resolve');
      }
    }

    return true;
  } catch (error) {
    log.human(`❌ Sync failed: ${error.message}`);
    return false;
  }
}

/**
 * Handle clean (reset to last valid state)
 * @llm-rule WHEN: Resetting to clean state while preserving important changes
 * @llm-rule AVOID: Losing important work - warn user about consequences
 */
async function handleClean() {
  const status = execGit('git status --porcelain');

  if (!status) {
    log.human('✅ Already clean - no changes to reset');
    return true;
  }

  log.human('⚠️ This will discard ALL uncommitted changes!');
  log.human('💡 Consider running: npm run flux:git save (to checkpoint first)');
  log.human('');
  log.human('📊 Changes that will be lost:');

  const changes = getGitStatus();
  changes.forEach(({ status, file }) => {
    const emoji = status.includes('A')
      ? '➕'
      : status.includes('M')
        ? '📝'
        : '❌';
    log.human(`   ${emoji} ${file}`);
  });

  try {
    execGit('git reset --hard HEAD');
    execGit('git clean -fd');

    log.human('');
    log.human('✅ Reset to clean state');
    return true;
  } catch (error) {
    log.human(`❌ Clean failed: ${error.message}`);
    return false;
  }
}

/**
 * Handle status (show current changes with FLUX context)
 * @llm-rule WHEN: Showing what changed to help user understand current state
 * @llm-rule AVOID: Overwhelming output - focus on relevant changes
 */
async function handleStatus() {
  try {
    const changes = getGitStatus();

    if (changes.length === 0) {
      log.human('✅ Working directory clean');
      return true;
    }

    log.human('📊 Current changes:');
    log.human('');

    // Group by type
    const byFeature = {};

    changes.forEach(({ status, file, isNew, isModified, isDeleted }) => {
      const emoji = isNew ? '➕' : isModified ? '📝' : isDeleted ? '❌' : '🔄';

      // Try to extract feature from path
      const featureMatch = file.match(/src\/features\/([^\/]+)/);
      const feature = featureMatch ? featureMatch[1] : 'other';

      if (!byFeature[feature]) {
        byFeature[feature] = [];
      }

      byFeature[feature].push(`   ${emoji} ${file}`);
    });

    // Display grouped by feature
    Object.entries(byFeature).forEach(([feature, files]) => {
      log.human(`📁 ${feature}:`);
      files.forEach((file) => log.human(file));
      log.human('');
    });

    log.human(`💡 Total: ${changes.length} changed file(s)`);
    return true;
  } catch (error) {
    log.human(`❌ Status failed: ${error.message}`);
    return false;
  }
}

/**
 * Handle history (feature-specific commit timeline)
 * @llm-rule WHEN: Showing commit history relevant to specific feature/endpoint/file
 * @llm-rule AVOID: Showing entire git history - filter to relevant commits
 */
async function handleHistory(args) {
  const target = args[0];
  const limit = parseInt(args[1]) || 10;

  try {
    let gitCommand = `git log --oneline -${limit}`;

    if (target) {
      const targetInfo = parseTarget(target);

      if (targetInfo.type === 'feature') {
        gitCommand += ` -- src/features/${targetInfo.feature}/`;
      } else if (targetInfo.type === 'endpoint') {
        gitCommand += ` -- src/features/${targetInfo.feature}/${targetInfo.endpoint}/`;
      } else if (targetInfo.type === 'file') {
        gitCommand += ` -- ${targetInfo.fullPath}`;
      }
    }

    const history = execGit(gitCommand);

    if (!history) {
      log.human(`📜 No commit history found${target ? ` for ${target}` : ''}`);
      return true;
    }

    log.human(
      `📜 Recent commits${target ? ` for ${target}` : ''} (last ${limit}):`
    );
    log.human('');

    history.split('\n').forEach((line, index) => {
      if (line.trim()) {
        const [hash, ...messageParts] = line.split(' ');
        const message = messageParts.join(' ');
        log.human(
          `   ${(index + 1).toString().padStart(2)}. ${hash} ${message}`
        );
      }
    });

    return true;
  } catch (error) {
    log.human(`❌ History failed: ${error.message}`);
    return false;
  }
}

/**
 * Show git command help
 * @llm-rule WHEN: User provides invalid command or needs guidance
 * @llm-rule AVOID: Confusing help - provide clear, actionable examples
 */
function showGitHelp() {
  log.human('🔧 FLUX Git Commands:');
  log.human('');
  log.human('Smart Commits (File-Path Syntax):');
  log.human(
    '  npm run flux:git commit weather                    # Feature changes'
  );
  log.human(
    '  npm run flux:git commit weather/main               # Endpoint changes'
  );
  log.human(
    '  npm run flux:git commit weather/main.contract.ts   # Specific file + related'
  );
  log.human(
    '  npm run flux:git commit weather -m "custom msg"    # Custom message'
  );
  log.human('');
  log.human('Operations:');
  log.human(
    '  npm run flux:git save                              # Emergency checkpoint'
  );
  log.human(
    '  npm run flux:git undo                              # Undo last commit'
  );
  log.human(
    '  npm run flux:git sync                              # Pull + resolve conflicts'
  );
  log.human(
    '  npm run flux:git clean                             # Reset to clean state'
  );
  log.human(
    '  npm run flux:git status                            # Show changes by feature'
  );
  log.human('');
  log.human('History:');
  log.human(
    '  npm run flux:git history                           # Recent commits (10)'
  );
  log.human(
    '  npm run flux:git history weather                   # Feature history'
  );
  log.human(
    '  npm run flux:git history weather/main              # Endpoint history'
  );
  log.human(
    '  npm run flux:git history weather/main.contract.ts  # File history'
  );
  log.human(
    '  npm run flux:git history weather 20               # Last 20 commits'
  );
}
