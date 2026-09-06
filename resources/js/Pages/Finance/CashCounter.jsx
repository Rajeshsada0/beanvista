import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
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
    History,
    Plus,
    MinusCircle,
    PlusCircle,
    Receipt,
    Trash2,
    X,
    Tag
} from 'lucide-react';

export default function CashCounter({ 
    auth, 
    activeSession, 
    cashSales = 0, 
    cashDeposits = 0, 
    cashWithdrawals = 0, 
    counterExpenses = 0,
    counterCashIn = 0,
    expenseCategories = [],
    previousSessions = [] 
}) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';

    const [showTxnModal, setShowTxnModal] = useState(false);

    const openForm = useForm({
        opening_balance: '',
        notes: ''
    });

    const closeForm = useForm({
        closing_balance: '',
        notes: ''
    });

    const txnForm = useForm({
        type: 'cash_out',
        amount: '',
        notes: '',
        expense_category_id: ''
    });

    const handleOpenTxnModal = (type = 'cash_out') => {
        txnForm.setData({
            type: type,
            amount: '',
            notes: '',
            expense_category_id: ''
        });
        txnForm.clearErrors();
        setShowTxnModal(true);
    };

    const submitTxn = (e) => {
        e.preventDefault();
        txnForm.post(route('finance.cash-counter.transaction.store'), {
            preserveScroll: true,
            onSuccess: () => {
                txnForm.reset();
                setShowTxnModal(false);
            }
        });
    };

    const deleteTxn = (id) => {
        if (confirm('Are you sure you want to delete this drawer transaction? The associated business expense will also be reversed.')) {
            router.delete(route('finance.cash-counter.transaction.destroy', id), {
                preserveScroll: true
            });
        }
    };

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
    const expectedBalance = openingBalance + cashSales + cashDeposits + counterCashIn - cashWithdrawals - counterExpenses;

    // Discrepancy calculations for live preview
    const closingInput = parseFloat(closeForm.data.closing_balance) || 0;
    const liveDiscrepancy = closeForm.data.closing_balance !== '' ? closingInput - expectedBalance : 0;

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Daily Cash Counter" />

            <div className="min-h-[calc(100vh-80px)] w-full pb-6 flex flex-col">
                {/* Header Section */}
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-semibold text-2xl text-slate-800 leading-tight flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                                <Coins size={24} />
                            </div>
                            Daily Cash Counter & Drawer Uses
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            Track drawer opening float, cash sales, counter expenses (e.g. lemons, sugar, lighter), and shift reconciliations
                        </p>
                    </div>

                    {activeSession && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleOpenTxnModal('cash_out')}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                            >
                                <MinusCircle size={15} className="text-rose-600" />
                                <span>- Cash Out / Expense</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenTxnModal('cash_in')}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-extrabold transition-all shadow-sm"
                            >
                                <PlusCircle size={15} className="text-emerald-600" />
                                <span>+ Add Float / In</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        
                        {/* Main Session Control Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {activeSession ? (
                                /* Open Session Controls */
                                <div className="bg-white p-6 shadow-sm sm:rounded-2xl border border-slate-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                            </span>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">Cash Register is OPEN</h3>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session #{activeSession.id}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => handleOpenTxnModal('cash_out')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                <MinusCircle size={14} />
                                                <span>+ Add Cash Out</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Live Stats Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Opening Float</span>
                                            <span className="text-xl font-extrabold text-slate-800">{formatCurrency(openingBalance)}</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><ArrowUpRight size={12} className="text-emerald-500"/> Cash Sales</span>
                                            <span className="text-xl font-extrabold text-emerald-600">+{formatCurrency(cashSales)}</span>
                                        </div>
                                        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1 flex items-center gap-1"><ArrowDownLeft size={12} className="text-rose-500"/> Counter Expenses</span>
                                            <span className="text-xl font-extrabold text-rose-600">-{formatCurrency(counterExpenses)}</span>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><ArrowUpRight size={12} className="text-blue-500"/> Float Added</span>
                                            <span className="text-xl font-extrabold text-blue-600">+{formatCurrency(counterCashIn + cashDeposits)}</span>
                                        </div>
                                    </div>

                                    {/* Expected Balance Banner */}
                                    <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-5 mb-6 flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest block mb-0.5">Calculated Expected Drawer Cash</span>
                                            <p className="text-xs font-medium text-slate-500">Opening Float + Cash Sales + Float In - Counter Expenses</p>
                                        </div>
                                        <span className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(expectedBalance)}</span>
                                    </div>

                                    {/* Shift Counter Transactions & Daily Uses Table */}
                                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-8">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                            <div>
                                                <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                                    <Receipt size={16} className="text-brand-600" />
                                                    <span>Shift Counter Transactions & Daily Uses</span>
                                                </h4>
                                                <p className="text-[11px] font-medium text-slate-500">
                                                    Petty cash taken from drawer for supplies (e.g. lemons, sugar, lighter)
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenTxnModal('cash_out')}
                                                className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm flex items-center gap-1 self-start sm:self-auto transition-colors"
                                            >
                                                <MinusCircle size={13} /> Log Cash Out
                                            </button>
                                        </div>

                                        {activeSession.transactions && activeSession.transactions.length > 0 ? (
                                            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                                                <table className="min-w-full divide-y divide-slate-100">
                                                    <thead className="bg-slate-50/70">
                                                        <tr>
                                                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Time</th>
                                                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</th>
                                                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason / Purpose</th>
                                                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</th>
                                                            <th className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Staff</th>
                                                            <th className="px-4 py-2.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Amount</th>
                                                            <th className="px-4 py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider w-12"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {activeSession.transactions.map((txn) => (
                                                            <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-4 py-3 text-xs text-slate-500 font-medium whitespace-nowrap">
                                                                    {new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                        txn.type === 'cash_out' 
                                                                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                    }`}>
                                                                        {txn.type === 'cash_out' ? 'Cash Out' : 'Cash In'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-xs text-slate-800 font-bold max-w-xs">
                                                                    {txn.notes}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                                    <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">
                                                                        <Tag size={10} className="text-slate-400" />
                                                                        {txn.category?.name || 'General Expense'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-xs text-slate-600 font-medium whitespace-nowrap">
                                                                    {txn.user?.name || 'Staff'}
                                                                </td>
                                                                <td className={`px-4 py-3 text-xs font-black text-right whitespace-nowrap ${
                                                                    txn.type === 'cash_out' ? 'text-rose-600' : 'text-emerald-600'
                                                                }`}>
                                                                    {txn.type === 'cash_out' ? '-' : '+'}{formatCurrency(txn.amount)}
                                                                </td>
                                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteTxn(txn.id)}
                                                                        title="Delete transaction"
                                                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-6 text-center">
                                                <Receipt size={24} className="mx-auto text-slate-300 mb-1.5" />
                                                <p className="text-xs font-bold text-slate-600">No counter cash expenses logged for this session</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 max-w-md mx-auto">
                                                    If cash was taken out for items like lemons, sugar, lighter, click below to record it.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenTxnModal('cash_out')}
                                                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                                                >
                                                    <MinusCircle size={13} />
                                                    <span>+ Log Counter Cash Out</span>
                                                </button>
                                            </div>
                                        )}
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

            {/* Cash In / Out Transaction Modal */}
            <Modal show={showTxnModal} onClose={() => setShowTxnModal(false)} maxWidth="md">
                <form onSubmit={submitTxn} className="p-6">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                txnForm.data.type === 'cash_out' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                {txnForm.data.type === 'cash_out' ? <MinusCircle size={20} /> : <PlusCircle size={20} />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {txnForm.data.type === 'cash_out' ? 'Record Counter Cash Expense' : 'Add Cash In / Float'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {txnForm.data.type === 'cash_out' 
                                        ? 'Take cash out of the drawer for daily supplies (lemon, sugar, lighter, etc.)' 
                                        : 'Add additional cash float or change into the active register drawer'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowTxnModal(false)}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Type toggle */}
                        <div className="flex rounded-xl bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => txnForm.setData('type', 'cash_out')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                                    txnForm.data.type === 'cash_out'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <MinusCircle size={14} /> Cash Out (Expense / Daily Uses)
                            </button>
                            <button
                                type="button"
                                onClick={() => txnForm.setData('type', 'cash_in')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                                    txnForm.data.type === 'cash_in'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <PlusCircle size={14} /> Cash In (Add Float)
                            </button>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Amount ({currency}) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                                    {currency}
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    autoFocus
                                    placeholder="0.00"
                                    value={txnForm.data.amount}
                                    onChange={e => txnForm.setData('amount', e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 font-bold text-lg"
                                />
                            </div>
                            {txnForm.errors.amount && (
                                <p className="mt-1 text-xs text-rose-500 font-medium">{txnForm.errors.amount}</p>
                            )}
                        </div>

                        {/* Quick Preset Buttons for common amounts */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick:</span>
                            {[10, 20, 50, 100, 200, 500].map(amt => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => txnForm.setData('amount', amt.toString())}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                >
                                    +{amt}
                                </button>
                            ))}
                        </div>

                        {/* Reason / Notes */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Reason / Note <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={txnForm.data.type === 'cash_out' ? "e.g. Lemon, sugar, lighter, cleaning cloth" : "e.g. Added change from bank, extra small change float"}
                                value={txnForm.data.notes}
                                onChange={e => txnForm.setData('notes', e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 text-sm font-medium"
                            />
                            {txnForm.errors.notes && (
                                <p className="mt-1 text-xs text-rose-500 font-medium">{txnForm.errors.notes}</p>
                            )}

                            {/* Suggestion chips for fast cashier entry */}
                            {txnForm.data.type === 'cash_out' && (
                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-semibold text-slate-400 mr-0.5">Quick picks:</span>
                                    {['Lemon & sugar', 'Lighter / matches', 'Milk emergency', 'Drinking water bottle', 'Kitchen cleaning items', 'Ice bag', 'Packaging bags'].map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                                const current = txnForm.data.notes;
                                                txnForm.setData('notes', current ? `${current}, ${tag}` : tag);
                                            }}
                                            className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Category (Optional) */}
                        {txnForm.data.type === 'cash_out' && expenseCategories.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Expense Category <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <select
                                    value={txnForm.data.expense_category_id}
                                    onChange={e => txnForm.setData('expense_category_id', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-700 text-sm font-medium"
                                >
                                    <option value="">General Daily Counter Expense</option>
                                    {expenseCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowTxnModal(false)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={txnForm.processing}
                            className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 ${
                                txnForm.data.type === 'cash_out'
                                    ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
                                    : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                            }`}
                        >
                            {txnForm.processing ? 'Saving...' : txnForm.data.type === 'cash_out' ? 'Record Cash Out' : 'Save Cash In'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
