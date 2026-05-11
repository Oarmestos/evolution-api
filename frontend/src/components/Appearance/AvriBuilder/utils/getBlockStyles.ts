import React from 'react';
import type { Block } from '../../../../store/useAvriBuilderStore';
import { toCSSValue } from '../../../../utils/toCSSValue';

export const getBlockStyles = (block: Block): React.CSSProperties => {
  const p = block.props;
  const isFlex = (block.type === 'Container' || block.type === 'Hero' || block.type === 'Footer' || block.type === 'Form');

  return {
    // Layout
    display: isFlex ? 'flex' : undefined,
    flexDirection: p.flexDirection || 'column',
    alignItems: p.alignItems || 'stretch',
    justifyContent: p.justifyContent || 'flex-start',
    alignSelf: p.alignSelf,
    gap: toCSSValue(p.gap),
    
    // Size
    width: p.width === 'auto' ? 'fit-content' : (toCSSValue(p.width) || (isFlex ? '100%' : undefined)),
    height: toCSSValue(p.height) || 'auto',
    minWidth: toCSSValue(p.minWidth),
    minHeight: toCSSValue(p.minHeight),
    maxWidth: toCSSValue(p.maxWidth),
    maxHeight: toCSSValue(p.maxHeight),
    
    // Space (Padding)
    paddingTop: toCSSValue(p.paddingTop) || toCSSValue(p.padding),
    paddingRight: toCSSValue(p.paddingRight) || toCSSValue(p.padding),
    paddingBottom: toCSSValue(p.paddingBottom) || toCSSValue(p.padding),
    paddingLeft: toCSSValue(p.paddingLeft) || toCSSValue(p.padding),
    
    // Space (Margin moved to Renderer for builder precision)
    
    // Aesthetics
    backgroundColor: p.backgroundColor,
    backgroundImage: p.bgImage ? `url(${p.bgImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: p.color,
    borderRadius: toCSSValue(p.borderRadius),
    borderWidth: toCSSValue(p.borderWidth),
    borderColor: p.borderColor,
    borderStyle: p.borderStyle || (p.borderWidth ? 'solid' : undefined),
    
    // Typography
    fontFamily: p.fontFamily,
    fontSize: toCSSValue(p.fontSize),
    fontWeight: p.fontWeight,
    textAlign: p.textAlign as any,
    lineHeight: p.lineHeight,
    letterSpacing: toCSSValue(p.letterSpacing),
    textTransform: p.textTransform as any,
    
    // Effects
    opacity: p.opacity,
    boxShadow: p.boxShadow,
    transition: 'all 0.3s ease',
  };
};
