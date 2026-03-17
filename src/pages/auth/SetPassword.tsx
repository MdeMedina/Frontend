import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../api/client';

export default function SetPassword() {
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;

    setIsPending(true);
    setError(null);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      const data = response.data;
      
      // Auto login
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.message || 'Hubo un error al establecer tu contraseña. El enlace puede ser inválido o haber expirado.');
    } finally {
      setIsPending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen grid items-center justify-center p-4 bg-[#0a0f16]">
        <div className="absolute inset-0 z-0 text-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 opacity-50"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">¡Contraseña Configurada!</h2>
            <p className="text-gray-400 text-center mb-8">
              Tu contraseña ha sido guardada correctamente y tu sesión ha iniciado.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Ir al Inicio <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0A0F16]">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 opacity-50"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo or Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 mb-6 shadow-lg shadow-indigo-500/20">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Configura tu Contraseña
          </h1>
          <p className="text-gray-400">
            Ingresa una contraseña segura para tu cuenta.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
               <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
               <p className="text-sm text-red-400 font-medium">
                 {error}
               </p>
             </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  className="w-full bg-[#0A0F16] border border-white/10 text-white rounded-xl px-4 py-3 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  className={`w-full bg-[#0A0F16] border ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-500/50 focus:ring-red-500/50' 
                      : 'border-white/10 focus:ring-indigo-500/50'
                  } text-white rounded-xl px-4 py-3 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-400">Las contraseñas no coinciden.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending || password !== confirmPassword || password.length < 8}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Establecer Contraseña e Ingresar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
