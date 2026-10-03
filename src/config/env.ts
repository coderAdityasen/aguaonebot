import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // WhatsApp Cloud API
  whatsappToken: process.env.WHATSAPP_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappWabaId: process.env.WHATSAPP_WABA_ID || '',
  metaAppId: process.env.META_APP_ID || '',
  metaAppSecret: process.env.META_APP_SECRET || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'aguaone_lead_bot_verify_token_2026',
  publicDomain: process.env.PUBLIC_DOMAIN || 'http://localhost:3000',

  // Admin Authentication
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'aguaone@2026',
  jwtSecret: process.env.JWT_SECRET || 'aguaone_super_secret_auth_token_key_2026',

  isConfigured: () => {
    return Boolean(
      config.whatsappToken &&
      config.whatsappToken !== 'EAAG_YOUR_META_PERMANENT_ACCESS_TOKEN' &&
      config.whatsappPhoneNumberId &&
      config.whatsappPhoneNumberId !== 'YOUR_PHONE_NUMBER_ID'
    );
  }
};
