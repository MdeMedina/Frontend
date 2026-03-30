import { buildingsApi } from '../../api/buildings';
import type { Building, CreateBuildingDto, UpdateBuildingDto } from '../../api/buildings';
import { apartmentsApi } from '../../api/apartments';

export const fetchBuildingsList = async (setBuildings: (b: Building[]) => void, setError: (e: string) => void, setLoading: (l: boolean) => void) => {
  try {
    setLoading(true);
    const response = await buildingsApi.getAll(true);
    setBuildings(response.data);
  } catch (err) {
    setError('Error al cargar las torres');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

export const handleBuildingSubmit = async (
  editingBuilding: Building | null,
  formData: CreateBuildingDto,
  setSuccess: (s: string) => void,
  setError: (e: string) => void,
  setShowModal: (s: boolean) => void,
  setSubmitting: (s: boolean) => void,
  onSuccess: () => void
) => {
  setSubmitting(true);
  setError('');
  try {
    if (editingBuilding) {
      await buildingsApi.update(editingBuilding.id, formData as UpdateBuildingDto);
      setSuccess('Torre actualizada correctamente');
    } else {
      await buildingsApi.create(formData);
      setSuccess('Torre creada correctamente');
    }
    setShowModal(false);
    onSuccess();
  } catch (err: any) {
    setError(err.response?.data?.message || 'Error al guardar la torre');
  } finally {
    setSubmitting(false);
  }
};

export const handleBuildingDelete = async (
  building: Building,
  canDelete: boolean,
  setSuccess: (s: string) => void,
  setError: (e: string) => void,
  onSuccess: () => void
) => {
  if (!confirm(`¿Estás seguro de que deseas eliminar/desactivar la torre "${building.name}"?`)) {
    return;
  }
  try {
    await buildingsApi.delete(building.id);
    setSuccess(`Torre "${building.name}" eliminada/desactivada correctamente`);
    onSuccess();
  } catch (err: any) {
    setError(err.response?.data?.message || 'Error al eliminar la torre');
  }
};

export const handleBuildingToggleActive = async (
  building: Building,
  setSuccess: (s: string) => void,
  setError: (e: string) => void,
  onSuccess: () => void
) => {
  try {
    await buildingsApi.update(building.id, { isActive: !building.isActive });
    setSuccess(`Torre "${building.name}" ${building.isActive ? 'desactivada' : 'activada'} correctamente`);
    onSuccess();
  } catch (err: any) {
    setError(err.response?.data?.message || 'Error al cambiar estado de la torre');
  }
};

export const downloadApartmentTemplate = async (setError: (e: string) => void) => {
  try {
    const blob = await apartmentsApi.downloadTemplate();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_departamentos.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    setError('Error al descargar la plantilla');
    console.error(err);
  }
};
