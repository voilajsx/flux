/**
 * Flux Framework - Code Formatting for LLM Patterns
 * @file scripts/lib/format.js
 */

import fs from 'fs';
import path from 'path';
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

/**
 * Format code to Flux LLM-ready patterns
 */
export async function runFormat(args) {
  const timer = new Timer();

  console.clear();

  logBox(`${symbols.code} Flux Code Formatter`, [
    `${symbols.sparkles} Enforce LLM-friendly patterns`,
    `${symbols.lightning} Consistent imports and exports`,
    `${symbols.contracts} Contract and service standards`,
    `${symbols.target} TypeScript best practices`,
  ]);

  const spinner = new Spinner('Analyzing code patterns...');
  spinner.start();

  try {
    // Find all TypeScript files in features
    const files = await findFluxFiles();
    spinner.stop(`Found ${files.length} files to analyze`);

    const results = {
      filesChecked: files.length,
      filesFixed: 0,
      patternsFixed: 0,
      warnings: [],
      errors: [],
    };

    // Process each file
    log(`${symbols.lightning} Checking Flux patterns...`, 'white');

    for (const filePath of files) {
      const fixed = await formatFile(filePath, args.includes('--fix'));
      if (fixed.modified) {
        results.filesFixed++;
        results.patternsFixed += fixed.patterns.length;
      }
      results.warnings.push(...fixed.warnings);
      results.errors.push(...fixed.errors);
    }

    // Display results
    console.clear();
    timer.endWithMessage(`${symbols.check} Formatting check completed!`);

    if (results.filesFixed === 0 && results.errors.length === 0) {
      logBox(
        `${symbols.check} All Files Follow Flux Patterns`,
        [
          `${symbols.sparkles} ${results.filesChecked} files checked`,
          `${symbols.lightning} No formatting issues found`,
          `${symbols.contracts} Code is LLM-ready`,
          `${symbols.target} Architecture patterns are consistent`,
        ],
        'green'
      );
    } else if (args.includes('--fix')) {
      logBox(
        `${symbols.magic} Formatting Applied`,
        [
          `${symbols.code} ${results.filesFixed} files updated`,
          `${symbols.sparkles} ${results.patternsFixed} patterns fixed`,
          `${symbols.lightning} Code is now LLM-optimized`,
          `${symbols.contracts} Flux patterns enforced`,
        ],
        'blue'
      );
    } else {
      logBox(
        `${symbols.warning} Formatting Issues Found`,
        [
          `${symbols.error} ${results.errors.length} errors found`,
          `${symbols.warning} ${results.warnings.length} warnings found`,
          `${symbols.code} ${results.filesFixed} files need formatting`,
          `${symbols.lightning} Run with --fix to apply changes`,
        ],
        'yellow'
      );
    }

    // Show detailed results
    if (results.errors.length > 0) {
      console.log();
      log(`${symbols.error} ${colors.bright}Errors:${colors.reset}`, 'white');
      results.errors.slice(0, 10).forEach((error) => {
        log(`  ${colors.red}${error}${colors.reset}`, 'white');
      });
      if (results.errors.length > 10) {
        log(
          `  ${colors.gray}... and ${results.errors.length - 10} more errors${colors.reset}`,
          'white'
        );
      }
    }

    if (results.warnings.length > 0) {
      console.log();
      log(
        `${symbols.warning} ${colors.bright}Warnings:${colors.reset}`,
        'white'
      );
      results.warnings.slice(0, 10).forEach((warning) => {
        log(`  ${colors.yellow}${warning}${colors.reset}`, 'white');
      });
      if (results.warnings.length > 10) {
        log(
          `  ${colors.gray}... and ${results.warnings.length - 10} more warnings${colors.reset}`,
          'white'
        );
      }
    }

    if (
      !args.includes('--fix') &&
      (results.filesFixed > 0 || results.errors.length > 0)
    ) {
      console.log();
      logBox(
        'Auto-Fix Available',
        [
          'Run with --fix to automatically apply Flux patterns:',
          'npm run flux:format -- --fix',
        ],
        'blue'
      );
    }

    if (results.errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Formatting failed');
    logError(`Code formatting failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Find all Flux-related files to format
 */
async function findFluxFiles() {
  const files = [];
  const directories = ['src/features', 'flux.ts', 'contracts.ts'];

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name.match(/\.(ts|tsx)$/)) {
        files.push(fullPath);
      }
    }
  }

  directories.forEach((dir) => {
    if (fs.lstatSync(dir).isDirectory()) {
      scanDirectory(dir);
    } else if (fs.existsSync(dir)) {
      files.push(dir);
    }
  });

  return files;
}

/**
 * Format a single file according to Flux patterns
 */
async function formatFile(filePath, shouldFix = false) {
  const result = {
    modified: false,
    patterns: [],
    warnings: [],
    errors: [],
  };

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    const relativePath = path.relative(process.cwd(), filePath);

    // Pattern 1: Import organization for Flux
    const importFix = fixFluxImportOrder(newContent, relativePath);
    if (importFix.modified) {
      newContent = importFix.content;
      result.patterns.push('Import order');
    }
    result.warnings.push(...importFix.warnings);
    result.errors.push(...importFix.errors);

    // Pattern 2: Contract patterns
    const contractFix = fixContractPatterns(newContent, relativePath);
    if (contractFix.modified) {
      newContent = contractFix.content;
      result.patterns.push('Contract patterns');
    }
    result.warnings.push(...contractFix.warnings);
    result.errors.push(...contractFix.errors);

    // Pattern 3: Service patterns
    const serviceFix = fixServicePatterns(newContent, relativePath);
    if (serviceFix.modified) {
      newContent = serviceFix.content;
      result.patterns.push('Service patterns');
    }
    result.warnings.push(...serviceFix.warnings);
    result.errors.push(...serviceFix.errors);

    // Pattern 4: Route patterns
    const routeFix = fixRoutePatterns(newContent, relativePath);
    if (routeFix.modified) {
      newContent = routeFix.content;
      result.patterns.push('Route patterns');
    }
    result.warnings.push(...routeFix.warnings);
    result.errors.push(...routeFix.errors);

    // Pattern 5: Export patterns
    const exportFix = fixExportPatterns(newContent, relativePath);
    if (exportFix.modified) {
      newContent = exportFix.content;
      result.patterns.push('Export patterns');
    }
    result.warnings.push(...exportFix.warnings);
    result.errors.push(...exportFix.errors);

    // Write changes if modified and fix is enabled
    if (newContent !== content) {
      result.modified = true;

      if (shouldFix) {
        fs.writeFileSync(filePath, newContent, 'utf8');
      }
    }
  } catch (error) {
    result.errors.push(`${relativePath}: ${error.message}`);
  }

  return result;
}

/**
 * Fix import order according to Flux patterns
 */
function fixFluxImportOrder(content, filePath) {
  const result = { modified: false, content, warnings: [], errors: [] };

  // Extract imports
  const importRegex = /^import\s+.*?from\s+['"`].*?['"`];?\s*$/gm;
  const imports = content.match(importRegex) || [];

  if (imports.length === 0) return result;

  // Categorize imports for Flux
  const categories = {
    node: [], // Node.js built-ins
    external: [], // npm packages
    fastify: [], // Fastify-related
    appkit: [], // @voilajsx/appkit
    flux: [], // Flux framework
    internal: [], // Internal app files
    relative: [], // Relative imports
  };

  imports.forEach((imp) => {
    if (imp.includes("'node:") || imp.includes('"node:')) {
      categories.node.push(imp);
    } else if (imp.includes('@voilajsx/appkit')) {
      categories.appkit.push(imp);
    } else if (imp.includes('fastify')) {
      categories.fastify.push(imp);
    } else if (
      imp.includes('../../') &&
      (imp.includes('contracts') || imp.includes('flux'))
    ) {
      categories.flux.push(imp);
    } else if (imp.includes('./') || imp.includes('../')) {
      categories.relative.push(imp);
    } else if (imp.includes('@/')) {
      categories.internal.push(imp);
    } else if (!imp.includes('./') && !imp.includes('../')) {
      categories.external.push(imp);
    } else {
      categories.relative.push(imp);
    }
  });

  // Sort within categories
  Object.keys(categories).forEach((cat) => {
    categories[cat].sort();
  });

  // Build new import section with proper spacing
  const importSections = [];

  if (categories.node.length > 0)
    importSections.push(categories.node.join('\n'));
  if (categories.external.length > 0)
    importSections.push(categories.external.join('\n'));
  if (categories.fastify.length > 0)
    importSections.push(categories.fastify.join('\n'));
  if (categories.appkit.length > 0)
    importSections.push(categories.appkit.join('\n'));
  if (categories.flux.length > 0)
    importSections.push(categories.flux.join('\n'));
  if (categories.internal.length > 0)
    importSections.push(categories.internal.join('\n'));
  if (categories.relative.length > 0)
    importSections.push(categories.relative.join('\n'));

  const newImports = importSections.join('\n\n');

  // Replace imports section
  const firstImport = imports[0];
  const lastImport = imports[imports.length - 1];

  if (firstImport && lastImport) {
    const oldImportSection = content.substring(
      content.indexOf(firstImport),
      content.indexOf(lastImport) + lastImport.length
    );

    if (oldImportSection !== newImports) {
      result.content = content.replace(oldImportSection, newImports);
      result.modified = true;
    }
  }

  return result;
}

/**
 * Fix contract patterns
 */
function fixContractPatterns(content, filePath) {
  const result = { modified: false, content, warnings: [], errors: [] };

  // Check if this is a feature index file
  if (!filePath.includes('/features/') || !filePath.endsWith('/index.ts')) {
    return result;
  }

  let newContent = content;

  // Check for contract definition
  if (!content.includes('createBackendContract')) {
    result.errors.push(`${filePath}: Missing createBackendContract() call`);
    return result;
  }

  // Check for proper contract structure
  if (
    content.includes('createBackendContract()') &&
    !content.includes('.build()')
  ) {
    result.errors.push(`${filePath}: Contract missing .build() call`);
  }

  // Check for FeatureConfig type
  if (!content.includes('FeatureConfig')) {
    result.errors.push(`${filePath}: Missing FeatureConfig type`);
  }

  // Warn about common contract issues
  if (content.includes('providesRoute') && !content.includes('routes:')) {
    result.warnings.push(
      `${filePath}: Provides routes but no routes configuration`
    );
  }

  if (content.includes('needsDatabase') && !content.includes('models')) {
    result.warnings.push(
      `${filePath}: Needs database but consider adding models directory`
    );
  }

  result.content = newContent;
  return result;
}

/**
 * Fix service patterns
 */
function fixServicePatterns(content, filePath) {
  const result = { modified: false, content, warnings: [], errors: [] };

  // Check if this is a service file
  if (!filePath.includes('/services/')) {
    return result;
  }

  let newContent = content;

  // Check for proper service class structure
  if (content.includes('class') && content.includes('Service')) {
    // Check for logger usage
    if (!content.includes('logger.get(')) {
      result.warnings.push(
        `${filePath}: Service should use logger from @voilajsx/appkit/logging`
      );
    }

    // Check for proper error handling
    if (
      content.includes('async') &&
      !content.includes('try') &&
      !content.includes('catch')
    ) {
      result.warnings.push(
        `${filePath}: Async service methods should include error handling`
      );
    }

    // Check for return type consistency
    if (content.includes('Response') && !content.includes('success:')) {
      result.warnings.push(
        `${filePath}: Service responses should follow { success, data, error } pattern`
      );
    }
  }

  // Check for singleton export pattern
  if (
    content.includes('class') &&
    content.includes('Service') &&
    !content.includes('new ')
  ) {
    result.warnings.push(
      `${filePath}: Consider exporting singleton instance of service class`
    );
  }

  result.content = newContent;
  return result;
}

/**
 * Fix route patterns
 */
function fixRoutePatterns(content, filePath) {
  const result = { modified: false, content, warnings: [], errors: [] };

  // Check if this is a routes file
  if (!filePath.includes('/routes/')) {
    return result;
  }

  let newContent = content;

  // Check for proper route structure
  if (!content.includes('FastifyPluginCallback')) {
    result.errors.push(
      `${filePath}: Routes should export FastifyPluginCallback`
    );
  }

  // Check for authentication patterns
  if (
    content.includes('auth.requireLogin') &&
    !content.includes('@voilajsx/appkit/auth')
  ) {
    result.errors.push(`${filePath}: Missing AppKit auth import`);
  }

  // Check for logging in routes
  if (content.includes('fastify.') && !content.includes('logger.get(')) {
    result.warnings.push(`${filePath}: Routes should include logging`);
  }

  // Check for schema validation
  if (content.includes('fastify.post') && !content.includes('schema:')) {
    result.warnings.push(
      `${filePath}: POST routes should include schema validation`
    );
  }

  // Check for proper error responses
  if (content.includes('reply.') && !content.includes('success:')) {
    result.warnings.push(
      `${filePath}: Route responses should follow standard format`
    );
  }

  result.content = newContent;
  return result;
}

/**
 * Fix export patterns
 */
function fixExportPatterns(content, filePath) {
  const result = { modified: false, content, warnings: [], errors: [] };

  // Check feature index exports
  if (filePath.includes('/features/') && filePath.endsWith('/index.ts')) {
    if (!content.includes('export default')) {
      result.errors.push(
        `${filePath}: Feature index should have default export`
      );
    }
  }

  // Check service exports
  if (filePath.includes('/services/')) {
    if (content.includes('class') && !content.includes('export')) {
      result.warnings.push(`${filePath}: Service class should be exported`);
    }
  }

  // Check routes exports
  if (filePath.includes('/routes/')) {
    if (!content.includes('export default')) {
      result.errors.push(`${filePath}: Routes should have default export`);
    }
  }

  // Check types exports
  if (filePath.includes('/types/')) {
    if (
      !content.includes('export interface') &&
      !content.includes('export type')
    ) {
      result.warnings.push(
        `${filePath}: Types file should export interfaces or types`
      );
    }
  }

  return result;
}
