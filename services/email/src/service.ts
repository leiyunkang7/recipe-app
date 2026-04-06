import { eq, desc } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { emailVerifications, Database } from '@recipe-app/database';
import {
  ServiceResponse,
  successResponse,
  errorResponse,
  type RecipeUpdateNotification,
} from '@recipe-app/shared-types';

/**
 * Email verification result data
 */
export interface VerificationResult {
  verified: boolean;
  message: string;
}

/**
 * Send verification email result data
 */
export interface SendVerificationResult {
  success: boolean;
  message: string;
  code?: string; // Only returned in development mode
}

/**
 * Email service configuration
 */
export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  from: string;
  devMode?: boolean; // If true, logs code to console instead of sending email
}

/**
 * EmailService - Handles email verification code operations
 *
 * Features:
 * - Generate 6-digit verification codes
 * - Send verification emails with rate limiting (60 seconds between sends)
 * - Verify codes with 10-minute expiration
 * - Track verification attempts
 */
export class EmailService {
  private db: Database;
  private config: EmailConfig;
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Verification code validity duration in milliseconds (10 minutes)
   */
  private static readonly CODE_VALIDITY_MS = 10 * 60 * 1000;

  /**
   * Rate limit duration in milliseconds (60 seconds)
   */
  private static readonly RATE_LIMIT_MS = 60 * 1000;

  /**
   * Maximum verification attempts per code
   */
  private static readonly MAX_ATTEMPTS = 5;

