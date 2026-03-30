export type Manager = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type Owner = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type Apartment = {
  id: string;
  number: string;
  floor: number;
  building: {
    id: string;
    name: string;
  };
  description?: string;
  isActive: boolean;
  owner?: Owner;
  manager?: Manager;
  parkingNumber?: string;
  sourceAssignments?: {
    parkingNumber: string;
    targetApartment: {
      number: string;
      building: { name: string };
      owner: { firstName: string; lastName: string };
    };
  }[];
  targetAssignments?: {
    parkingNumber: string;
    sourceApartment: {
      number: string;
      building: { name: string };
      owner: { firstName: string; lastName: string };
    };
  }[];
};

export type AvailableManager = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type PendingApartmentPetition = {
  id: string;
  type: string;
  title: string;
  status: string;
  requestedData?: any;
  createdAt: string;
};
