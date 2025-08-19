# FLUX Framework Commands Reference

## Command Syntax

### Multi-App Format
```bash
npm run flux:<command> <app>/<version>/<feature>/<endpoint>
```

### Target Patterns
```
{app}/{version}/{feature}           # Full feature validation
{app}/{version}/{feature}/{endpoint} # Single endpoint validation
{app}/{version}/{feature}/{endpoint}/{file} # Specific file validation
```

## Core Validation Commands

### `flux:check` - Complete Validation Pipeline
Runs the full validation sequence: types → lint → test → contract

```bash
# Multi-app format
npm run flux:check greeting/v1/hello         # Complete hello feature
npm run flux:check greeting/v1/hello/main    # Main endpoint only
npm run flux:check flux/v1/weather          # Weather feature in flux app

# Validation sequence
# 1. TypeScript compilation
# 2. Code standards (lint)  
# 3. Functionality tests
# 4. Contract compliance
```

### `flux:skim` - Quick Development Validation
Fast validation for active development: schema + types + lint

```bash
npm run flux:skim greeting/v1/hello/main     # Quick endpoint check
npm run flux:skim greeting/v1/hello          # Quick feature check
```

### `flux:types` - TypeScript Validation
Type checking and compilation verification

```bash
npm run flux:types greeting/v1/hello         # Feature type check
npm run flux:types greeting/v1/hello/main    # Endpoint type check
```

### `flux:lint` - Code Standards Validation
VoilaJSX patterns and coding standards

```bash
npm run flux:lint greeting/v1/hello          # Feature lint check
npm run flux:lint greeting/v1/hello/main     # Endpoint lint check
```

### `flux:test` - Functionality Testing
Run tests with coverage validation

```bash
npm run flux:test greeting/v1/hello          # Feature test suite
npm run flux:test greeting/v1/hello/main     # Endpoint tests only
```

### `flux:contract` - Contract Validation
API contract compliance and consistency

```bash
npm run flux:contract greeting/v1/hello      # Feature contract check
npm run flux:contract greeting/v1/hello/main # Endpoint contract check
```

## Quality & Compliance Commands

### `flux:compliance` - Implementation Validation
Validates implementation against specifications

```bash
npm run flux:compliance greeting/v1/hello    # Feature compliance check
```

### `flux:manifest` - Deployment Readiness
Generates deployment manifests with quality gates

```bash
npm run flux:manifest greeting/v1/hello/main # Endpoint manifest
npm run flux:manifest greeting/v1/hello      # Feature manifests
```

### `flux:schema` - Schema Validation
Validates YAML/JSON specification files

```bash
npm run flux:schema greeting/v1/hello        # Feature schemas
npm run flux:schema greeting/v1/hello/main   # Endpoint schemas
```

## Development Workflow Commands

### `flux:dev` - Development Server
Start development server with hot reload

```bash
npm run flux:dev                             # Start dev server
```

### `flux:build` - Production Build
Build for production deployment

```bash
npm run flux:build                           # Build project
```

### `flux:health` - Health Check
Verify server health status

```bash
npm run flux:health                          # Check server health
```

## AI Agent Commands

### `flux:actionlog` - Agent Action Logging
Log AI agent actions during development

```bash
npm run flux:actionlog greeting/v1/hello write:"Starting implementation"
npm run flux:actionlog greeting/v1/hello checkpoint:"Contract complete"
```

### `flux:actionread` - Read Agent Status
Read current AI agent execution status

```bash
npm run flux:actionread greeting/v1/hello    # Read execution log
```

## Documentation Commands

### `flux:docs` - API Documentation Generation
Generate markdown and JSON documentation

```bash
npm run flux:docs greeting/v1/hello          # Feature documentation
npm run flux:docs greeting/v1/hello/main     # Endpoint documentation
```

## Testing Commands

### `flux:uat` - User Acceptance Testing
Run UAT tests against live endpoints

```bash
npm run flux:uat greeting/v1/hello           # Feature UAT tests
npm run flux:uat greeting/v1/hello/main      # Endpoint UAT tests
```

## Version Management

### `flux:version` - API Versioning
Manage API versions and compatibility

```bash
npm run flux:version greeting                # App version management
npm run flux:version greeting/v1             # Version-specific operations
```

## Git Integration

### `flux:git` - FLUX-Aware Git Operations
Git operations with FLUX context awareness

```bash
npm run flux:git commit greeting/v1/hello    # Commit feature changes
npm run flux:git status greeting/v1/hello    # Feature-specific git status
```

## Help & Utility Commands

### `flux:help` - Command Help
Display available commands and usage

```bash
npm run flux:help                            # Show all commands
```

## Command Categories

### 🔍 **Validation Commands**
- `check` - Complete pipeline
- `skim` - Quick validation  
- `types` - TypeScript check
- `lint` - Code standards
- `test` - Functionality tests
- `contract` - API contracts

### 📋 **Quality Commands**
- `compliance` - Implementation validation
- `manifest` - Deployment readiness
- `schema` - Specification validation

### 🔧 **Development Commands**
- `dev` - Development server
- `build` - Production build
- `health` - Health check

### 🤖 **AI Agent Commands**
- `actionlog` - Log agent actions
- `actionread` - Read agent status

### 📚 **Documentation Commands**
- `docs` - Generate documentation

### 🧪 **Testing Commands**
- `uat` - User acceptance testing

### 📦 **Management Commands**
- `version` - Version management
- `git` - Git operations
- `help` - Command help

## Multi-App Examples

### Greeting App
```bash
npm run flux:check greeting/v1/hello/main    # Hello main endpoint
npm run flux:check greeting/v1/hello/@name   # Hello name endpoint
npm run flux:test greeting/v1/hello          # All hello tests
```

### FLUX App  
```bash
npm run flux:check flux/v1/weather/main      # Weather main endpoint
npm run flux:check flux/v1/weather/@city     # Weather city endpoint
npm run flux:check flux/v2/weather           # Weather v2 feature
```

### Todo App
```bash
npm run flux:check todo/v1/tasks/main        # Todo main endpoint
npm run flux:skim todo/v1/tasks/@id          # Quick task ID check
```

## Exit Codes

- `0` - Success
- `1` - Validation failed
- `2` - Command error
- `3` - File not found
- `4` - Configuration error

## Environment Variables

- `DEBUG=1` - Verbose output
- `FLUX_ENV` - Environment (dev/staging/prod)
- `FLUX_TIMEOUT` - Command timeout (ms)