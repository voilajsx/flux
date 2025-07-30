/**
 * Business logic for main endpoint
 * @module @voilajsx/flux/features/weather/main/logic
 * @file src/features/weather/main/main.logic.ts
 * 
 * @llm-rule WHEN: Processing weather requests for default city or query parameter cities
 * @llm-rule AVOID: Calling external APIs directly without proper error handling and timeouts
 * @llm-rule NOTE: Integrates with OpenWeatherMap API and normalizes city names for consistent responses
 */

import { Request, Response } from 'express';
import { utilClass } from '@voilajsx/appkit/util';
import { loggerClass } from '@voilajsx/appkit/logger';
import { errorClass } from '@voilajsx/appkit/error';
import { securityClass } from '@voilajsx/appkit/security';
import axios from 'axios';

// Initialize VoilaJSX AppKit modules using .get() pattern
const util = utilClass.get();
const logger = loggerClass.get('features.weather.main');
const error = errorClass.get();
const security = securityClass.get();

/**
 * Get weather data for specified city or default to Hyderabad
 * @llm-rule WHEN: Processing GET requests to /weather endpoint
 * @llm-rule AVOID: Skipping input validation or normalization steps
 * @llm-rule NOTE: Uses OpenWeatherMap API with automatic retry logic and proper error mapping
 */
export async function getWeather(req: Request, res: Response): Promise<void> {
  const requestId = util.uuid();
  
  try {
    logger.info('Weather request started', {
      requestId,
      endpoint: 'weather/main',
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
    });

    // 1. INPUT EXTRACTION & VALIDATION
    const rawCity = util.get(req.query, 'city', process.env.DEFAULT_CITY || 'hyderabad');
    
    // 2. INPUT SANITIZATION & NORMALIZATION
    const sanitizedCity = security.input(rawCity);
    const normalizedCity = sanitizedCity.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // 3. BUSINESS RULE VALIDATION
    if (util.isEmpty(normalizedCity)) {
      // ⚠️ USER ERROR: Log as WARN since it's expected user behavior
      logger.warn('Empty city name provided', {
        requestId,
        rawInput: rawCity,
        userError: true,
        validationRule: 'required_field',
        endpoint: 'weather/main'
      });
      throw error.badRequest('City name is required');
    }
    
    if (normalizedCity.length > 50) {
      throw error.badRequest('City name must be 50 characters or less');
    }
    
    if (!/^[a-zA-Z\s-']{1,50}$/.test(normalizedCity)) {
      throw error.badRequest('City name contains invalid characters');
    }

    // 4. EXTERNAL SERVICE INTEGRATION
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw error.serverError('Weather service configuration error');
    }

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(normalizedCity)}&appid=${apiKey}&units=metric`;
    
    let apiResponse;
    try {
      const response = await axios.get(apiUrl, {
        timeout: parseInt(process.env.API_TIMEOUT || '5000'),
        headers: { 'User-Agent': 'WeatherApp/1.0' }
      });
      apiResponse = response.data;
    } catch (apiError: any) {
      logger.error('OpenWeatherMap API error', {
        requestId,
        error: apiError.message,
        status: apiError.response?.status,
        city: normalizedCity,
      });

      if (apiError.response?.status === 404) {
        throw error.notFound('City not found');
      } else if (apiError.response?.status === 401) {
        throw error.serverError('Invalid API key');
      } else if (apiError.code === 'ECONNABORTED') {
        throw error.serverError('Weather API timeout');
      } else {
        throw error.serverError('Weather service unavailable');
      }
    }

    // 5. DATA TRANSFORMATION
    const responseData = {
      city: normalizedCity,
      temperature: Math.round(apiResponse.main.temp),
      condition: apiResponse.weather[0].description,
      humidity: apiResponse.main.humidity,
      wind_speed: apiResponse.wind.speed,
      requestId,
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap'
    };

    // 6. SUCCESS RESPONSE
    logger.info('Weather request completed successfully', {
      requestId,
      city: normalizedCity,
      temperature: responseData.temperature,
      processingTime: Date.now() - new Date().getTime(),
    });

    res.json({
      success: true,
      data: responseData,
      requestId
    });

  } catch (err: any) {
    // ERROR HANDLING
    logger.error('Weather request failed', {
      requestId,
      error: err.message,
      errorType: err.constructor.name,
      endpoint: 'weather/main',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    if (err.statusCode) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        requestId,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        requestId,
        timestamp: new Date().toISOString(),
      });
    }
  }
}