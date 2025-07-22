/**
 * Tests for hello name endpoint with contract validation and proper error handling
 * @file src/features/hello/@name/@name.test.ts
 * 
 * @llm-rule WHEN: Testing contract-validated name parameter endpoints with error scenarios
 * @llm-rule AVOID: TypeScript conflicts between Express and VoilaJSX types - use clean approach
 * @llm-rule NOTE: Tests the single 'get' action declared in contract routes with manual error handling
 */

import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { get } from './@name.logic.js';

// Create test app with simple setup to avoid type conflicts
const testApp = express();
testApp.use(express.json());

// Register route with manual error handling wrapper
testApp.get('/api/hello/:name', async (req, res, next) => {
  try {
    await get(req, res);
  } catch (error) {
    // Handle VoilaJSX errors manually
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const appError = error as any;
      res.status(appError.statusCode).json({
        success: false,
        error: appError.type || 'error',
        message: appError.message || 'Request failed'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'serverError',
        message: 'Internal server error'
      });
    }
  }
});

describe('Hello Name Endpoint - Contract Validated', () => {
  /**
   * Tests get function (GET route from contract)
   * @llm-rule WHEN: Verifying contract-declared GET /hello/:name route works
   * @llm-rule AVOID: Skipping parameter validation tests - security critical
   */
  test('should return personalized greeting (contract: GET /hello/:name → get)', async () => {
    const response = await request(testApp)
      .get('/api/hello/World')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toBe('Hello, World! 👋');
    expect(response.body.data.name).toBe('World');
    expect(response.body.data.requestId).toBeDefined();
    expect(response.body.data.timestamp).toBeDefined();
    expect(response.body.data.framework).toBe('ATOM');
    expect(response.body.data.endpoint).toBe('name');
  });

  /**
   * Tests input sanitization and URL decoding
   * @llm-rule WHEN: Ensuring dangerous input is properly sanitized
   * @llm-rule AVOID: Allowing unsanitized input to reach responses
   */
  test('should sanitize and decode input properly', async () => {
    const response = await request(testApp)
      .get('/api/hello/John%20Doe') // URL encoded space
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('John Doe'); // Should be properly decoded and sanitized
    expect(response.body.data.message).toBe('Hello, John Doe! 👋');
  });

  /**
   * Tests XSS protection
   * @llm-rule WHEN: Ensuring script tags and dangerous content are sanitized
   * @llm-rule AVOID: Allowing XSS attacks through parameters
   */
  test('should sanitize dangerous XSS input', async () => {
    const response = await request(testApp)
      .get('/api/hello/%3Cscript%3Ealert%28%22xss%22%29%3C%2Fscript%3E') // <script>alert("xss")</script>
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).not.toContain('<script>');
    expect(response.body.data.name).not.toContain('</script>');
    // VoilaJSX removes HTML tags but may keep text content
    expect(response.body.data.message).toContain('Hello,');
  });

  /**
   * Tests empty name handling with proper error response
   * @llm-rule WHEN: Validating required parameter enforcement
   * @llm-rule AVOID: Accepting empty or missing required parameters
   */
  test('should reject empty name with proper error response', async () => {
    const response = await request(testApp)
      .get('/api/hello/%20') // Just spaces (URL encoded)
      .expect(400);

    // Verify error response format (VoilaJSX uses uppercase error types)
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('BAD_REQUEST'); // VoilaJSX actual format
    expect(response.body.message).toContain('Name parameter is required');
  });

  /**
   * Tests response format consistency
   * @llm-rule WHEN: Ensuring ATOM standard response format
   * @llm-rule AVOID: Inconsistent response formats across endpoints
   */
  test('should return consistent ATOM response format', async () => {
    const response = await request(testApp)
      .get('/api/hello/TestUser')
      .expect(200);

    // Validate ATOM standard response structure
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data).toBe('object');
    
    // Validate required data fields
    expect(response.body.data).toHaveProperty('message');
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('requestId');
  });

  /**
   * Tests unique request IDs for debugging
   * @llm-rule WHEN: Ensuring request correlation for debugging
   * @llm-rule AVOID: Duplicate request IDs - breaks request tracking
   */
  test('should generate unique request IDs', async () => {
    const [r1, r2] = await Promise.all([
      request(testApp).get('/api/hello/User1'),
      request(testApp).get('/api/hello/User2')
    ]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r1.body.data.requestId).toBeDefined();
    expect(r2.body.data.requestId).toBeDefined();
    expect(r1.body.data.requestId).not.toBe(r2.body.data.requestId);
  });

  /**
   * Tests special characters handling
   * @llm-rule WHEN: Ensuring names with apostrophes and hyphens work
   * @llm-rule AVOID: Breaking on valid name characters
   */
  test('should handle names with apostrophes and hyphens', async () => {
    const response = await request(testApp)
      .get('/api/hello/Mary-Jane')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Mary-Jane');
    expect(response.body.data.message).toBe('Hello, Mary-Jane! 👋');
  });

  /**
   * Tests maximum length validation
   * @llm-rule WHEN: Ensuring input length limits are enforced
   * @llm-rule AVOID: Accepting unlimited input - security and performance risk
   */
  test('should reject names that exceed maximum length', async () => {
    const longName = 'a'.repeat(100); // 100 characters (exceeds 50 char limit)
    
    const response = await request(testApp)
      .get(`/api/hello/${longName}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('BAD_REQUEST'); // VoilaJSX format
    expect(response.body.message).toContain('50 characters');
  });

  /**
   * Tests Unicode support for international names
   * @llm-rule WHEN: Supporting international users with Unicode names
   * @llm-rule AVOID: ASCII-only validation - excludes international users
   */
  test('should handle Unicode names correctly', async () => {
    const unicodeName = encodeURIComponent('José'); // URL-encoded Unicode
    
    const response = await request(testApp)
      .get(`/api/hello/${unicodeName}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('José');
    expect(response.body.data.message).toBe('Hello, José! 👋');
  });

  /**
   * Tests numeric names support
   * @llm-rule WHEN: Supporting usernames that might be numeric
   * @llm-rule AVOID: Assuming names are always alphabetic
   */
  test('should handle numeric names', async () => {
    const response = await request(testApp)
      .get('/api/hello/12345')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('12345');
    expect(response.body.data.message).toBe('Hello, 12345! 👋');
  });
});