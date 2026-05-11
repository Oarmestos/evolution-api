import React from 'react';
import { 
  Settings, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  ArrowRight,
  Link as LinkIcon,
  Maximize,
  Minus,
  Video as VideoIcon,
  MapPin,
  Smile,
  CheckSquare,
  Mail,
  Phone,
  MousePointer2
} from 'lucide-react';
import { PropertySection } from './PropertySection';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import type { Block } from '../../../../store/useAvriBuilderStore';
import { ColorInput, SegmentedControl, SliderInput, TextInput } from './Inputs';

interface SpecificPanelProps {
  block: Block;
}

export const SpecificPanel: React.FC<SpecificPanelProps> = ({ block }) => {
  const { updateBlockProps } = useAvriBuilderStore();

  const updateProp = (key: string, value: any) => {
    updateBlockProps(block.id, { [key]: value });
  };

  if (block.type === 'Container') {
    return (
      <PropertySection title="Layout Settings" icon={Layout} defaultOpen>
        <div className="space-y-6">
          <SegmentedControl 
            label="Direction"
            value={block.props.direction || 'column'}
            onChange={(val) => updateProp('direction', val)}
            options={[
              { value: 'column', icon: ArrowRight, label: 'Vertical' }, 
              { value: 'row', icon: ArrowRight, label: 'Horizontal' },
            ]}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <SegmentedControl 
              label="Align"
              value={block.props.alignItems || 'stretch'}
              onChange={(val) => updateProp('alignItems', val)}
              options={[
                { value: 'flex-start', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'flex-end', icon: AlignRight },
              ]}
            />
            <SegmentedControl 
              label="Justify"
              value={block.props.justifyContent || 'flex-start'}
              onChange={(val) => updateProp('justifyContent', val)}
              options={[
                { value: 'flex-start', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'flex-end', icon: AlignRight },
              ]}
            />
          </div>

          <SliderInput 
            label="Gap (Spacing)"
            value={block.props.gap || 0}
            onChange={(val) => updateProp('gap', val)}
            max={100}
          />
        </div>
      </PropertySection>
    );
  }

  if (block.type === 'Hero') {
    return (
      <div className="space-y-6">
        <PropertySection title="Hero Content" icon={Layout} defaultOpen>
          <div className="space-y-4">
            <TextInput 
              label="Main Title"
              value={block.props.title || ''}
              onChange={(val) => updateProp('title', val)}
            />
            <TextInput 
              label="Subtitle"
              value={block.props.subtitle || ''}
              onChange={(val) => updateProp('subtitle', val)}
            />
            <TextInput 
              label="CTA Text"
              value={block.props.ctaText || ''}
              onChange={(val) => updateProp('ctaText', val)}
            />
            <TextInput 
              label="Background Image URL"
              value={block.props.bgImage || ''}
              onChange={(val) => updateProp('bgImage', val)}
            />
          </div>
        </PropertySection>

        <PropertySection title="CTA Button Style" icon={MousePointer2}>
          <div className="space-y-4">
            <ColorInput 
              label="Button Background"
              value={block.props.btnBg || '#00E5FF'}
              onChange={(val) => updateProp('btnBg', val)}
            />
            <ColorInput 
              label="Button Text Color"
              value={block.props.btnColor || '#001946'}
              onChange={(val) => updateProp('btnColor', val)}
            />
            <SliderInput 
              label="Button Radius"
              value={block.props.btnRadius || 99}
              onChange={(val) => updateProp('btnRadius', val)}
              max={100}
            />
          </div>
        </PropertySection>
      </div>
    );
  }

  if (block.type === 'ProductGrid') {
    return (
      <PropertySection title="Grid Settings" icon={Layout}>
        <div className="space-y-4">
          <TextInput 
            label="Section Title"
            value={block.props.title || ''}
            onChange={(val) => updateProp('title', val)}
          />
          <SliderInput 
            label="Columns"
            value={block.props.columns || 3}
            onChange={(val) => updateProp('columns', val)}
            max={6}
            min={1}
          />
        </div>
      </PropertySection>
    );
  }

  if (block.type === 'Footer') {
    return (
      <PropertySection title="Footer Content" icon={Type}>
        <TextInput 
          label="Copyright Text"
          value={block.props.text || ''}
          onChange={(val) => updateProp('text', val)}
        />
      </PropertySection>
    );
  }

  if (block.type === 'Spacer') {
    return (
      <PropertySection title="Spacer Settings" icon={Maximize}>
        <SliderInput 
          label="Height"
          value={block.props.height || 40}
          onChange={(val) => updateProp('height', val)}
          max={200}
        />
      </PropertySection>
    );
  }

  if (block.type === 'Button') {
    return (
      <PropertySection title="Button Settings" icon={LinkIcon} defaultOpen>
        <div className="space-y-4">
          <TextInput 
            label="Button Text"
            value={block.props.text || 'Click me'}
            onChange={(val) => updateProp('text', val)}
          />
          <TextInput 
            label="Link URL"
            value={block.props.href || ''}
            onChange={(val) => updateProp('href', val)}
            placeholder="https://..."
          />
          <ColorInput 
            label="Background Color"
            value={block.props.backgroundColor || '#00E5FF'}
            onChange={(val) => updateProp('backgroundColor', val)}
          />
        </div>
      </PropertySection>
    );
  }

  if (block.type === 'Image') {
    return (
      <PropertySection title="Image Properties" icon={ImageIcon} defaultOpen badge="src">
        <div className="space-y-4">
          <TextInput 
            label="Image URL"
            value={block.props.src || ''}
            onChange={(val) => updateProp('src', val)}
            placeholder="https://example.com/image.jpg"
          />
          <TextInput 
            label="Alt Text"
            value={block.props.alt || ''}
            onChange={(val) => updateProp('alt', val)}
            placeholder="Descripción de la imagen"
          />
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

  if (block.type === 'Divider') {
    return (
      <PropertySection title="Divider Styles" icon={Minus} defaultOpen>
        <div className="space-y-4">
          <SliderInput 
            label="Weight"
            value={block.props.weight || 1}
            onChange={(val) => updateProp('weight', val)}
            max={20}
          />
          <ColorInput 
            label="Line Color"
            value={block.props.color || '#E5E7EB'}
            onChange={(val) => updateProp('color', val)}
          />
        </div>
      </PropertySection>
    );
  }

  if (block.type === 'Video') {
    return (
      <PropertySection title="Video Settings" icon={VideoIcon}>
        <TextInput 
          label="YouTube/Vimeo URL"
          value={block.props.url || ''}
          onChange={(val) => updateProp('url', val)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </PropertySection>
    );
  }

  if (block.type === 'Map') {
    return (
      <PropertySection title="Map Settings" icon={MapPin}>
        <TextInput 
          label="Google Maps Address"
          value={block.props.address || ''}
          onChange={(val) => updateProp('address', val)}
          placeholder="Ej: Calle 123, Ciudad"
        />
      </PropertySection>
    );
  }

  if (block.type === 'Icon') {
    return (
      <PropertySection title="Icon Settings" icon={Smile}>
        <ColorInput 
          label="Icon Color"
          value={block.props.color || '#00E5FF'}
          onChange={(val) => updateProp('color', val)}
        />
      </PropertySection>
    );
  }

  if (block.type === 'Input') {
    return (
      <PropertySection title="Input Settings" icon={Layout}>
        <div className="space-y-4">
          <TextInput 
            label="Field Label"
            value={block.props.label || ''}
            onChange={(val) => updateProp('label', val)}
          />
          <TextInput 
            label="Placeholder"
            value={block.props.placeholder || ''}
            onChange={(val) => updateProp('placeholder', val)}
          />
          <SegmentedControl 
            label="Type"
            value={block.props.type || 'text'}
            onChange={(val) => updateProp('type', val)}
            options={[
              { value: 'text', label: 'Text', icon: Type },
              { value: 'email', label: 'Email', icon: Mail },
              { value: 'tel', label: 'Phone', icon: Phone },
            ]}
          />
        </div>
      </PropertySection>
    );
  }

  if (block.type === 'Checkbox' || block.type === 'Radio') {
    return (
      <PropertySection title="Option Settings" icon={CheckSquare}>
        <TextInput 
          label="Option Label"
          value={block.props.label || ''}
          onChange={(val) => updateProp('label', val)}
        />
      </PropertySection>
    );
  }

  if (block.type === 'Label') {
    return (
      <PropertySection title="Label Content" icon={Type}>
        <TextInput 
          label="Label Text"
          value={block.props.text || ''}
          onChange={(val) => updateProp('text', val)}
        />
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
