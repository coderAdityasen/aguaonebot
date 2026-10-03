export interface QuestionOption {
  id: string;
  title: string;
  description?: string;
}

export interface QuestionStep {
  type?: 'list' | 'text';
  text: string;
  next: string;
  options: QuestionOption[];
}

// -------------------------------------------------------------
// Brand Selector (Triggered when user does not mention brand)
// -------------------------------------------------------------
export const BRAND_CHOOSER: QuestionStep = {
  type: 'list',
  text: 'नमस्ते! AGUAONE & FLOVAX मा स्वागत छ। 🙏\nकृपया आफूले चाहेको ब्रान्ड छनौट गर्नुहोस्:\n\nWelcome! Please select the brand you want to connect with:',
  next: 'city',
  options: [
    { id: 'brand_flovax', title: 'FLOVAX (Nepal)', description: 'नेपाल डिलरशिप (Nepal Dealership)' },
    { id: 'brand_aguaone', title: 'AGUAONE (India)', description: 'India Dealership (भारत डिलरशिप)' }
  ]
};

// -------------------------------------------------------------
// FLOVAX (Nepal Dealership Form — 9 Questions in Nepali)
// -------------------------------------------------------------
export const FLOVAX_QUESTIONS: Record<string, QuestionStep> = {
  city: {
    type: 'list',
    text: 'धेरै राम्रो! 👍\nतपाईं नेपालको कुन शहर/जिल्लाबाट हुनुहुन्छ?',
    next: 'shop_status',
    options: [
      { id: 'ktm', title: 'काठमाडौं', description: 'Kathmandu' },
      { id: 'lalitpur', title: 'ललितपुर', description: 'Lalitpur' },
      { id: 'bhaktapur', title: 'भक्तपुर', description: 'Bhaktapur' },
      { id: 'pokhara', title: 'पोखरा', description: 'Pokhara' },
      { id: 'biratnagar', title: 'विराटनगर', description: 'Biratnagar' },
      { id: 'birgunj', title: 'वीरगञ्ज', description: 'Birgunj' },
      { id: 'bharatpur', title: 'भरतपुर', description: 'Bharatpur' },
      { id: 'butwal', title: 'बुटवल', description: 'Butwal' },
      { id: 'nepalgunj', title: 'नेपालगञ्ज', description: 'Nepalgunj' },
      { id: 'other', title: 'अन्य', description: 'Other' }
    ]
  },
  shop_status: {
    type: 'list',
    text: 'के तपाईंको आफ्नै पसल छ?',
    next: 'experience',
    options: [
      { id: 'own_shop', title: 'हो — आफ्नै पसल' },
      { id: 'planning_new_shop', title: 'होइन — नयाँ पसल योजना' }
    ]
  },
  experience: {
    type: 'list',
    text: 'तपाईंको पसल/व्यवसाय कति समयदेखि सञ्चालनमा छ?',
    next: 'opportunity',
    options: [
      { id: 'exp_0_1', title: '०–१ वर्ष' },
      { id: 'exp_1_3', title: '१–३ वर्ष' },
      { id: 'exp_3_5', title: '३–५ वर्ष' },
      { id: 'exp_5_plus', title: '५ वर्षभन्दा बढी' }
    ]
  },
  opportunity: {
    type: 'list',
    text: 'तपाईं FLOVAX मा कस्तो व्यवसायिक अवसर खोज्दै हुनुहुन्छ?',
    next: 'budget',
    options: [
      { id: 'retail_dealership', title: 'रिटेल डिलरशिप', description: 'Retail Dealership' },
      { id: 'import_distribution', title: 'आयात तथा वितरण', description: 'Import & Distribution' },
      { id: 'wholesale', title: 'थोक बिक्री', description: 'Wholesale' },
      { id: 'product_purchase', title: 'उत्पादन खरिद', description: 'Product Purchase' }
    ]
  },
  budget: {
    type: 'list',
    text: 'तपाईंको मासिक Sanitary / Bathroom Fittings व्यवसायको लगभग कारोबार कति छ?',
    next: 'firm_name',
    options: [
      { id: 'budget_under_50k', title: 'NPR ५० हजारभन्दा कम' },
      { id: 'budget_50k_2l', title: 'NPR ५० हजार–२ लाख' },
      { id: 'budget_2l_5l', title: 'NPR २ लाख–५ लाख' },
      { id: 'budget_5l_plus', title: 'NPR ५ लाखभन्दा बढी' },
      { id: 'budget_new', title: 'नयाँ व्यवसाय', description: 'अहिले नयाँ व्यवसाय सुरु गर्दैछु' }
    ]
  },
  firm_name: {
    type: 'text',
    text: 'तपाईंको फर्म / व्यवसायको नाम के हो? 🏢\nकृपया आफ्नो दर्ता भएको वा व्यवसायमा प्रयोग हुने फर्मको नाम लेख्नुहोस्:',
    next: 'import_license',
    options: []
  },
  import_license: {
    type: 'list',
    text: 'के तपाईंको फर्मसँग आयात (Import) गर्ने लाइसेन्स छ?',
    next: 'import_experience',
    options: [
      { id: 'license_yes', title: 'छ — उपलब्ध छ', description: 'आयात लाइसेन्स उपलब्ध छ' },
      { id: 'license_no', title: 'छैन — लाइसेन्स छैन', description: 'आयात लाइसेन्स छैन' },
      { id: 'license_process', title: 'आवेदन दिएको छु', description: 'प्रक्रिया चलिरहेको छ' },
      { id: 'license_unsure', title: 'थाहा छैन', description: 'Not Sure' }
    ]
  },
  import_experience: {
    type: 'list',
    text: 'के तपाईंले पहिले भारत वा अन्य देशबाट उत्पादनहरू आयात गर्नुभएको छ?',
    next: 'pan_registration',
    options: [
      { id: 'imp_regular', title: 'हो — नियमित रूपमा' },
      { id: 'imp_sometimes', title: 'हो — कहिलेकाहीँ' },
      { id: 'imp_first_time', title: 'होइन — पहिलो पटक', description: 'पहिलो पटक आयात गर्दैछु' }
    ]
  },
  pan_registration: {
    type: 'list',
    text: 'के तपाईंको फर्म कानुनी रूपमा दर्ता भएको छ?',
    next: 'handoff',
    options: [
      { id: 'pan_registered', title: 'हो — दर्ता भएको फर्म' },
      { id: 'pan_not_registered', title: 'होइन — दर्ता छैन', description: 'दर्ता भएको छैन' },
      { id: 'pan_in_process', title: 'दर्ता प्रक्रियामा छ' }
    ]
  }
};

