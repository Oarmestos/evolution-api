import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando siembra de datos SaaS...');

  // 1. Crear Planes
  const plans = [
    {
      name: 'Gratis',
      description: 'Ideal para probar la plataforma',
      maxInstances: 1,
      price: 0.0,
    },
    {
      name: 'Pro',
      description: 'Para negocios en crecimiento',
      maxInstances: 5,
      price: 29.90,
    },
    {
      name: 'Enterprise',
      description: 'Uso ilimitado y soporte prioritario',
      maxInstances: 20,
      price: 99.90,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
    console.log(`✅ Plan creado/verificado: ${plan.name}`);
  }

  // 2. Crear Usuario Administrador Global
  const adminEmail = 'admin@avri.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Administrador Avri',
      password: 'admin123', // En producción esto debe ser hasheado (bcrypt)
      role: 'ADMIN',
    },
  });

  console.log(`👤 Usuario Admin creado: ${admin.email}`);

  // 3. Vincular Admin al Plan Enterprise
  const enterprisePlan = await prisma.plan.findUnique({ where: { name: 'Enterprise' } });
  if (enterprisePlan) {
    await prisma.subscription.upsert({
      where: { userId: admin.id },
      update: {},
      create: {
        userId: admin.id,
        planId: enterprisePlan.id,
        status: 'ACTIVE',
      },
    });
    console.log(`🎫 Suscripción Enterprise asignada al Admin`);
  }

  console.log('✨ Siembra de datos completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en la siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
