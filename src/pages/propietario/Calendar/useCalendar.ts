import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../../api/client';
import { useAuth } from '../../../contexts/AuthContext';
import type { Stay } from '../../../api/stays';

export type CalendarEvent = {
  stay: Stay;
  type: 'checkIn' | 'checkOut' | 'staying';
};

export const useCalendar = () => {
  const { user } = useAuth();
  const [stays, setStays] = useState<Stay[]>([]);
  const [myApartments, setMyApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterApartment, setFilterApartment] = useState('');
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const fetchMyApartments = async () => {
    try {
      const response = await apiClient.get('/apartments');
      const allApartments = response.data.data || response.data;
      
      const isOwner = user?.role === 'OWNER';
      const isManager = user?.role === 'ASSIGNED_MANAGER';
      
      const mine = allApartments.filter((apt: any) => {
        if (isOwner) return apt.owner?.id === user?.id;
        if (isManager) return apt.manager?.id === user?.id;
        return false;
      });
      
      setMyApartments(mine);
      return mine;
    } catch (err) {
      console.error('Error loading apartments:', err);
      return [];
    }
  };

  const fetchStays = async (apartments: any[]) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/stays', { params: { limit: 200 } });
      const allStays = response.data.data || [];
      
      const myApartmentIds = apartments.map((a: any) => a.id);
      const myStays = allStays.filter((stay: Stay) => 
        myApartmentIds.includes(stay.apartmentId)
      );
      
      setStays(myStays);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const apartments = await fetchMyApartments();
      if (apartments.length > 0) {
        await fetchStays(apartments);
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const staysInMonth = useMemo(() => {
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    return stays.filter(stay => {
      if (filterApartment && stay.apartmentId !== filterApartment) return false;
      if (stay.status === 'CANCELLED') return false;
      
      const checkIn = new Date(stay.scheduledCheckIn);
      const checkOut = new Date(stay.scheduledCheckOut);
      
      return (checkIn <= endOfMonth && checkOut >= startOfMonth);
    });
  }, [stays, currentYear, currentMonth, filterApartment]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    const daysInMonthCount = getDaysInMonth(currentYear, currentMonth);
    
    for (let day = 1; day <= daysInMonthCount; day++) {
      map[day] = [];
    }

    staysInMonth.forEach(stay => {
      const checkIn = new Date(stay.scheduledCheckIn);
      const checkOut = new Date(stay.scheduledCheckOut);
      
      for (let day = 1; day <= daysInMonthCount; day++) {
        const currentDayStart = new Date(currentYear, currentMonth, day, 0, 0, 0);
        const currentDayEnd = new Date(currentYear, currentMonth, day, 23, 59, 59);
        
        const isCheckInDay = checkIn.getDate() === day && 
                             checkIn.getMonth() === currentMonth && 
                             checkIn.getFullYear() === currentYear;
        
        const isCheckOutDay = checkOut.getDate() === day && 
                               checkOut.getMonth() === currentMonth && 
                               checkOut.getFullYear() === currentYear;
        
        const isStaying = checkIn < currentDayStart && checkOut > currentDayEnd;
        
        if (isCheckInDay) {
          map[day].push({ stay, type: 'checkIn' });
        } else if (isCheckOutDay) {
          map[day].push({ stay, type: 'checkOut' });
        } else if (isStaying) {
          map[day].push({ stay, type: 'staying' });
        }
      }
    });

    return map;
  }, [staysInMonth, currentYear, currentMonth]);

  const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const daysInMonthCount = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  return {
    loading,
    error,
    currentDate,
    currentYear,
    currentMonth,
    filterApartment,
    setFilterApartment,
    myApartments,
    selectedStay,
    setSelectedStay,
    eventsByDay,
    daysInMonthCount,
    firstDayOfMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  };
};
