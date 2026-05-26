import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { IRootState } from '../../store';
import { toggleRTL, toggleTheme, toggleSidebar, setUserPreferences, toggleLocale } from '../../store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import Dropdown from '../Dropdown';
import { NotificationDropdown } from './NotificationDropdown';
import SearchModal from './SearchModal';
import { useNavigate } from 'react-router-dom';
import SmartShiftButton from './SmartShiftButton';
import PerfectScrollbar from 'react-perfect-scrollbar';

const Header = () => {
    const { user, hasPermission } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();

    useEffect(() => {
        const selector = document.querySelector('ul.horizontal-menu a[href="' + location.pathname + '"]');
        if (selector) {
            const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
            for (let i = 0; i < all.length; i++) {
                all[i]?.classList.remove('active');
            }
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                const parentMenu = ul.closest('li.menu');
                if (parentMenu) {
                    let ele: any = parentMenu.querySelector('.nav-link');
                    if (ele) {
                        setTimeout(() => {
                            ele.classList.add('active');
                        });
                    }
                }
            }
        }
    }, [location]);

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const [search, setSearch] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsSearchModalOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    // avoid triggering while typing
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.altKey) {
      switch (key) {
        case "l":
          if (hasPermission('manage_leads')) {
            e.preventDefault();
            navigate("/crm/leads/list?action=create");
          }
          break;

        case "a":
          if (hasPermission('manage_attendance_records')) {
            e.preventDefault();
            navigate("/attendance/records");
          }
          break;

        case "m":
          if (hasPermission('access_media_library')) {
            e.preventDefault();
            navigate("/apps/media-library");
          }
          break;

        case "s":
          if (hasPermission('view_sales')) {
            e.preventDefault();
            if (e.shiftKey) {
              navigate("/sales/orders");
            } else {
              navigate("/sales/create");
            }
          }
          break;

        case "q":
          if (hasPermission('view_quotations')) {
            e.preventDefault();
            if (e.shiftKey) {
              navigate("/sales/quotation");
            } else {
              navigate("/sales/quotations/create");
            }
          }
          break;

        case "c": // C for QC
          if (hasPermission('view_workshop')) {
            e.preventDefault();
            navigate("/services/qc-reports");
          }
          break;

        case "v": // V for inVoice
          if (hasPermission('view_sales')) {
            e.preventDefault();
            navigate("/sales/invoices");
          }
          break;

        case "o":
          if (hasPermission('manage_purchase_orders')) {
            e.preventDefault();
            navigate("/procurement/purchase-orders");
          }
          break;

        case "i":
          if (hasPermission('manage_purchase_receives')) {
            e.preventDefault();
            navigate("/procurement/purchase-receives");
          }
          break;



        case "h":
          if (hasPermission('view_sales')) {
            e.preventDefault();
            navigate("/dashboard/super");
          }
          break;

        case "b":
          if (hasPermission('manage_branches')) {
            e.preventDefault();
            navigate("/hr/branches");
          }
          break;

        case "e":
          if (hasPermission('view_employees')) {
            e.preventDefault();
            navigate("/hr/employees");
          }
          break;

        case "f":
          if (hasPermission('view_transactions')) {
            e.preventDefault();
            if (e.shiftKey) {
              navigate("/finance/payment-accounts");
            } else {
              navigate("/finance/transactions");
            }
          }
          break;

        case "n":
          if (hasPermission('manage_incomes')) {
            e.preventDefault();
            navigate("/finance/incomes");
          }
          break;

        case "x":
          if (hasPermission('manage_expenses')) {
            e.preventDefault();
            navigate("/finance/expenses");
          }
          break;

        case "j":
          if (hasPermission('view_workshop')) {
            e.preventDefault();
            navigate("/services/job-cards");
          }
          break;

        case "g":
          if (hasPermission('view_system_logs')) {
            e.preventDefault();
            navigate("/settings/system-logs");
          }
          break;

        case "d":
           {
            e.preventDefault();
            if (e.shiftKey) {
              navigate("/dashboard/sales"); // Alt + Shift + D
            } else {
              navigate("/support/documentation"); // Alt + D
            }
          }
          break;

        case "/":
        {
            e.preventDefault();
            navigate("/support/shortcuts");
          }
          break;

        default:
          break;
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [navigate, hasPermission]);



    const setLocale = (flag: string) => {
        setFlag(flag);
        if (flag.toLowerCase() === 'ae') {
            dispatch(toggleRTL('rtl'));
        } else {
            dispatch(toggleRTL('ltr'));
        }
    };
    const [flag, setFlag] = useState(themeConfig.locale);

    const { t, i18n } = useTranslation();

    return (
        <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
            <div className="shadow-inner">
                <div className="relative bg-white border-b flex w-full items-center px-5 py-2.5 dark:bg-black">
                    <div className="horizontal-logo flex lg:hidden justify-between items-center ltr:mr-2 rtl:ml-2">
                        <Link to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-16 ltr:-ml-1 rtl:-mr-1 inline" src="/assets/images/logo-side.svg" alt="logo" />
                        </Link>
                        <button
                            type="button"
                            className="collapse-icon flex-none dark:text-[#d0d2d6] hover:text-primary dark:hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:bg-white-light/90 dark:hover:bg-dark/60"
                            onClick={() => {
                                dispatch(toggleSidebar());
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path opacity="0.5" d="M20 12L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M20 17L4 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="ltr:mr-2 rtl:ml-2 hidden sm:block">
                        <ul className="flex items-center space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
                            {hasPermission('manage_leads') && (
                                <li>
                                    <Link
                                        to="/crm/leads/list?action=create"
                                        className="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12V14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14V12Z"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                            />
                                            <path opacity="0.5" d="M7 4V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            <path opacity="0.5" d="M17 4V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            <path opacity="0.5" d="M2 9H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </Link>
                                </li>
                            )}
                            {hasPermission('view_sales') && (
                                <li>
                                    <Link to="/dashboard/sales" className="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                opacity="0.5"
                                                d="M22 10.5V12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2H13.5"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d="M17.3009 2.80624L16.652 3.45506L10.6872 9.41993C10.2832 9.82394 10.0812 10.0259 9.90743 10.2487C9.70249 10.5114 9.52679 10.7957 9.38344 11.0965C9.26191 11.3515 9.17157 11.6225 8.99089 12.1646L8.41242 13.9L8.03811 15.0229C7.9492 15.2897 8.01862 15.5837 8.21744 15.7826C8.41626 15.9814 8.71035 16.0508 8.97709 15.9619L10.1 15.5876L11.8354 15.0091C12.3775 14.8284 12.6485 14.7381 12.9035 14.6166C13.2043 14.4732 13.4886 14.2975 13.7513 14.0926C13.9741 13.9188 14.1761 13.7168 14.5801 13.3128L20.5449 7.34795L21.1938 6.69914C22.2687 5.62415 22.2687 3.88124 21.1938 2.80624C20.1188 1.73125 18.3759 1.73125 17.3009 2.80624Z"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                            />
                                            <path
                                                opacity="0.5"
                                                d="M16.6522 3.45508C16.6522 3.45508 16.7333 4.83381 17.9499 6.05034C19.1664 7.26687 20.5451 7.34797 20.5451 7.34797M10.1002 15.5876L8.4126 13.9"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                            />
                                        </svg>
                                    </Link>
                                </li>
                            )}
                            {hasPermission('manage_contacts') && (
                                <li>
                                    <Link
                                        to="/crm/contacts?action=create"
                                        className="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" color="none" fill="none" viewBox="0 0 24 24">
                                            <circle cx="9" cy="6" r="4" stroke="currentColor" stroke-width="1.5"></circle>
                                            <path
                                                opacity="0.5"
                                                d="M12.5 4.3411C13.0375 3.53275 13.9565 3 15 3C16.6569 3 18 4.34315 18 6C18 7.65685 16.6569 9 15 9C13.9565 9 13.0375 8.46725 12.5 7.6589"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                            ></path>
                                            <ellipse cx="9" cy="17" rx="7" ry="4" stroke="currentColor" stroke-width="1.5"></ellipse>
                                            <path
                                                opacity="0.5"
                                                d="M18 14C19.7542 14.3847 21 15.3589 21 16.5C21 17.5293 19.9863 18.4229 18.5 18.8704"
                                                stroke="currentColor"
                                                stroke-width="1.5"
                                                stroke-linecap="round"
                                            ></path>
                                        </svg>
                                    </Link>
                                </li>
                            )}
                            <li>
                                <SmartShiftButton />
                            </li>
                        </ul>
                    </div>
                    <div className="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
                        <div className="sm:ltr:mr-auto sm:rtl:ml-auto">
                            {/* Smart Searching Menu Trigger */}
                            <button
                                type="button"
                                onClick={() => setIsSearchModalOpen(true)}
                                className="flex items-center justify-center sm:justify-start gap-3 p-2 sm:px-3 sm:py-1 rounded-full bg-gray-100 dark:bg-dark/40 hover:bg-gray-200 dark:hover:bg-dark/60 text-gray-500 dark:text-white-dark transition-all duration-200 group border border-transparent hover:border-primary/20"
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4.5 h-4.5 group-hover:text-primary transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                                        <path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                    <span className="hidden sm:inline text-sm">{t('search_placeholder', 'Search menu...')}</span>
                                </div>
                                <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded-full border-none bg-gray-100 dark:bg-white/5 text-[10px] font-mono opacity-60">
                                    <span>{navigator.platform.indexOf('Mac') > -1 ? '⌥' : 'Alt'}</span>
                                    <span>K</span>
                                </div>
                            </button>

                            <SearchModal isOpen={isSearchModalOpen} setIsOpen={setIsSearchModalOpen} />
                        </div>
                        <div>
                            {themeConfig.theme === 'light' ? (
                                <button
                                    className={`${
                                        themeConfig.theme === 'light' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'
                                    }`}
                                    onClick={() => {
                                        dispatch(toggleTheme('dark'));
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M12 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M12 20V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M4 12L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M22 12L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M19.7778 4.22266L17.5558 6.25424" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M4.22217 4.22266L6.44418 6.25424" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M6.44434 17.5557L4.22211 19.7779" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M19.7778 19.7773L17.5558 17.5551" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            ) : (
                                ''
                            )}
                            {themeConfig.theme === 'dark' && (
                                <button
                                    className={`${
                                        themeConfig.theme === 'dark' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'
                                    }`}
                                    onClick={() => {
                                        dispatch(toggleTheme('system'));
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M21.0672 11.8568L20.4253 11.469L21.0672 11.8568ZM12.1432 2.93276L11.7553 2.29085V2.29085L12.1432 2.93276ZM21.25 12C21.25 17.1086 17.1086 21.25 12 21.25V22.75C17.9371 22.75 22.75 17.9371 22.75 12H21.25ZM12 21.25C6.89137 21.25 2.75 17.1086 2.75 12H1.25C1.25 17.9371 6.06294 22.75 12 22.75V21.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75V1.25C6.06294 1.25 1.25 6.06294 1.25 12H2.75ZM15.5 14.25C12.3244 14.25 9.75 11.6756 9.75 8.5H8.25C8.25 12.5041 11.4959 15.75 15.5 15.75V14.25ZM20.4253 11.469C19.4172 13.1373 17.5882 14.25 15.5 14.25V15.75C18.1349 15.75 20.4407 14.3439 21.7092 12.2447L20.4253 11.469ZM9.75 8.5C9.75 6.41182 10.8627 4.5828 12.531 3.57467L11.7553 2.29085C9.65609 3.5593 8.25 5.86509 8.25 8.5H9.75ZM12 2.75C11.9115 2.75 11.8077 2.71008 11.7324 2.63168C11.6686 2.56527 11.6538 2.50244 11.6503 2.47703C11.6461 2.44587 11.6482 2.35557 11.7553 2.29085L12.531 3.57467C13.0342 3.27065 13.196 2.71398 13.1368 2.27627C13.0754 1.82126 12.7166 1.25 12 1.25V2.75ZM21.7092 12.2447C21.6444 12.3518 21.5541 12.3539 21.523 12.3497C21.4976 12.3462 21.4347 12.3314 21.3683 12.2676C21.2899 12.1923 21.25 12.0885 21.25 12H22.75C22.75 11.2834 22.1787 10.9246 21.7237 10.8632C21.286 10.804 20.7293 10.9658 20.4253 11.469L21.7092 12.2447Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </button>
                            )}
                            {themeConfig.theme === 'system' && (
                                <button
                                    className={`${
                                        themeConfig.theme === 'system' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'
                                    }`}
                                    onClick={() => {
                                        dispatch(toggleTheme('light'));
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M3 9C3 6.17157 3 4.75736 3.87868 3.87868C4.75736 3 6.17157 3 9 3H15C17.8284 3 19.2426 3 20.1213 3.87868C21 4.75736 21 6.17157 21 9V14C21 15.8856 21 16.8284 20.4142 17.4142C19.8284 18 18.8856 18 17 18H7C5.11438 18 4.17157 18 3.58579 17.4142C3 16.8284 3 15.8856 3 14V9Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        <path opacity="0.5" d="M22 21H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M15 15H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="dropdown shrink-0">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="block p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                                button={<img className="w-5 h-5 object-cover rounded-full" src={flag ? `/assets/images/flags/${flag.toUpperCase()}.svg` : "/assets/images/flags/EN.svg"} alt="flag" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/assets/images/flags/EN.svg"; }} />}
                            >
                                <ul className="!px-2 text-dark dark:text-white-dark grid grid-cols-1 gap-2 font-semibold dark:text-white-light/90 w-[140px] rounded-lg">
                                    {themeConfig.languageList.map((item: any) => {
                                        return (
                                            <li key={item.code}>
                                                <button
                                                    type="button"
                                                    className={`flex w-full hover:text-primary rounded-lg ${i18next.language === item.code ? 'bg-primary/10 text-primary' : ''}`}
                                                    onClick={() => {
                                                        dispatch(toggleLocale(item.code));
                                                        setLocale(item.code);
                                                    }}
                                                >
                                                    <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                                    <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Dropdown>
                        </div>
                        <NotificationDropdown />
                        <div className="dropdown shrink-0 flex">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                button={
                                    <img
                                        className="w-9 h-9 rounded-full object-cover saturate-50 group-hover:saturate-100"
                                        src={user?.avatar_url ? user.avatar_url : '/assets/images/user-profile.svg'}
                                        alt="userProfile"
                                        onError={(e) => {
                                            e.currentTarget.src = '/assets/images/user-profile.svg';
                                        }}
                                    />
                                }
                            >
                                <ul className="text-dark dark:text-white-dark !py-0 w-[280px] font-semibold dark:text-white-light/90 rounded-lg">
                                    <li onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center px-4 py-4">
                                            <img
                                                className="rounded-md w-10 h-10 object-cover"
                                                src={user?.avatar_url ? user.avatar_url : '/assets/images/user-profile.svg'}
                                                alt="userProfile"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/assets/images/user-profile.svg';
                                                }}
                                            />
                                            <div className="ltr:pl-4 rtl:pr-4 truncate">
                                                <h4 className="text-base text-primary">{user?.name || 'User'}</h4>
                                                <p className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white text-xs">{user?.email || ''}</p>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <Link to="/users/profile" className="dark:hover:text-white">
                                            <svg className="ltr:mr-2 rtl:ml-2 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
                                                <path
                                                    opacity="0.5"
                                                    d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                            {t('profile')}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/users/preferences" className="dark:hover:text-white">
                                            <svg className="ltr:mr-2 rtl:ml-2 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M9.5 14C11.1569 14 12.5 15.3431 12.5 17C12.5 18.6568 11.1569 20 9.5 20C7.84315 20 6.5 18.6568 6.5 17C6.5 15.3431 7.84315 14 9.5 14Z"
                                                    stroke="currentColor"
                                                    stroke-width="1.5"
                                                ></path>
                                                <path
                                                    d="M14.5 3.99998C12.8431 3.99998 11.5 5.34312 11.5 6.99998C11.5 8.65683 12.8431 9.99998 14.5 9.99998C16.1569 9.99998 17.5 8.65683 17.5 6.99998C17.5 5.34312 16.1569 3.99998 14.5 3.99998Z"
                                                    stroke="currentColor"
                                                    stroke-width="1.5"
                                                ></path>
                                                <path opacity="0.5" d="M13 17L22 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                                                <path opacity="0.5" d="M11 7L2 6.9585" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                                                <path opacity="0.5" d="M2 17L6 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                                                <path opacity="0.5" d="M22 7L18 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                                            </svg>
                                            {t('preferences')}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/auth/lockscreen" className="dark:hover:text-white">
                                            <svg className="ltr:mr-2 rtl:ml-2 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M2 16C2 13.1716 2 11.7574 2.87868 10.8787C3.75736 10 5.17157 10 8 10H16C18.8284 10 20.2426 10 21.1213 10.8787C22 11.7574 22 13.1716 22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H8C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16Z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                                <path opacity="0.5" d="M6 10V8C6 4.68629 8.68629 2 12 2C15.3137 2 18 4.68629 18 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                <g opacity="0.5">
                                                    <path d="M9 16C9 16.5523 8.55228 17 8 17C7.44772 17 7 16.5523 7 16C7 15.4477 7.44772 15 8 15C8.55228 15 9 15.4477 9 16Z" fill="currentColor" />
                                                    <path
                                                        d="M13 16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16C11 15.4477 11.4477 15 12 15C12.5523 15 13 15.4477 13 16Z"
                                                        fill="currentColor"
                                                    />
                                                    <path
                                                        d="M17 16C17 16.5523 16.5523 17 16 17C15.4477 17 15 16.5523 15 16C15 15.4477 15.4477 15 16 15C16.5523 15 17 15.4477 17 16Z"
                                                        fill="currentColor"
                                                    />
                                                </g>
                                            </svg>
                                            {t('lock_screen')}
                                        </Link>
                                    </li>
                                    <li className="border-t border-white-light dark:border-white-light/10">
                                        <Link to="/auth/login" className="text-danger !py-3 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <svg className="ltr:mr-2 rtl:ml-2 rotate-90 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        opacity="0.5"
                                                        d="M17 9.00195C19.175 9.01406 20.3529 9.11051 21.1213 9.8789C22 10.7576 22 12.1718 22 15.0002V16.0002C22 18.8286 22 20.2429 21.1213 21.1215C20.2426 22.0002 18.8284 22.0002 16 22.0002H8C5.17157 22.0002 3.75736 22.0002 2.87868 21.1215C2 20.2429 2 18.8286 2 16.0002L2 15.0002C2 12.1718 2 10.7576 2.87868 9.87889C3.64706 9.11051 4.82497 9.01406 7 9.00195"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                    />
                                                    <path d="M12 15L12 2M12 2L15 5.5M12 2L9 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                {t('sign_out')}
                                            </div>
                                            <div>
                                                {(user?.roles?.length ?? 0) > 0 && (
                                                    <span className="text-[10px] bg-primary/10  border border-primary/20 rounded text-primary px-1.5 py-0.5 ltr:ml-2 rtl:ml-2 align-middle uppercase tracking-wider font-bold">
                                                        {user?.roles?.[0]?.name}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* horizontal menu marker */}
                <PerfectScrollbar className="relative">
                    <ul className="horizontal-menu hidden py-1.5 font-semibold px-6 lg:gap-1.5 xl:gap-8 bg-white dark:bg-black text-black dark:text-white-dark flex-nowrap items-center overflow-x-auto no-scrollbar whitespace-nowrap">
                    {(hasPermission('view_sales') || hasPermission('view_finance') || hasPermission('view_crm') || hasPermission('view_attendance') || hasPermission('view_workshop') || hasPermission('view_inventory')) && (
                        <li className="menu nav-item relative">
                        <Dropdown
                            offset={[0, 0]}
                            placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                            btnClassName="nav-link group"
                            button={
                                <>
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                opacity="0.5"
                                                d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z"
                                                fill="currentColor"
                                            />
                                            <path
                                                d="M9 17.25C8.58579 17.25 8.25 17.5858 8.25 18C8.25 18.4142 8.58579 18.75 9 18.75H15C15.4142 18.75 15.75 18.4142 15.75 18C15.75 17.5858 15.4142 17.25 15 17.25H9Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('dashboard')}</span>
                                    </div>
                                    <div className="right_arrow pl-2">
                                        <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </>
                            }
                        >
                            <ul className="sub-menu !block">
                                {hasPermission('view_sales') && (
                                    <li>
                                        <NavLink to="/dashboard/super">{t('super_dashboard', 'Super Dashboard')}</NavLink>
                                    </li>
                                )}
                                {hasPermission('view_finance') && (
                                    <li>
                                        <NavLink to="/dashboard/finance">{t('finance', 'Finance')}</NavLink>
                                    </li>
                                )}
                                {hasPermission('view_sales') && (
                                    <li>
                                        <NavLink to="/dashboard/sales">{t('sales', 'Sales')}</NavLink>
                                    </li>
                                )}
                                {hasPermission('view_crm') && (
                                    <li>
                                        <NavLink to="/dashboard/leads">{t('lead_board', 'Lead Board')}</NavLink>
                                    </li>
                                )}
                                {hasPermission('view_attendance') && (
                                    <li>
                                        <NavLink to="/dashboard/attendance">{t('attendance')}</NavLink>
                                    </li>
                                )}
                                {hasPermission('view_workshop') && (
                                    <li>
                                        <NavLink to="/dashboard/tech-performance">{t('techperformance', 'Tech Performance')}</NavLink>
                                    </li>
                                )}
                                {hasPermission('view_inventory') && (
                                    <li>
                                        <NavLink to="/dashboard/inventory">{t('inventory', 'Inventory')}</NavLink>
                                    </li>
                                )}
                            </ul>
                        </Dropdown>
                    </li>
                    )}

                    {(hasPermission('view_hr') || hasPermission('manage_branches') || hasPermission('manage_departments') || hasPermission('manage_designations') || hasPermission('manage_document_types') || hasPermission('view_employees') || hasPermission('manage_branch_employees') || hasPermission('manage_award_types') || hasPermission('manage_awards') || hasPermission('manage_promotions') || hasPermission('manage_salary_movements') || hasPermission('manage_resignations') || hasPermission('manage_terminations') || hasPermission('manage_warnings') || hasPermission('manage_holidays') || hasPermission('view_hr_activity_log') || hasPermission('manage_company_feedbacks') || hasPermission('manage_announcements')) && (
                        <>
                            <li className="menu nav-item relative">
                                <Dropdown
                                    offset={[0, 0]}
                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                    btnClassName="nav-link group"
                                    button={
                                        <>
                                            <div className="flex items-center mr-2">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        opacity="0.5"
                                                        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
                                                        fill="currentColor"
                                                    />
                                                    <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="currentColor" />
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('hr_management')}</span>
                                            </div>
                                            <div className="right_arrow">
                                                <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </>
                                    }
                                >
                                    <ul className="sub-menu !block">
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
                                </Dropdown>
                            </li>
                        </>
                    )}

                    {(hasPermission('view_leave') || hasPermission('manage_leave_types') || hasPermission('manage_leave_policies') || hasPermission('manage_leave_allocations') || hasPermission('manage_leave_records') || hasPermission('view_leave_balances')) && (
                        <>
                            {/* Leave Management Module */}

                            <li className="menu nav-item relative">
                                <Dropdown
                                    offset={[0, 0]}
                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                    btnClassName="nav-link group"
                                    button={
                                        <>
                                            <div className="flex items-center mr-2">
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
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('leave_management', 'Leave')}</span>
                                            </div>
                                            <div className="right_arrow">
                                                <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </>
                                    }
                                >
                                    <ul className="sub-menu !block">
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
                                    </ul>
                                </Dropdown>
                            </li>
                        </>
                    )}

                    {(hasPermission('view_attendance') || hasPermission('manage_working_shifts') || hasPermission('manage_attendance_policies') || hasPermission('manage_attendance_records') || hasPermission('manage_employee_config') || hasPermission('manage_branch_qr')) && (
                        <li className="menu nav-item relative">
                            <Dropdown
                                offset={[0, 0]}
                                placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                btnClassName="nav-link group"
                                button={
                                    <>
                                        <div className="flex items-center mr-2">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    opacity="0.5"
                                                    d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                                    fill="currentColor"
                                                />
                                                <path
                                                    d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V12.4013L15.0313 14.0938C15.3613 14.3351 15.4317 14.8045 15.1904 15.1345C14.9491 15.4645 14.4797 15.5349 14.1497 15.2936L11.5592 13.3886C11.3616 13.2465 11.25 13.0217 11.25 12.7826V8C11.25 7.58579 11.5858 7.25 12 7.25Z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('attendance')}</span>
                                        </div>
                                        <div className="right_arrow">
                                            <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </>
                                }
                            >
                                <ul className="sub-menu !block">
                                    {hasPermission('manage_working_shifts') && (
                                        <li>
                                            <NavLink to="/attendance/working-shifts">{t('working_shifts')}</NavLink>
                                        </li>
                                    )}
                                    {hasPermission('manage_attendance_policies') && (
                                        <li>
                                            <NavLink to="/attendance/attendance-policies">{t('attendance_policies')}</NavLink>
                                        </li>
                                    )}
                                    {hasPermission('manage_attendance_policies') && (
                                        <li>
                                            <NavLink to="/attendance/reason-presets">{t('reason_presets','Reason Preset')}</NavLink>
                                        </li>
                                    )}
                                    {hasPermission('manage_attendance_records') && (
                                        <li>
                                            <NavLink to="/attendance/records">{t('attendance_records')}</NavLink>
                                        </li>
                                    )}
                                    {hasPermission('manage_employee_config') && (
                                        <li>
                                            <NavLink to="/attendance/employee-config">{t('employee_config', 'Employee Config')}</NavLink>
                                        </li>
                                    )}
                                    {hasPermission('manage_branch_qr') && (
                                        <li>
                                            <NavLink to="/attendance/branch-qr">{t('branch_qr_setup')}</NavLink>
                                        </li>
                                    )}
                                </ul>
                            </Dropdown>
                        </li>
                    )}

                    {(hasPermission('view_inventory') || hasPermission('view_branch_products') || hasPermission('view_branch_services') || hasPermission('view_serials')) && (
                        <>
                            {/* Inventory System Module */}

                            <li className="menu nav-item relative">
                                <Dropdown
                                    offset={[0, 0]}
                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                    btnClassName="nav-link group"
                                    button={
                                        <>
                                            <div className="flex items-center mr-2">
                                                <svg
                                                    className="group-hover:!text-primary shrink-0"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="20"
                                                    height="20"
                                                    color="currentColor"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        d="M8.42229 20.6181C10.1779 21.5395 11.0557 22.0001 12 22.0001V12.0001L2.63802 7.07275C2.62423 7.09491 2.6107 7.11727 2.5974 7.13986C2 8.15436 2 9.41678 2 11.9416V12.0586C2 14.5834 2 15.8459 2.5974 16.8604C3.19479 17.8749 4.27063 18.4395 6.42229 19.5686L8.42229 20.6181Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        opacity="0.7"
                                                        d="M17.5774 4.43152L15.5774 3.38197C13.8218 2.46066 12.944 2 11.9997 2C11.0554 2 10.1776 2.46066 8.42197 3.38197L6.42197 4.43152C4.31821 5.53552 3.24291 6.09982 2.6377 7.07264L11.9997 12L21.3617 7.07264C20.7564 6.09982 19.6811 5.53552 17.5774 4.43152Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        opacity="0.5"
                                                        d="M21.4026 7.13986C21.3893 7.11727 21.3758 7.09491 21.362 7.07275L12 12.0001V22.0001C12.9443 22.0001 13.8221 21.5395 15.5777 20.6181L17.5777 19.5686C19.7294 18.4395 20.8052 17.8749 21.4026 16.8604C22 15.8459 22 14.5834 22 12.0586V11.9416C22 9.41678 22 8.15436 21.4026 7.13986Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        d="M6.32334 4.48382C6.35617 4.46658 6.38926 4.44922 6.42261 4.43172L7.91614 3.64795L17.0169 8.65338L21.0406 6.64152C21.1783 6.79745 21.298 6.96175 21.4029 7.13994C21.5525 7.39396 21.6646 7.66352 21.7487 7.96455L17.7503 9.96373V13.0002C17.7503 13.4144 17.4145 13.7502 17.0003 13.7502C16.5861 13.7502 16.2503 13.4144 16.2503 13.0002V10.7137L12.7503 12.4637V21.9042C12.4934 21.9682 12.2492 22.0002 12.0003 22.0002C11.7515 22.0002 11.5072 21.9682 11.2503 21.9042V12.4637L2.25195 7.96455C2.33601 7.66352 2.44813 7.39396 2.59771 7.13994C2.70264 6.96175 2.82232 6.79745 2.96001 6.64152L12.0003 11.1617L15.3865 9.46857L6.32334 4.48382Z"
                                                        fill="currentColor"
                                                    ></path>
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('inventory', 'Inventory')}</span>
                                            </div>
                                            <div className="right_arrow">
                                                <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </>
                                    }
                                >
                                    <ul className="sub-menu !block">
                                        {hasPermission('view_branch_products') && (
                                            <li>
                                                <NavLink to="/inventory/branch-products">{t('branch_products', 'Branch Products')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('view_branch_services') && (
                                            <li>
                                                <NavLink to="/inventory/branch-services">{t('branch_services', 'Branch Services')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('view_serials') && (
                                            <li>
                                                <NavLink to="/inventory/serials">{t('roll_inventory', 'Roll Inventory')}</NavLink>
                                            </li>
                                        )}
                                    </ul>
                                </Dropdown>
                            </li>

                            {(hasPermission('view_procurement') || hasPermission('manage_suppliers') || hasPermission('manage_purchase_orders') || hasPermission('manage_purchase_receives')) && (
                                <li className="menu nav-item relative">
                                    <Dropdown
                                        offset={[0, 0]}
                                        placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                        btnClassName="nav-link group"
                                        button={
                                            <>
                                                <div className="flex items-center mr-2">
                                                    <svg
                                                        className="group-hover:!text-primary shrink-0"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="20"
                                                        height="20"
                                                        color="currentColor"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            opacity="0.5"
                                                            d="M21 15.9983V9.99826C21 7.16983 21 5.75562 20.1213 4.87694C19.3529 4.10856 18.175 4.01211 16 4H8C5.82497 4.01211 4.64706 4.10856 3.87868 4.87694C3 5.75562 3 7.16983 3 9.99826V15.9983C3 18.8267 3 20.2409 3.87868 21.1196C4.75736 21.9983 6.17157 21.9983 9 21.9983H15C17.8284 21.9983 19.2426 21.9983 20.1213 21.1196C21 20.2409 21 18.8267 21 15.9983Z"
                                                            fill="currentColor"
                                                        ></path>
                                                        <path
                                                            d="M8 3.5C8 2.67157 8.67157 2 9.5 2H14.5C15.3284 2 16 2.67157 16 3.5V4.5C16 5.32843 15.3284 6 14.5 6H9.5C8.67157 6 8 5.32843 8 4.5V3.5Z"
                                                            fill="currentColor"
                                                        ></path>
                                                        <path
                                                            fill-rule="evenodd"
                                                            clip-rule="evenodd"
                                                            d="M6.25 10.5C6.25 10.0858 6.58579 9.75 7 9.75H7.5C7.91421 9.75 8.25 10.0858 8.25 10.5C8.25 10.9142 7.91421 11.25 7.5 11.25H7C6.58579 11.25 6.25 10.9142 6.25 10.5ZM9.75 10.5C9.75 10.0858 10.0858 9.75 10.5 9.75H17C17.4142 9.75 17.75 10.0858 17.75 10.5C17.75 10.9142 17.4142 11.25 17 11.25H10.5C10.0858 11.25 9.75 10.0858 9.75 10.5ZM6.25 14C6.25 13.5858 6.58579 13.25 7 13.25H7.5C7.91421 13.25 8.25 13.5858 8.25 14C8.25 14.4142 7.91421 14.75 7.5 14.75H7C6.58579 14.75 6.25 14.4142 6.25 14ZM9.75 14C9.75 13.5858 10.0858 13.25 10.5 13.25H17C17.4142 13.25 17.75 13.5858 17.75 14C17.75 14.4142 17.4142 14.75 17 14.75H10.5C10.0858 14.75 9.75 14.4142 9.75 14ZM6.25 17.5C6.25 17.0858 6.58579 16.75 7 16.75H7.5C7.91421 16.75 8.25 17.0858 8.25 17.5C8.25 17.9142 7.91421 18.25 7.5 18.25H7C6.58579 18.25 6.25 17.9142 6.25 17.5ZM9.75 17.5C9.75 17.0858 10.0858 16.75 10.5 16.75H17C17.4142 16.75 17.75 17.0858 17.75 17.5C17.75 17.9142 17.4142 18.25 17 18.25H10.5C10.0858 18.25 9.75 17.9142 9.75 17.5Z"
                                                            fill="currentColor"
                                                        ></path>
                                                    </svg>
                                                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('procurement', 'Procurement')}</span>
                                                </div>
                                                <div className="right_arrow">
                                                    <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </>
                                        }
                                    >
                                        <ul className="sub-menu !block">
                                            {hasPermission('manage_suppliers') && (
                                                <li>
                                                    <NavLink to="/procurement/suppliers">{t('suppliers', 'Suppliers')}</NavLink>
                                                </li>
                                            )}
                                            {hasPermission('manage_purchase_orders') && (
                                                <li>
                                                    <NavLink to="/procurement/purchase-orders">{t('purchase_orders', 'Purchase Orders')}</NavLink>
                                                </li>
                                            )}
                                            {hasPermission('manage_purchase_receives') && (
                                                <li>
                                                    <NavLink to="/procurement/purchase-receives">{t('goods_received', 'Goods Received')}</NavLink>
                                                </li>
                                            )}
                                        </ul>
                                    </Dropdown>
                                </li>
                            )}
                        </>
                    )}

                    {(hasPermission('view_stock') || hasPermission('view_stock_balance') || hasPermission('view_stock_ledger') || hasPermission('view_stock_movements') || hasPermission('view_serial_movements') || hasPermission('view_off_cut_serials') || hasPermission('manage_stock_adjustments') || hasPermission('manage_stock_transfers')) && (
                        <>
                            {/* Stock Balance Module */}

                            <li className="menu nav-item relative">
                                <Dropdown
                                    offset={[0, 0]}
                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                    btnClassName="nav-link group"
                                    button={
                                        <>
                                            <div className="flex items-center mr-2">
                                                <svg
                                                    className="group-hover:!text-primary shrink-0"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="20"
                                                    height="20"
                                                    color="currentColor"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        fill-rule="evenodd"
                                                        clip-rule="evenodd"
                                                        d="M10.0069 3.77169L4.00691 9.10502C3.36644 9.67432 3 10.4903 3 11.3472V21.2501H2C1.58579 21.2501 1.25 21.5858 1.25 22.0001C1.25 22.4143 1.58579 22.7501 2 22.7501H22C22.4142 22.7501 22.75 22.4143 22.75 22.0001C22.75 21.5858 22.4142 21.2501 22 21.2501H21V11.3472C21 10.4903 20.6336 9.67432 19.9931 9.10502L13.9931 3.77169C12.8564 2.76133 11.1436 2.76133 10.0069 3.77169ZM10 8.25005C9.58579 8.25005 9.25 8.58584 9.25 9.00005C9.25 9.41426 9.58579 9.75005 10 9.75005H14C14.4142 9.75005 14.75 9.41426 14.75 9.00005C14.75 8.58584 14.4142 8.25005 14 8.25005H10ZM14.052 11.25C14.9505 11.25 15.6997 11.25 16.2945 11.33C16.9223 11.4144 17.4891 11.6 17.9445 12.0555C18.4 12.511 18.5857 13.0778 18.6701 13.7056C18.7501 14.3004 18.75 15.0496 18.75 15.9481L18.75 21.2501H17.25H6.75H5.25L5.25 15.9481C5.24997 15.0496 5.24994 14.3004 5.32991 13.7056C5.41432 13.0778 5.59999 12.511 6.05546 12.0555C6.51093 11.6 7.07773 11.4144 7.70552 11.33C8.3003 11.25 9.04952 11.25 9.948 11.25H14.052Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        opacity="0.5"
                                                        d="M14.052 11.25H9.948H9.94797C9.04952 11.25 8.30029 11.2499 7.70552 11.3299C7.07773 11.4143 6.51093 11.6 6.05546 12.0555C5.59999 12.5109 5.41432 13.0777 5.32991 13.7055C5.24995 14.3003 5.24997 15.0495 5.25 15.9479V15.9479L5.25 21.25H18.75L18.75 15.948C18.75 15.0496 18.7501 14.3003 18.6701 13.7055C18.5857 13.0777 18.4 12.5109 17.9445 12.0555C17.4891 11.6 16.9223 11.4143 16.2945 11.3299C15.6997 11.2499 14.9505 11.25 14.052 11.25H14.052Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        d="M9 14.75C8.58579 14.75 8.25 15.0858 8.25 15.5C8.25 15.9142 8.58579 16.25 9 16.25H15C15.4142 16.25 15.75 15.9142 15.75 15.5C15.75 15.0858 15.4142 14.75 15 14.75H9Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        d="M9 17.75C8.58579 17.75 8.25 18.0858 8.25 18.5C8.25 18.9142 8.58579 19.25 9 19.25H15C15.4142 19.25 15.75 18.9142 15.75 18.5C15.75 18.0858 15.4142 17.75 15 17.75H9Z"
                                                        fill="currentColor"
                                                    ></path>
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('stock', 'Stock')}</span>
                                            </div>
                                            <div className="right_arrow">
                                                <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </>
                                    }
                                >
                                    <ul className="sub-menu !block">
                                        {hasPermission('view_stock_balance') && (
                                            <li>
                                                <NavLink to="/stock/stock-balance">{t('overall_reporting', 'Overall Reporting')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('view_stock_ledger') && (
                                            <li>
                                                <NavLink to="/stock/stocks">{t('stock_tracking', 'Stock Ledger')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('view_stock_movements') && (
                                            <li>
                                                <NavLink to="/stock/stock-movements">{t('stock_movements', 'Stock Movements')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('view_serial_movements') && (
                                            <li>
                                                <NavLink to="/stock/serial-movements">{t('serial_movements', 'Serial Movements')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('view_off_cut_serials') && (
                                            <li>
                                                <NavLink to="/stock/off-cut-serials">{t('off_cut_serials', 'Off-Cut Serials')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('manage_stock_adjustments') && (
                                            <li>
                                                <NavLink to="/stock/adjustments">{t('stock_adjustments', 'Stock Adjustments')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('manage_stock_transfers') && (
                                            <li>
                                                <NavLink to="/stock/transfers">{t('stock_transfers', 'Stock Transfers')}</NavLink>
                                            </li>
                                        )}
                                    </ul>
                                </Dropdown>
                            </li>
                        </>
                    )}

                    {(hasPermission('view_sales') || hasPermission('access_pos') || hasPermission('view_sales_orders') || hasPermission('view_sales_invoices') || hasPermission('view_quotations')) && (
                        <>
                            {hasPermission('access_pos') && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/sales/create" className="nav-link">
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    opacity="0.5"
                                                    d="M10 2C9.0335 2 8.25 2.7835 8.25 3.75C8.25 4.7165 9.0335 5.5 10 5.5H14C14.9665 5.5 15.75 4.7165 15.75 3.75C15.75 2.7835 14.9665 2 14 2H10Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    opacity="0.5"
                                                    d="M3.86327 16.2052C3.00532 12.7734 2.57635 11.0575 3.47718 9.90376C4.37801 8.75 6.14672 8.75 9.68413 8.75H14.3148C17.8522 8.75 19.6209 8.75 20.5218 9.90376C21.4226 11.0575 20.9936 12.7734 20.1357 16.2052C19.59 18.3879 19.3172 19.4792 18.5034 20.1146C17.6896 20.75 16.5647 20.75 14.3148 20.75H9.68413C7.43427 20.75 6.30935 20.75 5.49556 20.1146C4.68178 19.4792 4.40894 18.3879 3.86327 16.2052Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M8.75 12.75C8.75 12.3358 8.41421 12 8 12C7.58579 12 7.25 12.3358 7.25 12.75V16.75C7.25 17.1642 7.58579 17.5 8 17.5C8.41421 17.5 8.75 17.1642 8.75 16.75V12.75Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M16 12C16.4142 12 16.75 12.3358 16.75 12.75V16.75C16.75 17.1642 16.4142 17.5 16 17.5C15.5858 17.5 15.25 17.1642 15.25 16.75V12.75C15.25 12.3358 15.5858 12 16 12Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M12.75 12.75C12.75 12.3358 12.4142 12 12 12C11.5858 12 11.25 12.3358 11.25 12.75V16.75C11.25 17.1642 11.5858 17.5 12 17.5C12.4142 17.5 12.75 17.1642 12.75 16.75V12.75Z"
                                                    fill="currentColor"
                                                ></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('create_sale_pos', 'POS')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            )}
                            {hasPermission('view_sales_orders') && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/sales/orders" className="nav-link">
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    opacity="0.5"
                                                    d="M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z"
                                                    fill="currentColor"
                                                />
                                                <path
                                                    fillRule="evenodd"
                                                    clipRule="evenodd"
                                                    d="M7.25 12C7.25 11.5858 7.58579 11.25 8 11.25H16C16.4142 11.25 16.75 11.5858 16.75 12C16.75 12.4142 16.4142 12.75 16 12.75H8C7.58579 12.75 7.25 12.4142 7.25 12Z"
                                                    fill="currentColor"
                                                />
                                                <path
                                                    fillRule="evenodd"
                                                    clipRule="evenodd"
                                                    d="M7.25 8C7.25 7.58579 7.58579 7.25 8 7.25H16C16.4142 7.25 16.75 7.58579 16.75 8C16.75 8.41421 16.4142 8.75 16 8.75H8C7.58579 8.75 7.25 8.41421 7.25 8Z"
                                                    fill="currentColor"
                                                />
                                                <path
                                                    fillRule="evenodd"
                                                    clipRule="evenodd"
                                                    d="M7.25 16C7.25 15.5858 7.58579 15.25 8 15.25H13C13.4142 15.25 13.75 15.5858 13.75 16C13.75 16.4142 13.4142 16.75 13 16.75H8C7.58579 16.75 7.25 16.4142 7.25 16Z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('sale_order', 'Sale Records')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            )}
                            {hasPermission('view_sales_invoices') && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/sales/invoices" className="nav-link">
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    opacity="0.5"
                                                    d="M7.24502 2H16.755C17.9139 2 18.4933 2 18.9606 2.16261C19.8468 2.47096 20.5425 3.18719 20.842 4.09946C21 4.58055 21 5.17705 21 6.37006V20.3742C21 21.2324 20.015 21.6878 19.3919 21.1176C19.0258 20.7826 18.4742 20.7826 18.1081 21.1176L17.625 21.5597C16.9834 22.1468 16.0166 22.1468 15.375 21.5597C14.7334 20.9726 13.7666 20.9726 13.125 21.5597C12.4834 22.1468 11.5166 22.1468 10.875 21.5597C10.2334 20.9726 9.26659 20.9726 8.625 21.5597C7.98341 22.1468 7.01659 22.1468 6.375 21.5597L5.8919 21.1176C5.52583 20.7826 4.97417 20.7826 4.6081 21.1176C3.985 21.6878 3 21.2324 3 20.3742V6.37006C3 5.17705 3 4.58055 3.15795 4.09946C3.45748 3.18719 4.15322 2.47096 5.03939 2.16261C5.50671 2 6.08614 2 7.24502 2Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M7 6.75C6.58579 6.75 6.25 7.08579 6.25 7.5C6.25 7.91421 6.58579 8.25 7 8.25H7.5C7.91421 8.25 8.25 7.91421 8.25 7.5C8.25 7.08579 7.91421 6.75 7.5 6.75H7Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M10.5 6.75C10.0858 6.75 9.75 7.08579 9.75 7.5C9.75 7.91421 10.0858 8.25 10.5 8.25H17C17.4142 8.25 17.75 7.91421 17.75 7.5C17.75 7.08579 17.4142 6.75 17 6.75H10.5Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M7 10.25C6.58579 10.25 6.25 10.5858 6.25 11C6.25 11.4142 6.58579 11.75 7 11.75H7.5C7.91421 11.75 8.25 11.4142 8.25 11C8.25 10.5858 7.91421 10.25 7.5 10.25H7Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M10.5 10.25C10.0858 10.25 9.75 10.5858 9.75 11C9.75 11.4142 10.0858 11.75 10.5 11.75H17C17.4142 11.75 17.75 11.4142 17.75 11C17.75 10.5858 17.4142 10.25 17 10.25H10.5Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M7 13.75C6.58579 13.75 6.25 14.0858 6.25 14.5C6.25 14.9142 6.58579 15.25 7 15.25H7.5C7.91421 15.25 8.25 14.9142 8.25 14.5C8.25 14.0858 7.91421 13.75 7.5 13.75H7Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M10.5 13.75C10.0858 13.75 9.75 14.0858 9.75 14.5C9.75 14.9142 10.0858 15.25 10.5 15.25H17C17.4142 15.25 17.75 14.9142 17.75 14.5C17.75 14.0858 17.4142 13.75 17 13.75H10.5Z"
                                                    fill="currentColor"
                                                ></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('invoices', 'Invoices')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            )}
                            {hasPermission('view_quotations') && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/sales/quotation" className="nav-link">
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    opacity="0.5"
                                                    d="M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M16.5189 16.5013C16.6939 16.3648 16.8526 16.2061 17.1701 15.8886L21.1275 11.9312C21.2231 11.8356 21.1793 11.6708 21.0515 11.6264C20.5844 11.4644 19.9767 11.1601 19.4083 10.5917C18.8399 10.0233 18.5356 9.41561 18.3736 8.94849C18.3292 8.82066 18.1644 8.77687 18.0688 8.87254L14.1114 12.8299C13.7939 13.1474 13.6352 13.3061 13.4987 13.4811C13.3377 13.6876 13.1996 13.9109 13.087 14.1473C12.9915 14.3476 12.9205 14.5606 12.7786 14.9865L12.5951 15.5368L12.3034 16.4118L12.0299 17.2323C11.9601 17.4419 12.0146 17.6729 12.1708 17.8292C12.3271 17.9854 12.5581 18.0399 12.7677 17.9701L13.5882 17.6966L14.4632 17.4049L15.0135 17.2214L15.0136 17.2214C15.4394 17.0795 15.6524 17.0085 15.8527 16.913C16.0891 16.8004 16.3124 16.6623 16.5189 16.5013Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M22.3665 10.6922C23.2112 9.84754 23.2112 8.47812 22.3665 7.63348C21.5219 6.78884 20.1525 6.78884 19.3078 7.63348L19.1806 7.76071C19.0578 7.88348 19.0022 8.05496 19.0329 8.22586C19.0522 8.33336 19.0879 8.49053 19.153 8.67807C19.2831 9.05314 19.5288 9.54549 19.9917 10.0083C20.4545 10.4712 20.9469 10.7169 21.3219 10.847C21.5095 10.9121 21.6666 10.9478 21.7741 10.9671C21.945 10.9978 22.1165 10.9422 22.2393 10.8194L22.3665 10.6922Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    fill-rule="evenodd"
                                                    clip-rule="evenodd"
                                                    d="M7.25 9C7.25 8.58579 7.58579 8.25 8 8.25H14.5C14.9142 8.25 15.25 8.58579 15.25 9C15.25 9.41421 14.9142 9.75 14.5 9.75H8C7.58579 9.75 7.25 9.41421 7.25 9ZM7.25 13C7.25 12.5858 7.58579 12.25 8 12.25H11C11.4142 12.25 11.75 12.5858 11.75 13C11.75 13.4142 11.4142 13.75 11 13.75H8C7.58579 13.75 7.25 13.4142 7.25 13ZM7.25 17C7.25 16.5858 7.58579 16.25 8 16.25H9.5C9.91421 16.25 10.25 16.5858 10.25 17C10.25 17.4142 9.91421 17.75 9.5 17.75H8C7.58579 17.75 7.25 17.4142 7.25 17Z"
                                                    fill="currentColor"
                                                ></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('quotation', 'Quotation')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            )}
                        </>
                    )}

                    {(hasPermission('view_crm') || hasPermission('manage_leads') || hasPermission('manage_contacts') || hasPermission('view_customers') || hasPermission('manage_customer_vehicles') || hasPermission('view_service_bookings') || hasPermission('view_customer_feedback') || hasPermission('view_customer_ratings') || hasPermission('manage_tma_banners') || hasPermission('manage_tma_broadcast')) && (
                        <>
                            {hasPermission('manage_leads') && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/crm/leads/list" className="nav-link">
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    opacity="0.5"
                                                    d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M10.5431 7.51724C10.8288 7.2173 10.8172 6.74256 10.5172 6.4569C10.2173 6.17123 9.74256 6.18281 9.4569 6.48276L7.14286 8.9125L6.5431 8.28276C6.25744 7.98281 5.78271 7.97123 5.48276 8.2569C5.18281 8.54256 5.17123 9.01729 5.4569 9.31724L6.59976 10.5172C6.74131 10.6659 6.9376 10.75 7.14286 10.75C7.34812 10.75 7.5444 10.6659 7.68596 10.5172L10.5431 7.51724Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M13 8.25C12.5858 8.25 12.25 8.58579 12.25 9C12.25 9.41422 12.5858 9.75 13 9.75H18C18.4142 9.75 18.75 9.41422 18.75 9C18.75 8.58579 18.4142 8.25 18 8.25H13Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M10.5431 14.5172C10.8288 14.2173 10.8172 13.7426 10.5172 13.4569C10.2173 13.1712 9.74256 13.1828 9.4569 13.4828L7.14286 15.9125L6.5431 15.2828C6.25744 14.9828 5.78271 14.9712 5.48276 15.2569C5.18281 15.5426 5.17123 16.0173 5.4569 16.3172L6.59976 17.5172C6.74131 17.6659 6.9376 17.75 7.14286 17.75C7.34812 17.75 7.5444 17.6659 7.68596 17.5172L10.5431 14.5172Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M13 15.25C12.5858 15.25 12.25 15.5858 12.25 16C12.25 16.4142 12.5858 16.75 13 16.75H18C18.4142 16.75 18.75 16.4142 18.75 16C18.75 15.5858 18.4142 15.25 18 15.25H13Z"
                                                    fill="currentColor"
                                                ></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('lead_list', 'Lead List')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            )}
                            {hasPermission('manage_contacts') && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/crm/contacts" className="nav-link">
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    opacity="0.5"
                                                    d="M14 4H10C6.22876 4 4.34315 4 3.17157 5.17157C2 6.34315 2 8.22876 2 12C2 15.7712 2 17.6569 3.17157 18.8284C4.34315 20 6.22876 20 10 20H14C17.7712 20 19.6569 20 20.8284 18.8284C22 17.6569 22 15.7712 22 12C22 8.22876 22 6.34315 20.8284 5.17157C19.6569 4 17.7712 4 14 4Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M13.25 9C13.25 8.58579 13.5858 8.25 14 8.25H19C19.4142 8.25 19.75 8.58579 19.75 9C19.75 9.41421 19.4142 9.75 19 9.75H14C13.5858 9.75 13.25 9.41421 13.25 9Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M14.25 12C14.25 11.5858 14.5858 11.25 15 11.25H19C19.4142 11.25 19.75 11.5858 19.75 12C19.75 12.4142 19.4142 12.75 19 12.75H15C14.5858 12.75 14.25 12.4142 14.25 12Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M15.25 15C15.25 14.5858 15.5858 14.25 16 14.25H19C19.4142 14.25 19.75 14.5858 19.75 15C19.75 15.4142 19.4142 15.75 19 15.75H16C15.5858 15.75 15.25 15.4142 15.25 15Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path d="M9 11C10.1046 11 11 10.1046 11 9C11 7.89543 10.1046 7 9 7C7.89543 7 7 7.89543 7 9C7 10.1046 7.89543 11 9 11Z" fill="currentColor"></path>
                                                <path d="M9 17C13 17 13 16.1046 13 15C13 13.8954 11.2091 13 9 13C6.79086 13 5 13.8954 5 15C5 16.1046 5 17 9 17Z" fill="currentColor"></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('contacts', 'Contacts')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            )}
                            {hasPermission('view_customers') && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/crm/customers" className="nav-link">
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M16 6C16 8.20914 14.2091 10 12 10C9.79086 10 8 8.20914 8 6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6Z" fill="currentColor"></path>
                                                <path
                                                    fill-rule="evenodd"
                                                    clip-rule="evenodd"
                                                    d="M16.5 22C14.8501 22 14.0251 22 13.5126 21.4874C13 20.9749 13 20.1499 13 18.5C13 16.8501 13 16.0251 13.5126 15.5126C14.0251 15 14.8501 15 16.5 15C18.1499 15 18.9749 15 19.4874 15.5126C20 16.0251 20 16.8501 20 18.5C20 20.1499 20 20.9749 19.4874 21.4874C18.9749 22 18.1499 22 16.5 22ZM18.468 17.7458C18.6958 17.518 18.6958 17.1487 18.468 16.9209C18.2402 16.693 17.8709 16.693 17.6431 16.9209L15.7222 18.8417L15.3569 18.4764C15.1291 18.2486 14.7598 18.2486 14.532 18.4764C14.3042 18.7042 14.3042 19.0736 14.532 19.3014L15.3097 20.0791C15.5375 20.307 15.9069 20.307 16.1347 20.0791L18.468 17.7458Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    opacity="0.5"
                                                    d="M14.4774 21.9208C13.7513 21.9728 12.9296 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C14.8806 13 17.4056 13.8564 18.8142 15.1412C18.298 15 17.5737 15 16.5 15C14.8501 15 14.0251 15 13.5126 15.5126C13 16.0251 13 16.8501 13 18.5C13 20.1499 13 20.9749 13.5126 21.4874C13.7501 21.725 14.0547 21.8524 14.4774 21.9208Z"
                                                    fill="currentColor"
                                                ></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('customers', 'Customers')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            )}
                            {hasPermission('manage_customer_vehicles') && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/crm/customer-vehicles" className="nav-link">
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g opacity="0.5">
                                                    <path
                                                        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        fill-rule="evenodd"
                                                        clip-rule="evenodd"
                                                        d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
                                                        fill="currentColor"
                                                    ></path>
                                                </g>
                                                <path
                                                    d="M9.67217 17.5318L11.1967 14.8913C10.7001 14.7536 10.2553 14.4915 9.89804 14.1406L8.37377 16.7807C8.77077 17.0823 9.2065 17.3356 9.67217 17.5318Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M6.0464 12.7499H9.09446C9.0328 12.5102 9 12.259 9 12.0001C9 11.741 9.03283 11.4896 9.09456 11.2499H6.04644C6.01579 11.4956 6 11.746 6 12.0001C6 12.254 6.01577 12.5042 6.0464 12.7499Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M8.37388 7.21935L9.89814 9.85945C10.2555 9.50856 10.7003 9.24643 11.1968 9.10879L9.6723 6.46828C9.20662 6.66447 8.77089 6.91775 8.37388 7.21935Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M12.8031 9.10877L14.3276 6.46826C14.7933 6.66445 15.2291 6.91772 15.6261 7.21931L14.1018 9.85941C13.7445 9.50852 13.2997 9.2464 12.8031 9.10877Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M14.9055 12.7499C14.9672 12.5102 15 12.259 15 12.0001C15 11.741 14.9672 11.4896 14.9054 11.2499H17.9536C17.9842 11.4956 18 11.746 18 12.0001C18 12.254 17.9842 12.5042 17.9536 12.7499H14.9055Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M12.8034 14.8913C13.3 14.7536 13.7447 14.4914 14.102 14.1405L15.6263 16.7806C15.2293 17.0822 14.7936 17.3355 14.3279 17.5317L12.8034 14.8913Z"
                                                    fill="currentColor"
                                                ></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('customer_vehicles', 'Customer Vehicles')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            )}
                            {hasPermission('view_service_bookings') && (
                                <li className="menu nav-item relative">
                                    <NavLink to="/crm/tma/bookings" className="nav-link">
                                        <div className="flex items-center">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    opacity="0.5"
                                                    d="M21 15.9983V9.99826C21 7.16983 21 5.75562 20.1213 4.87694C19.3529 4.10856 18.175 4.01211 16 4H8C5.82497 4.01211 4.64706 4.10856 3.87868 4.87694C3 5.75562 3 7.16983 3 9.99826V15.9983C3 18.8267 3 20.2409 3.87868 21.1196C4.75736 21.9983 6.17157 21.9983 9 21.9983H15C17.8284 21.9983 19.2426 21.9983 20.1213 21.1196C21 20.2409 21 18.8267 21 15.9983Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    d="M8 3.5C8 2.67157 8.67157 2 9.5 2H14.5C15.3284 2 16 2.67157 16 3.5V4.5C16 5.32843 15.3284 6 14.5 6H9.5C8.67157 6 8 5.32843 8 4.5V3.5Z"
                                                    fill="currentColor"
                                                ></path>
                                                <path
                                                    fill-rule="evenodd"
                                                    clip-rule="evenodd"
                                                    d="M15.5483 10.4883C15.8309 10.7911 15.8146 11.2657 15.5117 11.5483L11.226 15.5483C10.9379 15.8172 10.4907 15.8172 10.2025 15.5483L8.48826 13.9483C8.18545 13.6657 8.16909 13.1911 8.45171 12.8883C8.73434 12.5855 9.20893 12.5691 9.51174 12.8517L10.7143 13.9741L14.4883 10.4517C14.7911 10.1691 15.2657 10.1855 15.5483 10.4883Z"
                                                    fill="currentColor"
                                                ></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('service_bookings', 'Service Bookings')}</span>
                                        </div>
                                    </NavLink>
                                </li>
                            )}
                            <li className="menu nav-item relative">
                                <Dropdown
                                    offset={[0, 0]}
                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                    btnClassName="nav-link group"
                                    button={
                                        <>
                                            <div className="flex items-center mr-2">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        opacity="0.5"
                                                        d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        d="M10.5431 7.51724C10.8288 7.2173 10.8172 6.74256 10.5172 6.4569C10.2173 6.17123 9.74256 6.18281 9.4569 6.48276L7.14286 8.9125L6.5431 8.28276C6.25744 7.98281 5.78271 7.97123 5.48276 8.2569C5.18281 8.54256 5.17123 9.01729 5.4569 9.31724L6.59976 10.5172C6.74131 10.6659 6.9376 10.75 7.14286 10.75C7.34812 10.75 7.5444 10.6659 7.68596 10.5172L10.5431 7.51724Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        d="M13 8.25C12.5858 8.25 12.25 8.58579 12.25 9C12.25 9.41422 12.5858 9.75 13 9.75H18C18.4142 9.75 18.75 9.41422 18.75 9C18.75 8.58579 18.4142 8.25 18 8.25H13Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        d="M10.5431 14.5172C10.8288 14.2173 10.8172 13.7426 10.5172 13.4569C10.2173 13.1712 9.74256 13.1828 9.4569 13.4828L7.14286 15.9125L6.5431 15.2828C6.25744 14.9828 5.78271 14.9712 5.48276 15.2569C5.18281 15.5426 5.17123 16.0173 5.4569 16.3172L6.59976 17.5172C6.74131 17.6659 6.9376 17.75 7.14286 17.75C7.34812 17.75 7.5444 17.6659 7.68596 17.5172L10.5431 14.5172Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        d="M13 15.25C12.5858 15.25 12.25 15.5858 12.25 16C12.25 16.4142 12.5858 16.75 13 16.75H18C18.4142 16.75 18.75 16.4142 18.75 16C18.75 15.5858 18.4142 15.25 18 15.25H13Z"
                                                        fill="currentColor"
                                                    ></path>
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('crm', 'CRM')}</span>
                                            </div>
                                            <div className="right_arrow">
                                                <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </>
                                    }
                                >
                                    <ul className="sub-menu !block">
                                        {hasPermission('manage_leads') && (
                                            <li>
                                                <NavLink to="/crm/leads/list">{t('lead_list', 'Lead List')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('manage_contacts') && (
                                            <li>
                                                <NavLink to="/crm/contacts">{t('contacts', 'Contacts')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('view_customers') && (
                                            <li>
                                                <NavLink to="/crm/customers">{t('customers', 'Customers')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('manage_customer_vehicles') && (
                                            <li>
                                                <NavLink to="/crm/customer-vehicles">{t('customer_vehicles', 'Customer Vehicles')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('view_service_bookings') && (
                                            <li>
                                                <NavLink to="/crm/tma/bookings">{t('service_bookings', 'Service Bookings')}</NavLink>
                                            </li>
                                        )}
                                        {(hasPermission('view_customer_feedback') || hasPermission('view_customer_ratings')) && (
                                            <li className="relative group">
                                                <Dropdown
                                                    offset={[0, 0]}
                                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                                    btnClassName="nav-link w-full flex items-center justify-between"
                                                    button={
                                                        <>
                                                            {t('feedback_rating', 'Feedback & Rating')}
                                                            <div className="ltr:ml-auto rtl:mr-auto">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </div>
                                                        </>
                                                    }
                                                >
                                                    <ul className="sub-menu !block">
                                                        {hasPermission('view_customer_feedback') && (
                                                            <li>
                                                                <NavLink to="/crm/customer-feedback">{t('customer_feedback', 'Customer Feedback')}</NavLink>
                                                            </li>
                                                        )}
                                                        {hasPermission('view_customer_ratings') && (
                                                            <li>
                                                                <NavLink to="/crm/customer-ratings">{t('customer_rating', 'Customer Rating')}</NavLink>
                                                            </li>
                                                        )}
                                                    </ul>
                                                </Dropdown>
                                            </li>
                                        )}
                                        {(hasPermission('manage_tma_banners') || hasPermission('manage_tma_broadcast')) && (
                                            <li className="relative group">
                                                <Dropdown
                                                    offset={[0, 0]}
                                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                                    btnClassName="nav-link w-full flex items-center justify-between"
                                                    button={
                                                        <>
                                                            {t('marketing', 'Marketing & Recall')}
                                                            <div className="ltr:ml-auto rtl:mr-auto">
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </div>
                                                        </>
                                                    }
                                                >
                                                    <ul className="sub-menu !block">
                                                        {hasPermission('manage_tma_banners') && (
                                                            <li>
                                                                <NavLink to="/crm/banners">{t('tma_banners')}</NavLink>
                                                            </li>
                                                        )}
                                                        {hasPermission('manage_tma_broadcast') && (
                                                            <li>
                                                                <NavLink to="/crm/tma/broadcast/new">{t('create_new')}</NavLink>
                                                            </li>
                                                        )}
                                                        {hasPermission('manage_tma_broadcast') && (
                                                            <li>
                                                                <NavLink to="/crm/tma/broadcast/history">{t('performance_stats','Performance Statistics')}</NavLink>
                                                            </li>
                                                        )}
                                                    </ul>
                                                </Dropdown>
                                            </li>
                                        )}
                                    </ul>
                                </Dropdown>
                            </li>
                        </>
                    )}

                    {(hasPermission('view_finance') || hasPermission('manage_payment_accounts') || hasPermission('manage_expenses') || hasPermission('manage_incomes') || hasPermission('view_transactions') || hasPermission('manage_finance_categories')) && (
                        <>
                            <li className="menu nav-item relative">
                                <Dropdown
                                    offset={[0, 0]}
                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                    btnClassName="nav-link group"
                                    button={
                                        <>
                                            <div className="flex items-center mr-2">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M4.8916 9.61431C4.8916 9.21193 5.21525 8.88574 5.61449 8.88574H9.46991C9.86916 8.88574 10.1928 9.21193 10.1928 9.61431C10.1928 10.0167 9.86916 10.3429 9.46991 10.3429H5.61449C5.21525 10.3429 4.8916 10.0167 4.8916 9.61431Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        fill-rule="evenodd"
                                                        clip-rule="evenodd"
                                                        d="M21.1884 10.0038C21.1262 9.99995 21.0584 9.99998 20.9881 10L20.9706 10H18.2149C15.9435 10 14 11.7361 14 14C14 16.2639 15.9435 18 18.2149 18H20.9706L20.9881 18C21.0584 18 21.1262 18 21.1884 17.9962C22.111 17.9397 22.927 17.2386 22.9956 16.2594C23.0001 16.1952 23 16.126 23 16.0619L23 16.0444V11.9556L23 11.9381C23 11.874 23.0001 11.8048 22.9956 11.7406C22.927 10.7614 22.111 10.0603 21.1884 10.0038ZM17.9706 15.0667C18.5554 15.0667 19.0294 14.5891 19.0294 14C19.0294 13.4109 18.5554 12.9333 17.9706 12.9333C17.3858 12.9333 16.9118 13.4109 16.9118 14C16.9118 14.5891 17.3858 15.0667 17.9706 15.0667Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        opacity="0.5"
                                                        d="M21.1394 10.0015C21.1394 8.82091 21.0965 7.55447 20.3418 6.64658C20.2689 6.55894 20.1914 6.47384 20.1088 6.39124C19.3604 5.64288 18.4114 5.31076 17.239 5.15314C16.0998 4.99997 14.6442 4.99999 12.8064 5H10.6936C8.85583 4.99999 7.40019 4.99997 6.26098 5.15314C5.08856 5.31076 4.13961 5.64288 3.39124 6.39124C2.64288 7.13961 2.31076 8.08856 2.15314 9.26098C1.99997 10.4002 1.99999 11.8558 2 13.6936V13.8064C1.99999 15.6442 1.99997 17.0998 2.15314 18.239C2.31076 19.4114 2.64288 20.3604 3.39124 21.1088C4.13961 21.8571 5.08856 22.1892 6.26098 22.3469C7.40018 22.5 8.8558 22.5 10.6935 22.5H12.8064C14.6442 22.5 16.0998 22.5 17.239 22.3469C18.4114 22.1892 19.3604 21.8571 20.1088 21.1088C20.3133 20.9042 20.487 20.6844 20.6346 20.4486C21.0851 19.7291 21.1394 18.8473 21.1394 17.9985C21.0912 18 21.0404 18 20.9882 18L18.2149 18C15.9435 18 14 16.2639 14 14C14 11.7361 15.9435 10 18.2149 10L20.9881 10C21.0403 9.99999 21.0912 9.99997 21.1394 10.0015Z"
                                                        fill="currentColor"
                                                    ></path>
                                                    <path
                                                        d="M10.1013 2.57211L7.99988 3.99253L6.2666 5.15237C7.40496 4.99997 8.8588 4.99999 10.6935 5H12.8063C14.6441 4.99998 16.0997 4.99997 17.2389 5.15314C17.4681 5.18394 17.6887 5.22142 17.9009 5.26737L15.9999 4L13.8874 2.57211C12.7588 1.8093 11.2299 1.8093 10.1013 2.57211Z"
                                                        fill="currentColor"
                                                    ></path>
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('finance', 'Finance')}</span>
                                            </div>
                                            <div className="right_arrow">
                                                <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </>
                                    }
                                >
                                    <ul className="sub-menu !block">
                                        {hasPermission('manage_payment_accounts') && (
                                            <li>
                                                <NavLink to="/finance/payment-accounts">{t('payment_accounts', 'Payment Accounts')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('manage_expenses') && (
                                            <li>
                                                <NavLink to="/finance/expenses">{t('expenses', 'Expenses')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('manage_incomes') && (
                                            <li>
                                                <NavLink to="/finance/incomes">{t('incomes', 'Incomes')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('view_transactions') && (
                                            <li>
                                                <NavLink to="/finance/transactions">{t('transactions', 'Transactions')}</NavLink>
                                            </li>
                                        )}
                                        {hasPermission('manage_finance_categories') && (
                                            <li>
                                                <NavLink to="/finance/categories">{t('categories', 'Categories')}</NavLink>
                                            </li>
                                        )}
                                    </ul>
                                </Dropdown>
                            </li>
                        </>
                    )}

                    {(hasPermission('view_workshop') || hasPermission('view_qc_reports') || hasPermission('view_damage_reports')) && (
                        <li className="menu nav-item relative">
                            <Dropdown
                                offset={[0, 0]}
                                placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                btnClassName="nav-link group"
                                button={
                                    <>
                                        <div className="flex items-center mr-2">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    fill-rule="evenodd"
                                                    clip-rule="evenodd"
                                                    d="M8.67239 7.54199H15.3276C18.7024 7.54199 20.3898 7.54199 21.3377 8.52882C22.2855 9.51565 22.0625 11.0403 21.6165 14.0895L21.1935 16.9811C20.8437 19.3723 20.6689 20.5679 19.7717 21.2839C18.8745 21.9999 17.5512 21.9999 14.9046 21.9999H9.09536C6.44881 21.9999 5.12553 21.9999 4.22834 21.2839C3.33115 20.5679 3.15626 19.3723 2.80648 16.9811L2.38351 14.0895C1.93748 11.0403 1.71447 9.51565 2.66232 8.52882C3.61017 7.54199 5.29758 7.54199 8.67239 7.54199ZM8 18.0001C8 17.5859 8.3731 17.2501 8.83333 17.2501H15.1667C15.6269 17.2501 16 17.5859 16 18.0001C16 18.4143 15.6269 18.7501 15.1667 18.7501H8.83333C8.3731 18.7501 8 18.4143 8 18.0001Z"
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
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('job_workshop', 'Work Shop')}</span>
                                        </div>
                                        <div className="right_arrow">
                                            <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </>
                                }
                            >
                                <ul className="sub-menu !block">
                                    {hasPermission('view_workshop') && (
                                        <li>
                                            <NavLink to="/services/job-cards">{t('job_cards', 'Job Cards')}</NavLink>
                                        </li>
                                    )}
                                    {hasPermission('view_qc_reports') && (
                                        <li>
                                            <NavLink to="/services/qc-reports">{t('qc_reports', 'QC Reports')}</NavLink>
                                        </li>
                                    )}
                                    {hasPermission('view_damage_reports') && (
                                        <li>
                                            <NavLink to="/services/damage-reports">{t('damage_reports', 'Damage Reports')}</NavLink>
                                        </li>
                                    )}
                                </ul>
                            </Dropdown>
                        </li>
                    )}

                    {hasPermission('access_media_library') && (
                        <>
                            <li className="menu nav-item relative">
                                <NavLink to="/apps/media-library" className="nav-link">
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                fill-rule="evenodd"
                                                clip-rule="evenodd"
                                                d="M8.67239 7.54199H15.3276C18.7024 7.54199 20.3898 7.54199 21.3377 8.52882C22.2855 9.51565 22.0625 11.0403 21.6165 14.0895L21.1935 16.9811C20.8437 19.3723 20.6689 20.5679 19.7717 21.2839C18.8745 21.9999 17.5512 21.9999 14.9046 21.9999H9.09536C6.44881 21.9999 5.12553 21.9999 4.22834 21.2839C3.33115 20.5679 3.15626 19.3723 2.80648 16.9811L2.38351 14.0895C1.93748 11.0403 1.71447 9.51565 2.66232 8.52882C3.61017 7.54199 5.29758 7.54199 8.67239 7.54199ZM8 18.0001C8 17.5859 8.3731 17.2501 8.83333 17.2501H15.1667C15.6269 17.2501 16 17.5859 16 18.0001C16 18.4143 15.6269 18.7501 15.1667 18.7501H8.83333C8.3731 18.7501 8 18.4143 8 18.0001Z"
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
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('media_library')}</span>
                                    </div>
                                </NavLink>
                            </li>
                        </>
                    )}
                    {/* Access Control */}
                    {(hasPermission('view_users') || hasPermission('view_roles')) && (
                        <li className="menu nav-item relative">
                            <Dropdown
                                offset={[0, 0]}
                                placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                btnClassName="nav-link group"
                                button={
                                    <>
                                        <div className="flex items-center mr-2">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path opacity="0.5" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" fill="currentColor"></path>
                                                <path fillRule="evenodd" clipRule="evenodd" d="M18 9.77606C18 11.8615 16.3025 13.5521 14.2084 13.5521C13.8264 13.5521 12.9564 13.4643 12.5331 13.113L12.004 13.64C11.693 13.9498 11.777 14.041 11.9153 14.1912C11.9731 14.2539 12.0403 14.3269 12.0922 14.4303C12.0922 14.4303 12.5331 15.045 12.0922 15.6597C11.8277 16.011 11.087 16.5027 10.2405 15.6597L10.0642 15.8353C10.0642 15.8353 10.5932 16.45 10.1523 17.0647C9.88782 17.416 9.18242 17.7673 8.56519 17.1526L7.94796 17.7673C7.52471 18.1888 7.00743 17.9429 6.8017 17.7673L6.27264 17.2404C5.77886 16.7486 6.0669 16.2159 6.27264 16.011L10.8578 11.4446C10.8578 11.4446 10.4169 10.742 10.4169 9.77606C10.4169 7.6906 12.1144 6 14.2084 6C16.3025 6 18 7.6906 18 9.77606ZM14.2084 11.0932C14.9388 11.0932 15.531 10.5035 15.531 9.77597C15.531 9.04848 14.9388 8.45874 14.2084 8.45874C13.4779 8.45874 12.8857 9.04848 12.8857 9.77597C12.8857 10.5035 13.4779 11.0932 14.2084 11.0932Z" fill="currentColor"></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('access_control', 'Access Control')}</span>
                                        </div>
                                        <div className="right_arrow">
                                            <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </>
                                }
                            >
                                <ul className="sub-menu">
                                    <li>
                                        <NavLink to="/access-control/users">{t('users', 'Users')}</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/access-control/roles">{t('roles_permissions', 'Roles & Permissions')}</NavLink>
                                    </li>
                                </ul>
                            </Dropdown>
                        </li>
                    )}


                    {(hasPermission('view_settings') || hasPermission('manage_setup_data') || hasPermission('manage_templates') || hasPermission('manage_branding') || hasPermission('manage_pwa_settings') || hasPermission('view_system_logs') || hasPermission('manage_telegram_settings') || hasPermission('manage_app_feedbacks')) && (
                        <li className="menu nav-item relative">
                            <Dropdown
                                offset={[0, 0]}
                                placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                btnClassName="nav-link group"
                                button={
                                    <>
                                        <div className="flex items-center mr-2">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="currentColor" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="currentColor" />
                                                <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="currentColor" />
                                                <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="currentColor" />
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('settings')}</span>
                                        </div>
                                        <div className="right_arrow">
                                            <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </>
                                }
                            >
                                <ul className="sub-menu">
                                    {(hasPermission('manage_setup_data') || hasPermission('manage_templates') || hasPermission('manage_branding') || hasPermission('manage_pwa_settings')) && (
                                        <li className="relative group/setup">
                                            <Dropdown
                                                offset={[0, 0]}
                                                placement={`${isRtl ? 'left-start' : 'right-start'}`}
                                                btnClassName="nav-link w-full flex items-center justify-between"
                                                button={
                                                    <>
                                                        {t('setup_data')}
                                                        <div className="ltr:ml-auto rtl:mr-auto">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isRtl ? 'rotate-180' : ''}`}>
                                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                    </>
                                                }
                                            >
                                                <ul className="sub-menu">
                                                    {hasPermission('manage_setup_data') && (
                                                        <li className="relative group/crm">
                                                            <Dropdown
                                                                offset={[0, 0]}
                                                                placement={`${isRtl ? 'left-start' : 'right-start'}`}
                                                                btnClassName="nav-link w-full flex items-center justify-between"
                                                                button={
                                                                    <>
                                                                        {t('crm_set_up', 'Set up CRM')}
                                                                        <div className="ltr:ml-auto rtl:mr-auto">
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isRtl ? 'rotate-180' : ''}`}>
                                                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                            </svg>
                                                                        </div>
                                                                    </>
                                                                }
                                                            >
                                                                <ul className="sub-menu">
                                                                    <li><NavLink to="/crm/customer-types">{t('customer_type')}</NavLink></li>
                                                                    <li><NavLink to="/crm/settings">{t('pipeline','Pipeline & Stage')}</NavLink></li>
                                                                    <li><NavLink to="/crm/tma/settings">{t('tma_setting','TMA settings')}</NavLink></li>
                                                                </ul>
                                                            </Dropdown>
                                                        </li>
                                                    )}
                                                    {(hasPermission('manage_sale_remarks') || hasPermission('manage_inventory_categories') || hasPermission('manage_uoms') || hasPermission('manage_tags') || hasPermission('manage_products') || hasPermission('manage_locations')) && (
                                                        <li className="relative group/sale">
                                                            <Dropdown
                                                                offset={[0, 0]}
                                                                placement={`${isRtl ? 'left-start' : 'right-start'}`}
                                                                btnClassName="nav-link w-full flex items-center justify-between"
                                                                button={
                                                                    <>
                                                                        {t('sale_set_up', 'Set up Sale')}
                                                                        <div className="ltr:ml-auto rtl:mr-auto">
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isRtl ? 'rotate-180' : ''}`}>
                                                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                            </svg>
                                                                        </div>
                                                                    </>
                                                                }
                                                            >
                                                                <ul className="sub-menu">
                                                                    {hasPermission('manage_sale_remarks') && (<li><NavLink to="/sales/remarks">{t('sale_remark','Sale Remarks')}</NavLink></li>)}
                                                                    {hasPermission('manage_inventory_categories') && (<li><NavLink to="/inventory/categories">{t('category','Category')}</NavLink></li>)}
                                                                    {hasPermission('manage_uoms') && (<li><NavLink to="/inventory/uoms">{t('uom','UOM')}</NavLink></li>)}
                                                                    {hasPermission('manage_tags') && (<li><NavLink to="/inventory/tags">{t('tag','Tag')}</NavLink></li>)}
                                                                    {hasPermission('manage_products') && (<li><NavLink to="/inventory/products">{t('product','Product')}</NavLink></li>)}
                                                                    {hasPermission('manage_products') && (<li><NavLink to="/service/list">{t('service_packages','Service Packages')}</NavLink></li>)}
                                                                    {hasPermission('manage_locations') && (<li><NavLink to="/inventory/locations">{t('location','Warehouse')}</NavLink></li>)}
                                                                </ul>
                                                            </Dropdown>
                                                        </li>
                                                    )}
                                                    {(hasPermission('manage_service_parts') || hasPermission('manage_vehicle_brands') || hasPermission('manage_vehicle_models') || hasPermission('manage_damage_types')) && (
                                                        <li className="relative group/workshop-setup">
                                                            <Dropdown
                                                                offset={[0, 0]}
                                                                placement={`${isRtl ? 'left-start' : 'right-start'}`}
                                                                btnClassName="nav-link w-full flex items-center justify-between"
                                                                button={
                                                                    <>
                                                                        {t('workshop_set_up', 'Set up Workshop')}
                                                                        <div className="ltr:ml-auto rtl:mr-auto">
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isRtl ? 'rotate-180' : ''}`}>
                                                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                            </svg>
                                                                        </div>
                                                                    </>
                                                                }
                                                            >
                                                                <ul className="sub-menu">
                                                                    {hasPermission('manage_service_parts') && (<li><NavLink to="/services/parts">{t('installation_parts_nav','Installation Parts')}</NavLink></li>)}
                                                                    {hasPermission('manage_vehicle_brands') && (<li><NavLink to="/services/vehicles/brands">{t('vehicle_brands','Vehicle Brands')}</NavLink></li>)}
                                                                    {hasPermission('manage_vehicle_models') && (<li><NavLink to="/services/vehicles/models">{t('vehicle_models','Vehicle Models')}</NavLink></li>)}
                                                                    {hasPermission('manage_damage_types') && (<li><NavLink to="/services/damage-types">{t('damage_types','Damage Types')}</NavLink></li>)}
                                                                </ul>
                                                            </Dropdown>
                                                        </li>
                                                    )}
                                                    {hasPermission('manage_setup_data') && (<li><NavLink to="/settings/document-numbers">{t('document_numbers')}</NavLink></li>)}
                                                    {hasPermission('manage_templates') && (<li><NavLink to="/settings/templates">{t('template_builder')}</NavLink></li>)}
                                                    {hasPermission('manage_templates') && (<li><NavLink to="/settings/document-types">{t('form_document_types')}</NavLink></li>)}
                                                    {hasPermission('manage_branding') && (<li><NavLink to="/settings/branding">{t('branding')}</NavLink></li>)}
                                                    {hasPermission('manage_setup_data') && (<li><NavLink to="/settings/exchange-rate">{t('exchange_rate')}</NavLink></li>)}
                                                </ul>
                                            </Dropdown>
                                        </li>
                                    )}
                                    {hasPermission('view_system_logs') && (<li><NavLink to="/settings/system-logs">{t('system_logs', 'System Logs')}</NavLink></li>)}
                                    {hasPermission('manage_telegram_settings') && (<li><NavLink to="/settings/telegram-settings">{t('telegram_settings')}</NavLink></li>)}
                                    {hasPermission('manage_pwa_settings') && (<li><NavLink to="/settings/pwa-settings">{t('pwa_settings', 'PWA settings')}</NavLink></li>)}
                                    {hasPermission('manage_app_feedbacks') && (<li><NavLink to="/settings/pwa-feedbacks">{t('app_feedback', 'App Feedbacks')}</NavLink></li>)}
                                </ul>
                            </Dropdown>
                        </li>
                    )}

                    {hasPermission('view_attendance_report') && (
                        <li className="menu nav-item relative">
                            <Dropdown
                                offset={[0, 0]}
                                placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                btnClassName="nav-link group"
                                button={
                                    <>
                                        <div className="flex items-center mr-2">
                                            <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M16.245 7.76015L21.4166 2.58855L21.414 2.58595C20.2268 1.39869 17.9776 2.14842 13.4792 3.64788L8.32987 5.36432C4.69923 6.57453 2.88392 7.17964 2.36806 8.06698C1.87731 8.91112 1.87731 9.95369 2.36806 10.7978C2.88392 11.6852 4.69923 12.2903 8.32987 13.5005C8.77981 13.6505 9.28601 13.5434 9.62294 13.2096L15.1286 7.75495C15.4383 7.44808 15.9382 7.45041 16.245 7.76015Z" fill="currentColor"></path>
                                                <path opacity="0.5" d="M18.6351 15.6695L20.3516 10.5201C21.85 6.02503 22.5997 3.77584 21.4161 2.58789L16.2445 7.75949C16.5514 8.06923 16.5491 8.56909 16.2393 8.87596L10.8226 14.2425C10.4512 14.6104 10.3337 15.1735 10.499 15.6695C11.7092 19.3001 12.3143 21.1154 13.2016 21.6313C14.0458 22.122 15.0883 22.122 15.9325 21.6313C16.8198 21.1154 17.4249 19.3001 18.6351 15.6695Z" fill="currentColor"></path>
                                            </svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('reports','Reports')}</span>
                                        </div>
                                        <div className="right_arrow">
                                            <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </>
                                }
                            >
                                <ul className="sub-menu">
                                    <li><NavLink to="/report/attendance">{t('attendance_report')}</NavLink></li>
                                </ul>
                            </Dropdown>
                        </li>
                    )}

                    <li className="menu nav-item relative">
                        <NavLink to="/support/documentation" className="nav-link">
                            <div className="flex items-center">
                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M4 4.69434V18.6943C4 20.3512 5.34315 21.6943 7 21.6943H17C18.6569 21.6943 20 20.3512 20 18.6943V8.69434C20 7.03748 18.6569 5.69434 17 5.69434H5C4.44772 5.69434 4 5.24662 4 4.69434ZM7.25 11.6943C7.25 11.2801 7.58579 10.9443 8 10.9443H16C16.4142 10.9443 16.75 11.2801 16.75 11.6943C16.75 12.1085 16.4142 12.4443 16 12.4443H8C7.58579 12.4443 7.25 12.1085 7.25 11.6943ZM7.25 15.1943C7.25 14.7801 7.58579 14.4443 8 14.4443H13.5C13.9142 14.4443 14.25 14.7801 14.25 15.1943C14.25 15.6085 13.9142 15.9443 13.5 15.9443H8C7.58579 15.9443 7.25 15.6085 7.25 15.1943Z" fill="currentColor" />
                                    <path opacity="0.5" d="M18 4.00038V5.86504C17.6872 5.75449 17.3506 5.69434 17 5.69434H5C4.44772 5.69434 4 5.24662 4 4.69434V4.62329C4 4.09027 4.39193 3.63837 4.91959 3.56299L15.7172 2.02048C16.922 1.84835 18 2.78328 18 4.00038Z" fill="currentColor" />
                                </svg>
                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('documentation')}</span>
                            </div>
                        </NavLink>
                    </li>
                </ul>
                </PerfectScrollbar>
            </div>
        </header>
    );
};

export default Header;
