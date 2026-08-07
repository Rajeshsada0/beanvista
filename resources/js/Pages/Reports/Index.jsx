import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router, Deferred } from '@inertiajs/react';
import {
    FileText, Calendar, ShoppingBag, Coffee, ArrowLeft, FileDown,
    Search, ChevronLeft, ChevronRight, CreditCard, TrendingUp,
    Hash, BadgeDollarSign, Trophy, Clock, Timer, Percent,
    Table as TableIcon, ChevronDown, X, Filter, Banknote,
    Tag, BarChart3, CheckCircle2, Utensils
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

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
export default function ReportIndex({ orders, filters, stats, top_items, table_sales, payment_sales, all_tables, all_menus }) {
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
    const [activeTab, setActiveTab]   = useState('transactions'); // 'transactions' | 'tables' | 'items' | 'payments'

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
        { title: 'Total Revenue',   value: fmtCurrency(stats.total_revenue,   currency), icon: BadgeDollarSign, color: 'text-blue-600',  bg: 'bg-blue-50' },
        { title: 'Cash Collected',  value: fmtCurrency(stats.total_cash,      currency), icon: Banknote,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'Online Payments', value: fmtCurrency(stats.total_online,    currency), icon: CreditCard,      color: 'text-blue-600',    bg: 'bg-blue-50' },
        { title: 'Customer Due',    value: fmtCurrency(stats.total_due,       currency), icon: Clock,           color: 'text-rose-600',    bg: 'bg-rose-50' },
        { title: 'Total Tax',       value: fmtCurrency(stats.total_tax,       currency), icon: Percent,         color: 'text-amber-600',   bg: 'bg-amber-50' },
        { title: 'Tips Collected',  value: fmtCurrency(stats.total_tips,      currency), icon: Trophy,          color: 'text-teal-600',    bg: 'bg-teal-50' },
        { title: 'Discounts',       value: fmtCurrency(stats.total_discount,  currency), icon: Tag,             color: 'text-orange-600',  bg: 'bg-orange-50' },
        { title: 'Total Orders',    value: stats.total_orders,                           icon: Hash,            color: 'text-purple-600',  bg: 'bg-purple-50' },
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
                <div className="flex gap-1 bg-white/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/80 shadow-sm w-fit">
                    {[
                        { key: 'transactions', label: 'Transactions', icon: FileText },
                        { key: 'tables',       label: 'By Table',     icon: TableIcon },
                        { key: 'items',        label: 'By Item',      icon: Coffee },
                        { key: 'payments',     label: 'By Payment',   icon: Banknote },
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
                        <div className="p-5 border-b border-gray-100 bg-white/40 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-gray-900">Sales by Item</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Top 10 items by quantity sold · {periodLabel}</p>
                            </div>
                            <Trophy className="w-7 h-7 text-amber-400" />
                        </div>
                        <div className="p-5 space-y-3">
                            <Deferred data="top_items" fallback={<div className="py-10 text-center text-xs font-bold text-gray-400 animate-pulse">Loading top items...</div>}>
                                {top_items?.map((item, idx) => {
                                    const max = top_items[0]?.total_quantity || 1;
                                    const pct = Math.round((item.total_quantity / max) * 100);
                                    const rankColors = ['text-amber-600 bg-amber-50 border-amber-200', 'text-gray-500 bg-gray-100 border-gray-200', 'text-orange-600 bg-orange-50 border-orange-200'];
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => { setMenuId(String(item.menu_id)); setActiveTab('transactions'); applyFilters({ menuId: String(item.menu_id) }); }}
                                            className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group text-left"
                                        >
                                            {/* Rank */}
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 ${rankColors[idx] || 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                                                {idx < 3 ? ['🥇','🥈','🥉'][idx] : `#${idx + 1}`}
                                            </div>

                                            {/* Name + bar */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{item.menu?.name}</p>
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
                                {top_items?.length === 0 && (
                                    <div className="py-20 flex flex-col items-center opacity-40 gap-2">
                                        <Coffee className="w-12 h-12 text-gray-300" />
                                        <p className="text-sm font-bold text-gray-400">No item data for this period</p>
                                    </div>
                                )}
                            </Deferred>
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
