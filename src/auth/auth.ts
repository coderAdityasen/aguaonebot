import crypto from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/env';

interface TokenPayload {
  username: string;
  role: 'admin';
  exp: number; // Unix timestamp in ms
}

export function generateToken(username: string): string {
  const payload: TokenPayload = {
    username,
    role: 'admin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // Valid for 7 days
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(encodedPayload)
    .digest('hex');

  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): { valid: boolean; user?: TokenPayload } {
  if (!token || !token.includes('.')) {
    return { valid: false };
  }

  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) {
    return { valid: false };
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.jwtSecret)
    .update(encodedPayload)
    .digest('hex');

  const bufProvided = Buffer.from(providedSignature);
  const bufExpected = Buffer.from(expectedSignature);

  if (bufProvided.length !== bufExpected.length) {
    return { valid: false };
  }

  // Constant-time comparison to prevent timing attacks
  const signatureMatch = crypto.timingSafeEqual(bufProvided, bufExpected);

  if (!signatureMatch) {
    return { valid: false };
  }

  try {
    const payload: TokenPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    );

    // Check expiration
    if (Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, user: payload };
  } catch {
    return { valid: false };
  }
}

// Fastify preHandler hook to protect admin routes
export async function requireAdminAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if ((req.query as any)?.token) {
    token = String((req.query as any).token).trim();
  }

  if (!token) {
    return reply.code(401).send({ error: 'Unauthorized: Admin authentication token required' });
  }

  const { valid, user } = verifyToken(token);

  if (!valid || !user) {
    return reply.code(401).send({ error: 'Unauthorized: Invalid or expired session' });
  }

  // Attach user to request
  (req as any).user = user;
}
