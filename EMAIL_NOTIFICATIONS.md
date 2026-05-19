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

## Recommended Setup

1. Upgrade the Firebase project to Blaze if Cloud Functions deployment is required.
2. Prepare an SMTP sender such as Google Workspace SMTP, SendGrid, Mailgun, or another transactional email provider.
3. Set function secrets:

```bash
firebase functions:secrets:set SMTP_HOST --project magic-land-fun-park
firebase functions:secrets:set SMTP_PORT --project magic-land-fun-park
firebase functions:secrets:set SMTP_USER --project magic-land-fun-park
firebase functions:secrets:set SMTP_PASS --project magic-land-fun-park
firebase functions:secrets:set BOOKING_NOTIFICATION_EMAIL --project magic-land-fun-park
```

Use `info@magiclandfunpark.com` for `BOOKING_NOTIFICATION_EMAIL`.
For staff copies, use:

```text
info@magiclandfunpark.com,prabinthapaliyaus@gmail.com
```

`SMTP_PASS` is not created in Firebase Service Accounts. It should be a Google Workspace Gmail app password or SMTP provider password, stored with `firebase functions:secrets:set SMTP_PASS`.

4. Deploy the email functions:

```bash
firebase deploy --only functions:emailPublicRequest,functions:emailPaymentReceipt,functions:emailUserWelcome --project magic-land-fun-park
```

5. Deploy Realtime Database rules so payment receipt events can be recorded by signed-in guests:

```bash
firebase deploy --only database --project magic-land-fun-park
```

## Why Not Frontend Email?

Putting SMTP credentials or email API keys in the React app would expose them publicly. The backend trigger keeps credentials private and prevents abuse.
