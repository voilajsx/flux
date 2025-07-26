# FLUX Framework

> **The first framework designed for 95% AI-driven development with practical reliability guarantees**

[![FLUX Framework](https://img.shields.io/badge/FLUX-Framework-green.svg)](https://github.com/voilajsx/flux)
[![VoilaJSX AppKit](https://img.shields.io/badge/VoilaJSX-AppKit-purple.svg)](https://github.com/voilajsx/appkit)

**FLUX Framework** enables AI agents to build production-ready microservices while humans focus on business strategy. Write specifications in plain English, let agents generate enterprise-grade code.

---

## 🎯 **The Problem with Current Frameworks**

Traditional microservices frameworks were built for human developers in 2010-2020. In the AI age, they create unnecessary friction:

- **Spring Boot**: Complex annotations, steep learning curves, manual configuration
- **NestJS**: Decorator-heavy, human-centric design patterns
- **Express.js**: Too flexible, requires extensive setup for production
- **Serverless**: Great for functions, complex for full applications

**Result:** Slow development, configuration errors, breaking changes, maintenance nightmares.

---

## 🚀 **FLUX's Revolutionary Approach**

### **The 95/5 Development Model**

- **95% Agent Work** - AI generates code, tests, documentation, configurations
- **5% Human Work** - Business requirements, technical specifications, strategic decisions
- **Zero Breaking Changes** - Practical endpoint isolation guarantees
- **Specification-Driven** - Perfect clarity eliminates agent guessing

### **Practical Reliability**

Unlike frameworks that rely on developer discipline, FLUX provides **practical guarantees**:

- ✅ **Endpoint Isolation** - Zero cross-dependencies between features
- ✅ **Contract Validation** - Runtime failures prevented at build time
- ✅ **Human-Controlled Quality** - Tests, docs, monitoring built-in
- ✅ **Breaking Change Prevention** - Practically impossible with proper isolation

### **Agent-Native Design**

FLUX is the first framework built specifically for AI development:

- **Perfect Agent Context** - ≤800 lines per file, clear specifications
- **Human-Controlled Specs** - Humans create technical specifications for agents
- **Real-Time Feedback** - Live progress tracking and validation
- **Declarative Instructions** - Agents follow explicit step sequences

---

## 📊 **Framework Comparison: The 8 Critical Parameters**

| Parameter             | FLUX Framework                         | Spring Boot                       | NestJS                            | Express.js                  | Serverless                     |
| --------------------- | -------------------------------------- | --------------------------------- | --------------------------------- | --------------------------- | ------------------------------ |
| **Development Speed** | **40/40 ⭐** <br>95% agent autonomy    | 20/40 ⭐ <br>Manual setup         | 25/40 ⭐ <br>Boilerplate heavy    | 15/40 ⭐ <br>Manual config  | 30/40 ⭐ <br>Limited scope     |
| **Reliability**       | **40/40 ⭐** <br>Practical isolation   | 25/40 ⭐ <br>Developer discipline | 30/40 ⭐ <br>Framework discipline | 20/40 ⭐ <br>No guarantees  | 35/40 ⭐ <br>Platform managed  |
| **Scalability**       | **40/40 ⭐** <br>True independence     | 30/40 ⭐ <br>Monolithic patterns  | 35/40 ⭐ <br>Service complexity   | 25/40 ⭐ <br>Manual scaling | 35/40 ⭐ <br>Auto-scaling      |
| **Learning Curve**    | **40/40 ⭐** <br>Write specs, not code | 15/40 ⭐ <br>Complex annotations  | 20/40 ⭐ <br>Decorator patterns   | 30/40 ⭐ <br>Minimal API    | 25/40 ⭐ <br>Platform learning |
| **Maintenance**       | **40/40 ⭐** <br>Self-documenting      | 20/40 ⭐ <br>Manual maintenance   | 25/40 ⭐ <br>Framework updates    | 15/40 ⭐ <br>Manual effort  | 30/40 ⭐ <br>Platform managed  |
| **Code Quality**      | **40/40 ⭐** <br>Enforced excellence   | 25/40 ⭐ <br>Developer dependent  | 30/40 ⭐ <br>Framework patterns   | 20/40 ⭐ <br>No enforcement | 25/40 ⭐ <br>Platform patterns |
| **Breaking Changes**  | **40/40 ⭐** <br>Practical prevention  | 20/40 ⭐ <br>Frequent issues      | 25/40 ⭐ <br>Version dependencies | 15/40 ⭐ <br>No protection  | 30/40 ⭐ <br>Platform managed  |
| **Production Ready**  | **40/40 ⭐** <br>Enterprise grade      | 35/40 ⭐ <br>Mature ecosystem     | 30/40 ⭐ <br>Growing ecosystem    | 25/40 ⭐ <br>Custom setup   | 35/40 ⭐ <br>Platform features |

**FLUX Total: 320/320 ⭐** | Spring Boot: 190/320 ⭐ | NestJS: 220/320 ⭐ | Express.js: 165/320 ⭐ | Serverless: 245/320 ⭐

---

## 🏆 **Why FLUX Wins Every Parameter**

### **Development Speed: 30x Faster**

- Agents generate complete features in minutes
- Human-controlled specifications guide agent execution
- Zero manual boilerplate or setup

### **Reliability: Practical Guarantees**

- Endpoint isolation prevents all cross-dependencies
- Contract validation catches errors at build time
- Agent-generated compliance gates block bad deployments

### **Scalability: True Independence**

- Scale individual endpoints without affecting others
- No service mesh complexity or configuration
- Practical isolation eliminates cascading failures

### **Learning Curve: 1-2 Days**

- Write business requirements, not code
- No framework APIs or patterns to memorize
- Real-time agent feedback guides development

### **Maintenance: Self-Documenting**

- Human-controlled technical specifications
- ≤800 lines per file for easy understanding
- Complete audit trails and compliance tracking

### **Code Quality: Enforced Excellence**

- VoilaJSX patterns enforced across all code
- Agent-generated code follows best practices
- 90%+ test coverage requirements built-in

### **Breaking Changes: Practically Impossible**

- Practical endpoint isolation
- Zero shared dependencies between features
- Deploy features independently with confidence

### **Production Ready: Enterprise Grade**

- Built-in security, monitoring, health checks
- Human-controlled deployment configurations
- Real-time compliance and performance tracking

---

## 🎯 **Perfect For**

### **Startups**

- Get to market 30x faster
- Focus on business logic, not infrastructure
- Scale without technical debt

### **Enterprise Teams**

- Reduce development costs by 90%
- Eliminate breaking changes and downtime
- Predictable delivery timelines

### **AI-First Organizations**

- Native agent integration
- Future-proof architecture
- Designed for the AI development era

---

## 🏗️ **Project Structure**

```
src/
├── features/
│   └── hello/                    # Feature name
│       ├── hello.requirements.yml   # 👨 Human: Business requirements
│       ├── hello.specification.json # 👨 Human: Technical specs
│       ├── hello.instructions.yml   # 👨 Human: Agent instructions
│       ├── hello.actions.log     # 🤖 Agent: Execution log
│       ├── hello.compliance.json     # 🤖 Agent: Compliance report
│       │
│       ├── main/                 # GET/POST /api/hello
│       │   ├── main.contract.ts  # 🤖 Agent: API specification
│       │   ├── main.logic.ts     # 🤖 Agent: Business logic
│       │   └── main.test.ts      # 🤖 Agent: Tests
│       │
│       └── @name/                # GET /api/hello/:name
│           ├── @name.contract.ts # 🤖 Agent: API specification
│           ├── @name.logic.ts    # 🤖 Agent: Business logic
│           └── @name.test.ts     # 🤖 Agent: Tests
│
├── scripts/                      # FLUX Framework tools
│   ├── schemas/                  # Validation schemas
│   └── commands/                 # CLI commands
│
├── app.ts                        # Express app with auto-discovery
├── contract.ts                   # Contract validation
└── server.ts                     # Production server
```

---

## 🚀 **Quick Start**

### **1. Installation**

```bash
git clone https://github.com/voilajsx/flux.git my-app
cd my-app
npm install
npm run dev
```

### **2. Create Your First Feature**

#### **Write Business Requirements** (2 minutes)

```yaml
# src/features/todos/todos.requirements.yml
name: todos
description: Task management for productivity
version: 1.0.0
purpose: Help users organize and track their daily tasks

user_stories:
  - story: As a user, I want to create todos so I can track my tasks
    acceptance: Create new todo with title and description
    example: 'Buy groceries - Get milk, bread, and eggs'
```

#### **Define Technical Specifications** (3 minutes)

```json
// src/features/todos/todos.specification.json
{
  "feature": "todos",
  "version": "1.0.0",
  "endpoints": {
    "create": {
      "route": "/api/todos",
      "method": "POST",
      "logic": {
        "business_rules": [
          "Validate title is not empty",
          "Generate unique ID for todo",
          "Set created timestamp"
        ]
      }
    }
  }
}
```

#### **Define Agent Instructions** (3 minutes)

```yaml
# src/features/todos/todos.instructions.yml
feature: todos
version: 1.0.0
agent_instructions: |
  Implement todo management with VoilaJSX patterns.
  Create endpoints for creating and listing todos.

tasks:
  1:
    name: 'create_todo_endpoint'
    what: 'Build POST /api/todos endpoint'
    steps:
      - 'Read todos.specification.json for endpoint specs'
      - 'Create create/create.contract.ts'
      - 'Create create/create.logic.ts with VoilaJSX patterns'
      - 'Create create/create.test.ts'
      - 'Validate with npm run flux:check todos'
```

### **3. Let Agent Build** (5 minutes)

```bash
# Agent reads your specifications and builds the feature
npm run flux:agent todos

# Monitor real-time progress
tail -f src/features/todos/todos.actions.log

# Review compliance report
cat src/features/todos/todos.compliance.json
```

### **4. Deploy** (1 minute)

```bash
npm run flux:check todos  # Final validation
npm run build
npm start
```

**🎉 Your feature is live! Total time: ~15 minutes**

---

## 🎯 **For Different Roles**

### **For Development Teams**

- **95% faster development** - Agents handle implementation details
- **Zero breaking changes** - Practical endpoint isolation
- **Predictable delivery** - Specification-driven timeline
- **Quality consistency** - VoilaJSX patterns across all code
- **Self-documenting** - Generated manifests and reports

### **For AI Agents**

- **Perfect context** - 800-line files fit AI context windows
- **Clear instructions** - Complete specifications eliminate guessing
- **Safe operations** - Contract validation prevents errors
- **Quality feedback** - Immediate validation results
- **Pattern consistency** - VoilaJSX AppKit provides reliable utilities

### **For Production**

- **Instant scaling** - Environment-driven configuration
- **Zero downtime** - Atomic deployments with rollback
- **Real-time health** - Built-in monitoring and alerting
- **Security-first** - Production patterns enforced automatically
- **Enterprise-ready** - Compliance validation and audit trails

---

## 📚 **Documentation**

### **Core Guides**

- 📋 **[FLUX_FEATURE_SPEC.md](./FLUX_FEATURE_SPEC.md)** - How to write specifications
- 🤖 **[APPKIT_LLM_GUIDE.md](./APPKIT_LLM_GUIDE.md)** - VoilaJSX patterns for agents
- 💬 **[VOILA-COMMENT-GUIDELINES.md](./VOILA-COMMENT-GUIDELINES.md)** - Code documentation standards
- 🏗️ **[FLUX_FOUNDATION_PRINCIPLES.md](./FLUX_FOUNDATION_PRINCIPLES.md)** - Framework architecture

### **Reference**

- 🔧 **[VoilaJSX AppKit](https://github.com/voilajsx/appkit)** - Production utilities
- 📖 **[Schema Validation](./scripts/schemas/)** - Specification schemas
- ⚡ **[CLI Commands](./scripts/commands/)** - Development tools

---

## 🚀 **Production Deployment**

### **Environment Setup**

```bash
# Required for production
NODE_ENV=production
VOILA_AUTH_SECRET=your-secure-32-char-secret
VOILA_SECURITY_CSRF_SECRET=your-csrf-secret
VOILA_SECURITY_ENCRYPTION_KEY=your-64-char-encryption-key

# Optional services (auto-scaling)
REDIS_URL=redis://prod-redis:6379
DATABASE_URL=postgresql://user:pass@host:5432/db
RESEND_API_KEY=re_prod_api_key
```

### **Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Health Checks**

```bash
curl -f http://localhost:3000/health || exit 1
```

---

## 🎯 **Ready to Build?**

```bash
# Start your first FLUX project
git clone https://github.com/voilajsx/flux.git my-app
cd my-app
npm install
npm run dev

# Create specifications → Let agents build → Deploy to production
```

**FLUX Framework: Where human creativity meets AI precision.** ✨

---

## 📄 **License**

MIT © [VoilaJSX Team](https://github.com/voilajsx)
