import React from 'react';
import { Menu } from 'lucide-react';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import { cn } from '../../../../utils/cn';
import { toCSSValue } from '../../../../utils/toCSSValue';
import { getBlockStyles } from '../utils/getBlockStyles';
import type { LibraryProps } from '../BlockLibrary';

export const Container: React.FC<LibraryProps> = ({ block, Renderer }) => (
  <div style={getBlockStyles(block)} className="transition-all">
    {block.children?.length === 0 ? (
      <div className="flex items-center justify-center h-20 w-full text-gray-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200 rounded-xl">
        Contenedor Vacío
      </div>
    ) : (
      block.children?.map((child: any) => <Renderer key={child.id} block={child} />)
    )}
  </div>
);

export const Hero: React.FC<LibraryProps> = ({ block, Renderer, readOnly }) => {
  const { updateBlockProps, upgradeBlock } = useAvriBuilderStore();

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
        className="relative overflow-hidden w-full py-20"
      >
        <div className="relative z-10 flex flex-col items-center justify-center gap-10 max-w-4xl px-6 w-full mx-auto text-center">
          {block.children.map((child: any) => <Renderer key={child.id} block={child} />)}
        </div>
        {block.props.bgImage && <div className="absolute inset-0 bg-black/50 z-0" />}
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
        minHeight: toCSSValue(block.props.minHeight) || '500px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: block.props.textAlign || 'center',
        padding: '24px',
      }}
      className="relative overflow-hidden group/hero"
    >
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-3xl px-6">
        <h1 
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onBlur={(e) => updateBlockProps(block.id, { title: e.currentTarget.textContent || '' })}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          className={cn(
            "text-6xl font-black uppercase tracking-tighter leading-[0.9] transition-all outline-none",
            !readOnly && "cursor-text hover:outline hover:outline-2 hover:outline-[#00E5FF] hover:outline-offset-8 focus:outline-offset-8"
          )}
        >
          {block.props.title || 'Avri Luxury Store'}
        </h1>
        <p 
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onBlur={(e) => updateBlockProps(block.id, { subtitle: e.currentTarget.textContent || '' })}
          className={cn(
            "text-xl opacity-70 font-medium transition-all max-w-xl outline-none",
            !readOnly && "cursor-text hover:outline hover:outline-2 hover:outline-[#00E5FF] hover:outline-offset-4 focus:outline-offset-4"
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
            borderRadius: toCSSValue(block.props.borderRadius ?? 12),
            padding: '20px 48px'
          }}
          className="font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_50px_rgba(0,229,255,0.2)] hover:shadow-[0_20px_60px_rgba(0,229,255,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center min-h-[54px]"
        >
          {block.props.ctaText || 'Ver Catálogo'}
        </button>
      </div>
      <div 
        className="absolute inset-0 z-0" 
        style={{ backgroundColor: `rgba(0,0,0,${block.props.bgOverlayOpacity ?? 0.5})` }} 
      />
    </div>
  );
};

export const Navbar: React.FC<LibraryProps> = ({ block }) => (
  <nav 
    style={{
      ...getBlockStyles(block),
      position: block.props.sticky !== false ? 'sticky' : 'relative',
    }} 
    className="w-full flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-gray-100/50 px-8 py-5 top-0 z-[1000]"
  >
    <div className="flex items-center gap-3">
      {block.props.logoUrl ? (
        <img src={block.props.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
      ) : (
        <div className="w-10 h-10 bg-[#00E5FF] rounded-xl shadow-[0_10px_20px_rgba(0,229,255,0.3)] flex items-center justify-center font-black text-[#001946]">
          {block.props.storeName?.[0] || 'A'}
        </div>
      )}
      <span className="text-lg font-black uppercase tracking-tighter text-[#001946]">
        {block.props.storeName || 'Avri Store'}
      </span>
    </div>
    <div className="hidden md:flex items-center gap-10">
      {(block.props.menuLinks ? block.props.menuLinks.split(',').map((s: string) => s.trim()) : ['Inicio', 'Productos', 'Nosotros', 'Contacto']).map((link: string) => (
        <span key={link} className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#00E5FF] cursor-pointer transition-all hover:translate-y-[-1px]">
          {link}
        </span>
      ))}
    </div>
    <div className="flex items-center gap-4">
      <button className="bg-[#001946] text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full hover:bg-[#00E5FF] hover:text-[#001946] transition-all">
        Login
      </button>
      <button className="p-2 md:hidden">
        <Menu className="w-6 h-6 text-[#001946]" />
      </button>
    </div>
  </nav>
);

export const Footer: React.FC<LibraryProps> = ({ block, Renderer, readOnly }) => {
  const { updateBlockProps } = useAvriBuilderStore();

  if (block.children && block.children.length > 0) {
    return (
      <footer style={getBlockStyles(block)} className="w-full">
        {block.children.map((child: any) => <Renderer key={child.id} block={child} />)}
      </footer>
    );
  }

  return (
    <footer 
      style={getBlockStyles(block)}
      className="border-t border-gray-100 flex flex-col items-center gap-8 py-12 px-4 bg-gray-50/50"
    >
      <div className="flex gap-10">
        <a href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#00E5FF] transition-colors">Instagram</a>
        <a href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#00E5FF] transition-colors">WhatsApp</a>
        <a href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#00E5FF] transition-colors">Catálogo</a>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-1 bg-[#00E5FF] mb-2 rounded-full" />
        <p 
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onBlur={(e) => updateBlockProps(block.id, { text: e.currentTarget.textContent || '' })}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          className={cn(
            "text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all outline-none",
            !readOnly && "cursor-text hover:text-[#00E5FF]"
          )}
        >
          {block.props.text || '© 2026 Avri Store. Todos los derechos reservados.'}
        </p>
      </div>
    </footer>
  );
};
