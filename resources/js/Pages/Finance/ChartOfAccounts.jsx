import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { AlertTriangle } from 'lucide-react';

export default function ChartOfAccounts({ auth, accounts }) {
    const { auth: sharedAuth } = usePage().props;
    const accountLimits = sharedAuth?.plan_limits?.max_accounts;
    const isLimitReached = accountLimits?.reached;

    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        type: 'asset',
        description: ''
    });

    const submitAccount = (e) => {
        e.preventDefault();
        post(route('finance.accounts.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            }
        });
    };
    // Group accounts by type
    const groupedAccounts = accounts.reduce((acc, account) => {
        if (!acc[account.type]) {
            acc[account.type] = [];
        }
        acc[account.type].push(account);
        return acc;
    }, {});

    const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Chart of Accounts</h2>}
        >
            <Head title="Chart of Accounts" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="bg-white p-6 shadow-sm sm:rounded-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-extrabold text-gray-900">General Ledger Accounts</h3>
                            <button 
                                onClick={() => setShowModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm"
                            >
                                + Add Account
                            </button>
                        </div>
                        
                        <div className="space-y-8">
                            {accountTypes.map(type => (
                                groupedAccounts[type] && groupedAccounts[type].length > 0 && (
                                    <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{type}s</h4>
                                        </div>
                                        <div className="divide-y divide-gray-100 bg-white">
                                            {groupedAccounts[type].map(account => (
                                                <div key={account.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center space-x-4">
                                                        <span className="text-sm font-black text-brand-600 bg-brand-50 px-2 py-1 rounded">{account.code}</span>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{account.name}</p>
                                                            {account.description && <p className="text-xs text-gray-500">{account.description}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-500 font-medium">
                                                        System ID: {account.id}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Account</h2>
                    <form onSubmit={submitAccount} className="space-y-4">
                        {isLimitReached && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <span className="font-bold text-amber-900 block">Subscription Limit Reached</span>
                                    <span className="text-amber-700 block mt-0.5">
                                        You have reached your plan limit of {accountLimits?.limit} GL financial accounts. Please upgrade your subscription plan to add more accounts.
                                    </span>
                                    <Link
                                        href={route('tenant.plan')}
                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-black mt-2 transition-colors"
                                    >
                                        Upgrade Plan →
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Account Name</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                placeholder="e.g. Cash in Bank"
                                required
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Account Code</label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={e => setData('code', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                placeholder="e.g. 1010"
                                required
                            />
                            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Account Type</label>
                            <select
                                value={data.type}
                                onChange={e => setData('type', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                required
                            >
                                <option value="asset">Asset</option>
                                <option value="liability">Liability</option>
                                <option value="equity">Equity</option>
                                <option value="revenue">Revenue</option>
                                <option value="expense">Expense</option>
                            </select>
                            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                rows="3"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                placeholder="Brief description of what this account tracks..."
                            ></textarea>
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || isLimitReached}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
                            >
                                Add Account
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
