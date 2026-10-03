export interface QuestionOption {
  id: string;
  title: string;
  description?: string;
}

export interface QuestionStep {
  text: string;
  next: string;
  options: QuestionOption[];
}

export const QUESTIONS: Record<string, QuestionStep> = {
  city: {
    text: 'बहुत बढ़िया! 👍\nआप किस शहर से हैं?',
    next: 'category',
    options: [
      { id: 'lucknow', title: 'Lucknow' },
      { id: 'kanpur', title: 'Kanpur' },
      { id: 'varanasi', title: 'Varanasi' },
      { id: 'agra', title: 'Agra' },
      { id: 'prayagraj', title: 'Prayagraj' },
      { id: 'gorakhpur', title: 'Gorakhpur' },
      { id: 'meerut', title: 'Meerut' },
      { id: 'noida_ghaziabad', title: 'Noida/Ghaziabad' },
      { id: 'other_city', title: 'Other' }
    ]
  },
  category: {
    text: 'आपकी दुकान किस category में आती है?',
    next: 'shop_status',
    options: [
      { id: 'sanitaryware', title: 'Sanitaryware' },
      { id: 'bathroom_fittings', title: 'Bathroom Fittings' },
      { id: 'hardware_plumbing', title: 'Hardware / Plumbing' },
      { id: 'building_material', title: 'Building Material' },
      { id: 'other_category', title: 'Other' }
    ]
  },
  shop_status: {
    text: 'क्या आपकी खुद की दुकान है?',
    next: 'experience',
    options: [
      { id: 'own_shop', title: 'Own Shop' },
      { id: 'planning_new_shop', title: 'Planning New Shop' },
      { id: 'wholesale_distributor', title: 'Wholesale/Distributor' }
    ]
  },
  experience: {
    text: 'आपकी दुकान को कितने समय से चलाया जा रहा है?',
    next: 'opportunity',
    options: [
      { id: 'exp_0_1', title: '0–1 Year' },
      { id: 'exp_1_3', title: '1–3 Years' },
      { id: 'exp_3_5', title: '3–5 Years' },
      { id: 'exp_5_plus', title: '5+ Years' }
    ]
  },
  opportunity: {
    text: 'आप AGUAONE में किस तरह की business opportunity देख रहे हैं?',
    next: 'budget',
    options: [
      { id: 'retail_dealership', title: 'Retail Dealership' },
      { id: 'distributor', title: 'Distributor' },
      { id: 'wholesale', title: 'Wholesale' },
      { id: 'product_purchase', title: 'Product Purchase' }
    ]
  },
  budget: {
    text: 'लगभग आपका monthly sanitary/bath fitting business कितना है?',
    next: 'handoff',
    options: [
      { id: 'budget_below_50k', title: '₹50K से कम' },
      { id: 'budget_50k_2l', title: '₹50K–₹2L' },
      { id: 'budget_2l_5l', title: '₹2L–₹5L' },
      { id: 'budget_5l_plus', title: '₹5L+' },
      { id: 'budget_new', title: 'अभी नया शुरू कर रहा हूँ' }
    ]
  }
};

export const ORDER = ['city', 'category', 'shop_status', 'experience', 'opportunity', 'budget'];
export const RESTART_WORDS = new Set(['restart', 'restart survey', 'start over']);
export const THANK_YOU_REPLY = 'धन्यवाद! 🙏\nआपकी जानकारी हमें मिल गई है।\nहमारी team आपसे जल्द ही संपर्क करेगी।';
export const RETRY_PREFIX = 'कृपया नीचे दिए गए विकल्पों में से एक चुनें 🙏\n\n';
