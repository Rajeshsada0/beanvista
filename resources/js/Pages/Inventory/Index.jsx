import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router, Deferred } from '@inertiajs/react';
import { 
    Boxes, PackagePlus, ArrowUpRight, ArrowDownRight, Tag, Scale, 
    Package, DollarSign, Calendar, Info, Beaker, Filter, RotateCcw, 
    Search, Trash2, Edit3, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
    Truck, Settings, Users, Layers, Utensils, Plus, X, ChefHat, BookOpen,
    Zap, FlaskConical
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

export default function InventoryIndex({ 
    stats, items, recentPurchases, recentUsages, filters, 
    suppliers = [], measuringUnits = [], stockGroups = [],
    menus = [], menuRecipes = []
}) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || 'रू.';
    const [activeTab, setActiveTab] = useState('today'); 
    // Tabs: 'today', 'stock', 'intake', 'usage', 'suppliers', 'settings'

    const formatCurrency = (amount) => {
        return `${currency} ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // ─── Period Presets ───────────────────────────────────────────────────────────
    const PERIODS = [
        { value: 'today',     label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'month',     label: 'This Month' },
        { value: 'year',      label: 'This Year' },
        { value: 'custom',    label: 'Custom Range' },
    ];

    const [filterDates, setFilterDates] = useState({
        period: filters?.period || 'today',
        start_date: filters?.start_date || '',
        end_date: filters?.end_date || ''
    });

    const handlePeriod = (p) => {
        let start = '';
        let end = '';
        const today = new Date();

        if (p === 'today') {
            start = today.toISOString().split('T')[0];
            end = start;
        } else if (p === 'yesterday') {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            start = y.toISOString().split('T')[0];
            end = start;
        } else if (p === 'month') {
            const m = new Date(today.getFullYear(), today.getMonth(), 1);
            start = m.toISOString().split('T')[0];
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            end = lastDay.toISOString().split('T')[0];
        } else if (p === 'year') {
            const y = new Date(today.getFullYear(), 0, 1);
            start = y.toISOString().split('T')[0];
            const lastDay = new Date(today.getFullYear(), 11, 31);
            end = lastDay.toISOString().split('T')[0];
        }

        const newFilters = { period: p, start_date: start, end_date: end };
        setFilterDates(newFilters);
        
        if (p !== 'custom') {
            router.get(route('inventory.index'), newFilters, {
                preserveState: true,
                preserveScroll: true
            });
        }
    };

    const applyCustomFilter = (e) => {
        if(e) e.preventDefault();
        router.get(route('inventory.index'), filterDates, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const clearFilter = () => {
        const resetFilters = { period: 'today', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] };
        setFilterDates(resetFilters);
        router.get(route('inventory.index'), resetFilters);
    };

    const periodLabel = filterDates.period === 'custom'
        ? (filterDates.start_date ? `${filterDates.start_date} → ${filterDates.end_date || 'Now'}` : 'All Time')
        : PERIODS.find(p => p.value === filterDates.period)?.label || 'Today';

    // State for Modals & Edits
    const [editingItem, setEditingItem] = useState(null);
    const [editingPurchase, setEditingPurchase] = useState(null);
    const [editingUsage, setEditingUsage] = useState(null);
    
    // Config Edits
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [editingUnit, setEditingUnit] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // Forms
    const itemForm = useForm({
        name: '', stock_group_id: '', measuring_unit_id: '', category: '', unit: '', current_stock: 0, low_stock_threshold: 0
    });
    
    const purchaseForm = useForm({
        inventory_item_id: '', supplier_id: '', quantity: '', unit_price: '', total_price: '', purchase_date: new Date().toISOString().split('T')[0], notes: ''
    });

    const usageForm = useForm({
        inventory_item_id: '', quantity_used: '', usage_date: new Date().toISOString().split('T')[0], notes: ''
    });

    const supplierForm = useForm({
        name: '', contact_person: '', phone: '', email: '', address: ''
    });

    const unitForm = useForm({
        name: '', short_name: ''
    });

    const groupForm = useForm({
        name: '', description: ''
    });

    // ── Recipe state ─────────────────────────────────────────────────────────
    const [recipeSearch, setRecipeSearch] = useState('');
    const [selectedMenuId, setSelectedMenuId] = useState(null);
    const [recipeIngredients, setRecipeIngredients] = useState([]);
    const [recipeSaving, setRecipeSaving] = useState(false);
    const [recipeSaved, setRecipeSaved]   = useState(false);

    // Group menuRecipes by menu_id
    const recipesByMenu = useMemo(() => {
        const map = {};
        menuRecipes.forEach(r => {
            if (!map[r.menu_id]) map[r.menu_id] = [];
            map[r.menu_id].push(r);
        });
        return map;
    }, [menuRecipes]);

    const filteredMenus = useMemo(() => {
        const q = recipeSearch.toLowerCase();
        return menus.filter(m => m.name.toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q));
    }, [menus, recipeSearch]);

    const selectedMenu = menus.find(m => m.id === selectedMenuId);

    const openMenuRecipe = (menu) => {
        setSelectedMenuId(menu.id);
        const existing = recipesByMenu[menu.id] || [];
        setRecipeIngredients(existing.map(r => ({
            _key: r.id,
            inventory_item_id: r.inventory_item_id,
            quantity_per_serving: r.quantity_per_serving,
            item_name: r.inventory_item?.name || '',
            item_unit: r.inventory_item?.measuring_unit?.short_name || r.inventory_item?.unit || '',
        })));
        setRecipeSaved(false);
    };

    const addIngredientRow = () => {
        setRecipeIngredients(prev => [...prev, {
            _key: Date.now(),
            inventory_item_id: '',
            quantity_per_serving: '',
            item_name: '',
            item_unit: '',
        }]);
    };

    const updateIngredientRow = (key, field, value) => {
        setRecipeIngredients(prev => prev.map(row => {
            if (row._key !== key) return row;
            if (field === 'inventory_item_id') {
                const found = items.find(i => String(i.id) === String(value));
                return { ...row, inventory_item_id: value, item_name: found?.name || '', item_unit: found?.measuring_unit?.short_name || found?.unit || '' };
            }
            return { ...row, [field]: value };
        }));
    };

    const removeIngredientRow = (key) => {
        setRecipeIngredients(prev => prev.filter(r => r._key !== key));
    };

    const saveRecipe = () => {
        if (!selectedMenuId) return;
        const valid = recipeIngredients.filter(r => r.inventory_item_id && parseFloat(r.quantity_per_serving) > 0);
        if (valid.length === 0) {
            // If no valid rows, clear recipe by posting an empty — but we need at least 1 row
            // So we use DELETE all approach via storeRecipe with empty — backend requires min:1
            // Instead delete individually via router
            // If user wants to clear, they should remove all rows then save
            alert('Add at least one ingredient with a quantity greater than 0.');
            return;
        }
        setRecipeSaving(true);
        router.post(route('inventory.recipes.store'), {
            menu_id: selectedMenuId,
            ingredients: valid.map(r => ({ inventory_item_id: r.inventory_item_id, quantity_per_serving: r.quantity_per_serving })),
        }, {
            preserveScroll: true,
            onSuccess: () => { setRecipeSaving(false); setRecipeSaved(true); setTimeout(() => setRecipeSaved(false), 3000); },
            onError: () => setRecipeSaving(false),
        });
    };

    // Calculations
    const calculateTotal = (qty, price) => {
        const q = parseFloat(qty) || 0;
        const p = parseFloat(price) || 0;
        purchaseForm.setData('total_price', (q * p).toFixed(2));
    };

    // Submits (Items/Logs)
    const submitItem = (e) => {
        e.preventDefault();
        if (editingItem) {
            itemForm.put(route('inventory.items.update', editingItem.id), {
                onSuccess: () => { setEditingItem(null); itemForm.reset(); }
            });
        } else {
            itemForm.post(route('inventory.items.store'), {
                onSuccess: () => itemForm.reset()
            });
        }
    };

    const submitPurchase = (e) => {
        e.preventDefault();
        if (editingPurchase) {
            purchaseForm.put(route('inventory.purchases.update', editingPurchase.id), {
                onSuccess: () => { setEditingPurchase(null); purchaseForm.reset('quantity', 'unit_price', 'total_price', 'notes'); }
            });
        } else {
            purchaseForm.post(route('inventory.purchases.store'), {
                onSuccess: () => purchaseForm.reset('quantity', 'unit_price', 'total_price', 'notes')
            });
        }
    };

    const submitUsage = (e) => {
        e.preventDefault();
        if (editingUsage) {
            usageForm.put(route('inventory.usages.update', editingUsage.id), {
                onSuccess: () => { setEditingUsage(null); usageForm.reset('quantity_used', 'notes'); }
            });
        } else {
            usageForm.post(route('inventory.usages.store'), {
                onSuccess: () => usageForm.reset('quantity_used', 'notes')
            });
        }
    };

    // Submits (Config)
    const submitSupplier = (e) => {
        e.preventDefault();
        if (editingSupplier) {
            supplierForm.put(route('inventory.suppliers.update', editingSupplier.id), { onSuccess: () => { setEditingSupplier(null); supplierForm.reset(); } });
        } else {
            supplierForm.post(route('inventory.suppliers.store'), { onSuccess: () => supplierForm.reset() });
        }
    };

    const submitUnit = (e) => {
        e.preventDefault();
        if (editingUnit) {
            unitForm.put(route('inventory.units.update', editingUnit.id), { onSuccess: () => { setEditingUnit(null); unitForm.reset(); } });
        } else {
            unitForm.post(route('inventory.units.store'), { onSuccess: () => unitForm.reset() });
        }
    };

    const submitGroup = (e) => {
        e.preventDefault();
        if (editingGroup) {
            groupForm.put(route('inventory.groups.update', editingGroup.id), { onSuccess: () => { setEditingGroup(null); groupForm.reset(); } });
        } else {
            groupForm.post(route('inventory.groups.store'), { onSuccess: () => groupForm.reset() });
        }
    };

    // Deletes
    const confirmDelete = (title, message, routeUrl) => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                router.delete(routeUrl);
                setConfirmDialog({ ...confirmDialog, isOpen: false });
            }
        });
    };

    // Open Edit Modals
    const openEditItem = (item) => {
        setEditingItem(item);
        itemForm.setData({
            name: item.name, 
            stock_group_id: item.stock_group_id || '', 
            measuring_unit_id: item.measuring_unit_id || '', 
            category: item.category || '', 
            unit: item.unit || '', 
            current_stock: item.current_stock, 
            low_stock_threshold: item.low_stock_threshold
        });
    };

    const openEditPurchase = (purchase) => {
        setEditingPurchase(purchase);
        purchaseForm.setData({
            inventory_item_id: purchase.inventory_item_id, 
            supplier_id: purchase.supplier_id || '',
            quantity: purchase.quantity, 
            unit_price: purchase.unit_price, 
            total_price: purchase.total_price, 
            purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : '', 
            notes: purchase.notes || ''
        });
        setActiveTab('intake');
    };

    const openEditUsage = (usage) => {
        setEditingUsage(usage);
        usageForm.setData({
            inventory_item_id: usage.inventory_item_id, 
            quantity_used: usage.quantity_used, 
            usage_date: usage.usage_date ? usage.usage_date.split('T')[0] : '', 
            notes: usage.notes || ''
        });
        setActiveTab('usage');
    };

    const openEditSupplier = (s) => { setEditingSupplier(s); supplierForm.setData(s); };
    const openEditUnit = (u) => { setEditingUnit(u); unitForm.setData(u); };
    const openEditGroup = (g) => { setEditingGroup(g); groupForm.setData(g); };

    // Smart Suggestions Logic
    const lowStockItems = items.filter(i => i.status === 'out' || i.status === 'low');
    const highUsageItems = items.filter(i => i.today_used > 0 && i.today_used >= i.current_stock);

    return (
        <AuthenticatedLayout>
            <Head title="Inventory Management" />

            <div className="flex flex-col space-y-6 w-full pb-10">
                {/* Header & Date Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">Inventory Dashboard</h1>
                        <p className="mt-1 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                            <Boxes className="w-4 h-4 mr-2 text-blue-500" />
                            {periodLabel}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Period chips */}
                        <div className="flex overflow-x-auto sm:flex-wrap gap-2 justify-start sm:justify-end pb-2 sm:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 w-[calc(100vw-2rem)] sm:w-auto">
                            {PERIODS.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => handlePeriod(p.value)}
                                    className={`whitespace-nowrap shrink-0 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        filterDates.period === p.value
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-white/60 text-gray-500 border border-gray-100 hover:border-blue-200 hover:text-blue-600'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Inputs */}
                        {filterDates.period === 'custom' && (
                            <form onSubmit={applyCustomFilter} className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 bg-white/60 backdrop-blur-md p-3 sm:p-2 rounded-2xl border border-white/80 shadow-sm sm:justify-end w-full sm:w-auto">
                                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                                    <div className="relative col-span-1">
                                        <label className="absolute -top-2 left-3 px-1 bg-white text-[8px] font-black text-gray-400 uppercase tracking-tighter">From</label>
                                        <input 
                                            type="date"
                                            value={filterDates.start_date}
                                            onChange={e => setFilterDates(prev => ({...prev, start_date: e.target.value}))}
                                            className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold py-2.5 sm:py-2 pl-3 pr-2 focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                    <div className="relative col-span-1">
                                        <label className="absolute -top-2 left-3 px-1 bg-white text-[8px] font-black text-gray-400 uppercase tracking-tighter">To</label>
                                        <input 
                                            type="date"
                                            value={filterDates.end_date}
                                            onChange={e => setFilterDates(prev => ({...prev, end_date: e.target.value}))}
                                            className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold py-2.5 sm:py-2 pl-3 pr-2 focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                                    <button type="submit" className={`${(filterDates.start_date || filterDates.end_date) ? 'col-span-1' : 'col-span-2'} flex justify-center items-center bg-brand-600 text-white p-2.5 sm:p-2 rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-95 w-full sm:w-auto`}>
                                        <Search className="w-4 h-4 sm:w-4 sm:h-4" />
                                    </button>
                                    {(filterDates.start_date || filterDates.end_date) && (
                                        <button type="button" onClick={clearFilter} className="col-span-1 flex justify-center items-center bg-gray-100 text-gray-500 p-2.5 sm:p-2 rounded-xl hover:bg-gray-200 transition-all active:scale-95 w-full sm:w-auto">
                                            <RotateCcw className="w-4 h-4 sm:w-4 sm:h-4" />
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {[
                        { id: 'today',     label: "Dashboard",     icon: Calendar },
                        { id: 'stock',     label: "Master Stock",   icon: Boxes },
                        { id: 'intake',    label: "Stock Intake",   icon: TrendingUp },
                        { id: 'usage',     label: "Consumption",    icon: TrendingDown },
                        { id: 'recipes',   label: "Recipes",        icon: ChefHat },
                        { id: 'suppliers', label: "Suppliers",      icon: Truck },
                        { id: 'settings',  label: "Configuration",  icon: Settings }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap border-b-2 ${
                                activeTab === tab.id 
                                ? 'bg-blue-50/50 text-blue-700 border-blue-600' 
                                : 'text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50'
                            }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : ''}`} />
                            <span>{tab.label}</span>
                            {tab.id === 'today' && (lowStockItems.length > 0 || highUsageItems.length > 0) && (
                                <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{lowStockItems.length + highUsageItems.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-b-[2.5rem] rounded-tr-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden min-h-[500px]">
                    
                    {/* TAB: DASHBOARD (Today + Alerts) */}
                    {activeTab === 'today' && (
                        <div className="p-6">
                            {(lowStockItems.length > 0 || highUsageItems.length > 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Low Stock Panel */}
                                    <div className="bg-red-50/50 rounded-2xl border border-red-100 p-5">
                                        <h3 className="text-lg font-black text-red-900 mb-4 flex items-center">
                                            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                                            Critical / Low Stock Items
                                        </h3>
                                        {lowStockItems.length === 0 ? (
                                            <div className="flex items-center text-emerald-600 font-bold p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <CheckCircle className="w-5 h-5 mr-2" /> All stock levels are healthy!
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {lowStockItems.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-red-100">
                                                        <div>
                                                            <span className="font-black text-gray-900 block">{item.name}</span>
                                                            <span className="text-xs font-bold text-red-600">Threshold: {item.low_stock_threshold} {item.measuring_unit?.short_name || item.unit}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xl font-black text-red-600">{item.current_stock}</span>
                                                            <span className="text-xs font-bold text-gray-400 ml-1 uppercase">{item.measuring_unit?.short_name || item.unit}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* High Usage Panel */}
                                    <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5">
                                        <h3 className="text-lg font-black text-amber-900 mb-4 flex items-center">
                                            <TrendingDown className="w-5 h-5 mr-2 text-amber-600" />
                                            High Daily Usage Warning
                                        </h3>
                                        <p className="text-xs font-bold text-gray-500 mb-4">Items where today's usage exceeds remaining stock.</p>
                                        
                                        {highUsageItems.length === 0 ? (
                                            <div className="flex items-center text-gray-500 font-bold p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                No abnormal usage detected today.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {highUsageItems.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-amber-200">
                                                        <div>
                                                            <span className="font-black text-gray-900 block">{item.name}</span>
                                                            <span className="text-xs font-bold text-amber-600">Used Today: {item.today_used} {item.measuring_unit?.short_name || item.unit}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm font-black text-gray-500 block mb-1">Remaining</span>
                                                            <span className="text-lg font-black text-amber-600">{item.current_stock} <span className="text-[10px]">{item.measuring_unit?.short_name || item.unit}</span></span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">{periodLabel} Snapshot</h2>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Opening vs Intake vs Usage</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 font-black uppercase text-[10px] tracking-widest text-gray-500">Item Name</th>
                                            <th className="px-4 py-3 font-black uppercase text-[10px] tracking-widest text-gray-500 text-center">Opening Stock (Today)</th>
                                            <th className="px-4 py-3 font-black uppercase text-[10px] tracking-widest text-emerald-600 text-center">+ Added (Range)</th>
                                            <th className="px-4 py-3 font-black uppercase text-[10px] tracking-widest text-rose-600 text-center">- Used (Range)</th>
                                            <th className="px-4 py-3 font-black uppercase text-[10px] tracking-widest text-blue-600 text-right">Current Remaining</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.filter(i => {
                                            const intake = i.range_intake !== null ? i.range_intake : i.today_intake;
                                            const used = i.range_used !== null ? i.range_used : i.today_used;
                                            return intake > 0 || used > 0 || i.current_stock > 0;
                                        }).map(item => {
                                            const unitName = item.measuring_unit?.short_name || item.unit;
                                            const displayIntake = item.range_intake !== null ? item.range_intake : item.today_intake;
                                            const displayUsed = item.range_used !== null ? item.range_used : item.today_used;
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 font-bold text-gray-900">
                                                        {item.name}
                                                        <span className="block text-[10px] text-gray-400 font-normal">{item.stock_group?.name || item.category}</span>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-gray-500 text-center">{item.opening_stock} {unitName}</td>
                                                    <td className="px-4 py-3 font-bold text-emerald-600 text-center bg-emerald-50/30">
                                                        {displayIntake > 0 ? `+${displayIntake} ${unitName}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-rose-600 text-center bg-rose-50/30">
                                                        {displayUsed > 0 ? `-${displayUsed} ${unitName}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`inline-flex items-center justify-end font-black px-3 py-1 rounded-lg ${
                                                            item.status === 'out' ? 'bg-red-100 text-red-700' : 
                                                            item.status === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'
                                                        }`}>
                                                            {item.current_stock} <span className="text-[10px] ml-1 uppercase">{unitName}</span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: STOCK MANAGEMENT */}
                    {activeTab === 'stock' && (
                        <div className="flex flex-col lg:flex-row h-full">
                            <div className="w-full lg:w-1/3 bg-gray-50/50 p-6 border-r border-gray-100">
                                <h3 className="font-black text-gray-900 mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                                <form onSubmit={submitItem} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">Name</label>
                                        <input type="text" required placeholder="Item Name (e.g. Sugar, Milk)" className="w-full rounded-xl border-gray-200 text-sm focus:ring-blue-500" value={itemForm.data.name} onChange={e => itemForm.setData('name', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">Unit</label>
                                            <select required className="w-full rounded-xl border-gray-200 text-sm focus:ring-blue-500" value={itemForm.data.measuring_unit_id} onChange={e => itemForm.setData('measuring_unit_id', e.target.value)}>
                                                <option value="">Select Unit</option>
                                                {measuringUnits?.map(u => <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>)}
                                                {measuringUnits?.length === 0 && <option value="" disabled>No Units configured</option>}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">Group</label>
                                            <select className="w-full rounded-xl border-gray-200 text-sm focus:ring-blue-500" value={itemForm.data.stock_group_id} onChange={e => itemForm.setData('stock_group_id', e.target.value)}>
                                                <option value="">No Group</option>
                                                {stockGroups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">Alert Threshold</label>
                                            <input type="number" step="0.01" placeholder="Minimum qty for warning (e.g. 5)" className="w-full rounded-xl border-gray-200 text-sm focus:ring-amber-500" value={itemForm.data.low_stock_threshold} onChange={e => itemForm.setData('low_stock_threshold', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">Initial/Set Stock</label>
                                            <input type="number" step="0.01" placeholder="Starting stock qty (e.g. 20)" className="w-full rounded-xl border-gray-200 text-sm focus:ring-blue-500" value={itemForm.data.current_stock} onChange={e => itemForm.setData('current_stock', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={itemForm.processing} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all">
                                            {editingItem ? 'Update Item' : 'Save Item'}
                                        </button>
                                        {editingItem && (
                                            <button type="button" onClick={() => {setEditingItem(null); itemForm.reset();}} className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all">
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                            <div className="w-full lg:w-2/3 p-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {items.map(item => (
                                        <div key={item.id} className={`p-4 rounded-2xl border ${item.status === 'out' ? 'border-red-200 bg-red-50/30' : item.status === 'low' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'} flex flex-col relative group`}>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                                <button onClick={() => openEditItem(item)} className="p-1.5 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-50"><Edit3 className="w-3 h-3" /></button>
                                                <button onClick={() => confirmDelete('Delete Item', `Delete ${item.name}?`, route('inventory.items.destroy', item.id))} className="p-1.5 bg-white text-rose-600 rounded-lg shadow-sm hover:bg-rose-50"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 mb-1">{item.stock_group?.name || item.category || 'Uncategorized'}</span>
                                            <span className="text-base font-black text-gray-900 leading-tight">{item.name}</span>
                                            <div className="mt-auto pt-3 flex items-end justify-between">
                                                <span className={`text-xl font-black ${item.status === 'out' ? 'text-red-600' : item.status === 'low' ? 'text-amber-600' : 'text-blue-600'}`}>
                                                    {item.current_stock} <span className="text-[10px] font-bold uppercase">{item.measuring_unit?.short_name || item.unit}</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: INTAKE LOGS */}
                    {activeTab === 'intake' && (
                        <div className="flex flex-col lg:flex-row h-full">
                            <div className="w-full lg:w-1/3 bg-emerald-50/30 p-6 border-r border-emerald-100">
                                <h3 className="font-black text-emerald-900 mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-emerald-600"/> {editingPurchase ? 'Edit Intake' : 'Log New Intake'}</h3>
                                <form onSubmit={submitPurchase} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-2">Item</label>
                                        <select required className="w-full rounded-xl border-emerald-200 focus:ring-emerald-500 text-sm bg-white" value={purchaseForm.data.inventory_item_id} onChange={e => purchaseForm.setData('inventory_item_id', e.target.value)}>
                                            <option value="">Select Item</option>
                                            {items.map(m => <option key={m.id} value={m.id}>{m.name} ({m.measuring_unit?.short_name || m.unit})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-2">Supplier</label>
                                        <select className="w-full rounded-xl border-emerald-200 focus:ring-emerald-500 text-sm bg-white" value={purchaseForm.data.supplier_id} onChange={e => purchaseForm.setData('supplier_id', e.target.value)}>
                                            <option value="">No Supplier</option>
                                            {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-2">Quantity</label>
                                            <input type="number" step="0.01" required placeholder="Qty purchased (e.g. 50)" className="w-full rounded-xl border-emerald-200 focus:ring-emerald-500 text-sm" value={purchaseForm.data.quantity} onChange={e => { purchaseForm.setData('quantity', e.target.value); calculateTotal(e.target.value, purchaseForm.data.unit_price); }} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-2">Unit Price</label>
                                            <input type="number" step="0.01" required placeholder="Price per unit (e.g. 1.5)" className="w-full rounded-xl border-emerald-200 focus:ring-emerald-500 text-sm" value={purchaseForm.data.unit_price} onChange={e => { purchaseForm.setData('unit_price', e.target.value); calculateTotal(purchaseForm.data.quantity, e.target.value); }} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-2">Total</label>
                                            <input type="number" step="0.01" required placeholder="Calculated total price" className="w-full rounded-xl border-emerald-200 bg-emerald-100 font-bold text-emerald-900 text-sm" value={purchaseForm.data.total_price} onChange={e => purchaseForm.setData('total_price', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-2">Date</label>
                                            <input type="date" required className="w-full rounded-xl border-emerald-200 focus:ring-emerald-500 text-sm" value={purchaseForm.data.purchase_date} onChange={e => purchaseForm.setData('purchase_date', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-emerald-700 uppercase mb-2">Notes</label>
                                        <input type="text" placeholder="Intake comments / details" className="w-full rounded-xl border-emerald-200 focus:ring-emerald-500 text-sm" value={purchaseForm.data.notes} onChange={e => purchaseForm.setData('notes', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={purchaseForm.processing} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                                            {editingPurchase ? 'Update Intake' : 'Save Intake'}
                                        </button>
                                        {editingPurchase && (
                                            <button type="button" onClick={() => {setEditingPurchase(null); purchaseForm.reset('quantity','unit_price','total_price','notes');}} className="px-4 bg-emerald-200 hover:bg-emerald-300 text-emerald-800 font-bold rounded-xl transition-all">Cancel</button>
                                        )}
                                    </div>
                                </form>
                            </div>
                            <div className="w-full lg:w-2/3 p-0 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Date</th>
                                            <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Item</th>
                                            <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-emerald-600">Qty Added</th>
                                            <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Cost</th>
                                            <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Supplier</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <Deferred data="recentPurchases" fallback={<tr><td colSpan="6" className="px-6 py-10 text-center text-xs font-bold text-gray-400 animate-pulse">Loading recent purchases...</td></tr>}>
                                            {recentPurchases?.map(log => (
                                                <tr key={log.id} className="hover:bg-emerald-50/20">
                                                    <td className="px-6 py-3 font-bold text-gray-500 text-xs">{new Date(log.purchase_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3 font-black text-gray-900">{log.inventory_item?.name}</td>
                                                    <td className="px-6 py-3 font-bold text-emerald-600">+{log.quantity} <span className="text-[10px] uppercase text-gray-400">{log.inventory_item?.measuring_unit?.short_name || log.inventory_item?.unit}</span></td>
                                                    <td className="px-6 py-3 font-bold text-gray-600">{formatCurrency(log.total_price)}</td>
                                                    <td className="px-6 py-3 font-medium text-gray-500 text-xs">{log.supplier?.name || '-'}</td>
                                                    <td className="px-6 py-3 text-right space-x-2">
                                                        <button onClick={() => openEditPurchase(log)} className="text-blue-400 hover:text-blue-600"><Edit3 className="w-4 h-4 inline"/></button>
                                                        <button onClick={() => confirmDelete('Delete Intake', 'Delete this intake log? This reverts stock.', route('inventory.purchases.destroy', log.id))} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4 inline"/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </Deferred>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: USAGE LOGS */}
                    {activeTab === 'usage' && (
                        <div className="flex flex-col lg:flex-row h-full">
                            <div className="w-full lg:w-1/3 bg-rose-50/30 p-6 border-r border-rose-100">
                                <h3 className="font-black text-rose-900 mb-4 flex items-center"><TrendingDown className="w-5 h-5 mr-2 text-rose-600"/> {editingUsage ? 'Edit Usage' : 'Log Daily Usage'}</h3>
                                <form onSubmit={submitUsage} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-rose-700 uppercase mb-2">Item Used</label>
                                        <select required className="w-full rounded-xl border-rose-200 focus:ring-rose-500 text-sm bg-white" value={usageForm.data.inventory_item_id} onChange={e => usageForm.setData('inventory_item_id', e.target.value)}>
                                            <option value="">Select Item</option>
                                            {items.map(m => <option key={m.id} value={m.id}>{m.name} ({m.current_stock} avail)</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-rose-700 uppercase mb-2">Quantity Used</label>
                                            <input type="number" step="0.01" required placeholder="Qty consumed (e.g. 5)" className="w-full rounded-xl border-rose-200 focus:ring-rose-500 text-sm" value={usageForm.data.quantity_used} onChange={e => usageForm.setData('quantity_used', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-rose-700 uppercase mb-2">Date</label>
                                            <input type="date" required className="w-full rounded-xl border-rose-200 focus:ring-rose-500 text-sm" value={usageForm.data.usage_date} onChange={e => usageForm.setData('usage_date', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-rose-700 uppercase mb-2">Notes</label>
                                        <input type="text" placeholder="Reason for usage (e.g. Spillage)" className="w-full rounded-xl border-rose-200 focus:ring-rose-500 text-sm" value={usageForm.data.notes} onChange={e => usageForm.setData('notes', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={usageForm.processing} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20">
                                            {editingUsage ? 'Update Usage' : 'Save Usage'}
                                        </button>
                                        {editingUsage && (
                                            <button type="button" onClick={() => {setEditingUsage(null); usageForm.reset('quantity_used','notes');}} className="px-4 bg-rose-200 hover:bg-rose-300 text-rose-800 font-bold rounded-xl transition-all">Cancel</button>
                                        )}
                                    </div>
                                </form>
                            </div>
                            <div className="w-full lg:w-2/3 p-0 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Date</th>
                                            <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Item</th>
                                            <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-rose-600">Qty Used</th>
                                            <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-gray-400">Notes</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <Deferred data="recentUsages" fallback={<tr><td colSpan="5" className="px-6 py-10 text-center text-xs font-bold text-gray-400 animate-pulse">Loading recent usages...</td></tr>}>
                                            {recentUsages?.map(log => (
                                                <tr key={log.id} className="hover:bg-rose-50/20">
                                                    <td className="px-6 py-3 font-bold text-gray-500 text-xs">{new Date(log.usage_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3 font-black text-gray-900">{log.inventory_item?.name}</td>
                                                    <td className="px-6 py-3 font-bold text-rose-600">-{log.quantity_used} <span className="text-[10px] uppercase text-gray-400">{log.inventory_item?.measuring_unit?.short_name || log.inventory_item?.unit}</span></td>
                                                    <td className="px-6 py-3 font-medium text-gray-500 text-xs">{log.notes || '-'}</td>
                                                    <td className="px-6 py-3 text-right space-x-2">
                                                        <button onClick={() => openEditUsage(log)} className="text-blue-400 hover:text-blue-600"><Edit3 className="w-4 h-4 inline"/></button>
                                                        <button onClick={() => confirmDelete('Delete Usage', 'Delete usage log? This restores stock.', route('inventory.usages.destroy', log.id))} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4 inline"/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </Deferred>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: SUPPLIERS */}
                    {activeTab === 'suppliers' && (
                        <div className="flex flex-col lg:flex-row h-full">
                            <div className="w-full lg:w-1/3 bg-blue-50/30 p-6 border-r border-blue-100">
                                <h3 className="font-black text-blue-900 mb-4 flex items-center"><Truck className="w-5 h-5 mr-2 text-blue-600"/> {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
                                <form onSubmit={submitSupplier} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-blue-700 uppercase mb-2">Company Name</label>
                                        <input type="text" required placeholder="Company name (e.g. Acme Corp)" className="w-full rounded-xl border-blue-200 focus:ring-blue-500 text-sm" value={supplierForm.data.name} onChange={e => supplierForm.setData('name', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-blue-700 uppercase mb-2">Contact Person</label>
                                        <input type="text" placeholder="Name of contact (e.g. John Doe)" className="w-full rounded-xl border-blue-200 focus:ring-blue-500 text-sm" value={supplierForm.data.contact_person} onChange={e => supplierForm.setData('contact_person', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-blue-700 uppercase mb-2">Phone</label>
                                            <input type="text" placeholder="Contact phone number" className="w-full rounded-xl border-blue-200 focus:ring-blue-500 text-sm" value={supplierForm.data.phone} onChange={e => supplierForm.setData('phone', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black tracking-widest text-blue-700 uppercase mb-2">Email</label>
                                            <input type="email" placeholder="Supplier email address" className="w-full rounded-xl border-blue-200 focus:ring-blue-500 text-sm" value={supplierForm.data.email} onChange={e => supplierForm.setData('email', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest text-blue-700 uppercase mb-2">Address</label>
                                        <input type="text" placeholder="Supplier physical address" className="w-full rounded-xl border-blue-200 focus:ring-blue-500 text-sm" value={supplierForm.data.address} onChange={e => supplierForm.setData('address', e.target.value)} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={supplierForm.processing} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                                            {editingSupplier ? 'Update' : 'Save'}
                                        </button>
                                        {editingSupplier && (
                                            <button type="button" onClick={() => {setEditingSupplier(null); supplierForm.reset();}} className="px-4 bg-blue-200 hover:bg-blue-300 text-blue-800 font-bold rounded-xl transition-all">Cancel</button>
                                        )}
                                    </div>
                                </form>
                            </div>
                            <div className="w-full lg:w-2/3 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Deferred data="suppliers" fallback={<div className="col-span-2 text-center text-gray-400 font-bold py-10 animate-pulse">Loading suppliers...</div>}>
                                        {suppliers?.map(sup => (
                                            <div key={sup.id} className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col relative group shadow-sm">
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                                    <button onClick={() => openEditSupplier(sup)} className="p-1.5 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-50"><Edit3 className="w-3 h-3" /></button>
                                                    <button onClick={() => confirmDelete('Delete Supplier', 'Are you sure?', route('inventory.suppliers.destroy', sup.id))} className="p-1.5 bg-white text-rose-600 rounded-lg shadow-sm hover:bg-rose-50"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                                <span className="text-lg font-black text-gray-900 leading-tight mb-2">{sup.name}</span>
                                                <div className="text-xs font-bold text-gray-500 space-y-1">
                                                    {sup.contact_person && <div>👤 {sup.contact_person}</div>}
                                                    {sup.phone && <div>📞 {sup.phone}</div>}
                                                    {sup.email && <div>✉️ {sup.email}</div>}
                                                    {sup.address && <div>📍 {sup.address}</div>}
                                                </div>
                                            </div>
                                        ))}
                                        {suppliers?.length === 0 && (
                                            <div className="col-span-2 text-center text-gray-400 font-bold py-10">No suppliers configured.</div>
                                        )}
                                    </Deferred>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: SETTINGS (Units & Groups) */}
                    {activeTab === 'settings' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* Measuring Units */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-black text-gray-900 flex items-center"><Scale className="w-4 h-4 mr-2 text-blue-600"/> Measuring Units</h3>
                                    </div>
                                    <div className="p-4">
                                        <form onSubmit={submitUnit} className="flex gap-2 mb-6">
                                            <input type="text" placeholder="Name (e.g. Kilogram)" required className="w-full rounded-xl border-gray-200 text-sm focus:ring-blue-500" value={unitForm.data.name} onChange={e => unitForm.setData('name', e.target.value)} />
                                            <input type="text" placeholder="Short (e.g. kg)" required className="w-24 rounded-xl border-gray-200 text-sm focus:ring-blue-500" value={unitForm.data.short_name} onChange={e => unitForm.setData('short_name', e.target.value)} />
                                            <button type="submit" disabled={unitForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl font-bold transition-all whitespace-nowrap">
                                                {editingUnit ? 'Update' : 'Add'}
                                            </button>
                                            {editingUnit && <button type="button" onClick={() => {setEditingUnit(null); unitForm.reset();}} className="bg-gray-200 px-3 rounded-xl">X</button>}
                                        </form>
                                        <div className="space-y-2">
                                            {measuringUnits.map(u => (
                                                <div key={u.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                                    <div>
                                                        <span className="font-bold text-gray-900">{u.name}</span>
                                                        <span className="ml-2 text-xs font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">{u.short_name}</span>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => openEditUnit(u)} className="text-gray-400 hover:text-blue-600"><Edit3 className="w-4 h-4"/></button>
                                                        <button onClick={() => confirmDelete('Delete Unit', 'Are you sure?', route('inventory.units.destroy', u.id))} className="text-gray-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {measuringUnits.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No units added.</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Groups */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-black text-gray-900 flex items-center"><Layers className="w-4 h-4 mr-2 text-blue-600"/> Stock Groups</h3>
                                    </div>
                                    <div className="p-4">
                                        <form onSubmit={submitGroup} className="flex flex-col gap-2 mb-6">
                                            <input type="text" placeholder="Group Name (e.g. Dairy, Spices)" required className="w-full rounded-xl border-gray-200 text-sm focus:ring-blue-500" value={groupForm.data.name} onChange={e => groupForm.setData('name', e.target.value)} />
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="Description (Optional)" className="w-full rounded-xl border-gray-200 text-sm focus:ring-blue-500" value={groupForm.data.description} onChange={e => groupForm.setData('description', e.target.value)} />
                                                <button type="submit" disabled={groupForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap">
                                                    {editingGroup ? 'Update' : 'Add'}
                                                </button>
                                                {editingGroup && <button type="button" onClick={() => {setEditingGroup(null); groupForm.reset();}} className="bg-gray-200 px-3 rounded-xl">X</button>}
                                            </div>
                                        </form>
                                        <div className="space-y-2">
                                            {stockGroups.map(g => (
                                                <div key={g.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                                    <div>
                                                        <span className="font-bold text-gray-900 block">{g.name}</span>
                                                        <span className="text-xs text-gray-500">{g.description}</span>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => openEditGroup(g)} className="text-gray-400 hover:text-blue-600"><Edit3 className="w-4 h-4"/></button>
                                                        <button onClick={() => confirmDelete('Delete Group', 'Are you sure?', route('inventory.groups.destroy', g.id))} className="text-gray-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {stockGroups.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No groups added.</p>}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
            {/* ─────────────────────────────────────────────────────────── */}
            {/* TAB: RECIPES                                                 */}
            {/* ─────────────────────────────────────────────────────────── */}
            {activeTab === 'recipes' && (
                <div className="flex flex-col lg:flex-row gap-0 min-h-[600px]">

                    {/* ── Left: Menu List ── */}
                    <div className="w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col bg-gray-50/50">
                        {/* Header */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Menu Items</p>
                                    <p className="text-sm font-black text-gray-800">{menus.length} items</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={recipeSearch}
                                    onChange={e => setRecipeSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
                                />
                            </div>
                        </div>

                        {/* Menu list */}
                        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                            {filteredMenus.length === 0 && (
                                <div className="py-10 text-center">
                                    <p className="text-xs font-bold text-gray-400">No menu items found</p>
                                </div>
                            )}
                            {filteredMenus.map(menu => {
                                const hasRecipe = (recipesByMenu[menu.id] || []).length > 0;
                                const isSelected = selectedMenuId === menu.id;
                                return (
                                    <button
                                        key={menu.id}
                                        onClick={() => openMenuRecipe(menu)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2.5 group ${
                                            isSelected
                                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                                : 'hover:bg-white hover:shadow-sm text-gray-700'
                                        }`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                            isSelected ? 'bg-white/20' : hasRecipe ? 'bg-emerald-100' : 'bg-gray-100'
                                        }`}>
                                            {hasRecipe
                                                ? <Zap className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                                                : <Package className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>{menu.name}</p>
                                            {menu.category && (
                                                <p className={`text-[9px] font-bold uppercase tracking-wider truncate ${
                                                    isSelected ? 'text-white/70' : 'text-gray-400'
                                                }`}>{menu.category}</p>
                                            )}
                                        </div>
                                        {hasRecipe && !isSelected && (
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                                                {(recipesByMenu[menu.id] || []).length} ing.
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Right: Recipe Editor ── */}
                    <div className="flex-1 flex flex-col">
                        {!selectedMenu ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-8">
                                <div className="w-20 h-20 rounded-3xl bg-violet-50 flex items-center justify-center mb-5">
                                    <ChefHat className="w-10 h-10 text-violet-300" />
                                </div>
                                <h3 className="text-lg font-black text-gray-700 mb-2">Select a Menu Item</h3>
                                <p className="text-sm font-bold text-gray-400 max-w-xs">
                                    Pick a menu item from the left to define which inventory ingredients it consumes per serving.
                                </p>
                                <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm">
                                    {['Sugar 10g', 'Milk 150ml', 'Tea 5g'].map(label => (
                                        <div key={label} className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 text-center">
                                            <FlaskConical className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                                            <span className="text-[10px] font-black text-violet-600">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {/* Recipe header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                                            <Utensils className="w-4 h-4 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recipe for</p>
                                            <h3 className="text-base font-black text-gray-900">{selectedMenu.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {recipeSaved && (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                                <CheckCircle className="w-3.5 h-3.5" /> Saved!
                                            </span>
                                        )}
                                        <button
                                            onClick={saveRecipe}
                                            disabled={recipeSaving || recipeIngredients.length === 0}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-violet-500/20 transition-all"
                                        >
                                            {recipeSaving ? 'Saving...' : 'Save Recipe'}
                                        </button>
                                    </div>
                                </div>

                                {/* Ingredients list */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {/* Info banner */}
                                    <div className="flex items-start gap-3 bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-5">
                                        <Zap className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                                        <p className="text-xs font-bold text-violet-700">
                                            When an order containing <strong>{selectedMenu.name}</strong> is completed, the quantities below will be automatically deducted from inventory per unit sold.
                                        </p>
                                    </div>

                                    {recipeIngredients.length === 0 && (
                                        <div className="text-center py-10">
                                            <FlaskConical className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                            <p className="text-sm font-bold text-gray-400">No ingredients yet</p>
                                            <p className="text-xs text-gray-300 mt-1">Click "+ Add Ingredient" to start building the recipe</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {recipeIngredients.map((row, idx) => {
                                            const invItem = items.find(i => String(i.id) === String(row.inventory_item_id));
                                            const stockStatus = invItem?.status || 'sufficient';
                                            const statusColors = {
                                                out: 'text-red-600 bg-red-50 border-red-200',
                                                low: 'text-amber-600 bg-amber-50 border-amber-200',
                                                sufficient: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                                            };
                                            // ── Yield calculation ──
                                            const qty = parseFloat(row.quantity_per_serving);
                                            const stock = parseFloat(invItem?.current_stock ?? 0);
                                            const canMake = (invItem && qty > 0) ? Math.floor(stock / qty) : null;
                                            return (
                                                <div key={row._key} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 group hover:border-violet-200 transition-all">
                                                    {/* Index */}
                                                    <span className="text-[10px] font-black text-gray-300 w-5 shrink-0">{idx + 1}.</span>

                                                    {/* Inventory item selector */}
                                                    <div className="flex-1 min-w-0">
                                                        <select
                                                            value={row.inventory_item_id}
                                                            onChange={e => updateIngredientRow(row._key, 'inventory_item_id', e.target.value)}
                                                            className="w-full text-sm font-bold text-gray-800 bg-transparent border-none outline-none focus:ring-0 cursor-pointer truncate"
                                                        >
                                                            <option value="">— Select ingredient —</option>
                                                            {items.map(inv => (
                                                                <option key={inv.id} value={inv.id}>
                                                                    {inv.name} ({inv.measuring_unit?.short_name || inv.unit || '?'})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <input
                                                            type="number"
                                                            min="0.0001"
                                                            step="0.01"
                                                            placeholder="Qty"
                                                            value={row.quantity_per_serving}
                                                            onChange={e => updateIngredientRow(row._key, 'quantity_per_serving', e.target.value)}
                                                            className="w-20 text-sm font-black text-center bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
                                                        />
                                                        <span className="text-xs font-black text-gray-400 min-w-[2rem]">
                                                            {row.item_unit || (invItem?.measuring_unit?.short_name || invItem?.unit || '')}
                                                        </span>
                                                    </div>

                                                    {/* Stock badge */}
                                                    {invItem && (
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${statusColors[stockStatus]}`}>
                                                            {invItem.current_stock} {invItem.measuring_unit?.short_name || invItem.unit}
                                                        </span>
                                                    )}

                                                    {/* Yield badge — makes N servings */}
                                                    {canMake !== null && (
                                                        <span
                                                            title={`${invItem.current_stock} ${invItem.measuring_unit?.short_name || invItem.unit} ÷ ${qty} = ${canMake} servings`}
                                                            className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                                                                canMake === 0
                                                                    ? 'bg-red-50 border-red-200 text-red-600'
                                                                    : canMake <= 5
                                                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                            }`}
                                                        >
                                                            ⚗ {canMake} servings
                                                        </span>
                                                    )}

                                                    {/* Remove */}
                                                    <button
                                                        onClick={() => removeIngredientRow(row._key)}
                                                        className="shrink-0 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add row button */}
                                    <button
                                        onClick={addIngredientRow}
                                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50 text-violet-500 hover:text-violet-700 text-xs font-bold transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Ingredient
                                    </button>
                                </div>

                                {/* Footer summary */}
                                {recipeIngredients.length > 0 && (() => {
                                    // Compute per-ingredient yields
                                    const yieldRows = recipeIngredients
                                        .filter(r => r.inventory_item_id && parseFloat(r.quantity_per_serving) > 0)
                                        .map(r => {
                                            const inv  = items.find(i => String(i.id) === String(r.inventory_item_id));
                                            const qty  = parseFloat(r.quantity_per_serving);
                                            const stock = parseFloat(inv?.current_stock ?? 0);
                                            return {
                                                name:      r.item_name || inv?.name || 'Unknown',
                                                unit:      r.item_unit || inv?.measuring_unit?.short_name || inv?.unit || '',
                                                qty,
                                                stock,
                                                canMake:   inv ? Math.floor(stock / qty) : null,
                                                _key:      r._key,
                                                qty_label: r.quantity_per_serving,
                                            };
                                        });

                                    // Bottleneck = ingredient with fewest possible servings
                                    const withYield = yieldRows.filter(r => r.canMake !== null);
                                    const maxServings = withYield.length > 0
                                        ? Math.min(...withYield.map(r => r.canMake))
                                        : null;
                                    const bottleneck = withYield.find(r => r.canMake === maxServings);

                                    return (
                                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 space-y-4">

                                            {/* Max yield card */}
                                            {maxServings !== null && (
                                                <div className={`flex items-center gap-4 rounded-2xl px-5 py-4 border ${
                                                    maxServings === 0
                                                        ? 'bg-red-50 border-red-200'
                                                        : maxServings <= 5
                                                        ? 'bg-amber-50 border-amber-200'
                                                        : 'bg-indigo-50 border-indigo-200'
                                                }`}>
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                        maxServings === 0 ? 'bg-red-100' : maxServings <= 5 ? 'bg-amber-100' : 'bg-indigo-100'
                                                    }`}>
                                                        <ChefHat className={`w-6 h-6 ${
                                                            maxServings === 0 ? 'text-red-500' : maxServings <= 5 ? 'text-amber-600' : 'text-indigo-600'
                                                        }`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${
                                                            maxServings === 0 ? 'text-red-500' : maxServings <= 5 ? 'text-amber-600' : 'text-indigo-500'
                                                        }`}>
                                                            {selectedMenu?.name} — Max Yield
                                                        </p>
                                                        <p className={`text-2xl font-black leading-none ${
                                                            maxServings === 0 ? 'text-red-700' : maxServings <= 5 ? 'text-amber-700' : 'text-indigo-700'
                                                        }`}>
                                                            {maxServings}
                                                            <span className="text-sm font-bold ml-2">
                                                                {maxServings === 1 ? 'serving' : 'servings'} can be made
                                                            </span>
                                                        </p>
                                                        {bottleneck && maxServings < 9999 && (
                                                            <p className={`text-[10px] font-bold mt-1 ${
                                                                maxServings === 0 ? 'text-red-500' : maxServings <= 5 ? 'text-amber-600' : 'text-indigo-500'
                                                            }`}>
                                                                Limited by: <strong>{bottleneck.name}</strong> — {bottleneck.stock} {bottleneck.unit} remaining ÷ {bottleneck.qty_label} per serving
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Per-ingredient yield breakdown */}
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Per Ingredient Yield</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {yieldRows.map(r => (
                                                        <div key={r._key} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-3 py-2 shadow-sm">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <FlaskConical className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-black text-gray-800 truncate">{r.name}</p>
                                                                    <p className="text-[9px] font-bold text-gray-400">{r.stock} {r.unit} ÷ {r.qty_label} {r.unit}/serving</p>
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ml-2 ${
                                                                r.canMake === 0
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : r.canMake !== null && r.canMake <= 5
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-indigo-100 text-indigo-700'
                                                            }`}>
                                                                {r.canMake !== null ? `${r.canMake} ×` : '—'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            )}

                </div>
            </div>

            {/* Custom Confirmation Dialog */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-6 transform transition-all border border-gray-100">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">{confirmDialog.title}</h3>
                        <p className="text-sm font-bold text-gray-500 mb-6">{confirmDialog.message}</p>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDialog.onConfirm}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-500/30"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
