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

## Attractions and Map

| Event | When | Parameters |
| --- | --- | --- |
| `attraction_filter_select` | Attraction zone tab is selected | `zone` |
| `attraction_book_click` | Attraction card Book Game CTA is clicked | `attraction_name`, `zone` |
| `map_directions_click` | Directions button is clicked | `destination` |

## Staff Authentication

| Event | When | Parameters |
| --- | --- | --- |
| `staff_email_login_success` | Approved staff signs in | `portal` |
