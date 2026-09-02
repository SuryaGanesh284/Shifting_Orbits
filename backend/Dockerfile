# Multi-stage production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci --only=production

# Runtime Stage
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl wget

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Security: run as unprivileged node user
USER node

EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
