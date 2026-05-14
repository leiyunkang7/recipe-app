# API v1 Changelog

**Published:** 2026-04-16
**Status:** Active

---

## Versioning Strategy

Recipe App API uses **URL path versioning** with the format `/api/v{N}/`.

### Version Detection (Priority Order)

1. **Path prefix** (highest priority): `/api/v1/recipes`
2. **Accept header**: `application/vnd.recipe-app.v1+json`
3. **Query parameter**: `?version=v1`
4. **Default**: `v1` (latest stable)

### Response Headers

All API responses include:
- `X-API-Version`: Detected API version (e.g., `v1`, `v2`)
- `X-API-Deprecated`: `true` if using a deprecated version
- `Sunset`: Deprecation date for deprecated versions

### Future Deprecation

When a new version is released:
1. `v1` will receive `X-API-Deprecated: true` header
2. `Upgrade: application/vnd.recipe-app.v2+json` will be set
3. Clients should migrate to the new version

---

## v1.0.0 (2026-04-16)

### Added

- **Versioned API routes** at `/api/v1/*`
  - `GET /api/v1/recipes` — List recipes (paginated, filterable)
  - `POST /api/v1/recipes` — Create recipe
  - `GET /api/v1/recipes/:id` — Get single recipe
  - `PATCH /api/v1/recipes/:id` — Update recipe
  - `DELETE /api/v1/recipes/:id` — Delete recipe
  - `GET /api/v1/categories` — List categories
  - `GET /api/v1/cuisines` — List cuisines
  - `GET /api/v1/docs` — API documentation
  - `GET /api/v1/changelog` — API changelog
  - `GET /api/v1/` — API version info

- **API Version Middleware** (`server/middleware/apiVersion.ts`)
  - Auto-detects API version from path, Accept header, or query param
  - Sets version response headers on all `/api/*` requests

- **Versioned Response Format**
  ```json
  {
    "api_version": "v1",
    "data": { ... },
    "meta": { ... }
  }
  ```

- **Paginated Response Format**
  ```json
  {
    "api_version": "v1",
    "data": [ ... ],
    "meta": {
      "page": 1,
      "limit": 20,
      "count": 20,
      "total": 100,
      "hasMore": true
    }
  }
  ```

- **Database Migration Manager** (`database/scripts/migrate.ts`)
  - Migration tracking in `migration_metadata` table
  - Supports `--dry-run`, `--rollback`, `--rollback-to`, `--status`
  - Compatible with Drizzle via `schema_migrations` table

- **Backward Compatibility**
  - Original `/api/recipes/*` routes remain functional (no version prefix)
  - New clients should use `/api/v1/recipes` for future-proof API access

### Technical Details

| Component | Technology |
|-----------|------------|
| API Framework | H3 / Nuxt 3 Nitro |
| Database ORM | Drizzle ORM |
| Migration Tool | Custom migrate.ts (Bun) |
| Version Detection | Path + Accept header + Query param |

---

## Migration Guide

### From `/api/recipes` to `/api/v1/recipes`

**Before (deprecated path):**
```bash
GET /api/recipes?page=1&limit=20
```

**After (v1 path):**
```bash
GET /api/v1/recipes?page=1&limit=20
```

**With Accept header:**
```bash
GET /api/recipes
Accept: application/vnd.recipe-app.v1+json
```

### Response Difference

The v1 API wraps all responses in a versioned envelope:

```json
{
  "api_version": "v1",
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 100, "hasMore": true }
}
```
