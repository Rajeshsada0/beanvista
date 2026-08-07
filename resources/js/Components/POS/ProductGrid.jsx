import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductGrid({ items, onAddToCart, currency = 'JOD' }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <AnimatePresence>
                {items.map((item) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={item.id}
                        onClick={() => !item.outOfStock && onAddToCart(item)}
                        className={`bg-white rounded-xl overflow-hidden border border-dashed flex flex-col transition-colors ${item.outOfStock ? 'opacity-50 cursor-not-allowed border-gray-200' : 'cursor-pointer border-gray-300 hover:border-brand-400'}`}
                    >
                        <div className="relative aspect-[4/3] w-full bg-gray-50 flex items-center justify-center overflow-hidden p-2">
                            {item.image_url ? (
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className={`w-full h-full object-cover rounded-lg ${item.outOfStock ? 'grayscale' : ''}`}
                                />
                            ) : (
                                <div className="text-4xl">🍽️</div>
                            )}
                            {item.outOfStock && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">Out of Stock</span>
                                </div>
                            )}
                        </div>
                        <div className="p-2 flex-1 flex flex-col justify-between">
                            <h3 className="font-semibold text-gray-700 text-sm leading-tight line-clamp-2">{item.name}</h3>
                            <div className="mt-1 text-sm text-gray-500">
                                {currency} {parseFloat(item.price).toFixed(3)}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            {items.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">
                    <p className="text-sm font-medium">No items found in this category.</p>
                </div>
            )}
        </div>
    );
}
