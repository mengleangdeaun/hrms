import { PropsWithChildren, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { toggleSidebar } from '../../store/themeConfigSlice';
import Footer from './Footer';
import Header from './Header';
import Setting from './Setting';
import Sidebar from './Sidebar';
import Portals from '../../components/Portals';
import { Loader } from '../ui/Loader';

const DefaultLayout = ({ children }: PropsWithChildren) => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();

    const [showLoader, setShowLoader] = useState(true);
    const [showTopButton, setShowTopButton] = useState(false);

    const goToTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    const onScrollHandler = () => {
        if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
            setShowTopButton(true);
        } else {
            setShowTopButton(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', onScrollHandler);

        const screenLoader = document.getElementsByClassName('screen_loader');
        if (screenLoader?.length) {
            screenLoader[0].classList.add('animate__fadeOut');
            setTimeout(() => {
                setShowLoader(false);
            }, 200);
        } else {
            // Fallback: If loader element not found, hide it anyway after a short delay
            setTimeout(() => {
                setShowLoader(false);
            }, 500);
        }

        return () => {
            window.removeEventListener('onscroll', onScrollHandler);
        };
    }, []);

    return (
        <div className="relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:20px_20px]">
            {/* BEGIN MAIN CONTAINER */}
            {/* sidebar menu overlay */}
            <div className={`${(!themeConfig.sidebar && 'hidden') || ''} fixed inset-0 bg-[black]/60 z-50 lg:hidden`} onClick={() => dispatch(toggleSidebar())}></div>
            {/* screen loader */}
            {showLoader && (
                <Loader fullPage />
            )}
            <div className="fixed bottom-6 ltr:right-6 rtl:left-6 z-50">
                {showTopButton && (
                    <button type="button" className="btn btn-outline-primary rounded-full p-2 animate-pulse bg-[#fafafa] dark:bg-[#060818] dark:hover:bg-primary" onClick={goToTop}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18" />
                        </svg>
                    </button>
                )}
            </div>

            {/* BEGIN APP SETTING LAUNCHER */}
            <div className="no-print">
                <Setting />
            </div>
            {/* END APP SETTING LAUNCHER */}

            <div className={`${themeConfig.navbar} main-container text-black dark:text-white-dark min-h-screen`}>
                {/* BEGIN SIDEBAR */}
                <div className="no-print">
                    <Sidebar />
                </div>
                {/* END SIDEBAR */}

                <div className="main-content flex flex-col min-h-screen">
                    {/* BEGIN TOP NAVBAR */}
                    <div className={`no-print ${themeConfig.navbar === 'navbar-sticky' || themeConfig.navbar === 'navbar-floating' ? 'sticky top-0 z-[50] backdrop-blur-md transition-all duration-300' : ''}`}>
                        <Header />
                    </div>
                    {/* END TOP NAVBAR */}

                    {/* BEGIN CONTENT AREA */}
                    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[400px]"><Loader /></div>}>
                        <div className={`${themeConfig.animation} p-6 animate__animated print:p-0`}>{children}</div>
                    </Suspense>
                    {/* END CONTENT AREA */}

                    {/* BEGIN FOOTER */}
                    <div className="no-print">
                        <Footer />
                    </div>
                    {/* END FOOTER */}
                    <div className="no-print">
                        <Portals />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DefaultLayout;
