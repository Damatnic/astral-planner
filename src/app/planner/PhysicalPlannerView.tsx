'use client';

import { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parse, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, Coffee, Feather, Heart, Star, Sun, Moon, Cloud, Bookmark, PenTool, Mic, MicOff, Download, Shuffle, Sparkles, Zap, Settings, Calendar, Users, Share2, Save, CloudDrizzle, Palette, Layout, Wifi, WifiOff } from 'lucide-react';
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

interface ScheduleItem {
  id: string;
  time: string;
  task: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  duration?: number; // in minutes
  category?: string;
  isDragging?: boolean;
}

interface HabitItem {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  color: string;
  streak: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  endTime?: string;
  type: 'event' | 'meeting' | 'reminder' | 'deadline';
  color: string;
  location?: string;
  description?: string;
}

interface PlannerSettings {
  theme: 'default' | 'minimalist' | 'colorful' | 'dark';
  layout: 'daily' | 'weekly' | 'monthly';
  showHabits: boolean;
  showCalendar: boolean;
  showWeather: boolean;
  autoSave: boolean;
  collaborationMode: boolean;
}

interface Template {
  id: string;
  name: string;
  scheduleItems: ScheduleItem[];
  notes: string[];
  habits: HabitItem[];
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
  // Initialize with null to prevent hydration issues
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  
  // Initialize date on client-side only
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);
  
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [currentWriting, setCurrentWriting] = useState('');
  const [writingPosition, setWritingPosition] = useState({ x: 0, y: 0 });
  const [selectedPen, setSelectedPen] = useState(inkColors[0]);
  const [pageFlipping, setPageFlipping] = useState(false);
  const [weatherMood, setWeatherMood] = useState('sunny');
  const [paperTexture, setPaperTexture] = useState('lined');
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<number | null>(null);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    { id: '1', time: '7:00 AM', task: 'Morning meditation & coffee ☕', completed: true, priority: 'medium', duration: 30, category: 'wellness' },
    { id: '2', time: '9:00 AM', task: 'Deep work session - Project Alpha', completed: false, priority: 'high', duration: 120, category: 'work' },
    { id: '3', time: '11:30 AM', task: 'Team meeting (remember to ask about budget)', completed: false, priority: 'high', duration: 60, category: 'work' },
    { id: '4', time: '1:00 PM', task: 'Lunch break & walk outside', completed: false, priority: 'medium', duration: 45, category: 'wellness' },
    { id: '5', time: '3:00 PM', task: 'Client calls - Sarah & Mike', completed: false, priority: 'high', duration: 90, category: 'work' },
    { id: '6', time: '6:00 PM', task: 'Gym workout 💪', completed: false, priority: 'medium', duration: 60, category: 'fitness' },
    { id: '7', time: '8:00 PM', task: 'Family dinner & relax', completed: false, priority: 'low', duration: 90, category: 'personal' }
  ]);
  const [quickNotes, setQuickNotes] = useState([
    'Remember to call mom this evening',
    'Pick up groceries: milk, bread, avocados',
    'Research vacation destinations for summer',
    'Book dentist appointment',
    'Read that article Sarah recommended'
  ]);
  const [habitItems, setHabitItems] = useState<HabitItem[]>([
    { id: '1', name: 'Water intake', target: 8, current: 5, unit: 'glasses', color: '#3B82F6', streak: 3 },
    { id: '2', name: 'Steps', target: 10000, current: 7234, unit: 'steps', color: '#10B981', streak: 7 },
    { id: '3', name: 'Reading', target: 30, current: 15, unit: 'minutes', color: '#8B5CF6', streak: 2 },
    { id: '4', name: 'Meditation', target: 15, current: 10, unit: 'minutes', color: '#F59E0B', streak: 5 }
  ]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Enhanced planner features
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    { id: '1', title: 'Team Meeting', time: '09:00', endTime: '10:00', type: 'meeting', color: '#3B82F6', location: 'Conference Room A' },
    { id: '2', title: 'Project Deadline', time: '17:00', type: 'deadline', color: '#EF4444', description: 'Submit final report' },
    { id: '3', title: 'Lunch with Sarah', time: '12:30', endTime: '13:30', type: 'event', color: '#10B981', location: 'Downtown Cafe' }
  ]);
  const [settings, setSettings] = useState<PlannerSettings>({
    theme: 'default',
    layout: 'daily',
    showHabits: true,
    showCalendar: true,
    showWeather: true,
    autoSave: true,
    collaborationMode: false
  });
  const [weatherInfo, setWeatherInfo] = useState({ temp: '22°C', condition: 'Sunny', icon: '☀️' });
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>(['You', 'Sarah K.', 'Mike R.']);
  const [showSettings, setShowSettings] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

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
    if (!currentDate) return;
    setPageFlipping(true);
    setTimeout(() => {
      if (!currentDate) return;
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

  const updateScheduleItem = (index: number, newTask: string) => {
    setScheduleItems(prev => prev.map((item, i) => 
      i === index ? { ...item, task: newTask } : item
    ));
    setEditingScheduleIndex(null);
  };

  const updateNote = (index: number, newNote: string) => {
    setQuickNotes(prev => prev.map((note, i) => 
      i === index ? newNote : note
    ));
    setEditingNoteIndex(null);
  };

  const toggleTaskCompletion = (index: number) => {
    setScheduleItems(prev => prev.map((item, i) => 
      i === index ? { ...item, completed: !item.completed } : item
    ));
  };

  const addNewScheduleItem = () => {
    const newId = (scheduleItems.length + 1).toString();
    setScheduleItems(prev => [...prev, { 
      id: newId, 
      time: '9:00 PM', 
      task: 'New task', 
      completed: false, 
      priority: 'medium',
      duration: 30,
      category: 'general'
    }]);
  };

  const addNewNote = () => {
    setQuickNotes(prev => [...prev, 'New note']);
  };

  // Drag and Drop functionality
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const dragIndex = scheduleItems.findIndex(item => item.id === draggedItem);
    if (dragIndex === -1) return;

    const newItems = [...scheduleItems];
    const draggedScheduleItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(targetIndex, 0, draggedScheduleItem);
    
    setScheduleItems(newItems);
    setDraggedItem(null);
  };

  // Voice-to-text functionality
  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition not supported in your browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsVoiceRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const newNote = `🎤 ${transcript}`;
      setQuickNotes(prev => [...prev, newNote]);
      setIsVoiceRecording(false);
    };

    recognition.onerror = () => {
      setIsVoiceRecording(false);
    };

    recognition.onend = () => {
      setIsVoiceRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Smart scheduling and suggestions
  const autoScheduleTask = () => {
    const availableSlots = [];
    const workingHours = [];
    
    // Find available 30-minute slots between 9 AM and 5 PM
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
        const isOccupied = scheduleItems.some(item => item.time === timeSlot);
        if (!isOccupied) {
          availableSlots.push(timeSlot);
        }
      }
    }

    if (availableSlots.length > 0) {
      const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      addNewScheduleItemWithTime(randomSlot);
    }
  };

  const addNewScheduleItemWithTime = (time?: string) => {
    const newTime = time || '9:00 AM';
    const newId = (scheduleItems.length + 1).toString();
    setScheduleItems(prev => [...prev, { 
      id: newId, 
      time: newTime, 
      task: 'New task', 
      completed: false, 
      priority: 'medium',
      duration: 30,
      category: 'general'
    }]);
  };

  // Habit tracking
  const updateHabitProgress = (habitId: string, increment: number) => {
    setHabitItems(prev => prev.map(habit => 
      habit.id === habitId 
        ? { 
            ...habit, 
            current: Math.min(habit.target, Math.max(0, habit.current + increment)),
            streak: habit.current + increment >= habit.target ? habit.streak + 1 : habit.streak
          }
        : habit
    ));
  };

  // Template system
  const applyTemplate = (templateId: string) => {
    const templates: Template[] = [
      {
        id: 'productive-day',
        name: 'Productive Day',
        scheduleItems: [
          { id: 't1', time: '6:00 AM', task: 'Morning routine & exercise', completed: false, priority: 'high', duration: 60, category: 'wellness' },
          { id: 't2', time: '8:00 AM', task: 'Breakfast & planning', completed: false, priority: 'medium', duration: 30, category: 'personal' },
          { id: 't3', time: '9:00 AM', task: 'Deep work - Priority project', completed: false, priority: 'high', duration: 180, category: 'work' },
          { id: 't4', time: '12:00 PM', task: 'Lunch & short walk', completed: false, priority: 'medium', duration: 45, category: 'wellness' },
          { id: 't5', time: '2:00 PM', task: 'Meetings & collaboration', completed: false, priority: 'high', duration: 120, category: 'work' },
          { id: 't6', time: '5:00 PM', task: 'Admin tasks & email', completed: false, priority: 'low', duration: 60, category: 'work' },
          { id: 't7', time: '7:00 PM', task: 'Personal time & reflection', completed: false, priority: 'medium', duration: 90, category: 'personal' }
        ],
        notes: [
          'Focus on the most important task first',
          'Take regular breaks every 2 hours',
          'Review progress at end of day',
          'Prepare for tomorrow before finishing'
        ],
        habits: [
          { id: 'h1', name: 'Deep focus blocks', target: 3, current: 0, unit: 'blocks', color: '#EF4444', streak: 0 },
          { id: 'h2', name: 'Physical activity', target: 60, current: 0, unit: 'minutes', color: '#10B981', streak: 0 }
        ]
      },
      {
        id: 'wellness-focus',
        name: 'Wellness Focus',
        scheduleItems: [
          { id: 'w1', time: '7:00 AM', task: 'Meditation & mindfulness', completed: false, priority: 'high', duration: 20, category: 'wellness' },
          { id: 'w2', time: '8:00 AM', task: 'Healthy breakfast prep', completed: false, priority: 'medium', duration: 30, category: 'wellness' },
          { id: 'w3', time: '10:00 AM', task: 'Nature walk or outdoor time', completed: false, priority: 'high', duration: 45, category: 'wellness' },
          { id: 'w4', time: '12:00 PM', task: 'Nutritious lunch & hydration', completed: false, priority: 'medium', duration: 30, category: 'wellness' },
          { id: 'w5', time: '3:00 PM', task: 'Gentle yoga or stretching', completed: false, priority: 'medium', duration: 30, category: 'fitness' },
          { id: 'w6', time: '6:00 PM', task: 'Home-cooked dinner', completed: false, priority: 'medium', duration: 45, category: 'wellness' },
          { id: 'w7', time: '8:00 PM', task: 'Reading & relaxation', completed: false, priority: 'low', duration: 60, category: 'personal' }
        ],
        notes: [
          'Focus on mental and physical well-being',
          'Stay hydrated throughout the day',
          'Practice gratitude',
          'Get 8 hours of quality sleep'
        ],
        habits: [
          { id: 'hw1', name: 'Mindful minutes', target: 20, current: 0, unit: 'minutes', color: '#8B5CF6', streak: 0 },
          { id: 'hw2', name: 'Water glasses', target: 8, current: 0, unit: 'glasses', color: '#3B82F6', streak: 0 }
        ]
      }
    ];

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setScheduleItems(template.scheduleItems);
      setQuickNotes(template.notes);
      setHabitItems(template.habits);
      setShowTemplates(false);
    }
  };

  // Export functionality
  const exportToPDF = () => {
    // This would typically use a library like jsPDF or react-pdf
    alert('Export to PDF feature - would integrate with PDF generation library');
  };

  const exportToImage = () => {
    // This would capture the planner as an image
    alert('Export to Image feature - would capture planner as PNG/JPG');
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
              {currentDate ? format(currentDate, 'EEEE') : ''}
            </div>
            <div 
              className="text-lg mb-4"
              style={{
                fontFamily: 'Kalam',
                color: inkColors[1],
                transform: 'rotate(0.5deg)'
              }}
            >
              {currentDate ? format(currentDate, 'MMMM d, yyyy') : ''}
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
              {scheduleItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex items-start gap-3 relative group cursor-move transition-all duration-200 ${
                    draggedItem === item.id ? 'opacity-50 scale-95' : 'hover:bg-yellow-50 hover:bg-opacity-30'
                  } p-2 rounded-lg`}
                  style={{
                    transform: `rotate(${-1 + Math.random() * 2}deg) translateX(${-2 + Math.random() * 4}px)`
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  {/* Priority indicator */}
                  <div 
                    className={`w-1 h-6 rounded-full ${
                      item.priority === 'high' ? 'bg-red-400' : 
                      item.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    title={`Priority: ${item.priority}`}
                  />
                  
                  <div 
                    className="text-sm font-medium min-w-[70px]"
                    style={{
                      fontFamily: handwritingFonts[index % handwritingFonts.length],
                      color: inkColors[4],
                      fontSize: `${12 + Math.random() * 2}px`
                    }}
                  >
                    {item.time}
                    {item.duration && (
                      <div className="text-xs text-gray-400">
                        {item.duration}min
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex items-center gap-2">
                    <button
                      onClick={() => toggleTaskCompletion(index)}
                      className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:scale-110 transition-transform"
                      style={{
                        color: item.completed ? inkColors[6] : inkColors[index % inkColors.length],
                        fontSize: '14px'
                      }}
                    >
                      {item.completed ? '✓' : '○'}
                    </button>
                    
                    {editingScheduleIndex === index ? (
                      <input
                        type="text"
                        value={item.task}
                        onChange={(e) => setScheduleItems(prev => prev.map((scheduleItem, i) => 
                          i === index ? { ...scheduleItem, task: e.target.value } : scheduleItem
                        ))}
                        onBlur={() => setEditingScheduleIndex(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingScheduleIndex(null);
                          }
                        }}
                        className="flex-1 bg-transparent border-none outline-none"
                        style={{
                          fontFamily: handwritingFonts[(index + 2) % handwritingFonts.length],
                          color: item.completed ? inkColors[6] : inkColors[index % inkColors.length],
                          fontSize: `${13 + Math.random() * 3}px`,
                          lineHeight: '1.6'
                        }}
                        autoFocus
                      />
                    ) : (
                      <div 
                        className={`flex-1 cursor-pointer hover:bg-yellow-100 hover:bg-opacity-20 px-1 rounded ${item.completed ? 'line-through opacity-60' : ''}`}
                        style={{
                          fontFamily: handwritingFonts[(index + 2) % handwritingFonts.length],
                          color: item.completed ? inkColors[6] : inkColors[index % inkColors.length],
                          fontSize: `${13 + Math.random() * 3}px`,
                          lineHeight: '1.6'
                        }}
                        onClick={() => setEditingScheduleIndex(index)}
                      >
                        {item.task}
                        {item.category && (
                          <span className="text-xs text-gray-400 ml-2">#{item.category}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Drag handle (visible on hover) */}
                  <div className="opacity-0 group-hover:opacity-50 text-gray-400 text-xs transition-opacity">
                    ⋮⋮
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addNewScheduleItem}
              className="ml-4 mt-2 px-3 py-1 text-xs bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-800 transition-colors"
              style={{ fontFamily: 'Kalam' }}
            >
              + Add Task
            </button>
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
              {quickNotes.map((note, index) => (
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
                  • {editingNoteIndex === index ? (
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setQuickNotes(prev => prev.map((noteItem, i) => 
                        i === index ? e.target.value : noteItem
                      ))}
                      onBlur={() => setEditingNoteIndex(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingNoteIndex(null);
                        }
                      }}
                      className="bg-transparent border-none outline-none w-full"
                      style={{
                        fontFamily: handwritingFonts[(index + 3) % handwritingFonts.length],
                        color: inkColors[(index + 2) % inkColors.length],
                        fontSize: `${12 + Math.random() * 2}px`
                      }}
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="cursor-pointer hover:bg-yellow-100 hover:bg-opacity-20 px-1 rounded"
                      onClick={() => setEditingNoteIndex(index)}
                    >
                      {note}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addNewNote}
              className="ml-4 mt-2 px-3 py-1 text-xs bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-800 transition-colors"
              style={{ fontFamily: 'Kalam' }}
            >
              + Add Note
            </button>
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
          
          {/* Enhanced Habit Tracker */}
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
            
            <div className="ml-4 space-y-4">
              {habitItems.map((habit, index) => (
                <div 
                  key={habit.id}
                  className="group"
                  style={{
                    transform: `rotate(${-0.5 + Math.random()}deg)`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="text-sm font-medium"
                      style={{
                        fontFamily: handwritingFonts[(index + 1) % handwritingFonts.length],
                        color: inkColors[index % inkColors.length],
                        fontSize: `${13 + Math.random() * 2}px`
                      }}
                    >
                      {habit.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xs"
                        style={{
                          fontFamily: 'Amatic SC',
                          color: habit.color
                        }}
                      >
                        {habit.current}/{habit.target} {habit.unit}
                      </span>
                      {habit.streak > 0 && (
                        <span 
                          className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full"
                          title={`${habit.streak} day streak!`}
                        >
                          🔥{habit.streak}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative mb-2">
                    <div 
                      className="h-2 bg-gray-200 rounded-full overflow-hidden"
                      style={{
                        transform: `rotate(${-1 + Math.random() * 2}deg)`
                      }}
                    >
                      <div 
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          backgroundColor: habit.color,
                          width: `${Math.min(100, (habit.current / habit.target) * 100)}%`
                        }}
                      />
                    </div>
                    {habit.current >= habit.target && (
                      <div className="absolute -top-1 -right-1">
                        <span className="text-green-500">✓</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Interactive Controls */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => updateHabitProgress(habit.id, -1)}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                      disabled={habit.current <= 0}
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateHabitProgress(habit.id, 1)}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
                      disabled={habit.current >= habit.target}
                    >
                      +1
                    </button>
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

  // Don't render until currentDate is initialized to prevent hydration mismatch
  if (!currentDate) {
    return <div className="relative w-full h-full bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 p-4 flex items-center justify-center">
      <div className="text-lg text-gray-600">Loading...</div>
    </div>;
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 p-4 overflow-auto">
      {/* Desk environment */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
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
      
      {/* Integrated Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border max-w-full">
        {/* Top Row - Main Navigation and Weather */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-wrap gap-3">
          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => handlePageTurn('prev')}
              className="flex items-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg shadow-sm transition-all font-medium text-amber-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </motion.button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {currentDate ? format(currentDate, 'MMMM d, yyyy') : ''}
              </div>
              <div className="text-xs text-gray-500">
                {currentDate ? format(currentDate, 'EEEE') : ''}
              </div>
            </div>
            
            <motion.button
              onClick={() => handlePageTurn('next')}
              className="flex items-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg shadow-sm transition-all font-medium text-amber-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Weather Display */}
          {settings.showWeather && (
            <div className="flex items-center gap-3 bg-blue-50 px-3 py-2 rounded-lg">
              <span className="text-2xl">{weatherInfo.icon}</span>
              <div>
                <div className="text-sm font-semibold text-gray-800">{weatherInfo.temp}</div>
                <div className="text-xs text-gray-600">{weatherInfo.condition}</div>
              </div>
            </div>
          )}

          {/* View Toggles */}
          <div className="flex items-center gap-2">
            {['daily', 'weekly', 'monthly'].map((view) => (
              <motion.button
                key={view}
                onClick={() => setCurrentView(view as any)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  currentView === view
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Bottom Row - Tools and Settings */}
        <div className="flex items-center justify-between gap-4 p-3 flex-wrap text-xs">
          {/* Left Group - Creative Tools */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* Pen Color Selector */}
            <div className="flex items-center gap-2">
              <Feather className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Pen:</span>
              <div className="flex gap-1">
                {inkColors.slice(0, 4).map((color, index) => (
                  <button
                    key={color}
                    onClick={() => setSelectedPen(color)}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      selectedPen === color ? 'border-gray-600 scale-110 shadow-sm' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Voice Recording */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Voice:</span>
              <button
              onClick={isVoiceRecording ? stopVoiceRecording : startVoiceRecording}
              className={`p-1 rounded hover:bg-gray-100 ${isVoiceRecording ? 'bg-red-100 text-red-600' : 'text-gray-700'}`}
              title={isVoiceRecording ? 'Stop recording' : 'Start voice note'}
            >
              {isVoiceRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Smart Scheduling */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Smart:</span>
            <button
              onClick={autoScheduleTask}
              className="p-1 rounded hover:bg-gray-100 text-purple-600"
              title="Auto-schedule task in available slot"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {/* Templates */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Template:</span>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`p-1 rounded hover:bg-gray-100 ${showTemplates ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
              title="Load template"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>

          {/* Export */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Export:</span>
            <button
              onClick={exportToPDF}
              className="p-1 rounded hover:bg-gray-100 text-green-600"
              title="Export to PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Weather selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Mood:</span>
            <div className="flex gap-1">
              {[
                { mood: 'sunny', icon: Sun, color: 'text-yellow-500' },
                { mood: 'cloudy', icon: Cloud, color: 'text-gray-400' },
                { mood: 'moon', icon: Moon, color: 'text-blue-400' }
              ].map(({ mood, icon: Icon, color }) => (
                <button
                  key={mood}
                  onClick={() => setWeatherMood(mood)}
                  className={`p-1 rounded hover:bg-gray-100 ${weatherMood === mood ? 'bg-gray-200' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Paper texture selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Paper:</span>
            <div className="flex gap-1">
              {[
                { texture: 'lined', label: '📝' },
                { texture: 'dotted', label: '⚪' },
                { texture: 'grid', label: '⚏' }
              ].map(({ texture, label }) => (
                <button
                  key={texture}
                  onClick={() => setPaperTexture(texture)}
                  className={`p-1 rounded hover:bg-gray-100 text-xs ${paperTexture === texture ? 'bg-gray-200' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Integration */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Calendar:</span>
            <button
              onClick={() => setShowMiniCalendar(!showMiniCalendar)}
              className={`p-1 rounded hover:bg-gray-100 ${showMiniCalendar ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
              title="Toggle mini calendar"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          {/* Collaboration */}
          {settings.collaborationMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Team:</span>
              <button
                onClick={() => {}}
                className="p-1 rounded hover:bg-gray-100 text-green-600"
                title="Share planner"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => {}}
                className="p-1 rounded hover:bg-gray-100 text-blue-600"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sync Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Sync:</span>
            <div className="flex items-center gap-1">
              {syncStatus === 'synced' && <Wifi className="w-4 h-4 text-green-500" />}
              {syncStatus === 'syncing' && <Save className="w-4 h-4 text-blue-500 animate-pulse" />}
              {syncStatus === 'offline' && <WifiOff className="w-4 h-4 text-red-500" />}
              <span className="text-xs text-gray-500 capitalize">{syncStatus}</span>
            </div>
          </div>

          {/* Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1 rounded hover:bg-gray-100 ${showSettings ? 'bg-gray-100 text-gray-800' : 'text-gray-700'}`}
              title="Planner settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            </div>
          </div>

          {/* Right Group - Status and Settings */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Sync Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {syncStatus === 'synced' && <Wifi className="w-4 h-4 text-green-500" />}
                {syncStatus === 'syncing' && <Save className="w-4 h-4 text-blue-500 animate-pulse" />}
                {syncStatus === 'offline' && <WifiOff className="w-4 h-4 text-red-500" />}
                <span className="text-xs text-gray-500 capitalize">{syncStatus}</span>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMiniCalendar(!showMiniCalendar)}
                className={`p-1 rounded hover:bg-gray-100 ${showMiniCalendar ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
                title="Toggle mini calendar"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1 rounded hover:bg-gray-100 ${showSettings ? 'bg-gray-100 text-gray-800' : 'text-gray-700'}`}
                title="Planner settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplates && (
        <div className="absolute top-20 right-4 z-40 bg-white rounded-lg shadow-xl border p-4 w-80">
          <h3 className="font-semibold mb-3 text-gray-800">Choose Template</h3>
          <div className="space-y-2">
            <button
              onClick={() => applyTemplate('productive-day')}
              className="w-full text-left p-3 rounded-lg hover:bg-blue-50 border border-blue-200"
            >
              <div className="font-medium text-blue-800">Productive Day</div>
              <div className="text-sm text-blue-600">Optimized for deep work and focus</div>
            </button>
            <button
              onClick={() => applyTemplate('wellness-focus')}
              className="w-full text-left p-3 rounded-lg hover:bg-green-50 border border-green-200"
            >
              <div className="font-medium text-green-800">Wellness Focus</div>
              <div className="text-sm text-green-600">Prioritizes health and well-being</div>
            </button>
          </div>
          <button
            onClick={() => setShowTemplates(false)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Main planner */}
      <div className="relative w-full h-[calc(100vh-10rem)] mt-32">
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
        <div className="relative bg-gradient-to-r from-amber-900 via-yellow-900 to-amber-900 rounded-xl p-3 shadow-2xl h-full">
          <div className="absolute left-1/2 top-0 bottom-0 w-12 -ml-6 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none z-10 rounded-lg" />
          
          {/* Page flip animation container */}
          <motion.div
            className="bg-white rounded-lg shadow-inner overflow-hidden relative h-full"
            animate={{
              rotateY: pageFlipping ? (Math.random() > 0.5 ? 180 : -180) : 0
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentView}-${currentDate?.toISOString()}`}
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
          
        </div>
        
        {/* Page number indicator */}
        <div 
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-amber-700 opacity-70"
          style={{
            fontFamily: 'Kalam',
            transform: 'translateX(-50%) rotate(-1deg)'
          }}
        >
          {currentDate ? `Day ${format(currentDate, 'DDD')} of ${format(new Date(currentDate.getFullYear(), 11, 31), 'DDD')}` : ''}
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

      {/* Mini Calendar */}
      {showMiniCalendar && (
        <div className="absolute top-36 right-4 z-30 bg-white rounded-lg shadow-xl border p-4 w-80 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{currentDate ? format(currentDate, 'MMMM yyyy') : ''}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => currentDate && setCurrentDate(subWeeks(currentDate, 1))}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => currentDate && setCurrentDate(addWeeks(currentDate, 1))}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs font-medium text-gray-500 p-1">{day}</div>
            ))}
            {currentDate && eachDayOfInterval({
              start: startOfWeek(startOfMonth(currentDate)),
              end: endOfMonth(currentDate)
            }).map(day => (
              <button
                key={day.toString()}
                onClick={() => setCurrentDate(day)}
                className={`p-1 text-xs rounded hover:bg-blue-100 ${
                  isSameDay(day, currentDate) ? 'bg-blue-500 text-white' :
                  isToday(day) ? 'bg-blue-100 text-blue-600 font-semibold' :
                  !isSameMonth(day, currentDate) ? 'text-gray-300' : ''
                }`}
              >
                {format(day, 'd')}
              </button>
            ))}
          </div>

          {/* Today's Events */}
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Today's Events</h4>
            <div className="space-y-2">
              {calendarEvents.map(event => (
                <div key={event.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: event.color }}></div>
                  <span className="font-medium">{event.time}</span>
                  <span className="text-gray-600">{event.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-36 right-4 z-30 bg-white rounded-lg shadow-xl border p-6 w-96 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Planner Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Theme Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {(['default', 'minimalist', 'colorful', 'dark'] as const).map(theme => (
                  <button
                    key={theme}
                    onClick={() => setSettings({...settings, theme})}
                    className={`p-2 text-xs rounded border ${
                      settings.theme === theme ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Layout</label>
              <div className="grid grid-cols-3 gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map(layout => (
                  <button
                    key={layout}
                    onClick={() => setSettings({...settings, layout})}
                    className={`p-2 text-xs rounded border ${
                      settings.layout === layout ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {layout.charAt(0).toUpperCase() + layout.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Features</h4>
              {[
                { key: 'showHabits' as const, label: 'Show Habits' },
                { key: 'showCalendar' as const, label: 'Show Calendar' },
                { key: 'showWeather' as const, label: 'Show Weather' },
                { key: 'autoSave' as const, label: 'Auto Save' },
                { key: 'collaborationMode' as const, label: 'Collaboration Mode' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}</span>
                  <button
                    onClick={() => setSettings({...settings, [key]: !settings[key]})}
                    className={`w-8 h-4 rounded-full transition-colors ${
                      settings[key] ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                      settings[key] ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Collaboration Info */}
            {settings.collaborationMode && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Active Collaborators</h4>
                <div className="space-y-1">
                  {collaborators.map((collaborator, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                        {collaborator.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-gray-600">{collaborator}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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