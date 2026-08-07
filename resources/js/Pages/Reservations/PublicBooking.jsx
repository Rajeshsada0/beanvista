import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { ShoppingBag, Coffee, Plus, Minus, CheckCircle2, ChevronRight, X, Clock, MapPin, Trash2, ArrowLeft, Star, Phone, User, Calendar, Users } from 'lucide-react';
import { useState } from 'react';

export default function PublicBooking({ tables }) {
    // Get table ID from URL query if available
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedTableId = urlParams.get('tableId') || '';

    const { tenant_slug } = usePage().props;
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        customer_name: '',
        country_code: '+977',
        phone: '',
        guests_count: 2,
        booking_time: '',
        table_id: preselectedTableId,
    });

    const submit = (e) => {
        e.preventDefault();
        
        post(route('public.reserve.store', { tenant_slug }), {
            transform: (data) => ({
                ...data,
                phone: `${data.country_code} ${data.phone.replace(/\s+/g, '')}`
            }),
            onSuccess: () => {
                // Success handling
            }
        });
    };

    const InputWrapper = ({ label, icon: Icon, error, children }) => (
        <div className="group">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block ml-1 transition-colors group-focus-within:text-blue-600">
                {label}
            </label>
            <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none z-10">
                    <Icon className="w-5 h-5" />
                </div>
                {children}
            </div>
            {error && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{error}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fafafc] font-sans text-slate-900 pb-20">
            <Head title="Table Reservation" />

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => window.history.back()}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50">
                            <Coffee className="w-5 h-5" />
                        </div>
                        <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-800 uppercase hidden xs:block">Book A Table</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 pt-10 md:pt-16 pb-20">
                <div className="mb-10 md:mb-14 text-center">
                    <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                        <Star className="w-3.5 h-3.5 fill-blue-500" />
                        <span>Premium Dining Experience</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">Reserve your spot.</h2>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-sm md:text-base opacity-80">Planning a meal? Secure your favorite table in seconds with our online booking.</p>
                </div>

                <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 opacity-20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                    
                    <form onSubmit={submit} className="space-y-8 relative z-10">
                        <div className="space-y-6">
                            {/* Personal Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputWrapper label="Your Name" icon={User} error={errors.customer_name}>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all placeholder:text-slate-300 shadow-sm"
                                        placeholder="Full Name"
                                        value={data.customer_name}
                                        onChange={e => setData('customer_name', e.target.value)}
                                        required
                                    />
                                </InputWrapper>

                                <InputWrapper label="Phone Number" icon={Phone} error={errors.phone}>
                                    <div className="flex items-center">
                                        <div className="absolute left-14 top-1/2 -translate-y-1/2 flex items-center z-20">
                                            <select 
                                                value={data.country_code}
                                                onChange={e => setData('country_code', e.target.value)}
                                                className="bg-transparent border-none p-0 text-sm font-black text-blue-600 focus:ring-0 cursor-pointer appearance-none outline-none"
                                            >
                                                <option value="+977">🇳🇵 +977</option>
                                                <option value="+91">🇮🇳 +91</option>
                                                <option value="+1">🇺🇸 +1</option>
                                                <option value="+44">🇬🇧 +44</option>
                                                <option value="+61">🇦🇺 +61</option>
                                            </select>
                                            <div className="h-4 w-[1.5px] bg-blue-200/50 mx-3 rounded-full"></div>
                                        </div>
                                        <input 
                                            type="tel" 
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-36 pr-6 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all placeholder:text-slate-300 shadow-sm"
                                            placeholder="1 XXXXXX"
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            required
                                        />
                                    </div>
                                </InputWrapper>
                            </div>

                            {/* Booking Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputWrapper label="Date & Time" icon={Calendar} error={errors.booking_time}>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all cursor-pointer shadow-sm"
                                        value={data.booking_time}
                                        onChange={e => setData('booking_time', e.target.value)}
                                        required
                                    />
                                </InputWrapper>

                                <InputWrapper label="Guests" icon={Users} error={errors.guests_count}>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-10 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none cursor-pointer shadow-sm"
                                        value={data.guests_count}
                                        onChange={e => setData('guests_count', e.target.value)}
                                        required
                                    >
                                        {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n} People</option>)}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                                </InputWrapper>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block ml-1">Preferred Table</label>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 md:gap-4">
                                    {tables.map(table => (
                                        <button
                                            key={table.id}
                                            type="button"
                                            onClick={() => setData('table_id', table.id)}
                                            className={`p-4 rounded-2xl transition-all relative group/table ${
                                                data.table_id === table.id 
                                                ? 'bg-blue-600 ring-4 ring-blue-100 text-white scale-105 shadow-xl shadow-blue-200'
                                                : 'bg-white ring-1 ring-slate-100 text-slate-500 hover:ring-blue-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <p className="text-xs font-black uppercase mb-0.5">T{table.table_number}</p>
                                            <p className={`text-[8px] font-bold uppercase transition-opacity ${
                                                data.table_id === table.id ? 'opacity-50' : 'opacity-30'
                                            }`}>{table.capacity}p</p>
                                            {data.table_id === table.id && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-md">
                                                    <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {errors.table_id && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.table_id}</p>}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={processing}
                                className="w-full bg-blue-600 text-white rounded-3xl py-6 font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center space-x-3 group"
                            >
                                <span>{processing ? 'Processing...' : 'Confirm Reservation'}</span>
                                {!processing && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </button>
                            <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-widest opacity-60">By continuing you agree to our reservation terms</p>
                        </div>
                    </form>
                </div>

                <div className="mt-12 text-center">
                    <a 
                        href={`tel:${usePage().props.settings.support_phone?.replace(/\s+/g, '') || '+97714XXXXXX'}`}
                        className="inline-flex items-center space-x-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-200 transition-all active:scale-95 group/support"
                    >
                        <Phone className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Support: <span className="text-slate-900 ml-1 group-hover:text-blue-600 transition-colors">{usePage().props.settings.support_phone || '+977 1 4XXXXXX'}</span>
                        </p>
                    </a>
                </div>
            </main>

            {/* Success Overlay */}
            {wasSuccessful && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md duration-300">
                    <div className="bg-white rounded-[3.5rem] p-10 md:p-14 max-w-sm w-full text-center shadow-2xl duration-300 border border-white/20">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100 ring-8 ring-emerald-50">
                            <CheckCircle2 className="w-12 h-12" strokeWidth={2.5} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Reserved!</h3>
                        <p className="text-sm font-medium text-slate-500 mb-10 leading-relaxed">Your table is secured. We'll send you a confirmation text shortly. See you soon!</p>
                        <Link 
                            href="/"
                            className="block w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
