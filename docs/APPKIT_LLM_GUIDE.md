# VoilaJSX AppKit - Complete LLM Agent Guide 🤖

> **The definitive guide for AI agents to generate 100% accurate VoilaJSX AppKit
> code**

## CRITICAL: Read This First

This guide enables LLM agents to generate perfect VoilaJSX AppKit code. Every
example is production-ready. Every pattern is tested. Every rule is absolute.

---

## PART 1: CORE PHILOSOPHY & UNIVERSAL PATTERNS

### WHEN TO USE VoilaJSX AppKit

✅ **ALWAYS use AppKit when:**

- Building Node.js backend applications
- Need authentication with roles/permissions
- Require file storage, caching, queuing, or email
- Want environment-driven configuration
- Building multi-tenant or multi-org applications
- Need production-ready security features
- Want zero-configuration startup

❌ **NEVER use AppKit when:**

- Building frontend React/Vue applications
- Creating CLI tools or desktop applications
- Need real-time WebSocket servers as primary feature
- Building pure microservices with single responsibility
- Working with non-Node.js environments

### THE ONE FUNCTION RULE

**EVERY module follows the same pattern:**

```javascript
// ALWAYS use this pattern for EVERY module
const module = moduleExport.get();

// Examples - MEMORIZE these patterns
const utils = utility.get();
const auth = authenticator.get();
const config = configure.get();
const log = logger.get();
const storage = store.get();
const queue = queuing.get();
const cache = caching.get('namespace');
const email = emailing.get();
const err = error.get();
const secure = security.get();
const db = database.get();
```

**RULE: Never call constructors directly. Always use .get()**

❌ **NEVER do this:**

```javascript
new AuthenticationClass();
new StorageService();
new ConfigManager();
```

✅ **ALWAYS do this:**

```javascript
const auth = authenticator.get();
const storage = store.get();
const config = configure.get();
```

### MODULE CATEGORIES & DECISION TREE

#### **Utilities (Use First)**

- **Utils**: Safe object access, array operations, string utilities, performance
  helpers
- **Config**: Environment variable parsing, application configuration
- **Error**: HTTP error handling, status codes, middleware
- **Logging**: Structured logging, multiple transports

#### **Authentication & Security (Use Second)**

- **Auth**: JWT tokens, role-based permissions, middleware
- **Security**: CSRF protection, rate limiting, input sanitization, encryption

#### **Data & Storage (Use Third)**

- **Database**: Multi-tenant database operations, ORM integration
- **Cache**: Redis/Memory caching with namespaces
- **Storage**: File storage (local/S3/R2), CDN integration

#### **Communication (Use Fourth)**

- **Email**: Multi-provider email sending, templates
- **Queue**: Background job processing, scheduled tasks

### IMPORT PATTERNS

**ALWAYS use direct module imports for best tree-shaking:**

✅ **BEST (Perfect tree-shaking):**

```javascript
import { utility } from '@voilajsx/appkit/utils';
import { authenticator } from '@voilajsx/appkit/auth';
import { configure } from '@voilajsx/appkit/config';
```

✅ **GOOD (Still tree-shakable):**

```javascript
import { utility, authenticator, configure } from '@voilajsx/appkit';
```

❌ **AVOID (Poor tree-shaking):**

```javascript
import * as appkit from '@voilajsx/appkit';
```

### ENVIRONMENT-DRIVEN SCALING

**AppKit automatically scales based on environment variables:**

#### **Development (Zero Config)**

```bash
# No environment variables needed
npm start
```

- Memory cache/queue
- Local file storage
- Console logging
- Single database

#### **Production (Auto-Detection)**

```bash
# Set these - everything scales automatically
REDIS_URL=redis://...           # → Distributed cache/queue
DATABASE_URL=postgres://...     # → Database logging/queue
AWS_S3_BUCKET=bucket           # → Cloud storage
RESEND_API_KEY=re_...          # → Email service
```

### UNIVERSAL ERROR HANDLING PATTERNS

#### **Pattern 1: Safe Access with Defaults**

```javascript
// ALWAYS use utils.get() for safe property access
const utils = utility.get();

❌ const name = user.profile.name;                    // Can crash
✅ const name = utils.get(user, 'profile.name', 'Guest'); // Never crashes
```

#### **Pattern 2: Try-Catch with Specific Errors**

```javascript
const err = error.get();

try {
  await someOperation();
} catch (error) {
  if (error.message.includes('validation')) {
    throw err.badRequest('Invalid input data');
  }
  if (error.message.includes('permission')) {
    throw err.forbidden('Access denied');
  }
  if (error.message.includes('not found')) {
    throw err.notFound('Resource not found');
  }
  // Default to server error
  throw err.serverError('Operation failed');
}
```

#### **Pattern 3: Startup Validation**

```javascript
// ALWAYS validate configuration at app startup
try {
  const auth = authenticator.get();
  const config = configure.get();

  // Validate required config
  config.getRequired('database.url');

  console.log('✅ App validation passed');
} catch (error) {
  console.error('❌ App validation failed:', error.message);
  process.exit(1);
}
```

### CROSS-MODULE INTEGRATION PATTERNS

#### **Pattern 1: Authentication + Database + Logging**

```javascript
const auth = authenticator.get();
const db = database.get();
const log = logger.get('auth');

app.post('/login', async (req, res) => {
  try {
    // Get user from database
    const user = await db.user.findUnique({
      where: { email: req.body.email },
    });

    if (!user) {
      log.warn('Login attempt - user not found', { email: req.body.email });
      throw error.unauthorized('Invalid credentials');
    }

    // Verify password
    const isValid = await auth.comparePassword(
      req.body.password,
      user.password
    );
    if (!isValid) {
      log.warn('Login attempt - invalid password', { userId: user.id });
      throw error.unauthorized('Invalid credentials');
    }

    // Create token
    const token = auth.signToken({
      userId: user.id,
      role: user.role,
      level: user.level,
    });

    log.info('User login successful', { userId: user.id });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    log.error('Login failed', { error: err.message });
    throw err;
  }
});
```

#### **Pattern 2: File Upload + Storage + Queue + Email**

```javascript
const storage = store.get();
const queue = queuing.get();
const email = emailing.get();
const log = logger.get('upload');

app.post('/upload', async (req, res) => {
  try {
    const file = req.file;
    const key = `uploads/${Date.now()}-${file.originalname}`;

    // Store file
    await storage.put(key, file.buffer, {
      contentType: file.mimetype,
    });

    const url = storage.url(key);
    log.info('File uploaded', { key, size: file.size });

    // Queue background processing
    await queue.add('process-file', {
      key,
      userId: req.user.id,
      originalName: file.originalname,
    });

    // Queue notification email
    await queue.add('email', {
      to: req.user.email,
      subject: 'File uploaded successfully',
      text: `Your file ${file.originalname} was uploaded successfully.`,
    });

    res.json({ success: true, url, key });
  } catch (err) {
    log.error('Upload failed', { error: err.message });
    throw err;
  }
});
```

