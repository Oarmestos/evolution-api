import { Settings, Image as ImageIcon, Type, Video } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import type { Block } from '../../../../store/useAvriBuilderStore';

interface SpecificPanelProps {
  block: Block;
}

export const SpecificPanel: React.FC<SpecificPanelProps> = ({ block }) => {
  const { updateBlockProps } = useAvriBuilderStore();

  const updateProp = (key: string, value: any) => {
    updateBlockProps(block.id, { [key]: value });
  };

  if (block.type === 'Image') {
    return (
      <PropertySection title="Image Properties" icon={ImageIcon} defaultOpen badge="src">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Image URL</label>
            <input 
              type="text"
              className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all"
              value={block.props.src || ''}
              onChange={(e) => updateProp('src', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Alt Text</label>
            <input 
              type="text"
              className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all"
              value={block.props.alt || ''}
              onChange={(e) => updateProp('alt', e.target.value)}
              placeholder="Descripción de la imagen"
            />
          </div>
        </div>
      </PropertySection>
    );
  }

  if (block.type === 'Heading' || block.type === 'Text') {
    return (
      <PropertySection title="Content" icon={Type} defaultOpen>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Text Content</label>
          <textarea 
            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all resize-none min-h-[100px]"
            value={block.props.text || ''}
            onChange={(e) => updateProp('text', e.target.value)}
            placeholder="Escribe aquí..."
          />
        </div>
      </PropertySection>
    );
  }

  if (block.type === 'Video') {
    return (
      <PropertySection title="Video Settings" icon={Video} defaultOpen>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Video URL / ID</label>
            <input 
              type="text"
              className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all"
              value={block.props.videoId || ''}
              onChange={(e) => updateProp('videoId', e.target.value)}
              placeholder="ID de YouTube o URL"
            />
          </div>
        </div>
      </PropertySection>
    );
  }

  return (
    <PropertySection title="General" icon={Settings} defaultOpen>
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">ID del Bloque</label>
        <div className="bg-gray-50 px-3 py-2 rounded-lg text-[10px] font-mono text-gray-400 border border-gray-100 truncate">
          {block.id}
        </div>
      </div>
    </PropertySection>
  );
};
