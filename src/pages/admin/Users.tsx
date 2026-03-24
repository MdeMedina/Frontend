import { useState, useEffect, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth';
import { usersApi, roleLabels, roleColors } from '../../api/users';
import type { User, CreateUserDto, UpdateUserDto, UserRole, OwnerWithHierarchy } from '../../api/users';
import { formatPhoneNumber } from '../../utils/phone';
import { PhoneInput } from '../../components/PhoneInput';
import { Modal } from '../../components/Modal';
import { SetupLinkModal } from '../../components/SetupLinkModal';
import { handleRutInput } from '../../utils/rut';

// --- Utilidades ---

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Nunca';
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// --- Sub-componentes Destilados ---

interface UserActionProps {
  user: User | OwnerWithHierarchy;
  onEdit: (user: any) => void;
  onToggleActive: (user: any) => void;
  onReset: (user: any) => void;
  onDelete?: (user: any) => void;
  canManage: boolean;
  isOwnerView?: boolean;
}

const UserActionButtons = ({ user, onEdit, onToggleActive, onReset, onDelete, canManage, isOwnerView }: UserActionProps) => {
  if (!canManage) {
    return <span className="text-gray-400 italic text-xs">Gestionado por Propietario</span>;
  }

  const btnClass = isOwnerView 
    ? "text-xs font-bold uppercase tracking-wide transition-colors"
    : "font-semibold text-xs uppercase transition-colors";

  const spacing = isOwnerView ? "ml-4" : "mr-4";

  return (
    <>
      <button
        onClick={() => onEdit(isOwnerView ? { ...user, role: 'OWNER' } : user)}
        className={`text-primary hover:text-primary/80 active:scale-95 transition-all ${spacing} ${btnClass}`}
        aria-label="Editar usuario"
      >
        Editar
      </button>
      <button
        onClick={() => onToggleActive(isOwnerView ? { ...user, role: 'OWNER' } : user)}
        className={`${spacing} ${btnClass} active:scale-95 transition-all ${user.isActive ? 'text-[#FBC02D] hover:text-[#F9A825]' : 'text-[#2E7D32] hover:text-[#1B5E20]'}`}
        aria-label={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
      >
        {user.isActive ? 'Desactivar' : 'Activar'}
      </button>
      <button
        onClick={() => onReset(isOwnerView ? { ...user, role: 'OWNER' } : user)}
        className={`text-[#E64A19] hover:text-[#D84315] active:scale-95 transition-all ${spacing} ${btnClass}`}
        title="Generar link de reseteo de contraseña (30 min)"
        aria-label="Restablecer contraseña"
      >
        Restablecer
      </button>
      {onDelete && (
        <button
          onClick={() => onDelete(isOwnerView ? { ...user, role: 'OWNER' } : user)}
          className={`text-red-600 hover:text-red-800 active:scale-95 transition-all ${spacing} ${btnClass}`}
          aria-label="Eliminar usuario"
        >
          Eliminar
        </button>
      )}
    </>
  );
};

interface UserTableRowProps {
  user: User;
  canManage: boolean;
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
  onReset: (user: User) => void;
  onDelete?: (user: User) => void;
}

const UserTableRow = ({ user, canManage, onEdit, onToggleActive, onReset, onDelete }: UserTableRowProps) => (
  <tr className={`${!user.isActive ? 'bg-gray-50/50 opacity-60' : 'hover:bg-gray-50/60'} transition-colors duration-200 group`}>
    <td className="px-6 py-4">
      <div className="flex items-center">
        <div className="h-10 w-10 flex-shrink-0">
          <div className={`h-10 w-10 rounded-[var(--radius-sm)] flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm ${user.role === 'ADMIN' ? 'bg-[#D32F2F]' :
            user.role === 'OWNER' ? 'bg-primary' :
              user.role === 'ASSIGNED_MANAGER' ? 'bg-[#7B1FA2]' : 'bg-[#2E7D32]'
            }`}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
        </div>
        <div className="ml-4">
          <div className="text-[15px] font-bold text-gray-900 leading-tight">{user.firstName} {user.lastName}</div>
          <div className="text-sm text-[var(--color-text-muted)] font-medium mt-0.5">{user.email}</div>
          {user.phone && <div className="text-[11px] text-gray-400 mt-0.5">{formatPhoneNumber(user.phone)}</div>}
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center gap-1.5">
        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border border-black/5 ${roleColors[user.role]}`}>
          {roleLabels[user.role]}
        </span>
        {user.role === 'ADMIN' && (user as any).isMainAdmin && (
          <span className="material-symbols-outlined text-[16px] text-amber-500 font-variation-icon-fill cursor-help hover:scale-125 transition-transform" title="Administrador Principal">star</span>
        )}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border border-black/5 ${user.isActive ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
        {user.isActive ? 'Activo' : 'Inactivo'}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.lastLogin)}</td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <UserActionButtons 
        user={user} 
        canManage={canManage} 
        onEdit={onEdit} 
        onToggleActive={onToggleActive} 
        onReset={onReset} 
        onDelete={onDelete} 
      />
    </td>
  </tr>
);

interface HierarchyOwnerCardProps {
  owner: OwnerWithHierarchy;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  canDelete: boolean;
  onEdit: (user: any) => void;
  onToggleActive: (user: any) => void;
  onReset: (user: any) => void;
  onDelete?: (user: any) => void;
}

const HierarchyOwnerCard = ({ 
  owner, isExpanded, onToggleExpand, canDelete, onEdit, onToggleActive, onReset, onDelete 
}: HierarchyOwnerCardProps) => (
  <div key={owner.id} className="bg-white">
    {/* Owner Row */}
    <div
      onClick={() => onToggleExpand(owner.id)}
      className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-all border-b border-[var(--color-border)] last:border-b-0 group"
    >
      <div className="flex items-center group-hover:translate-x-1 transition-transform duration-300">
        <div className="h-12 w-12 rounded-[var(--radius-sm)] bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
          {owner.firstName[0]}{owner.lastName[0]}
        </div>
        <div className="ml-4">
          <div className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">
            {owner.firstName} {owner.lastName}
            {!owner.isActive && (
              <span className="ml-2 px-2.5 py-1 text-[10px] bg-red-50 text-red-700 border border-red-200 rounded-md uppercase font-bold tracking-widest shadow-sm">
                Inactivo
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-[var(--color-text-muted)] mt-0.5">{owner.email}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center mr-4" onClick={(e) => e.stopPropagation()}>
          <UserActionButtons 
            user={owner} 
            canManage={true} 
            onEdit={onEdit} 
            onToggleActive={onToggleActive} 
            onReset={onReset} 
            onDelete={onDelete} 
            isOwnerView 
          />
        </div>
        <span className="px-4 py-1.5 bg-primary text-white border border-primary/20 rounded-md text-[11px] font-bold uppercase tracking-[0.1em] shadow-sm transform group-hover:scale-105 transition-transform">
          {owner.ownedApartments.length} DEPARTAMENTO(S)
        </span>
        <span className={`text-2xl text-gray-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <span className="material-symbols-outlined">expand_more</span>
        </span>
      </div>
    </div>

    {/* Expanded Content */}
    {isExpanded && (
      <div className="bg-gray-50/50 px-6 py-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
        {owner.ownedApartments.length === 0 ? (
          <p className="text-gray-500 italic text-sm">Sin departamentos asignados</p>
        ) : (
          <div className="space-y-3">
            {owner.ownedApartments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-[var(--radius-sm)] p-5 border border-[var(--color-border)] shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">apartment</span>
                      Depto {apt.number}
                      {!apt.isActive && (
                        <span className="ml-[34px] block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 rounded-full w-fit">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-1 ml-7">
                      {(typeof apt.building === 'object' ? (apt.building as any)?.name : apt.building) || 'Sin torre'} · Piso {apt.floor}
                    </div>
                  </div>
                  {apt.manager ? (
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 mb-1 uppercase font-bold">Responsable Asignado:</div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[#7B1FA2] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                          {apt.manager.firstName[0]}{apt.manager.lastName[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[var(--color-text-primary)]">
                            {apt.manager.firstName} {apt.manager.lastName}
                            {!apt.manager.isActive && (
                              <span className="ml-1 text-[10px] text-red-500 font-normal italic">(Inactivo)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">{apt.manager.email}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Sin responsable</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

interface UserModalContentProps {
  editingUser: User | null;
  formData: CreateUserDto;
  setFormData: (data: CreateUserDto) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  success: string;
  isPhoneValid: boolean;
  setIsPhoneValid: (valid: boolean) => void;
  currentUser: any;
  isMainAdminFor: (id: string) => boolean;
  currentResidenceId?: string;
}

const UserModalContent = ({
  editingUser, formData, setFormData, onSubmit, error, success,
  isPhoneValid, setIsPhoneValid, currentUser, isMainAdminFor, currentResidenceId
}: UserModalContentProps) => (
  <>
    {error && (
      <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm animate-in fade-in slide-in-from-top-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      </div>
    )}

    {success && (
      <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded shadow-sm animate-in fade-in slide-in-from-top-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          {success}
        </div>
      </div>
    )}
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">Nombre *</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 
                         focus:outline-none focus:ring-1 focus:ring-primary text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">Apellido *</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 
                         focus:outline-none focus:ring-1 focus:ring-primary text-sm bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 
                       focus:outline-none focus:ring-1 focus:ring-primary text-sm bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">RUT</label>
          <input
            type="text"
            value={formData.rut || ''}
            onChange={(e) => {
              const formatted = handleRutInput(e.target.value);
              setFormData({ ...formData, rut: formatted });
            }}
            maxLength={12}
            className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 
                       focus:outline-none focus:ring-1 focus:ring-primary text-sm bg-white"
            placeholder="12.345.678-9"
          />
          <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic leading-relaxed">
            La contraseña será el RUT sin puntos ni guión. Si dejas el RUT vacío, se generará un enlace seguro para que el usuario configure su propia contraseña.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">Teléfono</label>
          <PhoneInput
            value={formData.phone || '+56'}
            onChange={(value) => setFormData({ ...formData, phone: value })}
            onValidationChange={(isValid) => setIsPhoneValid(isValid)}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-800 uppercase tracking-widest mb-2">Rol *</label>
          <select
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 
                       focus:outline-none focus:ring-1 focus:ring-primary text-sm bg-white font-medium"
          >
            {(currentUser?.role === 'SUPERADMIN' || (currentUser?.role === 'ADMIN' && isMainAdminFor(currentResidenceId || ''))) && (
              <option value="ADMIN">Administrador</option>
            )}
            <option value="OWNER">Propietario</option>
            <option value="CONCIERGE">Conserje</option>
          </select>
          <p className="text-[10px] text-gray-500 mt-2 font-medium leading-relaxed">
            {(currentUser?.role === 'ADMIN' && !isMainAdminFor(currentResidenceId || '')) 
              ? 'Como Administrador, puedes gestionar Propietarios y Conserjes. Solo el Administrador Principal puede crear otros administradores.'
              : 'Los Responsables Asignados solo pueden ser creados por Propietarios'}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        {editingUser && (
          <div className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1 italic">
            <span className="material-symbols-outlined text-sm">info</span>
            Solo edita los campos necesarios
          </div>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            type="submit"
            className="bg-primary text-white px-8 py-3 rounded-[var(--radius-sm)] 
                       hover:bg-primary/90 active:scale-[0.97] transition-all 
                       text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 border border-primary/20"
          >
            {editingUser ? 'ACTUALIZAR' : 'CREAR USUARIO'}
          </button>
        </div>
      </div>
    </form>
  </>
);



export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hierarchy, setHierarchy] = useState<OwnerWithHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Link state
  const [setupLink, setSetupLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [recentlyCreatedUser, setRecentlyCreatedUser] = useState<string>('');
  const [isResetLink, setIsResetLink] = useState(false);

  const handleGenerateResetLink = async (user: User | any) => {
    try {
      const res = await authApi.generateResetLink(user.id, false);
      setSetupLink(res.setupLink);
      setRecentlyCreatedUser(`${user.firstName} ${user.lastName}`);
      setIsResetLink(true);
      setShowLinkModal(true);
    } catch (err) {
      console.error('Error al generar link de reseteo:', err);
      alert('Error al generar enlace de reseteo');
    }
  };

  const { user: currentUser, isMainAdminFor, currentResidence, currentBuilding } = useAuth();
  const currentResidenceId = currentResidence?.id || currentUser?.residenceId;
  const canDelete = currentResidenceId ? isMainAdminFor(currentResidenceId) : false;
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  const [expandedOwners, setExpandedOwners] = useState<Set<string>>(new Set());
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    rut: '',
    phone: '',
    role: 'CONCIERGE',
  });
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const buildingId = currentBuilding?.id;
      const [usersRes, hierarchyRes] = await Promise.all([
        usersApi.getAll({ limit: 100, buildingId }),
        usersApi.getHierarchy({ buildingId }),
      ]);
      setUsers(usersRes.data);
      setHierarchy(hierarchyRes);
      setError('');
      setSuccess('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentBuilding?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar teléfono
    if (!isPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }

    try {
      if (editingUser) {
        const updateData: UpdateUserDto = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          rut: formData.rut,
          phone: formData.phone || undefined,
          role: formData.role,
        };
        await usersApi.update(editingUser.id, updateData);
      } else {
        const payload = { ...formData };
        const impersonatedResidenceId = localStorage.getItem('impersonatedResidenceId');
        if (impersonatedResidenceId) {
          payload.residenceId = impersonatedResidenceId;
        }
        const createdUserResult = await usersApi.create(payload);
        
        // Show setup link if returned
        // La API puede devolver la data directamente o envuelta dependiento de Axios
        const userData = (createdUserResult as any).data || createdUserResult;
        if (userData && userData.setupLink) {
          setSetupLink(userData.setupLink);
          setRecentlyCreatedUser(`${formData.firstName} ${formData.lastName}`);
          setIsResetLink(false);
          setShowLinkModal(true);
        } else {
          setSuccess(`Usuario ${formData.firstName} ${formData.lastName} creado correctamente.`);
        }
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      rut: '',
      phone: '+56',
      role: 'CONCIERGE',
    });
    setIsPhoneValid(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      rut: user.rut || '',
      phone: user.phone || '+56',
      role: user.role,
    });
    setShowModal(true);
  };

  const handleToggleActive = async (user: User) => {
    const action = user.isActive ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de que deseas ${action} a ${user.firstName} ${user.lastName}?`)) return;

    try {
      await usersApi.toggleActive(user.id, !user.isActive);
      setSuccess(`Usuario ${user.firstName} ${user.lastName} ${user.isActive ? 'desactivado' : 'activado'} correctamente`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al ${action} usuario`);
    }
  };

  const handleDelete = async (userToDelete: User) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${userToDelete.firstName} ${userToDelete.lastName}?`)) return;

    try {
      await usersApi.delete(userToDelete.id);
      setSuccess(`Usuario ${userToDelete.firstName} ${userToDelete.lastName} eliminado correctamente`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const toggleOwnerExpand = (ownerId: string) => {
    const newExpanded = new Set(expandedOwners);
    if (newExpanded.has(ownerId)) {
      newExpanded.delete(ownerId);
    } else {
      newExpanded.add(ownerId);
    }
    setExpandedOwners(newExpanded);
  };

  // Verificar si el Admin puede gestionar este usuario
  const canAdminManage = (user: User): boolean => {
    // Si el usuario a gestionar es él mismo, siempre puede (editar perfil propio)
    if (user.id === currentUser?.id) return true;

    // No se puede gestionar ASSIGNED_MANAGER desde aquí
    if (user.role === 'ASSIGNED_MANAGER') {
      return false;
    }

    // Si el usuario logueado es ADMIN (no superadmin)
    if (currentUser?.role === 'ADMIN') {
      const residenceId = currentResidence?.id || currentUser.residenceId;
      const isMain = residenceId ? isMainAdminFor(residenceId) : false;

      // Si el objetivo es otro ADMIN, solo el PRINCIPAL puede gestionarlo
      if (user.role === 'ADMIN' && !isMain) {
        return false;
      }
    }

    // Solo SUPERADMIN puede gestionar administradores principales (isMainAdmin flag de la API)
    if ((user as any).isMainAdmin && currentUser?.role !== 'SUPERADMIN') {
      return false;
    }

    return true;
  };

  // Filtrar usuarios (Optimizado)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filterRole && user.role !== filterRole) return false;
      if (filterActive === 'active' && !user.isActive) return false;
      if (filterActive === 'inactive' && user.isActive) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const phone = user.phone ? user.phone.toLowerCase() : '';

        if (
          !fullName.includes(term) &&
          !user.email.toLowerCase().includes(term) &&
          !phone.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [users, filterRole, filterActive, searchTerm]);

  // Filtrar jerarquía (Optimizado)
  const filteredHierarchy = useMemo(() => {
    return hierarchy.filter(owner => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();

      // Buscar por nombre de propietario o email o teléfono
      const ownerName = `${owner.firstName} ${owner.lastName}`.toLowerCase();
      const ownerPhone = owner.phone ? owner.phone.toLowerCase() : '';

      if (
        ownerName.includes(term) ||
        owner.email.toLowerCase().includes(term) ||
        ownerPhone.includes(term)
      ) return true;

      // Buscar en sus departamentos/managers
      return owner.ownedApartments.some(apt => {
        // Buscar por manager
        if (apt.manager) {
          const managerName = `${apt.manager.firstName} ${apt.manager.lastName}`.toLowerCase();
          const managerPhone = apt.manager.phone ? apt.manager.phone.toLowerCase() : '';

          if (
            managerName.includes(term) ||
            apt.manager.email.toLowerCase().includes(term) ||
            managerPhone.includes(term)
          ) return true;
        }
        // Buscar por numero de depto
        if (apt.number.toLowerCase().includes(term)) return true;

        return false;
      });
    });
  }, [hierarchy, searchTerm]);

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-1">Administra todos los usuarios del sistema</p>
            </div>
            <button
              onClick={() => {
                setEditingUser(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-primary text-white px-8 py-3 rounded-[var(--radius-sm)] 
                         hover:bg-primary/90 active:scale-[0.97] transition-all 
                         flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest 
                         shadow-lg shadow-primary/20 border border-primary/20"
            >
              <span className="material-symbols-outlined text-xl">person_add</span>
              NUEVO USUARIO
            </button>
          </div>




          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-sm)] font-bold text-[10px] tracking-[0.15em] uppercase transition-all duration-200 border ${viewMode === 'list'
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-[#F8FAFC] text-gray-500 border-gray-200 hover:text-gray-900 hover:border-gray-400'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">list</span>
                  TODOS
                </button>
                <button
                  onClick={() => setViewMode('hierarchy')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-sm)] font-bold text-[10px] tracking-[0.15em] uppercase transition-all duration-200 border ${viewMode === 'hierarchy'
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-[#F8FAFC] text-gray-500 border-gray-200 hover:text-gray-900 hover:border-gray-400'
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  JERARQUÍA
                </button>
              </div>

              {/* Filtros Globales */}
              <div className="flex gap-4 w-full md:w-auto">
                {/* Filtro por Rol (Global) */}
                <div className="w-full md:w-48">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
                    className="w-full border border-gray-200 rounded-[var(--radius-sm)] px-4 py-2 
                               focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-[42px] 
                               text-[11px] font-bold uppercase tracking-widest bg-white text-gray-700 shadow-sm transition-all"
                  >
                    <option value="">Todos los roles</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="OWNER">Propietario</option>
                    <option value="ASSIGNED_MANAGER">Responsable Asignado</option>
                    <option value="CONCIERGE">Conserje</option>
                  </select>
                </div>

                {/* Buscador */}
                <div className="w-full md:w-96 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400">search</span>
                  </span>
                  <input
                    type="text"
                    placeholder={
                      viewMode === 'list'
                        ? "Buscar por nombre, email, teléfono..."
                        : "Buscar propietario, responsable o departamento..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] pl-10 pr-4 py-2.5 
                               focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : viewMode === 'list' ? (
            /* Vista Lista */
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)] overflow-hidden shadow-sm animate-in fade-in duration-500">
              {/* Filtros */}
              <div className="p-4 bg-gray-50 border-b flex gap-4 flex-wrap">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                    className="border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 
                               focus:outline-none focus:ring-1 focus:ring-primary text-sm bg-white"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <span className="text-sm text-gray-600">
                    {filteredUsers.length} de {users.length} usuarios
                  </span>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Usuario</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Rol</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Estado</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Último Acceso</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Creado</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-900 uppercase tracking-widest border-b">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-4xl text-gray-300">group_off</span>
                            <div className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">
                              {searchTerm ? 'No se encontraron usuarios que coincidan' : 'No hay usuarios registrados'}
                            </div>
                            {searchTerm && (
                              <button 
                                onClick={() => setSearchTerm('')}
                                className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
                              >
                                Limpiar búsqueda
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <UserTableRow 
                          key={user.id} 
                          user={user} 
                          canManage={canAdminManage(user)} 
                          onEdit={handleEdit} 
                          onToggleActive={handleToggleActive} 
                          onReset={handleGenerateResetLink} 
                          onDelete={canDelete ? handleDelete : undefined} 
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Vista Jerárquica */
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-sm)] border border-[var(--color-border)] overflow-hidden shadow-sm animate-in fade-in duration-500">
              <div className="p-5 bg-[var(--color-background-subtle)] border-b border-[var(--color-border)]">
                <h2 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">account_tree</span>
                  Propietarios → Responsables → Departamentos
                </h2>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-600">Haz clic en un propietario para expandir su información</p>
                  <span className="text-sm text-gray-500">
                    {filteredHierarchy.length} de {hierarchy.length} propietarios
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredHierarchy.length === 0 ? (
                  <div className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-gray-300">account_tree</span>
                      <div className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">
                        {searchTerm ? 'No se encontraron registros que coincidan' : 'No hay propietarios registrados'}
                      </div>
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredHierarchy.map((owner) => (
                    <HierarchyOwnerCard 
                      key={owner.id} 
                      owner={owner} 
                      isExpanded={expandedOwners.has(owner.id)} 
                      onToggleExpand={toggleOwnerExpand} 
                      canDelete={canDelete} 
                      onEdit={handleEdit} 
                      onToggleActive={handleToggleActive} 
                      onReset={handleGenerateResetLink} 
                      onDelete={canDelete ? handleDelete : undefined} 
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setError('');
          setSuccess('');
        }}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <UserModalContent 
          editingUser={editingUser}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          error={error}
          success={success}
          isPhoneValid={isPhoneValid}
          setIsPhoneValid={setIsPhoneValid}
          currentUser={currentUser}
          isMainAdminFor={isMainAdminFor}
          currentResidenceId={currentResidenceId}
        />
      </Modal>

      {/* Modal for Setup Link */}
      <SetupLinkModal 
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        setupLink={setupLink}
        userName={recentlyCreatedUser}
        isReset={isResetLink}
      />
    </Layout>
  );
};
