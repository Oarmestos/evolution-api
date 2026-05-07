import React, { useState } from 'react';
import { Bot, Cpu, Layers, MessageSquare, Share2, Sparkles, Plus, Check, ChevronRight, ArrowLeft, Brain, Wrench } from 'lucide-react';
import { cn } from '../utils/cn';

// ── Types ─────────────────────────────────────────────────────────────────────
type AgentType = 'openai' | 'dify' | 'typebot' | 'n8n' | 'evoai';

interface AgentForm {
  name: string;
  type: AgentType | '';
  role: string;
  objective: string;
  instructions: string;
  apiKey: string;
  model: string;
}

const AGENT_TYPES = [
  { id: 'openai', name: 'OpenAI', desc: 'GPT-4o y asistentes con IA nativa', color: '#10a37f', icon: Cpu },
  { id: 'dify', name: 'Dify.ai', desc: 'LLMOps para apps de IA', color: '#0052D9', icon: Layers },
  { id: 'typebot', name: 'Typebot', desc: 'Chatbots visuales sin código', color: '#FF8E21', icon: MessageSquare },
  { id: 'n8n', name: 'N8N', desc: 'Automatización con flujos', color: '#ea4b71', icon: Share2 },
  { id: 'evoai', name: 'EvoAI', desc: 'Agente nativo de Evolution', color: '#00f2ff', icon: Bot },
];

const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];

const STEPS = ['Nombre', 'Tipo', 'Papel', 'Instrucciones', 'Modelo', 'Listo'];

// ── Step Components ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              i < current ? 'bg-[#00ff88] text-black' :
              i === current ? 'bg-primary text-dark ring-2 ring-primary/30' :
              'bg-white/5 text-white/30 border border-white/10'
            )}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={cn('text-[9px] font-bold uppercase tracking-wider hidden sm:block',
              i === current ? 'text-white/70' : 'text-white/20'
            )}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('h-px flex-1 mb-4 transition-all', i < current ? 'bg-[#00ff88]/50' : 'bg-white/5')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Wizard Modal ──────────────────────────────────────────────────────────────
