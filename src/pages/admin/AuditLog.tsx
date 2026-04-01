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

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-950 rounded-sm flex justify-between items-center shadow-lg shadow-red-500/5 animate-in slide-in-from-top-4 duration-300">
                <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  {error}
                </span>
                <button onClick={() => setError('')} className="font-black text-lg hover:text-red-700 transition-colors cursor-pointer p-2">×</button>
              </div>
            )}


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
            <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow-surgical)] transition-all">
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
                  <div className="px-8 py-6 bg-gray-50/20 border-t border-black/5 flex items-center justify-between">
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
          </div>
        </div>
      </div>
    </Layout>
  );
};
