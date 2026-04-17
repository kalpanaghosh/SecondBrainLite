import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit2, Copy, Eye, EyeOff, ExternalLink, Shield, Check, User, Lock, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Credentials = () => {
    const [credentials, setCredentials] = useState([]);
    const [search, setSearch] = useState('');
    const [websiteName, setWebsiteName] = useState('');
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showPasswordMap, setShowPasswordMap] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'info', subtitle: '' });
    const [copySuccessMap, setCopySuccessMap] = useState({});
    const [showFormPassword, setShowFormPassword] = useState(false);
    const { token } = useContext(AuthContext);
    const toastTimeoutRef = useRef(null);
    const passwordTimeoutRefs = useRef({});
    const clipboardTimeoutRef = useRef(null);

    const fetchCredentials = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/credentials', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCredentials(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCredentials();
    }, [token]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            if (clipboardTimeoutRef.current) clearTimeout(clipboardTimeoutRef.current);
            Object.values(passwordTimeoutRefs.current).forEach(t => clearTimeout(t));
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const apiUrl = isEditing ? `http://localhost:5000/api/credentials/${editId}` : 'http://localhost:5000/api/credentials';
            const method = isEditing ? 'PUT' : 'POST';
            
            const res = await fetch(apiUrl, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ websiteName, url, username, password })
            });

            if (res.ok) {
                setWebsiteName('');
                setUrl('');
                setUsername('');
                setPassword('');
                setIsEditing(false);
                setEditId(null);
                setShowFormPassword(false);
                fetchCredentials();
                showToast(
                    isEditing ? 'Credential Updated' : 'Credential Saved',
                    isEditing ? 'Your changes have been saved securely.' : 'New credential stored securely.',
                    'success'
                );
            }
        } catch (err) {
            console.error(err);
            showToast('Error', 'Failed to save credential. Please try again.', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this credential?')) return;
        try {
            await fetch(`http://localhost:5000/api/credentials/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCredentials();
            showToast('Credential Deleted', 'The credential has been permanently removed.', 'warning');
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (cred) => {
        setWebsiteName(cred.websiteName);
        setUrl(cred.url);
        setUsername(cred.username);
        setPassword('');
        setIsEditing(true);
        setEditId(cred._id);
        setShowFormPassword(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const togglePassword = (id) => {
        const willShow = !showPasswordMap[id];
        setShowPasswordMap(prev => ({ ...prev, [id]: willShow }));

        // Auto-hide password after 30 seconds for security
        if (willShow) {
            if (passwordTimeoutRefs.current[id]) {
                clearTimeout(passwordTimeoutRefs.current[id]);
            }
            passwordTimeoutRefs.current[id] = setTimeout(() => {
                setShowPasswordMap(prev => ({ ...prev, [id]: false }));
            }, 30000);
        } else {
            if (passwordTimeoutRefs.current[id]) {
                clearTimeout(passwordTimeoutRefs.current[id]);
            }
        }
    };

    const showToast = useCallback((message, subtitle = '', type = 'info') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ show: true, message, subtitle, type });
        toastTimeoutRef.current = setTimeout(() => {
            setToast({ show: false, message: '', subtitle: '', type: 'info' });
        }, 4000);
    }, []);

    const dismissToast = () => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ show: false, message: '', subtitle: '', type: 'info' });
    };

    const scheduleClipboardClear = () => {
        if (clipboardTimeoutRef.current) clearTimeout(clipboardTimeoutRef.current);
        clipboardTimeoutRef.current = setTimeout(() => {
            navigator.clipboard.writeText('').catch(() => {});
        }, 60000); // Clear clipboard after 60 seconds for security
    };

    const copyToClipboard = async (text, id, type) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccessMap(prev => ({ ...prev, [`${id}-${type}`]: true }));
            const label = type === 'username' ? 'Username' : 'Password';
            showToast(`${label} Copied`, 'Paste it on the login page.', 'success');
            scheduleClipboardClear();
            setTimeout(() => {
                setCopySuccessMap(prev => ({ ...prev, [`${id}-${type}`]: false }));
            }, 2500);
        } catch (err) {
            showToast('Copy Failed', 'Unable to access clipboard.', 'error');
        }
    };

    const handleOpenWebsite = async (cred) => {
        try {
            // Step 1: Copy username first
            await navigator.clipboard.writeText(cred.username);
            
            showToast(
                '🔐 Credentials Ready',
                `Username copied! Opening ${cred.websiteName}...`,
                'login'
            );

            // Step 2: After a short delay, copy password (the more critical item to paste)
            setTimeout(async () => {
                try {
                    await navigator.clipboard.writeText(cred.password);
                    showToast(
                        '🔑 Password Copied',
                        `Paste on ${cred.websiteName} login page. Username: ${cred.username}`,
                        'login'
                    );
                    scheduleClipboardClear();
                } catch (err) {
                    console.error('Failed to copy password:', err);
                }
            }, 1500);

            // Open the URL in a new tab
            window.open(cred.url, '_blank', 'noopener,noreferrer');
        } catch (err) {
            // Fallback: just open the website
            showToast('Opening Website', 'Use the copy buttons to get your credentials.', 'info');
            window.open(cred.url, '_blank', 'noopener,noreferrer');
        }
    };

    const filteredCredentials = credentials.filter(c => 
        c.websiteName.toLowerCase().includes(search.toLowerCase()) || 
        c.username.toLowerCase().includes(search.toLowerCase())
    );

    const getToastConfig = (type) => {
        switch (type) {
            case 'success':
                return { bg: 'bg-emerald-500', icon: <Check className="w-4 h-4" />, ring: 'ring-emerald-400/30' };
            case 'error':
                return { bg: 'bg-red-500', icon: <X className="w-4 h-4" />, ring: 'ring-red-400/30' };
            case 'warning':
                return { bg: 'bg-amber-500', icon: <Shield className="w-4 h-4" />, ring: 'ring-amber-400/30' };
            case 'login':
                return { bg: 'bg-gradient-to-r from-indigo-600 to-purple-600', icon: <Lock className="w-4 h-4" />, ring: 'ring-indigo-400/30' };
            default:
                return { bg: 'bg-indigo-600', icon: <Shield className="w-4 h-4" />, ring: 'ring-indigo-400/30' };
        }
    };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Login Assistant</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Securely manage your credentials</p>
                    </div>
                </div>
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input 
                        type="search"
                        id="credential-search"
                        placeholder="Search sites or usernames..."
                        className="pl-10 pr-4 py-2.5 w-full md:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-sm hover:shadow-md"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </motion.div>

            {/* Add/Edit Form */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-all hover:shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center space-x-2">
                    {isEditing ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                    <span>{isEditing ? 'Edit Credential' : 'Add New Credential'}</span>
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 space-x-1.5">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            <span>Website Name</span>
                        </label>
                        <input type="text" id="input-website-name" value={websiteName} onChange={(e) => setWebsiteName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all" placeholder="e.g. Netflix" required />
                    </div>
                    <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 space-x-1.5">
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span>URL</span>
                        </label>
                        <input type="url" id="input-url" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all" placeholder="https://netflix.com" required />
                    </div>
                    <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 space-x-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Username / Email</span>
                        </label>
                        <input type="text" id="input-username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all" placeholder="user@example.com" required />
                    </div>
                    <div>
                        <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 space-x-1.5">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Password</span>
                            {isEditing && <span className="text-xs text-slate-400 font-normal ml-1">(leave blank to keep current)</span>}
                        </label>
                        <div className="relative">
                            <input 
                                type={showFormPassword ? 'text' : 'password'} 
                                id="input-password"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="w-full px-4 py-2.5 pr-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all" 
                                placeholder="••••••••" 
                                required={!isEditing} 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowFormPassword(!showFormPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                                title={showFormPassword ? 'Hide password' : 'Show password'}
                            >
                                {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="md:col-span-2 flex justify-end mt-2 space-x-3">
                        {isEditing && (
                            <button 
                                type="button" 
                                onClick={() => { setIsEditing(false); setWebsiteName(''); setUrl(''); setUsername(''); setPassword(''); setShowFormPassword(false); }} 
                                className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-all border border-slate-200 dark:border-slate-700"
                            >
                                Cancel
                            </button>
                        )}
                        <button type="submit" id="btn-save-credential" className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]">
                            {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            <span>{isEditing ? 'Save Changes' : 'Save Credential'}</span>
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* Credentials Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                {filteredCredentials.map(cred => (
                    <motion.div variants={itemVariants} layout initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.8 }} key={cred._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-all hover:shadow-lg hover:shadow-indigo-500/5 group relative overflow-hidden animate-scale-in">
                        {/* Decorative gradient corner */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-500/5 via-purple-600/5 to-transparent rounded-bl-full pointer-events-none"></div>
                        
                        {/* Card Header */}
                        <div className="p-6 pb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                                        {cred.websiteName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{cred.websiteName}</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]">{cred.url}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <button 
                                        onClick={() => handleEdit(cred)} 
                                        className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                                        title="Edit credential"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(cred._id)} 
                                        className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                        title="Delete credential"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Credential Details */}
                        <div className="mx-6 mb-4 space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            {/* Username Row */}
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>Username / Email</span>
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-slate-800 dark:text-slate-200 font-medium text-sm truncate mr-3">{cred.username}</p>
                                    <button 
                                        onClick={() => copyToClipboard(cred.username, cred._id, 'username')} 
                                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                            copySuccessMap[`${cred._id}-username`] 
                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/30' 
                                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-indigo-200 dark:hover:ring-indigo-500/30'
                                        }`}
                                        title="Copy Username"
                                        id={`copy-username-${cred._id}`}
                                    >
                                        {copySuccessMap[`${cred._id}-username`] ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copySuccessMap[`${cred._id}-username`] ? 'Copied!' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-slate-200 dark:bg-slate-700/60 w-full"></div>

                            {/* Password Row */}
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                                    <Lock className="w-3 h-3" />
                                    <span>Password</span>
                                    {showPasswordMap[cred._id] && (
                                        <span className="text-amber-500 dark:text-amber-400 ml-1 normal-case tracking-normal">(auto-hides in 30s)</span>
                                    )}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-slate-800 dark:text-slate-200 font-medium font-mono text-sm tracking-wider mr-3">
                                        {showPasswordMap[cred._id] ? cred.password : '••••••••••••'}
                                    </p>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => togglePassword(cred._id)} 
                                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                showPasswordMap[cred._id]
                                                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-500/30'
                                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-indigo-200 dark:hover:ring-indigo-500/30'
                                            }`}
                                            title={showPasswordMap[cred._id] ? 'Hide Password' : 'Show Password'}
                                            id={`toggle-password-${cred._id}`}
                                        >
                                            {showPasswordMap[cred._id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            <span>{showPasswordMap[cred._id] ? 'Hide' : 'Show'}</span>
                                        </button>
                                        <button 
                                            onClick={() => copyToClipboard(cred.password, cred._id, 'password')} 
                                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                                copySuccessMap[`${cred._id}-password`] 
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/30' 
                                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-indigo-200 dark:hover:ring-indigo-500/30'
                                            }`}
                                            title="Copy Password"
                                            id={`copy-password-${cred._id}`}
                                        >
                                            {copySuccessMap[`${cred._id}-password`] ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copySuccessMap[`${cred._id}-password`] ? 'Copied!' : 'Copy'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Open Website Button */}
                        <div className="px-6 pb-5">
                            <button 
                                onClick={() => handleOpenWebsite(cred)} 
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] group/btn"
                                id={`open-website-${cred._id}`}
                            >
                                <ExternalLink className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                                <span>Open Website</span>
                                <span className="text-indigo-200 text-xs font-normal ml-1">· credentials auto-copied</span>
                            </button>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </motion.div>

            {/* Empty State */}
            {filteredCredentials.length === 0 && (
                <motion.div variants={itemVariants} className="text-center py-16 animate-fade-in">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl flex items-center justify-center mb-5 border border-dashed border-slate-300 dark:border-slate-700 shadow-sm">
                        <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">No saved credentials</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mx-auto">Add your first login credential above to start using the Smart Login Assistant.</p>
                </motion.div>
            )}

            {/* Enhanced Toast Notification */}
            <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 ${
                toast.show 
                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 translate-y-4 pointer-events-none'
            }`}>
                {(() => {
                    const config = getToastConfig(toast.type);
                    return (
                        <div className={`${config.bg} rounded-2xl shadow-2xl ring-4 ${config.ring} flex items-start space-x-3 px-5 py-4 min-w-[320px] max-w-[420px]`}>
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm">{toast.message}</p>
                                {toast.subtitle && (
                                    <p className="text-white/80 text-xs mt-0.5 leading-relaxed">{toast.subtitle}</p>
                                )}
                            </div>
                            <button 
                                onClick={dismissToast}
                                className="text-white/60 hover:text-white transition-colors flex-shrink-0 mt-0.5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })()}
            </div>
        </motion.div>
    );
};

export default Credentials;
