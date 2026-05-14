import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Smile } from 'lucide-react';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import { cn } from '../../../../utils/cn';
import { toCSSValue } from '../../../../utils/toCSSValue';
import { getBlockStyles } from '../utils/getBlockStyles';
import type { LibraryProps } from '../BlockLibrary';

export const Heading: React.FC<LibraryProps> = ({ block, readOnly }) => {
  const { updateBlockProps } = useAvriBuilderStore();
  const Tag = (block.props.tag || 'h2') as any;
  return (
    <Tag 
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onBlur={(e: any) => updateBlockProps(block.id, { text: e.currentTarget.textContent || '' })}
      onKeyDown={(e: any) => e.key === 'Enter' && e.preventDefault()}
      style={getBlockStyles(block)} 
      className={cn(
        "transition-all leading-tight outline-none",
        !readOnly && "hover:outline hover:outline-1 hover:outline-[#00E5FF]/50 focus:outline focus:outline-2 focus:outline-[#00E5FF] cursor-text"
      )}
    >
      {block.props.text || 'Título'}
    </Tag>
  );
};

export const Text: React.FC<LibraryProps> = ({ block, readOnly }) => {
  const { updateBlockProps } = useAvriBuilderStore();
  const Tag = (block.props.tag || 'p') as any;
  return (
    <Tag 
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onBlur={(e: any) => updateBlockProps(block.id, { text: e.currentTarget.textContent || '' })}
      style={getBlockStyles(block)} 
      className={cn(
        "transition-all outline-none",
        !readOnly && "hover:outline hover:outline-1 hover:outline-[#00E5FF]/50 focus:outline focus:outline-2 focus:outline-[#00E5FF] cursor-text"
      )}
    >
      {block.props.text || 'Tu texto aquí'}
    </Tag>
  );
};

export const Button: React.FC<LibraryProps> = ({ block, readOnly }) => {
  const { updateBlockProps } = useAvriBuilderStore();
  const Tag = block.props.href ? 'a' : 'button';
  
  return (
    <Tag 
      href={readOnly ? block.props.href : undefined}
      target={block.props.openInNewTab ? '_blank' : undefined}
      rel={block.props.openInNewTab ? 'noopener noreferrer' : undefined}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onBlur={(e: any) => updateBlockProps(block.id, { text: e.currentTarget.textContent || '' })}
      onKeyDown={(e: any) => e.key === 'Enter' && e.preventDefault()}
      onClick={(e: any) => {
        if (!readOnly) e.preventDefault();
      }}
      style={getBlockStyles(block)} 
      className={cn(
        "transition-all active:scale-95 flex items-center justify-center outline-none decoration-transparent",
        !readOnly && "hover:outline hover:outline-1 hover:outline-[#00E5FF]/50 focus:outline focus:outline-2 focus:outline-[#00E5FF] cursor-text"
      )}
    >
      {block.props.text || 'Botón'}
    </Tag>
  );
};

export const Image: React.FC<LibraryProps> = ({ block }) => {
  const imgContent = (
    <img 
      src={block.props.src || 'https://via.placeholder.com/400x300?text=Avri+Luxury'} 
      alt={block.props.alt}
      style={{
        ...getBlockStyles(block),
        objectFit: block.props.objectFit || 'cover',
      }}
      className="max-w-full h-auto transition-all"
    />
  );
  if (block.props.href) {
    return <a href={block.props.href} target="_blank" rel="noopener noreferrer">{imgContent}</a>;
  }
  return imgContent;
};

export const Icon: React.FC<LibraryProps> = ({ block }) => {
  const IconComponent = (LucideIcons as any)[block.props.iconName || 'Smile'] || Smile;
  return (
    <div style={getBlockStyles(block)} className="flex items-center justify-center">
      <IconComponent size={block.props.size || 24} color={block.props.color} />
    </div>
  );
};

export const Social: React.FC<LibraryProps> = ({ block }) => {
  const platforms = [
    { name: 'Instagram', icon: 'Instagram', color: '#E1306C', url: block.props.instagram },
    { name: 'Facebook', icon: 'Facebook', color: '#1877F2', url: block.props.facebook },
    { name: 'WhatsApp', icon: 'MessageCircle', color: '#25D366', url: block.props.whatsapp },
    { name: 'Twitter', icon: 'Twitter', color: '#1DA1F2', url: block.props.twitter },
  ];

  return (
    <div style={getBlockStyles(block)} className="flex items-center gap-6 py-4">
      {platforms.filter(p => p.url).map(p => {
        const IconComp = (LucideIcons as any)[p.icon] || Smile;
        return (
          <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110 active:scale-95" style={{ color: p.color }}>
            <IconComp size={28} />
          </a>
        );
      })}
    </div>
  );
};

export const Divider: React.FC<LibraryProps> = ({ block }) => (
  <hr 
    style={{
      ...getBlockStyles(block),
      border: 'none',
      borderTopWidth: toCSSValue(block.props.weight || 1),
      borderTopStyle: block.props.borderStyle || 'solid',
      borderTopColor: block.props.color || '#E5E7EB',
      width: block.props.width || '100%',
      margin: '16px auto',
    }} 
    className="transition-all"
  />
);

export const Spacer: React.FC<LibraryProps> = ({ block }) => (
  <div style={{ height: toCSSValue(block.props.height || 40), width: '100%' }} />
);
