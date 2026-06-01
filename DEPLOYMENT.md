# Founder Community Deployment

## Vercel

- Framework Preset: Next.js
- Build Command: `npm run build`
- Install Command: `npm install`
- Region: `fra1`

## Environment Variables

Set these variables in Vercel Project Settings:

```bash
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_FOUNDER_PRO_STRIPE_PRICE_OR_PRODUCT_ID=price_1TZXveIFneIajosQok3B8fgO

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Founder <no-reply@founder.example>
ADMIN_EMAIL=joinfounder@gmail.com
```

## Stripe Webhook

Create a Stripe webhook endpoint pointing to:

```text
https://your-production-domain.com/api/stripe/webhook
```

Required event:

```text
checkout.session.completed
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
