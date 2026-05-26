import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { setUserPreferences, setAccentColor, toggleTheme, setUser, setPageTitle } from '@/store/themeConfigSlice';
import { hexToHsl, applyAccentColor } from '@/utils/themeUtils';
import api from '@/utils/api';
import { toast } from 'sonner';
import {
    IconSettings, IconPalette, IconClock, IconBell, IconShieldCheck,
    IconDeviceFloppy, IconTypography, IconCalendar, IconClockHour4,
    IconCookie, IconLoader2, IconDroplet, IconCheck, IconSun, IconMoon,
    IconDeviceDesktop, IconBrush, IconBrandTelegram, IconRotate, IconCircleCheck
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import TelegramLoginButton from '@/components/Shared/TelegramLoginButton';
import { THEME_COLORS } from '@/constants/themeColors';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { THEME_FONTS, getCanonicalFont } from '@/constants/themeFonts';
import { FontSelector } from '@/components/Shared/FontSelector';

/* ─────────────────────────────────────────────────────────
   Options
───────────────────────────────────────────────────────── */
// FONTS array removed and replaced by THEME_FONTS import

const DATE_FORMATS = [
    { label: 'Dec 31, 2024', format: 'MMM DD, YYYY', value: 'MMM DD, YYYY' },
    { label: '31 Dec 2024', format: 'DD MMM YYYY', value: 'DD MMM YYYY' },
    { label: '2024-12-31', format: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
    { label: '12/31/2024', format: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { label: '31/12/2024', format: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { label: 'December 31, 2024', format: 'MMMM DD, YYYY', value: 'MMMM DD, YYYY' },
    { label: '31 December 2024', format: 'DD MMMM YYYY', value: 'DD MMMM YYYY' },
];

const TIME_FORMATS = [
    { label: '12-Hour', example: '1:30 PM', value: '12h' },
    { label: '24-Hour', example: '13:30', value: '24h' },
];


// Helpers moved to @/utils/themeUtils

/* ─────────────────────────────────────────────────────────
   Section Card
───────────────────────────────────────────────────────── */
const SectionCard = ({
    icon, iconColor, title, description, children, badge, headerAction
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    description?: string;
    children: React.ReactNode;
    badge?: string;
    headerAction?: React.ReactNode;
}) => (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
                        {icon}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                            {badge && <Badge variant="outline" className="text-[10px] px-2 py-0">{badge}</Badge>}
                        </div>
                        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                    </div>
                </div>
                {headerAction && (
                    <div className="shrink-0">
                        {headerAction}
                    </div>
                )}
            </div>
        </div>
        <div className="px-6 py-5 space-y-5">
            {children}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Setting Row
───────────────────────────────────────────────────────── */
const SettingRow = ({
    icon, label, description, children
}: {
    icon?: React.ReactNode;
    label: string;
    description?: string;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-0">{label}</Label>
            </div>
            {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-7">{description}</p>}
        </div>
        <div className="sm:w-64 shrink-0">
            {children}
        </div>
    </div>
);



/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */
export default function UserPreferences() {
    const dispatch = useDispatch();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const user = useSelector((state: IRootState) => state.themeConfig.user);
    const [saving, setSaving] = useState(false);
    const [botName, setBotName] = useState('sccg_bot');

    useEffect(() => {
        api.get('/telegram-bot-name').then(res => {
            if (res.data?.bot_username) setBotName(res.data.bot_username);
        });
    }, []);

    const handleTelegramLink = useCallback(async (telegramUser: any) => {
        try {
            const res = await api.post('/profile/link-telegram', telegramUser);
            toast.success(res.data.message);
            
            // Update local user state in Redux and Storage
            const updatedUser = { ...user, telegram_user_id: res.data.telegram_user_id };
            localStorage.setItem('user_info', JSON.stringify(updatedUser));
            dispatch(setUser(updatedUser));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Linking failed');
        }
    }, [user, dispatch]);

    // Redux sync and local state
    const [customColor, setCustomColor] = useState(themeConfig.customPrimaryColor);
    const [isCustom, setIsCustom] = useState(themeConfig.accentColor === 'custom');

    const [preferences, setPreferences] = useState({
        font_family: themeConfig.fontFamily || 'Google Sans',
        date_format: themeConfig.dateFormat || 'DD MMM YYYY',
        time_format: themeConfig.timeFormat || '12h',
        accent_color: themeConfig.accentColor || 'red',
        custom_primary_color: themeConfig.customPrimaryColor || null,
        two_factor_telegram: themeConfig.userPreferences?.two_factor_telegram || false,
    });

    // Use reactive application in App.tsx but apply locally for instant feedback if needed
    // However, App.tsx now monitors themeConfig.accentColor and customPrimaryColor.
    // So we just need to update Redux on change if we want instant feedback OR wait for Save.
    // The previous implementation was applying it locally during interaction.
    // Let's keep it consistent: local preview applies locally, Save persists to DB and Redux.

    const applyTempAccent = (colorValue: string, customHsl?: any) => {
        applyAccentColor(colorValue, customHsl);
    };

    useEffect(() => {
        if (preferences.accent_color === 'custom' && customColor) {
            applyTempAccent('custom', customColor);
        } else if (preferences.accent_color !== 'custom') {
            applyTempAccent(preferences.accent_color);
        }
    }, [preferences.accent_color, customColor, themeConfig.theme]);

    
    useEffect(() => {
        dispatch(setPageTitle('User Preferences'));
    }, [dispatch]);


    const handleChange = (key: string, value: any) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post('/user/preferences', { preferences });
            const updatedPreferences = res.data.preferences;
            dispatch(setUserPreferences(updatedPreferences));
            
            // Critical: Sync with localStorage user_info so it persists after refresh
            if (user) {
                const updatedUser = { ...user, preferences: { ...user.preferences, ...updatedPreferences } };
                localStorage.setItem('user_info', JSON.stringify(updatedUser));
                dispatch(setUser(updatedUser));
            }

            // Also sync accent color to Redux for global persistency between reloads
            dispatch(setAccentColor({ color: preferences.accent_color, customHsl: customColor }));
            toast.success('Preferences saved successfully!');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            toast.error('Could not save preferences. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCustomColorChange = (newHsl: { h: number; s: number; l: number }) => {
        setCustomColor(newHsl);
        setPreferences(prev => ({ ...prev, custom_primary_color: newHsl }));
        applyTempAccent('custom', newHsl);
    };

    const handleReset = () => {
        const defaults = {
            font_family: 'Google Sans',
            date_format: 'DD MMM YYYY',
            time_format: '12h',
            accent_color: 'red',
            custom_primary_color: null,
            two_factor_telegram: false,
        };
        setPreferences(defaults);
        setIsCustom(false);
        setCustomColor(null);
        applyTempAccent('red');
        dispatch(toggleTheme('light'));
        toast.info('Settings reset to defaults (click save to persist)');
    };

    const currentFont = getCanonicalFont(preferences.font_family);
    const currentDate = DATE_FORMATS.find(f => f.value === preferences.date_format);
    const currentTime = TIME_FORMATS.find(f => f.value === preferences.time_format);


    return (
        <div className="mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <IconSettings size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">User Preferences</h1>
              <p className="text-sm text-gray-500">Manage your preferences</p>
            </div>
          </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gap-2 h-10"
                >
                    {saving ? <IconLoader2 size={16} className="animate-spin" /> : <IconDeviceFloppy size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="space-y-6">

                {/* ── Security & Privacy ── */}
                <SectionCard
                    icon={<IconShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />}
                    iconColor="bg-emerald-100 dark:bg-emerald-900/40"
                    title="Security & Privacy"
                    description="Protect your account with additional security layers"
                >
                    <SettingRow
                        icon={<IconBrandTelegram size={18} className="text-sky-500" />}
                        label="Telegram Two-Factor Authentication"
                        description={user?.telegram_user_id 
                            ? "Secure your login by requiring a code sent to your Telegram account."
                            : "Your Telegram account is not linked. Please link your account below to enable Two-Factor Authentication."
                        }
                    >
                        <div className="flex items-center gap-3">
                            <Switch 
                                checked={preferences.two_factor_telegram}
                                onCheckedChange={(v) => {
                                    if (v && !user?.telegram_user_id) {
                                        toast.error("Cannot enable 2FA: No Telegram account linked.");
                                        return;
                                    }
                                    handleChange('two_factor_telegram', v);
                                }}
                                disabled={!user?.telegram_user_id}
                            />
                            <span className="text-xs font-medium text-gray-500">
                                {preferences.two_factor_telegram ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </SettingRow>

                    {user?.telegram_user_id ? (
                        <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-emerald-900 flex items-center justify-center shadow-sm">
                                    <IconCircleCheck className="text-emerald-500" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Telegram account linked</p>
                                    <p className="text-xs text-emerald-700/70 dark:text-emerald-400">Your account is ready for Two-Factor Authentication</p>
                                </div>
                            </div>
                            <Badge variant="success" className=" font-mono text-[10px]">
                                ID: {user.telegram_user_id}
                            </Badge>
                        </div>
                    ) : (
                        <div className="mt-4 p-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-sky-900 flex items-center justify-center shadow-sm">
                                    <IconBrandTelegram className="text-sky-500" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">Link your Telegram</p>
                                    <p className="text-xs text-sky-700/70 dark:text-sky-400">Required to enable Two-Factor Authentication</p>
                                </div>
                            </div>
                            <TelegramLoginButton 
                                botName={botName} 
                                onAuth={handleTelegramLink}
                                buttonSize="medium"
                                cornerRadius={8}
                            />
                        </div>
                    )}
                </SectionCard>

                {/* ── Theme & Colors ── */}
                <SectionCard
                    icon={<IconDroplet size={18} className="text-sky-600 dark:text-sky-400" />}
                    iconColor="bg-sky-100 dark:bg-sky-900/40"
                    title="Theme & Colors"
                    description="Choose your preferred appearance mode and primary color"
                    headerAction={
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleReset}
                            className="h-8 text-[11px] font-bold gap-1.5 border-primary/20 hover:bg-primary/5 text-primary rounded-lg"
                        >
                            <IconRotate size={14} />
                            RESET TO DEFAULT
                        </Button>
                    }
                >
                    {/* Dark / Light / System */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-3">Appearance</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { value: 'light', label: 'Light', icon: <IconSun size={18} /> },
                                { value: 'dark', label: 'Dark', icon: <IconMoon size={18} /> },
                                { value: 'system', label: 'System', icon: <IconDeviceDesktop size={18} /> },
                            ].map(mode => (
                                <button
                                    key={mode.value}
                                    onClick={() => dispatch(toggleTheme(mode.value))}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${themeConfig.theme === mode.value
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {mode.icon}
                                    <span className="text-xs font-medium">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Separator className="dark:bg-gray-800" />

                    {/* Primary Color Picker */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-200 !mb-1">Primary Color</Label>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                            Sets the main color for buttons, links, and highlights
                        </p>

                        {/* Preset swatches + Custom trigger */}
                        <div className="flex flex-wrap gap-3">
                            {THEME_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => {
                                        handleChange('accent_color', color.value);
                                        setIsCustom(false);
                                        applyAccentColor(color.value);
                                    }}
                                    className="group relative flex flex-col items-center gap-1.5"
                                    title={color.label}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center ${
                                            preferences.accent_color === color.value && !isCustom
                                                ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110'
                                                : 'hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        {preferences.accent_color === color.value && !isCustom && (
                                            <IconCheck size={16} className="text-white drop-shadow-sm" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-medium ${
                                        preferences.accent_color === color.value && !isCustom
                                            ? 'text-gray-900 dark:text-gray-100'
                                            : 'text-gray-400 dark:text-gray-500'
                                    }`}>{color.label}</span>
                                </button>
                            ))}

                            {/* Custom color picker */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        onClick={() => {
                                            handleChange('accent_color', 'custom');
                                            setIsCustom(true);
                                        }}
                                        className="group relative flex flex-col items-center gap-1.5"
                                        title="Custom color"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 ${
                                                isCustom ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110' : 'hover:scale-105'
                                            }`}
                                        >
                                            {isCustom && <IconBrush size={16} className="text-white drop-shadow-sm" />}
                                        </div>
                                        <span className={`text-[10px] font-medium ${
                                            isCustom ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                                        }`}>Custom</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl">
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-sm">Custom primary color</h4>

                                        {/* Color preview and hex input */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700"
                                                style={{ backgroundColor: customColor ? `hsl(${customColor.h}, ${customColor.s}%, ${customColor.l}%)` : '#0284c7' }}
                                            />
                                            <Input
                                                type="color"
                                                value={customColor ? `hsl(${customColor.h}, ${customColor.s}%, ${customColor.l}%)` : '#0284c7'}
                                                onChange={(e) => {
                                                    const hsl = hexToHsl(e.target.value);
                                                    setCustomColor(hsl);
                                                    applyAccentColor('custom', hsl);
                                                }}
                                                className="w-full h-10"
                                            />
                                        </div>

                                        {/* HSL sliders */}
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-xs">Hue: {customColor?.h ?? 198}°</Label>
                                                <Slider
                                                    value={[customColor?.h ?? 198]}
                                                    min={0}
                                                    max={360}
                                                    step={1}
                                                    onValueChange={([h]) => {
                                                        if (customColor) {
                                                            handleCustomColorChange({ ...customColor, h });
                                                        } else {
                                                            handleCustomColorChange({ h, s: 100, l: 50 });
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Saturation: {customColor?.s ?? 100}%</Label>
                                                <Slider
                                                    value={[customColor?.s ?? 100]}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={([s]) => customColor && handleCustomColorChange({ ...customColor, s })}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Lightness: {customColor?.l ?? 50}%</Label>
                                                <Slider
                                                    value={[customColor?.l ?? 50]}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={([l]) => customColor && handleCustomColorChange({ ...customColor, l })}
                                                />
                                            </div>
                                        </div>

                                        {/* Live preview button */}
                                        <div className="pt-2">
                                            <Button
                                                className="w-full gap-2"
                                                style={{
                                                    backgroundColor: customColor ? `hsl(${customColor.h}, ${customColor.s}%, ${customColor.l}%)` : '#0284c7',
                                                    color: '#fff'
                                                }}
                                            >
                                                Preview
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </SectionCard>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 justify-between' >
                    {/* ── Display & Typography ── */}
                    <SectionCard
                        icon={<IconPalette size={18} className="text-purple-600 dark:text-purple-400" />}
                        iconColor="bg-purple-100 dark:bg-purple-900/40"
                        title="Display & Typography"
                        description="Control the look and feel of the interface"
                    >
                        <SettingRow
                            icon={<IconTypography size={16} />}
                            label="Interface Font"
                            description="Applied to all text across the application"
                        >
                            <FontSelector 
                                value={preferences.font_family} 
                                onValueChange={(v) => handleChange('font_family', v)}
                                className="h-10"
                            />
                        </SettingRow>

                        {/* Font Preview */}
                        {currentFont && (
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
                                <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 font-semibold">Preview</p>
                                <p className="text-lg text-gray-800 dark:text-gray-200" style={{ fontFamily: currentFont.value }}>
                                    The quick brown fox jumps over the lazy dog.
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" style={{ fontFamily: currentFont.value }}>
                                    0123456789 — $1,234.56 — 98.7%
                                </p>
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Localization ── */}
                    <SectionCard
                        icon={<IconClock size={18} className="text-blue-600 dark:text-blue-400" />}
                        iconColor="bg-blue-100 dark:bg-blue-900/40"
                        title="Date & Time Formats"
                        description="How dates and times appear in the system"
                    >
                        <SettingRow
                            icon={<IconCalendar size={16} />}
                            label="Date Format"
                            description="Used for dates like created at, updated at, etc."
                        >
                            <Select value={preferences.date_format} onValueChange={(v) => handleChange('date_format', v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Choose format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATE_FORMATS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <div className="flex items-center justify-between w-full gap-3">
                                                <span>{f.label}</span>
                                                <span className="text-[11px] text-gray-400 font-mono">{f.format}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SettingRow>

                        <Separator className="dark:bg-gray-800" />

                        <SettingRow
                            icon={<IconClockHour4 size={16} />}
                            label="Time Format"
                            description="Choose between 12-hour and 24-hour clock"
                        >
                            <Select value={preferences.time_format} onValueChange={(v) => handleChange('time_format', v)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Choose format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_FORMATS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            <div className="flex items-center gap-2">
                                                <span>{f.label}</span>
                                                <span className="text-[11px] text-gray-400">({f.example})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SettingRow>

                        {/* Inline preview */}
                        <div className="ml-7 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">Preview:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {currentDate?.label || '—'} {currentTime?.value === '24h' ? '13:30' : '1:30 PM'}
                            </span>
                        </div>
                    </SectionCard>
                </div>


            </div>
        </div>
    );
}