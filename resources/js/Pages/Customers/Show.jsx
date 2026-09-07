import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    Calendar,
    Star,
    ShoppingBag,
    Clock,
    MapPin,
    Receipt,
    TrendingUp,
    Award,
    Gift,
    BookOpen,
    AlertCircle,
    CheckCircle2,
    X,
    DollarSign,
    ChevronDown,
    ChevronUp,
    CreditCard,
    Edit2,
    Trash2,
    Plus
} from 'lucide-react';
import { useState } from 'react';

export default function Show({ customer, orders, pointHistory, creditTransactions, stats, settings }) {
    const currency = settings?.currency_symbol || 'रू.';

    const totalSpent = Number(stats.total_spent) || 0;
    const averageOrderValue = Number(stats.average_order_value) || 0;
    const lastOrderDate = stats.last_order_date ? new Date(stats.last_order_date) : null;
    const dueAmount = Number(stats.due_amount || 0);
    const creditLimit = Number(stats.credit_limit || 0);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Edit Credit Transaction state
    const [editingTx, setEditingTx] = useState(null);
    const [editType, setEditType] = useState('payment');
    const [editAmount, setEditAmount] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editProcessing, setEditProcessing] = useState(false);
    const [editErrors, setEditErrors] = useState({});

    // Delete Credit Transaction state
    const [deletingTx, setDeletingTx] = useState(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    // Add Credit Entry state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType] = useState('payment');
    const [addAmount, setAddAmount] = useState('');
    const [addNote, setAddNote] = useState('');
    const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
    const [addProcessing, setAddProcessing] = useState(false);
    const [addErrors, setAddErrors] = useState({});

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: dueAmount,
        note: '',
    });

    const submitPayment = (e) => {
        e.preventDefault();
        post(route('customers.credit-payment', customer.id), {
            onSuccess: () => { setShowPaymentModal(false); reset(); }
        });
    };

    const handleOpenEditModal = (tx) => {
        setEditingTx(tx);
        setEditType(tx.type);
        setEditAmount(tx.amount);
        setEditNote(tx.note || '');
        if (tx.created_at) {
            const d = new Date(tx.created_at);
            const pad = (n) => String(n).padStart(2, '0');
            const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            setEditDate(formatted);
        } else {
            setEditDate('');
        }
        setEditErrors({});
    };

    const submitEditTx = (e) => {
        e.preventDefault();
        if (!editingTx) return;
        setEditProcessing(true);
        setEditErrors({});
        router.put(route('credit-transactions.update', editingTx.id), {
            type: editType,
            amount: editAmount,
            note: editNote,
            created_at: editDate ? new Date(editDate).toISOString() : undefined,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingTx(null);
                setEditProcessing(false);
            },
            onError: (errs) => {
                setEditErrors(errs);
                setEditProcessing(false);
            }
        });
    };

    const handleOpenDeleteModal = (tx) => {
        setDeletingTx(tx);
    };

    const confirmDeleteTx = () => {
        if (!deletingTx) return;
        setDeleteProcessing(true);
        router.delete(route('credit-transactions.destroy', deletingTx.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingTx(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                setDeleteProcessing(false);
            }
        });
    };

    const handleOpenAddModal = (defaultType = 'payment') => {
        setAddType(defaultType);
        setAddAmount('');
        setAddNote('');
        const today = new Date().toISOString().slice(0, 10);
        setAddDate(today);
        setAddErrors({});
        setShowAddModal(true);
    };

    const submitAddTx = (e) => {
        e.preventDefault();
        setAddProcessing(true);
        setAddErrors({});
        router.post(route('customers.credit-transactions.store', customer.id), {
            type: addType,
            amount: addAmount,
            note: addNote,
            date: addDate ? new Date(addDate).toISOString() : undefined,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddModal(false);
                setAddAmount('');
                setAddNote('');
                setAddProcessing(false);
            },
            onError: (errs) => {
                setAddErrors(errs);
                setAddProcessing(false);
            }
        });
    };

    const getProjectedDueOnEdit = () => {
        if (!editingTx) return dueAmount;
        const oldType = editingTx.type;
        const oldAmt = Number(editingTx.amount) || 0;
        const newType = editType;
        const newAmt = Number(editAmount) || 0;

        let base = dueAmount;
        if (oldType === 'charge') base -= oldAmt;
        else base += oldAmt;

        if (newType === 'charge') base += newAmt;
        else base -= newAmt;

        return Math.max(0, base);
    };

    const getProjectedDueOnAdd = () => {
        const amt = Number(addAmount) || 0;
        let base = dueAmount;
        if (addType === 'charge') base += amt;
        else base -= amt;
        return Math.max(0, base);
    };

    return (
        <AuthenticatedLayout>
            <Head title={`${customer.name} - Customer Details`} />

            <div className="flex flex-col space-y-8 w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route('customers.index')}
                            className="p-3 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/80 shadow-sm hover:shadow-lg transition-all"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center">
                                <User className="w-8 h-8 mr-3 text-blue-600" />
                                {customer.name}
                            </h1>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                Customer ID: MEMBER-{customer.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Orders</p>
                                <p className="text-3xl font-black text-gray-900 mt-2">{stats.total_orders}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Spent</p>
                                <p className="text-3xl font-black text-gray-900 mt-2">{currency}{totalSpent.toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/80 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loyalty Points</p>
                                <p className="text-3xl font-black text-gray-900 mt-2">{customer.loyalty_points}</p>
                            </div>
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                <Star className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Credit Due Card */}
                    <div className={`backdrop-blur-xl p-6 rounded-[2.5rem] border shadow-sm ${
                        dueAmount > 0
                            ? 'bg-rose-50/80 border-rose-200'
                            : 'bg-white/60 border-white/80'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-bold uppercase tracking-widest ${dueAmount > 0 ? 'text-rose-500' : 'text-gray-500'}`}>Credit Due</p>
                                <p className={`text-3xl font-black mt-2 ${dueAmount > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                                    {currency}{dueAmount.toFixed(2)}
                                </p>
                                {creditLimit > 0 && (
                                    <p className="text-xs font-bold text-rose-400 mt-1">Limit: {currency}{creditLimit.toFixed(2)}</p>
                                )}
                            </div>
                            <div className={`p-3 rounded-2xl ${dueAmount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-300'}`}>
                                <BookOpen className="w-6 h-6" />
                            </div>
                        </div>
                        {dueAmount > 0 && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="mt-4 w-full py-2 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <DollarSign className="w-3.5 h-3.5" />
                                Record Payment
                            </button>
                        )}
                    </div>
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact & Point History Column */}
                    <div className="flex flex-col space-y-8">
                        {/* Contact Information */}
                        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-100 bg-white/40">
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">Contact Information</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Phone</p>
                                        <p className="text-lg font-black text-gray-900">{customer.phone}</p>
                                    </div>
                                </div>

                                {customer.email && (
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Email</p>
                                            <p className="text-lg font-black text-gray-900">{customer.email}</p>
                                        </div>
                                    </div>
                                )}

                                {customer.birthday && (
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Birthday</p>
                                            <p className="text-lg font-black text-gray-900">
                                                {new Date(customer.birthday).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Lifetime Points</p>
                                        <p className="text-lg font-black text-gray-900">{customer.lifetime_points || 0}</p>
                                    </div>
                                </div>

                                {lastOrderDate && (
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Last Order</p>
                                            <p className="text-lg font-black text-gray-900">
                                                {lastOrderDate.toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Point Transaction History */}
                        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-sm overflow-hidden text-wrap">
                            <div className="px-8 py-6 border-b border-gray-100 bg-white/40 flex items-center justify-between">
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">Point History</h2>
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                    <Award className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="p-6">
                                {pointHistory && pointHistory.length > 0 ? (
                                    <div className="space-y-4">
                                        {pointHistory.map((log) => (
                                            <div key={log.id} className="flex items-start space-x-4 p-4 rounded-2xl bg-white/40 border border-white/60">
                                                <div className={`p-2 rounded-xl shrink-0 ${
                                                    log.action === 'earned' ? 'bg-emerald-50 text-emerald-600' :
                                                    log.action === 'redeemed' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {log.action === 'earned' ? <TrendingUp className="w-4 h-4" /> :
                                                    log.action === 'redeemed' ? <Gift className="w-4 h-4" /> :
                                                    <Clock className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-gray-900 leading-tight">
                                                        {log.description}
                                                    </p>
                                                    <div className="flex items-center mt-1 space-x-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                            log.action === 'earned' ? 'bg-emerald-100 text-emerald-700' :
                                                            log.action === 'redeemed' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {log.action}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400">
                                                            {log.time_ago}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No activity yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Credit Ledger */}
                        <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-100 bg-white/40 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">Credit Ledger</h2>
                                    <p className="text-[11px] font-bold text-gray-400">History of charges and payments</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenAddModal('payment')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Entry
                                    </button>
                                    <div className={`p-2 rounded-xl ${dueAmount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-300'}`}>
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {creditTransactions && creditTransactions.length > 0 ? (
                                    <div className="space-y-3">
                                        {creditTransactions.map((tx) => (
                                            <div key={tx.id} className={`group relative flex items-start gap-3 p-4 rounded-2xl border transition-all hover:shadow-sm ${
                                                tx.type === 'charge'
                                                    ? 'bg-rose-50/60 border-rose-100 hover:border-rose-200'
                                                    : 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-200'
                                            }`}>
                                                <div className={`p-2 rounded-xl shrink-0 ${
                                                    tx.type === 'charge' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                    {tx.type === 'charge'
                                                        ? <AlertCircle className="w-4 h-4" />
                                                        : <CheckCircle2 className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                            tx.type === 'charge'
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                            {tx.type === 'charge' ? 'CHARGED' : 'PAID'}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-black ${tx.type === 'charge' ? 'text-rose-700' : 'text-emerald-700'}`}>
                                                                {tx.type === 'charge' ? '+' : '-'}{currency}{Number(tx.amount).toFixed(2)}
                                                            </span>
                                                            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenEditModal(tx)}
                                                                    className="p-1 rounded-lg hover:bg-white text-gray-500 hover:text-blue-600 transition-colors shadow-none hover:shadow-sm"
                                                                    title="Edit Transaction"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenDeleteModal(tx)}
                                                                    className="p-1 rounded-lg hover:bg-white text-gray-500 hover:text-rose-600 transition-colors shadow-none hover:shadow-sm"
                                                                    title="Delete Transaction"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs font-semibold text-gray-600 mt-1 leading-snug">{tx.note || '—'}</p>
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mt-1">
                                                        <span>
                                                            {new Date(tx.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {tx.order_id && (
                                                            <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-black text-[9px]">
                                                                Order #{tx.order_id}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No credit activity</p>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenAddModal('payment')}
                                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add First Entry
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order History */}
                    <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 bg-white/40 flex items-center justify-between">
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">Order History</h2>
                            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-black">
                                {stats.total_orders} Orders
                            </span>
                        </div>

                        <div className="p-4">
                            {orders.data.length > 0 ? (
                                <div className="space-y-4">
                                    {orders.data.map(order => {
                                        const orderCreditTxs = creditTransactions?.filter(tx => tx.order_id === order.id) || [];
                                        const chargedCredit = orderCreditTxs.filter(tx => tx.type === 'charge').reduce((sum, tx) => sum + Number(tx.amount), 0);
                                        const paidDue = orderCreditTxs.filter(tx => tx.type === 'payment').reduce((sum, tx) => sum + Number(tx.amount), 0);

                                        return (
                                            <div key={order.id} className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm transition hover:shadow-lg">
                                                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                                        <Receipt className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900">Order #{order.id}</p>
                                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                                            {new Date(order.created_at).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-gray-900">{currency}{Number(order.grand_total || 0).toFixed(2)}</p>
                                                    <p className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-full inline-block ${
                                                        order.status === 'completed'
                                                            ? 'bg-emerald-100 text-emerald-600'
                                                            : order.status === 'pending'
                                                            ? 'bg-amber-100 text-amber-600'
                                                            : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        {order.status}
                                                    </p>
                                                </div>
                                            </div>

                                            <hr className="my-5 border-slate-200" />

                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>Table {order.table?.table_number || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBag className="w-4 h-4" />
                                                    <span>{order.items.length} items</span>
                                                </div>
                                                {order.points_redeemed > 0 ? (
                                                    <div className="flex items-center gap-2 text-rose-500 font-bold">
                                                        <Gift className="w-4 h-4" />
                                                        <span>{order.points_redeemed} pts redeemed</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Gift className="w-4 h-4" />
                                                        <span>No points redeemed</span>
                                                    </div>
                                                )}
                                                {order.points_earned > 0 && (
                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                                        <Award className="w-4 h-4" />
                                                        <span>+{order.points_earned} pts earned</span>
                                                    </div>
                                                )}
                                                {Number(order.cash_amount) > 0 && (
                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                                        <DollarSign className="w-4 h-4" />
                                                        <span>{currency}{Number(order.cash_amount).toFixed(2)} Cash</span>
                                                    </div>
                                                )}
                                                {Number(order.online_amount) > 0 && (
                                                    <div className="flex items-center gap-2 text-blue-600 font-bold">
                                                        <CreditCard className="w-4 h-4" />
                                                        <span>{currency}{Number(order.online_amount).toFixed(2)} Online</span>
                                                    </div>
                                                )}
                                                {chargedCredit > 0 && (
                                                    <div className="flex items-center gap-2 text-rose-500 font-bold">
                                                        <BookOpen className="w-4 h-4" />
                                                        <span>{currency}{chargedCredit.toFixed(2)} Due Added</span>
                                                    </div>
                                                )}
                                                {paidDue > 0 && (
                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>{currency}{paidDue.toFixed(2)} Due Paid</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {order.items.slice(0, 3).map(item => (
                                                        <span key={item.id} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                                            {item.quantity}x {item.menu.name}
                                                        </span>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                                            +{order.items.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all active:scale-95"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                    <p className="text-lg font-bold text-gray-400">No orders yet</p>
                                    <p className="text-sm text-gray-400">This customer hasn't placed any orders</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {orders.last_page > 1 && (
                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600">
                                            Showing {orders.from} to {orders.to} of {orders.total} orders
                                        </p>
                                        <div className="flex space-x-2">
                                            {orders.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url}
                                                    className={`px-3 py-1 text-sm rounded-lg transition-all ${
                                                        link.active
                                                            ? 'bg-blue-600 text-white'
                                                            : link.url
                                                            ? 'bg-white text-blue-600 hover:bg-blue-50'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Record Payment Modal ── */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Record Payment</h3>
                                <p className="text-xs font-bold text-rose-500 mt-0.5">
                                    Outstanding: {currency}{dueAmount.toFixed(2)}
                                </p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitPayment} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Payment Amount ({currency})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={dueAmount}
                                    value={data.amount}
                                    onChange={e => setData('amount', e.target.value)}
                                    className="w-full bg-slate-50 border-none ring-1 ring-gray-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-rose-500 font-bold transition-all text-sm text-rose-700"
                                    required
                                />
                                {errors.amount && <p className="text-red-500 text-xs mt-1 font-bold">{errors.amount}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={data.note}
                                    onChange={e => setData('note', e.target.value)}
                                    placeholder="e.g. Cash payment, Bank transfer..."
                                    className="w-full bg-slate-50 border-none ring-1 ring-gray-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-rose-500 font-bold transition-all text-sm"
                                />
                            </div>

                            {/* Quick amount presets */}
                            <div className="flex gap-2">
                                {[25, 50, 100].map(pct => {
                                    const amt = Math.min(dueAmount, (dueAmount * pct / 100)).toFixed(2);
                                    return (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => setData('amount', amt)}
                                            className="flex-1 py-2 text-xs font-black text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all border border-rose-200"
                                        >
                                            {pct}%
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => setData('amount', dueAmount.toFixed(2))}
                                    className="flex-1 py-2 text-xs font-black text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-all"
                                >
                                    FULL
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-gradient-to-br from-rose-600 to-rose-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 hover:shadow-rose-400/40 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {processing ? 'Recording...' : 'Confirm Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Order Details Modal ── */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    <div className="relative z-10 w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <Receipt className="w-6 h-6 text-blue-600" />
                                    Order #{selectedOrder.id} Details
                                </h3>
                                <p className="text-xs font-bold text-gray-500 mt-1">
                                    {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto pr-2 flex-1 space-y-4 min-h-0">
                            <div className="space-y-3">
                                {selectedOrder.items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white text-blue-600 font-black text-sm shadow-sm">
                                                {item.quantity}
                                            </span>
                                            <div>
                                                <p className="font-bold text-gray-900">{item.menu.name}</p>
                                                <p className="text-xs font-bold text-gray-500">
                                                    {currency}{Number(item.price).toFixed(2)} each
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-gray-900">
                                                {currency}{(Number(item.price) * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Subtotal</span>
                                    <span>{currency}{Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
                                </div>
                                {selectedOrder.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-rose-500">
                                        <span>Discount</span>
                                        <span>-{currency}{Number(selectedOrder.discount_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                {selectedOrder.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-gray-500">
                                        <span>Tax</span>
                                        <span>{currency}{Number(selectedOrder.tax_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                {selectedOrder.tip_amount > 0 && (
                                    <div className="flex justify-between text-sm font-bold text-emerald-500">
                                        <span>Tip</span>
                                        <span>{currency}{Number(selectedOrder.tip_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                                    <span className="text-base font-black text-gray-900 uppercase tracking-widest">Total</span>
                                    <span className="text-xl font-black text-blue-600">
                                        {currency}{Number(selectedOrder.grand_total || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Credit Transaction Modal ── */}
            {editingTx && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !editProcessing && setEditingTx(null)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <Edit2 className="w-5 h-5 text-blue-600" />
                                    Edit Credit Entry
                                </h3>
                                <p className="text-xs font-bold text-gray-500 mt-1">
                                    Transaction #{editingTx.id} • Customer: {customer.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !editProcessing && setEditingTx(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitEditTx} className="space-y-4">
                            {/* Transaction Type Selector */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Transaction Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditType('charge')}
                                        className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                            editType === 'charge'
                                                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                                                : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        Charge (+ Due)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditType('payment')}
                                        className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                            editType === 'payment'
                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                                : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        Payment (- Due)
                                    </button>
                                </div>
                                {editErrors.type && <p className="text-red-500 text-xs mt-1 font-bold">{editErrors.type}</p>}
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Amount ({currency})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                    className="w-full bg-slate-50 border-none ring-1 ring-gray-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 font-bold transition-all text-sm"
                                    required
                                />
                                {editErrors.amount && <p className="text-red-500 text-xs mt-1 font-bold">{editErrors.amount}</p>}
                            </div>

                            {/* Date / Time */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Transaction Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editDate}
                                    onChange={e => setEditDate(e.target.value)}
                                    className="w-full bg-slate-50 border-none ring-1 ring-gray-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 font-bold transition-all text-sm"
                                />
                                {editErrors.created_at && <p className="text-red-500 text-xs mt-1 font-bold">{editErrors.created_at}</p>}
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Note / Reference
                                </label>
                                <input
                                    type="text"
                                    value={editNote}
                                    onChange={e => setEditNote(e.target.value)}
                                    placeholder="e.g. Adjusted wrong amount..."
                                    className="w-full bg-slate-50 border-none ring-1 ring-gray-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 font-bold transition-all text-sm"
                                />
                                {editErrors.note && <p className="text-red-500 text-xs mt-1 font-bold">{editErrors.note}</p>}
                            </div>

                            {/* Projected Impact Card */}
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-gray-500">
                                    <span>Current Due:</span>
                                    <span>{currency}{dueAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-black text-gray-900 border-t border-slate-200 pt-1.5">
                                    <span>Projected New Due:</span>
                                    <span className={getProjectedDueOnEdit() > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                        {currency}{getProjectedDueOnEdit().toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={editProcessing}
                                    onClick={() => setEditingTx(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-gray-700 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editProcessing}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-blue-300 transition-all disabled:opacity-70 flex items-center justify-center gap-1.5"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {editProcessing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Credit Transaction Confirmation Modal ── */}
            {deletingTx && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !deleteProcessing && setDeletingTx(null)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <button
                                type="button"
                                onClick={() => !deleteProcessing && setDeletingTx(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <h3 className="text-xl font-black text-gray-900 tracking-tight">
                            Delete Credit Entry?
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            Are you sure you want to permanently remove this transaction from {customer.name}'s ledger?
                        </p>

                        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                <span>Type:</span>
                                <span className={`uppercase font-black ${deletingTx.type === 'charge' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {deletingTx.type}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-gray-600">
                                <span>Amount:</span>
                                <span className="font-black text-gray-900">{currency}{Number(deletingTx.amount).toFixed(2)}</span>
                            </div>
                            {deletingTx.note && (
                                <div className="flex justify-between text-xs font-bold text-gray-600">
                                    <span>Note:</span>
                                    <span className="text-gray-800 italic max-w-[200px] truncate">{deletingTx.note}</span>
                                </div>
                            )}
                            {deletingTx.order_id && (
                                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-bold mt-1">
                                    Originated from Order #{deletingTx.order_id}
                                </div>
                            )}

                            <div className="border-t border-slate-200 pt-2 text-xs font-bold">
                                <span className="text-gray-500">Balance Impact: </span>
                                {deletingTx.type === 'charge' ? (
                                    <span className="text-emerald-600 font-black">
                                        Due will decrease to {currency}{Math.max(0, dueAmount - Number(deletingTx.amount)).toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-rose-600 font-black">
                                        Due will increase to {currency}{(dueAmount + Number(deletingTx.amount)).toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                type="button"
                                disabled={deleteProcessing}
                                onClick={() => setDeletingTx(null)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-gray-700 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleteProcessing}
                                onClick={confirmDeleteTx}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-rose-300 transition-all disabled:opacity-70 flex items-center justify-center gap-1.5"
                            >
                                <Trash2 className="w-4 h-4" />
                                {deleteProcessing ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Manual Credit Entry Modal ── */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !addProcessing && setShowAddModal(false)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-slate-800" />
                                    Add Credit Entry
                                </h3>
                                <p className="text-xs font-bold text-gray-500 mt-1">
                                    Manual ledger entry for {customer.name}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !addProcessing && setShowAddModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitAddTx} className="space-y-4">
                            {/* Entry Type Selector */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Entry Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAddType('charge')}
                                        className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                            addType === 'charge'
                                                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                                                : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        Charge (+ Due)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAddType('payment')}
                                        className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                            addType === 'payment'
                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                                : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        Payment (- Due)
                                    </button>
                                </div>
                                {addErrors.type && <p className="text-red-500 text-xs mt-1 font-bold">{addErrors.type}</p>}
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Amount ({currency})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={addAmount}
                                    onChange={e => setAddAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border-none ring-1 ring-gray-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-slate-900 font-bold transition-all text-sm"
                                    required
                                />
                                {addErrors.amount && <p className="text-red-500 text-xs mt-1 font-bold">{addErrors.amount}</p>}
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={addDate}
                                    onChange={e => setAddDate(e.target.value)}
                                    className="w-full bg-slate-50 border-none ring-1 ring-gray-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-slate-900 font-bold transition-all text-sm"
                                />
                                {addErrors.date && <p className="text-red-500 text-xs mt-1 font-bold">{addErrors.date}</p>}
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                    Note / Description
                                </label>
                                <input
                                    type="text"
                                    value={addNote}
                                    onChange={e => setAddNote(e.target.value)}
                                    placeholder="e.g. Opening balance, Direct payment..."
                                    className="w-full bg-slate-50 border-none ring-1 ring-gray-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-slate-900 font-bold transition-all text-sm"
                                />
                                {addErrors.note && <p className="text-red-500 text-xs mt-1 font-bold">{addErrors.note}</p>}
                            </div>

                            {/* Projected Impact Card */}
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-gray-500">
                                    <span>Current Due:</span>
                                    <span>{currency}{dueAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-black text-gray-900 border-t border-slate-200 pt-1.5">
                                    <span>Projected New Due:</span>
                                    <span className={getProjectedDueOnAdd() > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                        {currency}{getProjectedDueOnAdd().toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    disabled={addProcessing}
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-gray-700 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addProcessing}
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all disabled:opacity-70 flex items-center justify-center gap-1.5"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {addProcessing ? 'Adding...' : 'Add Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

