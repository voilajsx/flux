# Flux Framework - Complete LLM Development Guide

## 💡 Ideology and Core Philosophy

The Flux Framework is a contract-driven TypeScript backend framework built on AppKit, designed for modern, scalable, and AI-assisted backend development. Its core philosophy is built on a revolutionary principle: **backend features should be completely independent, contract-driven modules that communicate only through services, with precise validation ensuring architectural integrity**.

This philosophy revolves around these core tenants:

1.  **Enhanced Contract-First Development**: Features declare provides/internal/imports/needs with precise validation. This explicit contract system ensures clear interfaces, prevents hidden dependencies, and enables robust validation.
2.  **Service-Only Public APIs**: Features NEVER expose models publicly—only services. This promotes building independent, self-contained "features" rather than monolithic applications.
3.  **Platform Service Integration**: Leverage AppKit for common enterprise-grade functionalities like authentication, logging, and utilities, providing a solid and secure foundation.
4.  **Zero Coupling**: Features communicate only through explicit service contracts, minimizing coupling and maximizing reusability.
5.  **LLM-Optimized**: Predictable patterns with strict validation enable perfect AI code generation. Flux is specifically designed to facilitate this, making it ideal for LLMs to generate accurate, consistent, and high-quality code with minimal ambiguity.
6.  **TypeScript by Design**: Full TypeScript support ensures type safety, enhances developer experience, and provides enterprise-grade reliability and maintainability.

---

## 🏗️ Enhanced Contract System (Heart of Flux)

### The Four Contract Categories

Every feature MUST declare these four categories explicitly:

```typescript
contract: createBackendContract()
  // 🌍 PUBLIC API - What this feature offers to others
  .provides('routes', ['GET /users', 'POST /users']) // HTTP endpoints
  .provides('services', ['userService']) // Services only (NO MODELS)

  // 🔒 PRIVATE IMPLEMENTATION - Internal to this feature only
  .internal('services', ['passwordHasher', 'validator']) // Private services
  .internal('models', ['UserModel', 'AuthConfig']) // All models are internal

  // 📦 PLATFORM IMPORTS - External services/libraries
  .import('appkit', ['auth', 'database', 'logging']) // AppKit services
  .import('external', ['stripe', 'sendgrid']) // External dependencies

  // 🤝 FEATURE DEPENDENCIES - Services from other features only
  .needs('services', ['paymentService', 'emailService']) // Never models, only services

  .build();
```

### Critical LLM Rules for Contract Creation

#### Rule 1: Service-Only Public APIs (NEVER expose models)

```typescript
// ✅ CORRECT - Only services in provides
.provides('services', ['userService', 'authService'])

// ❌ WRONG - NEVER expose models publicly
.provides('models', ['UserModel'])  // Models are ALWAYS internal
```

#### Rule 2: All Models Must Be Internal

```typescript
// ✅ CORRECT - All models are internal
.internal('models', ['UserModel', 'PaymentModel', 'ConfigModel'])

// ❌ WRONG - Models cannot be public
.provides('models', ['UserModel'])  // Will fail validation
```

#### Rule 3: Explicit AppKit Service Declarations

```typescript
// ✅ CORRECT - Declare all AppKit services used
.import('appkit', ['auth', 'database', 'logging', 'security'])

// ❌ WRONG - Using AppKit without declaration
// Code: import { auth } from '@voilajsx/appkit/auth'
// Contract: Missing .import('appkit', ['auth'])  // Will fail validation
```

#### Rule 4: Service Dependencies Only

```typescript
// ✅ CORRECT - Only depend on services
.needs('services', ['paymentService', 'notificationService'])

// ❌ WRONG - Never depend on models
.needs('models', ['PaymentModel'])  // Models are feature-private
```

---

## 🔍 Contract Validation System (Bi-directional Enforcement)

Flux includes comprehensive validation that checks contracts against actual code:

### Routes - Bi-directional Validation ✅

```typescript
// Contract declaration
.provides('routes', ['GET /users', 'POST /users'])

// Code validation in *Route.ts/*Routes.ts files
routes.get('/users', handler);   // ✅ Must exist
routes.post('/users', handler);  // ✅ Must exist
routes.delete('/users/:id', handler); // ❌ Must be declared in contract
```

