# Magic Land Complete Firebase and Local-System API Guide

## 1. Purpose

This document defines how the Magic Land website, Firebase, payment gateways, staff scanner, and the park's local MySQL ticketing system should connect.

The goal is one consistent record for every customer, order, payment, ticket, annual pass, and gate visit, whether the sale starts online or at the park.

## 2. Recommended Architecture

```text
Customer Website
    |
    | Firebase Web SDK and website HTTPS APIs
    v
Firestore + Realtime Database
    |
    | Firebase Cloud Functions / secured sync service
    v
Local Park HTTPS API (static public IP or protected domain)
    |
    v
Local MySQL -> Ticket Counter -> Printer -> Gate Scanner
```

Important constraints supplied by the local-system vendor:

- The local server cannot call Firebase or other external APIs.
- The online backend must push data to the local server.
- The local server must expose a secured inbound API through a static public IP or domain.
- When connectivity returns, the online sync service must retry unsynced records.

## 3. Does the Local Developer Need Firestore APIs?

Firestore access is required in the online sync layer, but the local park developer should **not** receive unrestricted Firebase credentials.

The responsibilities should be separated:

| Component | Firebase access | Local API access |
| --- | --- | --- |
| Public website | Restricted Firebase Web SDK access governed by Security Rules | None |
| Staff website | Firebase Auth plus restricted Firestore access | Optional through the backend only |
| Firebase Cloud Functions / sync backend | Firebase Admin SDK | Yes |
| Local MySQL server | No direct Firebase access | Hosts the local API |
| Ticket counters/scanners | Local LAN only | Local API/database only |

The local vendor needs the local API contract and field mapping. They do not need Firebase API keys, service-account keys, Khalti secrets, eSewa secrets, Gmail tokens, or database passwords.

## 4. Firebase Project Information

```text
Firebase project ID: magic-land-fun-park
Firestore database ID: default
Realtime Database:
https://magic-land-fun-park-default-rtdb.firebaseio.com
Firebase Auth domain:
magic-land-fun-park.firebaseapp.com
```

Do not include secret values in this document or send them by chat/email.

## 5. Firebase APIs and SDKs Used

### 5.0 Configuring the Local-System Endpoint in Firebase

The local-system endpoint must be configured in **Firebase Cloud Functions Secret Manager**, not inside the public website and not inside Firestore documents.

Current public API base URL from the vendor documentation:

```text
https://magicland.nexusgurus.com
```

Firebase functions use these secrets:

```text
LOCAL_API_BASE_URL
LOCAL_API_BEARER_TOKEN
```

The bearer token must be sent as an HTTP header:

```http
Authorization: Bearer <token>
```

Do not send the token as a query parameter such as `?Authorization=...`.

PowerShell setup from the project folder:

```powershell
Set-Location "C:\Users\acer\Documents\Magic Land Website & App"
firebase login --reauth

$tmpBase = New-TemporaryFile
Set-Content -LiteralPath $tmpBase -Value "https://magicland.nexusgurus.com" -NoNewline
firebase functions:secrets:set LOCAL_API_BASE_URL --project magic-land-fun-park --data-file $tmpBase --force
Remove-Item -LiteralPath $tmpBase -Force

$token = Read-Host "Paste local API bearer token"
$tmpToken = New-TemporaryFile
Set-Content -LiteralPath $tmpToken -Value $token -NoNewline
firebase functions:secrets:set LOCAL_API_BEARER_TOKEN --project magic-land-fun-park --data-file $tmpToken --force
Remove-Item -LiteralPath $tmpToken -Force
Remove-Variable token

firebase deploy --only functions:syncBookingRequestToLocal,functions:syncPaymentReceiptToLocal --project magic-land-fun-park
```

The website already writes public booking and payment events into Firebase. The sync functions listen to those Firebase events and push the matching customer, order, and payment records to the local API.

Sync status is written to Realtime Database:

```text
/localSync/bookingRequests/{requestId}
/localSync/paymentReceipts/{gateway}/{receiptId}
```

Expected status values:

```json
{
  "status": "synced",
  "externalCustomerId": "web_customer_guest_example_com",
  "externalOrderId": "web_order_abc123",
  "endpoint": "https://magicland.nexusgurus.com",
  "updatedAt": "2026-06-26T07:45:00.000Z"
}
```

Failed sync example:

```json
{
  "status": "failed",
  "error": "Local API PUT /api/v1/orders/web_order_abc123 failed (401): Unauthorized",
  "endpoint": "https://magicland.nexusgurus.com",
  "updatedAt": "2026-06-26T07:45:00.000Z"
}
```