#### **Pattern 3: Cache + Database + Config**

```javascript
const cache = caching.get('users');
const db = database.get();
const config = configure.get();

async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const ttl = config.get('cache.user.ttl', 3600);

  // Try cache first
  let user = await cache.get(cacheKey);

  if (!user) {
    // Get from database
    user = await db.user.findUnique({ where: { id: userId } });

    if (user) {
      // Cache for future requests
      await cache.set(cacheKey, user, ttl);
    }
  }

  return user;
}
```

### TESTING PATTERNS

#### **Pattern 1: Module Reset Between Tests**

```javascript
import { utility, logger, caching } from '@voilajsx/appkit';

describe('App Tests', () => {
  afterEach(async () => {
    // ALWAYS reset module state between tests
    utility.clearCache();
    await logger.clear();
    await caching.clear();
  });

  test('should process data safely', () => {
    const utils = utility.get();
    const result = utils.get({ user: { name: 'John' } }, 'user.name');
    expect(result).toBe('John');
  });
});
```

#### **Pattern 2: Test-Specific Configuration**

```javascript
describe('Config Tests', () => {
  beforeEach(() => {
    // Force test configuration
    configure.reset({
      database: { host: 'test-db', port: 5432 },
      cache: { strategy: 'memory' },
      logging: { level: 'silent' },
    });
  });

  afterEach(() => {
    configure.clearCache();
  });
});
```

### VARIABLE NAMING CONVENTIONS

**ALWAYS use these exact variable names for consistency:**

#### **Single Instances**

```javascript
const utils = utility.get(); // ALWAYS 'utils'
const auth = authenticator.get(); // ALWAYS 'auth'
const config = configure.get(); // ALWAYS 'config'
const log = logger.get(); // ALWAYS 'log'
const storage = store.get(); // ALWAYS 'storage'
const queue = queuing.get(); // ALWAYS 'queue'
const email = emailing.get(); // ALWAYS 'email'
const err = error.get(); // ALWAYS 'err'
const secure = security.get(); // ALWAYS 'secure'
const db = database.get(); // ALWAYS 'db'
```

#### **Namespaced/Specialized Instances**

```javascript
const userCache = caching.get('users'); // namespace + 'Cache'
const sessionCache = caching.get('sessions'); // namespace + 'Cache'
const apiLog = logger.get('api'); // component + 'Log'
const dbLog = logger.get('database'); // component + 'Log'
const dbTenants = database.getTenants(); // 'db' + purpose
const acmeDb = database.org('acme').get(); // orgName + 'Db'
```

### FRAMEWORK INTEGRATION PATTERNS

#### **Express Pattern**

```javascript
import express from 'express';
import { authenticator, error, logger } from '@voilajsx/appkit';

const app = express();
const auth = authenticator.get();
const err = error.get();
const log = logger.get('app');

// ALWAYS use this middleware order
app.use(express.json());
app.use(auth.requireLogin()); // Auth first
app.use('/api', routes); // Routes second
app.use(err.handleErrors()); // Error handling LAST

// ALWAYS use asyncRoute wrapper
app.post(
  '/users',
  err.asyncRoute(async (req, res) => {
    // Errors automatically handled
  })
);
```

#### **Fastify Pattern**

```javascript
import Fastify from 'fastify';
import { authenticator, error, logger } from '@voilajsx/appkit';

const fastify = Fastify();
const auth = authenticator.get();
const err = error.get();

// ALWAYS set error handler
fastify.setErrorHandler((error, request, reply) => {
  const appError = error.statusCode ? error : err.serverError(error.message);
  reply.status(appError.statusCode).send({
    error: appError.type,
    message: appError.message,
  });
});

// ALWAYS use preHandler for auth
fastify.get(
  '/protected',
  {
    preHandler: auth.requireRole('admin.tenant'),
  },
  async (request, reply) => {
    // Route handler
  }
);
```

### PRODUCTION DEPLOYMENT PATTERNS

#### **Environment Validation**

```javascript
// ALWAYS validate environment at startup
function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const required = ['VOILA_AUTH_SECRET', 'DATABASE_URL', 'REDIS_URL'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  console.log('✅ Production environment validated');
}
```

#### **Graceful Shutdown**

```javascript
// ALWAYS implement graceful shutdown
async function gracefulShutdown() {
  console.log('🔄 Shutting down gracefully...');

  try {
    await database.disconnect();
    await queue.close();
    await logger.flush();

    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Shutdown error:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### MODULE INTERACTION RULES

#### **Dependency Order (ALWAYS follow this order):**

1. **Utils** - No dependencies, use first
2. **Config** - No dependencies, use for configuration
3. **Logging** - Depends on Config
4. **Error** - Depends on Config and Logging
5. **Auth** - Depends on Config and Error
6. **Security** - Depends on Config and Error
7. **Database** - Depends on Config, Logging, and Error
8. **Cache** - Depends on Config and Logging
9. **Storage** - Depends on Config, Logging, and Error
10. **Email** - Depends on Config, Logging, and Error
11. **Queue** - Depends on Config, Logging, and Error

#### **Safe Initialization Pattern**

```javascript
// ALWAYS initialize in this order
async function initializeApp() {
  try {
    // 1. Core utilities first
    const config = configure.get();
    const log = logger.get('init');

    // 2. Validate configuration
    config.getRequired('database.url');

    // 3. Initialize database
    const db = database.get();

    // 4. Initialize other services
    const cache = caching.get('app');
    const queue = queuing.get();

    log.info('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ App initialization failed:', error.message);
    process.exit(1);
  }
}
```

---

# PART 2: ESSENTIAL MODULES - VERIFIED ACCURATE FOR LLMs

## 🚀 LLM Quick Reference - Copy These Exact Patterns

```javascript
// Essential imports - ALWAYS use direct module imports for best tree-shaking
import { utility } from '@voilajsx/appkit/utils';
import { authenticator } from '@voilajsx/appkit/auth';
import { configure } from '@voilajsx/appkit/config';
import { logger } from '@voilajsx/appkit/logging';

// Core pattern - MEMORIZE this exact syntax
const utils = utility.get();
const auth = authenticator.get();
const config = configure.get();
const log = logger.get();
```

---

## UTILS MODULE - ALL 12 METHODS

### When to Use

✅ **Safe property access, array operations, string utilities, performance
helpers**  
❌ **Complex data transformations, DOM manipulation, heavy math**

### Core Pattern

```javascript
import { utility } from '@voilajsx/appkit/utils';
const utils = utility.get();
```

### Complete API (All 12 Methods)

```javascript
// 1. get() - Safe property access (NEVER crashes)
const name = utils.get(user, 'profile.name', 'Guest');
const items = utils.get(response, 'data.items', []);

