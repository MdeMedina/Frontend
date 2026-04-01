import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { staysApi } from '../../api/stays';
import type { Stay, Guest } from '../../api/stays';
import { apartmentsApi } from '../../api/apartments';
import type { Apartment } from '../../api/apartments';
import { useAuth } from '../../contexts/AuthContext';
import { DateTimeSelector } from '../../components/DateTimeSelector';
import { handleRutInput, cleanRut } from '../../utils/rut';
import { Modal } from '../../components/Modal';
import { ReservationFilters } from '../../components/reservations/ReservationFilters';
import { ReservationTableRow } from '../../components/reservations/ReservationTableRow';
import { ReservationDetailsModal } from '../../components/reservations/ReservationDetailsModal';
import { useReservationFilters } from '../../hooks/useReservationFilters';

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

  // Hook de filtrado compartido
  const { filters, filteredStays, clearFilters, totalCount, filteredCount } = useReservationFilters(stays);

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
    const [hours, minutes] = time.split(':').map(Number);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staysRes, apartmentsRes] = await Promise.all([
        staysApi.getAll({ limit: 500 }),
        apartmentsApi.getAll({ limit: 100 }),
      ]);

      const isOwner = user?.role === 'OWNER';
      const isManager = user?.role === 'ASSIGNED_MANAGER';

      const myApts = apartmentsRes.data.filter(apt => {
        if (isOwner) return apt.owner?.id === user?.id;
        if (isManager) return apt.manager?.id === user?.id;
        return false;
      });
      setMyApartments(myApts);

      const myApartmentIds = myApts.map(apt => apt.id);
      const myStays = staysRes.data.filter(stay => myApartmentIds.includes(stay.apartment.id));
      setStays(myStays);
    } catch (err) {
      setError('Error al sincronizar datos de reservas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleSaveStay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStayData.apartmentId || !newStayData.scheduledCheckIn || !newStayData.scheduledCheckOut) {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    const checkIn = new Date(newStayData.scheduledCheckIn);
    const checkOut = new Date(newStayData.scheduledCheckOut);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      setFormError('Las fechas ingresadas no son válidas');
      return;
    }

    if (checkOut.getTime() <= checkIn.getTime()) {
      setFormError('La fecha de salida debe ser posterior a la de entrada');
      return;
    }

    if ((newStayData.category === 'GUEST' || newStayData.category === 'STAFF') && !newStayData.guestFirstName && !newStayData.guestLastName) {
      const personType = newStayData.category === 'GUEST' ? 'huésped' : 'personal';
      setFormError(`Ingresa al menos el nombre o apellido del ${personType} principal`);
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

      if (newStayData.category === 'GUEST' || newStayData.category === 'STAFF') {
        if (newStayData.guestFirstName) stayData.guestFirstName = newStayData.guestFirstName;
        if (newStayData.guestLastName) stayData.guestLastName = newStayData.guestLastName;
        if (newStayData.guestDocument) stayData.guestDocument = cleanRut(newStayData.guestDocument);
        if (newStayData.guests?.length > 0) {
          stayData.guests = newStayData.guests.map(guest => ({
            ...guest,
            document: cleanRut(guest.document || '')
          }));
        }
      }

      if (isEditing) {
        const { apartmentId, ...updateData } = stayData;
        await staysApi.update(editingStayId, updateData);
      } else {
        await staysApi.create(stayData);
      }

      setShowCreateModal(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
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
  };  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Quirúrgico - Botón alineado a la derecha sin título general */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-[#001640] text-white px-8 py-3 rounded-xl hover:bg-[#002b7a] active:scale-[0.97] transition-all flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest shadow-[var(--shadow-surgical)] border border-[#001640]/20"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              EMITIR NUEVO REGISTRO
            </button>
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
            <div className="bg-white rounded-xl overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-surgical)] animate-in fade-in duration-700">
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

      {/* Portal de Detalles (Compartido) */}
      <Modal
        isOpen={!!selectedStay}
        onClose={() => setSelectedStay(null)}
        title="Expediente Operativo"
        width="max-w-2xl"
      >
        <ReservationDetailsModal 
          stay={selectedStay} 
          onClose={() => setSelectedStay(null)}
          extraActions={selectedStay && !selectedStay.isLocked && (new Date(selectedStay.scheduledCheckIn).getTime() - Date.now()) / (1000 * 60 * 60) > 12 && (
              <button
                onClick={() => {
                  setEditingStayId(selectedStay.id);
                  setIsEditing(true);
                  setNewStayData({
                    apartmentId: selectedStay.apartment.id,
                    category: selectedStay.category,
                    scheduledCheckIn: selectedStay.scheduledCheckIn,
                    scheduledCheckOut: selectedStay.scheduledCheckOut,
                    guestFirstName: selectedStay.guestFirstName || '',
                    guestLastName: selectedStay.guestLastName || '',
                    guestDocument: selectedStay.guestDocument || '',
                    guests: selectedStay.guests || [],
                    notes: selectedStay.notes || '',
                  });
                  setShowCreateModal(true);
                  setSelectedStay(null);
                }}
                className="px-6 py-2.5 bg-amber-500 text-white rounded-sm hover:bg-amber-600 transition-all text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                Modificar Registro
              </button>
          )}
        />
      </Modal>

      {/* Formulario de Registro Quirúrgico (Creación/Edición) */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={isEditing ? 'RECTIFICACIÓN DE REGISTRO' : 'APERTURA DE REGISTRO OPERATIVO'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveStay}>
          {formError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-lg">warning</span>
              {formError}
            </div>
          )}

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 font-mono">
                  Unidad de Destino *
                </label>
                <select
                  required
                  disabled={isEditing}
                  value={newStayData.apartmentId}
                  onChange={(e) => setNewStayData({ ...newStayData, apartmentId: e.target.value })}
                  className="w-full border border-black/[0.08] rounded-sm px-3 py-2.5 text-[13px] focus:border-black/30 outline-none transition-all disabled:bg-gray-50/50 font-medium bg-gray-50/30"
                >
                  <option value="">Seleccionar unidad...</option>
                  {myApartments.map(apt => (
                    <option key={apt.id} value={apt.id}>
                      DEPTO {apt.number} — {(typeof apt.building === 'object' ? apt.building?.name : apt.building) || 'S/T'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 font-mono">
                  Protocolo de Acceso *
                </label>
                <select
                  required
                  value={newStayData.category}
                  onChange={(e) => setNewStayData({ ...newStayData, category: e.target.value as 'GUEST' | 'STAFF' })}
                  className="w-full border border-black/[0.08] rounded-sm px-3 py-2.5 text-[13px] focus:border-black/30 outline-none transition-all font-medium bg-gray-50/30"
                >
                  <option value="GUEST">HUÉSPED / ARRENDATARIO</option>
                  <option value="STAFF">PERSONAL TÉCNICO / MANTENIMIENTO</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-5 rounded-sm border border-black/[0.03]">
              <DateTimeSelector
                label="Check-In (Programado) *"
                date={newStayData.scheduledCheckIn ? new Date(newStayData.scheduledCheckIn) : null}
                time={newStayData.scheduledCheckIn ? new Date(newStayData.scheduledCheckIn).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '15:00'}
                onChange={(date, time) => updateDateTime(date, time, 'scheduledCheckIn')}
              />
              <DateTimeSelector
                label="Check-Out (Programado) *"
                date={newStayData.scheduledCheckOut ? new Date(newStayData.scheduledCheckOut) : null}
                time={newStayData.scheduledCheckOut ? new Date(newStayData.scheduledCheckOut).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '11:00'}
                onChange={(date, time) => updateDateTime(date, time, 'scheduledCheckOut')}
                minDate={newStayData.scheduledCheckIn ? new Date(newStayData.scheduledCheckIn) : undefined}
              />
            </div>

            <div className="border-t border-black/[0.03] pt-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">badge</span>
                  {newStayData.category === 'GUEST' ? 'Identificación Huéspedes' : 'Identificación Personal'}
                </h4>
                <button
                  type="button"
                  onClick={addGuest}
                  className="text-[9px] font-bold text-primary hover:text-primary-dark uppercase tracking-[0.2em] flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-base">group_add</span>
                  Acompañante Extra
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 font-mono">Nombre Principal</label>
                  <input
                    type="text"
                    value={newStayData.guestFirstName}
                    onChange={(e) => setNewStayData({ ...newStayData, guestFirstName: e.target.value })}
                    className="w-full border-b border-black/[0.1] py-2 text-[13px] focus:border-black outline-none transition-all bg-transparent placeholder:text-gray-200"
                    placeholder="CARGANDO NOMBRE..."
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 font-mono">Apellido Principal</label>
                  <input
                    type="text"
                    value={newStayData.guestLastName}
                    onChange={(e) => setNewStayData({ ...newStayData, guestLastName: e.target.value })}
                    className="w-full border-b border-black/[0.1] py-2 text-[13px] focus:border-black outline-none transition-all bg-transparent placeholder:text-gray-200"
                    placeholder="CARGANDO APELLIDO..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 font-mono">Cédula / Pasaporte</label>
                <input
                  type="text"
                  value={newStayData.guestDocument}
                  onChange={(e) => setNewStayData({ ...newStayData, guestDocument: handleRutInput(e.target.value) })}
                  className="w-full border-b border-black/[0.1] py-2 text-[13px] font-mono focus:border-black outline-none transition-all bg-transparent tracking-[0.2em] placeholder:text-gray-200"
                  placeholder="XX.XXX.XXX-X"
                />
              </div>

              {newStayData.guests.length > 0 && (
                <div className="mt-10 space-y-4">
                  {newStayData.guests.map((guest, index) => (
                    <div key={index} className="bg-gray-50/50 p-5 rounded-sm border border-black/[0.03] animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex justify-between items-center mb-5">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] font-mono flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                          Acompañante Adicional {String(index + 1).padStart(2, '0')}
                        </span>
                        <button type="button" onClick={() => removeGuest(index)} className="text-rose-400 hover:text-rose-600 transition-colors">
                          <span className="material-symbols-outlined text-lg">remove_circle_outline</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <input
                          type="text"
                          value={guest.firstName}
                          onChange={(e) => updateGuest(index, 'firstName', e.target.value)}
                          placeholder="NOMBRE"
                          className="border-b border-black/[0.05] bg-transparent py-1.5 text-[11px] outline-none focus:border-black/40 font-medium placeholder:text-gray-200"
                        />
                        <input
                          type="text"
                          value={guest.lastName}
                          onChange={(e) => updateGuest(index, 'lastName', e.target.value)}
                          placeholder="APELLIDO"
                          className="border-b border-black/[0.05] bg-transparent py-1.5 text-[11px] outline-none focus:border-black/40 font-medium placeholder:text-gray-200"
                        />
                        <input
                          type="text"
                          value={guest.document}
                          onChange={(e) => updateGuest(index, 'document', handleRutInput(e.target.value))}
                          placeholder="DOCUMENTO"
                          className="border-b border-black/[0.05] bg-transparent py-1.5 text-[11px] font-mono outline-none focus:border-black/40 tracking-wider placeholder:text-gray-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-black/[0.03] pt-8">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 font-mono">
                Observaciones Logísticas / Conserjería
              </label>
              <textarea
                value={newStayData.notes}
                onChange={(e) => setNewStayData({ ...newStayData, notes: e.target.value })}
                rows={3}
                placeholder="Indicar detalles críticos para el personal de acceso (ej: entrega de llaves, estacionamiento)..."
                className="w-full border border-black/[0.08] rounded-sm px-4 py-3 text-[12px] focus:border-black/30 outline-none transition-all resize-none bg-gray-50/30 font-medium placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-4 border border-black/[0.08] text-[9px] font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-gray-50 transition-all font-mono"
            >
              Abortar Operación
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-2 px-8 py-4 bg-gray-900 text-white text-[9px] font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-black transition-all disabled:opacity-50 shadow-xl shadow-black/10 font-mono"
            >
              {creating ? 'Procesando...' : isEditing ? 'Confirmar Rectificación' : 'Sincronizar Registro'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
