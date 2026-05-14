import React from 'react';
import { 
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
  Menu
} from 'lucide-react';
import { useResponsiveProps } from '../../utils/responsive';
import { useAvriBuilderStore } from '../../../../../store/useAvriBuilderStore';
import type { Block } from '../../../../../store/useAvriBuilderStore';
import { PropertySection } from '../PropertySection';
import { ColorInput, SegmentedControl, SliderInput, TextInput, ToggleInput } from '../Inputs';

interface PanelProps {
  block: Block;
}

export const SpecificSettingsPanel: React.FC<PanelProps> = ({ block }) => {
  const { getProp, setProp } = useResponsiveProps(block);
  const { setContainerColumns } = useAvriBuilderStore();

  const isRow = getProp('flexDirection') === 'row';
  const childCount = block.children?.length || 0;
  const currentColumnsCount = (isRow && childCount > 0) ? childCount : 1;

  switch (block.type.toLowerCase()) {
    case 'container':
      return (
        <PropertySection title="Container Config" icon={Layout} defaultOpen={true}>
          <div className="space-y-6">
            <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-4">
              <span className="text-[12px] font-bold text-[#0f172a] block">Estructura de Columnas</span>
              <SegmentedControl 
                label=""
                value={String(currentColumnsCount > 4 ? 4 : currentColumnsCount)}
                onChange={(val) => {
                  const numVal = parseInt(val, 10);
                  if (numVal === 1) {
                    setContainerColumns(block.id, 0);
                  } else {
                    setContainerColumns(block.id, numVal);
                  }
                }}
                options={[
                  { value: '1', label: '1 Col' },
                  { value: '2', label: '2 Cols' },
                  { value: '3', label: '3 Cols' },
                  { value: '4', label: '4 Cols' },
                ]}
              />
              <p className="text-[10px] text-[#64748b] leading-tight text-center">
                Organiza el contenido de este contenedor en columnas horizontales equitativas.
              </p>
            </div>

            <SegmentedControl 
              label="Flex Direction"
              value={getProp('flexDirection') || 'column'}
              onChange={(val) => setProp('flexDirection', val)}
              options={[
                { value: 'column', icon: ArrowRight, label: 'Vertical' }, 
                { value: 'row', icon: ArrowRight, label: 'Horizontal' },
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <SegmentedControl 
                label="Align Items"
                value={getProp('alignItems') || 'stretch'}
                onChange={(val) => setProp('alignItems', val)}
                options={[
                  { value: 'flex-start', icon: AlignLeft, label: 'Start' },
                  { value: 'center', icon: AlignCenter, label: 'Center' },
                  { value: 'flex-end', icon: AlignRight, label: 'End' },
                ]}
              />
              <SegmentedControl 
                label="Justify"
                value={getProp('justifyContent') || 'flex-start'}
                onChange={(val) => setProp('justifyContent', val)}
                options={[
                  { value: 'flex-start', icon: AlignLeft, label: 'Start' },
                  { value: 'center', icon: AlignCenter, label: 'Center' },
                  { value: 'flex-end', icon: AlignRight, label: 'End' },
                ]}
              />
            </div>
            <SliderInput label="Gap" value={getProp('gap') || 0} onChange={(val) => setProp('gap', val)} max={100} />
            <SegmentedControl 
              label="Overflow"
              value={getProp('overflow') || 'visible'}
              onChange={(val) => setProp('overflow', val)}
              options={[
                { value: 'visible', label: 'Visible' },
                { value: 'hidden', label: 'Hidden' },
                { value: 'scroll', label: 'Scroll' },
              ]}
            />
          </div>
        </PropertySection>
      );

    case 'hero':
      return (
        <PropertySection title="Hero Config" icon={Layout} defaultOpen={true}>
          <div className="space-y-6">
            <TextInput label="Title" value={getProp('title') || ''} onChange={(val) => setProp('title', val)} />
            <TextInput label="Subtitle" value={getProp('subtitle') || ''} onChange={(val) => setProp('subtitle', val)} />
            <TextInput label="CTA Text" value={getProp('ctaText') || ''} onChange={(val) => setProp('ctaText', val)} />
            <TextInput label="BG Image URL" value={getProp('bgImage') || ''} onChange={(val) => setProp('bgImage', val)} />
            <div className="pt-2 border-t border-[#f1f5f9] space-y-4">
              <SliderInput 
                label="Overlay Opacity" 
                value={(getProp('bgOverlayOpacity') || 0.5) * 100} 
                onChange={(val) => setProp('bgOverlayOpacity', val / 100)} 
                max={100} unit="%" 
              />
              <SliderInput 
                label="Min Height" 
                value={parseInt(getProp('minHeight') || 500)} 
                onChange={(val) => setProp('minHeight', val)} 
                min={200} max={1000} 
              />
              <SegmentedControl 
                label="Alineación Interna"
                value={getProp('textAlign') || 'center'}
                onChange={(val) => setProp('textAlign', val)}
                options={[
                  { value: 'left', icon: AlignLeft, label: 'Izquierda' },
                  { value: 'center', icon: AlignCenter, label: 'Centro' },
                  { value: 'right', icon: AlignRight, label: 'Derecha' },
                ]}
              />
            </div>
          </div>
        </PropertySection>
      );

    case 'button':
      return (
        <PropertySection title="Button Config" icon={LinkIcon} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Button Text" value={getProp('text') || 'Click me'} onChange={(val) => setProp('text', val)} />
            <TextInput label="Link URL" value={getProp('href') || ''} onChange={(val) => setProp('href', val)} placeholder="https://..." />
            <ToggleInput 
              label="Abrir en pestaña nueva" 
              value={getProp('openInNewTab') || false} 
              onChange={(val) => setProp('openInNewTab', val)} 
            />
          </div>
        </PropertySection>
      );

    case 'productgrid':
      return (
        <PropertySection title="Grid Settings" icon={Layout} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Section Title" value={getProp('title') || 'Nuestros Destacados'} onChange={(val) => setProp('title', val)} />
            <div className="grid grid-cols-2 gap-4">
              <TextInput label="Link Text" value={getProp('viewAllText') || 'VER TODO'} onChange={(val) => setProp('viewAllText', val)} />
              <TextInput label="Link URL" value={getProp('viewAllHref') || '#'} onChange={(val) => setProp('viewAllHref', val)} />
            </div>
            <SliderInput label="Columns" value={getProp('columns') || 3} onChange={(val) => setProp('columns', val)} max={6} min={1} />
          </div>
        </PropertySection>
      );

    case 'heading':
    case 'text':
      return (
        <PropertySection title="Text Content" icon={Type} defaultOpen={true}>
          <textarea 
            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all resize-none min-h-[100px]"
            value={getProp('text') || ''}
            onChange={(e) => setProp('text', e.target.value)}
          />
        </PropertySection>
      );

    case 'image':
      return (
        <PropertySection title="Image Config" icon={Layout} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Image URL" value={getProp('src') || ''} onChange={(val) => setProp('src', val)} />
            <TextInput label="Alt Text" value={getProp('alt') || ''} onChange={(val) => setProp('alt', val)} />
            <TextInput label="Enlace al hacer clic" value={getProp('href') || ''} onChange={(val) => setProp('href', val)} placeholder="https://..." />
            <SegmentedControl 
              label="Ajuste de Imagen"
              value={getProp('objectFit') || 'cover'}
              onChange={(val) => setProp('objectFit', val)}
              options={[
                { value: 'cover', label: 'Llenar' },
                { value: 'contain', label: 'Contener' },
                { value: 'fill', label: 'Estirar' },
              ]}
            />
          </div>
        </PropertySection>
      );

    case 'video':
      return (
        <PropertySection title="Video Config" icon={VideoIcon} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Video URL (Direct or YouTube)" value={getProp('url') || ''} onChange={(val) => setProp('url', val)} />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <ToggleInput label="Autoplay" value={getProp('autoPlay') || false} onChange={(val) => setProp('autoPlay', val)} />
              <ToggleInput label="Loop" value={getProp('loop') || false} onChange={(val) => setProp('loop', val)} />
              <ToggleInput label="Muted" value={getProp('muted') || false} onChange={(val) => setProp('muted', val)} />
              <ToggleInput label="Controls" value={getProp('controls') !== false} onChange={(val) => setProp('controls', val)} />
            </div>
          </div>
        </PropertySection>
      );

    case 'icon':
      return (
        <PropertySection title="Icon Config" icon={Smile} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Icon Name (Lucide)" value={getProp('iconName') || 'Smile'} onChange={(val) => setProp('iconName', val)} />
            <SliderInput label="Size" value={getProp('size') || 24} onChange={(val) => setProp('size', val)} min={12} max={128} />
            <ColorInput label="Icon Color" value={getProp('color') || '#001946'} onChange={(val) => setProp('color', val)} />
          </div>
        </PropertySection>
      );

    case 'divider':
      return (
        <PropertySection title="Divider Styles" icon={Minus}>
          <div className="space-y-4">
            <SliderInput label="Width %" value={parseInt(getProp('width') || '100')} onChange={(val) => setProp('width', `${val}%`)} min={10} max={100} unit="%" />
            <SliderInput label="Weight" value={getProp('weight') || 1} onChange={(val) => setProp('weight', val)} max={20} />
            <ColorInput label="Line Color" value={getProp('color') || '#E5E7EB'} onChange={(val) => setProp('color', val)} />
            <SegmentedControl 
              label="Line Style"
              value={getProp('borderStyle') || 'solid'}
              onChange={(val) => setProp('borderStyle', val)}
              options={[
                { value: 'solid', label: 'Sólido' },
                { value: 'dashed', label: 'Guiones' },
                { value: 'dotted', label: 'Puntos' },
              ]}
            />
          </div>
        </PropertySection>
      );

    case 'map':
      return (
        <PropertySection title="Map Config" icon={MapPin} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Address / Location" value={getProp('address') || 'New York, USA'} onChange={(val) => setProp('address', val)} />
            <SliderInput label="Zoom Level" value={getProp('zoom') || 15} onChange={(val) => setProp('zoom', val)} min={1} max={20} />
          </div>
        </PropertySection>
      );

    case 'product-grid':
      return (
        <PropertySection title="Product Grid" icon={Layout} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Section Title" value={getProp('title') || ''} onChange={(val) => setProp('title', val)} />
            <TextInput label="View All Text" value={getProp('viewAllText') || ''} onChange={(val) => setProp('viewAllText', val)} />
            <TextInput label="View All Link" value={getProp('viewAllHref') || ''} onChange={(val) => setProp('viewAllHref', val)} />
            <SliderInput label="Columns" value={getProp('columns') || 3} onChange={(val) => setProp('columns', val)} min={1} max={4} />
            <SliderInput label="Grid Gap" value={getProp('gap') || 16} onChange={(val) => setProp('gap', val)} min={0} max={64} />
            <ToggleInput label="Hide Header" value={getProp('hideHeader') || false} onChange={(val) => setProp('hideHeader', val)} />
            <ToggleInput label="Hide Price" value={getProp('hidePrice') || false} onChange={(val) => setProp('hidePrice', val)} />
          </div>
        </PropertySection>
      );

    case 'social':
      return (
        <PropertySection title="Social Links" icon={Smile} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Instagram URL" value={getProp('instagram') || ''} onChange={(val) => setProp('instagram', val)} placeholder="https://instagram.com/..." />
            <TextInput label="Facebook URL" value={getProp('facebook') || ''} onChange={(val) => setProp('facebook', val)} placeholder="https://facebook.com/..." />
            <TextInput label="WhatsApp Number/Link" value={getProp('whatsapp') || ''} onChange={(val) => setProp('whatsapp', val)} placeholder="https://wa.me/..." />
            <TextInput label="Twitter URL" value={getProp('twitter') || ''} onChange={(val) => setProp('twitter', val)} placeholder="https://twitter.com/..." />
          </div>
        </PropertySection>
      );

    case 'input':
      return (
        <PropertySection title="Field Settings" icon={Layout} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Label" value={getProp('label') || ''} onChange={(val) => setProp('label', val)} />
            <TextInput label="Placeholder" value={getProp('placeholder') || ''} onChange={(val) => setProp('placeholder', val)} />
            <SegmentedControl 
              label="Type"
              value={getProp('type') || 'text'}
              onChange={(val) => setProp('type', val)}
              options={[
                { value: 'text', label: 'Text', icon: Type },
                { value: 'email', label: 'Email', icon: Mail },
                { value: 'tel', label: 'Phone', icon: Phone },
              ]}
            />
            <ToggleInput label="Obligatorio" value={getProp('required') || false} onChange={(val) => setProp('required', val)} />
            <SegmentedControl 
              label="Estilo de Borde"
              value={getProp('borderStyle') || 'solid'}
              onChange={(val) => setProp('borderStyle', val)}
              options={[
                { value: 'solid', label: 'Sólido' },
                { value: 'none', label: 'Ninguno' },
                { value: 'underline', label: 'Línea Baja' },
              ]}
            />
          </div>
        </PropertySection>
      );

    case 'checkbox':
    case 'radio':
      return (
        <PropertySection title="Option Settings" icon={CheckSquare} defaultOpen={true}>
          <TextInput label="Label" value={getProp('label') || ''} onChange={(val) => setProp('label', val)} />
        </PropertySection>
      );

    case 'spacer':
      return (
        <PropertySection title="Spacer Settings" icon={Maximize}>
          <SliderInput label="Height" value={getProp('height') || 40} onChange={(val) => setProp('height', val)} max={200} />
        </PropertySection>
      );

    case 'footer':
      return (
        <PropertySection title="Footer Config" icon={Type} defaultOpen={true}>
          <TextInput label="Copyright Text" value={getProp('text') || ''} onChange={(val) => setProp('text', val)} />
        </PropertySection>
      );

    case 'navbar':
      return (
        <PropertySection title="Navbar Config" icon={Menu} defaultOpen={true}>
          <div className="space-y-4">
            <TextInput label="Store Name" value={getProp('storeName') || 'Avri Store'} onChange={(val) => setProp('storeName', val)} />
            <TextInput label="Logo URL (opcional)" value={getProp('logoUrl') || ''} onChange={(val) => setProp('logoUrl', val)} />
            <TextInput label="Menú Links (separados por coma)" value={getProp('menuLinks') || 'Inicio, Tienda, Contacto'} onChange={(val) => setProp('menuLinks', val)} />
            <ToggleInput 
              label="Menú Fijo (Sticky)" 
              value={getProp('sticky') !== false} 
              onChange={(val) => setProp('sticky', val)} 
            />
          </div>
        </PropertySection>
      );

    default:
      return null;
  }
};
