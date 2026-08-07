import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Printer, ArrowLeft, Coffee, CheckCircle2, Calendar, Hash, Table as TableIcon, CreditCard, Banknote, Wallet, QrCode } from 'lucide-react';

export default function Receipt({ order, taxes }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || 'रू.';
    const cafeName = settings?.site_name || 'Hitech Valley Cafe';
    const cafeAddress = settings?.address || 'Kathmandu, Nepal';
    const cafePhone = settings?.phone || '+977-1-4XXXXXX';

    const handlePrint = () => {
        window.print();
    };

    const getPaymentIcon = (method) => {
        switch (method) {
            case 'cash': return <Banknote className="w-4 h-4" />;
            case 'online': return <QrCode className="w-4 h-4" />;
            case 'split': return <Wallet className="w-4 h-4" />;
            default: return <CreditCard className="w-4 h-4" />;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Receipt - Order #${order.order_number || order.id.toString().slice(-8)}`} />

            <div className="max-w-xl mx-auto pt-6 sm:py-8 px-2 sm:px-6 lg:px-8 pb-32">
                {/* Actions - Hidden on Print */}
                <div className="flex justify-between items-center mb-6 print:hidden gap-2">
                    <Link
                        href={route('orders.index')}
                        className="flex items-center text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-gray-100 shadow-sm"
                    >
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                        <span className="hidden sm:inline">Back to Orders</span>
                        <span className="sm:hidden">Back</span>
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="flex items-center px-2 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                        <span className="hidden sm:inline">Print Receipt</span>
                        <span className="sm:hidden">Print</span>
                    </button>
                </div>

                {/* Receipt Card */}
                <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                    
                    {/* Receipt Header */}
                    <div className="bg-gray-50/50 p-6 sm:p-10 text-center border-b border-dashed border-gray-200 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                        
                        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 mb-4">
                            <Coffee className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{cafeName}</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{settings?.address || 'Kathmandu, Nepal'}</p>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">{settings?.contact_phone || '+977-1-4XXXXXX'}</p>
                        
                        {settings?.receipt_header && (
                            <p className="mt-4 text-xs font-bold text-gray-600 whitespace-pre-line italic">
                                {settings.receipt_header}
                            </p>
                        )}

                        <div className="mt-8 grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-gray-500">
                                <div className="flex items-center justify-center bg-white px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-gray-100">
                                    <Hash className="w-3 h-3 mr-1 text-blue-500 shrink-0" />
                                    ORDER #{order.order_number || order.id.toString().slice(-8)}
                                </div>
                                <div className="flex items-center justify-center bg-white px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-gray-100">
                                    <TableIcon className="w-3 h-3 mr-1 text-blue-500 shrink-0" />
                                    {order.table?.table_number ? `TABLE ${order.table.table_number}` : (order.order_type?.toUpperCase() || 'TAKEAWAY')}
                                </div>
                                <div className="col-span-2 flex items-center justify-center bg-white px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-gray-100 sm:w-auto">
                                    <Calendar className="w-3 h-3 mr-1 text-blue-500 shrink-0" />
                                    {new Date(order.updated_at).toLocaleDateString()} {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                        {/* Customer Info based on setting */}
                        {(settings?.show_customer_info == true || settings?.show_customer_info === 'true' || settings?.show_customer_info === '1') && order.customer && (
                            <div className="mt-4 flex flex-col items-center pt-4 border-t border-gray-100">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Customer</p>
                                <p className="text-sm font-black text-gray-700">{order.customer.name}</p>
                                {order.customer.phone && <p className="text-[10px] font-bold text-gray-400 mt-0.5">{order.customer.phone}</p>}
                            </div>
                        )}
                    </div>

                    {/* Receipt Body */}
                    <div className="p-5 sm:p-10">
                        <table className="w-full mb-8">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="text-left pb-4">Item Description</th>
                                    <th className="text-center pb-4 px-4">Qty</th>
                                    <th className="text-right pb-4">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {order.items.map((item) => (
                                    <tr key={item.id} className="text-sm">
                                        <td className="py-4">
                                            <p className="font-bold text-gray-900">{item.menu.name}</p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase">{currency}</span>
                                                <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase">{item.price}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-black text-[10px]">
                                                {item.quantity}
                                            </span>
                                        </td>
                                        <td className="py-3 sm:py-4 text-right font-black text-gray-900 whitespace-nowrap text-xs sm:text-sm">
                                            <div className="flex items-center justify-end gap-1">
                                                <span>{currency}</span>
                                                <span>{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals Section */}
                        <div className="space-y-3 pt-6 border-t border-gray-100">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Subtotal</span>
                                <div className="flex items-center justify-end gap-1">
                                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{currency}</span>
                                    <span className="font-bold text-gray-900 text-xs sm:text-sm">{parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                            
                            {parseFloat(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span className="font-bold uppercase text-[10px] tracking-widest">Discount ({order.discount_percentage}%)</span>
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="font-black text-xs sm:text-sm text-emerald-600">-</span>
                                        <span className="font-black text-xs sm:text-sm text-emerald-600">{currency}</span>
                                        <span className="font-black text-xs sm:text-sm text-emerald-600">{parseFloat(order.discount_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {parseFloat(order.tip_amount) > 0 && (
                                <div className="flex justify-between text-sm text-blue-600">
                                    <span className="font-bold uppercase text-[10px] tracking-widest">Service Tip</span>
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="font-black text-xs sm:text-sm text-blue-600">+</span>
                                        <span className="font-black text-xs sm:text-sm text-blue-600">{currency}</span>
                                        <span className="font-black text-xs sm:text-sm text-blue-600">{parseFloat(order.tip_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {parseFloat(order.tax_amount) > 0 && (
                                <>
                                    {(settings?.show_tax_breakdown === 'true' || settings?.show_tax_breakdown === true) ? (
                                        <div className="space-y-1">
                                            {taxes?.map((tax, idx) => {
                                                const taxableAmount = parseFloat(order.total_amount) - parseFloat(order.discount_amount) - (order.points_redeemed || 0);
                                                const taxVal = (taxableAmount * parseFloat(tax.rate)) / 100;
                                                if (taxVal <= 0) return null;
                                                return (
                                                    <div key={idx} className="flex justify-between text-sm text-amber-600">
                                                        <span className="font-bold uppercase text-[10px] tracking-widest">{tax.name} ({tax.rate}%)</span>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <span className="font-black text-xs sm:text-sm text-amber-600">+</span>
                                                            <span className="font-black text-xs sm:text-sm text-amber-600">{currency}</span>
                                                            <span className="font-black text-xs sm:text-sm text-amber-600">{taxVal.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between text-sm text-amber-600">
                                            <span className="font-bold uppercase text-[10px] tracking-widest">Tax Total</span>
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="font-black text-xs sm:text-sm text-amber-600">+</span>
                                                <span className="font-black text-xs sm:text-sm text-amber-600">{currency}</span>
                                                <span className="font-black text-xs sm:text-sm text-amber-600">{parseFloat(order.tax_amount).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="pt-4 mt-4 border-t-2 border-gray-900 border-double flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Payable</p>
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">{currency}</span>
                                        <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">{parseFloat(order.grand_total).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
                                    <div className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ring-emerald-100">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        PAID
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Info */}
                        <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {getPaymentIcon(order.payment_method)}
                                    <span>Method: {order.payment_method}</span>
                                </div>
                            </div>
                            
                            {order.payment_method === 'split' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cash</p>
                                        <div className="flex items-center justify-end gap-1">
                                            <span className="text-xs sm:text-sm font-black text-gray-900">{currency}</span>
                                            <span className="text-xs sm:text-sm font-black text-gray-900">{parseFloat(order.cash_amount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Online</p>
                                        <div className="flex items-center justify-end gap-1">
                                            <span className="text-xs sm:text-sm font-black text-gray-900">{currency}</span>
                                            <span className="text-xs sm:text-sm font-black text-gray-900">{parseFloat(order.online_amount).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs font-bold text-gray-600">
                                    Full payment processed via {order.payment_method === 'cash' ? 'Cash' : 'Online / Card'}.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Receipt Footer */}
                    <div className="p-6 sm:p-8 bg-gray-50 text-center border-t border-gray-100">
                        <p className="text-sm font-bold text-gray-900">{settings?.receipt_footer || `Thank you for visiting ${cafeName}!`}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Please come again</p>

                        
                        <div className="mt-6 flex justify-center opacity-20">
                            <div className="h-10 w-48 bg-gradient-to-r from-transparent via-gray-900 to-transparent" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 5%, 0 5%, 0 10%, 100% 10%, 100% 15%, 0 15%, 0 20%, 100% 20%, 100% 25%, 0 25%, 0 30%, 100% 30%, 100% 35%, 0 35%, 0 40%, 100% 40%, 100% 45%, 0 45%, 0 50%, 100% 50%, 100% 55%, 0 55%, 0 60%, 100% 60%, 100% 65%, 0 65%, 0 70%, 100% 70%, 100% 75%, 0 75%, 0 80%, 100% 80%, 100% 85%, 0 85%, 0 90%, 100% 90%, 100% 95%, 0 95%, 0 100%, 100% 100%)' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print specific styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { 
                        size: auto; 
                        margin: 0mm; 
                    }
                    body { 
                        background: white !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    nav, aside, .fixed.bottom-6, .lg\\:hidden.fixed.top-0 { 
                        display: none !important; 
                    }
                    .print\\:hidden { 
                        display: none !important; 
                    }
                    .max-w-xl { 
                        max-width: 100% !important; 
                        margin: 0 !important; 
                        padding: 20px !important;
                        border: none !important; 
                        box-shadow: none !important;
                    }
                    .bg-gray-50\\/50 { background: white !important; }
                    .rounded-\\[2\\.5rem\\], .rounded-2xl { border-radius: 0 !important; }
                    .shadow-\\[0_20px_50px_rgba\\(0\\,0\\,0\\,0\\.04\\)\\] { box-shadow: none !important; }
                    
                    /* Force one page and remove browser decoration */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                    }
                }
            ` }} />
        </AuthenticatedLayout>
    );
}
