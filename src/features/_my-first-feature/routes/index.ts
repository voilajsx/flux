/**
 * MyFirstFeature Feature - API Routes
 * @file src/features/my-first-feature/routes/index.ts
 */

import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';
import { logger } from '@voilajsx/appkit/logging';
import { authenticator } from '@voilajsx/appkit/auth';
import { my-first-featureService } from '../services/index.js';
import type { CreateMyFirstFeatureRequest, UpdateMyFirstFeatureRequest } from '../types/index.js';

/**
 * Request type definitions
 */
interface GetMyFirstFeatureParams {
  id: string;
}

/**
 * Main route registration function
 */
const my-first-featureRoutes: FastifyPluginCallback = async (fastify: FastifyInstance, options) => {
  const log = logger.get('my-first-feature-routes');
  const auth = authenticator.get();

  /**
   * Get all my-first-feature items
   * GET /api/my-first-feature
   */
  fastify.get('/', {,
    preHandler: auth.requireLogin()
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    log.info('GET /my-first-feature - Fetching all items');
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await my-first-featureService.getAll();
    return reply.code(result.success ? 200 : 500).send(result);
  });

  /**
   * Get my-first-feature item by ID
   * GET /api/my-first-feature/:id
   */
  fastify.get<{ Params: GetMyFirstFeatureParams }>('/:id', {,
    preHandler: auth.requireLogin()
  }, async (request, reply) => {
    const { id } = request.params;
    log.info('GET /my-first-feature/:id - Fetching item', { id });
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await my-first-featureService.getById(id);
    return reply.code(result.success ? 200 : 404).send(result);
  });

  /**
   * Create new my-first-feature item
   * POST /api/my-first-feature
   */
  fastify.post<{ Body: CreateMyFirstFeatureRequest }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 }
        }
      }
    },
    preHandler: auth.requireLogin()
  }, async (request, reply) => {
    const data = request.body;
    log.info('POST /my-first-feature - Creating item', { data });
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await my-first-featureService.create(data, user.userId);
    return reply.code(result.success ? 201 : 400).send(result);
  });

  /**
   * Update my-first-feature item
   * PUT /api/my-first-feature/:id
   */
  fastify.put<{ Params: GetMyFirstFeatureParams; Body: UpdateMyFirstFeatureRequest }>('/:id', {
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 }
        }
      }
    },
    preHandler: auth.requireLogin()
  }, async (request, reply) => {
    const { id } = request.params;
    const data = request.body;
    log.info('PUT /my-first-feature/:id - Updating item', { id, data });
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await my-first-featureService.update(id, data);
    return reply.code(result.success ? 200 : 400).send(result);
  });

  /**
   * Delete my-first-feature item
   * DELETE /api/my-first-feature/:id
   */
  fastify.delete<{ Params: GetMyFirstFeatureParams }>('/:id', {,
    preHandler: auth.requireLogin()
  }, async (request, reply) => {
    const { id } = request.params;
    log.info('DELETE /my-first-feature/:id - Deleting item', { id });
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await my-first-featureService.delete(id);
    return reply.code(result.success ? 200 : 400).send(result);
  });

  log.info('✅ MyFirstFeature routes registered successfully', {
    prefix: '/api/my-first-feature',
    routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id'],
    authEnabled: true
  });
};

export default my-first-featureRoutes;