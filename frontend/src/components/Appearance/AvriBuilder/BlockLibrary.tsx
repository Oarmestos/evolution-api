import React from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import type { Block } from '../../../store/useAvriBuilderStore';
import { Video as VideoIcon, MapPin, Smile, Menu, ClipboardList, CheckSquare } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { toCSSValue } from '../../../utils/toCSSValue';
import { getBlockStyles } from './utils/getBlockStyles';

/**
 * Smartly converts a value to a CSS string with units if necessary
 */
// toCSSValue moved to shared utils

// getBlockStyles moved to separate utility for HMR compatibility

export interface LibraryProps {
  block: Block;
  Renderer: React.FC<{ block: Block }>;
  readOnly?: boolean;
}

export const Container: React.FC<LibraryProps> = ({ block, Renderer }) => (
  <div style={getBlockStyles(block)} className="transition-all">
    {block.children?.length === 0 ? (
      <div className="flex items-center justify-center h-20 w-full text-gray-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200 rounded-xl">
        Contenedor Vacío
      </div>
    ) : (
      block.children?.map(child => <Renderer key={child.id} block={child} />)
    )}
  </div>
);

export const Heading: React.FC<LibraryProps> = ({ block }) => (
  <h2 style={getBlockStyles(block)} className="transition-all leading-tight">
    {block.props.text || 'Título'}
  </h2>
);

export const Text: React.FC<LibraryProps> = ({ block }) => (
  <p style={getBlockStyles(block)} className="transition-all">
    {block.props.text || 'Tu texto aquí'}
  </p>
);

export const Button: React.FC<LibraryProps> = ({ block }) => (
  <button 
    style={getBlockStyles(block)} 
    className="transition-all active:scale-95 flex items-center justify-center"
  >
    {block.props.text || 'Botón'}
  </button>
);

export const Image: React.FC<LibraryProps> = ({ block }) => (
  <img 
    src={block.props.src || 'https://via.placeholder.com/400x300?text=Avri+Luxury'} 
    alt={block.props.alt}
    style={getBlockStyles(block)}
    className="max-w-full h-auto transition-all"
  />
);

export const Divider: React.FC<LibraryProps> = ({ block }) => (
  <div 
    style={{
      ...getBlockStyles(block),
      height: toCSSValue(block.props.weight || 1),
      backgroundColor: block.props.color || '#E5E7EB',
      width: '100%',
    }} 
    className="my-4 transition-all"
  />
);

