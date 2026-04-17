import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout, darkMode, toggleDarkMode } = useContext(AuthContext);

    return (
        <nav className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 transition-colors duration-200 sticky top-0 z-40">
            <div className="flex-1"></div>
            <div className="flex items-center space-x-3">
                <button 
                    onClick={toggleDarkMode} 
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 group"
                >
                    {darkMode 
                        ? <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" /> 
                        : <Moon className="w-5 h-5 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
                    }
                </button>
                
                <NotificationBell />

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-indigo-500/20">
                        {user?.username?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-1">
                        {user?.username}
                    </span>
                    <button 
                        onClick={logout}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
