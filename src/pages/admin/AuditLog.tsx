import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { auditApi, actionCategories } from '../../api/audit';
import type { AuditLog, AuditQueryParams, AuditStats } from '../../api/audit';
import { categoryOptions } from './audit.utils';
import { AuditStatCards, PetitionLogRow, StandardLogRow } from './components/AuditUI';
import { AuditFilters } from './components/AuditFilters';

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

      if (filterStartDate) {
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
      setError(err.response?.data?.message || err.message || 'Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white font-sans text-gray-900 animate-in fade-in duration-700">
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
          <div className="max-w-7xl mx-auto p-6 animate-in slide-in-from-bottom-6 duration-1000 delay-150 fill-mode-both">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Registros de Auditoría
              </h1>
              <p className="text-gray-600 mt-1">
                Bitácora de acciones y eventos del sistema
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-950 rounded-sm flex justify-between items-center shadow-lg shadow-red-500/5 animate-in slide-in-from-top-4 duration-300">
                <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  {error}
                </span>
                <button onClick={() => setError('')} className="font-black text-lg hover:text-red-700 transition-colors cursor-pointer p-2">×</button>
              </div>
            )}

            {/* Estadísticas */}
            {stats && <AuditStatCards stats={stats} />}

            {/* Filtros */}
            <AuditFilters
              username={filterUsername} setUsername={setFilterUsername}
              search={filterSearch} setSearch={setFilterSearch}
              apartment={filterApartment} setApartment={setFilterApartment}
              category={filterCategory} setCategory={setFilterCategory}
              startDate={filterStartDate} setStartDate={setFilterStartDate}
              endDate={filterEndDate} setEndDate={setFilterEndDate}
              clearFilters={clearFilters}
              categoryOptions={categoryOptions}
              setPage={setPage}
            />

            {/* Lista de Registros */}
            <div className="bg-white rounded-sm border-2 border-black/[0.08] overflow-hidden shadow-2xl shadow-black/[0.02] transition-all">
              {loading ? (
                <div className="flex flex-col justify-center items-center h-80 bg-gray-50/10">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-sm border-2 border-blue-600 animate-spin"></div>
                    <div className="absolute inset-0 h-12 w-12 rounded-sm border-2 border-gray-200 animate-ping opacity-20"></div>
                  </div>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300 animate-pulse">Sincronizando registros...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-24 text-center bg-gray-50/10 border-2 border-dashed border-black/[0.03] m-6 rounded-sm">
                  <span className="material-symbols-outlined text-[48px] text-gray-200 mb-4 animate-in zoom-in duration-500">search_off</span>
                  <p className="text-gray-400 font-bold uppercase text-[12px] tracking-[0.3em] mb-3">Sin Coincidencias</p>
                  <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                    No se localizaron registros bajo los parámetros actuales del protocolo.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y-2 divide-black/[0.04]">
                    {logs.filter((log, index, self) => {
                      if (log.action === 'PETITION_CREATED') {
                        const hasReviewLog = self.some((otherLog, otherIndex) =>
                          otherIndex < index && 
                          otherLog.entityType === 'Petition' &&
                          otherLog.entityId === log.entityId &&
                          (otherLog.action === 'PETITION_APPROVED' || otherLog.action === 'PETITION_REJECTED')
                        );
                        if (hasReviewLog) return false;
                      }
                      return true;
                    }).map((log, idx) => (
                      <div key={log.id} className="animate-in fade-in slide-in-from-left-2 duration-500 fill-mode-both" style={{ animationDelay: `${idx * 30}ms` }}>
                        {log.entityType === 'Petition' 
                          ? <PetitionLogRow log={log} />
                          : <StandardLogRow log={log} />
                        }
                      </div>
                    ))}
                  </div>

                  {/* Paginación */}
                  <div className="px-8 py-6 bg-gray-50/20 border-t-2 border-black/[0.04] flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                      Entrada <span className="text-gray-950 font-black bg-gray-200 px-2 py-0.5 rounded-sm mx-1">{page}</span> 
                      <span className="mx-2 opacity-30">/</span> 
                      Total <span className="text-gray-950 font-bold">{totalPages}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="group px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] border-2 border-black/[0.08] rounded-sm bg-white text-gray-700 hover:bg-black hover:text-white disabled:opacity-20 transition-all shadow-sm active:scale-95 flex items-center gap-2.5"
                      >
                        <span className="material-symbols-outlined text-[14px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Anterior
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="group px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] border-2 border-transparent rounded-sm bg-gray-950 text-white shadow-lg shadow-black/10 hover:bg-blue-600 disabled:opacity-20 transition-all active:scale-95 flex items-center gap-2.5"
                      >
                        Siguiente
                        <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Nota informativa */}
            <div className="mt-16 bg-gray-950 rounded-sm p-10 text-white shadow-2xl shadow-black/40 relative overflow-hidden border-t-4 border-blue-600">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 -mr-40 -mt-40 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                <span className="material-symbols-outlined text-[160px] font-black">verified_user</span>
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-500 mb-8 flex items-center gap-4">
                <span className="h-px w-10 bg-blue-600/40"></span>
                Protocolo de Auditoría y Control
                <span className="h-px flex-1 bg-white/5"></span>
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 relative z-10">
                {[
                  'Trazabilidad íntegra de peticiones y revisiones administrativas',
                  'Control estricto de ciclo de vida de usuarios y privilegios',
                  'Gestión auditada de responsables y activos del edificio',
                  'Seguimiento en tiempo real de reservas y flujos de estancia',
                  'Logs de seguridad avanzada e inicios de sesión críticos',
                  'Registro de importaciones masivas y cambios estructurales'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-[13px] text-gray-400 font-medium leading-relaxed group cursor-default">
                    <span className="text-blue-500 font-bold mt-1 group-hover:translate-x-1 transition-transform duration-300">/</span>
                    <span className="group-hover:text-white transition-colors duration-300">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center opacity-20 grayscale">
                <span className="text-[8px] font-bold uppercase tracking-[0.4em]">SYSTEM_VERSION_4.2.0</span>
                <span className="text-[8px] font-bold uppercase tracking-[0.4em]">ENCRYPTION_AES_256</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
