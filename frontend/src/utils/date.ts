/**
 * Date and Time utilities for WhatsApp CRM.
 * Ensures consistent handling of UTC timestamps from SQLite (which lack 'Z')
 * and always formats display strings in Indian Standard Time (IST - Asia/Kolkata).
 */

export function parseAppDate(val?: string | number | Date | null): Date {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    return new Date(val > 1e11 ? val : val * 1000);
  }

  let str = String(val).trim();
  if (!str) return new Date(0);

  // If pure numeric string (epoch timestamps from Meta webhook or Date.now())
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    return new Date(num > 1e11 ? num : num * 1000);
  }

  // SQLite CURRENT_TIMESTAMP format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD HH:MM:SS.sss"
  // It is UTC, but lacks the 'T' and trailing 'Z'. Without 'Z', JavaScript interprets it as local time!
  // Appending 'Z' tells JavaScript that this timestamp is UTC.
  if (!str.includes('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

/**
 * Format message time in Indian Standard Time (IST) 12-hour format.
 * E.g., "9:05 AM"
 */
export function formatMessageTime(val?: string | number | Date | null): string {
  if (!val) return '';
  const date = parseAppDate(val);
  if (date.getTime() === 0) return '';

  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format timestamp for the contact list in Indian Standard Time (IST).
 * - Today: "9:05 AM"
 * - Yesterday: "Yesterday"
 * - Older: "19 Nov"
 */
export function formatChatListTime(val?: string | number | Date | null): string {
  if (!val) return '';
  const date = parseAppDate(val);
  if (date.getTime() === 0) return '';

  const now = new Date();

  // Compare calendar dates specifically in Asia/Kolkata timezone
  const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  if (dateStr === todayStr) {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Check for yesterday in IST
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (dateStr === yesterdayStr) {
    return 'Yesterday';
  }

  // Same year: e.g. "19 Nov"
  const dateYear = date.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });
  const currentYear = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric' });

  if (dateYear === currentYear) {
    return date.toLocaleDateString('en-US', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short'
    });
  }

  // Different year: "19/11/25"
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'numeric',
    year: '2-digit'
  });
}
