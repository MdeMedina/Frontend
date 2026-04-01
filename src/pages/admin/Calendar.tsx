import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { staysApi, categoryLabels, categoryColors, getGuestFullName, categoryConfig, statusLabels, statusConfig } from '../../api/stays';
import type { Stay, Guest } from '../../api/stays';
import { Modal } from '../../components/Modal';
import { ReservationDetailsModal } from '../../components/reservations/ReservationDetailsModal';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface CalendarEvent {
  stay: Stay;
  type: 'check-in' | 'check-out';
  date: Date;
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};


export const AdminCalendar = () => {
  const { currentBuilding } = useAuth();
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);

  const fetchStays = async () => {
    try {
      setLoading(true);
      const response = await staysApi.getAll({
        limit: 500,
        buildingId: currentBuilding?.id
      });
      setStays(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar estadías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStays();
  }, [currentBuilding?.id]);

  // Generar eventos de calendario
  const events = useMemo(() => {
    const eventList: CalendarEvent[] = [];
    stays.forEach(stay => {
      eventList.push({
        stay,
        type: 'check-in',
        date: new Date(stay.scheduledCheckIn),
      });
      eventList.push({
        stay,
        type: 'check-out',
        date: new Date(stay.scheduledCheckOut),
      });
    });
    return eventList;
  }, [stays]);

  // Obtener eventos para un día específico
  const getEventsForDay = (date: Date) => {
    return events.filter(event =>
      event.date.getFullYear() === date.getFullYear() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getDate() === date.getDate()
    );
  };

  // Generar días del mes
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const currentMonthDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const navigateYear = (direction: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear() + direction, prev.getMonth(), 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  // Obtener total de huéspedes
  const getTotalGuests = (stay: Stay) => {
    let count = (stay.guestFirstName || stay.guestLastName) ? 1 : 0;
    if (stay.guests && Array.isArray(stay.guests)) {
      count += stay.guests.length;
    }
    return count;
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Quirúrgico */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
            </div>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-black/[0.05] shadow-sm">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${viewMode === 'month'
                    ? 'bg-[#001640] text-white shadow-lg shadow-black/10'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Grilla Mensual
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${viewMode === 'year'
                    ? 'bg-[#001640] text-white shadow-lg shadow-black/10'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Vista Anual
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">error_outline</span>
                {error}
              </div>
              <button onClick={() => setError('')} className="hover:text-rose-900 transition-colors px-2">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center h-80 gap-4 bg-white shadow-[var(--shadow-surgical)] rounded-xl border border-[var(--color-border)]">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-primary/10"></div>
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Terminal...</p>
            </div>
          ) : viewMode === 'month' ? (
            /* Vista Mensual */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Calendario */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-surgical)] overflow-hidden animate-in fade-in duration-700">
                {/* Navegación de Grilla */}
                <div className="bg-[#001640] text-white px-6 py-5 flex justify-between items-center">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="hover:bg-black/40 p-2 rounded-xl transition-all border border-white/10 active:scale-95 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <div className="flex items-center gap-4">
                    <h2 className="text-[12px] font-bold uppercase tracking-[0.4em]">
                      {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button
                      onClick={goToToday}
                      className="text-[8px] font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl border border-white/5 transition-all uppercase tracking-widest shadow-sm"
                    >
                      Hoy
                    </button>
                  </div>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="hover:bg-black/40 p-2 rounded-xl transition-all border border-white/10 active:scale-95 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 bg-gray-50/50 border-b border-black/[0.03]">
                  {DAY_NAMES.map(day => (
                    <div key={day} className="px-2 py-3 text-center text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] font-mono">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grilla de Días */}
                <div className="grid grid-cols-7 divide-x divide-y divide-black/[0.03]">
                  {currentMonthDays.map((date, index) => {
                    const dayEvents = date ? getEventsForDay(date) : [];
                    const guestEvents = dayEvents.filter(e => e.stay.category === 'GUEST');
                    const staffEvents = dayEvents.filter(e => e.stay.category === 'STAFF');

                    const isSelected = selectedDay && date &&
                      selectedDay.getDate() === date.getDate() &&
                      selectedDay.getMonth() === date.getMonth() &&
                      selectedDay.getFullYear() === date.getFullYear();

                    return (
                      <div
                        key={index}
                        onClick={() => date && setSelectedDay(date)}
                        className={`min-h-[120px] p-2 cursor-pointer transition-all duration-300 relative group ${!date ? 'bg-gray-50/30' :
                            isSelected ? 'bg-primary/[0.02] ring-1 ring-inset ring-primary/20' :
                              'hover:bg-gray-50/50'
                          }`}
                      >
                        {date && (
                          <>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[10px] font-bold font-mono transition-colors ${isToday(date)
                                  ? 'bg-primary text-white px-2 py-0.5 rounded-lg shadow-sm'
                                  : isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-gray-900'
                                }`}>
                                {String(date.getDate()).padStart(2, '0')}
                              </span>
                              {dayEvents.length > 0 && (
                                <span className="text-[8px] font-bold text-gray-300 font-mono">
                                  {dayEvents.length} OP
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {guestEvents.length > 0 && (
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-emerald-50 rounded-sm border border-emerald-500/10 scale-95 origin-left">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                  <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-tighter">Huésped x{guestEvents.length}</span>
                                </div>
                              )}
                              {staffEvents.length > 0 && (
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-sky-50 rounded-sm border border-sky-500/10 scale-95 origin-left">
                                  <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                                  <span className="text-[8px] font-bold text-sky-700 uppercase tracking-tighter">Staff x{staffEvents.length}</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Panel de Bitácora Diaria */}
              <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-surgical)] flex flex-col h-[700px] animate-in slide-in-from-right-4 duration-700">
                <div className="bg-gray-50 border-b border-black/[0.03] px-5 py-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg text-gray-400">event_note</span>
                  <div className="flex-1">
                    <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.2em] leading-none mb-1">
                      Bitácora Diaria
                    </h3>
                    <p className="text-[9px] font-bold text-primary uppercase font-mono tracking-widest">
                      {selectedDay
                        ? `${selectedDay.getDate()} ${MONTH_NAMES[selectedDay.getMonth()].substring(0, 3)} ${selectedDay.getFullYear()}`
                        : 'SELECCIONAR FECHA'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {!selectedDay ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30 px-6 text-center">
                      <span className="material-symbols-outlined text-4xl">touch_app</span>
                      <p className="text-[9px] font-bold text-gray-900 uppercase tracking-[0.3em]">
                        Interacción requerida con la grilla
                      </p>
                    </div>
                  ) : selectedDayEvents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                      <span className="material-symbols-outlined text-4xl">calendar_today</span>
                      <p className="text-[9px] font-bold text-gray-900 uppercase tracking-[0.3em]">
                        Sin eventos registrados
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDayEvents
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .map((event, idx) => {
                          const config = categoryConfig[event.stay.category];
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedStay(event.stay)}
                              className={`p-4 rounded-xl border border-black/[0.03] cursor-pointer hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden group ${config.bg} ${config.border}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-sm border border-black/[0.03] ${event.type === 'check-in'
                                    ? 'bg-emerald-100/50 text-emerald-700'
                                    : 'bg-rose-100/50 text-rose-700'
                                  }`}>
                                  {event.type === 'check-in' ? '● IN' : '● OUT'}
                                </span>
                                <span className="text-[10px] font-bold font-mono text-gray-600">
                                  {formatTime(event.type === 'check-in'
                                    ? event.stay.scheduledCheckIn
                                    : event.stay.scheduledCheckOut)}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-bold text-gray-900 tracking-tight">
                                    Unidad {event.stay.apartment.number}
                                  </span>
                                  <span className="text-[9px] font-bold text-gray-300 font-mono bg-black/[0.03] px-1.5 py-0.5 rounded-sm">
                                    PISO {event.stay.apartment.floor}
                                  </span>
                                </div>

                                {event.stay.category === 'GUEST' && (event.stay.guestFirstName || event.stay.guestLastName) && (
                                  <div className="text-[10px] text-gray-600 font-medium flex items-center gap-2 truncate">
                                    <span className="material-symbols-outlined text-sm opacity-40">person</span>
                                    {getGuestFullName(event.stay)}
                                  </div>
                                )}

                                <div className={`text-[8px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${config.text}`}>
                                  <span className={`w-1 h-1 rounded-full ${config.dot}`}></span>
                                  {config.label}
                                </div>
                              </div>

                              <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-30 transition-opacity">
                                <span className="material-symbols-outlined text-sm">visibility</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Vista Anual Quirúrgica */
            <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-surgical)] overflow-hidden animate-in fade-in duration-700">
              <div className="bg-[#001640] text-white px-8 py-8 flex justify-between items-center">
                <button
                  onClick={() => navigateYear(-1)}
                  className="hover:bg-black/40 px-6 py-2.5 rounded-xl transition-all border border-white/10 text-[9px] font-bold uppercase tracking-widest active:scale-95 shadow-sm"
                >
                  Regresión Anual
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em] mb-1">PROGRAMA DE OPERACIONES</span>
                  <h2 className="text-3xl font-bold tracking-[0.2em] font-mono">
                    {currentDate.getFullYear()}
                  </h2>
                </div>
                <button
                  onClick={() => navigateYear(1)}
                  className="hover:bg-black/40 px-6 py-2.5 rounded-xl transition-all border border-white/10 text-[9px] font-bold uppercase tracking-widest active:scale-95 shadow-sm"
                >
                  Avance Anual
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8 bg-gray-50/30">
                {MONTH_NAMES.map((monthName, monthIndex) => {
                  const monthDays = getDaysInMonth(currentDate.getFullYear(), monthIndex);

                  return (
                    <div
                      key={monthIndex}
                      className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                      onClick={() => {
                        setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
                        setViewMode('month');
                      }}
                    >
                      <div className="bg-gray-50 px-4 py-3 border-b border-black/[0.03] flex justify-between items-center group-hover:bg-[#001640] group-hover:text-white transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{monthName}</span>
                        <span className="text-[9px] font-bold opacity-30 group-hover:opacity-100 font-mono transition-opacity">{monthIndex + 1}</span>
                      </div>
                      <div className="p-3">
                        <div className="grid grid-cols-7 gap-1">
                          {DAY_NAMES.map(d => (
                            <div key={d} className="text-center text-[7px] font-bold text-gray-300 uppercase font-mono">
                              {d[0]}
                            </div>
                          ))}
                          {monthDays.map((date, idx) => {
                            const dayEvents = date ? getEventsForDay(date) : [];
                            const hasGuest = dayEvents.some(e => e.stay.category === 'GUEST');
                            const hasStaff = dayEvents.some(e => e.stay.category === 'STAFF');

                            let bgColor = '';
                            if (hasGuest && hasStaff) {
                              bgColor = 'bg-primary text-white';
                            } else if (hasGuest) {
                              bgColor = 'bg-emerald-400 text-white';
                            } else if (hasStaff) {
                              bgColor = 'bg-sky-400 text-white';
                            } else if (isToday(date)) {
                              bgColor = 'border border-primary text-primary font-bold';
                            } else {
                              bgColor = 'text-gray-300 hover:text-gray-900 hover:bg-gray-50';
                            }

                            return (
                              <div
                                key={idx}
                                className={`text-center text-[8px] h-5 flex items-center justify-center rounded-xs transition-colors font-mono ${bgColor} ${!date ? 'opacity-0' : ''}`}
                              >
                                {date?.getDate()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles de la reserva Quirúrgico */}
      <Modal
        isOpen={!!selectedStay}
        onClose={() => setSelectedStay(null)}
        title="Expediente de Calendario"
        width="max-w-2xl"
      >
        <ReservationDetailsModal
          stay={selectedStay}
          onClose={() => setSelectedStay(null)}
        />
      </Modal>
    </Layout>
  );
};
