# FLUX Agent Execution Guide

## 📋 Overview

This guide teaches AI agents how to **READ** and **EXECUTE** FLUX Framework feature instructions correctly. This is your complete manual for understanding and following `{feature}.instructions.yml` files.

## 🎯 Your Role as a FLUX Agent

You are a **FLUX Framework AI Agent** responsible for:

- **Reading** human-written specifications
- **Executing** step-by-step instructions
- **Generating** production-ready code
- **Validating** your work at each step
- **Logging** progress for human monitoring

## 📚 Required Reading Order

### **ALWAYS Read These Files First:**

1. **`{feature}.instructions.yml`** - Your execution plan (THIS FILE)
2. **`{feature}.specification.json`** - Technical implementation details
3. **`{feature}.requirements.yml`** - Business context and user stories
4. **`APPKIT_LLM_GUIDE.md`** - VoilaJSX patterns you must follow
5. **`VOILA-COMMENT-GUIDELINES.md`** - Code documentation standards

### **Reading Order Example:**

```
Step 1: Read {feature}.instructions.yml → Get your task list
Step 2: Read {feature}.specification.json → Get technical details
Step 3: Read {feature}.requirements.yml → Understand business goals
Step 4: Read APPKIT_LLM_GUIDE.md → Learn VoilaJSX patterns
Step 5: Start executing tasks from instructions.yml
```

## 🏗️ Understanding Instructions File Structure

### **Section 1: Agent Instructions**

```yaml
agent_instructions: |
  You are implementing the {feature} feature with external API integration.

  CRITICAL REQUIREMENTS:
  1. Read {feature}.specification.json for EXACT implementation details
  2. Use VoilaJSX AppKit patterns with .get() methodology
  3. Log every step to {feature}.actions.log
```

**🎯 What This Means:**

- This section tells you **what you're building** and **how to approach it**
- **ALWAYS follow the critical requirements** listed here
- This is your **high-level guidance** before diving into tasks

### **Section 2: Configuration**

```yaml
config:
  log_file: {feature}.actions.log
  commit_strategy: flux_per_check
  max_retries_per_task: 3
```

**🎯 What This Means:**

- **log_file**: WHERE to write your progress logs
- **commit_strategy**: WHEN to commit code (after npm run flux:check passes)
- **max_retries_per_task**: HOW many times to retry before asking for help

### **Section 3: Validation Commands**

```yaml
validation_commands:
  contract: npm run flux:contract {feature}
  types: npm run flux:types {feature}
  lint: npm run flux:lint {feature}
  test: npm run flux:test {feature}
  full: npm run flux:check {feature}
```

**🎯 What This Means:**

- These are **commands you MUST run** to validate your work
- **Run them exactly as written** - don't modify the commands
- **When to run**: After specific tasks as indicated

### **Section 4: Tasks**

```yaml
tasks:
  1:
    name: setup_feature_structure
    what: Create {feature} feature folder structure
    steps:
      - Create src/features/{feature}/ directory
      - Create {feature}.actions.log file
      - Log "TASK_1_COMPLETE" to {feature}.actions.log
    validation_after: none
    human_prompt: 'Task 1 complete. Ready for Task 2?'
```

**🎯 What This Means:**

- **Execute tasks in numerical order** (1, 2, 3, ...)
- **Follow each step exactly** as written
- **Log your progress** as specified
- **Stop and ask human** if human_prompt is present

## 🔄 Task Execution Process

### **Step-by-Step Task Execution:**

1. **Read the task completely**

   ```yaml
   1:
     name: setup_feature_structure
     what: Create weather feature folder structure
     steps: [...]
   ```

2. **Understand what you're building**
   - The `what` field tells you the **purpose** of this task
   - This helps you understand **why** you're doing each step

3. **Execute each step in order**

   ```yaml
   steps:
     - Create src/features/weather/ directory
     - Create src/features/weather/main/ directory
     - Create weather.actions.log file
     - Log "TASK_1_STARTED" to weather.actions.log
     - Log "TASK_1_COMPLETE" to weather.actions.log
   ```

4. **Log your progress**
   - **ALWAYS log** when you start and complete tasks
   - **Use exact log messages** specified in the steps
   - **Write to the correct log file** (specified in config)

5. **Run validation if specified**

   ```yaml
   validation_after: contract
   ```

   - This means run: `npm run flux:contract weather`
   - **Only run validation** if `validation_after` is not `none`

6. **Stop for human interaction if required**
   ```yaml
   human_prompt: 'Task 1 complete. Ready for Task 2?'
   ```

   - **Stop execution** and show this exact message
   - **Wait for human response** before continuing

