import * as React from "react"
import { format } from "date-fns"
import { IconCalendar } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "../button"
import { Calendar } from "../calendar"
import BottomSheet from "../bottom-sheet"
import { useTranslation } from "react-i18next"
import { getDayFnsLocale } from "@/lib/i18n-utils"

import { Matcher } from "react-day-picker"

interface PwaDatePickerProps {
    value?: string | Date | null;
    onChange?: (date: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    fromDate?: Date;
    disabled?: Matcher | Matcher[];
}

export function PwaDatePicker({
    value,
    onChange,
    placeholder,
    className,
    label,
    fromDate,
    disabled
}: PwaDatePickerProps) {
    const { t, i18n } = useTranslation();
    const locale = getDayFnsLocale(i18n.language);
    const [isOpen, setIsOpen] = React.useState(false);

    // Initial date parsing
    const dateValue = React.useMemo(() => {
        if (!value) return undefined;
        const d = new Date(value);
        return isNaN(d.getTime()) ? undefined : d;
    }, [value]);

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const formatted = format(selectedDate, "yyyy-MM-dd");
            onChange?.(formatted);
            setIsOpen(false);
        }
    };

    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={cn(
                    "w-full h-12 bg-white dark:bg-gray-800 border-none rounded-lg px-4 flex items-center gap-3 text-sm font-black dark:text-white shadow-sm active:scale-[0.98] transition-transform text-left",
                    !dateValue && "text-gray-400",
                    className
                )}
            >
                <IconCalendar className="w-5 h-5 text-primary opacity-70" stroke={2} />
                <span className="truncate">
                    {dateValue ? format(dateValue, "EEE, MMM d, yyyy", { locale }) : placeholder || t("pick_date", "Pick a date")}
                </span>
            </button>

            <BottomSheet 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
                title={label || t("select_date", "Select Date")}
            >
                <div className="flex flex-col items-center py-2">
                    <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={handleSelect}
                        weekStartsOn={1}
                        fromDate={fromDate}
                        disabled={disabled}
                        className="rounded-2xl border-none p-0 scale-110 origin-top"
                        classNames={{
                            day: cn("w-10 h-10 p-0 font-bold text-sm flex items-center justify-center"),
                            weekday: cn("w-10 font-black text-[10px] uppercase text-gray-400 flex items-center justify-center"),
                        }}
                    />
                    
                    <div className="w-full pt-10 pb-2">
                        <Button 
                            variant="outline" 
                            className="w-full h-12 rounded-full font-black text-xs uppercase tracking-widest"
                            onClick={() => setIsOpen(false)}
                        >
                            {t("cancel", "Cancel")}
                        </Button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
}
