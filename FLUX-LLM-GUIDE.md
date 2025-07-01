# Flux Framework - Complete LLM Development Guide v1.0

## ⚡ Framework Philosophy & Core Principles

### The Flux Way: Contract-Driven Backend Architecture

Flux Framework is built on a revolutionary principle: **backend features should be completely independent, contract-driven modules that can be developed, tested, and deployed in isolation while maintaining perfect integration through explicit contracts**.

#### Core Philosophy

1. **Contract-First Development**: Every feature declares what it provides and consumes
2. **Platform Service Integration**: Leverage AppKit for authentication, logging, and utilities
3. **Zero Coupling**: Features never directly import from each other
4. **LLM-Optimized**: Predictable patterns enable 10x faster AI-assisted development
5. **TypeScript by Design**: Full type safety and enterprise-grade reliability

---

## 🎯 The Flux Mental Model

### Think in Backend Features, Not Monoliths

```
Traditional Backend:           Flux Approach:
├── controllers/              ├── src/features/
├── services/                 │   ├── user-management/
├── models/                   │   │   ├── index.ts (contract)
├── routes/                   │   │   ├── routes/
├── middleware/               │   │   ├── services/
└── utils/                    │   │   ├── models/
                              │   │   └── types/
                              │   └── order-processing/
                              │       ├── index.ts (contract)
                              │       ├── routes/
                              │       ├── services/
                              │       └── types/
                              └── flux.ts (main entry)
```

### Feature Lifecycle

1. **Define Contract** → What does this feature provide/consume?
2. **Choose Template** → API_FEATURE or SERVICE_ONLY?
3. **Build in Isolation** → No external dependencies except platform
4. **Auto-Integration** → Flux handles routing, services, discovery

---

## 🏗️ Architecture Deep Dive

### The Contract System (Heart of Flux)

Every feature MUST have a contract that declares:

- **Provides**: What this feature offers to others (routes, services, models)
- **Needs**: What this feature requires from platform or other features

```typescript
// ✅ CORRECT: Feature declares its interface
contract: createBackendContract()
  .providesRoute('GET /users') // I offer REST endpoints
  .providesRoute('POST /users') // I offer user creation
  .providesService('userService') // I offer user management service
  .needsDatabase() // I need database access
  .needsAuth() // I need authentication
  .needsLogging() // I need logging
  .build();
```

### Platform Services (AppKit Integration)

Flux integrates seamlessly with VoilaJSX AppKit for enterprise features:

```typescript
// Platform services automatically available:
.needsDatabase()     // Database access and ORM
.needsAuth()         // JWT authentication with roles
.needsLogging()      // Structured logging
.needsConfig()       // Environment configuration
.needsSecurity()     // Input validation and sanitization
.needsValidation()   // Schema validation
.needsRedis()        // Caching and sessions
```

---

## 📋 LLM Decision Framework

### 1. Feature Type Detection

```
What type of backend feature am I building?

├── API FEATURE (90% of features)
│   ├── template: API_FEATURE
│   ├── includes: CRUD routes + service + database + auth
│   └── examples: User management, Blog posts, Order processing
│
└── SERVICE FEATURE (10% of features)
    ├── template: SERVICE_ONLY
    ├── includes: Background services + utilities
    └── examples: Email sender, File processor, Cron jobs
```

### 2. Template Decision Tree

```
Does the feature need HTTP endpoints?
├── YES → API_FEATURE template
│   ├── Generates: routes/ + services/ + models/ + types/
│   ├── Includes: Full CRUD operations with authentication
│   └── Contract: providesRoute() + providesService() + needsAuth()
│
└── NO → SERVICE_ONLY template
    ├── Generates: services/ + types/ (no routes/)
    ├── Includes: Background workers and utilities
    └── Contract: providesService() + needsLogging()
```

### 3. Authentication Decision

```
Does the feature need authentication?
├── YES (recommended for most API features)
│   └── contract: .needsAuth() + AppKit middleware
│
└── NO (only for public APIs or internal services)
    └── contract: No auth requirements
```

---

## 🔧 Complete Feature Templates

### Template 1: API_FEATURE (CRUD Operations)

