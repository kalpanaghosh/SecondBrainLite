import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
    Bell, CheckCheck, Trash2, 
    Info, AlertTriangle, CheckCircle, Calendar, Cpu,
    Search, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const typeConfig = {
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-500' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-500' },
    success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-500' },
    event: { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-800', badge: 'bg-purple-500' },
    system: { icon: Cpu, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-800', badge: 'bg-rose-500' },
};

const Notifications = () => {
    const { token, user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');

    const fetchNotifications = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
        }
    }, [token]);

    const markAsRead = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch('http://localhost:5000/api/notifications/mark-all-read', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                           n.message.toLowerCase().includes(search.toLowerCase());
        const matchType = filterType === 'all' || n.type === filterType;
        return matchSearch && matchType;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const timeSince = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                        <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Notifications</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={markAllRead}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <CheckCheck className="w-4 h-4" /> Mark All Read
                    </button>
                </div>
            </motion.div>



            {/* Filters */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        placeholder="Search notifications..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none dark:text-white transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-slate-400" />
                    {['all', 'info', 'event'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                                filterType === t 
                                    ? 'bg-amber-500 text-white shadow-sm' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Notifications List */}
            <motion.div variants={containerVariants} className="space-y-3">
                <AnimatePresence>
                {filteredNotifications.map(notif => {
                    const config = typeConfig[notif.type] || typeConfig.info;
                    const TypeIcon = config.icon;
                    
                    return (
                        <motion.div 
                            variants={itemVariants}
                            layout
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, scale: 0.8, x: -50 }}
                            key={notif._id} 
                            className={`group relative bg-white dark:bg-slate-800 rounded-xl border p-5 transition-all duration-300 hover:shadow-md ${
                                notif.read 
                                    ? 'border-slate-200 dark:border-slate-700' 
                                    : `${config.border} ring-1 ring-inset ring-opacity-20`
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                                    <TypeIcon className={`w-5 h-5 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {!notif.read && <div className={`w-2 h-2 rounded-full ${config.badge} animate-pulse`}></div>}
                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{notif.title}</h3>
                                        {notif.isBroadcast && (
                                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                                                BROADCAST
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-full capitalize">
                                            {notif.type}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm">{notif.message}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                        <span>From: <span className="font-medium text-slate-600 dark:text-slate-300">{notif.sender?.username || 'System'}</span></span>
                                        <span>{timeSince(notif.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    {!notif.read && (
                                        <button 
                                            onClick={() => markAsRead(notif._id)}
                                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                                            title="Mark as read"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                        </button>
                                    )}
                                    {notif.sender?._id === user?._id && (
                                        <button 
                                            onClick={() => deleteNotification(notif._id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </motion.div>

            {filteredNotifications.length === 0 && (
                <motion.div variants={itemVariants} className="text-center py-16 text-slate-500 dark:text-slate-400">
                    <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-300 dark:border-slate-700">
                        <Bell className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm mt-1">You will receive system alerts and updates here.</p>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Notifications;
