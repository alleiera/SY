import React, { useState, useEffect } from 'react';
import {
    Calendar, Bell, FileText, CheckSquare, Zap,
    Plus, X, ChevronLeft, ChevronRight, MoreHorizontal,
    Package, ShoppingCart, Truck, Layers, Check,
    Briefcase, Users, Layout, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardWidget from './DashboardWidget';

const usePersistentState = (userId, key, initialValue) => {
    const [state, setState] = useState(() => {
        try {
            const item = window.localStorage.getItem(`${userId}_${key}`);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    useEffect(() => {
        if (!userId) return;
        window.localStorage.setItem(`${userId}_${key}`, JSON.stringify(state));
    }, [userId, key, state]);

    return [state, setState];
};

const ICON_MAP = {
    Package, ShoppingCart, Truck, Layers,
    Briefcase, Users, Layout, Settings,
    Zap, Bell, Calendar, FileText
};

export default function Dashboard({ onOpenWindow }) {
    const { user } = useAuth();
    const userId = user?.id || 'guest';

    // --- STATE ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = usePersistentState(userId, 'events', []);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [eventModal, setEventModal] = useState({ isOpen: false, type: 'add', eventId: null, title: '', description: '' });

    // --- EVENT HANDLERS ---
    const handleDateClick = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const handleDayDoubleClick = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
        openAddEventModal();
    };

    const openAddEventModal = () => {
        setEventModal({ isOpen: true, type: 'add', eventId: null, title: '', description: '' });
    };

    const openEditEventModal = (event) => {
        setEventModal({ isOpen: true, type: 'edit', eventId: event.id, title: event.title, description: event.description || '' });
    };

    const closeEventModal = () => {
        setEventModal({ ...eventModal, isOpen: false });
    };

    const saveEvent = () => {
        if (!eventModal.title.trim()) return;

        if (eventModal.type === 'add') {
            const newEvent = {
                id: Date.now(),
                date: selectedDate.toISOString().split('T')[0],
                title: eventModal.title,
                description: eventModal.description
            };
            setEvents([...events, newEvent]);
        } else {
            setEvents(events.map(ev => ev.id === eventModal.eventId ? { ...ev, title: eventModal.title, description: eventModal.description } : ev));
        }
        closeEventModal();
    };

    const deleteEvent = (id) => {
        setEvents(events.filter(ev => ev.id !== id));
    };

    const getEventsForSelectedDate = () => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        return events.filter(ev => ev.date === dateStr);
    };

    // --- OTHER STATES ---
    const [reminders, setReminders] = usePersistentState(userId, 'reminders', []);

    const [notes, setNotes] = usePersistentState(userId, 'notes', []);

    const [tasks, setTasks] = usePersistentState(userId, 'tasks', []);

    const [newNote, setNewNote] = useState('');
    const [notesTab, setNotesTab] = useState('active');
    const [tasksTab, setTasksTab] = useState('active');
    const [taskModal, setTaskModal] = useState({ isOpen: false, type: 'add', taskId: null, title: '', category: '', note: '' });
    const [reminderModal, setReminderModal] = useState({ isOpen: false, title: '', date: '', time: '', type: 'normal' });
    const [shortcutModal, setShortcutModal] = useState({ isOpen: false, title: '', icon: 'Zap', color: 'blue' });
    const [quickActions, setQuickActions] = usePersistentState(userId, 'quick_actions', [
        { id: 1, label: 'Malzemeler', icon: 'Package', color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { id: 2, label: 'Stok Giriş', icon: 'Layers', color: 'text-green-400', bg: 'bg-green-400/10' },
        { id: 3, label: 'Yeni Sipariş', icon: 'ShoppingCart', color: 'text-orange-400', bg: 'bg-orange-400/10' },
        { id: 4, label: 'Sevkiyatlar', icon: 'Truck', color: 'text-purple-400', bg: 'bg-purple-400/10' }
    ]);

    // --- OTHER HANDLERS ---
    const addQuickAction = () => {
        if (!shortcutModal.title.trim()) return;
        const colors = {
            blue: { text: 'text-blue-400', bg: 'bg-blue-400/10' },
            green: { text: 'text-green-400', bg: 'bg-green-400/10' },
            orange: { text: 'text-orange-400', bg: 'bg-orange-400/10' },
            purple: { text: 'text-purple-400', bg: 'bg-purple-400/10' },
            pink: { text: 'text-pink-400', bg: 'bg-pink-400/10' },
            red: { text: 'text-red-400', bg: 'bg-red-400/10' },
        };
        const theme = colors[shortcutModal.color] || colors.blue;

        const newAction = {
            id: Date.now(),
            label: shortcutModal.title,
            icon: shortcutModal.icon,
            color: theme.text,
            bg: theme.bg
        };
        setQuickActions([...quickActions, newAction]);
        setShortcutModal({ isOpen: false, title: '', icon: 'Zap', color: 'blue' });
    };

    const deleteQuickAction = (id) => {
        setQuickActions(quickActions.filter(a => a.id !== id));
    };

    const saveReminder = () => {
        if (!reminderModal.title.trim() || !reminderModal.date) return;

        const newReminder = {
            id: Date.now(),
            title: reminderModal.title,
            date: new Date(`${reminderModal.date}T${reminderModal.time || '09:00'}`).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            type: reminderModal.type
        };
        setReminders([newReminder, ...reminders]);
        setReminderModal({ isOpen: false, title: '', date: '', time: '', type: 'normal' });
    };

    const deleteReminder = (id) => {
        setReminders(reminders.filter(r => r.id !== id));
    };


    // --- OTHER HANDLERS ---
    const addNote = () => {
        if (!newNote.trim()) return;
        const note = {
            id: Date.now(),
            text: newNote,
            time: new Date().toLocaleTimeString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
            completed: false,
            completedAt: null
        };
        setNotes([note, ...notes]);
        setNewNote('');
    };

    const toggleTask = (id) => {
        // Find the task
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (task.completed) {
            // Undo completion
            setTasks(tasks.map(t => t.id === id ? { ...t, completed: false, completedAt: null, completionNote: '' } : t));
        } else {
            // Open modal to complete
            setTaskModal({
                isOpen: true,
                type: 'complete',
                taskId: id,
                title: task.title,
                category: task.category,
                note: ''
            });
        }
    };

    const saveTask = () => {
        if (taskModal.type === 'add') {
            if (!taskModal.title.trim()) return;
            const newTask = {
                id: Date.now(),
                title: taskModal.title,
                category: taskModal.category || 'GENEL',
                completed: false,
                progress: 0
            };
            setTasks([newTask, ...tasks]);
        } else if (taskModal.type === 'complete') {
            setTasks(tasks.map(t => t.id === taskModal.taskId ? {
                ...t,
                completed: true,
                progress: 100,
                completedAt: new Date().toLocaleTimeString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
                completionNote: taskModal.note
            } : t));
        }
        setTaskModal({ ...taskModal, isOpen: false });
    };

    const deleteNote = (id) => {
        setNotes(notes.filter(n => n.id !== id));
    };
    const toggleNoteCompletion = (id) => {
        setNotes(notes.map(note => {
            if (note.id === id) {
                const isCompleted = !note.completed;
                return {
                    ...note,
                    completed: isCompleted,
                    completedAt: isCompleted ? new Date().toLocaleTimeString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : null
                };
            }
            return note;
        }));
    };

    // --- RENDER HELPERS ---
    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
        // Adjust for Monday start (Turkey standard)
        const startDay = firstDay === 0 ? 6 : firstDay - 1;

        const days = [];
        for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-8" />);
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toISOString().split('T')[0];
            const hasEvents = events.some(ev => ev.date === dateStr);
            const isSelected = selectedDate.getDate() === i && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
            const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            days.push(
                <div
                    key={i}
                    onClick={() => handleDateClick(i)}
                    onDoubleClick={() => handleDayDoubleClick(i)}
                    className={`relative h-8 flex items-center justify-center text-xs rounded-full cursor-pointer transition-all
              ${isSelected ? 'bg-[#137fec] text-white font-bold shadow-[0_0_10px_rgba(19,127,236,0.5)]' :
                            isToday ? 'border border-[#137fec] text-[#137fec]' : 'text-gray-400 hover:bg-white/10'}
            `}
                >
                    {i}
                    {hasEvents && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#137fec]"></div>
                    )}
                </div>
            );
        }
        return days;
    };

    const selectedDateEvents = getEventsForSelectedDate();

    // --- WIDGET ORDER STATE ---
    const [widgetOrder, setWidgetOrder] = usePersistentState(userId, 'widget_order', [
        'calendar', 'reminders', 'notes', 'quick_actions', 'tasks'
    ]);

    const moveWidget = (id, direction) => {
        const index = widgetOrder.indexOf(id);
        if (index === -1) return;

        const newOrder = [...widgetOrder];
        if (direction === 'left' && index > 0) {
            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        } else if (direction === 'right' && index < newOrder.length - 1) {
            [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
        }
        setWidgetOrder(newOrder);
    };

    const operationalWidgetIds = ['calendar', 'quick_actions'];
    const personalWidgetIds = ['reminders', 'notes', 'tasks'];
    const orderedOperationalWidgets = widgetOrder.filter((id) => operationalWidgetIds.includes(id));
    const orderedPersonalWidgets = widgetOrder.filter((id) => personalWidgetIds.includes(id));

    const renderWidgetSection = (title, description, accentClass, Icon, ids) => (
        <section className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#1f1f1f]/70 p-5 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ${accentClass}`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">{title}</h2>
                        <p className="mt-1 max-w-2xl text-sm text-gray-400">{description}</p>
                    </div>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    {ids.length} bilesen
                </span>
            </div>
            <div className="grid grid-cols-1 gap-x-6 grid-flow-row-dense md:grid-cols-12 transition-all" style={{ gridAutoRows: '1px' }}>
                {ids.map((id) => renderWidget(id))}
            </div>
        </section>
    );
    const renderWidget = (id) => {
        switch (id) {
            case 'calendar':
                return (
                    <DashboardWidget
                        key={id}
                        id="calendar"
                        title="Şirket Takvimi"
                        icon={Calendar}
                        iconColor="text-[#137fec]"
                        defaultColSpan={4}
                        defaultHeight={400}
                        onMove={(dir) => moveWidget('calendar', dir)}
                        headerAction={
                            <span
                                className="text-[10px] text-gray-500 cursor-pointer hover:text-white mr-2"
                                onClick={() => {
                                    const now = new Date();
                                    setCurrentDate(now);
                                    setSelectedDate(now);
                                }}
                            >
                                Bugün
                            </span>
                        }
                    >
                        <div className="flex flex-col h-full p-4">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="font-bold text-lg text-white">
                                    {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                </span>
                                <div className="flex gap-1">
                                    <button className="p-1 hover:bg-white/10 rounded" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}><ChevronLeft size={16} /></button>
                                    <button className="p-1 hover:bg-white/10 rounded" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}><ChevronRight size={16} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                                    <span key={d} className="text-[10px] font-bold text-gray-600 uppercase">{d}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {renderCalendar()}
                            </div>

                            <div className="mt-6 border-t border-white/5 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-gray-400">
                                        {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                    </span>
                                    <button
                                        onClick={openAddEventModal}
                                        className="text-[10px] font-bold text-[#137fec] hover:bg-[#137fec]/10 px-2 py-1 rounded transition-colors"
                                    >
                                        + Yeni Etkinlik
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {selectedDateEvents.length > 0 ? (
                                        selectedDateEvents.map(ev => (
                                            <div key={ev.id} className="flex items-start justify-between group bg-[#262626] p-2 rounded border border-white/5 hover:border-[#137fec]/30 transition-colors">
                                                <div className="flex flex-col overflow-hidden mr-2 cursor-pointer" onClick={() => openEditEventModal(ev)}>
                                                    <span className="text-[11px] text-gray-300 truncate font-medium">{ev.title}</span>
                                                    {ev.description && <span className="text-[10px] text-gray-500 truncate mt-0.5">{ev.description}</span>}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                                                    <button onClick={() => openEditEventModal(ev)} className="text-gray-500 hover:text-white"><MoreHorizontal size={12} /></button>
                                                    <button onClick={() => deleteEvent(ev.id)} className="text-gray-500 hover:text-red-500"><X size={12} /></button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-gray-600 text-[10px] italic">Bu tarih için planlanmış etkinlik bulunmuyor.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DashboardWidget>
                );
            case 'reminders':
                return (
                    <DashboardWidget
                        key={id}
                        id="reminders"
                        title="HATIRLATMALAR"
                        icon={Bell}
                        iconColor="text-[#e55050]"
                        defaultColSpan={4}
                        onMove={(dir) => moveWidget('reminders', dir)}
                        headerAction={
                            <button
                                onClick={() => setReminderModal({ isOpen: true, title: '', date: '', time: '', type: 'normal' })}
                                className="text-[10px] font-bold text-[#e55050] hover:bg-[#e55050]/10 px-2 py-1 rounded transition-colors mr-2"
                            >
                                + Yeni Hatırlatma
                            </button>
                        }
                    >
                        <div className="space-y-4 p-5 pt-2">
                            {reminders.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-gray-600 text-[10px] italic">Kayitli hatirlatma bulunmuyor.</p>
                                </div>
                            ) : (
                                reminders.map(rem => (
                                    <div key={rem.id} className="relative pl-4 border-l-2 border-gray-700 hover:border-[#e55050] transition-colors group">
                                        <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-[#1f1f1f] border-2 border-gray-700 group-hover:border-[#e55050]"></div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-medium text-white/90">{rem.title}</h4>
                                            <button onClick={() => deleteReminder(rem.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity">
                                                <X size={12} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] text-gray-500">{rem.date}</span>
                                            {rem.type === 'critical' && <span className="text-[9px] bg-[#e55050]/20 text-[#e55050] px-1.5 py-0.5 rounded">Kritik</span>}
                                            {rem.type === 'warning' && <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded">Önemli</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DashboardWidget>
                );
            case 'notes':
                return (
                    <DashboardWidget
                        key={id}
                        id="notes"
                        title="NOTLAR"
                        icon={FileText}
                        iconColor="text-[#f59e0b]"
                        defaultColSpan={4}
                        onMove={(dir) => moveWidget('notes', dir)}
                        headerAction={
                            <div className="flex bg-black/20 rounded-lg p-0.5 mr-2">
                                <button
                                    onClick={() => setNotesTab('active')}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${notesTab === 'active' ? 'bg-[#f59e0b] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Aktif
                                </button>
                                <button
                                    onClick={() => setNotesTab('completed')}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${notesTab === 'completed' ? 'bg-[#f59e0b] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Tamamlanan
                                </button>
                            </div>
                        }
                    >
                        <div className="flex flex-col h-full p-5 pt-2">
                            {notesTab === 'active' && (
                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addNote()}
                                        placeholder="Not ekleyin"
                                        className="w-full bg-[#151515] border border-dashed border-gray-700 rounded-lg py-3 px-4 text-xs text-white placeholder-gray-600 focus:border-[#f59e0b] focus:outline-none transition-colors"
                                    />
                                </div>
                            )}
                            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                {notes.filter(n => notesTab === 'active' ? !n.completed : n.completed).length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-600 text-[10px] italic">
                                            {notesTab === 'active' ? 'Henüz not eklenmemiş.' : 'Tamamlanan not bulunmuyor.'}
                                        </p>
                                    </div>
                                ) : (
                                    notes.filter(n => notesTab === 'active' ? !n.completed : n.completed).map(note => (
                                        <div key={note.id} className={`p-3 rounded-lg border transition-all ${note.completed ? 'bg-[#1a1a1a] border-green-500/10 opacity-75' : 'bg-[#262626] border-white/5 hover:border-[#f59e0b]/30'} group relative`}>
                                            <p className={`text-[12px] leading-relaxed whitespace-pre-line ${note.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{note.text}</p>
                                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-600">{note.time}</span>
                                                    {note.completed && <span className="text-[9px] text-green-500/60 mt-0.5">Tamamlandı: {note.completedAt}</span>}
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => toggleNoteCompletion(note.id)}
                                                        title={note.completed ? "Geri Al" : "Tamamla"}
                                                        className={`transition-colors ${note.completed ? 'text-green-500' : 'text-gray-600 hover:text-green-500'}`}
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button onClick={() => deleteNote(note.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </DashboardWidget>
                );
            case 'quick_actions':
                return (
                    <DashboardWidget
                        key={id}
                        id="quick_actions"
                        title="Hızlı Erişim"
                        icon={Zap}
                        iconColor="text-[#a855f7]"
                        defaultColSpan={6}
                        defaultHeight={250}
                        onMove={(dir) => moveWidget('quick_actions', dir)}
                    >
                        <div className="p-4 overflow-y-auto h-full custom-scrollbar">
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
                                {quickActions.map((action) => {
                                    const IconComponent = ICON_MAP[action.icon] || Zap;
                                    return (
                                        <div key={action.id} className="relative group">
                                            <button
                                                onClick={() => onOpenWindow(action.label)}
                                                className="w-full flex flex-col items-center justify-center p-4 rounded-xl bg-[#262626] border border-white/5 hover:border-white/20 hover:bg-[#2a2a2a] transition-all"
                                            >
                                                <div className={`w-10 h-10 rounded-full ${action.bg} ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                                    <IconComponent size={20} />
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-400 group-hover:text-white text-center">{action.label}</span>
                                            </button>
                                            <button
                                                onClick={() => deleteQuickAction(action.id)}
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-opacity bg-[#181818] rounded-full p-0.5"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    onClick={() => setShortcutModal({ isOpen: true, title: '', icon: 'Zap', color: 'blue' })}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-gray-700 hover:border-gray-500 hover:bg-white/5 transition-all group h-full min-h-[120px]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-gray-400">
                                        <Plus size={20} />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-300">Yeni Kısayol</span>
                                </button>
                            </div>
                        </div>
                    </DashboardWidget>
                );
            case 'tasks':
                return (
                    <DashboardWidget
                        key={id}
                        id="tasks"
                        title="Görevler"
                        icon={CheckSquare}
                        iconColor="text-[#10b981]"
                        defaultColSpan={6}
                        onMove={(dir) => moveWidget('tasks', dir)}
                        headerAction={
                            <div className="flex items-center gap-2">
                                <div className="flex bg-black/20 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setTasksTab('active')}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${tasksTab === 'active' ? 'bg-[#10b981] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Aktif
                                    </button>
                                    <button
                                        onClick={() => setTasksTab('completed')}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${tasksTab === 'completed' ? 'bg-[#10b981] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        Tamamlanan
                                    </button>
                                </div>
                                <button
                                    onClick={() => setTaskModal({ isOpen: true, type: 'add', taskId: null, title: '', category: '', note: '' })}
                                    className="text-[10px] bg-[#10b981]/10 text-[#10b981] px-3 py-1.5 rounded-md font-bold hover:bg-[#10b981]/20 transition-colors"
                                >
                                    + Yeni Görev
                                </button>
                            </div>
                        }
                    >
                        <div className="p-5 pt-2 space-y-3">
                            {tasks.filter(t => tasksTab === 'active' ? !t.completed : t.completed).length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 text-[10px] italic">
                                        {tasksTab === 'active' ? 'Bekleyen gorev bulunmuyor.' : 'Tamamlanan gorev bulunmuyor.'}
                                    </p>
                                </div>
                            ) : (
                                tasks.filter(t => tasksTab === 'active' ? !t.completed : t.completed).map(task => (
                                    <div key={task.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${task.completed ? 'bg-[#1a1a1a] border-transparent opacity-60' : 'bg-[#262626] border-white/5'}`}>
                                        <div
                                            onClick={() => toggleTask(task.id)}
                                            className={`mt-1 w-5 h-5 rounded border cursor-pointer flex items-center justify-center transition-colors shrink-0 ${task.completed ? 'bg-[#10b981] border-[#10b981]' : 'border-gray-600 hover:border-white'}`}
                                        >
                                            {task.completed && <Plus size={14} className="text-black rotate-45" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{task.category}</span>
                                                {task.completed && <span className="text-[9px] bg-green-500/20 text-green-500 px-1.5 rounded">Tamamlandı: {task.completedAt}</span>}
                                            </div>
                                            <h3 className={`text-sm font-medium break-words ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</h3>

                                            {!task.completed && (
                                                <div className="mt-2 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#137fec]" style={{ width: `${task.progress}%` }}></div>
                                                </div>
                                            )}
                                            {task.completed && task.completionNote && (
                                                <div className="mt-2 text-[10px] text-gray-500 bg-white/5 p-2 rounded italic">
                                                    "{task.completionNote}"
                                                </div>
                                            )}
                                        </div>
                                        <div className={`mt-2 w-2 h-2 rounded-full shrink-0 ${task.completed ? 'bg-gray-700' : 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DashboardWidget>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full h-full p-8 overflow-y-auto bg-[#181818] relative custom-scrollbar">
            <div className="max-w-[1600px] mx-auto pb-12 space-y-8 transition-all">
                {renderWidgetSection(
                    'Operasyon Merkezi',
                    'Gunluk uretim ve operasyon akisini takip eden bilesenler bu alanda toplanir.',
                    'text-blue-400',
                    Briefcase,
                    orderedOperationalWidgets
                )}
                {renderWidgetSection(
                    'Kisisel Calisma Alani',
                    'Kisisel takip, not ve hatirlatma araclari ayri bir bolumde duzenlenir.',
                    'text-emerald-400',
                    Users,
                    orderedPersonalWidgets
                )}
            </div>

            {/* MODAL (Portal) */}
            {eventModal.isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
                    <div className="bg-[#181818] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 w-[420px] transform transition-all scale-100">
                        <h3 className="text-lg font-bold text-white mb-6 text-center tracking-wide">
                            {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Etkinlik Başlığı</label>
                                <input
                                    type="text"
                                    value={eventModal.title}
                                    onChange={(e) => setEventModal({ ...eventModal, title: e.target.value })}
                                    placeholder="Örn: Yönetim Kurulu Toplantısı"
                                    autoFocus
                                    className="w-full bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] focus:outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Açıklama</label>
                                <textarea
                                    value={eventModal.description}
                                    onChange={(e) => setEventModal({ ...eventModal, description: e.target.value })}
                                    placeholder="Detaylı açıklama ekleyin..."
                                    rows={4}
                                    className="w-full bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] focus:outline-none resize-none transition-all placeholder:text-gray-600 custom-scrollbar"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            saveEvent();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={closeEventModal}
                                className="px-5 py-2.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={saveEvent}
                                className="px-6 py-2.5 rounded-lg text-xs font-bold bg-[#137fec] hover:bg-[#137fec]/90 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform active:scale-95 transition-all"
                            >
                                {eventModal.type === 'add' ? 'Etkinligi Kaydet' : 'Degisiklikleri Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* TASK MODAL */}
            {taskModal.isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
                    <div className="bg-[#181818] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 w-[420px] transform transition-all scale-100">
                        <h3 className="text-lg font-bold text-white mb-6 text-center tracking-wide">
                            {taskModal.type === 'add' ? 'Yeni Görev' : 'Görevi Tamamla'}
                        </h3>

                        <div className="space-y-4">
                            {taskModal.type === 'add' ? (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Kategori</label>
                                        <input
                                            type="text"
                                            value={taskModal.category}
                                            onChange={(e) => setTaskModal({ ...taskModal, category: e.target.value })}
                                            placeholder="Orn: Satin Alma"
                                            className="w-full bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] focus:outline-none transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Görev Adı</label>
                                        <input
                                            type="text"
                                            value={taskModal.title}
                                            onChange={(e) => setTaskModal({ ...taskModal, title: e.target.value })}
                                            placeholder="Gorev adini girin"
                                            autoFocus
                                            className="w-full bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] focus:outline-none transition-all placeholder:text-gray-600"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveTask();
                                            }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20 mb-4">
                                        <h4 className="text-sm font-bold text-green-500 mb-1">Görevi Tamamlıyorsunuz</h4>
                                        <p className="text-xs text-gray-400">{taskModal.title}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Tamamlama Notu / Rapor</label>
                                        <textarea
                                            value={taskModal.note}
                                            onChange={(e) => setTaskModal({ ...taskModal, note: e.target.value })}
                                            placeholder="Tamamlama notunu buraya ekleyin"
                                            rows={4}
                                            autoFocus
                                            className="w-full bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] focus:outline-none resize-none transition-all placeholder:text-gray-600"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    saveTask();
                                                }
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setTaskModal({ ...taskModal, isOpen: false })}
                                className="px-5 py-2.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={saveTask}
                                className="px-6 py-2.5 rounded-lg text-xs font-bold bg-[#10b981] hover:bg-[#10b981]/90 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transform active:scale-95 transition-all"
                            >
                                {taskModal.type === 'add' ? 'Gorevi Kaydet' : 'Gorevi Tamamla'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REMINDER MODAL */}
            {reminderModal.isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
                    <div className="bg-[#181818] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 w-[420px] transform transition-all scale-100">
                        <h3 className="text-lg font-bold text-white mb-6 text-center tracking-wide">Yeni Hatırlatma</h3>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Başlık</label>
                                <input
                                    type="text"
                                    value={reminderModal.title}
                                    onChange={(e) => setReminderModal({ ...reminderModal, title: e.target.value })}
                                    placeholder="Örn: Fatura Ödemesi"
                                    autoFocus
                                    className="w-full bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#e55050] focus:ring-1 focus:ring-[#e55050] focus:outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Tarih</label>
                                    <input
                                        type="date"
                                        value={reminderModal.date}
                                        onChange={(e) => setReminderModal({ ...reminderModal, date: e.target.value })}
                                        className="w-full bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#e55050] focus:ring-1 focus:ring-[#e55050] focus:outline-none transition-all calendar-icon-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Saat</label>
                                    <input
                                        type="time"
                                        value={reminderModal.time}
                                        onChange={(e) => setReminderModal({ ...reminderModal, time: e.target.value })}
                                        className="w-full bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#e55050] focus:ring-1 focus:ring-[#e55050] focus:outline-none transition-all time-icon-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Öncelik</label>
                                <div className="flex bg-[#222] p-1 rounded-xl border border-white/10">
                                    {['normal', 'warning', 'critical'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setReminderModal({ ...reminderModal, type })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${reminderModal.type === type ?
                                                (type === 'critical' ? 'bg-[#e55050] text-white' : type === 'warning' ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white')
                                                : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            {type === 'critical' ? 'Kritik' : type === 'warning' ? 'Önemli' : 'Normal'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setReminderModal({ ...reminderModal, isOpen: false })}
                                className="px-5 py-2.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={saveReminder}
                                className="px-6 py-2.5 rounded-lg text-xs font-bold bg-[#e55050] hover:bg-[#e55050]/90 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transform active:scale-95 transition-all"
                            >
                                Hatirlatmayi Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SHORTCUT MODAL */}
            {
                shortcutModal.isOpen && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
                        <div className="bg-[#181818] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 w-[420px] transform transition-all scale-100">
                            <h3 className="text-lg font-bold text-white mb-6 text-center tracking-wide">Yeni Kısayol</h3>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Kısayol Adı</label>
                                    <input
                                        type="text"
                                        value={shortcutModal.title}
                                        onChange={(e) => setShortcutModal({ ...shortcutModal, title: e.target.value })}
                                        placeholder="Örn: Finans Raporları"
                                        autoFocus
                                        className="w-full bg-[#222] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] focus:outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">İkon</label>
                                    <div className="grid grid-cols-6 gap-2 bg-[#222] p-2 rounded-xl border border-white/10 max-h-[120px] overflow-y-auto custom-scrollbar">
                                        {Object.keys(ICON_MAP).map(iconName => {
                                            const IconExp = ICON_MAP[iconName];
                                            return (
                                                <button
                                                    key={iconName}
                                                    onClick={() => setShortcutModal({ ...shortcutModal, icon: iconName })}
                                                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${shortcutModal.icon === iconName ? 'bg-[#a855f7] text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                                    title={iconName}
                                                >
                                                    <IconExp size={18} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Renk Temasi</label>
                                    <div className="flex bg-[#222] p-1 rounded-xl border border-white/10 gap-1 overflow-x-auto">
                                        {['blue', 'green', 'orange', 'purple', 'pink', 'red'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setShortcutModal({ ...shortcutModal, color })}
                                                className={`flex-1 py-2 rounded-lg transition-all ${shortcutModal.color === color ? 'ring-2 ring-white scale-95' : 'hover:scale-105'}`}
                                                style={{ backgroundColor: color === 'blue' ? '#60a5fa' : color === 'green' ? '#4ade80' : color === 'orange' ? '#fb923c' : color === 'purple' ? '#c084fc' : color === 'pink' ? '#f472b6' : '#f87171' }}
                                            >
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShortcutModal({ ...shortcutModal, isOpen: false })}
                                    className="px-5 py-2.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={addQuickAction}
                                    className="px-6 py-2.5 rounded-lg text-xs font-bold bg-[#a855f7] hover:bg-[#a855f7]/90 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transform active:scale-95 transition-all"
                                >
                                    Kısayolu Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

