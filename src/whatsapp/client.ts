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

  const url = `https://graph.facebook.com/v21.0/${targetPhoneId}/messages`;

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

export function buildMediaPayload(
  to: string,
  mediaType: 'image' | 'video' | 'document' | 'audio',
  mediaIdOrUrl: string,
  caption?: string,
  isUrl: boolean = false,
  filename?: string
) {
  const mediaObj: any = isUrl ? { link: mediaIdOrUrl } : { id: mediaIdOrUrl };
  if (caption && caption.trim()) {
    mediaObj.caption = caption.trim();
  }
  if (mediaType === 'document') {
    let docName = (filename || '').trim();
    if (!docName || docName.toLowerCase() === 'untitled') {
      docName = 'Document.pdf';
    }
    if (!docName.includes('.')) {
      docName = `${docName}.pdf`;
    }
    mediaObj.filename = docName;
  }

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: mediaType,
    [mediaType]: mediaObj
  };
}

export async function uploadMediaToMeta(
  phoneNumberId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ success: boolean; mediaId?: string; error?: any }> {
  const targetPhoneId = phoneNumberId || config.whatsappPhoneNumberId;
  const token = config.whatsappToken;

  if (!token || token === 'EAAG_YOUR_META_PERMANENT_ACCESS_TOKEN') {
    console.warn('[WhatsAppClient] WHATSAPP_TOKEN not configured. Simulating media upload.');
    return {
      success: true,
      mediaId: `sim_media_${Date.now()}`
    };
  }

  const url = `https://graph.facebook.com/v21.0/${targetPhoneId}/media`;

  try {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    form.append('file', blob, fileName);
    form.append('type', mimeType);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

    const data: any = await response.json();

    if (!response.ok || !data.id) {
      console.error('[WhatsAppClient] Failed to upload media to Meta:', data?.error || data);
      return {
        success: false,
        error: data?.error || data
      };
    }

    return {
      success: true,
      mediaId: data.id
    };
  } catch (error: any) {
    console.error('[WhatsAppClient] Failed to upload media to Meta:', error.message || error);
    return {
      success: false,
      error: error.message || error
    };
  }
}

export async function sendWhatsAppMediaMessage(
  phoneNumberId: string,
  to: string,
  mediaType: 'image' | 'video' | 'document' | 'audio',
  mediaIdOrUrl: string,
  caption?: string,
  isUrl: boolean = false,
  filename?: string
): Promise<WhatsAppSendResult> {
  const payload = buildMediaPayload(to, mediaType, mediaIdOrUrl, caption, isUrl, filename);
  return sendWhatsAppMessage(phoneNumberId, payload);
}

export async function downloadMediaFromMeta(
  mediaId: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const token = config.whatsappToken;
  if (!token || token === 'EAAG_YOUR_META_PERMANENT_ACCESS_TOKEN' || !mediaId) {
    return null;
  }

  try {
    // 1. Get temporary download URL from Meta Graph API v21.0
    const metaUrl = `https://graph.facebook.com/v21.0/${mediaId}`;
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const metaData: any = await metaRes.json();
    const downloadUrl = metaData?.url;
    const mimeType = metaData?.mime_type || 'application/octet-stream';

    if (!downloadUrl) {
      console.warn(`[WhatsAppClient] Meta returned no download URL for media ${mediaId}:`, metaData);
      return null;
    }

    // 2. Fetch actual binary stream using Meta Bearer token
    const fileRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const arrayBuffer = await fileRes.arrayBuffer();

    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType
    };
  } catch (error: any) {
    console.error(`[WhatsAppClient] Failed to download media ${mediaId} from Meta:`, error.message || error);
    return null;
  }
}
