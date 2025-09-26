'use client';

// Catalyst High-Performance Calendar Component
import React, { 
  useState, 
  useMemo, 
  useCallback, 
  useEffect, 
  memo,
  useRef,
  useLayoutEffect
} from 'react';
// import { FixedSizeList as List } from 'react-window';
import { 
  format, 
  startOfWeek, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCachedData, setCachedData } from '@/lib/cache/catalyst-cache';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  category: 'work' | 'personal' | 'health' | 'social' | 'focus' | 'habit';
  priority: 'low' | 'medium' | 'high';
  color?: string;
  isCompleted?: boolean;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onEventCreate?: (date: Date) => void;
  view?: 'month' | 'week' | 'day';
  className?: string;
  enableVirtualization?: boolean;
  showMiniCalendar?: boolean;
}

// Memoized day cell component for optimal rendering
const DayCell = memo<{
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
  isSelected: boolean;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventCreate: (date: Date) => void;
}>(({ 
  date, 
  events, 
  isToday, 
  isCurrentMonth, 
  isSelected,
  onDateClick,
  onEventClick,
  onEventCreate
}) => {
  // Memoize sorted events
  const sortedEvents = useMemo(() => {
    return events
      .filter(event => isSameDay(event.startTime, date))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 3); // Limit to 3 visible events per day
  }, [events, date]);

  const handleDateClick = useCallback(() => {
    onDateClick(date);
  }, [date, onDateClick]);

  const handleEventCreate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEventCreate(date);
  }, [date, onEventCreate]);

  return (
    <motion.div
      className={cn(
        'relative min-h-[120px] p-2 border border-border/50 cursor-pointer',
        'hover:bg-accent/50 transition-colors duration-200',
        isToday && 'ring-2 ring-primary bg-primary/5',
        !isCurrentMonth && 'opacity-50',
        isSelected && 'bg-accent'
      )}
      onClick={handleDateClick}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          'text-sm font-medium',
          isToday && 'text-primary font-bold',
          !isCurrentMonth && 'text-muted-foreground'
        )}>
          {format(date, 'd')}
        </span>
        {isCurrentMonth && (
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
            onClick={handleEventCreate}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {sortedEvents.map((event, index) => (
            <EventItem
              key={event.id}
              event={event}
              index={index}
              onClick={onEventClick}
            />
          ))}
        </AnimatePresence>
        
        {events.filter(e => isSameDay(e.startTime, date)).length > 3 && (
          <div className="text-xs text-muted-foreground">
            +{events.filter(e => isSameDay(e.startTime, date)).length - 3} more
          </div>
        )}
      </div>
    </motion.div>
  );
});

DayCell.displayName = 'DayCell';

// Memoized event item component
const EventItem = memo<{
  event: CalendarEvent;
  index: number;
  onClick: (event: CalendarEvent) => void;
}>(({ event, index, onClick }) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(event);
  }, [event, onClick]);

  const categoryColors = {
    work: 'bg-blue-500',
    personal: 'bg-green-500',
    health: 'bg-red-500',
    social: 'bg-purple-500',
    focus: 'bg-orange-500',
    habit: 'bg-teal-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'text-xs p-1 rounded truncate cursor-pointer',
        'hover:shadow-sm transition-shadow duration-200',
        categoryColors[event.category] || 'bg-gray-500',
        'text-white'
      )}
      onClick={handleClick}
      title={`${event.title} - ${format(event.startTime, 'HH:mm')}`}
    >
      {event.title}
    </motion.div>
  );
});

EventItem.displayName = 'EventItem';

// Standard week row component (virtualization disabled for now)
const WeekRow = memo<{
  week: Date[];
  events: CalendarEvent[];
  selectedDate: Date | null;
  currentMonth: Date;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventCreate: (date: Date) => void;
}>(({ week, events, selectedDate, currentMonth, onDateClick, onEventClick, onEventCreate }) => {
  return (
    <div className="flex gap-px">
      {week.map(day => (
        <div key={day.toISOString()} className="flex-1">
          <DayCell
            date={day}
            events={events}
            isToday={isToday(day)}
            isCurrentMonth={isSameDay(startOfMonth(currentMonth), startOfMonth(day))}
            isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
            onDateClick={onDateClick}
            onEventClick={onEventClick}
            onEventCreate={onEventCreate}
          />
        </div>
      ))}
    </div>
  );
});

WeekRow.displayName = 'WeekRow';

// Main Calendar Component
export const CatalystCalendar: React.FC<CalendarProps> = memo(({
  events = [],
  onEventClick = () => {},
  onDateClick = () => {},
  onEventCreate = () => {},
  view = 'month',
  className,
  enableVirtualization = true,
  showMiniCalendar = false
}) => {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const listRef = useRef<List>(null);

  // Initialize currentDate on client side to prevent hydration mismatch
  useEffect(() => {
    if (!currentDate) {
      setCurrentDate(new Date());
    }
  }, [currentDate]);

  // Memoized date calculations
  const { monthStart, monthEnd, calendarStart, calendarEnd } = useMemo(() => {
    if (!currentDate) {
      // Return default values when currentDate is null (during SSR)
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = addDays(calendarStart, 41); // 6 weeks
      
      return { monthStart, monthEnd, calendarStart, calendarEnd };
    }
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = addDays(calendarStart, 41); // 6 weeks
    
    return { monthStart, monthEnd, calendarStart, calendarEnd };
  }, [currentDate]);

  // Memoized weeks calculation
  const weeks = useMemo(() => {
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weeks: Date[][] = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  }, [calendarStart, calendarEnd]);

  // Memoized filtered events
  const visibleEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = event.startTime;
      return eventDate >= calendarStart && eventDate <= calendarEnd;
    });
  }, [events, calendarStart, calendarEnd]);

  // Navigation handlers
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setIsLoading(true);
    setCurrentDate(prev => {
      const baseDate = prev || new Date();
      const newDate = direction === 'next' 
        ? addDays(baseDate, 32) 
        : addDays(baseDate, -32);
      return startOfMonth(newDate);
    });
    
    // Simulate loading for smooth transitions
    setTimeout(() => setIsLoading(false), 150);
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    onDateClick(date);
  }, [onDateClick]);

  // Scroll to current week on month change (disabled for now)
  // useLayoutEffect(() => {
  //   if (listRef.current && weeks.length > 0) {
  //     const currentWeekIndex = weeks.findIndex(week => 
  //       week.some(day => isToday(day))
  //     );
      
  //     if (currentWeekIndex !== -1) {
  //       listRef.current.scrollToItem(currentWeekIndex, 'start');
  //     }
  //   }
  // }, [currentDate, weeks]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">
              {currentDate ? format(currentDate, 'MMMM yyyy') : 'Loading...'}
            </h2>
            {isLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDate ? format(currentDate, 'yyyy-MM') : 'loading'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="group"
          >
            <div className="space-y-px">
              {weeks.map((week, weekIndex) => (
                <WeekRow
                  key={weekIndex}
                  week={week}
                  events={visibleEvents}
                  selectedDate={selectedDate}
                  currentMonth={currentDate || new Date()}
                  onDateClick={handleDateClick}
                  onEventClick={onEventClick}
                  onEventCreate={onEventCreate}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Calendar Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {visibleEvents.length} events this month
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              {currentDate ? format(currentDate, 'MMM yyyy') : 'Loading'}
            </Badge>
            {selectedDate && (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {format(selectedDate, 'MMM d')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CatalystCalendar.displayName = 'CatalystCalendar';