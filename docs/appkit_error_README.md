# @voilajsx/appkit - Error Module ⚠️

[![npm version](https://img.shields.io/npm/v/@voilajsx/appkit.svg)](https://www.npmjs.com/package/@voilajsx/appkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Ultra-simple semantic error handling that just works

**One function** returns an error object with semantic HTTP status codes. Zero
configuration needed, production-ready by default, with environment-aware smart
defaults and built-in Express middleware.

## 🚀 Why Choose This?

- **⚡ One Function** - Just `error.get()`, everything else is automatic
- **🎯 Semantic HTTP Codes** - `badRequest(400)`, `unauthorized(401)`,
  `notFound(404)`
- **🔧 Zero Configuration** - Smart defaults for development vs production
- **🌍 Environment-First** - Auto-detects dev/prod behavior
- **🛡️ Production-Safe** - Hides stack traces and sensitive info in production
- **🔄 Express Integration** - Built-in middleware and async route wrapper
- **🤖 AI-Ready** - Optimized for LLM code generation

## 📦 Installation

```bash
npm install @voilajsx/appkit
```

## 🏃‍♂️ Quick Start (30 seconds)

```typescript
import { error } from "@voilajsx/appkit/error";

const err = error.get();

// Create semantic HTTP errors
throw err.badRequest("Email is required"); // 400
throw err.unauthorized("Login required"); // 401
throw err.forbidden("Admin access required"); // 403
throw err.notFound("User not found"); // 404
throw err.conflict("Email already exists"); // 409
throw err.serverError("Database connection failed"); // 500

// Express app setup
app.use(err.handleErrors()); // Global error middleware

app.post(
  "/users",
  err.asyncRoute(async (req, res) => {
    if (!req.body.email) throw err.badRequest("Email required");
    const user = await createUser(req.body);
    res.json({ user });
  }),
);
```

**That's it!** Semantic errors with automatic Express middleware handling.

## 🧠 Mental Model

### **HTTP Status Code Semantics**

```typescript
// 4xx - Client Errors (don't retry)
err.badRequest(); // 400 - Invalid input data
err.unauthorized(); // 401 - Authentication required
err.forbidden(); // 403 - Access denied
err.notFound(); // 404 - Resource missing
err.conflict(); // 409 - Business logic conflicts

// 5xx - Server Errors (retry with backoff)
err.serverError(); // 500 - Internal failures
```

### **Error Response Flow**

```
Request → Route Handler → Business Logic → Error Thrown → Middleware → Client
```

### **Environment Behavior**

```typescript
// Development
{
  "error": "BAD_REQUEST",
  "message": "Email is required",
  "stack": "Error: Email is required\n    at ..." // 🔍 Debug info
}

// Production
{
  "error": "BAD_REQUEST",
  "message": "Email is required"
  // ✅ No stack trace for security
}
```

## 📖 Complete API Reference

### Core Function

```typescript
const err = error.get(); // One function, everything you need
```

### Error Creation Methods

```typescript
// Client errors (4xx) - Input/auth issues
err.badRequest(message?);   // 400 - Invalid input
err.unauthorized(message?); // 401 - Auth required
err.forbidden(message?);    // 403 - Access denied
err.notFound(message?);     // 404 - Resource missing
err.conflict(message?);     // 409 - Business conflicts

// Server errors (5xx) - Internal failures
err.serverError(message?);  // 500 - Internal error

// Custom errors
err.createError(statusCode, message, type?); // Any status code
```

### Middleware & Utilities

```typescript
// Express middleware
err.handleErrors(options?);   // Error handling middleware
err.asyncRoute(handler);      // Async route wrapper

// Error categorization
err.isClientError(error);     // 4xx status codes
err.isServerError(error);     // 5xx status codes

// Environment helpers
error.isDevelopment();        // NODE_ENV === 'development'
error.isProduction();         // NODE_ENV === 'production'
```

### Utility Methods

```typescript
// Configuration access
error.getConfig(); // Current error configuration
error.reset(newConfig); // Reset with custom config (testing)
error.clearCache(); // Clear cached config (testing)
```

## 🎯 Usage Examples

### **Express REST API**

```typescript
import express from "express";
import { error } from "@voilajsx/appkit/error";

const app = express();
const err = error.get();

app.use(express.json());

// Global error handling (must be last)
app.use(err.handleErrors());

// User registration with validation
app.post(
  "/auth/register",
  err.asyncRoute(async (req, res) => {
    const { email, name, password } = req.body;

    // Input validation (400 errors)
    if (!email) throw err.badRequest("Email is required");
    if (!name) throw err.badRequest("Name is required");
    if (!password) throw err.badRequest("Password is required");

    if (password.length < 8) {
      throw err.badRequest("Password must be at least 8 characters");
    }

    // Business logic validation (409 errors)
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw err.conflict("Email already registered");
    }

    try {
      const user = await createUser({ email, name, password });
      res.json({ user });
    } catch (dbError) {
      // Database failures (500 errors)
      throw err.serverError("Failed to create user");
    }
  }),
);

// Authentication middleware
const requireAuth = err.asyncRoute(async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw err.unauthorized("Authentication token required");
  }

  try {
    const decoded = verifyToken(token);
    const user = await findUser(decoded.userId);

    if (!user) {
      throw err.unauthorized("Invalid token");
    }

    req.user = user;
    next();
  } catch (tokenError) {
    throw err.unauthorized("Invalid or expired token");
  }
});

// Protected routes
app.get(
  "/profile",
  requireAuth,
  err.asyncRoute(async (req, res) => {
    res.json({ user: req.user });
  }),
);

app.put(
  "/profile",
  requireAuth,
  err.asyncRoute(async (req, res) => {
    const { name, bio } = req.body;

    if (!name) throw err.badRequest("Name is required");

    try {
      const updatedUser = await updateUser(req.user.id, { name, bio });
      res.json({ user: updatedUser });
    } catch (dbError) {
      throw err.serverError("Failed to update profile");
    }
  }),
);

// Admin-only routes
app.delete(
  "/users/:id",
  requireAuth,
  err.asyncRoute(async (req, res) => {
    if (!req.user.isAdmin) {
      throw err.forbidden("Admin access required");
    }

    const targetUser = await findUser(req.params.id);
    if (!targetUser) {
      throw err.notFound("User not found");
    }

    try {
      await deleteUser(req.params.id);
      res.json({ success: true });
    } catch (dbError) {
      throw err.serverError("Failed to delete user");
    }
  }),
);

app.listen(3000);
```

### **Service Layer with Error Handling**

```typescript
import { error } from "@voilajsx/appkit/error";

const err = error.get();

class UserService {
  async createUser(userData: CreateUserData) {
    // Input validation
    if (!userData.email) throw err.badRequest("Email is required");
    if (!userData.password) throw err.badRequest("Password is required");

    // Email format validation
    if (!isValidEmail(userData.email)) {
      throw err.badRequest("Invalid email format");
    }

    // Password strength validation
    if (userData.password.length < 8) {
      throw err.badRequest("Password must be at least 8 characters");
    }

    // Business logic validation
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw err.conflict("User with this email already exists");
    }

    try {
      const hashedPassword = await hashPassword(userData.password);
      return await db.users.create({
        ...userData,
        password: hashedPassword,
      });
    } catch (dbError) {
      console.error("Database error creating user:", dbError);
      throw err.serverError("Failed to create user");
    }
  }

  async authenticateUser(email: string, password: string) {
    if (!email) throw err.badRequest("Email is required");
    if (!password) throw err.badRequest("Password is required");

    const user = await this.findByEmail(email);
    if (!user) {
      throw err.unauthorized("Invalid email or password");
    }

    try {
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        throw err.unauthorized("Invalid email or password");
      }

      return user;
    } catch (hashError) {
      throw err.serverError("Authentication failed");
    }
  }

  async updateUser(userId: string, updateData: UpdateUserData) {
    if (!userId) throw err.badRequest("User ID is required");

    const user = await this.findById(userId);
    if (!user) {
      throw err.notFound("User not found");
    }

    // Check for email conflicts if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser) {
        throw err.conflict("Email already in use");
      }
    }

    try {
      return await db.users.update(userId, updateData);
    } catch (dbError) {
      console.error("Database error updating user:", dbError);
      throw err.serverError("Failed to update user");
    }
  }

  async deleteUser(userId: string, requestingUserId: string) {
    if (!userId) throw err.badRequest("User ID is required");

    const user = await this.findById(userId);
    if (!user) {
      throw err.notFound("User not found");
    }

    const requestingUser = await this.findById(requestingUserId);

    // Permission checks
    if (userId !== requestingUserId && !requestingUser?.isAdmin) {
      throw err.forbidden("Cannot delete other users");
    }

    try {
      await db.users.delete(userId);
    } catch (dbError) {
      console.error("Database error deleting user:", dbError);
      throw err.serverError("Failed to delete user");
    }
  }

  private async findByEmail(email: string) {
    try {
      return await db.users.findByEmail(email);
    } catch (dbError) {
      throw err.serverError("Database query failed");
    }
  }

  private async findById(id: string) {
    try {
      return await db.users.findById(id);
    } catch (dbError) {
      throw err.serverError("Database query failed");
    }
  }
}
```

### **Background Job Processing**

```typescript
import { error } from "@voilajsx/appkit/error";

const err = error.get();

class EmailService {
  async processEmailJob(jobData: EmailJobData) {
    try {
      // Validate job data
      if (!jobData.email) throw err.badRequest("Email is required");
      if (!jobData.template) throw err.badRequest("Template is required");

      // Validate email format
      if (!isValidEmail(jobData.email)) {
        throw err.badRequest("Invalid email format");
      }

      // Check if recipient exists (business logic)
      const user = await findUserByEmail(jobData.email);
      if (!user) {
        throw err.notFound("Recipient not found");
      }

      // Check if user has opted out
      if (user.emailOptOut) {
        throw err.conflict("User has opted out of emails");
      }

      // Send email
      await this.sendEmail({
        to: jobData.email,
        template: jobData.template,
        data: jobData.templateData,
      });

      console.log(`Email sent successfully to ${jobData.email}`);
    } catch (error) {
      // Handle different error types for retry logic
      if (err.isClientError(error)) {
        // 4xx errors - don't retry
        console.warn(`Email job failed (client error): ${error.message}`);
        // Mark job as failed permanently
      } else if (err.isServerError(error)) {
        // 5xx errors - retry with backoff
        console.error(`Email job failed (server error): ${error.message}`);
        throw error; // Re-throw to trigger retry
      } else {
        // Unknown error
        console.error(`Email job failed (unknown error): ${error.message}`);
        throw err.serverError("Email processing failed");
      }
    }
  }

  private async sendEmail(emailData: EmailData) {
    try {
      // External service call
      await emailProvider.send(emailData);
    } catch (providerError) {
      // Transform provider errors to our semantic errors
      if (providerError.code === "INVALID_EMAIL") {
        throw err.badRequest("Invalid email address");
      } else if (providerError.code === "RATE_LIMITED") {
        throw err.serverError("Email service rate limited");
      } else {
        throw err.serverError("Email delivery failed");
      }
    }
  }
}
```

### **API Client with Error Handling**

```typescript
import { error } from "@voilajsx/appkit/error";

const err = error.get();

class ApiClient {
  async makeRequest(endpoint: string, options: RequestOptions) {
    try {
      const response = await fetch(endpoint, options);

      // Transform HTTP status codes to semantic errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Request failed`;

        switch (response.status) {
          case 400:
            throw err.badRequest(message);
          case 401:
            throw err.unauthorized(message);
          case 403:
            throw err.forbidden(message);
          case 404:
            throw err.notFound(message);
          case 409:
            throw err.conflict(message);
          case 500:
          default:
            throw err.serverError(message);
        }
      }

      return await response.json();
    } catch (networkError) {
      if (networkError.statusCode) {
        // Already a semantic error, re-throw
        throw networkError;
      } else {
        // Network/parsing error
        throw err.serverError("Network request failed");
      }
    }
  }
}
```

## 🌍 Environment Variables

### Smart Defaults Configuration

```bash
# Error behavior (optional - smart defaults provided)
VOILA_ERROR_STACK=false          # Show stack traces (default: true in dev, false in prod)
VOILA_ERROR_LOG=true             # Log errors to console (default: true)
VOILA_AUTH_MESSAGE="Please sign in" # Custom unauthorized message

