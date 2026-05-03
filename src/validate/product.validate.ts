import { JSONSchema7 } from 'json-schema';
import { v4 } from 'uuid';

export const productSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    price: { type: 'number', minimum: 0 },
    imageUrl: { type: 'string' },
    stock: { type: 'integer', minimum: 0 },
    enabled: { type: 'boolean' },
  },
  required: ['name', 'price'],
};
