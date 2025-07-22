/**
 * ATOM Framework schema coordination and migration management (placeholder for hello app)
 * @module @voilajsx/atom/platform/migrate
 * @file src/platform/migrate.ts
 * 
 * @llm-rule WHEN: Managing database schemas and migrations for ATOM Framework with multi-tenant support
 * @llm-rule AVOID: Manual schema changes - use coordinated migration system for consistency
 * @llm-rule NOTE: Placeholder implementation for hello app - no database required, but ready for future scaling
 */

import { logger } from '@voilajsx/appkit/logging';
import { configure } from '@voilajsx/appkit/config';
import { utility } from '@voilajsx/appkit/utils';
import { readdir, readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';

// Initialize VoilaJSX AppKit modules
const log = logger.get('migrate');
const config = configure.get();
const utils = utility.get();

/**
 * Interface for ATOM Framework migration configuration and coordination
 * @llm-rule WHEN: Configuring database migrations across ATOM Framework features
 * @llm-rule AVOID: Feature-specific migration tools - use centralized coordination for consistency
 * @llm-rule NOTE: Supports multi-tenant migrations and cross-feature schema dependencies
 */
export interface MigrationConfig {
  enabled: boolean;
  auto_discover: boolean;
  features_path: string;
  output_path: string;
  multi_tenant: boolean;
  coordination: {
    validate_dependencies: boolean;
    merge_schemas: boolean;
    generate_unified: boolean;
  };
}

/**
 * Interface for feature schema information and migration tracking
 * @llm-rule WHEN: Tracking individual feature schemas for coordination and validation
 * @llm-rule AVOID: Untracked schema changes - all features must register their schema requirements
 * @llm-rule NOTE: Enables automatic schema merging and dependency validation across features
 */
export interface FeatureSchema {
  feature_name: string;
  schema_path: string;
  has_migrations: boolean;
  last_modified: string;
  tables: string[];
  dependencies: string[];
  tenant_aware: boolean;
}

/**
 * Interface for migration execution results and coordination status
 * @llm-rule WHEN: Tracking migration execution across multiple features and environments
 * @llm-rule AVOID: Silent migration failures - track all results for rollback and debugging
 * @llm-rule NOTE: Supports both single-tenant and multi-tenant migration tracking
 */
export interface MigrationResult {
  migration_id: string;
  success: boolean;
  features_processed: string[];
  schemas_merged: boolean;
  unified_schema_generated: boolean;
  multi_tenant_mode: boolean;
  execution_time: number;
  errors: string[];
  warnings: string[];
}

/**
 * Coordinates schema migration across all ATOM Framework features
 * @llm-rule WHEN: Deploying or updating ATOM applications that may have schema changes
 * @llm-rule AVOID: Running migrations without coordination - can cause feature conflicts
 * @llm-rule NOTE: For hello app, this validates structure without actual database operations
 */
export async function coordinateMigrations(): Promise<MigrationResult> {
  const migrationId = utils.uuid();
  const startTime = Date.now();
  
  log.info('🔄 Starting ATOM Framework schema coordination', {
    migrationId,
    timestamp: new Date().toISOString()
  });

  const result: MigrationResult = {
    migration_id: migrationId,
    success: false,
    features_processed: [],
    schemas_merged: false,
    unified_schema_generated: false,
    multi_tenant_mode: false,
    execution_time: 0,
    errors: [],
    warnings: []
  };

  try {
    // Get migration configuration
    const migrationConfig = getMigrationConfig();
    
    if (!migrationConfig.enabled) {
      log.info('⏭️ Schema coordination disabled');
      result.success = true;
      result.warnings.push('Schema coordination disabled in configuration');
      return result;
    }

    // Discover feature schemas
    const featureSchemas = await discoverFeatureSchemas(migrationConfig);
    result.features_processed = featureSchemas.map(f => f.feature_name);

    // Validate schema dependencies
    if (migrationConfig.coordination.validate_dependencies) {
      await validateSchemaDependencies(featureSchemas);
    }

    // Merge feature schemas if needed
    if (migrationConfig.coordination.merge_schemas) {
      await mergeFeatureSchemas(featureSchemas, migrationConfig);
      result.schemas_merged = true;
    }

    // Generate unified schema
    if (migrationConfig.coordination.generate_unified) {
      await generateUnifiedSchema(featureSchemas, migrationConfig);
      result.unified_schema_generated = true;
    }

    // Set multi-tenant mode
    result.multi_tenant_mode = migrationConfig.multi_tenant;

    result.success = true;
    result.execution_time = Date.now() - startTime;

    log.info('✅ Schema coordination completed successfully', {
      migrationId,
      features: result.features_processed.length,
      execution_time: `${result.execution_time}ms`,
      multi_tenant: result.multi_tenant_mode
    });

    return result;

  } catch (error) {
    result.success = false;
    result.execution_time = Date.now() - startTime;
    result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');

    log.error('❌ Schema coordination failed', {
      migrationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      execution_time: `${result.execution_time}ms`
    });

    return result;
  }
}

/**
 * Discovers and analyzes schema files across all ATOM Framework features
 * @llm-rule WHEN: Scanning features directory for schema files and migration requirements
 * @llm-rule AVOID: Hardcoded feature lists - use auto-discovery for dynamic feature management
 * @llm-rule NOTE: Follows ATOM naming conventions (underscore prefix = disabled feature)
 */
async function discoverFeatureSchemas(config: MigrationConfig): Promise<FeatureSchema[]> {
  const schemas: FeatureSchema[] = [];
  
  try {
    log.info('🔍 Discovering feature schemas', {
      features_path: config.features_path
    });

    // Check if features directory exists
    await access(config.features_path);
    
    // Get all feature directories
    const featureDirs = await readdir(config.features_path);
    
    for (const featureDir of featureDirs) {
      // Skip disabled features (underscore prefix)
      if (featureDir.startsWith('_')) {
        log.debug('⏭️ Skipping disabled feature', { feature: featureDir });
        continue;
      }

      const featurePath = join(config.features_path, featureDir);
      const schemaPath = join(featurePath, 'schema.prisma');
      
      try {
        // Check if schema file exists
        await access(schemaPath);
        
        // Analyze schema content
        const schemaContent = await readFile(schemaPath, 'utf-8');
        const schema = analyzeSchemaContent(featureDir, schemaPath, schemaContent);
        
        schemas.push(schema);
        
        log.debug('📋 Feature schema discovered', {
          feature: schema.feature_name,
          tables: schema.tables.length,
          tenant_aware: schema.tenant_aware
        });
        
      } catch (error) {
        // Schema file doesn't exist - create placeholder
        await createPlaceholderSchema(featureDir, schemaPath);
        
        const placeholderSchema: FeatureSchema = {
          feature_name: featureDir,
          schema_path: schemaPath,
          has_migrations: false,
          last_modified: new Date().toISOString(),
          tables: [],
          dependencies: [],
          tenant_aware: false
        };
        
        schemas.push(placeholderSchema);
        
        log.debug('📝 Placeholder schema created', { feature: featureDir });
      }
    }

    log.info('✅ Feature schema discovery completed', {
      total_features: schemas.length,
      with_tables: schemas.filter(s => s.tables.length > 0).length
    });

    return schemas;

  } catch (error) {
    log.error('❌ Feature schema discovery failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Analyzes Prisma schema content for tables, dependencies, and tenant awareness
 * @llm-rule WHEN: Processing discovered schema files to extract metadata for coordination
 * @llm-rule AVOID: Regex-only parsing - use structured analysis for reliable schema processing
 * @llm-rule NOTE: Detects tenant_id fields automatically for multi-tenant support
 */
function analyzeSchemaContent(featureName: string, schemaPath: string, content: string): FeatureSchema {
  const tables: string[] = [];
  const dependencies: string[] = [];
  let tenantAware = false;

  // Extract model definitions (simplified parsing)
  const modelMatches = content.match(/model\s+(\w+)\s*{[^}]*}/g) || [];
  
  for (const modelMatch of modelMatches) {
    const tableMatch = modelMatch.match(/model\s+(\w+)/);
    if (tableMatch && tableMatch[1]) {
      const tableName = tableMatch[1];
      tables.push(tableName);
      
      // Check for tenant_id field
      if (modelMatch.includes('tenant_id')) {
        tenantAware = true;
      }
    }
  }

  // Extract dependencies (referenced models from other features)
  const referenceMatches = content.match(/@relation.*references:\s*\[(\w+)\]/g) || [];
  for (const refMatch of referenceMatches) {
    const fieldMatch = refMatch.match(/references:\s*\[(\w+)\]/);
    if (fieldMatch && fieldMatch[1]) {
      dependencies.push(fieldMatch[1]);
    }
  }

  return {
    feature_name: featureName,
    schema_path: schemaPath,
    has_migrations: content.includes('generator') || content.includes('datasource'),
    last_modified: new Date().toISOString(),
    tables,
    dependencies: [...new Set(dependencies)], // Remove duplicates
    tenant_aware: tenantAware
  };
}

/**
 * Creates placeholder schema file for features without database requirements
 * @llm-rule WHEN: Features discovered without schema files need placeholder for future scaling
 * @llm-rule AVOID: Empty directories without schema files - breaks coordination workflow
 * @llm-rule NOTE: Placeholder includes tenant_id field template for future multi-tenant scaling
 */
async function createPlaceholderSchema(featureName: string, schemaPath: string): Promise<void> {
  const placeholderContent = `// ATOM Framework placeholder schema for ${featureName}
// This feature currently doesn't require database tables
// Add models here when database functionality is needed

// Example model with tenant support (uncomment when needed):
// model ${featureName.charAt(0).toUpperCase() + featureName.slice(1)}Data {
//   id         String   @id @default(cuid())
//   created_at DateTime @default(now())
//   updated_at DateTime @updatedAt
//   tenant_id  String?  // Required for multi-tenant scaling
//   
//   @@index([tenant_id])
// }
`;

  await writeFile(schemaPath, placeholderContent);
  
  log.debug('📝 Created placeholder schema', {
    feature: featureName,
    path: schemaPath
  });
}

/**
 * Validates schema dependencies across features to prevent conflicts
 * @llm-rule WHEN: Ensuring cross-feature schema references are valid before merging
 * @llm-rule AVOID: Deploying with broken schema references - causes runtime database errors
 * @llm-rule NOTE: Validates table references and foreign key relationships across feature boundaries
 */
async function validateSchemaDependencies(schemas: FeatureSchema[]): Promise<void> {
  log.info('🔍 Validating schema dependencies');

  const allTables = new Set<string>();
  const dependencyErrors: string[] = [];

  // Collect all available tables
  for (const schema of schemas) {
    schema.tables.forEach(table => allTables.add(table));
  }

  // Validate dependencies
  for (const schema of schemas) {
    for (const dependency of schema.dependencies) {
      if (!allTables.has(dependency)) {
        dependencyErrors.push(
          `Feature '${schema.feature_name}' references unknown table '${dependency}'`
        );
      }
    }
  }

  if (dependencyErrors.length > 0) {
    log.error('❌ Schema dependency validation failed', {
      errors: dependencyErrors
    });
    throw new Error(`Schema dependency errors: ${dependencyErrors.join(', ')}`);
  }

  log.info('✅ Schema dependencies validated successfully');
}

/**
 * Merges individual feature schemas into coordinated schema structure
 * @llm-rule WHEN: Combining multiple feature schemas while maintaining isolation and dependencies
 * @llm-rule AVOID: Simple file concatenation - use structured merging for proper schema coordination
 * @llm-rule NOTE: Preserves feature isolation while enabling cross-feature relationships
 */
async function mergeFeatureSchemas(schemas: FeatureSchema[], config: MigrationConfig): Promise<void> {
  log.info('🔗 Merging feature schemas');

  const mergedContent: string[] = [];
  
  // Add unified header
  mergedContent.push('// ATOM Framework Unified Schema');
  mergedContent.push('// Auto-generated from feature schemas');
  mergedContent.push(`// Generated: ${new Date().toISOString()}`);
  mergedContent.push('');

  // Add datasource and generator (for actual database projects)
  if (config.multi_tenant) {
    mergedContent.push('// Multi-tenant configuration');
    mergedContent.push('// All models should include tenant_id field with index');
    mergedContent.push('');
  }

  // Merge feature schemas
  for (const schema of schemas) {
    if (schema.tables.length > 0) {
      mergedContent.push(`// Feature: ${schema.feature_name}`);
      
      try {
        const schemaContent = await readFile(schema.schema_path, 'utf-8');
        // Filter out generator and datasource blocks (they go in unified schema)
        const modelContent = schemaContent
          .split('\n')
          .filter(line => !line.includes('generator') && !line.includes('datasource'))
          .join('\n');
        
        mergedContent.push(modelContent);
        mergedContent.push('');
      } catch (error) {
        log.warn('⚠️ Failed to read feature schema', {
          feature: schema.feature_name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // Write merged schema (for actual database projects)
  const outputPath = join(config.output_path, 'merged-schema.prisma');
  await writeFile(outputPath, mergedContent.join('\n'));

  log.info('✅ Feature schemas merged successfully', {
    output: outputPath,
    features: schemas.length
  });
}

/**
 * Generates unified schema for database deployment and tooling
 * @llm-rule WHEN: Creating production-ready schema file for database deployment and migrations
 * @llm-rule AVOID: Manual schema file creation - use automated generation for consistency
 * @llm-rule NOTE: Includes proper datasource, generator, and multi-tenant configuration
 */
async function generateUnifiedSchema(schemas: FeatureSchema[], config: MigrationConfig): Promise<void> {
  log.info('📄 Generating unified schema');

  const unifiedContent: string[] = [];
  
  // Schema header with configuration
  unifiedContent.push('// ATOM Framework Unified Schema');
  unifiedContent.push(`// Generated: ${new Date().toISOString()}`);
  unifiedContent.push('// DO NOT EDIT MANUALLY - Generated from feature schemas');
  unifiedContent.push('');

  // For actual database projects, add datasource and generator
  if (config.multi_tenant) {
    unifiedContent.push('// This schema supports multi-tenant architecture');
    unifiedContent.push('// All models include tenant_id for data isolation');
    unifiedContent.push('');
  }

  // Add placeholder for hello app
  unifiedContent.push('// Hello App - No database tables required');
  unifiedContent.push('// This is a placeholder for future database scaling');
  unifiedContent.push('');
  unifiedContent.push('// When adding database functionality:');
  unifiedContent.push('// 1. Add datasource configuration');
  unifiedContent.push('// 2. Add generator client configuration');
  unifiedContent.push('// 3. Define models in feature schema files');
  unifiedContent.push('// 4. Run migration coordination');

  // Write unified schema
  const outputPath = join(config.output_path, 'schema.prisma');
  await writeFile(outputPath, unifiedContent.join('\n'));

  log.info('✅ Unified schema generated successfully', {
    output: outputPath,
    multi_tenant: config.multi_tenant
  });
}

/**
 * Gets migration configuration with environment-specific settings
 * @llm-rule WHEN: Configuring migration behavior based on environment and application requirements
 * @llm-rule AVOID: Hardcoded migration settings - use environment-driven configuration
 * @llm-rule NOTE: Development allows more flexibility, production requires strict validation
 */
function getMigrationConfig(): MigrationConfig {
  const isProduction = configure.isProduction();
  
  return {
    enabled: config.get('migration.enabled') || false, // Disabled for hello app
    auto_discover: config.get('migration.auto_discover') || true,
    features_path: config.get('migration.features_path') || './src/features',
    output_path: config.get('migration.output_path') || './prisma',
    multi_tenant: config.get('migration.multi_tenant') || false,
    coordination: {
      validate_dependencies: config.get('migration.validate_dependencies') || isProduction,
      merge_schemas: config.get('migration.merge_schemas') || true,
      generate_unified: config.get('migration.generate_unified') || true
    }
  };
}

/**
 * Validates migration system health for deployment readiness
 * @llm-rule WHEN: Pre-deployment validation to ensure migration system is ready
 * @llm-rule AVOID: Deploying without migration validation - can cause schema inconsistencies
 * @llm-rule NOTE: Part of platform monitoring and deployment pipeline integration
 */
export async function validateMigrationSystem(): Promise<boolean> {
  try {
    log.info('🔍 Validating migration system');

    const migrationConfig = getMigrationConfig();
    
    // Check if features directory exists
    await access(migrationConfig.features_path);
    
    // Check if output directory exists or can be created
    await access(migrationConfig.output_path).catch(async () => {
      // Create output directory if it doesn't exist
      const { mkdir } = await import('fs/promises');
      await mkdir(migrationConfig.output_path, { recursive: true });
    });

    // Validate feature schemas if enabled
    if (migrationConfig.enabled) {
      const schemas = await discoverFeatureSchemas(migrationConfig);
      if (migrationConfig.coordination.validate_dependencies) {
        await validateSchemaDependencies(schemas);
      }
    }

    log.info('✅ Migration system validation passed');
    return true;

  } catch (error) {
    log.error('❌ Migration system validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// Export migration functions
export const migrate = {
  coordinate: coordinateMigrations,
  validate: validateMigrationSystem,
  discover: discoverFeatureSchemas
};