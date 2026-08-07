import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { Building2, Plus, Edit2, Trash2, X, Save, Phone, MapPin, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { useState } from 'react';
import Modal from '@/Components/Modal';

export default function Branches({ branches }) {
    const { auth } = usePage().props;
    const branchLimit = auth?.plan_limits?.max_branches;
    const isLimitReached = branchLimit?.reached;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
        address: '',
        phone: '',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingBranch(null);
        reset();
        clearErrors();
        setShowFormModal(true);
    };

    const openEditModal = (branch) => {
        setEditingBranch(branch);
        setData({
            name: branch.name,
            code: branch.code || '',
            address: branch.address || '',
            phone: branch.phone || '',
            is_active: branch.is_active,
        });
        clearErrors();
        setShowFormModal(true);
    };

    const closeModal = () => {
        setShowFormModal(false);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingBranch) {
            put(route('branches.update', { branch: editingBranch.id }), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('branches.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (branchId) => {
        if (confirm('Are you sure you want to delete this branch?')) {
            router.delete(route('branches.destroy', { branch: branchId }), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Branches" />

            <div className="flex flex-col space-y-6 w-full pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 flex items-center">
                            <Building2 className="w-6 h-6 mr-2.5 text-brand-600" />
                            Manage Branches
                        </h1>
                        <p className="mt-1 text-xs text-gray-500 font-medium">
                            Set up multiple branch outlets, manage their contact info, and toggle active statuses.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-1.5 text-xs self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Branch</span>
                    </button>
                </div>

                {/* Branches List */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {branches.length === 0 ? (
                        <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-12 text-center">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-gray-900 mb-1">No outlets created</h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                                Create branch outlets to split inventory records, staff operations, and sales metrics.
                            </p>
                            <button
                                onClick={openCreateModal}
                                className="bg-brand-55 text-brand-700 hover:bg-brand-100 font-bold py-2 px-4 rounded-xl text-xs transition-all"
                            >
                                Create First Outlet
                            </button>
                        </div>
                    ) : (
                        branches.map((branch) => (
                            <div key={branch.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between overflow-hidden">
                                <div className="p-5 space-y-4">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-black text-gray-900 truncate pr-2">{branch.name}</h3>
                                            <span className="text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-lg inline-block mt-1">
                                                Code: {branch.code || 'N/A'}
                                            </span>
                                        </div>
                                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                            branch.is_active 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                : 'bg-stone-50 text-stone-600 border-stone-100'
                                        }`}>
                                            {branch.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    {/* Info Block */}
                                    <div className="space-y-2 text-xs font-semibold text-gray-500">
                                        {branch.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{branch.phone}</span>
                                            </div>
                                        )}
                                        {branch.address && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{branch.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Bar */}
                                <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
                                    <button
                                        onClick={() => openEditModal(branch)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-150 transition-colors"
                                        title="Edit Branch"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(branch.id)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="Delete Branch"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create/Edit Branch Form Modal */}
            <Modal show={showFormModal} onClose={closeModal} maxWidth="md">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">
                                    {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    Configure outlet information
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isLimitReached && !editingBranch && (
                            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <span className="font-bold text-amber-900 block">Subscription Limit Reached</span>
                                    <span className="text-amber-700 block mt-0.5">
                                        You have reached your plan limit of {branchLimit?.limit} branch outlets. Please upgrade your subscription plan to add more outlets.
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

                        {/* Name */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                Branch Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                placeholder="Downtown Outlet"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Code */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                Branch Code / Tag
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                placeholder="DWTN"
                            />
                            {errors.code && (
                                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                Contact Phone
                            </label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                placeholder="+1 (555) 123-4567"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                Address Location
                            </label>
                            <textarea
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                rows="3"
                                placeholder="123 Main St, Suite 100, Cityville"
                            />
                            {errors.address && (
                                <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                            )}
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                            <div>
                                <h4 className="text-xs font-bold text-gray-900">Active Status</h4>
                                <p className="text-[10px] font-medium text-gray-500">Disabled branches are locked from orders.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-2.5 mt-6">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || (isLimitReached && !editingBranch)}
                            className="flex-1 bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>{processing ? 'Saving...' : 'Save Outlet'}</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
