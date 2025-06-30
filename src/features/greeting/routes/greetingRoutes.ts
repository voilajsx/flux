/**
 * Greeting API Routes - TypeScript
 * @description Demo API endpoints showing Flux patterns with full type safety
 * @module @voilajsx/flux/features/greeting
 * @file src/features/greeting/routes/greetingRoutes.ts
 */

import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginCallback } from 'fastify';

import { logger } from '@voilajsx/appkit/logging';

/**
 * Request type definitions for Fastify routes
 */
interface GreetNameParams {
  name: string;
}

interface GreetNameBody {
  message?: string;
}

interface AuthUser {
  userId: string;
  email: string;
  roles?: string[];
}

/**
 * Standard API response interface
 */
interface APIResponse<T = any> {
  message: string;
  timestamp: string;
  feature: string;
  endpoint: string;
  data?: T;
  user?: {
    id: string;
    email: string;
    roles?: string[];
  };
  [key: string]: any;
}

/**
 * Main route registration function
 */
const greetingRoutes: FastifyPluginCallback = async (fastify: FastifyInstance, options) => {
  const log = logger.get('greeting-routes');

  // Try to get auth, but handle gracefully if not configured
  let auth: any = null;
  try {
    const { authenticator } = await import('@voilajsx/appkit/auth');
    auth = authenticator.get();
    log.info('✨ Authentication configured for greeting routes');
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    log.warn('✨ Authentication not configured - auth endpoints will be demo only', {
      error: error.message
    });
  }

  /**
   * Public endpoint - no authentication required
   * GET /api/greeting/hello
   */
  fastify.get('/hello', async (request: FastifyRequest, reply: FastifyReply): Promise<APIResponse> => {
    log.info('✨ Public hello endpoint called');
    
    return {
      message: 'Hello from Flux Framework with TypeScript!',
      timestamp: new Date().toISOString(),
      feature: 'greeting',
      endpoint: 'public',
      data: {
        framework: 'Flux',
        language: 'TypeScript',
        platform: 'Node.js',
        version: '1.0.0'
      }
    };
  });

  /**
   * Personalized greeting with validation
   * POST /api/greeting/greet/:name
   */
  fastify.post<{ 
    Params: GreetNameParams; 
    Body: GreetNameBody;
  }>(
    '/greet/:name',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 50 }
          },
          required: ['name']
        },
        body: {
          type: 'object',
          properties: {
            message: { type: 'string', maxLength: 100 }
          }
        }
      }
    },
    async (request, reply): Promise<APIResponse> => {
      const { name } = request.params;
      const { message = 'Hello' } = request.body || {};

      log.info('✨ Personalized greeting called', { name, message });

      // Additional validation
      if (name.length < 2) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Name must be at least 2 characters long',
          timestamp: new Date().toISOString(),
          feature: 'greeting',
          endpoint: 'validation-error'
        });
      }

      return {
        message: `${message}, ${name}! Welcome to TypeScript Flux! ✨`,
        timestamp: new Date().toISOString(),
        feature: 'greeting',
        endpoint: 'personalized',
        data: {
          inputName: name,
          customMessage: message,
          characterCount: name.length
        }
      };
    }
  );

  /**
   * Authenticated endpoint - requires valid JWT token or demo mode
   * GET /api/greeting/personal
   */
  if (auth) {
    // Real authentication available
    fastify.get('/personal', {
      preHandler: auth.requireLogin()
    }, async (request, reply: FastifyReply): Promise<APIResponse> => {
      const user = auth.user(request);
      
      log.info('✨ Authenticated personal endpoint called', { userId: user?.userId });
      
      return {
        message: `Hello, ${user?.email || 'User'}! You are authenticated! ✨`,
        timestamp: new Date().toISOString(),
        feature: 'greeting',
        endpoint: 'authenticated',
        user: {
          id: user?.userId || 'unknown',
          email: user?.email || 'unknown',
          roles: user?.roles || []
        },
        data: {
          authenticationMethod: 'JWT',
          sessionValid: true
        }
      };
    });
  } else {
    // Demo mode when auth not configured
    fastify.get('/personal', async (request: FastifyRequest, reply: FastifyReply): Promise<APIResponse> => {
      log.info('✨ Demo personal endpoint called (auth not configured)');
      
      return {
        message: 'Hello, Demo User! Authentication not configured ✨',
        timestamp: new Date().toISOString(),
        feature: 'greeting',
        endpoint: 'personal-demo',
        user: {
          id: 'demo-user',
          email: 'demo@flux.example.com',
          roles: ['user']
        },
        data: {
          note: 'Add JWT_SECRET and VOILA_AUTH_SECRET to .env for real authentication',
          demoMode: true
        }
      };
    });
  }

  /**
   * Admin endpoint - requires admin role or demo mode
   * GET /api/greeting/admin
   */
  if (auth) {
    // Real admin authentication
    fastify.get('/admin', {
      preHandler: [
        auth.requireLogin(),
        auth.requireRole('admin')
      ]
    }, async (request, reply: FastifyReply): Promise<APIResponse> => {
      const user = auth.user(request);
      
      log.info('✨ Admin endpoint called', { userId: user?.userId, roles: user?.roles });
      
      return {
        message: `Welcome Admin ${user?.email}! You have elevated privileges! ✨`,
        timestamp: new Date().toISOString(),
        feature: 'greeting',
        endpoint: 'admin',
        user: {
          id: user?.userId || 'unknown',
          email: user?.email || 'unknown',
          roles: user?.roles || []
        },
        data: {
          adminData: {
            totalRequests: Math.floor(Math.random() * 1000),
            systemStatus: 'healthy',
            uptime: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage(),
            activeFeatures: ['greeting', 'auth'],
            serverInfo: {
              nodeVersion: process.version,
              platform: process.platform,
              architecture: process.arch
            }
          },
          permissions: ['read', 'write', 'delete', 'admin'],
          securityLevel: 'high'
        }
      };
    });
  } else {
    // Demo admin mode
    fastify.get('/admin', async (request: FastifyRequest, reply: FastifyReply): Promise<APIResponse> => {
      log.info('✨ Demo admin endpoint called (auth not configured)');
      
      return {
        message: 'Welcome Demo Admin! This is a demonstration of admin features ✨',
        timestamp: new Date().toISOString(),
        feature: 'greeting',
        endpoint: 'admin-demo',
        user: {
          id: 'demo-admin',
          email: 'admin@flux.example.com',
          roles: ['admin', 'user']
        },
        data: {
          note: 'Add JWT_SECRET and VOILA_AUTH_SECRET to .env for real admin authentication',
          demoData: {
            totalRequests: 42,
            systemStatus: 'healthy',
            uptime: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage(),
            activeFeatures: ['greeting'],
            demoMode: true
          },
          permissions: ['demo-read', 'demo-write'],
          securityLevel: 'demo'
        }
      };
    });
  }

  log.info('✨ ✅ Greeting routes registered successfully', {
    authConfigured: !!auth,
    endpoints: ['/hello', '/greet/:name', '/personal', '/admin']
  });
};

export default greetingRoutes;