import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save, ArrowLeft, Info, Check, Shield, DollarSign, Settings, ListPlus } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';

export default function CreateEdit({ plan }) {
    const isEdit = !!plan;
    const [activeTab, setActiveTab] = useState('basic');
    const [previewPeriod, setPreviewPeriod] = useState('monthly');

    const { data, setData, post, put, transform, processing, errors } = useForm({
        name: plan?.name || '',
        description: plan?.description || '',
        price_monthly: plan?.price_monthly || 0,
        price_3_months: plan?.price_3_months || 0,
        price_6_months: plan?.price_6_months || 0,
        price_yearly: plan?.price_yearly || 0,
        trial_days: plan?.trial_days || 0,
        max_branches: plan?.max_branches ?? -1,
        max_tables: plan?.max_tables ?? -1,
        max_accounts: plan?.max_accounts ?? -1,
        max_users: plan?.max_users ?? -1,
        max_orders_per_month: plan?.max_orders_per_month ?? -1,
        features: plan?.features 
            ? (Array.isArray(plan.features) 
                ? plan.features.join('\n') 
                : (() => {
                    try {
                        const parsed = JSON.parse(plan.features);
                        return Array.isArray(parsed) ? parsed.join('\n') : plan.features;
                    } catch(e) {
                        return plan.features;
                    }
                  })())
            : '',
        is_active: plan?.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        
        // Transform features string to array
        transform((data) => ({
            ...data,
            features: data.features.split('\n').filter(f => f.trim() !== '')
        }));

        if (isEdit) {
            put(route('superadmin.plans.update', plan.id));
        } else {
            post(route('superadmin.plans.store'));
        }
    };

    // Helper to toggle unlimited limits
    const handleLimitToggle = (field, isUnlimited) => {
        if (isUnlimited) {
            setData(field, -1);
        } else {
            setData(field, 5); // Default to a standard starting limit
        }
    };

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: Settings },
        { id: 'pricing', label: 'Pricing & Trial', icon: DollarSign },
        { id: 'limits', label: 'Resource Limits', icon: Shield },
        { id: 'features', label: 'Features List', icon: ListPlus },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={isEdit ? 'Edit Plan' : 'Add Plan'} />

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <Link href={route('superadmin.plans.index')} className="p-3 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl shadow-sm text-gray-500 hover:text-gray-700 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <span className="text-xs font-black tracking-widest uppercase text-blue-600">Superadmin Panel</span>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5">{isEdit ? 'Edit Plan' : 'Add New Plan'}</h2>
                        <p className="text-sm font-medium text-gray-500">Configure subscription plan pricing, limits, and premium features.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Form Left Side */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tab Selector */}
                        <div className="flex bg-gray-100/85 p-1 rounded-2xl border border-gray-200/50 backdrop-blur">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                                            activeTab === tab.id
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Form Panel */}
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden p-8 min-h-[550px] flex flex-col">
                            <form onSubmit={submit} className="flex-1 flex flex-col justify-between">
                                <div className="flex-1">
                                    {activeTab === 'basic' && (
                                    <div className="space-y-6">
                                        <div>
                                            <InputLabel htmlFor="name" value="Plan Name" className="text-gray-700 font-bold" />
                                            <TextInput
                                                id="name"
                                                type="text"
                                                name="name"
                                                value={data.name}
                                                className="mt-2 block w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl p-4 shadow-sm"
                                                placeholder="e.g. Pro Plan, Enterprise Plan"
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="description" value="Description" className="text-gray-700 font-bold" />
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={data.description}
                                                className="mt-2 block w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl p-4 shadow-sm"
                                                rows="4"
                                                placeholder="Describe the plan benefits and target audience..."
                                                onChange={(e) => setData('description', e.target.value)}
                                            />
                                            <InputError message={errors.description} className="mt-2" />
                                        </div>

                                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                                            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                                Plan name and description are visible to all tenants on their plan management page when comparing pricing options.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'pricing' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <InputLabel htmlFor="price_monthly" value="Monthly Price" className="text-gray-700 font-bold" />
                                                <div className="relative mt-2 rounded-2xl shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <span className="text-gray-400 font-bold text-sm">$</span>
                                                    </div>
                                                    <input
                                                        id="price_monthly"
                                                        type="number"
                                                        step="0.01"
                                                        name="price_monthly"
                                                        value={data.price_monthly}
                                                        className="block w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl pl-9 pr-4 py-4 text-gray-900 font-semibold transition-all shadow-sm"
                                                        onChange={(e) => setData('price_monthly', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.price_monthly} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="price_3_months" value="3 Months Price" className="text-gray-700 font-bold" />
                                                <div className="relative mt-2 rounded-2xl shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <span className="text-gray-400 font-bold text-sm">$</span>
                                                    </div>
                                                    <input
                                                        id="price_3_months"
                                                        type="number"
                                                        step="0.01"
                                                        name="price_3_months"
                                                        value={data.price_3_months}
                                                        className="block w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl pl-9 pr-4 py-4 text-gray-900 font-semibold transition-all shadow-sm"
                                                        onChange={(e) => setData('price_3_months', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.price_3_months} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="price_6_months" value="6 Months Price" className="text-gray-700 font-bold" />
                                                <div className="relative mt-2 rounded-2xl shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <span className="text-gray-400 font-bold text-sm">$</span>
                                                    </div>
                                                    <input
                                                        id="price_6_months"
                                                        type="number"
                                                        step="0.01"
                                                        name="price_6_months"
                                                        value={data.price_6_months}
                                                        className="block w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl pl-9 pr-4 py-4 text-gray-900 font-semibold transition-all shadow-sm"
                                                        onChange={(e) => setData('price_6_months', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.price_6_months} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="price_yearly" value="Yearly Price" className="text-gray-700 font-bold" />
                                                <div className="relative mt-2 rounded-2xl shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <span className="text-gray-400 font-bold text-sm">$</span>
                                                    </div>
                                                    <input
                                                        id="price_yearly"
                                                        type="number"
                                                        step="0.01"
                                                        name="price_yearly"
                                                        value={data.price_yearly}
                                                        className="block w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl pl-9 pr-4 py-4 text-gray-900 font-semibold transition-all shadow-sm"
                                                        onChange={(e) => setData('price_yearly', e.target.value)}
                                                    />
                                                </div>
                                                <InputError message={errors.price_yearly} className="mt-2" />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <InputLabel htmlFor="trial_days" value="Trial Period" className="text-gray-700 font-bold" />
                                                <div className="relative mt-2 rounded-2xl shadow-sm">
                                                    <input
                                                        id="trial_days"
                                                        type="number"
                                                        name="trial_days"
                                                        value={data.trial_days}
                                                        className="block w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl pl-4 pr-16 py-4 text-gray-900 font-semibold transition-all shadow-sm"
                                                        onChange={(e) => setData('trial_days', e.target.value)}
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                        <span className="text-gray-400 font-black text-xs tracking-wider uppercase">Days</span>
                                                    </div>
                                                </div>
                                                <InputError message={errors.trial_days} className="mt-2" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'limits' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Max Branches */}
                                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="font-bold text-gray-900 text-sm">Branches Limit</span>
                                                    <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_branches', true)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_branches === -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Unlimited
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_branches', false)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_branches !== -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Custom
                                                        </button>
                                                    </div>
                                                </div>
                                                {data.max_branches !== -1 ? (
                                                    <input
                                                        type="number"
                                                        value={data.max_branches}
                                                        className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 shadow-sm text-gray-900 font-semibold transition-all"
                                                        onChange={(e) => setData('max_branches', parseInt(e.target.value) || 0)}
                                                    />
                                                ) : (
                                                    <div className="py-2.5 px-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                                                        Unlimited Outlets Allowed
                                                    </div>
                                                )}
                                                <InputError message={errors.max_branches} className="mt-2" />
                                            </div>

                                            {/* Max Tables */}
                                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="font-bold text-gray-900 text-sm">Dining Tables Limit</span>
                                                    <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_tables', true)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_tables === -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Unlimited
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_tables', false)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_tables !== -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Custom
                                                        </button>
                                                    </div>
                                                </div>
                                                {data.max_tables !== -1 ? (
                                                    <input
                                                        type="number"
                                                        value={data.max_tables}
                                                        className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 shadow-sm text-gray-900 font-semibold transition-all"
                                                        onChange={(e) => setData('max_tables', parseInt(e.target.value) || 0)}
                                                    />
                                                ) : (
                                                    <div className="py-2.5 px-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                                                        Unlimited Dining Tables
                                                    </div>
                                                )}
                                                <InputError message={errors.max_tables} className="mt-2" />
                                            </div>

                                            {/* Max Accounts */}
                                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="font-bold text-gray-900 text-sm">GL Accounts Limit</span>
                                                    <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_accounts', true)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_accounts === -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Unlimited
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_accounts', false)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_accounts !== -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Custom
                                                        </button>
                                                    </div>
                                                </div>
                                                {data.max_accounts !== -1 ? (
                                                    <input
                                                        type="number"
                                                        value={data.max_accounts}
                                                        className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 shadow-sm text-gray-900 font-semibold transition-all"
                                                        onChange={(e) => setData('max_accounts', parseInt(e.target.value) || 0)}
                                                    />
                                                ) : (
                                                    <div className="py-2.5 px-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                                                        Unlimited Financial Accounts
                                                    </div>
                                                )}
                                                <InputError message={errors.max_accounts} className="mt-2" />
                                            </div>

                                            {/* Max Users */}
                                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="font-bold text-gray-900 text-sm">Staff Users Limit</span>
                                                    <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_users', true)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_users === -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Unlimited
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_users', false)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_users !== -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Custom
                                                        </button>
                                                    </div>
                                                </div>
                                                {data.max_users !== -1 ? (
                                                    <input
                                                        type="number"
                                                        value={data.max_users}
                                                        className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 shadow-sm text-gray-900 font-semibold transition-all"
                                                        onChange={(e) => setData('max_users', parseInt(e.target.value) || 0)}
                                                    />
                                                ) : (
                                                    <div className="py-2.5 px-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                                                        Unlimited Staff Users
                                                    </div>
                                                )}
                                                <InputError message={errors.max_users} className="mt-2" />
                                            </div>

                                            {/* Max Orders Per Month */}
                                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5 md:col-span-2">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div>
                                                        <span className="font-bold text-gray-900 text-sm block">Monthly Order Taking Limit</span>
                                                        <span className="text-xs text-gray-500">Maximum orders this cafe can create each calendar month.</span>
                                                    </div>
                                                    <div className="flex items-center bg-gray-200/50 p-0.5 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_orders_per_month', true)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_orders_per_month === -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Unlimited
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLimitToggle('max_orders_per_month', false)}
                                                            className={`text-xs px-2.5 py-1 rounded ${data.max_orders_per_month !== -1 ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
                                                        >
                                                            Custom
                                                        </button>
                                                    </div>
                                                </div>
                                                {data.max_orders_per_month !== -1 ? (
                                                    <input
                                                        type="number"
                                                        value={data.max_orders_per_month}
                                                        className="w-full border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-3 shadow-sm text-gray-900 font-semibold transition-all"
                                                        onChange={(e) => setData('max_orders_per_month', parseInt(e.target.value) || 0)}
                                                        placeholder="e.g. 50 orders / month"
                                                    />
                                                ) : (
                                                    <div className="py-2.5 px-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                                                        Unlimited Monthly Orders Allowed
                                                    </div>
                                                )}
                                                <InputError message={errors.max_orders_per_month} className="mt-2" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'features' && (
                                    <div className="space-y-6">
                                        <div>
                                            <InputLabel htmlFor="features" value="Features List (One feature per line)" className="text-gray-700 font-bold" />
                                            <textarea
                                                id="features"
                                                name="features"
                                                value={data.features}
                                                className="mt-2 block w-full border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl p-4 shadow-sm"
                                                rows="8"
                                                placeholder="Menu Management&#10;Advanced POS&#10;Inventory Tracking&#10;Realtime Analytics"
                                                onChange={(e) => setData('features', e.target.value)}
                                            />
                                            <InputError message={errors.features} className="mt-2" />
                                        </div>

                                        <div className="border-t pt-6">
                                            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900 block">Plan Status</span>
                                                    <span className="text-xs text-gray-500">Toggle whether this plan is visible to new tenants.</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setData('is_active', !data.is_active)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${data.is_active ? 'bg-emerald-500' : 'bg-gray-200'}`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${data.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                </div>

                                <div className="flex justify-between items-center border-t border-gray-100 pt-8 mt-6">
                                    <div className="text-xs font-semibold text-gray-400">
                                        Double check all configurations before saving.
                                    </div>
                                    <div className="flex gap-4">
                                        <PrimaryButton disabled={processing} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/25 border-none font-bold text-sm transition-all">
                                            <Save className="w-4 h-4" />
                                            {isEdit ? 'Update Plan' : 'Save Plan'}
                                        </PrimaryButton>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Live Preview Card */}
                    <div className="sticky top-6">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                            {/* Card Header Accent */}
                            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                            
                            <div className="p-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 py-1 px-3 rounded-full">
                                    Live Preview
                                </span>
                                
                                <h3 className="text-xl font-black text-gray-900 mt-4 truncate">
                                    {data.name || 'Plan Name Placeholder'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 min-h-[32px] line-clamp-2">
                                    {data.description || 'No description provided.'}
                                </p>

                                {/* Pricing Display */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    {/* Mini pricing tab selector in preview */}
                                    <div className="flex bg-gray-100 p-0.5 rounded-lg mb-3">
                                        {['monthly', '3_months', '6_months', 'yearly'].map((period) => (
                                            <button
                                                key={period}
                                                type="button"
                                                onClick={() => setPreviewPeriod(period)}
                                                className={`flex-1 text-[9px] font-extrabold uppercase py-1 rounded transition-all ${
                                                    previewPeriod === period
                                                        ? 'bg-white text-blue-600 shadow-sm font-black'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                            >
                                                {period === 'monthly' ? '1mo' : period === '3_months' ? '3mo' : period === '6_months' ? '6mo' : '1yr'}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                            $
                                            {previewPeriod === 'monthly'
                                                ? data.price_monthly || '0.00'
                                                : previewPeriod === '3_months'
                                                ? data.price_3_months || '0.00'
                                                : previewPeriod === '6_months'
                                                ? data.price_6_months || '0.00'
                                                : data.price_yearly || '0.00'}
                                        </span>
                                        <span className="text-gray-500 text-sm font-semibold ml-1">
                                            {previewPeriod === 'monthly'
                                                ? '/ month'
                                                : previewPeriod === '3_months'
                                                ? '/ 3 months'
                                                : previewPeriod === '6_months'
                                                ? '/ 6 months'
                                                : '/ year'}
                                        </span>
                                    </div>

                                    {parseInt(data.trial_days) > 0 && (
                                        <div className="mt-3">
                                            <span className="inline-flex text-[10px] font-bold text-indigo-700 bg-indigo-50 py-1 px-2.5 rounded-lg border border-indigo-100">
                                                {data.trial_days} days Free Trial
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Resource Limits */}
                                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Included Limits</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Outlets</div>
                                            <div className="text-gray-800">{data.max_branches === -1 ? 'Unlimited' : data.max_branches}</div>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Tables</div>
                                            <div className="text-gray-800">{data.max_tables === -1 ? 'Unlimited' : data.max_tables}</div>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">GL Accounts</div>
                                            <div className="text-gray-800">{data.max_accounts === -1 ? 'Unlimited' : data.max_accounts}</div>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Staff</div>
                                            <div className="text-gray-800">{data.max_users === -1 ? 'Unlimited' : data.max_users}</div>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl col-span-2">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Monthly Orders</div>
                                            <div className="text-gray-800 font-extrabold">{data.max_orders_per_month === -1 ? 'Unlimited Orders' : `${data.max_orders_per_month} orders / month`}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Key Features</h4>
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                        {data.features ? (
                                            data.features.split('\n').filter(f => f.trim() !== '').map((feature, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-gray-700 font-semibold">
                                                    <div className="p-0.5 bg-emerald-50 rounded text-emerald-600 shrink-0">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="truncate">{feature}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-gray-400 font-medium italic">No custom features listed.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
