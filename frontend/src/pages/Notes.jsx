import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { detectPlatforms } from '../utils/detectPlatform';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [credentials, setCredentials] = useState([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const { token } = useContext(AuthContext);

    const fetchNotes = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/notes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setNotes(data);
        } catch (err) {
            console.error(err);
        }
    };

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
        fetchNotes();
        fetchCredentials();
    }, [token]);

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
    };

    const handleOpenPlatform = (platform) => {
        // Find matching credentials if they exist
        const match = credentials.find(c => 
            c.websiteName.toLowerCase().includes(platform.name.toLowerCase()) || 
            platform.name.toLowerCase().includes(c.websiteName.toLowerCase())
        );

        if (match) {
            navigator.clipboard.writeText(match.password);
            showToast(`Credentials copied for ${platform.name}! Paste on the login page. (User: ${match.username})`, 'success');
        } else {
            showToast(`Opening ${platform.name}. No saved credentials found.`, 'info');
        }
        
        window.open(platform.url, '_blank', 'noopener,noreferrer');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isEditing ? `http://localhost:5000/api/notes/${editId}` : 'http://localhost:5000/api/notes';
            const method = isEditing ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ title, content })
            });

            if (res.ok) {
                setTitle('');
                setContent('');
                setIsEditing(false);
                setEditId(null);
                fetchNotes();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this note?')) return;
        try {
            await fetch(`http://localhost:5000/api/notes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotes();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (note) => {
        setTitle(note.title);
        setContent(note.content);
        setIsEditing(true);
        setEditId(note._id);
        window.scrollTo(0, 0);
    };

    const filteredNotes = notes.filter(n => 
        n.title.toLowerCase().includes(search.toLowerCase()) || 
        n.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div initial="hidden" animate="show" variants={containerVariants} className="max-w-6xl mx-auto space-y-8 pb-12">
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Notes</h1>
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input 
                        type="search"
                        placeholder="Search notes..."
                        className="pl-10 pr-4 py-2 w-full md:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Note Title" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-lg font-medium bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white placeholder-slate-400 transition-colors"
                        required 
                    />
                    <textarea 
                        placeholder="Write your note here... (Tip: mention Facebook, Google, etc.)" 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-32 bg-transparent outline-none resize-none dark:text-white placeholder-slate-400 mt-2"
                        required
                    />
                    <div className="flex justify-end">
                        <button type="submit" className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30">
                            {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            <span>{isEditing ? 'Update Note' : 'Add Note'}</span>
                        </button>
                        {isEditing && (
                            <button type="button" onClick={() => { setIsEditing(false); setTitle(''); setContent(''); }} className="ml-3 px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>

            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                {filteredNotes.map(note => {
                    const platforms = detectPlatforms(note.content);
                    return (
                        <motion.div variants={itemVariants} layout initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.8 }} key={note._id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors group relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 rounded-bl-full -z-10"></div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{note.title}</h3>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(note)} className="p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors rounded">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(note._id)} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 flex-1 whitespace-pre-wrap line-clamp-4">{note.content}</p>
                            
                            {platforms.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
                                    {platforms.map((p, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleOpenPlatform(p)}
                                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                        >
                                            <span>Open {p.name}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </motion.div>
            
            {filteredNotes.length === 0 && (
                <motion.div variants={itemVariants} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-300 dark:border-slate-700">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium">No notes found</p>
                </motion.div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-8 right-8 z-50">
                    <div className={`px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                        toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 
                        toast.type === 'error' ? 'bg-red-500 border-red-400 text-white' : 
                        'bg-indigo-600 border-indigo-500 text-white'
                    }`}>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <Plus className="w-4 h-4 rotate-45 text-white" /> 
                        </div>
                        <p className="font-medium">{toast.message}</p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Notes;