### 5.1 Cloud Firestore API

Purpose:

- Source of truth for website booking requests.
- Staff lookup and check-in state.
- Future orders, payments, tickets, passes, visits, audit logs, and sync status.

Preferred server access:

- Firebase Admin SDK from Cloud Functions.
- Application Default Credentials in Google-managed environments.

REST base URL when REST is genuinely required:

```text
https://firestore.googleapis.com/v1/projects/magic-land-fun-park/databases/default/documents
```

REST requests must use an OAuth 2.0 bearer token. Do not use the Firebase Web API key as server authorization.

Official references:

- https://firebase.google.com/docs/admin/setup
- https://firebase.google.com/docs/firestore/use-rest-api
- https://cloud.google.com/firestore/docs/reference/rest

### 5.2 Firebase Realtime Database API

Purpose:

- Public live park status.
- Lightweight mirrored public requests.
- Existing Cloud Function email triggers.

REST base URL:

```text
https://magic-land-fun-park-default-rtdb.firebaseio.com
```

REST paths end with `.json`, for example:

```text
GET /publicLiveStatus.json
```

Public and private access is controlled by `database.rules.json`. Server-side Admin SDK access bypasses client rules and must be protected with IAM.

Official reference:

- https://firebase.google.com/docs/database/rest/start

### 5.3 Firebase Authentication / Identity Toolkit

Purpose:

- Staff and admin login only.
- Public ticket buyers do not need accounts.

The local system must not authenticate park customers through Firebase. Local staff identities can remain separate unless a future single-sign-on project is approved.

### 5.4 Cloud Functions API

Current deployed functions:

- `emailPublicRequest`: sends customer/staff notifications from new public requests.
- `emailPaymentReceipt`: handles verified payment-receipt notifications where used.

Recommended new functions:

- `syncBookingToLocal`: sends each new/updated online order to the local API.
- `syncPaymentToLocal`: sends only server-verified payments.
- `retryLocalSync`: retries queued failures on a schedule.
- `reconcileLocalChanges`: polls the local `/sync/changes` endpoint and updates Firestore.

Official references:

- https://firebase.google.com/docs/functions/firestore-events
- https://firebase.google.com/docs/functions/schedule-functions

### 5.5 Firebase Storage API

Possible future purpose:

- Ticket/pass assets that cannot be generated dynamically.
- Controlled internal exports.

Do not store gateway secrets, database backups, service-account files, or unrestricted customer exports in public Storage paths.

### 5.6 Analytics API

Purpose:

- Website conversion and checkout-event measurement.
- Not a source of truth for orders or payments.

Analytics data must never be used to decide whether a customer has paid or whether a QR is valid.

## 6. How to Get the Firebase Configuration

### Public web configuration

Firebase Console:

```text
Project Settings -> General -> Your apps -> Web app -> SDK setup and configuration
```

