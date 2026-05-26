import { Toaster } from 'sonner';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import { useLocation } from 'react-router-dom';

const GlobalToaster = () => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const location = useLocation();

    // Render standard toaster only for Admin/Main site to avoid duplication with MobileLayout's PwaToaster
    // We explicitly exclude /employee (full mobile app) and mobile-specific attendance entry points
    if (
        location.pathname.startsWith('/employee') || 
        location.pathname === '/employee/login' || 
        location.pathname === '/attendance/scan'
    ) {
        return null;
    }

    return (
        <Toaster 
            richColors 
            position="top-center" 
            theme={themeConfig.theme as 'light' | 'dark' | 'system'} 
            toastOptions={{
                className: 'font-google_sans', 
                classNames: {
                    toast: 'font-google_sans',
                    title: 'font-google_sans',
                    description: 'font-google_sans',
                }
            }} 
        />
    );
};

export default GlobalToaster;
