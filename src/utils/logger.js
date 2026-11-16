/**
 * Logger Utility - Tài Xỉu Server
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export const logger = {
  info(msg, meta = '') {
    console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.cyan}[INFO]${colors.reset} ${msg}`, meta);
  },
  game(msg, meta = '') {
    console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.green}[GAME]${colors.reset} 🎲 ${msg}`, meta);
  },
  pity(msg, meta = '') {
    console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.magenta}[PITY-ENGINE]${colors.reset} 🧠 ${msg}`, meta);
  },
  warn(msg, meta = '') {
    console.warn(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ⚠️  ${msg}`, meta);
  },
  error(msg, err = '') {
    console.error(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.red}[ERROR]${colors.reset} ❌ ${msg}`, err);
  }
};
