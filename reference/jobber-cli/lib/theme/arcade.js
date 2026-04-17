import { colorize, boldColor, colors, decorations, money } from './colors.js';
import { calculateResponsiveWidth, getVisualWidth } from './width.js';

export function border(type, width = null) {
  const borderWidth = width || calculateResponsiveWidth();

  const chars = {
    top: '═',
    bottom: '═',
    side: '│',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '─',
    vertical: '│'
  };

  switch (type) {
    case 'top':
      return colorize(chars.top.repeat(borderWidth), colors.grey);
    case 'bottom':
      return colorize(chars.bottom.repeat(borderWidth), colors.grey);
    case 'side':
      return `${colorize(chars.side, colors.grey)}${' '.repeat(borderWidth - 2)}${colorize(chars.side, colors.grey)}`;
    case 'horizontal':
      return colorize(chars.horizontal.repeat(borderWidth), colors.grey);
    case 'boxTop':
      return `${colorize(chars.topLeft, colors.grey)}${colorize(chars.top.repeat(borderWidth - 2), colors.grey)}${colorize(chars.topRight, colors.grey)}`;
    case 'boxBottom':
      return `${colorize(chars.bottomLeft, colors.grey)}${colorize(chars.bottom.repeat(borderWidth - 2), colors.grey)}${colorize(chars.bottomRight, colors.grey)}`;
    case 'header':
      return `${colorize(chars.topLeft, colors.grey)}${colorize(chars.top.repeat(borderWidth - 2), colors.grey)}${colorize(chars.topRight, colors.grey)}`;
    default:
      return colorize(chars.horizontal.repeat(borderWidth), colors.grey);
  }
}

export function sectionHeader(text, width = null, decorative = true) {
  const headerWidth = width || calculateResponsiveWidth();
  const textLength = getVisualWidth(text);
  const padding = headerWidth - 2 - textLength;
  const leftPad = Math.max(0, Math.floor(padding / 2));
  const rightPad = Math.max(0, padding - leftPad);

  if (decorative) {
    const decorLeft = colorize(decorations.light.repeat(2), colors.grey);
    const decorRight = colorize(decorations.light.repeat(2), colors.grey);
    const availableForText = headerWidth - 2 - 4;
    const textPadding = availableForText - textLength;
    const textLeftPad = Math.max(0, Math.floor(textPadding / 2));
    const textRightPad = Math.max(0, textPadding - textLeftPad);
    return `${colorize('║', colors.grey)}${decorLeft}${' '.repeat(textLeftPad)}${boldColor(text, colors.blue)}${' '.repeat(textRightPad)}${decorRight}${colorize('║', colors.grey)}`;
  }

  return `${colorize('║', colors.grey)}${' '.repeat(leftPad)}${boldColor(text, colors.blue)}${' '.repeat(rightPad)}${colorize('║', colors.grey)}`;
}

export function arcadeHeader(text, width = null) {
  const headerWidth = width || calculateResponsiveWidth();
  const textLength = getVisualWidth(text);
  const totalDecorative = 4;
  const spaceAroundText = 2;
  const availableWidth = headerWidth - totalDecorative - spaceAroundText - 2;
  const sideWidth = Math.floor((availableWidth - textLength) / 2);
  const remaining = availableWidth - textLength - sideWidth * 2;

  const leftSide = '═'.repeat(Math.max(0, sideWidth));
  const rightSide = '═'.repeat(Math.max(0, sideWidth + remaining));
  const decor = decorations.light.repeat(2);

  return `${colorize('╔', colors.grey)}${colorize(decor, colors.grey)}${colorize(leftSide, colors.grey)} ${boldColor(text, colors.blue)} ${colorize(rightSide, colors.grey)}${colorize('╗', colors.grey)}`;
}

export function textBox(lines, width = null, padding = 2) {
  const boxWidth = width || calculateResponsiveWidth();
  const innerWidth = boxWidth - 2 - padding * 2;
  const result = [];

  result.push(border('boxTop', boxWidth));
  result.push(colorize('║', colors.grey) + ' '.repeat(boxWidth - 2) + colorize('║', colors.grey));

  lines.forEach(line => {
    const visualLength = getVisualWidth(line);

    if (visualLength <= innerWidth) {
      const totalPadding = boxWidth - 2 - visualLength;
      const leftPad = padding;
      const rightPad = Math.max(0, totalPadding - leftPad);
      result.push(`${colorize('║', colors.grey)}${' '.repeat(leftPad)}${line}${' '.repeat(rightPad)}${colorize('║', colors.grey)}`);
    } else {
      const wrapped = wrapText(line, innerWidth, 0);
      wrapped.forEach(wrappedLine => {
        const wrappedVisualLength = getVisualWidth(wrappedLine);
        const totalPadding = boxWidth - 2 - wrappedVisualLength;
        const leftPad = padding;
        const rightPad = Math.max(0, totalPadding - leftPad);
        result.push(`${colorize('║', colors.grey)}${' '.repeat(leftPad)}${wrappedLine}${' '.repeat(rightPad)}${colorize('║', colors.grey)}`);
      });
    }
  });

  result.push(colorize('║', colors.grey) + ' '.repeat(boxWidth - 2) + colorize('║', colors.grey));
  result.push(border('boxBottom', boxWidth));

  return result.join('\n');
}

