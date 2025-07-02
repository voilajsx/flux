# @voilajsx/appkit/logging

> **Ultra-simple logging that just works** - One function, five transports, zero
> headaches

[![npm version](https://img.shields.io/npm/v/@voilajsx/appkit.svg)](https://www.npmjs.com/package/@voilajsx/appkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 30-Second Start

```bash
npm install @voilajsx/appkit
```

```typescript
import { logger } from "@voilajsx/appkit/logging";

const log = logger.get();
log.info("🚀 App started");
log.error("💥 Something broke", { userId: 123, error: "timeout" });

// Component logging
const dbLog = logger.get("database");
dbLog.warn("⚠️ Connection slow", { latency: "2s" });
```

**That's it!** No configuration, no setup, production-ready.

## ✨ What You Get Instantly

- **✅ Beautiful console output** - Colors, emojis, clean formatting
- **✅ File logging with rotation** - Daily rotation, automatic cleanup
- **✅ Database logging** - PostgreSQL, MySQL, SQLite support
- **✅ External services** - Datadog, Elasticsearch, Splunk
- **✅ Slack alerts** - Real-time error notifications
- **✅ Auto-detection** - Environment variables enable features
- **✅ TypeScript ready** - Full type safety and intellisense

## 🎯 One Function, Everything Works

```typescript
import { logger } from "@voilajsx/appkit/logging";

// Main logger
const log = logger.get();

// Component loggers (automatic context)
const authLog = logger.get("auth");
const dbLog = logger.get("database");
const apiLog = logger.get("api");

// Child loggers (request context)
const reqLog = log.child({ requestId: "req-123", userId: 456 });
reqLog.info("Request started"); // Includes requestId automatically
```

## 🔄 Auto-Transport Detection

The logger **automatically detects** what you need:

| Environment Variable        | Transport Enabled  | What You Get            |
| --------------------------- | ------------------ | ----------------------- |
| _Nothing_                   | Console + File     | Development logging     |
| `DATABASE_URL`              | + Database         | Centralized storage     |
| `VOILA_LOGGING_HTTP_URL`    | + External service | Professional monitoring |
| `VOILA_LOGGING_WEBHOOK_URL` | + Slack alerts     | Real-time notifications |

**Set environment variables, get enterprise features. No code changes.**

## 🏢 Production Ready

```bash
# Minimal setup for production
DATABASE_URL=postgres://user:pass@localhost/app
VOILA_LOGGING_WEBHOOK_URL=https://hooks.slack.com/services/xxx
VOILA_LOGGING_SCOPE=minimal  # Optimized for performance
```

```typescript
// Same code, production features
const log = logger.get();
log.info("User login", { userId: 123, method: "oauth" });
// → Console (colored)
// → File (logs/app-2024-01-15.log)
// → Database (logs table)
// → Slack (only errors by default)
```

## 📋 Complete API (It's Tiny)

### Core Methods

```typescript
import { logger } from '@voilajsx/appkit/logging';

const log = logger.get();           // Main logger
const log = logger.get('component'); // Component logger

log.info(message, meta?);    // Informational
log.warn(message, meta?);    // Warnings
log.error(message, meta?);   // Errors (triggers alerts)
log.debug(message, meta?);   // Debug (filtered in production)

log.child(context);          // Add context to all logs
```

### Utility Methods

```typescript
logger.clear(); // Clear state (testing)
logger.getActiveTransports(); // See what's running
logger.hasTransport("database"); // Check specific transport
logger.getConfig(); // Debug configuration
```

## 🌍 Environment Variables

### Basic Setup

```bash
# Auto-detected log level
VOILA_LOGGING_LEVEL=debug|info|warn|error  # Default: auto-detected

# Logging scope (performance vs detail)
VOILA_LOGGING_SCOPE=minimal|full           # Default: minimal

# Service identification
VOILA_SERVICE_NAME=my-app                  # Default: package.json name
```

### Transport Control

```bash
# Console (default: on except test)
VOILA_LOGGING_CONSOLE=true|false

# File (default: on except test)
VOILA_LOGGING_FILE=true|false
VOILA_LOGGING_DIR=./logs                   # Default: ./logs
VOILA_LOGGING_FILE_SIZE=50000000          # 50MB default
VOILA_LOGGING_FILE_RETENTION=30           # 30 days default

# Database (auto-enabled if DATABASE_URL exists)
VOILA_LOGGING_DATABASE=true               # Explicit opt-in
DATABASE_URL=postgres://...               # Auto-enables database logging

# HTTP (auto-enabled if URL provided)
VOILA_LOGGING_HTTP_URL=https://logs.datadog.com/api/v1/logs

# Webhook (auto-enabled if URL provided)
VOILA_LOGGING_WEBHOOK_URL=https://hooks.slack.com/services/xxx
VOILA_LOGGING_WEBHOOK_LEVEL=error         # Default: error only
```

## 💡 Real Examples

### Express API

```typescript
import express from "express";
import { logger } from "@voilajsx/appkit/logging";

const app = express();
const log = logger.get();

// Request logging middleware
app.use((req, res, next) => {
  req.log = logger.get("api").child({
    requestId: req.headers["x-request-id"] || crypto.randomUUID(),
    method: req.method,
    url: req.url,
    userAgent: req.headers["user-agent"],
  });

  req.log.info("Request started");
  next();
});

// Route with automatic context
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    req.log.debug("Fetching user", { userId: id });

    const user = await db.getUser(id);
    if (!user) {
      req.log.warn("User not found", { userId: id });
      return res.status(404).json({ error: "User not found" });
    }

    req.log.info("User fetched successfully", { userId: id });
    res.json({ user });
  } catch (error) {
    req.log.error("User fetch failed", {
      userId: id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  log.info("🚀 Server ready", {
    port: 3000,
    env: process.env.NODE_ENV,
    transports: logger.getActiveTransports(),
  });
});
```

### Fastify API

```typescript
import Fastify from "fastify";
import { logger } from "@voilajsx/appkit/logging";

const fastify = Fastify();
const log = logger.get();

// Request logging hook
fastify.addHook("onRequest", async (request, reply) => {
  request.log = logger.get("api").child({
    requestId: request.headers["x-request-id"] || crypto.randomUUID(),
    method: request.method,
    url: request.url,
  });

  request.log.info("Request started");
});

// Route with error handling
fastify.get("/health", async (request, reply) => {
  const healthLog = request.log.child({ component: "health-check" });

  try {
    healthLog.debug("Checking database connection");
    await db.ping();

    healthLog.info("Health check passed");
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    healthLog.error("Health check failed", { error: error.message });
    reply.status(503);
    return { status: "unhealthy", error: error.message };
  }
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    log.error("💥 Server failed to start", { error: err.message });
    process.exit(1);
  }

  log.info("🚀 Fastify server ready", {
    port: 3000,
    transports: logger.getActiveTransports(),
  });
});
```

### Background Worker

```typescript
import { logger } from "@voilajsx/appkit/logging";

const workerLog = logger.get("worker");

async function processEmailJob(job) {
  const jobLog = workerLog.child({
    jobId: job.id,
    jobType: job.data.type,
    userId: job.data.userId,
    attempt: job.attemptsMade + 1,
  });

  jobLog.info("📧 Job started");

  try {
    await sendEmail(job.data);

    jobLog.info("✅ Email sent successfully", {
      to: job.data.to,
      subject: job.data.subject,
      durationMs: Date.now() - job.processedOn,
    });
  } catch (error) {
    jobLog.error("💥 Email failed", {
      error: error.message,
      retryCount: job.attemptsMade,
      willRetry: job.attemptsMade < 3,
    });

    throw error; // Re-queue for retry
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  workerLog.info("👋 Worker shutting down gracefully");
  await logger.clear(); // Ensure logs are flushed
  process.exit(0);
});
```

### Error Boundary

```typescript
import { logger } from "@voilajsx/appkit/logging";

const errorLog = logger.get("error-handler");

// Global error handler
process.on("uncaughtException", (error) => {
  errorLog.error("🚨 Uncaught exception", {
    error: error.message,
    stack: error.stack,
    fatal: true,
  });

  // Flush logs before exit
  logger.clear().then(() => {
    process.exit(1);
  });
});

process.on("unhandledRejection", (reason, promise) => {
  errorLog.error("🚨 Unhandled rejection", {
    reason: reason?.toString(),
    promise: promise?.toString(),
    stack: reason?.stack,
  });
});

// Express error middleware
app.use((error, req, res, next) => {
  const requestLog = req.log || errorLog;

  requestLog.error("💥 Request error", {
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    path: req.path,
    method: req.method,
  });

  res.status(error.statusCode || 500).json({
    error: "Internal server error",
    requestId: req.log?.requestId,
  });
});
```

## 🔧 External Service Integration

### Datadog

```bash
VOILA_LOGGING_HTTP_URL=https://http-intake.logs.datadoghq.com/api/v1/input/YOUR_API_KEY
```

### Elasticsearch

```bash
VOILA_LOGGING_HTTP_URL=https://your-cluster.elastic.co:9200/logs/_bulk
```

### Splunk

```bash
VOILA_LOGGING_HTTP_URL=https://splunk.example.com:8088/services/collector
```

### Slack Alerts

```bash
VOILA_LOGGING_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## 📊 Output Examples

### Development Console

```
2024-01-15T10:30:45.123Z 🚀 Server ready [api]
2024-01-15T10:30:46.456Z ❌ ERROR Payment failed [payment]
  Card declined
```

### Production File (JSON)

```json
{"timestamp":"2024-01-15T10:30:45.123Z","level":"info","message":"Server ready","component":"api","service":"my-app","port":3000}
{"timestamp":"2024-01-15T10:30:46.456Z","level":"error","message":"Payment failed","component":"payment","error":"Card declined"}
```

### Slack Alert

```
🔸 🚨 ERROR Alert

Message: Payment failed
Component: payment
Service: my-app
Error Details: Card declined
HTTP Context: POST /api/payments (402)
User ID: 12345
Request ID: req-abc-123
```

## 🧪 Testing

```typescript
import { logger } from "@voilajsx/appkit/logging";

describe("Payment Service", () => {
  afterEach(async () => {
    // IMPORTANT: Clear logger state between tests
    await logger.clear();
  });

  test("should log payment success", async () => {
    const log = logger.get("test");
    log.info("🧪 Test started");

    const result = await processPayment("order-123", 99.99);

    expect(result.success).toBe(true);
    log.info("✅ Test passed");
  });
});
```

## 🚀 Performance

- **Startup**: < 10ms initialization
- **Memory**: < 5MB baseline usage
- **Throughput**: 10,000+ logs/second
- **File I/O**: Batched writes, no blocking
- **Network**: Smart batching for external services

## 📈 Scaling

### Development → Production

```typescript
// Same code works everywhere
const log = logger.get();
log.info("User action", { userId: 123, action: "login" });

// Development: Pretty console output
// Production: JSON files + database + Slack alerts
```

### Minimal vs Full Scope

```bash
# Development (full detail)
VOILA_LOGGING_SCOPE=full

# Production (optimized)
VOILA_LOGGING_SCOPE=minimal  # 50-70% less storage
```

### Transport Scaling

- **Small app**: Console + File
- **Growing app**: + Database for centralized logs
- **Production app**: + HTTP for monitoring (Datadog)
- **Enterprise app**: + Webhooks for real-time alerts

## 🔒 Security Best Practices

```typescript
// ✅ Safe: Log business identifiers
log.info("Payment processed", {
  orderId: payment.orderId,
  amount: payment.amount,
  cardLast4: payment.card.slice(-4), // Only last 4 digits
  userId: payment.userId,
});

// ❌ Unsafe: Never log these
log.info("Payment details", {
  cardNumber: payment.cardNumber, // Full card numbers
  cvv: payment.cvv, // Security codes
  password: user.password, // Passwords
  apiKey: process.env.API_KEY, // API keys
  token: user.authToken, // Auth tokens
});
```

## 🎯 When to Use What

### Log Levels

- **`error`**: System failures, exceptions requiring immediate attention
- **`warn`**: Potential issues, deprecated usage, performance concerns
- **`info`**: Normal business events, user actions, system state changes
- **`debug`**: Development details, internal state, performance metrics

### Transport Selection

- **Console**: Development debugging, local testing
- **File**: Persistent storage, audit trails, offline analysis
- **Database**: Centralized logging, searchable history, analytics
- **HTTP**: External monitoring, professional dashboards, alerts
- **Webhook**: Real-time notifications, team collaboration, incident response

## 🔗 VoilaJSX Integration

Works seamlessly with other VoilaJSX modules:

```typescript
import { authenticator } from "@voilajsx/appkit/auth";
import { logger } from "@voilajsx/appkit/logging";

const auth = authenticator.get();
const log = logger.get("auth");

// Log authentication events
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUser(email);
    const isValid = await auth.comparePassword(password, user.password);

    if (isValid) {
      const token = auth.signToken({
        userId: user.id,
        role: user.role,
        level: user.level,
      });

      log.info("✅ User login successful", {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: req.ip,
      });

      res.json({ token });
    } else {
      log.warn("⚠️ Invalid login attempt", {
        email: user.email,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    log.error("💥 Login error", {
      email,
      error: error.message,
      ip: req.ip,
    });

    res.status(500).json({ error: "Server error" });
  }
});
```

## 🆚 Why Not Winston/Pino?

**Other libraries:**

```javascript
// Winston: ~30 lines of configuration hell
const winston = require("winston");
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Pino: Better but still complex setup
const pino = require("pino");
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});
```

**This library:**

```typescript
// 2 lines, production ready with 5 transports
import { logger } from "@voilajsx/appkit/logging";
const log = logger.get();
```

**Same features, 90% less code, zero configuration.**

## 📄 License

MIT © [VoilaJSX](https://github.com/voilajsx)

---

<p align="center">
  <strong>Built with ❤️ by the <a href="https://github.com/voilajsx">VoilaJSX Team</a></strong><br>
  Because logging should be simple, not a PhD thesis.
</p>
