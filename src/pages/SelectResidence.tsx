import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const SelectResidence = () => {
  const { user, selectResidence, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Si no hay usuario, ir al login
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSelect = (residence: { id: string; name: string }) => {
    selectResidence(residence);
    
    // Redirigir según el rol
    switch (user?.role) {
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'OWNER':
        navigate('/propietario');
        break;
      default:
        navigate('/');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Seleccione una Residencia
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Usted tiene acceso a múltiples residencias. Por favor seleccione cuál desea gestionar.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          {user.availableResidences && user.availableResidences.length > 0 ? (
            user.availableResidences.map((res) => (
              <button
                key={res.id}
                onClick={() => handleSelect(res)}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-indigo-50 hover:border-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div className="flex items-center">
                  <span className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    🏢
                  </span>
                  <div className="ml-4 text-left">
                    <p className="text-lg font-medium text-gray-900">{res.name}</p>
                  </div>
                </div>
                <span className="text-indigo-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            ))
          ) : (
            <div className="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
              No se encontraron residencias disponibles.
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};
