import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import { initWebSocketServer } from './websocket/socket';
import { requireAdminAuth } from './auth/auth';
import { authRoutes } from './routes/auth.routes';
import { webhookRoutes } from './whatsapp/webhook';
import { contactRoutes } from './routes/contacts.routes';
import { messageRoutes } from './routes/messages.routes';
import { metaRoutes } from './routes/meta.routes';
import { exportRoutes } from './routes/export.routes';
import { autoRegisterWebhookWithMeta } from './whatsapp/subscriptions';

async function bootstrap() {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn'
    }
  });

  // Enable Cross-Origin Resource Sharing
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
  });

  // Enable Multipart File Uploads (up to 50MB)
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 50 * 1024 * 1024
    }
  });

  // Serve persistent user-uploaded media files
  const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  await fastify.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
    setHeaders: (res, pathName) => {
      const base = path.basename(pathName);
      // Clean internal timestamp prefix for clean client download name
      const cleanName = base.replace(/^(?:inbound_|document_|image_|video_|audio_)?\d+_[a-z0-9]*_?/i, '');
      const downloadName = cleanName || base;
      res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    }
  });

  // Initialize Real-time WebSocket Server
  initWebSocketServer(fastify.server);

  // 1. PUBLIC: Health check
  fastify.get('/api/health', async () => {
    const memoryUsage = process.memoryUsage();
    return {
      status: 'healthy',
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      },
      configured: config.isConfigured()
    };
  });

  // 2. PUBLIC: WhatsApp Webhook (Meta calls this without token)
  await fastify.register(webhookRoutes);

  // 3. PUBLIC: Authentication Routes (/api/auth/login)
  await fastify.register(authRoutes);

  // 4. PROTECTED: Admin / Agent CRM API Routes (Requires Bearer Token)
  await fastify.register(async (protectedScope) => {
    protectedScope.addHook('preHandler', requireAdminAuth);
    await protectedScope.register(contactRoutes);
    await protectedScope.register(messageRoutes);
    await protectedScope.register(metaRoutes);
    await protectedScope.register(exportRoutes);
  });

  // 5. PUBLIC: Serve compiled React static frontend
  const frontendDistPath = path.resolve(process.cwd(), 'frontend', 'dist');
  if (fs.existsSync(frontendDistPath)) {
    await fastify.register(fastifyStatic, {
      root: frontendDistPath,
      prefix: '/'
    });

    // Client-side SPA routing fallback
    fastify.setNotFoundHandler((req, reply) => {
      if (req.raw.url && (req.raw.url.startsWith('/api') || req.raw.url.startsWith('/uploads'))) {
        return reply.code(404).send({ error: 'Endpoint or file not found' });
      }
      return reply.sendFile('index.html');
    });
  } else {
    fastify.get('/', async () => {
      return {
        message: 'AGUAONE WhatsApp Automation API is running.',
        ui: 'Frontend not yet built. Run `npm run build:frontend` to bundle the WhatsApp Web UI.',
        webhook: `${config.publicDomain}/webhook`,
        health: `${config.publicDomain}/api/health`
      };
    });
  }

  // Start Server
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`
===========================================================
🚀 AGUAONE WhatsApp Bot & Live Agent CRM Started!
===========================================================
📡 Port:           ${config.port}
🌐 Public Domain:  ${config.publicDomain}
📥 Webhook URL:    ${config.publicDomain}/webhook
🔐 Admin User:     ${config.adminUsername}
🖥️ Dashboard:      http://localhost:${config.port}
===========================================================
    `);

    // Automatically configure Meta Webhook on startup if App ID and Secret are provided (like n8n does)
    if (
      config.metaAppId && 
      config.metaAppId !== 'YOUR_META_APP_ID' && 
      config.publicDomain && 
      !config.publicDomain.includes('localhost')
    ) {
      autoRegisterWebhookWithMeta().catch((err) => {
        console.warn('[Meta Auto-Setup Notice]:', err.message);
      });
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
