import type { Block } from '../../../store/useAvriBuilderStore';

export interface LibraryProps {
  block: Block;
  Renderer: React.FC<{ block: Block }>;
  readOnly?: boolean;
}

export * from './blocks/ContentBlocks';
export * from './blocks/MediaBlocks';
export * from './blocks/LayoutBlocks';
export * from './blocks/FormBlocks';
export * from './blocks/CommerceBlocks';
