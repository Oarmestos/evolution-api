const dotenv = require('dotenv');
const { execSync } = require('child_process');
const { existsSync } = require('fs');

dotenv.config();

const { DATABASE_PROVIDER } = process.env;
const databaseProviderDefault = DATABASE_PROVIDER ?? 'postgresql';

if (!DATABASE_PROVIDER) {
  console.warn(`DATABASE_PROVIDER is not set in the .env file, using default: ${databaseProviderDefault}`);
}

// Função para determinar qual pasta de migrations usar
// Função para determinar qual pasta de migrations usar
function getMigrationsFolder(provider) {
  switch (provider) {
    case 'psql_bouncer':
      return 'postgresql-migrations'; // psql_bouncer usa as migrations do postgresql
    default:
      return `${provider}-migrations`;
  }
}

const migrationsFolder = getMigrationsFolder(databaseProviderDefault);

const REQUIRED_APP_MODELS = [
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

const REQUIRED_APP_ENUMS = ['ChatControlMode', 'UserRole', 'SubscriptionStatus', 'OrderStatus'];

function findMissingSchemaBlocks(schemaPath, blocks, blockType) {
  if (!existsSync(schemaPath)) {
    return blocks;
  }

  const schema = require('fs').readFileSync(schemaPath, 'utf8');
  return blocks.filter((block) => !new RegExp(`^${blockType}\\s+${block}\\s*{`, 'm').test(schema));
}

function assertProviderSchemaCompatibility(provider) {
  if (process.env.AVRI_ALLOW_PARTIAL_MYSQL_SCHEMA === 'true') {
    return;
  }

  if (provider !== 'mysql') {
    return;
  }

  const schemaPath = `prisma\\${provider}-schema.prisma`;
  const missingModels = findMissingSchemaBlocks(schemaPath, REQUIRED_APP_MODELS, 'model');
  const missingEnums = findMissingSchemaBlocks(schemaPath, REQUIRED_APP_ENUMS, 'enum');

  if (missingModels.length === 0 && missingEnums.length === 0) {
    return;
  }

  console.error('DATABASE_PROVIDER=mysql is not compatible with the current application schema.');
  console.error(`Missing models: ${missingModels.join(', ') || 'none'}`);
  console.error(`Missing enums: ${missingEnums.join(', ') || 'none'}`);
  console.error('Use DATABASE_PROVIDER=postgresql for users, store, leads, products, and orders.');
  console.error('Set AVRI_ALLOW_PARTIAL_MYSQL_SCHEMA=true only if you know these modules are disabled.');
  process.exit(1);
}

let command = process.argv
  .slice(2)
  .join(' ')
  .replace(/DATABASE_PROVIDER/g, databaseProviderDefault);

if (/prisma\s+(generate|migrate|studio)/.test(command)) {
  assertProviderSchemaCompatibility(databaseProviderDefault);
}

// Substituir referências à pasta de migrations pela pasta correta
const migrationsPattern = new RegExp(`${databaseProviderDefault}-migrations`, 'g');
command = command.replace(migrationsPattern, migrationsFolder);

if (command.includes('rmdir') && existsSync('prisma\\migrations')) {
  try {
    execSync('rmdir /S /Q prisma\\migrations', { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error removing directory: prisma\\migrations`);
    process.exit(1);
  }
} else if (command.includes('rmdir')) {
  console.warn(`Directory 'prisma\\migrations' does not exist, skipping removal.`);
}

try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error(`Error executing command: ${command}`);
  process.exit(1);
}
