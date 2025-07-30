# Weather API

## Overview

Real-time weather information API for location-based services

**Purpose:** Provide accurate real-time weather information for users to make informed decisions about their activities

## User Stories

- **As a user in Hyderabad, I want to quickly check current weather so I can plan my day**
  - Acceptance: Show current weather for Hyderabad by default when no location specified
  - Example: `GET /api/weather returns Hyderabad weather: 28°C, Sunny, Humidity 65%`

- **As a user, I want to check weather for any city so I can plan travel or remote activities**
  - Acceptance: Accept city name in URL and return accurate weather data for that location
  - Example: `GET /api/weather/mumbai returns Mumbai weather with temperature, conditions, humidity`

- **As a developer, I want consistent API responses so I can reliably integrate weather data**
  - Acceptance: Return standardized JSON format with error handling for invalid locations
  - Example: `Invalid location returns 404 with clear error message, valid locations return consistent data structure`

## API Endpoints

### @city

**GET** `/weather/:city`

**Business Rules:**
- Extract city from req.params.city
- Validate city name using implementation_details.city_normalization.validation
- Reject city names longer than 50 characters with BAD_REQUEST error
- Sanitize city name to prevent XSS using security.input()
- Normalize city name using implementation_details.city_normalization.algorithm
- Call OpenWeatherMap API using external_integrations.weather_api configuration
- Handle API errors according to response_schemas.error_types
- Return response in response_schemas.success_format structure

### main

**GET** `/weather`

**Business Rules:**
- Extract city from query parameter, default to 'hyderabad'
- Normalize city name using implementation_details.city_normalization
- Call OpenWeatherMap API with normalized city name
- Transform response using external_integrations.weather_api.response_mapping
- Return response_schemas.success_format structure
- Log all steps using requestId
- Handle errors according to response_schemas.error_types

## External Integrations

### weather_api
- **Base URL:** https://api.openweathermap.org/data/2.5

---
*Generated automatically on 2025-07-30T09:27:53.512Z*
