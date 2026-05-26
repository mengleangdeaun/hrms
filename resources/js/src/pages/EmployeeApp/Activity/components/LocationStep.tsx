import React from 'react';
import { motion } from 'framer-motion';
import { IconMapPin, IconLoader2, IconCurrentLocation, IconCheck } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface LocationStepProps {
    location: { lat: number; lng: number; name?: string } | null;
    loading: boolean;
    onRequest: () => void;
    onBack: () => void;
    onNext: () => void;
}

export function LocationStep({ location, loading, onRequest, onBack, onNext }: LocationStepProps) {
    const { t } = useTranslation('pwa');
    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-3xl border border-primary/10 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                        <IconMapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">{t('tag_your_location', 'Tag Your Location') as string}</h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">{t('step_2_geotagging', 'Step 2: Geotagging') as string}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="relative">
                            <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
                            <IconMapPin className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium animate-pulse">{t('detecting_coordinate', 'Detecting coordinate data...') as string}</p>
                    </div>
                ) : location ? (
                    <div className="space-y-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto border-4 border-white dark:border-gray-800 shadow-xl">
                            <IconCheck className="w-8 h-8 text-emerald-500" />
                        </div>
                        
                        <div className="space-y-2">
                            {location.name ? (
                                <h4 className="text-lg font-black text-gray-900 dark:text-white leading-snug px-4">
                                    {location.name}
                                </h4>
                            ) : (
                                <h4 className="text-lg font-black text-gray-400 dark:text-white leading-snug">
                                    {t('location_captured', 'Location Captured') as string}
                                </h4>
                            )}
                            <p className="text-[10px] font-black uppercase tracking-wider text-primary/60">
                                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </p>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={onRequest} 
                                className="inline-flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-all"
                            >
                                <IconCurrentLocation className="w-3.5 h-3.5" /> {t('refresh_gps', 'Refresh GPS') as string}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mx-auto">
                            <IconMapPin className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium px-4">{t('location_access_needed', 'Location access is needed for field verification.') as string}</p>
                        <button 
                            onClick={onRequest} 
                            className="inline-flex items-center gap-2 text-xs font-black text-white bg-primary px-6 py-3 rounded-2xl shadow-lg shadow-primary/20"
                        >
                            {t('authorize_location', 'Authorize Location') as string}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={onBack} 
                    className="py-4 rounded-full border-2 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
                >
                     {t('back', 'Back') as string}
                </button>
                <button 
                    onClick={onNext} 
                    className={cn(
                        "py-4 rounded-full bg-primary text-white font-black text-xs uppercase tracking-wider shadow shadow-primary/30 active:scale-95 transition-all",
                        !location && "opacity-50 grayscale"
                    )}
                >
                    {t('next_step', 'Next Step') as string}
                </button>
            </div>
        </motion.div>
    );
}
