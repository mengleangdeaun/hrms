/**
 * Employee PWA Preference Applicator
 * Reads preferences and applies them to the DOM immediately.
 * Call this on app boot (MobileLayout) and whenever preferences change (Profile page).
 */

import i18n from '@/i18n';
import { THEME_COLORS } from '@/constants/themeColors';

export interface EmpPrefs {
    dark_mode?: boolean;
    color_theme?: string;
    font_family?: string;
    font_size?: string;
    locale?: string;
}

// Font size map — applies to root font-size so rem scales everything
const FONT_SIZE_MAP: Record<string, string> = {
    small: '14px',
    medium: '16px',
    large: '18px',
};

/** Convert Hex to HSL string for Tailwind/CSS variables */
function hexToHsl(hex: string, lOverride?: number): string {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Handle short hex (#f00)
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    const H = Math.round(h * 360);
    const S = Math.round(s * 100);
    const L = lOverride !== undefined ? lOverride : Math.round(l * 100);

    return `${H} ${S}% ${L}%`;
}

export function applyEmployeePreferences(prefs: EmpPrefs) {
    const root = document.documentElement;
    const body = document.body;

    // 1 ── Dark Mode ──────────────────────────────────────────────────────────
    // Apply to both root and body to override global theme settings from Admin app
    if (prefs.dark_mode) {
        root.classList.add('dark');
        body.classList.add('dark');
    } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
    }

    // 2 ── Color Theme (--primary CSS variable) ───────────────────────────────
    let themeValue = prefs.color_theme ?? 'red';
    if (themeValue === 'default') themeValue = 'red'; // Fallback for legacy data

    const isDark = !!prefs.dark_mode;
    
    // Find color in constants or handle custom hex
    let primaryHsl, secondaryHsl, accentHsl, ringHsl;
    
    const isCustomHex = themeValue.startsWith('#');
    const colorTheme = THEME_COLORS.find(c => c.value === themeValue);

    if (isCustomHex) {
        primaryHsl = hexToHsl(themeValue);
        secondaryHsl = hexToHsl(themeValue, isDark ? 18 : 94);
        accentHsl = hexToHsl(themeValue, isDark ? 20 : 90);
        ringHsl = primaryHsl;
    } else {
        const activeTheme = colorTheme || THEME_COLORS.find(c => c.value === 'red')!;
        primaryHsl = (isDark ? activeTheme.darkPrimary : activeTheme.primary).trim();
        secondaryHsl = (isDark ? activeTheme.darkSecondary : activeTheme.secondary).trim();
        accentHsl = (isDark ? activeTheme.darkAccent : activeTheme.accent).trim();
        ringHsl = (isDark ? activeTheme.darkRing : activeTheme.ring).trim();
    }

    [root, body].forEach(el => {
        el.style.setProperty('--primary', primaryHsl);
        el.style.setProperty('--primary-foreground', '0 0% 100%');
        el.style.setProperty('--secondary', secondaryHsl);
        el.style.setProperty('--accent', accentHsl);
        el.style.setProperty('--ring', ringHsl);
    });

    // 3 ── Font Family ────────────────────────────────────────────────────────
    let fontFamily = prefs.font_family ?? 'Google Sans';
    
    // Standardize font stack application
    let fontStack = fontFamily;
    
    // If it's a simple font name (no comma and not already quoted), wrap it in a safe stack
    if (!fontFamily.includes(',') && !fontFamily.startsWith('"') && !fontFamily.startsWith("'")) {
        fontStack = `"${fontFamily}", sans-serif`;
    }

    // Apply to both root and body. Root is for the CSS variable, body is for direct inheritance.
    [root, body].forEach(el => {
        el.style.setProperty('--font-family', fontStack);
    });
    body.style.fontFamily = fontStack;

    // 4 ── Font Size ──────────────────────────────────────────────────────────
    const fontSize = prefs.font_size ?? 'medium';
    root.style.fontSize = FONT_SIZE_MAP[fontSize] ?? '16px';

    // 5 ── Language ───────────────────────────────────────────────────────────
    if (prefs.locale && i18n.language !== prefs.locale) {
        i18n.changeLanguage(prefs.locale);
    }
}

/** Load from localStorage (for instant boot, before API responds) */
export function loadStoredPreferences(): EmpPrefs {
    try {
        const stored = localStorage.getItem('employee_preferences');
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

/** Persist to localStorage for instant next-boot application */
export function storePreferences(prefs: EmpPrefs) {
    localStorage.setItem('employee_preferences', JSON.stringify(prefs));
}
