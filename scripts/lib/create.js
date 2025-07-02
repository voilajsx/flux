/**
 * Flux Framework - Feature Creation with Templates
 * @file scripts/lib/create.js
 */

import fs from "fs";
import path from "path";
import {
  logSuccess,
  logError,
  logBox,
  log,
  colors,
  symbols,
  selectFromOptions,
  askYesNo,
  toPascalCase,
  toCamelCase,
  toKebabCase,
  Timer,
} from "./utils.js";
import { showCreateHelp } from "./help.js";

// 🎯 Feature Templates for Backend Development
const FEATURE_TEMPLATES = {
  "api-feature": {
    name: "API Feature",
    description: "CRUD routes + service + database + auth",
    icon: "🔌",
    needsDatabase: true,
    needsAuth: true,
    hasRoutes: true,
    complexity: "Full-stack",
  },
  "service-only": {
    name: "Service Only",
    description: "Background services and utilities",
    icon: "⚙️",
    needsDatabase: false,
    needsAuth: false,
    hasRoutes: false,
    complexity: "Backend-only",
  },
};

/**
 * Main create command handler
 */
export async function runCreate(args) {
  const timer = new Timer();

  // Show help if requested
  if (args.includes("--help") || args.includes("-h")) {
    showCreateHelp();
    return;
  }

  const featureName = args[0];

  if (!featureName) {
    logError("Please provide a feature name:");
    log(`${colors.cyan}npm run flux:create my-feature${colors.reset}`, "white");
    return;
  }

  try {
    console.clear();

    logBox(`${symbols.magic} Creating Feature: ${featureName}`, [
      `${symbols.sparkles} Smart templates with TypeScript`,
      `${symbols.lightning} LLM-optimized patterns and contracts`,
      `${symbols.security} AppKit authentication integration`,
    ]);

    // Step 1: Select feature template
    const templateKey = await selectFeatureTemplate();
    const template = FEATURE_TEMPLATES[templateKey];

    // Step 2: Configure options
    let enableAuth = template.needsAuth;
    let enableDatabase = template.needsDatabase;

    if (template.needsAuth) {
      console.clear();
      logBox(`${symbols.security} Authentication Setup`, [
        `${template.name} features typically need authentication`,
        "Uses AppKit for enterprise-grade security",
      ]);
      enableAuth = await askYesNo("Enable AppKit authentication?", true);
    }

    if (template.needsDatabase) {
      console.clear();
      logBox(`${symbols.target} Database Integration`, [
        `${template.name} features typically need database access`,
        "Configured through platform services",
      ]);
      enableDatabase = await askYesNo("Enable database access?", true);
    }

    // Step 3: Validate feature name
    const kebabName = toKebabCase(featureName);
    const pascalName = toPascalCase(featureName);

    if (kebabName !== featureName.toLowerCase()) {
      log(
        `Feature name converted to: ${colors.cyan}${kebabName}${colors.reset}`,
        "white",
      );
    }

    // Generate the feature
    console.clear();
    logBox(`${symbols.lightning} Generating Feature`, [
      "Creating files with Flux patterns...",
      "This will take just a moment",
    ]);

    const options = {
      enableAuth,
      enableDatabase,
      hasRoutes: template.hasRoutes,
    };

    const result = await generateFeatureFiles(
      kebabName,
      pascalName,
      templateKey,
      options,
    );

    // Success output
    console.clear();
    timer.endWithMessage(`${symbols.rocket} Feature created successfully!`);

    logBox(
      `${symbols.check} ${kebabName} is Ready!`,
      [
        `${symbols.sparkles} ${result.files.length} files generated`,
        `${symbols.fire} Zero configuration needed`,
        `${symbols.lightning} Contract-driven architecture`,
        `${symbols.security} ${enableAuth ? "AppKit auth enabled" : "No auth required"}`,
      ],
      "green",
    );

    logSuccess(
      `Feature created: ${colors.cyan}src/features/${kebabName}/${colors.reset}`,
    );
    console.log();

    log(`${colors.bright}Generated files:${colors.reset}`, "white");
    result.files.forEach((file) => {
      log(`  ${symbols.check} ${colors.gray}${file}${colors.reset}`, "white");
    });
    console.log();

    logBox(
      "Next Steps",
      [
        "1. Run npm run flux:dev to start development",
        "2. Customize the generated business logic",
        "3. Add your database models and validation",
        "4. Test with npm run flux:check",
        "5. Deploy with npm run flux:build",
      ],
      "blue",
    );

    log(
      `${symbols.flux} ${colors.bright}Happy coding with Flux!${colors.reset}`,
      "white",
    );
  } catch (error) {
    console.clear();
    logError(`Feature creation failed: ${error.message}`);

    if (process.env.DEBUG) {
      console.error("Full error:", error);
    }

    process.exit(1);
  }
}

