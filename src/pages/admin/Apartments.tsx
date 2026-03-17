import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { apartmentsApi } from '../../api/apartments';
import type { Apartment, CreateApartmentDto } from '../../api/apartments';
import { buildingsApi, type Building } from '../../api/buildings';
import { usersApi, type User } from '../../api/users';
import { Modal } from '../../components/Modal';

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

  const { user, isMainAdminFor, impersonatedResidenceId } = useAuth();
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
      const response = await apartmentsApi.getAll({ limit: 500 });
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
  }, []);

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
      await apartmentsApi.create(newApartmentData);
      setSuccess('Departamento creado correctamente');
      setShowCreateModal(false);
      setNewApartmentData({
        number: '',
        floor: 0,
        buildingId: '',
        description: '',
        parkingNumber: '',
        ownerId: '',
      });
      fetchApartments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el departamento');
    } finally {
      setSubmitting(false);
    }
  };

  // Estados y funciones para Carga Masiva (Excel)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadBuildingId, setUploadBuildingId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await apartmentsApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_departamentos.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al descargar plantilla:', err);
      setError('Error al descargar la plantilla');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadBuildingId) return;

    setUploading(true);
    setUploadResult(null);
    setError('');

    try {
      const result = await apartmentsApi.bulkImport(uploadFile, uploadBuildingId);
      setUploadResult(result);
      if (result.success > 0) {
        setSuccess(`Se procesaron ${result.success} departamentos correctamente.`);
        fetchApartments();
      } else {
        setError('No se pudieron cargar los departamentos. Revisa los errores.');
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'Error al cargar el archivo');
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadBuildingId('');
    setUploadFile(null);
    setUploadResult(null);
    setError('');
    setSuccess('');
  };

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
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">upload_file</span>
                Importar Departamentos
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                Nuevo Departamento
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
              <button onClick={() => setError('')} className="float-right font-bold">×</button>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
              <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Filtros de búsqueda</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por número */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Departamento
                </label>
                <input
                  type="text"
                  value={filterNumber}
                  onChange={(e) => setFilterNumber(e.target.value)}
                  placeholder="Buscar por número..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filtro por torre/edificio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Torre / Edificio
                </label>
                <select
                  value={filterBuilding}
                  onChange={(e) => setFilterBuilding(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todas las torres</option>
                  {uniqueBuildings.map(building => (
                    <option key={building} value={building}>{building}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por piso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piso
                </label>
                <select
                  value={filterFloor}
                  onChange={(e) => setFilterFloor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todos los pisos</option>
                  {uniqueFloors.map(floor => (
                    <option key={floor} value={floor}>Piso {floor}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Mostrando {filteredApartments.length} de {apartments.length} departamentos
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Torre / Edificio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estacionamiento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propietario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      {canDelete && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
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
                        <tr key={apt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900 text-lg">
                              Depto {apt.number}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {apt.building?.name || 'Sin torre'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            Piso {apt.floor}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {apt.parkingNumber || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {apt.owner ? (
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                  {apt.owner.firstName[0]}{apt.owner.lastName[0]}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {apt.owner.firstName} {apt.owner.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">{apt.owner.email}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-sm">Sin propietario</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {apt.owner?.rut || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {apt.owner?.phone || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={apt.isActive ? 'active' : 'inactive'}
                              onChange={(e) => handleStatusChange(apt, e.target.value === 'active')}
                              className={`px-2 py-1 rounded text-sm font-medium border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${apt.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                            >
                              <option value="active" className="bg-white text-gray-900">Activo</option>
                              <option value="inactive" className="bg-white text-gray-900">Inactivo</option>
                            </select>
                          </td>
                          {canDelete && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleDelete(apt)}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Eliminar
                              </button>
                            </td>
                          )}
                        </tr>
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
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-800">
              Depto {selectedApartment?.number}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Torre / Edificio</div>
              <div className="font-medium text-gray-900">{selectedApartment?.building?.name || 'Sin torre'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Piso</div>
              <div className="font-medium text-gray-900">{selectedApartment?.floor}</div>
            </div>
          </div>

          {/* Propietario */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2 font-medium">Propietario</div>
            {selectedApartment?.owner ? (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {selectedApartment.owner.firstName[0]}{selectedApartment.owner.lastName[0]}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedApartment.owner.firstName} {selectedApartment.owner.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{selectedApartment.owner.email}</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Sin propietario asignado</p>
            )}
          </div>

          {/* Responsable Asignado */}
          {selectedApartment?.manager && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2 font-medium">Responsable Asignado</div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  {selectedApartment.manager.firstName[0]}{selectedApartment.manager.lastName[0]}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedApartment.manager.firstName} {selectedApartment.manager.lastName}
                  </div>
                  <div className="text-sm text-gray-600">{selectedApartment.manager.email}</div>
                </div>
              </div>
            </div>
          )}

          {selectedApartment?.description && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Descripción</div>
              <div className="text-gray-900">{selectedApartment.description}</div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-gray-600">Estado:</span>
            <span className={`px-3 py-1 rounded-full font-medium ${selectedApartment?.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}>
              {selectedApartment?.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setSelectedApartment(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {/* Modal de Carga Masiva (Excel) */}
      <Modal
        isOpen={showUploadModal}
        onClose={closeUploadModal}
        title="Importar Departamentos"
      >
        {!uploadResult ? (
          <form onSubmit={handleUploadExcel} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
              <p>Sube un archivo Excel (.xlsx) con los departamentos.</p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-blue-600 hover:text-blue-800 underline font-medium mt-1"
              >
                Descargar plantilla de ejemplo
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Torre / Edificio *
              </label>
              <select
                required
                value={uploadBuildingId}
                onChange={(e) => setUploadBuildingId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona una torre...</option>
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>{building.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Todos los departamentos del archivo se asignarán a esta torre.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Archivo Excel *
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                required
                onChange={handleFileChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={closeUploadModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={uploading || !uploadFile || !uploadBuildingId}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Cargar
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 ${uploadResult.success > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                <span className="material-symbols-outlined text-2xl">
                  {uploadResult.success > 0 ? 'check' : 'error'}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Proceso completado</h3>
              <p className="text-gray-500">
                Se cargaron {uploadResult.success} departamentos correctamente.
                {uploadResult.failed > 0 && ` Hubo ${uploadResult.failed} errores.`}
              </p>
            </div>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <h4 className="text-sm font-medium text-red-800 mb-2">Errores encontrados:</h4>
                <ul className="space-y-2 text-sm text-red-700">
                  {uploadResult.errors.map((err: any, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="font-mono text-xs bg-red-100 px-1 rounded">Fila {err.row}</span>
                      <span>{err.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={closeUploadModal}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de creación */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo Departamento"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número *
              </label>
              <input
                type="text"
                required
                value={newApartmentData.number}
                onChange={(e) => setNewApartmentData({ ...newApartmentData, number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: 101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Piso *
              </label>
              <input
                type="number"
                required
                value={newApartmentData.floor}
                onChange={(e) => setNewApartmentData({ ...newApartmentData, floor: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Torre / Edificio *
            </label>
            <select
              required
              value={newApartmentData.buildingId}
              onChange={(e) => setNewApartmentData({ ...newApartmentData, buildingId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar...</option>
              {buildings.map(building => (
                <option key={building.id} value={building.id}>{building.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Propietario *
            </label>
            <select
              required
              value={newApartmentData.ownerId || ''}
              onChange={(e) => setNewApartmentData({ ...newApartmentData, ownerId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleccionar...</option>
              {owners.map(owner => (
                <option key={owner.id} value={owner.id}>
                  {owner.firstName} {owner.lastName} ({owner.rut || 'Sin RUT'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estacionamiento (Opcional)
            </label>
            <input
              type="text"
              value={newApartmentData.parkingNumber || ''}
              onChange={(e) => setNewApartmentData({ ...newApartmentData, parkingNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: E-15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              value={newApartmentData.description || ''}
              onChange={(e) => setNewApartmentData({ ...newApartmentData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
