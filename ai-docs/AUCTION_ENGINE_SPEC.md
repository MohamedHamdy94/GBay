# Auction Engine Spec

## Purpose
Defines timed auctions, proxy bidding, auto bidding, reserve prices, anti-sniping, real-time bidding, concurrency handling, and recovery.

## Business Rules
- Auctions have start/end times, minimum start price, bid increment, optional reserve price, and anti-sniping window.
- Proxy bidding stores each bidder's max bid privately and computes the visible current price.
- A bidder cannot bid against themselves except to raise their proxy max.
- Seller cannot bid on own auction.
- Bids below current price plus increment are rejected.
- If reserve is not met at close, no order is created unless seller accepts second-chance flow later.
- Anti-sniping extends `endsAt` when a valid bid lands within the configured window.

## Concurrency Strategy
Redis is used for shaping and fanout, not as the source of truth.

1. Gateway rate-limits bid attempts by user, IP, auction, and device fingerprint.
2. Bid command gets a short Redis lock `auction:{id}:bid-lock` to reduce duplicate work under spikes.
3. Database transaction reads the auction row with version and, for close operations, `SELECT ... FOR UPDATE`.
4. Command validates state, end time, bidder eligibility, fraud score, increment, and idempotency key.
5. Proxy-bid calculator computes accepted bid rows and current winner.
6. Transaction writes `ProxyBid`, `Bid`, updates `Auction.currentPriceCents`, `highestBidId`, `winnerUserId`, `endsAt`, and `version`.
7. Outbox emits `auction.bid.accepted`, `auction.outbid`, `auction.extended`.
8. Socket.IO broadcasts from the outbox/worker so DB commit always precedes client update.

## Race Conditions
- Two bids at same amount: earliest committed bid wins; equal bid from later user is rejected or marked outbid.
- Bid arrives as auction closes: DB transaction checks authoritative `endsAt`. If inside anti-sniping window and valid, extend. If after close transition lock, reject.
- Close job runs while bid is in flight: close job locks auction row. If bid transaction commits first, close sees updated state. If close commits first, bid sees terminal state and fails.
- Duplicate retry: unique `(auctionId, bidderUserId, idempotencyKey)` returns previous result.

## WebSocket Events
- Client emits `auction.join`, `auction.leave`, `auction.bid.place`.
- Server emits `auction.snapshot`, `auction.bid.accepted`, `auction.bid.rejected`, `auction.outbid`, `auction.extended`, `auction.ending`, `auction.closed`, `auction.settled`.

## REST APIs
- `POST /v1/auctions`: create draft auction.
- `PATCH /v1/auctions/{id}/schedule`: validate and schedule.
- `GET /v1/auctions/{id}`: public detail.
- `GET /v1/auctions/{id}/bids`: paginated visible bid history.
- `POST /v1/auctions/{id}/bids`: place bid with `Idempotency-Key`.
- `POST /v1/admin/auctions/{id}/cancel`: privileged cancellation with audit.

## Failure Recovery
- Close jobs are scheduled in BullMQ and scanned by a periodic reconciler for missed `LIVE/ENDING` auctions past `endsAt`.
- Outbox guarantees WebSocket replay and notification creation after bid commits.
- Reconciliation creates missing orders for `ENDED` auctions with valid winners, or marks reserve-not-met cases.
- Admin reversal is a separate audited workflow, never a silent state mutation.

## Code Example

```ts
export async function placeBid(command: PlaceBidCommand) {
  return prisma.$transaction(async (tx) => {
    const auction = await tx.$queryRaw<AuctionRow[]>`
      SELECT * FROM "Auction" WHERE id = ${command.auctionId} FOR UPDATE
    `;

    assertAuctionCanAcceptBid(auction[0], command.now);
    await assertBidderEligible(tx, auction[0], command.bidderUserId);

    const previous = await tx.bid.findFirst({
      where: {
        auctionId: command.auctionId,
        bidderUserId: command.bidderUserId,
        idempotencyKey: command.idempotencyKey,
      },
    });
    if (previous) return previous;

    const result = calculateProxyBid(auction[0], command);
    const bid = await tx.bid.create({ data: result.bid });
    await tx.auction.update({
      where: { id: command.auctionId },
      data: result.auctionPatch,
    });
    await tx.outboxEvent.create({ data: result.event });
    return bid;
  });
}
```
