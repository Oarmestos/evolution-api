import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Settings2, Users, X, Trash2, GripVertical, Search, TrendingUp, DollarSign, Filter } from 'lucide-react';
import React, { useState, useMemo } from 'react';

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

// --- Mock Data ---
const initialStages: Stage[] = [
  {
    id: 'stage-1',
    title: 'Nuevos',
    color: '#00ff88',
    leads: [
      { id: 'lead-1', name: 'Maria Gonzalez', value: 150, tags: ['Instagram'], createdAt: 'Hace 2 horas' },
      { id: 'lead-2', name: 'Juan Perez', value: 300, tags: ['WhatsApp'], createdAt: 'Hace 5 horas' },
    ],
  },
  {
    id: 'stage-2',
    title: 'En Negociación',
    color: '#fbbf24',
    leads: [
      { id: 'lead-3', name: 'Carlos Ruiz', value: 500, tags: ['Facebook'], createdAt: 'Ayer' },
    ],
  },
  {
    id: 'stage-3',
    title: 'Ganados',
    color: '#3b82f6',
    leads: [
      { id: 'lead-4', name: 'Ana Silva', value: 1200, tags: ['Referido'], createdAt: 'Hace 3 días' },
    ],
  },
];

const STAGE_COLORS = ['#00ff88', '#fbbf24', '#3b82f6', '#f87171', '#a78bfa', '#fb923c', '#34d399', '#f472b6'];
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
        className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
              Nombre del Prospecto *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. María González"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
                Valor estimado ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
                Canal origen
              </label>
              <select
                value={form.channel}
                onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all appearance-none"
              >
                {CHANNEL_OPTIONS.map(ch => (
                  <option key={ch} value={ch} className="bg-[#111113]">{ch}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
              Etapa inicial
            </label>
            <div className="grid grid-cols-3 gap-2">
              {stages.map(stage => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, stageId: stage.id }))}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    form.stageId === stage.id
                      ? 'border-current text-white'
                      : 'border-white/10 text-white/50 hover:border-white/20'
                  }`}
                  style={form.stageId === stage.id ? { borderColor: stage.color, color: stage.color, backgroundColor: stage.color + '15' } : {}}
                >
                  {stage.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Información adicional sobre este prospecto..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/70 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-primary text-dark font-bold rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(0,242,255,0.2)]"
            >
              Crear Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Modal: Configurar Embudo ---
function ConfigurarEmbudoModal({ stages, onClose, onSave }: {
  stages: Stage[];
  onClose: () => void;
  onSave: (newStages: Stage[]) => void;
}) {
  const [localStages, setLocalStages] = useState<Stage[]>(stages.map(s => ({ ...s })));
  const [newStageName, setNewStageName] = useState('');
  const [selectedColor, setSelectedColor] = useState(STAGE_COLORS[0]);

  const addStage = () => {
    if (!newStageName.trim()) return;
    const newStage: Stage = {
      id: `stage-${Date.now()}`,
      title: newStageName.trim(),
      color: selectedColor,
      leads: [],
    };
    setLocalStages(s => [...s, newStage]);
    setNewStageName('');
    setSelectedColor(STAGE_COLORS[0]);
  };

  const removeStage = (id: string) => {
    setLocalStages(s => s.filter(st => st.id !== id));
  };

  const renameStage = (id: string, title: string) => {
    setLocalStages(s => s.map(st => st.id === id ? { ...st, title } : st));
  };

  const changeColor = (id: string, color: string) => {
    setLocalStages(s => s.map(st => st.id === id ? { ...st, color } : st));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-lg mx-4 shadow-2xl shadow-black/50 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
              <Settings2 size={16} />
            </div>
            <h2 className="text-base font-bold text-white">Configurar Embudo</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Existing stages */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Etapas actuales</p>
            <div className="space-y-2">
              {localStages.map(stage => (
                <div key={stage.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                  <GripVertical size={16} className="text-white/20 flex-shrink-0" />
                  
                  {/* Color picker */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {STAGE_COLORS.slice(0, 4).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => changeColor(stage.id, color)}
                        className="w-4 h-4 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          boxShadow: stage.color === color ? `0 0 8px ${color}` : undefined,
                          outline: stage.color === color ? `2px solid ${color}` : undefined,
                          outlineOffset: '1px',
                        }}
                      />
                    ))}
                  </div>

                  {/* Name input */}
                  <input
                    type="text"
                    value={stage.title}
                    onChange={e => renameStage(stage.id, e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none border-b border-transparent focus:border-white/20 transition-colors py-0.5"
                  />

                  <span className="text-[10px] text-white/30 flex-shrink-0">{stage.leads.length} leads</span>

                  <button
                    onClick={() => removeStage(stage.id)}
                    className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add new stage */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Nueva etapa</p>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addStage()}
                placeholder="Nombre de la etapa..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-all"
              />
              <div>
                <p className="text-[10px] text-white/30 mb-2">Color</p>
                <div className="flex gap-2">
                  {STAGE_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        boxShadow: selectedColor === color ? `0 0 10px ${color}` : undefined,
                        outline: selectedColor === color ? `2px solid ${color}` : undefined,
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={addStage}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/80 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Agregar Etapa
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex-shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/70 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onSave(localStages); onClose(); }}
            className="flex-1 py-3 bg-primary text-dark font-bold rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(0,242,255,0.2)]"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Lead Card ---
function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: 'Lead', lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[#121214] p-4 rounded-xl border border-white/5 cursor-grab active:cursor-grabbing hover:border-white/10 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-white/90 text-sm">{lead.name}</h4>
        <span className="text-[10px] text-white/30 flex-shrink-0 ml-2">{lead.createdAt}</span>
      </div>
      <div className="text-sm text-primary font-bold mb-3">
        ${lead.value.toFixed(2)}
      </div>
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {lead.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-white/50 text-[10px] uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Stage Column ---
function StageColumn({ stage }: { stage: Stage }) {
  const { setNodeRef } = useSortable({
    id: stage.id,
    data: { type: 'Stage', stage },
  });

  return (
    <div className="flex flex-col flex-shrink-0 w-72 bg-[#0d0d0f] border border-white/5 rounded-2xl overflow-hidden" style={{ maxHeight: 'calc(100vh - 130px)' }}>
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0d0d0f]">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: stage.color, boxShadow: `0 0 8px ${stage.color}80` }}
          />
          <h3 className="font-semibold text-white/90 text-sm">{stage.title}</h3>
          <span className="bg-white/10 text-white/50 text-[10px] px-2 py-0.5 rounded-full">
            {stage.leads.length}
          </span>
        </div>
        <button className="text-white/30 hover:text-white/70 transition-colors">
          <Plus size={15} />
        </button>
      </div>

      <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        <SortableContext items={stage.leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {stage.leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {stage.leads.length === 0 && (
          <div className="h-20 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center">
            <p className="text-[11px] text-white/20">Arrastra un lead aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---
export default function SalesFunnel() {
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState('Todos');
  const [filterMinValue, setFilterMinValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { data } = event.active;
    if (data.current?.type === 'Lead') setActiveLead(data.current.lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id;
    const overId = over.id;

    let sourceStage: Stage | undefined;
    let destStage: Stage | undefined;

    for (const stage of stages) {
      if (stage.leads.some(l => l.id === activeId)) sourceStage = stage;
      if (stage.id === overId || stage.leads.some(l => l.id === overId)) destStage = stage;
    }

    if (!sourceStage || !destStage) return;

    setStages(prev => {
      const newStages = [...prev];
      const sourceIdx = newStages.findIndex(s => s.id === sourceStage!.id);
      const destIdx = newStages.findIndex(s => s.id === destStage!.id);
      const sourceLeads = [...newStages[sourceIdx].leads];
      const destLeads = sourceIdx === destIdx ? sourceLeads : [...newStages[destIdx].leads];
      const activeLeadIdx = sourceLeads.findIndex(l => l.id === activeId);
      const activeLeadObj = sourceLeads[activeLeadIdx];
      sourceLeads.splice(activeLeadIdx, 1);

      if (sourceIdx === destIdx) {
        const overLeadIdx = destLeads.findIndex(l => l.id === overId);
        destLeads.splice(overLeadIdx, 0, activeLeadObj);
        newStages[sourceIdx] = { ...newStages[sourceIdx], leads: destLeads };
      } else {
        let overLeadIdx = destLeads.findIndex(l => l.id === overId);
        if (overLeadIdx === -1) overLeadIdx = destLeads.length;
        destLeads.splice(overLeadIdx, 0, activeLeadObj);
        newStages[sourceIdx] = { ...newStages[sourceIdx], leads: sourceLeads };
        newStages[destIdx] = { ...newStages[destIdx], leads: destLeads };
      }
      return newStages;
    });
  };

  const handleAddLead = (stageId: string, lead: Lead) => {
    setStages(prev => prev.map(s =>
      s.id === stageId ? { ...s, leads: [lead, ...s.leads] } : s
    ));
  };

  const handleSaveConfig = (newStages: Stage[]) => {
    setStages(newStages.map(ns => {
      const existing = stages.find(s => s.id === ns.id);
      return existing ? { ...ns, leads: existing.leads } : ns;
    }));
  };

  // --- Métricas ---
  const allLeads = useMemo(() => stages.flatMap(s => s.leads), [stages]);
  const totalValue = useMemo(() => allLeads.reduce((acc, l) => acc + l.value, 0), [allLeads]);
  const lastStageLeads = stages[stages.length - 1]?.leads.length ?? 0;
  const conversionRate = allLeads.length > 0 ? Math.round((lastStageLeads / allLeads.length) * 100) : 0;
  const avgValue = allLeads.length > 0 ? totalValue / allLeads.length : 0;

  // --- Filtros aplicados ---
  const filteredStages = useMemo(() => {
    return stages.map(stage => ({
      ...stage,
      leads: stage.leads.filter(lead => {
        const matchName = lead.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchChannel = filterChannel === 'Todos' || (lead.tags || []).includes(filterChannel);
        const matchValue = !filterMinValue || lead.value >= parseFloat(filterMinValue);
        return matchName && matchChannel && matchValue;
      }),
    }));
  }, [stages, searchQuery, filterChannel, filterMinValue]);

  const activeFilters = searchQuery || filterChannel !== 'Todos' || filterMinValue;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Action Bar */}
      <div className="flex-shrink-0 border-b border-white/5 flex items-center justify-between px-6 py-4 bg-[#0a0a0b]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Ventas & Leads</h1>
            <p className="text-[11px] text-white/30">{stages.reduce((a, s) => a + s.leads.length, 0)} prospectos activos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfig(true)}
            className="h-9 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-colors flex items-center gap-2"
          >
            <Settings2 size={16} />
            <span>Configurar Embudo</span>
          </button>
          <button
            onClick={() => setShowNewLead(true)}
            className="h-9 px-4 bg-primary text-dark font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,242,255,0.25)]"
          >
            <Plus size={16} />
            <span>Nuevo Lead</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/5 bg-[#080809]">
        {[
          { label: 'Total Leads', value: allLeads.length.toString(), sub: 'prospectos', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Ingresos Potenciales', value: `$${totalValue.toLocaleString()}`, sub: 'valor estimado', icon: DollarSign, color: 'text-[#00ff88]', bg: 'bg-[#00ff88]/10' },
          { label: 'Tasa de Cierre', value: `${conversionRate}%`, sub: `${lastStageLeads} ganados`, icon: TrendingUp, color: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/10' },
          { label: 'Valor Promedio', value: `$${avgValue.toFixed(0)}`, sub: 'por lead', icon: DollarSign, color: 'text-secondary', bg: 'bg-secondary/10' },
        ].map(m => (
          <div key={m.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center flex-shrink-0`}>
              <m.icon size={16} className={m.color} />
            </div>
            <div>
              <p className={`text-lg font-bold leading-tight ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 border-b border-white/5 bg-[#0a0a0b]">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar prospecto..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-white/30" />
          <select
            value={filterChannel}
            onChange={e => setFilterChannel(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-primary/40 transition-colors appearance-none"
          >
            {['Todos', ...CHANNEL_OPTIONS].map(ch => (
              <option key={ch} value={ch} className="bg-[#111113]">{ch}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="number"
            value={filterMinValue}
            onChange={e => setFilterMinValue(e.target.value)}
            placeholder="Valor mín."
            className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40 transition-colors w-32"
          />
        </div>
        {activeFilters && (
          <button
            onClick={() => { setSearchQuery(''); setFilterChannel('Todos'); setFilterMinValue(''); }}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-white/50 hover:text-white border border-white/10 rounded-lg transition-colors"
          >
            <X size={12} /> Limpiar
          </button>
        )}
        <span className="text-[11px] text-white/30 ml-auto">
          {filteredStages.reduce((a, s) => a + s.leads.length, 0)} resultados
        </span>
      </div>

      {/* Kanban Board */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 h-full">
            <SortableContext items={filteredStages.map(s => s.id)} strategy={horizontalListSortingStrategy}>
              {filteredStages.map(stage => (
                <StageColumn key={stage.id} stage={stage} />
              ))}
            </SortableContext>
          </div>
          <DragOverlay>
            {activeLead ? <LeadCard lead={activeLead} /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Modals */}
      {showNewLead && (
        <NewLeadModal
          stages={stages}
          onClose={() => setShowNewLead(false)}
          onAdd={handleAddLead}
        />
      )}
      {showConfig && (
        <ConfigurarEmbudoModal
          stages={stages}
          onClose={() => setShowConfig(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
}