# Node environment
NODE_ENV=production              # Affects error response format
```

### Environment-Specific Behavior

| Environment     | Stack Traces | Error Details | Logging               |
| --------------- | ------------ | ------------- | --------------------- |
| **Development** | ✅ Shown     | 🔍 Detailed   | 📝 All errors         |
| **Production**  | ❌ Hidden    | 🛡️ Generic    | 📝 Server errors only |
| **Test**        | ✅ Shown     | 🔍 Detailed   | 📝 Minimal            |

## 📊 HTTP Status Code Guide

### When to Use Each Error Type

```typescript
// 400 - Bad Request: Client input issues
throw err.badRequest("Email is required");
throw err.badRequest("Invalid email format");
throw err.badRequest("Password too short");

// 401 - Unauthorized: Authentication required
throw err.unauthorized("Login required");
throw err.unauthorized("Invalid token");
throw err.unauthorized("Token expired");

// 403 - Forbidden: Access denied
throw err.forbidden("Admin access required");
throw err.forbidden("Account suspended");
throw err.forbidden("Feature not available");

// 404 - Not Found: Resource missing
throw err.notFound("User not found");
throw err.notFound("Post not found");
throw err.notFound("Page not found");

// 409 - Conflict: Business logic issues
throw err.conflict("Email already exists");
throw err.conflict("Username taken");
throw err.conflict("Cannot delete active user");

