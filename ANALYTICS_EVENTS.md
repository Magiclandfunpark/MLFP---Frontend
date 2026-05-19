# Magic Land Analytics Event Plan

Use Firebase Analytics / GA4 as the primary website analytics layer. All events are lowercase, underscore-separated, and safe to trigger from the browser.

## Navigation

| Event | When | Parameters |
| --- | --- | --- |
| `page_view` | Route/page changes | `page_title`, `page_path`, `page_location` |
| `navigation_click` | A nav/menu/footer route is clicked | `target_page`, `source_page` |
| `social_link_click` | Social channel links are clicked | `channel`, `location` |

## Tickets and Bookings

| Event | When | Parameters |
| --- | --- | --- |
| `ticket_select` | A ticket card is selected | `ticket_name`, `price` |
| `booking_request_submitted` | Ticket reservation is saved | `ticket_name`, `guests`, `total`, `store` |

## Memberships

| Event | When | Parameters |
| --- | --- | --- |
| `membership_plan_select` | A membership plan CTA is clicked | `plan_name` |
| `membership_request_submitted` | Membership request is saved | `plan_name`, `price`, `visits`, `store` |

## Attractions and Map

| Event | When | Parameters |
| --- | --- | --- |
| `attraction_filter_select` | Attraction zone tab is selected | `zone` |
| `attraction_book_click` | Attraction card Book Game CTA is clicked | `attraction_name`, `zone` |
| `attraction_membership_click` | Attraction card Use Membership CTA is clicked | `attraction_name`, `zone` |
| `map_directions_click` | Directions button is clicked | `destination` |

## Guest Account

| Event | When | Parameters |
| --- | --- | --- |
| `auth_google_start` / `auth_google_success` / `auth_google_error` | Google login flow | `code` on error |
| `auth_email_login_start` / `auth_email_login_success` / `auth_email_login_error` | Email sign in | `code` on error |
| `auth_email_register_start` / `auth_email_register_success` / `auth_email_register_error` | Email account creation | `code` on error |
| `auth_phone_otp_request_start` / `auth_phone_otp_request_success` / `auth_phone_otp_request_error` | Phone OTP request | `code` on error |
| `auth_phone_otp_verify_start` / `auth_phone_otp_verify_success` / `auth_phone_otp_verify_error` | Phone OTP verification | `code` on error |
| `auth_logout_start` / `auth_logout_success` / `auth_logout_error` | Guest sign out | `code` on error |

