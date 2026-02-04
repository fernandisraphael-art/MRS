
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store';
import Layout from './components/Layout';
import Login from './components/Login';
import TimeEntryForm from './components/TimeEntryForm';
import LogList from './components/LogList';
import Dashboard from './components/Dashboard';
import ResourceManager from './components/ResourceManager';
import { UserRole, User } from './types';
import { SPECIALTIES_SEED } from './constants';

const MainApp: React.FC = () => {
  const { currentUser, logs, users, addProject, addUser, updateUser, deleteUser, toggleUserStatus, importUsers } = useApp();
  const [activeTab, setActiveTab] = useState('my-day');
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  
  // Equipe Tab State
  const [teamView, setTeamView] = useState<'logs' | 'users'>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', role: UserRole.COLLABORATOR, specialty: '' });
  const [importText, setImportText] = useState('');

  // Auto-redirect Admin/Director to Team page
  useEffect(() => {
    if (currentUser?.role === UserRole.DIRECTOR && activeTab === 'my-day') {
      setActiveTab('team');
    }
  }, [currentUser]);

  if (!currentUser) {
    return <Login />;
  }

  const myLogs = logs.filter(l => l.collaboratorId === currentUser?.id);
  const today = new Date().toISOString().split('T')[0];
  const logsToday = myLogs.filter(l => l.date === today);

  const handleEdit = (log: any) => {
    setEditingLog(log);
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({ name: user.name, role: user.role, specialty: user.specialty || '' });
    setShowUserModal(true);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name) return;

    if (editingUser) {
      updateUser(editingUser.id, { 
        name: newUser.name, 
        role: newUser.role, 
        specialty: newUser.specialty 
      });
      setEditingUser(null);
    } else {
      addUser(newUser.name, newUser.role, newUser.specialty);
    }

    setNewUser({ name: '', role: UserRole.COLLABORATOR, specialty: '' });
    setShowUserModal(false);
  };

  const handleImportSubmit = () => {
    const names = importText.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (names.length > 0) {
      importUsers(names);
      setImportText('');
      setShowImportModal(false);
    }
  };

  const renderContent = () => {
    if (showForm) {
      return (
        <TimeEntryForm 
          editLog={editingLog}
          onSuccess={() => { setShowForm(false); setEditingLog(null); }}
          onCancel={() => { setShowForm(false); setEditingLog(null); }}
        />
      );
    }

    switch (activeTab) {
      case 'my-day':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div>
                <h2 className="text-3xl font-black text-[#003057] tracking-tight">Meu Dia</h2>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <button 
                onClick={() => setShowForm(true)}
                className="bg-[#003057] text-white px-6 py-4 rounded-2xl hover:bg-[#002544] transition-all shadow-xl shadow-blue-900/10 flex items-center gap-2 font-black active:scale-95 border-b-4 border-black/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline">LANÇAR HORAS</span>
              </button>
            </div>
            <LogList logs={logsToday} onEdit={handleEdit} title="Apontamentos de Hoje" showFilters={false} />
          </div>
        );
      case 'history':
        return <LogList logs={myLogs} onEdit={handleEdit} title="Minhas Horas" />;
      case 'team':
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[#003057] tracking-tighter uppercase">Equipe GEEE</h2>
                  <div className="flex bg-slate-100 p-1 rounded-xl mt-3 w-fit">
                    <button 
                      onClick={() => setTeamView('users')}
                      className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${teamView === 'users' ? 'bg-[#003057] text-white shadow-md' : 'text-slate-400'}`}
                    >
                      Gestão de Colaboradores
                    </button>
                    <button 
                      onClick={() => setTeamView('logs')}
                      className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${teamView === 'logs' ? 'bg-[#003057] text-white shadow-md' : 'text-slate-400'}`}
                    >
                      Histórico da Equipe
                    </button>
                  </div>
                </div>

                {teamView === 'users' && (
                  <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setShowImportModal(true)} className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-[#003057] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Importar Lista</button>
                    <button onClick={() => { setEditingUser(null); setNewUser({name: '', role: UserRole.COLLABORATOR, specialty: ''}); setShowUserModal(true); }} className="flex-1 md:flex-none px-6 py-3 bg-[#FFCD00] text-[#003057] rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-105 shadow-lg shadow-[#FFCD00]/20">+ Incluir</button>
                  </div>
                )}
              </div>

              {teamView === 'users' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="px-4 py-4 text-left">Colaborador</th>
                        <th className="px-4 py-4 text-left">Perfil / Especialidade</th>
                        <th className="px-4 py-4 text-center">Status</th>
                        <th className="px-4 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map(user => (
                        <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${!user.active ? 'opacity-50 grayscale' : ''}`}>
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-[#003057] shadow-sm">{user.name.charAt(0)}</div>
                              <span className="text-sm font-black text-[#003057]">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md w-fit">{user.role}</span>
                              {user.specialty && (
                                <span className="text-[9px] font-black text-[#003057]/60 uppercase tracking-widest mt-1 ml-1">
                                  {user.specialty}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-5 text-center">
                            <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {user.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#FFCD00]/20 hover:text-[#003057] transition-all"
                                title="Editar Colaborador"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => toggleUserStatus(user.id)}
                                className={`p-2.5 rounded-xl transition-all ${user.active ? 'bg-slate-50 text-slate-400 hover:text-orange-500' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                title={user.active ? "Desativar" : "Ativar"}
                              >
                                {user.active ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                )}
                              </button>
                              <button 
                                onClick={() => { if(confirm('Excluir definitivamente?')) deleteUser(user.id) }}
                                className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-100"
                                title="Excluir"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.74 0-.34-6m4.74-3-.42 8.59c-.01.66-.65 1.17-1.32 1.17H9.08c-.67 0-1.31-.51-1.32-1.17L7.33 6m12.5 0a2.25 2.25 0 0 0-2.25-2.25h-3.75a2.25 2.25 0 0 0-2.25-2.25h-2.25a2.25 2.25 0 0 0-2.25 2.25h-3.75a2.25 2.25 0 0 0-2.25 2.25M17.25 6H6.75" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <LogList logs={logs} title="" />
              )}
            </div>
          </div>
        );
      case 'planning':
        return <ResourceManager />;
      case 'reports':
        return <Dashboard />;
      default:
        return <div>Em breve...</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setShowForm(false); }}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderContent()}
      </div>

      {/* MODAL: NOVO/EDITAR COLABORADOR */}
      {showUserModal && (
        <div className="fixed inset-0 bg-[#001b31]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-[#003057] uppercase tracking-tighter mb-8 text-center">
              {editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h3>
            <form onSubmit={handleAddUserSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text"
                  autoFocus
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-[#003057] transition-all"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nome do colaborador"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                <select 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-[#003057] transition-all"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                >
                  {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Especialidade</label>
                <select 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 focus:border-[#003057] transition-all"
                  value={newUser.specialty}
                  onChange={e => setNewUser({...newUser, specialty: e.target.value})}
                >
                  <option value="">Não Definido</option>
                  {SPECIALTIES_SEED.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowUserModal(false); setEditingUser(null); }} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-[#003057] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 active:scale-95 transition-all">
                  {editingUser ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR LISTA */}
      {showImportModal && (
        <div className="fixed inset-0 bg-[#001b31]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-[#003057] uppercase tracking-tighter mb-4">Importar Lista</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase mb-6 tracking-widest">Cole os nomes separados por linha para cadastro em lote.</p>
            <textarea 
              className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-bold text-slate-700 focus:border-[#003057] resize-none transition-all placeholder:italic"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Ex:&#10;Abner Orra&#10;Adalberto Kumagaia"
            />
            <div className="flex gap-4 pt-8">
              <button type="button" onClick={() => setShowImportModal(false)} className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest">Fechar</button>
              <button onClick={handleImportSubmit} className="flex-1 py-5 bg-[#FFCD00] text-[#003057] font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-[#FFCD00]/20 active:scale-95 transition-all">Processar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
};

export default App;
