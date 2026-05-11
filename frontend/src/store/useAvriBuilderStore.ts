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
  | 'Navbar';

export interface Block {
  id: string;
  type: BlockType;
  props: any;
  children?: Block[];
}

interface AvriBuilderState {
  blocks: Block[];
  selectedBlockId: string | null;
  activePanel: 'blocks' | 'layers' | 'settings';
  history: Block[][];
  historyIndex: number;
  
  // Actions
  setBlocks: (blocks: Block[]) => void;
  addBlock: (type: BlockType, parentId?: string) => void;
  updateBlockProps: (id: string, props: any) => void;
  deleteBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  setActivePanel: (panel: 'blocks' | 'layers' | 'settings') => void;
  
  // History
  undo: () => void;
  redo: () => void;
}

export const useAvriBuilderStore = create<AvriBuilderState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  activePanel: 'blocks',
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
    const newBlock: Block = {
      id: generateId(),
      type,
      props: {},
      children: type === 'Container' ? [] : undefined
    };

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
  }
}));
