/**
 * Business logic for hello main endpoint with VoilaJSX AppKit integration
 * @module @voilajsx/atom/features/hello/main/logic
 * @file src/features/hello/main/main.logic.ts
 * 
 * @llm-rule WHEN: Implementing simple hello endpoint for ATOM Framework demonstration
 * @llm-rule AVOID: Complex logic - this is a basic hello world example
 * @llm-rule NOTE: Shows VoilaJSX AppKit integration patterns for other endpoints
 */

import { Request, Response } from 'express';
import { utility } from '@voilajsx/appkit/utils';
import { logger } from '@voilajsx/appkit/logging';
import { error } from '@voilajsx/appkit/error';

// Initialize VoilaJSX AppKit modules (matches contract imports)
const utils = utility.get();
const log = logger.get('hello-main');
const err = error.get();

/**
 * Handles GET requests to return hello world message
 * @llm-rule WHEN: Processing GET /api/hello requests for basic hello response
 * @llm-rule AVOID: Complex logic in hello endpoint - keep it simple for framework demonstration
 * @llm-rule NOTE: Uses VoilaJSX utility for UUID generation and structured logging
 */
export async function list(req: Request, res: Response): Promise<void> {
  const requestId = utils.uuid();
  
  try {
    log.info('Hello GET request started', {
      requestId,
      url: req.url,
      method: req.method
    });

    const response = {
      success: true,
      data: {
        message: 'Hello, World! ATOM Framework is running perfectly.',
        timestamp: new Date().toISOString(),
        requestId,
        framework: 'ATOM',
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