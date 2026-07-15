# Pharma2U backend

To install dependencies:

```bash
npm install
cp .env.example .env
npm run prisma:generate
```

To run:

```bash
npm run dev
```

Apply the committed Prisma migrations to the target database before starting the API.

## Razorpay

Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in `.env`. The legacy names `RAZORPAY_KEY` and `RAZORPAY_SECRET` are also accepted for the API credentials.

In the Razorpay Dashboard, configure the public webhook URL as:

```text
https://YOUR_API_HOST/api/payments/razorpay/webhook
```

Subscribe to `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed`, and `refund.failed`. Use Test Mode keys and a Test Mode webhook first, then replace them with Live Mode credentials for production. The webhook secret is a separate value chosen while creating the webhook; it is not the Razorpay API key secret.
