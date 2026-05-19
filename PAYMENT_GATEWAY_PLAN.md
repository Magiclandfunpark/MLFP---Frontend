# Magic Land Khalti/eSewa Payment Plan

## Important rule

Never paste live Khalti or eSewa secret keys into:

- `VITE_...` frontend environment variables
- React code
- `src/`
- GitHub
- public Firebase config

Secret keys must live only in a server environment such as Vercel Serverless Functions, Firebase Cloud Functions, or another backend.

## Recommended checkout flow

1. Guest chooses ticket or membership.
2. Website creates a Firestore request: `bookingRequests` or `membershipRequests`.
3. Server creates `paymentIntents/{id}` with `status: initiated`.
4. Server calls Khalti/eSewa initiate API using secret key.
5. Guest is redirected to payment gateway.
6. Gateway returns to `/payment/success` or `/payment/failure`.
7. Server verifies payment with Khalti/eSewa lookup API.
8. Server updates `paymentIntents/{id}` and `payments/{id}` to `completed`.
9. Booking/membership request status changes to `paid` or `confirmed`.

## Vercel environment variable format

Use these names only in Vercel serverless functions. Do not prefix secrets with `VITE_`.

```env
KHALTI_SECRET_KEY=live_secret_key_from_khalti_merchant
KHALTI_INITIATE_URL=https://a.khalti.com/api/v2/epayment/initiate/
KHALTI_LOOKUP_URL=https://a.khalti.com/api/v2/epayment/lookup/

ESEWA_MERCHANT_CODE=your_esewa_merchant_code
ESEWA_SECRET_KEY=your_esewa_secret_key
ESEWA_PAYMENT_URL=https://epay.esewa.com.np/api/epay/main/v2/form
ESEWA_VERIFY_URL=https://epay.esewa.com.np/api/epay/transaction/status/

PAYMENT_BASE_URL=https://magiclandfunpark.com
```

For sandbox/testing, use sandbox URLs and sandbox keys only.

## Firestore records needed before taking live payment

```text
paymentIntents/{paymentIntentId}
  requestType: bookingRequests | membershipRequests
  requestId: Firestore request id
  gateway: khalti | esewa
  amount: number
  currency: NPR
  status: initiated | pending | completed | failed | cancelled
  customerName
  customerPhone
  createdAt
  updatedAt

payments/{paymentId}
  paymentIntentId
  gateway
  gatewayTransactionId
  amount
  status
  verifiedAt
  rawGatewayStatus
```

## Production readiness checklist

- Use server-side payment initiation and verification.
- Verify every payment amount server-side.
- Prevent transaction reuse by storing Khalti `pidx` and eSewa `transaction_uuid`.
- Do not mark a booking paid from URL parameters alone.
- Use HTTPS domain in Khalti/eSewa merchant dashboard callback URLs.
- Test sandbox end-to-end before switching live keys.

