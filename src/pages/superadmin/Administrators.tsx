import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { residencesApi } from '../../api/residences';
import { usersApi, type UpdateUserDto } from '../../api/users';
import { Layout } from '../../components/Layout';
import { formatPhoneNumber } from '../../utils/phone';
import { PhoneInput } from '../../components/PhoneInput';
import { SearchableSelect } from '../../components/SearchableSelect';
import { Modal } from '../../components/Modal';
import { Star, Plus, Search, Trash, ArrowLeft, X } from 'lucide-react';
import { handleRutInput } from '../../utils/rut';

const card         = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)]';
const input        = 'w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--color-text-primary)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]';
const label        = 'block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1';
const btnPrimary   = 'px-4 py-2 bg-primary text-white text-sm font-semibold rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity';
const btnSecondary = 'px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] hover:bg-[var(--color-border)] transition-colors';
const tdCell       = 'px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-[var(--color-border)] rounded w-24 mb-1"></div><div className="h-3 bg-[var(--color-border)] rounded w-16"></div></td>
    <td className="px-6 py-4 text-sm"><div className="h-4 bg-[var(--color-border)] rounded w-32"></div></td>
    <td className="px-6 py-4 text-sm"><div className="h-4 bg-[var(--color-border)] rounded w-20"></div></td>
    <td className="px-6 py-4 text-sm"><div className="h-4 bg-[var(--color-border)] rounded w-24"></div></td>
    <td className="px-6 py-4 text-sm"><div className="h-4 bg-[var(--color-border)] rounded w-12"></div></td>
    <td className="px-6 py-4 text-sm"><div className="h-4 bg-[var(--color-border)] rounded w-28"></div></td>
    <td className="px-6 py-4 text-sm"><div className="flex gap-2"><div className="h-4 bg-[var(--color-border)] rounded w-8"></div><div className="h-4 bg-[var(--color-border)] rounded w-12"></div></div></td>
  </tr>
);

type AdminWithResidences = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  rut?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  residences: Array<{
    id: string;
    name: string;
    isMain?: boolean;
  }>;
};

