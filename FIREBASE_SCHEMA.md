# Magic Land Firebase Data Model

This project uses Firebase as the lightweight public request system first. Public users can create requests only. Staff/admin reads and updates are reserved for future authenticated staff accounts listed in the `staff/{uid}` collection.

Firestore is the source of truth for reservations, memberships, customers, future payments, and reporting. Realtime Database is used for public live park status and a mirrored copy of public requests for existing notification hooks and lightweight realtime workflows.

## Collections

- `bookingRequests`
  - Website ticket and visit reservations.
  - Fields: `name`, `phone`, `email`, `ticketName`, `unitPrice`, `guests`, `visitDate`, `note`, `total`, `paymentMethod`, `status`, `createdAt`, `source`, `pagePath`, `authUid`, `authEmail`, `authPhone`, `visitorId`, `sessionId`.

- `membershipRequests`
  - Membership purchase and callback requests.
  - Fields: `name`, `phone`, `email`, `planName`, `price`, `visits`, `validity`, `startDate`, `familyMembers`, `note`, `status`, `createdAt`, `source`, `pagePath`.

- `eventRequests`
  - Birthday, school, corporate, and group visit requests.
  - Fields: `name`, `phone`, `email`, `eventType`, `eventDate`, `guestCount`, `packageInterest`, `note`, `status`, `createdAt`, `source`, `pagePath`.

- `contactRequests`
  - General guest care messages.
  - Fields: `name`, `phone`, `email`, `topic`, `message`, `status`, `createdAt`, `source`, `pagePath`.

- `newsletterSubscribers`
  - Optional future marketing list.
  - Fields: `email`, `status`, `createdAt`, `source`, `pagePath`.

- `staff`
  - Internal allowlist for future authenticated admin users.
  - Create staff documents manually by Firebase Auth UID. Public writes are blocked by rules.

- `users`
  - Signed-in guest profiles keyed by Firebase Auth UID.
  - Fields: `uid`, `displayName`, `email`, `phoneNumber`, `photoURL`, `providerIds`, `visitorId`, `lastSeenAt`, `updatedAt`.

## Guest Identity

- Logged-in guests are attached to requests with `authUid`, `authEmail`, and `authPhone`.
- Non-logged-in guests are attached to requests with a stable browser `visitorId` plus a per-session `sessionId`.
- This lets the park match repeat inquiries without forcing login before checkout.

## Future Operational Collections

When the park operations dashboard is ready, add:

- `customers`
- `memberships`
- `visits`
- `payments`
- `passes`
- `attractionUsage`
- `staffTasks`
- `auditLogs`

## Checkout and Payment Approach

The website starts with a one-click reservation style flow: choose ticket or membership, enter name, phone, date, and submit. Khalti/eSewa should be added through server-side endpoints only. Never put Khalti or eSewa secret keys in `VITE_` variables or frontend code.

Recommended payment collections:

- `paymentIntents`
  - Created before redirecting to Khalti/eSewa.
  - Fields: `requestType`, `requestId`, `amount`, `currency`, `gateway`, `status`, `createdAt`, `updatedAt`, `customerName`, `customerPhone`.

- `payments`
  - Created or updated only after server-side gateway verification.
  - Fields: `paymentIntentId`, `gateway`, `gatewayTransactionId`, `amount`, `status`, `verifiedAt`, `rawGatewayStatus`.

## Realtime Database Paths

- `publicLiveStatus`
  - Public readable live status used by the homepage.
  - Fields: `operatingStatus`, `hours`, `avgWait`, `nextShow`, `currentCapacity`, `maxCapacity`.

- `rideLiveStatus`
  - Future public ride status/wait time feed.

- `publicRequests/{requestType}/{requestId}`
  - Spark-plan fallback for public requests when Firestore is unavailable.
  - `requestType` can be `bookingRequests`, `membershipRequests`, `contactRequests`, `eventRequests`, or `newsletterSubscribers`.
