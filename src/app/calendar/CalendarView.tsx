'use client';

import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Target, Plus, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CalendarEvent {
  id: string;
  title: string;
  time?: string;
  category: 'work' | 'personal' | 'health' | 'social';
  date: Date;
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    time: '10:00 AM',
    category: 'work',
    date: new Date()
  },
  {
    id: '2',
    title: 'Gym Workout',
    time: '6:00 PM',
    category: 'health',
    date: new Date()
  },
  {
    id: '3',
    title: 'Lunch with Sarah',
    time: '12:30 PM',
    category: 'social',
    date: addDays(new Date(), 1)
  },
  {
    id: '4',
    title: 'Project Deadline',
    category: 'work',
    date: addDays(new Date(), 3)
  },
  {
    id: '5',
    title: 'Doctor Appointment',
    time: '2:00 PM',
    category: 'health',
    date: addDays(new Date(), 5)
  }
];

const categoryColors = {
  work: 'bg-blue-500 text-white',
  personal: 'bg-green-500 text-white',
  health: 'bg-red-500 text-white',
  social: 'bg-purple-500 text-white'
};

interface CalendarViewProps {
  showHeader?: boolean;
  compact?: boolean;
  maxHeight?: string;
  onDateSelect?: (date: Date) => void;
}

export default function CalendarView({ 
  showHeader = true, 
  compact = false, 
  maxHeight,
  onDateSelect 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events] = useState<CalendarEvent[]>(mockEvents);

  // Monthly view data
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDate = startOfWeek(start);
    const endDate = addDays(startOfWeek(end), 41); // 6 weeks
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Weekly view data
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return [...Array(7)].map((_, i) => addDays(start, i));
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (currentView === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (currentView === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const renderMonthView = () => (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className={`${compact ? 'p-1 text-xs' : 'p-2 text-sm'} text-center font-medium text-gray-500`}>
            {compact ? day.charAt(0) : day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <motion.div
              key={index}
              className={`${compact ? 'min-h-[60px] p-1' : 'min-h-[120px] p-2'} border border-gray-200 cursor-pointer transition-all hover:bg-gray-50 ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
              } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${
                isToday(day) ? 'bg-blue-100 border-blue-300' : ''
              }`}
              onClick={() => handleDateClick(day)}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${
                  isToday(day) ? 'text-blue-600 font-bold' : ''
                }`}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                {!compact && dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${categoryColors[event.category]}`}
                    title={`${event.title} ${event.time ? `at ${event.time}` : ''}`}
                  >
                    {event.time && <span className="font-medium">{event.time}</span>} {event.title}
                  </div>
                ))}
                {!compact && dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-8 gap-4">
        {/* Time column */}
        <div className="space-y-16 pt-12">
          {[...Array(12)].map((_, i) => {
            const hour = i + 8; // Start from 8 AM
            return (
              <div key={i} className="text-xs text-gray-500 text-right pr-2">
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
            );
          })}
        </div>
        
        {/* Week days */}
        {weekDays.map((day) => {
          const dayEvents = getEventsForDate(day);
          
          return (
            <div key={day.toString()} className="space-y-1">
              <div className={`text-center p-2 rounded-lg ${
                isToday(day) ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-700'
              }`}>
                <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                <div className="text-lg">{format(day, 'd')}</div>
              </div>
              
              <div className="min-h-[600px] bg-gray-50 rounded-lg p-2 space-y-1 relative">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-2 rounded shadow-sm ${categoryColors[event.category]}`}
                  >
                    <div className="font-medium">{event.time}</div>
                    <div>{event.title}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time slots */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Event
            </Button>
          </div>
          
          <div className="space-y-1">
            {[...Array(24)].map((_, i) => {
              const hour = i;
              const timeString = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
              const hourEvents = dayEvents.filter(event => 
                event.time && event.time.startsWith(timeString.split(':')[0])
              );
              
              return (
                <div key={i} className="flex border-b border-gray-100">
                  <div className="w-20 text-xs text-gray-500 py-4 pr-4 text-right">
                    {timeString}
                  </div>
                  <div className="flex-1 min-h-[60px] p-2 hover:bg-gray-50">
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-2 rounded mb-1 ${categoryColors[event.category]}`}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs opacity-90">{event.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Day summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Events</CardTitle>
            </CardHeader>
            <CardContent>
              {dayEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No events scheduled</p>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-2">
                      <Badge className={categoryColors[event.category]}>
                        {event.category}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{event.title}</div>
                        {event.time && (
                          <div className="text-xs text-gray-500">{event.time}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Events:</span>
                  <span className="font-medium">{dayEvents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Work Events:</span>
                  <span className="font-medium">
                    {dayEvents.filter(e => e.category === 'work').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Personal Events:</span>
                  <span className="font-medium">
                    {dayEvents.filter(e => e.category === 'personal').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="w-full" style={maxHeight ? { maxHeight } : {}}>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-800">{format(currentDate, 'MMMM yyyy')}</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
        {renderMonthView()}
        
        {/* Selected Date Info for compact mode */}
        {selectedDate && (
          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-1">
              {format(selectedDate, 'EEEE, MMM d')}
            </div>
            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-1">
                {getEventsForDate(selectedDate).slice(0, 2).map((event) => (
                  <div key={event.id} className="text-xs text-blue-700">
                    {event.time} - {event.title}
                  </div>
                ))}
                {getEventsForDate(selectedDate).length > 2 && (
                  <div className="text-xs text-blue-600">
                    +{getEventsForDate(selectedDate).length - 2} more
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-blue-600">No events scheduled</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {showHeader && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <h1 className="text-2xl font-bold">Calendar</h1>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="text-lg font-semibold min-w-[200px] text-center">
                    {currentView === 'month' && format(currentDate, 'MMMM yyyy')}
                    {currentView === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d')}`}
                    {currentView === 'day' && format(currentDate, 'MMMM d, yyyy')}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={currentView === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('day')}
                >
                  Day
                </Button>
                <Button
                  variant={currentView === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('week')}
                >
                  Week
                </Button>
                <Button
                  variant={currentView === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('month')}
                >
                  Month
                </Button>
                
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Event
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Calendar Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'month' && renderMonthView()}
              {currentView === 'week' && renderWeekView()}
              {currentView === 'day' && renderDayView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Selected Date Details */}
        {selectedDate && currentView === 'month' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            
            {getEventsForDate(selectedDate).length === 0 ? (
              <p className="text-gray-500">No events scheduled for this day.</p>
            ) : (
              <div className="space-y-2">
                {getEventsForDate(selectedDate).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Badge className={categoryColors[event.category]}>
                      {event.category}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      {event.time && (
                        <div className="text-sm text-gray-500">{event.time}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}