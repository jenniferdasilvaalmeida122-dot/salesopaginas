# Rotina Glow Up

Página responsiva em português, com a logo fornecida e layout inspirado na referência.

## Executar

Sem dependências de instalação. Em `/workspace/salesopaginas`:

```sh
python3 -m http.server 3000 --bind 0.0.0.0
```

Também é possível abrir `index.html` diretamente. Fotos (Unsplash) e fontes (Google Fonts) precisam de conexão com a internet. A logo fica em `assets/logo.png`.

Menu móvel, navegação por seções e perguntas expansíveis funcionam sem serviços externos. Os botões levam aos conteúdos da página; não há checkout ou cadastro conectado.

## Publicar no GitHub Pages

1. No repositório `jenniferdasilvaalmeida122-dot/salesopaginas`, abra **Settings → Pages**.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Em **Settings → Actions → General**, permita GitHub Actions e as ações oficiais `actions/*` usadas pelo workflow. O workflow declara apenas `contents: read`, `pages: write` e `id-token: write`; não é necessário liberar escrita geral no repositório nem criar um token pessoal.
4. Envie os arquivos para `main`. Em **Actions → Publicar Rotina Glow Up no GitHub Pages**, acompanhe a execução. Para repetir, use **Run workflow → main → Run workflow**.
5. Se aparecer uma aprovação de ambiente, abra a execução e use **Review deployments → github-pages → Approve and deploy**, se você for um revisor autorizado.

URL esperada após o primeiro deploy bem-sucedido: https://jenniferdasilvaalmeida122-dot.github.io/salesopaginas/

O plano da conta precisa permitir Pages para a visibilidade do repositório. Repositórios públicos podem usar Pages no GitHub Free. Se um repositório privado exigir plano pago, mantenha-o privado e ajuste o plano, ou decida explicitamente se deseja torná-lo público; o workflow não muda a visibilidade.