The website uses these environment-variable names:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_FIREBASE_FIRESTORE_DATABASE_ID=default
```

This web configuration identifies the Firebase project; it does not grant unrestricted database access. Firestore and Realtime Database rules remain mandatory.

### Server credentials

For Firebase Cloud Functions, use the Admin SDK with Application Default Credentials. No downloaded JSON key is required.

```js
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore('default')
```

For a backend outside Google Cloud, prefer Workload Identity Federation. If a service-account key is unavoidable, create a dedicated least-privilege account, store its JSON only in the backend's secret manager, rotate it, and never send it to the local vendor.

Recommended minimum Firestore role for a dedicated sync service:

```text
roles/datastore.user
```

Use a read-only role instead if the service only reads. Do not grant Owner or Editor.

Official IAM reference:

- https://cloud.google.com/firestore/docs/security/iam

## 7. Current Firestore Collections

### `bookingRequests/{requestId}`

Current website order record:

```json
{
  "name": "Guest name",
  "phone": "98XXXXXXXX",
  "email": "guest@example.com",
  "ticketName": "One-Time Entry | Gift Ticket | Group Day Visit | Yearly Unlimited Pass",
  "unitPrice": 1500,
  "guests": 1,
  "visitDate": "2026-07-01",
  "note": "",
  "total": 1500,
  "paymentMethod": "khalti | esewa | pay_at_park",
  "status": "new | checked_in | active",
  "source": "website",
  "pagePath": "/tickets",
  "visitorId": "browser visitor ID",
  "sessionId": "browser session ID",
  "createdAt": "Firestore server timestamp"
}
```

For `Yearly Unlimited Pass`:

```json
{
  "ticketName": "Yearly Unlimited Pass",
  "unitPrice": 29999,
  "guests": 1,
  "total": 29999,
  "visitDate": "activation date",
  "status": "new | active",
  "visitCount": 0,
  "lastCheckedInAt": null
}
```

### `eventRequests/{requestId}`

Birthday, school, corporate, and group-event requests.

Important fields:

```text
name, phone, email, eventType, eventDate, guestCount,
packageInterest, note, status, source, createdAt
```

### `contactRequests/{requestId}`

Guest-care enquiries.

### `newsletterSubscribers/{requestId}`

Optional marketing subscriptions.

### `staff/{uid}`

Staff authorization profile. Public writes are blocked.

## 8. Recommended Operational Firestore Collections

These collections should be introduced for reliable website/local synchronization instead of overloading `bookingRequests`:

### `customers/{customerId}`

```text
fullName, normalizedPhone, normalizedEmail, localCustomerId,
createdAt, updatedAt, source
```

### `orders/{orderId}`

```text
requestId, customerId, productCode, productName, quantity,
unitPrice, discountAmount, totalAmount, currency,
visitOrActivationDate, paymentMethod, paymentStatus, orderStatus,
localOrderId, syncStatus, syncAttempts, lastSyncError,
createdAt, updatedAt
```

### `payments/{paymentId}`

```text
orderId, gateway, gatewayTransactionId, amount, currency,
status, verifiedAt, refundedAmount, localPaymentId,
syncStatus, createdAt, updatedAt
```

### `tickets/{ticketId}`

```text
orderId, customerId, productCode, qrTokenHash, ticketNumber,
validDate, status, localTicketId, issuedAt, checkedInAt
```

### `passes/{passId}`

```text
orderId, customerId, holderName, productCode,
activationDate, expiryDate, status, qrTokenHash,
visitCount, lastVisitAt, localPassId
```

### `visits/{visitId}`

```text
ticketId or passId, customerId, gateId, staffId, deviceId,
source, localVisitId, checkedInAt
```

### `syncOutbox/{jobId}`

```text
entityType, entityId, operation, payloadVersion,
status, attempts, nextAttemptAt, lastError,
createdAt, updatedAt
```

### `syncState/{source}`

Stores the local reconciliation cursor and last successful sync time.

### `auditLogs/{logId}`

Immutable staff/admin/system action history.

## 9. Current Realtime Database Paths

```text
publicLiveStatus
rideLiveStatus
publicRequests/bookingRequests/{requestId}
publicRequests/contactRequests/{requestId}
publicRequests/eventRequests/{requestId}
publicRequests/newsletterSubscribers/{requestId}
```

`publicRequests` currently triggers notification functions. Firestore should remain the business source of truth.

## 10. API Conventions

### 10.1 Environments and base URLs

```text
Website production: https://magiclandfunpark.com
Local vendor sandbox: https://sandbox-api.<vendor-domain>
Local vendor production: https://api.<park-domain-or-static-IP>
```

The vendor must provide the real sandbox and production base URLs. Production must use HTTPS with a valid certificate.

### 10.2 Required local API headers

All online-to-local write requests must include:

```http
Authorization: Bearer <server-to-server-token>
Content-Type: application/json
Accept: application/json
Idempotency-Key: <entity-type>:<external-id>:<payload-version>
X-MagicLand-Timestamp: 1782194400
X-MagicLand-Signature: <optional HMAC-SHA256 hex digest>
```

The bearer token and HMAC secret must be exchanged through a secure secret channel, never embedded in the website or this document.

### 10.3 Data conventions

| Data | Format |
| --- | --- |
| Currency | `NPR` |
| Money | Integer Nepalese rupees unless a field explicitly says paisa |
| Date | `YYYY-MM-DD` |
| Timestamp | ISO 8601 UTC, for example `2026-06-23T10:00:00Z` |
| Phone | Normalized Nepal number, preferably E.164 such as `+9779803043824` |
| IDs | Opaque strings; never infer business meaning from an ID |
| Boolean | JSON `true` or `false` |
| Null | JSON `null`, not an empty string |

### 10.4 Standard local API success envelope

```json
{
  "success": true,
  "requestId": "req_01JY5S9M3A",
  "data": {},
  "processedAt": "2026-06-23T10:00:02Z"
}
```

### 10.5 Standard local API error envelope

```json
{
  "success": false,
  "requestId": "req_01JY5S9M3A",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fieldErrors": {
      "customer.phone": "A valid phone number is required."
    },
    "retryable": false
  },
  "processedAt": "2026-06-23T10:00:02Z"
}
```

Recommended HTTP statuses:

| Status | Meaning |
| --- | --- |
| `200` | Read/update succeeded or idempotent replay returned the original result |
| `201` | New local resource created |
| `400` | Invalid JSON, field, state transition, or business rule |
| `401` | Missing or invalid server credential |
| `403` | Credential is valid but lacks permission |
| `404` | Resource does not exist |
| `409` | ID is already bound to conflicting data |
| `422` | Valid JSON but cannot be processed under current business rules |
| `429` | Rate limit reached; include `Retry-After` |
| `500` | Unexpected local error |
| `503` | Local API or MySQL is temporarily unavailable; retry is allowed |

## 11. Firebase API Request and Response Examples

These examples explain the Firebase layer. The local vendor must not call these endpoints or receive Firebase credentials.

### 11.1 Firestore Admin SDK: read a booking

```js
const snapshot = await db.collection('bookingRequests').doc(requestId).get()
if (!snapshot.exists) throw new Error('Booking not found')
const booking = { id: snapshot.id, ...snapshot.data() }
```

Conceptual result:

```json
{
  "id": "bk_01JY5S9M3A",
  "name": "Prabin Thapaliya",
  "email": "guest@example.com",
  "phone": "+9779803043824",
  "ticketName": "One-Time Entry",
  "guests": 2,
  "total": 3000,
  "status": "new"
}
```

### 11.2 Firestore REST: read one document

```http
GET https://firestore.googleapis.com/v1/projects/magic-land-fun-park/databases/default/documents/bookingRequests/bk_01JY5S9M3A
Authorization: Bearer <Google-OAuth-access-token>
Accept: application/json
```

Example response:

```json
{
  "name": "projects/magic-land-fun-park/databases/default/documents/bookingRequests/bk_01JY5S9M3A",
  "fields": {
    "name": { "stringValue": "Prabin Thapaliya" },
    "guests": { "integerValue": "2" },
    "total": { "integerValue": "3000" },
    "status": { "stringValue": "new" }
  },
  "createTime": "2026-06-23T10:00:00.000000Z",
  "updateTime": "2026-06-23T10:00:00.000000Z"
}
```

### 11.3 Realtime Database: read public park status

```http
GET https://magic-land-fun-park-default-rtdb.firebaseio.com/publicLiveStatus.json
Accept: application/json
```

Example response:

```json
{
  "isOpen": true,
  "message": "Open today",
  "updatedAt": 1782194400000
}
```

Private RTDB reads/writes require Firebase Authentication or Admin SDK authorization according to `database.rules.json`.

## 12. Existing Website HTTPS API Contracts

These endpoints already exist on `https://magiclandfunpark.com`. Payment amounts are recalculated on the server. Clients cannot choose arbitrary prices.

