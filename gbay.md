# GBay - Next-Generation Marketplace

GBay is a high-performance, multi-vendor e-commerce platform built with Next.js 15 and NestJS. It supports real-time auctions, secure buy-now transactions, and a comprehensive seller dashboard.

## 🚀 How to Run the Project

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis (for BullMQ/Auctions)

### 2. Database Setup
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 3. Start the Backend API
```bash
npm run dev:api
```
The API will be available at `http://localhost:4000/v1`.

### 4. Start the Frontend (Web)
```bash
cd apps/web
npm run dev
```
The frontend will be available at `http://localhost:3000`.

---

## 🗺️ Main Routes

### Buyer Routes
- `/` - Landing Page & Featured Items
- `/products` - Product Catalog with Filtering
- `/products/[slug]` - Detailed Product/Auction View
- `/cart` - Shopping Cart
- `/checkout` - Multi-step Checkout Flow

### Seller Routes
- `/seller/dashboard` - Sales Metrics & Overview
- `/seller/products` - Manage Listings
- `/seller/products/new` - Add New Product (Support for Auctions)
- `/seller/orders` - Order Fulfillment & Shipping

### Admin Routes
- `/admin` - System-wide Management (KYC, Escrow, Fraud)

---

## 🛠️ Technical Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, ShadCN/UI, `next-intl`.
- **Backend:** NestJS, Prisma ORM, BullMQ (Task Queue), Socket.io (Real-time).
- **Database:** PostgreSQL (Core), Redis (Cache/Queue).

---

## 💰 Estimated Operational Costs (Monthly)

| Service | Recommendation | Est. Cost |
|---------|----------------|-----------|
| **API Hosting** | Railway / Render (2x 1GB RAM Instances) | $20 - $40 |
| **Web Hosting** | Vercel (Pro Plan) | $20 |
| **Database** | Supabase / Neon (Managed Postgres) | $15 - $25 |
| **Redis** | Upstash (Serverless Redis) | $0 - $10 |
| **CDN & DNS** | Cloudflare (Free/Pro Plan) | $0 - $20 |
| **Total** | | **$55 - $115** |

*Note: Costs vary based on traffic and scaling requirements.*
