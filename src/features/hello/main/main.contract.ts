/**
 * FLUX Framework contract for hello main endpoint
 * @file src/features/hello/main/main.contract.ts
 */

// Export the contract directly - no parsing needed!
export const CONTRACT = {
  routes: {
    "GET /hello": "list"
  },
  imports: {
    appkit: ["logging", "error", "utils"],
    external: ["express"]
  },
  publishes: [],
  subscribes: [],
  helpers: [],
  tests: [
    "should return welcome message (contract: GET /hello → list)",
    "should return consistent response format",
    "should generate unique request IDs"
  ]
} as const;