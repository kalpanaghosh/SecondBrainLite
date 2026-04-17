import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, Calendar, Cpu } from 'lucide-react';

const typeIcons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    event: Calendar,
    system: Cpu,
};

const typeColors = {
    info: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
    success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
    event: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
    system: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10',
};

const NotificationBell = () => {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const [notifsRes, countRes] = await Promise.all([
                fetch('http://localhost:5000/api/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5000/api/notifications/unread-count', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            const notifs = await notifsRes.json();
            const count = await countRes.json();
            setNotifications(Array.isArray(notifs) ? notifs.slice(0, 5) : []);
            setUnreadCount(count.count || 0);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
            return () => clearInterval(interval);
        }
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id, e) => {
        e.stopPropagation();
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

    const timeSince = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return 'now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-subtle shadow-lg shadow-red-500/30">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-scale-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllRead}
                                    className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => {
                                const TypeIcon = typeIcons[notif.type] || Info;
                                const colorClass = typeColors[notif.type] || typeColors.info;
                                
                                return (
                                    <div 
                                        key={notif._id} 
                                        className={`flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-700/50 ${
                                            !notif.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''
                                        }`}
                                        onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                                    >
                                        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center shrink-0 mt-0.5`}>
                                            <TypeIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{notif.title}</p>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{notif.message}</p>
                                            <p className="text-xs text-slate-400 mt-1">{timeSince(notif.createdAt)}</p>
                                        </div>
                                        {!notif.read && (
                                            <button 
                                                onClick={(e) => markAsRead(notif._id, e)}
                                                className="p-1 text-slate-300 hover:text-emerald-500 transition-colors shrink-0"
                                                title="Mark as read"
                                            >
                                                <CheckCheck className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-10 text-center text-slate-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700">
                        <button 
                            onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                            className="w-full text-center text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors py-1"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