export const FLOVAX_ORDER = [
  'city',
  'shop_status',
  'experience',
  'opportunity',
  'budget',
  'firm_name',
  'import_license',
  'import_experience',
  'pan_registration'
];

export const FLOVAX_THANK_YOU = 'धन्यवाद! 🙏\nतपाईंको विवरण हामीलाई प्राप्त भयो।\nहाम्रो FLOVAX टिमले तपाईंलाई छिट्टै सम्पर्क गर्नेछ।';
export const FLOVAX_RETRY_PREFIX = 'कृपया तल दिइएका विकल्पहरू मध्ये एक छनौट गर्नुहोस् 🙏\n\n';

// -------------------------------------------------------------
// AGUAONE (India Dealership Form — 7 Questions in Hindi/Hinglish)
// -------------------------------------------------------------
export const AGUAONE_QUESTIONS: Record<string, QuestionStep> = {
  city: {
    type: 'list',
    text: 'बहुत बढ़िया! 👍\nआप किस शहर से हैं?',
    next: 'shop_status',
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
  shop_status: {
    type: 'list',
    text: 'क्या आपकी खुद की दुकान है?',
    next: 'experience',
    options: [
      { id: 'own_shop', title: 'Yes — Own Shop' },
      { id: 'planning_new_shop', title: 'No — Planning New Shop' },
      { id: 'wholesale_distributor', title: 'Wholesale / Distributor' }
    ]
  },
  experience: {
    type: 'list',
    text: 'आपकी दुकान/बिज़नेस को कितने समय से चलाया जा रहा है?',
    next: 'opportunity',
    options: [
      { id: 'exp_0_1', title: '0–1 Year' },
      { id: 'exp_1_3', title: '1–3 Years' },
      { id: 'exp_3_5', title: '3–5 Years' },
      { id: 'exp_5_plus', title: '5+ Years' }
    ]
  },
  opportunity: {
    type: 'list',
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
    type: 'list',
    text: 'लगभग आपका monthly sanitary/bath fitting business कितना है?',
    next: 'firm_name',
    options: [
      { id: 'budget_below_50k', title: '₹50K से कम' },
      { id: 'budget_50k_2l', title: '₹50K–₹2L' },
      { id: 'budget_2l_5l', title: '₹2L–₹5L' },
      { id: 'budget_5l_plus', title: '₹5L+' },
      { id: 'budget_new', title: 'अभी नया शुरू कर रहा हूँ' }
    ]
  },
  firm_name: {
    type: 'text',
    text: 'आपकी Firm / Business का नाम क्या है? 🏢\nकृपया अपनी पंजीकृत (registered) या व्यावसायिक फ़र्म का नाम लिखें:',
    next: 'gst_status',
    options: []
  },
  gst_status: {
    type: 'list',
    text: 'क्या आपकी Firm के पास GST Registration है?',
    next: 'handoff',
    options: [
      { id: 'gst_registered', title: 'Yes — GST Registered' },
      { id: 'gst_not_registered', title: 'No — Not Registered' },
      { id: 'gst_in_process', title: 'Applied — In Process', description: 'GST Application in Process' },
      { id: 'gst_not_applicable', title: 'Not Applicable' }
    ]
  }
};

export const AGUAONE_ORDER = [
  'city',
  'shop_status',
  'experience',
  'opportunity',
  'budget',
  'firm_name',
  'gst_status'
];

export const AGUAONE_THANK_YOU = 'धन्यवाद! 🙏\nआपकी जानकारी हमें मिल गई है।\nहमारी AGUAONE team आपसे जल्द ही संपर्क करेगी।';
export const AGUAONE_RETRY_PREFIX = 'कृपया नीचे दिए गए विकल्पों में से एक चुनें 🙏\n\n';

export const RESTART_WORDS = new Set(['restart', 'restart survey', 'start over', 'सुरु गर', 'शुरू करो', 'रिसर्च']);

// Backward-compatible fallback references
export const QUESTIONS = AGUAONE_QUESTIONS;
export const ORDER = AGUAONE_ORDER;
export const THANK_YOU_REPLY = AGUAONE_THANK_YOU;
export const RETRY_PREFIX = AGUAONE_RETRY_PREFIX;
