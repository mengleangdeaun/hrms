import { createSlice } from '@reduxjs/toolkit';
import i18next from 'i18next';
import themeConfig from '../theme.config';

const defaultState = {
    isDarkMode: false,
    mainLayout: 'app',
    theme: 'light',
    menu: 'vertical',
    layout: 'full',
    rtlClass: 'ltr',
    animation: '',
    navbar: 'navbar-sticky',
    locale: 'en',
    sidebar: false,
    pageTitle: '',
    languageList: [
        { code: 'kh', name: 'Khmer' },
        { code: 'en', name: 'English' },
        { code: 'zh', name: 'Chinese' },
   

    ],
    semidark: false,
};

const initialState = {
    theme: localStorage.getItem('theme') || themeConfig.theme,
    menu: localStorage.getItem('menu') || themeConfig.menu,
    layout: localStorage.getItem('layout') || themeConfig.layout,
    rtlClass: localStorage.getItem('rtlClass') || themeConfig.rtlClass,
    animation: localStorage.getItem('animation') || themeConfig.animation,
    navbar: localStorage.getItem('navbar') || themeConfig.navbar,
    locale: localStorage.getItem('i18nextLng') || themeConfig.locale,
    isDarkMode: false,
    sidebar: localStorage.getItem('sidebar') || defaultState.sidebar,
    semidark: localStorage.getItem('semidark') || themeConfig.semidark,
    languageList: [
        { code: 'kh', name: 'Khmer' },
        { code: 'en', name: 'English' },
        { code: 'zh', name: 'Chinese' },
    ],
    fontFamily: JSON.parse(localStorage.getItem('user_info') || '{}')?.preferences?.font_family || 'Google Sans',
    dateFormat: JSON.parse(localStorage.getItem('user_info') || '{}')?.preferences?.date_format || 'DD MMM YYYY',
    timeFormat: JSON.parse(localStorage.getItem('user_info') || '{}')?.preferences?.time_format || '12h',
    accentColor: localStorage.getItem('accentColor') || JSON.parse(localStorage.getItem('user_info') || '{}')?.preferences?.accent_color || 'red',
    customPrimaryColor: localStorage.getItem('customPrimaryColor') 
        ? JSON.parse(localStorage.getItem('customPrimaryColor')!) 
        : JSON.parse(localStorage.getItem('user_info') || '{}')?.preferences?.custom_primary_color || null,
    cookieConsent: 'pending',
    userPreferences: {
        two_factor_telegram: JSON.parse(localStorage.getItem('user_info') || '{}')?.preferences?.two_factor_telegram || false
    },
    user: JSON.parse(localStorage.getItem('user_info') || 'null'),
};

const themeConfigSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {
        setUserPreferences(state: any, { payload }) {
            if (payload) {
                // If the payload contains the full user object (common in some API responses)
                if (payload.user) {
                    state.user = payload.user;
                }

                state.fontFamily = payload.font_family || state.fontFamily;
                state.dateFormat = payload.date_format || state.dateFormat;
                state.timeFormat = payload.time_format || state.timeFormat;
                state.accentColor = payload.accent_color || state.accentColor;
                state.customPrimaryColor = payload.custom_primary_color || state.customPrimaryColor;
                
                // Set nested userPreferences
                state.userPreferences = {
                    ...state.userPreferences,
                    two_factor_telegram: payload.two_factor_telegram === 1 || payload.two_factor_telegram === true || false
                };
            }
        },
        setAccentColor(state, { payload }) {
            state.accentColor = payload.color;
            state.customPrimaryColor = payload.customHsl || null;
            localStorage.setItem('accentColor', payload.color);
            if (payload.customHsl) {
                localStorage.setItem('customPrimaryColor', JSON.stringify(payload.customHsl));
            } else {
                localStorage.removeItem('customPrimaryColor');
            }
        },
        toggleTheme(state, { payload }) {
            payload = payload || state.theme; // light | dark | system
            localStorage.setItem('theme', payload);
            state.theme = payload;
            if (payload === 'light') {
                state.isDarkMode = false;
            } else if (payload === 'dark') {
                state.isDarkMode = true;
            } else if (payload === 'system') {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    state.isDarkMode = true;
                } else {
                    state.isDarkMode = false;
                }
            }

            if (state.isDarkMode) {
                document.querySelector('body')?.classList.add('dark');
            } else {
                document.querySelector('body')?.classList.remove('dark');
            }
        },
        toggleMenu(state, { payload }) {
            payload = payload || state.menu; // vertical, collapsible-vertical, horizontal
            state.sidebar = false; // reset sidebar state
            localStorage.setItem('menu', payload);
            state.menu = payload;
        },
        toggleLayout(state, { payload }) {
            payload = payload || state.layout; // full, boxed-layout
            localStorage.setItem('layout', payload);
            state.layout = payload;
        },
        toggleRTL(state, { payload }) {
            payload = payload || state.rtlClass; // rtl, ltr
            localStorage.setItem('rtlClass', payload);
            state.rtlClass = payload;
            document.querySelector('html')?.setAttribute('dir', state.rtlClass || 'ltr');
        },
        toggleAnimation(state, { payload }) {
            payload = payload || state.animation; // animate__fadeIn, animate__fadeInDown, animate__fadeInUp, animate__fadeInLeft, animate__fadeInRight, animate__slideInDown, animate__slideInLeft, animate__slideInRight, animate__zoomIn
            payload = payload?.trim();
            localStorage.setItem('animation', payload);
            state.animation = payload;
        },
        toggleNavbar(state, { payload }) {
            payload = payload || state.navbar; // navbar-sticky, navbar-floating, navbar-static
            localStorage.setItem('navbar', payload);
            state.navbar = payload;
        },
        toggleSemidark(state, { payload }) {
            payload = payload === true || payload === 'true' ? true : false;
            localStorage.setItem('semidark', payload);
            state.semidark = payload;
        },
        toggleLocale(state, { payload }) {
            payload = payload || state.locale;
            if (state.locale !== payload) {
                i18next.changeLanguage(payload);
            }
            state.locale = payload;
        },
        toggleSidebar(state) {
            state.sidebar = !state.sidebar;
        },

        setPageTitle(state, { payload }) {
            document.title = `${payload} | SCCG`;
        },
        setUser(state: any, { payload }) {
            state.user = payload;
            if (payload?.preferences) {
                // Also update preferences if they are in the user object
                state.fontFamily = payload.preferences.font_family || state.fontFamily;
                state.dateFormat = payload.preferences.date_format || state.dateFormat;
                state.timeFormat = payload.preferences.time_format || state.timeFormat;
                state.accentColor = payload.preferences.accent_color || state.accentColor;
                state.customPrimaryColor = payload.preferences.custom_primary_color || state.customPrimaryColor;
                state.userPreferences = {
                    ...state.userPreferences,
                    two_factor_telegram: !!payload.preferences.two_factor_telegram
                };
            }
        },
    },
});

export const { setUser, setUserPreferences, setAccentColor, toggleTheme, toggleMenu, toggleLayout, toggleRTL, toggleAnimation, toggleNavbar, toggleSemidark, toggleLocale, toggleSidebar, setPageTitle } = themeConfigSlice.actions;

export default themeConfigSlice.reducer;
