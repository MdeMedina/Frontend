import apiClient from '../../api/client';
import type { Apartment, PendingApartmentPetition, AvailableManager } from './apartments.types';

export const fetchApartmentsData = async (
  user: any,
  setApartments: (a: Apartment[]) => void,
  setPendingPetitions: (p: PendingApartmentPetition[]) => void,
  setError: (e: string) => void,
  setLoading: (l: boolean) => void
) => {
  try {
    setLoading(true);
    const [aptRes, petitionsRes] = await Promise.all([
      apiClient.get('/apartments'),
      apiClient.get('/petitions', { params: { limit: 100 } })
    ]);

    const isManager = user?.role === 'ASSIGNED_MANAGER';
    const myApartments = (aptRes.data.data || aptRes.data).filter(
      (apt: Apartment) => isManager
        ? apt.manager?.id === user?.id
        : apt.owner?.id === user?.id
    );

    setApartments(myApartments);

    if (!isManager) {
      const myPendingPetitions = (petitionsRes.data.data || []).filter(
        (p: any) =>
          (p.userId === user?.id || p.user?.id === user?.id) &&
          p.status === 'PENDING' &&
          ['CREATE_APARTMENT', 'MODIFY_APARTMENT', 'DELETE_APARTMENT'].includes(p.type)
      );
      setPendingPetitions(myPendingPetitions);
    }
    setError('');
  } catch (err: any) {
    setError(err.response?.data?.message || 'Error al cargar datos');
  } finally {
    setLoading(false);
  }
};

export const fetchManagers = async (setAvailableManagers: (m: AvailableManager[]) => void) => {
  try {
    const response = await apiClient.get('/users/managers');
    setAvailableManagers(response.data.data || []);
  } catch (err) {
    console.error('Error al cargar responsables:', err);
  }
};

export const submitPetition = async (
  payload: any,
  setSuccess: (s: string) => void,
  setError: (e: string) => void,
  onSuccess?: () => void
) => {
  try {
    await apiClient.post('/petitions', payload);
    setSuccess('Petición enviada correctamente. El administrador revisará tu solicitud.');
    if (onSuccess) onSuccess();
  } catch (err: any) {
    setError(err.response?.data?.message || 'Error al enviar la petición');
  }
};
