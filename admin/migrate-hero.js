const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const page = await prisma.page.findUnique({
    where: { slug: 'sobre' }
  });

  if (!page) {
    console.log('Página sobre não encontrada.');
    return;
  }

  const result = await prisma.pageSection.updateMany({
    where: {
      pageId: page.id,
      order: 0
    },
    data: {
      bgType: 'HERO_INTERNAL'
    }
  });

  console.log(`Atualizado ${result.count} seções para HERO_INTERNAL.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
