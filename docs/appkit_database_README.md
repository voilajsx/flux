# @voilajsx/appkit - Database Module 💾

[![npm version](https://img.shields.io/npm/v/@voilajsx/appkit.svg)](https://www.npmjs.com/package/@voilajsx/appkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> Ultra-simple database wrapper with automatic tenant isolation and progressive
> multi-organization support that grows with your needs

**One simple function** - `database.get()` - handles everything from single
databases to complex multi-org, multi-tenant architectures. **Zero configuration
needed**, production-ready by default, with **mandatory future-proofing** built
in.

## 🚀 Why Choose AppKit Database?

- **⚡ One Function** - `database.get()` handles all use cases, environment
  controls behavior
- **🔧 Zero Configuration** - Just `DATABASE_URL`, everything else is optional
- **📈 Progressive Scaling** - Start simple, add tenants/orgs with zero code
  changes
- **🛡️ Future-Proof Schema** - Mandatory `tenant_id` field prevents migration
  pain
- **🔥 Hot Reload** - Change `.env` file, connections update instantly
- **🌍 Multi-Cloud Ready** - Each org can use different cloud providers
- **🤖 LLM-Optimized** - Clear variable naming patterns for AI code generation

## 📦 Installation

```bash
npm install @voilajsx/appkit
```

### Database-Specific Dependencies

```bash
# PostgreSQL/MySQL/SQLite with Prisma
npm install @voilajsx/appkit @prisma/client

# MongoDB with Mongoose
npm install @voilajsx/appkit mongoose

# Multi-database setup (both ORMs)
npm install @voilajsx/appkit @prisma/client mongoose
```

## 🏃‍♂️ Quick Start (30 seconds)

### Single Database (Day 1)

```typescript
import { database } from '@voilajsx/appkit/database';

// PostgreSQL/MySQL with Prisma
const db = await database.get();
const users = await db.user.findMany();

// MongoDB with Mongoose
const db = await database.get();
const users = await db.User.find();
```

### Multi-Tenant (Month 6 - Zero Code Changes!)

```bash
# Add to .env file - code stays exactly the same
VOILA_DB_TENANT=auto
```

```typescript
// Same code, now tenant-filtered automatically
const db = await database.get(); // User's tenant data only

// Prisma (SQL databases)
const users = await db.user.findMany(); // Auto-filtered by tenant

// Mongoose (MongoDB)
const users = await db.User.find(); // Auto-filtered by tenant

// Admin access to all tenants
const dbTenants = await database.getTenants();
const allUsers = await dbTenants.user.findMany(); // Prisma - All tenant data
const allUsers = await dbTenants.User.find(); // Mongoose - All tenant data
```

### Multi-Organization (Year 1 - Still Zero Code Changes!)

```bash
# Add org-specific databases to .env
ORG_ACME=postgresql://acme.aws.com/prod      # PostgreSQL on AWS
ORG_TECH=mongodb://tech.azure.com/prod       # MongoDB on Azure
ORG_STARTUP=mysql://startup.gcp.com/prod     # MySQL on GCP
```

```typescript
// Same code, now org-aware with auto-adapter detection
const acmeDb = await database.org('acme').get(); // Uses Prisma for PostgreSQL
const techDb = await database.org('tech').get(); // Uses Mongoose for MongoDB
const startupDb = await database.org('startup').get(); // Uses Prisma for MySQL

// Different database queries, same simple API
const acmeUsers = await acmeDb.user.findMany(); // Prisma syntax
const techUsers = await techDb.User.find(); // Mongoose syntax
const startupUsers = await startupDb.user.findMany(); // Prisma syntax

// Org admin access
const acmeDbTenants = await database.org('acme').getTenants();
const techDbTenants = await database.org('tech').getTenants();
```

**That's it!** Your code never changes, only your environment evolves.

## 🎯 Core API

### **One Function Rule: `database.get()`**

```typescript
// Normal user access (single tenant or their specific tenant)
const db = await database.get();

// Admin access to all tenants
const dbTenants = await database.getTenants();

// Organization-specific access
const acmeDb = await database.org('acme').get();
const acmeDbTenants = await database.org('acme').getTenants();
```

### **LLM-Friendly Variable Naming**

```typescript
// Standard patterns for AI code generation:
const db = await database.get(); // Single/tenant user data
const dbTenants = await database.getTenants(); // All tenants (admin)
const acmeDb = await database.org('acme').get(); // Acme org data
const acmeDbTenants = await database.org('acme').getTenants(); // All Acme tenants
```

## 🛡️ Mandatory Future-Proofing

### **Required Schema Pattern**

**EVERY table/collection MUST include `tenant_id` field from Day 1:**

#### **SQL Databases (Prisma)**

```sql
-- ✅ CORRECT: Future-proof schema
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  name text,
  tenant_id text,  -- MANDATORY: nullable for future compatibility
  created_at timestamp DEFAULT now(),

  INDEX idx_users_tenant (tenant_id)  -- MANDATORY: performance index
);

CREATE TABLE posts (
  id uuid PRIMARY KEY,
  title text,
  content text,
  user_id uuid REFERENCES users(id),
  tenant_id text,  -- MANDATORY: on EVERY table
  created_at timestamp DEFAULT now(),

  INDEX idx_posts_tenant (tenant_id)  -- MANDATORY: on EVERY table
);
```

```prisma
// Prisma schema example
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  tenant_id String?  // MANDATORY: nullable for future use
  createdAt DateTime @default(now())

  @@index([tenant_id])  // MANDATORY: performance index
  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  userId    String
  tenant_id String?  // MANDATORY: on EVERY table
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([tenant_id])  // MANDATORY: on EVERY table
  @@map("posts")
}
```

#### **MongoDB (Mongoose)**

```javascript
// Mongoose schema example
const userSchema = new Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  tenant_id: { type: String, index: true }, // MANDATORY: indexed for performance
  createdAt: { type: Date, default: Date.now },
});

// MANDATORY: Index for performance
userSchema.index({ tenant_id: 1 });

const postSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenant_id: { type: String, index: true }, // MANDATORY: on EVERY schema
  createdAt: { type: Date, default: Date.now },
});

// MANDATORY: Index on every schema
postSchema.index({ tenant_id: 1 });

export const User = model('User', userSchema);
export const Post = model('Post', postSchema);
```

### **Why Mandatory `tenant_id`?**

- ✅ **Zero Migration Pain** - Enable multi-tenancy later with just environment
  variables
- ✅ **Performance Ready** - Indexes in place from day 1
- ✅ **No Data Restructuring** - Never need to alter table schemas
- ✅ **Gradual Adoption** - Start single-tenant, scale when needed

## 🌍 Environment Configuration

### **Minimal Setup (2 Variables)**

```bash
# Required: Main database connection
DATABASE_URL=postgresql://localhost:5432/myapp  # PostgreSQL
# OR
DATABASE_URL=mongodb://localhost:27017/myapp    # MongoDB
# OR
DATABASE_URL=mysql://localhost:3306/myapp       # MySQL

# Optional: Enable tenant mode (auto-detects from requests)
VOILA_DB_TENANT=auto
```

### **Multi-Database & Multi-Organization Setup**

```bash
# Fallback database
DATABASE_URL=postgresql://localhost:5432/main

# Organization-specific databases (any provider)
ORG_ACME=postgresql://acme.aws.com/prod         # PostgreSQL on AWS
ORG_TECH=mongodb://tech.azure.com/db            # MongoDB on Azure
ORG_STARTUP=mysql://startup.gcp.com/prod        # MySQL on GCP
ORG_LOCAL=sqlite:///local/dev.db                # SQLite for development
ORG_LEGACY=mongodb://legacy.onprem.com/data     # On-premise MongoDB

# Enable tenant mode within each org
VOILA_DB_TENANT=auto
```

### **Hot Reload Magic**

```bash
# Change .env file while app is running:
echo "ORG_NEWCLIENT=postgresql://newclient.com/db" >> .env

# Connections update instantly - no server restart needed! 🔥
```

## 💡 Real-World Examples

### **Progressive Scaling Journey**

```typescript
/**
 * Day 1: Simple blog application
 */
async function getBlogPosts() {
  const db = await database.get();
  return await db.posts.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Month 6: Add team workspaces (zero code changes!)
 * Just add: VOILA_DB_TENANT=auto to .env
 */
async function getBlogPosts() {
  const db = await database.get(); // Now auto-filters by tenant
  return await db.posts.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Year 1: Multi-organization SaaS (still zero code changes!)
 * Just add org URLs to .env
 */
async function getBlogPosts() {
  const db = await database.get(); // Now org + tenant aware
  return await db.posts.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Admin dashboard (any time)
 */
async function getAllOrgPosts(orgId) {
  const dbTenants = await database.org(orgId).getTenants();
  return await dbTenants.posts.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
}
```

### **Multi-Tenant API Endpoints**

```typescript
import { database } from '@voilajsx/appkit/database';

// User endpoints - auto-filtered by tenant
app.get('/api/users', async (req, res) => {
  const db = await database.get();
  const users = await db.user.findMany();
  res.json(users); // Only user's tenant data
});

app.post('/api/users', async (req, res) => {
  const db = await database.get();
  const user = await db.user.create({
    data: req.body, // tenant_id added automatically
  });
  res.json(user);
});

// Admin endpoints - see all tenant data
app.get('/api/admin/users', requireRole('admin'), async (req, res) => {
  const dbTenants = await database.getTenants();
  const users = await dbTenants.user.findMany({
    include: { _count: { select: { posts: true } } },
  });
  res.json(users); // All tenants data
});

// Organization management
app.get('/api/orgs/:orgId/users', requireRole('admin'), async (req, res) => {
  const { orgId } = req.params;
  const orgDb = await database.org(orgId).get();
  const users = await orgDb.user.findMany();
  res.json(users); // Specific org data
});
```

### **Multi-Cloud Enterprise Setup**

```typescript
/**
 * Enterprise deployment with different cloud providers and databases per organization
 */

// Environment configuration supports any database provider:
const envConfig = `
# System/Admin database
DATABASE_URL=postgresql://admin.company.com/system

# Customer organizations on different clouds and databases
ORG_ENTERPRISE_CORP=postgresql://enterprise.dedicated.aws.com/prod
ORG_TECH_STARTUP=mongodb://tech.shared.azure.com/startup_db  
ORG_LOCAL_BUSINESS=mysql://local.gcp.com:3306/business_db
ORG_DEV_TESTING=sqlite:///tmp/testing.db

# Enable tenant mode across all orgs
VOILA_DB_TENANT=auto
`;

// Code remains identical regardless of backend:
async function getUserData(orgId, userId) {
  const db = await database.org(orgId).get();

  // Works with any database type - AppKit handles the differences
  if (db.user?.findUnique) {
    // Prisma client (PostgreSQL, MySQL, SQLite)
    return await db.user.findUnique({
      where: { id: userId },
      include: { posts: true, profile: true },
    });
  } else if (db.User?.findOne) {
    // Mongoose client (MongoDB)
    return await db.User.findOne({ _id: userId })
      .populate('posts')
      .populate('profile');
  }
}
```

## 🔧 Automatic Context Detection

### **Tenant Detection Sources** (when `VOILA_DB_TENANT=auto`)

```typescript
// AppKit automatically detects tenant from:
const tenantId =
  req.headers['x-tenant-id'] || // API header (recommended)
  req.user?.tenant_id || // Authenticated user metadata
  req.params?.tenantId || // URL parameter
  req.query?.tenant || // Query parameter
  req.subdomain || // Subdomain (team.app.com)
  null; // Single tenant mode
```

### **Organization Detection Sources**

```typescript
// AppKit automatically detects organization from:
const orgId =
  req.headers['x-org-id'] || // API header (recommended)
  req.user?.org_id || // Authenticated user metadata
  req.params?.orgId || // URL parameter
  req.query?.org || // Query parameter
  req.subdomain || // Subdomain (acme.app.com)
  null; // Single org mode
```

### **Manual Override** (when needed)

```typescript
// Override auto-detection when needed
const specificTenantDb = await database.get({ tenant: 'specific-tenant' });
const specificOrgDb = await database.org('specific-org').get();
```

## 🚀 Framework Integration

### **Express.js**

```typescript
import express from 'express';
import { database } from '@voilajsx/appkit/database';

const app = express();

// Simple route - auto-detects tenant from request
app.get('/users', async (req, res) => {
  const db = await database.get();
  const users = await db.user.findMany();
  res.json(users);
});

// Admin route - access all tenants
app.get('/admin/users', requireAdmin, async (req, res) => {
  const dbTenants = await database.getTenants();
  const users = await dbTenants.user.findMany();
  res.json(users);
});
```

### **Fastify**

```typescript
import Fastify from 'fastify';
import { database } from '@voilajsx/appkit/database';

const fastify = Fastify();

fastify.get('/users', async (request, reply) => {
  const db = await database.get();
  const users = await db.user.findMany();
  return users;
});

fastify.get(
  '/admin/users',
  { preHandler: requireAdmin },
  async (request, reply) => {
    const dbTenants = await database.getTenants();
    const users = await dbTenants.user.findMany();
    return users;
  }
);
```

### **Next.js API Routes**

```typescript
// pages/api/users.ts
import { database } from '@voilajsx/appkit/database';

export default async function handler(req, res) {
  const db = await database.get();

  if (req.method === 'GET') {
    const users = await db.user.findMany();
    res.json(users);
  } else if (req.method === 'POST') {
    const user = await db.user.create({ data: req.body });
    res.json(user);
  }
}

// pages/api/admin/users.ts
import { database } from '@voilajsx/appkit/database';

export default async function handler(req, res) {
  const dbTenants = await database.getTenants();
  const users = await dbTenants.user.findMany();
  res.json(users);
}
```

## 🛠️ Advanced Features

### **Health Monitoring**

```typescript
// System health check
const health = await database.health();
console.log(health);
// {
//   healthy: true,
//   connections: 3,
//   timestamp: "2024-01-15T10:30:00.000Z"
// }
```

### **Tenant Management**

```typescript
// List all tenants
const tenants = await database.list();
console.log(tenants); // ['team-alpha', 'team-beta', 'team-gamma']

// Check if tenant exists
const exists = await database.exists('team-alpha');
console.log(exists); // true

// Create tenant (validates ID format)
await database.create('new-team');

// Delete tenant (requires confirmation)
await database.delete('old-team', { confirm: true });
```

### **Connection Management**

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  await database.disconnect();
  process.exit(0);
});
```

## 📊 Performance & Scaling

### **Connection Pooling**

- **Automatic caching** - Connections reused per org/tenant combination
- **Hot reload** - New .env configurations picked up instantly
- **Memory efficient** - Connections shared across requests

### **Database Performance**

- **Mandatory indexes** - `tenant_id` indexed on all tables from day 1
- **Query optimization** - Automatic tenant filtering at database level
- **Connection limits** - Respects database provider connection pools

### **Scaling Characteristics**

- **Single tenant**: 1 connection per app
- **Multi-tenant**: 1 connection (shared filtering)
- **Multi-org**: 1 connection per organization
- **Multi-org + tenant**: 1 connection per org (shared tenant filtering)

## 🔍 Migration Guide

### **From Direct Prisma**

```typescript
// Before: Direct Prisma usage
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const users = await prisma.user.findMany();