Current ticket rules used by the payment APIs:

| Product | Unit price | Rule |
| --- | ---: | --- |
| One-Time Entry | Rs. 1,500 | Quantity 1-50 |
| Gift Ticket | Rs. 1,500 | Quantity 1-50 |
| Group Day Visit | Rs. 1,500 | Quantity 1-50 |
| Yearly Unlimited Pass | Rs. 29,999 | Quantity must be exactly 1 |

For non-annual tickets, 6-9 guests receive 5% off and 10 or more guests receive 10% off.

### 12.1 `POST /api/khalti/initiate`

Starts a Khalti checkout after validating the product and amount.

Request:

```http
POST /api/khalti/initiate HTTP/1.1
Host: magiclandfunpark.com
Content-Type: application/json
```

```json
{
  "amount": 3000,
  "purchaseOrderId": "bk_01JY5S9M3A",
  "purchaseOrderName": "One-Time Entry",
  "productType": "ticket",
  "guests": 2,
  "customerInfo": {
    "name": "Prabin Thapaliya",
    "email": "guest@example.com",
    "phone": "+9779803043824"
  }
}
```

Success `200`:

```json
{
  "pidx": "xYzKhaltiPaymentId",
  "payment_url": "https://pay.khalti.com/?pidx=xYzKhaltiPaymentId",
  "expires_at": "2026-06-23T10:30:00Z",
  "expires_in": 1800
}
```

Price validation failure `400`:

```json
{
  "error": "Payment amount does not match Magic Land pricing.",
  "expectedAmount": 3000
}
```

### 12.2 `POST /api/khalti/verify`

Looks up the transaction with Khalti and verifies completion, paid amount, and purchase-order ID.

