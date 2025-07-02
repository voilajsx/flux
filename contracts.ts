/**
 * Flux Framework - Type-Safe Backend Contract Builder
 * @module @voilajsx/flux/contracts
 * @file contracts.ts
 * 
 * @llm-rule WHEN: Creating feature contracts with service-only public APIs
 * @llm-rule AVOID: Exposing models as public APIs - use services only
 * @llm-rule NOTE: Supports provides, internal, import, needs categories
 */

/**
 * Types of services that can be provided or consumed
 */
export type ContractItemType = 'route' | 'service' | 'middleware' | 'model' | 'platform';

/**
 * Contract item definition
 * @llm-rule WHEN: Need to represent a single contract declaration
 * @llm-rule AVOID: Creating items manually - use ContractBuilder methods
 */
export interface ContractItem {
  readonly type: ContractItemType;
  readonly value: string;
}

/**
 * Feature contract definition with structured categories
 * @llm-rule WHEN: Representing a complete feature contract
 * @llm-rule AVOID: Direct object creation - use ContractBuilder.build()
 * @llm-rule NOTE: Enforces service-only public APIs and private models
 */
export interface FeatureContract {
  readonly provides: { routes?: string[], services?: string[] };
  readonly internal: { services?: string[], models?: string[] };
  readonly imports: { appkit?: string[], external?: string[] };
  readonly needs: { services?: string[] };
}

/**
 * Contract validation result
 * @llm-rule WHEN: Need validation feedback for contract correctness
 * @llm-rule AVOID: Ignoring validation errors - they prevent runtime issues
 */
export interface ContractValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Standard AppKit services automatically provided by Flux
 * @llm-rule WHEN: Declaring AppKit service dependencies in contracts
 * @llm-rule AVOID: Using strings directly - use these constants for validation
 */
export const APPKIT_SERVICES = {
  DATABASE: 'database',
  AUTH: 'auth',
  LOGGING: 'logging',
  CONFIG: 'config',
  SECURITY: 'security',
  ERROR: 'error',
  STORAGE: 'storage',
  CACHE: 'cache',
  EMAIL: 'email',
  EVENT: 'event',
  QUEUE: 'queue',
  UTILS: 'utils'
} as const;

/**
 * Type-safe AppKit service names
 */
export type AppKitService = typeof APPKIT_SERVICES[keyof typeof APPKIT_SERVICES];

/**
 * Contract categories for the enhanced syntax
 */
export type ProvidesCategory = 'routes' | 'services';
export type InternalCategory = 'services' | 'models' | 'validators' | 'middlewares' |  'helpers';
export type ImportCategory = 'appkit' | 'external';
export type NeedsCategory = 'services';

/**
 * Type-safe contract builder with structured validation
 * @llm-rule WHEN: Building feature contracts with proper categorization
 * @llm-rule AVOID: Manual contract object creation - use this builder
 * @llm-rule NOTE: Enforces service-only public APIs and validates structure
 */
export class ContractBuilder {
  private readonly contract: {
    provides: { routes: string[], services: string[] };
    internal: { services: string[], models: string[] };
    imports: { appkit: string[], external: string[] };
    needs: { services: string[] };
  };

  constructor() {
    this.contract = {
      provides: { routes: [], services: [] },
      internal: { services: [], models: [] },
      imports: { appkit: [], external: [] },
      needs: { services: [] }
    };
  }

  /**
   * 🌍 PUBLIC API - What this feature offers to others
   * @param category - routes | services
   * @param items - Array of items being provided
   * @llm-rule WHEN: Declaring public endpoints and services for other features
   * @llm-rule AVOID: Exposing internal implementation details as public
   */
  provides(category: ProvidesCategory, items: string[]): ContractBuilder {
    if (category === 'routes') {
      this.contract.provides.routes.push(...items);
    } else if (category === 'services') {
      this.contract.provides.services.push(...items);
    }
    return this;
  }

  /**
   * 🔒 PRIVATE IMPLEMENTATION - Internal to this feature only
   * @param category - services | models
   * @param items - Array of internal items
   * @llm-rule WHEN: Declaring private services and models within feature
   * @llm-rule AVOID: Making internal implementation public - keep encapsulated
   */
  internal(category: InternalCategory, items: string[]): ContractBuilder {
    if (category === 'services') {
      this.contract.internal.services.push(...items);
    } else if (category === 'models') {
      this.contract.internal.models.push(...items);
    }
    return this;
  }

  /**
   * 📦 PLATFORM IMPORTS - External services/libraries
   * @param source - appkit | external
   * @param items - Array of imports
   * @llm-rule WHEN: Using AppKit services or external dependencies
   * @llm-rule AVOID: Undeclared imports - all dependencies must be explicit
   */
  import(source: ImportCategory, items: string[]): ContractBuilder {
    if (source === 'appkit') {
      this.contract.imports.appkit.push(...items);
    } else if (source === 'external') {
      this.contract.imports.external.push(...items);
    }
    return this;
  }

  /**
   * 🤝 FEATURE DEPENDENCIES - Services from other features only
   * @param category - services
   * @param items - Array of needed services
   * @llm-rule WHEN: Consuming services from other features
   * @llm-rule AVOID: Direct model access between features - use services only
   */
  needs(category: NeedsCategory, items: string[]): ContractBuilder {
    if (category === 'services') {
      this.contract.needs.services.push(...items);
    }
    return this;
  }

