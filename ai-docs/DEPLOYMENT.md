# Deployment Guide

This document describes how to deploy the GBay marketplace to production using Railway, Vercel, and Upstash.

## Infrastructure Overview

- **Backend API**: NestJS running on **Railway** (via Docker).
- **Frontend Web**: Next.js running on **Vercel**.
- **Database**: PostgreSQL (Neon/Railway).
- **Cache & Queues**: Redis via **Upstash**.
- **Monitoring**: Sentry & Prometheus.

## 1. Backend Deployment (Railway)

### Preparation
- Ensure `Dockerfile` exists in the root directory.
- Railway will automatically detect the `Dockerfile` and build the API.

### Environment Variables
Configure these in the Railway Dashboard:
- `PORT`: 4000
- `NODE_ENV`: production
- `DATABASE_URL`: Your production PostgreSQL URL.
- `JWT_SECRET`: A strong secret for signing tokens.
- `REDIS_HOST`: Upstash Redis host.
- `REDIS_PORT`: Upstash Redis port.
- `REDIS_PASSWORD`: Upstash Redis password.
- `FRONTEND_URL`: `https://gbay.vercel.app` (or your custom domain).
- `SENTRY_DSN`: Your Sentry project DSN.

### Verification
Once deployed, check:
`https://your-api-url.railway.app/v1/health`

## 2. Frontend Deployment (Vercel)

### Preparation
- Link your repository to Vercel.
- Set the **Root Directory** to `apps/web`.
- Use the **Next.js** framework preset.

### Environment Variables
Configure these in the Vercel Dashboard:
- `NEXT_PUBLIC_API_URL`: `https://your-api-url.railway.app/v1`
- `NEXT_PUBLIC_APP_URL`: `https://gbay.vercel.app`
- `JWT_SECRET`: Must match the backend secret.

### Cookies & Security
- `gbay_token` cookie is set with `httpOnly: true` and `secure: true` in production.
- Middleware handles locale routing automatically.

## 3. Redis & BullMQ (Upstash)

### Checkout Expiration
- BullMQ is enabled in `CheckoutModule`.
- A background worker (`CheckoutProcessor`) monitors the `checkout-timeout` queue.
- If a user doesn't complete checkout within 15 minutes, the worker releases the inventory and restores stock.

### WebSocket Synchronization
- `RedisIoAdapter` is configured in `main.ts`.
- It ensures that WebSocket events (bids, counts) are synchronized across multiple API instances.

## 4. Troubleshooting

- **CORS Issues**: Ensure `FRONTEND_URL` in backend exactly matches the Vercel domain.
- **Prisma**: Run `npx prisma generate` during build (handled by Dockerfile).
- **Cookies**: If login fails, check if `secure` flag is interfering with local testing or if `SameSite` needs adjustment.