/**
 * Interactive template selection
 */
async function selectFeatureTemplate() {
  logBox(`${symbols.target} Choose Feature Template`, [
    "Select the template that best matches your needs",
    "Each template includes optimized patterns and contracts",
  ]);

  const options = Object.entries(FEATURE_TEMPLATES).map(([key, template]) => ({
    key,
    text: `${template.icon} ${template.name.padEnd(15)} ${colors.gray}${
      template.description
    } (${template.complexity})${colors.reset}`,
  }));

  const selected = await selectFromOptions(options);
  return selected.key;
}

/**
 * Generate feature files based on template and options
 */
async function generateFeatureFiles(
  kebabName,
  pascalName,
  templateKey,
  options,
) {
  const template = FEATURE_TEMPLATES[templateKey];
  const featureDir = path.join(process.cwd(), "src", "features", kebabName);

  if (fs.existsSync(featureDir)) {
    throw new Error(`Feature ${kebabName} already exists`);
  }

  // Create directories
  fs.mkdirSync(featureDir, { recursive: true });

  // Always create these directories
  fs.mkdirSync(path.join(featureDir, "services"), { recursive: true });
  fs.mkdirSync(path.join(featureDir, "types"), { recursive: true });

  // Create routes directory if needed
  if (options.hasRoutes) {
    fs.mkdirSync(path.join(featureDir, "routes"), { recursive: true });
  }

  // Create models directory if database is enabled
  if (options.enableDatabase) {
    fs.mkdirSync(path.join(featureDir, "models"), { recursive: true });
  }

  // Generate files based on template
  const files = {};

  // Always generate these files
  files["index.ts"] = generateIndexFile(
    kebabName,
    pascalName,
    template,
    options,
  );
  files["types/index.ts"] = generateTypesFile(kebabName, pascalName, options);
  files["services/index.ts"] = generateServiceFile(
    kebabName,
    pascalName,
    options,
  );

  // Template-specific files
  if (templateKey === "api-feature") {
    files["routes/index.ts"] = generateAPIRoutes(
      kebabName,
      pascalName,
      options,
    );
    if (options.enableDatabase) {
      files["models/index.ts"] = generateModelFile(
        kebabName,
        pascalName,
        options,
      );
    }
  } else if (templateKey === "service-only") {
    files["services/worker.ts"] = generateWorkerService(
      kebabName,
      pascalName,
      options,
    );
  }

  // Write all files
  const fileList = [];
  Object.entries(files).forEach(([filename, content]) => {
    const filePath = path.join(featureDir, filename);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf8");
    fileList.push(`src/features/${kebabName}/${filename}`);
  });

  return { featureDir, files: fileList };
}

/**
 * Generate feature index file with contract
 */
function generateIndexFile(kebabName, pascalName, template, options) {
  const contractBuilder = [
    options.hasRoutes ? `.providesRoute('GET /${kebabName}')` : "",
    options.hasRoutes ? `.providesRoute('POST /${kebabName}')` : "",
    options.hasRoutes ? `.providesRoute('PUT /${kebabName}/:id')` : "",
    options.hasRoutes ? `.providesRoute('DELETE /${kebabName}/:id')` : "",
    `.providesService('${kebabName}Service')`,
    options.enableDatabase ? ".needsDatabase()" : "",
    options.enableAuth ? ".needsAuth()" : "",
    ".needsLogging()",
  ]
    .filter(Boolean)
    .join("\n    ");

  const routesConfig = options.hasRoutes
    ? `
  routes: [
    {
      file: 'routes/index.ts',
      prefix: '/api/${kebabName}'
    }
  ],`
    : "";

  return `/**
 * ${pascalName} Feature Configuration
 * @description ${template.description}
 * @module @voilajsx/flux/features/${kebabName}
 * @file src/features/${kebabName}/index.ts
 */

import { createBackendContract } from '../../../contracts.js';
import type { FeatureConfig } from '../../../flux.js';

const ${toCamelCase(kebabName)}Feature: FeatureConfig = {
  name: '${kebabName}',
  
  contract: createBackendContract()
    ${contractBuilder}
    .build(),
${routesConfig}

  meta: {
    name: '${pascalName} Service',
    description: '${template.description}',
    version: '1.0.0',
    author: 'Flux Framework'
  }
};

export default ${toCamelCase(kebabName)}Feature;`;
}

