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

// Shared GST choices. CLAREN and FLOVAX India both end on this question.
export const GST_OPTIONS: QuestionOption[] = [
  { id: 'gst_registered', title: 'Yes — GST Registered' },
  { id: 'gst_not_registered', title: 'No — Not Registered' },
  { id: 'gst_in_process', title: 'Applied — In Process', description: 'GST Application in Process' },
  { id: 'gst_not_applicable', title: 'Not Applicable' }
];

// -------------------------------------------------------------
// Brand Selector (Triggered when user does not mention brand)
// -------------------------------------------------------------
export const BRAND_CHOOSER: QuestionStep = {
  type: 'list',
  text: 'नमस्ते! CLAREN & FLOVAX मा स्वागत छ। 🙏\nकृपया आफूले चाहेको ब्रान्ड छनौट गर्नुहोस्:\n\nWelcome! Please select the brand you want to connect with:',
  next: 'city',
  options: [
    { id: 'brand_flovax', title: 'FLOVAX'},
    { id: 'brand_claren', title: 'CLAREN '}
  ]
};

// -------------------------------------------------------------
// FLOVAX (Nepal Dealership Form — 9 Questions in Nepali)
// -------------------------------------------------------------
export const FLOVAX_QUESTIONS: Record<string, QuestionStep> = {
  city: {
    type: 'list',
    text: 'धेरै राम्रो! 👍\nतपाईं नेपालको कुन शहर/जिल्लाबाट हुनुहुन्छ?\n(सूचीबाट छनौट गर्नुहोस् वा आफ्नो शहरको नाम लेख्नुहोस्)',
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
      { id: 'other', title: 'अन्य (शहर लेख्नुहोस्)', description: 'Other City' }
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
      { id: 'license_yes', title: 'छ — उपलब्ध छ', description: 'Yes / आयात लाइसेन्स छ' },
      { id: 'license_no', title: 'छैन — लाइसेन्स छैन', description: 'No / आयात लाइसेन्स छैन' },
      { id: 'license_process', title: 'आवेदन दिएको छु', description: 'In Process / प्रक्रियामा छ' },
      { id: 'license_unsure', title: 'थाहा छैन', description: 'Not Sure (थाहा छैन)' }
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

// Asked only after the user picks FLOVAX. Nepal keeps the Nepali form above.
export const FLOVAX_COUNTRY: QuestionStep = {
  type: 'list',
  text: 'धेरै राम्रो! 👍\nतपाईं कुन देशबाट हुनुहुन्छ?\n\nWhich country are you from?',
  next: 'city',
  options: [
    { id: 'country_india', title: 'India' },
    { id: 'country_nepal', title: 'Nepal' },
    { id: 'country_bangladesh', title: 'Bangladesh' },
    { id: 'country_bhutan', title: 'Bhutan' },
    { id: 'country_sri_lanka', title: 'Sri Lanka' },
    { id: 'country_south_africa', title: 'South Africa' }
  ]
};

export const FLOVAX_COUNTRY_RETRY = 'Please choose a country. 🙏\n\n';

// -------------------------------------------------------------
// FLOVAX India — same steps as Nepal, in English, ending with GST
// -------------------------------------------------------------
export const FLOVAX_INDIA_QUESTIONS: Record<string, QuestionStep> = {
  city: {
    type: 'text',
    text: 'Great! 👍\nWhich city are you from?\nPlease type your city name:',
    next: 'shop_status',
    options: []
  },
  shop_status: {
    type: 'list',
    text: 'Do you have your own shop?',
    next: 'experience',
    options: [
      { id: 'own_shop', title: 'Yes — Own Shop' },
      { id: 'planning_new_shop', title: 'No — Planning New Shop' }
    ]
  },
  experience: {
    type: 'list',
    text: 'How long has your shop or business been running?',
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
    text: 'What kind of business opportunity are you looking for with FLOVAX?',
    next: 'budget',
    options: [
      { id: 'retail_dealership', title: 'Retail Dealership' },
      { id: 'import_distribution', title: 'Import & Distribution' },
      { id: 'wholesale', title: 'Wholesale' },
      { id: 'product_purchase', title: 'Product Purchase' }
    ]
  },
  budget: {
    type: 'list',
    text: 'What is the approximate monthly turnover of your Sanitary / Bathroom Fittings business?',
    next: 'firm_name',
    options: [
      { id: 'budget_under_50k', title: 'Under ₹50,000' },
      { id: 'budget_50k_2l', title: '₹50,000–₹2 Lakh' },
      { id: 'budget_2l_5l', title: '₹2 Lakh–₹5 Lakh' },
      { id: 'budget_5l_plus', title: 'Above ₹5 Lakh' },
      { id: 'budget_new', title: 'New Business', description: 'Starting a new business' }
    ]
  },
  firm_name: {
    type: 'text',
    text: 'What is your firm / business name? 🏢\nPlease type your registered or trading name:',
    next: 'import_license',
    options: []
  },
  import_license: {
    type: 'list',
    text: 'Does your firm have an import license?',
    next: 'import_experience',
    options: [
      { id: 'license_yes', title: 'Yes — Available' },
      { id: 'license_no', title: 'No — No License' },
      { id: 'license_process', title: 'Applied — In Process' },
      { id: 'license_unsure', title: 'Not Sure' }
    ]
  },
  import_experience: {
    type: 'list',
    text: 'Have you imported products from another country before?',
    next: 'gst_status',
    options: [
      { id: 'imp_regular', title: 'Yes — Regularly' },
      { id: 'imp_sometimes', title: 'Yes — Sometimes' },
      { id: 'imp_first_time', title: 'No — First Time' }
    ]
  },
  gst_status: {
    type: 'list',
    text: 'Does your firm have GST registration?',
    next: 'handoff',
    options: GST_OPTIONS
  }
};

export const FLOVAX_INDIA_ORDER = [
  'city',
  'shop_status',
  'experience',
  'opportunity',
  'budget',
  'firm_name',
  'import_license',
  'import_experience',
  'gst_status'
];

export const FLOVAX_INDIA_THANK_YOU = 'Thank you! 🙏\nWe have received your details.\nOur FLOVAX team will contact you shortly.';
export const FLOVAX_INDIA_RETRY_PREFIX = 'Please choose one of the options below 🙏\n\n';

// India already names the country, so this option is distribution only,
// and the import-license question is skipped.
export function flovaxQuestionsForCountry(
  questions: Record<string, QuestionStep>,
  country: string
): Record<string, QuestionStep> {
  if (country !== 'india') return questions;
  const opportunity = questions.opportunity;
  const firmName = questions.firm_name;
  return {
    ...questions,
    ...(opportunity ? {
      opportunity: {
        ...opportunity,
        options: opportunity.options.map(option =>
          option.id === 'import_distribution'
            ? { id: option.id, title: option.title.includes('आयात') ? 'वितरण' : 'Distribution' }
            : option
        )
      }
    } : {}),
    ...(firmName && firmName.next === 'import_license'
      ? { firm_name: { ...firmName, next: 'import_experience' } }
      : {})
  };
}

// English copy of the Nepal FLOVAX form (same steps, NPR, ends with registration).
export const FLOVAX_NEPAL_EN_QUESTIONS: Record<string, QuestionStep> = {
  city: {
    type: 'list',
    text: 'Great! 👍\nWhich city or district of Nepal are you from?\nChoose from the list, or type your city.',
    next: 'shop_status',
    options: [
      { id: 'ktm', title: 'Kathmandu' },
      { id: 'lalitpur', title: 'Lalitpur' },
      { id: 'bhaktapur', title: 'Bhaktapur' },
      { id: 'pokhara', title: 'Pokhara' },
      { id: 'biratnagar', title: 'Biratnagar' },
      { id: 'birgunj', title: 'Birgunj' },
      { id: 'bharatpur', title: 'Bharatpur' },
      { id: 'butwal', title: 'Butwal' },
      { id: 'nepalgunj', title: 'Nepalgunj' },
      { id: 'other', title: 'Other', description: 'Type your city' }
    ]
  },
  shop_status: {
    type: 'list',
    text: 'Do you have your own shop?',
    next: 'experience',
    options: [
      { id: 'own_shop', title: 'Yes — Own Shop' },
      { id: 'planning_new_shop', title: 'No — Planning New Shop' }
    ]
  },
  experience: {
    type: 'list',
    text: 'How long has your shop or business been running?',
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
    text: 'What kind of business opportunity are you looking for with FLOVAX?',
    next: 'budget',
    options: [
      { id: 'retail_dealership', title: 'Retail Dealership' },
      { id: 'import_distribution', title: 'Import & Distribution' },
      { id: 'wholesale', title: 'Wholesale' },
      { id: 'product_purchase', title: 'Product Purchase' }
    ]
  },
  budget: {
    type: 'list',
    text: 'What is the approximate monthly turnover of your Sanitary / Bathroom Fittings business?',
    next: 'firm_name',
    options: [
      { id: 'budget_under_50k', title: 'Under NPR 50,000' },
      { id: 'budget_50k_2l', title: 'NPR 50,000–2 Lakh' },
      { id: 'budget_2l_5l', title: 'NPR 2–5 Lakh' },
      { id: 'budget_5l_plus', title: 'Above NPR 5 Lakh' },
      { id: 'budget_new', title: 'New Business' }
    ]
  },
  firm_name: {
    type: 'text',
    text: 'What is your firm / business name? 🏢\nPlease type your registered or trading name:',
    next: 'import_license',
    options: []
  },
  import_license: {
    type: 'list',
    text: 'Does your firm have an import license?',
    next: 'import_experience',
    options: [
      { id: 'license_yes', title: 'Yes — Available' },
      { id: 'license_no', title: 'No — No License' },
      { id: 'license_process', title: 'Applied — In Process' },
      { id: 'license_unsure', title: 'Not Sure' }
    ]
  },
  import_experience: {
    type: 'list',
    text: 'Have you imported products from India or another country before?',
    next: 'pan_registration',
    options: [
      { id: 'imp_regular', title: 'Yes — Regularly' },
      { id: 'imp_sometimes', title: 'Yes — Sometimes' },
      { id: 'imp_first_time', title: 'No — First Time' }
    ]
  },
  pan_registration: {
    type: 'list',
    text: 'Is your firm legally registered?',
    next: 'handoff',
    options: [
      { id: 'pan_registered', title: 'Yes — Registered' },
      { id: 'pan_not_registered', title: 'No — Not Registered' },
      { id: 'pan_in_process', title: 'Registration in Process' }
    ]
  }
};

export const FLOVAX_NEPAL_EN_ORDER = FLOVAX_ORDER;
export const FLOVAX_NEPAL_EN_THANK_YOU = FLOVAX_INDIA_THANK_YOU;
export const FLOVAX_NEPAL_EN_RETRY_PREFIX = FLOVAX_INDIA_RETRY_PREFIX;

// Nepali copy of the other-country FLOVAX form (typed city, ends with GST).
export const FLOVAX_OTHER_NE_QUESTIONS: Record<string, QuestionStep> = {
  city: {
    type: 'text',
    text: 'धेरै राम्रो! 👍\nतपाईं कुन शहरबाट हुनुहुन्छ?\nकृपया आफ्नो शहरको नाम लेख्नुहोस्:',
    next: 'shop_status',
    options: []
  },
  shop_status: {
    type: 'list',
    text: 'के तपाईंको आफ्नै पसल छ?',
    next: 'experience',
    options: [
      { id: 'own_shop', title: 'हो — आफ्नै पसल' },
      { id: 'planning_new_shop', title: 'होइन — नयाँ योजना' }
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
      { id: 'retail_dealership', title: 'रिटेल डिलरशिप' },
      { id: 'import_distribution', title: 'आयात तथा वितरण' },
      { id: 'wholesale', title: 'थोक बिक्री' },
      { id: 'product_purchase', title: 'उत्पादन खरिद' }
    ]
  },
  budget: {
    type: 'list',
    text: 'तपाईंको मासिक सेनेटरी / बाथ फिटिङ व्यवसायको लगभग कारोबार कति छ?',
    next: 'firm_name',
    options: [
      { id: 'budget_under_50k', title: '₹५० हजारभन्दा कम' },
      { id: 'budget_50k_2l', title: '₹५० हजार–२ लाख' },
      { id: 'budget_2l_5l', title: '₹२ लाख–५ लाख' },
      { id: 'budget_5l_plus', title: '₹५ लाखभन्दा बढी' },
      { id: 'budget_new', title: 'नयाँ व्यवसाय' }
    ]
  },
  firm_name: {
    type: 'text',
    text: 'तपाईंको फर्म / व्यवसायको नाम के हो? 🏢\nकृपया दर्ता भएको वा व्यवसायमा प्रयोग हुने नाम लेख्नुहोस्:',
    next: 'import_license',
    options: []
  },
  import_license: {
    type: 'list',
    text: 'के तपाईंको फर्मसँग आयात (Import) गर्ने लाइसेन्स छ?',
    next: 'import_experience',
    options: [
      { id: 'license_yes', title: 'छ — उपलब्ध छ' },
      { id: 'license_no', title: 'छैन — लाइसेन्स छैन' },
      { id: 'license_process', title: 'आवेदन दिएको छु' },
      { id: 'license_unsure', title: 'थाहा छैन' }
    ]
  },
  import_experience: {
    type: 'list',
    text: 'के तपाईंले पहिले अर्को देशबाट उत्पादन आयात गर्नुभएको छ?',
    next: 'gst_status',
    options: [
      { id: 'imp_regular', title: 'हो — नियमित रूपमा' },
      { id: 'imp_sometimes', title: 'हो — कहिलेकाहीँ' },
      { id: 'imp_first_time', title: 'होइन — पहिलो पटक' }
    ]
  },
  gst_status: {
    type: 'list',
    text: 'के तपाईंको फर्मसँग GST दर्ता छ?',
    next: 'handoff',
    options: [
      { id: 'gst_registered', title: 'हो — GST दर्ता छ' },
      { id: 'gst_not_registered', title: 'होइन — दर्ता छैन' },
      { id: 'gst_in_process', title: 'आवेदन प्रक्रियामा' },
      { id: 'gst_not_applicable', title: 'लागू हुँदैन' }
    ]
  }
};

export const FLOVAX_OTHER_NE_ORDER = FLOVAX_INDIA_ORDER;
export const FLOVAX_OTHER_NE_THANK_YOU = FLOVAX_THANK_YOU;
export const FLOVAX_OTHER_NE_RETRY_PREFIX = FLOVAX_RETRY_PREFIX;

// -------------------------------------------------------------
// CLAREN (India Dealership Form — 7 Questions in Hindi/Hinglish)
// -------------------------------------------------------------
export const CLAREN_QUESTIONS: Record<string, QuestionStep> = {
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
    text: 'आप CLAREN में किस तरह की business opportunity देख रहे हैं?',
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
    options: GST_OPTIONS
  }
};

export const CLAREN_ORDER = [
  'city',
  'shop_status',
  'experience',
  'opportunity',
  'budget',
  'firm_name',
  'gst_status'
];

export const CLAREN_THANK_YOU = 'धन्यवाद! 🙏\nआपकी जानकारी हमें मिल गई है।\nहमारी CLAREN team आपसे जल्द ही संपर्क करेगी।';
export const CLAREN_RETRY_PREFIX = 'कृपया नीचे दिए गए विकल्पों में से एक चुनें 🙏\n\n';

// -------------------------------------------------------------
// Opening: greet and ask the country.
// Nepal goes straight to FLOVAX. Every other country asks for FLOVAX or CLAREN.
// A message that names CLAREN stays in English after the country.
// -------------------------------------------------------------
export const WELCOME_PREFIX = 'नमस्ते! 🙏\nCLAREN र FLOVAX मा स्वागत छ।\nWelcome to CLAREN & FLOVAX.\n\n';

const COUNTRY_LABELS: Record<string, string> = {
  india: 'India',
  nepal: 'Nepal',
  bangladesh: 'Bangladesh',
  bhutan: 'Bhutan',
  sri_lanka: 'Sri Lanka',
  south_africa: 'South Africa'
};

export const OPENING_COUNTRIES: QuestionOption[] = [
  { id: 'country_india', title: 'India' },
  { id: 'country_nepal', title: 'Nepal' },
  { id: 'country_bangladesh', title: 'Bangladesh' },
  { id: 'country_bhutan', title: 'Bhutan' },
  { id: 'country_sri_lanka', title: 'Sri Lanka' },
  { id: 'country_south_africa', title: 'South Africa' }
];

export const COUNTRY_CHOOSER: QuestionStep = {
  type: 'list',
  text: 'नमस्ते! 🙏\nCLAREN र FLOVAX मा स्वागत छ।\nकृपया आफ्नो देश छान्नुहोस्।\n\nWelcome to CLAREN & FLOVAX.\nPlease choose your country:',
  next: 'brand',
  options: OPENING_COUNTRIES
};

export const COUNTRY_RETRY = 'कृपया तलको देशमध्ये एक छान्नुहोस्।\nPlease choose one of these countries. 🙏\n\n';

export function brandChooserForCountry(country: string): QuestionStep {
  const label = COUNTRY_LABELS[country] || country;
  const nepal = country === 'nepal';
  return {
    type: 'list',
    text: `धन्यवाद! 🙏\nतपाईंले ${label} छान्नुभयो।\nकृपया ब्रान्ड छान्नुहोस्:\n\nThank you!\nYou selected ${label}.\nPlease choose a brand:`,
    next: 'language',
    options: nepal
      ? [{ id: 'brand_flovax', title: 'FLOVAX', description: 'Nepal Dealership' }]
      : [
          { id: 'brand_flovax', title: 'FLOVAX', description: 'Dealership' },
          { id: 'brand_claren', title: 'CLAREN', description: 'Dealership' }
        ]
  };
}

export const BRAND_RETRY_NEPAL_OPENING = 'कृपया FLOVAX छान्नुहोस्।\nPlease choose FLOVAX. 🙏\n\n';
export const BRAND_RETRY_OTHER_OPENING = 'कृपया FLOVAX वा CLAREN छान्नुहोस्।\nPlease choose FLOVAX or CLAREN. 🙏\n\n';

export const LANGUAGE_CHOOSER: QuestionStep = {
  type: 'list',
  text: 'धन्यवाद! 🙏\nकृपया आफ्नो भाषा छान्नुहोस्।\n\nThank you!\nPlease choose your language:',
  next: 'city',
  options: [
    { id: 'lang_ne', title: 'नेपाली', description: 'Nepali' },
    { id: 'lang_en', title: 'English' }
  ]
};

export const LANGUAGE_RETRY = 'कृपया नेपाली वा English छान्नुहोस्।\nPlease choose Nepali or English. 🙏\n\n';

export const REGION_CHOOSER_EN: QuestionStep = {
  type: 'list',
  text: 'Thank you! 🙏\nWhich option applies to you?',
  next: 'brand',
  options: [
    { id: 'region_nepal', title: 'Nepal', description: 'FLOVAX only' },
    { id: 'region_other', title: 'Other countries', description: 'India, Bangladesh, Bhutan, Sri Lanka, South Africa' }
  ]
};

export const REGION_CHOOSER_NE: QuestionStep = {
  type: 'list',
  text: 'धन्यवाद! 🙏\nतपाईं कुन विकल्प चाहनुहुन्छ?',
  next: 'brand',
  options: [
    { id: 'region_nepal', title: 'नेपाल', description: 'FLOVAX मात्र' },
    { id: 'region_other', title: 'अन्य देश', description: 'India, Bangladesh, Bhutan, Sri Lanka, South Africa' }
  ]
};

export const REGION_RETRY_EN = 'Please choose Nepal or Other countries. 🙏\n\n';
export const REGION_RETRY_NE = 'कृपया नेपाल वा अन्य देश छान्नुहोस्। 🙏\n\n';

export const BRAND_CHOOSER_NE: QuestionStep = {
  type: 'list',
  text: 'धन्यवाद! 🙏\nतपाईंले नेपाली छान्नुभयो।\nकृपया ब्रान्ड छान्नुहोस्:',
  next: 'city',
  options: [
    { id: 'brand_flovax', title: 'FLOVAX', description: 'नेपाल डिलरशिप' }
  ]
};

export const BRAND_RETRY_NE = 'कृपया FLOVAX छान्नुहोस्। 🙏\n\n';

export const BRAND_NEPAL_EN: QuestionStep = {
  type: 'list',
  text: 'Thank you! 🙏\nThis is the Nepal flow.\nPlease choose a brand:',
  next: 'city',
  options: [
    { id: 'brand_flovax', title: 'FLOVAX', description: 'Nepal Dealership' }
  ]
};

export const BRAND_OTHER_NE: QuestionStep = {
  type: 'list',
  text: 'धन्यवाद! 🙏\nकृपया ब्रान्ड छान्नुहोस्:',
  next: 'city',
  options: [
    { id: 'brand_flovax', title: 'FLOVAX'},
    { id: 'brand_claren', title: 'CLAREN'}
  ]
};

export const BRAND_RETRY_OTHER_NE = 'कृपया FLOVAX वा CLAREN छान्नुहोस्। 🙏\n\n';

export const BRAND_CHOOSER_EN: QuestionStep = {
  type: 'list',
  text: 'Thank you! 🙏\nYou selected English.\nPlease choose a brand:',
  next: 'city',
  options: [
    { id: 'brand_flovax', title: 'FLOVAX', description: 'Dealership' },
    { id: 'brand_claren', title: 'CLAREN', description: 'Dealership' }
  ]
};

export const BRAND_RETRY_EN = 'Please choose FLOVAX or CLAREN. 🙏\n\n';

export const CLAREN_COUNTRIES: QuestionOption[] = [
  { id: 'country_india', title: 'India' },
  { id: 'country_bangladesh', title: 'Bangladesh' },
  { id: 'country_bhutan', title: 'Bhutan' },
  { id: 'country_sri_lanka', title: 'Sri Lanka' },
  { id: 'country_south_africa', title: 'South Africa' }
];

export const CLAREN_COUNTRY_EN: QuestionStep = {
  type: 'list',
  text: 'Great! 👍\nWhich country are you from?',
  next: 'city',
  options: CLAREN_COUNTRIES
};

export const CLAREN_COUNTRY_NE: QuestionStep = {
  type: 'list',
  text: 'धेरै राम्रो! 👍\nतपाईं कुन देशबाट हुनुहुन्छ?',
  next: 'city',
  options: CLAREN_COUNTRIES
};

export const CLAREN_COUNTRY_RETRY_EN = 'Please choose one of these countries. 🙏\n\n';
export const CLAREN_COUNTRY_RETRY_NE = 'कृपया तलको देशमध्ये एक छान्नुहोस्। 🙏\n\n';

const CLAREN_CITY_OPTIONS_EN: QuestionOption[] = [
  { id: 'lucknow', title: 'Lucknow' },
  { id: 'kanpur', title: 'Kanpur' },
  { id: 'varanasi', title: 'Varanasi' },
  { id: 'agra', title: 'Agra' },
  { id: 'prayagraj', title: 'Prayagraj' },
  { id: 'gorakhpur', title: 'Gorakhpur' },
  { id: 'meerut', title: 'Meerut' },
  { id: 'noida_ghaziabad', title: 'Noida/Ghaziabad' },
  { id: 'other_city', title: 'Other' }
];

const CLAREN_CITY_OPTIONS_NE: QuestionOption[] = CLAREN_CITY_OPTIONS_EN.map(option =>
  option.id === 'other_city' ? { ...option, title: 'अन्य', description: 'Other' } : option
);

const CLAREN_GST_NE: QuestionOption[] = [
  { id: 'gst_registered', title: 'हो — GST दर्ता छ' },
  { id: 'gst_not_registered', title: 'होइन — दर्ता छैन' },
  { id: 'gst_in_process', title: 'आवेदन प्रक्रियामा' },
  { id: 'gst_not_applicable', title: 'लागू हुँदैन' }
];

export const CLAREN_CITY_TEXT_EN: QuestionStep = {
  type: 'text',
  text: 'Great! 👍\nWhich city are you from?\nPlease type your city name:',
  next: 'shop_status',
  options: []
};

export const CLAREN_CITY_TEXT_NE: QuestionStep = {
  type: 'text',
  text: 'धेरै राम्रो! 👍\nतपाईं कुन शहरबाट हुनुहुन्छ?\nकृपया आफ्नो शहरको नाम लेख्नुहोस्:',
  next: 'shop_status',
  options: []
};

export const CLAREN_EN_QUESTIONS: Record<string, QuestionStep> = {
  city: {
    type: 'list',
    text: 'Great! 👍\nWhich city are you from?',
    next: 'shop_status',
    options: CLAREN_CITY_OPTIONS_EN
  },
  shop_status: {
    type: 'list',
    text: 'Do you have your own shop?',
    next: 'experience',
    options: [
      { id: 'own_shop', title: 'Yes — Own Shop' },
      { id: 'planning_new_shop', title: 'No — Planning New Shop' },
      { id: 'wholesale_distributor', title: 'Wholesale / Distributor' }
    ]
  },
  experience: {
    type: 'list',
    text: 'How long has your shop or business been running?',
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
    text: 'What kind of business opportunity are you looking for with CLAREN?',
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
    text: 'What is the approximate monthly turnover of your sanitary / bath fittings business?',
    next: 'firm_name',
    options: [
      { id: 'budget_below_50k', title: '₹50K or less' },
      { id: 'budget_50k_2l', title: '₹50K–₹2L' },
      { id: 'budget_2l_5l', title: '₹2L–₹5L' },
      { id: 'budget_5l_plus', title: '₹5L+' },
      { id: 'budget_new', title: 'Starting a new business' }
    ]
  },
  firm_name: {
    type: 'text',
    text: 'What is your firm / business name? 🏢\nPlease type your registered or trading name:',
    next: 'gst_status',
    options: []
  },
  gst_status: {
    type: 'list',
    text: 'Does your firm have GST registration?',
    next: 'handoff',
    options: GST_OPTIONS
  }
};

export const CLAREN_NE_QUESTIONS: Record<string, QuestionStep> = {
  city: {
    type: 'list',
    text: 'धेरै राम्रो! 👍\nतपाईं कुन शहरबाट हुनुहुन्छ?',
    next: 'shop_status',
    options: CLAREN_CITY_OPTIONS_NE
  },
  shop_status: {
    type: 'list',
    text: 'के तपाईंको आफ्नै पसल छ?',
    next: 'experience',
    options: [
      { id: 'own_shop', title: 'हो — आफ्नै पसल' },
      { id: 'planning_new_shop', title: 'होइन — नयाँ योजना' },
      { id: 'wholesale_distributor', title: 'थोक / वितरक' }
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
    text: 'तपाईं CLAREN मा कस्तो व्यवसायिक अवसर खोज्दै हुनुहुन्छ?',
    next: 'budget',
    options: [
      { id: 'retail_dealership', title: 'रिटेल डिलरशिप' },
      { id: 'distributor', title: 'वितरक' },
      { id: 'wholesale', title: 'थोक बिक्री' },
      { id: 'product_purchase', title: 'उत्पादन खरिद' }
    ]
  },
  budget: {
    type: 'list',
    text: 'तपाईंको मासिक सेनेटरी / बाथ फिटिङ व्यवसायको लगभग कारोबार कति छ?',
    next: 'firm_name',
    options: [
      { id: 'budget_below_50k', title: '₹५० हजार वा कम' },
      { id: 'budget_50k_2l', title: '₹५० हजार–२ लाख' },
      { id: 'budget_2l_5l', title: '₹२ लाख–५ लाख' },
      { id: 'budget_5l_plus', title: '₹५ लाखभन्दा बढी' },
      { id: 'budget_new', title: 'नयाँ व्यवसाय' }
    ]
  },
  firm_name: {
    type: 'text',
    text: 'तपाईंको फर्म / व्यवसायको नाम के हो? 🏢\nकृपया दर्ता भएको वा व्यवसायमा प्रयोग हुने नाम लेख्नुहोस्:',
    next: 'gst_status',
    options: []
  },
  gst_status: {
    type: 'list',
    text: 'के तपाईंको फर्मसँग GST दर्ता छ?',
    next: 'handoff',
    options: CLAREN_GST_NE
  }
};

export const CLAREN_THANK_YOU_EN = 'Thank you! 🙏\nWe have received your details.\nOur CLAREN team will contact you shortly.';
export const CLAREN_THANK_YOU_NE = 'धन्यवाद! 🙏\nतपाईंको विवरण हामीलाई प्राप्त भयो।\nहाम्रो CLAREN टिमले तपाईंलाई छिट्टै सम्पर्क गर्नेछ।';
export const CLAREN_RETRY_EN = 'Please choose one of the options below 🙏\n\n';
export const CLAREN_RETRY_NE = 'कृपया तल दिइएका विकल्पहरू मध्ये एक छनौट गर्नुहोस् 🙏\n\n';

export const RESTART_WORDS = new Set(['restart', 'restart survey', 'start over', 'सुरु गर', 'शुरू करो', 'रिसर्च']);

// Fallback references
export const QUESTIONS = CLAREN_QUESTIONS;
export const ORDER = CLAREN_ORDER;
export const THANK_YOU_REPLY = CLAREN_THANK_YOU;
export const RETRY_PREFIX = CLAREN_RETRY_PREFIX;