// After: AppKit Database
import { database } from '@voilajsx/appkit/database';
const db = await database.get();
const users = await db.user.findMany();
```

### **From Manual Multi-Tenancy**

```typescript
// Before: Manual tenant filtering everywhere
const users = await prisma.user.findMany({
  where: { tenant_id: getTenantId(req) },
});

// After: Automatic tenant filtering
const db = await database.get();
const users = await db.user.findMany(); // tenant_id added automatically
```

### **Schema Migration**

```sql
-- Add tenant_id to existing tables
ALTER TABLE users ADD COLUMN tenant_id text;
ALTER TABLE posts ADD COLUMN tenant_id text;
ALTER TABLE comments ADD COLUMN tenant_id text;

-- Add performance indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_posts_tenant ON posts(tenant_id);
CREATE INDEX idx_comments_tenant ON comments(tenant_id);

-- Set existing data to null (single tenant mode)
-- No data changes needed - null = single tenant
```

## 🤖 LLM Guidelines

### **Variable Naming Patterns**

```typescript
// ✅ Standard patterns for AI code generation:

// Normal user access (single or tenant mode)
const db = await database.get();

// Admin access to all tenants
const dbTenants = await database.getTenants();

// Organization-specific access (use org name in variable)
const acmeDb = await database.org('acme').get();
const techDb = await database.org('tech').get();
const startupDb = await database.org('startup').get();

