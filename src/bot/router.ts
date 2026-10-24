import { ContactSession } from '../memory/session-cache';
import {
  BRAND_CHOOSER,
  FLOVAX_COUNTRY,
  FLOVAX_COUNTRY_RETRY,
  FLOVAX_QUESTIONS,
  FLOVAX_ORDER,
  FLOVAX_THANK_YOU,
  FLOVAX_RETRY_PREFIX,
  FLOVAX_INDIA_QUESTIONS,
  FLOVAX_INDIA_ORDER,
  FLOVAX_INDIA_THANK_YOU,
  FLOVAX_INDIA_RETRY_PREFIX,
  CLAREN_QUESTIONS,
  CLAREN_ORDER,
  CLAREN_THANK_YOU,
  CLAREN_RETRY_PREFIX,
  RESTART_WORDS,
  QuestionOption,
  QuestionStep
} from './questions';

export interface RouteResult {
  shouldReply: boolean;
  replyType: 'list' | 'text' | 'none';
  replyText: string;
  options: QuestionOption[];
  action: string;
  updatedSession: ContactSession;
}

function ask(action: string, step: QuestionStep, updated: ContactSession): RouteResult {
  const isText = step.type === 'text' || step.options.length === 0;
  return {
    shouldReply: true,
    replyType: isText ? 'text' : 'list',
    replyText: step.text,
    options: [...step.options],
    action,
    updatedSession: updated
  };
}

function clearAnswers(updated: ContactSession) {
  updated.country = '';
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
}

function startCountry(updated: ContactSession, action: string): RouteResult {
  updated.brand = 'flovax';
  updated.country = '';
  updated.state = 'country_select';
  return ask(action, FLOVAX_COUNTRY, updated);
}

function startFlovaxNepal(updated: ContactSession, action: string): RouteResult {
  updated.brand = 'flovax';
  updated.country = 'nepal';
  updated.state = 'city';
  return ask(action, FLOVAX_QUESTIONS.city, updated);
}

function startFlovaxIndia(updated: ContactSession, action: string): RouteResult {
  updated.brand = 'flovax';
  updated.country = 'india';
  updated.state = 'city';
  return ask(action, FLOVAX_INDIA_QUESTIONS.city, updated);
}

function startClaren(updated: ContactSession, action: string): RouteResult {
  updated.brand = 'claren';
  updated.country = '';
  updated.state = 'city';
  return ask(action, CLAREN_QUESTIONS.city, updated);
}

function detectMentions(lower: string, selOpt: string, selTitle: string, state: string) {
  const title = selTitle.toLowerCase();
  const flovax = lower.includes('flovax')
    || selOpt === 'brand_flovax'
    || title.includes('flovax')
    || (state === 'brand_select' && lower === '1');
  const claren = lower.includes('claren')
    || lower.includes('aguaone')
    || selOpt === 'brand_claren'
    || selOpt === 'brand_aguaone'
    || title.includes('claren')
    || title.includes('aguaone')
    || (state === 'brand_select' && lower === '2');
  const india = selOpt === 'country_india'
    || lower.includes('india')
    || lower.includes('भारत')
    || title.includes('india')
    || title.includes('भारत');
  const nepal = selOpt === 'country_nepal'
    || lower.includes('nepal')
    || lower.includes('नेपाल')
    || title.includes('nepal')
    || title.includes('नेपाल');
  return { flovax, claren, india, nepal };
}

