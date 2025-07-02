# Flux Framework - Enhanced Contract System Design Document

## 🎯 Overview

This document outlines the enhanced contract system for Flux Framework that provides:

- **Clear feature boundaries** with explicit public/private APIs
- **LLM-optimized patterns** for AI-assisted development
- **Precise validation** of feature dependencies
- **Service-only inter-feature communication**

## 📋 Contract Philosophy

### Core Principles

1. **Service-Only Public API**: Features communicate only through services, never direct model sharing
2. **Explicit Dependencies**: All inter-feature and platform dependencies declared
3. **Clear Boundaries**: Public vs private APIs explicitly marked
4. **Targeted Validation**: Each contract type has specific validation rules

### Mental Model

```
Feature = Self-contained module with:
├── Public API (provides)     → Services only (routes + services)
├── Private Code (internal)   → Implementation details (services + models)
├── Platform Imports (import) → External services used
└── Dependencies (needs)      → Services from other features only
```

## 🏗️ Enhanced Contract Syntax

### Complete Contract Example

```typescript
contract: createBackendContract()
  // 🌍 Public API - What this feature offers to others
  .provides('routes', ['GET /users', 'POST /users', 'PUT /users/:id'])
  .provides('services', ['userService']) // Only services, no models

  // 🔒 Private Implementation - Internal to this feature only
  .internal('services', ['passwordHasher', 'validator'])
  .internal('models', ['UserModel', 'AuthConfig'])

  // 📦 Platform Imports - External services/libraries
  .import('appkit', ['auth', 'database', 'logging', 'security'])
  .import('external', ['stripe', 'sendgrid', 'redis'])

  // 🤝 Feature Dependencies - Services from other features only
  .needs('services', ['paymentService', 'notificationService'])

  .build();
```

## 📚 Contract Categories & Validation Rules

### 1. `provides('routes', items[])` - ✅ **Bi-directional Validation**

**Purpose**: Declare HTTP endpoints

```typescript
.provides('routes', ['GET /users', 'POST /users'])
```

**Validation Rules**:

- ✅ **Contract → Code**: All declared routes must exist in route files
- ✅ **Code → Contract**: All implemented routes must be declared
- ✅ **Pattern**: `routes.get('/users', ...)` ↔ `'GET /users'`

### 2. `provides('services', items[])` - ✅ **One-directional Validation**

**Purpose**: Declare services available to other features

```typescript
.provides('services', ['userService', 'authHelper'])
```

**Validation Rules**:

- ✅ **Contract → Code**: All declared services must be exported from service files
- ❌ **Code → Contract**: Services can be exported without being in contract (private exports OK)
- ✅ **Other features may or may not import** - that's optional

### 3. `internal('services', items[])` - ✅ **Bi-directional Validation**

**Purpose**: Document private service implementations

```typescript
.internal('services', ['passwordHasher', 'dbUtils'])
```

**Validation Rules**:

- ✅ **Contract → Code**: All declared internal services must exist as functions/objects
- ✅ **Code → Internal**: All non-exported services should be declared as internal
- ❌ **Must NOT be exported** from service files
- ❌ **Must NOT be imported** by other features

### 4. `internal('models', items[])` - ✅ **Bi-directional Validation**

**Purpose**: Document private model/type definitions

```typescript
.internal('models', ['UserModel', 'DbSchema'])
```

**File Convention**: Use `userModel.ts` not `userTypes.ts`

**Validation Rules**:

- ✅ **Contract → Code**: All declared models must exist in model files
- ✅ **Code → Contract**: All models in model files should be declared
- ❌ **Must NOT be exported** from model files
- ❌ **Must NOT be imported** by other features

### 5. `import('appkit', items[])` - ✅ **Bi-directional Validation**

**Purpose**: Declare AppKit platform service usage

```typescript
.import('appkit', [
  'auth',        // '@voilajsx/appkit/auth'
  'database',    // '@voilajsx/appkit/database'
  'logging',     // '@voilajsx/appkit/logging'
  'config',      // '@voilajsx/appkit/config'
  'security',    // '@voilajsx/appkit/security'
  'error',       // '@voilajsx/appkit/error'
  'storage',     // '@voilajsx/appkit/storage'
  'cache',       // '@voilajsx/appkit/cache'
  'email',       // '@voilajsx/appkit/email'
  'event',       // '@voilajsx/appkit/event'
  'queue',       // '@voilajsx/appkit/queue'
  'utils'        // '@voilajsx/appkit/utils'
])
```

