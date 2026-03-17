import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import { staysApi, categoryLabels, getGuestFullName } from '../../api/stays';
import type { Stay, Guest } from '../../api/stays';
import { apartmentsApi } from '../../api/apartments';
import type { Apartment } from '../../api/apartments';
import { useAuth } from '../../contexts/AuthContext';
import { DateTimeSelector } from '../../components/DateTimeSelector';
import { DateSelector } from '../../components/DateSelector';
import { handleRutInput, cleanRut } from '../../utils/rut';
import { Modal } from '../../components/Modal';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
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

const categoryColors: Record<string, string> = {
  GUEST: 'bg-green-100 text-green-800',
  STAFF: 'bg-blue-100 text-blue-800',
};

export const PropietarioReservations = () => {
  const { user } = useAuth();
  const [stays, setStays] = useState<Stay[]>([]);
  const [myApartments, setMyApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStayId, setEditingStayId] = useState('');

  // Formulario de nueva reserva
  const [newStayData, setNewStayData] = useState({
    apartmentId: '',
    category: 'GUEST' as 'GUEST' | 'STAFF',
    scheduledCheckIn: '',
    scheduledCheckOut: '',
    guestFirstName: '',
    guestLastName: '',
    guestDocument: '',
    guests: [] as Guest[],
    notes: '',
  });

  // Helper to update Date+Time
  const updateDateTime = (
    date: Date | null,
    time: string,
    field: 'scheduledCheckIn' | 'scheduledCheckOut'
  ) => {
    if (!date) return;

    // Parse time
    const [hours, minutes] = time.split(':').map(Number);

    // Create new date preserving the day but setting time
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    setNewStayData(prev => ({
      ...prev,
      [field]: newDate.toISOString()
    }));
  };

  // Filtros
  const [filterApartment, setFilterApartment] = useState('');
  const [filterCheckInFrom, setFilterCheckInFrom] = useState<Date | null>(null);
  const [filterCheckInTo, setFilterCheckInTo] = useState<Date | null>(null);
  const [filterCheckOutFrom, setFilterCheckOutFrom] = useState<Date | null>(null);
  const [filterCheckOutTo, setFilterCheckOutTo] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staysRes, apartmentsRes] = await Promise.all([
        staysApi.getAll({ limit: 500 }),
        apartmentsApi.getAll({ limit: 100 }),
      ]);

      // Determinar si el usuario es propietario o responsable asignado
      const isOwner = user?.role === 'OWNER';
      const isManager = user?.role === 'ASSIGNED_MANAGER';

      // Filtrar departamentos según el rol
      const myApts = apartmentsRes.data.filter(apt => {
        if (isOwner) {
          return apt.owner?.id === user?.id;
        } else if (isManager) {
          return apt.manager?.id === user?.id;
        }
        return false;
      });
      setMyApartments(myApts);

      // Filtrar solo reservas de mis departamentos
      const myApartmentIds = myApts.map(apt => apt.id);
      const myStays = staysRes.data.filter(stay => myApartmentIds.includes(stay.apartment.id));

      setStays(myStays);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Filtrar reservas
  const filteredStays = useMemo(() => {
    return stays.filter(stay => {
      // Filtro por departamento
      if (filterApartment && !stay.apartment.number.toLowerCase().includes(filterApartment.toLowerCase())) {
        return false;
      }

      // Filtro por Check-In desde
      if (filterCheckInFrom) {
        const checkIn = new Date(stay.scheduledCheckIn);
        if (checkIn < filterCheckInFrom) return false;
      }

      // Filtro por Check-In hasta
      if (filterCheckInTo) {
        const checkIn = new Date(stay.scheduledCheckIn);
        // Set to end of day for inclusive comparison
        const to = new Date(filterCheckInTo);
        to.setHours(23, 59, 59, 999);
        if (checkIn > to) return false;
      }

      // Filtro por Check-Out desde
      if (filterCheckOutFrom) {
        const checkOut = new Date(stay.scheduledCheckOut);
        if (checkOut < filterCheckOutFrom) return false;
      }

      // Filtro por Check-Out hasta
      if (filterCheckOutTo) {
        const checkOut = new Date(stay.scheduledCheckOut);
        const to = new Date(filterCheckOutTo);
        to.setHours(23, 59, 59, 999);
        if (checkOut > to) return false;
      }

      // Filtro por estado
      if (filterStatus && stay.status !== filterStatus) {
        return false;
      }

      // Filtro por categoría
      if (filterCategory && stay.category !== filterCategory) {
        return false;
      }

      return true;
    })
      .sort((a, b) => {
        const dateA = new Date(a.scheduledCheckIn).getTime();
        const dateB = new Date(b.scheduledCheckIn).getTime();
        return dateB - dateA;
      });
  }, [stays, filterApartment, filterCheckInFrom, filterCheckInTo, filterCheckOutFrom, filterCheckOutTo, filterStatus, filterCategory]);

  const clearFilters = () => {
    setFilterApartment('');
    setFilterCheckInFrom(null);
    setFilterCheckInTo(null);
    setFilterCheckOutFrom(null);
    setFilterCheckOutTo(null);
    setFilterStatus('');
    setFilterCategory('');
  };

  const getTotalGuests = (stay: Stay) => {
    let count = (stay.guestFirstName || stay.guestLastName) ? 1 : 0;
    if (stay.guests && Array.isArray(stay.guests)) {
      count += stay.guests.length;
    }
    return count;
  };

  const handleSaveStay = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔵 handleSaveStay llamado', { newStayData, isEditing, editingStayId });

    // Validaciones básicas (solo si no es edición, o si se editan fechas/depto)
    // Para simplificar, validamos todo igual
    if (!newStayData.apartmentId || !newStayData.scheduledCheckIn || !newStayData.scheduledCheckOut) {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    // Validar fechas
    const checkIn = new Date(newStayData.scheduledCheckIn);
    const checkOut = new Date(newStayData.scheduledCheckOut);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      setFormError('Las fechas ingresadas no son válidas');
      return;
    }

    if (checkOut.getTime() <= checkIn.getTime()) {
      setFormError('La fecha y hora de check-out debe ser posterior a la fecha y hora de check-in');
      return;
    }

    // Validar datos de persona
    if ((newStayData.category === 'GUEST' || newStayData.category === 'STAFF') && !newStayData.guestFirstName && !newStayData.guestLastName) {
      const personType = newStayData.category === 'GUEST' ? 'huésped' : 'personal';
      setFormError(`Por favor ingresa al menos el nombre o apellido del ${personType} principal`);
      return;
    }

    try {
      setCreating(true);
      setFormError('');

      const stayData: any = {
        apartmentId: newStayData.apartmentId,
        category: newStayData.category,
        scheduledCheckIn: new Date(newStayData.scheduledCheckIn).toISOString(),
        scheduledCheckOut: new Date(newStayData.scheduledCheckOut).toISOString(),
        notes: newStayData.notes || undefined,
      };

      // Agregar datos de persona
      if (newStayData.category === 'GUEST' || newStayData.category === 'STAFF') {
        if (newStayData.guestFirstName) stayData.guestFirstName = newStayData.guestFirstName;
        if (newStayData.guestLastName) stayData.guestLastName = newStayData.guestLastName;
        if (newStayData.guestDocument) {
          stayData.guestDocument = cleanRut(newStayData.guestDocument);
        }
        if (newStayData.guests && newStayData.guests.length > 0) {
          stayData.guests = newStayData.guests.map(guest => ({
            ...guest,
            document: cleanRut(guest.document || '')
          }));
        }
      }

      if (isEditing) {
        console.log('📤 Actualizando reserva:', editingStayId, stayData);
        // Para update no enviamos apartmentId si no es necesario, pero la API lo ignora o lo usa
        // La API de update usa UpdateStayDto que omite apartmentId.
        // Quitamos apartmentId del objeto data para update
        const { apartmentId, ...updateData } = stayData;
        await staysApi.update(editingStayId, updateData);
        console.log('✅ Reserva actualizada exitosamente');
      } else {
        console.log('📤 Creando reserva:', stayData);
        await staysApi.create(stayData);
        console.log('✅ Reserva creada exitosamente');
      }

      setShowCreateModal(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      console.error('❌ Error al guardar reserva:', err);
      setFormError(err.response?.data?.message || 'Error al guardar la reserva');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewStayData({
      apartmentId: '',
      category: 'GUEST',
      scheduledCheckIn: '',
      scheduledCheckOut: '',
      guestFirstName: '',
      guestLastName: '',
      guestDocument: '',
      guests: [],
      notes: '',
    });
    setIsEditing(false);
    setEditingStayId('');
    setFormError('');
  };

  const addGuest = () => {
    setNewStayData({
      ...newStayData,
      guests: [...newStayData.guests, { firstName: '', lastName: '', document: '' }],
    });
  };

  const updateGuest = (index: number, field: keyof Guest, value: string) => {
    const updatedGuests = [...newStayData.guests];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setNewStayData({ ...newStayData, guests: updatedGuests });
  };

  const removeGuest = (index: number) => {
    setNewStayData({
      ...newStayData,
      guests: newStayData.guests.filter((_, i) => i !== index),
    });
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'ASSIGNED_MANAGER' ? 'Reservas de Departamentos Asignados' : 'Mis Reservas'}
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.role === 'ASSIGNED_MANAGER'
                  ? 'Consulta y gestiona las reservas de los departamentos que tienes a cargo'
                  : 'Consulta las reservas de tus departamentos'
                }
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>+</span> Nueva Reserva
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
              <button onClick={() => setError('')} className="float-right font-bold">×</button>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Filtros de búsqueda</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Departamento
                </label>
                <input
                  type="text"
                  value={filterApartment}
                  onChange={(e) => setFilterApartment(e.target.value)}
                  placeholder="Ej: 101, 202..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filtro Check-In desde */}
              {/* Filtro Check-In desde */}
              <div>
                <DateSelector
                  label="Check-In desde"
                  date={filterCheckInFrom}
                  onChange={setFilterCheckInFrom}
                  placeholder="Desde..."
                />
              </div>

              {/* Filtro Check-In hasta */}
              <div>
                <DateSelector
                  label="Check-In hasta"
                  date={filterCheckInTo}
                  onChange={setFilterCheckInTo}
                  placeholder="Hasta..."
                  minDate={filterCheckInFrom || undefined}
                />
              </div>

              {/* Filtro Check-Out desde */}
              <div>
                <DateSelector
                  label="Check-Out desde"
                  date={filterCheckOutFrom}
                  onChange={setFilterCheckOutFrom}
                  placeholder="Desde..."
                />
              </div>

              {/* Filtro Check-Out hasta */}
              <div>
                <DateSelector
                  label="Check-Out hasta"
                  date={filterCheckOutTo}
                  onChange={setFilterCheckOutTo}
                  placeholder="Hasta..."
                  minDate={filterCheckOutFrom || undefined}
                />
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="SCHEDULED">Programada</option>
                  <option value="CHECKED_IN">Check-In Realizado</option>
                  <option value="CHECKED_OUT">Check-Out Realizado</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </div>

              {/* Filtro por categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de entrada
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="GUEST">Huéspedes</option>
                  <option value="STAFF">Mantenimiento</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Mostrando {filteredStays.length} de {stays.length} reservas
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStays.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          No se encontraron reservas con los filtros aplicados
                        </td>
                      </tr>
                    ) : (
                      filteredStays.map((stay) => (
                        <tr key={stay.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">Depto {stay.apartment.number}</div>
                            <div className="text-sm text-gray-500">
                              {(typeof stay.apartment.building === 'object' ? stay.apartment.building?.name : stay.apartment.building) || 'Sin torre'} - Piso {stay.apartment.floor}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[stay.category]}`}>
                              {categoryLabels[stay.category]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(stay.category === 'GUEST' || stay.category === 'STAFF') && (stay.guestFirstName || stay.guestLastName) ? (
                              <div>
                                <div className="text-gray-900 font-medium">{getGuestFullName(stay)}</div>
                                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                  {getTotalGuests(stay)} {getTotalGuests(stay) === 1 ? 'persona' : 'personas'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(stay.scheduledCheckIn)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(stay.scheduledCheckOut)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[stay.status]}`}>
                              {statusLabels[stay.status] || stay.status}
                            </span>
                            {stay.isLocked && (
                              <span className="ml-2 text-yellow-600" title="Registro bloqueado">
                                🔒
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => setSelectedStay(stay)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              Ver más
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles (solo lectura) */}
      <Modal
        isOpen={!!selectedStay}
        onClose={() => setSelectedStay(null)}
        title="Detalles de la Reserva"
        width="max-w-2xl"
      >
        <div className="space-y-4 pr-2">
          {/* Tipo y estado */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[selectedStay?.category || 'GUEST']}`}>
              {categoryLabels[selectedStay?.category || 'GUEST']}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedStay?.status || 'SCHEDULED']}`}>
              {statusLabels[selectedStay?.status || 'SCHEDULED']}
            </span>
            {selectedStay?.isLocked && (
              <span className="text-yellow-600 text-sm">🔒 Registro bloqueado</span>
            )}
          </div>

          {/* Info del departamento */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Departamento</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Número:</span> <span className="font-medium">{selectedStay?.apartment.number}</span></div>
              <div><span className="text-gray-500">Torre:</span> <span className="font-medium">
                {(typeof selectedStay?.apartment.building === 'object' ? selectedStay?.apartment.building?.name : selectedStay?.apartment.building) || 'Sin torre'}
              </span></div>
              <div><span className="text-gray-500">Piso:</span> <span className="font-medium">{selectedStay?.apartment.floor}</span></div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Fechas</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Check-In programado:</div>
                <div className="font-medium text-green-700">{selectedStay && formatDate(selectedStay.scheduledCheckIn)}</div>
                {selectedStay?.actualCheckIn && (
                  <>
                    <div className="text-gray-500 mt-1">Check-In realizado:</div>
                    <div className="font-medium">{formatDate(selectedStay.actualCheckIn)}</div>
                  </>
                )}
              </div>
              <div>
                <div className="text-gray-500">Check-Out programado:</div>
                <div className="font-medium text-red-700">{selectedStay && formatDate(selectedStay.scheduledCheckOut)}</div>
                {selectedStay?.actualCheckOut && (
                  <>
                    <div className="text-gray-500 mt-1">Check-Out realizado:</div>
                    <div className="font-medium">{formatDate(selectedStay.actualCheckOut)}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Persona principal (para GUEST o STAFF) */}
          {(selectedStay?.category === 'GUEST' || selectedStay?.category === 'STAFF') && (selectedStay?.guestFirstName || selectedStay?.guestLastName) && (
            <div className={`p-4 rounded-lg ${selectedStay.category === 'GUEST' ? 'bg-green-50' : 'bg-blue-50'}`}>
              <h3 className="font-semibold text-gray-800 mb-2">
                {selectedStay.category === 'GUEST' ? 'Huésped Principal' : 'Personal Principal'}
              </h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-500">Nombre:</span>{' '}
                  <span className="font-medium">{selectedStay.guestFirstName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Apellido:</span>{' '}
                  <span className="font-medium">{selectedStay.guestLastName}</span>
                </div>
                {selectedStay.guestDocument && (
                  <div>
                    <span className="text-gray-500">RUT:</span>{' '}
                    <span className="font-medium font-mono">{selectedStay.guestDocument}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personas adicionales */}
          {selectedStay?.guests && Array.isArray(selectedStay.guests) && selectedStay.guests.length > 0 && (
            <div className={`p-4 rounded-lg ${selectedStay.category === 'GUEST' ? 'bg-purple-50' : 'bg-indigo-50'}`}>
              <h3 className="font-semibold text-gray-800 mb-2">
                {selectedStay.category === 'GUEST' ? 'Huéspedes Adicionales' : 'Personal Adicional'} ({selectedStay.guests.length})
              </h3>
              <div className="space-y-2">
                {selectedStay.guests.map((guest: Guest, idx: number) => (
                  <div key={idx} className={`p-3 rounded border text-sm ${selectedStay.category === 'GUEST' ? 'bg-white border-purple-200' : 'bg-white border-indigo-200'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{guest.firstName} {guest.lastName}</span>
                      </div>
                      {guest.document && (
                        <span className="text-gray-500 font-mono text-xs">{guest.document}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

        <div className="mt-6 flex justify-between pt-4 border-t flex-shrink-0">
          {!selectedStay?.isLocked && (() => {
            if (!selectedStay) return false;
            const checkIn = new Date(selectedStay.scheduledCheckIn);
            const now = new Date();
            // Calcular diferencia en milisegundos
            const diffMs = checkIn.getTime() - now.getTime();
            // 12 horas en milisegundos = 12 * 60 * 60 * 1000 = 43200000
            const hoursDiff = diffMs / (1000 * 60 * 60);

            // Permitir editar solo si faltan más de 12 horas para el check-in (y no es pasado)
            return hoursDiff > 12;
          })() && (
              <button
                onClick={() => {
                  if (selectedStay) {
                    // Pre-fill form
                    // Need to convert ISO dates to datetime-local format (YYYY-MM-DDTHH:mm)
                    const formatForInput = (dateStr: string) => {
                      const d = new Date(dateStr);
                      // Adjust for local timezone offset manually or just slice ISO string if backend returns UTC and we want to keep it simple?
                      // Actually, datetime-local expects local time.
                      // Let's use a small trick:
                      const pad = (n: number) => n < 10 ? '0' + n : n;
                      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                    };

                    setNewStayData({
                      apartmentId: selectedStay.apartment.id,
                      category: selectedStay.category,
                      scheduledCheckIn: formatForInput(selectedStay.scheduledCheckIn),
                      scheduledCheckOut: formatForInput(selectedStay.scheduledCheckOut),
                      guestFirstName: selectedStay.guestFirstName || '',
                      guestLastName: selectedStay.guestLastName || '',
                      guestDocument: selectedStay.guestDocument || '',
                      guests: selectedStay.guests || [],
                      notes: selectedStay.notes || '',
                    });
                    setEditingStayId(selectedStay.id);
                    setIsEditing(true);
                    setSelectedStay(null);
                    setShowCreateModal(true);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
              >
                <span>✏️</span> Editar Reserva
              </button>
            )}
          <div className="flex-1"></div>
          <button
            onClick={() => setSelectedStay(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </Modal>
      {/* Modal para crear/editar reserva */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={isEditing ? "Editar Reserva" : "Nueva Reserva"}
        width="max-w-2xl"
      >
        <form
          onSubmit={(e) => {
            console.log('🔵 Form onSubmit llamado');
            handleSaveStay(e);
          }}
          noValidate
        >
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {formError}
              <button
                type="button"
                onClick={() => setFormError('')}
                className="float-right font-bold hover:text-red-900"
              >
                ×
              </button>
            </div>
          )}
          <div className="space-y-4">
            {/* Departamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento *
              </label>
              <select
                required
                value={newStayData.apartmentId}
                onChange={(e) => setNewStayData({ ...newStayData, apartmentId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar departamento...</option>
                {myApartments.filter(apt => apt.isActive).map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.building?.name || 'Sin torre'} - Depto {apt.number} (Piso {apt.floor})
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de entrada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de entrada *
              </label>
              <select
                required
                value={newStayData.category}
                onChange={(e) => setNewStayData({ ...newStayData, category: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GUEST">Huésped</option>
                <option value="STAFF">Mantenimiento</option>
              </select>
            </div>

            {/* Fechas */}
            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <DateTimeSelector
                  label="Check-In *"
                  date={newStayData.scheduledCheckIn ? new Date(newStayData.scheduledCheckIn) : null}
                  time={newStayData.scheduledCheckIn ? new Date(newStayData.scheduledCheckIn).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '12:00'}
                  onChange={(date, time) => updateDateTime(date, time, 'scheduledCheckIn')}
                />
              </div>
              <div>
                <DateTimeSelector
                  label="Check-Out *"
                  date={newStayData.scheduledCheckOut ? new Date(newStayData.scheduledCheckOut) : null}
                  time={newStayData.scheduledCheckOut ? new Date(newStayData.scheduledCheckOut).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '12:00'}
                  onChange={(date, time) => updateDateTime(date, time, 'scheduledCheckOut')}
                  minDate={newStayData.scheduledCheckIn ? new Date(newStayData.scheduledCheckIn) : undefined}
                />
              </div>
            </div>

            {/* Datos de persona (si es categoría GUEST o STAFF) */}
            {(newStayData.category === 'GUEST' || newStayData.category === 'STAFF') && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    {newStayData.category === 'GUEST' ? 'Huésped Principal' : 'Personal Principal'}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={newStayData.guestFirstName}
                        onChange={(e) => setNewStayData({ ...newStayData, guestFirstName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={newStayData.category === 'GUEST' ? 'Nombre del huésped' : 'Nombre del personal'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={newStayData.guestLastName}
                        onChange={(e) => setNewStayData({ ...newStayData, guestLastName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={newStayData.category === 'GUEST' ? 'Apellido del huésped' : 'Apellido del personal'}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RUT
                    </label>
                    <input
                      type="text"
                      value={newStayData.guestDocument}
                      onChange={(e) => {
                        const formatted = handleRutInput(e.target.value, newStayData.guestDocument);
                        setNewStayData({ ...newStayData, guestDocument: formatted });
                      }}
                      onBlur={(e) => {
                        const cleaned = cleanRut(e.target.value);
                        if (cleaned) {
                          const formatted = handleRutInput(cleaned, '');
                          setNewStayData({ ...newStayData, guestDocument: formatted });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12.345.678-9"
                      maxLength={12}
                    />
                  </div>
                </div>

                {/* Personas adicionales */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800">
                      {newStayData.category === 'GUEST' ? 'Huéspedes Adicionales' : 'Personal Adicional'}
                    </h4>
                    <button
                      type="button"
                      onClick={addGuest}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Agregar {newStayData.category === 'GUEST' ? 'huésped' : 'personal'}
                    </button>
                  </div>
                  {newStayData.guests.map((guest, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {newStayData.category === 'GUEST' ? 'Huésped' : 'Personal'} {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeGuest(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={guest.firstName}
                          onChange={(e) => updateGuest(index, 'firstName', e.target.value)}
                          placeholder="Nombre"
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={guest.lastName}
                          onChange={(e) => updateGuest(index, 'lastName', e.target.value)}
                          placeholder="Apellido"
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={guest.document}
                          onChange={(e) => {
                            const formatted = handleRutInput(e.target.value, guest.document);
                            updateGuest(index, 'document', formatted);
                          }}
                          onBlur={(e) => {
                            const cleaned = cleanRut(e.target.value);
                            if (cleaned) {
                              const formatted = handleRutInput(cleaned, '');
                              updateGuest(index, 'document', formatted);
                            }
                          }}
                          placeholder="12.345.678-9"
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          maxLength={12}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={newStayData.notes}
                onChange={(e) => setNewStayData({ ...newStayData, notes: e.target.value })}
                rows={3}
                placeholder="Notas adicionales sobre la reserva (opcional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setNewStayData({
                  apartmentId: '',
                  category: 'GUEST',
                  scheduledCheckIn: '',
                  scheduledCheckOut: '',
                  guestFirstName: '',
                  guestLastName: '',
                  guestDocument: '',
                  guests: [],
                  notes: '',
                });
                setError('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              onClick={(e) => {
                console.log('🔵 Botón Crear Reserva clickeado', { creating, newStayData });
                // No prevenir el comportamiento por defecto, dejar que el formulario se envíe
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creando...' : 'Crear Reserva'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
