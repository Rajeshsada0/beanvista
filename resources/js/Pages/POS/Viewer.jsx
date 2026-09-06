import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import { 
    Search, Menu as MenuIcon, Monitor, Maximize, Minimize, Sun, Moon, 
    Trash2, Plus, Minus, UserCircle, UserPlus, 
    ClipboardList, CheckCircle, Ban, Clock, Store, 
    Utensils, Car, Truck, CalendarClock, PartyPopper,
    X, Eye, Edit3, Filter, Printer, Wallet, QrCode, Building2, LogOut, ShoppingCart, CheckSquare,
    ArrowLeft
} from 'lucide-react';
import CategoryFilter from '@/Components/POS/CategoryFilter';
import ProductGrid from '@/Components/POS/ProductGrid';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function Viewer({ menus = [], categories = [], tables = [], addons = [], taxes = [], customers = [], waiters = [], activeOrders = [], bankAccounts = [], discounts = [], vouchers = [] }) {
    const { settings, auth } = usePage().props;
    const currency = settings?.currency_symbol || 'JOD';
    const siteName = settings?.site_name || 'POS';
    
    const userInitials = useMemo(() => {
        if (!auth?.user?.name) return 'US';
        const parts = auth.user.name.trim().split(/\s+/);
        if (parts.length > 1) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return auth.user.name.substring(0, 2).toUpperCase();
    }, [auth?.user?.name]);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [orderType, setOrderType] = useState('Dine-In');
    const [selectedTableId, setSelectedTableId] = useState('');
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [notes, setNotes] = useState('');
    const [guestCount, setGuestCount] = useState(1);
    const [waiterId, setWaiterId] = useState('');
    const [carPlate, setCarPlate] = useState('');
    const [carDescription, setCarDescription] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [heldOrders, setHeldOrders] = useState(() => {
        try {
            const saved = localStorage.getItem('pos_held_orders');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [holdDropdownOpen, setHoldDropdownOpen] = useState(false);

    const [showTableViewer, setShowTableViewer] = useState(false);
    const [showOrdersViewer, setShowOrdersViewer] = useState(false);
    const [showCashMovement, setShowCashMovement] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeMobileTab, setActiveMobileTab] = useState('products'); // 'products', 'cart', 'checkout'

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.error(err));
            }
        }
    };

    const [viewedTable, setViewedTable] = useState(null);
    const [tableSearchQuery, setTableSearchQuery] = useState('');
    const defaultAccount = bankAccounts?.find(a => a.account_type === 'cash') || (bankAccounts?.length > 0 ? bankAccounts[0] : null);
    const [paymentMethod, setPaymentMethod] = useState(defaultAccount ? `bank_${defaultAccount.id}` : '');
    const [viewingQrAccount, setViewingQrAccount] = useState(null);

    const viewerTables = useMemo(() => {
        return tables.filter(t => t.table_number.toLowerCase().includes(tableSearchQuery.toLowerCase()));
    }, [tables, tableSearchQuery]);

    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [discountOrVoucher, setDiscountOrVoucher] = useState('discount'); // 'discount' or 'voucher'
    const [selectedDiscountId, setSelectedDiscountId] = useState('');
    const [enteredVoucherCode, setEnteredVoucherCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const { data: cData, setData: cSetData, post: cPost, processing: cProcessing, errors: cErrors, reset: cReset } = useForm({
        name: '',
        phone: '',
        email: '',
        birthday: ''
    });

    const submitCustomer = (e) => {
        e.preventDefault();
        cPost(route('customers.store'), {
            onSuccess: () => {
                setShowAddCustomer(false);
                cReset();
            }
        });
    };

    // Save heldOrders to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
    }, [heldOrders]);

    const loadOrder = (tableId, orderId = null) => {
        setSelectedTableId(tableId || '');
        let order = null;

        if (tableId) {
            const table = tables.find(t => t.id === parseInt(tableId));
            if (table && table.active_orders && table.active_orders.length > 0) {
                order = orderId 
                    ? table.active_orders.find(o => o.id === orderId) 
                    : table.active_orders[0];
            }
        } else if (orderId) {
            order = activeOrders.find(o => o.id === orderId);
        }

        if (order) {
            if (order.status !== 'completed') {
                setActiveOrderId(order.id);
                setOrderType(order.order_type || 'Takeaway');
                if (order.order_type === 'Drive-Thru') {
                    setCarPlate(order.car_plate || '');
                    setCarDescription(order.car_description || '');
                }
                setNotes(order.notes || '');
                setScheduledAt(order.scheduled_at ? order.scheduled_at.slice(0, 16) : '');
                setGuestCount(order.guest_count || 1);
                setWaiterId(order.waiter_id || '');

                const existingCart = order.items.map(item => ({
                    id: item.menu_id,
                    name: item.menu?.name || 'Item',
                    price: item.price,
                    cartId: `existing_${item.id}`,
                    order_item_id: item.id,
                    quantity: item.quantity,
                    kds_status: item.kds_status,
                    isExisting: true
                }));
                setCart(existingCart);
                return;
            }
        }

        setActiveOrderId(null);
        setCart([]);
    };

    const handleTableChange = (e) => {
        loadOrder(e.target.value);
    };

    const filteredItems = useMemo(() => {
        return menus.map(menu => {
            let outOfStock = false;
            if (menu.recipes && menu.recipes.length > 0) {
                for (const recipe of menu.recipes) {
                    if (recipe.inventory_item && parseFloat(recipe.inventory_item.current_stock) < parseFloat(recipe.quantity_per_serving)) {
                        outOfStock = true;
                        break;
                    }
                }
            }
            return { ...menu, outOfStock };
        }).filter(item => {
            const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            let matchesCategory = false;
            if (!activeCategory || activeCategory === 'all') {
                matchesCategory = true;
            } else if (item.category_id != null && String(item.category_id) === String(activeCategory)) {
                matchesCategory = true;
            } else {
                // Find category object by ID or name to support legacy/string categories
                const activeCatObj = categories.find(c => 
                    String(c.id) === String(activeCategory) || 
                    c.name?.trim().toLowerCase() === String(activeCategory).trim().toLowerCase()
                );

                if (activeCatObj) {
                    const catIdMatch = item.category_id != null && String(item.category_id) === String(activeCatObj.id);
                    const catNameMatch = item.category && activeCatObj.name && 
                        item.category.trim().toLowerCase() === activeCatObj.name.trim().toLowerCase();
                    matchesCategory = catIdMatch || catNameMatch;
                } else if (item.category && item.category.trim().toLowerCase() === String(activeCategory).trim().toLowerCase()) {
                    matchesCategory = true;
                }
            }

            return matchesSearch && matchesCategory;
        });
    }, [menus, searchQuery, activeCategory, categories]);

    const handleAddToCart = (item) => {
        if (!selectedTableId && orderType === 'Dine-In') {
            alert('Please select a Table first.');
            return;
        }
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id && !i.isExisting);
            if (existing) {
                return prev.map(i => i.cartId === existing.cartId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1, cartId: Math.random().toString(36).substr(2, 9), isExisting: false }];
        });
    };

    const handleUpdateQuantity = (cartId, newQuantity) => {
        if (newQuantity < 1) {
            setCart(prev => prev.filter(i => i.cartId !== cartId));
            return;
        }
        setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity: newQuantity } : i));
    };

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    
    const discountAmount = useMemo(() => {
        if (!appliedDiscount) return 0;
        if (appliedDiscount.discount_type === 'percentage') {
            return (subtotal * parseFloat(appliedDiscount.discount_value)) / 100;
        } else if (appliedDiscount.discount_type === 'fixed') {
            return parseFloat(appliedDiscount.discount_value);
        }
        return 0;
    }, [appliedDiscount, subtotal]);

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxRate = taxes.reduce((sum, tax) => sum + parseFloat(tax.rate), 0);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;

    const handleSendToKitchen = () => {
        if (cart.length === 0 || (!selectedTableId && orderType === 'Dine-In')) return;
        const payload = {
            table_id: selectedTableId || null,
            customer_id: selectedCustomerId || null,
            waiter_id: waiterId || null,
            order_type: orderType,
            car_plate: carPlate,
            car_description: carDescription,
            scheduled_at: scheduledAt,
            notes: notes,
            guest_count: guestCount,
            items: cart.map(item => ({ menu_id: item.id, quantity: item.quantity, price: item.price, order_item_id: item.order_item_id || null })),
            status: 'pending',
            discount_percentage: appliedDiscount && appliedDiscount.discount_type === 'percentage' ? parseFloat(appliedDiscount.discount_value) : 0,
            discount_amount: discountAmount,
            source: 'pos_viewer'
        };
        if (activeOrderId) {
            router.put(route('orders.update', activeOrderId), payload, {
                onSuccess: () => { 
                    setCart([]); 
                    setActiveOrderId(null); 
                    setSelectedTableId(''); 
                    setAppliedDiscount(null);
                    setSelectedDiscountId('');
                    setEnteredVoucherCode('');
                }
            });
        } else {
            router.post(route('orders.store'), payload, {
                onSuccess: () => { 
                    setCart([]); 
                    setSelectedTableId(''); 
                    setAppliedDiscount(null);
                    setSelectedDiscountId('');
                    setEnteredVoucherCode('');
                }
            });
        }
    };

    const handleCheckout = () => {
        if (cart.length === 0 || (!selectedTableId && orderType === 'Dine-In')) return;
        
        let pm = 'bank';
        let bankAccountId = null;
        if (paymentMethod.startsWith('bank_')) {
            bankAccountId = parseInt(paymentMethod.replace('bank_', ''));
        } else {
            pm = paymentMethod;
        }

        const payload = {
            table_id: selectedTableId || null,
            customer_id: selectedCustomerId || null,
            waiter_id: waiterId || null,
            order_type: orderType,
            car_plate: carPlate,
            car_description: carDescription,
            scheduled_at: scheduledAt,
            notes: notes,
            guest_count: guestCount,
            items: cart.map(item => ({ menu_id: item.id, quantity: item.quantity, price: item.price, order_item_id: item.order_item_id || null })),
            status: 'completed',
            payment_method: pm,
            bank_account_id: bankAccountId,
            cash_amount: pm === 'cash' ? total : 0,
            online_amount: pm === 'bank' ? total : 0,
            discount_percentage: appliedDiscount && appliedDiscount.discount_type === 'percentage' ? parseFloat(appliedDiscount.discount_value) : 0,
            discount_amount: discountAmount,
            source: 'pos_viewer'
        };
        if (activeOrderId) {
            router.put(route('orders.update', activeOrderId), payload, {
                onSuccess: () => { 
                    setCart([]); 
                    setActiveOrderId(null); 
                    setSelectedTableId(''); 
                    setAppliedDiscount(null);
                    setSelectedDiscountId('');
                    setEnteredVoucherCode('');
                }
            });
        } else {
            router.post(route('orders.store'), payload, {
                onSuccess: () => { 
                    setCart([]); 
                    setSelectedTableId(''); 
                    setAppliedDiscount(null);
                    setSelectedDiscountId('');
                    setEnteredVoucherCode('');
                }
            });
        }
    };

    const handleCancelOrder = () => {
        if (!activeOrderId) {
            setCart([]);
            setSelectedTableId('');
            return;
        }
        if (confirm('Are you sure you want to cancel this order?')) {
            router.delete(route('orders.destroy', activeOrderId), {
                onSuccess: () => { setCart([]); setActiveOrderId(null); setSelectedTableId(''); }
            });
        }
    };

    const handleHoldOrder = () => {
        if (cart.length === 0) return;
        setHeldOrders(prev => [...prev, { 
            table_id: selectedTableId, 
            active_order_id: activeOrderId,
            cart: [...cart] 
        }]);
        setCart([]);
        setSelectedTableId('');
        setCarDescription('');
        setScheduledAt('');
        setSelectedCustomerId('');
        setActiveOrderId(null);
    };

    const orderTypes = [
        { name: 'Takeaway', icon: Store, activeColor: 'text-brand-500 border-brand-500' },
        { name: 'Dine-In', icon: Utensils, activeColor: 'text-blue-500 border-blue-500' },
        { name: 'Pick-up', icon: UserCircle, activeColor: 'text-green-500 border-green-500' },
        { name: 'Drive-Thru', icon: Car, activeColor: 'text-red-500 border-red-500' },
        { name: 'Pre-Order', icon: CalendarClock, activeColor: 'text-purple-500 border-purple-500' },
        { name: 'Catering', icon: PartyPopper, activeColor: 'text-teal-500 border-teal-500' }
    ];

    return (
        <div className={`flex flex-col h-screen w-screen font-sans overflow-hidden ${isDarkMode ? 'dark-theme' : 'bg-white text-gray-800'}`}>
            <Head title="POS Viewer" />

            {/* Top Header */}
            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 bg-white flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowSidebar(true)} className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"><MenuIcon size={18} /></button>
                    <button 
                        onClick={() => router.get(route('dashboard'))} 
                        className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 ml-2 flex items-center gap-1.5"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-xs font-bold hidden md:inline">Back</span>
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={toggleFullScreen} className="hidden sm:inline-flex p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <div className="relative z-50">
                        <button onClick={() => setShowProfile(!showProfile)} className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm ml-2">
                            {userInitials}
                        </button>
                        {showProfile && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                                <div className="p-3 border-b border-gray-100 bg-gray-50">
                                    <p className="font-semibold text-sm text-gray-800 truncate">{auth?.user?.name || 'User'}</p>
                                    <p className="text-xs text-gray-500 truncate">{auth?.user?.email || ''}</p>
                                </div>
                                <div className="p-2 flex flex-col gap-1">
                                    <button onClick={() => router.get(route('dashboard'))} className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-600 rounded-md font-medium transition-colors flex items-center gap-2"><Monitor size={16}/> Dashboard</button>
                                    <button onClick={() => router.post(route('logout'))} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors flex items-center gap-2"><LogOut size={16}/> Logout</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Responsive Layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50/50 p-2 pb-16 lg:pb-2 gap-2 min-h-0 w-full">
                
                {/* Left Column: Products */}
                <div className={`${activeMobileTab === 'products' ? 'flex' : 'hidden'} lg:flex flex-col bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden p-3 min-h-0 w-full lg:w-[32%] xl:w-1/3`}>
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text"
                            placeholder="Search Products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                        />
                    </div>
                    
                    <CategoryFilter 
                        categories={categories} 
                        activeCategory={activeCategory}
                        onSelectCategory={setActiveCategory}
                    />
                    
                    <div className="flex-1 overflow-y-auto mt-2 pr-1 custom-scrollbar min-h-0">
                        <ProductGrid items={filteredItems} onAddToCart={handleAddToCart} currency={currency} />
                    </div>
                </div>

                {/* Middle Column: Cart */}
                <div className={`${activeMobileTab === 'cart' ? 'flex' : 'hidden'} lg:flex flex-col gap-2 min-h-0 w-full lg:w-[41%] xl:w-5/12`}>
                    {/* Order Types */}
                    <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex gap-1 overflow-x-auto flex-shrink-0">
                        {orderTypes.map(type => {
                            const Icon = type.icon;
                            const isActive = orderType === type.name;
                            return (
                                <button
                                    key={type.name}
                                    onClick={() => setOrderType(type.name)}
                                    className={`flex-1 min-w-[80px] py-2 px-1 flex flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold border transition-colors ${
                                        isActive ? `bg-gray-50 ${type.activeColor}` : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-200'
                                    }`}
                                >
                                    <Icon size={16} className={isActive ? '' : 'text-gray-400'} />
                                    {type.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Selectors */}
                    <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex flex-wrap sm:flex-nowrap gap-2 flex-shrink-0">
                        <select 
                            value={selectedTableId} 
                            onChange={handleTableChange} 
                            className="flex-1 text-sm border-gray-200 rounded-md text-gray-500 focus:ring-0"
                        >
                            <option value="">Select Table</option>
                            {tables.map(t => {
                                const isOccupied = t.active_orders && t.active_orders.length > 0;
                                return (
                                    <option 
                                        key={t.id} 
                                        value={t.id} 
                                        className={isOccupied ? "text-red-600 font-medium" : ""}
                                    >
                                        {t.table_number} {isOccupied ? '(Occupied)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <select 
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                            className="flex-1 text-sm border-gray-200 rounded-md text-gray-500 focus:ring-0"
                        >
                            <option value="">Select Customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                            ))}
                        </select>
                        <button onClick={() => setShowAddCustomer(true)} className="p-2 bg-brand-50 text-brand-500 rounded-md hover:bg-brand-100 transition-colors">
                            <UserPlus size={18} />
                        </button>
                        <div className="relative z-50">
                            <button 
                                onClick={() => setHoldDropdownOpen(!holdDropdownOpen)}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-1 ${heldOrders.length > 0 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Hold ({heldOrders.length}) <span className="text-xs">▼</span>
                            </button>
                            {heldOrders.length > 0 && holdDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-2xl z-[100]">
                                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 font-semibold text-xs text-gray-500 rounded-t-lg">
                                        HELD ORDERS
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {heldOrders.map((held, idx) => (
                                            <div key={idx} onClick={() => {
                                                setSelectedTableId(held.table_id);
                                                setActiveOrderId(held.active_order_id || null);
                                                setCart(held.cart);
                                                setHeldOrders(prev => prev.filter((_, i) => i !== idx));
                                                setHoldDropdownOpen(false);
                                            }} className="p-3 hover:bg-yellow-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors">
                                                <div className="font-semibold text-sm text-gray-800">Order #{idx + 1}</div>
                                                <div className="text-xs text-gray-500 mt-1">{held.cart.length} items</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart Items Area */}
                    <div className="flex-1 bg-gray-100/80 rounded-lg border border-gray-200 overflow-y-auto custom-scrollbar relative p-3 min-h-0">
                        {cart.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                <Utensils size={48} className="mb-4 text-gray-300" />
                                <p className="font-bold text-gray-500">No Items in the Order</p>
                                <p className="text-sm text-center px-4 mt-1">Select dishes from the menu to start your order</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <div key={item.cartId} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-700 text-sm">{item.name}</h4>
                                                {item.isExisting && item.kds_status && (
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                        item.kds_status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                        item.kds_status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                                                        item.kds_status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>{item.kds_status}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">{currency} {parseFloat(item.price).toFixed(3)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                                                <button onClick={() => handleUpdateQuantity(item.cartId, item.quantity - 1)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600"><Minus size={14}/></button>
                                                <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                                                <button onClick={() => handleUpdateQuantity(item.cartId, item.quantity + 1)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600"><Plus size={14}/></button>
                                            </div>
                                            <span className="font-bold text-sm text-gray-700 w-16 text-right">
                                                {currency} {(item.price * item.quantity).toFixed(3)}
                                            </span>
                                            <button onClick={() => handleUpdateQuantity(item.cartId, 0)} className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Actions & Totals */}
                <div className={`${activeMobileTab === 'checkout' ? 'flex' : 'hidden'} lg:flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 min-h-0 w-full lg:w-[27%] xl:w-1/4`}>
                    {/* Top Right Tabs */}
                    <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex justify-between flex-shrink-0">
                        <button onClick={() => setShowTableViewer(true)} className="flex flex-col items-center flex-1 text-purple-600 border border-purple-200 rounded p-1 bg-purple-50 hover:bg-purple-100 transition-colors">
                            <Store size={20} />
                            <span className="text-[10px] font-bold mt-1">Table Viewer</span>
                        </button>
                        <button onClick={() => setShowOrdersViewer(true)} className="flex flex-col items-center flex-1 text-blue-500 p-1 border border-transparent hover:bg-gray-50 rounded transition-colors">
                            <ClipboardList size={20} />
                            <span className="text-[10px] font-semibold mt-1">Orders</span>
                        </button>
                        <button onClick={() => setShowCashMovement(true)} className="flex flex-col items-center flex-1 text-teal-500 p-1 border border-transparent hover:bg-gray-50 rounded transition-colors">
                            <Store size={20} />
                            <span className="text-[10px] font-semibold mt-1">Cash Movement</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 flex flex-col gap-2.5 flex-shrink-0">
                        {orderType === 'Drive-Thru' && (
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Car Plate No." 
                                    className="w-full text-sm border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500"
                                    value={carPlate} onChange={(e) => setCarPlate(e.target.value)}
                                />
                                <input 
                                    type="text" 
                                    placeholder="Car Description" 
                                    className="w-full text-sm border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500"
                                    value={carDescription} onChange={(e) => setCarDescription(e.target.value)}
                                />
                            </div>
                        )}
                        {(orderType === 'Pre-Order' || orderType === 'Catering') && (
                            <input 
                                type="datetime-local" 
                                className="w-full text-sm border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500"
                                value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                            />
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <select 
                                className="w-full text-sm border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500"
                                value={waiterId} onChange={(e) => setWaiterId(e.target.value)}
                            >
                                <option value="">Select Waiter</option>
                                {waiters && waiters.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                            <input 
                                type="number" 
                                placeholder="Guest count"
                                className="w-full text-sm border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500" 
                                value={guestCount} onChange={(e) => setGuestCount(e.target.value)}
                            />
                        </div>
                        <textarea 
                            placeholder="Notes" 
                            className="w-full text-sm border-gray-200 rounded-md focus:ring-1 focus:ring-brand-500 resize-none h-10"
                            value={notes} onChange={(e) => setNotes(e.target.value)}
                        />

                        <div className="flex gap-2 text-sm mt-1">
                            <button 
                                onClick={() => setDiscountOrVoucher('discount')}
                                className={`flex-1 py-1 border rounded-md font-semibold flex items-center justify-center gap-1 transition-colors text-xs ${
                                    discountOrVoucher === 'discount' 
                                        ? 'border-brand-400 text-brand-600 bg-brand-50' 
                                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center gap-1">
                                    Discount 
                                    {discountOrVoucher === 'discount' && <CheckCircle size={14} className="text-brand-500"/>}
                                </span>
                            </button>
                            <button 
                                onClick={() => setDiscountOrVoucher('voucher')}
                                className={`flex-1 py-1 border rounded-md font-semibold flex items-center justify-center gap-1 transition-colors text-xs ${
                                    discountOrVoucher === 'voucher' 
                                        ? 'border-brand-400 text-brand-600 bg-brand-50' 
                                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center gap-1">
                                    Voucher
                                    {discountOrVoucher === 'voucher' && <CheckCircle size={14} className="text-brand-500"/>}
                                </span>
                            </button>
                        </div>
                        
                        <div className="flex gap-2">
                            {discountOrVoucher === 'discount' ? (
                                <select 
                                    value={selectedDiscountId}
                                    onChange={(e) => setSelectedDiscountId(e.target.value)}
                                    className="flex-1 text-sm border-gray-200 rounded-md focus:ring-0"
                                >
                                    <option value="">Select Discount</option>
                                    {discounts && discounts.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.name} ({d.discount_type === 'percentage' ? `${d.discount_value}%` : `${currency}${parseFloat(d.discount_value).toFixed(2)}`})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input 
                                    type="text"
                                    placeholder="Enter Voucher Code"
                                    value={enteredVoucherCode}
                                    onChange={(e) => setEnteredVoucherCode(e.target.value.toUpperCase())}
                                    className="flex-1 text-sm border-gray-200 rounded-md focus:ring-0 font-mono"
                                />
                            )}
                            <button 
                                onClick={() => {
                                    if (discountOrVoucher === 'discount') {
                                        const d = discounts.find(item => item.id === parseInt(selectedDiscountId));
                                        if (d) {
                                            setAppliedDiscount(d);
                                        } else {
                                            setAppliedDiscount(null);
                                        }
                                    } else {
                                        const v = vouchers.find(item => item.code.toUpperCase() === enteredVoucherCode.trim().toUpperCase());
                                        if (v) {
                                            setAppliedDiscount(v);
                                        } else {
                                            alert('Invalid Voucher Code');
                                            setAppliedDiscount(null);
                                        }
                                    }
                                }}
                                className="bg-brand-500 text-white px-4 rounded-md text-sm font-semibold hover:bg-brand-600 transition-colors"
                            >
                                Apply
                            </button>
                        </div>

                        {appliedDiscount && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-2 flex items-center justify-between text-xs text-green-700">
                                <div className="truncate pr-2">
                                    <span className="font-bold">Applied: </span>
                                    <span>{appliedDiscount.name}</span>
                                    <span className="ml-1 font-semibold">
                                        (-{currency} {discountAmount.toFixed(3)})
                                    </span>
                                </div>
                                <button 
                                    onClick={() => {
                                        setAppliedDiscount(null);
                                        setSelectedDiscountId('');
                                        setEnteredVoucherCode('');
                                    }} 
                                    className="text-red-500 hover:text-red-700 font-bold flex-shrink-0"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3.5 flex flex-col min-h-[340px] flex-grow flex-shrink-0">
                        <div className="space-y-2 text-sm font-semibold text-gray-500 mb-3">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{currency} {subtotal.toFixed(3)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Discount</span>
                                    <span>-{currency} {discountAmount.toFixed(3)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>VAT {taxRate}%</span>
                                <span>{currency} {taxAmount.toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between text-brand-600 font-bold border-t border-gray-100 pt-2 text-base sm:text-lg">
                                <span>Total</span>
                                <span>{currency} {total.toFixed(3)}</span>
                            </div>
                        </div>

                        <div className="mb-3 border-t border-gray-100 pt-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Payment Method</label>
                            <div className="grid grid-cols-3 gap-2">
                                {bankAccounts && bankAccounts.map(acc => {
                                    const isSelected = paymentMethod === `bank_${acc.id}`;
                                    let Icon = Store; // fallback
                                    if (acc.account_type === 'cash') Icon = Wallet;
                                    else if (acc.account_type === 'online') Icon = QrCode;
                                    else if (acc.account_type === 'checking') Icon = Building2;
                                    
                                    return (
                                        <button
                                            key={acc.id}
                                            onClick={() => setPaymentMethod(`bank_${acc.id}`)}
                                            className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${
                                                isSelected 
                                                    ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-sm' 
                                                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Icon size={16} />
                                            <span className="text-[9px] font-bold uppercase truncate w-full text-center">{acc.account_name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {paymentMethod.startsWith('bank_') && (() => {
                                const accId = parseInt(paymentMethod.replace('bank_', ''));
                                const acc = bankAccounts?.find(a => a.id === accId);
                                if (acc?.qr_code_url) {
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => setViewingQrAccount(acc)}
                                            className="mt-2 w-full py-1.5 px-3 bg-brand-50 border border-brand-200 text-brand-700 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold hover:bg-brand-100 transition-colors shadow-sm"
                                        >
                                            <QrCode size={14} className="text-brand-600" />
                                            <span>Scan QR Code ({acc.account_name})</span>
                                        </button>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            <button onClick={handleSendToKitchen} disabled={cart.length === 0 || (!selectedTableId && orderType === 'Dine-In') || (activeOrderId && !cart.some(item => !item.isExisting))} className="py-2.5 bg-brand-500 text-white rounded-md font-semibold flex flex-col items-center justify-center hover:bg-brand-600 transition-colors disabled:opacity-50 text-xs sm:text-sm shadow-sm">
                                <Store size={16} className="mb-0.5" />
                                Send To Kitchen
                            </button>
                            <button onClick={handleCheckout} disabled={cart.length === 0 || (!selectedTableId && orderType === 'Dine-In')} style={{ backgroundColor: '#22c55e' }} className="py-2.5 text-white rounded-md font-semibold flex flex-col items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 text-xs sm:text-sm shadow-sm">
                                <CheckCircle size={16} className="mb-0.5" />
                                Pay & Fire
                            </button>
                            <button onClick={handleCancelOrder} disabled={cart.length === 0 && !activeOrderId} style={{ backgroundColor: '#ef4444' }} className="py-2.5 text-white rounded-md font-semibold flex flex-col items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 text-xs sm:text-sm shadow-sm">
                                <Ban size={16} className="mb-0.5" />
                                Cancel Order
                            </button>
                            <button onClick={handleHoldOrder} disabled={cart.length === 0} style={{ backgroundColor: '#eab308' }} className="py-2.5 text-white rounded-md font-semibold flex flex-col items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 text-xs sm:text-sm shadow-sm">
                                <Clock size={16} className="mb-0.5" />
                                Hold Order
                            </button>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Mobile Tab Navigation (Sticky Bottom) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 flex">
                <button 
                    onClick={() => setActiveMobileTab('products')} 
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'products' ? 'text-brand-600' : 'text-gray-500 hover:text-brand-500 hover:bg-gray-50'}`}
                >
                    <Utensils size={20} className={activeMobileTab === 'products' ? 'fill-current opacity-20' : ''} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Products</span>
                </button>
                <button 
                    onClick={() => setActiveMobileTab('cart')} 
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors relative ${activeMobileTab === 'cart' ? 'text-brand-600' : 'text-gray-500 hover:text-brand-500 hover:bg-gray-50'}`}
                >
                    <ShoppingCart size={20} className={activeMobileTab === 'cart' ? 'fill-current opacity-20' : ''} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Cart</span>
                    {cart.length > 0 && (
                        <span className="absolute top-1.5 right-1/2 translate-x-4 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                            {cart.length}
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveMobileTab('checkout')} 
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors ${activeMobileTab === 'checkout' ? 'text-brand-600' : 'text-gray-500 hover:text-brand-500 hover:bg-gray-50'}`}
                >
                    <CheckSquare size={20} className={activeMobileTab === 'checkout' ? 'fill-current opacity-20' : ''} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Checkout</span>
                </button>
            </div>
            
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .dark-theme {
                    filter: invert(1) hue-rotate(180deg);
                    background-color: #f9fafb;
                }
                .dark-theme img, .dark-theme video {
                    filter: invert(1) hue-rotate(180deg);
                }
            `}</style>
            
            {/* Sidebar Drawer */}
            {showSidebar && (
                <div className="fixed inset-0 z-[400] flex">
                    <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setShowSidebar(false)} />
                    <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-brand-50">
                            <h2 className="text-lg font-bold text-brand-700 flex items-center gap-2">
                                <MenuIcon size={20} /> Menu
                            </h2>
                            <button onClick={() => setShowSidebar(false)} className="p-1 hover:bg-brand-100 rounded text-brand-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 flex-1 space-y-2">
                            <button onClick={() => router.get(route('dashboard'))} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors flex items-center gap-3">
                                <Monitor size={18} /> Dashboard
                            </button>
                            <button onClick={() => router.get(route('settings.index'))} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors flex items-center gap-3">
                                <Sun size={18} /> Settings
                            </button>
                        </div>
                        <div className="p-4 border-t border-gray-100">
                            <button onClick={() => router.post(route('logout'))} className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors flex items-center gap-3">
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Customer Modal */}
            {showAddCustomer && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Add New Customer</h3>
                            <button onClick={() => setShowAddCustomer(false)} className="text-gray-400 hover:text-gray-600">
                                <Ban size={20} />
                            </button>
                        </div>
                        <div className="p-5 flex-1 overflow-y-auto">
                            <form id="customerForm" onSubmit={submitCustomer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                                    <input type="text" required value={cData.name} onChange={e => cSetData('name', e.target.value)} className="w-full border-gray-200 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="John Doe" />
                                    {cErrors.name && <p className="text-red-500 text-xs mt-1">{cErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                    <input type="text" required value={cData.phone} onChange={e => cSetData('phone', e.target.value)} className="w-full border-gray-200 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="10 Digits" />
                                    {cErrors.phone && <p className="text-red-500 text-xs mt-1">{cErrors.phone}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value={cData.email} onChange={e => cSetData('email', e.target.value)} className="w-full border-gray-200 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="john@example.com" />
                                    {cErrors.email && <p className="text-red-500 text-xs mt-1">{cErrors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                                    <input type="date" value={cData.birthday} onChange={e => cSetData('birthday', e.target.value)} className="w-full border-gray-200 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm" />
                                    {cErrors.birthday && <p className="text-red-500 text-xs mt-1">{cErrors.birthday}</p>}
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button type="button" onClick={() => setShowAddCustomer(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                Cancel
                            </button>
                            <button form="customerForm" type="submit" disabled={cProcessing} className="px-4 py-2 text-sm font-semibold text-white bg-brand-500 rounded-md hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2">
                                {cProcessing && <Clock size={16} className="animate-spin" />}
                                Save Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Viewer Drawer */}
            {showTableViewer && (
                <div className="fixed inset-0 z-[200] flex justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setShowTableViewer(false)} />
                    
                    {/* Drawer */}
                    <div className="relative w-full sm:w-96 bg-gray-50 h-full shadow-2xl flex flex-col transform transition-transform duration-300">
                        {/* Header */}
                        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Store size={20} className="text-purple-600" /> Table Viewer
                            </h2>
                            <button onClick={() => setShowTableViewer(false)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Search & Filter */}
                        <div className="p-4 bg-white border-b border-gray-100 flex gap-2 flex-shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search here..." 
                                    value={tableSearchQuery}
                                    onChange={e => setTableSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500"
                                />
                            </div>
                            <button className="px-3 py-2 border border-brand-200 text-brand-600 bg-brand-50 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-brand-100 transition-colors">
                                <Filter size={16} /> Filters
                            </button>
                        </div>

                        {/* Tables Grid */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 custom-scrollbar content-start">
                            {viewerTables.map(t => {
                                const activeOrder = t.active_orders && t.active_orders.length > 0 ? t.active_orders[0] : null;
                                const isOccupied = !!activeOrder;
                                
                                return (
                                    <div 
                                        key={t.id} 
                                        onClick={() => setViewedTable(t)}
                                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-shadow flex flex-col justify-between min-h-[140px]"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-gray-800 text-sm">{t.table_number}</span>
                                                {isOccupied ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-red-600 bg-red-50">Occupied</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-green-600 bg-green-50">Available</span>
                                                )}
                                            </div>

                                            {/* Show order details if occupied */}
                                            {isOccupied && (
                                                <div className="mt-3 space-y-1">
                                                    <div className="text-xs font-semibold text-gray-700 flex justify-between gap-1 overflow-hidden">
                                                        <span className="truncate">{activeOrder.customer ? activeOrder.customer.name : 'Walk-in'}</span>
                                                        <span className="flex-shrink-0 text-brand-600">{currency} {parseFloat(activeOrder.grand_total).toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-[10px] font-medium text-gray-400">
                                                        {activeOrder.items?.reduce((sum, i) => sum + i.quantity, 0) || 0} Items
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-semibold mt-2 pt-2 border-t border-gray-50">Indoor • Floor 1</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Table Details Modal */}
            {viewedTable && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setViewedTable(null)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                        
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <Store size={20} className="text-gray-500" /> {viewedTable.table_number}
                            </h3>
                            <div className="flex items-center gap-3">
                                {viewedTable.active_orders && viewedTable.active_orders.length > 0 ? (
                                    <span className="text-xs font-bold px-3 py-1 rounded-full text-red-600 bg-red-50 border border-red-100">Occupied</span>
                                ) : (
                                    <span className="text-xs font-bold px-3 py-1 rounded-full text-green-600 bg-green-50 border border-green-100">Available</span>
                                )}
                                <button onClick={() => setViewedTable(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                            <div className="grid grid-cols-3 gap-6 mb-6">
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Capacity</div>
                                    <div className="text-sm font-semibold">{viewedTable.capacity}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Floor</div>
                                    <div className="text-sm font-semibold">Floor 1</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 mb-1">Zone</div>
                                    <div className="text-sm font-semibold">Indoor</div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="text-xs text-gray-400 mb-1 block">Waiter</label>
                                <select className="w-full text-sm border-gray-200 rounded-md focus:ring-brand-500">
                                    <option>Kitchen (Default)</option>
                                    <option>Waiter 1</option>
                                </select>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <div className="flex items-center gap-2 mb-4 text-brand-500 font-semibold text-sm">
                                    <Store size={18} /> Order Details
                                </div>

                                {viewedTable.active_orders && viewedTable.active_orders.length > 0 ? (
                                    viewedTable.active_orders.map(order => (
                                        <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative mb-4 last:mb-0">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="text-xs text-gray-400 font-mono mb-1">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                    <div className="font-bold text-gray-800 text-sm">#{order.order_number} {order.customer ? `- ${order.customer.name}` : '- Walk-in Customer'}</div>
                                                    <div className="text-xs text-gray-500 mt-1">{order.items.reduce((sum, item) => sum + item.quantity, 0)} Items</div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <div className="font-bold text-gray-800">{currency} {parseFloat(order.grand_total).toFixed(3)}</div>
                                                    <div className="flex gap-2">
                                                        {order.status === 'served' && <span className="text-[10px] font-bold px-2 py-0.5 rounded text-teal-600 bg-teal-50 border border-teal-100">Served</span>}
                                                        {order.status === 'completed' ? (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-green-600 bg-green-50 border border-green-100">Paid</span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-red-600 bg-red-50 border border-red-100">Unpaid</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mt-6 border-t border-gray-200 pt-4 border-dashed">
                                                <div className="flex gap-2">
                                                    <button onClick={() => {
                                                        loadOrder(viewedTable.id, order.id);
                                                        setViewedTable(null);
                                                        setShowTableViewer(false);
                                                    }} className="p-2 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors" title="View Order">
                                                        <Eye size={18} />
                                                    </button>
                                                    {order.status !== 'completed' && (
                                                        <>
                                                            <button onClick={() => {
                                                                loadOrder(viewedTable.id, order.id);
                                                                setViewedTable(null);
                                                                setShowTableViewer(false);
                                                            }} className="p-2 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors" title="Edit Order">
                                                                <Edit3 size={18} />
                                                            </button>
                                                            <button onClick={() => {
                                                                if (confirm('Cancel this order?')) {
                                                                    router.delete(route('orders.destroy', order.id));
                                                                    setViewedTable(null);
                                                                }
                                                            }} className="p-2 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors" title="Cancel Order">
                                                                <X size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button className="p-2 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2" title="Print Bill">
                                                        <Printer size={18} /> <span className="text-xs font-semibold">Print</span>
                                                    </button>
                                                </div>
                                                {order.status !== 'completed' && (
                                                    <button onClick={() => {
                                                        loadOrder(viewedTable.id, order.id);
                                                        setViewedTable(null);
                                                        setShowTableViewer(false);
                                                    }} className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 font-semibold rounded hover:bg-green-100 transition-colors text-sm flex items-center gap-2">
                                                        <CheckCircle size={16} /> Pay
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                                        <Utensils size={32} className="text-gray-300 mb-2" />
                                        <p className="text-gray-500 font-semibold text-sm">No active order for this table</p>
                                        <button 
                                            onClick={() => {
                                                handleTableChange({ target: { value: viewedTable.id } });
                                                setViewedTable(null);
                                                setShowTableViewer(false);
                                            }}
                                            className="mt-4 px-4 py-2 bg-brand-500 text-white font-semibold rounded-md hover:bg-brand-600 transition-colors text-sm"
                                        >
                                            Start Order
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
            {/* Orders Drawer */}
            {showOrdersViewer && (
                <div className="fixed inset-0 z-[200] flex justify-end">
                    <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setShowOrdersViewer(false)} />
                    <div className="relative w-full sm:w-96 bg-gray-50 h-full shadow-2xl flex flex-col transform transition-transform duration-300">
                        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <ClipboardList size={20} className="text-blue-600" /> Active Orders
                            </h2>
                            <button onClick={() => setShowOrdersViewer(false)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {activeOrders.length === 0 ? (
                                <p className="text-center text-gray-500 mt-10">No active orders</p>
                            ) : (
                                activeOrders.map(order => (
                                    <div key={order.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex justify-between font-bold mb-2">
                                            <span>Order #{order.order_number}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-brand-600">{currency} {parseFloat(order.grand_total).toFixed(3)}</span>
                                                {order.status === 'completed' && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-green-700 bg-green-100 uppercase">Paid</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 mb-2 flex justify-between">
                                            <span>{order.table?.table_number || 'No Table'}</span>
                                            <span>{order.customer?.name || 'Walk-in'}</span>
                                        </div>
                                        {order.status === 'completed' ? (
                                            <div className="text-center py-2 bg-green-50 text-green-700 rounded text-xs font-semibold border border-green-200">
                                                Completed & Paid (In Kitchen)
                                            </div>
                                        ) : (
                                            <button onClick={() => {
                                                loadOrder(order.table?.id || null, order.id);
                                                setShowOrdersViewer(false);
                                            }} className="w-full py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded text-sm font-semibold hover:bg-blue-100 transition-colors">
                                                Load Order
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cash Movement Drawer */}
            {showCashMovement && (
                <div className="fixed inset-0 z-[200] flex justify-end">
                    <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setShowCashMovement(false)} />
                    <div className="relative w-full sm:w-96 bg-gray-50 h-full shadow-2xl flex flex-col transform transition-transform duration-300">
                        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Store size={20} className="text-teal-600" /> Cash Movement
                            </h2>
                            <button onClick={() => setShowCashMovement(false)} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 bg-white flex-1 overflow-y-auto">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                router.post(route('pos.cash-movement'), {
                                    type: formData.get('type'),
                                    amount: formData.get('amount'),
                                    notes: formData.get('notes'),
                                    bank_account_id: defaultAccount?.id
                                }, {
                                    onSuccess: () => {
                                        setShowCashMovement(false);
                                    }
                                });
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
                                    <div className="flex gap-2">
                                        <label className="flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer bg-white has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50">
                                            <input type="radio" name="type" value="deposit" className="sr-only" defaultChecked />
                                            <span className="font-semibold text-sm">Cash In</span>
                                        </label>
                                        <label className="flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer bg-white has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
                                            <input type="radio" name="type" value="withdrawal" className="sr-only" />
                                            <span className="font-semibold text-sm">Cash Out</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({currency})</label>
                                    <input type="number" step="0.001" min="0.001" required name="amount" className="w-full border-gray-200 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm" placeholder="0.000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea name="notes" rows="3" required className="w-full border-gray-200 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-gray-400" placeholder="Reason for cash movement..."></textarea>
                                </div>
                                {defaultAccount ? (
                                    <button type="submit" className="w-full py-2.5 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 mt-4 transition-colors">
                                        Record Movement
                                    </button>
                                ) : (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 mt-4 text-center">
                                        No cash account configured. Please create a Cash bank account first.
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Viewer Modal */}
            {viewingQrAccount && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center relative border border-gray-100">
                        <button 
                            type="button"
                            onClick={() => setViewingQrAccount(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                            <QrCode size={24} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">Scan to Pay</h3>
                        <p className="text-xs text-gray-500 mb-3">{viewingQrAccount.account_name} &bull; {viewingQrAccount.bank_name}</p>
                        
                        <div className="p-3 bg-white border-2 border-dashed border-brand-200 rounded-2xl inline-block shadow-inner mb-3">
                            <img 
                                src={viewingQrAccount.qr_code_url ? viewingQrAccount.qr_code_url.replace('/storage/', '/img/') : ''} 
                                alt="Payment QR" 
                                onError={(e) => {
                                    if (e.target.src && e.target.src.includes('/storage/')) {
                                        e.target.src = e.target.src.replace('/storage/', '/img/');
                                    }
                                }}
                                className="w-56 h-56 object-contain rounded-xl"
                            />
                        </div>
                        
                        <div className="text-2xl font-black text-brand-700 mb-1">
                            {currency}{total.toFixed(2)}
                        </div>
                        {viewingQrAccount.account_number && (
                            <p className="text-xs font-mono text-gray-400 mb-4">A/C: {viewingQrAccount.account_number}</p>
                        )}

                        <button 
                            type="button"
                            onClick={() => setViewingQrAccount(null)}
                            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
