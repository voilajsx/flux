/**
 * Defines the API contract for the @city weather endpoint.
 * @module weather/@city.contract
 * @file src/features/weather/@city/@city.contract.ts
 *
 * @llm-rule WHEN: Defining API routes and their corresponding logic handlers for the @city weather feature.
 * @llm-rule AVOID: Modifying this file directly for business logic or external API calls.
 * @llm-rule NOTE: This contract is used for validation and routing.
 */

export const CONTRACT = {
  feature: 'weather',
  endpoint: '@city',
  routes: {
    'GET /weather/:city': 'getWeatherForCity',
  },
  imports: {
    appkit: [
      'util',
      'logger',
      'error',
      'security'
    ],
    external: [
      'axios'
    ],
  },
  publishes: [],
  subscribes: [],
  helpers: [],
  tests: [
    'should return weather for valid city name',
    'should handle URL encoded city names',
    'should reject empty city names with 400',
    'should reject city names exceeding 50 characters',
    'should sanitize dangerous input and reject'
  ],
};