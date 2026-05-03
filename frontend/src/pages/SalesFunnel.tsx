import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Users, X, Search, TrendingUp, DollarSign, Loader2, Zap } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useInstanceStore } from '../store/useInstanceStore';

// --- Types ---
type Lead = {
  id: string;
  name: string;
  value: number;
  tags?: string[];
  notes?: string;
  createdAt: string;
};

type Stage = {
  id: string;
  title: string;
  color: string;
  leads: Lead[];
};

const CHANNEL_OPTIONS = ['WhatsApp', 'Instagram', 'Facebook', 'Referido', 'Sitio Web', 'Otro'];

// --- Modal: Nuevo Lead ---
function NewLeadModal({ stages, onClose, onAdd }: {
  stages: Stage[];
  onClose: () => void;
  onAdd: (stageId: string, lead: Lead) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    value: '',
    stageId: stages[0]?.id || '',
    channel: 'WhatsApp',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: form.name,
      value: parseFloat(form.value) || 0,
      tags: [form.channel],
      notes: form.notes,
      createdAt: 'Ahora',
    };
    onAdd(form.stageId, newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="theme-overlay-card rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users size={16} />
            </div>
            <h2 className="text-base font-bold text-white">Nuevo Lead</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Nombre del Prospecto *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. María González"
              required
              className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Valor estimado ($)</label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="0.00"
                className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Canal origen</label>
              <select
                value={form.channel}
                onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none"
              >
                {CHANNEL_OPTIONS.map(ch => (
                  <option key={ch} value={ch} className="bg-[#111113]">{ch}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Etapa inicial</label>
            <div className="grid grid-cols-3 gap-2">
              {stages.map(stage => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, stageId: stage.id }))}
                  className={`py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${
                    form.stageId === stage.id ? 'text-white' : 'border-white/10 text-white/40'
                  }`}
                  style={form.stageId === stage.id ? { borderColor: stage.color, backgroundColor: stage.color + '15' } : {}}
                >
                  {stage.title}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="theme-chip flex-1 py-3 rounded-xl text-sm">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-primary text-dark font-bold rounded-xl text-sm shadow-[0_0_15px_rgba(0,242,255,0.2)]">Crear Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Main Component ---
const SalesFunnel: React.FC = () => {
  const { instances, fetchInstances } = useInstanceStore();
  const activeInstance = instances[0];
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('avri_token');

  const loadData = async () => {
    if (!activeInstance || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`/lead/funnels/${activeInstance.instanceName}`, {
        headers: { apikey: token }
      });
      const funnel = res.data[0];
      if (funnel && funnel.Stages) {
        const normalizedStages: Stage[] = funnel.Stages.map((s: any) => ({
          id: s.id,
          title: s.name,
          color: s.color || '#3b82f6',
          leads: (s.Leads || []).map((l: any) => ({
            id: l.id,
            name: l.Contact?.pushName || l.Contact?.remoteJid?.split('@')[0] || 'Sin Nombre',
            value: l.value || 0,
            tags: l.Contact?.remoteJid ? ['WhatsApp'] : [],
            notes: l.notes,
            createdAt: new Date(l.createdAt).toLocaleDateString(),
          })),
        }));
        setStages(normalizedStages);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instances.length === 0) {
      fetchInstances();
    } else {
      loadData();
    }
  }, [instances.length]);

  useEffect(() => {
    if (!activeInstance || !token) return;
    const socket = io('/', { transports: ['websocket'], query: { token } });
    socket.on('connect', () => socket.emit('join', activeInstance.instanceName));
    socket.on('lead.created', () => loadData());
    socket.on('lead.updated', () => loadData());
    return () => { socket.disconnect(); };
  }, [activeInstance?.instanceName]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = stages.flatMap(s => s.leads).find(l => l.id === active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    const sourceStage = stages.find(s => s.leads.some(l => l.id === leadId));
    const targetStage = stages.find(s => s.id === overId || s.leads.some(l => l.id === overId));

    if (sourceStage && targetStage && sourceStage.id !== targetStage.id) {
      const lead = sourceStage.leads.find(l => l.id === leadId)!;
      setStages(prev => prev.map(s => {
        if (s.id === sourceStage.id) return { ...s, leads: s.leads.filter(l => l.id !== leadId) };
        if (s.id === targetStage.id) return { ...s, leads: [...s.leads, lead] };
        return s;
      }));

      try {
        await axios.post(`/lead/move/${activeInstance.instanceName}`, { leadId, stageId: targetStage.id }, {
          headers: { apikey: token }
        });
      } catch (err) {
        console.error('Error moving lead:', err);
        loadData();
      }
    }
  };

  const handleAddLead = async (stageId: string, lead: Lead) => {
    if (!activeInstance) return;
    try {
      await axios.post(`/lead/create/${activeInstance.instanceName}`, {
        contactId: 'placeholder', 
        stageId,
        value: lead.value,
        notes: lead.notes
      }, {
        headers: { apikey: token }
      });
      loadData();
    } catch (err) {
      console.error('Error creating lead:', err);
    }
  };

  const filteredStages = useMemo(() => {
    if (!searchQuery.trim()) return stages;
    return stages.map(s => ({
      ...s,
      leads: s.leads.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }));
  }, [stages, searchQuery]);

  if (loading && stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Cargando...</p>
      </div>
    );
  }

  if (!activeInstance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Zap className="w-12 h-12 text-primary/20" />
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">No hay instancias activas</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Embudo de Ventas</h1>
          <p className="theme-muted text-sm font-medium">Gestiona tus leads y oportunidades en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar leads..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="theme-input pl-11 pr-4 py-3 rounded-2xl w-64 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="flex items-center gap-2 bg-primary text-dark font-black px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 uppercase text-xs tracking-widest"
          >
            <Plus size={18} /> Nuevo Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Leads Totales', value: stages.reduce((acc, s) => acc + s.leads.length, 0), icon: Users, color: 'text-primary' },
          { label: 'Valor Total', value: `$${stages.reduce((acc, s) => acc + s.leads.reduce((lacc, l) => lacc + l.value, 0), 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
          { label: 'Tasa Conversión', value: '12.5%', icon: TrendingUp, color: 'text-purple-400' },
          { label: 'Tiempo Promedio', value: '3.5 días', icon: Loader2, color: 'text-orange-400' },
        ].map((stat, i) => (
          <div key={i} className="theme-surface p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={64} />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide min-h-[600px]">
          <SortableContext items={filteredStages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
            {filteredStages.map(stage => (
              <div key={stage.id} className="flex-shrink-0 w-80">
                <div className="mb-4 flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h3 className="font-black text-white uppercase tracking-wider text-xs">{stage.title}</h3>
                    <span className="theme-chip px-2 py-0.5 rounded-full text-[10px] font-bold text-white/40">
                      {stage.leads.length}
                    </span>
                  </div>
                </div>

                <div className="theme-surface/30 rounded-3xl p-3 border border-white/5 min-h-[500px] flex flex-col gap-3">
                  <SortableContext items={stage.leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {stage.leads.map(lead => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                  </SortableContext>
                </div>
              </div>
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {showNewLeadModal && (
        <NewLeadModal
          stages={stages}
          onClose={() => setShowNewLeadModal(false)}
          onAdd={handleAddLead}
        />
      )}
    </div>
  );
};

function LeadCard({ lead, isOverlay }: { lead: Lead; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'Lead', lead },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "theme-surface p-4 rounded-2xl border border-white/5 cursor-grab active:cursor-grabbing group hover:border-white/20 transition-all",
        isOverlay && "rotate-2 scale-105 shadow-2xl border-primary/50"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{lead.name}</h4>
        <p className="text-xs font-black text-primary">${lead.value.toLocaleString()}</p>
      </div>
      
      {lead.notes && (
        <p className="text-[11px] text-white/40 mb-4 line-clamp-2 leading-relaxed">{lead.notes}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {lead.tags?.map(tag => (
            <span key={tag} className="text-[9px] font-black px-2 py-1 rounded-lg bg-white/5 text-white/40 uppercase tracking-tighter">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-[9px] font-bold text-white/20">{lead.createdAt}</span>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default SalesFunnel;