/**
 * Generate TypeScript types file
 */
function generateTypesFile(kebabName, pascalName, options) {
  return `/**
 * ${pascalName} Feature - Type Definitions
 * @file src/features/${kebabName}/types/index.ts
 */

// Main entity interface
export interface ${pascalName}Item {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  ${options.enableAuth ? "createdBy: string;" : ""}
}

// Request/Response types
export interface Create${pascalName}Request {
  name: string;
  ${options.enableAuth ? "// Authentication handled automatically" : ""}
}

export interface Update${pascalName}Request {
  name?: string;
}

export interface ${pascalName}Response {
  success: boolean;
  data?: ${pascalName}Item | ${pascalName}Item[];
  error?: string;
  message?: string;
}

// Service interface
export interface ${pascalName}Service {
  getAll(): Promise<${pascalName}Response>;
  getById(id: string): Promise<${pascalName}Response>;
  create(data: Create${pascalName}Request${options.enableAuth ? ", userId: string" : ""}): Promise<${pascalName}Response>;
  update(id: string, data: Update${pascalName}Request): Promise<${pascalName}Response>;
  delete(id: string): Promise<${pascalName}Response>;
}`;
}

/**
 * Generate service file
 */
function generateServiceFile(kebabName, pascalName, options) {
  const imports = [
    `import type { ${pascalName}Service, ${pascalName}Item, Create${pascalName}Request, Update${pascalName}Request, ${pascalName}Response } from '../types/index.js';`,
    "import { logger } from '@voilajsx/appkit/logging';",
  ]
    .filter(Boolean)
    .join("\n");

  return `/**
 * ${pascalName} Feature - Service Implementation
 * @file src/features/${kebabName}/services/index.ts
 */

${imports}

class ${pascalName}ServiceImpl implements ${pascalName}Service {
  private readonly log = logger.get('${kebabName}-service');

  async getAll(): Promise<${pascalName}Response> {
    try {
      this.log.info('Fetching all ${kebabName} items');
      
      // TODO: Implement database query
      const items: ${pascalName}Item[] = [];
      
      return {
        success: true,
        data: items,
        message: 'Items retrieved successfully'
      };
    } catch (error: any) {
      this.log.error('Failed to fetch items', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getById(id: string): Promise<${pascalName}Response> {
    try {
      this.log.info('Fetching ${kebabName} item by ID', { id });
      
      // TODO: Implement database query
      const item: ${pascalName}Item | null = null;
      
      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        };
      }
      
      return {
        success: true,
        data: item,
        message: 'Item retrieved successfully'
      };
    } catch (error: any) {
      this.log.error('Failed to fetch item', { id, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  async create(data: Create${pascalName}Request${options.enableAuth ? ", userId: string" : ""}): Promise<${pascalName}Response> {
    try {
      this.log.info('Creating new ${kebabName} item', { data${options.enableAuth ? ", userId" : ""} });
      
      // TODO: Implement database insert
      const newItem: ${pascalName}Item = {
        id: \`\${Date.now()}\`, // Replace with proper ID generation
        name: data.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        ${options.enableAuth ? "createdBy: userId," : ""}
      };
      
      return {
        success: true,
        data: newItem,
        message: 'Item created successfully'
      };
    } catch (error: any) {
      this.log.error('Failed to create item', { data, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  async update(id: string, data: Update${pascalName}Request): Promise<${pascalName}Response> {
    try {
      this.log.info('Updating ${kebabName} item', { id, data });
      
      // TODO: Implement database update
      const updatedItem: ${pascalName}Item | null = null;
      
      if (!updatedItem) {
        return {
          success: false,
          error: 'Item not found'
        };
      }
      
      return {
        success: true,
        data: updatedItem,
        message: 'Item updated successfully'
      };
    } catch (error: any) {
      this.log.error('Failed to update item', { id, data, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  async delete(id: string): Promise<${pascalName}Response> {
    try {
      this.log.info('Deleting ${kebabName} item', { id });
      
      // TODO: Implement database delete
      const deleted = false; // Replace with actual deletion logic
      
      if (!deleted) {
        return {
          success: false,
          error: 'Item not found or could not be deleted'
        };
      }
      
      return {
        success: true,
        message: 'Item deleted successfully'
      };
    } catch (error: any) {
      this.log.error('Failed to delete item', { id, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const ${toCamelCase(kebabName)}Service = new ${pascalName}ServiceImpl();`;
}

