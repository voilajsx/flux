/**
 * Business logic for hello name endpoint
 * @file src/features/hello/@name/@name.logic.ts
 * 
 * @llm-rule WHEN: Processing dynamic name parameters from URL routes
 * @llm-rule AVOID: Using raw req.params - causes security vulnerabilities
 * @llm-rule NOTE: Demonstrates VoilaJSX input sanitization and validation
 */

import { Request, Response } from 'express';
import { utility } from '@voilajsx/appkit/utils';
import { logger } from '@voilajsx/appkit/logging';
import { error } from '@voilajsx/appkit/error';
import { security } from '@voilajsx/appkit/security';

// Initialize VoilaJSX AppKit modules (matches contract imports)
const utils = utility.get();
const log = logger.get('hello-name');
const err = error.get();
const secure = security.get();

/**
 * Handles GET requests to display personalized hello message with name
 */
export async function get(req: Request, res: Response): Promise<void> {
  const requestId: string = utils.uuid(); // FIX: uuid() returns a string
  
  try {
    const rawName: string = utils.get(req, 'params.name', '');
    log.info('Hello name GET request started', {
      requestId,
      rawName: rawName,
      url: req.url
    });
    
    // Check length BEFORE sanitization to properly reject long inputs
    if (!rawName || rawName.length > 50) {
      throw err.badRequest('Name parameter must be between 1 and 50 characters');
    }

    // Sanitize the name parameter 
    const safeName = secure.input(rawName, { 
      maxLength: 50 // This will truncate, but we already validated above
    });

    if (!safeName || safeName.trim().length === 0) {
      throw err.badRequest('Name parameter is required and cannot be empty');
    }

    // const userAge: string = req.user.age; // FIX: req.user is not a default property

    const response = {
      success: true,
      data: {
        message: `Hello, ${safeName}! 👋`,
        name: safeName,
        timestamp: new Date().toISOString(),
        requestId,
        framework: 'ATOM',
        endpoint: 'name',
        greeting: 'personalized',
        // userAge: userAge
      }
    };

    log.info('Hello name GET request completed', {
      requestId,
      safeName,
      originalName: rawName
    });

    res.json(response);

  } catch (error) {
    log.error('Hello name GET request failed', {
      requestId,
      rawName: utils.get(req, 'params.name', ''),
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Re-throw VoilaJSX errors (they have proper status codes)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    throw err.serverError('Hello name request failed');
  }
}