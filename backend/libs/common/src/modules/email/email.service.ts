import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly royaltyDashboardUrl: string;
  private readonly wrapperTemplate: string;
  private readonly templatesDir: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@Empressa.com';
    this.royaltyDashboardUrl = this.configService.get<string>(
      'ROYALTY_MARKETPLACE_URL',
    ) || 'http://localhost:5000';
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Email service will be disabled.');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }

    this.templatesDir = path.join(__dirname, 'templates');
    // Load the main wrapper template on initialization
    const wrapperPath = path.join(this.templatesDir, 'wrapper.html');
    try {
      this.wrapperTemplate = fs.readFileSync(wrapperPath, 'utf-8');
    } catch (e) {
      this.logger.error(
        `FATAL: Could not load wrapper email template at ${wrapperPath}. Service may be unstable.`,
      );
      throw e;
    }
  }

  private _renderTemplate(
    templateName: string,
    data: Record<string, string>,
  ): string {
    const templatePath = path.join(this.templatesDir, `${templateName}.html`);
    let content = fs.readFileSync(templatePath, 'utf-8');

    // Replace all placeholders with their corresponding data
    for (const key in data) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, data[key]);
    }
    return content;
  }

  private _createBrandedEmail(title: string, contentHtml: string): string {
    return this.wrapperTemplate
      .replace('{{title}}', title)
      .replace('{{content}}', contentHtml);
  }

  async sendOrganizationOnboardingInvitation(
    toEmail: string,
    organizationName: string,
    invitationLink: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Email service is disabled. Cannot send onboarding invitation.');
      return;
    }
    
    this.logger.log(
      `Sending onboarding invitation to ${toEmail} for new organization ${organizationName}`,
    );
    const subject = `Your Empressa Organization is Ready to Claim`;
    try {
      const contentHtml = this._renderTemplate('onboarding-invitation', {
        organizationName,
        invitationLink,
      });

      const fullHtml = this._createBrandedEmail(subject, contentHtml);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html: fullHtml,
      });

      if (error) {
        throw new Error(JSON.stringify(error));
      }

      this.logger.log(
        `Onboarding email sent successfully. Message ID: ${data.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send onboarding email to ${toEmail}`, error);
    }
  }

  async sendOrganizationInvitation(
    toEmail: string,
    organizationName: string,
    invitationLink: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Email service is disabled. Cannot send organization invitation.');
      return;
    }
    
    this.logger.log(`Sending invitation to ${toEmail} for ${organizationName}`);
    const subject = `You're invited to join ${organizationName} on Empressa Platform`;
    try {
      const contentHtml = this._renderTemplate('member-invitation', {
        organizationName,
        invitationLink,
      });

      const fullHtml = this._createBrandedEmail(subject, contentHtml);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html: fullHtml,
      });

      if (error) {
        // Convert error to a safe object for checking
        interface ErrorShape {
          message?: string;
          name?: string;
          statusCode?: number;
        }
        const errorObj = error as ErrorShape;
        const errorMessage = errorObj.message || '';
        const errorName = errorObj.name || '';
        const statusCode = errorObj.statusCode;

        // Check for quota exceeded error
        const isQuotaExceeded =
          statusCode === 429 ||
          errorName === 'daily_quota_exceeded' ||
          (typeof errorMessage === 'string' &&
            (errorMessage.includes('daily email sending quota') ||
              errorMessage.includes('quota exceeded') ||
              errorMessage.includes('daily_quota_exceeded')));

        // Check for network/connectivity errors
        const isNetworkError =
          errorName === 'application_error' ||
          (typeof errorMessage === 'string' &&
            (errorMessage.includes('Unable to fetch data') ||
              errorMessage.includes('request could not be resolved') ||
              errorMessage.includes('network') ||
              errorMessage.includes('connection') ||
              errorMessage.includes('timeout')));

        if (isQuotaExceeded) {
          this.logger.error(
            `[EmailService] Daily email quota exceeded. Free plan: 100 emails/day, 3,000/month. Paid plans have higher limits.`,
          );
          this.logger.error(
            `[EmailService] Failed to send invitation to ${toEmail} due to quota limit.`,
          );
          // Re-throw with a more descriptive error
          throw new Error(
            `Unable to send email. Please check your network connection and try again later.`,
          );
        } else if (isNetworkError) {
          this.logger.error(
            `[EmailService] Network error when sending email to ${toEmail}. Error: ${errorName} - ${errorMessage}`,
          );
          // Re-throw with a user-friendly network error message
          throw new Error(
            `Unable to connect to email service. Please check your network connection and try again later.`,
          );
        } else {
          // For other errors, extract a readable message
          const readableMessage =
            typeof errorMessage === 'string' && errorMessage
              ? errorMessage
              : `Email service error: ${errorName || 'Unknown error'}`;

          this.logger.error(
            `[EmailService] Failed to send email to ${toEmail}. Error: ${readableMessage}`,
          );
          throw new Error(`Unable to send email: ${readableMessage}`);
        }
      }

      this.logger.log(`Email sent successfully. Message ID: ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${toEmail}`, error);
      // Re-throw the error so the caller can handle it appropriately
      throw error;
    }
  }

  async sendOrganizationRequestApproved(
    toEmail: string,
    data: { organizationName: string },
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Email service is disabled. Cannot send approval email.');
      return;
    }
    
    const subject = `Congratulations! Your organization "${data.organizationName}" is ready.`;
    this.logger.log(`Sending approval email to ${toEmail}`);
    try {
      const contentHtml = this._renderTemplate('request-approved', {
        organizationName: data.organizationName,
        dashboardLink: this.royaltyDashboardUrl,
      });

      const fullHtml = this._createBrandedEmail(subject, contentHtml);

      await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html: fullHtml,
      });
    } catch (error) {
      this.logger.error(`Failed to send approval email to ${toEmail}`, error);
    }
  }

  async sendOrganizationRequestRejected(
    toEmail: string,
    data: { requestedName: string; reason: string },
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Email service is disabled. Cannot send rejection email.');
      return;
    }
    
    const subject =
      'An update on your organization request for Empressa Platform';
    this.logger.log(`Sending rejection email to ${toEmail}`);
    try {
      const contentHtml = this._renderTemplate('request-rejected', {
        requestedName: data.requestedName,
        reason: data.reason,
      });

      const fullHtml = this._createBrandedEmail(subject, contentHtml);

      await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html: fullHtml,
      });
    } catch (error) {
      this.logger.error(`Failed to send rejection email to ${toEmail}`, error);
    }
  }

  /**
   * Send a generic email with HTML content
   */
  async sendEmail(
    toEmail: string,
    subject: string,
    htmlContent: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Email service is disabled. Cannot send email.');
      return;
    }
    
    this.logger.log(`Sending email to ${toEmail}: ${subject}`);
    try {
      const fullHtml = this._createBrandedEmail(subject, htmlContent);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject,
        html: fullHtml,
      });

      if (error) {
        throw new Error(JSON.stringify(error));
      }

      this.logger.log(`Email sent successfully. Message ID: ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}`, error);
      throw error;
    }
  }
}
