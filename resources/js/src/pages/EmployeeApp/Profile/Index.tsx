import { useState, useEffect, useRef, memo } from 'react';
import { pwaToast } from '@/utils/pwaToast';
import { useNavigate } from 'react-router-dom';
import { pwaFetch } from '@/lib/pwa-fetch';
import {
    IconUser, IconMail, IconPhone, IconBuildingCommunity,
    IconBriefcase, IconLogout, IconCalendarEvent,
    IconId, IconMapPin, IconGenderMale, IconGenderFemale,
    IconCamera, IconSettings, IconInfoCircle, IconArrowLeft,
    IconMessageHeart, IconChevronRight, IconAlertTriangle, IconLoader2,
    IconShieldCheck
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/ui/pwa/PageHeader';
import { PwaActionButton } from '@/components/ui/pwa/PwaActionButton';
import { PwaHoldButton } from '@/components/ui/pwa/PwaHoldButton';
import { applyEmployeePreferences } from '@/utils/employeePreferences';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { Loader } from '@/components/ui/Loader';
import BottomSheet from '@/components/ui/bottom-sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import heic2any from 'heic2any';
import { pwaCache } from '@/lib/pwa-cache';
import SystemAccessBottomSheet from '../Settings/components/SystemAccessBottomSheet';

// ─── Subcomponents ──────────────────────────────────────────────────────────
const InfoRow = memo(({ icon, label, value, last = false }: { icon: React.ReactNode, label: string, value?: string | null, last?: boolean }) => (
    <div className={cn('flex items-center gap-4 px-4 py-3.5', !last && 'border-b border-gray-100 dark:border-gray-700/50')}>
        <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0 text-left">
            <p className="text-[11px] font-black uppercase text-gray-400 mb-0.5">{label}</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{value || 'N/A'}</p>
        </div>
    </div>
));
InfoRow.displayName = 'InfoRow';

const SectionHeader = memo(({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center gap-2 px-1 mb-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-[12px] font-semibold uppercase text-gray-400">{title}</h3>
    </div>
));
SectionHeader.displayName = 'SectionHeader';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EmployeePwaProfile() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);
    const cachedProfile = pwaCache.get('employee_profile');
    const [loading, setLoading] = useState(!cachedProfile);
    const [profile, setProfile] = useState<any>(cachedProfile);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);
    const [permissionsOpen, setPermissionsOpen] = useState(false);

    const token = localStorage.getItem('employee_auth_token');

    const fetchData = async () => {
        if (!token) { navigate('/employee/login'); return; }

        // OFFLINE GUARD
        if (!navigator.onLine) {
            setLoading(false);
            return;
        }

        try {
            const res = await pwaFetch('/api/employee-app/profile', {
                headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                localStorage.removeItem('employee_auth_token');
                navigate('/employee/login');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                pwaCache.set('employee_profile', data);
                
                // Still apply preferences from storage on load to ensure theme consistency
                const storedPrefs = localStorage.getItem('employee_preferences');
                if (storedPrefs) {
                    applyEmployeePreferences(JSON.parse(storedPrefs));
                }
            }
        } catch {
            if (navigator.onLine) {
                pwaToast.error('Network error. Check connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle(t('profile', 'Profile')));
        fetchData();

        window.addEventListener('pwa-refresh', fetchData);
        return () => window.removeEventListener('pwa-refresh', fetchData);
    }, [dispatch, t]);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);

        try {
            // HEIC/HEIF to JPEG Conversion for iPhones
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
                pwaToast.info(t('optimizing_image', 'Optimizing high-efficiency image...'), { duration: 2000 });
                
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.7 // Good balance of quality vs file size
                });

                const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                
                file = new File([finalBlob], fileName.replace(/\.(heic|heif)$/, '.jpg'), {
                    type: 'image/jpeg'
                });
            }

            const form = new FormData();
            form.append('avatar', file);

            const res = await pwaFetch('/api/employee-app/profile/avatar', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form
            });
            const data = await res.json();
            if (res.ok) {
                setProfile((p: any) => ({ ...p, profile_image_url: data.profile_image_url || p.profile_image_url }));
                pwaToast.success(t('avatar_updated', 'Avatar updated successfully!'));
                fetchData();
            } else {
                pwaToast.error(data.message || t('upload_failed', 'Upload failed'));
            }
        } catch (error) {
            console.error("Avatar Processing Error:", error);
            pwaToast.error(t('image_processing_failed', 'Image processing failed. Try a different format.'));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const executeLogout = () => {
        localStorage.removeItem('employee_auth_token');
        navigate('/employee/login');
        pwaToast.success(t('signed_out_device', 'Signed out of this device'));
    };

    const formatDate = (d: string | null) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-[#060818]">
            <PageHeader
                title={t('profile', 'Profile')}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5 text-primary' width="22" height="22"  color="none" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="6" r="4" stroke="currentColor" stroke-width="1.5"></circle><path opacity="0.5" d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" stroke="currentColor" stroke-width="1.5"></path></svg>}
                backButton={
                    <PwaActionButton
                        icon={<IconArrowLeft />}
                        variant="soft"
                        onClick={() => navigate(-1)}
                    />
                }
                rightAction={
                    <div className="flex items-center gap-2">
                        <PwaActionButton
                            icon={<IconShieldCheck />}
                            variant="soft"
                            onClick={() => setPermissionsOpen(true)}
                        />
                        <PwaActionButton
                            icon={<IconSettings />}
                            variant="soft"
                            onClick={() => navigate('/employee/settings')}
                        />
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto pb-24">
                {loading ? (
                    <div className="flex justify-center items-center h-full min-h-[60vh]">
                        <Loader size="md" text={t('SYNCING PROFILE...')} />
                    </div>
                ) : !profile ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-5">
                        <div className="w-32 h-32  flex items-center justify-center  mx-auto">
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
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">{t('profile_sync_failed', 'Profile Synchronize Failed')}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('connection_interrupted', 'Connection to HR server was interrupted.')}</p>
                        </div>
                        <button 
                            onClick={() => { setLoading(true); fetchData(); }}
                            className="w-full h-12 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            {t('retry_connection', 'Retry Connection')}
                        </button>
                    </div>
                ) : (
                    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Avatar Header */}
                        <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="relative mb-4">
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-50 dark:border-gray-900 shadow-xl bg-gray-100 dark:bg-gray-950 flex items-center justify-center cursor-pointer relative group/avatar"
                                >
                                    {uploadingAvatar ? (
                                        <IconLoader2 size={40} className="animate-spin text-primary" />
                                    ) : (
                                        <Avatar className="w-full h-full border-none bg-transparent">
                                            <AvatarImage src={profile?.profile_image_url} className="object-cover transition-transform group-hover/avatar:scale-110 duration-500" />
                                            <AvatarFallback className="text-4xl font-black text-primary/20 bg-transparent flex items-center justify-center">
                                                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <IconUser size={48} />}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                        <IconCamera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="absolute bottom-1 right-1 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-4 border-white dark:border-gray-800 z-10"
                                >
                                    <IconCamera size={16} />
                                </button>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{profile.full_name}</h2>
                                <p className="text-[10px] font-black uppercase text-primary bg-primary/5 ring-1 ring-primary/10 px-4 py-1.5 rounded-full inline-block">
                                    {profile.designation}
                                </p>
                                <p className="!mt-2 text-xs font-bold text-gray-400">
                                    {profile.department} · ID #{profile.employee_id}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                <button
                                    onClick={() => navigate('/employee/wishes')}
                                    className="flex items-center justify-center gap-3 h-12 bg-gray-50 dark:bg-gray-950/20 rounded-full font-black text-[10px] uppercase active:scale-95 transition-all w-full"
                                >
                                    <IconMessageHeart size={16} />
                                    {t('my_wishes', 'My Wishes')}
                                </button>
                                <button
                                    onClick={() => navigate('/employee/feedback/create')}
                                    className="flex items-center justify-center gap-3 h-12  bg-gray-50 dark:bg-gray-950/20 rounded-full font-black text-[10px] uppercase active:scale-95 transition-all w-full"
                                >
                                    <IconInfoCircle size={16} />
                                    {t('feedback', 'Feedback')}
                                </button>
                            </div>
                        </div>

                        {/* Employment Snapshot */}
                        <div className="space-y-3">
                            <SectionHeader icon={<IconCalendarEvent size={14} />} title={t('employment_snapshot', 'Employment Snapshot')} />
                            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 overflow-hidden">
                                {[
                                    { label: t('birthday', 'Birthday'), value: profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A' },
                                    { label: t('join_date', 'Join Date'), value: profile.date_of_joining ? new Date(profile.date_of_joining).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'N/A' },
                                    { label: t('tenure', 'Tenure'), value: profile.working_period ?? 'N/A' },
                                ].map(stat => (
                                    <div key={stat.label} className="flex flex-col items-center py-5 px-2 text-center">
                                        <p className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-1">{stat.label}</p>
                                        <p className="font-black text-sm text-gray-900 dark:text-white leading-tight">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-3">
                            <SectionHeader icon={<IconId size={14} />} title={t('personal_information', 'Personal Information')} />
                            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <InfoRow icon={<IconId size={16} />} label="ID" value={profile.employee_id} />
                                <InfoRow icon={<IconUser size={16} />} label={t('legal_name', 'Legal Name')} value={profile.full_name} />
                                <InfoRow icon={profile.gender?.toLowerCase() === 'female' ? <IconGenderFemale size={16} /> : <IconGenderMale size={16} />} label={t('gender', 'Gender')} value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).toLowerCase() : null} />
                                <InfoRow icon={<IconPhone size={16} />} label={t('mobile_number', 'Mobile Number')} value={profile.phone} />
                                <InfoRow icon={<IconMail size={16} />} label={t('email_address', 'Email Address')} value={profile.email} />
                                <InfoRow icon={<IconMapPin size={16} />} label={t('registered_address', 'Registered Address')} value={profile.address} last />
                            </div>
                        </div>

                        {/* Line Manager Information */}
                        <AnimatePresence>
                            {profile.line_manager && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3"
                                >
                                    <SectionHeader icon={<IconUser size={14} />} title={t('reporting_manager', 'Reporting Manager')} />
                                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="w-12 h-12 ring-2 ring-primary rounded-full shrink-0">
                                                <AvatarImage src={profile.line_manager.profile_image_url} className="object-cover" />
                                                <AvatarFallback className="rounded-full text-lg font-black text-primary/20 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                                    {profile.line_manager.name ? profile.line_manager.name.charAt(0).toUpperCase() : <IconBriefcase size={24} />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-black uppercase text-primary mb-0.5">{t('line_manager', 'LINE MANAGER')}</p>
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white">{profile.line_manager.name}</h4>
                                                <p className="text-xs text-gray-400 font-bold">{profile.line_manager.designation}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-6">
                                            {profile.line_manager.email && (
                                                <a 
                                                    href={`mailto:${profile.line_manager.email}`}
                                                    className="flex items-center justify-center gap-2 h-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-[10px] font-black uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-primary transition-all active:scale-95"
                                                >
                                                    <IconMail size={14} />
                                                    {t('email', 'Email')}
                                                </a>
                                            )}
                                            {profile.line_manager.phone && (
                                                <a 
                                                    href={`tel:${profile.line_manager.phone}`}
                                                    className="flex items-center justify-center gap-2 h-10 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-[10px] font-black uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition-all active:scale-95"
                                                >
                                                    <IconPhone size={14} />
                                                    {t('call', 'Call')}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Corporate Details */}
                        <div className="space-y-3">
                            <SectionHeader icon={<IconBriefcase size={14} />} title={t('corporate_details', 'Corporate Details')} />
                            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <InfoRow icon={<IconCalendarEvent size={16} />} label={t('engagement_date', 'Engagement Date')} value={formatDate(profile.date_of_joining)} />
                                <InfoRow icon={<IconBuildingCommunity size={16} />} label={t('hq_branch', 'HQ / Branch')} value={profile.branch} />
                                <InfoRow icon={<IconBriefcase size={16} />} label={t('professional_role', 'Professional Role')} value={profile.designation} />
                                <InfoRow icon={<IconSettings size={16} />} label={t('unit_department', 'Unit / Department')} value={profile.department} last />
                            </div>
                        </div>

                        {/* Dangerous Area */}
                        <div className="pt-4 pb-8">
                            <PwaHoldButton
                                onComplete={() => setLogoutSheetOpen(true)}
                                className="bg-white dark:bg-gray-800 text-red-500 border border-red-500/20 shadow-sm"
                                activeClassName="text-white"
                                fillColor="bg-red-500"
                                activeLabel={t('keep_holding_logout', 'Keep holding to sign out...') as string}
                                idleLabel={t('hold_to_sign_out', 'Hold to Sign Out') as string}
                            >
                                <div className="flex items-center justify-center gap-3 p-4 w-full">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors">
                                        <IconLogout size={20} />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider font-black">{t('sign_out_device', 'Sign Out of Device') as string}</span>
                                </div>
                            </PwaHoldButton>
                            <p className="text-center text-[10px] font-bold text-gray-400 mt-4 px-10 uppercase tracking-wide leading-relaxed">
                                {t('requires_scanning', 'Requires Scanning')} <span className="text-primary/50">{t('biometric_qr', 'Biometric QR')}</span> {t('resync_device_session', 'to re-synchronize active device session.')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Logout Confirmation Bottom Sheet */}
            <BottomSheet
                isOpen={logoutSheetOpen}
                onClose={() => setLogoutSheetOpen(false)}
                title={t('sync_sign_out', 'Synchronize Sign Out')}
            >
                <div className="space-y-6 pt-2">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 animate-pulse">
                            <IconAlertTriangle size={36} />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('warning', 'Warning!')}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium px-4">
                                {t('decouple_warning', 'Are you sure you want to decouple this device from your active employee session? You will need your personal QR code to regain access.')} <br/> {t('you_need_qr_code', 'You need your personal QR code to regain access.')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 px-2">
                        <button
                            onClick={executeLogout}
                            className="h-14 w-full bg-red-500 text-white font-black text-xs uppercase tracking-wide rounded-2xl active:scale-95 transition-all"
                        >
                            {t('yes_decouple', 'Yes, Decouple Device')}
                        </button>
                        <button
                            onClick={() => setLogoutSheetOpen(false)}
                            className="h-14 w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-wide rounded-2xl active:scale-95 transition-all"
                        >
                            {t('maintain_connection', 'Maintain Connection')}
                        </button>
                    </div>
                </div>
            </BottomSheet>

            <SystemAccessBottomSheet
                isOpen={permissionsOpen}
                onClose={() => setPermissionsOpen(false)}
            />
        </div>
    );
}
