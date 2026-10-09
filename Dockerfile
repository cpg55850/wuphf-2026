# ---------------------------------------------------
# Stage 1: Base (Shared dependencies & Prisma client)
# ---------------------------------------------------
FROM node:20 AS base
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps
RUN npx prisma generate

# ---------------------------------------------------
# Stage 2: Development Target (For your local workflow)
# ---------------------------------------------------
FROM base AS dev
ENV NODE_ENV=development

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------------------------------------------------
# Stage 3: Builder (Compiles Next.js/TS for Production)
# ---------------------------------------------------
FROM base AS builder
COPY . .
RUN npm run build

# ---------------------------------------------------
# Stage 4: Production Target (Minimal, published image)
# ---------------------------------------------------
FROM node:20 AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# Install production dependencies (including prisma CLI if under dependencies)
RUN npm ci --only=production --legacy-peer-deps

# Copy Prisma schema and migrations so "prisma migrate deploy" works
COPY --from=base /app/prisma ./prisma

# Copy generated Prisma engine binaries & compiled app assets
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]