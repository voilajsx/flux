/**
 * FLUX Framework contract for hello name endpoint
 * @file src/features/hello/@name/@name.contract.ts
 */

// Export the contract in FLUX format - matching main contract structure
export const CONTRACT = {
  routes: {
    "GET /hello/:name": "get"
  },
  imports: {
    appkit: ["logging", "error", "utils", "security"],
    external: ["express"]
  },
  publishes: [],
  helpers:[],
  subscribes: [],
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
  ]
} as const;