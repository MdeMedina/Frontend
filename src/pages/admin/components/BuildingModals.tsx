import React from 'react';
import { Modal } from '../../../components/Modal';
import type { Building, CreateBuildingDto } from '../../../api/buildings';

interface BuildingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBuilding: Building | null;
  formData: CreateBuildingDto;
  setFormData: (d: CreateBuildingDto) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const BuildingEditModal = ({
  isOpen, onClose, editingBuilding, formData, setFormData, onSubmit, submitting
}: BuildingEditModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={editingBuilding ? 'Protocolo: Editar Torre' : 'Protocolo: Nueva Torre'}
  >
    <form onSubmit={onSubmit} className="space-y-8 p-2">
      <div className="space-y-3">
        <label className="text-[11px] font-black text-gray-950 uppercase tracking-[0.2em] block">
          Identificador / Nombre de la Torre *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Torre A, Torre Norte"
          className="w-full border-2 border-black/[0.1] rounded-sm px-4 py-3 text-[14px] font-bold text-gray-950 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-gray-300"
        />
      </div>

      <div className="flex gap-4 pt-6 border-t border-black/[0.08]">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-4 border-2 border-black rounded-sm text-gray-950 font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-gray-100 active:scale-95"
        >
          Anular
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-6 py-4 bg-gray-950 text-white rounded-sm font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-blue-600 disabled:opacity-30 active:scale-95 shadow-2xl shadow-black/20"
        >
          {submitting ? 'PROCESANDO...' : (editingBuilding ? 'ACTUALIZAR TORRE' : 'CREAR TORRE')}
        </button>
      </div>
    </form>
  </Modal>
);

interface BuildingDetailsModalProps {
  building: Building | null;
  onClose: () => void;
}

