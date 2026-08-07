import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Activity, Calendar, ArrowRightLeft, TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CashFlow({ auth, operatingActivities, investingActivities, financingActivities, netCashFlow, startDate, endDate }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    
    const handleDateChange = (e) => {
        e.preventDefault();
        const start = document.getElementById('start_date').value;
        const end = document.getElementById('end_date').value;
        router.get(route('finance.cash-flow'), { start_date: start, end_date: end }, { preserveState: true });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'narrowSymbol'
        }).format(amount).replace('$', currency);
    };

    const totalOperating = operatingActivities.reduce((sum, act) => sum + act.amount, 0);
    const totalInvesting = investingActivities.reduce((sum, act) => sum + act.amount, 0);
    const totalFinancing = financingActivities.reduce((sum, act) => sum + act.amount, 0);

    const chartData = [
        { name: 'Operating', amount: totalOperating, fill: '#3b82f6' }, // blue-500
        { name: 'Investing', amount: totalInvesting, fill: '#a855f7' }, // purple-500
        { name: 'Financing', amount: totalFinancing, fill: '#f59e0b' }, // amber-500
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700">
                    <p className="font-bold text-sm">{payload[0].payload.name} Activities</p>
                    <p className="text-lg font-black tracking-tight mt-1">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    const renderActivitySection = (title, activities, colorClass, IconComponent, bgLightClass, textClass) => {
        const total = activities.reduce((sum, act) => sum + act.amount, 0);
        
        return (
            <div className={`bg-white shadow-sm sm:rounded-3xl border border-slate-200 mb-6 overflow-hidden hover:shadow-md transition-shadow duration-300`}>
                <div className="flex items-center space-x-3 p-6 sm:px-8 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
                    <div className={`p-3 ${bgLightClass} rounded-2xl shadow-sm border border-white`}>
                        <IconComponent className={`w-6 h-6 ${textClass}`} />
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h3>
                        <p className="text-sm font-medium text-slate-400 mt-0.5">{activities.length} entries</p>
                    </div>
                </div>
                <div className="p-4 sm:p-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {activities.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center">
                            <Activity className="w-10 h-10 text-slate-300 mb-3"/>
                            <p className="text-slate-400 text-sm font-medium">No cash flows in this category.</p>
                        </div>
                    ) : activities.map((act, i) => (
                        <div key={i} className="flex justify-between items-center p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                            <span className="text-slate-600 font-semibold text-sm group-hover:text-slate-900 transition-colors">{act.description}</span>
                            <span className={`font-black tracking-tight ${act.amount >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                                {act.amount >= 0 ? formatCurrency(act.amount) : `(${formatCurrency(Math.abs(act.amount))})`}
                            </span>
                        </div>
                    ))}
                </div>
                <div className={`border-t border-slate-100 flex justify-between items-center bg-slate-50/80 px-6 sm:px-8 py-5`}>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><DollarSign size={14}/> Net Cash</span>
                    <span className={`text-2xl font-black tracking-tight ${total >= 0 ? textClass : 'text-rose-600'}`}>
                        {total >= 0 ? formatCurrency(total) : `(${formatCurrency(Math.abs(total))})`}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Cash Flow Statement" />

            <div className="min-h-[calc(100vh-80px)] w-full pb-8 flex flex-col bg-slate-50/50">
                {/* Header & Filter Section */}
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white border-b border-slate-200 mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 border border-brand-100 shadow-sm">
                            <Activity size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-3xl text-slate-900 tracking-tight">Cash Flow</h2>
                            <p className="text-slate-500 font-medium mt-1 text-sm">Monitor your operational, investing, and financing liquidity.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center">
                        <form onSubmit={handleDateChange} className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 sm:p-2 sm:rounded-2xl sm:border border-slate-200 w-full sm:w-auto">
                            <div className="flex items-center px-4 py-3 sm:py-2 border border-slate-200 sm:border-none rounded-xl sm:rounded-none bg-white sm:bg-transparent w-full sm:w-auto">
                                <Calendar size={16} className="text-slate-400 mr-2"/>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">From</span>
                                <input 
                                    type="date" 
                                    id="start_date" 
                                    defaultValue={startDate} 
                                    className="border-none bg-transparent p-0 text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer w-full" 
                                />
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                            <div className="flex items-center px-4 py-3 sm:py-2 border border-slate-200 sm:border-none rounded-xl sm:rounded-none bg-white sm:bg-transparent w-full sm:w-auto">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">To</span>
                                <input 
                                    type="date" 
                                    id="end_date" 
                                    defaultValue={endDate} 
                                    className="border-none bg-transparent p-0 text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer w-full" 
                                />
                            </div>
                            <button type="submit" className="bg-slate-900 text-white px-6 py-3 sm:py-2.5 rounded-xl hover:bg-slate-800 font-bold shadow-md transition-all text-sm w-full sm:w-auto flex items-center justify-center gap-2">
                                Apply Filter
                            </button>
                        </form>
                    </div>
                </div>

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
                    <div className="max-w-7xl mx-auto">
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            {/* Net Cash Flow Hero Widget */}
                            <div className={`col-span-1 lg:col-span-1 p-8 sm:p-10 shadow-xl rounded-3xl text-white flex flex-col justify-center relative overflow-hidden group min-h-[250px] ${netCashFlow >= 0 ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-rose-500 via-rose-600 to-rose-800'}`}>
                                {/* Decorative element */}
                                <div className="absolute -right-8 -top-8 opacity-20 transform group-hover:scale-110 transition-transform duration-700">
                                    {netCashFlow >= 0 ? <TrendingUp className="w-64 h-64 text-white" /> : <TrendingDown className="w-64 h-64 text-white" />}
                                </div>
                                
                                <div className="relative z-10">
                                    <span className="text-sm font-black uppercase tracking-widest mb-3 text-white/80 flex items-center gap-2 drop-shadow-sm">
                                        <Activity size={18} /> Net Cash Flow
                                    </span>
                                    <span className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md block mb-2 break-words max-w-full">
                                        {netCashFlow >= 0 ? formatCurrency(netCashFlow) : `(${formatCurrency(Math.abs(netCashFlow))})`}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-sm font-bold">
                                        {startDate} to {endDate}
                                    </span>
                                </div>
                            </div>

                            {/* Chart Widget */}
                            <div className="col-span-1 lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
                                <div className="flex items-center gap-2 mb-6">
                                    <PieChartIcon size={20} className="text-brand-500"/>
                                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Cash Flow Breakdown</h3>
                                </div>
                                <div className="flex-grow min-h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                                tickFormatter={(value) => `${value >= 0 ? '' : '-'}${currency}${Math.abs(value)}`}
                                                dx={-10}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                            <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={40}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Activities Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="col-span-1">
                                {renderActivitySection('Operating', operatingActivities, 'border-blue-500', Activity, 'bg-blue-50 text-blue-600', 'text-blue-600')}
                            </div>
                            <div className="col-span-1">
                                {renderActivitySection('Investing', investingActivities, 'border-purple-500', TrendingUp, 'bg-purple-50 text-purple-600', 'text-purple-600')}
                            </div>
                            <div className="col-span-1">
                                {renderActivitySection('Financing', financingActivities, 'border-amber-500', ArrowRightLeft, 'bg-amber-50 text-amber-600', 'text-amber-600')}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
