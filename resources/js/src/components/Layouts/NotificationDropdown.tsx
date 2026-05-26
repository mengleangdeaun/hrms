import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBell, IconUser, IconMessageDots, IconCheck, IconTrash, IconDotsVertical, IconTimeline, IconCircleCheck, IconLoader2 } from '@tabler/icons-react';
import Dropdown from '../Dropdown';
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification, useDeleteAllNotifications } from '@/hooks/useNotificationData';
import { useFormatDate } from '@/hooks/useFormatDate';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { toast } from 'sonner';
import DeleteModal from '../DeleteModal';

export const NotificationDropdown = () => {
    const { t } = useTranslation();
    const { formatDateTime } = useFormatDate();
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { data: notifications = [], refetch, isLoading } = useNotifications();
    const { data: unreadCount = 0, refetch: refetchUnreadCount } = useUnreadNotificationCount();

    const navigate = useNavigate();

    const markReadMutation = useMarkNotificationRead();
    const markAllReadMutation = useMarkAllNotificationsRead();
    const deleteMutation = useDeleteNotification();
    const deleteAllMutation = useDeleteAllNotifications();

    // Echo listener
    useEffect(() => {
        const storedUser = localStorage.getItem('user_info');
        if (!storedUser) return;
        const user = JSON.parse(storedUser);

        if (window.Echo) {
            // 1. Listen to User channel
            const userChannel = `App.Models.Auth.User.${user.id}`;
            window.Echo.private(userChannel).notification((notification: any) => {
                refetch();
                refetchUnreadCount();
                toast(notification.title || 'New Notification', {
                    description: notification.message || '',
                    icon: <IconBell className="text-primary" size={18} />,
                });
            });

            // 2. Listen to Employee channel (if linked)
            let employeeChannel: string | null = null;
            if (user.employee?.id) {
                employeeChannel = `App.Models.HR.Employee.${user.employee.id}`;
                window.Echo.private(employeeChannel).notification((notification: any) => {
                    // Silence PWA notifications in the Admin Dashboard to prevent cross-talk
                    if (notification.app_category === 'pwa' || (notification.data && notification.data.app_category === 'pwa')) {
                        return;
                    }

                    refetch();
                    refetchUnreadCount();
                    toast(notification.title || 'New Notification (HR)', {
                        description: notification.message || '',
                        icon: <IconBell className="text-success" size={18} />,
                    });
                });
            }

            return () => {
                window.Echo.leave(userChannel);
                if (employeeChannel) window.Echo.leave(employeeChannel);
            };
        }
    }, [refetch]);

    const handleMarkRead = (id: string) => {
        markReadMutation.mutate(id);
    };

    const handleMarkAllRead = () => {
        markAllReadMutation.mutate();
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteMutation.mutate(id);
    };

    const handleDeleteAll = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteAll = () => {
        deleteAllMutation.mutate(undefined, {
            onSuccess: () => setShowDeleteModal(false),
        });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'crm_mention':
                return <IconMessageDots size={18} className="text-primary" />;
            case 'crm_assigned':
                return <IconUser size={18} className="text-success" />;
            default:
                return <IconBell size={18} className="text-slate-400" />;
        }
    };

    return (
        <div className="dropdown shrink-0">
            <Dropdown
                offset={[0, 8]}
                placement={isRtl ? 'bottom-start' : 'bottom-end'}
                btnClassName="relative block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60 transition-all duration-200"
                button={
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" color="none" fill="none" viewBox="0 0 24 24">
                            <path
                                d="M18.7491 9.70957V9.00497C18.7491 5.13623 15.7274 2 12 2C8.27256 2 5.25087 5.13623 5.25087 9.00497V9.70957C5.25087 10.5552 5.00972 11.3818 4.5578 12.0854L3.45036 13.8095C2.43882 15.3843 3.21105 17.5249 4.97036 18.0229C9.57274 19.3257 14.4273 19.3257 19.0296 18.0229C20.789 17.5249 21.5612 15.3843 20.5496 13.8095L19.4422 12.0854C18.9903 11.3818 18.7491 10.5552 18.7491 9.70957Z"
                                stroke="currentColor"
                                stroke-width="1.5"
                            ></path>
                            <path d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" opacity="0.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                            <path d="M12 6V10" opacity="0.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                        </svg>
                        {unreadCount > 0 && (
                            <span className="flex absolute w-4 h-4 -top-1 -right-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger/50 opacity-75"></span>
                                <span className="relative inline-flex rounded-full w-4 h-4 bg-danger text-[9px] text-white font-black items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </span>
                        )}
                    </div>
                }
            >
                <div className="!py-0 mt-1 text-dark dark:text-white-dark w-[320px] sm:w-[380px] bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center px-5 py-4 justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <h4 className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{t('notifications')}</h4>
                            {unreadCount > 0 && (
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                    {unreadCount} {t('unread')}
                                </span>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleMarkAllRead}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary transition-colors tooltip"
                                    title={t('mark_all_read')}
                                >
                                    <IconCircleCheck size={18} />
                                </button>
                                <button
                                    onClick={handleDeleteAll}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-danger transition-colors"
                                    title={t('delete_all')}
                                >
                                    <IconTrash size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <PerfectScrollbar className="max-h-[420px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <IconLoader2 className="animate-spin text-primary/40" size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('loading')}</p>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {notifications.map((notification: any) => {
                                    const data = notification.data || {};
                                    const isRead = !!notification.read_at;
                                    const title = data.title || notification.title || t('notification');
                                    const message = data.message || notification.message || '';

                                    return (
                                        <div
                                            key={notification.id}
                                            onClick={() => {
                                                if (!isRead) handleMarkRead(notification.id);
                                                if (data.action_url) {
                                                    navigate(data.action_url);
                                                }
                                            }}
                                            className={`
                                                group flex items-start gap-4 px-5 py-4 cursor-pointer transition-all duration-200
                                                ${isRead ? 'opacity-60 grayscale-[0.5]' : 'bg-primary/[0.02] dark:bg-primary/[0.01] hover:bg-primary/[0.05] dark:hover:bg-primary/[0.03]'}
                                                hover:pl-6
                                            `}
                                        >
                                            <div className="shrink-0 mt-1">
                                                <div
                                                    className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center border transition-colors
                                                    ${isRead ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-900 border-primary/20 shadow-sm'}
                                                `}
                                                >
                                                    {getIcon(data.type || notification.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">{formatDateTime(notification.created_at)}</span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-normal line-clamp-2">{message}</p>
                                                {!isRead && (
                                                    <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-tighter">
                                                        <IconTimeline size={10} />
                                                        <span>{t('view_activity', 'View Activity')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleDelete(notification.id, e)}
                                                    className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-300 hover:text-danger transition-colors"
                                                >
                                                    <IconTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                                <div className="w-16 h-16  flex items-center justify-center mb-4 ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" color="none" fill="none" viewBox="0 0 24 24"><path d="M18.7491 9.70957V9.00497C18.7491 5.13623 15.7274 2 12 2C8.27256 2 5.25087 5.13623 5.25087 9.00497V9.70957C5.25087 10.5552 5.00972 11.3818 4.5578 12.0854L3.45036 13.8095C2.43882 15.3843 3.21105 17.5249 4.97036 18.0229C9.57274 19.3257 14.4273 19.3257 19.0296 18.0229C20.789 17.5249 21.5612 15.3843 20.5496 13.8095L19.4422 12.0854C18.9903 11.3818 18.7491 10.5552 18.7491 9.70957Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M7.5 19C8.15503 20.7478 9.92246 22 12 22C14.0775 22 15.845 20.7478 16.5 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M12 6V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
                                </div>
                                <h5 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{t('all_caught_up', 'All Caught Up!')}</h5>
                                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 px-4">{t('no_new_notifications', "You don't have any notifications right now.")}</p>
                            </div>
                        )}
                    </PerfectScrollbar>

                    {notifications.length > 5 && (
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                            <button className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all">
                                {t('view_all_notifications')}
                            </button>
                        </div>
                    )}
                </div>
            </Dropdown>

            <DeleteModal
                isOpen={showDeleteModal}
                setIsOpen={setShowDeleteModal}
                onConfirm={confirmDeleteAll}
                isLoading={deleteAllMutation.isPending}
                title={t('delete_all_notifications', 'Delete All Notifications')}
                message={t('confirm_delete_all_desc', 'Are you sure you want to delete all notifications? This action cannot be undone.')}
            />
        </div>
    );
};
