import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import ParticleBackground from '../components/ParticleBackground';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, phone })
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token);
                navigate('/');
            } else {
                setError(data.msg || 'Registration failed');
            }
        } catch (err) {
            setError('Server error');
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors overflow-hidden z-0">
            <ParticleBackground />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative z-10 max-w-md w-full p-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-indigo-500/10 border border-white/50 dark:border-slate-700/50"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create Account</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start organizing your Second Brain</p>
                </div>
                
                {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg text-sm text-center">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:text-white transition-all"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:text-white transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp Phone Number (Optional)</label>
                        <input 
                            type="tel" 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:text-white transition-all"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1234567890"
                        />
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30"
                    >
                        Sign Up
                    </motion.button>
                </form>
                
                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account? <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Log in</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
