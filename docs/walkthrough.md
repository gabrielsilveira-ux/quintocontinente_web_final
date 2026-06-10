# Walkthrough: Painel Administrativo Quinto Continente

Este documento descreve todas as alterações e novas implementações realizadas para criar o painel administrativo em Next.js integrado ao site institucional da **Quinto Continente**.

---

## O que foi desenvolvido

Desenvolvemos um painel administrativo completo e moderno (modo escuro premium alinhado à identidade visual) dentro da pasta `/admin`, utilizando a stack solicitada. Além disso, criamos a integração dinâmica que permite que o site estático atual consuma as informações cadastradas nesse painel de forma transparente.

### Estrutura de Arquivos Criada/Modificada

```
/ (raiz)
├── .gitignore                      # [MODIFICADO] Ignora arquivos .env, dependências e build local
├── index.html                      # [MODIFICADO] Injeta dynamic-content.js e mantém fallback estático
├── robots.txt                      # [NOVO] Configura regras de indexação global (desativa indexação de /admin/*)
├── artistas/
│   └── index.html                  # [MODIFICADO] Injeta dynamic-content.js e remove busca em JS estático
├── galeria/
│   └── index.html                  # [MODIFICADO] Adiciona seção de grid e injeta dynamic-content.js
├── docs/
│   ├── plano_implementacao.md      # [NOVO] Cópia do plano de design aprovado
│   └── walkthrough.md              # [NOVO] Este documento de acompanhamento e configuração
│
└── admin/                          # [NOVO] Projeto Next.js do Painel Administrativo
    ├── prisma/
    │   ├── schema.prisma           # Modelos de dados (User, Banner, Artist, GalleryItem, Lead)
    │   └── seed.ts                 # Cria o admin inicial padrão e dados de fallback
    ├── src/
    │   ├── components/
    │   │   ├── Providers.tsx       # SessionProvider do NextAuth.js
    │   │   ├── Sidebar.tsx         # Sidebar de navegação responsiva e elegante
    │   │   ├── LoginForm.tsx       # Formulário de login com validações Zod no cliente
    │   │   ├── BannersManager.tsx  # CRUD de Banners com upload integrado
    │   │   ├── ArtistsManager.tsx  # CRUD de Artistas com pesquisa e upload
    │   │   ├── GalleryManager.tsx  # CRUD de Galeria com filtros e upload
    │   │   ├── LeadsManager.tsx    # CRM de Leads de contato integrado ao WhatsApp/E-mail
    │   │   └── UsersManager.tsx    # Controle de administradores e colaboradores
    │   ├── lib/
    │   │   ├── db.ts               # Singleton do Prisma Client
    │   │   ├── auth.ts             # [NOVO] Configuração centralizada do NextAuth.js (evita erro de compilação em rotas)
    │   │   └── schemas.ts          # Definições de validação estritas Zod
    │   ├── types/
    │   │   └── next-auth.d.ts      # Tipagens customizadas do NextAuth (id e role)
    │   └── app/
    │       ├── globals.css         # Importações do Tailwind CSS e estilos premium (corrigida cor 'text')
    │       ├── layout.tsx          # Layout global e configuração de fontes do Google (robots noindex/nofollow adicionados)
    │       ├── robots.ts           # [NOVO] Configura exclusão automática de indexação do Next.js
    │       ├── page.tsx            # Tela de login com validação de sessão server-side
    │       ├── dashboard/
    │       │   ├── layout.tsx      # Layout protegido do painel lateral e cabeçalho
    │       │   ├── page.tsx        # Visão Geral (Overview) com estatísticas e leads recentes
    │       │   ├── banners/        # Interface de gerenciamento de Banners
    │       │   ├── artistas/       # Interface de gerenciamento de Artistas
    │       │   ├── galeria/        # Interface de gerenciamento de Fotos da Galeria
    │       │   ├── leads/          # CRM de Leads de contato
    │       │   └── usuarios/       # Interface de controle de colaboradores (apenas ADMIN)
    │       └── api/
    │           ├── auth/[...nextauth]  # Configurações JWT do NextAuth.js (rebatizado de %5B...nextauth%5D)
    │           ├── upload/             # API de Upload direto para o Supabase Storage
    │           ├── banners/            # API de Banners (GET público, POST/PUT/DELETE protegido)
    │           ├── artistas/           # API de Artistas (GET público, POST/PUT/DELETE protegido)
    │           ├── galeria/            # API de Galeria (GET público, POST/PUT/DELETE protegido)
    │           ├── leads/              # API de Leads (POST público para contato, GET/PUT/DELETE protegido)
    │           └── usuarios/           # API de Usuários (GET/POST/DELETE protegido para ADMIN)
```

