import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- INSTANCES ---');
  const instances = await prisma.instance.findMany();
  console.log(JSON.stringify(instances, null, 2));

  console.log('\n--- CONTACTS ---');
  const contacts = await prisma.contact.findMany({ take: 5 });
  console.log(JSON.stringify(contacts, null, 2));

  console.log('\n--- LEADS ---');
  const funnels = await prisma.leadFunnel.findMany();
  console.log('Lead Funnels:', funnels.length);

  const stages = await prisma.leadStage.findMany();
  console.log('Lead Stages:', stages.length);

  const leads = await prisma.lead.findMany({
    include: { Contact: true, Stage: true }
  });
  console.log('Leads:', leads.length);
  if (leads.length > 0) {
    console.log('Last Lead:', leads[leads.length - 1]);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
