import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm, Link } from '@inertiajs/react';
import {
    Users, UserPlus, Phone, Mail, Calendar, Star,
    Search, Trash2, Edit2, X, CheckCircle2, Eye,
    TrendingUp, Award, Filter, ChevronRight, ChevronLeft, Hash, AlertCircle, ArrowUpDown
} from 'lucide-react';
import { useState, useMemo } from 'react';

const PER_PAGE = 10;

const ModalField = ({ label, icon: Icon, children }) => (
    <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-2">
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
        </label>
        {children}
    </div>
);

export default function Index({ customers }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || 'रू.';

    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('asc');
        }
        setPage(1);
    };

    const filteredCustomers = useMemo(() => {
        let result = [...customers];
        
        // Search filter
        const term = searchTerm.toLowerCase();
        if (term) {
            result = result.filter(c =>
                c.name.toLowerCase().includes(term) ||
                c.phone.includes(term) ||
                (c.email && c.email.toLowerCase().includes(term))
            );
        }

        // Sort
        result.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            // Handle special cases
            if (sortBy === 'loyalty_points' || sortBy === 'due_amount' || sortBy === 'orders_count') {
                aVal = parseFloat(aVal || 0);
                bVal = parseFloat(bVal || 0);
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = (bVal || '').toLowerCase();
            }

            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [customers, searchTerm, sortBy, sortDir]);

    const paginatedCustomers = useMemo(() => {
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        return filteredCustomers.slice(start, end);
    }, [filteredCustomers, page]);

    const totalPages = Math.ceil(filteredCustomers.length / PER_PAGE);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        email: '',
        birthday: '',
        loyalty_points: 0
    });

    const openEdit = (customer) => {
        setSelectedCustomer(customer);
        setData({
            name: customer.name,
            phone: customer.phone,
            email: customer.email || '',
            birthday: customer.birthday || '',
            loyalty_points: Math.floor(customer.loyalty_points || 0)
        });
        setIsEditModalOpen(true);
    };

    const submitAdd = (e) => {
        e.preventDefault();
        post(route('customers.store'), {
            onSuccess: () => { setIsAddModalOpen(false); reset(); }
        });
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        put(route('customers.update', selectedCustomer.id), {
            onSuccess: () => { setIsEditModalOpen(false); reset(); }
        });
    };

    const submitDelete = (id) => {
        if (confirm('Are you sure you want to delete this customer? All their loyalty data will be lost.')) {
            destroy(route('customers.destroy', id));
        }
    };

    const totalPoints = customers.reduce((a, c) => a + parseFloat(c.loyalty_points || 0), 0);
    const totalDue = customers.reduce((a, c) => a + parseFloat(c.due_amount || 0), 0);
    const topCustomer = customers.reduce((top, c) => (parseFloat(c.loyalty_points) > parseFloat(top?.loyalty_points || 0) ? c : top), null);

    const getInitialColor = (name) => {
        const colors = [
            'from-violet-500 to-purple-600',
            'from-blue-500 to-blue-600',
            'from-emerald-500 to-teal-600',
            'from-orange-500 to-amber-600',
            'from-rose-500 to-pink-600',
            'from-cyan-500 to-sky-600',
        ];
        return colors[name.charCodeAt(0) % colors.length];
    };



    return (
        <AuthenticatedLayout>
            <Head title="Customers" />

            <div className="flex flex-col space-y-4 w-full pb-6">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/80 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">Customer Hub</h1>
                        <p className="mt-0.5 text-xs font-semibold text-gray-500">Loyalty Member Directory</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-2 text-sm"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add New Member
                    </button>
                </div>

                {/* ── Stats Strip ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Members', value: customers.length, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
                        { label: 'Loyalty Points', value: totalPoints.toLocaleString(undefined, { maximumFractionDigits: 0 }), icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Total Due', value: `${currency}${totalDue.toFixed(2)}`, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Top Member', value: topCustomer?.name?.split(' ')[0] || '—', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-xl p-4 shadow-sm flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${s.bg} ${s.color} shrink-0`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-500">{s.label}</p>
                                    <p className="text-lg font-black text-gray-900 truncate">{s.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Customer Table ── */}
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-600" />
                            <h2 className="text-lg font-black text-gray-900">Customer Directory</h2>
                            <span className="text-xs font-semibold text-gray-500">({filteredCustomers.length})</span>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="pl-9 pr-10 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-64"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(''); setPage(1); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Clear search"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
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
                                            <span>Customer</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('phone')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Phone</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('email')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Email</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('orders_count')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Orders</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('loyalty_points')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Points</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('due_amount')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Due Amount</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500 text-sm">
                                            {searchTerm ? `No customers found for "${searchTerm}"` : 'No customers yet'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCustomers.map((customer) => {
                                        const dueAmount = parseFloat(customer.due_amount || 0);
                                        return (
                                            <tr key={customer.id} className="group hover:bg-brand-50/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getInitialColor(customer.name)} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}>
                                                            {customer.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{customer.name}</p>
                                                            <p className="text-xs text-gray-500">ID: {customer.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-sm font-semibold text-gray-700">{customer.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {customer.email ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">{customer.email}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                                    {customer.orders_count}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                                        <span className="text-sm font-bold text-amber-600">{customer.loyalty_points}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {dueAmount > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {currency}{dueAmount.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('customers.show', customer.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-500 transition-all"
                                                            title="View Profile"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Link>
                                                        <button 
                                                            onClick={() => openEdit(customer)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-brand-600 hover:text-white text-gray-500 transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => submitDelete(customer.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-rose-500 hover:text-white text-gray-500 transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {((page - 1) * PER_PAGE) + 1} to {Math.min(page * PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} customers
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

            {/* ── Add Modal ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Register Member</h3>
                                <p className="text-xs font-semibold text-gray-500 mt-0.5">Add a new loyalty member</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitAdd} className="space-y-4">
                            <ModalField label="Full Name" icon={Users}>
                                <input
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                    value={data.name} onChange={e => setData('name', e.target.value)}
                                    placeholder="Customer full name" required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
                            </ModalField>
                            <ModalField label="Phone Number" icon={Phone}>
                                <input
                                    type="tel"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                    value={data.phone} 
                                    onChange={e => setData('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="10 digit mobile number" required
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
                            </ModalField>
                            <ModalField label="Email Address" icon={Mail}>
                                <input
                                    type="email"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                    value={data.email} onChange={e => setData('email', e.target.value)}
                                    placeholder="email@example.com (optional)"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
                            </ModalField>
                            <button
                                type="submit" disabled={processing}
                                className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-brand-700 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {processing ? 'Registering...' : 'Register Member'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Edit Modal ── */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Edit Member</h3>
                                <p className="text-xs font-semibold text-gray-500 mt-0.5">{selectedCustomer?.name}</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitUpdate} className="space-y-4">
                            <ModalField label="Full Name" icon={Users}>
                                <input
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                    value={data.name} onChange={e => setData('name', e.target.value)} required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.name}</p>}
                            </ModalField>
                            <ModalField label="Phone Number" icon={Phone}>
                                <input
                                    type="tel"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                    value={data.phone} 
                                    onChange={e => setData('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} required
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
                            </ModalField>
                            <ModalField label="Email Address" icon={Mail}>
                                <input
                                    type="email"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                    value={data.email} onChange={e => setData('email', e.target.value)}
                                    placeholder="email@example.com"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.email}</p>}
                            </ModalField>
                            <ModalField label="Loyalty Points" icon={Star}>
                                <input
                                    type="number"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                    value={data.loyalty_points} onChange={e => setData('loyalty_points', e.target.value)}
                                />
                                {errors.loyalty_points && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.loyalty_points}</p>}
                            </ModalField>
                            <button
                                type="submit" disabled={processing}
                                className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-brand-700 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {processing ? 'Saving...' : 'Update Member Info'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