function CreateAgentWizard({ onClose, onCreated }: { onClose: () => void; onCreated: (a: AgentForm) => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AgentForm>({
    name: '', type: '', role: '', objective: '', instructions: '', apiKey: '', model: 'gpt-4o',
  });

  const set = (k: keyof AgentForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const canNext = [
    form.name.trim().length > 0,
    form.type !== '',
    true,
    form.instructions.length >= 10,
    form.apiKey.trim().length > 0 || form.type !== 'openai',
    true,
  ][step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="theme-overlay-card rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-white">Crear Nuevo Agente de IA</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white text-lg">✕</button>
          </div>
          <p className="text-[11px] text-white/30">Configuración rápida en pocos pasos</p>
        </div>

        <div className="p-6">
          <StepIndicator current={step} />

          {/* Step 0: Nombre */}
          {step === 0 && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Bot size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">Nombre del Agente</h3>
              <p className="text-sm text-white/40">Elige un nombre descriptivo para tu agente</p>
              <input
                autoFocus
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canNext && next()}
                placeholder="Ej: Asistente de Ventas"
                className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          )}

          {/* Step 1: Tipo */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">Tipo de Agente</h3>
                <p className="text-sm text-white/40">Selecciona el motor de IA</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {AGENT_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { set('type', t.id); }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        form.type === t.id
                          ? 'border-primary/50 bg-primary/5'
                          : 'theme-surface border-white/5 hover:border-white/10'
                      )}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.color + '20' }}>
                        <Icon size={16} style={{ color: t.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{t.name}</p>
                        <p className="text-[11px] text-white/40">{t.desc}</p>
                      </div>
                      {form.type === t.id && <Check size={16} className="text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Papel */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-white">Papel y Objetivo</h3>
                <p className="text-sm text-white/40">Define el rol principal del agente (opcional)</p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 block">Rol del Agente</label>
                <input
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                  placeholder="Ej: assistant, sales-agent, support..."
                  className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                />
                <p className="text-[11px] text-white/30 mt-1">¿Cuál es el papel o función de este agente?</p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 block">Objetivo Principal</label>
                <input
                  value={form.objective}
                  onChange={e => set('objective', e.target.value)}
                  placeholder="Ej: customer support, lead generation..."
                  className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                />
                <p className="text-[11px] text-white/30 mt-1">¿Cuál es el principal objetivo que este agente debe alcanzar?</p>
              </div>
            </div>
          )}

          {/* Step 3: Instrucciones */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-white">Instrucciones del Agente</h3>
                <p className="text-sm text-white/40">Describe cómo debe comportarse y responder</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/30">¿Qué hace tu agente? *</label>
                  <button
                    onClick={() => set('instructions', `Eres un asistente especializado en ${form.objective || 'atención al cliente'}. Ayuda a los usuarios de forma clara, amable y profesional. Siempre mantén un tono ${form.role === 'sales-agent' ? 'orientado a ventas' : 'servicial'} y responde en el idioma del usuario.`)}
                    className="text-[10px] font-bold text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <Sparkles size={11} /> Generar con IA
                  </button>
                </div>
                <textarea
                  value={form.instructions}
                  onChange={e => set('instructions', e.target.value)}
                  rows={5}
                  placeholder={`Ej: Eres un asistente especializado en ventas. Ayuda a los clientes a encontrar productos y responde dudas sobre pedidos. Sé siempre cordial, proactivo y enfocado en ofrecer la mejor experiencia al cliente.`}
                  className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all resize-none"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-[11px] text-white/30">Mínimo 10 caracteres — sé específico</p>
                  <span className="text-[11px] text-white/30">{form.instructions.length}/2000</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Modelo */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-white">Modelo de IA</h3>
                <p className="text-sm text-white/40">Elige la inteligencia artificial que alimentará tu agente</p>
              </div>
              {(form.type === 'openai' || form.type === 'evoai') && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-white/30">API Key *</label>
                      <span className="text-[10px] text-white/20">Clave de autenticación</span>
                    </div>
                    <input
                      type="password"
                      value={form.apiKey}
                      onChange={e => set('apiKey', e.target.value)}
                      placeholder="sk-..."
                      className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 block">Modelo de IA *</label>
                    <select
                      value={form.model}
                      onChange={e => set('model', e.target.value)}
                      className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none"
                    >
                      {OPENAI_MODELS.map(m => <option key={m} value={m} className="theme-surface">{m}</option>)}
                    </select>
                    <p className="text-[11px] text-white/30 mt-1">Modelos OpenAI disponibles</p>
                  </div>
                </>
              )}
              {(form.type === 'dify' || form.type === 'typebot' || form.type === 'n8n') && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 block">URL del Servicio *</label>
                  <input
                    value={form.apiKey}
                    onChange={e => set('apiKey', e.target.value)}
                    placeholder="https://tu-instancia.dify.ai/..."
                    className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                  />
                  <p className="text-[11px] text-white/30 mt-1">URL de tu instalación de {AGENT_TYPES.find(t => t.id === form.type)?.name}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Completado */}
          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-[#00ff88]/10 rounded-full flex items-center justify-center mx-auto">
                <Check size={28} className="text-[#00ff88]" />
              </div>
              <h3 className="text-lg font-bold text-white">¡Agente configurado!</h3>
              <p className="text-sm text-white/40">Revisa el resumen antes de crear</p>
              <div className="theme-surface rounded-xl p-4 text-left space-y-3">
                {[
                  { label: 'Nombre', value: form.name },
                  { label: 'Tipo', value: AGENT_TYPES.find(t => t.id === form.type)?.name || form.type },
                  { label: 'Rol', value: form.role || '—' },
                  { label: 'Objetivo', value: form.objective || '—' },
                  { label: 'Modelo', value: form.model },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-wider">{r.label}</span>
                    <span className="text-[13px] text-white/80 font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={back} className="theme-chip flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/10">
                <ArrowLeft size={15} /> Volver
              </button>
            )}
            {step < 5 ? (
              <button
                onClick={next}
                disabled={!canNext}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
                  canNext
                    ? 'bg-primary text-dark hover:bg-primary/90 shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                )}
              >
                Continuar <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => { onCreated(form); onClose(); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#00ff88] text-black hover:bg-[#00ff88]/90 shadow-[0_0_15px_rgba(0,255,136,0.25)] transition-all"
              >
                ✓ Crear Agente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
interface CreatedAgent {
  id: string;
  name: string;
  type: AgentType | '';
  model: string;
  active: boolean;
}

const FEATURES = [
  {
    icon: Brain,
    title: 'Maestría Multi-Modelo',
    color: '#00f2ff',
    items: ['Compatibilidad con OpenAI y Google Gemini', 'Modelos locales vía Ollama (próximamente)', 'Cambio automático entre modelos'],
  },
  {
    icon: Sparkles,
    title: 'RAG y Memoria',
    color: '#00ff88',
    items: ['Soporte vectorial vía Pinecone/Milvus', 'Memoria a corto y largo plazo', 'Inyección de contexto dinámico'],
  },
  {
    icon: Wrench,
    title: 'Herramientas MCP',
    color: '#a78bfa',
    items: ['Protocolo estandarizado (MCP)', 'Integración con APIs externas', 'Herramientas personalizadas para agentes'],
  },
];

export const AIAgents: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [agents, setAgents] = useState<CreatedAgent[]>([]);

  const handleCreated = (form: AgentForm) => {
    setAgents(prev => [...prev, {
      id: `agent-${Date.now()}`,
      name: form.name,
      type: form.type,
      model: form.model,
      active: true,
    }]);
  };

  const agentType = (type: AgentType | '') => AGENT_TYPES.find(t => t.id === type);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">IA & Agentes</h1>
          <p className="theme-muted text-sm font-medium">Conecta Avri con los mejores motores de inteligencia artificial</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="bg-primary text-dark font-bold px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.3)] group active:scale-95"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          Nuevo Agente de IA
        </button>
      </div>

      <div className="space-y-8">

          {/* Agent List or Empty State */}
          {agents.length === 0 ? (
            <div className="theme-surface border-dashed border-white/10 rounded-2xl py-16 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot size={28} className="text-white/20" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No tienes agentes activos</h3>
              <p className="text-sm text-white/40 max-w-xs mx-auto mb-6">
                Crea tu primer agente de IA y conéctalo a tus canales de WhatsApp en minutos.
              </p>
              <button
                onClick={() => setShowWizard(true)}
                className="px-6 py-3 bg-primary text-dark font-bold rounded-xl text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] inline-flex items-center gap-2"
              >
                <Plus size={16} /> Crear primer agente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map(agent => {
                const t = agentType(agent.type);
                const Icon = t?.icon || Bot;
                return (
                  <div key={agent.id} className="theme-surface rounded-2xl p-5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (t?.color || '#fff') + '20' }}>
                        <Icon size={18} style={{ color: t?.color || '#fff' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{agent.name}</p>
                        <p className="text-[11px] text-white/40">{t?.name}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 flex-shrink-0">
                        Live
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/30">Modelo</span>
                        <span className="text-white/70 font-mono">{agent.model}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/30">Tipo</span>
                        <span className="text-white/70">{t?.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => setShowWizard(true)}
                className="theme-surface border-dashed border-white/10 rounded-2xl p-5 flex items-center justify-center hover:border-white/20 hover:bg-white/[0.02] transition-all group"
              >
                <div className="text-center">
                  <div className="theme-chip w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 transition-colors">
                    <Plus size={18} className="text-white/30 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-white/40 group-hover:text-white/70 transition-colors">Nuevo Agente</p>
                </div>
              </button>
            </div>
          )}

          {/* Feature Cards */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
              <Sparkles size={12} /> Capacidades
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FEATURES.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="theme-surface rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: f.color + '20' }}>
                        <Icon size={15} style={{ color: f.color }} />
                      </div>
                      <h4 className="text-sm font-bold text-white">{f.title}</h4>
                    </div>
                    <ul className="space-y-2">
                      {f.items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-[12px] text-white/50">
                          <span style={{ color: f.color }} className="flex-shrink-0 mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      {showWizard && (
        <CreateAgentWizard onClose={() => setShowWizard(false)} onCreated={handleCreated} />
      )}
    </div>
  );
};