// 2. isEmpty() - Universal empty check
if (utils.isEmpty(req.body.email)) throw err.badRequest('Email required');

// 3. slugify() - URL-safe strings
const slug = utils.slugify('Product Name!'); // → 'product-name'

// 4. chunk() - Split arrays into batches
const batches = utils.chunk(largeArray, 100);

// 5. debounce() - Prevent excessive function calls
const debouncedFn = utils.debounce(expensiveFunction, 1000);

// 6. pick() - Extract specific object properties
const publicUser = utils.pick(user, ['id', 'name', 'email']);

// 7. unique() - Remove duplicates (note: 'unique', not 'uniq')
const uniqueIds = utils.unique(duplicatedArray);

// 8. clamp() - Constrain numbers to range
const volume = utils.clamp(userInput, 0, 1);

// 9. formatBytes() - Human-readable file sizes
const size = utils.formatBytes(1048576); // → '1 MB'

// 10. truncate() - Smart text cutting
const preview = utils.truncate(longText, { length: 100, preserveWords: true });

// 11. sleep() - Promise-based delays
await utils.sleep(1000); // Wait 1 second

// 12. uuid() - Generate unique identifiers
const id = utils.uuid(); // → 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
```

---

## AUTH MODULE

### When to Use

✅ **JWT tokens, role-based access, API security, password hashing**  
❌ **Frontend authentication, OAuth providers, session storage**

### Core Pattern

```javascript
import { authenticator } from '@voilajsx/appkit/auth';
const auth = authenticator.get();
```

### Token Structure (CRITICAL - EXACT FORMAT)

```javascript
// ✅ CORRECT - Always use this EXACT structure (3 required fields)
const token = auth.signToken({
  userId: 123, // REQUIRED - unique user identifier
  role: 'admin', // REQUIRED - role name (admin, user, moderator)
  level: 'tenant', // REQUIRED - level within role (basic, tenant, org, system)
});

// Optional permissions can be added
const tokenWithPerms = auth.signToken({
  userId: 123,
  role: 'admin',
  level: 'tenant',
  permissions: ['manage:tenant', 'view:org'], // Optional
});
```

### Role Hierarchy (Built-in Inheritance)

```
admin.system > admin.org > admin.tenant > moderator.manage > moderator.approve >
moderator.review > user.max > user.pro > user.basic
```

### Essential Auth Patterns

```javascript
// 1. Route protection middleware
app.get('/admin', auth.requireRole('admin.tenant'), handler);
app.post('/api/*', auth.requireLogin(), handler);

// 2. Safe user extraction (returns null if not authenticated)
const user = auth.user(req);
if (!user) throw err.unauthorized('Login required');

// 3. Role hierarchy checking
const userRoleLevel = `${user.role}.${user.level}`;
if (!auth.hasRole(userRoleLevel, 'admin.tenant')) {
  throw err.forbidden('Admin access required');
}

// 4. Password handling
const hashedPassword = await auth.hashPassword(plainPassword);
const isValid = await auth.comparePassword(plainPassword, hashedPassword);
```

---

## CONFIG MODULE

### When to Use

✅ **Environment variables, application settings, startup validation**  
❌ **Runtime configuration changes, user preferences**

### Core Pattern

```javascript
import { configure } from '@voilajsx/appkit/config';
const config = configure.get();
```

### Essential Patterns

```javascript
// 1. Required values (throws if missing)
const dbUrl = config.getRequired('database.url');
const authSecret = config.getRequired('auth.secret');

// 2. Optional with defaults
const port = config.get('port', 3000);
const env = config.get('node.env', 'development');

// 3. Nested configuration
const dbConfig = config.get('database', {
  host: 'localhost',
  port: 5432,
  ssl: false,
});

// 4. Environment detection
const isDev = config.isDevelopment();
const isProd = config.isProduction();
```

---

## LOGGER MODULE

### When to Use

✅ **Structured logging, error tracking, performance monitoring**  
❌ **Simple console.log, debugging only**

### Core Pattern

```javascript
import { logger } from '@voilajsx/appkit/logging';
const log = logger.get();
```

### Essential Patterns

```javascript
// 1. Component-specific loggers
const apiLog = logger.get('api');
const dbLog = logger.get('database');

// 2. Structured logging with context
log.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: Date.now(),
});

// 3. Error logging
try {
  await riskyOperation();
} catch (error) {
  log.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
  });
  throw err.serverError('Operation failed');
}

// 4. Performance tracking
const timer = log.timer('expensive-operation');
await expensiveOperation();
timer.end(); // Automatically logs duration
```

### Auto-Transport Selection

```bash
# Development → Console
# Production with DATABASE_URL → Database
# Production with REDIS_URL → Redis
```

---

## ⚠️ COMMON LLM MISTAKES

```javascript
// ❌ WRONG - Don't use common import for production
import { utility, authenticator } from '@voilajsx/appkit';

// ✅ CORRECT - Always use direct module imports for best tree-shaking
import { utility } from '@voilajsx/appkit/utils';
import { authenticator } from '@voilajsx/appkit/auth';

// ❌ WRONG - Don't use constructors
new AuthenticationClass();
new ConfigManager();

// ✅ CORRECT - Always use .get()
const auth = authenticator.get();
const config = configure.get();

// ❌ WRONG - Unsafe property access
const name = user.profile.name; // Can crash

// ✅ CORRECT - Safe access with default
const name = utils.get(user, 'profile.name', 'Guest');

// ❌ WRONG - Wrong method name
const uniqueIds = utils.uniq(array); // Method is 'unique'

// ✅ CORRECT - Correct method name
const uniqueIds = utils.unique(array);

// ❌ WRONG - Missing required token fields
auth.signToken({ userId: 123 }); // Missing role/level

// ✅ CORRECT - All required fields
auth.signToken({ userId: 123, role: 'admin', level: 'tenant' });

// ❌ WRONG - Wrong error types
throw err.serverError('Email required'); // Should be badRequest

// ✅ CORRECT - Semantic error types
throw err.badRequest('Email required');
throw err.unauthorized('Login required');
throw err.forbidden('Admin access required');
```

---

## 🔄 INTEGRATION PATTERN

```javascript
// Essential modules working together
import { utility } from '@voilajsx/appkit/utils';
import { authenticator } from '@voilajsx/appkit/auth';
import { configure } from '@voilajsx/appkit/config';
import { logger } from '@voilajsx/appkit/logging';
import { error } from '@voilajsx/appkit/error';

const utils = utility.get();
const auth = authenticator.get();
const config = configure.get();
const log = logger.get('app');
const err = error.get();

