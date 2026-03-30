import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../api/client';
import { authApi } from '../../../api/auth';

export type Manager = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  rut?: string;
  rutDocumentUrl?: string;
  isActive: boolean;
  managedApartments?: {
    id: string;
    number: string;
    building: string | { name: string };
  }[];
};

export type PendingManagerPetition = {
  id: string;
  type: string;
  title: string;
  status: string;
  requestedData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    managerId?: string;
  };
  createdAt: string;
};

export type MyApartment = {
  id: string;
  number: string;
  building: string | { name: string };
  managerId?: string;
};

export const useManagers = () => {
  const { user } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [myApartments, setMyApartments] = useState<MyApartment[]>([]);
  const [pendingPetitions, setPendingPetitions] = useState<PendingManagerPetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchManagers = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // 1. Fetch apartments
      const apartmentsRes = await apiClient.get('/apartments');
      const apartments = (apartmentsRes.data.data || apartmentsRes.data).filter(
        (apt: any) => apt.owner?.id === user.id
      );

      setMyApartments(apartments.map((apt: any) => ({
        id: apt.id,
        number: apt.number,
        building: apt.building,
        managerId: apt.manager?.id,
      })));

      // 2. Fetch managers
      const allManagersRes = await apiClient.get('/users/managers');
      setManagers(allManagersRes.data.data || []);

      // 3. Fetch pending petitions
      const petitionsRes = await apiClient.get('/petitions', { params: { limit: 100 } });
      const myPendingPetitions = (petitionsRes.data.data || []).filter(
        (p: any) =>
          (p.userId === user.id || p.user?.id === user.id) &&
          p.status === 'PENDING' &&
          ['CREATE_MANAGER', 'MODIFY_MANAGER', 'DELETE_MANAGER'].includes(p.type)
      );
      setPendingPetitions(myPendingPetitions);

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar responsables');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const generateResetLink = async (manager: Manager) => {
    try {
      const res = await authApi.generateResetLink(manager.id, false);
      return res.setupLink;
    } catch (err) {
      console.error('Error al generar link de reseteo:', err);
      throw err;
    }
  };

  const createManagerPetition = async (data: any) => {
    try {
      const res = await apiClient.post('/petitions', {
        type: 'CREATE_MANAGER',
        title: `Registrar nuevo responsable: ${data.firstName} ${data.lastName}`,
        reason: data.showDescription && data.description.trim() ? data.description : 'Sin descripción adicional',
        apartmentId: data.apartmentId || undefined,
        requestedData: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          rut: data.rut,
          rutDocumentUrl: data.rutDocumentUrl,
          phone: data.phone,
        },
      });
      fetchManagers();
      return res.data?.data || res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al enviar la petición de creación');
    }
  };

  const updateManagerPetition = async (managerId: string, data: any) => {
    try {
      await apiClient.post('/petitions', {
        type: 'MODIFY_MANAGER',
        title: `Modificar datos de ${data.firstName} ${data.lastName}`,
        reason: data.showDescription && data.description.trim() ? data.description : 'Sin descripción adicional',
        requestedData: {
          managerId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          rut: data.rut,
          rutDocumentUrl: data.rutDocumentUrl,
          phone: data.phone,
        },
      });
      fetchManagers();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al enviar la petición de modificación');
    }
  };

  const deleteManagerPetition = async (manager: Manager, reason: string) => {
    try {
      await apiClient.post('/petitions', {
        type: 'DELETE_MANAGER',
        title: `Eliminar responsable: ${manager.firstName} ${manager.lastName}`,
        reason,
        requestedData: {
          managerId: manager.id,
          managerName: `${manager.firstName} ${manager.lastName}`,
          managerEmail: manager.email,
          firstName: manager.firstName,
          lastName: manager.lastName,
          email: manager.email,
          phone: manager.phone,
        },
      });
      fetchManagers();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al enviar la petición de eliminación');
    }
  };

  const assignManagerPetition = async (manager: Manager, apartment: MyApartment) => {
    try {
      await apiClient.post('/petitions', {
        type: 'CREATE_MANAGER',
        title: `Asignar ${manager.firstName} ${manager.lastName} al departamento ${apartment.number}`,
        reason: `Solicito asignar a ${manager.firstName} ${manager.lastName} como responsable del departamento ${apartment.number}.`,
        apartmentId: apartment.id,
        requestedData: {
          managerId: manager.id,
          managerName: `${manager.firstName} ${manager.lastName}`,
          managerEmail: manager.email,
        },
      });
      fetchManagers();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al enviar la petición de asignación');
    }
  };

  return {
    managers,
    myApartments,
    pendingPetitions,
    loading,
    error,
    setError,
    success,
    setSuccess,
    fetchManagers,
    generateResetLink,
    createManagerPetition,
    updateManagerPetition,
    deleteManagerPetition,
    assignManagerPetition,
  };
};
