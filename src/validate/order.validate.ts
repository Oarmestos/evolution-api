import { JSONSchema7 } from 'json-schema';
import { v4 } from 'uuid';

export const orderSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    remoteJid: { type: 'string', minLength: 1 },
    customerName: { type: 'string' },
    customerPhone: { type: 'string' },
    shippingAddress: { type: 'string' },
    shippingCity: { type: 'string' },
    paymentMethod: { type: 'string' },
    transactionId: { type: 'string' },
    status: { type: 'string', enum: ['PENDING', 'PAID', 'SHIPPED', 'CANCELED'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
        },
        required: ['productId', 'quantity'],
      },
      minItems: 1,
    },
  },
  required: ['remoteJid', 'items'],
};
