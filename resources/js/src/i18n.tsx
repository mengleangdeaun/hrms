import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import themeConfig from './theme.config';
import { isEmployeeAppRoute } from './utils/routeHelper';

// Detect the app context once at module init time (synchronous, no render dependency).
// PWA routes only need 'pwa' namespace — skipping translation.json (105 KB),
// smartsearch.json, and the lazily-triggered report.json.
const isPwa = isEmployeeAppRoute(window.location.pathname);


i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: themeConfig.locale || 'en',
        debug: false,
        load: 'all',
        ns: isPwa ? ['pwa'] : ['translation', 'pwa', 'smartsearch'],
        defaultNS: isPwa ? 'pwa' : 'translation',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
