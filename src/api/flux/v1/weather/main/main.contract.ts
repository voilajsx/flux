/**
 * Defines the API contract for the main weather endpoint.
 * @module weather/main.contract
 * @file src/features/weather/main/main.contract.ts
 *
 * @llm-rule WHEN: Defining API routes and their corresponding logic handlers for the main weather feature.
 * @llm-rule AVOID: Modifying this file directly for business logic or external API calls.
 * @llm-rule NOTE: This contract is used for validation and routing.
 */

export const CONTRACT = {
  feature: 'weather',
  endpoint: 'main',
  routes: {
    'GET /weather': 'getWeather',
  },
  imports: {
    appkit: ['util', 'logger', 'error', 'security'],
    external: ['axios'],
  },
  publishes: [],
  subscribes: [],
  helpers: [],
  tests: [
    'should return Hyderabad weather by default',
    'should return weather for query parameter city',
    'should handle API failures with 503 status',
  ],
};