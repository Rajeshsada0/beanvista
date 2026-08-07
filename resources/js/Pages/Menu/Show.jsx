import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Tag, DollarSign, TrendingUp, Percent, Package, Eye, EyeOff, Calendar, Edit2 } from 'lucide-react';

export default function MenuShow({ menu, category }) {
    const currency = 'रू.';
    
    // Calculate discount if original price exists
    const discount = menu.original_price && parseFloat(menu.original_price) > parseFloat(menu.price)
        ? {
            amount: (parseFloat(menu.original_price) - parseFloat(menu.price)).toFixed(2),
            percent: ((parseFloat(menu.original_price) - parseFloat(menu.price)) / parseFloat(menu.original_price) * 100).toFixed(1)
        }
        : null;
    
    // Calculate profit if cost price exists
    const profit = menu.cost_price && parseFloat(menu.price) > parseFloat(menu.cost_price)
        ? (parseFloat(menu.price) - parseFloat(menu.cost_price)).toFixed(2)
        : null;

    return (
        <AuthenticatedLayout>
            <Head title={`Menu Details - ${menu.name}`} />
            
            <div className="max-w-6xl mx-auto space-y-6 pb-10">
                {/* Header with Back Button */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link 
                            href={route('menus.index')}
                            className="p-2 hover:bg-brand-50 text-gray-600 hover:text-brand-600 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{menu.name}</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Complete information about this menu item</p>
                        </div>
                        <Link
                            href={route('menus.index')}
                            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Item
                        </Link>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Image and Status */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Main Image Card */}
                        <div className="bg-gradient-to-br from-brand-50 to-white rounded-xl shadow-sm border border-brand-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-900">Product Image</h3>
                                {menu.status ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                        <Eye className="w-3 h-3" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                        <EyeOff className="w-3 h-3" />
                                        Hidden
                                    </span>
                                )}
                            </div>
                            {menu.image_url ? (
                                <div className="relative group">
                                    <img 
                                        src={menu.image_url} 
                                        alt={menu.name}
                                        className="w-full aspect-square object-cover rounded-xl border-2 border-brand-200 shadow-md"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ) : (
                                <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                                    <Package className="w-20 h-20 text-gray-300" />
                                </div>
                            )}
                        </div>

                        {/* Icon Card */}
                        {menu.icon_url && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Item Icon</h3>
                                <div className="flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-white rounded-xl border border-brand-100">
                                    <img 
                                        src={menu.icon_url} 
                                        alt={`${menu.name} icon`}
                                        className="w-20 h-20 object-contain drop-shadow-lg"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Category Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm border border-blue-200 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Tag className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Category</div>
                                    <div className="text-lg font-bold text-blue-900">
                                        {category?.name || menu.category || 'Uncategorized'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Metadata Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {menu.created_at && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Calendar className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Added On</div>
                                            <div className="text-sm font-bold text-gray-900 mt-0.5">
                                                {new Date(menu.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {menu.updated_at && menu.updated_at !== menu.created_at && (
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Calendar className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Updated</div>
                                            <div className="text-sm font-bold text-gray-900 mt-0.5">
                                                {new Date(menu.updated_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pricing Information */}
                        <div className="bg-gradient-to-br from-brand-50 to-white rounded-xl shadow-sm border border-brand-200 p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-brand-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-brand-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Pricing Details</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Cost Price */}
                                {menu.cost_price && (
                                    <div className="relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl" />
                                        <div className="relative p-5 border-2 border-orange-200 rounded-xl">
                                            <div className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">Cost Price</div>
                                            <div className="text-2xl font-bold text-orange-900 mb-1">
                                                {currency} {parseFloat(menu.cost_price).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-orange-600 font-semibold">Purchase cost</div>
                                        </div>
                                    </div>
                                )}

                                {/* Original Price */}
                                {menu.original_price && (
                                    <div className="relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl" />
                                        <div className="relative p-5 border-2 border-gray-300 rounded-xl">
                                            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Original (MRP)</div>
                                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                                {currency} {parseFloat(menu.original_price).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-600 font-semibold">List price</div>
                                        </div>
                                    </div>
                                )}

                                {/* Sales Price */}
                                <div className="relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl" />
                                    <div className="relative p-5 border-2 border-brand-300 rounded-xl">
                                        <div className="text-xs font-bold text-brand-700 uppercase tracking-wide mb-2">Sales Price</div>
                                        <div className="text-3xl font-bold text-brand-900 mb-1">
                                            {currency} {parseFloat(menu.price).toFixed(2)}
                                        </div>
                                        <div className="text-xs text-brand-600 font-semibold">Selling price</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calculations */}
                        {(discount || profit) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Discount Info */}
                                {discount && (
                                    <div className="relative overflow-hidden rounded-xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-50" />
                                        <div className="relative p-6 border-2 border-emerald-300 rounded-xl">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    <Percent className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">Discount</h3>
                                            </div>
                                            <div className="text-4xl font-bold text-emerald-700 mb-2">
                                                {discount.percent}%
                                            </div>
                                            <div className="text-sm font-semibold text-emerald-600">
                                                Save {currency} {discount.amount}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Profit Info */}
                                {profit && (
                                    <div className="relative overflow-hidden rounded-xl">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50" />
                                        <div className="relative p-6 border-2 border-blue-300 rounded-xl">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Net Profit</h3>
                                            </div>
                                            <div className="text-4xl font-bold text-blue-700 mb-2">
                                                {currency} {profit}
                                            </div>
                                            <div className="text-sm font-semibold text-blue-600">
                                                Per item sold
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('menus.index')}
                                className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-lg font-semibold text-sm text-center transition-colors"
                            >
                                Back to Menu List
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
