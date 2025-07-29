/**
 * Business logic for @city endpoint
 * @module @voilajsx/flux/features/weather/@city/logic
 * @file src/features/weather/@city/@city.logic.ts
 * 
 * @llm-rule WHEN: Handling GET /weather/:city requests with URL parameter extraction and weather API integration
 * @llm-rule AVOID: Modifying URL parameter structure or response format - follow specification exactly
 * @llm-rule NOTE: This endpoint extracts city from URL params, validates, and returns weather data
 */

import { Request, Response } from 'express';
import { utilClass } from '@voilajsx/appkit/util';
import { loggerClass } from '@voilajsx/appkit/logger';
import { errorClass } from '@voilajsx/appkit/error';
import { securityClass } from '@voilajsx/appkit/security';
import axios from 'axios';

// Initialize VoilaJSX AppKit modules using .get() pattern
const util = utilClass.get();
const logger = loggerClass.get('features.weather.@city');
const error = errorClass.get();
const security = securityClass.get();

/**
 * Get weather data for specific city from URL parameter
 * @llm-rule WHEN: Processing city parameter from URL path and returning weather data
 * @llm-rule AVOID: Accepting city from query parameters - must use URL parameter only
 * @llm-rule NOTE: Validates city name length, format, and security before API call
 */
export async function getWeatherForCity(req: Request, res: Response): Promise<void> {
  const requestId = util.uuid();
  
  try {
    logger.info('Request started', {
      requestId,
      endpoint: 'weather/@city',
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
    });

    // 1. INPUT EXTRACTION & VALIDATION
    // Extract city from URL parameter
    const city = req.params.city;
    
    if (util.isEmpty(city)) {
      throw error.badRequest('City name is required');
    }

    // URL decode the city name
    const decodedCity = decodeURIComponent(city);
    
    // 2. INPUT SANITIZATION & NORMALIZATION
    const sanitizedCity = security.input(decodedCity);
    
    // Normalize city name
    const normalizedCity = sanitizedCity.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // 3. BUSINESS RULE VALIDATION
    if (util.isEmpty(normalizedCity)) {
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
    
    logger.info('Calling weather API', {
      requestId,
      city: normalizedCity,
      apiUrl: apiUrl.replace(apiKey, '[REDACTED]'),
    });

    const apiResponse = await axios.get(apiUrl, {
      timeout: parseInt(process.env.API_TIMEOUT as string) || 5000,
      headers: { 'User-Agent': 'WeatherApp/1.0' }
    });

    // 5. DATA TRANSFORMATION
    const responseData = {
      city: normalizedCity,
      temperature: Math.round(apiResponse.data.main.temp),
      condition: apiResponse.data.weather[0].description,
      humidity: apiResponse.data.main.humidity,
      wind_speed: apiResponse.data.wind.speed,
      requestId,
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap'
    };

    // SUCCESS RESPONSE
    logger.info('Request completed successfully', {
      requestId,
      city: normalizedCity,
      temperature: responseData.temperature,
      responseSize: JSON.stringify(responseData).length,
    });

    res.json({
      success: true,
      data: responseData,
      requestId
    });

  } catch (err: any) {
    // ERROR HANDLING - Map to specification error types
    logger.error('Request failed', {
      requestId,
      error: err.message,
      errorType: err.constructor.name,
      endpoint: 'weather/@city',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Handle axios errors (API failures)
    if (err.response) {
      if (err.response.status === 404) {
        res.status(404).json({
          success: false,
          error: 'City not found',
          message: 'The specified city was not found in the weather service',
          requestId,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      if (err.response.status === 401) {
        res.status(503).json({
          success: false,
          error: 'Weather service unavailable',
          message: 'Weather API authentication failed',
          requestId,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // Handle timeout errors
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      res.status(504).json({
        success: false,
        error: 'Weather API timeout',
        message: 'Weather service request timed out',
        requestId,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle VoilaJSX semantic errors (error.badRequest, error.notFound, etc.)
    if (err.statusCode) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        requestId,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Handle unexpected errors
      res.status(503).json({
        success: false,
        error: 'Weather service unavailable',
        message: 'Weather service is temporarily unavailable',
        requestId,
        timestamp: new Date().toISOString(),
      });
    }
  }
}