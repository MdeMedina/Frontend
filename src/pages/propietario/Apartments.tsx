import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { Modal } from '../../components/Modal';

type Manager = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

type Owner = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type Apartment = {
  id: string;
  number: string;
  floor: number;
  building: {
    id: string;
    name: string;
  };
  description?: string;
  isActive: boolean;
  owner?: Owner;
  manager?: Manager;
  sourceAssignments?: {
    parkingNumber: string;
    targetApartment: {
      number: string;
      building: { name: string };
      owner: { firstName: string; lastName: string };
    };
  }[];
  targetAssignments?: {
    parkingNumber: string;
    sourceApartment: {
      number: string;
      building: { name: string };
      owner: { firstName: string; lastName: string };
    };
  }[];
};

type AvailableManager = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

type PendingApartmentPetition = {
  id: string;
  type: string;
  title: string;
  status: string;
  requestedData?: any;
  createdAt: string;
};

export const PropietarioApartments = () => {
  const { user } = useAuth();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [availableManagers, setAvailableManagers] = useState<AvailableManager[]>([]);
  const [pendingPetitions, setPendingPetitions] = useState<PendingApartmentPetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Determinar si el usuario es responsable asignado
  const isManager = user?.role === 'ASSIGNED_MANAGER';

  // Modal para asignar responsable
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [assignReason, setAssignReason] = useState('');

  const fetchApartments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/apartments');

      // Filtrar según el rol del usuario
      const isManager = user?.role === 'ASSIGNED_MANAGER';
      const myApartments = (response.data.data || response.data).filter(
        (apt: Apartment) => isManager
          ? apt.manager?.id === user?.id  // Responsable ve donde está asignado
          : apt.owner?.id === user?.id     // Propietario ve sus departamentos
      );

      setApartments(myApartments);

      // Obtener peticiones pendientes de departamentos (solo para propietario)
      if (!isManager) {
        const petitionsRes = await apiClient.get('/petitions', { params: { limit: 100 } });
        const myPendingPetitions = (petitionsRes.data.data || []).filter(
          (p: any) =>
            (p.userId === user?.id || p.user?.id === user?.id) &&
            p.status === 'PENDING' &&
            ['CREATE_APARTMENT', 'MODIFY_APARTMENT', 'DELETE_APARTMENT'].includes(p.type)
        );
        setPendingPetitions(myPendingPetitions);
      }

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableManagers = async () => {
    try {
      // Obtener responsables asignados disponibles desde el nuevo endpoint
      const response = await apiClient.get('/users/managers');
      setAvailableManagers(response.data.data || []);
    } catch (err) {
      console.error('Error al cargar responsables:', err);
      // Fallback: obtener de los departamentos existentes
      try {
        const aptResponse = await apiClient.get('/apartments');
        const allApartments = aptResponse.data.data || aptResponse.data;

        const managersMap = new Map<string, AvailableManager>();
        allApartments.forEach((apt: any) => {
          if (apt.manager) {
            managersMap.set(apt.manager.id, {
              id: apt.manager.id,
              email: apt.manager.email,
              firstName: apt.manager.firstName,
              lastName: apt.manager.lastName,
              phone: apt.manager.phone,
            });
          }
        });

        setAvailableManagers(Array.from(managersMap.values()));
      } catch (fallbackErr) {
        console.error('Error en fallback de responsables:', fallbackErr);
      }
    }
  };

  useEffect(() => {
    fetchApartments();
    fetchAvailableManagers();
  }, [user?.id]);

  const openAssignModal = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setSelectedManagerId(apartment.manager?.id || '');
    setAssignReason('');
    setShowAssignModal(true);
  };

  const handleAssignManager = async () => {
    if (!selectedApartment) return;

    try {
      // Crear una petición para asignar/cambiar responsable
      const petitionType = selectedApartment.manager
        ? 'MODIFY_MANAGER'
        : 'CREATE_MANAGER';

      const title = selectedApartment.manager
        ? `Cambiar responsable del departamento ${selectedApartment.number}`
        : `Asignar responsable al departamento ${selectedApartment.number}`;

      const selectedManager = availableManagers.find(m => m.id === selectedManagerId);

      await apiClient.post('/petitions', {
        type: petitionType,
        title,
        reason: assignReason || `Solicito ${selectedApartment.manager ? 'cambiar' : 'asignar'} responsable para el departamento ${selectedApartment.number}`,
        apartmentId: selectedApartment.id,
        requestedData: {
          managerId: selectedManagerId,
          managerName: selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : null,
          managerEmail: selectedManager?.email,
        },
      });

      setSuccess('Petición enviada correctamente. El administrador revisará tu solicitud.');
      setShowAssignModal(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la petición');
    }
  };
  const handleRemoveManager = async (apartment: Apartment) => {
    if (!apartment.manager) return;

    const reason = prompt('Indica el motivo para remover al responsable:');
    if (!reason) return;

    try {
      await apiClient.post('/petitions', {
        type: 'DELETE_MANAGER',
        title: `Remover responsable del departamento ${apartment.number}`,
        reason,
        apartmentId: apartment.id,
        requestedData: {
          managerId: apartment.manager.id,
          managerName: `${apartment.manager.firstName} ${apartment.manager.lastName}`,
        },
      });

      setSuccess('Petición para remover responsable enviada correctamente.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la petición');
    }
  };

  // Modal para editar departamento
  const [showEditApartmentModal, setShowEditApartmentModal] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [editApartmentData, setEditApartmentData] = useState({
    description: '',
    parkingNumber: '',
  });

  const handleEditApartment = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setEditApartmentData({
      description: apartment.description || '',
      parkingNumber: (apartment as any).parkingNumber || '', // Assuming parkingNumber exists or will exist
    });
    setShowEditApartmentModal(true);
  };

  const submitEditApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApartment) return;

    try {
      await apiClient.post('/petitions', {
        type: 'MODIFY_APARTMENT',
        title: `Modificar departamento ${editingApartment.number}`,
        reason: `Solicito modificar los datos del departamento ${editingApartment.number}.`,
        apartmentId: editingApartment.id,
        requestedData: {
          description: editApartmentData.description,
          parkingNumber: editApartmentData.parkingNumber,
        },
      });
      setSuccess('Petición para modificar departamento enviada correctamente.');
      setShowEditApartmentModal(false);
      fetchApartments(); // Refresh to ensure we have latest state (though modifications are pending)
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la petición');
    }
  };

  const handleDeleteApartment = async (apartment: Apartment) => {
    const reason = prompt(`¿Por qué deseas eliminar el departamento ${apartment.number}?`);
    if (!reason) return;

    try {
      await apiClient.post('/petitions', {
        type: 'DELETE_APARTMENT',
        title: `Eliminar departamento ${apartment.number}`,
        reason: reason,
        apartmentId: apartment.id,
        requestedData: {
          number: apartment.number,
          building: apartment.building.name
        }
      });
      setSuccess('Petición para eliminar departamento enviada correctamente.');
      fetchApartments();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar la petición');
    }
  };
  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isManager ? 'Departamentos Asignados' : 'Mis Departamentos'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isManager
                  ? 'Departamentos que tienes a cargo como responsable'
                  : 'Gestiona tus departamentos y solicita nuevos'
                }
              </p>
            </div>

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

          {/* Peticiones pendientes de departamentos */}
          {!isManager && pendingPetitions.length > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <span>⏳</span> Peticiones Pendientes de Departamentos
              </h3>
              <div className="space-y-2">
                {pendingPetitions.map((petition) => (
                  <div key={petition.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-800">{petition.title}</span>
                        <p className="text-sm text-gray-500">
                          {petition.type === 'CREATE_APARTMENT' && '🏢 Nuevo departamento'}
                          {petition.type === 'MODIFY_APARTMENT' && '✏️ Modificación'}
                          {petition.type === 'DELETE_APARTMENT' && '🗑️ Dar de baja'}
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

          {/* Lista de departamentos */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : apartments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No tienes departamentos registrados
              </h3>
              <p className="text-gray-600">
                Puedes crear una petición al administrador para registrar un nuevo departamento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apartments.map((apartment) => (
                <div
                  key={apartment.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className={`h-2 ${apartment.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Depto {apartment.number}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {apartment.building?.name || 'Sin torre'} • Piso {apartment.floor}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${apartment.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {apartment.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {apartment.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {apartment.description}
                      </p>
                    )}

                    {/* Info Estacionamiento */}
                    <div className="mb-4">
                      {/* Caso 1: Tiene estacionamiento propio y NO lo ha prestado */}
                      {(apartment as any).parkingNumber && (!apartment.sourceAssignments || apartment.sourceAssignments.length === 0) && (
                        <p className="text-gray-600 text-sm font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">local_parking</span>
                          Estacionamiento: {(apartment as any).parkingNumber}
                        </p>
                      )}

                      {/* Caso 2: Tiene estacionamiento propio PERO lo prestó */}
                      {apartment.sourceAssignments && apartment.sourceAssignments.length > 0 && (
                        <div className="bg-pink-50 border border-pink-100 rounded p-2 text-xs">
                          <p className="text-pink-800 font-bold flex items-center gap-1 mb-1">
                            <span className="material-symbols-outlined text-sm">local_parking</span>
                            Estacionamiento {(apartment as any).parkingNumber || apartment.sourceAssignments[0].parkingNumber || 'Asignado'} Prestado
                          </p>
                          <p className="text-pink-600">
                            Prestado a Depto {apartment.sourceAssignments[0].targetApartment.number} ({apartment.sourceAssignments[0].targetApartment.building.name})
                          </p>
                        </div>
                      )}

                      {/* Caso 3: Recibió un estacionamiento prestado (adicional o unico) */}
                      {apartment.targetAssignments && apartment.targetAssignments.length > 0 && (
                        <div className="mt-2 bg-blue-50 border border-blue-100 rounded p-2 text-xs">
                          <p className="text-blue-800 font-bold flex items-center gap-1 mb-1">
                            <span className="material-symbols-outlined text-sm">local_parking</span>
                            Estacionamiento Asignado Temporalmente
                          </p>
                          <p className="text-blue-600">
                            Depto {apartment.targetAssignments[0].sourceApartment.number} ({apartment.targetAssignments[0].sourceApartment.building.name})
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Responsable asignado */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Responsable Asignado
                      </h4>
                      {apartment.manager ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {apartment.manager.firstName[0]}{apartment.manager.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {apartment.manager.firstName} {apartment.manager.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {apartment.manager.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">
                          Sin responsable asignado
                        </p>
                      )}
                    </div>

                    {/* Acciones - Solo propietario puede asignar/cambiar responsables */}
                    {!isManager && (
                      <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditApartment(apartment)}
                            disabled={!apartment.isActive || (apartment.sourceAssignments && apartment.sourceAssignments.length > 0)}
                            className={`flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition center flex justify-center gap-2 items-center ${(!apartment.isActive || (apartment.sourceAssignments && apartment.sourceAssignments.length > 0)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={(apartment.sourceAssignments && apartment.sourceAssignments.length > 0) ? "No puedes editar mientras el estacionamiento esté prestado" : "Editar departamento"}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteApartment(apartment)}
                            disabled={!apartment.isActive}
                            className={`flex-1 px-3 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition flex justify-center gap-2 items-center ${!apartment.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span> Eliminar
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openAssignModal(apartment)}
                            disabled={!apartment.isActive}
                            className={`flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition ${!apartment.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {apartment.manager ? 'Cambiar' : 'Asignar'} Responsable
                          </button>
                          {apartment.manager && (
                            <button
                              onClick={() => handleRemoveManager(apartment)}
                              disabled={!apartment.isActive}
                              className={`px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition ${!apartment.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nota informativa */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>Nota:</strong> Los cambios en responsables requieren aprobación del administrador.
              Cuando envíes una petición, recibirás una notificación cuando sea procesada.
            </p>
          </div>
        </div>
      </div>

      {/* Modal para asignar responsable */}
      <Modal
        isOpen={showAssignModal && !!selectedApartment}
        onClose={() => setShowAssignModal(false)}
        title={selectedApartment ? `${selectedApartment.manager ? 'Cambiar' : 'Asignar'} Responsable` : ''}
        width="max-w-md"
      >
        {selectedApartment && (
          <>
            <p className="text-gray-600 mb-4">
              Departamento {selectedApartment.number} - {selectedApartment.building?.name || 'Sin torre'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Responsable
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin responsable</option>
                  {availableManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de la solicitud
                </label>
                <textarea
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  rows={3}
                  placeholder="Indica el motivo del cambio (opcional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignManager}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Enviar Petición
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal para editar departamento */}
      <Modal
        isOpen={showEditApartmentModal}
        onClose={() => setShowEditApartmentModal(false)}
        title="Editar Departamento"
        width="max-w-md"
      >
        <form onSubmit={submitEditApartment}>
          <p className="text-gray-600 text-sm mb-4">
            Esta solicitud será enviada al administrador para su aprobación.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={editApartmentData.description}
                onChange={(e) => setEditApartmentData({ ...editApartmentData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estacionamiento
              </label>
              <input
                type="text"
                value={editApartmentData.parkingNumber}
                onChange={(e) => setEditApartmentData({ ...editApartmentData, parkingNumber: e.target.value })}
                placeholder="Ej: E-101"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setShowEditApartmentModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Enviar Solicitud
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
