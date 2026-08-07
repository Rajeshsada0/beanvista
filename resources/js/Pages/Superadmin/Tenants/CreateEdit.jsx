import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Save, ArrowLeft } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function CreateEdit({ tenant, plans }) {
    const isEdit = !!tenant;
    const sub = tenant?.subscription;

    const { data, setData, post, processing, errors } = useForm({
        name: tenant?.name || '',
        slug: tenant?.slug || '',
        is_active: tenant?.is_active ?? true,
        _method: isEdit ? 'PUT' : 'POST',
        subscription: {
            plan_id: sub?.plan_id || '',
            status: sub?.status || 'trialing',
            billing_cycle: sub?.billing_cycle || 'monthly',
            amount_paid: sub?.amount_paid || 0,
        }
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            post(route('superadmin.tenants.update', tenant.id));
        } else {
            post(route('superadmin.tenants.store'));
        }
    };

    // Auto-generate slug from name
    const handleNameChange = (e) => {
        const name = e.target.value;
        setData('name', name);
        if (!isEdit) {
            setData('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={isEdit ? "Edit Cafe" : "New Cafe"} />

            <div className="flex flex-col space-y-8 w-full pb-10 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('superadmin.tenants.index')}
                            className="p-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">{isEdit ? 'Edit Cafe' : 'New Cafe'}</h1>
                            <p className="mt-1 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                                <Building2 className="w-4 h-4 mr-2 text-brand-500" />
                                {isEdit ? `Editing ${tenant.name}` : 'Register a new tenant'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                    <form onSubmit={submit} className="p-6 md:p-8 space-y-8">
                        
                        {/* Basic Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold border-b pb-2">Cafe Details</h3>
                            <div>
                                <InputLabel htmlFor="name" value="Cafe Name" className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={handleNameChange}
                                    className="mt-1 block w-full rounded-2xl border-gray-200 focus:border-brand-500 focus:ring-brand-500 font-bold"
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="slug" value="URL Slug" className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2" />
                                <TextInput
                                    id="slug"
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    className="mt-1 block w-full rounded-2xl border-gray-200 focus:border-brand-500 focus:ring-brand-500 font-bold"
                                    required
                                />
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Must be unique, used in URLs (e.g., yourdomain.com/slug/qro/1)</p>
                                <InputError message={errors.slug} className="mt-2" />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-gray-700">
                                    Active (Cafe is open and accessible)
                                </label>
                            </div>
                        </div>

                        {/* Subscription Details */}
                        <div className="space-y-6 pt-4">
                            <h3 className="text-lg font-bold border-b pb-2">Subscription & Billing</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="plan_id" value="Select Plan" />
                                    <select
                                        id="plan_id"
                                        value={data.subscription.plan_id}
                                        onChange={(e) => setData('subscription', { ...data.subscription, plan_id: e.target.value })}
                                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                                    >
                                        <option value="">-- No Plan / Free --</option>
                                        {plans && plans.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors['subscription.plan_id']} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="billing_cycle" value="Billing Cycle" />
                                    <select
                                        id="billing_cycle"
                                        value={data.subscription.billing_cycle}
                                        onChange={(e) => setData('subscription', { ...data.subscription, billing_cycle: e.target.value })}
                                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="3_months">3 Months</option>
                                        <option value="6_months">6 Months</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                    <InputError message={errors['subscription.billing_cycle']} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="status" value="Status" />
                                    <select
                                        id="status"
                                        value={data.subscription.status}
                                        onChange={(e) => setData('subscription', { ...data.subscription, status: e.target.value })}
                                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                                    >
                                        <option value="trialing">Trialing</option>
                                        <option value="active">Active</option>
                                        <option value="past_due">Past Due</option>
                                        <option value="expired">Expired</option>
                                        <option value="canceled">Canceled</option>
                                    </select>
                                    <InputError message={errors['subscription.status']} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="amount_paid" value="Amount Paid ($)" />
                                    <TextInput
                                        id="amount_paid"
                                        type="number"
                                        step="0.01"
                                        value={data.subscription.amount_paid}
                                        onChange={(e) => setData('subscription', { ...data.subscription, amount_paid: e.target.value })}
                                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Manual record of the payment collected.</p>
                                    <InputError message={errors['subscription.amount_paid']} className="mt-2" />
                                </div>
                            </div>
                            
                            {sub && (
                                <div className="bg-gray-50 p-4 rounded-xl border text-sm mt-4">
                                    <p><strong>Current Start Date:</strong> {new Date(sub.start_date).toLocaleDateString()}</p>
                                    <p><strong>Current Expires At:</strong> {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'N/A'}</p>
                                    <p className="text-xs text-gray-500 mt-1">Saving this form will update the start date to today and calculate the new expiration date based on the chosen billing cycle.</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex items-center justify-end border-t">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-brand-600 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                <span>{isEdit ? 'Update Cafe' : 'Create Cafe'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
