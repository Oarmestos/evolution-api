/**
 * Smartly converts a value to a CSS string with units if necessary
 */
export const toCSSValue = (val: string | number | undefined, defaultUnit = 'px'): string | undefined => {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return `${val}${defaultUnit}`;
  
  const strVal = val.toString().trim();
  if (strVal === 'auto' || strVal === 'none' || strVal === 'inherit' || strVal === 'initial' || strVal === 'unset') return strVal;
  
  // If it's a string that already has a unit (px, %, em, rem, vh, vw, etc.)
  if (/[a-z%]$/i.test(strVal)) return strVal;
  
  // If it's a numeric string, add default unit
  if (!isNaN(Number(strVal))) return `${strVal}${defaultUnit}`;
  
  return strVal;
};
