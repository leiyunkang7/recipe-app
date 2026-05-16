# recipe-app Docker Build - Context Fix (2026-05-12)

## Problem

Docker build fails with:
```
error: @recipe-app/database@file:../database failed to resolve
error: @recipe-app/notification-service@file:../services/notification failed to resolve
error: @recipe-app/nutrition@file:../services/nutrition failed to resolve
error: @recipe-app/shared-types@file:../shared/types failed to resolve
```

## Root Cause

- **Build context**: `web/` (current directory)
- **Workspace packages**: `../database`, `../services/*`, `../shared/*`
- **Problem**: Build context can't see parent directories

## Solution: Change Build Context to Monorepo Root

### 1. docker-compose.yml (web/)

```yaml
services:
  web:
    build:
      context: ..              # ← Change from . to ..
      dockerfile: web/Dockerfile  # ← Update dockerfile path
      args:
        - NODE_ENV=production
    ...
```

### 2. Dockerfile (web/) - Update COPY paths

Since context is now `..` (monorepo root), all COPY paths need updating:

```dockerfile
# Stage 1: Dependencies
FROM oven/bun:1.3.9-alpine AS deps
WORKDIR /app
# Context is now monorepo root, so web/ prefix is needed
COPY web/package.json web/bun.lockb* ./
# Install with workspace awareness (NO frozen lockfile for workspaces!)
RUN bun install --ignore-scripts

# Stage 2: Builder
FROM oven/bun:1.3.9-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy from web/ subdirectory (context is monorepo root)
COPY --chown=nuxtjs:nodejs web/. .
ENV NUXT_TELEMETRY_DISABLED=1
RUN nuxt build

# Stage 3: Runner (no changes needed, .output is self-contained)
FROM oven/bun:1.3.9-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nuxtjs
COPY --from=builder --chown=nuxtjs:nodejs /app/.output /app/.output
RUN find /app/.output \( -name "*.map" -o -name "*.tsbuildinfo" \) -delete \
    && find /app/.output -type d -empty -delete 2>/dev/null || true \
    && rm -f /app/.output/server/_payload.json 2>/dev/null || true
USER nuxtjs
EXPOSE 3000
CMD ["bun", "run", ".output/server/index.mjs"]
```

### 3. Key Changes Summary

| File | Change | Reason |
|------|--------|--------|
| docker-compose.yml | `context: .` → `context: ..` | See workspace packages |
| docker-compose.yml | `dockerfile: Dockerfile` → `dockerfile: web/Dockerfile` | Dockerfile is in web/ |
| Dockerfile Stage 1 | `COPY web/package.json ...` | Context is monorepo root |
| Dockerfile Stage 2 | `COPY --chown=nuxtjs:nodejs web/. .` | Copy from web/ subdirectory |
| Dockerfile Stage 2 | Remove `--frozen-lockfile` | Workspaces can't use frozen lockfile |

## Verification

```bash
cd /home/k/.openclaw/workspace/recipe-app/web
DOCKER_BUILDKIT=0 docker compose build
```

## Environment Variables (Needed at Runtime)

The container also needs these environment variables to run:

```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - SUPABASE_URL=${SUPABASE_URL}
  - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
```

Find these in 1Panel or your .env file.