// Organization admin access (use org name + DbTenants)
const acmeDbTenants = await database.org('acme').getTenants();
const techDbTenants = await database.org('tech').getTenants();
```

### **Common Patterns**

```typescript
// ✅ User data access
const db = await database.get();
const users = await db.user.findMany();

// ✅ Admin functionality
const dbTenants = await database.getTenants();
const allUsers = await dbTenants.user.findMany();

// ✅ Organization management
const acmeDb = await database.org('acme').get();
const acmeUsers = await acmeDb.user.findMany();

// ✅ Cross-tenant analytics (admin)
const acmeDbTenants = await database.org('acme').getTenants();
const analytics = await acmeDbTenants.user.groupBy({
  by: ['tenant_id'],
  _count: true,
});
```

### **Schema Requirements**

```typescript
// ✅ ALWAYS include in ALL models (SQL):
model AnyTable {
  id        String   @id @default(cuid())
  // ... your fields ...
  tenant_id String?  // MANDATORY: nullable for future use

  @@index([tenant_id])  // MANDATORY: performance index
}

// ✅ ALWAYS include in ALL schemas (MongoDB):
const anySchema = new Schema({
  // ... your fields ...
  tenant_id: { type: String, index: true } // MANDATORY: indexed
});
anySchema.index({ tenant_id: 1 }); // MANDATORY: performance index
```

## 🚨 Common Mistakes to Avoid

### **❌ Schema Mistakes**

```sql
-- ❌ DON'T: Missing tenant_id field
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text,
  name text
  -- Missing tenant_id - will need painful migration later
);

