import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    Plus, Coffee, Edit2, Trash2, X, CheckCircle2, ListFilter, Tag,
    Utensils, Pizza, Sandwich, IceCream, Beer, Wine, Beef, Cake, 
    GlassWater, Soup, Drumstick, Apple, Image as ImageIcon, Camera, UploadCloud, LayoutGrid, List,
    Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, TrendingUp, Percent, Eye,
    ChevronDown, Check
} from 'lucide-react';
import MediaGallery from '@/Components/Media/MediaGallery';

export default function MenuIndex({ menus, db_categories = [] }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || 'रू.';
    const categories = db_categories.map(c => c.name);
    const [activeTab, setActiveTab] = useState('All');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [categoryInputSearch, setCategoryInputSearch] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const categoryDropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
                setShowCategoryDropdown(false);
                setCategoryInputSearch('');
            }
        };
        if (showCategoryDropdown) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [showCategoryDropdown]);
    
    // View mode state (persisted)
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('menusViewMode') || 'grid');
    useEffect(() => {
        localStorage.setItem('menusViewMode', viewMode);
    }, [viewMode]);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        category_id: db_categories.length > 0 ? db_categories[0].id : '',
        original_price: '',
        price: '',
        cost_price: '',
        status: true,
        send_to_kitchen: true,
        image: null,
        icon: null,
    });

    const [previews, setPreviews] = useState({ image: null, icon: null });
    const [gallery, setGallery] = useState({ isOpen: false, type: 'images' });

    const openCreateModal = () => {
        setEditingMenu(null);
        reset();
        setPreviews({ image: null, icon: null });
        setData('category_id', db_categories.length > 0 ? db_categories[0].id : '');
        setCategorySearch(db_categories.length > 0 ? db_categories[0].name : '');
        setCategoryInputSearch('');
        setIsNewCategory(false);
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (menu) => {
        setEditingMenu(menu);
        const categoryId = menu.category_id || db_categories.find(c => c.name === menu.category)?.id || '';
        const categoryName = db_categories.find(c => c.id === categoryId)?.name || menu.category || '';
        setData({
            name: menu.name,
            category_id: categoryId,
            original_price: menu.original_price || '',
            price: menu.price,
            cost_price: menu.cost_price || '',
            status: menu.status == 1,
            send_to_kitchen: menu.send_to_kitchen == 1,
            image: null,
            icon: null,
        });
        setCategorySearch(categoryName);
        setCategoryInputSearch('');
        setPreviews({ 
            image: menu.image_url, 
            icon: menu.icon_url 
        });
        setIsNewCategory(false);
        clearErrors();
        setIsModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (editingMenu) {
            router.post(route('menus.update', editingMenu.id), {
                _method: 'put',
                ...data
            }, {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('menus.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const deleteMenu = (menu) => {
        if (confirm(`Are you sure you want to delete ${menu.name}?`)) {
            router.delete(route('menus.destroy', menu.id));
        }
    };

    const toggleStatus = (menu) => {
        router.put(route('menus.update', menu.id), {
            name: menu.name,
            category_id: menu.category_id,
            price: menu.price,
            status: !menu.status
        }, { preserveScroll: true });
    };

    // ── Datatable state ──
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);
    const PER_PAGE = 12;

    const filteredMenus = useMemo(() => {
        let list = [...menus];
        
        // Category filter
        if (activeTab !== 'All') {
            list = list.filter(m => m.category === activeTab);
        }
        
        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(m =>
                m.name.toLowerCase().includes(q) ||
                (m.category || '').toLowerCase().includes(q)
            );
        }
        
        // Sort
        list.sort((a, b) => {
            let av, bv;
            if (sortBy === 'name') { av = a.name; bv = b.name; }
            else if (sortBy === 'price') { av = parseFloat(a.price); bv = parseFloat(b.price); }
            else if (sortBy === 'category') { av = a.category || ''; bv = b.category || ''; }
            else { av = a.name; bv = b.name; }
            
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        
        return list;
    }, [menus, activeTab, searchQuery, sortBy, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filteredMenus.length / PER_PAGE));
    const displayMenus = filteredMenus.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
        setPage(1);
    };
    
    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 inline" />;
        return sortDir === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600 inline" />
            : <ArrowDown className="w-3 h-3 ml-1 text-blue-600 inline" />;
    };

    const getCategoryIcon = (menu) => {
        if (menu.icon_url) {
            return <img src={menu.icon_url} className="w-5 h-5 object-contain" alt="icon" />;
        }
        
        const cat = menu.category?.toLowerCase() || '';
        if (cat.includes('coffee') || cat.includes('tea') || cat.includes('drink')) return <Coffee className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('pizza')) return <Pizza className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('burger') || cat.includes('sandwich')) return <Sandwich className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('dessert') || cat.includes('cake') || cat.includes('sweet')) return <Cake className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('ice cream')) return <IceCream className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('beer')) return <Beer className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('wine')) return <Wine className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('meat') || cat.includes('steak')) return <Beef className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('juice') || cat.includes('cold')) return <GlassWater className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('soup')) return <Soup className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('chicken')) return <Drumstick className="w-5 h-5" strokeWidth={2.5}/>;
        if (cat.includes('fruit') || cat.includes('healthy')) return <Apple className="w-5 h-5" strokeWidth={2.5}/>;
        
        return <Utensils className="w-5 h-5" strokeWidth={2.5}/>;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Menu Items" />

            <div className="flex flex-col space-y-8 pb-10">
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl p-2 rounded-[1.5rem] border border-white/80 shadow-sm overflow-x-auto w-full md:w-fit mb-2">
                    <Link href={route('menus.index')} className="whitespace-nowrap px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-200 transition-all flex items-center">
                        <Coffee className="w-4 h-4 mr-2" />
                        Dishes & Items
                    </Link>
                    <Link href={route('categories.index')} className="whitespace-nowrap px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all flex items-center">
                        <ListFilter className="w-4 h-4 mr-2" />
                        Categories
                    </Link>
                    <Link href={route('addons.index')} className="whitespace-nowrap px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Add-ons & Extras
                    </Link>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Menu Management</h1>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5 flex items-center">
                            <ListFilter className="w-4 h-4 mr-2" />
                            Curate your café's visual gallery
                        </p>
                    </div>

                    <button 
                        onClick={openCreateModal}
                        className="w-full sm:w-auto flex justify-center bg-blue-600 hover:bg-blue-600 text-white font-black py-3 sm:py-4 px-6 sm:px-8 rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 items-center space-x-3 text-[10px] sm:text-xs uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
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
                            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                            placeholder="Search menu items by name or category…"
                            className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 bg-white transition-all"
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
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar flex-1">
                        <button
                            onClick={() => { setActiveTab('All'); setPage(1); }}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === 'All' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-400 hover:bg-brand-50 hover:text-brand-600 border border-gray-100'
                            }`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setActiveTab(cat); setPage(1); }}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    activeTab === cat ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-400 hover:bg-brand-50 hover:text-brand-600 border border-gray-100'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100/50 p-1.5 rounded-xl border border-gray-100 shrink-0 self-end md:self-center">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm border border-brand-50' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm border border-brand-50' : 'text-gray-400 hover:text-gray-600'}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {filteredMenus.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <Coffee className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">{searchQuery ? 'No matching menu items' : 'No menu items yet'}</p>
                        <p className="text-xs text-gray-400 mt-2">{searchQuery ? 'Try adjusting your search' : 'Click "Add New Entry" to create your first item.'}</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 w-20">Image</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <button onClick={() => handleSort('name')} className="flex items-center hover:text-gray-600 transition-colors">
                                                Item Name <SortIcon col="name" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <button onClick={() => handleSort('category')} className="flex items-center hover:text-gray-600 transition-colors">
                                                Category <SortIcon col="category" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">
                                            <button onClick={() => handleSort('price')} className="flex items-center ml-auto hover:text-gray-600 transition-colors">
                                                Price <SortIcon col="price" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {displayMenus.map(menu => (
                                        <tr key={menu.id} className={`hover:bg-gray-50/60 transition-colors group ${!menu.status ? 'opacity-60 grayscale' : ''}`}>
                                            <td className="px-4 py-3">
                                                {menu.image_url ? (
                                                    <img src={menu.image_url} className="w-10 h-10 rounded-lg object-cover shadow-sm border border-gray-200" alt={menu.name} />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-50 text-brand-600 border border-brand-100">
                                                        {getCategoryIcon(menu)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-black text-gray-900">{menu.name}</h3>
                                                    {menu.send_to_kitchen ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200">KITCHEN</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-200">DIRECT</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                                                    {menu.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button 
                                                    onClick={() => toggleStatus(menu)}
                                                    className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${menu.status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {menu.status ? 'Active' : 'Hidden'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm font-black text-brand-600">
                                                    {currency} {parseFloat(menu.price).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end items-center gap-1">
                                                    <Link 
                                                        href={route('menus.show', menu.id)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <button 
                                                        onClick={() => openEditModal(menu)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteMenu(menu)}
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
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayMenus.map(menu => (
                        <div key={menu.id} className={`group relative flex flex-col p-6 backdrop-blur-xl rounded-[2.5rem] border overflow-hidden transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-2 min-h-[300px] ${menu.status ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                            
                            {menu.image_url && (
                                <div className="absolute inset-0 z-0">
                                    <img src={menu.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={menu.name} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
                                </div>
                            )}

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-auto">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-sm ${menu.image_url ? 'bg-white/20 border border-white/30 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                        {getCategoryIcon(menu)}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <button 
                                            onClick={() => toggleStatus(menu)}
                                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${menu.status ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'}`}
                                        >
                                            {menu.status ? 'Active' : 'Hidden'}
                                        </button>
                                        {menu.send_to_kitchen ? (
                                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border ${menu.image_url ? 'bg-amber-500/30 text-amber-200 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>KITCHEN</span>
                                        ) : (
                                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border ${menu.image_url ? 'bg-blue-500/30 text-blue-200 border-blue-500/30' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>DIRECT</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 mb-4">
                                    <h3 className={`text-xl font-black leading-tight tracking-tight ${menu.image_url ? 'text-white' : 'text-gray-900'}`}>{menu.name}</h3>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${menu.image_url ? 'text-white/60' : 'text-gray-400'}`}>{menu.category}</p>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                                    <span className={`text-2xl font-black ${menu.image_url ? 'text-white' : 'text-blue-600'}`}>
                                        {currency} {parseFloat(menu.price).toFixed(2)}
                                    </span>
                                    
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <Link 
                                            href={route('menus.show', menu.id)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-md transition-all ${menu.image_url ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-500'}`}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <button 
                                            onClick={() => openEditModal(menu)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-md transition-all ${menu.image_url ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-500'}`}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => deleteMenu(menu)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-md transition-all ${menu.image_url ? 'bg-white/20 hover:bg-rose-500 text-white' : 'bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500'}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-bold text-gray-400">
                            Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filteredMenus.length)} of {filteredMenus.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1,p-1))}
                                disabled={page===1}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 disabled:opacity-40 transition-all border border-gray-200"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {(() => {
                                const pages = [];
                                if (totalPages <= 7) for (let i=1; i<=totalPages; i++) pages.push(i);
                                else {
                                    if (page <= 3) pages.push(1,2,3,4,'…',totalPages);
                                    else if (page >= totalPages-2) pages.push(1,'…',totalPages-3,totalPages-2,totalPages-1,totalPages);
                                    else pages.push(1,'…',page-1,page,page+1,'…',totalPages);
                                }
                                return pages.map((p,i) =>
                                    p==='…' ? <span key={`ellipsis-${i}`} className="px-2 text-xs font-black text-gray-300">…</span>
                                    : <button key={p} onClick={() => setPage(p)}
                                        className={`min-w-[32px] px-3 py-2 rounded-lg text-xs font-black transition-all ${
                                            page===p ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-brand-600'
                                        }`}>{p}</button>
                                );
                            })()}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages,p+1))}
                                disabled={page===totalPages}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 disabled:opacity-40 transition-all border border-gray-200"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
                         style={{ maxHeight: '92vh' }}>
                        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingMenu ? 'Edit Menu Item' : 'Add Menu Item'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">Manage your menu offerings</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="px-6 pt-4 pb-5 overflow-y-auto flex-1 no-scrollbar">
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Menu Item Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                                            placeholder="e.g. Cappuccino"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Category</label>
                                        <div className="relative" ref={categoryDropdownRef}>
                                            {/* Trigger Button */}
                                            <button
                                                type="button"
                                                onClick={() => { setCategoryInputSearch(''); setShowCategoryDropdown(v => !v); }}
                                                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                                                    showCategoryDropdown
                                                        ? 'border-brand-500 ring-2 ring-brand-500/20'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                <span className={`truncate ${data.category_id ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                                                    {categorySearch || 'Select category...'}
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Dropdown Panel */}
                                            {showCategoryDropdown && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                                    {/* Search inside dropdown */}
                                                    <div className="p-2 border-b border-gray-100">
                                                        <div className="relative">
                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                                                placeholder="Search..."
                                                                value={categoryInputSearch}
                                                                onChange={(e) => setCategoryInputSearch(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    {/* Options list */}
                                                    <div className="max-h-44 overflow-y-auto">
                                                        {db_categories
                                                            .filter(c => c.name.toLowerCase().includes(categoryInputSearch.toLowerCase()))
                                                            .map(c => (
                                                                <button
                                                                    key={c.id}
                                                                    type="button"
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={() => {
                                                                        setData('category_id', c.id);
                                                                        setCategorySearch(c.name);
                                                                        setCategoryInputSearch('');
                                                                        setShowCategoryDropdown(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                                                                        data.category_id === c.id
                                                                            ? 'bg-brand-50 text-brand-700 font-semibold'
                                                                            : 'text-gray-700 hover:bg-gray-50'
                                                                    }`}
                                                                >
                                                                    <span>{c.name}</span>
                                                                    {data.category_id === c.id && (
                                                                        <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                                                                    )}
                                                                </button>
                                                            ))
                                                        }
                                                        {db_categories.filter(c => c.name.toLowerCase().includes(categoryInputSearch.toLowerCase())).length === 0 && (
                                                            <div className="px-3 py-4 text-sm text-gray-400 text-center">No categories found</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {db_categories.length === 0 && (
                                            <p className="text-rose-500 text-xs font-medium mt-1.5">
                                                Please create a category first.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Pricing Fields */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Cost Price</label>
                                            <input 
                                                type="number" step="0.01"
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-semibold"
                                                placeholder="0.00"
                                                value={data.cost_price}
                                                onChange={e => setData('cost_price', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Original Price (MRP)</label>
                                            <input 
                                                type="number" step="0.01"
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-semibold"
                                                placeholder="0.00"
                                                value={data.original_price}
                                                onChange={e => setData('original_price', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Sales Price</label>
                                            <input 
                                                type="number" step="0.01"
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-semibold"
                                                placeholder="0.00"
                                                value={data.price}
                                                onChange={e => setData('price', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Calculated Values */}
                                    {(data.original_price && data.price) && parseFloat(data.original_price) > parseFloat(data.price) && (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                                                    <Percent className="w-3 h-3" />
                                                    Discount
                                                </span>
                                                <span className="text-xs font-bold text-green-700">
                                                    {((parseFloat(data.original_price) - parseFloat(data.price)) / parseFloat(data.original_price) * 100).toFixed(1)}% OFF
                                                </span>
                                            </div>
                                            <div className="text-xs text-green-600">
                                                Save {currency} {(parseFloat(data.original_price) - parseFloat(data.price)).toFixed(2)}
                                            </div>
                                        </div>
                                    )}

                                    {(data.price && data.cost_price) && parseFloat(data.price) > parseFloat(data.cost_price) && (
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    Net Profit
                                                </span>
                                                <span className="text-sm font-bold text-blue-700">
                                                    {currency} {(parseFloat(data.price) - parseFloat(data.cost_price)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setData('status', !data.status)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${data.status ? 'bg-brand-600' : 'bg-gray-300'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 mt-0.5 transform rounded-full bg-white transition duration-200 ${data.status ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                            </button>
                                            <span className="text-xs font-bold text-gray-700">Available on Menu</span>
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setData('send_to_kitchen', !data.send_to_kitchen)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${data.send_to_kitchen ? 'bg-brand-600' : 'bg-gray-300'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 mt-0.5 transform rounded-full bg-white transition duration-200 ${data.send_to_kitchen ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                            </button>
                                            <span className="text-xs font-bold text-gray-700">Send to Kitchen</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Image row — compact on mobile: side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Background Image</label>
                                    <div 
                                        onClick={() => setGallery({ isOpen: true, type: 'images' })}
                                        className="relative aspect-[4/3] sm:aspect-video rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 hover:border-brand-400 overflow-hidden flex items-center justify-center cursor-pointer transition-colors"
                                    >
                                        {previews.image ? (
                                            <img src={previews.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <Camera className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                                                <p className="text-[10px] font-semibold text-gray-400">Select Image</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Item Icon</label>
                                    <div 
                                        onClick={() => setGallery({ isOpen: true, type: 'icons' })}
                                        className="relative aspect-[4/3] sm:aspect-square sm:w-32 rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 hover:border-brand-400 overflow-hidden flex items-center justify-center cursor-pointer transition-colors"
                                    >
                                        {previews.icon ? (
                                            <img src={previews.icon} className="w-12 h-12 object-contain" />
                                        ) : (
                                            <div className="text-center">
                                                <UploadCloud className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                                                <p className="text-[10px] font-semibold text-gray-400">Select Icon</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-lg font-semibold text-sm shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {processing ? 'Saving...' : (editingMenu ? 'Update Item' : 'Add Item')}
                            </button>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            <MediaGallery 
                isOpen={gallery.isOpen}
                onClose={() => setGallery({ ...gallery, isOpen: false })}
                type={gallery.type}
                title={gallery.type === 'images' ? 'Select Background Photo' : 'Select Item Icon'}
                onSelect={(selection) => {
                    if (typeof selection === 'string') {
                        // Existing path
                        setData(gallery.type === 'images' ? 'image' : 'icon', selection);
                        setPreviews({
                            ...previews,
                            [gallery.type === 'images' ? 'image' : 'icon']: `/storage/${selection}`
                        });
                    } else {
                        // New file object
                        setData(gallery.type === 'images' ? 'image' : 'icon', selection);
                        setPreviews({
                            ...previews,
                            [gallery.type === 'images' ? 'image' : 'icon']: URL.createObjectURL(selection)
                        });
                    }
                    setGallery({ ...gallery, isOpen: false });
                }}
            />
        </AuthenticatedLayout>
    );
}
