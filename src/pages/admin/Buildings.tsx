import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { buildingsApi } from '../../api/buildings';
import type { Building, CreateBuildingDto, UpdateBuildingDto } from '../../api/buildings';
import { Modal } from '../../components/Modal';
import { apartmentsApi } from '../../api/apartments';

export const AdminBuildings = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, isMainAdminFor, impersonatedResidenceId } = useAuth();
  const currentResidenceId = impersonatedResidenceId || user?.residenceId;
  const canDelete = currentResidenceId ? isMainAdminFor(currentResidenceId) : false;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [formData, setFormData] = useState<CreateBuildingDto>({
    name: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // View details
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingBuilding, setImportingBuilding] = useState<Building | null>(null);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; data: any; error: string }>;
    created: Array<{ number: string; floor: number }>;
    stats: {
      ownersCreated: number;
      ownersUpdated: number;
      apartmentsCreated: number;
      apartmentsUpdated: number;
    };
  } | null>(null);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await buildingsApi.getAll(true); // Incluir inactivos
      setBuildings(response.data);
    } catch (err) {
      setError('Error al cargar las torres');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const openCreateModal = () => {
    setEditingBuilding(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const openEditModal = (building: Building) => {
    setEditingBuilding(building);
    setFormData({ name: building.name });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingBuilding) {
        await buildingsApi.update(editingBuilding.id, formData as UpdateBuildingDto);
        setSuccess('Torre actualizada correctamente');
      } else {
        await buildingsApi.create(formData);
        setSuccess('Torre creada correctamente');
      }
      setShowModal(false);
      fetchBuildings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la torre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (building: Building) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar/desactivar la torre "${building.name}"?`)) {
      return;
    }

    try {
      await buildingsApi.delete(building.id);
      setSuccess(`Torre "${building.name}" eliminada/desactivada correctamente`);
      fetchBuildings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la torre');
    }
  };

  const handleToggleActive = async (building: Building) => {
    try {
      await buildingsApi.update(building.id, { isActive: !building.isActive });
      setSuccess(`Torre "${building.name}" ${building.isActive ? 'desactivada' : 'activada'} correctamente`);
      fetchBuildings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar estado de la torre');
    }
  };

  const viewDetails = async (building: Building) => {
    try {
      const details = await buildingsApi.getOne(building.id);
      setSelectedBuilding(details);
    } catch (err) {
      console.error(err);
      setError('Error al cargar detalles de la torre');
    }
  };

  const openImportModal = (building: Building) => {
    setImportingBuilding(building);
    setShowImportModal(true);
    setImportFile(null);
    setImportResults(null);
    setError('');
  };

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
      setError('Error al descargar la plantilla');
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!importFile || !importingBuilding) return;

    try {
      setImporting(true);
      setError('');
      const results = await apartmentsApi.bulkImport(importFile, importingBuilding.id);
      setImportResults(results);
      if (results.success > 0) {
        fetchBuildings(); // Refresh counts
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al importar datos');
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportingBuilding(null);
    setImportFile(null);
    setImportResults(null);
    setError('');
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Torres de la Residencia</h1>
              <p className="text-gray-600 mt-1">
                Gestiona las torres disponibles para los departamentos
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Nueva Torre
            </button>
          </div>

          {/* Alerts */}
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

          {/* Buildings List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : buildings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay torres registradas</h3>
              <p className="text-gray-600 mb-4">Crea tu primera torre para que los propietarios puedan registrar departamentos</p>
              <button
                onClick={openCreateModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
              >
                Crear Torre
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Torre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamentos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {buildings.map(building => (
                    <tr key={building.id} className={!building.isActive ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏗️</span>
                          <span className="font-semibold text-gray-900">{building.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {building.apartmentsCount || 0} departamento{(building.apartmentsCount || 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${building.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {building.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => viewDetails(building)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => openEditModal(building)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => openImportModal(building)}
                            className="text-teal-600 hover:text-teal-800 text-sm font-medium flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">upload_file</span>
                            Cargar
                          </button>
                          <button
                            onClick={() => handleToggleActive(building)}
                            className={`text-sm font-medium ${building.isActive
                                ? 'text-orange-600 hover:text-orange-800'
                                : 'text-green-600 hover:text-green-800'
                              }`}
                          >
                            {building.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          {(building.apartmentsCount || 0) === 0 && canDelete && (
                            <button
                              onClick={() => handleDelete(building)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Nota informativa */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>💡 Nota:</strong> Las torres se utilizan para organizar los departamentos de la residencia.
              Los propietarios podrán seleccionar una torre al solicitar el registro de un nuevo departamento.
            </p>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBuilding ? 'Editar Torre' : 'Nueva Torre'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Torre *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Torre A, Torre Norte"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : (editingBuilding ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        title={selectedBuilding?.name}
        width="max-w-2xl"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <div className="border-t pt-4">
            <h3 className="font-bold mb-3">
              Departamentos ({selectedBuilding?.apartments?.length || 0})
            </h3>
            {selectedBuilding?.apartments && selectedBuilding.apartments.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedBuilding.apartments.map(apt => (
                  <div
                    key={apt.id}
                    className={`p-2 rounded border ${apt.isActive
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <div className="font-medium">Depto {apt.number}</div>
                    <div className="text-xs text-gray-600">Piso {apt.floor}</div>
                    {apt.owner && (
                      <div className="text-xs text-gray-500">
                        {apt.owner.firstName} {apt.owner.lastName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No hay departamentos en esta torre</p>
            )}
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={() => setSelectedBuilding(null)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={closeImportModal}
        title={`Importar Departamentos - ${importingBuilding?.name}`}
      >
        <div className="space-y-4">
          {!importResults ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones</h3>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li>Carga los departamentos para la torre <strong>{importingBuilding?.name}</strong>.</li>
                  <li>Los <strong>Propietarios</strong> se identifican por Email y se crearán si no existen.</li>
                  <li>Descarga la plantilla para ver el formato requerido (sin columna Torre).</li>
                </ul>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleDownloadTemplate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2"
                >
                  📥 Descargar Plantilla Excel
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="text-6xl mb-4">📊</div>
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    {importFile ? importFile.name : 'Seleccionar archivo Excel'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Formatos aceptados: .xlsx, .xls
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeImportModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  disabled={importing}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Procesando...
                    </>
                  ) : (
                    <>📤 Importar Datos</>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Proceso Completado</h3>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-xs text-green-600 uppercase font-bold">Propietarios</div>
                      <div className="text-sm">
                        <span className="font-bold text-green-700">+{importResults.stats.ownersCreated}</span> Nuevos<br />
                        <span className="font-bold text-blue-700">↻ {importResults.stats.ownersUpdated}</span> Actualizados
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-xs text-green-600 uppercase font-bold">Departamentos</div>
                      <div className="text-sm flex gap-4">
                        <span><span className="font-bold text-green-700">+{importResults.stats.apartmentsCreated}</span> Nuevos</span>
                        <span><span className="font-bold text-blue-700">↻ {importResults.stats.apartmentsUpdated}</span> Actualizados</span>
                      </div>
                    </div>
                  </div>

                  {importResults.failed > 0 && (
                    <div className="mt-4 p-2 bg-red-100 rounded text-red-800 text-sm font-bold">
                      ❌ {importResults.failed} Filas con errores (no procesadas)
                    </div>
                  )}
                </div>

                {importResults.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-900 mb-2">Errores Encontrados:</h4>
                    <div className="max-h-48 overflow-y-auto bg-red-50 rounded p-3">
                      <ul className="text-sm space-y-2">
                        {importResults.errors.map((err, idx) => (
                          <li key={idx} className="text-red-700">
                            <strong>Fila {err.row}:</strong> {err.error}
                            <div className="text-xs text-red-600 mt-1">
                              Datos: {JSON.stringify(err.data)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeImportModal}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Layout>
  );
};
