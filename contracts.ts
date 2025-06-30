/**
 * Flux Framework - Type-Safe Backend Contract Builder
 * @description Contract creation utilities for backend features with full TypeScript support
 * @module @voilajsx/flux
 * @file contracts.ts
 */

/**
 * Types of services that can be provided or consumed
 */
export type ContractItemType = 'route' | 'service' | 'middleware' | 'model' | 'platform';

/**
 * Contract item definition
 */
export interface ContractItem {
  readonly type: ContractItemType;
  readonly value: string;
}

/**
 * Feature contract definition
 */
export interface FeatureContract {
  readonly provides: readonly ContractItem[];
  readonly needs: readonly ContractItem[];
}

/**
 * Contract validation result
 */
export interface ContractValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Standard platform services automatically provided by Flux
 */
export const PLATFORM_SERVICES = {
  DATABASE: 'database',
  REDIS: 'redis', 
  AUTH: 'auth',
  LOGGING: 'logging',
  CONFIG: 'config',
  SECURITY: 'security',
  VALIDATION: 'validation'
} as const;

/**
 * Type-safe platform service names
 */
export type PlatformService = typeof PLATFORM_SERVICES[keyof typeof PLATFORM_SERVICES];

/**
 * Type-safe contract builder for backend features
 */
export class ContractBuilder {
  private readonly contract: {
    provides: ContractItem[];
    needs: ContractItem[];
  };

  constructor() {
    this.contract = {
      provides: [],
      needs: []
    };
  }

  /**
   * Declare that this feature provides a route
   * @param route - Route pattern (e.g., 'GET /api/users')
   */
  providesRoute(route: string): ContractBuilder {
    this.contract.provides.push({ type: 'route', value: route });
    return this;
  }

  /**
   * Declare that this feature provides a service
   * @param serviceName - Service identifier
   */
  providesService(serviceName: string): ContractBuilder {
    this.contract.provides.push({ type: 'service', value: serviceName });
    return this;
  }

  /**
   * Declare that this feature provides middleware
   * @param middlewareName - Middleware identifier
   */
  providesMiddleware(middlewareName: string): ContractBuilder {
    this.contract.provides.push({ type: 'middleware', value: middlewareName });
    return this;
  }

  /**
   * Declare that this feature provides a model
   * @param modelName - Model identifier
   */
  providesModel(modelName: string): ContractBuilder {
    this.contract.provides.push({ type: 'model', value: modelName });
    return this;
  }

  /**
   * Declare that this feature needs database access
   */
  needsDatabase(): ContractBuilder {
    this.contract.needs.push({ type: 'platform', value: PLATFORM_SERVICES.DATABASE });
    return this;
  }

  /**
   * Declare that this feature needs Redis cache
   */
  needsRedis(): ContractBuilder {
    this.contract.needs.push({ type: 'platform', value: PLATFORM_SERVICES.REDIS });
    return this;
  }

  /**
   * Declare that this feature needs authentication
   */
  needsAuth(): ContractBuilder {
    this.contract.needs.push({ type: 'platform', value: PLATFORM_SERVICES.AUTH });
    return this;
  }

  /**
   * Declare that this feature needs logging
   */
  needsLogging(): ContractBuilder {
    this.contract.needs.push({ type: 'platform', value: PLATFORM_SERVICES.LOGGING });
    return this;
  }

  /**
   * Declare that this feature needs configuration
   */
  needsConfig(): ContractBuilder {
    this.contract.needs.push({ type: 'platform', value: PLATFORM_SERVICES.CONFIG });
    return this;
  }

  /**
   * Declare that this feature needs security utilities
   */
  needsSecurity(): ContractBuilder {
    this.contract.needs.push({ type: 'platform', value: PLATFORM_SERVICES.SECURITY });
    return this;
  }

  /**
   * Declare that this feature needs validation utilities
   */
  needsValidation(): ContractBuilder {
    this.contract.needs.push({ type: 'platform', value: PLATFORM_SERVICES.VALIDATION });
    return this;
  }

  /**
   * Declare that this feature needs another service
   * @param serviceName - Service identifier
   */
  needsService(serviceName: string): ContractBuilder {
    this.contract.needs.push({ type: 'service', value: serviceName });
    return this;
  }