  constructor(db: Database, config: EmailConfig) {
    this.db = db;
    this.config = config;

    if (!config.devMode) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    }
  }

  /**
   * Generate a 6-digit numeric verification code
   * @returns 6-digit string
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send a verification email to the specified address
   *
   * Features:
   * - Rate limiting: 60 seconds between sends for the same email
   * - Stores verification code in database with 10-minute expiration
   * - In development mode, logs code to console instead of sending email
   *
   * @param email - Target email address
   * @returns ServiceResponse with send result
   */
  async sendVerificationEmail(email: string): Promise<ServiceResponse<SendVerificationResult>> {
    try {
      // Check rate limit - find the most recent verification for this email
      const recentVerifications = await this.db
        .select()
        .from(emailVerifications)
        .where(eq(emailVerifications.email, email))
        .orderBy(desc(emailVerifications.createdAt))
        .limit(1);

      if (recentVerifications.length > 0) {
        const lastVerification = recentVerifications[0];
        const timeSinceLastSend = Date.now() - new Date(lastVerification.createdAt).getTime();

        if (timeSinceLastSend < EmailService.RATE_LIMIT_MS) {
          const secondsRemaining = Math.ceil(
            (EmailService.RATE_LIMIT_MS - timeSinceLastSend) / 1000
          );
          return errorResponse(
            'RATE_LIMITED',
            `请等待 ${secondsRemaining} 秒后再重新发送验证码`,
            { secondsRemaining }
          );
        }
      }

      // Generate new verification code
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + EmailService.CODE_VALIDITY_MS);

      // Delete any existing verification codes for this email
      await this.db
        .delete(emailVerifications)
        .where(eq(emailVerifications.email, email));

      // Store new verification code
      await this.db.insert(emailVerifications).values({
        email,
        code,
        attempts: 0,
        expiresAt,
      });

      // Send email or log to console in dev mode
      if (this.config.devMode) {
        console.log(`[DEV MODE] 验证码已生成: ${email} -> ${code}`);
        return successResponse({
          success: true,
          message: '验证码已发送（开发模式，请查看控制台）',
          code, // Only return code in dev mode
        });
      }

      // Send actual email
      if (!this.transporter) {
        return errorResponse('CONFIG_ERROR', '邮件服务未正确配置');
      }

      await this.transporter.sendMail({
        from: this.config.from,
        to: email,
        subject: '您的验证码 - Recipe App',
        html: this.generateEmailTemplate(code),
      });

      return successResponse({
        success: true,
        message: '验证码已发送到您的邮箱',
      });
    } catch (error) {
      console.error('发送验证码失败:', error);
      return errorResponse('SEND_ERROR', '发送验证码失败，请稍后重试', error);
    }
  }

  /**
   * Verify a verification code
   *
   * Features:
   * - Checks if code matches and hasn't expired
   * - Tracks and limits verification attempts (max 5)
   * - Deletes code on successful verification
   *
   * @param email - Email address
   * @param code - 6-digit verification code
   * @returns ServiceResponse with verification result
   */
  async verifyCode(email: string, code: string): Promise<ServiceResponse<VerificationResult>> {
    try {
      // Find the verification record
      const verifications = await this.db
        .select()
        .from(emailVerifications)
        .where(eq(emailVerifications.email, email))
        .limit(1);

      if (verifications.length === 0) {
        return successResponse({
          verified: false,
          message: '验证码不存在或已过期，请重新获取',
        });
      }

      const verification = verifications[0];

      // Check if code has expired
      if (new Date() > verification.expiresAt) {
        // Delete expired verification
        await this.db
          .delete(emailVerifications)
          .where(eq(emailVerifications.id, verification.id));

        return successResponse({
          verified: false,
          message: '验证码已过期，请重新获取',
        });
      }

      // Check if max attempts exceeded
      if (verification.attempts >= EmailService.MAX_ATTEMPTS) {
        await this.db
          .delete(emailVerifications)
          .where(eq(emailVerifications.id, verification.id));

        return successResponse({
          verified: false,
          message: '验证尝试次数过多，请重新获取验证码',
        });
      }

      // Check if code matches
      if (verification.code !== code) {
        // Increment attempts
        await this.db
          .update(emailVerifications)
          .set({ attempts: verification.attempts + 1 })
          .where(eq(emailVerifications.id, verification.id));

        const remainingAttempts = EmailService.MAX_ATTEMPTS - verification.attempts - 1;
        return successResponse({
          verified: false,
          message: `验证码错误，还剩 ${remainingAttempts} 次尝试机会`,
        });
      }

      // Verification successful - delete the record
      await this.db
        .delete(emailVerifications)
        .where(eq(emailVerifications.id, verification.id));

      return successResponse({
        verified: true,
        message: '验证成功',
      });
    } catch (error) {
      console.error('验证码验证失败:', error);
      return errorResponse('VERIFY_ERROR', '验证失败，请稍后重试', error);
    }
  }

  /**
   * Generate HTML email template for verification code
   */
  private generateEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #f97316;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Recipe App</h1>
          <p>您的邮箱验证码是：</p>
          <div class="code">${code}</div>
          <p>验证码有效期为 10 分钟，请尽快完成验证。</p>
          <p class="footer">
            如果您没有请求此验证码，请忽略此邮件。<br>
            此邮件由系统自动发送，请勿回复。
          </p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send a recipe update notification email
   *
   * @param email - Target email address
   * @param notification - Recipe update notification data
   * @returns ServiceResponse with send result
   */
  async sendRecipeUpdateEmail(
    email: string,
    notification: RecipeUpdateNotification
  ): Promise<ServiceResponse<{ success: boolean; message: string }>> {
    try {
      if (this.config.devMode) {
        console.log('[DEV MODE] 食谱更新通知: ' + email + ' -> ' + notification.title);
        return successResponse({
          success: true,
          message: '食谱更新通知已发送（开发模式，请查看控制台）',
        });
      }

      if (!this.transporter) {
        return errorResponse('CONFIG_ERROR', '邮件服务未正确配置');
      }

      await this.transporter.sendMail({
        from: this.config.from,
        to: email,
        subject: '食谱更新通知: ' + notification.title,
        html: this.generateRecipeUpdateTemplate(notification),
      });

      return successResponse({
        success: true,
        message: '食谱更新通知已发送',
      });
    } catch (error) {
      console.error('发送食谱更新通知失败:', error);
      return errorResponse('SEND_ERROR', '发送食谱更新通知失败，请稍后重试', error);
    }
  }

  /**
   * Generate HTML email template for recipe update notification
   */
  private generateRecipeUpdateTemplate(notification: RecipeUpdateNotification): string {
    const description = notification.description || '这是一份食谱更新通知。';
    const appUrl = process.env.APP_URL || 'https://recipe-app.com';
    let updatedFieldsHtml = '';
    if (notification.updatedFields) {
      updatedFieldsHtml = '<p style="color: #666; font-size: 14px;">更新的内容: ' + notification.updatedFields.join(', ') + '</p>';
    }
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.container{background:#f9f9f9;border-radius:8px;padding:30px}.header{text-align:center;margin-bottom:20px}.title{font-size:24px;font-weight:bold;color:#f97316;margin-bottom:10px}.badge{background:#f97316;color:white;padding:4px 12px;border-radius:12px;font-size:12px;display:inline-block}.description{background:#fff;padding:20px;border-radius:8px;margin:20px 0}.footer{font-size:12px;color:#666;margin-top:20px;text-align:center}.button{display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:20px 0}</style></head><body><div class="container"><div class="header"><div class="badge">食谱更新</div><h1 class="title">' + notification.title + '</h1></div><div class="description"><p>' + description + '</p>' + updatedFieldsHtml + '</div><div style="text-align:center;"><a href="' + appUrl + '/recipes/' + notification.recipeId + '" class="button">查看食谱</a></div><div class="footer">您收到此邮件是因为您订阅了此食谱的更新通知。<br>如果您不想继续接收此类通知，可以取消订阅。</div></div></body></html>';
  }
}

/**
 * Create email service from environment variables
 */
export function createEmailService(db: Database): EmailService {
  const devMode = process.env.EMAIL_DEV_MODE === 'true';

  const config: EmailConfig = {
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'noreply@recipe-app.com',
    devMode,
  };

  return new EmailService(db, config);
}
