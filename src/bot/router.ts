import { ContactSession } from '../memory/session-cache';
import { 
  QUESTIONS, 
  ORDER, 
  RESTART_WORDS, 
  THANK_YOU_REPLY, 
  RETRY_PREFIX, 
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

  // 1. Terminal Check: If in HANDOFF, qualified, or bot is paused -> Never reply
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

  // 2. Restart Command
  if (RESTART_WORDS.has(lower)) {
    updated.city = '';
    updated.category = '';
    updated.shop_status = '';
    updated.experience = '';
    updated.opportunity = '';
    updated.budget = '';
    updated.qualified = 0;
    updated.lead_status = 'IN_PROGRESS';
    updated.state = 'city';

    const q = QUESTIONS.city;
    return {
      shouldReply: true,
      replyType: 'list',
      replyText: q.text,
      options: [...q.options],
      action: 'RESTART',
      updatedSession: updated
    };
  }

  // 3. Validate state
  let currentState = updated.state || 'new';
  if (currentState !== 'new' && !ORDER.includes(currentState)) {
    currentState = 'new';
  }

  // 4. Start Questionnaire
  if (currentState === 'new') {
    updated.state = 'city';
    const q = QUESTIONS.city;
    return {
      shouldReply: true,
      replyType: 'list',
      replyText: q.text,
      options: [...q.options],
      action: 'START',
      updatedSession: updated
    };
  }

  // 5. Answer Validation for current question
  const q = QUESTIONS[currentState as keyof typeof QUESTIONS];
  let matched: QuestionOption | null = null;

  // Primary: Match by interactive Option ID
  if (selOpt) {
    matched = q.options.find(o => o.id === selOpt) || null;
  }

  // Fallback: Match by title or fuzzy text
  if (!matched) {
    const candidate = (selTitle || rawText).toLowerCase().trim();
    if (candidate) {
      matched = q.options.find(o => o.title.toLowerCase() === candidate)
        || q.options.find(o =>
            candidate.includes(o.title.toLowerCase()) ||
            o.title.toLowerCase().includes(candidate)
          )
        || null;
    }
  }

  // If no match found -> prompt user to pick an option
  if (!matched) {
    return {
      shouldReply: true,
      replyType: 'list',
      replyText: RETRY_PREFIX + q.text,
      options: [...q.options],
      action: 'INVALID_RETRY',
      updatedSession: updated
    };
  }

  // Save the accepted answer into the session record
  (updated as any)[currentState] = matched.title;

  // Check if reached the final qualification question (Budget)
  if (currentState === 'budget') {
    updated.qualified = 1;
    updated.lead_status = 'HANDOFF';
    updated.state = 'handoff';
    updated.bot_active = 0; // Seamless handoff to human

    return {
      shouldReply: true,
      replyType: 'text',
      replyText: THANK_YOU_REPLY,
      options: [],
      action: 'QUALIFIED_HANDOFF',
      updatedSession: updated
    };
  } else {
    // Advance to next question
    const nextKey = q.next as keyof typeof QUESTIONS;
    updated.state = nextKey;
    const nextQ = QUESTIONS[nextKey];

    return {
      shouldReply: true,
      replyType: 'list',
      replyText: nextQ.text,
      options: [...nextQ.options],
      action: 'ANSWER_ACCEPTED',
      updatedSession: updated
    };
  }
}
