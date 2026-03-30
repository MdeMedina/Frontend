import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Petition } from './usePetitions';

interface PetitionDetailsProps {
  petition: Petition;
  allApartments: any[];
}

const Card = ({ title, icon, children, className = '' }: any) => (
  <div className={`bg-white rounded-lg p-4 border border-slate-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] flex flex-col ${className}`}>
    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
      <span className="material-symbols-outlined text-slate-900 text-lg font-bold">{icon}</span>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, className = '' }: any) => (
  <div className={`bg-slate-50 p-3 rounded border border-slate-100 text-center ${className}`}>
    <p className="text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1">{label}</p>
    <p className="text-sm font-bold text-slate-900 truncate">{value || 'N/A'}</p>
  </div>
);

export const PetitionDetails = ({ petition, allApartments }: PetitionDetailsProps) => {
  const data = petition.requestedData || {};

  const formatDateShort = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), "d 'de' MMM", { locale: es });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // 1. MANAGER PETITIONS
  if (['CREATE_MANAGER', 'MODIFY_MANAGER', 'DELETE_MANAGER'].includes(petition.type)) {
    if (petition.type === 'MODIFY_MANAGER') {
      const managerId = data.managerId;
      const resolvedApartment = allApartments.find(a =>
        a.manager?.id === managerId || (typeof a.manager === 'object' && a.manager?.id === managerId)
      );
      const currentManager = resolvedApartment?.manager || petition.apartment?.manager;

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          {currentManager && (
            <Card title="Responsable Actual" icon="person_outline" className="opacity-60 bg-slate-50/50">
              <div className="space-y-2">
                <Field label="Nombre" value={`${currentManager.firstName} ${currentManager.lastName}`} />
                <Field label="Email" value={currentManager.email} />
              </div>
            </Card>
          )}
          <Card title="Cambios Solicitados" icon="edit_note" className="border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.05)]">
            <div className="space-y-2">
              <Field label="Nuevo Nombre" value={`${data.firstName || ''} ${data.lastName || ''}`} />
              <Field label="Nuevo Email" value={data.email} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Nuevo RUT" value={data.rut} />
                <Field label="Nuevo Teléfono" value={data.phone || data.phoneNumber} />
              </div>
            </div>
          </Card>
        </div>
      );
    }

    const managerData = petition.type === 'DELETE_MANAGER' ? (petition.apartment?.manager || data) : data;
    const name = managerData.firstName ? `${managerData.firstName} ${managerData.lastName || ''}` : ((managerData as any).managerName || 'Sin nombre');

    return (
      <Card title="Datos del Responsable" icon="manage_accounts" className="h-full">
        <div className="flex items-center gap-4 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div className="w-14 h-14 rounded bg-slate-900 flex items-center justify-center text-white font-black text-xl">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <h4 className="text-lg font-black tracking-tighter truncate text-slate-900">{name}</h4>
            <p className="text-xs font-bold text-slate-500 truncate">{managerData.email || 'N/A'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Field label="RUT" value={managerData.rut || (managerData as any).rut} />
          <Field label="Teléfono" value={managerData.phone || (managerData as any).phoneNumber} />
        </div>
        <div className="bg-slate-100 p-3 rounded text-center">
            <p className="text-[9px] uppercase font-black text-slate-400 mb-1">Acción</p>
            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                {petition.type === 'DELETE_MANAGER' ? 'Eliminar Responsable' : 'Asignar Nuevo Responsable'}
            </p>
        </div>
      </Card>
    );
  }

  // 2. APARTMENT PETITIONS
  if (['CREATE_APARTMENT', 'MODIFY_APARTMENT', 'DELETE_APARTMENT'].includes(petition.type)) {
    const aptData = petition.type === 'CREATE_APARTMENT' ? data : (petition.apartment || data);

    return (
      <div className="flex flex-col gap-4 h-full">
        <Card title="Datos del Departamento" icon="apartment">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Número" value={aptData.number} />
            <Field label="Piso" value={aptData.floor} />
            <Field label="Torre" value={typeof aptData.building === 'string' ? aptData.building : aptData.building?.name} />
          </div>
          {aptData.parkingNumber && (
            <div className="mt-2">
                <Field label="Estacionamiento" value={aptData.parkingNumber} />
            </div>
          )}
        </Card>

        {petition.type === 'MODIFY_APARTMENT' && (
          <Card title="Cambios Solicitados" icon="edit_note" className="border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.05)]">
            <div className="space-y-4">
              {data.parkingNumber !== undefined && data.parkingNumber !== aptData.parkingNumber &&
                <Field label="Nuevo Estacionamiento" value={data.parkingNumber} />
              }
              {data.description !== undefined && data.description !== aptData.description && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <p className="text-[9px] uppercase font-black text-slate-400 mb-2">Nueva Descripción</p>
                  <p className="text-sm font-medium text-slate-800 italic leading-relaxed">"{data.description}"</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // 3. STAY / GUEST
  if (petition.type === 'MODIFY_STAY' || petition.type === 'MODIFY_GUEST_DATA') {
    const stay = petition.stay;
    if (!stay) return <Card title="Reserva" icon="hotel"><p className="text-xs text-red-500 font-bold">Información de reserva no disponible</p></Card>;

    return (
      <Card title="Detalles de Reserva" icon="bed" className="h-full">
        <div className="flex items-center gap-4 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div className="w-14 h-14 rounded bg-slate-900 flex items-center justify-center text-white font-black text-xl">
            {getInitials(`${stay.guestFirstName} ${stay.guestLastName}`)}
          </div>
          <div className="min-w-0">
            <h4 className="text-lg font-black tracking-tighter truncate text-slate-900">{stay.guestFirstName} {stay.guestLastName}</h4>
            <p className="text-xs font-bold text-slate-500 truncate">ID: {stay.guestDocument || 'N/A'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Field label="Check-in Original" value={formatDateShort(stay.scheduledCheckIn)} />
          <Field label="Check-out Original" value={formatDateShort(stay.scheduledCheckOut)} />
        </div>

        {data && (data.newCheckIn || data.newCheckOut) && (
          <div className="bg-slate-900 p-4 rounded-lg shadow-xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
              Cambios Solicitados
            </p>
            <div className="grid grid-cols-2 gap-4">
              {data.newCheckIn && (
                <div>
                  <p className="text-[10px] font-bold text-white/50 mb-1">Nuevo Check-in</p>
                  <p className="text-base font-black text-white tracking-tighter">{formatDateShort(data.newCheckIn)}</p>
                </div>
              )}
              {data.newCheckOut && (
                <div>
                  <p className="text-[10px] font-bold text-white/50 mb-1">Nuevo Check-out</p>
                  <p className="text-base font-black text-white tracking-tighter">{formatDateShort(data.newCheckOut)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  }

  // 4. ASSIGN PARKING
  if (petition.type === 'ASSIGN_PARKING') {
    const assignment = (petition as any).parkingAssignment;
    const targetApt = assignment?.targetApartment;
    const targetAptName = targetApt 
      ? `Dpto ${targetApt.number} - ${targetApt.building?.name || 'Sin torre'}`
      : data.targetApartmentNumber 
        ? `Dpto ${data.targetApartmentNumber} - ${data.targetBuildingName || 'Cargando...'}`
        : 'Desconocido';

    const sourceApt = assignment?.sourceApartment || petition.apartment;
    const sourceAptName = sourceApt 
      ? `Dpto ${sourceApt.number} (${sourceApt.building?.name || (sourceApt.building as any)})`
      : 'Mi Departamento';

    return (
      <Card title="Préstamo de Estacionamiento" icon="local_parking" className="h-full border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,0.05)]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Mi Departamento" value={sourceAptName} />
            <Field label="Estacionamiento" value={data.parkingNumber || assignment?.parkingNumber} />
          </div>
          <div className="bg-slate-50 p-4 rounded border border-slate-100">
            <p className="text-[9px] uppercase font-black text-slate-400 mb-1">Destinatario / Beneficiario</p>
            <p className="text-sm font-black text-slate-900 underline decoration-slate-400 underline-offset-4">{targetAptName}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div className="text-center">
                <p className="text-[9px] uppercase font-black text-slate-400">Desde</p>
                <p className="text-base font-black tracking-tighter">{formatDateShort(data.startDate || assignment?.startDate)}</p>
            </div>
            <div className="text-center">
                <p className="text-[9px] uppercase font-black text-slate-400">Hasta</p>
                <p className="text-base font-black tracking-tighter">{formatDateShort(data.endDate || assignment?.endDate)}</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-12 text-slate-300">
        <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2">description_off</span>
            <p className="text-xs font-bold uppercase tracking-widest">Sin detalles específicos</p>
        </div>
    </div>
  );
};
