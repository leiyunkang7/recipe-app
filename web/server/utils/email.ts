/**
 * Email Service Utility
 *
 * Provides email sending functionality for the application.
 * In development mode, verification codes are logged to console.
 * In production, this should be integrated with a real email provider.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendVerificationCodeOptions {
  email: string;
  code: string;
}

/**
 * Send verification code email
 *
 * In development: logs the code to console
 * In production: should send real email via email provider
 */
export async function sendVerificationCode({
  email,
  code,
}: SendVerificationCodeOptions): Promise<{ success: boolean; message?: string }> {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // In development, log to console for easy testing
    console.log('\n========================================');
    console.log('📧 VERIFICATION CODE EMAIL');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Verification Code: ${code}`);
    console.log('========================================\n');

    return { success: true, message: 'Verification code sent (logged to console)' };
  }

  // Production: integrate with real email provider
  // Example: Resend, SendGrid, AWS SES, etc.
  try {
    // TODO: Implement real email sending in production
    // For now, we'll still log but indicate it's production
    console.log(`[PRODUCTION] Would send verification code ${code} to ${email}`);

    return { success: true, message: 'Verification code sent' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    return { success: false, message };
  }
}

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Email service class for more complex email operations
 */
export class EmailService {
  /**
   * Send verification code to email
   */
  static async sendVerificationCode(
    email: string,
    code: string
  ): Promise<{ success: boolean; message?: string }> {
    return sendVerificationCode({ email, code });
  }

  /**
   * Send welcome email after registration
   */
  static async sendWelcomeEmail(email: string, username: string): Promise<{ success: boolean }> {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      console.log(`\n🎉 Welcome email sent to ${email} (${username})\n`);
    }

    return { success: true };
  }
}

export default EmailService;