export const Hero: React.FC<LibraryProps> = ({ block, Renderer, readOnly }) => {
  const { upgradeBlock } = useAvriBuilderStore();

  const handleHeroAction = () => {
    if (!readOnly) {
      upgradeBlock(block.id, 'button');
      return;
    }
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
      productsGrid.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (block.children && block.children.length > 0) {
    return (
      <div 
        style={{
          ...getBlockStyles(block),
          backgroundImage: block.props.bgImage ? `url(${block.props.bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className="relative overflow-hidden w-full"
      >
        <div className="relative z-10 flex flex-col items-center justify-center space-y-6 max-w-4xl px-6 w-full mx-auto">
        {block.children.map(child => <Renderer key={child.id} block={child} />)}
      </div>
        {block.props.bgImage && <div className="absolute inset-0 bg-black/40 z-0" />}
      </div>
    );
  }

  const defaultBg = !block.props.backgroundColor && !block.props.bgImage 
    ? 'linear-gradient(135deg, #001946 0%, #000c24 100%)' 
    : undefined;

  return (
    <div 
      style={{
        ...getBlockStyles(block),
        backgroundImage: block.props.bgImage ? `url(${block.props.bgImage})` : defaultBg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: toCSSValue(block.props.minHeight) || '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
      className="relative overflow-hidden group/hero"
    >
      <div className="relative z-10 space-y-6 max-w-2xl px-6">
        <h1 
          onClick={(e) => { 
            if (readOnly) return;
            e.stopPropagation(); 
            upgradeBlock(block.id, 'title'); 
          }}
          className={cn(
            "text-5xl font-black uppercase tracking-tighter leading-tight transition-all",
            !readOnly && "cursor-pointer hover:outline hover:outline-2 hover:outline-[#00E5FF] hover:outline-offset-8"
          )}
        >
          {block.props.title || 'Avri Luxury Store'}
        </h1>
        <p 
          onClick={(e) => { 
            if (readOnly) return;
            e.stopPropagation(); 
            upgradeBlock(block.id, 'subtitle'); 
          }}
          className={cn(
            "text-lg opacity-80 font-medium transition-all",
            !readOnly && "cursor-pointer hover:outline hover:outline-2 hover:outline-[#00E5FF] hover:outline-offset-4"
          )}
        >
          {block.props.subtitle || 'La experiencia premium para tu negocio'}
        </p>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            handleHeroAction();
          }}
          style={{
            backgroundColor: block.props.backgroundColor || '#00E5FF',
            color: block.props.color || '#001946',
            borderRadius: toCSSValue(block.props.borderRadius ?? 99),
            padding: '16px 40px'
          }}
          className="font-black uppercase tracking-widest text-[12px] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center min-h-[44px]"
        >
          {block.props.ctaText || 'Ver Catálogo'}
        </button>
      </div>
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
};

export const Spacer: React.FC<LibraryProps> = ({ block }) => (
  <div style={{ height: toCSSValue(block.props.height || 40), width: '100%' }} />
);

export const ProductGrid: React.FC<LibraryProps> = ({ block, Renderer, readOnly }) => {
  const { upgradeBlock } = useAvriBuilderStore();

  if (block.children && block.children.length > 0) {
    return (
      <div style={getBlockStyles(block)} className="w-full">
        {block.children.map(child => <Renderer key={child.id} block={child} />)}
      </div>
    );
  }

  return (
    <div id="products-grid" style={getBlockStyles(block)} className="space-y-8">
      {!block.props.hideHeader && (
        <div className="flex items-end justify-between border-b border-gray-100 pb-4">
          <h3 
            onClick={(e) => {
              if (readOnly) return;
              e.stopPropagation();
              upgradeBlock(block.id, 'title');
            }}
            className={cn(
              "text-2xl font-black uppercase tracking-tighter text-[#001946] transition-all",
              !readOnly && "cursor-pointer hover:text-[#00E5FF]"
            )}
          >
            {block.props.title || 'Nuestros Destacados'}
          </h3>
          <a 
            href={block.props.viewAllHref || '#'} 
            onClick={(e) => {
              if (readOnly) return;
              e.preventDefault();
              e.stopPropagation();
              upgradeBlock(block.id, 'link');
            }}
            className="text-[10px] font-bold text-[#00E5FF] uppercase tracking-widest cursor-pointer hover:underline transition-all"
          >
            {block.props.viewAllText || 'VER TODO'}
          </a>
        </div>
      )}
      <div className={`grid gap-6 w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-${block.props.columns || 3}`}>
        {[1, 2, 3].map((id) => (
          <div key={id} className="group cursor-pointer">
            <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100 mb-4 transition-all group-hover:border-[#00E5FF]/20 group-hover:shadow-xl">
              <img src={`https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&id=${id}`} alt="Product" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#001946] shadow-sm uppercase tracking-wider">
                $199.00
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Categoría</p>
            <h4 className="text-sm font-black text-[#001946] group-hover:text-[#00E5FF] transition-colors">Reloj de Lujo - Edición Avri</h4>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Footer: React.FC<LibraryProps> = ({ block, Renderer, readOnly }) => {
  const { upgradeBlock } = useAvriBuilderStore();

  if (block.children && block.children.length > 0) {
    return (
      <footer style={getBlockStyles(block)} className="w-full">
        {block.children.map(child => <Renderer key={child.id} block={child} />)}
      </footer>
    );
  }

  return (
    <footer 
      style={getBlockStyles(block)}
      className="border-t border-gray-100 flex flex-col items-center gap-4 bg-gray-50/30"
    >
      <div className="flex gap-6">
        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#00E5FF] transition-colors">Instagram</a>
        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#00E5FF] transition-colors">WhatsApp</a>
        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#00E5FF] transition-colors">Catálogo</a>
      </div>
      <p 
        onClick={(e) => { 
          if (readOnly) return;
          e.stopPropagation(); 
          upgradeBlock(block.id); 
        }}
        className={cn(
          "text-[11px] font-medium text-gray-400 transition-all",
          !readOnly && "cursor-pointer hover:text-[#00E5FF]"
        )}
      >
        {block.props.text || '© 2024 Avri Luxury. Todos los derechos reservados.'}
      </p>
    </footer>
  );
};

export const Video: React.FC<LibraryProps> = ({ block }) => (
  <div style={getBlockStyles(block)} className="aspect-video w-full bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center relative group/video">
    {block.props.url ? (
      <iframe 
        src={block.props.url.replace('watch?v=', 'embed/')} 
        className="w-full h-full border-0"
        allowFullScreen
      />
    ) : (
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <VideoIcon className="w-12 h-12 opacity-20" />
        <span className="text-[10px] font-black uppercase tracking-widest">Video Player</span>
      </div>
    )}
  </div>
);

export const Map: React.FC<LibraryProps> = ({ block }) => (
  <div style={getBlockStyles(block)} className="w-full h-[400px] bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center relative border border-gray-200">
    <iframe 
      src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(block.props.address || 'London')}`}
      className="w-full h-full border-0 grayscale opacity-80"
    />
    {!block.props.address && (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50/80 backdrop-blur-sm">
        <MapPin className="w-10 h-10 text-gray-300" />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Configura la dirección</span>
      </div>
    )}
  </div>
);

export const Icon: React.FC<LibraryProps> = ({ block }) => (
  <div style={getBlockStyles(block)} className="flex items-center justify-center p-2">
    <Smile className="w-full h-full" style={{ color: block.props.color || '#00E5FF' }} />
  </div>
);

export const Navbar: React.FC<LibraryProps> = ({ block }) => (
  <nav style={getBlockStyles(block)} className="w-full flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-[#00E5FF] rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)]" />
      <span className="text-sm font-black uppercase tracking-tighter text-[#001946]">Avri Store</span>
    </div>
    <div className="hidden md:flex items-center gap-8">
      {['Inicio', 'Productos', 'Contacto'].map(link => (
        <span key={link} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#001946] cursor-pointer transition-colors">
          {link}
        </span>
      ))}
    </div>
    <button className="p-2 md:hidden">
      <Menu className="w-5 h-5 text-[#001946]" />
    </button>
  </nav>
);

export const Form: React.FC<LibraryProps> = ({ block, Renderer }) => (
  <form 
    style={getBlockStyles(block)} 
    className="w-full space-y-4 bg-gray-50/50 rounded-3xl border border-gray-100 transition-all"
    onSubmit={(e) => e.preventDefault()}
  >
    {block.children?.length === 0 ? (
      <div className="py-12 flex flex-col items-center gap-3 text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl">
        <ClipboardList className="w-8 h-8 opacity-20" />
        <span className="text-[9px] font-black uppercase tracking-widest">Arrastra campos aquí</span>
      </div>
    ) : (
      block.children?.map(child => <Renderer key={child.id} block={child} />)
    )}
  </form>
);

export const Input: React.FC<LibraryProps> = ({ block }) => (
  <div className="w-full space-y-1.5">
    {block.props.label && (
      <label className="text-[10px] font-black uppercase tracking-widest text-[#001946] ml-1">
        {block.props.label}
      </label>
    )}
    <input 
      type={block.props.type || 'text'}
      placeholder={block.props.placeholder || 'Escribe aquí...'}
      style={getBlockStyles(block)}
      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-[#00E5FF]/40 outline-none transition-all shadow-sm focus:shadow-md"
    />
  </div>
);

export const Checkbox: React.FC<LibraryProps> = ({ block }) => (
  <div className="flex items-center gap-3 cursor-pointer group">
    <div className="w-5 h-5 border-2 border-gray-200 rounded-md flex items-center justify-center group-hover:border-[#00E5FF] transition-colors bg-white">
      <CheckSquare className="w-3 h-3 text-[#00E5FF] opacity-0 group-active:opacity-100 transition-opacity" />
    </div>
    <span className="text-sm font-medium text-gray-600">{block.props.label || 'Opción'}</span>
  </div>
);

export const Radio: React.FC<LibraryProps> = ({ block }) => (
  <div className="flex items-center gap-3 cursor-pointer group">
    <div className="w-5 h-5 border-2 border-gray-200 rounded-full flex items-center justify-center group-hover:border-[#00E5FF] transition-colors bg-white">
      <div className="w-2 h-2 bg-[#00E5FF] rounded-full opacity-0 group-active:opacity-100 transition-opacity" />
    </div>
    <span className="text-sm font-medium text-gray-600">{block.props.label || 'Opción'}</span>
  </div>
);

export const Label: React.FC<LibraryProps> = ({ block }) => (
  <label style={getBlockStyles(block)} className="text-sm font-bold text-[#001946]">
    {block.props.text || 'Etiqueta de Campo'}
  </label>
);
