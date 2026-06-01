const SECRET_KEY_PATTERN = /sk_(live|test)_[A-Za-z0-9]+/g;

export function sanitizeStripeErrorMessage(error) {
  const raw = typeof error === "string" ? error : error?.message ?? "";
  const message = String(raw).replace(SECRET_KEY_PATTERN, "[redacted]");

  if (!message.trim()) {
    return "Checkout momentan nicht verfügbar. Bitte versuche es später erneut.";
  }

  if (/invalid api key/i.test(message) || /no such/i.test(message) || /stripe/i.test(message)) {
    return "Checkout momentan nicht verfügbar. Bitte versuche es später erneut.";
  }

  return message.length > 180 ? `${message.slice(0, 180)}…` : message;
}
