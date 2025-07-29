# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development Workflow
```bash
# Start development server
npm run dev

# Build the project
npm run build

# Run all tests
npm run test

# Full validation pipeline
npm run validate  # Equivalent to build + test
```

### FLUX Framework Commands
```bash
# Complete validation pipeline for all features
npm run flux:check

# Feature-specific validation
npm run flux:check hello              # Validate entire hello feature
npm run flux:check hello/main         # Validate specific endpoint

# Individual validation steps
npm run flux:schema hello             # Schema validation
npm run flux:contract hello/main      # Contract validation  
npm run flux:types hello/main         # TypeScript validation
npm run flux:lint hello/main          # Code style validation
npm run flux:test hello/main          # Test validation
npm run flux:compliance hello         # Compliance check

# Development utilities
npm run flux:skim hello               # Quick validation (schema + types + lint)
npm run flux:actionlog hello write:"message"  # Log agent actions
npm run flux:actionread hello         # Read execution status
```

### Single Test Execution
```bash
# Run specific test files using vitest
npx vitest run src/features/hello/main/main.test.ts
npx vitest run src/features/hello/@name/@name.test.ts

# Run all tests for a feature
npx vitest run src/features/hello/
```

## Codebase Architecture

### FLUX Framework Structure
This is a **FLUX Framework** codebase - an agent-native backend framework designed for 95% AI-driven development with practical reliability guarantees.

#### Core Principles
- **Contract-driven development**: All endpoints must have validated contracts
- **Agent-native design**: Optimized for AI code generation  
- **Endpoint isolation**: Zero cross-dependencies between features
- **VoilaJSX AppKit patterns**: Standardized utility access via `.get()` methodology

#### Project Structure
```
src/
├── features/                    # Feature-based organization
│   └── {feature}/              # Each feature is isolated
│       ├── {feature}.requirements.yml    # 👨 Human: Business requirements
│       ├── {feature}.specification.json  # 👨 Human: Technical specs  
│       ├── {feature}.instructions.yml    # 👨 Human: Agent instructions
│       ├── {feature}.actions.log         # 🤖 Agent: Execution log
│       ├── {feature}.compliance.json     # 🤖 Agent: Compliance report
│       │
│       ├── main/                         # GET/POST /api/{feature}
│       │   ├── main.contract.ts          # 🤖 API contract
│       │   ├── main.logic.ts             # 🤖 Business logic
│       │   └── main.test.ts              # 🤖 Tests
│       │
│       └── @name/                        # GET /api/{feature}/:name  
│           ├── @name.contract.ts         # 🤖 API contract
│           ├── @name.logic.ts            # 🤖 Business logic
│           └── @name.test.ts             # 🤖 Tests
│
├── app.ts                       # Express app with auto-discovery
├── contract.ts                  # Contract validation engine
└── server.ts                    # Production server
```

#### Naming Conventions
- **Endpoints**: `{endpoint}.{type}.ts` (e.g., `main.logic.ts`, `@name.contract.ts`)
- **Features**: Directory names in `src/features/`
- **Routes**: `/api/{feature}` for main endpoints, `/api/{feature}/:param` for parameterized
- **Actions**: Standard REST actions (`list`, `get`, `create`, `update`, `delete`)

### Key Files and Their Purpose

#### Application Entry Points
- **`src/server.ts`**: Production server with health checks and error handling
- **`src/app.ts`**: Express application setup with contract validation and auto-discovery
- **`src/contract.ts`**: Contract validation engine that blocks startup on failures

#### Framework Tools
- **`scripts/index.js`**: Command router for all `flux:*` commands
- **`scripts/commands/`**: Individual validation command implementations
- **`scripts/schemas/`**: JSON schemas for validation
- **`scripts/templates/`**: Code generation templates

#### Configuration
- **`package.json`**: All build, test, and FLUX commands
- **`tsconfig.json`**: Strict TypeScript configuration for agent safety
- **`vitest.config.ts`**: Test configuration
- **`eslint.config.js`**: Code style enforcement

## VoilaJSX AppKit Patterns

### The `.get()` Pattern
**CRITICAL**: All VoilaJSX AppKit modules use the `.get()` pattern for initialization:

```typescript
import { utility } from '@voilajsx/appkit/utils';
import { logger } from '@voilajsx/appkit/logging';
import { error } from '@voilajsx/appkit/error';
import { security } from '@voilajsx/appkit/security';

// ALWAYS use .get() pattern
const utils = utility.get();
const log = logger.get();
const err = error.get();
const secure = security.get();
```

### Required Code Patterns
- **Request IDs**: `const requestId = utils.uuid();`
- **Error handling**: `throw err.badRequest('message')`, `throw err.serverError('message')`
- **Input sanitization**: `secure.input(userInput)` for all user parameters
- **Logging**: Include `requestId` in all log entries
- **Response format**: Always include `success`, `data`, `requestId`, `timestamp`

### Template Usage
**ALWAYS** read templates before creating files:
- Read `scripts/templates/contract.template.ts` before creating contract files
- Read `scripts/templates/logic.template.ts` before creating logic files  
- Read `scripts/templates/test.template.ts` before creating test files

## File Immutability Rules

### NEVER MODIFY
- `*.instructions.yml` files (human-maintained agent blueprints)
- `*.specification.json` files (human-maintained technical specs)
- `*.requirements.yml` files (human-maintained business requirements)

These files are the authoritative source for feature implementation. Any needed changes must be made manually by humans.

## Contract Validation

### Critical Validation Steps
1. **Schema validation**: `npm run flux:schema {feature}` - validates YAML/JSON structure
2. **Contract validation**: `npm run flux:contract {feature}` - validates API contracts
3. **Type validation**: `npm run flux:types {feature}` - TypeScript compilation
4. **Test validation**: `npm run flux:test {feature}` - all tests must pass
5. **Compliance check**: `npm run flux:compliance {feature}` - overall quality metrics

### Validation Requirements
- **Contract compliance**: 100% required
- **Test coverage**: 90%+ minimum
- **Type safety**: 100% required
- **Code quality**: 80%+ minimum
- **Overall reliability**: 90%+ minimum

## Development Guidelines

### Working with Features
1. **Read specifications first**: Always examine `{feature}.specification.json` for implementation details
2. **Follow agent instructions**: Check `{feature}.instructions.yml` for specific implementation guidance
3. **Use contract-driven approach**: Start with contract definition, then logic, then tests
4. **Validate frequently**: Run `npm run flux:check {feature}` after changes

### Code Generation
- **Security first**: Always sanitize user inputs with `secure.input()`
- **Error handling**: Use semantic errors (`err.badRequest()`, `err.serverError()`)
- **Logging**: Include structured logging with request correlation
- **Testing**: Write comprehensive tests including security and edge cases

### Working with Agents
- Check execution status: `npm run flux:actionread {feature}`
- Log progress: `npm run flux:actionlog {feature} write:"message"`
- Follow agent instructions in `{feature}.instructions.yml`
- Resume from last checkpoint as indicated by action logs