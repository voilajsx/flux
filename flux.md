# ⚡ Flux Framework: A Comprehensive Guide

## 💡 Ideology and Core Philosophy

The Flux Framework is a contract-driven TypeScript backend framework built on AppKit, designed for modern, scalable, and AI-assisted backend development. Its core philosophy revolves around:

1.  **Contract-First Development**: Every feature explicitly declares what it provides (e.g., routes, services) and what it needs (e.g., database access, authentication). This explicit contract system ensures clear interfaces, prevents hidden dependencies, and enables robust validation.
2.  **Feature Isolation**: Flux promotes building independent, self-contained "features" rather than monolithic applications. Each feature is a complete, isolated module that can be developed, tested, and deployed independently, minimizing coupling and maximizing reusability.
3.  **Platform Service Integration**: It leverages AppKit for common enterprise-grade functionalities like authentication (JWT, roles), logging, configuration, and error handling, providing a solid and secure foundation.
4.  **LLM-Optimized Development**: Flux is specifically designed to facilitate AI-generated code. Its predictable patterns, strict conventions, and clear structure make it ideal for Large Language Models (LLMs) to generate accurate, consistent, and high-quality code with minimal ambiguity.
5.  **TypeScript by Design**: Full TypeScript support ensures type safety, enhances developer experience, and provides enterprise-grade reliability and maintainability.
6.  **Zero Configuration**: Flux aims for smart defaults, reducing boilerplate and allowing developers to focus on business logic.

## 🎯 The Focus of Flux

Flux focuses on:

*   **Accelerated Backend Development**: By providing a structured, opinionated framework, Flux significantly speeds up the development of backend services.
*   **Scalability and Maintainability**: The feature-driven, isolated architecture ensures that applications remain scalable and easy to maintain as they grow.
*   **AI-Assisted Code Generation**: It provides a clear blueprint for LLMs to generate functional and idiomatic backend code, reducing manual effort and ensuring consistency.
*   **Security and Robustness**: Integration with AppKit provides built-in security features like JWT authentication and role-based access control, along with robust error handling and logging.
*   **Developer Experience**: With hot-reloading, clear CLI commands, and strong typing, Flux aims to provide a productive and enjoyable development environment.

## ✨ Benefits of Using Flux

*   **10x Faster Development**: Predictable patterns and LLM-optimization allow for rapid code generation and reduced development cycles.
*   **Zero Integration Issues**: Explicit contracts and feature isolation prevent unexpected side effects and integration headaches.
*   **Enterprise-Grade Security**: Built-in AppKit authentication and security features provide a robust and secure foundation.
*   **Perfect Scalability**: Features remain isolated, allowing for independent scaling and deployment.
*   **Consistent Codebase**: Strict conventions and patterns ensure a uniform codebase, making it easier for teams to collaborate and onboard new members.
*   **Reduced Boilerplate**: Smart defaults and CLI tools automate the creation of common structures, freeing developers from repetitive tasks.
*   **Type Safety**: Comprehensive TypeScript support catches errors early and improves code quality.

## 📁 Files and Folder Structure

The Flux framework enforces a clear and consistent project structure to promote modularity and maintainability.

```
my-backend/
├── flux.ts                    # Main entry point and application bootstrap
├── contracts.ts              # Defines contract types and the ContractBuilder
├── tsconfig.json             # TypeScript configuration for the project
├── package.json              # Project dependencies and scripts
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore rules
├── README.md                 # Project README
├── FLUX-LLM-GUIDE.md         # Detailed guidelines for LLMs
├── src/                      # Source code directory
│   └── features/             # Contains all independent backend features
│       ├── user-management/  # Example: A feature for user CRUD operations
│       │   ├── index.ts         # **Core Feature Config**: Defines the feature's name, contract, and routes. This is the entry point for the feature.
│       │   ├── routes/          # Contains Fastify route handlers for API endpoints.
│       │   │   └── index.ts     # Defines the HTTP endpoints (GET, POST, PUT, DELETE) for the feature.
│       │   ├── services/        # Contains the business logic for the feature.
│       │   │   └── index.ts     # Implements the core functionalities and interacts with models/database.
│       │   ├── models/          # (Optional) Defines database models/schemas for the feature.
│       │   │   └── index.ts     # Data structures and ORM interactions.
│       │   └── types/           # Defines TypeScript interfaces and types specific to the feature.
│       │       └── index.ts     # Request/response types, service interfaces, etc.
│       └── email-service/      # Example: A feature for background email processing
│           ├── index.ts         # Feature config (likely SERVICE_ONLY template)
│           ├── services/        # Contains the background worker logic
│           │   └── index.ts
│           └── types/           # Types for the email service
│               └── index.ts
└── scripts/                  # Contains Flux CLI tools and helper scripts
    ├── flux.js               # Main CLI entry point
    └── lib/                  # CLI utility functions
        ├── build.js
        ├── check.js
        ├── contracts.js
        ├── create.js
        ├── dev.js
        ├── format.js
        ├── help.js
        └── utils.js
```

