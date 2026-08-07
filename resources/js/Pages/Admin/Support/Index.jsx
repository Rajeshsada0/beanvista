import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { MessageSquare, Plus, AlertCircle, Clock, CheckCircle2, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, X, Upload, Paperclip } from 'lucide-react';
import { useState, useMemo } from 'react';
import Modal from '@/Components/Modal';

const PER_PAGE = 10;

export default function Index({ tickets }) {
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        priority: 'medium',
        message: '',
        attachment: null
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('support.store'), {
            onSuccess: () => {
                setIsCreating(false);
                reset();
            }
        });
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('asc');
        }
        setPage(1);
    };

    const filteredTickets = useMemo(() => {
        let result = [...tickets];
        
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => 
                t.subject.toLowerCase().includes(q)
            );
        }
        
        if (statusFilter !== 'all') {
            result = result.filter(t => t.status === statusFilter);
        }
        
        if (priorityFilter !== 'all') {
            result = result.filter(t => t.priority === priorityFilter);
        }
        
        result.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (sortBy === 'updated_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        
        return result;
    }, [tickets, searchQuery, statusFilter, priorityFilter, sortBy, sortDir]);

    const paginatedTickets = useMemo(() => {
        const start = (page - 1) * PER_PAGE;
        return filteredTickets.slice(start, start + PER_PAGE);
    }, [filteredTickets, page]);

    const totalPages = Math.ceil(filteredTickets.length / PER_PAGE);
    const startItem = filteredTickets.length > 0 ? (page - 1) * PER_PAGE + 1 : 0;
    const endItem = Math.min(page * PER_PAGE, filteredTickets.length);

    const getStatusBadge = (status) => {
        const styles = {
            open: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
            resolved: 'bg-brand-100 text-brand-700 border-brand-200',
            closed: 'bg-gray-100 text-gray-700 border-gray-200'
        };
        return <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase border ${styles[status]}`}>{status.replace('_', ' ')}</span>;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Support Tickets" />

            <div className="w-full space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
                            <MessageSquare className="w-7 h-7 mr-3 text-brand-600" />
                            Support Tickets
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Need help? Open a ticket and our team will assist you.</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Open New Ticket
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                    className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setPage(1); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                        className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white appearance-none cursor-pointer font-medium text-sm"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                                        className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white appearance-none cursor-pointer font-medium text-sm"
                                    >
                                        <option value="all">All Priority</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {filteredTickets.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th 
                                                onClick={() => handleSort('subject')}
                                                className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    Subject
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </div>
                                            </th>
                                            <th 
                                                onClick={() => handleSort('status')}
                                                className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    Status
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </div>
                                            </th>
                                            <th 
                                                onClick={() => handleSort('priority')}
                                                className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden sm:table-cell"
                                            >
                                                <div className="flex items-center gap-2">
                                                    Priority
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </div>
                                            </th>
                                            <th 
                                                onClick={() => handleSort('updated_at')}
                                                className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors hidden md:table-cell"
                                            >
                                                <div className="flex items-center gap-2">
                                                    Last Update
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedTickets.map(ticket => (
                                            <tr key={ticket.id} className="hover:bg-brand-50/30 transition-colors group cursor-pointer" onClick={() => window.location.href = route('support.show', ticket.id)}>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{ticket.subject}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getStatusBadge(ticket.status)}
                                                </td>
                                                <td className="px-4 py-3 hidden sm:table-cell">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase ${
                                                        ticket.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                                                        ticket.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {ticket.priority}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-500">
                                                    {new Date(ticket.updated_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {totalPages > 1 && (
                                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                                    <div className="text-sm text-gray-600">
                                        Showing <span className="font-semibold text-gray-900">{startItem}</span> to <span className="font-semibold text-gray-900">{endItem}</span> of <span className="font-semibold text-gray-900">{filteredTickets.length}</span> tickets
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm font-medium"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Page <span className="font-semibold text-gray-900">{page}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm font-medium"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle2 className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' ? 'No tickets found' : 'You\'re all caught up!'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' 
                                    ? 'Try adjusting your search or filters.' 
                                    : 'You don\'t have any open support tickets right now.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Modal show={isCreating} onClose={() => setIsCreating(false)}>
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center mr-3">
                                <AlertCircle className="w-5 h-5 text-brand-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Open a New Ticket</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Please provide as much detail as possible</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Subject</label>
                            <input
                                type="text"
                                value={data.subject}
                                onChange={e => setData('subject', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                                placeholder="E.g., Issue with billing or feature request"
                            />
                            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Priority</label>
                            <select
                                value={data.priority}
                                onChange={e => setData('priority', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                            >
                                <option value="low">Low - General Question</option>
                                <option value="medium">Medium - Bug or Issue</option>
                                <option value="high">High - Critical Blocking Issue</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Message</label>
                            <textarea
                                rows="4"
                                value={data.message}
                                onChange={e => setData('message', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all resize-none"
                                placeholder="Describe your issue here..."
                            ></textarea>
                            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">Attachment (Optional)</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    onChange={e => setData('attachment', e.target.files[0])}
                                    className="hidden"
                                    id="attachment-upload"
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                                <label
                                    htmlFor="attachment-upload"
                                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-500 hover:bg-brand-50/30 transition-all cursor-pointer"
                                >
                                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                                    <span className="text-sm font-medium text-gray-600">
                                        {data.attachment ? data.attachment.name : 'Click to upload file'}
                                    </span>
                                </label>
                                {data.attachment && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                        <Paperclip className="w-4 h-4" />
                                        <span className="flex-1 truncate">{data.attachment.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setData('attachment', null)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Supported formats: Images, PDF, DOC, DOCX (Max 10MB)</p>
                            {errors.attachment && <p className="mt-1 text-xs text-red-600">{errors.attachment}</p>}
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 text-sm"
                            >
                                {processing ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
