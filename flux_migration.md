# FLUX Framework Update Plan v2.0

## Current State Analysis
✅ **Excellent alignment** between `FLUX_COMMANDS.md` and implementation  
✅ **Multi-app architecture** fully supported  
✅ **Comprehensive validation pipeline** working correctly  
❌ **Multiple config files** creating complexity (`version.json` + `features.config.json` + manifest gates)

---

## Phase 1: Configuration Consolidation

### 1.1 New Schema Design
Create consolidated `{appname}.config.json` format:

```json
{
  "app": "flux",
  "version": "v1", 
  "release_date": "2025-08-20",
  "is_latest": true,
  "metadata": {
    "owner": "Platform Team",
    "status": "active"
  },
  "features": {
    "weather": {
      "enabled": true,
      "environments": ["development", "staging", "production"],
      "endpoints": {
        "main": { "active": true },
        "@city": { "active": true }
      },
      "deployment_gates": {
        "min_compliance_score": 90,
        "require_tests": true
      }
    }
  }
}
```

### 1.2 Files Eliminated
- ❌ `src/api/flux/v1/version.json` 
- ❌ `src/api/flux/v1/features.config.json`
- ❌ Manifest `developer_gate` sections

---

## Phase 2: Script Updates

### 2.1 Multi-App Command Parsing Support

**CRITICAL FIX**: Current scripts default to `flux` app only. Need to support multi-app syntax as documented in `docs/FLUX_COMMANDS.md`.

**Current Problem:**
```bash
npm run flux:check hello/main
# Currently looks in: src/api/hello/main/ (WRONG)
# Should look in: src/api/flux/v1/hello/main/ or src/api/greeting/v1/hello/main/
```

**Required Path Parsing Logic (per FLUX_COMMANDS.md specification):**
```javascript
// Parse: greeting/v1/hello/main or hello/main
// Must follow exact patterns documented in docs/FLUX_COMMANDS.md
function parseTarget(target) {
  const pathParts = target.split('/');
  
  if (pathParts.length >= 3) {
    // Multi-app format: {app}/{version}/{feature}/{endpoint}
    // Example: greeting/v1/hello/main
    return {
      appname: pathParts[0],
      version: pathParts[1], 
      feature: pathParts[2],
      endpoint: pathParts[3] || null
    };
  } else {
    // Legacy format: {feature}/{endpoint} (default to flux/v1)
    // Example: hello/main → flux/v1/hello/main
    return {
      appname: 'flux',
      version: 'v1',
      feature: pathParts[0],
      endpoint: pathParts[1] || null
    };
  }
}

// Build path: src/api/{appname}/{version}/{feature}/{endpoint}
// Must align with directory structure documented in FLUX_COMMANDS.md
const fullPath = `src/api/${parsed.appname}/${parsed.version}/${parsed.feature}/${parsed.endpoint || ''}`;
```

**Files Requiring Multi-App Updates (per FLUX_COMMANDS.md patterns):**
- ✅ `scripts/commands/check.js`
- ✅ `scripts/commands/schema.js`
- ✅ `scripts/commands/types.js`
- ✅ `scripts/commands/lint.js`
- ✅ `scripts/commands/contract.js`
- ✅ `scripts/commands/test.js`
- ✅ `scripts/commands/compliance.js`
- ✅ `scripts/commands/manifest.js`
- ✅ `scripts/commands/git.js`
- ✅ `scripts/commands/uat.js`

**All implementations must strictly follow the command syntax patterns documented in `docs/FLUX_COMMANDS.md`**

### 2.2 Core Command Updates

**`scripts/commands/schema.js`**
- Add multi-app path parsing
- Add validation for new consolidated config schema
- Remove validation for separate `version.json` and `features.config.json`

**`scripts/commands/manifest.js`** 
- Add multi-app path parsing
- Read deployment gates from `{app}.config.json`
- Remove `developer_gate` generation in manifests
- Update deployment readiness logic

**`scripts/commands/version.js`**
- Add multi-app path parsing
- Update to read/write consolidated config format
- Maintain version management capabilities

### 2.3 Discovery Logic Updates

**`src/app.ts` changes:**
```typescript
// OLD: Multiple file reads
const featureFlags = await loadFeatureFlags(appname, version);
const versionInfo = await loadVersionInfo(appname, version);

// NEW: Single config read  
const appConfig = await loadAppConfig(appname, version);
```

### 2.4 Feature Gate Logic
```typescript
// OLD: Check manifest gates + feature flags
function isEndpointReady(manifest): boolean {
  if (manifest.developer_gate?.can_deploy === false) return false;
  // ... multiple checks
}

// NEW: Check app config only
function isEndpointReady(appConfig, feature, endpoint): boolean {
  return appConfig.features[feature]?.endpoints[endpoint]?.active === true;
}
```

---

## Phase 3: Documentation Updates

### 3.1 FLUX_COMMANDS.md Updates
- Update examples to show new config format
- Add migration section
- Update command descriptions for simplified config

### 3.2 Template Updates
- Update code generation templates
- Modify specification files to reference new config structure

---

## Phase 4: Migration Strategy

### 4.1 Direct Migration
- Immediately replace old config files with new format
- Clean break from legacy configuration structure
- One-time migration script: `npm run flux:migrate-config`

### 4.2 Migration Script
```bash
# Convert existing configs and remove old files
npm run flux:migrate-config flux/v1
npm run flux:migrate-config greeting/v1
```

---

## Phase 5: Validation Updates

### 5.1 Quality Gates Consolidation
Replace distributed gates with centralized control:

```typescript
// Check deployment readiness from single source
function canDeploy(appName: string, version: string): boolean {
  const config = loadAppConfig(appName, version);
  const allFeaturesPassing = validateAllFeatures(config);
  const compliancemet = checkComplianceScores(config);
  return allFeaturesPassing && compliancemet;
}
```

---

## Expected Benefits

✅ **Reduced complexity**: 3+ files → 1 file per app  
✅ **Cleaner deployment control**: Single source of truth  
✅ **Easier CI/CD integration**: One config to check  
✅ **Better AI agent experience**: Less file management  
✅ **Maintained reliability**: Same validation rigor  

---

## Implementation Timeline

**Week 1**: Multi-app path parsing + schema design  
**Week 2**: Core script updates (all commands + manifest + discovery)  
**Week 3**: App.ts routing updates + migration script  
**Week 4**: Documentation updates + final testing  

This consolidation maintains all existing FLUX Framework strengths while dramatically simplifying the configuration management for 100% AI code generation workflows.