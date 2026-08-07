import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Scale, Calendar, Hash, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TrialBalance({ auth, accounts, totalDebit, totalCredit, startDate, endDate }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    
    const handleDateChange = (e) => {
        e.preventDefault();
        const start = document.getElementById('start_date').value;
        const end = document.getElementById('end_date').value;
        router.get(route('finance.trial-balance'), { start_date: start, end_date: end }, { preserveState: true });
    };

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'narrowSymbol'
        }).format(amount).replace('$', currency);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Trial Balance" />

            <div className="min-h-[calc(100vh-80px)] w-full pb-6 flex flex-col">
                {/* Header & Filter Section */}
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="font-semibold text-2xl text-slate-800 leading-tight flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <Scale size={24} />
                        </div>
                        Trial Balance
                    </h2>
                    
                    <div className="flex items-center justify-end">
                        <form onSubmit={handleDateChange} className="flex flex-col sm:flex-row items-center gap-3 bg-white sm:p-1.5 sm:rounded-xl sm:border border-slate-200 sm:shadow-sm">
                            <div className="flex items-center px-3 border-b sm:border-b-0 sm:border-r border-slate-200 py-2 sm:py-0 w-full sm:w-auto">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">From</span>
                                <input 
                                    type="date" 
                                    id="start_date" 
                                    defaultValue={startDate} 
                                    className="border-none bg-transparent p-1 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-full" 
                                />
                            </div>
                            <div className="flex items-center px-3 border-b sm:border-b-0 sm:border-r border-slate-200 py-2 sm:py-0 w-full sm:w-auto">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">To</span>
                                <input 
                                    type="date" 
                                    id="end_date" 
                                    defaultValue={endDate} 
                                    className="border-none bg-transparent p-1 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-full" 
                                />
                            </div>
                            <button type="submit" className="bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-800 font-semibold shadow-sm transition-all text-sm w-full sm:w-auto sm:h-full whitespace-nowrap">
                                Update Range
                            </button>
                        </form>
                    </div>
                </div>

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col max-w-6xl">
                    <div className="bg-white shadow-sm sm:rounded-2xl border border-slate-200 flex flex-col flex-1 overflow-hidden">
                        
                        {/* Status Header */}
                        <div className="p-6 md:p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 bg-gradient-to-br from-white to-slate-50/50 border-b border-slate-200">
                            <div>
                                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ledger Summary</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Review your debit and credit balances for the selected period.</p>
                            </div>
                            <div>
                                {!isBalanced ? (
                                    <div className="flex items-center gap-3 px-5 py-3 bg-red-50 text-red-700 rounded-xl border border-red-200 shadow-sm">
                                        <AlertCircle size={24} className="text-red-500" />
                                        <div>
                                            <p className="font-bold text-sm tracking-wide">Warning: Imbalance Detected</p>
                                            <p className="text-xs font-medium opacity-80">Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shadow-sm">
                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                        <p className="font-bold text-sm tracking-wide">Ledger is Perfectly Balanced</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="flex-grow overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest"><span className="flex items-center gap-1.5"><Hash size={14}/> Account Code</span></th>
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Account Name</th>
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                        <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest"><span className="flex items-center justify-end gap-1.5">Debit <ArrowRight size={14}/></span></th>
                                        <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest"><span className="flex items-center justify-end gap-1.5"><ArrowLeft size={14}/> Credit</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {accounts.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-medium text-lg">No ledger activity found for this period.</td></tr>
                                    ) : accounts.map((account) => {
                                        if (account.debit === 0 && account.credit === 0) return null;
                                        return (
                                            <tr key={account.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-4 whitespace-nowrap text-sm text-brand-600 font-black tracking-wide font-mono">{account.code}</td>
                                                <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-800 font-bold">{account.name}</td>
                                                <td className="px-8 py-4 whitespace-nowrap">
                                                    <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md ${
                                                        account.type === 'asset' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                        account.type === 'liability' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                        account.type === 'equity' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                                        account.type === 'revenue' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                                                        'bg-orange-50 text-orange-700 border border-orange-100'
                                                    }`}>{account.type}</span>
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-700">
                                                    {account.debit > 0 ? formatCurrency(account.debit) : <span className="text-slate-300">-</span>}
                                                </td>
                                                <td className="px-8 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-700">
                                                    {account.credit > 0 ? formatCurrency(account.credit) : <span className="text-slate-300">-</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="sticky bottom-0 bg-slate-50/90 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t border-slate-200">
                                    <tr>
                                        <td colSpan="3" className="px-8 py-6 text-right text-sm font-black text-slate-500 uppercase tracking-widest">
                                            Grand Totals
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="inline-flex flex-col items-end">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Debit</span>
                                                <span className="text-xl font-black text-slate-900 border-b-4 border-double border-slate-300">{formatCurrency(totalDebit)}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="inline-flex flex-col items-end">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Credit</span>
                                                <span className="text-xl font-black text-slate-900 border-b-4 border-double border-slate-300">{formatCurrency(totalCredit)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
