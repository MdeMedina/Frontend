import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import { staysApi, categoryLabels, getGuestFullName } from '../../api/stays';
import type { Stay, Guest } from '../../api/stays';
/* import { apartmentsApi } from '../../api/apartments';
import type { Apartment } from '../../api/apartments'; */
import { DateSelector } from '../../components/DateSelector';
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

export const AdminReservations = () => {
  const [stays, setStays] = useState<Stay[]>([]);
  /* const [apartments, setApartments] = useState<Apartment[]>([]); */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);

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
      const staysRes = await staysApi.getAll({ limit: 500 });
      setStays(staysRes.data);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Visualización de Reservas</h1>
            <p className="text-gray-600 mt-1">
              Consulta todas las reservas del sistema (solo lectura)
            </p>
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
                            {stay.category === 'GUEST' ? (
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
        <div className="space-y-4">
            {/* Tipo y estado */}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedStay && categoryColors[selectedStay.category]}`}>
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
                <div><span className="text-gray-500">Número:</span> <span className="font-medium">{selectedStay?.apartment.number}</span></div>
                <div><span className="text-gray-500">Edificio:</span> <span className="font-medium">
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

            {/* Huésped principal (solo para GUEST) */}
            {selectedStay?.category === 'GUEST' && (selectedStay.guestFirstName || selectedStay.guestLastName) && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Huésped Principal</h3>
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
                <h3 className="font-semibold text-gray-800 mb-2">Huéspedes Adicionales ({selectedStay.guests.length})</h3>
                <div className="space-y-2">
                  {selectedStay.guests.map((guest: Guest, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded border border-purple-200 text-sm">
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
