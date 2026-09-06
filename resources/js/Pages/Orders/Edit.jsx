import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { Plus, Minus, ArrowLeft, Coffee, Check, X, ShieldAlert, CreditCard, CheckCircle2, Percent, Banknote, QrCode, Wallet, UserPlus, Search, Gift, User, BookOpen, Clock, Flame, Bell, Utensils } from 'lucide-react';

export default function EditOrder({ order, menus, table, customers, categories, addons, taxes, reservation_id }) {
    const { settings, auth, bankAccounts } = usePage().props;
    const userRole = auth?.user?.role;
    const currency = settings?.currency_symbol || 'रू.';
    const isCreate = !order;
    const currentTable = isCreate ? table : order.table;
    
    const getFallbackImage = (itemName) => {
        const name = (itemName || '').toLowerCase();
        if (name.includes('tea')) return '/images/tea.png';
        return '/images/coffee.png';
    };
    
    const [cart, setCart] = useState(
        isCreate ? [] : order.items.map(i => ({
            id: 'old_' + i.id,          // Unique UI key for this cart line
            order_item_id: i.id,         // Real DB id — tells server this item already exists
            kds_status: i.kds_status,    // Current kitchen status preserved for server logic
            menu_id: i.menu_id,
            name: i.menu.name,
            basePrice: i.menu.price,
            price: i.price,              // Loaded price comes with addons computed historically
            quantity: i.quantity,
            addons: i.addons?.map(a => a.id) || [],
            addonDetails: i.addons || []
        }))
    );
    const [processing, setProcessing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // Config Modal
    const [configModal, setConfigModal] = useState({ isOpen: false, menuItem: null, selectedAddons: [] });

    // Payment & Discount State
    const [discountType, setDiscountType] = useState('amount'); // 'percent' or 'amount'
    const [discountPercent, setDiscountPercent] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [tipAmount, setTipAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'online', 'split', 'credit', 'bank'
    const [cashAmount, setCashAmount] = useState(0);
    const [onlineAmount, setOnlineAmount] = useState(0);
    const [creditAmount, setCreditAmount] = useState(0);
    const [accountPayNow, setAccountPayNow] = useState('');
    const [accountPaymentMode, setAccountPaymentMode] = useState('cash'); // 'cash' or 'online'
    const [duePaymentAmount, setDuePaymentAmount] = useState(0);
    const [bankAccountId, setBankAccountId] = useState(order?.bank_account_id || '');

    useEffect(() => {
        if ((paymentMethod === 'online' || paymentMethod === 'split') && !bankAccountId && bankAccounts?.length > 0) {
            const preferred = bankAccounts.find(a => a.account_type === 'online') || bankAccounts[0];
            if (preferred) setBankAccountId(preferred.id);
        }
    }, [paymentMethod, bankAccounts, bankAccountId]);

    // Customer & Loyalty State
    const [selectedCustomerId, setSelectedCustomerId] = useState(order?.customer_id || '');
    const [pointsRedeemed, setPointsRedeemed] = useState(0);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', birthday: '' });
    const [customerSearch, setCustomerSearch] = useState('');

    const selectedCustomer = useMemo(() => 
        (customers || []).find(c => c.id === Number(selectedCustomerId)), 
    [customers, selectedCustomerId]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearch || !customers) return [];
        return customers.filter(c => 
            c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
            (c.phone && c.phone.includes(customerSearch))
        ).slice(0, 5);
    }, [customers, customerSearch]);

    const activeCategories = categories || [];
    const [activeTab, setActiveTab] = useState('All');

    const filteredMenu = useMemo(() => {
        if (!menus) return [];
        if (activeTab === 'All') return menus;
        const matchedCat = activeCategories.find(c => c.name === activeTab);
        if (!matchedCat) return [];
        return menus.filter(m => Number(m.category_id) === Number(matchedCat.id));
    }, [menus, activeTab, activeCategories]);

    const isOutOfStock = (menuItem) => {
        if (!menuItem.recipes || menuItem.recipes.length === 0) return false;
        return menuItem.recipes.some(recipe => {
            const item = recipe.inventory_item || recipe.inventoryItem;
            if (!item) return false;
            return (parseFloat(item.current_stock) || 0) < (parseFloat(recipe.quantity_per_serving) || 0);
        });
    };

    const handleMenuClick = (menuItem) => {
        if (isOutOfStock(menuItem)) return;
        // Automatically add if no addons exist in system, else configure
        if (!addons || addons.length === 0) {
            confirmAddToCart(menuItem, []);
        } else {
            setConfigModal({ isOpen: true, menuItem, selectedAddons: [] });
        }
    };

    const toggleConfigAddon = (addonId) => {
        setConfigModal(prev => {
            const exists = prev.selectedAddons.includes(addonId);
            return {
                ...prev,
                selectedAddons: exists ? prev.selectedAddons.filter(id => id !== addonId) : [...prev.selectedAddons, addonId]
            };
        });
    };

    const confirmAddToCart = (menuItem = configModal.menuItem, selectedAddons = configModal.selectedAddons) => {
        setCart(prev => {
            // Sort addons to reliably compare
            const sortedAddons = [...selectedAddons].sort();
            
            // Find an existing NON-DELIVERED line with the same menu + addons config.
            // We intentionally SKIP delivered lines — they must never be merged because
            // a delivered item cannot be sent back to the kitchen. Adding more of the same
            // item after delivery should always produce a fresh pending line.
            const existingIndex = prev.findIndex(i => 
                i.menu_id === menuItem.id && 
                i.kds_status !== 'delivered' &&      // ← key guard
                JSON.stringify([...i.addons].sort()) === JSON.stringify(sortedAddons)
            );

            if (existingIndex >= 0) {
                // Merge into existing non-delivered line
                const newCart = [...prev];
                newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + 1 };
                return newCart;
            }
            
            // Calculate computed line price
            let computedPrice = parseFloat(menuItem.price);
            const addonDetails = [];
            sortedAddons.forEach(id => {
                const adn = (addons || []).find(a => a.id === id);
                if (adn) {
                    computedPrice += parseFloat(adn.price);
                    addonDetails.push(adn);
                }
            });

            // Brand-new line — no order_item_id so backend treats it as a new kitchen ticket
            return [...prev, { 
                id: Math.random().toString(36).substr(2, 9), 
                order_item_id: null,       // explicitly null → goes to kitchen as pending
                kds_status: null,
                menu_id: menuItem.id, 
                name: menuItem.name, 
                basePrice: menuItem.price,
                price: computedPrice, 
                quantity: 1,
                addons: sortedAddons,
                addonDetails: addonDetails
            }];
        });
        
        setConfigModal({ isOpen: false, menuItem: null, selectedAddons: [] });
    };

    const updateQuantity = (cartId, change) => {
        setCart(prev => {
            return prev.map(i => {
                if (i.id === cartId) {
                    const newQ = i.quantity + change;
                    return newQ > 0 ? { ...i, quantity: newQ } : i;
                }
                return i;
            }).filter(i => i.quantity > 0);
        });
    };

    const removeFromCart = (cartId) => {
        setCart(prev => prev.filter(i => i.id !== cartId));
    };

    const saveOrder = (newStatus = null, paymentData = {}) => {
        if (cart.length === 0) {
            if (isCreate) {
                router.visit(route('dashboard'));
                return;
            }
            if (order.status === 'pending' && !newStatus) {
                router.delete(route('orders.destroy', order.id), {
                    onSuccess: () => router.visit(route('dashboard'))
                });
                return;
            }
        }

        setProcessing(true);
        
        if (isCreate) {
            router.post(route('orders.store'), {
                table_id: currentTable.id,
                items: cart,
                status: newStatus || 'pending',
                customer_id: selectedCustomerId || null,
                discount_percentage: discountPercent,
                discount_amount: totalDiscount,
                tip_amount: tipAmount,
                cash_amount: cashAmount,
                online_amount: onlineAmount,
                payment_method: paymentMethod,
                bank_account_id: bankAccountId,
                points_redeemed: pointsRedeemed,
                reservation_id: reservation_id,
                due_payment_amount: duePaymentAmount,
                ...paymentData
            }, {
                onSuccess: (page) => {
                    if (newStatus !== 'completed') {
                        router.visit(route('orders.index'));
                    }
                },
                onFinish: () => setProcessing(false)
            });
        } else {
            router.put(route('orders.update', order.id), {
                // Send order_item_id + kds_status so backend knows which items already exist
                items: cart.map(i => ({
                    menu_id:       i.menu_id,
                    quantity:      i.quantity,
                    addons:        i.addons,
                    price:         i.price,
                    order_item_id: i.order_item_id || null,   // null = brand new item
                    kds_status:    i.kds_status    || null,
                })),
                status: newStatus || order.status,
                customer_id: selectedCustomerId || null,
                points_redeemed: pointsRedeemed,
                due_payment_amount: duePaymentAmount,
                ...paymentData
            }, {
                onSuccess: () => {
                    if (newStatus !== 'completed') {
                        router.visit(route('orders.index'));
                    }
                },
                onFinish: () => setProcessing(false)
            });
        }
    };

    const markAsCompleted = () => {
        setPaymentMethod('cash');
        setDuePaymentAmount(0);
        setCashAmount(grandTotal);
        setOnlineAmount(0);
        setCreditAmount(0);
        setShowConfirm(true);
    };

    const confirmCompletion = () => {
        setShowConfirm(false);
        saveOrder('completed', {
            discount_percentage: discountPercent,
            discount_amount: totalDiscount,
            tip_amount: tipAmount,
            cash_amount: cashAmount,
            online_amount: onlineAmount,
            payment_method: paymentMethod,
            bank_account_id: bankAccountId,
            points_redeemed: pointsRedeemed,
            credit_amount: creditAmount,
            due_payment_amount: duePaymentAmount,
        });
    };

    const handleAddCustomer = (e) => {
        e.preventDefault();
        router.post(route('customers.store'), newCustomer, {
            onSuccess: () => {
                setShowCustomerModal(false);
                setNewCustomer({ name: '', phone: '', email: '', birthday: '' });
            }
        });
    };

    const handleBack = (e) => {
        e.preventDefault();
        if (isCreate) {
            router.visit(route('dashboard'));
        } else if (cart.length === 0 && order.status === 'pending') {
            router.delete(route('orders.destroy', order.id), {
                onSuccess: () => router.visit(route('dashboard'))
            });
        } else {
            router.visit(route('dashboard'));
        }
    };

    const subtotal = useMemo(() => cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0), [cart]);

    const totalDiscount = useMemo(() => {
        if (discountType === 'percent') {
            return (subtotal * (Number(discountPercent) || 0)) / 100;
        }
        return Number(discountAmount) || 0;
    }, [subtotal, discountType, discountPercent, discountAmount]);

    const taxLines = useMemo(() => {
        const taxableAmount = subtotal - totalDiscount - pointsRedeemed;
        return taxes?.map(tax => ({
            name: tax.name,
            rate: tax.rate,
            amount: (taxableAmount * parseFloat(tax.rate)) / 100
        })) || [];
    }, [subtotal, totalDiscount, pointsRedeemed, taxes]);

    const taxAmount = useMemo(() => {
        return taxLines.reduce((acc, curr) => acc + curr.amount, 0);
    }, [taxLines]);

    const grandTotal = useMemo(() => {
        const taxableAmount = subtotal - totalDiscount - pointsRedeemed;
        const taxVal = taxAmount;
        return taxableAmount + taxVal + (Number(tipAmount) || 0);
    }, [subtotal, totalDiscount, pointsRedeemed, tipAmount, taxAmount]);

    // Handle discount changes to sync percent and amount
    const handleDiscountPercentChange = (val) => {
        if (val === '') {
            setDiscountPercent('');
            setDiscountAmount(0);
            return;
        }
        const num = parseFloat(val);
        if (isNaN(num)) return;
        const percent = Math.min(100, Math.max(0, num));
        setDiscountPercent(percent);
        setDiscountAmount((subtotal * percent) / 100);
    };

    const handleDiscountAmountChange = (val) => {
        if (val === '') {
            setDiscountAmount('');
            setDiscountPercent(0);
            return;
        }
        const num = parseFloat(val);
        if (isNaN(num)) return;
        const amount = Math.min(subtotal, Math.max(0, num));
        setDiscountAmount(amount);
        setDiscountPercent(subtotal > 0 ? (amount / subtotal) * 100 : 0);
    };

    // Auto-calculate split amounts when grand total changes
    useEffect(() => {
        if (paymentMethod === 'cash') {
            setCashAmount(grandTotal);
            setOnlineAmount(0);
            setCreditAmount(0);
            setDuePaymentAmount(0);
        } else if (paymentMethod === 'online') {
            setCashAmount(0);
            setOnlineAmount(grandTotal);
            setCreditAmount(0);
            setDuePaymentAmount(0);
        } else if (paymentMethod === 'credit') {
            const payVal = Number(accountPayNow) || 0;
            if (payVal >= grandTotal) {
                setCreditAmount(0);
                setDuePaymentAmount(payVal - grandTotal);
                if (accountPaymentMode === 'cash') {
                    setCashAmount(payVal);
                    setOnlineAmount(0);
                } else {
                    setOnlineAmount(payVal);
                    setCashAmount(0);
                }
            } else {
                setCreditAmount(grandTotal - payVal);
                setDuePaymentAmount(0);
                if (accountPaymentMode === 'cash') {
                    setCashAmount(payVal);
                    setOnlineAmount(0);
                } else {
                    setOnlineAmount(payVal);
                    setCashAmount(0);
                }
            }
        } else if (paymentMethod === 'split') {
            setCreditAmount(0);
            setDuePaymentAmount(0);
            // Keep existing split if any, otherwise default to half-half or similar
            if (cashAmount + onlineAmount !== grandTotal) {
                setCashAmount(grandTotal - onlineAmount);
            }
        }
    }, [grandTotal, paymentMethod, accountPayNow, accountPaymentMode]);

    return (
        <>
        <AuthenticatedLayout>
            <Head title={`Table ${currentTable?.table_number} - POS`} />

            <div className="flex flex-col space-y-6 lg:h-[calc(100vh-140px)] pb-48 sm:pb-0">
                {/* Header */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={handleBack} 
                                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 shadow-xs outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Back to Table Book"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-black text-gray-950 tracking-tight leading-none mb-1.5">
                                    Table {currentTable?.table_number}
                                </h1>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-xl border ${
                                        isCreate 
                                        ? 'bg-red-50 text-red-600 border-red-100' 
                                        : order.status === 'completed' 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                        : order.status === 'preparing' 
                                        ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                        : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                        {isCreate ? 'NEW ORDER' : order.status}
                                    </span>
                                    {!isCreate && <span className="text-xs font-bold text-gray-400">#{order.order_number || order.id.toString().slice(-8)}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                            <button 
                                onClick={() => saveOrder()} 
                                disabled={processing}
                                className="bg-brand-600 hover:bg-brand-700 focus:bg-brand-700 focus:ring-4 focus:ring-brand-500/30 text-white font-bold py-2.5 px-3 sm:px-6 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] outline-none flex items-center justify-center space-x-1.5 sm:space-x-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base min-w-[80px] sm:min-w-0"
                            >
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Save Order</span>
                                <span className="sm:hidden">Save</span>
                            </button>
                            
                            {(isCreate || (order && order.status !== 'completed')) && userRole !== 'waiter' && (
                                <button 
                                    onClick={markAsCompleted} 
                                    disabled={processing}
                                    className="bg-emerald-500 hover:bg-emerald-600 focus:bg-emerald-600 focus:ring-4 focus:ring-emerald-500/30 text-white font-bold py-2.5 px-3 sm:px-6 rounded-xl shadow-emerald-500/30 shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] outline-none flex items-center justify-center space-x-1.5 sm:space-x-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base min-w-[80px] sm:min-w-0"
                                >
                                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Pay & Complete</span>
                                    <span className="sm:hidden">Pay</span>
                                </button>
                            )}

                        </div>
                    </div>
                </div>

                {/* POS Layout */}
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 flex-1 min-h-0">
                    
                    {/* Left: Menu Items Select */}
                    <div className="lg:col-span-8 flex flex-col bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden order-2 lg:order-1">
                        {/* Tabs */}
                        <div className="flex px-6 border-b border-gray-100 overflow-x-auto custom-scrollbar shrink-0 gap-2 bg-gray-50/40">
                            {[{id: 'all', name: 'All'}, ...activeCategories].map(cat => (
                                <button
                                    key={cat.id || cat.name}
                                    onClick={() => setActiveTab(cat.name)}
                                    className={`relative px-5 py-4 text-xs font-black uppercase tracking-widest focus:outline-none transition-all duration-200 whitespace-nowrap border-b-2 ${
                                        activeTab === cat.name 
                                        ? 'border-red-600 text-red-600 font-extrabold' 
                                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Menu Grid */}
                        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                            {!menus ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-48 w-full"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredMenu.map(menuItem => {
                                        const outOfStock = isOutOfStock(menuItem);
                                        return (
                                            <button
                                                key={menuItem.id}
                                                onClick={() => handleMenuClick(menuItem)}
                                                disabled={outOfStock}
                                                className={`group flex flex-col text-left rounded-2xl bg-white shadow-sm border border-gray-100 transition-all duration-300 overflow-hidden outline-none ${
                                                    outOfStock
                                                        ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                                        : 'hover:border-red-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
                                                }`}
                                            >
                                                {/* Image Block */}
                                                <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden relative">
                                                    <img 
                                                        src={menuItem.image_url || getFallbackImage(menuItem.name)} 
                                                        alt={menuItem.name} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                    />
                                                    
                                                    {/* Badge overlay on lower-left portion of the image */}
                                                    <div className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-white border border-red-50 flex items-center justify-center shadow-sm">
                                                        <Coffee className="w-4 h-4 text-red-500" strokeWidth={2.5}/>
                                                    </div>

                                                    {outOfStock && (
                                                        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-black uppercase bg-red-100 text-red-600 rounded">
                                                            Out of Stock
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Details Block */}
                                                <div className="p-3 w-full flex flex-col justify-between flex-grow">
                                                    <div>
                                                        <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 leading-tight mb-1 group-hover:text-red-600 transition-colors line-clamp-2">
                                                            {menuItem.name}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2 w-full">
                                                        <span className="text-xs sm:text-sm font-black text-red-600">
                                                            {currency} {menuItem.price}
                                                        </span>
                                                        
                                                        {!outOfStock && (
                                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 group-hover:bg-red-500 transition-colors">
                                                                <Plus className="w-3.5 h-3.5 text-red-600 group-hover:text-white transition-colors" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Current Order Cart */}
                    <div className="lg:col-span-4 flex flex-col bg-white/80 backdrop-blur-2xl rounded-3xl border border-white shadow-lg overflow-hidden order-1 lg:order-2 lg:sticky lg:top-6 lg:h-fit">
                        <div className="p-4 sm:p-5 border-b border-gray-100 shrink-0 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex justify-between items-center mb-1">
                                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Current Order</h2>
                                <button 
                                    onClick={() => setShowCustomerModal(true)}
                                    className="p-2 sm:p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 focus:bg-brand-100 focus:ring-2 focus:ring-brand-500/30 transition-colors outline-none"
                                    title="Add New Customer"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Customer Selection */}
                            <div className="relative mt-2">
                                {!selectedCustomer ? (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input 
                                            type="text"
                                            placeholder="Search customer (Name/Phone)..."
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-xs focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all duration-200 outline-none"
                                        />
                                        {filteredCustomers.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                                {filteredCustomers.map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => {
                                                            setSelectedCustomerId(c.id);
                                                            setCustomerSearch('');
                                                        }}
                                                        className="w-full px-4 py-2 text-left hover:bg-brand-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                                    >
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900">{c.name}</p>
                                                            <p className="text-[10px] text-gray-500 font-semibold">{c.phone}</p>
                                                        </div>
                                                        <span className="text-[10px] font-black text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-md">
                                                            {floor(c.loyalty_points)} pts
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-2.5 bg-brand-50 rounded-xl border border-brand-100">
                                        <div className="flex items-center space-x-2 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-600 shadow-sm shrink-0">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-brand-900 truncate">{selectedCustomer.name}</p>
                                                <p className="text-[10px] font-semibold text-brand-500">{selectedCustomer.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-brand-400 uppercase leading-none">Due &bull; Points</p>
                                                <p className="text-xs font-black text-brand-700">
                                                    {Number(selectedCustomer.due_amount) > 0 && <span className="text-rose-500 mr-2">{currency}{Number(selectedCustomer.due_amount).toFixed(0)}</span>}
                                                    {floor(selectedCustomer.loyalty_points)}
                                                </p>
                                            </div>
                                            <button onClick={() => setSelectedCustomerId('')} className="p-1 hover:text-red-500 transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                                    <ShieldAlert className="w-12 h-12 text-gray-400 mb-3" />
                                    <p className="text-sm font-semibold text-gray-500">Order is empty.<br/>Select items from the menu.</p>
                                </div>
                            ) : (
                                cart.map(item => {
                                    const isDelivered = item.kds_status === 'delivered';
                                    const isReady     = item.kds_status === 'ready';
                                    const isPreparing = item.kds_status === 'preparing';
                                    const isPending   = !item.kds_status || item.kds_status === 'pending';

                                    // Card border/background by status
                                    const cardClass = isDelivered ? 'bg-emerald-50/60 border-emerald-200'
                                                    : isReady     ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200 shadow-blue-100'
                                                    : isPreparing ? 'bg-amber-50/50 border-amber-200'
                                                    :               'bg-white border-gray-100 hover:shadow-md';

                                    return (
                                    <div key={item.id} className={`flex flex-col rounded-2xl border shadow-sm transition-all group overflow-hidden ${cardClass}`}>
                                        {/* Ready to Serve — top accent bar */}
                                        {isReady && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                <Bell className="w-3 h-3" />
                                                Ready to Serve! — Awaiting pickup
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start p-3 sm:p-4">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className={`text-sm font-bold truncate ${
                                                        isDelivered ? 'text-emerald-800' :
                                                        isReady     ? 'text-blue-800'    :
                                                        isPreparing ? 'text-amber-800'   : 'text-gray-900'
                                                    }`}>{item.name}</h4>

                                                    {/* KDS Status Badge */}
                                                    {isDelivered && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                                                            <CheckCircle2 className="w-2.5 h-2.5" /> Delivered
                                                        </span>
                                                    )}
                                                    {isReady && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-blue-100 text-blue-700 border border-blue-300 shrink-0">
                                                            <Utensils className="w-2.5 h-2.5" /> Ready
                                                        </span>
                                                    )}
                                                    {isPreparing && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                                                            <Flame className="w-2.5 h-2.5" /> Preparing
                                                        </span>
                                                    )}
                                                    {isPending && item.order_item_id && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
                                                            <Clock className="w-2.5 h-2.5" /> Waiting
                                                        </span>
                                                    )}
                                                </div>

                                                {item.addonDetails && item.addonDetails.length > 0 && (
                                                    <div className="mt-1 flex flex-col space-y-0.5">
                                                        {item.addonDetails.map((adn, idx) => (
                                                            <span key={idx} className="text-[10px] font-bold text-brand-500 uppercase tracking-tight">
                                                                + {adn.name || adn.pivot?.name_at_time}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className={`text-xs font-semibold mt-1 ${
                                                    isDelivered ? 'text-emerald-600' :
                                                    isReady     ? 'text-blue-600'    :
                                                    isPreparing ? 'text-amber-600'   : 'text-gray-500'
                                                }`}>{currency} {parseFloat(item.price).toFixed(2)} each</p>
                                            </div>

                                            <div className="flex items-center space-x-2 shrink-0 self-center">
                                                {(isDelivered || isPreparing) ? (
                                                    // Locked quantity display for non-actionable states
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm ${
                                                        isDelivered ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {item.quantity}
                                                    </div>
                                                ) : isReady ? (
                                                    // Ready: show locked qty
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm bg-blue-100 text-blue-700">
                                                        {item.quantity}
                                                    </div>
                                                ) : (
                                                    // New/editable: full quantity controls
                                                    <>
                                                        <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-1 border border-gray-100">
                                                            <button 
                                                                onClick={() => updateQuantity(item.id, -1)}
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-gray-600 hover:text-red-600 shadow-sm transition-colors focus:outline-none"
                                                            >
                                                                <Minus className="w-3.5 h-3.5" />
                                                            </button>
                                                            <span className="w-4 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                                                            <button 
                                                                onClick={() => updateQuantity(item.id, 1)}
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <button 
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-200/60 hover:border-rose-200/80 active:scale-90 transition-all focus:outline-none shrink-0 flex-shrink-0"
                                                            title="Remove Item"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Ready to Serve — Deliver action button at bottom */}
                                        {isReady && (
                                            <div className="px-3 pb-3">
                                                <button
                                                    onClick={() => {
                                                        router.post(
                                                            route('order-items.update-status', item.order_item_id),
                                                            { status: 'delivered' },
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess: () => {
                                                                    // Inertia's preserveScroll won't re-run useState,
                                                                    // so we update the cart state directly here so
                                                                    // the UI reacts immediately without a page reload.
                                                                    setCart(prev => prev.map(c =>
                                                                        c.order_item_id === item.order_item_id
                                                                            ? { ...c, kds_status: 'delivered' }
                                                                            : c
                                                                    ));
                                                                }
                                                            }
                                                        );
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow shadow-blue-500/25 transition-all active:scale-[0.98]"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Mark Delivered
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Totals & Actions block */}
                        <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0 mt-auto">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-gray-500">Subtotal</span>
                                <span className="text-sm font-bold text-gray-900">{currency} {subtotal.toFixed(2)}</span>
                            </div>
                            
                            {/* Points Redemption UI */}
                            {selectedCustomer && Number(selectedCustomer.loyalty_points) > 0 && (
                                <div className="flex flex-col space-y-2 mb-3 mt-2 p-3 bg-white rounded-2xl border border-brand-100 border-dashed">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-1.5 text-brand-600">
                                            <Gift className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-tight">Redeem Points</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-brand-400">1 pt = {currency} 1</span>
                                    </div>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <input 
                                            type="range"
                                            min="0"
                                            max={Math.min(floor(selectedCustomer.loyalty_points), subtotal - totalDiscount)}
                                            value={pointsRedeemed}
                                            onChange={(e) => setPointsRedeemed(Number(e.target.value))}
                                            className="flex-1 h-1 bg-brand-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                        />
                                        <span className="text-xs font-black text-brand-700 w-12 text-right">-{currency} {pointsRedeemed}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-1 text-emerald-600">
                                <span className="text-sm font-semibold">Discount</span>
                                <span className="text-sm font-bold">- {currency} {totalDiscount.toFixed(2)}</span>
                            </div>
                            <div className="space-y-1 mb-4">
                                {taxLines.map((tax, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-amber-600/80">
                                        <span className="text-[11px] font-bold uppercase tracking-tight">{tax.name} ({tax.rate}%)</span>
                                        <span className="text-[11px] font-black">+ {currency} {tax.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                                {taxLines.length > 1 && (
                                    <div className="flex justify-between items-center text-amber-600 border-t border-amber-100 pt-1 mt-1">
                                        <span className="text-xs font-bold uppercase">Total Tax</span>
                                        <span className="text-xs font-black">+ {currency} {taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {taxLines.length === 0 && (
                                    <div className="flex justify-between items-center text-amber-600">
                                        <span className="text-sm font-semibold">Tax</span>
                                        <span className="text-sm font-bold">+ {currency} 0.00</span>
                                    </div>
                                )}
                            </div>
                            <div className="h-px bg-gray-200 w-full mb-4"></div>
                            <div className="flex justify-between items-end mb-6">
                                <span className="text-base font-bold text-gray-700 uppercase tracking-widest">Total</span>
                                <span className="text-3xl font-black text-brand-700 tracking-tight">{currency} {grandTotal.toFixed(2)}</span>
                            </div>

                        </div>
                    </div>

                </div>
            </div>


            {/* Mobile Bottom Sticky Action Bar */}
            <div className="sm:hidden fixed bottom-[110px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] z-[45] bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-[2rem] p-3 flex items-center justify-between gap-3 duration-500">
                <div className="pl-3">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
                        <p className="text-xl font-black text-brand-700 tracking-tight leading-none">{currency} {grandTotal.toFixed(2)}</p>
                        {taxLines.length > 0 && (
                            <div className="flex flex-wrap gap-x-2 mt-1">
                                {taxLines.map((tax, idx) => (
                                    <p key={idx} className="text-[8px] font-black text-amber-600 uppercase tracking-tighter opacity-80">
                                        {tax.name.slice(0,3)}: {currency}{tax.amount.toFixed(1)}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {isCreate ? (
                        <>
                            <button 
                                onClick={() => saveOrder()}
                                disabled={processing}
                                className="h-12 px-6 flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/25 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" strokeWidth={3} />
                                <span>Save Order</span>
                            </button>

                            {userRole !== 'waiter' && (
                                <button 
                                    onClick={markAsCompleted}
                                    disabled={processing}
                                    className="h-12 px-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Pay Now</span>
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => saveOrder()}
                                disabled={processing}
                                className="h-12 w-12 flex items-center justify-center rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 active:scale-95 transition-all disabled:opacity-50"
                                title="Save Changes"
                            >
                                <Check className="w-5 h-5" />
                            </button>
                            
                            {order.status !== 'completed' && userRole !== 'waiter' && (
                                <button 
                                    onClick={markAsCompleted}
                                    disabled={processing}
                                    className="h-12 px-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Pay</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>

        {/* Pay & Complete Confirmation Modal */}
        {showConfirm && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" onClick={() => setShowConfirm(false)}></div>
                <div className="relative z-10 w-full max-w-lg md:max-w-2xl max-h-[90vh] md:max-h-none rounded-3xl bg-white border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden transform transition-all">
                    
                    <div className="flex flex-col md:flex-row h-full max-h-[90vh] md:max-h-none overflow-y-auto">
                        {/* Left Side: Summary */}
                        <div className="md:w-5/12 bg-gray-50 p-4 md:p-8 flex flex-col justify-between border-r border-gray-100">
                            <div>
                                <h3 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight mb-4 md:mb-6">Order Summary</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-semibold">Subtotal</span>
                                        <span className="text-gray-900 font-bold">{currency} {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-emerald-600">
                                        <span className="font-semibold">Discount</span>
                                        <span className="font-bold">- {currency} {totalDiscount.toFixed(2)}</span>
                                    </div>
                                    <div className="space-y-1.5 py-1">
                                        {taxLines.map((tax, idx) => (
                                            <div key={idx} className="flex justify-between text-[11px] text-amber-600/90 font-bold border-l-2 border-amber-100 pl-2">
                                                <span>{tax.name} ({tax.rate}%)</span>
                                                <span>+ {currency}{tax.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-sm text-brand-600">
                                        <span className="font-semibold">Tips</span>
                                        <span className="font-bold">+ {currency} {Number(tipAmount).toFixed(2)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-200 mt-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payable Amount</span>
                                            <span className="text-xl md:text-2xl font-black text-gray-900">{currency}{grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-200 pb-12 sm:pb-0">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 md:mb-4">Payment Method</p>
                                <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                                    <button 
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <Banknote className="w-4 h-4 md:w-5 md:h-5 mb-1" />
                                        <span className="text-[9px] md:text-[10px] font-bold">CASH</span>
                                    </button>
                                    <button 
                                        onClick={() => setPaymentMethod('online')}
                                        className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl border-2 transition-all ${paymentMethod === 'online' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <QrCode className="w-4 h-4 md:w-5 md:h-5 mb-1" />
                                        <span className="text-[9px] md:text-[10px] font-bold">ONLINE</span>
                                    </button>
                                    <button 
                                        onClick={() => setPaymentMethod('split')}
                                        className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl border-2 transition-all ${paymentMethod === 'split' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <Wallet className="w-4 h-4 md:w-5 md:h-5 mb-1" />
                                        <span className="text-[9px] md:text-[10px] font-bold">SPLIT</span>
                                    </button>

                                    <button 
                                        onClick={() => setPaymentMethod('credit')}
                                        className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl border-2 transition-all ${paymentMethod === 'credit' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <BookOpen className="w-4 h-4 md:w-5 md:h-5 mb-1" />
                                        <span className="text-[9px] md:text-[10px] font-bold text-center leading-tight mt-[1px]">ACCOUNT<br/>SETTLE</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Inputs */}
                        <div className="md:w-7/12 p-4 md:p-8">
                            <div className="flex justify-between items-center mb-4 md:mb-6">
                                <h3 className="text-lg md:text-xl font-bold text-gray-900">Payment Details</h3>
                                <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                    <X className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
                            </div>

                            <div className="space-y-4 md:space-y-6 pb-24 sm:pb-0">
                                {/* Discount Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                                            <Percent className="w-3 h-3 mr-1" /> Discount (%)
                                        </label>
                                        <input 
                                            type="number" 
                                            value={discountPercent}
                                            onChange={(e) => handleDiscountPercentChange(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                                            {currency} Discount (Val)
                                        </label>
                                        <input 
                                            type="number" 
                                            value={discountAmount}
                                            onChange={(e) => handleDiscountAmountChange(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        Tip Amount ({currency})
                                    </label>
                                    <input 
                                        type="number" 
                                        value={tipAmount}
                                        onChange={(e) => setTipAmount(e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
                                        placeholder="0.00"
                                    />
                                </div>

                                {selectedCustomer && Number(selectedCustomer.due_amount) > 0 && paymentMethod !== 'credit' && (
                                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                                        <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2 flex justify-between">
                                            <span>Pay Previous Due</span>
                                            <span className="text-rose-500 text-[9px]">Max: {currency}{Number(selectedCustomer.due_amount).toFixed(2)}</span>
                                        </label>
                                        <input 
                                            type="number" 
                                            value={duePaymentAmount}
                                            onChange={(e) => {
                                                const val = Math.max(0, Math.min(Number(e.target.value) || 0, selectedCustomer.due_amount));
                                                setDuePaymentAmount(val || '');
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full bg-white border border-rose-100 rounded-xl py-2 px-3 text-sm font-bold text-rose-700 focus:ring-2 focus:ring-rose-500/20"
                                            placeholder="0.00"
                                            max={selectedCustomer.due_amount}
                                        />
                                    </div>
                                )}

                                {/* Split Payment Detail */}
                                {paymentMethod === 'split' && (
                                    <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Cash Amount</label>
                                                <input 
                                                    type="number" 
                                                    value={cashAmount}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCashAmount(val);
                                                        setOnlineAmount(grandTotal - (Number(val) || 0));
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    className="w-full bg-white border-none rounded-lg py-2 px-3 text-sm font-bold text-brand-700 focus:ring-2 focus:ring-brand-500/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Online Amount</label>
                                                <input 
                                                    type="number" 
                                                    value={onlineAmount}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setOnlineAmount(val);
                                                        setCashAmount(grandTotal - (Number(val) || 0));
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    className="w-full bg-white border-none rounded-lg py-2 px-3 text-sm font-bold text-brand-700 focus:ring-2 focus:ring-brand-500/20"
                                                />
                                            </div>
                                        </div>

                                        {Number(onlineAmount) > 0 && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Select Bank Account for Online Portion</label>
                                                <select 
                                                    value={bankAccountId}
                                                    onChange={(e) => setBankAccountId(e.target.value)}
                                                    className="w-full bg-white border-none rounded-lg py-2 px-3 text-sm font-bold text-brand-700 focus:ring-2 focus:ring-brand-500/20"
                                                >
                                                    <option value="">Select an account</option>
                                                    {bankAccounts?.map(acc => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.account_name} ({acc.bank_name}) - {currency}{acc.balance}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bank Payment Detail */}
                                {paymentMethod === 'online' && (
                                    <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100 space-y-4">
                                        <label className="block text-[10px] font-bold text-brand-400 uppercase mb-1">Select Bank Account</label>
                                        <select 
                                            value={bankAccountId}
                                            onChange={(e) => setBankAccountId(e.target.value)}
                                            className="w-full bg-white border-none rounded-lg py-2 px-3 text-sm font-bold text-brand-700 focus:ring-2 focus:ring-brand-500/20"
                                        >
                                            <option value="">Select an account</option>
                                            {bankAccounts?.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.account_name} ({acc.bank_name}) - {currency}{acc.balance}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* QR Code display for online payment or split payment with online amount */}
                                {(paymentMethod === 'online' || (paymentMethod === 'split' && Number(onlineAmount) > 0)) && bankAccountId && (() => {
                                    const selectedAccount = bankAccounts?.find(acc => String(acc.id) === String(bankAccountId));
                                    if (!selectedAccount) return null;
                                    const payableAmount = paymentMethod === 'split' ? Number(onlineAmount) : Number(grandTotal);

                                    if (selectedAccount.qr_code_url) {
                                        return (
                                            <div className="p-4 bg-white rounded-2xl border border-brand-200 shadow-sm flex flex-col items-center text-center space-y-3">
                                                <div className="flex items-center gap-2 text-brand-700">
                                                    <QrCode className="w-5 h-5 text-brand-600" />
                                                    <span className="text-xs font-black uppercase tracking-wider">Scan & Pay</span>
                                                </div>
                                                <div className="p-2.5 bg-white rounded-2xl border-2 border-dashed border-brand-200 shadow-inner">
                                                    <img 
                                                         src={selectedAccount.qr_code_url} 
                                                         alt="Payment QR Code" 
                                                         className="w-48 h-48 object-contain rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-base font-black text-gray-900">
                                                        {currency}{payableAmount.toFixed(2)}
                                                    </div>
                                                    <p className="text-xs font-bold text-brand-700">
                                                        {selectedAccount.account_name} &bull; {selectedAccount.bank_name}
                                                    </p>
                                                    {selectedAccount.account_number && (
                                                        <p className="text-[11px] font-mono text-gray-500">
                                                            A/C: {selectedAccount.account_number}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-medium text-gray-400">
                                                    Scan with any Mobile Banking or Wallet App
                                                </p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 flex items-center gap-2.5 text-amber-700">
                                            <QrCode className="w-4 h-4 shrink-0 text-amber-500" />
                                            <span className="text-xs font-medium">No payment QR code configured for {selectedAccount.account_name}.</span>
                                        </div>
                                    );
                                })()}

                                {/* Customer Account Settlement Detail */}
                                {paymentMethod === 'credit' && (
                                    <div>
                                        {!selectedCustomer ? (
                                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-3">
                                                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-black text-rose-700">Customer Required</p>
                                                    <p className="text-xs font-semibold text-rose-500 mt-0.5">Please select a customer before accessing account settlements.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-rose-500" />
                                                        <p className="text-xs font-black text-rose-700 uppercase tracking-wider">Account Settlement</p>
                                                    </div>
                                                </div>

                                                <div className="bg-white/60 p-3 rounded-xl border border-rose-100 flex flex-col space-y-2">
                                                    <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                                                        <span>Previous Due</span>
                                                        <span>{currency}{Number(selectedCustomer.due_amount || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                                                        <span>Current Order</span>
                                                        <span>+{currency}{grandTotal.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm font-black text-gray-900 border-t border-rose-200 pt-2">
                                                        <span>Total Balance</span>
                                                        <span>{currency}{(Number(selectedCustomer.due_amount || 0) + grandTotal).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">Amount Paying Today ({currency})</label>
                                                    <input
                                                        type="number"
                                                        value={accountPayNow}
                                                        onChange={(e) => {
                                                            const max = Number(selectedCustomer.due_amount || 0) + grandTotal;
                                                            const val = e.target.value === '' ? '' : Math.max(0, Math.min(Number(e.target.value), max));
                                                            setAccountPayNow(val);
                                                        }}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-full bg-white border-none rounded-lg py-3 px-4 text-sm font-black text-rose-700 focus:ring-2 focus:ring-rose-500/20"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">Payment Mode</label>
                                                    <div className="flex space-x-2">
                                                        <button 
                                                            onClick={() => setAccountPaymentMode('cash')}
                                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${accountPaymentMode === 'cash' ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                                        >
                                                            CASH
                                                        </button>
                                                        <button 
                                                            onClick={() => setAccountPaymentMode('online')}
                                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${accountPaymentMode === 'online' ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                                        >
                                                            ONLINE
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-3 rounded-xl border border-rose-100/50 shadow-sm flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-tight">New Remaining<br/>Due</span>
                                                    <span className="text-lg font-black text-rose-800">
                                                        {currency}{(Number(selectedCustomer.due_amount || 0) + grandTotal - Number(accountPayNow || 0)).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button 
                                        onClick={confirmCompletion}
                                        disabled={processing}
                                        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:scale-[1.01] active:scale-[0.99] outline-none focus:ring-4 focus:ring-emerald-500/40 flex items-center justify-center space-x-2 disabled:opacity-70"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span>COMPLETE & PRINT</span>
                                    </button>
                                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-4">
                                        By clicking complete, the table will be set to available
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Quick Add Customer Modal */}
        {showCustomerModal && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowCustomerModal(false)}></div>
                <div className="relative z-10 w-full max-w-md rounded-3xl bg-white border border-white/80 shadow-2xl p-8 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">New Member</h3>
                        <button onClick={() => setShowCustomerModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleAddCustomer} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                            <input 
                                type="text" 
                                required
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                            <input 
                                type="text" 
                                required
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
                                placeholder="+91 98XXX XXXXX"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email (Optional)</label>
                            <input 
                                type="email" 
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Birthday (Optional)</label>
                            <input 
                                type="date" 
                                value={newCustomer.birthday}
                                onChange={(e) => setNewCustomer({...newCustomer, birthday: e.target.value})}
                                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>
                        
                        <button 
                            type="submit"
                            className="w-full py-4 mt-4 rounded-2xl bg-brand-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all active:scale-95 flex items-center justify-center space-x-2"
                        >
                            <Check className="w-5 h-5" />
                            <span>Register Member</span>
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* Config Modal */}
        {configModal.isOpen && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfigModal({ isOpen: false, menuItem: null, selectedAddons: [] })}></div>
                <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden duration-200">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-brand-50/50">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 pb-1">{configModal.menuItem?.name}</h3>
                            <p className="text-sm font-bold text-brand-600">{currency} {configModal.menuItem?.price}</p>
                        </div>
                        <button onClick={() => setConfigModal({ isOpen: false, menuItem: null, selectedAddons: [] })} className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[60vh] overflow-y-auto bg-white space-y-3">
                        {addons && addons.length > 0 ? (
                            addons.map(adn => (
                                <button
                                    key={adn.id}
                                    onClick={() => toggleConfigAddon(adn.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all outline-none ${
                                        configModal.selectedAddons.includes(adn.id) 
                                        ? 'border-brand-600 bg-brand-50 ring-4 ring-brand-500/10' 
                                        : 'border-slate-100 bg-white hover:border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                                            configModal.selectedAddons.includes(adn.id) ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'
                                        }`}>
                                            {configModal.selectedAddons.includes(adn.id) && <Check className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">{adn.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-600">+{currency} {parseFloat(adn.price).toFixed(2)}</span>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No customizations available.</p>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 mt-auto">
                        <button 
                            onClick={() => confirmAddToCart()}
                            className="w-full py-4 rounded-[1.5rem] bg-brand-600 text-white font-black text-sm shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all hover:scale-[1.02] active:scale-[0.98] outline-none flex items-center justify-center"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            <span>Add to Order</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

// Helper
const floor = (val) => Math.floor(Number(val) || 0);

