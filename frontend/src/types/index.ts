export interface Contact {
  phone: string;
  name: string;
  brand?: 'aguaone' | 'flovax' | string;
  state: string;
  lead_status: 'IN_PROGRESS' | 'HANDOFF' | 'QUALIFIED' | 'CLOSED';
  bot_active: number; // 1 = Bot active, 0 = Human in control
  city: string;
  category?: string;
  shop_status: string;
  experience: string;
  opportunity: string;
  budget: string;
  firm_name?: string;
  import_license?: string;
  import_experience?: string;
  pan_registration?: string;
  gst_status?: string;
  qualified: number;
  unread_count: number;
  last_message: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id?: number;
  whatsapp_message_id?: string;
  phone: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'customer' | 'bot' | 'agent';
  message_type: 'text' | 'interactive' | 'image' | 'template';
  content: string;
  selected_option?: string | null;
  selected_title?: string | null;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}

export interface Note {
  id: number;
  phone: string;
  agent_name: string;
  note: string;
  created_at: string;
}

export interface MetaConnectionStatus {
  configured: boolean;
  phoneId: string;
  wabaId: string;
  appId: string;
  verifyToken: string;
  publicDomain: string;
  metaConnection?: {
    connected: boolean;
    displayPhoneNumber?: string;
    verifiedName?: string;
    qualityRating?: string;
    error?: string;
  };
}
