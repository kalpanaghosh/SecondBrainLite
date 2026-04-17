import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Brain, LayoutDashboard, FileText, KeyRound, Calendar, Bell, ChevronLeft, ChevronRight, FolderLock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/notes', icon: FileText, label: 'Notes' },
        { to: '/credentials', icon: KeyRound, label: 'Credentials' },
        { to: '/calendar', icon: Calendar, label: 'Calendar' },
        { to: '/documents', icon: FolderLock, label: 'Documents' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
    ];

    return (
        <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen transition-all duration-300 relative shrink-0 z-50`}>
            {/* Collapse Toggle */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-300 z-10 shadow-lg transition-colors"
            >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </motion.button>

            {/* Brand */}
            <div className={`p-6 flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} mb-2`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                    <Brain className="w-6 h-6 text-white" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <span className="text-lg font-bold text-white tracking-wide whitespace-nowrap">Second Brain</span>
                        <p className="text-xs text-slate-500 font-medium">Personal Hub</p>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="mx-4 mb-4 border-t border-slate-800"></div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {navItems.map(item => (
                    <NavLink 
                        key={item.to}
                        to={item.to} 
                        end={item.to === '/'}
                        className={({ isActive }) => 
                            `flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                                isActive 
                                ? 'text-white' 
                                : 'hover:bg-slate-800/70 hover:text-white'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <motion.div 
                                className="flex items-center w-full relative"
                                whileHover={{ x: collapsed ? 0 : 4 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="sidebarActive"
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/10 rounded-xl"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                                {isActive && (
                                    <motion.div 
                                        layoutId="sidebarIndicator"
                                        className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-500 rounded-r-full"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <div className={`relative flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-3'}`}>
                                    <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-400'} transition-colors relative z-10`} />
                                    {!collapsed && <span className="font-medium whitespace-nowrap relative z-10">{item.label}</span>}
                                </div>
                            </motion.div>
                        )}
                    </NavLink>
                ))}
            </nav>

        </aside>
    );
};

export default Sidebar;
