import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { residencesApi, type Residence } from '../../api/residences';
import { Layout } from '../../components/Layout';

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { stopImpersonation } = useAuth();
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stopImpersonation();
    fetchResidences();
  }, []);

  const fetchResidences = async () => {
    try {
      const data = await residencesApi.getAll();
      setResidences(data);
    } catch (error) {
      console.error('Error al cargar residencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = residences.reduce((sum, r) => sum + (r._count?.users || 0), 0);
  const totalBuildings = residences.reduce((sum, r) => sum + (r._count?.buildings || 0), 0);
  const totalApartments = residences.reduce((sum, r) => sum + (r._count?.apartments || 0), 0);
  const totalStays = residences.reduce((sum, r) => sum + (r._count?.stays || 0), 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel de Super Administrador</h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <span className="text-2xl">🏛️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Residencias</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? '...' : residences.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? '...' : totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏗️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Torres</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? '...' : totalBuildings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Departamentos</p>
              <p className="text-2xl font-bold text-gray-800">
                {loading ? '...' : totalApartments}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/superadmin/residences')}
            className="w-full p-6 border-2 border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className="text-4xl bg-indigo-100 p-3 rounded-full group-hover:bg-indigo-200 transition-colors">🏛️</span>
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold text-gray-800">Gestionar Residencias</h3>
                <p className="text-gray-600">Crear, editar o desactivar residencias y sus configuraciones</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => navigate('/superadmin/administrators')}
            className="w-full p-6 border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition-colors group"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className="text-4xl bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors">👥</span>
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold text-gray-800">Gestionar Administradores</h3>
                <p className="text-gray-600">Ver y gestionar cuentas de administradores del sistema</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Residencias recientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Residencias</h2>
            <button
              onClick={() => navigate('/superadmin/residences')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ver todas →
            </button>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500">Cargando...</div>
          ) : residences.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="mb-4">No hay residencias registradas</p>
              <button
                onClick={() => navigate('/superadmin/residences')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Crear Primera Residencia
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {residences.slice(0, 5).map((residence) => (
                <div
                  key={residence.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{residence.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {residence._count?.users || 0} usuarios •{' '}
                        {residence._count?.buildings || 0} torres •{' '}
                        {residence._count?.apartments || 0} departamentos
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        residence.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {residence.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
}
