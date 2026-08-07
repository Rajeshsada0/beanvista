import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Users, Save, ArrowLeft } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function CreateEdit({ user, tenants }) {
    const isEdit = !!user;

    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        password: '',
        role: user?.role || 'staff',
        tenant_id: user?.tenant_id || '',
    });

    const submit = (e) => {
        e.preventDefault();
        // If tenant_id is an empty string, convert to null
        const payload = { ...data };
        if (payload.tenant_id === '') {
            payload.tenant_id = null;
        }

        if (isEdit) {
            put(route('superadmin.users.update', user.id), { data: payload });
        } else {
            post(route('superadmin.users.store'), { data: payload });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={isEdit ? "Edit User" : "New User"} />

            <div className="flex flex-col space-y-8 w-full pb-10 max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('superadmin.users.index')}
                            className="p-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">{isEdit ? 'Edit User' : 'New User'}</h1>
                            <p className="mt-1 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                                <Users className="w-4 h-4 mr-2 text-brand-500" />
                                {isEdit ? `Editing ${user.name}` : 'Register a new global user'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                    <form onSubmit={submit} className="p-6 md:p-8 space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="name" value="Name" className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-2xl border-gray-200 focus:border-brand-500 focus:ring-brand-500 font-bold"
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email" className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="mt-1 block w-full rounded-2xl border-gray-200 focus:border-brand-500 focus:ring-brand-500 font-bold"
                                    required
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="phone" value="Phone Number" className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" />
                            <TextInput
                                id="phone"
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="e.g. +977 9812345678"
                                className="mt-1 block w-full rounded-2xl border-gray-200 focus:border-brand-500 focus:ring-brand-500 font-bold"
                            />
                            <InputError message={errors.phone} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="password" value={isEdit ? "Password (leave blank to keep current)" : "Password"} className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="mt-1 block w-full rounded-2xl border-gray-200 focus:border-brand-500 focus:ring-brand-500 font-bold"
                                    required={!isEdit}
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="role" value="Role" className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" />
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className="mt-1 block w-full rounded-2xl border-gray-200 focus:border-brand-500 focus:ring-brand-500 font-bold"
                                    required
                                >
                                    <option value="staff">Staff</option>
                                    <option value="kitchen">Kitchen</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                                <InputError message={errors.role} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="tenant_id" value="Assigned Cafe (Tenant)" className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" />
                            <select
                                id="tenant_id"
                                value={data.tenant_id}
                                onChange={(e) => setData('tenant_id', e.target.value)}
                                className="mt-1 block w-full rounded-2xl border-gray-200 focus:border-brand-500 focus:ring-brand-500 font-bold"
                            >
                                <option value="">Global / No Cafe</option>
                                {tenants.map(tenant => (
                                    <option key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.slug})</option>
                                ))}
                            </select>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Super Admins typically do not need to be assigned to a specific cafe.</p>
                            <InputError message={errors.tenant_id} className="mt-2" />
                        </div>

                        <div className="pt-4 flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-brand-600 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                <span>{isEdit ? 'Update User' : 'Create User'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
