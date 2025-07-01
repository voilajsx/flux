/**
 * Flux Framework - Production Build
 * @file scripts/lib/build.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  logSuccess,
  logError,
  logBox,
  log,
  colors,
  symbols,
  Timer,
} from './utils.js';

/**
 * Build for production with TypeScript compilation
 */
export async function runBuild(args) {
  const timer = new Timer();

  console.clear();

  logBox(`${symbols.fire} Building for Production`, [
    `${symbols.lightning} TypeScript compilation with tsc`,
    `${symbols.contracts} Contract validation included`,
    `${symbols.security} Production optimizations`,
    `${symbols.target} Feature bundling and tree-shaking`,
  ]);

  try {
    // Pre-build checks
    log(`${symbols.flux} Running pre-build checks...`, 'white');

    await runPreBuildChecks();
    logSuccess('Pre-build validation completed');

    // Clean previous build
    log(`${symbols.target} Cleaning previous build...`, 'white');
    await cleanBuildOutput();
    logSuccess('Build directory cleaned');

    // Run TypeScript compilation
    log(`${symbols.fire} Compiling TypeScript...`, 'white');

    const buildArgs = [...args.filter((arg) => !arg.startsWith('--flux'))];

    const env = {
      ...process.env,
      NODE_ENV: 'production',
      FLUX_BUILD: 'true',
    };

    // Add type checking options
    const tscArgs = [];

    if (args.includes('--watch')) {
      tscArgs.push('--watch');
      log('Watch mode enabled', 'cyan');
    }

    if (args.includes('--incremental')) {
      tscArgs.push('--incremental');
      log('Incremental compilation enabled', 'cyan');
    }

    if (!args.includes('--emit-on-error')) {
      tscArgs.push('--noEmitOnError');
    }

    // Execute TypeScript compiler - use local tsc
    const buildCommand = `./node_modules/.bin/tsc ${tscArgs.join(' ')} ${buildArgs.join(' ')}`;

    execSync(buildCommand, {
      stdio: 'inherit',
      env,
    });

    logSuccess('TypeScript compilation completed');

    // Post-build analysis and optimization
    log(`${symbols.lightning} Analyzing build output...`, 'white');
    const analysis = await analyzeBuild();

    // Copy necessary files
    log(`${symbols.target} Copying production files...`, 'white');
    await copyProductionFiles();
    logSuccess('Production files copied');

    // Success output
    console.clear();
    timer.endWithMessage(`${symbols.check} Build completed successfully!`);

    logBox(
      `${symbols.rocket} Production Build Ready`,
      [
        `${symbols.fire} Output: ${analysis.outputDir}`,
        `${symbols.lightning} Files: ${analysis.fileCount} compiled`,
        `${symbols.contracts} Features: ${analysis.featureCount} bundled`,
        `${symbols.security} Production optimizations applied`,
      ],
      'green'
    );

    logSuccess(
      `Build output: ${colors.cyan}${analysis.outputDir}${colors.reset}`
    );

    if (analysis.warnings.length > 0) {
      console.log();
      log(`${symbols.warning} Build warnings:`, 'yellow');
      analysis.warnings.forEach((warning) => {
        log(`  • ${warning}`, 'yellow');
      });
    }

    console.log();
    logBox(
      'Next Steps',
      [
        '1. Test your build with: node dist/flux.js',
        '2. Set production environment variables',
        '3. Deploy the dist/ folder to your server',
        '4. Configure process manager (PM2, systemd)',
        '5. Set up monitoring and logging',
      ],
      'blue'
    );

    console.log();
    log(`${symbols.flux} Ready for deployment! 🚀`, 'green');
  } catch (error) {
    console.clear();
    logError(`Build failed: ${error.message}`);

    // Helpful error messages
    if (error.message.includes('TypeScript')) {
      log('TypeScript compilation failed. Common fixes:', 'white');
      log('  • Check tsconfig.json configuration', 'cyan');
      log('  • Fix type errors: npm run flux:check', 'cyan');
      log('  • Update dependencies: npm update', 'cyan');
    } else if (error.message.includes('tsc')) {
      log('TypeScript compiler not found. Try:', 'white');
      log('  npm install typescript --save-dev', 'cyan');
    } else if (error.message.includes('out of memory')) {
      log('Build ran out of memory. Try:', 'white');
      log('  export NODE_OPTIONS="--max-old-space-size=4096"', 'cyan');
    } else if (error.message.includes('permission')) {
      log('Permission denied. Try:', 'white');
      log('  sudo chown -R $USER:$USER .', 'cyan');
    }

    if (process.env.DEBUG) {
      console.error('Full error details:', error);
    }

    process.exit(1);
  }
}

