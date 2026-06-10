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

  // Novo: Adicionar páginas padrão se não houverem
  const pageCount = await prisma.page.count();
  if (pageCount === 0) {
    console.log("Inserindo páginas padrão do CMS...");
    
    // 1. Página Home
    const homePage = await prisma.page.create({
      data: {
        title: "Página Inicial",
        slug: "home",
        description: "Quinto Continente | Agência de Artistas - Intermediação de shows, curadoria e produção operacional 360°.",
        keywords: "shows, contratação de artistas, nando reis, cpm 22, eventos corporativos",
      }
    });
    await prisma.pageSection.createMany({
      data: [
        {
          pageId: homePage.id,
          title: "Grandes Shows, Resultados Reais",
          subtitle: "Conectamos artistas de alto escalão ao seu evento com segurança jurídica e excelência operacional.",
          content: "Nossa agência gerencia todas as etapas críticas: curadoria inteligente, negociação de cachês, conformidade fiscal e execução técnica no local.",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop",
          bgType: "DARK",
          order: 1
        },
        {
          pageId: homePage.id,
          title: "Quem Somos",
          subtitle: "A força da Oceania Eventos focada em parcerias artísticas.",
          content: "A Quinto Continente nasce como o hub estratégico da Oceania Eventos, consolidando anos de experiência na produção de grandes espetáculos e gestão de arenas. Nossa missão é simplificar a conexão entre contratantes e artistas de alto escalão, garantindo que a viabilidade comercial e a excelência técnica caminhem juntas.",
          bgType: "WHITE",
          order: 2
        }
      ]
    });

    // 2. Página Quem Somos
    const sobrePage = await prisma.page.create({
      data: {
        title: "Quem Somos",
        slug: "sobre",
        description: "Conheça a Quinto Continente, hub estratégico especializado em parcerias artísticas e produção executiva.",
        keywords: "oceania eventos, história, valores, corporativo",
      }
    });
    await prisma.pageSection.createMany({
      data: [
        {
          pageId: sobrePage.id,
          title: "Vivemos e respiramos entretenimento.",
          subtitle: "Para nós, show é coisa séria. Há mais de 25 anos, atuamos nos bastidores viabilizando sonhos.",
          content: "Nascemos da necessidade de estruturar relações comerciais transparentes e tecnicamente impecáveis. Oferecemos segurança absoluta para contratantes e artistas.",
          bgType: "WHITE",
          order: 1
        },
        {
          pageId: sobrePage.id,
          title: "Nossos Valores",
          subtitle: "DNA do Grupo Quinto Continente",
          content: "Segurança jurídica em primeiro lugar. Rigor técnico inegociável. Curadoria transparente focada em conversão. Comprometimento operacional até o último acorde.",
          bgType: "DARK",
          order: 2
        }
      ]
    });

    // 3. Página O Que Fazemos
    const servicosPage = await prisma.page.create({
      data: {
        title: "O Que Fazemos",
        slug: "o-que-fazemos",
        description: "Nossas soluções 360° para contratação, curadoria e produção operacional de shows.",
        keywords: "curadoria artística, compliance de contratos, produção executiva",
      }
    });
    await prisma.pageSection.createMany({
      data: [
        {
          pageId: servicosPage.id,
          title: "Inteligência de Mercado e Curadoria Artística",
          subtitle: "Estudamos o perfil do seu evento e público para indicar a atração ideal.",
          content: "Não indicamos apenas nomes. Analisamos dados de engajamento, rotas e custos para otimizar o investimento e garantir o sucesso do evento.",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          bgType: "WHITE",
          order: 1
        },
        {
          pageId: servicosPage.id,
          title: "Intermediação de Contratos Seguros",
          subtitle: "Compliance contratual e segurança jurídica garantidos em todas as negociações.",
          content: "Garantimos conformidade jurídica sob a chancela da Oceania Eventos. Eliminamos imprevistos contratuais, cuidando de impostos, prazos e riders.",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          bgType: "DARK",
          order: 2
        },
        {
          pageId: servicosPage.id,
          title: "Produção Executiva e Rigor Técnico",
          subtitle: "Garantimos a execução perfeita de toda a infraestrutura técnica.",
          content: "Gerenciamos riders técnicos de som, luz, camarins, e logística crítica (transporte, hotéis e alimentação) de forma profissional.",
          imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop",
          bgType: "WHITE",
          order: 3
        }
      ]
    });

    // 4. Página Contato
    const contatoPage = await prisma.page.create({
      data: {
        title: "Contato",
        slug: "contato",
        description: "Fale com nossa equipe técnica comercial para orçar e reservar a agenda de artistas.",
        keywords: "contato, telefone, whatsapp, e-mail",
      }
    });
    await prisma.pageSection.createMany({
      data: [
        {
          pageId: contatoPage.id,
          title: "Comercial e Atendimento",
          subtitle: "Fale com nossos gerentes artísticos e receba uma cotação em até 24 horas.",
          content: "Temos canais dedicados para orçamentos e dúvidas técnicas. Telefone/WhatsApp: (67) 99218-5103 | E-mail: contato@quintocontinente.com.br",
          bgType: "WHITE",
          order: 1
        }
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
