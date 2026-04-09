# ============================================
# Stage 1: Dependencies
# ============================================
FROM oven/bun:1.3.9-alpine AS deps

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json bun.lockb* ./

# Install dependencies - skip postinstall (nuxt prepare), use cache mount
RUN --mount=type=cache,target=/root/.bun/install/cache \
    --mount=type=cache,target=/tmp/.bun-cache \
    bun install --frozen-lockfile --ignore-scripts

# ============================================
# Stage 2: Builder
# ============================================
FROM oven/bun:1.3.9-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source (node_modules already available, no package.json re-copy needed)
COPY --chown=nuxtjs:nodejs . .

# Disable telemetry for faster builds
ENV NUXT_TELEMETRY_DISABLED=1

# Build with production mode
RUN nuxt build

# ============================================
# Stage 3: Runner (minimal image)
# ============================================
FROM oven/bun:1.3.9-alpine AS runner

WORKDIR /app

# Create non-root user and clean up in single layer for smaller image
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nuxtjs

# Copy only necessary files from builder
COPY --from=builder --chown=nuxtjs:nodejs /app/.output /app/.output

# Clean up unnecessary files in output to reduce image size
# Remove source maps and empty directories in single layer
RUN find /app/.output \( -name "*.map" -o -name "*.tsbuildinfo" \) -delete \
    && find /app/.output -type d -empty -delete 2>/dev/null || true \
    && rm -f /app/.output/server/_payload.json 2>/dev/null || true

USER nuxtjs

EXPOSE 3000

# Start the application
CMD ["bun", "run", ".output/server/index.mjs"]
