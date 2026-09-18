import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router, Deferred } from '@inertiajs/react';
import {
    FileText, Calendar, ShoppingBag, Coffee, ArrowLeft, FileDown,
    Search, ChevronLeft, ChevronRight, CreditCard, TrendingUp,
    Hash, BadgeDollarSign, Trophy, Clock, Timer, Percent,
    Table as TableIcon, ChevronDown, X, Filter, Banknote,
    Tag, BarChart3, CheckCircle2, Utensils, Coins, ArrowDownRight, ArrowUpRight, Wallet
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtCurrency = (amount, currency) =>
    `${currency} ${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (dateString) =>
    new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        .format(new Date(dateString));

const fmtDuration = (mins) => {
    if (!mins || mins === 0) return 'N/A';
    const h = Math.floor(mins / 60), m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtHour = (hour) => {
    if (hour === null || hour === undefined) return 'N/A';
    const h = parseInt(hour), ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 === 0 ? 12 : h % 12}:00 ${ampm}`;
};

const calcDuration = (start, end) => {
    if (!start || !end) return '-';
    return fmtDuration(Math.max(0, Math.floor((new Date(end) - new Date(start)) / 60000)));
};

// ─── Period Presets ───────────────────────────────────────────────────────────
const PERIODS = [
    { value: 'today',     label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week',      label: 'This Week' },
    { value: 'month',     label: 'This Month' },
    { value: 'custom',    label: 'Custom' },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, bg }) {
    return (
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} ${color}`}>
                <Icon className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{title}</p>
            <p className="text-base font-black text-gray-900 leading-tight">{value}</p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReportIndex({ orders, filters, stats, top_items, table_sales, payment_sales, counter_transactions, all_tables, all_menus }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || 'रू.';

    // Filter state — initialised from server-returned filters
    const [period, setPeriod]         = useState(filters.period     || 'today');
    const [startDate, setStartDate]   = useState(filters.start_date || '');
    const [endDate, setEndDate]       = useState(filters.end_date   || '');
    const [tableId, setTableId]       = useState(filters.table_id   || '');
    const [menuId, setMenuId]         = useState(filters.menu_id    || '');
    const [search, setSearch]         = useState(filters.search     || '');
    const [payment, setPayment]       = useState(filters.payment    || '');
    const [activeTab, setActiveTab]   = useState('transactions'); // 'transactions' | 'tables' | 'items' | 'payments' | 'counter_cash'

    // By Item Tab State
    const [itemSearch, setItemSearch] = useState('');
    const [itemSortBy, setItemSortBy] = useState('qty'); // 'qty' | 'revenue'
    const [itemPage, setItemPage]     = useState(1);
    const itemsPerPage = 10;

    // Counter Cash Tab State
    const [counterFilter, setCounterFilter] = useState('all'); // 'all' | 'cash_out' | 'cash_in'
    const [counterSearch, setCounterSearch] = useState('');
    const [counterPage, setCounterPage]     = useState(1);
    const counterPerPage = 15;

    // ── Item Tab Filter, Sort & Pagination ──
    const filteredTopItems = useMemo(() => {
        if (!top_items) return [];
        let list = [...top_items];
        if (itemSearch.trim()) {
            const q = itemSearch.toLowerCase().trim();
            list = list.filter(i => i.menu?.name?.toLowerCase().includes(q));
        }
        if (itemSortBy === 'revenue') {
            list.sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0));
        } else {
            list.sort((a, b) => (b.total_quantity || 0) - (a.total_quantity || 0));
        }
        return list;
    }, [top_items, itemSearch, itemSortBy]);

    const itemTotalQty = useMemo(() => (top_items || []).reduce((s, i) => s + (Number(i.total_quantity) || 0), 0), [top_items]);
    const itemTotalRev = useMemo(() => (top_items || []).reduce((s, i) => s + (Number(i.total_revenue) || 0), 0), [top_items]);
    const totalItemPages = Math.ceil(filteredTopItems.length / itemsPerPage) || 1;
    const paginatedItems = useMemo(() => {
        const start = (itemPage - 1) * itemsPerPage;
        return filteredTopItems.slice(start, start + itemsPerPage);
    }, [filteredTopItems, itemPage, itemsPerPage]);

    useEffect(() => {
        setItemPage(1);
    }, [itemSearch, itemSortBy]);

    // ── Counter Cash Filter, Search & Pagination ──
    const filteredCounterTx = useMemo(() => {
        if (!counter_transactions) return [];
        let list = [...counter_transactions];
        if (counterFilter !== 'all') {
            list = list.filter(tx => tx.type === counterFilter);
        }
        if (counterSearch.trim()) {
            const q = counterSearch.toLowerCase().trim();
            list = list.filter(tx => 
                (tx.notes && tx.notes.toLowerCase().includes(q)) ||
                (tx.category && tx.category.toLowerCase().includes(q)) ||
                (tx.user && tx.user.toLowerCase().includes(q))
            );
        }
        return list;
    }, [counter_transactions, counterFilter, counterSearch]);

    const totalCounterPages = Math.ceil(filteredCounterTx.length / counterPerPage) || 1;
    const paginatedCounterTx = useMemo(() => {
        const start = (counterPage - 1) * counterPerPage;
        return filteredCounterTx.slice(start, start + counterPerPage);
    }, [filteredCounterTx, counterPage, counterPerPage]);

    useEffect(() => {
        setCounterPage(1);
    }, [counterFilter, counterSearch]);

    // ── Apply all filters ──────────────────────────────────────────────────────
    const applyFilters = useCallback((overrides = {}) => {
        const params = {
            period:     overrides.period              ?? period,
            table_id:   (overrides.tableId  ?? tableId)  || undefined,
            menu_id:    (overrides.menuId   ?? menuId)   || undefined,
            payment:    (overrides.payment  ?? payment)  || undefined,
            search:     (overrides.search   ?? search)   || undefined,
        };
        // Only send custom dates when period === custom
        if ((overrides.period ?? period) === 'custom') {
            params.start_date = overrides.startDate ?? startDate;
            params.end_date   = overrides.endDate   ?? endDate;
        }
        router.get(route('reports.index'), params, { 
            preserveState: true, 
            preserveScroll: true, 
            replace: true,
        });
    }, [period, startDate, endDate, tableId, menuId, payment, search]);

    // ── Period chip click ──────────────────────────────────────────────────────
    const handlePeriod = (p) => {
        setPeriod(p);
        applyFilters({ period: p });
    };

    // ── Search (debounced) ─────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => applyFilters({ search }), 500);
        return () => clearTimeout(t);
    }, [search]);

    // ── Derived display period label ───────────────────────────────────────────
    const periodLabel = period === 'custom'
        ? `${startDate} → ${endDate}`
        : PERIODS.find(p => p.value === period)?.label || period;

    // ── Stats config ───────────────────────────────────────────────────────────
    const statCards = [
        { title: 'Total Revenue',   value: fmtCurrency(stats.total_revenue,   currency), icon: BadgeDollarSign, color: 'text-blue-600',    bg: 'bg-blue-50' },
        { title: 'Cash Collected',  value: fmtCurrency(stats.total_cash,      currency), icon: Banknote,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'Online Payments', value: fmtCurrency(stats.total_online,    currency), icon: CreditCard,      color: 'text-blue-600',    bg: 'bg-blue-50' },
        { title: 'Customer Due',    value: fmtCurrency(stats.total_due,       currency), icon: Clock,           color: 'text-rose-600',    bg: 'bg-rose-50' },
        { title: 'Counter Expense', value: fmtCurrency(stats.counter_cash_out,currency), icon: Coins,           color: 'text-amber-600',   bg: 'bg-amber-50' },
        { title: 'Total Tax',       value: fmtCurrency(stats.total_tax,       currency), icon: Percent,         color: 'text-purple-600',  bg: 'bg-purple-50' },
        { title: 'Discounts',       value: fmtCurrency(stats.total_discount,  currency), icon: Tag,             color: 'text-orange-600',  bg: 'bg-orange-50' },
        { title: 'Total Orders',    value: stats.total_orders,                           icon: Hash,            color: 'text-teal-600',    bg: 'bg-teal-50' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Financial Reports" />

            <div className="flex flex-col space-y-6 pb-10 w-full">

                {/* ── Header ── */}
                <div className="flex flex-col gap-5 bg-white/60 backdrop-blur-xl p-5 sm:p-7 rounded-[2.5rem] border border-white/80 shadow-sm">
                    {/* Title row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href={route('dashboard')} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-2xl transition-all shrink-0">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Financial Reports</h1>
                                <p className="mt-0.5 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-blue-400" /> {periodLabel}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const params = new URLSearchParams({
                                    period,
                                    ...(tableId && { table_id: tableId }),
                                    ...(menuId && { menu_id: menuId }),
                                    ...(payment && { payment }),
                                    ...(search && { search })
                                });
                                if (period === 'custom') {
                                    if (startDate) params.append('start_date', startDate);
                                    if (endDate) params.append('end_date', endDate);
                                }
                                window.location.href = route('reports.export') + '?' + params.toString();
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 transition-all active:scale-95 shrink-0"
                        >
                            <FileDown className="w-4 h-4" /> Download Report
                        </button>
                    </div>

                    {/* Period chips */}
                    <div className="flex overflow-x-auto sm:flex-wrap gap-2 pb-2 sm:pb-0 scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
                        {PERIODS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => handlePeriod(p.value)}
                                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                                    period === p.value
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white text-gray-500 border border-gray-100 hover:border-blue-200 hover:text-blue-600'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom date range — only when period=custom */}
                    {period === 'custom' && (
                        <div className="flex flex-wrap items-center gap-3 duration-200">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-blue-100 shadow-sm">
                                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">From</span>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                    className="bg-transparent border-none p-0 text-xs font-black text-gray-800 focus:ring-0 focus:outline-none" />
                            </div>
                            <div className="w-4 h-px bg-blue-200" />
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-blue-100 shadow-sm">
                                <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">To</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                    className="bg-transparent border-none p-0 text-xs font-black text-gray-800 focus:ring-0 focus:outline-none" />
                            </div>
                            <button
                                onClick={() => applyFilters({ period: 'custom' })}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95"
                            >
                                Apply
                            </button>
                        </div>
                    )}

                    {/* Filter row: search + table + item */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
                        {/* Search */}
                        <div className="relative col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search order #, table, or customer..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none shadow-sm transition-all"
                            />
                            {search && (
                                <button onClick={() => { setSearch(''); applyFilters({ search: '' }); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Table filter */}
                        <div className="relative col-span-1 sm:col-span-1">
                            <TableIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={tableId}
                                onChange={e => { setTableId(e.target.value); applyFilters({ tableId: e.target.value }); }}
                                className="w-full sm:min-w-[150px] pl-9 pr-8 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="">All Tables</option>
                                {all_tables?.map(t => (
                                    <option key={t.id} value={t.id}>Table {t.table_number}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Item/Menu filter */}
                        <div className="relative col-span-1 sm:col-span-1">
                            <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={menuId}
                                onChange={e => { setMenuId(e.target.value); applyFilters({ menuId: e.target.value }); }}
                                className="w-full sm:min-w-[160px] pl-9 pr-8 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="">All Menu Items</option>
                                {all_menus?.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Payment filter */}
                        <div className="relative col-span-2 sm:col-span-1">
                            <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={payment}
                                onChange={e => { setPayment(e.target.value); applyFilters({ payment: e.target.value }); }}
                                className="w-full sm:min-w-[150px] pl-9 pr-8 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="">All Payments</option>
                                <option value="cash">Cash Only</option>
                                <option value="online">Online / Card</option>
                                <option value="due">Customer Due (Credit)</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Clear all filters */}
                        {(tableId || menuId || payment || search) && (
                            <button
                                onClick={() => { setTableId(''); setMenuId(''); setPayment(''); setSearch(''); applyFilters({ tableId: '', menuId: '', payment: '', search: '' }); }}
                                className="col-span-2 sm:col-span-1 flex justify-center items-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all w-full sm:w-auto"
                            >
                                <X className="w-3 h-3" /> Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Stats Grid ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3">
                    {statCards.map((card, i) => (
                        <StatCard key={i} {...card} />
                    ))}
                </div>

                {/* ── Tab Navigation ── */}
                <div className="flex flex-wrap gap-1 bg-white/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/80 shadow-sm w-fit">
                    {[
                        { key: 'transactions', label: 'Transactions', icon: FileText },
                        { key: 'tables',       label: 'By Table',     icon: TableIcon },
                        { key: 'items',        label: 'By Item',      icon: Coffee },
                        { key: 'payments',     label: 'By Payment',   icon: Banknote },
                        { key: 'counter_cash', label: 'Counter Cash', icon: Coins },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.key
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-white'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── TRANSACTIONS TAB ── */}
                {activeTab === 'transactions' && (
                    <div className="flex flex-col gap-5">
                        <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[640px]">
                                    <thead className="bg-gray-50/60 border-b border-gray-100">
                                        <tr>
                                            {['Order', 'Table', 'Customer', 'Ordered At', 'Completed', 'Duration', 'Discount', 'Tax', 'Total', 'Payment'].map(h => (
                                                <th key={h} className="px-4 py-3.5 text-[8px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/60">
                                        {orders?.data?.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" className="py-20 text-center">
                                                    <div className="flex flex-col items-center opacity-40 gap-2">
                                                        <ShoppingBag className="w-12 h-12 text-gray-300" />
                                                        <p className="text-sm font-bold text-gray-400">No transactions for this period</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            orders?.data?.map(order => (
                                                <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className="font-black text-blue-600 text-xs">{order.display_number || order.order_number || `#${order.id}`}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs font-bold text-gray-700">Table {order.table?.table_number}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-xs font-bold text-gray-500">{order.customer?.name || '—'}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-[11px] font-bold text-gray-700 whitespace-nowrap">{fmtDate(order.created_at)}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-[11px] font-bold text-emerald-600 whitespace-nowrap">{fmtDate(order.updated_at)}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-[11px] font-black text-blue-500">{calcDuration(order.created_at, order.updated_at)}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-[11px] font-bold text-rose-500">{fmtCurrency(order.discount_amount || 0, currency)}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-[11px] font-bold text-amber-600">{fmtCurrency(order.tax_amount || 0, currency)}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm font-black text-gray-900 whitespace-nowrap">{fmtCurrency(order.grand_total, currency)}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col gap-0.5">
                                                                {Number(order.cash_amount) > 0 && <span className="text-[10px] font-bold text-emerald-600">Cash: {fmtCurrency(order.cash_amount, currency)}</span>}
                                                                {Number(order.online_amount) > 0 && <span className="text-[10px] font-bold text-blue-600">Online: {fmtCurrency(order.online_amount, currency)}</span>}
                                                                {Math.max(0, order.grand_total - (order.cash_amount || 0) - (order.online_amount || 0)) > 0.01 && (
                                                                    <span className="text-[10px] font-bold text-rose-500">Due: {fmtCurrency(Math.max(0, order.grand_total - (order.cash_amount || 0) - (order.online_amount || 0)), currency)}</span>
                                                                )}
                                                                {Number(order.cash_amount) === 0 && Number(order.online_amount) === 0 && Math.max(0, order.grand_total) === 0 && (
                                                                    <span className="text-[10px] font-bold text-gray-500">No Payment</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {(orders?.last_page ?? 0) > 1 && (
                            <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/80 shadow-sm">
                                <p className="text-xs font-bold text-gray-400">
                                    Showing <span className="text-blue-600">{orders.from}–{orders.to}</span> of <span className="text-blue-600">{orders.total}</span>
                                </p>
                                <div className="flex gap-1.5 flex-wrap">
                                    {orders.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                link.active
                                                    ? 'bg-blue-600 text-white shadow shadow-blue-500/30'
                                                    : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                                            } ${!link.url && 'opacity-30 pointer-events-none'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── BY TABLE TAB ── */}
                {activeTab === 'tables' && (
                    <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-white/40">
                            <h2 className="text-lg font-black text-gray-900">Sales by Table</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Revenue generated per table · {periodLabel}</p>
                        </div>
                        {table_sales ? (
                            <>
                                {/* Visual bar chart */}
                                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    <Deferred data="table_sales" fallback={<div className="col-span-full py-10 text-center text-xs font-bold text-gray-400 animate-pulse">Loading table sales...</div>}>
                                        {table_sales?.map((row, idx) => {
                                            const max = table_sales[0]?.total_revenue || 1;
                                            const pct = Math.round((row.total_revenue / max) * 100);
                                            return (
                                                <button
                                                    key={row.table_id}
                                                    onClick={() => { setTableId(String(row.table_id)); setActiveTab('transactions'); applyFilters({ tableId: String(row.table_id) }); }}
                                                    className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                                                                idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                                idx === 1 ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                                                                idx === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                                            'bg-blue-50 text-blue-600 border border-blue-100'
                                                            }`}>
                                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : row.table_number}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-gray-900">Table {row.table_number}</p>
                                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{row.order_count} orders</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-black text-emerald-600">{fmtCurrency(row.total_revenue, currency)}</p>
                                                            <p className="text-[9px] font-bold text-gray-400">avg {fmtCurrency(row.avg_order_value, currency)}</p>
                                                        </div>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                                                        Click to filter transactions →
                                                    </p>
                                                </button>
                                            );
                                        })}
                                        {table_sales?.length === 0 && (
                                            <div className="col-span-full py-20 flex flex-col items-center opacity-40 gap-2">
                                                <TableIcon className="w-12 h-12 text-gray-300" />
                                                <p className="text-sm font-bold text-gray-400">No table data for this period</p>
                                            </div>
                                        )}
                                    </Deferred>
                                </div>

                                {/* Summary totals footer */}
                                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-wrap gap-6">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Tables Active</p>
                                        <p className="text-lg font-black text-gray-900">{table_sales?.length || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Orders</p>
                                        <p className="text-lg font-black text-gray-900">{table_sales?.reduce((s, r) => s + parseInt(r.order_count), 0) || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Combined Revenue</p>
                                        <p className="text-lg font-black text-emerald-600">{fmtCurrency(stats.total_revenue, currency)}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="py-20 flex flex-col items-center opacity-40 gap-2">
                                <TableIcon className="w-12 h-12 text-gray-300" />
                                <p className="text-sm font-bold text-gray-400">Loading table data...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── BY ITEM TAB ── */}
                {activeTab === 'items' && (
                    <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                        {/* Header & Controls */}
                        <div className="p-5 border-b border-gray-100 bg-white/40 flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black text-gray-900">Sales by Item</h2>
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100">
                                            {filteredTopItems.length} items
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        All items by quantity sold & revenue · {periodLabel}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-gray-500 bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100 shrink-0">
                                    <div>
                                        <span className="text-[9px] text-gray-400 uppercase block font-black">Total Sold</span>
                                        <span className="text-gray-900 font-black">{itemTotalQty} units</span>
                                    </div>
                                    <div className="w-px h-6 bg-gray-200" />
                                    <div>
                                        <span className="text-[9px] text-gray-400 uppercase block font-black">Item Revenue</span>
                                        <span className="text-emerald-600 font-black">{fmtCurrency(itemTotalRev, currency)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Search & Sort Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search sold items..."
                                        value={itemSearch}
                                        onChange={(e) => setItemSearch(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none shadow-sm transition-all"
                                    />
                                    {itemSearch && (
                                        <button
                                            onClick={() => setItemSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 mr-1">Sort By:</span>
                                    <button
                                        type="button"
                                        onClick={() => setItemSortBy('qty')}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                            itemSortBy === 'qty'
                                                ? 'bg-blue-600 text-white shadow shadow-blue-500/25'
                                                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                        }`}
                                    >
                                        Quantity
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setItemSortBy('revenue')}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                            itemSortBy === 'revenue'
                                                ? 'bg-blue-600 text-white shadow shadow-blue-500/25'
                                                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                        }`}
                                    >
                                        Revenue
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="p-5 space-y-3">
                            <Deferred data="top_items" fallback={<div className="py-10 text-center text-xs font-bold text-gray-400 animate-pulse">Loading items...</div>}>
                                {paginatedItems.map((item, idx) => {
                                    const overallIndex = (itemPage - 1) * itemsPerPage + idx;
                                    const maxVal = itemSortBy === 'revenue'
                                        ? (top_items[0]?.total_revenue || 1)
                                        : (top_items[0]?.total_quantity || 1);
                                    const currentVal = itemSortBy === 'revenue' ? item.total_revenue : item.total_quantity;
                                    const pct = Math.min(100, Math.round((currentVal / (maxVal || 1)) * 100));
                                    const rankColors = ['text-amber-600 bg-amber-50 border-amber-200', 'text-gray-500 bg-gray-100 border-gray-200', 'text-orange-600 bg-orange-50 border-orange-200'];
                                    
                                    return (
                                        <button
                                            key={item.menu_id || idx}
                                            onClick={() => { setMenuId(String(item.menu_id)); setActiveTab('transactions'); applyFilters({ menuId: String(item.menu_id) }); }}
                                            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group text-left"
                                        >
                                            {/* Rank */}
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 ${rankColors[overallIndex] || 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                                                {overallIndex < 3 ? ['🥇','🥈','🥉'][overallIndex] : `#${overallIndex + 1}`}
                                            </div>

                                            {/* Name + bar */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {item.menu?.name || 'Unknown Item'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-500 shrink-0">{item.total_quantity} sold</span>
                                                </div>
                                            </div>

                                            {/* Revenue */}
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-emerald-600">{fmtCurrency(item.total_revenue, currency)}</p>
                                                <p className="text-[9px] font-black text-gray-300 uppercase group-hover:text-blue-400 transition-colors">click to filter →</p>
                                            </div>
                                        </button>
                                    );
                                })}

                                {filteredTopItems.length === 0 && (
                                    <div className="py-20 flex flex-col items-center opacity-40 gap-2">
                                        <Coffee className="w-12 h-12 text-gray-300" />
                                        <p className="text-sm font-bold text-gray-400">
                                            {itemSearch ? `No sold items matching "${itemSearch}"` : 'No item sales recorded for this period'}
                                        </p>
                                    </div>
                                )}
                            </Deferred>
                        </div>

                        {/* Pagination Footer */}
                        {totalItemPages > 1 && (
                            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-xs font-bold text-gray-400">
                                    Showing <span className="text-blue-600 font-extrabold">{(itemPage - 1) * itemsPerPage + 1}–{Math.min(itemPage * itemsPerPage, filteredTopItems.length)}</span> of <span className="text-blue-600 font-extrabold">{filteredTopItems.length}</span> items
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        type="button"
                                        disabled={itemPage === 1}
                                        onClick={() => setItemPage(p => Math.max(1, p - 1))}
                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Prev
                                    </button>
                                    {[...Array(totalItemPages)].map((_, i) => {
                                        const p = i + 1;
                                        if (totalItemPages > 6 && Math.abs(p - itemPage) > 2 && p !== 1 && p !== totalItemPages) {
                                            if (Math.abs(p - itemPage) === 3) return <span key={p} className="px-1 text-gray-300">...</span>;
                                            return null;
                                        }
                                        return (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setItemPage(p)}
                                                className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                                                    itemPage === p
                                                        ? 'bg-blue-600 text-white shadow shadow-blue-500/25'
                                                        : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        disabled={itemPage === totalItemPages}
                                        onClick={() => setItemPage(p => Math.min(totalItemPages, p + 1))}
                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── BY PAYMENT TAB ── */}
                {activeTab === 'payments' && (
                    <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-white/40 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-gray-900">Sales by Payment Method</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                    Revenue collected by payment methods & bank accounts · {periodLabel}
                                </p>
                            </div>
                            <Banknote className="w-7 h-7 text-emerald-500" />
                        </div>

                        {/* Top Payment Channel KPIs */}
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-100/60 bg-gray-50/30">
                            <button
                                onClick={() => { setPayment('cash'); setActiveTab('transactions'); applyFilters({ payment: 'cash' }); }}
                                className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cash Collected</span>
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Banknote className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-lg font-black text-gray-900">{fmtCurrency(stats.total_cash, currency)}</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-1 group-hover:text-emerald-600 transition-colors">
                                    Click to filter cash orders →
                                </p>
                            </button>

                            <button
                                onClick={() => { setPayment('online'); setActiveTab('transactions'); applyFilters({ payment: 'online' }); }}
                                className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Online / Card</span>
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-lg font-black text-gray-900">{fmtCurrency(stats.total_online, currency)}</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-1 group-hover:text-blue-600 transition-colors">
                                    Click to filter online orders →
                                </p>
                            </button>

                            <button
                                onClick={() => { setPayment('due'); setActiveTab('transactions'); applyFilters({ payment: 'due' }); }}
                                className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm hover:border-rose-300 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Customer Credit / Due</span>
                                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-lg font-black text-gray-900">{fmtCurrency(stats.total_due, currency)}</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-1 group-hover:text-rose-600 transition-colors">
                                    Click to filter due orders →
                                </p>
                            </button>
                        </div>

                        {/* Breakdown List */}
                        <div className="p-5 space-y-3">
                            <Deferred data="payment_sales" fallback={<div className="py-10 text-center text-xs font-bold text-gray-400 animate-pulse">Loading payment methods...</div>}>
                                {payment_sales?.map((channel, idx) => {
                                    const maxRevenue = payment_sales[0]?.total_revenue || stats.total_revenue || 1;
                                    const pct = Math.min(100, Math.round((channel.total_revenue / maxRevenue) * 100));
                                    const isCash = channel.type === 'cash';
                                    const isOnline = channel.type === 'online';
                                    const isDue = channel.type === 'due';
                                    
                                    return (
                                        <button
                                            key={channel.id || idx}
                                            onClick={() => {
                                                if (channel.filter_key) {
                                                    setPayment(channel.filter_key);
                                                    setActiveTab('transactions');
                                                    applyFilters({ payment: channel.filter_key });
                                                }
                                            }}
                                            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group text-left"
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                                isCash ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                isOnline ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                isDue ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                'bg-purple-50 text-purple-600 border border-purple-100'
                                            }`}>
                                                {isCash ? <Banknote className="w-5 h-5" /> :
                                                 isOnline ? <CreditCard className="w-5 h-5" /> :
                                                 isDue ? <Clock className="w-5 h-5" /> :
                                                 <Wallet className="w-5 h-5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                        {channel.name}
                                                    </p>
                                                    <span className="text-[10px] font-extrabold text-gray-400">
                                                        ({channel.order_count} orders)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                isCash ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                                                                isOnline ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                                                isDue ? 'bg-gradient-to-r from-rose-400 to-red-500' :
                                                                'bg-gradient-to-r from-purple-400 to-pink-500'
                                                            }`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-gray-400 shrink-0">{pct}% share</span>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-emerald-600">{fmtCurrency(channel.total_revenue, currency)}</p>
                                                <p className="text-[9px] font-bold text-gray-400">avg {fmtCurrency(channel.avg_order_value, currency)}</p>
                                            </div>
                                        </button>
                                    );
                                })}

                                {payment_sales?.length === 0 && (
                                    <div className="py-20 flex flex-col items-center opacity-40 gap-2">
                                        <Banknote className="w-12 h-12 text-gray-300" />
                                        <p className="text-sm font-bold text-gray-400">No payment records found for this period</p>
                                    </div>
                                )}
                            </Deferred>
                        </div>
                    </div>
                )}

                {/* ── COUNTER CASH TAB ── */}
                {activeTab === 'counter_cash' && (
                    <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 bg-white/40 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-gray-900">Daily Counter Cash & Drawer Expenses</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                    Track counter expenses (cash out) and cash in movements · {periodLabel}
                                </p>
                            </div>
                            <Coins className="w-7 h-7 text-amber-500" />
                        </div>

                        {/* KPI Summary Cards */}
                        <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-100/60 bg-gray-50/30">
                            <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Counter Expenses (Cash Out)</span>
                                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                                </div>
                                <p className="text-lg font-black text-rose-600">{fmtCurrency(stats.counter_cash_out, currency)}</p>
                                <p className="text-[9px] font-bold text-gray-400 mt-1">
                                    {counter_transactions?.filter(t => t.type === 'cash_out').length || 0} expense entries
                                </p>
                            </div>

                            <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Counter Cash In</span>
                                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                </div>
                                <p className="text-lg font-black text-emerald-600">{fmtCurrency(stats.counter_cash_in, currency)}</p>
                                <p className="text-[9px] font-bold text-gray-400 mt-1">
                                    {counter_transactions?.filter(t => t.type === 'cash_in').length || 0} cash in entries
                                </p>
                            </div>

                            <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Net Drawer Movement</span>
                                    <Wallet className="w-4 h-4 text-blue-500" />
                                </div>
                                <p className={`text-lg font-black ${stats.counter_net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {fmtCurrency(stats.counter_net, currency)}
                                </p>
                                <p className="text-[9px] font-bold text-gray-400 mt-1">Cash in minus cash out</p>
                            </div>

                            <div className="p-4 bg-white rounded-2xl border border-purple-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Total Movements</span>
                                    <Hash className="w-4 h-4 text-purple-500" />
                                </div>
                                <p className="text-lg font-black text-gray-900">{counter_transactions?.length || 0}</p>
                                <p className="text-[9px] font-bold text-gray-400 mt-1">In selected period</p>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                                <button
                                    type="button"
                                    onClick={() => setCounterFilter('all')}
                                    className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                        counterFilter === 'all'
                                            ? 'bg-blue-600 text-white shadow shadow-blue-500/25'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    All Movements ({counter_transactions?.length || 0})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCounterFilter('cash_out')}
                                    className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                        counterFilter === 'cash_out'
                                            ? 'bg-rose-600 text-white shadow shadow-rose-500/25'
                                            : 'bg-white border border-gray-200 text-rose-600 hover:bg-rose-50'
                                    }`}
                                >
                                    Cash Out / Expenses ({counter_transactions?.filter(t => t.type === 'cash_out').length || 0})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCounterFilter('cash_in')}
                                    className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                        counterFilter === 'cash_in'
                                            ? 'bg-emerald-600 text-white shadow shadow-emerald-500/25'
                                            : 'bg-white border border-gray-200 text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                >
                                    Cash In ({counter_transactions?.filter(t => t.type === 'cash_in').length || 0})
                                </button>
                            </div>

                            <div className="relative min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search notes, category, staff..."
                                    value={counterSearch}
                                    onChange={(e) => setCounterSearch(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none shadow-sm transition-all"
                                />
                                {counterSearch && (
                                    <button
                                        onClick={() => setCounterSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Transaction Table */}
                        <div className="overflow-x-auto">
                            <Deferred data="counter_transactions" fallback={<div className="py-10 text-center text-xs font-bold text-gray-400 animate-pulse">Loading counter transactions...</div>}>
                                <table className="w-full text-left min-w-[640px]">
                                    <thead className="bg-gray-50/60 border-b border-gray-100">
                                        <tr>
                                            {['Time', 'Type', 'Category', 'Notes / Purpose', 'Recorded By', 'Session', 'Amount'].map(h => (
                                                <th key={h} className="px-4 py-3.5 text-[8px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/60">
                                        {paginatedCounterTx.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="py-20 text-center">
                                                    <div className="flex flex-col items-center opacity-40 gap-2">
                                                        <Coins className="w-12 h-12 text-gray-300" />
                                                        <p className="text-sm font-bold text-gray-400">
                                                            {counterSearch || counterFilter !== 'all' 
                                                                ? 'No counter transactions matching current filter' 
                                                                : 'No counter cash transactions recorded for this period'}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedCounterTx.map(tx => (
                                                <tr key={tx.id} className="hover:bg-blue-50/20 transition-colors">
                                                    <td className="px-4 py-3.5">
                                                        <p className="text-xs font-bold text-gray-700 whitespace-nowrap">
                                                            {tx.created_at ? fmtDate(tx.created_at) : '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {tx.type === 'cash_out' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100">
                                                                <ArrowDownRight className="w-3 h-3" /> Cash Out (Expense)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                <ArrowUpRight className="w-3 h-3" /> Cash In
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-xs font-bold text-gray-800 bg-gray-100/80 px-2.5 py-1 rounded-lg">
                                                            {tx.category || (tx.type === 'cash_out' ? 'Expense' : 'Cash In')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 max-w-xs">
                                                        <p className="text-xs font-semibold text-gray-600 line-clamp-2">
                                                            {tx.notes || '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-xs font-bold text-gray-700">{tx.user || 'Staff'}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[11px] font-bold text-gray-400">#{tx.session_id}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={`text-sm font-black whitespace-nowrap ${
                                                            tx.type === 'cash_out' ? 'text-rose-600' : 'text-emerald-600'
                                                        }`}>
                                                            {tx.type === 'cash_out' ? '-' : '+'}{fmtCurrency(tx.amount, currency)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </Deferred>
                        </div>

                        {/* Pagination Footer */}
                        {totalCounterPages > 1 && (
                            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-xs font-bold text-gray-400">
                                    Showing <span className="text-blue-600 font-extrabold">{(counterPage - 1) * counterPerPage + 1}–{Math.min(counterPage * counterPerPage, filteredCounterTx.length)}</span> of <span className="text-blue-600 font-extrabold">{filteredCounterTx.length}</span> records
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        type="button"
                                        disabled={counterPage === 1}
                                        onClick={() => setCounterPage(p => Math.max(1, p - 1))}
                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Prev
                                    </button>
                                    {[...Array(totalCounterPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            type="button"
                                            onClick={() => setCounterPage(i + 1)}
                                            className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                                                counterPage === i + 1
                                                    ? 'bg-blue-600 text-white shadow shadow-blue-500/25'
                                                    : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        disabled={counterPage === totalCounterPages}
                                        onClick={() => setCounterPage(p => Math.min(totalCounterPages, p + 1))}
                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
