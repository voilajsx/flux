# @voilajsx/appkit - Security Module 🔒

[![npm version](https://img.shields.io/npm/v/@voilajsx/appkit.svg)](https://www.npmjs.com/package/@voilajsx/appkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Ultra-simple enterprise security that just works

**One function** returns a security object with enterprise-grade protection.
Zero configuration needed, production-ready by default, with built-in CSRF
protection, rate limiting, input sanitization, and AES-256-GCM encryption.

## 🚀 Why Choose This?

- **⚡ One Function** - Just `security.get()`, everything else is automatic
- **🔒 Enterprise Security** - Production-grade CSRF, rate limiting, encryption
- **🔧 Zero Configuration** - Smart defaults with environment variable override
- **🌍 Environment-First** - Auto-detects from `VOILA_SECURITY_*` variables
- **🛡️ Complete Protection** - CSRF, XSS, rate limiting, data encryption
- **🎯 Framework Ready** - Express middleware with proper headers
- **🤖 AI-Ready** - Optimized for LLM code generation

## 📦 Installation

```bash
npm install @voilajsx/appkit
```

## 🏃‍♂️ Quick Start (30 seconds)

### 1. Set Environment Variables

```bash
# Essential security configuration
VOILA_SECURITY_CSRF_SECRET=your-csrf-secret-key-2024-minimum-32-chars
VOILA_SECURITY_ENCRYPTION_KEY=64-char-hex-key-for-aes256-encryption-use-generateKey

# Optional rate limiting
VOILA_SECURITY_RATE_LIMIT=100        # Default: 100 requests
VOILA_SECURITY_RATE_WINDOW=900000    # Default: 15 minutes
```

### 2. Use in Your Code

```typescript
import express from "express";
import session from "express-session";
import { security } from "@voilajsx/appkit/security";

const app = express();
const secure = security.get();

// Session middleware (required for CSRF)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

// Security middleware setup
app.use(secure.forms()); // CSRF protection
app.use("/api", secure.requests()); // Rate limiting

// Secure route with input sanitization
app.post("/profile", (req, res) => {
  const safeName = secure.input(req.body.name);
  const safeBio = secure.html(req.body.bio, {
    allowedTags: ["p", "b", "i"],
  });
  const encryptedSSN = secure.encrypt(req.body.ssn);

  // Save to database with cleaned/encrypted data
  res.json({ success: true });
});
```

**That's it!** Enterprise-grade security with automatic protection against CSRF,
XSS, rate limiting, and data encryption.

## 🧠 Mental Model

### **Security Layer Architecture**

```
Request → CSRF Check → Rate Limit → Input Sanitization → Business Logic → Database
```

### **Protection Types**

```typescript
// Form Protection (CSRF)
secure.forms(); // Prevents cross-site request forgery

// Traffic Protection (Rate Limiting)
secure.requests(); // Prevents abuse and brute force

// Input Protection (XSS Prevention)
secure.input(text); // Cleans user text input
secure.html(content); // Sanitizes HTML content
secure.escape(text); // Escapes for safe display

// Data Protection (Encryption)
secure.encrypt(data); // AES-256-GCM encryption
secure.decrypt(data); // Authenticated decryption
```

### **Security Headers Added**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 900
```

## 📖 Complete API Reference

### Core Function

```typescript
const secure = security.get(); // One function, everything you need
```

### Middleware Methods

```typescript
// CSRF protection for forms
secure.forms(options?);           // Adds req.csrfToken(), validates tokens

// Rate limiting for endpoints
secure.requests(max?, window?, options?); // Configurable limits with headers

// Quick setup helper
security.quickSetup({             // Returns array of middleware
  csrf: true,
  rateLimit: true,
  maxRequests: 100
});
```

### Input Sanitization Methods

```typescript
// Basic text cleaning
secure.input(text, options?);     // XSS prevention, length limiting

// HTML content sanitization
secure.html(html, options?);      // Allowed tags, dangerous element removal

// Safe display escaping
secure.escape(text);              // HTML entity escaping
```

### Data Encryption Methods

```typescript
// AES-256-GCM encryption
secure.encrypt(data, key?, aad?); // Authenticated encryption

// Authenticated decryption
secure.decrypt(data, key?, aad?); // Tamper detection

// Key generation
secure.generateKey();             // 256-bit cryptographically secure key
```

### Utility Methods

```typescript
// Configuration and status
security.getConfig(); // Current security configuration
security.getStatus(); // Security feature availability
security.validateRequired({
  // Startup validation
  csrf: true,
  encryption: true,
});

// Environment helpers
security.isDevelopment(); // NODE_ENV === 'development'
security.isProduction(); // NODE_ENV === 'production'

// Testing support
security.reset(newConfig); // Reset with custom config
security.clearCache(); // Clear cached config
```

## 🎯 Usage Examples

### **Complete Secure Express Application**

```typescript
import express from "express";
import session from "express-session";
import { security } from "@voilajsx/appkit/security";

const app = express();
const secure = security.get();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for CSRF)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: security.isProduction(),
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Security middleware
app.use(secure.forms()); // CSRF protection
app.use("/api", secure.requests()); // General API rate limiting
app.use("/auth", secure.requests(5, 3600000)); // Strict auth rate limiting

// Form with CSRF protection
app.get("/contact", (req, res) => {
  const csrfToken = req.csrfToken();
  res.send(`
    <form method="POST" action="/contact">
      <input type="hidden" name="_csrf" value="${csrfToken}">
      <input type="text" name="name" placeholder="Your name" required>
      <textarea name="message" placeholder="Your message" required></textarea>
      <button type="submit">Send Message</button>
    </form>
  `);
});

// Secure form processing
app.post("/contact", async (req, res) => {
  try {
    // Input sanitization
    const name = secure.input(req.body.name, { maxLength: 50 });
    const message = secure.html(req.body.message, {
      allowedTags: ["p", "b", "i", "br"],
    });

    // Validate required fields
    if (!name || !message) {
      return res.status(400).json({
        error: "Name and message are required",
      });
    }

    // Save to database
    await saveContactMessage({ name, message });

    res.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send message",
    });
  }
});

