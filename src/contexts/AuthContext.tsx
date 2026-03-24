import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi } from '../api/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'OWNER' | 'ASSIGNED_MANAGER' | 'CONCIERGE';
  residenceId?: string;
  residenceIds?: string[];
  isMainAdmin?: Record<string, boolean>;
  availableResidences?: { id: string; name: string; buildings?: { id: string; name: string }[] }[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  impersonatedResidenceId: string | null;
  impersonatedResidenceName: string | null;
  impersonatedBuildingId: string | null;
  impersonatedBuildingName: string | null;
  impersonationMode: boolean;
  startImpersonation: (residenceId: string, residenceName: string, buildingId?: string, buildingName?: string) => void;
  stopImpersonation: () => void;
  isMainAdminFor: (residenceId: string) => boolean;
  managedResidence: { id: string; name: string } | null;
  managedBuilding: { id: string; name: string } | null;
  selectResidence: (residence: { id: string; name: string } | null) => void;
  selectBuilding: (building: { id: string; name: string } | null) => void;
  currentResidence: { id: string; name: string } | null;
  currentBuilding: { id: string; name: string } | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonatedResidenceId, setImpersonatedResidenceId] = useState<string | null>(null);
  const [impersonatedResidenceName, setImpersonatedResidenceName] = useState<string | null>(null);
  const [impersonatedBuildingId, setImpersonatedBuildingId] = useState<string | null>(null);
  const [impersonatedBuildingName, setImpersonatedBuildingName] = useState<string | null>(null);
  const [managedResidence, setManagedResidence] = useState<{ id: string; name: string } | null>(null);
  const [managedBuilding, setManagedBuilding] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    // Cargar usuario y token del localStorage al iniciar
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setToken(storedToken);
          setUser(parsedUser);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }


    // Cargar estado de impersonación
    const storedImpersonation = localStorage.getItem('impersonatedResidenceId');
    const storedImpersonationName = localStorage.getItem('impersonatedResidenceName');
    const storedImpBuildingId = localStorage.getItem('impersonatedBuildingId');
    const storedImpBuildingName = localStorage.getItem('impersonatedBuildingName');
    if (storedImpersonation) {
      setImpersonatedResidenceId(storedImpersonation);
      if (storedImpersonationName) {
        setImpersonatedResidenceName(storedImpersonationName);
      }
      if (storedImpBuildingId) setImpersonatedBuildingId(storedImpBuildingId);
      if (storedImpBuildingName) setImpersonatedBuildingName(storedImpBuildingName);
    }

    // Cargar estado de residencia gestionada
    const storedManagedResidence = localStorage.getItem('managedResidence');
    if (storedManagedResidence) {
      try {
        setManagedResidence(JSON.parse(storedManagedResidence));
      } catch {
        localStorage.removeItem('managedResidence');
      }
    }

    // Cargar estado de edificio gestionado
    const storedManagedBuilding = localStorage.getItem('managedBuilding');
    if (storedManagedBuilding) {
      try {
        setManagedBuilding(JSON.parse(storedManagedBuilding));
      } catch {
        localStorage.removeItem('managedBuilding');
      }
    }

    setIsLoading(false);
  }, []);

  const selectResidence = (residence: { id: string; name: string } | null) => {
      setManagedResidence(residence);
      if (residence) {
          localStorage.setItem('managedResidence', JSON.stringify(residence));
      } else {
          localStorage.removeItem('managedResidence');
      }
  };

  const selectBuilding = (building: { id: string; name: string } | null) => {
      setManagedBuilding(building);
      if (building) {
          localStorage.setItem('managedBuilding', JSON.stringify(building));
      } else {
          localStorage.removeItem('managedBuilding');
      }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    
    setToken(response.access_token);
    setUser(response.user);
    
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Auto-seleccionar si solo tiene una residencia
    if (response.user.availableResidences?.length === 1) {
         const autoRes = response.user.availableResidences[0];
         selectResidence(autoRes);
         
         // Si esta residencia tiene solo 1 edificio, auto-seleccionar también
         if (autoRes.buildings?.length === 1) {
            selectBuilding(autoRes.buildings[0]);
         } else {
            selectBuilding(null);
         }
    } else {
        selectResidence(null); 
        selectBuilding(null);
    }

    return response.user;
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await authApi.getCurrentUser();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error al refrescar usuario:', error);
    }
  };

  const startImpersonation = (residenceId: string, residenceName: string, buildingId?: string, buildingName?: string) => {
    setImpersonatedResidenceId(residenceId);
    setImpersonatedResidenceName(residenceName);
    localStorage.setItem('impersonatedResidenceId', residenceId);
    localStorage.setItem('impersonatedResidenceName', residenceName);

    if (buildingId && buildingName) {
      setImpersonatedBuildingId(buildingId);
      setImpersonatedBuildingName(buildingName);
      localStorage.setItem('impersonatedBuildingId', buildingId);
      localStorage.setItem('impersonatedBuildingName', buildingName);
    } else {
      setImpersonatedBuildingId(null);
      setImpersonatedBuildingName(null);
      localStorage.removeItem('impersonatedBuildingId');
      localStorage.removeItem('impersonatedBuildingName');
    }
  };

  const stopImpersonation = () => {
    setImpersonatedResidenceId(null);
    setImpersonatedResidenceName(null);
    setImpersonatedBuildingId(null);
    setImpersonatedBuildingName(null);
    localStorage.removeItem('impersonatedResidenceId');
    localStorage.removeItem('impersonatedResidenceName');
    localStorage.removeItem('impersonatedBuildingId');
    localStorage.removeItem('impersonatedBuildingName');
  };

  const isMainAdminFor = (residenceId: string) => {
    if (!user) return false;
    if (user.role === 'SUPERADMIN') return true;
    if (user.role !== 'ADMIN') return false;
    
    return user.isMainAdmin?.[residenceId] || false;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('impersonatedResidenceName');
      localStorage.removeItem('impersonatedBuildingId');
      localStorage.removeItem('impersonatedBuildingName');
      stopImpersonation(); 
      selectResidence(null); // Limpiar residencia gestionada
      selectBuilding(null); // Limpiar edificio gestionado
    }
  };

  // Calcular residencia actual efectiva
  const currentResidence = impersonatedResidenceId 
    ? { id: impersonatedResidenceId, name: impersonatedResidenceName || 'Residencia' }
    : managedResidence;

  const currentBuilding = impersonatedBuildingId
    ? { id: impersonatedBuildingId, name: impersonatedBuildingName || 'Edificio' }
    : managedBuilding;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading,
        impersonatedResidenceId,
        impersonatedResidenceName,
        impersonatedBuildingId,
        impersonatedBuildingName,
        impersonationMode: !!impersonatedResidenceId,
        startImpersonation,
        stopImpersonation,
        isMainAdminFor,
        managedResidence,
        managedBuilding,
        selectResidence,
        selectBuilding,
        currentResidence,
        currentBuilding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

