import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { residencesApi, type Residence } from '../../api/residences';
import { usersApi, type UpdateUserDto } from '../../api/users';
import { Layout } from '../../components/Layout';
import { formatPhoneNumber } from '../../utils/phone';
import { PhoneInput } from '../../components/PhoneInput';
import { Modal } from '../../components/Modal';
import { Star, Plus, Search } from 'lucide-react';

const card         = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)]';
const input        = 'w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--color-text-primary)] bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]';
const label        = 'block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1';
const btnPrimary   = 'px-4 py-2 bg-primary text-white text-sm font-semibold rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity';
const btnSecondary = 'px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] rounded-[var(--radius-sm)] hover:bg-[var(--color-border)] transition-colors';
const tdCell       = 'px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]';

type AdminShape = { id: string; firstName: string; lastName: string; email: string; phone?: string };
type ConfirmDialog = { message: string; onConfirm: () => Promise<void> } | null;

export default function Residences() {
  const navigate = useNavigate();
  const { startImpersonation, stopImpersonation } = useAuth();

  const [residences, setResidences]           = useState<Residence[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [successMessage, setSuccessMessage]   = useState('');
  const [searchTerm, setSearchTerm]           = useState('');
  const [confirmDialog, setConfirmDialog]     = useState<ConfirmDialog>(null);
  const [confirmLoading, setConfirmLoading]   = useState(false);

  // Modal — create/edit residence
  const [showModal, setShowModal]             = useState(false);
  const [editingResidence, setEditingResidence] = useState<Residence | null>(null);
  const [formData, setFormData]               = useState({ name: '' });
  const [createAdmin, setCreateAdmin]         = useState(false);
  const [assignAdmin, setAssignAdmin]         = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [newAdminData, setNewAdminData]       = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [availableAdmins, setAvailableAdmins] = useState<Array<{ id: string; email: string; firstName: string; lastName: string; phone?: string; residenceId?: string; residence?: { id: string; name: string } }>>([]);
  const [loadingAdmins, setLoadingAdmins]     = useState(false);
  const [isPhoneValid, setIsPhoneValid]       = useState(true);

  // Modal — residence details
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState<Residence | null>(null);

  // Modal — edit admin
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin]         = useState<AdminShape | null>(null);
  const [adminFormData, setAdminFormData]       = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [isAdminPhoneValid, setIsAdminPhoneValid] = useState(true);

  // ── Data fetching ──────────────────────────────────────────────────────
  const fetchResidences = async () => {
    try {
      setLoading(true);
      setResidences(await residencesApi.getAll());
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar residencias';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAdmins = async () => {
    try {
      setLoadingAdmins(true);
      setAvailableAdmins(await residencesApi.getAvailableAdmins(true));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar administradores disponibles';
      setError(msg);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => { stopImpersonation(); fetchResidences(); }, []);

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

  const handleOpenModal = async (residence?: Residence) => {
    await fetchAvailableAdmins();
    setCreateAdmin(false);
    setAssignAdmin(false);
    setSelectedAdminId('');
    setError(null);
    if (residence) {
      const detailed = await residencesApi.getById(residence.id);
      setEditingResidence(detailed);
      setFormData({ name: detailed.name });
    } else {
      setEditingResidence(null);
      setFormData({ name: '' });
      setNewAdminData({ firstName: '', lastName: '', email: '', phone: '+56' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingResidence(null);
    setFormData({ name: '' });
    setNewAdminData({ firstName: '', lastName: '', email: '', phone: '' });
    setCreateAdmin(false);
    setAssignAdmin(false);
    setSelectedAdminId('');
    setAvailableAdmins([]);
    setError(null);
  };

  // ── Submit residence form ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (createAdmin && newAdminData.phone && !isPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }

    try {
      let admin: object | undefined;
      if (assignAdmin && selectedAdminId) {
        admin = { userId: selectedAdminId };
      } else if (createAdmin && newAdminData.email && newAdminData.firstName && newAdminData.lastName) {
        admin = {
          email:     newAdminData.email,
          firstName: newAdminData.firstName,
          lastName:  newAdminData.lastName,
          phone:     newAdminData.phone || undefined,
        };
      }

      if (editingResidence) {
        await residencesApi.update(editingResidence.id, formData.name, admin);
        const updated = await residencesApi.getById(editingResidence.id);
        setEditingResidence(updated);
      } else {
        await residencesApi.create(formData.name, admin);
      }
      await fetchResidences();
      handleCloseModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar residencia';
      setError(msg);
    }
  };

  // ── Table actions ──────────────────────────────────────────────────────
  const handleToggleActive = async (residence: Residence) => {
    try {
      await residencesApi.toggleActive(residence.id);
      await fetchResidences();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar residencia';
      setError(msg);
    }
  };

  const handleDelete = (residence: Residence) => {
    showConfirm(
      `¿Eliminar la residencia "${residence.name}"? Esta acción no se puede deshacer.`,
      async () => {
        await residencesApi.delete(residence.id);
        await fetchResidences();
      }
    );
  };

  // ── Details modal ──────────────────────────────────────────────────────
  const handleViewDetails = async (residence: Residence) => {
    try {
      setSelectedResidence(await residencesApi.getById(residence.id));
      setShowDetailsModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar detalles';
      setError(msg);
    }
  };

  const handleRemoveAdmin = (adminId: string) => {
    if (!selectedResidence) return;
    const admin = selectedResidence.admins?.find(a => a.id === adminId);
    if (!admin) return;
    showConfirm(
      `¿Remover a ${admin.firstName} ${admin.lastName} de esta residencia? Si no tiene otras residencias asignadas, su cuenta será desactivada.`,
      async () => {
        const result = await residencesApi.removeAdmin(selectedResidence.id, adminId);
        setSelectedResidence(await residencesApi.getById(selectedResidence.id));
        await fetchResidences();
        showSuccess(result.message);
      }
    );
  };

  // ── Edit modal — set main admin ────────────────────────────────────────
  const handleSetMainAdmin = (adminId: string) => {
    if (!editingResidence) return;
    showConfirm(
      '¿Designar a este administrador como Principal? El administrador principal actual dejará de serlo.',
      async () => {
        const result = await residencesApi.setMainAdmin(editingResidence.id, adminId);
        setEditingResidence(await residencesApi.getById(editingResidence.id));
        await fetchResidences();
        showSuccess(result.message);
      }
    );
  };

  // ── Edit modal — remove admin ──────────────────────────────────────────
  const handleRemoveAdminFromEdit = (admin: AdminShape) => {
    if (!editingResidence) return;
    showConfirm(
      `¿Remover a ${admin.firstName} ${admin.lastName} de esta residencia? Si no tiene otras residencias asignadas, su cuenta será desactivada.`,
      async () => {
        const result = await residencesApi.removeAdmin(editingResidence.id, admin.id);
        setEditingResidence(await residencesApi.getById(editingResidence.id));
        await fetchResidences();
        showSuccess(result.message);
      }
    );
  };

  // ── Edit admin modal ────────────────────────────────────────────────────
  const handleEditAdmin = (admin: AdminShape) => {
    setEditingAdmin(admin);
    setAdminFormData({ firstName: admin.firstName, lastName: admin.lastName, email: admin.email, phone: admin.phone || '+56' });
    setShowEditAdminModal(true);
    setError(null);
  };

  const handleCloseEditAdminModal = () => {
    setShowEditAdminModal(false);
    setEditingAdmin(null);
    setAdminFormData({ firstName: '', lastName: '', email: '', phone: '+56' });
    setError(null);
  };

  const handleSubmitAdminEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editingAdmin) return;
    if (adminFormData.phone && !isAdminPhoneValid) {
      setError('Por favor, ingresa un número de teléfono válido');
      return;
    }
    try {
      const updateData: UpdateUserDto = {
        firstName: adminFormData.firstName,
        lastName:  adminFormData.lastName,
        email:     adminFormData.email,
        phone:     adminFormData.phone || undefined,
      };
      await usersApi.update(editingAdmin.id, updateData);
      if (selectedResidence) {
        setSelectedResidence(await residencesApi.getById(selectedResidence.id));
      }
      await fetchResidences();
      handleCloseEditAdminModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar administrador';
      setError(msg);
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────
  const filteredResidences = useMemo(() => {
    if (!searchTerm) return residences;
    const term = searchTerm.toLowerCase();
    return residences.filter(r => {
      if (r.name.toLowerCase().includes(term)) return true;
      return r.admins?.some(a =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term)
      ) ?? false;
    });
  }, [residences, searchTerm]);

  // ── Render ─────────────────────────────────────────────────────────────
  // Loading Skeleton
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-[var(--color-border)] rounded w-32"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-[var(--color-border)] rounded w-16"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-[var(--color-border)] rounded w-8 mx-auto"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-[var(--color-border)] rounded w-8 mx-auto"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-[var(--color-border)] rounded w-8 mx-auto"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-[var(--color-border)] rounded w-8 mx-auto"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-[var(--color-border)] rounded w-24"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="flex gap-2"><div className="h-6 bg-[var(--color-border)] rounded w-16"></div><div className="h-6 bg-[var(--color-border)] rounded w-12"></div></div></td>
    </tr>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-primary)] mb-2">
            Super Administrador
          </p>
          <div className="flex items-end justify-between gap-4">
            <h1 aria-current="page" className="dashboard-hero-title font-bold tracking-tight text-[var(--color-text-primary)] leading-none">
              Residencias
            </h1>
            <button onClick={() => handleOpenModal()}
              className={`${btnPrimary} flex items-center gap-2 shrink-0`}>
              <Plus size={14} strokeWidth={2} aria-hidden="true" />
              Nueva Residencia
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
          <label htmlFor="search" className={label}>Buscar Residencia o Administrador</label>
          <div className="relative">
            <Search size={15} strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              aria-hidden="true" />
            <input
              id="search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre de residencia o administrador…"
              className={`${input} pl-9`}
            />
          </div>
        </div>

        <div className={`${card} overflow-x-auto`}>
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-background)]">
              <tr>
                {['Nombre', 'Estado', 'Usuarios', 'Torres', 'Departamentos', 'Reservas', 'Administradores', 'Acciones'].map(col => (
                  <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest bg-[var(--color-background)]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredResidences.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">
                    {searchTerm ? 'No se encontraron residencias con ese nombre' : 'No hay residencias registradas'}
                  </td>
                </tr>
              ) : filteredResidences.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">{r.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-[var(--radius-sm)]
                      ${r.isActive
                        ? 'bg-[var(--color-action-subtle)] text-[var(--color-action-text)]'
                        : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'}`}>
                      {r.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className={tdCell}>{r._count?.users || 0}</td>
                  <td className={tdCell}>{r._count?.buildings || 0}</td>
                  <td className={tdCell}>{r._count?.apartments || 0}</td>
                  <td className={tdCell}>{r._count?.stays || 0}</td>
                  <td className={tdCell}>
                    {r.admins && r.admins.length > 0 ? (
                      <div className="space-y-0.5">
                        {r.admins.slice(0, 2).map((a) => (
                          <div key={a.id} className="flex items-center gap-1">
                            <span>{a.firstName} {a.lastName}</span>
                            {a.isMain && (
                              <Star size={11} strokeWidth={1.5} className="text-[var(--color-warning)] fill-[var(--color-warning)]" aria-label="Principal" />
                            )}
                          </div>
                        ))}
                        {r.admins.length > 2 && <div className="text-xs">+{r.admins.length - 2} más</div>}
                      </div>
                    ) : 'Sin administradores'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { startImpersonation(r.id, r.name); navigate('/admin'); }}
                        title="Gestionar como Administrador"
                        className="px-2.5 py-1 text-xs font-semibold
                                   bg-[var(--color-primary-subtle)] text-[var(--color-primary)]
                                   rounded-[var(--radius-sm)] hover:opacity-80 transition-opacity">
                        Gestionar
                      </button>
                      <button onClick={() => handleViewDetails(r)}
                        aria-label={`Ver detalles de ${r.name}`}
                        className="text-xs font-medium text-[var(--color-primary)] hover:opacity-75 transition-opacity">
                        Detalles
                      </button>
                      <button onClick={() => handleOpenModal(r)}
                        aria-label={`Editar residencia ${r.name}`}
                        className="text-xs font-medium text-[var(--color-primary)] hover:opacity-75 transition-opacity">
                        Editar
                      </button>
                      <button onClick={() => handleToggleActive(r)}
                        className={`text-xs font-medium transition-opacity hover:opacity-75
                          ${r.isActive ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-action)]'}`}>
                        {r.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      {!r.isActive && (!r._count || (r._count.users === 0 && r._count.buildings === 0 && r._count.apartments === 0 && r._count.stays === 0)) && (
                        <button onClick={() => handleDelete(r)}
                          aria-label={`Eliminar residencia ${r.name}`}
                          className="text-xs font-medium text-[var(--color-danger)] hover:opacity-75 transition-opacity">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={handleCloseModal}
             title={editingResidence ? 'Editar Residencia' : 'Nueva Residencia'}>
        {error && (
          <div role="alert" className="border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-4 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}
        {successMessage && (
          <div role="status" className="border border-[var(--color-action)] bg-[var(--color-action-subtle)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-4 text-sm text-[var(--color-action)]">
            {successMessage}
          </div>
        )}
        {confirmDialog && (
          <div role="alertdialog"
               className="border-2 border-[var(--color-primary)] bg-[var(--color-surface)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-4 flex items-center gap-4">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={label}>Nombre de la Residencia</label>
            <input type="text" value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              className={input} required placeholder="Ej: Residencia Principal" />
          </div>

          {editingResidence && editingResidence.admins && editingResidence.admins.length > 0 && (
            <div className="border-t border-[var(--color-border)] pt-4">
              <h3 className={`${label} mb-3`}>Administradores Actuales ({editingResidence.admins.length})</h3>
              <div className="space-y-2">
                {editingResidence.admins.map((a) => (
                  <div key={a.id} className={`${card} p-3 flex items-center justify-between`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {a.firstName} {a.lastName}
                        </span>
                        {a.isMain && (
                          <span className="bg-[var(--color-warning-subtle)] text-[var(--color-warning)]
                                           text-xs px-2 py-0.5 rounded-[var(--radius-sm)] font-semibold border border-[var(--color-border)]">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {a.email}{a.phone && ` · ${formatPhoneNumber(a.phone)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!a.isMain && (
                        <button type="button" onClick={() => handleSetMainAdmin(a.id)}
                          aria-label={`Designar a ${a.firstName} como principal`}
                          className="px-2.5 py-1 text-xs font-semibold
                                     bg-[var(--color-primary-subtle)] text-[var(--color-primary)]
                                     rounded-[var(--radius-sm)] hover:opacity-80 transition-opacity">
                          Principal
                        </button>
                      )}
                      <button type="button" onClick={() => handleRemoveAdminFromEdit(a)}
                        aria-label={`Remover a ${a.firstName} de la residencia`}
                        className="px-2.5 py-1 text-xs font-semibold text-white
                                   bg-[var(--color-danger)] rounded-[var(--radius-sm)]
                                   hover:opacity-90 transition-opacity">
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-[var(--color-border)] pt-4">
            <h3 className={`${label} mb-3`}>{editingResidence ? 'Agregar Administrador' : 'Gestionar Administrador'}</h3>
            <div className="space-y-2">
              {[
                { id: 'assignAdmin',  checked: assignAdmin, label: 'Asignar administrador existente',
                  onChange: (v: boolean) => { setAssignAdmin(v); if (v) setCreateAdmin(false); } },
                { id: 'createAdmin',  checked: createAdmin, label: 'Crear nuevo administrador',
                  onChange: (v: boolean) => { setCreateAdmin(v); if (v) { setAssignAdmin(false); setSelectedAdminId(''); } } },
              ].map(({ id, checked, label: lbl, onChange }) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id={id} checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="h-4 w-4 accent-[var(--color-primary)] rounded-[var(--radius-sm)]" />
                  <span className="text-sm text-[var(--color-text-primary)]">{lbl}</span>
                </label>
              ))}
            </div>

            {assignAdmin && (
              <div className={`mt-3 ${card} p-4`}>
                <label className={label}>Seleccionar Administrador</label>
                {loadingAdmins ? (
                  <p className="text-sm text-[var(--color-text-muted)]">Cargando administradores…</p>
                ) : (
                  <select value={selectedAdminId} onChange={(e) => setSelectedAdminId(e.target.value)}
                    className={input} required={assignAdmin}>
                    <option value="">Seleccione un administrador</option>
                    {availableAdmins.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.firstName} {a.lastName} ({a.email}){a.residence ? ` — Actual: ${a.residence.name}` : ' — Sin residencia'}
                      </option>
                    ))}
                  </select>
                )}
                {availableAdmins.length === 0 && !loadingAdmins && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">No hay administradores disponibles</p>
                )}
              </div>
            )}

            {createAdmin && (
              <div className={`mt-3 ${card} p-4 space-y-3`}>
                <h4 className={label}>Datos del Nuevo Administrador</h4>
                {(['firstName', 'lastName'] as const).map((field) => (
                  <div key={field}>
                    <label className={label}>{field === 'firstName' ? 'Nombre' : 'Apellido'}</label>
                    <input type="text" value={newAdminData[field]}
                      onChange={(e) => setNewAdminData({ ...newAdminData, [field]: e.target.value })}
                      className={input} required={createAdmin}
                      placeholder={field === 'firstName' ? 'Nombre' : 'Apellido'} />
                  </div>
                ))}
                <div>
                  <label className={label}>Email</label>
                  <input type="email" value={newAdminData.email}
                    onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                    className={input} required={createAdmin} placeholder="email@ejemplo.com" />
                </div>
                <div>
                  <label className={label}>Teléfono (opcional)</label>
                  <PhoneInput value={newAdminData.phone || '+56'}
                    onChange={(v) => setNewAdminData({ ...newAdminData, phone: v })}
                    onValidationChange={(ok) => setIsPhoneValid(ok)} />
                </div>
                <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-primary-subtle)]
                               rounded-[var(--radius-sm)] px-3 py-2">
                  Contraseña predeterminada: <strong>12345678</strong>
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className={btnSecondary}>Cancelar</button>
            <button type="submit" className={btnPrimary}>{editingResidence ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDetailsModal}
             onClose={() => { setShowDetailsModal(false); setSelectedResidence(null); }}
             title="Detalles de la Residencia" width="max-w-3xl">
        <div className="space-y-5">
          <div className={`${card} p-4`}>
            <h3 className={`${label} mb-3`}>Información General</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--color-text-muted)]">Nombre:</span>
                <span className="ml-2 font-medium text-[var(--color-text-primary)]">{selectedResidence?.name}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Estado:</span>
                <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-[var(--radius-sm)]
                  ${selectedResidence?.isActive
                    ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                    : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'}`}>
                  {selectedResidence?.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Creada:</span>
                <span className="ml-2 text-[var(--color-text-primary)]">
                  {selectedResidence && new Date(selectedResidence.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>

          <div className={`${card} p-4`}>
            <h3 className={`${label} mb-3`}>Estadísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { label: 'Usuarios',      value: selectedResidence?._count?.users      || 0 },
                { label: 'Torres',        value: selectedResidence?._count?.buildings  || 0 },
                { label: 'Departamentos', value: selectedResidence?._count?.apartments || 0 },
                { label: 'Reservas',      value: selectedResidence?._count?.stays      || 0 },
              ].map(({ label: lbl, value }) => (
                <div key={lbl}>
                  <p className="text-xs text-[var(--color-text-muted)]">{lbl}</p>
                  <p className="text-2xl font-bold text-[var(--color-primary)] tabular-nums leading-none mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-4`}>
            <h3 className={`${label} mb-3`}>Administradores ({selectedResidence?.admins?.length || 0})</h3>
            {selectedResidence?.admins && selectedResidence.admins.length > 0 ? (
              <div className="space-y-2">
                {selectedResidence.admins.map((a) => (
                  <div key={a.id} className={`${card} p-3 flex items-start justify-between`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{a.firstName} {a.lastName}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {a.email}{a.phone && ` · ${formatPhoneNumber(a.phone)}`}
                        {a.lastLogin && ` · Último acceso: ${new Date(a.lastLogin).toLocaleString('es-ES')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {a.isMain && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-[var(--radius-sm)]
                                         bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-border)]">
                          Principal
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-[var(--radius-sm)]
                                       bg-[var(--color-background)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                        Administrador
                      </span>
                      <button onClick={() => handleRemoveAdmin(a.id)}
                        aria-label={`Remover administrador ${a.firstName}`}
                        className="text-xs font-medium text-[var(--color-danger)] hover:opacity-75 transition-opacity">
                        Remover
                      </button>
                      <button onClick={() => handleEditAdmin(a)}
                        aria-label={`Editar administrador ${a.firstName}`}
                        className="text-xs font-medium text-[var(--color-primary)] hover:opacity-75 transition-opacity">
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Esta residencia no tiene administradores asignados.</p>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={() => { setShowDetailsModal(false); setSelectedResidence(null); }}
              className={btnSecondary}>
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEditAdminModal && !!editingAdmin}
             onClose={handleCloseEditAdminModal} title="Editar Administrador">
        {error && (
          <div role="alert" className="border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-4 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmitAdminEdit} className="space-y-4">
          {(['firstName', 'lastName'] as const).map((field) => (
            <div key={field}>
              <label className={label}>{field === 'firstName' ? 'Nombre' : 'Apellido'}</label>
              <input type="text" value={adminFormData[field]}
                onChange={(e) => setAdminFormData({ ...adminFormData, [field]: e.target.value })}
                className={input} required placeholder={field === 'firstName' ? 'Nombre' : 'Apellido'} />
            </div>
          ))}
          <div>
            <label className={label}>Email</label>
            <input type="email" value={adminFormData.email}
              onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
              className={input} required placeholder="email@ejemplo.com" />
          </div>
          <div>
            <label className={label}>Teléfono (opcional)</label>
            <PhoneInput value={adminFormData.phone || '+56'}
              onChange={(v) => setAdminFormData({ ...adminFormData, phone: v })}
              onValidationChange={(ok) => setIsAdminPhoneValid(ok)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseEditAdminModal} className={btnSecondary}>Cancelar</button>
            <button type="submit" className={btnPrimary}>Actualizar</button>
          </div>
        </form>
      </Modal>

    </Layout>
  );
}
