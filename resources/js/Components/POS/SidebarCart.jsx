import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, CreditCard, Clock, Ban } from 'lucide-react';

export default function SidebarCart({ 
    cart, 
    onUpdateQuantity, 
    onRemoveItem, 
    onCheckout,
    onCancel,
    onHold,
    taxes,
    orderType,
    setOrderType,
    selectedTable,
    tables
}) {
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const taxRate = taxes.reduce((sum, tax) => sum + parseFloat(tax.rate), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-100 shadow-xl w-full max-w-md w-96">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">
                        {cart.length} Items
                    </span>
                </div>

                {/* Order Type Selector */}
                <div className="flex p-1 bg-gray-200 rounded-xl">
                    {['dine-in', 'takeaway', 'delivery'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setOrderType(type)}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
                                orderType === type 
                                ? 'bg-white text-gray-800 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {type.replace('-', ' ')}
                        </button>
                    ))}
                </div>

                {/* Selected Table info if Dine in */}
                {orderType === 'dine-in' && (
                    <div className="mt-3 text-sm font-medium text-gray-600 bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between">
                        <span>Table:</span>
                        <span className="text-blue-600 font-bold">{selectedTable ? `Table ${selectedTable.table_number}` : 'No table selected'}</span>
                    </div>
                )}
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                    {cart.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            key={item.cartId}
                            className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col gap-2 shadow-sm"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 leading-tight">{item.name}</h4>
                                    <p className="text-sm font-semibold text-gray-500 mt-1">${parseFloat(item.price).toFixed(2)}</p>
                                </div>
                                <button onClick={() => onRemoveItem(item.cartId)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-full transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-2">
                                <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
                                    <button 
                                        onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-blue-600"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                                    <button 
                                        onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-blue-600"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <span className="font-bold text-gray-800">
                                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {cart.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="text-6xl mb-4">🛒</div>
                        <p className="font-medium">Cart is empty</p>
                    </div>
                )}
            </div>

            {/* Totals & Actions */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <div className="space-y-2 mb-4 text-sm font-medium text-gray-500">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="text-gray-800">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax ({taxRate}%)</span>
                        <span className="text-gray-800">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-gray-100 mt-2">
                        <span>Total</span>
                        <span className="text-blue-600">${total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                    <button 
                        onClick={onCancel}
                        disabled={cart.length === 0}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                        <Ban size={18} /> Cancel
                    </button>
                    <button 
                        onClick={onHold}
                        disabled={cart.length === 0}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 disabled:opacity-50 transition-colors"
                    >
                        <Clock size={18} /> Hold
                    </button>
                </div>
                
                <button 
                    onClick={() => onCheckout({ subtotal, taxAmount, total })}
                    disabled={cart.length === 0 || (orderType === 'dine-in' && !selectedTable)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                    <CreditCard size={24} /> 
                    Pay Now
                </button>
            </div>
        </div>
    );
}