// "India" starts CLAREN only when FLOVAX was not chosen.
// After FLOVAX, India and Nepal only pick the country.
function beginFromIntent(
  updated: ContactSession,
  mentions: { flovax: boolean; claren: boolean; india: boolean; nepal: boolean },
  wasFlovax: boolean,
  wasClaren: boolean,
  prefix: 'START' | 'RESTART'
): RouteResult {
  const { flovax, claren, india, nepal } = mentions;

  if (claren && !flovax) {
    return startClaren(updated, `${prefix}_CLAREN`);
  }
  if (flovax && india && !claren) {
    return startFlovaxIndia(updated, `${prefix}_FLOVAX_INDIA`);
  }
  if ((flovax && nepal && !claren) || (!flovax && !claren && !wasFlovax && nepal && !india)) {
    return startFlovaxNepal(updated, `${prefix}_FLOVAX_NEPAL`);
  }
  if (flovax && !claren) {
    return startCountry(updated, `${prefix}_FLOVAX_COUNTRY`);
  }
  if (wasFlovax && india && !claren) {
    return startFlovaxIndia(updated, `${prefix}_FLOVAX_INDIA`);
  }
  if (wasFlovax && nepal && !claren) {
    return startFlovaxNepal(updated, `${prefix}_FLOVAX_NEPAL`);
  }
  if (wasFlovax) {
    return startCountry(updated, `${prefix}_FLOVAX_COUNTRY`);
  }
  if (india && !nepal) {
    return startClaren(updated, `${prefix}_CLAREN`);
  }
  if (nepal && !india) {
    return startFlovaxNepal(updated, `${prefix}_FLOVAX_NEPAL`);
  }
  if (wasClaren) {
    return startClaren(updated, `${prefix}_CLAREN`);
  }

  updated.brand = '';
  updated.country = '';
  updated.state = 'brand_select';
  return ask(`${prefix}_BRAND_CHOOSER`, BRAND_CHOOSER, updated);
}