```typescript
/**
 * Full-stack API feature with authentication and database
 * Use for: User management, content management, order processing
 */
import { createBackendContract } from '../../../contracts.js';
import type { FeatureConfig } from '../../../flux.js';

const userManagementFeature: FeatureConfig = {
  name: 'user-management',

  // ✅ Contract: Declares what this feature provides and needs
  contract: createBackendContract()
    .providesRoute('GET /users')
    .providesRoute('POST /users')
    .providesRoute('PUT /users/:id')
    .providesRoute('DELETE /users/:id')
    .providesService('userService')
    .needsDatabase()
    .needsAuth()
    .needsLogging()
    .build(),

  routes: [
    {
      file: 'routes/index.ts',
      prefix: '/api/users',
    },
  ],

  meta: {
    name: 'User Management Service',
    description: 'CRUD routes + service + database + auth',
    version: '1.0.0',
    author: 'Flux Framework',
  },
};

export default userManagementFeature;
```

### Template 2: SERVICE_ONLY (Background Services)

```typescript
/**
 * Background service without HTTP endpoints
 * Use for: Email sending, file processing, scheduled tasks
 */
const emailServiceFeature: FeatureConfig = {
  name: 'email-service',

  // ✅ Contract: Service-only, no routes
  contract: createBackendContract()
    .providesService('emailService')
    .needsConfig()
    .needsLogging()
    .build(),

  // ✅ No routes - service only
  routes: [],

  meta: {
    name: 'Email Service',
    description: 'Background services and utilities',
    version: '1.0.0',
    author: 'Flux Framework',
  },
};

export default emailServiceFeature;
```

---

## 🎨 Service Patterns (The Flux Way)

### Pattern 1: API Service with AppKit Integration

```typescript
/**
 * Standard Flux service with AppKit integration
 * Always follows this pattern for consistency
 */
import type {
  UserService,
  UserItem,
  CreateUserRequest,
  UserResponse,
} from '../types/index.js';
import { logger } from '@voilajsx/appkit/logging';

class UserServiceImpl implements UserService {
  private readonly log = logger.get('user-service');

  async getAll(): Promise<UserResponse> {
    try {
      this.log.info('Fetching all users');

      // TODO: Implement database query
      const users: UserItem[] = [];

      return {
        success: true,
        data: users,
        message: 'Users retrieved successfully',
      };
    } catch (error: any) {
      this.log.error('Failed to fetch users', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async create(data: CreateUserRequest, userId: string): Promise<UserResponse> {
    try {
      this.log.info('Creating new user', { data, createdBy: userId });

      // TODO: Implement database insert
      const newUser: UserItem = {
        id: `${Date.now()}`, // Replace with proper ID generation
        name: data.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      };

      return {
        success: true,
        data: newUser,
        message: 'User created successfully',
      };
    } catch (error: any) {
      this.log.error('Failed to create user', { data, error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ✅ Export singleton instance
export const userService = new UserServiceImpl();
```

### Pattern 2: Background Worker Service

```typescript
/**
 * Background worker for processing tasks
 * Use for: Email queues, file processing, cleanup tasks
 */
import { logger } from '@voilajsx/appkit/logging';

export class EmailWorker {
  private readonly log = logger.get('email-worker');
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  start(intervalMs: number = 30000): void {
    if (this.isRunning) {
      this.log.warn('Worker already running');
      return;
    }

    this.log.info('Starting email worker', { intervalMs });
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      try {
        await this.processEmails();
      } catch (error: any) {
        this.log.error('Worker processing failed', { error: error.message });
      }
    }, intervalMs);
  }

  private async processEmails(): Promise<void> {
    this.log.debug('Processing email queue');

    // TODO: Implement email processing logic
    // - Fetch queued emails from database
    // - Send emails via provider (SendGrid, etc.)
    // - Update email status

    this.log.debug('Email processing completed');
  }
}

export const emailWorker = new EmailWorker();
```

---

## 📄 Route Patterns (AppKit Authentication)

### Standard Route Structure with Authentication

