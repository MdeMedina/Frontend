import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { auditApi, actionLabels, actionColors, actionIcons, actionCategories } from '../../api/audit';
import { DateSelector } from '../../components/DateSelector';
import type { AuditLog, AuditQueryParams, AuditStats } from '../../api/audit';

/* const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}; */

const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Categorías para el filtro
const categoryOptions = [
  { value: '', label: 'Todas las acciones' },
  { value: 'petitions', label: '📝 Peticiones' },
  { value: 'users', label: '👤 Gestión de Usuarios' },
  { value: 'managers', label: '👔 Responsables' },
  { value: 'reservations', label: '📅 Reservas' },
  { value: 'checkInOut', label: '🟢 Check-In / Check-Out' },
  { value: 'apartments', label: '🏢 Departamentos' },
  { value: 'sessions', label: '🔑 Sesiones' },
];

export const AdminAuditLog = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [filterApartment, setFilterApartment] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params: AuditQueryParams = { page, limit: 30 };

      // Aplicar filtro por categoría
      if (filterCategory && actionCategories[filterCategory as keyof typeof actionCategories]) {
        // Si hay categoría, filtramos por la primera acción (el backend no soporta múltiples)
        // Esto es una limitación, se podría mejorar en el backend
      }

      if (filterStartDate) {
        // Construct ISO string for start of day
        // Use local year/month/day but set to T00:00:00
        const y = filterStartDate.getFullYear();
        const m = String(filterStartDate.getMonth() + 1).padStart(2, '0');
        const d = String(filterStartDate.getDate()).padStart(2, '0');
        params.startDate = `${y}-${m}-${d}T00:00:00`;
      }
      if (filterEndDate) {
        const y = filterEndDate.getFullYear();
        const m = String(filterEndDate.getMonth() + 1).padStart(2, '0');
        const d = String(filterEndDate.getDate()).padStart(2, '0');
        params.endDate = `${y}-${m}-${d}T23:59:59`;
      }

      if (filterSearch) params.search = filterSearch;
      if (filterUsername) params.username = filterUsername;
      if (filterApartment) params.apartment = filterApartment;

      const [logsRes, statsRes] = await Promise.all([
        auditApi.getHistory(params),
        auditApi.getStats(),
      ]);

      // Filtrar por categoría en el frontend si está activa
      let filteredLogs = logsRes.data;
      if (filterCategory && actionCategories[filterCategory as keyof typeof actionCategories]) {
        const allowedActions = actionCategories[filterCategory as keyof typeof actionCategories];
        filteredLogs = logsRes.data.filter(log => allowedActions.includes(log.action));
      }

      setLogs(filteredLogs);
      setTotalPages(logsRes.pagination.totalPages);
      setStats(statsRes);
      setError('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar los registros';
      setError(errorMessage);
      console.error('Error al cargar registros de auditoría:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce for text search
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, filterCategory, filterStartDate, filterEndDate, filterSearch, filterUsername, filterApartment]);

  const clearFilters = () => {
    setFilterCategory('');
    setFilterStartDate(null);
    setFilterEndDate(null);
    setFilterSearch('');
    setFilterUsername('');
    setFilterApartment('');
    setPage(1);
  };


  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Registros de Auditoría</h1>
            <p className="text-gray-600 mt-1">
              Historial detallado de todas las acciones importantes realizadas en el sistema
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
              <button onClick={() => setError('')} className="float-right font-bold">×</button>
            </div>
          )}

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
                <div className="text-3xl font-bold text-indigo-600">{stats.totalLogs}</div>
                <div className="text-gray-600 text-sm">Total de registros</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <div className="text-3xl font-bold text-green-600">{stats.todayLogs}</div>
                <div className="text-gray-600 text-sm">Acciones hoy</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.byAction.filter(a =>
                    ['PETITION_APPROVED', 'PETITION_REJECTED'].includes(a.action)
                  ).reduce((sum, a) => sum + a.count, 0)}
                </div>
                <div className="text-gray-600 text-sm">Peticiones procesadas</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.byAction.filter(a =>
                    ['CHECKIN_CONFIRMED', 'CHECKOUT_CONFIRMED'].includes(a.action)
                  ).reduce((sum, a) => sum + a.count, 0)}
                </div>
                <div className="text-gray-600 text-sm">Check-In/Out</div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Filtrar registros</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Palabra clave */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  placeholder="Nombre..."
                  value={filterUsername}
                  onChange={(e) => { setFilterUsername(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                />
              </div>

              {/* Palabra clave */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Palabra Clave
                </label>
                <input
                  type="text"
                  placeholder="Descripción..."
                  value={filterSearch}
                  onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                />
              </div>

              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  placeholder="Ej: 101"
                  value={filterApartment}
                  onChange={(e) => { setFilterApartment(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de acción
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <DateSelector
                  label="Desde"
                  date={filterStartDate}
                  onChange={(d) => { setFilterStartDate(d); setPage(1); }}
                  placeholder="Fecha inicio..."
                />
              </div>
              <div>
                <DateSelector
                  label="Hasta"
                  date={filterEndDate}
                  onChange={(d) => { setFilterEndDate(d); setPage(1); }}
                  placeholder="Fecha fin..."
                  minDate={filterStartDate || undefined}
                />
              </div>
            </div>
          </div>

          {/* Lista de Registros */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-2">No se encontraron registros con los filtros aplicados</p>
                <p className="text-sm text-gray-400">
                  {filterCategory || filterStartDate || filterEndDate || filterSearch || filterApartment
                    ? 'Intenta ajustar los filtros o limpiarlos para ver más registros.'
                    : 'Aún no hay registros de auditoría en el sistema.'}
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200">
                  {logs.filter((log, index, self) => {
                    // Si es un log de creación de petición
                    if (log.action === 'PETITION_CREATED') {
                      // Verificar si existe un log de aprobación o rechazo posterior (que aparecería antes en la lista ordenada por fecha desc)
                      // para la misma entidad (misma petición)
                      const hasReviewLog = self.some((otherLog, otherIndex) =>
                        otherIndex < index && // Aparece antes en la lista (es más reciente)
                        otherLog.entityType === 'Petition' &&
                        otherLog.entityId === log.entityId &&
                        (otherLog.action === 'PETITION_APPROVED' || otherLog.action === 'PETITION_REJECTED')
                      );
                      // Si existe un log de revisión, ocultamos el de creación para no duplicar visualmente la petición
                      if (hasReviewLog) return false;
                    }
                    return true;
                  }).map((log) => {
                    if (log.entityType === 'Petition') {
                      const details = log.details || {};
                      // Determine status and reviewer based on action
                      let status = 'PENDING';
                      let statusLabel = 'Pendiente';
                      let statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                      let reviewerName = '';
                      let reviewDate = '';

                      if (log.action === 'PETITION_APPROVED') {
                        status = 'APPROVED';
                        statusLabel = 'Aprobada';
                        statusColor = 'bg-green-100 text-green-800 border-green-300';
                        reviewerName = log.performedByName;
                        reviewDate = log.timestamp;
                      } else if (log.action === 'PETITION_REJECTED') {
                        status = 'REJECTED';
                        statusLabel = 'Rechazada';
                        statusColor = 'bg-red-100 text-red-800 border-red-300';
                        reviewerName = log.performedByName;
                        reviewDate = log.timestamp;
                      } else if (log.action === 'PETITION_CREATED') {
                        // If it's just created log, it might be pending or reviewed later.
                        // But audit log entries are immutable snapshots.
                        // So a CREATED log is always "Pending" relative to that moment?
                        // The user wants to see "Por revisar" if it's pending.
                        // We don't have the *current* status of the petition here, only the log snapshot.
                        // But typically PETITION_CREATED implies it starts as Pending.
                        status = 'PENDING';
                        statusLabel = 'Por revisar';
                        statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                      }

                      // Owner info
                      // Prefer 'ownerName' from details if available (real owner), fallback to targetUserName (requestedBy) or performedByName
                      const ownerName = details.ownerName;
                      const ownerEmail = details.ownerEmail || 'No disponible';

                      // Creator info (who made the request)
                      const creatorName = log.targetUserName || log.performedByName;

                      // Apartment info
                      const building = details.buildingName || 'N/A';
                      const apartment = details.apartmentNumber || 'N/A';
                      const parking = details.parkingNumber || 'N/A';

                      // Petition info
                      const petitionTitle = log.description.split('"')[1] || log.description; // Extract title from description if possible
                      const petitionDate = details.petitionCreatedAt ? formatShortDate(details.petitionCreatedAt) : formatShortDate(log.timestamp);


                      return (
                        <div key={log.id} className="p-4 hover:bg-gray-50 transition border-b border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Column: Petition Data */}
                            <div className="border rounded-lg p-3 bg-white shadow-sm">
                              <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Datos de petición</h3>
                              <div className="text-sm space-y-1">
                                {creatorName && creatorName !== ownerName && (
                                  <p><span className="font-medium text-gray-600">Solicitado por:</span> {creatorName}</p>
                                )}
                                {ownerName && (
                                  <p><span className="font-medium text-gray-600">Propietario:</span> {ownerName}</p>
                                )}
                                <p><span className="font-medium text-gray-600">Mail:</span> {ownerEmail}</p>
                                <p><span className="font-medium text-gray-600">Depto:</span> {apartment}</p>
                                <p><span className="font-medium text-gray-600">Torre:</span> {building}</p>
                                {parking !== 'N/A' && <p><span className="font-medium text-gray-600">Estacionamiento:</span> {parking}</p>}
                                <p><span className="font-medium text-gray-600">Petición:</span> {petitionTitle}</p>
                                <p><span className="font-medium text-gray-600">Fecha creación:</span> {petitionDate}</p>
                              </div>
                            </div>

                            {/* Right Column: Status/Admin Data */}
                            <div className="border rounded-lg p-3 bg-white shadow-sm flex flex-col justify-center items-center text-center">
                              <h3 className="font-semibold text-gray-700 mb-2 w-full border-b pb-1">Estado de revisión</h3>

                              <div className={`px-4 py-2 rounded-full border mb-3 ${statusColor} font-bold`}>
                                {statusLabel}
                              </div>

                              {status !== 'PENDING' ? (
                                <div className="text-sm">
                                  <p className="mb-1"><span className="font-medium text-gray-600">Revisado por:</span></p>
                                  <p className="font-semibold truncate max-w-[200px]">{reviewerName}</p>
                                  <p className="text-xs text-gray-500 mt-1">{formatShortDate(reviewDate)}</p>
                                  {details.adminNotes && (
                                    <div className="mt-2 text-xs italic text-gray-500 bg-gray-50 p-2 rounded border">
                                      "{details.adminNotes}"
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  Esta petición está pendiente de revisión por un administrador.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Default rendering for other logs
                    return (
                      <div key={log.id} className="p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* Tipo de acción y badge */}
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className={`px-3 py-1 text-sm rounded-full border ${actionColors[log.action]}`}>
                                <span className="mr-1">{actionIcons[log.action]}</span>
                                {actionLabels[log.action]}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatShortDate(log.timestamp)}
                              </span>
                            </div>

                            {/* Descripción principal */}
                            <p className="text-gray-800 text-lg mb-2">
                              {log.description}
                            </p>

                            {/* Detalles para carga masiva */}
                            {log.action === 'APARTMENT_BULK_IMPORT' && log.details?.stats && (
                              <div className="mt-2 text-sm bg-white p-2 rounded border border-slate-200 inline-block">
                                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  <li className="text-slate-600">
                                    Usuarios creados: <strong className="text-slate-900">{log.details.stats.ownersCreated}</strong>
                                  </li>
                                  <li className="text-slate-600">
                                    Usuarios actualizados: <strong className="text-slate-900">{log.details.stats.ownersUpdated}</strong>
                                  </li>
                                  <li className="text-slate-600">
                                    Deptos creados: <strong className="text-slate-900">{log.details.stats.apartmentsCreated}</strong>
                                  </li>
                                  <li className="text-slate-600">
                                    Deptos actualizados: <strong className="text-slate-900">{log.details.stats.apartmentsUpdated}</strong>
                                  </li>
                                </ul>
                              </div>
                            )}

                            {/* Quién realizó la acción */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold">
                                {log.performedByName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <span>
                                <span className="font-medium">{log.performedByName}</span>
                                <span className="text-gray-400 ml-1">({log.performedByRole})</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Paginación */}
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Nota informativa */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>¿Qué se registra aquí?</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Peticiones creadas por propietarios y sus aprobaciones/rechazos</li>
              <li>Creación, actualización y desactivación de usuarios</li>
              <li>Asignación y remoción de responsables de departamentos</li>
              <li>Creación y modificación de reservas</li>
              <li>Confirmaciones de check-in y check-out</li>
              <li>Inicios y cierres de sesión</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};
