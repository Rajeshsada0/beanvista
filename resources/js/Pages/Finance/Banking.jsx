import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Landmark, Plus, Edit2, Trash2, Calendar, Hash, ArrowRightLeft, CreditCard, Wallet, Activity, CheckCircle2, CircleDashed, QrCode, X, Eye, Upload } from 'lucide-react';

export default function Banking({ auth, accounts, transactions }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    const [isAddingBank, setIsAddingBank] = useState(false);
    const [editingBank, setEditingBank] = useState(null);
    const [qrPreview, setQrPreview] = useState(null);
    const [previewQrModal, setPreviewQrModal] = useState({ isOpen: false, account: null });
    const { data, setData, processing, errors, reset } = useForm({
        account_name: '',
        bank_name: '',
        account_number: '',
        account_type: 'checking',
        balance: '',
        qr_code: null,
        remove_qr: false,
    });

    const submitBank = (e) => {
        e.preventDefault();
        if (editingBank) {
            router.post(route('finance.banking.update', editingBank.id), {
                ...data,
                _method: 'PUT',
            }, {
                forceFormData: true,
                onSuccess: () => {
                    setIsAddingBank(false);
                    setEditingBank(null);
                    setQrPreview(null);
                    reset();
                }
            });
        } else {
            router.post(route('finance.banking.store'), data, {
                forceFormData: true,
                onSuccess: () => {
                    setIsAddingBank(false);
                    setQrPreview(null);
                    reset();
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this bank account?')) {
            router.delete(route('finance.banking.destroy', id));
        }
    };

    const openEdit = (account) => {
        setEditingBank(account);
        setQrPreview(account.qr_code_url || null);
        setData({
            account_name: account.account_name,
            bank_name: account.bank_name || '',
            account_number: account.account_number || '',
            account_type: account.account_type || 'checking',
            balance: account.balance || '',
            qr_code: null,
            remove_qr: false,
        });
        setIsAddingBank(true);
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
            <Head title="Banking" />

            <div className="min-h-[calc(100vh-80px)] w-full pb-6 flex flex-col">
                {/* Header Section */}
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="font-semibold text-2xl text-slate-800 leading-tight flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <Landmark size={24} />
                        </div>
                        Bank Accounts & Reconciliation
                    </h2>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setEditingBank(null);
                                reset();
                                setIsAddingBank(true);
                            }}
                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 font-semibold shadow-sm transition-all text-sm"
                        >
                            <Plus size={16} /> Add Bank Account
                        </button>
                    </div>
                </div>

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col max-w-7xl">
                    
                    {/* Bank Accounts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {accounts.map(account => (
                            <div key={account.id} className="bg-white p-6 shadow-sm sm:rounded-2xl border border-slate-200 hover:shadow-md transition-shadow relative group flex flex-col h-full overflow-hidden">
                                {/* Decorative Gradient */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${
                                    account.account_type === 'checking' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                    account.account_type === 'cash' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                    'bg-gradient-to-r from-purple-500 to-pink-500'
                                }`}></div>

                                <div className="absolute top-5 right-5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(account)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(account.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${
                                            account.account_type === 'checking' ? 'bg-blue-50 text-blue-600' :
                                            account.account_type === 'cash' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-purple-50 text-purple-600'
                                        }`}>
                                            {account.account_type === 'checking' ? <Landmark size={20}/> : 
                                             account.account_type === 'cash' ? <Wallet size={20}/> : 
                                             <CreditCard size={20}/>}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 leading-tight pr-12">{account.account_name}</h3>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{account.bank_name || 'N/A'} {account.account_number ? `• ${account.account_number.slice(-4)}` : ''}</p>
                                        </div>
                                    </div>
                                    {account.qr_code_url && (
                                        <button
                                            type="button"
                                            onClick={() => setPreviewQrModal({ isOpen: true, account })}
                                            className="flex items-center gap-1 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg border border-brand-200 transition-colors shadow-xs shrink-0"
                                            title="View Payment QR Code"
                                        >
                                            <QrCode size={13} />
                                            <span>QR</span>
                                        </button>
                                    )}
                                </div>
                                
                                <div className="mt-auto pt-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Balance</span>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(account.balance)}</p>
                                </div>
                            </div>
                        ))}
                        {accounts.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-white shadow-sm sm:rounded-2xl border border-dashed border-slate-300">
                                <Landmark className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                <h3 className="text-lg font-bold text-slate-900">No bank accounts added</h3>
                                <p className="text-slate-500 font-medium">Add an account to start tracking transactions. They will be synced with your General Ledger.</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white shadow-sm sm:rounded-2xl border border-slate-200 flex flex-col flex-1 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white flex items-center gap-3">
                            <Activity size={20} className="text-brand-500" />
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Recent Transactions</h3>
                        </div>
                        <div className="flex-grow overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={14}/> Date</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Account</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Hash size={14}/> Reference</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {transactions.data.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-medium text-lg">No transactions found.</td></tr>
                                    ) : transactions.data.map(txn => (
                                        <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                                {new Date(txn.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-bold">{txn.bank_account?.account_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 capitalize font-semibold flex items-center gap-1.5">
                                                {txn.type === 'withdrawal' ? <ArrowRightLeft size={14} className="text-rose-500" /> : <ArrowRightLeft size={14} className="text-emerald-500" />}
                                                {txn.type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono text-xs tracking-wide">{txn.reference || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                                                    txn.status === 'reconciled' 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {txn.status === 'reconciled' ? <CheckCircle2 size={12}/> : <CircleDashed size={12}/>}
                                                    {txn.status}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-black text-right ${txn.type === 'withdrawal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {txn.type === 'withdrawal' ? '-' : '+'}{formatCurrency(txn.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {transactions.links && transactions.links.length > 3 && (
                        <div className="mt-6 flex items-center justify-center space-x-1.5 sm:space-x-2">
                            {transactions.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                                        link.active 
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                                        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}

                </div>
            </div>

            <Modal show={isAddingBank} onClose={() => { setIsAddingBank(false); setEditingBank(null); reset(); }} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                        {editingBank ? <><Edit2 size={20} className="text-brand-600"/> Edit Bank Account</> : <><Plus size={20} className="text-brand-600"/> Add Bank Account</>}
                    </h2>
                    <form onSubmit={submitBank} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Account Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Primary Checking"
                                value={data.account_name}
                                onChange={e => setData('account_name', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                required
                            />
                            {errors.account_name && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.account_name}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Bank Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Chase"
                                value={data.bank_name}
                                onChange={e => setData('bank_name', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Account Type</label>
                            <select
                                value={data.account_type}
                                onChange={e => setData('account_type', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                            >
                                <option value="checking">Checking/Bank Account</option>
                                <option value="cash">Cash Register (Drawer)</option>
                                <option value="online">Online Payment (e.g., Stripe)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Account Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 123456789"
                                value={data.account_number}
                                onChange={e => setData('account_number', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Opening Balance ({currency})</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={data.balance}
                                onChange={e => setData('balance', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 font-mono"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Payment QR Code (Optional)</label>
                            {qrPreview ? (
                                <div className="relative border-2 border-brand-200 bg-brand-50/50 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={qrPreview} 
                                            alt="QR Preview" 
                                            className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-200 p-1 shadow-sm"
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">Payment QR Attached</p>
                                            <p className="text-[11px] text-slate-500">Will be displayed during online customer checkout</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setData(d => ({ ...d, qr_code: null, remove_qr: true }));
                                            setQrPreview(null);
                                        }}
                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Remove QR Code"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/30 rounded-xl p-4 cursor-pointer transition-all group">
                                    <div className="p-2.5 rounded-full bg-slate-100 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-600 transition-colors mb-2">
                                        <QrCode size={22} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 group-hover:text-brand-600">Click to upload Payment QR Code</span>
                                    <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG or WEBP (Max 3MB)</span>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setData(d => ({ ...d, qr_code: file, remove_qr: false }));
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setQrPreview(ev.target.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="hidden" 
                                    />
                                </label>
                            )}
                            {errors.qr_code && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.qr_code}</p>}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setIsAddingBank(false); setEditingBank(null); setQrPreview(null); reset(); }}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {editingBank ? <><Edit2 size={16}/> Save Changes</> : <><Plus size={16}/> Add Account</>}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* QR Code Preview Modal */}
            <Modal show={previewQrModal.isOpen} onClose={() => setPreviewQrModal({ isOpen: false, account: null })} maxWidth="sm">
                {previewQrModal.account && (
                    <div className="p-6 text-center">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <div className="text-left">
                                <h3 className="font-bold text-slate-900 text-base">{previewQrModal.account.account_name}</h3>
                                <p className="text-xs text-slate-500">{previewQrModal.account.bank_name || 'Bank Account'}</p>
                            </div>
                            <button 
                                onClick={() => setPreviewQrModal({ isOpen: false, account: null })} 
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mb-4 shadow-inner">
                            <img 
                                src={previewQrModal.account.qr_code_url} 
                                alt="Payment QR" 
                                className="w-64 h-64 object-contain rounded-xl bg-white p-2 border border-slate-100 shadow-sm mx-auto"
                            />
                        </div>

                        <p className="text-xs font-semibold text-slate-600 mb-2">Scan to pay with any supported Mobile Banking app</p>
                        {previewQrModal.account.account_number && (
                            <p className="text-xs text-slate-400 font-mono">A/C: {previewQrModal.account.account_number}</p>
                        )}
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
