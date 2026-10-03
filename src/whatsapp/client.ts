import { metaHttpClient } from '../config/http-client';
import { config } from '../config/env';
import { QuestionOption } from '../bot/questions';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: any;
}

export async function sendWhatsAppMessage(
  phoneNumberId: string,
  payload: any
): Promise<WhatsAppSendResult> {
  const targetPhoneId = phoneNumberId || config.whatsappPhoneNumberId;
  const token = config.whatsappToken;

  if (!token || token === 'EAAG_YOUR_META_PERMANENT_ACCESS_TOKEN') {
    console.warn('[WhatsAppClient] WHATSAPP_TOKEN is not configured. Simulating outbound send:', payload);
    return {
      success: true,
      messageId: `sim_${Date.now()}`
    };
  }

  const url = `https://graph.facebook.com/v25.0/${targetPhoneId}/messages`;

  try {
    const response = await metaHttpClient.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const msgId = response.data?.messages?.[0]?.id;
    return {
      success: true,
      messageId: msgId
    };
  } catch (error: any) {
    const errDetails = error.response?.data?.error || error.message;
    console.error('[WhatsAppClient] Failed to send message via Meta Graph API:', errDetails);
    return {
      success: false,
      error: errDetails
    };
  }
}

export function buildInteractiveListPayload(
  to: string,
  bodyText: string,
  options: QuestionOption[]
) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: 'विकल्प चुनें',
        sections: [
          {
            title: 'Options',
            rows: options.map(o => ({
              id: o.id,
              title: o.title,
              ...(o.description ? { description: o.description } : {})
            }))
          }
        ]
      }
    }
  };
}

export function buildTextPayload(to: string, bodyText: string) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: bodyText }
  };
}
