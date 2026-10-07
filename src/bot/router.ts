import { ContactSession } from '../memory/session-cache';
import { 
  BRAND_CHOOSER,
  FLOVAX_QUESTIONS,
  FLOVAX_ORDER,
  FLOVAX_THANK_YOU,
  FLOVAX_RETRY_PREFIX,
  AGUAONE_QUESTIONS,
  AGUAONE_ORDER,
  AGUAONE_THANK_YOU,
  AGUAONE_RETRY_PREFIX,
  RESTART_WORDS,
  QuestionOption 
} from './questions';

export interface RouteResult {
  shouldReply: boolean;
  replyType: 'list' | 'text' | 'none';
  replyText: string;
  options: QuestionOption[];
  action: string;
  updatedSession: ContactSession;
}

export function routeConversation(
  session: ContactSession,
  incomingText: string,
  selectedOption: string = '',
  selectedTitle: string = ''
): RouteResult {
  const rawText = (incomingText || '').trim();
  const lower = rawText.toLowerCase();
  const selOpt = (selectedOption || '').trim();
  const selTitle = (selectedTitle || '').trim();

  // Clone session to avoid side-effects before completing transition
  const updated: ContactSession = { ...session };
  updated.last_message = rawText || selTitle;

  // 1. Restart Command Handling (Checked FIRST so customer can restart at any point)
  if (RESTART_WORDS.has(lower) || lower === 'restart' || lower.startsWith('restart ')) {
    updated.city = '';
    updated.category = '';
    updated.shop_status = '';
    updated.experience = '';
    updated.opportunity = '';
    updated.budget = '';
    updated.firm_name = '';
    updated.import_license = '';
    updated.import_experience = '';
    updated.pan_registration = '';
    updated.gst_status = '';
    updated.qualified = 0;
    updated.lead_status = 'IN_PROGRESS';
    updated.bot_active = 1;

    if (lower.includes('flovax') || lower.includes('nepal') || lower.includes('नेपाल')) {
      updated.brand = 'flovax';
      updated.state = 'city';
      const q = FLOVAX_QUESTIONS.city;
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: q.text,
        options: [...q.options],
        action: 'RESTART_FLOVAX',
        updatedSession: updated
      };
    } else if (lower.includes('aguaone') || lower.includes('india') || lower.includes('भारत')) {
      updated.brand = 'aguaone';
      updated.state = 'city';
      const q = AGUAONE_QUESTIONS.city;
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: q.text,
        options: [...q.options],
        action: 'RESTART_AGUAONE',
        updatedSession: updated
      };
    } else if (updated.brand === 'flovax') {
      updated.state = 'city';
      const q = FLOVAX_QUESTIONS.city;
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: q.text,
        options: [...q.options],
        action: 'RESTART_FLOVAX',
        updatedSession: updated
      };
    } else if (updated.brand === 'aguaone') {
      updated.state = 'city';
      const q = AGUAONE_QUESTIONS.city;
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: q.text,
        options: [...q.options],
        action: 'RESTART_AGUAONE',
        updatedSession: updated
      };
    } else {
      updated.brand = '';
      updated.state = 'brand_select';
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: BRAND_CHOOSER.text,
        options: [...BRAND_CHOOSER.options],
        action: 'RESTART_BRAND_CHOOSER',
        updatedSession: updated
      };
    }
  }

  // 2. Terminal Check: If already qualified, in handoff, or bot paused -> Keep silent
  if (
    updated.state === 'handoff' || 
    updated.lead_status === 'HANDOFF' || 
    updated.qualified === 1 || 
    updated.bot_active === 0
  ) {
    updated.state = 'handoff';
    updated.qualified = 1;
    updated.lead_status = 'HANDOFF';
    return {
      shouldReply: false,
      replyType: 'none',
      replyText: '',
      options: [],
      action: 'HUMAN_HANDOFF_NO_REPLY',
      updatedSession: updated
    };
  }

  // 3. Brand Detection Logic & Synonyms (Supports 1/2, Nepal/India, Flovax/Aguaone)
  const isFlovaxIntent = 
    lower.includes('flovax') || 
    lower.includes('nepal') || 
    lower.includes('नेपाल') || 
    selOpt === 'brand_flovax' || 
    (updated.state === 'brand_select' && (lower === '1' || selTitle.includes('FLOVAX')));

  const isAguaoneIntent = 
    lower.includes('aguaone') || 
    lower.includes('india') || 
    lower.includes('भारत') || 
    selOpt === 'brand_aguaone' || 
    (updated.state === 'brand_select' && (lower === '2' || selTitle.includes('AGUAONE')));

  if (!updated.brand) {
    if (isFlovaxIntent && !isAguaoneIntent) {
      updated.brand = 'flovax';
      updated.state = 'city';
      const q = FLOVAX_QUESTIONS.city;
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: q.text,
        options: [...q.options],
        action: 'START_FLOVAX',
        updatedSession: updated
      };
    } else if (isAguaoneIntent && !isFlovaxIntent) {
      updated.brand = 'aguaone';
      updated.state = 'city';
      const q = AGUAONE_QUESTIONS.city;
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: q.text,
        options: [...q.options],
        action: 'START_AGUAONE',
        updatedSession: updated
      };
    } else {
      // Prompt user to select brand
      updated.state = 'brand_select';
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: BRAND_CHOOSER.text,
        options: [...BRAND_CHOOSER.options],
        action: 'PROMPT_BRAND_CHOOSER',
        updatedSession: updated
      };
    }
  }

  // 4. Handle Brand Selection State
  if (updated.state === 'brand_select') {
    if (isFlovaxIntent) {
      updated.brand = 'flovax';
      updated.state = 'city';
      const q = FLOVAX_QUESTIONS.city;
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: q.text,
        options: [...q.options],
        action: 'START_FLOVAX',
        updatedSession: updated
      };
    } else if (isAguaoneIntent) {
      updated.brand = 'aguaone';
      updated.state = 'city';
      const q = AGUAONE_QUESTIONS.city;
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: q.text,
        options: [...q.options],
        action: 'START_AGUAONE',
        updatedSession: updated
      };
    } else {
      return {
        shouldReply: true,
        replyType: 'list',
        replyText: BRAND_CHOOSER.text,
        options: [...BRAND_CHOOSER.options],
        action: 'RETRY_BRAND_CHOOSER',
        updatedSession: updated
      };
    }
  }

  // 5. Active Survey Routing by Brand
  const isFlovax = updated.brand === 'flovax';
  const questions = isFlovax ? FLOVAX_QUESTIONS : AGUAONE_QUESTIONS;
  const order = isFlovax ? FLOVAX_ORDER : AGUAONE_ORDER;
  const thankYouText = isFlovax ? FLOVAX_THANK_YOU : AGUAONE_THANK_YOU;
  const retryPrefix = isFlovax ? FLOVAX_RETRY_PREFIX : AGUAONE_RETRY_PREFIX;
  const terminalQuestion = isFlovax ? 'pan_registration' : 'gst_status';

  let currentState = updated.state || 'new';
  if (currentState === 'new' || !order.includes(currentState)) {
    updated.state = 'city';
    const q = questions.city;
    return {
      shouldReply: true,
      replyType: 'list',
      replyText: q.text,
      options: [...q.options],
      action: 'START_' + updated.brand.toUpperCase(),
      updatedSession: updated
    };
  }

  const q = questions[currentState];

  // ----------------------------------------------------------------------
  // Case A: Free-form Text Question (e.g. firm_name)
  // ----------------------------------------------------------------------
  if (q.type === 'text') {
    const enteredText = (rawText || selTitle).trim();
    if (enteredText.length < 2) {
      const promptText = isFlovax
        ? 'तपाईंको फर्म / व्यवसायको नाम के हो? 🏢\nकृपया आफ्नो दर्ता भएको वा व्यवसायमा प्रयोग हुने फर्मको नाम लेख्नुहोस्:'
        : 'आपकी Firm / Business का नाम क्या है? 🏢\nकृपया अपनी पंजीकृत (registered) या व्यावसायिक फ़र्म का नाम लिखें:';

      return {
        shouldReply: true,
        replyType: 'text',
        replyText: promptText,
        options: [],
        action: 'INVALID_FIRM_NAME_RETRY',
        updatedSession: updated
      };
    }

    // Save free-text firm name
    (updated as any)[currentState] = enteredText;

    // Check if this text question was the terminal question (it's not, but safe check)
    if (currentState === terminalQuestion) {
      updated.qualified = 1;
      updated.lead_status = 'HANDOFF';
      updated.state = 'handoff';
      updated.bot_active = 0;

      return {
        shouldReply: true,
        replyType: 'text',
        replyText: thankYouText,
        options: [],
        action: 'QUALIFIED_HANDOFF',
        updatedSession: updated
      };
    }

    // Advance to next question
    const nextKey = q.next;
    updated.state = nextKey;
    const nextQ = questions[nextKey];

    return {
      shouldReply: true,
      replyType: nextQ.type === 'text' ? 'text' : 'list',
      replyText: nextQ.text,
      options: nextQ.options ? [...nextQ.options] : [],
      action: 'ANSWER_ACCEPTED_TEXT',
      updatedSession: updated
    };
  }

  // ----------------------------------------------------------------------
  // Case B: Interactive List Question
  // ----------------------------------------------------------------------
  let matched: QuestionOption | null = null;

  // Primary: Match by interactive Option ID
  if (selOpt) {
    matched = q.options.find(o => o.id === selOpt) || null;
  }

  // Fallback: Match by numeric index (1, 2, 3), exact title, description, or length-guarded substring
  if (!matched) {
    const candidate = (selTitle || rawText).toLowerCase().trim();
    if (candidate) {
      // 1. Numeric index match (e.g. user sends "1", "2", "3")
      const numMatch = candidate.match(/^(\d+)$/);
      if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        if (idx >= 0 && idx < q.options.length) {
          matched = q.options[idx];
        }
      }

      // 2. Exact match on title or description
      if (!matched) {
        matched = q.options.find(o => o.title.toLowerCase() === candidate)
          || q.options.find(o => o.description && o.description.toLowerCase() === candidate)
          || null;
      }

      // 3. Substring match ONLY if input has at least 3 characters (avoids single-letter false matches)
      if (!matched && candidate.length >= 3) {
        matched = q.options.find(o => candidate.includes(o.title.toLowerCase()))
          || q.options.find(o => o.title.toLowerCase().includes(candidate))
          || q.options.find(o => o.description && (candidate.includes(o.description.toLowerCase()) || o.description.toLowerCase().includes(candidate)))
          || null;
      }

      // 4. Import license short answer keywords (Yes/No, छ/छैन, ho/hoina)
      if (!matched && currentState === 'import_license') {
        const c = candidate.trim();
        if (['छ', 'हो', 'yes', 'ha', 'haa', 'cha', 'available', 'y'].includes(c)) {
          matched = q.options.find(o => o.id === 'license_yes') || q.options[0];
        } else if (['छैन', 'होइन', 'no', 'na', 'chaina', 'not', 'n'].includes(c)) {
          matched = q.options.find(o => o.id === 'license_no') || q.options[1];
        }
      }
    }
  }

  // ----------------------------------------------------------------------
  // SPECIAL CASE: City Question (Flovax & Aguaone)
  // Accept user's typed city name directly if they didn't select from list
  // ----------------------------------------------------------------------
  if (!matched && currentState === 'city') {
    const rawCity = (rawText || selTitle).trim();
    // Accept any realistic city name (at least 2 letters, not pure numbers, not restart command)
    if (rawCity.length >= 2 && !/^\d+$/.test(rawCity) && !RESTART_WORDS.has(rawCity.toLowerCase())) {
      matched = {
        id: 'custom_city',
        title: rawCity
      };
    }
  }

  // Invalid choice: prompt to choose an option
  if (!matched) {
    return {
      shouldReply: true,
      replyType: 'list',
      replyText: retryPrefix + q.text,
      options: [...q.options],
      action: 'INVALID_RETRY',
      updatedSession: updated
    };
  }

  // Save selected option title
  (updated as any)[currentState] = matched.title;
  if (currentState === 'city') {
    updated.city = matched.title;
  }

  // Check if terminal question reached
  if (currentState === terminalQuestion) {
    updated.qualified = 1;
    updated.lead_status = 'HANDOFF';
    updated.state = 'handoff';
    updated.bot_active = 0; // Handoff to human agent

    return {
      shouldReply: true,
      replyType: 'text',
      replyText: thankYouText,
      options: [],
      action: 'QUALIFIED_HANDOFF',
      updatedSession: updated
    };
  }

  // Advance to next question
  let nextKey = q.next;

  // Flovax Import License Branching:
  // Show 'import_experience' ONLY when user selects 'Yes' (license_yes).
  // Otherwise, skip 'import_experience' and proceed directly to 'pan_registration'.
  if (currentState === 'import_license') {
    const isLicenseYes = matched.id === 'license_yes';

    if (isLicenseYes) {
      nextKey = 'import_experience';
    } else {
      // User does not have an import license: skip experience and jump to pan registration
      nextKey = 'pan_registration';
      updated.import_experience = 'N/A — No Import License';
    }
  }

  updated.state = nextKey;
  const nextQ = questions[nextKey];

  return {
    shouldReply: true,
    replyType: nextQ.type === 'text' ? 'text' : 'list',
    replyText: nextQ.text,
    options: nextQ.options ? [...nextQ.options] : [],
    action: 'ANSWER_ACCEPTED',
    updatedSession: updated
  };
}
