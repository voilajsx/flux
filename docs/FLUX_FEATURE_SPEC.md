# FLUX Framework Feature Specification Guide

> **The definitive guide for creating perfect FLUX Framework feature specifications that enable 95% agentic development with 100% reliability**

## 🎯 Why This Document Exists

**Problem:** Agents fail when given unclear specifications. Vague requirements lead to wrong code, missing tests, and deployment failures.

**Solution:** FLUX Framework uses 3 precisely structured files that give agents perfect clarity:

- **Blueprint** - WHAT to build (business requirements)
- **Agent** - HOW to build it (execution instructions)
- **Implementation** - EXACTLY what to build (technical specifications)

**Result:** 95% agent autonomy with mathematical reliability guarantees.

---

## 📋 The Three-File System

### Why Three Files?

**Separation of Concerns:**

- **Humans excel at:** Business strategy, user needs, execution planning
- **Agents excel at:** Code generation, testing, compliance validation
- **System excels at:** Technical specifications, validation rules

**File Responsibilities:**

```
Blueprint.yml     → Business person writes user stories
Agent.yml         → Technical lead writes execution plan
Implementation.json → System/human writes technical specs
```

**Mathematical Isolation:** Each file serves a single purpose, preventing conflicts and ensuring clarity.

---

## 📝 Blueprint.yml - Business Requirements

### Purpose

Define WHAT to build and WHY from a business perspective. This file answers: "What problem are we solving for users?"

### Philosophy

- **Business-first thinking** - Start with user value, not technical solutions
- **Story-driven development** - Every feature must solve real user problems
- **Measurable outcomes** - Define success criteria upfront
- **Risk awareness** - Identify and plan for business risks

### Required Reading for Implementation Generation

**Before generating any implementation.json file, LLMs MUST read:**

1. **APPKIT_LLM_GUIDE.md** - Complete VoilaJSX AppKit patterns
   - Module initialization with .get() pattern
   - Error handling with semantic error types
   - Security patterns with secure.input()
   - Logging patterns with structured data
   - All available AppKit modules and their usage

2. **VOILA-COMMENT-GUIDELINES.md** - Code documentation standards
   - @llm-rule WHEN/AVOID/NOTE patterns
   - File header templates
   - Function documentation requirements
   - Module and method commenting standards

3. **FLUX_FOUNDATION_PRINCIPLES.md** - Framework architecture
   - Endpoint isolation principles
   - Contract-driven development
   - Mathematical reliability guarantees
   - 95% agentic + 5% human workflow

**Why This Matters:**

- Ensures consistent VoilaJSX patterns across all generated code
- Prevents common implementation mistakes
- Maintains FLUX Framework architectural principles
- Enables reliable agent code generation

#### 🔴 REQUIRED FIELDS (Must Have)

```yaml
name: string # Feature identifier (lowercase, hyphens)
description: string # One-line business description
version: string # Semantic version (1.0.0)
purpose: string # Why this feature exists
user_stories: array # What users want to accomplish
```

**Why Required:** Agents need clear business context to make implementation decisions.

#### 🟡 RECOMMENDED FIELDS (Should Have)

```yaml
owner: string # Who's responsible
created: string/date # When created
business_value: string # Business impact
target_users: string # Who uses this
priority: enum # low|medium|high|critical
core_features: object # Main feature breakdown
business_rules: array # Business constraints
success_metrics: object # How to measure success
```

**Why Recommended:** Provides business context that improves agent decision-making.

#### 🟢 OPTIONAL FIELDS (Nice to Have)

```yaml
last_updated: string/date # Change tracking
constraints: array # Technical/business limits
assumptions: array # Planning assumptions
business_risks: object # Risk mitigation plans
technical_requirements: object # Complex feature needs
rollout: object # Deployment strategy
```

**Why Optional:** Adds detail for complex features without overwhelming simple ones.

### Writing Guidelines

#### User Stories Best Practices

```yaml
user_stories:
  # ✅ GOOD - Clear actor, action, benefit
  - story: 'As a customer, I want to track my order status so I can plan accordingly'
    acceptance: 'Show real-time order updates with delivery estimates'
    example: 'Order #1234: In Transit - Arriving Tuesday 3-5 PM'

  # ❌ AVOID - Vague, no clear benefit
  - story: 'Users need order tracking'
    acceptance: 'Show orders'
    example: 'List of orders'
```

#### Business Rules Clarity

