import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    ConciergeBell, CheckCircle2, Clock, Loader2,
    Package, Coffee, AlertTriangle, RefreshCw,
    Table as TableIcon, ChevronDown, ChevronUp, Flame
} from 'lucide-react';

const STATUS = {
    remaining: { label: 'Remaining', color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200', dot: 'bg-amber-400' },
    ready:     { label: 'Ready',     color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200', dot: 'bg-emerald-400' },
    delivered: { label: 'Delivered', color: 'text-gray-400',   bg: 'bg-gray-50',    ring: 'ring-gray-200',    dot: 'bg-gray-300' },
};

function ItemRow({ item, type, onDeliver }) {
    const s = STATUS[type];
    // A "new" item is pending but has never been picked up by kitchen (started_at is null)
    const isNewlyAdded = type === 'remaining' && !item.started_at;
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 px-3 py-2.5 rounded-xl ${s.bg} ring-1 ${s.ring} transition-all`}>
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <span className={`shrink-0 w-2 h-2 mt-1.5 sm:mt-0 rounded-full ${s.dot}`} />
                <span className="text-sm font-bold text-gray-800 break-words">
                    <span className="text-blue-600 font-black mr-1">{item.quantity}×</span>
                    {item.menu?.name || 'Unknown'}
                </span>
                {item.addons && item.addons.length > 0 && (
                    <span className="hidden sm:inline text-[10px] font-black text-blue-400 uppercase tracking-tight truncate">
                        +{item.addons.map(a => a.pivot?.addon_name || a.name).join(', ')}
                    </span>
                )}
                {isNewlyAdded && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full bg-orange-100 text-orange-600 border border-orange-200 animate-pulse shrink-0">
                        <Flame className="w-2 h-2" /> New
                    </span>
                )}
            </div>
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 shrink-0 pl-4 sm:pl-0">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${s.bg} ${s.color} ring-1 ${s.ring}`}>
                    {s.label}
                </span>
                {type === 'ready' && (
                    <button
                        onClick={() => onDeliver(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow shadow-emerald-500/25 transition-all active:scale-95"
                    >
                        <CheckCircle2 className="w-3 h-3" />
                        Deliver
                    </button>
                )}
            </div>
        </div>
    );
}

function TableCard({ tableData, onDeliver, onDeliverAll }) {
    const { table, orders, remaining, ready, delivered } = tableData;
    const [showDelivered, setShowDelivered] = useState(false);

    const readyCount     = ready.length;
    const remainingCount = remaining.length;
    const deliveredCount = delivered.length;
    const totalCount     = readyCount + remainingCount + deliveredCount;
    const allDone        = readyCount === 0 && remainingCount === 0;
    // Table has newly-added items if some items are already delivered but new pending ones exist
    const hasNewItems    = deliveredCount > 0 && remainingCount > 0;

    const progress = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;

    return (
        <div className={`flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl border shadow-sm transition-all duration-300 overflow-hidden
            ${readyCount > 0 ? 'border-emerald-200 shadow-emerald-100 ring-2 ring-emerald-300/50' : 'border-white/80'}
        `}>
            {/* Table Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/60 bg-white/40 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 sm:h-11 sm:w-11 flex shrink-0 items-center justify-center rounded-xl sm:rounded-2xl font-black text-sm shadow-sm
                        ${readyCount > 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                        {table ? table.table_number : (orders[0]?.order_type ? orders[0].order_type.substring(0,4).toUpperCase() : 'N/A')}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            {table ? table.table_number : (orders[0]?.order_type || 'Takeaway')}
                            {!table && orders[0]?.car_plate && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] uppercase tracking-wider border border-gray-200">
                                    {orders[0].car_plate} {orders[0].car_description ? `(${orders[0].car_description})` : ''}
                                </span>
                            )}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {orders.length} order{orders.length !== 1 ? 's' : ''} · {totalCount} items
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {hasNewItems && (
                        <span className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-orange-100 text-orange-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl ring-1 ring-orange-200 animate-pulse">
                            <Flame className="w-3 h-3" />
                            New Items!
                        </span>
                    )}
                    {readyCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl ring-1 ring-emerald-200 animate-pulse">
                            <CheckCircle2 className="w-3 h-3" />
                            {readyCount} Ready
                        </span>
                    )}
                    {remainingCount > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-amber-50 text-amber-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl ring-1 ring-amber-200">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {remainingCount} Cooking
                        </span>
                    )}
                    {allDone && (
                        <span className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-gray-100 text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl">
                            <CheckCircle2 className="w-3 h-3" />
                            All Delivered
                        </span>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-5 pt-3 pb-1">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivery Progress</span>
                    <span className="text-[9px] font-black text-gray-600">{deliveredCount}/{totalCount}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-4 px-5 pt-4 pb-5">
                {/* Ready — highlighted, action buttons */}
                {ready.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Deliver
                            </p>
                            <button
                                onClick={() => onDeliverAll(ready.map(item => item.id))}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow shadow-emerald-500/25 transition-all active:scale-95"
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                Deliver All
                            </button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {ready.map(item => (
                                <ItemRow key={item.id} item={item} type="ready" onDeliver={onDeliver} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Remaining — cooking/pending */}
                {remaining.length > 0 && (
                    <div>
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Still Preparing
                        </p>
                        <div className="flex flex-col gap-1.5">
                            {remaining.map(item => (
                                <ItemRow key={item.id} item={item} type="remaining" onDeliver={onDeliver} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Delivered — collapsible */}
                {delivered.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowDelivered(v => !v)}
                            className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 hover:text-gray-600 transition-colors"
                        >
                            {showDelivered ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {delivered.length} Delivered
                        </button>
                        {showDelivered && (
                            <div className="flex flex-col gap-1.5">
                                {delivered.map(item => (
                                    <ItemRow key={item.id} item={item} type="delivered" onDeliver={onDeliver} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ServiceView({ tables }) {

    // Sync handled globally by AuthenticatedLayout
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const handleDeliver = (itemId) => {
        router.post(route('order-items.update-status', itemId), { status: 'delivered' }, {
            preserveScroll: true,
            onSuccess: () => setLastUpdated(new Date()),
        });
    };

    const handleDeliverAll = (itemIds) => {
        if (!itemIds || itemIds.length === 0) return;
        router.post(route('order-items.bulk-status'), {
            item_ids: itemIds,
            status: 'delivered'
        }, {
            preserveScroll: true,
            onSuccess: () => setLastUpdated(new Date()),
        });
    };

    const totalReady     = tables.reduce((s, t) => s + t.ready.length, 0);
    const totalRemaining = tables.reduce((s, t) => s + t.remaining.length, 0);
    const totalDelivered = tables.reduce((s, t) => s + t.delivered.length, 0);

    return (
        <AuthenticatedLayout>
            <Head title="Service View" />

            <div className="flex flex-col space-y-6 pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-xl p-5 sm:p-6 rounded-[2.5rem] border border-white/80 shadow-sm">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Service View</h1>
                        <div className="mt-0.5 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <ConciergeBell className="w-3.5 h-3.5 text-blue-400" />
                             waiter delivery tracking · <span className="text-emerald-500 font-black">Live Sync Active</span>
                            <span className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[8px] border border-emerald-100">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                LIVE
                            </span>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <div className="col-span-1 flex justify-center items-center gap-1.5 px-2 py-2 sm:px-3 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                            <span className="text-[10px] sm:text-sm font-black text-emerald-700">{totalReady} Ready</span>
                        </div>
                        <div className="col-span-1 flex justify-center items-center gap-1.5 px-2 py-2 sm:px-3 bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-200">
                            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 animate-spin" />
                            <span className="text-[10px] sm:text-sm font-black text-amber-700">{totalRemaining} Cooking</span>
                        </div>
                        <div className="col-span-1 flex justify-center items-center gap-1.5 px-2 py-2 sm:px-3 bg-gray-100 rounded-xl sm:rounded-2xl border border-gray-200">
                            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                            <span className="text-[10px] sm:text-sm font-black text-gray-600">{totalDelivered} Delivered</span>
                        </div>
                        <button
                            onClick={() => { router.reload({ preserveScroll: true }); setLastUpdated(new Date()); }}
                            className="col-span-1 flex justify-center items-center gap-1.5 px-2 py-2 sm:px-3 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                            <span className="text-[10px] sm:text-sm font-black text-blue-700">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Table Cards Grid */}
                {tables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/40 rounded-[3rem] border border-dashed border-white/80 backdrop-blur-xl text-center space-y-4">
                        <ConciergeBell className="w-16 h-16 text-gray-200" />
                        <div>
                            <h3 className="text-xl font-bold text-gray-400">No Active Orders</h3>
                            <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-widest">All tables are clear!</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                        {/* Sort: ready-first, then remaining, then all-done */}
                        {[...tables]
                            .sort((a, b) => {
                                if (b.ready.length !== a.ready.length) return b.ready.length - a.ready.length;
                                return b.remaining.length - a.remaining.length;
                            })
                            .map((tableData, idx) => (
                                <TableCard key={idx} tableData={tableData} onDeliver={handleDeliver} onDeliverAll={handleDeliverAll} />
                            ))
                        }
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
