import { memo } from 'react';

interface SectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
}

const SectionHeader = memo(({ title, icon }: SectionHeaderProps) => (
    <div className="flex items-center gap-2 px-1 mb-3">
        {icon && <span className="text-primary/50 dark:text-primary/60 transition-colors">{icon}</span>}
        <h3 className="text-[12px] font-semibold uppercase text-gray-400">
            {title}
        </h3>
    </div>
));

SectionHeader.displayName = 'SectionHeader';

export default SectionHeader;
