import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  EMPLOYEE: 'Employé',
  HR: 'RH',
  DIRECTOR: 'Directeur',
}

export function translateRole(roleName: string): string {
  return roleLabels[roleName] || roleName
}
