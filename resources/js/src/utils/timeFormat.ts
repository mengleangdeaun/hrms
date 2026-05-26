import { TFunction } from 'i18next';

/**
 * Formats minutes into a human-readable duration string (e.g., 125 -> "2 hr 5 mins").
 */
export const formatMinutesToDuration = (mins: number, t: TFunction) => {
    if (mins < 60) return `${mins} ${t('mins', 'mins')}`;
    
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (remainingMins === 0) {
        return `${hours} ${hours > 1 ? t('hours', 'hours') : t('hour', 'hour')}`;
    }
    
    return `${hours} ${t('hr', 'hr')} ${remainingMins} ${t('mins', 'mins')}`;
};