export const BuildingDetailsModal = ({ building, onClose }: BuildingDetailsModalProps) => (
  <Modal
    isOpen={!!building}
    onClose={onClose}
    title={`Detalles de Terminal: ${building?.name}`}
    width="max-w-2xl"
  >
    <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
      <div className="bg-gray-50 p-6 rounded-sm border-2 border-black/[0.03]">
        <div className="flex items-center gap-4 mb-4">
          <span className="material-symbols-outlined text-blue-600 text-[28px]">apartment</span>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-950">Unidades de Vivienda ({building?.apartments?.length || 0})</h3>
        </div>
        {building?.apartments && building.apartments.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {building.apartments.map(apt => (
              <div
                key={apt.id}
                className={`p-4 rounded-sm border-2 transition-all hover:shadow-lg ${apt.isActive
                    ? 'bg-white border-black/[0.08] active:border-blue-600'
                    : 'bg-gray-100/50 border-black/[0.03] opacity-60'
                  }`}
              >
                <div className="text-[13px] font-black text-gray-950 uppercase">Depto {apt.number}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Nivel {apt.floor}</div>
                {apt.owner && (
                  <div className="text-[11px] font-bold text-blue-600 mt-3 truncate uppercase tracking-tighter">
                    {apt.owner.firstName} {apt.owner.lastName}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 opacity-30">
            <span className="material-symbols-outlined text-[48px] mb-2">inventory_2</span>
            <p className="text-[11px] font-black uppercase tracking-widest">No hay registros de departamentos</p>
          </div>
        )}
      </div>
    </div>

    <div className="mt-10 pt-6 border-t border-black/[0.08] text-right">
      <button
        onClick={onClose}
        className="px-8 py-3 bg-gray-950 text-white rounded-sm font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-blue-600 active:scale-95"
      >
        Cerrar Terminal
      </button>
    </div>
  </Modal>
);

interface BuildingImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building | null;
  importing: boolean;
  importFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  onImport: () => void;
  importResults: any;
}

export const BuildingImportModal = ({
  isOpen, onClose, building, importing, importFile, onFileChange, onDownloadTemplate, onImport, importResults
}: BuildingImportModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={`Protocolo de Carga: ${building?.name}`}
  >
    <div className="space-y-8 p-2">
      {!importResults ? (
        <>
          <div className="bg-gray-950 p-6 rounded-sm text-white shadow-2xl shadow-black/20 border-l-4 border-blue-600">
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-blue-500 text-[28px]">info</span>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">Instrucciones de Importación</h3>
            </div>
            <ul className="text-[12px] text-gray-300 font-medium space-y-2 mb-6 opacity-80 uppercase tracking-tight">
              <li>• Se procesarán unidades para la torre: <strong className="text-white">{building?.name}</strong></li>
              <li>• Los propietarios nuevos se crearán automáticamente.</li>
              <li>• Use la plantilla maestra para evitar errores de paridad.</li>
            </ul>
            <button
              onClick={onDownloadTemplate}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border border-white/10"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Descargar Plantilla Maestra
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-950 uppercase tracking-[0.2em] block mb-2">
              Selección de Archivo de Datos
            </label>
            <div className="relative group">
              <input
                type="file"
                accept=".xlsx, .xls"
                required
                onChange={onFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-black/[0.12] group-hover:border-black/30 group-hover:bg-gray-50 rounded-sm p-12 text-center transition-all">
                <span className="material-symbols-outlined text-[48px] text-gray-200 group-hover:text-blue-600 transition-colors mb-4 inline-block">cloud_upload</span>
                <p className="text-[13px] font-bold text-gray-400 group-hover:text-gray-900 transition-colors uppercase tracking-tight">
                  {importFile ? importFile.name : 'Arrastra o selecciona el archivo Excel de unidades'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-black/[0.08]">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-black rounded-sm text-gray-950 font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-30"
              disabled={importing}
            >
              Cancelar
            </button>
            <button
              onClick={onImport}
              disabled={!importFile || importing}
              className="flex-1 px-6 py-4 bg-gray-950 text-white rounded-sm font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-blue-600 disabled:opacity-30 flex justify-center items-center gap-3 active:scale-95 shadow-2xl shadow-black/20"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/20 border-t-white"></div>
                  PROCESANDO...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                  EJECUTAR CARGA
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <div className="text-center">
            <div className={`mx-auto h-20 w-20 rounded-sm flex items-center justify-center mb-6 shadow-2xl ${importResults.success > 0 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
              <span className="material-symbols-outlined text-[40px] font-black">{importResults.success > 0 ? 'check_circle' : 'warning'}</span>
            </div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tighter uppercase">Proceso Finalizado</h3>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-sm border-2 border-black/[0.03]">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dueños</div>
                <div className="text-[14px] font-black text-gray-950">
                  <span className="text-blue-600">+{importResults.stats.ownersCreated}</span> / <span className="text-gray-400">{importResults.stats.ownersUpdated}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-sm border-2 border-black/[0.03]">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deptos</div>
                <div className="text-[14px] font-black text-gray-950">
                  <span className="text-blue-600">+{importResults.stats.apartmentsCreated}</span> / <span className="text-gray-400">{importResults.stats.apartmentsUpdated}</span>
                </div>
              </div>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-600/20 rounded-sm p-6 max-h-[250px] overflow-y-auto">
              <h4 className="text-[11px] font-black text-red-600 mb-4 tracking-[0.2em] uppercase flex items-center gap-2">
                 Log de Errores de Sistema
              </h4>
              <div className="space-y-2">
                {importResults.errors.map((err: any, idx: number) => (
                  <div key={idx} className="text-[12px] font-medium text-red-950 pb-2 border-b border-red-600/10 last:border-0 uppercase tracking-tighter">
                    <span className="font-black text-red-600 mr-2">Fila {err.row}:</span> {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full px-8 py-4 bg-gray-950 text-white rounded-sm font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-blue-600 active:scale-95 shadow-2xl shadow-black/20"
          >
            FINALIZAR OPERACIÓN
          </button>
        </div>
      )}
    </div>
  </Modal>
);