-- ✅ DO: Always include tenant_id (SQL)
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text,
  name text,
  tenant_id text,  -- Future-proof from day 1
  INDEX idx_tenant (tenant_id)
);
```

```javascript
// ❌ DON'T: Missing tenant_id field (MongoDB)
const userSchema = new Schema({
  email: String,
  name: String,
  // Missing tenant_id - will need painful migration later
});

// ✅ DO: Always include tenant_id (MongoDB)
const userSchema = new Schema({
  email: String,
  name: String,
  tenant_id: { type: String, index: true }, // Future-proof from day 1
});
userSchema.index({ tenant_id: 1 });
```

### **❌ API Usage Mistakes**

```typescript
// ❌ DON'T: Hard-code tenant access (any database)
const users = await prisma.user.findMany({
  where: { tenant_id: 'hardcoded-tenant' },
});
const users = await User.find({ tenant_id: 'hardcoded-tenant' });

// ✅ DO: Use database.get() for automatic filtering
const db = await database.get();
const users = await db.user.findMany(); // Prisma - Auto-filtered
const users = await db.User.find(); // Mongoose - Auto-filtered

// ❌ DON'T: Mix access patterns
const db = await database.get();
const adminDb = await database.getTenants();
const users = await db.user.findMany(); // Which database am I using?

