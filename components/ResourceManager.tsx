
import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { User, Project } from '../types';

type ViewMode = 'week' | 'fortnight' | 'month';

const ResourceManager: React.FC = () => {
  const { users, projects, allocations, logs, moveAllocation, addAllocation, deleteAllocation } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('fortnight');
  const [baseDate, setBaseDate] = useState(new Date());
  
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newAlloc, setNewAlloc] = useState({
    projectId: '',
    startDate: new Date().toISOString().split('T')[0],
    duration: 5,
    hoursPerDay: 8
  });

  // Calculate days based on view mode
  const days = useMemo(() => {
    const numDays = viewMode === 'week' ? 7 : viewMode === 'fortnight' ? 14 : 31;
    return Array.from({ length: numDays }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [viewMode, baseDate]);

  const [draggedAlloc, setDraggedAlloc] = useState<string | null>(null);

  const navigate = (direction: number) => {
    const newDate = new Date(baseDate);
    const step = viewMode === 'week' ? 7 : viewMode === 'fortnight' ? 14 : 30;
    newDate.setDate(baseDate.getDate() + (direction * step));
    setBaseDate(newDate);
  };

  const getCapacityColor = (hours: number) => {
    if (hours === 0) return 'bg-slate-50';
    if (hours < 6) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (hours <= 9) return 'bg-blue-50 text-[#003057] border-blue-100';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const calculateDailyLoad = (userId: string, date: string) => {
    const planned = allocations
      .filter(a => a.userId === userId)
      .reduce((acc, a) => {
        const start = new Date(a.startDate + 'T00:00:00');
        const current = new Date(date + 'T00:00:00');
        const diff = Math.floor((current.getTime() - start.getTime()) / (1000 * 3600 * 24));
        return (diff >= 0 && diff < a.durationDays) ? acc + a.hoursPerDay : acc;
      }, 0);

    const actual = logs
      .filter(l => l.collaboratorId === userId && l.date === date)
      .reduce((acc, l) => acc + l.hours, 0);

    return { planned, actual, total: planned + actual };
  };

  const handleAddAlloc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newAlloc.projectId) return;

    const project = projects.find(p => p.id === newAlloc.projectId);
    addAllocation({
      userId: selectedUser.id,
      projectId: newAlloc.projectId,
      projectName: project?.name || 'Projeto',
      startDate: newAlloc.startDate,
      durationDays: newAlloc.duration,
      hoursPerDay: newAlloc.hoursPerDay,
      color: ['#003057', '#0058a3', '#001b31', '#0e7490', '#334155'][Math.floor(Math.random() * 5)]
    });

    setShowModal(false);
    setSelectedUser(null);
  };

  const onDragStart = (id: string) => setDraggedAlloc(id);
  const onDrop = (userId: string, date: string) => {
    if (draggedAlloc) {
      moveAllocation(draggedAlloc, userId, date);
      setDraggedAlloc(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER E FILTROS ESTILO REFERÊNCIA */}
      <div className="bg-[#003057] p-8 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-3xl font-black text-[#FFCD00] tracking-tighter uppercase">Capacity Planner</h2>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-blue-200/50 text-[10px] font-black uppercase tracking-[0.2em]">Gestão de Recursos GEEE</p>
               <span className="text-white/20 text-xs">•</span>
               <span className="text-white text-[10px] font-black uppercase tracking-widest">{baseDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Navegação Estilo Imagem: [ < ] [ HOJE ] [ > ] */}
            <div className="flex items-center bg-[#002544] rounded-2xl p-1.5 border border-white/10 shadow-inner">
              <button 
                onClick={() => navigate(-1)} 
                className="p-3 hover:bg-white/10 rounded-xl text-white transition-all active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={() => setBaseDate(new Date())} 
                className="px-6 py-2 text-[11px] font-black text-white uppercase tracking-[0.2em] hover:text-[#FFCD00] transition-all"
              >
                Hoje
              </button>
              <button 
                onClick={() => navigate(1)} 
                className="p-3 hover:bg-white/10 rounded-xl text-white transition-all active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Seletores de Período Estilo Imagem */}
            <div className="flex items-center bg-[#002544] rounded-2xl p-1.5 border border-white/10 shadow-inner">
              {(['week', 'fortnight', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                    viewMode === mode 
                    ? 'bg-[#FFCD00] text-[#003057] shadow-lg transform scale-[1.02]' 
                    : 'text-white/50 hover:text-white'
                  }`}
                >
                  {mode === 'week' ? 'Semana' : mode === 'fortnight' ? 'Quinzena' : 'Mês'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE VIEW */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky left-0 z-30 bg-slate-50 p-6 text-left border-r border-slate-100 min-w-[280px]">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recurso / Engenheiro</span>
                </th>
                {days.map(date => {
                  const d = new Date(date + 'T00:00:00');
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = date === new Date().toISOString().split('T')[0];
                  return (
                    <th key={date} className={`p-4 border-r border-slate-100 min-w-[120px] ${isWeekend ? 'bg-slate-100/40' : ''} ${isToday ? 'bg-blue-50/50' : ''}`}>
                      <div className="text-[10px] font-black text-slate-400 uppercase">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                      <div className={`text-lg font-black ${isWeekend ? 'text-slate-400' : 'text-[#003057]'} ${isToday ? 'text-blue-600 underline decoration-4 underline-offset-4' : ''}`}>
                        {d.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.name !== 'Admin').map(user => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/20 transition-colors group">
                  <td className="sticky left-0 z-30 bg-white p-6 border-r border-slate-100 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#003057] text-[#FFCD00] flex items-center justify-center font-black">
                          {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-black text-[#003057] truncate">{user.name}</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                            {user.specialty || 'Engenharia Eletro'}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedUser(user); setShowModal(true); }}
                        className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:bg-[#FFCD00] hover:text-[#003057] transition-all opacity-0 group-hover:opacity-100"
                        title="Nova Alocação"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  {days.map(date => {
                    const load = calculateDailyLoad(user.id, date);
                    const dayAllocations = allocations.filter(a => {
                      const start = new Date(a.startDate + 'T00:00:00');
                      const current = new Date(date + 'T00:00:00');
                      const diff = Math.floor((current.getTime() - start.getTime()) / (1000 * 3600 * 24));
                      return a.userId === user.id && diff >= 0 && diff < a.durationDays;
                    });
                    const dayLogs = logs.filter(l => l.collaboratorId === user.id && l.date === date);

                    return (
                      <td 
                        key={`${user.id}-${date}`} 
                        className={`p-2 border-r border-slate-100 relative transition-all h-36 min-w-[120px] ${getCapacityColor(load.total)}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDrop(user.id, date)}
                      >
                        <div className="absolute top-1 right-2 flex gap-1 items-baseline">
                          <span className={`text-[10px] font-black ${load.total > 9 ? 'text-red-600' : 'text-[#003057] opacity-40'}`}>
                            {load.total > 0 ? load.total.toFixed(1) + 'h' : ''}
                          </span>
                        </div>
                        
                        <div className="space-y-1 mt-3">
                          {dayAllocations.map(a => {
                            const isFirstDay = a.startDate === date;
                            return (
                              <div
                                key={a.id}
                                draggable
                                onDragStart={() => onDragStart(a.id)}
                                onDoubleClick={() => { if(confirm('Excluir esta alocação?')) deleteAllocation(a.id) }}
                                className={`p-1.5 rounded-lg text-white text-[8px] font-black uppercase tracking-tighter shadow-sm cursor-grab active:cursor-grabbing hover:brightness-110 transition-all ${isFirstDay ? 'border-l-4 border-white/40' : 'opacity-80'}`}
                                style={{ backgroundColor: a.color || '#003057' }}
                              >
                                <div className="truncate">{isFirstDay || viewMode === 'week' ? a.projectName : '—'}</div>
                              </div>
                            );
                          })}

                          {dayLogs.map(l => (
                            <div
                              key={l.id}
                              className="p-1.5 rounded-lg border-2 border-dashed border-[#003057]/20 bg-white/50 text-[#003057] text-[8px] font-bold uppercase tracking-tighter"
                            >
                              <div className="truncate italic">Real: {l.projectName}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA NOVA ALOCAÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-[#001b31]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-[#003057] uppercase tracking-tighter mb-2">Novo Planejamento</h3>
            <p className="text-slate-400 text-xs font-bold uppercase mb-8">Recurso: <span className="text-[#003057]">{selectedUser?.name}</span></p>

            <form onSubmit={handleAddAlloc} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Projeto Relacionado</label>
                <select 
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#003057] outline-none font-bold text-slate-700"
                  value={newAlloc.projectId}
                  onChange={e => setNewAlloc({...newAlloc, projectId: e.target.value})}
                  required
                >
                  <option value="">Selecione...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Início</label>
                  <input 
                    type="date"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                    value={newAlloc.startDate}
                    onChange={e => setNewAlloc({...newAlloc, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duração (Dias)</label>
                  <input 
                    type="number"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                    value={newAlloc.duration}
                    onChange={e => setNewAlloc({...newAlloc, duration: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carga Horária Planejada (Horas/Dia)</label>
                <input 
                  type="number"
                  step="0.5"
                  className="w-full p-4 bg-[#003057] text-[#FFCD00] border-2 border-transparent rounded-2xl outline-none font-black text-2xl"
                  value={newAlloc.hoursPerDay}
                  onChange={e => setNewAlloc({...newAlloc, hoursPerDay: parseFloat(e.target.value)})}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-[#FFCD00] text-[#003057] font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-[#FFCD00]/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  Criar Alocação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManager;
