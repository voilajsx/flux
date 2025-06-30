/**
 * Flux Framework - Shared CLI Utilities
 * @description Core utilities for Flux CLI with colors, logging, and helpers
 * @file scripts/lib/utils.js
 */

import readline from 'readline';

// 🎨 Beautiful CLI Colors & Symbols
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

export const symbols = {
  flux: '⚡',
  check: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  security: '🔒',
  code: '💻',
  contracts: '📋',
  performance: '⚡',
  magic: '✨',
  rocket: '🚀',
  fire: '🔥',
  lightning: '⚡',
  target: '🎯',
  sparkles: '✨',
};

/**
 * 🎨 Beautiful console output helpers
 */
export function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export function logSuccess(message) {
  log(`${symbols.check} ${colors.green}${message}${colors.reset}`, 'white');
}

export function logError(message) {
  log(`${symbols.error} ${colors.red}${message}${colors.reset}`, 'white');
}

export function logWarning(message) {
  log(`${symbols.warning} ${colors.yellow}${message}${colors.reset}`, 'white');
}

export function logInfo(message) {
  log(`${symbols.info} ${colors.blue}${message}${colors.reset}`, 'white');
}

export function logBox(title, content, color = 'cyan') {
  const width = 60;
  const border = '═'.repeat(width - 2);

  console.log(`${colors[color]}╔${border}╗${colors.reset}`);
  console.log(`${colors[color]}║${' '.repeat(width - 2)}║${colors.reset}`);
  console.log(
    `${colors[color]}║${colors.bright}${title
      .padStart((width + title.length) / 2)
      .padEnd(width - 2)}${colors.reset}${colors[color]}║${colors.reset}`
  );
  console.log(`${colors[color]}║${' '.repeat(width - 2)}║${colors.reset}`);

  if (Array.isArray(content)) {
    content.forEach((line) => {
      console.log(
        `${colors[color]}║  ${colors.reset}${line.padEnd(width - 4)}${
          colors[color]
        }║${colors.reset}`
      );
    });
  } else {
    console.log(
      `${colors[color]}║  ${colors.reset}${content.padEnd(width - 4)}${
        colors[color]
      }║${colors.reset}`
    );
  }

  console.log(`${colors[color]}║${' '.repeat(width - 2)}║${colors.reset}`);
  console.log(`${colors[color]}╚${border}╝${colors.reset}`);
  console.log();
}

/**
 * Interactive prompts
 */
export function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function askQuestion(question, rl) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}❓ ${question}${colors.reset} `, resolve);
  });
}

export async function askYesNo(question, defaultValue = true) {
  const rl = createReadlineInterface();
  const defaultText = defaultValue ? 'Y/n' : 'y/N';

  const answer = await askQuestion(
    `${question} ${colors.gray}(${defaultText})${colors.reset}`,
    rl
  );
  rl.close();

  if (!answer.trim()) return defaultValue;
  return answer.toLowerCase().startsWith('y');
}

export function showOptions(options, current = 0) {
  console.log();
  options.forEach((option, index) => {
    const isSelected = index === current;
    const prefix = isSelected ? `${colors.green}→${colors.reset}` : ' ';
    const text = isSelected
      ? `${colors.bright}${option.text}${colors.reset}`
      : `${colors.gray}${option.text}${colors.reset}`;
    console.log(`  ${prefix} ${text}`);
  });
  console.log();
}

export function selectFromOptions(options) {
  return new Promise((resolve) => {
    let current = 0;
    showOptions(options, current);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onKeypress = (key) => {
      if (key === '\u0003') {
        // Ctrl+C
        process.exit();
      } else if (key === '\u001b[A') {
        // Up arrow
        current = Math.max(0, current - 1);
        process.stdout.moveCursor(0, -(options.length + 1));
        process.stdout.clearScreenDown();
        showOptions(options, current);
      } else if (key === '\u001b[B') {
        // Down arrow
        current = Math.min(options.length - 1, current + 1);
        process.stdout.moveCursor(0, -(options.length + 1));
        process.stdout.clearScreenDown();
        showOptions(options, current);
      } else if (key === '\r') {
        // Enter
        process.stdin.removeListener('data', onKeypress);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve(options[current]);
      }
    };

    process.stdin.on('data', onKeypress);
  });
}

/**
 * String manipulation utilities
 */
export function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * File system utilities
 */
export function ensureDir(dirPath) {
  import('fs').then((fs) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

export function fileExists(filePath) {
  try {
    import('fs').then((fs) => fs.accessSync(filePath));
    return true;
  } catch {
    return false;
  }
}

/**
 * Loading spinner
 */
export class Spinner {
  constructor(message = 'Loading...') {
    this.message = message;
    this.spinning = false;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.current = 0;
  }

  start() {
    this.spinning = true;
    this.timer = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.current]} ${this.message}`);
      this.current = (this.current + 1) % this.frames.length;
    }, 100);
  }

  stop(finalMessage) {
    if (this.timer) {
      clearInterval(this.timer);
      this.spinning = false;
      process.stdout.write(`\r${finalMessage || this.message}\n`);
    }
  }

  succeed(message) {
    this.stop(`${symbols.check} ${colors.green}${message}${colors.reset}`);
  }

  fail(message) {
    this.stop(`${symbols.error} ${colors.red}${message}${colors.reset}`);
  }
}

/**
 * Performance timing
 */
export class Timer {
  constructor() {
    this.start();
  }

  start() {
    this.startTime = performance.now();
  }

  end() {
    const endTime = performance.now();
    return Math.round(endTime - this.startTime);
  }

  endWithMessage(message) {
    const time = this.end();
    log(`${message} (${time}ms)`, 'gray');
    return time;
  }
}