### Services - Exact Count Validation ✅

```typescript
// Contract declaration
.provides('services', ['userService'])      // Public (1 service)
.internal('services', ['passwordHasher'])   // Private (1 service)

// Code validation in *Service.ts/*Services.ts files
export const userService = new UserService();     // ✅ Public service
export const passwordHasher = new PasswordHash(); // ✅ Internal service
// Total: 2 exports must equal 1 + 1 = 2 declared services
```

### Models - Exact Count Validation ✅

```typescript
// Contract declaration
.internal('models', ['UserModel', 'AuthConfig'])  // All models internal (2 models)

// Code validation in *Model.ts/*Models.ts files
export interface UserModel { ... }      // ✅ Internal model
export interface AuthConfig { ... }     // ✅ Internal model
// Total: 2 exports must equal 2 declared models
```

### AppKit Imports - Bi-directional Validation ✅

```typescript
// Contract declaration
.import('appkit', ['auth', 'database', 'logging'])

// Code validation - must have corresponding imports
import { authenticator } from '@voilajsx/appkit/auth';       // ✅ Matches 'auth'
import { database } from '@voilajsx/appkit/database';        // ✅ Matches 'database'
import { logger } from '@voilajsx/appkit/logging';           // ✅ Matches 'logging'
import { error } from '@voilajsx/appkit/error';              // ❌ Must declare 'error' in contract
```

### Service Dependencies - Provider + Usage Validation ✅

```typescript
// Feature A declares need
.needs('services', ['paymentService'])

// Validation requirements:
// 1. Feature B must provide: .provides('services', ['paymentService'])
// 2. Feature A must import: import { paymentService } from '@/features/payment/services/paymentService'
```

---

## 📁 File Structure and Core Intent

### Enhanced File Structure & Naming Conventions

The Flux framework enforces a clear and consistent project structure to promote modularity and maintainability.

```
many-backend/
├── flux.ts                    # Main entry point and application bootstrap
├── contracts.ts              # Defines contract types and the ContractBuilder
├── tsconfig.json             # TypeScript configuration for the project
├── package.json              # Project dependencies and scripts
├── .env.example              # Example environment variables
├── src/                      # Source code directory
│   └── features/             # Contains all independent backend features
│       └── user-management/  # Example: A feature for user CRUD operations
│           ├── index.ts         # **Core Feature Config**: Defines the feature's name, contract, and routes.
│           ├── routes/
│           │   └── userRoutes.ts # Must contain "Route" or "Routes"
│           ├── services/
│           │   ├── userService.ts # Must contain "Service" or "Services"
│           │   └── hashService.ts # Internal service (private)
│           ├── models/
│           │   └── userModel.ts   # Must contain "Model" or "Models"
│           └── types/
│               └── index.ts       # TypeScript interfaces
└── scripts/                  # Contains Flux CLI tools and helper scripts
```

### Core Intent of Each File

-   **`flux.ts`**: The main application entry point. It's responsible for discovering all features, validating their contracts, configuring and starting the Fastify server, and registering all feature routes.
-   **`contracts.ts`**: Defines the core contract system. It includes the interfaces for the four contract categories, the `ContractBuilder` class for the fluent API, and the `createBackendContract()` function to instantiate the builder.
-   **`src/features/<feature-name>/index.ts`**: The heart of each feature. It defines the `FeatureConfig` which includes the feature's `name`, its `contract`, and its `routes` configuration.
-   **`src/features/<feature-name>/routes/*.ts`**: Contains the Fastify plugin that defines the HTTP routes (endpoints) for the feature, integrating with AppKit's `authenticator` for security.
-   **`src/features/<feature-name>/services/*.ts`**: Implements the business logic for the feature. This is where the core functionality resides. Services typically return a standard `FluxResponse` format.
-   **`src/features/<feature-name>/models/*.ts`**: (Optional) Defines the data models or schemas used by the feature, often interacting with a database or ORM.
-   **`src/features/<feature-name>/types/index.ts`**: Contains all TypeScript type definitions, interfaces, and enums specific to the feature, ensuring strong typing throughout.

---

## 🎯 LLM Decision Framework

