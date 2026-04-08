/**
 * Get Current User API Endpoint
 *
 * GET /api/auth/me
 * Returns the current authenticated user
 */

import { defineEventHandler } from 'h3';
import { rateLimiters } from '../../utils/rateLimit';
import { getCurrentUser } from '../../utils/session';
import type { ServiceResponse, User } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  // Rate limiting for auth check
  await rateLimiters.standard(event);
  try {
    const user = await getCurrentUser(event);
    
    if (!user) {
      return {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User is not authenticated',
        },
      } satisfies ServiceResponse<never>;
    }

    return {
      success: true,
      data: user,
    } satisfies ServiceResponse<User>;
  } catch (error) {
    console.error('[me] Error:', error);
    return {
      success: false,
      error: {
        code: 'ERROR',
        message: 'Failed to get user',
      },
    } satisfies ServiceResponse<never>;
  }
});
