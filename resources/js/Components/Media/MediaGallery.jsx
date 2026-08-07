import React, { useState, useEffect } from 'react';
import { X, Search, Check, Upload, Image as ImageIcon, Trash2, Loader2, Camera, Edit3, Save, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function MediaGallery({ isOpen, onClose, onSelect, type = 'images', title = 'Media Gallery' }) {

    // Tiny helper: renders an img with graceful fallback placeholder
    const MediaThumb = ({ src, alt, className }) => {
        const [errored, setErrored] = React.useState(false);
        const [retried, setRetried]   = React.useState(false);

        const handleError = () => {
            if (!retried) {
                // Wait 1.5s then retry — gives server time to flush the file
                setTimeout(() => {
                    setRetried(true);
                    setErrored(false);
                }, 1500);
            } else {
                setErrored(true);
            }
        };

        if (errored) {
            return (
                <div className={`${className} bg-slate-100 flex items-center justify-center`}>
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                </div>
            );
        }

        // Append ?r=1 on retry to bust browser cache
        const imgSrc = retried ? src + (src.includes('?') ? '&r=1' : '?r=1') : src;
        return <img src={imgSrc} className={className} alt={alt} onError={handleError} />;
    };
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [view, setView] = useState('grid'); // 'grid' or 'upload'
    const [selected, setSelected] = useState(null);
    
    // Rename and delete states
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
            resetStates();
        }
    }, [isOpen, type]);

    const resetStates = () => {
        setSelected(null);
        setIsRenaming(false);
        setRenameValue('');
        setIsDeleting(false);
        setErrorMessage('');
        setUploading(false);
        setView('grid');
    };

    const fetchMedia = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const response = await axios.get(`/api/media?type=${type}`);
            setMedia(response.data);
        } catch (error) {
            console.error('Error fetching media:', error);
            setErrorMessage('Failed to load media assets.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setErrorMessage('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            const response = await axios.post('/api/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                const newAsset = response.data.media;
                // Add a local timestamp so the browser fetches fresh on first render
                newAsset.url = newAsset.url + (newAsset.url.includes('?') ? '&t=' : '?t=') + Date.now();
                setMedia(prev => [newAsset, ...prev]);
                setSelected(newAsset);
                setView('grid');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to upload image.');
        } finally {
            setUploading(false);
        }
    };

    const handleRename = async () => {
        if (!renameValue.trim() || renameValue.trim() === selected.name) {
            setIsRenaming(false);
            return;
        }

        setActionLoading(true);
        setErrorMessage('');
        try {
            const response = await axios.post('/api/media/rename', {
                path: selected.path,
                new_name: renameValue.trim()
            });

            if (response.data.success) {
                const updatedAsset = response.data.media;
                setMedia(prev => prev.map(item => item.path === selected.path ? updatedAsset : item));
                setSelected(updatedAsset);
                setIsRenaming(false);
            }
        } catch (error) {
            console.error('Rename error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to rename asset.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        setErrorMessage('');
        try {
            const response = await axios.post('/api/media/delete', {
                path: selected.path
            });

            if (response.data.success) {
                setMedia(prev => prev.filter(item => item.path !== selected.path));
                setSelected(null);
                setIsDeleting(false);
            }
        } catch (error) {
            console.error('Delete error:', error);
            setErrorMessage(error.response?.data?.message || 'Failed to delete asset.');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredMedia = media.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative z-10 w-full max-w-4xl rounded-2xl sm:rounded-[3rem] bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
                 style={{ height: 'min(85vh, 100%)' }}>

                {/* Header */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {type === 'images' ? 'Background Visuals' : 'Item Icons'} • {media.length} items
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-3 bg-slate-50 text-slate-400 rounded-xl sm:rounded-2xl hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-2.5 text-xs font-bold text-red-700 shrink-0">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                        <button onClick={() => setErrorMessage('')} className="ml-auto p-0.5 text-red-400 hover:text-red-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Toolbar */}
                <div className="px-4 sm:px-8 py-3 sm:py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3 shrink-0">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search assets..."
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* View tabs */}
                    <div className="flex items-center bg-slate-200/60 rounded-xl p-1 gap-1 shrink-0">
                        <button 
                            onClick={() => setView('grid')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Gallery
                        </button>
                        <button 
                            onClick={() => setView('upload')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Upload
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar bg-slate-50/30">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Scanning Assets...</p>
                        </div>
                    ) : view === 'grid' ? (
                        filteredMedia.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                                {filteredMedia.map((item) => (
                                    <div 
                                        key={item.path}
                                        onClick={() => {
                                            setSelected(item);
                                            setIsRenaming(false);
                                            setIsDeleting(false);
                                        }}
                                        className={`group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border-2 bg-white ${selected?.path === item.path ? 'border-blue-600 shadow-lg scale-95' : 'border-slate-100 hover:border-slate-300'} transition-all duration-200`}
                                    >
                                        <MediaThumb
                                            src={item.url} 
                                            className="w-full h-full object-cover" 
                                            alt={item.name} 
                                        />
                                        
                                        {selected?.path === item.path && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-blue-600/10">
                                                <div className="bg-blue-600 text-white p-2 rounded-xl shadow-xl">
                                                    <Check className="w-4 h-4 stroke-[3]" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-[8px] font-black text-white truncate uppercase tracking-widest">{item.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 space-y-4">
                                <ImageIcon className="w-16 h-16 text-slate-300" />
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Library is Empty</p>
                            </div>
                        )
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-full max-w-sm">
                                <div className="w-full aspect-video rounded-2xl sm:rounded-[2rem] bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4 relative hover:border-blue-500/40 transition-colors shadow-sm">
                                    {uploading ? (
                                        <div className="flex flex-col items-center space-y-3">
                                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uploading File...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm text-blue-600">
                                                <Camera className="w-8 h-8 sm:w-10 sm:h-10" />
                                            </div>
                                            <div className="text-center px-6">
                                                <p className="text-base sm:text-xl font-black text-slate-900">Push to Gallery</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                                                    Asset instantly available for all menu items
                                                </p>
                                            </div>
                                            <input 
                                                type="file" 
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                                onChange={handleUpload}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Selection Bar */}
                {selected && view === 'grid' && (
                    <div className="px-4 sm:px-8 py-3 sm:py-5 border-t border-slate-100 bg-white shrink-0 shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            
                            {/* File Info */}
                            <div className="flex items-center gap-3">
                                {/* Thumbnail */}
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow border border-slate-100 shrink-0">
                                    <MediaThumb src={selected.url} className="w-full h-full object-cover" alt={selected.name} />
                                </div>
                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    {isRenaming ? (
                                        <div className="flex items-center gap-1.5">
                                            <input 
                                                type="text" 
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                className="text-xs font-bold px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-44"
                                                autoFocus
                                            />
                                            <button 
                                                onClick={handleRename}
                                                disabled={actionLoading}
                                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            >
                                                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            </button>
                                            <button 
                                                onClick={() => setIsRenaming(false)}
                                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors text-[10px] font-bold"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-black text-slate-900 truncate max-w-[180px]">{selected.name}</p>
                                            <button 
                                                onClick={() => {
                                                    setRenameValue(selected.name);
                                                    setIsRenaming(true);
                                                    setIsDeleting(false);
                                                }}
                                                className="text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        Size: {formatBytes(selected.size)}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 sm:ml-auto">
                                {isDeleting ? (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl">
                                        <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Confirm Delete?</span>
                                        <button 
                                            onClick={handleDelete}
                                            disabled={actionLoading}
                                            className="px-2 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
                                        >
                                            {actionLoading ? '...' : 'Yes'}
                                        </button>
                                        <button 
                                            onClick={() => setIsDeleting(false)}
                                            className="px-2 py-1 bg-white text-slate-500 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider"
                                        >
                                            No
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setIsDeleting(true);
                                            setIsRenaming(false);
                                        }}
                                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                        title="Delete Asset"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                <button 
                                    onClick={() => setSelected(null)}
                                    className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Clear
                                </button>
                                
                                <button 
                                    onClick={() => onSelect(selected.path)}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow hover:bg-blue-700 transition-colors"
                                >
                                    Use Asset
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