## 📄 Core Intent of Each File

*   **`flux.ts`**: This is the main application entry point. It's responsible for:
    *   Loading environment variables.
    *   Discovering all features in `src/features`.
    *   Validating feature contracts to ensure all dependencies are met.
    *   Configuring and starting the Fastify server.
    *   Registering routes from discovered features.
    *   Setting up graceful shutdown.
*   **`contracts.ts`**: This file defines the core contract system of Flux. It includes:
    *   `ContractItemType`, `ContractItem`, `FeatureContract` interfaces for defining what a feature provides and needs.
    *   `PLATFORM_SERVICES` enum for standard platform services (database, auth, logging, etc.).
    *   `ContractBuilder` class for a fluent API to build feature contracts.
    *   `createBackendContract()` function to instantiate the builder.
    *   `CONTRACT_TEMPLATES` for predefined common contract patterns (e.g., `API_FEATURE`, `SERVICE_ONLY`).
    *   `validateContract()` function for runtime contract validation.
*   **`src/features/<feature-name>/index.ts`**: This is the heart of each feature. It defines the `FeatureConfig` which includes:
    *   `name`: Unique identifier for the feature.
    *   `contract`: The explicit `FeatureContract` detailing what the feature provides and needs. This is crucial for Flux's contract validation system.
    *   `routes`: An array of `FeatureRouteConfig` objects, specifying the route file and its URL prefix (if the feature exposes HTTP endpoints).
    *   `meta`: Optional metadata about the feature.
*   **`src/features/<feature-name>/routes/index.ts`**: Contains the Fastify plugin that defines the HTTP routes (endpoints) for the feature. It uses `fastify.get`, `fastify.post`, etc., and integrates with AppKit's `authenticator` for security.
*   **`src/features/<feature-name>/services/index.ts`**: Implements the business logic for the feature. This is where the core functionality resides, interacting with data sources (models/database) and other services. Services typically return a standard `FluxResponse` format.
*   **`src/features/<feature-name>/models/index.ts`**: (Optional) Defines the data models or schemas used by the feature, often interacting with a database or ORM.
*   **`src/features/<feature-name>/types/index.ts`**: Contains all TypeScript type definitions, interfaces, and enums specific to the feature, ensuring strong typing throughout.
*   **`scripts/flux.js` and `scripts/lib/*.js`**: These files constitute the Flux CLI. They provide commands for creating new features (`flux:create`), starting the development server (`flux:dev`), building for production (`flux:build`), running quality checks (`flux:check`), and validating contracts (`flux:contracts`).

## 🔄 Overall Workflow

1.  **Define Feature**: Identify a distinct piece of backend functionality (e.g., user management, email notifications).
2.  **Create Feature**: Use `npm run flux:create <feature-name>` to scaffold the feature with the appropriate template (API_FEATURE for CRUD, SERVICE_ONLY for background services).
3.  **Define Contract**: In `src/features/<feature-name>/index.ts`, explicitly define the feature's `contract` using `createBackendContract()`, specifying what it `provides` (routes, services) and what it `needs` (database, auth, other services).
4.  **Implement Logic**:
    *   **Routes**: In `src/features/<feature-name>/routes/index.ts`, define the HTTP endpoints using Fastify, applying AppKit authentication middleware as needed.
    *   **Services**: In `src/features/<feature-name>/services/index.ts`, implement the business logic, interacting with models/database and returning standard `FluxResponse` objects.
    *   **Types**: Define all necessary TypeScript types in `src/features/<feature-name>/types/index.ts`.
5.  **Develop**: Run `npm run flux:dev` for hot-reloading development.
6.  **Validate**: Regularly run `npm run flux:check` (or `flux:contracts`, `flux:format`) to ensure contract validity, code quality, and adherence to conventions.
7.  **Build & Deploy**: Use `npm run flux:build` to compile for production and `npm start` to run the compiled application.

