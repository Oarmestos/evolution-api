# Database Provider Support

## Current Status

PostgreSQL is the supported provider for the full application surface:

- users and subscriptions
- storefront theme
- products and orders
- lead funnels, stages, and leads
- internal notes and chat control mode

MySQL remains present for the legacy Evolution API schema, but it does not currently include the newer application models listed above. Generating a Prisma client from `mysql-schema.prisma` would produce a client that is incompatible with the current TypeScript services.

## Guardrail

`runWithProvider.js` blocks `prisma generate`, `prisma migrate`, and `prisma studio` for `DATABASE_PROVIDER=mysql` when required application models are missing.

Use PostgreSQL for normal development and production:

```bash
DATABASE_PROVIDER=postgresql npm run db:generate
```

Only bypass the guardrail when intentionally working on the partial MySQL schema:

```bash
AVRI_ALLOW_PARTIAL_MYSQL_SCHEMA=true DATABASE_PROVIDER=mysql npm run db:generate
```

Bypassing the guardrail does not make the full application MySQL-compatible. It only allows schema maintenance work.

## Path To Full MySQL Support

To restore full MySQL support, add equivalent MySQL models, enums, and migrations for:

- `User`
- `StoreTheme`
- `Plan`
- `Subscription`
- `LeadFunnel`
- `LeadStage`
- `Lead`
- `InternalNote`
- `Product`
- `Order`
- `OrderItem`
- `ChatControlMode`
- `UserRole`
- `SubscriptionStatus`
- `OrderStatus`

After that, remove or relax the MySQL guardrail and run the full TypeScript, lint, and test suite with a Prisma client generated from the MySQL schema.
