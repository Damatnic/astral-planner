'use client';

import { useState } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, Target, CheckCircle2, Heart, Sun, Moon, Cloud, Coffee, BookOpen, PenTool, Bookmark, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlannerBook() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'monthly' | 'weekly' | 'daily'>('daily');
  const [pageFlip, setPageFlip] = useState(0);

  // Weekly view data
  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return [...Array(7)].map((_, i) => addDays(start, i));
  };

  // Monthly view data
  const getMonthDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    return days;
  };

  const handlePrevious = () => {
    setPageFlip(-1);
    setTimeout(() => {
      if (currentView === 'daily') {
        setCurrentDate(addDays(currentDate, -1));
      } else if (currentView === 'weekly') {
        setCurrentDate(addDays(currentDate, -7));
      } else {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
      }
      setPageFlip(0);
    }, 150);
  };

  const handleNext = () => {
    setPageFlip(1);
    setTimeout(() => {
      if (currentView === 'daily') {
        setCurrentDate(addDays(currentDate, 1));
      } else if (currentView === 'weekly') {
        setCurrentDate(addDays(currentDate, 7));
      } else {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
      }
      setPageFlip(0);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      {/* Desk texture background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 via-amber-50/30 to-yellow-100/50"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(139, 69, 19, 0.1) 35px, rgba(139, 69, 19, 0.1) 70px), repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(139, 69, 19, 0.05) 35px, rgba(139, 69, 19, 0.05) 70px)',
          backgroundSize: '70px 70px'
        }}></div>
      </div>

      {/* Planner Book Container */}
      <div className="relative max-w-6xl w-full">
        {/* Book Shadow */}
        <div className="absolute -inset-4 bg-black/20 rounded-lg blur-2xl -z-10"></div>
        
        {/* Book Binding Effect */}
        <div className="relative bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-lg p-2">
          <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none z-10"></div>
          
          {/* Spiral Binding */}
          <div className="absolute left-1/2 top-4 bottom-4 -ml-3 flex flex-col justify-around pointer-events-none z-20">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-gray-400 border-2 border-gray-500 shadow-sm"></div>
            ))}
          </div>

          {/* Main Pages */}
          <div className="flex bg-white rounded shadow-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, x: pageFlip * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -pageFlip * 100 }}
                transition={{ duration: 0.3 }}
                className="w-full flex"
              >
                {/* Daily View */}
                {currentView === 'daily' && (
                  <>
                    {/* Left Page */}
                    <div className="w-1/2 bg-gradient-to-br from-white via-gray-50 to-white relative">
                      {/* Paper Lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="h-full flex flex-col pt-20">
                          {[...Array(20)].map((_, i) => (
                            <div key={i} className="flex-1 border-b border-blue-100/50"></div>
                          ))}
                        </div>
                        <div className="absolute left-16 top-0 bottom-0 border-l-2 border-red-200/50"></div>
                      </div>

                      {/* Left Page Content */}
                      <div className="relative p-8 pr-12">
                        {/* Date Header */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Courier New, monospace' }}>
                              {format(currentDate, 'EEEE')}
                            </h2>
                            <div className="flex items-center gap-2 text-gray-600">
                              {isToday(currentDate) && <Sun className="w-5 h-5 text-yellow-500" />}
                              <span className="text-sm">{format(currentDate, 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                          <div className="h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                        </div>

                        {/* Schedule Section */}
                        <div className="space-y-4 mb-8">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Today's Schedule
                          </h3>
                          <div className="space-y-3 pl-6">
                            {['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'].map((time, index) => (
                              <div key={time} className="flex gap-4 items-start">
                                <span className="text-xs text-gray-500 w-16 pt-1">{time}</span>
                                <div className="flex-1 h-8 border-b border-dotted border-gray-300 relative">
                                  {index === 1 && (
                                    <span className="absolute left-2 top-0 text-sm text-blue-600" style={{ fontFamily: 'cursive' }}>
                                      Team meeting - Project review
                                    </span>
                                  )}
                                  {index === 3 && (
                                    <span className="absolute left-2 top-0 text-sm text-green-600" style={{ fontFamily: 'cursive' }}>
                                      Lunch with Sarah
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <PenTool className="w-4 h-4" />
                            Quick Notes
                          </h3>
                          <div className="space-y-2 pl-6">
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'cursive' }}>
                              • Call mom about weekend plans
                            </p>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'cursive' }}>
                              • Pick up groceries: milk, bread, eggs
                            </p>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'cursive' }}>
                              • Remember to water the plants
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Page Number */}
                      <div className="absolute bottom-4 left-8 text-xs text-gray-400">
                        {format(currentDate, 'DDD')} / 365
                      </div>
                    </div>

                    {/* Right Page */}
                    <div className="w-1/2 bg-gradient-to-bl from-white via-gray-50 to-white relative">
                      {/* Paper Lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="h-full flex flex-col pt-20">
                          {[...Array(20)].map((_, i) => (
                            <div key={i} className="flex-1 border-b border-blue-100/50"></div>
                          ))}
                        </div>
                      </div>

                      {/* Right Page Content */}
                      <div className="relative p-8 pl-12">
                        {/* Daily Goals */}
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <Target className="w-4 h-4" />
                            Today's Goals
                          </h3>
                          <div className="space-y-3 pl-6">
                            {[
                              { text: 'Complete project proposal', done: true },
                              { text: 'Exercise for 30 minutes', done: true },
                              { text: 'Read 20 pages of book', done: false },
                              { text: 'Practice meditation', done: false }
                            ].map((goal, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className={`w-4 h-4 rounded border-2 ${goal.done ? 'bg-green-500 border-green-500' : 'border-gray-400'} mt-0.5`}>
                                  {goal.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <span className={`text-sm ${goal.done ? 'line-through text-gray-400' : 'text-gray-700'}`} style={{ fontFamily: 'cursive' }}>
                                  {goal.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mood Tracker */}
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <Heart className="w-4 h-4" />
                            Mood & Gratitude
                          </h3>
                          <div className="pl-6 space-y-3">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">Today I feel:</span>
                              <div className="flex gap-2">
                                {['😊', '😐', '😔', '😴', '😎'].map((emoji, i) => (
                                  <button
                                    key={i}
                                    className={`text-2xl hover:scale-125 transition-transform ${i === 0 ? 'scale-125' : 'opacity-50'}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">I'm grateful for:</p>
                              <p className="text-sm text-blue-600 pl-4" style={{ fontFamily: 'cursive' }}>
                                The beautiful weather today and a productive morning
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Water & Habit Tracker */}
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <Activity className="w-4 h-4" />
                            Habit Tracker
                          </h3>
                          <div className="pl-6 space-y-3">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">Water intake:</span>
                              <div className="flex gap-1">
                                {[...Array(8)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-6 h-6 rounded-full border-2 ${
                                      i < 5 ? 'bg-blue-400 border-blue-400' : 'border-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">Steps today:</span>
                              <span className="text-sm font-semibold text-green-600">7,234 / 10,000</span>
                            </div>
                          </div>
                        </div>

                        {/* Doodle Area */}
                        <div className="mt-auto">
                          <div className="flex justify-end gap-4">
                            <Coffee className="w-8 h-8 text-amber-700 opacity-30" />
                            <BookOpen className="w-8 h-8 text-blue-400 opacity-30" />
                          </div>
                        </div>
                      </div>

                      {/* Page Number */}
                      <div className="absolute bottom-4 right-8 text-xs text-gray-400">
                        {format(addDays(currentDate, 1), 'DDD')} / 365
                      </div>
                    </div>
                  </>
                )}

                {/* Weekly View */}
                {currentView === 'weekly' && (
                  <>
                    {/* Left Page - Week Overview */}
                    <div className="w-1/2 bg-gradient-to-br from-white via-gray-50 to-white relative">
                      {/* Paper Lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="h-full flex flex-col pt-16">
                          {[...Array(25)].map((_, i) => (
                            <div key={i} className="flex-1 border-b border-blue-100/50"></div>
                          ))}
                        </div>
                        <div className="absolute left-12 top-0 bottom-0 border-l-2 border-red-200/50"></div>
                      </div>

                      {/* Left Page Content */}
                      <div className="relative p-6 pr-10">
                        {/* Week Header */}
                        <div className="mb-6">
                          <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
                            Week of {format(startOfWeek(currentDate), 'MMM dd')}
                          </h2>
                          <div className="h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                        </div>

                        {/* Week at a Glance */}
                        <div className="space-y-3 mb-8">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            This Week
                          </h3>
                          <div className="space-y-2 pl-4">
                            {getWeekDays().map((day, index) => (
                              <div key={index} className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isToday(day) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {format(day, 'dd')}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{format(day, 'EEEE')}</div>
                                  <div className="text-xs text-gray-500" style={{ fontFamily: 'cursive' }}>
                                    {index === 1 && 'Team meeting, lunch with client'}
                                    {index === 3 && 'Gym, grocery shopping'}
                                    {index === 5 && 'Movie night, relax'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Weekly Goals */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Weekly Goals
                          </h3>
                          <div className="space-y-2 pl-4">
                            {[
                              { text: 'Complete quarterly report', progress: 75 },
                              { text: 'Exercise 5 times this week', progress: 60 },
                              { text: 'Read 2 chapters of book', progress: 50 },
                              { text: 'Plan next month activities', progress: 25 }
                            ].map((goal, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-700" style={{ fontFamily: 'cursive' }}>
                                    • {goal.text}
                                  </span>
                                  <span className="text-xs text-gray-500">{goal.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 ml-4">
                                  <div 
                                    className="bg-green-500 h-1.5 rounded-full" 
                                    style={{ width: `${goal.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Page Number */}
                      <div className="absolute bottom-4 left-6 text-xs text-gray-400">
                        Week {format(currentDate, 'I')} of {format(currentDate, 'yyyy')}
                      </div>
                    </div>

                    {/* Right Page - Weekly Habits & Stats */}
                    <div className="w-1/2 bg-gradient-to-bl from-white via-gray-50 to-white relative">
                      {/* Paper Lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="h-full flex flex-col pt-16">
                          {[...Array(25)].map((_, i) => (
                            <div key={i} className="flex-1 border-b border-blue-100/50"></div>
                          ))}
                        </div>
                      </div>

                      {/* Right Page Content */}
                      <div className="relative p-6 pl-10">
                        {/* Habit Tracker */}
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <Activity className="w-4 h-4" />
                            Habit Tracker
                          </h3>
                          <div className="space-y-4 pl-4">
                            {['Exercise', 'Reading', 'Meditation', 'Water (8 cups)', 'Sleep (8h)'].map((habit, habitIndex) => (
                              <div key={habit}>
                                <div className="text-sm font-medium mb-2">{habit}</div>
                                <div className="flex gap-1">
                                  {getWeekDays().map((day, dayIndex) => {
                                    const completed = Math.random() > 0.3; // Mock completion
                                    return (
                                      <div key={dayIndex} className="flex flex-col items-center">
                                        <div className={`w-6 h-6 rounded-full border-2 ${
                                          completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                        }`}>
                                          {completed && <CheckCircle2 className="w-4 h-4 text-white m-0.5" />}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">{format(day, 'EEE')[0]}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Weekly Reflection */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <PenTool className="w-4 h-4" />
                            Weekly Reflection
                          </h3>
                          <div className="pl-4 space-y-3">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Wins this week:</p>
                              <p className="text-sm text-blue-600" style={{ fontFamily: 'cursive' }}>
                                Completed the big project ahead of schedule!
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Areas to improve:</p>
                              <p className="text-sm text-blue-600" style={{ fontFamily: 'cursive' }}>
                                Need to be more consistent with morning routine
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Next week focus:</p>
                              <p className="text-sm text-blue-600" style={{ fontFamily: 'cursive' }}>
                                Start new fitness program, organize home office
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Page Number */}
                      <div className="absolute bottom-4 right-6 text-xs text-gray-400">
                        Week {format(addDays(currentDate, 7), 'I')} of {format(currentDate, 'yyyy')}
                      </div>
                    </div>
                  </>
                )}

                {/* Monthly View */}
                {currentView === 'monthly' && (
                  <>
                    {/* Left Page - Calendar Grid */}
                    <div className="w-1/2 bg-gradient-to-br from-white via-gray-50 to-white relative">
                      {/* Left Page Content */}
                      <div className="relative p-6 pr-10">
                        {/* Month Header */}
                        <div className="mb-6">
                          <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
                            {format(currentDate, 'MMMM yyyy')}
                          </h2>
                          <div className="h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="space-y-2">
                          {/* Week Headers */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                              <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Calendar Days */}
                          <div className="grid grid-cols-7 gap-1">
                            {/* Previous month days to fill the grid */}
                            {(() => {
                              const firstDay = startOfMonth(currentDate);
                              const startDay = firstDay.getDay();
                              const prevMonthDays = [];
                              
                              for (let i = startDay - 1; i >= 0; i--) {
                                const day = addDays(firstDay, -i - 1);
                                prevMonthDays.push(
                                  <div key={`prev-${i}`} className="aspect-square flex items-center justify-center text-xs text-gray-300">
                                    {format(day, 'd')}
                                  </div>
                                );
                              }
                              return prevMonthDays;
                            })()}

                            {/* Current month days */}
                            {getMonthDays().map((day) => (
                              <div
                                key={format(day, 'yyyy-MM-dd')}
                                className={`aspect-square flex items-center justify-center text-xs relative cursor-pointer hover:bg-blue-50 rounded ${
                                  isToday(day) 
                                    ? 'bg-amber-500 text-white font-bold' 
                                    : isSameMonth(day, currentDate) 
                                      ? 'text-gray-800' 
                                      : 'text-gray-300'
                                }`}
                              >
                                {format(day, 'd')}
                                {/* Event dots */}
                                {Math.random() > 0.7 && (
                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Next month days to fill the grid */}
                            {(() => {
                              const lastDay = endOfMonth(currentDate);
                              const endDay = lastDay.getDay();
                              const nextMonthDays = [];
                              
                              for (let i = 1; i <= 6 - endDay; i++) {
                                const day = addDays(lastDay, i);
                                nextMonthDays.push(
                                  <div key={`next-${i}`} className="aspect-square flex items-center justify-center text-xs text-gray-300">
                                    {format(day, 'd')}
                                  </div>
                                );
                              }
                              return nextMonthDays;
                            })()}
                          </div>
                        </div>

                        {/* Month Stats */}
                        <div className="mt-8 space-y-3">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Monthly Stats
                          </h3>
                          <div className="grid grid-cols-2 gap-4 pl-4">
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="text-2xl font-bold text-green-600">87%</div>
                              <div className="text-xs text-gray-600">Goals Hit</div>
                            </div>
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="text-2xl font-bold text-blue-600">24</div>
                              <div className="text-xs text-gray-600">Days Active</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Page Number */}
                      <div className="absolute bottom-4 left-6 text-xs text-gray-400">
                        {format(currentDate, 'MMMM yyyy')}
                      </div>
                    </div>

                    {/* Right Page - Monthly Goals & Review */}
                    <div className="w-1/2 bg-gradient-to-bl from-white via-gray-50 to-white relative">
                      {/* Paper Lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="h-full flex flex-col pt-16">
                          {[...Array(25)].map((_, i) => (
                            <div key={i} className="flex-1 border-b border-blue-100/50"></div>
                          ))}
                        </div>
                      </div>

                      {/* Right Page Content */}
                      <div className="relative p-6 pl-10">
                        {/* Monthly Goals */}
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <Target className="w-4 h-4" />
                            Monthly Goals
                          </h3>
                          <div className="space-y-3 pl-4">
                            {[
                              { text: 'Launch new product feature', progress: 85, status: 'On Track' },
                              { text: 'Read 3 books this month', progress: 60, status: 'Behind' },
                              { text: 'Run 100 miles total', progress: 75, status: 'On Track' },
                              { text: 'Save $1000', progress: 90, status: 'Ahead' },
                              { text: 'Learn 50 new words', progress: 40, status: 'Behind' }
                            ].map((goal, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-700" style={{ fontFamily: 'cursive' }}>
                                    • {goal.text}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    goal.status === 'Ahead' ? 'bg-green-100 text-green-600' :
                                    goal.status === 'On Track' ? 'bg-blue-100 text-blue-600' :
                                    'bg-red-100 text-red-600'
                                  }`}>
                                    {goal.status}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 ml-4">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      goal.status === 'Ahead' ? 'bg-green-500' :
                                      goal.status === 'On Track' ? 'bg-blue-500' :
                                      'bg-red-400'
                                    }`}
                                    style={{ width: `${goal.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Monthly Highlights */}
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                            <Heart className="w-4 h-4" />
                            Monthly Highlights
                          </h3>
                          <div className="space-y-3 pl-4">
                            <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                              <div className="text-sm font-medium text-yellow-800">Best Day</div>
                              <div className="text-xs text-yellow-700" style={{ fontFamily: 'cursive' }}>
                                {format(addDays(currentDate, -10), 'MMM dd')} - Completed all goals and felt amazing!
                              </div>
                            </div>
                            <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                              <div className="text-sm font-medium text-green-800">Achievement</div>
                              <div className="text-xs text-green-700" style={{ fontFamily: 'cursive' }}>
                                Maintained 21-day exercise streak
                              </div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                              <div className="text-sm font-medium text-blue-800">Learning</div>
                              <div className="text-xs text-blue-700" style={{ fontFamily: 'cursive' }}>
                                Morning routines really boost productivity
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Next Month Preview */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <PenTool className="w-4 h-4" />
                            Next Month Plans
                          </h3>
                          <div className="pl-4 space-y-2">
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'cursive' }}>
                              • Start new fitness challenge
                            </p>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'cursive' }}>
                              • Plan vacation for summer
                            </p>
                            <p className="text-sm text-gray-600" style={{ fontFamily: 'cursive' }}>
                              • Begin learning Spanish
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Page Number */}
                      <div className="absolute bottom-4 right-6 text-xs text-gray-400">
                        {format(addDays(currentDate, 30), 'MMMM yyyy')}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 px-4">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg shadow hover:shadow-md transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Previous</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('daily')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === 'daily'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white/90 hover:shadow-md'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setCurrentView('weekly')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === 'weekly'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white/90 hover:shadow-md'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setCurrentView('monthly')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentView === 'monthly'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white/90 hover:shadow-md'
                }`}
              >
                Monthly
              </button>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg shadow hover:shadow-md transition-all"
            >
              <span className="text-sm">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-8 -right-8 w-32 h-32 opacity-50">
          <Bookmark className="w-full h-full text-red-500" />
        </div>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 opacity-30 rotate-12">
          <Coffee className="w-full h-full text-amber-800" />
        </div>
      </div>
    </div>
  );
}