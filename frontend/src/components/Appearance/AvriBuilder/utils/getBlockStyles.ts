import React from 'react';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import type { Block, ViewportDevice } from '../../../../store/useAvriBuilderStore';
import { toCSSValue } from '../../../../utils/toCSSValue';
import { resolveResponsive } from './responsive';

export const getBlockStyles = (block: Block, device?: ViewportDevice): React.CSSProperties => {
  const p = block.props;
  const currentDevice = device || useAvriBuilderStore.getState().device;
  const resolve = (val: any) => resolveResponsive(val, currentDevice);
  
  const isFlex = (block.type === 'Container' || block.type === 'Hero' || block.type === 'Footer' || block.type === 'Form');

  return {
    // Layout
    display: isFlex ? 'flex' : undefined,
    flexDirection: resolve(p.flexDirection) || 'column',
    alignItems: resolve(p.alignItems) || 'stretch',
    justifyContent: resolve(p.justifyContent) || 'flex-start',
    alignSelf: resolve(p.alignSelf),
    gap: toCSSValue(resolve(p.gap)),
    
    // Size
    width: resolve(p.width) === 'auto' ? 'fit-content' : (toCSSValue(resolve(p.width)) || (isFlex ? '100%' : undefined)),
    height: toCSSValue(resolve(p.height)) || 'auto',
    minWidth: toCSSValue(resolve(p.minWidth)),
    minHeight: toCSSValue(resolve(p.minHeight)),
    maxWidth: toCSSValue(resolve(p.maxWidth)),
    maxHeight: toCSSValue(resolve(p.maxHeight)),
    
    // Space (Padding)
    paddingTop: toCSSValue(resolve(p.paddingTop)) || toCSSValue(resolve(p.padding)),
    paddingRight: toCSSValue(resolve(p.paddingRight)) || toCSSValue(resolve(p.padding)),
    paddingBottom: toCSSValue(resolve(p.paddingBottom)) || toCSSValue(resolve(p.padding)),
    paddingLeft: toCSSValue(resolve(p.paddingLeft)) || toCSSValue(resolve(p.padding)),
    
    // Space (Margin moved to Renderer for builder precision)
    
    // Aesthetics
    backgroundColor: resolve(p.backgroundColor),
    backgroundImage: resolve(p.bgImage) ? `url(${resolve(p.bgImage)})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: resolve(p.color),
    borderRadius: toCSSValue(resolve(p.borderRadius)),
    borderWidth: toCSSValue(resolve(p.borderWidth)),
    borderColor: resolve(p.borderColor),
    borderStyle: resolve(p.borderStyle) || (resolve(p.borderWidth) ? 'solid' : undefined),
    
    // Typography
    fontFamily: resolve(p.fontFamily),
    fontSize: toCSSValue(resolve(p.fontSize)),
    fontWeight: resolve(p.fontWeight),
    textAlign: resolve(p.textAlign) as any,
    lineHeight: resolve(p.lineHeight),
    letterSpacing: toCSSValue(resolve(p.letterSpacing)),
    textTransform: resolve(p.textTransform) as any,
    
    // Effects
    opacity: resolve(p.opacity),
    boxShadow: resolve(p.boxShadow),
    overflow: resolve(p.overflow) as any,
    transition: 'all 0.3s ease',
  };
};
