# Magic Land Firebase Auth and Data Security Notes

## Recommended Firebase products for the current website

- **Firebase Authentication** for optional guest identity: Google, email/password, and phone OTP.
- **Realtime Database** for booking and membership requests, public live park status, and signed-in guest profiles.
- **Firebase Analytics / GA4** for page, booking, membership, attraction, map, social, and auth events.
- **Cloud Functions** later for email notifications, payment confirmation, staff dashboards, and automated workflows. This usually requires Blaze billing and SMTP/API secrets.

## Current data model

```text
publicLiveStatus/
  operatingStatus
  hours
  avgWait
  nextShow
  currentCapacity
  maxCapacity

publicRequests/
  bookingRequests/{requestId}
  membershipRequests/{requestId}
  contactRequests/{requestId}
  eventRequests/{requestId}
  newsletterSubscribers/{requestId}

users/{uid}
  uid
  displayName
  email
  phoneNumber
  photoURL
  providerIds
  lastSeenAt

staff/{uid}
```

## Security posture

- Guests can create new public requests only. They cannot read all requests from the browser.
- Staff-only reads/writes should be handled by `staff/{uid}` checks or a future admin backend.
- Signed-in guests can read and update only their own `users/{uid}` profile.
- Booking remains one-step and does not require login, because forcing login before ticket interest usually reduces conversion.
- The website does not collect card details. Payment should be handled by a payment provider or staff-confirmed process.

## Console checklist

- Add authorized domains for every production domain:
  - `magiclandfunpark.com`
  - `www.magiclandfunpark.com`
  - Firebase Hosting domain
  - Vercel deployment domain
  - `localhost` for development
- Keep Google, Email/Password, and Phone providers enabled in Firebase Authentication.
- Phone login requires a real HTTPS domain and reCAPTCHA. Localhost works for testing.
- Create staff users manually first, then add their UID under `staff/{uid}` for admin access.

