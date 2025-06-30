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

### Features Are Everything

In Flux, you build **features**, not controllers or services. Each feature is a complete, isolated module.

```typescript
// Every feature declares what it provides and needs
contract: createBackendContract()
  .providesRoute('GET /users') // I offer REST endpoints
  .providesService('userService') // I offer user service
  .needsDatabase() // I need database access
  .needsAuth() // I need authentication
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
  '/protected',
  {
    preHandler: auth.requireLogin(), // JWT authentication
  },
  handler
);

fastify.get(
  '/admin',
  {
    preHandler: [
      auth.requireLogin(),
      auth.requireRole('admin'), // Role-based access
    ],
  },
  handler
);
```

## 📁 Project Structure

```
my-backend/
├── flux.ts                    # Main entry point
├── contracts.ts              # Contract definitions
├── tsconfig.json             # TypeScript config
├── src/features/             # All your features
│   ├── user-management/      # Feature: User CRUD
│   │   ├── index.ts         # Contract & config
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   └── types/           # TypeScript types
│   └── email-service/        # Feature: Background service
│       ├── index.ts         # Contract & config
│       ├── services/        # Worker services
│       └── types/           # TypeScript types
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
# ✅ Generates full CRUD with authentication
```

### 2. Generated Files

```typescript
// src/features/user-management/index.ts
const userManagementFeature: FeatureConfig = {
  name: 'user-management',

  contract: createBackendContract()
    .providesRoute('GET /users')
    .providesRoute('POST /users')
    .providesService('userService')
    .needsDatabase()
    .needsAuth()
    .build(),

  routes: [{ file: 'routes/index.ts', prefix: '/api/users' }],
};
```

```typescript
// src/features/user-management/routes/index.ts
fastify.get(
  '/',
  {
    preHandler: auth.requireLogin(),
  },
  async (request, reply) => {
    const result = await userService.getAll();
    return reply.send(result);
  }
);

fastify.post(
  '/',
  {
    schema: {
      /* validation */
    },
    preHandler: auth.requireLogin(),
  },
  async (request, reply) => {
    const user = auth.user(request);
    const result = await userService.create(request.body, user.userId);
    return reply.send(result);
  }
);
```

### 3. Ready Endpoints

```bash
GET    /api/users              # List all users (auth required)
POST   /api/users              # Create user (auth required)
GET    /api/users/:id          # Get user by ID (auth required)
PUT    /api/users/:id          # Update user (auth required)
DELETE /api/users/:id          # Delete user (auth required)
```

## 🔒 Authentication & Security

### JWT Authentication (AppKit)

```typescript
// Automatic authentication setup
import { authenticator } from '@voilajsx/appkit/auth';
const auth = authenticator.get();

// Login endpoint
const token = auth.signToken({
  userId: user.id,
  email: user.email,
  roles: ['user', 'admin'],
});

// Protected routes
fastify.get(
  '/profile',
  {
    preHandler: auth.requireLogin(),
  },
  handler
);
```

### Role-Based Access Control

```typescript
// Built-in role hierarchy: user → moderator → admin → superadmin
fastify.delete(
  '/admin-only',
  {
    preHandler: [
      auth.requireLogin(),
      auth.requireRole('admin'), // Also allows superadmin
    ],
  },
  handler
);

// Multiple roles (OR logic)
fastify.get(
  '/manage',
  {
    preHandler: [auth.requireLogin(), auth.requireRole('admin', 'moderator')],
  },
  handler
);
```

### Custom Roles

```bash
# .env - Define your own role hierarchy
VOILA_AUTH_ROLES=customer:1,vendor:2,staff:3,manager:4,admin:5
```

## 🎨 Service Patterns

### Standard Response Format

```typescript
interface FluxResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Every service method returns this format
async getAll(): Promise<UserResponse> {
  try {
    const users = await db.getUsers();
    return {
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Background Services

```typescript
// SERVICE_ONLY template for workers
export class EmailWorker {
  private readonly log = logger.get('email-worker');

  start(intervalMs: number = 30000): void {
    setInterval(async () => {
      await this.processEmailQueue();
    }, intervalMs);
  }

  private async processEmailQueue(): Promise<void> {
    // Process queued emails
  }
}
```

## 📊 Contract Validation

Flux automatically validates that all feature dependencies are satisfied:

```bash
npm run flux:contracts

# ✅ All contracts valid
# ❌ Service 'paymentService' needed but not provided
# ⚠️  Circular dependency: user-management → order-processing → user-management
```

## 🌍 Environment Variables

```bash
# Required for authentication
VOILA_AUTH_SECRET=your-jwt-secret-key-minimum-32-characters
JWT_SECRET=your-jwt-secret-key-minimum-32-characters

# Optional database
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
REDIS_URL=redis://localhost:6379

# Optional configuration
NODE_ENV=development
PORT=3000
```

## 📈 Performance

- **Development**: Hot reload with tsx (~100ms restart)
- **Production**: Compiled TypeScript (~50MB typical bundle)
- **Memory**: <100MB for typical API server
- **Startup**: <2s with 10+ features

## 🤖 LLM Guidelines

Flux is designed for AI-assisted development. For LLMs:

### Essential Patterns

```typescript
// ✅ ALWAYS use these patterns
import { createBackendContract } from '../../../contracts.js';
import { authenticator } from '@voilajsx/appkit/auth';

// ✅ Standard contract
contract: createBackendContract()
  .providesRoute('GET /resource')
  .providesService('resourceService')
  .needsAuth()
  .build();

// ✅ Standard response
return { success: true, data: result, message: 'Success' };
```

### Anti-Patterns to Avoid

```typescript
// ❌ DON'T import between features
import { otherService } from '../other-feature/services';

// ❌ DON'T use custom auth
const customAuth = (req, res, next) => { ... };

// ❌ DON'T skip contracts
// contract: undefined  // Missing!
```

## 📚 Documentation

- **[LLM Guide](./FLUX_LLM_GUIDE.md)** - Complete AI development patterns
- **[Contract System](./docs/contracts.md)** - Feature contracts explained
- **[Authentication](./docs/auth.md)** - AppKit integration guide
- **[CLI Reference](./docs/cli.md)** - All commands and options

## 🛠️ Advanced Usage

### Custom Platform Services

```typescript
// Add your own platform services
export const CUSTOM_SERVICES = {
  PAYMENT: 'payment',
  ANALYTICS: 'analytics',
} as const;

// Use in contracts
contract: createBackendContract()
  .needsService('payment') // Custom service
  .build();
```

### Feature Templates

```typescript
// Create custom templates for your team
export const TEAM_TEMPLATES = {
  MICROSERVICE: () =>
    createBackendContract()
      .providesService('microservice')
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