Request:

```json
{
  "pidx": "xYzKhaltiPaymentId",
  "amount": 3000,
  "purchaseOrderId": "bk_01JY5S9M3A",
  "customerInfo": {
    "name": "Prabin Thapaliya",
    "email": "guest@example.com",
    "phone": "+9779803043824",
    "productType": "ticket"
  }
}
```

Success `200`:

```json
{
  "status": "verified",
  "amountMatches": true,
  "orderMatches": true,
  "paidAmount": 3000,
  "rawStatus": "Completed",
  "data": {
    "pidx": "xYzKhaltiPaymentId",
    "total_amount": 300000,
    "status": "Completed",
    "purchase_order_id": "bk_01JY5S9M3A",
    "purchase_order_name": "One-Time Entry"
  }
}
```

Not verified `400`:

```json
{
  "status": "not_verified",
  "amountMatches": false,
  "orderMatches": true,
  "paidAmount": 1500,
  "rawStatus": "Completed",
  "data": {}
}
```

### 12.3 `POST /api/esewa/initiate`

Validates the price and returns a signed eSewa HTML form configuration. The browser must POST all returned `fields` to `action`; it must not navigate to the action URL using GET.

Request:

```json
{
  "amount": 13500,
  "purchaseOrderId": "bk_01JY5GROUP10",
  "purchaseOrderName": "Group Day Visit",
  "productType": "ticket",
  "guests": 10,
  "customerInfo": {
    "name": "Magic Land School Group",
    "email": "coordinator@example.edu",
    "phone": "+9779803043824"
  }
}
```

Success `200`:

```json
{
  "action": "https://epay.esewa.com.np/api/epay/main/v2/form",
  "mode": "production",
  "fields": {
    "amount": "13500",
    "tax_amount": "0",
    "total_amount": "13500",
    "transaction_uuid": "bk-01JY5GROUP10-1782194400000",
    "product_code": "<configured-merchant-code>",
    "product_service_charge": "0",
    "product_delivery_charge": "0",
    "success_url": "https://magiclandfunpark.com/payment/esewa/return?...",
    "failure_url": "https://magiclandfunpark.com/payment/esewa/failure?...",
    "signed_field_names": "total_amount,transaction_uuid,product_code",
    "signature": "<server-generated-HMAC-signature>"
  }
}
```

Validation failure uses the same `400` format as Khalti initiation.

### 12.4 `POST /api/esewa/verify`

Decodes eSewa's Base64 return payload, checks status with eSewa, and verifies that the transaction UUID belongs to the expected order.

Request:

```json
{
  "data": "<base64-encoded-eSewa-return-payload>",
  "purchaseOrderId": "bk_01JY5GROUP10",
  "customerInfo": {
    "name": "Magic Land School Group",
    "email": "coordinator@example.edu",
    "phone": "+9779803043824",
    "productType": "ticket",
    "purchaseOrderName": "Group Day Visit"
  }
}
```

Success `200`:

```json
{
  "status": "verified",
  "orderMatches": true,
  "decoded": {
    "transaction_code": "000ABC1",
    "status": "COMPLETE",
    "total_amount": 13500,
    "transaction_uuid": "bk-01JY5GROUP10-1782194400000",
    "product_code": "<configured-merchant-code>"
  },
  "data": {
    "status": "COMPLETE",
    "ref_id": "000ABC1",
    "total_amount": 13500,
    "transaction_uuid": "bk-01JY5GROUP10-1782194400000"
  }
}
```

Missing return payload `400`:

```json
{ "error": "Missing eSewa return data." }
```

### 12.5 `GET /api/google/reviews`

Returns cached public Google Business review data. It accepts no request body and requires no public credential.

Request:

```http
GET /api/google/reviews HTTP/1.1
Host: magiclandfunpark.com
Accept: application/json
```

Success `200`:

```json
{
  "name": "Magic Land Family Fun Park",
  "rating": 4.7,
  "userRatingCount": 126,
  "googleMapsUri": "https://maps.google.com/...",
  "reviews": [
    {
      "authorName": "Google reviewer",
      "authorUri": "https://www.google.com/maps/contrib/...",
      "authorPhotoUri": "https://lh3.googleusercontent.com/...",
      "rating": 5,
      "relativePublishTimeDescription": "2 weeks ago",
      "text": "A fun family day out."
    }
  ]
}
```

Configuration failure `503`:

```json
{ "error": "Google reviews are not configured." }
```

## 13. Local-System API Contracts Required From Vendor

