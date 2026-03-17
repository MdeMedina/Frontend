import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth';
import apiClient from '../../api/client';
import { formatPhoneNumber } from '../../utils/phone';
import { PhoneInput } from '../../components/PhoneInput';
import { Modal } from '../../components/Modal';
import { SetupLinkModal } from '../../components/SetupLinkModal';
import { handleRutInput } from '../../utils/rut';

type Manager = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  rut?: string;
  rutDocumentUrl?: string; // URL del documento RUT
  isActive: boolean;
  // Departamentos asignados
  managedApartments?: {
    id: string;
    number: string;
    building: string | { name: string };
  }[];
};

type PendingManagerPetition = {
  id: string;
  type: string;
  title: string;
  status: string;
  requestedData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    managerId?: string;
  };
  createdAt: string;
};

type MyApartment = {
  id: string;
  number: string;
  building: string | { name: string };
  managerId?: string;
};

export const PropietarioManagers = () => {
  const { user } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [myApartments, setMyApartments] = useState<MyApartment[]>([]);
  const [pendingPetitions, setPendingPetitions] = useState<PendingManagerPetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal principal
  const [showModal, setShowModal] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [viewManager, setViewManager] = useState<Manager | null>(null); // New state for viewing details
  
  // Modal de enlace configuracion (para creacion directa si aplica)
  const [setupLink, setSetupLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [recentlyCreatedManager, setRecentlyCreatedManager] = useState<string>('');
  const [isResetLink, setIsResetLink] = useState(false);

  const handleGenerateResetLink = async (manager: Manager) => {
    try {
      const res = await authApi.generateResetLink(manager.id, false);
      setSetupLink(res.setupLink);
      setRecentlyCreatedManager(`${manager.firstName} ${manager.lastName}`);
      setIsResetLink(true);
      setShowLinkModal(true);
    } catch (err) {
      console.error('Error al generar link de reseteo:', err);
      alert('Error al generar enlace de reseteo');
    }
  };

  // Modal de asignación
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [managerToAssign, setManagerToAssign] = useState<Manager | null>(null);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [selectedAptId, setSelectedAptId] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    rut: '',
    apartmentId: '', // Departamento a asignar (opcional)
    phone: '',
    description: '',
    showDescription: false,
    rutDocumentUrl: '',
  });
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  const fetchManagers = async () => {
    try {
      setLoading(true);

      // Obtener los departamentos del propietario con sus responsables
      const apartmentsRes = await apiClient.get('/apartments');
      const apartments = (apartmentsRes.data.data || apartmentsRes.data).filter(
        (apt: any) => apt.owner?.id === user?.id
      );

      // Guardar mis departamentos para el select del formulario
      setMyApartments(apartments.map((apt: any) => ({
        id: apt.id,
        number: apt.number,
        building: apt.building,
        managerId: apt.manager?.id,
      })));

      // Obtener responsables (ahora filtrados por el backend)
      try {
        // El backend ahora recibe el contexto del usuario y filtra:
        // - Managers asignados a mis departamentos
        // - Managers que yo creé (via peticiones aprobadas)
        const allManagersRes = await apiClient.get('/users/managers');
        const myManagers = allManagersRes.data.data || [];

        setManagers(myManagers);
      } catch (err) {
        console.log('No se pudieron cargar los responsables', err);
      }

      // Obtener peticiones pendientes de responsables
      const petitionsRes = await apiClient.get('/petitions', { params: { limit: 100 } });
      const myPendingPetitions = (petitionsRes.data.data || []).filter(
        (p: any) =>
          (p.userId === user?.id || p.user?.id === user?.id) &&
          p.status === 'PENDING' &&
          ['CREATE_MANAGER', 'MODIFY_MANAGER', 'DELETE_MANAGER'].includes(p.type)
      );
      setPendingPetitions(myPendingPetitions);

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar responsables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [user?.id]);

  const openCreateModal = () => {
    setEditingManager(null);
    setFormData({ firstName: '', lastName: '', email: '', rut: '', phone: '+56', apartmentId: '', description: '', showDescription: false, rutDocumentUrl: '' });
    setIsPhoneValid(true);
    setShowModal(true);
  };

  const openEditModal = (manager: Manager) => {
    setEditingManager(manager);

    // Ensure phone has at least a default prefix if missing
    // In a real app we might want to auto-detect based on country
    setFormData({
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      rut: (manager as any).rut || '',
      phone: manager.phone || (manager as any).phoneNumber || '+56',
      apartmentId: '',
      description: '',
      showDescription: false,
      rutDocumentUrl: (manager as any).rutDocumentUrl || '',
    });
    setIsPhoneValid(true);
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo no debe superar los 2MB');
      return;
    }

    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      alert('Solo se permiten archivos PDF, JPG o PNG');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFormData(prev => ({ ...prev, rutDocumentUrl: response.data.url }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar teléfono
    if (!isPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }

    try {
      if (editingManager) {
        // Modificar responsable existente
        await apiClient.post('/petitions', {
          type: 'MODIFY_MANAGER',
          title: `Modificar datos de ${editingManager.firstName} ${editingManager.lastName}`,
          reason: formData.showDescription && formData.description.trim()
            ? formData.description
            : 'Sin descripción adicional',
          requestedData: {
            managerId: editingManager.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            rut: formData.rut,
            rutDocumentUrl: formData.rutDocumentUrl,
            phone: formData.phone,
          },
        });
        setSuccess('Petición para modificar responsable enviada correctamente');
      } else {
        // Crear nuevo responsable
        // const selectedApt = myApartments.find(apt => apt.id === formData.apartmentId); // Unused
        const petitionRes = await apiClient.post('/petitions', {
          type: 'CREATE_MANAGER',
          title: `Registrar nuevo responsable: ${formData.firstName} ${formData.lastName}`,
          reason: formData.showDescription && formData.description.trim()
            ? formData.description
            : 'Sin descripción adicional',
          apartmentId: formData.apartmentId || undefined,
          requestedData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            rut: formData.rut,
            rutDocumentUrl: formData.rutDocumentUrl,
            phone: formData.phone,
          },
        });
        
        const responseData = petitionRes.data?.data || petitionRes.data;
        if (responseData && responseData.setupLink) {
          setSetupLink(responseData.setupLink);
          setRecentlyCreatedManager(`${formData.firstName} ${formData.lastName}`);
          setIsResetLink(false);
          setShowLinkModal(true);
        } else {
          setSuccess('Petición para crear responsable enviada correctamente. El administrador revisará tu solicitud.');
        }
      }

      setShowModal(false);
      fetchManagers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la petición');
    }
  };

  const handleDelete = async (manager: Manager) => {
    const reason = prompt(`¿Por qué deseas eliminar a ${manager.firstName} ${manager.lastName} como responsable?`);
    if (!reason) return;

    try {
      await apiClient.post('/petitions', {
        type: 'DELETE_MANAGER',
        title: `Eliminar responsable: ${manager.firstName} ${manager.lastName}`,
        reason,
        requestedData: {
          managerId: manager.id,
          managerName: `${manager.firstName} ${manager.lastName}`,
          managerEmail: manager.email,
          // Sending raw fields as well for better compatibility
          firstName: manager.firstName,
          lastName: manager.lastName,
          email: manager.email,
          phone: manager.phone,
        },
      });
      setSuccess('Petición para eliminar responsable enviada correctamente');
      fetchManagers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la petición');
    }
  };

  const handleAssignToApartment = (manager: Manager) => {
    // Filtrar departamentos sin responsable
    const availableApts = myApartments.filter(apt => !apt.managerId);

    if (availableApts.length === 0) {
      setError('Todos tus departamentos ya tienen un responsable asignado');
      return;
    }

    setManagerToAssign(manager);
    setAssignSearchTerm('');
    setSelectedAptId('');
    setShowAssignModal(true);
  };

  const confirmAssignment = async () => {
    if (!managerToAssign || !selectedAptId) return;

    const selectedApt = myApartments.find(apt => apt.id === selectedAptId);
    if (!selectedApt) return;

    try {
      await apiClient.post('/petitions', {
        type: 'CREATE_MANAGER',
        title: `Asignar ${managerToAssign.firstName} ${managerToAssign.lastName} al departamento ${selectedApt.number}`,
        reason: `Solicito asignar a ${managerToAssign.firstName} ${managerToAssign.lastName} como responsable del departamento ${selectedApt.number}.`,
        apartmentId: selectedApt.id,
        requestedData: {
          managerId: managerToAssign.id,
          managerName: `${managerToAssign.firstName} ${managerToAssign.lastName}`,
          managerEmail: managerToAssign.email,
        },
      });
      setSuccess(`Petición para asignar responsable al departamento ${selectedApt.number} enviada correctamente`);
      setShowAssignModal(false);
      fetchManagers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la petición');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Responsables</h1>
              <p className="text-gray-600 mt-1">
                Gestiona las personas que pueden administrar tus departamentos
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <span>+</span> Nuevo Responsable
            </button>
          </div>

          {/* Mensajes */}
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

          {/* Peticiones pendientes */}
          {pendingPetitions.length > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <span>⏳</span> Peticiones Pendientes de Responsables
              </h3>
              <div className="space-y-2">
                {pendingPetitions.map((petition) => (
                  <div key={petition.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-800">{petition.title}</span>
                        <p className="text-sm text-gray-500">
                          {petition.type === 'CREATE_MANAGER' && '👤 Nuevo responsable'}
                          {petition.type === 'MODIFY_MANAGER' && '✏️ Modificación'}
                          {petition.type === 'DELETE_MANAGER' && '🗑️ Eliminación'}
                          {' • '}
                          Enviada el {new Date(petition.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                        Pendiente
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de responsables */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : managers.length === 0 && pendingPetitions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No tienes responsables asignados
              </h3>
              <p className="text-gray-600 mb-4">
                Los responsables pueden ayudarte a gestionar las reservas de tus departamentos.
              </p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Agregar mi primer responsable
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managers.map((manager) => (
                <div
                  key={manager.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {manager.firstName[0]}{manager.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {manager.firstName} {manager.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{manager.email}</p>
                        {manager.phone && (
                          <p className="text-sm text-gray-500">{formatPhoneNumber(manager.phone)}</p>
                        )}
                      </div>
                    </div>

                    {/* Departamentos asignados */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Departamentos a cargo:
                      </h4>
                      {manager.managedApartments && manager.managedApartments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {manager.managedApartments.map((apt) => (
                            <span
                              key={apt.id}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              Depto {apt.number} ({typeof apt.building === 'object' ? apt.building.name : apt.building})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-amber-600 italic">
                          ⚠️ Sin departamentos asignados
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => setViewManager(manager)}
                        className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
                      >
                        👁️ Ver
                      </button>
                      <button
                        onClick={() => openEditModal(manager)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleGenerateResetLink(manager)}
                        className="flex-1 px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition"
                        title="Generar link de reseteo (30 min)"
                      >
                        🔑 Clave
                      </button>
                      {manager.managedApartments && manager.managedApartments.length === 0 && myApartments.length > 0 && (
                        <button
                          onClick={() => handleAssignToApartment(manager)}
                          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          🏢 Asignar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(manager)}
                        className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nota informativa */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>💡 Nota:</strong> Todas las acciones sobre responsables requieren aprobación del administrador.
              Cuando envíes una petición, aparecerá en la sección "Mis Peticiones" hasta que sea procesada.
            </p>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar responsable */}
      {/* Modal para crear/editar responsable */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingManager ? 'Modificar Responsable' : 'Nuevo Responsable'}
        width="max-w-md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="responsable@email.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT
              </label>
              <input
                type="text"
                value={formData.rut || ''}
                onChange={(e) => {
                  const formatted = handleRutInput(e.target.value);
                  setFormData({ ...formData, rut: formatted });
                }}
                placeholder="12.345.678-9"
                maxLength={12} // 9 digits + 2 dots + 1 hyphen = 12 chars
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <PhoneInput
                value={formData.phone || '+56'}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                onValidationChange={(isValid) => setIsPhoneValid(isValid)}
              />
            </div>

            {!editingManager && myApartments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asignar a departamento (opcional)
                </label>
                <select
                  value={formData.apartmentId}
                  onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Sin asignar departamento</option>
                  {myApartments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      Depto {apt.number} - {typeof apt.building === 'string' ? apt.building : apt.building?.name || 'Sin torre'}
                      {apt.managerId ? ' (ya tiene responsable)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Si no seleccionas un departamento, el responsable se creará pero deberás asignarlo después.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Adjuntar RUT (PDF, JPG, PNG - Máx 2MB)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
              {formData.rutDocumentUrl && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Archivo adjuntado correctamente
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="showDesc"
                  checked={formData.showDescription}
                  onChange={(e) => setFormData({ ...formData, showDescription: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="showDesc" className="text-sm text-gray-700 cursor-pointer select-none">
                  Agregar descripción / motivo adicional
                </label>
              </div>

              {formData.showDescription && (
                <div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none"
                    placeholder={editingManager
                      ? "Describe por qué estás modificando este responsable..."
                      : "Describe por qué estás creando este responsable..."}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            * Esta solicitud será enviada al administrador para su aprobación.
            {!editingManager && ' La contraseña inicial será: 12345678'}
          </p>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            {editingManager && (
              <button
                type="button"
                onClick={() => handleGenerateResetLink(editingManager)}
                className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm font-medium"
              >
                Generar Link de Reseteo (30 min)
              </button>
            )}
            <div className={`flex gap-3 ${!editingManager ? 'w-full justify-end' : ''}`}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {editingManager ? 'Guardar Cambios' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Visualización de Detalles */}
      <Modal
        isOpen={!!viewManager}
        onClose={() => setViewManager(null)}
        title="Detalles del Responsable"
        width="max-w-2xl"
      >
        {viewManager && (
          <div className="space-y-6">
            {/* Información Personal */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase">Nombre Completo</label>
                  <p className="text-gray-900 font-medium">{viewManager.firstName} {viewManager.lastName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase">RUT</label>
                  <p className="text-gray-900 font-medium">{(viewManager as any).rut || 'No registrado'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase">Email</label>
                  <p className="text-gray-900 font-medium">{viewManager.email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase">Teléfono</label>
                  <p className="text-gray-900 font-medium">
                    {viewManager.phone ? formatPhoneNumber(viewManager.phone) : 'No registrado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Documento RUT Adjunto */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">description</span>
                Documento RUT Adjunto
              </h3>

              {(viewManager as any).rutDocumentUrl ? (
                <div className="flex justify-center items-center bg-gray-50 rounded-lg p-2 min-h-[200px]">
                  {(viewManager as any).rutDocumentUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={(viewManager as any).rutDocumentUrl}
                      className="w-full h-[400px] border-0 rounded"
                      title="RUT Preview"
                    />
                  ) : (
                    <img
                      src={(viewManager as any).rutDocumentUrl}
                      alt="RUT Preview"
                      className="max-w-full max-h-[400px] object-contain rounded"
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 italic">
                  No hay documento adjunto
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewManager(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para Asignar Responsable a Departamento */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Asignar a Departamento"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona el departamento al que deseas asignar a{' '}
            <span className="font-semibold text-gray-800">
              {managerToAssign?.firstName} {managerToAssign?.lastName}
            </span>.
          </p>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por número o torre..."
              value={assignSearchTerm}
              onChange={(e) => setAssignSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {myApartments
              .filter(apt => !apt.managerId) // Solo departamentos sin responsable
              .filter(apt => {
                const searchStr = `${apt.number} ${typeof apt.building === 'string' ? apt.building : apt.building?.name || ''}`.toLowerCase();
                return searchStr.includes(assignSearchTerm.toLowerCase());
              })
              .map(apt => (
                <div
                  key={apt.id}
                  onClick={() => setSelectedAptId(apt.id)}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition ${selectedAptId === apt.id
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`font-medium ${selectedAptId === apt.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                        Depto {apt.number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {typeof apt.building === 'string' ? apt.building : apt.building?.name || 'Sin torre'}
                      </p>
                    </div>
                    {selectedAptId === apt.id && (
                      <span className="material-symbols-outlined text-indigo-600">check_circle</span>
                    )}
                  </div>
                </div>
              ))}
            {myApartments.filter(apt => !apt.managerId).length > 0 &&
              myApartments.filter(apt => !apt.managerId).filter(apt => {
                const searchStr = `${apt.number} ${typeof apt.building === 'string' ? apt.building : apt.building?.name || ''}`.toLowerCase();
                return searchStr.includes(assignSearchTerm.toLowerCase());
              }).length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm italic">
                  No se encontraron departamentos que coincidan con la búsqueda.
                </div>
              )}
          </div>

          <div className="mt-6 flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={confirmAssignment}
              disabled={!selectedAptId}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition ${selectedAptId
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-indigo-300 cursor-not-allowed'
                }`}
            >
              Confirmar Asignación
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal for Setup Link */}
      <SetupLinkModal 
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        setupLink={setupLink}
        userName={recentlyCreatedManager}
        isReset={isResetLink}
      />
    </Layout>
  );
};
