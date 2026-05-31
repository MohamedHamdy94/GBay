# API Standards

## Purpose
Defines REST, WebSocket, DTO, validation, versioning, error handling, rate limiting, and idempotency standards.

## REST
- Prefix all APIs with `/v1`.
- Use resource routes and explicit command endpoints for state transitions.
- Validate DTOs with class-validator or zod at boundaries.
- Return stable error codes that can be localized by the frontend.

## Idempotency
Required for:
- bids
- checkout sessions
- inventory reservations
- orders
- payments
- refunds
- ledger postings
- admin destructive actions

Clients send `Idempotency-Key`. Server stores it on the aggregate mutation table with a unique constraint.

## Error Shape
```json
{
  "error": {
    "code": "AUCTION_BID_TOO_LOW",
    "messageKey": "errors.auction.bidTooLow",
    "details": { "minimumAmountCents": 1200 },
    "requestId": "req_123"
  }
}
```

## Pagination
Use cursor pagination for mutable lists. Offset pagination is allowed only for small admin reference data.

## WebSocket
Socket.IO namespaces:
- `/auctions`
- `/notifications`
- `/messages`
- `/admin-risk`

All events include `eventId`, `occurredAt`, and aggregate IDs. Clients recover missed state with REST snapshots.

## Rate Limits
- Login: user/IP/device.
- Bid placement: user/IP/auction.
- Checkout: user/IP/listing.
- Messaging: user/thread and abuse score.
- Admin writes: user/action.