```typescript
/**
 * Standard Flux route with AppKit authentication
 * Always follows this structure for consistency
 */
import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  FastifyPluginCallback,
} from 'fastify';
import { logger } from '@voilajsx/appkit/logging';
import { authenticator } from '@voilajsx/appkit/auth';
import { userService } from '../services/index.js';
import type { CreateUserRequest, UpdateUserRequest } from '../types/index.js';

const userRoutes: FastifyPluginCallback = async (
  fastify: FastifyInstance,
  options
) => {
  const log = logger.get('user-routes');
  const auth = authenticator.get();

  /**
   * Get all users (authenticated)
   * GET /api/users
   */
  fastify.get(
    '/',
    {
      preHandler: auth.requireLogin(),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      log.info('GET /users - Fetching all users');

      const user = auth.user(request);
      if (!user) {
        return reply
          .code(401)
          .send({ success: false, error: 'Authentication required' });
      }

      const result = await userService.getAll();
      return reply.code(result.success ? 200 : 500).send(result);
    }
  );

  /**
   * Create new user (authenticated + validation)
   * POST /api/users
   */
  fastify.post<{ Body: CreateUserRequest }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            email: { type: 'string', format: 'email' },
          },
        },
      },
      preHandler: auth.requireLogin(),
    },
    async (request, reply) => {
      const data = request.body;
      log.info('POST /users - Creating user', { data });

      const user = auth.user(request);
      if (!user) {
        return reply
          .code(401)
          .send({ success: false, error: 'Authentication required' });
      }

      const result = await userService.create(data, user.userId);
      return reply.code(result.success ? 201 : 400).send(result);
    }
  );

  /**
   * Admin-only route (role-based authentication)
   * DELETE /api/users/:id
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [auth.requireLogin(), auth.requireRole('admin')],
    },
    async (request, reply) => {
      const { id } = request.params;
      log.info('DELETE /users/:id - Deleting user', { id });

      const result = await userService.delete(id);
      return reply.code(result.success ? 200 : 400).send(result);
    }
  );

  log.info('✅ User routes registered successfully', {
    prefix: '/api/users',
    routes: ['GET /', 'POST /', 'DELETE /:id'],
    authEnabled: true,
  });
};

export default userRoutes;
```

---

## 🎯 Critical LLM Rules (ALWAYS Follow)

### Rule 1: ALWAYS Use Proper Imports

```typescript
// ✅ CORRECT - Flux Framework imports
import { createBackendContract } from '../../../contracts.js';
import type { FeatureConfig } from '../../../flux.js';

// ✅ CORRECT - AppKit imports
import { logger } from '@voilajsx/appkit/logging';
import { authenticator } from '@voilajsx/appkit/auth';

// ✅ CORRECT - Fastify imports
import type { FastifyInstance, FastifyPluginCallback } from 'fastify';

// ❌ WRONG - Never import between features
import { otherService } from '../other-feature/services/index.js';
```

### Rule 2: ALWAYS Include Feature Contract

```typescript
// ✅ CORRECT - Every feature needs a contract
contract: createBackendContract()
  .providesRoute('GET /api/resource')
  .providesService('resourceService')
  .needsDatabase()
  .needsAuth()
  .build(),

// ❌ WRONG - Missing contract
// contract: undefined
```

### Rule 3: ALWAYS Use AppKit for Authentication

```typescript
// ✅ CORRECT - AppKit authentication
import { authenticator } from '@voilajsx/appkit/auth';
const auth = authenticator.get();

fastify.get(
  '/protected',
  {
    preHandler: auth.requireLogin(),
  },
  handler
);

// ❌ WRONG - Custom auth implementation
// Don't reinvent authentication
```

### Rule 4: ALWAYS Use Standard Response Format

```typescript
// ✅ CORRECT - Standard response format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ✅ CORRECT - Service response
return {
  success: true,
  data: user,
  message: 'User created successfully',
};

// ❌ WRONG - Inconsistent responses
return { user }; // Missing success flag
```

### Rule 5: ALWAYS Follow File Structure

```
src/features/feature-name/
├── index.ts              // ✅ Feature config with contract
├── routes/               // ✅ API endpoints (if needed)
│   └── index.ts
├── services/             // ✅ Business logic
│   └── index.ts
├── models/               // ✅ Database models (if needed)
│   └── index.ts
└── types/                // ✅ TypeScript types
    └── index.ts
```

---

## 🔧 TypeScript Type Patterns

### Standard Type Definitions

```typescript
/**
 * Standard Flux type patterns for consistency
 */

// Main entity interface
export interface UserItem {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // If authentication enabled
}

// Request types
export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

// Response type
export interface UserResponse {
  success: boolean;
  data?: UserItem | UserItem[];
  error?: string;
  message?: string;
}

// Service interface
export interface UserService {
  getAll(): Promise<UserResponse>;
  getById(id: string): Promise<UserResponse>;
  create(data: CreateUserRequest, userId: string): Promise<UserResponse>;
  update(id: string, data: UpdateUserRequest): Promise<UserResponse>;
  delete(id: string): Promise<UserResponse>;
}
```

---

## 🚀 Common Feature Scenarios

### Scenario 1: User Management System

```typescript
// Decision: API_FEATURE template
// Reasoning: Needs CRUD operations with authentication

const config: FeatureConfig = {
  name: 'user-management',

  contract: createBackendContract()
    .providesRoute('GET /users')
    .providesRoute('POST /users')
    .providesRoute('PUT /users/:id')
    .providesRoute('DELETE /users/:id')
    .providesService('userService')
    .needsDatabase()
    .needsAuth()
    .needsLogging()
    .build(),

  routes: [
    {
      file: 'routes/index.ts',
      prefix: '/api/users',
    },
  ],
};
```

