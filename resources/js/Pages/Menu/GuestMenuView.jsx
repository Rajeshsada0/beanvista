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
    ArrowLeft, 
    Star, 
    Phone, 
    User, 
    Calendar,
    Gift,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';

export default function GuestMenuView({ table, menus, rewards, settings, tenant_slug }) {
    const currency = settings?.currency_symbol || 'रू.';
    const [cart, setCart] = useState([]);
    const [activeCategory, setActiveCategory] = useState([...new Set(menus.map(m => m.category))][0]);
    const categories = [...new Set(menus.map(m => m.category))];

    // Loyalty State
    const [customer, setCustomer] = useState(usePage().props.currentOrder?.customer || usePage().props.persistedCustomer || null);
    const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
    const [loyaltyData, setLoyaltyData] = useState({ phone: '', name: '' });
    const [isCheckingLoyalty, setIsCheckingLoyalty] = useState(false);
    const [loyaltyStep, setLoyaltyStep] = useState(1); // 1: Phone, 2: Name (for new), 3: Success
    
    // Notification State
    const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'profile'
    const [selectedOrder, setSelectedOrder] = useState(null);

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

    // Flash Message Listener for nice alerts
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
        const walk = (x - startX) * 2; // scroll-speed
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
                showNotification(`Insufficient points. You have ${available} points left for current selections.`, 'error');
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
                is_redemption: isRedemption
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

    return (
        <div className={`min-h-screen bg-slate-50 font-sans text-slate-900 transition-all duration-500 ${
            (cart.length > 0 && activeTab === 'menu') ? 'pb-44 md:pb-56' : 'pb-24'
        }`}>
            <Head title={`Table ${table.table_number} - Menu`} />

            {/* Notification Banner */}
            {notification.show && (
                <div className="fixed top-20 left-4 right-4 z-[100] flex justify-center pointer-events-none transition-all duration-500 animate-in fade-in slide-in-from-top-4">
                    <div className={`px-6 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-2xl border flex items-center space-x-4 max-w-md w-full pointer-events-auto ${
                        notification.type === 'error' 
                        ? 'bg-rose-500 border-rose-400 text-white' 
                        : notification.type === 'loyalty' || notification.type === 'success'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white/90 border-slate-100 text-slate-600'
                    }`}>
                        {notification.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                        {(notification.type === 'loyalty' || notification.type === 'success') && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                        <p className="text-[11px] font-black uppercase tracking-widest leading-tight">
                            {notification.message}
                        </p>
                        <button onClick={() => setNotification({ ...notification, show: false })} className="shrink-0 opacity-50 hover:opacity-100 ml-auto p-1">
                            <X className="w-4 h-4" strokeWidth={3} />
                        </button>
                    </div>
                </div>
            )}

            {/* Guest Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-lg md:text-xl font-black tracking-tight text-blue-600">{settings?.site_name || 'CaféOS'}</h1>
                    <div className="flex items-center mt-0.5 space-x-1.5">
                        <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 text-slate-400" />
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Table {table.table_number}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <Link 
                        href={route('public.reserve', { tenant_slug })}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                    >
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Book for Later</span>
                    </Link>
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Coffee className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
                {/* Welcome Card & Loyalty Join Banner */}
                <div className="space-y-4">
                    <div className="bg-blue-600 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-xl md:text-2xl font-black mb-1">Welcome!</h2>
                            <p className="text-xs md:text-sm font-medium opacity-80 leading-relaxed">Scan, Select & Savor. Your order will be served at Table {table.table_number}.</p>
                        </div>
                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 md:w-40 md:h-40 bg-white/10 rounded-full blur-3xl"></div>
                    </div>

                    {!customer ? (
                        <div className="bg-white border-2 border-dashed border-blue-100 rounded-3xl p-5 flex items-center justify-between group animate-pulse hover:animate-none transition-all">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                                    <Star className="w-6 h-6 fill-blue-100" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest leading-none">Join Loyalty</p>
                                    <p className="text-sm font-bold text-slate-500 mt-1">Earn rewards on every plate.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsLoyaltyModalOpen(true)}
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-900 rounded-3xl p-5 flex items-center justify-between text-white shadow-xl cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setActiveTab('profile')}>
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                                    <Star className="w-6 h-6 fill-amber-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Welcome back</p>
                                    <p className="text-lg font-black mt-1 truncate max-w-[150px]">{customer.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Your Points</p>
                                <p className="text-xl font-black text-amber-400">{customer.loyalty_points}</p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Tab Bar (Dynamic) */}
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setActiveTab('menu')}
                            className={`flex-1 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                                activeTab === 'menu' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-100 text-slate-400'
                            }`}
                        >
                            Our Menu
                        </button>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                                activeTab === 'profile' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-100 text-slate-400'
                            }`}
                        >
                            My Rewards
                        </button>
                    </div>

                    {/* Rewards Store (Perks Bar) */}
                    {rewards && rewards.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
                                    <Gift className="w-4 h-4 mr-2 text-amber-500" />
                                    Perks Store
                                </h3>
                                {customer ? (
                                    <div className="flex flex-col items-end">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Available Balance</p>
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                            {customer.loyalty_points - totalPointsUsed} PTS
                                        </p>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsLoyaltyModalOpen(true)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
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
                                className={`flex space-x-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 select-none ${
                                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                                }`}
                                style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
                            >
                                {rewards.map(reward => (
                                    <div 
                                        key={reward.id} 
                                        className={`shrink-0 w-64 bg-white rounded-3xl p-5 border shadow-sm relative overflow-hidden group transition-all ${
                                            customer?.loyalty_points >= reward.points_required 
                                            ? 'border-amber-100 hover:shadow-lg hover:shadow-amber-100/50' 
                                            : 'border-slate-100 opacity-80'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                                                {reward.image_path ? (
                                                    <img 
                                                        src={`/storage/${reward.image_path}`} 
                                                        className="w-12 h-12 rounded-2xl object-cover border border-slate-50"
                                                        alt={reward.name}
                                                    />
                                                ) : (
                                                    <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${
                                                        customer?.loyalty_points >= reward.points_required 
                                                        ? 'bg-amber-50 text-amber-500' 
                                                        : 'bg-slate-50 text-slate-400'
                                                    }`}>
                                                        <Gift className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-black text-slate-900 truncate">{reward.name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                                        {reward.points_required} PTS
                                                    </p>
                                                </div>
                                            </div>
                                            {reward.image_path && (
                                                <div className={`p-2 rounded-xl shrink-0 ${
                                                    customer?.loyalty_points >= reward.points_required 
                                                    ? 'bg-amber-50 text-amber-500' 
                                                    : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                    <Gift className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center justify-between relative z-10">
                                            <div className="flex items-center space-x-2">
                                                <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <Star className="w-3 h-3 fill-slate-200" />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500">Free Item</span>
                                            </div>
                                            <button 
                                                onClick={() => addToCart(reward.menu_item, reward)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    customer?.loyalty_points - totalPointsUsed >= reward.points_required 
                                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600' 
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                                                }`}
                                            >
                                                Redeem
                                            </button>
                                        </div>

                                        {customer && customer.loyalty_points < reward.points_required && (
                                            <div className="mt-4 pt-4 border-t border-slate-50 relative z-10">
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-amber-400 transition-all duration-1000" 
                                                        style={{ width: `${Math.min((customer.loyalty_points / reward.points_required) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                                    {reward.points_required - customer.loyalty_points} MORE PTS NEEDED
                                                </p>
                                            </div>
                                        )}

                                        <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-amber-50/50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Existing Order Items Section */}
                {usePage().props.currentOrder && usePage().props.currentOrder.items.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                Your Table Order
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                usePage().props.currentOrder.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                                {usePage().props.currentOrder.status}
                            </span>
                        </div>
                        <ul className="space-y-3">
                            {usePage().props.currentOrder.items.map(item => (
                                <li key={item.id} className="flex justify-between items-center duration-300">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs font-black bg-slate-50 px-2 py-1 rounded-lg text-slate-400">{item.quantity}x</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-600">{item.menu?.name}</span>
                                            {!!item.is_redeemed && <span className="text-[8px] font-black uppercase text-amber-500 tracking-tighter">Free Redemption</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-xs font-black text-slate-400">{item.is_redeemed ? 'FREE' : `${currency} ${(item.price * item.quantity).toFixed(2)}`}</span>
                                        {item.kds_status === 'pending' && (
                                            <button 
                                                onClick={() => cancelItem(item.id)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total</span>
                            <span className="text-base font-black text-blue-600">
                                {currency} {parseFloat(usePage().props.currentOrder.grand_total || usePage().props.currentOrder.items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Profile/Menu Navigation (Only if Menu tab is active) */}
                {activeTab === 'menu' && (
                    <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 md:px-6 py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${
                                    activeCategory === cat 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-100'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Menu Grid */}
                {activeTab === 'menu' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {menus.filter(m => m.category === activeCategory).map(menu => {
                            const inCart = cart.find(i => i.menu_id === menu.id && !i.is_redemption);
                            return (
                                <div key={menu.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-transform">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="text-base font-black text-slate-900 truncate">{menu.name}</h3>
                                        <p className="text-lg font-black text-blue-600 mt-1">{currency} {parseFloat(menu.price).toFixed(2)}</p>
                                    </div>
                                    <div className="shrink-0">
                                        {!inCart ? (
                                            <button 
                                                onClick={() => addToCart(menu)}
                                                className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <div className="flex items-center space-x-3 bg-slate-50 rounded-2xl p-1 border border-slate-100">
                                                <button 
                                                    onClick={() => updateQuantity(menu.id, -1, false)}
                                                    className="w-8 h-8 rounded-xl bg-white text-slate-400 flex items-center justify-center shadow-sm"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="text-sm font-black text-slate-900 w-4 text-center">{inCart.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(menu.id, 1, false)}
                                                    className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Profile View */}
                {activeTab === 'profile' && customer && (
                    <div className="space-y-8 duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Earned</p>
                                <p className="text-2xl font-black text-blue-600">{parseFloat(customer.lifetime_points || 0).toFixed(0)} <span className="text-xs">PTS</span></p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Visits</p>
                                <p className="text-2xl font-black text-slate-900">{customer.orders?.length || 0}</p>
                            </div>
                        </div>

                        {/* Recent Order History */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center px-1">
                                <ShoppingBag className="w-4 h-4 mr-2 text-blue-500" />
                                Order History
                            </h3>
                            <div className="space-y-3">
                                {customer.orders && customer.orders.length > 0 ? (
                                    customer.orders.map(order => (
                                        <div 
                                            key={order.id} 
                                            onClick={() => setSelectedOrder(order)}
                                            className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between group"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                    <span className="text-[10px] font-black leading-none">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                    <span className="text-sm font-black mt-0.5">{new Date(order.created_at).getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">Order #{order.id}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        {order.items?.length || 0} items • {currency} {parseFloat(order.grand_total).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                    order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {order.status}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white/50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-100">
                                        <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-400">Your order history will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Loyalty Activity Log */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center px-1">
                                <Clock className="w-4 h-4 mr-2 text-amber-500" />
                                Point Activities
                            </h3>
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                {customer.point_activities && customer.point_activities.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {customer.point_activities.map(log => {
                                            const isPositive = log.action !== 'redeemed';
                                            return (
                                                <div key={log.id} className="p-5 flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                                        }`}>
                                                            {isPositive ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700">{log.description}</p>
                                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">{log.time_ago}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs font-black ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {isPositive ? '+' : '-'}{log.description.match(/(\d+)\spts/)?.[1] || ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <Star className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No recent point activity</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Navigation / Cart Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 duration-500">
                <div className="max-w-3xl mx-auto flex flex-col space-y-4">
                    {/* Cart Preview (Only if Menu tab is active and cart has items) */}
                    {cart.length > 0 && !showCartReview && activeTab === 'menu' && (
                        <div 
                            onClick={() => setShowCartReview(true)}
                            className="flex items-center justify-between bg-slate-900/90 backdrop-blur-xl text-white p-3.5 md:p-4 rounded-3xl md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative border border-white/20 cursor-pointer hover:bg-blue-700 transition-all group active:scale-[0.98]"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none"></div>
                            
                            <div className="flex items-center space-x-4 relative z-10">
                                <div className="relative">
                                    <div className="bg-blue-600 p-2.5 md:p-3 rounded-2xl shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <span className="absolute -top-1 -right-1 bg-white text-blue-600 text-[9px] md:text-[10px] font-black h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center border-2 border-slate-900 transform scale-110">
                                        {totalItems}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 mb-0.5">Summary</p>
                                    <p className="text-base md:text-xl font-black tracking-tight">{currency} {subtotal.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 bg-white/10 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-white/10 group-hover:bg-white group-hover:text-slate-900 transition-all shadow-inner">
                                <span>Review</span>
                                <ChevronRight className="w-3 md:w-3.5 h-3 md:h-3.5" />
                            </div>
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-2 rounded-[2rem] flex items-center shadow-xl">
                        <button 
                            onClick={() => setActiveTab('menu')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-[1.5rem] transition-all ${
                                activeTab === 'menu' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Coffee className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Menu</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-[1.5rem] transition-all ${
                                activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <User className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Profile</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Cart Review Overlay */}
            {showCartReview && (
                <div className="fixed inset-0 z-50 transition-all">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md duration-300"
                        onClick={() => setShowCartReview(false)}
                    ></div>
                    <div className="absolute bottom-0 left-0 right-0 max-w-3xl mx-auto bg-white rounded-t-[2rem] md:rounded-t-[3rem] p-6 md:p-8 shadow-2xl duration-500 max-h-[90vh] md:max-h-[85vh] flex flex-col pb-safe">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900">Review Items</h3>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Review your selection before placing order</p>
                            </div>
                            <button 
                                onClick={() => setShowCartReview(false)}
                                className="p-2 md:p-3 bg-slate-50 text-slate-400 rounded-xl md:rounded-2xl hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 md:space-y-4 pr-1 md:pr-2 custom-scrollbar">
                            {cart.map((item, idx) => (
                                <div key={`${item.menu_id}-${item.is_redemption}-${idx}`} className="flex items-center justify-between p-4 md:p-5 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 gap-3">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="text-sm md:text-base font-black text-slate-800 truncate">{item.name}</h4>
                                            {item.is_redemption && (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Free</span>
                                            )}
                                        </div>
                                        <p className="text-xs md:text-sm font-bold text-blue-600 mt-0.5">
                                            {item.is_redemption ? 'Redeemed with points' : `${currency} ${parseFloat(item.price).toFixed(2)}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
                                        <div className="flex items-center space-x-2 md:space-x-3 bg-white rounded-xl md:rounded-2xl p-1 border border-slate-100 shadow-sm">
                                            <button 
                                                onClick={() => updateQuantity(item.menu_id, -1, item.is_redemption)}
                                                className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100"
                                            >
                                                <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            </button>
                                            <span className="text-xs md:text-sm font-black text-slate-900 w-3 md:w-4 text-center">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.menu_id, 1, item.is_redemption)}
                                                disabled={item.is_redemption}
                                                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center ${item.is_redemption ? 'bg-slate-50 text-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                            >
                                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => removeFromCart(item.menu_id, item.is_redemption)}
                                            className="p-2 md:p-3 bg-red-50 text-red-400 rounded-xl md:rounded-2xl hover:bg-red-100 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t border-slate-100 space-y-4 md:space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest">Calculated Subtotal</span>
                                <span className="text-xl md:text-2xl font-black text-slate-900">{currency} {subtotal.toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={submitOrder}
                                disabled={isOrdering}
                                className="w-full bg-blue-600 text-white py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center space-x-3"
                            >
                                <span>Place Order Now</span>
                                {!isOrdering && <ChevronRight className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl duration-300">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Order Confirmed!</h3>
                        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">Your order has been sent to the kitchen. We'll bring it to Table {table.table_number} shortly.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            Order More
                        </button>
                    </div>
                </div>
            )}

            {/* Loyalty Modal */}
            {isLoyaltyModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsLoyaltyModalOpen(false)}></div>
                    <div className="relative z-10 bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Join Loyalty Program</h3>
                            <button onClick={() => setIsLoyaltyModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </div>

                        {loyaltyStep === 1 && (
                            <form onSubmit={handleLoyaltyCheck} className="space-y-6 text-center">
                                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                                    <Phone className="w-10 h-10" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500 mb-6">Enter your phone number to earn points and unlock rewards.</p>
                                    <input 
                                        type="tel"
                                        placeholder="Phone Number (e.g. 98...) "
                                        className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600 font-black text-center text-lg transition-all"
                                        value={loyaltyData.phone}
                                        onChange={e => setLoyaltyData({ ...loyaltyData, phone: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCheckingLoyalty || !loyaltyData.phone}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    {isCheckingLoyalty ? 'Checking...' : 'Check Balance'}
                                </button>
                            </form>
                        )}

                        {loyaltyStep === 2 && (
                            <form onSubmit={handleLoyaltyCheck} className="space-y-6 text-center">
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                                    <User className="w-10 h-10" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-900 mb-1">Register New Member</p>
                                    <p className="text-sm font-bold text-slate-500 mb-6">Looks like you're new! Please enter your name to join.</p>
                                    <input 
                                        type="text"
                                        placeholder="Your Full Name"
                                        className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-600 font-black text-center transition-all"
                                        value={loyaltyData.name}
                                        onChange={e => setLoyaltyData({ ...loyaltyData, name: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCheckingLoyalty || !loyaltyData.name}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
                                >
                                    {isCheckingLoyalty ? 'Joining...' : 'Secure Joining'}
                                </button>
                            </form>
                        )}

                        {loyaltyStep === 3 && (
                            <div className="py-6 text-center duration-300">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10" strokeWidth={2.5} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">Welcome back!</h3>
                                <p className="text-sm font-bold text-slate-500">Loyalty points will be applied to your order automatically.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Digital Receipt Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedOrder(null)}></div>
                    <div className="relative z-10 bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl duration-300 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Order Details</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Receipt for #{selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                            <div className="space-y-3 pb-6 border-b border-slate-100">
                                {selectedOrder.items?.map(item => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xs font-black bg-slate-50 px-2 py-1 rounded-lg text-slate-400">{item.quantity}x</span>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{item.menu?.name}</p>
                                                {item.is_redeemed && <p className="text-[8px] font-black uppercase text-amber-500 tracking-widest">Free Redemption</p>}
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-slate-400">
                                            {item.is_redeemed ? 'FREE' : `${currency} ${(item.price * item.quantity).toFixed(2)}`}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Subtotal</span>
                                    <span>{currency} {parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-100 pt-3">
                                    <span>Paid Amount</span>
                                    <span>{currency} {parseFloat(selectedOrder.grand_total).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Visit Date</p>
                                    <p className="text-xs font-bold text-slate-700">
                                        {new Date(selectedOrder.created_at).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedOrder(null)}
                            className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
                        >
                            Close Receipt
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
