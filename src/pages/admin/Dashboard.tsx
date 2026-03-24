import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { apartmentsApi } from '../../api/apartments';
import { Modal } from '../../components/Modal';
import { 
  Users, 
  Building2, 
  CalendarDays, 
  ClipboardCheck, 
  CalendarRange, 
  FileStack,
  Upload,
  ArrowRight
} from 'lucide-react';

interface MenuItem {
  title: string;
  description: string;
  link?: string;
  icon: React.ReactNode;
  color: string;
  action?: () => void;
}

const cardStyles = 'group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:border-[var(--color-primary)] transition-all cursor-pointer overflow-hidden';

const DashboardCard = ({ item, onClick, index }: { item: MenuItem; onClick: () => void; index: number }) => (
  <div 
    onClick={onClick} 
    className={`${cardStyles} anim-${(index % 4) + 1}`}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
    aria-label={`Acceder a ${item.title}`}
  >
    <div className="h-1 bg-[var(--color-primary-subtle)] group-hover:bg-[var(--color-primary)] transition-colors" />
    
    <div className="p-10">
      <div className={`w-14 h-14 rounded-[var(--radius-sm)] bg-[var(--color-background)] flex items-center justify-center mb-6 
                       border border-[var(--color-border)] group-hover:border-[var(--color-primary)] 
                       group-hover:scale-110 transition-all duration-300 ${item.color}`}>
        {item.icon}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight group-hover:text-[var(--color-primary)] transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
          {item.description}
        </p>
      </div>
      
      <div className="mt-8 flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
        Acceder al módulo
        <div className="ml-2 w-4 h-px bg-[var(--color-border)] group-hover:w-8 group-hover:bg-[var(--color-primary)] transition-all" />
      </div>
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
      icon: <Users size={24} />,
      color: 'text-[var(--color-primary)]',
    },
    {
      title: 'Departamentos',
      description: 'Administración de unidades habitacionales',
      link: '/admin/apartments',
      icon: <Building2 size={24} />,
      color: 'text-[var(--color-info)]',
    },
    {
      title: 'Reservas',
      description: 'Control de check-ins, check-outs y estadías',
      link: '/admin/reservations',
      icon: <CalendarDays size={24} />,
      color: 'text-[var(--color-action-text)]',
    },
    {
      title: 'Peticiones',
      description: 'Autorización de solicitudes y cambios',
      link: '/admin/petitions',
      icon: <ClipboardCheck size={24} />,
      color: 'text-[var(--color-warning)]',
    },
    {
      title: 'Calendario',
      description: 'Vista holística de ocupación y eventos',
      link: '/admin/calendar',
      icon: <CalendarRange size={24} />,
      color: 'text-[var(--color-primary)]',
    },
    {
      title: 'Registros',
      description: 'Auditoría completa de acciones del sistema',
      link: '/admin/audit',
      icon: <FileStack size={24} />,
      color: 'text-[var(--color-text-muted)]',
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-primary)] mb-2">
              Administración Central
            </p>
            <h1 className="dashboard-hero-title font-bold tracking-tight text-[var(--color-text-primary)] leading-none">
              Panel de Control
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-4 max-w-2xl">
              Bienvenido, <span className="font-semibold text-[var(--color-text-primary)]">{user?.firstName} {user?.lastName}</span>. 
              Gestiona los de departamentos, usuarios y operaciones críticas desde esta central de mando.
            </p>

            {/* Torre Activa Indicator - Interactive Chip */}
            {(currentBuilding || currentResidence) && (
              <div className="mt-4">
                <button 
                  onClick={() => {
                    if (impersonationMode && currentResidence) {
                      navigate(`/superadmin/residences/${currentResidence.id}`);
                    } else {
                      navigate('/select-residence');
                    }
                  }}
                  title="Clic para cambiar de torre"
                  className="group/chip inline-flex items-center gap-2.5 bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/20 px-4 py-2.5 rounded-[var(--radius-sm)] text-[13px] font-bold text-[var(--color-primary)] uppercase tracking-wider shadow-sm transition-all hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] active:scale-[0.98]"
                >
                  <Building2 size={16} strokeWidth={2.5} className="group-hover/chip:scale-110 transition-transform" />
                  <span>
                    {currentBuilding?.name ? `Torre: ${currentBuilding.name}` : 'Torre no seleccionada'} 
                    {currentResidence?.name && <span className="opacity-60 ml-2 group-hover/chip:opacity-90">({currentResidence.name})</span>}
                  </span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="shrink-0 bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] text-[var(--action-text)] px-5 py-2.5 rounded-[var(--radius-button)] font-bold tracking-wide uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-sm border border-[var(--color-action)]/50 focus:outline-[var(--color-primary)]"
          >
            <Upload size={16} strokeWidth={2.5} />
            Importar por Excel
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-3 border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-8 text-[var(--color-danger)]">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-lg leading-none" aria-label="Cerrar error">×</button>
          </div>
        )}

        {success && (
          <div role="alert" className="flex items-center gap-3 border border-[var(--color-action)] bg-[var(--color-action-subtle)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-8 text-[var(--color-action)]">
            <ClipboardCheck size={18} />
            <p className="text-sm font-medium">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto text-lg leading-none" aria-label="Cerrar éxito">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <DashboardCard 
              key={index} 
              item={item} 
              index={index}
              onClick={() => handleNavigation(item)} 
            />
          ))}
        </div>

      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={closeUploadModal}
        title="Importar Departamentos (Excel)"
      >
        {!uploadResult ? (
          <form onSubmit={handleUploadExcel} className="space-y-4">
            <div className="bg-[var(--color-info-subtle)] p-4 rounded-[var(--radius-sm)] text-sm text-[var(--color-info)] mb-4 border border-[var(--color-info)]/20">
              <p>Sube un archivo Excel (.xlsx) con los departamentos.</p>
              <p className="font-bold mt-1">
                Aviso: La carga se aplicará automáticamente a la Torre activa: {currentBuilding?.name || 'Ninguna'}
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="hover:underline font-bold mt-2 text-[var(--color-primary)] opacity-90 transition-opacity hover:opacity-100"
              >
                Descargar plantilla de ejemplo
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-text-primary)] mb-1">
                Archivo Excel *
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                required
                onChange={handleFileChange}
                className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius-full)] file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-[var(--color-primary-subtle)] file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)] hover:file:text-white transition-all cursor-pointer"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--color-border)] mt-6">
              <button
                type="button"
                onClick={closeUploadModal}
                className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius-button)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)] font-bold uppercase text-xs tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={uploading || !uploadFile || !currentBuilding}
                className="flex-1 px-4 py-2 bg-[var(--color-action)] text-[var(--action-text)] rounded-[var(--radius-button)] hover:bg-[var(--color-action-hover)] disabled:opacity-50 flex justify-center items-center gap-2 font-bold uppercase text-xs tracking-wider transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/20 border-t-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload size={16} strokeWidth={3} />
                    Cargar
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 ${uploadResult.success > 0 ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]' : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'}`}>
                <ClipboardCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Proceso completado</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mt-2">
                Se cargaron <span className="font-bold">{uploadResult.success}</span> departamentos correctamente.
                {uploadResult.failed > 0 && ` Hubo ${uploadResult.failed} errores.`}
              </p>
            </div>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="bg-[var(--color-danger-subtle)] rounded-[var(--radius-sm)] p-4 max-h-60 overflow-y-auto border border-[var(--color-danger)]/20">
                <h4 className="text-sm font-bold text-[var(--color-danger)] mb-2 tracking-wider uppercase">Errores encontrados:</h4>
                <ul className="space-y-2 text-sm text-[var(--color-danger)]">
                  {uploadResult.errors.map((err: any, idx: number) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <span className="font-mono text-[10px] font-bold mt-0.5 px-1.5 py-0.5 rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 shrink-0">Fila {err.row}</span>
                      <span>{err.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-[var(--color-border)] mt-6">
              <button
                onClick={closeUploadModal}
                className="px-6 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text-primary)] rounded-[var(--radius-button)] hover:text-[var(--color-primary)] font-bold uppercase text-xs tracking-wider transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

