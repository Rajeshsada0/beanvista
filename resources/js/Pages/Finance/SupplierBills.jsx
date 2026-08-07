import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { FileText, Plus, Calendar, Hash, Building2, CreditCard, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function SupplierBills({ auth, bills = [], suppliers = [], categories = [], cashAccounts = [] }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    const [showModal, setShowModal] = useState(false);
    const [payingBill, setPayingBill] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        supplier_id: '',
        bill_number: '',
        bill_date: '',
        due_date: '',
        total_amount: '',
        expense_category_id: ''
    });

    const paymentForm = useForm({
        amount: '',
        cash_account_id: '',
        notes: ''
    });

    const submitBill = (e) => {
        e.preventDefault();
        post(route('finance.supplier-bills.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            }
        });
    };

    const submitPayment = (e) => {
        e.preventDefault();
        paymentForm.post(route('finance.supplier-bills.pay', payingBill.id), {
            onSuccess: () => {
                setPayingBill(null);
                paymentForm.reset();
            }
        });
    };

    const generateBillNumber = () => {
        const sbBills = bills
            .map(b => b.bill_number)
            .filter(num => num && num.startsWith('SB-'));
        
        let nextNum = 1;
        if (sbBills.length > 0) {
            const numbers = sbBills.map(num => {
                const parts = num.split('-');
                return parts.length > 1 ? parseInt(parts[1], 10) : 0;
            }).filter(n => !isNaN(n));
            
            if (numbers.length > 0) {
                nextNum = Math.max(...numbers) + 1;
            }
        }
        
        const formattedNum = String(nextNum).padStart(4, '0');
        setData('bill_number', `SB-${formattedNum}`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'narrowSymbol'
        }).format(amount).replace('$', currency);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Supplier Bills" />

            <div className="min-h-[calc(100vh-80px)] w-full pb-6 flex flex-col">
                {/* Header Section */}
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="font-semibold text-2xl text-slate-800 leading-tight flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <FileText size={24} />
                        </div>
                        Supplier Bills <span className="text-sm font-medium text-slate-400 ml-2 hidden sm:inline">(Accounts Payable)</span>
                    </h2>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 font-semibold shadow-sm transition-all text-sm"
                        >
                            <Plus size={16} /> Log New Bill
                        </button>
                    </div>
                </div>

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col">
                    <div className="bg-white shadow-sm sm:rounded-2xl border border-slate-200 flex flex-col flex-1 overflow-hidden">
                        
                        <div className="flex-grow overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Hash size={14}/> Bill #</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                                        <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {bills.length === 0 ? (
                                        <tr><td colSpan="7" className="text-center py-12 text-slate-400 font-medium text-lg">No supplier bills found.</td></tr>
                                    ) : bills.map(bill => {
                                        const isOverdue = new Date(bill.due_date) < new Date() && bill.status !== 'paid';
                                        return (
                                        <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-600 font-bold font-mono tracking-wide">{bill.bill_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold flex items-center gap-2">
                                                <Building2 size={16} className="text-slate-400"/> {bill.supplier?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{bill.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500 font-medium'}`}>
                                                    {isOverdue && <AlertCircle size={14}/>} {bill.due_date}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900 text-right">
                                                <div>{formatCurrency(bill.total_amount)}</div>
                                                {parseFloat(bill.paid_amount) > 0 && (
                                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                        Paid: {formatCurrency(bill.paid_amount)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border 
                                                    ${bill.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                      bill.status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                    {bill.status === 'paid' && <CheckCircle2 size={12}/>}
                                                    {bill.status === 'partial' && <Clock size={12}/>}
                                                    {bill.status === 'unpaid' && <AlertCircle size={12}/>}
                                                    {bill.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {bill.status !== 'paid' && (
                                                    <button 
                                                        onClick={() => {
                                                            setPayingBill(bill);
                                                            paymentForm.setData({
                                                                amount: (parseFloat(bill.total_amount) - parseFloat(bill.paid_amount)).toFixed(2),
                                                                cash_account_id: cashAccounts.length > 0 ? cashAccounts[0].id : '',
                                                                notes: ''
                                                            });
                                                        }}
                                                        className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors font-bold text-xs uppercase tracking-wide"
                                                    >
                                                        <CreditCard size={14}/> Record Payment
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-2"><Plus size={20} className="text-brand-600"/> Log New Supplier Bill</h2>
                    <form onSubmit={submitBill} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Supplier</label>
                            <select
                                value={data.supplier_id}
                                onChange={e => setData('supplier_id', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                required
                            >
                                <option value="">Select a supplier...</option>
                                {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                            {errors.supplier_id && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.supplier_id}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Expense Account / Category</label>
                            <select
                                value={data.expense_category_id}
                                onChange={e => setData('expense_category_id', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                required
                            >
                                <option value="">Select an expense category...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.expense_category_id && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.expense_category_id}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Bill Number / Reference</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={data.bill_number}
                                    onChange={e => setData('bill_number', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 font-mono text-sm"
                                    placeholder="e.g. INV-2023-001"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={generateBillNumber}
                                    className="mt-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-colors whitespace-nowrap self-stretch flex items-center justify-center"
                                >
                                    Auto-Generate
                                </button>
                            </div>
                            {errors.bill_number && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.bill_number}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Bill Date</label>
                                <input
                                    type="date"
                                    value={data.bill_date}
                                    onChange={e => setData('bill_date', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                    required
                                />
                                {errors.bill_date && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.bill_date}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Due Date</label>
                                <input
                                    type="date"
                                    value={data.due_date}
                                    onChange={e => setData('due_date', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                    required
                                />
                                {errors.due_date && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.due_date}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Total Amount ({currency})</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.total_amount}
                                onChange={e => setData('total_amount', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 font-mono"
                                placeholder="0.00"
                                required
                            />
                            {errors.total_amount && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.total_amount}</p>}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Plus size={16}/> Save Bill
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal show={payingBill !== null} onClose={() => { setPayingBill(null); paymentForm.reset(); }} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                        <CreditCard size={20} className="text-brand-600"/> Record Payment
                    </h2>
                    {payingBill && (
                        <p className="text-sm text-slate-500 mb-5 font-medium">
                            Record a payment for bill <span className="font-bold text-slate-700 font-mono">{payingBill.bill_number}</span> from <span className="font-bold text-slate-700">{payingBill.supplier?.name || 'Unknown'}</span>.
                        </p>
                    )}
                    <form onSubmit={submitPayment} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                                Amount to Pay (Remaining: {formatCurrency(payingBill ? parseFloat(payingBill.total_amount) - parseFloat(payingBill.paid_amount) : 0)})
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={payingBill ? (parseFloat(payingBill.total_amount) - parseFloat(payingBill.paid_amount)).toFixed(2) : ''}
                                value={paymentForm.data.amount}
                                onChange={e => paymentForm.setData('amount', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 font-mono text-sm"
                                placeholder="0.00"
                                required
                            />
                            {paymentForm.errors.amount && <p className="mt-1.5 text-sm text-red-600 font-medium">{paymentForm.errors.amount}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Pay From (Cash/Bank Account)</label>
                            <select
                                value={paymentForm.data.cash_account_id}
                                onChange={e => paymentForm.setData('cash_account_id', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                required
                            >
                                <option value="">Select an account...</option>
                                {cashAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                                ))}
                            </select>
                            {paymentForm.errors.cash_account_id && <p className="mt-1.5 text-sm text-red-600 font-medium">{paymentForm.errors.cash_account_id}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Notes / Reference (Optional)</label>
                            <textarea
                                value={paymentForm.data.notes}
                                onChange={e => paymentForm.setData('notes', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm"
                                placeholder="e.g. Paid via bank transfer"
                                rows="3"
                            />
                            {paymentForm.errors.notes && <p className="mt-1.5 text-sm text-red-600 font-medium">{paymentForm.errors.notes}</p>}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setPayingBill(null); paymentForm.reset(); }}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={paymentForm.processing}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <CreditCard size={16}/> Record Payment
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
