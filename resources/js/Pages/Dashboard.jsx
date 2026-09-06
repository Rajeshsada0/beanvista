import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router, Deferred, useForm } from '@inertiajs/react';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    Coffee,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Clock,
    LayoutGrid,
    ChevronRight,
    Activity,
    Calendar,
    LogOut,
    LogIn,
    Info,
    CheckCircle2,
    User,
    Banknote,
    Wifi,
    Timer,
    X,
    Lock,
    Unlock,
    MinusCircle,
    PlusCircle,
    Receipt,
    Plus,
    Tag
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Modal from '@/Components/Modal';

export default function Dashboard({ 
    stats, 
    recent_activity, 
    weekly_sales, 
    filters, 
    top_selling, 
    low_stock, 
    activeSession, 
    cashSales = 0, 
    cashDeposits = 0, 
    cashWithdrawals = 0,
    counterExpenses = 0,
    counterCashIn = 0,
    todayCounterExpenses = [],
    expenseCategories = []
}) {
    const { auth, settings, trial } = usePage().props;
    const currency = settings?.currency_symbol || 'रू.';
    const siteName = settings?.site_name || 'CaféOS';

    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [trialBannerVisible, setTrialBannerVisible] = useState(() => {
        return !sessionStorage.getItem('trial_banner_dismissed');
    });

    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showCashExpenseModal, setShowCashExpenseModal] = useState(false);

    // Form for opening register
    const openForm = useForm({
        opening_balance: '0',
        notes: '',
    });

    // Form for closing register
    const closeForm = useForm({
        closing_balance: '0',
        notes: '',
    });

    // Form for counter cash expense / float
    const cashExpenseForm = useForm({
        type: 'cash_out',
        amount: '',
        notes: '',
        expense_category_id: ''
    });

    const handleOpenExpenseModal = (type = 'cash_out') => {
        cashExpenseForm.setData({
            type: type,
            amount: '',
            notes: '',
            expense_category_id: ''
        });
        cashExpenseForm.clearErrors();
        setShowCashExpenseModal(true);
    };

    const submitCashExpense = (e) => {
        e.preventDefault();
        cashExpenseForm.post(route('finance.cash-counter.transaction.store'), {
            preserveScroll: true,
            onSuccess: () => {
                cashExpenseForm.reset();
                setShowCashExpenseModal(false);
            }
        });
    };

    const expectedBalance = useMemo(() => {
        if (!activeSession) return 0;
        return parseFloat(activeSession.opening_balance || 0) 
            + parseFloat(cashSales || 0) 
            + parseFloat(cashDeposits || 0) 
            - parseFloat(cashWithdrawals || 0)
            - parseFloat(counterExpenses || 0)
            + parseFloat(counterCashIn || 0);
    }, [activeSession, cashSales, cashDeposits, cashWithdrawals, counterExpenses, counterCashIn]);

    useEffect(() => {
        if (activeSession) {
            closeForm.setData('closing_balance', expectedBalance.toString());
        }
    }, [activeSession, expectedBalance]);

    const discrepancy = useMemo(() => {
        const actual = parseFloat(closeForm.data.closing_balance) || 0;
        return actual - expectedBalance;
    }, [closeForm.data.closing_balance, expectedBalance]);

    // Check auto-popup on mount
    useEffect(() => {
        if (auth.user.role === 'admin' && !activeSession) {
            const today = new Date().toLocaleDateString('en-CA');
            const dismissedDate = localStorage.getItem('cash_counter_popup_dismissed_date');
            if (dismissedDate !== today) {
                setShowRegisterModal(true);
            }
        }
    }, [activeSession]);

    const handleCloseModal = () => {
        setShowRegisterModal(false);
        if (!activeSession) {
            const today = new Date().toLocaleDateString('en-CA');
            localStorage.setItem('cash_counter_popup_dismissed_date', today);
        }
    };

    const handleOpenRegister = (e) => {
        e.preventDefault();
        openForm.post(route('finance.cash-counter.open'), {
            onSuccess: () => {
                setShowRegisterModal(false);
                openForm.reset();
            },
        });
    };

    const handleCloseRegister = (e) => {
        e.preventDefault();
        if (!activeSession) return;
        closeForm.post(route('finance.cash-counter.close', { session: activeSession.id }), {
            onSuccess: () => {
                setShowRegisterModal(false);
                closeForm.reset();
            },
        });
    };

    const dismissTrialBanner = () => {
        sessionStorage.setItem('trial_banner_dismissed', '1');
        setTrialBannerVisible(false);
    };

    const handleFilter = () => {
        router.get(route('dashboard'), {
            start_date: startDate,
            end_date: endDate
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Sync handled globally by AuthenticatedLayout

    // Auto-filter when dates change
    useEffect(() => {
        if (startDate !== filters.start_date || endDate !== filters.end_date) {
            handleFilter();
        }
    }, [startDate, endDate]);

    const formatCurrency = (amount) => {
        return `${currency} ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const calculateGrowth = (current, previous) => {
        if (!previous || previous === 0) return 100;
        return ((current - previous) / previous) * 100;
    };
    
    const formatDuration = (mins) => {
        if (!mins || mins === 0) return 'N/A';
        const days = Math.floor(mins / 1440);
        const hours = Math.floor((mins % 1440) / 60);
        const m = Math.round(mins % 60);
        
        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (m > 0 || (days === 0 && hours === 0)) result += `${m}m`;
        return result.trim();
    };

    const dailyGrowth = calculateGrowth(stats.today_sales, stats.yesterday_sales);

    // Dynamic scale for the chart
    const maxSales = useMemo(() => {
        if (!weekly_sales) return 1;
        return Math.max(...weekly_sales.map(s => s.total), 1);
    }, [weekly_sales]);

    const statCards = [
        {
            title: "Today's Revenue",
            value: formatCurrency(stats.today_sales),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            trend: dailyGrowth >= 0 ? 'up' : 'down',
            trendValue: `${Math.abs(dailyGrowth).toFixed(1)}%`,
            breakdown: [
                { label: 'Cash', value: formatCurrency(stats.today_cash || 0), icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50/80' },
                { label: 'Online', value: formatCurrency(stats.today_online || 0), icon: Wifi, color: 'text-blue-600', bg: 'bg-blue-50/80' },
            ]
        },
        {
            title: "Total Customers",
            value: stats.total_customers || 0,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            sub: "Loyalty Members"
        },
        {
            title: "Active Tables",
            value: stats.active_tables,
            icon: LayoutGrid,
            color: "text-brand-600",
            bg: "bg-brand-50",
            sub: `Out of ${stats.total_tables} total`
        },
        {
            title: "Monthly Sales",
            value: formatCurrency(stats.monthly_sales),
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
            sub: "Current Month"
        },
        {
            title: "Menu Items",
            value: stats.total_items,
            icon: Coffee,
            color: "text-orange-600",
            bg: "bg-orange-50",
            sub: "Active on Menu"
        },
        {
            title: "Avg Turnaround",
            value: formatDuration(stats.avg_turnaround_mins),
            icon: Timer,
            color: "text-amber-600",
            bg: "bg-amber-50",
            sub: "Today's avg service time"
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Analytics Dashboard" />

            {/* Trial Expired Lockout Overlay */}
            {trial?.is_expired && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/90 backdrop-blur-md p-4">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Trial Expired</h2>
                        <p className="text-gray-500 mb-8">Your 30-day free trial has expired. To continue using CREMA.OS and regain access to your dashboard, please select a subscription plan.</p>
                        <a href="/my-plan" className="block w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-colors">View Pricing Plans</a>
                    </div>
                </div>
            )}

            <div className="flex flex-col space-y-4 w-full pb-6">
                {/* Trial Active Banner */}
                {!trial?.is_expired && trial && trialBannerVisible && (
                    <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                <Info className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-900">Trial Period Active</h4>
                                <p className="text-[10px] font-medium text-gray-600">You have {trial.days_remaining} days remaining on your free trial.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href="/my-plan" className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors bg-white px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm">Upgrade &rarr;</a>
                            <button onClick={dismissTrialBanner} className="p-1 rounded-lg text-orange-400 hover:text-orange-600 hover:bg-orange-100 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Welcome Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">Dashboard Overview</h1>
                        <p className="mt-1 text-[10px] md:text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                            <span>{siteName} Performance Metrics</span>
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                        {/* Date Range Picker */}
                        <div className="flex items-center gap-3 bg-white border border-slate-200/80 shadow-sm rounded-2xl px-4 py-2 w-full sm:w-auto hover:border-slate-300 transition-all duration-300">
                            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-brand-50 text-brand-600 border border-brand-100/50 shadow-sm shrink-0">
                                <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 group cursor-pointer relative">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">From</span>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none p-0 text-[10px] font-bold text-slate-700 focus:ring-0 focus:outline-none cursor-pointer w-full leading-tight" />
                            </div>
                            <div className="flex items-center justify-center shrink-0">
                                <span className="text-slate-350 font-light text-sm px-1">→</span>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 group cursor-pointer relative">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">To</span>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none p-0 text-[10px] font-bold text-slate-700 focus:ring-0 focus:outline-none cursor-pointer w-full leading-tight" />
                            </div>
                        </div>

                        <div className="flex flex-col min-[480px]:flex-row items-stretch min-[480px]:items-center gap-2 w-full sm:w-auto">
                            {auth.user.role === 'admin' && (
                                <button onClick={() => setShowRegisterModal(true)}
                                    className={`flex-1 sm:flex-none border font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 text-xs ${
                                        activeSession 
                                            ? 'bg-emerald-50/60 border-emerald-100 text-emerald-750 hover:bg-emerald-100/80' 
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}>
                                    <span className="relative flex h-2 w-2 mr-0.5">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSession ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${activeSession ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                    </span>
                                    <span>Cash Counter: {activeSession ? 'Open' : 'Closed'}</span>
                                </button>
                            )}
                            {auth.user.role !== 'waiter' && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (!activeSession) {
                                            setShowRegisterModal(true);
                                        } else {
                                            handleOpenExpenseModal('cash_out');
                                        }
                                    }}
                                    className={`flex-1 sm:flex-none border font-bold py-2.5 px-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 text-xs ${
                                        activeSession 
                                            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300' 
                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                    }`}
                                    title={activeSession ? "Record petty cash expense from drawer (e.g. lemon, sugar, lighter)" : "Open cash register to record drawer expenses"}
                                >
                                    <MinusCircle className={`w-3.5 h-3.5 ${activeSession ? 'text-rose-600' : 'text-slate-400'}`} />
                                    <span>+ Cash Expense</span>
                                </button>
                            )}
                            <Link href={route('table-book')}
                                className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 text-xs">
                                <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                                <span>Table Book</span>
                            </Link>
                            <button onClick={() => window.location.href = route('table-book')}
                                className="flex-1 sm:flex-none bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm shadow-brand-500/20 hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-xs">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>New Order</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                    {statCards.map((stat, i) => (
                        <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col hover:shadow-md hover:border-slate-200/85 transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-2 rounded-xl border border-black/5 ${stat.bg} ${stat.color} flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]`}>
                                    <stat.icon className="w-4.5 h-4.5" strokeWidth={2.5} />
                                </div>
                                {stat.trend && (
                                    <div className={`flex items-center space-x-0.5 px-1.5 py-0.5 rounded-lg text-[9px] md:text-[10px] font-black ${stat.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                        {stat.trend === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                                        <span>{stat.trendValue}</span>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{stat.title}</h3>
                            <p className="text-base md:text-xl font-extrabold text-slate-800 mt-1 leading-tight">{stat.value}</p>
                            {stat.sub && (
                                <p className="text-[8px] md:text-[9px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wider">{stat.sub}</p>
                            )}
                            {stat.breakdown && (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {stat.breakdown.map((b, bi) => {
                                        const BIcon = b.icon;
                                        return (
                                            <div key={bi} className={`flex flex-col items-start p-1.5 rounded-lg border border-black/5 ${b.bg}`}>
                                                <div className={`flex items-center gap-1 mb-0.5 ${b.color}`}>
                                                    <BIcon className="w-2.5 h-2.5" strokeWidth={2.5} />
                                                    <span className="text-[7px] font-bold uppercase tracking-wider">{b.label}</span>
                                                </div>
                                                <span className={`text-[9px] md:text-[10px] font-bold ${b.color} leading-tight`}>{b.value}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Sales Trend Chart */}
                    <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden flex flex-col min-h-[320px] hover:shadow-md hover:border-slate-200/85 transition-all duration-300">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm md:text-base font-extrabold text-slate-800">Sales Trend</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Analytics for Selected Period</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Period Revenue</p>
                                <p className="text-sm md:text-xl font-extrabold text-brand-600 tracking-tighter leading-none">{formatCurrency(stats.total_sales)}</p>
                            </div>
                        </div>

                        <div className="px-4 pb-3 pt-2 flex-1 flex flex-col justify-end min-h-[220px]">
                            <Deferred data="weekly_sales" fallback={
                                <div className="h-full w-full flex items-end justify-between gap-2 px-2">
                                    {[...Array(7)].map((_, i) => (
                                        <div key={i} className="flex-1 bg-slate-50 animate-pulse rounded-t-lg" style={{ height: `${Math.random() * 40 + 20}%` }}></div>
                                    ))}
                                </div>
                            }>
                                <div className="flex items-end justify-between h-full gap-1.5 md:gap-3 px-1">
                                    {weekly_sales?.map((item, i) => {
                                        const heightPercent = (item.total / maxSales) * 100;
                                        const isToday = item.day === CarbonToday() && item.date === CarbonDate();
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center group h-full">
                                                <div className="relative w-full h-full flex flex-col justify-end">
                                                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-20 shadow-xl whitespace-nowrap font-black">
                                                        {formatCurrency(item.total)}
                                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 rotate-45"></div>
                                                    </div>
                                                    <div
                                                        style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                                        className={`w-full max-w-[36px] min-h-[4px] mx-auto rounded-t-lg cursor-pointer relative shadow-sm transition-all duration-300 hover:scale-x-[1.05] ${
                                                            isToday ? 'bg-brand-600 shadow-brand-200' : 'bg-gradient-to-t from-brand-100 to-brand-300 hover:from-brand-200 hover:to-brand-400'
                                                        }`}
                                                    >
                                                        {isToday && (
                                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                                                <span className="relative flex h-1.5 w-1.5">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-600"></span>
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-2.5 text-center">
                                                    <p className={`text-[10px] font-bold uppercase leading-none ${isToday ? 'text-brand-600 font-extrabold' : 'text-slate-700'}`}>{item.day}</p>
                                                    <p className="text-[8px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.date}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Deferred>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col hover:shadow-md hover:border-slate-200/85 transition-all duration-300">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-extrabold text-slate-800">Activity Feed</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Live Operation Log</p>
                                </div>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                            </div>
                        </div>

                        <div className="flex-1 px-4 py-3 space-y-4 overflow-y-auto max-h-[320px] relative no-scrollbar">
                            <div className="absolute left-[35px] top-3 bottom-3 w-px bg-slate-100"></div>

                            <Deferred data="recent_activity" fallback={
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-start space-x-3 animate-pulse">
                                            <div className="h-8 w-8 rounded-lg bg-slate-55"></div>
                                            <div className="flex-1 space-y-1.5 py-1">
                                                <div className="h-2 bg-slate-55 rounded w-1/4"></div>
                                                <div className="h-2.5 bg-slate-55 rounded w-3/4"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }>
                                {recent_activity?.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-50">
                                        <Activity className="w-8 h-8 text-slate-300 mb-1.5" />
                                        <p className="text-xs font-bold text-slate-400">System Ready</p>
                                    </div>
                                ) : (
                                    recent_activity?.map((item) => (
                                        <div key={item.id} className="relative flex items-start space-x-3 group">
                                            <div className="relative z-10">
                                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center border border-black/5 shadow-sm transition-all duration-300 group-hover:scale-[1.05] ${getIconStyles(item.icon_type)}`}>
                                                    {getActivityIconSm(item.icon_type)}
                                                </div>
                                            </div>
                                            <div className="flex-1 pt-0.5">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-brand-600 mb-0.5">{item.action}</p>
                                                    <p className="text-[9px] font-semibold text-slate-400 uppercase">{item.time_ago || item.time}</p>
                                                </div>
                                                <p className="text-[11px] font-semibold text-slate-700 leading-relaxed">{item.description}</p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-0.5">
                                                    <User className="w-2.5 h-2.5 text-slate-400" />
                                                    <span>
                                                        {typeof item.user === 'object' 
                                                            ? (item.user?.name || 'System') 
                                                            : (item.user || 'System')}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </Deferred>
                        </div>

                        <div className="px-4 py-2.5 border-t border-slate-100">
                            <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-widest">End of Recent Activity</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Top Selling Products */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col hover:shadow-md hover:border-slate-200/85 transition-all duration-300">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-800">Top Selling Products</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Most popular menu items by sales volume</p>
                            </div>
                        </div>
                        <div className="flex-1 p-4">
                            <Deferred data="top_selling" fallback={
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-xl animate-pulse">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
                                                <div className="space-y-1">
                                                    <div className="h-3 bg-slate-100 rounded w-24"></div>
                                                    <div className="h-2 bg-slate-100 rounded w-12"></div>
                                                </div>
                                            </div>
                                            <div className="h-3 bg-slate-100 rounded w-16"></div>
                                        </div>
                                    ))}
                                </div>
                            }>
                                {top_selling?.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-50">
                                        <Coffee className="w-8 h-8 text-slate-350 mb-1.5" />
                                        <p className="text-xs font-bold text-slate-400">No Sales Data</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {top_selling?.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 hover:bg-slate-50/70 border border-slate-100/50 rounded-2xl transition-all">
                                                <div className="flex items-center gap-3">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-brand-50 text-brand-650 border border-brand-100/40 rounded-xl flex items-center justify-center font-bold text-xs">
                                                            {item.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-800 leading-tight mb-0.5">{item.name}</h4>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-extrabold text-slate-800">{item.quantity} Sold</p>
                                                    <p className="text-[10px] font-bold text-brand-600">{formatCurrency(item.revenue)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Deferred>
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col hover:shadow-md hover:border-slate-200/85 transition-all duration-300">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-800">Low Stock Alerts</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Inventory items below warning threshold</p>
                            </div>
                            {low_stock?.length > 0 && (
                                <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-extrabold uppercase rounded-full border border-red-100 animate-pulse">
                                    {low_stock.length} Warnings
                                </span>
                            )}
                        </div>
                        <div className="flex-1 p-4">
                            <Deferred data="low_stock" fallback={
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-xl animate-pulse">
                                            <div className="space-y-1">
                                                <div className="h-3 bg-slate-100 rounded w-24"></div>
                                                <div className="h-2 bg-slate-100 rounded w-16"></div>
                                            </div>
                                            <div className="h-5 bg-slate-100 rounded w-16"></div>
                                        </div>
                                    ))}
                                </div>
                            }>
                                {low_stock?.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-500">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-650 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-800">All Items Stocked</h4>
                                        <p className="text-[10px] text-slate-450 mt-0.5">All inventory items are currently above threshold.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {low_stock?.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 hover:bg-slate-50/70 border border-slate-100/50 rounded-2xl transition-all">
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-800 leading-tight mb-0.5">{item.name}</h4>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Threshold: {item.threshold} {item.unit}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-bold border ${
                                                        item.stock <= 0 
                                                            ? 'bg-red-50 text-red-700 border-red-100' 
                                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                        {item.stock <= 0 ? 'Out of Stock' : `${item.stock} ${item.unit}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Deferred>
                        </div>
                    </div>

                    {/* Daily Counter Cash Expenses & Daily Uses */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col hover:shadow-md hover:border-slate-200/85 transition-all duration-300">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-800">Daily Cash Expenses</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Counter drawer uses (lemon, lighter, etc.)</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-extrabold rounded-full border border-rose-100">
                                    {formatCurrency(stats.today_cash_expenses || 0)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!activeSession) {
                                            setShowRegisterModal(true);
                                        } else {
                                            handleOpenExpenseModal('cash_out');
                                        }
                                    }}
                                    className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                    title="Quick Cash Out"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                            {todayCounterExpenses.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-500">
                                    <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2.5 border border-rose-100">
                                        <Receipt className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-800">No Counter Expenses</h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">
                                        No cash taken from drawer today for petty supplies.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!activeSession) {
                                                setShowRegisterModal(true);
                                            } else {
                                                handleOpenExpenseModal('cash_out');
                                            }
                                        }}
                                        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition-colors"
                                    >
                                        <Plus size={12} /> Record Cash Out
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
                                    {todayCounterExpenses.map((txn) => (
                                        <div key={txn.id} className="flex items-center justify-between p-2 hover:bg-slate-50/70 border border-slate-100/60 rounded-xl transition-all">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                                                    <MinusCircle size={14} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-bold text-slate-800 truncate" title={txn.notes}>
                                                        {txn.notes}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-medium">
                                                        <span>{txn.user?.name || 'Staff'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right pl-2 shrink-0">
                                                <span className="text-xs font-black text-rose-600">
                                                    -{formatCurrency(txn.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <Link
                                    href={route('finance.cash-counter')}
                                    className="text-[10px] font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
                                >
                                    <span>Cash Counter</span>
                                    <ChevronRight size={12} />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!activeSession) {
                                            setShowRegisterModal(true);
                                        } else {
                                            handleOpenExpenseModal('cash_out');
                                        }
                                    }}
                                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={12} />
                                    <span>+ Cash Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showRegisterModal} onClose={handleCloseModal} maxWidth="md">
                {activeSession ? (
                    // CLOSE CASH REGISTER
                    <form onSubmit={handleCloseRegister} className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Close Cash Register</h3>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        Session opened at {new Date(activeSession.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Cash Flow Summary */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                                <div className="flex justify-between text-xs font-medium text-gray-500">
                                    <span>Opening Balance</span>
                                    <span>{formatCurrency(activeSession.opening_balance)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-emerald-600">
                                    <span>+ Cash Sales</span>
                                    <span>+{formatCurrency(cashSales)}</span>
                                </div>
                                {counterCashIn > 0 && (
                                    <div className="flex justify-between text-xs font-medium text-emerald-600">
                                        <span>+ Counter Cash In</span>
                                        <span>+{formatCurrency(counterCashIn)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs font-medium text-blue-600">
                                    <span>+ Cash Deposits</span>
                                    <span>+{formatCurrency(cashDeposits)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-amber-600">
                                    <span>- Cash Withdrawals</span>
                                    <span>-{formatCurrency(cashWithdrawals)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-rose-600">
                                    <span>- Counter Cash Out / Expenses</span>
                                    <span>-{formatCurrency(counterExpenses)}</span>
                                </div>
                                <div className="h-px bg-gray-200 my-1"></div>
                                <div className="flex justify-between text-sm font-black text-gray-900">
                                    <span>Expected Drawer Balance</span>
                                    <span>{formatCurrency(expectedBalance)}</span>
                                </div>
                            </div>

                            {/* Actual Closing Balance Input */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                    Actual Closing Balance ({currency})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={closeForm.data.closing_balance}
                                    onChange={(e) => closeForm.setData('closing_balance', e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                    placeholder="0.00"
                                />
                                {closeForm.errors.closing_balance && (
                                    <p className="mt-1 text-xs text-red-600">{closeForm.errors.closing_balance}</p>
                                )}
                            </div>

                            {/* Discrepancy Indicator */}
                            <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                                discrepancy === 0
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    : discrepancy < 0
                                    ? 'bg-red-50 border-red-100 text-red-700'
                                    : 'bg-blue-50 border-blue-100 text-blue-700'
                            }`}>
                                {discrepancy === 0 ? (
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                ) : (
                                    <Info className="w-4 h-4 shrink-0" />
                                )}
                                <div className="text-xs font-bold leading-normal">
                                    {discrepancy === 0 && 'Drawer is balanced! No discrepancy found.'}
                                    {discrepancy < 0 && `Drawer is SHORT by ${formatCurrency(Math.abs(discrepancy))}.`}
                                    {discrepancy > 0 && `Drawer is OVER by ${formatCurrency(discrepancy)}.`}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                    Closing Notes
                                </label>
                                <textarea
                                    value={closeForm.data.notes}
                                    onChange={(e) => closeForm.setData('notes', e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                    rows="2"
                                    placeholder="Enter closing register notes..."
                                />
                                {closeForm.errors.notes && (
                                    <p className="mt-1 text-xs text-red-600">{closeForm.errors.notes}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2.5 mt-6">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={closeForm.processing}
                                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Lock className="w-3.5 h-3.5" />
                                <span>{closeForm.processing ? 'Closing...' : 'Close Cash Register'}</span>
                            </button>
                        </div>
                    </form>
                ) : (
                    // OPEN CASH REGISTER
                    <form onSubmit={handleOpenRegister} className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Unlock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Open Cash Register</h3>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                        Start a new daily session
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                    Opening Balance ({currency})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={openForm.data.opening_balance}
                                    onChange={(e) => openForm.setData('opening_balance', e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                    placeholder="0.00"
                                />
                                {openForm.errors.opening_balance && (
                                    <p className="mt-1 text-xs text-red-600">{openForm.errors.opening_balance}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                    Opening Notes
                                </label>
                                <textarea
                                    value={openForm.data.notes}
                                    onChange={(e) => openForm.setData('notes', e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                    rows="2"
                                    placeholder="Enter opening register notes..."
                                />
                                {openForm.errors.notes && (
                                    <p className="mt-1 text-xs text-red-600">{openForm.errors.notes}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2.5 mt-6">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={openForm.processing}
                                className="flex-1 bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>{openForm.processing ? 'Opening...' : 'Open Cash Register'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Quick Cash Expense / Counter Uses Modal */}
            <Modal show={showCashExpenseModal} onClose={() => setShowCashExpenseModal(false)} maxWidth="md">
                <form onSubmit={submitCashExpense} className="p-6">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                cashExpenseForm.data.type === 'cash_out' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                {cashExpenseForm.data.type === 'cash_out' ? <MinusCircle size={20} /> : <PlusCircle size={20} />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {cashExpenseForm.data.type === 'cash_out' ? 'Daily Counter Cash Expense' : 'Add Cash In / Float'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {cashExpenseForm.data.type === 'cash_out' 
                                        ? 'Record cash taken from counter for daily supplies (lemon, sugar, lighter, etc.)' 
                                        : 'Add additional cash float into the register drawer'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCashExpenseModal(false)}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Type toggle */}
                        <div className="flex rounded-xl bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => cashExpenseForm.setData('type', 'cash_out')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                                    cashExpenseForm.data.type === 'cash_out'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <MinusCircle size={14} /> Cash Out (Expense / Daily Uses)
                            </button>
                            <button
                                type="button"
                                onClick={() => cashExpenseForm.setData('type', 'cash_in')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                                    cashExpenseForm.data.type === 'cash_in'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <PlusCircle size={14} /> Cash In (Add Float)
                            </button>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Amount ({currency}) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                                    {currency}
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    autoFocus
                                    placeholder="0.00"
                                    value={cashExpenseForm.data.amount}
                                    onChange={e => cashExpenseForm.setData('amount', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 font-bold text-lg"
                                />
                            </div>
                            {cashExpenseForm.errors.amount && (
                                <p className="mt-1 text-xs text-rose-500 font-medium">{cashExpenseForm.errors.amount}</p>
                            )}
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick:</span>
                            {[10, 20, 50, 100, 200, 500].map(amt => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => cashExpenseForm.setData('amount', amt.toString())}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                >
                                    +{amt}
                                </button>
                            ))}
                        </div>

                        {/* Reason / Notes */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Reason / Note <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={cashExpenseForm.data.type === 'cash_out' ? "e.g. Lemon, sugar, lighter, cleaning cloth" : "e.g. Added change from bank, extra small change float"}
                                value={cashExpenseForm.data.notes}
                                onChange={e => cashExpenseForm.setData('notes', e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 text-sm font-medium"
                            />
                            {cashExpenseForm.errors.notes && (
                                <p className="mt-1 text-xs text-rose-500 font-medium">{cashExpenseForm.errors.notes}</p>
                            )}

                            {/* Suggestion chips */}
                            {cashExpenseForm.data.type === 'cash_out' && (
                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-semibold text-slate-400 mr-0.5">Quick picks:</span>
                                    {['Lemon & sugar', 'Lighter / matches', 'Milk emergency', 'Drinking water bottle', 'Kitchen cleaning items', 'Ice bag', 'Packaging bags'].map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                                const current = cashExpenseForm.data.notes;
                                                cashExpenseForm.setData('notes', current ? `${current}, ${tag}` : tag);
                                            }}
                                            className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Category (Optional) */}
                        {cashExpenseForm.data.type === 'cash_out' && expenseCategories.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Expense Category <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <select
                                    value={cashExpenseForm.data.expense_category_id}
                                    onChange={e => cashExpenseForm.setData('expense_category_id', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-700 text-sm font-medium"
                                >
                                    <option value="">General Daily Counter Expense</option>
                                    {expenseCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowCashExpenseModal(false)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={cashExpenseForm.processing}
                            className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 ${
                                cashExpenseForm.data.type === 'cash_out'
                                    ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
                                    : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                            }`}
                        >
                            {cashExpenseForm.processing ? 'Saving...' : cashExpenseForm.data.type === 'cash_out' ? 'Record Cash Out' : 'Save Cash In'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

// Icon Mapping for Activity Feed
function getActivityIcon(type) {
    switch(type) {
        case 'order': return <ShoppingBag className="w-5 h-5" />;
        case 'menu': return <Coffee className="w-5 h-5" />;
        case 'staff': return <Users className="w-5 h-5" />;
        case 'reservation': return <Calendar className="w-5 h-5" />;
        case 'customer': return <User className="w-5 h-5" />;
        default: return <Info className="w-5 h-5" />;
    }
}

function getActivityIconSm(type) {
    switch(type) {
        case 'order': return <ShoppingBag className="w-3.5 h-3.5" />;
        case 'menu': return <Coffee className="w-3.5 h-3.5" />;
        case 'staff': return <Users className="w-3.5 h-3.5" />;
        case 'reservation': return <Calendar className="w-3.5 h-3.5" />;
        case 'customer': return <User className="w-3.5 h-3.5" />;
        default: return <Info className="w-3.5 h-3.5" />;
    }
}

function getIconStyles(type) {
    switch(type) {
        case 'order': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'menu': return 'bg-brand-50 text-brand-600 border-brand-100';
        case 'staff': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'reservation': return 'bg-purple-50 text-purple-600 border-purple-100';
        case 'customer': return 'bg-rose-50 text-rose-600 border-rose-100';
        default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
}

// Helpers for current time comparison
function CarbonToday() {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date());
}

function CarbonDate() {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date());
}
