FROM oven/bun:1.3.9-alpine AS deps

WORKDIR /app

COPY package.json bun.lockb* ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    --mount=type=cache,target=/tmp/.bun-cache \
    bun install --frozen-lockfile --ignore-scripts --production

FROM oven/bun:1.3.9-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY --chown=nuxtjs:nodejs . .

ENV NUXT_TELEMETRY_DISABLED=1
ENV BUN_ENV=production

RUN nuxt build

FROM oven/bun:1.3.9-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nuxtjs

COPY --from=builder --chown=nuxtjs:nodejs /app/.output /app/.output

RUN find /app/.output \
        \( -name "*.map" -o -name "*.tsbuildinfo" -o -name "*.gz" \) -delete 2>/dev/null || true \
    && find /app/.output -type d -empty -delete 2>/dev/null || true \
    && rm -rf /app/.output/server/_payload.json \
              /app/.output/public/hmr* \
              /app/.output/public/_nuxt/*.json \
              /app/.output/server/package.json \
              /app/.output/server/tsconfig.json 2>/dev/null || true \
    && chmod -R u+w /app/.output

USER nuxtjs

EXPOSE 3000

CMD ["bun", "--bun", "run", ".output/server/index.mjs"]
