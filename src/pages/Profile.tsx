import { useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../api/users';
import { Navigate } from 'react-router-dom';

export const Profile = () => {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await usersApi.changePassword(currentPassword, newPassword);
      setSuccess('Contraseña actualizada correctamente. Por favor inicie sesión nuevamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Opcional: Cerrar sesión después de unos segundos
      setTimeout(async () => {
         await logout();
         window.location.href = '/login';
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Mi Perfil
            </h2>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Información Personal</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sus datos personales registrados en el sistema.
                </p>
              </div>
              <div className="mt-5 md:col-span-2 md:mt-0">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <div className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm">
                        {user.firstName}
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                    <div className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm">
                        {user.lastName}
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-4">
                    <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <div className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm">
                        {user.email}
                    </div>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                    <div className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm">
                        {user.role}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden sm:block" aria-hidden="true">
          <div className="py-5">
            <div className="border-t border-gray-200" />
          </div>
        </div>

        <div className="mt-10 sm:mt-0">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Seguridad</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Actualice su contraseña periódicamente para mantener su cuenta segura.
                </p>
              </div>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <form onSubmit={handleSubmit}>
                <div className="overflow-hidden shadow sm:rounded-md">
                  <div className="bg-white px-4 py-5 sm:p-6">
                    {error && (
                      <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {success && (
                      <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-green-700">{success}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                          Contraseña Actual
                        </label>
                        <input
                          type="password"
                          name="current-password"
                          id="current-password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-1 px-1"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                          Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          name="new-password"
                          id="new-password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-1 px-1"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                          Confirmar Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          name="confirm-password"
                          id="confirm-password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-1 px-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
