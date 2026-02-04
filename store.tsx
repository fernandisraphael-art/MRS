
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, User, Project, TimeLog, Allocation, UserRole } from './types';
import { INITIAL_USERS, INITIAL_PROJECTS, ACTIVITIES_SEED } from './constants';

interface AppContextType extends AppState {
  setCurrentUser: (user: User | null) => void;
  addLog: (log: Omit<TimeLog, 'id' | 'createdAt' | 'updatedAt' | 'collaboratorId' | 'collaboratorName'>) => string | null;
  updateLog: (id: string, updates: Partial<TimeLog>) => void;
  deleteLog: (id: string) => void;
  addProject: (name: string) => void;
  moveAllocation: (allocationId: string, newUserId: string, newDate: string) => void;
  addAllocation: (allocation: Omit<Allocation, 'id'>) => void;
  deleteAllocation: (id: string) => void;
  addUser: (name: string, role: UserRole, specialty?: string) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  importUsers: (names: string[]) => void;
  toggleUserStatus: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_ALLOCATIONS: Allocation[] = [
  { id: 'a1', userId: 'u-1', projectId: 'p-1', projectName: 'Pátio Aparecida', startDate: new Date().toISOString().split('T')[0], durationDays: 3, hoursPerDay: 8, color: '#003057' },
  { id: 'a2', userId: 'u-2', projectId: 'p-2', projectName: 'CBTC Serra', startDate: new Date().toISOString().split('T')[0], durationDays: 5, hoursPerDay: 4, color: '#0058a3' },
  { id: 'a3', userId: 'u-3', projectId: 'p-3', projectName: 'Cancelas Ar-4', startDate: new Date().toISOString().split('T')[0], durationDays: 2, hoursPerDay: 6, color: '#001b31' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('g3eclocking_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Função robusta de ordenação alfabética
  const sortUsers = (list: User[]) => {
    return [...list].sort((a, b) => 
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  };

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('g3eclocking_users_v2');
    const list = saved ? JSON.parse(saved) : INITIAL_USERS;
    return sortUsers(list);
  });

  const [logs, setLogs] = useState<TimeLog[]>(() => {
    const saved = localStorage.getItem('g3eclocking_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('g3eclocking_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [allocations, setAllocations] = useState<Allocation[]>(() => {
    const saved = localStorage.getItem('g3eclocking_allocs');
    return saved ? JSON.parse(saved) : INITIAL_ALLOCATIONS;
  });

  useEffect(() => {
    localStorage.setItem('g3eclocking_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('g3eclocking_users_v2', JSON.stringify(users));
    localStorage.setItem('g3eclocking_logs', JSON.stringify(logs));
    localStorage.setItem('g3eclocking_projects', JSON.stringify(projects));
    localStorage.setItem('g3eclocking_allocs', JSON.stringify(allocations));
  }, [users, logs, projects, allocations]);

  const addUser = (name: string, role: UserRole, specialty?: string) => {
    const newUser: User = {
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      role: role,
      active: true,
      specialty: specialty
    };
    setUsers(prev => sortUsers([...prev, newUser]));
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => {
      const updatedList = prev.map(u => u.id === id ? { ...u, ...data } : u);
      return sortUsers(updatedList);
    });
    
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const importUsers = (names: string[]) => {
    const newUsers: User[] = names
      .filter(name => name.trim().length > 0)
      .map(name => ({
        id: `u-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        role: UserRole.COLLABORATOR,
        active: true
      }));
    setUsers(prev => sortUsers([...prev, ...newUsers]));
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  const addLog = (data: any) => {
    if (!currentUser) return null;
    const dayLogs = logs.filter(l => l.collaboratorId === currentUser.id && l.date === data.date);
    const dailyTotal = dayLogs.reduce((acc, curr) => acc + curr.hours, 0);
    if (dailyTotal + data.hours > 24) return "O total de horas por dia não pode exceder 24h.";

    const newLog: TimeLog = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      collaboratorId: currentUser.id,
      collaboratorName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
    return null;
  };

  const updateLog = (id: string, updates: Partial<TimeLog>) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const addProject = (name: string) => {
    const newProject: Project = { id: `p-${Math.random().toString(36).substr(2, 5)}`, name, status: 'ativo' };
    setProjects(prev => [...prev, newProject]);
  };

  const moveAllocation = (allocationId: string, newUserId: string, newDate: string) => {
    setAllocations(prev => prev.map(a => 
      a.id === allocationId ? { ...a, userId: newUserId, startDate: newDate } : a
    ));
  };

  const addAllocation = (data: Omit<Allocation, 'id'>) => {
    const newAlloc: Allocation = {
      ...data,
      id: Math.random().toString(36).substr(2, 9)
    };
    setAllocations(prev => [...prev, newAlloc]);
  };

  const deleteAllocation = (id: string) => {
    setAllocations(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, projects, activities: ACTIVITIES_SEED, logs, allocations,
      setCurrentUser, addLog, updateLog, deleteLog, addProject, moveAllocation, addAllocation, deleteAllocation,
      addUser, updateUser, deleteUser, importUsers, toggleUserStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
