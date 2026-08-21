# Stage 1: Base image
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci || npm install
RUN npx prisma generate

# Stage 3: Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./dev.db"
ENV ADMIN_AUTHORIZED_PHONE="0395957039"
ENV JWT_SECRET="shopee_affiliate_cashback_secret_key_2024"
RUN npx prisma generate
RUN npx prisma db push --accept-data-loss
RUN npm run build

# Stage 4: Production runner
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./dev.db"
ENV ADMIN_AUTHORIZED_PHONE="0395957039"
ENV JWT_SECRET="shopee_affiliate_cashback_secret_key_2024"

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]
