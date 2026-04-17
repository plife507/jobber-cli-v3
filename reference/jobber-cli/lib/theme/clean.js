import { colorize, boldColor, colors, secondary, success } from './colors.js';
import { getTerminalWidth } from './width.js';

const CLEAN_MAX_WIDTH = 100;
const CLEAN_LABEL_WIDTH = 18;

export function getCleanVisualWidth(str) {
  if (!str) return 0;
  const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '');
  const plainStr = stripAnsi(str);
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
  const emojis = (plainStr.match(emojiRegex) || []).length;
  return plainStr.length + emojis;
}

export function calculateCleanWidth() {
  const terminalWidth = getTerminalWidth();
  return Math.min(terminalWidth - 4, CLEAN_MAX_WIDTH);
}

export function separator(char = '━', width = null) {
  const separatorWidth = width || calculateCleanWidth();
  return colorize(char.repeat(separatorWidth), colors.grey);
}

export function cleanHeader(emoji, text, width = null) {
  const contentWidth = width || calculateCleanWidth();
  const sep = separator('━', contentWidth);
  return `\n${sep}\n\n${emoji} ${boldColor(text, colors.blue)}\n\n${sep}\n`;
}

export function cleanSection(emoji, title) {
  return `\n\n${emoji} ${boldColor(title, colors.blue)}\n`;
}

export function cleanRow(emoji, label, value, isPrice = false, width = null) {
  const contentWidth = width || calculateCleanWidth();
  const fullLabel = `${emoji} ${colorize(label, colors.grey)}:`;
  const labelVisualWidth = getCleanVisualWidth(fullLabel);
  const labelSpacing = 2;

  if (isPrice) {
    const minLabelColumn = Math.max(CLEAN_LABEL_WIDTH, labelVisualWidth + labelSpacing);
    const labelPadding = minLabelColumn - labelVisualWidth;
    const paddedLabel = fullLabel + ' '.repeat(Math.max(labelSpacing, labelPadding));
    const valueVisualWidth = getCleanVisualWidth(String(value));
    const paddedLabelWidth = getCleanVisualWidth(paddedLabel);
    const padding = Math.max(labelSpacing, contentWidth - paddedLabelWidth - valueVisualWidth);
    return paddedLabel + ' '.repeat(padding) + value;
  }

  const minLabelColumn = Math.max(CLEAN_LABEL_WIDTH, labelVisualWidth + labelSpacing);
  const padding = minLabelColumn - labelVisualWidth;
  return fullLabel + ' '.repeat(Math.max(labelSpacing, padding)) + value;
}

export function cleanCurrency(amount) {
  if (amount === undefined || amount === null) {
    const numberPart = '0.00'.padStart(10, ' ');
    return colorize(`$${numberPart}`, colors.gold);
  }
  const absAmount = Math.abs(amount);
  const numberStr = absAmount.toFixed(2);
  const paddedNumber = numberStr.padStart(10, ' ');
  const sign = amount < 0 ? '-' : '';
  const formatted = `${sign}$${paddedNumber}`;
  return colorize(formatted, colors.gold);
}

export function cleanStatus(emoji, text, isSuccess = false) {
  const colorFn = isSuccess ? success : secondary;
  return `${emoji} ${colorFn(text)}`;
}

export function cleanWrapText(text, indent = 3, maxWidth = null) {
  if (!text) return [];

  const contentWidth = maxWidth || calculateCleanWidth();
  const lines = [];
  const words = text.split(/\s+/);
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testVisualWidth = getCleanVisualWidth(testLine);

    if (testVisualWidth <= contentWidth - indent) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.map((line, idx) => (idx === 0 ? line : ' '.repeat(indent) + line));
}

export function cleanFinancialSummary(items, width = null) {
  const contentWidth = width || calculateCleanWidth();
  const lines = [];

  items.forEach(item => {
    const { label, value, isDiscount = false } = item;
    const valueStr = isDiscount
      ? `${secondary('-')}${cleanCurrency(value)}`
      : cleanCurrency(value);
    lines.push(cleanRow('', label, valueStr, true, contentWidth));
  });

  if (items.length > 0) {
    lines.push(colorize('─'.repeat(contentWidth), colors.grey));
  }

  return lines.join('\n');
}
