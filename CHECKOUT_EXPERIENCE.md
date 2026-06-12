# Magic Land Checkout Experience

## Recommended First Version

Use a one-step reservation flow before building full online payment.

1. Guest chooses a ticket.
2. Guest enters name, phone, visit date, and guest count.
3. Website creates a Firebase request.
4. Magic Land confirms by phone or WhatsApp.
5. Payment can happen at the park, by wallet link, or through a hosted payment gateway later.

This keeps the conversion path short and avoids unnecessary customer accounts.

## Why This Fits Magic Land

- Nepal family visitors often want quick confirmation, not a long ecommerce checkout.
- Phone number is enough for the first sales follow-up.
- Staff can handle edge cases like birthday groups, school visits, and date changes.
- Firebase request data gives the park a clean lead pipeline before investing in a full POS/payment integration.

## Future Online Payment Flow

When payment is ready, keep the same front-end flow and add:

- Hosted payment page or payment link.
- Cloud Function to create payment sessions.
- `payments` collection for gateway status.
- Staff dashboard to mark paid, confirmed, visited, cancelled, or refunded.

## Status Values

Use these statuses internally:

- `new`
- `contacted`
- `confirmed`
- `paid`
- `visited`
- `cancelled`
- `refunded`

## Fields To Keep Minimal

For public guests, ask only:

- Name
- Phone
- Visit date
- Guests or selected plan
- Optional note

Do not add customer account creation to ticket booking.
