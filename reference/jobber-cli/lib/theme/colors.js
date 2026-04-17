/**
 * Color palette and formatting helpers for CLI output.
 */

export const RESET = '\x1b[0m';
export const BOLD = '\x1b[1m';

export const colors = {
  grey: '\x1b[38;5;244m',
  greyLight: '\x1b[38;5;249m',
  lightBlue: '\x1b[38;5;117m',
  lightBlueAlt: '\x1b[38;5;75m',
  blue: '\x1b[38;5;26m',
  blueAlt: '\x1b[38;5;33m',
  gold: '\x1b[38;5;226m',
  goldAlt: '\x1b[38;5;214m',
  green: '\x1b[38;5;46m',
  greenAlt: '\x1b[38;5;40m',
  warning: '\x1b[38;5;220m',
  error: '\x1b[38;5;196m',
  white: '\x1b[37m'
};

export const decorations = {
  heavy: '▓',
  light: '░',
  diamond: '◆',
  diamondOutline: '◇',
  circle: '●',
  circleOutline: '○',
  square: '■',
  squareOutline: '□',
  bullet: '▸',
  bulletAlt: '►'
};

export function colorize(text, color) {
  if (!process.stdout.isTTY || process.env.NO_COLOR) return String(text);
  return `${color}${text}${RESET}`;
}

export function bold(text) {
  return `${BOLD}${text}${RESET}`;
}

export function boldColor(text, color) {
  return `${BOLD}${color}${text}${RESET}`;
}

export function money(amount) {
  if (amount === undefined || amount === null) {
    return colorize('$0.00', colors.gold);
  }
  return colorize(`$${amount.toFixed(2)}`, colors.gold);
}

export function primary(text) {
  return boldColor(text, colors.blue);
}

export function secondary(text) {
  return colorize(text, colors.lightBlue);
}

export function success(text) {
  return colorize(text, colors.green);
}

export function section(text) {
  return colorize(text, colors.grey);
}

export default colors;