// Typical API endpoint pattern
app.post(
  '/api/users',
  auth.requireRole('admin.tenant'),
  err.asyncRoute(async (req, res) => {
    const user = auth.user(req);
    const email = utils.get(req.body, 'email');

    if (utils.isEmpty(email)) {
      throw err.badRequest('Email is required');
    }

    log.info('Creating user', { email, adminId: user.userId });

    // Business logic here
    res.json({ success: true });
  })
);
```

---

## 📋 QUICK CHECKLIST FOR LLMs

- [ ] Always use direct module imports (`@voilajsx/appkit/utils`)
- [ ] Always use `module.get()` pattern
- [ ] Use `utils.get()` for safe property access
- [ ] Include `userId`, `role`, `level` in JWT tokens
- [ ] Use correct method names (`utils.unique()` not `utils.uniq()`)
- [ ] Use semantic error types (`badRequest`, `unauthorized`, etc.)
- [ ] Add structured logging with context
- [ ] Validate required config at startup
- [ ] Use `auth.user(req)` for safe user extraction
- [ ] Wrap async routes with `err.asyncRoute()`

# PART 3: INFRASTRUCTURE MODULES - VERIFIED ACCURATE FOR LLMs

## 🚀 LLM Quick Reference - Copy These Exact Patterns

```javascript
// Essential infrastructure imports - ALWAYS use direct module imports
import { store } from '@voilajsx/appkit/storage';
import { caching } from '@voilajsx/appkit/cache';
import { database } from '@voilajsx/appkit/database';
import { queuing } from '@voilajsx/appkit/queue';
import { emailing } from '@voilajsx/appkit/email';

// Core pattern - MEMORIZE this exact syntax
const storage = store.get();
const cache = caching.get('namespace');
const db = database.get();
const queue = queuing.get();
const email = emailing.get();
```

---

## STORAGE MODULE

### When to Use

✅ **File uploads, documents, images, videos, CDN integration**  
❌ **Configuration data, temporary data, session storage**

### Core Pattern

```javascript
import { store } from '@voilajsx/appkit/storage';
const storage = store.get();
```

### Auto-Strategy Detection

```bash
# Development → Local files in ./uploads/
# Production → R2 (if CLOUDFLARE_R2_BUCKET) → S3 (if AWS_S3_BUCKET) → Local
```

### Essential API (4 Core Methods)

```javascript
// 1. put() - Upload files
await storage.put('avatars/user123.jpg', imageBuffer);
await storage.put('docs/contract.pdf', pdfBuffer, {
  contentType: 'application/pdf',
  cacheControl: 'public, max-age=3600',
});

// 2. get() - Download files
const buffer = await storage.get('avatars/user123.jpg');
if (!buffer) throw err.notFound('File not found');

// 3. delete() - Remove files
await storage.delete('temp/old-file.jpg');

// 4. getSignedUrl() - Temporary access URLs
const signedUrl = await storage.signedUrl('private.pdf', 3600); // 1 hour
```

---

## CACHE MODULE

### When to Use

✅ **Speed up database queries, session data, API responses, computed
results**  
❌ **Permanent data, files, transactions, sensitive data without encryption**

### Core Pattern

```javascript
import { caching } from '@voilajsx/appkit/cache';
const cache = caching.get('namespace');
```

### Auto-Strategy Detection

```bash
# Development → Memory cache with LRU
# Production → Redis (if REDIS_URL) → Memory
```

### Essential API (5 Core Methods)

```javascript
// 1. set() - Store with TTL
await cache.set('user:123', userData, 3600); // 1 hour TTL

// 2. get() - Retrieve (null if not found/expired)
const user = await cache.get('user:123');

// 3. getOrSet() - Get or compute and cache
const weather = await cache.getOrSet(
  `weather:${city}`,
  async () => {
    return await fetchWeatherAPI(city); // Only runs on cache miss
  },
  1800 // 30 minutes
);

// 4. delete() - Remove specific key
await cache.delete('user:123');

// 5. clear() - Clear entire namespace
await cache.clear();
```

### Namespace Isolation

```javascript
// ALWAYS use specific namespaces - completely isolated
const userCache = caching.get('users');
const sessionCache = caching.get('sessions');
const apiCache = caching.get('external-api');

await userCache.set('123', userData);
await sessionCache.set('123', sessionData); // Different from user:123
```

---

## DATABASE MODULE

### When to Use

✅ **Persistent data, user data, content, multi-tenant apps, cross-cloud
orgs**  
❌ **Temporary data, files, caching, session storage**

### Core Pattern

```javascript
import { database } from '@voilajsx/appkit/database';
const db = database.get();
```

### Progressive Scaling (CRITICAL)

```javascript
// Day 1: Single database
const db = await database.get();
const users = await db.user.findMany();

// Month 6: Multi-tenant (zero code changes!)
// Just add: VOILA_DB_TENANT=auto
const db = await database.get(); // Now auto-filtered by tenant

// Year 1: Multi-org (still zero code changes!)
// Add: ORG_ACME=postgresql://acme.aws.com/db
const acmeDb = await database.org('acme').get();
```

### Essential API (3 Core Patterns)

```javascript
// 1. Normal user access (single or tenant-filtered)
const db = await database.get();
const users = await db.user.findMany(); // Auto-filtered if tenant mode

// 2. Admin access (all tenants)
const dbTenants = await database.getTenants();
const allUsers = await dbTenants.user.findMany(); // Cross-tenant

// 3. Organization-specific access
const acmeDb = await database.org('acme').get();
const acmeUsers = await acmeDb.user.findMany();
```

### MANDATORY Schema Requirements

```sql
-- ✅ EVERY table MUST include tenant_id from Day 1 (nullable for future)
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  name text,
  tenant_id text,                    -- MANDATORY: nullable for future
  created_at timestamp DEFAULT now(),

  INDEX idx_users_tenant (tenant_id) -- MANDATORY: performance index
);
```

---

## QUEUE MODULE

### When to Use

✅ **Background jobs, emails, file processing, webhooks, scheduled tasks**  
❌ **Real-time operations, simple sync operations, immediate responses**

### Core Pattern

```javascript
import { queuing } from '@voilajsx/appkit/queue';
const queue = queuing.get();
```

### Auto-Transport Detection

```bash
# Development → Memory queue
# Production → Redis (if REDIS_URL) → Database (if DATABASE_URL) → Memory
```

### Essential API (3 Core Methods)

```javascript
// 1. add() - Add jobs to queue
await queue.add('email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up',
});

await queue.add(
  'image-resize',
  {
    input: 'uploads/large.jpg',
    output: 'thumbnails/thumb.jpg',
    width: 200,
  },
  {
    delay: 5000, // Start in 5 seconds
    attempts: 3, // Retry 3 times
  }
);

// 2. process() - Handle jobs
queue.process('email', async (data) => {
  await sendEmail(data.to, data.subject, data.body);
  return { sent: true };
});

queue.process('image-resize', async (data) => {
  await resizeImage(data.input, data.output, data.width);
  return { resized: true };
});

// 3. Event handling
queue.on('completed', (job, result) => {
  log.info('Job completed', { job: job.name, result });
});

