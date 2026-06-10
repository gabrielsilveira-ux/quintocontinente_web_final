# Plano de Implementação: Painel Administrativo Quinto Continente

Este plano descreve a criação de um painel administrativo seguro em Next.js para gerenciamento dos banners da home, imagens de artistas, galeria de eventos e formulários de contato (leads) do site institucional **Quinto Continente**.

---

## Stack de Tecnologias

- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Autenticação:** NextAuth.js (Auth.js) com credenciais e sessão via JWT criptografado
- **Banco de Dados & ORM:** Prisma ORM com PostgreSQL hospedado no Supabase
- **Validação de Dados:** Zod (validação de inputs tanto nas rotas de API quanto no front-end do painel)
- **Upload de Imagens:** Supabase Storage (baldes de armazenamento dedicados para centralizar banco e mídia)
- **Estilização:** Tailwind CSS com design premium (modo escuro consistente com o design original do site)

---

## Arquitetura de Integração

Como o site atual é 100% estático (HTML/CSS/JS), o painel administrativo será desenvolvido na pasta `/admin`. 
1. **Painel de Controle:** Rodará sob a rota `/admin` e fornecerá a interface de gerenciamento protegida por autenticação.
2. **APIs Públicas:** O Next.js disponibilizará rotas de API públicas (ex: `/admin/api/banners` e `/admin/api/artistas`) que retornarão os dados dinâmicos do banco.
3. **Scripts do Site Principal:** Adicionaremos um arquivo JavaScript (`assets/js/dynamic-content.js`) nas páginas estáticas para ler dados dessas APIs e renderizar os banners, artistas e galeria de forma dinâmica, mantendo uma estratégia de fallback para os dados estáticos caso o backend esteja temporariamente indisponível.

---

## User Review Required

> [!IMPORTANT]
> **Permissões de Execução (npx / npm):**
> Como as execuções diretas de comandos de terminal necessitam de autorização individual, precisaremos rodar comandos como `npm install` e `prisma db push` assim que o plano for aprovado. 
> 
> **Configurações de Variáveis de Ambiente:**
> Será necessário criar um arquivo `.env` contendo as chaves de conexão:
> - `DATABASE_URL` / `DIRECT_URL` (para conexão do Prisma ao Supabase PostgreSQL)
> - `NEXTAUTH_SECRET` (para criptografia das sessões do NextAuth)
> - `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (para gerenciar arquivos de mídia no Supabase Storage)
> - `ADMIN_USER` e `ADMIN_PASSWORD_HASH` (ou criaremos um script de seed inicial para criar o usuário administrador padrão)

> [!WARNING]
> **Compatibilidade de Rotas na Hospedagem (ex: Vercel):**
> Se o site for hospedado como um único projeto na Vercel, a pasta `/admin` funcionará nativamente como sub-rota do domínio principal. Se for hospedado separadamente (ex: GitHub Pages para o estático e Vercel para o painel), o script dinâmico consumirá a API via domínio absoluto (ex: `https://painel-admin.vercel.app/api/...`), exigindo configuração de CORS adequada nas rotas de API do Next.js.

---

## Decisões Técnicas Alinhadas

> [!NOTE]
> As escolhas técnicas foram definidas pelo usuário:
> - **Banco de Dados:** Supabase (PostgreSQL)
> - **Armazenamento de Imagens:** Supabase Storage (baldes de armazenamento públicos com limites de tamanho específicos por bucket):
>   - `banners`: Limite máximo recomendado de **5 MB** (`5242880` bytes) — ideal para banners horizontais em alta resolução.
>   - `artists`: Limite máximo recomendado de **2 MB** (`2097152` bytes) — adequado para fotos de perfil ou miniaturas dos artistas.
>   - `gallery`: Limite máximo recomendado de **3 MB** (`3145728` bytes) — adequado para fotos de cobertura de eventos/shows.

---

## Proposed Changes

Abaixo está a proposta de estrutura de diretórios e arquivos para a pasta `/admin`:

### [Painel Admin (Next.js)]

Componente central do gerenciamento, contendo telas de login, gerenciamento de banners, artistas, galeria de fotos e visualização de leads de contato.

#### [NEW] [.gitignore](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/.gitignore)
Ignora arquivos sensíveis (como `.env`, `.env.local`), dependências (`node_modules/`) e pastas geradas pelo Next.js (`.next/`) para evitar vazamento de credenciais no GitHub.

#### [NEW] [schema.prisma](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/prisma/schema.prisma)
Modelo do banco contendo:
- `User`: Administradores do painel (id, email, passwordHash, name, role).
- `Banner`: Banners rotativos (id, title, description, imageUrl, linkUrl, label, order, active, createdAt).
- `Artist`: Artistas (id, name, imageUrl, order, featured, active, createdAt).
- `GalleryItem`: Itens da galeria (id, title, imageUrl, category, order, active, createdAt).
- `Lead`: Contatos enviados pelo formulário (id, name, email, phone, eventType, message/artistInterest, status, createdAt).

#### [NEW] [seed.ts](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/prisma/seed.ts)
Script de inicialização (Seed) para criar o primeiro usuário administrador padrão (`admin@quintocontinente.com.br`) com senha criptografada de forma segura na primeira execução do banco.

#### [NEW] [package.json](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/package.json)
Configuração de dependências incluindo:
- `next`, `react`, `react-dom`
- `@prisma/client`, `prisma` (devDependencies)
- `next-auth`
- `zod`
- `bcryptjs` (para hash de senhas)
- `tailwindcss`, `postcss`, `autoprefixer`
- `lucide-react` (para ícones modernos e limpos)

