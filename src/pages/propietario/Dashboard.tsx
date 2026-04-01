import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { ownerMenuItems, managerMenuItems } from './dashboard.utils';
import { DashboardHeader, DashboardCard } from './components/DashboardUI';

export const PropietarioDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Determinar qué menú mostrar según el rol
  const isManager = user?.role === 'ASSIGNED_MANAGER';
  const menuItems = isManager ? managerMenuItems : ownerMenuItems;
  const title = isManager ? 'Consola de Responsable' : 'Consola de Propietario';

  return (
    <Layout>
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-gray-50/30 font-sans text-gray-900">
        <div className="max-w-7xl mx-auto p-8">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, idx) => (
              <DashboardCard
                key={item.path}
                item={item}
                idx={idx}
                onClick={navigate}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
