import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Target, Plus, Calendar, Hash, TrendingUp, TrendingDown, Trash2, Crosshair, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export default function Budgets({ auth, budgets, accounts }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    const [isCreating, setIsCreating] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        start_date: '',
        end_date: '',
        description: '',
        items: []
    });

    const handleAddItem = () => {
        setData('items', [...data.items, { account_id: '', amount: '' }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData('items', newItems);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('finance.budgets.store'), {
            onSuccess: () => {
                setIsCreating(false);
                reset();
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

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Budgets" />

            <div className="min-h-[calc(100vh-80px)] w-full pb-6 flex flex-col">
                {/* Header Section */}
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="font-semibold text-2xl text-slate-800 leading-tight flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                            <Target size={24} />
                        </div>
                        Budgets & Planning
                    </h2>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 font-semibold shadow-sm transition-all text-sm"
                        >
                            <Plus size={16} /> Create New Budget
                        </button>
                    </div>
                </div>

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {budgets.length === 0 ? (
                            <div className="bg-white p-12 shadow-sm sm:rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                                <div className="p-6 bg-slate-50 rounded-full mb-6">
                                    <Target className="w-16 h-16 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">No active budgets</h3>
                                <p className="text-slate-500 font-medium text-lg max-w-md mx-auto mb-8">Set up a budget to track your business performance against planned goals.</p>
                                <button 
                                    onClick={() => setIsCreating(true)}
                                    className="bg-brand-600 text-white px-8 py-3 rounded-xl hover:bg-brand-700 font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
                                >
                                    <Plus size={20}/> Create your first budget
                                </button>
                            </div>
                        ) : budgets.map(budget => {
                            const isPositiveVariance = budget.total_variance >= 0;
                            return (
                            <div key={budget.id} className="bg-white shadow-sm sm:rounded-3xl overflow-hidden border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="bg-gradient-to-br from-slate-50 to-white p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl hidden sm:block">
                                            <Target size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">{budget.name}</h4>
                                            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-slate-500">
                                                <Calendar size={14} className="text-slate-400"/>
                                                {budget.start_date} <ArrowRightLeft size={12} className="text-slate-300"/> {budget.end_date}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right w-full md:w-auto bg-white md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border border-slate-100 md:border-none shadow-sm md:shadow-none">
                                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center md:justify-end gap-1.5">
                                            Overall Variance {isPositiveVariance ? <TrendingUp size={14} className="text-emerald-500"/> : <TrendingDown size={14} className="text-rose-500"/>}
                                        </div>
                                        <div className={`text-3xl font-black tracking-tight ${isPositiveVariance ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {isPositiveVariance ? '+' : '-'}{formatCurrency(Math.abs(budget.total_variance))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-6 sm:p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {budget.items.map(item => {
                                            const progress = Math.min((item.actual / item.amount) * 100, 100);
                                            const isOverBudget = item.actual > item.amount;
                                            const isPositive = item.variance >= 0;
                                            
                                            return (
                                                <div key={item.id} className="border border-slate-100 bg-slate-50/30 p-5 rounded-2xl hover:shadow-sm hover:border-slate-200 hover:bg-white transition-all group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="font-bold text-slate-800 pr-4">{item.account.name}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-end justify-between mb-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Actual</span>
                                                            <span className="font-black text-slate-900 text-lg leading-none">{formatCurrency(item.actual)}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Budget</span>
                                                            <span className="font-bold text-slate-500 leading-none">{formatCurrency(item.amount)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-slate-200 rounded-full h-2 mt-3 mb-2 overflow-hidden shadow-inner">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-brand-500'}`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                    
                                                    <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-slate-100">
                                                        <span className={`font-bold px-2 py-0.5 rounded ${isOverBudget ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {((item.actual / item.amount) * 100).toFixed(1)}% Used
                                                        </span>
                                                        <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'} flex items-center gap-1`}>
                                                            {isPositive ? 'Remaining' : 'Over by'} {formatCurrency(Math.abs(item.variance))}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            </div>

            <Modal show={isCreating} onClose={() => setIsCreating(false)} maxWidth="2xl">
                <form onSubmit={submit} className="p-6 md:p-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                            <Crosshair size={24}/>
                        </div>
                        Create New Budget
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Budget Name</label>
                            <input 
                                type="text" 
                                value={data.name} 
                                onChange={e => setData('name', e.target.value)}
                                className="block w-full border-slate-200 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 text-slate-900 font-semibold placeholder:font-normal" 
                                placeholder="e.g. Q3 Operational Budget"
                                required
                            />
                            {errors.name && <div className="text-red-500 text-xs mt-1.5 font-medium">{errors.name}</div>}
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                            <input 
                                type="date" 
                                value={data.start_date} 
                                onChange={e => setData('start_date', e.target.value)}
                                className="block w-full border-slate-200 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 text-slate-700" 
                                required
                            />
                            {errors.start_date && <div className="text-red-500 text-xs mt-1.5 font-medium">{errors.start_date}</div>}
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                            <input 
                                type="date" 
                                value={data.end_date} 
                                onChange={e => setData('end_date', e.target.value)}
                                className="block w-full border-slate-200 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 text-slate-700" 
                                required
                            />
                            {errors.end_date && <div className="text-red-500 text-xs mt-1.5 font-medium">{errors.end_date}</div>}
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Budget Items</label>
                            <button type="button" onClick={handleAddItem} className="text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                                <Plus size={14}/> Add Line Item
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {data.items.map((item, index) => (
                                <div key={index} className="flex gap-3 items-start group">
                                    <div className="flex-1">
                                        <select
                                            value={item.account_id}
                                            onChange={e => handleItemChange(index, 'account_id', e.target.value)}
                                            className="block w-full border-slate-200 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm font-medium"
                                            required
                                        >
                                            <option value="">Select Account...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-1/3">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-slate-400 font-bold">{currency}</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.amount}
                                                onChange={e => handleItemChange(index, 'amount', e.target.value)}
                                                className="block w-full pl-8 border-slate-200 rounded-xl shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm font-bold font-mono"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveItem(index)}
                                        className="mt-1.5 p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Remove item"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            ))}
                            {data.items.length === 0 && (
                                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm font-medium">
                                    <Target className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                    No accounts added yet.<br/>Click "Add Line Item" to start budgeting.
                                </div>
                            )}
                            {errors.items && <div className="text-red-500 text-xs mt-1.5 font-medium">{errors.items}</div>}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="bg-slate-100 py-2.5 px-6 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || data.items.length === 0}
                            className="bg-slate-900 border border-transparent rounded-xl shadow-sm py-2.5 px-6 text-sm font-bold text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 flex items-center gap-2"
                        >
                            <CheckCircle2 size={16}/> Save Budget
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