## 🤝 Integrating Flux into Existing Frameworks

Flux is designed to be a standalone backend framework. Integrating it directly into an *existing* non-Flux framework might be challenging due to its opinionated structure and reliance on Fastify and AppKit. However, Flux features can be exposed as independent microservices that your existing framework can consume via HTTP APIs.

**Key considerations for integration:**

*   **Microservice Approach**: Treat Flux applications as independent microservices. Your existing framework can communicate with Flux services via REST APIs.
*   **API Gateway**: Use an API Gateway to route requests to the appropriate Flux microservice.
*   **Shared Data**: If data needs to be shared, consider a shared database or message queues for asynchronous communication.
*   **Authentication**: Flux handles its own authentication. Your existing framework would need to either pass through JWT tokens or have a separate authentication mechanism for its own services.

## 🤖 LLM Guidelines for Generating Code

For LLMs to generate accurate, non-ambiguous, scalable, minimal, consistent, and non-ambiguous code within the Flux framework, adhere to these critical conventions and guidelines:

### 1. **Feature-First Mindset**:
    *   Always think in terms of isolated "features." Each new piece of functionality should reside within its own `src/features/<feature-name>/` directory.
    *   Determine if the feature requires HTTP endpoints (`API_FEATURE` template) or is a background service (`SERVICE_ONLY` template).

### 2. **Strict Contract Definition**:
    *   Every `src/features/<feature-name>/index.ts` **MUST** define a `contract` using `createBackendContract()`.
    *   Explicitly declare all `provides` (routes, services) and `needs` (platform services like `database`, `auth`, `logging`, or other feature services).
    *   Example:
        ```typescript
        contract: createBackendContract()
          .providesRoute('GET /users')
          .providesService('userService')
          .needsDatabase()
          .needsAuth()
          .build(),
        ```

### 3. **Consistent File Structure**:
    *   Adhere strictly to the `src/features/<feature-name>/routes/`, `services/`, `models/`, and `types/` subdirectories.
    *   `index.ts` files within these subdirectories are the standard entry points.

### 4. **AppKit for Platform Services**:
    *   **Authentication**: Always use `authenticator` from `@voilajsx/appkit/auth` for JWT authentication and role-based access control (`auth.requireLogin()`, `auth.requireRole()`). **NEVER** implement custom authentication logic.
    *   **Logging**: Use `logger` from `@voilajsx/appkit/logging` for all logging.
    *   **Configuration**: Use `configure` from `@voilajsx/appkit/config` for environment variables and configuration.
    *   **Error Handling**: Leverage AppKit's error handling mechanisms.

### 5. **Standard Imports**:
    *   Use relative paths for Flux internal files (e.g., `../../../contracts.js`).
    *   Use package imports for AppKit (e.g., `@voilajsx/appkit/auth`).
    *   Use direct imports for Fastify (e.g., `fastify`).
    *   **NEVER** import directly between features (e.g., `import { otherService } from '../other-feature/services';`). Features communicate via explicit contracts and potentially through the main `flux.ts` service discovery.

### 6. **Standard Response Format**:
    *   All service methods **MUST** return a consistent `FluxResponse` interface:
        ```typescript
        interface FluxResponse<T = any> {
          success: boolean;
          data?: T;
          error?: string;
          message?: string;
        }
        ```
    *   Example service return:
        ```typescript
        return { success: true, data: result, message: 'Operation successful' };
        ```
        or
        ```typescript
        return { success: false, error: error.message };
        ```

### 7. **Type Safety and Consistency**:
    *   Define all interfaces and types in the `types/index.ts` file within each feature.
    *   Use TypeScript consistently for all variables, function parameters, and return types.

### 8. **Error Handling**:
    *   Implement `try...catch` blocks in services and routes to handle errors gracefully.
    *   Log errors using the AppKit logger.

### 9. **Minimalism and Scalability**:
    *   Generate only the necessary code for the requested functionality. Avoid unnecessary complexity or over-engineering.
    *   Ensure generated code adheres to the principle of feature isolation.

By strictly following these guidelines, LLMs can generate highly accurate, consistent, and maintainable code that seamlessly integrates into the Flux Framework, significantly enhancing productivity and reducing the need for manual review and correction.
