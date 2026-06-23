# Magic Land Website to Local Park System API Handoff

## Purpose

The website already accepts ticket orders, annual-pass orders, Khalti/eSewa payment handoffs, and pay-at-park reservations. The local MySQL park system should receive the same orders so the gate, counter, scanner, printer, and online website work from one consistent data model.

The online backend must call the local server. The local server should expose a secured HTTPS API through a static public IP or a domain mapped to that IP. The browser must never call the local server directly.

## Existing Website APIs

These endpoints already exist on `https://magiclandfunpark.com`. They are internal website/payment endpoints and should not be called by the local ticket software.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/khalti/initiate` | Create a Khalti payment session after server-side price validation. |
| POST | `/api/khalti/verify` | Verify Khalti payment status and amount. |
| POST | `/api/esewa/initiate` | Create a signed eSewa payment form after server-side price validation. |
| POST | `/api/esewa/verify` | Verify eSewa payment status, signature, transaction, and amount. |
| GET | `/api/google/reviews` | Read approved Google Business review data for the website. |

## APIs Required From the Local Park System

The local-system developer should provide these endpoints. Version them under `/api/v1` and return JSON.

### 1. Health check

`GET /api/v1/health`

Returns server availability, local database status, API version, and local server time.

### 2. Product and price catalogue

`GET /api/v1/catalog/products`

Must return the local product code, public name, NPR price, product type, validity rules, and active status for:

- One-Time Entry: NPR 1,500 per person
- Gift Ticket: NPR 1,500 per person
- Group Day Visit: NPR 1,500 per person, 5% discount for 6-9 guests, 10% discount for 10 or more
- Yearly Unlimited Pass: NPR 29,999, one named person, unlimited visits for 12 months, non-transferable

### 3. Create or update customer

`PUT /api/v1/customers/{externalCustomerId}`

Required fields: external customer ID, full name, phone, email, created time, and updated time. The response must return the native local customer ID.

### 4. Import online order

`PUT /api/v1/orders/{externalOrderId}`

Use an idempotent `PUT` so retries never create duplicate tickets.

Required fields:

- `externalOrderId`
- `customerId`
- `productCode`
- `productName`
- `quantity`
- `unitPrice`
- `discountAmount`
- `totalAmount`
- `currency` (`NPR`)
- `visitOrActivationDate`
- `paymentMethod` (`khalti`, `esewa`, or `pay_at_park`)
- `paymentStatus` (`pending`, `paid`, `failed`, `refunded`)
- `orderStatus` (`new`, `confirmed`, `issued`, `cancelled`)
- `websiteCreatedAt`

The response must return the local order ID and local status.

### 5. Record verified payment

`PUT /api/v1/payments/{externalPaymentId}`

Required fields: external payment ID, external order ID, gateway, gateway transaction ID, amount, currency, status, verified time, and refund status. Only server-verified Khalti/eSewa payments should be sent as `paid`.

### 6. Issue ticket or annual pass

`POST /api/v1/orders/{externalOrderId}/issue`

For a day ticket, return the native ticket ID, printable ticket number, QR value, issue time, valid date, and status.

For the Yearly Unlimited Pass, also return the native pass ID, holder name, activation date, expiry date, and pass status. The pass QR must remain reusable while the pass is active; each visit should create a separate visit-history record.

### 7. Read order/ticket/pass status

`GET /api/v1/orders/{externalOrderId}`

Returns local IDs, issue status, payment status, QR/ticket reference, pass activation/expiry where applicable, and last updated time. This lets the online sync service reconcile retries and interrupted connections.

### 8. Export local changes for reconciliation

`GET /api/v1/sync/changes?after={cursor}&limit=500`

Returns changed orders, payments, tickets, passes, check-ins, cancellations, and refunds plus a new cursor. This is required because the local server cannot call Firebase directly.

### 9. QR validation and check-in

`POST /api/v1/check-ins`

Required fields: QR value or ticket/pass ID, entry quantity, gate ID, staff ID, device ID, and scan time. Return valid/invalid status, holder/customer details allowed at the gate, remaining entitlement, and the reason when rejected.

For a Yearly Unlimited Pass, check-in must not consume the pass. It should record a visit while confirming that the pass is active, not expired, and belongs to the named holder.

### 10. Cancellation/refund status

`PUT /api/v1/orders/{externalOrderId}/status`

Supports confirmed, cancelled, refunded, and void states with reason, staff ID, and timestamp.

## Security Requirements

- HTTPS only; never expose MySQL directly.
- API credentials stored only in the online backend and local server.
- Use `Authorization: Bearer <server-token>` plus HMAC request signing if supported.
- Add `Idempotency-Key` to every create/update request.
- Allowlist the online sync server IP where possible.
- Reject timestamps older than five minutes to reduce replay attacks.
- Log request ID, external order ID, endpoint, response code, and processing time.
- Do not include gateway secret keys or Firebase credentials in local clients, scanners, or printers.
- Return standard HTTP statuses: `200/201`, `400`, `401`, `404`, `409`, `422`, and `500`.

## Native Field Mapping Needed From Vendor

Because the local system does not allow custom fields, the vendor must provide a mapping table from every field above to its existing native MySQL/API field. Ask them to include native field names, data types, maximum lengths, required/optional status, and printable fields.

## Sync Order

1. Fetch and cache the local product catalogue.
2. Create/update the customer.
3. Import the online order with its external ID.
4. Record verified payment or pay-at-park status.
5. Issue the ticket/pass in the local system.
6. Store returned local IDs and QR reference in the online backend.
7. Poll `/sync/changes` to reconcile check-ins, cancellations, refunds, and offline activity.

All requests must be safe to retry without creating duplicates.
