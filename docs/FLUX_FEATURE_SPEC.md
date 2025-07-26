# FLUX Framework Feature Specification Guide v3.1

## 🎯 **The FLUX Feature Creation System**

FLUX Framework enables **95% agentic development** through precise human-controlled specifications that guide AI agents in generating production-ready code.

### **Three-File Human Specification System**

```yaml
{feature}.requirements.yml     # Human: Business requirements & user stories
{feature}.instructions.yml     # Human: Agent execution instructions
{feature}.specification.json   # Human: Technical specifications & patterns
```

### **Two-File Agent Reporting System**

```yaml
{feature}.compliance.json      # Agent: Generated compliance tracking
{feature}.actions.log          # Agent: Real-time execution progress
```

---

## 📋 Requirements.yml - Business Requirements

### Purpose

Define WHAT to build and WHY it matters. This file answers: "What business value does this feature provide?"

### Philosophy

- **User-focused** - Every feature solves real user problems
- **Measurable outcomes** - Success criteria are specific and trackable
- **Business clarity** - Clear business rules and constraints
- **Acceptance-driven** - Precise acceptance criteria for each story

### Schema Structure

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
Create a {feature}.requirements.yml for [FEATURE_NAME] that [BUSINESS_GOAL].

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

## 🤖 Instructions.yml - Agent Execution Instructions

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
feature: string # Must match requirements name
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
      - 'Read {feature}.requirements.yml for business context'
      - 'Parse {feature}.specification.json for technical specs'
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
Create a {feature}.instructions.yml for [FEATURE_NAME] with [ENDPOINT_COUNT] endpoints.

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

## 🔧 Specification.json - Technical Specifications

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
feature: string # Must match requirements name
version: string # Semantic version
validation_targets: object # Coverage, patterns, thresholds
endpoints: object # Complete endpoint specifications
```

**Why Required:** Agents need complete technical specifications to generate reliable code.

#### 🟡 RECOMMENDED FIELDS (Should Have)

```yaml
created_at: string/date # Creation timestamp
last_updated: string/date # Change tracking
source_requirements: string # Source requirements file
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

### Writing Guidelines

#### Endpoint Specification Structure

```json
{
  "endpoints": {
    "main": {
      "id": "hello-main",
      "route": "/api/hello",
      "folder": "src/features/hello/main",
      "contract": {
        "file": "main.contract.ts",
        "routes": {
          "GET /api/hello": "getHello"
        },
        "imports": {
          "appkit": ["utils", "logging"],
          "external": []
        }
      },
      "logic": {
        "file": "main.logic.ts",
        "exports": ["getHello"],
        "business_rules": [
          "Return greeting with unique request ID",
          "Log all requests for monitoring"
        ]
      },
      "test": {
        "file": "main.test.ts",
        "coverage_target": 100,
        "test_cases": [
          "should return 200 with greeting message",
          "should include unique requestId in response"
        ]
      }
    }
  }
}
```

### LLM Generation Prompt

```
Create a {feature}.specification.json for [FEATURE_NAME] based on the requirements.

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

Requirements context: [INCLUDE_REQUIREMENTS_CONTENT]
Endpoints needed: [LIST_ENDPOINTS_FROM_STORIES]
Security level: [LOW/MEDIUM/HIGH]
Complexity: [SIMPLE/COMPLEX]

REMINDER: All code must follow VoilaJSX standards and FLUX Framework principles.
```

---

## 🎯 File Relationships and Workflow

### How Files Work Together

```
Requirements.yml (Business Intent)
    ↓
Specification.json (Technical Specs)
    ↓
Instructions.yml (Execution Plan)
    ↓
Agent Execution → Generated Code
```

### Cross-File Validation

**Name Consistency:**

- `requirements.name` = `instructions.feature` = `specification.feature`

**Story-to-Endpoint Mapping:**

- Each user story should map to specific endpoints in specification.json
- Agent tasks should cover all endpoints defined in specification.json

**Version Alignment:**

- All three files should maintain consistent version numbers
- Update versions together when making changes

### Quality Checklist

#### Before Agent Execution

- [ ] All three files validate against schemas
- [ ] Feature names match across all files
- [ ] User stories map to specification endpoints
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
1. Business context from existing requirements
2. Technical complexity level
3. Security requirements
4. Integration needs
5. Performance expectations
```

#### Specification Completeness

```
For requirements: Focus on user value and business outcomes
For instructions: Focus on execution steps and failure handling
For specifications: Focus on technical precision and business logic
```

#### Validation Integration

```
Always include:
- FLUX validation commands in instruction files
- Complete test specifications in specification files
- Business rule validation in all three files
```

### Common LLM Mistakes to Avoid

#### Requirements Generation

- ❌ Technical implementation details in business stories
- ❌ Vague acceptance criteria without measurable outcomes
- ❌ Missing business rules and constraints
- ✅ Focus on user value, clear success metrics, specific business rules

#### Instructions Generation

- ❌ Missing validation steps between tasks
- ❌ No failure handling or retry logic
- ❌ Unclear task dependencies and order
- ✅ Sequential tasks, comprehensive validation, clear failure recovery

#### Specifications Generation

- ❌ Missing business logic specifications
- ❌ Incomplete test case definitions
- ❌ Vague VoilaJSX pattern requirements
- ✅ Precise business rules, complete test specs, exact technical patterns

---

## 📖 Example: Complete Feature Specification

### Hello Feature Example

**Requirements Focus:** Simple greeting service for user engagement
**Instructions Focus:** Sequential implementation with validation gates
**Specifications Focus:** Two endpoints with security and testing

**File Relationships:**

- Requirements user stories → Specification endpoints
- Instructions tasks → Complete development workflow
- Specification specs → Generated code structure

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

**Practical Isolation:**

- Each feature is completely self-contained
- No cross-dependencies between features
- Changes to one feature don't affect others
- Deployment failures are minimized

**Human-Agent Collaboration:**

- Humans focus on business strategy and technical specifications
- Agents focus on code implementation and compliance tracking
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
npm run flux:validate schema:requirements
npm run flux:validate schema:instructions
npm run flux:validate schema:specification

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
