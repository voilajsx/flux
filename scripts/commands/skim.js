/**
 * FLUX Framework Skim Command - Quick validation for development workflow
 * @module @voilajsx/flux/scripts/commands/skim
 * @file scripts/commands/skim.js
 *
 * @llm-rule WHEN: Running quick validation during development before commits
 * @llm-rule AVOID: Heavy compliance checking - keep fast and focused
 * @llm-rule NOTE: Supports unified file-path syntax for modern development workflow
 */

import { join } from 'path';
import { stat } from 'fs/promises';
import { createLogger } from '../logger.js';

const log = createLogger('skim');

/**
 * Parse skim arguments with unified file-path syntax
 * @llm-rule WHEN: Processing skim command arguments with file-path support
 * @llm-rule AVOID: Complex parsing - keep simple and predictable
 * @llm-rule NOTE: Supports file-path, endpoint, and feature syntax
 */
function parseSkimTarget(args) {
  if (args.length === 0) {
    throw new Error(
      'Skim requires: file path (hello/main.contract.ts), endpoint (hello/main), OR feature (hello)'
    );
  }

  const target = args[0];

  // Handle file-path syntax (hello/main.contract.ts)
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

    // Determine type from filename
    let type = 'endpoint'; // default
    if (filePart.includes('.contract.')) {
      type = 'contract';
    } else if (filePart.includes('.logic.')) {
      type = 'logic';
    } else if (filePart.includes('.test.')) {
      type = 'test'; // ← CHANGED: Now properly handles test files
    }

    return {
      type,
      feature,
      endpoint,
      filePath: target,
      description: `${type} ${feature}/${endpoint} (from ${filePart})`,
    };
  }

  // Handle endpoint syntax (weather/main)
  if (target.includes('/') && !target.includes('.')) {
    const [feature, endpoint] = target.split('/');

    if (!feature || !endpoint) {
      throw new Error(
        'Both feature and endpoint required (e.g., hello/main, auth/login)'
      );
    }

    return {
      type: 'endpoint',
      feature,
      endpoint,
      filePath: null,
      description: `endpoint ${feature}/${endpoint}`,
    };
  }

  // Handle feature syntax (weather) - NEW
  if (!target.includes('/') && !target.includes('.')) {
    return {
      type: 'feature',
      feature: target,
      endpoint: null,
      filePath: null,
      description: `feature ${target}`,
    };
  }

  // Invalid arguments
  throw new Error(
    'Skim requires: file path (hello/main.contract.ts), endpoint (hello/main), OR feature (hello)'
  );
}

/**
 * Skim validation command for quick development feedback
 * @llm-rule WHEN: Developer wants fast validation before git operations
 * @llm-rule AVOID: Running full compliance pipeline - use check for that
 * @llm-rule NOTE: Runs schema + types + lint + tests for targeted files with file-path syntax
 *
 * Examples:
 * - npm run flux:skim hello                      # All endpoints in hello feature
 * - npm run flux:skim hello/main                 # Both contract + logic + tests
 * - npm run flux:skim hello/main.contract.ts     # Direct file targeting
 * - npm run flux:skim hello/main.logic.ts        # Direct file targeting
 * - npm run flux:skim hello/main.test.ts         # Direct test file targeting
 */