### Step 1: Feature Type Detection

```
What type of backend feature am I building?

├── API FEATURE (90% of features)
│   ├── Has HTTP endpoints: YES
│   ├── Template: API_FEATURE
│   ├── Files: index.ts + routes/ + services/ + models/ + types/
│   └── Contract: .provides('routes' + 'services') + .needs()
│
└── SERVICE FEATURE (10% of features)
    ├── Has HTTP endpoints: NO
    ├── Template: SERVICE_ONLY
    ├── Files: index.ts + services/ + types/ (no routes/)
    └── Contract: .provides('services') + .needs()
```

### Step 2: Contract Category Decisions

```
For each category, ask:

🌍 PROVIDES - What do I offer to OTHER features?
├── routes: HTTP endpoints this feature exposes
└── services: Business logic other features can use

🔒 INTERNAL - What is PRIVATE to this feature?
├── services: Helper functions, utilities, private logic
└── models: Data structures, database schemas, types

📦 IMPORTS - What EXTERNAL services do I use?
├── appkit: Platform services (auth, database, logging, etc.)
└── external: Third-party services (stripe, sendgrid, etc.)

🤝 NEEDS - What do I require from OTHER features?
└── services: Only services (never models) from other features
```

---

## 🔧 Complete Feature Templates

### Template 1: API_FEATURE (Full CRUD with Enhanced Contracts)

```typescript
/**
 * Enhanced API feature with precise contract validation
 * Use for: User management, content management, order processing
 */
import { createBackendContract } from '../../../contracts.js';
import type { FeatureConfig } from '../../../flux.js';

const userManagementFeature: FeatureConfig = {
  name: 'user-management',

  // ✅ Enhanced contract with all four categories
  contract: createBackendContract()
    // 🌍 PUBLIC API - What others can use
    .provides('routes', [
      'GET /users',
      'POST /users',
      'GET /users/:id',
      'PUT /users/:id',
      'DELETE /users/:id',
    ])
    .provides('services', ['userService']) // Only services, no models

    // 🔒 PRIVATE IMPLEMENTATION - Internal only
    .internal('services', ['passwordHasher', 'userValidator'])
    .internal('models', ['UserModel', 'UserPreferences'])

    // 📦 PLATFORM IMPORTS - External dependencies
    .import('appkit', ['auth', 'database', 'logging', 'security'])
    .import('external', ['bcrypt'])

    // 🤝 FEATURE DEPENDENCIES - Other feature services
    .needs('services', ['emailService', 'auditService'])

    .build(),

  routes: [
    {
      file: 'routes/userRoutes.ts', // Must follow naming convention
      prefix: '/api/users',
    },
  ],

  meta: {
    name: 'User Management Service',
    description: 'Complete user CRUD with authentication and validation',
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
 * Use for: Email processing, file handling, scheduled tasks
 */
const emailServiceFeature: FeatureConfig = {
  name: 'email-service',

  // ✅ Service-only contract
  contract: createBackendContract()
    // 🌍 PUBLIC API - Service only
    .provides('services', ['emailService'])

    // 🔒 PRIVATE IMPLEMENTATION
    .internal('services', ['emailTemplater', 'emailQueue'])
    .internal('models', ['EmailJob', 'EmailTemplate'])

    // 📦 PLATFORM IMPORTS
    .import('appkit', ['logging', 'config', 'queue'])
    .import('external', ['sendgrid', 'nodemailer'])

    // 🤝 No dependencies from other features
    .build(),

  routes: [], // No HTTP endpoints

  meta: {
    name: 'Email Processing Service',
    description: 'Background email processing and notifications',
    version: '1.0.0',
  },
};

export default emailServiceFeature;
```

---

## 🎨 Enhanced Service Patterns

### Pattern 1: Public Service (Provides)

