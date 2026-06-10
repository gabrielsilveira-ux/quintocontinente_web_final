# Walkthrough: Redesign Visual, Conteúdo & Painel Administrativo Quinto Continente

Este walkthrough descreve as atualizações de design, reestruturação de conteúdo, estratégias de SEO/Tracking e expansão do painel administrativo Next.js para a **Quinto Continente**.

---

## 1. O que foi Implementado

### A. Novo Design System ("Editorial Sofisticado")
- **Paleta de Cores:** Transição entre seções claras (`.section-white` com fundo `#F7F6F4`) e escuras (`.section-dark` com fundo `#0C0C0C`), reduzindo sombras neon artificiais por bordas finas e contraste harmônico.
- **Tipografia:** Uso padronizado de **Space Grotesk** para títulos de impacto e **Inter** para textos de leitura fluida.
- **Menu e CTAs:** Navegação unificada com Quem Somos, O Que Fazemos, Artistas e Contato. Introdução do botão direto de WhatsApp com link parametrizado. Remoção completa de referências a "Blog".

### B. Páginas Estáticas e Dinâmicas
- **Quem Somos (`sobre/index.html`):** Branding refinado baseado no histórico corporativo e de DNA de 25 anos do grupo Quinto Continente.
- **O Que Fazemos (`o-que-fazemos/index.html`):** Apresentação qualificada dos serviços (Curadoria Artística, Contratação, Produção Executiva, Projetos Especiais).
- **Template Dinâmico de Artistas (`artistas/artista.html`):** Roteamento cliente amigável (`artista.html?slug={slug}`) populando dinamicamente:
  - Biografia e gênero musical do artista.
  - Links oficiais de plataformas (Spotify, Instagram, Site Oficial).
  - Slider interativo de fotos (galeria do artista).
  - Tags de SEO/GEO dinâmicas e marcação JSON-LD `PerformingArtist` em tempo real.
- **Página de Contato (`contato/index.html`):** Formulário integrado de captação de briefings (leads) conectado diretamente ao banco de dados administrativo.

### C. Sistema de Tracking & UTMs
- **Captura Automática:** O script `dynamic-content.js` analisa parâmetros UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) e armazena-os de forma persistente em `sessionStorage` para repassá-los ao submeter formulários.
- **Data Layer & GTM:** Estruturação para disparar eventos (`lead_form_submit`, `whatsapp_click`, `artist_page_view`) na camada `window.dataLayer`. O código do container GTM já está embutido e comentado no HTML, pronto para ativação pós-lançamento.

### D. Banco de Dados e APIs (Supabase + Prisma)
- **Modelagem de Artistas:** Adicionados campos `slug`, `bio`, `genre`, `websiteUrl`, `instagramUrl`, `spotifyUrl` e `galleryUrls` (fotos extras).
- **Modelagem de Leads:** Adicionados campos de tráfego pago `utmSource`, `utmMedium`, `utmCampaign` e `utmContent`.
- **Sincronização:** Banco de dados do Supabase atualizado com sucesso através de `npx prisma db push`.

### E. Painel Administrativo Next.js (Dashboard CMS)
- **Painel de Artistas (`ArtistsManager.tsx`):**
  - Layout dividido em Abas interativas: *Dados Básicos*, *Bio & Links* e *Galeria*.
  - Geração automática de `slug` de URL a partir do nome digitado.
  - Módulo de upload múltiplo de fotos para a galeria do artista.
  - Painel de seleção de fotos da galeria geral do site (`/api/galeria`) para reuso rápido.
- **Painel de Leads (`LeadsManager.tsx`):**
  - Nova aba/coluna "Origem / Canal" exibindo badges de identificação rápidos (*Google Ads*, *Meta Ads*, *Orgânico*) de acordo com o meio de aquisição.
  - Seção detalhada de "Rastreamento de Tráfego (UTMs)" no modal de detalhes do Lead.
  - Filtro interativo por campanha UTM ativa na lista de contatos.
- **Painel de Páginas & Seções (`PagesManager.tsx`):**
  - Criação e gerenciamento de páginas institucionais com suporte a SEO (título, descrição, keywords).
  - Gerenciamento completo de seções: título, subtítulo, conteúdo explicativo, upload de banners de imagem, link de vídeo e reordenação (mover para cima/baixo).
  - Proteção de exclusão para slugs do sistema (`home`, `sobre`, `o-que-fazemos`, `contato`).
  - Alternância de design das seções entre fundos claros (`WHITE` com classe `.section-white`) e escuros (`DARK` com classe `.section-dark`).

---

## 2. Estrutura de Arquivos Criada ou Modificada

```
/ (raiz)
├── index.html                           # Menu atualizado, seções alternadas, SOBRE dinâmico, SEO
├── sitemap.xml                          # Sitemap para indexação
├── robots.txt                           # Regras de indexação (ignora caminhos /admin)
├── sobre/index.html                     # Apresentação do Grupo Quinto Continente (seções dinâmicas)
├── o-que-fazemos/index.html             # Apresentação de Serviços (seções dinâmicas)
├── contato/index.html                   # Página de conversão com formulário
├── artistas/
│   ├── index.html                       # Grade de cards com links amigáveis
│   └── artista.html                     # Template dinâmico (carrossel, bio, redes)
├── assets/
│   ├── css/style.css                    # Design system (Editorial escuro/claro, botões, overrides de contraste)
│   └── js/dynamic-content.js            # Lógica UTMs, GTM Data Layer e renderização de Artistas/Páginas
│
└── admin/                               # Painel Administrativo Next.js
    ├── prisma/
    │   ├── schema.prisma                # Estruturas atualizadas (Artist, Lead, Page e PageSection)
    │   └── seed.ts                      # População de dados iniciais de artistas e páginas CMS padrão
    └── src/
        ├── lib/schemas.ts               # Validação de formulários Zod para leads, artistas e páginas
        ├── app/
        │   ├── api/
        │   │   ├── paginas/                 # API GET/POST/PUT/DELETE para páginas e seções
        │   │   │   ├── route.ts
        │   │   │   └── secoes/route.ts
        │   │   └── ...
        │   └── dashboard/
        │       └── paginas/                 # Rota do dashboard do CMS de páginas
        │           └── page.tsx
        └── components/
            ├── ArtistsManager.tsx       # Mapeamento e upload completo de informações de Artistas
            ├── LeadsManager.tsx         # Painel de acompanhamento e rastreamento de campanhas
            └── PagesManager.tsx         # Gerenciador completo de páginas e seções do CMS
```

---

## 3. Validação e Qualidade de Compilação

Todos os testes de tipagem e integridade do projeto Next.js na pasta `/admin` foram realizados:
- **TypeScript:** Validado via `npx tsc --noEmit` resultando em zero erros de tipagem.
- **Compilação Next.js:** O comando `npm run build` compilou com sucesso em um pacote de produção otimizado com todas as rotas estáticas e dinâmicas devidamente otimizadas.

---

## 4. Instruções de Ativação Pós-Lançamento (GTM)

Para colocar o rastreamento do Google Tag Manager para rodar:
1. Acesse o [Google Tag Manager](https://tagmanager.google.com) e crie um container do tipo **Web**.
2. Substitua o ID de exemplo nos blocos comentados de `<head>` e `<body>` de todas as páginas estáticas pelo seu ID real (formato: `GTM-XXXXXXX`).
3. Descomente as linhas de inclusão do script do GTM nas páginas.
4. Configure no GTM os gatilhos escutando os eventos do `dataLayer` (ex: gatilho de evento personalizado para `lead_form_submit` e `whatsapp_click`).
