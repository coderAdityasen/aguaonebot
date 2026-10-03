import crypto from 'crypto';
import { metaHttpClient } from '../config/http-client';
import { config } from '../config/env';

export interface AutoSubscribeOptions {
  domain?: string;
  appId?: string;
  appSecret?: string;
  wabaId?: string;
  token?: string;
}

// Generates a deterministic internal verify token from App Secret (no manual token needed)
export function getAutoVerifyToken(): string {
  if (config.metaAppSecret && config.metaAppSecret !== 'YOUR_META_APP_SECRET') {
    return crypto.createHash('sha256').update(config.metaAppSecret).digest('hex').slice(0, 32);
  }
  return config.whatsappVerifyToken || 'aguaone_auto_verify_token';
}

export async function autoRegisterWebhookWithMeta(options: AutoSubscribeOptions = {}) {
  const appId = options.appId || config.metaAppId;
  const appSecret = options.appSecret || config.metaAppSecret;
  const token = options.token || config.whatsappToken;
  const wabaId = options.wabaId || config.whatsappWabaId;
  const domain = options.domain || config.publicDomain;

  if (!appId || appId === 'YOUR_META_APP_ID') {
    return { success: false, reason: 'META_APP_ID not configured' };
  }

  // Meta allows App Access Token in the format: APP_ID|APP_SECRET
  let appAccessToken = token;
  if (appSecret && appSecret !== 'YOUR_META_APP_SECRET') {
    appAccessToken = `${appId}|${appSecret}`;
  }

  if (!appAccessToken || appAccessToken === 'EAAG_YOUR_META_PERMANENT_ACCESS_TOKEN') {
    return { success: false, reason: 'No valid Meta Token or App Secret available' };
  }

  const cleanDomain = domain.replace(/\/$/, '');
  const callbackUrl = `${cleanDomain}/webhook`;
  const verifyToken = getAutoVerifyToken();

  try {
    console.log(`\n🤖 [Meta Auto-Setup] Automatically registering Webhook with Meta...`);
    console.log(`🌐 Callback URL: ${callbackUrl}`);

    // 1. Subscribe App to WhatsApp Webhooks (Using App Access Token just like n8n)
    const subUrl = `https://graph.facebook.com/v25.0/${appId}/subscriptions`;
    await metaHttpClient.post(subUrl, null, {
      params: {
        object: 'whatsapp_business_account',
        callback_url: callbackUrl,
        verify_token: verifyToken,
        fields: 'messages,message_template_status_update',
        access_token: appAccessToken
      }
    });

    console.log(`✅ [Meta Auto-Setup] Webhook URL and fields registered with Meta successfully!`);

    // 2. Attach WABA to App if WABA ID and user token are provided
    if (wabaId && wabaId !== 'YOUR_WHATSAPP_BUSINESS_ACCOUNT_ID' && token && token !== 'EAAG_YOUR_META_PERMANENT_ACCESS_TOKEN') {
      try {
        const wabaUrl = `https://graph.facebook.com/v25.0/${wabaId}/subscribed_apps`;
        await metaHttpClient.post(wabaUrl, null, {
          params: { access_token: token }
        });
        console.log(`✅ [Meta Auto-Setup] WhatsApp Business Account (${wabaId}) subscribed!`);
      } catch (err: any) {
        // Non-critical if already subscribed
        console.log(`ℹ️ [Meta Auto-Setup] WABA subscription status:`, err.response?.data?.error?.message || 'Already active');
      }
    }

    return {
      success: true,
      callbackUrl,
      message: 'Meta Webhook automatically configured!'
    };
  } catch (err: any) {
    const errMsg = err.response?.data?.error?.message || err.message;
    console.warn(`⚠️ [Meta Auto-Setup Warning]: Could not auto-register with Meta:`, errMsg);
    return { success: false, error: errMsg };
  }
}

export async function verifyMetaCredentials() {
  const token = config.whatsappToken;
  const phoneId = config.whatsappPhoneNumberId;

  if (!token || token === 'EAAG_YOUR_META_PERMANENT_ACCESS_TOKEN') {
    return {
      connected: false,
      message: 'Token not set in environment or settings.'
    };
  }

  try {
    const url = `https://graph.facebook.com/v25.0/${phoneId}`;
    const response = await metaHttpClient.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      connected: true,
      displayPhoneNumber: response.data?.display_phone_number,
      verifiedName: response.data?.verified_name,
      qualityRating: response.data?.quality_rating,
      id: response.data?.id
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}
