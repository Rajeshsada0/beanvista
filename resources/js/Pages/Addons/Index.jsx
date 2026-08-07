import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Plus, ListPlus, Coffee, ListFilter, Edit2, Trash2, X, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AddonIndex({ addons }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || 'रू.';
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    // Datatable state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priceFilter, setPriceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const { data, setData, post, put, processing, reset, clearErrors } = useForm({
        name: '',
        price: '',
        status: true,
    });

    // Handle sorting
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('asc');
        }
    };

    // Filter and sort addons
    const filteredAddons = useMemo(() => {
        let filtered = [...addons];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            filtered = filtered.filter(item => !!item.status === isActive);
        }

        // Filter by price range
        if (priceFilter !== 'all') {
            filtered = filtered.filter(item => {
                const price = parseFloat(item.price);
                if (priceFilter === '0-50') return price >= 0 && price <= 50;
                if (priceFilter === '51-100') return price >= 51 && price <= 100;
                if (priceFilter === '101+') return price >= 101;
                return true;
            });
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal, bVal;
            
            if (sortBy === 'name') {
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
            } else if (sortBy === 'price') {
                aVal = parseFloat(a.price);
                bVal = parseFloat(b.price);
            } else if (sortBy === 'status') {
                aVal = a.status ? 1 : 0;
                bVal = b.status ? 1 : 0;
            }

            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [addons, searchQuery, statusFilter, priceFilter, sortBy, sortDir]);

    // Paginate filtered addons
    const paginatedAddons = useMemo(() => {
        const startIndex = (page - 1) * PER_PAGE;
        return filteredAddons.slice(startIndex, startIndex + PER_PAGE);
    }, [filteredAddons, page]);

    const totalPages = Math.ceil(filteredAddons.length / PER_PAGE);

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
            price: item.price,
            status: item.status == 1,
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (editingItem) {
            put(route('addons.update', editingItem.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('addons.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const deleteItem = (item) => {
        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
            router.delete(route('addons.destroy', item.id));
        }
    };

    const toggleStatus = (item) => {
        router.put(route('addons.update', item.id), {
            name: item.name,
            price: item.price,
            status: !item.status
        }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Add-ons & Extras" />
            
            <div className="flex flex-col space-y-8 pb-10">
                {/* Unified Tab Navigation */}
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl p-2 rounded-[1.5rem] border border-white/80 shadow-sm overflow-x-auto w-full md:w-fit mb-2">
                    <Link href={route('menus.index')} className="whitespace-nowrap px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-white hover:text-brand-600 hover:shadow-sm transition-all flex items-center">
                        <Coffee className="w-4 h-4 mr-2" />
                        Dishes & Items
                    </Link>
                    <Link href={route('categories.index')} className="whitespace-nowrap px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-white hover:text-brand-600 hover:shadow-sm transition-all flex items-center">
                        <ListFilter className="w-4 h-4 mr-2" />
                        Categories
                    </Link>
                    <Link href={route('addons.index')} className="whitespace-nowrap px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest bg-brand-600 text-white shadow-lg shadow-brand-200 transition-all flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Add-ons & Extras
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add-ons Management</h1>
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                            <ListPlus className="w-4 h-4 mr-2" />
                            Manage custom item modifiers
                        </p>
                    </div>

                    <button 
                        onClick={openCreateModal}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-all active:scale-95 flex items-center space-x-2 text-sm"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New Add-on</span>
                    </button>
                </div>

                {/* Search and Filter UI */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search add-ons..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); setPage(1); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        
                        {/* Status Filter */}
                        <select 
                            value={statusFilter} 
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        
                        {/* Price Range Filter */}
                        <select 
                            value={priceFilter} 
                            onChange={(e) => { setPriceFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        >
                            <option value="all">All Prices</option>
                            <option value="0-50">रू. 0-50</option>
                            <option value="51-100">रू. 51-100</option>
                            <option value="101+">रू. 101+</option>
                        </select>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th 
                                        className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={sortBy === 'name' ? 'text-brand-600' : ''}>Name</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('price')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={sortBy === 'price' ? 'text-brand-600' : ''}>Price / Upcharge</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th 
                                        className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={sortBy === 'status' ? 'text-brand-600' : ''}>Status</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedAddons.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <ListPlus className="w-16 h-16 text-gray-300 mb-2" />
                                                <p className="text-lg font-semibold text-gray-400">
                                                    {searchQuery || statusFilter !== 'all' || priceFilter !== 'all' 
                                                        ? 'No add-ons match your filters' 
                                                        : 'No add-ons available'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAddons.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-semibold text-emerald-600">
                                                    {currency} {parseFloat(item.price).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button 
                                                    onClick={() => toggleStatus(item)}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${item.status ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                                                >
                                                    {item.status ? 'Active' : 'Disabled'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button 
                                                        onClick={() => openEditModal(item)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-brand-600 hover:text-white text-gray-500 transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteItem(item)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-rose-500 hover:text-white text-gray-500 transition-all"
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

                    {/* Pagination Footer */}
                    {filteredAddons.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-sm text-gray-500">
                                Showing {((page - 1) * PER_PAGE) + 1} to {Math.min(page * PER_PAGE, filteredAddons.length)} of {filteredAddons.length} add-ons
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700 px-2">
                                    Page {page} of {totalPages}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                    {editingItem ? 'Edit Add-on' : 'New Add-on'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Setup extra features</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-900 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Display Name</label>
                                <input 
                                    type="text" 
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                                    placeholder="e.g. Extra Shot"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">Additional Price ({currency})</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                                    value={data.price}
                                    onChange={e => setData('price', e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setData('status', !data.status)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all ${data.status ? 'bg-brand-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${data.status ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
                                </button>
                                <span className="text-sm font-semibold text-slate-700">Available to attach</span>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-brand-600 text-white py-2.5 px-6 rounded-lg font-semibold text-sm shadow-sm hover:bg-brand-700 transition-all active:scale-95 disabled:opacity-50 mt-6"
                            >
                                {processing ? 'Processing...' : (editingItem ? 'Update Add-on' : 'Create Add-on')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