// 500 - Server Error: Internal failures
throw err.serverError("Database connection failed");
throw err.serverError("External API timeout");
throw err.serverError("File upload failed");
```

### Infrastructure Benefits

| Status Range   | Retry Logic           | Caching        | Monitoring           |
| -------------- | --------------------- | -------------- | -------------------- |
| **4xx Client** | ❌ Don't retry        | ✅ Cache safe  | 📊 Track user errors |
| **5xx Server** | ✅ Retry with backoff | ❌ Don't cache | 🚨 Alert on failures |

## 🔧 Advanced Features

### Custom Error Middleware

```typescript
const err = error.get();

// Custom error handling with logging
app.use(
  err.handleErrors({
    showStack: error.isDevelopment(),
    logErrors: true,
  }),
);

// Additional error processing
app.use((error, req, res, next) => {
  // Custom monitoring
  if (err.isServerError(error)) {
    monitoring.recordError(error, {
      user: req.user?.id,
      endpoint: req.path,
      method: req.method,
    });
  }

  // Custom notifications
  if (error.statusCode >= 500) {
    notificationService.alertOnCall(error);
  }

  next();
});
```

### Custom Status Codes

```typescript
const err = error.get();

// Custom HTTP status codes
const rateLimitError = err.createError(
  429,
  "Rate limit exceeded",
  "RATE_LIMITED",
);
const validationError = err.createError(
  422,
  "Validation failed",
  "VALIDATION_ERROR",
);
const maintenanceError = err.createError(
  503,
  "Service unavailable",
  "MAINTENANCE",
);

