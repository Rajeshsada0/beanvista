import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Plus, Percent, Receipt, Edit2, Trash2, X, Settings2, Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const PER_PAGE = 10;

export default function TaxIndex({ taxes }) {
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('asc');
        }
        setPage(1);
    };

    const filteredTaxes = useMemo(() => {
        let result = [...taxes];
        
        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => 
                t.name.toLowerCase().includes(q)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            result = result.filter(t => Boolean(t.status) === isActive);
        }

        // Sort
        result.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            if (sortBy === 'rate') {
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
    }, [taxes, searchQuery, statusFilter, sortBy, sortDir]);

    const paginatedTaxes = useMemo(() => {
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        return filteredTaxes.slice(start, end);
    }, [filteredTaxes, page]);

    const totalPages = Math.ceil(filteredTaxes.length / PER_PAGE);

    const { data, setData, post, put, processing, reset, clearErrors } = useForm({
        name: '',
        rate: '',
        status: true,
    });

    const openCreateModal = () => {
        setEditingItem(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setData({
            name: item.name,
            rate: item.rate,
            status: item.status == 1,
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (editingItem) {
            put(route('taxes.update', editingItem.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('taxes.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const deleteItem = (item) => {
        setItemToDelete(null);
        router.delete(route('taxes.destroy', item.id), {
            onSuccess: () => setItemToDelete(null)
        });
    };

    const toggleStatus = (item) => {
        router.put(route('taxes.update', item.id), {
            name: item.name,
            rate: item.rate,
            status: !item.status
        }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Tax Configuration" />
            
            <div className="flex flex-col space-y-4 pb-6">
                {/* Tab Navigation (Breadcrumb style) */}
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl p-2 rounded-xl border border-white/80 shadow-sm overflow-x-auto w-full md:w-fit">
                    <Link href={route('settings.index')} className="whitespace-nowrap px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:bg-white hover:text-brand-600 transition-all flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        General Settings
                    </Link>
                    <Link href={route('taxes.index')} className="whitespace-nowrap px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 text-white shadow-sm transition-all flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Tax Config
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/80 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tax Management</h1>
                        <p className="text-xs font-semibold text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5" />
                            Define your tax structures
                        </p>
                    </div>

                    <button 
                        onClick={openCreateModal}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Tax</span>
                    </button>
                </div>

                {/* Data Grid */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Percent className="w-5 h-5 text-brand-600" />
                            <h2 className="text-lg font-black text-gray-900">Tax Configurations</h2>
                            <span className="text-xs font-semibold text-gray-500">({filteredTaxes.length})</span>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tax..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                    className="pl-9 pr-10 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 w-48"
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

                            {/* Status Filter */}
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                    className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none cursor-pointer bg-white"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
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
                                            <span>Tax Name</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('rate')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors text-center"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <span>Rate (%)</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('status')}
                                        className="px-4 py-3 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Status</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedTaxes.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-sm">
                                            {searchQuery || statusFilter !== 'all' ? 'No taxes found' : 'No taxes configured'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTaxes.map((item) => (
                                        <tr key={item.id} className="hover:bg-brand-50/30 transition-colors group">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-gray-900">{item.name}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 px-3 py-1 text-xs font-bold rounded-lg">
                                                    {item.rate}
                                                    <Percent className="w-3 h-3" />
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button 
                                                    onClick={() => toggleStatus(item)}
                                                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${item.status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {item.status ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => openEditModal(item)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-brand-600 hover:text-white text-gray-500 transition-all"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setItemToDelete(item)}
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
                                Showing {((page - 1) * PER_PAGE) + 1} to {Math.min(page * PER_PAGE, filteredTaxes.length)} of {filteredTaxes.length} taxes
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">
                                    {editingItem ? 'Edit Tax Definition' : 'New Tax Rate'}
                                </h3>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">Setup legal tax requirements</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">Tax Name</label>
                                <input 
                                    type="text" 
                                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                    placeholder="e.g. VAT"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">Rate Percentage (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold text-sm transition-all"
                                        placeholder="0.00"
                                        value={data.rate}
                                        onChange={e => setData('rate', e.target.value)}
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Percent className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setData('status', !data.status)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all ${data.status ? 'bg-brand-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition m-0.5 ${data.status ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                                <span className="text-xs font-semibold text-slate-600">Active Status</span>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-brand-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Save Configuration'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setItemToDelete(null)}></div>
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Are you sure?</h3>
                        <p className="text-sm font-semibold text-slate-500 mb-6">
                            You are about to delete <span className="text-slate-900 font-bold">"{itemToDelete.name}"</span>. This action cannot be undone.
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => deleteItem(itemToDelete)}
                                className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-rose-600 transition-all active:scale-95"
                            >
                                Yes, Delete Record
                            </button>
                            <button
                                onClick={() => setItemToDelete(null)}
                                className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
