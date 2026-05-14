import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import type { ViewportDevice, Block } from '../../../../store/useAvriBuilderStore';

export type ResponsiveValue<T> = {
  desktop: T;
  tablet?: T;
  mobile?: T;
};

export const resolveResponsive = (value: any, device: ViewportDevice) => {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'object' || Array.isArray(value)) return value; // Backward compatibility with string/number values

  if (device === 'mobile' && value.mobile !== undefined && value.mobile !== null && value.mobile !== '') return value.mobile;
  if ((device === 'mobile' || device === 'tablet') && value.tablet !== undefined && value.tablet !== null && value.tablet !== '') return value.tablet;
  return value.desktop;
};

export const updateResponsive = (currentValue: any, device: ViewportDevice, newValue: any) => {
  if (currentValue === undefined || currentValue === null || typeof currentValue !== 'object' || Array.isArray(currentValue)) {
    // If setting desktop value and it has no previous state, just return string (keeps JSON clean)
    if (device === 'desktop') return newValue;
    // Upgrading to responsive object
    return { desktop: currentValue ?? '', [device]: newValue };
  }
  
  // If we are clearing a value on desktop, we might want to clear the whole object if it's empty, 
  // but for safety, just update the property.
  return { ...currentValue, [device]: newValue };
};

export const useResponsiveProps = (block: Block) => {
  const { device, updateBlockProps } = useAvriBuilderStore();
  
  const getProp = (propName: string) => resolveResponsive(block.props[propName], device);
  
  const setProp = (propName: string, value: any) => {
    updateBlockProps(block.id, {
      [propName]: updateResponsive(block.props[propName], device, value)
    });
  };

  return { getProp, setProp };
};
