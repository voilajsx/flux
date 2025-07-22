/**
 * Tests for hello main endpoint with contract validation
 * @module @voilajsx/atom/features/hello/main/test
 * @file src/features/hello/main/main.test.ts
 * 
 * @llm-rule WHEN: Testing contract-validated hello endpoint
 * @llm-rule AVOID: Over-testing simple endpoints - focus on contract compliance
 * @llm-rule NOTE: Validates the single function declared in contract routes
 */

import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { list } from './main.logic.js';

// Create test app
const testApp = express();
testApp.use(express.json());
testApp.get('/api/hello', list);

describe('Hello Main Endpoint - Contract Validated', () => {
  /**
   * Tests list function (GET route from contract)
   * @llm-rule WHEN: Verifying contract-declared GET /hello route works
   * @llm-rule AVOID: Skipping contract function tests - all declared routes must work
   */
  test('should return welcome message (contract: GET /hello → list)', async () => {
    const response = await request(testApp)
      .get('/api/hello')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toBe('Hello, World! ATOM Framework is running perfectly.');
    expect(response.body.data.requestId).toBeDefined();
    expect(response.body.data.timestamp).toBeDefined();
    expect(response.body.data.framework).toBe('ATOM');
    expect(response.body.data.status).toBe('active');
  });

  /**
   * Tests response format consistency
   * @llm-rule WHEN: Ensuring ATOM standard response format
   * @llm-rule AVOID: Inconsistent response formats across endpoints
   */
  test('should return consistent response format', async () => {
    const response = await request(testApp)
      .get('/api/hello')
      .expect(200);

    // Validate ATOM standard response structure
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data).toBe('object');
  });

  /**
   * Tests request ID generation
   * @llm-rule WHEN: Ensuring unique request tracking for debugging
   * @llm-rule AVOID: Missing request correlation - breaks debugging
   */
  test('should generate unique request IDs', async () => {
    const [r1, r2] = await Promise.all([
      request(testApp).get('/api/hello'),
      request(testApp).get('/api/hello')
    ]);

    expect(r1.body.data.requestId).toBeDefined();
    expect(r2.body.data.requestId).toBeDefined();
    expect(r1.body.data.requestId).not.toBe(r2.body.data.requestId);
  });
});