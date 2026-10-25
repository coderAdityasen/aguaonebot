import { ContactSession } from '../memory/session-cache';
import {
  LANGUAGE_CHOOSER,
  LANGUAGE_RETRY,
  WELCOME_PREFIX,
  COUNTRY_CHOOSER,
  COUNTRY_RETRY,
  brandChooserForCountry,
  BRAND_RETRY_NEPAL_OPENING,
  BRAND_RETRY_OTHER_OPENING,
  CLAREN_CITY_TEXT_EN,
  CLAREN_CITY_TEXT_NE,
  CLAREN_EN_QUESTIONS,
  CLAREN_NE_QUESTIONS,
  CLAREN_THANK_YOU_EN,
  CLAREN_THANK_YOU_NE,
  CLAREN_RETRY_EN,
  CLAREN_RETRY_NE,
  FLOVAX_QUESTIONS,
  FLOVAX_ORDER,
  FLOVAX_THANK_YOU,
  FLOVAX_RETRY_PREFIX,
  FLOVAX_INDIA_QUESTIONS,
  FLOVAX_INDIA_ORDER,
  flovaxQuestionsForCountry,
  FLOVAX_INDIA_THANK_YOU,
  FLOVAX_INDIA_RETRY_PREFIX,
  FLOVAX_NEPAL_EN_QUESTIONS,
  FLOVAX_NEPAL_EN_ORDER,
  FLOVAX_NEPAL_EN_THANK_YOU,
  FLOVAX_NEPAL_EN_RETRY_PREFIX,
  FLOVAX_OTHER_NE_QUESTIONS,
  FLOVAX_OTHER_NE_ORDER,
  FLOVAX_OTHER_NE_THANK_YOU,
  FLOVAX_OTHER_NE_RETRY_PREFIX,
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

interface Track {
  questions: Record<string, QuestionStep>;
  order: string[];
  thankYou: string;
  retryPrefix: string;
  terminal: string;
  flovax: boolean;
  english: boolean;
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

function withWelcome(step: QuestionStep): QuestionStep {
  return { ...step, text: WELCOME_PREFIX + step.text };
}

function clearAnswers(updated: ContactSession) {
  updated.language = '';
  updated.brand = '';
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

export function listButtonLabel(session: { language?: string; state?: string }): string {
  if (session.state === 'country_select') return 'Country';
  if (session.state === 'language_select') return 'Language';
  if (session.state === 'brand_select') return session.language === 'ne' ? 'ब्रान्ड' : 'Brand';
  if (session.state === 'region_select') return session.language === 'en' ? 'Choose' : 'छान्नुहोस्';
  return session.language === 'en' ? 'Choose option' : 'विकल्प छान्नुहोस्';
}

function detectLanguage(lower: string, selOpt: string, selTitle: string, allowNumber: boolean): 'ne' | 'en' | null {
  if (selOpt === 'lang_ne') return 'ne';
  if (selOpt === 'lang_en') return 'en';
  const title = selTitle.toLowerCase();
  const nepali = lower.includes('nepali')
    || lower.includes('नेपाली')
    || /(^|[^a-z])nepal([^a-z]|$)/.test(lower)
    || lower.includes('नेपाल')
    || title.includes('नेपाली')
    || title.includes('nepali')
    || (allowNumber && lower === '1');
  const english = lower.includes('english')
    || lower.includes('अंग्रेजी')
    || title === 'english'
    || title.includes('english')
    || (allowNumber && lower === '2');
  if (nepali === english) return null;
  return nepali ? 'ne' : 'en';
}

function mentionsClaren(lower: string, selOpt: string, selTitle: string): boolean {
  const title = selTitle.toLowerCase();
  return lower.includes('claren')
    || lower.includes('aguaone')
    || selOpt === 'brand_claren'
    || selOpt === 'brand_aguaone'
    || title.includes('claren')
    || title.includes('aguaone');
}

function detectBrand(
  lower: string,
  selOpt: string,
  selTitle: string,
  state: string,
  country: string
): 'flovax' | 'claren' | null {
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
    || (state === 'brand_select' && country !== 'nepal' && lower === '2');
  if (flovax === claren) return null;
  return flovax ? 'flovax' : 'claren';
}

function detectRegion(lower: string, selOpt: string, selTitle: string): 'nepal' | 'other' | null {
  if (selOpt === 'region_nepal') return 'nepal';
  if (selOpt === 'region_other') return 'other';
  const title = selTitle.toLowerCase();
  const nepal = lower === '1'
    || /(^|[^a-z])nepal([^a-z]|$)/.test(lower)
    || lower.includes('नेपाल')
    || title === 'nepal'
    || title.includes('नेपाल');
  const other = lower === '2'
    || lower.includes('other')
    || lower.includes('अन्य')
    || title.includes('other')
    || title.includes('अन्य');
  if (nepal === other) return null;
  return nepal ? 'nepal' : 'other';
}

function matchClarenCountry(lower: string, selOpt: string, selTitle: string, step: QuestionStep): string | null {
  if (selOpt) {
    const byId = step.options.find(option => option.id === selOpt);
    if (byId) return byId.id.replace(/^country_/, '');
  }

  const candidate = (selTitle || lower).toLowerCase().trim();
  const number = candidate.match(/^(\d+)$/);
  if (number) {
    const index = parseInt(number[1], 10) - 1;
    if (step.options[index]) return step.options[index].id.replace(/^country_/, '');
    return null;
  }

  const aliases: Record<string, string[]> = {
    india: ['india', 'indian', 'भारत'],
    nepal: ['nepal', 'नेपाल'],
    bangladesh: ['bangladesh', 'bangladeshi', 'बांग्लादेश', 'बंगलादेश'],
    bhutan: ['bhutan', 'भूटान'],
    sri_lanka: ['sri lanka', 'srilanka', 'sri-lanka', 'shri lanka', 'shrilanka', 'श्रीलंका', 'श्रीलङ्का'],
    south_africa: ['south africa', 'southafrica', 'south-africa']
  };

  const hits = step.options.filter(option => {
    const key = option.id.replace(/^country_/, '');
    const words = aliases[key] || [];
    return words.some(word => candidate.includes(word)) || candidate === option.title.toLowerCase();
  });
  if (hits.length !== 1) return null;
  return hits[0].id.replace(/^country_/, '');
}

function startFlovax(updated: ContactSession, action: string, greet: boolean): RouteResult {
  updated.brand = 'flovax';
  updated.state = 'city';
  const step = getTrack(updated).questions.city;
  return ask(action, greet ? withWelcome(step) : step, updated);
}

function askCountry(updated: ContactSession, retry: boolean): RouteResult {
  updated.state = 'country_select';
  const step = COUNTRY_CHOOSER;
  const text = retry
    ? COUNTRY_RETRY + 'कृपया आफ्नो देश छान्नुहोस्।\nPlease choose your country:'
    : step.text;
  return ask(retry ? 'RETRY_COUNTRY' : 'START_COUNTRY', { ...step, text }, updated);
}

function askBrand(updated: ContactSession, retry: boolean): RouteResult {
  updated.brand = '';
  updated.state = 'brand_select';
  const step = brandChooserForCountry(updated.country);
  const retryPrefix = retry
    ? (updated.country === 'nepal' ? BRAND_RETRY_NEPAL_OPENING : BRAND_RETRY_OTHER_OPENING)
    : '';
  return ask(retry ? 'RETRY_BRAND' : 'START_BRAND', { ...step, text: retryPrefix + step.text }, updated);
}

function askLanguage(updated: ContactSession, retry: boolean): RouteResult {
  updated.state = 'language_select';
  const step = LANGUAGE_CHOOSER;
  return ask(retry ? 'RETRY_LANGUAGE' : 'START_LANGUAGE', {
    ...step,
    text: (retry ? LANGUAGE_RETRY : '') + step.text
  }, updated);
}

function startForm(updated: ContactSession): RouteResult {
  if (updated.brand === 'aguaone') updated.brand = 'claren';
  if (updated.brand === 'flovax') return startFlovax(updated, 'START_FLOVAX', false);
  if (updated.brand === 'claren') {
    updated.state = 'city';
    return ask('START_CLAREN', getTrack(updated).questions.city, updated);
  }
  return askBrand(updated, false);
}

function afterCountryChosen(updated: ContactSession): RouteResult {
  if (updated.country === 'nepal') {
    updated.brand = 'flovax';
    if (updated.language === 'en' || updated.language === 'ne') return startForm(updated);
    return askLanguage(updated, false);
  }
  if (updated.brand === 'claren' || updated.brand === 'aguaone') {
    updated.brand = 'claren';
    updated.language = 'en';
    return startForm(updated);
  }
  if (updated.brand === 'flovax') {
    if (updated.language === 'en' || updated.language === 'ne') return startForm(updated);
    return askLanguage(updated, false);
  }
  return askBrand(updated, false);
}

function handleOpening(
  updated: ContactSession,
  lower: string,
  selOpt: string,
  selTitle: string,
  previousState: string
): RouteResult {
  if (mentionsClaren(lower, selOpt, selTitle)) {
    updated.brand = 'claren';
    updated.language = 'en';
    const namedCountry = matchClarenCountry(lower, selOpt, selTitle, COUNTRY_CHOOSER);
    if (namedCountry) updated.country = namedCountry;
    if (updated.country) return afterCountryChosen(updated);
    return askCountry(updated, previousState === 'country_select');
  }

  if (previousState === 'language_select') {
    const language = detectLanguage(lower, selOpt, selTitle, true);
    if (!language) {
      if (updated.country && (updated.brand || updated.country === 'nepal')) return askLanguage(updated, true);
      return askCountry(updated, false);
    }
    updated.language = language;
    if (updated.country === 'nepal') updated.brand = 'flovax';
    if (updated.country && updated.brand) return startForm(updated);
    if (updated.country) return askBrand(updated, false);
    return askCountry(updated, false);
  }

  if (previousState === 'brand_select') {
    if (!updated.country || updated.country === 'nepal') {
      if (updated.country === 'nepal') {
        updated.brand = 'flovax';
        return askLanguage(updated, false);
      }
      return askCountry(updated, false);
    }
    const picked = detectBrand(lower, selOpt, selTitle, 'brand_select', updated.country);
    if (!picked) return askBrand(updated, true);
    updated.brand = picked;
    if (picked === 'claren') {
      updated.language = 'en';
      return startForm(updated);
    }
    if (updated.language === 'en' || updated.language === 'ne') return startForm(updated);
    return askLanguage(updated, false);
  }

  if (previousState === 'region_select') {
    const region = detectRegion(lower, selOpt, selTitle);
    if (region === 'nepal') {
      updated.country = 'nepal';
      return afterCountryChosen(updated);
    }
    updated.country = '';
    return askCountry(updated, false);
  }

  const country = matchClarenCountry(lower, selOpt, selTitle, COUNTRY_CHOOSER);
  if (country) {
    updated.country = country;
    return afterCountryChosen(updated);
  }

  return askCountry(updated, previousState === 'country_select');
}

function needsOpening(session: ContactSession): boolean {
  const openingStates = ['new', '', 'language_select', 'region_select', 'brand_select', 'country_select'];
  return openingStates.includes(session.state || 'new');
}

function getTrack(updated: ContactSession): Track {
  if (updated.brand === 'aguaone') updated.brand = 'claren';

  const english = updated.language === 'en';

  if (updated.brand === 'flovax') {
    const nepalForm = updated.country === 'nepal' || (!updated.country && !updated.language);
    if (nepalForm && english) {
      return {
        questions: FLOVAX_NEPAL_EN_QUESTIONS,
        order: FLOVAX_NEPAL_EN_ORDER,
        thankYou: FLOVAX_NEPAL_EN_THANK_YOU,
        retryPrefix: FLOVAX_NEPAL_EN_RETRY_PREFIX,
        terminal: 'pan_registration',
        flovax: true,
        english: true
      };
    }
    if (nepalForm) {
      if (!updated.country) updated.country = 'nepal';
      return {
        questions: FLOVAX_QUESTIONS,
        order: FLOVAX_ORDER,
        thankYou: FLOVAX_THANK_YOU,
        retryPrefix: FLOVAX_RETRY_PREFIX,
        terminal: 'pan_registration',
        flovax: true,
        english: false
      };
    }
    if (!english && updated.language === 'ne') {
      return {
        questions: flovaxQuestionsForCountry(FLOVAX_OTHER_NE_QUESTIONS, updated.country),
        order: FLOVAX_OTHER_NE_ORDER,
        thankYou: FLOVAX_OTHER_NE_THANK_YOU,
        retryPrefix: FLOVAX_OTHER_NE_RETRY_PREFIX,
        terminal: 'gst_status',
        flovax: true,
        english: false
      };
    }
    return {
      questions: flovaxQuestionsForCountry(FLOVAX_INDIA_QUESTIONS, updated.country),
      order: FLOVAX_INDIA_ORDER,
      thankYou: FLOVAX_INDIA_THANK_YOU,
      retryPrefix: FLOVAX_INDIA_RETRY_PREFIX,
      terminal: 'gst_status',
      flovax: true,
      english: true
    };
  }

  if (updated.language === 'ne') {
    const questions = { ...CLAREN_NE_QUESTIONS };
    if (updated.country !== 'india') questions.city = CLAREN_CITY_TEXT_NE;
    return {
      questions,
      order: CLAREN_ORDER,
      thankYou: CLAREN_THANK_YOU_NE,
      retryPrefix: CLAREN_RETRY_NE,
      terminal: 'gst_status',
      flovax: false,
      english: false
    };
  }

  if (updated.language === 'en') {
    const questions = { ...CLAREN_EN_QUESTIONS };
    if (updated.country !== 'india') questions.city = CLAREN_CITY_TEXT_EN;
    return {
      questions,
      order: CLAREN_ORDER,
      thankYou: CLAREN_THANK_YOU_EN,
      retryPrefix: CLAREN_RETRY_EN,
      terminal: 'gst_status',
      flovax: false,
      english: true
    };
  }

  return {
    questions: CLAREN_QUESTIONS,
    order: CLAREN_ORDER,
    thankYou: CLAREN_THANK_YOU,
    retryPrefix: CLAREN_RETRY_PREFIX,
    terminal: 'gst_status',
    flovax: false,
    english: false
  };
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
  const previousState = updated.state || 'new';

  if (RESTART_WORDS.has(lower) || lower === 'restart' || lower.startsWith('restart ')) {
    clearAnswers(updated);
    return handleOpening(updated, lower, selOpt, selTitle, 'new');
  }

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

  if (needsOpening(updated)) {
    return handleOpening(updated, lower, selOpt, selTitle, previousState);
  }

  const track = getTrack(updated);
  let currentState = updated.state || 'new';
  if (currentState === 'new' || !track.order.includes(currentState)) {
    updated.state = 'city';
    return ask('START_' + updated.brand.toUpperCase(), track.questions.city, updated);
  }

  const q = track.questions[currentState];
  if (!q) {
    updated.state = 'city';
    return ask('RECOVER_QUESTION', track.questions.city, updated);
  }

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

    if (currentState === track.terminal) {
      updated.qualified = 1;
      updated.lead_status = 'HANDOFF';
      updated.state = 'handoff';
      updated.bot_active = 0;
      return {
        shouldReply: true,
        replyType: 'text',
        replyText: track.thankYou,
        options: [],
        action: 'QUALIFIED_HANDOFF',
        updatedSession: updated
      };
    }

    return askKnown('ANSWER_ACCEPTED_TEXT', track, updated, q.next);
  }

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
      replyText: track.retryPrefix + q.text,
      options: [...q.options],
      action: 'INVALID_RETRY',
      updatedSession: updated
    };
  }

  (updated as any)[currentState] = matched.title;
  if (currentState === 'city') {
    updated.city = matched.title;
  }

  if (currentState === track.terminal) {
    updated.qualified = 1;
    updated.lead_status = 'HANDOFF';
    updated.state = 'handoff';
    updated.bot_active = 0;
    return {
      shouldReply: true,
      replyType: 'text',
      replyText: track.thankYou,
      options: [],
      action: 'QUALIFIED_HANDOFF',
      updatedSession: updated
    };
  }

  let nextKey = q.next;

  if (track.flovax && currentState === 'import_license') {
    if (matched.id === 'license_yes') {
      nextKey = 'import_experience';
    } else {
      nextKey = track.terminal;
      updated.import_experience = 'N/A — No Import License';
    }
  }

  return askKnown('ANSWER_ACCEPTED', track, updated, nextKey);
}

function askKnown(action: string, track: Track, updated: ContactSession, nextKey: string): RouteResult {
  const step = track.questions[nextKey];
  if (!step) {
    updated.qualified = 1;
    updated.lead_status = 'HANDOFF';
    updated.state = 'handoff';
    updated.bot_active = 0;
    return {
      shouldReply: true,
      replyType: 'text',
      replyText: track.thankYou,
      options: [],
      action: 'QUALIFIED_HANDOFF',
      updatedSession: updated
    };
  }
  updated.state = nextKey;
  return ask(action, step, updated);
}
