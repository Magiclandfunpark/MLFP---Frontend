# Email Notifications

Booking, membership, event, contact, and newsletter requests are saved to Realtime Database under:

`publicRequests/{requestType}/{requestId}`

Verified payment receipts are saved under:

`paymentReceipts/{gateway}/{receiptId}`

Firebase does not send email directly from the frontend. The safe setup is a Cloud Functions trigger that sends email after a request or verified payment receipt is created.

## Email Templates

The functions send branded emails for request and account events:

- Staff notification to `BOOKING_NOTIFICATION_EMAIL`
- Guest confirmation email when the request contains an email address
- Verified payment receipt emails after Khalti or eSewa returns successfully
- Welcome email when a new guest profile is created

Templates are branded HTML emails using Magic Land colors, a clear details table, and a fallback plain-text version for deliverability.

## Recommended Setup: Google Workspace Gmail API

1. Upgrade the Firebase project to Blaze if Cloud Functions deployment is required.
2. Enable Gmail API in the Google Cloud project.
3. Create an OAuth Desktop client in Google Auth Platform.
4. Generate a Gmail refresh token with:

```bash
node ./scripts/generate-gmail-refresh-token.mjs
```

Sign in as `info@magiclandfunpark.com` and approve Gmail send permission.

5. Set function secrets:

```bash
firebase functions:secrets:set GMAIL_CLIENT_ID --project magic-land-fun-park
firebase functions:secrets:set GMAIL_CLIENT_SECRET --project magic-land-fun-park
firebase functions:secrets:set GMAIL_REFRESH_TOKEN --project magic-land-fun-park
firebase functions:secrets:set GMAIL_SENDER_EMAIL --project magic-land-fun-park
firebase functions:secrets:set BOOKING_NOTIFICATION_EMAIL --project magic-land-fun-park
```

Use `info@magiclandfunpark.com` for `GMAIL_SENDER_EMAIL`.
For `BOOKING_NOTIFICATION_EMAIL`, use:

```text
info@magiclandfunpark.com,prabinthapaliyaus@gmail.com
```

6. Deploy the email functions:

```bash
firebase deploy --only functions:emailPublicRequest,functions:emailPaymentReceipt,functions:emailUserWelcome --project magic-land-fun-park
```

7. Deploy Realtime Database rules so payment receipt events can be recorded by signed-in guests:

```bash
firebase deploy --only database --project magic-land-fun-park
```

## Why Not Frontend Email?

Putting SMTP credentials or email API keys in the React app would expose them publicly. The backend trigger keeps credentials private and prevents abuse.

## DNS Deliverability

In Namecheap DNS, keep Google MX records active and add:

- SPF TXT at `@`: `v=spf1 include:_spf.google.com ~all`
- DKIM TXT from Google Admin at `google._domainkey`
- DMARC TXT at `_dmarc`: `v=DMARC1; p=none; rua=mailto:info@magiclandfunpark.com`