### Scenario 2: Email Notification Service

```typescript
// Decision: SERVICE_ONLY template
// Reasoning: Background processing, no HTTP endpoints

const config: FeatureConfig = {
  name: 'email-service',

  contract: createBackendContract()
    .providesService('emailService')
    .needsConfig()
    .needsLogging()
    .build(),

  routes: [], // No HTTP endpoints

  meta: {
    name: 'Email Notification Service',
    description: 'Background email processing and notifications',
  },
};
```

### Scenario 3: Blog Management with Admin

```typescript
// Decision: API_FEATURE with role-based auth
// Reasoning: Public reading, authenticated writing, admin management

const config: FeatureConfig = {
  name: 'blog-management',

  contract: createBackendContract()
    .providesRoute('GET /posts') // Public reading
    .providesRoute('POST /posts') // Authenticated writing
    .providesRoute('PUT /posts/:id') // Author or admin editing
    .providesRoute('DELETE /posts/:id') // Admin deletion
    .providesService('blogService')
    .needsDatabase()
    .needsAuth()
    .needsLogging()
    .build(),

  routes: [
    {
      file: 'routes/index.ts',
      prefix: '/api/blog',
    },
  ],
};
```

---

## 🧪 Testing Your Features

### Contract Validation

```bash
# Flux automatically validates contracts
npm run flux:contracts

# Check console for validation:
# ❌ "Service 'userAuth' is consumed but not provided by any feature"
# ✅ "All contracts valid"
```

### Quality Checks

```bash
# Run all quality checks
npm run flux:check

# Individual checks
npm run flux:contracts    # Contract validation only
npm run flux:format      # Code formatting only
npx tsc --noEmit         # TypeScript compilation
```

### Development Workflow

```bash
# Start development server
npm run flux:dev

# Create new feature
npm run flux:create payment-processing

# Build for production
npm run flux:build

# Run production build
npm start
```

---

## 💡 LLM Success Patterns

### Pattern 1: Start with Feature Type

```typescript
// Always begin with template selection
User asks: "I need user management"
→ LLM thinks: "CRUD operations needed"
→ Choose: API_FEATURE template
→ Generate: Full CRUD with auth
```

### Pattern 2: Contract First

```typescript
// Always design contract before implementation
contract: createBackendContract()
  .provides??? // What does this feature offer?
  .needs???    // What does this feature require?
  .build()
```

### Pattern 3: Use Platform Services

```typescript
// Always leverage AppKit instead of custom solutions
.needsAuth()      // Use AppKit authentication
.needsLogging()   // Use AppKit logging
.needsDatabase()  // Use AppKit database integration
```

### Pattern 4: Standard File Generation

```typescript
// Always create this exact structure
npm run flux:create feature-name
→ Generates: index.ts + routes/ + services/ + types/
→ All with proper contracts and AppKit integration
```

---

## 🎯 Final LLM Checklist

Before completing any Flux feature, verify:

- [ ] ✅ Feature has a valid contract with proper provides/needs
- [ ] ✅ Template is chosen correctly (API_FEATURE vs SERVICE_ONLY)
- [ ] ✅ All imports use correct Flux/AppKit paths
- [ ] ✅ Authentication uses AppKit (never custom auth)
- [ ] ✅ File structure follows Flux conventions
- [ ] ✅ Services follow standard response format
- [ ] ✅ Routes include proper validation schemas
- [ ] ✅ TypeScript types are defined consistently
- [ ] ✅ Error handling is implemented everywhere
- [ ] ✅ Logging uses AppKit logger

---

## ⚡ The Flux Advantage

By following these patterns, you get:

1. **10x Faster Development** - Predictable patterns mean AI can generate perfect code
2. **Zero Integration Issues** - Contracts prevent breaking changes
3. **Enterprise Security** - AppKit provides production-grade authentication
4. **Perfect Scalability** - Features remain isolated as your service grows
5. **Team Harmony** - Everyone follows the same backend patterns

**Remember: Flux isn't just a framework, it's a philosophy of building truly modular backend services that scale infinitely while maintaining perfect isolation and integration through explicit contracts.**

---

## 🚀 Quick Start Commands

```bash
# Create your first Flux feature
npm run flux:create user-auth

# Start development
npm run flux:dev

# Validate everything
npm run flux:check

# Build for production
npm run flux:build
```

**Happy coding with Flux Framework! ⚡**
