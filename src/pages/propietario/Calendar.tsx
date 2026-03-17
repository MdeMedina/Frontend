import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { Modal } from '../../components/Modal';

type Stay = {
  id: string;
  apartmentId: string;
  apartment: {
    id: string;
    number: string;
    floor: number;
    building: string;
  };
  category: 'GUEST' | 'STAFF';
  status: 'SCHEDULED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  scheduledCheckIn: string;
  scheduledCheckOut: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestDocument?: string;
  guests?: { firstName: string; lastName: string; document: string }[];
  notes?: string;
  isLocked: boolean;
};

const categoryColors = {
  GUEST: 'bg-blue-500 hover:bg-blue-600',
  STAFF: 'bg-amber-500 hover:bg-amber-600',
};

// Colores para eventos de check-in y check-out de huéspedes
const eventColors = {
  checkIn: 'bg-green-500 hover:bg-green-600',  // Verde para check-in
  checkOut: 'bg-red-500 hover:bg-red-600',      // Rojo para check-out
  staff: 'bg-amber-500 hover:bg-amber-600',
};

const categoryLabels = {
  GUEST: 'Huésped',
  STAFF: 'Mantenimiento',
};

const statusLabels = {
  SCHEDULED: 'Programada',
  CHECKED_IN: 'Check-In',
  CHECKED_OUT: 'Check-Out',
  CANCELLED: 'Cancelada',
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const PropietarioCalendar = () => {
  const { user } = useAuth();
  const [stays, setStays] = useState<Stay[]>([]);
  const [myApartments, setMyApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterApartment, setFilterApartment] = useState('');
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const fetchMyApartments = async () => {
    try {
      const response = await apiClient.get('/apartments');
      const allApartments = response.data.data || response.data;
      
      // Determinar si el usuario es propietario o responsable asignado
      const isOwner = user?.role === 'OWNER';
      const isManager = user?.role === 'ASSIGNED_MANAGER';
      
      // Filtrar departamentos según el rol
      const mine = allApartments.filter((apt: any) => {
        if (isOwner) {
          return apt.owner?.id === user?.id;
        } else if (isManager) {
          return apt.manager?.id === user?.id;
        }
        return false;
      });
      
      setMyApartments(mine);
      return mine;
    } catch (err) {
      console.error('Error al cargar departamentos:', err);
      return [];
    }
  };

  const fetchStays = async (apartments: any[]) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/stays', { params: { limit: 200 } });
      const allStays = response.data.data || [];
      
      const myApartmentIds = apartments.map((a: any) => a.id);
      const myStays = allStays.filter((stay: Stay) => 
        myApartmentIds.includes(stay.apartmentId)
      );
      
      setStays(myStays);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const apartments = await fetchMyApartments();
      if (apartments.length > 0) {
        await fetchStays(apartments);
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  // Obtener reservas del mes actual filtradas
  const staysInMonth = useMemo(() => {
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    return stays.filter(stay => {
      if (filterApartment && stay.apartmentId !== filterApartment) return false;
      if (stay.status === 'CANCELLED') return false;
      
      const checkIn = new Date(stay.scheduledCheckIn);
      const checkOut = new Date(stay.scheduledCheckOut);
      
      return (checkIn <= endOfMonth && checkOut >= startOfMonth);
    });
  }, [stays, currentYear, currentMonth, filterApartment]);

  // Tipos de eventos para el calendario
  type CalendarEvent = {
    stay: Stay;
    type: 'checkIn' | 'checkOut' | 'staying';
  };

  // Agrupar eventos por día (check-in, check-out y estancias)
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    
    for (let day = 1; day <= daysInMonth; day++) {
      map[day] = [];
    }

    staysInMonth.forEach(stay => {
      const checkIn = new Date(stay.scheduledCheckIn);
      const checkOut = new Date(stay.scheduledCheckOut);
      
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDayStart = new Date(currentYear, currentMonth, day, 0, 0, 0);
        const currentDayEnd = new Date(currentYear, currentMonth, day, 23, 59, 59);
        
        // Verificar si es día de check-in
        const isCheckInDay = checkIn.getDate() === day && 
                             checkIn.getMonth() === currentMonth && 
                             checkIn.getFullYear() === currentYear;
        
        // Verificar si es día de check-out
        const isCheckOutDay = checkOut.getDate() === day && 
                              checkOut.getMonth() === currentMonth && 
                              checkOut.getFullYear() === currentYear;
        
        // Verificar si está en estancia (ni check-in ni check-out)
        const isStaying = checkIn < currentDayStart && checkOut > currentDayEnd;
        
        if (isCheckInDay) {
          map[day].push({ stay, type: 'checkIn' });
        } else if (isCheckOutDay) {
          map[day].push({ stay, type: 'checkOut' });
        } else if (isStaying) {
          map[day].push({ stay, type: 'staying' });
        }
      }
    });

    return map;
  }, [staysInMonth, currentYear, currentMonth]);

  // Helper para obtener el color del evento
  const getEventColor = (event: CalendarEvent) => {
    // Para huéspedes, usar verde/rojo según check-in/check-out
    if (event.stay.category === 'GUEST') {
      if (event.type === 'checkIn') return eventColors.checkIn;
      if (event.type === 'checkOut') return eventColors.checkOut;
      return 'bg-purple-400 hover:bg-purple-500'; // Color más claro para estancias
    }
    // Para personal, usar sus colores específicos
    if (event.stay.category === 'STAFF') return eventColors.staff;
    return categoryColors[event.stay.category];
  };

  // Helper para obtener el icono del evento
  const getEventIcon = (event: CalendarEvent) => {
    if (event.stay.category === 'GUEST') {
      if (event.type === 'checkIn') return '→';
      if (event.type === 'checkOut') return '←';
      return '●';
    }
    if (event.stay.category === 'STAFF') return '🔧';
    return '';
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const today = new Date();
  const isToday = (day: number) => 
    today.getDate() === day && 
    today.getMonth() === currentMonth && 
    today.getFullYear() === currentYear;

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.role === 'ASSIGNED_MANAGER' ? 'Calendario de Departamentos Asignados' : 'Calendario de Reservas'}
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'ASSIGNED_MANAGER'
                ? 'Vista visual de check-in y check-out de los departamentos que tienes a cargo'
                : 'Vista visual de check-in y check-out de tus departamentos'
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
              <button onClick={() => setError('')} className="float-right font-bold">×</button>
            </div>
          )}

          {/* Controles del calendario */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  ← Anterior
                </button>
                <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  Siguiente →
                </button>
                <button
                  onClick={goToToday}
                  className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                >
                  Hoy
                </button>
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={filterApartment}
                  onChange={(e) => setFilterApartment(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos mis departamentos</option>
                  {myApartments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      Depto {apt.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-4 border-r pr-4">
                <span className="font-medium text-gray-700">Huéspedes:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>→ Check-In</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span>← Check-Out</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-400"></div>
                  <span>● En estancia</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-700">Personal:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500"></div>
                  <span>🧹 Limpieza</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500"></div>
                  <span>🔧 Mantenimiento</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendario */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : myApartments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📆</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No tienes departamentos
              </h3>
              <p className="text-gray-600">
                No hay departamentos registrados a tu nombre.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 bg-gray-50 border-b">
                {dayNames.map((day) => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-600 text-sm">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7">
                {/* Espacios vacíos antes del primer día */}
                {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                  <div key={`empty-${index}`} className="min-h-[120px] bg-gray-50 border-b border-r"></div>
                ))}

                {/* Días del mes */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayEvents = eventsByDay[day] || [];
                  
                  return (
                    <div
                      key={day}
                      className={`min-h-[120px] border-b border-r p-1 ${
                        isToday(day) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className={`text-right mb-1 ${
                        isToday(day) ? 'text-blue-600 font-bold' : 'text-gray-500'
                      }`}>
                        {day}
                      </div>
                      
                      <div className="space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <div
                            key={`${event.stay.id}-${event.type}-${idx}`}
                            onClick={() => setSelectedStay(event.stay)}
                            className={`${getEventColor(event)} text-white text-xs px-2 py-1 rounded cursor-pointer truncate transition flex items-center gap-1`}
                            title={`${event.stay.apartment.number} - ${event.stay.guestFirstName || categoryLabels[event.stay.category]} (${
                              event.type === 'checkIn' ? 'Check-In' : 
                              event.type === 'checkOut' ? 'Check-Out' : 
                              'En estancia'
                            })`}
                          >
                            <span>{getEventIcon(event)}</span>
                            <span className="font-semibold">{event.stay.apartment.number}</span>
                            <span className="truncate">
                              {event.stay.guestFirstName || categoryLabels[event.stay.category]}
                            </span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle de reserva */}
      <Modal
        isOpen={!!selectedStay}
        onClose={() => setSelectedStay(null)}
        title={selectedStay ? `Depto ${selectedStay.apartment.number}` : ''}
        width="max-w-lg"
      >
        <div className="max-h-[80vh] overflow-y-auto pr-2">
            {selectedStay && (
              <>
                <div className="mb-4 text-sm text-gray-500">
                  {selectedStay.apartment.building?.name || 'Sin torre'} • Piso {selectedStay.apartment.floor}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedStay.category === 'GUEST' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {categoryLabels[selectedStay.category]}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedStay.status === 'SCHEDULED' ? 'bg-gray-100 text-gray-800' :
                      selectedStay.status === 'CHECKED_IN' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusLabels[selectedStay.status]}
                    </span>
                  </div>

                  {selectedStay.guestFirstName && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Huésped Principal</h4>
                      <p className="text-gray-900">
                        {selectedStay.guestFirstName} {selectedStay.guestLastName}
                      </p>
                      {selectedStay.guestDocument && (
                        <p className="text-sm text-gray-500">{selectedStay.guestDocument}</p>
                      )}
                    </div>
                  )}

                  {selectedStay.guests && selectedStay.guests.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Huéspedes Adicionales</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedStay.guests.map((guest, i) => (
                          <li key={i}>
                            {guest.firstName} {guest.lastName}
                            {guest.document && <span className="text-gray-400"> • {guest.document}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Check-In</h4>
                      <p className="text-gray-900">
                        {new Date(selectedStay.scheduledCheckIn).toLocaleString('es-ES', {
                          weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      {selectedStay.actualCheckIn && (
                        <p className="text-sm text-green-600">
                          ✓ {new Date(selectedStay.actualCheckIn).toLocaleString('es-ES', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Check-Out</h4>
                      <p className="text-gray-900">
                        {new Date(selectedStay.scheduledCheckOut).toLocaleString('es-ES', {
                          weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      {selectedStay.actualCheckOut && (
                        <p className="text-sm text-green-600">
                          ✓ {new Date(selectedStay.actualCheckOut).toLocaleString('es-ES', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedStay.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Notas</h4>
                      <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded">
                        {selectedStay.notes}
                      </p>
                    </div>
                  )}

                  {selectedStay.isLocked && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-amber-800 text-sm">
                        🔒 Esta reserva está bloqueada. Para modificarla, crea una petición al administrador.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
        </div>
      </Modal>
    </Layout>
  );
};

