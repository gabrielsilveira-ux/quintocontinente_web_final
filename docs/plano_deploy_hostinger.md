# Plano de Implementação: Deploy do Painel Quinto Continente na Hostinger

Este documento apresenta o plano de arquitetura e passos para implantar o site Quinto Continente (estático) e seu Painel Administrativo (Next.js) na **Hostinger** utilizando o recurso de **Aplicações Web Node.js (hPanel)**.

---

## Arquitetura de Deploy Recomendada

A Hostinger executa aplicações Node.js usando o **Phusion Passenger** (gerenciador de servidores web). Para obter a melhor performance e organização, dividiremos o deploy da seguinte forma:

1. **Domínio Principal (`quintocontinente.com.br`):** Hospedará os arquivos estáticos do site principal na pasta raiz (`public_html/`).
2. **Subdomínio (`admin.quintocontinente.com.br`):** Apontará para a pasta `/public_html/admin/` e rodará a aplicação web Next.js via Node.js App no hPanel.
3. **Comunicação por API:** O site estático consumirá a API através do endereço absoluto do subdomínio (`https://admin.quintocontinente.com.br/api/...`), exigindo a ativação de cabeçalhos **CORS** nas APIs do Next.js.

---

## User Review Required

> [!IMPORTANT]
> **Acesso SSH na Hostinger:**
> Será recomendável ter o acesso SSH ativado na sua conta Hostinger para executar comandos de build do Next.js (`npm run build`) e sincronização de banco de dados (`npx prisma db push`). O console hPanel da Hostinger possui suporte básico para gerenciamento de dependências, mas o SSH oferece melhor controle de erros.
> 
> **Servidor Node.js Customizado (`server.js`):**
> O Passenger da Hostinger requer um arquivo de inicialização em CommonJS (geralmente `server.js` na raiz da pasta `admin/`) para carregar o Next.js de produção na porta e socket corretos fornecidos pelo servidor.

---

## Proposed Changes

Abaixo estão os arquivos novos e modificações propostas para viabilizar o deploy na Hostinger:

### [Configurações de Servidor Hostinger]

Adicionar arquivos e modificar rotas para suportar o ambiente de produção Node.js da Hostinger.

#### [NEW] [admin/server.js](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/server.js)
Arquivo de inicialização customizado para Next.js rodar sob Phusion Passenger na Hostinger.
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Next.js pronto na porta ${port}`);
  });
});
```

#### [MODIFY] [admin/next.config.js](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/admin/next.config.js)
Configuração de cabeçalhos CORS para permitir que as requisições assíncronas do site principal estático acessem as APIs públicas localizadas no subdomínio.
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "https://quintocontinente.com.br" }, // Ajustar para o seu domínio real
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

#### [MODIFY] [assets/js/dynamic-content.js](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/assets/js/dynamic-content.js)
Ajustar a base da URL da API de `/admin/api` (relativa) para a URL absoluta de produção do subdomínio administrativo na Hostinger, mantendo a detecção local de desenvolvimento.
```javascript
  function getApiUrl(endpoint) {
    if (window.location.protocol === 'file:') {
      return 'http://localhost:3000/api' + endpoint;
    }
    // Em produção na Hostinger, aponta diretamente para o subdomínio absoluto
    if (window.location.hostname !== 'localhost') {
      return 'https://admin.quintocontinente.com.br/api' + endpoint;
    }
    
    var path = window.location.pathname;
    var prefix = '';
    if (path.indexOf('/artistas/') !== -1 || path.indexOf('/galeria/') !== -1 || path.indexOf('/servicos/') !== -1 || path.indexOf('/sobre/') !== -1) {
      prefix = '../';
    }
    return prefix + 'admin/api' + endpoint;
  }
```

---

## Plano de Execução Passo a Passo na Hostinger

### Passo 1: Configurar Subdomínio no hPanel
1. Entre no seu painel Hostinger (hPanel).
2. Vá em **Domínios -> Subdomínios**.
3. Crie o subdomínio `admin` (ex: `admin.quintocontinente.com.br`) e certifique-se de que a pasta raiz esteja definida como `/public_html/admin`.

### Passo 2: Configurar o Aplicativo Node.js
1. No hPanel da Hostinger, busque pela ferramenta **Node.js** (Aplicativos Web).
2. Crie uma nova aplicação Node.js:
   * **Nome da Aplicação:** `Admin Panel`
   * **Domínio/Subdomínio:** Selecione `admin.quintocontinente.com.br`
   * **Versão do Node.js:** Selecione a versão recomendada (ex: `v20.x` ou `v18.x`)
   * **Diretório da Aplicação:** `/public_html/admin`
   * **Arquivo de Inicialização:** `server.js`
3. Salve as configurações.

### Passo 3: Enviar Arquivos e Configurar Env
1. Envie os arquivos do seu repositório Git para o gerenciador de arquivos da Hostinger (ou clone via SSH).
   * O site estático deve ficar na raiz `/public_html/`.
   * Os arquivos do Next.js devem ficar na pasta `/public_html/admin/`.
2. Na pasta `/public_html/admin/`, crie o arquivo `.env` contendo as credenciais de produção (Supabase e NextAuth).

### Passo 4: Instalação e Build de Produção
1. Conecte ao terminal via SSH da Hostinger.
2. Navegue até a pasta da aplicação Node.js:
   ```bash
   cd public_html/admin
   ```
3. Instale as dependências e gere o cliente do Prisma:
   ```bash
   npm install --production=false
   npx prisma generate
   ```
4. Execute o build do Next.js de produção:
   ```bash
   npm run build
   ```
5. No painel de controle Node.js da Hostinger, clique em **Reiniciar Aplicação** (Restart) para recarregar o servidor Node.js com o build mais recente e ler as configurações de `server.js`.