```yaml
business_rules:
  # ✅ GOOD - Specific, actionable
  - 'Orders over $100 qualify for free shipping'
  - 'Customers must verify email before first purchase'
  - 'Refunds allowed within 30 days of delivery'

  # ❌ AVOID - Vague, unactionable
  - 'Handle orders properly'
  - 'Users should be happy'
  - 'Follow business processes'
```

### LLM Generation Prompt

```
Create a blueprint.yml for [FEATURE_NAME] that [BUSINESS_GOAL].

Requirements:
- Focus on user value and business outcomes
- Write 2-4 specific user stories with acceptance criteria
- Include measurable success metrics
- Define clear business rules and constraints
- Use FLUX schema validation requirements

Business context: [PROVIDE_CONTEXT]
Target users: [DEFINE_USERS]
Success criteria: [DEFINE_SUCCESS]
```

---

## 🤖 Agent.yml - Execution Instructions

### Purpose

Define HOW agents should execute the feature implementation. This file answers: "What steps should the agent follow?"

### Philosophy

- **Step-by-step clarity** - Break complex work into simple sequential tasks
- **Failure resilience** - Plan for errors and recovery
- **Human oversight** - Include approval gates where needed
- **Git workflow** - Proper version control practices

### Schema Structure

#### 🔴 REQUIRED FIELDS (Must Have)

```yaml
feature: string # Must match blueprint name
version: string # Semantic version
agent_instructions: string # Multi-line execution guidance
config: object # Log file, retry limits, commit strategy
validation_commands: object # How to validate each step
tasks: object # Numbered execution tasks
failure_handling: object # What to do when things fail
completion_criteria: object # How to know when done
```

**Why Required:** Agents need explicit instructions to execute reliably.

#### 🟡 RECOMMENDED FIELDS (Should Have)

```yaml
created: string/date # When created
created_by: string # Who created it
last_updated: string/date # Change tracking
updated_by: string # Who updated it
final_log_entry: string # Success message template
```

**Why Recommended:** Provides audit trail and execution context.

#### 🟢 OPTIONAL FIELDS (Nice to Have)

```yaml
# Task-level optional fields:
if_condition: string # Conditional logic
else_action: string # Failure alternatives
git_branch: string # Feature branch workflow
approval_required: boolean # Human approval gates
notify: object # Notification configuration
```

**Why Optional:** Adds workflow intelligence for complex features.

### Writing Guidelines

#### Task Structuring Best Practices

```yaml
tasks:
  1:
    name: 'analyze_requirements' # Clear, descriptive name
    what: 'Read and understand specs' # What this task accomplishes
    steps: # Step-by-step instructions
      - 'Read blueprint.yml for business context'
      - 'Parse implementation.json for technical specs'
      - 'Create execution plan'
      - 'Log analysis complete'
    max_retries: 3
    if_stuck: 'Ask human for clarification'
    approval_required: true # Human checkpoint
```

#### Validation Commands Structure

```yaml
validation_commands:
  contract: 'npm run flux:contract {feature}/{endpoint}'
  types: 'npm run flux:types {feature}/{endpoint}'
  lint: 'npm run flux:lint {feature}/{endpoint}'
  test: 'npm run flux:test {feature}/{endpoint}'
  full: 'npm run flux:check {feature}'
  compliance: 'npm run flux:compliance {feature}'
```

### LLM Generation Prompt

```
Create an agent.yml for [FEATURE_NAME] with [ENDPOINT_COUNT] endpoints.

CRITICAL - Read these documents FIRST:
1. APPKIT_LLM_GUIDE.md - VoilaJSX patterns and best practices
2. VOILA-COMMENT-GUIDELINES.md - Code documentation standards
3. FLUX_FOUNDATION_PRINCIPLES.md - Framework architecture

Requirements:
- Create 8-12 sequential tasks for complete implementation
- Include contract, logic, and test creation for each endpoint
- Add validation steps after each major milestone
- Include git workflow and human approval gates
- Use FLUX validation commands
- Plan for failure scenarios and recovery
- Ensure all generated code follows VoilaJSX AppKit patterns
- Include proper @llm-rule comments in all generated files

Endpoints to implement: [LIST_ENDPOINTS]
Complexity level: [SIMPLE/MEDIUM/COMPLEX]
Special requirements: [LIST_REQUIREMENTS]

REMINDER: Generated code must use VoilaJSX AppKit modules with .get() pattern.
```

---

## 🔧 Implementation.json - Technical Specifications

### Purpose

Define EXACTLY what to build with precise technical specifications. This file answers: "What code should the agent generate?"

### Philosophy

