import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
    TrendingUp, DollarSign, PieChart as PieIcon, BarChart3, 
    ArrowUpRight, Activity, Banknote, ShoppingBag, Calendar, X 
} from 'lucide-react';
import { useMemo, useState } from 'react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function ChartSkeleton({ label }) {
    return (
        <div className="h-[320px] w-full bg-gray-50 animate-pulse rounded-xl flex items-center justify-center">
            <p className="text-xs font-semibold text-gray-400">{label}</p>
        </div>
    );
}

export default function Analytics({ trend, categorySales, profitableItems, stats, filters }) {
    const [showFilters, setShowFilters] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || ''
    });
    
    const chartData = useMemo(() => {
        if (!trend) return null;
        return trend.map(t => ({
            ...t,
            revenue: parseFloat(t.revenue),
            tips: parseFloat(t.tips),
            name: new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
        }));
    }, [trend]);

    const pieData = useMemo(() => {
        if (!categorySales) return null;
        return categorySales.map(c => ({
            ...c,
            name: c.category,
            value: parseFloat(c.value)
        }));
    }, [categorySales]);

    const profitData = useMemo(() => {
        if (!profitableItems) return null;
        return profitableItems.map(i => ({
            name: i?.menu?.name || 'Unknown',
            profit: parseFloat(i.profit),
            revenue: parseFloat(i.revenue)
        }));
    }, [profitableItems]);
    
    const applyFilters = () => {
        const params = { days: filters.days };
        if (localFilters.start_date) params.start_date = localFilters.start_date;
        if (localFilters.end_date) params.end_date = localFilters.end_date;
        router.get(route('reports.analytics'), params, { preserveScroll: true });
    };
    
    const clearFilters = () => {
        setLocalFilters({ start_date: '', end_date: '' });
        router.get(route('reports.analytics'), { days: filters.days }, { preserveScroll: true });
    };
    
    const hasActiveFilters = filters.start_date || filters.end_date;

    return (
        <AuthenticatedLayout>
            <Head title="Advanced Analytics" />

            <div className="flex flex-col space-y-6 pb-8">
                {/* Header with Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Business Intelligence</h1>
                            <p className="text-xs text-gray-500 mt-1">Deep dive into your cafe performance</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Days Filter */}
                            <div className="flex items-center gap-2">
                                {[
                                    { days: 7, label: '7 Days', color: 'emerald' },
                                    { days: 30, label: '30 Days', color: 'brand' },
                                    { days: 90, label: '90 Days', color: 'purple' }
                                ].map(({ days: d, label, color }) => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            router.get(route('reports.analytics'), { days: d }, { preserveScroll: true });
                                        }}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                            filters.days === d && !filters.start_date && !filters.end_date
                                            ? color === 'emerald' 
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' 
                                                : color === 'purple'
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 scale-105'
                                                : 'bg-brand-600 text-white shadow-lg shadow-brand-200 scale-105'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-md hover:scale-105'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Filter Toggle Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                                    hasActiveFilters
                                    ? 'bg-brand-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                Custom Date Range
                            </button>
                            
                            {/* Show active date range when filters are applied */}
                            {hasActiveFilters && !showFilters && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-xl border border-brand-200">
                                    <span className="text-xs font-semibold">
                                        {filters.start_date && new Date(filters.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        {filters.start_date && filters.end_date && ' - '}
                                        {filters.end_date && new Date(filters.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={clearFilters}
                                        className="ml-1 p-1 hover:bg-brand-100 rounded-lg transition-colors"
                                        title="Clear filters"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Expandable Filters Panel */}
                    {showFilters && (
                        <div className="mt-5 pt-5 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Start Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date</label>
                                    <input
                                        type="date"
                                        value={localFilters.start_date}
                                        onChange={(e) => setLocalFilters({...localFilters, start_date: e.target.value})}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                    />
                                </div>
                                
                                {/* End Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date</label>
                                    <input
                                        type="date"
                                        value={localFilters.end_date}
                                        onChange={(e) => setLocalFilters({...localFilters, end_date: e.target.value})}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-4">
                                <button
                                    onClick={applyFilters}
                                    className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                                >
                                    Apply Filters
                                </button>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title="Total Revenue" 
                        value={stats.total_revenue} 
                        icon={<DollarSign className="w-4 h-4" />} 
                        color="indigo" 
                        prefix="रू. "
                    />
                    <StatCard 
                        title="Net Profit" 
                        value={stats.total_profit} 
                        icon={<Activity className="w-4 h-4" />} 
                        color="emerald" 
                        prefix="रू. "
                        subText={`Margin: ${stats.margin.toFixed(1)}%`}
                    />
                    <StatCard 
                        title="Total Tips" 
                        value={stats.total_tips} 
                        icon={<Banknote className="w-4 h-4" />} 
                        color="amber" 
                        prefix="रू. "
                    />
                    <StatCard 
                        title="Cost of Goods" 
                        value={stats.total_cost} 
                        icon={<ShoppingBag className="w-4 h-4" />} 
                        color="rose" 
                        prefix="रू. "
                        subText={`${((stats.total_cost / (stats.total_revenue || 1)) * 100).toFixed(1)}% of revenue`}
                    />
                </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Revenue Trend - Area Chart */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2 text-brand-600" />
                                Revenue &amp; Profit Trend
                            </h3>
                        </div>
                        {chartData === null ? (
                            <ChartSkeleton label="Loading Revenue Trend..." />
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                    <Area type="monotone" dataKey="tips" stroke="#f59e0b" strokeWidth={3} fillOpacity={0} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Category Distribution - Pie Chart */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight mb-6 flex items-center">
                            <PieIcon className="w-4 h-4 mr-2 text-emerald-600" />
                            Category Split
                        </h3>
                        {pieData === null ? (
                            <ChartSkeleton label="Loading Categories..." />
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Unit Profitability - Bar Chart */}
                    <div className="lg:col-span-12 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight mb-6 flex items-center">
                            <BarChart3 className="w-4 h-4 mr-2 text-amber-600" />
                            Most Profitable Items (Gross Profit)
                        </h3>
                        {profitData === null ? (
                            <ChartSkeleton label="Loading Profitability Data..." />
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={profitData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                        cursor={{fill: '#f1f5f9'}}
                                    />
                                    <Bar dataKey="profit" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, icon, color, prefix = '', subText }) {
    const colorClasses = {
        indigo: 'bg-brand-600 shadow-sm',
        emerald: 'bg-emerald-500 shadow-sm',
        amber: 'bg-amber-500 shadow-sm',
        rose: 'bg-rose-500 shadow-sm'
    };

    return (
        <div className={`${colorClasses[color]} rounded-xl p-4 text-white group hover:scale-[1.02] transition-transform duration-300`}>
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                    {icon}
                </div>
                <div className="flex items-center space-x-1">
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                </div>
            </div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mb-1">{title}</h4>
            <p className="text-xl font-black tracking-tight">{prefix}{typeof value === 'number' ? value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}</p>
            {subText && <p className="text-[10px] font-medium mt-2 opacity-70">{subText}</p>}
        </div>
    );
}
