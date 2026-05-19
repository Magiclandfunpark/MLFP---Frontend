# Email Notifications

Booking and membership requests are currently saved to Realtime Database under:

`publicRequests/{requestType}/{requestId}`

Firebase does not send email directly from the frontend. The safe production setup is a backend trigger that sends email after a request is created.

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

4. Deploy the email function:

```bash
firebase deploy --only functions:emailPublicRequest --project magic-land-fun-park
```

## Why Not Frontend Email?

Putting SMTP credentials or email API keys in the React app would expose them publicly. The backend trigger keeps credentials private and prevents abuse.
