import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import ShortcutsDoc from '../Documentation/components/ShortcutsDoc';

const ShortcutsPage = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('System Shortcut Keys'));
    }, [dispatch]);

    return (
        <div className="p-8 lg:p-12 animate-in fade-in duration-500 bg-background min-h-screen">
            <div className="max-w-6xl mx-auto">
                <ShortcutsDoc />
                
                <div className="mt-24 pt-8 border-t border-border flex justify-between items-center text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    <span>SCCG ERP SYSTEM</span>
                    <div className="flex gap-4">
                        <span>Shortcuts V1.0.0</span>
                        <div className='h-5 w-0.5 bg-border' />
                        <span>30th APRIL 2026</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShortcutsPage;