  /**
   * Declare that this feature needs middleware
   * @param middlewareName - Middleware identifier
   */
  needsMiddleware(middlewareName: string): ContractBuilder {
    this.contract.needs.push({ type: 'middleware', value: middlewareName });
    return this;
  }

  /**
   * Declare that this feature needs a model
   * @param modelName - Model identifier
   */
  needsModel(modelName: string): ContractBuilder {
    this.contract.needs.push({ type: 'model', value: modelName });
    return this;
  }

  /**
   * Build and return the final contract
   */
  build(): FeatureContract {
    return {
      provides: [...this.contract.provides],
      needs: [...this.contract.needs]
    };
  }
}

/**
 * Creates a type-safe backend contract builder for features
 */
export function createBackendContract(): ContractBuilder {
  return new ContractBuilder();
}

/**
 * Predefined contract templates for common feature patterns
 */
export const CONTRACT_TEMPLATES = {
  /**
   * Simple API feature with database and authentication
   */
  API_FEATURE: (): ContractBuilder => createBackendContract()
    .needsDatabase()
    .needsAuth()
    .needsLogging(),

  /**
   * Public API feature (no authentication required)
   */
  PUBLIC_API: (): ContractBuilder => createBackendContract()
    .needsDatabase()
    .needsLogging(),

  /**
   * Service-only feature (no HTTP routes)
   */
  SERVICE_ONLY: (): ContractBuilder => createBackendContract()
    .needsDatabase()
    .needsLogging(),

  /**
   * Middleware feature
   */
  MIDDLEWARE_FEATURE: (): ContractBuilder => createBackendContract()
    .needsAuth()
    .needsLogging(),

  /**
   * Cache-enabled feature with Redis
   */
  CACHED_FEATURE: (): ContractBuilder => createBackendContract()
    .needsDatabase()
    .needsRedis()
    .needsAuth()
    .needsLogging(),

  /**
   * Admin feature with full platform dependencies
   */
  ADMIN_FEATURE: (): ContractBuilder => createBackendContract()
    .needsDatabase()
    .needsAuth()
    .needsSecurity()
    .needsValidation()
    .needsLogging()
} as const;

/**
 * Type for contract template names
 */
export type ContractTemplate = keyof typeof CONTRACT_TEMPLATES;

/**
 * Validate a contract for completeness and correctness
 * @param contract - Contract to validate
 */
export function validateContract(contract: FeatureContract): ContractValidationResult {
  const errors: string[] = [];

  if (!contract) {
    errors.push('Contract is required');
    return { valid: false, errors };
  }

  if (!Array.isArray(contract.provides)) {
    errors.push('Contract must have provides array');
  }

  if (!Array.isArray(contract.needs)) {
    errors.push('Contract must have needs array');
  }

  // Check for duplicate provides
  const provideKeys = contract.provides.map(p => `${p.type}:${p.value}`);
  const duplicateProvides = provideKeys.filter((key, index) => provideKeys.indexOf(key) !== index);
  
  if (duplicateProvides.length > 0) {
    errors.push(`Duplicate provides: ${[...new Set(duplicateProvides)].join(', ')}`);
  }

  // Check for duplicate needs
  const needKeys = contract.needs.map(n => `${n.type}:${n.value}`);
  const duplicateNeeds = needKeys.filter((key, index) => needKeys.indexOf(key) !== index);
  
  if (duplicateNeeds.length > 0) {
    errors.push(`Duplicate needs: ${[...new Set(duplicateNeeds)].join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a service is provided by the platform
 * @param serviceName - Service to check
 */
export function isPlatformService(serviceName: string): serviceName is PlatformService {
  return Object.values(PLATFORM_SERVICES).includes(serviceName as PlatformService);
}

/**
 * Utility type for extracting contract item values by type
 */
export type ContractItemsByType<T extends ContractItemType> = Extract<ContractItem, { type: T }>['value'];

/**
 * Type guard for contract items
 */
export function isContractItem(item: unknown): item is ContractItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'type' in item &&
    'value' in item &&
    typeof (item as ContractItem).type === 'string' &&
    typeof (item as ContractItem).value === 'string'
  );
}