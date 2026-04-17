import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { 
    UploadCloud, File as FileIcon, Image as ImageIcon, FileText, 
    Trash2, Link as ShareIcon, Download, Shield, ShieldAlert,
    X, Check, Lock, Globe, Clock, Copy, AlignLeft, Tag, Calendar, Sparkles
} from 'lucide-react';

const Documents = () => {
    const { token } = useContext(AuthContext);
    const [documents, setDocuments] = useState([]);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const fileInputRef = useRef(null);

    const initialFormState = {
        title: '',
        description: '',
        category: 'Personal',
        uploadDate: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState(initialFormState);

    // Share Modal state
    const [shareModal, setShareModal] = useState({ show: false, doc: null });
    const [shareSettings, setShareSettings] = useState({
        isShared: false,
        password: '',
        expiresAt: ''
    });

    const fetchDocuments = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/documents', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (token) fetchDocuments();
    }, [token]);

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            
            // Preview for images
            if (selectedFile.type.startsWith('image/')) {
                const url = URL.createObjectURL(selectedFile);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!file) {
            showToast('Please select a file to upload', 'error');
            return;
        }

        if (!formData.title || !formData.description || !formData.category) {
            showToast('Please fill all required form fields', 'error');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            showToast('File size exceeds 50MB limit', 'error');
            return;
        }

        const data = new FormData();
        data.append('file', file);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('uploadDate', formData.uploadDate);

        setUploading(true);
        try {
            const res = await fetch('http://localhost:5000/api/documents/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, 
                body: data
            });

            if (res.ok) {
                setFile(null);
                setPreviewUrl(null);
                setFormData(initialFormState);
                if (fileInputRef.current) fileInputRef.current.value = '';
                showToast('Document uploaded successfully', 'success');
                fetchDocuments();
            } else {
                const errData = await res.json();
                showToast(errData.msg || 'Upload failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Upload error. Note: Large files may exceed server limits.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (id, title, originalName) => {
        try {
            const res = await fetch(`http://localhost:5000/api/documents/download/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Download failed');
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const extMatch = originalName ? originalName.match(/\.[0-9a-z]+$/i) : null;
            const extension = extMatch ? extMatch[0] : '';
            a.download = `${title}${extension}`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            showToast('Error downloading file', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this document?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/documents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Document deleted', 'success');
                fetchDocuments();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openShareModal = (doc) => {
        setShareSettings({
            isShared: doc.isShared,
            password: '', 
            expiresAt: doc.expiresAt ? new Date(doc.expiresAt).toISOString().split('T')[0] : ''
        });
        setShareModal({ show: true, doc });
    };

    const handleSaveShareSettings = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...shareSettings };
            if (!payload.expiresAt) payload.expiresAt = null;

            const res = await fetch(`http://localhost:5000/api/documents/${shareModal.doc._id}/share`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast('Share settings updated', 'success');
                setShareModal({ show: false, doc: null });
                fetchDocuments();
            } else {
                showToast('Failed to update share settings', 'error');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const copyShareLink = (shareId) => {
        const url = `${window.location.origin}/share/${shareId}`;
        navigator.clipboard.writeText(url);
        showToast('Share link copied to clipboard', 'success');
    };

    const getFileIcon = (mimeType) => {
        if (!mimeType) return <FileIcon className="w-8 h-8 text-slate-500" />;
        if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />;
        if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" />;
        return <FileIcon className="w-8 h-8 text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]" />;
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // 3D Parallax Handlers
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        mouseX.set(x - rect.width / 2);
        mouseY.set(y - rect.height / 2);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const rotateX = useSpring(useTransform(mouseY, [-300, 300], [8, -8]), { stiffness: 150, damping: 20 });
    const rotateY = useSpring(useTransform(mouseX, [-400, 400], [-8, 8]), { stiffness: 150, damping: 20 });
    
    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div 
            initial="hidden" 
            animate="show" 
            variants={containerVariants}
            className="max-w-6xl mx-auto space-y-10 pb-16 relative perspective-1000"
        >
            {/* Ambient Background Elements */}
            <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-float-delayed"></div>

            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out blur-[2px]"></div>
                    <Shield className="w-7 h-7 text-white relative z-10" />
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-indigo-600 dark:from-white dark:to-indigo-300 tracking-tight flex items-center gap-2">
                        Secure Vault <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Form-based secure file management & next-gen sharing.</p>
                </div>
            </motion.div>

            {/* 3D Upload Form */}
            <motion.div 
                variants={itemVariants}
                style={{ perspective: 1200 }} 
                className="w-full relative z-10"
            >
                <motion.div 
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                    className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(99,102,241,0.1)] border border-white/50 dark:border-slate-700/50 p-8 relative overflow-hidden transition-colors duration-500 group"
                >
                    {/* Interactive Glare / Glow attached to mouse */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-3xl" style={{ transform: 'translateZ(1px)' }}></div>

                    <div style={{ transform: 'translateZ(40px)' }} className="relative z-10">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
                                <UploadCloud className="w-6 h-6 text-indigo-500 drop-shadow-md" />
                            </motion.div>
                            Upload Document
                        </h2>
                        
                        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 400 }}>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-400" /> Document Title *
                                    </label>
                                    <input type="text" name="title" value={formData.title} onChange={handleFormChange} required placeholder="e.g. Identity Scan 2024" className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white transition-all text-sm shadow-inner" />
                                </motion.div>
                                
                                <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 400 }}>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-purple-400" /> Category *
                                    </label>
                                    <select name="category" value={formData.category} onChange={handleFormChange} required className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none dark:text-white transition-all text-sm shadow-inner appearance-none cursor-pointer">
                                        <option value="Personal">Personal Vault</option>
                                        <option value="ID">Identification</option>
                                        <option value="Certificate">Certificate / License</option>
                                        <option value="Other">Other Document</option>
                                    </select>
                                </motion.div>

                                <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 400 }}>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-cyan-400" /> Upload Date
                                    </label>
                                    <input type="date" name="uploadDate" value={formData.uploadDate} onChange={handleFormChange} required className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none dark:text-white transition-all text-sm shadow-inner cursor-pointer" />
                                </motion.div>
                            </div>

                            <div className="space-y-5 flex flex-col h-full">
                                <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 400 }} className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <AlignLeft className="w-4 h-4 text-emerald-400" /> Description *
                                    </label>
                                    <textarea name="description" value={formData.description} onChange={handleFormChange} required rows="3" placeholder="Brief contextual description of this document..." className="w-full h-[calc(100%-2rem)] px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none dark:text-white transition-all text-sm resize-none shadow-inner"></textarea>
                                </motion.div>
                                
                                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-300 dark:border-indigo-500/50 border-dashed rounded-2xl cursor-pointer bg-indigo-50/30 dark:bg-indigo-500/5 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/20 transition-all duration-300 overflow-hidden relative group/dropzone shadow-inner">
                                        {/* Dropzone Animated Gradient Background */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent opacity-0 group-hover/dropzone:opacity-100 transition-opacity duration-500"></div>

                                        {previewUrl ? (
                                            <motion.img initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.8, scale: 1 }} src={previewUrl} alt="Preview" className="w-full h-full object-cover relative z-10" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center relative z-10 transform group-hover/dropzone:-translate-y-1 transition-transform duration-300 pt-2">
                                                <UploadCloud className="w-8 h-8 mb-2 text-indigo-400 group-hover/dropzone:text-indigo-500 group-hover/dropzone:scale-110 transition-all duration-300 drop-shadow-sm" />
                                                <p className="mb-1 text-sm text-slate-600 dark:text-slate-300 font-semibold tracking-wide">
                                                    {file ? file.name : <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Drop securely here</span>}
                                                </p>
                                                {!file && <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Any format up to 50MB</p>}
                                            </div>
                                        )}
                                        {file && previewUrl && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
                                                <p className="text-white font-semibold text-sm drop-shadow-lg shadow-black px-4 py-2 border border-white/20 bg-black/40 rounded-full backdrop-blur-md">{file.name}</p>
                                            </div>
                                        )}
                                        {file && !previewUrl && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-20">
                                                <FileIcon className="w-10 h-10 text-indigo-500 mb-2 drop-shadow-lg animate-bounce" style={{animationDuration: '2s'}} />
                                                <p className="font-bold text-sm text-slate-800 dark:text-white truncate px-6 max-w-full drop-shadow-sm">{file.name}</p>
                                            </div>
                                        )}
                                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </motion.div>
                            </div>
                            
                            <div className="md:col-span-2 flex justify-end mt-2 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                                <motion.button 
                                    whileHover={(!file || uploading || !formData.title || !formData.description) ? {} : { scale: 1.05, boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.4), 0 10px 10px -5px rgba(99, 102, 241, 0.2)" }}
                                    whileTap={(!file || uploading || !formData.title || !formData.description) ? {} : { scale: 0.95 }}
                                    type="submit" 
                                    disabled={!file || uploading || !formData.title || !formData.description} 
                                    className={`h-12 px-8 rounded-2xl font-bold text-white transition-all duration-300 flex items-center gap-3 ${(!file || uploading || !formData.title || !formData.description) ? 'bg-slate-200 dark:bg-slate-700/50 cursor-not-allowed shadow-none text-slate-400 dark:text-slate-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] hover:bg-[position:right_center] shadow-lg shadow-indigo-500/30'}`}
                                >
                                    {uploading ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></motion.div>
                                    ) : (
                                        <UploadCloud className="w-5 h-5 drop-shadow-md" />
                                    )}
                                    <span className="tracking-wide">{uploading ? 'Encrypting & Uploading...' : 'Secure Storage'}</span>
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>

            {/* Documents Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10 pt-4">
                <AnimatePresence>
                    {documents.map(doc => (
                        <motion.div 
                            variants={itemVariants}
                            layout
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                            key={doc._id} 
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-2xl dark:hover:shadow-indigo-500/10 border border-white/50 dark:border-slate-700/50 p-6 flex flex-col group transition-all duration-500 cursor-default transform hover:-translate-y-2 relative overflow-hidden"
                        >
                            {/* Card Hover Glow Background */}
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/0 outline-none to-indigo-500/5 dark:to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            <div className="flex justify-between items-start mb-5 relative z-10">
                                <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-600/50 shadow-inner overflow-hidden relative">
                                    <div className="absolute inset-0 bg-white/20 dark:bg-black/10 blur-[1px]"></div>
                                    <div className="relative z-10">{getFileIcon(doc.mimeType)}</div>
                                </motion.div>
                                <div className="flex flex-col items-end">
                                    {doc.isShared && (
                                        <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg mb-3 shadow-sm border border-emerald-200/50 dark:border-emerald-500/30 tracking-widest uppercase">
                                            <Globe className="w-3 h-3 animate-pulse" /> Live Share
                                        </motion.span>
                                    )}
                                    <div className="flex opacity-0 group-hover:opacity-100 transition-all duration-300 space-x-2 transform translate-x-4 group-hover:translate-x-0">
                                        <motion.button whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }} onClick={() => openShareModal(doc)} className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-700/50 rounded-xl transition-colors shadow-sm" title="Vault Settings">
                                            <ShareIcon className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button whileHover={{ scale: 1.1, rotate: -15 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(doc._id)} className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-700/50 rounded-xl transition-colors shadow-sm" title="Purge Record">
                                            <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-5 relative z-10 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm ${
                                        doc.category === 'Personal' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' :
                                        doc.category === 'ID' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                                        doc.category === 'Certificate' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                                        'bg-slate-100 text-slate-700 dark:bg-slate-600/50 dark:text-slate-300'
                                    }`}>
                                        {doc.category || 'General'}
                                    </span>
                                </div>
                                <h3 className="font-extrabold text-slate-800 dark:text-white text-lg tracking-tight truncate drop-shadow-sm" title={doc.title || doc.originalName}>{doc.title || doc.originalName}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-medium" title={doc.description}>{doc.description || 'No contextual description provided.'}</p>
                            </div>

                            <div className="mt-auto relative z-10">
                                <div className="flex items-center justify-between mb-4 text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Calendar className="w-3.5 h-3.5" /> {new Date(doc.uploadDate || doc.createdAt).toLocaleDateString()}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span className="text-slate-600 dark:text-slate-300 tracking-wide">{formatSize(doc.size)}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <motion.button 
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => handleDownload(doc._id, doc.title || doc.originalName, doc.originalName)} 
                                        className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white text-sm font-bold rounded-xl transition-colors border border-slate-200 dark:border-slate-600 shadow-sm shadow-slate-200/50 dark:shadow-none"
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </motion.button>
                                    {doc.isShared ? (
                                        <motion.button 
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => copyShareLink(doc.shareId)} 
                                            className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-xl transition-colors border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                                        >
                                            <Copy className="w-4 h-4" /> Link
                                        </motion.button>
                                    ) : (
                                        <motion.button 
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => openShareModal(doc)} 
                                            className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20"
                                        >
                                            <Globe className="w-4 h-4 drop-shadow-md" /> Share
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {documents.length === 0 && (
                <motion.div variants={itemVariants} className="text-center py-20 text-slate-500 dark:text-slate-400 relative z-10 w-full max-w-md mx-auto">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none relative">
                        <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl animate-pulse"></div>
                        <FileIcon className="w-10 h-10 text-slate-400 drop-shadow-md relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Vault is Empty</h3>
                    <p className="text-sm leading-relaxed">Securely upload and manage your critical files right here. State-of-the-art encryption combined with elegant accessibility.</p>
                </motion.div>
            )}

            {/* Share Modal */}
            <AnimatePresence>
                {shareModal.show && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden"
                        >
                            {/* Modal Background Glow */}
                            <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>

                            <button onClick={() => setShareModal({ show: false, doc: null })} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-700/50 p-2 rounded-full hover:rotate-90 duration-300">
                                <X className="w-5 h-5" />
                            </button>
                            
                            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2 flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400"><ShareIcon className="w-6 h-6" /></div> Target Link Settings
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium relative z-10">Configure public access constraints for your document.</p>

                            <form onSubmit={handleSaveShareSettings} className="space-y-6 relative z-10">
                                <motion.div whileHover={{ scale: 1.01 }} className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-base">Enable Live Share</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Allows strictly generic external link traversal.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={shareSettings.isShared} onChange={e => setShareSettings({...shareSettings, isShared: e.target.checked})} />
                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-cyan-500 shadow-inner"></div>
                                    </label>
                                </motion.div>

                                <AnimatePresence>
                                    {shareSettings.isShared && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-5 overflow-hidden"
                                        >
                                            <div className="pt-2">
                                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                    <Lock className="w-4 h-4 text-rose-500" /> Optional Protocol Password
                                                </label>
                                                <input 
                                                    type="password" 
                                                    value={shareSettings.password} 
                                                    onChange={e => setShareSettings({...shareSettings, password: e.target.value})} 
                                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none dark:text-white transition-all text-sm shadow-inner" 
                                                    placeholder="Secure the link with a secret codebase..." 
                                                />
                                            </div>
                                            <div>
                                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                    <Clock className="w-4 h-4 text-amber-500" /> Self-Destruct / Expiration
                                                </label>
                                                <input 
                                                    type="date" 
                                                    value={shareSettings.expiresAt} 
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={e => setShareSettings({...shareSettings, expiresAt: e.target.value})} 
                                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none dark:text-white transition-all text-sm cursor-pointer shadow-inner" 
                                                />
                                            </div>

                                            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 mt-6 shadow-sm">
                                                <p className="text-sm text-indigo-800 dark:text-indigo-300 flex items-center justify-between font-mono">
                                                    <span className="truncate mr-4 opacity-80">{`${window.location.origin}/share/${shareModal.doc.shareId}`}</span>
                                                    <button type="button" onClick={() => copyShareLink(shareModal.doc.shareId)} className="text-white hover:bg-indigo-700 bg-indigo-600 shrink-0 font-bold px-4 py-2 rounded-xl transition-all shadow-md">Copy</button>
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit" 
                                    className="w-full py-4 mt-8 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black text-base transition-all shadow-xl"
                                >
                                    Commit Parameters
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Toast System */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="fixed bottom-10 right-10 z-[100]"
                    >
                        <div className="px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 border relative overflow-hidden backdrop-blur-xl">
                            {/* Toast gradient Background */}
                            <div className={`absolute inset-0 opacity-90 ${
                                toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 
                                toast.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600' : 
                                'bg-gradient-to-r from-indigo-500 to-purple-600'
                            }`}></div>
                            
                            <div className="relative z-10 p-1.5 bg-white/20 rounded-full">
                                {toast.type === 'success' ? <Check className="w-5 h-5 text-white" /> : <ShieldAlert className="w-5 h-5 text-white" />}
                            </div>
                            <p className="font-bold text-sm text-white relative z-10 tracking-wide">{toast.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Documents;
