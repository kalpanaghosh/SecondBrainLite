import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    FileText, KeyRound, Calendar, Bell, MapPin, Clock,
    ArrowRight, Plus, Zap, Shield, Brain, Star, Activity, TrendingUp, Sparkles, FolderLock
} from 'lucide-react';
import { motion } from 'framer-motion';
import ThreeBackground from '../components/ThreeBackground';

const Dashboard = () => {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({ notes: 0, credentials: 0, events: 0, notifications: 0, documents: 0 });
    const [recentNotes, setRecentNotes] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [recentDocuments, setRecentDocuments] = useState([]);
    const [greeting, setGreeting] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };

        Promise.all([
            fetch('http://localhost:5000/api/notes', { headers }).then(r => r.json()),
            fetch('http://localhost:5000/api/credentials', { headers }).then(r => r.json()),
            fetch('http://localhost:5000/api/events', { headers }).then(r => r.json()),
            fetch('http://localhost:5000/api/notifications', { headers }).then(r => r.json()).catch(() => []),
            fetch('http://localhost:5000/api/documents', { headers }).then(r => r.json()).catch(() => [])
        ]).then(([notes, creds, events, notifs, docs]) => {
            setStats({
                notes: Array.isArray(notes) ? notes.length : 0,
                credentials: Array.isArray(creds) ? creds.length : 0,
                events: Array.isArray(events) ? events.length : 0,
                notifications: Array.isArray(notifs) ? notifs.filter(n => !n.read).length : 0,
                documents: Array.isArray(docs) ? docs.length : 0
            });
            setRecentNotes(Array.isArray(notes) ? notes.slice(-3).reverse() : []);
            setRecentDocuments(Array.isArray(docs) ? docs.slice(0, 3) : []);
            // Get upcoming events (future only)
            const now = new Date();
            const upcoming = (Array.isArray(events) ? events : [])
                .filter(e => new Date(`${e.date}T${e.time}`) > now)
                .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
                .slice(0, 3);
            setUpcomingEvents(upcoming);
            setRecentNotifications(Array.isArray(notifs) ? notifs.slice(0, 3) : []);
        }).catch(err => console.error(err));
    }, [token]);

    const statCards = [
        { label: 'Total Notes', value: stats.notes, icon: FileText, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/25', bg: 'bg-violet-50 dark:bg-violet-500/10', onClick: () => navigate('/notes') },
        { label: 'Saved Logins', value: stats.credentials, icon: KeyRound, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25', bg: 'bg-emerald-50 dark:bg-emerald-500/10', onClick: () => navigate('/credentials') },
        { label: 'Events', value: stats.events, icon: Calendar, color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/25', bg: 'bg-blue-50 dark:bg-blue-500/10', onClick: () => navigate('/calendar') },
        { label: 'Documents', value: stats.documents, icon: FolderLock, color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/25', bg: 'bg-pink-50 dark:bg-pink-500/10', onClick: () => navigate('/documents') },
        { label: 'Unread Alerts', value: stats.notifications, icon: Bell, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25', bg: 'bg-amber-50 dark:bg-amber-500/10', onClick: () => navigate('/notifications') },
    ];

    const quickActions = [
        { label: 'New Note', icon: FileText, path: '/notes', color: 'text-violet-500' },
        { label: 'Add Event', icon: Calendar, path: '/calendar', color: 'text-blue-500' },
        { label: 'Save Login', icon: Shield, path: '/credentials', color: 'text-emerald-500' },
        { label: 'Upload Doc', icon: FolderLock, path: '/documents', color: 'text-pink-500' },
        { label: 'Send Alert', icon: Bell, path: '/notifications', color: 'text-amber-500' },
    ];

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    const scaleVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="max-w-7xl mx-auto space-y-8 pb-12"
        >
            {/* Hero Welcome Section */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-8 text-white shadow-2xl shadow-indigo-500/20 min-h-[220px] flex flex-col justify-center border border-indigo-500/20">
                <ThreeBackground />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none"></div>
                <div className="absolute top-8 right-12 animate-pulse-slow pointer-events-none">
                    <Sparkles className="w-6 h-6 text-yellow-300/60" />
                </div>
                <div className="absolute bottom-12 right-40 animate-float-delayed pointer-events-none">
                    <Star className="w-5 h-5 text-pink-300/40" />
                </div>
                <div className="relative z-10 pointer-events-none">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                    <Brain className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-indigo-100 text-sm font-medium">{greeting},</p>
                                    <h1 className="text-3xl font-bold tracking-tight">{user?.username || 'User'} 👋</h1>
                                </div>
                            </div>
                            <p className="text-indigo-100 mt-3 max-w-lg text-sm leading-relaxed">
                                You have <span className="font-bold text-white">{stats.notes}</span> notes,
                                <span className="font-bold text-white"> {stats.events}</span> events, and
                                <span className="font-bold text-white"> {stats.notifications}</span> unread notifications.
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-4xl font-bold tabular-nums tracking-tight drop-shadow-md">{formatTime(currentTime)}</div>
                            <p className="text-indigo-200 text-sm mt-1">{formatDate(currentTime)}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((card, i) => (
                    <motion.button
                        variants={scaleVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        key={i}
                        onClick={card.onClick}
                        className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm text-left overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-slate-50 dark:to-slate-700/30 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md ${card.shadow} mb-3`}>
                            <card.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-3xl font-bold text-slate-800 dark:text-white">{card.value}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{card.label}</p>
                        <ArrowRight className="w-4 h-4 absolute bottom-5 right-5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </motion.button>
                ))}
            </div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {quickActions.map((action, i) => (
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            key={i}
                            onClick={() => navigate(action.path)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 transition-colors group"
                        >
                            <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                                <action.icon className={`w-4 h-4 ${action.color}`} />
                            </div>
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{action.label}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Notes */}
                <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-violet-500" />
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Notes</h2>
                        </div>
                        <button onClick={() => navigate('/notes')} className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors">
                            View All <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    {recentNotes.length > 0 ? (
                        <div className="space-y-3">
                            {recentNotes.map(note => (
                                <div key={note._id} className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer" onClick={() => navigate('/notes')}>
                                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                        <FileText className="w-5 h-5 text-violet-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{note.title}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2">{note.content}</p>
                                    </div>
                                    <span className="text-xs text-slate-400 shrink-0">{new Date(note.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No notes yet. Start writing!</p>
                        </div>
                    )}
                </motion.div>

                {/* Recent Documents */}
                <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <FolderLock className="w-5 h-5 text-pink-500" />
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Documents</h2>
                        </div>
                        <button onClick={() => navigate('/documents')} className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors">
                            View All <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    {recentDocuments.length > 0 ? (
                        <div className="space-y-3">
                            {recentDocuments.map(doc => (
                                <div key={doc._id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent hover:border-pink-200 dark:hover:border-pink-800 transition-all group cursor-pointer" onClick={() => navigate('/documents')}>
                                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{doc.title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                        <span className="font-semibold text-pink-500">{doc.category || 'General'}</span> • {new Date(doc.uploadDate || doc.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <FolderLock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No recent documents</p>
                        </div>
                    )}
                </motion.div>

                {/* Upcoming Events */}
                <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Upcoming</h2>
                        </div>
                        <button onClick={() => navigate('/calendar')} className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors">
                            View All <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    {upcomingEvents.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingEvents.map(event => (
                                <div key={event._id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all group cursor-pointer" onClick={() => navigate('/calendar')}>
                                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{event.title}</h3>
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                        <span className="flex items-center gap-1 text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md font-medium">
                                            <Calendar className="w-3 h-3" /> {event.date}
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md font-medium">
                                            <Clock className="w-3 h-3" /> {event.time}
                                        </span>
                                    </div>
                                    {event.location && (
                                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            <MapPin className="w-3 h-3" /> {event.location}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No upcoming events</p>
                        </div>
                    )}
                </motion.div>
            </div>

        </motion.div>
    );
};

export default Dashboard;
