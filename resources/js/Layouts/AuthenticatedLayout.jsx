import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Table, CalendarDays, ShoppingBag, Coffee, ChevronRight, ChevronDown, Menu as MenuIcon, X, Settings, User, BarChart3, ChefHat, LogIn, LogOut, Clock, Users, Gift, FolderOpen, ListPlus, Percent, ConciergeBell, Boxes, Building2, Activity, ChevronLeft, CreditCard, Monitor, Globe, Sparkles } from 'lucide-react';
import Dropdown from '@/Components/Dropdown';

export default function AuthenticatedLayout({ children }) {
    const { auth, settings, active_orders_count, cancelled_orders_count, completed_today_count, kds_items_count, service_ready_count } = usePage().props;
    const user = auth.user;
    const activeBranch = useMemo(() => {
        if (!auth.branches) return null;
        return auth.branches.find(b => b.id === auth.active_branch_id);
    }, [auth.branches, auth.active_branch_id]);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('sidebar_collapsed') === 'true' : false;
    });

    const getActiveSectionId = () => {
        const sections = user?.role === 'super_admin' ? [superAdminSection] : navSections;
        for (const sec of sections) {
            const hasActive = sec.items.some(item => {
                if (user?.role === 'super_admin' && !item.superAdminOnly) return false;
                if (user?.role !== 'super_admin' && item.superAdminOnly) return false;
                if (item.adminOnly && user?.role !== 'admin') return false;
                return item.active;
            });
            if (hasActive) return sec.id;
        }
        return 'daily_ops';
    };

    const [openSectionId, setOpenSectionId] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nav_open_section');
            if (saved !== null) return saved;
        }
        return 'daily_ops';
    });

    const toggleSection = (sectionId) => {
        setOpenSectionId(prev => {
            const next = prev === sectionId ? null : sectionId;
            if (typeof window !== 'undefined') {
                localStorage.setItem('nav_open_section', next || '');
            }
            return next;
        });
    };

    // Enforce sidebar state persistence on mount/render to prevent auto-expand
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('sidebar_collapsed') === 'true';
            if (isSidebarCollapsed !== stored) {
                setIsSidebarCollapsed(stored);
            }
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebar_collapsed', newState ? 'true' : 'false');
    };

    const [isNavigating, setIsNavigating] = useState(false);
    const searchParams = new URLSearchParams(window.location.search);
    const currentStatus = searchParams.get('status') || 'active';
    
    useEffect(() => {
        const start = router.on('start', () => setIsNavigating(true));
        const finish = router.on('finish', () => setIsNavigating(false));
        return () => {
            start();
            finish();
        };
    }, []);

    // Live sync: only poll pages that explicitly need real-time data.
    useEffect(() => {
        const isFormPage = route().current('*.create') || route().current('*.edit') || route().current('profile.*');
        if (isFormPage) return;

        const partialMapping = {
            'dashboard':            { keys: ['stats', 'recent_activity', 'weekly_sales'], interval: 30000 },
            'superadmin.dashboard': { keys: ['stats', 'tenants', 'recentSubscriptions'], interval: 30000 },
            'table-book':           { keys: ['tables'],  interval: 5000 },
            'orders.index':         { keys: ['orders'],  interval: 5000 },
            'orders.service':       { keys: ['tables'],  interval: 5000 },
            'orders.kds':           { keys: ['items'],   interval: 3000 },
        };

        const currentRoute = route().current();
        const mapping = partialMapping[currentRoute];

        if (!mapping) return;

        const interval = setInterval(() => {
            if (isNavigating || document.visibilityState !== 'visible') return;
            router.reload({
                preserveScroll: true,
                preserveState: true,
                only: mapping.keys,
            });
        }, mapping.interval);

        return () => clearInterval(interval);
    }, [route().current(), isNavigating]);

    const navSections = [
        {
            id: 'daily_ops',
            title: 'DAILY OPERATIONS',
            badge: 'High Frequency',
            badgeClass: 'bg-rose-50 text-rose-600 border border-rose-200/60 font-black',
            dotClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
            items: [
                { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, active: route().current('dashboard'), adminOnly: true },
                { name: 'POS Viewer', href: route('pos.viewer'), icon: Monitor, active: route().current('pos.viewer'), hideSuperAdmin: true },
                { 
                    name: 'Orders', 
                    href: route('orders.index'), 
                    icon: ShoppingBag, 
                    active: route().current('orders.*') && !route().current('orders.kds') && !route().current('orders.service'), 
                    hideSuperAdmin: true
                },
                { name: 'Table Book', href: route('table-book'), icon: Table, active: route().current('table-book'), hideSuperAdmin: true },
                { name: 'Reservations', href: route('reservations.index'), icon: CalendarDays, active: route().current('reservations.*'), hideSuperAdmin: true },
                { name: 'Kitchen KDS', href: route('orders.kds'), icon: ChefHat, active: route().current('orders.kds'), hideSuperAdmin: true, badge: kds_items_count, badgeColor: 'bg-amber-500' },
                { name: 'Service View', href: route('orders.service'), icon: ConciergeBell, active: route().current('orders.service'), hideSuperAdmin: true, badge: service_ready_count, badgeColor: 'bg-blue-500' },
            ]
        },
        {
            id: 'catalog_stock',
            title: 'CATALOG & STOCK',
            dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
            items: [
                { name: 'Menu Items', href: route('menus.index'), icon: Coffee, active: route().current('menus.*') || route().current('categories.*') || route().current('addons.*'), adminOnly: true, hideSuperAdmin: true },
                { name: 'Inventory', href: route('inventory.index'), icon: Boxes, active: route().current('inventory.*'), adminOnly: true, hideSuperAdmin: true },
                { name: 'Media Library', href: route('media.index'), icon: FolderOpen, active: route().current('media.*'), adminOnly: true, hideSuperAdmin: true },
            ]
        },
        {
            id: 'customers_mkt',
            title: 'CUSTOMERS & MARKETING',
            dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
            items: [
                { name: 'Customers', href: route('customers.index'), icon: Users, active: route().current('customers.*'), hideSuperAdmin: true },
                { name: 'Loyalty', href: route('loyalty-rewards.index'), icon: Gift, active: route().current('loyalty-rewards.*'), adminOnly: true, hideSuperAdmin: true },
                { name: 'Promotions & Banners', href: route('banners.index'), icon: Sparkles, active: route().current('banners.*'), adminOnly: true, hideSuperAdmin: true },
            ]
        },
        {
            id: 'business_analytics',
            title: 'BUSINESS & ANALYTICS',
            dotClass: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
            items: [
                { 
                    name: 'Finance', 
                    href: route('finance.profit-loss'), 
                    icon: CreditCard, 
                    active: route().current('finance.*') || route().current('expenses.*'), 
                    adminOnly: true, 
                    hideSuperAdmin: true,
                    submenu: [
                        { name: 'Profit & Loss', href: route('finance.profit-loss'), active: route().current('finance.profit-loss') },
                        { name: 'Balance Sheet', href: route('finance.balance-sheet'), active: route().current('finance.balance-sheet') },
                        { name: 'Trial Balance', href: route('finance.trial-balance'), active: route().current('finance.trial-balance') },
                        { name: 'Cash Flow', href: route('finance.cash-flow'), active: route().current('finance.cash-flow') },
                        { name: 'General Ledger', href: route('finance.general-ledger'), active: route().current('finance.general-ledger') },
                        { name: 'Chart of Accounts', href: route('finance.accounts'), active: route().current('finance.accounts') },
                        { name: 'Journal Entries', href: route('finance.journal-entries'), active: route().current('finance.journal-entries') },
                        { name: 'Expenses', href: route('expenses.index'), active: route().current('expenses.*') },
                        { name: 'Supplier Bills', href: route('finance.supplier-bills'), active: route().current('finance.supplier-bills') },
                        { name: 'Daily Cash Counter', href: route('finance.cash-counter'), active: route().current('finance.cash-counter') },
                        { name: 'Banking', href: route('finance.banking'), active: route().current('finance.banking') },
                        { name: 'Budgets', href: route('finance.budgets'), active: route().current('finance.budgets') }
                    ]
                },
                { 
                    name: 'Reports', 
                    href: route('reports.index'), 
                    icon: BarChart3, 
                    active: route().current('reports.*'), 
                    adminOnly: true, 
                    hideSuperAdmin: true,
                    submenu: [
                        { name: 'Financial Report', href: route('reports.index'), active: route().current('reports.index') },
                        { name: 'Advance Report', href: route('reports.analytics'), active: route().current('reports.analytics') }
                    ]
                },
                { name: 'Staff Performance', href: route('staff.performance'), icon: Users, active: route().current('staff.performance'), adminOnly: true, hideSuperAdmin: true },
            ]
        },
        {
            id: 'settings_system',
            title: 'SETTINGS & SYSTEM',
            badge: 'Low Frequency',
            badgeClass: 'bg-gray-100 text-gray-500 border border-gray-200 font-semibold',
            dotClass: 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.6)]',
            items: [
                { name: 'Branches', href: route('branches.index'), icon: Building2, active: route().current('branches.*'), adminOnly: true, hideSuperAdmin: true },
                { name: 'Taxes', href: route('taxes.index'), icon: Percent, active: route().current('taxes.*'), adminOnly: true, hideSuperAdmin: true },
                { name: 'Global Settings', href: route('settings.index'), icon: Settings, active: route().current('settings.*'), adminOnly: true, hideSuperAdmin: true },
                { name: 'My Plan', href: route('tenant.plan'), icon: Activity, active: route().current('tenant.plan'), adminOnly: true, hideSuperAdmin: true },
                { name: 'Support Tickets', href: route('support.index'), icon: Activity, active: route().current('support.*'), adminOnly: true, hideSuperAdmin: true },
            ]
        }
    ];

    const superAdminSection = {
        id: 'super_admin',
        title: 'SUPER ADMIN OPERATIONS',
        dotClass: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
        items: [
            { name: 'Global Dashboard', href: route('superadmin.dashboard'), icon: LayoutDashboard, active: route().current('superadmin.dashboard'), superAdminOnly: true },
            { name: 'Demo Bookings', href: route('superadmin.demo-bookings.index'), icon: CalendarDays, active: route().current('superadmin.demo-bookings.*'), superAdminOnly: true },
            { name: 'Subscription Plans', href: route('superadmin.plans.index'), icon: Activity, active: route().current('superadmin.plans.*'), superAdminOnly: true },
            { name: 'Verify Payments', href: route('superadmin.verify-payments.index'), icon: CreditCard, active: route().current('superadmin.verify-payments.*'), superAdminOnly: true },
            { name: 'Manage Cafes', href: route('superadmin.tenants.index'), icon: Building2, active: route().current('superadmin.tenants.*'), superAdminOnly: true },
            { name: 'Support Desk', href: route('superadmin.support.index'), icon: Activity, active: route().current('superadmin.support.*'), superAdminOnly: true },
            { name: 'Users & App Settings', href: route('superadmin.users.index'), icon: Users, active: route().current('superadmin.users.*'), superAdminOnly: true },
            { name: 'CMS & SEO Settings', href: route('superadmin.cms.index'), icon: Globe, active: route().current('superadmin.cms.*'), superAdminOnly: true },
        ]
    };

    // Auto-open section containing active item (and auto-close others) on route change
    useEffect(() => {
        const activeSecId = getActiveSectionId();
        if (activeSecId) {
            setOpenSectionId(activeSecId);
            if (typeof window !== 'undefined') {
                localStorage.setItem('nav_open_section', activeSecId);
            }
        }
    }, [route().current()]);

    const mobileNavItems = user?.role === 'super_admin' ? [
        { name: 'Stats', href: route('superadmin.dashboard'), icon: LayoutDashboard, active: route().current('superadmin.dashboard') },
        { name: 'Cafes', href: route('superadmin.tenants.index'), icon: Building2, active: route().current('superadmin.tenants.*') && !route().current('superadmin.tenants.create') },
        { name: 'Add Cafe', href: route('superadmin.tenants.create'), icon: ListPlus, active: route().current('superadmin.tenants.create') },
        { name: 'Users & Settings', href: route('superadmin.users.index'), icon: Users, active: route().current('superadmin.users.*') },
        { name: 'Plans', href: route('superadmin.plans.index'), icon: Activity, active: route().current('superadmin.plans.*') },
        { name: 'Verify Payments', href: route('superadmin.verify-payments.index'), icon: CreditCard, active: route().current('superadmin.verify-payments.*') },
    ] : [
        { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, active: route().current('dashboard'), adminOnly: true },
        { name: 'Table', href: route('table-book'), icon: Table, active: route().current('table-book') },
        { name: 'Order', href: route('orders.index'), icon: ShoppingBag, active: route().current('orders.*') && !route().current('orders.kds') && !route().current('orders.service') },
        { name: 'KDS', href: route('orders.kds'), icon: ChefHat, active: route().current('orders.kds') },
        { name: 'Service', href: route('orders.service'), icon: ConciergeBell, active: route().current('orders.service') },
    ];

    if (user?.role === 'kitchen') {
        return (
            <div className="flex min-h-screen bg-gray-900 font-sans text-white">
                <main className="flex-1 flex flex-col min-w-0 p-[2px] md:p-4 relative h-screen max-h-screen overflow-hidden">
                    <div className="absolute top-4 right-4 z-[60]">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 transition border border-gray-700 shadow-lg">
                                    <ChefHat className="h-5 w-5 text-gray-400" />
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" contentClasses="w-48 bg-gray-800 border border-gray-700 text-gray-200">
                                <Dropdown.Link href={route('logout')} method="post" as="button" className="text-red-400 hover:bg-gray-700 w-full text-left font-bold">
                                    Sign Out Kitchen
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div data-theme={settings?.theme || 'blue'} className="flex min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-brand-300 selection:text-brand-900">
            {/* Impersonation Banner */}
            {usePage().props.is_impersonating && (
                <div className="fixed top-0 inset-x-0 z-[100] bg-orange-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 animate-pulse" />
                        <span className="text-sm font-bold tracking-wide">You are currently impersonating a cafe administrator. Actions you take will modify their live data.</span>
                    </div>
                    <Link
                        href={route('impersonate.stop')}
                        method="post"
                        as="button"
                        className="bg-white text-orange-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-orange-50 transition-colors shadow-sm"
                    >
                        Return to Superadmin
                    </Link>
                </div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 transform flex-col justify-between bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ease-in-out lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:flex ${usePage().props.is_impersonating ? 'mt-12' : ''} w-72 max-w-[85vw] ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
                <div className="flex h-full flex-col">
                    <div className={`relative flex h-16 items-center border-b border-gray-100 transition-all duration-300 ${
                        isSidebarCollapsed ? 'justify-center px-2 space-x-1.5' : 'justify-between px-5'
                    }`}>
                        {!isSidebarCollapsed ? (
                            <>
                                <Link href={route('dashboard')} className="flex items-center space-x-3 group outline-none">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden ${!settings?.site_logo ? 'bg-gradient-to-tr from-brand-600 via-purple-600 to-pink-500' : ''}`}>
                                        <ApplicationLogo className={settings?.site_logo ? "w-full h-full object-cover" : "h-6 w-6 text-white"} />
                                    </div>
                                    <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 truncate max-w-[150px]">
                                        {settings?.site_name || 'CaféOS'}
                                    </span>
                                </Link>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-900 focus:outline-none transition-colors">
                                        <X className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={toggleSidebar}
                                        className="hidden lg:flex items-center justify-center h-8 w-8 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-100 shadow-sm transition-all outline-none"
                                        title="Collapse Sidebar"
                                    >
                                        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href={route('dashboard')} className="flex items-center group outline-none">
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden ${!settings?.site_logo ? 'bg-gradient-to-tr from-brand-600 via-purple-600 to-pink-500' : ''}`}>
                                        <ApplicationLogo className={settings?.site_logo ? "w-full h-full object-cover" : "h-4.5 w-4.5 text-white"} />
                                    </div>
                                </Link>
                                <button
                                    onClick={toggleSidebar}
                                    className="hidden lg:flex items-center justify-center h-7 w-7 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-100 shadow-sm transition-all outline-none"
                                    title="Expand Sidebar"
                                >
                                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                                </button>
                                <button onClick={() => setIsMobileOpen(false)} className="lg:hidden absolute top-5 right-3 text-gray-400 hover:text-gray-900 focus:outline-none transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Branch Switcher (only if user has branches) */}
                    {auth.branches && auth.branches.length > 0 && (
                        <div className={`px-4 py-3 border-b border-gray-100 bg-gray-50/30 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className={`w-full text-left rounded-xl bg-white border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all outline-none group ${isSidebarCollapsed ? 'p-2 flex justify-center' : 'p-3 flex items-center justify-between'}`}>
                                        <div className="flex items-center space-x-2.5 min-w-0">
                                            <div className="flex shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 h-8 w-8 border border-brand-100 shadow-inner">
                                                <Building2 className="h-4 w-4" strokeWidth={2.5} />
                                            </div>
                                            {!isSidebarCollapsed && (
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[8px] font-black text-brand-400 uppercase tracking-widest leading-none mb-0.5 block">Active Outlet</span>
                                                    <p className="truncate text-xs font-bold text-gray-900 leading-tight">{activeBranch ? activeBranch.name : 'Select Branch'}</p>
                                                </div>
                                            )}
                                        </div>
                                        {!isSidebarCollapsed && (
                                            <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-brand-600 transition-colors" />
                                        )}
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content 
                                    align={isSidebarCollapsed ? 'left' : 'right'} 
                                    contentClasses="w-56 bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl rounded-2xl overflow-hidden py-1"
                                >
                                    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Switch Outlet</p>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {auth.branches.map((branch) => (
                                            <button
                                                key={branch.id}
                                                onClick={() => {
                                                    if (branch.id !== auth.active_branch_id) {
                                                        router.post(route('branches.switch'), { branch_id: branch.id });
                                                    }
                                                }}
                                                className={`w-full flex items-center justify-between py-2.5 px-4 text-xs font-semibold hover:bg-brand-50 hover:text-brand-700 transition-colors ${
                                                    branch.id === auth.active_branch_id ? 'text-brand-700 bg-brand-50/50 font-bold' : 'text-gray-700'
                                                }`}
                                            >
                                                <span className="truncate">{branch.name}</span>
                                                {branch.id === auth.active_branch_id && (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(var(--brand-primary),0.8)]"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    )}

                    <nav className="flex-1 space-y-3 px-3 py-4 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                        {(user?.role === 'super_admin' ? [superAdminSection] : navSections).map((section) => {
                            const visibleItems = section.items.filter(item => {
                                if (user?.role === 'super_admin') return item.superAdminOnly;
                                if (item.superAdminOnly) return false;
                                if (item.adminOnly && user?.role !== 'admin') return false;
                                return true;
                            });

                            if (visibleItems.length === 0) return null;

                            const isOpen = openSectionId === section.id;
                            const hasActiveItem = visibleItems.some(i => i.active);

                            return (
                                <div key={section.id} className="space-y-1">
                                    {!isSidebarCollapsed ? (
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(section.id)}
                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 group outline-none select-none ${
                                                hasActiveItem ? 'bg-gray-100/70 font-bold' : 'hover:bg-gray-100/50'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-2 min-w-0">
                                                <span className={`h-2 w-2 rounded-full shrink-0 transition-transform group-hover:scale-125 ${section.dotClass}`} />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 group-hover:text-gray-900 truncate">
                                                    {section.title}
                                                </span>
                                                {section.badge && (
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap hidden xl:inline-block ${section.badgeClass}`}>
                                                        {section.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center shrink-0 ml-1">
                                                <ChevronDown
                                                    className={`h-3.5 w-3.5 text-gray-400 group-hover:text-gray-700 transition-transform duration-200 ${
                                                        !isOpen ? '-rotate-90' : 'rotate-0'
                                                    }`}
                                                />
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="relative py-2 flex items-center justify-center group" title={section.title}>
                                            <div className="w-full border-t border-gray-100 absolute" />
                                            <span className={`relative z-10 h-2 w-2 rounded-full ${section.dotClass}`} />
                                        </div>
                                    )}

                                    {(isOpen || isSidebarCollapsed) && (
                                        <div className="space-y-1">
                                            {visibleItems.map((item) => {
                                                const Icon = item.icon;
                                                return (
                                                    <div key={item.name} title={isSidebarCollapsed ? item.name : ''}>
                                                        <Link
                                                            href={item.href}
                                                            onClick={() => setIsMobileOpen(false)}
                                                            className={`group relative flex items-center rounded-xl overflow-hidden outline-none transition-all duration-200 ${
                                                                isSidebarCollapsed ? 'justify-center px-3 py-3' : 'space-x-3 px-3 py-2.5'
                                                            } ${
                                                                item.active
                                                                ? 'bg-gradient-to-br from-white/90 to-white/50 text-brand-700 shadow-[0_4px_20px_-4px_rgba(79,70,229,0.15)] border border-white/80'
                                                                : 'text-gray-500 hover:bg-white/40 hover:text-brand-600 border border-transparent hover:shadow-sm'
                                                            }`}
                                                        >
                                                            {item.active && !isSidebarCollapsed && (
                                                                <div className="absolute left-0 top-1/2 -mt-3.5 h-7 w-[4px] rounded-r-full bg-brand-600 shadow-[2px_0_8px_rgba(79,70,229,0.5)]" />
                                                            )}
                                                            {item.active && isSidebarCollapsed && (
                                                                <div className="absolute left-0 top-1/2 -mt-4 h-8 w-[3px] rounded-r-full bg-brand-600" />
                                                            )}
                                                            <Icon className={`h-5 w-5 shrink-0 ${item.active ? 'scale-110' : ''}`} strokeWidth={item.active ? 2.5 : 2} />
                                                            {!isSidebarCollapsed && (
                                                                <>
                                                                    <span className={`font-semibold tracking-wide flex-1 text-xs sm:text-sm ${item.active ? 'text-brand-900 font-bold' : ''}`}>{item.name}</span>
                                                                    {item.badge > 0 && !item.submenu && (
                                                                        <span className={`px-2 py-0.5 text-[10px] font-black text-white rounded-full ${item.badgeColor || 'bg-brand-500'} ${item.active ? 'mr-6' : ''}`}>
                                                                            {item.badge}
                                                                        </span>
                                                                    )}
                                                                    {item.active && !item.submenu && <ChevronRight className="absolute right-4 h-4 w-4 opacity-40 text-brand-700" strokeWidth={3} />}
                                                                </>
                                                            )}
                                                            {isSidebarCollapsed && item.badge > 0 && (
                                                                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white">
                                                                    {item.badge > 9 ? '9+' : item.badge}
                                                                </span>
                                                            )}
                                                        </Link>
                                                        
                                                        {item.submenu && item.active && !isSidebarCollapsed && (
                                                            <div className="ml-8 mt-1 space-y-1">
                                                                {item.submenu.map(sub => (
                                                                    <Link
                                                                        key={sub.name}
                                                                        href={sub.href}
                                                                        onClick={() => setIsMobileOpen(false)}
                                                                        className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs outline-none transition-colors ${
                                                                            sub.active 
                                                                            ? 'bg-brand-50 text-brand-700 font-bold' 
                                                                            : 'text-gray-500 hover:bg-white/50 hover:text-brand-600 font-medium'
                                                                        }`}
                                                                    >
                                                                        <span>{sub.name}</span>
                                                                        {sub.badge > 0 && (
                                                                            <span className={`px-2 py-0.5 text-[10px] font-black text-white rounded-full ${sub.badgeColor || 'bg-brand-500'}`}>
                                                                                {sub.badge}
                                                                            </span>
                                                                        )}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>



                    <div className={`p-5 mt-auto border-t border-white/40 bg-gradient-to-t from-white/20 to-transparent transition-all duration-300 ${isSidebarCollapsed ? 'px-3' : ''}`}>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className={`w-full text-left rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-brand-200 hover:shadow-md transition-all outline-none group ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
                                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center relative' : 'space-x-3'}`}>
                                        <div className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-purple-100 text-brand-700 border border-brand-200/50 shadow-inner ${isSidebarCollapsed ? 'h-10 w-10' : 'h-11 w-11'}`}>
                                            <User className="h-5 w-5" strokeWidth={2.5} />
                                            {isSidebarCollapsed && (
                                                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm text-gray-400">
                                                    <Settings className="h-2.5 w-2.5" />
                                                </div>
                                            )}
                                        </div>
                                        {!isSidebarCollapsed && (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-sm font-bold text-gray-900 tracking-tight">{user.name}</p>
                                                    <div className="flex items-center space-x-1.5 mt-0.5">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                                        <p className="truncate text-xs font-semibold text-gray-500 uppercase tracking-wider">{user.role || 'Staff'}</p>
                                                    </div>
                                                </div>
                                                <Settings className="h-4 w-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
                                            </>
                                        )}
                                    </div>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content 
                                align={isSidebarCollapsed ? 'top-left' : 'top-right'} 
                                contentClasses="w-56 bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl rounded-2xl overflow-hidden py-1"
                            >
                                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">{user.role || 'Staff'}</p>
                                </div>
                                <Dropdown.Link href={route('profile.edit')} className="flex items-center py-2.5 px-4 text-sm font-semibold text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                                    Profile
                                </Dropdown.Link>
                                <Dropdown.Link href={route('settings.index')} className="flex items-center py-2.5 px-4 text-sm font-semibold text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                                    Settings
                                </Dropdown.Link>
                                <div className="h-px bg-gray-100/80 my-1 mx-3"></div>
                                <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center py-2.5 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                                    Sign Out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className={`lg:hidden fixed left-0 w-full z-40 bg-white border-b border-gray-100 flex h-16 items-center justify-between px-4 shadow-sm ${usePage().props.is_impersonating ? 'top-10' : 'top-0'}`}>
                <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 text-gray-500 rounded-xl focus:outline-none hover:bg-gray-50">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden ${!settings?.site_logo ? 'bg-gradient-to-tr from-brand-600 to-purple-600 shadow-md' : ''}`}>
                        <ApplicationLogo className={settings?.site_logo ? "w-full h-full object-cover" : "h-4 w-4 text-white"} />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-w-0 pb-24 lg:pb-0 bg-gray-50 max-w-full overflow-x-hidden ${usePage().props.is_impersonating ? 'lg:pt-10 pt-24' : 'lg:pt-0 pt-16'}`}>
                <div className="w-full mx-auto flex-1 flex flex-col p-3 sm:p-8 lg:p-10 max-w-full">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation (Classic Floating Dock) */}
            {!isMobileOpen && (
                <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-50 bg-white border border-gray-100 shadow-lg rounded-3xl px-3 py-2">
                    <div className="flex items-center justify-between">
                        {mobileNavItems.filter(item => {
                            if (item.adminOnly && user.role !== 'admin') return false;
                            return true;
                        }).map((item) => {
                            const Icon = item.icon;
                            const isActive = item.active;
                            return (
                                <Link 
                                    key={item.name} 
                                    href={item.href}
                                    className="relative flex flex-col items-center justify-center h-14 w-16 rounded-2xl outline-none group"
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-brand-50 border border-brand-100 rounded-2xl -z-10"></div>
                                    )}
                                    <Icon className={`mb-0.5 ${isActive ? 'w-5 h-5 text-brand-600 scale-110' : 'w-5 h-5 text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-brand-700' : 'text-gray-400'}`}>
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}


            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/30 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </div>
    );
}

import ApplicationLogo from '@/Components/ApplicationLogo';
