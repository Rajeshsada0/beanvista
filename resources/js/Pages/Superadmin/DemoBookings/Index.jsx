import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Trash2, Search, Filter } from 'lucide-react';

export default function Index({ bookings, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get(route('superadmin.demo-bookings.index'), {
            search,
            status
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleStatusFilterChange = (newStatus) => {
        setStatus(newStatus);
        router.get(route('superadmin.demo-bookings.index'), {
            search,
            status: newStatus
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleStatusUpdate = (id, newStatus) => {
        if (confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) {
            router.patch(route('superadmin.demo-bookings.update', id), {
                status: newStatus
            }, {
                preserveScroll: true
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this demo booking record?')) {
            router.delete(route('superadmin.demo-bookings.destroy', id), {
                preserveScroll: true
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manage Demo Bookings" />

            <div className="flex flex-col space-y-8 w-full pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">Demo Bookings</h1>
                        <p className="mt-1 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                            <CalendarDays className="w-4 h-4 mr-2 text-brand-500" />
                            Manage Demo Requests
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/60 backdrop-blur-xl border border-white/80 p-4 md:p-6 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, cafe..."
                            className="w-full pl-11 pr-4 py-3 bg-stone-50 border-0 rounded-2xl ring-1 ring-inset ring-stone-200 focus:ring-2 focus:ring-brand-500 text-sm"
                        />
                        <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-gray-400" />
                        <button type="submit" className="hidden">Search</button>
                    </form>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2 flex items-center">
                            <Filter className="w-3.5 h-3.5 mr-1" /> Filter Status:
                        </span>
                        {['', 'pending', 'completed', 'cancelled'].map((state) => (
                            <button
                                key={state}
                                onClick={() => handleStatusFilterChange(state)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                                    status === state
                                        ? 'bg-brand-600 border-brand-600 text-white shadow-md'
                                        : 'bg-white border-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600'
                                }`}
                            >
                                {state === '' ? 'All' : state}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Demo Bookings Table */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-white/40">
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Contact Person</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Email</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Cafe Name</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Date Booked</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {bookings.data && bookings.data.length > 0 ? (
                                    bookings.data.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-white/40 transition-colors group">
                                            <td className="py-4 px-6 text-sm font-black text-gray-900">
                                                {booking.first_name} {booking.last_name}
                                            </td>
                                            <td className="py-4 px-6 text-sm font-bold text-gray-500">
                                                {booking.email}
                                            </td>
                                            <td className="py-4 px-6 text-sm font-bold text-gray-700">
                                                {booking.cafe_name}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-center">
                                                <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                                    booking.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : booking.status === 'cancelled'
                                                        ? 'bg-red-50 text-red-600 border-red-100'
                                                        : 'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-center font-bold text-gray-500">
                                                {new Date(booking.created_at).toLocaleDateString('en-US', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors shadow-sm"
                                                                title="Mark Completed"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                                className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-colors shadow-sm"
                                                                title="Cancel Demo"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(booking.id)}
                                                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors shadow-sm"
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-500 font-bold">
                                            No demo bookings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {bookings.links && bookings.links.length > 3 && (
                        <div className="p-6 border-t border-gray-100 flex items-center justify-center space-x-1.5 sm:space-x-2 bg-gray-50/30">
                            {bookings.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        link.active
                                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                                            : 'bg-white text-gray-500 hover:bg-brand-50 hover:text-brand-600 border border-gray-100 shadow-sm'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
