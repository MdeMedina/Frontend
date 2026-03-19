import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { 
  Users, 
  Building, 
  Building2, 
  CalendarDays, 
  ClipboardCheck, 
  CalendarRange, 
  FileStack
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');



  const menuItems: MenuItem[] = [
    {
      title: 'Usuarios',
      description: 'Gestión integral de usuarios y perfiles',
      link: '/admin/users',
      icon: <Users size={24} />,
      color: 'text-[var(--color-primary)]',
    },
    {
      title: 'Torres',
      description: 'Configuración de torres y estructuras',
      link: '/admin/buildings',
      icon: <Building size={24} />,
      color: 'text-[var(--color-info)]',
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
        <div className="mb-12">
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
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-3 border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-8">
            <p className="text-sm text-[var(--color-danger)] font-medium">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-lg leading-none" aria-label="Cerrar error">×</button>
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
    </Layout>
  );
};

