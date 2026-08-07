import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import DangerButton from '@/Components/DangerButton';
import { Wallet, Plus, Tags, Calendar, Trash2, Edit2, Check, X } from 'lucide-react';

export default function Expenses({ auth, expenses, categories, paymentMethods }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        expense_category_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        payment_method_id: '',
        reference: '',
        notes: '',
    });

    const categoryForm = useForm({
        name: '',
    });

    const submitExpense = (e) => {
        e.preventDefault();
        post(route('expenses.store'), {
            onSuccess: () => {
                setShowAddModal(false);
                reset();
            },
        });
    };

    const submitCategory = (e) => {
        e.preventDefault();
        categoryForm.post(route('expenses.categories.store'), {
            onSuccess: () => {
                categoryForm.reset();
            }
        });
    };

    const startEditingCategory = (category) => {
        setEditingCategoryId(category.id);
        setEditCategoryName(category.name);
    };

    const saveCategoryEdit = (id) => {
        router.put(route('expenses.categories.update', id), { name: editCategoryName }, {
            preserveState: true,
            onSuccess: () => setEditingCategoryId(null),
        });
    };

    const cancelCategoryEdit = () => {
        setEditingCategoryId(null);
        setEditCategoryName('');
    };

    const deleteCategory = (id) => {
        if (confirm('Are you sure you want to delete this category?')) {
            router.delete(route('expenses.categories.destroy', id), {
                preserveState: true,
            });
        }
    };

    const deleteExpense = (id) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            router.delete(route('expenses.destroy', id));
        }
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
            <Head title="Expenses" />

            <div className="min-h-[calc(100vh-80px)] w-full pb-6 flex flex-col">
                {/* Header Section */}
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="font-semibold text-2xl text-slate-800 leading-tight flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <Wallet size={24} />
                        </div>
                        Expense Management
                    </h2>
                    
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowCategoryModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition-all text-sm">
                            <Tags size={16} /> Manage Categories
                        </button>
                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg hover:bg-slate-800 font-semibold shadow-sm transition-all text-sm">
                            <Plus size={16} /> Record Expense
                        </button>
                    </div>
                </div>

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col">
                    <div className="bg-white shadow-sm sm:rounded-2xl border border-slate-200 flex flex-col flex-1 overflow-hidden">
                        
                        <div className="flex-grow overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-white/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={14}/> Date</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Payment Method</th>
                                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
                                        <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {expenses.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-medium text-lg">No expenses recorded yet.</td></tr>
                                    ) : expenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{expense.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                                    <Tags size={12} className="text-slate-400"/>
                                                    {expense.category?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{expense.payment_method?.title || 'Cash/Other'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{expense.notes || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">{formatCurrency(expense.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button onClick={() => deleteExpense(expense.id)} className="text-slate-300 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            <Modal show={showAddModal} onClose={() => setShowAddModal(false)}>
                <form onSubmit={submitExpense} className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-2"><Plus size={20} className="text-brand-600"/> Record New Expense</h2>

                    <div className="space-y-5">
                        <div>
                            <InputLabel htmlFor="date" value="Date" className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5" />
                            <TextInput
                                id="date"
                                type="date"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                required
                            />
                            <InputError message={errors.date} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="expense_category_id" value="Category" className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5" />
                            <select
                                id="expense_category_id"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                value={data.expense_category_id}
                                onChange={(e) => setData('expense_category_id', e.target.value)}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.expense_category_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="amount" value={`Amount (${currency})`} className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5" />
                            <TextInput
                                id="amount"
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 font-mono"
                                placeholder="e.g. 50.00"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                required
                            />
                            <InputError message={errors.amount} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="payment_method_id" value="Payment Method (Optional)" className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5" />
                            <select
                                id="payment_method_id"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                value={data.payment_method_id}
                                onChange={(e) => setData('payment_method_id', e.target.value)}
                            >
                                <option value="">Cash / Other</option>
                                {paymentMethods.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                            <InputError message={errors.payment_method_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Notes" className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5" />
                            <TextInput
                                id="notes"
                                type="text"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                placeholder="e.g. Monthly electricity bill"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={processing} className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors flex items-center gap-2">
                            <Plus size={16}/> Record Expense
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Manage Category Modal */}
            <Modal show={showCategoryModal} onClose={() => setShowCategoryModal(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-2"><Tags size={20} className="text-brand-600"/> Manage Categories</h2>

                    <form onSubmit={submitCategory} className="mb-6 flex items-start gap-2">
                        <div className="flex-grow">
                            <TextInput
                                id="name"
                                type="text"
                                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                                placeholder="New category name..."
                                value={categoryForm.data.name}
                                onChange={(e) => categoryForm.setData('name', e.target.value)}
                                required
                            />
                            <InputError message={categoryForm.errors.name} className="mt-2" />
                        </div>
                        <button type="submit" disabled={categoryForm.processing} className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-colors h-[42px] flex items-center">Add</button>
                    </form>

                    <div className="mt-4 border border-slate-200 rounded-xl max-h-64 overflow-y-auto custom-scrollbar">
                        <table className="min-w-full divide-y divide-slate-200">
                            <tbody className="bg-white divide-y divide-slate-100">
                                {categories.map(cat => (
                                    <tr key={cat.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800 font-medium w-full">
                                            {editingCategoryId === cat.id ? (
                                                <TextInput
                                                    type="text"
                                                    value={editCategoryName}
                                                    onChange={e => setEditCategoryName(e.target.value)}
                                                    className="w-full text-sm py-1 px-2 rounded-lg border-brand-300 focus:ring-brand-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                cat.name
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            {editingCategoryId === cat.id ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => saveCategoryEdit(cat.id)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-md transition-colors" title="Save"><Check size={16}/></button>
                                                    <button onClick={cancelCategoryEdit} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-md transition-colors" title="Cancel"><X size={16}/></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => startEditingCategory(cat)} className="text-slate-400 hover:text-brand-600 hover:bg-brand-50 p-1.5 rounded-md transition-colors" title="Edit"><Edit2 size={16}/></button>
                                                    <button onClick={() => deleteCategory(cat.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Delete"><Trash2 size={16}/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan="2" className="px-4 py-6 text-sm text-slate-400 text-center font-medium">No categories found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button type="button" onClick={() => setShowCategoryModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Close</button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
