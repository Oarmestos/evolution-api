import { create } from 'zustand';
import { AVRI_LUXURY_LAYOUT } from './defaultLayout';
import type { Block, AvriBuilderState } from '../types/builder.types';
import { generateId, createPresetBlock, upgradeBlockLogic } from './builderPresets';

let historyTimeout: ReturnType<typeof setTimeout> | null = null;

export const useAvriBuilderStore = create<AvriBuilderState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  activePanel: 'blocks',
  device: 'desktop',
  history: [[]],
  historyIndex: 0,
  loadedInstanceId: null,
  globalSettings: {
    siteName: 'Mi Tienda Online',
    maxWidth: 1200,
    primaryFont: 'Inter',
    logoUrl: '',
    heroImageUrl: '',
    primaryColor: '#00E5FF',
    syncWhatsapp: false,
    customCss: '',
  },

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
    const blocksClone = JSON.parse(JSON.stringify(blocks));
    const lastHistoryEntry = history[historyIndex];

    if (lastHistoryEntry && JSON.stringify(lastHistoryEntry) === JSON.stringify(blocksClone)) {
      return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    const updatedHistory = [...newHistory, blocksClone];
    const finalHistory = updatedHistory.length > 50 ? updatedHistory.slice(updatedHistory.length - 50) : updatedHistory;
    
    set({ 
      history: finalHistory,
      historyIndex: finalHistory.length - 1
    });
  },

  addBlock: (type, parentId, preset) => {
    const newBlock = createPresetBlock(type, preset);

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
            while (newChildren.length < columns) {
              newChildren.push({
                id: generateId(),
                type: 'Container',
                props: { width: `${100 / columns}%`, flexDirection: 'column' },
                children: []
              });
            }
            if (newChildren.length > columns) {
              newChildren = newChildren.slice(0, columns);
            }
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
            return { ...b, props: { ...b.props, flexDirection: 'column' } };
          }
        }
        if (b.children) return { ...b, children: update(b.children) };
        return b;
      });
    };
    get().setBlocks(update(get().blocks), true);
  },

  updateGlobalSettings: (settings) => {
    set({ globalSettings: { ...get().globalSettings, ...settings } });
    get().commitHistory();
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

  moveBlock: (blockId, targetIndex) => {
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
        const theme = useThemeConfigStore.getState().theme;
        let blocks: Block[] = [];

        if (themeLayout.id === 'root' && themeLayout.type === 'Container' && Array.isArray(themeLayout.children)) {
          blocks = JSON.parse(JSON.stringify(themeLayout.children));
        } else if (Array.isArray(themeLayout.content)) {
          blocks = JSON.parse(JSON.stringify(themeLayout.content));
        } else if (Array.isArray(themeLayout.children)) {
          blocks = JSON.parse(JSON.stringify(themeLayout.children));
        } else if (Array.isArray(themeLayout)) {
          blocks = JSON.parse(JSON.stringify(themeLayout));
        }

        if (blocks.length > 0) {
          set({ 
            blocks,
            history: [blocks],
            historyIndex: 0,
            selectedBlockId: null,
            loadedInstanceId: instanceId,
            globalSettings: {
              siteName: theme.storeName || 'Mi Tienda Online',
              maxWidth: theme.layout?.props?.maxWidth || 1200,
              primaryFont: theme.fontFamily || 'Inter',
              logoUrl: theme.logoUrl || '',
              heroImageUrl: theme.heroImageUrl || '',
              primaryColor: theme.primaryColor || '#00E5FF',
              syncWhatsapp: theme.syncWhatsapp || false,
              customCss: theme.layout?.props?.customCss || '',
            }
          });
          return;
        }
      }

      const theme = useThemeConfigStore.getState().theme;
      const defaultBlocks = JSON.parse(JSON.stringify(AVRI_LUXURY_LAYOUT.children));
      set({ 
        blocks: defaultBlocks,
        history: [defaultBlocks],
        historyIndex: 0,
        selectedBlockId: null,
        loadedInstanceId: instanceId,
        globalSettings: {
          siteName: theme.storeName || 'Mi Tienda Online',
          maxWidth: 1200,
          primaryFont: theme.fontFamily || 'Inter',
          logoUrl: theme.logoUrl || '',
          heroImageUrl: theme.heroImageUrl || '',
          primaryColor: theme.primaryColor || '#00E5FF',
          syncWhatsapp: theme.syncWhatsapp || false,
          customCss: '',
        }
      });
    } catch (error) {
      console.error('Error initializing builder from theme:', error);
    }
  },

  upgradeBlock: (id, target) => {
    const { newBlocks, selectedId } = upgradeBlockLogic(get().blocks, id, target);
    get().setBlocks(newBlocks, true);
    if (selectedId) set({ selectedBlockId: selectedId });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      set({ 
        historyIndex: historyIndex - 1,
        blocks: history[historyIndex - 1],
        selectedBlockId: null
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      set({ 
        historyIndex: historyIndex + 1,
        blocks: history[historyIndex + 1],
        selectedBlockId: null
      });
    }
  },

  save: async () => {
    try {
      const { blocks, globalSettings } = get();
      const themeStore = (await import('./useThemeConfigStore')).useThemeConfigStore;
      
      themeStore.getState().updateTheme({
        storeName: globalSettings.siteName,
        logoUrl: globalSettings.logoUrl,
        heroImageUrl: globalSettings.heroImageUrl,
        fontFamily: globalSettings.primaryFont,
        primaryColor: globalSettings.primaryColor,
        syncWhatsapp: globalSettings.syncWhatsapp,
        layout: {
          id: 'root',
          type: 'Container',
          props: {
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            maxWidth: globalSettings.maxWidth,
            customCss: globalSettings.customCss
          },
          children: blocks
        }
      });

      await themeStore.getState().saveTheme();
      return true;
    } catch (error) {
      console.error('Error saving builder state:', error);
      return false;
    }
  },
}));
