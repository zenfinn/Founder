# Stripe Webhook Testing

## Local Webhook Forwarding

Run the Next.js dev server first:

```bash
npm run dev -- -p 3000
```

In a second terminal, forward Stripe events to the local webhook route:

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

The Stripe CLI prints a local signing secret like:

```text
whsec_...
```

Set that exact value locally:

```bash
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_cli
```

For local testing, this value belongs in `.env`. For production, use the webhook signing secret from the Stripe Dashboard
for the production endpoint and set it in Vercel as `STRIPE_WEBHOOK_SECRET`.

## Trigger Test Events

After `stripe listen` is running:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

For a real end-to-end Founder Pro test, use the website checkout button while `stripe listen` is forwarding events. The
checkout route writes `metadata.userId`, and the webhook uses that value to update `public.profiles.founder_pro`.
