import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    CreditCard, Check, X, ShieldAlert, Plus, Edit2, Trash2, 
    Upload, Eye, ExternalLink, RefreshCw, AlertCircle, FileText
} from 'lucide-react';

export default function Index({ requests, methods }) {
    const [activeTab, setActiveTab] = useState('requests');
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [methodQrPreview, setMethodQrPreview] = useState(null);

    // Form for Payment Method CRUD
    const methodForm = useForm({
        type: 'upi_qr',
        title: '',
        details: '',
        qr_code: null,
        is_active: true
    });

    // Form for Rejection
    const rejectForm = useForm({
        rejection_reason: ''
    });

    const handleOpenAddMethod = () => {
        setEditingMethod(null);
        setMethodQrPreview(null);
        methodForm.setData({
            type: 'upi_qr',
            title: '',
            details: '',
            qr_code: null,
            is_active: true
        });
        setIsMethodModalOpen(true);
    };

    const handleOpenEditMethod = (method) => {
        setEditingMethod(method);
        setMethodQrPreview(null);
        methodForm.setData({
            type: method.type,
            title: method.title,
            details: method.details,
            qr_code: null,
            is_active: method.is_active
        });
        setIsMethodModalOpen(true);
    };

    const handleMethodFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            methodForm.setData('qr_code', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setMethodQrPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            methodForm.setData('qr_code', null);
            setMethodQrPreview(null);
        }
    };

    const handleSaveMethod = (e) => {
        e.preventDefault();
        
        if (editingMethod) {
            // Laravel requires _method=PUT to mock PUT/PATCH with files
            router.post(route('superadmin.payment-methods.update', editingMethod.id), {
                _method: 'PUT',
                ...methodForm.data
            }, {
                onSuccess: () => {
                    setIsMethodModalOpen(false);
                    methodForm.reset();
                }
            });
        } else {
            methodForm.post(route('superadmin.payment-methods.store'), {
                onSuccess: () => {
                    setIsMethodModalOpen(false);
                    methodForm.reset();
                }
            });
        }
    };

    const handleDeleteMethod = (id) => {
        if (confirm('Are you sure you want to delete this payment method?')) {
            router.delete(route('superadmin.payment-methods.destroy', id));
        }
    };

    const handleApprove = (id) => {
        if (confirm('Are you sure you want to APPROVE this payment request and activate/extend the subscription?')) {
            router.post(route('superadmin.verify-payments.approve', id));
        }
    };

    const handleOpenReject = (request) => {
        setSelectedRequest(request);
        rejectForm.setData({ rejection_reason: '' });
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = (e) => {
        e.preventDefault();
        rejectForm.post(route('superadmin.verify-payments.reject', selectedRequest.id), {
            onSuccess: () => {
                setIsRejectModalOpen(false);
                setSelectedRequest(null);
            }
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Verify Payments & Methods" />

            <div className="w-full pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center">
                            <CreditCard className="w-7 h-7 mr-3 text-brand-600" />
                            Verify Payments
                        </h1>
                        <p className="mt-1 text-sm font-medium text-gray-500">Verify tenant payment requests and configure manual payment methods.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'requests'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        PAYMENT REQUESTS ({requests.filter(r => r.status === 'pending').length} PENDING)
                    </button>
                    <button
                        onClick={() => setActiveTab('methods')}
                        className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'methods'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        PAYMENT METHODS ({methods.length})
                    </button>
                </div>

                {/* TAB 1: PAYMENT REQUESTS */}
                {activeTab === 'requests' && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Req ID</th>
                                        <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Company / Cafe</th>
                                        <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Plan Chosen</th>
                                        <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Payment Method</th>
                                        <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Reference / Notes</th>
                                        <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Receipt Image</th>
                                        <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="py-4 px-6 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {requests.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-gray-400 font-medium">
                                                No payment requests found.
                                            </td>
                                        </tr>
                                    ) : requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6 text-sm font-bold text-gray-700">
                                                #{req.id}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-gray-900">{req.tenant?.name}</div>
                                                <div className="text-xs text-gray-400">{req.tenant?.slug}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-gray-900">{req.plan?.name}</div>
                                                <div className="text-xs text-gray-500 capitalize">{req.billing_cycle.replace('_', ' ')} cycle</div>
                                                <div className="text-xs text-brand-600 font-bold">₹{Number(req.amount).toLocaleString()}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-gray-800">{req.payment_method?.title}</div>
                                                <div className="text-[10px] uppercase font-black tracking-wider text-gray-400">{req.payment_method?.type.replace('_', ' ')}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-mono text-xs text-stone-700 font-bold bg-stone-100 px-2 py-1 rounded w-fit">
                                                    Ref: {req.reference_number}
                                                </div>
                                                {req.notes && (
                                                    <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={req.notes}>
                                                        {req.notes}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {req.receipt_url ? (
                                                    <div 
                                                        onClick={() => setSelectedImage(req.receipt_url)}
                                                        className="relative w-12 h-12 mx-auto rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in group"
                                                    >
                                                        <img 
                                                            src={req.receipt_url} 
                                                            alt="Receipt Screenshot" 
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                            <Eye className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No Image</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                {req.status === 'pending' && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">
                                                        Pending
                                                    </span>
                                                )}
                                                {req.status === 'approved' && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        Approved
                                                    </span>
                                                )}
                                                {req.status === 'rejected' && (
                                                    <div className="flex flex-col">
                                                        <span className="inline-flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-black bg-red-50 text-red-700 border border-red-100">
                                                            Rejected
                                                        </span>
                                                        {req.rejection_reason && (
                                                            <span className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={req.rejection_reason}>
                                                                {req.rejection_reason}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {req.status === 'pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleApprove(req.id)}
                                                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                                                            title="Approve & Activate"
                                                        >
                                                            <Check className="w-4 h-4" strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenReject(req)}
                                                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                                                            title="Reject Verification"
                                                        >
                                                            <X className="w-4 h-4" strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Processed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 2: PAYMENT METHODS */}
                {activeTab === 'methods' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">Available Manual Payment Methods</h2>
                            <button
                                onClick={handleOpenAddMethod}
                                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-4 py-2.5 rounded-2xl shadow-md transition-all"
                            >
                                <Plus className="w-4 h-4" /> Add Payment Method
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {methods.length === 0 ? (
                                <div className="col-span-full bg-white rounded-3xl border border-gray-100 p-8 text-center text-gray-500 font-medium">
                                    No payment methods defined yet. Click "Add Payment Method" to create one.
                                </div>
                            ) : methods.map((method) => (
                                <div 
                                    key={method.id} 
                                    className={`bg-white rounded-3xl border shadow-sm p-6 flex flex-col justify-between transition-all ${
                                        method.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60 bg-gray-50/50'
                                    }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-extrabold text-gray-900 text-base">{method.title}</h3>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                                                    {method.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                                method.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-stone-100 text-stone-600'
                                            }`}>
                                                {method.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-2xl mb-4 font-mono leading-relaxed max-h-[150px] overflow-y-auto">
                                            {method.details}
                                        </p>

                                        {method.qr_code_url && (
                                            <div className="mb-4">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">QR Code Image</span>
                                                <img 
                                                    src={method.qr_code_url} 
                                                    alt="QR code" 
                                                    className="w-24 h-24 object-contain border border-gray-100 rounded-xl"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-gray-100 mt-2">
                                        <button
                                            onClick={() => handleOpenEditMethod(method)}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs py-2 rounded-xl transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMethod(method.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-2 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL: DEFINE / EDIT PAYMENT METHOD */}
            {isMethodModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-900">
                                {editingMethod ? 'EDIT PAYMENT METHOD' : 'DEFINE PAYMENT METHOD'}
                            </h3>
                            <button onClick={() => setIsMethodModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveMethod} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Payment Type*</label>
                                <select
                                    value={methodForm.data.type}
                                    onChange={e => methodForm.setData('type', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                                >
                                    <option value="upi_qr">UPI / QR Code</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="esewa">eSewa Wallet</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Title / Name*</label>
                                <input
                                    type="text"
                                    placeholder="e.g. NIC Asia Bank, Pay via UPI"
                                    value={methodForm.data.title}
                                    onChange={e => methodForm.setData('title', e.target.value)}
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Details / Payment Instructions*</label>
                                <textarea
                                    placeholder="Enter Bank Account Name, Number, Branch or UPI ID details here..."
                                    rows={4}
                                    value={methodForm.data.details}
                                    onChange={e => methodForm.setData('details', e.target.value)}
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">QR Code Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleMethodFileChange}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                                />
                                {methodQrPreview ? (
                                    <div className="mt-2 flex items-center gap-3">
                                        <img 
                                            src={methodQrPreview} 
                                            alt="New QR Code Preview" 
                                            className="w-16 h-16 object-contain border border-gray-200 rounded-xl bg-white p-1"
                                        />
                                        <div className="text-[10px] text-gray-400">
                                            <p className="font-bold text-gray-600">New QR Code Preview</p>
                                            <p>This image will be saved upon submission.</p>
                                        </div>
                                    </div>
                                ) : editingMethod?.qr_code_url ? (
                                    <div className="mt-2 flex items-center gap-3">
                                        <img 
                                            src={editingMethod.qr_code_url} 
                                            alt="Current QR Code" 
                                            className="w-16 h-16 object-contain border border-gray-200 rounded-xl bg-white p-1"
                                        />
                                        <div className="text-[10px] text-gray-400">
                                            <p className="font-bold text-gray-600">Current QR Code Image</p>
                                            <p>Upload a new file to replace it.</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active_chk"
                                    checked={methodForm.data.is_active}
                                    onChange={e => methodForm.setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                                <label htmlFor="is_active_chk" className="text-xs font-bold text-gray-700">Set Method as Active</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsMethodModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={methodForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-500/10 disabled:opacity-50"
                                >
                                    {methodForm.processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: REJECT TRANSACTION REQUEST */}
            {isRejectModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                                REJECT PAYMENT VERIFICATION
                            </h3>
                            <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                            <p className="text-xs text-gray-500">
                                Rejecting verification for payment request <span className="font-bold text-gray-800">#{selectedRequest.id}</span> by <span className="font-bold text-gray-800">{selectedRequest.tenant?.name}</span>.
                            </p>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Reason for Rejection*</label>
                                <textarea
                                    placeholder="Explain why this request is rejected (e.g. Reference number doesn't match, Receipt is invalid, Payment not received)..."
                                    rows={4}
                                    value={rejectForm.data.rejection_reason}
                                    onChange={e => rejectForm.setData('rejection_reason', e.target.value)}
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-bold text-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md shadow-red-500/10 disabled:opacity-50"
                                >
                                    {rejectForm.processing ? 'Rejecting...' : 'Reject Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LIGHTBOX FOR RECEIPT IMAGE */}
            {selectedImage && (
                <div 
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                >
                    <div className="relative max-w-3xl max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <img 
                            src={selectedImage} 
                            alt="Receipt Screenshot Big" 
                            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                            <a 
                                href={selectedImage} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                            <button 
                                onClick={() => setSelectedImage(null)}
                                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
