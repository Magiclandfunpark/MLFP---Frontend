# Magic Land Staff Auth and Data Security Notes

## Recommended Firebase products for the current website

- **Firebase Authentication** only for approved staff and admin access.
- **Realtime Database** for booking and guest requests plus public live park status.
- **Firebase Analytics / GA4** for page, booking, attraction, map, and social events.
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
  contactRequests/{requestId}
  eventRequests/{requestId}
  newsletterSubscribers/{requestId}

staff/{uid}
```

## Security posture

- Guests can create new public requests only. They cannot read all requests from the browser.
- Staff-only reads/writes should be handled by `staff/{uid}` checks or a future admin backend.
- Public guests do not create accounts. Their booking contact details are stored only with the request.
- Booking remains one-step and does not require login.
- The website does not collect card details. Payment should be handled by a payment provider or staff-confirmed process.

## Console checklist

- Keep Email/Password enabled for staff authentication.
- Add `staff.magiclandfunpark.com` and `admin.magiclandfunpark.com` to Firebase Authentication authorized domains.
- Create staff users manually, then add their UID under `staff/{uid}` with an active role.