#### [NEW] [next.config.js](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/next.config.js)
Configuração do Next.js com suporte a carregamento de imagens externas vindas do Supabase Storage.

#### [NEW] [tailwind.config.js](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/tailwind.config.js)
Adaptação do sistema de design original do site (cores `--accent`, `--bg`, `--surface`, etc.) para componentes Tailwind.

#### [NEW] [src/lib/db.ts](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/lib/db.ts)
Instanciação segura e cached do Prisma Client (evitando vazamento de conexões em desenvolvimento).

#### [NEW] [src/lib/schemas.ts](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/lib/schemas.ts)
Schemas Zod para validação:
- `loginSchema`: Email e senha
- `bannerSchema`: Validações de título, link, etc.
- `artistSchema`: Nome do artista, ordenação e imagem
- `gallerySchema`: Imagem e categoria
- `leadSchema`: Validação de envio de e-mail e telefone

#### [NEW] [src/app/api/auth/[...nextauth]/route.ts](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/api/auth/%5B...nextauth%5D/route.ts)
Configuração do NextAuth com CredentialsProvider, persistindo sessões JWT com tempo de expiração seguro.

#### [NEW] [src/app/layout.tsx](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/layout.tsx)
Layout global com provedores de sessão e estilos.

#### [NEW] [src/app/page.tsx](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/page.tsx)
Página de login administrativa elegante, com validação de erros via Zod.

#### [NEW] [src/app/dashboard/layout.tsx](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/dashboard/layout.tsx)
Layout do painel de administração contendo sidebar de navegação responsiva, cabeçalho com perfil do usuário e botão de logout.

#### [NEW] [src/app/dashboard/page.tsx](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/dashboard/page.tsx)
Visão geral (Dashboard) com cartões de métricas (número de leads pendentes, total de artistas, banners ativos) e uma tabela com os leads mais recentes.

#### [NEW] [src/app/dashboard/banners/page.tsx](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/dashboard/banners/page.tsx)
Página de CRUD para banners, incluindo listagem com miniaturas, reordenação e modal de criação/edição com upload integrado.

#### [NEW] [src/app/dashboard/artistas/page.tsx](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/dashboard/artistas/page.tsx)
Interface para gerenciar os artistas cadastrados (Adicionar, Excluir, Editar e definir se aparece em destaque na home marquee).

#### [NEW] [src/app/dashboard/galeria/page.tsx](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/dashboard/galeria/page.tsx)
Página para gerenciar os uploads de fotos da galeria com filtro por categorias de eventos.

#### [NEW] [src/app/dashboard/leads/page.tsx](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/dashboard/leads/page.tsx)
Interface de CRM simplificada para visualizar os formulários de contato recebidos, alterar o status de atendimento (Novo, Em Atendimento, Concluído) e arquivar.

#### [NEW] [src/app/dashboard/usuarios/page.tsx](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/dashboard/usuarios/page.tsx)
Interface de controle de usuários (acessível apenas para administradores logados) que lista todos os colaboradores do painel e permite cadastrar novos usuários ou remover colaboradores existentes.

#### [NEW] [src/app/api/upload/route.ts](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/src/app/api/upload/route.ts)
Endpoint seguro de upload de imagens que valida o arquivo enviado no servidor e o envia para o bucket correspondente no Supabase Storage.

---

### [Integração no Site Principal]

Mapear a API do backend para alimentar as páginas estáticas originais de forma dinâmica.

#### [NEW] [dynamic-content.js](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/assets/js/dynamic-content.js)
Script que faz chamadas AJAX em background para carregar:
1. Banners da Home (`index.html`) dinamicamente no slider.
2. Lista de artistas na marquee da Home e na página `artistas/index.html`.
3. Imagens cadastradas no painel administrativo na tela `galeria/index.html`.

#### [MODIFY] [index.html](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/index.html)
Injeção do script `dynamic-content.js` e marcações ID nos containers para substituição dinâmica (mantendo o conteúdo atual como HTML estático de fallback).

---

## Plano de Verificação

### Testes Automatizados
- Scripts de validação de tipagem TypeScript via `npm run build` do Next.js.
- Verificação de esquemas do banco com `prisma validate`.

### Verificação Manual
1. **Teste de Autenticação:** Acessar `/admin/dashboard` sem logar e verificar se o NextAuth redireciona para `/admin`. Fazer login com credenciais incorretas e corretas.
2. **Teste de Validação Zod:** Tentar criar banners ou artistas com campos vazios ou formatos inválidos e verificar se a validação exibe mensagens de erro adequadas no front e impede a gravação no banco de dados.
3. **Teste de Upload de Imagem:** Enviar banners e fotos de artistas e validar o armazenamento no CDN e a renderização corretas nas miniaturas.
4. **Verificação de Integração Dinâmica:** Abrir o site principal (`index.html`) e validar se ele consome as APIs públicas do painel `/admin` preenchendo o slider e os artistas de forma assíncrona.

---

## Script SQL DDL do Banco de Dados

Caso prefira criar as tabelas diretamente no editor SQL do Supabase em vez de rodar o comando `npx prisma db push`, execute o seguinte script SQL:

```sql
-- Criar Tabela de Usuários (Administradores/Colaboradores)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Criar Tabela de Banners
CREATE TABLE IF NOT EXISTS "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "label" TEXT DEFAULT 'Destaque',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- Criar Tabela de Artistas
CREATE TABLE IF NOT EXISTS "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- Criar Tabela de Itens da Galeria
CREATE TABLE IF NOT EXISTS "GalleryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Geral',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- Criar Tabela de Leads de Contato (CRM)
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "artistInterest" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Criar Índice Único para e-mail do Usuário
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
```

