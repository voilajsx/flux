/**
 * ATOM Framework contract validation and static checking enforcement
 * @module @voilajsx/atom/platform/contract
 * @file src/platform/contract.ts
 * 
 * @llm-rule WHEN: Validating feature contracts before server startup for 100% accuracy
 * @llm-rule AVOID: Runtime validation - this is compile-time static checking only
 * @llm-rule NOTE: Uses {endpoint}.{type}.ts naming convention for all files (main.contract.ts, name.logic.ts, etc.)
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { logger } from '@voilajsx/appkit/logging';
import { utility } from '@voilajsx/appkit/utils';

const log = logger.get('contract-validator');
const utils = utility.get();

/**
 * Contract validation result with detailed error reporting
 * @llm-rule WHEN: Reporting validation results to prevent server startup on errors
 * @llm-rule AVOID: Silent validation failures - all errors must be reported
 */
export interface ContractValidationResult {
  valid: boolean;
  feature: string;
  endpoint: string;
  errors: string[];
  warnings: string[];
  routeCount: number;
  contractFile: string;
  logicFile: string;
}

/**
 * ATOM Framework contract structure
 * @llm-rule WHEN: Defining expected contract format for static validation
 * @llm-rule AVOID: Changing this structure without updating validation logic
 */
export interface AtomContract {
  routes: Record<string, string>;
  imports: {
    appkit: string[];
    external: string[];
  };
  publishes: string[];
  subscribes: string[];
}

/**
 * Feature endpoint information for validation with {endpoint}.{type}.ts naming
 */
interface FeatureEndpoint {
  feature: string;
  endpoint: string;
  contractPath: string;
  logicPath: string;
  contractFile: string;
  logicFile: string;
}

/**
 * Validates all feature contracts before server startup
 * @llm-rule WHEN: Server startup to ensure 100% working code before launching
 * @llm-rule AVOID: Starting server with invalid contracts - guarantees runtime failures
 * @llm-rule NOTE: Blocks server startup if ANY validation fails
 */