```typescript
/**
 * Public service - can be used by other features
 * File: src/features/user-management/services/userService.ts
 */
import type {
  UserService,
  UserItem,
  CreateUserRequest,
  UserResponse,
} from '../types/index.js';
import { logger } from '@voilajsx/appkit/logging';
import { database } from '@voilajsx/appkit/database';
import { UserModel } from '../models/userModel.js'; // Internal model import
import { passwordHasher } from './passwordHasher.js'; // Internal service import

class UserServiceImpl implements UserService {
  private readonly log = logger.get('user-service');

  async getAll(): Promise<UserResponse> {
    try {
      this.log.info('Fetching all users');

      const users = await UserModel.findAll(); // Use internal model

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

      // Use internal service
      const hashedPassword = await passwordHasher.hash(data.password);

      const newUser = await UserModel.create({
        ...data,
        password: hashedPassword,
        createdBy: userId,
      });

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

// ✅ Export as public service (declared in .provides('services'))
export const userService = new UserServiceImpl();
```

### Pattern 2: Internal Service (Private)

```typescript
/**
 * Internal service - private to this feature only
 * File: src/features/user-management/services/passwordHasher.ts
 */
import bcrypt from 'bcrypt';
import { logger } from '@voilajsx/appkit/logging';

class PasswordHasher {
  private readonly log = logger.get('password-hasher');
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    try {
      this.log.debug('Hashing password');
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error: any) {
      this.log.error('Password hashing failed', { error: error.message });
      throw new Error('Password hashing failed');
    }
  }

  async compare(password: string, hash: string): Promise<boolean> {
    try {
      this.log.debug('Comparing password');
      return await bcrypt.compare(password, hash);
    } catch (error: any) {
      this.log.error('Password comparison failed', { error: error.message });
      throw new Error('Password comparison failed');
    }
  }
}

// ✅ Export as internal service (declared in .internal('services'))
export const passwordHasher = new PasswordHasher();
```

### Pattern 3: Internal Model (Always Private)

```typescript
/**
 * Internal model - never exposed outside feature
 * File: src/features/user-management/models/userModel.ts
 */
import { database } from '@voilajsx/appkit/database';
import type { UserItem } from '../types/index.js';

class UserModelClass {
  async findAll(): Promise<UserItem[]> {
    const db = await database.get();
    return db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<UserItem | null> {
    const db = await database.get();
    return db.user.findUnique({
      where: { id },
    });
  }

  async create(
    data: Omit<UserItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserItem> {
    const db = await database.get();
    return db.user.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async update(id: string, data: Partial<UserItem>): Promise<UserItem> {
    const db = await database.get();
    return db.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    const db = await database.get();
    await db.user.delete({
      where: { id },
    });
  }
}

// ✅ Export as internal model (declared in .internal('models'))
export const UserModel = new UserModelClass();
```

---

## 📄 Enhanced Route Patterns

### Router Pattern with Precise Validation

```typescript
/**
 * Enhanced routes with contract validation
 * File: src/features/user-management/routes/userRoutes.ts
 */
import { router, type RequestType } from '@/flux';
import { logger } from '@voilajsx/appkit/logging';
import { authenticator } from '@voilajsx/appkit/auth';
import { userService } from '../services/userService.js';
import type { CreateUserRequest, UpdateUserRequest } from '../types/index.js';

export default router('user-management', (routes) => {
  const log = logger.get('user-routes');
  const auth = authenticator.get();

  // ✅ GET /users - Must be declared in contract
  routes.get('/users', auth.requireLogin(), async (req: RequestType) => {
    log.info('GET /users - Fetching all users');

    const user = auth.user(req);
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await userService.getAll();
    return result;
  });

  // ✅ POST /users - Must be declared in contract
  routes.post('/users', auth.requireLogin(), async (req: RequestType) => {
    log.info('POST /users - Creating user', { data: req.body });

    const user = auth.user(req);
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await userService.create(
      req.body as CreateUserRequest,
      user.userId
    );
    return result;
  });

  // ✅ GET /users/:id - Must be declared in contract
  routes.get('/users/:id', auth.requireLogin(), async (req: RequestType) => {
    const { id } = req.params;
    log.info('GET /users/:id - Fetching user', { id });

    const result = await userService.getById(id);
    return result;
  });

  // ✅ PUT /users/:id - Must be declared in contract
  routes.put('/users/:id', auth.requireLogin(), async (req: RequestType) => {
    const { id } = req.params;
    log.info('PUT /users/:id - Updating user', { id, data: req.body });

    const result = await userService.update(id, req.body as UpdateUserRequest);
    return result;
  });

  // ✅ DELETE /users/:id - Must be declared in contract
  routes.delete(
    '/users/:id',
    [auth.requireLogin(), auth.requireRole('admin')],
    async (req: RequestType) => {
      const { id } = req.params;
      log.info('DELETE /users/:id - Deleting user', { id });

      const result = await userService.delete(id);
      return result;
    }
  );

  log.info('✅ User routes registered successfully', {
    routes: [
      'GET /users',
      'POST /users',
      'GET /users/:id',
      'PUT /users/:id',
      'DELETE /users/:id',
    ],
    authEnabled: true,
  });
});
```