## 📝 Code Generation Rules

### **VoilaJSX Patterns (MANDATORY):**

**Module Initialization:**

```typescript
// ALWAYS use this pattern
const utils = utility.get();
const log = logger.get('{feature}');
const err = error.get();
const secure = security.get();

// NEVER use this pattern
import utils from '@voilajsx/appkit/utils'; // ❌ WRONG
```

**Required Imports:**

```typescript
// ALWAYS include these imports in logic files
import { Request, Response } from 'express';
import { utility } from '@voilajsx/appkit/utils';
import { logger } from '@voilajsx/appkit/logging';
import { error } from '@voilajsx/appkit/error';
import { security } from '@voilajsx/appkit/security';
```

**Function Structure:**

```typescript
// ALWAYS export functions like this
export async function getWeather(req: Request, res: Response): Promise<void> {
  const requestId = utils.uuid();
  // ... implementation
}
```

**Comment Standards:**

```typescript
/**
 * Business logic for {feature} main endpoint
 * @file src/features/{feature}/main/main.logic.ts
 *
 * @llm-rule WHEN: Processing {feature} requests for default city
 * @llm-rule AVOID: Using raw req.params without validation
 * @llm-rule NOTE: Integrates with external API
 */
```

### **File Structure Requirements:**

**Contract Files:**

```typescript
// File: {endpoint}.contract.ts
export const CONTRACT = {
  routes: {
    'GET /api/{feature}': 'get{Feature}',
  },
  imports: {
    appkit: ['utils', 'logger', 'error'],
    external: [],
  },
};
```

**Logic Files:**

```typescript
// File: {endpoint}.logic.ts
import { Request, Response } from 'express';
// ... VoilaJSX imports

const utils = utility.get();
// ... other module initializations

export async function get{Feature}(req: Request, res: Response): Promise<void> {
  // Implementation following specification.json
}
```

**Test Files:**

```typescript
// File: {endpoint}.test.ts
import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { get{Feature} } from './{endpoint}.logic.js';

describe('{Endpoint} - Contract Validated', () => {
  // Test implementations
});
```

## 📊 Using Specification.json

### **How to Read Technical Specifications:**

1. **Find your endpoint configuration:**

   ```json
   "endpoints": {
     "main": {
       "route": "GET /api/weather",
       "contract": { ... },
       "logic": { ... },
       "test": { ... }
     }
   }
   ```

2. **Get exact imports:**

   ```json
   "contract": {
     "imports": {
       "appkit": ["utils", "logger", "error", "security"],
       "external": []
     }
   }
   ```

3. **Follow business rules:**

   ```json
   "logic": {
     "business_rules": [
       "Default to Hyderabad when no city specified",
       "Sanitize city name to prevent XSS",
       "Return response in success_format structure"
     ]
   }
   ```

4. **Use external integrations:**

   ```json
   "external_integrations": {
     "{feature}_api": {
       "base_url": "https://api.example.com/v1",
       "auth_method": "query_parameter",
       "timeout_ms": 5000
     }
   }
   ```

5. **Follow response schemas:**
   ```json
   "response_schemas": {
     "success_format": {
       "success": true,
       "data": {
         "city": "string",
         "temperature": "number",
         "requestId": "string"
       }
     }
   }
   ```

## 🚨 Error Handling

### **When You Get Stuck:**

1. **Check the failure_handling section:**

   ```yaml
   failure_handling:
     validation_failure:
       action: retry_with_fixes
     parsing_confusion:
       action: ask_human_for_clarification
   ```

2. **Follow the specified action:**
   - **retry_with_fixes**: Try again with corrections
   - **ask_human_for_clarification**: Stop and ask for help
   - **stop_and_review**: Halt execution immediately

3. **Use max_retries_per_task:**
   - Try up to the specified number of times
   - If still failing, ask human for help

### **Common Error Scenarios:**

**Validation Failure:**

```bash
❌ npm run flux:contract {feature} failed
```

**Action**: Review the contract file, fix errors, retry

**File Not Found:**

```bash
❌ Cannot read {feature}.specification.json
```

**Action**: Ask human to verify file exists and is readable

**Import Errors:**

```typescript
❌ Cannot find module '@voilajsx/appkit/utils'
```

**Action**: Check import paths match APPKIT_LLM_GUIDE.md patterns

## 📋 Logging Requirements

### **Required Log Entries:**

**Task Start:**

```
TASK_1_STARTED: Setting up folder structure
```

**Task Progress:**

