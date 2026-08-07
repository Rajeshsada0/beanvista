import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { 
    Plus, 
    Gift, 
    Edit2, 
    Trash2, 
    CheckCircle2, 
    XCircle, 
    Coins, 
    Camera,
    Utensils,
    Search,
    X,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Filter
} from 'lucide-react';
import { useState, useMemo } from 'react';
import MediaGallery from '@/Components/Media/MediaGallery';

export default function Rewards({ rewards, menus }) {
    const { settings } = usePage().props;
    const currency = settings?.currency_symbol || 'रू.';
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pointsFilter, setPointsFilter] = useState('all');
    const [sortColumn, setSortColumn] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [gallery, setGallery] = useState({ isOpen: false });
    const [previewImageUrl, setPreviewImageUrl] = useState(null);

    const { data, setData, reset, errors } = useForm({
        name: '',
        description: '',
        points_required: 500,
        menu_item_id: '',
        status: true,
        image: null,
        type: 'gift',
        discount_type: 'percentage',
        discount_value: '',
        code: ''
    });

    const openModal = (reward = null) => {
        if (reward) {
            setEditingReward(reward);
            setData({
                name: reward.name,
                description: reward.description || '',
                points_required: reward.points_required,
                menu_item_id: reward.menu_item_id || '',
                status: reward.status,
                image: reward.image_path || null,
                type: reward.type || 'gift',
                discount_type: reward.discount_type || 'percentage',
                discount_value: reward.discount_value !== null && reward.discount_value !== undefined ? reward.discount_value.toString() : '',
                code: reward.code || ''
            });
            setPreviewImageUrl(reward.image_path ? `/storage/${reward.image_path}` : null);
        } else {
            setEditingReward(null);
            reset();
            setPreviewImageUrl(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingReward(null);
        reset();
        setPreviewImageUrl(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description || '');
        formData.append('points_required', data.points_required);
        formData.append('menu_item_id', data.menu_item_id || '');
        formData.append('status', data.status ? '1' : '0');
        formData.append('type', data.type || 'gift');
        formData.append('discount_type', data.discount_type || '');
        formData.append('discount_value', data.discount_value || '');
        formData.append('code', data.code || '');
        
        if (data.image) {
            formData.append('image', data.image);
        }

        const options = {
            onSuccess: () => {
                closeModal();
                reset();
            },
            onFinish: () => setLoading(false),
            forceFormData: true,
        };

        if (editingReward) {
            formData.append('_method', 'PUT');
            router.post(route('loyalty-rewards.update', editingReward.id), formData, options);
        } else {
            router.post(route('loyalty-rewards.store'), formData, options);
        }
    };

    const handleDelete = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Attemping to delete reward ID:', id);
        
        if (confirm('Are you sure you want to delete this reward?')) {
            router.delete(route('loyalty-rewards.destroy', id), {
                preserveScroll: true,
                onSuccess: () => {
                   console.log('Successfully deleted reward:', id);
                },
                onError: (errors) => {
                    console.error('Failed to delete reward:', errors);
                    alert('Error deleting reward. Check console.');
                },
                onFinish: () => {
                    setLoading(false);
                }
            });
        }
    };

    const toggleStatus = (reward) => {
        router.put(route('loyalty-rewards.update', reward.id), {
            ...reward,
            status: !reward.status,
        }, {
            preserveScroll: true,
        });
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Filter and sort rewards
    const filteredAndSortedRewards = useMemo(() => {
        let filtered = rewards.filter(r => {
            // Search filter
            const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.menuItem?.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Status filter
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'active' && r.status) ||
                (statusFilter === 'inactive' && !r.status);
            
            // Points filter
            let matchesPoints = true;
            if (pointsFilter === '0-500') {
                matchesPoints = r.points_required >= 0 && r.points_required <= 500;
            } else if (pointsFilter === '501-1000') {
                matchesPoints = r.points_required > 500 && r.points_required <= 1000;
            } else if (pointsFilter === '1000+') {
                matchesPoints = r.points_required > 1000;
            }
            
            return matchesSearch && matchesStatus && matchesPoints;
        });

        // Sort
        filtered.sort((a, b) => {
            let aVal, bVal;
            
            if (sortColumn === 'name') {
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
            } else if (sortColumn === 'points') {
                aVal = a.points_required;
                bVal = b.points_required;
            } else if (sortColumn === 'status') {
                aVal = a.status ? 1 : 0;
                bVal = b.status ? 1 : 0;
            }
            
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [rewards, searchQuery, statusFilter, pointsFilter, sortColumn, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedRewards.length / itemsPerPage);
    const paginatedRewards = filteredAndSortedRewards.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, pointsFilter]);

    return (
        <AuthenticatedLayout>
            <Head title="Loyalty Rewards Store" />

            <div className="flex flex-col space-y-6 pb-10">
                {/* Header */}
                <div className="bg-white rounded-xl border border-gray-200 px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
                                <Gift className="w-6 h-6 mr-3 text-blue-600" />
                                Loyalty Rewards Store
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage customer perks & point costs
                            </p>
                        </div>

                        <button 
                            onClick={() => openModal()}
                            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Reward</span>
                        </button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search rewards..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        {/* Points Filter */}
                        <select
                            value={pointsFilter}
                            onChange={(e) => setPointsFilter(e.target.value)}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value="all">All Points</option>
                            <option value="0-500">0-500 pts</option>
                            <option value="501-1000">501-1000 pts</option>
                            <option value="1000+">1000+ pts</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                                        Image
                                    </th>
                                    <th 
                                        className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Reward Name</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th 
                                        className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('points')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Points</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Reward Details
                                    </th>
                                    <th 
                                        className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Status</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedRewards.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <Gift className="w-12 h-12 text-gray-300 mb-3" />
                                                <p className="text-gray-500 font-medium">No rewards found</p>
                                                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedRewards.map((reward) => (
                                        <tr key={reward.id} className="hover:bg-gray-50 transition-colors">
                                            {/* Image */}
                                            <td className="px-4 py-3">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {reward.image_path ? (
                                                        <img 
                                                            src={`/storage/${reward.image_path}`} 
                                                            alt={reward.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Gift className="w-6 h-6 text-gray-300" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* Name */}
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900 text-sm">
                                                    {reward.name}
                                                </div>
                                            </td>

                                            {/* Description */}
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-600 max-w-xs truncate">
                                                    {reward.description || 'No description'}
                                                </div>
                                            </td>

                                            {/* Points */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-1">
                                                    <Coins className="w-4 h-4 text-amber-500" />
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {reward.points_required}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Reward Details */}
                                            <td className="px-4 py-3">
                                                {reward.type === 'discount' && (
                                                     <div className="flex flex-col">
                                                         <span className="text-xs font-bold text-blue-600 uppercase">Discount</span>
                                                         <span className="text-sm font-semibold text-gray-900">
                                                             {reward.discount_type === 'percentage' 
                                                                 ? `${reward.discount_value}% Off` 
                                                                 : `${currency} ${parseFloat(reward.discount_value).toFixed(2)} Off`
                                                             }
                                                         </span>
                                                     </div>
                                                 )}
                                                 {reward.type === 'voucher' && (
                                                     <div className="flex flex-col">
                                                         <span className="text-xs font-bold text-purple-600 uppercase">Voucher Code</span>
                                                         <span className="text-sm font-semibold text-gray-900 font-mono">
                                                             {reward.code}
                                                         </span>
                                                         <span className="text-xs text-gray-500">
                                                             ({reward.discount_type === 'percentage' 
                                                                 ? `${reward.discount_value}% Off` 
                                                                 : `${currency} ${parseFloat(reward.discount_value).toFixed(2)} Off`
                                                             })
                                                         </span>
                                                     </div>
                                                 )}
                                                 {(!reward.type || reward.type === 'gift') && (
                                                     <div className="flex items-center space-x-2">
                                                         <Utensils className="w-4 h-4 text-gray-400" />
                                                         <span className="text-sm text-gray-700 font-medium">
                                                             Free {reward.menu_item?.name || 'N/A'}
                                                         </span>
                                                     </div>
                                                 )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleStatus(reward)}
                                                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                                                        reward.status ? 'bg-emerald-500' : 'bg-gray-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                            reward.status ? 'translate-x-7' : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => openModal(reward)}
                                                        className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, reward.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedRewards.length)} of {filteredAndSortedRewards.length} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-gray-700 font-medium">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 duration-300">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={closeModal}></div>
                    
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{editingReward ? 'Edit Reward' : 'Create Reward'}</h2>
                                    <p className="text-sm text-gray-500 mt-1">Configure your loyalty offering</p>
                                </div>
                                <button onClick={closeModal} className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className={`space-y-1.5 ${data.type !== 'gift' ? 'md:col-span-2' : ''}`}>
                                        <label className="text-xs font-bold text-gray-700">Reward Name</label>
                                        <input 
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                            placeholder={data.type === 'gift' ? "e.g. Free Coffee" : data.type === 'discount' ? "e.g. 10% Off Total Bill" : "e.g. Special Promo VOUCHER"}
                                        />
                                        {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                                    </div>

                                    {/* Points Required */}
                                    {data.type === 'gift' && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700">Points Required</label>
                                            <div className="relative">
                                                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                                <input 
                                                    type="number"
                                                    value={data.points_required}
                                                    onChange={(e) => setData('points_required', e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold"
                                                />
                                            </div>
                                            {errors.points_required && <p className="text-xs text-red-500 font-medium">{errors.points_required}</p>}
                                        </div>
                                    )}
                                </div>

                                {/* Reward Type */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700">Reward Type</label>
                                    <select 
                                        value={data.type}
                                        onChange={(e) => {
                                            const selectedType = e.target.value;
                                            setData(prev => ({
                                                ...prev,
                                                type: selectedType,
                                                menu_item_id: selectedType === 'gift' ? prev.menu_item_id : '',
                                                discount_type: selectedType !== 'gift' ? prev.discount_type || 'percentage' : '',
                                                discount_value: selectedType !== 'gift' ? prev.discount_value : '',
                                                code: selectedType === 'voucher' ? prev.code : ''
                                            }));
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                    >
                                        <option value="gift">Free Menu Item (Gift)</option>
                                        <option value="discount">Direct Discount</option>
                                        <option value="voucher">Voucher / Coupon Code</option>
                                    </select>
                                    {errors.type && <p className="text-xs text-red-500 font-medium">{errors.type}</p>}
                                </div>

                                {/* Menu Item Link (Only for Gift) */}
                                {data.type === 'gift' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">Menu Item</label>
                                        <select 
                                            value={data.menu_item_id}
                                            onChange={(e) => setData('menu_item_id', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                        >
                                            <option value="">Select a menu item...</option>
                                            {menus.map(menu => (
                                                <option key={menu.id} value={menu.id}>{menu.name} ({currency} {menu.price})</option>
                                            ))}
                                        </select>
                                        {errors.menu_item_id && <p className="text-xs text-red-500 font-medium">{errors.menu_item_id}</p>}
                                    </div>
                                )}

                                {/* Discount & Voucher Specific Fields */}
                                {(data.type === 'discount' || data.type === 'voucher') && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700">Discount Type</label>
                                            <select 
                                                value={data.discount_type}
                                                onChange={(e) => setData('discount_type', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed Amount ({currency})</option>
                                            </select>
                                            {errors.discount_type && <p className="text-xs text-red-500 font-medium">{errors.discount_type}</p>}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700">Discount Value</label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={data.discount_value}
                                                onChange={(e) => setData('discount_value', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                                placeholder={data.discount_type === 'percentage' ? 'e.g. 10 for 10%' : 'e.g. 5.00'}
                                            />
                                            {errors.discount_value && <p className="text-xs text-red-500 font-medium">{errors.discount_value}</p>}
                                        </div>
                                    </div>
                                )}

                                {data.type === 'voucher' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700">Voucher / Coupon Code</label>
                                        <input 
                                            type="text"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-mono"
                                            placeholder="e.g. SAVE10"
                                        />
                                        {errors.code && <p className="text-xs text-red-500 font-medium">{errors.code}</p>}
                                    </div>
                                )}

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700">Description</label>
                                    <textarea 
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm min-h-[80px] resize-none"
                                        placeholder="Describe the reward..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    {data.type === 'gift' ? (
                                        <>
                                            {/* Image Section */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700 flex items-center">
                                                    <Camera className="w-3 h-3 mr-1.5 text-blue-500" />
                                                    Reward Image
                                                </label>
                                                
                                                <div 
                                                    onClick={() => setGallery({ isOpen: true })}
                                                    className="relative group h-32 rounded-lg bg-white border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all"
                                                >
                                                    {previewImageUrl ? (
                                                        <div className="absolute inset-0">
                                                            <img 
                                                                src={previewImageUrl} 
                                                                className="w-full h-full object-cover"
                                                                alt="Preview"
                                                            />
                                                            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <div className="bg-white px-3 py-1 rounded-lg shadow-lg">
                                                                    <p className="text-xs font-bold text-blue-600">Change Image</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                            <p className="text-xs font-medium text-gray-400">Choose from Gallery</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <label className="cursor-pointer flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <Plus className="w-3 h-3 mr-2 text-blue-500" />
                                                    <span className="text-xs font-semibold text-gray-600">Upload New</span>
                                                    <input 
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setData('image', file);
                                                                setPreviewImageUrl(URL.createObjectURL(file));
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                {errors.image && <p className="text-xs text-red-500 font-medium">{errors.image}</p>}
                                            </div>

                                            {/* Status Toggle */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700">Status</label>
                                                <div className="flex flex-col space-y-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setData('status', true)}
                                                        className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${data.status ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-600'}`}
                                                    >
                                                        Active
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setData('status', false)}
                                                        className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${!data.status ? 'bg-gray-600 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-600'}`}
                                                    >
                                                        Inactive
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-gray-700">Status</label>
                                            <div className="flex gap-4">
                                                <button 
                                                    type="button"
                                                    onClick={() => setData('status', true)}
                                                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${data.status ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-600'}`}
                                                >
                                                    Active
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setData('status', false)}
                                                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${!data.status ? 'bg-gray-600 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-600'}`}
                                                >
                                                    Inactive
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 text-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Gift className="w-4 h-4" />
                                            <span>{editingReward ? 'Save Changes' : 'Create Reward'}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Component Integration */}
            <MediaGallery 
                isOpen={gallery.isOpen}
                onClose={() => setGallery({ ...gallery, isOpen: false })}
                type="images"
                title="Select Reward Image"
                onSelect={(selection) => {
                    if (typeof selection === 'string') {
                        // Existing path from gallery
                        setData('image', selection);
                        setPreviewImageUrl(`/storage/${selection}`);
                    } else {
                        // Directly uploaded as binary file
                        setData('image', selection);
                        setPreviewImageUrl(URL.createObjectURL(selection));
                    }
                    setGallery({ ...gallery, isOpen: false });
                }}
            />
        </AuthenticatedLayout>
    );
}
