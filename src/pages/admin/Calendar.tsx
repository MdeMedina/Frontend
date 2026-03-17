import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import { staysApi, categoryLabels, categoryColors, getGuestFullName } from '../../api/stays';
import type { Stay, Guest } from '../../api/stays';
import { Modal } from '../../components/Modal';

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

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Programada',
  CHECKED_IN: 'Check-In Realizado',
  CHECKED_OUT: 'Check-Out Realizado',
  CANCELLED: 'Cancelada',
};

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  CHECKED_OUT: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const AdminCalendar = () => {
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
      const response = await staysApi.getAll({ limit: 500 });
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
  }, []);

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
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendario de Estadías</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-purple-500 rounded"></span> Huéspedes
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-500 rounded"></span> Limpieza
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-orange-500 rounded"></span> Mantenimiento
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📅 Mes
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'year'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📆 Año
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Hoy
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
              <button onClick={() => setError('')} className="float-right font-bold">×</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : viewMode === 'month' ? (
            /* Vista Mensual */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendario */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
                {/* Navegación */}
                <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="hover:bg-indigo-700 p-2 rounded transition"
                  >
                    ←
                  </button>
                  <h2 className="text-xl font-bold">
                    {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="hover:bg-indigo-700 p-2 rounded transition"
                  >
                    →
                  </button>
                </div>

                {/* Días de la semana */}
                <div className="grid grid-cols-7 bg-gray-100 border-b">
                  {DAY_NAMES.map(day => (
                    <div key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Días del mes */}
                <div className="grid grid-cols-7">
                  {currentMonthDays.map((date, index) => {
                    const dayEvents = date ? getEventsForDay(date) : [];
                    // Agrupar por categoría
                    const guestEvents = dayEvents.filter(e => e.stay.category === 'GUEST');
                    const cleaningEvents = dayEvents.filter(e => e.stay.category === 'CLEANING_STAFF');
                    const maintenanceEvents = dayEvents.filter(e => e.stay.category === 'MAINTENANCE_STAFF');
                    
                    const isSelected = selectedDay && date && 
                      selectedDay.getDate() === date.getDate() &&
                      selectedDay.getMonth() === date.getMonth() &&
                      selectedDay.getFullYear() === date.getFullYear();

                    return (
                      <div
                        key={index}
                        onClick={() => date && setSelectedDay(date)}
                        className={`min-h-[100px] p-2 border-b border-r cursor-pointer transition ${
                          !date ? 'bg-gray-50' : 
                          isSelected ? 'bg-indigo-50 ring-2 ring-indigo-500' :
                          'hover:bg-gray-50'
                        }`}
                      >
                        {date && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${
                              isToday(date) 
                                ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                                : 'text-gray-700'
                            }`}>
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {guestEvents.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                  <span className="text-xs text-purple-700">{guestEvents.length}</span>
                                </div>
                              )}
                              {cleaningEvents.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  <span className="text-xs text-blue-700">{cleaningEvents.length}</span>
                                </div>
                              )}
                              {maintenanceEvents.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                  <span className="text-xs text-orange-700">{maintenanceEvents.length}</span>
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

              {/* Panel de detalles del día */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-800 text-white px-4 py-3">
                  <h3 className="font-bold">
                    {selectedDay 
                      ? `${selectedDay.getDate()} de ${MONTH_NAMES[selectedDay.getMonth()]}`
                      : 'Selecciona un día'}
                  </h3>
                </div>
                <div className="p-4 max-h-[600px] overflow-y-auto">
                  {!selectedDay ? (
                    <p className="text-gray-500 text-center py-8">
                      Haz clic en un día para ver los detalles
                    </p>
                  ) : selectedDayEvents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Sin eventos para este día
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayEvents
                        .sort((a, b) => a.date.getTime() - b.date.getTime())
                        .map((event, idx) => {
                          const colors = categoryColors[event.stay.category];
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedStay(event.stay)}
                              className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition ${colors.bg} ${colors.border}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  event.type === 'check-in'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {event.type === 'check-in' ? '● Check-In' : '● Check-Out'}
                                </span>
                                <span className="text-sm font-medium">
                                  {formatTime(event.type === 'check-in' 
                                    ? event.stay.scheduledCheckIn 
                                    : event.stay.scheduledCheckOut)}
                                </span>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  🏢 Depto {event.stay.apartment.number}
                                </div>
                                <div className="text-gray-600">
                                  {event.stay.apartment.building?.name || 'Sin torre'} - Piso {event.stay.apartment.floor}
                                </div>
                                <div className={`mt-1 text-xs font-medium ${colors.text}`}>
                                  {categoryLabels[event.stay.category]}
                                </div>
                                {event.stay.category === 'GUEST' && (event.stay.guestFirstName || event.stay.guestLastName) && (
                                  <div className="text-gray-600 mt-1">
                                    👤 {getGuestFullName(event.stay)}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-indigo-600 mt-2 text-right">
                                Clic para ver detalles →
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
            /* Vista Anual */
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
                <button
                  onClick={() => navigateYear(-1)}
                  className="hover:bg-indigo-700 p-2 rounded transition"
                >
                  ← Año anterior
                </button>
                <h2 className="text-2xl font-bold">
                  {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateYear(1)}
                  className="hover:bg-indigo-700 p-2 rounded transition"
                >
                  Año siguiente →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                {MONTH_NAMES.map((monthName, monthIndex) => {
                  const monthDays = getDaysInMonth(currentDate.getFullYear(), monthIndex);
                  
                  return (
                    <div
                      key={monthIndex}
                      className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition"
                      onClick={() => {
                        setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
                        setViewMode('month');
                      }}
                    >
                      <div className="bg-gray-100 px-3 py-2 text-center font-medium text-gray-800">
                        {monthName}
                      </div>
                      <div className="p-2">
                        <div className="grid grid-cols-7 gap-1">
                          {DAY_NAMES.map(d => (
                            <div key={d} className="text-center text-[10px] text-gray-400">
                              {d[0]}
                            </div>
                          ))}
                          {monthDays.map((date, idx) => {
                            const dayEvents = date ? getEventsForDay(date) : [];
                            const hasGuest = dayEvents.some(e => e.stay.category === 'GUEST');
                            const hasCleaning = dayEvents.some(e => e.stay.category === 'CLEANING_STAFF');
                            const hasMaintenance = dayEvents.some(e => e.stay.category === 'MAINTENANCE_STAFF');
                            
                            let bgColor = '';
                            if (hasGuest && (hasCleaning || hasMaintenance)) {
                              bgColor = 'bg-gradient-to-r from-purple-400 via-blue-400 to-orange-400 text-white';
                            } else if (hasGuest) {
                              bgColor = 'bg-purple-400 text-white';
                            } else if (hasCleaning) {
                              bgColor = 'bg-blue-400 text-white';
                            } else if (hasMaintenance) {
                              bgColor = 'bg-orange-400 text-white';
                            } else if (isToday(date)) {
                              bgColor = 'bg-indigo-600 text-white';
                            } else {
                              bgColor = 'text-gray-600';
                            }
                            
                            return (
                              <div
                                key={idx}
                                className={`text-center text-[10px] h-5 flex items-center justify-center rounded ${bgColor}`}
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

      {/* Modal de detalles de la reserva */}
      <Modal
        isOpen={!!selectedStay}
        onClose={() => setSelectedStay(null)}
        title="Detalles de la Reserva"
        width="max-w-2xl"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            {/* Tipo de entrada y estado */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedStay && categoryColors[selectedStay.category].bg} ${selectedStay && categoryColors[selectedStay.category].text}`}>
                {selectedStay && categoryLabels[selectedStay.category]}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedStay && statusColors[selectedStay.status]}`}>
                {selectedStay && statusLabels[selectedStay.status]}
              </span>
              {selectedStay?.isLocked && (
                <span className="text-yellow-600 text-sm">🔒 Registro bloqueado</span>
              )}
            </div>

            {/* Info del departamento */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Departamento</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Número:</span> <span className="font-medium">Depto {selectedStay?.apartment.number}</span></div>
                <div><span className="text-gray-500">Edificio:</span> <span className="font-medium">{selectedStay?.apartment.building?.name || 'Sin torre'}</span></div>
                <div><span className="text-gray-500">Piso:</span> <span className="font-medium">{selectedStay?.apartment.floor}</span></div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Fechas y Horarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Check-In programado:</div>
                  <div className="font-medium text-green-700">{selectedStay && formatDate(selectedStay.scheduledCheckIn)}</div>
                  {selectedStay?.actualCheckIn && (
                    <>
                      <div className="text-gray-500 mt-2">Check-In realizado:</div>
                      <div className="font-medium">{formatDate(selectedStay.actualCheckIn)}</div>
                    </>
                  )}
                </div>
                <div>
                  <div className="text-gray-500">Check-Out programado:</div>
                  <div className="font-medium text-red-700">{selectedStay && formatDate(selectedStay.scheduledCheckOut)}</div>
                  {selectedStay?.actualCheckOut && (
                    <>
                      <div className="text-gray-500 mt-2">Check-Out realizado:</div>
                      <div className="font-medium">{formatDate(selectedStay.actualCheckOut)}</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Huésped principal (solo para GUEST) */}
            {selectedStay?.category === 'GUEST' && (selectedStay.guestFirstName || selectedStay.guestLastName) && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Huésped Principal</h3>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-500">Nombre:</span>{' '}
                    <span className="font-medium">{selectedStay.guestFirstName} {selectedStay.guestLastName}</span>
                  </div>
                  {selectedStay.guestDocument && (
                    <div>
                      <span className="text-gray-500">Documento:</span>{' '}
                      <span className="font-medium font-mono">{selectedStay.guestDocument}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Huéspedes adicionales */}
            {selectedStay?.guests && Array.isArray(selectedStay.guests) && selectedStay.guests.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Huéspedes Adicionales ({selectedStay.guests.length})
                </h3>
                <div className="space-y-2">
                  {selectedStay.guests.map((guest: Guest, idx: number) => (
                    <div key={idx} className="bg-white p-2 rounded border border-purple-200 text-sm flex justify-between">
                      <span className="font-medium">{guest.firstName} {guest.lastName}</span>
                      {guest.document && (
                        <span className="text-gray-500 font-mono">{guest.document}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total de personas */}
            {selectedStay?.category === 'GUEST' && (
              <div className="bg-indigo-50 p-3 rounded-lg flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total de personas:</span>
                <span className="text-xl font-bold text-indigo-700">
                  {selectedStay && getTotalGuests(selectedStay)}
                </span>
              </div>
            )}

            {/* Notas */}
            {selectedStay?.notes && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Notas</h3>
                <p className="text-sm text-gray-700">{selectedStay.notes}</p>
              </div>
            )}
        </div>

        <div className="mt-6 flex justify-end">
            <button
            onClick={() => setSelectedStay(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
            Cerrar
            </button>
        </div>
      </Modal>
    </Layout>
  );
};
