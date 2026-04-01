import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { apartmentsApi } from '../../api/apartments';
import { Modal } from '../../components/Modal';

interface MenuItem {
  title: string;
  description: string;
  link?: string;
  icon: string;
  action?: () => void;
}

const DashboardCard = ({ item, onClick, index }: { item: MenuItem; onClick: () => void; index: number }) => (
  <div
    onClick={onClick}
    className="group cursor-pointer bg-white border border-black/[0.12] rounded-xl p-8 shadow-[var(--shadow-surgical)] hover:shadow-2xl hover:border-[#001640]/30 hover:translate-x-1 transition-all duration-500 relative overflow-hidden active:scale-[0.97] animate-in fade-in slide-in-from-left-6 fill-mode-both border-l-[6px] border-l-[#001640] group-hover:border-l-blue-600"
    style={{ animationDelay: `${index * 60}ms` }}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
    aria-label={`Acceder a ${item.title}`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-700"></div>

    <div className="relative z-10 flex items-center gap-6 h-full">
      <div className="h-16 w-16 shrink-0 rounded-xl bg-[#001640] flex items-center justify-center text-white shadow-2xl shadow-[#001640]/20 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500 border border-white/10">
        <span className="material-symbols-outlined text-[32px] font-bold">{item.icon}</span>
      </div>

      <div className="flex-1 pr-8">
        <h3 className="text-[18px] font-bold text-gray-950 tracking-tight group-hover:text-blue-600 transition-colors mb-1.5 leading-none uppercase">
          {item.title}
        </h3>
        <p className="text-[13px] font-medium text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
          {item.description}
        </p>
      </div>

      <span className="absolute top-0 right-0 material-symbols-outlined text-gray-200 text-2xl group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-700 opacity-20 group-hover:opacity-100">
        arrow_forward
      </span>
    </div>
  </div>
);


export const AdminDashboard = () => {
  const { user, currentBuilding, currentResidence, impersonationMode } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados y funciones para Carga Masiva (Excel)
  const [showUploadModal, setShowUploadModal] = useState(false);
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
    if (!uploadFile) return;
    if (!currentBuilding?.id) {
      setError('Error fatal: No hay ninguna torre seleccionada.');
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setError('');

    try {
      const result = await apartmentsApi.bulkImport(uploadFile, currentBuilding.id);
      setUploadResult(result);
      if (result.success > 0) {
        setSuccess(`Se procesaron ${result.success} departamentos correctamente.`);
      } else {
        setError('No se pudieron cargar los departamentos. Revisa los errores del Excel.');
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'Error grave al cargar el archivo en el servidor.');
    } finally {
      setUploading(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadResult(null);
    setError('');
    setSuccess('');
  };

  const menuItems: MenuItem[] = [
    {
      title: 'Usuarios',
      description: 'Gestión integral de usuarios y perfiles',
      link: '/admin/users',
      icon: 'group',
    },
    {
      title: 'Departamentos',
      description: 'Administración de unidades habitacionales',
      link: '/admin/apartments',
      icon: 'apartment',
    },
    {
      title: 'Reservas',
      description: 'Control de check-ins, check-outs y estadías',
      link: '/admin/reservations',
      icon: 'calendar_month',
    },
    {
      title: 'Peticiones',
      description: 'Autorización de solicitudes y cambios',
      link: '/admin/petitions',
      icon: 'rule',
    },
    {
      title: 'Calendario',
      description: 'Vista holística de ocupación y eventos',
      link: '/admin/calendar',
      icon: 'event_note',
    },
    {
      title: 'Registros',
      description: 'Auditoría completa de acciones del sistema',
      link: '/admin/audit',
      icon: 'history_edu',
    },
  ];

  const handleNavigation = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <Layout>
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-gray-50/30 font-sans text-gray-900">
        <div className="max-w-7xl mx-auto p-12">



          {error && (
            <div role="alert" className="flex items-center gap-4 border-2 border-red-600 bg-red-50 p-5 mb-10 animate-in shake duration-500">
              <span className="material-symbols-outlined text-red-600 text-[24px]">error</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map((item, index) => (
              <DashboardCard
                key={index}
                item={item}
                index={index}
                onClick={() => handleNavigation(item)}
              />
            ))}
          </div>
          <div className="mt-14 flex flex-col md:flex-row md:items-end justify-between gap-8">

            <div className="flex flex-col items-end gap-6">

              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-white border-2 border-[#001640] text-[#001640] px-6 py-3 rounded-xl font-black uppercase tracking-[0.15em] text-[11px] transition-all flex items-center justify-center gap-3 shadow-[var(--shadow-surgical)] hover:bg-[#001640] hover:text-white active:scale-95 group"
              >
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                Carga Masiva Excel
                <span className="material-symbols-outlined text-[18px] opacity-20 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        <Modal
          isOpen={showUploadModal}
          onClose={closeUploadModal}
          title="Protocolo de Carga Masiva (MS Excel)"
        >
          <div className="p-2">
            {!uploadResult ? (
              <form onSubmit={handleUploadExcel} className="space-y-8">
                <div className="bg-[#001640] p-6 rounded-xl text-white shadow-[0_20px_50px_rgba(0,22,64,0.3)] border-l-4 border-blue-600">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="material-symbols-outlined text-blue-500 text-[28px]">info</span>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">Instrucciones de Sistema</h3>
                  </div>
                  <p className="text-[13px] text-gray-300 font-medium leading-relaxed mb-6">
                    El archivo .xlsx será procesado contra la base de datos de la torre activa:
                    <span className="text-white font-black block mt-2 text-[15px]">{currentBuilding?.name || 'ERROR: NO SELECCIONADA'}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
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
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-[#001640]/[0.12] group-hover:border-[#001640]/30 group-hover:bg-[#001640]/[0.02] rounded-xl p-8 text-center transition-all">
                      <span className="material-symbols-outlined text-[48px] text-gray-200 group-hover:text-blue-600 transition-colors mb-4 inline-block">cloud_upload</span>
                      <p className="text-[13px] font-bold text-gray-400 group-hover:text-[#001640] transition-colors">
                        {uploadFile ? uploadFile.name : 'Arrastra o selecciona el archivo Excel'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-black/[0.08]">
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="flex-1 px-6 py-4 border-2 border-black rounded-sm text-gray-950 font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-gray-100 active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile || !currentBuilding}
                    className="flex-1 px-6 py-4 bg-[#001640] text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-blue-600 disabled:opacity-30 flex justify-center items-center gap-3 active:scale-95 shadow-[0_20px_50px_rgba(0,22,64,0.3)]"
                  >
                    {uploading ? (
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
              </form>
            ) : (
              <div className="space-y-8 py-4">
                <div className="text-center">
                  <div className={`mx-auto h-20 w-20 rounded-sm flex items-center justify-center mb-6 shadow-2xl ${uploadResult.success > 0 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                    <span className="material-symbols-outlined text-[40px] font-black">{uploadResult.success > 0 ? 'check_circle' : 'warning'}</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-950 tracking-tighter uppercase">Proceso Finalizado</h3>
                  <p className="text-[14px] text-gray-500 font-medium mt-3 leading-relaxed">
                    Registros procesados: <span className="text-blue-600 font-black">{uploadResult.success}</span> exitosos.
                    {uploadResult.failed > 0 && <span className="text-red-600 font-black"> // {uploadResult.failed} fallidos.</span>}
                  </p>
                </div>

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-600/20 rounded-sm p-6 max-h-[300px] overflow-y-auto">
                    <h4 className="text-[11px] font-black text-red-600 mb-4 tracking-[0.2em] uppercase flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">list_alt</span>
                      Log de Errores de Sistema:
                    </h4>
                    <div className="space-y-3">
                      {uploadResult.errors.map((err: any, idx: number) => (
                        <div key={idx} className="flex gap-4 items-start border-b border-red-600/10 pb-3 last:border-0 last:pb-0">
                          <span className="font-black text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-sm shrink-0 mt-0.5">FILA {err.row}</span>
                          <span className="text-[12px] font-medium text-red-900 leading-tight">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-6 border-t border-black/[0.08]">
                  <button
                    onClick={closeUploadModal}
                    className="w-full px-8 py-4 bg-[#001640] text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:bg-blue-600 active:scale-95 shadow-[0_20px_50px_rgba(0,22,64,0.3)]"
                  >
                    Finalizar Operación
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

