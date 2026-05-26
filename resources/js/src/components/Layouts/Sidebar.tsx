import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
    const { t } = useTranslation();
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [saleSetSubMenu, setSaleSetSubMenu] = useState(false);
    const [crmSetSubMenu, setCrmSetSubMenu] = useState(false);
    const [workshopSetSubMenu, setWorkshopSetSubMenu] = useState(false);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { hasPermission } = useAuth();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            const all: any = document.querySelectorAll('.sidebar .active');
            for (let i = 0; i < all.length; i++) {
                all[i]?.classList.remove('active');
            }
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                const liMenu = ul.closest('li.menu');
                if (liMenu) {
                    liMenu.querySelector('button')?.classList.add('active');

                    // Auto-expand menus based on URL
                    const path = window.location.pathname;
                    if (path.startsWith('/settings/') || path.startsWith('/crm/customer-types') || path.startsWith('/crm/settings') || path.startsWith('/crm/tma/settings')) {
                        setCurrentMenu('datalabel');
                        if (path.includes('crm') || path.includes('tma')) setCrmSetSubMenu(true);
                    } else if (
                        path.startsWith('/sales/remarks') ||
                        path.startsWith('/inventory/categories') ||
                        path.startsWith('/inventory/uoms') ||
                        path.startsWith('/inventory/tags') ||
                        path.startsWith('/inventory/products') ||
                        path.startsWith('/service/list') ||
                        path.startsWith('/inventory/locations')
                    ) {
                        setCurrentMenu('datalabel');
                        setSaleSetSubMenu(true);
                    } else if (
                        path.startsWith('/services/parts') ||
                        path.startsWith('/services/vehicles/brands') ||
                        path.startsWith('/services/vehicles/models') ||
                        path.startsWith('/services/damage-types')
                    ) {
                        setCurrentMenu('datalabel');
                        setWorkshopSetSubMenu(true);
                    } else if (path.startsWith('/attendance/')) {
                        setCurrentMenu('attendance');
                    } else if (path.startsWith('/hr/leave-') || path.startsWith('/hr/day-off')) {
                        setCurrentMenu('leave_management');
                    } else if (path.startsWith('/hr/')) {
                        setCurrentMenu('hr_management');
                    } else if (path.startsWith('/crm/banners') || path.startsWith('/crm/tma/broadcast')) {
                        setCurrentMenu('marketing');
                    } else if (path.startsWith('/inventory/')) {
                        setCurrentMenu('inventory');
                    } else if (path.startsWith('/procurement/')) {
                        setCurrentMenu('procurement');
                    } else if (path.startsWith('/finance/')) {
                        setCurrentMenu('finance');
                    } else if (path.startsWith('/stock/')) {
                        setCurrentMenu('stock_management');
                    } else if (path.startsWith('/services/')) {
                        setCurrentMenu('jobcontrol');
                    } else if (path.startsWith('/access-control/')) {
                        setCurrentMenu('accesscontrol');
                    } else if (path.startsWith('/dashboard/')) {
                        setCurrentMenu('dashboard');
                    }
                }
            }
        }
    }, [location.pathname]);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] border-r shadow-[2px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-16 ml-[5px] flex-none" src="/assets/images/logo-side.svg" alt="logo" />
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 m-auto">
                                <path d="M13 19L7 12L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative mt-1 font-semibold space-y-0.5 p-4 py-0">
                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'dashboard' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('dashboard')}>
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.5" d="M13 15.4C13 13.3258 13 12.2887 13.659 11.6444C14.318 11 15.3787 11 17.5 11C19.6213 11 20.682 11 21.341 11.6444C22 12.2887 22 13.3258 22 15.4V17.6C22 19.6742 22 20.7113 21.341 21.3556C20.682 22 19.6213 22 17.5 22C15.3787 22 14.318 22 13.659 21.3556C13 20.7113 13 19.6742 13 17.6V15.4Z" fill="currentColor"></path><path d="M2 8.6C2 10.6742 2 11.7113 2.65901 12.3556C3.31802 13 4.37868 13 6.5 13C8.62132 13 9.68198 13 10.341 12.3556C11 11.7113 11 10.6742 11 8.6V6.4C11 4.32582 11 3.28873 10.341 2.64437C9.68198 2 8.62132 2 6.5 2C4.37868 2 3.31802 2 2.65901 2.64437C2 3.28873 2 4.32582 2 6.4V8.6Z" fill="currentColor"></path><path d="M13 5.5C13 4.4128 13 3.8692 13.1713 3.44041C13.3996 2.86867 13.8376 2.41443 14.389 2.17761C14.8024 2 15.3266 2 16.375 2H18.625C19.6734 2 20.1976 2 20.611 2.17761C21.1624 2.41443 21.6004 2.86867 21.8287 3.44041C22 3.8692 22 4.4128 22 5.5C22 6.5872 22 7.1308 21.8287 7.55959C21.6004 8.13133 21.1624 8.58557 20.611 8.82239C20.1976 9 19.6734 9 18.625 9H16.375C15.3266 9 14.8024 9 14.389 8.82239C13.8376 8.58557 13.3996 8.13133 13.1713 7.55959C13 7.1308 13 6.5872 13 5.5Z" fill="currentColor"></path><path opacity="0.5" d="M2 18.5C2 19.5872 2 20.1308 2.17127 20.5596C2.39963 21.1313 2.83765 21.5856 3.38896 21.8224C3.80245 22 4.32663 22 5.375 22H7.625C8.67337 22 9.19755 22 9.61104 21.8224C10.1624 21.5856 10.6004 21.1313 10.8287 20.5596C11 20.1308 11 19.5872 11 18.5C11 17.4128 11 16.8692 10.8287 16.4404C10.6004 15.8687 10.1624 15.4144 9.61104 15.1776C9.19755 15 8.67337 15 7.625 15H5.375C4.32663 15 3.80245 15 3.38896 15.1776C2.83765 15.4144 2.39963 15.8687 2.17127 16.4404C2 16.8692 2 17.4128 2 18.5Z" fill="currentColor"></path>
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3">{t('dashboard')}</span>
                                    </div>

                                    <div className={currentMenu === 'dashboard' ? 'rotate-90' : 'rtl:rotate-180'}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'dashboard' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        {(hasPermission('view_sales') ||
                                            hasPermission('view_attendance')) && (
                                            <>
                                                {hasPermission('view_attendance') && (
                                                    <li>
                                                        <NavLink to="/dashboard/attendance">{t('attendance')}</NavLink>
                                                    </li>
                                                )}
                                            </>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {(hasPermission('manage_branches') ||
                                hasPermission('manage_departments') ||
                                hasPermission('manage_designations') ||
                                hasPermission('manage_document_types') ||
                                hasPermission('view_employees') ||
                                hasPermission('manage_branch_employees') ||
                                hasPermission('manage_award_types') ||
                                hasPermission('manage_awards') ||
                                hasPermission('manage_promotions') ||
                                hasPermission('manage_salary_movements') ||
                                hasPermission('manage_resignations') ||
                                hasPermission('manage_terminations') ||
                                hasPermission('manage_warnings') ||
                                hasPermission('manage_holidays') ||
                                hasPermission('view_hr_activity_log') ||
                                hasPermission('manage_company_feedbacks') ||
                                hasPermission('manage_announcements')) && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                        <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        <span>{t('hr_management')}</span>
                                    </h2>

                                    <li className="menu nav-item !mt-1">
                                        <button type="button" className={`${currentMenu === 'hr_management' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('hr_management')}>
                                            <div className="flex items-center">
                                                <svg className="group-hover:text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        opacity="0.5"
                                                        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
                                                        fill="currentColor"
                                                    />
                                                    <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="currentColor" />
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3">{t('hr_management')}</span>
                                            </div>

                                            <div className={currentMenu === 'hr_management' ? 'rotate-90' : 'rtl:rotate-180'}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'hr_management' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                {hasPermission('manage_branches') && (
                                                    <li>
                                                        <NavLink to="/hr/branches">{t('branches', 'Branches')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_departments') && (
                                                    <li>
                                                        <NavLink to="/hr/departments">{t('departments', 'Departments')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_designations') && (
                                                    <li>
                                                        <NavLink to="/hr/designations">{t('designations', 'Designations')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_document_types') && (
                                                    <li>
                                                        <NavLink to="/hr/document-types">{t('document_types', 'Document Types')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('view_employees') && (
                                                    <li>
                                                        <NavLink to="/hr/employees">{t('employee_list', 'Employee List')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_branch_employees') && (
                                                    <li>
                                                        <NavLink to="/hr/branch-employees">{t('branch_employees', 'Branch Employees')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_award_types') && (
                                                    <li>
                                                        <NavLink to="/hr/award-types">{t('award_types', 'Award Types')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_awards') && (
                                                    <li>
                                                        <NavLink to="/hr/awards">{t('awards', 'Awards')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_promotions') && (
                                                    <li>
                                                        <NavLink to="/hr/promotions">{t('promotions', 'Promotions')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_salary_movements') && (
                                                    <li>
                                                        <NavLink to="/hr/salary-movements">{t('salary_movements', 'Salary Movements')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_resignations') && (
                                                    <li>
                                                        <NavLink to="/hr/resignations">{t('resignations', 'Resignations')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_terminations') && (
                                                    <li>
                                                        <NavLink to="/hr/terminations">{t('terminations', 'Terminations')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_warnings') && (
                                                    <li>
                                                        <NavLink to="/hr/warnings">{t('warnings', 'Warnings')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_holidays') && (
                                                    <li>
                                                        <NavLink to="/hr/holidays">{t('holidays', 'Holidays')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('view_hr_activity_log') && (
                                                    <li>
                                                        <NavLink to="/hr/activities">{t('activity_log', 'Emp Activity Log')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_company_feedbacks') && (
                                                    <li>
                                                        <NavLink to="/hr/company-feedbacks">{t('feedbacks', 'Feedbacks')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_announcements') && (
                                                    <li>
                                                        <NavLink to="/hr/announcements">{t('announcements', 'Announcements')}</NavLink>
                                                    </li>
                                                )}
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                </>
                            )}

                            {(hasPermission('manage_leave_types') ||
                                hasPermission('manage_leave_policies') ||
                                hasPermission('manage_leave_allocations') ||
                                hasPermission('manage_leave_records') ||
                                hasPermission('view_leave_balances') ||
                                hasPermission('manage_day_offs')) && (
                                <>
                                    {/* Leave Management Module */}
                                    <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
                                        <svg className="hidden h-5 w-4 flex-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        <span>{t('leave_management', 'Leave Management')}</span>
                                    </h2>

                                    <li className="menu nav-item mt-1">
                                        <button type="button" className={`${currentMenu === 'leave_management' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('leave_management')}>
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        opacity="0.5"
                                                        d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                                                        fill="currentColor"
                                                    />
                                                    <path d="M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                    <path d="M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                    <circle cx="12" cy="14" r="2" fill="currentColor" />
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3">{t('leave_management', 'Leave')}</span>
                                            </div>

                                            <div className={currentMenu === 'leave_management' ? 'rotate-90' : 'rtl:rotate-180'}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'leave_management' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                {hasPermission('manage_leave_types') && (
                                                    <li>
                                                        <NavLink to="/hr/leave-types">{t('leave_types', 'Types')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_leave_policies') && (
                                                    <li>
                                                        <NavLink to="/hr/leave-policies">{t('leave_policies', 'Policies')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_leave_allocations') && (
                                                    <li>
                                                        <NavLink to="/hr/leave-allocations">{t('leave_allocations', 'Allocations')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_leave_records') && (
                                                    <li>
                                                        <NavLink to="/hr/leave-records">{t('leave_records', 'Leave Records')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('view_leave_balances') && (
                                                    <li>
                                                        <NavLink to="/hr/leave-balances">{t('leave_balances', 'Balances')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_day_offs') && (
                                                    <li>
                                                        <NavLink to="/hr/day-offs">{t('day_offs', 'Day Off')}</NavLink>
                                                    </li>
                                                )}
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                </>
                            )}


                            {hasPermission('access_media_library') && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                        <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        <span>{t('resource', 'Resource')}</span>
                                    </h2>

                                    <li className="nav-item !mt-1">
                                        <NavLink to="/apps/media-library" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        fill-rule="evenodd"
                                                        clip-rule="evenodd"
                                                        d="M8.67239 7.54199H15.3276C18.7024 7.54199 20.3898 7.54199 21.3377 8.52882C22.2855 9.51565 22.0625 11.0403 21.6165 14.0895L21.1935 16.9811C20.8437 19.3723 20.6689 20.5679 19.7717 21.2839C18.8745 21.9999 17.5512 21.9999 14.9046 21.9999H9.09536C6.44881 21.9999 5.12553 21.9999 4.22834 21.2839C3.33115 20.5679 3.15626 19.3723 2.80648 16.9811L2.38351 14.0895C1.93748 11.0403 1.71447 9.51565 2.66232 8.52882C3.61017 7.54199 5.29758 7.54199 8.67239 7.54199ZM8 18.0001C8 17.5859 8.3731 17.2501 8.83333 17.2501H15.1667C15.6269 17.5859 16 17.5859 16 18.0001C16 18.4143 15.6269 18.7501 15.1667 18.7501H8.83333C8.3731 18.7501 8 18.4143 8 18.0001Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <g opacity="0.4">
                                                        <path
                                                            d="M8.51005 2.00001H15.4901C15.7226 1.99995 15.9009 1.99991 16.0567 2.01515C17.1645 2.12352 18.0712 2.78958 18.4558 3.68678H5.54443C5.92895 2.78958 6.8357 2.12352 7.94352 2.01515C8.09933 1.99991 8.27757 1.99995 8.51005 2.00001Z"
                                                            fill="currentColor"
                                                        ></path>
                                                    </g>
                                                    <g opacity="0.7">
                                                        <path
                                                            d="M6.31069 4.72266C4.92007 4.72266 3.7798 5.56241 3.39927 6.67645C3.39134 6.69967 3.38374 6.72302 3.37646 6.74647C3.77461 6.6259 4.18898 6.54713 4.60845 6.49336C5.68882 6.35485 7.05416 6.35492 8.64019 6.35501L8.75863 6.35501L15.5323 6.35501C17.1183 6.35492 18.4837 6.35485 19.564 6.49336C19.9835 6.54713 20.3979 6.6259 20.796 6.74647C20.7887 6.72302 20.7811 6.69967 20.7732 6.67645C20.3927 5.56241 19.2524 4.72266 17.8618 4.72266H6.31069Z"
                                                            fill="currentColor"
                                                        ></path>
                                                    </g>
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3">{t('media_library')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            {(hasPermission('view_roles') || hasPermission('view_users')) && (
                                <li className="menu nav-item">
                                    <button type="button" className={`${currentMenu === 'accesscontrol' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('accesscontrol')}>
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path opacity="0.5" d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167V11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914V10.4167Z" fill="currentColor"></path><path d="M13.5 15C13.5 15.5523 13.0523 16 12.5 16H11.5C10.9477 16 10.5 15.5523 10.5 15V13.5987C9.6033 13.0799 9 12.1104 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11C15 12.1104 14.3967 13.0799 13.5 13.5987V15Z" fill="currentColor"></path>

                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3">{t('accesscontrol', 'Access Control')}</span>
                                        </div>

                                        <div className={currentMenu === 'accesscontrol' ? 'rotate-90' : 'rtl:rotate-180'}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </button>

                                    <AnimateHeight duration={300} height={currentMenu === 'accesscontrol' ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            {hasPermission('view_users') && (
                                                <li>
                                                    <NavLink to="/access-control/users">{t('users', 'Users')}</NavLink>
                                                </li>
                                            )}
                                            {hasPermission('view_roles') && (
                                                <li>
                                                    <NavLink to="/access-control/roles">{t('roles_permissions', 'Roles & Permissions')}</NavLink>
                                                </li>
                                            )}
                                        </ul>
                                    </AnimateHeight>
                                </li>
                            )}

                            {(hasPermission('manage_setup_data') || hasPermission('manage_templates') || hasPermission('manage_branding') || hasPermission('manage_pwa_settings')) && (
                                <>
                                    <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 font-extrabold uppercase dark:bg-dark dark:bg-opacity-[0.08]">
                                        <svg className="hidden h-5 w-5 flex-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        <span>{t('settings', 'Settings')}</span>
                                    </h2>

                                    <li className="menu nav-item !mt-1">
                                        <button type="button" className={`${currentMenu === 'datalabel' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('datalabel')}>
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">


<path fill-rule="evenodd" clip-rule="evenodd" d="M17.5 2.75C17.9142 2.75 18.25 3.08579 18.25 3.5V5.75H20.5C20.9142 5.75 21.25 6.08579 21.25 6.5C21.25 6.91421 20.9142 7.25 20.5 7.25H18.25V9.5C18.25 9.91421 17.9142 10.25 17.5 10.25C17.0858 10.25 16.75 9.91421 16.75 9.5V7.25H14.5C14.0858 7.25 13.75 6.91421 13.75 6.5C13.75 6.08579 14.0858 5.75 14.5 5.75H16.75V3.5C16.75 3.08579 17.0858 2.75 17.5 2.75Z" fill="currentColor"></path><path d="M2 6.5C2 4.37868 2 3.31802 2.65901 2.65901C3.31802 2 4.37868 2 6.5 2C8.62132 2 9.68198 2 10.341 2.65901C11 3.31802 11 4.37868 11 6.5C11 8.62132 11 9.68198 10.341 10.341C9.68198 11 8.62132 11 6.5 11C4.37868 11 3.31802 11 2.65901 10.341C2 9.68198 2 8.62132 2 6.5Z" fill="currentColor"></path><path d="M13 17.5C13 15.3787 13 14.318 13.659 13.659C14.318 13 15.3787 13 17.5 13C19.6213 13 20.682 13 21.341 13.659C22 14.318 22 15.3787 22 17.5C22 19.6213 22 20.682 21.341 21.341C20.682 22 19.6213 22 17.5 22C15.3787 22 14.318 22 13.659 21.341C13 20.682 13 19.6213 13 17.5Z" fill="currentColor"></path><path opacity="0.5" d="M2 17.5C2 15.3787 2 14.318 2.65901 13.659C3.31802 13 4.37868 13 6.5 13C8.62132 13 9.68198 13 10.341 13.659C11 14.318 11 15.3787 11 17.5C11 19.6213 11 20.682 10.341 21.341C9.68198 22 8.62132 22 6.5 22C4.37868 22 3.31802 22 2.65901 21.341C2 20.682 2 19.6213 2 17.5Z" fill="currentColor"></path>
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3">{t('data_labels', 'Setup Data')}</span>
                                            </div>

                                            <div className={currentMenu === 'datalabel' ? 'rotate-90' : 'rtl:rotate-180'}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'datalabel' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                {hasPermission('manage_setup_data') && (
                                                    <>
                                                        <li className="relative">
                                                            <button
                                                                type="button"
                                                                className={`${saleSetSubMenu ? 'text-primary' : ''} w-full before:bg-gray-300 before:w-[5px] before:h-[5px] before:rounded-full before:inline-block ltr:before:mr-2 rtl:before:ml-2 flex items-center hover:text-primary !py-2`}
                                                                onClick={() => setSaleSetSubMenu(!saleSetSubMenu)}
                                                            >
                                                                {t('sale_inventory', 'Sale & Inventory')}
                                                                <div className={`ltr:ml-auto rtl:mr-auto ${saleSetSubMenu ? 'rotate-90' : ''}`}>
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                </div>
                                                            </button>

                                                        </li>
                                                        <li className="relative">
                                                            <button
                                                                type="button"
                                                                className={`${workshopSetSubMenu ? 'text-primary' : ''} w-full before:bg-gray-300 before:w-[5px] before:h-[5px] before:rounded-full before:inline-block ltr:before:mr-2 rtl:before:ml-2 flex items-center hover:text-primary !py-2`}
                                                                onClick={() => setWorkshopSetSubMenu(!workshopSetSubMenu)}
                                                            >
                                                                {t('workshop_setup', 'Workshop')}
                                                                <div className={`ltr:ml-auto rtl:mr-auto ${workshopSetSubMenu ? 'rotate-90' : ''}`}>
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                </div>
                                                            </button>
                                                            <AnimateHeight duration={300} height={workshopSetSubMenu ? 'auto' : 0}>
                                                                <ul className="sub-menu text-gray-500 ltr:ml-4 rtl:mr-4">
                                                                    <li>
                                                                        <NavLink to="/services/parts">{t('parts', 'Parts')}</NavLink>
                                                                    </li>
                                                                    <li>
                                                                        <NavLink to="/services/vehicles/brands">{t('brands', 'Vehicle Brands')}</NavLink>
                                                                    </li>
                                                                    <li>
                                                                        <NavLink to="/services/vehicles/models">{t('models', 'Vehicle Models')}</NavLink>
                                                                    </li>
                                                                    <li>
                                                                        <NavLink to="/services/damage-types">{t('damage_types', 'Damage Types')}</NavLink>
                                                                    </li>
                                                                </ul>
                                                            </AnimateHeight>
                                                        </li>
                                                        <li className="relative">
                                                            <button
                                                                type="button"
                                                                className={`${crmSetSubMenu ? 'text-primary' : ''} w-full before:bg-gray-300 before:w-[5px] before:h-[5px] before:rounded-full before:inline-block ltr:before:mr-2 rtl:before:ml-2 flex items-center hover:text-primary !py-2`}
                                                                onClick={() => setCrmSetSubMenu(!crmSetSubMenu)}
                                                            >
                                                                {t('crm_setup', 'CRM')}
                                                                <div className={`ltr:ml-auto rtl:mr-auto ${crmSetSubMenu ? 'rotate-90' : ''}`}>
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                </div>
                                                            </button>
                                                            <AnimateHeight duration={300} height={crmSetSubMenu ? 'auto' : 0}>
                                                                <ul className="sub-menu text-gray-500 ltr:ml-4 rtl:mr-4">
                                                                    <li>
                                                                        <NavLink to="/crm/customer-types">{t('customer_types', 'Customer Types')}</NavLink>
                                                                    </li>
                                                                    <li>
                                                                        <NavLink to="/crm/tma/settings">{t('tma_settings', 'TMA Settings')}</NavLink>
                                                                    </li>
                                                                </ul>
                                                            </AnimateHeight>
                                                        </li>
                                                    </>
                                                )}
                                                {hasPermission('manage_templates') && (
                                                    <li>
                                                        <NavLink to="/settings/templates">{t('print_templates', 'Print Templates')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_branding') && (
                                                    <li>
                                                        <NavLink to="/settings/branding">{t('branding', 'Branding')}</NavLink>
                                                    </li>
                                                )}
                                                {hasPermission('manage_pwa_settings') && (
                                                    <li>
                                                        <NavLink to="/settings/pwa-settings">{t('pwa_settings', 'PWA Settings')}</NavLink>
                                                    </li>
                                                )}
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                </>
                            )}

                            {hasPermission('view_attendance_report') && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                        <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        <span>{t('reports')}</span>
                                    </h2>

                                    <li className="menu nav-item !mt-1">
                                        <NavLink to="/report/attendance" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        fill-rule="evenodd"
                                                        clip-rule="evenodd"
                                                        d="M16.245 7.76015L21.4166 2.58855L21.414 2.58595C20.2268 1.39869 17.9776 2.14842 13.4792 3.64788L8.32987 5.36432C4.69923 6.57453 2.88392 7.17964 2.36806 8.06698C1.87731 8.91112 1.87731 9.95369 2.36806 10.7978C2.88392 11.6852 4.69923 12.2903 8.32987 13.5005C8.77981 13.6505 9.28601 13.5434 9.62294 13.2096L15.1286 7.75495C15.4383 7.44808 15.9382 7.45041 16.245 7.76015Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        opacity="0.5"
                                                        d="M18.6351 15.6695L20.3516 10.5201C21.85 6.02503 22.5997 3.77584 21.4161 2.58789L16.2445 7.75949C16.5514 8.06923 16.5491 8.56909 16.2393 8.87596L10.8226 14.2425C10.4512 14.6104 10.3337 15.1735 10.499 15.6695C11.7092 19.3001 12.3143 21.1154 13.2016 21.6313C14.0458 22.122 15.0883 22.122 15.9325 21.6313C16.8198 21.1154 17.4249 19.3001 18.6351 15.6695Z"
                                                        fill="currentColor"
                                                    ></path>
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3">{t('attendance_report')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="menu nav-item !mt-1">
                                        <NavLink to="/report/action-overview" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M12.9511 8.59515L12.5875 8.23781C11.069 6.7455 10.3098 5.99934 9.48673 6C9.21786 6.00021 8.95184 6.05411 8.70481 6.15843C7.94859 6.47775 7.55155 7.45818 6.75747 9.41903L6.70001 9.56094C6.47489 10.1168 6.36233 10.3948 6.18157 10.619C6.04444 10.7891 5.87938 10.9356 5.6932 11.0523C5.44779 11.2061 5.15496 11.2878 4.5693 11.4511C3.66115 11.7045 3.20707 11.8311 3.00555 12.1012C2.8558 12.302 2.7898 12.5514 2.82108 12.7984C2.86316 13.1307 3.19693 13.4588 3.86446 14.1148L4.88148 15.1143L5.92632 16.1412L5.94409 16.1586L6.97115 17.168C7.63868 17.8241 7.97244 18.1521 8.31063 18.1934C8.56197 18.2242 8.81575 18.1593 9.02 18.0121C9.29483 17.8141 9.42371 17.3678 9.68146 16.4753C9.84768 15.8997 9.9308 15.6119 10.0873 15.3708C10.2061 15.1878 10.3551 15.0256 10.5282 14.8908C10.7563 14.7132 11.0391 14.6025 11.6048 14.3813L11.7492 14.3248C13.7444 13.5444 14.742 13.1542 15.0669 12.411C15.173 12.1682 15.2279 11.9068 15.2281 11.6425C15.2287 10.8336 14.4695 10.0875 12.9511 8.59515Z" fill="currentColor"></path><path opacity="0.5" d="M3.2706 18.7857L5.94386 16.1586L5.92608 16.1411L4.88125 15.1143L2.218 17.7512C1.92733 18.0369 1.92733 18.5 2.218 18.7857C2.50867 19.0714 2.97993 19.0714 3.2706 18.7857Z" fill="currentColor"></path><g opacity="0.5"><path fill-rule="evenodd" clip-rule="evenodd" d="M22.0003 8.37699C22.0003 8.78098 21.667 9.10848 21.256 9.10848H16.294C15.8829 9.10848 15.5497 8.78098 15.5497 8.37699C15.5497 7.97301 15.8829 7.64551 16.294 7.64551H21.256C21.667 7.64551 22.0003 7.97301 22.0003 8.37699Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M22.0003 12.7659C22.0003 13.1699 21.667 13.4974 21.256 13.4974H17.2864C16.8753 13.4974 16.5421 13.1699 16.5421 12.7659C16.5421 12.3619 16.8753 12.0344 17.2864 12.0344H21.256C21.667 12.0344 22.0003 12.3619 22.0003 12.7659Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M22.0003 17.1548C22.0003 17.5588 21.667 17.8863 21.256 17.8863H12.3244C11.9133 17.8863 11.5801 17.5588 11.5801 17.1548C11.5801 16.7508 11.9133 16.4234 12.3244 16.4234H21.256C21.667 16.4234 22.0003 16.7508 22.0003 17.1548Z" fill="currentColor"></path></g>
                                                </svg>
                                                 <span className="ltr:pl-3 rtl:pr-3">{t('attendance_action', 'Attendance & Action')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                <li className="menu nav-item !mt-1">
                                        <NavLink to="/report/action" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M17 17C19.7614 17 22 14.7614 22 12C22 9.23858 19.7614 7 17 7C14.2386 7 12 9.23858 12 12C12 14.7614 14.2386 17 17 17ZM17.75 10C17.75 9.58579 17.4142 9.25 17 9.25C16.5858 9.25 16.25 9.58579 16.25 10V11.8462C16.25 12.0266 16.3151 12.201 16.4332 12.3374L17.4332 13.4912C17.7045 13.8042 18.1782 13.838 18.4912 13.5668C18.8042 13.2955 18.838 12.8218 18.5668 12.5088L17.75 11.5664V10Z" fill="currentColor"></path><g opacity="0.5"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 7C1.25 6.58579 1.58579 6.25 2 6.25H10C10.4142 6.25 10.75 6.58579 10.75 7C10.75 7.41421 10.4142 7.75 10 7.75H2C1.58579 7.75 1.25 7.41421 1.25 7ZM1.25 12C1.25 11.5858 1.58579 11.25 2 11.25H8C8.41421 11.25 8.75 11.5858 8.75 12C8.75 12.4142 8.41421 12.75 8 12.75H2C1.58579 12.75 1.25 12.4142 1.25 12ZM1.25 17C1.25 16.5858 1.58579 16.25 2 16.25H10C10.4142 16.25 10.75 16.5858 10.75 17C10.75 17.4142 10.4142 17.75 10 17.75H2C1.58579 17.75 1.25 17.4142 1.25 17Z" fill="currentColor"></path></g>
                                                </svg>
                                            <span className="ltr:pl-3 rtl:pr-3">{t('action_report', 'Detail Action Report')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>{t('user_and_pages')}</span>
                            </h2>

                            <li className="menu nav-item !mt-1">
                                <button type="button" className={`${currentMenu === 'users' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('users')}>
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle opacity="0.5" cx="15" cy="6" r="3" fill="currentColor" />
                                            <ellipse opacity="0.5" cx="16" cy="17" rx="5" ry="3" fill="currentColor" />
                                            <circle cx="9.00098" cy="6" r="4" fill="currentColor" />
                                            <ellipse cx="9.00098" cy="17.001" rx="7" ry="4" fill="currentColor" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3">{t('users')}</span>
                                    </div>

                                    <div className={currentMenu === 'users' ? 'rotate-90' : 'rtl:rotate-180'}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'users' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/users/profile">{t('profile')}</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/users/preferences">{t('preferences', 'Preferences')}</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'auth' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('auth')}>
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                opacity="0.5"
                                                d="M2 16C2 13.1716 2 11.7574 2.87868 10.8787C3.75736 10 5.17157 10 8 10H16C18.8284 10 20.2426 10 21.1213 10.8787C22 11.7574 22 13.1716 22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H8C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16Z"
                                                fill="currentColor"
                                            />
                                            <path d="M8 17C8.55228 17 9 16.5523 9 16C9 15.4477 8.55228 15 8 15C7.44772 15 7 15.4477 7 16C7 16.5523 7.44772 17 8 17Z" fill="currentColor" />
                                            <path d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" fill="currentColor" />
                                            <path d="M17 16C17 16.5523 16.5523 17 16 17C15.4477 17 15 16.5523 15 16C15 15.4477 15.4477 15 16 15C16.5523 15 17 15.4477 17 16Z" fill="currentColor" />
                                            <path
                                                d="M6.75 8C6.75 5.10051 9.10051 2.75 12 2.75C14.8995 2.75 17.25 5.10051 17.25 8V10.0036C17.8174 10.0089 18.3135 10.022 18.75 10.0546V8C18.75 4.27208 15.7279 1.25 12 1.25C8.27208 1.25 5.25 4.27208 5.25 8V10.0546C5.68651 10.022 6.18264 10.0089 6.75 10.0036V8Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3">{t('authentication')}</span>
                                    </div>

                                    <div className={currentMenu === 'auth' ? 'rotate-90' : 'rtl:rotate-180'}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'auth' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/auth/lockscreen" target="_blank">
                                                {t('lockscreen')}
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/auth/login" target="_blank">
                                                {t('sign_out')}
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/auth/forgot-password" target="_blank">
                                                {t('reset_password', 'Reset Password')}
                                            </NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>{t('supports')}</span>
                            </h2>

                            <li className="menu nav-item">
                                <NavLink to="/support/documentation" className="nav-link group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M4 4.69434V18.6943C4 20.3512 5.34315 21.6943 7 21.6943H17C18.6569 21.6943 20 20.3512 20 18.6943V8.69434C20 7.03748 18.6569 5.69434 17 5.69434H5C4.44772 5.69434 4 5.24662 4 4.69434ZM7.25 11.6943C7.25 11.2801 7.58579 10.9443 8 10.9443H16C16.4142 10.9443 16.75 11.2801 16.75 11.6943C16.75 12.1085 16.4142 12.4443 16 12.4443H8C7.58579 12.4443 7.25 12.1085 7.25 11.6943ZM7.25 15.1943C7.25 14.7801 7.58579 14.4443 8 14.4443H13.5C13.9142 14.4443 14.25 14.7801 14.25 15.1943C14.25 15.6085 13.9142 15.9443 13.5 15.9443H8C7.58579 15.9443 7.25 15.6085 7.25 15.1943Z"
                                                fill="currentColor"
                                            />
                                            <path
                                                opacity="0.5"
                                                d="M18 4.00038V5.86504C17.6872 5.75449 17.3506 5.69434 17 5.69434H5C4.44772 5.69434 4 5.24662 4 4.69434V4.62329C4 4.09027 4.39193 3.63837 4.91959 3.56299L15.7172 2.02048C16.922 1.84835 18 2.78328 18 4.00038Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3">{t('documentation')}</span>
                                    </div>
                                </NavLink>
                            </li>

                            <li className="menu nav-item">
                                <NavLink to="/support/shortcuts" className="nav-link group">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M20 6H4C2.89543 6 2 6.89543 2 8V16C2 17.1046 2.89543 18 4 18H20C21.1046 18 22 17.1046 22 16V8C22 6.89543 21.1046 6 20 6Z"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <path opacity="0.5" d="M6 10V10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path opacity="0.5" d="M10 10V10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path opacity="0.5" d="M14 10V10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path opacity="0.5" d="M18 10V10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path opacity="0.5" d="M6 14V14.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path opacity="0.5" d="M10 14H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path opacity="0.5" d="M18 14V14.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3">{t('shortcut_keys', 'Shortcut Keys')}</span>
                                    </div>
                                </NavLink>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