app.listen(3000);
```

### **User Registration with Complete Security**

```typescript
import { security } from "@voilajsx/appkit/security";
import bcrypt from "bcrypt";

const secure = security.get();

// Registration endpoint with comprehensive protection
app.post("/auth/register", secure.requests(10, 3600000), async (req, res) => {
  try {
    // Input sanitization and validation
    const email = secure.input(req.body.email?.toLowerCase()?.trim());
    const name = secure.input(req.body.name, { maxLength: 50 });
    const bio = secure.html(req.body.bio, {
      allowedTags: ["p", "b", "i", "em", "strong"],
    });

    // Validate required fields
    if (!email || !name || !req.body.password) {
      return res.status(400).json({
        error: "Email, name, and password are required",
      });
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    // Password strength validation
    if (req.body.password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    // Encrypt sensitive data
    const encryptedPhone = req.body.phone
      ? secure.encrypt(req.body.phone)
      : null;

    // Create user
    const user = await createUser({
      email,
      name,
      bio,
      password: hashedPassword,
      phone: encryptedPhone,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        // Never return password or encrypted phone
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Failed to create user",
    });
  }
});
```

### **API with Advanced Security**

```typescript
import { security } from "@voilajsx/appkit/security";

const secure = security.get();

class SecureAPIController {
  // Blog post creation with sanitization
  static async createPost(req, res) {
    try {
      // Sanitize content
      const title = secure.input(req.body.title, { maxLength: 200 });
      const content = secure.html(req.body.content, {
        allowedTags: [
          "p",
          "h1",
          "h2",
          "h3",
          "b",
          "i",
          "a",
          "ul",
          "ol",
          "li",
          "blockquote",
        ],
      });
      const excerpt = secure.input(req.body.excerpt, { maxLength: 500 });

      // Validate required fields
      if (!title || !content) {
        return res.status(400).json({
          error: "Title and content are required",
        });
      }

      // Create post
      const post = await createBlogPost({
        title,
        content,
        excerpt,
        authorId: req.user.id,
        publishedAt: new Date(),
      });

      res.status(201).json({ post });
    } catch (error) {
      res.status(500).json({ error: "Failed to create post" });
    }
  }

  // Comment system with rate limiting
  static async addComment(req, res) {
    // Apply stricter rate limiting for comments
    const commentLimiter = secure.requests(5, 300000); // 5 comments per 5 minutes

    commentLimiter(req, res, async () => {
      try {
        const postId = secure.input(req.params.postId);
        const content = secure.html(req.body.content, {
          allowedTags: ["p", "b", "i", "a"],
        });

        if (!content || content.length < 10) {
          return res.status(400).json({
            error: "Comment must be at least 10 characters",
          });
        }

        const comment = await createComment({
          postId: parseInt(postId),
          content,
          authorId: req.user.id,
        });

        res.status(201).json({ comment });
      } catch (error) {
        res.status(500).json({ error: "Failed to add comment" });
      }
    });
  }

  // File upload with security
  static async uploadFile(req, res) {
    try {
      // Sanitize filename
      const originalName = secure.input(req.body.filename, {
        maxLength: 255,
        removeXSS: true,
      });

      // Validate file type (additional validation)
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          error: "Invalid file type. Only JPEG, PNG, and GIF allowed.",
        });
      }

      // Process upload...
      const fileUrl = await processFileUpload(req.file, originalName);

      res.json({
        success: true,
        url: fileUrl,
        filename: originalName,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  }
}

// Apply rate limiting to all API routes
app.use("/api/posts", secure.requests(50, 900000)); // 50 requests per 15 min
app.use("/api/comments", secure.requests(20, 900000)); // 20 requests per 15 min
app.use("/api/upload", secure.requests(10, 900000)); // 10 uploads per 15 min

// API routes
app.post("/api/posts", requireAuth, SecureAPIController.createPost);
app.post(
  "/api/posts/:postId/comments",
  requireAuth,
  SecureAPIController.addComment,
);
app.post("/api/upload", requireAuth, SecureAPIController.uploadFile);
```

### **Data Encryption Patterns**

```typescript
import { security } from "@voilajsx/appkit/security";

const secure = security.get();

class UserDataService {
  // Encrypt sensitive user data
  static async createUserProfile(userData) {
    try {
      // Encrypt PII data
      const encryptedSSN = userData.ssn ? secure.encrypt(userData.ssn) : null;
      const encryptedPhone = userData.phone
        ? secure.encrypt(userData.phone)
        : null;
      const encryptedAddress = userData.address
        ? secure.encrypt(JSON.stringify(userData.address))
        : null;

      // Clean non-sensitive data
      const name = secure.input(userData.name, { maxLength: 100 });
      const bio = secure.html(userData.bio, {
        allowedTags: ["p", "b", "i"],
      });

      // Save to database
      return await db.users.create({
        name,
        bio,
        email: userData.email, // Not encrypted (searchable)
        ssn: encryptedSSN,
        phone: encryptedPhone,
        address: encryptedAddress,
      });
    } catch (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  // Decrypt sensitive data for authorized access
  static async getUserProfile(userId, requestingUserId) {
    try {
      const user = await db.users.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Check authorization
      const canViewSensitive =
        userId === requestingUserId || (await isAdmin(requestingUserId));

      const profile = {
        id: user.id,
        name: user.name,
        bio: user.bio,
        email: user.email,
      };

      // Only decrypt for authorized users
      if (canViewSensitive) {
        if (user.ssn) {
          profile.ssn = secure.decrypt(user.ssn);
        }
        if (user.phone) {
          profile.phone = secure.decrypt(user.phone);
        }
        if (user.address) {
          profile.address = JSON.parse(secure.decrypt(user.address));
        }
      }

      return profile;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  // Key rotation for enhanced security
  static async rotateEncryptionKey(oldKey, newKey) {
    try {
      const users = await db.users.findAll({
        where: {
          [db.Op.or]: [
            { ssn: { [db.Op.ne]: null } },
            { phone: { [db.Op.ne]: null } },
            { address: { [db.Op.ne]: null } },
          ],
        },
      });

      for (const user of users) {
        const updates = {};

        // Re-encrypt with new key
        if (user.ssn) {
          const decrypted = secure.decrypt(user.ssn, oldKey);
          updates.ssn = secure.encrypt(decrypted, newKey);
        }

        if (user.phone) {
          const decrypted = secure.decrypt(user.phone, oldKey);
          updates.phone = secure.encrypt(decrypted, newKey);
        }

        if (user.address) {
          const decrypted = secure.decrypt(user.address, oldKey);
          updates.address = secure.encrypt(decrypted, newKey);
        }

        await db.users.update(updates, { where: { id: user.id } });
      }

      console.log(`Successfully rotated encryption for ${users.length} users`);
    } catch (error) {
      throw new Error(`Key rotation failed: ${error.message}`);
    }
  }
}
```

## 🌍 Environment Variables

### Required Configuration

```bash
# CSRF Protection (required for forms)
VOILA_SECURITY_CSRF_SECRET=your-csrf-secret-key-2024-minimum-32-chars

# Data Encryption (required for encrypt/decrypt)
VOILA_SECURITY_ENCRYPTION_KEY=64-char-hex-key-for-aes256-encryption

# Generate encryption key with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional Configuration

```bash
# Rate Limiting
VOILA_SECURITY_RATE_LIMIT=100               # Requests per window (default: 100)
VOILA_SECURITY_RATE_WINDOW=900000           # Window in ms (default: 15 min)
VOILA_SECURITY_RATE_MESSAGE="Too busy"     # Custom rate limit message

# Input Sanitization
VOILA_SECURITY_MAX_INPUT_LENGTH=1000        # Max input length (default: 1000)
VOILA_SECURITY_ALLOWED_TAGS=p,b,i,a         # Allowed HTML tags
VOILA_SECURITY_STRIP_ALL_TAGS=false         # Strip all HTML (default: false)

# CSRF Settings
VOILA_SECURITY_CSRF_FIELD=_csrf             # Form field name (default: _csrf)
VOILA_SECURITY_CSRF_HEADER=x-csrf-token     # Header name (default: x-csrf-token)
VOILA_SECURITY_CSRF_EXPIRY=60               # Token expiry minutes (default: 60)
```

### Environment-Specific Behavior

| Environment     | CSRF Required         | Rate Limiting | Input Validation | Encryption            |
| --------------- | --------------------- | ------------- | ---------------- | --------------------- |
| **Development** | ⚠️ Warning if missing | ✅ Enabled    | ✅ Enabled       | ⚠️ Warning if missing |
| **Production**  | ❌ Error if missing   | ✅ Enabled    | ✅ Enabled       | ❌ Error if missing   |
| **Test**        | ✅ Optional           | ✅ Enabled    | ✅ Enabled       | ✅ Optional           |

## 🔒 Security Features Deep Dive

### **CSRF Protection** (`secure.forms()`)

**How it works:**

- Generates cryptographically secure tokens using `crypto.randomBytes()`
- Stores tokens in user sessions with expiration timestamps
- Validates tokens using timing-safe comparison with `crypto.timingSafeEqual()`
- Automatically checks POST/PUT/DELETE/PATCH requests

**Usage patterns:**

```typescript
// Add CSRF middleware
app.use(secure.forms());

// Generate token in forms
app.get("/form", (req, res) => {
  const csrfToken = req.csrfToken();
  res.render("form", { csrfToken });
});

// Token automatically validated on POST
app.post("/form", (req, res) => {
  // CSRF already verified by middleware
  processForm(req.body);
});
```

### **Rate Limiting** (`secure.requests()`)

**How it works:**

- Tracks requests per client IP in memory with automatic cleanup
- Uses sliding window algorithm for accurate rate limiting
- Sets standard HTTP headers (X-RateLimit-\*, Retry-After)
- Configurable per endpoint for different limits

**Usage patterns:**

```typescript
// General API rate limiting
app.use("/api", secure.requests(100, 900000)); // 100 req/15min

// Strict authentication limits
app.use("/auth", secure.requests(5, 3600000)); // 5 req/hour

// Custom limits for specific endpoints
app.post("/upload", secure.requests(10, 900000), uploadHandler);
```

### **Input Sanitization** (`secure.input()`, `secure.html()`)

**How it works:**

- Removes dangerous patterns: `<script>`, `javascript:`, `on*=` handlers
- Filters HTML tags to only allow whitelisted elements
- Limits input length to prevent memory exhaustion
- Escapes HTML entities for safe display

**Usage patterns:**

```typescript
// Basic text cleaning
const safeName = secure.input(req.body.name, { maxLength: 50 });

// HTML content with allowed tags
const safeContent = secure.html(req.body.content, {
  allowedTags: ["p", "b", "i", "a", "ul", "li"],
});

// Safe display escaping
const safeDisplay = secure.escape(userText);
res.send(`<p>User said: ${safeDisplay}</p>`);
```

### **Data Encryption** (`secure.encrypt()`, `secure.decrypt()`)

**How it works:**

- Uses AES-256-GCM authenticated encryption
- Generates random IV for each encryption operation
- Includes authentication tags to detect tampering
- Supports Associated Additional Data (AAD) for context

**Usage patterns:**

```typescript
// Encrypt sensitive data
const encryptedSSN = secure.encrypt(user.ssn);
const encryptedCard = secure.encrypt(cardData, customKey);

// Decrypt for authorized access
const originalSSN = secure.decrypt(encryptedSSN);
const originalCard = secure.decrypt(encryptedCard, customKey);

// Generate new keys
const newKey = secure.generateKey(); // For VOILA_SECURITY_ENCRYPTION_KEY
```

## 🛡️ Security Best Practices

### **Startup Validation**

```typescript
// Validate required security config at app startup
try {
  security.validateRequired({
    csrf: true, // Required for forms
    encryption: true, // Required for sensitive data
    rateLimit: false, // Always available
  });

  console.log("✅ Security validation passed");
} catch (error) {
  console.error("❌ Security validation failed:", error.message);
  process.exit(1);
}
```

### **Security Middleware Order**

```typescript
// Correct middleware order for maximum protection
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    /* session config */
  }),
);

// Security middleware (order matters)
app.use(secure.forms()); // 1. CSRF protection
app.use("/api", secure.requests()); // 2. Rate limiting
app.use("/auth", secure.requests(5, 3600000)); // 3. Strict auth limits

// Application routes
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

// Error handling (last)
app.use(errorHandler);
```

### **Input Validation Patterns**

```typescript
// Comprehensive input validation
function validateAndSanitizeInput(req, res, next) {
  try {
    // Clean all text inputs
    if (req.body.name) {
      req.body.name = secure.input(req.body.name, { maxLength: 50 });
    }

    if (req.body.email) {
      req.body.email = secure.input(req.body.email?.toLowerCase());
    }

    // Sanitize HTML content
    if (req.body.content) {
      req.body.content = secure.html(req.body.content, {
        allowedTags: ["p", "b", "i", "a"],
      });
    }

    // Validate required fields after cleaning
    if (!req.body.name || !req.body.email) {
      return res.status(400).json({
        error: "Name and email are required",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Input validation failed" });
  }
}
```

### **Encryption Key Management**

```typescript
// Key generation and rotation
class KeyManager {
  static generateProductionKey() {
    const key = security.generateKey();
    console.log("New encryption key (save securely):");
    console.log(`VOILA_SECURITY_ENCRYPTION_KEY=${key}`);
    return key;
  }

  static validateCurrentKey() {
    try {
      const secure = security.get();
      const testData = "test-encryption";
      const encrypted = secure.encrypt(testData);
      const decrypted = secure.decrypt(encrypted);

      if (decrypted !== testData) {
        throw new Error("Key validation failed");
      }

      console.log("✅ Encryption key is valid");
      return true;
    } catch (error) {
      console.error("❌ Encryption key validation failed:", error.message);
      return false;
    }
  }
}
```

## 🧪 Testing

### **Security Testing Setup**

```typescript
import { security } from "@voilajsx/appkit/security";

describe("Security Tests", () => {
  beforeEach(() => {
    // Reset security instance for clean tests
    security.clearCache();
  });

  test("should generate and verify CSRF tokens", () => {
    const secure = security.reset({
      csrf: {
        secret: "test-secret-32-characters-long",
        tokenField: "_csrf",
        headerField: "x-csrf-token",
        expiryMinutes: 60,
      },
    });

    const mockSession = {};
    const mockReq = { session: mockSession };

    // Test token generation
    const middleware = secure.forms();
    middleware(mockReq, {}, () => {});

    const token = mockReq.csrfToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.length).toBe(32); // 16 bytes as hex
  });

  test("should encrypt and decrypt data correctly", () => {
    const secure = security.reset({
      encryption: {
        key: "a".repeat(64), // 32 bytes as hex
        algorithm: "aes-256-gcm",
        ivLength: 16,
        tagLength: 16,
        keyLength: 32,
      },
    });

    const originalData = "sensitive information";
    const encrypted = secure.encrypt(originalData);
    const decrypted = secure.decrypt(encrypted);

    expect(decrypted).toBe(originalData);
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
  });

  test("should sanitize malicious input", () => {
    const secure = security.get();

    const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>';
    const cleaned = secure.html(maliciousInput, {
      allowedTags: ["p"],
    });

    expect(cleaned).toBe("<p>Safe content</p>");
    expect(cleaned).not.toContain("<script>");
  });

  test("should enforce rate limits", async () => {
    const secure = security.get();
    const middleware = secure.requests(2, 1000); // 2 requests per second

    const mockReq = { ip: "127.0.0.1" };
    const mockRes = { setHeader: jest.fn() };
    const mockNext = jest.fn();

    // First two requests should pass
    middleware(mockReq, mockRes, mockNext);
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));

    // Third request should be rate limited
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
      }),
    );
  });
});
```

### **Mock Security Configuration**

```typescript
// Test helper for custom security config
function createTestSecurity(overrides = {}) {
  return security.reset({
    csrf: {
      secret: "test-secret-32-characters-long",
      tokenField: "_csrf",
      headerField: "x-csrf-token",
      expiryMinutes: 60,
    },
    rateLimit: {
      maxRequests: 5,
      windowMs: 1000,
      message: "Rate limit exceeded",
    },
    sanitization: {
      maxLength: 100,
      allowedTags: ["p", "b"],
      stripAllTags: false,
    },
    encryption: {
      key: "a".repeat(64),
      algorithm: "aes-256-gcm",
      ivLength: 16,
      tagLength: 16,
      keyLength: 32,
    },
    environment: {
      isDevelopment: true,
      isProduction: false,
      isTest: true,
      nodeEnv: "test",
    },
    ...overrides,
  });
}

describe("Application Security", () => {
  test("should handle user registration securely", async () => {
    const secure = createTestSecurity();

    const userData = {
      name: "John Doe",
      bio: '<p>Hello</p><script>alert("xss")</script>',
      ssn: "123-45-6789",
    };

    const cleanName = secure.input(userData.name);
    const safeBio = secure.html(userData.bio, { allowedTags: ["p"] });
    const encryptedSSN = secure.encrypt(userData.ssn);

    expect(cleanName).toBe("John Doe");
    expect(safeBio).toBe("<p>Hello</p>");
    expect(safeBio).not.toContain("<script>");
    expect(encryptedSSN).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);

    // Verify encryption roundtrip
    const decryptedSSN = secure.decrypt(encryptedSSN);
    expect(decryptedSSN).toBe("123-45-6789");
  });
});
```

## 🤖 LLM Guidelines

### **Essential Patterns**

```typescript
// ✅ ALWAYS use these patterns
import { security } from "@voilajsx/appkit/security";
const secure = security.get();

// ✅ Security middleware setup (order matters)
app.use(session({ secret: process.env.SESSION_SECRET })); // Required for CSRF
app.use(secure.forms()); // CSRF protection
app.use("/api", secure.requests()); // Rate limiting

// ✅ Input sanitization before processing
const safeName = secure.input(req.body.name, { maxLength: 50 });
const safeContent = secure.html(req.body.content, {
  allowedTags: ["p", "b", "i"],
});

// ✅ Encrypt sensitive data before storage
const encryptedSSN = secure.encrypt(user.ssn);
const encryptedPhone = secure.encrypt(user.phone);

// ✅ Safe output display
const safeText = secure.escape(userContent);
res.send(`<p>User: ${safeText}</p>`);

// ✅ CSRF token in forms
app.get("/form", (req, res) => {
  const csrfToken = req.csrfToken();
  res.render("form", { csrfToken });
});
```

### **Anti-Patterns to Avoid**

```typescript
// ❌ DON'T store raw user input
await db.save({ content: req.body.content }); // Use secure.input() first

// ❌ DON'T display user content without escaping
res.send(`<p>${userComment}</p>`); // Use secure.escape() first

// ❌ DON'T store sensitive data unencrypted
await db.save({ ssn: req.body.ssn }); // Use secure.encrypt() first

// ❌ DON'T forget session middleware for CSRF
app.use(secure.forms()); // Sessions required first

// ❌ DON'T use same rate limits for all endpoints
app.use(secure.requests()); // Use different limits for auth vs API

// ❌ DON'T hardcode security configuration
const secure = security.get({ csrf: { secret: "hardcoded" } }); // Use env vars

// ❌ DON'T forget CSRF tokens in forms
res.send('<form method="POST">...'); // Missing CSRF token

// ❌ DON'T mix encryption keys
const encrypted1 = secure.encrypt(data, key1);
const decrypted1 = secure.decrypt(encrypted1, key2); // Will fail
```

### **Common Patterns**

```typescript
// Security middleware setup pattern
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET }));
app.use(secure.forms()); // CSRF
app.use("/api", secure.requests(100, 900000)); // API rate limit
app.use("/auth", secure.requests(5, 3600000)); // Auth rate limit

// Input validation pattern
function validateInput(req, res, next) {
  req.body.name = secure.input(req.body.name, { maxLength: 50 });
  req.body.email = secure.input(req.body.email?.toLowerCase());
  req.body.content = secure.html(req.body.content, {
    allowedTags: ["p", "b", "i"],
  });
  next();
}

// Encryption pattern for sensitive data
const userData = {
  name: secure.input(req.body.name),
  email: secure.input(req.body.email),
  ssn: secure.encrypt(req.body.ssn),
  phone: secure.encrypt(req.body.phone),
};

// Form with CSRF pattern
app.get("/form", (req, res) => {
  const csrfToken = req.csrfToken();
  res.render("form", { csrfToken });
});

app.post("/form", (req, res) => {
  // CSRF automatically validated
  const cleanData = secure.input(req.body.data);
  processForm(cleanData);
});

// Error handling pattern
try {
  const encrypted = secure.encrypt(sensitiveData);
  await saveToDatabase(encrypted);
} catch (error) {
  console.error("Security operation failed:", error);
  res.status(500).json({ error: "Operation failed" });
}
```

### **Security Checklist for LLM Generation**

```typescript
// ✅ Session middleware before CSRF
app.use(session(config));

// ✅ Security middleware applied
app.use(secure.forms());
app.use(secure.requests());

// ✅ Input sanitized
const clean = secure.input(userInput);

// ✅ HTML content sanitized
const safeHtml = secure.html(userHtml, { allowedTags: ['p'] });

// ✅ Sensitive data encrypted
const encrypted = secure.encrypt(sensitiveData);

// ✅ Output escaped for display
const safe = secure.escape(userContent);

// ✅ CSRF tokens in forms
const csrfToken = req.csrfToken();

// ✅ Rate limiting on sensitive endpoints
app.use('/auth', secure.requests(5, 3600000));

// ✅ Error handling with appropriate status codes
catch (error) {
  res.status(error.statusCode || 500).json({ error: error.message });
}
```

## 📈 Performance

- **CSRF Operations**: ~1ms per token generation/verification
- **Rate Limiting**: In-memory tracking with O(1) lookup, automatic cleanup
- **Input Sanitization**: ~0.1ms per input cleaning operation
- **HTML Sanitization**: ~0.5ms per HTML cleaning operation
- **Encryption**: ~2ms per encrypt/decrypt operation (AES-256-GCM)
- **Memory Usage**: <2MB additional overhead for rate limiting
- **Environment Parsing**: Once per application startup

## 🔍 TypeScript Support

Full TypeScript support with comprehensive interfaces:

```typescript
import type {
  SecurityConfig,
  ExpressMiddleware,
  CSRFOptions,
  RateLimitOptions,
  InputOptions,
  HTMLOptions,
} from "@voilajsx/appkit/security";

// Strongly typed security operations
const secure = security.get();
const middleware: ExpressMiddleware = secure.forms();
const cleanText: string = secure.input(userInput, { maxLength: 100 });
const encrypted: string = secure.encrypt(sensitiveData);
```

## 🚨 Security Considerations

### **Production Deployment**

```bash
# Required environment variables for production
VOILA_SECURITY_CSRF_SECRET=64-char-random-string-for-csrf-protection
VOILA_SECURITY_ENCRYPTION_KEY=64-char-hex-string-for-aes256-encryption

# Optional but recommended
VOILA_SECURITY_RATE_LIMIT=100
VOILA_SECURITY_RATE_WINDOW=900000
VOILA_SECURITY_MAX_INPUT_LENGTH=1000
```

### **Key Management**

```typescript
// Generate production keys
const encryptionKey = security.generateKey();
console.log("Save this key securely:", encryptionKey);

// Validate configuration at startup
security.validateRequired({
  csrf: true,
  encryption: true,
});
```

### **Security Headers**

```typescript
// Additional security headers (recommend using helmet.js)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

## 📄 License

MIT © [VoilaJSX](https://github.com/voilajsx)

---

<p align="center">
  Built with ❤️ in India by the <a href="https://github.com/orgs/voilajsx/people">VoilaJSX Team</a>
</p>
