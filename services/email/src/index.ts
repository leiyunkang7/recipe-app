/**
 * @recipe-app/email-service - Email Verification Service
 *
 * Provides email verification code functionality for user registration
 * and other email-based verification flows.
 */

export {
  EmailService,
  createEmailService,
  type EmailConfig,
  type VerificationResult,
  type SendVerificationResult,
} from './service';
