import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { staysApi, getGuestFullName } from '../../api/stays';
import type { Stay, Guest } from '../../api/stays';
import { buildingsApi } from '../../api/buildings';
import type { Building } from '../../api/buildings';
import { apartmentsApi } from '../../api/apartments';
import type { Apartment } from '../../api/apartments';
import { Layout } from '../../components/Layout';
import { formatRut, handleRutInput, cleanRut } from '../../utils/rut';
import { petitionsApi } from '../../api/petitions';
import type { Petition, CreatePetitionDto } from '../../api/petitions';
import { Modal } from '../../components/Modal';


type TabType = 'control' | 'petitions';

export const ControlPiso = () => {

  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('control');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [selectedMovementType, setSelectedMovementType] = useState<'checkin' | 'checkout'>('checkin');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [apartments, setApartments] = useState<Apartment[]>([]);

  const [staysList, setStaysList] = useState<Stay[]>([]);

  // Estados para peticiones
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loadingPetitions, setLoadingPetitions] = useState(false);
  const [showCreatePetitionModal, setShowCreatePetitionModal] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [showPetitionDetailModal, setShowPetitionDetailModal] = useState(false);
  const [newPetitionData, setNewPetitionData] = useState<CreatePetitionDto>({
    type: 'OTHER',
    title: '',
    reason: '',
    stayId: '',
  });
  const [selectedPetitionOption, setSelectedPetitionOption] = useState<string>('');
  const [petitionApartmentSearchTerm, setPetitionApartmentSearchTerm] = useState('');

  // Campos adicionales según el tipo de petición
  const [petitionFormData, setPetitionFormData] = useState<{
    // Para huésped/personal sin registro
    guestFirstName?: string;
    guestLastName?: string;
    guestDocument?: string;
    apartmentId?: string;
    // Para huéspedes adicionales
    additionalGuests?: Array<{ firstName: string; lastName: string; document: string }>;
    // Para datos que no coinciden
    correctFirstName?: string;
    correctLastName?: string;
    correctDocument?: string;
  }>({});

  // Opciones predefinidas de peticiones para conserje
  const petitionOptions = [
    {
      id: 'guest_no_registry',
      title: 'Huésped en recepción sin registro previo',
      description: 'Requiere carga de datos para habilitar el ingreso.',
    },
    {
      id: 'early_checkin',
      title: 'Ingreso anticipado fuera del horario de check-in',
      description: 'Se requiere modificación.',
    },
    {
      id: 'staff_access',
      title: 'Personal de Aseo y/o técnico solicita ingreso al dpto',
      description: 'Requiere carga de datos para habilitar el ingreso.',
    },
    {
      id: 'guest_data_mismatch',
      title: 'Los datos del huésped no coinciden con el registro',
      description: '',
    },
    {
      id: 'additional_guests',
      title: 'Ingreso de huéspedes adicionales no registrados',
      description: 'Favor completar.',
    },
    {
      id: 'noise_complaint',
      title: 'Hay reclamo por ruidos molestos desde el dpto',
      description: '',
    },
    {
      id: 'CANCEL_MOVEMENT',
      title: 'Cancelar Check-in/Check-out mal realizado',
      description: 'Solicitar al administrador la cancelación de un movimiento erróneo.',
    },
    {
      id: 'OTHER',
      title: 'Otro',
      description: '',
    },
  ];

  // Actualizar la fecha actual cada minuto y cambiar a día siguiente a las 12am
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDate(now);
    };

    updateDate();
    const interval = setInterval(updateDate, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  // Cargar torres
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const response = await buildingsApi.getAll(true);
        setBuildings(response.data);
        if (response.data.length > 0 && !selectedBuildingId) {
          setSelectedBuildingId(response.data[0].id);
        }
      } catch (err: any) {
        setError('Error al cargar las torres');
      }
    };
    loadBuildings();
  }, []);

  // Cargar departamentos para las peticiones
  useEffect(() => {
    const loadApartments = async () => {
      try {
        console.log('🏢 Cargando departamentos para conserje...');
        const response = await apartmentsApi.getAll({ limit: 500 });
        console.log('✅ Departamentos cargados:', response.data.length, response.data);
        setApartments(response.data);
      } catch (err: any) {
        console.error('❌ Error al cargar departamentos:', err);
        setError('Error al cargar los departamentos: ' + (err.response?.data?.message || err.message));
      }
    };
    loadApartments();
  }, []);

  // Cargar stays cuando cambia la torre seleccionada
  useEffect(() => {
    if (selectedBuildingId) {
      loadStays();
    }
  }, [selectedBuildingId, currentDate]);

  // Cargar peticiones cuando se cambia a la pestaña de peticiones
  useEffect(() => {
    if (activeTab === 'petitions') {
      loadPetitions();
    }
  }, [activeTab]);

  // Si viene de una notificación, activar el tab de peticiones
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('tab') === 'petitions') {
      setActiveTab('petitions');
    }
  }, [location]);

  const loadStays = async () => {
    if (!selectedBuildingId) return;

    try {
      setIsLoading(true);
      const response = await staysApi.getAll({ limit: 500 });

      // Obtener fecha del día actual (solo fecha, sin hora)
      const today = new Date(currentDate);
      today.setHours(0, 0, 0, 0);

      console.log('📅 Fecha actual para filtrado:', today.toISOString());
      console.log('📅 Fecha formateada:', formatDateOnly(today.toISOString()));
      console.log('📊 Total de stays recibidos:', response.data.length);

      // Debug: mostrar algunos stays recibidos
      if (response.data.length > 0) {
        console.log('📋 Primeros 3 stays recibidos:', response.data.slice(0, 3).map(s => ({
          depto: s.apartment.number,
          checkIn: s.scheduledCheckIn,
          checkOut: s.scheduledCheckOut,
          building: typeof s.apartment.building === 'object' ? s.apartment.building?.name : s.apartment.building,
        })));
      }

      // Filtrar por torre y fecha del día
      const filteredStays = response.data.filter((stay) => {
        // Filtrar por torre
        const buildingId = typeof stay.apartment.building === 'object' && stay.apartment.building?.id
          ? stay.apartment.building.id
          : null;

        // Comparar por ID del building
        if (buildingId && buildingId !== selectedBuildingId) {
          return false;
        }

        // Si no tenemos ID (caso legacy), comparar por nombre
        if (!buildingId) {
          const buildingName = typeof stay.apartment.building === 'string'
            ? stay.apartment.building
            : stay.apartment.building?.name || '';
          const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
          if (selectedBuilding && buildingName !== selectedBuilding.name) {
            return false;
          }
        }

        // Filtrar check-ins del día (incluye los que ya se hicieron)
        const checkInDate = new Date(stay.scheduledCheckIn);
        checkInDate.setHours(0, 0, 0, 0);

        // Filtrar check-outs del día (incluye los que ya se hicieron)
        const checkOutDate = new Date(stay.scheduledCheckOut);
        checkOutDate.setHours(0, 0, 0, 0);

        // Verificar si la fecha actual está dentro del rango de la reserva
        const isCurrentDateInRange = today.getTime() >= checkInDate.getTime() && today.getTime() <= checkOutDate.getTime();

        if (isCurrentDateInRange) {
          console.log('✅ Stay en rango:', {
            depto: stay.apartment.number,
            checkIn: stay.scheduledCheckIn,
            checkOut: stay.scheduledCheckOut,
            isCurrentDateInRange,
          });
        }

        return isCurrentDateInRange;
      });

      console.log('📋 Stays filtrados:', filteredStays.length);


      // Ordenar por hora de check-in
      filteredStays.sort((a, b) => {
        return new Date(a.scheduledCheckIn).getTime() - new Date(b.scheduledCheckIn).getTime();
      });

      setStaysList(filteredStays);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los movimientos');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar movimientos por búsqueda
  const filteredStays = useMemo(() => {
    if (!searchFilter.trim()) return staysList;

    const searchLower = searchFilter.toLowerCase();
    return staysList.filter((stay) => {

      // Buscar por número de departamento
      if (stay.apartment.number.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Buscar por nombre de huésped
      const guestName = getGuestFullName(stay).toLowerCase();
      if (guestName.includes(searchLower)) {
        return true;
      }

      // Buscar por RUT
      if (stay.guestDocument && stay.guestDocument.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Buscar en huéspedes adicionales
      if (stay.guests && Array.isArray(stay.guests)) {
        const foundInGuests = stay.guests.some((guest: Guest) => {
          const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
          return fullName.includes(searchLower) ||
            (guest.document && guest.document.toLowerCase().includes(searchLower));
        });
        if (foundInGuests) return true;
      }

      return false;
    });
  }, [staysList, searchFilter]);





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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };



  const handleRowClick = (stay: Stay) => {
    setSelectedStay(stay);
    // Determinar qué modal abrir o qué acción mostrar por defecto
    // Si no ha hecho check-in, sugerir check-in. Si ya hizo, sugerir check-out.
    if (stay.status === 'SCHEDULED') {
      setSelectedMovementType('checkin');
    } else {
      setSelectedMovementType('checkout');
    }
    setShowDetailModal(true);
  };

  const loadPetitions = async () => {
    try {
      setLoadingPetitions(true);
      const response = await petitionsApi.getAll({ limit: 100 });
      setPetitions(response.data);
    } catch (err: any) {
      setError('Error al cargar las peticiones');
    } finally {
      setLoadingPetitions(false);
    }
  };

  const handleCreatePetition = (type?: string) => {
    if (selectedStay) {
      setShowDetailModal(false);

      if (type) {
        setNewPetitionData({
          type: type as any,
          title: type === 'CANCEL_MOVEMENT' ? 'Cancelar Check-in/Check-out mal realizado' : '',
          reason: '',
          stayId: selectedStay.id,
        });
        setSelectedPetitionOption(type);
      } else {
        setNewPetitionData({
          type: 'OTHER',
          title: 'Petición desde conserjería',
          reason: '',
          stayId: selectedStay.id,
        });
        setSelectedPetitionOption('');
      }

      // Pre-llenar datos del departamento si existe
      if (selectedStay.apartment) {
        setPetitionFormData({
          apartmentId: selectedStay.apartment.id
        });
      }

      setPetitionApartmentSearchTerm('');
      setShowCreatePetitionModal(true);
    }
  };

  const handlePetitionOptionChange = (optionId: string) => {
    setSelectedPetitionOption(optionId);
    const option = petitionOptions.find(opt => opt.id === optionId);
    if (option) {
      setNewPetitionData(prev => ({
        ...prev, // Preservar stayId y otros campos
        title: option.id === 'OTHER' ? 'Petición desde conserjería' : option.title,
        reason: option.description || '',
      }));
      // Limpiar campos del formulario cuando cambia el tipo, pero preservar el departamento si hay reserva seleccionada
      setPetitionFormData(
        selectedStay && newPetitionData.stayId === selectedStay.id
          ? { apartmentId: selectedStay.apartment.id }
          : {}
      );
    }
  };

  // Determinar qué campos mostrar según el tipo de petición
  const getRequiredFields = (optionId: string) => {
    switch (optionId) {
      case 'guest_no_registry':
      case 'staff_access':
        return {
          needsGuestData: true,
          needsApartment: true,
          needsAdditionalGuests: false,
          needsCorrectData: false,
        };
      case 'guest_data_mismatch':
        return {
          needsGuestData: true,
          needsApartment: true,
          needsAdditionalGuests: false,
          needsCorrectData: true,
        };
      case 'additional_guests':
        return {
          needsGuestData: false,
          needsApartment: true,
          needsAdditionalGuests: true,
          needsCorrectData: false,
        };
      case 'noise_complaint':
        return {
          needsGuestData: false,
          needsApartment: true,
          needsAdditionalGuests: false,
          needsCorrectData: false,
        };
      case 'early_checkin':
        // Para early_checkin, solo necesita departamento si no hay stayId
        return {
          needsGuestData: false,
          needsApartment: !newPetitionData.stayId || newPetitionData.stayId.trim() === '',
          needsAdditionalGuests: false,
          needsCorrectData: false,
        };
      default:
        return {
          needsGuestData: false,
          needsApartment: false,
          needsAdditionalGuests: false,
          needsCorrectData: false,
        };
    }
  };

  const addAdditionalGuest = () => {
    setPetitionFormData(prev => ({
      ...prev,
      additionalGuests: [...(prev.additionalGuests || []), { firstName: '', lastName: '', document: '' }],
    }));
  };

  const removeAdditionalGuest = (index: number) => {
    setPetitionFormData(prev => ({
      ...prev,
      additionalGuests: prev.additionalGuests?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateAdditionalGuest = (index: number, field: 'firstName' | 'lastName' | 'document', value: string) => {
    setPetitionFormData(prev => ({
      ...prev,
      additionalGuests: prev.additionalGuests?.map((guest, i) =>
        i === index ? { ...guest, [field]: value } : guest
      ) || [],
    }));
  };

  const handleSubmitPetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetitionOption) {
      setError('Por favor selecciona un tipo de petición');
      return;
    }
    if (!newPetitionData.title) {
      setError('Por favor completa el título de la petición');
      return;
    }

    // Validar campos según el tipo de petición
    const requiredFields = getRequiredFields(selectedPetitionOption);

    if (requiredFields.needsGuestData) {
      if (!petitionFormData.guestFirstName || !petitionFormData.guestLastName) {
        setError('Por favor completa el nombre y apellido');
        return;
      }
    }

    if (requiredFields.needsApartment && !requiredFields.needsGuestData && selectedPetitionOption !== 'early_checkin') {
      if (!petitionFormData.apartmentId && !newPetitionData.stayId) {
        setError('Por favor selecciona un departamento');
        return;
      }
    }

    // Para early_checkin, si no hay stayId, necesita departamento
    if (selectedPetitionOption === 'early_checkin' && !newPetitionData.stayId && !petitionFormData.apartmentId) {
      setError('Por favor selecciona un departamento o crea la petición desde una reserva');
      return;
    }

    if (requiredFields.needsCorrectData) {
      if (!petitionFormData.correctFirstName || !petitionFormData.correctLastName) {
        setError('Por favor completa los datos correctos del huésped');
        return;
      }
    }

    try {
      // Preparar datos adicionales para requestedData
      const requestedData: any = {};

      if (requiredFields.needsGuestData) {
        requestedData.guestFirstName = petitionFormData.guestFirstName;
        requestedData.guestLastName = petitionFormData.guestLastName;
        if (petitionFormData.guestDocument) {
          requestedData.guestDocument = cleanRut(petitionFormData.guestDocument);
        }
      }

      if (requiredFields.needsApartment && petitionFormData.apartmentId) {
        requestedData.apartmentId = petitionFormData.apartmentId;
      }

      if (requiredFields.needsCorrectData) {
        requestedData.correctFirstName = petitionFormData.correctFirstName;
        requestedData.correctLastName = petitionFormData.correctLastName;
        if (petitionFormData.correctDocument) {
          requestedData.correctDocument = cleanRut(petitionFormData.correctDocument);
        }
      }

      if (requiredFields.needsAdditionalGuests && petitionFormData.additionalGuests) {
        requestedData.additionalGuests = petitionFormData.additionalGuests.map(guest => ({
          firstName: guest.firstName,
          lastName: guest.lastName,
          document: cleanRut(guest.document || ''),
        }));
      }

      // Limpiar stayId si está vacío o no es válido
      const petitionData: CreatePetitionDto = {
        ...newPetitionData,
        stayId: newPetitionData.stayId && newPetitionData.stayId.trim() !== ''
          ? newPetitionData.stayId
          : undefined,
        apartmentId: petitionFormData.apartmentId || undefined,
        requestedData: Object.keys(requestedData).length > 0 ? requestedData : undefined,
      };

      console.log('📤 Creando petición con datos:', petitionData);
      const response = await petitionsApi.create(petitionData);
      console.log('✅ Petición creada:', response);
      setShowCreatePetitionModal(false);
      setNewPetitionData({
        type: 'OTHER',
        title: 'Petición desde conserjería',
        reason: '',
        stayId: '',
      });
      setPetitionFormData({});
      setSelectedPetitionOption('');
      setPetitionApartmentSearchTerm('');
      await loadPetitions();
      setActiveTab('petitions');
    } catch (err: any) {
      console.error('❌ Error al crear petición:', err);
      setError(err.response?.data?.message || 'Error al crear la petición');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Pestañas */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('control')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'control'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Control de Piso
              </button>
              <button
                onClick={() => setActiveTab('petitions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'petitions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Peticiones
              </button>
            </nav>
          </div>

          {/* Contenido de Control de Piso */}
          {activeTab === 'control' && (
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Control de Piso</h1>
                <p className="text-gray-600">
                  Movimientos del día: {formatDateOnly(currentDate.toISOString())}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Selector de torre y filtro */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Torre
                    </label>
                    <select
                      value={selectedBuildingId}
                      onChange={(e) => setSelectedBuildingId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar torre...</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar (Depto, Nombre, RUT)
                    </label>
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Buscar por número, nombre o RUT..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla */}
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : !selectedBuildingId ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-500">Selecciona una torre para ver los movimientos</p>
                </div>
              ) : filteredStays.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-500">No hay movimientos para esta torre en el día de hoy</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Depto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check-In
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check-Out
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStays.map((stay, index) => {
                          const checkInDate = new Date(stay.scheduledCheckIn);
                          const checkOutDate = new Date(stay.scheduledCheckOut);

                          // Lógica de estados avanzados
                          const isLateCheckIn = stay.actualCheckIn && new Date(stay.actualCheckIn).getDate() > checkInDate.getDate();
                          const isEarlyCheckOut = stay.actualCheckOut && new Date(stay.actualCheckOut).getDate() < checkOutDate.getDate();
                          const isLateCheckOut = stay.actualCheckOut && new Date(stay.actualCheckOut).getDate() > checkOutDate.getDate();

                          return (
                            <tr
                              key={`${stay.id}-${index}`}
                              onClick={() => handleRowClick(stay)}
                              className="hover:bg-blue-50 cursor-pointer transition"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {stay.apartment.number}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDateOnly(stay.scheduledCheckIn)}
                                  <div className="text-xs text-gray-500">{formatTime(stay.scheduledCheckIn)}</div>
                                  {isLateCheckIn && (
                                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                      Tardío
                                    </span>
                                  )}
                                  {stay.actualCheckIn && (
                                    <div className="text-xs text-green-600 mt-1">
                                      Real: {formatTime(stay.actualCheckIn)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDateOnly(stay.scheduledCheckOut)}
                                  <div className="text-xs text-gray-500">{formatTime(stay.scheduledCheckOut)}</div>
                                  {isEarlyCheckOut && (
                                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Anticipado
                                    </span>
                                  )}
                                  {isLateCheckOut && (
                                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                      Tardío
                                    </span>
                                  )}
                                  {stay.actualCheckOut && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      Real: {formatTime(stay.actualCheckOut)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {stay.status === 'CHECKED_IN' ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-green-600 text-white font-semibold">
                                    En Curso
                                  </span>
                                ) : stay.status === 'CHECKED_OUT' ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-500 text-white font-semibold">
                                    Finalizado
                                  </span>
                                ) : stay.status === 'CANCELLED' ? (
                                  <span className="px-2 py-1 text-xs rounded-full bg-red-600 text-white font-semibold">
                                    Cancelado
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                    Programado
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido de Peticiones */}
          {activeTab === 'petitions' && (
            <div>
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Peticiones</h1>
                  <p className="text-gray-600">
                    Gestiona peticiones relacionadas con las reservas
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewPetitionData({
                      type: 'OTHER',
                      title: 'Petición desde conserjería',
                      reason: '',
                      stayId: '',
                    });
                    setSelectedPetitionOption('');
                    setPetitionApartmentSearchTerm('');
                    setShowCreatePetitionModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Nueva Petición
                </button>
              </div>

              {loadingPetitions ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : petitions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-500">No hay peticiones</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Título
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {petitions.map((petition) => (
                          <tr
                            key={petition.id}
                            onClick={() => {
                              setSelectedPetition(petition);
                              setShowPetitionDetailModal(true);
                            }}
                            className="hover:bg-blue-50 cursor-pointer transition"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {petition.type === 'MODIFY_STAY' ? 'Modificar Reserva' : petition.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{petition.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${petition.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : petition.status === 'APPROVED'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                }`}>
                                {petition.status === 'PENDING' ? 'Pendiente' :
                                  petition.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDateOnly(petition.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles */}
      <Modal
        isOpen={showDetailModal && !!selectedStay}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedStay(null);
        }}
        title={`Detalles de ${selectedMovementType === 'checkin' ? 'Check-In' : 'Check-Out'}`}
        width="max-w-2xl"
      >

        {selectedStay && (
          <>
            <div className="space-y-4">
              {/* Número de departamento */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Departamento</h3>
                <p className="text-gray-900">
                  {(typeof selectedStay.apartment.building === 'object' && selectedStay.apartment.building?.name)
                    ? selectedStay.apartment.building.name
                    : typeof selectedStay.apartment.building === 'string'
                      ? selectedStay.apartment.building
                      : 'Sin torre'} - Depto {selectedStay.apartment.number} (Piso {selectedStay.apartment.floor})
                </p>
              </div>

              {/* Responsable de Reserva */}
              {(selectedStay.user || selectedStay.apartment.owner) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Responsable de Reserva</h3>
                  <p className="text-gray-900">
                    {selectedStay.user
                      ? `${selectedStay.user.firstName} ${selectedStay.user.lastName}`
                      : `${selectedStay.apartment.owner?.firstName} ${selectedStay.apartment.owner?.lastName}`
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedStay.user ? selectedStay.user.email : selectedStay.apartment.owner?.email}
                  </p>
                </div>
              )}

              {/* Fecha y horario */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {selectedMovementType === 'checkin' ? 'Check-In Programado' : 'Check-Out Programado'}
                </h3>
                <p className="text-gray-900 font-medium">
                  {formatDateTime(selectedMovementType === 'checkin' ? selectedStay.scheduledCheckIn : selectedStay.scheduledCheckOut)}
                </p>
                {selectedMovementType === 'checkin' && selectedStay.actualCheckIn && (
                  <p className="text-sm text-green-600 mt-1">
                    Realizado: {formatDateTime(selectedStay.actualCheckIn)}
                  </p>
                )}
                {selectedMovementType === 'checkout' && selectedStay.actualCheckOut && (
                  <p className="text-sm text-green-600 mt-1">
                    Realizado: {formatDateTime(selectedStay.actualCheckOut)}
                  </p>
                )}
              </div>

              {/* Datos de huéspedes/personal */}
              {(selectedStay.guestFirstName || selectedStay.guestLastName) && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {selectedStay.category === 'GUEST' ? 'Huésped Principal' : 'Personal Principal'}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-600">Nombre:</span>{' '}
                      <span className="font-medium">{selectedStay.guestFirstName} {selectedStay.guestLastName}</span>
                    </p>
                    {selectedStay.guestDocument && (
                      <p>
                        <span className="text-gray-600">RUT:</span>{' '}
                        <span className="font-medium font-mono">{formatRut(selectedStay.guestDocument)}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Huéspedes adicionales */}
              {selectedStay.guests && Array.isArray(selectedStay.guests) && selectedStay.guests.length > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {selectedStay.category === 'GUEST' ? 'Huéspedes Adicionales' : 'Personal Adicional'} ({selectedStay.guests.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedStay.guests.map((guest: Guest, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded border border-purple-200 text-sm">
                        <p className="font-medium">{guest.firstName} {guest.lastName}</p>
                        {guest.document && (
                          <p className="text-gray-600 text-xs mt-1">
                            RUT: <span className="font-mono">{formatRut(guest.document)}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedStay.notes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Notas</h3>
                  <p className="text-sm text-gray-700">{selectedStay.notes}</p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleCreatePetition()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Hacer una petición sobre esta reserva
              </button>
              <button
                onClick={() => handleCreatePetition('CANCEL_MOVEMENT')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                title="Reportar problema con Check-in/Check-out"
              >
                Reportar Problema
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedStay(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              {selectedMovementType === 'checkin' && selectedStay.status === 'SCHEDULED' && (
                <button
                  onClick={() => handleCheckIn(selectedStay.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Check-In
                </button>
              )}
              {selectedMovementType === 'checkin' && (selectedStay.status === 'CHECKED_IN' || selectedStay.status === 'CHECKED_OUT') && (
                <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold">
                  ✓ Check-In Completado
                </span>
              )}
              {selectedMovementType === 'checkout' && selectedStay.status === 'CHECKED_IN' && (
                <button
                  onClick={() => handleCheckOut(selectedStay.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Check-Out
                </button>
              )}
              {selectedMovementType === 'checkout' && selectedStay.status === 'CHECKED_OUT' && (
                <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold">
                  ✓ Check-Out Completado
                </span>
              )}
              {selectedMovementType === 'checkout' && selectedStay.status === 'SCHEDULED' && (
                <div className="px-4 py-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-sm">
                  ⚠ No se puede realizar el check-out sin haber realizado el check-in primero
                </div>
              )}
            </div>
          </>
        )}

      </Modal>

      {/* Modal para crear petición */}
      <Modal
        isOpen={showCreatePetitionModal}
        onClose={() => setShowCreatePetitionModal(false)}
        title="Nueva Petición"
        width="max-w-2xl"
      >

        <form onSubmit={handleSubmitPetition}>
          <div className="space-y-4">
            {/* Selector de tipo de petición */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Petición *
              </label>
              <div className="space-y-2">
                {petitionOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${selectedPetitionOption === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="petitionOption"
                      value={option.id}
                      checked={selectedPetitionOption === option.id}
                      onChange={(e) => handlePetitionOptionChange(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.title}</div>
                      {option.description && (
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Título (visible solo si es "Otro") */}
            {selectedPetitionOption === 'OTHER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={newPetitionData.title}
                  onChange={(e) => setNewPetitionData({ ...newPetitionData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título de la petición"
                />
              </div>
            )}


            {/* Razón/Descripción adicional (visible solo si es "Otro") */}
            {selectedPetitionOption === 'OTHER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción Adicional
                </label>
                <textarea
                  value={newPetitionData.reason}
                  onChange={(e) => setNewPetitionData({ ...newPetitionData, reason: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agrega detalles adicionales sobre la petición..."
                />
              </div>
            )}

            {/* Campos dinámicos según el tipo de petición */}
            {selectedPetitionOption && (() => {
              const fields = getRequiredFields(selectedPetitionOption);

              return (
                <div className="space-y-4 border-t pt-4">
                  {/* Datos del huésped/personal */}
                  {fields.needsGuestData && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        {selectedPetitionOption === 'staff_access' ? 'Datos del Personal' : 'Datos del Huésped'}
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                          </label>
                          <input
                            type="text"
                            required
                            value={petitionFormData.guestFirstName || ''}
                            onChange={(e) => setPetitionFormData({ ...petitionFormData, guestFirstName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellido *
                          </label>
                          <input
                            type="text"
                            required
                            value={petitionFormData.guestLastName || ''}
                            onChange={(e) => setPetitionFormData({ ...petitionFormData, guestLastName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Apellido"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RUT
                        </label>
                        <input
                          type="text"
                          value={petitionFormData.guestDocument || ''}
                          onChange={(e) => {
                            const formatted = handleRutInput(e.target.value);
                            setPetitionFormData({ ...petitionFormData, guestDocument: formatted });
                          }}
                          onBlur={(e) => {
                            const cleaned = cleanRut(e.target.value);
                            if (cleaned) {
                              const formatted = handleRutInput(cleaned);
                              setPetitionFormData({ ...petitionFormData, guestDocument: formatted });
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="12.345.678-9"
                          maxLength={12}
                        />
                      </div>
                    </div>
                  )}

                  {/* Datos correctos (para datos que no coinciden) */}
                  {fields.needsCorrectData && (
                    <div className="bg-green-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Datos Correctos del Huésped</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre Correcto *
                          </label>
                          <input
                            type="text"
                            required
                            value={petitionFormData.correctFirstName || ''}
                            onChange={(e) => setPetitionFormData({ ...petitionFormData, correctFirstName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre correcto"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellido Correcto *
                          </label>
                          <input
                            type="text"
                            required
                            value={petitionFormData.correctLastName || ''}
                            onChange={(e) => setPetitionFormData({ ...petitionFormData, correctLastName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Apellido correcto"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RUT Correcto
                        </label>
                        <input
                          type="text"
                          value={petitionFormData.correctDocument || ''}
                          onChange={(e) => {
                            const formatted = handleRutInput(e.target.value);
                            setPetitionFormData({ ...petitionFormData, correctDocument: formatted });
                          }}
                          onBlur={(e) => {
                            const cleaned = cleanRut(e.target.value);
                            if (cleaned) {
                              const formatted = handleRutInput(cleaned);
                              setPetitionFormData({ ...petitionFormData, correctDocument: formatted });
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="12.345.678-9"
                          maxLength={12}
                        />
                      </div>
                    </div>
                  )}

                  {/* Selección de departamento */}
                  {fields.needsApartment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento *
                      </label>
                      {/* Search input and apartment list */}
                      <div className="relative mb-2">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                        <input
                          type="text"
                          placeholder="Buscar por número o torre..."
                          value={petitionApartmentSearchTerm}
                          onChange={(e) => setPetitionApartmentSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                        {apartments
                          .filter(apt => {
                            if (!petitionApartmentSearchTerm) return true;
                            const term = petitionApartmentSearchTerm.toLowerCase();
                            const bName = typeof apt.building === 'object' ? apt.building?.name : apt.building;
                            return (
                              apt.number.toLowerCase().includes(term) ||
                              (bName && bName.toLowerCase().includes(term))
                            );
                          })
                          .map((apt) => {
                            const buildingName = typeof apt.building === 'object'
                              ? apt.building?.name
                              : apt.building || 'Sin torre';
                            return (
                              <button
                                key={apt.id}
                                type="button"
                                onClick={() => setPetitionFormData({ ...petitionFormData, apartmentId: apt.id })}
                                className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-blue-50 transition ${petitionFormData.apartmentId === apt.id ? 'bg-blue-100 border-l-4 border-l-blue-600 pl-3 font-semibold' : ''}`}
                              >
                                <div className="font-medium text-gray-900">Depto {apt.number}</div>
                                <div className="text-xs text-gray-500">{buildingName} - Piso {apt.floor}</div>
                              </button>
                            );
                          })}
                        {apartments.filter(apt => {
                          if (!petitionApartmentSearchTerm) return true;
                          const term = petitionApartmentSearchTerm.toLowerCase();
                          const bName = typeof apt.building === 'object' ? apt.building?.name : apt.building;
                          return (
                            apt.number.toLowerCase().includes(term) ||
                            (bName && bName.toLowerCase().includes(term))
                          );
                        }).length === 0 && (
                            <div className="p-4 text-center text-sm text-gray-500">
                              No se encontraron departamentos
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Huéspedes adicionales */}
                  {fields.needsAdditionalGuests && (
                    <div className="bg-purple-50 p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-800">Huéspedes Adicionales</h4>
                        <button
                          type="button"
                          onClick={addAdditionalGuest}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Agregar Huésped
                        </button>
                      </div>
                      {petitionFormData.additionalGuests?.map((guest, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border border-purple-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-gray-700">Huésped {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeAdditionalGuest(idx)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              ✕ Eliminar
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                              type="text"
                              value={guest.firstName}
                              onChange={(e) => updateAdditionalGuest(idx, 'firstName', e.target.value)}
                              placeholder="Nombre"
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={guest.lastName}
                              onChange={(e) => updateAdditionalGuest(idx, 'lastName', e.target.value)}
                              placeholder="Apellido"
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <input
                            type="text"
                            value={guest.document}
                            onChange={(e) => {
                              const formatted = handleRutInput(e.target.value);
                              updateAdditionalGuest(idx, 'document', formatted);
                            }}
                            onBlur={(e) => {
                              const cleaned = cleanRut(e.target.value);
                              if (cleaned) {
                                const formatted = handleRutInput(cleaned);
                                updateAdditionalGuest(idx, 'document', formatted);
                              }
                            }}
                            placeholder="RUT (12.345.678-9)"
                            maxLength={12}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                      {(!petitionFormData.additionalGuests || petitionFormData.additionalGuests.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          No hay huéspedes adicionales agregados. Haz clic en "+ Agregar Huésped" para agregar uno.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mostrar reserva relacionada si existe */}
                  {newPetitionData.stayId && selectedStay && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Reserva relacionada:</span> Depto {selectedStay.apartment.number} - {getGuestFullName(selectedStay)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCreatePetitionModal(false);
                setNewPetitionData({
                  type: 'OTHER',
                  title: '',
                  reason: '',
                  stayId: '',
                });
                setPetitionFormData({});
                setSelectedPetitionOption('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedPetitionOption || !newPetitionData.title}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear Petición
            </button>
          </div>
        </form>

      </Modal>

      {/* Modal de Detalles de Petición */}
      <Modal
        isOpen={showPetitionDetailModal && !!selectedPetition}
        onClose={() => {
          setShowPetitionDetailModal(false);
          setSelectedPetition(null);
        }}
        title="Detalles de la Petición"
        width="max-w-3xl"
      >

        {selectedPetition && (
          <>
            <div className="space-y-4">
              {/* Información básica */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Información General</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Título</div>
                    <div className="font-medium text-gray-900">{selectedPetition.title}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tipo</div>
                    <div className="font-medium text-gray-900">{selectedPetition.type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Estado</div>
                    <span className={`px-2 py-1 text-xs rounded-full ${selectedPetition.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : selectedPetition.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {selectedPetition.status === 'PENDING' ? 'Pendiente' :
                        selectedPetition.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Fecha de Creación</div>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedPetition.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {selectedPetition.reason && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-xs text-blue-600 font-medium mb-1">📝 Descripción</div>
                  <p className="text-gray-700 text-sm">{selectedPetition.reason}</p>
                </div>
              )}

              {/* Información de la reserva si existe */}
              {selectedPetition.stay && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">📋 Información de la Reserva</h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-500 mb-1">Departamento</div>
                      <div className="font-medium text-gray-900">
                        {typeof selectedPetition.stay.apartment.building === 'object'
                          ? selectedPetition.stay.apartment.building?.name
                          : selectedPetition.stay.apartment.building || 'Sin torre'} - Depto {selectedPetition.stay.apartment.number} (Piso {selectedPetition.stay.apartment.floor})
                      </div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-500 mb-1">
                        {selectedPetition.stay.category === 'GUEST' ? 'Huésped Principal' : 'Personal Principal'}
                      </div>
                      <div className="font-medium text-gray-900">
                        {selectedPetition.stay.guestFirstName} {selectedPetition.stay.guestLastName}
                      </div>
                      {selectedPetition.stay.guestDocument && (
                        <div className="text-sm text-gray-600 mt-1">
                          RUT: <span className="font-mono">{formatRut(selectedPetition.stay.guestDocument)}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded p-3">
                        <div className="text-xs text-gray-500 mb-1">Check-In Programado</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(selectedPetition.stay.scheduledCheckIn).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="bg-white rounded p-3">
                        <div className="text-xs text-gray-500 mb-1">Check-Out Programado</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(selectedPetition.stay.scheduledCheckOut).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información del departamento si existe */}
              {selectedPetition.apartment && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Información del Departamento</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Número:</span>
                      <span className="ml-2 font-medium">{selectedPetition.apartment.number}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Edificio:</span>
                      <span className="ml-2 font-medium">
                        {typeof selectedPetition.apartment.building === 'object'
                          ? (selectedPetition.apartment.building as any)?.name
                          : selectedPetition.apartment.building || 'Sin torre'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Datos registrados en la petición */}
              {selectedPetition.requestedData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">📋 Datos Registrados en la Petición</h4>

                  {/* Datos del huésped/personal principal */}
                  {(selectedPetition.requestedData.guestFirstName || selectedPetition.requestedData.guestLastName) && (
                    <div className="bg-white rounded p-3 mb-3">
                      <div className="text-xs text-gray-500 mb-1">
                        {selectedPetition.type === 'OTHER' && selectedPetition.title.includes('Personal')
                          ? 'Datos del Personal'
                          : 'Datos del Huésped'}
                      </div>
                      <div className="font-medium text-gray-900">
                        {selectedPetition.requestedData.guestFirstName} {selectedPetition.requestedData.guestLastName}
                      </div>
                      {selectedPetition.requestedData.guestDocument && (
                        <div className="text-sm text-gray-600 mt-1">
                          RUT: <span className="font-mono">{formatRut(selectedPetition.requestedData.guestDocument)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Datos correctos */}
                  {(selectedPetition.requestedData.correctFirstName || selectedPetition.requestedData.correctLastName) && (
                    <div className="bg-green-50 rounded p-3 mb-3">
                      <div className="text-xs text-gray-500 mb-1 font-semibold">Datos Correctos del Huésped</div>
                      <div className="font-medium text-gray-900">
                        {selectedPetition.requestedData.correctFirstName} {selectedPetition.requestedData.correctLastName}
                      </div>
                      {selectedPetition.requestedData.correctDocument && (
                        <div className="text-sm text-gray-600 mt-1">
                          RUT: <span className="font-mono">{formatRut(selectedPetition.requestedData.correctDocument)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Huéspedes adicionales */}
                  {selectedPetition.requestedData.additionalGuests &&
                    Array.isArray(selectedPetition.requestedData.additionalGuests) &&
                    selectedPetition.requestedData.additionalGuests.length > 0 && (
                      <div className="bg-white rounded p-3">
                        <div className="text-xs text-gray-500 mb-2">
                          Huéspedes Adicionales ({selectedPetition.requestedData.additionalGuests.length})
                        </div>
                        <div className="space-y-1">
                          {selectedPetition.requestedData.additionalGuests.map((guest: any, idx: number) => (
                            <div key={idx} className="text-sm text-gray-700">
                              • {guest.firstName} {guest.lastName}
                              {guest.document && (
                                <span className="text-gray-500 ml-2">
                                  (RUT: <span className="font-mono">{formatRut(guest.document)}</span>)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Notas del administrador */}
              {selectedPetition.adminNotes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-xs text-yellow-600 font-medium mb-1">📌 Notas del Administrador</div>
                  <p className="text-gray-700 text-sm">{selectedPetition.adminNotes}</p>
                </div>
              )}

              {/* Fecha de revisión */}
              {selectedPetition.reviewedAt && (
                <div className="text-xs text-gray-500">
                  {selectedPetition.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'} el {new Date(selectedPetition.reviewedAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowPetitionDetailModal(false);
                  setSelectedPetition(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Cerrar
              </button>
            </div>
          </>
        )}

      </Modal>
    </Layout>
  );
};
