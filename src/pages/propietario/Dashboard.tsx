import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';

// Menú para Propietario
const ownerMenuItems = [
  {
    title: 'Mis Departamentos',
    description: 'Ver y solicitar nuevos departamentos',
    icon: '🏢',
    path: '/propietario/apartments',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Mis Responsables',
    description: 'Gestionar responsables asignados a tus departamentos',
    icon: '👥',
    path: '/propietario/managers',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    title: 'Gestión de Reservas',
    description: 'Crear, modificar y cancelar reservas',
    icon: '📅',
    path: '/propietario/reservations',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    title: 'Mis Peticiones',
    description: 'Ver peticiones enviadas y recibidas',
    icon: '📝',
    path: '/propietario/petitions',
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Calendario',
    description: 'Ver calendario visual de check-in/check-out',
    icon: '📆',
    path: '/propietario/calendar',
    color: 'from-amber-500 to-amber-600',
  },
];

// Menú para Responsable Asignado
const managerMenuItems = [
  {
    title: 'Departamentos Asignados',
    description: 'Ver los departamentos que tienes a cargo',
    icon: '🏢',
    path: '/responsable/apartments',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Gestión de Reservas',
    description: 'Crear, modificar y cancelar reservas',
    icon: '📅',
    path: '/responsable/reservations',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    title: 'Calendario',
    description: 'Ver calendario visual de check-in/check-out',
    icon: '📆',
    path: '/responsable/calendar',
    color: 'from-amber-500 to-amber-600',
  },
];

export const PropietarioDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determinar qué menú mostrar según el rol
  const isManager = user?.role === 'ASSIGNED_MANAGER';
  const menuItems = isManager ? managerMenuItems : ownerMenuItems;
  const title = isManager ? 'Panel de Responsable' : 'Panel de Propietario';

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {title}
            </h1>
            <p className="text-gray-600 mt-2">
              Bienvenido, <span className="font-semibold">{user?.firstName} {user?.lastName}</span>
            </p>
          </div>

          {/* Grid de menú */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item) => (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group cursor-pointer bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`h-2 bg-gradient-to-r ${item.color}`}></div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`text-4xl p-3 rounded-lg bg-gradient-to-r ${item.color} bg-opacity-10`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Información adicional */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 ¿Necesitas ayuda?</h3>
            <p className="text-blue-700 text-sm">
              Si necesitas realizar cambios en datos bloqueados, modificar información de departamentos 
              o asignar nuevos responsables, puedes crear una petición desde la sección "Mis Peticiones".
              El administrador revisará tu solicitud.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
