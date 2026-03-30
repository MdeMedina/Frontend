export interface DashboardMenuItem {
  title: string;
  description: string;
  icon: string;
  path: string;
}

export const ownerMenuItems: DashboardMenuItem[] = [
  {
    title: 'Mis Departamentos',
    description: 'Ver y solicitar nuevos departamentos',
    icon: 'apartment',
    path: '/propietario/apartments',
  },
  {
    title: 'Mis Responsables',
    description: 'Gestionar responsables asignados a tus departamentos',
    icon: 'group_add',
    path: '/propietario/managers',
  },
  {
    title: 'Gestión de Reservas',
    description: 'Crear, modificar y cancelar reservas',
    icon: 'calendar_month',
    path: '/propietario/reservations',
  },
  {
    title: 'Mis Peticiones',
    description: 'Ver peticiones enviadas y recibidas',
    icon: 'rule',
    path: '/propietario/petitions',
  },
  {
    title: 'Calendario',
    description: 'Ver calendario visual de check-in/check-out',
    icon: 'event_note',
    path: '/propietario/calendar',
  },
];

export const managerMenuItems: DashboardMenuItem[] = [
  {
    title: 'Departamentos Asignados',
    description: 'Ver los departamentos que tienes a cargo',
    icon: 'apartment',
    path: '/responsable/apartments',
  },
  {
    title: 'Gestión de Reservas',
    description: 'Crear, modificar y cancelar reservas',
    icon: 'calendar_month',
    path: '/responsable/reservations',
  },
  {
    title: 'Mis Peticiones',
    description: 'Ver peticiones enviadas y recibidas',
    icon: 'rule',
    path: '/responsable/petitions',
  },
  {
    title: 'Calendario',
    description: 'Ver calendario visual de check-in/check-out',
    icon: 'event_note',
    path: '/responsable/calendar',
  },
];