queue.on('failed', (job, error) => {
  log.error('Job failed', { job: job.name, error: error.message });
});
```

---

## EMAIL MODULE

### When to Use

✅ **Transactional emails, notifications, templates, multi-provider support**  
❌ **Marketing emails, bulk campaigns, newsletter management**

### Core Pattern

```javascript
import { emailing } from '@voilajsx/appkit/email';
const email = emailing.get();
```

### Auto-Provider Detection

```bash
# Production → Resend (if RESEND_API_KEY) → SMTP (if SMTP_HOST) → Console
```

### Essential API (3 Core Methods)

```javascript
// 1. send() - Basic email sending
await email.send({
  to: 'user@example.com',
  subject: 'Welcome to our app!',
  text: 'Thanks for signing up.',
  html: '<h1>Thanks for signing up!</h1>',
});

// 2. sendTemplate() - Template-based emails
await email.sendTemplate('welcome', {
  to: user.email,
  name: user.name,
  activationLink: `https://app.com/activate/${user.token}`,
});

// 3. Queue integration (recommended for production)
await queue.add('email', {
  template: 'password-reset',
  to: user.email,
  resetLink: resetUrl,
});

queue.process('email', async (data) => {
  if (data.template) {
    return await email.sendTemplate(data.template, data);
  } else {
    return await email.send(data);
  }
});
```

---

## ⚠️ COMMON LLM MISTAKES

```javascript
// ❌ WRONG - Using constructors directly
new StorageService();
new DatabaseClient();

// ✅ CORRECT - Always use .get() pattern
const storage = store.get();
const db = database.get();

// ❌ WRONG - Missing namespace for cache
const cache = caching.get(); // No namespace

// ✅ CORRECT - Always specify namespace
const userCache = caching.get('users');

// ❌ WRONG - Missing tenant_id in schema
CREATE TABLE users (id, email, name); // Will break multi-tenancy

// ✅ CORRECT - Future-proof schema
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text,
  name text,
  tenant_id text,                    -- MANDATORY
  INDEX idx_users_tenant (tenant_id) -- MANDATORY
);

// ❌ WRONG - Manual tenant filtering
const users = await db.user.findMany({
  where: { tenant_id: getTenantId(req) }
});

// ✅ CORRECT - Automatic tenant filtering
const db = await database.get();
const users = await db.user.findMany(); // Auto-filtered

// ❌ WRONG - Synchronous heavy operations
await resizeImage(largeFile); // Blocks request

// ✅ CORRECT - Queue heavy operations
await queue.add('image-resize', { file: largeFile });
```

---

## 🔄 INTEGRATION PATTERN

```javascript
// Infrastructure modules working together
import { store } from '@voilajsx/appkit/storage';
import { caching } from '@voilajsx/appkit/cache';
import { database } from '@voilajsx/appkit/database';
import { queuing } from '@voilajsx/appkit/queue';
import { emailing } from '@voilajsx/appkit/email';
import { logger } from '@voilajsx/appkit/logging';

const storage = store.get();
const userCache = caching.get('users');
const db = database.get();
const queue = queuing.get();
const email = emailing.get();
const log = logger.get('api');

// File upload with caching and processing
app.post('/api/upload', async (req, res) => {
  try {
    // 1. Store file
    const fileKey = `uploads/${req.user.id}/${Date.now()}-${req.file.originalname}`;
    await storage.put(fileKey, req.file.buffer, {
      contentType: req.file.mimetype,
    });

    // 2. Save to database
    const file = await db.file.create({
      data: {
        key: fileKey,
        name: req.file.originalname,
        size: req.file.size,
        userId: req.user.id,
      },
    });

    // 3. Queue processing
    await queue.add('process-upload', {
      fileId: file.id,
      fileKey: fileKey,
      userId: req.user.id,
    });

    // 4. Clear user cache
    await userCache.delete(`files:${req.user.id}`);

    // 5. Log activity
    log.info('File uploaded', {
      fileId: file.id,
      userId: req.user.id,
      size: req.file.size,
    });

    res.json({ success: true, fileId: file.id });
  } catch (error) {
    log.error('Upload failed', { error: error.message });
    throw error;
  }
});

// Background processing
queue.process('process-upload', async (data) => {
  const { fileId, fileKey, userId } = data;

  try {
    // Process file (resize, convert, etc.)
    const buffer = await storage.get(fileKey);
    const processedBuffer = await processFile(buffer);

    // Store processed version
    const processedKey = fileKey.replace('uploads/', 'processed/');
    await storage.put(processedKey, processedBuffer);

    // Update database
    await db.file.update({
      where: { id: fileId },
      data: { processed: true, processedKey },
    });

    // Send notification
    await queue.add('email', {
      template: 'file-processed',
      to: data.userEmail,
      fileName: data.fileName,
    });

    log.info('File processed', { fileId, userId });
  } catch (error) {
    log.error('Processing failed', { fileId, error: error.message });
    throw error;
  }
});
```

---

## 📋 QUICK CHECKLIST FOR LLMs

- [ ] Always use direct module imports (`@voilajsx/appkit/storage`)
- [ ] Always use `module.get()` pattern for all infrastructure modules
- [ ] Use namespaces for cache (`caching.get('users')`)
- [ ] Include `tenant_id` field in ALL database tables with index
- [ ] Use auto-strategy detection (environment variables only)
- [ ] Queue heavy operations instead of blocking requests
- [ ] Cache frequently accessed data with appropriate TTL
- [ ] Use storage for files, cache for temporary data, database for persistent
      data
- [ ] Implement proper error handling with fallbacks
- [ ] Log important operations with structured data

# PART 4: SYSTEM MODULES - VERIFIED ACCURATE FOR LLMs

## 🚀 LLM Quick Reference - Copy These Exact Patterns

```javascript
// Essential system imports - ALWAYS use direct module imports
import { error } from '@voilajsx/appkit/error';
import { security } from '@voilajsx/appkit/security';

// Core pattern - MEMORIZE this exact syntax
const err = error.get();
const secure = security.get();
```

---

## ERROR MODULE

### When to Use

✅ **HTTP APIs, status codes, middleware integration, client responses**  
❌ **CLI applications, non-HTTP servers, simple utilities**

### Core Pattern

```javascript
import { error } from '@voilajsx/appkit/error';
const err = error.get();
```

### HTTP Status Code Mapping (CRITICAL)

```javascript
// ✅ CORRECT - Use these exact error types for specific situations
err.badRequest('message'); // 400 - Client input errors
err.unauthorized('message'); // 401 - Authentication required
err.forbidden('message'); // 403 - Access denied (user authenticated, no permission)
err.notFound('message'); // 404 - Resource doesn't exist
err.conflict('message'); // 409 - Business logic conflicts (duplicate email)
err.serverError('message'); // 500 - Internal server errors

