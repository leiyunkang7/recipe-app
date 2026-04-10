/**
 * API Versioning Utilities
 *
 * Helper functions for versioned API endpoints.
 */

export interface ApiVersion {
  version: string;
  isActive: boolean;
  deprecationDate: string | null;
}

export interface ApiResponse<T> {
  api_version: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    count: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Creates a versioned API response
 */
export function apiResponse<T>(data: T, version: string = 'v1', meta?: Record<string, unknown>): ApiResponse<T> {
  return {
    api_version: version,
    data,
    ...(meta ? { meta } : {}),
  };
}

/**
 * Creates a paginated versioned API response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  version: string = 'v1'
): PaginatedResponse<T> {
  return {
    api_version: version,
    data,
    meta: {
      page,
      limit,
      count: data.length,
      total,
      hasMore: page * limit < total,
    },
  };
}

/**
 * Gets the API version from an event request
 * Checks the Accept header or query parameter
 */
export function getApiVersion(event: unknown): string {
  // Check query parameter first (e.g., ?version=v1)
  const queryVersion = event.context?.query?.version;
  if (queryVersion && isValidVersion(queryVersion)) {
    return queryVersion;
  }

  // Check Accept header
  const accept = event.request?.headers?.get?.('accept') || '';
  const versionMatch = accept.match(/application\/vnd\.recipe-app\.v(\d+)\+json/);
  if (versionMatch) {
    return `v${versionMatch[1]}`;
  }

  // Default to v1
  return 'v1';
}

/**
 * Checks if a version string is valid
 */
export function isValidVersion(version: string): boolean {
  return /^v\d+$/.test(version);
}

/**
 * Compares two API versions
 * Returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const num1 = parseInt(v1.replace('v', ''), 10);
  const num2 = parseInt(v2.replace('v', ''), 10);
  return num1 - num2;
}

/**
 * Supported API versions
 */
export const SUPPORTED_VERSIONS: ApiVersion[] = [
  { version: 'v1', isActive: true, deprecationDate: null },
];

/**
 * Current API version (latest stable)
 */
export const CURRENT_VERSION = 'v1';

/**
 * Gets version info from the supported versions list
 */
export function getVersionInfo(version: string): ApiVersion | undefined {
  return SUPPORTED_VERSIONS.find(v => v.version === version);
}

/**
 * Checks if a version is supported
 */
export function isVersionSupported(version: string): boolean {
  return SUPPORTED_VERSIONS.some(v => v.version === version && v.isActive);
}

/**
 * Gets the deprecation status of a version
 */
export function isDeprecated(version: string): boolean {
  const info = getVersionInfo(version);
  if (!info) return false;
  if (!info.deprecationDate) return false;
  return new Date(info.deprecationDate) <= new Date();
}
