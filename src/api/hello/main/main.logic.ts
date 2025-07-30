/**
 * Business logic for hello main endpoint with VoilaJSX AppKit integration
 * @module @voilajsx/flux/features/hello/main/logic
 * @file src/features/hello/main/main.logic.ts
 * 
 * @llm-rule WHEN: Implementing simple hello endpoint for FLUX Framework demonstration
 * @llm-rule AVOID: Complex logic - this is a basic hello world example
 * @llm-rule NOTE: Shows VoilaJSX AppKit integration patterns for other endpoints
 */

import { Request, Response } from 'express';
import { utilClass } from '@voilajsx/appkit/util';
import { loggerClass } from '@voilajsx/appkit/logger';
import { errorClass } from '@voilajsx/appkit/error';

// Initialize VoilaJSX AppKit modules (matches contract imports)
const util = utilClass.get();
const log = loggerClass.get('hello-main');
const err = errorClass.get();

/**
 * Handles GET requests to return hello world message
 * @llm-rule WHEN: Processing GET /api/hello requests for basic hello response
 * @llm-rule AVOID: Complex logic in hello endpoint - keep it simple for framework demonstration
 * @llm-rule NOTE: Uses VoilaJSX utility for UUID generation and structured logging
 */
export async function list(req: Request, res: Response): Promise<void> {
  const requestId = util.uuid();
  
  try {
    log.info('Hello GET request started', {
      requestId,
      url: req.url,
      method: req.method
    });

    const response = {
      success: true,
      data: {
        message: 'Hello, World! FLUX Framework is running perfectly.',
        timestamp: new Date().toISOString(),
        requestId,
        framework: 'FLUX',
        appkit: 'VoilaJSX',
        status: 'active'
      }
    };

    log.info('Hello GET request completed', {
      requestId,
      responseTime: Date.now()
    });

    res.json(response);

  } catch (error) {
    log.error('Hello GET request failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw err.serverError('Hello request failed');
  }
}