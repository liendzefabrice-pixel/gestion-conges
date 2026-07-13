import { MailOptions } from './mail-options.interface';

export interface MailTransport {
  readonly name: string;
  sendMail(options: MailOptions): Promise<void>;
}
