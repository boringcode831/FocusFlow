import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckSquare,
  Activity,
  Plus,
  X,
  Play,
  Pause,
  RotateCcw,
  Flag,
  Bell,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  Droplets,
  BookOpen,
  Dumbbell,
  Moon,
  Code,
  Heart,
  Coffee,
  Sun,
  Music,
  Zap,
  Award,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Timer as TimerIcon
} from 'lucide-react';

// --- HELPER FUNCTIONS ---
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDuration = (totalSeconds) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const HABIT_ICONS = [
  { id: 'Droplets', label: 'Hydrate', icon: Droplets },
  { id: 'BookOpen', label: 'Read', icon: BookOpen },
  { id: 'Dumbbell', label: 'Workout', icon: Dumbbell },
  { id: 'Code', label: 'Code', icon: Code },
  { id: 'Moon', label: 'Sleep', icon: Moon },
  { id: 'Heart', label: 'Health', icon: Heart },
  { id: 'Sun', label: 'Morning', icon: Sun },
  { id: 'Coffee', label: 'Mindful', icon: Coffee },
  { id: 'Music', label: 'Practice', icon: Music },
  { id: 'Zap', label: 'Energy', icon: Zap },
  { id: 'Award', label: 'Goal', icon: Award },
  { id: 'Sparkles', label: 'Clean', icon: Sparkles }
];

const renderHabitIcon = (iconId, className = "w-5 h-5") => {
  const found = HABIT_ICONS.find((i) => i.id === iconId) || HABIT_ICONS[0];
  const IconComponent = found.icon;
  return <IconComponent className={className} />;
};

// --- INITIAL DEFAULT STATES ---
const DEFAULT_FOCUS_TASKS = [
  { id: 'ft-1', text: 'Deep Work: System Architecture' },
  { id: 'ft-2', text: 'Review Weekly Sprint Goals' },
  { id: 'ft-3', text: 'Read 20 Pages of Documentation' }
];

const DEFAULT_TODOS = [
  { id: 'td-1', title: 'Finalize UI Wireframes', timeframe: 'Day', status: 'In Progress', createdAt: getLocalDateString() },
  { id: 'td-2', title: 'Fix API Authentication Bug', timeframe: 'Day', status: 'Not Working', createdAt: getLocalDateString() },
  { id: 'td-3', title: 'Morning Standup Notes', timeframe: 'Day', status: 'Done', createdAt: getLocalDateString() },
  { id: 'td-4', title: 'Complete Q4 Product Roadmap', timeframe: 'Weekly', status: 'In Progress', createdAt: getLocalDateString() },
  { id: 'td-5', title: 'Server Migration Audit', timeframe: 'Weekly', status: 'Not Working', createdAt: getLocalDateString() },
  { id: 'td-6', title: 'Launch Beta v2.0', timeframe: 'Monthly', status: 'In Progress', createdAt: getLocalDateString() }
];

const todayStr = getLocalDateString();
const yesterdayDate = new Date();
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterdayStr = getLocalDateString(yesterdayDate);

const DEFAULT_HABITS = [
  {
    id: 'hb-1',
    name: 'Drink 2L Water',
    icon: 'Droplets',
    targetDays: 21,
    dailyTargetCheckIns: 4,
    logs: {
      [yesterdayStr]: 4,
      [todayStr]: 2
    }
  },
  {
    id: 'hb-2',
    name: 'Read Technical Book',
    icon: 'BookOpen',
    targetDays: 30,
    dailyTargetCheckIns: 1,
    logs: {
      [yesterdayStr]: 1,
      [todayStr]: 1
    }
  },
  {
    id: 'hb-3',
    name: 'Strength Training',
    icon: 'Dumbbell',
    targetDays: 60,
    dailyTargetCheckIns: 2,
    logs: {
      [yesterdayStr]: 2,
      [todayStr]: 0
    }
  }
];

const DEFAULT_EVENTS = [
  {
    id: 'ev-1',
    date: todayStr,
    time: '14:00',
    title: 'Design Sync & Milestone Review',
    note: 'Prepare slides for the core modules walkthrough',
    isReminder: true,
    dismissed: false
  },
  {
    id: 'ev-2',
    date: todayStr,
    time: '17:30',
    title: 'Submit Weekly Progress Report',
    note: 'Include habit & task metrics',
    isReminder: true,
    dismissed: false
  }
];