**Validation Rules**:

- ✅ **Contract → Code**: Must have corresponding import statements
- ✅ **Code → Contract**: All AppKit imports must be declared
- ✅ **Must validate service exists** in AppKit

### 6. `import('external', items[])` - ❌ **No Validation (Declarative)**

**Purpose**: Document external service dependencies

```typescript
.import('external', ['stripe', 'sendgrid', 'aws-s3', 'redis'])
```

**Validation Rules**:

- ❌ **No code checking** - documentation only
- ✅ **Good for DevOps** - shows infrastructure dependencies

### 7. `needs('services', items[])` - ✅ **Dependency + Usage Validation**

**Purpose**: Declare dependencies on other features

```typescript
.needs('services', ['paymentService', 'userService'])
```

**Validation Rules**:

- ✅ **Must find provider**: Another feature must `.provides('services', ['paymentService'])`
- ✅ **Must be imported**: Feature must import the needed service
- ✅ **Import path validation**: Must import from correct feature path

## 🔍 Detailed Validation Logic

### Routes - Bi-directional

```javascript
// Scan *Route.ts/*Routes.ts files for exports containing "route"/"routes"
// routes.get('/users', ...) ↔ .provides('routes', ['GET /users'])

async function extractRoutesFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Only detect routes from exports containing "route" or "routes"
  const routeExportRegex = /export\s+(?:const|default)\s+(\w*[Rr]outes?\w*)/g;

  // Then scan for actual route patterns within those exports
  const routePatternRegex = /routes\.(get|post|put|delete|patch|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
}

✅ Contract declares → Code must implement
✅ Code implements → Contract must declare
✅ Export name must contain "route" or "routes"
```

### Services - Exact Count Validation

```javascript
// Scan *Service.ts/*Services.ts files for exports containing "service"/"services"
// export const userService ↔ .provides('services', ['userService'])

async function extractServicesFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Only exports containing "service" or "services"
  const serviceExportRegex = /export\s+(?:const|default|function|class)\s+(\w*[Ss]ervices?\w*)/g;
}

✅ provides + internal count must equal total exported services
✅ All declared services must exist and be exported
✅ All exported services must be declared (either provides or internal)
✅ Export name must contain "service" or "services"
```

### Internal Models - Exact Count Validation

```javascript
// Scan *Model.ts/*Models.ts files for exports containing "model"/"models"
// export interface UserModel ↔ .internal('models', ['UserModel'])

async function extractModelsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Only exports containing "model" or "models"
  const modelExportRegex = /export\s+(?:interface|type|const|class)\s+(\w*[Mm]odels?\w*)/g;
}

✅ internal count must equal total exported models
✅ All declared models must exist and be exported
✅ All exported models must be declared as internal
✅ Export name must contain "model" or "models"
```

### AppKit Imports - Bi-directional

```javascript
// import { auth } from '@voilajsx/appkit/auth' ↔ .import('appkit', ['auth'])

✅ Contract declares → Must have import
✅ Import exists → Must be in contract
```

### Service Dependencies - Provider + Usage

```javascript
// .needs('services', ['userService'])

✅ Another feature must: .provides('services', ['userService'])
✅ This feature must: import userService from '@/features/user/services/userService'
```

## 📁 File Structure

### Feature Structure

```
src/features/user-management/
├── index.ts                    # Contract declaration
├── routes/
│   └── userRoutes.ts          # .provides('routes', [...])
├── services/
│   ├── userService.ts         # export = .provides('services', [...])
│   └── hashHelper.ts          # const (no export) = .internal('services', [...])
├── models/
│   ├── userModel.ts           # interface/type = .internal('models', [...])
│   └── configModel.ts         # interface/type = .internal('models', [...])
```

### Complete Contract Example with Naming Conventions

