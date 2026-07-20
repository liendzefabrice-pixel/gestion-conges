import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';

export interface MailRecipient {
  email: string;
  firstName: string;
}

export interface MailPayload {
  recipients: MailRecipient[];
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
}

@Injectable()
export class MailChannel {
  readonly name = 'mail';
  private readonly logger = new Logger(MailChannel.name);

  constructor(private mailService: MailService) {}

  async send(payload: MailPayload): Promise<void> {
    if (payload.recipients.length === 0) return;

    for (const recipient of payload.recipients) {
      try {
        await this.mailService.sendNotificationEmail(
          recipient.email,
          recipient.firstName,
          payload.title,
          payload.message,
          payload.actionUrl,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send email to ${recipient.email} for "${payload.title}": ${error.message}`,
        );
      }
    }
  }
}
