# Base image
FROM node:22 AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build the API
RUN npm run build:api

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/database ./packages/database

EXPOSE 4000

CMD ["npm", "run", "start:prod", "--workspace", "@gbay/api"]
