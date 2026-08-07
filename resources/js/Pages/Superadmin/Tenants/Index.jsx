import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, Plus, Edit2, Power, PowerOff, Trash2, LayoutDashboard } from 'lucide-react';

export default function Index({ tenants }) {
    const handleToggle = (id) => {
        if (confirm('Are you sure you want to change the status of this cafe?')) {
            router.post(route('superadmin.tenants.toggle', id), {
                _method: 'PATCH'
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('WARNING: Deleting a cafe will permanently remove all associated users, orders, menus, and data. Are you absolutely sure you want to delete this cafe?')) {
            router.post(route('superadmin.tenants.destroy', id), {
                _method: 'DELETE'
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Cafes" />

            <div className="flex flex-col space-y-8 w-full pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">Manage Cafes</h1>
                        <p className="mt-1 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-brand-500" />
                            Tenant Administration
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route('superadmin.tenants.create')}
                            className="bg-brand-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Cafe</span>
                        </Link>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white/40">
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Tenant ID</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Name</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Slug</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Users</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Subscription</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {tenants.map(tenant => {
                                    const isActive = Boolean(Number(tenant.is_active));
                                    const sub = tenant.subscription || (tenant.trial_ends_at ? {
                                        plan: { name: 'Free Trial' },
                                        status: new Date(tenant.trial_ends_at) > new Date() ? 'trialing' : 'expired',
                                        start_date: tenant.created_at,
                                        ends_at: tenant.trial_ends_at
                                    } : null);
                                    let remainingDays = null;
                                    let daysColor = 'text-gray-400';
                                    let daysBg = 'bg-gray-100';

                                    if (sub?.ends_at) {
                                        const now = new Date();
                                        const ends = new Date(sub.ends_at);
                                        const diff = Math.ceil((ends - now) / (1000 * 60 * 60 * 24));
                                        remainingDays = diff;

                                        if (diff < 0) {
                                            daysColor = 'text-red-700';
                                            daysBg = 'bg-red-100';
                                        } else if (diff <= 7) {
                                            daysColor = 'text-orange-700';
                                            daysBg = 'bg-orange-100';
                                        } else if (diff <= 30) {
                                            daysColor = 'text-amber-700';
                                            daysBg = 'bg-amber-100';
                                        } else {
                                            daysColor = 'text-emerald-700';
                                            daysBg = 'bg-emerald-100';
                                        }
                                    }

                                    return (
                                        <tr key={tenant.id} className="hover:bg-white/40 transition-colors group">
                                            <td className="py-4 px-6 text-sm font-black text-gray-900">{tenant.id}</td>
                                            <td className="py-4 px-6 text-sm font-bold text-gray-700">{tenant.name}</td>
                                            <td className="py-4 px-6 text-sm font-bold text-gray-500">{tenant.slug}</td>
                                            <td className="py-4 px-6 text-sm font-bold text-gray-700">{tenant.users_count}</td>
                                            <td className="py-4 px-6 text-sm">
                                                {sub ? (
                                                    <div className="flex flex-col gap-1 min-w-[180px]">
                                                        {/* Plan name + status badge */}
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-brand-600">{sub.plan?.name || 'Unknown Plan'}</span>
                                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                                sub.status === 'active' ? 'bg-emerald-100 text-emerald-700'
                                                                : sub.status === 'trialing' ? 'bg-blue-100 text-blue-700'
                                                                : sub.status === 'expired' ? 'bg-red-100 text-red-700'
                                                                : sub.status === 'past_due' ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                            }`}>{sub.status}</span>
                                                        </div>
                                                        {/* Start date */}
                                                        <div className="text-xs text-gray-500">
                                                            <span className="font-semibold text-gray-400 uppercase tracking-wide">Start: </span>
                                                            {sub.start_date
                                                                ? new Date(sub.start_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                                                                : '—'}
                                                        </div>
                                                        {/* Expires at */}
                                                        <div className="text-xs text-gray-500">
                                                            <span className="font-semibold text-gray-400 uppercase tracking-wide">Expires: </span>
                                                            {sub.ends_at
                                                                ? new Date(sub.ends_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                                                                : '—'}
                                                        </div>
                                                        {/* Remaining days badge */}
                                                        {remainingDays !== null && (
                                                            <span className={`inline-block text-[11px] font-black px-2.5 py-1 rounded-lg w-fit mt-0.5 ${daysBg} ${daysColor}`}>
                                                                {remainingDays < 0
                                                                    ? `Expired ${Math.abs(remainingDays)}d ago`
                                                                    : remainingDays === 0
                                                                    ? 'Expires today!'
                                                                    : `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">No Subscription</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                                                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {isActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleToggle(tenant.id)}
                                                        className={`p-2 rounded-xl transition-colors shadow-sm ${
                                                            isActive
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                        }`}
                                                        title={isActive ? 'Disable Cafe' : 'Enable Cafe'}
                                                    >
                                                        {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                    </button>
                                                    <Link
                                                        href={route('superadmin.tenants.edit', tenant.id)}
                                                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shadow-sm"
                                                        title="Edit Cafe"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={route('superadmin.tenants.impersonate', tenant.id)}
                                                        method="post"
                                                        as="button"
                                                        className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl transition-colors shadow-sm"
                                                        title="View Cafe Dashboard"
                                                    >
                                                        <LayoutDashboard className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(tenant.id)}
                                                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shadow-sm"
                                                        title="Delete Cafe"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {tenants.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-gray-500 font-bold">No cafes found.</td>
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
