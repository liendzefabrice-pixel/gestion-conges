import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export const leaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1, 'Type de congé requis'),
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  reason: z.string().min(3, 'Le motif doit contenir au moins 3 caractères'),
}).refine((data) => !data.startDate || !data.endDate || new Date(data.endDate) >= new Date(data.startDate), {
  message: 'La date de fin doit être après ou égale à la date de début',
  path: ['endDate'],
})

export const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au minimum 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une lettre minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirmation requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export const permissionRequestSchema = z.object({
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  reason: z.string().min(3, 'Le motif doit contenir au moins 3 caractères'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
  otp: z.string().length(6, 'Le code doit contenir 6 chiffres'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirmation requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type PermissionRequestFormData = z.infer<typeof permissionRequestSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
