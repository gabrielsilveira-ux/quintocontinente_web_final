import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando semeadura do banco de dados (seed)...");

  // Email e senha padrão para o primeiro acesso
  const adminEmail = "admin@quintocontinente.com.br";
  const defaultPassword = "QC_Admin_2026_SecureAccess_987!";

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
        {
          name: "Nando Reis",
          slug: "nando-reis",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          featured: true,
          order: 1,
          genre: "Rock / MPB",
          bio: "Nando Reis é um dos maiores compositores e cantores do rock e MPB no Brasil.",
          galleryUrls: []
        },
        {
          name: "Samuel Rosa",
          slug: "samuel-rosa",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          featured: true,
          order: 2,
          genre: "Pop Rock / Reggae",
          bio: "Samuel Rosa é cantor, compositor e guitarrista, conhecido como vocalista e guitarrista da banda Skank.",
          galleryUrls: []
        },
        {
          name: "Paralamas do Sucesso",
          slug: "paralamas-do-sucesso",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          featured: true,
          order: 3,
          genre: "Rock / Ska",
          bio: "Os Paralamas do Sucesso é uma das bandas mais emblemáticas e duradouras do rock nacional.",
          galleryUrls: []
        },
        {
          name: "Raimundos",
          slug: "raimundos",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          featured: true,
          order: 4,
          genre: "Hardcore / Punk Rock",
          bio: "Raimundos é uma banda de rock brasileira formada em Brasília em 1987, conhecida pela fusão de punk e ritmos nordestinos.",
          galleryUrls: []
        },
        {
          name: "CPM 22",
          slug: "cpm-22",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          featured: true,
          order: 5,
          genre: "Punk Rock / Hardcore",
          bio: "CPM 22 é uma banda de rock brasileira de punk rock e hardcore melódico formada em 1995.",
          galleryUrls: []
        },
        {
          name: "Detonautas",
          slug: "detonautas",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          featured: true,
          order: 6,
          genre: "Rock Alternativo",
          bio: "Detonautas Roque Clube é uma banda brasileira de rock formada no Rio de Janeiro em 1997.",
          galleryUrls: []
        },
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