  // 🔄 BACKWARD COMPATIBILITY - Keep old methods for existing code
  
  /**
   * @deprecated Use .provides('routes', [...]) instead
   */
  providesRoute(route: string): ContractBuilder {
    this.contract.provides.routes.push(route);
    return this;
  }

  /**
   * @deprecated Use .provides('services', [...]) instead
   */
  providesService(serviceName: string): ContractBuilder {
    this.contract.provides.services.push(serviceName);
    return this;
  }

  /**
   * @deprecated Use .provides('models', [...]) instead
   */
  providesModel(modelName: string): ContractBuilder {
    // Note: Models are now internal by default
    this.contract.internal.models.push(modelName);
    return this;
  }

  /**
   * @deprecated Use .import('appkit', ['logging']) instead
   */
  needsLogging(): ContractBuilder {
    this.contract.imports.appkit.push(APPKIT_SERVICES.LOGGING);
    return this;
  }

  /**
   * @deprecated Use .import('appkit', ['auth']) instead
   */
  needsAuth(): ContractBuilder {
    this.contract.imports.appkit.push(APPKIT_SERVICES.AUTH);
    return this;
  }

  /**
   * @deprecated Use .import('appkit', ['database']) instead
   */
  needsDatabase(): ContractBuilder {
    this.contract.imports.appkit.push(APPKIT_SERVICES.DATABASE);
    return this;
  }

  /**
   * @deprecated Use .import('appkit', ['redis']) instead
   */
  needsRedis(): ContractBuilder {
    this.contract.imports.appkit.push(APPKIT_SERVICES.CACHE);
    return this;
  }

  /**
   * @deprecated Use .import('appkit', ['config']) instead
   */
  needsConfig(): ContractBuilder {
    this.contract.imports.appkit.push(APPKIT_SERVICES.CONFIG);
    return this;
  }

  /**
   * @deprecated Use .import('appkit', ['security']) instead
   */
  needsSecurity(): ContractBuilder {
    this.contract.imports.appkit.push(APPKIT_SERVICES.SECURITY);
    return this;
  }

  /**
   * @deprecated Use .import('appkit', ['validation']) instead
   */
  needsValidation(): ContractBuilder {
    this.contract.imports.appkit.push(APPKIT_SERVICES.UTILS);
    return this;
  }

  /**
   * @deprecated Use .needs('services', [...]) instead
   */
  needsService(serviceName: string): ContractBuilder {
    this.contract.needs.services.push(serviceName);
    return this;
  }

  /**
   * Build and return the final contract
   * @llm-rule WHEN: Ready to finalize contract after all declarations
   * @llm-rule AVOID: Modifying contract after build() - create new builder
   */
  build(): FeatureContract {
    return {
      provides: {
        routes: [...this.contract.provides.routes],
        services: [...this.contract.provides.services]
      },
      internal: {
        services: [...this.contract.internal.services],
        models: [...this.contract.internal.models]
      },
      imports: {
        appkit: [...this.contract.imports.appkit],
        external: [...this.contract.imports.external]
      },
      needs: {
        services: [...this.contract.needs.services]
      }
    };
  }
}

/**
 * Creates a type-safe backend contract builder for features
 * @llm-rule WHEN: Starting contract definition for any feature
 * @llm-rule AVOID: Creating FeatureContract objects manually
 */
export function createBackendContract(): ContractBuilder {
  return new ContractBuilder();
}

/**
 * Validate a contract for completeness and correctness
 * @param contract - Contract to validate
 * @llm-rule WHEN: Need to verify contract structure before deployment
 * @llm-rule AVOID: Skipping validation - prevents runtime contract errors
 * @llm-rule NOTE: Checks for required fields and duplicate declarations
 */
export function validateContract(contract: FeatureContract): ContractValidationResult {
  const errors: string[] = [];

  if (!contract) {
    errors.push('Contract is required');
    return { valid: false, errors };
  }

  if (!contract.provides || typeof contract.provides !== 'object') {
    errors.push('Contract must have provides object');
  }

  if (!contract.internal || typeof contract.internal !== 'object') {
    errors.push('Contract must have internal object');
  }

  if (!contract.imports || typeof contract.imports !== 'object') {
    errors.push('Contract must have imports object');
  }

  if (!contract.needs || typeof contract.needs !== 'object') {
    errors.push('Contract must have needs object');
  }

  // Check for duplicate provides
  const provideRoutes = contract.provides.routes || [];
  const provideServices = contract.provides.services || [];
  
  const duplicateRoutes = provideRoutes.filter((route, index) => provideRoutes.indexOf(route) !== index);
  if (duplicateRoutes.length > 0) {
    errors.push(`Duplicate provided routes: ${[...new Set(duplicateRoutes)].join(', ')}`);
  }

  const duplicateServices = provideServices.filter((service, index) => provideServices.indexOf(service) !== index);
  if (duplicateServices.length > 0) {
    errors.push(`Duplicate provided services: ${[...new Set(duplicateServices)].join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a service is provided by AppKit
 * @param serviceName - Service to check
 * @llm-rule WHEN: Validating AppKit service imports in contracts
 * @llm-rule AVOID: Hardcoded service name checks - use this helper
 */
export function isAppKitService(serviceName: string): serviceName is AppKitService {
  return Object.values(APPKIT_SERVICES).includes(serviceName as AppKitService);
}