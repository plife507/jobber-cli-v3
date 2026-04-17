/**
 * Terminal width helpers for responsive CLI layouts.
 */

export const MAX_WIDTH = 120;
export const MIN_WIDTH = 60;
export const DEFAULT_WIDTH = 80;

export function getTerminalWidth() {
  return process.stdout?.columns || DEFAULT_WIDTH;
}

export function calculateResponsiveWidth() {
  const terminalWidth = getTerminalWidth();
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor(terminalWidth * 0.9)));
}

export function getVisualWidth(str) {
  if (!str) return 0;

  const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '');
  const plainStr = stripAnsi(str);
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  const emojis = (plainStr.match(emojiRegex) || []).length;
  return plainStr.length + emojis;
}
