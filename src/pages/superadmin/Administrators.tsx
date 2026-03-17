import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { residencesApi } from '../../api/residences';
import { usersApi, type UpdateUserDto } from '../../api/users';
import { Layout } from '../../components/Layout';
import { formatPhoneNumber } from '../../utils/phone';
import { PhoneInput } from '../../components/PhoneInput';
import { SearchableSelect } from '../../components/SearchableSelect';
import { Modal } from '../../components/Modal';
import { handleRutInput } from '../../utils/rut';

type AdminWithResidences = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  rut?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  residences: Array<{
    id: string;
    name: string;
    isMain?: boolean;
  }>;
};

export default function Administrators() {
  const navigate = useNavigate();
  const { stopImpersonation } = useAuth();
  const [admins, setAdmins] = useState<AdminWithResidences[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResidencesModal, setShowResidencesModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminWithResidences | null>(null);
  const [adminFormData, setAdminFormData] = useState({ firstName: '', lastName: '', email: '', rut: '', phone: '+56', password: '', residenceId: '' });
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [availableResidences, setAvailableResidences] = useState<{ id: string, name: string }[]>([]);
  const [selectedResidenceToAssign, setSelectedResidenceToAssign] = useState<string>('');

  useEffect(() => {
    stopImpersonation();
    fetchAdmins();
    fetchResidences();
    // Verificar si hay parámetro de crear en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setShowCreateModal(true);
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchResidences = async () => {
    try {
      const data = await residencesApi.getAll();
      setAvailableResidences(data);
    } catch (error) {
      console.error('Error al cargar residencias:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      // Obtener todos los administradores (incluyendo inactivos)
      const availableAdmins = await residencesApi.getAvailableAdmins(true);

      // Obtener información adicional de cada administrador desde el API de usuarios
      const adminsWithDetails = await Promise.all(
        availableAdmins.map(async (admin) => {
          try {
            const userDetails = await usersApi.getById(admin.id);
            return {
              id: admin.id,
              email: admin.email,
              firstName: admin.firstName,
              lastName: admin.lastName,
              rut: (userDetails as any).rut,
              phone: admin.phone,
              isActive: userDetails.isActive,
              lastLogin: userDetails.lastLogin,
              createdAt: userDetails.createdAt,
              residences: admin.residences || (admin.residence ? [admin.residence] : []),
            };
          } catch {
            // Si falla obtener detalles, usar datos básicos
            return {
              id: admin.id,
              email: admin.email,
              firstName: admin.firstName,
              lastName: admin.lastName,
              phone: admin.phone,
              isActive: true, // Asumir activo si no se pueden cargar detalles
              createdAt: new Date().toISOString(), // Fallback
              residences: admin.residences || (admin.residence ? [admin.residence] : []),
            };
          }
        })
      );

      setAdmins(adminsWithDetails);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar administradores por búsqueda
  const filteredAdmins = useMemo(() => {
    if (!searchTerm) return admins;
    const term = searchTerm.toLowerCase();
    return admins.filter(admin =>
      admin.firstName.toLowerCase().includes(term) ||
      admin.lastName.toLowerCase().includes(term) ||
      `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(term) ||
      admin.email.toLowerCase().includes(term) ||
      (admin.rut && admin.rut.toLowerCase().includes(term)) ||
      admin.residences.some(r => r.name.toLowerCase().includes(term))
    );
  }, [admins, searchTerm]);

  const handleEditAdmin = (admin: AdminWithResidences) => {
    setEditingAdmin(admin);
    setAdminFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      rut: admin.rut || '',
      phone: admin.phone || '+56',
      password: '',
      residenceId: '',
    });
    setShowEditModal(true);
    setError(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAdmin(null);
    setAdminFormData({ firstName: '', lastName: '', email: '', rut: '', phone: '+56', password: '', residenceId: '' });
    setIsPhoneValid(true);
    setError(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setAdminFormData({ firstName: '', lastName: '', email: '', rut: '', phone: '+56', password: '', residenceId: '' });
    setIsPhoneValid(true);
    setError(null);
  };

  const handleSubmitCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar teléfono
    if (adminFormData.phone && !isPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }

    // Validar contraseña
    if (!adminFormData.password || adminFormData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await usersApi.create({
        firstName: adminFormData.firstName,
        lastName: adminFormData.lastName,
        email: adminFormData.email,
        rut: adminFormData.rut,
        phone: adminFormData.phone || undefined,
        password: adminFormData.password,
        role: 'ADMIN',
        residenceId: adminFormData.residenceId || undefined, // Enviar residencia si se seleccionó
      });
      await fetchAdmins();
      handleCloseCreateModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear administrador');
    }
  };

  const handleSubmitAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingAdmin) return;

    // Validar teléfono
    if (adminFormData.phone && !isPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }

    try {
      const updateData: UpdateUserDto = {
        firstName: adminFormData.firstName,
        lastName: adminFormData.lastName,
        email: adminFormData.email,
        rut: adminFormData.rut,
        phone: adminFormData.phone || undefined,
      };
      await usersApi.update(editingAdmin.id, updateData);
      await fetchAdmins();
      handleCloseEditModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar administrador');
    }
  };

  const handleManageResidences = (admin: AdminWithResidences) => {
    setEditingAdmin(admin);
    setShowResidencesModal(true);
    setError(null);
  };

  const handleCloseResidencesModal = () => {
    setShowResidencesModal(false);
    setEditingAdmin(null);
    setSelectedResidenceToAssign('');
    setError(null);
  };

  const handleAssignResidence = async () => {
    if (!editingAdmin || !selectedResidenceToAssign) return;

    try {
      setError(null);
      const selectedResidence = availableResidences.find(r => r.id === selectedResidenceToAssign);

      // Use the residences API to assign the admin to the residence
      await residencesApi.update(
        selectedResidenceToAssign,
        selectedResidence?.name || '',
        { userId: editingAdmin.id }
      );

      // Refresh the admin list and update the modal
      await fetchAdmins();

      // Update the admin in the modal
      const updatedAdmins = await residencesApi.getAvailableAdmins(true);
      const updatedAdmin = updatedAdmins.find(a => a.id === editingAdmin.id);
      if (updatedAdmin) {
        try {
          const userDetails = await usersApi.getById(updatedAdmin.id);
          setEditingAdmin({
            ...updatedAdmin,
            rut: (userDetails as any).rut,
            isActive: userDetails.isActive,
            lastLogin: userDetails.lastLogin,
            createdAt: userDetails.createdAt,
            residences: updatedAdmin.residences || (updatedAdmin.residence ? [updatedAdmin.residence] : []),
          });
        } catch {
          setEditingAdmin({
            ...updatedAdmin,
            isActive: true,
            createdAt: new Date().toISOString(),
            residences: updatedAdmin.residences || (updatedAdmin.residence ? [updatedAdmin.residence] : []),
          });
        }
      }

      // Clear selection and show success message
      setSelectedResidenceToAssign('');
      alert(`Residencia "${selectedResidence?.name}" asignada correctamente`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar residencia');
    }
  };

  const handleRemoveResidence = async (residenceId: string) => {
    if (!editingAdmin) return;

    const residence = editingAdmin.residences.find(r => r.id === residenceId);
    if (!residence) return;

    const confirmMessage = `¿Estás seguro de remover a ${editingAdmin.firstName} ${editingAdmin.lastName} de la residencia "${residence.name}"?\n\nSi este administrador no tiene otras residencias asignadas, su cuenta será desactivada.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setError(null);
      const result = await residencesApi.removeAdmin(residenceId, editingAdmin.id);

      // Actualizar la lista de administradores
      await fetchAdmins();

      // Actualizar el administrador en el modal
      const updatedAdmins = await residencesApi.getAvailableAdmins(true);
      const updatedAdmin = updatedAdmins.find(a => a.id === editingAdmin.id);
      if (updatedAdmin) {
        try {
          const userDetails = await usersApi.getById(updatedAdmin.id);
          setEditingAdmin({
            ...updatedAdmin,
            rut: (userDetails as any).rut,
            isActive: userDetails.isActive,
            lastLogin: userDetails.lastLogin,
            createdAt: userDetails.createdAt,
            residences: updatedAdmin.residences || (updatedAdmin.residence ? [updatedAdmin.residence] : []),
          });
        } catch {
          setEditingAdmin({
            ...updatedAdmin,
            isActive: true,
            createdAt: new Date().toISOString(),
            residences: updatedAdmin.residences || (updatedAdmin.residence ? [updatedAdmin.residence] : []),
          });
        }
      }

      // Mostrar mensaje de éxito
      alert(result.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al remover residencia');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Cargando administradores...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/superadmin')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Volver al Inicio
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Administradores</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Crear Administrador
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Filtro de búsqueda */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Administrador
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, RUT, email o residencia..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Administradores</div>
            <div className="text-2xl font-bold text-gray-800">{admins.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Administradores Activos</div>
            <div className="text-2xl font-bold text-green-600">
              {admins.filter(a => a.isActive).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Administradores Inactivos</div>
            <div className="text-2xl font-bold text-red-600">
              {admins.filter(a => !a.isActive).length}
            </div>
          </div>
        </div>

        {/* Tabla de administradores */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administrador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RUT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Residencias
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron administradores' : 'No hay administradores registrados'}
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.firstName} {admin.lastName}
                      </div>
                      {admin.phone && (
                        <div className="text-sm text-gray-500">{formatPhoneNumber(admin.phone)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{admin.rut || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {admin.residences && admin.residences.length > 0 ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {admin.residences.length} {admin.residences.length === 1 ? 'residencia' : 'residencias'}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {admin.residences.slice(0, 3).map((residence) => (
                              <span
                                key={residence.id}
                                className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"
                                title={residence.name}
                              >
                                {residence.name}
                                {residence.isMain && <span title="Administrador Principal" className="text-amber-600 font-bold">★</span>}
                              </span>
                            ))}
                            {admin.residences.length > 3 && (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                +{admin.residences.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm font-medium text-red-600">0 residencias</span>
                          <div className="text-xs text-gray-400 mt-1">Cuenta inactiva</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {admin.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.lastLogin
                        ? new Date(admin.lastLogin).toLocaleString('es-ES')
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleManageResidences(admin)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Residencias ({admin.residences.length})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de edición de administrador */}
        <Modal
          isOpen={showEditModal && !!editingAdmin}
          onClose={handleCloseEditModal}
          title="Editar Administrador"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitAdminEdit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={adminFormData.firstName}
                onChange={(e) => setAdminFormData({ ...adminFormData, firstName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido
              </label>
              <input
                type="text"
                value={adminFormData.lastName}
                onChange={(e) => setAdminFormData({ ...adminFormData, lastName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT
              </label>
              <input
                type="text"
                value={adminFormData.rut || ''}
                onChange={(e) => {
                  const formatted = handleRutInput(e.target.value);
                  setAdminFormData({ ...adminFormData, rut: formatted });
                }}
                placeholder="12.345.678-9"
                maxLength={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono (Opcional)
              </label>
              <PhoneInput
                value={adminFormData.phone || '+56'}
                onChange={(value) => setAdminFormData({ ...adminFormData, phone: value })}
                onValidationChange={(isValid) => setIsPhoneValid(isValid)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal de crear administrador */}
        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          title="Crear Nuevo Administrador"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitCreateAdmin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={adminFormData.firstName}
                onChange={(e) => setAdminFormData({ ...adminFormData, firstName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido
              </label>
              <input
                type="text"
                value={adminFormData.lastName}
                onChange={(e) => setAdminFormData({ ...adminFormData, lastName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT
              </label>
              <input
                type="text"
                value={adminFormData.rut || ''}
                onChange={(e) => {
                  const formatted = handleRutInput(e.target.value);
                  setAdminFormData({ ...adminFormData, rut: formatted });
                }}
                placeholder="12.345.678-9"
                maxLength={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono (Opcional)
              </label>
              <PhoneInput
                value={adminFormData.phone || '+56'}
                onChange={(value) => setAdminFormData({ ...adminFormData, phone: value })}
                onValidationChange={(isValid) => setIsPhoneValid(isValid)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asignar Residencia (Opcional)
              </label>
              <SearchableSelect
                options={availableResidences}
                value={adminFormData.residenceId}
                onChange={(value) => setAdminFormData({ ...adminFormData, residenceId: String(value) })}
                placeholder="Buscar y seleccionar residencia..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Puedes asignar una residencia inicial ahora. Podrás agregar más después.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Crear Administrador
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal de gestión de residencias */}
        <Modal
          isOpen={showResidencesModal && !!editingAdmin}
          onClose={handleCloseResidencesModal}
          title={`Residencias de ${editingAdmin?.firstName} ${editingAdmin?.lastName}`}
          width="max-w-2xl"
        >
          <div className="max-h-[80vh] overflow-y-auto pr-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Asignar Nueva Residencia</h4>
              <div className="flex gap-2">
                <div className="flex-grow">
                  <SearchableSelect
                    options={availableResidences.filter(r => !editingAdmin?.residences.some(ar => ar.id === r.id))}
                    value={selectedResidenceToAssign}
                    onChange={(value) => setSelectedResidenceToAssign(String(value))}
                    placeholder="Seleccionar residencia..."
                  />
                </div>
                <button
                  onClick={handleAssignResidence}
                  disabled={!selectedResidenceToAssign}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Asignar
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                Total de residencias asignadas: <strong>{editingAdmin?.residences.length || 0}</strong>
              </div>
              {editingAdmin?.residences.length === 0 && (
                <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
                  ⚠️ Este administrador no tiene residencias asignadas. Su cuenta está inactiva.
                </div>
              )}
            </div>

            {editingAdmin && editingAdmin.residences.length > 0 ? (
              <div className="space-y-3">
                {editingAdmin.residences.map((residence) => (
                  <div
                    key={residence.id}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{residence.name}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveResidence(residence.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay residencias asignadas
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseResidencesModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
