import type { Block, BlockType } from '../types/builder.types';

export const generateId = () => crypto.randomUUID();

export const createPresetBlock = (type: BlockType, preset?: string): Block => {
  if (type === 'Hero') {
    return {
      id: generateId(),
      type: 'Container',
      props: {
        backgroundColor: '#001946',
        padding: '120px 40px',
        borderRadius: '24px',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        color: '#ffffff'
      },
      children: [
        {
          id: generateId(),
          type: 'Heading',
          props: { text: 'AVRI LUXURY STORE', fontSize: '64px', fontWeight: '900', textAlign: 'center' }
        },
        {
          id: generateId(),
          type: 'Text',
          props: { text: 'La experiencia premium para tu negocio de WhatsApp', fontSize: '18px', textAlign: 'center', opacity: '0.8' }
        },
        {
          id: generateId(),
          type: 'Button',
          props: { 
            text: 'VER CATÁLOGO', 
            backgroundColor: '#00E5FF', 
            color: '#001946',
            padding: '16px 40px',
            borderRadius: '99px',
            fontWeight: '900'
          }
        }
      ]
    };
  }

  if (type === 'Footer') {
    return {
      id: generateId(),
      type: 'Container',
      props: { backgroundColor: '#f8fafc', padding: '60px 40px', alignItems: 'center' },
      children: [
        { id: generateId(), type: 'Text', props: { text: '© 2026 Avri Store. Todos los derechos reservados.', fontSize: '12px', color: '#64748b' } }
      ]
    };
  }

  if (type === 'Container' && preset === '2-columns') {
    return {
      id: generateId(),
      type: 'Container',
      props: {
        flexDirection: 'row',
        gap: '16px',
        alignItems: 'stretch',
      },
      children: [
        {
          id: generateId(),
          type: 'Container',
          props: { width: '50%', flexDirection: 'column' },
          children: []
        },
        {
          id: generateId(),
          type: 'Container',
          props: { width: '50%', flexDirection: 'column' },
          children: []
        }
      ]
    };
  }

  return {
    id: generateId(),
    type,
    props: {},
    children: type === 'Container' || type === 'Form' ? [] : undefined
  };
};

export const upgradeBlockLogic = (
  blocks: Block[], 
  id: string, 
  target?: 'title' | 'subtitle' | 'button' | 'link'
): { newBlocks: Block[]; selectedId: string | null } => {
  let selectedId: string | null = null;
  
  const upgrade = (blocksList: Block[]): Block[] => {
    return blocksList.map(b => {
      if (b.id === id) {
        if (b.type === 'Hero') {
          const titleId = generateId();
          const subtitleId = generateId();
          const buttonId = generateId();
          
          if (target === 'title') selectedId = titleId;
          else if (target === 'subtitle') selectedId = subtitleId;
          else if (target === 'button') selectedId = buttonId;
          else selectedId = b.id;

          const isLightBg = b.props.backgroundColor && (
            b.props.backgroundColor.toLowerCase() === '#ffffff' || 
            b.props.backgroundColor.toLowerCase() === 'white'
          );
          const textColor = isLightBg ? '#001946' : (b.props.color || '#ffffff');

          return {
            ...b,
            type: 'Container',
            props: {
              ...b.props,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              padding: '120px 40px',
            },
            children: [
              {
                id: titleId,
                type: 'Heading',
                props: { text: b.props.title || 'AVRI LUXURY STORE', fontSize: '64px', fontWeight: '900', textAlign: 'center', color: textColor }
              },
              {
                id: subtitleId,
                type: 'Text',
                props: { text: b.props.subtitle || 'La experiencia premium para tu negocio', fontSize: '18px', textAlign: 'center', opacity: '0.8', color: textColor }
              },
              {
                id: buttonId,
                type: 'Button',
                props: { 
                  text: b.props.ctaText || 'VER CATÁLOGO', 
                  backgroundColor: b.props.btnBg || '#00E5FF', 
                  color: b.props.btnColor || '#001946',
                  borderRadius: `${b.props.btnRadius ?? 99}px`,
                  padding: '16px 40px',
                  fontWeight: '900'
                }
              }
            ]
          };
        }

        if (b.type === 'ProductGrid') {
          const titleId = generateId();
          const viewAllId = generateId();
          
          if (target === 'title') selectedId = titleId;
          else if (target === 'link') selectedId = viewAllId;
          else selectedId = b.id;

          return {
            ...b,
            type: 'Container',
            props: {
              ...b.props,
              flexDirection: 'column',
              gap: '32px',
              padding: '80px 40px',
            },
            children: [
              {
                id: generateId(),
                type: 'Container',
                props: { 
                  flexDirection: 'row', 
                  alignItems: 'flex-end', 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f1f5f9'
                },
                children: [
                  {
                    id: titleId,
                    type: 'Heading',
                    props: { 
                      text: b.props.title || 'Nuestros Destacados', 
                      fontSize: '24px', 
                      fontWeight: '900', 
                      textTransform: 'uppercase',
                      color: '#001946'
                    }
                  },
                  {
                    id: viewAllId,
                    type: 'Text',
                    props: { 
                      text: b.props.viewAllText || 'VER TODO', 
                      fontSize: '10px', 
                      fontWeight: '900', 
                      color: '#00E5FF', 
                      textTransform: 'uppercase'
                    }
                  }
                ]
              },
              {
                id: generateId(),
                type: 'ProductGrid',
                props: { columns: b.props.columns || 3, hideHeader: true }
              }
            ]
          };
        }

        if (b.type === 'Footer') {
          const textId = generateId();
          selectedId = textId;
          return {
            ...b,
            type: 'Container',
            props: { ...b.props, padding: '60px 40px', alignItems: 'center' },
            children: [
              { id: textId, type: 'Text', props: { text: b.props.text || '© 2026 Avri Store. Todos los derechos reservados.', fontSize: '12px', color: '#64748b' } }
            ]
          };
        }
      }
      if (b.children) {
        return { ...b, children: upgrade(b.children) };
      }
      return b;
    });
  };

  return { newBlocks: upgrade(blocks), selectedId };
};
