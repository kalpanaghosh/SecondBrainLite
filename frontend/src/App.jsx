import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Credentials from './pages/Credentials';
import Calendar from './pages/Calendar';
import Notifications from './pages/Notifications';
import Documents from './pages/Documents';
import SharedDocument from './pages/SharedDocument';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';

const ProtectedRoute = ({ children }) => {
    const { token, loading } = React.useContext(AuthContext);
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Loading your brain...</p>
            </div>
        </div>
    );
    if (!token) return <Navigate to="/login" />;
    return children;
};

const DashboardRoutes = () => {
    const location = useLocation();
    
    return (
        <ProtectedRoute>
            <div className="flex bg-slate-50/50 dark:bg-slate-900/50 min-h-screen transition-colors duration-500 relative overflow-hidden">
                {/* Global particles visible in all inner pages */}
                <ParticleBackground />
                
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 z-10 relative backdrop-blur-[2px]">
                    <Navbar />
                    <main className="p-6 flex-1 overflow-y-auto overflow-x-hidden relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 20, filter: 'blur(8px)', scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                                exit={{ opacity: 0, y: -20, filter: 'blur(8px)', scale: 0.98 }}
                                transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
                                className="h-full w-full"
                            >
                                <Routes location={location}>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/notes" element={<Notes />} />
                                    <Route path="/credentials" element={<Credentials />} />
                                    <Route path="/calendar" element={<Calendar />} />
                                    <Route path="/documents" element={<Documents />} />
                                    <Route path="/notifications" element={<Notifications />} />
                                </Routes>
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/share/:shareId" element={<SharedDocument />} />
                    
                    {/* All protected routes are managed by DashboardRoutes to keep Sidebar persistent and enable page transitions */}
                    <Route path="/*" element={<DashboardRoutes />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
