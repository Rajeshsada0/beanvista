import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ShoppingBag, Coffee, ChevronRight, Clock, CheckCircle2, ListMinus, AlertCircle, X, Calendar, Filter, History, ChevronDown, ChevronUp, Flame, Plus, LayoutGrid, List, Activity, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Modal from '@/Components/Modal';

const formatTime = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    }).format(new Date(dateString));
};

const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(dateString));
};

const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const diffMs = new Date(end) - new Date(start);
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins} mins`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function OrderIndex({ orders, filters, counts }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || 'रू.';
    const [confirmDelete, setConfirmDelete] = useState({ show: false, orderId: null });
    const [expandedOrders, setExpandedOrders] = useState({});
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const filterBtnRef = useRef(null);

    const openFilterDropdown = () => {
        if (filterBtnRef.current) {
            const rect = filterBtnRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + window.scrollY + 6,
                right: window.innerWidth - rect.right,
            });
        }
        setShowFilterDropdown(prev => !prev);
    };
    
    // View mode state (persisted)
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('ordersViewMode') || 'grid');
    useEffect(() => {
        localStorage.setItem('ordersViewMode', viewMode);
    }, [viewMode]);

    const toggleExpand = (orderId) => {
        setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };
    
    // Filter states
    const [activeFilter, setActiveFilter] = useState(filters.filter || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // Sort states
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortDir, setSortDir] = useState(filters.sort_dir || 'desc');

    // Sync state with props when filters change (e.g., browser back/forward)
    useEffect(() => {
        setActiveFilter(filters.filter || 'all');
        setStartDate(filters.start_date || '');
        setEndDate(filters.end_date || '');
        setSortBy(filters.sort_by || 'created_at');
        setSortDir(filters.sort_dir || 'desc');
    }, [filters]);

    // Sync handled globally by AuthenticatedLayout

    const handleFilterChange = (newFilter) => {
        setActiveFilter(newFilter);
        setShowFilterDropdown(false);
        if (newFilter !== 'custom') {
            router.get(route('orders.index'), { filter: newFilter, status: filters.status || 'all', sort_by: sortBy, sort_dir: sortDir });
        }
    };

    const handleStatusChange = (newStatus) => {
        router.get(route('orders.index'), { filter: activeFilter, start_date: startDate, end_date: endDate, status: newStatus, sort_by: sortBy, sort_dir: sortDir });
    };

    const applyCustomFilter = () => {
        if (startDate && endDate) {
            router.get(route('orders.index'), { 
                filter: 'custom',
                start_date: startDate,
                end_date: endDate,
                status: filters.status || 'all',
                sort_by: sortBy,
                sort_dir: sortDir,
            });
        }
    };

    const clearFilters = () => {
        setActiveFilter('all');
        setStartDate('');
        setEndDate('');
        setShowFilterDropdown(false);
        router.get(route('orders.index'), { filter: 'all', status: filters.status || 'all', sort_by: sortBy, sort_dir: sortDir });
    };

    const handleSort = (column) => {
        const newDir = sortBy === column && sortDir === 'desc' ? 'asc' : 'desc';
        setSortBy(column);
        setSortDir(newDir);
        router.get(route('orders.index'), {
            filter: activeFilter,
            start_date: startDate,
            end_date: endDate,
            status: filters.status || 'all',
            sort_by: column,
            sort_dir: newDir,
        });
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
        return sortDir === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-brand-600" />
            : <ArrowDown className="w-3 h-3 ml-1 text-brand-600" />;
    };

    const getStatusColors = (status) => {
        switch(status) {
            case 'pending': return 'bg-amber-100 text-amber-700 ring-amber-200';
            case 'preparing': return 'bg-blue-100 text-blue-700 ring-blue-200';
            case 'served': return 'bg-purple-100 text-purple-700 ring-purple-200';
            case 'completed': return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
            case 'cancelled': return 'bg-red-100 text-red-700 ring-red-200';
            default: return 'bg-gray-100 text-gray-700 ring-gray-200';
        }
    };

    const handleCancelOrder = (orderId) => {
        setConfirmDelete({ show: true, orderId });
    };

    const executeDelete = () => {
        if (confirmDelete.orderId) {
            router.delete(route('orders.destroy', confirmDelete.orderId), {
                onSuccess: () => setConfirmDelete({ show: false, orderId: null })
            });
        }
    };

    const filterOptions = [
        { label: 'All Orders', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
        { label: 'Custom Range', value: 'custom' },
    ];

    const getFilterLabel = (value) => {
        const option = filterOptions.find(opt => opt.value === value);
        return option ? option.label : 'All Orders';
    };

    const statusOptions = [
        { label: 'All Orders', value: 'all', count: counts?.all || 0, icon: <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />, activeClass: 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border-transparent', inactiveClass: 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm' },
        { label: 'Active', value: 'active', count: counts?.active || 0, icon: <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />, activeClass: 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 border-transparent', inactiveClass: 'bg-brand-50/50 text-brand-600 border-brand-100 hover:bg-brand-50 shadow-sm' },
        { label: 'Completed', value: 'completed', count: counts?.completed || 0, icon: <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />, activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border-transparent', inactiveClass: 'bg-emerald-50/50 text-emerald-600 border-emerald-100 hover:bg-emerald-50 shadow-sm' },
        { label: 'Cancelled', value: 'cancelled', count: counts?.cancelled || 0, icon: <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />, activeClass: 'bg-red-500 text-white shadow-lg shadow-red-500/30 border-transparent', inactiveClass: 'bg-red-50/50 text-red-600 border-red-100 hover:bg-red-50 shadow-sm' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Order Management" />

            <div className="flex flex-col space-y-4 sm:space-y-5 pb-6 sm:pb-8">
                {/* Header & Filters */}
                <div className="flex flex-col space-y-4 sm:space-y-5 bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm relative z-0 overflow-visible">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div>
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-gray-900">Order Management</h1>
                            <div className="mt-1 flex flex-wrap items-center gap-y-1 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
                                <div className="flex items-center">
                                    <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-brand-500" />
                                    {activeFilter === 'custom' && startDate && endDate
                                        ? `${startDate} to ${endDate}` 
                                        : getFilterLabel(activeFilter)}
                                </div>
                                <span className="hidden sm:inline mx-2 text-gray-300">|</span>
                                <div className="flex items-center text-gray-400">
                                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                                    Live Sync Active
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {/* Clear Filter Button - Only show when filter is active */}
                            {activeFilter !== 'all' && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center justify-center px-2.5 py-1.5 sm:px-4 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg sm:rounded-xl shadow-sm shadow-red-500/20 border border-red-600 transition-all active:scale-95"
                                >
                                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" strokeWidth={2.5} />
                                    Clear
                                </button>
                            )}
                            
                            {/* Filter Dropdown Button */}
                            <div className="relative">
                                <button
                                    ref={filterBtnRef}
                                    onClick={openFilterDropdown}
                                    className={`inline-flex items-center justify-center px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg sm:rounded-xl shadow-sm border transition-all active:scale-95 ${
                                        activeFilter !== 'all'
                                            ? 'bg-brand-600 hover:bg-brand-700 text-white border-brand-700 shadow-brand-500/20'
                                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                                    }`}
                                >
                                    <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" strokeWidth={2.5} />
                                    Filter
                                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-1.5 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex items-center bg-gray-100/50 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-gray-100 shrink-0">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm border border-brand-50' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Grid View"
                                >
                                    <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm border border-brand-50' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="List View"
                                >
                                    <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                            </div>

                            <Link
                                href={route('table-book')}
                                className="inline-flex items-center justify-center px-3 py-1.5 sm:px-5 sm:py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg sm:rounded-xl shadow-lg shadow-brand-500/30 transition-all active:scale-95"
                            >
                                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" strokeWidth={2.5} />
                                New Order
                            </Link>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex overflow-x-auto sm:flex-wrap items-center gap-1.5 sm:gap-2 border-b border-gray-200/50 pb-3 sm:pb-4 w-full scrollbar-hide">
                        {statusOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleStatusChange(option.value)}
                                className={`flex items-center whitespace-nowrap shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                    filters.status === option.value ? option.activeClass : option.inactiveClass
                                }`}
                            >
                                {option.icon}
                                {option.label}
                                <span className={`ml-1.5 sm:ml-2 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black transition-colors ${
                                    filters.status === option.value 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-white text-current shadow-sm border border-current/10'
                                }`}>
                                    {option.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Range - Only show when custom filter is active */}
                    {activeFilter === 'custom' && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                                <div className="col-span-1 flex flex-col sm:flex-row sm:items-center px-3 py-1.5 sm:space-x-2 bg-white rounded-lg sm:rounded-xl border border-gray-200">
                                    <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">From</span>
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-[10px] sm:text-xs font-black text-gray-700 focus:ring-0 cursor-pointer"
                                    />
                                </div>
                                <div className="col-span-1 flex flex-col sm:flex-row sm:items-center px-3 py-1.5 sm:space-x-2 bg-white rounded-lg sm:rounded-xl border border-gray-200">
                                    <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">To</span>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-[10px] sm:text-xs font-black text-gray-700 focus:ring-0 cursor-pointer"
                                    />
                                </div>
                                <button 
                                    onClick={applyCustomFilter}
                                    className="col-span-2 sm:col-span-auto flex justify-center items-center px-3 py-2 sm:px-5 sm:py-2 bg-brand-600 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-95 w-full sm:w-auto"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Orders Grid */}
                <div>
                    {orders.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center opacity-70 space-y-2 sm:space-y-3 py-12 sm:py-20 bg-white/40 rounded-xl sm:rounded-2xl border border-white/60 backdrop-blur-xl border-dashed">
                            <ListMinus className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-400">No matching orders found</h3>
                                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 mt-1 uppercase tracking-widest">Try a different time period</p>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                <button onClick={() => handleSort('order_number')} className="flex items-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-600 transition-colors">
                                                    Order # <SortIcon column="order_number" />
                                                </button>
                                            </th>
                                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">Table & Customer</th>
                                            <th className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                <button onClick={() => handleSort('created_at')} className="flex items-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-600 transition-colors">
                                                    Date & Time <SortIcon column="created_at" />
                                                </button>
                                            </th>
                                            <th className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                <button onClick={() => handleSort('status')} className="flex items-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-600 transition-colors">
                                                    Status <SortIcon column="status" />
                                                </button>
                                            </th>
                                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                                                <button onClick={() => handleSort('grand_total')} className="flex items-center ml-auto text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-600 transition-colors">
                                                    Total Amount <SortIcon column="grand_total" />
                                                </button>
                                            </th>
                                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.data.map((order) => (
                                            <tr key={order.id} className="hover:bg-white/50 transition-colors group">
                                                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                    <span className="text-xs sm:text-sm font-black text-gray-800">
                                                        {order.display_number || order.order_number || `#${order.id}`}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                    <p className="text-xs sm:text-sm font-black text-gray-900">
                                                        {order.table?.table_number ? `Table ${order.table.table_number}` : (order.order_type || 'Takeaway')}
                                                    </p>
                                                    {order.customer && (
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-brand-600 uppercase tracking-tight truncate max-w-[120px]">
                                                            {order.customer.name}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                    <div className="flex flex-col gap-1">
                                                        {/* Created row */}
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded w-14 text-center shrink-0">Created</span>
                                                            <Calendar className="w-2.5 h-2.5 text-gray-300 shrink-0" />
                                                            <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 whitespace-nowrap">{formatDate(order.created_at)}</span>
                                                            <Clock className="w-2.5 h-2.5 text-gray-300 shrink-0 ml-0.5" />
                                                            <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 whitespace-nowrap">{formatTime(order.created_at)}</span>
                                                        </div>
                                                        {/* Completed row */}
                                                        {order.status === 'completed' && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded w-14 text-center shrink-0">Done</span>
                                                                <Calendar className="w-2.5 h-2.5 text-gray-300 shrink-0" />
                                                                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 whitespace-nowrap">{formatDate(order.updated_at)}</span>
                                                                <Clock className="w-2.5 h-2.5 text-gray-300 shrink-0 ml-0.5" />
                                                                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 whitespace-nowrap">{formatTime(order.updated_at)}</span>
                                                                <span className="text-[8px] font-bold text-gray-400 ml-0.5 whitespace-nowrap">({calculateDuration(order.created_at, order.updated_at)})</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${getStatusColors(order.status)}`}>
                                                        {order.status === 'cancelled' ? <><X className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> Cancelled</> : order.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                                                    <p className="text-sm sm:text-base font-black text-gray-900">{currency} {parseFloat(order.grand_total).toFixed(2)}</p>
                                                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{order.items.length} items</p>
                                                </td>
                                                <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                                                    <div className="flex justify-end items-center gap-1.5 sm:gap-2">
                                                        {!['completed', 'cancelled'].includes(order.status) && order.status === 'served' && (
                                                            <button 
                                                                onClick={() => router.patch(route('orders.update', order.id), { status: 'completed', payment_method: 'cash', quick_complete: true })}
                                                                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all"
                                                            >
                                                                Complete
                                                            </button>
                                                        )}
                                                        {!['completed', 'cancelled'].includes(order.status) && (
                                                            <Link 
                                                                href={route('orders.edit', order.id)}
                                                                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20"
                                                            >
                                                                Manage
                                                            </Link>
                                                        )}
                                                        {order.status === 'completed' && (
                                                            <Link 
                                                                href={route('orders.receipt', order.id)}
                                                                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 hover:bg-white border border-gray-200 transition-all"
                                                            >
                                                                Receipt
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                            {orders.data.map(order => (
                                <div key={order.id} className="group relative flex flex-col p-3 sm:p-4 lg:p-5 bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                                        <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
                                            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                                {/* Order Number */}
                                                <div className="text-xs sm:text-sm font-black text-gray-800">
                                                    {order.display_number || order.order_number || `#${order.id}`}
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-black text-gray-900">
                                                        {order.table?.table_number ? `Table ${order.table.table_number}` : (order.order_type || 'Takeaway')}
                                                    </p>
                                                    {order.customer && (
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-brand-600 uppercase tracking-tight truncate max-w-[150px]">
                                                            {order.customer.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-x-2 mt-1 bg-gray-50/50 p-1.5 rounded-lg border border-gray-100/50 w-full overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
                                                    <div className="flex items-center shrink-0">
                                                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 text-gray-400" />
                                                        <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase">{formatTime(order.created_at)}</span>
                                                    </div>
                                                    
                                                    {order.status === 'completed' && (
                                                        <>
                                                            <div className="h-2.5 sm:h-3 w-px bg-gray-200 shrink-0"></div>
                                                            <div className="flex items-center shrink-0">
                                                                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 text-emerald-500" />
                                                                <span className="text-[8px] sm:text-[9px] font-black text-emerald-600 uppercase">{formatTime(order.updated_at)}</span>
                                                            </div>
                                                            <div className="h-2.5 sm:h-3 w-px bg-gray-200 shrink-0"></div>
                                                            <div className="flex items-center shrink-0 text-brand-600">
                                                                <History className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 text-brand-400" />
                                                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight">
                                                                    {calculateDuration(order.created_at, order.updated_at)}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <span className={`shrink-0 px-1.5 py-1 sm:px-2 sm:py-1 text-[8px] sm:text-[9px] uppercase font-black tracking-widest rounded-md sm:rounded-lg shadow-sm ring-1 flex items-center whitespace-nowrap ${getStatusColors(order.status)}`}>
                                            {order.status === 'completed' && <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5 sm:mr-1 -ml-0.5" />}
                                            {order.status === 'cancelled' && <X className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5 sm:mr-1 -ml-0.5" />}
                                            {order.status}
                                        </span>
                                    </div>

                                     <div className="mb-3 sm:mb-4 flex-1">
                                        <div className="flex items-center space-x-2 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
                                            <span>Items ({order.items.length})</span>
                                            <div className="h-px flex-1 bg-gray-200/50"></div>
                                            {/* New Items badge: order has delivered items AND new pending/preparing items */}
                                            {order.items.some(i => i.kds_status === 'delivered') && order.items.some(i => ['pending','preparing'].includes(i.kds_status)) && (
                                                <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded-full bg-orange-100 text-orange-600 border border-orange-200 animate-pulse shrink-0">
                                                    <Flame className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> New Items
                                                </span>
                                            )}
                                        </div>
                                        <ul className="space-y-1.5 sm:space-y-2">
                                            {(expandedOrders[order.id] ? order.items : order.items.slice(0, 3)).map(item => {
                                                const kdsDot = item.kds_status === 'delivered' ? 'bg-emerald-400' :
                                                              item.kds_status === 'ready'     ? 'bg-blue-400' :
                                                              item.kds_status === 'preparing' ? 'bg-amber-400' : 'bg-gray-300';
                                                return (
                                                <li key={item.id} className="flex justify-between items-center text-[10px] sm:text-xs">
                                                    <span className="font-bold text-gray-700 flex items-center gap-1">
                                                        <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${kdsDot}`} title={item.kds_status || 'pending'} />
                                                        <span className="text-brand-600 font-black mr-1 sm:mr-1.5 bg-brand-50 px-1 py-0.5 rounded-md text-[8px] sm:text-[9px]">{item.quantity}x</span>
                                                        {item.menu?.name || 'Unknown'}
                                                    </span>
                                                    <span className="font-black text-gray-400 text-[9px] sm:text-[10px] px-1 sm:px-1.5">{currency} {(item.price * item.quantity).toFixed(2)}</span>
                                                </li>
                                                );
                                            })}
                                        </ul>
                                        {order.items.length > 3 && (
                                            <button
                                                onClick={() => toggleExpand(order.id)}
                                                className="mt-2 flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] font-black text-brand-500 hover:text-brand-700 uppercase tracking-widest transition-colors"
                                            >
                                                {expandedOrders[order.id] ? (
                                                    <><ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Show less</>
                                                ) : (
                                                    <><ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Show {order.items.length - 3} more items</>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="w-full sm:w-auto flex justify-between sm:block items-center">
                                            <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0 sm:mb-0.5">Final Total</p>
                                            <p className="text-base sm:text-lg font-black text-gray-900 tracking-tighter">{currency} {parseFloat(order.grand_total).toFixed(2)}</p>
                                        </div>
                                        
                                        {!['completed', 'cancelled'].includes(order.status) ? (
                                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
                                                {/* Hide Cancel if any item has already been delivered */}
                                                {!order.items.some(i => i.kds_status === 'delivered') && (
                                                <button 
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    className="col-span-1 flex justify-center items-center px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95"
                                                >
                                                    Cancel
                                                </button>
                                                )}
                                                {order.status === 'served' && (
                                                    <button 
                                                        onClick={() => router.patch(route('orders.update', order.id), { 
                                                            status: 'completed',
                                                            payment_method: 'cash',
                                                            quick_complete: true
                                                        })}
                                                        className="col-span-1 flex justify-center items-center px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all active:scale-95"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                <Link 
                                                    href={route('orders.edit', order.id)}
                                                    className={`${order.items.some(i => i.kds_status === 'delivered') && order.status !== 'served' ? 'col-span-2' : 'col-span-1'} flex justify-center items-center px-2.5 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-brand-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-95`}
                                                >
                                                    Manage <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1" />
                                                </Link>
                                            </div>
                                        ) : order.status === 'completed' ? (
                                            <Link 
                                                href={route('orders.receipt', order.id)}
                                                className="w-full sm:w-auto flex justify-center items-center px-2.5 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-50 text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-gray-100 hover:bg-white transition-all active:scale-95"
                                            >
                                                View Receipt <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />
                                            </Link>
                                        ) : (
                                            <div className="w-full sm:w-auto flex justify-center items-center px-2.5 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-red-50 text-red-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-red-100">
                                                Cancelled
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {orders.links && orders.links.length > 3 && (
                        <div className="mt-8 sm:mt-10 flex items-center justify-center space-x-1.5 sm:space-x-2">
                            {orders.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                                        link.active 
                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                                        : 'bg-white text-gray-500 hover:bg-brand-50 hover:text-brand-600 border border-white shadow-sm'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Dropdown - rendered at root level to escape all stacking contexts */}
            {showFilterDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-[9998]"
                        onClick={() => setShowFilterDropdown(false)}
                    />
                    {/* Desktop: positioned dropdown, Mobile: centered modal-style */}
                    <div
                        style={{ 
                            top: window.innerWidth >= 640 ? dropdownPos.top : '50%',
                            right: window.innerWidth >= 640 ? dropdownPos.right : 'auto',
                            left: window.innerWidth >= 640 ? 'auto' : '50%',
                            transform: window.innerWidth >= 640 ? 'none' : 'translate(-50%, -50%)'
                        }}
                        className="fixed z-[9999] w-[calc(100vw-2rem)] max-w-xs sm:w-52 bg-white rounded-xl sm:rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        {filterOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleFilterChange(option.value)}
                                className={`w-full text-left px-4 py-2.5 sm:py-2.5 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-between ${
                                    activeFilter === option.value
                                        ? 'bg-brand-600 text-white'
                                        : 'text-gray-600 hover:bg-brand-600 hover:text-white'
                                }`}
                            >
                                <span>{option.label}</span>
                                {activeFilter === option.value && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Custom Delete Confirmation Modal */}
            <Modal show={confirmDelete.show} onClose={() => setConfirmDelete({ show: false, orderId: null })} maxWidth="md">
                <div className="p-5 sm:p-8 relative bg-white/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-white/80 shadow-2xl overflow-hidden">
                    <button 
                        onClick={() => setConfirmDelete({ show: false, orderId: null })}
                        className="absolute top-3 sm:top-6 right-3 sm:right-6 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-red-500 mb-5 sm:mb-6 shadow-sm border border-red-100/50 mx-auto">
                            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2.5} />
                        </div>
                        
                        <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mb-2 sm:mb-3 mx-auto">Cancel Order?</h2>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 leading-relaxed max-w-xs mx-auto">
                            Are you sure you want to permanently delete <span className="text-red-600 font-bold">Order #{confirmDelete.orderId}</span>? This action cannot be reversed.
                        </p>

                        <div className="mt-6 sm:mt-10 grid grid-cols-2 gap-2 sm:gap-3 w-full">
                            <button
                                onClick={() => setConfirmDelete({ show: false, orderId: null })}
                                className="px-3 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl bg-gray-50 text-gray-500 text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
                            >
                                Wait, Keep
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-3 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
