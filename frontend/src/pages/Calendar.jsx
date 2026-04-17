import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit2, Calendar as CalendarIcon, Clock, Bell, MapPin, Map, Navigation } from 'lucide-react';
import EventMap from '../components/EventMap';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Calendar = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [mapEvent, setMapEvent] = useState(null); // Event to show on map
    const { token } = useContext(AuthContext);

    const fetchEvents = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/events', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchEvents();
        }
    }, [token]);

    // Timer for reminders (checks every 30 seconds)
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const alerts = [];

            events.forEach(async (event) => {
                if (!event.date || !event.time) return;
                
                const eventDateTime = new Date(`${event.date}T${event.time}`);
                const diffMs = eventDateTime - now;
                const diffMinutes = Math.floor(diffMs / (1000 * 60));

                let updateNeeded = false;
                let updatedFields = {};

                // Check 1-hour reminder
                if (diffMinutes <= 60 && diffMinutes > 30 && !event.notified1Hour) {
                    alerts.push({ id: `${event._id}-1h`, title: event.title, message: 'Starts in 1 hour!', location: event.location });
                    updateNeeded = true;
                    updatedFields.notified1Hour = true;
                }
                
                // Check 30-minute reminder
                if (diffMinutes <= 30 && diffMinutes >= 0 && !event.notified30Min) {
                    alerts.push({ id: `${event._id}-30m`, title: event.title, message: 'Starts in 30 minutes!', location: event.location });
                    updateNeeded = true;
                    updatedFields.notified30Min = true;
                }

                if (updateNeeded) {
                    try {
                        const res = await fetch(`http://localhost:5000/api/events/${event._id}`, {
                            method: 'PUT',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify(updatedFields)
                        });
                        if (res.ok) {
                            fetchEvents();
                        }
                    } catch (err) {
                        console.error('Error updating reminder flag', err);
                    }
                }
            });

            if (alerts.length > 0) {
                setNotifications(prev => [...prev, ...alerts]);
            }
        };

        const intervalId = setInterval(checkReminders, 30000);
        return () => clearInterval(intervalId);
    }, [events, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isEditing ? `http://localhost:5000/api/events/${editId}` : 'http://localhost:5000/api/events';
            const method = isEditing ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ title, date, time, description, location })
            });

            if (res.ok) {
                setTitle('');
                setDate('');
                setTime('');
                setDescription('');
                setLocation('');
                setIsEditing(false);
                setEditId(null);
                fetchEvents();
            }
        } catch (err) {
            console.error('Submit error:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await fetch(`http://localhost:5000/api/events/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchEvents();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleEdit = (event) => {
        setTitle(event.title);
        setDate(event.date);
        setTime(event.time);
        setDescription(event.description || '');
        setLocation(event.location || '');
        setIsEditing(true);
        setEditId(event._id);
        window.scrollTo(0, 0);
    };

    const clearNotification = (notifyId) => {
        setNotifications(prev => prev.filter(n => n.id !== notifyId));
    };

    const filteredEvents = (events || []).filter(e => 
        e.title.toLowerCase().includes(search.toLowerCase()) || 
        (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
        (e.location && e.location.toLowerCase().includes(search.toLowerCase()))
    );

    const formatRelativeDate = (dateStr, timeStr) => {
        const eventDate = new Date(`${dateStr}T${timeStr}`);
        const now = new Date();
        const diffMs = eventDate - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'Past event';
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays <= 7) return `In ${diffDays} days`;
        return `In ${Math.ceil(diffDays / 7)} weeks`;
    };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="max-w-6xl mx-auto space-y-8 pb-12 relative">
            {/* Map Modal */}
            {mapEvent && (
                <EventMap event={mapEvent} onClose={() => setMapEvent(null)} />
            )}

            {/* Notification Toast Area */}
            <div className="fixed top-20 right-6 z-50 flex flex-col space-y-3">
                <AnimatePresence>
                {notifications.map(notif => (
                    <motion.div layout initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }} key={notif.id} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start space-x-3 w-80">
                        <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-sm">{notif.title}</h4>
                            <p className="text-indigo-100 text-xs mt-1">{notif.message}</p>
                            {notif.location && (
                                <p className="text-indigo-200 text-xs mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {notif.location}
                                </p>
                            )}
                        </div>
                        <button onClick={() => clearNotification(notif.id)} className="text-white hover:text-indigo-200 text-lg">
                            &times;
                        </button>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>

            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                        Calendar & Events
                    </h1>
                </div>
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input 
                        type="search"
                        placeholder="Search events..."
                        className="pl-10 pr-4 py-2 w-full md:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input 
                            type="text" 
                            placeholder="Event Title" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="md:col-span-3 w-full text-lg font-medium bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:text-white placeholder-slate-400 transition-colors"
                            required 
                        />
                        <div className="relative">
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                                required 
                            />
                        </div>
                        <div className="relative">
                            <input 
                                type="time" 
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                                required 
                            />
                        </div>
                        <div className="relative">
                            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="📍 Location (e.g. New Delhi, India)" 
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400 transition-all"
                            />
                        </div>
                    </div>
                    
                    <textarea 
                        placeholder="Description (Optional)" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full h-24 bg-transparent outline-none resize-none dark:text-white placeholder-slate-400 mt-2 border-b border-slate-200 dark:border-slate-700 pb-2 focus:border-blue-500"
                    />
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/25">
                            {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            <span>{isEditing ? 'Update Event' : 'Add Event & Reminders'}</span>
                        </button>
                        {isEditing && (
                            <button type="button" onClick={() => { setIsEditing(false); setTitle(''); setDate(''); setTime(''); setDescription(''); setLocation(''); }} className="ml-3 px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>

            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                {filteredEvents.map(event => {
                    const eventDate = new Date(`${event.date}T${event.time}`);
                    const isPast = eventDate < new Date();
                    const relativeDate = formatRelativeDate(event.date, event.time);

                    return (
                        <motion.div variants={itemVariants} layout initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.8 }} key={event._id} className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 group relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 ${isPast ? 'opacity-70 grayscale-[50%]' : ''}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-cyan-600/5 rounded-bl-full -z-10"></div>
                            
                            {/* Relative date badge */}
                            <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isPast ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' :
                                relativeDate === 'Today' ? 'bg-red-50 dark:bg-red-500/15 text-red-500 animate-pulse' :
                                relativeDate === 'Tomorrow' ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-500' :
                                'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
                            }`}>
                                {relativeDate}
                            </div>

                            <div className="flex justify-between items-start mb-3 pr-20">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{event.title}</h3>
                            </div>

                            <div className="flex items-center space-x-3 mb-3 text-sm text-slate-600 dark:text-slate-300 font-medium flex-wrap gap-y-2">
                                <div className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md">
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    <span>{event.date}</span>
                                </div>
                                <div className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{event.time}</span>
                                </div>
                            </div>

                            {/* Location with Map button */}
                            {event.location && (
                                <div className="flex items-center justify-between mb-3 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 min-w-0">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <span className="truncate font-medium">{event.location}</span>
                                    </div>
                                    <button 
                                        onClick={() => setMapEvent(event)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md shrink-0 ml-2"
                                        title="Open in Map"
                                    >
                                        <Map className="w-3.5 h-3.5" />
                                        <span>Map</span>
                                    </button>
                                </div>
                            )}

                            <p className="text-slate-600 dark:text-slate-400 flex-1 whitespace-pre-wrap line-clamp-3 text-sm">
                                {event.description || <span className="italic text-slate-400">No description</span>}
                            </p>
                            
                            {/* Footer with actions */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full w-fit">
                                    <Bell className="w-3 h-3" />
                                    <span>Reminders Active</span>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(event)} className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(event._id)} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </motion.div>
            
            {filteredEvents.length === 0 && (
                <motion.div variants={itemVariants} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-300 dark:border-slate-700">
                        <CalendarIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium">No events scheduled</p>
                    <p className="text-sm mt-1">Add an event above with a location to see it on the map!</p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Calendar;
