import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';

export default function JournalEntries({ auth, entries, accounts = [] }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || '$';
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        lines: [
            { account_id: '', description: '', debit: '', credit: '' },
            { account_id: '', description: '', debit: '', credit: '' }
        ]
    });

    const handleLineChange = (index, field, value) => {
        const newLines = [...data.lines];
        newLines[index][field] = value;
        setData('lines', newLines);
    };

    const addLine = () => {
        setData('lines', [...data.lines, { account_id: '', description: '', debit: '', credit: '' }]);
    };

    const removeLine = (index) => {
        if (data.lines.length <= 2) return; // Require at least 2 lines
        const newLines = [...data.lines];
        newLines.splice(index, 1);
        setData('lines', newLines);
    };

    const submitEntry = (e) => {
        e.preventDefault();
        
        transform((currentData) => ({
            ...currentData,
            lines: currentData.lines.map(line => ({
                ...line,
                debit: parseFloat(line.debit) || 0,
                credit: parseFloat(line.credit) || 0
            }))
        }));

        post(route('finance.journal-entries.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            }
        });
    };

    const totalDebits = data.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Journal Entries</h2>}
        >
            <Head title="Journal Entries" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="bg-white p-6 shadow-sm sm:rounded-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-extrabold text-gray-900">General Journal</h3>
                            <button 
                                onClick={() => setShowModal(true)}
                                className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 font-semibold shadow-sm transition-colors text-sm"
                            >
                                + Add Manual Entry
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {entries.data.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">No journal entries found.</p>
                            ) : entries.data.map(entry => (
                                <div key={entry.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                        <div>
                                            <span className="text-sm font-black text-gray-900 mr-4">{entry.date}</span>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{entry.reference || `JRNL-${entry.id}`}</span>
                                        </div>
                                        <span className="text-sm text-gray-600 font-medium">{entry.description}</span>
                                    </div>
                                    <div className="bg-white">
                                        <table className="min-w-full divide-y divide-gray-100">
                                            <thead>
                                                <tr className="bg-white">
                                                    <th className="px-6 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account</th>
                                                    <th className="px-6 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Debit</th>
                                                    <th className="px-6 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {entry.lines.map(line => (
                                                    <tr key={line.id} className="hover:bg-gray-50/50">
                                                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                                                            <span className={line.credit > 0 ? 'ml-6' : 'font-semibold'}>
                                                                {line.account?.code} - {line.account?.name}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right text-sm font-bold text-gray-900">
                                                            {line.debit > 0 ? `${currency}${parseFloat(line.debit).toFixed(2)}` : ''}
                                                        </td>
                                                        <td className="p-3 text-right text-sm font-bold text-gray-900">
                                                            {line.credit > 0 ? `${currency}${parseFloat(line.credit).toFixed(2)}` : ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination - Simple representation for now */}
                        {entries.last_page > 1 && (
                            <div className="mt-6 flex justify-between items-center bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-bold">{entries.from}</span> to <span className="font-bold">{entries.to}</span> of <span className="font-bold">{entries.total}</span> entries
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Create Journal Entry</h2>
                    <form onSubmit={submitEntry} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input
                                    type="date"
                                    value={data.date}
                                    onChange={e => setData('date', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                    required
                                />
                                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reference #</label>
                                <input
                                    type="text"
                                    value={data.reference}
                                    onChange={e => setData('reference', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                    placeholder="e.g. JRNL-001"
                                />
                                {errors.reference && <p className="mt-1 text-sm text-red-600">{errors.reference}</p>}
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <input
                                    type="text"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm"
                                    placeholder="e.g. End of month depreciation"
                                    required
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Account</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Description</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">Debit</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">Credit</th>
                                        <th className="px-3 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.lines.map((line, index) => (
                                        <tr key={index}>
                                            <td className="p-2">
                                                <select
                                                    value={line.account_id}
                                                    onChange={e => handleLineChange(index, 'account_id', e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-xs"
                                                    required
                                                >
                                                    <option value="">Select Account</option>
                                                    {accounts.map(acc => (
                                                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                    ))}
                                                </select>
                                                {errors[`lines.${index}.account_id`] && <p className="text-xs text-red-600 mt-1">{errors[`lines.${index}.account_id`]}</p>}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={line.description}
                                                    onChange={e => handleLineChange(index, 'description', e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-xs"
                                                    placeholder="Optional"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={line.debit}
                                                    onChange={e => {
                                                        handleLineChange(index, 'debit', e.target.value);
                                                        if (e.target.value) handleLineChange(index, 'credit', ''); // Clear credit if debit entered
                                                    }}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-xs text-right"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={line.credit}
                                                    onChange={e => {
                                                        handleLineChange(index, 'credit', e.target.value);
                                                        if (e.target.value) handleLineChange(index, 'debit', ''); // Clear debit if credit entered
                                                    }}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-xs text-right"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(index)}
                                                    disabled={data.lines.length <= 2}
                                                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                                                >
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan="2" className="p-3">
                                            <button
                                                type="button"
                                                onClick={addLine}
                                                className="text-xs font-bold text-brand-600 hover:text-brand-800"
                                            >
                                                + Add Line
                                            </button>
                                            {errors.lines && <p className="text-sm text-red-600 mt-2 font-bold">{errors.lines}</p>}
                                        </td>
                                        <td className="p-3 text-right font-bold text-sm text-gray-900">{currency}{totalDebits.toFixed(2)}</td>
                                        <td className="p-3 text-right font-bold text-sm text-gray-900">{currency}{totalCredits.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {!isBalanced && totalDebits > 0 && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-bold flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Out of balance by {currency}{Math.abs(totalDebits - totalCredits).toFixed(2)}. Debits must equal Credits.
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !isBalanced || totalDebits === 0}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50"
                            >
                                Post Entry
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