// ✅ DO: Clear variable naming
const db = await database.get(); // User data
const dbTenants = await database.getTenants(); // Admin data
const users = await db.user.findMany(); // Clear intent (Prisma)
const users = await db.User.find(); // Clear intent (Mongoose)
```

## 🔧 Troubleshooting

### **Database Connection Issues**

```typescript
// Check configuration
import { database } from '@voilajsx/appkit/database';

const health = await database.health();
if (!health.healthy) {
  console.error('Database issue:', health.error);
}
```

### **Missing tenant_id Fields**

```bash
# Development warning will show:
# Model 'User' missing required field 'tenant_id'
# Add: tenant_id String? @map("tenant_id") to your Prisma schema
```

### **Environment Validation**

```typescript
import { getConfigSummary } from '@voilajsx/appkit/database/defaults';

console.log(getConfigSummary());
// Shows current configuration, validation status, and warnings
```

## 📈 Roadmap

- **Vector Search Support** - Built-in pgvector integration
- **Read Replicas** - Automatic read/write splitting
- **Connection Pooling** - Advanced connection management
- **Schema Migrations** - Automated tenant-aware migrations
- **Analytics Dashboard** - Built-in multi-tenant analytics

## 📄 License

MIT © [VoilaJSX](https://github.com/voilajsx)

---

<p align="center">
  <strong>Built for developers who value simplicity and future-proof architecture</strong><br>
  <a href="https://github.com/voilajsx/appkit">⭐ Star us on GitHub</a> •
  <a href="https://discord.gg/voilajsx">💬 Join our Discord</a> •
  <a href="https://twitter.com/voilajsx">🐦 Follow on Twitter</a>
</p>
