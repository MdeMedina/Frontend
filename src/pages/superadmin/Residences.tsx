import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { residencesApi, type Residence } from '../../api/residences';
import { usersApi, type UpdateUserDto } from '../../api/users';
import { Layout } from '../../components/Layout';
import { formatPhoneNumber } from '../../utils/phone';
import { PhoneInput } from '../../components/PhoneInput';
import { Modal } from '../../components/Modal';

export default function Residences() {
  const navigate = useNavigate();
  const { startImpersonation, stopImpersonation } = useAuth();
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState<Residence | null>(null);
  const [editingResidence, setEditingResidence] = useState<Residence | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<{ id: string; firstName: string; lastName: string; email: string; phone?: string } | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [newAdminData, setNewAdminData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [adminFormData, setAdminFormData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [createAdmin, setCreateAdmin] = useState(true); // Por defecto, crear administrador al crear residencia
  const [assignAdmin, setAssignAdmin] = useState(false); // Opción para asignar administrador al editar
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [availableAdmins, setAvailableAdmins] = useState<Array<{ id: string; email: string; firstName: string; lastName: string; phone?: string; residenceId?: string; residence?: { id: string; name: string } }>>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [isAdminPhoneValid, setIsAdminPhoneValid] = useState(true);

  useEffect(() => {
    stopImpersonation();
    fetchResidences();
  }, []);

  const fetchResidences = async () => {
    try {
      setLoading(true);
      const data = await residencesApi.getAll();
      setResidences(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar residencias');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (residence?: Residence) => {
    // Cargar administradores disponibles siempre (para crear y editar)
    await fetchAvailableAdmins();

    if (residence) {
      // Cargar detalles completos de la residencia incluyendo administradores
      const detailed = await residencesApi.getById(residence.id);
      setEditingResidence(detailed);
      setFormData({ name: detailed.name });
      setCreateAdmin(false); // Al editar, no se crea administrador por defecto
      setAssignAdmin(false);
      setSelectedAdminId('');
    } else {
      setEditingResidence(null);
      setFormData({ name: '' });
      setNewAdminData({ firstName: '', lastName: '', email: '', phone: '+56' });
      setCreateAdmin(false); // Al crear, por defecto ninguna opción seleccionada
      setAssignAdmin(false);
      setSelectedAdminId('');
    }
    setShowModal(true);
    setError(null);
  };

  const fetchAvailableAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const admins = await residencesApi.getAvailableAdmins(true);
      setAvailableAdmins(admins);
    } catch (err: any) {
      console.error('Error al cargar administradores:', err);
      setError(err.response?.data?.message || 'Error al cargar administradores disponibles');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingResidence(null);
    setFormData({ name: '' });
    setNewAdminData({ firstName: '', lastName: '', email: '', phone: '' });
    setCreateAdmin(true);
    setAssignAdmin(false);
    setSelectedAdminId('');
    setAvailableAdmins([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar teléfono si se está creando un admin
    if (createAdmin && newAdminData.phone && !isPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }

    try {
      // Determinar qué acción de administrador se quiere realizar
      let admin;
      if (assignAdmin && selectedAdminId) {
        // Asignar administrador existente
        admin = { userId: selectedAdminId };
      } else if (createAdmin && newAdminData.email && newAdminData.firstName && newAdminData.lastName) {
        // Crear nuevo administrador
        admin = {
          email: newAdminData.email,
          firstName: newAdminData.firstName,
          lastName: newAdminData.lastName,
          phone: newAdminData.phone || undefined,
        };
      }

      if (editingResidence) {
        await residencesApi.update(editingResidence.id, formData.name, admin);
        // Actualizar la residencia en edición con los datos actualizados
        const updated = await residencesApi.getById(editingResidence.id);
        setEditingResidence(updated);
      } else {
        await residencesApi.create(formData.name, admin);
      }
      await fetchResidences();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar residencia');
    }
  };

  const handleToggleActive = async (residence: Residence) => {
    try {
      await residencesApi.toggleActive(residence.id);
      await fetchResidences();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar residencia');
    }
  };

  const handleDelete = async (residence: Residence) => {
    if (!confirm(`¿Estás seguro de eliminar la residencia "${residence.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await residencesApi.delete(residence.id);
      await fetchResidences();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar residencia');
    }
  };

  const handleViewDetails = async (residence: Residence) => {
    try {
      const detailed = await residencesApi.getById(residence.id);
      setSelectedResidence(detailed);
      setShowDetailsModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar detalles de la residencia');
    }
  };

  const handleEditAdmin = (admin: { id: string; firstName: string; lastName: string; email: string; phone?: string }) => {
    setEditingAdmin(admin);
    setAdminFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phone: admin.phone || '+56',
    });
    setShowEditAdminModal(true);
    setError(null);
  };

  const handleCloseEditAdminModal = () => {
    setShowEditAdminModal(false);
    setEditingAdmin(null);
    setAdminFormData({ firstName: '', lastName: '', email: '', phone: '+56' });
    setError(null);
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!selectedResidence) return;

    const admin = selectedResidence.admins?.find(a => a.id === adminId);
    if (!admin) return;

    const confirmMessage = `¿Estás seguro de remover a ${admin.firstName} ${admin.lastName} de esta residencia?\n\nSi este administrador no tiene otras residencias asignadas, su cuenta será desactivada.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setError(null);
      const result = await residencesApi.removeAdmin(selectedResidence.id, adminId);

      // Actualizar la residencia seleccionada
      const updated = await residencesApi.getById(selectedResidence.id);
      setSelectedResidence(updated);

      // Actualizar la lista de residencias
      await fetchResidences();

      // Mostrar mensaje de éxito
      alert(result.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al remover administrador');
    }
  };

  const handleSetMainAdmin = async (adminId: string) => {
    if (!editingResidence) return;

    if (!confirm('¿Estás seguro de designar a este administrador como Principal? El administrador principal actual dejará de serlo.')) {
      return;
    }

    try {
      setError(null);
      const result = await residencesApi.setMainAdmin(editingResidence.id, adminId);

      // Actualizar la residencia en edición
      const updated = await residencesApi.getById(editingResidence.id);
      setEditingResidence(updated);

      // Actualizar la lista de residencias
      await fetchResidences();

      alert(result.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar administrador principal');
    }
  };

  const handleSubmitAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingAdmin) return;

    // Validar teléfono
    if (adminFormData.phone && !isAdminPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }

    try {
      const updateData: UpdateUserDto = {
        firstName: adminFormData.firstName,
        lastName: adminFormData.lastName,
        email: adminFormData.email,
        phone: adminFormData.phone || undefined,
      };
      await usersApi.update(editingAdmin.id, updateData);
      // Actualizar la residencia seleccionada con los datos actualizados
      if (selectedResidence) {
        const updated = await residencesApi.getById(selectedResidence.id);
        setSelectedResidence(updated);
      }
      // Actualizar la lista de residencias
      await fetchResidences();
      handleCloseEditAdminModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar administrador');
    }
  };

  // Filtrar residencias por búsqueda (nombre de residencia o nombre de administrador)
  const filteredResidences = useMemo(() => {
    if (!searchTerm) return residences;
    const term = searchTerm.toLowerCase();
    return residences.filter(residence => {
      // Buscar por nombre de residencia
      if (residence.name.toLowerCase().includes(term)) {
        return true;
      }
      // Buscar por nombre de administrador
      if (residence.admins && residence.admins.length > 0) {
        return residence.admins.some(admin =>
          `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(term) ||
          admin.firstName.toLowerCase().includes(term) ||
          admin.lastName.toLowerCase().includes(term) ||
          admin.email.toLowerCase().includes(term)
        );
      }
      return false;
    });
  }, [residences, searchTerm]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Cargando residencias...</div>
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
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Residencias</h1>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Nueva Residencia
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
            Buscar Residencia o Administrador
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de residencia o nombre de administrador..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuarios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Torres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administradores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResidences.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron residencias con ese nombre' : 'No hay residencias registradas'}
                  </td>
                </tr>
              ) : (
                filteredResidences.map((residence) => (
                  <tr key={residence.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{residence.name}</div>

                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${residence.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {residence.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {residence._count?.users || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {residence._count?.buildings || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {residence._count?.apartments || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {residence._count?.stays || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {residence.admins && residence.admins.length > 0 ? (
                        <div>
                          {residence.admins.slice(0, 2).map((admin) => (
                            <div key={admin.id} className="text-sm flex items-center gap-1">
                              <span>{admin.firstName} {admin.lastName}</span>
                              {admin.isMain && (
                                <span className="text-amber-500 text-xs" title="Administrador Principal">★</span>
                              )}
                            </div>
                          ))}
                          {residence.admins.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{residence.admins.length - 2} más
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin administradores</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          startImpersonation(residence.id, residence.name);
                          navigate('/admin');
                        }}
                        className="bg-amber-100 text-amber-800 px-3 py-1 rounded hover:bg-amber-200 transition-colors"
                        title="Gestionar como Administrador"
                      >
                        Gestionar
                      </button>
                      <button
                        onClick={() => handleViewDetails(residence)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        Detalles
                      </button>
                      <button
                        onClick={() => handleOpenModal(residence)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(residence)}
                        className={`${residence.isActive
                            ? 'text-yellow-600 hover:text-yellow-900'
                            : 'text-green-600 hover:text-green-900'
                          }`}
                      >
                        {residence.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      {!residence.isActive && (!residence._count ||
                        (residence._count.users === 0 &&
                          residence._count.buildings === 0 &&
                          residence._count.apartments === 0 &&
                          residence._count.stays === 0)) && (
                          <button
                            onClick={() => handleDelete(residence)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingResidence ? 'Editar Residencia' : 'Nueva Residencia'}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Residencia
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              placeholder="Ej: Residencia Principal"
            />
          </div>

          {/* Campos del administrador - Al editar */}
          {editingResidence && (
            <>
              {/* Administradores actuales */}
              {editingResidence.admins && editingResidence.admins.length > 0 && (
                <div className="mb-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Administradores Actuales ({editingResidence.admins.length})
                  </h3>
                  <div className="space-y-2">
                    {editingResidence.admins.map((admin) => (
                      <div
                        key={admin.id}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">
                              {admin.firstName} {admin.lastName}
                            </div>
                            {admin.isMain && (
                              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-200">
                                Principal
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {admin.email}
                            {admin.phone && ` • ${formatPhoneNumber(admin.phone)}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!admin.isMain && (
                            <button
                              type="button"
                              onClick={() => handleSetMainAdmin(admin.id)}
                              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            >
                              Principal
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmMessage = `¿Estás seguro de remover a ${admin.firstName} ${admin.lastName} de esta residencia?\n\nSi este administrador no tiene otras residencias asignadas, su cuenta será desactivada.`;

                              if (!confirm(confirmMessage)) {
                                return;
                              }

                              try {
                                setError(null);
                                const result = await residencesApi.removeAdmin(editingResidence.id, admin.id);

                                // Actualizar la residencia en edición con los datos actualizados
                                const updated = await residencesApi.getById(editingResidence.id);
                                setEditingResidence(updated);

                                // Actualizar la lista de residencias
                                await fetchResidences();

                                // Mostrar mensaje de éxito
                                alert(result.message);
                              } catch (err: any) {
                                setError(err.response?.data?.message || 'Error al remover administrador');
                              }
                            }}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Agregar Administrador</h3>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="assignAdmin"
                      checked={assignAdmin}
                      onChange={(e) => {
                        setAssignAdmin(e.target.checked);
                        if (e.target.checked) {
                          setCreateAdmin(false);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="assignAdmin" className="ml-2 block text-sm font-medium text-gray-700">
                      Asignar administrador existente
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="createNewAdmin"
                      checked={createAdmin}
                      onChange={(e) => {
                        setCreateAdmin(e.target.checked);
                        if (e.target.checked) {
                          setAssignAdmin(false);
                          setSelectedAdminId('');
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createNewAdmin" className="ml-2 block text-sm font-medium text-gray-700">
                      Crear nuevo administrador
                    </label>
                  </div>
                </div>

                {/* Selector de administrador existente */}
                {assignAdmin && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Administrador
                    </label>
                    {loadingAdmins ? (
                      <div className="text-sm text-gray-500">Cargando administradores...</div>
                    ) : (
                      <select
                        value={selectedAdminId}
                        onChange={(e) => setSelectedAdminId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={assignAdmin}
                      >
                        <option value="">Seleccione un administrador</option>
                        {availableAdmins.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.firstName} {admin.lastName} ({admin.email})
                            {admin.residence ? ` - Actual: ${admin.residence.name}` : ' - Sin residencia'}
                          </option>
                        ))}
                      </select>
                    )}
                    {availableAdmins.length === 0 && !loadingAdmins && (
                      <p className="text-sm text-gray-500 mt-2">No hay administradores disponibles</p>
                    )}
                  </div>
                )}

                {/* Campos para crear nuevo administrador */}
                {createAdmin && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Datos del Nuevo Administrador</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={newAdminData.firstName}
                        onChange={(e) => setNewAdminData({ ...newAdminData, firstName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={createAdmin}
                        placeholder="Nombre"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={newAdminData.lastName}
                        onChange={(e) => setNewAdminData({ ...newAdminData, lastName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={createAdmin}
                        placeholder="Apellido"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newAdminData.email}
                        onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={createAdmin}
                        placeholder="email@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono (Opcional)
                      </label>
                      <PhoneInput
                        value={newAdminData.phone || '+56'}
                        onChange={(value) => setNewAdminData({ ...newAdminData, phone: value })}
                        onValidationChange={(isValid) => setIsPhoneValid(isValid)}
                      />
                    </div>

                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                      La contraseña predeterminada será: <strong>12345678</strong>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Campos del administrador - Al crear */}
          {!editingResidence && (
            <>
              <div className="mb-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Gestionar Administrador</h3>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="assignAdminCreate"
                      checked={assignAdmin}
                      onChange={(e) => {
                        setAssignAdmin(e.target.checked);
                        if (e.target.checked) {
                          setCreateAdmin(false);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="assignAdminCreate" className="ml-2 block text-sm font-medium text-gray-700">
                      Asignar administrador existente
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="createAdminCreate"
                      checked={createAdmin}
                      onChange={(e) => {
                        setCreateAdmin(e.target.checked);
                        if (e.target.checked) {
                          setAssignAdmin(false);
                          setSelectedAdminId('');
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createAdminCreate" className="ml-2 block text-sm font-medium text-gray-700">
                      Crear nuevo administrador
                    </label>
                  </div>
                </div>

                {/* Selector de administrador existente */}
                {assignAdmin && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Administrador
                    </label>
                    {loadingAdmins ? (
                      <div className="text-sm text-gray-500">Cargando administradores...</div>
                    ) : (
                      <select
                        value={selectedAdminId}
                        onChange={(e) => setSelectedAdminId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required={assignAdmin}
                      >
                        <option value="">Seleccione un administrador</option>
                        {availableAdmins.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.firstName} {admin.lastName} ({admin.email})
                            {admin.residence ? ` - Actual: ${admin.residence.name}` : ' - Sin residencia'}
                          </option>
                        ))}
                      </select>
                    )}
                    {availableAdmins.length === 0 && !loadingAdmins && (
                      <p className="text-sm text-gray-500 mt-2">No hay administradores disponibles</p>
                    )}
                  </div>
                )}
              </div>

              {createAdmin && (
                <div className="mb-4 bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Datos del Administrador</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={newAdminData.firstName}
                      onChange={(e) => setNewAdminData({ ...newAdminData, firstName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={createAdmin}
                      placeholder="Nombre"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={newAdminData.lastName}
                      onChange={(e) => setNewAdminData({ ...newAdminData, lastName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={createAdmin}
                      placeholder="Apellido"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={createAdmin}
                      placeholder="email@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono (Opcional)
                    </label>
                    <PhoneInput
                      value={newAdminData.phone || '+56'}
                      onChange={(value) => setNewAdminData({ ...newAdminData, phone: value })}
                      onValidationChange={(isValid) => setIsPhoneValid(isValid)}
                    />
                  </div>

                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    La contraseña predeterminada será: <strong>12345678</strong>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {editingResidence ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de detalles */}
      <Modal
        isOpen={showDetailsModal && !!selectedResidence}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedResidence(null);
        }}
        title="Detalles de la Residencia"
        width="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Información básica */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Información General</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Nombre:</span>
                <span className="ml-2 font-medium">{selectedResidence?.name}</span>
              </div>
              <div>
                <span className="text-gray-500">Estado:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${selectedResidence?.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                  }`}>
                  {selectedResidence?.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Creada:</span>
                <span className="ml-2">
                  {selectedResidence && new Date(selectedResidence.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Estadísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Usuarios</div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedResidence?._count?.users || 0}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Torres</div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedResidence?._count?.buildings || 0}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Departamentos</div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedResidence?._count?.apartments || 0}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Reservas</div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedResidence?._count?.stays || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Administradores */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">
              Administradores ({selectedResidence?.admins?.length || 0})
            </h3>
            {selectedResidence?.admins && selectedResidence.admins.length > 0 ? (
              <div className="space-y-3">
                {selectedResidence.admins.map((admin) => (
                  <div key={admin.id} className="bg-white p-3 rounded border border-green-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {admin.firstName} {admin.lastName}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Email: {admin.email}</div>
                          {admin.phone && <div>Teléfono: {formatPhoneNumber(admin.phone)}</div>}
                          {admin.lastLogin && (
                            <div>
                              Último acceso: {new Date(admin.lastLogin).toLocaleString('es-ES')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {admin.isMain && (
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Principal
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          Administrador
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Esta residencia no tiene administradores asignados.
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedResidence(null);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de edición de administrador */}
      <Modal
        isOpen={showEditAdminModal && !!editingAdmin}
        onClose={handleCloseEditAdminModal}
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
              placeholder="Nombre"
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
              placeholder="Apellido"
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
              placeholder="email@ejemplo.com"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono (Opcional)
            </label>
            <PhoneInput
              value={adminFormData.phone || '+56'}
              onChange={(value) => setAdminFormData({ ...adminFormData, phone: value })}
              onValidationChange={(isValid) => setIsAdminPhoneValid(isValid)}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCloseEditAdminModal}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
