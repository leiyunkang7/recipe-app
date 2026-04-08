# ============================================
# Stage 1: Dependencies
# ============================================
FROM oven/bun:1.3.9-alpine AS deps

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lockb* ./

# Install dependencies only (no devDependencies for production)
RUN bun install --frozen-lockfile --production

# ============================================
# Stage 2: Builder
# ============================================
FROM oven/bun:1.3.9-alpine AS builder

WORKDIR /app

# Install node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY package.json ./

# Copy source code
COPY . .

# Build the application
RUN bun run build

# ============================================
# Stage 3: Runner (minimal image)
# ============================================
FROM oven/bun:1.3.9-alpine AS runner

WORKDIR /app

# Production user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Copy built application
COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/package.json /app/

# Set ownership
RUN chown -R nuxtjs:nodejs /app

# Switch to non-root user
USER nuxtjs

# Expose port (Nuxt default)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["bun", "run", ".output/server/index.mjs"]
