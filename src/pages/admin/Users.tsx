import { useState, useEffect } from 'react';
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

// Roles que el Admin puede gestionar (NO incluye ASSIGNED_MANAGER)
// const ADMIN_MANAGEABLE_ROLES: UserRole[] = ['ADMIN', 'OWNER', 'CONCIERGE'];

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

  const { user: currentUser, isMainAdminFor, currentResidence } = useAuth();
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
      const [usersRes, hierarchyRes] = await Promise.all([
        usersApi.getAll({ limit: 100 }),
        usersApi.getHierarchy(),
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
  }, []);

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
    // No se puede gestionar ASSIGNED_MANAGER
    if (user.role === 'ASSIGNED_MANAGER') {
      return false;
    }

    // Solo SUPERADMIN puede gestionar administradores principales
    if (user.isMainAdmin && currentUser?.role !== 'SUPERADMIN') {
      return false;
    }

    return true;
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
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

  // Filtrar jerarquía
  const filteredHierarchy = hierarchy.filter(owner => {
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
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <span className="text-xl">+</span> Nuevo Usuario
            </button>
          </div>



          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
              <button onClick={() => setError('')} className="float-right font-bold">×</button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
              <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
            </div>
          )}

          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
              {/* Tabs */}
              <div className="flex gap-4">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  📋 Todos
                </button>
                <button
                  onClick={() => setViewMode('hierarchy')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${viewMode === 'hierarchy'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  🏗️ Propietarios / Departamentos
                </button>
              </div>

              {/* Filtros Globales */}
              <div className="flex gap-4 w-full md:w-auto">
                {/* Filtro por Rol (Global) */}
                <div className="w-full md:w-48">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-[42px]"
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
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : viewMode === 'list' ? (
            /* Vista Lista */
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Filtros */}
              <div className="p-4 bg-gray-50 border-b flex gap-4 flex-wrap">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No se encontraron usuarios con los filtros aplicados'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className={!user.isActive ? 'bg-gray-50 opacity-60' : ''}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${user.role === 'ADMIN' ? 'bg-red-500' :
                                  user.role === 'OWNER' ? 'bg-blue-500' :
                                    user.role === 'ASSIGNED_MANAGER' ? 'bg-purple-500' : 'bg-green-500'
                                  }`}>
                                  {user.firstName[0]}{user.lastName[0]}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                {user.phone && <div className="text-xs text-gray-400">{formatPhoneNumber(user.phone)}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${roleColors[user.role]}`}>
                              {roleLabels[user.role]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.lastLogin)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {canAdminManage(user) ? (
                              <>
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleToggleActive(user)}
                                  className={`mr-3 ${user.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                                >
                                  {user.isActive ? 'Desactivar' : 'Activar'}
                                </button>
                                <button
                                  onClick={() => handleGenerateResetLink(user)}
                                  className="text-orange-600 hover:text-orange-900 mr-3"
                                  title="Generar link de reseteo de contraseña (30 min)"
                                >
                                  Restablecer
                                </button>
                                {canDelete && (
                                  <button
                                    onClick={() => handleDelete(user)}
                                    className="text-red-600 hover:text-red-900 ml-3"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 italic text-xs">
                                Gestionado por Propietario
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Vista Jerárquica */
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  🏗️ Propietarios → Responsables → Departamentos
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
                  <div className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron registros que coincidan con la búsqueda' : 'No hay propietarios registrados'}
                  </div>
                ) : (
                  filteredHierarchy.map((owner) => (
                    <div key={owner.id} className="bg-white">
                      {/* Owner Row */}
                      <div
                        onClick={() => toggleOwnerExpand(owner.id)}
                        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {owner.firstName[0]}{owner.lastName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-lg font-medium text-gray-900">
                              {owner.firstName} {owner.lastName}
                              {!owner.isActive && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{owner.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center mr-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleEdit({ ...owner, role: 'OWNER' } as unknown as User)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3 text-sm font-medium"
                            >
                              Editar
                            </button>
                            <button
                               onClick={() => handleToggleActive({ ...owner, role: 'OWNER' } as unknown as User)}
                               className={`text-sm font-medium ${owner.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                                 }`}
                             >
                               {owner.isActive ? 'Desactivar' : 'Activar'}
                             </button>
                             <button
                               onClick={() => handleGenerateResetLink({ ...owner, role: 'OWNER' })}
                               className="text-orange-600 hover:text-orange-900 ml-3 text-sm font-medium"
                             >
                               Restablecer
                             </button>
                             {canDelete && (
                               <button
                                 onClick={() => handleDelete({ ...owner, role: 'OWNER' } as unknown as User)}
                                 className="text-red-600 hover:text-red-900 ml-3 text-sm font-medium"
                               >
                                 Eliminar
                               </button>
                             )}
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {owner.ownedApartments.length} departamento(s)
                          </span>
                          <span className="text-2xl text-gray-400">
                            {expandedOwners.has(owner.id) ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedOwners.has(owner.id) && (
                        <div className="bg-gray-50 px-6 py-4 border-t">
                          {owner.ownedApartments.length === 0 ? (
                            <p className="text-gray-500 italic">Sin departamentos asignados</p>
                          ) : (
                            <div className="space-y-3">
                              {owner.ownedApartments.map((apt) => (
                                <div key={apt.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        🏢 Depto {apt.number}
                                        {!apt.isActive && (
                                          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                            Inactivo
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {(typeof apt.building === 'object' ? (apt.building as any)?.name : apt.building) || 'Sin torre'} - Piso {apt.floor}
                                      </div>
                                    </div>
                                    {apt.manager ? (
                                      <div className="text-right">
                                        <div className="text-xs text-gray-500 mb-1">Responsable Asignado:</div>
                                        <div className="flex items-center gap-2">
                                          <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                            {apt.manager.firstName[0]}{apt.manager.lastName[0]}
                                          </div>
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">
                                              {apt.manager.firstName} {apt.manager.lastName}
                                              {!apt.manager.isActive && (
                                                <span className="ml-1 text-xs text-red-500">(Inactivo)</span>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-500">{apt.manager.email}</div>
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
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
              <input
                type="text"
                value={formData.rut || ''}
                onChange={(e) => {
                  const formatted = handleRutInput(e.target.value);
                  setFormData({ ...formData, rut: formatted });
                }}
                maxLength={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="12.345.678-9"
              />
              <p className="text-xs text-gray-500 mt-1">
                La contraseña será el RUT sin puntos ni guión. Si dejas el RUT vacío, se generará un enlace seguro para que el usuario configure su propia contraseña.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <PhoneInput
                value={formData.phone || '+56'}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                onValidationChange={(isValid) => setIsPhoneValid(isValid)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {/* Admin solo puede crear estos roles */}
                <option value="ADMIN">Administrador</option>
                <option value="OWNER">Propietario</option>
                <option value="CONCIERGE">Conserje</option>
                {/* ASSIGNED_MANAGER no aparece - solo lo puede crear el Propietario */}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Los Responsables Asignados solo pueden ser creados por Propietarios
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            {editingUser && (
              <button
                type="button"
                onClick={() => handleGenerateResetLink(editingUser)}
                className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm font-medium"
              >
                Generar Link de Reseteo
              </button>
            )}
            <div className={`flex gap-3 ${!editingUser ? 'w-full justify-end' : ''}`}>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </form>
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
