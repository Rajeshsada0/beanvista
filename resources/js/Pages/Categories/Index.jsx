import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Plus, FolderOpen, Coffee, ListFilter, Edit2, Trash2, X, Search, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';

export default function CategoryIndex({ categories }) {
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');

    const { data, setData, post, put, processing, reset, clearErrors } = useForm({
        name: '',
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
            status: item.status == 1,
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (editingItem) {
            put(route('categories.update', editingItem.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const deleteItem = (item) => {
        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
            router.delete(route('categories.destroy', item.id));
        }
    };

    const toggleStatus = (item) => {
        router.put(route('categories.update', item.id), {
            name: item.name,
            status: !item.status
        }, { preserveScroll: true });
    };

    // ── Filter and Sort ──
    const filteredCategories = useMemo(() => {
        let list = [...categories];
        
        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(q));
        }
        
        // Sort
        list.sort((a, b) => {
            let av, bv;
            if (sortBy === 'name') { av = a.name; bv = b.name; }
            else if (sortBy === 'items') { av = a.menus_count || 0; bv = b.menus_count || 0; }
            else { av = a.name; bv = b.name; }
            
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        
        return list;
    }, [categories, searchQuery, sortBy, sortDir]);

    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };
    
    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 inline" />;
        return sortDir === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-brand-600 inline" />
            : <ArrowDown className="w-3 h-3 ml-1 text-brand-600 inline" />;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Menu Categories" />
            
            <div className="flex flex-col space-y-6 pb-10">
                {/* Unified Tab Navigation */}
                <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 overflow-x-auto w-full md:w-fit">
                    <Link href={route('menus.index')} className="whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition-all flex items-center gap-2">
                        <Coffee className="w-3.5 h-3.5" />
                        Dishes & Items
                    </Link>
                    <Link href={route('categories.index')} className="whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand-600 text-white shadow-sm transition-all flex items-center gap-2">
                        <ListFilter className="w-3.5 h-3.5" />
                        Categories
                    </Link>
                    <Link href={route('addons.index')} className="whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition-all flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" />
                        Add-ons & Extras
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Category Hierarchy</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" />
                            Group your POS catalog
                        </p>
                    </div>

                    <button 
                        onClick={openCreateModal}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-black py-3 px-6 rounded-xl shadow shadow-brand-500/25 transition-all active:scale-95 text-xs uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Entry</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search categories by name…"
                            className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 bg-white transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Data Grid */}
                {filteredCategories.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <FolderOpen className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">{searchQuery ? 'No matching categories' : 'No categories yet'}</p>
                        <p className="text-xs text-gray-400 mt-2">{searchQuery ? 'Try adjusting your search' : 'Click "Add New Entry" to create your first category.'}</p>
                    </div>
                ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <button onClick={() => handleSort('name')} className="flex items-center hover:text-gray-600 transition-colors">
                                            Name <SortIcon col="name" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                                        <button onClick={() => handleSort('items')} className="flex items-center mx-auto hover:text-gray-600 transition-colors">
                                            Items Assigned <SortIcon col="items" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCategories.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-6 py-3">
                                            <p className="text-sm font-black text-gray-900">{item.name}</p>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className="bg-brand-50 text-brand-600 px-2.5 py-1 text-xs font-black rounded-lg">
                                                {item.menus_count || 0} items
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <button 
                                                onClick={() => toggleStatus(item)}
                                                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${item.status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                                {item.status ? 'Active' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => deleteItem(item)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-gray-100 p-5 shadow-2xl">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-base font-black text-gray-900">
                                    {editingItem ? 'Edit Category' : 'New Category'}
                                </h3>
                                <p className="text-xs font-medium text-gray-400 mt-0.5">Structure your menu hierarchy</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Category Name</label>
                                <input 
                                    type="text" 
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                                    placeholder="e.g. Hot Drinks"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs font-black uppercase tracking-widest text-gray-600">Active Status</span>
                                <button
                                    type="button"
                                    onClick={() => setData('status', !data.status)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-all ${data.status ? 'bg-brand-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${data.status ? 'translate-x-4' : 'translate-x-0.5'} mt-0.5`} />
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50 mt-4"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {processing ? 'Saving...' : 'Save Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