The endpoints below are **proposed required contracts**. The vendor must confirm or return an equivalent OpenAPI specification before implementation begins.

### 13.1 `GET /api/v1/health`

Request body: none. Authentication may be optional for a minimal status response, but detailed database information must require authorization.

Success `200`:

```json
{
  "success": true,
  "requestId": "req_health_001",
  "data": {
    "service": "magic-land-local-api",
    "status": "healthy",
    "version": "1.0.0",
    "database": "connected",
    "serverTime": "2026-06-23T10:00:02Z"
  },
  "processedAt": "2026-06-23T10:00:02Z"
}
```

Unavailable `503`: use the standard error envelope with code `SERVICE_UNAVAILABLE` and `retryable: true`.

### 13.2 `GET /api/v1/catalog/products`

Optional query parameters:

```text
active=true
updatedAfter=2026-06-01T00:00:00Z
cursor=<opaque-cursor>
limit=100
```

Example request:

```http
GET /api/v1/catalog/products?active=true&limit=100
Authorization: Bearer <token>
Accept: application/json
```

Success `200`:

```json
{
  "success": true,
  "requestId": "req_catalog_001",
  "data": {
    "products": [
      {
        "productCode": "DAY_ENTRY",
        "name": "One-Time Entry",
        "unitPrice": 1500,
        "currency": "NPR",
        "active": true,
        "minQuantity": 1,
        "maxQuantity": 50,
        "pricingRules": [
          { "minimumQuantity": 6, "maximumQuantity": 9, "discountPercent": 5 },
          { "minimumQuantity": 10, "maximumQuantity": 50, "discountPercent": 10 }
        ],
        "updatedAt": "2026-06-23T09:00:00Z"
      },
      {
        "productCode": "ANNUAL_UNLIMITED",
        "name": "Yearly Unlimited Pass",
        "unitPrice": 29999,
        "currency": "NPR",
        "active": true,
        "minQuantity": 1,
        "maxQuantity": 1,
        "validityDays": 365,
        "updatedAt": "2026-06-23T09:00:00Z"
      }
    ],
    "nextCursor": null
  },
  "processedAt": "2026-06-23T10:00:02Z"
}
```

### 13.3 `PUT /api/v1/customers/{externalCustomerId}`

Creates or updates a customer idempotently.

Request:

```http
PUT /api/v1/customers/cus_01JY5S9M3A
Authorization: Bearer <token>
Content-Type: application/json
Idempotency-Key: customer:cus_01JY5S9M3A:1
```

```json
{
  "schemaVersion": 1,
  "externalCustomerId": "cus_01JY5S9M3A",
  "fullName": "Prabin Thapaliya",
  "phone": "+9779803043824",
  "email": "guest@example.com",
  "source": "website",
  "consent": {
    "transactionalEmail": true,
    "marketingEmail": false
  },
  "websiteCreatedAt": "2026-06-23T09:59:00Z",
  "websiteUpdatedAt": "2026-06-23T10:00:00Z"
}
```

Success `200` or `201`:

```json
{
  "success": true,
  "requestId": "req_customer_001",
  "data": {
    "externalCustomerId": "cus_01JY5S9M3A",
    "localCustomerId": "C0001842",
    "status": "active",
    "created": true
  },
  "processedAt": "2026-06-23T10:00:02Z"
}
```

### 13.4 `PUT /api/v1/orders/{externalOrderId}`

Creates or updates an online order idempotently. The path ID and body `externalOrderId` must match.

Request:

```json
{
  "schemaVersion": 1,
  "payloadVersion": 1,
  "externalOrderId": "ord_01JY5S9M3A",
  "externalCustomerId": "cus_01JY5S9M3A",
  "productCode": "ANNUAL_UNLIMITED",
  "productName": "Yearly Unlimited Pass",
  "quantity": 1,
  "unitPrice": 29999,
  "subtotalAmount": 29999,
  "discountAmount": 0,
  "totalAmount": 29999,
  "currency": "NPR",
  "visitOrActivationDate": "2026-07-01",
  "paymentMethod": "khalti",
  "paymentStatus": "paid",
  "orderStatus": "confirmed",
  "customer": {
    "fullName": "Prabin Thapaliya",
    "phone": "+9779803043824",
    "email": "guest@example.com"
  },
  "websiteCreatedAt": "2026-06-23T10:00:00Z",
  "websiteUpdatedAt": "2026-06-23T10:00:00Z"
}
```

Success `200` or `201`:

