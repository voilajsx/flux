/**
 * FLUX Framework contract for hello main endpoint
 * @file src/api/greeting/v1/hello/main/main.contract.ts
 * @llm-rule sample
 */

// Export the contract directly - no parsing needed!
export const CONTRACT = {
  feature: "hello",
  endpoint: "main",
  routes: {
    "GET /hello": "list"
  },
  imports: {
    appkit: ["util", "error"],
    external: ["express"]
  },
  publishes: [],
  subscribes: [],
  helpers: [],
  tests: [
    "should return welcome message (contract: GET /hello → list)",
    "should return consistent response format", 
    "should generate unique request IDs"
  ],
  validation_targets: {
    contract_compliance: 100,
    type_safety: 100,
    test_coverage: 95,
    performance_ms: 50,
    security_score: 90
  }
} as const;