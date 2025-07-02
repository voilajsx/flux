# ⚡ Flux Framework

[![npm version](https://img.shields.io/npm/v/@voilajsx/flux.svg)](https://www.npmjs.com/package/@voilajsx/flux)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> Contract-driven TypeScript backend framework built on AppKit  
> **95% AI-generated code** with zero configuration needed

**One command** creates complete backend features with routes, services, authentication, and contracts. Zero boilerplate, maximum productivity.

## 🚀 Why Choose Flux?

- **⚡ Contract-Driven** - Features declare what they provide and consume
- **🔒 Enterprise Security** - Built-in AppKit authentication with JWT and roles
- **🤖 LLM-Ready** - 95% of code can be AI-generated with consistent patterns
- **🛡️ Type-Safe** - Full TypeScript support with enterprise-grade strictness
- **🔧 Zero Configuration** - Smart defaults for everything
- **📦 Feature Modular** - Complete isolation with explicit contracts

## 📦 Quick Start (2 minutes)

### 1. Install Flux

```bash
npm install @voilajsx/flux
npm install @voilajsx/appkit  # Authentication & utilities
npm install fastify           # Web framework
npm install typescript tsx --save-dev
```

### 2. Set Environment

```bash
echo "JWT_SECRET=your-super-secure-jwt-secret-key-2024-minimum-32-chars" > .env
echo "DATABASE_URL=your-database-connection-string" >> .env
```

### 3. Create Your First Feature

```bash
npm run flux:create user-management
# ✅ Generates: routes + services + types + authentication
# ✅ Includes: Full CRUD with JWT protection
# ✅ Ready: Start coding business logic
```

### 4. Start Development

```bash
npm run flux:dev
# ✅ Hot reload with tsx
# ✅ Contract validation
# ✅ Feature auto-discovery
```

## 🎯 Core Concepts

### Contract-Driven Features

In Flux, every feature is an isolated module governed by a strict contract with four categories, ensuring zero coupling and architectural integrity.

```typescript
// Every feature declares a precise contract
contract: createBackendContract()
  // 🌍 PUBLIC API - What this feature offers to others
  .provides('routes', ['GET /users'])
  .provides('services', ['userService']) // Services only, NO MODELS

  // 🔒 PRIVATE IMPLEMENTATION - Internal to this feature only
  .internal('services', ['passwordHasher'])
  .internal('models', ['UserModel']) // All models are ALWAYS internal

  // 📦 PLATFORM IMPORTS - AppKit or external libraries
  .import('appkit', ['auth', 'database', 'logging'])

  // 🤝 FEATURE DEPENDENCIES - Services from other features
  .needs('services', ['emailService'])

  .build();
```

### Two Types of Features

```bash
# 90% of features - Full CRUD with authentication
npm run flux:create blog-posts      # → API_FEATURE template

# 10% of features - Background services
npm run flux:create email-sender    # → SERVICE_ONLY template
```

### Built-in AppKit Integration

```typescript
// Authentication works out of the box
fastify.get(
  "/protected",
  {
    preHandler: auth.requireLogin(), // JWT authentication
  },
  handler,
);

fastify.get(
  "/admin",
  {
    preHandler: [
      auth.requireLogin(),
      auth.requireRole("admin"), // Role-based access
    ],
  },
  handler,
);
```

## 📁 Project Structure

A Flux project is a collection of independent features with a clear, enforceable structure.

```
my-backend/
├── flux.ts                    # Main entry point & server bootstrap
├── contracts.ts              # Core contract builder definitions
├── tsconfig.json             # TypeScript configuration
├── src/                      # Source code directory
│   └── features/             # All your independent features
│       └── user-management/  # Example feature
│           ├── index.ts         # Core feature config, name, and contract
│           ├── routes/
│           │   └── userRoutes.ts # Routes (must include "Route")
│           ├── services/
│           │   └── userService.ts # Services (must include "Service")
│           ├── models/
│           │   └── userModel.ts   # Models (must include "Model")
│           └── types/
│               └── index.ts       # TypeScript interfaces
└── scripts/                  # Flux CLI tools
```

## 🔧 CLI Commands

### Development

```bash
npm run flux:dev              # Start development server
npm run flux:build            # Build for production
npm start                     # Run production build
```

### Feature Management

```bash
npm run flux:create my-feature    # Create new feature
npm run flux:create payment-api   # → API_FEATURE (CRUD)
npm run flux:create file-processor # → SERVICE_ONLY (worker)
```

### Quality Assurance

```bash
npm run flux:check            # Run all quality checks
npm run flux:contracts        # Validate feature contracts
npm run flux:format           # Check/fix code formatting
```

## 💡 Example: Complete User Management

### 1. Create Feature

```bash
npm run flux:create user-management
# ✅ Generates a full CRUD feature with a precise contract
```

### 2. Define the Contract

The generated `index.ts` includes a detailed contract that defines the feature's public API, private implementation, and dependencies.

```typescript
// src/features/user-management/index.ts
const userManagementFeature: FeatureConfig = {
  name: 'user-management',

  contract: createBackendContract()
    // 🌍 PUBLIC API
    .provides('routes', [
      'GET /users', 'POST /users', 'GET /users/:id', 
      'PUT /users/:id', 'DELETE /users/:id'
    ])
    .provides('services', ['userService'])

    // 🔒 PRIVATE IMPLEMENTATION
    .internal('models', ['UserModel'])
    .internal('services', ['userValidator'])

    // 📦 PLATFORM IMPORTS
    .import('appkit', ['auth', 'database', 'logging'])
    .build(),

  routes: [{ file: 'routes/userRoutes.ts', prefix: '/api/users' }],
};
```

### 3. Ready Endpoints

Your feature is now running with secure, contract-validated endpoints.

```bash
GET    /api/users              # List all users (auth required)
POST   /api/users              # Create user (auth required)
GET    /api/users/:id          # Get user by ID (auth required)
PUT    /api/users/:id          # Update user (auth required)
DELETE /api/users/:id          # Delete user (auth required)
```

## 🔒 Authentication & Security

Flux leverages AppKit for robust, out-of-the-box JWT authentication and role-based access control.

### Declaring Auth Needs

First, declare authentication as a dependency in your feature's contract.

```typescript
// contract in src/features/my-feature/index.ts
.import('appkit', ['auth', 'database', 'logging'])
```

### Protecting Routes

Use the `auth` helper from AppKit within your route definitions to protect endpoints.

```typescript
// src/features/my-feature/routes/myRoutes.ts
import { router } from '@/flux';
import { authenticator } from '@voilajsx/appkit/auth';

export default router('my-feature', (routes) => {
  const auth = authenticator.get();

  // Require a valid JWT token
  routes.get('/protected', auth.requireLogin(), async (req) => {
    const user = auth.user(req); // Access authenticated user data
    return { success: true, message: `Welcome ${user.email}` };
  });

  // Require a specific role
  routes.delete(
    '/admin-only',
    [auth.requireLogin(), auth.requireRole('admin')],
    async (req) => {
      // ... logic for admins only
    }
  );
});
```

## 🎨 Service & Model Patterns

Flux enforces a strict separation between public services (the feature's API) and internal implementation details (private services and models).

### Public Services (`.provides`)

Services exposed to other features. They contain the core business logic.

```typescript
// src/features/user-management/services/userService.ts
import { UserModel } from '../models/userModel.js'; // Internal model

class UserServiceImpl {
  async getAll() {
    const users = await UserModel.findAll();
    return { success: true, data: users };
  }
}

// Exported as a public service
export const userService = new UserServiceImpl();
```

### Internal Models (`.internal`)

All models are feature-private and are never exposed to other features.

```typescript
// src/features/user-management/models/userModel.ts
import { database } from '@voilajsx/appkit/database';

class UserModelClass {
  async findAll() {
    const db = await database.get();
    return db.user.findMany();
  }
}

// Exported as an internal model
export const UserModel = new UserModelClass();
```

## 📊 Contract Validation

Flux includes a powerful CLI command to validate all feature contracts against their implementation, ensuring architectural integrity.

```bash
npm run flux:contracts

# ✅ Routes: 5 declared, 5 implemented
# ✅ Services: 2 declared (1 public + 1 internal), 2 exported
# ✅ Models: 1 declared, 1 exported (all internal)
# ✅ AppKit: 3 declared, 3 imported
# ❌ Error: Service 'emailService' needed but no feature provides it.
```

## 🤖 LLM Guidelines

Flux is designed for AI-assisted development. Follow these core principles for best results:

1.  **Contract First**: Always design the four contract categories (`provides`, `internal`, `import`, `needs`) before writing implementation code.
2.  **Services Over Models**: Never expose models in a feature's public API. Use services for all inter-feature communication.
3.  **Strict Naming Conventions**: Adhere to file naming conventions (`*Routes.ts`, `*Service.ts`, `*Model.ts`) for validation to work correctly.
4.  **Use AppKit**: Leverage AppKit for core functionalities like `auth`, `database`, and `logging` by declaring them in your contract.

## 📚 Documentation

- **[LLM Guide](./docs/FLUX-LLM-GUIDE.md)** - The complete guide to AI-driven development with Flux.
- **[Contract System](./docs/flux-contracts-architecture.md)** - In-depth explanation of the contract system.
- **[AppKit Docs](https://github.com/voilajsx/appkit)** - Documentation for all AppKit platform services.

## 🛠️ Advanced Usage

### Custom Platform Services

```typescript
// Add your own platform services
export const CUSTOM_SERVICES = {
  PAYMENT: "payment",
  ANALYTICS: "analytics",
} as const;

// Use in contracts
contract: createBackendContract()
  .needsService("payment") // Custom service
  .build();
```

### Feature Templates

```typescript
// Create custom templates for your team
export const TEAM_TEMPLATES = {
  MICROSERVICE: () =>
    createBackendContract()
      .providesService("microservice")
      .needsDatabase()
      .needsLogging()
      .build(),
};
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow Flux patterns**: Use `npm run flux:create` for new features
4. **Validate everything**: `npm run flux:check`
5. **Submit PR**: We'll review contracts and patterns

## 📄 License

MIT © [VoilaJSX](https://github.com/voilajsx)

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/voilajsx/flux/issues)
- **Discussions**: [GitHub Discussions](https://github.com/voilajsx/flux/discussions)
- **Discord**: [VoilaJSX Community](https://discord.gg/voilajsx)
- **Docs**: [flux.voilajsx.com](https://flux.voilajsx.com)

---

<p align="center">
  <strong>Built with ❤️ for the future of backend development</strong><br>
  <a href="https://github.com/orgs/voilajsx/people">VoilaJSX Team</a> • Made in India 🇮🇳
</p>

---

## 🚀 Quick Commands Reference

```bash
# Setup
npm install @voilajsx/flux @voilajsx/appkit fastify

# Development
npm run flux:create user-auth    # Create feature
npm run flux:dev                 # Start development
npm run flux:check               # Quality checks

# Production
npm run flux:build               # Build TypeScript
npm start                        # Run production

# Help
npm run flux:help                # Show all commands
```

**Ready to build the future? Start with Flux! ⚡**
