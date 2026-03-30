import React from 'react';
import type { DashboardMenuItem } from '../dashboard.utils';

interface DashboardHeaderProps {
  title: string;
  userName: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, userName }) => (
  <div className="mb-10 flex justify-between items-end animate-in slide-in-from-top-4 duration-1000">
    <div className="space-y-1">
      <h1 className="text-3xl font-bold text-gray-950 leading-none">
        {title}
      </h1>
      <p className="text-[14px] font-medium text-gray-500">
        Bienvenido al centro de operaciones, <span className="font-bold text-gray-950">{userName}</span>
      </p>
    </div>
    <div className="hidden md:flex bg-gray-950 text-white px-5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.25em] shadow-2xl shadow-black/20 items-center gap-3 border border-white/5">
      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
      Terminal_Activa_SPS
    </div>
  </div>
);

interface DashboardCardProps {
  item: DashboardMenuItem;
  idx: number;
  onClick: (path: string) => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ item, idx, onClick }) => (
  <div
    onClick={() => onClick(item.path)}
    className="group cursor-pointer bg-white rounded-sm border-2 border-black/[0.12] p-7 shadow-sm hover:shadow-2xl hover:border-black/30 hover:translate-x-1 transition-all duration-500 relative overflow-hidden active:scale-[0.97] animate-in fade-in slide-in-from-left-6 fill-mode-both border-l-[6px] border-l-black group-hover:border-l-blue-600"
    style={{ animationDelay: `${idx * 60}ms` }}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-700"></div>
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-start justify-between mb-10">
        <div className="h-16 w-16 rounded-sm bg-gray-950 flex items-center justify-center text-white shadow-2xl shadow-black/40 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500 border-2 border-white/10">
          <span className="material-symbols-outlined text-[36px] font-bold">{item.icon}</span>
        </div>
        <span className="material-symbols-outlined text-gray-200 text-2xl group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-700 opacity-20 group-hover:opacity-100">
          arrow_forward
        </span>
      </div>
      
      <div className="flex-1">
        <h2 className="text-[18px] font-bold text-gray-950 tracking-tight group-hover:text-blue-600 transition-colors mb-2 leading-none">
          {item.title}
        </h2>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-loose mb-4">
          Protocolo_0{idx + 1}
        </p>
        <p className="text-[13px] font-medium text-gray-600 leading-relaxed max-w-[220px] group-hover:text-gray-900 transition-colors">
          {item.description}
        </p>
      </div>

      <div className="mt-10 pt-6 border-t border-black/[0.06] flex items-center justify-between">
        <span className="text-[10px] font-black text-gray-950 uppercase tracking-[0.25em] opacity-40 group-hover:opacity-100 transition-opacity">Ejecutar</span>
        <span className="h-[2px] w-12 bg-gray-100 group-hover:w-20 group-hover:bg-blue-600 transition-all duration-700"></span>
      </div>
    </div>
  </div>
);

interface SupportProtocolProps {
  onNavigate: (path: string) => void;
  isManager: boolean;
}

export const SupportProtocol: React.FC<SupportProtocolProps> = ({ onNavigate, isManager }) => (
  <div className="mt-20 bg-gray-950 rounded-sm p-12 text-white shadow-2xl shadow-black/60 relative overflow-hidden border-t-4 border-blue-600 animate-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-both">
    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 -mr-48 -mt-48 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
      <span className="material-symbols-outlined text-[200px] font-bold">verified_user</span>
    </div>
    
    <h3 className="text-[12px] font-bold uppercase tracking-[0.4em] text-blue-500 mb-10 flex items-center gap-6">
      <span className="h-px w-16 bg-blue-600/60"></span>
      Protocolos de Asistencia Directa
      <span className="h-px flex-1 bg-white/5"></span>
    </h3>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
      <div className="lg:col-span-7 space-y-8">
        <div className="space-y-4">
          <p className="text-[18px] font-bold text-white tracking-tight leading-tight">
            Gestión de solicitudes protegidas y escalamiento administrativo.
          </p>
          <p className="text-[14px] text-gray-400 font-medium leading-relaxed max-w-xl">
            Para modificaciones estructurales en la base de datos o asignación de activos de alta prioridad, el sistema requiere la validación mediante peticiones auditadas.
          </p>
        </div>
        <button 
          onClick={() => onNavigate(isManager ? '/responsable/petitions' : '/propietario/petitions')}
          className="bg-white text-gray-950 px-8 py-4 rounded-sm text-[11px] font-black uppercase tracking-[0.25em] hover:bg-blue-600 hover:text-white hover:-translate-y-1 transition-all active:scale-95 shadow-2xl shadow-white/5 flex items-center gap-4 group"
        >
          Apertura de Ticket
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">send</span>
        </button>
      </div>
      
      <div className="lg:col-span-5">
        <ul className="space-y-5 border-l border-white/10 pl-8">
          {[
            'Integridad de metadatos de activos',
            'Validación documental RUT / Pasaporte',
            'Sincronización de responsables externos',
            'Ajustes de ciclo de vida de estancias'
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-5 text-[13px] text-gray-500 font-bold group cursor-default">
              <span className="text-blue-500 text-[18px] font-bold group-hover:translate-x-1 transition-transform duration-300">/</span>
              <span className="group-hover:text-white transition-colors duration-300 uppercase tracking-tight">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="mt-14 pt-8 border-t border-white/5 flex justify-between items-center opacity-30">
      <div className="flex items-center gap-8">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em]">AUTH_LEVEL_SECURE</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.4em]">ENC_AES_GCM</span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.4em]">SPS_OS_v.4.2</span>
    </div>
  </div>
);
