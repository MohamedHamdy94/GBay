# Marketplace Completion Design

## Goal
Achieve a "complete" marketplace experience by filling the gaps in Seller management, Product listing, and Checkout flow, ensuring the site is ready for end-to-end testing (excluding real payments).

## 1. Seller Dashboard Enhancements
- **Metrics**: Display Total Sales, Active Listings, Sold Items (Monthly), and Pending Payouts.
- **Recent Orders**: A table showing the last 5 orders with status and amount.
- **Quick Actions**: Links to "Add Product" and "Manage Orders".

## 2. Seller Orders Management
- **New Page**: `/app/[locale]/seller/orders/page.tsx`.
- **Functionality**:
    - List all orders containing the seller's products.
    - Filter by status (Pending, Shipped, Delivered).
    - Action: "Mark as Shipped" (calls backend Order service).

## 3. Product Listing System Improvements
- **Dynamic Categories**: Fetch categories from `/v1/catalog/categories` and display in a searchable select/dropdown.
- **Price Input**: User enters price in EUR/Decimal; converted to Cents for API.
- **Auction Support**: If "Auction" is selected, show "Starting Bid" and "Reserve Price" fields.

## 4. Checkout & Mock Payment Flow
- **Initiation**: When user clicks "Checkout" in Cart, call `/v1/checkout/initiate`.
- **Mock Payment Interstitial**: A new page `/app/[locale]/checkout/payment` that shows a "Processing Payment..." animation for 2 seconds.
- **Confirmation**: Automatically call `/v1/checkout/confirm` after the mock delay and redirect to `/checkout/success`.
- **Success Page**: `/app/[locale]/checkout/success/page.tsx` showing order details and a thank you message.

## 5. End-to-End Verification
- Ensure the flow: Register -> Onboard as Seller -> Add Product -> Logout -> Register as Buyer -> Add to Cart -> Checkout -> Mark as Shipped (as Seller) -> Mark as Received (as Buyer) -> Admin review.

## 6. Documentation (`gbay.md`)
- Detailed operation manual.
- Technical requirements for launch.
- Estimated operational costs.
