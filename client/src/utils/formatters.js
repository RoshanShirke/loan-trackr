const CURRENCY_MAP = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  JPY: { symbol: '¥', locale: 'ja-JP' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  CAD: { symbol: 'C$', locale: 'en-CA' },
};

export function formatCurrency(amount, currency = 'INR') {
  const config = CURRENCY_MAP[currency] || CURRENCY_MAP.INR;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${config.symbol}${Number(amount).toLocaleString()}`;
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatPercent(value) {
  return `${Math.round(value * 100) / 100}%`;
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getCurrencyList() {
  return Object.entries(CURRENCY_MAP).map(([code, config]) => ({
    code, symbol: config.symbol, label: `${config.symbol} ${code}`,
  }));
}

export function getAppColor(appName) {
  const colors = {
    'MoneyView': '#3b82f6',
    'True Balance': '#10b981',
    'Stucred': '#8b5cf6',
    'mpokket': '#f59e0b',
    'Fibe': '#ec4899',
    'KreditBee': '#06b6d4',
    'CASHe': '#ef4444',
    'Navi': '#6366f1',
    'PaySense': '#14b8a6',
    'SmartCoin': '#a855f7',
  };
  return colors[appName] || `hsl(${hashStr(appName) % 360}, 65%, 55%)`;
}

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
