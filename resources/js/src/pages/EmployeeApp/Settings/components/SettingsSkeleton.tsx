import { memo } from 'react';

const SettingsSkeleton = memo(() => (
    <div className="flex-1 p-0 space-y-6 pb-32 animate-pulse">
        {/* Appearance / Dark Mode */}
        <section className="space-y-3">
            <div className="flex items-center gap-2 px-1 mb-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="w-24 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                        <div className="space-y-2">
                            <div className="w-24 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-800 rounded" />
                        </div>
                    </div>
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                </div>
            </div>
        </section>

        {/* Language */}
        <section className="space-y-3">
            <div className="flex items-center gap-2 px-1 mb-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="w-20 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    ))}
                </div>
            </div>
        </section>

        {/* Typography */}
        <section className="space-y-3">
            <div className="flex items-center gap-2 px-1 mb-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="w-24 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-4">
                <div>
                    <div className="w-20 h-2.5 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
                    <div className="grid grid-cols-2 gap-2">
                        {[1, 2].map(i => (
                            <div key={i} className="h-11 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                        ))}
                    </div>
                </div>
                <div>
                    <div className="w-20 h-2.5 bg-gray-200 dark:bg-gray-800 rounded mb-3 flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-200 dark:bg-gray-800 rounded-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        </section>

        {/* Accent Color */}
        <section className="space-y-3">
            <div className="flex items-center gap-2 px-1 mb-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="w-28 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    ))}
                </div>
            </div>
        </section>
        
        {/* Device Management */}
        <section className="space-y-3">
            <div className="flex items-center gap-2 px-1 mb-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="w-32 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1 pt-1">
                        <div className="w-32 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded mt-3" />
                        <div className="w-3/4 h-2 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                </div>
                <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
            </div>
        </section>
    </div>
));

SettingsSkeleton.displayName = 'SettingsSkeleton';

export default SettingsSkeleton;
