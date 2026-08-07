import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { 
    Activity, CheckCircle2, ChevronRight, CreditCard, 
    ArrowLeft, Upload, FileText, Calendar, CheckCircle, Clock, AlertTriangle, X
} from 'lucide-react';

export default function MyPlan({ plans, paymentMethods, pendingRequest, subscription, tenantTrial }) {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedCycle, setSelectedCycle] = useState('yearly'); // monthly, 3_months, 6_months, yearly, 24_months
    const [showPricing, setShowPricing] = useState(false);
    const [activeMethodId, setActiveMethodId] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        plan_id: '',
        billing_cycle: 'yearly',
        amount: 0,
        payment_method_id: '',
        reference_number: '',
        receipt: null,
        notes: ''
    });

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        // Default billing cycle logic
        let cycle = 'yearly';
        let price = plan.price_yearly;
        
        // If yearly price is 0 but monthly is not, default to monthly
        if (plan.price_yearly == 0 && plan.price_monthly > 0) {
            cycle = 'monthly';
            price = plan.price_monthly;
        }

        // For enterprise plan, if name contains "Enterprise" and has custom cycle, let's adapt:
        if (plan.name.toLowerCase().includes('enterprise') || plan.name.toLowerCase().includes('24')) {
            cycle = '24_months';
            price = plan.price_yearly; // Use price_yearly directly as seeded
        }

        setSelectedCycle(cycle);
        
        // Filter methods of type upi_qr as default if available
        const defaultMethod = paymentMethods.find(m => m.type === 'upi_qr') || paymentMethods[0];
        
        setData({
            plan_id: plan.id,
            billing_cycle: cycle,
            amount: price,
            payment_method_id: defaultMethod ? defaultMethod.id : '',
            reference_number: '',
            receipt: null,
            notes: ''
        });
        
        if (defaultMethod) {
            setActiveMethodId(defaultMethod.id);
        }
        setReceiptPreview(null);
    };

    const handleCycleChange = (cycle) => {
        setSelectedCycle(cycle);
        let price = 0;
        switch (cycle) {
            case 'monthly': price = selectedPlan.price_monthly; break;
            case '3_months': price = selectedPlan.price_3_months; break;
            case '6_months': price = selectedPlan.price_6_months; break;
            case 'yearly': price = selectedPlan.price_yearly; break;
            case '24_months': price = selectedPlan.price_yearly; break; // Use price_yearly directly as seeded
        }
        setData(d => ({ ...d, billing_cycle: cycle, amount: price }));
    };

    const handleMethodChange = (methodId) => {
        setActiveMethodId(methodId);
        setData('payment_method_id', methodId);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('receipt', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitCheckout = (e) => {
        e.preventDefault();
        post(route('tenant.plan.checkout'), {
            onSuccess: () => {
                setSelectedPlan(null);
                setShowPricing(false);
                reset();
            }
        });
    };

    const handleCancelRequest = (requestId) => {
        if (confirm('Are you sure you want to cancel this payment verification request?')) {
            post(route('tenant.plan.cancel-request', requestId));
        }
    };

    // Helper to calculate price and display label
    const getPlanCycleInfo = (plan) => {
        // Return structured pricing info
        if (plan.name.toLowerCase().includes('enterprise')) {
            return {
                price: plan.price_yearly || 4999,
                label: '/ 24 Months',
                cycle: '24_months'
            };
        } else if (plan.price_yearly > 0) {
            return {
                price: plan.price_yearly,
                label: '/ 12 Months',
                cycle: 'yearly'
            };
        } else {
            return {
                price: plan.price_monthly,
                label: '/ Month',
                cycle: 'monthly'
            };
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="My Subscription Plan" />

            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                
                {/* 1. CHECKOUT VIEW */}
                {selectedPlan ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setSelectedPlan(null)}
                                className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 bg-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-stone-600" />
                            </button>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-stone-900 uppercase flex items-center gap-2">
                                    <CreditCard className="w-6 h-6 text-brand-600" />
                                    Checkout Payment
                                </h1>
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-0.5">Secure Payment & Verification Panel</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Choose Payment Method Column (2/3 width on large screens) */}
                            <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 flex flex-col h-fit">
                                <h2 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-6">Choose Payment Method</h2>

                                {/* Tabs for payment methods */}
                                <div className="flex bg-stone-100 p-1.5 rounded-2xl mb-8 overflow-x-auto">
                                    {['upi_qr', 'bank_transfer', 'esewa'].map((type) => {
                                        const typeMethods = paymentMethods.filter(m => m.type === type);
                                        const typeLabels = {
                                            upi_qr: 'UPI / QR',
                                            bank_transfer: 'Bank Transfer',
                                            esewa: 'eSewa Wallet'
                                        };
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    // Select first method of this type
                                                    const method = typeMethods[0];
                                                    if (method) {
                                                        handleMethodChange(method.id);
                                                    } else {
                                                        setActiveMethodId(null);
                                                        setData('payment_method_id', '');
                                                    }
                                                }}
                                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                                                    (paymentMethods.find(m => m.id === activeMethodId)?.type === type)
                                                        ? 'bg-white text-stone-900 shadow-sm'
                                                        : 'text-stone-500 hover:text-stone-800'
                                                }`}
                                            >
                                                {typeLabels[type]}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Active payment method details */}
                                {activeMethodId ? (
                                    <div className="space-y-6">
                                        {paymentMethods.filter(m => m.id === activeMethodId).map((method) => (
                                            <div key={method.id} className="space-y-6 animate-in fade-in duration-200">
                                                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                                    <h3 className="font-extrabold text-stone-800 text-sm mb-2">{method.title}</h3>
                                                    <p className="text-xs text-stone-600 whitespace-pre-wrap font-mono leading-relaxed">
                                                        {method.details}
                                                    </p>
                                                </div>

                                                {method.qr_code_url && (
                                                    <div className="flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-3xl p-6 bg-stone-50/50">
                                                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Scan QR Code to Pay</span>
                                                        <img 
                                                            src={method.qr_code_url} 
                                                            alt="Payment QR Code" 
                                                            className="w-48 h-48 object-contain bg-white p-2 rounded-2xl shadow-sm border border-stone-100"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-stone-400 font-medium">
                                        No active payment method configured for this type by Admin.
                                    </div>
                                )}
                            </div>

                            {/* Order Summary & Proof Submission Column (1/3 width) */}
                            <div className="space-y-6">
                                {/* Order Summary */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4">Order Summary</h2>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-black text-stone-900 text-base">{selectedPlan.name}</h3>
                                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-0.5 capitalize">
                                                {selectedCycle.replace('_', ' ')} Access
                                            </p>
                                        </div>
                                        <div className="text-lg font-black text-brand-600">
                                            ₹{Number(data.amount).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Proof Form */}
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-5">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-stone-400">Upload Proof of Payment</h2>

                                    {/* Screenshot Upload Box */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Receipt Screenshot*</label>
                                        <div className="relative border-2 border-dashed border-stone-200 rounded-2xl hover:border-brand-500 transition-colors bg-stone-50/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer group">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                required
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                            />
                                            {receiptPreview ? (
                                                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-200">
                                                    <img 
                                                        src={receiptPreview} 
                                                        alt="Receipt Preview" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold font-sans">
                                                        Change Screenshot
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-stone-400 group-hover:text-brand-500 transition-colors mb-2" />
                                                    <p className="text-xs font-bold text-stone-700">Click to upload screenshot</p>
                                                    <p className="text-[10px] text-stone-400 mt-1">PNG, JPG or JPEG up to 5MB</p>
                                                </>
                                            )}
                                        </div>
                                        {errors.receipt && (
                                            <p className="text-xs text-red-500 mt-1 font-semibold">{errors.receipt}</p>
                                        )}
                                    </div>

                                    {/* Reference Number */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Transaction Reference Code*</label>
                                        <input 
                                            type="text" 
                                            value={data.reference_number}
                                            onChange={e => setData('reference_number', e.target.value)}
                                            required
                                            placeholder="Enter bank transfer reference number or transaction code"
                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:border-brand-500 focus:bg-white focus:outline-none"
                                        />
                                        {errors.reference_number && (
                                            <p className="text-xs text-red-500 mt-1 font-semibold">{errors.reference_number}</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Notes (Optional)</label>
                                        <textarea 
                                            rows={3}
                                            value={data.notes}
                                            onChange={e => setData('notes', e.target.value)}
                                            placeholder="Add transaction details or payment remarks..."
                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-xs focus:border-brand-500 focus:bg-white focus:outline-none"
                                        />
                                        {errors.notes && (
                                            <p className="text-xs text-red-500 mt-1 font-semibold">{errors.notes}</p>
                                        )}
                                    </div>

                                    {/* Submit */}
                                    <button 
                                        type="submit"
                                        disabled={processing || !activeMethodId}
                                        className="w-full py-4 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-[11px] md:text-xs shadow-lg shadow-brand-500/10 transition-all uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-wrap text-center"
                                    >
                                        <CheckCircle className="w-4 h-4 shrink-0" />
                                        <span className="whitespace-normal leading-tight">Submit Payment Verification</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                ) /* 2. PRICING / PLANS GRID */ : showPricing ? (
                    <div className="space-y-8 animate-in fade-in duration-200">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setShowPricing(false)}
                                        className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 bg-white transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-stone-600" />
                                    </button>
                                    <div>
                                        <h1 className="text-xl md:text-2xl font-black text-stone-900 uppercase">Plans & Pricing</h1>
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-0.5">Choose the perfect workspace subscription plan for your growing business operations.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Plans Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {plans.map((plan) => {
                                const cycleInfo = getPlanCycleInfo(plan);
                                const isCurrentPlan = subscription && subscription.plan_name === plan.name;
                                
                                return (
                                    <div 
                                        key={plan.id} 
                                        className={`bg-white rounded-3xl border p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all ${
                                            isCurrentPlan 
                                                ? 'border-red-500 ring-2 ring-red-500/20' 
                                                : 'border-stone-100 hover:shadow-md'
                                        }`}
                                    >
                                        {/* Current Active Ribbon */}
                                        {isCurrentPlan && (
                                            <div className="absolute top-0 right-0 bg-red-500 text-white font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                                                Current Active
                                            </div>
                                        )}

                                        <div>
                                            <div className="mb-6">
                                                <h3 className="font-extrabold text-stone-900 text-lg uppercase tracking-wide">{plan.name}</h3>
                                                <p className="text-xs text-stone-400 mt-1 min-h-[32px]">{plan.description}</p>
                                            </div>

                                            <div className="flex items-baseline gap-1 mb-8">
                                                <span className="text-3xl font-black text-stone-900">₹{Number(cycleInfo.price).toLocaleString()}</span>
                                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">{cycleInfo.label}</span>
                                            </div>

                                            <div className="border-t border-stone-100 pt-6 mb-8">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">What's Included</h4>
                                                <ul className="space-y-3">
                                                    {(Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features) : [])).map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-2.5 text-xs text-stone-600 font-semibold">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            disabled={isCurrentPlan}
                                            className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all uppercase tracking-wider ${
                                                isCurrentPlan
                                                    ? 'bg-stone-50 border border-stone-200 text-stone-400 cursor-default'
                                                    : 'bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-950/10'
                                            }`}
                                        >
                                            {isCurrentPlan ? 'Current Active Plan' : `Choose ${plan.name}`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) /* 3. CURRENT PLAN STATUS SUMMARY */ : (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-black text-stone-900">Subscription Plan</h1>
                                    <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest">Manage your CREMA.OS access</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                                    <Activity className="h-6 w-6" />
                                </div>
                            </div>

                            {/* Pending request display */}
                            {pendingRequest && (
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-amber-800 flex items-center gap-1.5">
                                                Verification Pending
                                            </h3>
                                            <p className="text-stone-700 text-xs font-bold mt-1">
                                                Verification is pending approval for <span className="font-extrabold text-stone-900">{pendingRequest.plan?.name}</span> (₹{Number(pendingRequest.amount).toLocaleString()}).
                                            </p>
                                            <p className="text-[10px] text-stone-400 mt-1">Ref Code: {pendingRequest.reference_number} • Submitted on {new Date(pendingRequest.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleCancelRequest(pendingRequest.id)}
                                        className="px-4 py-2 border border-amber-200 hover:bg-amber-100 text-amber-800 font-extrabold text-xs rounded-xl transition-colors shrink-0 uppercase tracking-wider"
                                    >
                                        Cancel Request
                                    </button>
                                </div>
                            )}

                            {/* Rejected request history display */}
                            {/* If there's an active subscription, display details */}
                            {subscription && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-8">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                                                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800">
                                                    Active Paid Subscription
                                                </h3>
                                            </div>
                                            <p className="text-2xl font-black text-emerald-900">
                                                {subscription.plan_name}
                                            </p>
                                            <p className="text-xs text-emerald-700/80 font-bold mt-1">
                                                Billing cycle: {subscription.billing_cycle.replace('_', ' ')} • Paid: ₹{Number(subscription.amount_paid).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block">Expires On</span>
                                            <span className="text-sm font-black text-stone-900">{subscription.ends_at}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* If no subscription but trial exists */}
                            {!subscription && tenantTrial && (
                                <div className={`rounded-2xl p-6 border mb-8 ${tenantTrial.is_expired ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`flex h-2 w-2 rounded-full ${tenantTrial.is_expired ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`}></span>
                                                <h3 className={`text-xs font-black uppercase tracking-widest ${tenantTrial.is_expired ? 'text-red-800' : 'text-orange-800'}`}>
                                                    {tenantTrial.is_expired ? 'Trial Expired' : 'Active Free Trial'}
                                                </h3>
                                            </div>
                                            <p className={`text-2xl font-black ${tenantTrial.is_expired ? 'text-red-900' : 'text-orange-900'}`}>
                                                {tenantTrial.is_expired ? '0 Days Remaining' : `${tenantTrial.days_remaining} Days Remaining`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Plan Pricing View Toggle Box */}
                            <div className="mt-8 text-center p-12 border border-dashed border-stone-200 rounded-3xl bg-stone-50/30">
                                <h3 className="text-lg font-black text-stone-900">Subscription Management</h3>
                                <p className="text-stone-500 text-xs font-medium max-w-md mx-auto mt-2 leading-relaxed">
                                    {subscription 
                                        ? 'Upgrade, change or renew your current active workspace subscription.' 
                                        : 'Upgrade your workspace to a premium subscription plan and unlock all advanced POS, KDS, and Inventory management tools.'
                                    }
                                </p>
                                <button
                                    onClick={() => setShowPricing(true)}
                                    className="inline-flex items-center gap-2 mt-6 px-6 py-3.5 bg-stone-950 text-white text-xs font-extrabold rounded-2xl hover:bg-stone-850 transition-colors shadow-lg shadow-stone-950/15 uppercase tracking-wider"
                                >
                                    View Pricing Plans
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
