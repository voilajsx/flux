/**
 * Test suite for @city endpoint
 * @module @voilajsx/flux/features/weather/@city/test
 * @file src/features/weather/@city/@city.test.ts
 * 
 * @llm-rule WHEN: Testing @city endpoint functionality and business logic
 * @llm-rule AVOID: Creating generic tests - follow specification test_cases exactly
 * @llm-rule NOTE: Test names and assertions must match specification exactly
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { utilClass } from '@voilajsx/appkit/util';
import { loggerClass } from '@voilajsx/appkit/logger';
import { getWeatherForCity } from './@city.logic.js';
import axios from 'axios';

// Mock external dependencies
vi.mock('axios');

describe('weather @city - Specification Tests', () => {
  let testApp: express.Application;

  beforeEach(() => {
    // Set up environment variables for tests
    process.env.OPENWEATHER_API_KEY = 'test-api-key-12345678901234567890';
    process.env.API_TIMEOUT = '5000';
    
    // Setup test Express application
    testApp = express();
    testApp.use(express.json());
    testApp.use(express.urlencoded({ extended: true }));
    
    // Add route exactly as defined in specification
    testApp.get('/weather/:city', async (req, res) => {
      try {
        await getWeatherForCity(req, res);
      } catch (error: any) {
        // Handle AppKit semantic errors
        if (error.statusCode) {
          res.status(error.statusCode).json({
            success: false,
            error: error.message,
            requestId: error.requestId || 'test-request',
            timestamp: new Date().toISOString(),
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Internal server error',
            requestId: 'test-request',
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    // Setup axios mock for successful responses
    const mockWeatherResponse = {
      data: {
        name: 'Mumbai',
        main: {
          temp: 25.5,
          humidity: 80
        },
        weather: [{
          description: 'clear sky'
        }],
        wind: {
          speed: 5.2
        }
      }
    };
    
    vi.mocked(axios.get).mockResolvedValue(mockWeatherResponse);
  });

  afterEach(async () => {
    // Clean up AppKit modules between tests
    utilClass.clearCache();
    await loggerClass.clear();
    vi.clearAllMocks();
  });

  // ============================================================================
  // 📋 SPECIFICATION TEST CASES - COPIED EXACTLY FROM SPECIFICATION
  // ============================================================================

  test('should return weather for valid city name', async () => {
    const response = await request(testApp)
      .get('/weather/mumbai')
      .expect(200);

    // Verify required response structure
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('requestId');
    expect(typeof response.body.requestId).toBe('string');
    expect(response.body.requestId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('city');
    expect(response.body.data).toHaveProperty('temperature');
    expect(response.body.data).toHaveProperty('condition');
    expect(response.body.data).toHaveProperty('humidity');
    expect(response.body.data).toHaveProperty('wind_speed');
    expect(response.body.data).toHaveProperty('requestId');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('source');
    
    // Specification validation
    expect(response.body.data.source).toBe('OpenWeatherMap');
  });

  test('should handle URL encoded city names', async () => {
    const response = await request(testApp)
      .get('/weather/New%20York')
      .expect(200);

    // Standard AppKit response validation
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('requestId');
    
    expect(response.body.success).toBe(true);
    
    // Specification validation - should normalize to lowercase
    expect(response.body.data.city).toBe('new york');
  });

  test('should reject empty city names with 400', async () => {
    const response = await request(testApp)
      .get('/weather/%20')
      .expect(400);

    // Standard response structure validation
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('requestId');
    
    // Error response validation
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('requestId');
    
    // Specification validation
    expect(response.body.error).toBe('City name is required');
  });

  test('should reject city names exceeding 50 characters', async () => {
    const response = await request(testApp)
      .get('/weather/verylongcitynamethatexceedsfiftycharacterslimitextra')
      .expect(400);

    // Standard response structure validation
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('requestId');
    
    // Error response validation
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
    
    // Specification validation
    expect(response.body.error).toBe('City name must be 50 characters or less');
  });

  test('should sanitize dangerous input and reject', async () => {
    const response = await request(testApp)
      .get('/weather/%3Cscript%3Ealert%28%22xss%22%29%3C%2Fscript%3E')
      .expect(400);

    // Standard response structure validation
    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('requestId');
    
    // Error response validation
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
    
    // Specification validation
    expect(response.body.error).toBe('City name contains invalid characters');
  });

  // ============================================================================
  // 🔄 COMMON APPKIT PATTERNS (Always Include)
  // ============================================================================

  test('should generate unique request IDs for each request', async () => {
    const response1 = await request(testApp)
      .get('/weather/mumbai');

    const response2 = await request(testApp)
      .get('/weather/delhi');

    expect(response1.body.requestId).toBeDefined();
    expect(response2.body.requestId).toBeDefined();
    expect(response1.body.requestId).not.toBe(response2.body.requestId);
    
    // Verify UUID v4 format
    expect(response1.body.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('should return consistent response format for all endpoints', async () => {
    const response = await request(testApp)
      .get('/weather/mumbai');

    // Verify AppKit response structure
    expect(response.body).toMatchObject({
      success: expect.any(Boolean),
      requestId: expect.any(String),
    });

    if (response.body.success) {
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeTypeOf('object');
    } else {
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBeTypeOf('string');
    }

    // Verify timestamp if included
    if (response.body.data && response.body.data.timestamp) {
      expect(new Date(response.body.data.timestamp)).toBeInstanceOf(Date);
    }
  });

  test('should handle concurrent requests properly', async () => {
    const concurrentRequests = Array(5).fill(null).map(() =>
      request(testApp)
        .get('/weather/mumbai')
    );

    const responses = await Promise.all(concurrentRequests);

    // Verify all requests completed
    expect(responses).toHaveLength(5);

    // Verify unique request IDs
    const requestIds = responses.map(r => r.body.requestId);
    const uniqueIds = new Set(requestIds);
    expect(uniqueIds.size).toBe(5);

    // Verify all responses have consistent structure
    responses.forEach((response) => {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('requestId');
    });
  });
});