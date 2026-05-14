# ============================================
# Stage 1: Dependencies (from monorepo root)
# ============================================
FROM oven/bun:1.3.9-alpine AS deps

WORKDIR /app

# Copy entire monorepo (needed for workspace packages)
COPY . .

# Install ALL dependencies from monorepo root (uses workspaces properly!)
# Skip postinstall (nuxt prepare) to avoid issues in build stage
RUN bun install --ignore-scripts

# ============================================
# Stage 2: Builder (build web from monorepo)
# ============================================
FROM oven/bun:1.3.9-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage (includes all workspace packages)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared ./shared
COPY --from=deps /app/services ./services
COPY --from=deps /app/database ./database
COPY --from=deps /app/cli ./cli

# Copy web source
COPY --from=deps /app/web/package.json ./web/package.json
COPY --from=deps /app/web/bun.lock ./web/
COPY --from=deps /app/web/nuxt.config.ts ./web/
COPY --from=deps /app/web/server ./web/server
COPY --from=deps /app/web/app ./web/app
COPY --from=deps /app/web/components ./web/components
COPY --from=deps /app/web/composables ./web/composables
COPY --from=deps /app/web/layouts ./web/layouts
COPY --from=deps /app/web/pages ./web/pages
COPY --from=deps /app/web/public ./web/public
COPY --from=deps /app/web/plugins ./web/plugins
COPY --from=deps /app/web/utils ./web/utils
COPY --from=deps /app/web/types ./web/types
COPY --from=deps /app/web/assets ./web/assets
COPY --from=deps /app/web/i18n ./web/i18n
COPY --from=deps /app/web/locales ./web/locales
COPY --from=deps /app/web/scripts ./web/scripts
COPY --from=deps /app/web/supabase ./web/supabase
COPY --from=deps /app/web/tailwind.config.ts ./web/
COPY --from=deps /app/web/tsconfig.json ./web/
COPY --from=deps /app/web/vitest.config.ts ./web/

# Copy root workspace files needed for build
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/bun.lock ./bun.lock
COPY --from=deps /app/shared/types ./shared/types
COPY --from=deps /app/services/recipe ./services/recipe
COPY --from=deps /app/services/recommendation ./services/recommendation

# Disable telemetry for faster builds
ENV NUXT_TELEMETRY_DISABLED=1

# Build nuxt from web/ directory
WORKDIR /app/web
RUN nuxt build

# ============================================
# Stage 3: Runner (minimal image)
# ============================================
FROM oven/bun:1.3.9-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nuxtjs

# Copy only necessary files from builder
COPY --from=builder --chown=nuxtjs:nodejs /app/web/.output /app/.output

# Clean up unnecessary files in output to reduce image size
RUN find /app/.output \( -name "*.map" -o -name "*.tsbuildinfo" \) -delete \
    && find /app/.output -type d -empty -delete 2>/dev/null || true \
    && rm -f /app/.output/server/_payload.json 2>/dev/null || true

USER nuxtjs

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
