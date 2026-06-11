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
  console.log("Verificando se já existe a seção Hero (ordem: 0)...");

  const existingHero = await prisma.pageSection.findFirst({
    where: {
      pageId: homePage.id,
      order: 0,
    },
  });

  const heroData = {
    pageId: homePage.id,
    title: "A experiência de quem vive o entretenimento<br><span class=\"hl\">há mais de 25 anos.</span>",
    subtitle: "Curadoria artística, contratação de atrações e gestão de eventos com a expertise do Grupo Oceania.",
    content: "Solicitar Atendimento | Quem somos",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop", // Default beautiful background
    bgType: "DARK",
    order: 0,
  };

  if (existingHero) {
    console.log("Seção Hero já existe. Atualizando...");
    await prisma.pageSection.update({
      where: { id: existingHero.id },
      data: {
        title: heroData.title,
        subtitle: heroData.subtitle,
        content: heroData.content,
        // Só atualiza a imagem se ela estiver vazia, para não sobrescrever caso o usuário já tenha mudado
        imageUrl: existingHero.imageUrl || heroData.imageUrl,
      },
    });
    console.log("Seção Hero atualizada com sucesso!");
  } else {
    console.log("Seção Hero não existe. Criando nova seção de ordem 0...");
    await prisma.pageSection.create({
      data: heroData,
    });
    console.log("Seção Hero criada com sucesso!");
  }
}

main()
  .catch((e) => {
    console.error("Erro ao rodar script de seed do Hero:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