---

## 🎯 Critical LLM Rules (ALWAYS Follow)

### Rule 1: Enhanced Contract Requirements

```typescript
// ✅ CORRECT - All four contract categories
contract: createBackendContract()
  .provides('routes', ['GET /resource']) // Public HTTP endpoints
  .provides('services', ['resourceService']) // Public services only
  .internal('services', ['helper']) // Private services
  .internal('models', ['ResourceModel']) // All models are internal
  .import('appkit', ['auth', 'logging']) // Platform services
  .needs('services', ['otherService']) // Feature dependencies
  .build();

// ❌ WRONG - Missing categories or exposing models
contract: createBackendContract()
  .provides('models', ['UserModel']) // Models NEVER public
  .build();
```

### Rule 2: Strict File Naming Conventions

```typescript
// ✅ CORRECT - Follow naming patterns
routes / userRoutes.ts; // Must contain "Route" or "Routes"
services / userService.ts; // Must contain "Service" or "Services"
models / userModel.ts; // Must contain "Model" or "Models"

// ❌ WRONG - Will not be detected by validation
routes / api.ts; // Missing "Route/Routes"
services / utils.ts; // Missing "Service/Services"
models / types.ts; // Missing "Model/Models"
```

### Rule 3: Export Naming Requirements

```typescript
// ✅ CORRECT - Export names must match patterns
export const userService = new UserService();     // Contains "service"
export const userRoutes = (routes) => { ... };    // Contains "route"
export interface UserModel { ... }                // Contains "model"

// ❌ WRONG - Will not be detected
export const userHandler = new UserService();     // Missing "service"
export const api = (routes) => { ... };           // Missing "route"
export interface User { ... }                     // Missing "model"
```

### Rule 4: Service-Only Inter-Feature Communication

```typescript
// ✅ CORRECT - Import services from other features
import { emailService } from '@/features/email/services/emailService';
// Contract: .needs('services', ['emailService'])

// ❌ WRONG - Never import models between features
import { UserModel } from '@/features/user/models/userModel'; // FORBIDDEN
```

### Rule 5: AppKit Import Declarations

```typescript
// ✅ CORRECT - Declare all AppKit imports
.import('appkit', ['auth', 'database', 'logging'])

// Code must match:
import { authenticator } from '@voilajsx/appkit/auth';
import { database } from '@voilajsx/appkit/database';
import { logger } from '@voilajsx/appkit/logging';

// ❌ WRONG - Undeclared AppKit import
import { error } from '@voilajsx/appkit/error';  // Must declare 'error' in contract
```

---

## 🔧 AppKit Service Mapping

### Complete AppKit Service List

```typescript
// All available AppKit services for .import('appkit', [...])
const APPKIT_SERVICES = {
  auth: '@voilajsx/appkit/auth', // Authentication & JWT
  database: '@voilajsx/appkit/database', // Database connections
  logging: '@voilajsx/appkit/logging', // Structured logging
  config: '@voilajsx/appkit/config', // Environment config
  security: '@voilajsx/appkit/security', // Input validation
  error: '@voilajsx/appkit/error', // Error handling
  storage: '@voilajsx/appkit/storage', // File storage
  cache: '@voilajsx/appkit/cache', // Redis caching
  email: '@voilajsx/appkit/email', // Email services
  event: '@voilajsx/appkit/event', // Event system
  queue: '@voilajsx/appkit/queue', // Job queues
  utils: '@voilajsx/appkit/utils', // Utility functions
};
```

### Authentication Patterns

