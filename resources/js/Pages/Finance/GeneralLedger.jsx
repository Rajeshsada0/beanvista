import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, Hash, FileText, ArrowRight, ArrowLeft, ChevronRight, TrendingUp, Search } from 'lucide-react';

export default function GeneralLedger({ auth, accounts, startDate, endDate }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    
    // Set first account as selected by default
    const [selectedAccountId, setSelectedAccountId] = useState(accounts.length > 0 ? accounts[0].id : null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const handleDateChange = (e) => {
        e.preventDefault();
        const start = document.getElementById('start_date').value;
        const end = document.getElementById('end_date').value;
        router.get(route('finance.general-ledger'), { start_date: start, end_date: end }, { preserveState: true });
    };

    const filteredAccounts = accounts.filter(account => 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        account.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'narrowSymbol'
        }).format(amount).replace('$', currency);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="General Ledger" />

            <div className="min-h-[calc(100vh-80px)] w-full pb-6 flex flex-col">
                {/* Header & Filter Section */}
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="font-semibold text-2xl text-slate-800 leading-tight flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <BookOpen size={24} />
                        </div>
                        General Ledger
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

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col">
                    
                    {accounts.length === 0 ? (
                        <div className="bg-white h-full shadow-sm sm:rounded-2xl flex flex-col items-center justify-center text-slate-400 border border-slate-200">
                            <div className="bg-slate-50 p-6 rounded-full mb-6 ring-8 ring-slate-50/50">
                                <BookOpen size={48} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2 tracking-tight">No Ledger Activity</h3>
                            <p className="text-slate-500 max-w-sm text-center">There are no transactions recorded for the selected period. Try adjusting your date range.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-6 pb-6 items-start">
                            {/* Left Sidebar - Account List */}
                            <div className="w-full md:w-72 lg:w-80 bg-white shadow-sm sm:rounded-2xl border border-slate-200 flex flex-col flex-shrink-0 sticky top-6 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            placeholder="Search accounts..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-white border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-brand-500 shadow-sm transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex-grow bg-slate-50/30">
                                    {filteredAccounts.map((account) => (
                                        <button 
                                            key={account.id}
                                            onClick={() => setSelectedAccountId(account.id)}
                                            className={`w-full text-left p-4 flex items-center justify-between transition-all border-b border-slate-100 last:border-0 ${
                                                selectedAccountId === account.id 
                                                ? 'bg-white shadow-[inset_4px_0_0_0_#2563eb] z-10 relative' 
                                                : 'hover:bg-white hover:shadow-sm'
                                            }`}
                                        >
                                            <div className="pr-4">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{account.code}</span>
                                                    <span className={`text-[10px] uppercase font-black tracking-widest ${
                                                        account.type === 'asset' ? 'text-blue-600' :
                                                        account.type === 'liability' ? 'text-red-600' :
                                                        account.type === 'equity' ? 'text-purple-600' :
                                                        account.type === 'revenue' ? 'text-emerald-600' : 'text-orange-600'
                                                    }`}>{account.type}</span>
                                                </div>
                                                <h4 className={`font-semibold text-sm truncate ${selectedAccountId === account.id ? 'text-slate-900' : 'text-slate-700'}`}>{account.name}</h4>
                                            </div>
                                            <ChevronRight size={16} className={`flex-shrink-0 transition-transform ${selectedAccountId === account.id ? 'text-brand-600 translate-x-1' : 'text-slate-300'}`} />
                                        </button>
                                    ))}
                                    {filteredAccounts.length === 0 && (
                                        <div className="p-8 text-center text-sm text-slate-500">
                                            No accounts match your search.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Content - Ledger Details */}
                            <div className="w-full flex-1 bg-white shadow-sm sm:rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
                                {selectedAccount ? (
                                    <>
                                        {/* Account Header */}
                                        <div className="p-6 md:p-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6 bg-gradient-to-br from-white to-slate-50/50 border-b border-slate-200">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-brand-50 border border-brand-100 text-brand-700 px-2.5 py-0.5 rounded-md text-xs font-black tracking-widest font-mono">
                                                        {selectedAccount.code}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{selectedAccount.type}</span>
                                                </div>
                                                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedAccount.name}</h3>
                                            </div>
                                            <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
                                                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                                    <TrendingUp size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ending Balance</p>
                                                    <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(selectedAccount.ending_balance)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ledger Lines */}
                                        <div className="flex-grow overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest"><span className="flex items-center gap-1.5"><Calendar size={12}/> Date</span></th>
                                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest"><span className="flex items-center gap-1.5"><Hash size={12}/> Ref</span></th>
                                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest"><span className="flex items-center gap-1.5"><FileText size={12}/> Description</span></th>
                                                        <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest"><span className="flex items-center justify-end gap-1.5">Debit <ArrowRight size={12}/></span></th>
                                                        <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest"><span className="flex items-center justify-end gap-1.5"><ArrowLeft size={12}/> Credit</span></th>
                                                        <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Running Balance</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-slate-100">
                                                    {selectedAccount.lines.map((line, index) => (
                                                        <tr key={line.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{formatDate(line.date)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono tracking-wide">{line.reference}</td>
                                                            <td className="px-6 py-4 text-sm text-slate-700 font-medium">{line.description || '-'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-700">
                                                                {parseFloat(line.debit) > 0 ? formatCurrency(line.debit) : <span className="text-slate-300">-</span>}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-700">
                                                                {parseFloat(line.credit) > 0 ? formatCurrency(line.credit) : <span className="text-slate-300">-</span>}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900 bg-slate-50/50 group-hover:bg-brand-50/30 transition-colors">
                                                                {formatCurrency(line.balance)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                                            <FileText size={32} className="text-slate-300" />
                                        </div>
                                        <p className="font-medium text-slate-500">Select an account to view its ledger</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #94a3b8;
                }
            `}} />
        </AuthenticatedLayout>
    );
}
