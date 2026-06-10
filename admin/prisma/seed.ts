import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando semeadura do banco de dados (seed)...");

  // Email e senha padrão para o primeiro acesso
  const adminEmail = "admin@quintocontinente.com.br";
  const defaultPassword = "QCAdmin2026!";

  // Verifica se o administrador já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(defaultPassword, salt);

    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrador Quinto Continente",
        passwordHash: passwordHash,
        role: "ADMIN",
      },
    });

    console.log(`\n==========================================`);
    console.log(`USUÁRIO ADMINISTRADOR PADRÃO CRIADO COM SUCESSO!`);
    console.log(`E-mail: ${user.email}`);
    console.log(`Senha Inicial: ${defaultPassword}`);
    console.log(`Lembre-se de alterar a senha após o primeiro acesso.`);
    console.log(`==========================================\n`);
  } else {
    console.log("Administrador já existe no banco de dados.");
  }

  // Opcional: Adicionar alguns banners padrão se não houver nenhum
  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    console.log("Inserindo banners de fallback padrão...");
    await prisma.banner.createMany({
      data: [
        {
          title: "Grandes Shows, Resultados Reais",
          description: "Conectamos artistas de alto escalão ao seu evento com segurança jurídica e excelência operacional em cada detalhe.",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          linkUrl: "#contato",
          label: "Destaque",
          order: 1,
          active: true,
        },
        {
          title: "Produção Completa Ponta a Ponta",
          description: "Do rider técnico à logística de camarim e palco — cada detalhe operacional cuidado com excelência e precisão.",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          linkUrl: "servicos/index.html",
          label: "Serviços",
          order: 2,
          active: true,
        },
        {
          title: "Experiências Personalizadas para Marcas",
          description: "Criamos e executamos projetos exclusivos sob demanda — do conceito ao evento inesquecível, com total comprometimento.",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          linkUrl: "servicos/index.html#especiais",
          label: "Projetos Especiais",
          order: 3,
          active: true,
        }
      ]
    });
  }

  // Opcional: Adicionar artistas padrão
  const artistCount = await prisma.artist.count();
  if (artistCount === 0) {
    console.log("Inserindo artistas de fallback padrão...");
    await prisma.artist.createMany({
      data: [
        { name: "Nando Reis", imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop", featured: true, order: 1 },
        { name: "Samuel Rosa", imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop", featured: true, order: 2 },
        { name: "Paralamas do Sucesso", imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop", featured: true, order: 3 },
        { name: "Raimundos", imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop", featured: true, order: 4 },
        { name: "CPM 22", imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop", featured: true, order: 5 },
        { name: "Detonautas", imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop", featured: true, order: 6 },
      ]
    });
  }

  console.log("Semeadura concluída!");
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
