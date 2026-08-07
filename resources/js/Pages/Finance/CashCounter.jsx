import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { 
    Coins, 
    Unlock, 
    Lock, 
    Calendar, 
    User, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Scale, 
    FileText, 
    AlertCircle, 
    CheckCircle2, 
    History 
} from 'lucide-react';

export default function CashCounter({ 
    auth, 
    activeSession, 
    cashSales = 0, 
    cashDeposits = 0, 
    cashWithdrawals = 0, 
    previousSessions = [] 
}) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';

    const openForm = useForm({
        opening_balance: '',
        notes: ''
    });

    const closeForm = useForm({
        closing_balance: '',
        notes: ''
    });

    const submitOpen = (e) => {
        e.preventDefault();
        openForm.post(route('finance.cash-counter.open'), {
            onSuccess: () => {
                openForm.reset();
            }
        });
    };

    const submitClose = (e) => {
        e.preventDefault();
        closeForm.post(route('finance.cash-counter.close', activeSession.id), {
            onSuccess: () => {
                closeForm.reset();
            }
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'narrowSymbol'
        }).format(amount).replace('$', currency);
    };

    // Calculate expected balance dynamically
    const openingBalance = activeSession ? parseFloat(activeSession.opening_balance) : 0;
    const expectedBalance = openingBalance + cashSales + cashDeposits - cashWithdrawals;

    // Discrepancy calculations for live preview
    const closingInput = parseFloat(closeForm.data.closing_balance) || 0;
    const liveDiscrepancy = closeForm.data.closing_balance !== '' ? closingInput - expectedBalance : 0;

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Daily Cash Counter" />

            <div className="min-h-[calc(100vh-80px)] w-full pb-6 flex flex-col">
                {/* Header Section */}
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="font-semibold text-2xl text-slate-800 leading-tight flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <Coins size={24} />
                        </div>
                        Daily Cash Counter
                    </h2>
                </div>

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        
                        {/* Main Session Control Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {activeSession ? (
                                /* Open Session Controls */
                                <div className="bg-white p-6 shadow-sm sm:rounded-2xl border border-slate-200">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                            </span>
                                            <h3 className="text-lg font-bold text-slate-800">Cash Register is OPEN</h3>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session #{activeSession.id}</span>
                                    </div>

                                    {/* Live Stats Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Opening Cash Float</span>
                                            <span className="text-xl font-extrabold text-slate-800">{formatCurrency(openingBalance)}</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><ArrowUpRight size={12} className="text-emerald-500"/> Cash Sales</span>
                                            <span className="text-xl font-extrabold text-emerald-600">+{formatCurrency(cashSales)}</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><ArrowUpRight size={12} className="text-blue-500"/> Cash Deposits</span>
                                            <span className="text-xl font-extrabold text-blue-600">+{formatCurrency(cashDeposits)}</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><ArrowDownLeft size={12} className="text-rose-500"/> Cash Drops</span>
                                            <span className="text-xl font-extrabold text-rose-600">-{formatCurrency(cashWithdrawals)}</span>
                                        </div>
                                    </div>

                                    {/* Expected Balance Banner */}
                                    <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-5 mb-8 flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest block mb-0.5">Calculated Expected Cash</span>
                                            <p className="text-xs font-medium text-slate-500">Opening Float + Cash Sales + Deposits - Drops</p>
                                        </div>
                                        <span className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(expectedBalance)}</span>
                                    </div>

                                    {/* Close Session Form */}
                                    <form onSubmit={submitClose} className="space-y-5">
                                        <h4 className="font-bold text-slate-700 text-sm border-t border-slate-100 pt-5">Close Counter & Reconcile Drawer</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Physical Cash Count ({currency})</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={closeForm.data.closing_balance}
                                                    onChange={e => closeForm.setData('closing_balance', e.target.value)}
                                                    className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 font-mono text-sm"
                                                    placeholder="0.00"
                                                    required
                                                />
                                                {closeForm.errors.closing_balance && <p className="mt-1 text-xs text-red-600">{closeForm.errors.closing_balance}</p>}
                                            </div>

                                            {/* Live Difference Display */}
                                            {closeForm.data.closing_balance !== '' && (
                                                <div className={`p-4 rounded-xl border flex flex-col justify-center ${
                                                    liveDiscrepancy === 0 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                                        : liveDiscrepancy < 0 
                                                            ? 'bg-rose-50 border-rose-200 text-rose-800' 
                                                            : 'bg-amber-50 border-amber-200 text-amber-800'
                                                }`}>
                                                    <span className="text-[10px] font-black uppercase tracking-widest block mb-0.5">Discrepancy / Difference</span>
                                                    <div className="flex items-center gap-1.5 font-black text-lg">
                                                        {liveDiscrepancy === 0 && <CheckCircle2 size={16}/>}
                                                        {liveDiscrepancy !== 0 && <AlertCircle size={16}/>}
                                                        {liveDiscrepancy > 0 ? '+' : ''}{formatCurrency(liveDiscrepancy)}
                                                        <span className="text-xs font-bold font-sans tracking-normal ml-1">
                                                            ({liveDiscrepancy === 0 ? 'Balanced' : liveDiscrepancy < 0 ? 'Shortage' : 'Overage'})
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Reconciliation Notes</label>
                                            <textarea
                                                value={closeForm.data.notes}
                                                onChange={e => closeForm.setData('notes', e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                                placeholder="Explain any shortages/overages or enter closing notes..."
                                                rows="3"
                                            />
                                            {closeForm.errors.notes && <p className="mt-1 text-xs text-red-600">{closeForm.errors.notes}</p>}
                                        </div>

                                        {liveDiscrepancy !== 0 && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-medium flex items-start gap-2">
                                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                                <span>
                                                    <strong>Note:</strong> Closing the register with a discrepancy will automatically post a general ledger reconciliation entry against your **Cash Short/Over** account to keep reports accurate.
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-3">
                                            <button
                                                type="submit"
                                                disabled={closeForm.processing}
                                                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 font-semibold shadow-sm transition-all text-sm disabled:opacity-50"
                                            >
                                                <Lock size={16} /> Close Register & Reconcile
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                /* Closed State: Open Drawer Form */
                                <div className="bg-white p-6 shadow-sm sm:rounded-2xl border border-slate-200">
                                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                                        <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                                            <Lock size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Register is Currently Closed</h3>
                                            <p className="text-xs text-slate-500 font-medium">Open a register session before checking out cash sales in the POS.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={submitOpen} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Opening Float (Drawer Cash) ({currency})</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={openForm.data.opening_balance}
                                                onChange={e => openForm.setData('opening_balance', e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 font-mono text-sm"
                                                placeholder="e.g. 100.00"
                                                required
                                            />
                                            {openForm.errors.opening_balance && <p className="mt-1 text-xs text-red-600">{openForm.errors.opening_balance}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Opening Notes</label>
                                            <textarea
                                                value={openForm.data.notes}
                                                onChange={e => openForm.setData('notes', e.target.value)}
                                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                                placeholder="e.g. Checked by manager; standard $100 float loaded."
                                                rows="3"
                                            />
                                            {openForm.errors.notes && <p className="mt-1 text-xs text-red-600">{openForm.errors.notes}</p>}
                                        </div>

                                        <div className="flex justify-end pt-3">
                                            <button
                                                type="submit"
                                                disabled={openForm.processing}
                                                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 font-semibold shadow-sm transition-all text-sm disabled:opacity-50"
                                            >
                                                <Unlock size={16} /> Open Register Session
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Session Metadata Side Card */}
                        <div className="space-y-6">
                            <div className="bg-slate-900 text-white p-6 shadow-sm sm:rounded-2xl flex flex-col justify-between h-full relative overflow-hidden">
                                <div className="absolute -right-16 -top-16 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                                <div className="absolute -left-16 -bottom-16 w-40 h-40 bg-brand-500/10 rounded-full blur-2xl"></div>
                                
                                <div>
                                    <h3 className="font-extrabold text-lg tracking-tight mb-4 flex items-center gap-2"><Scale size={18}/> Drawer Metadata</h3>
                                    <div className="space-y-4">
                                        <div className="border-b border-white/10 pb-3">
                                            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-0.5">Active Drawer User</span>
                                            <span className="text-sm font-semibold flex items-center gap-1.5"><User size={14}/> {auth.user.name} ({auth.user.role})</span>
                                        </div>
                                        <div className="border-b border-white/10 pb-3">
                                            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-0.5">Asset General Ledger Account</span>
                                            <span className="text-sm font-semibold font-mono">1001 - Cash on Hand</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-0.5">Discrepancy General Ledger Account</span>
                                            <span className="text-sm font-semibold font-mono">6005 - Cash Short/Over</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Previous Sessions / History */}
                    <div className="bg-white shadow-sm sm:rounded-2xl border border-slate-200 flex flex-col overflow-hidden mb-6">
                        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white flex items-center gap-3">
                            <History size={20} className="text-slate-400" />
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Session Reconciliation History</h3>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Opened</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Closed</th>
                                        <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Cashier</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Opening Float</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Expected Cash</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Physical Cash</th>
                                        <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Difference</th>
                                        <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {previousSessions.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center py-10 text-slate-400 font-medium">No previous register sessions found.</td></tr>
                                    ) : previousSessions.map(session => (
                                        <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={13} className="text-slate-400"/>
                                                    {new Date(session.opened_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                                {session.closed_at ? (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={13} className="text-slate-400"/>
                                                        {new Date(session.closed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-bold">{session.user?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium text-right">{formatCurrency(session.opening_balance)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium text-right">
                                                {session.expected_balance ? formatCurrency(session.expected_balance) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold text-right">
                                                {session.closing_balance ? formatCurrency(session.closing_balance) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-black">
                                                {session.status === 'open' ? '-' : (
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        parseFloat(session.discrepancy) === 0 
                                                            ? 'bg-emerald-50 text-emerald-700' 
                                                            : parseFloat(session.discrepancy) < 0 
                                                                ? 'bg-rose-50 text-rose-700' 
                                                                : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {parseFloat(session.discrepancy) > 0 ? '+' : ''}
                                                        {formatCurrency(session.discrepancy)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                                                    session.status === 'open' 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                    {session.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
