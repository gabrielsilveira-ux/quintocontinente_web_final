import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Migrando página O que Fazemos...");

  // Criar ou atualizar a página O que Fazemos
  const page = await prisma.page.upsert({
    where: { slug: "o-que-fazemos" },
    update: {
      title: "O que Fazemos",
      description: "Conheça nossos serviços de curadoria, compliance e mais.",
    },
    create: {
      title: "O que Fazemos",
      slug: "o-que-fazemos",
      description: "Conheça nossos serviços de curadoria, compliance e mais.",
      active: true,
    },
  });

  // Limpar seções existentes (para rodar o script quantas vezes quiser sem duplicar)
  await prisma.pageSection.deleteMany({
    where: { pageId: page.id },
  });

  console.log("Criando seções...");

  const sections = [
    {
      pageId: page.id,
      title: "Inteligência de Mercado e Curadoria Artística",
      subtitle: "Curadoria",
      content: `A escolha do artista certo vai muito além do gosto pessoal ou das paradas de sucesso. Nosso trabalho de curadoria analisa o perfil do público, o conceito do evento e os objetivos da marca.\n\nA Quinto Continente utiliza dados de mercado, tendências de consumo e um profundo conhecimento do cenário musical para indicar as atrações com maior aderência e potencial de engajamento para cada projeto.`,
      imageUrl: "eye",
      bgType: "TEXT_ICON_WHITE",
      order: 0,
    },
    {
      pageId: page.id,
      title: "Segurança Jurídica, Compliance e Negociação",
      subtitle: "Compliance e Negociação",
      content: `Lidar com contratos artísticos exige expertise. Nossa equipe atua na negociação direta com os escritórios dos artistas, garantindo condições justas, transparência e mitigação de riscos.\n\nAsseguramos que todas as exigências contratuais, desde cachês e direitos de imagem até cláusulas de cancelamento, sejam tratadas com rigor e ética, protegendo os interesses do cliente e garantindo o compliance do evento.`,
      imageUrl: "signature",
      bgType: "TEXT_ICON_DARK",
      order: 1,
    },
    {
      pageId: page.id,
      title: "Gestão Logística e Produção Técnica",
      subtitle: "Logística",
      content: `A entrega de um grande show acontece muito antes do artista subir ao palco. Nossa equipe de produção cuida de toda a logística envolvendo a atração: passagens, hospedagem, traslados locais, camarins e alimentação (catering).\n\nAlém disso, coordenamos o rider técnico (som, luz, painéis de LED) para que o artista encontre a estrutura ideal para sua performance, garantindo tranquilidade para o produtor do evento e excelência para o público.`,
      imageUrl: "waveform",
      bgType: "TEXT_ICON_WHITE",
      order: 2,
    },
    {
      pageId: page.id,
      title: "Projetos Proprietários e Exclusividade",
      subtitle: "Projetos Especiais",
      content: `Além de atuar com eventos corporativos e shows de terceiros, a Quinto Continente é uma aceleradora de projetos proprietários.\n\nDesenvolvemos festivais e turnês do zero, atuando na concepção criativa, formatação do modelo de negócios, captação de patrocínios e gestão 360º. Se você tem uma grande ideia, nós temos a estrutura para transformá-la em um evento de escala nacional.`,
      imageUrl: "layers",
      bgType: "TEXT_ICON_DARK",
      order: 3,
    },
    {
      pageId: page.id,
      title: "Vamos conversar sobre o seu próximo evento?",
      subtitle: "Contato",
      content: "Nossa equipe está pronta para entender sua necessidade e propor a melhor solução artística.",
      videoUrl: "Solicitar Atendimento|/contato",
      bgType: "WHITE",
      order: 4,
    }
  ];

  for (const section of sections) {
    await prisma.pageSection.create({
      data: section,
    });
  }

  console.log("Página 'O que Fazemos' migrada com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
