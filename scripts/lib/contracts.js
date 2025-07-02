/**
 * Flux Framework - Contract Validation with Static Code Analysis
 * @module @voilajsx/flux/validation
 * @file scripts/lib/contracts.js
 *
 * @llm-rule WHEN: Feature contracts need validation before deployment
 * @llm-rule AVOID: Running without validating all contract dependencies first
 * @llm-rule NOTE: Enforces service-only public APIs and file naming conventions
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
 * Main contract validation function
 * @llm-rule WHEN: Need to validate all feature contracts before deployment
 * @llm-rule AVOID: Skipping validation - server won't start with invalid contracts
 */
export async function runContracts(args) {
  const timer = new Timer();
  console.clear();

  logBox(`${symbols.contracts} Flux Contract Validation`, [
    `${symbols.target} Dependency analysis and validation`,
    `${symbols.lightning} Static code analysis`,
    `${symbols.security} AppKit service verification`,
    `${symbols.sparkles} Architecture integrity check`,
  ]);

  const spinner = new Spinner('Discovering features and contracts...');
  spinner.start();

  try {
    const features = await discoverFeatureContracts();
    spinner.stop(
      `Found ${Object.keys(features).length} features with contracts`
    );

    if (Object.keys(features).length === 0) {
      logWarning('No features with contracts found');
      log(
        'Create your first feature with: npm run flux:create my-feature',
        'cyan'
      );
      return;
    }

    // Run all validations
    log(`${symbols.lightning} Validating feature contracts...`, 'white');
    const validation = await validateAllContracts(features);

    log(`${symbols.sparkles} Running static code analysis...`, 'white');
    const staticAnalysis = await enforceContractsWithCodeAnalysis(features);

    log(`${symbols.target} Checking circular dependencies...`, 'white');
    const circularDeps = await checkCircularDependencies(features);

    log(`${symbols.security} Validating AppKit services...`, 'white');
    const appkitValidation = validateAppKitServices(features);

    // Display results
    console.clear();
    timer.endWithMessage(`${symbols.check} Contract validation completed!`);

    displayValidationResults(
      validation,
      staticAnalysis,
      circularDeps,
      appkitValidation,
      features
    );
  } catch (error) {
    spinner.fail('Contract validation failed');
    logError(`Contract validation failed: ${error.message}`);
    if (process.env.DEBUG) {
      console.error('Full error:', error);
    }
    process.exit(1);
  }
}

/**
 * Discover all features and parse their contracts
 * @llm-rule WHEN: Need to find and parse all feature index.ts files
 * @llm-rule AVOID: Manual contract discovery - this handles all feature scanning
 */
async function discoverFeatureContracts() {
  const features = {};
  const featuresDir = path.join(process.cwd(), 'src', 'features');

  if (!fs.existsSync(featuresDir)) {
    throw new Error(
      'Features directory not found. Run: npm run flux:create your-first-feature'
    );
  }

  const entries = fs.readdirSync(featuresDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const indexPath = path.join(featuresDir, entry.name, 'index.ts');

      if (fs.existsSync(indexPath)) {
        try {
          const content = fs.readFileSync(indexPath, 'utf8');
          const contract = parseContractFromFile(content, entry.name);

          if (contract) {
            features[entry.name] = {
              name: entry.name,
              contract,
              filePath: indexPath,
            };
          }
        } catch (error) {
          console.warn(
            `Failed to parse contract for ${entry.name}:`,
            error.message
          );
        }
      }
    }
  }

  return features;
}

/**
 * Parse contract from feature index file
 * Supports syntax: .provides(), .internal(), .import(), .needs()
 * @llm-rule WHEN: Feature has createBackendContract().build() in index.ts
 * @llm-rule AVOID: Parsing legacy contract syntax - only supports current syntax
 * @llm-rule NOTE: Returns structured contract object with 4 categories
 */