/**
 * Pre-build validation checks
 */
async function runPreBuildChecks() {
  // Check if dependencies are installed
  if (!fs.existsSync('node_modules')) {
    throw new Error('Dependencies not installed. Run: npm install');
  }

  // Check if main Flux files exist
  const requiredFiles = [
    'flux.ts',
    'contracts.ts',
    'tsconfig.json',
    'package.json',
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }

  // Check if features exist
  const featuresDir = path.join(process.cwd(), 'src', 'features');
  if (!fs.existsSync(featuresDir)) {
    throw new Error('No features found. Create at least one feature first.');
  }

  // Validate tsconfig.json
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));

    if (!tsConfig.compilerOptions) {
      throw new Error('tsconfig.json missing compilerOptions');
    }

    if (!tsConfig.compilerOptions.outDir) {
      throw new Error('tsconfig.json missing outDir in compilerOptions');
    }
  } catch (error) {
    throw new Error(`Invalid tsconfig.json: ${error.message}`);
  }

  // Check for TypeScript files
  const hasTypeScriptFiles = fs.existsSync('flux.ts') || fs.existsSync('src');
  if (!hasTypeScriptFiles) {
    throw new Error('No TypeScript files found to compile');
  }
}

/**
 * Clean build output directory
 */
async function cleanBuildOutput() {
  const outputDirs = ['dist', 'build', 'lib'];

  for (const dir of outputDirs) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        log(`  Cleaned: ${dir}/`, 'gray');
      } catch (error) {
        log(`  Warning: Could not clean ${dir}/`, 'yellow');
      }
    }
  }
}

/**
 * Copy production files
 */
async function copyProductionFiles() {
  const filesToCopy = [
    { src: 'package.json', dest: 'dist/package.json' },
    { src: '.env.example', dest: 'dist/.env.example', optional: true },
    { src: 'README.md', dest: 'dist/README.md', optional: true },
  ];

  const distDir = path.join(process.cwd(), 'dist');

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  for (const file of filesToCopy) {
    try {
      if (fs.existsSync(file.src)) {
        fs.copyFileSync(file.src, file.dest);
        log(`  Copied: ${file.src} → ${file.dest}`, 'gray');
      } else if (!file.optional) {
        throw new Error(`Required file not found: ${file.src}`);
      }
    } catch (error) {
      if (!file.optional) {
        throw error;
      }
      log(`  Skipped: ${file.src} (not found)`, 'gray');
    }
  }
}

/**
 * Analyze build output
 */
async function analyzeBuild() {
  const analysis = {
    outputDir: 'dist/',
    fileCount: 0,
    featureCount: 0,
    warnings: [],
  };

  try {
    // Read tsconfig to get output directory
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    const outputDir = tsConfig.compilerOptions?.outDir || 'dist';
    analysis.outputDir = outputDir;

    if (!fs.existsSync(outputDir)) {
      analysis.warnings.push('Build output directory not found');
      return analysis;
    }

    // Count compiled files
    function countFiles(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dir, file.name);

        if (file.isDirectory()) {
          countFiles(filePath);

          // Count features
          if (file.name === 'features' && dir.includes('src')) {
            const featureFiles = fs.readdirSync(filePath, {
              withFileTypes: true,
            });
            analysis.featureCount = featureFiles.filter((f) =>
              f.isDirectory()
            ).length;
          }
        } else if (file.name.endsWith('.js') || file.name.endsWith('.d.ts')) {
          analysis.fileCount++;
        }
      }
    }

    countFiles(outputDir);

    // Check for main entry point
    const mainEntry = path.join(outputDir, 'flux.js');
    if (!fs.existsSync(mainEntry)) {
      analysis.warnings.push(
        'Main entry point (flux.js) not found in build output'
      );
    }

    // Check for source maps
    const hasSourceMaps = fs.existsSync(path.join(outputDir, 'flux.js.map'));
    if (!hasSourceMaps) {
      analysis.warnings.push(
        'Source maps not generated - debugging may be difficult'
      );
    }

    // Check build size
    let totalSize = 0;
    function calculateSize(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          calculateSize(filePath);
        } else {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        }
      }
    }

    calculateSize(outputDir);

    if (totalSize > 10 * 1024 * 1024) {
      // > 10MB
      analysis.warnings.push(
        'Build size is large (>10MB) - consider optimization'
      );
    }
  } catch (error) {
    analysis.warnings.push(`Analysis failed: ${error.message}`);
  }

  return analysis;
}