/**
 * Generate API routes file
 */
function generateAPIRoutes(kebabName, pascalName, options) {
  const authImport = options.enableAuth
    ? "\nimport { authenticator } from '@voilajsx/appkit/auth';"
    : "";
  const authSetup = options.enableAuth
    ? "\n  const auth = authenticator.get();"
    : "";
  const userExtraction = options.enableAuth
    ? "\n    const user = auth.user(request);\n    if (!user) {\n      return reply.code(401).send({ success: false, error: 'Authentication required' });\n    }\n"
    : "";

  return `/**
 * ${pascalName} Feature - API Routes
 * @file src/features/${kebabName}/routes/index.ts
 */

import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';
import { logger } from '@voilajsx/appkit/logging';${authImport}
import { ${toCamelCase(kebabName)}Service } from '../services/index.js';
import type { Create${pascalName}Request, Update${pascalName}Request } from '../types/index.js';

/**
 * Request type definitions
 */
interface Get${pascalName}Params {
  id: string;
}

/**
 * Main route registration function
 */
const ${toCamelCase(kebabName)}Routes: FastifyPluginCallback = async (fastify: FastifyInstance, options) => {
  const log = logger.get('${kebabName}-routes');${authSetup}

  /**
   * Get all ${kebabName} items
   * GET /api/${kebabName}
   */
  fastify.get('/', {${options.enableAuth ? "\n    preHandler: auth.requireLogin()" : ""}
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    log.info('GET /${kebabName} - Fetching all items');${userExtraction}
    
    const result = await ${toCamelCase(kebabName)}Service.getAll();
    return reply.code(result.success ? 200 : 500).send(result);
  });

  /**
   * Get ${kebabName} item by ID
   * GET /api/${kebabName}/:id
   */
  fastify.get<{ Params: Get${pascalName}Params }>('/:id', {${options.enableAuth ? "\n    preHandler: auth.requireLogin()" : ""}
  }, async (request, reply) => {
    const { id } = request.params;
    log.info('GET /${kebabName}/:id - Fetching item', { id });${userExtraction}
    
    const result = await ${toCamelCase(kebabName)}Service.getById(id);
    return reply.code(result.success ? 200 : 404).send(result);
  });

  /**
   * Create new ${kebabName} item
   * POST /api/${kebabName}
   */
  fastify.post<{ Body: Create${pascalName}Request }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 }
        }
      }
    }${options.enableAuth ? ",\n    preHandler: auth.requireLogin()" : ""}
  }, async (request, reply) => {
    const data = request.body;
    log.info('POST /${kebabName} - Creating item', { data });${userExtraction}
    
    const result = await ${toCamelCase(kebabName)}Service.create(data${options.enableAuth ? ", user.userId" : ""});
    return reply.code(result.success ? 201 : 400).send(result);
  });

  /**
   * Update ${kebabName} item
   * PUT /api/${kebabName}/:id
   */
  fastify.put<{ Params: Get${pascalName}Params; Body: Update${pascalName}Request }>('/:id', {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 }
        }
      }
    }${options.enableAuth ? ",\n    preHandler: auth.requireLogin()" : ""}
  }, async (request, reply) => {
    const { id } = request.params;
    const data = request.body;
    log.info('PUT /${kebabName}/:id - Updating item', { id, data });${userExtraction}
    
    const result = await ${toCamelCase(kebabName)}Service.update(id, data);
    return reply.code(result.success ? 200 : 400).send(result);
  });

  /**
   * Delete ${kebabName} item
   * DELETE /api/${kebabName}/:id
   */
  fastify.delete<{ Params: Get${pascalName}Params }>('/:id', {${options.enableAuth ? "\n    preHandler: auth.requireLogin()" : ""}
  }, async (request, reply) => {
    const { id } = request.params;
    log.info('DELETE /${kebabName}/:id - Deleting item', { id });${userExtraction}
    
    const result = await ${toCamelCase(kebabName)}Service.delete(id);
    return reply.code(result.success ? 200 : 400).send(result);
  });

  log.info('✅ ${pascalName} routes registered successfully', {
    prefix: '/api/${kebabName}',
    routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id'],
    authEnabled: ${options.enableAuth}
  });
};

export default ${toCamelCase(kebabName)}Routes;`;
}