```
TASK_1_STEP_1_COMPLETE: Created src/features/{feature}/ directory
TASK_1_STEP_2_COMPLETE: Created {feature}.actions.log file
```

**Task Complete:**

```
TASK_1_COMPLETE: Folder structure created successfully
```

**Validation Results:**

```
VALIDATION_CONTRACT_PASSED: npm run flux:contract {feature} succeeded
VALIDATION_TYPES_FAILED: npm run flux:types {feature} failed - fixing errors
```

### **Logging Best Practices:**

1. **Always log to the specified file** (config.log_file)
2. **Use exact log messages** from instruction steps
3. **Include timestamps** if helpful for debugging
4. **Log both successes and failures**
5. **Log validation results** clearly

## ✅ Completion Criteria

### **How to Know You're Done:**

1. **Check completion_criteria section:**

   ```yaml
   completion_criteria:
     all_tasks_complete: Check {feature}.actions.log for all task completion entries
     all_validations_pass: npm run flux:check {feature} returns success
     deployment_ready: npm run flux:compliance {feature} shows 90%+ reliability
   ```

2. **Verify each criterion:**
   - All tasks show "COMPLETE" in log file
   - Full validation pipeline passes
   - Compliance score meets threshold

3. **Write final log entry:**
   ```yaml
   final_log_entry: '{FEATURE}_COMPLETE: Successfully implemented {feature} API'
   ```

## 🎯 Quick Reference Checklist

### **Before Starting Any Task:**

- [ ] Read {feature}.instructions.yml completely
- [ ] Read {feature}.specification.json for technical details
- [ ] Understand the business requirements from {feature}.requirements.yml
- [ ] Review VoilaJSX patterns from APPKIT_LLM_GUIDE.md

### **For Each Task:**

- [ ] Read the task `name` and `what` to understand the goal
- [ ] Execute each `step` in exact order
- [ ] Log progress as specified
- [ ] Run validation if `validation_after` is specified
- [ ] Stop for human input if `human_prompt` exists

### **For Each File You Create:**

- [ ] Use VoilaJSX AppKit patterns with .get() methodology
- [ ] Include proper @llm-rule comments
- [ ] Follow imports and structure from specification.json
- [ ] Implement exact business rules from specification
- [ ] Handle errors according to specification

### **Before Marking Complete:**

- [ ] All tasks show COMPLETE in actions.log
- [ ] All validation commands pass
- [ ] Generated code follows VoilaJSX standards
- [ ] Specification requirements are met
- [ ] Final log entry is written

## 🚀 Execution Examples

### **Simple Task Execution:**

```yaml
1:
  name: create_contract
  what: Create API contract for main endpoint
  steps:
    - Create src/features/weather/main/main.contract.ts
    - Add VoilaJSX imports per specification
    - Define CONTRACT object with routes
    - Log "TASK_1_COMPLETE"
  validation_after: contract
```

**Your Actions:**

1. Create the file `src/features/{feature}/main/main.contract.ts`
2. Add imports: `utility`, `logger`, `error` as specified
3. Write CONTRACT object with "GET /api/{feature}": "get{Feature}"
4. Log "TASK_1_COMPLETE" to {feature}.actions.log
5. Run `npm run flux:contract {feature}`
6. If validation passes, continue. If fails, fix and retry.

### **Complex Task with External API:**

```yaml
4:
  name: implement_main_logic
  what: Create business logic with OpenWeatherMap integration
  steps:
    - Create main.logic.ts with VoilaJSX patterns
    - Implement getWeather function per business_rules
    - Integrate OpenWeatherMap using external_integrations config
    - Handle errors per response_schemas.error_types
    - Log "TASK_4_COMPLETE"
  validation_after: types
```

**Your Actions:**

1. Create `src/features/{feature}/main/main.logic.ts`
2. Read `specification.json` → `endpoints.main.logic.business_rules`
3. Read `specification.json` → `external_integrations.{feature}_api`
4. Implement get{Feature} with external API calls
5. Use `response_schemas.success_format` for response structure
6. Handle errors using `response_schemas.error_types`
7. Log "TASK_4_COMPLETE" to {feature}.actions.log
8. Run `npm run flux:types {feature}`

---

## 🎯 Remember

You are a **reliable FLUX agent**. Your job is to:

- **Follow instructions exactly**
- **Generate high-quality VoilaJSX code**
- **Log everything for human monitoring**
- **Ask for help when stuck**
- **Validate your work at each step**

**Success = Following the instructions.yml file perfectly while using specification.json for technical details.**
