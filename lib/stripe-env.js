export const STRIPE_ENV_VARS = [
  {
    key: "STRIPE_SECRET_KEY",
    hint: "Stripe Secret Key (sk_test_... oder sk_live_...)",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    hint: "Stripe Webhook Signing Secret (whsec_...)",
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    hint: "Stripe Publishable Key (pk_test_... oder pk_live_...)",
  },
  {
    key: "NEXT_PUBLIC_FOUNDER_PRO_STRIPE_PRICE_OR_PRODUCT_ID",
    hint: "Stripe Product-ID für Founder Pro (prod_...)",
  },
];

export function getMissingStripeEnvVars() {
  return STRIPE_ENV_VARS.filter(({ key }) => !process.env[key]?.trim()).map(({ key }) => key);
}

export function assertStripeEnvAtStartup() {
  const missing = getMissingStripeEnvVars();
  if (missing.length === 0) return;

  const details = missing
    .map((key) => {
      const meta = STRIPE_ENV_VARS.find((item) => item.key === key);
      return `  • ${key}${meta?.hint ? ` — ${meta.hint}` : ""}`;
    })
    .join("\n");

  const message = `Stripe-Konfiguration unvollständig. Fehlende ENV-Variablen:\n${details}\nSetze sie in .env.local (lokal) oder in Vercel → Project Settings → Environment Variables.`;

  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(`[Founder Stripe]\n${message}`);
}

export function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY fehlt. Bitte in den Umgebungsvariablen setzen.");
  }
  return secretKey;
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET fehlt. Bitte in den Umgebungsvariablen setzen.");
  }
  return webhookSecret;
}
