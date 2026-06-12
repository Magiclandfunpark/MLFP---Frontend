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

1. Guest chooses a ticket.
2. Guest enters their name, phone number, email, visit date, and guest count.
3. Website creates a Firestore `bookingRequests` record with `visitorId` and `sessionId`.
4. Server creates `paymentIntents/{id}` with `status: initiated`.
5. Server calls Khalti/eSewa initiate API using secret key.
6. Guest is redirected to payment gateway.
7. Gateway returns to `/payment/success` or `/payment/failure`.
8. Server verifies payment with Khalti/eSewa lookup API.
9. Server updates `paymentIntents/{id}` and `payments/{id}` to `completed`.
10. Booking request status changes to `paid` or `confirmed`.

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

Use this public frontend variable in Vercel too, because this Firebase project uses a named Firestore database:

```env
VITE_FIREBASE_FIRESTORE_DATABASE_ID=default
```

For sandbox/testing, use sandbox URLs and sandbox keys only.

## eSewa development values

Use the private secret key eSewa sent you for `ESEWA_SECRET_KEY`.

```env
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=paste_esewa_epay_v2_secret_key_here
ESEWA_PAYMENT_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status/
```

Test payment credentials:

```text
eSewa ID: 9806800002 or 9806800003 or 9806800004 or 9806800005
Password: Nepal@123
MPIN: 1122
Token: 123456
```

## Firestore records needed before taking live payment

```text
paymentIntents/{paymentIntentId}
  requestType: bookingRequests
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
