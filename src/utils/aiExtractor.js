const VAT_RATE_REGEXES = [
  /\b(?:MwSt\.?|USt\.?|VAT|UST)\s*[.:@]?\s*(19|16|7|5)\s*%/gi,
  /\b(19|16|7|5)\s*%\s*(?:MwSt|USt|VAT|Steuer)/gi,
  /\bSteuersatz\s*[.:@]?\s*(19|16|7|5)\s*%/gi,
];

const TOTAL_HINT_REGEXES = [
  /Gesamt(?:betrag|preis)?/i,
  /Gesamtsumme/i,
  /Summe/i,
  /Gesamt/i,
  /Zu zahlen/i,
  /Total(?:\s+amount)?/i,
  /Grand\s+total/i,
  /Amount\s+due/i,
  /Balance\s+due/i,
  /Rechnungsbetrag/i,
  /Endbetrag/i,
];

const VENDOR_FROM_DOMAIN = [
  [/@(?:.*\.)?amazon\./i, "Amazon"],
  [/@(?:.*\.)?adobe\./i, "Adobe"],
  [/@(?:.*\.)?apple\./i, "Apple"],
  [/@(?:.*\.)?google\./i, "Google"],
  [/@(?:.*\.)?microsoft\./i, "Microsoft"],
  [/@(?:.*\.)?stripe\./i, "Stripe"],
  [/@(?:.*\.)?paypal\./i, "PayPal"],
  [/@(?:.*\.)?linkedin\./i, "LinkedIn"],
  [/@(?:.*\.)?meta\./i, "Meta"],
  [/@(?:.*\.)?uber\./i, "Uber"],
  [/@(?:.*\.)?hetzner\./i, "Hetzner"],
  [/@(?:.*\.)?digitalocean\./i, "DigitalOcean"],
  [/@(?:.*\.)?notion\./i, "Notion"],
  [/@(?:.*\.)?slack\./i, "Slack"],
];

const VENDOR_FROM_TEXT = [
  [/Amazon/i, "Amazon"],
  [/Adobe/i, "Adobe"],
  [/Apple/i, "Apple"],
  [/Google/i, "Google"],
  [/Microsoft/i, "Microsoft"],
  [/Stripe/i, "Stripe"],
  [/PayPal/i, "PayPal"],
  [/LinkedIn/i, "LinkedIn"],
  [/Meta\b/i, "Meta"],
  [/Uber/i, "Uber"],
  [/Hetzner/i, "Hetzner"],
  [/DigitalOcean/i, "DigitalOcean"],
  [/Notion/i, "Notion"],
  [/Slack/i, "Slack"],
  [/OpenAI|ChatGPT/i, "OpenAI"],
  [/eBay/i, "eBay"],
  [/DHL/i, "DHL"],
];

/** Parse "1.234,56" or "1,234.56" or "12,34" into a number. */
function parseLocalizedNumber(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  let normalized;
  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = s.replace(/,/g, "");
    }
  } else {
    normalized = s;
  }
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

function normalizeCurrency(token) {
  if (!token) return "EUR";
  const t = String(token).trim().toUpperCase();
  if (t === "€" || t === "EUR" || t === "EURO") return "EUR";
  if (t === "$" || t === "USD") return "USD";
  if (t === "£" || t === "GBP") return "GBP";
  if (t === "CHF") return "CHF";
  return t.length <= 4 ? t : "EUR";
}

function extractVatRate(text) {
  for (const re of VAT_RATE_REGEXES) {
    re.lastIndex = 0;
    let match = re.exec(text);
    while (match) {
      const rate = Number.parseInt(match[1], 10);
      if ([5, 7, 16, 19].includes(rate)) {
        return rate;
      }
      match = re.exec(text);
    }
  }
  return null;
}

function extractVendor(text) {
  const fromMatch = text.match(/From:\s*[^\n<]+/i);
  const fromLine = fromMatch ? fromMatch[0] : text;
  for (const [re, name] of VENDOR_FROM_DOMAIN) {
    if (re.test(fromLine) || re.test(text)) return name;
  }
  for (const [re, name] of VENDOR_FROM_TEXT) {
    if (re.test(text)) return name;
  }
  return null;
}

/**
 * Heuristische „KI“-Extraktion ohne API: Betrag, Währung, Händler, MwSt.-Hinweise.
 * @param {string} emailText
 * @returns {{
 *   amount: number | null,
 *   currency: string,
 *   vendor: string | null,
 *   vatRate: number | null,
 *   vatHints: string[],
 * }}
 */
export function extractInvoiceData(emailText) {
  const text = emailText ?? "";
  const vatRate = extractVatRate(text);
  const vatHints = [];
  if (vatRate != null) {
    vatHints.push(`${vatRate}% MwSt./USt`);
  }

  const vendor = extractVendor(text);

  const amountRegex =
    /(\d{1,3}(?:\.\d{3})*,\d{2}|\d{1,3}(?:,\d{3})*\.\d{2}|\d+[.,]\d{2})\s*(€|EUR|EURO|\$|USD|GBP|£|CHF)?/gi;

  const candidates = [];
  let match = amountRegex.exec(text);
  while (match) {
    const rawNum = match[1];
    const currTok = match[2];
    const start = match.index;
    const windowStart = Math.max(0, start - 80);
    const window = text.slice(windowStart, start + rawNum.length + 20);
    let score = 0;
    for (const hint of TOTAL_HINT_REGEXES) {
      if (hint.test(window)) {
        score += 3;
      }
    }
    const value = parseLocalizedNumber(rawNum);
    if (value != null && value > 0 && value < 1_000_000) {
      candidates.push({
        value,
        currency: normalizeCurrency(currTok),
        score,
        index: start,
      });
    }
    match = amountRegex.exec(text);
  }

  let amount = null;
  let currency = "EUR";
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.value - a.value;
    });
    amount = candidates[0].value;
    currency = candidates[0].currency;
  }

  return {
    amount,
    currency,
    vendor,
    vatRate,
    vatHints,
  };
}
