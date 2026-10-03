import { FastifyPluginAsync } from 'fastify';
import { 
  verifyMetaCredentials, 
  autoRegisterWebhookWithMeta 
} from '../whatsapp/subscriptions';
import { config } from '../config/env';
import { statements } from '../database/db';

export const metaRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/meta/status
  fastify.get('/api/meta/status', async () => {
    const credStatus = await verifyMetaCredentials();
    return {
      configured: config.isConfigured(),
      phoneId: config.whatsappPhoneNumberId,
      wabaId: config.whatsappWabaId,
      appId: config.metaAppId,
      verifyToken: config.whatsappVerifyToken,
      publicDomain: config.publicDomain,
      metaConnection: credStatus
    };
  });

  // POST /api/meta/auto-subscribe
  fastify.post('/api/meta/auto-subscribe', async (req, reply) => {
    const body = (req.body || {}) as {
      domain?: string;
      verifyToken?: string;
      token?: string;
      appId?: string;
      wabaId?: string;
    };

    try {
      const result = await autoRegisterWebhookWithMeta(body);
      return result;
    } catch (err: any) {
      return reply.code(400).send({
        success: false,
        error: err.response?.data?.error?.message || err.message
      });
    }
  });

  // POST /api/meta/simulate-webhook (Allows testing conversation flow locally even before Meta credentials)
  fastify.post('/api/meta/simulate-incoming', async (req, reply) => {
    const body = req.body as {
      phone: string;
      text: string;
      name?: string;
      optionId?: string;
      optionTitle?: string;
    };

    if (!body.phone || (!body.text && !body.optionTitle)) {
      return reply.code(400).send({ error: 'Phone and text or option are required' });
    }

    const simulatedPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: config.whatsappPhoneNumberId || '123456789' },
                contacts: [{ profile: { name: body.name || 'Test User' }, wa_id: body.phone }],
                messages: [
                  body.optionId
                    ? {
                        from: body.phone,
                        id: `sim_in_${Date.now()}`,
                        type: 'interactive',
                        interactive: {
                          type: 'list_reply',
                          list_reply: { id: body.optionId, title: body.optionTitle || body.text }
                        }
                      }
                    : {
                        from: body.phone,
                        id: `sim_in_${Date.now()}`,
                        type: 'text',
                        text: { body: body.text }
                      }
                ]
              }
            }
          ]
        }
      ]
    };

    // Forward internally to /webhook
    await fastify.inject({
      method: 'POST',
      url: '/webhook',
      payload: simulatedPayload
    });

    return { success: true, message: 'Simulated incoming message sent to bot.' };
  });
};
