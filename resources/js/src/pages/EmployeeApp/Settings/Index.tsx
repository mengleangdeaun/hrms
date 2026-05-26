import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { pwaToast } from '@/utils/pwaToast';
import { useNavigate } from 'react-router-dom';
import { pwaFetch } from '@/lib/pwa-fetch';
import { pwaCache } from '@/lib/pwa-cache';
import { IconSettings, IconCheck, IconRotateClockwise2, IconArrowLeft } from '@tabler/icons-react';
import PageHeader from '@/components/ui/pwa/PageHeader';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { applyEmployeePreferences, storePreferences, loadStoredPreferences } from '@/utils/employeePreferences';
import BottomSheet from '@/components/ui/bottom-sheet';
import AppFeedbackDrawer from './components/AppFeedbackDrawer';
import { useAttendance } from '@/context/AttendanceContext';

// Modular Components
import SettingsSkeleton from './components/SettingsSkeleton';
import DarkModeSection from './components/DarkModeSection';
import AccentColorSection from './components/AccentColorSection';
import LanguageSection from './components/LanguageSection';
import TypographySection from './components/TypographySection';
import DeviceManagementSection from './components/DeviceManagementSection';
import AboutSection from './components/AboutSection';
import SupportSection from './components/SupportSection';
import SystemAccessBottomSheet from './components/SystemAccessBottomSheet';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Preferences {
    dark_mode: boolean;
    color_theme: string;
    locale: string;
    font_family: string;
    font_size: 'small' | 'medium' | 'large';
    notifications_enabled: boolean;
    location_enabled: boolean;
    camera_enabled: boolean;
}

interface PwaInfo {
    version: string;
    privacy_policy: string;
    terms_of_service: string;
    vapid_public_key: string;
}