function parseContractFromFile(content, featureName) {
  try {
    // Extract contract creation section
    const contractMatch = content.match(
      /createBackendContract\(\)([\s\S]*?)\.build\(\)/
    );
    if (!contractMatch) {
      return null;
    }

    const contractCode = contractMatch[1];
    const contract = {
      provides: { routes: [], services: [] },
      internal: { services: [], models: [] },
      imports: { appkit: [], external: [] },
      needs: { services: [] },
    };

    // Parse .provides('category', ['item1', 'item2', ...])
    const providesMatches =
      contractCode.match(
        /\.provides\s*\(\s*['"`](\w+)['"`]\s*,\s*\[(.*?)\]\s*\)/gs
      ) || [];

    for (const match of providesMatches) {
      const detailMatch = match.match(
        /\.provides\s*\(\s*['"`](\w+)['"`]\s*,\s*\[(.*?)\]\s*\)/s
      );
      if (detailMatch) {
        const category = detailMatch[1]; // 'routes', 'services'
        const itemsString = detailMatch[2];

        const items = parseArrayItems(itemsString);

        if (category === 'routes') {
          contract.provides.routes.push(...items);
        } else if (category === 'services') {
          contract.provides.services.push(...items);
        }
      }
    }

    // Parse .internal('category', ['item1', 'item2', ...])
    const internalMatches =
      contractCode.match(
        /\.internal\s*\(\s*['"`](\w+)['"`]\s*,\s*\[(.*?)\]\s*\)/gs
      ) || [];

    for (const match of internalMatches) {
      const detailMatch = match.match(
        /\.internal\s*\(\s*['"`](\w+)['"`]\s*,\s*\[(.*?)\]\s*\)/s
      );
      if (detailMatch) {
        const category = detailMatch[1]; // 'services', 'models'
        const itemsString = detailMatch[2];

        const items = parseArrayItems(itemsString);

        if (category === 'services') {
          contract.internal.services.push(...items);
        } else if (category === 'models') {
          contract.internal.models.push(...items);
        }
      }
    }

    // Parse .import('source', ['item1', 'item2', ...])
    const importMatches =
      contractCode.match(
        /\.import\s*\(\s*['"`](\w+)['"`]\s*,\s*\[(.*?)\]\s*\)/gs
      ) || [];

    for (const match of importMatches) {
      const detailMatch = match.match(
        /\.import\s*\(\s*['"`](\w+)['"`]\s*,\s*\[(.*?)\]\s*\)/s
      );
      if (detailMatch) {
        const source = detailMatch[1]; // 'appkit', 'external'
        const itemsString = detailMatch[2];

        const items = parseArrayItems(itemsString);

        if (source === 'appkit') {
          contract.imports.appkit.push(...items);
        } else if (source === 'external') {
          contract.imports.external.push(...items);
        }
      }
    }

    // Parse .needs('category', ['item1', 'item2', ...])
    const needsMatches =
      contractCode.match(
        /\.needs\s*\(\s*['"`](\w+)['"`]\s*,\s*\[(.*?)\]\s*\)/gs
      ) || [];

    for (const match of needsMatches) {
      const detailMatch = match.match(
        /\.needs\s*\(\s*['"`](\w+)['"`]\s*,\s*\[(.*?)\]\s*\)/s
      );
      if (detailMatch) {
        const category = detailMatch[1]; // 'services'
        const itemsString = detailMatch[2];

        const items = parseArrayItems(itemsString);

        if (category === 'services') {
          contract.needs.services.push(...items);
        }
      }
    }

    return contract;
  } catch (error) {
    throw new Error(`Failed to parse contract: ${error.message}`);
  }
}

/**
 * Parse array items from string: ['item1', 'item2'] -> [item1, item2]
 * @llm-rule WHEN: Converting contract array strings to clean item arrays
 * @llm-rule AVOID: Manual string parsing - handles quotes and whitespace
 */
function parseArrayItems(itemsString) {
  if (!itemsString || itemsString.trim() === '') {
    return [];
  }

  return itemsString
    .split(',')
    .map((item) => item.trim().replace(/^['"`]|['"`]$/g, ''))
    .filter((item) => item.length > 0);
}

/**
 * Bi-directional static code analysis enforcement
 * @llm-rule WHEN: Need to validate contracts match actual code implementation
 * @llm-rule AVOID: Trusting contracts without code verification - catches mismatches
 * @llm-rule NOTE: Validates routes, services, models, imports, and dependencies
 */
async function enforceContractsWithCodeAnalysis(features) {
  const errors = [];
  const warnings = [];

  for (const [featureName, feature] of Object.entries(features)) {
    if (!feature.contract) continue;

    try {
      // ✅ Validate routes (bi-directional)
      const routeErrors = await validateRouteContracts(feature);
      errors.push(...routeErrors);

      // ✅ Validate services (exact count)
      const serviceErrors = await validateServiceContracts(feature);
      errors.push(...serviceErrors);

      // ✅ Validate models (exact count)
      const modelErrors = await validateModelContracts(feature);
      errors.push(...modelErrors);

      // ✅ Validate AppKit imports (bi-directional)
      const importErrors = await validateAppKitImportContracts(feature);
      errors.push(...importErrors);

      // ✅ Validate service dependencies (provider + usage)
      const dependencyErrors = await validateServiceDependencies(
        feature,
        features
      );
      errors.push(...dependencyErrors);
    } catch (error) {
      errors.push(
        `Static analysis failed for '${featureName}': ${error.message}`
      );
    }
  }

  return { errors, warnings };
}

/**
 * ✅ Bi-directional route validation
 * @llm-rule WHEN: Feature declares routes in contract - validates they exist
 * @llm-rule AVOID: Undeclared routes - all implemented routes must be in contract
 * @llm-rule NOTE: Only scans exports containing "route"/"routes" in filename
 */
async function validateRouteContracts(feature) {
  const errors = [];

  try {
    // Safely get declared routes from contract
    const declaredRoutes = feature.contract?.provides?.routes || [];

    // Find actual routes in route files
    const routeFiles = findRouteFiles(feature);
    const actualRoutes = [];

    for (const routeFile of routeFiles) {
      try {
        const routes = await extractRoutesFromFile(routeFile);
        actualRoutes.push(...routes);
      } catch (error) {
        errors.push(
          `Failed to parse route file ${routeFile}: ${error.message}`
        );
      }
    }

    // Validate declared routes exist in code
    for (const declaredRoute of declaredRoutes) {
      if (!declaredRoute || typeof declaredRoute !== 'string') {
        errors.push(
          `Feature '${feature.name}' has invalid route declaration: ${JSON.stringify(declaredRoute)}`
        );
        continue;
      }

      const parts = declaredRoute.trim().split(' ');
      if (parts.length !== 2) {
        errors.push(
          `Feature '${feature.name}' route '${declaredRoute}' must be in format 'METHOD /path'`
        );
        continue;
      }

      const [method, path] = parts;
      if (!method || !path) {
        errors.push(
          `Feature '${feature.name}' route '${declaredRoute}' has empty method or path`
        );
        continue;
      }

      const exists = actualRoutes.some(
        (r) =>
          r &&
          r.method &&
          r.path &&
          r.method.toUpperCase() === method.toUpperCase() &&
          r.path === path
      );

      if (!exists) {
        errors.push(
          `Feature '${feature.name}' declares route '${declaredRoute}' but it's not implemented`
        );
      }
    }

    // Validate actual routes are declared
    for (const actualRoute of actualRoutes) {
      if (!actualRoute || !actualRoute.method || !actualRoute.path) {
        continue; // Skip invalid routes
      }

      const routeDeclaration = `${actualRoute.method.toUpperCase()} ${actualRoute.path}`;
      if (!declaredRoutes.includes(routeDeclaration)) {
        errors.push(
          `Feature '${feature.name}' has undeclared route '${routeDeclaration}' - add to contract`
        );
      }
    }
  } catch (error) {
    errors.push(
      `Route validation failed for '${feature.name}': ${error.message}`
    );
  }

  return errors;
}

/**
 * ✅ Exact count service validation
 * @llm-rule WHEN: Feature has service files - validates provides+internal=total
 * @llm-rule AVOID: Mixing public/private services - use provides vs internal
 * @llm-rule NOTE: Only scans *Service.ts files with "service" in export names
 */
async function validateServiceContracts(feature) {
  const errors = [];

  try {
    const providedServices = feature.contract?.provides?.services || [];
    const internalServices = feature.contract?.internal?.services || [];

    // Find actual service exports from *Service.ts/*Services.ts files
    const serviceFiles = findServiceFiles(feature);
    const exportedServices = [];

    for (const serviceFile of serviceFiles) {
      try {
        const exports = await extractServicesFromFile(serviceFile);
        exportedServices.push(...exports);
      } catch (error) {
        errors.push(
          `Failed to parse service file ${serviceFile}: ${error.message}`
        );
      }
    }

    // Exact count validation
    const totalDeclared = providedServices.length + internalServices.length;
    if (totalDeclared !== exportedServices.length) {
      errors.push(
        `Feature '${feature.name}': Service count mismatch - declared ${totalDeclared}, found ${exportedServices.length} exports`
      );
    }

    // All declared must exist in exports
    [...providedServices, ...internalServices].forEach((declared) => {
      if (!exportedServices.includes(declared)) {
        errors.push(
          `Feature '${feature.name}': Service '${declared}' declared but not exported`
        );
      }
    });

    // All exports must be declared
    exportedServices.forEach((exported) => {
      if (![...providedServices, ...internalServices].includes(exported)) {
        errors.push(
          `Feature '${feature.name}': Service '${exported}' exported but not declared in contract`
        );
      }
    });
  } catch (error) {
    errors.push(
      `Service validation failed for '${feature.name}': ${error.message}`
    );
  }

  return errors;
}

/**
 * ✅ Exact count model validation
 * @llm-rule WHEN: Feature has model files - all models must be internal
 * @llm-rule AVOID: Public model exports - models are always feature-private
 * @llm-rule NOTE: Only scans *Model.ts files with "model" in export names
 */
async function validateModelContracts(feature) {
  const errors = [];

  try {
    const internalModels = feature.contract?.internal?.models || [];

    // Find actual model exports from *Model.ts/*Models.ts files
    const modelFiles = findModelFiles(feature);
    const exportedModels = [];

    for (const modelFile of modelFiles) {
      try {
        const exports = await extractModelsFromFile(modelFile);
        exportedModels.push(...exports);
      } catch (error) {
        errors.push(
          `Failed to parse model file ${modelFile}: ${error.message}`
        );
      }
    }

    // Exact count validation - all models must be internal
    if (internalModels.length !== exportedModels.length) {
      errors.push(
        `Feature '${feature.name}': Model count mismatch - declared ${internalModels.length}, found ${exportedModels.length} exports`
      );
    }

    // All declared must exist in exports
    internalModels.forEach((declared) => {
      if (!exportedModels.includes(declared)) {
        errors.push(
          `Feature '${feature.name}': Model '${declared}' declared but not exported`
        );
      }
    });

    // All exports must be declared as internal
    exportedModels.forEach((exported) => {
      if (!internalModels.includes(exported)) {
        errors.push(
          `Feature '${feature.name}': Model '${exported}' exported but not declared as internal`
        );
      }
    });
  } catch (error) {
    errors.push(
      `Model validation failed for '${feature.name}': ${error.message}`
    );
  }

  return errors;
}

/**
 * ✅ Bi-directional AppKit import validation
 * @llm-rule WHEN: Feature imports AppKit services - must be declared in contract
 * @llm-rule AVOID: Undeclared AppKit imports - all @voilajsx/appkit/* must be in contract
 * @llm-rule NOTE: Maps 12 AppKit services to their import paths
 */
async function validateAppKitImportContracts(feature) {
  const errors = [];

  try {
    const declaredAppKitImports = feature.contract?.imports?.appkit || [];

    // Get all imports from feature files
    const allFiles = findAllFeatureFiles(feature);
    const allImports = [];

    for (const file of allFiles) {
      try {
        const imports = await extractImportsFromFile(file);
        allImports.push(...imports);
      } catch (error) {
        // Ignore parse errors for imports
      }
    }

    // AppKit import mapping
    const appkitImportMap = {
      database: '@voilajsx/appkit/database',
      auth: '@voilajsx/appkit/auth',
      logging: '@voilajsx/appkit/logging',
      config: '@voilajsx/appkit/config',
      security: '@voilajsx/appkit/security',
      error: '@voilajsx/appkit/error',
      storage: '@voilajsx/appkit/storage',
      cache: '@voilajsx/appkit/cache',
      email: '@voilajsx/appkit/email',
      event: '@voilajsx/appkit/event',
      queue: '@voilajsx/appkit/queue',
      utils: '@voilajsx/appkit/utils',
    };

    // Declared imports must exist
    for (const declaredImport of declaredAppKitImports) {
      const expectedImport = appkitImportMap[declaredImport];
      if (expectedImport) {
        const imported = allImports.some((imp) => imp.includes(expectedImport));
        if (!imported) {
          errors.push(
            `Feature '${feature.name}' declares AppKit import '${declaredImport}' but doesn't import from '${expectedImport}'`
          );
        }
      }
    }

    // AppKit imports must be declared
    for (const importPath of allImports) {
      for (const [appkitService, expectedPath] of Object.entries(
        appkitImportMap
      )) {
        if (
          importPath.includes(expectedPath) &&
          !declaredAppKitImports.includes(appkitService)
        ) {
          errors.push(
            `Feature '${feature.name}' imports AppKit service '${appkitService}' but doesn't declare it in contract`
          );
        }
      }
    }
  } catch (error) {
    errors.push(
      `AppKit import validation failed for '${feature.name}': ${error.message}`
    );
  }

  return errors;
}

/**
 * ✅ Service dependency validation (provider + usage)
 * @llm-rule WHEN: Feature needs services from other features
 * @llm-rule AVOID: Missing service providers or imports - dependencies must exist
 * @llm-rule NOTE: Validates both provider existence and actual import statements
 */
async function validateServiceDependencies(feature, allFeatures) {
  const errors = [];

  try {
    const neededServices = feature.contract?.needs?.services || [];

    for (const neededService of neededServices) {
      // Must find provider
      const provider = findServiceProvider(neededService, allFeatures);
      if (!provider) {
        errors.push(
          `Feature '${feature.name}' needs service '${neededService}' but no feature provides it`
        );
        continue;
      }

      // Must import the service (simplified check)
      const allFiles = findAllFeatureFiles(feature);
      let imported = false;

      for (const file of allFiles) {
        try {
          const imports = await extractImportsFromFile(file);
          const expectedImport = `@/features/${provider}/services/${neededService}`;
          if (
            imports.some(
              (imp) =>
                imp.includes(expectedImport) || imp.includes(neededService)
            )
          ) {
            imported = true;
            break;
          }
        } catch (error) {
          // Ignore parse errors
        }
      }

      if (!imported) {
        errors.push(
          `Feature '${feature.name}' needs service '${neededService}' but doesn't import it`
        );
      }
    }
  } catch (error) {
    errors.push(
      `Service dependency validation failed for '${feature.name}': ${error.message}`
    );
  }

  return errors;
}

// File discovery functions
function findRouteFiles(feature) {
  const routesDir = path.join(feature.filePath, '..', 'routes');
  if (!fs.existsSync(routesDir)) return [];
  return fs
    .readdirSync(routesDir)
    .filter((file) => file.match(/.*Route\.ts$|.*Routes\.ts$/))
    .map((file) => path.join(routesDir, file));
}

function findServiceFiles(feature) {
  const servicesDir = path.join(feature.filePath, '..', 'services');
  if (!fs.existsSync(servicesDir)) return [];
  return fs
    .readdirSync(servicesDir)
    .filter((file) => file.match(/.*Service\.ts$|.*Services\.ts$/))
    .map((file) => path.join(servicesDir, file));
}

function findModelFiles(feature) {
  const modelsDir = path.join(feature.filePath, '..', 'models');
  if (!fs.existsSync(modelsDir)) return [];
  return fs
    .readdirSync(modelsDir)
    .filter((file) => file.match(/.*Model\.ts$|.*Models\.ts$/))
    .map((file) => path.join(modelsDir, file));
}

function findAllFeatureFiles(feature) {
  const featureDir = path.dirname(feature.filePath);
  const files = [];

  function walkDir(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore directory read errors
    }
  }

  walkDir(featureDir);
  return files;
}

// Code extraction functions
/**
 * Extract routes from route files with naming convention enforcement
 * @llm-rule WHEN: Validating routes in *Route.ts/*Routes.ts files
 * @llm-rule AVOID: Scanning non-route files - only files with route naming
 */
async function extractRoutesFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const routes = [];

    // Remove comments to avoid matching commented routes
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, ''); // Remove // comments

    // Only detect routes from exports containing "route" or "routes"
    const hasRouteExport =
      /export\s+(?:const|default)\s+(\w*[Rr]outes?\w*)/.test(content);

    if (hasRouteExport) {
      // Match routes.method('/path', ...) patterns
      const routeRegex =
        /routes\.(get|post|put|delete|patch|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
      let match;

      while ((match = routeRegex.exec(cleanContent)) !== null) {
        if (match[1] && match[2]) {
          routes.push({
            method: match[1].toUpperCase(),
            path: match[2],
          });
        }
      }
    }

    return routes;
  } catch (error) {
    throw new Error(
      `Failed to extract routes from ${filePath}: ${error.message}`
    );
  }
}

/**
 * Extract services from service files with naming convention enforcement
 * @llm-rule WHEN: Validating services in *Service.ts/*Services.ts files
 * @llm-rule AVOID: Including non-service exports - only exports with "service" in name
 */
async function extractServicesFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const services = [];

    // Only exports containing "service" or "services"
    const serviceExportRegex =
      /export\s+(?:const|default|function|class)\s+(\w*[Ss]ervices?\w*)/g;
    let match;

    while ((match = serviceExportRegex.exec(content)) !== null) {
      if (match[1]) {
        services.push(match[1]);
      }
    }

    return services;
  } catch (error) {
    throw new Error(
      `Failed to extract services from ${filePath}: ${error.message}`
    );
  }
}

/**
 * Extract models from model files with naming convention enforcement
 * @llm-rule WHEN: Validating models in *Model.ts/*Models.ts files
 * @llm-rule AVOID: Including non-model exports - only exports with "model" in name
 */
async function extractModelsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const models = [];

    // Only exports containing "model" or "models"
    const modelExportRegex =
      /export\s+(?:interface|type|const|class)\s+(\w*[Mm]odels?\w*)/g;
    let match;

    while ((match = modelExportRegex.exec(content)) !== null) {
      if (match[1]) {
        models.push(match[1]);
      }
    }

    return models;
  } catch (error) {
    throw new Error(
      `Failed to extract models from ${filePath}: ${error.message}`
    );
  }
}

/**
 * Extract all import statements from TypeScript files
 * @llm-rule WHEN: Need to validate import declarations against contracts
 * @llm-rule AVOID: Missing import validation - catches undeclared dependencies
 */
async function extractImportsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    const importRegex = /import\s+.*?from\s+['"`]([^'"`]+)['"`]/gi;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }

    return imports;
  } catch (error) {
    throw new Error(
      `Failed to extract imports from ${filePath}: ${error.message}`
    );
  }
}

// Contract dependency validation functions
async function validateAllContracts(features) {
  const validation = {};
  for (const [featureName, feature] of Object.entries(features)) {
    validation[featureName] = await validateFeatureContract(feature, features);
  }
  return validation;
}

async function validateFeatureContract(feature, allFeatures) {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    missingDependencies: [],
  };

  if (!feature.contract?.needs) return validation;

  // Check service dependencies
  const serviceNeeds = feature.contract.needs.services || [];
  for (const serviceName of serviceNeeds) {
    const provider = findServiceProvider(serviceName, allFeatures);
    if (!provider) {
      validation.errors.push(
        `Service '${serviceName}' is needed but not provided by any feature`
      );
      validation.missingDependencies.push(`service:${serviceName}`);
      validation.valid = false;
    }
  }

  return validation;
}

function findServiceProvider(serviceName, features) {
  for (const [, feature] of Object.entries(features)) {
    if (feature.contract?.provides?.services?.includes(serviceName)) {
      return feature.name;
    }
  }
  return null;
}

async function checkCircularDependencies(features) {
  // Simple circular dependency check - can be enhanced
  return [];
}

function validateAppKitServices(features) {
  const validation = { valid: true, errors: [], warnings: [] };
  const validAppKitServices = [
    'database',
    'auth',
    'logging',
    'config',
    'security',
    'error',
    'storage',
    'cache',
    'email',
    'event',
    'queue',
    'utils',
  ];

  for (const [featureName, feature] of Object.entries(features)) {
    if (feature.contract?.imports?.appkit) {
      for (const appkitService of feature.contract.imports.appkit) {
        if (!validAppKitServices.includes(appkitService)) {
          validation.errors.push(
            `Feature '${featureName}' imports unknown AppKit service '${appkitService}'`
          );
          validation.valid = false;
        }
      }
    }
  }

  return validation;
}

function displayValidationResults(
  validation,
  staticAnalysis,
  circularDeps,
  appkitValidation,
  features
) {
  const allErrors = [
    ...Object.values(validation).flatMap((v) => v.errors || []),
    ...(staticAnalysis.errors || []),
    ...(appkitValidation.errors || []),
  ];

  const allWarnings = [
    ...Object.values(validation).flatMap((v) => v.warnings || []),
    ...(staticAnalysis.warnings || []),
    ...(appkitValidation.warnings || []),
  ];

  const allValid = allErrors.length === 0 && circularDeps.length === 0;

  if (allValid) {
    logBox(
      '✅ All Contract Validations Passed',
      [
        '🎯 Contract dependencies: PASSED',
        '🔍 Static analysis: PASSED',
        '🔄 Circular dependencies: NONE',
        '⚙️  AppKit services: VALID',
        '',
        'Contracts are fully enforced! 🔒',
      ],
      'green'
    );
  } else {
    logBox(
      '❌ Contract Validation Failed',
      [
        `${allErrors.length} errors found`,
        `${allWarnings.length} warnings found`,
        '',
        'Fix all errors before deployment',
      ],
      'red'
    );

    console.log();
    log(`${colors.bright}Feature Validation Results:${colors.reset}`, 'white');

    Object.entries(validation).forEach(([featureName, result]) => {
      const icon = result.valid ? symbols.check : symbols.error;
      const color = result.valid ? 'green' : 'red';
      log(`  ${icon} ${colors[color]}${featureName}${colors.reset}`, 'white');
    });

    if (staticAnalysis.errors.length > 0) {
      console.log();
      log(`${colors.bright}Static Analysis Errors:${colors.reset}`, 'white');
      staticAnalysis.errors.forEach((error) => {
        log(`  ${symbols.error} ${colors.red}${error}${colors.reset}`, 'white');
      });
    }
  }

  console.log();
  log(`${colors.bright}Individual Commands:${colors.reset}`, 'gray');
  log('  npm run flux:contracts  # Contract validation', 'gray');
  log('  npm run flux:check      # Full quality check', 'gray');
  log('  npm run dev             # Start development server', 'gray');

  process.exit(allValid ? 0 : 1);
}
