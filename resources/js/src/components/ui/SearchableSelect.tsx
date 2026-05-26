import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { Check, ChevronsUpDown, Search, Loader2, X } from 'lucide-react';
import { EmptyDataSmallIllustration } from '@/components/illustrations/EmptyData';
import HighlightText from './HighlightText';

interface Option {
    value: string | number;
    label: string;
    description?: string;
    color?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | null;
    onChange: (value: string | number) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
    footer?: React.ReactNode;
    leftIcon?: React.ReactNode;
}

const SKELETON_WIDTHS = [62, 48, 75, 55, 68];

function SkeletonRow({ width, delay }: { width: number; delay: number }) {
    return (
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-sm">
            {/* Color dot placeholder */}
            <div
                className="w-3 h-3 rounded-full shrink-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
                style={{ animationDelay: `${delay}ms` }}
            />
            <div
                className="h-3.5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
                style={{ width: `${width}%`, animationDelay: `${delay}ms` }}
            />
        </div>
    );
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No options found.',
    className = '',
    disabled = false,
    loading = false,
    footer,
    leftIcon,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options;
        const lowerQuery = searchQuery.toLowerCase();
        return options.filter((opt) => 
            opt.label.toLowerCase().includes(lowerQuery) || 
            (opt.description?.toLowerCase().includes(lowerQuery))
        );
    }, [options, searchQuery]);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={`
                        w-full justify-between h-10 px-3 font-normal border
                        transition-all duration-200
                        bg-white dark:bg-slate-900
                        hover:bg-slate-50 dark:hover:bg-slate-800
                        focus:outline-none focus:ring-2 focus:ring-primary/20
                        ${!selectedOption && !loading ? 'text-slate-400' : ''}
                        ${open
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-slate-200 dark:border-slate-800'
                        }
                        ${className}
                    `}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        {loading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
                                <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                            </>
                        ) : (
                            <>
                                {leftIcon && (
                                    <div className="shrink-0 flex items-center justify-center">
                                        {leftIcon}
                                    </div>
                                )}
                                {selectedOption?.color && (
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: selectedOption.color }}
                                    />
                                )}
                                <span className="truncate">
                                    {selectedOption ? selectedOption.label : placeholder}
                                </span>
                            </>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-full min-w-[var(--radix-popover-trigger-width)] p-0 shadow-lg border-gray-200 dark:border-gray-700 overflow-hidden"
                align="start"
            >
                <div className="flex flex-col">
                    {/* Search Header */}
                    <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-gray-100 dark:border-gray-700">
                        <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-300 placeholder:text-gray-400 min-w-0"
                            disabled={loading}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
                            >
                                <X className="h-2.5 w-2.5" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <PerfectScrollbar
                        className="max-h-[240px] w-full relative"
                        options={{ wheelPropagation: false }}
                    >
                        <div className="p-1.5">
                            {loading ? (
                                <div className="py-0.5">
                                    {SKELETON_WIDTHS.map((width, i) => (
                                        <SkeletonRow
                                            key={i}
                                            width={width}
                                            delay={i * 60}
                                        />
                                    ))}
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="py-6 flex flex-col items-center justify-center gap-2">
                                    <div className="w-14 opacity-60">
                                        <EmptyDataSmallIllustration />
                                    </div>
                                    <p className="text-xs text-gray-400">{emptyMessage}</p>
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className={`
                                            w-full relative flex items-center justify-between
                                            px-3 py-2 text-sm cursor-pointer rounded-md
                                            transition-all duration-200 text-left
                                            hover:bg-slate-100 dark:hover:bg-slate-800
                                            ${String(value) === String(option.value)
                                                ? 'bg-primary/10 text-primary dark:bg-primary/20 font-bold'
                                                : 'text-slate-700 dark:text-slate-300'
                                            }
                                        `}
                                    >
                                        <div className="flex flex-col min-w-0 pr-6">
                                            <div className="flex items-center gap-2">
                                                {option.color && (
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: option.color }}
                                                    />
                                                )}
                                                <span className="truncate font-medium">
                                                    <HighlightText text={option.label} highlight={searchQuery} />
                                                </span>
                                            </div>
                                            {option.description && (
                                                <span className="text-[10px] text-gray-400 truncate pl-0">
                                                    <HighlightText 
                                                        text={option.description} 
                                                        highlight={searchQuery} 
                                                        activeClassName="bg-yellow-200/50 dark:bg-yellow-800/30 text-yellow-900/80 dark:text-yellow-100/80 rounded-px"
                                                    />
                                                </span>
                                            )}
                                        </div>
                                        {String(value) === String(option.value) && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <Check className="h-4 w-4 text-primary" />
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </PerfectScrollbar>

                    {/* Footer */}
                    {!loading && filteredOptions.length > 0 && !footer && (
                        <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">
                            {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''}
                        </div>
                    )}

                    {!loading && footer && (
                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                            {footer}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}