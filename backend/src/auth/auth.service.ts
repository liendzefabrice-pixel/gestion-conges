import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Adresse email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Votre compte a été désactivé. Veuillez contacter l\'administrateur.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Adresse email ou mot de passe incorrect');
    }

    if (!user.welcomeSent) {
      await this.notificationsService.welcomeNotification(user.id);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { welcomeSent: true },
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        role: { id: user.role.id, name: user.role.name },
      },
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    const isSameAsOld = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );

    if (isSameAsOld) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l\'ancien.',
      );
    }

    this.validatePasswordStrength(changePasswordDto.newPassword);

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    return { message: 'Mot de passe modifié avec succès' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException(
        'Aucun compte n\'est associé à cette adresse email.',
      );
    }

    if (!user.isActive) {
      throw new BadRequestException(
        'Votre compte a été désactivé. La réinitialisation du mot de passe n\'est pas autorisée.',
      );
    }

    const otpExpiration = this.configService.get<number>('OTP_EXPIRATION_MINUTES') || 10;
    const maxRequests = this.configService.get<number>('OTP_MAX_REQUESTS') || 3;
    const rateWindowMinutes = this.configService.get<number>('OTP_RATE_LIMIT_WINDOW_MINUTES') || 15;

    const recentCount = await this.prisma.passwordResetOtp.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - rateWindowMinutes * 60 * 1000) },
      },
    });

    if (recentCount >= maxRequests) {
      throw new BadRequestException(
        `Vous avez atteint la limite de ${maxRequests} demandes en ${rateWindowMinutes} minutes. Réessayez plus tard.`,
      );
    }

    await this.prisma.passwordResetOtp.deleteMany({ where: { userId: user.id } });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + otpExpiration * 60 * 1000);

    await this.prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otp,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'OTP_GENERATED',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
      },
    });

    const firstName = user.firstName || user.email;

    await this.mailService.sendForgotPasswordOTP(user.email, firstName, otp, otpExpiration);

    return { message: 'Un code de vérification a été envoyé par email.' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: verifyOtpDto.email },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const otpRecord = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        otp: verifyOtpDto.otp,
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      await this.prisma.auditLog.create({
        data: {
          action: 'OTP_INVALID_ATTEMPT',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
        },
      });
      throw new BadRequestException('Code de vérification incorrect.');
    }

    if (otpRecord.expiresAt < new Date()) {
      await this.prisma.auditLog.create({
        data: {
          action: 'OTP_EXPIRED_ATTEMPT',
          entityType: 'USER',
          entityId: user.id,
          userId: user.id,
        },
      });
      throw new BadRequestException('Le code de vérification a expiré. Veuillez demander un nouveau code.');
    }

    await this.prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'OTP_VERIFIED',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
      },
    });

    return { message: 'Code vérifié avec succès' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: resetPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const validOtp = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        otp: resetPasswordDto.otp,
        used: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) {
      throw new BadRequestException('Veuillez d\'abord vérifier votre code de réinitialisation.');
    }

    if (validOtp.expiresAt < new Date()) {
      throw new BadRequestException('Le code de vérification a expiré. Veuillez recommencer.');
    }

    this.validatePasswordStrength(resetPasswordDto.newPassword);

    const isSameAsOld = await bcrypt.compare(
      resetPasswordDto.newPassword,
      user.password,
    );

    if (isSameAsOld) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l\'ancien.',
      );
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
        },
      });

      await tx.passwordResetOtp.deleteMany({ where: { userId: user.id } });
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
      },
    });

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au minimum 8 caractères.',
      );
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins une lettre majuscule.',
      );
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins une lettre minuscule.',
      );
    }

    if (!/[0-9]/.test(password)) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins un chiffre.',
      );
    }
  }
}
