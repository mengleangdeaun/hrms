import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    IconCalendar, 
    IconTag, 
    IconUsers, 
    IconBell, 
    IconPaperclip, 
    IconDownload, 
    IconFile,
    IconTrash,
    IconAlertTriangle,
    IconInfoCircle, 
    IconCircleCheck,
    IconAlertOctagon,
    IconLoader2,
    IconArrowLeft
} from '@tabler/icons-react';
import PageHeader from '../../../components/ui/pwa/PageHeader';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import { pwaFetch } from '@/lib/pwa-fetch';
import { pwaToast } from '@/utils/pwaToast';
import { useNotifications } from '@/context/NotificationContext';
import BottomSheet from '@/components/ui/bottom-sheet';
import { PwaActionButton } from '@/components/ui/pwa/PwaActionButton';

export default function AnnouncementDetail() {
    const { t } = useTranslation('pwa');
    const dispatch = useDispatch();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { deleteNotification, markAsRead } = useNotifications();

    const [announcement, setAnnouncement] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfirmDelete, setIsConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Get notification ID from navigation state
    const notificationId = (location.state as any)?.notificationId;

    const token = localStorage.getItem('employee_auth_token');

    useEffect(() => {
        dispatch(setPageTitle(t('announcement_detail', 'Announcement Detail')));
        
        // Mark as read on mount if notificationId is present
        if (notificationId) {
            markAsRead(notificationId);
        }
    }, [dispatch, t, notificationId]);

    useEffect(() => {
        const fetch_ = async () => {
            if (!id) return;
            console.log(`[AnnouncementDetail] Fetching announcement ID: ${id}`);
            
            try {
                const res = await pwaFetch(`/api/employee-app/announcements/${id}`, {
                    headers: { 
                        'Accept': 'application/json', 
                        'Authorization': `Bearer ${token}` 
                    },
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    setAnnouncement(data);
                } else if (res.status === 403) {
                    pwaToast.error(data.message || 'Access Denied');
                    navigate(-1);
                } else if (res.status === 404) {
                    pwaToast.error(data.message || 'Announcement not found');
                    navigate(-1);
                } else {
                    pwaToast.error(data.message || 'Failed to load announcement');
                    navigate(-1);
                }
            } catch (error) {
                console.error('[AnnouncementDetail] Fetch error:', error);
                pwaToast.error('Network error. Please try again.');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetch_();
    }, [id]);

    const handleConfirmDelete = async () => {
        if (!notificationId) return;
        setIsDeleting(true);
        try {
            await deleteNotification(notificationId);
            setIsConfirmDelete(false);
            pwaToast.success('Notification cleared');
            navigate('/employee/notifications');
        } catch (e) {
            pwaToast.error('Failed to clear notification');
        } finally {
            setIsDeleting(false);
        }
    };

    const typeStyles: Record<string, { border: string; bg: string; text: string; badge: string }> = {
        info:    { border: 'border-blue-100 dark:border-blue-900/40', bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        success: { border: 'border-green-100 dark:border-green-900/40', bg: 'bg-green-50 dark:bg-green-900/10', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        warning: { border: 'border-yellow-100 dark:border-yellow-900/40', bg: 'bg-yellow-50 dark:bg-yellow-900/10', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' },
        danger:  { border: 'border-red-100 dark:border-red-900/40', bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };

    const typeIcons: Record<string, React.ReactNode> = {
        info: <IconInfoCircle size={12} />,
        success: <IconCircleCheck size={12} />,
        warning: <IconAlertTriangle size={12} />,
        danger: <IconAlertOctagon size={12} />,
    };

    const targetingLabels: Record<string, string> = {
        all: t('targeting_all', 'All Employees'),
        branch: t('targeting_branch', 'Specific Branches'),
        department: t('targeting_department', 'Specific Departments'),
        employee: t('targeting_employee', 'Specific Employees'),
    };

    const style = typeStyles[announcement?.type ?? 'info'] ?? typeStyles.info;

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
                <PageHeader 
                    title={t('announcement', 'Announcement')}
                    rightAction={notificationId && (
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    )}
                />
                <div className="p-5 space-y-4 animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
                    <div className='flex items-center gap-2 w-3/5'>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-full" />
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2" />
                    </div>
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl w-full" />
                    <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!announcement) return null;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <PageHeader 
                title={t('announcement', 'Announcement')}
                rightAction={notificationId && (
                    <PwaActionButton
                        icon={<IconTrash />}
                        variant="danger"
                        onClick={() => setIsConfirmDelete(true)}
                        aria-label="Delete notification"
                    />
                )}
            />

            <div className="flex-1 overflow-y-auto pb-28 bg-gray-50 dark:bg-[#060818]">
                {/* Featured Image Banner */}
                {announcement.featured_image_url && (
                    <div className="w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden relative">
                        <img 
                            src={announcement.featured_image_url} 
                            className="w-full h-full object-cover" 
                            alt={announcement.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                    </div>
                )}

                {/* Content card */}
                <div className={`relative bg-gray-50 dark:bg-[#060818] px-5 pb-8 ${announcement.featured_image_url ? '-mt-8 rounded-t-3xl pt-8' : 'pt-6'}`}>
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="space-y-4">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${style.badge}`}>
                                {typeIcons[announcement.type]} {announcement.type}
                            </span>
                            
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                {announcement.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {(announcement.published_at || announcement.created_at) && (
                                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800/50 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <IconCalendar className="w-4 h-4 text-primary" />
                                        <span>{dayjs(announcement.created_at || announcement.published_at).format('MMM D, YYYY • h:mm A')}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800/50 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <IconUsers className="w-4 h-4 text-primary" />
                                    <span className="capitalize">{targetingLabels[announcement.targeting_type] || announcement.targeting_type || t('targeting_all', 'All Employees')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Short description */}
                        {announcement.short_description && (
                            <div className={`p-4 rounded-2xl border ${style.border} ${style.bg} relative overflow-hidden group`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform scale-[4] translate-y-2 -translate-x-2 origin-top-right">
                                    {typeIcons[announcement.type]} 
                                </div>
                                <p className={`text-sm font-semibold leading-relaxed relative z-10 ${style.text}`}>
                                    {announcement.short_description}
                                </p>
                            </div>
                        )}

                        {/* Rich Content */}
                        {announcement.content && (
                            <div
                                className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 shadow-sm"
                                dangerouslySetInnerHTML={{ __html: announcement.content }}
                            />
                        )}

                        {/* Attachments Section */}
                        {Array.isArray(announcement.attachments_with_urls) && announcement.attachments_with_urls.length > 0 && (
                            <div className="mt-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <IconPaperclip className="w-4 h-4 text-gray-400" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Attachments</h3>
                                </div>
                                <div className="space-y-2">
                                    {announcement.attachments_with_urls.map((file: any, i: number) => (
                                        <a
                                            key={i}
                                            href={file.url}
                                            download={file.name}
                                            className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 rounded-2xl active:scale-[0.98] transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-[#060818] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                    <IconFile className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-gray-700 dark:text-gray-200 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{file.name}</p>
                                                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{formatSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                <IconDownload className="w-4 h-4" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation BottomSheet */}
            <BottomSheet 
                isOpen={isConfirmDelete} 
                onClose={() => setIsConfirmDelete(false)}
                title={t('confirm_delete_notification', 'Clear Notification')}
            >
                <div className="space-y-6 pt-2">
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <IconAlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('delete_notification_confirmation', 'Are you sure you want to remove this notification alert?')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setIsConfirmDelete(false)}
                            className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                        >
                            {t('cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="h-12 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <IconLoader2 size={16} className="animate-spin" />
                            ) : (
                                t('confirm_delete', 'Confirm')
                            )}
                        </button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
}

