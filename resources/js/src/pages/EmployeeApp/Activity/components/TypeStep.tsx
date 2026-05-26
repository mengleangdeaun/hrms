import React from 'react';
import { motion } from 'framer-motion';
import { 
    IconMapPin, 
    IconBuildingSkyscraper, 
    IconMessages, 
    IconPackage, 
    IconSchool, 
    IconHeadset, 
    IconTools,
    IconDots,
    IconCheck,
    IconTrianglePlus2
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';


interface TypeStepProps {
    selectedType: string;
    onSelect: (type: string) => void;
}

const ACTIVITY_TYPES = [
    { id: 'Sale Outdoor', label: 'Sale Outdoor', icon: IconMapPin, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'Site Visit', label: 'Site Visit', icon: IconBuildingSkyscraper, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'Meeting / Discussion', label: 'Meeting / Discussion', icon: IconMessages, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { id: 'Delivery / Collection', label: 'Delivery / Collection', icon: IconPackage, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'On-Site Service', label: 'On-Site Service', icon: IconTools, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { id: 'Training', label: 'Training', icon: IconSchool, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { id: 'Support', label: 'Support', icon: IconTrianglePlus2, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { id: 'Other', label: 'Other', icon: IconDots, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' },
];

export const TypeStep: React.FC<TypeStepProps> = ({ selectedType, onSelect }) => {
    const { t } = useTranslation('pwa');
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('what_are_you_doing', 'What are you doing?') as string}</h2>
                <p className="text-sm text-gray-500">{t('select_activity_type_desc', 'Select your current activity type to continue') as string}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4">
                {ACTIVITY_TYPES.map((type, idx) => {
                    const isSelected = selectedType === type.id;
                    return (
                        <motion.button
                            key={type.id}
                            layout
                            onClick={() => onSelect(type.id)}
                            className={cn(
                                "relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 active:scale-95",
                                isSelected
                                    ? "bg-primary border-primary shadow-xl shadow-primary/30"
                                    : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-primary/50"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-2xl mb-3 transition-colors",
                                isSelected ? "bg-white/20 text-white" : cn(type.bg, type.color)
                            )}>
                                <type.icon size={28} stroke={2.5} />
                            </div>
                            <span className={cn(
                                "text-[11px] font-black uppercase tracking-wider text-center px-1",
                                isSelected ? "text-white" : "text-gray-600 dark:text-gray-300"
                            )}>
                                {t(type.id.toLowerCase().replace(/ \/ /g, '_').replace(/ /g, '_'), type.label) as string}
                            </span>

                            {isSelected && (
                                <motion.div
                                    layoutId="selected-check"
                                    className="absolute top-3 right-3 w-5 h-5 bg-white text-primary rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <IconCheck size={12} stroke={4} />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center font-medium px-4 leading-relaxed italic">
                {t('activity_type_helper')}
            </p>
        </motion.div>
    );
};