export function wrapText(text, maxWidth, indent = 0) {
  if (!text) return [];

  const lines = [];
  const words = text.split(/\s+/);
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testVisualLength = getVisualWidth(testLine);

    if (testVisualLength <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      const wordVisualLength = getVisualWidth(word);
      if (wordVisualLength > maxWidth) {
        const stripAnsi = (str) => String(str).replace(/\x1b\[[0-9;]*m/g, '');
        const plainWord = stripAnsi(word);
        const truncated = plainWord.substring(0, maxWidth - 3) + '...';
        lines.push(truncated);
        currentLine = '';
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export function rightAlign(value, columnWidth, colorFn = null) {
  const visualLength = getVisualWidth(value);
  const padding = Math.max(0, columnWidth - visualLength);
  const padded = ' '.repeat(padding) + String(value);
  return colorFn ? colorFn(padded) : padded;
}

export function formatCurrency(amount, totalWidth = 12, colorFn = money) {
  const safeAmount = amount ?? 0;
  const formatted = `$${safeAmount.toFixed(2)}`;
  const currencyStr = colorFn ? colorFn(safeAmount) : formatted;
  return rightAlign(currencyStr, totalWidth);
}

export function formatRow(label, value, totalWidth) {
  const labelStr = String(label);
  const valueStr = String(value);
  const labelVisualWidth = getVisualWidth(labelStr);
  const valueVisualWidth = getVisualWidth(valueStr);
  const spaces = Math.max(0, totalWidth - labelVisualWidth - valueVisualWidth);
  return labelStr + ' '.repeat(spaces) + valueStr;
}

export function arcadeTable(rows, columns, width = null) {
  const tableWidth = width || calculateResponsiveWidth();

  if (rows.length === 0) {
    return textBox(['No results'], tableWidth);
  }

  const widths = columns.map(col => {
    const headerLen = getVisualWidth(col.header || col.name);
    const maxDataLen = Math.max(
      headerLen,
      ...rows.map(row => getVisualWidth(String(row[col.name] ?? '')))
    );
    return Math.min(Math.max(10, maxDataLen), Math.floor(tableWidth / columns.length) - 1);
  });

  const result = [];
  result.push(border('boxTop', tableWidth));
  const headerRow = columns.map((col, i) => {
    const header = col.header || col.name;
    const headerVisualWidth = getVisualWidth(header);
    const padding = Math.max(0, widths[i] - headerVisualWidth);
    const padded = header + ' '.repeat(padding);
    return boldColor(padded, colors.blue);
  }).join(`${colorize('│', colors.grey)} `);
  result.push(`${colorize('║', colors.grey)} ${headerRow} ${colorize('║', colors.grey)}`);

  const separator = widths.map(w => '═'.repeat(w)).join(`${colorize('╪', colors.grey)}`);
  result.push(`${colorize('╠', colors.grey)}${separator}${colorize('╣', colors.grey)}`);

  rows.forEach(row => {
    const rowCells = columns.map((col, i) => {
      const value = row[col.name] ?? '';
      const strValue = String(value);
      const valueVisualWidth = getVisualWidth(strValue);
      const padding = Math.max(0, widths[i] - valueVisualWidth);
      const padded = valueVisualWidth <= widths[i]
        ? strValue + ' '.repeat(padding)
        : strValue.substring(0, widths[i] - 3) + '...';
      return padded;
    }).join(`${colorize('│', colors.grey)} `);
    result.push(`${colorize('║', colors.grey)} ${rowCells} ${colorize('║', colors.grey)}`);
  });

  result.push(border('boxBottom', tableWidth));

  return result.join('\n');
}

export function arcadeScreen(content, title = null, width = null) {
  const screenWidth = width || calculateResponsiveWidth();
  const lines = content.split('\n');
  const result = [];

  if (title) {
    result.push(arcadeHeader(title, screenWidth));
  } else {
    result.push(border('boxTop', screenWidth));
  }
  result.push('');
  result.push(...lines);
  result.push('');
  result.push(border('boxBottom', screenWidth));

  return result.join('\n');
}
