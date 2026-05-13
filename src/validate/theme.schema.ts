import { JSONSchema7 } from 'json-schema';
import { v4 } from 'uuid';

export const themeSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    template: { type: 'string' },
    storeName: { type: 'string' },
    logoUrl: { type: 'string', format: 'uri' },
    heroTitle: { type: 'string' },
    heroSubtitle: { type: 'string' },
    heroImageUrl: { type: 'string', format: 'uri' },
    footerText: { type: 'string' },
    primaryColor: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
    buttonColor: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
    bgColor: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
    fontFamily: { type: 'string' },
    textColor: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
    ctaText: { type: 'string' },
    borderRadius: { type: 'integer', minimum: 0 },
    instagramUrl: { type: 'string', format: 'uri' },
    tiktokUrl: { type: 'string', format: 'uri' },
    syncWhatsapp: { type: 'boolean' },
    layout: { type: 'object' },
  },
};
