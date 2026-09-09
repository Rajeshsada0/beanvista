import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Settings, Globe, Palette, Languages, Save, Image as ImageIcon, CheckCircle2, Info, Star, ChefHat, AlertTriangle, Printer, FileText, UserCheck, QrCode, Zap, ArrowUp, Edit3, Share2, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingIndex({ settings }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        site_name: settings.site_name || '',
        site_description: settings.site_description || '',
        currency_symbol: settings.currency_symbol || '',
        contact_phone: settings.contact_phone || '',
        support_phone: settings.support_phone || '',
        contact_email: settings.contact_email || '',
        points_per_currency: settings.points_per_currency || '0.01',
        points_to_currency_rate: settings.points_to_currency_rate || '1',
        kds_warning_mins: settings.kds_warning_mins || '10',
        kds_critical_mins: settings.kds_critical_mins || '20',
        theme: settings.theme || 'brand',
        receipt_header: settings.receipt_header || '',
        receipt_footer: settings.receipt_footer || 'Thank you for visiting! Please come again.',
        show_tax_breakdown: settings.show_tax_breakdown === 'true' || settings.show_tax_breakdown === true || settings.show_tax_breakdown === '1' || settings.show_tax_breakdown === 1,
        show_customer_info: settings.show_customer_info === 'true' || settings.show_customer_info === true || settings.show_customer_info === '1' || settings.show_customer_info === 1,
        auto_print_receipt: settings.auto_print_receipt === 'true' || settings.auto_print_receipt === true || settings.auto_print_receipt === '1' || settings.auto_print_receipt === 1,
        address: settings.address || '',
        enable_guest_qr: settings.enable_guest_qr === 'true' || settings.enable_guest_qr === true || settings.enable_guest_qr === '1' || settings.enable_guest_qr === 1,
        enable_completed_order_edit: settings.enable_completed_order_edit === 'true' || settings.enable_completed_order_edit === true || settings.enable_completed_order_edit === '1' || settings.enable_completed_order_edit === 1,
        enable_social_links: settings.enable_social_links === undefined ? true : (settings.enable_social_links === 'true' || settings.enable_social_links === true || settings.enable_social_links === '1' || settings.enable_social_links === 1),
        social_heading: settings.social_heading || 'Follow & Review Us',
        social_subheading: settings.social_subheading || 'Loved our food & drinks? Follow our social channels and leave a review!',
        social_google_review: settings.social_google_review || '',
        social_instagram: settings.social_instagram || '',
        social_facebook: settings.social_facebook || '',
        social_tiktok: settings.social_tiktok || '',
        social_youtube: settings.social_youtube || '',
        social_whatsapp: settings.social_whatsapp || '',
        social_wifi_ssid: settings.social_wifi_ssid || '',
        social_wifi_password: settings.social_wifi_password || '',
        site_logo: null,
        site_favicon: null,
        mail_host: settings.mail_host || '',
        mail_port: settings.mail_port || '',
        mail_username: settings.mail_username || '',
        mail_password: settings.mail_password || '',
        mail_encryption: settings.mail_encryption || '',
        mail_from_address: settings.mail_from_address || '',
    });

    const [logoPreview, setLogoPreview] = useState(
        settings.site_logo ? (typeof settings.site_logo === 'string' ? settings.site_logo.replace('/storage/', '/img/') : settings.site_logo) : null
    );
    const [faviconPreview, setFaviconPreview] = useState(
        settings.site_favicon ? (typeof settings.site_favicon === 'string' ? settings.site_favicon.replace('/storage/', '/img/') : settings.site_favicon) : null
    );
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFileChange = (e, key, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setData(key, file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Cafe Settings" />

            <div className="flex flex-col space-y-4 w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
                            <Settings className="w-7 h-7 mr-3 text-brand-600" />
                            Cafe Settings
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Customize your cafe's branding, contact info, and localization.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {/* General Settings Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <Globe className="w-5 h-5 text-brand-600" />
                            <h2 className="text-base font-bold text-gray-900">General Information</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Site Name</label>
                                    <input
                                        type="text"
                                        value={data.site_name}
                                        onChange={e => setData('site_name', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                        placeholder="e.g. AI Cafe POS"
                                    />
                                    {errors.site_name && <p className="mt-1 text-xs text-red-600">{errors.site_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Currency Symbol</label>
                                    <input
                                        type="text"
                                        value={data.currency_symbol}
                                        onChange={e => setData('currency_symbol', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        placeholder="e.g. रू. or $"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Business Address</label>
                                    <input
                                        type="text"
                                        value={data.address}
                                        onChange={e => setData('address', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        placeholder="e.g. Kathmandu, Nepal"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Site Description</label>
                                <textarea
                                    rows="3"
                                    value={data.site_description}
                                    onChange={e => setData('site_description', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                                    placeholder="Brief description of your cafe..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Feature Management */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <Zap className="w-5 h-5 text-blue-500" />
                            <h2 className="text-base font-bold text-gray-900">Feature Management</h2>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div 
                                    onClick={() => setData('enable_guest_qr', !data.enable_guest_qr)}
                                    className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all group gap-4"
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${data.enable_guest_qr ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <QrCode className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">Guest QR Ordering</p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">Allow customers to scan QR codes and order from their phones.</p>
                                        </div>
                                    </div>
                                    <div className={`shrink-0 w-12 h-6 rounded-full relative transition-all duration-300 ${data.enable_guest_qr ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${data.enable_guest_qr ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setData('enable_completed_order_edit', !data.enable_completed_order_edit)}
                                    className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all group gap-4"
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${data.enable_completed_order_edit ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Edit3 className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">Edit Completed Orders</p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">Allow staff and admin to edit or modify orders after they are marked completed.</p>
                                        </div>
                                    </div>
                                    <div className={`shrink-0 w-12 h-6 rounded-full relative transition-all duration-300 ${data.enable_completed_order_edit ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${data.enable_completed_order_edit ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branding Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <Palette className="w-5 h-5 text-purple-500" />
                            <h2 className="text-base font-bold text-gray-900">Branding & Visuals</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Theme Selection */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">App Atmosphere (Theme Color)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { id: 'brand', name: 'brand Classic', color: 'bg-brand-600' },
                                        { id: 'red', name: 'Zesty Red', color: 'bg-red-500' },
                                        { id: 'green', name: 'Fresh Green', color: 'bg-emerald-500' },
                                        { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-600' },
                                    ].map((theme) => (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => setData('theme', theme.id)}
                                            className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-300 ${
                                                data.theme === theme.id 
                                                ? 'bg-white border-brand-500 shadow-md' 
                                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg ${theme.color} mb-2`}></div>
                                            <span className={`text-xs font-bold ${data.theme === theme.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {theme.name}
                                            </span>
                                            {data.theme === theme.id && (
                                                <div className="absolute top-2 right-2 bg-brand-500 text-white rounded-full p-0.5">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Logo Upload */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Main Logo</label>
                                    <div className="relative group">
                                        <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden relative transition-all group-hover:border-brand-400">
                                            {logoPreview ? (
                                                <img 
                                                    src={typeof logoPreview === 'string' ? logoPreview.replace('/storage/', '/img/') : logoPreview} 
                                                    className="w-full h-full object-contain p-3" 
                                                    alt="Logo Preview" 
                                                    onError={(e) => {
                                                        if (e.target.src.includes('/storage/')) {
                                                            e.target.src = e.target.src.replace('/storage/', '/img/');
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-center">
                                                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-xs text-gray-500">Click to upload logo</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                onChange={e => handleFileChange(e, 'site_logo', setLogoPreview)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1.5 text-center">Transparent PNG recommended (max 2MB)</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>


                    {/* Contact Info Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <Info className="w-5 h-5 text-blue-500" />
                            <h2 className="text-base font-bold text-gray-900">Contact Details</h2>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Support Email</label>
                                <input
                                    type="email"
                                    value={data.contact_email}
                                    onChange={e => setData('contact_email', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">General Contact Phone</label>
                                <input
                                    type="text"
                                    value={data.contact_phone}
                                    onChange={e => setData('contact_phone', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                    placeholder="e.g. +977-98XXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Reservation Support Phone</label>
                                <input
                                    type="text"
                                    value={data.support_phone}
                                    onChange={e => setData('support_phone', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                    placeholder="e.g. +977 1 4XXXXXX"
                                />
                                <p className="mt-1 text-xs text-gray-500">This number appears on the public booking page.</p>
                            </div>
                        </div>
                    </div>

                    {/* Social Media & Customer Engagement (Guest QR) Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-pink-500" />
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Social Media & Review Links (Guest QR)</h2>
                                    <p className="text-xs text-gray-500">Configure links shown on the table QR menu to boost followers and Google reviews.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setData('enable_social_links', !data.enable_social_links)}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <span className="text-xs font-bold text-gray-600 hidden sm:inline">
                                    {data.enable_social_links ? 'Enabled' : 'Disabled'}
                                </span>
                                <div className={`shrink-0 w-11 h-6 rounded-full relative transition-all duration-300 ${data.enable_social_links ? 'bg-pink-600' : 'bg-gray-200'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${data.enable_social_links ? 'left-6' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>
                        <div className={`p-4 space-y-4 ${!data.enable_social_links ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Section Heading</label>
                                    <input
                                        type="text"
                                        value={data.social_heading}
                                        onChange={e => setData('social_heading', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        placeholder="e.g. Follow & Review Us"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Subheading / Call-to-Action</label>
                                    <input
                                        type="text"
                                        value={data.social_subheading}
                                        onChange={e => setData('social_subheading', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        placeholder="e.g. Tag us in your photos & rate your experience!"
                                    />
                                </div>

                                {/* Google Review - Highlighted */}
                                <div className="md:col-span-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                            <label className="block text-xs font-black text-amber-900">Google Review / Google Maps Link</label>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/90 text-amber-800 px-2 py-0.5 rounded-md">Top Recommended</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={data.social_google_review}
                                        onChange={e => setData('social_google_review', e.target.value)}
                                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                        placeholder="e.g. https://g.page/r/.../review or https://maps.app.goo.gl/..."
                                    />
                                    <p className="mt-1 text-[11px] text-amber-700 font-medium">Guests will see a 5-star rating button that opens this direct Google review link.</p>
                                </div>

                                {/* Instagram */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                        Instagram Profile / Handle
                                    </label>
                                    <input
                                        type="text"
                                        value={data.social_instagram}
                                        onChange={e => setData('social_instagram', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        placeholder="e.g. https://instagram.com/mycafe or @mycafe"
                                    />
                                </div>

                                {/* Facebook */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                        Facebook Page Link
                                    </label>
                                    <input
                                        type="text"
                                        value={data.social_facebook}
                                        onChange={e => setData('social_facebook', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        placeholder="e.g. https://facebook.com/mycafe"
                                    />
                                </div>

                                {/* TikTok */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                                        TikTok Profile / Handle
                                    </label>
                                    <input
                                        type="text"
                                        value={data.social_tiktok}
                                        onChange={e => setData('social_tiktok', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        placeholder="e.g. https://tiktok.com/@mycafe or @mycafe"
                                    />
                                </div>

                                {/* YouTube */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                        YouTube Channel Link
                                    </label>
                                    <input
                                        type="text"
                                        value={data.social_youtube}
                                        onChange={e => setData('social_youtube', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        placeholder="e.g. https://youtube.com/@mycafe"
                                    />
                                </div>

                                {/* WhatsApp */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        WhatsApp Chat Number or Link
                                    </label>
                                    <input
                                        type="text"
                                        value={data.social_whatsapp}
                                        onChange={e => setData('social_whatsapp', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        placeholder="e.g. 98XXXXXXXX or https://wa.me/97798..."
                                    />
                                </div>

                                {/* WiFi Details */}
                                <div className="md:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wifi className="w-4 h-4 text-slate-700" />
                                        <label className="block text-xs font-bold text-slate-900">Guest WiFi Details (Optional)</label>
                                        <span className="text-[10px] text-slate-500">Displayed on the guest menu with a 1-tap "Copy Password" button</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">WiFi Network Name (SSID)</label>
                                            <input
                                                type="text"
                                                value={data.social_wifi_ssid}
                                                onChange={e => setData('social_wifi_ssid', e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                                placeholder="e.g. BeanVista_Guest"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">WiFi Password</label>
                                            <input
                                                type="text"
                                                value={data.social_wifi_password}
                                                onChange={e => setData('social_wifi_password', e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                                placeholder="e.g. coffee123"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loyalty Settings Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <Star className="w-5 h-5 text-amber-500" />
                            <h2 className="text-base font-bold text-gray-900">Loyalty Program</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Points Per Currency Unit</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.points_per_currency}
                                        onChange={e => setData('points_per_currency', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                        placeholder="e.g. 0.01 (1 point per 100 rupees)"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">How many points customers earn per currency unit spent</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Points to Currency Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.points_to_currency_rate}
                                        onChange={e => setData('points_to_currency_rate', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                        placeholder="e.g. 1 (1 point = 1 rupee)"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Exchange rate for redeeming points as currency discount</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Settings Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <Printer className="w-5 h-5 text-brand-500" />
                            <h2 className="text-base font-bold text-gray-900">Receipt & Invoice</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Receipt Header (Optional)</label>
                                        <textarea
                                            rows="2"
                                            value={data.receipt_header}
                                            onChange={e => setData('receipt_header', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                                            placeholder="Custom text at the top of receipt..."
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Receipt Footer</label>
                                        <textarea
                                            rows="2"
                                            value={data.receipt_footer}
                                            onChange={e => setData('receipt_footer', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                                            placeholder="Custom thank you message..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-xs font-bold text-gray-700 mb-2">Print Options</p>
                                    
                                    <div 
                                        onClick={() => setData('show_tax_breakdown', !data.show_tax_breakdown)}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all group gap-3"
                                    >
                                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${data.show_tax_breakdown ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">Tax Breakdown</p>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">Show individual lines for VAT, GST, etc.</p>
                                            </div>
                                        </div>
                                        <div className={`shrink-0 w-12 h-6 rounded-full relative transition-all duration-300 ${data.show_tax_breakdown ? 'bg-brand-500' : 'bg-gray-200'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${data.show_tax_breakdown ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => setData('show_customer_info', !data.show_customer_info)}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all group gap-3"
                                    >
                                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${data.show_customer_info ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <UserCheck className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">Customer Info</p>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">Include customer name/phone on receipt</p>
                                            </div>
                                        </div>
                                        <div className={`shrink-0 w-12 h-6 rounded-full relative transition-all duration-300 ${data.show_customer_info ? 'bg-brand-500' : 'bg-gray-200'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${data.show_customer_info ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => setData('auto_print_receipt', !data.auto_print_receipt)}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all group gap-3"
                                    >
                                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${data.auto_print_receipt ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <Printer className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">Auto Print on Complete</p>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">Redirect to receipt page when order is completed</p>
                                            </div>
                                        </div>
                                        <div className={`shrink-0 w-12 h-6 rounded-full relative transition-all duration-300 ${data.auto_print_receipt ? 'bg-brand-500' : 'bg-gray-200'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${data.auto_print_receipt ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kitchen KDS Timing Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <ChefHat className="w-5 h-5 text-orange-500" />
                            <h2 className="text-base font-bold text-gray-900">Kitchen KDS Timing</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-start space-x-2.5 bg-amber-50 rounded-lg p-3 border border-amber-200">
                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-700">These thresholds control when kitchen order cards change color. A <span className="text-amber-600">yellow</span> badge appears after the warning time, and a <span className="text-red-500">red URGENT</span> badge appears after the critical time. Timers reset when &quot;Start Preparing&quot; is clicked.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">⚠️ Warning After (minutes)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={data.kds_warning_mins}
                                        onChange={e => setData('kds_warning_mins', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                        placeholder="e.g. 10"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Card turns amber after this many minutes without being marked Ready</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">🔥 Critical / URGENT After (minutes)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="240"
                                        value={data.kds_critical_mins}
                                        onChange={e => setData('kds_critical_mins', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                                        placeholder="e.g. 20"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Card turns red with URGENT! badge after this many minutes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mail Configuration Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <h2 className="text-base font-bold text-gray-900">Mail Configuration (SMTP)</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-start space-x-2.5 bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-blue-700">Configure your own SMTP server to send out email receipts and notifications directly from your domain.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Mail Host</label>
                                    <input
                                        type="text"
                                        value={data.mail_host || ''}
                                        onChange={e => setData('mail_host', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="e.g. smtp.mailgun.org"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Mail Port</label>
                                    <input
                                        type="text"
                                        value={data.mail_port || ''}
                                        onChange={e => setData('mail_port', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="e.g. 587"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Mail Username</label>
                                    <input
                                        type="text"
                                        value={data.mail_username || ''}
                                        onChange={e => setData('mail_username', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Your SMTP Username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Mail Password</label>
                                    <input
                                        type="password"
                                        value={data.mail_password || ''}
                                        onChange={e => setData('mail_password', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Your SMTP Password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Mail Encryption</label>
                                    <input
                                        type="text"
                                        value={data.mail_encryption || ''}
                                        onChange={e => setData('mail_encryption', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="e.g. tls or ssl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">From Address</label>
                                    <input
                                        type="email"
                                        value={data.mail_from_address || ''}
                                        onChange={e => setData('mail_from_address', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="e.g. hello@mycafe.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button Container */}
                    <div className="flex items-center justify-end space-x-4 pt-2">
                        {recentlySuccessful && (
                            <div className="flex items-center text-emerald-600 font-semibold text-sm">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Settings saved successfully
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md outline-none focus:ring-2 focus:ring-brand-500/50 transition-all disabled:opacity-70 active:scale-[0.98] flex items-center space-x-2 text-sm"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Saving Changes...' : 'Save Cafe Settings'}</span>
                        </button>
                    </div>
                </form>

                {/* Scroll to Top Button */}
                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-full shadow-lg transition-all z-50"
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