---

## Padrões de Segurança Implementados

1. **Autenticação e Sessão:** O painel usa **NextAuth.js** com criptografia JWT. Nenhum cookie de sessão é acessível pelo JavaScript do cliente (protegidos via flag `httpOnly`), mitigando ataques XSS.
2. **Criptografia de Senhas:** Senhas são salvas no banco Supabase apenas sob o formato de hash criptográfico seguro gerado pelo **bcryptjs** (rodando em 10 salt rounds).
3. **Controle de Acesso em Rotas de API (Server-side):** Todas as rotas de API modificadoras (POST, PUT, DELETE) e rotas de upload fazem checagem prévia de sessão usando `getServerSession` do NextAuth. Se um usuário não autenticado tentar fazer requisições HTTP diretas, receberá status de erro `401 Unauthorized`.
4. **Validação Estrita com Zod:** Todos os payloads de API são interceptados no servidor e validados contra esquemas do **Zod**, rejeitando qualquer entrada maliciosa ou fora de tipo. No cliente, o Zod valida os campos antes do envio, gerando feedback de erro sem requisições desnecessárias.
5. **Prevenção de Autoexclusão:** A interface de colaboradores e a API de usuários barram tentativas de um administrador logado excluir sua própria conta, evitando travamentos de acesso.
6. **Políticas de Acesso Supabase Storage:** O endpoint de upload utiliza a chave privada de servidor do Supabase (`SUPABASE_SERVICE_ROLE_KEY`), mantendo o bucket seguro no cliente.

---

## Como Configurar e Executar Localmente

### Passo 1: Configurar Variáveis de Ambiente

Crie um arquivo `.env` dentro da pasta `admin/` com as chaves a seguir:

```env
# Banco de Dados (Supabase PostgreSQL Connection String)
DATABASE_URL="postgresql://postgres:[senha]@db.[id-projeto].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[senha]@db.[id-projeto].supabase.co:5432/postgres"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gerar-chave-aleatoria-longa-e-segura"

# Supabase Storage (para upload de fotos)
NEXT_PUBLIC_SUPABASE_URL="https://[id-projeto].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role-privada-do-supabase"
```

### Passo 2: Executar Comandos de Configuração

Navegue até a pasta `/admin` e instale as dependências:

```bash
cd admin
npm install
```

Sincronize a estrutura de tabelas do Prisma com seu banco Supabase e crie o usuário administrador inicial:

```bash
npx prisma db push
npx prisma db seed
```

> [!NOTE]
> O comando `seed` criará o usuário administrador inicial:
> * **E-mail:** `admin@quintocontinente.com.br`
> * **Senha:** `QCAdmin2026!`
>
> Faça login com esses dados e altere a senha imediatamente na primeira sessão por segurança.

### Passo 3: Executar o Servidor de Desenvolvimento

Inicie o servidor de desenvolvimento do Next.js:

```bash
npm run dev
```

O painel administrativo estará acessível em `http://localhost:3000` (ou `http://localhost:3000/admin` se configurado redirecionamento no deploy).

### Passo 4: Buckets no Supabase Storage

No painel do Supabase, vá em **Storage** e crie os buckets a seguir, marcando a opção de **Bucket Público** (para que as imagens possam ser exibidas no site institucional) e definindo limites de tamanho recomendados (restringir tamanho máximo do arquivo):
- **`banners`**: Limite recomendado de **5 MB** (`5242880` bytes) — Ideal para banners horizontais em alta resolução.
- **`artists`**: Limite recomendado de **2 MB** (`2097152` bytes) — Adequado para fotos de miniaturas/perfil dos artistas.
- **`gallery`**: Limite recomendado de **3 MB** (`3145728` bytes) — Adequado para fotos de cobertura de eventos/shows.

---

## Verificação da Integração Dinâmica

Para testar localmente que o site estático consome as APIs do Next.js:
1. Com o Next.js rodando na porta `3000`, abra o arquivo `index.html` em seu navegador.
2. O script `dynamic-content.js` identificará que está em ambiente de desenvolvimento local e consumirá automaticamente a API do Next.js rodando em `http://localhost:3000/api`.
3. Preencha o formulário de contato do site estático e clique em "Solicitar Atendimento".
4. Verifique no painel administrativo em `http://localhost:3000/dashboard/leads` se a solicitação foi gravada com sucesso no banco de dados e exibe o status de **NOVO**!

---

## Estrutura SQL das Tabelas (DDL)

Caso prefira configurar as tabelas manualmente através do **SQL Editor** do Supabase, execute o seguinte script:

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

