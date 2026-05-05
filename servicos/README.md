# Quinto Continente — Web

Site institucional da **Quinto Continente**, hub estratégico de entretenimento por Oceania Eventos.

---

## Estrutura do repositório

```
/
├── index.html                  # Home
├── 404.html                    # Erro personalizado
├── components/
│   ├── header.html             # Nav injetada dinamicamente
│   └── footer.html             # Footer injetado dinamicamente
├── sobre/
│   └── index.html              # Página "Quem Somos" expandida
├── servicos/
│   ├── index.html              # Catálogo completo de serviços
│   └── booking/
│       └── index.html          # Formulário de briefing/booking
├── assets/
│   ├── css/
│   │   └── style.css           # Sistema de design centralizado
│   ├── js/
│   │   ├── components.js       # Carrega header.html e footer.html
│   │   └── main.js             # Cursor, scroll reveal, forms, animações
│   └── images/
│       └── logo.png            # Logotipo
```

---

## Como funciona o sistema de componentes

Cada página inclui ao final:

```html
<div id="site-header"></div>
<!-- conteúdo da página -->
<div id="site-footer"></div>

<script src="/assets/js/components.js"></script>
<script src="/assets/js/main.js"></script>
```

O `components.js` detecta automaticamente a profundidade do path e carrega os componentes com o prefixo correto (`../components/` para páginas em subpastas). Também marca o link ativo no nav via `classList.add('active')`.

---

## Deploy (site estático)

O site é **100% estático** — sem backend, sem build step.

### GitHub Pages
1. Vá em *Settings → Pages*
2. Selecione branch `main`, pasta `/` (raiz)
3. O site ficará em `https://[usuario].github.io/quintocontinente-web/`

### Netlify / Vercel
Faça drag-and-drop da pasta raiz ou conecte o repositório. Nenhuma configuração extra é necessária.

### Servidor próprio (Apache/Nginx)
Adicione redirecionamento para 404:

**Apache (.htaccess):**
```apache
ErrorDocument 404 /404.html
```

**Nginx:**
```nginx
error_page 404 /404.html;
```

---

## Blog WordPress — `blog.quintocontinente.com.br`

O blog roda em um **subdomínio separado** com WordPress, completamente independente do site estático.

### Configuração de DNS
No painel do seu registrador/DNS, adicione:

| Tipo  | Nome   | Valor                     |
|-------|--------|---------------------------|
| A     | blog   | IP do servidor WordPress  |
| CNAME | blog   | seu-host.wordpress.com    |

### Instalação do WordPress
1. Faça o upload do WordPress no servidor
2. Configure `wp-config.php` com o banco de dados
3. Defina `WP_HOME` e `WP_SITEURL` como `https://blog.quintocontinente.com.br`

### Consistência visual com o site principal

Para que o blog herde a identidade da Quinto Continente, crie um tema filho ou use um plugin de header/footer customizado. Copie as variáveis CSS abaixo para o `style.css` do tema WordPress:

```css
:root {
  --accent:  #ff5858;
  --bg:      #0A0A0A;
  --text:    #EFEFEF;
  --muted2:  #777777;
}
```

Fontes (adicione no `functions.php` do tema):
```php
function qc_enqueue_fonts() {
    wp_enqueue_style(
        'qc-fonts',
        'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400&display=swap'
    );
}
add_action('wp_enqueue_scripts', 'qc_enqueue_fonts');
```

### Link de retorno ao site principal
No header do tema WordPress, inclua um link "← quintocontinente.com.br" apontando para o site estático.

### SEO e canonical
Certifique-se de que o WordPress não indexa `blog.quintocontinente.com.br` como parte do site principal — são domínios separados para o Google.

---

## Variáveis CSS do design system

| Variável       | Valor       | Uso                          |
|----------------|-------------|------------------------------|
| `--accent`     | `#ff5858`   | Cor primária / CTAs          |
| `--accent-dim` | `rgba(255,88,88,.10)` | Fundos de destaque  |
| `--bg`         | `#0A0A0A`   | Fundo principal              |
| `--bg2`        | `#111111`   | Fundo alternado              |
| `--bg3`        | `#161616`   | Fundo de cards               |
| `--surface`    | `#1E1E1E`   | Superfícies interativas      |
| `--text`       | `#EFEFEF`   | Texto principal              |
| `--muted2`     | `#777777`   | Texto secundário             |
| `--line2`      | `rgba(255,255,255,.10)` | Bordas           |

---

## Adicionar novas páginas

1. Crie a pasta e o `index.html`
2. Copie o boilerplate de qualquer página existente
3. Ajuste os paths de `../assets/` conforme a profundidade
4. Adicione o link no `components/header.html` e `components/footer.html`

O `components.js` resolve automaticamente o path correto para qualquer nível de profundidade.
