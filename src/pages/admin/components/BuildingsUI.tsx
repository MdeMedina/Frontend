import React from 'react';
import type { Building } from '../../../api/buildings';

interface BuildingHeaderProps {
  onAdd: () => void;
}

export const BuildingHeader = ({ onAdd }: BuildingHeaderProps) => (
  <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
    <div className="space-y-1">
      <div className="flex items-center gap-3 text-blue-600 mb-2">
        <span className="h-px w-8 bg-blue-600/40"></span>
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Infraestructura de Residencia</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-950 leading-none">
        Torres de la Residencia
      </h1>
      <p className="text-[14px] font-medium text-gray-500 max-w-2xl pt-1">
        Gestión y monitoreo de las unidades verticales de vivienda y su capacidad operativa.
      </p>
    </div>
    <button
      onClick={onAdd}
      className="bg-gray-950 text-white px-8 py-3 rounded-sm font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center gap-3 shadow-2xl shadow-black/20 hover:bg-blue-600 active:scale-95 group"
    >
      <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform duration-500">add</span>
      Nueva Torre
    </button>
  </div>
);

interface BuildingTableProps {
  buildings: Building[];
  canDelete: boolean;
  onView: (b: Building) => void;
  onEdit: (b: Building) => void;
  onImport: (b: Building) => void;
  onToggleActive: (b: Building) => void;
  onDelete: (b: Building) => void;
}

export const BuildingTable = ({ 
  buildings, canDelete, onView, onEdit, onImport, onToggleActive, onDelete 
}: BuildingTableProps) => (
  <div className="bg-white border-2 border-black/[0.08] rounded-sm overflow-hidden shadow-2xl shadow-black/[0.02] animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
    <table className="min-w-full divide-y divide-black/[0.06]">
      <thead className="bg-gray-50/50">
        <tr>
          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Protocolo / Torre</th>
          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Unidades</th>
          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Estado</th>
          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Acciones de Terminal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black/[0.04]">
        {buildings.map((building, idx) => (
          <tr 
            key={building.id} 
            className={`group hover:bg-gray-50/50 transition-colors ${!building.isActive ? 'opacity-60 bg-gray-50/20' : ''}`}
          >
            <td className="px-8 py-5 whitespace-nowrap">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-sm flex items-center justify-center border-2 transition-all duration-500 ${building.isActive ? 'bg-gray-950 text-white border-transparent' : 'bg-white text-gray-400 border-black/[0.08]'}`}>
                  <span className="material-symbols-outlined text-[20px]">domain</span>
                </div>
                <div>
                  <div className="text-[14px] font-black text-gray-950 uppercase tracking-tight">{building.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {building.id.slice(0, 8)}</div>
                </div>
              </div>
            </td>
            <td className="px-8 py-5 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-950">{building.apartmentsCount || 0}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">deptos</span>
              </div>
            </td>
            <td className="px-8 py-5 whitespace-nowrap">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-sm border-2 text-[10px] font-black uppercase tracking-widest ${building.isActive ? 'bg-blue-50 border-blue-600/10 text-blue-600' : 'bg-gray-50 border-black/[0.08] text-gray-400'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${building.isActive ? 'bg-blue-600 animate-pulse' : 'bg-gray-400'}`}></span>
                {building.isActive ? 'Activo' : 'Offline'}
              </div>
            </td>
            <td className="px-8 py-5 whitespace-nowrap text-right text-[11px] font-black">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => onView(building)}
                  className="px-3 py-1.5 border border-black/[0.1] hover:border-black rounded-sm uppercase tracking-widest hover:bg-gray-950 hover:text-white transition-all active:scale-95"
                >
                  Vista
                </button>
                <button
                  onClick={() => onEdit(building)}
                  className="px-3 py-1.5 border border-black/[0.1] hover:border-black rounded-sm uppercase tracking-widest hover:bg-gray-950 hover:text-white transition-all active:scale-95"
                >
                  Edit
                </button>
                <button
                  onClick={() => onImport(building)}
                  className="px-3 py-1.5 border border-black/[0.1] hover:border-black rounded-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  Load
                </button>
                <button
                  onClick={() => onToggleActive(building)}
                  className={`px-3 py-1.5 border rounded-sm uppercase tracking-widest transition-all active:scale-95 ${building.isActive ? 'border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white' : 'border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                >
                  {building.isActive ? 'Lock' : 'Unlk'}
                </button>
                {building.apartmentsCount === 0 && canDelete && (
                  <button
                    onClick={() => onDelete(building)}
                    className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-sm uppercase tracking-widest transition-all active:scale-95"
                  >
                    Del
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const EmptyBuildingsState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="bg-white border-2 border-black/[0.08] rounded-sm p-24 text-center animate-in zoom-in duration-700 shadow-2xl shadow-black/[0.02]">
    <div className="h-20 w-20 bg-gray-50 rounded-sm flex items-center justify-center mx-auto mb-8 border-2 border-black/[0.03]">
      <span className="material-symbols-outlined text-[48px] text-gray-200">domain_disabled</span>
    </div>
    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 leading-none">Status: Zero_Towers_Detected</h3>
    <h2 className="text-2xl font-black text-gray-950 tracking-tighter uppercase mb-6">No hay torres registradas</h2>
    <p className="text-[14px] font-medium text-gray-500 max-w-sm mx-auto mb-10">Inicie la estructura física de la residencia creando la primera torre maestra.</p>
    <button
      onClick={onCreate}
      className="bg-gray-950 text-white px-10 py-4 rounded-sm font-black uppercase tracking-[0.2em] text-[12px] transition-all flex items-center gap-3 mx-auto shadow-2xl shadow-black/20 hover:bg-blue-600 active:scale-95"
    >
      <span className="material-symbols-outlined text-[20px]">add</span>
      Ejecutar Creación de Torre
    </button>
  </div>
);
