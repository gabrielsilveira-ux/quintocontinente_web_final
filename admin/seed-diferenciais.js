const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const homePage = await prisma.page.findUnique({
    where: { slug: 'home' }
  });

  if (!homePage) {
    console.log("Página home não encontrada!");
    return;
  }

  // Obter o maior order atual
  const sections = await prisma.pageSection.findMany({
    where: { pageId: homePage.id },
    orderBy: { order: 'desc' }
  });
  
  const nextOrder = sections.length > 0 ? sections[0].order + 1 : 0;

  const difContent = JSON.stringify([
    {
      pill: "Institucional",
      title: "Segurança Institucional",
      desc: "A chancela da Oceania Eventos em todas as etapas jurídicas e operacionais. Credibilidade construída em anos de mercado."
    },
    {
      pill: "Logística",
      title: "Inteligência de Rota",
      desc: "Estratégias logísticas que otimizam custos e viabilizam datas em diversas regiões do país. Planejamento inteligente a serviço do evento."
    },
    {
      pill: "Técnico",
      title: "Rigor Técnico",
      desc: "Garantia de que todas as exigências técnicas do artista sejam atendidas com excelência. Riders executados sem margem para improviso."
    },
    {
      pill: "Resultado",
      title: "Gestão de Resultados",
      desc: "Foco absoluto na entrega de um evento inesquecível e financeiramente saudável. Entretenimento como negócio de precisão."
    }
  ]);

  await prisma.pageSection.create({
    data: {
      pageId: homePage.id,
      title: "Por que o mercado escolhe a Quinto Continente?",
      subtitle: "Diferenciais",
      content: difContent,
      bgType: "DIFERENCIAIS",
      order: nextOrder
    }
  });

  console.log("Seção Diferenciais inserida com sucesso!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
