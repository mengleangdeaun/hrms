import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft, ArrowRight } from 'lucide-react';
import { menuItems } from './menuConfig';
import HighlightText from '../ui/HighlightText';

interface SearchModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}



const SearchModal: React.FC<SearchModalProps> = ({ isOpen, setIsOpen }) => {
    const { t, i18n } = useTranslation();
    const { t: ts } = useTranslation('smartsearch');
    const { hasPermission, isLoading, user } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Filter items based on query and permission
    const filteredItems = useMemo(() => {
        // While user is loading, don't show any items that require permission
        if (isLoading || !user) return [];

        return menuItems.filter((item) => {
            // 1. Check Query matches
            const lowerQuery = query.toLowerCase();
            const translatedTitle = t(item.title).toLowerCase();
            const translatedCategory = t(item.category).toLowerCase();

            const matchesQuery =
                item.title.toLowerCase().includes(lowerQuery) ||
                translatedTitle.includes(lowerQuery) ||
                item.category.toLowerCase().includes(lowerQuery) ||
                translatedCategory.includes(lowerQuery) ||
                item.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));

            if (!matchesQuery) return false;

            // 2. Check Permissions
            // If the item has a permission requirement, call hasPermission.
            // If it doesn't, it's a public/common menu item (like profile/preferences)
            if (item.permission) {
                return hasPermission(item.permission);
            }

            return true;
        });
    }, [query, t, hasPermission, isLoading, user]);

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            });
        }
    }, [selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(filteredItems.length, 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                handleNavigate(filteredItems[selectedIndex].path);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]" />
                <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
                    <Dialog.Content
                        className="w-full max-w-2xl p-2 rounded-3xl overflow-hidden outline-none"
                        onKeyDown={handleKeyDown}
                    >
                                    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 ring-[10px] ring-white/40 dark:ring-white/10 rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/5 pointer-events-auto">
                                        {/* Search Input Area */}
                                        <div className="relative flex items-center p-4 border-b border-gray-100 dark:border-white/10">
                                            <Search className="w-5 h-5 text-gray-400 mr-3" />
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                className="w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-lg text-gray-900 dark:text-white placeholder:text-gray-400"
                                                placeholder={ts('search_placeholder', 'Search menu items...')}
                                                value={query}
                                                onChange={(e) => {
                                                    setQuery(e.target.value);
                                                    setSelectedIndex(0);
                                                }}
                                            />
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        i18n.changeLanguage(i18n.language === 'en' ? 'kh' : 'en');
                                                    }}
                                                    className="flex w-14 items-center justify-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95 group/lang"
                                                    title={i18n.language === 'en' ? 'Switch to Khmer' : 'Switch to English'}
                                                >
                                                    <img
                                                        src={`/assets/images/flags/${i18n.language === 'en' ? 'KH' : 'EN'}.svg`}
                                                        className="w-4.5 h-4.5 rounded-full object-cover shadow-sm group-hover/lang:scale-110 transition-transform"
                                                        alt="flag"
                                                    />
                                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{i18n.language === 'en' ? 'KH' : 'EN'}</span>
                                                </button>
                                                <div className="flex items-center gap-1 px-2 py-1 ml-2 bg-gray-100 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 text-[10px] text-gray-400 font-mono">
                                                    <span className="text-[12px]">ESC</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Results Area */}
                                        <div ref={scrollContainerRef} className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                                            {filteredItems.length > 0 ? (
                                                <div className="space-y-1">
                                                    {filteredItems.map((item, index) => (
                                                        <button
                                                            key={item.path}
                                                            ref={(el) => (itemRefs.current[index] = el)}
                                                            onClick={() => handleNavigate(item.path)}
                                                            onMouseEnter={() => setSelectedIndex(index)}
                                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                                                                index === selectedIndex
                                                                    ? 'bg-primary/10 text-primary shadow-sm'
                                                                    : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-primary/20 text-primary' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}
                                                                >
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className="font-semibold text-sm">
                                                                        <HighlightText text={t(item.title)} highlight={query} activeClassName="text-primary font-bold bg-primary/20 px-0.5 rounded" />
                                                                    </div>
                                                                    <div className="text-[10px] opacity-60 uppercase tracking-wider font-bold">
                                                                        <HighlightText text={t(item.category)} highlight={query} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {item.shortcut && (
                                                                    <div
                                                                        className={`px-1.5 py-0.5 rounded border border-b-2 text-[10px] font-bold opacity-60 ${
                                                                            index === selectedIndex
                                                                                ? 'bg-primary/20 border-primary/20 text-primary'
                                                                                : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'
                                                                        }`}
                                                                    >
                                                                        {item.shortcut.replace('Alt', navigator.platform.indexOf('Mac') > -1 ? '⌥' : 'Alt')}
                                                                    </div>
                                                                )}
                                                                {index === selectedIndex && (
                                                                    <div className="flex items-center gap-1 text-[10px] opacity-60">
                                                                        <span>{ts('jump_to', 'Jump to')}</span>
                                                                        <CornerDownLeft className="w-3 h-3" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                                                    <Search className="w-12 h-12 mb-3 opacity-20" />
                                                    <p className="text-sm">{ts('no_results_found', 'No menu items found matching your search.')}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="p-3 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <div className="p-1 bg-white dark:bg-white/10 rounded shadow-sm">
                                                        <ArrowRight className="w-3 h-3 rotate-90" />
                                                    </div>
                                                    <div className="p-1 bg-white dark:bg-white/10 rounded shadow-sm">
                                                        <ArrowRight className="w-3 h-3 -rotate-90" />
                                                    </div>
                                                    <span>{ts('navigate', 'Navigate')}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="px-1.5 py-0.5 bg-white dark:bg-white/10 rounded shadow-sm font-mono uppercase">Enter</div>
                                                    <span>{ts('select', 'Select')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default SearchModal;