```typescript
// Contract declaration
.import('appkit', ['auth'])

// Implementation
import { authenticator } from '@voilajsx/appkit/auth';

const auth = authenticator.get();

// Standard patterns
routes.get('/protected', auth.requireLogin(), handler);
routes.get('/admin', [auth.requireLogin(), auth.requireRole('admin')], handler);

const user = auth.user(request);  // Get authenticated user
```

---

## 🧪 Contract Validation Commands

### Development Workflow

```bash
# 1. Create feature with enhanced contracts
npm run flux:create user-management

# 2. Validate contracts match code
npm run flux:contracts
# ✅ Routes: 5 declared, 5 implemented
# ✅ Services: 3 declared (1 public + 2 internal), 3 exported
# ✅ Models: 2 declared, 2 exported (all internal)
# ✅ AppKit: 3 declared, 3 imported
# ✅ Dependencies: 2 needed, 2 providers found

# 3. Full quality check
npm run flux:check
# ✅ Contract validation: PASSED
# ✅ TypeScript compilation: PASSED
# ✅ Code formatting: PASSED

# 4. Development server
npm run flux:dev
```

### Common Validation Errors & Fixes

```bash
# Error: Route declared but not implemented
❌ Route 'GET /users' declared but not implemented
# Fix: Add routes.get('/users', handler) to userRoutes.ts

# Error: Service exported but not declared
❌ Service 'userHelper' exported but not declared in contract
# Fix: Add to .internal('services', ['userHelper'])

# Error: AppKit import without declaration
❌ Import '@voilajsx/appkit/error' found but not declared
# Fix: Add to .import('appkit', ['error'])

# Error: Service dependency not found
❌ Service 'emailService' needed but no feature provides it
# Fix: Create email-service feature or remove dependency
```

---

## 🎨 Complete Feature Examples

### Example 1: E-commerce Order Management

```typescript
// src/features/order-management/index.ts
const orderManagementFeature: FeatureConfig = {
  name: 'order-management',

  contract: createBackendContract()
    // 🌍 PUBLIC API
    .provides('routes', [
      'GET /orders',
      'POST /orders',
      'GET /orders/:id',
      'PUT /orders/:id',
      'DELETE /orders/:id',
      'POST /orders/:id/ship',
    ])
    .provides('services', ['orderService'])

    // 🔒 PRIVATE IMPLEMENTATION
    .internal('services', ['orderValidator', 'shippingCalculator'])
    .internal('models', ['OrderModel', 'OrderItem', 'ShippingInfo'])

    // 📦 PLATFORM IMPORTS
    .import('appkit', ['auth', 'database', 'logging', 'error'])
    .import('external', ['stripe', 'fedex-api'])

    // 🤝 FEATURE DEPENDENCIES
    .needs('services', ['userService', 'inventoryService', 'emailService'])

    .build(),

  routes: [
    {
      file: 'routes/orderRoutes.ts',
      prefix: '/api/orders',
    },
  ],
};
```

### Example 2: Background Email Processing

```typescript
// src/features/email-processor/index.ts
const emailProcessorFeature: FeatureConfig = {
  name: 'email-processor',

  contract: createBackendContract()
    // 🌍 PUBLIC API
    .provides('services', ['emailService'])

    // 🔒 PRIVATE IMPLEMENTATION
    .internal('services', ['emailQueue', 'templateEngine', 'deliveryTracker'])
    .internal('models', ['EmailJob', 'EmailTemplate', 'DeliveryStatus'])

    // 📦 PLATFORM IMPORTS
    .import('appkit', ['logging', 'config', 'queue', 'database'])
    .import('external', ['sendgrid', 'mailgun'])

    // 🤝 No feature dependencies
    .build(),

  routes: [], // Background service only
};
```

---

## 💡 LLM Success Patterns

### Pattern 1: Start with Contract Design

```typescript
// ALWAYS start by designing the contract first
User asks: "I need user authentication and management"

LLM thinks:
1. Feature type: API_FEATURE (needs HTTP endpoints)
2. Public API: routes for auth + services for other features
3. Private: password hashing, user validation, user models
4. Platform: needs auth, database, logging, security
5. Dependencies: might need email service for verification

contract: createBackendContract()
  .provides('routes', ['POST /auth/login', 'POST /auth/register', 'GET /auth/profile'])
  .provides('services', ['authService', 'userService'])
  .internal('services', ['passwordHasher', 'tokenValidator'])
  .internal('models', ['UserModel', 'TokenModel'])
  .import('appkit', ['auth', 'database', 'logging', 'security'])
  .needs('services', ['emailService'])
  .build()
```

