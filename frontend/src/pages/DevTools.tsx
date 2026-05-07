import { useState } from 'react';
import { Code2, Copy, Check, ChevronDown, ChevronRight, Zap, Users, MessageSquare, Key, Globe, Play } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────
type Lang = 'curl' | 'nodejs' | 'python';
type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface Endpoint {
  method: Method;
  path: string;
  description: string;
  body?: object;
  response: object;
  snippets: Record<Lang, string>;
}

interface Module {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  endpoints: Endpoint[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const METHOD_COLORS: Record<Method, string> = {
  GET:    'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30',
  POST:   'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30',
  PATCH:  'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30',
  DELETE: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

function buildSnippets(method: Method, path: string, body?: object): Record<Lang, string> {
  const BASE = 'https://api.avri.app';
  const hasBody = body && method !== 'GET';
  const bodyJson = hasBody ? JSON.stringify(body, null, 2) : null;

  return {
    curl: [
      `curl --request ${method} \\`,
      `  --url ${BASE}${path} \\`,
      `  --header 'Content-Type: application/json' \\`,
      `  --header 'apikey: <tu-api-key>'` + (bodyJson ? ` \\\n  --data '${bodyJson}'` : ''),
    ].join('\n'),

    nodejs: [
      `import AvriClient from '@avri/sdk'; // npm install @avri/sdk`,
      ``,
      `const client = new AvriClient({ apiKey: process.env.AVRI_API_KEY });`,
      ``,
      `const response = await client${path.replace(/\/[^/]+\/([^/]+)(\/.*)?$/, '.$1')}(${hasBody ? JSON.stringify(body, null, 2) : ''});`,
      `console.log(response);`,
    ].join('\n'),

    python: [
      `from avri import AvriClient  # pip install avri-sdk`,
      ``,
      `client = AvriClient(api_key=os.environ['AVRI_API_KEY'])`,
      ``,
      `response = client${path.replace(/\/[^/]+\/([^/]+)(\/.*)?$/, '.$1')}(${hasBody ? JSON.stringify(body) : ''})`,
      `print(response)`,
    ].join('\n'),
  };
}

// ─── API Modules Data ─────────────────────────────────────────────────────────
const API_MODULES: Module[] = [
  {
    id: 'leads',
    label: 'Ventas & Leads',
    icon: Users,
    color: '#00ff88',
    endpoints: [
      {
        method: 'POST',
        path: '/{instance}/lead/funnel',
        description: 'Crea un nuevo embudo de ventas para la instancia.',
        body: { name: 'Clientes WhatsApp', description: 'Embudo principal de ventas' },
        response: { id: 'uuid', name: 'Clientes WhatsApp', instanceId: 'uuid', createdAt: '2024-01-01T00:00:00Z' },
        snippets: buildSnippets('POST', '/{instance}/lead/funnel', { name: 'Clientes WhatsApp', description: 'Embudo principal' }),
      },
      {
        method: 'GET',
        path: '/{instance}/lead/funnels',
        description: 'Lista todos los embudos de la instancia.',
        response: [{ id: 'uuid', name: 'Clientes WhatsApp', stages: [] }],
        snippets: buildSnippets('GET', '/{instance}/lead/funnels'),
      },
      {
        method: 'POST',
        path: '/{instance}/lead/stage',
        description: 'Crea una etapa dentro de un embudo existente.',
        body: { name: 'Nuevos', color: '#00ff88', order: 1, funnelId: 'uuid' },
        response: { id: 'uuid', name: 'Nuevos', color: '#00ff88', order: 1, funnelId: 'uuid' },
        snippets: buildSnippets('POST', '/{instance}/lead/stage', { name: 'Nuevos', color: '#00ff88', order: 1, funnelId: 'uuid' }),
      },
      {
        method: 'POST',
        path: '/{instance}/lead',
        description: 'Crea un nuevo prospecto (lead) y lo asigna a una etapa.',
        body: { contactId: 'uuid', stageId: 'uuid', value: 500, notes: 'Interesado en plan Pro' },
        response: { id: 'uuid', value: 500, stageId: 'uuid', contactId: 'uuid', createdAt: '2024-01-01T00:00:00Z' },
        snippets: buildSnippets('POST', '/{instance}/lead', { contactId: 'uuid', stageId: 'uuid', value: 500 }),
      },
      {
        method: 'PATCH',
        path: '/{instance}/lead/move/{id}',
        description: 'Mueve un lead a una etapa diferente del embudo.',
        body: { newStageId: 'uuid-de-la-nueva-etapa' },
        response: { id: 'uuid', stageId: 'uuid-de-la-nueva-etapa', updatedAt: '2024-01-01T00:00:00Z' },
        snippets: buildSnippets('PATCH', '/{instance}/lead/move/{id}', { newStageId: 'uuid' }),
      },
    ],
  },
  {
    id: 'instances',
    label: 'Instancias',
    icon: Zap,
    color: '#00f2ff',
    endpoints: [
      {
        method: 'POST',
        path: '/instance/create',
        description: 'Crea una nueva instancia de WhatsApp.',
        body: { instanceName: 'mi-negocio', token: 'optional-token', qrcode: true },
        response: { instance: { instanceName: 'mi-negocio', status: 'created' }, hash: { apikey: 'generated-key' } },
        snippets: buildSnippets('POST', '/instance/create', { instanceName: 'mi-negocio', qrcode: true }),
      },
      {
        method: 'GET',
        path: '/instance/fetchInstances',
        description: 'Lista todas las instancias disponibles.',
        response: [{ id: 'uuid', name: 'mi-negocio', connectionStatus: 'open' }],
        snippets: buildSnippets('GET', '/instance/fetchInstances'),
      },
      {
        method: 'DELETE',
        path: '/instance/{instanceName}/deleteInstance',
        description: 'Elimina una instancia y desconecta WhatsApp.',
        response: { deleted: true, instanceName: 'mi-negocio' },
        snippets: buildSnippets('DELETE', '/instance/{instanceName}/deleteInstance'),
      },
    ],
  },
  {
    id: 'messages',
    label: 'Mensajes',
    icon: MessageSquare,
    color: '#7000ff',
    endpoints: [
      {
        method: 'POST',
        path: '/message/sendText/{instanceName}',
        description: 'Envía un mensaje de texto a un número de WhatsApp.',
        body: { number: '5491123456789', text: 'Hola, ¿en qué puedo ayudarte?' },
        response: { key: { id: 'msg-uuid', remoteJid: '5491123456789@s.whatsapp.net' }, message: { conversation: 'Hola...' } },
        snippets: buildSnippets('POST', '/message/sendText/{instanceName}', { number: '5491123456789', text: 'Hola!' }),
      },
      {
        method: 'POST',
        path: '/message/sendMedia/{instanceName}',
        description: 'Envía imagen, audio, video o documento.',
        body: { number: '5491123456789', mediatype: 'image', media: 'https://url-de-imagen.com/foto.jpg', caption: 'Mira esto!' },
        response: { key: { id: 'msg-uuid' }, status: 'SERVER_ACK' },
        snippets: buildSnippets('POST', '/message/sendMedia/{instanceName}', { number: '5491123456789', mediatype: 'image', media: 'https://...' }),
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all text-[11px] font-semibold">
      {copied ? <><Check size={12} className="text-[#00ff88]" /> Copiado</> : <><Copy size={12} /> Copiar</>}
    </button>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative bg-[#080809] rounded-xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-[12px] text-white/80 overflow-x-auto leading-relaxed font-mono custom-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EndpointCard({ endpoint, baseUrl }: { endpoint: Endpoint; baseUrl: string }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('curl');

  const LANGS: { key: Lang; label: string }[] = [
    { key: 'curl', label: 'cURL' },
    { key: 'nodejs', label: 'Node.js' },
    { key: 'python', label: 'Python' },
  ];

  const displaySnippet = endpoint.snippets[lang].replace('https://api.avri.app', baseUrl);

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.02] hover:border-white/10 transition-colors">
      <button
        className="w-full flex items-center gap-4 p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex-shrink-0 ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm text-white/80 font-mono flex-1">{endpoint.path}</code>
        <span className="text-[12px] text-white/40 hidden md:block">{endpoint.description}</span>
        {open ? <ChevronDown size={16} className="text-white/30 flex-shrink-0" /> : <ChevronRight size={16} className="text-white/30 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          <p className="text-sm text-white/60">{endpoint.description}</p>

          {/* Lang switcher */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 w-fit">
            {LANGS.map(l => (
              <button
                key={l.key}
                onClick={() => setLang(l.key)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  lang === l.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <CodeBlock code={displaySnippet} lang={lang === 'curl' ? 'bash' : lang === 'nodejs' ? 'typescript' : 'python'} />

          {/* Response example */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Respuesta de ejemplo</p>
            <CodeBlock code={JSON.stringify(endpoint.response, null, 2)} lang="json" />
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleSection({ module, baseUrl }: { module: Module; baseUrl: string }) {
  const [open, setOpen] = useState(module.id === 'leads');
  const Icon = module.icon;

  return (
    <div className="space-y-2">
      <button
        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-white/[0.03] transition-colors group"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: module.color + '20' }}>
          <Icon size={14} style={{ color: module.color }} />
        </div>
        <h2 className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{module.label}</h2>
        <span className="text-[10px] text-white/30 ml-1">{module.endpoints.length} endpoints</span>
        <div className="ml-auto">
          {open ? <ChevronDown size={15} className="text-white/30" /> : <ChevronRight size={15} className="text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="space-y-2 pl-4">
          {module.endpoints.map((ep, i) => (
            <EndpointCard key={i} endpoint={ep} baseUrl={baseUrl} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const DevTools: React.FC = () => {
  const { user } = useAuthStore();
  const [baseUrl, setBaseUrl] = useState('http://localhost:8080');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const apiKey = (user as any)?.apiKey || 'your-api-key-here';

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">API Reference</h1>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[9px] font-black uppercase tracking-widest">v2.3.7</span>
              <span className="px-2 py-0.5 bg-white/5 text-white/40 border border-white/10 rounded-md text-[9px] font-black uppercase tracking-widest">REST / JSON</span>
            </div>
          </div>
          <p className="theme-muted text-sm font-medium">Todo lo que ves en la UI está disponible via API</p>
        </div>
      </div>

      <div className="space-y-8">

          {/* Config Bar */}
          <div className="theme-surface rounded-2xl p-5 space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/40">Configuración</h3>

            {/* Base URL */}
            <div className="flex items-center gap-3">
              <Globe size={14} className="text-white/30 flex-shrink-0" />
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] text-white/40 w-20">Base URL</span>
                <div className="flex gap-2">
                  {['http://localhost:8080', 'https://api.avri.app'].map(url => (
                    <button
                      key={url}
                      onClick={() => setBaseUrl(url)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        baseUrl === url
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'theme-chip border-white/5 hover:border-white/10'
                      }`}
                    >
                      {url.includes('localhost') ? '🏠 Local' : '🌐 Producción'}
                    </button>
                  ))}
                </div>
                <code className="text-[11px] text-white/40 font-mono">{baseUrl}</code>
              </div>
            </div>

            {/* API Key */}
            <div className="flex items-center gap-3">
              <Key size={14} className="text-white/30 flex-shrink-0" />
              <span className="text-[11px] text-white/40 w-20">API Key</span>
              <div className="theme-input flex-1 flex items-center gap-2 rounded-xl px-4 py-2">
                <code className="flex-1 text-[12px] font-mono text-white/70">
                  {showKey ? apiKey : '•'.repeat(32)}
                </code>
                <button
                  onClick={() => setShowKey(s => !s)}
                  className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                >
                  {showKey ? 'Ocultar' : 'Mostrar'}
                </button>
                <button
                  onClick={copyKey}
                  className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
                >
                  {copiedKey ? <Check size={12} className="text-[#00ff88]" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div className="theme-surface rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Play size={14} className="text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white/40">Inicio rápido</h3>
            </div>
            <p className="text-sm text-white/50">
              Todas las peticiones deben incluir el header <code className="bg-white/10 px-1.5 py-0.5 rounded text-primary text-[11px]">apikey</code> con tu clave de API.
              Los recursos están organizados por <code className="bg-white/10 px-1.5 py-0.5 rounded text-white/70 text-[11px]">{'/{instanceName}/recurso'}</code>.
            </p>
            <CodeBlock
              lang="bash"
              code={`# Verifica tu conexión\ncurl --request GET \\\n  --url ${baseUrl}/instance/fetchInstances \\\n  --header 'apikey: ${apiKey}'`}
            />
          </div>

          {/* Modules */}
          <div className="theme-surface rounded-2xl p-5 space-y-1">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-4">Endpoints</h3>
            {API_MODULES.map(module => (
              <ModuleSection key={module.id} module={module} baseUrl={baseUrl} />
            ))}
          </div>

          {/* SDK Note */}
          <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Code2 size={15} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">SDK Oficial (próximamente)</h3>
                <p className="text-[13px] text-white/50 leading-relaxed">
                  Estamos desarrollando SDKs oficiales con tipado completo para{' '}
                  <span className="text-white/80 font-medium">Node.js / TypeScript</span>,{' '}
                  <span className="text-white/80 font-medium">Python 3.10+</span> y{' '}
                  <span className="text-white/80 font-medium">Go</span>.{' '}
                  Mientras tanto, todos los endpoints están disponibles via REST con los snippets de código arriba.
                </p>
                <div className="flex gap-2 mt-3">
                  {['npm install @avri/sdk', 'pip install avri-sdk', 'go get avri.app/sdk'].map(cmd => (
                    <code key={cmd} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white/50 font-mono">
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
