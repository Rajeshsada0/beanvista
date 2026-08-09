import { Head, useForm, usePage, router, Link } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { 
    ShoppingBag, 
    Coffee, 
    Plus, 
    Minus, 
    CheckCircle2, 
    ChevronRight, 
    X, 
    Clock, 
    MapPin, 
    Trash2, 
    Star, 
    Phone, 
    User, 
    Calendar,
    Gift,
    AlertCircle,
    Search,
    Flame,
    Utensils,
    Sparkles,
    Check,
    Tag,
    ChevronLeft
} from 'lucide-react';
import axios from 'axios';

export default function GuestMenuView({ table, menus, rewards, banners = [], settings, tenant_slug }) {
    const currency = settings?.currency_symbol || 'रू.';
    const [cart, setCart] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = useMemo(() => {
        const uniqueCats = [...new Set(menus.map(m => m.category).filter(Boolean))];
        return ['All', ...uniqueCats];
    }, [menus]);

    // Loyalty State
    const [customer, setCustomer] = useState(usePage().props.currentOrder?.customer || usePage().props.persistedCustomer || null);
    const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
    const [loyaltyData, setLoyaltyData] = useState({ phone: '', name: '' });
    const [isCheckingLoyalty, setIsCheckingLoyalty] = useState(false);
    const [loyaltyStep, setLoyaltyStep] = useState(1);
    
    // Notification, Order & View State
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'profile'
    const [selectedOrder, setSelectedOrder] = useState(null);

    const currentOrderProp = usePage().props.currentOrder;
    const [dismissedCancelledOrderId, setDismissedCancelledOrderId] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(`dismissed_cancelled_order_${table.id}`);
        }
        return null;
    });

    const activeOrder = useMemo(() => {
        if (!currentOrderProp) return null;
        if (currentOrderProp.status !== 'cancelled') {
            return currentOrderProp;
        }
        if (dismissedCancelledOrderId && String(currentOrderProp.id) === String(dismissedCancelledOrderId)) {
            return null;
        }
        return currentOrderProp;
    }, [currentOrderProp, dismissedCancelledOrderId]);

    const handleStartNewOrder = (orderId) => {
        setDismissedCancelledOrderId(orderId);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`dismissed_cancelled_order_${table.id}`, String(orderId));
        }
        showNotification("Notice cleared. Select items below to place a new order.", "info");
    };

    // Desktop Carousel Scroll Logic
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Sync guest order status every 5s — partial reload only for order state
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            router.reload({ 
                preserveScroll: true, 
                preserveState: true,
                only: ['currentOrder', 'persistedCustomer'] 
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Flash Message Listener
    const { flash } = usePage().props;
    useEffect(() => {
        if (flash?.success) {
            showNotification(flash.success, 'success');
        }
        if (flash?.error) {
            showNotification(flash.error, 'error');
        }
    }, [flash]);

    const handleMouseDown = (e) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const showNotification = (message, type = 'info') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
    };

    const addToCart = (menu, reward = null) => {
        const isRedemption = !!reward;
        
        if (isRedemption) {
            if (!customer) {
                setIsLoyaltyModalOpen(true);
                return;
            }
            
            const rewardPoints = reward.points_required;
            if (totalPointsUsed + rewardPoints > customer.loyalty_points) {
                const available = customer.loyalty_points - totalPointsUsed;
                showNotification(`Insufficient points. You have ${available} points left.`, 'error');
                return;
            }
        }

        setCart(prev => {
            const existing = prev.find(i => i.menu_id === menu.id && i.is_redemption === isRedemption);
            if (existing) {
                if (isRedemption) {
                    showNotification("You've already added this reward to your cart.", 'info');
                    return prev;
                }
                return prev.map(i => i.menu_id === menu.id && !i.is_redemption ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { 
                menu_id: menu.id, 
                reward_id: reward?.id || null,
                name: menu.name, 
                price: isRedemption ? 0 : menu.price, 
                quantity: 1,
                is_redemption: isRedemption,
                image_url: getMenuImageUrl(menu)
            }];
        });

        if (isRedemption) {
            showNotification(`${menu.name} added as a reward!`, 'loyalty');
        }
    };

    const updateQuantity = (menuId, change, isRedemption = false) => {
        setCart(prev => prev.map(i => {
            if (i.menu_id === menuId && i.is_redemption === isRedemption) {
                const newQ = i.quantity + change;
                return newQ > 0 ? { ...i, quantity: newQ } : i;
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const removeFromCart = (menuId, isRedemption = false) => {
        setCart(prev => prev.filter(i => !(i.menu_id === menuId && i.is_redemption === isRedemption)));
    };

    const totalPointsUsed = useMemo(() => {
        return cart.reduce((acc, item) => {
            if (item.is_redemption) {
                const reward = rewards.find(r => r.id === item.reward_id);
                return acc + (reward ? reward.points_required : 0) * item.quantity;
            }
            return acc;
        }, 0);
    }, [cart, rewards]);

    const subtotal = useMemo(() => cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0), [cart]);
    const totalItems = useMemo(() => cart.reduce((acc, curr) => acc + curr.quantity, 0), [cart]);

    const [isOrdering, setIsOrdering] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCartReview, setShowCartReview] = useState(false);

    // Filter menu items by active category & search query
    const filteredMenus = useMemo(() => {
        return menus.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query || 
                item.name.toLowerCase().includes(query) || 
                (item.category && item.category.toLowerCase().includes(query));
            return matchesCategory && matchesSearch;
        });
    }, [menus, activeCategory, searchQuery]);

    const handleLoyaltyCheck = async (e) => {
        if (e) e.preventDefault();
        setIsCheckingLoyalty(true);
        try {
            const res = await axios.post(route('guest.loyalty-check', { tenant_slug }), { 
                phone: loyaltyData.phone,
                name: loyaltyData.name || null
            });
            
            if (res.data.customer) {
                setCustomer(res.data.customer);
                if (res.data.is_new && !loyaltyData.name) {
                    setLoyaltyStep(2); 
                } else {
                    setLoyaltyStep(3); 
                    setTimeout(() => setIsLoyaltyModalOpen(false), 2000);
                }
            } else if (res.data.is_new) {
                setLoyaltyStep(2); 
            }
        } catch (error) {
            console.error('Loyalty check failed', error);
        } finally {
            setIsCheckingLoyalty(false);
        }
    };

    const submitOrder = () => {
        if (cart.length === 0 || isOrdering) return;
        
        const customerId = customer?.id || null;
        setIsOrdering(true);
        
        axios.post(route('guest.order', { tenant_slug, tableId: table.id }), { 
            items: cart,
            customer_id: customerId 
        })
        .then(response => {
            if (response.data.success) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(`dismissed_cancelled_order_${table.id}`);
                }
                setDismissedCancelledOrderId(null);
                setCart([]);
                setShowCartReview(false);
                setShowSuccess(true);
                setActiveTab('status');
                router.reload({ only: ['currentOrder','persistedCustomer'] });
                setTimeout(() => setShowSuccess(false), 5000);
            }
        })
        .catch(error => {
            console.error('Order submission failed:', error);
            const message = error.response?.data?.message || 'Failed to place order. Please try again.';
            showNotification(message, 'error');
        })
        .finally(() => {
            setIsOrdering(false);
        });
    };

    const cancelItem = (itemId) => {
        if (confirm('Are you sure you want to cancel this item?')) {
            router.post(route('guest.cancel-item', { tenant_slug, item: itemId }));
        }
    };

    // Helper for resolving image URL cleanly
    function getMenuImageUrl(menu) {
        if (menu.image_url) return menu.image_url;
        if (menu.image_path) {
            return menu.image_path.startsWith('http') ? menu.image_path : `/img/${menu.image_path}`;
        }
        if (menu.icon_url) return menu.icon_url;
        if (menu.icon_path) {
            return menu.icon_path.startsWith('http') ? menu.icon_path : `/img/${menu.icon_path}`;
        }
        return null;
    }

    // Helper to determine Veg / Non-Veg based on item name/category
    function isNonVegItem(menu) {
        const name = (menu.name || '').toLowerCase();
        const cat = (menu.category || '').toLowerCase();
        const nonVegKeywords = ['chicken', 'mutton', 'beef', 'pork', 'fish', 'seafood', 'meat', 'buff', 'egg', 'wings', 'tuna', 'bbq', 'bacon', 'prawn'];
        return nonVegKeywords.some(kw => name.includes(kw) || cat.includes(kw));
    }

    return (
        <div className={`min-h-screen bg-slate-50/70 font-sans text-slate-900 selection:bg-orange-500 selection:text-white transition-all duration-500 ${
            (cart.length > 0 && activeTab === 'menu') ? 'pb-36 md:pb-44' : 'pb-24'
        }`}>
            <Head title={`Table ${table.table_number} - Menu`} />

            {/* Notification Banner */}
            {notification.show && (
                <div className="fixed top-20 left-4 right-4 z-[100] flex justify-center pointer-events-none transition-all duration-500 animate-in fade-in slide-in-from-top-4">
                    <div className={`px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-2xl border flex items-center space-x-3 max-w-md w-full pointer-events-auto ${
                        notification.type === 'error' 
                        ? 'bg-rose-600 border-rose-500 text-white' 
                        : notification.type === 'loyalty' || notification.type === 'success'
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-white'
                    }`}>
                        {notification.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                        {(notification.type === 'loyalty' || notification.type === 'success') && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                        <p className="text-xs font-bold leading-tight flex-1">
                            {notification.message}
                        </p>
                        <button onClick={() => setNotification({ ...notification, show: false })} className="shrink-0 opacity-70 hover:opacity-100 p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modern Sticky Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/20 shrink-0">
                            {settings?.site_name ? settings.site_name.charAt(0) : 'C'}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 truncate leading-tight">
                                {settings?.site_name || 'CaféOS'}
                            </h1>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-extrabold uppercase tracking-wider">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                                    <span>Table {table.table_number}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                        <Link 
                            href={route('public.reserve', { tenant_slug })}
                            className="hidden sm:flex items-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Reserve</span>
                        </Link>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setShowCartReview(true)}
                                className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-colors"
                                title="View Cart"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                                    {totalItems}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Integrated Search Bar */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-3 pt-1">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search dishes, drinks, appetizers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-100/80 border-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-orange-500 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">

                {/* Exclusive Promotional Offer Banners Carousel */}
                {banners && banners.length > 0 && activeTab === 'menu' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                                <Flame className="w-4 h-4 text-orange-500" />
                                <span>Exclusive Offers & Specials</span>
                            </h3>
                        </div>

                        <div className="flex space-x-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                            {banners.map(banner => (
                                <div 
                                    key={banner.id}
                                    className={`shrink-0 w-[88%] sm:w-[380px] rounded-3xl p-5 sm:p-6 bg-gradient-to-r ${banner.bg_gradient || 'from-orange-600 via-amber-600 to-slate-900'} text-white shadow-xl relative overflow-hidden flex flex-col justify-between`}
                                >
                                    <div className="relative z-10 space-y-2 max-w-[78%]">
                                        {banner.badge_text && (
                                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-orange-200 text-[9px] font-black uppercase tracking-widest">
                                                <Sparkles className="w-2.5 h-2.5" />
                                                <span>{banner.badge_text}</span>
                                            </span>
                                        )}
                                        <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">{banner.title}</h3>
                                        {banner.subtitle && (
                                            <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">{banner.subtitle}</p>
                                        )}
                                    </div>

                                    {banner.image_url && (
                                        <img 
                                            src={banner.image_url} 
                                            alt={banner.title} 
                                            className="absolute right-3 bottom-3 w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border-2 border-white/20 shadow-lg shrink-0" 
                                        />
                                    )}

                                    <div className="absolute right-[-10%] top-[-20%] w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loyalty Membership Status / Sign-In Bar */}
                {!customer ? (
                    <div className="bg-white border border-orange-100 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center space-x-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                                <Star className="w-6 h-6 fill-orange-400 text-orange-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Join Cafe Loyalty</p>
                                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">Earn points on every order & unlock free rewards.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsLoyaltyModalOpen(true)}
                            className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 transition-all"
                        >
                            Sign In
                        </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => setActiveTab('profile')}
                        className="bg-slate-900 rounded-3xl p-4 sm:p-5 flex items-center justify-between text-white shadow-lg cursor-pointer hover:bg-slate-800 transition-all border border-slate-800"
                    >
                        <div className="flex items-center space-x-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                                <Star className="w-6 h-6 fill-amber-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged in Member</p>
                                <p className="text-base font-black truncate text-white">{customer.name}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Points</p>
                            <p className="text-lg font-black text-amber-400">{customer.loyalty_points} PTS</p>
                        </div>
                    </div>
                )}

                {/* Active Table Order Status / Cancelled Order Notice */}
                {activeOrder && activeOrder.items && activeOrder.items.length > 0 && (
                    <div className={`bg-white rounded-3xl p-5 border shadow-sm space-y-3 ${
                        activeOrder.status === 'cancelled' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200/80'
                    }`}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                                <Clock className={`w-4 h-4 shrink-0 ${activeOrder.status === 'cancelled' ? 'text-rose-500' : 'text-orange-500'}`} />
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider truncate">
                                    {activeOrder.status === 'cancelled' ? 'Previous Order Cancelled' : 'Active Table Order'}
                                </h3>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    activeOrder.status === 'cancelled' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                    activeOrder.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {activeOrder.status}
                                </span>
                                {activeOrder.status === 'cancelled' && (
                                    <button 
                                        onClick={() => handleStartNewOrder(activeOrder.id)}
                                        className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:brightness-105 active:scale-95 transition-all"
                                    >
                                        Start New Order
                                    </button>
                                )}
                            </div>
                        </div>

                        {activeOrder.status === 'cancelled' && (
                            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 flex items-start space-x-2.5">
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-semibold text-rose-800 leading-snug">
                                    This order was cancelled by staff. Click <strong>"Start New Order"</strong> to clear this notice and place a new order for Table {table.table_number}.
                                </p>
                            </div>
                        )}

                        <ul className="divide-y divide-slate-50">
                            {activeOrder.items.map(item => (
                                <li key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                        <span className="font-black bg-slate-100 px-2 py-0.5 rounded-lg text-slate-600 shrink-0">{item.quantity}x</span>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-slate-800 truncate">{item.menu?.name}</span>
                                                {!!item.is_redeemed && <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">Free Reward</span>}
                                            </div>
                                            <div className="mt-0.5">
                                                {item.kds_status === 'delivered' || item.kds_status === 'served' ? (
                                                    <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                                        <span>Delivered</span>
                                                    </span>
                                                ) : item.kds_status === 'ready' ? (
                                                    <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                        <span>Ready</span>
                                                    </span>
                                                ) : item.kds_status === 'preparing' ? (
                                                    <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                                        <span>Preparing</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                        <span>Pending</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 shrink-0">
                                        <span className="font-black text-slate-800">{item.is_redeemed ? 'FREE' : `${currency} ${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}`}</span>
                                        {item.kds_status === 'pending' && activeOrder.status !== 'cancelled' && (
                                            <button 
                                                onClick={() => cancelItem(item.id)}
                                                className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                                title="Cancel item"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Total Amount Footer */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Amount</span>
                            <span className="text-sm sm:text-base font-black text-slate-900">
                                {currency} {Number(activeOrder.grand_total || activeOrder.items?.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0) || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Tab Navigation Switcher (Our Menu vs Rewards / Profile) */}
                <div className="flex items-center p-1 bg-slate-200/60 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all ${
                            activeTab === 'menu' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Food Menu
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all ${
                            activeTab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Rewards & Profile
                    </button>
                </div>

                {/* Rewards Store Section */}
                {rewards && rewards.length > 0 && activeTab === 'menu' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                                <Gift className="w-4 h-4 text-amber-500" />
                                <span>Perks & Free Rewards</span>
                            </h3>
                            {customer ? (
                                <span className="text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                    {customer.loyalty_points - totalPointsUsed} PTS AVAILABLE
                                </span>
                            ) : (
                                <button onClick={() => setIsLoyaltyModalOpen(true)} className="text-[11px] font-extrabold text-orange-600 hover:underline">
                                    Sign In to Redeem
                                </button>
                            )}
                        </div>

                        <div 
                            ref={scrollRef}
                            onMouseDown={handleMouseDown}
                            onMouseLeave={handleMouseLeave}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            className={`flex space-x-3.5 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 select-none ${
                                isDragging ? 'cursor-grabbing' : 'cursor-grab'
                            }`}
                        >
                            {rewards.map(reward => {
                                const canAfford = customer && (customer.loyalty_points - totalPointsUsed >= reward.points_required);
                                return (
                                    <div 
                                        key={reward.id} 
                                        className={`shrink-0 w-56 sm:w-64 bg-white rounded-3xl p-4 border shadow-sm relative overflow-hidden flex flex-col justify-between transition-all ${
                                            canAfford ? 'border-amber-200 hover:shadow-md' : 'border-slate-100 opacity-85'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            {reward.image_path ? (
                                                <img 
                                                    src={`/storage/${reward.image_path}`} 
                                                    className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0"
                                                    alt={reward.name}
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                                                    <Gift className="w-7 h-7" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{reward.name}</h4>
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase">
                                                    {reward.points_required} PTS
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400">Free Item</span>
                                            <button 
                                                onClick={() => addToCart(reward.menu_item, reward)}
                                                disabled={!canAfford}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    canAfford 
                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 active:scale-95' 
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                            >
                                                Redeem
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Horizontal Category Navigation Bar */}
                {activeTab === 'menu' && (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                            {categories.map(cat => {
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide whitespace-nowrap transition-all duration-200 border ${
                                            isActive 
                                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-md shadow-orange-500/20 scale-105' 
                                            : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Feedback Header */}
                        {searchQuery && (
                            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                                <span>Found <strong className="text-slate-900">{filteredMenus.length}</strong> items matching "{searchQuery}"</span>
                                <button onClick={() => setSearchQuery('')} className="text-orange-600 font-bold hover:underline">Clear Search</button>
                            </div>
                        )}

                        {/* Food Cards Grid - 2 Items Per Row on Mobile */}
                        {filteredMenus.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                                {filteredMenus.map(menu => {
                                    const inCart = cart.find(i => i.menu_id === menu.id && !i.is_redemption);
                                    const imageUrl = getMenuImageUrl(menu);
                                    const isNonVeg = isNonVegItem(menu);

                                    return (
                                        <div 
                                            key={menu.id} 
                                            className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                                        >
                                            <div>
                                                {/* Food Image Box */}
                                                <div className="relative w-full h-32 sm:h-44 lg:h-48 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-slate-100">
                                                    {imageUrl ? (
                                                        <img 
                                                            src={imageUrl} 
                                                            alt={menu.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextElementSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}

                                                    {/* Fallback Placeholder Food Image */}
                                                    <div 
                                                        className={`w-full h-full flex flex-col items-center justify-center p-2 text-center ${imageUrl ? 'hidden' : 'flex'}`}
                                                    >
                                                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-md shadow-inner flex items-center justify-center text-orange-500 mb-1">
                                                            <Utensils className="w-5 h-5 sm:w-7 sm:h-7" />
                                                        </div>
                                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[90%]">{menu.category || 'Specialty'}</span>
                                                    </div>

                                                    {/* Top Overlay Badges */}
                                                    <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between pointer-events-none">
                                                        {/* Veg / Non-Veg Indicator */}
                                                        <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl bg-white/90 backdrop-blur-md shadow-md flex items-center space-x-1 sm:space-x-1.5 border border-white">
                                                            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isNonVeg ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />
                                                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-700">
                                                                {isNonVeg ? 'Non-Veg' : 'Veg'}
                                                            </span>
                                                        </div>

                                                        {/* Popular Badge */}
                                                        {menu.status && (
                                                            <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-md">
                                                                Chef's Pick
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content Details */}
                                                <div className="p-3 sm:p-4 space-y-1 sm:space-y-2">
                                                    <h3 className="text-xs sm:text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                                        {menu.name}
                                                    </h3>

                                                    {menu.description && (
                                                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium line-clamp-2 leading-snug">
                                                            {menu.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-baseline space-x-1 pt-0.5">
                                                        <span className="text-xs sm:text-lg font-black text-orange-600">
                                                            {currency} {parseFloat(menu.price).toFixed(2)}
                                                        </span>
                                                        {menu.original_price && parseFloat(menu.original_price) > parseFloat(menu.price) && (
                                                            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-bold">
                                                                {currency} {parseFloat(menu.original_price).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Bar (Add / Quantity Controls) */}
                                            <div className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4 sm:pt-1">
                                                {!inCart ? (
                                                    <button 
                                                        onClick={() => addToCart(menu)}
                                                        className="w-full py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-1"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        <span>Add</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-between bg-slate-100 rounded-xl sm:rounded-2xl p-1 border border-slate-200">
                                                        <button 
                                                            onClick={() => updateQuantity(menu.id, -1, false)}
                                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white text-slate-600 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        </button>
                                                        <span className="text-xs sm:text-sm font-black text-slate-900 px-1">{inCart.quantity}</span>
                                                        <button 
                                                            onClick={() => updateQuantity(menu.id, 1, false)}
                                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm hover:bg-orange-700 transition-colors"
                                                        >
                                                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
                                <Utensils className="w-10 h-10 text-slate-300 mx-auto" />
                                <p className="text-sm font-bold text-slate-600">No food items found matching your filter.</p>
                                <button onClick={() => { setActiveCategory('All'); setSearchQuery(''); }} className="text-xs font-black text-orange-600 uppercase tracking-wider hover:underline">
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Profile View Content */}
                {activeTab === 'profile' && customer && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Earned</p>
                                <p className="text-xl sm:text-2xl font-black text-orange-600">
                                    {parseFloat(customer.lifetime_points || 0).toFixed(0)} <span className="text-xs text-slate-500">PTS</span>
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Visits</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-900">{customer.orders?.length || 0}</p>
                            </div>
                        </div>

                        {/* Recent Order History */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                                <ShoppingBag className="w-4 h-4 mr-2 text-orange-500" />
                                Order History
                            </h3>
                            <div className="space-y-2.5">
                                {customer.orders && customer.orders.length > 0 ? (
                                    customer.orders.map(order => (
                                        <div 
                                            key={order.id} 
                                            onClick={() => setSelectedOrder(order)}
                                            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-orange-200 transition-all cursor-pointer flex items-center justify-between group"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-600 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shrink-0">
                                                    <span className="text-[9px] font-black leading-none">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                    <span className="text-xs font-black mt-0.5">{new Date(order.created_at).getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900">Order #{order.id}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                        {order.items?.length || 0} items • {currency} {parseFloat(order.grand_total).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                    order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {order.status}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400 text-xs font-semibold">
                                        Your past order history will appear here.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Sticky Bottom Floating Cart Bar */}
            {cart.length > 0 && activeTab === 'menu' && !showCartReview && (
                <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div 
                        onClick={() => setShowCartReview(true)}
                        className="bg-gradient-to-r from-slate-900 via-slate-950 to-orange-950 text-white p-3.5 sm:p-4 rounded-3xl shadow-[0_15px_40px_rgba(249,115,22,0.25)] border border-white/20 flex items-center justify-between cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="bg-gradient-to-tr from-orange-500 to-amber-500 p-2.5 rounded-2xl shadow-md text-white group-hover:scale-110 transition-transform">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <span className="absolute -top-1 -right-1 bg-white text-orange-600 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                                    {totalItems}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">Your Cart</p>
                                <p className="text-sm sm:text-base font-black tracking-tight">{currency} {subtotal.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-1.5 bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider text-white shadow-md group-hover:brightness-105 transition-all">
                            <span>View Cart</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Review Drawer / Sheet */}
            {showCartReview && (
                <div className="fixed inset-0 z-50 transition-all">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md duration-300"
                        onClick={() => setShowCartReview(false)}
                    ></div>
                    <div className="absolute bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-3xl sm:rounded-t-[2.5rem] p-5 sm:p-7 shadow-2xl duration-300 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900">Review Your Cart</h3>
                                <p className="text-xs font-bold text-slate-400">Table {table.table_number} • {totalItems} items</p>
                            </div>
                            <button 
                                onClick={() => setShowCartReview(false)}
                                className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {cart.map((item, idx) => (
                                <div key={`${item.menu_id}-${item.is_redemption}-${idx}`} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 gap-3">
                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200" alt="" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                                <Utensils className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center space-x-1.5">
                                                <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{item.name}</h4>
                                                {item.is_redemption && (
                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase">Free</span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-orange-600 mt-0.5">
                                                {item.is_redemption ? 'Free Reward' : `${currency} ${parseFloat(item.price).toFixed(2)}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 shrink-0">
                                        <div className="flex items-center space-x-2 bg-white rounded-xl p-1 border border-slate-200">
                                            <button 
                                                onClick={() => updateQuantity(item.menu_id, -1, item.is_redemption)}
                                                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-xs font-black text-slate-900 w-4 text-center">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.menu_id, 1, item.is_redemption)}
                                                disabled={item.is_redemption}
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.is_redemption ? 'bg-slate-100 text-slate-300' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => removeFromCart(item.menu_id, item.is_redemption)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                            <div className="flex items-center justify-between text-slate-900 px-1">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Grand Total</span>
                                <span className="text-xl font-black text-orange-600">{currency} {subtotal.toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={submitOrder}
                                disabled={isOrdering}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/25 hover:brightness-105 transition-all active:scale-95 flex items-center justify-center space-x-2"
                            >
                                <span>Confirm & Place Order</span>
                                {!isOrdering && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Confirmation Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-1">Order Sent!</h3>
                        <p className="text-xs text-slate-500 font-medium mb-6">Your order has been sent to the kitchen for Table {table.table_number}.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20"
                        >
                            Back to Menu
                        </button>
                    </div>
                </div>
            )}

            {/* Loyalty Modal */}
            {isLoyaltyModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsLoyaltyModalOpen(false)}></div>
                    <div className="relative z-10 bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-black text-slate-900">Member Loyalty</h3>
                            <button onClick={() => setIsLoyaltyModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>

                        {loyaltyStep === 1 && (
                            <form onSubmit={handleLoyaltyCheck} className="space-y-4 text-center">
                                <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                    <Phone className="w-7 h-7" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Enter your phone number to earn points and claim free rewards.</p>
                                <input 
                                    type="tel"
                                    placeholder="Phone Number (e.g. 98...)"
                                    className="w-full bg-slate-100 border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 font-black text-center text-sm outline-none"
                                    value={loyaltyData.phone}
                                    onChange={e => setLoyaltyData({ ...loyaltyData, phone: e.target.value })}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={isCheckingLoyalty || !loyaltyData.phone}
                                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20"
                                >
                                    {isCheckingLoyalty ? 'Checking...' : 'Continue'}
                                </button>
                            </form>
                        )}

                        {loyaltyStep === 2 && (
                            <form onSubmit={handleLoyaltyCheck} className="space-y-4 text-center">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                    <User className="w-7 h-7" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Welcome! Enter your name to register as a new member.</p>
                                <input 
                                    type="text"
                                    placeholder="Your Name"
                                    className="w-full bg-slate-100 border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 font-black text-center text-sm outline-none"
                                    value={loyaltyData.name}
                                    onChange={e => setLoyaltyData({ ...loyaltyData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={isCheckingLoyalty || !loyaltyData.name}
                                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/20"
                                >
                                    {isCheckingLoyalty ? 'Registering...' : 'Complete Sign In'}
                                </button>
                            </form>
                        )}

                        {loyaltyStep === 3 && (
                            <div className="py-4 text-center">
                                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-base font-black text-slate-900 mb-1">Welcome back!</h3>
                                <p className="text-xs text-slate-500">Points will be added to your order automatically.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
