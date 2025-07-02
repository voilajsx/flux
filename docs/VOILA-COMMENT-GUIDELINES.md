# VoilaJSX - Code Documentation Standards

## 📋 Overview

This document defines the standard commenting and documentation guidelines for
**all VoilaJSX projects**. These standards ensure consistency across the entire
VoilaJSX ecosystem and are optimized for both human developers and AI code
generation systems.

## 🎯 Why These Standards?

### **For VoilaJSX Ecosystem:**

- **Consistent Experience** - Same patterns across all VoilaJSX packages
- **Faster Adoption** - Developers learn once, use everywhere
- **Quality Assurance** - Prevents common mistakes across projects
- **Brand Recognition** - Professional, polished documentation style

### **For Human Developers:**

- **Faster Onboarding** - Clear when/how to use each module
- **Fewer Mistakes** - Explicit guidance on what to avoid
- **Better Architecture** - Understanding of design decisions
- **Self-Documenting Code** - Reduces need for external docs

### **For AI/LLM Systems:**

- **Correct Code Generation** - AI agents know the right patterns
- **Security by Default** - Prevents common vulnerabilities
- **Framework Compatibility** - Avoids mixing incompatible methods
- **Performance Awareness** - Prevents expensive operations in wrong places
- **VoilaJSX Best Practices** - AI generates code following VoilaJSX conventions

## 📝 VoilaJSX Documentation Template

### **File-Level Documentation**

```typescript
/**
 * [Brief description of what this file does - one sentence]
 * @module @voilajsx/[package-name]/[module-name]
 * @file src/[module-path]/[filename].ts
 *
 * @llm-rule WHEN: [When to use this file/module - clear trigger conditions]
 * @llm-rule AVOID: [When NOT to use or major pitfalls]
 * @llm-rule NOTE: [Critical architectural context] (optional)
 */
```

### **Function/Method Documentation**

```typescript
/**
 * [Function description - what it does and returns]
 * @llm-rule WHEN: [Specific use case for this function]
 * @llm-rule AVOID: [Common mistakes that cause crashes/security issues]
 * @llm-rule NOTE: [Non-obvious behavior, performance notes] (optional)
 */
export function someFunction(param: Type): ReturnType {
  // Implementation
}
```

### **Class Documentation**

```typescript
/**
 * [Class description - what it manages/represents]
 */
export class SomeClass {
  /**
   * [Method description]
   * @llm-rule WHEN: [When to call this method]
   * @llm-rule AVOID: [What breaks when using incorrectly]
   * @llm-rule NOTE: [Important context] (optional)
   */
  public someMethod(param: Type): ReturnType {
    // Implementation
  }
}
```

## 🔧 @llm-rule Guidelines

### **Categories:**

- **WHEN** - Clear trigger conditions for usage
- **AVOID** - Things that break or cause problems
- **NOTE** - Critical context that's not obvious (optional)

### **File-Level Rules (Module Selection):**

```typescript
// ✅ Good Examples
@llm-rule WHEN: Building apps that need authentication with user roles
@llm-rule AVOID: Simple apps with basic login - adds unnecessary complexity
@llm-rule NOTE: Uses role.level hierarchy with automatic inheritance

@llm-rule WHEN: Need to validate and sanitize user input data
@llm-rule AVOID: Performance-critical paths - validation adds ~5ms overhead
@llm-rule NOTE: Works with both synchronous and async validation rules
```

### **Function-Level Rules (Implementation Safety):**

```typescript
// ✅ Good Examples
@llm-rule WHEN: Storing user passwords - always hash before database
@llm-rule AVOID: Storing plain text passwords - major security vulnerability

@llm-rule WHEN: Need to access user data from authenticated requests
@llm-rule AVOID: Accessing req.user directly - WILL crash when undefined

@llm-rule WHEN: Validating incoming tokens from requests
@llm-rule AVOID: Using jwt.verify directly - this handles errors properly
```

### **What to Include:**

#### **WHEN (Decision Making):**

- Specific use cases and scenarios
- Technical requirements that trigger usage
- Business logic conditions

#### **AVOID (Mistake Prevention):**

- Common errors that cause crashes
- Security vulnerabilities
- Performance anti-patterns
- Framework incompatibilities
- Wrong tool selection

#### **NOTE (Critical Context):**

- Non-obvious behaviors
- Performance characteristics
- Architectural decisions
- Breaking changes or migration info
- Framework-specific considerations

### **What NOT to Include:**

❌ **Avoid These Patterns:**

```typescript
// Too obvious
@llm-rule WHEN: Need to call this function
@llm-rule AVOID: Not calling this function

// Redundant with code
@llm-rule PURPOSE: Returns user data
@llm-rule EXPORTS: User object

// Too verbose
@llm-rule USAGE: This function should be used when you want to...
@llm-rule DESCRIPTION: This method performs the operation of...
```

## 🎨 VoilaJSX Style Guidelines

### **Tone:**

- **Clear and Direct** - No ambiguous language
- **Action-Oriented** - Use verbs (building, protecting, validating)
- **Problem-Solution Focused** - Address real developer pain points

### **Language:**

- **Consistent Terminology** - Same terms across all VoilaJSX packages
- **Framework Agnostic** - Unless specifically targeting a framework
- **Developer-Friendly** - Use common development terms

### **Structure:**

- **Maximum 3 @llm-rules** per item (file/function/method)
- **WHEN first, AVOID second, NOTE last**
- **One line per rule** - keep concise
- **NOTE is optional** - only when truly necessary

## 📊 Quality Checklist

Before publishing any VoilaJSX code, ensure:

### **File Level:**

- [ ] Clear module purpose in first line
- [ ] Proper @module and @file tags
- [ ] WHEN explains module selection criteria
- [ ] AVOID prevents wrong tool choice
- [ ] NOTE covers architectural decisions (if needed)

### **Function Level:**

- [ ] WHEN covers specific use cases
- [ ] AVOID prevents crashes/security issues
- [ ] NOTE explains non-obvious behavior (if needed)
- [ ] No more than 3 @llm-rules per function

### **Overall:**

- [ ] Consistent with other VoilaJSX packages
- [ ] Optimized for AI code generation
- [ ] Helpful for human developers
- [ ] No redundant information

## 🚀 Benefits for VoilaJSX Ecosystem

### **Developer Experience:**

- **Faster Learning Curve** - Consistent patterns across packages
- **Fewer Support Tickets** - Self-documenting code prevents issues
- **Higher Adoption** - Clear usage guidelines increase confidence

### **AI-First Development:**

- **Better Code Generation** - AI agents produce VoilaJSX-compliant code
- **Reduced Errors** - AI avoids common pitfalls automatically
- **Framework Leadership** - Sets standard for AI-ready frameworks

### **Maintainability:**

- **Consistent Reviews** - Clear standards for code review
- **Easier Updates** - Documented architectural decisions
- **Quality Assurance** - Prevents regression in best practices

## 📝 Implementation

### **For New VoilaJSX Projects:**

1. Copy this template for all files
2. Customize WHEN/AVOID/NOTE for your specific use cases
3. Review with VoilaJSX team before publishing

### **For Existing VoilaJSX Projects:**

1. Gradually add @llm-rules to critical functions
2. Prioritize files that cause the most developer confusion
3. Update during regular maintenance cycles

---

**This standard applies to all VoilaJSX packages and ensures our ecosystem
remains the most developer-friendly and AI-ready framework collection
available.**
