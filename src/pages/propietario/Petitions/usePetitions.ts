import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import apiClient, { getApiUrl } from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';

export type PetitionType =
  | 'MODIFY_STAY'
  | 'CREATE_APARTMENT'
  | 'MODIFY_APARTMENT'
  | 'DELETE_APARTMENT'
  | 'CREATE_MANAGER'
  | 'MODIFY_MANAGER'
  | 'DELETE_MANAGER'
  | 'MODIFY_GUEST_DATA'
  | 'ASSIGN_PARKING'
  | 'CANCEL_MOVEMENT'
  | 'OTHER';

export type PetitionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Petition {
  id: string;
  type: PetitionType;
  title: string;
  reason: string;
  status: PetitionStatus;
  apartmentId?: string;
  apartment?: {
    id: string;
    number: string;
    building: string | { id: string; name: string };
    manager?: any;
    floor?: string;
    owner?: { id: string; firstName: string; lastName: string };
  };
  stayId?: string;
  stay?: {
    id: string;
    category: 'GUEST' | 'STAFF';
    status: 'SCHEDULED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
    scheduledCheckIn: string;
    scheduledCheckOut: string;
    actualCheckIn?: string;
    actualCheckOut?: string;
    guestFirstName?: string;
    guestLastName?: string;
    guestDocument?: string;
    guests?: Array<{
      firstName: string;
      lastName: string;
      document: string;
    }>;
    apartment?: {
      id: string;
      number: string;
      floor: number;
      owner?: { id: string; firstName: string; lastName: string };
      building: string | { id: string; name: string };
    };
  };
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  requestedData?: any;
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export const usePetitions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sentPetitions, setSentPetitions] = useState<Petition[]>([]);
  const [receivedPetitions, setReceivedPetitions] = useState<Petition[]>([]);
  const [myApartments, setMyApartments] = useState<any[]>([]);
  const [allApartments, setAllApartments] = useState<any[]>([]);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  const socketRef = useRef<Socket | null>(null);

  const fetchPetitions = async () => {
    try {
      setLoading(true);
      const [petitionsRes, apartmentsRes] = await Promise.all([
        apiClient.get('/petitions', { params: { limit: 100 } }),
        apiClient.get('/apartments'),
      ]);

      const allPetitions = petitionsRes.data.data || [];
      const apartmentsList = apartmentsRes.data.data || apartmentsRes.data;
      setAllApartments(apartmentsList);

      const mine = apartmentsList.filter((apt: any) => 
        apt.owner?.id === user?.id || apt.manager?.id === user?.id
      );
      setMyApartments(mine);
      const myApartmentIds = mine.map((a: any) => a.id);

      // Sent
      const sent = allPetitions.filter(
        (p: Petition) => p.userId === user?.id || p.user?.id === user?.id
      );
      setSentPetitions(sent);

      // Received
      const received = allPetitions.filter(
        (p: Petition) => {
          if (p.userId === user?.id || p.user?.id === user?.id) return false;
          if (p.type === 'CANCEL_MOVEMENT') return false;
          if (p.apartmentId && myApartmentIds.includes(p.apartmentId)) return true;
          if (p.stay?.apartment && mine.some((apt: any) => apt.number === (p.stay as any).apartment.number)) return true;
          if (p.requestedData?.apartmentId && myApartmentIds.includes(p.requestedData.apartmentId)) return true;
          if (p.type === 'MODIFY_GUEST_DATA' && p.stayId) return true;
          return false;
        }
      );
      setReceivedPetitions(received);

    } catch (err: any) {
      console.error('Error fetching petitions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetitions();
  }, [user?.id]);

  // WebSocket Logic
  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem('token');
    if (token) {
      const apiUrl = getApiUrl();
      const socket = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
      });
      socketRef.current = socket;

      socket.on('petition_updated', (data: { petition: any }) => {
        setSentPetitions(prev => prev.map(p => p.id === data.petition.id ? data.petition : p));
        setReceivedPetitions(prev => prev.map(p => p.id === data.petition.id ? data.petition : p));
        setSelectedPetition(prev => prev?.id === data.petition.id ? data.petition : prev);
      });

      socket.on('petition_created', (data: { petition: any }) => {
        if (data.petition.userId !== user.id && data.petition.user?.id !== user.id) {
          fetchPetitions();
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user?.id]);

  const createPetition = async (formData: any) => {
    try {
      await apiClient.post('/petitions', formData);
      await fetchPetitions();
      return { success: true };
    } catch (err: any) {
      console.error('Error creating petition:', err);
      return { success: false, error: err };
    }
  };

  const reviewPetition = async (petitionId: string, action: 'APPROVED' | 'REJECTED', adminNotes: string) => {
    try {
      await apiClient.patch(`/petitions/${petitionId}/review`, {
        status: action,
        adminNotes
      });
      await fetchPetitions();
      return { success: true };
    } catch (err: any) {
      console.error('Error reviewing petition:', err);
      return { success: false, error: err };
    }
  };

  return {
    loading,
    sentPetitions,
    receivedPetitions,
    myApartments,
    allApartments,
    selectedPetition,
    setSelectedPetition,
    activeTab,
    setActiveTab,
    filterStatus,
    setFilterStatus,
    createPetition,
    reviewPetition,
    fetchPetitions,
  };
};
