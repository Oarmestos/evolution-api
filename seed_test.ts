import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get or create instance
  let instance = await prisma.instance.findFirst();
  if (!instance) {
    instance = await prisma.instance.create({
      data: {
        name: 'Evolution',
        description: 'Instancia Principal',
        connectionStatus: 'open',
      }
    });
  }
  
  const instanceId = instance.id;
  const instanceName = instance.name;
  console.log(`Usando instancia: ${instanceName} (${instanceId})`);

  // Create Funnel & Stage
  let funnel = await prisma.leadFunnel.findFirst({ where: { instanceId } });
  if (!funnel) {
    funnel = await prisma.leadFunnel.create({
      data: { name: 'Embudo de Ventas General', instanceId }
    });
  }
  
  let stage1 = await prisma.leadStage.findFirst({ where: { funnelId: funnel.id }});
  if (!stage1) {
    stage1 = await prisma.leadStage.create({
      data: { name: 'Nuevos Contactos', funnelId: funnel.id, color: '#3b82f6' }
    });
  }
  
  // Create Contact & Chat
  const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
  const remoteJid = `57300${randomSuffix}@s.whatsapp.net`;
  
  const contact = await prisma.contact.upsert({
    where: { remoteJid_instanceId: { remoteJid, instanceId } },
    update: {},
    create: {
      remoteJid,
      pushName: 'Carlos Cliente Test',
      instanceId,
      phoneNumber: `57300${randomSuffix}`
    }
  });

  await prisma.chat.upsert({
    where: { instanceId_remoteJid: { instanceId, remoteJid } },
    update: {},
    create: {
      remoteJid,
      instanceId,
      name: 'Carlos Cliente Test',
      lastMessage: 'Hola, me interesan sus productos.',
      unreadMessages: 1
    }
  });

  // Create Lead
  await prisma.lead.create({
    data: {
      contactId: contact.id,
      stageId: stage1.id,
      instanceId,
      value: 85000,
      notes: 'Cliente de prueba inyectado por script para demostración de integración.'
    }
  });

  // Create Products
  const prod1 = await prisma.product.create({
    data: { name: 'Camiseta Evolution (Prueba)', description: 'Producto autogenerado', price: 50000, stock: 100, enabled: true, instanceId }
  });
  const prod2 = await prisma.product.create({
    data: { name: 'Gorra Premium (Prueba)', description: 'Producto autogenerado', price: 35000, stock: 50, enabled: true, instanceId }
  });

  // Create Order
  const order = await prisma.order.create({
    data: {
      remoteJid,
      instanceId,
      total: 85000,
      status: 'PAID'
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: prod1.id,
      quantity: 1,
      priceAtTime: prod1.price
    }
  });
  
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: prod2.id,
      quantity: 1,
      priceAtTime: prod2.price
    }
  });

  console.log("=========================================");
  console.log("¡Datos de prueba inyectados correctamente!");
  console.log("=========================================");
  console.log(`1. Ve al CHAT y busca: Carlos Cliente Test`);
  console.log(`2. Ve a PRODUCTOS y verás 'Camiseta Evolution (Prueba)' y 'Gorra Premium'`);
  console.log(`3. Ve a PEDIDOS y verás la orden por $85,000 para este contacto`);
  console.log(`4. Ve a VENTAS y verás el Lead en el embudo.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
