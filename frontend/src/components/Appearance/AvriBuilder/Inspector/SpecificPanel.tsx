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

interface PanelProps {
  block: Block;
}

/**
 * 1. Specific Settings Panel (Context-aware)
 */
export const SpecificSettingsPanel: React.FC<PanelProps> = ({ block }) => {
  const { updateBlockProps } = useAvriBuilderStore();
  const updateProp = (key: string, value: any) => updateBlockProps(block.id, { [key]: value });

  switch (block.type.toLowerCase()) {
    case 'container':
      return (
        <PropertySection title="Container Config" icon={Layout}>
          <div className="space-y-6">
            <SegmentedControl 
              label="Flex Direction"
              value={block.props.flexDirection || 'column'}
              onChange={(val) => updateProp('flexDirection', val)}
              options={[
                { value: 'column', icon: ArrowRight, label: 'Vertical' }, 
                { value: 'row', icon: ArrowRight, label: 'Horizontal' },
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <SegmentedControl 
                label="Align Items"
                value={block.props.alignItems || 'stretch'}
                onChange={(val) => updateProp('alignItems', val)}
                options={[
                  { value: 'flex-start', icon: AlignLeft, label: 'Start' },
                  { value: 'center', icon: AlignCenter, label: 'Center' },
                  { value: 'flex-end', icon: AlignRight, label: 'End' },
                ]}
              />
              <SegmentedControl 
                label="Justify"
                value={block.props.justifyContent || 'flex-start'}
                onChange={(val) => updateProp('justifyContent', val)}
                options={[
                  { value: 'flex-start', icon: AlignLeft, label: 'Start' },
                  { value: 'center', icon: AlignCenter, label: 'Center' },
                  { value: 'flex-end', icon: AlignRight, label: 'End' },
                ]}
              />
            </div>
            <SliderInput label="Gap" value={block.props.gap || 0} onChange={(val) => updateProp('gap', val)} max={100} />
          </div>
        </PropertySection>
      );

    case 'hero':
      return (
        <PropertySection title="Hero Config" icon={Layout}>
          <div className="space-y-4">
            <TextInput label="Title" value={block.props.title || ''} onChange={(val) => updateProp('title', val)} />
            <TextInput label="Subtitle" value={block.props.subtitle || ''} onChange={(val) => updateProp('subtitle', val)} />
            <TextInput label="CTA Text" value={block.props.ctaText || ''} onChange={(val) => updateProp('ctaText', val)} />
            <TextInput label="BG Image URL" value={block.props.bgImage || ''} onChange={(val) => updateProp('bgImage', val)} />
          </div>
        </PropertySection>
      );

    case 'button':
      return (
        <PropertySection title="Button Config" icon={LinkIcon}>
          <div className="space-y-4">
            <TextInput label="Button Text" value={block.props.text || 'Click me'} onChange={(val) => updateProp('text', val)} />
            <TextInput label="Link URL" value={block.props.href || ''} onChange={(val) => updateProp('href', val)} placeholder="https://..." />
          </div>
        </PropertySection>
      );

    case 'productgrid':
      return (
        <PropertySection title="Grid Settings" icon={Layout}>
          <div className="space-y-4">
            <TextInput label="Section Title" value={block.props.title || 'Nuestros Destacados'} onChange={(val) => updateProp('title', val)} />
            <div className="grid grid-cols-2 gap-4">
              <TextInput label="Link Text" value={block.props.viewAllText || 'VER TODO'} onChange={(val) => updateProp('viewAllText', val)} />
              <TextInput label="Link URL" value={block.props.viewAllHref || '#'} onChange={(val) => updateProp('viewAllHref', val)} />
            </div>
            <SliderInput label="Columns" value={block.props.columns || 3} onChange={(val) => updateProp('columns', val)} max={6} min={1} />
          </div>
        </PropertySection>
      );

    case 'heading':
    case 'text':
      return (
        <PropertySection title="Text Content" icon={Type}>
          <textarea 
            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all resize-none min-h-[100px]"
            value={block.props.text || ''}
            onChange={(e) => updateProp('text', e.target.value)}
          />
        </PropertySection>
      );

    case 'divider':
      return (
        <PropertySection title="Divider Styles" icon={Minus}>
          <div className="space-y-4">
            <SliderInput label="Weight" value={block.props.weight || 1} onChange={(val) => updateProp('weight', val)} max={20} />
            <ColorInput label="Line Color" value={block.props.color || '#E5E7EB'} onChange={(val) => updateProp('color', val)} />
          </div>
        </PropertySection>
      );

    case 'image':
      return (
        <PropertySection title="Image Config" icon={ImageIcon}>
          <div className="space-y-4">
            <TextInput label="Image URL" value={block.props.src || ''} onChange={(val) => updateProp('src', val)} />
            <TextInput label="Alt Text" value={block.props.alt || ''} onChange={(val) => updateProp('alt', val)} />
          </div>
        </PropertySection>
      );

    case 'video':
      return (
        <PropertySection title="Video Config" icon={VideoIcon}>
          <TextInput label="YouTube/Vimeo URL" value={block.props.url || ''} onChange={(val) => updateProp('url', val)} />
        </PropertySection>
      );

    case 'map':
      return (
        <PropertySection title="Map Config" icon={MapPin}>
          <TextInput label="Address" value={block.props.address || ''} onChange={(val) => updateProp('address', val)} />
        </PropertySection>
      );

    case 'icon':
      return (
        <PropertySection title="Icon Settings" icon={Smile}>
          <ColorInput label="Icon Color" value={block.props.color || '#00E5FF'} onChange={(val) => updateProp('color', val)} />
        </PropertySection>
      );

    case 'input':
      return (
        <PropertySection title="Field Settings" icon={Layout}>
          <div className="space-y-4">
            <TextInput label="Label" value={block.props.label || ''} onChange={(val) => updateProp('label', val)} />
            <TextInput label="Placeholder" value={block.props.placeholder || ''} onChange={(val) => updateProp('placeholder', val)} />
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

    case 'checkbox':
    case 'radio':
      return (
        <PropertySection title="Option Settings" icon={CheckSquare}>
          <TextInput label="Label" value={block.props.label || ''} onChange={(val) => updateProp('label', val)} />
        </PropertySection>
      );

    case 'spacer':
      return (
        <PropertySection title="Spacer Settings" icon={Maximize}>
          <SliderInput label="Height" value={block.props.height || 40} onChange={(val) => updateProp('height', val)} max={200} />
        </PropertySection>
      );

    case 'footer':
      return (
        <PropertySection title="Footer Config" icon={Type}>
          <TextInput label="Copyright Text" value={block.props.text || ''} onChange={(val) => updateProp('text', val)} />
        </PropertySection>
      );

    default:
      return null;
  }
};

/**
 * 2. Layout Panel (Universal)
 */
export const LayoutPanel: React.FC<PanelProps> = ({ block }) => {
  const { updateBlockProps } = useAvriBuilderStore();
  const updateProp = (key: string, value: any) => updateBlockProps(block.id, { [key]: value });

  return (
    <PropertySection title="Layout & Position" icon={Layout}>
      <div className="space-y-6">
        <SegmentedControl 
          label="Self Alignment"
          value={block.props.alignSelf || 'auto'}
          onChange={(val) => updateProp('alignSelf', val)}
          options={[
            { value: 'auto', icon: MousePointer2, label: 'Auto' },
            { value: 'flex-start', icon: AlignLeft, label: 'Left' },
            { value: 'center', icon: AlignCenter, label: 'Center' },
            { value: 'flex-end', icon: AlignRight, label: 'Right' },
          ]}
        />
        <div className="flex gap-4">
          <SegmentedControl 
            label="Width Mode"
            value={block.props.width === '100%' ? 'full' : 'auto'}
            onChange={(val) => updateProp('width', val === 'full' ? '100%' : 'auto')}
            options={[
              { value: 'auto', icon: Maximize, label: 'Auto' },
              { value: 'full', icon: Maximize, label: 'Full' },
            ]}
          />
        </div>
      </div>
    </PropertySection>
  );
};

/**
 * 3. General Information Panel
 */
export const GeneralPanel: React.FC<PanelProps> = ({ block }) => {
  return (
    <PropertySection title="General Info" icon={Settings}>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-bold tracking-widest">
          <span>Block ID</span>
          <span className="font-mono lowercase text-[8px] opacity-60">#{block.id.slice(0, 12)}</span>
        </div>
        <div className="bg-gray-50 px-3 py-2 rounded-lg text-[10px] font-mono text-[#001946] border border-gray-100 truncate">
          {block.id}
        </div>
        <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-bold tracking-widest pt-2">
          <span>Component</span>
          <span className="text-[#00E5FF]">{block.type}</span>
        </div>
      </div>
    </PropertySection>
  );
};