```typescript
// File structure with proper naming:
// routes/
//   └── userRoutes.ts          → export default userRoutes
// services/
//   ├── userService.ts         → export const userService
//   ├── authService.ts         → export const authService
//   └── hashService.ts         → export const hashService (internal)
// models/
//   ├── userModel.ts           → export interface UserModel
//   └── configModel.ts         → export type ConfigModel

contract: createBackendContract()
  .provides('routes', ['GET /users', 'POST /users', 'PUT /users/:id'])
  .provides('services', ['userService', 'authService']) // Public (2 services)
  .internal('services', ['hashService']) // Private (1 service)
  .internal('models', ['UserModel', 'ConfigModel']) // All models (2 models)
  .import('appkit', ['auth', 'database', 'logging', 'security'])
  .import('external', ['bcrypt'])
  .needs('services', ['notificationService'])
  .build();

// Validation Results:
// ✅ Routes: Bi-directional check with route pattern detection
// ✅ Services: Total count = 2 + 1 = 3 (matches 3 exports from *Service.ts files)
// ✅ Models: Total count = 2 (matches 2 exports from *Model.ts files)
// ✅ All export names follow naming conventions
// ✅ File names follow suffix conventions
```

## 🛣️ Implementation Roadmap

### Phase 1: Core Contract System

#### 1.1 Update `contracts.ts`

```typescript
class ContractBuilder {
  // Updated methods
  provides(category: 'routes' | 'services', items: string[]): ContractBuilder;
  internal(category: 'services' | 'models', items: string[]): ContractBuilder;
  import(source: 'appkit' | 'external', items: string[]): ContractBuilder;
  needs(category: 'services', items: string[]): ContractBuilder;
}

// Updated contract interface
interface FeatureContract {
  provides: { routes?: string[]; services?: string[] };
  internal: { services?: string[]; models?: string[] };
  imports: { appkit?: string[]; external?: string[] };
  needs: { services?: string[] };
}
```

#### 1.2 Update `scripts/contracts.js`

```javascript
// Enhanced validation functions

// ✅ Bi-directional route validation
async function validateRouteContracts(feature)

// ✅ One-directional service provides validation
async function validateServiceProvidesContracts(feature)

// ✅ Bi-directional internal validation
async function validateInternalServiceContracts(feature)
async function validateInternalModelContracts(feature)

// ✅ Bi-directional AppKit import validation
async function validateAppKitImportContracts(feature)

// ❌ No validation for external imports
// Just document them

// ✅ Provider + usage validation for needs
async function validateServiceNeedsContracts(feature, allFeatures)
```

### Phase 2: Enhanced Validation

#### 2.1 Route Validation (Existing - Working)

```javascript
// routes.get('/users', ...) ↔ 'GET /users'
const routeRegex =
  /routes\.(get|post|put|delete|patch|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
```

#### 2.2 Service Count Validation (Exact Match)

```javascript
// provides + internal must equal total exported services
async function validateServiceContracts(feature) {
  const serviceFiles = getServiceFiles(feature); // Only *Service.ts/*Services.ts files
  const exportedServices = [];

  for (const file of serviceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // Only exports containing "service" or "services"
    const serviceExportRegex =
      /export\s+(?:const|default|function|class)\s+(\w*[Ss]ervices?\w*)/g;
    let match;
    while ((match = serviceExportRegex.exec(content)) !== null) {
      exportedServices.push(match[1]);
    }
  }

  const providedServices = feature.contract.provides.services || [];
  const internalServices = feature.contract.internal.services || [];

  // ✅ Exact count validation
  const totalDeclared = providedServices.length + internalServices.length;
  if (totalDeclared !== exportedServices.length) {
    errors.push(
      `Service count mismatch: declared ${totalDeclared}, found ${exportedServices.length}`
    );
  }

  // ✅ All declared must exist in exports
  [...providedServices, ...internalServices].forEach((declared) => {
    if (!exportedServices.includes(declared)) {
      errors.push(`Service '${declared}' declared but not exported`);
    }
  });

  // ✅ All exports must be declared
  exportedServices.forEach((exported) => {
    if (![...providedServices, ...internalServices].includes(exported)) {
      errors.push(
        `Service '${exported}' exported but not declared in contract`
      );
    }
  });
}
```

#### 2.3 Model Count Validation (Exact Match)

```javascript
// All models are internal - internal count must equal total exported models
async function validateModelContracts(feature) {
  const modelFiles = getModelFiles(feature); // Only *Model.ts/*Models.ts files
  const exportedModels = [];

  for (const file of modelFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // Only exports containing "model" or "models"
    const modelExportRegex =
      /export\s+(?:interface|type|const|class)\s+(\w*[Mm]odels?\w*)/g;
    let match;
    while ((match = modelExportRegex.exec(content)) !== null) {
      exportedModels.push(match[1]);
    }
  }

  const internalModels = feature.contract.internal.models || [];

  // ✅ Exact count validation - all models must be internal
  if (internalModels.length !== exportedModels.length) {
    errors.push(
      `Model count mismatch: declared ${internalModels.length}, found ${exportedModels.length}`
    );
  }

  // ✅ All declared must exist in exports
  internalModels.forEach((declared) => {
    if (!exportedModels.includes(declared)) {
      errors.push(`Model '${declared}' declared but not exported`);
    }
  });

  // ✅ All exports must be declared as internal
  exportedModels.forEach((exported) => {
    if (!internalModels.includes(exported)) {
      errors.push(`Model '${exported}' exported but not declared as internal`);
    }
  });
}
```

