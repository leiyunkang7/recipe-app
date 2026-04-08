# ============================================
# Stage 1: Dependencies
# ============================================
FROM oven/bun:1.3.9-alpine AS deps

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json bun.lockb* ./

# Install dependencies only (production mode)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# ============================================
# Stage 2: Builder
# ============================================
FROM oven/bun:1.3.9-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files and source
COPY package.json ./
COPY --chown=nuxtjs:nodejs . .

# Build with production mode (skip dev tools)
RUN NCU=0 nuxt build

# ============================================
# Stage 3: Runner (minimal image)
# ============================================
FROM oven/bun:1.3.9-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Copy only necessary files from builder
COPY --from=builder --chown=nuxtjs:nodejs /app/.output /app/.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json /app/

# Set ownership
USER nuxtjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["bun", "run", ".output/server/index.mjs"]
