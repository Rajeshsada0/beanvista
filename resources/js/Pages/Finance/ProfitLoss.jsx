import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter, PieChart } from 'lucide-react';

export default function ProfitLoss({ auth, startDate, endDate, revenue, expensesTotal, expensesByCategory, grossProfit, netProfit }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    
    const handleDateChange = (e) => {
        e.preventDefault();
        const start = document.getElementById('start_date').value;
        const end = document.getElementById('end_date').value;
        router.get(route('finance.profit-loss'), { start_date: start, end_date: end }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-brand-600" />
                    </div>
                    <h2 className="font-bold text-2xl text-gray-900 leading-tight">Profit & Loss</h2>
                </div>
            }
        >
            <Head title="Profit & Loss" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Filter */}
                    <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="w-5 h-5 text-brand-500" />
                            <h3 className="font-bold text-gray-700">Filter Period</h3>
                        </div>
                        <form onSubmit={handleDateChange} className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="w-full sm:w-auto">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input type="date" id="start_date" defaultValue={startDate} className="pl-10 block w-full border-gray-200 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm font-medium text-gray-700" />
                                </div>
                            </div>
                            <div className="w-full sm:w-auto">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input type="date" id="end_date" defaultValue={endDate} className="pl-10 block w-full border-gray-200 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm font-medium text-gray-700" />
                                </div>
                            </div>
                            <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm">
                                Generate
                            </button>
                        </form>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="w-16 h-16 text-emerald-500" />
                            </div>
                            <h3 className="text-gray-500 text-xs uppercase font-extrabold tracking-widest mb-1">Total Revenue</h3>
                            <p className="text-4xl font-black text-gray-900 mt-2">{currency}{parseFloat(revenue || 0).toFixed(2)}</p>
                            <div className="w-12 h-1.5 bg-emerald-500 rounded-full mt-4"></div>
                        </div>

                        <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingDown className="w-16 h-16 text-rose-500" />
                            </div>
                            <h3 className="text-gray-500 text-xs uppercase font-extrabold tracking-widest mb-1">Total Expenses</h3>
                            <p className="text-4xl font-black text-gray-900 mt-2">{currency}{parseFloat(expensesTotal || 0).toFixed(2)}</p>
                            <div className="w-12 h-1.5 bg-rose-500 rounded-full mt-4"></div>
                        </div>

                        <div className={`p-6 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all duration-300 ${netProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white'}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign className="w-16 h-16 text-white" />
                            </div>
                            <h3 className="text-emerald-100 text-xs uppercase font-extrabold tracking-widest mb-1">Net Profit</h3>
                            <p className="text-4xl font-black mt-2">
                                {currency}{parseFloat(netProfit || 0).toFixed(2)}
                            </p>
                            <div className="w-12 h-1.5 bg-white/30 rounded-full mt-4"></div>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-2 mb-6">
                            <PieChart className="w-5 h-5 text-brand-500" />
                            <h3 className="text-lg font-bold text-gray-900">Expense Breakdown</h3>
                        </div>
                        
                        {expensesByCategory.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">No expenses recorded for this period.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {expensesByCategory.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-sm bg-gray-50 hover:bg-white transition-all">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-brand-600">
                                                {cat.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-gray-700 font-bold">{cat.name}</span>
                                        </div>
                                        <span className="text-gray-900 font-black text-lg">{currency}{parseFloat(cat.total).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
