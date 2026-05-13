import { describe, expect, it } from 'vitest';
import { Validator } from 'jsonschema';
import { themeSchema } from '../src/validate/theme.schema';

const v = new Validator();

describe('Theme Schema Validation', () => {
  it('should validate a correct theme object', () => {
    const validTheme = {
      template: 'moderno',
      storeName: 'My Store',
      primaryColor: '#ff0000',
      borderRadius: 10,
      syncWhatsapp: true,
    };

    const result = v.validate(validTheme, themeSchema as any);
    expect(result.valid).toBe(true);
  });

  it('should fail on invalid hex color', () => {
    const invalidTheme = {
      primaryColor: 'invalid-color',
    };

    const result = v.validate(invalidTheme, themeSchema as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0].property).toContain('primaryColor');
  });

  it('should fail on negative border radius', () => {
    const invalidTheme = {
      borderRadius: -1,
    };

    const result = v.validate(invalidTheme, themeSchema as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0].property).toContain('borderRadius');
  });

  it('should fail on invalid URI format', () => {
    const invalidTheme = {
      logoUrl: 'not-a-url',
    };

    const result = v.validate(invalidTheme, themeSchema as any);
    // Note: JSONSchema format validation might require a custom formatter in jsonschema lib
    // but the type check should at least be string. 
    // Let's test basic validation for now.
    expect(result.valid).toBe(false);
  });
});
