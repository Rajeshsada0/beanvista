import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CalendarDays, X, CheckCircle2, Users, Phone, Clock, Calendar, ChevronLeft, ChevronRight, Edit2, Trash2, Check, LayoutGrid, Layers, User, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const formatDateTime = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: true
    }).format(new Date(dateString));
};

// ─── Constants ───────────────────────────────────────────────────────────────
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TIME_SLOTS = [
    '07:00','07:30','08:00','08:30','09:00','09:30',
    '10:00','10:30','11:00','11:30','12:00','12:30',
    '13:00','13:30','14:00','14:30','15:00','15:30',
    '16:00','16:30','17:00','17:30','18:00','18:30',
    '19:00','19:30','20:00','20:30','21:00','21:30',
    '22:00','22:30','23:00',
];

const formatSlot = (time) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${ampm}`;
};

// ─── Custom DateTime Picker (portal-based, never clipped by modal) ────────────
function DateTimePicker({ value, onChange, error }) {
    const today    = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const [open,        setOpen       ] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top:0, bottom:'auto', left:0, width:300 });
    const [selectedDate, setSelectedDate] = useState(value ? value.slice(0,10) : '');
    const [selectedTime, setSelectedTime] = useState(value ? value.slice(11,16) : '');
    const [viewDate,    setViewDate   ] = useState(() => {
        if (value) return new Date(value.slice(0,7)+'-01');
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [step, setStep] = useState('date');
    const triggerRef  = useRef(null);
    const dropdownRef = useRef(null);

    // Sync when value prop changes (e.g. editing a reservation)
    useEffect(() => {
        if (value) {
            setSelectedDate(value.slice(0,10));
            setSelectedTime(value.slice(11,16));
        } else {
            setSelectedDate('');
            setSelectedTime('');
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                triggerRef.current  && !triggerRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = () => {
        if (open) { setOpen(false); return; }
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const PANEL_H = 420;
            const spaceBelow = window.innerHeight - rect.bottom;
            const showAbove  = spaceBelow < PANEL_H && rect.top > PANEL_H;
            setDropdownPos({
                left:  rect.left,
                width: rect.width,
                ...(showAbove
                    ? { bottom: window.innerHeight - rect.top + 8, top: 'auto' }
                    : { top: rect.bottom + 8, bottom: 'auto' }
                ),
            });
        }
        setOpen(true);
        setStep('date');
    };

    const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
    const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));

    const getDays = () => {
        const y = viewDate.getFullYear(), m = viewDate.getMonth();
        const firstDay = new Date(y, m, 1).getDay();
        const total    = new Date(y, m+1, 0).getDate();
        return [...Array(firstDay).fill(null), ...Array.from({length: total}, (_,i) => i+1)];
    };

    const cellDate = (day) => {
        if (!day) return '';
        const y = viewDate.getFullYear();
        const m = String(viewDate.getMonth()+1).padStart(2,'0');
        return `${y}-${m}-${String(day).padStart(2,'0')}`;
    };

    const handleDayClick = (day) => {
        if (!day) return;
        setSelectedDate(cellDate(day));
        setStep('time');
    };

    const handleTimeClick = (slot) => {
        setSelectedTime(slot);
        if (selectedDate) {
            onChange(`${selectedDate}T${slot}`);
            setOpen(false);
            setStep('date');
        }
    };

    const displayValue = () => {
        if (!selectedDate) return '';
        const d = new Date(`${selectedDate}T${selectedTime || '00:00'}`);
        const ds = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
        return ds + (selectedTime ? ` · ${formatSlot(selectedTime)}` : ' · Pick a time →');
    };

    // Render dropdown via portal into document.body (escapes all modal overflow)
    const panel = open && createPortal(
        <div
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top:    dropdownPos.top,
                bottom: dropdownPos.bottom,
                left:   dropdownPos.left,
                width:  dropdownPos.width,
                zIndex: 99999,
            }}
            className="rounded-2xl bg-white border border-gray-100 shadow-2xl shadow-brand-500/15 overflow-hidden"
        >
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button type="button" onClick={() => setStep('date')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all
                        ${step==='date' ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    {selectedDate ? new Date(selectedDate+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Date'}
                </button>
                <button type="button" onClick={() => selectedDate && setStep('time')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all
                        ${!selectedDate ? 'opacity-30 cursor-not-allowed' : ''}
                        ${step==='time' ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {selectedTime ? formatSlot(selectedTime) : 'Time'}
                </button>
            </div>

            {step === 'date' && (
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={prevMonth} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-black text-gray-800">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                        <button type="button" onClick={nextMonth} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase py-1">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1">
                        {getDays().map((day, i) => {
                            const ds         = cellDate(day);
                            const isSelected = !!day && !!selectedDate && ds === selectedDate;
                            const isToday    = !!day && ds === todayStr;
                            const isPast     = !!day && ds < todayStr;
                            return (
                                <button key={i} type="button" disabled={!day || isPast} onClick={() => handleDayClick(day)}
                                    className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all
                                        ${!day    ? 'pointer-events-none' : ''}
                                        ${isPast  ? 'text-gray-200 cursor-not-allowed' : ''}
                                        ${day && !isPast && !isSelected ? 'hover:bg-brand-50 hover:text-brand-600 text-gray-700' : ''}
                                        ${isSelected ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 font-black' : ''}
                                        ${isToday && !isSelected ? 'ring-2 ring-brand-300 text-brand-600' : ''}`}>
                                    {day || ''}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <button type="button"
                            onClick={() => { setSelectedDate(todayStr); setStep('time'); setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); }}
                            className="w-full py-2 text-[11px] font-black text-brand-600 uppercase tracking-widest hover:bg-brand-50 rounded-xl transition-colors">
                            Today
                        </button>
                    </div>
                </div>
            )}

            {step === 'time' && (
                <div className="p-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Pick arrival time</p>
                    <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-1"
                        style={{scrollbarWidth:'thin', scrollbarColor:'#e0e7ff transparent'}}>
                        {TIME_SLOTS.map(slot => (
                            <button key={slot} type="button" onClick={() => handleTimeClick(slot)}
                                className={`py-2 px-1 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all
                                    ${selectedTime===slot
                                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                                        : 'bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-600 border border-gray-100'}`}>
                                {formatSlot(slot)}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={() => setStep('date')}
                            className="w-full py-2 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors flex items-center justify-center gap-1">
                            <ChevronLeft className="w-3 h-3" /> Back to calendar
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );

    return (
        <div className="relative">
            <button ref={triggerRef} type="button" onClick={handleOpen}
                className={`w-full flex items-center rounded-2xl border ${
                    error ? 'border-red-400' :
                    open  ? 'border-brand-400 ring-4 ring-brand-500/10' :
                            'border-gray-100 hover:border-brand-200'
                } bg-gray-50/50 pl-4 pr-5 py-4 outline-none transition-all shadow-inner text-left cursor-pointer group`}>
                <Clock className={`w-4 h-4 mr-3 shrink-0 transition-colors ${open ? 'text-brand-500' : 'text-gray-400 group-hover:text-brand-400'}`} />
                <span className={`flex-1 font-bold text-sm truncate transition-colors ${selectedDate ? 'text-gray-800' : 'text-gray-400'}`}>
                    {selectedDate ? displayValue() : 'Select date & time…'}
                </span>
                <CalendarDays className={`w-4 h-4 shrink-0 transition-colors ${open ? 'text-brand-500' : 'text-gray-400'}`} />
            </button>
            {panel}
        </div>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const s = status || 'active';
    const map = { active:'bg-emerald-100 text-emerald-700', completed:'bg-blue-100 text-blue-700', cancelled:'bg-red-100 text-red-700' };
    return <span className={`px-2.5 py-1 text-[10px] uppercase font-black tracking-widest rounded-lg shadow-sm ${map[s]||'bg-gray-100 text-gray-600'}`}>{s}</span>;
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
function ConfirmDialog({ reservation, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white border border-gray-100 p-5 shadow-2xl text-center">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mx-auto mb-3">
                    <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-gray-900 mb-1">Delete Reservation?</h3>
                <p className="text-xs font-medium text-gray-400 mb-5">
                    Remove booking for <span className="text-red-600 font-bold">{reservation.customer_name}</span>? This cannot be undone.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={onCancel} className="py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase hover:bg-gray-200 transition-all">Keep</button>
                    <button onClick={onConfirm} className="py-2.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase shadow shadow-red-500/25 hover:bg-red-700 transition-all">Delete</button>
                </div>
            </div>
        </div>
    );
}

// ─── Reservation Card ─────────────────────────────────────────────────────────
function ReservationCard({ res, onEdit, onUpdateStatus, onDelete }) {
    return (
        <div className={`group relative flex flex-col p-6 backdrop-blur-xl rounded-[2rem] border transition-all duration-300
            ${res.status==='active'
                ? 'bg-white/70 border-white/80 hover:bg-white/90 hover:shadow-xl hover:-translate-y-1'
                : 'bg-white/30 border-gray-100 opacity-70'
            } shadow-[0_8px_30px_rgba(0,0,0,0.04)]`}>
            <div className="flex justify-between items-start mb-5 gap-2">
                <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-sm ${res.status==='active' ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                        <Users className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-gray-900 leading-tight truncate">{res.customer_name}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Table {res.table?.table_number||'N/A'}</p>
                    </div>
                </div>
                <StatusBadge status={res.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 col-span-2 bg-gray-50 rounded-xl px-3 py-2">
                    <Clock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="text-sm font-bold text-gray-700">{formatDateTime(res.booking_time)}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm font-bold text-gray-600">{res.guests_count} Guests</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm font-bold text-gray-600 truncate">{res.phone}</span>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100/50">
                {res.status==='active' ? (
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => onUpdateStatus(res,'completed')}
                            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all active:scale-95">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} /> Confirm
                        </button>
                        <button onClick={() => onEdit(res)}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-brand-600 bg-brand-50 hover:bg-brand-100 transition-all active:scale-95">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => onUpdateStatus(res,'cancelled')}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95">
                            <X className="w-3.5 h-3.5" strokeWidth={3} /> Cancel
                        </button>
                    </div>
                ) : (
                    <button onClick={() => onDelete(res)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-gray-400 bg-gray-50 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Reservation Form Modal ───────────────────────────────────────────────────
function ReservationModal({ isOpen, onClose, tables, editingReservation }) {
    const isEdit = !!editingReservation;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        table_id: '', customer_name: '', phone: '', booking_time: '', guests_count: 1,
    });

    useEffect(() => {
        if (!isOpen) return;
        if (editingReservation) {
            const bt = editingReservation.booking_time
                ? editingReservation.booking_time.replace(' ','T').slice(0,16) : '';
            setData({
                table_id:      editingReservation.table_id      || '',
                customer_name: editingReservation.customer_name || '',
                phone:         editingReservation.phone         || '',
                booking_time:  bt,
                guests_count:  editingReservation.guests_count  || 1,
            });
        } else {
            reset();
            clearErrors();
        }
    }, [editingReservation, isOpen]);

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('reservations.update', editingReservation.id), { onSuccess: () => { onClose(); reset(); } });
        } else {
            post(route('reservations.store'), { onSuccess: () => { onClose(); reset(); } });
        }
    };

    // Allow current table even if occupied (it's this reservation's own table)
    const availableTables = tables.filter(t => t.status !== 'occupied' || String(t.id) === String(data.table_id));

    if (!isOpen) return null;

    return (
        <>
            {/* Full-screen backdrop */}
            <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md" onClick={onClose} />

            {/* Modal container — on mobile: between header (top-16) and bottom nav (bottom-24) */}
            <div className="fixed inset-x-0 top-16 bottom-24 lg:inset-0 z-[101] flex items-center justify-center px-4 pointer-events-none">
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-500/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative pointer-events-auto w-full max-w-lg rounded-2xl bg-white border border-gray-100 p-5 shadow-2xl overflow-y-auto"
                     style={{ maxHeight: '100%' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-white shadow-sm ${isEdit ? 'bg-violet-600' : 'bg-brand-600'}`}>
                                {isEdit ? <Edit2 className="w-4 h-4" /> : <CalendarDays className="w-4 h-4" />}
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900">{isEdit ? 'Edit Reservation' : 'New Reservation'}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isEdit ? 'Update details' : "Book a table"}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                    </div>

                <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Guest Name */}
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Guest Name</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input type="text" placeholder="Full name" value={data.customer_name} onChange={e => setData('customer_name', e.target.value)} required
                                    className={`w-full rounded-xl border ${errors.customer_name ? 'border-red-400' : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/10'} bg-gray-50 pl-9 pr-4 py-2.5 outline-none focus:ring-2 font-bold text-sm text-gray-800 transition-all`} />
                                {errors.customer_name && <p className="mt-1 text-xs font-bold text-red-500">{errors.customer_name}</p>}
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input type="tel" placeholder="Mobile number" value={data.phone} onChange={e => setData('phone', e.target.value)} required
                                    className={`w-full rounded-xl border ${errors.phone ? 'border-red-400' : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/10'} bg-gray-50 pl-9 pr-4 py-2.5 outline-none focus:ring-2 font-bold text-sm text-gray-800 transition-all`} />
                                {errors.phone && <p className="mt-1 text-xs font-bold text-red-500">{errors.phone}</p>}
                            </div>
                        </div>

                        {/* Party Size */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Party Size</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input type="number" min="1" value={data.guests_count} onChange={e => setData('guests_count', e.target.value)} required
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-black text-sm text-gray-800 transition-all" />
                            </div>
                        </div>

                        {/* Table */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Table</label>
                            <div className="relative">
                                <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select value={data.table_id} onChange={e => setData('table_id', e.target.value)} required
                                    className={`w-full rounded-xl border ${errors.table_id ? 'border-red-400' : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/10'} bg-gray-50 pl-9 pr-4 py-2.5 outline-none focus:ring-2 font-bold text-sm text-gray-800 transition-all appearance-none`}>
                                    <option value="">Select table</option>
                                    {availableTables.map(t => <option key={t.id} value={t.id}>{t.table_number} ({t.capacity} seats)</option>)}
                                </select>
                                {errors.table_id && <p className="mt-1 text-xs font-bold text-red-500">{errors.table_id}</p>}
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Arrival Date &amp; Time</label>
                            <DateTimePicker value={data.booking_time} onChange={val => setData('booking_time', val)} error={errors.booking_time} />
                            {errors.booking_time && <p className="mt-1 text-xs font-bold text-red-500">{errors.booking_time}</p>}
                        </div>
                    </div>

                    <button type="submit" disabled={processing}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl text-white font-black py-3 shadow transition-all disabled:opacity-70 active:scale-[0.98] text-sm mt-1
                            ${isEdit ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/25' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/25'}`}>
                        <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                        {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Complete Reservation'}
                    </button>
                </form>
            </div>
        </div>
    </>
    );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReservationIndex({ reservations, tables }) {
    const [isModalOpen,      setIsModalOpen     ] = useState(false);
    const [activeTab,        setActiveTab       ] = useState('bookings'); // 'bookings' or 'tables'
    const [editingReservation, setEditing        ] = useState(null);
    const [confirmDelete,    setConfirmDelete    ] = useState(null);
    
    // Table Management State
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [editingTable,     setEditingTable   ] = useState(null);
    const [confirmDeleteTable, setConfirmDeleteTable] = useState(null);
    const [changeStatusTable, setChangeStatusTable] = useState(null);

    const { data: tableData, setData: setTableData, post: postTable, put: putTable, processing: processingTable, errors: tableErrors, reset: resetTable } = useForm({
        table_number: '',
        capacity: 2,
        status: 'available'
    });

    const openCreateModal = ()  => { setEditing(null);        setIsModalOpen(true); };
    const openEditModal   = (r) => { setEditing(r);           setIsModalOpen(true); };
    const closeModal      = ()  => { setIsModalOpen(false);   setEditing(null);     };

    const openCreateTableModal = () => { setEditingTable(null); resetTable(); setIsTableModalOpen(true); };
    const openEditTableModal = (t) => {
        setEditingTable(t);
        setTableData({
            table_number: t.table_number,
            capacity: t.capacity,
            status: t.status
        });
        setIsTableModalOpen(true);
    };

    const submitTable = (e) => {
        e.preventDefault();
        if (editingTable) {
            putTable(route('tables.update', editingTable.id), {
                onSuccess: () => { setIsTableModalOpen(false); resetTable(); }
            });
        } else {
            postTable(route('tables.store'), {
                onSuccess: () => { setIsTableModalOpen(false); resetTable(); }
            });
        }
    };

    const deleteTable = (t) => {
        router.delete(route('tables.destroy', t.id), {
            onSuccess: () => setConfirmDeleteTable(null)
        });
    };

    const updateStatus = (res, status) => router.put(route('reservations.update', res.id), { status }, { preserveScroll: true });
    const deleteReservation = (res)    => { router.delete(route('reservations.destroy', res.id)); setConfirmDelete(null); };

    const updateTableStatus = (tbl, status) => {
        router.put(route('tables.update', tbl.id), { ...tbl, status }, { preserveScroll: true });
        setChangeStatusTable(null);
    };

    // ── Datatable state (Bookings) ──
    const [bSearch,  setBSearch ] = useState('');
    const [bStatus,  setBStatus ] = useState('all');
    const [bSortBy,  setBSortBy ] = useState('booking_time');
    const [bSortDir, setBSortDir] = useState('asc');
    const [bPage,    setBPage   ] = useState(1);
    const PER_PAGE = 10;

    const statusCounts = useMemo(() => ({
        all:       reservations.length,
        active:    reservations.filter(r => (r.status || 'active') === 'active').length,
        completed: reservations.filter(r => (r.status || 'active') === 'completed').length,
        cancelled: reservations.filter(r => (r.status || 'active') === 'cancelled').length,
    }), [reservations]);

    const filteredReservations = useMemo(() => {
        let list = [...reservations];
        if (bSearch) {
            const q = bSearch.toLowerCase();
            list = list.filter(r =>
                r.customer_name.toLowerCase().includes(q) ||
                (r.phone || '').toLowerCase().includes(q) ||
                (r.table?.table_number || '').toString().toLowerCase().includes(q)
            );
        }
        if (bStatus !== 'all') list = list.filter(r => (r.status || 'active') === bStatus);
        list.sort((a, b) => {
            let av, bv;
            if (bSortBy === 'customer_name') { av = a.customer_name; bv = b.customer_name; }
            else if (bSortBy === 'booking_time') { av = new Date(a.booking_time); bv = new Date(b.booking_time); }
            else if (bSortBy === 'table') { av = a.table?.table_number || ''; bv = b.table?.table_number || ''; }
            else if (bSortBy === 'guests_count') { av = a.guests_count; bv = b.guests_count; }
            else if (bSortBy === 'status') { av = a.status; bv = b.status; }
            else { av = new Date(a.booking_time); bv = new Date(b.booking_time); }
            if (av < bv) return bSortDir === 'asc' ? -1 : 1;
            if (av > bv) return bSortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [reservations, bSearch, bStatus, bSortBy, bSortDir]);

    const totalPages       = Math.max(1, Math.ceil(filteredReservations.length / PER_PAGE));
    const pagedReservations = filteredReservations.slice((bPage - 1) * PER_PAGE, bPage * PER_PAGE);

    const handleSort = (col) => {
        if (bSortBy === col) setBSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setBSortBy(col); setBSortDir('asc'); }
        setBPage(1);
    };
    const SortIcon = ({ col }) => {
        if (bSortBy !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 inline" />;
        return bSortDir === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-brand-600 inline" />
            : <ArrowDown className="w-3 h-3 ml-1 text-brand-600 inline" />;
    };

    // ── Datatable state (Tables) ──
    const [tSearch,  setTSearch ] = useState('');
    const [tStatus,  setTStatus ] = useState('all');
    const [tSortBy,  setTSortBy ] = useState('table_number');
    const [tSortDir, setTSortDir] = useState('asc');
    const [tPage,    setTPage   ] = useState(1);
    const T_PER_PAGE = 10;

    const tableStatusCounts = useMemo(() => ({
        all:       tables.length,
        available: tables.filter(t => t.status === 'available').length,
        occupied:  tables.filter(t => t.status === 'occupied').length,
        reserved:  tables.filter(t => t.status === 'reserved').length,
    }), [tables]);

    const filteredTables = useMemo(() => {
        let list = [...tables];
        if (tSearch) {
            const q = tSearch.toLowerCase();
            list = list.filter(t =>
                t.table_number.toLowerCase().includes(q)
            );
        }
        if (tStatus !== 'all') list = list.filter(t => t.status === tStatus);
        list.sort((a, b) => {
            let av, bv;
            if (tSortBy === 'table_number') { av = a.table_number; bv = b.table_number; }
            else if (tSortBy === 'capacity') { av = a.capacity; bv = b.capacity; }
            else if (tSortBy === 'status') { av = a.status; bv = b.status; }
            else { av = a.table_number; bv = b.table_number; }
            if (av < bv) return tSortDir === 'asc' ? -1 : 1;
            if (av > bv) return tSortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [tables, tSearch, tStatus, tSortBy, tSortDir]);

    const tTotalPages = Math.max(1, Math.ceil(filteredTables.length / T_PER_PAGE));
    const pagedTables = filteredTables.slice((tPage - 1) * T_PER_PAGE, tPage * T_PER_PAGE);

    const handleTableSort = (col) => {
        if (tSortBy === col) setTSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setTSortBy(col); setTSortDir('asc'); }
        setTPage(1);
    };
    const TableSortIcon = ({ col }) => {
        if (tSortBy !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 inline" />;
        return tSortDir === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-brand-600 inline" />
            : <ArrowDown className="w-3 h-3 ml-1 text-brand-600 inline" />;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Reservations" />

            <div className="flex flex-col space-y-4">
                {/* ── Compact Header ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">Reservations</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center mt-0.5">
                                <CalendarDays className="w-3 h-3 mr-1 text-brand-500" /> Bookings &amp; Floor Plan
                            </p>
                        </div>
                        {/* Tab Switcher inline */}
                        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 ml-2">
                            <button onClick={() => setActiveTab('bookings')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                    activeTab === 'bookings' ? 'bg-white text-brand-700 shadow' : 'text-gray-500 hover:text-gray-700'
                                }`}>
                                <CalendarDays className="w-3 h-3" /> Bookings
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none ${
                                    activeTab === 'bookings' ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-500'
                                }`}>{reservations.length}</span>
                            </button>
                            <button onClick={() => setActiveTab('tables')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                    activeTab === 'tables' ? 'bg-white text-brand-700 shadow' : 'text-gray-500 hover:text-gray-700'
                                }`}>
                                <LayoutGrid className="w-3 h-3" /> Tables
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none ${
                                    activeTab === 'tables' ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-500'
                                }`}>{tables.length}</span>
                            </button>
                        </div>
                    </div>
                    {activeTab === 'bookings' ? (
                        <button onClick={openCreateModal}
                            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow shadow-brand-500/25 transition-all shrink-0">
                            <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Add Reservation
                        </button>
                    ) : (
                        <button onClick={openCreateTableModal}
                            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow shadow-brand-500/25 transition-all shrink-0">
                            <Plus className="w-3.5 h-3.5" strokeWidth={3} /> Add Table
                        </button>
                    )}
                </div>

                {activeTab === 'bookings' ? (
                    <div className="space-y-3">

                        {/* ── Datatable Toolbar ── */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input type="text" value={bSearch} onChange={e => { setBSearch(e.target.value); setBPage(1); }}
                                    placeholder="Search guest, phone, table…"
                                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 bg-gray-50 transition-all" />
                                {bSearch && (
                                    <button onClick={() => { setBSearch(''); setBPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
                                {[
                                    { key: 'all',       label: 'All'       },
                                    { key: 'active',    label: 'Active'    },
                                    { key: 'completed', label: 'Done'      },
                                    { key: 'cancelled', label: 'Cancelled' },
                                ].map(tab => (
                                    <button key={tab.key} onClick={() => { setBStatus(tab.key); setBPage(1); }}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                            bStatus === tab.key ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'
                                        }`}>
                                        {tab.label}
                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                                            bStatus === tab.key ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-500'
                                        }`}>{statusCounts[tab.key]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredReservations.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                </div>
                                <p className="text-sm font-bold text-gray-500">{bSearch || bStatus !== 'all' ? 'No matching reservations' : 'No reservations yet'}</p>
                                <p className="text-xs text-gray-400 mt-1">{bSearch || bStatus !== 'all' ? 'Adjust search or filter' : 'Click "Add Reservation" to create the first booking.'}</p>
                            </div>
                        ) : (
                            <>
                                {/* ── Desktop Datatable ── */}
                                <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[900px]">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-gray-50">
                                                    <th className="px-4 py-3">
                                                        <button onClick={() => handleSort('customer_name')} className="flex items-center text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-gray-700 transition-colors">
                                                            Guest <SortIcon col="customer_name" />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3">
                                                    <button onClick={() => handleSort('table')} className="flex items-center text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-gray-700 transition-colors">
                                                        Table <SortIcon col="table" />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3">
                                                    <button onClick={() => handleSort('booking_time')} className="flex items-center text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-gray-700 transition-colors">
                                                        Booking Date <SortIcon col="booking_time" />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3">
                                                    <button onClick={() => handleSort('guests_count')} className="flex items-center text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-gray-700 transition-colors">
                                                        Party <SortIcon col="guests_count" />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3">
                                                    <button onClick={() => handleSort('status')} className="flex items-center text-[10px] uppercase font-black tracking-widest text-gray-400 hover:text-gray-700 transition-colors">
                                                        Status <SortIcon col="status" />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-gray-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {pagedReservations.map(res => (
                                                <tr key={res.id} className={`group hover:bg-gray-50/60 transition-colors ${res.status !== 'active' ? 'opacity-60' : ''}`}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${res.status === 'active' ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                                                                <User className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 leading-tight">{res.customer_name}</p>
                                                                <p className="text-[10px] font-bold text-gray-400">{res.phone}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-700">
                                                            {res.table?.table_number || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-800">
                                                                {new Date(res.booking_time).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5 mt-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(res.booking_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                                            <Users className="w-3.5 h-3.5 text-gray-400" />{res.guests_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={res.status} />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {res.status === 'active' && (
                                                                <>
                                                                    <button onClick={() => updateStatus(res,'completed')} title="Confirm"
                                                                        className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-all">
                                                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                                                    </button>
                                                                    <button onClick={() => updateStatus(res,'cancelled')} title="Cancel"
                                                                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-all">
                                                                        <X className="w-3.5 h-3.5" strokeWidth={3} />
                                                                    </button>
                                                                    <button onClick={() => openEditModal(res)} title="Edit"
                                                                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-all">
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button onClick={() => setConfirmDelete(res)} title="Delete"
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    </div>

                                    {/* Desktop Pagination */}
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                                            {filteredReservations.length === 0 ? 'No results' :
                                                `Showing ${(bPage-1)*PER_PAGE+1}–${Math.min(bPage*PER_PAGE, filteredReservations.length)} of ${filteredReservations.length}`}
                                        </p>
                                        {totalPages > 1 && (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setBPage(p => Math.max(1,p-1))} disabled={bPage===1}
                                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                {Array.from({length:totalPages},(_,i)=>i+1)
                                                    .filter(p => p===1||p===totalPages||Math.abs(p-bPage)<=1)
                                                    .map((p,idx,arr) => (
                                                        <span key={p} className="flex items-center">
                                                            {idx>0 && arr[idx-1]!==p-1 && <span className="px-1 text-gray-300 text-xs select-none">…</span>}
                                                            <button onClick={() => setBPage(p)}
                                                                className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                                                    p===bPage ? 'bg-brand-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                                                                }`}>{p}</button>
                                                        </span>
                                                    ))}
                                                <button onClick={() => setBPage(p => Math.min(totalPages,p+1))} disabled={bPage===totalPages}
                                                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── Mobile Cards ── */}
                                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {pagedReservations.map(res => (
                                        <div key={res.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 ${res.status !== 'active' ? 'opacity-70' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${res.status === 'active' ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-gray-900">{res.customer_name}</h4>
                                                        <p className="text-[10px] font-bold text-gray-400">{res.phone}</p>
                                                    </div>
                                                </div>
                                                <StatusBadge status={res.status} />
                                            </div>

                                            <div className="grid grid-cols-4 gap-1.5">
                                                <div className="bg-gray-50 rounded-xl px-2 py-1.5 text-center">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase">Table</p>
                                                    <p className="text-xs font-black text-gray-700">{res.table?.table_number||'N/A'}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl px-2 py-1.5 text-center">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase">Guests</p>
                                                    <p className="text-xs font-black text-gray-700">{res.guests_count}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl px-2 py-1.5 text-center col-span-2">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase">Booking Date</p>
                                                    <p className="text-[10px] font-black text-gray-700 leading-tight">
                                                        {new Date(res.booking_time).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-gray-400">
                                                        {new Date(res.booking_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-gray-100">
                                                {res.status === 'active' && (
                                                    <>
                                                        <button onClick={() => openEditModal(res)} className="p-2 rounded-xl bg-gray-100 text-gray-500 active:scale-90"><Edit2 className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => updateStatus(res,'cancelled')} className="p-2 rounded-xl bg-amber-50 text-amber-500 active:scale-90"><X className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => updateStatus(res,'completed')} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black shadow-sm active:scale-95">
                                                            <Check className="w-3 h-3" strokeWidth={3} />Confirm
                                                        </button>
                                                    </>
                                                )}
                                                {res.status !== 'active' && (
                                                    <button onClick={() => setConfirmDelete(res)} className="p-2 rounded-xl bg-red-50 text-red-500 active:scale-90"><Trash2 className="w-3.5 h-3.5" /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile Pagination */}
                                {totalPages > 1 && (
                                    <div className="lg:hidden flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                                        <p className="text-[10px] font-bold text-gray-400">
                                            {(bPage-1)*PER_PAGE+1}–{Math.min(bPage*PER_PAGE, filteredReservations.length)} of {filteredReservations.length}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setBPage(p => Math.max(1,p-1))} disabled={bPage===1}
                                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-all">
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-xs font-black text-gray-600">{bPage} / {totalPages}</span>
                                            <button onClick={() => setBPage(p => Math.min(totalPages,p+1))} disabled={bPage===totalPages}
                                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-all">
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">

                        {/* ── Datatable Toolbar ── */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input type="text" value={tSearch} onChange={e => { setTSearch(e.target.value); setTPage(1); }}
                                    placeholder="Search table name…"
                                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 bg-gray-50 transition-all" />
                                {tSearch && (
                                    <button onClick={() => { setTSearch(''); setTPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
                                {[
                                    { key: 'all',       label: 'All'       },
                                    { key: 'available', label: 'Available' },
                                    { key: 'occupied',  label: 'Occupied'  },
                                    { key: 'reserved',  label: 'Reserved'  },
                                ].map(tab => (
                                    <button key={tab.key} onClick={() => { setTStatus(tab.key); setTPage(1); }}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                            tStatus === tab.key ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'
                                        }`}>
                                        {tab.label}
                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                                            tStatus === tab.key ? 'bg-brand-50 text-brand-600' : 'bg-gray-200 text-gray-500'
                                        }`}>{tableStatusCounts[tab.key]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredTables.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                                    <Layers className="w-5 h-5 text-gray-400" />
                                </div>
                                <p className="text-sm font-bold text-gray-500">{tSearch || tStatus !== 'all' ? 'No matching tables' : 'No tables yet'}</p>
                                <p className="text-xs text-gray-400 mt-1">{tSearch || tStatus !== 'all' ? 'Adjust search or filter' : 'Click "Add Table" to create the first table.'}</p>
                            </div>
                        ) : (
                            <>
                                {/* ── Desktop Datatable ── */}
                                <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[700px]">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-gray-50">
                                                    <th className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                                        <button onClick={() => handleTableSort('table_number')} className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                                                            Table <TableSortIcon col="table_number" />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                                    <button onClick={() => handleTableSort('capacity')} className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                                                        Capacity <TableSortIcon col="capacity" />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                                    <button onClick={() => handleTableSort('status')} className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                                                        Status <TableSortIcon col="status" />
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3 text-[10px] uppercase font-black tracking-widest text-gray-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {pagedTables.map(table => (
                                        <tr key={table.id} className="group hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl border font-black text-sm ${
                                                    table.status==='available' ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                                    : table.status==='occupied' ? 'bg-red-50 text-red-800 border-red-100'
                                                    : 'bg-amber-50 text-amber-800 border-amber-100'
                                                }`}>{table.table_number}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                                    <Users className="w-3.5 h-3.5 text-gray-400" />{table.capacity} seats
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    table.status==='available' ? 'bg-emerald-100 text-emerald-700'
                                                    : table.status==='occupied' ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'}`}>
                                                    {table.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setChangeStatusTable(table)} title="Change Status"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => openEditTableModal(table)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteTable(table)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </div>

                        {/* Desktop Pagination */}
                        {tTotalPages > 1 && (
                            <div className="hidden lg:flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                                <p className="text-xs font-bold text-gray-400">
                                    Showing {(tPage-1)*T_PER_PAGE+1}–{Math.min(tPage*T_PER_PAGE, filteredTables.length)} of {filteredTables.length}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setTPage(p => Math.max(1,p-1))} disabled={tPage===1}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-all">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {(() => {
                                        const pages = [];
                                        if (tTotalPages <= 7) for (let i=1; i<=tTotalPages; i++) pages.push(i);
                                        else {
                                            if (tPage <= 3) pages.push(1,2,3,4,'…',tTotalPages);
                                            else if (tPage >= tTotalPages-2) pages.push(1,'…',tTotalPages-3,tTotalPages-2,tTotalPages-1,tTotalPages);
                                            else pages.push(1,'…',tPage-1,tPage,tPage+1,'…',tTotalPages);
                                        }
                                        return pages.map((p,i) =>
                                            p==='…' ? <span key={`ellipsis-${i}`} className="px-2 text-xs font-black text-gray-300">…</span>
                                            : <button key={p} onClick={() => setTPage(p)}
                                                className={`min-w-[32px] px-2 py-1 rounded-lg text-xs font-black transition-all ${
                                                    tPage===p ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                                                }`}>{p}</button>
                                        );
                                    })()}
                                    <button onClick={() => setTPage(p => Math.min(tTotalPages,p+1))} disabled={tPage===tTotalPages}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Mobile Cards ── */}
                        <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {pagedTables.map(table => (
                                <div key={table.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className={`px-2.5 py-1 rounded-xl border font-black text-sm ${
                                            table.status==='available' ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                            : table.status==='occupied' ? 'bg-red-50 text-red-800 border-red-100'
                                            : 'bg-amber-50 text-amber-800 border-amber-100'
                                        }`}>{table.table_number}</span>
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                            table.status==='available' ? 'bg-emerald-100 text-emerald-700'
                                            : table.status==='occupied' ? 'bg-red-100 text-red-700'
                                            : 'bg-amber-100 text-amber-700'}`}>{table.status}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                        <Users className="w-3 h-3" />{table.capacity} seats
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <button onClick={() => setChangeStatusTable(table)}
                                            className="p-1.5 rounded-xl bg-emerald-50 text-emerald-500 active:scale-90 transition-all">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => openEditTableModal(table)}
                                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black active:scale-95 transition-all">
                                            <Edit2 className="w-3 h-3" />Edit
                                        </button>
                                        <button onClick={() => setConfirmDeleteTable(table)}
                                            className="p-1.5 rounded-xl bg-red-50 text-red-500 active:scale-90 transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile Pagination */}
                        {tTotalPages > 1 && (
                            <div className="lg:hidden flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                                <p className="text-[10px] font-bold text-gray-400">
                                    {(tPage-1)*T_PER_PAGE+1}–{Math.min(tPage*T_PER_PAGE, filteredTables.length)} of {filteredTables.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setTPage(p => Math.max(1,p-1))} disabled={tPage===1}
                                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-all">
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-xs font-black text-gray-600">{tPage} / {tTotalPages}</span>
                                    <button onClick={() => setTPage(p => Math.min(tTotalPages,p+1))} disabled={tPage===tTotalPages}
                                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition-all">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <ReservationModal isOpen={isModalOpen} onClose={closeModal} tables={tables} editingReservation={editingReservation} />

            {/* Table Modal */}
            {isTableModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsTableModalOpen(false)}></div>
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white border border-gray-100 p-5 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                                    <LayoutGrid className="w-4 h-4" />
                                </div>
                                <h3 className="text-base font-black text-gray-900">{editingTable ? 'Edit Table' : 'Add Table'}</h3>
                            </div>
                            <button onClick={() => setIsTableModalOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={submitTable} className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Table Name / Number</label>
                                <input type="text" value={tableData.table_number} onChange={e => setTableData('table_number', e.target.value)} required
                                    placeholder="e.g. T-01, Window, Bar 3"
                                    className={`w-full rounded-xl border ${tableErrors.table_number ? 'border-red-400' : 'border-gray-200 focus:border-brand-500 focus:ring-brand-500/10'} bg-gray-50 px-3 py-2.5 outline-none focus:ring-2 font-bold text-sm text-gray-800 transition-all`} />
                                {tableErrors.table_number && <p className="text-red-500 text-xs mt-1">{tableErrors.table_number}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Seating Capacity</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <input type="number" min="1" value={tableData.capacity} onChange={e => setTableData('capacity', e.target.value)} required
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-bold text-sm text-gray-800 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</label>
                                <select value={tableData.status} onChange={e => setTableData('status', e.target.value)} required
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-bold text-sm text-gray-800 transition-all appearance-none">
                                    <option value="available">Available</option>
                                    <option value="reserved">Reserved</option>
                                    <option value="occupied">Occupied</option>
                                </select>
                            </div>
                            <button type="submit" disabled={processingTable}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl shadow shadow-brand-500/20 text-sm transition-all disabled:opacity-70 mt-1">
                                <CheckCircle2 className="w-4 h-4" />
                                {processingTable ? 'Saving...' : 'Save Table'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {confirmDeleteTable && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setConfirmDeleteTable(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white border border-gray-100 p-5 shadow-2xl text-center">
                        <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mx-auto mb-3"><Trash2 className="w-5 h-5" /></div>
                        <h3 className="text-base font-black text-gray-900 mb-1">Delete Table {confirmDeleteTable.table_number}?</h3>
                        <p className="text-xs font-medium text-gray-400 mb-5">This will also remove linked reservations.</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setConfirmDeleteTable(null)} className="py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase">Keep</button>
                            <button onClick={() => deleteTable(confirmDeleteTable)} className="py-2.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase shadow shadow-red-500/25">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {changeStatusTable && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setChangeStatusTable(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white border border-gray-100 p-5 shadow-2xl space-y-3">
                        <div className="text-center">
                            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mx-auto mb-3">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-black text-gray-900 mb-1">Change Status: {changeStatusTable.table_number}</h3>
                            <p className="text-xs font-medium text-gray-400">Select a new status for this table</p>
                        </div>
                        <div className="space-y-2">
                            <button onClick={() => updateTableStatus(changeStatusTable, 'available')}
                                className="w-full py-3 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-black uppercase hover:bg-emerald-200 transition-all">
                                Available
                            </button>
                            <button onClick={() => updateTableStatus(changeStatusTable, 'occupied')}
                                className="w-full py-3 rounded-xl bg-red-100 text-red-700 text-xs font-black uppercase hover:bg-red-200 transition-all">
                                Occupied
                            </button>
                            <button onClick={() => updateTableStatus(changeStatusTable, 'reserved')}
                                className="w-full py-3 rounded-xl bg-amber-100 text-amber-700 text-xs font-black uppercase hover:bg-amber-200 transition-all">
                                Reserved
                            </button>
                            <button onClick={() => setChangeStatusTable(null)}
                                className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase hover:bg-gray-200 transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <ConfirmDialog
                    reservation={confirmDelete}
                    onConfirm={() => deleteReservation(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)} />
            )}
        </AuthenticatedLayout>
    );
}