export default function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('timer');
  // Real-world Clock State
  const [now, setNow] = useState(new Date());
  // Notification Banner State
  const [activeAlerts, setActiveAlerts] = useState([]);

  // --- 1. FOCUS & TIMER STATE ---
  const [focusTasks, setFocusTasks] = useState(() => {
    const saved = localStorage.getItem('prod_focus_tasks');
    return saved ? JSON.parse(saved) : DEFAULT_FOCUS_TASKS;
  });
  const [selectedFocusId, setSelectedFocusId] = useState(() => {
    const saved = localStorage.getItem('prod_selected_focus');
    return saved || 'ft-1';
  });
  const [newFocusInput, setNewFocusInput] = useState('');

  // Timer Mode: 'pomodoro' | 'stopwatch' | 'timer'
  const [timerMode, setTimerMode] = useState('pomodoro');
  // Pomodoro Submode: 'work' (25m) | 'short' (5m) | 'long' (15m)
  const [pomoPhase, setPomoPhase] = useState('work');
  const POMO_DURATIONS = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };

  // Custom Timer config
  const [customMinutes, setCustomMinutes] = useState(10);
  const [customSeconds, setCustomSeconds] = useState(0);

  // Active running state
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(POMO_DURATIONS.work);
  const [totalDuration, setTotalDuration] = useState(POMO_DURATIONS.work);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [laps, setLaps] = useState([]);
  const [timerNotification, setTimerNotification] = useState('');

  // --- 2. CALENDAR & REMINDERS STATE ---
  const [calendarEvents, setCalendarEvents] = useState(() => {
    const saved = localStorage.getItem('prod_calendar_events');
    return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
  });
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(getLocalDateString());
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('09:00');
  const [eventNote, setEventNote] = useState('');
  const [eventIsReminder, setEventIsReminder] = useState(true);

  // --- 3. TO-DO LIST STATE ---
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('prod_todos');
    return saved ? JSON.parse(saved) : DEFAULT_TODOS;
  });
  const [todoView, setTodoView] = useState('Day'); // 'Day' | 'Weekly' | 'Monthly'
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoStatus, setNewTodoStatus] = useState('Not Working');

  // --- 4. HABIT TRACKER STATE ---
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('prod_habits');
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });
  const [habitView, setHabitView] = useState('Daily'); // 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('Droplets');
  const [habitTargetDays, setHabitTargetDays] = useState(21);
  const [habitDailyCheckIns, setHabitDailyCheckIns] = useState(3);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
    localStorage.setItem('prod_focus_tasks', JSON.stringify(focusTasks));
  }, [focusTasks]);

  useEffect(() => {
    localStorage.setItem('prod_selected_focus', selectedFocusId);
  }, [selectedFocusId]);

  useEffect(() => {
    localStorage.setItem('prod_calendar_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('prod_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('prod_habits', JSON.stringify(habits));
  }, [habits]);

  // --- LIVE REAL-WORLD CLOCK & REMINDER CHECK ---
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const current = new Date();
      setNow(current);

      const currentDateStr = getLocalDateString(current);
      const currentHours = String(current.getHours()).padStart(2, '0');
      const currentMinutes = String(current.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      // Check due reminders
      calendarEvents.forEach((ev) => {
        if (
          ev.isReminder &&
          !ev.dismissed &&
          ev.date === currentDateStr &&
          ev.time &&
          ev.time <= currentTimeStr
        ) {
          setActiveAlerts((prev) => {
            if (prev.some((a) => a.id === ev.id)) return prev;
            return [...prev, ev];
          });
        }
      });
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [calendarEvents]);

  // --- TIMER / STOPWATCH ENGINE ---
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (timerMode === 'stopwatch') {
        setStopwatchSeconds((prev) => prev + 1);
      } else {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setTimerNotification(
              timerMode === 'pomodoro'
                ? `Pomodoro (${pomoPhase.toUpperCase()}) session completed!`
                : 'Custom timer finished!'
            );
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timerMode, pomoPhase]);

  // --- TIMER HANDLERS ---
  const switchTimerMode = (mode) => {
    setIsRunning(false);
    setTimerNotification('');
    setTimerMode(mode);
    if (mode === 'pomodoro') {
      const dur = POMO_DURATIONS[pomoPhase];
      setTotalDuration(dur);
      setTimeLeft(dur);
    } else if (mode === 'timer') {
      const dur = Math.max(1, customMinutes * 60 + customSeconds);
      setTotalDuration(dur);
      setTimeLeft(dur);
    } else if (mode === 'stopwatch') {
      setStopwatchSeconds(0);
      setLaps([]);
    }
  };

  const switchPomoPhase = (phase) => {
    setIsRunning(false);
    setTimerNotification('');
    setPomoPhase(phase);
    const dur = POMO_DURATIONS[phase];
    setTotalDuration(dur);
    setTimeLeft(dur);
  };

  const applyCustomTimer = (mins, secs) => {
    setIsRunning(false);
    setTimerNotification('');
    const validMins = Math.max(0, Math.min(999, Number(mins) || 0));
    const validSecs = Math.max(0, Math.min(59, Number(secs) || 0));
    setCustomMinutes(validMins);
    setCustomSeconds(validSecs);
    const total = Math.max(1, validMins * 60 + validSecs);
    setTotalDuration(total);
    setTimeLeft(total);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimerNotification('');
    if (timerMode === 'stopwatch') {
      setStopwatchSeconds(0);
      setLaps([]);
    } else if (timerMode === 'pomodoro') {
      setTimeLeft(POMO_DURATIONS[pomoPhase]);
    } else {
      const total = Math.max(1, customMinutes * 60 + customSeconds);
      setTimeLeft(total);
    }
  };

  const handleAddLap = () => {
    if (timerMode === 'stopwatch' && stopwatchSeconds > 0) {
      setLaps((prev) => [stopwatchSeconds, ...prev]);
    }
  };

  // --- FOCUS TASK HANDLERS ---
  const handleAddFocusTask = (e) => {
    e.preventDefault();
    const trimmed = newFocusInput.trim();
    if (!trimmed) return;
    const newTask = { id: `ft-${Date.now()}`, text: trimmed };
    setFocusTasks((prev) => [...prev, newTask]);
    setSelectedFocusId(newTask.id);
    setNewFocusInput('');
  };

  const handleDeleteFocusTask = (id, e) => {
    e.stopPropagation();
    const updated = focusTasks.filter((t) => t.id !== id);
    setFocusTasks(updated);
    if (selectedFocusId === id) {
      setSelectedFocusId(updated[0]?.id || '');
    }
  };

  const activeFocusTask = focusTasks.find((t) => t.id === selectedFocusId);

  // --- CIRCLE PROGRESS CALCULATION ---
  const circleRadius = 132;
  const circleCircumference = 2 * Math.PI * circleRadius;
  let progressFraction = 0;

  if (timerMode === 'stopwatch') {
    // Completes a full cycle every 60 seconds
    progressFraction = (stopwatchSeconds % 60) / 60;
  } else {
    progressFraction = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  }
  const strokeDashoffset = circleCircumference * (1 - Math.min(1, Math.max(0, progressFraction)));

  // --- CALENDAR & REMINDERS HANDLERS ---
  const getDaysInMonthGrid = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      cells.push({
        dayNumber: d,
        dateStr: getLocalDateString(cellDate)
      });
    }
    return cells;
  };

  const handleAddCalendarEvent = (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    const newEv = {
      id: `ev-${Date.now()}`,
      date: selectedDateStr,
      time: eventTime,
      title: eventTitle.trim(),
      note: eventNote.trim(),
      isReminder: eventIsReminder,
      dismissed: false
    };
    setCalendarEvents((prev) => [...prev, newEv]);
    setEventTitle('');
    setEventNote('');
  };

  const handleDeleteCalendarEvent = (id) => {
    setCalendarEvents((prev) => prev.filter((ev) => ev.id !== id));
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDismissReminder = (id) => {
    setCalendarEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, dismissed: true } : ev))
    );
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // --- TO-DO HANDLERS ---
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    const item = {
      id: `td-${Date.now()}`,
      title: newTodoTitle.trim(),
      timeframe: todoView,
      status: newTodoStatus,
      createdAt: getLocalDateString()
    };
    setTodos((prev) => [item, ...prev]);
    setNewTodoTitle('');
  };

  const handleUpdateTodoStatus = (id, nextStatus) => {
    setTodos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );
  };

  const handleDeleteTodo = (id) => {
    setTodos((prev) => prev.filter((item) => item.id !== id));
  };

  // --- HABIT TRACKER HANDLERS & METRICS ---
  const handleCreateHabit = (e) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    const newHabit = {
      id: `hb-${Date.now()}`,
      name: habitName.trim(),
      icon: habitIcon,
      targetDays: Math.max(1, Number(habitTargetDays) || 21),
      dailyTargetCheckIns: Math.max(1, Number(habitDailyCheckIns) || 1),
      logs: {}
    };
    setHabits((prev) => [...prev, newHabit]);
    setHabitName('');
    setShowAddHabitModal(false);
  };

  const handleCheckInHabit = (habitId, dateKey = getLocalDateString()) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const currentCount = h.logs[dateKey] || 0;
        return {
          ...h,
          logs: {
            ...h.logs,
            [dateKey]: currentCount + 1
          }
        };
      })
    );
  };

  const handleUndoCheckInHabit = (habitId, dateKey = getLocalDateString()) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const currentCount = h.logs[dateKey] || 0;
        if (currentCount <= 0) return h;
        return {
          ...h,
          logs: {
            ...h.logs,
            [dateKey]: currentCount - 1
          }
        };
      })
    );
  };

  const handleDeleteHabit = (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const calculateHabitStats = (habit) => {
    const logEntries = Object.entries(habit.logs || {});
    // Completed days = days where check-ins >= dailyTargetCheckIns
    const completedDays = logEntries.filter(
      ([_, count]) => count >= habit.dailyTargetCheckIns
    ).length;
    // Total Check-In times across all dates
    const totalCheckIns = logEntries.reduce((acc, [_, count]) => acc + count, 0);
    // Completion Rate in %
    const completionRate =
      habit.targetDays > 0
        ? Math.min(100, Math.round((completedDays / habit.targetDays) * 100))
        : 0;
    const todayCheckIns = habit.logs?.[getLocalDateString()] || 0;

    return {
      completedDays,
      targetDays: habit.targetDays,
      totalCheckIns,
      completionRate,
      todayCheckIns
    };
  };

  // Helper to get last N days array for Weekly/Monthly views
  const getPastDaysArray = (numDays) => {
    const list = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push({
        dateStr: getLocalDateString(d),
        shortDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate()
      });
    }
    return list;
  };

  // Helper to get 12 months of current year for Yearly view
  const getYearMonthsSummary = (habit) => {
    const year = new Date().getFullYear();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months.map((mName, mIndex) => {
      const prefix = `${year}-${String(mIndex + 1).padStart(2, '0')}`;
      const entries = Object.entries(habit.logs || {}).filter(([dateKey]) =>
        dateKey.startsWith(prefix)
      );
      const completedInMonth = entries.filter(
        ([_, count]) => count >= habit.dailyTargetCheckIns
      ).length;
      const checkInsInMonth = entries.reduce((sum, [_, c]) => sum + c, 0);
      return {
        month: mName,
        completedInMonth,
        checkInsInMonth
      };
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                FocusFlow
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Minimal Productivity Workspace
              </p>
            </div>
          </div>

          {/* Blue Navigation Menu Buttons */}
          <nav className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'timer', label: 'Pomodoro & Timer', icon: Clock },
              { id: 'calendar', label: 'Calendar & Reminders', icon: CalendarIcon },
              { id: 'todo', label: 'Status To-Do', icon: CheckSquare },
              { id: 'habits', label: 'Habit Tracker', icon: Activity }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.id === 'calendar' && activeAlerts.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-xs rounded-full bg-red-500 text-white font-bold">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ACTIVE REMINDER BANNER (IF ANY DUE) */}
      {activeAlerts.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-blue-900 text-sm font-medium">
              <Bell className="w-4 h-4 text-blue-600 animate-bounce" />
              <span>
                Reminder Alert: <strong>{activeAlerts[0].title}</strong> ({activeAlerts[0].date} at {activeAlerts[0].time})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDismissReminder(activeAlerts[0].id)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition"
              >
                Dismiss Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE CONTENT */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ============================================================
            MODULE 1: POMODORO, STOPWATCH & CUSTOM TIMER
           ============================================================ */}
        {activeTab === 'timer' && (
          <div className="max-w-3xl mx-auto space-y-8">
            {/* FOCUS TASK SELECTOR AT THE TOP */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Current Focus Task
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {activeFocusTask ? activeFocusTask.text : 'Select or add a task below to begin focusing'}
                  </h2>
                </div>
                {activeFocusTask && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-center">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    Focusing Now
                  </span>
                )}
              </div>

              {/* Add New Focus Task Input */}
              <form onSubmit={handleAddFocusTask} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newFocusInput}
                  onChange={(e) => setNewFocusInput(e.target.value)}
                  placeholder="Type a focus task and press Add..."
                  className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </form>

              {/* Focus Task Selectable List with "X" Delete Button */}
              <div className="flex flex-wrap gap-2">
                {focusTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No focus tasks saved. Add one above to keep it on your list.
                  </p>
                ) : (
                  focusTasks.map((task) => {
                    const isSelected = task.id === selectedFocusId;
                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedFocusId(task.id)}
                        className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <span>{task.text}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFocusTask(task.id, e)}
                          title="Remove focus task"
                          className={`p-0.5 rounded-full transition ${
                            isSelected
                              ? 'hover:bg-blue-800 text-blue-100 hover:text-white'
                              : 'text-slate-400 hover:bg-slate-100 hover:text-red-600'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* TIMER MODULE CARD */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col items-center shadow-xs">
              {/* Primary Mode Switcher (Pomodoro / Stopwatch / Custom Timer) */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {[
                  { id: 'pomodoro', label: 'Pomodoro' },
                  { id: 'stopwatch', label: 'Stopwatch' },
                  { id: 'timer', label: 'Custom Timer' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => switchTimerMode(m.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                      timerMode === m.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Sub-controls for Pomodoro or Custom Timer */}
              {timerMode === 'pomodoro' && (
                <div className="flex items-center gap-2 mb-6">
                  {[
                    { id: 'work', label: 'Focus (25m)' },
                    { id: 'short', label: 'Short Break (5m)' },
                    { id: 'long', label: 'Long Break (15m)' }
                  ].map((phase) => (
                    <button
                      key={phase.id}
                      onClick={() => switchPomoPhase(phase.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                        pomoPhase === phase.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {phase.label}
                    </button>
                  ))}
                </div>
              )}

              {timerMode === 'timer' && (
                <div className="flex items-center gap-3 mb-6 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Min:</label>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={customMinutes}
                      onChange={(e) => applyCustomTimer(e.target.value, customSeconds)}
                      className="w-16 px-2 py-1 text-sm text-center bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <span className="text-slate-400 font-bold">:</span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Sec:</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customSeconds}
                      onChange={(e) => applyCustomTimer(customMinutes, e.target.value)}
                      className="w-16 px-2 py-1 text-sm text-center bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}

              {/* CIRCULAR PROGRESS RING WITH DIGITAL TIMER + CURRENT REAL-WORLD TIME */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 300 300">
                  {/* Background Track Circle */}
                  <circle
                    cx="150"
                    cy="150"
                    r={circleRadius}
                    fill="transparent"
                    stroke="#E2E8F0"
                    strokeWidth="10"
                  />
                  {/* Dynamic Progress Circle */}
                  <circle
                    cx="150"
                    cy="150"
                    r={circleRadius}
                    fill="transparent"
                    stroke="#2563EB"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>

                {/* Inside Circle Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-1">
                    {timerMode === 'pomodoro'
                      ? `Pomodoro • ${pomoPhase}`
                      : timerMode === 'stopwatch'
                      ? 'Stopwatch'
                      : 'Custom Timer'}
                  </span>

                  {/* Main Digital Timer */}
                  <div className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 tabular-nums my-1">
                    {timerMode === 'stopwatch'
                      ? formatDuration(stopwatchSeconds)
                      : formatDuration(timeLeft)}
                  </div>

                  {/* Current Live Real-World Clock */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Now: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Alert Message */}
              {timerNotification && (
                <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>{timerNotification}</span>
                </div>
              )}

              {/* Control Action Buttons (Blue) */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setTimerNotification('');
                    setIsRunning((prev) => !prev);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start
                    </>
                  )}
                </button>

                {timerMode === 'stopwatch' && (
                  <button
                    onClick={handleAddLap}
                    disabled={!isRunning && stopwatchSeconds === 0}
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Flag className="w-4 h-4" />
                    Lap
                  </button>
                )}

                <button
                  onClick={handleResetTimer}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>

              {/* Stopwatch Laps List */}
              {timerMode === 'stopwatch' && laps.length > 0 && (
                <div className="w-full max-w-md mt-6 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Recorded Laps
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {laps.map((lapTime, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs px-3 py-1.5 bg-slate-50 rounded-md border border-slate-200"
                      >
                        <span className="font-medium text-slate-600">
                          Lap #{laps.length - idx}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatDuration(lapTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================================
            MODULE 2: CALENDAR & REMINDERS
           ============================================================ */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Monthly Interactive Calendar Grid */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {currentMonthDate.toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select any date to jot down important notes or set a reminder
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentMonthDate(
                        new Date(
                          currentMonthDate.getFullYear(),
                          currentMonthDate.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      setCurrentMonthDate(today);
                      setSelectedDateStr(getLocalDateString(today));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    onClick={() =>
                      setCurrentMonthDate(
                        new Date(
                          currentMonthDate.getFullYear(),
                          currentMonthDate.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div
                    key={d}
                    className="text-xs font-semibold uppercase tracking-wider text-slate-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {getDaysInMonthGrid(currentMonthDate).map((cell, index) => {
                  if (!cell) {
                    return <div key={`empty-${index}`} className="h-20 rounded-xl bg-slate-50/50" />;
                  }
                  const isToday = cell.dateStr === getLocalDateString();
                  const isSelected = cell.dateStr === selectedDateStr;
                  const dayEvents = calendarEvents.filter((ev) => ev.date === cell.dateStr);

                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      className={`h-20 p-2 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20'
                          : 'border-slate-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : isSelected
                              ? 'text-blue-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5 overflow-hidden w-full">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className="text-[10px] truncate px-1 py-0.2 rounded bg-blue-600 text-white font-medium"
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Jot Down Date Note / Reminder & Upcoming List */}
            <div className="lg:col-span-5 space-y-6">
              {/* Form to Add Date Note / Reminder */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Jot Down Event / Reminder
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                    Date: {selectedDateStr}
                  </span>
                </div>

                <form onSubmit={handleAddCalendarEvent} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="e.g., Project Deadline, Doctor Appointment..."
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Reminder Time
                      </label>
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div className="flex items-end pb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={eventIsReminder}
                          onChange={(e) => setEventIsReminder(e.target.checked)}
                          className="w-4 h-4 accent-blue-600 rounded"
                        />
                        <span>Enable Reminder Alert</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Details / Notes
                    </label>
                    <textarea
                      rows="2"
                      value={eventNote}
                      onChange={(e) => setEventNote(e.target.value)}
                      placeholder="Optional memo..."
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Save to Calendar
                  </button>
                </form>
              </div>

              {/* Events & Reminders List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-3">
                  Events on {selectedDateStr} & Upcoming Reminders
                </h3>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {calendarEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No dates or reminders saved yet.
                    </p>
                  ) : (
                    calendarEvents
                      .slice()
                      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
                      .map((ev) => {
                        const isSelectedDay = ev.date === selectedDateStr;
                        return (
                          <div
                            key={ev.id}
                            className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                              isSelectedDay
                                ? 'border-blue-300 bg-blue-50/30'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900">
                                  {ev.title}
                                </span>
                                {ev.isReminder && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      ev.dismissed
                                        ? 'bg-slate-100 text-slate-500'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    <Bell className="w-2.5 h-2.5" />
                                    {ev.dismissed ? 'Dismissed' : 'Reminder'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-blue-600 font-medium">
                                {ev.date} {ev.time && `• ${ev.time}`}
                              </p>
                              {ev.note && (
                                <p className="text-xs text-slate-600">{ev.note}</p>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteCalendarEvent(ev.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODULE 3: MULTI-VIEW STATUS TO-DO LIST
            Day / Weekly / Monthly + Not Working (Red) / In Progress (Orange) / Done (Green)
           ============================================================ */}
        {activeTab === 'todo' && (
          <div className="space-y-6">
            {/* Top Bar: Day / Weekly / Monthly Switcher + Add Task Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* View Switcher */}
              <div className="flex items-center gap-2">
                {['Day', 'Weekly', 'Monthly'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setTodoView(view)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                      todoView === view
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {view} View
                  </button>
                ))}
              </div>

              {/* Add Task Form */}
              <form
                onSubmit={handleAddTodo}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl"
              >
                <input
                  type="text"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  placeholder={`Add a new ${todoView.toLowerCase()} task...`}
                  className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <select
                  value={newTodoStatus}
                  onChange={(e) => setNewTodoStatus(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Not Working">Not Working (Red)</option>
                  <option value="In Progress">In Progress (Orange)</option>
                  <option value="Done">Done (Green)</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </form>
            </div>

            {/* 3 Status Columns: Not Working (Red), In Progress (Orange), Done (Green) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  status: 'Not Working',
                  title: 'Not Working',
                  dotColor: 'bg-red-500',
                  borderColor: 'border-red-200',
                  headerBg: 'bg-red-50',
                  badgeBg: 'bg-red-100 text-red-700 border-red-200'
                },
                {
                  status: 'In Progress',
                  title: 'In Progress',
                  dotColor: 'bg-orange-500',
                  borderColor: 'border-orange-200',
                  headerBg: 'bg-orange-50',
                  badgeBg: 'bg-orange-100 text-orange-700 border-orange-200'
                },
                {
                  status: 'Done',
                  title: 'Done',
                  dotColor: 'bg-green-500',
                  borderColor: 'border-green-200',
                  headerBg: 'bg-green-50',
                  badgeBg: 'bg-green-100 text-green-700 border-green-200'
                }
              ].map((col) => {
                const filteredTasks = todos.filter(
                  (t) => t.timeframe === todoView && t.status === col.status
                );

                return (
                  <div
                    key={col.status}
                    className={`bg-white border ${col.borderColor} rounded-2xl overflow-hidden flex flex-col shadow-xs`}
                  >
                    {/* Column Header */}
                    <div
                      className={`${col.headerBg} px-4 py-3 border-b ${col.borderColor} flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${col.dotColor}`} />
                        <h3 className="text-sm font-bold text-slate-900">
                          {col.title}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${col.badgeBg}`}
                      >
                        {filteredTasks.length}
                      </span>
                    </div>

                    {/* Tasks List */}
                    <div className="p-4 space-y-3 flex-1">
                      {filteredTasks.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-400 italic">
                          No {todoView.toLowerCase()} tasks in {col.title}
                        </div>
                      ) : (
                        filteredTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-sm font-semibold ${
                                  task.status === 'Done'
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-800'
                                }`}
                              >
                                {task.title}
                              </p>
                              <button
                                onClick={() => handleDeleteTodo(task.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                                title="Delete task"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Status Switch Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1">
                              <span className="text-[11px] text-slate-400">Move to:</span>
                              <div className="flex items-center gap-1.5">
                                {['Not Working', 'In Progress', 'Done'].map((st) => {
                                  if (st === task.status) return null;
                                  const btnStyle =
                                    st === 'Not Working'
                                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                                      : st === 'In Progress'
                                      ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200'
                                      : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200';
                                  return (
                                    <button
                                      key={st}
                                      onClick={() => handleUpdateTodoStatus(task.id, st)}
                                      className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition cursor-pointer ${btnStyle}`}
                                    >
                                      {st}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================
            MODULE 4: HABIT TRACKER
            Icons, Target Days, Daily Check-In Count, Daily/Weekly/Monthly/Yearly Views,
            and Required Metrics:
            - [Completed]/[Total Completed Times] (Completed)
            - [Total of the Check-In times] (Check-Ins)
            - [Completion Rate, in %] (Completed)
           ============================================================ */}
        {activeTab === 'habits' && (
          <div className="space-y-6">
            {/* Habit Header & View Switcher */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setHabitView(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                      habitView === v
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {v} View
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddHabitModal((prev) => !prev)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {showAddHabitModal ? 'Close Habit Creator' : 'New Habit'}
              </button>
            </div>

            {/* New Habit Creation Drawer */}
            {showAddHabitModal && (
              <form
                onSubmit={handleCreateHabit}
                className="bg-white border-2 border-blue-600 rounded-2xl p-6 shadow-sm space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Create a New Habit
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddHabitModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Choose Icon Grid */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    1. Choose an Icon
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                    {HABIT_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const selected = habitIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setHabitIcon(item.id)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                            selected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                          }`}
                        >
                          <IconComp className="w-5 h-5 mb-1" />
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Habit Name & Goal Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      2. Habit Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={habitName}
                      onChange={(e) => setHabitName(e.target.value)}
                      placeholder="e.g., Meditate 15 mins"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      3. Days Needed to Complete Habit
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={habitTargetDays}
                      onChange={(e) => setHabitTargetDays(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      4. Required Check-Ins Per Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={habitDailyCheckIns}
                      onChange={(e) => setHabitDailyCheckIns(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition cursor-pointer"
                  >
                    Create Habit
                  </button>
                </div>
              </form>
            )}

            {/* Habits List & Selected Progress View */}
            <div className="space-y-4">
              {habits.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <p className="text-sm text-slate-500">
                    No habits created yet. Click "New Habit" above to start tracking.
                  </p>
                </div>
              ) : (
                habits.map((habit) => {
                  const stats = calculateHabitStats(habit);
                  const isTodayComplete = stats.todayCheckIns >= habit.dailyTargetCheckIns;

                  return (
                    <div
                      key={habit.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5"
                    >
                      {/* Top Row: Icon, Name, Daily Check-In Button & Delete */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                            {renderHabitIcon(habit.icon, 'w-6 h-6')}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              {habit.name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Goal: <strong>{habit.targetDays} Days</strong> • Check-in{' '}
                              <strong>{habit.dailyTargetCheckIns}x</strong> per day
                            </p>
                          </div>
                        </div>

                        {/* Interactive Daily Check-In Controls */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <button
                            onClick={() => handleCheckInHabit(habit.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              Check-In Today ({stats.todayCheckIns}/{habit.dailyTargetCheckIns})
                            </span>
                          </button>

                          {stats.todayCheckIns > 0 && (
                            <button
                              onClick={() => handleUndoCheckInHabit(habit.id)}
                              className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                              title="Undo 1 check-in today"
                            >
                              -1
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title="Delete habit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* MANDATORY HABIT METRICS BAR */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {/* [Completed]/[Total Completed Times] (Completed) */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                              Completed (Days Goal Met)
                            </span>
                            <span className="text-xl font-bold text-slate-900">
                              {stats.completedDays} / {stats.targetDays}{' '}
                              <span className="text-xs font-semibold text-blue-600">
                                (Completed)
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* [Total of the Check-In times] (Check-Ins) */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                              Total Check-In Count
                            </span>
                            <span className="text-xl font-bold text-slate-900">
                              {stats.totalCheckIns}{' '}
                              <span className="text-xs font-semibold text-blue-600">
                                (Check-Ins)
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* [Completion Rate, in %] (Completed) */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Completion Rate
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                {stats.completionRate}% (Completed)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                              <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${stats.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* TIMEFRAME SPECIFIC PROGRESS VIEW (Daily / Weekly / Monthly / Yearly) */}
                      <div className="pt-3 border-t border-slate-100">
                        {habitView === 'Daily' && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                            <span>
                              Today's Progress ({getLocalDateString()}):{' '}
                              <strong>
                                {stats.todayCheckIns} of {habit.dailyTargetCheckIns} check-ins
                              </strong>
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full font-semibold ${
                                isTodayComplete
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {isTodayComplete
                                ? 'Daily Target Reached!'
                                : `${habit.dailyTargetCheckIns - stats.todayCheckIns} more check-in(s) needed today`}
                            </span>
                          </div>
                        )}

                        {habitView === 'Weekly' && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">
                              Last 7 Days Check-In Breakdown (Click any day to add a check-in):
                            </p>
                            <div className="grid grid-cols-7 gap-2">
                              {getPastDaysArray(7).map((d) => {
                                const count = habit.logs?.[d.dateStr] || 0;
                                const met = count >= habit.dailyTargetCheckIns;
                                return (
                                  <button
                                    key={d.dateStr}
                                    onClick={() => handleCheckInHabit(habit.id, d.dateStr)}
                                    className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                                      met
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : count > 0
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                    }`}
                                  >
                                    <div className="text-[10px] opacity-80">{d.shortDay}</div>
                                    <div className="text-xs font-bold">{d.dayNum}</div>
                                    <div className="text-[10px] font-semibold mt-1">
                                      {count}/{habit.dailyTargetCheckIns}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {habitView === 'Monthly' && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">
                              Last 30 Days Activity Grid (Click any date cell to increment check-in):
                            </p>
                            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-1.5">
                              {getPastDaysArray(30).map((d) => {
                                const count = habit.logs?.[d.dateStr] || 0;
                                const met = count >= habit.dailyTargetCheckIns;
                                return (
                                  <button
                                    key={d.dateStr}
                                    onClick={() => handleCheckInHabit(habit.id, d.dateStr)}
                                    title={`${d.dateStr}: ${count}/${habit.dailyTargetCheckIns} check-ins`}
                                    className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                                      met
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : count > 0
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300'
                                    }`}
                                  >
                                    <div className="text-[10px] font-bold">{d.dayNum}</div>
                                    <div className="text-[9px]">{count}x</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {habitView === 'Yearly' && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">
                              {new Date().getFullYear()} Yearly Overview (Completed Days & Total Check-Ins per Month):
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-12 gap-2">
                              {getYearMonthsSummary(habit).map((m) => (
                                <div
                                  key={m.month}
                                  className={`p-2.5 rounded-xl border text-center ${
                                    m.completedInMonth > 0
                                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-500'
                                  }`}
                                >
                                  <div className="text-xs font-bold">{m.month}</div>
                                  <div className="text-[11px] font-semibold text-blue-600 mt-1">
                                    {m.completedInMonth}d done
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {m.checkInsInMonth} checks
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}