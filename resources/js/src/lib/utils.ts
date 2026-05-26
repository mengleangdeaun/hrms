import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalizedMilestone(milestone: string, t: any) {
  if (!milestone) return '';
  return milestone
    .replace(/Months/g, t('milestone_months', 'Months'))
    .replace(/Month/g, t('milestone_month', 'Month'))
    .replace(/Years/g, t('milestone_years', 'Years'))
    .replace(/Year/g, t('milestone_year', 'Year'))
    .replace(/Birthday/g, t('birthday', 'Birthday'));
}

