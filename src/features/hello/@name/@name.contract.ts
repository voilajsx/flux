/**
 * FLUX Framework contract for hello name endpoint
 * @file src/features/hello/@name/@name.contract.ts
 * @llm-rule sample
 */

// Export the contract in FLUX format - matching main contract structure
export const CONTRACT = {
  feature: "hello",
  endpoint: "@name",
  routes: {
    "GET /hello/:name": "get"
  },
  imports: {
    appkit: [ "error", "util", "logger","security"],
    external: ["express"]
  },
  publishes: [],
  subscribes: [],
  helpers: [],
  tests: [
    "should return personalized greeting (contract: GET /hello/:name → get)",
    "should sanitize and decode input properly", 
    "should sanitize dangerous XSS input",
    "should reject empty name with proper error response",
    "should return consistent FLUX response format",
    "should generate unique request IDs",
    "should handle names with apostrophes and hyphens",
    "should reject names that exceed maximum length", 
    "should handle Unicode names correctly",
    "should handle numeric names"
  ],
  validation_targets: {
    contract_compliance: 100,
    type_safety: 98,
    test_coverage: 90,
    performance_ms: 100,
    security_score: 95
  }
} as const;