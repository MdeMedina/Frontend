import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { staysApi } from '../../api/stays';
import type { Stay } from '../../api/stays';
import { Modal } from '../../components/Modal';
import { ReservationFilters } from '../../components/reservations/ReservationFilters';
import { ReservationTableRow } from '../../components/reservations/ReservationTableRow';
import { ReservationDetailsModal } from '../../components/reservations/ReservationDetailsModal';
import { useReservationFilters } from '../../hooks/useReservationFilters';

export const AdminReservations = () => {
  const { currentBuilding } = useAuth();
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);

  const { filters, filteredStays, clearFilters, totalCount, filteredCount } = useReservationFilters(stays);

  const fetchData = async () => {
    try {
      setLoading(true);
      const staysRes = await staysApi.getAll({
        limit: 500,
        ...(currentBuilding?.id ? { buildingId: currentBuilding.id } : {})
      });
      setStays(staysRes.data);
    } catch (err) {
      setError('Error al cargar las reservas del sistema');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentBuilding?.id]);

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">

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

          {/* Filtros Destilados */}
          <ReservationFilters
            filters={filters}
            clearFilters={clearFilters}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />

          {loading ? (
            <div className="flex flex-col justify-center items-center h-80 gap-4 bg-white/50 rounded-xl border border-black/[0.03]">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-primary/10"></div>
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider animate-pulse">Sincronizando Terminal...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl overflow-hidden border border-black/[0.05] shadow-[var(--shadow-surgical)] animate-in fade-in duration-700">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-black/[0.05]">
                  <thead className="bg-[#001640]">
                    <tr>
                      <th className="px-4 py-4 text-left text-[10px] font-bold text-white uppercase tracking-wider font-mono">Unidad</th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold text-white uppercase tracking-wider font-mono">Categoría</th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold text-white uppercase tracking-wider font-mono">Titular / Pax</th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold text-white uppercase tracking-wider font-mono">Check-In</th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold text-white uppercase tracking-wider font-mono">Check-Out</th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold text-white uppercase tracking-wider font-mono">Estado</th>
                      <th className="px-4 py-4 text-right text-[10px] font-bold text-white uppercase tracking-wider font-mono">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-black/[0.02]">
                    {filteredStays.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-40">
                            <span className="material-symbols-outlined text-5xl">database_off</span>
                            <p className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.3em]">
                              Sin Registros en Terminal
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStays.map((stay) => (
                        <ReservationTableRow
                          key={stay.id}
                          stay={stay}
                          onDetail={setSelectedStay}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portal de Detalles (Extraído) */}
      <Modal
        isOpen={!!selectedStay}
        onClose={() => setSelectedStay(null)}
        title="Expediente de Reserva"
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
