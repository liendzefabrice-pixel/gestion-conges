import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { MailOptions } from './interfaces/mail-options.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null;
  private layoutTemplate: HandlebarsTemplateDelegate;
  private readonly templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    this.initTransporter();
    this.loadTemplates();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      this.logger.log(`SMTP transporter initialized: ${host}:${port}`);
    } else {
      this.logger.warn('SMTP not configured — mail will be logged to console only');
      this.transporter = null;
    }
  }

  private loadTemplates() {
    const templatesDir = path.join(process.cwd(), 'src', 'mail', 'templates');
    const layoutPath = path.join(templatesDir, 'layout.hbs');

    if (fs.existsSync(layoutPath)) {
      const layoutSrc = fs.readFileSync(layoutPath, 'utf-8');
      this.layoutTemplate = handlebars.compile(layoutSrc);
    }

    const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.hbs') && f !== 'layout.hbs');
    for (const file of files) {
      const name = path.basename(file, '.hbs');
      const src = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
      this.templates.set(name, handlebars.compile(src));
    }

    this.logger.log(`Loaded ${this.templates.size} email template(s): ${[...this.templates.keys()].join(', ')}`);
  }

  private getFromAddress(): string {
    return this.configService.get<string>('SMTP_FROM') || 'noreply@siap-pharma.com';
  }

  private async render(templateName: string, context: Record<string, any>): Promise<string> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Email template "${templateName}" not found`);
    }

    const bodyContent = template(context);
    return this.layoutTemplate({ body: bodyContent, year: new Date().getFullYear() });
  }

  async sendMail(options: MailOptions): Promise<void> {
    const html = await this.render(options.template, options.context);

    if (!this.transporter) {
      this.logger.log(`[DEV EMAIL] To: ${options.to} | Subject: ${options.subject}`);
      this.logger.log(`[DEV EMAIL] Template: ${options.template} | Context: ${JSON.stringify(options.context)}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"SIAP PHARMA" <${this.getFromAddress()}>`,
        to: options.to,
        subject: options.subject,
        html,
      });
      this.logger.log(`Email sent to ${options.to} — ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
    }
  }

  async sendForgotPasswordOTP(to: string, firstName: string, otp: string, expirationMinutes: number): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Réinitialisation de mot de passe — SIAP PHARMA',
      template: 'forgot-password',
      context: { firstName, otp, expirationMinutes },
    });
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Bienvenue sur SIAP PHARMA — Gestion des Congés',
      template: 'welcome',
      context: { firstName, year: new Date().getFullYear() },
    });
  }

  async sendNotificationEmail(to: string, firstName: string, title: string, message: string, actionUrl?: string): Promise<void> {
    await this.sendMail({
      to,
      subject: title,
      template: 'notification',
      context: { firstName, title, message, actionUrl },
    });
  }

  async sendCustomEmail(to: string, subject: string, templateName: string, context: Record<string, any>): Promise<void> {
    await this.sendMail({ to, subject, template: templateName, context });
  }
}
