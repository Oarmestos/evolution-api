import { create } from 'zustand';
import { AVRI_LUXURY_LAYOUT } from './defaultLayout';

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
  loadedInstanceId: string | null;
  
  // Actions
  setBlocks: (blocks: Block[], immediate?: boolean) => void;
  commitHistory: () => void;
  addBlock: (type: BlockType, parentId?: string, preset?: string) => void;
  updateBlockProps: (id: string, props: any) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (blockId: string, targetIndex: number, newParentId?: string) => void;
  selectBlock: (id: string | null) => void;
  setActivePanel: (panel: 'blocks' | 'layers' | 'settings') => void;
  setDevice: (device: ViewportDevice) => void;
  upgradeBlock: (id: string, target?: 'title' | 'subtitle' | 'button' | 'link') => void;
  initFromTheme: (layout: any | undefined, instanceId: string) => void;
  
  setContainerColumns: (id: string, columns: number) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  
  // Persistence
  save: () => Promise<boolean>;
}

let historyTimeout: ReturnType<typeof setTimeout> | null = null;

export const useAvriBuilderStore = create<AvriBuilderState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  activePanel: 'blocks',
  device: 'desktop',
  history: [[]],
  historyIndex: 0,
  loadedInstanceId: null,

  setBlocks: (blocks, immediate = true) => {
    set({ blocks });
    
    if (immediate) {
      get().commitHistory();
    } else {
      if (historyTimeout) clearTimeout(historyTimeout);
      historyTimeout = setTimeout(() => {
        get().commitHistory();
      }, 500);
    }
  },

  commitHistory: () => {
    const { history, historyIndex, blocks } = get();
    // Verify it's actually different from the last state to avoid redundant commits
    const newHistory = history.slice(0, historyIndex + 1);
    set({ 
      history: [...newHistory, blocks],
      historyIndex: newHistory.length
    });
  },

  addBlock: (type, parentId, preset) => {
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
          { id: generateId(), type: 'Text', props: { text: '© 2026 Avri Store. Todos los derechos reservados.', fontSize: '12px', color: '#64748b' } }
        ]
      };
    } else if (type === 'Container' && preset === '2-columns') {
      newBlock = {
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
    } else {
      newBlock = {
        id: generateId(),
        type,
        props: {},
        children: type === 'Container' || type === 'Form' ? [] : undefined
      };
    }

    if (!parentId) {
      get().setBlocks([...get().blocks, newBlock], true);
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
      get().setBlocks(updateChildren(get().blocks), true);
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
    get().setBlocks(update(get().blocks), false);
  },

  setContainerColumns: (id, columns) => {
    const update = (blocks: Block[]): Block[] => {
      return blocks.map(b => {
        if (b.id === id && b.type === 'Container') {
          const currentChildren = b.children || [];
          let newChildren = [...currentChildren];

          if (columns > 0) {
            // Add missing columns if needed
            while (newChildren.length < columns) {
              newChildren.push({
                id: generateId(),
                type: 'Container',
                props: { width: `${100 / columns}%`, flexDirection: 'column' },
                children: []
              });
            }
            // Remove extra columns if needed
            if (newChildren.length > columns) {
              newChildren = newChildren.slice(0, columns);
            }
            // Update widths for all columns
            newChildren = newChildren.map(child => ({
              ...child,
              props: { ...child.props, width: `${100 / columns}%` }
            }));

            return { 
              ...b, 
              props: { ...b.props, flexDirection: 'row', gap: b.props.gap || '16px', alignItems: 'stretch' },
              children: newChildren 
            };
          } else {
            // If 0 columns or reset, maybe just return normal container
            return {
              ...b,
              props: { ...b.props, flexDirection: 'column' }
            };
          }
        }
        if (b.children) {
          return { ...b, children: update(b.children) };
        }
        return b;
      });
    };
    get().setBlocks(update(get().blocks), true);
  },

  deleteBlock: (id) => {
    const remove = (blocks: Block[]): Block[] => {
      return blocks
        .filter(b => b.id !== id)
        .map(b => (b.children ? { ...b, children: remove(b.children) } : b));
    };
    get().setBlocks(remove(get().blocks), true);
    if (get().selectedBlockId === id) set({ selectedBlockId: null });
  },

  moveBlock: (blockId, targetIndex, _newParentId) => {
    // Move block within root-level blocks
    const blocks = [...get().blocks];
    const fromIndex = blocks.findIndex(b => b.id === blockId);
    if (fromIndex === -1 || fromIndex === targetIndex) return;
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(targetIndex, 0, moved);
    get().setBlocks(blocks, true);
  },

  selectBlock: (id) => set({ selectedBlockId: id }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setDevice: (device) => set({ device }),
  
  initFromTheme: async (layout, instanceId) => {
    try {
      const { useThemeConfigStore } = await import('./useThemeConfigStore');
      const themeLayout = layout || useThemeConfigStore.getState().theme.layout;
      
      if (themeLayout) {
        let blocks: Block[] = [];

        // Case 1: New root structure (Container with id 'root')
        if (themeLayout.id === 'root' && themeLayout.type === 'Container' && Array.isArray(themeLayout.children)) {
          blocks = JSON.parse(JSON.stringify(themeLayout.children));
        } 
        // Case 2: Old structure with 'content' array
        else if (Array.isArray(themeLayout.content)) {
          blocks = JSON.parse(JSON.stringify(themeLayout.content));
        }
        // Case 3: Structure with 'children' array (but not root container)
        else if (Array.isArray(themeLayout.children)) {
          blocks = JSON.parse(JSON.stringify(themeLayout.children));
        }
        // Case 4: Direct array
        else if (Array.isArray(themeLayout)) {
          blocks = JSON.parse(JSON.stringify(themeLayout));
        }

        if (blocks.length > 0) {
          set({ 
            blocks,
            history: [blocks],
            historyIndex: 0,
            selectedBlockId: null,
            loadedInstanceId: instanceId
          });
          return;
        }
      }

      // If no valid layout found, fallback to luxury default
      const defaultBlocks = JSON.parse(JSON.stringify(AVRI_LUXURY_LAYOUT.children));
      set({ 
        blocks: defaultBlocks,
        history: [defaultBlocks],
        historyIndex: 0,
        selectedBlockId: null,
        loadedInstanceId: instanceId
      });
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
    
    const newBlocks = upgrade(get().blocks);
    get().setBlocks(newBlocks, true);
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
