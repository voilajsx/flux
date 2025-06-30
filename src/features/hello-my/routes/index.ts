/**
 * HelloMy Feature - API Routes
 * @file src/features/hello-my/routes/index.ts
 */

import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';
import { logger } from '@voilajsx/appkit/logging';
import { authenticator } from '@voilajsx/appkit/auth';
import { helloMyService } from '../services/index.js';
import type { CreateHelloMyRequest, UpdateHelloMyRequest } from '../types/index.js';

/**
 * Request type definitions
 */
interface GetHelloMyParams {
  id: string;
}

/**
 * Main route registration function
 */
const helloMyRoutes: FastifyPluginCallback = async (fastify: FastifyInstance, options) => {
  const log = logger.get('hello-my-routes');
  const auth = authenticator.get();

  /**
   * Get all hello-my items
   * GET /api/hello-my
   */
  fastify.get('/', {
    preHandler: auth.requireLogin()
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    log.info('GET /hello-my - Fetching all items');
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await helloMyService.getAll();
    return reply.code(result.success ? 200 : 500).send(result);
  });

  /**
   * Get hello-my item by ID
   * GET /api/hello-my/:id
   */
  fastify.get<{ Params: GetHelloMyParams }>('/:id', {
    preHandler: auth.requireLogin()
  }, async (request, reply) => {
    const { id } = request.params;
    log.info('GET /hello-my/:id - Fetching item', { id });
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await helloMyService.getById(id);
    return reply.code(result.success ? 200 : 404).send(result);
  });

  /**
   * Create new hello-my item
   * POST /api/hello-my
   */
  fastify.post<{ Body: CreateHelloMyRequest }>('/', {
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
    log.info('POST /hello-my - Creating item', { data });
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await helloMyService.create(data, user.userId);
    return reply.code(result.success ? 201 : 400).send(result);
  });

  /**
   * Update hello-my item
   * PUT /api/hello-my/:id
   */
  fastify.put<{ Params: GetHelloMyParams; Body: UpdateHelloMyRequest }>('/:id', {
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
    log.info('PUT /hello-my/:id - Updating item', { id, data });
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await helloMyService.update(id, data);
    return reply.code(result.success ? 200 : 400).send(result);
  });

  /**
   * Delete hello-my item
   * DELETE /api/hello-my/:id
   */
  fastify.delete<{ Params: GetHelloMyParams }>('/:id', {
    preHandler: auth.requireLogin()
  }, async (request, reply) => {
    const { id } = request.params;
    log.info('DELETE /hello-my/:id - Deleting item', { id });
    const user = auth.user(request);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Authentication required' });
    }

    
    const result = await helloMyService.delete(id);
    return reply.code(result.success ? 200 : 400).send(result);
  });

  log.info('✅ HelloMy routes registered successfully', {
    prefix: '/api/hello-my',
    routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id'],
    authEnabled: true
  });
};

export default helloMyRoutes;