// ❌ WRONG - Don't use wrong error types
throw err.serverError('Email required'); // Should be badRequest
throw err.badRequest('Database failed'); // Should be serverError
throw err.unauthorized('Admin required'); // Should be forbidden
```

### Essential API (4 Core Patterns)

```javascript
// 1. Input validation (400 errors)
if (!req.body.email) {
  throw err.badRequest('Email is required');
}
if (!email.includes('@')) {
  throw err.badRequest('Invalid email format');
}

// 2. Authentication checks (401 errors)
if (!token) {
  throw err.unauthorized('Authentication token required');
}
if (tokenExpired) {
  throw err.unauthorized('Session expired. Please login again.');
}

// 3. Permission checks (403 errors)
if (!user.isAdmin) {
  throw err.forbidden('Admin access required');
}
if (user.status === 'suspended') {
  throw err.forbidden('Account suspended');
}

// 4. Resource checks (404 errors)
const user = await db.user.findUnique({ where: { id } });
if (!user) {
  throw err.notFound('User not found');
}
```

### Framework Integration

```javascript
// Express - Error handling middleware (MUST be last)
app.use(err.handleErrors());

// Express - Async route wrapper
app.post(
  '/users',
  err.asyncRoute(async (req, res) => {
    // Errors automatically handled
    if (!req.body.email) throw err.badRequest('Email required');
    res.json({ success: true });
  })
);

// Fastify - Error handler setup
fastify.setErrorHandler((error, request, reply) => {
  const appError = error.statusCode ? error : err.serverError(error.message);
  reply.status(appError.statusCode).send({
    error: appError.type,
    message: appError.message,
  });
});
```

---

## SECURITY MODULE

### When to Use

✅ **Web forms, CSRF protection, rate limiting, input sanitization,
encryption**  
❌ **CLI applications, API-only services, read-only applications**

### Core Pattern

```javascript
import { security } from '@voilajsx/appkit/security';
const secure = security.get();
```

### Required Environment Variables

```bash
# CRITICAL - Required for startup
VOILA_SECURITY_CSRF_SECRET=your-csrf-secret-key-2024-minimum-32-chars
VOILA_SECURITY_ENCRYPTION_KEY=64-char-hex-key-for-aes256-encryption
```

### Essential API (4 Core Methods)

```javascript
// 1. CSRF Protection (CRITICAL: Session middleware MUST come first)
app.use(session({ secret: process.env.SESSION_SECRET }));
app.use(secure.forms()); // CSRF protection for all routes

// Generate CSRF token for forms
app.get('/form', (req, res) => {
  const csrfToken = req.csrfToken();
  res.render('form', { csrfToken });
});

// 2. Rate Limiting
app.use('/api', secure.requests()); // Default: 100 requests per 15 minutes
app.use('/auth', secure.requests(5, 3600000)); // 5 requests per hour

// 3. Input Sanitization
const safeName = secure.input(req.body.name, { maxLength: 50 });
const safeEmail = secure.input(req.body.email?.toLowerCase());
const safeHtml = secure.html(req.body.content, {
  allowedTags: ['p', 'b', 'i', 'a'],
});

// 4. Data Encryption (AES-256-GCM)
const encryptedSSN = secure.encrypt(user.ssn);
const encryptedPhone = secure.encrypt(user.phone);

// Decrypt for authorized access
const originalSSN = secure.decrypt(encryptedSSN);
const originalPhone = secure.decrypt(encryptedPhone);
```

---

## ⚠️ COMMON LLM MISTAKES

```javascript
// ❌ WRONG - Using wrong error types
throw err.serverError('Email required'); // Should be badRequest
throw err.badRequest('Database connection failed'); // Should be serverError
throw err.unauthorized('Admin access required'); // Should be forbidden

// ✅ CORRECT - Semantic error types
throw err.badRequest('Email required'); // Client input issue
throw err.serverError('Database connection failed'); // Server issue
throw err.forbidden('Admin access required'); // Permission issue

// ❌ WRONG - Missing error middleware
app.post('/api', (req, res) => {
  throw err.badRequest('Error'); // Nothing will catch this!
});

// ✅ CORRECT - Proper middleware setup
app.use(err.handleErrors()); // MUST be last middleware
app.post(
  '/api',
  err.asyncRoute(async (req, res) => {
    throw err.badRequest('Error'); // Automatically handled
  })
);

// ❌ WRONG - CSRF without sessions
app.use(secure.forms());
app.use(session(config)); // Too late!

// ✅ CORRECT - Sessions first, then CSRF
app.use(session(config));
app.use(secure.forms());

// ❌ WRONG - Missing input sanitization
const name = req.body.name; // Raw input - dangerous!

// ✅ CORRECT - Always sanitize input
const safeName = secure.input(req.body.name);

// ❌ WRONG - Manual error catching with asyncRoute
app.post(
  '/api',
  err.asyncRoute(async (req, res) => {
    try {
      throw err.badRequest('Error');
    } catch (error) {
      res.status(500).json({ error: 'Failed' }); // Don't catch manually!
    }
  })
);

// ✅ CORRECT - Let the system handle errors
app.post(
  '/api',
  err.asyncRoute(async (req, res) => {
    throw err.badRequest('Error'); // Just throw - system handles
  })
);
```

---

## 🔄 INTEGRATION PATTERN

```javascript
// System modules working together
import { error } from '@voilajsx/appkit/error';
import { security } from '@voilajsx/appkit/security';
import { authenticator } from '@voilajsx/appkit/auth';
import { database } from '@voilajsx/appkit/database';
import { logger } from '@voilajsx/appkit/logging';

const err = error.get();
const secure = security.get();
const auth = authenticator.get();
const db = database.get();
const log = logger.get('api');

// Complete secure API endpoint
app.use(session({ secret: process.env.SESSION_SECRET }));
app.use(secure.forms()); // CSRF protection
app.use('/api', secure.requests(100, 900000)); // Rate limiting
app.use(err.handleErrors()); // Error handling (LAST)

// Secure user registration endpoint
app.post(
  '/api/register',
  err.asyncRoute(async (req, res) => {
    // 1. Input validation
    const email = secure.input(req.body.email?.toLowerCase());
    const name = secure.input(req.body.name, { maxLength: 50 });
    const password = req.body.password;

    if (!email) throw err.badRequest('Email is required');
    if (!email.includes('@')) throw err.badRequest('Invalid email format');
    if (!name) throw err.badRequest('Name is required');
    if (!password || password.length < 8) {
      throw err.badRequest('Password must be at least 8 characters');
    }

    // 2. Business logic validation
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      throw err.conflict('Email already registered');
    }

    // 3. Secure data processing
    const hashedPassword = await auth.hashPassword(password);
    const encryptedPhone = req.body.phone
      ? secure.encrypt(req.body.phone)
      : null;

    // 4. Database operation with error handling
    try {
      const user = await db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          encryptedPhone,
        },
      });

      // 5. Generate auth token
      const token = auth.signToken({
        userId: user.id,
        role: 'user',
        level: 'basic',
      });

      // 6. Log successful registration
      log.info('User registered', {
        userId: user.id,
        email: user.email,
      });

      res.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (dbError) {
      log.error('Registration failed', {
        error: dbError.message,
        email,
      });
      throw err.serverError('Registration failed');
    }
  })
);

