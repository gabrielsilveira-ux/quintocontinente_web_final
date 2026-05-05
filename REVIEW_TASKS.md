# Revisão técnica — tarefas sugeridas

## 1) Erro de digitação (copy)
**Problema encontrado:** o texto usa `Proac`, mas o nome correto da política pública é `ProAC` (normalmente `ProAC/SP`).

**Tarefa sugerida:**
- Padronizar `Proac` para `ProAC` em todas as páginas e conteúdos institucionais.
- Validar se em algum contexto o termo esperado é `ProAC ICMS` ou `ProAC Editais`.

## 2) Bug funcional (navegação em deploy com subpath)
**Problema encontrado:** o `header` usa links absolutos (`/`, `/sobre/`, `/servicos/`), que quebram quando o site roda em subdiretório (ex.: GitHub Pages em `/quintocontinente-web/`).

**Tarefa sugerida:**
- Tornar os links do header independentes da raiz do domínio (usar estratégia consistente com o `components.js`, base path configurável, ou links relativos calculados).
- Adicionar checklist manual de validação em ambiente local e em subpath.

## 3) Comentário/discrepância de documentação
**Problema encontrado:** o README descreve renderização via placeholders (`#site-header`/`#site-footer` + `components.js`), mas a home atual contém navbar fixa inline em vez do cabeçalho carregado dinamicamente.

**Tarefa sugerida:**
- Atualizar o README para refletir o estado real da arquitetura **ou** migrar a home para o mesmo padrão de componentes dinâmicos.
- Incluir uma seção “Arquitetura atual” com exemplos por página.

## 4) Melhoria de testes
**Problema encontrado:** não há suíte de testes automatizados para JS/HTML.

**Tarefa sugerida:**
- Criar testes para `components.js` cobrindo:
  - resolução de path em diferentes profundidades;
  - marcação de link ativo no nav;
  - falha de `fetch` com fallback sem quebrar a página.
- Criar smoke test E2E (Playwright) para validar navegação e carregamento de header/footer em `index`, `sobre` e `servicos`.