/**
 * Generate database model file
 */
function generateModelFile(kebabName, pascalName, options) {
  return `/**
 * ${pascalName} Feature - Database Model
 * @file src/features/${kebabName}/models/index.ts
 */

import type { ${pascalName}Item } from '../types/index.js';

/**
 * Database model for ${pascalName}
 * TODO: Replace with your preferred database/ORM
 */
export class ${pascalName}Model {
  
  /**
   * Find all ${kebabName} items
   */
  static async findAll(): Promise<${pascalName}Item[]> {
    // TODO: Implement database query
    // Example with Prisma: return prisma.${kebabName}.findMany();
    // Example with MongoDB: return db.collection('${kebabName}').find().toArray();
    throw new Error('Database integration not implemented');
  }

  /**
   * Find ${kebabName} item by ID
   */
  static async findById(id: string): Promise<${pascalName}Item | null> {
    // TODO: Implement database query
    // Example with Prisma: return prisma.${kebabName}.findUnique({ where: { id } });
    // Example with MongoDB: return db.collection('${kebabName}').findOne({ _id: id });
    throw new Error('Database integration not implemented');
  }

  /**
   * Create new ${kebabName} item
   */
  static async create(data: Omit<${pascalName}Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<${pascalName}Item> {
    // TODO: Implement database insert
    // Example with Prisma: return prisma.${kebabName}.create({ data });
    // Example with MongoDB: const result = await db.collection('${kebabName}').insertOne(data);
    throw new Error('Database integration not implemented');
  }

  /**
   * Update ${kebabName} item
   */
  static async update(id: string, data: Partial<${pascalName}Item>): Promise<${pascalName}Item | null> {
    // TODO: Implement database update
    // Example with Prisma: return prisma.${kebabName}.update({ where: { id }, data });
    // Example with MongoDB: await db.collection('${kebabName}').updateOne({ _id: id }, { $set: data });
    throw new Error('Database integration not implemented');
  }

  /**
   * Delete ${kebabName} item
   */
  static async delete(id: string): Promise<boolean> {
    // TODO: Implement database delete
    // Example with Prisma: await prisma.${kebabName}.delete({ where: { id } }); return true;
    // Example with MongoDB: const result = await db.collection('${kebabName}').deleteOne({ _id: id });
    throw new Error('Database integration not implemented');
  }
}`;
}

/**
 * Generate worker service for service-only template
 */
function generateWorkerService(kebabName, pascalName, options) {
  return `/**
 * ${pascalName} Feature - Background Worker Service
 * @file src/features/${kebabName}/services/worker.ts
 */

import { logger } from '@voilajsx/appkit/logging';

/**
 * Background worker for ${kebabName} processing
 */
export class ${pascalName}Worker {
  private readonly log = logger.get('${kebabName}-worker');
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  /**
   * Start the background worker
   */
  start(intervalMs: number = 30000): void {
    if (this.isRunning) {
      this.log.warn('Worker already running');
      return;
    }

    this.log.info('Starting ${kebabName} worker', { intervalMs });
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      try {
        await this.processWork();
      } catch (error: any) {
        this.log.error('Worker processing failed', { error: error.message });
      }
    }, intervalMs);
  }

  /**
   * Stop the background worker
   */
  stop(): void {
    if (!this.isRunning) {
      this.log.warn('Worker not running');
      return;
    }

    this.log.info('Stopping ${kebabName} worker');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Process work items
   */
  private async processWork(): Promise<void> {
    this.log.debug('Processing ${kebabName} work');

    // TODO: Implement your background processing logic
    // Examples:
    // - Send queued emails
    // - Process uploaded files
    // - Clean up temporary data
    // - Sync with external APIs
    // - Generate reports

    this.log.debug('${kebabName} work processing completed');
  }

  /**
   * Get worker status
   */
  getStatus(): { running: boolean; uptime?: number } {
    return {
      running: this.isRunning,
      uptime: this.isRunning ? Date.now() : undefined
    };
  }
}

// Export singleton instance
export const ${kebabName}Worker = new ${pascalName}Worker();`;
}
