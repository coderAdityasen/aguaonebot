import { FastifyPluginAsync } from 'fastify';
import { config } from '../config/env';
import { generateToken, requireAdminAuth } from '../auth/auth';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/auth/login
  fastify.post('/api/auth/login', async (req, reply) => {
    const body = (req.body || {}) as { username?: string; password?: string };
    const username = (body.username || '').trim();
    const password = (body.password || '').trim();

    if (!username || !password) {
      return reply.code(400).send({
        success: false,
        error: 'Username and password are required'
      });
    }

    if (username === config.adminUsername && password === config.adminPassword) {
      const token = generateToken(username);
      return {
        success: true,
        token,
        user: {
          username,
          role: 'admin'
        }
      };
    }

    return reply.code(401).send({
      success: false,
      error: 'Invalid admin username or password'
    });
  });

  // GET /api/auth/me (Verify session token)
  fastify.get('/api/auth/me', { preHandler: [requireAdminAuth] }, async (req) => {
    const user = (req as any).user;
    return {
      authenticated: true,
      user
    };
  });
};
