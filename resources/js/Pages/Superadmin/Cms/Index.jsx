import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { 
    Settings, Globe, Phone, FileText, HelpCircle, MessageSquare, 
    Upload, Plus, Trash2, CheckCircle, XCircle, Star, Image as ImageIcon
} from 'lucide-react';

export default function Index({ settings, reviews }) {
    const [activeTab, setActiveTab] = useState('seo');
    const [logoPreview, setLogoPreview] = useState(
        settings.site_logo ? (typeof settings.site_logo === 'string' ? settings.site_logo.replace('/storage/', '/img/') : settings.site_logo) : null
    );
    const [faviconPreview, setFaviconPreview] = useState(
        settings.site_favicon ? (typeof settings.site_favicon === 'string' ? settings.site_favicon.replace('/storage/', '/img/') : settings.site_favicon) : null
    );
    
    // Track previews for the 9 feature images
    const [featurePreviews, setFeaturePreviews] = useState(() => {
        const previews = {};
        for (let i = 1; i <= 9; i++) {
            const val = settings[`feature_image_${i}`];
            previews[`feature_image_${i}`] = (val && typeof val === 'string') ? val.replace('/storage/', '/img/') : (val || null);
        }
        return previews;
    });

    // Form fields setup
    const formFields = {
        seo_title: settings.seo_title,
        seo_description: settings.seo_description,
        seo_keywords: settings.seo_keywords,
        logo: null,
        favicon: null,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        contact_address: settings.contact_address,
        contact_whatsapp: settings.contact_whatsapp,
        playstore_url: settings.playstore_url || '',
        page_about_content: settings.page_about_content,
        page_privacy_content: settings.page_privacy_content,
        page_tnc_content: settings.page_tnc_content,
        faq_content: settings.faq_content || [],
        
        features_section_tag: settings.features_section_tag || '',
        features_section_title: settings.features_section_title || '',
    };

    // Add dynamic keys for the 9 features
    for (let i = 1; i <= 9; i++) {
        formFields[`feature_tag_${i}`] = settings[`feature_tag_${i}`] || '';
        formFields[`feature_title_${i}`] = settings[`feature_title_${i}`] || '';
        formFields[`feature_desc_${i}`] = settings[`feature_desc_${i}`] || '';
        formFields[`feature_style_${i}`] = settings[`feature_style_${i}`] || 'light';
        formFields[`feature_image_${i}`] = null;
    }

    const { data, setData, post, processing, errors } = useForm(formFields);

    const handleFeatureImageChange = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            setData(`feature_image_${index}`, file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFeaturePreviews(prev => ({
                    ...prev,
                    [`feature_image_${index}`]: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setData(field, file);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === 'logo') setLogoPreview(reader.result);
                if (field === 'favicon') setFaviconPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        // Since we are uploading files, we use normal POST form submission.
        post(route('superadmin.cms.update'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    // FAQ Handlers
    const addFaq = () => {
        const newFaqs = [...data.faq_content, { question: '', answer: '' }];
        setData('faq_content', newFaqs);
    };

    const removeFaq = (index) => {
        const newFaqs = data.faq_content.filter((_, i) => i !== index);
        setData('faq_content', newFaqs);
    };

    const updateFaq = (index, field, value) => {
        const newFaqs = [...data.faq_content];
        newFaqs[index][field] = value;
        setData('faq_content', newFaqs);
    };

    // Review Handlers
    const toggleReview = (id, currentStatus) => {
        post(route('superadmin.cms.reviews.toggle', id), {
            is_approved: !currentStatus,
            preserveScroll: true,
        });
    };

    const { delete: destroyReview } = useForm();
    const handleDeleteReview = (id) => {
        if (confirm('Are you sure you want to delete this review permanently?')) {
            destroyReview(route('superadmin.cms.reviews.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-300'}`} 
                    />
                ))}
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Super Admin — CMS & SEO Configuration" />

            <div className="w-full pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center">
                            <Settings className="w-7 h-7 mr-3 text-brand-600" />
                            CMS &amp; SEO Configuration
                        </h1>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            Configure marketing page branding, content templates, FAQs, and moderate user reviews.
                        </p>
                    </div>
                </div>

                {/* Tabs Panel */}
                <div className="flex flex-wrap border-b border-gray-200 mb-8 gap-2">
                    <button
                        onClick={() => setActiveTab('seo')}
                        className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                            activeTab === 'seo'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Globe className="w-4 h-4" />
                        Logo &amp; SEO
                    </button>
                    <button
                        onClick={() => setActiveTab('contact')}
                        className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                            activeTab === 'contact'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Phone className="w-4 h-4" />
                        Contact Info
                    </button>
                    <button
                        onClick={() => setActiveTab('pages')}
                        className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                            activeTab === 'pages'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Pages Content
                    </button>
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                            activeTab === 'faq'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <HelpCircle className="w-4 h-4" />
                        FAQ Builder
                    </button>
                    <button
                        onClick={() => setActiveTab('features')}
                        className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                            activeTab === 'features'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        Features Grid
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                            activeTab === 'reviews'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Review Moderation
                    </button>
                </div>

                {/* Form Wrapper (for Settings tabs) */}
                {activeTab !== 'reviews' ? (
                    <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-8">
                        
                        {/* 1. SEO & LOGO */}
                        {activeTab === 'seo' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black tracking-tight text-gray-900">Logo &amp; Meta Settings</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Logo Upload */}
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Site Logo</label>
                                        <div className="w-40 h-20 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden relative group transition-all">
                                            {logoPreview ? (
                                                <img 
                                                    src={typeof logoPreview === 'string' ? logoPreview.replace('/storage/', '/img/') : logoPreview} 
                                                    className="max-w-full max-h-full object-contain p-2" 
                                                    alt="Logo Preview" 
                                                    onError={(e) => {
                                                        if (e.target.src.includes('/storage/')) {
                                                            e.target.src = e.target.src.replace('/storage/', '/img/');
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-gray-300" />
                                            )}
                                            <input
                                                type="file"
                                                onChange={(e) => handleFileChange(e, 'logo')}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 font-bold">PNG or SVG. Recommended size 200x80px. Max 2MB.</p>
                                        {errors.logo && <p className="mt-1 text-xs font-bold text-red-500">{errors.logo}</p>}
                                    </div>

                                    {/* Favicon Upload */}
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Site Favicon</label>
                                        <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden relative group transition-all">
                                            {faviconPreview ? (
                                                <img 
                                                    src={typeof faviconPreview === 'string' ? faviconPreview.replace('/storage/', '/img/') : faviconPreview} 
                                                    className="w-8 h-8 object-contain" 
                                                    alt="Favicon Preview" 
                                                    onError={(e) => {
                                                        if (e.target.src.includes('/storage/')) {
                                                            e.target.src = e.target.src.replace('/storage/', '/img/');
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-gray-300" />
                                            )}
                                            <input
                                                type="file"
                                                onChange={(e) => handleFileChange(e, 'favicon')}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/x-icon,image/png"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 font-bold">ICO or PNG. 32x32px. Max 2MB.</p>
                                        {errors.favicon && <p className="mt-1 text-xs font-bold text-red-500">{errors.favicon}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Meta Title</label>
                                        <input
                                            type="text"
                                            value={data.seo_title}
                                            onChange={e => setData('seo_title', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="Enter marketing page title"
                                        />
                                        {errors.seo_title && <p className="mt-1 text-xs font-bold text-red-500">{errors.seo_title}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Meta Description</label>
                                        <textarea
                                            value={data.seo_description}
                                            onChange={e => setData('seo_description', e.target.value)}
                                            rows="3"
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="Enter search engine snippet description"
                                        />
                                        {errors.seo_description && <p className="mt-1 text-xs font-bold text-red-500">{errors.seo_description}</p>}
                                    </div>                                     <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Meta Keywords</label>
                                        <input
                                            type="text"
                                            value={data.seo_keywords}
                                            onChange={e => setData('seo_keywords', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="comma, separated, keywords"
                                        />
                                        {errors.seo_keywords && <p className="mt-1 text-xs font-bold text-red-500">{errors.seo_keywords}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Google Play Store Link</label>
                                        <input
                                            type="url"
                                            value={data.playstore_url}
                                            onChange={e => setData('playstore_url', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="https://play.google.com/store/apps/details?id=..."
                                        />
                                        {errors.playstore_url && <p className="mt-1 text-xs font-bold text-red-500">{errors.playstore_url}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. CONTACT DETAILS */}
                        {activeTab === 'contact' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black tracking-tight text-gray-900">Contact Details</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Support Email Address</label>
                                        <input
                                            type="email"
                                            value={data.contact_email}
                                            onChange={e => setData('contact_email', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="hello@cafe.com"
                                        />
                                        {errors.contact_email && <p className="mt-1 text-xs font-bold text-red-500">{errors.contact_email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Contact Phone Number</label>
                                        <input
                                            type="text"
                                            value={data.contact_phone}
                                            onChange={e => setData('contact_phone', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="+1-555-0199"
                                        />
                                        {errors.contact_phone && <p className="mt-1 text-xs font-bold text-red-500">{errors.contact_phone}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">WhatsApp Direct Link Number</label>
                                        <input
                                            type="text"
                                            value={data.contact_whatsapp}
                                            onChange={e => setData('contact_whatsapp', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="e.g. 15550199 (no leading + or 00)"
                                        />
                                        {errors.contact_whatsapp && <p className="mt-1 text-xs font-bold text-red-500">{errors.contact_whatsapp}</p>}
                                        <span className="text-[10px] text-gray-400 font-bold mt-1 block">Must contain country code, numbers only (e.g. 9779801234567)</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Office / Headquarters Address</label>
                                        <input
                                            type="text"
                                            value={data.contact_address}
                                            onChange={e => setData('contact_address', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="123 Espresso Way, Coffee City"
                                        />
                                        {errors.contact_address && <p className="mt-1 text-xs font-bold text-red-500">{errors.contact_address}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. PAGES CONTENT */}
                        {activeTab === 'pages' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-black tracking-tight text-gray-900">Legal &amp; About Page Contents</h2>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">About Page Description</label>
                                        <textarea
                                            value={data.page_about_content}
                                            onChange={e => setData('page_about_content', e.target.value)}
                                            rows="8"
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="Write a brief background about your project and team..."
                                        />
                                        {errors.page_about_content && <p className="mt-1 text-xs font-bold text-red-500">{errors.page_about_content}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Privacy Policy Page</label>
                                        <textarea
                                            value={data.page_privacy_content}
                                            onChange={e => setData('page_privacy_content', e.target.value)}
                                            rows="8"
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="Enter standard privacy policy..."
                                        />
                                        {errors.page_privacy_content && <p className="mt-1 text-xs font-bold text-red-500">{errors.page_privacy_content}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Terms &amp; Conditions Page</label>
                                        <textarea
                                            value={data.page_tnc_content}
                                            onChange={e => setData('page_tnc_content', e.target.value)}
                                            rows="8"
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="Enter standard terms of service..."
                                        />
                                        {errors.page_tnc_content && <p className="mt-1 text-xs font-bold text-red-500">{errors.page_tnc_content}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. FAQ BUILDER */}
                        {activeTab === 'faq' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-black tracking-tight text-gray-900">FAQ Question Builder</h2>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Configure the questions listed on the home page</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addFaq}
                                        className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add FAQ
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {data.faq_content.length === 0 ? (
                                        <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 font-semibold text-sm">
                                            No FAQ items created. Click "Add FAQ" above.
                                        </div>
                                    ) : (
                                        data.faq_content.map((faq, index) => (
                                            <div key={index} className="flex gap-4 p-5 bg-gray-50 border border-gray-100 rounded-2xl items-start relative group transition-all">
                                                <div className="flex-1 space-y-3">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Question {index + 1}</label>
                                                        <input
                                                            type="text"
                                                            value={faq.question}
                                                            onChange={e => updateFaq(index, 'question', e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 transition-all"
                                                            placeholder="e.g. How does setup work?"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Answer</label>
                                                        <textarea
                                                            value={faq.answer}
                                                            onChange={e => updateFaq(index, 'answer', e.target.value)}
                                                            rows="2"
                                                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-brand-500 transition-all"
                                                            placeholder="Write the explanation here..."
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => removeFaq(index)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl border border-red-100 mt-5 transition-colors"
                                                    title="Remove FAQ"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 5. FEATURES GRID BUILDER */}
                        {activeTab === 'features' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-gray-900">Features Grid Configuration</h2>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Configure section title and customize the 9 feature cards</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Section Eyebrow Tag</label>
                                        <input
                                            type="text"
                                            value={data.features_section_tag}
                                            onChange={e => setData('features_section_tag', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="e.g. Complete Restaurant Operations"
                                            required
                                        />
                                        {errors.features_section_tag && <p className="mt-1 text-xs font-bold text-red-500">{errors.features_section_tag}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Section Header Title</label>
                                        <input
                                            type="text"
                                            value={data.features_section_title}
                                            onChange={e => setData('features_section_title', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="e.g. Streamline your counter, kitchen, and back-office."
                                            required
                                        />
                                        {errors.features_section_title && <p className="mt-1 text-xs font-bold text-red-500">{errors.features_section_title}</p>}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {Array.from({ length: 9 }, (_, i) => i + 1).map(idx => (
                                        <div key={idx} className="border border-gray-100 bg-gray-50/50 rounded-3xl p-6 md:p-8 space-y-6">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider">Feature Card {idx}</h3>
                                                <span className="text-xs text-brand-600 font-extrabold bg-brand-50 px-3 py-1 rounded-full">Active</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* Left column: Text details */}
                                                <div className="md:col-span-2 space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Card Eyebrow Tag</label>
                                                            <input
                                                                type="text"
                                                                value={data[`feature_tag_${idx}`]}
                                                                onChange={e => setData(`feature_tag_${idx}`, e.target.value)}
                                                                className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 transition-all"
                                                                placeholder="e.g. Ingredient Tracking"
                                                                required
                                                            />
                                                            {errors[`feature_tag_${idx}`] && <p className="mt-1 text-xs text-red-500">{errors[`feature_tag_${idx}`]}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Card Header Title</label>
                                                            <input
                                                                type="text"
                                                                value={data[`feature_title_${idx}`]}
                                                                onChange={e => setData(`feature_title_${idx}`, e.target.value)}
                                                                className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 transition-all"
                                                                placeholder="e.g. Inventory Tracking"
                                                                required
                                                            />
                                                            {errors[`feature_title_${idx}`] && <p className="mt-1 text-xs text-red-500">{errors[`feature_title_${idx}`]}</p>}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                                                        <textarea
                                                            value={data[`feature_desc_${idx}`]}
                                                            onChange={e => setData(`feature_desc_${idx}`, e.target.value)}
                                                            rows="2"
                                                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm font-semibold text-gray-900 focus:outline-none focus:border-brand-500 transition-all"
                                                            placeholder="Enter short description explaining this feature..."
                                                            required
                                                        />
                                                        {errors[`feature_desc_${idx}`] && <p className="mt-1 text-xs text-red-500">{errors[`feature_desc_${idx}`]}</p>}
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Card Style Theme</label>
                                                        <select
                                                            value={data[`feature_style_${idx}`]}
                                                            onChange={e => setData(`feature_style_${idx}`, e.target.value)}
                                                            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 transition-all"
                                                        >
                                                            <option value="light">Standard Light (White background, gray text)</option>
                                                            <option value="dark">Sleek Dark (Black background, white text)</option>
                                                            <option value="orange">Brand Accent (Orange background, white text)</option>
                                                        </select>
                                                        {errors[`feature_style_${idx}`] && <p className="mt-1 text-xs text-red-500">{errors[`feature_style_${idx}`]}</p>}
                                                    </div>
                                                </div>

                                                {/* Right column: Image Upload & Preview */}
                                                <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-gray-100 text-center">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Mockup Preview Image</label>
                                                    
                                                    <div className="w-full h-32 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden relative group transition-all mb-3">
                                                        {featurePreviews[`feature_image_${idx}`] ? (
                                                            <>
                                                                <img 
                                                                    src={typeof featurePreviews[`feature_image_${idx}`] === 'string' ? featurePreviews[`feature_image_${idx}`].replace('/storage/', '/img/') : featurePreviews[`feature_image_${idx}`]} 
                                                                    alt={`Mockup preview ${idx}`} 
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    onError={(e) => {
                                                                        if (e.target.src.includes('/storage/')) {
                                                                            e.target.src = e.target.src.replace('/storage/', '/img/');
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                                                    <Upload className="w-6 h-6 text-white" />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center text-gray-400">
                                                                <ImageIcon className="w-8 h-8 mb-1 opacity-60" />
                                                                <span className="text-[10px] font-bold">No Image Mockup</span>
                                                            </div>
                                                        )}
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            onChange={e => handleFeatureImageChange(e, idx)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>

                                                    <label className="relative cursor-pointer bg-brand-50 hover:bg-brand-100 text-brand-600 font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-brand-100 transition-colors">
                                                        Upload Image
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            onChange={e => handleFeatureImageChange(e, idx)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                    {errors[`feature_image_${idx}`] && <p className="mt-1 text-xs text-red-500">{errors[`feature_image_${idx}`]}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit Actions */}
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg transition-all disabled:opacity-50"
                            >
                                {processing ? 'Saving changes...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* 5. REVIEW MODERATION */
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-gray-100">
                            <h2 className="text-lg font-black tracking-tight text-gray-900">User Reviews Moderation</h2>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Approve reviews submitted via the public /reviews page</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="py-4 px-6">User details</th>
                                        <th className="py-4 px-6">Rating</th>
                                        <th className="py-4 px-6">Comment</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {reviews.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-12 text-center text-gray-400 font-semibold">
                                                No reviews submitted yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        reviews.map((review) => (
                                            <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-5 px-6">
                                                    <div className="font-bold text-gray-900">{review.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{review.email}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold mt-1">
                                                        Submitted: {new Date(review.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex flex-col gap-1">
                                                        {renderStars(review.rating)}
                                                        <span className="text-xs font-bold text-gray-600">({review.rating}/5)</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6 max-w-[320px]">
                                                    <p className="text-gray-700 leading-relaxed break-words font-medium">{review.comment}</p>
                                                </td>
                                                <td className="py-5 px-6 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        review.is_approved 
                                                            ? 'bg-emerald-100 text-emerald-800' 
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {review.is_approved ? (
                                                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                        ) : (
                                                            <XCircle className="w-3.5 h-3.5 mr-1" />
                                                        )}
                                                        {review.is_approved ? 'Approved' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => toggleReview(review.id, review.is_approved)}
                                                            className={`font-bold text-xs py-2 px-4 rounded-xl border transition-all ${
                                                                review.is_approved
                                                                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                                                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100 shadow-sm'
                                                            }`}
                                                        >
                                                            {review.is_approved ? 'Unapprove' : 'Approve'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            className="bg-red-50 hover:bg-red-100 text-red-700 p-2 border border-red-100 rounded-xl transition-all"
                                                            title="Delete Review"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
