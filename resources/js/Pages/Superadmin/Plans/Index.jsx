import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, CreditCard } from 'lucide-react';

export default function Index({ plans }) {
    const { delete: destroy } = useForm();

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this plan?')) {
            destroy(route('superadmin.plans.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Subscription Plans" />

            <div className="w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center">
                            <CreditCard className="w-7 h-7 mr-3 text-blue-600" />
                            Subscription Plans
                        </h1>
                        <p className="mt-1 text-sm font-medium text-gray-500">Create and manage pricing plans for cafes.</p>
                    </div>
                    <Link
                        href={route('superadmin.plans.create')}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Plan
                    </Link>
                </div>

                {/* Mobile Cards */}
                <div className="block md:hidden space-y-4">
                    {plans.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500 font-medium">
                            No plans found. Create one to get started.
                        </div>
                    ) : plans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="font-black text-gray-900 text-base">{plan.name}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{plan.description || 'No description'}</div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${plan.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                    {plan.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                    {plan.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Monthly</div>
                                    <div className="text-sm font-black text-gray-900">${plan.price_monthly}</div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Yearly</div>
                                    <div className="text-sm font-black text-gray-900">${plan.price_yearly}</div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Trial Period</div>
                                    <div className="text-sm font-black text-gray-900">{plan.trial_days} days</div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Limits</div>
                                    <div className="text-[11px] font-medium text-gray-700 space-y-0.5 mt-0.5">
                                        <div>Branches: {plan.max_branches === -1 ? 'Unlimited' : plan.max_branches}</div>
                                        <div>Tables: {plan.max_tables === -1 ? 'Unlimited' : plan.max_tables}</div>
                                        <div>Accounts: {plan.max_accounts === -1 ? 'Unlimited' : plan.max_accounts}</div>
                                        <div>Staff: {plan.max_users === -1 ? 'Unlimited' : plan.max_users}</div>
                                        <div>Orders: {plan.max_orders_per_month === -1 ? 'Unlimited' : `${plan.max_orders_per_month}/mo`}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3 border-t border-gray-100">
                                <Link
                                    href={route('superadmin.plans.edit', plan.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black text-sm py-2 rounded-xl transition-colors"
                                >
                                    <Edit className="w-4 h-4" /> Edit
                                </Link>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-black text-sm py-2 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Plan Name</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Prices</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Trial Days</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Limits</th>
                                <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="py-4 px-6 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {plans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-gray-900">{plan.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{plan.description || 'No description'}</div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-sm font-bold text-gray-900">Monthly: ${plan.price_monthly}</div>
                                        <div className="text-xs text-gray-500">Yearly: ${plan.price_yearly}</div>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-600">
                                        {plan.trial_days} days
                                    </td>
                                    <td className="py-4 px-6 text-xs text-gray-600 font-medium">
                                        <div className="space-y-0.5">
                                            <div>Branches: {plan.max_branches === -1 ? 'Unlimited' : plan.max_branches}</div>
                                            <div>Tables: {plan.max_tables === -1 ? 'Unlimited' : plan.max_tables}</div>
                                            <div>Accounts: {plan.max_accounts === -1 ? 'Unlimited' : plan.max_accounts}</div>
                                            <div>Staff: {plan.max_users === -1 ? 'Unlimited' : plan.max_users}</div>
                                            <div>Orders: {plan.max_orders_per_month === -1 ? 'Unlimited' : `${plan.max_orders_per_month}/mo`}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${plan.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                            {plan.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={route('superadmin.plans.edit', plan.id)}
                                                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                                                title="Edit Plan"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(plan.id)}
                                                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                                title="Delete Plan"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {plans.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-gray-400 font-medium">
                                        No plans found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
