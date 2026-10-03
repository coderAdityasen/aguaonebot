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

  // 1. Terminal Check: If already qualified, in handoff, or bot paused -> Keep silent
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

  // 2. Restart Command Handling
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

    if (lower.includes('flovax')) {
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
    } else if (lower.includes('aguaone')) {
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

  // 3. Brand Detection Logic
  // Check if message mentions brand or if user clicked brand chooser
  const mentionsFlovax = lower.includes('flovax') || selOpt === 'brand_flovax';
  const mentionsAguaone = lower.includes('aguaone') || selOpt === 'brand_aguaone';

  if (!updated.brand) {
    if (mentionsFlovax && !mentionsAguaone) {
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
    } else if (mentionsAguaone && !mentionsFlovax) {
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
      // Neither brand mentioned, or both mentioned: present brand selection
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
    if (mentionsFlovax) {
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
    } else if (mentionsAguaone) {
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

  // Fallback: Match by title, description, or fuzzy match
  if (!matched) {
    const candidate = (selTitle || rawText).toLowerCase().trim();
    if (candidate) {
      matched = q.options.find(o => o.title.toLowerCase() === candidate)
        || q.options.find(o => o.description && o.description.toLowerCase() === candidate)
        || q.options.find(o =>
            candidate.includes(o.title.toLowerCase()) ||
            o.title.toLowerCase().includes(candidate)
          )
        || null;
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
  const nextKey = q.next;
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
