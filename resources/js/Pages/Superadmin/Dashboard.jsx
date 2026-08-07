import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Building2, Users, ShieldAlert, Activity, CheckCircle2, XCircle } from 'lucide-react';

export default function Dashboard({ stats, cafe_activity }) {
    const statCards = [
        {
            title: "Total Cafes",
            value: stats.total_cafes,
            icon: Building2,
            color: "text-brand-600",
            bg: "bg-brand-50"
        },
        {
            title: "Active Cafes",
            value: stats.active_cafes,
            icon: Activity,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            title: "Total Users",
            value: stats.total_users,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Super Admins",
            value: stats.total_super_admins,
            icon: ShieldAlert,
            color: "text-purple-600",
            bg: "bg-purple-50"
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Super Admin Dashboard" />

            <div className="flex flex-col space-y-8 w-full pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900">Super Admin Command Center</h1>
                        <p className="mt-1 text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-brand-500" />
                            Global System Metrics
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {statCards.map((stat, i) => (
                        <div key={i} className="bg-white/60 backdrop-blur-xl border border-white/80 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col">
                            <div className="flex justify-between items-start mb-3 md:mb-4">
                                <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                                </div>
                            </div>
                            <h3 className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest leading-tight">{stat.title}</h3>
                            <p className="text-xl md:text-3xl font-black text-gray-900 mt-1 leading-tight">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Cafe Activity Table */}
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg md:text-xl font-black text-gray-900">Cafe Usage Monitoring</h2>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Real-time order activity across all tenants</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cafe Name</th>
                                    <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Today's Orders</th>
                                    <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Weekly Orders</th>
                                    <th className="px-6 md:px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">System Usage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100/80">
                                {cafe_activity?.map((cafe) => (
                                    <tr key={cafe.id} className="hover:bg-white/40 transition-colors">
                                        <td className="px-6 md:px-8 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-gray-900">{cafe.name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cafe.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 text-center">
                                            <span className={`inline-flex items-center justify-center min-w-[3rem] h-8 rounded-lg text-sm font-black ${cafe.today_orders > 0 ? 'bg-brand-50 text-brand-700 border border-brand-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                {cafe.today_orders}
                                            </span>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 text-center">
                                            <span className={`inline-flex items-center justify-center min-w-[3rem] h-8 rounded-lg text-sm font-black ${cafe.weekly_orders > 0 ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                {cafe.weekly_orders}
                                            </span>
                                        </td>
                                        <td className="px-6 md:px-8 py-5 text-right">
                                            {cafe.weekly_orders > 10 ? (
                                                <span className="inline-flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                                    <Activity className="w-3 h-3 mr-1.5" /> High Activity
                                                </span>
                                            ) : cafe.weekly_orders > 0 ? (
                                                <span className="inline-flex items-center text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                    Moderate
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
