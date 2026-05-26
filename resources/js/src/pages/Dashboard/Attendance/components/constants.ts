export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export const STATUS_CATEGORIES = [
    { name: 'Early', id: 100, shades: ['#d1fae5', '#10b981', '#065f46'] }, 
    { name: 'In-on time', id: 200, shades: ['#dbeafe', '#3b82f6', '#1e40af'] }, 
    { name: 'Warning', id: 300, shades: ['#fef3c7', '#f59e0b', '#92400e'] },
    { name: 'Late', id: 400, shades: ['#ffedd5', '#f97316', '#9a3412'] },
    { name: 'Early Departure', id: 500, shades: ['#ffedd5', '#f97316', '#912d0f'] },
    { name: 'Out-on time', id: 600, shades: ['#dbeafe', '#3b82f6', '#1d4ed8'] },
    { name: 'Stay Late', id: 700, shades: ['#e0e7ff', '#6366f1', '#3730a3'] },
    { name: 'Overtime', id: 800, shades: ['#dcfce7', '#10b981', '#166534'] },
    { name: 'Absent', id: 900, shades: ['#ffe4e6', '#f43f5e', '#9f1239'] }
];

export const LEADERBOARD_TABS = [
    { id: 'performance', label: 'MVP Performance' },
    { id: 'overtime', label: 'Overtime Master' },
    { id: 'early_arrival', label: 'Early In-on time' },
    { id: 'stay_late', label: 'Stay Late' },
    { id: 'late_arrival', label: 'Late Arrival' },
    { id: 'early_departure', label: 'Early Departure' }
];

export const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

export const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};
