import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Lock, File as FileIcon, Image as ImageIcon, FileText, AlertCircle, ShieldCheck } from 'lucide-react';

const SharedDocument = () => {
    const { shareId } = useParams();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState('');

    useEffect(() => {
        const fetchDocDetails = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/share/${shareId}`);
                if (res.ok) {
                    const data = await res.json();
                    setDoc(data);
                } else {
                    const errData = await res.json();
                    setError(errData.msg || 'Link not found or expired.');
                }
            } catch (err) {
                console.error(err);
                setError('Server error.');
            } finally {
                setLoading(false);
            }
        };

        fetchDocDetails();
    }, [shareId]);

    const handleDownload = async (e) => {
        e?.preventDefault();
        setDownloading(true);
        setDownloadError('');

        try {
            const res = await fetch(`http://localhost:5000/api/share/${shareId}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.originalName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errData = await res.json();
                setDownloadError(errData.msg || 'Failed to download.');
            }
        } catch (err) {
            console.error(err);
            setDownloadError('Network error while downloading.');
        } finally {
            setDownloading(false);
        }
    };

    const getFileIcon = (mimeType) => {
        if (!mimeType) return <FileIcon className="w-12 h-12 text-slate-500" />;
        if (mimeType.startsWith('image/')) return <ImageIcon className="w-12 h-12 text-blue-500" />;
        if (mimeType.includes('pdf')) return <FileText className="w-12 h-12 text-red-500" />;
        return <FileIcon className="w-12 h-12 text-slate-500" />;
    };

    const formatSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
                <div className="w-24 h-24 mb-6 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 text-center">Not Accessible</h1>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden relative">

                {/* Header Decoration */}
                <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 relative">
                    <div className="absolute inset-0 bg-white/20 blur-[2px] pattern-dots"></div>
                </div>

                {/* File Details */}
                <div className="px-8 pb-8 pt-0 relative flex flex-col items-center mt-[-3rem]">
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-4 border-white dark:border-slate-800 flex items-center justify-center mb-5 shrink-0 relative">
                        {getFileIcon(doc.mimeType)}
                        {doc.requiresPassword && (
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 text-white" title="Protected file">
                                <Lock className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center mb-1 max-w-full truncate px-4" title={doc.originalName}>
                        {doc.originalName}
                    </h2>

                    <div className="flex items-center gap-2 mb-8 mt-2 opacity-80">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold">
                            {formatSize(doc.size)}
                        </span>
                        {doc.expiresAt && (
                            <span className="px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-xs font-semibold">
                                Expires {new Date(doc.expiresAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {/* Action Area */}
                    <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                        {doc.requiresPassword ? (
                            <form onSubmit={handleDownload} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                        <Lock className="w-4 h-4 text-slate-400" /> Secure Download
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                        This file is protected. Enter the password below to decrypt and download it.
                                    </p>
                                    <input
                                        type="password"
                                        placeholder="Enter password..."
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white mb-2"
                                        required
                                    />
                                    {downloadError && (
                                        <p className="text-xs text-red-500 font-medium animate-fade-in">{downloadError}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={downloading || !password}
                                    className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl text-white font-semibold transition-all shadow-md ${downloading || !password
                                            ? 'bg-indigo-400 dark:bg-indigo-500/50 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]'
                                        }`}
                                >
                                    {downloading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <><ShieldCheck className="w-5 h-5" /> Decrypt & Download</>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {downloadError && (
                                    <p className="text-xs text-red-500 font-medium text-center bg-red-50 dark:bg-red-500/10 p-2 rounded-lg">{downloadError}</p>
                                )}
                                <p className="text-sm text-center text-slate-600 dark:text-slate-400 font-medium">Ready to download</p>
                                <button
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl text-white font-semibold transition-all shadow-md ${downloading
                                            ? 'bg-emerald-400 dark:bg-emerald-500/50 cursor-not-allowed shadow-none'
                                            : 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]'
                                        }`}
                                >
                                    {downloading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            <span>Downloading...</span>
                                        </>
                                    ) : (
                                        <><Download className="w-5 h-5 text-white/90" /> Download File</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
            {/* Footer */}
            <div className="mt-8 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 opacity-80">
                    Powered by <span className="font-bold text-slate-300 dark:text-slate-600">Second Brain</span>
                </p>
            </div>
        </div>
    );
};

export default SharedDocument;
