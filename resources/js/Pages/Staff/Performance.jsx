import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { Users, Clock, ShoppingBag, Banknote, TrendingUp, Award, Star, UserCheck, Timer, Zap, Plus, Edit2, Trash2, X, Lock, Mail, ShieldCheck, Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter, AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';

const PER_PAGE = 10;

export default function Performance({ staff }) {
    const { auth } = usePage().props;
    const staffLimit = auth?.plan_limits?.max_users;
    const isLimitReached = staffLimit?.reached;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    
    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'cashier',
    });

    const openCreateModal = () => {
        setEditingStaff(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (member) => {
        setEditingStaff(member);
        setData({
            name: member.name,
            email: member.email,
            password: '', // Keep empty for edit unless changing
            role: member.role,
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingStaff) {
            put(route('staff.update', editingStaff.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('staff.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const deleteStaff = (member) => {
        if (confirm(`Are you sure you want to remove ${member.name}? This will delete all their historical shift records.`)) {
            router.delete(route('staff.destroy', member.id));
        }
    };

    const formatDuration = (mins) => {
        if (!mins || mins === 0) return 'N/A';
        const days = Math.floor(mins / 1440);
        const hours = Math.floor((mins % 1440) / 60);
        const m = Math.round(mins % 60);
        
        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (m > 0 || (days === 0 && hours === 0)) result += `${m}m`;
        return result.trim();
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('asc');
        }
        setPage(1);
    };

    // Filtered & Sorted Data
    const filteredStaff = useMemo(() => {
        let result = [...staff];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s => 
                s.name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q)
            );
        }

        // Role filter
        if (roleFilter !== 'all') {
            result = result.filter(s => s.role === roleFilter);
        }

        // Sort
        result.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [staff, searchQuery, roleFilter, sortBy, sortDir]);

    // Paginated Data
    const paginatedStaff = useMemo(() => {
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        return filteredStaff.slice(start, end);
    }, [filteredStaff, page]);

    const totalPages = Math.ceil(filteredStaff.length / PER_PAGE);

    const stats = useMemo(() => {
        if (!filteredStaff.length) return null;
        const withOrders = filteredStaff.filter(s => s.total_orders > 0);
        return {
            topSales: [...filteredStaff].sort((a, b) => b.total_sales - a.total_sales)[0],
            topOrders: [...filteredStaff].sort((a, b) => b.total_orders - a.total_orders)[0],
            topTips: [...filteredStaff].sort((a, b) => b.total_tips - a.total_tips)[0],
            fastest: withOrders.length ? [...withOrders].sort((a, b) => a.avg_order_duration - b.avg_order_duration)[0] : null,
            totalSales: filteredStaff.reduce((acc, curr) => acc + curr.total_sales, 0),
            totalTips: filteredStaff.reduce((acc, curr) => acc + curr.total_tips, 0),
        };
    }, [filteredStaff]);

    return (
        <AuthenticatedLayout>
            <Head title="Staff Performance" />

            <div className="flex flex-col space-y-4 pb-6">
                {/* Header */}
                <div className="bg-white/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Staff Performance</h1>
                        <p className="text-xs font-semibold text-gray-500 mt-0.5">Analytics & Productivity Tracking</p>
                    </div>

                    <button 
                        onClick={openCreateModal}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Staff Member</span>
                    </button>
                </div>

                {/* Summary Cards */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-brand-600 rounded-xl p-4 text-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <Award className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold opacity-90">Top Sales</span>
                            </div>
                            <h3 className="text-sm font-bold mb-0.5">{stats.topSales?.name}</h3>
                            <p className="text-lg font-black">रू. {stats.topSales?.total_sales.toFixed(2)}</p>
                        </div>

                        <div className="bg-emerald-600 rounded-xl p-4 text-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold opacity-90">Most Orders</span>
                            </div>
                            <h3 className="text-sm font-bold mb-0.5">{stats.topOrders?.name}</h3>
                            <p className="text-lg font-black">{stats.topOrders?.total_orders} Orders</p>
                        </div>

                        <div className="bg-amber-500 rounded-xl p-4 text-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <Star className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold opacity-90">Highest Tips</span>
                            </div>
                            <h3 className="text-sm font-bold mb-0.5">{stats.topTips?.name}</h3>
                            <p className="text-lg font-black">रू. {stats.topTips?.total_tips.toFixed(2)}</p>
                        </div>

                        <div className="bg-purple-600 rounded-xl p-4 text-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold opacity-90">Fastest Server</span>
                            </div>
                            <h3 className="text-sm font-bold mb-0.5">{stats.fastest?.name ?? 'N/A'}</h3>
                            <p className="text-lg font-black">{stats.fastest ? formatDuration(stats.fastest.avg_order_duration) : '–'}</p>
                        </div>
                    </div>
                )}

                {/* Detailed Table */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-600" />
                            <h2 className="text-lg font-black text-gray-900">Staff Metrics</h2>
                            <span className="text-xs font-semibold text-gray-500">({filteredStaff.length})</span>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                    className="pl-9 pr-10 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-56"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setPage(1); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Clear search"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Role Filter */}
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select
                                    value={roleFilter}
                                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                                    className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none cursor-pointer bg-white"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="waiter">Waiter</option>
                                    <option value="kitchen">Kitchen</option>
                                    <option value="staff">Staff (Legacy)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th 
                                        onClick={() => handleSort('name')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Employee</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('role')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Role</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('total_hours')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Total Hours</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('total_orders')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Orders</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('total_sales')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Total Sales</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('avg_order_duration')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Avg Service Time</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('total_tips')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Tips Generated</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500 text-sm">
                                            No staff members found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedStaff.map((user) => (
                                        <tr key={user.id} className="group hover:bg-brand-50/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm shadow-sm">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                                    user.role === 'admin' 
                                                        ? 'bg-purple-100 text-purple-700' 
                                                        : user.role === 'kitchen'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{user.total_hours}h</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                                {user.total_orders}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-gray-900">रू. {user.total_sales.toFixed(2)}</p>
                                                <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                                                    Avg: रू. {user.total_orders > 0 ? (user.total_sales / user.total_orders).toFixed(1) : '0'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.avg_order_duration > 0 ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Timer className="w-3.5 h-3.5 text-amber-500" />
                                                        <span className={`text-sm font-bold ${
                                                            user.avg_order_duration < 20 ? 'text-emerald-600' :
                                                            user.avg_order_duration < 40 ? 'text-amber-600' : 'text-red-500'
                                                        }`}>{formatDuration(user.avg_order_duration)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 text-sm font-semibold">–</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-bold text-brand-600">रू. {user.total_tips.toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => openEditModal(user)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-brand-600 hover:text-white text-gray-500 transition-all"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteStaff(user)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-rose-500 hover:text-white text-gray-500 transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {((page - 1) * PER_PAGE) + 1} to {Math.min(page * PER_PAGE, filteredStaff.length)} of {filteredStaff.length} staff
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-semibold text-gray-700">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Staff Management Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl overflow-hidden">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {editingStaff ? 'Edit Team Member' : 'New Team Member'}
                                </h3>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">Manage credentials & permissions</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {isLimitReached && !editingStaff && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <span className="font-bold text-amber-900 block">Subscription Limit Reached</span>
                                        <span className="text-amber-700 block mt-0.5">
                                            You have reached your plan limit of {staffLimit?.limit} staff users. Please upgrade your subscription plan to add more staff.
                                        </span>
                                        <Link
                                            href={route('tenant.plan')}
                                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-black mt-2 transition-colors"
                                        >
                                            Upgrade Plan →
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Member Name</label>
                                        <div className="relative group">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                            <input 
                                                type="text" 
                                                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                                placeholder="John Doe"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {errors.name && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                            <input 
                                                type="email" 
                                                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                                placeholder="john@cafe.com"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {errors.email && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Permission Role</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors pointer-events-none" />
                                            <select 
                                                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm appearance-none cursor-pointer"
                                                value={data.role}
                                                onChange={e => setData('role', e.target.value)}
                                            >
                                                <option value="cashier">Cashier</option>
                                                <option value="waiter">Waiter</option>
                                                <option value="kitchen">Kitchen Staff</option>
                                                <option value="admin">Administrator</option>
                                                <option value="staff">Staff Member (Legacy)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">
                                            {editingStaff ? 'New Password (Optional)' : 'Access Password'}
                                        </label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                            <input 
                                                type="password" 
                                                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                                placeholder="••••••••"
                                                value={data.password}
                                                onChange={e => setData('password', e.target.value)}
                                                required={!editingStaff}
                                            />
                                        </div>
                                        {errors.password && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.password}</p>}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || (isLimitReached && !editingStaff)}
                                className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-brand-700 transition-all active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {processing ? 'Processing...' : editingStaff ? 'Update Member' : 'Create Member'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
