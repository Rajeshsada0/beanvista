import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { MessageSquare, ArrowLeft, Send } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Show({ ticket }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        message: ''
    });

    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket.messages]);

    // Live update polling
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['ticket'], preserveScroll: true, preserveState: true });
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('support.reply', ticket.id), {
            onSuccess: () => {
                reset('message');
            },
            preserveScroll: true
        });
    };

    const updateStatus = (newStatus) => {
        router.patch(route('support.status', ticket.id), { status: newStatus }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Ticket: ${ticket.subject}`} />

            <div className="max-w-4xl mx-auto w-full">
                <div className="mb-6">
                    <Link href={route('support.index')} className="text-gray-400 hover:text-gray-900 font-bold text-sm flex items-center transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Tickets
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">{ticket.subject}</h1>
                            <p className="text-sm font-bold text-gray-400 mt-1 flex items-center">
                                Ticket #{ticket.id} • Opened {new Date(ticket.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider">
                                {ticket.priority}
                            </span>
                            <select
                                value={ticket.status}
                                onChange={(e) => updateStatus(e.target.value)}
                                className={`text-xs font-black uppercase tracking-wider border-0 rounded-xl py-2 pl-4 pr-8 focus:ring-0 cursor-pointer transition-colors ${
                                    ticket.status === 'open' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                                    ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                                    ticket.status === 'resolved' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                                <option value="open">OPEN</option>
                                <option value="in_progress">IN PROGRESS</option>
                                <option value="resolved">RESOLVED</option>
                                <option value="closed">CLOSED</option>
                            </select>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-gray-50/30">
                        {ticket.messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col max-w-[80%] ${msg.is_superadmin_reply ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 ml-1">
                                    {msg.is_superadmin_reply ? 'Support Team' : 'You'} • {new Date(msg.created_at).toLocaleString()}
                                </span>
                                <div className={`px-6 py-4 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap shadow-sm border ${
                                    msg.is_superadmin_reply 
                                    ? 'bg-gray-100 border-gray-200 text-gray-800 rounded-tl-sm' 
                                    : 'bg-brand-600 border-brand-600 text-white rounded-tr-sm'
                                }`}>
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Box */}
                    <div className="p-4 border-t border-gray-100 bg-white">
                        {ticket.status === 'closed' ? (
                            <div className="flex items-center justify-center py-4 text-gray-500 font-bold bg-gray-50 rounded-2xl border border-gray-100">
                                This ticket has been closed. Please open a new ticket if you need further assistance.
                            </div>
                        ) : (
                            <form onSubmit={submit} className="flex gap-4">
                                <div className="flex-1">
                                    <textarea
                                        rows="2"
                                        value={data.message}
                                        onChange={e => setData('message', e.target.value)}
                                        className="w-full rounded-2xl border-gray-200 bg-gray-50 px-5 py-3 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 font-medium text-gray-800 transition-all resize-none"
                                        placeholder="Type your reply here..."
                                    ></textarea>
                                    {errors.message && <p className="mt-1 text-xs text-red-500 font-bold ml-2">{errors.message}</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-brand-600 hover:bg-brand-700 text-white font-black px-6 rounded-2xl shadow-lg shadow-brand-500/30 transition-all disabled:opacity-70 flex items-center shrink-0 h-[64px]"
                                >
                                    <Send className="w-5 h-5 mr-2" />
                                    {processing ? '...' : 'Reply'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
