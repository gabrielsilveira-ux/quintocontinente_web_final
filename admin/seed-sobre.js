const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Get or create the "sobre" page
  let page = await prisma.page.findUnique({
    where: { slug: 'sobre' }
  });

  if (!page) {
    page = await prisma.page.create({
      data: {
        slug: 'sobre',
        title: 'Quem Somos',
  
      }
    });
  }

  // Clear existing sections to avoid duplicates
  await prisma.pageSection.deleteMany({
    where: { pageId: page.id }
  });

  // 2. Create Hero Section (Order 0)
  await prisma.pageSection.create({
    data: {
      pageId: page.id,
      title: 'A experiência de quem vive o entretenimento há mais de 25 anos.',
      subtitle: 'Nossa História',
      content: 'A Quinto Continente nasceu como uma extensão natural da trajetória da Oceania Eventos...|Ver Artistas',
      imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop',
      videoUrl: 'Falar com um Especialista|/contato/',
      bgType: 'DARK',
      order: 0,

    }
  });

  // 3. Create Manifesto Section (Order 1) - Textos Livres Escuro
  await prisma.pageSection.create({
    data: {
      pageId: page.id,
      title: 'Parceiros Estratégicos',
      subtitle: 'Além da Intermediação',
      content: 'A Quinto Continente nasceu como uma extensão natural da trajetória da Oceania Eventos, produtora reconhecida nacionalmente e responsável por grandes projetos, festivais e experiências ao vivo ao longo de mais de duas décadas de atuação.\n\nMais do que intermediar negociações, atuamos como parceiros estratégicos de nossos clientes, acompanhando cada etapa do processo para garantir segurança, eficiência e resultados.\n\nNossa missão é conectar artistas, marcas, cidades e pessoas através de experiências autênticas, construídas com planejamento, criatividade e excelência operacional.',
      imageUrl: 'https://images.unsplash.com/photo-1540039155732-d674d4134b6d?q=80&w=1200&auto=format&fit=crop',
      videoUrl: 'Conheça nossos Artistas|/artistas/',
      bgType: 'DARK',
      order: 1,

    }
  });

  // 4. Create Diferenciais Section (Order 2) - Nossos Números
  await prisma.pageSection.create({
    data: {
      pageId: page.id,
      title: 'A Força do Grupo',
      subtitle: 'Nossos Números',
      content: JSON.stringify([
        {
          pill: '+25 Anos',
          title: 'Experiência',
          desc: 'De atuação através da Oceania Eventos.'
        },
        {
          pill: 'Centenas',
          title: 'Eventos Realizados',
          desc: 'Em diferentes formatos e portes pelo Brasil.'
        },
        {
          pill: 'Nacional',
          title: 'Rede de Contatos',
          desc: 'Conectando talentos, marcas e públicos.'
        },
        {
          pill: '360°',
          title: 'Gestão Completa',
          desc: 'Do artístico ao planejamento operacional.'
        }
      ]),
      bgType: 'DIFERENCIAIS',
      order: 2
    }
  });

  console.log('Seções da página Quem Somos recriadas com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
