# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy các file quản lý phụ thuộc từ Root
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Cài đặt dependencies
RUN npm install

# Copy source code (Cần cả libs để build)
COPY apps/auth-service ./apps/auth-service
COPY libs/shared ./libs/shared

# Build service cụ thể
RUN npm run build auth-service

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist/apps/auth-service ./dist/apps/auth-service

CMD ["node", "dist/apps/auth-service/main"]