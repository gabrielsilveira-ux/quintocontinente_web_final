# Guia de Deploy: Painel Quinto Continente na Vercel

Este documento descreve o plano e o passo a passo para implantar a aplicação Next.js (Painel Administrativo) e a Landing Page estática na **Vercel**.

---

## Estrutura do Deploy

Como o projeto está estruturado em um formato híbrido (site estático na raiz e Next.js dentro de `/admin`), faremos o deploy na Vercel criando **dois projetos separados** dentro da mesma conta:

1. **Projeto 1: Site Institucional (Estático)**
   * **Domínio:** `quintocontinente.com.br`
   * **Pasta Raiz:** `/` (Raiz do repositório)
2. **Projeto 2: Painel Administrativo (Next.js)**
   * **Domínio:** `admin.quintocontinente.com.br` (Subdomínio)
   * **Pasta Raiz:** `/admin`

Essa divisão garante máxima velocidade de carregamento (a Vercel serve arquivos estáticos via CDN global de altíssima performance) e isola o servidor de APIs e banco de dados no subdomínio.

---

## Passo a Passo para o Deploy do Painel (`/admin`)

### Passo 1: Criar o Projeto no Dashboard da Vercel
1. Acesse o painel da [Vercel](https://vercel.com) e clique em **Add New -> Project**.
2. Conecte com a sua conta do GitHub e importe o repositório do projeto.
3. Nas configurações de importação, localize o campo **Root Directory** (Diretório Raiz) e clique em **Edit**.
4. Selecione a pasta **`admin`** e confirme. (Isso instrui a Vercel a compilar apenas o painel Next.js).

### Passo 2: Configurar as Variáveis de Ambiente
Na seção **Environment Variables** durante a criação do projeto, adicione as seguintes chaves de ambiente:

| Chave | Descrição | Exemplo / Origem |
|---|---|---|
| `DATABASE_URL` | String de conexão com Supabase (Pooler) | Obter no painel do Supabase (Settings -> Database) |
| `DIRECT_URL` | String de conexão direta com Supabase (Direct) | Obter no painel do Supabase (Settings -> Database) |
| `NEXTAUTH_SECRET` | Chave de criptografia para cookies de sessão | Uma string aleatória longa (pode gerar no terminal com `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL final do seu painel de administração | `https://admin.quintocontinente.com.br` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL da API do seu projeto Supabase | `https://[id-projeto].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role secreta do Supabase (para upload) | Obter no painel do Supabase (Settings -> API) |

### Passo 3: Executar a implantação
1. Clique em **Deploy**. A Vercel instalará as dependências e efetuará o build de produção de forma 100% automática.
2. Após o término, o painel administrativo estará online no subdomínio temporário gerado pela Vercel (ex: `admin-quinto-continente.vercel.app`).

### Passo 4: Mapear Subdomínio Próprio
1. No projeto administrativo da Vercel, acesse **Settings -> Domains**.
2. Adicione o seu subdomínio: `admin.quintocontinente.com.br`.
3. Siga as instruções de DNS da Vercel (geralmente adicionar um apontamento do tipo `CNAME` nas configurações de DNS da Hostinger ou de onde comprou seu domínio apontando para `cname.vercel-dns.com`).

---

## Passo a Passo para o Deploy da Landing Page (`/`)

1. Crie um **novo projeto** no painel da Vercel clicando em **Add New -> Project**.
2. Importe o mesmo repositório do GitHub.
3. No campo **Root Directory**, mantenha o padrão `/` (Raiz).
4. No campo **Build and Development Settings**, altere o **Framework Preset** para **`Other`** (indicando que é um site estático comum sem build).
5. Clique em **Deploy**. O site estático estará no ar instantaneamente.
6. Vá em **Settings -> Domains** e adicione o seu domínio principal: `quintocontinente.com.br` e `www.quintocontinente.com.br` (efetuando os apontamentos do tipo `A` e `CNAME` no DNS conforme orientações da Vercel).

---

## Configuração CORS e URLs das APIs

Como ativamos suporte global a CORS no Next.js (`admin/next.config.js`), a Landing Page estática conseguirá enviar formulários e ler dados do subdomínio administrativo da Vercel sem problemas de segurança de navegador. 

No arquivo [`assets/js/dynamic-content.js`](file:///c:/Users/gabri/OneDrive/Documentos/GitHub/quintocontinente_web_final/quintocontinente_web_final-1/assets/js/dynamic-content.js), configure a URL de produção com o endereço do seu subdomínio real:

```javascript
// O dynamic-content.js já está configurado para ler:
if (window.location.hostname !== 'localhost') {
  return 'https://admin.quintocontinente.com.br/api' + endpoint;
}
```
*(Caso a URL do seu subdomínio mude, basta ajustar o link `https://admin.quintocontinente.com.br/api` nesta função).*