```json
{
  "success": true,
  "requestId": "req_order_001",
  "data": {
    "externalOrderId": "ord_01JY5S9M3A",
    "localOrderId": "O2026000123",
    "localCustomerId": "C0001842",
    "orderStatus": "confirmed",
    "paymentStatus": "paid",
    "created": true
  },
  "processedAt": "2026-06-23T10:00:02Z"
}
```

Conflict `409`: return code `IDEMPOTENCY_CONFLICT` when the same external ID or idempotency key is reused with different immutable values.

### 13.5 `PUT /api/v1/payments/{externalPaymentId}`

Only the online backend may call this endpoint, and only after server-side payment verification.

Request:

```json
{
  "schemaVersion": 1,
  "externalPaymentId": "pay_01JY5T2W8N",
  "externalOrderId": "ord_01JY5S9M3A",
  "gateway": "khalti",
  "gatewayTransactionId": "xYzKhaltiPaymentId",
  "amount": 29999,
  "currency": "NPR",
  "status": "paid",
  "verifiedAt": "2026-06-23T10:05:00Z",
  "refundedAmount": 0,
  "websiteUpdatedAt": "2026-06-23T10:05:01Z"
}
```

Success `200` or `201`:

```json
{
  "success": true,
  "requestId": "req_payment_001",
  "data": {
    "externalPaymentId": "pay_01JY5T2W8N",
    "localPaymentId": "P2026000091",
    "externalOrderId": "ord_01JY5S9M3A",
    "status": "paid",
    "amount": 29999,
    "currency": "NPR"
  },
  "processedAt": "2026-06-23T10:05:02Z"
}
```

Amount mismatch `422`: return code `PAYMENT_AMOUNT_MISMATCH`; do not mark the order paid.

### 13.6 `POST /api/v1/orders/{externalOrderId}/issue`

Issues native ticket/pass records and returns the QR value. Calling it again with the same idempotency key must return the original issuance, not create another ticket.

Request:

```json
{
  "schemaVersion": 1,
  "issueType": "annual_pass",
  "quantity": 1,
  "holder": {
    "externalCustomerId": "cus_01JY5S9M3A",
    "fullName": "Prabin Thapaliya"
  },
  "activationDate": "2026-07-01",
  "requestedAt": "2026-06-23T10:05:05Z"
}
```

Success `201`:

```json
{
  "success": true,
  "requestId": "req_issue_001",
  "data": {
    "externalOrderId": "ord_01JY5S9M3A",
    "localOrderId": "O2026000123",
    "localTicketId": null,
    "localPassId": "A2026000042",
    "ticketNumber": "ML-2026-000123",
    "status": "issued",
    "qrValue": "opaque-signed-or-random-local-token",
    "activationDate": "2026-07-01",
    "expiryDate": "2027-06-30"
  },
  "processedAt": "2026-06-23T10:05:06Z"
}
```

Unpaid order `422`: return code `ORDER_NOT_PAYABLE_OR_CONFIRMED`.

### 13.7 `GET /api/v1/orders/{externalOrderId}`

Request body: none.

Success `200`:

```json
{
  "success": true,
  "requestId": "req_order_read_001",
  "data": {
    "externalOrderId": "ord_01JY5S9M3A",
    "localOrderId": "O2026000123",
    "localCustomerId": "C0001842",
    "orderStatus": "confirmed",
    "paymentStatus": "paid",
    "fulfillmentStatus": "issued",
    "ticketIds": [],
    "passIds": ["A2026000042"],
    "updatedAt": "2026-06-23T10:05:06Z"
  },
  "processedAt": "2026-06-23T10:06:00Z"
}
```

Missing order `404`: return code `ORDER_NOT_FOUND`.

### 13.8 `GET /api/v1/sync/changes`

Exports local/offline changes in deterministic order. The cursor is opaque; the online backend must store it exactly as returned.

Query parameters:

```text
after=<opaque cursor; omit on first request>
limit=<1-500; default 100>
types=ticket,pass,visit,payment,order
```

Example request:

```http
GET /api/v1/sync/changes?after=cursor_000120&limit=100
Authorization: Bearer <token>
Accept: application/json
```

Success `200`:

```json
{
  "success": true,
  "requestId": "req_sync_001",
  "data": {
    "changes": [
      {
        "changeId": "chg_000121",
        "entityType": "visit",
        "operation": "created",
        "externalId": "visit_local_8821",
        "occurredAt": "2026-06-23T10:15:00Z",
        "payload": {
          "localVisitId": "V2026008821",
          "localPassId": "A2026000042",
          "gateId": "MAIN_GATE_1",
          "checkedInAt": "2026-06-23T10:14:58Z"
        }
      }
    ],
    "nextCursor": "cursor_000121",
    "hasMore": false
  },
  "processedAt": "2026-06-23T10:15:02Z"
}
```