export default function Administrators() {
  const navigate = useNavigate();
  const { stopImpersonation } = useAuth();
  const [admins, setAdmins]                   = useState<AdminWithResidences[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [successMessage, setSuccessMessage]   = useState('');
  const [searchTerm, setSearchTerm]           = useState('');
  const [confirmDialog, setConfirmDialog]     = useState<{ message: string; onConfirm: () => Promise<void> } | null>(null);
  const [confirmLoading, setConfirmLoading]   = useState(false);

  // Modals
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResidencesModal, setShowResidencesModal] = useState(false);
  const [editingAdmin, setEditingAdmin]       = useState<AdminWithResidences | null>(null);
  const [adminFormData, setAdminFormData]     = useState({ firstName: '', lastName: '', email: '', rut: '', phone: '+56', password: '', residenceId: '' });
  const [isPhoneValid, setIsPhoneValid]       = useState(true);
  const [availableResidences, setAvailableResidences] = useState<{ id: string, name: string }[]>([]);
  const [selectedResidenceToAssign, setSelectedResidenceToAssign] = useState<string>('');

  useEffect(() => {
    stopImpersonation();
    fetchAdmins();
    fetchResidences();
    // Verificar si hay parámetro de crear en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setShowCreateModal(true);
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchResidences = async () => {
    try {
      const data = await residencesApi.getAll();
      setAvailableResidences(data);
    } catch (error) {
      console.error('Error al cargar residencias:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const availableAdmins = await residencesApi.getAvailableAdmins(true);
      const adminsWithDetails = await Promise.all(
        availableAdmins.map(async (admin) => {
          try {
            const userDetails = await usersApi.getById(admin.id);
            return {
              ...admin,
              rut: (userDetails as any).rut,
              isActive: userDetails.isActive,
              lastLogin: userDetails.lastLogin,
              createdAt: userDetails.createdAt,
              residences: admin.residences || (admin.residence ? [admin.residence] : []),
            };
          } catch {
            return {
              ...admin,
              isActive: true,
              createdAt: new Date().toISOString(),
              residences: admin.residences || (admin.residence ? [admin.residence] : []),
            };
          }
        })
      );
      setAdmins(adminsWithDetails);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  };

  const refreshAdminInModal = async (adminId: string) => {
    try {
      const updatedAdmins = await residencesApi.getAvailableAdmins(true);
      const updatedAdmin = updatedAdmins.find(a => a.id === adminId);
      if (!updatedAdmin) return;

      try {
        const userDetails = await usersApi.getById(updatedAdmin.id);
        setEditingAdmin({
          ...updatedAdmin,
          rut: (userDetails as any).rut,
          isActive: userDetails.isActive,
          lastLogin: userDetails.lastLogin,
          createdAt: userDetails.createdAt,
          residences: updatedAdmin.residences || (updatedAdmin.residence ? [updatedAdmin.residence] : []),
        });
      } catch {
        setEditingAdmin({
          ...updatedAdmin,
          isActive: true,
          createdAt: new Date().toISOString(),
          residences: updatedAdmin.residences || (updatedAdmin.residence ? [updatedAdmin.residence] : []),
        });
      }
    } catch (err) {
      console.error('Error refreshing admin:', err);
    }
  };

  // Filtrar administradores por búsqueda
  const filteredAdmins = useMemo(() => {
    if (!searchTerm) return admins;
    const term = searchTerm.toLowerCase();
    return admins.filter(admin =>
      admin.firstName.toLowerCase().includes(term) ||
      admin.lastName.toLowerCase().includes(term) ||
      `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(term) ||
      admin.email.toLowerCase().includes(term) ||
      (admin.rut && admin.rut.toLowerCase().includes(term)) ||
      admin.residences.some(r => r.name.toLowerCase().includes(term))
    );
  }, [admins, searchTerm]);

  // ── Confirmation helper ────────────────────────────────────────────────
  const showConfirm = (message: string, onConfirm: () => Promise<void>) => {
    setConfirmDialog({ message, onConfirm });
  };

  const runConfirm = async () => {
    if (!confirmDialog) return;
    setConfirmLoading(true);
    try {
      await confirmDialog.onConfirm();
    } finally {
      setConfirmLoading(false);
      setConfirmDialog(null);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleEditAdmin = (admin: AdminWithResidences) => {
    setEditingAdmin(admin);
    setAdminFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      rut: admin.rut || '',
      phone: admin.phone || '+56',
      password: '',
      residenceId: '',
    });
    setShowEditModal(true);
    setError(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAdmin(null);
    setAdminFormData({ firstName: '', lastName: '', email: '', rut: '', phone: '+56', password: '', residenceId: '' });
    setIsPhoneValid(true);
    setError(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setAdminFormData({ firstName: '', lastName: '', email: '', rut: '', phone: '+56', password: '', residenceId: '' });
    setIsPhoneValid(true);
    setError(null);
  };

  const handleSubmitCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar teléfono
    if (adminFormData.phone && !isPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }

    // Validar contraseña
    if (!adminFormData.password || adminFormData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await usersApi.create({
        firstName: adminFormData.firstName,
        lastName: adminFormData.lastName,
        email: adminFormData.email,
        rut: adminFormData.rut,
        phone: adminFormData.phone || undefined,
        password: adminFormData.password,
        role: 'ADMIN',
        residenceId: adminFormData.residenceId || undefined, // Enviar residencia si se seleccionó
      });
      await fetchAdmins();
      handleCloseCreateModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear administrador');
    }
  };

  const handleSubmitAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editingAdmin) return;

    // Validar teléfono
    if (adminFormData.phone && !isPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }

    try {
      const updateData: UpdateUserDto = {
        firstName: adminFormData.firstName,
        lastName: adminFormData.lastName,
        email: adminFormData.email,
        rut: adminFormData.rut,
        phone: adminFormData.phone || undefined,
      };
      await usersApi.update(editingAdmin.id, updateData);
      await fetchAdmins();
      handleCloseEditModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar administrador');
    }
  };

  const handleManageResidences = (admin: AdminWithResidences) => {
    setEditingAdmin(admin);
    setShowResidencesModal(true);
    setError(null);
  };

  const handleCloseResidencesModal = () => {
    setShowResidencesModal(false);
    setEditingAdmin(null);
    setSelectedResidenceToAssign('');
    setError(null);
  };

  const handleAssignResidence = async () => {
    if (!editingAdmin || !selectedResidenceToAssign) return;
    try {
      setError(null);
      const res = availableResidences.find(r => r.id === selectedResidenceToAssign);
      await residencesApi.update(selectedResidenceToAssign, res?.name || '', { userId: editingAdmin.id });
      await fetchAdmins();
      await refreshAdminInModal(editingAdmin.id);
      setSelectedResidenceToAssign('');
      showSuccess(`Residencia "${res?.name}" asignada correctamente`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al asignar residencia');
    }
  };

  const handleRemoveResidence = async (residenceId: string) => {
    if (!editingAdmin) return;
    const res = editingAdmin.residences.find(r => r.id === residenceId);
    if (!res) return;

    showConfirm(
      `¿Remover a ${editingAdmin.firstName} ${editingAdmin.lastName} de "${res.name}"? Si es su única residencia, la cuenta se desactivará.`,
      async () => {
        const result = await residencesApi.removeAdmin(residenceId, editingAdmin.id);
        await fetchAdmins();
        await refreshAdminInModal(editingAdmin.id);
        showSuccess(result.message);
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-primary)] mb-2">
            Super Administrador
          </p>
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/superadmin')}
                className={`${btnSecondary} flex items-center gap-2 pr-5`}
                aria-label="Volver al panel principal"
              >
                <ArrowLeft size={14} strokeWidth={2} />
                Volver
              </button>
              <h1 className="dashboard-hero-title font-bold tracking-tight text-[var(--color-text-primary)] leading-none" aria-current="page">
                Administradores
              </h1>
            </div>
            <button onClick={() => setShowCreateModal(true)}
              className={`${btnPrimary} flex items-center gap-2 shrink-0`}
              aria-label="Crear nuevo administrador">
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Crear Administrador
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-3 border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-6">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
            <button onClick={() => setError(null)}
              className="ml-auto text-xs font-semibold text-[var(--color-danger)] hover:opacity-70 transition-opacity">
              Cerrar
            </button>
          </div>
        )}
        {successMessage && (
          <div role="status" className="border border-[var(--color-action)] bg-[var(--color-action-subtle)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-6">
            <p className="text-sm text-[var(--color-action)]">{successMessage}</p>
          </div>
        )}
        {confirmDialog && (
          <div role="alertdialog"
               className="border-2 border-[var(--color-primary)] bg-[var(--color-surface)]
                          rounded-[var(--radius-sm)] px-5 py-4 mb-6 flex items-center gap-4">
            <p className="text-sm font-medium text-[var(--color-text-primary)] flex-1">{confirmDialog.message}</p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setConfirmDialog(null)} className={btnSecondary} disabled={confirmLoading}>
                Cancelar
              </button>
              <button onClick={runConfirm} disabled={confirmLoading}
                className="px-4 py-2 bg-[var(--color-danger)] text-white text-sm font-semibold
                           rounded-[var(--radius-sm)] hover:opacity-90 motion-safe:transition-opacity disabled:opacity-50">
                {confirmLoading ? 'Procesando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}

        <div className={`${card} p-4 mb-6`}>
          <label htmlFor="search" className={label}>Buscar Administrador</label>
          <div className="relative">
            <Search size={15} strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              aria-hidden="true" />
            <input
              id="search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, RUT, email o residencia…"
              className={`${input} pl-9`}
              aria-label="Filtrar administradores"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total Administradores', value: loading ? '…' : admins.length, color: 'text-[var(--color-text-primary)]', desc: 'Cuentas registradas' },
            { label: 'Administradores Activos', value: loading ? '…' : admins.filter(a => a.isActive).length, color: 'text-[var(--color-action-text)]', desc: 'Con acceso al sistema' },
            { label: 'Administradores Inactivos', value: loading ? '…' : admins.filter(a => !a.isActive).length, color: 'text-[var(--color-danger)]', desc: 'Sin residencias asignadas' },
          ].map((stat) => (
            <div key={stat.label} className={`${card} p-5 relative overflow-hidden group hover:border-[var(--color-primary)] transition-colors`}>
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${stat.color} leading-none tabular-nums tracking-tight`}>{stat.value}</p>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`${card} overflow-x-auto`}>
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-background)]">
              <tr>
                {['Administrador', 'Email', 'RUT', 'Residencias', 'Estado', 'Acceso', 'Acciones'].map(col => (
                  <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest bg-[var(--color-background)]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">
                    {searchTerm ? 'No se encontraron administradores' : 'No hay administradores registrados'}
                  </td>
                </tr>
              ) : filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-[var(--color-background)] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{admin.firstName} {admin.lastName}</p>
                    {admin.phone && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatPhoneNumber(admin.phone)}</p>}
                  </td>
                  <td className={tdCell}>{admin.email}</td>
                  <td className={tdCell}>{admin.rut || '-'}</td>
                  <td className="px-6 py-4">
                    {admin.residences && admin.residences.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">
                          {admin.residences.length} {admin.residences.length === 1 ? 'residencia' : 'residencias'}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {admin.residences.slice(0, 3).map((residence) => (
                            <span key={residence.id}
                                  className="px-2 py-0.5 text-[10px] font-bold rounded-[var(--radius-sm)]
                                             bg-[var(--color-primary-subtle)] text-[var(--color-primary)]
                                             border border-[var(--color-border)] flex items-center gap-1">
                              {residence.name}
                              {residence.isMain && <Star size={8} strokeWidth={3} className="text-[var(--color-warning)] fill-[var(--color-warning)]" aria-label="Principal" />}
                            </span>
                          ))}
                          {admin.residences.length > 3 && (
                            <span className="px-2 py-0.5 text-[10px] items-center text-[var(--color-text-muted)] bg-[var(--color-background)]
                                             rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                              +{admin.residences.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--color-danger)] uppercase tracking-tighter">Sin residencias</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Cuenta inactiva</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-[var(--radius-sm)]
                      ${admin.isActive
                        ? 'bg-[var(--color-action-subtle)] text-[var(--color-action-text)]'
                        : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'}`}>
                      {admin.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={tdCell}>
                    {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString('es-ES') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleEditAdmin(admin)}
                        className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-tight
                                   hover:underline underline-offset-4 decoration-2 transition-all">
                        PerfiL
                      </button>
                      <button onClick={() => handleManageResidences(admin)}
                        className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-tight
                                   hover:underline underline-offset-4 decoration-2 transition-all">
                        Residencias ({admin.residences.length})
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={showEditModal && !!editingAdmin}
          onClose={handleCloseEditModal}
          title="Editar Administrador"
        >
          {error && (
            <div role="alert" className="border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                            rounded-[var(--radius-sm)] px-4 py-3 mb-4 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitAdminEdit} className="space-y-4">
            <div>
              <label className={label}>Nombre</label>
              <input type="text" value={adminFormData.firstName}
                onChange={(e) => setAdminFormData({ ...adminFormData, firstName: e.target.value })}
                className={input} required />
            </div>

            <div>
              <label className={label}>Apellido</label>
              <input type="text" value={adminFormData.lastName}
                onChange={(e) => setAdminFormData({ ...adminFormData, lastName: e.target.value })}
                className={input} required />
            </div>

            <div>
              <label className={label}>Email</label>
              <input type="email" value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                className={input} required />
            </div>

            <div>
              <label className={label}>RUT</label>
              <input type="text" value={adminFormData.rut || ''}
                onChange={(e) => {
                  const formatted = handleRutInput(e.target.value);
                  setAdminFormData({ ...adminFormData, rut: formatted });
                }}
                placeholder="12.345.678-9" maxLength={12} className={input} />
            </div>

            <div>
              <label className={label}>Teléfono (Opcional)</label>
              <PhoneInput
                value={adminFormData.phone || '+56'}
                onChange={(value) => setAdminFormData({ ...adminFormData, phone: value })}
                onValidationChange={(isValid) => setIsPhoneValid(isValid)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleCloseEditModal} className={btnSecondary}>Cancelar</button>
              <button type="submit" className={btnPrimary}>Guardar Cambios</button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          title="Crear Nuevo Administrador"
        >
          {error && (
            <div role="alert" className="border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                            rounded-[var(--radius-sm)] px-4 py-3 mb-4 text-sm text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitCreateAdmin} className="space-y-4">
            <div>
              <label className={label}>Nombre</label>
              <input type="text" value={adminFormData.firstName}
                onChange={(e) => setAdminFormData({ ...adminFormData, firstName: e.target.value })}
                className={input} required />
            </div>

            <div>
              <label className={label}>Apellido</label>
              <input type="text" value={adminFormData.lastName}
                onChange={(e) => setAdminFormData({ ...adminFormData, lastName: e.target.value })}
                className={input} required />
            </div>

            <div>
              <label className={label}>Email</label>
              <input type="email" value={adminFormData.email}
                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                className={input} required />
            </div>

            <div>
              <label className={label}>Contraseña</label>
              <input type="password" value={adminFormData.password}
                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                className={input} required minLength={8} placeholder="Mínimo 8 caracteres" />
            </div>

            <div>
              <label className={label}>RUT</label>
              <input type="text" value={adminFormData.rut || ''}
                onChange={(e) => {
                  const formatted = handleRutInput(e.target.value);
                  setAdminFormData({ ...adminFormData, rut: formatted });
                }}
                placeholder="12.345.678-9" maxLength={12} className={input} />
            </div>

            <div>
              <label className={label}>Teléfono (Opcional)</label>
              <PhoneInput
                value={adminFormData.phone || '+56'}
                onChange={(value) => setAdminFormData({ ...adminFormData, phone: value })}
                onValidationChange={(isValid) => setIsPhoneValid(isValid)}
              />
            </div>

            <div>
              <label className={label}>Asignar Residencia (Opcional)</label>
              <SearchableSelect
                options={availableResidences}
                value={adminFormData.residenceId}
                onChange={(value) => setAdminFormData({ ...adminFormData, residenceId: String(value) })}
                placeholder="Buscar y seleccionar residencia..."
              />
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1 tracking-tight">
                Puedes asignar una residencia inicial ahora. Podrás agregar más después.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleCloseCreateModal} className={btnSecondary}>Cancelar</button>
              <button type="submit" className={btnPrimary}>Crear Administrador</button>
            </div>
          </form>
        </Modal>

        {/* Modal de gestión de residencias */}
        <Modal
          isOpen={showResidencesModal && !!editingAdmin}
          onClose={handleCloseResidencesModal}
          title={`Residencias de ${editingAdmin?.firstName} ${editingAdmin?.lastName}`}
        >
          <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            {error && (
              <div role="alert" className="border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                              rounded-[var(--radius-sm)] px-4 py-3 mb-6 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            )}

            <div className={`${card} p-4 mb-8`}>
              <h4 className={label}>Asignar Nueva Residencia</h4>
              <div className="flex gap-2">
                <div className="flex-grow">
                  <SearchableSelect
                    options={availableResidences.filter(r => !editingAdmin?.residences.some(ar => ar.id === r.id))}
                    value={selectedResidenceToAssign}
                    onChange={(value) => setSelectedResidenceToAssign(String(value))}
                    placeholder="Seleccionar residencia..."
                  />
                </div>
                <button
                  onClick={handleAssignResidence}
                  disabled={!selectedResidenceToAssign}
                  className={btnPrimary}
                >
                  Asignar
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                Residencias Asignadas ({editingAdmin?.residences.length || 0})
              </div>
              
              {editingAdmin?.residences.length === 0 && (
                <div className="text-xs font-medium text-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-3 rounded-[var(--radius-sm)] border border-[var(--color-danger)]">
                  Este administrador no tiene residencias asignadas. Su cuenta está inactiva.
                </div>
              )}

              {editingAdmin && editingAdmin.residences.length > 0 ? (
                <div className="space-y-2">
                  {editingAdmin.residences.map((residence) => (
                    <div
                      key={residence.id}
                      className={`${card} p-3 flex justify-between items-center group hover:border-[var(--color-primary)] transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></div>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{residence.name}</span>
                        {residence.isMain && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-[var(--radius-sm)] bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-warning)]">
                            Principal
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveResidence(residence.id)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] rounded-[var(--radius-sm)] transition-all"
                        aria-label={`Remover ${residence.name}`}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-[var(--color-text-muted)] font-medium bg-[var(--color-background)] rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)]">
                  No hay residencias asignadas
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleCloseResidencesModal}
                className={btnSecondary}
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
