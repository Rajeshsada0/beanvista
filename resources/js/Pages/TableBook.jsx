import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Plus, Users, Clock, Coffee, CheckCircle2, X, QrCode, Search, LayoutGrid, List, Download, Copy, Check, AlertTriangle, Lock, Unlock, Info } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import Modal from '@/Components/Modal';

/* ── QR Code Modal ── */
function QRModal({ table, url, onClose }) {
    const canvasRef  = useRef(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (canvasRef.current && url) {
            QRCode.toCanvas(canvasRef.current, url, {
                width: 280,
                margin: 2,
                color: { dark: '#1a1a2e', light: '#ffffff' },
            });
        }
    }, [url]);

    const downloadQR = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `qr-table-${table.table_number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const copyLink = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => prompt('Copy this QR link:', url));
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white border border-gray-100 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Guest QR Code</p>
                                <h3 className="text-lg font-black leading-tight">Table {table.table_number}</h3>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                            <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* QR Canvas */}
                <div className="flex flex-col items-center px-6 py-6 gap-4">
                    <div className="p-3 rounded-2xl border-2 border-gray-100 shadow-inner bg-white">
                        <canvas ref={canvasRef} className="rounded-xl block" />
                    </div>

                    {/* URL chip */}
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] font-bold text-gray-500 truncate flex-1">{url}</span>
                        <button
                            onClick={copyLink}
                            className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                            style={{ color: copied ? '#059669' : '#6366f1' }}
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={downloadQR}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow shadow-brand-500/25 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Download QR Code
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TableBook({ tables, menus, activeSession, cashSales, cashDeposits, cashWithdrawals }) {
    const { settings, tenant_slug, auth } = usePage().props;
    const tableLimit = auth?.plan_limits?.max_tables;
    const isLimitReached = tableLimit?.reached;
    const currency = settings?.currency_symbol || 'रू.';
    const siteName = settings?.site_name || 'CaféOS';

    const allCount       = tables.length;
    const availableCount = tables.filter(t => t.status === 'available').length;
    const occupiedCount  = tables.filter(t => t.status === 'occupied').length;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery]       = useState('');
    const [statusFilter, setStatusFilter]     = useState('all');
    const [viewMode, setViewMode]             = useState('grid');
    const [qrTable, setQrTable]               = useState(null);

    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Form for opening register
    const openForm = useForm({
        opening_balance: '',
        notes: '',
    });

    // Form for closing register
    const closeForm = useForm({
        closing_balance: '',
        notes: '',
    });

    const expectedBalance = useMemo(() => {
        if (!activeSession) return 0;
        return parseFloat(activeSession.opening_balance || 0) + parseFloat(cashSales || 0) + parseFloat(cashDeposits || 0) - parseFloat(cashWithdrawals || 0);
    }, [activeSession, cashSales, cashDeposits, cashWithdrawals]);

    const discrepancy = useMemo(() => {
        if (activeSession) {
            return parseFloat(closeForm.data.closing_balance || 0) - expectedBalance;
        }
        return 0;
    }, [closeForm.data.closing_balance, activeSession, expectedBalance]);

    const handleCloseModal = () => {
        setShowRegisterModal(false);
        if (!activeSession) {
            openForm.reset();
        } else {
            closeForm.reset();
        }
    };

    const handleOpenRegister = (e) => {
        e.preventDefault();
        openForm.post(route('finance.cash-counter.open'), {
            onSuccess: () => {
                setShowRegisterModal(false);
                openForm.reset();
            }
        });
    };

    const handleCloseRegister = (e) => {
        e.preventDefault();
        if (!activeSession) return;
        closeForm.post(route('finance.cash-counter.close', { session: activeSession.id }), {
            onSuccess: () => {
                setShowRegisterModal(false);
                closeForm.reset();
            }
        });
    };

    const getQrUrl = useCallback((table) => {
        const slug = tenant_slug || window.location.hostname.split('.')[0];
        return `${window.location.origin}/${slug}/qro/${table.table_number}`;
    }, [tenant_slug]);

    const { data, setData, post, processing, errors, reset } = useForm({
        table_number: '',
        capacity: 2,
        status: 'available'
    });

    const submitNewTable = (e) => {
        e.preventDefault();
        post(route('tables.store'), {
            onSuccess: () => { setIsAddModalOpen(false); reset(); }
        });
    };

    const filteredTables = useMemo(() => {
        return tables.filter(t => {
            const matchesSearch = t.table_number.toString().toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tables, searchQuery, statusFilter]);

    const statusTabs = [
        { key: 'all',       label: 'All Tables', count: allCount },
        { key: 'available', label: 'Available',  count: availableCount },
        { key: 'occupied',  label: 'Occupied',   count: occupiedCount },
    ];

    const cardColors = {
        available: {
            wrap:   'bg-white border-emerald-100 shadow-emerald-500/5',
            badge:  'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot:    'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]',
            label:  'text-emerald-600',
            num:    'bg-emerald-50 text-emerald-800 border-emerald-100',
        },
        occupied: {
            wrap:   'bg-white border-red-100 shadow-red-500/5',
            badge:  'bg-red-50 text-red-700 border-red-200',
            dot:    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]',
            label:  'text-red-600',
            num:    'bg-red-50 text-red-800 border-red-100',
        },
    };

    const c = (status) => cardColors[status] || cardColors.available;

    return (
        <AuthenticatedLayout>
            <Head title="Table Book" />

            <div className="flex flex-col space-y-4 w-full">

                {/* ── Header ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">Table Book</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center mt-0.5">
                            <Clock className="w-3 h-3 mr-1 text-brand-500" />
                            Live Status &amp; Management
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View toggle */}
                        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                            <button onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {auth.user.role !== 'waiter' && (
                            <button 
                                onClick={() => setShowRegisterModal(true)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    activeSession 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/70' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span className="flex h-2 w-2 relative">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSession ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${activeSession ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                </span>
                                <span>Register: {activeSession ? 'Open' : 'Closed'}</span>
                            </button>
                        )}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow shadow-brand-500/25 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            Add Table
                        </button>
                    </div>
                </div>

                {/* ── Search + Filter Bar ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search table by number or name..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 bg-gray-50 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {/* Status Filter Tabs */}
                    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
                        {statusTabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    statusFilter === tab.key
                                        ? tab.key === 'available' ? 'bg-emerald-600 text-white shadow'
                                        : tab.key === 'occupied' ? 'bg-red-600 text-white shadow'
                                        : 'bg-white text-brand-700 shadow'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.key !== 'all' && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        statusFilter === tab.key ? 'bg-white/80'
                                        : tab.key === 'available' ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}></span>
                                )}
                                {tab.label}
                                <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none ${
                                    statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>{tab.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Empty state ── */}
                {filteredTables.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">No tables found</p>
                        <p className="text-xs text-gray-400 mt-1">Try a different search or filter</p>
                    </div>
                )}

                {/* ── Grid View ── */}
                {viewMode === 'grid' && filteredTables.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredTables.map(table => (
                            <div key={table.id}
                                className={`relative rounded-2xl border shadow-sm p-4 flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${c(table.status).wrap}`}
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`px-3 py-1.5 rounded-xl border font-black text-base leading-tight max-w-[70%] truncate ${c(table.status).num}`}>
                                        {table.table_number}
                                    </div>
                                    <span className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${c(table.status).dot}`}></span>
                                </div>

                                {/* Info row */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${c(table.status).badge}`}>
                                        {table.status}
                                    </span>
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400">
                                        <Users className="w-3 h-3" />
                                        {table.capacity}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto flex flex-col gap-1.5">
                                    {table.status === 'available' && (
                                        <>
                                            <Link
                                                href={route('orders.create', { table_id: table.id })}
                                                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                                            >
                                                <Coffee className="w-3.5 h-3.5" />
                                                New Order
                                            </Link>
                                            {(settings?.enable_guest_qr === 'true' || settings?.enable_guest_qr === '1' || settings?.enable_guest_qr === 1 || settings?.enable_guest_qr === true) && (
                                                <button
                                                    onClick={() => setQrTable(table)}
                                                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition-all"
                                                >
                                                    <QrCode className="w-3 h-3" />
                                                    QR Code
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {table.status === 'occupied' && (
                                        <div className="flex flex-col gap-1">
                                            {table.orders[0]?.customer && (
                                                <p className="text-[10px] font-bold text-gray-500 truncate">{table.orders[0].customer.name}</p>
                                            )}
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-bold text-red-500 uppercase">Active Order</span>
                                                <span className="text-[11px] font-black text-red-700">{currency} {table.orders[0]?.total_amount || '0.00'}</span>
                                            </div>
                                            <Link
                                                href={`/orders/${table.orders[0]?.id}/edit`}
                                                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all"
                                            >
                                                <Coffee className="w-3.5 h-3.5" />
                                                Manage Order
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── List View ── */}
                {viewMode === 'list' && filteredTables.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Table</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Capacity</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Customer / Order</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTables.map(table => (
                                    <tr key={table.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`font-black text-sm px-2.5 py-1 rounded-lg border inline-block whitespace-nowrap ${c(table.status).num}`}>{table.table_number}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-1 rounded-lg border w-fit whitespace-nowrap ${c(table.status).badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${c(table.status).dot}`}></span>
                                                {table.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="flex items-center gap-1 text-xs font-bold text-gray-500 whitespace-nowrap">
                                                <Users className="w-3.5 h-3.5" />{table.capacity} seats
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-medium text-gray-600 whitespace-nowrap">
                                            {table.status === 'occupied'
                                                ? <span className="flex items-center gap-2 whitespace-nowrap">
                                                    {table.orders[0]?.customer
                                                        ? <span className="font-bold text-gray-800 whitespace-nowrap">{table.orders[0].customer.name}</span>
                                                        : <span className="text-gray-400">—</span>
                                                    }
                                                    <span className="text-red-600 font-black whitespace-nowrap">{currency} {table.orders[0]?.total_amount || '0.00'}</span>
                                                  </span>
                                                : <span className="text-gray-400">—</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            {table.status === 'available' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('orders.create', { table_id: table.id })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                                                    >
                                                        <Coffee className="w-3.5 h-3.5" />New Order
                                                    </Link>
                                                    {(settings?.enable_guest_qr === 'true' || settings?.enable_guest_qr === '1' || settings?.enable_guest_qr === 1 || settings?.enable_guest_qr === true) && (
                                                        <button
                                                            onClick={() => setQrTable(table)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                                                        >
                                                            <QrCode className="w-3.5 h-3.5" />QR Code
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {table.status === 'occupied' && (
                                                <Link
                                                    href={`/orders/${table.orders[0]?.id}/edit`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                                                >
                                                    <Coffee className="w-3.5 h-3.5" />Manage
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── QR Code Modal ── */}
            {qrTable && (
                <QRModal
                    table={qrTable}
                    url={getQrUrl(qrTable)}
                    onClose={() => setQrTable(null)}
                />
            )}

            {/* ── Add Table Modal ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white border border-gray-100 p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900">Add New Table</h3>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                <X className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </div>

                        <form onSubmit={submitNewTable} className="space-y-4">
                            {isLimitReached && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                        <span className="font-bold text-amber-900 block">Subscription Limit Reached</span>
                                        <span className="text-amber-700 block mt-0.5">
                                            You have reached your plan limit of {tableLimit?.limit} dining tables. Please upgrade your subscription plan to add more tables.
                                        </span>
                                        <Link
                                            href={route('tenant.plan')}
                                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-black mt-2 transition-colors"
                                        >
                                            Upgrade Plan →
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Table Name / Number</label>
                                <input
                                    type="text"
                                    className={`w-full rounded-xl border ${errors.table_number ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/20'} bg-gray-50 px-3 py-2.5 outline-none focus:ring-2 font-bold text-sm text-gray-800 transition-all`}
                                    placeholder="e.g. T-01, Window, Bar 3"
                                    value={data.table_number}
                                    onChange={e => setData('table_number', e.target.value)}
                                    autoFocus
                                    required
                                />
                                {errors.table_number && <p className="mt-1 text-xs font-bold text-red-500">{errors.table_number}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Seating Capacity</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-bold text-sm text-gray-800 transition-all"
                                        value={data.capacity}
                                        onChange={e => setData('capacity', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={processing || isLimitReached}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 shadow shadow-brand-500/20 transition-all disabled:opacity-70 text-sm mt-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {processing ? 'Creating...' : 'Create Table'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Cash Register Open/Close Modal ── */}
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
                                    <span>{currency}{parseFloat(activeSession.opening_balance || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-emerald-600">
                                    <span>+ Cash Sales</span>
                                    <span>+{currency}{parseFloat(cashSales || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-blue-600">
                                    <span>+ Cash Deposits</span>
                                    <span>+{currency}{parseFloat(cashDeposits || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-amber-600">
                                    <span>- Cash Withdrawals</span>
                                    <span>-{currency}{parseFloat(cashWithdrawals || 0).toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-gray-200 my-1"></div>
                                <div className="flex justify-between text-sm font-black text-gray-900">
                                    <span>Expected Drawer Balance</span>
                                    <span>{currency}{parseFloat(expectedBalance || 0).toFixed(2)}</span>
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
                                    {discrepancy < 0 && `Drawer is SHORT by ${currency}${Math.abs(discrepancy).toFixed(2)}.`}
                                    {discrepancy > 0 && `Drawer is OVER by ${currency}${discrepancy.toFixed(2)}.`}
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
        </AuthenticatedLayout>
    );
}
