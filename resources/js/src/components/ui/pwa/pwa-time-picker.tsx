import * as React from "react";
import { IconClock, IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import BottomSheet from "../bottom-sheet";
import { useTranslation } from "react-i18next";

interface PwaTimePickerProps {
    value?: string;
    onChange?: (val: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

export function PwaTimePicker({ value, onChange, label, placeholder, className }: PwaTimePickerProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);

    // Parse initial time (default 08:00)
    const [hour, setHour] = React.useState(() => (value || "08:00").split(":")[0]);
    const [min, setMin] = React.useState(() => (value || "08:00").split(":")[1]);

    const hourRef = React.useRef(hour);
    const minRef = React.useRef(min);

    React.useEffect(() => { hourRef.current = hour; }, [hour]);
    React.useEffect(() => { minRef.current = min; }, [min]);

    // Refs for scrollable containers
    const hourScrollRef = React.useRef<HTMLDivElement>(null);
    const minuteScrollRef = React.useRef<HTMLDivElement>(null);

    // Throttle flags for scroll events
    const scrollTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProgrammaticScrollRef = React.useRef(false);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

    // --- Helper: Get center element of a scroll container ---
    const getElementAtCenter = (container: HTMLDivElement): HTMLElement | null => {
        const centerY = container.scrollTop + container.clientHeight / 2;
        const elements = container.querySelectorAll("button");
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const rect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const elCenter = rect.top + rect.height / 2 - containerRect.top + container.scrollTop;
            if (Math.abs(elCenter - centerY) < rect.height / 2) {
                return el;
            }
        }
        return null;
    };

    // --- Scroll to a specific hour/minute value ---
    const scrollToHour = React.useCallback((hourValue: string, behavior: ScrollBehavior = "smooth") => {
        const container = hourScrollRef.current;
        if (!container) return;
        const targetButton = container.querySelector(`button[data-value="${hourValue}"]`) as HTMLElement;
        if (!targetButton) return;

        if (behavior === "smooth") {
            isProgrammaticScrollRef.current = true;
        }

        const containerRect = container.getBoundingClientRect();
        const buttonRect = targetButton.getBoundingClientRect();
        const offset = buttonRect.top + buttonRect.height / 2 - containerRect.top;
        const scrollTo = container.scrollTop + offset - containerRect.height / 2;
        
        container.scrollTo({ top: scrollTo, behavior });

        if (behavior === "smooth") {
            setTimeout(() => {
                isProgrammaticScrollRef.current = false;
            }, 500); // Wait for smooth scroll to finish
        }
    }, []);

    const scrollToMinute = React.useCallback((minValue: string, behavior: ScrollBehavior = "smooth") => {
        const container = minuteScrollRef.current;
        if (!container) return;
        const targetButton = container.querySelector(`button[data-value="${minValue}"]`) as HTMLElement;
        if (!targetButton) return;

        if (behavior === "smooth") {
            isProgrammaticScrollRef.current = true;
        }

        const containerRect = container.getBoundingClientRect();
        const buttonRect = targetButton.getBoundingClientRect();
        const offset = buttonRect.top + buttonRect.height / 2 - containerRect.top;
        const scrollTo = container.scrollTop + offset - containerRect.height / 2;
        
        container.scrollTo({ top: scrollTo, behavior });

        if (behavior === "smooth") {
            setTimeout(() => {
                isProgrammaticScrollRef.current = false;
            }, 500); // Wait for smooth scroll to finish
        }
    }, []);

    // --- Update state based on current scroll position (called after scroll ends) ---
    const updateSelectionFromScroll = React.useCallback(() => {
        if (isProgrammaticScrollRef.current) return;

        if (hourScrollRef.current) {
            const centerHourEl = getElementAtCenter(hourScrollRef.current);
            if (centerHourEl && centerHourEl.getAttribute("data-value")) {
                const newHour = centerHourEl.getAttribute("data-value")!;
                if (hourRef.current !== newHour) {
                    setHour(newHour);
                    if (window.navigator.vibrate) window.navigator.vibrate(5);
                }
            }
        }
        if (minuteScrollRef.current) {
            const centerMinEl = getElementAtCenter(minuteScrollRef.current);
            if (centerMinEl && centerMinEl.getAttribute("data-value")) {
                const newMin = centerMinEl.getAttribute("data-value")!;
                if (minRef.current !== newMin) {
                    setMin(newMin);
                    if (window.navigator.vibrate) window.navigator.vibrate(5);
                }
            }
        }
    }, []);

    // Throttled scroll handler (updates only after scrolling stops)
    const handleScroll = React.useCallback(() => {
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => {
            updateSelectionFromScroll();
        }, 80); // smooth delay after scroll stops
    }, [updateSelectionFromScroll]);

    // Attach scroll listeners
    React.useEffect(() => {
        const hourContainer = hourScrollRef.current;
        const minuteContainer = minuteScrollRef.current;
        if (hourContainer) {
            hourContainer.addEventListener("scroll", handleScroll);
            hourContainer.addEventListener("touchend", updateSelectionFromScroll);
        }
        if (minuteContainer) {
            minuteContainer.addEventListener("scroll", handleScroll);
            minuteContainer.addEventListener("touchend", updateSelectionFromScroll);
        }
        return () => {
            if (hourContainer) {
                hourContainer.removeEventListener("scroll", handleScroll);
                hourContainer.removeEventListener("touchend", updateSelectionFromScroll);
            }
            if (minuteContainer) {
                minuteContainer.removeEventListener("scroll", handleScroll);
                minuteContainer.removeEventListener("touchend", updateSelectionFromScroll);
            }
            if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        };
    }, [handleScroll, updateSelectionFromScroll]);

    // When picker opens, scroll to current hour/minute
    React.useEffect(() => {
        if (isOpen) {
            // Wait for bottom sheet to render + settle
            requestAnimationFrame(() => {
                scrollToHour(hour, "auto");
                scrollToMinute(min, "auto");
            });
        }
    }, [isOpen, hour, min, scrollToHour, scrollToMinute]);

    // Sync internal state when external value changes
    React.useEffect(() => {
        if (value) {
            const [h, m] = value.split(":");
            let changed = false;
            if (h !== hourRef.current) {
                setHour(h);
                changed = true;
            }
            if (m !== minRef.current) {
                setMin(m);
                changed = true;
            }
            // Also reposition if picker is open OR if value changed from outside
            if (isOpen || changed) {
                requestAnimationFrame(() => {
                    scrollToHour(h, "auto");
                    scrollToMinute(m, "auto");
                });
            }
        }
    }, [value, isOpen, scrollToHour, scrollToMinute]);

    // Click on a specific hour/minute: updates state and scrolls smoothly
    const handleHourClick = React.useCallback((h: string) => {
        setHour(h);
        scrollToHour(h, "smooth");
    }, [scrollToHour]);

    const handleMinuteClick = React.useCallback((m: string) => {
        setMin(m);
        scrollToMinute(m, "smooth");
    }, [scrollToMinute]);

    const handleConfirm = () => {
        onChange?.(`${hour}:${min}`);
        setIsOpen(false);
    };

    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="text-[10px] font-black uppercase tracking-wide text-gray-400 ml-1">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={cn(
                    "w-full h-12 bg-white dark:bg-gray-800 border-none rounded-xl px-4 flex items-center gap-3 text-sm font-black dark:text-white active:scale-[0.98] transition-transform text-left",
                    !value && "text-gray-400",
                    className
                )}
            >
                <IconClock className="w-5 h-5 text-primary opacity-70" stroke={2} />
                <span className="tabular-nums">
                    {value || placeholder || "00:00"}
                </span>
            </button>

            <BottomSheet
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={t("select_time", "Select Time")}
            >
                <div className="pt-2 w-full overflow-x-hidden">
                    {/* Picker Grid - no horizontal movement allowed */}
                    <div className="grid grid-cols-2 gap-4 h-64 relative mb-6 overflow-x-hidden">
                        {/* Overlay Indicator (fixed center highlight) */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 border-y-2 border-primary/20 pointer-events-none z-10" />

                        {/* Hours Column - locked horizontally */}
                        <div
                            ref={hourScrollRef}
                            className="flex flex-col overflow-y-auto overflow-x-hidden snap-y snap-mandatory h-full py-[104px] [scrollbar-width:none] [-ms-overflow-style:none] touch-action:pan-y"
                            style={{ 
                                WebkitOverflowScrolling: "touch",
                                scrollPaddingTop: '104px',
                                scrollPaddingBottom: '104px'
                            }}
                        >
                            <style>{`
                                .no-scrollbar::-webkit-scrollbar { display: none; }
                            `}</style>
                            {hours.map(h => (
                                <button
                                    key={h}
                                    data-value={h}
                                    type="button"
                                    onClick={() => handleHourClick(h)}
                                    className={cn(
                                        "h-12 flex items-center justify-center text-xl font-black transition-all snap-center shrink-0 w-full touch-manipulation",
                                        hour === h
                                            ? "text-primary scale-110"
                                            : "text-gray-400/30 dark:text-gray-600 opacity-40"
                                    )}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>

                        {/* Minutes Column - locked horizontally */}
                        <div
                            ref={minuteScrollRef}
                            className="flex flex-col overflow-y-auto overflow-x-hidden snap-y snap-mandatory h-full py-[104px] [scrollbar-width:none] [-ms-overflow-style:none] touch-action:pan-y"
                            style={{ 
                                WebkitOverflowScrolling: "touch",
                                scrollPaddingTop: '104px',
                                scrollPaddingBottom: '104px'
                            }}
                        >
                            {minutes.map(m => (
                                <button
                                    key={m}
                                    data-value={m}
                                    type="button"
                                    onClick={() => handleMinuteClick(m)}
                                    className={cn(
                                        "h-12 flex items-center justify-center text-xl font-black transition-all snap-center shrink-0 w-full touch-manipulation",
                                        min === m
                                            ? "text-primary scale-110"
                                            : "text-gray-400/30 dark:text-gray-600 opacity-40"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pb-6 pt-2">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="w-full h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <span>{t("confirm_time", "Confirm Time")}</span>
                            <IconCheck className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
}