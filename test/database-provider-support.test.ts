import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const requiredModels = [
  'User',
  'StoreTheme',
  'Plan',
  'Subscription',
  'LeadFunnel',
  'LeadStage',
  'Lead',
  'InternalNote',
  'Product',
  'Order',
  'OrderItem',
];

const requiredEnums = ['ChatControlMode', 'UserRole', 'SubscriptionStatus', 'OrderStatus'];

function readSchema(provider: 'postgresql' | 'mysql') {
  return readFileSync(resolve(__dirname, '..', 'prisma', `${provider}-schema.prisma`), 'utf8');
}

function hasBlock(schema: string, blockType: 'model' | 'enum', blockName: string) {
  return new RegExp(`^${blockType}\\s+${blockName}\\s*{`, 'm').test(schema);
}

describe('database provider support', () => {
  it('keeps the PostgreSQL schema compatible with the full application surface', () => {
    const schema = readSchema('postgresql');

    for (const model of requiredModels) {
      expect(hasBlock(schema, 'model', model), `Missing PostgreSQL model ${model}`).toBe(true);
    }

    for (const enumName of requiredEnums) {
      expect(hasBlock(schema, 'enum', enumName), `Missing PostgreSQL enum ${enumName}`).toBe(true);
    }
  });

  it('documents the currently partial MySQL schema for app-level modules', () => {
    const schema = readSchema('mysql');
    const missingModels = requiredModels.filter((model) => !hasBlock(schema, 'model', model));
    const missingEnums = requiredEnums.filter((enumName) => !hasBlock(schema, 'enum', enumName));

    expect(missingModels).toEqual(requiredModels);
    expect(missingEnums).toEqual(requiredEnums);
  });
});
