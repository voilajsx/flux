# @voilajsx/atom

> **Highly reliable agentic backend microservices framework built for scale**

[![npm version](https://badge.fury.io/js/%40voilajsx%2Fatom.svg)](https://www.npmjs.com/package/@voilajsx/atom)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![ATOM Framework](https://img.shields.io/badge/ATOM-Framework-green.svg)](https://github.com/voilajsx/atom)
[![VoilaJSX AppKit](https://img.shields.io/badge/VoilaJSX-AppKit-purple.svg)](https://github.com/voilajsx/appkit)

**ATOM Framework** enables **95% agentic development** with mathematical reliability guarantees. Build production-ready APIs where AI agents handle implementation while humans provide oversight.

## 🎯 **Core Philosophy**

- **95% agentic development** + **5% human oversight** = **Prompt-to-production reliability**
- **Endpoint-centric architecture**: Each endpoint is completely isolated
- **Mathematical safety**: Zero cross-dependencies = zero breaking changes
- **Perfect agent context**: 800-line limits for optimal AI comprehension
- **Contract-driven development**: Explicit specifications prevent errors

---

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- TypeScript 5+
- Express.js knowledge

### **Installation**

```bash
# Clone or create new project
npm init -y
npm install @voilajsx/atom @voilajsx/appkit express

# Install development dependencies
npm install -D typescript @types/node @types/express ts-node nodemon jest

# Copy environment template
cp .env.example .env

# Start development
npm run dev
```

### **Project Structure**

```
src/
├── features/                    # Auto-discovered features
│   └── hello/                   # ✅ ENABLED (no underscore)
│       ├── main/                # → /api/hello
│       │   ├── contract.ts      # HTTP specification
│       │   ├── logic.ts         # Business logic (≤800 lines)
│       │   ├── model.ts         # Data operations (≤600 lines)
│       │   └── test.ts          # Tests (≤400 lines)
│       └── @name/               # → /api/hello/:name (NextJS-style)
│           ├── contract.ts      # Dynamic route contract
│           ├── logic.ts         # Parameter handling logic
│           ├── model.ts         # Name validation model
│           └── test.ts          # Parameter tests
├── platform/                   # Framework services
│   ├── monitor.ts              # Health + performance
│   ├── deploy.ts               # CI/CD orchestration
│   └── migrate.ts              # Schema coordination
└── server.ts                   # Application entry point
```

---

## 🎭 **Feature Development**

### **NextJS-Style Routing**

ATOM uses intuitive folder-to-URL mapping:

```typescript
// Folder Structure → API Endpoints
src/features/hello/main/           → GET/POST /api/hello
src/features/hello/@name/          → GET/POST /api/hello/:name
src/features/users/main/           → GET/POST /api/users
src/features/users/@id/            → GET/PUT/DELETE /api/users/:id
src/features/users/@id/profile/    → GET/PUT /api/users/:id/profile
src/features/orders/@id/@item/     → GET/PUT /api/orders/:id/:item
```

### **Feature States**

```bash
# Feature naming convention:
hello/           # ✅ ENABLED - Auto-discovered and routed
_hello/          # ❌ DISABLED - Ignored by router (underscore prefix)
```

### **Agent-Ready Endpoints**

Each endpoint follows the **4-file pattern**:

#### **1. contract.ts** - HTTP Specification

```typescript
import { createEndpointContract } from '@voilajsx/atom';

export const CONTRACT = createEndpointContract()
  .path('/hello/:name')
  .methods(['GET', 'POST'])
  .auth({
    GET: null, // Public access
    POST: 'user.basic', // Requires authentication
  })
  .validation({
    GET: 'GetHelloSchema',
    POST: 'CreateHelloSchema',
  })
  .responses({
    GET: 'AtomResponse<HelloType>',
    POST: 'AtomResponse<HelloType>',
  })
  .requires(['logger', 'security', 'utils'])
  .build();
```

#### **2. logic.ts** - Business Logic (≤800 lines)

```typescript
import { utility } from '@voilajsx/appkit/utils';
import { logger } from '@voilajsx/appkit/logging';
import { security } from '@voilajsx/appkit/security';
import { error } from '@voilajsx/appkit/error';

const utils = utility.get();
const log = logger.get('hello');
const secure = security.get();
const err = error.get();

export async function getHello(req: Request, res: Response) {
  const name = secure.input(req.params.name, { maxLength: 50 });

  if (utils.isEmpty(name)) {
    throw err.badRequest('Name parameter is required');
  }

  const result = {
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    requestId: utils.uuid(),
  };

  log.info('Hello request processed', { name, requestId: result.requestId });
  res.json({ success: true, data: result });
}
```

#### **3. model.ts** - Data Operations (≤600 lines)

```typescript
import { utility } from '@voilajsx/appkit/utils';

const utils = utility.get();

export interface HelloData {
  name: string;
  message: string;
  timestamp: string;
  requestId: string;
}

export class HelloModel {
  // In-memory storage for stateless demo
  private static greetings: Map<string, HelloData> = new Map();

  static async create(name: string): Promise<HelloData> {
    const data: HelloData = {
      name: utils.get({ name }, 'name', 'Anonymous'),
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      requestId: utils.uuid(),
    };

    this.greetings.set(data.requestId, data);
    return data;
  }

  static async findByName(name: string): Promise<HelloData[]> {
    return Array.from(this.greetings.values()).filter(
      (greeting) => greeting.name === name
    );
  }
}
```

#### **4. test.ts** - Comprehensive Tests (≤400 lines)

```typescript
import request from 'supertest';
import { app } from '../../../app';

describe('Hello Name Endpoint', () => {
  describe('GET /api/hello/:name', () => {
    test('should return personalized greeting', async () => {
      const response = await request(app).get('/api/hello/World').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Hello, World!');
      expect(response.body.data.name).toBe('World');
      expect(response.body.data.requestId).toBeDefined();
    });

    test('should sanitize input name', async () => {
      const response = await request(app)
        .get('/api/hello/<script>alert("xss")</script>')
        .expect(200);

      expect(response.body.data.name).not.toContain('<script>');
    });

    test('should handle empty name', async () => {
      await request(app).get('/api/hello/').expect(400);
    });
  });
});
```

---

## 🤖 **Agentic Development**

### **Agent Assignment**

```yaml
# blueprint.yml - Human-Agent Orchestration
agent_orchestration:
  assignment_strategy: 'one_endpoint_per_agent'
  parallel_safe: true
  max_concurrent_agents: 4
# Each agent gets complete context:
# - Contract specification
# - Code register for consistency
# - VoilaJSX AppKit patterns
# - 800-line file limits
```

### **Agent Safety Guarantees**

✅ **Mathematical isolation** - Zero cross-dependencies  
✅ **Contract validation** - Strict HTTP specification compliance  
✅ **File size limits** - Perfect agent context (≤800 lines)  
✅ **Quality gates** - 90% test coverage, type safety  
✅ **Instant rollback** - Git + atomic deployments

### **Human Oversight Points**

- **Blueprint approval** - Feature architecture decisions
- **Contract review** - API design and security
- **Performance monitoring** - Real-time health metrics
- **Breaking changes** - Manual approval required

---

## 🔧 **VoilaJSX AppKit Integration**

ATOM leverages **VoilaJSX AppKit** for production-ready utilities:

```typescript
// Essential imports in every endpoint
import { utility } from '@voilajsx/appkit/utils'; // Safe property access
import { configure } from '@voilajsx/appkit/config'; // Environment config
import { logger } from '@voilajsx/appkit/logging'; // Structured logging
import { error } from '@voilajsx/appkit/error'; // HTTP error handling
import { security } from '@voilajsx/appkit/security'; // Input sanitization

// Standard usage pattern
const utils = utility.get();
const config = configure.get();
const log = logger.get('feature-name');
const err = error.get();
const secure = security.get();
```

### **Auto-Scaling Architecture**

```bash
# Development (Zero config)
npm run dev  # → Memory cache, local storage, console logging

# Production (Environment-driven)
export REDIS_URL=redis://...     # → Distributed cache
export RESEND_API_KEY=re_...     # → Email service
export CLOUDFLARE_R2_BUCKET=...  # → Cloud storage
npm start                        # → Auto-scales automatically
```

---

## 🚀 **Deployment**

### **Quality Gates**

```bash
npm run validate    # Build + test + coverage (90% minimum)
npm run atom:deploy # Full validation → deployment
npm run atom:health # Health check endpoint test
```

### **Production Environment**

```bash
# Required environment variables
NODE_ENV=production
VOILA_AUTH_SECRET=your-32-char-secret
VOILA_SECURITY_CSRF_SECRET=your-32-char-csrf
VOILA_SECURITY_ENCRYPTION_KEY=your-64-char-key

# Optional scaling (auto-detected)
REDIS_URL=redis://prod-redis:6379
RESEND_API_KEY=re_prod_key
CLOUDFLARE_R2_BUCKET=prod-bucket
```

### **Docker Deployment**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📊 **Monitoring & Health**

### **Built-in Endpoints**

- **GET /health** - System health check
- **GET /metrics** - Performance metrics
- **GET /manifest** - Live API documentation

### **Real-time Monitoring**

```typescript
// Auto-generated in manifest.yml
performance: response_times: p50: '35ms';
p95: '120ms';
p99: '250ms';
error_rate: '0.1%';
throughput: '450 req/min';
```

---

## 🎯 **Benefits**

### **For Development Teams**

- **95% faster development** - Agents handle implementation
- **Zero breaking changes** - Mathematical endpoint isolation
- **Predictable delivery** - Blueprint-driven development
- **Self-documenting** - Living manifest + contracts

### **For AI Agents**

- **Perfect context** - 800-line file limits fit AI windows
- **Clear instructions** - Contract + register provide guidance
- **Safe modifications** - Register coordination prevents conflicts
- **Quality feedback** - Immediate validation and rollback

### **For Production**

- **Instant scaling** - Environment-driven architecture
- **Real-time health** - Built-in monitoring and alerting
- **Zero downtime** - Atomic deployments with rollback
- **Security-first** - VoilaJSX AppKit production patterns

---

## 📚 **Examples**

### **Hello World API** (This Project)

```bash
# Available endpoints:
GET  /api/hello        # Generic hello message
GET  /api/hello/World  # Personalized greeting

# Features demonstrated:
✅ NextJS-style routing (@name folders)
✅ VoilaJSX AppKit integration
✅ Agent-ready 800-line files
✅ Contract-driven development
✅ Comprehensive testing
✅ Real-time health monitoring
```

### **Adding New Features**

```bash
# 1. Create feature folder
mkdir -p src/features/users/main
mkdir -p src/features/users/@id

# 2. Agent implements 4-file pattern:
# contract.ts + logic.ts + model.ts + test.ts

# 3. ATOM automatically:
# - Discovers feature
# - Maps routes
# - Validates contracts
# - Updates manifest
# - Monitors performance
```

---

## 🔗 **Links**

- **Documentation**: [ATOM Framework Guide](https://github.com/voilajsx/atom/docs)
- **VoilaJSX AppKit**: [Production utilities](https://github.com/voilajsx/appkit)
- **Examples**: [Sample applications](https://github.com/voilajsx/atom/examples)
- **Issues**: [Bug reports & features](https://github.com/voilajsx/atom/issues)

---

## 📄 **License**

MIT © [VoilaJSX Team](https://github.com/voilajsx)

---

**ATOM Framework: The first architecture designed specifically for 95% agentic development with mathematical reliability guarantees.**
