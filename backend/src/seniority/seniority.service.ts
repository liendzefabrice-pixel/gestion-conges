import { Injectable } from '@nestjs/common';

export interface SeniorityResult {
  years: number;
  months: number;
  totalMonths: number;
  label: string;
}

@Injectable()
export class SeniorityService {
  calculate(hireDate: Date, referenceDate: Date = new Date()): SeniorityResult {
    const hire = new Date(hireDate);
    const ref = new Date(referenceDate);

    let totalMonths = (ref.getFullYear() - hire.getFullYear()) * 12;
    totalMonths += ref.getMonth() - hire.getMonth();
    if (ref.getDate() < hire.getDate()) {
      totalMonths--;
    }
    if (totalMonths < 0) totalMonths = 0;

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mois`);
    if (parts.length === 0) parts.push('0 mois');

    return { years, months, totalMonths, label: parts.join(' ') };
  }
}