function matchCountry(lower: string, selOpt: string, selTitle: string): 'india' | 'nepal' | null {
  const title = selTitle.toLowerCase();
  const india = selOpt === 'country_india'
    || lower === '1'
    || lower.includes('india')
    || lower.includes('भारत')
    || title.includes('india')
    || title.includes('भारत');
  const nepal = selOpt === 'country_nepal'
    || lower === '2'
    || lower.includes('nepal')
    || lower.includes('नेपाल')
    || title.includes('nepal')
    || title.includes('नेपाल');
  if (india === nepal) return null;
  return india ? 'india' : 'nepal';
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

  const updated: ContactSession = { ...session };
  updated.last_message = rawText || selTitle;

  const mentions = detectMentions(lower, selOpt, selTitle, updated.state);
  const wasFlovax = updated.brand === 'flovax';
  const wasClaren = updated.brand === 'claren' || updated.brand === 'aguaone';

  // 1. Restart is checked first so the customer can restart at any point.
  if (RESTART_WORDS.has(lower) || lower === 'restart' || lower.startsWith('restart ')) {
    clearAnswers(updated);
    return beginFromIntent(updated, mentions, wasFlovax, wasClaren, 'RESTART');
  }

  // 2. Terminal check: qualified, handed off, or bot paused -> stay silent.
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

  // 3. No brand yet, or still on the brand list.
  if (!updated.brand || updated.state === 'brand_select') {
    return beginFromIntent(updated, mentions, false, false, 'START');
  }

  if (updated.brand === 'aguaone') {
    updated.brand = 'claren';
  }

  // 4. FLOVAX country step. "India" here stays on FLOVAX.
  if (updated.brand === 'flovax' && updated.state === 'country_select') {
    const picked = matchCountry(lower, selOpt, selTitle);
    if (picked === 'india') return startFlovaxIndia(updated, 'START_FLOVAX_INDIA');
    if (picked === 'nepal') return startFlovaxNepal(updated, 'START_FLOVAX_NEPAL');
    return ask('RETRY_FLOVAX_COUNTRY', {
      ...FLOVAX_COUNTRY,
      text: FLOVAX_COUNTRY_RETRY + FLOVAX_COUNTRY.text
    }, updated);
  }

  // Chats that started before the country step stay on the Nepali form.
  if (updated.brand === 'flovax' && updated.country !== 'india' && updated.country !== 'nepal') {
    if (FLOVAX_ORDER.includes(updated.state)) {
      updated.country = 'nepal';
    } else {
      return startCountry(updated, 'PROMPT_FLOVAX_COUNTRY');
    }
  }

  // 5. Active survey by brand and, for FLOVAX, by country.
  const flovaxIndia = updated.brand === 'flovax' && updated.country === 'india';
  const isFlovax = updated.brand === 'flovax';
  const questions = flovaxIndia ? FLOVAX_INDIA_QUESTIONS : isFlovax ? FLOVAX_QUESTIONS : CLAREN_QUESTIONS;
  const order = flovaxIndia ? FLOVAX_INDIA_ORDER : isFlovax ? FLOVAX_ORDER : CLAREN_ORDER;
  const thankYouText = flovaxIndia ? FLOVAX_INDIA_THANK_YOU : isFlovax ? FLOVAX_THANK_YOU : CLAREN_THANK_YOU;
  const retryPrefix = flovaxIndia ? FLOVAX_INDIA_RETRY_PREFIX : isFlovax ? FLOVAX_RETRY_PREFIX : CLAREN_RETRY_PREFIX;
  const terminalQuestion = flovaxIndia ? 'gst_status' : isFlovax ? 'pan_registration' : 'gst_status';

  let currentState = updated.state || 'new';
  if (currentState === 'new' || !order.includes(currentState)) {
    updated.state = 'city';
    return ask('START_' + updated.brand.toUpperCase(), questions.city, updated);
  }

  const q = questions[currentState];

  // Case A: free-text question (India city, or firm name on every track).
  if (q.type === 'text') {
    const enteredText = (rawText || selTitle).trim();
    const cityIsNumeric = currentState === 'city' && /^\d+$/.test(enteredText);
    if (enteredText.length < 2 || cityIsNumeric) {
      return {
        shouldReply: true,
        replyType: 'text',
        replyText: q.text,
        options: [],
        action: 'INVALID_TEXT_RETRY',
        updatedSession: updated
      };
    }

    (updated as any)[currentState] = enteredText;

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

    const nextKey = q.next;
    updated.state = nextKey;
    return ask('ANSWER_ACCEPTED_TEXT', questions[nextKey], updated);
  }

  // Case B: interactive list question.
  let matched: QuestionOption | null = null;

  if (selOpt) {
    matched = q.options.find(o => o.id === selOpt) || null;
  }

  if (!matched) {
    const candidate = (selTitle || rawText).toLowerCase().trim();
    if (candidate) {
      const numMatch = candidate.match(/^(\d+)$/);
      if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        if (idx >= 0 && idx < q.options.length) {
          matched = q.options[idx];
        }
      }

      if (!matched) {
        matched = q.options.find(o => o.title.toLowerCase() === candidate)
          || q.options.find(o => o.description && o.description.toLowerCase() === candidate)
          || null;
      }

      if (!matched && candidate.length >= 3) {
        matched = q.options.find(o => candidate.includes(o.title.toLowerCase()))
          || q.options.find(o => o.title.toLowerCase().includes(candidate))
          || q.options.find(o => o.description && (candidate.includes(o.description.toLowerCase()) || o.description.toLowerCase().includes(candidate)))
          || null;
      }

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

  // Nepal and CLAREN city lists also accept a typed city name.
  if (!matched && currentState === 'city') {
    const rawCity = (rawText || selTitle).trim();
    if (rawCity.length >= 2 && !/^\d+$/.test(rawCity) && !RESTART_WORDS.has(rawCity.toLowerCase())) {
      matched = {
        id: 'custom_city',
        title: rawCity
      };
    }
  }

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

  (updated as any)[currentState] = matched.title;
  if (currentState === 'city') {
    updated.city = matched.title;
  }

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

  let nextKey = q.next;

  // Import experience is asked only when the firm has an import license.
  // Otherwise skip it and ask the last question: GST in India, registration in Nepal.
  if (isFlovax && currentState === 'import_license') {
    if (matched.id === 'license_yes') {
      nextKey = 'import_experience';
    } else {
      nextKey = flovaxIndia ? 'gst_status' : 'pan_registration';
      updated.import_experience = 'N/A — No Import License';
    }
  }

  updated.state = nextKey;
  return ask('ANSWER_ACCEPTED', questions[nextKey], updated);
}
