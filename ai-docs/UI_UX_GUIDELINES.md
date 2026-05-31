# UI UX Guidelines

## Purpose
Defines product UI direction for buyer, seller, and admin surfaces with bilingual support.

## Internationalization
- Routes: `/en/...` and `/de/...`.
- Use `next-intl` for all user-visible strings.
- Store `preferredLanguage` on `User`.
- Persist anonymous locale in `NEXT_LOCALE` cookie.
- Never hardcode validation, email, notification, or admin text.

## Layout
- Buyer marketplace pages prioritize search, filters, clear pricing, auction countdowns, seller trust, shipping, and returns.
- Seller dashboard is operational: listings, orders, auction performance, payouts, disputes, and verification status.
- Admin is dense and table-first with high information density.

## Components
Use shadcn/ui and Tailwind. Buttons should include icons where useful. Forms must show localized field errors. Auction pages must show live state, current price, bidder feedback, reserve state when legally allowed, and anti-sniping extensions.

## Accessibility
- Keyboard navigable controls.
- Visible focus states.
- Server-rendered semantic pages.
- Localized `aria-label` values.
- Color is never the only status signal.
