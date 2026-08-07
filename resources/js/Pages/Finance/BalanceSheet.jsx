import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Scale, Landmark, Coins, Calendar, PieChart, Filter } from 'lucide-react';

export default function BalanceSheet({ auth, assets, liabilities, equity, retainedEarnings, endDate }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    
    const handleDateChange = (e) => {
        e.preventDefault();
        const end = document.getElementById('end_date').value;
        router.get(route('finance.balance-sheet'), { end_date: end }, { preserveState: true });
    };

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0) + retainedEarnings;
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-100 rounded-lg">
                        <Scale className="w-6 h-6 text-brand-600" />
                    </div>
                    <h2 className="font-bold text-2xl text-gray-900 leading-tight">Balance Sheet</h2>
                </div>
            }
        >
            <Head title="Balance Sheet" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Filter */}
                    <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="w-5 h-5 text-brand-500" />
                            <h3 className="font-bold text-gray-700">Filter Period</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            <form onSubmit={handleDateChange} className="flex flex-col sm:flex-row gap-4 items-end w-full">
                                <div className="w-full sm:w-auto">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">As of Date</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input type="date" id="end_date" defaultValue={endDate} className="pl-10 block w-full border-gray-200 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm font-medium text-gray-700" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm">
                                    Run Report
                                </button>
                            </form>
                            
                            {!isBalanced && (
                                <div className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-sm w-full text-center">
                                    Out of balance by {currency}{Math.abs(totalAssets - (totalLiabilities + totalEquity)).toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* ASSETS */}
                        <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Landmark className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900">Assets</h3>
                            </div>
                            
                            <div className="flex-grow space-y-3">
                                {assets.map(asset => (
                                    <div key={asset.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <span className="text-gray-700 font-bold">{asset.name}</span>
                                        <span className="text-gray-900 font-black">{currency}{parseFloat(asset.balance).toFixed(2)}</span>
                                    </div>
                                ))}
                                {assets.length === 0 && (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 text-sm font-medium">No asset accounts found.</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center bg-blue-50/50 p-4 rounded-xl">
                                <span className="text-sm font-black text-gray-500 uppercase tracking-widest">Total Assets</span>
                                <span className="text-2xl font-black text-blue-600">{currency}{totalAssets.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* LIABILITIES & EQUITY */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                                    <div className="p-2 bg-rose-50 rounded-lg">
                                        <Scale className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900">Liabilities</h3>
                                </div>
                                <div className="space-y-3">
                                    {liabilities.map(liability => (
                                        <div key={liability.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-700 font-bold">{liability.name}</span>
                                            <span className="text-gray-900 font-black">{currency}{parseFloat(liability.balance).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {liabilities.length === 0 && (
                                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-500 text-sm font-medium">No liability accounts found.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center bg-rose-50/50 p-4 rounded-xl">
                                    <span className="text-sm font-black text-gray-500 uppercase tracking-widest">Total Liabilities</span>
                                    <span className="text-2xl font-black text-rose-600">{currency}{totalLiabilities.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 shadow-sm rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <Coins className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900">Equity</h3>
                                </div>
                                <div className="space-y-3">
                                    {equity.map(eq => (
                                        <div key={eq.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-700 font-bold">{eq.name}</span>
                                            <span className="text-gray-900 font-black">{currency}{parseFloat(eq.balance).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <span className="text-gray-700 font-bold">Retained Earnings</span>
                                        <span className="text-gray-900 font-black">{currency}{parseFloat(retainedEarnings).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center bg-purple-50/50 p-4 rounded-xl">
                                    <span className="text-sm font-black text-gray-500 uppercase tracking-widest">Total Equity</span>
                                    <span className="text-2xl font-black text-purple-600">{currency}{totalEquity.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-md rounded-2xl text-white flex justify-between items-center relative overflow-hidden group">
                                <div className="absolute right-0 top-0 opacity-10 p-4 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                                    <PieChart className="w-24 h-24 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total L & E</span>
                                    <span className="text-3xl font-black">{currency}{(totalLiabilities + totalEquity).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
