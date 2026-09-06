import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Users, Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

export default function Index({ 
    users, 
    app_name, 
    app_version, 
    site_favicon,
    enable_biometric,
    enable_contact_call,
    contact_call_number,
    enable_contact_email,
    contact_email_address,
    enable_contact_whatsapp,
    contact_whatsapp_number
}) {
    const { delete: destroy } = useForm();
    const { auth } = usePage().props;

    // Form for app settings
    const { data, setData, post, processing, errors } = useForm({
        app_name: app_name || 'iCafe',
        app_version: app_version || 'v1.0',
        favicon: null,
        enable_biometric: enable_biometric || 'true',
        enable_contact_call: enable_contact_call || 'true',
        contact_call_number: contact_call_number || '+977-1234567890',
        enable_contact_email: enable_contact_email || 'true',
        contact_email_address: contact_email_address || 'hello@aicafepos.com',
        enable_contact_whatsapp: enable_contact_whatsapp || 'true',
        contact_whatsapp_number: contact_whatsapp_number || '+977-1234567890',
    });
    const [faviconPreview, setFaviconPreview] = useState(
        site_favicon ? (typeof site_favicon === 'string' ? site_favicon.replace('/storage/', '/img/') : site_favicon) : null
    );

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('favicon', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFaviconPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        post(route('superadmin.app-settings.update'), {
            preserveScroll: true,
        });
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this user?')) {
            destroy(route('superadmin.users.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Global Users" />

            <div className="flex flex-col space-y-8 w-full pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">Manage Global Users</h1>
                        <p className="mt-1 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                            <Users className="w-4 h-4 mr-2 text-brand-500" />
                            All System Users
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('superadmin.users.create')}
                            className="bg-brand-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New User</span>
                        </Link>
                    </div>
                </div>

                {/* Global App Settings Card */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 md:p-8">
                    <h2 className="text-lg font-black tracking-tight text-gray-900 mb-2">Global App Configuration</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-6">Set the mobile app name and version badge displayed in the sidebar</p>
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">App Name</label>
                                <input
                                    type="text"
                                    value={data.app_name}
                                    onChange={e => setData('app_name', e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                    placeholder="iCafe"
                                />
                                {errors.app_name && <p className="mt-1 text-xs font-bold text-red-500">{errors.app_name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">App Version</label>
                                <input
                                    type="text"
                                    value={data.app_version}
                                    onChange={e => setData('app_version', e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                    placeholder="v1.0"
                                />
                                {errors.app_version && <p className="mt-1 text-xs font-bold text-red-500">{errors.app_version}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Favicon (Tab Icon)</label>
                                <div className="flex items-center space-x-3 h-[50px]">
                                    <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden relative group transition-all">
                                        {faviconPreview ? (
                                            <img 
                                                src={typeof faviconPreview === 'string' ? faviconPreview.replace('/storage/', '/img/') : faviconPreview} 
                                                className="w-6 h-6 object-contain" 
                                                alt="Favicon Preview" 
                                                onError={(e) => {
                                                    if (e.target.src.includes('/storage/')) {
                                                        e.target.src = e.target.src.replace('/storage/', '/img/');
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <ImageIcon className="w-4 h-4 text-gray-400" />
                                        )}
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/x-icon,image/png"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-bold leading-tight flex-1">Max 2MB<br/>32x32px</p>
                                </div>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-gray-900 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                                >
                                    <span>Save Settings</span>
                                </button>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        <div className="space-y-4">
                            <h3 className="text-md font-black tracking-tight text-gray-900">Mobile Login & Contact Features</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Configure biometrics and help actions on the login screen</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Biometric Login</label>
                                    <select
                                        value={data.enable_biometric}
                                        onChange={e => setData('enable_biometric', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                    >
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contact Calling</label>
                                    <select
                                        value={data.enable_contact_call}
                                        onChange={e => setData('enable_contact_call', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all mb-2"
                                    >
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                    {data.enable_contact_call === 'true' && (
                                        <input
                                            type="text"
                                            value={data.contact_call_number}
                                            onChange={e => setData('contact_call_number', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-2 px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="Phone Number"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contact Email</label>
                                    <select
                                        value={data.enable_contact_email}
                                        onChange={e => setData('enable_contact_email', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all mb-2"
                                    >
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                    {data.enable_contact_email === 'true' && (
                                        <input
                                            type="email"
                                            value={data.contact_email_address}
                                            onChange={e => setData('contact_email_address', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-2 px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="Email Address"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Contact WhatsApp</label>
                                    <select
                                        value={data.enable_contact_whatsapp}
                                        onChange={e => setData('enable_contact_whatsapp', e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all mb-2"
                                    >
                                        <option value="true">Enabled</option>
                                        <option value="false">Disabled</option>
                                    </select>
                                    {data.enable_contact_whatsapp === 'true' && (
                                        <input
                                            type="text"
                                            value={data.contact_whatsapp_number}
                                            onChange={e => setData('contact_whatsapp_number', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-2xl py-2 px-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                                            placeholder="WhatsApp Number"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white/40">
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Name</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Email</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Role</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Cafe / Tenant</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-white/40 transition-colors group">
                                        <td className="py-4 px-6 text-sm font-black text-gray-900">{user.name}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-500">{user.email}</td>
                                        <td className="py-4 px-6 text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-700">
                                            {user.tenant ? <span title={`Tenant ID: ${user.tenant.id}`}>{user.tenant.name} <span className="text-gray-400 text-xs ml-1">(ID: {user.tenant.id})</span></span> : <span className="text-gray-400 text-xs uppercase">Global (No Tenant)</span>}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link
                                                    href={route('superadmin.users.edit', user.id)}
                                                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shadow-sm"
                                                    title="Edit User"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                {user.id !== auth.user.id && (
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shadow-sm"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500 font-bold">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
