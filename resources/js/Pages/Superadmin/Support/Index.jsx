import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { MessageSquare, CheckCircle2, Building2, Search } from 'lucide-react';
import { useState } from 'react';

export default function Index({ tickets }) {
    const [searchQuery, setSearchQuery] = useState('');

    const getStatusBadge = (status) => {
        const styles = {
            open: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
            resolved: 'bg-blue-100 text-blue-800 border-blue-200',
            closed: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${styles[status]}`}>{status.replace('_', ' ')}</span>;
    };

    const filteredTickets = tickets.filter(ticket => {
        if (!searchQuery) return true;
        const lowerQuery = searchQuery.toLowerCase();
        return (
            ticket.subject.toLowerCase().includes(lowerQuery) ||
            ticket.tenant?.name?.toLowerCase().includes(lowerQuery) ||
            ticket.status.toLowerCase().includes(lowerQuery) ||
            ticket.priority.toLowerCase().includes(lowerQuery)
        );
    });

    return (
        <AuthenticatedLayout>
            <Head title="Support Desk" />

            <div className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center">
                            <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
                            Global Support Desk
                        </h1>
                        <p className="mt-1 text-sm font-medium text-gray-500">Manage support tickets from all cafes across the platform.</p>
                    </div>
                    
                    <div className="relative w-full md:w-72">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tickets, cafes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-white border-gray-100 rounded-2xl text-sm font-bold placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {filteredTickets.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Cafe</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Subject</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Priority</th>
                                    <th className="py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Last Update</th>
                                    <th className="py-4 px-6 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="py-4 px-6 cursor-pointer" onClick={() => window.location.href = route('superadmin.support.show', ticket.id)}>
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3 shrink-0">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{ticket.tenant?.name || 'Unknown Cafe'}</div>
                                                    <div className="text-xs text-gray-500">{ticket.user?.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 cursor-pointer" onClick={() => window.location.href = route('superadmin.support.show', ticket.id)}>
                                            <div className="font-bold text-gray-900">{ticket.subject}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {getStatusBadge(ticket.status)}
                                        </td>
                                        <td className="py-4 px-6 hidden sm:table-cell text-sm font-medium text-gray-500 capitalize cursor-pointer" onClick={() => window.location.href = route('superadmin.support.show', ticket.id)}>
                                            {ticket.priority}
                                        </td>
                                        <td className="py-4 px-6 hidden md:table-cell text-sm font-medium text-gray-500 cursor-pointer" onClick={() => window.location.href = route('superadmin.support.show', ticket.id)}>
                                            {new Date(ticket.updated_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Link href={route('superadmin.support.show', ticket.id)} className="text-blue-600 hover:text-blue-900 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors inline-block">
                                                View Ticket
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">No Tickets Found</h3>
                            <p className="text-gray-500 font-medium max-w-sm">
                                {searchQuery ? 'Try adjusting your search terms.' : 'There are no open support tickets at the moment.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
