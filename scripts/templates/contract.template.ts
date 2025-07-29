/**
 * Defines the API contract for the {ENDPOINT_NAME} {FEATURE_NAME} endpoint.
 * @module {FEATURE_NAME}/{ENDPOINT_NAME}.contract
 * @file src/features/{FEATURE_NAME}/{ENDPOINT_NAME}/{ENDPOINT_NAME}.contract.ts
 *
 * @llm-rule WHEN: Defining API routes and their corresponding logic handlers for the {ENDPOINT_NAME} {FEATURE_NAME} feature.
 * @llm-rule AVOID: Modifying this file directly for business logic or external API calls.
 * @llm-rule NOTE: This contract is used for validation and routing.
 */

export const CONTRACT = {
  feature: '{FEATURE_NAME}',
  endpoint: '{ENDPOINT_NAME}',
  routes: {
    '{HTTP_METHOD} {ROUTE_PATH}': '{HANDLER_FUNCTION_NAME}',
    // Examples:
    // 'GET /api/weather': 'getWeather',
    // 'POST /api/weather': 'createWeather',
    // 'GET /api/weather/:id': 'getWeatherById',
    // 'PUT /api/weather/:id': 'updateWeather',
    // 'DELETE /api/weather/:id': 'deleteWeather'
  },
  imports: {
    appkit: [
      // AppKit modules (use EXACT list from specification.endpoints.{ENDPOINT_NAME}.contract.imports.appkit):
      // 'util',        // For utilClass.get() - util.uuid(), util.get(), util.isEmpty(), etc.
      // 'logger',      // For loggerClass.get() - structured logging
      // 'error',       // For errorClass.get() - semantic error handling
      // 'security',    // For securityClass.get() - input sanitization
      // 'config',      // For configClass.get() - configuration management
      // 'auth',        // For authClass.get() - authentication
      // 'database',    // For databaseClass.get() - database operations
      // 'cache',       // For cacheClass.get() - caching operations
      // 'storage',     // For storageClass.get() - file/object storage
      // 'queue',       // For queueClass.get() - background jobs
      // 'email',       // For emailClass.get() - email operations
      // 'event'        // For eventClass.get() - event publishing/subscribing
    ],
    external: [
      // External npm packages (use EXACT list from specification.endpoints.{ENDPOINT_NAME}.contract.imports.external):
      // 'express',     // Usually needed for Request/Response types
      // 'axios',       // For external API calls
      // 'lodash',      // For utility functions
      // 'moment',      // For date manipulation
      // 'joi',         // For validation schemas
      // 'bcrypt',      // For password hashing
      // 'jsonwebtoken' // For JWT operations
    ],
  },
  publishes: [
    // Events this endpoint publishes (copy EXACT list from specification or leave empty):
    // '{FEATURE_NAME}.{EVENT_NAME}',
    // Examples:
    // 'weather.forecast-requested',
    // 'weather.data-updated',
    // 'user.created',
    // 'order.completed'
  ],
  subscribes: [
    // Events this endpoint subscribes to (copy EXACT list from specification or leave empty):
    // '{FEATURE_NAME}.{EVENT_NAME}',
    // Examples:
    // 'user.updated',
    // 'notification.sent',
    // 'cache.invalidated'
  ],
  helpers: [
    // Helper files used by this endpoint (copy EXACT list from specification or leave empty):
    // '{HELPER_NAME}.helper',
    // Examples:
    // 'weather-api.helper',
    // 'data-validation.helper',
    // 'response-formatter.helper'
  ],
  tests: [
    // ⚠️ CRITICAL: Copy EXACT test case names from specification.endpoints.{ENDPOINT_NAME}.test.test_cases[].name
    // DO NOT add extra tests, DO NOT modify test names, DO NOT add generic test descriptions
    // Use the EXACT same test names and count as specified in the specification document
    // 
    // FROM SPECIFICATION: specification.endpoints.{ENDPOINT_NAME}.test.test_cases
    // Copy each test_case.name exactly as written in the specification
    //
    // Example for weather main endpoint:
    // 'should return Hyderabad weather by default',
    // 'should return weather for query parameter city', 
    // 'should handle API failures with 503 status'
    //
    // Example for weather @city endpoint:
    // 'should return weather for valid city name',
    // 'should handle URL encoded city names',
    // 'should reject empty city names with 400',
    // 'should reject city names exceeding 50 characters',
    // 'should sanitize dangerous input and reject'
  ],
};

// ============================================================================
// TEMPLATE USAGE INSTRUCTIONS
// ============================================================================

/*
STEP 1: Replace all placeholder values:
  - {FEATURE_NAME}         → Copy from specification.feature
  - {ENDPOINT_NAME}        → Copy from specification.endpoints.{ENDPOINT_NAME}.id
  - {HTTP_METHOD}          → Copy from specification.endpoints.{ENDPOINT_NAME}.route (extract HTTP method)
  - {ROUTE_PATH}           → Copy from specification.endpoints.{ENDPOINT_NAME}.route (extract path)
  - {HANDLER_FUNCTION_NAME} → Copy from specification.endpoints.{ENDPOINT_NAME}.contract.routes

STEP 2: Update imports EXACTLY from specification:
  - Copy specification.endpoints.{ENDPOINT_NAME}.contract.imports.appkit array EXACTLY
  - Copy specification.endpoints.{ENDPOINT_NAME}.contract.imports.external array EXACTLY
  - DO NOT add or remove any imports from the specification
  - Remove ALL commented examples that are not in the specification

STEP 3: Update events (if applicable):
  - Copy EXACT events from specification if they exist
  - If specification doesn't mention events, leave arrays empty: []
  - DO NOT add generic event examples

STEP 4: Update helpers (if applicable):
  - Copy EXACT helpers from specification if they exist
  - If specification doesn't mention helpers, leave array empty: []
  - DO NOT add generic helper examples

STEP 5: Update test descriptions - MOST CRITICAL:
  - Go to specification.endpoints.{ENDPOINT_NAME}.test.test_cases
  - Copy EACH test_case.name EXACTLY as written
  - Use the EXACT same count as in specification.endpoints.{ENDPOINT_NAME}.test.test_cases.length
  - DO NOT add any additional test descriptions
  - DO NOT modify the test names in any way
  - DO NOT add generic "should return 200" type tests unless they are in the specification

STEP 6: Update JSDoc comments:
  - Replace {FEATURE_NAME} and {ENDPOINT_NAME} in header comments
  - Update @llm-rule WHEN to describe this specific endpoint's purpose from specification
  - Keep @llm-rule AVOID and NOTE as-is unless endpoint has special considerations

⚠️ VALIDATION RULES:
  - Total test cases MUST match specification.validation_targets.total_test_cases for this endpoint
  - Import lists MUST match specification exactly
  - Route mapping MUST match specification exactly
  - Feature and endpoint names MUST match specification exactly

EXAMPLE COMPLETED CONTRACT (from weather specification):

export const CONTRACT = {
  feature: 'weather',
  endpoint: 'main',
  routes: {
    'GET /api/weather': 'getWeather'
  },
  imports: {
    appkit: ['util', 'logger', 'error', 'security'],
    external: []
  },
  publishes: [],
  subscribes: [],
  helpers: [],
  tests: [
    'should return Hyderabad weather by default',
    'should return weather for query parameter city',
    'should handle API failures with 503 status'
  ]
};
*/