### Pattern 2: File Structure Planning

```typescript
// After contract, plan the file structure
Features needed:
├── index.ts (contract above)
├── routes/authRoutes.ts (contains "Route")
├── services/
│   ├── authService.ts (public - contains "Service")
│   ├── userService.ts (public - contains "Service")
│   └── passwordHasher.ts (internal - contains "Service")
├── models/
│   ├── userModel.ts (internal - contains "Model")
│   └── tokenModel.ts (internal - contains "Model")
└── types/index.ts
```

### Pattern 3: Implementation with Validation

```typescript
// Implement knowing validation will check:
// 1. Route declarations must match route implementations
// 2. Service count must match (public + internal = total exports)
// 3. Model count must match (all internal = total exports)
// 4. AppKit imports must match declarations
// 5. Service dependencies must have providers
```

---

## 🎯 Final LLM Checklist

Before completing any Flux feature, verify:

### Contract Validation

- [ ] ✅ All four categories declared: provides/internal/imports/needs
- [ ] ✅ Only services in .provides() (never models)
- [ ] ✅ All models in .internal() (models are always private)
- [ ] ✅ All AppKit services declared in .import('appkit', [...])
- [ ] ✅ Only service dependencies in .needs() (never models)

### File Structure Validation

- [ ] ✅ Route files contain "Route" or "Routes" in filename
- [ ] ✅ Service files contain "Service" or "Services" in filename
- [ ] ✅ Model files contain "Model" or "Models" in filename
- [ ] ✅ Export names contain corresponding keywords

### Code Implementation Validation

- [ ] ✅ All declared routes are implemented in route files
- [ ] ✅ Service count matches (provides + internal = total exports)
- [ ] ✅ Model count matches (internal = total exports)
- [ ] ✅ AppKit imports match contract declarations
- [ ] ✅ Service dependencies have providers and are imported

### Quality Assurance

- [ ] ✅ Uses AppKit for auth (never custom authentication)
- [ ] ✅ Standard response format for all services
- [ ] ✅ Error handling using AppKit error module
- [ ] ✅ Logging using AppKit logger
- [ ] ✅ TypeScript types defined in types/index.ts

---

## ✨ The Flux Advantage

By following these enhanced patterns, you get:

1.  **10x Faster Development**: Predictable patterns and LLM-optimization allow for rapid code generation and reduced development cycles.
2.  **Zero Integration Issues**: Explicit contracts and feature isolation prevent unexpected side effects and integration headaches.
3.  **Perfect Architecture Enforcement** - Contracts prevent architectural violations and ensure a consistent codebase.
4.  **Precise Validation** - Bi-directional contract validation catches mismatches early.
5.  **Enterprise-Grade Security**: Built-in AppKit authentication and security features provide a robust and secure foundation.
6.  **Infinite Scalability**: Features remain isolated, allowing for independent scaling and deployment.
7.  **Reduced Boilerplate**: Smart defaults and CLI tools automate the creation of common structures.

---

## 🎭 Real-World Scenarios & Advanced Patterns

### Multi-Service Features

```typescript
// Complex feature providing multiple services
const analyticsFeature: FeatureConfig = {
  name: 'analytics',

  contract: createBackendContract()
    // 🌍 PUBLIC API - Multiple services
    .provides('routes', ['GET /analytics/dashboard', 'GET /analytics/reports'])
    .provides('services', [
      'analyticsService',
      'reportService',
      'dashboardService',
    ])
    // 🔒 PRIVATE IMPLEMENTATION
    .internal('services', ['dataAggregator', 'chartGenerator'])
    .internal('models', ['AnalyticsModel', 'ReportModel'])
    // 📦 PLATFORM IMPORTS
    .import('appkit', ['database', 'cache', 'logging', 'auth'])
    .import('external', ['d3', 'chartjs'])
    // 🤝 FEATURE DEPENDENCIES
    .needs('services', ['userService', 'orderService'])
    .build(),
};
```

