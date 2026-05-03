
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const contacts = await prisma.contact.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      remoteJid: true,
      pushName: true,
      phoneNumber: true
    }
  });
  console.log(JSON.stringify(contacts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