// Secure user profile update endpoint
app.put(
  '/api/profile',
  auth.requireLogin(),
  err.asyncRoute(async (req, res) => {
    const user = auth.user(req);

    // Input sanitization
    const name = secure.input(req.body.name, { maxLength: 50 });
    const bio = secure.html(req.body.bio, {
      allowedTags: ['p', 'b', 'i', 'em', 'strong'],
    });

    if (!name) throw err.badRequest('Name is required');

    // Update with encrypted sensitive data
    const updateData = { name, bio };
    if (req.body.phone) {
      updateData.encryptedPhone = secure.encrypt(req.body.phone);
    }

    const updatedUser = await db.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    log.info('Profile updated', { userId: user.userId });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        bio: updatedUser.bio,
      },
    });
  })
);
```

---

## 📋 QUICK CHECKLIST FOR LLMs

- [ ] Always use direct module imports (`@voilajsx/appkit/error`)
- [ ] Always use `module.get()` pattern for system modules
- [ ] Use semantic error types (`badRequest`, `unauthorized`, `forbidden`,
      `notFound`, `serverError`)
- [ ] Put session middleware BEFORE CSRF protection
- [ ] Put error handling middleware LAST in Express
- [ ] Wrap async routes with `err.asyncRoute()`
- [ ] Always sanitize user input with `secure.input()` and `secure.html()`
- [ ] Set required security environment variables
- [ ] Use rate limiting on public endpoints
- [ ] Encrypt sensitive data before storing in database
- [ ] Log security events and errors with structured data

# PART 5: PRODUCTION & TESTING - VERIFIED ACCURATE FOR LLMs

## 🚀 LLM Quick Reference - Copy These Exact Patterns

```javascript
// Production deployment essentials - ALWAYS use these patterns
import { configure } from '@voilajsx/appkit/config';
import { logger } from '@voilajsx/appkit/logging';

// Core pattern for production apps
const config = configure.get();
const log = logger.get('app');
```

---

## ENVIRONMENT VALIDATION

### When to Use

✅ **All production applications, startup configuration, deployment scripts**  
❌ **Runtime configuration changes, user preferences**

### Core Pattern

```javascript
// ALWAYS validate environment at startup
function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const required = ['VOILA_AUTH_SECRET', 'DATABASE_URL', 'REDIS_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  console.log('✅ Production environment validated');
}
```

### Essential Validation Patterns

```javascript
// 1. Startup validation (CRITICAL)
function validateConfig() {
  try {
    const config = configure.get();

    // Required for all environments
    config.getRequired('database.url');
    config.getRequired('auth.secret');

    // Production-specific validation
    if (configure.isProduction()) {
      config.getRequired('redis.url');
      config.getRequired('email.api.key');
      config.getRequired('security.csrf.secret');
    }

    console.log('✅ Configuration validation passed');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    process.exit(1);
  }
}