export default async function skim(args) {
  const startTime = Date.now();

  if (!args || args.length === 0) {
    showSkimHelp();
    return false;
  }

  try {
    const scope = parseSkimTarget(args);
    log.info(`🔍 Skimming ${scope.description}`);

    const results = [];

    if (scope.type === 'contract') {
      results.push(
        ...(await skimContract(scope.feature, scope.endpoint, scope.filePath))
      );
    } else if (scope.type === 'logic') {
      results.push(
        ...(await skimLogic(scope.feature, scope.endpoint, scope.filePath))
      );
    } else if (scope.type === 'test') {
      results.push(
        ...(await skimTest(scope.feature, scope.endpoint, scope.filePath))
      );
    } else if (scope.type === 'endpoint') {
      results.push(...(await skimEndpoint(scope.feature, scope.endpoint)));
    } else if (scope.type === 'feature') {
      results.push(...(await skimFeature(scope.feature)));
    }

    // Report results with detailed breakdown
    const totalDuration = Date.now() - startTime;
    const passed = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const total = results.length;

    console.log('');
    console.log('📊 Skim Validation Results:');
    console.log(`   Scope: ${scope.description}`);
    console.log(`   Duration: ${totalDuration}ms`);
    console.log(`   Status: ${passed.length}/${total} passed`);

    if (passed.length > 0) {
      console.log('');
      console.log('✅ Passed:');
      passed.forEach((result) => {
        const [command, target] = result.command.split(':');
        console.log(`   ${command.padEnd(8)} ${target}`);
      });
    }

    if (failed.length > 0) {
      console.log('');
      console.log('❌ Failed:');
      failed.forEach((result) => {
        const [command, target] = result.command.split(':');
        console.log(`   ${command.padEnd(8)} ${target}`);
        if (result.error) {
          // Show only the first line of error for brevity
          const firstLine = result.error.split('\n')[0];
          console.log(`            ${firstLine}`);
        }
      });
    }

    console.log('');

    if (passed.length === total) {
      console.log(`✅ All validations passed!`);
      return true;
    } else {
      console.log(`❌ ${failed.length} validation(s) failed`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Skim validation error: ${error.message}`);
    return false;
  }
}

/**
 * Skim contract file validation (schema + types + lint)
 * @llm-rule WHEN: Validating contract file during development
 * @llm-rule AVOID: Heavy validation - focus on structure and syntax
 * @llm-rule NOTE: Uses correct syntax for each command type
 */
async function skimContract(feature, endpoint, filePath) {
  const results = [];
  const contractFile = join(
    process.cwd(),
    'src',
    'features',
    feature,
    endpoint,
    `${endpoint}.contract.ts`
  );

  // Check file exists
  try {
    await stat(contractFile);
  } catch (error) {
    return [
      {
        command: 'contract:exists',
        success: false,
        error: `Contract file not found: ${contractFile}`,
      },
    ];
  }

  // 1. Schema validation - use specific contract file path for schema command
  const schemaTarget = filePath || `${feature}/${endpoint}.contract.ts`;
  results.push(await runCommand('schema', schemaTarget, 'Schema validation'));

  // 2. Types validation - use specific file targeting
  const typesTarget = filePath || `${feature}/${endpoint}.contract.ts`;
  results.push(
    await runCommand('types', typesTarget, 'TypeScript compilation')
  );

  // 3. Lint validation - use specific file targeting
  const lintTarget = filePath || `${feature}/${endpoint}.contract.ts`;
  results.push(await runCommand('lint', lintTarget, 'Code standards'));

  return results;
}

/**
 * Skim logic file validation (types + lint)
 * @llm-rule WHEN: Validating logic file during development
 * @llm-rule AVOID: Schema validation for logic files - not applicable
 * @llm-rule NOTE: Logic files don't have schema, only types and lint with file-path syntax
 */
async function skimLogic(feature, endpoint, filePath) {
  const results = [];
  const logicFile = join(
    process.cwd(),
    'src',
    'features',
    feature,
    endpoint,
    `${endpoint}.logic.ts`
  );

  // Check file exists
  try {
    await stat(logicFile);
  } catch (error) {
    return [
      {
        command: 'logic:exists',
        success: false,
        error: `Logic file not found: ${logicFile}`,
      },
    ];
  }

  // Use file path if provided, otherwise construct it
  const targetPath = filePath || `${feature}/${endpoint}.logic.ts`;

  // 1. Types validation - use specific file targeting
  results.push(await runCommand('types', targetPath, 'TypeScript compilation'));

  // 2. Lint validation - use specific file targeting
  results.push(await runCommand('lint', targetPath, 'Code standards'));

  return results;
}

/**
 * Skim test file validation (types + lint + test)
 * @llm-rule WHEN: Validating test file during development
 * @llm-rule AVOID: Schema validation for test files - not applicable
 * @llm-rule NOTE: Test files get types, lint, and actual test execution
 */
async function skimTest(feature, endpoint, filePath) {
  const results = [];
  const testFile = join(
    process.cwd(),
    'src',
    'features',
    feature,
    endpoint,
    `${endpoint}.test.ts`
  );

  // Check file exists
  try {
    await stat(testFile);
  } catch (error) {
    return [
      {
        command: 'test:exists',
        success: false,
        error: `Test file not found: ${testFile}`,
      },
    ];
  }

  // Use file path if provided, otherwise construct it
  const targetPath = filePath || `${feature}/${endpoint}`;

  // 1. Types validation - use specific file targeting
  results.push(
    await runCommand(
      'types',
      `${feature}/${endpoint}.test.ts`,
      'TypeScript compilation'
    )
  );

  // 2. Lint validation - use specific file targeting
  results.push(
    await runCommand('lint', `${feature}/${endpoint}.test.ts`, 'Code standards')
  );

  // 3. Test execution - use endpoint targeting
  results.push(await runCommand('test', targetPath, 'Test execution'));

  return results;
}

/**
 * Skim feature validation (all endpoints + tests in feature)
 * @llm-rule WHEN: Validating complete feature during development
 * @llm-rule AVOID: Heavy validation - focus on quick feedback
 * @llm-rule NOTE: Validates all endpoints and tests in the feature efficiently
 */
async function skimFeature(feature) {
  const results = [];

  // Use feature-level commands for efficiency
  results.push(await runCommand('schema', feature, 'Schema validation'));

  results.push(await runCommand('types', feature, 'TypeScript compilation'));

  results.push(await runCommand('lint', feature, 'Code standards'));

  // ← ADDED: Test validation for entire feature
  results.push(await runCommand('test', feature, 'Test execution'));

  return results;
}

/**
 * Skim endpoint validation (contract + logic + tests)
 * @llm-rule WHEN: Validating complete endpoint during development
 * @llm-rule AVOID: Duplicating validation logic - reuse contract and logic functions
 * @llm-rule NOTE: Combines contract, logic, and test validation results
 */
async function skimEndpoint(feature, endpoint) {
  const results = [];

  // Validate contract
  const contractResults = await skimContract(feature, endpoint, null);
  results.push(...contractResults);

  // Validate logic
  const logicResults = await skimLogic(feature, endpoint, null);
  results.push(...logicResults);

  // ← ADDED: Validate tests
  const testResults = await skimTest(feature, endpoint, null);
  results.push(...testResults);

  return results;
}

/**
 * Run individual validation command and capture result
 * @llm-rule WHEN: Executing validation commands as part of skim
 * @llm-rule AVOID: Complex command execution - use simple spawn approach
 * @llm-rule NOTE: Captures success/failure and basic error info
 */
async function runCommand(command, target, description) {
  try {
    const { spawn } = await import('child_process');

    return new Promise((resolve) => {
      const child = spawn('npm', ['run', `flux:${command}`, target], {
        stdio: 'pipe',
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          command: `${command}:${target}`,
          success: code === 0,
          error: code !== 0 ? (stderr || stdout).trim() : null,
        });
      });
    });
  } catch (error) {
    return {
      command: `${command}:${target}`,
      success: false,
      error: `Command execution failed: ${error.message}`,
    };
  }
}

/**
 * Show skim command help and usage examples
 * @llm-rule WHEN: User provides invalid arguments or requests help
 * @llm-rule AVOID: Verbose help - keep focused on essential usage
 * @llm-rule NOTE: Shows modern file-path and endpoint syntax only
 */
function showSkimHelp() {
  console.log(`
🔍 FLUX Skim - Quick Development Validation

USAGE (File-Path):
  npm run flux:skim <file-path>

USAGE (Endpoint):
  npm run flux:skim <feature/endpoint>

USAGE (Feature):
  npm run flux:skim <feature>

EXAMPLES (File-Path):
  npm run flux:skim weather/main.contract.ts    # Quick contract validation
  npm run flux:skim hello/main.logic.ts         # Quick logic validation
  npm run flux:skim auth/login.test.ts          # Quick test file validation

EXAMPLES (Endpoint):
  npm run flux:skim weather/main                # Contract + logic + tests validation
  npm run flux:skim hello/auth                  # Contract + logic + tests validation
  npm run flux:skim api/users                   # Contract + logic + tests validation

EXAMPLES (Feature):
  npm run flux:skim weather                     # All endpoints + tests in weather feature
  npm run flux:skim hello                       # All endpoints + tests in hello feature
  npm run flux:skim api                         # All endpoints + tests in api feature

WHAT IT VALIDATES:
  Contract: Schema structure + TypeScript + Code standards
  Logic:    TypeScript compilation + VoilaJSX patterns
  Test:     TypeScript + Code standards + Test execution
  Endpoint: Contract + Logic + Tests (complete validation)
  Feature:  All endpoints, schemas, and tests in feature
  
COMPARISON:
  flux:skim     # Quick validation for development (schema + types + lint + tests)
  flux:check    # Full validation for git commits
  flux:schema   # Structure validation only
  flux:test     # Test execution only

TIP: Use file-path syntax for fastest, most precise validation!
`);
}
