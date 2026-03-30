import React from 'react';
import type { Apartment, PendingApartmentPetition } from '../apartments.types';

interface ApartmentsHeaderProps {
  isManager: boolean;
}

export const ApartmentsHeader = ({ isManager }: ApartmentsHeaderProps) => (
  <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
    <div className="space-y-1">
      <div className="flex items-center gap-3 text-blue-600 mb-2">
        <span className="h-px w-8 bg-blue-600/40"></span>
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Activos Habitacionales</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-950 leading-none">
        {isManager ? 'Departamentos Asignados' : 'Mis Departamentos'}
      </h1>
      <p className="text-[14px] font-medium text-gray-500 max-w-2xl pt-1">
        {isManager
          ? 'Control operativo de unidades bajo su responsabilidad administrativa.'
          : 'Monitoreo de propiedad y gestión de protocolos de convivencia.'}
      </p>
    </div>
  </div>
);

export const PendingPetitionsProtocol = ({ petitions }: { petitions: PendingApartmentPetition[] }) => (
  <div className="mb-10 bg-gray-950 rounded-sm p-8 text-white shadow-2xl shadow-black/40 border-l-[6px] border-l-blue-600 animate-in slide-in-from-right-8 duration-700">
    <div className="flex items-center gap-4 mb-8">
      <span className="material-symbols-outlined text-blue-500 text-[24px] animate-pulse">pending_actions</span>
      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-400">Peticiones en Tránsito de Auditoría ({petitions.length})</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {petitions.map((petition) => (
        <div key={petition.id} className="bg-white/5 border border-white/10 rounded-sm p-5 hover:bg-white/10 transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[12px] font-bold text-white group-hover:text-blue-400 transition-colors leading-tight uppercase tracking-tight">
              {petition.title}
            </span>
            <span className="text-[9px] font-black bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-sm tracking-widest uppercase">Pendiente</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]">event</span>
            {new Date(petition.createdAt).toLocaleDateString('es-ES')}
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface ApartmentCardProps {
  apartment: Apartment;
  isManager: boolean;
  onEdit: (a: Apartment) => void;
  onAssignManager: (a: Apartment) => void;
  onRemoveManager: (a: Apartment) => void;
}

export const ApartmentCard = ({ 
  apartment, isManager, onEdit, onAssignManager, onRemoveManager 
}: ApartmentCardProps) => (
  <div className={`bg-white border-2 rounded-sm overflow-hidden transition-all duration-500 hover:shadow-2xl hover:translate-y-[-4px] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-6 fill-mode-both border-l-[6px] ${apartment.isActive ? 'border-2 border-black/[0.08] border-l-black group hover:border-l-blue-600' : 'border-black/[0.04] border-l-gray-400 opacity-60'}`}>
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-[18px] font-bold text-gray-950 uppercase tracking-tight leading-none mb-2">
            Depto {apartment.number}
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            <span className="material-symbols-outlined text-[16px]">domain</span>
            {apartment.building?.name || 'Protocolo_00'} • Piso {apartment.floor}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-sm border-2 text-[10px] font-black uppercase tracking-widest ${apartment.isActive ? 'bg-blue-50 border-blue-600/10 text-blue-600' : 'bg-gray-50 border-black/[0.08] text-gray-400'}`}>
          {apartment.isActive ? 'Activo' : 'Offline'}
        </div>
      </div>

      {apartment.description && (
        <p className="text-[13px] font-medium text-gray-600 leading-relaxed mb-8 italic border-l-2 border-black/[0.05] pl-4">
          "{apartment.description}"
        </p>
      )}

      {/* Parking Protocol */}
      <div className="space-y-3 mb-10">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] block mb-2">Protocolo Estacionarios</label>
        {apartment.parkingNumber && (!apartment.sourceAssignments || apartment.sourceAssignments.length === 0) && (
          <div className="flex items-center gap-3 text-[13px] font-bold text-gray-950 bg-gray-50 p-3 border border-black/[0.03] rounded-sm">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">local_parking</span>
            <span>Unidad: {apartment.parkingNumber}</span>
          </div>
        )}

        {apartment.sourceAssignments && apartment.sourceAssignments.length > 0 && (
          <div className="bg-gray-950 border-l-4 border-blue-600 rounded-sm p-4 text-white">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              Activo Prestado
            </div>
            <p className="text-[12px] font-medium leading-tight">
              Prestado a Depto {apartment.sourceAssignments[0].targetApartment.number}
            </p>
          </div>
        )}

        {apartment.targetAssignments && apartment.targetAssignments.length > 0 && (
          <div className="bg-blue-600 border-l-4 border-gray-950 rounded-sm p-4 text-white">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Activo Recibido
            </div>
            <p className="text-[12px] font-medium leading-tight">
              Desde Depto {apartment.targetAssignments[0].sourceApartment.number}
            </p>
          </div>
        )}
      </div>

      {/* Manager Protocol */}
      <div className="border-t-2 border-black/[0.06] pt-8">
        <div className="flex items-center justify-between mb-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Responsable</label>
          <span className="h-px flex-1 bg-black/[0.06] ml-4"></span>
        </div>
        {apartment.manager ? (
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-sm bg-gray-950 flex items-center justify-center text-white font-black text-sm border border-white/10">
              {apartment.manager.firstName[0]}{apartment.manager.lastName[0]}
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-950 uppercase tracking-tight">
                {apartment.manager.firstName} {apartment.manager.lastName}
              </p>
              <p className="text-[10px] font-bold text-blue-600 opacity-60 uppercase">{apartment.manager.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-300 italic py-2">
             <span className="material-symbols-outlined text-[20px]">person_off</span>
             <span className="text-[12px] font-medium uppercase tracking-widest">Sin asignar</span>
          </div>
        )}
      </div>

      {!isManager && (
        <div className="mt-10 flex flex-col gap-3">
          <button
            onClick={() => onEdit(apartment)}
            disabled={!apartment.isActive}
            className="w-full px-4 py-3 border-2 border-black rounded-sm text-gray-950 font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-30"
          >
            Modificar Estacionamiento
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => onAssignManager(apartment)}
              disabled={!apartment.isActive}
              className="flex-1 px-4 py-3 bg-gray-950 text-white rounded-sm font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl shadow-black/10"
            >
              <span className="material-symbols-outlined text-[18px]">{apartment.manager ? 'edit' : 'person_add'}</span>
              {apartment.manager ? 'Cambiar Responsable' : 'Asignar Responsable'}
            </button>
            {apartment.manager && (
              <button
                onClick={() => onRemoveManager(apartment)}
                disabled={!apartment.isActive}
                className="px-4 py-3 border-2 border-orange-500 text-orange-600 rounded-sm font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-orange-50 active:scale-95 disabled:opacity-30"
              >
                Remover
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
