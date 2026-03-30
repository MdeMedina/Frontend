import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { buildingsApi } from '../../api/buildings';
import type { Building, CreateBuildingDto } from '../../api/buildings';
import { 
  fetchBuildingsList, 
  handleBuildingSubmit, 
  handleBuildingDelete, 
  handleBuildingToggleActive,
  downloadApartmentTemplate 
} from './buildings.utils';
import { BuildingHeader, BuildingTable, EmptyBuildingsState } from './components/BuildingsUI';
import { BuildingEditModal, BuildingDetailsModal, BuildingImportModal } from './components/BuildingModals';
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
  const [formData, setFormData] = useState<CreateBuildingDto>({ name: '' });
  const [submitting, setSubmitting] = useState(false);

  // View details
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingBuilding, setImportingBuilding] = useState<Building | null>(null);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);

  const refreshList = () => fetchBuildingsList(setBuildings, setError, setLoading);

  useEffect(() => {
    refreshList();
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

  const openImportModal = (building: Building) => {
    setImportingBuilding(building);
    setShowImportModal(true);
    setImportFile(null);
    setImportResults(null);
    setError('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleBuildingSubmit(
      editingBuilding,
      formData,
      setSuccess,
      setError,
      setShowModal,
      setSubmitting,
      refreshList
    );
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

  const handleImport = async () => {
    if (!importFile || !importingBuilding) return;
    try {
      setImporting(true);
      setError('');
      const results = await apartmentsApi.bulkImport(importFile, importingBuilding.id);
      setImportResults(results);
      if (results.success > 0) refreshList();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al importar datos');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-gray-50/30 font-sans text-gray-900 animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto p-12 animate-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          
          <BuildingHeader onAdd={openCreateModal} />

          {error && (
            <div role="alert" className="flex items-center gap-4 border-2 border-red-600 bg-red-50 p-5 mb-10 animate-in shake duration-500">
              <span className="material-symbols-outlined text-red-600 text-[24px]">error_outline</span>
              <p className="text-[13px] font-black text-red-600 uppercase tracking-tight">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-600 font-bold text-xl">×</button>
            </div>
          )}

          {success && (
            <div role="alert" className="flex items-center gap-4 border-2 border-blue-600 bg-blue-50 p-5 mb-10 animate-in slide-in-from-top-4 duration-500">
              <span className="material-symbols-outlined text-blue-600 text-[24px]">verified</span>
              <p className="text-[13px] font-black text-blue-600 uppercase tracking-tight">{success}</p>
              <button onClick={() => setSuccess('')} className="ml-auto text-blue-600 font-bold text-xl">×</button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center h-80 bg-white border-2 border-black/[0.03] rounded-sm shadow-sm animate-in fade-in duration-500">
              <div className="relative">
                <div className="h-12 w-12 rounded-sm border-2 border-blue-600 animate-spin"></div>
                <div className="absolute inset-0 h-12 w-12 rounded-sm border-2 border-gray-200 animate-ping opacity-20"></div>
              </div>
              <p className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Sincronizando Infraestructura...</p>
            </div>
          ) : buildings.length === 0 ? (
            <EmptyBuildingsState onCreate={openCreateModal} />
          ) : (
            <BuildingTable 
              buildings={buildings}
              canDelete={canDelete}
              onView={viewDetails}
              onEdit={openEditModal}
              onImport={openImportModal}
              onToggleActive={(b) => handleBuildingToggleActive(b, setSuccess, setError, refreshList)}
              onDelete={(b) => handleBuildingDelete(b, canDelete, setSuccess, setError, refreshList)}
            />
          )}

          {/* Protocol Note */}
          <div className="mt-12 bg-gray-950 p-6 rounded-sm border-l-4 border-blue-600 shadow-2xl shadow-black/20 flex gap-5 items-start">
             <span className="material-symbols-outlined text-blue-500 text-[24px]">contact_support</span>
             <div>
                <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Nota de Protocolo Operativo</h4>
                <p className="text-[13px] font-medium text-gray-400 leading-relaxed uppercase tracking-tighter">
                  Las torres estructuran la jerarquía física de la residencia. Los propietarios requieren la asignación de una torre válida para registrar unidades habitacionales (Deptos).
                </p>
             </div>
          </div>
        </div>
      </div>

      <BuildingEditModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingBuilding={editingBuilding}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />

      <BuildingDetailsModal 
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
      />

      <BuildingImportModal 
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportResults(null);
        }}
        building={importingBuilding}
        importing={importing}
        importFile={importFile}
        onFileChange={(e) => {
          if (e.target.files && e.target.files[0]) setImportFile(e.target.files[0]);
        }}
        onDownloadTemplate={() => downloadApartmentTemplate(setError)}
        onImport={handleImport}
        importResults={importResults}
      />
    </Layout>
  );
};