export async function validateAllContracts(): Promise<boolean> {
  try {
    log.info('🔍 Starting ATOM Framework contract validation');

    const featuresPath = join(process.cwd(), 'src', 'features');
    const validationResults: ContractValidationResult[] = [];

    // Discover all feature endpoints
    const features = await discoverFeatures(featuresPath);
    
    if (features.length === 0) {
      log.warn('⚠️ No features found for validation');
      return true;
    }

    // Validate each feature endpoint
    for (const feature of features) {
      const result = await validateFeatureContract(feature);
      validationResults.push(result);
    }

    // Report validation results
    const allValid = reportValidationResults(validationResults);

    if (allValid) {
      log.info('✅ All contracts validated successfully', {
        features: validationResults.length,
        totalRoutes: validationResults.reduce((sum, r) => sum + r.routeCount, 0)
      });
    } else {
      log.error('❌ Contract validation failed - server startup blocked');
    }

    return allValid;

  } catch (error) {
    log.error('💥 Contract validation system error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Discovers all feature endpoints using {endpoint}.{type}.ts naming convention
 * @llm-rule WHEN: Scanning for features following ATOM naming conventions
 * @llm-rule AVOID: Hardcoded feature lists - use auto-discovery for flexibility
 * @llm-rule NOTE: Looks for {endpoint}.contract.ts and {endpoint}.logic.ts pairs
 */
async function discoverFeatures(featuresPath: string): Promise<FeatureEndpoint[]> {
  const features: FeatureEndpoint[] = [];

  try {
    const featureDirs = await readdir(featuresPath);

    for (const featureDir of featureDirs) {
      // Skip disabled features (underscore prefix)
      if (featureDir.startsWith('_') || featureDir.startsWith('.')) {
        continue;
      }

      const featurePath = join(featuresPath, featureDir);
      let featureStat;
      
      try {
        featureStat = await stat(featurePath);
      } catch {
        continue; // Skip if can't stat
      }

      if (!featureStat.isDirectory()) {
        continue;
      }

      // Find endpoint directories
      let endpointDirs: string[];
      try {
        endpointDirs = await readdir(featurePath);
      } catch {
        continue; // Skip if can't read directory
      }

      for (const endpointDir of endpointDirs) {
        if (endpointDir.startsWith('_') || endpointDir.startsWith('.')) {
          continue;
        }

        const endpointPath = join(featurePath, endpointDir);
        let endpointStat;
        
        try {
          endpointStat = await stat(endpointPath);
        } catch {
          continue; // Skip if can't stat
        }

        if (!endpointStat.isDirectory()) {
          continue;
        }

        // Look for {endpoint}.contract.ts and {endpoint}.logic.ts files
        const endpointName = endpointDir;
        const contractFile = `${endpointName}.contract.ts`;
        const logicFile = `${endpointName}.logic.ts`;
        const contractPath = join(endpointPath, contractFile);
        const logicPath = join(endpointPath, logicFile);

        // Check if both files exist
        try {
          await stat(contractPath);
          await stat(logicPath);

          features.push({
            feature: featureDir,
            endpoint: endpointDir,
            contractPath,
            logicPath,
            contractFile,
            logicFile
          });

          log.debug('📋 Feature endpoint discovered', {
            feature: featureDir,
            endpoint: endpointDir,
            contractFile,
            logicFile
          });

        } catch {
          log.warn('⚠️ Incomplete feature endpoint', {
            feature: featureDir,
            endpoint: endpointDir,
            missing: `${contractFile} or ${logicFile}`,
            expected: `${endpointName}.contract.ts and ${endpointName}.logic.ts`
          });
        }
      }
    }

    log.info('🔍 Feature discovery completed', {
      totalFeatures: features.length,
      features: features.map(f => `${f.feature}/${f.endpoint}`)
    });

    return features;

  } catch (error) {
    log.error('❌ Feature discovery failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

/**
 * Validates a single feature endpoint contract against its implementation
 * @llm-rule WHEN: Validating individual feature contracts with bidirectional checking
 * @llm-rule AVOID: Partial validation - check all aspects of the contract
 */
async function validateFeatureContract(feature: FeatureEndpoint): Promise<ContractValidationResult> {
  const result: ContractValidationResult = {
    valid: true,
    feature: feature.feature,
    endpoint: feature.endpoint,
    errors: [],
    warnings: [],
    routeCount: 0,
    contractFile: feature.contractFile,
    logicFile: feature.logicFile
  };

  try {
    log.debug('🔍 Validating feature contract', {
      feature: feature.feature,
      endpoint: feature.endpoint,
      contractFile: feature.contractFile,
      logicFile: feature.logicFile
    });

    // 1. Load and parse contract
    const contract = await loadContract(feature.contractPath);
    if (!contract) {
      result.valid = false;
      result.errors.push(`Contract file ${feature.contractFile} could not be loaded or parsed`);
      return result;
    }

    // Store route count
    result.routeCount = Object.keys(contract.routes || {}).length;

    // 2. Load logic file content
    let logicContent: string;
    try {
      logicContent = await readFile(feature.logicPath, 'utf-8');
    } catch (error) {
      result.valid = false;
      result.errors.push(`Could not read ${feature.logicFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }

    // 3. Validate route functions
    await validateRouteFunctions(contract, logicContent, result);

    // 4. Validate imports
    await validateImports(contract, logicContent, result);

    // 5. Validate events
    await validateEvents(contract, logicContent, result);

    // 6. Set overall validation status
    result.valid = result.errors.length === 0;

    if (result.valid) {
      log.debug('✅ Feature contract valid', {
        feature: feature.feature,
        endpoint: feature.endpoint,
        files: `${feature.contractFile} + ${feature.logicFile}`
      });
    } else {
      log.warn('❌ Feature contract invalid', {
        feature: feature.feature,
        endpoint: feature.endpoint,
        errors: result.errors.length
      });
    }

    return result;

  } catch (error) {
    result.valid = false;
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Loads and parses {endpoint}.contract.ts file to extract CONTRACT object
 * @llm-rule WHEN: Loading contract specifications for validation
 * @llm-rule AVOID: Runtime evaluation - use static parsing for security
 */
async function loadContract(contractPath: string): Promise<AtomContract | null> {
  try {
    // Convert .ts to .js for import
    const importPath = contractPath.replace(/\.ts$/, '.js');
    
    log.debug('🔍 Importing contract from:', { path: importPath });
    
    // Dynamic import the contract module
    const contractModule = await import(importPath);
    
    if (!contractModule.CONTRACT) {
      log.error('❌ CONTRACT export not found in contract file', { path: contractPath });
      return null;
    }

    const contract = contractModule.CONTRACT;
    
    log.debug('✅ Imported contract successfully', {
      path: contractPath,
      routes: Object.keys(contract.routes || {}).length
    });
    
    return {
      routes: contract.routes || {},
      imports: contract.imports || { appkit: [], external: [] },
      publishes: contract.publishes || [],
      subscribes: contract.subscribes || []
    };

  } catch (error) {
    log.error('❌ Contract file import failed', {
      path: contractPath,
      error: error instanceof Error ? error.message : 'Import error'
    });
    return null;
  }
}

/**
 * Validates that all contract routes have corresponding function exports in {endpoint}.logic.ts
 * @llm-rule WHEN: Ensuring route mappings match actual function implementations
 * @llm-rule AVOID: Missing function exports - causes 404 errors at runtime
 */
async function validateRouteFunctions(
  contract: AtomContract,
  logicContent: string,
  result: ContractValidationResult
): Promise<void> {
  const routes = contract.routes;
  const routeEntries = Object.entries(routes);

  if (routeEntries.length === 0) {
    result.warnings.push('No routes declared in contract');
    return;
  }

  for (const [route, functionName] of routeEntries) {
    if (!functionName) {
      result.errors.push(`Route '${route}' has empty function name`);
      continue;
    }

    // Check if function is exported
    const exportRegex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${functionName}\\s*\\(`, 'g');
    const constExportRegex = new RegExp(`export\\s+const\\s+${functionName}\\s*=`, 'g');

    const hasExport = exportRegex.test(logicContent) || constExportRegex.test(logicContent);

    if (!hasExport) {
      result.errors.push(`Route '${route}' mapped to function '${functionName}' but function not exported in ${result.logicFile}`);
    }
  }

  // Check for exported functions not in contract (bidirectional validation)
  const exportMatches = logicContent.match(/export\s+(?:async\s+)?function\s+(\w+)\s*\(/g) || [];
  const constExportMatches = logicContent.match(/export\s+const\s+(\w+)\s*=/g) || [];

  const exportedFunctions = [
    ...exportMatches.map(match => {
      const nameMatch = match.match(/function\s+(\w+)/);
      return nameMatch ? nameMatch[1] : null;
    }),
    ...constExportMatches.map(match => {
      const nameMatch = match.match(/const\s+(\w+)/);
      return nameMatch ? nameMatch[1] : null;
    })
  ].filter((name): name is string => name !== null);

  const contractFunctions = Object.values(routes);

  for (const exportedFunction of exportedFunctions) {
    if (!contractFunctions.includes(exportedFunction)) {
      result.warnings.push(`Function '${exportedFunction}' exported but not declared in contract routes`);
    }
  }
}

/**
 * Validates that all contract imports exist in {endpoint}.logic.ts file
 * @llm-rule WHEN: Ensuring declared dependencies match actual imports
 * @llm-rule AVOID: Missing imports - causes runtime import errors
 */
async function validateImports(
  contract: AtomContract,
  logicContent: string,
  result: ContractValidationResult
): Promise<void> {
  const imports = contract.imports;

  // Validate AppKit imports
  const appkitModules = imports.appkit || [];
  for (const appkitModule of appkitModules) {
    const importRegex = new RegExp(`import\\s+.*from\\s+['"]@voilajsx/appkit/${appkitModule}['"]`, 'g');
    
    if (!importRegex.test(logicContent)) {
      result.errors.push(`AppKit module '${appkitModule}' declared in contract but not imported in ${result.logicFile}`);
    }
  }

  // Validate external imports
  const externalModules = imports.external || [];
  for (const externalModule of externalModules) {
    const escapedModule = externalModule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const importRegex = new RegExp(`import\\s+.*from\\s+['"]${escapedModule}['"]`, 'g');
    
    if (!importRegex.test(logicContent)) {
      result.errors.push(`External module '${externalModule}' declared in contract but not imported in ${result.logicFile}`);
    }
  }

  // Bidirectional check - find undeclared imports
  const appkitImportMatches = logicContent.match(/import\s+.*from\s+['"]@voilajsx\/appkit\/(\w+)['"]/g) || [];
  const externalImportMatches = logicContent.match(/import\s+.*from\s+['"]([^@][^'"]+)['"]/g) || [];

  for (const match of appkitImportMatches) {
    const moduleMatch = match.match(/appkit\/(\w+)/);
    if (moduleMatch && moduleMatch[1] && !appkitModules.includes(moduleMatch[1])) {
      result.warnings.push(`AppKit module '${moduleMatch[1]}' imported but not declared in contract`);
    }
  }

  for (const match of externalImportMatches) {
    const moduleMatch = match.match(/['"]([^@][^'"]+)['"]/);
    if (moduleMatch && moduleMatch[1] && !externalModules.includes(moduleMatch[1])) {
      result.warnings.push(`External module '${moduleMatch[1]}' imported but not declared in contract`);
    }
  }
}

/**
 * Validates that event publishing and subscription match contract declarations
 * @llm-rule WHEN: Ensuring event-driven communication is properly declared
 * @llm-rule AVOID: Undeclared event usage - breaks event discovery and dependency tracking
 */
async function validateEvents(
  contract: AtomContract,
  logicContent: string,
  result: ContractValidationResult
): Promise<void> {
  const publishes = contract.publishes || [];
  const subscribes = contract.subscribes || [];

  // Validate published events
  for (const event of publishes) {
    const emitRegex = new RegExp(`eventBus\\.emit\\s*\\(\\s*['"]${event}['"]`, 'g');
    
    if (!emitRegex.test(logicContent)) {
      result.errors.push(`Event '${event}' declared as published but no eventBus.emit() found in ${result.logicFile}`);
    }
  }

  // Validate subscribed events
  for (const event of subscribes) {
    const onRegex = new RegExp(`eventBus\\.on\\s*\\(\\s*['"]${event}['"]`, 'g');
    
    if (!onRegex.test(logicContent)) {
      result.errors.push(`Event '${event}' declared as subscribed but no eventBus.on() found in ${result.logicFile}`);
    }
  }

  // Bidirectional check - find undeclared event usage
  const emitMatches = logicContent.match(/eventBus\.emit\s*\(\s*['"]([^'"]+)['"]/g) || [];
  const onMatches = logicContent.match(/eventBus\.on\s*\(\s*['"]([^'"]+)['"]/g) || [];

  for (const match of emitMatches) {
    const eventMatch = match.match(/['"]([^'"]+)['"]/);
    if (eventMatch && eventMatch[1] && !publishes.includes(eventMatch[1])) {
      result.warnings.push(`Event '${eventMatch[1]}' emitted but not declared in contract publishes`);
    }
  }

  for (const match of onMatches) {
    const eventMatch = match.match(/['"]([^'"]+)['"]/);
    if (eventMatch && eventMatch[1] && !subscribes.includes(eventMatch[1])) {
      result.warnings.push(`Event '${eventMatch[1]}' subscribed but not declared in contract subscribes`);
    }
  }
}

/**
 * Reports validation results and determines overall success
 * @llm-rule WHEN: Providing comprehensive validation feedback before server startup
 * @llm-rule AVOID: Silent failures - all validation results must be clearly reported
 */
function reportValidationResults(results: ContractValidationResult[]): boolean {
  let allValid = true;
  let totalErrors = 0;
  let totalWarnings = 0;

  console.log('\n📋 ATOM Framework Contract Validation Results\n');

  for (const result of results) {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${result.feature}/${result.endpoint} (${result.contractFile} + ${result.logicFile})`);

    if (result.errors.length > 0) {
      allValid = false;
      totalErrors += result.errors.length;
      result.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      totalWarnings += result.warnings.length;
      result.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }

    if (result.valid && result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`   ✅ All validations passed (${result.routeCount} routes)`);
    }

    console.log('');
  }

  // Summary
  console.log('📊 Validation Summary:');
  console.log(`   Features: ${results.length}`);
  console.log(`   Valid: ${results.filter(r => r.valid).length}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}`);
  console.log('');

  if (!allValid) {
    console.log('❌ Server startup BLOCKED due to contract validation failures');
    console.log('   Fix all errors above before starting the server\n');
  } else if (totalWarnings > 0) {
    console.log('⚠️  Server will start but consider addressing warnings\n');
  } else {
    console.log('✅ All contracts validated successfully - server ready to start\n');
  }

  return allValid;
}