// 2. Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test critical services
    const dbHealth = await database.health();
    const cacheHealth = caching.hasRedis() ? await caching.ping() : true;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.healthy,
        cache: cacheHealth,
        environment: configure.getEnvironment(),
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
    });
  }
});
```

---

## GRACEFUL SHUTDOWN

### When to Use

✅ **All production applications, containerized deployments, process
managers**  
❌ **Development scripts, one-time utilities**

### Core Pattern

```javascript
// ALWAYS implement graceful shutdown
async function gracefulShutdown() {
  console.log('🔄 Shutting down gracefully...');

  try {
    await database.disconnect();
    await queue.close();
    await logger.flush();

    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Shutdown error:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### Advanced Shutdown Pattern

```javascript
// Production-ready shutdown with timeout
let shutdownInProgress = false;

async function gracefulShutdown(signal) {
  if (shutdownInProgress) return;
  shutdownInProgress = true;

  console.log(`🔄 Received ${signal}, shutting down gracefully...`);

  const shutdown = async () => {
    try {
      // Close server first (stop accepting new connections)
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }

      // Close services in reverse dependency order
      await queue.close(); // Stop processing jobs
      await database.disconnect(); // Close DB connections
      await logger.flush(); // Write remaining logs

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Shutdown error:', error);
      process.exit(1);
    }
  };

  // Force shutdown after timeout
  const forceShutdown = setTimeout(() => {
    console.error('⚠️ Force shutdown after timeout');
    process.exit(1);
  }, 10000); // 10 seconds

  await shutdown();
  clearTimeout(forceShutdown);
}

['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});
```

---

## MODULE INITIALIZATION ORDER

### Dependency Order (CRITICAL)

```javascript
// ALWAYS follow this exact order:
// 1. Utils (no dependencies)
// 2. Config (no dependencies)
// 3. Logging (depends on Config)
// 4. Error (depends on Config + Logging)
// 5. Auth (depends on Config + Error)
// 6. Security (depends on Config + Error)
// 7. Database (depends on Config + Logging + Error)
// 8. Cache (depends on Config + Logging)
// 9. Storage (depends on Config + Logging + Error)
// 10. Email (depends on Config + Logging + Error)
// 11. Queue (depends on Config + Logging + Error)
```

### Safe Initialization Pattern

```javascript
async function initializeApp() {
  try {
    // 1. Core utilities first
    const config = configure.get();
    const log = logger.get('init');

    // 2. Validate configuration
    validateConfig();

    // 3. Initialize database
    const db = database.get();
    const dbHealth = await db.$queryRaw`SELECT 1`;
    log.info('Database connected');

    // 4. Initialize other services
    const cache = caching.get('app');
    const queue = queuing.get();

    log.info('✅ App initialized successfully');
    return { config, log, db, cache, queue };
  } catch (error) {
    console.error('❌ App initialization failed:', error.message);
    process.exit(1);
  }
}
```

---

## TESTING PATTERNS

### When to Use

✅ **Unit tests, integration tests, CI/CD pipelines**  
❌ **Production environments, manual testing only**

### Module Reset Pattern

```javascript
import { utility, logger, caching, configure } from '@voilajsx/appkit';

describe('App Tests', () => {
  beforeEach(() => {
    // Force test configuration
    configure.reset({
      database: { url: 'memory://test' },
      cache: { strategy: 'memory' },
      logging: { level: 'silent' },
    });
  });

  afterEach(async () => {
    // ALWAYS reset module state between tests
    utility.clearCache();
    await logger.clear();
    await caching.clear();
    configure.clearCache();
  });

  test('should process data safely', () => {
    const utils = utility.get();
    const result = utils.get({ user: { name: 'John' } }, 'user.name');
    expect(result).toBe('John');
  });
});
```

### Database Testing Pattern

```javascript
describe('Database Tests', () => {
  let db;

  beforeAll(async () => {
    // Set test database
    configure.reset({
      database: { url: 'memory://test' },
    });
    db = database.get();
  });

  beforeEach(async () => {
    // Clean database before each test
    await db.$executeRaw`TRUNCATE TABLE users, posts CASCADE`;
  });

  afterAll(async () => {
    await database.disconnect();
    configure.clearCache();
  });

  test('should create user', async () => {
    const user = await db.user.create({
      data: { email: 'test@example.com', name: 'Test' },
    });
    expect(user.email).toBe('test@example.com');
  });
});
```

---

## PRODUCTION DEPLOYMENT

### Environment Variables Checklist

```bash
# ✅ Framework (Required in production)
NODE_ENV=production
VOILA_AUTH_SECRET=your-super-secure-jwt-secret-key-minimum-32-chars
VOILA_SECURITY_CSRF_SECRET=your-csrf-secret-key-minimum-32-chars
VOILA_SECURITY_ENCRYPTION_KEY=64-char-hex-encryption-key-for-aes256

# ✅ Services (Required)
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://user:password@host:6379

# ✅ Email (Choose one)
RESEND_API_KEY=re_your_api_key
# OR SMTP_HOST=smtp.gmail.com

# ✅ Storage (Choose one)
CLOUDFLARE_R2_BUCKET=your-bucket
# OR AWS_S3_BUCKET=your-bucket

# ✅ Application
APP_NAME=Your Production App
APP_URL=https://yourapp.com
```

### Docker Deployment Pattern

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/app
      - REDIS_URL=redis://redis:6379
      - VOILA_AUTH_SECRET=${VOILA_AUTH_SECRET}
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## ⚠️ COMMON LLM MISTAKES

```javascript
// ❌ WRONG - Missing startup validation
app.listen(3000, () => {
  console.log('Server started'); // No validation!
});

// ✅ CORRECT - Validate before starting
validateConfig();
initializeApp().then(() => {
  app.listen(3000, () => {
    console.log('✅ Server ready');
  });
});

// ❌ WRONG - No graceful shutdown
process.exit(0); // Abrupt shutdown

// ✅ CORRECT - Graceful shutdown
process.on('SIGTERM', gracefulShutdown);

// ❌ WRONG - Wrong module initialization order
const db = database.get();
const config = configure.get(); // Should be first!

// ✅ CORRECT - Proper order
const config = configure.get();
const log = logger.get();
const db = database.get();

// ❌ WRONG - No test cleanup
test('should work', () => {
  // No cleanup between tests!
});

// ✅ CORRECT - Proper test cleanup
afterEach(async () => {
  await logger.clear();
  configure.clearCache();
});

// ❌ WRONG - Missing required environment variables
const dbUrl = process.env.DATABASE_URL; // Might be undefined

// ✅ CORRECT - Validate required config
const config = configure.get();
const dbUrl = config.getRequired('database.url'); // Throws if missing
```

---

## 🔄 COMPLETE PRODUCTION SETUP

```javascript
// Complete production application setup
import express from 'express';
import session from 'express-session';
import { utility } from '@voilajsx/appkit/utils';
import { configure } from '@voilajsx/appkit/config';
import { logger } from '@voilajsx/appkit/logging';
import { error } from '@voilajsx/appkit/error';
import { authenticator } from '@voilajsx/appkit/auth';
import { security } from '@voilajsx/appkit/security';
import { database } from '@voilajsx/appkit/database';

const app = express();

// 1. Initialize core modules
const utils = utility.get();
const config = configure.get();
const log = logger.get('app');
const err = error.get();
const auth = authenticator.get();
const secure = security.get();

// 2. Startup validation
function validateEnvironment() {
  try {
    config.getRequired('database.url');
    config.getRequired('auth.secret');

    if (configure.isProduction()) {
      config.getRequired('redis.url');
      config.getRequired('security.csrf.secret');
    }

    log.info('✅ Environment validation passed');
  } catch (error) {
    log.error('❌ Environment validation failed', { error: error.message });
    process.exit(1);
  }
}

// 3. Application initialization
async function initializeApp() {
  validateEnvironment();

  try {
    const db = database.get();

    // Test database connection
    await db.$queryRaw`SELECT 1`;
    log.info('Database connected successfully');

    log.info('🚀 Application initialized', {
      environment: configure.getEnvironment(),
      port: config.get('server.port', 3000),
    });
  } catch (error) {
    log.error('💥 Application initialization failed', { error: error.message });
    process.exit(1);
  }
}

// 4. Middleware setup (ORDER CRITICAL)
app.use(express.json({ limit: '10mb' }));
app.use(
  session({
    secret: config.getRequired('session.secret'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: configure.isProduction(),
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(secure.forms()); // CSRF protection
app.use('/api', secure.requests(100, 900000)); // Rate limiting

// 5. Request logging
app.use((req, res, next) => {
  req.requestId = utils.uuid();
  req.log = log.child({
    requestId: req.requestId,
    method: req.method,
    url: req.url,
  });

  const startTime = Date.now();
  res.on('finish', () => {
    req.log.info('Request completed', {
      statusCode: res.statusCode,
      duration: Date.now() - startTime,
    });
  });

  next();
});

// 6. Health check
app.get('/health', async (req, res) => {
  try {
    const db = database.get();
    await db.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: configure.getEnvironment(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
    });
  }
});

// 7. Application routes
app.use('/api', routes);

// 8. Error handling (MUST BE LAST)
app.use(err.handleErrors());

// 9. Graceful shutdown
async function gracefulShutdown(signal) {
  log.info(`🔄 Received ${signal}, shutting down gracefully`);

  try {
    await database.disconnect();
    await logger.flush();

    log.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    log.error('❌ Shutdown error', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 10. Start server
const port = config.get('server.port', 3000);
const host = config.get('server.host', '0.0.0.0');

initializeApp()
  .then(() => {
    app.listen(port, host, () => {
      log.info('🌟 Server ready', { port, host });
    });
  })
  .catch((error) => {
    log.error('💥 Server startup failed', { error: error.message });
    process.exit(1);
  });
```

---

## 📋 QUICK CHECKLIST FOR LLMs

- [ ] Always validate environment variables at startup
- [ ] Follow exact module initialization order (Utils → Config → Logging → etc.)
- [ ] Implement graceful shutdown for all production apps
- [ ] Reset module state between tests (`utility.clearCache()`, etc.)
- [ ] Use health check endpoints for monitoring
- [ ] Set up proper middleware order (session → CSRF → rate limiting → error
      handling)
- [ ] Test database connections before starting server
- [ ] Use structured logging with request IDs
- [ ] Handle Docker signals properly (SIGTERM, SIGINT)
- [ ] Set all required environment variables for production
