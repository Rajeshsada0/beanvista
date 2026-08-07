import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Clock, 
    CheckCircle2, 
    Play, 
    AlertCircle, 
    Coffee, 
    ChevronRight, 
    Hash, 
    User, 
    AlertTriangle, 
    Flame, 
    Timer, 
    CalendarClock,
    Search,
    ArrowUpDown,
    SlidersHorizontal,
    X,
    Info,
    FileText,
    Check,
    Sun,
    Moon
} from 'lucide-react';
import { useState, useEffect } from 'react';

const formatDuration = (start, end = new Date()) => {
    if (!start) return '--:--';
    // Ensure accurate calculation regardless of timezone offsets
    const diff = Math.max(0, Math.floor((new Date(end) - new Date(start)) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getElapsedMins = (start, end = new Date()) => {
    if (!start) return 0;
    const diffMs = new Date(end) - new Date(start);
    return Math.max(0, Math.floor(diffMs / 60000));
};

export default function KDS({ items, kds_warning_mins = 10, kds_critical_mins = 20 }) {
    const { auth } = usePage().props;
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('kds_view_mode') || 'order');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('oldest'); // 'oldest' | 'newest' | 'urgent'
    const [selectedOrder, setSelectedOrder] = useState(null); // Detailed order drawer
    const [theme, setTheme] = useState(() => localStorage.getItem('kds_theme') || 'dark');

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('kds_theme', newTheme);
    };

    const isKitchenRole = auth.user?.role === 'kitchen';
    const wrapperClass = isKitchenRole
        ? `min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-4 md:p-6 flex flex-col space-y-6 font-sans h-full max-h-screen overflow-y-auto`
        : `min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} -m-6 sm:-m-8 lg:-m-10 p-6 sm:p-8 lg:p-10 flex flex-col space-y-6 font-sans`;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        // Sync handled globally by AuthenticatedLayout (3s)
        return () => clearInterval(timer);
    }, []);

    const updateStatus = (itemId, status) => {
        router.post(route('order-items.update-status', itemId), { status }, {
            preserveScroll: true
        });
    };

    const updateBulkStatus = (itemIds, status) => {
        if (!itemIds || itemIds.length === 0) return;
        router.post(route('order-items.bulk-status'), { item_ids: itemIds, status }, {
            preserveScroll: true
        });
    };

    const getStatusColor = (status) => {
        if (theme === 'dark') {
            switch(status) {
                case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
                case 'preparing': return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
                case 'ready': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
                default: return 'bg-slate-800 text-slate-400 border-slate-700';
            }
        } else {
            switch(status) {
                case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
                case 'preparing': return 'bg-blue-50 text-blue-700 border-blue-200';
                case 'ready': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                default: return 'bg-slate-100 text-slate-600 border-slate-200';
            }
        }
    };

    const getUrgency = (item) => {
        const startRef = item.started_at || item.created_at;
        const mins = getElapsedMins(startRef, currentTime);
        if (mins >= kds_critical_mins) return 'critical';
        if (mins >= kds_warning_mins) return 'warning';
        return 'normal';
    };

    const getCardStyles = (item) => {
        const urgency = getUrgency(item);
        if (theme === 'dark') {
            if (urgency === 'critical') return 'border-rose-500/40 bg-gradient-to-b from-rose-950/15 to-slate-950/20 ring-1 ring-rose-500/30 hover:border-rose-500/80 shadow-2xl shadow-rose-950/20';
            if (urgency === 'warning') return 'border-amber-500/35 bg-gradient-to-b from-amber-950/10 to-slate-950/20 ring-1 ring-amber-500/25 hover:border-amber-500/70 shadow-2xl shadow-amber-950/10';
            if (item.kds_status === 'preparing') return 'border-blue-500/30 bg-slate-900/45 ring-1 ring-blue-500/15 hover:border-blue-500/60 shadow-xl shadow-slate-950/40 hover:-translate-y-1';
            return 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 shadow-xl shadow-slate-950/40 hover:-translate-y-1';
        } else {
            if (urgency === 'critical') return 'border-rose-350 bg-gradient-to-b from-rose-50/25 to-white ring-1 ring-rose-100 hover:border-rose-450 shadow-xl shadow-rose-100/50';
            if (urgency === 'warning') return 'border-amber-350 bg-gradient-to-b from-amber-50/25 to-white ring-1 ring-amber-100 hover:border-amber-450 shadow-xl shadow-amber-100/50';
            if (item.kds_status === 'preparing') return 'border-blue-300 bg-blue-50/20 ring-1 ring-blue-100 hover:border-blue-400 shadow-xl shadow-blue-100/50 hover:-translate-y-1';
            return 'border-slate-200 bg-white hover:border-slate-350 shadow-xl shadow-slate-100 hover:-translate-y-1';
        }
    };

    const getTimerStyles = (item) => {
        const urgency = getUrgency(item);
        if (theme === 'dark') {
            if (urgency === 'critical') return 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md';
            if (urgency === 'warning') return 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md';
            return 'bg-slate-800 text-slate-300 border border-slate-700';
        } else {
            if (urgency === 'critical') return 'bg-rose-100 text-rose-700 border border-rose-200 shadow-sm';
            if (urgency === 'warning') return 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm';
            return 'bg-slate-100 text-slate-750 border border-slate-200';
        }
    };

    // Calculate urgency for a whole order group
    const getOrderUrgency = (orderGroup) => {
        const urgencies = orderGroup.items.map(i => getUrgency(i));
        if (urgencies.includes('critical')) return 'critical';
        if (urgencies.includes('warning')) return 'warning';
        return 'normal';
    };

    const getOrderCardStyles = (orderGroup) => {
        const urgency = getOrderUrgency(orderGroup);
        if (theme === 'dark') {
            if (urgency === 'critical') return 'border-rose-500/40 bg-gradient-to-b from-rose-950/15 to-slate-950/20 ring-1 ring-rose-500/30 hover:border-rose-500/80 shadow-2xl shadow-rose-950/20 animate-pulse-slow';
            if (urgency === 'warning') return 'border-amber-500/35 bg-gradient-to-b from-amber-950/10 to-slate-950/20 ring-1 ring-amber-500/25 hover:border-amber-500/70 shadow-2xl shadow-amber-950/10';
            
            const hasPreparing = orderGroup.items.some(i => i.kds_status === 'preparing');
            if (hasPreparing) return 'border-blue-500/30 bg-slate-900/45 ring-1 ring-blue-500/10 hover:border-blue-500/60 shadow-xl shadow-slate-950/40 hover:-translate-y-1';
            
            return 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 shadow-xl shadow-slate-950/40 hover:-translate-y-1';
        } else {
            if (urgency === 'critical') return 'border-rose-300 bg-gradient-to-b from-rose-50/25 to-white ring-1 ring-rose-100 hover:border-rose-450 shadow-xl shadow-rose-100/50 animate-pulse-slow';
            if (urgency === 'warning') return 'border-amber-300 bg-gradient-to-b from-amber-50/25 to-white ring-1 ring-amber-100 hover:border-amber-450 shadow-xl shadow-amber-100/50';
            
            const hasPreparing = orderGroup.items.some(i => i.kds_status === 'preparing');
            if (hasPreparing) return 'border-blue-300 bg-gradient-to-b from-blue-50/15 to-white ring-1 ring-blue-100 hover:border-blue-400 shadow-xl shadow-blue-100/50 hover:-translate-y-1';
            
            return 'border-slate-200 bg-white hover:border-slate-350 shadow-xl shadow-slate-100 hover:-translate-y-1';
        }
    };

    // Filter items first
    const filteredItems = items.filter(item => {
        const tableNum = item.order?.table?.table_number || '';
        const orderType = item.order?.order_type || '';
        const orderNum = item.order?.order_number || '';
        const menuName = item.menu?.name || '';
        const customerName = item.order?.customer?.name || '';
        const waiterName = item.order?.waiter?.name || '';
        
        const q = searchQuery.toLowerCase();
        
        return searchQuery.trim() === '' || 
            tableNum.toLowerCase().includes(q) ||
            orderType.toLowerCase().includes(q) ||
            orderNum.toLowerCase().includes(q) ||
            menuName.toLowerCase().includes(q) ||
            customerName.toLowerCase().includes(q) ||
            waiterName.toLowerCase().includes(q);
    });

    // Grouping for Order View
    const groupedOrders = filteredItems.reduce((acc, item) => {
        const orderId = item.order.id;
        if (!acc[orderId]) {
            acc[orderId] = {
                order: item.order,
                items: [],
                oldestCreatedAt: new Date(item.created_at),
            };
        }
        acc[orderId].items.push(item);
        
        const itemCreatedAt = new Date(item.created_at);
        if (itemCreatedAt < acc[orderId].oldestCreatedAt) {
            acc[orderId].oldestCreatedAt = itemCreatedAt;
        }
        return acc;
    }, {});

    let sortedOrders = Object.values(groupedOrders);

    // Sort orders
    if (sortBy === 'oldest') {
        sortedOrders.sort((a, b) => a.oldestCreatedAt - b.oldestCreatedAt);
    } else if (sortBy === 'newest') {
        sortedOrders.sort((a, b) => b.oldestCreatedAt - a.oldestCreatedAt);
    } else if (sortBy === 'urgent') {
        const urgencyVal = (orderGroup) => {
            const urgency = getOrderUrgency(orderGroup);
            if (urgency === 'critical') return 3;
            if (urgency === 'warning') return 2;
            return 1;
        };
        sortedOrders.sort((a, b) => {
            const valA = urgencyVal(a);
            const valB = urgencyVal(b);
            if (valA !== valB) return valB - valA;
            return a.oldestCreatedAt - b.oldestCreatedAt;
        });
    }

    // Sort individual items (for item view)
    let sortedItems = [...filteredItems];
    if (sortBy === 'oldest') {
        sortedItems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'newest') {
        sortedItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'urgent') {
        const valItem = (item) => {
            const urgency = getUrgency(item);
            if (urgency === 'critical') return 3;
            if (urgency === 'warning') return 2;
            return 1;
        };
        sortedItems.sort((a, b) => {
            const valA = valItem(a);
            const valB = valItem(b);
            if (valA !== valB) return valB - valA;
            return new Date(a.created_at) - new Date(b.created_at);
        });
    }

    const criticalCount = items.filter(i => getUrgency(i) === 'critical').length;
    const warningCount = items.filter(i => getUrgency(i) === 'warning').length;

    // Calculate aggregated totals of active items (pending/preparing)
    const itemTotals = filteredItems.reduce((acc, item) => {
        const name = item.menu?.name || 'Unknown';
        acc[name] = (acc[name] || 0) + item.quantity;
        return acc;
    }, {});

    // Sort item totals by quantity descending, then alphabetically by name
    const sortedItemTotals = Object.entries(itemTotals).sort((a, b) => {
        if (b[1] !== a[1]) {
            return b[1] - a[1];
        }
        return a[0].localeCompare(b[0]);
    });

    return (
        <AuthenticatedLayout>
            <Head title="Kitchen Display System" />
            
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes pulseSlow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.85; transform: scale(0.995); }
                }
                .animate-pulse-slow {
                    animation: pulseSlow 3s infinite ease-in-out;
                }
                @keyframes spinSlow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spinSlow 8s linear infinite;
                }
            `}</style>

            <div className={wrapperClass}>
                {/* Header Panel */}
                <div className={`p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl backdrop-blur-md border ${
                    theme === 'dark' 
                        ? 'bg-slate-900/40 border-slate-800 shadow-slate-950/20' 
                        : 'bg-white/80 border-slate-200 shadow-slate-200/10'
                }`}>
                    <div>
                        <h1 className={`text-2xl font-black tracking-tight bg-clip-text bg-gradient-to-r ${
                            theme === 'dark' 
                                ? 'from-white via-slate-200 to-slate-400 text-white' 
                                : 'from-slate-900 via-slate-800 to-slate-700 text-slate-900'
                        }`}>Kitchen Display System</h1>
                        <p className={`text-xs mt-1 font-semibold ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>Live order preparation tracking</p>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* View Mode Toggle */}
                        <div className={`flex p-1 rounded-xl border ${
                            theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-200/60 border-slate-300'
                        }`}>
                            <button
                                onClick={() => { setViewMode('order'); localStorage.setItem('kds_view_mode', 'order'); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                                    viewMode === 'order' 
                                        ? (theme === 'dark' ? 'bg-slate-800 text-white shadow-md shadow-slate-950/50' : 'bg-white text-slate-900 shadow-md') 
                                        : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                                }`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Order View
                            </button>
                            <button
                                onClick={() => { setViewMode('item'); localStorage.setItem('kds_view_mode', 'item'); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                                    viewMode === 'item' 
                                        ? (theme === 'dark' ? 'bg-slate-800 text-white shadow-md shadow-slate-950/50' : 'bg-white text-slate-900 shadow-md') 
                                        : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
                                }`}
                            >
                                <Coffee className="w-3.5 h-3.5" />
                                Item View
                            </button>
                        </div>
 
                        {/* Status Badges */}
                        <div className="flex items-center gap-2.5">
                            {criticalCount > 0 && (
                                <div className={`flex items-center px-4 py-2 rounded-xl border shadow-lg animate-pulse ${
                                    theme === 'dark' 
                                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-rose-950/20' 
                                        : 'bg-rose-50 border-rose-200 text-rose-700 shadow-rose-100/20'
                                }`}>
                                    <Flame className={`w-3.5 h-3.5 mr-1.5 ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`} />
                                    <span className="text-xs font-bold">{criticalCount} Critical</span>
                                </div>
                            )}
                            {warningCount > 0 && (
                                <div className={`flex items-center px-4 py-2 rounded-xl border shadow-lg ${
                                    theme === 'dark' 
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-amber-950/20' 
                                        : 'bg-amber-50 border-amber-250 text-amber-800 shadow-amber-100/20'
                                }`}>
                                    <AlertTriangle className={`w-3.5 h-3.5 mr-1.5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                                    <span className="text-xs font-bold">{warningCount} Overdue</span>
                                </div>
                            )}
                            
                            {/* Theme Toggle Button */}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-xl border shadow-lg transition-all active:scale-95 flex items-center justify-center ${
                                    theme === 'dark' 
                                        ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-400 border-slate-700' 
                                        : 'bg-white hover:bg-slate-100 text-blue-600 border-slate-200'
                                }`}
                                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            <div className={`flex items-center px-4 py-2 rounded-xl border shadow-lg transition-all ${
                                theme === 'dark' 
                                    ? 'bg-slate-800/80 border-slate-700 text-slate-200' 
                                    : 'bg-white border-slate-200 text-slate-700'
                            }`}>
                                <Clock className={`w-3.5 h-3.5 mr-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                                <span className="text-xs font-bold">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
 
                {/* Filters & Sorting Panel */}
                <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between backdrop-blur-md p-4 rounded-2xl shadow-lg border ${
                    theme === 'dark' 
                        ? 'bg-slate-900/20 border-slate-800' 
                        : 'bg-white/60 border-slate-200'
                }`}>
                    <div className="relative w-full sm:w-80">
                        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                        <input
                            type="text"
                            placeholder="Search table, order, or item..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-8 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium ${
                                theme === 'dark' 
                                    ? 'bg-slate-950/60 border-slate-800 text-slate-200 placeholder-slate-500' 
                                    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                            }`}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
                                    theme === 'dark' ? 'text-slate-500 hover:text-slate-350' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        <span className={`text-xs font-semibold flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            <ArrowUpDown className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} /> Sort:
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={`border rounded-xl py-2 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold cursor-pointer transition-all ${
                                theme === 'dark' 
                                    ? 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700' 
                                    : 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
                            }`}
                        >
                            <option value="oldest">Oldest First (FIFO)</option>
                            <option value="newest">Newest First</option>
                            <option value="urgent">Urgency First</option>
                        </select>
                    </div>
                </div>
 
                {/* Horizontal Item Quantities Aggregation Bar */}
                {sortedItemTotals.length > 0 && (
                    <div className={`backdrop-blur-md border p-4 rounded-2xl shadow-lg flex flex-col gap-3 ${
                        theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white/80 border-slate-200 shadow-slate-200/10'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                theme === 'dark' ? 'text-slate-400' : 'text-slate-550'
                            }`}>
                                <Coffee className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-blue-400 animate-pulse' : 'text-blue-500'}`} />
                                Active Item Quantities (Pending / Preparing)
                            </span>
                            <span className={`text-[10px] border px-2.5 py-1 rounded-xl font-extrabold shadow-inner ${
                                theme === 'dark' 
                                    ? 'bg-slate-950/60 border-slate-800 text-slate-300' 
                                    : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                                {Object.values(itemTotals).reduce((a, b) => a + b, 0)} Total Items
                            </span>
                        </div>
                        <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                            {sortedItemTotals.map(([name, qty]) => (
                                <div 
                                    key={name} 
                                    className={`flex items-center gap-3 px-4 py-2.5 border rounded-xl transition-all duration-200 shadow-md flex-shrink-0 ${
                                        theme === 'dark' 
                                            ? 'bg-slate-950/50 hover:bg-slate-950/80 border-slate-800/60 hover:border-slate-700/80' 
                                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                                    }`}
                                >
                                    <span className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{name}</span>
                                    <span className={`border px-2.5 py-0.5 rounded-lg text-xs font-black min-w-[24px] text-center shadow-inner ${
                                        theme === 'dark'
                                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                        {qty}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* KDS Main Grid */}
                {viewMode === 'order' ? (
                    /* Grouped Order View */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {sortedOrders.length === 0 ? (
                            <div className={`md:col-span-2 xl:col-span-3 2xl:col-span-4 flex flex-col items-center justify-center py-32 rounded-2xl backdrop-blur-md border ${
                                theme === 'dark' 
                                    ? 'bg-slate-900/20 border-slate-800/80' 
                                    : 'bg-white/60 border-slate-200 shadow-sm'
                            }`}>
                                <Coffee className={`w-16 h-16 mb-4 animate-bounce ${theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}`} />
                                <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>No Active Orders</h3>
                                <p className={`text-xs mt-1.5 font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>Kitchen is all caught up!</p>
                            </div>
                        ) : (
                            sortedOrders.map(orderGroup => {
                                const pendingItems = orderGroup.items.filter(i => i.kds_status === 'pending');
                                const preparingItems = orderGroup.items.filter(i => i.kds_status === 'preparing');
                                
                                return (
                                    <div
                                        key={orderGroup.order.id}
                                        className={`flex flex-col p-5 rounded-2xl border transition-all duration-300 ${getOrderCardStyles(orderGroup)}`}
                                    >
                                        {/* Card Header */}
                                        <div className={`flex justify-between items-start border-b pb-3 mb-4 ${
                                            theme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`h-11 w-11 flex flex-col items-center justify-center rounded-xl font-black text-sm border shadow-inner flex-shrink-0 transition-colors ${
                                                    getOrderUrgency(orderGroup) === 'critical' 
                                                        ? (theme === 'dark' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-700 border-rose-200') 
                                                        : getOrderUrgency(orderGroup) === 'warning'
                                                        ? (theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-250')
                                                        : (theme === 'dark' ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200')
                                                }`}>
                                                    {orderGroup.order.table?.table_number ? (
                                                        <span>{orderGroup.order.table.table_number}</span>
                                                    ) : (
                                                        <span className="text-[10px] uppercase">{orderGroup.order.order_type?.substring(0,4) || 'TKW'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <p className={`text-[10px] font-black uppercase tracking-wider leading-none ${
                                                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                                        }`}>
                                                            Order #{orderGroup.order.order_number || orderGroup.order.id.toString().slice(-8)}
                                                        </p>
                                                        <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase border tracking-wider leading-none ${
                                                            orderGroup.order.status === 'completed' 
                                                                ? (theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200') 
                                                                : (theme === 'dark' ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' : 'bg-rose-50 text-rose-700 border-rose-200')
                                                        }`}>
                                                            {orderGroup.order.status === 'completed' ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                        <span className={`px-2 py-0.5 border text-[8px] font-black rounded uppercase tracking-wider leading-none ${
                                                            theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' : 'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}>
                                                            {orderGroup.order.order_type || 'Dine-In'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                        <span className={`font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Wait:</span>
                                                        <span className={`font-black text-sm tracking-wide ${
                                                            getOrderUrgency(orderGroup) === 'critical' 
                                                                ? (theme === 'dark' ? 'text-rose-400 animate-pulse' : 'text-rose-700 animate-pulse') 
                                                                : getOrderUrgency(orderGroup) === 'warning' 
                                                                ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-700') 
                                                                : (theme === 'dark' ? 'text-slate-200' : 'text-slate-750')
                                                        }`}>
                                                            {formatDuration(orderGroup.oldestCreatedAt, currentTime)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setSelectedOrder(orderGroup.order)}
                                                    className={`p-2 rounded-xl transition-all ${
                                                        theme === 'dark' ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                                                    }`}
                                                    title="View Details"
                                                >
                                                    <Info className="w-4.5 h-4.5" />
                                                </button>
                                                {getOrderUrgency(orderGroup) === 'critical' && (
                                                    <Flame className={`w-5 h-5 animate-pulse ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`} />
                                                )}
                                                {getOrderUrgency(orderGroup) === 'warning' && (
                                                    <AlertTriangle className={`w-5 h-5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Body (Item List) */}
                                        <div className="flex-1 space-y-2.5 mb-4">
                                            {orderGroup.items.map((item) => {
                                                const urgency = getUrgency(item);
                                                const startRef = item.started_at || item.created_at;
                                                const isCooking = item.kds_status === 'preparing';
                                                const isScheduled = !!item.order.scheduled_at;
                                                const scheduledTime = isScheduled ? new Date(item.order.scheduled_at.replace(' ', 'T')) : null;
                                                const isActionable = !isScheduled || (scheduledTime - currentTime <= 15 * 60000);
                                                
                                                return (
                                                    <div 
                                                        key={item.id} 
                                                        className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                                                            isCooking 
                                                                ? (theme === 'dark' ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50/30') 
                                                                : urgency === 'critical' 
                                                                ? (theme === 'dark' ? 'border-rose-500/20 bg-rose-500/5' : 'border-rose-200 bg-rose-50/30')
                                                                : urgency === 'warning'
                                                                ? (theme === 'dark' ? 'border-amber-500/15 bg-amber-500/5' : 'border-amber-200 bg-amber-50/30')
                                                                : (theme === 'dark' ? 'border-slate-800 bg-slate-900/20 hover:bg-slate-950/40' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50')
                                                        }`}
                                                    >
                                                        <div className="flex gap-3 flex-1 min-w-0">
                                                            {/* Menu Item Image */}
                                                            <div className={`w-12 h-12 rounded-lg border overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-inner ${
                                                                theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'
                                                            }`}>
                                                                {item.menu?.image_url ? (
                                                                    <img 
                                                                        src={item.menu.image_url} 
                                                                        alt={item.menu.name} 
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <Coffee className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}`} />
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={`text-xs sm:text-sm font-bold leading-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                                                                    <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-extrabold mr-1.5`}>{item.quantity}x</span> 
                                                                    {item.menu?.name}
                                                                </h4>
                                                                {item.addons && item.addons.length > 0 && (
                                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                                        {item.addons.map((adn, idx) => (
                                                                            <span key={idx} className={`text-[10px] font-bold ${theme === 'dark' ? 'text-brand-400' : 'text-brand-600'}`}>
                                                                                + {adn.pivot?.addon_name || adn.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                    {item.order.scheduled_at ? (
                                                                        <span className="text-purple-400 flex items-center gap-1 font-bold">
                                                                            <CalendarClock className="w-3 h-3" />
                                                                            Sch: {new Date(item.order.scheduled_at.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="flex items-center gap-1">
                                                                            {isCooking ? 'Cooking:' : 'Wait:'} 
                                                                            <span className={`font-extrabold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{formatDuration(startRef, currentTime)}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Inline Actions */}
                                                        <div className="ml-2 flex-shrink-0">
                                                            {item.kds_status === 'pending' && (
                                                                <button
                                                                    onClick={() => updateStatus(item.id, 'preparing')}
                                                                    disabled={!isActionable}
                                                                    className={`p-2 rounded-xl border text-xs font-bold shadow-md transition-all flex items-center justify-center ${
                                                                        isActionable 
                                                                            ? 'bg-blue-600 hover:bg-blue-500 border-blue-600 text-white hover:scale-105 active:scale-95 shadow-blue-900/25' 
                                                                            : (theme === 'dark' ? 'bg-slate-800 text-slate-500 border-slate-750 cursor-not-allowed opacity-40' : 'bg-slate-150 text-slate-400 border-slate-200 cursor-not-allowed opacity-40')
                                                                    }`}
                                                                    title={isActionable ? "Start Cooking" : `Starts at ${new Date(scheduledTime.getTime() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                                                >
                                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                                </button>
                                                            )}
                                                            {item.kds_status === 'preparing' && (
                                                                <button
                                                                    onClick={() => updateStatus(item.id, 'ready')}
                                                                    className="p-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-600 text-white rounded-xl shadow-md shadow-emerald-950/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                                                                    title="Mark Ready"
                                                                >
                                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Card Footer (Bulk Actions) */}
                                        <div className={`flex gap-2.5 pt-4 border-t mt-auto ${
                                            theme === 'dark' ? 'border-slate-800/80' : 'border-slate-200'
                                        }`}>
                                            {pendingItems.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        const itemIds = pendingItems.map(i => i.id);
                                                        updateBulkStatus(itemIds, 'preparing');
                                                    }}
                                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 border ${
                                                        theme === 'dark' 
                                                            ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white border-blue-500/25 hover:border-blue-500/40' 
                                                            : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                    Prepare All ({pendingItems.length})
                                                </button>
                                            )}
                                            {(preparingItems.length > 0 || pendingItems.length > 0) && (
                                                <button
                                                    onClick={() => {
                                                        const itemIds = [...preparingItems, ...pendingItems].map(i => i.id);
                                                        updateBulkStatus(itemIds, 'ready');
                                                    }}
                                                    className={`flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-emerald-600 shadow-lg ${
                                                        theme === 'dark' ? 'shadow-emerald-950/20 hover:shadow-emerald-600/20' : 'shadow-emerald-200/20 hover:shadow-emerald-600/10'
                                                    }`}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Ready All ({preparingItems.length + pendingItems.length})
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* Original Item View (with Sorting, Search, and polished aesthetics) */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {sortedItems.length === 0 ? (
                            <div className={`md:col-span-2 xl:col-span-3 2xl:col-span-4 flex flex-col items-center justify-center py-32 rounded-2xl backdrop-blur-md border ${
                                theme === 'dark' 
                                    ? 'bg-slate-900/20 border-slate-800/80' 
                                    : 'bg-white/60 border-slate-200 shadow-sm'
                            }`}>
                                <Coffee className={`w-16 h-16 mb-4 animate-bounce ${theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}`} />
                                <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>No Active Items</h3>
                                <p className={`text-xs mt-1.5 font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>Kitchen is all caught up!</p>
                            </div>
                        ) : (
                            sortedItems.map(item => {
                                const urgency = getUrgency(item);
                                const startRef = item.started_at || item.created_at;
                                const isCooking = item.kds_status === 'preparing';
                                
                                return (
                                    <div
                                        key={item.id}
                                        className={`flex flex-col p-5 rounded-2xl border transition-all duration-300 ${getCardStyles(item)}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 min-w-[40px] px-1 flex flex-col items-center justify-center rounded-xl font-black border shadow-inner transition-colors ${
                                                    urgency === 'critical'
                                                        ? (theme === 'dark' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-200')
                                                        : urgency === 'warning'
                                                        ? (theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-900 border-amber-200')
                                                        : (theme === 'dark' ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200')
                                                }`}>
                                                    {item.order.table?.table_number ? (
                                                        <span className="text-xs font-extrabold">{item.order.table.table_number}</span>
                                                    ) : (
                                                        <span className="text-[9px] uppercase">{item.order.order_type?.substring(0,4) || 'TKW'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <p className={`text-[10px] font-black uppercase tracking-wider leading-none ${
                                                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                                        }`}>
                                                            Order #{item.order.order_number || item.order.id.toString().slice(-8)}
                                                        </p>
                                                        {getElapsedMins(item.created_at, currentTime) < 1 && (
                                                            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-black rounded uppercase animate-bounce leading-none">New</span>
                                                        )}
                                                        <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase border tracking-wider leading-none ${
                                                            item.order.status === 'completed' 
                                                                ? (theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200') 
                                                                : (theme === 'dark' ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' : 'bg-rose-50 text-rose-700 border-rose-200')
                                                        }`}>
                                                            {item.order.status === 'completed' ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                        <span className={`px-2 py-0.5 border text-[8px] font-black rounded uppercase tracking-wider leading-none ${
                                                            theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' : 'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}>
                                                            {item.order.order_type || 'Dine-In'}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs font-bold mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        Placed at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setSelectedOrder(item.order)}
                                                    className={`p-1.5 rounded-lg transition-all ${
                                                        theme === 'dark' ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                                                    }`}
                                                    title="Details"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase border ${getStatusColor(item.kds_status)}`}>
                                                    {item.kds_status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 mb-4 flex items-start gap-4">
                                            {/* Image Thumbnail */}
                                            <div className={`flex-shrink-0 w-16 h-16 rounded-xl border overflow-hidden flex items-center justify-center relative shadow-inner ${
                                                urgency === 'critical' ? 'border-rose-500/30' : (theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100')
                                            }`}>
                                                {item.menu?.image_url ? (
                                                    <img 
                                                        src={item.menu.image_url} 
                                                        alt={item.menu.name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className={`absolute inset-0 bg-gradient-to-br flex items-center justify-center ${
                                                        theme === 'dark' ? 'from-slate-900 to-slate-950' : 'from-slate-50 to-slate-100'
                                                    }`}>
                                                        <Coffee className={`w-6 h-6 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}`} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`text-sm sm:text-base font-extrabold leading-tight mb-2 line-clamp-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-black mr-1`}>{item.quantity}x</span> {item.menu?.name}
                                                </h3>
                                                
                                                {item.addons && item.addons.length > 0 && (
                                                    <div className="flex flex-col gap-0.5 mb-2.5">
                                                        {item.addons.map((adn, idx) => (
                                                            <span key={idx} className={`text-[10px] font-bold ${theme === 'dark' ? 'text-brand-400' : 'text-brand-600'}`}>
                                                                + {adn.pivot?.addon_name || adn.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Timer Badge */}
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold ${item.order.scheduled_at ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : getTimerStyles(item)}`}>
                                                    {item.order.scheduled_at ? (
                                                        <CalendarClock className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                                    ) : urgency === 'critical' ? (
                                                        <Flame className={`w-3.5 h-3.5 animate-pulse ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`} />
                                                    ) : isCooking ? (
                                                        <Timer className={`w-3.5 h-3.5 animate-spin-slow ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                                                    ) : (
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    )}
                                                    {item.order.scheduled_at ? (
                                                        <span>
                                                            Scheduled: {new Date(item.order.scheduled_at.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="opacity-75">{isCooking ? 'Cooking:' : 'Wait:'}</span>
                                                            <span className={`font-extrabold text-[11px] ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{formatDuration(startRef, currentTime)}</span>
                                                            {urgency === 'critical' && <span className={`font-bold animate-ping ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>!</span>}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        {(() => {
                                            const isScheduled = !!item.order.scheduled_at;
                                            const scheduledTime = isScheduled ? new Date(item.order.scheduled_at.replace(' ', 'T')) : null;
                                            const isActionable = !isScheduled || (scheduledTime - currentTime <= 15 * 60000);
                                            
                                            return (
                                                <div>
                                                    {item.kds_status === 'pending' && (
                                                        <button
                                                            onClick={() => updateStatus(item.id, 'preparing')}
                                                            disabled={!isActionable}
                                                            className={`w-full py-3 rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center ${
                                                                isActionable 
                                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 hover:shadow-blue-600/20' 
                                                                    : (theme === 'dark' ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50' : 'bg-slate-150 text-slate-450 border border-slate-200 cursor-not-allowed opacity-50')
                                                            }`}
                                                        >
                                                            {isActionable ? (
                                                                <><Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Start Preparing</>
                                                            ) : (
                                                                <><Clock className="w-3.5 h-3.5 mr-1.5" /> Starts at {new Date(scheduledTime.getTime() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                                            )}
                                                        </button>
                                                    )}
                                                    {item.kds_status === 'preparing' && (
                                                        <button
                                                            onClick={() => updateStatus(item.id, 'ready')}
                                                            className={`w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center border border-emerald-600 shadow-lg ${
                                                                theme === 'dark' ? 'shadow-emerald-950/20 hover:shadow-emerald-600/20' : 'shadow-emerald-250/30 hover:shadow-emerald-600/10'
                                                            }`}
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                                            Mark as Ready
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Detailed Order Drawer */}
            {selectedOrder && (
                <>
                    {/* Backdrop */}
                    <div 
                        onClick={() => setSelectedOrder(null)}
                        className={`fixed inset-0 backdrop-blur-md z-50 transition-opacity duration-300 ${
                            theme === 'dark' ? 'bg-slate-950/60' : 'bg-slate-900/40'
                        }`}
                    />
                    
                    {/* Drawer Panel */}
                    <div className={`fixed right-0 top-0 bottom-0 w-full max-w-md shadow-2xl z-50 flex flex-col transition-all duration-300 animate-slide-in-right border-l ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 text-slate-850'
                    }`}>
                        {/* Header */}
                        <div className={`p-5 border-b flex justify-between items-center ${
                            theme === 'dark' ? 'border-slate-800/80 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
                        }`}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                        Order {selectedOrder.order_number || selectedOrder.id.toString().slice(-8)}
                                    </h2>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${selectedOrder.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {selectedOrder.status === 'completed' ? 'Paid' : 'Unpaid'}
                                    </span>
                                </div>
                                <p className={`text-xs mt-1.5 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    Placed at: {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({new Date(selectedOrder.created_at).toLocaleDateString()})
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className={`p-2 rounded-xl transition-all ${
                                    theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Scrollable details */}
                        <div className={`flex-1 overflow-y-auto p-5 space-y-5 ${
                            theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'
                        }`}>
                            {/* Status & Service Details */}
                            <div className={`p-4 rounded-2xl space-y-4 border ${
                                theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                            }`}>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <span className="text-slate-500 block font-semibold">Table</span>
                                        <span className={`font-extrabold text-sm mt-0.5 block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {selectedOrder.table?.table_number ? `Table ${selectedOrder.table.table_number}` : 'Drive-Thru / Takeaway'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block font-semibold">Order Type</span>
                                        <span className={`font-extrabold text-sm uppercase mt-0.5 block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {selectedOrder.order_type || 'Dine-In'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block font-semibold">Waiter / Server</span>
                                        <span className={`font-extrabold flex items-center gap-1 mt-0.5 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                            <User className="w-3.5 h-3.5 text-slate-500" />
                                            {selectedOrder.waiter?.name || 'Self-Order'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block font-semibold">Customer</span>
                                        <span className={`font-extrabold text-sm mt-0.5 block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {selectedOrder.customer?.name || 'Walk-in Guest'}
                                        </span>
                                    </div>
                                </div>
                                
                                {selectedOrder.notes && (
                                    <div className={`pt-3 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Special Preparation Instructions:</span>
                                        <p className={`text-xs font-bold mt-1.5 p-2.5 rounded-xl border ${
                                            theme === 'dark' 
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' 
                                                : 'bg-amber-50 border-amber-200 text-amber-800'
                                        }`}>
                                            {selectedOrder.notes}
                                        </p>
                                    </div>
                                )}
 
                                {selectedOrder.car_plate && (
                                    <div className={`pt-3 border-t grid grid-cols-2 gap-2 text-xs ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Car Plate</span>
                                            <span className={`font-extrabold mt-0.5 block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-805'}`}>{selectedOrder.car_plate}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block font-semibold">Car Description</span>
                                            <span className={`font-extrabold mt-0.5 block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-805'}`}>{selectedOrder.car_description}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
 
                            {/* Active items inside KDS for this order */}
                            <div>
                                <h3 className={`text-xs font-black uppercase tracking-wider mb-2.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-505'}`}>Items currently cooking / pending</h3>
                                <div className="space-y-2.5">
                                    {items.filter(i => i.order_id === selectedOrder.id).map(item => (
                                        <div key={item.id} className={`flex justify-between items-center border p-3 rounded-xl ${
                                            theme === 'dark' ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50'
                                        }`}>
                                            <div>
                                                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                                    <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-extrabold mr-1.5`}>{item.quantity}x</span>
                                                    {item.menu?.name}
                                                </span>
                                                {item.addons && item.addons.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.addons.map((a, idx) => (
                                                            <span key={idx} className="text-[9px] bg-brand-500/10 text-brand-400 px-1.5 py-0.5 rounded font-bold border border-brand-500/20">
                                                                + {a.pivot?.addon_name || a.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                                                item.kds_status === 'preparing' 
                                                    ? (theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' : 'bg-blue-50 text-blue-700 border-blue-200') 
                                                    : (theme === 'dark' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' : 'bg-amber-50 text-amber-700 border-amber-200')
                                            }`}>
                                                {item.kds_status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Drawer Footer Actions */}
                        <div className={`p-5 border-t flex gap-3 ${
                            theme === 'dark' ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
                        }`}>
                            <a
                                href={route('orders.receipt', selectedOrder.id)}
                                target="_blank"
                                className={`flex-1 py-3 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 border ${
                                    theme === 'dark' 
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                Print Receipt
                            </a>
                            <button
                                onClick={() => {
                                    const activeItemIds = items.filter(i => i.order_id === selectedOrder.id).map(i => i.id);
                                    if (activeItemIds.length > 0) {
                                        updateBulkStatus(activeItemIds, 'ready');
                                        setSelectedOrder(null);
                                    }
                                }}
                                className={`flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-1.5 border border-emerald-600 ${
                                    theme === 'dark' ? 'shadow-emerald-950/20' : 'shadow-emerald-250/20 shadow-emerald-500/5'
                                }`}
                            >
                                <Check className="w-4 h-4 stroke-[3]" />
                                Complete Order
                            </button>
                        </div>
                    </div>
                </>
            )}
        </AuthenticatedLayout>
    );
}
