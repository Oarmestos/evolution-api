import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const instances = await prisma.instance.findMany();
  console.log('--- INSTANCIAS ---');
  for (const inst of instances) {
    console.log(JSON.stringify(inst, null, 2));
    const products = await prisma.product.count({ where: { instanceId: inst.id } });
    const orders = await prisma.order.count({ where: { instanceId: inst.id } });
    const leads = await prisma.lead.count({ where: { instanceId: inst.id } });
    const chats = await prisma.chat.count({ where: { instanceId: inst.id } });
    console.log(`Instancia: ${inst.name} (${inst.id})`);
    console.log(`  - Productos: ${products}`);
    console.log(`  - Pedidos: ${orders}`);
    console.log(`  - Leads: ${leads}`);
    console.log(`  - Chats: ${chats}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
