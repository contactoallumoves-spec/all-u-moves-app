import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { addDays, subDays, startOfWeek, endOfWeek, format, isSameDay, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklyCalendarProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    scheduledDays: string[]; // ['monday', 'wednesday'] etc.
    completedDates: string[]; // ['2024-02-01', ...]
    planStartDate?: Date; // [NEW] To hide ghost sessions before start
    planEndDate?: Date; // [NEW] To hide ghost sessions after end
}

const DAYS_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function WeeklyCalendar({ selectedDate, onSelectDate, scheduledDays, completedDates, planStartDate, planEndDate }: WeeklyCalendarProps) {
    // View state (which week are we looking at), separate from selectedDate
    const [viewDate, setViewDate] = useState(selectedDate);
    const [direction, setDirection] = useState(0);

    // Sync view if selectedDate changes drastically (optional, mostly for "Return to Today")
    useEffect(() => {
        if (!isSameWeek(viewDate, selectedDate)) {
            setViewDate(selectedDate);
        }
    }, [selectedDate]);

    // Helpers
    const getWeekRange = (date: Date) => {
        const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(start, i));
        }
        return { start, days };
    };

    const { start: weekStart, days: weekDays } = getWeekRange(viewDate);
    const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 });

    // Formatting
    const weekLabel = `Semana del ${format(weekStart, 'd', { locale: es })} al ${format(weekEnd, 'd MMM', { locale: es })}`;
    const isCurrentWeek = isSameWeek(new Date(), viewDate);

    // Navigation
    const navigateWeek = (newDirection: number) => {
        setDirection(newDirection);
        // Move view by 7 days
        const newDate = newDirection > 0 ? addDays(viewDate, 7) : subDays(viewDate, 7);
        setViewDate(newDate);

        // [FIX] Also update the selected date in Parent to refresh the Plan content immediately
        // We defaults to the first day of that new week (Monday)
        const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
        onSelectDate(newWeekStart);
    };

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 })
    };

    return (
        <div className="space-y-4">
            {/* Context Header */}
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-brand-600" />
                    <span className="text-sm font-bold text-brand-800 capitalize">{weekLabel}</span>
                </div>

                <div className="flex items-center gap-1">
                    {!isCurrentWeek && (
                        <button
                            onClick={() => {
                                setDirection(isAfter(new Date(), viewDate) ? 1 : -1);
                                setViewDate(new Date());
                                onSelectDate(new Date());
                            }}
                            className="mr-2 text-[10px] bg-brand-50 text-brand-700 px-2 py-1 rounded-md font-bold uppercase transition-colors hover:bg-brand-100"
                        >
                            HOY
                        </button>
                    )}
                    <button onClick={() => navigateWeek(-1)} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-brand-600 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => navigateWeek(1)} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-brand-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Swipeable Calendar Grid */}
            <div className="relative overflow-hidden min-h-[90px]">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={viewDate.toISOString()}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(_, { offset, velocity }) => {
                            const swipe = offset.x; // detected swipe distance
                            if (swipe < -50 || velocity.x < -500) {
                                navigateWeek(1); // Next week
                            } else if (swipe > 50 || velocity.x > 500) {
                                navigateWeek(-1); // Prev week
                            }
                        }}
                        className="grid grid-cols-7 gap-2 w-full touch-pan-y"
                    >
                        {weekDays.map((date, i) => {
                            const dIndex = date.getDay();
                            const dayKey = DAYS_MAP[dIndex];

                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());

                            // Status Logic
                            // Check if date is within plan range
                            const isWithinPlan =
                                (!planStartDate || !isBefore(date, startOfDay(planStartDate))) &&
                                (!planEndDate || !isAfter(date, endOfDay(planEndDate)));

                            // Only show planned session if it's the right day of week AND within plan dates
                            const hasSession = scheduledDays.includes(dayKey) && isWithinPlan;

                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isCompleted = completedDates.includes(dateStr);
                            const isMissed = hasSession && !isCompleted && isAfter(new Date(), date) && !isToday; // Lazy logic for missed

                            // Labels
                            const dayLetter = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][dIndex];

                            return (
                                <button
                                    key={i}
                                    onClick={() => onSelectDate(date)}
                                    className={cn(
                                        "aspect-[3/4] rounded-2xl flex flex-col items-center justify-between p-1 relative overflow-hidden transition-all duration-300",
                                        isSelected
                                            ? (isCompleted ? "bg-green-600 text-white shadow-lg scale-105" : "bg-brand-700 text-white shadow-lg scale-105")
                                            : isCompleted
                                                ? "bg-green-50 border border-green-200 text-green-900 hover:border-green-300"
                                                : "bg-white text-zinc-900 border border-zinc-100 hover:border-brand-200",
                                        isToday && !isSelected && !isCompleted && "border-brand-300 bg-brand-50"
                                    )}
                                >
                                    <span className="text-[10px] font-extrabold opacity-70">{dayLetter}</span>
                                    <span className={cn("text-base font-bold", isSelected ? "text-white" : "text-brand-900")}>
                                        {date.getDate()}
                                    </span>

                                    {/* Status Dot System */}
                                    <div className="h-2 flex items-center justify-center">
                                        {isCompleted ? (
                                            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", isSelected ? "bg-white/20" : "bg-green-100")}>
                                                <div className={cn("w-2 h-2 rounded-full", isSelected ? "bg-green-400" : "bg-green-500")} />
                                            </div>
                                        ) : isMissed ? (
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-300" title="Sesión no realizada" />
                                        ) : hasSession ? (
                                            <div className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white" : "bg-brand-400")} />
                                        ) : null}
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// Utility
function isSameWeek(d1: Date, d2: Date) {
    return startOfWeek(d1, { weekStartsOn: 1 }).getTime() === startOfWeek(d2, { weekStartsOn: 1 }).getTime();
}
