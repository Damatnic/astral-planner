'use client';

import { useState, useEffect } from 'react';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, Coffee, Feather, Heart, Star, Sun, Moon, Cloud, Bookmark, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlannerEntry {
  id: string;
  text: string;
  type: 'task' | 'note' | 'habit' | 'gratitude' | 'reflection';
  completed?: boolean;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  font: string;
}

const handwritingFonts = [
  'Caveat',
  'Dancing Script',
  'Kalam',
  'Architects Daughter',
  'Indie Flower',
  'Shadows Into Light',
  'Permanent Marker',
  'Amatic SC'
];

const inkColors = [
  '#1e293b', // Dark blue-gray
  '#374151', // Gray
  '#1f2937', // Dark gray
  '#0f172a', // Very dark
  '#7c3aed', // Purple
  '#dc2626', // Red
  '#059669', // Green
  '#ea580c'  // Orange
];

export default function PhysicalPlannerView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [currentWriting, setCurrentWriting] = useState('');
  const [writingPosition, setWritingPosition] = useState({ x: 0, y: 0 });
  const [selectedPen, setSelectedPen] = useState(inkColors[0]);
  const [pageFlipping, setPageFlipping] = useState(false);
  const [weatherMood, setWeatherMood] = useState('sunny');
  const [paperTexture, setPaperTexture] = useState('lined');

  // Simulate realistic handwriting with slight variations
  const getHandwritingStyle = () => ({
    fontFamily: handwritingFonts[Math.floor(Math.random() * handwritingFonts.length)],
    transform: `rotate(${-2 + Math.random() * 4}deg) scale(${0.9 + Math.random() * 0.2})`,
    color: selectedPen,
    textShadow: '0 1px 2px rgba(0,0,0,0.1)'
  });

  // Add entry when user clicks on planner
  const handlePlannerClick = (e: React.MouseEvent) => {
    if (!isWriting) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newEntry: PlannerEntry = {
      id: Date.now().toString(),
      text: currentWriting,
      type: 'note',
      x,
      y,
      color: selectedPen,
      size: 14 + Math.random() * 4,
      rotation: -2 + Math.random() * 4,
      font: handwritingFonts[Math.floor(Math.random() * handwritingFonts.length)]
    };
    
    setEntries(prev => [...prev, newEntry]);
    setCurrentWriting('');
    setIsWriting(false);
  };

  const handlePageTurn = (direction: 'prev' | 'next') => {
    setPageFlipping(true);
    setTimeout(() => {
      if (currentView === 'daily') {
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
      } else if (currentView === 'weekly') {
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
      } else {
        setCurrentDate(direction === 'next' ? addDays(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1), 0) : addDays(new Date(currentDate.getFullYear(), currentDate.getMonth()), 0));
      }
      setPageFlipping(false);
    }, 300);
  };

  const renderPaperTexture = () => {
    if (paperTexture === 'lined') {
      return (
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {/* Horizontal lines */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-b border-blue-200"
              style={{
                top: `${60 + i * 25}px`,
                height: '1px',
                transform: `rotate(${-0.5 + Math.random()}deg)`
              }}
            />
          ))}
          {/* Margin line */}
          <div
            className="absolute h-full border-l-2 border-red-300"
            style={{
              left: '80px',
              transform: `rotate(${-1 + Math.random() * 2}deg)`
            }}
          />
        </div>
      );
    } else if (paperTexture === 'dotted') {
      return (
        <div className="absolute inset-0 pointer-events-none opacity-30">
          {[...Array(40)].map((_, row) =>
            [...Array(60)].map((_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute w-1 h-1 bg-gray-300 rounded-full"
                style={{
                  left: `${20 + col * 15}px`,
                  top: `${20 + row * 20}px`,
                  transform: `translate(${-2 + Math.random() * 4}px, ${-2 + Math.random() * 4}px)`
                }}
              />
            ))
          )}
        </div>
      );
    } else {
      return (
        <div className="absolute inset-0 pointer-events-none opacity-10">
          {/* Grid lines */}
          {[...Array(30)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full border-b border-gray-300"
              style={{ top: `${20 + i * 25}px` }}
            />
          ))}
          {[...Array(50)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full border-l border-gray-300"
              style={{ left: `${20 + i * 20}px` }}
            />
          ))}
        </div>
      );
    }
  };

  const renderDailyView = () => (
    <div className="flex w-full h-full">
      {/* Left Page */}
      <div className="w-1/2 h-full relative bg-gradient-to-br from-yellow-50 via-white to-yellow-50 border-r-2 border-yellow-200 shadow-inner">
        {/* Paper texture */}
        {renderPaperTexture()}
        
        {/* Holes for spiral binding */}
        <div className="absolute right-0 top-4 bottom-4 flex flex-col justify-around">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 shadow-inner"
              style={{
                transform: `translateX(12px) rotate(${-5 + Math.random() * 10}deg)`
              }}
            />
          ))}
        </div>
        
        {/* Page content */}
        <div className="p-8 pr-16 h-full overflow-hidden">
          {/* Date header */}
          <div className="mb-6 relative">
            <div 
              className="text-3xl font-bold mb-2"
              style={{
                fontFamily: 'Caveat',
                color: inkColors[0],
                transform: 'rotate(-1deg)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {format(currentDate, 'EEEE')}
            </div>
            <div 
              className="text-lg mb-4"
              style={{
                fontFamily: 'Kalam',
                color: inkColors[1],
                transform: 'rotate(0.5deg)'
              }}
            >
              {format(currentDate, 'MMMM d, yyyy')}
            </div>
            
            {/* Weather mood */}
            <div className="absolute top-0 right-8 flex items-center gap-2">
              {weatherMood === 'sunny' && <Sun className="w-8 h-8 text-yellow-500" />}
              {weatherMood === 'cloudy' && <Cloud className="w-8 h-8 text-gray-400" />}
              {weatherMood === 'moon' && <Moon className="w-8 h-8 text-blue-400" />}
              <div 
                className="text-sm"
                style={{
                  fontFamily: 'Indie Flower',
                  color: inkColors[2],
                  transform: 'rotate(-2deg)'
                }}
              >
                {weatherMood === 'sunny' ? 'Beautiful day!' : weatherMood === 'cloudy' ? 'Cozy vibes' : 'Peaceful evening'}
              </div>
            </div>
          </div>
          
          {/* Schedule section */}
          <div className="mb-8">
            <h3 
              className="text-xl font-semibold mb-4 flex items-center gap-2"
              style={{
                fontFamily: 'Dancing Script',
                color: inkColors[3],
                transform: 'rotate(-0.5deg)'
              }}
            >
              <Coffee className="w-5 h-5 opacity-60" />
              Today's Plan
            </h3>
            
            <div className="space-y-3 ml-4">
              {[
                { time: '7:00 AM', task: 'Morning meditation & coffee ☕', completed: true },
                { time: '9:00 AM', task: 'Deep work session - Project Alpha', completed: false },
                { time: '11:30 AM', task: 'Team meeting (remember to ask about budget)', completed: false },
                { time: '1:00 PM', task: 'Lunch break & walk outside', completed: false },
                { time: '3:00 PM', task: 'Client calls - Sarah & Mike', completed: false },
                { time: '6:00 PM', task: 'Gym workout 💪', completed: false },
                { time: '8:00 PM', task: 'Family dinner & relax', completed: false }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3"
                  style={{
                    transform: `rotate(${-1 + Math.random() * 2}deg) translateX(${-2 + Math.random() * 4}px)`
                  }}
                >
                  <div 
                    className="text-sm font-medium min-w-[70px]"
                    style={{
                      fontFamily: handwritingFonts[index % handwritingFonts.length],
                      color: inkColors[4],
                      fontSize: `${12 + Math.random() * 2}px`
                    }}
                  >
                    {item.time}
                  </div>
                  <div 
                    className={`flex-1 ${item.completed ? 'line-through opacity-60' : ''}`}
                    style={{
                      fontFamily: handwritingFonts[(index + 2) % handwritingFonts.length],
                      color: item.completed ? inkColors[6] : inkColors[index % inkColors.length],
                      fontSize: `${13 + Math.random() * 3}px`,
                      lineHeight: '1.6'
                    }}
                  >
                    {item.completed ? '✓ ' : '• '}{item.task}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quick notes */}
          <div>
            <h3 
              className="text-lg font-semibold mb-3 flex items-center gap-2"
              style={{
                fontFamily: 'Architects Daughter',
                color: inkColors[5],
                transform: 'rotate(1deg)'
              }}
            >
              <PenTool className="w-4 h-4 opacity-60" />
              Quick Notes
            </h3>
            <div className="space-y-2 ml-4">
              {[
                'Remember to call mom this evening',
                'Pick up groceries: milk, bread, avocados',
                'Research vacation destinations for summer',
                'Book dentist appointment',
                'Read that article Sarah recommended'
              ].map((note, index) => (
                <div 
                  key={index}
                  className="text-sm"
                  style={{
                    fontFamily: handwritingFonts[(index + 3) % handwritingFonts.length],
                    color: inkColors[(index + 2) % inkColors.length],
                    transform: `rotate(${-1.5 + Math.random() * 3}deg) translateX(${-3 + Math.random() * 6}px)`,
                    fontSize: `${12 + Math.random() * 2}px`,
                    lineHeight: '1.8'
                  }}
                >
                  • {note}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Coffee stain */}
        <div 
          className="absolute bottom-20 right-20 w-12 h-12 rounded-full bg-yellow-800 opacity-10"
          style={{
            transform: 'rotate(15deg)',
            background: 'radial-gradient(circle, rgba(120,53,15,0.15) 0%, rgba(120,53,15,0.05) 70%, transparent 100%)'
          }}
        />
      </div>
      
      {/* Right Page */}
      <div className="w-1/2 h-full relative bg-gradient-to-bl from-yellow-50 via-white to-yellow-50 shadow-inner">
        {renderPaperTexture()}
        
        <div className="p-8 pl-16 h-full overflow-hidden">
          {/* Goals & Priorities */}
          <div className="mb-8">
            <h3 
              className="text-xl font-semibold mb-4 flex items-center gap-2"
              style={{
                fontFamily: 'Caveat',
                color: inkColors[4],
                transform: 'rotate(-1deg)'
              }}
            >
              <Star className="w-5 h-5 opacity-60" />
              Today's Focus
            </h3>
            
            <div className="space-y-4 ml-4">
              {[
                { priority: 'HIGH', task: 'Finish the client presentation', progress: 75 },
                { priority: 'MED', task: 'Review team\'s code submissions', progress: 30 },
                { priority: 'LOW', task: 'Organize project files', progress: 0 }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="space-y-2"
                  style={{
                    transform: `rotate(${-0.5 + Math.random()}deg)`
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className={`text-xs px-2 py-1 rounded ${
                        item.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                        item.priority === 'MED' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}
                      style={{
                        fontFamily: 'Amatic SC',
                        transform: 'rotate(-2deg)'
                      }}
                    >
                      {item.priority}
                    </span>
                    <span 
                      className="font-medium"
                      style={{
                        fontFamily: handwritingFonts[index % handwritingFonts.length],
                        color: inkColors[(index + 4) % inkColors.length],
                        fontSize: `${14 + Math.random() * 2}px`
                      }}
                    >
                      {item.task}
                    </span>
                  </div>
                  
                  {/* Hand-drawn progress bar */}
                  <div className="ml-6 relative">
                    <svg width="150" height="8" className="overflow-visible">
                      <path
                        d={`M0,4 Q${item.progress * 1.5 / 2},${2 + Math.random() * 2} ${item.progress * 1.5},4`}
                        stroke={inkColors[6]}
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        style={{
                          filter: 'url(#roughPaper)'
                        }}
                      />
                      <path
                        d="M0,4 Q75,2 150,4"
                        stroke={inkColors[1]}
                        strokeWidth="1"
                        fill="none"
                        opacity="0.3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span 
                      className="absolute -right-8 -top-1 text-xs"
                      style={{
                        fontFamily: 'Kalam',
                        color: inkColors[2],
                        transform: 'rotate(5deg)'
                      }}
                    >
                      {item.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mood & Gratitude */}
          <div className="mb-8">
            <h3 
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{
                fontFamily: 'Shadows Into Light',
                color: inkColors[6],
                transform: 'rotate(0.5deg)'
              }}
            >
              <Heart className="w-5 h-5 opacity-60" />
              Gratitude & Mood
            </h3>
            
            <div className="ml-4 space-y-3">
              <div>
                <span 
                  className="text-sm font-medium"
                  style={{
                    fontFamily: 'Indie Flower',
                    color: inkColors[3]
                  }}
                >
                  Today I feel: 
                </span>
                <div className="flex gap-2 mt-2">
                  {['😊', '😌', '💪', '🙏', '✨'].map((emoji, i) => (
                    <span 
                      key={i} 
                      className={`text-2xl cursor-pointer transition-transform hover:scale-125 ${i === 0 ? 'scale-125' : 'opacity-60'}`}
                      style={{
                        transform: `rotate(${-10 + Math.random() * 20}deg)`
                      }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <span 
                  className="text-sm font-medium"
                  style={{
                    fontFamily: 'Dancing Script',
                    color: inkColors[5],
                    fontSize: '16px'
                  }}
                >
                  I'm grateful for:
                </span>
                {[
                  'The peaceful morning coffee ritual',
                  'My supportive team at work',
                  'Good health and energy today',
                  'Learning something new every day'
                ].map((gratitude, index) => (
                  <div 
                    key={index}
                    className="text-sm ml-4"
                    style={{
                      fontFamily: handwritingFonts[(index + 5) % handwritingFonts.length],
                      color: inkColors[(index + 6) % inkColors.length],
                      transform: `rotate(${-1 + Math.random() * 2}deg)`,
                      fontSize: `${13 + Math.random() * 2}px`,
                      lineHeight: '1.6'
                    }}
                  >
                    • {gratitude}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Habit Tracker */}
          <div>
            <h3 
              className="text-lg font-semibold mb-3 flex items-center gap-2"
              style={{
                fontFamily: 'Permanent Marker',
                color: inkColors[7],
                transform: 'rotate(-0.8deg)'
              }}
            >
              <Star className="w-5 h-5 opacity-60" />
              Daily Habits
            </h3>
            
            <div className="ml-4 space-y-2">
              {[
                { habit: 'Water (8 cups)', completed: 5, total: 8 },
                { habit: 'Steps taken', completed: 7234, total: 10000 },
                { habit: 'Deep breaths', completed: 3, total: 5 },
                { habit: 'Protein servings', completed: 2, total: 3 }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between"
                  style={{
                    transform: `rotate(${-0.5 + Math.random()}deg)`
                  }}
                >
                  <span 
                    className="text-sm"
                    style={{
                      fontFamily: handwritingFonts[(index + 1) % handwritingFonts.length],
                      color: inkColors[index % inkColors.length],
                      fontSize: `${13 + Math.random() * 2}px`
                    }}
                  >
                    {item.habit}
                  </span>
                  <div className="flex gap-1">
                    {item.habit === 'Water (8 cups)' ? (
                      [...Array(8)].map((_, i) => (
                        <div 
                          key={i}
                          className={`w-4 h-4 rounded-full border-2 ${
                            i < item.completed ? 'bg-blue-400 border-blue-500' : 'border-gray-300'
                          }`}
                          style={{
                            transform: `rotate(${-5 + Math.random() * 10}deg)`
                          }}
                        />
                      ))
                    ) : (
                      <span 
                        className="text-sm font-medium"
                        style={{
                          fontFamily: 'Amatic SC',
                          color: inkColors[(index + 3) % inkColors.length],
                          fontSize: '16px'
                        }}
                      >
                        {item.completed.toLocaleString()}/{item.total.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Small doodle in corner */}
        <div className="absolute bottom-16 right-16">
          <svg width="40" height="40" className="opacity-40">
            <path
              d="M5,20 Q15,5 25,15 Q35,25 30,35 Q20,30 15,25 Q5,15 5,20"
              stroke={inkColors[4]}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="20" cy="20" r="2" fill={inkColors[6]} opacity="0.6" />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 p-6 flex items-center justify-center">
      {/* Desk environment */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139,69,19,0.1) 0%, rgba(101,67,33,0.05) 70%, transparent 100%)',
            backgroundSize: '200px 200px'
          }}
        />
      </div>
      
      {/* Desk accessories */}
      <div className="absolute top-8 left-8 opacity-60">
        <Coffee className="w-12 h-12 text-amber-800" />
      </div>
      <div className="absolute top-12 right-12 opacity-40 transform rotate-12">
        <Bookmark className="w-8 h-8 text-red-600" />
      </div>
      
      {/* Main planner */}
      <div className="relative max-w-6xl w-full">
        {/* Planner shadow */}
        <div className="absolute -inset-6 bg-black/20 rounded-xl blur-2xl transform rotate-1 -z-10" />
        
        {/* Spiral binding */}
        <div className="absolute left-1/2 top-0 bottom-0 -ml-4 flex flex-col justify-around pointer-events-none z-20">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="w-8 h-8 rounded-full border-4 border-gray-500 shadow-lg"
              style={{
                background: 'linear-gradient(145deg, #e5e7eb 0%, #9ca3af 100%)',
                transform: `rotate(${-5 + Math.random() * 10}deg)`
              }}
            />
          ))}
        </div>
        
        {/* Planner cover/binding */}
        <div className="relative bg-gradient-to-r from-amber-900 via-yellow-900 to-amber-900 rounded-xl p-3 shadow-2xl">
          <div className="absolute left-1/2 top-0 bottom-0 w-12 -ml-6 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none z-10 rounded-lg" />
          
          {/* Page flip animation container */}
          <motion.div
            className="bg-white rounded-lg shadow-inner overflow-hidden relative"
            style={{ height: '800px' }}
            animate={{
              rotateY: pageFlipping ? (Math.random() > 0.5 ? 180 : -180) : 0
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentView}-${currentDate.toISOString()}`}
                initial={{ opacity: 0, x: pageFlipping ? 100 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: pageFlipping ? -100 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
                onClick={handlePlannerClick}
              >
                {currentView === 'daily' && renderDailyView()}
                {/* Add weekly/monthly views here later */}
              </motion.div>
            </AnimatePresence>
            
            {/* Interactive entries */}
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                className="absolute pointer-events-none"
                style={{
                  left: entry.x,
                  top: entry.y,
                  color: entry.color,
                  fontSize: entry.size,
                  fontFamily: entry.font,
                  transform: `rotate(${entry.rotation}deg)`,
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  userSelect: 'none'
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {entry.text}
              </motion.div>
            ))}
          </motion.div>
          
          {/* Page navigation */}
          <div className="flex items-center justify-between mt-6 px-4">
            <motion.button
              onClick={() => handlePageTurn('prev')}
              className="flex items-center gap-2 px-6 py-3 bg-amber-100 hover:bg-amber-200 rounded-lg shadow-md transition-all font-medium text-amber-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </motion.button>
            
            <div className="flex items-center gap-4">
              {/* View toggles */}
              {['daily', 'weekly', 'monthly'].map((view) => (
                <motion.button
                  key={view}
                  onClick={() => setCurrentView(view as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    currentView === view
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    fontFamily: 'Caveat',
                    fontSize: '18px'
                  }}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </motion.button>
              ))}
              
              {/* Pen color selector */}
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4 text-amber-700" />
                <div className="flex gap-1">
                  {inkColors.slice(0, 4).map((color, index) => (
                    <button
                      key={color}
                      onClick={() => setSelectedPen(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        selectedPen === color ? 'border-white scale-110 shadow-lg' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <motion.button
              onClick={() => handlePageTurn('next')}
              className="flex items-center gap-2 px-6 py-3 bg-amber-100 hover:bg-amber-200 rounded-lg shadow-md transition-all font-medium text-amber-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        
        {/* Page number indicator */}
        <div 
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-amber-700 opacity-70"
          style={{
            fontFamily: 'Kalam',
            transform: 'translateX(-50%) rotate(-1deg)'
          }}
        >
          Day {format(currentDate, 'DDD')} of {format(new Date(currentDate.getFullYear(), 11, 31), 'DDD')}
        </div>
      </div>
      
      {/* Writing input modal */}
      {isWriting && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsWriting(false)}
        >
          <div 
            className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Caveat' }}>
              Add to planner
            </h3>
            <textarea
              value={currentWriting}
              onChange={(e) => setCurrentWriting(e.target.value)}
              placeholder="Write something..."
              className="w-full h-24 border rounded-lg p-3 resize-none"
              style={{ fontFamily: 'Kalam' }}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setIsWriting(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (currentWriting.trim()) {
                    // Add logic to place the text
                    setIsWriting(false);
                  }
                }}
                className="flex-1 py-2 bg-amber-600 text-white rounded-lg font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Paper texture filter */}
      <svg width="0" height="0">
        <defs>
          <filter id="roughPaper">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="1" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}