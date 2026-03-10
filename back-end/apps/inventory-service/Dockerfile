# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

RUN npm install

COPY apps/inventory-service ./apps/inventory-service
COPY libs/shared ./libs/shared

RUN npm run build inventory-service

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist/apps/inventory-service ./dist/apps/inventory-service

CMD ["node", "dist/apps/inventory-service/main"]