import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Sparkles, Plus, Edit2, Trash2, X, CheckCircle2, Image as ImageIcon,
    Tag, Eye, EyeOff, UploadCloud, ArrowUp, ArrowDown, Flame, Gift, Percent
} from 'lucide-react';
import MediaGallery from '@/Components/Media/MediaGallery';

export default function BannerIndex({ banners = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const gradientPresets = [
        { label: 'Warm Sunset (Orange/Amber)', value: 'from-orange-600 via-amber-600 to-slate-900' },
        { label: 'Midnight Elegance (Purple/Indigo)', value: 'from-purple-700 via-indigo-800 to-slate-950' },
        { label: 'Fresh Emerald (Green/Teal)', value: 'from-emerald-600 via-teal-700 to-slate-900' },
        { label: 'Crimson Delight (Rose/Red)', value: 'from-rose-600 via-red-700 to-slate-950' },
        { label: 'Golden Luxury (Yellow/Bronze)', value: 'from-amber-500 via-orange-600 to-slate-900' },
    ];

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        title: '',
        subtitle: '',
        badge_text: '',
        bg_gradient: 'from-orange-600 via-amber-600 to-slate-900',
        status: true,
        sort_order: 0,
        image: null
    });

    const openCreateModal = () => {
        setEditingBanner(null);
        reset();
        setPreviewImage(null);
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (banner) => {
        setEditingBanner(banner);
        setData({
            title: banner.title,
            subtitle: banner.subtitle || '',
            badge_text: banner.badge_text || '',
            bg_gradient: banner.bg_gradient || 'from-orange-600 via-amber-600 to-slate-900',
            status: banner.status == 1,
            sort_order: banner.sort_order || 0,
            image: null
        });
        setPreviewImage(banner.image_url);
        clearErrors();
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingBanner) {
            router.post(route('banners.update', editingBanner.id), {
                _method: 'put',
                ...data
            }, {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('banners.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (banner) => {
        if (confirm(`Are you sure you want to remove banner "${banner.title}"?`)) {
            router.delete(route('banners.destroy', banner.id));
        }
    };

    const handleToggleStatus = (banner) => {
        router.post(route('banners.toggle-status', banner.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Promotions & Exclusive Banners" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Title Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">Promotions & Exclusive Banners</h1>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Manage promotional offers displayed on the Guest QR Menu (`/cafe/qro/T1`).
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Banner</span>
                    </button>
                </div>

                {/* Banner Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {banners.length > 0 ? (
                        banners.map(banner => (
                            <div 
                                key={banner.id} 
                                className={`rounded-3xl border transition-all overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
                                    banner.status ? 'bg-white border-slate-200/80' : 'bg-slate-50 border-slate-200 opacity-70'
                                }`}
                            >
                                {/* Banner Card Preview */}
                                <div className={`relative p-6 bg-gradient-to-r ${banner.bg_gradient || 'from-orange-600 via-amber-600 to-slate-900'} text-white overflow-hidden min-h-[160px] flex flex-col justify-between`}>
                                    <div className="relative z-10 space-y-2">
                                        {banner.badge_text && (
                                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-orange-200 text-[10px] font-black uppercase tracking-widest">
                                                <Flame className="w-3 h-3" />
                                                <span>{banner.badge_text}</span>
                                            </span>
                                        )}
                                        <h3 className="text-lg font-black tracking-tight leading-snug">{banner.title}</h3>
                                        {banner.subtitle && (
                                            <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">{banner.subtitle}</p>
                                        )}
                                    </div>

                                    {/* Optional Right Side Image */}
                                    {banner.image_url && (
                                        <img 
                                            src={banner.image_url} 
                                            alt={banner.title} 
                                            className="absolute right-3 bottom-3 w-24 h-24 object-cover rounded-2xl border-2 border-white/20 shadow-lg" 
                                        />
                                    )}

                                    <div className="absolute right-[-10%] top-[-30%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                </div>

                                {/* Banner Card Footer Controls */}
                                <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleToggleStatus(banner)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5 transition-colors ${
                                                banner.status 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                                            }`}
                                        >
                                            {banner.status ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            <span>{banner.status ? 'Active' : 'Hidden'}</span>
                                        </button>
                                        <span className="text-[10px] font-bold text-slate-400">Order: #{banner.sort_order}</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => openEditModal(banner)}
                                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                            title="Edit Banner"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner)}
                                            className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                                            title="Delete Banner"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
                            <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
                            <div>
                                <h3 className="text-base font-black text-slate-900">No Exclusive Offer Banners Yet</h3>
                                <p className="text-xs text-slate-500 mt-1">Create your first banner offer to display on the Guest QR Menu.</p>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20"
                            >
                                Create Offer Banner
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative z-10 bg-white max-w-lg w-full rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-5 h-5 text-orange-500" />
                                <h3 className="text-base font-black text-slate-900">
                                    {editingBanner ? 'Edit Offer Banner' : 'Create Exclusive Offer Banner'}
                                </h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 20% OFF Weekend Special"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Offer Description</label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. Order any main course and get a free drink or dessert!"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                                    value={data.subtitle}
                                    onChange={e => setData('subtitle', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Exclusive Offer"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={data.badge_text}
                                        onChange={e => setData('badge_text', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Sort Order</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                        value={data.sort_order}
                                        onChange={e => setData('sort_order', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Gradient Style</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                                    value={data.bg_gradient}
                                    onChange={e => setData('bg_gradient', e.target.value)}
                                >
                                    {gradientPresets.map(preset => (
                                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Banner Image Upload / Gallery Picker */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Offer Image (Optional)</label>
                                <div className="flex items-center space-x-3">
                                    {previewImage ? (
                                        <img src={previewImage} className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0" alt="Preview" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="banner-image-file"
                                            onChange={e => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setData('image', file);
                                                    setPreviewImage(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                        <div className="flex items-center space-x-2">
                                            <label 
                                                htmlFor="banner-image-file" 
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                            >
                                                Upload File
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setIsGalleryOpen(true)}
                                                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold rounded-lg transition-colors"
                                            >
                                                Choose Gallery
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview Box */}
                            <div className="pt-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Live Preview</label>
                                <div className={`p-4 rounded-2xl bg-gradient-to-r ${data.bg_gradient} text-white shadow-md flex items-center justify-between gap-3`}>
                                    <div className="min-w-0 space-y-1">
                                        {data.badge_text && (
                                            <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-widest text-orange-200">
                                                {data.badge_text}
                                            </span>
                                        )}
                                        <p className="text-sm font-black truncate">{data.title || 'Banner Title'}</p>
                                        <p className="text-xs text-slate-200 font-medium line-clamp-1">{data.subtitle || 'Offer subtitle detail...'}</p>
                                    </div>
                                    {previewImage && (
                                        <img src={previewImage} className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0" alt="" />
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 hover:brightness-105"
                                >
                                    {editingBanner ? 'Save Changes' : 'Publish Banner'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Media Gallery Picker Modal */}
                    {isGalleryOpen && (
                        <MediaGallery 
                            onSelect={(url) => {
                                setData('image', url);
                                setPreviewImage(url);
                                setIsGalleryOpen(false);
                            }}
                            onClose={() => setIsGalleryOpen(false)}
                        />
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
