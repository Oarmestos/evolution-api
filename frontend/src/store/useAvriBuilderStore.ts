import { create } from 'zustand';

const generateId = () => crypto.randomUUID();

export type BlockType = 
  | 'Container' 
  | 'Heading' 
  | 'Text' 
  | 'Image' 
  | 'Video' 
  | 'Map' 
  | 'Icon' 
  | 'Divider' 
  | 'Form' 
  | 'Input' 
  | 'Button' 
  | 'Checkbox' 
  | 'Radio' 
  | 'Label' 
  | 'Navbar'
  | 'Hero'
  | 'Spacer'
  | 'ProductGrid'
  | 'Footer';

export interface Block {
  id: string;
  type: BlockType;
  props: any;
  children?: Block[];
}

export type ViewportDevice = 'desktop' | 'tablet' | 'mobile';

interface AvriBuilderState {
  blocks: Block[];
  selectedBlockId: string | null;
  activePanel: 'blocks' | 'layers' | 'settings';
  device: ViewportDevice;
  history: Block[][];
  historyIndex: number;
  
  // Actions
  setBlocks: (blocks: Block[]) => void;
  addBlock: (type: BlockType, parentId?: string) => void;
  updateBlockProps: (id: string, props: any) => void;
  deleteBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  setActivePanel: (panel: 'blocks' | 'layers' | 'settings') => void;
  setDevice: (device: ViewportDevice) => void;
  upgradeBlock: (id: string, target?: 'title' | 'subtitle' | 'button' | 'link') => void;
  initFromTheme: () => void;
  
  // History
  undo: () => void;
  redo: () => void;
  
  // Persistence
  save: () => Promise<boolean>;
}

export const useAvriBuilderStore = create<AvriBuilderState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  activePanel: 'blocks',
  device: 'desktop',
  history: [[]],
  historyIndex: 0,

  setBlocks: (blocks) => {
    const newHistory = get().history.slice(0, get().historyIndex + 1);
    set({ 
      blocks, 
      history: [...newHistory, blocks],
      historyIndex: newHistory.length
    });
  },

  addBlock: (type, parentId) => {
    let newBlock: Block;

    if (type === 'Hero') {
      newBlock = {
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
    } else if (type === 'Footer') {
      newBlock = {
        id: generateId(),
        type: 'Container',
        props: { backgroundColor: '#f8fafc', padding: '60px 40px', alignItems: 'center' },
        children: [
          { id: generateId(), type: 'Text', props: { text: '© 2024 Avri Store. Todos los derechos reservados.', fontSize: '12px', color: '#64748b' } }
        ]
      };
    } else {
      newBlock = {
        id: generateId(),
        type,
        props: {},
        children: type === 'Container' || type === 'Form' ? [] : undefined
      };
    }

    if (!parentId) {
      get().setBlocks([...get().blocks, newBlock]);
    } else {
      const updateChildren = (blocks: Block[]): Block[] => {
        return blocks.map(b => {
          if (b.id === parentId) {
            return { ...b, children: [...(b.children || []), newBlock] };
          }
          if (b.children) {
            return { ...b, children: updateChildren(b.children) };
          }
          return b;
        });
      };
      get().setBlocks(updateChildren(get().blocks));
    }
    set({ selectedBlockId: newBlock.id });
  },

  updateBlockProps: (id, props) => {
    const update = (blocks: Block[]): Block[] => {
      return blocks.map(b => {
        if (b.id === id) {
          return { ...b, props: { ...b.props, ...props } };
        }
        if (b.children) {
          return { ...b, children: update(b.children) };
        }
        return b;
      });
    };
    get().setBlocks(update(get().blocks));
  },

  deleteBlock: (id) => {
    const remove = (blocks: Block[]): Block[] => {
      return blocks
        .filter(b => b.id !== id)
        .map(b => (b.children ? { ...b, children: remove(b.children) } : b));
    };
    get().setBlocks(remove(get().blocks));
    if (get().selectedBlockId === id) set({ selectedBlockId: null });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setDevice: (device) => set({ device }),
  
  initFromTheme: async () => {
    try {
      const { useThemeConfigStore } = await import('./useThemeConfigStore');
      const themeLayout = useThemeConfigStore.getState().theme.layout;
      
      if (themeLayout) {
        // If it's the new root structure
        if (themeLayout.id === 'root' && themeLayout.type === 'Container') {
          const blocks = JSON.parse(JSON.stringify(themeLayout.children || []));
          set({ 
            blocks,
            history: [blocks],
            historyIndex: 0,
            selectedBlockId: null
          });
          return;
        }

        // If it's the old content array structure
        if (Array.isArray(themeLayout.content)) {
          const blocks = JSON.parse(JSON.stringify(themeLayout.content));
          set({ 
            blocks,
            history: [blocks],
            historyIndex: 0,
            selectedBlockId: null
          });
        }
      }
    } catch (error) {
      console.error('Error initializing builder from theme:', error);
    }
  },

  upgradeBlock: (id, target) => {
    let selectedId: string | null = null;
    
    const upgrade = (blocks: Block[]): Block[] => {
      return blocks.map(b => {
        if (b.id === id) {
          if (b.type === 'Hero') {
            const titleId = generateId();
            const subtitleId = generateId();
            const buttonId = generateId();
            
            if (target === 'title') selectedId = titleId;
            else if (target === 'subtitle') selectedId = subtitleId;
            else if (target === 'button') selectedId = buttonId;
            else selectedId = b.id;

            // Detect if background is light (simple heuristic)
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
                { id: textId, type: 'Text', props: { text: b.props.text || '© 2024 Avri Store. Todos los derechos reservados.', fontSize: '12px', color: '#64748b' } }
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
    
    const newBlocks = upgrade(get().blocks);
    get().setBlocks(newBlocks);
    if (selectedId) set({ selectedBlockId: selectedId });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      set({ 
        historyIndex: historyIndex - 1,
        blocks: history[historyIndex - 1]
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      set({ 
        historyIndex: historyIndex + 1,
        blocks: history[historyIndex + 1]
      });
    }
  },

  save: async () => {
    try {
      const { blocks } = get();
      const themeStore = (await import('./useThemeConfigStore')).useThemeConfigStore;
      const currentLayout = themeStore.getState().theme.layout;
      
      // Update the theme's layout with a proper root block
      themeStore.getState().updateTheme({
        layout: {
          id: 'root',
          type: 'Container',
          props: currentLayout?.props || currentLayout?.root?.props || {
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: '100vh',
            backgroundColor: '#ffffff'
          },
          children: blocks
        }
      });

      // Persist to server
      await themeStore.getState().saveTheme();
      return true;
    } catch (error) {
      console.error('Error saving builder state:', error);
      return false;
    }
  }
}));
