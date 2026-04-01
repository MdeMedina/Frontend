import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { staysApi, getGuestFullName } from '../../../api/stays';
import type { Stay, Guest } from '../../../api/stays';
import { useAuth } from '../../../contexts/AuthContext';
import { buildingsApi } from '../../../api/buildings';
import type { Building } from '../../../api/buildings';
import { apartmentsApi } from '../../../api/apartments';
import type { Apartment } from '../../../api/apartments';
import { petitionsApi } from '../../../api/petitions';
import type { Petition, CreatePetitionDto } from '../../../api/petitions';
import { cleanRut } from '../../../utils/rut';

export type TabType = 'control' | 'petitions' | 'directory';

export const useControlPiso = () => {
  const location = useLocation();
  const { user, currentBuilding } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('control');

  // Core Data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(currentBuilding?.id || '');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [staysList, setStaysList] = useState<Stay[]>([]);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPetitions, setLoadingPetitions] = useState(false);
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMovementType, setSelectedMovementType] = useState<'checkin' | 'checkout'>('checkin');
  const [showCreatePetitionModal, setShowCreatePetitionModal] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [showPetitionDetailModal, setShowPetitionDetailModal] = useState(false);

  // Petition Form State
  const [newPetitionData, setNewPetitionData] = useState<CreatePetitionDto>({
    type: 'OTHER',
    title: '',
    reason: '',
    stayId: '',
  });
  const [selectedPetitionOption, setSelectedPetitionOption] = useState<string>('');
  const [petitionApartmentSearchTerm, setPetitionApartmentSearchTerm] = useState('');
  const [petitionFormData, setPetitionFormData] = useState<any>({});

  // Directory State
  const [expandedApartments, setExpandedApartments] = useState<Set<string>>(new Set());
  const [directorySearchTerm, setDirectorySearchTerm] = useState('');

  // UTILS
  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // FETCHERS
  const loadBuildings = async () => {
    try {
      const response = await buildingsApi.getAll(true);
      setBuildings(response.data);
      if (currentBuilding?.id) {
        setSelectedBuildingId(currentBuilding.id);
      } else if (response.data.length > 0 && !selectedBuildingId) {
        setSelectedBuildingId(response.data[0].id);
      }
    } catch (err: any) {
      setError('Error al cargar las torres');
    }
  };

  const loadApartments = async () => {
    try {
      const response = await apartmentsApi.getAll({ limit: 500 });
      setApartments(response.data);
    } catch (err: any) {
      setError('Error al cargar los departamentos');
    }
  };

  const loadStays = async () => {
    if (!selectedBuildingId) return;
    try {
      setIsLoading(true);
      const response = await staysApi.getAll({ limit: 500 });
      const today = new Date(currentDate);
      today.setHours(0, 0, 0, 0);

      const filtered = response.data.filter((stay: Stay) => {
        const buildingId = stay.apartmentId ? (stay.apartment as any)?.buildingId : (stay.apartment.building as any)?.id;
        if (buildingId !== selectedBuildingId) return false;

        const checkInDate = new Date(stay.scheduledCheckIn);
        checkInDate.setHours(0, 0, 0, 0);
        const checkOutDate = new Date(stay.scheduledCheckOut);
        checkOutDate.setHours(0, 0, 0, 0);

        return today.getTime() >= checkInDate.getTime() && today.getTime() <= checkOutDate.getTime();
      });

      filtered.sort((a: Stay, b: Stay) => new Date(a.scheduledCheckIn).getTime() - new Date(b.scheduledCheckIn).getTime());
      setStaysList(filtered);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los movimientos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPetitions = async () => {
    try {
      setLoadingPetitions(true);
      const response = await petitionsApi.getAll({ limit: 100 });
      const myPetitions = response.data.filter((p: Petition) => p.userId === user?.id || p.user?.id === user?.id);
      setPetitions(myPetitions);
    } catch (err: any) {
      setError('Error al cargar las peticiones');
    } finally {
      setLoadingPetitions(false);
    }
  };

  // ACTIONS
  const handleCheckIn = async (stayId: string) => {
    try {
      await staysApi.checkIn(stayId);
      setShowDetailModal(false);
      setSelectedStay(null);
      await loadStays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al realizar el check-in');
    }
  };

  const handleCheckOut = async (stayId: string) => {
    try {
      await staysApi.checkOut(stayId);
      setShowDetailModal(false);
      setSelectedStay(null);
      await loadStays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al realizar el check-out');
    }
  };

  const toggleApartmentExpand = (apartmentId: string) => {
    const newExpanded = new Set(expandedApartments);
    if (newExpanded.has(apartmentId)) newExpanded.delete(apartmentId);
    else newExpanded.add(apartmentId);
    setExpandedApartments(newExpanded);
  };

  const handleRowClick = async (stay: Stay) => {
    setSelectedStay(stay);
    setShowDetailModal(true);
    setSelectedMovementType(stay.status === 'SCHEDULED' ? 'checkin' : 'checkout');
    try {
      const freshStay = await staysApi.getById(stay.id);
      setSelectedStay(freshStay);
    } catch (err) {
      console.error('Error al refrescar stay:', err);
    }
  };

  // EFFECTS
  useEffect(() => {
    loadBuildings();
    loadApartments();
  }, []);

  useEffect(() => {
    if (currentBuilding?.id) {
      setSelectedBuildingId(currentBuilding.id);
    }
  }, [currentBuilding?.id]);

  useEffect(() => {
    if (selectedBuildingId) loadStays();
  }, [selectedBuildingId, currentDate]);

  useEffect(() => {
    if (activeTab === 'petitions') loadPetitions();
  }, [activeTab]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('tab') === 'petitions') setActiveTab('petitions');
  }, [location]);

  // COMPUTED
  const filteredStays = useMemo(() => {
    if (!searchFilter.trim()) return staysList;
    const searchLower = searchFilter.toLowerCase();
    return staysList.filter((stay) => {
      const guestName = getGuestFullName(stay).toLowerCase();
      const hasGuestMatch = stay.guests?.some((g: Guest) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchLower) || g.document?.toLowerCase().includes(searchLower));
      return stay.apartment.number.toLowerCase().includes(searchLower) || 
             guestName.includes(searchLower) || 
             stay.guestDocument?.toLowerCase().includes(searchLower) ||
             hasGuestMatch;
    });
  }, [staysList, searchFilter]);

  const filteredDirectory = useMemo(() => {
    let filtered = apartments.filter(apt => apt.buildingId === selectedBuildingId || (apt.building as any)?.id === selectedBuildingId);
    if (directorySearchTerm) {
      const term = directorySearchTerm.toLowerCase();
      filtered = filtered.filter(apt => {
        const ownerName = `${apt.owner?.firstName || ''} ${apt.owner?.lastName || ''}`.toLowerCase();
        const managerName = `${apt.manager?.firstName || ''} ${apt.manager?.lastName || ''}`.toLowerCase();
        return apt.number.toLowerCase().includes(term) || ownerName.includes(term) || managerName.includes(term) || (apt.owner?.email || '').toLowerCase().includes(term);
      });
    }
    return filtered.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  }, [apartments, selectedBuildingId, directorySearchTerm]);

  return {
    user,
    activeTab,
    setActiveTab,
    buildings,
    selectedBuildingId,
    setSelectedBuildingId,
    apartments,
    staysList,
    filteredStays,
    petitions,
    filteredDirectory,
    isLoading,
    loadingPetitions,
    error,
    setError,
    searchFilter,
    setSearchFilter,
    currentDate,
    selectedStay,
    setSelectedStay,
    showDetailModal,
    setShowDetailModal,
    selectedMovementType,
    setSelectedMovementType,
    showCreatePetitionModal,
    setShowCreatePetitionModal,
    selectedPetition,
    setSelectedPetition,
    showPetitionDetailModal,
    setShowPetitionDetailModal,
    newPetitionData,
    setNewPetitionData,
    selectedPetitionOption,
    setSelectedPetitionOption,
    petitionApartmentSearchTerm,
    setPetitionApartmentSearchTerm,
    petitionFormData,
    setPetitionFormData,
    expandedApartments,
    toggleApartmentExpand,
    directorySearchTerm,
    setDirectorySearchTerm,
    formatDateOnly,
    formatTime,
    handleCheckIn,
    handleCheckOut,
    handleRowClick,
    loadPetitions,
    loadStays,
  };
};