- **Zero ambiguity** - Agents get exact specifications, no guessing
- **VoilaJSX patterns** - Consistent framework usage across all features
- **Validation-driven** - Every specification is automatically validated
- **Business logic clarity** - Precise rules for complex scenarios

### Schema Structure

#### 🔴 REQUIRED FIELDS (Must Have)

```yaml
feature: string # Must match blueprint name
version: string # Semantic version
validation_targets: object # Coverage, patterns, thresholds
endpoints: object # Complete endpoint specifications
```

**Why Required:** Agents need complete technical specifications to generate reliable code.

#### 🟡 RECOMMENDED FIELDS (Should Have)

```yaml
generated_at: string/date # Generation timestamp
last_updated: string/date # Change tracking
source_blueprint: string # Source blueprint file
business_logic: object # Business rules and calculations
code_generation_guidelines: object # Coding patterns and standards
```

**Why Recommended:** Provides context and business logic clarity for agents.

#### 🟢 OPTIONAL FIELDS (Nice to Have)

```yaml
agent_context_notes: object # Additional context for agents
file_structure: object # Expected file layout
validation_skip_pattern: string # Fields to skip during validation
```

**Why Optional:** Provides additional context without overwhelming core specifications.

### Endpoint Specification Structure

Each endpoint requires complete specifications:

```json
"endpoints": {
  "main": {
    "id": 1,
    "route": "GET /api/hello",
    "folder": "src/features/hello/main/",

    "contract": {
      "file": "main.contract.ts",
      "routes": {"GET /hello": "list"},
      "imports": {
        "appkit": ["logging", "error", "utils"],
        "external": ["express"]
      },
      "tests": ["should return welcome message"]
    },

    "logic": {
      "file": "main.logic.ts",
      "exports": ["list"],
      "functions": {
        "list": {
          "params": ["req: Request", "res: Response"],
          "return_type": "Promise<void>",
          "response_schema": {
            "success": "boolean",
            "data.message": "string",
            "data.requestId": "string"
          }
        }
      }
    },

    "test": {
      "file": "main.test.ts",
      "test_cases": [
        {
          "name": "should return welcome message",
          "http_method": "GET",
          "path": "/api/hello",
          "expected_status": 200,
          "expected_properties": ["success", "data.message"]
        }
      ],
      "coverage_target": 100
    }
  }
}
```

### Business Logic Specifications

For complex features, include precise business logic:

```json
"business_logic": {
  "calculations": [
    "discount = amount * 0.1 if amount > 100",
    "tax = subtotal * tax_rate based on shipping_address.state"
  ],
  "validations": [
    "email must be unique across all users",
    "password must contain 8+ chars, 1 uppercase, 1 number",
    "age must be >= 18 for account creation"
  ],
  "workflows": [
    "order_creation: validate_cart → calculate_totals → process_payment → create_order",
    "user_registration: validate_input → create_account → send_verification → activate_account"
  ],
  "permissions": [
    "admin: full access to all endpoints",
    "user: read-only access to own data",
    "guest: access to public endpoints only"
  ],
  "edge_cases": [
    "handle timezone differences for date calculations",
    "gracefully handle null/undefined user preferences",
    "retry failed external API calls with exponential backoff"
  ],
  "error_scenarios": [
    "invalid_email: return 400 with 'Invalid email format'",
    "duplicate_user: return 409 with 'Email already registered'",
    "server_error: return 500 with generic message, log details"
  ]
}
```

### LLM Generation Prompt

```
Create an implementation.json for [FEATURE_NAME] based on the blueprint.yml.

CRITICAL - Read these documents FIRST:
1. APPKIT_LLM_GUIDE.md - VoilaJSX patterns and modules
2. VOILA-COMMENT-GUIDELINES.md - Code documentation standards
3. FLUX_FOUNDATION_PRINCIPLES.md - Framework architecture

Requirements:
- Generate complete endpoint specifications for each user story
- Include precise VoilaJSX patterns and imports FROM APPKIT_LLM_GUIDE.md
- Follow VoilaJSX comment standards FROM VOILA-COMMENT-GUIDELINES.md
- Define exact test cases with expected responses
- Specify business logic, validations, and error scenarios
- Use FLUX validation targets and reliability thresholds
- Include security requirements for user input handling
- Use ONLY VoilaJSX AppKit modules (utils, logger, error, security, etc.)
- Follow .get() pattern for ALL module initialization

Blueprint context: [INCLUDE_BLUEPRINT_CONTENT]
Endpoints needed: [LIST_ENDPOINTS_FROM_STORIES]
Security level: [LOW/MEDIUM/HIGH]
Complexity: [SIMPLE/COMPLEX]

REMINDER: All code must follow VoilaJSX standards and FLUX Framework principles.
```

