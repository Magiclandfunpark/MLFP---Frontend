# Magic Land Firebase Data Model

This project uses Firebase as the lightweight public request system first. Public users can create requests only. Staff/admin reads and updates are reserved for future authenticated staff accounts listed in the `staff/{uid}` collection.

Firestore is the recommended long-term database for reservations, memberships, customers, payments, and reporting. Realtime Database is used for live park status and as a Spark-plan fallback for public requests while Firestore billing/default database setup is pending.

## Collections

- `bookingRequests`
  - Website ticket and visit reservations.
  - Fields: `name`, `phone`, `email`, `ticketName`, `unitPrice`, `guests`, `visitDate`, `note`, `total`, `status`, `createdAt`, `source`, `pagePath`.

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

## Checkout Approach

The website should start with a one-click reservation style flow: choose ticket or membership, enter name, phone, date, and submit. Payment can be added later with a hosted gateway or Firebase Cloud Functions once the business decides on the provider.

## Realtime Database Paths

- `publicLiveStatus`
  - Public readable live status used by the homepage.
  - Fields: `operatingStatus`, `hours`, `avgWait`, `nextShow`, `currentCapacity`, `maxCapacity`.

- `rideLiveStatus`
  - Future public ride status/wait time feed.

- `publicRequests/{requestType}/{requestId}`
  - Spark-plan fallback for public requests when Firestore is unavailable.
  - `requestType` can be `bookingRequests`, `membershipRequests`, `contactRequests`, `eventRequests`, or `newsletterSubscribers`.