No changes still returns `200` with `changes: []`, the latest cursor, and `hasMore: false`.

### 13.9 `POST /api/v1/check-ins`

Validates a ticket/pass QR and records one gate entry atomically.

Request:

```json
{
  "schemaVersion": 1,
  "qrValue": "opaque-signed-or-random-local-token",
  "gateId": "MAIN_GATE_1",
  "staffExternalId": "staff_gate_01",
  "deviceId": "scanner_android_01",
  "partySize": 1,
  "checkedInAt": "2026-06-23T10:14:58Z",
  "idempotencyKey": "checkin:scanner_android_01:1782195298"
}
```

Success `201`:

```json
{
  "success": true,
  "requestId": "req_checkin_001",
  "data": {
    "valid": true,
    "localVisitId": "V2026008821",
    "ticketType": "annual_pass",
    "holderName": "Prabin Thapaliya",
    "status": "active",
    "partySize": 1,
    "remainingEntries": null,
    "checkedInAt": "2026-06-23T10:14:58Z",
    "message": "Entry recorded successfully."
  },
  "processedAt": "2026-06-23T10:15:00Z"
}
```

Invalid/expired QR `422`:

```json
{
  "success": false,
  "requestId": "req_checkin_002",
  "error": {
    "code": "TICKET_EXPIRED",
    "message": "This ticket or pass has expired.",
    "fieldErrors": {},
    "retryable": false
  },
  "processedAt": "2026-06-23T10:15:00Z"
}
```

Duplicate scan must return either the original successful result for the same idempotency key, or `409` with code `DUPLICATE_CHECK_IN` for a genuinely separate repeated scan that business rules reject.

### 13.10 `PUT /api/v1/orders/{externalOrderId}/status`

Updates order state. Allowed transitions must be documented and enforced by the vendor.

Request:

```json
{
  "schemaVersion": 1,
  "status": "cancelled",
  "reasonCode": "CUSTOMER_REQUEST",
  "reason": "Customer requested cancellation before issuance.",
  "externalActorId": "admin_01",
  "effectiveAt": "2026-06-23T11:00:00Z"
}
```

Success `200`:

```json
{
  "success": true,
  "requestId": "req_status_001",
  "data": {
    "externalOrderId": "ord_01JY5S9M3A",
    "localOrderId": "O2026000123",
    "previousStatus": "confirmed",
    "orderStatus": "cancelled",
    "paymentStatus": "paid",
    "refundRequired": true,
    "updatedAt": "2026-06-23T11:00:01Z"
  },
  "processedAt": "2026-06-23T11:00:01Z"
}
```

Invalid transition `422`: return code `INVALID_STATUS_TRANSITION` and leave the original state unchanged.

The online backend should store returned local IDs, cursors, and statuses but must never expose local database credentials.

## 14. Recommended Firebase Sync Logic

### New online booking

1. Website writes `bookingRequests`.
2. Backend creates normalized `customer` and `order` records.
3. Backend creates a `syncOutbox` job.
4. Cloud Function sends the order to the local `PUT /orders/{id}` endpoint.
5. A verified payment is sent separately to `PUT /payments/{id}`.
6. Backend calls local `/issue` only when business rules allow issuance.
7. Returned local IDs and sync status are stored in Firestore.

### Local server unavailable

1. Keep the order safely in Firestore.
2. Mark `syncStatus: retry`.
3. Increase `syncAttempts`.
4. Store only a sanitized error message.
5. Retry with exponential backoff.
6. Alert staff after the retry threshold.

### Local activity reconciliation

1. Scheduled backend calls `/sync/changes?after=<cursor>`.
2. Update Firestore tickets, passes, visits, cancellations, and refunds.
3. Store the new cursor only after the whole page succeeds.

## 15. Security Rules and IAM

- Browser/mobile Firebase SDK requests are controlled by Firestore and Realtime Database Security Rules.
- Firebase Admin SDK and authenticated server REST requests are controlled by Google Cloud IAM and bypass client Security Rules.
- Keep staff rules separate from public create-only request rules.
- Never make `orders`, `payments`, `passes`, `tickets`, `visits`, `syncOutbox`, or `auditLogs` publicly writable.
- Payment status must only be updated after server-side gateway verification.
- Store QR token hashes where possible; do not use sequential database IDs as secure QR credentials.
- Use least-privilege service accounts.
