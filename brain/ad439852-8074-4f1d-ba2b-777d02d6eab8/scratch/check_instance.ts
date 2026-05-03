
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const instance = await prisma.instance.findUnique({
    where: { id: '35e93a3c-9d81-4c24-946c-1f4e03b20918' },
  });
  console.log(JSON.stringify(instance, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
