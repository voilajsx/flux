/**
 * Flux Framework - Contract Validation
 * @file scripts/lib/contracts.js
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
 * Validate feature contracts and dependencies
 */
export async function runContracts(args) {
  const timer = new Timer();

  console.clear();

  logBox(`${symbols.contracts} Flux Contract Validation`, [
    `${symbols.target} Dependency analysis and validation`,
    `${symbols.lightning} Circular dependency detection`,
    `${symbols.security} Platform service verification`,
    `${symbols.sparkles} Architecture integrity check`,
  ]);

  const spinner = new Spinner('Discovering features and contracts...');
  spinner.start();

  try {
    // Discover features and their contracts
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

    // Validate contracts
    log(`${symbols.lightning} Validating feature contracts...`, 'white');
    const validation = await validateAllContracts(features);

    // Check for circular dependencies
    log(`${symbols.target} Checking circular dependencies...`, 'white');
    const circularDeps = await checkCircularDependencies(features);

    // Validate platform services
    log(`${symbols.security} Validating platform services...`, 'white');
    const platformValidation = validatePlatformServices(features);

    // Display results
    console.clear();
    timer.endWithMessage(`${symbols.check} Contract validation completed!`);

    displayValidationResults(
      validation,
      circularDeps,
      platformValidation,
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
 * Discover all features and their contracts
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

    // Parse provides/needs from the contract builder chain
    const contract = {
      provides: {
        routes: [],
        services: [],
        middleware: [],
        models: [],
      },
      needs: {
        platform: [],
        services: [],
        middleware: [],
        models: [],
      },
    };

    // Extract provides
    const providesRouteMatches =
      contractCode.match(/\.providesRoute\(['"`]([^'"`]+)['"`]\)/g) || [];
    providesRouteMatches.forEach((match) => {
      const routeMatch = match.match(/\.providesRoute\(['"`]([^'"`]+)['"`]\)/);
      if (routeMatch) {
        contract.provides.routes.push(routeMatch[1]);
      }
    });

    const providesServiceMatches =
      contractCode.match(/\.providesService\(['"`]([^'"`]+)['"`]\)/g) || [];
    providesServiceMatches.forEach((match) => {
      const serviceMatch = match.match(
        /\.providesService\(['"`]([^'"`]+)['"`]\)/
      );
      if (serviceMatch) {
        contract.provides.services.push(serviceMatch[1]);
      }
    });

    const providesMiddlewareMatches =
      contractCode.match(/\.providesMiddleware\(['"`]([^'"`]+)['"`]\)/g) || [];
    providesMiddlewareMatches.forEach((match) => {
      const middlewareMatch = match.match(
        /\.providesMiddleware\(['"`]([^'"`]+)['"`]\)/
      );
      if (middlewareMatch) {
        contract.provides.middleware.push(middlewareMatch[1]);
      }
    });

    const providesModelMatches =
      contractCode.match(/\.providesModel\(['"`]([^'"`]+)['"`]\)/g) || [];
    providesModelMatches.forEach((match) => {
      const modelMatch = match.match(/\.providesModel\(['"`]([^'"`]+)['"`]\)/);
      if (modelMatch) {
        contract.provides.models.push(modelMatch[1]);
      }
    });

    // Extract needs
    const needsPlatformMatches =
      contractCode.match(
        /\.needs(Database|Redis|Auth|Logging|Config|Security|Validation)\(\)/g
      ) || [];
    needsPlatformMatches.forEach((match) => {
      const platformMatch = match.match(/\.needs(\w+)\(\)/);
      if (platformMatch) {
        const serviceName = platformMatch[1].toLowerCase();
        contract.needs.platform.push(serviceName);
      }
    });

    const needsServiceMatches =
      contractCode.match(/\.needsService\(['"`]([^'"`]+)['"`]\)/g) || [];
    needsServiceMatches.forEach((match) => {
      const serviceMatch = match.match(/\.needsService\(['"`]([^'"`]+)['"`]\)/);
      if (serviceMatch) {
        contract.needs.services.push(serviceMatch[1]);
      }
    });

    const needsMiddlewareMatches =
      contractCode.match(/\.needsMiddleware\(['"`]([^'"`]+)['"`]\)/g) || [];
    needsMiddlewareMatches.forEach((match) => {
      const middlewareMatch = match.match(
        /\.needsMiddleware\(['"`]([^'"`]+)['"`]\)/
      );
      if (middlewareMatch) {
        contract.needs.middleware.push(middlewareMatch[1]);
      }
    });

    const needsModelMatches =
      contractCode.match(/\.needsModel\(['"`]([^'"`]+)['"`]\)/g) || [];
    needsModelMatches.forEach((match) => {
      const modelMatch = match.match(/\.needsModel\(['"`]([^'"`]+)['"`]\)/);
      if (modelMatch) {
        contract.needs.models.push(modelMatch[1]);
      }
    });

    return contract;
  } catch (error) {
    throw new Error(`Failed to parse contract: ${error.message}`);
  }
}

/**
 * Validate all contracts
 */
async function validateAllContracts(features) {
  const validation = {};

  for (const [featureName, feature] of Object.entries(features)) {
    validation[featureName] = await validateFeatureContract(feature, features);
  }

  return validation;
}

/**
 * Validate a single feature's contract
 */
async function validateFeatureContract(feature, allFeatures) {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    missingDependencies: [],
  };

  const { contract } = feature;

  // Check service dependencies
  if (contract.needs.services) {
    for (const service of contract.needs.services) {
      const provider = findServiceProvider(service, allFeatures);
      if (!provider) {
        validation.errors.push(
          `Service '${service}' is needed but not provided by any feature`
        );
        validation.missingDependencies.push(`service:${service}`);
        validation.valid = false;
      }
    }
  }

  // Check middleware dependencies
  if (contract.needs.middleware) {
    for (const middleware of contract.needs.middleware) {
      const provider = findMiddlewareProvider(middleware, allFeatures);
      if (!provider) {
        validation.errors.push(
          `Middleware '${middleware}' is needed but not provided by any feature`
        );
        validation.missingDependencies.push(`middleware:${middleware}`);
        validation.valid = false;
      }
    }
  }

  // Check model dependencies
  if (contract.needs.models) {
    for (const model of contract.needs.models) {
      const provider = findModelProvider(model, allFeatures);
      if (!provider) {
        validation.errors.push(
          `Model '${model}' is needed but not provided by any feature`
        );
        validation.missingDependencies.push(`model:${model}`);
        validation.valid = false;
      }
    }
  }

  // Check for duplicate provides
  if (contract.provides.services) {
    for (const service of contract.provides.services) {
      const otherProviders = findAllServiceProviders(
        service,
        allFeatures,
        feature.name
      );
      if (otherProviders.length > 0) {
        validation.warnings.push(
          `Service '${service}' is also provided by: ${otherProviders.join(', ')}`
        );
      }
    }
  }

  // Check route conflicts
  if (contract.provides.routes) {
    for (const route of contract.provides.routes) {
      const otherProviders = findAllRouteProviders(
        route,
        allFeatures,
        feature.name
      );
      if (otherProviders.length > 0) {
        validation.warnings.push(
          `Route '${route}' is also provided by: ${otherProviders.join(', ')}`
        );
      }
    }
  }

  return validation;
}

/**
 * Check for circular dependencies
 */
async function checkCircularDependencies(features) {
  const graph = generateDependencyGraph(features);
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path) {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart).concat(node).join(' → '));
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    recursionStack.add(node);

    const dependencies = graph[node] || [];
    dependencies.forEach((dep) => {
      dfs(dep, [...path, node]);
    });

    recursionStack.delete(node);
  }

  Object.keys(graph).forEach((feature) => {
    if (!visited.has(feature)) {
      dfs(feature, []);
    }
  });

  return cycles;
}

/**
 * Generate dependency graph
 */
function generateDependencyGraph(features) {
  const graph = {};

  Object.entries(features).forEach(([featureName, feature]) => {
    graph[featureName] = [];

    const { contract } = feature;

    // Add service dependencies
    if (contract.needs.services) {
      contract.needs.services.forEach((service) => {
        const provider = findServiceProvider(service, features);
        if (provider && provider !== featureName) {
          graph[featureName].push(provider);
        }
      });
    }

    // Add middleware dependencies
    if (contract.needs.middleware) {
      contract.needs.middleware.forEach((middleware) => {
        const provider = findMiddlewareProvider(middleware, features);
        if (provider && provider !== featureName) {
          graph[featureName].push(provider);
        }
      });
    }

    // Add model dependencies
    if (contract.needs.models) {
      contract.needs.models.forEach((model) => {
        const provider = findModelProvider(model, features);
        if (provider && provider !== featureName) {
          graph[featureName].push(provider);
        }
      });
    }

    // Remove duplicates
    graph[featureName] = [...new Set(graph[featureName])];
  });

  return graph;
}

/**
 * Validate platform services
 */
function validatePlatformServices(features) {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const validPlatformServices = [
    'database',
    'redis',
    'auth',
    'logging',
    'config',
    'security',
    'validation',
  ];

  Object.entries(features).forEach(([featureName, feature]) => {
    const { contract } = feature;

    if (contract.needs.platform) {
      contract.needs.platform.forEach((service) => {
        if (!validPlatformServices.includes(service)) {
          validation.errors.push(
            `Feature '${featureName}' needs unknown platform service '${service}'`
          );
          validation.valid = false;
        }
      });
    }
  });

  return validation;
}

/**
 * Helper functions to find providers
 */
function findServiceProvider(service, features) {
  for (const [featureName, feature] of Object.entries(features)) {
    if (feature.contract.provides?.services?.includes(service)) {
      return featureName;
    }
  }
  return null;
}

function findMiddlewareProvider(middleware, features) {
  for (const [featureName, feature] of Object.entries(features)) {
    if (feature.contract.provides?.middleware?.includes(middleware)) {
      return featureName;
    }
  }
  return null;
}

function findModelProvider(model, features) {
  for (const [featureName, feature] of Object.entries(features)) {
    if (feature.contract.provides?.models?.includes(model)) {
      return featureName;
    }
  }
  return null;
}

function findAllServiceProviders(service, features, excludeFeature) {
  const providers = [];
  for (const [featureName, feature] of Object.entries(features)) {
    if (
      featureName !== excludeFeature &&
      feature.contract.provides?.services?.includes(service)
    ) {
      providers.push(featureName);
    }
  }
  return providers;
}

function findAllRouteProviders(route, features, excludeFeature) {
  const providers = [];
  for (const [featureName, feature] of Object.entries(features)) {
    if (
      featureName !== excludeFeature &&
      feature.contract.provides?.routes?.includes(route)
    ) {
      providers.push(featureName);
    }
  }
  return providers;
}

/**
 * Display validation results
 */
function displayValidationResults(
  validation,
  circularDeps,
  platformValidation,
  features
) {
  const allValid =
    Object.values(validation).every((v) => v.valid) &&
    circularDeps.length === 0 &&
    platformValidation.valid;

  const totalErrors =
    Object.values(validation).reduce((sum, v) => sum + v.errors.length, 0) +
    platformValidation.errors.length;

  const totalWarnings =
    Object.values(validation).reduce((sum, v) => sum + v.warnings.length, 0) +
    platformValidation.warnings.length;

  if (allValid) {
    logBox(
      `${symbols.check} All Contracts Valid`,
      [
        `${symbols.contracts} ${Object.keys(features).length} features validated`,
        `${symbols.lightning} No dependency issues found`,
        `${symbols.security} Platform services verified`,
        `${symbols.target} Architecture is sound`,
      ],
      'green'
    );
  } else {
    logBox(
      `${symbols.warning} Contract Issues Found`,
      [
        `${symbols.error} ${totalErrors} errors need attention`,
        `${symbols.warning} ${totalWarnings} warnings to review`,
        `${symbols.target} ${circularDeps.length} circular dependencies`,
        `${symbols.security} Platform validation: ${platformValidation.valid ? 'passed' : 'failed'}`,
      ],
      'yellow'
    );
  }

  // Show detailed validation results
  console.log();
  log(`${colors.bright}Feature Validation Results:${colors.reset}`, 'white');

  Object.entries(validation).forEach(([featureName, result]) => {
    const icon = result.valid ? symbols.check : symbols.error;
    const color = result.valid ? 'green' : 'red';

    log(`  ${icon} ${colors[color]}${featureName}${colors.reset}`, 'white');

    if (result.errors.length > 0) {
      result.errors.forEach((error) => {
        log(
          `    ${symbols.error} ${colors.red}${error}${colors.reset}`,
          'white'
        );
      });
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        log(
          `    ${symbols.warning} ${colors.yellow}${warning}${colors.reset}`,
          'white'
        );
      });
    }
  });

  // Show platform validation results
  if (!platformValidation.valid || platformValidation.warnings.length > 0) {
    console.log();
    log(`${colors.bright}Platform Service Validation:${colors.reset}`, 'white');

    platformValidation.errors.forEach((error) => {
      log(`  ${symbols.error} ${colors.red}${error}${colors.reset}`, 'white');
    });

    platformValidation.warnings.forEach((warning) => {
      log(
        `  ${symbols.warning} ${colors.yellow}${warning}${colors.reset}`,
        'white'
      );
    });
  }

  // Show circular dependencies
  if (circularDeps.length > 0) {
    console.log();
    log(`${colors.bright}Circular Dependencies:${colors.reset}`, 'white');
    circularDeps.forEach((cycle) => {
      log(`  ${symbols.error} ${colors.red}${cycle}${colors.reset}`, 'white');
    });
  }

  // Show dependency summary
  console.log();
  log(`${colors.bright}Dependency Summary:${colors.reset}`, 'white');
  const graph = generateDependencyGraph(features);

  Object.entries(graph).forEach(([feature, deps]) => {
    if (deps.length > 0) {
      log(
        `  ${symbols.target} ${colors.cyan}${feature}${colors.reset} ${colors.gray}depends on${colors.reset} ${deps.join(', ')}`,
        'white'
      );
    } else {
      log(
        `  ${symbols.sparkles} ${colors.cyan}${feature}${colors.reset} ${colors.gray}has no dependencies${colors.reset}`,
        'white'
      );
    }
  });

  console.log();

  if (allValid) {
    logSuccess('Contract architecture is healthy! 🎯');
  } else {
    logError('Contract issues need resolution before deployment');

    if (totalErrors > 0) {
      console.log();
      logBox(
        'Resolution Steps',
        [
          '1. Fix missing service/middleware/model providers',
          '2. Resolve circular dependencies',
          '3. Update feature contracts',
          '4. Run flux:contracts again to verify',
        ],
        'blue'
      );
    }
  }
}