### Microservice-Style Features

```typescript
// Payment processing microservice
const paymentFeature: FeatureConfig = {
  name: 'payment-processor',

  contract: createBackendContract()
    // 🌍 PUBLIC API
    .provides('routes', ['POST /payments/process', 'GET /payments/:id'])
    .provides('services', ['paymentService'])
    // 🔒 PRIVATE IMPLEMENTATION
    .internal('services', ['stripeProcessor', 'fraudDetector'])
    .internal('models', ['PaymentModel', 'TransactionModel'])
    // 📦 PLATFORM IMPORTS
    .import('appkit', ['auth', 'database', 'logging', 'security'])
    .import('external', ['stripe'])
    // 🤝 FEATURE DEPENDENCIES
    .needs('services', ['orderService', 'userService', 'emailService'])
    .build(),
};
```

### Integrating with Existing Frameworks

Flux is designed as a standalone backend framework. Integrating it directly into an *existing* non-Flux framework can be challenging. However, Flux features can be exposed as independent microservices that your existing framework can consume via HTTP APIs.

-   **Microservice Approach**: Treat Flux applications as independent microservices. Your existing framework can communicate with Flux services via REST APIs.
-   **API Gateway**: Use an API Gateway to route requests to the appropriate Flux microservice.
-   **Authentication**: Flux handles its own authentication. Your existing framework would need to either pass through JWT tokens or have a separate authentication mechanism.

---

## 🧪 Testing & Deployment

### Contract-Driven Testing

```typescript
// Test contract compliance
describe('User Management Feature Contract', () => {
  test('should export exactly the declared services', () => {
    const { contract } = require('../features/user-management').default;
    const services = require('../features/user-management/services');
    
    expect(contract.provides.services).toEqual(['userService']);
    expect(services.userService).toBeDefined();
  });
});
```

### Service Testing with AppKit Mocks

```typescript
// Test services with AppKit integration
describe('User Service', () => {
  let userService: UserService;
  let mockDb: any;

  beforeEach(() => {
    // Mock AppKit dependencies
    mockDb = { user: { create: jest.fn() } };
    jest.mock('@voilajsx/appkit/database', () => ({
      database: { get: () => Promise.resolve(mockDb) },
    }));
    userService = require('../services/userService').userService;
  });

  test('should create user successfully', async () => {
    const userData = { email: 'test@example.com', password: 'hashedpassword' };
    mockDb.user.create.mockResolvedValue({ id: '123', ...userData });
    const result = await userService.create(userData, 'creator-123');
    expect(result.success).toBe(true);
  });
});
```

### Production Build Process

```bash
# 1. Validate all contracts before build
npm run flux:contracts

# 2. Run full quality checks
npm run flux:check

# 3. Build TypeScript
npm run flux:build

# 4. Start production server
npm start
```

### Docker Production Setup

```dockerfile
# Dockerfile for Flux production
FROM node:18-alpine
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/
COPY package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Run as non-root user
USER node
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🏆 Best Practices Summary

### The Golden Rules of Flux

1.  **Contract First**: Always design contracts before implementation.
2.  **Service Boundaries**: Only services are public APIs; models stay internal.
3.  **Precise Validation**: Use bi-directional validation to catch mismatches.
4.  **AppKit Integration**: Leverage platform services; never reinvent the wheel.
5.  **File Conventions**: Follow strict naming patterns for validation.
6.  **Zero Coupling**: Features communicate only through service contracts.
7.  **LLM Optimization**: Write code that AI can perfectly understand and generate.

---

## 🚀 Quick Start Commands

```bash
# Create your first enhanced feature
npm run flux:create user-auth

# Validate enhanced contracts
npm run flux:contracts

# Start development with live validation
npm run flux:dev

# Run complete quality checks
npm run flux:check

# Build with contract enforcement
npm run flux:build
```

---

**Remember: Flux isn't just a framework—it's a revolution in contract-driven backend architecture that makes perfect AI code generation possible while maintaining enterprise-grade reliability and scalability.** ⚡

**Happy coding with the future of backend development!**
