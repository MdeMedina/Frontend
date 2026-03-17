import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');



  const menuItems = [
    {
      title: 'Gestión de Usuarios',
      description: 'Crear, editar y administrar usuarios del sistema',
      link: '/admin/users',
      icon: '👥',
      color: 'bg-indigo-500',
    },
    {
      title: 'Gestión de Departamentos',
      description: 'Registrar, editar y eliminar departamentos del sistema',
      link: '/admin/apartments',
      icon: '🏢',
      color: 'bg-blue-500',
    },
    {
      title: 'Gestión de Reservas',
      description: 'Administrar reservas y datos de huéspedes',
      link: '/admin/reservations',
      icon: '📅',
      color: 'bg-green-500',
    },
    {
      title: 'Peticiones',
      description: 'Revisar y autorizar solicitudes de modificación',
      link: '/admin/petitions',
      icon: '📝',
      color: 'bg-yellow-500',
    },
    {
      title: 'Calendario',
      description: 'Vista calendario de Check-In y Check-Out',
      link: '/admin/calendar',
      icon: '🗓️',
      color: 'bg-purple-500',
    },
    {
      title: 'Registros de Auditoría',
      description: 'Historial de todas las acciones en el sistema',
      link: '/admin/audit',
      icon: '📋',
      color: 'bg-gray-700',
    },

  ];

  const handleNavigation = (item: any) => {
    if (item.action) {
      item.action();
    } else if (item.link) {
      navigate(item.link);
    }
  };





  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600 mb-8">
            Bienvenido, {user?.firstName} {user?.lastName}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
              <button onClick={() => setError('')} className="float-right font-bold">×</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <div
                key={index}
                onClick={() => handleNavigation(item)}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
              >
                <div className={`${item.color} h-2`} />
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">{item.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import Modal */}

    </Layout>
  );
};

