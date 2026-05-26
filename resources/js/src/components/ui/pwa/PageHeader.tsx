import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PwaActionButton } from './PwaActionButton';
import { IconArrowLeft } from '@tabler/icons-react';

interface PageHeaderProps {
    title: string;
    icon?: ReactNode;
    rightAction?: ReactNode;
    backButton?: ReactNode;
    onBack?: () => void;
}

// Pages that are top-level tabs — no back button needed
const ROOT_PATHS = [
    '/employee/dashboard',
    '/employee/calendar',
    '/employee/scan',
    '/employee/notifications',
    '/employee/profile',
];

/**
 * Reusable sticky page header for the Employee PWA.
 * Automatically shows a back button on sub-pages (non bottom-nav routes).
 */
const PageHeader = ({ title, icon, rightAction, backButton, onBack }: PageHeaderProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const showBack = !ROOT_PATHS.includes(location.pathname);

    return (
        <div className="bg-gray-50 dark:bg-[#060818] px-4 sticky top-0 z-50 border-none flex items-center justify-between h-[56px]">
            {/* Left: Back Button or Spacer */}
            <div className="w-10 shrink-0 flex items-center">
                {backButton ? backButton : (showBack ? (
                    <PwaActionButton
                        icon={<IconArrowLeft />}
                        variant="soft"
                        onClick={onBack ?? (() => navigate(-1))}
                        aria-label="Go back"
                    />
                ) : null)}
            </div>

            {/* Centered Title */}
            <h1 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 truncate px-2">
                {icon && <span className="text-primary shrink-0">{icon}</span>}
                {title}
            </h1>

            {/* Right Action Slot - Flexible Width */}
            <div className="min-w-[40px] w-auto shrink-0 flex justify-end items-center gap-2">
                {rightAction ?? null}
            </div>
        </div>
    );
};

export default PageHeader;