interface DrawerState {
    open: boolean;
    title: string;
    content: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function EmployeePwaSettings() {
    const { t, i18n } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const abortControllerRef = useRef<AbortController | null>(null);

    const [loading, setLoading] = useState(true);
    const [prefs, setPrefs] = useState<Preferences | null>(() => {
        const stored = loadStoredPreferences();
        return Object.keys(stored).length > 0 ? (stored as Preferences) : null;
    });
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [pwaInfo, setPwaInfo] = useState<PwaInfo | null>(() => pwaCache.get('pwa_info'));
    const [drawerOpen, setDrawerOpen] = useState<DrawerState>({
        open: false,
        title: '',
        content: ''
    });
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [permissionsOpen, setPermissionsOpen] = useState(false);
    
    // Permission Management
    const { checkPermissions, deviceId, rebindDevice, todayShift } = useAttendance();
    const bindingStatus = todayShift ? (todayShift.device_binding?.status || 'unbound') : 'pending';
    const token = useMemo(() => localStorage.getItem('employee_auth_token'), []);

    const fetchData = useCallback(async () => {
        if (!token) {
            navigate('/employee/login');
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const [prefRes, infoRes] = await Promise.all([
                pwaFetch('/api/employee-app/preferences', {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    signal
                }),
                pwaFetch('/api/pwa/info', {
                    headers: { 'Accept': 'application/json' },
                    signal
                })
            ]);

            if (prefRes.status === 401) {
                localStorage.removeItem('employee_auth_token');
                navigate('/employee/login');
                return;
            }

            if (prefRes.ok) {
                const preferences = await prefRes.json();
                setPrefs(preferences);
                applyEmployeePreferences(preferences);
                storePreferences(preferences);
            }

            if (infoRes.ok) {
                const info = await infoRes.json();
                setPwaInfo(info);
                pwaCache.set('pwa_info', info);
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                pwaToast.error(t('network_error', 'Network error occurred'));
            }
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, [token, navigate, t]);

    useEffect(() => {
        dispatch(setPageTitle(t('settings', 'Settings')));
    }, [dispatch, t]);

    useEffect(() => {
        fetchData();
        checkPermissions();
        return () => {
            abortControllerRef.current?.abort();
        };
    }, [fetchData, checkPermissions]);

    const updatePref = useCallback(async (key: keyof Preferences, value: any) => {
        if (!prefs) return;

        const previousPrefs = { ...prefs };
        const newPrefs = { ...prefs, [key]: value };
        
        setPrefs(newPrefs);
        applyEmployeePreferences(newPrefs);
        storePreferences(newPrefs);

        setSavingPrefs(true);
        try {
            const res = await pwaFetch('/api/employee-app/preferences', {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ [key]: value }),
            });

            if (!res.ok) throw new Error('Sync failed');
            
            pwaToast.success(t('preferences_synced', 'Preferences synced'), {
                duration: 1500,
                icon: <IconCheck size={18} />
            });
        } catch (error) {
            setPrefs(previousPrefs);
            applyEmployeePreferences(previousPrefs);
            storePreferences(previousPrefs);
            pwaToast.error(t('sync_failed', 'Failed to sync preferences. Please try again.'));
        } finally {
            setSavingPrefs(false);
        }
    }, [prefs, token, t]);

    const fontSizeOptions = useMemo(() => [
        { id: 'small' as const, label: t('small', 'Small') },
        { id: 'medium' as const, label: t('medium', 'Medium') },
        { id: 'large' as const, label: t('large', 'Large') }
    ], [t]);

    const languageOptions = useMemo(() => [
        { id: 'en', label: t('english', 'English') },
        { id: 'kh', label: t('khmer', 'Khmer') },
        { id: 'zh', label: t('chinese', 'Chinese') }
    ], [t]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            <PageHeader
                title={t('settings', 'Settings')}
                icon={<IconSettings className="w-5 h-5 text-primary" />}
            />

            <main className="flex-1 p-4 space-y-6 pb-32">
                {loading && !prefs ? (
                    <SettingsSkeleton />
                ) : !prefs ? (
                    <div className="flex flex-col items-center justify-center pt-20">
                <div className="relative mb-10">
                    <div className="relative flex w-32 h-32 items-center justify-center mx-auto">
                        <svg width="627" height="539" viewBox="0 0 627 539" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M1.32445 131.979C-18.2754 -32.0205 366.524 -54.0205 366.524 131.979C324.525 287.179 33.1056 267.18 1.32445 131.979ZM26.9246 119.579C20.1246 -6.42061 328.925 -33.6206 340.925 119.579C340.282 128.408 338.391 136.677 335.416 144.379C335.258 144.79 335.096 145.199 334.932 145.606C294.937 244.523 74.8514 248.527 33.1056 144.379C30.0283 136.702 27.9201 128.437 26.9246 119.579Z" fill="#CCCCCD"/>
<path d="M294.124 258.38C287.75 244.799 299.427 226.225 312.124 219.291C317.752 216.218 323.579 215.431 328.124 218.38L343.324 229.896C355.053 217.147 363.663 200.111 366.189 179.179C366.316 178.123 366.428 177.056 366.524 175.979V131.979C324.525 287.179 33.1056 267.18 1.32445 131.979V178.779C1.45842 180.797 1.66881 182.798 1.95341 184.779C15.2642 277.47 190.894 329.785 301.724 264.569L294.124 258.38Z" fill="#CCCCCD"/>
<path d="M345.204 299.98C345.941 292.556 348.961 284.966 353.324 278.214L309.724 243.58C304.979 236.612 302.924 229.579 312.124 219.291C299.427 226.225 287.75 244.799 294.124 258.38L301.724 264.569L345.204 299.98Z" fill="#CCCCCD"/>
<path d="M346.483 312.753C346.752 313.563 347.277 314.259 347.947 314.789L568.525 489.579C560.147 471.389 568.384 449.761 582.693 435.579L362.432 267.18C359.048 270.41 355.944 274.161 353.324 278.214C348.961 284.966 345.941 292.556 345.204 299.98C344.769 304.364 345.131 308.691 346.483 312.753Z" fill="#CCCCCD"/>
<path d="M616.525 420.379L393.752 257.492C393.468 257.284 393.163 257.106 392.836 256.975C388.524 255.25 383.745 255.365 378.924 256.867C373.254 258.634 367.525 262.318 362.432 267.18L582.693 435.579C592.297 426.061 604.637 419.898 616.525 420.379Z" fill="#F2F3F2"/>
<path d="M362.432 267.18C367.525 262.318 373.254 258.634 378.924 256.867L361.124 243.381L343.324 229.896L328.124 218.38C323.579 215.431 317.752 216.218 312.124 219.291C302.924 229.579 304.979 236.612 309.724 243.58L353.324 278.214C355.944 274.161 359.048 270.41 362.432 267.18Z" fill="#F2F3F2"/>
<path d="M568.525 489.579L347.947 314.789C347.277 314.259 346.752 313.563 346.483 312.753C345.131 308.691 344.769 304.364 345.204 299.98L301.724 264.569C190.894 329.785 15.2642 277.47 1.95341 184.779L1.32445 224.779C1.32445 309.579 168.125 369.579 291.325 311.979L348.925 356.779C346.661 365.425 348.125 371.179 353.324 375.579L561.325 532.779C589.325 555.579 640.525 509.979 620.924 485.179L611.036 477.579C597.894 492.318 579.418 500.472 568.525 489.579Z" fill="#D2D3D1"/>
<path d="M340.925 119.579C328.925 -33.6206 20.1246 -6.42061 26.9246 119.579C27.9201 128.437 30.0283 136.702 33.1056 144.379C30.5246 23.9794 321.325 -0.420606 335.416 144.379C338.391 136.677 340.282 128.408 340.925 119.579Z" fill="#666864"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M33.1056 144.379C74.8514 248.527 294.937 244.523 334.932 145.606C304.587 88.5793 219.915 68.6809 145.591 81.51C145.019 83.6631 144.73 86.2014 144.525 89.1794C144.249 86.3565 143.859 83.9541 143.31 81.9146C97.0285 90.3455 55.0416 111.524 33.1056 144.379ZM112.125 133.179C117.325 133.179 119.325 131.179 119.325 125.979C119.325 130.379 121.325 133.179 126.525 133.179C121.325 133.179 119.325 136.779 119.325 140.379C119.325 135.579 118.125 133.179 112.125 133.179Z" fill="#F2F3F2"/>
<path d="M335.416 144.379C321.325 -0.420606 30.5246 23.9794 33.1056 144.379C55.0416 111.524 97.0285 90.3455 143.31 81.9146C141.131 73.8078 136.453 71.4354 126.525 71.1794C139.396 69.231 143.049 65.04 144.525 53.1794C145.533 62.8462 147.325 69.5794 162.525 71.1794C151.279 72.2725 147.248 75.2764 145.591 81.51C219.915 68.6809 304.587 88.5793 334.932 145.606C335.096 145.199 335.258 144.79 335.416 144.379Z" fill="#D2D3D1"/>
<path d="M144.525 53.1794C143.049 65.04 139.396 69.231 126.525 71.1794C136.453 71.4354 141.131 73.8078 143.31 81.9146C144.07 81.7763 144.83 81.6414 145.591 81.51C147.248 75.2764 151.279 72.2725 162.525 71.1794C147.325 69.5794 145.533 62.8462 144.525 53.1794Z" fill="#FFFDFF"/>
<path d="M119.325 125.979C119.325 131.179 117.325 133.179 112.125 133.179C118.125 133.179 119.325 135.579 119.325 140.379C119.325 136.779 121.325 133.179 126.525 133.179C121.325 133.179 119.325 130.379 119.325 125.979Z" fill="#FFFDFF"/>
<path d="M144.525 89.1794C144.73 86.2014 145.019 83.6631 145.591 81.51C144.83 81.6414 144.07 81.7763 143.31 81.9146C143.859 83.9541 144.249 86.3565 144.525 89.1794Z" fill="#FFFDFF"/>
<path d="M366.189 179.179C363.663 200.111 355.053 217.147 343.324 229.896L361.124 243.381C369.891 227.472 368.58 210.374 366.306 180.713L366.189 179.179Z" fill="#999B97"/>
<path d="M616.525 420.379C604.637 419.898 592.297 426.061 582.693 435.579C568.384 449.761 560.147 471.389 568.525 489.579C579.418 500.472 597.894 492.318 611.036 477.579C625.885 460.927 633.924 435.869 616.525 420.379Z" fill="#CCCCCD"/>
<path d="M378.925 256.867C373.254 258.634 367.525 262.318 362.432 267.18C359.048 270.41 355.944 274.161 353.324 278.214C348.961 284.966 345.941 292.556 345.204 299.98C344.769 304.364 345.131 308.691 346.483 312.753C346.752 313.563 347.277 314.259 347.947 314.789L568.525 489.579M568.525 489.579C560.147 471.389 568.384 449.761 582.693 435.579C592.297 426.061 604.637 419.898 616.525 420.379M378.925 256.867C383.745 255.365 388.524 255.25 392.836 256.975C393.163 257.106 393.468 257.284 393.752 257.492L616.525 420.379C633.924 435.869 625.885 460.927 611.036 477.579C597.894 492.318 579.418 500.472 568.525 489.579M345.204 299.98L301.724 264.569M301.724 264.569L294.124 258.38C287.75 244.799 299.427 226.225 312.124 219.291C317.752 216.218 323.579 215.431 328.124 218.38L343.324 229.896L361.124 243.381L378.925 256.867M301.724 264.569C190.894 329.785 15.2642 277.47 1.95341 184.779C1.66881 182.798 1.45842 180.797 1.32445 178.779V131.979M1.32445 131.979C-18.2754 -32.0205 366.524 -54.0205 366.524 131.979M1.32445 131.979C33.1056 267.18 324.525 287.179 366.524 131.979M366.524 131.979V175.979C366.428 177.056 366.316 178.123 366.189 179.179C363.663 200.111 355.053 217.147 343.324 229.896M335.416 144.379C335.258 144.79 335.096 145.199 334.932 145.606C294.937 244.523 74.8514 248.527 33.1056 144.379C30.0283 136.702 27.9201 128.437 26.9246 119.579C20.1246 -6.42061 328.925 -33.6206 340.925 119.579C340.282 128.408 338.391 136.677 335.416 144.379ZM33.1056 144.379C30.5246 23.9794 321.325 -0.420605 335.416 144.379" stroke="#111111" stroke-width="1.2" stroke-linejoin="round"/>
</svg>

                    </div>
                </div>


                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            {t('error_loading_prefs', 'Failed to load preferences')}
                        </h2>
                        <div className="grid grid-cols-2 mt-4 gap-3">
                        <button
                             onClick={fetchData}
                            className="bg-white px-6 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold py-3.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-[11px] uppercase tracking-wide"
                        >
                            <IconRotateClockwise2 size={16} />
                            {t('retry')}
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-white px-6 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold py-3.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-[11px] uppercase tracking-wide"
                        >
                            <IconArrowLeft size={16} />
                            {t('back')}
                        </button>
                    </div>
                    </div>
                ) : (
                    <>
                        {/* 1. Dark Mode (Top) */}
                        <DarkModeSection prefs={prefs} t={t} savingPrefs={savingPrefs} updatePref={updatePref} />
                        
                        {/* 2. Language Section */}
                        <LanguageSection prefs={prefs} t={t} i18n={i18n} languageOptions={languageOptions} updatePref={updatePref} />
                        
                        {/* 3. Typography Section */}
                        <TypographySection prefs={prefs} t={t} fontSizeOptions={fontSizeOptions} updatePref={updatePref} />
                        
                        {/* 4. Accent Color Section (Below Language & Typography) */}
                        <AccentColorSection prefs={prefs} t={t} updatePref={updatePref} />
                        
                        {/* 5. Device Management */}
                        <DeviceManagementSection t={t} deviceId={deviceId} status={bindingStatus} rebindDevice={rebindDevice} />
                        
                        {/* 6. About Section */}
                        <AboutSection pwaInfo={pwaInfo} t={t} setDrawerOpen={setDrawerOpen} />
                        
                        {/* 7. Support Section (Includes Permissions trigger) */}
                        <SupportSection 
                            t={t} 
                            setFeedbackOpen={setFeedbackOpen}
                            onOpenPermissions={() => setPermissionsOpen(true)}
                        />
                    </>
                )}
            </main>

            <BottomSheet
                isOpen={drawerOpen.open}
                onClose={() => setDrawerOpen({ ...drawerOpen, open: false })}
                title={drawerOpen.title}
            >
                <div
                    className="prose prose-sm dark:prose-invert max-w-none pt-2"
                    dangerouslySetInnerHTML={{ __html: drawerOpen.content }}
                />
            </BottomSheet>

            <AppFeedbackDrawer
                isOpen={feedbackOpen}
                onClose={() => setFeedbackOpen(false)}
            />

            <SystemAccessBottomSheet
                isOpen={permissionsOpen}
                onClose={() => setPermissionsOpen(false)}
                prefs={prefs}
                updatePref={updatePref}
            />
        </div>
    );
}