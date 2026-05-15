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

export interface GlobalSettings {
  siteName: string;
  maxWidth: number;
  primaryFont: string;
  logoUrl: string;
  heroImageUrl: string;
  primaryColor: string;
  syncWhatsapp: boolean;
  customCss: string;
}

export interface AvriBuilderState {
  blocks: Block[];
  selectedBlockId: string | null;
  activePanel: 'blocks' | 'layers' | 'settings';
  device: ViewportDevice;
  history: Block[][];
  historyIndex: number;
  loadedInstanceId: string | null;
  globalSettings: GlobalSettings;
  
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
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  
  // Persistence
  save: () => Promise<boolean>;
}
