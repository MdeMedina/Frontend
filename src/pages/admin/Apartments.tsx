import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { apartmentsApi } from '../../api/apartments';
import type { Apartment, CreateApartmentDto } from '../../api/apartments';
import { buildingsApi, type Building } from '../../api/buildings';
import { usersApi, type User } from '../../api/users';
import { Modal } from '../../components/Modal';


// Sub-componentes Destilados
interface ApartmentFiltersProps {
  filterNumber: string;
  setFilterNumber: (v: string) => void;
  filterBuilding: string;
  setFilterBuilding: (v: string) => void;
  filterFloor: string;
  setFilterFloor: (v: string) => void;
  uniqueBuildings: string[];
  uniqueFloors: (number | string)[];
  clearFilters: () => void;
  totalFiltered: number;
  totalApartments: number;
}

const ApartmentFilters = ({
  filterNumber, setFilterNumber,
  filterBuilding, setFilterBuilding,
  filterFloor, setFilterFloor,
  uniqueBuildings, uniqueFloors,
  clearFilters, totalFiltered, totalApartments
}: ApartmentFiltersProps) => (
  <div className="bg-white rounded-[var(--radius-sm)] shadow-lg shadow-black/5 p-6 mb-6 border border-black/5 animate-in fade-in duration-500">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Filtros de búsqueda</h2>
      <button
        onClick={clearFilters}
        className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
      >
        Limpiar filtros
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2">
          Número de Departamento
        </label>
        <input
          type="text"
          value={filterNumber}
          onChange={(e) => setFilterNumber(e.target.value)}
          placeholder="Buscar por número..."
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-2.5 
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white shadow-sm transition-all"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2">
          Torre / Edificio
        </label>
        <select
          value={filterBuilding}
          onChange={(e) => setFilterBuilding(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-2.5 
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-[46px]
                     text-sm bg-white shadow-sm transition-all font-medium"
        >
          <option value="">Todas las torres</option>
          {uniqueBuildings.map(building => (
            <option key={building} value={building}>{building}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-2">
          Piso
        </label>
        <select
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-2.5 
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-[46px]
                     text-sm bg-white shadow-sm transition-all font-medium"
        >
          <option value="">Todos los pisos</option>
          {uniqueFloors.map(floor => (
            <option key={floor} value={floor.toString()}>Piso {floor}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="mt-6 pt-4 border-t border-black/5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
      MOSTRANDO {totalFiltered} DE {totalApartments} DEPARTAMENTOS
    </div>
  </div>
);

interface ApartmentTableRowProps {
  apt: Apartment;
  canDelete: boolean;
  handleDelete: (apt: Apartment) => void;
  handleStatusChange: (apt: Apartment, status: boolean) => void;
  onDetail: (apt: Apartment) => void;
}

const ApartmentTableRow = ({
  apt, canDelete, handleDelete, handleStatusChange, onDetail
}: ApartmentTableRowProps) => (
  <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => onDetail(apt)}>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="font-bold text-gray-900 text-[15px] tracking-tight group-hover:translate-x-1 transition-transform inline-block">
        Depto {apt.number}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">
      {apt.building?.name || 'Sin torre'}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">
      Piso {apt.floor}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">
      {apt.parkingNumber || <span className="text-gray-300 italic">No asignado</span>}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      {apt.owner ? (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[var(--radius-sm)] bg-primary flex items-center justify-center text-white text-[11px] font-bold shadow-sm group-hover:scale-105 transition-transform">
            {apt.owner.firstName[0]}{apt.owner.lastName[0]}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">
              {apt.owner.firstName} {apt.owner.lastName}
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">{apt.owner.email}</div>
          </div>
        </div>
      ) : (
        <span className="text-gray-400 italic text-xs">Sin propietario</span>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-gray-900">
      {apt.owner?.rut || <span className="text-gray-300">-</span>}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-gray-900">
      {apt.owner?.phone || <span className="text-gray-300">-</span>}
    </td>
    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
      <select
        value={apt.isActive ? 'active' : 'inactive'}
        onChange={(e) => handleStatusChange(apt, e.target.value === 'active')}
        className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-md border border-black/5 cursor-pointer transition-all focus:ring-2 focus:ring-primary/20 ${apt.isActive
          ? 'bg-green-100 text-green-900'
          : 'bg-red-100 text-red-900'
          }`}
      >
        <option value="active" className="bg-white text-gray-900">Activo</option>
        <option value="inactive" className="bg-white text-gray-900">Inactivo</option>
      </select>
    </td>
    {canDelete && (
      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => handleDelete(apt)}
          className="text-red-600 hover:text-red-800 font-bold text-[10px] uppercase tracking-widest transition-colors py-1 px-3 rounded hover:bg-red-50 active:scale-95"
          aria-label="Eliminar departamento"
        >
          Eliminar
        </button>
      </td>
    )}
  </tr>
);

interface ApartmentDetailModalContentProps {
  selectedApartment: Apartment | null;
}

const ApartmentDetailModalContent = ({ selectedApartment }: ApartmentDetailModalContentProps) => (
  <div className="space-y-6">
    <div className="bg-[var(--color-primary)]/5 p-6 rounded-[var(--radius-sm)] text-center border border-[var(--color-primary)]/10">
      <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Departamento</div>
      <div className="text-4xl font-bold text-primary tracking-tighter">
        {selectedApartment?.number}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-50 p-4 rounded-[var(--radius-sm)] border border-gray-100">
        <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Torre / Edificio</div>
        <div className="font-bold text-gray-900">{selectedApartment?.building?.name || 'Sin torre'}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-[var(--radius-sm)] border border-gray-100">
        <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Piso</div>
        <div className="font-bold text-gray-900">Piso {selectedApartment?.floor}</div>
      </div>
    </div>

    {/* Propietario */}
    <div className="bg-white p-5 rounded-[var(--radius-sm)] border border-black/5 shadow-sm">
      <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-4 border-b pb-2">Propietario Titular</div>
      {selectedApartment?.owner ? (
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-[var(--radius-sm)] bg-primary flex items-center justify-center text-white text-xl font-bold shadow-md">
            {selectedApartment.owner.firstName[0]}{selectedApartment.owner.lastName[0]}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 tracking-tight">
              {selectedApartment.owner.firstName} {selectedApartment.owner.lastName}
            </div>
            <div className="text-sm font-medium text-[var(--color-text-muted)]">{selectedApartment.owner.email}</div>
            {selectedApartment.owner.phone && (
              <div className="text-xs text-primary font-bold mt-1">{selectedApartment.owner.phone}</div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 italic text-sm py-2">Sin propietario asignado</p>
      )}
    </div>

    {/* Responsable Asignado */}
    {selectedApartment?.manager && (
      <div className="bg-white p-5 rounded-[var(--radius-sm)] border border-black/5 shadow-sm">
        <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-4 border-b pb-2">Responsable Asignado</div>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-[var(--radius-sm)] bg-[#7B1FA2] flex items-center justify-center text-white text-xl font-bold shadow-md">
            {selectedApartment.manager.firstName[0]}{selectedApartment.manager.lastName[0]}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 tracking-tight">
              {selectedApartment.manager.firstName} {selectedApartment.manager.lastName}
            </div>
            <div className="text-sm font-medium text-[var(--color-text-muted)]">{selectedApartment.manager.email}</div>
          </div>
        </div>
      </div>
    )}

    {selectedApartment?.description && (
      <div className="bg-gray-50 p-4 rounded-[var(--radius-sm)] border border-gray-100">
        <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Descripción</div>
        <div className="text-sm text-gray-900 font-medium leading-relaxed">{selectedApartment.description}</div>
      </div>
    )}

    <div className="flex items-center justify-between pt-6 border-t border-black/5">
      <span className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">Estado Actual:</span>
      <span className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm border border-black/5 ${selectedApartment?.isActive
        ? 'bg-green-100 text-green-900'
        : 'bg-red-100 text-red-900'
        }`}>
        {selectedApartment?.isActive ? 'ACTIVO' : 'INACTIVO'}
      </span>
    </div>
  </div>
);

interface CreateApartmentModalContentProps {
  handleCreate: (e: React.FormEvent) => void;
  newApartmentData: CreateApartmentDto;
  setNewApartmentData: (v: CreateApartmentDto) => void;
  isCreatingOwner: boolean;
  setIsCreatingOwner: (v: boolean) => void;
  owners: User[];
  newOwnerData: { firstName: string; lastName: string; email: string };
  setNewOwnerData: (v: any) => void;
  submitting: boolean;
  onCancel: () => void;
}

const CreateApartmentModalContent = ({
  handleCreate, newApartmentData, setNewApartmentData,
  isCreatingOwner, setIsCreatingOwner, owners,
  newOwnerData, setNewOwnerData, submitting, onCancel
}: CreateApartmentModalContentProps) => (
  <form onSubmit={handleCreate} className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">
          Número *
        </label>
        <input
          type="text"
          required
          value={newApartmentData.number}
          onChange={(e) => setNewApartmentData({ ...newApartmentData, number: e.target.value })}
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-2.5 
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
          placeholder="Ej: 101"
        />
      </div>
      <div>
        <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">
          Piso *
        </label>
        <input
          type="number"
          required
          value={newApartmentData.floor}
          onChange={(e) => setNewApartmentData({ ...newApartmentData, floor: parseInt(e.target.value) || 0 })}
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-2.5 
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
        />
      </div>
    </div>

    <div>
      <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">
        Propietario *
      </label>
      <select
        required={!isCreatingOwner}
        value={isCreatingOwner ? 'NEW' : (newApartmentData.ownerId || '')}
        onChange={(e) => {
          if (e.target.value === 'NEW') {
            setIsCreatingOwner(true);
            setNewApartmentData({ ...newApartmentData, ownerId: '' });
          } else {
            setIsCreatingOwner(false);
            setNewApartmentData({ ...newApartmentData, ownerId: e.target.value });
          }
        }}
        className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-2.5 
                   focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white font-medium"
      >
        <option value="">Seleccionar...</option>
        <option value="NEW" className="font-bold text-primary italic">+ Crear nuevo propietario...</option>
        {owners.map(owner => (
          <option key={owner.id} value={owner.id}>
            {owner.firstName} {owner.lastName} ({owner.rut || 'Sin RUT'})
          </option>
        ))}
      </select>
    </div>

    {isCreatingOwner && (
      <div className="bg-[var(--color-primary)]/5 p-5 rounded-[var(--radius-sm)] space-y-4 animate-in fade-in slide-in-from-top-2 border border-primary/10 shadow-inner">
        <div className="flex justify-between items-center border-b border-primary/10 pb-2">
          <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Datos del Nuevo Propietario</h3>
          <button
            type="button"
            onClick={() => setIsCreatingOwner(false)}
            className="text-[9px] font-bold text-primary uppercase tracking-tighter hover:underline"
          >
            Cancelar creación
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5">Nombre *</label>
            <input
              type="text"
              required
              value={newOwnerData.firstName}
              onChange={(e) => setNewOwnerData({ ...newOwnerData, firstName: e.target.value })}
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
              placeholder="Ej: Juan"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5">Apellido *</label>
            <input
              type="text"
              required
              value={newOwnerData.lastName}
              onChange={(e) => setNewOwnerData({ ...newOwnerData, lastName: e.target.value })}
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
              placeholder="Ej: Pérez"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1.5">Email *</label>
          <input
            type="email"
            required
            value={newOwnerData.email}
            onChange={(e) => setNewOwnerData({ ...newOwnerData, email: e.target.value })}
            className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
            placeholder="ejemplo@correo.com"
          />
        </div>
      </div>
    )}

    <div>
      <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">
        Estacionamiento (Opcional)
      </label>
      <input
        type="text"
        value={newApartmentData.parkingNumber || ''}
        onChange={(e) => setNewApartmentData({ ...newApartmentData, parkingNumber: e.target.value })}
        className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-2.5 
                   focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
        placeholder="Ej: E-15"
      />
    </div>

    <div>
      <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">
        Descripción (Opcional)
      </label>
      <textarea
        value={newApartmentData.description || ''}
        onChange={(e) => setNewApartmentData({ ...newApartmentData, description: e.target.value })}
        rows={3}
        className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-2.5 
                   focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white resize-none"
      />
    </div>

    <div className="flex gap-4 pt-6 border-t border-black/5">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[11px] font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-colors"
      >
        CANCELAR
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="flex-1 px-4 py-3 bg-primary text-white rounded-[var(--radius-sm)] 
                   hover:bg-primary/90 active:scale-[0.97] transition-all 
                   text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 border border-primary/20 disabled:opacity-50"
      >
        {submitting ? 'GUARDANDO...' : 'CREAR DEPARTAMENTO'}
      </button>
    </div>
  </form>
);

export const AdminApartments = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  // Estados para creación
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [newApartmentData, setNewApartmentData] = useState<CreateApartmentDto>({
    number: '',
    floor: 0,
    buildingId: '',
    description: '',
    parkingNumber: '',
    ownerId: '',
  });
  const [isCreatingOwner, setIsCreatingOwner] = useState(false);
  const [newOwnerData, setNewOwnerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const { user, isMainAdminFor, impersonatedResidenceId, currentBuilding } = useAuth();
  const currentResidenceId = impersonatedResidenceId || user?.residenceId;
  const canDelete = currentResidenceId ? isMainAdminFor(currentResidenceId) : false;

  // Filtros
  const [filterNumber, setFilterNumber] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterFloor, setFilterFloor] = useState('');

  // Obtener valores únicos para filtros
  const uniqueBuildings = useMemo(() => {
    const buildingNames = apartments
      .map(a => a.building?.name)
      .filter((name): name is string => !!name);
    return [...new Set(buildingNames)].sort();
  }, [apartments]);

  const uniqueFloors = useMemo(() => {
    const floors = [...new Set(apartments.map(a => a.floor))];
    return floors.sort((a, b) => a - b);
  }, [apartments]);

  const fetchApartments = async () => {
    try {
      setLoading(true);
      const response = await apartmentsApi.getAll({ 
        limit: 500,
        ...(currentBuilding?.id ? { buildingId: currentBuilding.id } : {})
      });
      setApartments(response.data);
    } catch (err) {
      setError('Error al cargar los departamentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await buildingsApi.getAll();
      setBuildings(response.data);
    } catch (err) {
      console.error('Error al cargar edificios', err);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await usersApi.getAll({ limit: 1000 });
      // Filtrar solo usuarios con rol OWNER
      const ownersList = response.data.filter(u => u.role === 'OWNER');
      setOwners(ownersList);
    } catch (err) {
      console.error('Error al cargar propietarios', err);
    }
  };

  useEffect(() => {
    fetchApartments();
    fetchBuildings();
    fetchOwners();
  }, [currentBuilding?.id]);

  const handleDelete = async (apartment: Apartment) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el departamento ${apartment.number}?`)) {
      return;
    }

    try {
      await apartmentsApi.delete(apartment.id);
      setSuccess(`Departamento ${apartment.number} eliminado correctamente`);
      fetchApartments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el departamento');
    }
  };

  const handleStatusChange = async (apartment: Apartment, isActive: boolean) => {
    try {
      await apartmentsApi.update(apartment.id, { isActive });
      setSuccess(`Estado del departamento ${apartment.number} actualizado`);
      fetchApartments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let finalOwnerId = newApartmentData.ownerId;

      // Si se está creando un nuevo propietario
      if (isCreatingOwner) {
        if (!newOwnerData.firstName || !newOwnerData.lastName || !newOwnerData.email) {
          throw new Error('Por favor completa todos los datos del nuevo propietario');
        }
        
        const newOwner = await usersApi.create({
          firstName: newOwnerData.firstName,
          lastName: newOwnerData.lastName,
          email: newOwnerData.email,
          role: 'OWNER',
          residenceId: currentResidenceId || undefined
        });
        finalOwnerId = newOwner.id;
        // Refrescar lista de propietarios para futuros usos
        await fetchOwners();
      }

      if (!finalOwnerId) {
        throw new Error('Debes seleccionar o crear un propietario');
      }

      await apartmentsApi.create({
        ...newApartmentData,
        buildingId: currentBuilding?.id || newApartmentData.buildingId,
        ownerId: finalOwnerId
      });

      setSuccess('Departamento creado correctamente');
      setShowCreateModal(false);
      resetCreateForm();
      fetchApartments();
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Error al crear el departamento');
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setNewApartmentData({
      number: '',
      floor: 0,
      buildingId: currentBuilding?.id || '',
      description: '',
      parkingNumber: '',
      ownerId: '',
    });
    setIsCreatingOwner(false);
    setNewOwnerData({ firstName: '', lastName: '', email: '' });
  };

  // Funciones de Excel movidas a Dashboard

  // Filtrar departamentos
  const filteredApartments = useMemo(() => {
    return apartments.filter(apt => {
      // Filtro por número
      if (filterNumber && !apt.number.toLowerCase().includes(filterNumber.toLowerCase())) {
        return false;
      }

      // Filtro por edificio/torre
      if (filterBuilding && apt.building?.name !== filterBuilding) {
        return false;
      }

      // Filtro por piso
      if (filterFloor && apt.floor !== parseInt(filterFloor)) {
        return false;
      }

      return true;
    });
  }, [apartments, filterNumber, filterBuilding, filterFloor]);

  const clearFilters = () => {
    setFilterNumber('');
    setFilterBuilding('');
    setFilterFloor('');
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Departamentos</h1>
              <p className="text-gray-600 mt-1">
                Administra los departamentos del sistema
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-white px-8 py-3 rounded-[var(--radius-sm)] 
                         hover:bg-primary/90 active:scale-[0.97] transition-all 
                         flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest 
                         shadow-lg shadow-primary/20 border border-primary/20"
            >
              <span className="material-symbols-outlined text-xl">add_box</span>
              NUEVO DEPARTAMENTO
            </button>
            </div>

          {/* Filtros */}
          <ApartmentFilters
            filterNumber={filterNumber}
            setFilterNumber={setFilterNumber}
            filterBuilding={filterBuilding}
            setFilterBuilding={setFilterBuilding}
            filterFloor={filterFloor}
            setFilterFloor={setFilterFloor}
            uniqueBuildings={uniqueBuildings}
            uniqueFloors={uniqueFloors}
            clearFilters={clearFilters}
            totalFiltered={filteredApartments.length}
            totalApartments={apartments.length}
          />

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow-lg shadow-black/5 rounded-[var(--radius-sm)] overflow-hidden border border-black/5 animate-in fade-in duration-500">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Número</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Torre / Edificio</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Piso</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Estacionamiento</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Propietario</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">RUT</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Teléfono</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Estado</th>
                      {canDelete && <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApartments.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                          No se encontraron departamentos con los filtros aplicados
                        </td>
                      </tr>
                    ) : (
                      filteredApartments.map((apt) => (
                        <ApartmentTableRow
                          key={apt.id}
                          apt={apt}
                          canDelete={canDelete}
                          handleDelete={handleDelete}
                          handleStatusChange={handleStatusChange}
                          onDetail={setSelectedApartment}
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

      {/* Modal de detalles (solo lectura) */}
      <Modal
        isOpen={!!selectedApartment}
        onClose={() => setSelectedApartment(null)}
        title="Detalles del Departamento"
        width="max-w-lg"
      >
        <ApartmentDetailModalContent selectedApartment={selectedApartment} />
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => setSelectedApartment(null)}
            className="w-full bg-gray-900 text-white px-8 py-3 rounded-[var(--radius-sm)] 
                       hover:bg-gray-800 active:scale-[0.97] transition-all 
                       text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-black/10"
          >
            CERRAR PORTAL DE DETALLES
          </button>
        </div>
      </Modal>

      {/* Modal de creación */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
          setError('');
          setSuccess('');
        }}
        title="Nuevo Departamento"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-red-500 font-variation-icon-fill">error</span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded shadow-sm animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-green-500 font-variation-icon-fill">check_circle</span>
              {success}
            </div>
          </div>
        )}
        <CreateApartmentModalContent
          handleCreate={handleCreate}
          newApartmentData={newApartmentData}
          setNewApartmentData={setNewApartmentData}
          isCreatingOwner={isCreatingOwner}
          setIsCreatingOwner={setIsCreatingOwner}
          owners={owners}
          newOwnerData={newOwnerData}
          setNewOwnerData={setNewOwnerData}
          submitting={submitting}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </Layout>
  );
};