#### 2.4 Enhanced File Detection

```javascript
function getServiceFiles(feature) {
  const servicesDir = path.join(feature.filePath, '..', 'services');
  if (!fs.existsSync(servicesDir)) return [];
  return fs
    .readdirSync(servicesDir)
    .filter((file) => file.match(/.*Service\.ts$|.*Services\.ts$/)) // Only service files
    .map((file) => path.join(servicesDir, file));
}

function getModelFiles(feature) {
  const modelsDir = path.join(feature.filePath, '..', 'models');
  if (!fs.existsSync(modelsDir)) return [];
  return fs
    .readdirSync(modelsDir)
    .filter((file) => file.match(/.*Model\.ts$|.*Models\.ts$/)) // Only model files
    .map((file) => path.join(modelsDir, file));
}

function getRouteFiles(feature) {
  const routesDir = path.join(feature.filePath, '..', 'routes');
  if (!fs.existsSync(routesDir)) return [];
  return fs
    .readdirSync(routesDir)
    .filter((file) => file.match(/.*Route\.ts$|.*Routes\.ts$/)) // Only route files
    .map((file) => path.join(routesDir, file));
}
```

#### 2.5 Service Needs Validation (Provider + Usage)

```javascript
async function validateServiceNeeds(feature, allFeatures) {
  const neededServices = feature.contract.needs.services || [];

  for (const needed of neededServices) {
    // ✅ Must find provider
    const provider = findServiceProvider(needed, allFeatures);
    if (!provider) {
      errors.push(`Service '${needed}' needed but no feature provides it`);
    }

    // ✅ Must import the service
    const imports = await getFeatureImports(feature);
    const expectedImport = `@/features/${provider}/services/${needed}`;
    if (!imports.includes(expectedImport)) {
      errors.push(
        `Service '${needed}' needed but not imported from '${expectedImport}'`
      );
    }
  }
}
```

## 🎯 Benefits

### For Developers

- **Clear Service Boundaries**: Only services are public APIs
- **No Model Coupling**: Models stay private, services handle data transformation
- **Precise Validation**: Each contract type has specific rules
- **Easy Refactoring**: Internal changes don't break other features

### For LLMs

- **Simple Patterns**: Service-only inter-feature communication
- **Clear Validation Rules**: Each contract type has specific requirements
- **File Conventions**: `userModel.ts` for models, clear structure

### For Architecture

- **Clean Boundaries**: Services are the only public interface
- **Encapsulation**: Models and internal services stay private
- **Dependency Clarity**: Explicit service dependencies only

## 📋 Validation Summary Table

| Contract Type          | Validation          | File Pattern                  | Export Naming                     | Rule                                     |
| ---------------------- | ------------------- | ----------------------------- | --------------------------------- | ---------------------------------------- |
| `provides('routes')`   | ✅ Bi-directional   | `*Route.ts`, `*Routes.ts`     | Must contain "route"/"routes"     | Contract ↔ Code must match exactly      |
| `provides('services')` | ✅ Exact Count      | `*Service.ts`, `*Services.ts` | Must contain "service"/"services" | provides + internal = total exports      |
| `internal('services')` | ✅ Exact Count      | `*Service.ts`, `*Services.ts` | Must contain "service"/"services" | Exported but feature-private             |
| `internal('models')`   | ✅ Exact Count      | `*Model.ts`, `*Models.ts`     | Must contain "model"/"models"     | All models are internal                  |
| `import('appkit')`     | ✅ Bi-directional   | Any file                      | Any name                          | Contract ↔ Import statements must match |
| `import('external')`   | ❌ None             | Any file                      | Any name                          | Declarative documentation only           |
| `needs('services')`    | ✅ Provider + Usage | Any file                      | Any name                          | Must find provider + must import         |

---

_This enhanced contract system provides precise validation rules while maintaining the simplicity of service-only inter-feature communication._
