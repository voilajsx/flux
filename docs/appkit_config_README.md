# @voilajsx/appkit - Config Module ⚙️

[![npm version](https://img.shields.io/npm/v/@voilajsx/appkit.svg)](https://www.npmjs.com/package/@voilajsx/appkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Ultra-simple, convention-driven configuration management that just works

**One function** returns a config object with automatic environment variable
parsing. Zero configuration files needed, production-ready validation by
default, with built-in type conversion and smart defaults.

## 🚀 Why Choose This?

- **⚡ One Function** - Just `configure.get()`, everything else is automatic
- **🔩 UPPER_SNAKE\_\_CASE Convention** - `DATABASE__HOST` becomes
  `config.get('database.host')`
- **🔧 Zero Configuration** - No config files, no setup, just environment
  variables
- **🛡️ Type-Safe** - Automatic conversion: `"true"` → `true`, `"123"` → `123`
- **🌍 Environment-First** - Perfect compatibility with Docker, Vercel, Railway,
  etc.
- **🔍 Production Validation** - Validates critical config at startup
- **🤖 AI-Ready** - Optimized for LLM code generation

## 📦 Installation

```bash
npm install @voilajsx/appkit
```

## 🏃‍♂️ Quick Start (30 seconds)

### 1. Set Environment Variables

```bash
# Database settings
DATABASE__HOST=localhost
DATABASE__PORT=5432
DATABASE__CREDENTIALS__USER=admin
DATABASE__CREDENTIALS__PASSWORD=secret

# Feature flags
FEATURES__ENABLE_BETA=true
FEATURES__MAX_UPLOADS=100

# API settings
API__BASE_URL=https://api.example.com
API__TIMEOUT=30000
API__RATE_LIMIT=1000
```

### 2. Use in Your Code

```typescript
import { configure } from "@voilajsx/appkit/config";

const config = configure.get();

// Access nested values with dot notation (all properly typed!)
const dbHost = config.get("database.host"); // 'localhost'
const dbPort = config.get("database.port"); // 5432 (number!)
const dbUser = config.get("database.credentials.user"); // 'admin'
const isBeta = config.get("features.enable_beta"); // true (boolean!)
const maxUploads = config.get("features.max_uploads"); // 100 (number!)

// Get with defaults
const timeout = config.get("redis.timeout", 5000); // 5000 if not set
const retries = config.get("api.retries", 3); // 3 if not set

// Check if config exists
if (config.has("features.enable_beta")) {
  console.log("Beta features are configured");
}

console.log(`Connecting to ${dbUser}@${dbHost}:${dbPort}`);
```

**That's it!** All your environment variables are available in a clean,
structured, and type-safe object.

## 🧠 Mental Model

### **The UPPER_SNAKE\_\_CASE Convention**

This is the core innovation. Double underscores (`__`) create nesting:

```bash
# Environment Variable → Config Path
DATABASE__HOST=localhost                    → config.get('database.host')
DATABASE__CONNECTION__POOL_SIZE=10         → config.get('database.connection.pool_size')
STRIPE__API__KEYS__PUBLIC=pk_test_123      → config.get('stripe.api.keys.public')
FEATURES__ANALYTICS__ENABLED=true          → config.get('features.analytics.enabled')
```

### **Automatic Type Conversion**

No manual parsing needed:

```bash
# String values
API__BASE_URL=https://api.com              → "https://api.com"

# Number values
DATABASE__PORT=5432                        → 5432
API__TIMEOUT=30000                         → 30000

# Boolean values
FEATURES__ENABLE_BETA=true                 → true
DEBUG__VERBOSE=false                       → false

# Special handling
USER__ID=0123456789                        → "0123456789" (keeps leading zero)
```

## 📖 Complete API Reference

### Core Function

```typescript
const config = configure.get(); // One function, everything you need
```

### Configuration Access Methods

```typescript
// Get value with optional default
config.get<string>("database.host", "localhost");
config.get<number>("database.port", 5432);
config.get<boolean>("features.enable_beta", false);

// Get required value (throws if missing)
config.getRequired<string>("database.url");

// Check if config exists
config.has("features.enable_beta"); // true/false

// Get multiple related values
config.getMany({
  host: "database.host",
  port: "database.port",
  user: "database.credentials.user",
}); // { host: '...', port: 5432, user: '...' }

// Get entire config (for debugging)
config.getAll(); // Complete config object
```

### Environment Helper Methods

```typescript
// Environment detection
configure.isDevelopment(); // NODE_ENV === 'development'
configure.isProduction(); // NODE_ENV === 'production'
configure.isTest(); // NODE_ENV === 'test'
configure.getEnvironment(); // Current NODE_ENV value

// Module-specific configuration
configure.getModuleConfig("database", {
  host: "localhost",
  port: 5432,
}); // Gets all 'database.*' config with defaults

// Startup validation
configure.validateRequired(["database.url", "api.key"]); // Throws with helpful errors if missing
```

### Utility Methods

```typescript
// Get all UPPER_SNAKE__CASE environment variables
configure.getEnvVars(); // { DATABASE__HOST: 'localhost', ... }

// Reset for testing
configure.reset(customConfig); // Reset with custom config
configure.clearCache(); // Clear cached config
```

## 🎯 Usage Examples

### **Express Server Configuration**

```typescript
import express from "express";
import { configure } from "@voilajsx/appkit/config";

const config = configure.get();

const app = express();

// Get server configuration
const port = config.get("server.port", 3000);
const host = config.get("server.host", "0.0.0.0");
const cors = config.get("server.cors.enabled", true);

// Database configuration
const dbConfig = config.getMany({
  host: "database.host",
  port: "database.port",
  name: "database.name",
  user: "database.credentials.user",
  password: "database.credentials.password",
});

console.log(`Server starting on ${host}:${port}`);
console.log(
  `Database: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`,
);

app.listen(port, host);
```

**Environment Variables:**

```bash
SERVER__PORT=3000
SERVER__HOST=0.0.0.0
SERVER__CORS__ENABLED=true
DATABASE__HOST=localhost
DATABASE__PORT=5432
DATABASE__NAME=myapp
DATABASE__CREDENTIALS__USER=admin
DATABASE__CREDENTIALS__PASSWORD=secret
```

### **Module-Specific Configuration**

```typescript
// Database module
class DatabaseService {
  constructor() {
    const config = configure.get();

    // Get all database config with defaults
    this.config = config.getModuleConfig("database", {
      host: "localhost",
      port: 5432,
      pool: { min: 2, max: 10 },
      ssl: false,
    });

    // Validate required values
    configure.validateRequired([
      "database.credentials.user",
      "database.credentials.password",
    ]);
  }

  connect() {
    const { host, port, credentials, ssl } = this.config;
    console.log(
      `Connecting to ${credentials.user}@${host}:${port} (SSL: ${ssl})`,
    );
  }
}

// Redis module
class CacheService {
  constructor() {
    const config = configure.get();

    this.redis = {
      url: config.getRequired("redis.url"),
      ttl: config.get("redis.ttl", 3600),
      maxRetries: config.get("redis.max_retries", 3),
    };
  }
}
```

**Environment Variables:**

```bash
# Database
DATABASE__HOST=db.example.com
DATABASE__PORT=5432
DATABASE__CREDENTIALS__USER=app_user
DATABASE__CREDENTIALS__PASSWORD=secure_password
DATABASE__POOL__MIN=2
DATABASE__POOL__MAX=10
DATABASE__SSL=true

# Redis
REDIS__URL=redis://localhost:6379
REDIS__TTL=7200
REDIS__MAX_RETRIES=5
```

### **Feature Flags & Environment-Specific Config**

```typescript
import { configure } from "@voilajsx/appkit/config";

const config = configure.get();

class FeatureService {
  constructor() {
    // Environment-based feature toggles
    this.features = {
      analytics: config.get("features.analytics.enabled", false),
      betaUI: config.get("features.beta_ui.enabled", false),
      aiSearch: config.get(
        "features.ai_search.enabled",
        configure.isProduction(),
      ),
      debugMode: config.get(
        "features.debug.enabled",
        configure.isDevelopment(),
      ),
    };

    // Environment-specific API endpoints
    this.endpoints = configure.isProduction()
      ? {
          api: config.getRequired("api.production.base_url"),
          ws: config.getRequired("websocket.production.url"),
        }
      : {
          api: config.get("api.development.base_url", "http://localhost:8080"),
          ws: config.get("websocket.development.url", "ws://localhost:8080"),
        };
  }

  isFeatureEnabled(feature: string): boolean {
    return this.features[feature] || false;
  }
}
```

**Environment Variables:**

```bash
# Development
NODE_ENV=development
FEATURES__ANALYTICS__ENABLED=false
FEATURES__BETA_UI__ENABLED=true
FEATURES__DEBUG__ENABLED=true
API__DEVELOPMENT__BASE_URL=http://localhost:8080

# Production
NODE_ENV=production
FEATURES__ANALYTICS__ENABLED=true
FEATURES__AI_SEARCH__ENABLED=true
API__PRODUCTION__BASE_URL=https://api.myapp.com
WEBSOCKET__PRODUCTION__URL=wss://ws.myapp.com
```

### **Startup Validation & Health Checks**

```typescript
import { configure } from "@voilajsx/appkit/config";

// Validate critical configuration at startup
async function validateAppConfig() {
  const config = configure.get();

  try {
    // Validate required configuration
    configure.validateRequired(["database.url", "redis.url", "api.key"]);

    // Production-specific validation
    if (configure.isProduction()) {
      configure.validateRequired([
        "monitoring.sentry.dsn",
        "email.smtp.host",
        "cdn.base_url",
      ]);
    }

    console.log("✅ Configuration validation passed");

    // Log configuration summary (without secrets)
    const summary = {
      environment: configure.getEnvironment(),
      database: {
        host: config.get("database.host"),
        port: config.get("database.port"),
      },
      features: {
        analytics: config.get("features.analytics.enabled"),
        beta: config.get("features.beta_ui.enabled"),
      },
    };

    console.log("📋 Configuration Summary:", summary);
  } catch (error) {
    console.error("❌ Configuration validation failed:", error.message);
    process.exit(1);
  }
}

// Call at app startup
validateAppConfig();
```

### **Docker & Container Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Environment variables will be set by container orchestration
CMD ["npm", "start"]
```

```bash
# Docker run with environment variables
docker run -d \
  -e NODE_ENV=production \
  -e VOILA_SERVICE_NAME=my-app \
  -e DATABASE__HOST=postgres.internal \
  -e DATABASE__PORT=5432 \
  -e DATABASE__CREDENTIALS__USER=app_user \
  -e DATABASE__CREDENTIALS__PASSWORD=secure_pass \
  -e REDIS__URL=redis://redis.internal:6379 \
  -e FEATURES__ANALYTICS__ENABLED=true \
  my-app:latest
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    image: my-app:latest
    environment:
      NODE_ENV: production
      VOILA_SERVICE_NAME: my-app
      DATABASE__HOST: postgres
      DATABASE__PORT: 5432
      DATABASE__CREDENTIALS__USER: app_user
      DATABASE__CREDENTIALS__PASSWORD: secure_pass
      REDIS__URL: redis://redis:6379
      FEATURES__ANALYTICS__ENABLED: true
```

## 🌍 Environment Variable Patterns

### **Common Patterns**

```bash
# Service identification
VOILA_SERVICE_NAME=my-awesome-app
NODE_ENV=production

# Database configuration
DATABASE__HOST=localhost
DATABASE__PORT=5432
DATABASE__NAME=myapp
DATABASE__CREDENTIALS__USER=admin
DATABASE__CREDENTIALS__PASSWORD=secret
DATABASE__POOL__MIN=2
DATABASE__POOL__MAX=10
DATABASE__SSL__ENABLED=true

# Cache configuration
REDIS__URL=redis://localhost:6379
REDIS__TTL=3600
REDIS__MAX_RETRIES=3
REDIS__KEY_PREFIX=myapp

# External APIs
STRIPE__API__KEYS__SECRET=sk_live_...
STRIPE__API__KEYS__PUBLIC=pk_live_...
SENDGRID__API_KEY=SG....
SENTRY__DSN=https://...

# Feature flags
FEATURES__ANALYTICS__ENABLED=true
FEATURES__BETA_UI__ENABLED=false
FEATURES__AI_SEARCH__ENABLED=true
FEATURES__DEBUG__VERBOSE=false

# Application settings
APP__CORS__ORIGINS=https://myapp.com,https://admin.myapp.com
APP__RATE_LIMIT__REQUESTS_PER_MINUTE=1000
APP__FILE_UPLOAD__MAX_SIZE=10485760
APP__SESSION__TIMEOUT=3600
```

### **Platform-Specific Examples**

#### **Vercel**

```bash
# vercel.json or .env.local
NODE_ENV=production
DATABASE__URL=postgresql://user:pass@host:5432/db
REDIS__URL=redis://user:pass@host:6379
```

#### **Railway**

```bash
# Railway environment variables
NODE_ENV=production
DATABASE__URL=${DATABASE_URL}  # Railway provides this
REDIS__URL=${REDIS_URL}        # Railway provides this
```

#### **AWS Lambda**

```bash
# Serverless environment
NODE_ENV=production
AWS__REGION=us-east-1
DATABASE__HOST=${RDS_HOSTNAME}
REDIS__CLUSTER__ENDPOINT=${ELASTICACHE_ENDPOINT}
```

#### **Kubernetes**

```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  NODE_ENV: "production"
  DATABASE__HOST: "postgres-service"
  DATABASE__PORT: "5432"
  REDIS__URL: "redis://redis-service:6379"
  FEATURES__ANALYTICS__ENABLED: "true"
```

## 🔧 Advanced Features

### **Custom Configuration Sources**

```typescript
import { configure } from "@voilajsx/appkit/config";

// Override with custom config (useful for testing)
const config = configure.get({
  database: {
    host: "test-db",
    port: 5433,
  },
  features: {
    debug: { enabled: true },
  },
});

// Reset with new configuration
const testConfig = configure.reset({
  app: { environment: "test" },
  database: { host: "localhost" },
});
```

### **Type-Safe Configuration Schemas**

```typescript
// Define your app's configuration interface
interface MyAppConfig {
  database: {
    host: string;
    port: number;
    credentials: {
      user: string;
      password: string;
    };
  };
  features: {
    analytics: { enabled: boolean };
    beta: { enabled: boolean };
  };
}

// Use with type safety
const config = configure.get();
const dbHost = config.get<string>("database.host"); // Typed as string
const dbPort = config.get<number>("database.port"); // Typed as number
const analyticsEnabled = config.get<boolean>("features.analytics.enabled"); // Typed as boolean
```

### **Configuration Validation Schemas**

```typescript
// Startup validation with custom rules
function validateDatabaseConfig() {
  const config = configure.get();

  const dbHost = config.getRequired<string>("database.host");
  const dbPort = config.get<number>("database.port", 5432);

  if (dbPort < 1 || dbPort > 65535) {
    throw new Error(
      `Invalid database port: ${dbPort}. Must be between 1 and 65535.`,
    );
  }

  if (configure.isProduction() && dbHost === "localhost") {
    throw new Error("Production database cannot use localhost");
  }
}
```

## 🧪 Testing

### **Test Configuration**

```typescript
import { configure } from "@voilajsx/appkit/config";

describe("Configuration Tests", () => {
  beforeEach(() => {
    // Clear cache before each test
    configure.clearCache();
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.TEST_CONFIG__VALUE;
  });

  test("should parse environment variables correctly", () => {
    // Set test environment variables
    process.env.TEST_CONFIG__VALUE = "test-value";
    process.env.TEST_CONFIG__NUMBER = "123";
    process.env.TEST_CONFIG__BOOLEAN = "true";

    const config = configure.get();

    expect(config.get("test_config.value")).toBe("test-value");
    expect(config.get("test_config.number")).toBe(123);
    expect(config.get("test_config.boolean")).toBe(true);
  });

  test("should use defaults when environment variables are missing", () => {
    const config = configure.get();

    expect(config.get("missing.value", "default")).toBe("default");
    expect(config.get("missing.number", 42)).toBe(42);
  });

  test("should validate required configuration", () => {
    expect(() => {
      configure.validateRequired(["missing.required.value"]);
    }).toThrow("Missing required configuration");
  });
});
```

### **Mock Configuration for Tests**

```typescript
// Test helper for mocking configuration
function createTestConfig(overrides = {}) {
  return configure.reset({
    app: {
      name: "test-app",
      environment: "test",
    },
    database: {
      host: "localhost",
      port: 5432,
      credentials: {
        user: "test_user",
        password: "test_pass",
      },
    },
    ...overrides,
  });
}

// Use in tests
describe("Database Service", () => {
  test("should connect with test configuration", () => {
    const config = createTestConfig({
      database: { host: "test-db-host" },
    });

    const dbService = new DatabaseService();
    expect(dbService.host).toBe("test-db-host");
  });
});
```

## 🤖 LLM Guidelines

### **Essential Patterns**

```typescript
// ✅ ALWAYS use these patterns
import { configure } from "@voilajsx/appkit/config";
const config = configure.get();

// ✅ Correct configuration access
const dbHost = config.get("database.host", "localhost");
const dbPort = config.get<number>("database.port", 5432);
const isEnabled = config.get<boolean>("features.beta.enabled", false);

// ✅ Required configuration with helpful errors
const apiKey = config.getRequired<string>("api.key");

// ✅ Environment-specific logic
if (configure.isProduction()) {
  // Production-only code
}

// ✅ Startup validation
configure.validateRequired(["database.url", "api.key"]);

// ✅ Module configuration
const dbConfig = configure.getModuleConfig("database", {
  host: "localhost",
  port: 5432,
});
```

### **Anti-Patterns to Avoid**

```typescript
// ❌ DON'T access process.env directly
const dbHost = process.env.DATABASE__HOST; // Use config.get() instead

// ❌ DON'T manually parse environment variables
const port = parseInt(process.env.PORT || "3000"); // Automatic parsing provided

// ❌ DON'T use unsafe type assertions
const value = config.get("some.value") as string; // Use get<string>() instead

// ❌ DON'T ignore missing required config
const apiKey = config.get("api.key") || "fallback"; // Use getRequired() instead

// ❌ DON'T create multiple config instances
const config1 = configure.get();
const config2 = configure.get(); // Same instance, but inefficient

// ❌ DON'T forget error handling for required config
const dbUrl = config.getRequired("database.url"); // This can throw - handle it!
```

### **Common Patterns**

```typescript
// Configuration with defaults
const serverConfig = {
  port: config.get<number>("server.port", 3000),
  host: config.get<string>("server.host", "0.0.0.0"),
  cors: config.get<boolean>("server.cors.enabled", true),
};

// Environment-based configuration
const apiEndpoint = configure.isProduction()
  ? config.getRequired<string>("api.production.url")
  : config.get<string>("api.development.url", "http://localhost:8080");

// Module initialization with validation
class DatabaseService {
  constructor() {
    // Validate required config at startup
    configure.validateRequired(["database.url"]);

    this.config = configure.getModuleConfig("database", {
      pool: { min: 2, max: 10 },
      ssl: configure.isProduction(),
    });
  }
}

// Feature flag checking
function shouldEnableFeature(featureName: string): boolean {
  const config = configure.get();
  return config.get<boolean>(`features.${featureName}.enabled`, false);
}
```

## 📈 Performance

- **Environment Parsing**: Once per application startup (~2ms)
- **Configuration Access**: ~0.01ms per `get()` call
- **Memory Usage**: <500KB overhead
- **Type Conversion**: Cached after first access
- **Validation**: Only runs during startup

## 🔍 TypeScript Support

Full TypeScript support with comprehensive interfaces:

```typescript
import type { ConfigValue, AppConfig } from "@voilajsx/appkit/config";

// Strongly typed configuration access
const config = configure.get();
const dbPort: number = config.get<number>("database.port", 5432);
const features: boolean = config.get<boolean>("features.enabled", false);

// Custom configuration interfaces
interface DatabaseConfig {
  host: string;
  port: number;
  credentials: {
    user: string;
    password: string;
  };
}

const dbConfig: DatabaseConfig = config.getModuleConfig("database");
```

## 📄 License

MIT © [VoilaJSX](https://github.com/voilajsx)

---

<p align="center">
  Built with ❤️ in India by the <a href="https://github.com/orgs/voilajsx/people">VoilaJSX Team</a>
</p>
