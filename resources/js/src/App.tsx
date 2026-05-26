import { PropsWithChildren, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from './store';
import { toggleRTL, toggleTheme, toggleLocale, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from './store/themeConfigSlice';
import store from './store';
import { applyAccentColor } from './utils/themeUtils';

import { AttendanceProvider } from './context/AttendanceContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConnectionProvider } from './context/ConnectionContext';
function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(toggleTheme(themeConfig.theme));
        dispatch(toggleMenu(themeConfig.menu));
        dispatch(toggleLayout(themeConfig.layout));
        dispatch(toggleRTL(themeConfig.rtlClass));
        dispatch(toggleAnimation(themeConfig.animation));
        dispatch(toggleNavbar(themeConfig.navbar));
        dispatch(toggleLocale(themeConfig.locale));
        dispatch(toggleSemidark(themeConfig.semidark));
    }, [dispatch]);

    useEffect(() => {
        applyAccentColor(themeConfig.accentColor, themeConfig.customPrimaryColor);
    }, [themeConfig.accentColor, themeConfig.customPrimaryColor, themeConfig.theme]);

    useEffect(() => {
        // Set the primary font variable based on Redux preference. 
        // This acts as the source of truth for the Admin App, 
        // while allowing other layouts (like PWA) to override it if needed.
        document.documentElement.style.setProperty('--font-family', themeConfig.fontFamily);
    }, [themeConfig.fontFamily]);

    return (
        <ConnectionProvider>
            <AttendanceProvider>
                <NotificationProvider>
                    <div
                        className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass
                            } main-section antialiased relative text-sm font-normal`}
                        style={{ fontFamily: 'var(--font-family, "Google Sans")' }}
                    >
                        {children}
                    </div>
                </NotificationProvider>
            </AttendanceProvider>
        </ConnectionProvider>
    );
}

export default App;
