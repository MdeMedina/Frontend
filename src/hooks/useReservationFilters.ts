import { useState, useMemo } from 'react';
import type { Stay } from '../api/stays';

export const useReservationFilters = (stays: Stay[]) => {
  const [filterApartment, setFilterApartment] = useState('');
  const [filterCheckInFrom, setFilterCheckInFrom] = useState<Date | null>(null);
  const [filterCheckInTo, setFilterCheckInTo] = useState<Date | null>(null);
  const [filterCheckOutFrom, setFilterCheckOutFrom] = useState<Date | null>(null);
  const [filterCheckOutTo, setFilterCheckOutTo] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredStays = useMemo(() => {
    return stays.filter(stay => {
      // Filtro por departamento
      if (filterApartment && !stay.apartment.number.toLowerCase().includes(filterApartment.toLowerCase())) {
        return false;
      }

      // Filtro por Check-In desde
      if (filterCheckInFrom) {
        const checkIn = new Date(stay.scheduledCheckIn);
        if (checkIn < filterCheckInFrom) return false;
      }

      // Filtro por Check-In hasta
      if (filterCheckInTo) {
        const checkIn = new Date(stay.scheduledCheckIn);
        const to = new Date(filterCheckInTo);
        to.setHours(23, 59, 59, 999);
        if (checkIn > to) return false;
      }

      // Filtro por Check-Out desde
      if (filterCheckOutFrom) {
        const checkOut = new Date(stay.scheduledCheckOut);
        if (checkOut < filterCheckOutFrom) return false;
      }

      // Filtro por Check-Out hasta
      if (filterCheckOutTo) {
        const checkOut = new Date(stay.scheduledCheckOut);
        const to = new Date(filterCheckOutTo);
        to.setHours(23, 59, 59, 999);
        if (checkOut > to) return false;
      }

      // Filtro por estado
      if (filterStatus && stay.status !== filterStatus) {
        return false;
      }

      // Filtro por categoría
      if (filterCategory && stay.category !== filterCategory) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduledCheckIn).getTime();
      const dateB = new Date(b.scheduledCheckIn).getTime();
      return dateB - dateA;
    });
  }, [stays, filterApartment, filterCheckInFrom, filterCheckInTo, filterCheckOutFrom, filterCheckOutTo, filterStatus, filterCategory]);

  const clearFilters = () => {
    setFilterApartment('');
    setFilterCheckInFrom(null);
    setFilterCheckInTo(null);
    setFilterCheckOutFrom(null);
    setFilterCheckOutTo(null);
    setFilterStatus('');
    setFilterCategory('');
  };

  return {
    filters: {
      filterApartment, setFilterApartment,
      filterCheckInFrom, setFilterCheckInFrom,
      filterCheckInTo, setFilterCheckInTo,
      filterCheckOutFrom, setFilterCheckOutFrom,
      filterCheckOutTo, setFilterCheckOutTo,
      filterStatus, setFilterStatus,
      filterCategory, setFilterCategory,
    },
    filteredStays,
    clearFilters,
    totalCount: stays.length,
    filteredCount: filteredStays.length
  };
};