---

## 🎯 File Relationships and Workflow

### How Files Work Together

```
Blueprint.yml (Business Intent)
    ↓
Agent.yml (Execution Plan)
    ↓
Implementation.json (Technical Specs)
    ↓
Agent Execution → Generated Code
```

### Cross-File Validation

**Name Consistency:**

- `blueprint.name` = `agent.feature` = `implementation.feature`

**Story-to-Endpoint Mapping:**

- Each user story should map to specific endpoints in implementation.json
- Agent tasks should cover all endpoints defined in implementation.json

**Version Alignment:**

- All three files should maintain consistent version numbers
- Update versions together when making changes

### Quality Checklist

#### Before Agent Execution

- [ ] All three files validate against schemas
- [ ] Feature names match across all files
- [ ] User stories map to implementation endpoints
- [ ] Agent tasks cover all required work
- [ ] Business logic is clearly specified
- [ ] Validation commands are complete

#### After Agent Execution

- [ ] All validation pipelines pass
- [ ] Generated code matches specifications
- [ ] Test coverage meets targets
- [ ] Business logic is correctly implemented
- [ ] Security requirements are satisfied

---

## 🚀 LLM Generation Best Practices

### Prompt Engineering Guidelines

#### Context Providing

```
Always provide:
1. Business context from existing blueprint
2. Technical complexity level
3. Security requirements
4. Integration needs
5. Performance expectations
```

#### Specification Completeness

```
For blueprints: Focus on user value and business outcomes
For agents: Focus on execution steps and failure handling
For implementations: Focus on technical precision and business logic
```

#### Validation Integration

```
Always include:
- FLUX validation commands in agent files
- Complete test specifications in implementation files
- Business rule validation in all three files
```

### Common LLM Mistakes to Avoid

#### Blueprint Generation

- ❌ Technical implementation details in business stories
- ❌ Vague acceptance criteria without measurable outcomes
- ❌ Missing business rules and constraints
- ✅ Focus on user value, clear success metrics, specific business rules

#### Agent Generation

- ❌ Missing validation steps between tasks
- ❌ No failure handling or retry logic
- ❌ Unclear task dependencies and order
- ✅ Sequential tasks, comprehensive validation, clear failure recovery

#### Implementation Generation

- ❌ Missing business logic specifications
- ❌ Incomplete test case definitions
- ❌ Vague VoilaJSX pattern requirements
- ✅ Precise business rules, complete test specs, exact technical patterns

---

## 📖 Example: Complete Feature Specification

### Hello Feature Example

**Blueprint Focus:** Simple greeting service for user engagement
**Agent Focus:** Sequential implementation with validation gates
**Implementation Focus:** Two endpoints with security and testing

**File Relationships:**

- Blueprint user stories → Implementation endpoints
- Agent tasks → Complete development workflow
- Implementation specs → Generated code structure

**Validation Flow:**

1. Schema validation ensures file correctness
2. Cross-reference validation ensures consistency
3. Agent execution follows specifications exactly
4. Generated code passes all validation pipelines

---

## 🎯 Success Criteria

### Perfect FLUX Feature Specifications Achieve:

**95% Agent Reliability:**

- Agents get clear, unambiguous instructions
- Business logic is precisely specified
- Error scenarios are explicitly handled
- Validation gates prevent failures

**Mathematical Isolation:**

- Each feature is completely self-contained
- No cross-dependencies between features
- Changes to one feature don't affect others
- Deployment failures are impossible

**Human-Agent Collaboration:**

- Humans focus on business strategy and value
- Agents focus on technical implementation
- Clear handoff points with approval gates
- Audit trails for accountability

**Enterprise Quality:**

- 100% test coverage requirements
- Security patterns enforced automatically
- Performance targets specified upfront
- Compliance validation built-in

---

## 📚 Schema Validation

All files must pass schema validation before agent execution:

```bash
# Validate individual schemas
npm run flux:validate schema:blueprint
npm run flux:validate schema:agent
npm run flux:validate schema:implementation

# Validate all schemas and cross-references
npm run flux:validate all
```

**Why Schema Validation Matters:**

- Prevents agent execution with incomplete specifications
- Ensures consistency across all feature files
- Catches specification errors before code generation
- Provides clear error messages for quick fixes

---

**Remember: Perfect specifications enable perfect code generation. Invest time in specification quality to achieve 95% agentic reliability.**
