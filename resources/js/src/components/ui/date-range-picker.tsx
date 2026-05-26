import * as React from "react";
import { format, startOfDay, endOfDay, isSameDay, getYear, setMonth, setYear } from "date-fns";
import { IconCalendar, IconX } from "@tabler/icons-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { getDayFnsLocale } from "@/lib/i18n-utils";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  presets?: DateRangePreset[];
  minDate?: Date;
  maxDate?: Date;
  fromYear?: number;
  toYear?: number;
  error?: string;
  showClear?: boolean;
}

export interface DateRangePreset {
  label: string;
  value: number | "today" | "yesterday" | "week" | "month" | "year";
  description?: string;
}

export function DateRangePicker({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  required = false,
  className,
  align = "start",
  presets,
  minDate,
  maxDate = new Date(new Date().getFullYear() + 10, 11, 31),
  fromYear,
  toYear,
  error,
  showClear = true,
}: DateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const locale = getDayFnsLocale(i18n.language);

  const MONTHS = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      format(new Date(2024, i, 1), "MMMM", { locale })
    );
  }, [locale]);

  const DEFAULT_PRESETS: DateRangePreset[] = React.useMemo(() => [
    {
      label: t("presets.today", "Today"),
      value: "today",
      description: t("presets.current_day", "Current day")
    },
    {
      label: t("presets.yesterday", "Yesterday"),
      value: "yesterday",
      description: t("presets.previous_day", "Previous day")
    },
    {
      label: t("presets.last_7_days", "Last 7 days"),
      value: -7,
      description: t("presets.week_to_date", "Week to date")
    },
    {
      label: t("presets.last_30_days", "Last 30 days"),
      value: -30,
      description: t("presets.month_to_date", "Month to date")
    },
    {
      label: t("presets.this_week", "This week"),
      value: "week",
      description: t("presets.monday_to_today", "Monday to today")
    },
    {
      label: t("presets.this_month", "This month"),
      value: "month",
      description: t("presets.month_to_date", "Month to date")
    },
    {
      label: t("presets.this_year", "This year"),
      value: "year",
      description: t("presets.year_to_date", "Year to date")
    },
  ], [t]);

  const activePresets = presets || DEFAULT_PRESETS;
  const displayPlaceholder = placeholder || t("common.select_date_range", "Select date range");

  const [isOpen, setIsOpen] = React.useState(false);
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(value);
  const [selectedMonth, setSelectedMonth] = React.useState<Date | undefined>(
    value?.from || new Date()
  );

  const currentYear = getYear(new Date());
  const minYear = fromYear ?? currentYear - 80;
  const maxYear = toYear ?? currentYear + 20;

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  // Only sync external value to internal state if it actually changed
  // This prevents losing the user's "in-progress" click (e.g. they picked Start but not End yet)
  // when the parent re-renders (e.g. due to search input).
  const lastPropsValue = React.useRef(value);
  React.useEffect(() => {
    const isDifferent = 
      value?.from?.getTime() !== lastPropsValue.current?.from?.getTime() ||
      value?.to?.getTime() !== lastPropsValue.current?.to?.getTime();

    if (isDifferent) {
      setInternalRange(value);
      if (value?.from) {
        setSelectedMonth(value.from);
      }
      lastPropsValue.current = value;
    }
  }, [value]);

  const handlePresetSelect = (preset: DateRangePreset) => {
    const today = new Date();
    let from: Date;
    let to: Date = endOfDay(today);

    switch (preset.value) {
      case "today":
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        from = startOfDay(yesterday);
        to = endOfDay(yesterday);
        break;
      case "week": {
        // Start of week (Monday)
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        from = startOfDay(new Date(today.setDate(diff)));
        break;
      }
      case "month":
        from = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
        break;
      case "year":
        from = startOfDay(new Date(today.getFullYear(), 0, 1));
        break;
      default:
        // Handle number values
        from = startOfDay(new Date(today.getTime() + preset.value * 24 * 60 * 60 * 1000));
        break;
    }

    const newRange = { from, to };
    setInternalRange(newRange);
    onChange(newRange);
    setIsOpen(false);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setInternalRange(range);
    // Don't close popover or call onChange yet - wait for Apply
  };

  const handleApply = () => {
    onChange(internalRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setInternalRange(value); // Reset to original value
    setIsOpen(false);
  };

  const handleClear = () => {
    const clearedRange = undefined;
    setInternalRange(clearedRange);
    onChange(clearedRange);
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "MMM dd, yyyy", { locale });
  };

  const formatRangeDisplay = () => {
    if (!internalRange?.from) return displayPlaceholder;

    const fromStr = formatDateDisplay(internalRange.from);
    const toStr = internalRange.to ? formatDateDisplay(internalRange.to) : "";

    if (!toStr) return fromStr;
    return `${fromStr} - ${toStr}`;
  };

  const calculateDayDifference = () => {
    if (!internalRange?.from || !internalRange?.to) return 0;
    const diffTime = Math.abs(internalRange.to.getTime() - internalRange.from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const dayCount = calculateDayDifference();
  const dayLabel = dayCount === 1 ? t("common.day", "day") : t("common.days", "days");

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {internalRange?.from && (
            <Badge variant="outline" className="text-xs">
              {dayCount} {dayLabel}
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-10 px-3 transition-all duration-200",
                "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-primary/20",
                !internalRange && "text-muted-foreground",
                error && "border-destructive"
              )}
              disabled={disabled}
            >
              <IconCalendar className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate text-xs">{formatRangeDisplay()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align={align}
            onInteractOutside={(e) => {
              // Don't close when interacting with the calendar
              const target = e.target as HTMLElement;
              if (target.closest('.rdp')) {
                e.preventDefault();
              }
            }}
          >
            <div className="flex flex-col sm:flex-row">
              {/* Left Side: Presets */}
              <div className="w-full sm:w-48 flex flex-col p-3 border-r bg-muted/30">
                <h4 className="text-sm font-medium mb-2">{t("common.quick_select", "Quick Select")}</h4>
                <div className="space-y-2 max-h-[340px] overflow-y-auto">
                  {activePresets.map((preset) => (
                    <Button
                      key={`${preset.label}-${preset.value}`}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs rounded rounded-l-none hover:border-l-2 hover:border-l-primary"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <div className="text-left truncate py-2">
                        <div className="font-medium truncate">{preset.label}</div>
                        {preset.description && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {preset.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Right Side: Calendar and Actions */}
              <div className="w-full sm:w-auto p-4">
                {/* Month + Year selectors */}
                <div className="flex items-center gap-2 mb pb-3 border-b border-border">
                  <Select
                    value={selectedMonth ? String(selectedMonth.getMonth()) : String(new Date().getMonth())}
                    onValueChange={(val) =>
                      setSelectedMonth((prev) => setMonth(prev || new Date(), Number(val)))
                    }
                  >
                    <SelectTrigger className="flex-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={m} value={String(i)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedMonth ? String(getYear(selectedMonth)) : String(getYear(new Date()))}
                    onValueChange={(val) =>
                      setSelectedMonth((prev) => setYear(prev || new Date(), Number(val)))
                    }
                  >
                    <SelectTrigger className="w-[110px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto w-[110px]">
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Calendar
                  mode="range"
                  selected={internalRange}
                  onSelect={handleCalendarSelect}
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  numberOfMonths={1}
                  disabled={(date: Date) => {
                    if (minDate && date < minDate) return true;
                    if (maxDate && date > maxDate) return true;
                    return false;
                  }}
                  className="rounded-md p-0 mt-3 mb-3"
                />

                {/* Selected Range Preview */}
                <div className="mt-3 p-2 bg-muted/30 rounded-md text-sm">
                  <div className="font-medium">{t("common.selected_range", "Selected Range")}:</div>
                  <div className="text-muted-foreground">
                    {internalRange?.from ? (
                      internalRange.to ? (
                        `${formatDateDisplay(internalRange.from)} - ${formatDateDisplay(internalRange.to)}`
                      ) : (
                        `${formatDateDisplay(internalRange.from)} (${t("common.select_end_date", "Select end date")})`
                      )
                    ) : (
                      t("common.select_start_date", "Select start date")
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                  <div>
                    {showClear && internalRange && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        disabled={disabled}
                      >
                        <IconX className="h-4 w-4 mr-1" />
                        {t("common.clear", "Clear")}
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      {t("common.cancel", "Cancel")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApply}
                      disabled={!internalRange?.from}
                    >
                      {t("common.apply", "Apply")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {showClear && value?.from && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={handleClear}
            disabled={disabled}
          >
            <IconX className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

export default DateRangePicker;