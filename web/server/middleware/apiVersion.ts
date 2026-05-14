/**
 * API Version Detection Middleware
 *
 * Intercepts all /api/* requests and detects the requested API version
 * from the following sources (in priority order):
 *
 *  1. Accept header:  application/vnd.recipe-app.v{N}+json
 *  2. Query param:     ?version=v{N}
 *  3. Path prefix:     /api/v{N}/...
 *
 * The detected version is stored in event.context.apiVersion so downstream
 * handlers can read it without re-parsing.
 *
 * If the version is unsupported, sets event.context.apiVersion = 'unsupported'
 * and sets a 426 Upgrade Required response headers.
 */

import { defineEventHandler, getRequestURL, getHeader, getQuery, setResponseHeader } from "h3";
import { isVersionSupported, isDeprecated, CURRENT_VERSION } from "../utils/apiVersion";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const path = url.pathname;

  // Only intercept /api/* routes (skip /api/v1/docs etc.)
  if (!path.startsWith("/api/")) return;

  const detected = detectVersion(event);

  // Attach to context for downstream handlers
  event.context.apiVersion = detected;

  // Handle unsupported version
  if (detected !== "unsupported" && !isVersionSupported(detected)) {
    setResponseHeader(event, "X-API-Version", detected);
    setResponseHeader(
      event,
      "Upgrade",
      `application/vnd.recipe-app.${CURRENT_VERSION}+json`
    );
    // Don't throw here — let the handler decide what to do with an unknown version
    // handlers can check event.context.apiVersion === 'unsupported'
    event.context.unsupportedVersion = detected;
  }

  // Add deprecation header if using a deprecated version
  if (detected !== "unsupported" && isDeprecated(detected)) {
    setResponseHeader(event, "X-API-Deprecated", "true");
    setResponseHeader(
      event,
      "Sunset",
      getHeader(event, "X-API-Deprecation-Date") ?? ""
    );
  }

  // Always set version response header for traceability
  setResponseHeader(event, "X-API-Version", detected === "unsupported" ? "unknown" : detected);
});

// ---------------------------------------------------------------------------
// Core detection logic
// ---------------------------------------------------------------------------

function detectVersion(event: Parameters<typeof defineEventHandler>[0]): string {
  const url = getRequestURL(event);
  const path = url.pathname;

  // 1. Path prefix: /api/v{N}/...
  const pathMatch = path.match(/^\/api\/v(\d+)\//);
  if (pathMatch) {
    return `v${pathMatch[1]}`;
  }

  // Also check /api/v{N} (exact, no trailing slash)
  const exactPathMatch = path.match(/^\/api\/v(\d+)$/);
  if (exactPathMatch) {
    return `v${exactPathMatch[1]}`;
  }

  // 2. Accept header: application/vnd.recipe-app.v{N}+json
  const accept = getHeader(event, "accept") ?? "";
  const versionMatch = accept.match(/application\/vnd\.recipe-app\.v(\d+)\+json/);
  if (versionMatch) {
    return `v${versionMatch[1]}`;
  }

  // 3. Query param: ?version=v1
  const queryVersion = getQuery(event).version as string | undefined;
  if (queryVersion && /^v\d+$/.test(queryVersion)) {
    return queryVersion;
  }

  // Default: no version specified → treat as latest (v1 for now)
  return CURRENT_VERSION;
}