throw rateLimitError;
```

### Error Categorization

```typescript
const err = error.get();

function handleJobError(error) {
  if (err.isClientError(error)) {
    // 4xx - Don't retry, log as warning
    console.warn("Job failed due to client error:", error.message);
    markJobAsFailed(error);
  } else if (err.isServerError(error)) {
    // 5xx - Retry with exponential backoff
    console.error("Job failed due to server error:", error.message);
    scheduleRetry(error);
  }
}
```

## 🧪 Testing

### Test Configuration

```typescript
import { error } from "@voilajsx/appkit/error";

describe("Error Handling", () => {
  beforeEach(() => {
    // Clear cache before each test
    error.clearCache();
  });

  test("should create appropriate error types", () => {
    const err = error.get();

    const badReq = err.badRequest("Invalid input");
    expect(badReq.statusCode).toBe(400);
    expect(badReq.type).toBe("BAD_REQUEST");

    const notFound = err.notFound("User not found");
    expect(notFound.statusCode).toBe(404);
    expect(notFound.type).toBe("NOT_FOUND");
  });

  test("should handle async routes correctly", async () => {
    const err = error.get();

    const handler = err.asyncRoute(async (req, res) => {
      throw err.badRequest("Test error");
    });

    const mockNext = jest.fn();
    await handler({}, {}, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });
});
```

### Mock Error Configuration

```typescript
// Test helper for custom error config
function createTestErrorHandler(overrides = {}) {
  return error.reset({
    messages: {
      badRequest: "Test bad request",
      unauthorized: "Test unauthorized",
      ...overrides,
    },
    middleware: {
      showStack: true,
      logErrors: false,
    },
    environment: {
      isDevelopment: true,
      isProduction: false,
      isTest: true,
      nodeEnv: "test",
    },
  });
}

describe("User Service", () => {
  test("should handle user creation errors", async () => {
    const err = createTestErrorHandler();
    const userService = new UserService(err);

    await expect(
      userService.createUser({ email: "", password: "weak" }),
    ).rejects.toThrow("Email is required");
  });
});
```

## 🤖 LLM Guidelines

### **Essential Patterns**

```typescript
// ✅ ALWAYS use these patterns
import { error } from "@voilajsx/appkit/error";
const err = error.get();

// ✅ Semantic error creation
throw err.badRequest("Email is required"); // Input validation
throw err.unauthorized("Login required"); // Authentication
throw err.forbidden("Admin access required"); // Authorization
throw err.notFound("User not found"); // Missing resources
throw err.conflict("Email already exists"); // Business conflicts
throw err.serverError("Database failed"); // Internal errors

// ✅ Express middleware setup
app.use(err.handleErrors()); // Must be last middleware

// ✅ Async route wrapping
app.post(
  "/users",
  err.asyncRoute(async (req, res) => {
    // Async logic here - errors automatically caught
  }),
);

// ✅ Error categorization
if (err.isClientError(error)) {
  // 4xx - Don't retry
} else if (err.isServerError(error)) {
  // 5xx - Retry with backoff
}
```

### **Anti-Patterns to Avoid**

```typescript
// ❌ DON'T manually create Error objects
throw new Error("Bad request"); // Use err.badRequest() instead

// ❌ DON'T use wrong status codes for error types
throw err.serverError("Invalid email"); // Use err.badRequest() instead
throw err.badRequest("Database failed"); // Use err.serverError() instead

// ❌ DON'T forget error middleware in Express
app.listen(3000); // Missing app.use(err.handleErrors())

// ❌ DON'T use try/catch for every async route
app.post("/users", async (req, res) => {
  try {
    // logic
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}); // Use err.asyncRoute() wrapper instead

// ❌ DON'T check status codes manually
if (error.statusCode >= 400 && error.statusCode < 500) {
  // Use err.isClientError(error) instead
}
```

### **Common Patterns**

```typescript
// Input validation pattern
if (!req.body.email) throw err.badRequest("Email is required");
if (!req.body.password) throw err.badRequest("Password is required");

// Authentication pattern
const token = req.headers.authorization?.replace("Bearer ", "");
if (!token) throw err.unauthorized("Authentication required");

// Resource lookup pattern
const user = await findUser(id);
if (!user) throw err.notFound("User not found");

// Permission check pattern
if (!user.isAdmin) throw err.forbidden("Admin access required");

// Conflict check pattern
const existing = await findByEmail(email);
if (existing) throw err.conflict("Email already exists");

// Database error pattern
try {
  return await db.operation();
} catch (dbError) {
  throw err.serverError("Database operation failed");
}

// Express setup pattern
const err = error.get();
app.use(express.json());
app.use("/api", routes);
app.use(err.handleErrors()); // Must be last
```

## 📈 Performance

- **Error Creation**: ~0.1ms per error
- **Middleware Processing**: ~0.2ms per request
- **Memory Usage**: <100KB overhead
- **Environment Parsing**: Once per application startup
- **Zero Dependencies**: Pure Node.js implementation

## 🔍 TypeScript Support

Full TypeScript support with comprehensive interfaces:

```typescript
import type {
  AppError,
  ErrorConfig,
  ExpressErrorHandler,
  AsyncRouteHandler,
} from "@voilajsx/appkit/error";

// Strongly typed error handling
const err = error.get();
const badReq: AppError = err.badRequest("Invalid input");
const middleware: ExpressErrorHandler = err.handleErrors();
```

## 📄 License

MIT © [VoilaJSX](https://github.com/voilajsx)

---

<p align="center">
  Built with ❤️ in India by the <a href="https://github.com/orgs/voilajsx/people">VoilaJSX Team</a>
</p>
