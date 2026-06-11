import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Procurando pela página inicial (slug: home)...");
  
  const homePage = await prisma.page.findUnique({
    where: { slug: "home" },
  });

  if (!homePage) {
    console.error("Erro: Página inicial (slug: home) não encontrada no banco de dados.");
    process.exit(1);
  }

  console.log("Página inicial encontrada! ID:", homePage.id);
  console.log("Verificando se já existe a seção O Que Fazemos (ordem: 1)...");

  const existingServices = await prisma.pageSection.findFirst({
    where: {
      pageId: homePage.id,
      order: 1,
    },
  });

  const cardsData = [
    {
      title: "Curadoria Artística",
      desc: "Seleção estratégica de atrações alinhadas ao perfil, objetivo e orçamento de cada evento."
    },
    {
      title: "Contratação de Artistas",
      desc: "Intermediação completa das negociações, garantindo transparência e segurança em todas as etapas."
    },
    {
      title: "Produção Executiva",
      desc: "Planejamento, coordenação e acompanhamento operacional do início ao fim."
    },
    {
      title: "Projetos Especiais",
      desc: "Desenvolvimento de festivais, circuitos culturais e projetos proprietários com identidade própria."
    }
  ];

  const servicesData = {
    pageId: homePage.id,
    title: "Seu parceiro estratégico em todas as etapas.",
    subtitle: "O Que Fazemos",
    content: JSON.stringify(cardsData),
    imageUrl: "Conheça nossas soluções",
    videoUrl: "/o-que-fazemos/",
    bgType: "GRID",
    order: 1,
  };

  if (existingServices) {
    console.log("Seção de Ordem 1 encontrada. Atualizando para o layout GRID de serviços...");
    await prisma.pageSection.update({
      where: { id: existingServices.id },
      data: {
        title: servicesData.title,
        subtitle: servicesData.subtitle,
        content: servicesData.content,
        imageUrl: servicesData.imageUrl,
        videoUrl: servicesData.videoUrl,
        bgType: servicesData.bgType,
      },
    });
    console.log("Seção O Que Fazemos atualizada com sucesso!");
  } else {
    console.log("Seção O Que Fazemos não encontrada. Criando nova seção de ordem 1...");
    await prisma.pageSection.create({
      data: servicesData,
    });
    console.log("Seção O Que Fazemos criada com sucesso!");
  }

  console.log("Verificando a seção Quem Somos (ordem: 2)...");
  const existingAbout = await prisma.pageSection.findFirst({
    where: {
      pageId: homePage.id,
      subtitle: "A força da Oceania Eventos focada em parcerias artísticas.",
    },
  });

  if (existingAbout && existingAbout.order !== 2) {
    console.log(`Atualizando ordem da seção Quem Somos de ${existingAbout.order} para 2...`);
    await prisma.pageSection.update({
      where: { id: existingAbout.id },
      data: { order: 2 },
    });
    console.log("Ordem da seção Quem Somos atualizada!");
  }
}

main()
  .catch((e) => {
    console.error("Erro ao rodar script de seed de Serviços:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
