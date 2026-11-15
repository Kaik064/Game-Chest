# Atualizações — Game Chest

Registro cronológico das alterações do projeto. **Toda mudança deve ser registrada neste arquivo** (ver `AGENTS.md`).

---

## 2026-11-15 — Preço e loja Steam nas reviews pessoais

### O que foi feito

- Adicionei o preço atual e o link **Ver na Steam** também na seção **Suas reviews** do perfil do usuário.
- A mesma informação foi adicionada aos perfis públicos acessados pela página Explorar.
- O componente reutilizado é `SteamStoreLink`, mantendo o comportamento e o visual iguais ao feed.

### Arquivos

- Modificados: `game-chest/frontend/src/pages/Profile.tsx`, `game-chest/frontend/src/pages/UsuarioPerfil.tsx` e `atualizacoes.md`.

### Como testar / validar

- Abrir `/perfil`, localizar uma review em **Suas reviews** e conferir o preço e o link Steam abaixo do título.
- Abrir um perfil em `/usuarios/:id` e verificar o mesmo comportamento.
- `npm run build` no frontend: passou após esta alteração.

### Não testado

- A validação visual no navegador ainda não foi realizada nesta alteração; o build TypeScript/Vite foi concluído com sucesso.

---

## 2026-11-15 — Preço e loja Steam também no feed

### O que foi feito

- O feed agora exibe o preço atual do jogo junto da review em destaque e nas demais linhas do diário.
- Cada publicação ganhou o link **Ver na Steam**, que abre diretamente a página oficial do jogo em uma nova aba.
- O preço é carregado pelo AppID da review usando o endpoint de detalhes Steam já existente; o cache do backend evita repetir chamadas desnecessárias.
- Se a consulta de preço falhar, o link direto continua disponível, garantindo que a ação principal não desapareça.

### Arquivos

- Criado: `game-chest/frontend/src/components/SteamStoreLink.tsx`.
- Modificados: `game-chest/frontend/src/pages/Home.tsx`, `game-chest/frontend/src/components/ReviewRow.tsx` e `atualizacoes.md`.

### Decisões técnicas

- O preço permanece dinâmico, pois pode mudar diariamente na Steam e não deve ficar congelado no banco.
- O componente reutilizável é usado no destaque e nas linhas para manter o feed consistente.
- As chamadas são feitas por AppID e aproveitam o cache de detalhes do backend, em vez de consultar uma lista local de jogos.

### Como testar / validar

- `npx tsc --noEmit` no backend: passou anteriormente com o endpoint de detalhes.
- Teste esperado no feed: abrir `http://localhost:5173`, localizar uma review e confirmar preço em amarelo e o link **Ver na Steam**.

### Não testado

- O teste visual do novo elemento no navegador ainda deve ser feito na tela do feed.

### Validação adicional

- `npm run build` no frontend: passou após a implementação.

---

## 2026-11-15 — Preço atual e link da loja Steam

### O que foi feito

- A ficha do jogo agora consulta e exibe o preço atual retornado pela Steam, usando a região/moeda configurada para o Brasil.
- Quando existe promoção, o formulário mostra o preço atual, preço original e percentual de desconto.
- Jogos gratuitos aparecem como `Grátis`.
- Adicionei o botão **Steam** no jogo selecionado do autocomplete.
- Adicionei o botão **Ver na loja Steam** junto dos metadados do jogo no formulário.
- Os links abrem a página oficial da Steam em uma nova aba.

### Arquivos

- Modificados: `game-chest/backend/src/controllers/steamController.ts`, `game-chest/frontend/src/types/index.ts`, `game-chest/frontend/src/components/SteamAutocompleteInput.tsx`, `game-chest/frontend/src/pages/ReviewForm.tsx` e `atualizacoes.md`.

### Decisões técnicas

- O preço não é salvo como valor permanente no banco: ele é consultado sob demanda para evitar exibir um preço desatualizado.
- A Steam retorna o preço formatado, então a interface preserva o formato regional, como `R$ 46,99`.
- O link usa diretamente o AppID oficial (`store.steampowered.com/app/:appid`), sem redirecionador intermediário.

### Como testar / validar

- `GET /api/steam/app/367520` retornou Hollow Knight com preço `R$ 46,99` e link oficial da loja.
- `npx tsc --noEmit` no backend: passou.
- `npm run build` no frontend: passou.
- Teste manual esperado: criar uma review, selecionar um jogo e clicar em **Ver na loja Steam**.

### Não testado

- Não foi possível forçar uma promoção real da Steam para validar visualmente o preço original e o percentual de desconto; o código utiliza os campos oficiais `price_overview` quando a Steam os disponibiliza.

---

## 2026-11-15 — Link do autor para o diário público

### O que foi feito

- Tornei clicável o nome do autor nas reviews do feed.
- O clique leva para `/usuarios/:id`, exibindo o diário público e as reviews daquele usuário.
- A alteração foi aplicada tanto ao review em destaque quanto às linhas de reviews recentes.
- Reviews antigas sem `usuario_id` continuam sendo exibidas normalmente, mas não recebem link até serem migradas para uma conta.

### Arquivos

- Modificados: `game-chest/frontend/src/pages/Home.tsx`, `game-chest/frontend/src/components/ReviewRow.tsx` e `atualizacoes.md`.

### Como testar / validar

- Abrir o feed em `http://localhost:5173`.
- Clicar no nome de um autor, como uma das contas de teste.
- Confirmar que a aplicação navega para o diário público correspondente.

### Não testado

- Não foi feito teste automatizado de clique no navegador nesta alteração.

---

## 2026-11-15 — Inicializador local para apresentação

### O que foi feito

- Criei `iniciar-game-chest.bat` na raiz do projeto.
- O arquivo verifica se o backend e o frontend existem, abre cada servidor em uma janela própria e executa `npm run dev` automaticamente.
- Ao final, exibe os endereços locais do frontend, backend e health check.

### Como testar / validar

- Duplo clique em `iniciar-game-chest.bat` na raiz do projeto.
- O frontend deve abrir em `http://localhost:5173` e o backend em `http://localhost:3000`.
- O health check fica disponível em `http://localhost:3000/api/health`.

### Não testado

- O arquivo foi criado para Windows, mas não foi executado graficamente nesta sessão. Os comandos usados são os mesmos já validados individualmente nos dois diretórios.

---

## 2026-11-15 — Busca de usuários e perfis públicos no feed

### O que foi feito

- Adicionei a seção **Explorar** na navegação principal.
- Criei busca pública por nome de usuário em `/usuarios`.
- Criei a página `/usuarios/:id`, com avatar, nome, quantidade de reviews e todas as reviews públicas da pessoa.
- Adicionei endpoints públicos para busca e consulta de perfil, sem expor e-mail, senha ou SteamID privado:
  - `GET /api/auth/usuarios?q=...`
  - `GET /api/auth/usuarios/:id`
- Criei o comando `npm run db:seed:test-users`, que adicionou 10 contas de teste e uma review para cada conta. O seed é idempotente: executar novamente não duplica essas reviews.

### Contas de teste

- E-mails: `ana.pixel@teste.gamechest.local`, `bruno.controle@teste.gamechest.local`, `carol.indie@teste.gamechest.local`, `diego.coop@teste.gamechest.local`, `elisa.rpg@teste.gamechest.local`, `felipe.retro@teste.gamechest.local`, `gi.lima@teste.gamechest.local`, `hugo.fps@teste.gamechest.local`, `iara.narrativa@teste.gamechest.local` e `joao.sandbox@teste.gamechest.local`.
- Senha de teste comum: `Teste123!`.
- Essas contas não possuem vínculo Steam; servem apenas para testar descoberta, login e reviews públicas.

### Arquivos

- Criados: `game-chest/frontend/src/pages/Usuarios.tsx`, `game-chest/frontend/src/pages/UsuarioPerfil.tsx`, `game-chest/backend/src/scripts/seedTestUsers.ts`.
- Modificados: `game-chest/frontend/src/App.tsx`, `game-chest/frontend/src/components/Navbar.tsx`, `game-chest/frontend/src/lib/api.ts`, `game-chest/frontend/src/types/index.ts`, `game-chest/backend/src/controllers/authController.ts`, `game-chest/backend/src/routes/authRoutes.ts`, `game-chest/backend/package.json` e `atualizacoes.md`.

### Decisões técnicas e motivos

- A busca usa o banco de usuários, sem trazer e-mails nem dados de autenticação para o frontend.
- O perfil público consulta somente reviews associadas ao `usuario_id`, evitando que uma mudança de nome ou filtro por texto revele reviews de outra pessoa.
- Reutilizei os componentes visuais existentes (`Cover`, `StarRating`, `StatusBadge`, `EmptyState`) para manter o padrão editorial do feed.
- O seed usa contas com domínio local `.gamechest.local` e senha explícita de teste para não se confundir com contas reais.

### Como testar / validar

- `npm run db:seed:test-users`: executado com sucesso, criando 10 contas e 10 reviews.
- `GET /api/auth/usuarios?q=Indie`: retornou Carol Indie com uma review.
- `GET /api/auth/usuarios/:id`: retornou perfil público e review associada.
- `npx tsc --noEmit` no backend e frontend: passaram.
- `npm run build` no frontend: passou.
- Teste manual esperado: abrir **Explorar**, pesquisar `Indie`, clicar em Carol Indie e visualizar o diário público.

### Não testado

- Não foi feito teste visual automatizado no navegador nesta alteração; a validação visual deve ser feita abrindo `/usuarios` no frontend local.

---

## 2026-11-15 — Botão de review na biblioteca Steam

### O que foi feito

- Adicionei o botão **Adicionar review** ao lado de cada jogo da biblioteca Steam.
- O botão abre o formulário existente de nova review com o jogo já selecionado, capa, AppID e horas preenchidas.
- O usuário continua podendo modificar as horas e preencher livremente status, nota e texto antes de publicar.
- Ajustei a filtragem da biblioteca para não exibir jogos que aparecem como `0h` depois do arredondamento; agora o frontend só recebe jogos com pelo menos uma hora exibível.

### Arquivos

- Modificados: `game-chest/frontend/src/pages/Profile.tsx`, `game-chest/frontend/src/pages/ReviewForm.tsx`, `game-chest/backend/src/controllers/steamController.ts` e `atualizacoes.md`.

### Decisões técnicas

- Reutilizei o `ReviewForm` existente e passei o jogo pelo estado de navegação do React Router, evitando criar uma segunda tela ou duplicar regras de validação.
- A seleção inicial é aplicada somente na criação; o modo de edição continua protegido contra troca do jogo.
- O filtro considera as horas inteiras exibidas na interface, impedindo que jogos com poucos minutos apareçam visualmente como `0h`.

### Como testar / validar

- `npx tsc --noEmit` no backend: passou.
- `npm run build` no frontend: passou.
- A biblioteca Steam real foi consultada novamente: retornou 14 jogos e nenhum com `horas_jogadas = 0`.
- Teste manual esperado: Perfil → Biblioteca Steam → **Adicionar review** → formulário com jogo e horas preenchidos.

### Não testado

- Não publiquei uma review real pelo novo botão para não inserir dados de teste no diário do usuário.

---

## 2026-11-15 — Correção do carregamento da chave Steam no ambiente local

### O que foi feito

- Corrigi o carregamento das variáveis de ambiente para o `.env` substituir uma variável `STEAM_API_KEY` vazia herdada pelo processo do terminal.
- A alteração foi aplicada ao servidor, à configuração do banco e ao script de migração usando `dotenv.config({ override: true })`.
- Reiniciei o backend e validei a biblioteca Steam da conta vinculada exibida no perfil: retornou **17 jogos com horas**, totalizando aproximadamente **465 horas**. Jogos sem horas não apareceram no resultado.

### Arquivos

- Modificados: `game-chest/backend/src/server.ts`, `game-chest/backend/src/config/database.ts`, `game-chest/backend/src/scripts/migrate.ts` e `atualizacoes.md`.

### Decisão técnica

- O `.env` local foi tratado como fonte de configuração do projeto. Isso resolve o caso em que o terminal ou um processo antigo já possuía `STEAM_API_KEY=` vazia, situação em que o comportamento padrão do dotenv mantinha a variável vazia.

### Como validar

- `npx tsc --noEmit` no backend: passou.
- `npm run build` no frontend: passou.
- `GET /api/steam/user-games/76561199755438801`: passou, retornando 17 jogos com horas.

### Não testado

- O fluxo completo de OpenID foi validado anteriormente até a vinculação da conta; não foi repetida uma nova autorização nesta correção, pois a conta já estava vinculada.

---

## 2026-11-15 — Fase 5: contas, vínculo Steam e catálogo enriquecido

### O que foi feito

- Implementei contas persistentes com e-mail, nome de exibição e senha protegida com `bcryptjs`.
- Adicionei sessão por JWT em cookie `httpOnly`, com CORS configurado para credenciais e rotas de registrar, entrar, sair, sessão atual e edição do perfil.
- Reviews novas exigem login, ficam associadas ao usuário autenticado e só podem ser editadas ou removidas pelo próprio dono. O nome salvo na review continua como snapshot para preservar o histórico do feed.
- Criei migração idempotente (`npm run db:migrate`) para a tabela `usuarios`, `reviews.usuario_id`, chave estrangeira e metadados adicionais em `jogos`.
- Implementei vínculo oficial da conta Steam usando OpenID 2.0: o usuário é redirecionado à Steam, a resposta é validada nos servidores da Steam e o SteamID64, nome e avatar públicos são gravados sem armazenar senha da Steam.
- Separei claramente as duas integrações Steam:
  - `/api/steam/search` consulta o catálogo da loja, sem login Steam e sem API key.
  - `/api/steam/app/:appid` busca lançamento, desenvolvedor, publicadora, gêneros, descrição e avaliação pública; os resultados ficam em cache temporário.
  - `/api/steam/biblioteca` usa somente a Steam vinculada à conta do Game Chest e ignora jogos com `playtime_forever = 0`, exibindo total de jogos, horas e lista ordenada por horas.
- Migrei a consulta de avaliações para `IUserReviewsService/GetAppReviews`, substituindo o endpoint legado `store.steampowered.com/appreviews`, que foi descontinuado pela Steam.
- Adicionei cache em memória para busca, detalhes e biblioteca, além de filtragem de trilhas sonoras e extras óbvios no autocomplete.
- O formulário de review agora exibe a ficha básica do jogo selecionado e pré-preenche horas quando o jogo está na biblioteca Steam vinculada.
- Criei `/entrar`, proteção de rotas privadas, estado global de sessão e novo painel de perfil com conta, vínculo Steam, biblioteca e reviews pessoais.

### Arquivos criados, modificados ou removidos

- Criados: `game-chest/backend/src/controllers/authController.ts`, `game-chest/backend/src/middlewares/auth.ts`, `game-chest/backend/src/routes/authRoutes.ts`, `game-chest/backend/src/scripts/migrate.ts`, `game-chest/backend/src/types/express.d.ts`, `game-chest/backend/src/utils/auth.ts`, `game-chest/backend/src/utils/cache.ts`, `game-chest/frontend/src/context/AuthContext.tsx`, `game-chest/frontend/src/components/RotaProtegida.tsx`, `game-chest/frontend/src/pages/Login.tsx`.
- Modificados: controllers e rotas de reviews/Steam, servidor Express, `.env.example`, `package.json` e lockfile do backend, `README.md`, tipos, cliente API, contexto de sessão, navbar, app, perfil, formulário de review e autocomplete do frontend.
- O arquivo local `game-chest/backend/.env` recebeu apenas variáveis de desenvolvimento (`JWT_SECRET`, URLs locais e configuração do cookie); ele permanece ignorado e nenhuma credencial foi registrada neste histórico.

### Decisões técnicas e motivos

- **E-mail + senha:** escolhido conforme o fluxo definido, com hash bcrypt e mensagens genéricas no login para não revelar se um e-mail existe.
- **Cookie `httpOnly` em vez de token no `localStorage`:** reduz exposição da sessão a scripts do navegador; `Authorization: Bearer` continua aceito pelo backend para testes.
- **Steam OpenID:** é o vínculo oficial, evita que o Game Chest peça SteamID manual e não exige guardar credenciais Steam. A API key continua sendo necessária apenas para ler bibliotecas.
- **Catálogo sob demanda:** não foi criada uma lista local de todos os jogos. A busca consulta a Steam, enquanto o banco guarda somente o jogo usado em uma review e seus metadados úteis.
- **Cache em memória:** reduz chamadas repetidas sem adicionar Redis neste estágio; TTLs são suficientes para desenvolvimento e o cache é descartado ao reiniciar o backend.
- **Avaliações:** usei a API nova `IUserReviewsService`, pois o endpoint antigo foi descontinuado no período atual do projeto.

### Como testar / validar

- `npm run db:migrate` no backend: migração executada com sucesso no TiDB Cloud.
- `npx tsc --noEmit` no backend: passou.
- `npx tsc --noEmit` e `npm run build` no frontend: passaram.
- Teste integrado local: criação/login de conta, consulta de sessão, criação/edição/exclusão de review, filtro `meus=1`, logout e bloqueio posterior com HTTP 401.
- Consulta real do catálogo: busca por `hollow knight` retornou jogos da Steam; detalhes de Hollow Knight retornaram Team Cherry, lançamento e 97% de avaliações positivas.
- O teste de biblioteca Steam não pôde completar o caminho de sucesso porque `STEAM_API_KEY` ainda está vazia no `.env` local. O caminho de erro 503 permanece intencional e documentado.

### Próximos passos

- Preencher `STEAM_API_KEY`, deixar “Detalhes do jogo” público no perfil Steam e testar o fluxo real de OpenID + biblioteca.
- Revisar configurações de produção (`PUBLIC_API_URL`, `FRONTEND_URL`, CORS, HTTPS, `COOKIE_SECURE=true` e `COOKIE_SAMESITE=none` quando front e API estiverem em domínios diferentes).
- Adicionar recuperação de senha/e-mail de confirmação antes do deploy público.

---

## 2026-11-15 — Logo oficial no cabeçalho, favicon e título da aba

### O que foi feito

- Usei os arquivos enviados em `C:\Users\Joelc\Downloads\logos`:
  - **`sem nome.png`** → recortado e com o fundo preto convertido em transparência → `public/logo-mark.png` (512 px), usado no cabeçalho e como base dos ícones.
  - **`com nome.png`** → mesmo tratamento → `public/logo-game-chest.png` (720 px), usado na página 404, onde o nome em pixel art fica legível.
  - **`fundo transparent.png`** → avaliado, mas descartado: o recorte automático tinha resíduos e bordas irregulares. O resultado equivalente (e mais limpo) foi obtido a partir de `sem nome.png`.
- Gerei os ícones da aba a partir da marca amarela sobre um quadrado arredondado na cor de tinta (`#070b16`), para funcionar tanto em abas claras quanto escuras: `favicon.ico` (16, 32, 48 e 64 px), `app-icon-192.png` e `apple-touch-icon.png` (180 px).
- No cabeçalho, o desenho de baú feito em SVG foi removido e substituído pela marca real (`logo-mark.png`, 40 px no mobile e 44 px no desktop), ao lado do texto “Game Chest”.
- A página 404 passou a usar a logo completa (`logo-game-chest.png`) acima da mensagem, com título próprio.
- Título da aba: a home agora mostra apenas **“Game Chest”** (antes “Game Chest — reviews da comunidade”). As demais rotas mantêm contexto: “Meu diário — Game Chest”, “Nova review — Game Chest” e “Página não encontrada — Game Chest”.
- `public/favicon.svg` (baú desenhado à mão) foi removido; o `index.html` aponta para o `.ico`, o PNG de 192 px e o ícone da Apple.

### Arquivos

| Arquivo | Status |
|---|---|
| `game-chest/frontend/public/logo-mark.png` | novo (marca sem nome, transparente, 512×401) |
| `game-chest/frontend/public/logo-game-chest.png` | novo (logo com nome, transparente, 720×633) |
| `game-chest/frontend/public/favicon.ico` | novo (16/32/48/64) |
| `game-chest/frontend/public/app-icon-192.png` | novo |
| `game-chest/frontend/public/apple-touch-icon.png` | novo |
| `game-chest/frontend/public/favicon.svg` | **removido** |
| `game-chest/frontend/index.html` | modificado (título e links de ícone) |
| `game-chest/frontend/src/components/Navbar.tsx` | modificado (logo real; SVG removido) |
| `game-chest/frontend/src/pages/Home.tsx` | modificado (`useTitulo('Game Chest')`) |
| `game-chest/frontend/src/pages/NotFound.tsx` | modificado (logo completa + título da aba) |
| `atualizacoes.md` | modificado (esta entrada) |

### Decisões e motivos

- **Chave de transparência pelo canal mais claro**: os arquivos vieram com fundo preto sólido (não eram PNGs transparentes). Usei `max(R,G,B)` como alfa e normalizei a cor para o amarelo da marca (`#FACB09`), o que preserva as bordas suavizadas sem a sujeira do recorte automático.
- **Respiro de 4%** ao redor da marca para ela não encostar nas bordas em tamanhos pequenos.
- **Ícone com fundo de tinta**: a marca é amarela; sobre aba branca ela perde contraste. O quadrado escuro garante leitura nos dois temas, como já acontecia com o favicon antigo.
- **Logo completa só na 404**: no cabeçalho, o nome em pixel art abaixo do baú fica ilegível em 44 px; lá a marca + tipografia do site funciona melhor.
- **Título da aba**: a home mostra exatamente “Game Chest”, como pedido; as outras páginas mantêm o nome da página antes do nome do site para orientar quem usa abas.

### Como testar

```bash
cd game-chest/frontend
npm run dev      # http://localhost:5173
npm run build    # confirma que os ícones vão para dist/
```

1. Abrir `http://localhost:5173`: conferir a logo no canto superior esquerdo e o ícone do baú na aba, com o título **Game Chest**.
2. Acessar `/rota-inexistente`: conferir a logo completa e o título “Página não encontrada — Game Chest”.
3. Em tamanho de aba pequeno (16 px), o ícone mantém a silhueta do baú.
4. Testar em 390 px e 320 px de largura: a marca reduz para 40 px e não gera rolagem horizontal.

### O que foi validado

- `npm run build` ok; os arquivos de ícone aparecem em `dist/`.
- Títulos conferidos via navegador: `/` → “Game Chest”; `/perfil` → “Meu diário — Game Chest”; `/nova-review` → “Nova review — Game Chest”; rota inválida → “Página não encontrada — Game Chest”.
- Cabeçalho medido em 390/360/320 px: `scrollWidth` igual à largura da janela (sem overflow); em 320 px os links quebram em duas linhas dentro do header.
- Favicon de 64 px inspecionado visualmente (baú legível no quadrado de tinta).

### O que não foi testado

- Cache de favicon em navegador já aberto: pode ser necessário recarregar com `Ctrl+F5` ou reabrir a aba para o ícone novo aparecer.
- Ícone em tela inicial do iOS, aba fixada do Safari e barra de favoritos do Firefox.
- Verificação de contraste automatizada dos ícones em temas claros/escuros de navegador.

---

## 2026-11-15 — Fase 4 — Front-end completo (React + Tailwind)

### O que foi feito

Implementei a SPA do Game Chest inteira, consumindo a API da Fase 2/3:

- **Rotas** (`react-router-dom`): `/` (feed), `/nova-review` (criar), `/editar-review/:id` (editar), `/perfil` (diário) e uma rota 404 própria. Inclui link “Pular para o conteúdo”, navbar fixa e `<title>` por página.
- **Feed** (`pages/Home.tsx`): destaque editorial da review mais recente (texto expansível) + lista numerada das demais (`#0001`), resumo em uma linha (`6 reviews no arquivo · 540 horas registradas · média 4,5`), filtros por status, ordenação por data/nota, estados de carregamento, erro com “Tentar de novo” e vazio. A barra de filtros some quando o feed está vazio e não há filtro ativo.
- **Formulário** (`pages/ReviewForm.tsx`): criação e edição no mesmo componente. Na edição o jogo fica travado (a API não permite trocar o jogo), com aviso explicando. Validação no cliente (nome, jogo, nota 1–5, texto), contador de caracteres e prévia ao vivo (`ReviewPreview`) fixa na lateral em telas grandes.
- **Perfil** (`pages/Profile.tsx`): nome e SteamID salvos em `localStorage`, resumo estatístico, biblioteca Steam (tratando 503 quando não há `STEAM_API_KEY`), lista das reviews do usuário com editar/excluir e avisos de sucesso após publicar/editar/excluir.
- **Componentes**: `Navbar`, `ReviewRow`, `SteamAutocompleteInput` (debounce de 300 ms, teclado, `aria-*`), `StarRating` (interativo e somente leitura), `ConfirmModal` (foco no cancelar, `Esc`, clique no fundo), `LoadingSpinner`, `StatusBadge`, `Cover` (fallback para capa quebrada), `EmptyState`, `ErrorBanner`, `StatsStrip`, `ReviewPreview`.
- **Camada de dados** (`lib/api.ts`): cliente Axios com `baseURL` em `VITE_API_URL` (padrão `http://localhost:3000/api`), funções tipadas para todos os endpoints e `mensagemDeErro()` traduzindo falhas de rede/timeout/corpo `{ error, message }` para português.
- **Identidade local** (`hooks/useUsuario.ts`): chaves `gamechest:usuario` e `gamechest:steamId`, com evento interno + `storage` para sincronizar navbar, formulário e perfil na mesma aba e entre abas.
- **Formatação** (`lib/format.ts`): datas em pt-BR, horas e médias com `Intl`, número de registro (`#0004`).
- **Design (skill `frontend-design`)**: conceito “arquivo de fliperama/diário”. Fundo azul-tinta, amarelo de marquise, tipografia Bricolage Grotesque (títulos) + Instrument Sans (texto), números de registro no gutter, capas na proporção original da Steam (460/215) para não cortar logos, e uma única animação de entrada (`reveal`/`reveal-late`) desativada em `prefers-reduced-motion`.
- **Tailwind v4**: `@tailwindcss/vite` no `vite.config.ts` e tokens em `src/index.css` via `@theme` + classes utilitárias de componente (`.panel`, `.field`, `.btn-*`, `.chip`).
- **Ajustes após revisão visual com screenshots**: navbar sem link duplicado, estatísticas em linha no feed (em vez de cards de KPI), lista com numeração e status na mesma linha de metadados, perfil com bloco único (perfil + Steam) e, no mobile, ações das reviews em linha própria e prévia do formulário oculta para não duplicar conteúdo.
- **Correção no backend**: `npm run dev` estava quebrado porque o `ts-node-dev` não funciona com o TypeScript 7 instalado (`Cannot read properties of undefined (reading 'fileExists')`). Troquei por **`tsx watch src/server.ts`** e removi `ts-node-dev` do `package.json`.

### Arquivos

| Arquivo | Status |
|---|---|
| `game-chest/frontend/package.json` / `package-lock.json` | modificado (axios, react-router-dom, lucide-react, tailwindcss, @tailwindcss/vite) |
| `game-chest/frontend/vite.config.ts` | modificado (plugin do Tailwind) |
| `game-chest/frontend/index.html` | modificado (pt-BR, fontes, meta description, favicon) |
| `game-chest/frontend/public/favicon.svg` | modificado (baú) |
| `game-chest/frontend/src/index.css` | reescrito (Tailwind v4 + tema + animação) |
| `game-chest/frontend/src/App.tsx` | reescrito (router, layout, rodapé) |
| `game-chest/frontend/src/App.css` | **removido** |
| `game-chest/frontend/src/types/index.ts` | novo |
| `game-chest/frontend/src/lib/api.ts` | novo |
| `game-chest/frontend/src/lib/format.ts` | novo |
| `game-chest/frontend/src/hooks/useUsuario.ts` | novo |
| `game-chest/frontend/src/hooks/useDebounce.ts` | novo |
| `game-chest/frontend/src/hooks/useTitulo.ts` | novo |
| `game-chest/frontend/src/pages/Home.tsx` | novo |
| `game-chest/frontend/src/pages/ReviewForm.tsx` | novo |
| `game-chest/frontend/src/pages/Profile.tsx` | novo |
| `game-chest/frontend/src/pages/NotFound.tsx` | novo |
| `game-chest/frontend/src/components/*.tsx` | novos (`Navbar`, `ReviewRow`, `ReviewPreview`, `SteamAutocompleteInput`, `StarRating`, `ConfirmModal`, `LoadingSpinner`, `StatusBadge`, `Cover`, `EmptyState`, `ErrorBanner`, `StatsStrip`) |
| `game-chest/frontend/.env.example` | novo |
| `game-chest/backend/package.json` / `package-lock.json` | modificado (`ts-node-dev` → `tsx`) |
| `README.md` | seções 3 e 4 atualizadas (feed/destaque, componentes reais) |
| `AGENTS.md` | estado atual atualizado (Fase 4 concluída) |
| `atualizacoes.md` | modificado (esta entrada) |

### Decisões e motivos

- **Tailwind v4 em vez do Tailwind 3 do guia**: é a versão instalada pelo Vite atual; o plugin `@tailwindcss/vite` dispensa `postcss.config` e `tailwind.config`, com o tema em `@theme`. Menos arquivos e menos configuração.
- **`GameCard` não foi criado**: uma grade de cards idênticos é o padrão mais genérico possível para um feed. O destaque + `ReviewRow` numerado dá hierarquia e identidade de “diário/arquivo”, como pedido pela skill de design.
- **Estatísticas em linha no feed**: três caixas com número grande e rótulo pequeno são o tratamento default de dashboard. No feed, os números entram na frase; no perfil, um único painel compacto com rótulo e valor na mesma linha.
- **Prévia oculta no mobile**: no formulário mobile a prévia repetia o que o usuário acabou de digitar e empurrava o botão de publicar para longe; em `lg` ela continua útil e fixa.
- **Proporção 460/215 nas capas**: `header.jpg` da Steam não é 16:9; usar a proporção real evita cortar o logotipo do jogo.
- **`tsx` no backend**: o ts-node depende da API interna do compilador, que mudou no TypeScript 7. `tsx` (esbuild) ignora essa API e mantém o hot-reload, com uma linha de script.

### Como testar

```bash
# 1) backend
cd game-chest/backend
npm run dev                 # http://localhost:3000
curl http://localhost:3000/api/health

# 2) frontend
cd game-chest/frontend
npm run dev                 # http://localhost:5173

# 3) build de produção
npm run build               # tsc -b + vite build
```

Roteiro manual:

1. `/` com reviews: conferir destaque, lista, filtros por status, ordenação por nota e “Ler review completa”.
2. `/nova-review`: buscar um jogo na Steam (ex.: “hollow”), escolher, dar nota, escolher status, escrever e publicar → deve redirecionar para `/perfil` com “Review publicada.”.
3. `/perfil`: salvar nome/SteamID, conferir estatísticas, editar uma review (jogo travado) e excluir com o modal.
4. `/editar-review/999999`: deve mostrar “Review não encontrada.” com opção de tentar de novo.
5. Desligar o backend e recarregar `/`: deve aparecer o aviso de API indisponível, sem stack trace.

### O que foi validado

- `npm run build` no frontend: **ok** (TypeScript estrito + Vite; ~360 kB de JS, ~36 kB de CSS).
- `npm run build` no backend: **ok** (`tsc` sem erros).
- Smoke test real com Chrome headless (Playwright, fora do repositório): feed com 6 reviews semeadas, filtro por status, autocomplete da Steam, criação completa pela interface, edição com jogo travado, exclusão pelo modal, 404 de review, rota desconhecida, feed vazio e banner de backend offline.
- Banco limpo ao final: **0 reviews** (as reviews de teste foram excluídas pela própria API).
- Layout verificado em 1440×950 e 390×844 (feed, formulário, perfil, modal).

### O que não foi testado

- **Caminho de sucesso da biblioteca Steam**: `STEAM_API_KEY` está vazio no `.env`, então `GET /api/steam/user-games/:steamId` responde 503. A UI trata o erro, mas a lista de jogos não foi vista com dados reais.
- Navegadores além do Chrome (Firefox/Safari), leitores de tela e zoom de 200%.
- Testes automatizados de componente/e2e no repositório: os testes foram um script temporário de smoke com Playwright, não versionado.
- Build servido por um servidor estático de produção.

### Próximos passos

- Fase 5: integrar horas jogadas da Steam no formulário quando houver `STEAM_API_KEY`, revisar textos e preparar deploy.
- Rotacionar a senha do TiDB compartilhada em chat.
- Remover `game-chest/backend/node_modules` do Git (está versionado desde antes; hoje só foi restaurado para não gerar um diff gigante).
- Se a fonte do Google falhar, o site cai para `Segoe UI`/`system-ui`; para produção, considerar self-host das fontes.

---

## 2026-11-15 — Skill `frontend-design` instalada no OpenCode

### O que foi feito

- Rodei `npx skills add anthropics/skills --skill frontend-design --agent opencode -y --copy`.
- A skill foi instalada em **`.agents/skills/frontend-design/`** (projeto), com `SKILL.md` + `LICENSE.txt`, e um `skills-lock.json` foi criado na raiz.
- Usei `--copy` em vez de symlink por causa das permissões de link simbólico no Windows.
- `.agents/skills` é um dos diretórios de compatibilidade que o OpenCode V2 descobre automaticamente (junto com `.claude/skills`), então **não foi preciso reiniciar nem configurar nada**: a skill já apareceu na lista de skills disponíveis da sessão.
- O CLI executou avaliação de segurança: **Socket 0 alerts / Snyk Low Risk**.

### Como usar

- Basta mencionar `@frontend-design` no prompt, ou o agente carrega a skill sozinho quando a tarefa envolver design de interface.
- A skill dá orientação de direção visual, tipografia, paleta e escolhas que não pareçam template padrão.
- Sempre revise skills de terceiros: elas rodam com as permissões do agente.

### Comandos úteis

```bash
npx skills list                 # skills do projeto
npx skills list -g              # skills globais
npx skills update frontend-design
npx skills remove frontend-design
npx skills add anthropics/skills --skill frontend-design -g   # instalar global
```

### Arquivos

| Arquivo | Status |
|---|---|
| `.agents/skills/frontend-design/SKILL.md` | **novo** |
| `.agents/skills/frontend-design/LICENSE.txt` | **novo** |
| `skills-lock.json` | **novo** (registro da instalação) |
| `atualizacoes.md` | modificado (esta entrada) |

### Próximos passos

- Aplicar a skill na **Fase 4** (front-end), junto com React Router, Tailwind e Axios.

---

## 2026-11-15 — Datas da API no fuso local (ISO com offset)

### Contexto

O instante gravado estava correto desde a correção anterior (`timezone: 'Z'`), mas a API devolvia o ISO em **UTC** (`2026-11-15T22:14:33.000Z`). Como o usuário está em UTC-3, a leitura "parecia" 3 horas adiantada (22:14 em vez de 19:14). O valor era o mesmo instante; faltava apresentar no fuso local.

### O que foi feito

- Criei `src/utils/date.ts` com `formatarDataComFuso()`, que converte um `Date` para **ISO 8601 com offset** no fuso de `APP_TIMEZONE` (padrão `America/Sao_Paulo`), ex.: `2026-11-15T19:16:27-03:00`.
- Adicionei `APP_TIMEZONE=America/Sao_Paulo` no `.env` e no `.env.example`.
- `reviewController.ts`: `created_at` e `updated_at` passam por um mapper `comFuso()` em:
  - `GET /api/reviews` (lista),
  - `GET /api/reviews/:id`,
  - `PUT /api/reviews/:id` (campo `review`).
- `steamController.ts`: `ultimo_jogo_em` também sai com offset.
- `errorHandler.ts` e `/api/health`: o campo `timestamp` agora usa o mesmo formato.
- O pool continua com `timezone: 'Z'`, porque o TiDB entrega TIMESTAMP em UTC — isso garante que o **instante** seja interpretado corretamente antes de formatar.

Formato final: `AAAA-MM-DDTHH:mm:ss-03:00` (sem milissegundos).

### Resultado do teste

| Verificação | Resultado |
|---|---|
| `GET /api/health` | `timestamp: "2026-11-15T19:16:23-03:00"` |
| Hora local da máquina no teste | `2026-11-15 19:16:24` |
| `created_at` no `GET /api/reviews/:id` | `2026-11-15T19:16:27-03:00` |
| Instante convertido para UTC | `2026-11-15 22:16:27 UTC` (mesmo instante, correto) |
| `updated_at` após `PUT` | `2026-11-15T19:16:29-03:00` |
| `DELETE` + `GET` | `200` e depois `404` com `timestamp` local |
| Saldo final do banco | `jogos = 0`, `reviews = 0` |

### Observações

- O banco continua armazenando em **UTC** (prática correta); apenas a camada de apresentação da API converte.
- Para outro fuso, basta trocar `APP_TIMEZONE` (ex.: `America/Manaus`, `Europe/Lisbon`).
- No front-end, `new Date(created_at)` já resolve para a hora local do navegador; para exibir texto, usar `toLocaleString('pt-BR')`.

### Arquivos

| Arquivo | Status |
|---|---|
| `game-chest/backend/src/utils/date.ts` | **novo** |
| `game-chest/backend/src/controllers/reviewController.ts` | modificado (mapper `comFuso`) |
| `game-chest/backend/src/controllers/steamController.ts` | modificado (`ultimo_jogo_em` com offset) |
| `game-chest/backend/src/middlewares/errorHandler.ts` | modificado (timestamps locais) |
| `game-chest/backend/src/server.ts` | modificado (health com timestamp local) |
| `game-chest/backend/.env` | modificado (`APP_TIMEZONE`) |
| `game-chest/backend/.env.example` | modificado (`APP_TIMEZONE`) |
| `AGENTS.md` | modificado (convenção de datas) |
| `atualizacoes.md` | modificado (esta entrada) |

---

## 2026-11-15 — Conexão com TiDB validada, CRUD testado e correção de timezone

### Credencial atualizada

- Atualizei `DB_PASS` no `game-chest/backend/.env` com a nova senha gerada no console do TiDB Cloud.
- A autenticação passou. Ambiente confirmado:

| Item | Valor |
|---|---|
| Versão | `8.0.11-TiDB-v8.5.3-serverless` |
| Schema | `gamechest` |
| Usuário | `...root@%` |
| Timezone do servidor | `SYSTEM` / `UTC` |
| Tabelas | `jogos` e `reviews` já existiam |
| Registros iniciais | `jogos = 0`, `reviews = 0` |

O IP `168.90.23.130` está liberado na allowlist e o TLS funciona **sem** `DB_SSL_CA_PATH`.

### Teste E2E do CRUD (Fase 3 concluída)

Servidor compilado e rodando contra o banco real:

| Etapa | Requisição | Resultado |
|---|---|---|
| 1 | `GET /api/health` | `200 {"status":"ok","banco":"conectado"}` |
| 2 | `POST /api/reviews` (Hollow Knight) | `201 {"id":1,...}` |
| 3 | `GET /api/reviews` | 1 item, `titulo`, `nota`, `status`, `usuario`, `horas` corretos |
| 4 | `GET /api/reviews/1` | objeto completo com `jogo_id`, `capa_url`, `steam_appid` |
| 5 | `PUT /api/reviews/1` (só `nota` e `texto_review`) | `200`, review retornada com `nota: 4` |
| 6 | `GET /api/reviews?status=Zerado&ordem=nota&direcao=desc` | `200`, filtro e ordenação ok |
| 6b | `GET /api/reviews?status=Invalido` | `400` |
| 7 | `DELETE /api/reviews/1` | `200`; `GET` seguinte → `404` |

Os dados de teste foram removidos ao final: **`jogos = 0`, `reviews = 0`**, banco limpo e pronto para uso.

### Bug encontrado e corrigido: timestamps +3h

- **Sintoma**: `created_at` vinha `2026-11-16T01:12:42Z` quando o UTC real era `2026-11-15T22:12:42Z` (3 horas no futuro).
- **Causa**: o TiDB Cloud roda em **UTC**, mas o `mysql2` interpreta `TIMESTAMP`/`DATETIME` no fuso **local** da máquina (UTC-3), somando 3 horas ao converter para `Date`.
- **Correção**: adicionei `timezone: 'Z'` ao `createPool` em `src/config/database.ts`, informando que o servidor devolve horários em UTC.
- **Depois**: `created_at = 2026-11-15T22:13:33Z` para um `POST` feito às `22:13:29Z` — correto.
- Observação: scripts avulsos que não usam o pool da aplicação continuam suscetíveis ao deslocamento; não é um problema da API.

### Arquivos

| Arquivo | Status |
|---|---|
| `game-chest/backend/.env` | modificado (`DB_PASS` atualizada; segue fora do Git) |
| `game-chest/backend/src/config/database.ts` | modificado (`timezone: 'Z'` + comentário explicativo) |
| `AGENTS.md` | modificado (Fase 3 marcada como concluída) |
| `game-chest/backend/_check-db.cjs` | criado e removido (diagnóstico temporário) |
| `game-chest/backend/dist/` | criado e removido (build temporário de teste) |
| `atualizacoes.md` | modificado (esta entrada) |

### Validação

```bash
cd game-chest/backend
npx tsc --noEmit   # ok
npm run dev
# GET http://localhost:3000/api/health -> 200 {"status":"ok","banco":"conectado"}
```

### Próximos passos

1. **Fase 4**: construir o front-end (React Router, Tailwind, Axios, componentes do README) consumindo os contratos atuais.
2. Preencher `STEAM_API_KEY` no `.env` para habilitar `/api/steam/user-games/:steamId`.
3. Rotacionar a senha do TiDB futuramente, pois ela foi compartilhada em texto plano no chat.

---

## 2026-11-15 — Configuração do `.env` e diagnóstico da conexão com o TiDB Cloud

### O que foi feito

- Criei `game-chest/backend/.env` com as credenciais de TiDB Cloud fornecidas pelo usuário (host, porta 4000, usuário com prefixo, senha e `DB_NAME=gamechest`), mais `CORS_ORIGIN=http://localhost:5173` e `STEAM_API_KEY` vazia (a ser preenchida depois).
- Testei a conexão real com o banco usando `mysql2` com TLS (`minVersion: 'TLSv1.2'`) e também subi a API compilada para bater no `/api/health`.
- Removi os arquivos temporários de teste (`_check-db.cjs` e `dist/`) após o diagnóstico.

### Resultado do diagnóstico

| Verificação | Resultado |
|---|---|
| DNS do host | ✅ resolve (`99.83.147.192`, `75.2.85.188`) |
| Porta 4000 | ✅ aberta (TCP) |
| TLS | ✅ handshake concluído (sem necessidade de `DB_SSL_CA_PATH`) |
| Allowlist de IP | ✅ IP atual chegou ao servidor |
| Autenticação | ❌ `ER_ACCESS_DENIED_ERROR` (errno 1045, SQLSTATE 28000) |
| Login com o banco/schema | ⏸️ não chegou a acontecer (falhou antes, na autenticação) |

Mensagem do banco: `Access denied for user '...root'@'168.90.23.130' (using password: YES)`.

Conclusão: **rede, porta, TLS e allowlist estão corretos**. O problema é exclusivamente de credencial — senha inválida/expirada ou prefixo de usuário de um cluster que não existe mais. Nada no código precisa mudar.

Comportamento da API no estado atual (verificado):
- `GET /api/health` → `503 {"status":"degradado","banco":"indisponível"}` (esperado).
- `GET /api/reviews` → `500 {"error":true,"message":"Ocorreu um erro interno no servidor."}` com o stack real apenas no console do servidor (sem vazar SQL/credenciais para o cliente).
- `GET /api/steam/search` continua funcionando, pois não depende do banco.

### Próximos passos

1. No console do TiDB Cloud: cluster → **Connect** → **Reset/Generate password** (ou *SQL Users*) e copiar o novo par usuário/senha.
2. Atualizar `DB_USER` e `DB_PASS` no `game-chest/backend/.env`.
3. Rodar `npm run dev` e confirmar `200 {"status":"ok","banco":"conectado"}` em `/api/health`.
4. Verificar se o schema `gamechest` existe e rodar o DDL da Fase 1 se necessário (tabelas `jogos` e `reviews`).
5. Recomendado: rotacionar a senha, pois ela foi compartilhada em texto plano no chat (o `.env` está no `.gitignore` e não vai para o Git).

### Arquivos

| Arquivo | Status |
|---|---|
| `game-chest/backend/.env` | **novo** (não versionado — contém credenciais) |
| `game-chest/backend/_check-db.cjs` | criado e removido (teste temporário) |
| `game-chest/backend/dist/` | criado e removido (build temporário de teste) |
| `atualizacoes.md` | modificado (esta entrada) |

---

## 2026-11-15 — Fase 2: API back-end (Node.js + Express + TypeScript)

Abaixo está o registro completo do que foi feito, arquivo por arquivo, e depois uma seção dedicada ao **TiDB Cloud**, porque é a parte que muda o comportamento em relação ao MySQL local do guia.

---

# 1. Ponto de partida (o que existia de fato)

Li `PsP.md` e `README.md` e conferi o repositório:

- **Fase 0 (estrutura)**: `game-chest/backend` e `game-chest/frontend` já existiam.
- **Fase 1 (banco)**: o schema está descrito no README/PsP; o backend já tinha `src/config/database.ts` configurado para TiDB (porta 4000 + SSL), mas **nenhum outro arquivo**.
- **Fase 2 (API)**: não existia. O `package.json` já apontava `npm run dev` para `src/server.ts`, que não existia — ou seja, `npm run dev` quebrava.
- O `database.ts` tinha um comentário gigante com instruções de uma tentativa anterior (basicamente o conteúdo da Fase 2 colado como bloco de comentário).
- **Não existia `.env`**, só `.env.example`.
- Frontend ainda é o template puro do Vite (não mexi nele).

O que fiz: **implementei a Fase 2 inteira**, limpei o comentário do `database.ts`, ajustei `.env.example`, `.gitignore` e a seção de env do README.

---

# 2. Estrutura final criada

```
game-chest/backend/src/
├── server.ts                    ← entrada da aplicação
├── config/
│   └── database.ts              ← pool mysql2 + SSL (TiDB)
├── controllers/
│   ├── reviewController.ts      ← CRUD de reviews
│   └── steamController.ts       ← proxy Steam
├── routes/
│   ├── reviewRoutes.ts
│   └── steamRoutes.ts
└── middlewares/
    └── errorHandler.ts          ← AppError, 404 e handler global
```

São **7 arquivos** no `src` (você tinha 1). Total ~18 KB de código.

---

# 3. O que cada arquivo faz

## 3.1 `src/config/database.ts` — conexão com o TiDB

```ts
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  ssl: { minVersion: 'TLSv1.2', ...(sslCaPath ? { ca: readFileSync(sslCaPath) } : {}) }
});
```

Decisões:

- **`createPool`** em vez de `createConnection`: cada requisição pega uma conexão emprestada e devolve ao pool. Isso evita abrir/fechar TCP+TLS a cada request — com banco remoto na nuvem, abrir TLS é caro (centenas de ms). O guia pedia pool; mantive.
- **`connectionLimit: 10`** + `waitForConnections: true`: se 11 requisições chegarem juntas, a 11ª espera na fila em vez de estourar erro. 10 é conservador e seguro para o limite de conexões do TiDB Cloud.
- **`enableKeepAlive: true`**: evita que conexões ociosas morram silenciosamente (comum em banco remoto atrás de NAT/load balancer).
- **`port` default 4000**: é a porta do TiDB Cloud (o MySQL local usa 3306). Se `DB_PORT` não existir, assume 4000.
- **`ssl`**: TiDB Cloud **exige TLS**. `minVersion: 'TLSv1.2'` garante o mínimo aceito. Se você baixar o `ca.pem` no console e apontar `DB_SSL_CA_PATH`, o código lê o arquivo e valida o certificado do servidor; se não apontar, o Node usa a cadeia de CAs do sistema operacional.
- **`dotenv.config()`** aqui também: como este módulo é importado pelo `server.ts`, o `.env` já está carregado **antes** do pool ser criado. Se dependesse só do `dotenv.config()` do `server.ts`, os imports (que são avaliados antes do corpo do arquivo) poderiam criar o pool sem as variáveis.
- Removi o comentário-instrução gigante que estava no arquivo. Nada de lógica foi perdido.

## 3.2 `src/middlewares/errorHandler.ts`

Três coisas:

1. **`AppError`** — classe de erro com `statusCode`. Os controllers lançam `new AppError(400, ...)`, `(404, ...)`, etc., e o handler global sabe o status certo.
2. **`notFoundHandler`** — responde 404 em JSON para qualquer rota não registrada. (No Express 5 não se usa mais `app.use('*')`, então é um middleware comum no final.)
3. **`errorHandler`** — formato único de erro, igual ao README:
   ```json
   { "error": true, "message": "...", "timestamp": "2026-11-15T21:59:01.398Z" }
   ```
   Regras:
   - `AppError` → usa o status e a mensagem que eu escrevi.
   - Erro de rede com o banco (`ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`) → **503** com mensagem amigável ("Não foi possível conectar ao banco...").
   - Códigos de banco (`ER_*`, ex.: `ER_BAD_FIELD_ERROR`) → 500 **genérico**, sem vazar SQL/stack para o cliente.
   - Erros 500 são logados no console com timestamp para você depurar no terminal.

## 3.3 `src/controllers/reviewController.ts` — o CRUD

### Validação (antes de tocar no banco)

`validarCriacao()` normaliza e valida tudo e **acumula todos os erros de uma vez** (não para no primeiro):

| Campo | Regra |
|---|---|
| `usuario` | obrigatório, ≤ 100 chars, `trim()` |
| `steam_appid` | inteiro positivo |
| `titulo` | obrigatório, ≤ 255 chars |
| `capa_url` | opcional; se vazio, gera `.../steam/apps/{appid}/header.jpg` |
| `horas_jogadas` | inteiro ≥ 0, default 0 |
| `status` | enum `Jogando \| Zerado \| Abandonado \| Quero Jogar`, default `Jogando` |
| `nota` | inteiro 1–5 |
| `texto_review` | obrigatório, `trim()` |

Retorno: `400` com a lista de problemas, ex.:
```json
{"error":true,"message":"Dados inválidos: \"usuario\" é obrigatório. \"nota\" deve ser um número inteiro entre 1 e 5.",...}
```

### POST `/api/reviews` — criação com transação

Fluxo:

1. `pool.getConnection()` (pega uma conexão dedicada).
2. `BEGIN`.
3. `INSERT INTO jogos ... ON DUPLICATE KEY UPDATE titulo=..., capa_url=...` — usa o `UNIQUE` de `steam_appid` para não duplicar jogo.
4. `SELECT id FROM jogos WHERE steam_appid = ?`.
5. `INSERT INTO reviews (...)`.
6. `COMMIT`; em qualquer erro, `ROLLBACK`; sempre `release()` no `finally`.

Por que transação: se o INSERT da review falhar (ex.: nota inválida no CHECK do banco), o jogo não fica órfão. Também evita condição de corrida entre dois usuários avaliando o mesmo jogo ao mesmo tempo.

Retorno: `201 { "id": 12, "message": "Review criada com sucesso!" }`.

### GET `/api/reviews` — lista com filtros e ordenação

`JOIN` de `reviews` com `jogos` e filtros opcionais:

- `?status=Zerado` (validado contra o enum; status inválido → 400)
- `?usuario=PlayerOne` (match exato, usa o índice `idx_reviews_usuario`)
- `?ordem=created_at|nota|horas_jogadas` (default `created_at`)
- `?direcao=asc|desc` (default `desc`)

A ordenação usa **lista branca**: a string do usuário nunca entra no SQL; só escolho entre três colunas fixas. Isso fecha a porta de SQL injection que existiria se eu fizesse `ORDER BY ${ordem}` direto.

Retorna um **array achatado**, já com dados do jogo, pronto para o `GameCard`:
```json
[{"id":12,"usuario":"PlayerOne","horas_jogadas":45,"status":"Zerado","nota":5,
  "texto_review":"...","created_at":"...","updated_at":"...",
  "titulo":"Hollow Knight","capa_url":"https://...","steam_appid":367520}]
```

### GET `/api/reviews/:id`
`SELECT r.*, j.titulo, j.capa_url, j.steam_appid ... WHERE r.id = ?`; se não achar → 404.

### PUT `/api/reviews/:id` — atualização parcial

Aceita **qualquer subconjunto** de `horas_jogadas`, `status`, `nota`, `texto_review`. Monta o `SET` dinamicamente **apenas com colunas fixas** (`campos.push('nota = ?')`), então continua seguro.

Detalhe importante que resolvi: no MySQL/TiDB, `affectedRows` de um `UPDATE` pode ser **0 mesmo quando a linha existe** (se os valores enviados forem idênticos aos atuais). Se eu confiasse só nisso, um "salvar sem mudar nada" devolveria 404 indevido. Por isso faço um `SELECT id` antes: 404 só se a review realmente não existir. Depois do update, busco a review completa e devolvo:
```json
{ "message": "Review atualizada com sucesso!", "review": { ... } }
```

### DELETE `/api/reviews/:id`
Aqui `affectedRows === 0` é confiável: 404 se não excluiu nada; senão `{ message: "Review excluída com sucesso." }`.

## 3.4 `src/controllers/steamController.ts`

### GET `/api/steam/search?q=termo`
Proxy para `https://store.steampowered.com/api/storesearch/` com `l=portuguese&cc=BR`. Existe porque a Steam Store **não manda cabeçalho CORS**, então o navegador não pode chamar direto — o backend chama e repassa.

- `q` vazio → `[]` (200), não erro.
- Timeout de **10s** com `AbortSignal.timeout()`.
- Filtra itens sem `id` numérico e sem `name`.
- Normaliza para o contrato do app: `{ steam_appid, titulo, capa_url }`.
- Erro da Steam → **502** (gateway ruim) em vez de 500, semanticamente correto.

Teste real que fiz:
```json
[{"steam_appid":367520,"titulo":"Hollow Knight","capa_url":".../367520/header.jpg"},
 {"steam_appid":1030300,"titulo":"Hollow Knight: Silksong",...}, ...]
```

Observação: a busca da Steam também devolve **trilhas sonoras e DLCs** (apareceu "Hollow Knight - Official Soundtrack"). Se quiser, depois filtro por `type === 'app'`/gênero, mas o campo não vem de forma confiável em todos os itens.

### GET `/api/steam/user-games/:steamId`
Chama `IPlayerService/GetOwnedGames/v1/` com `include_appinfo=1`, `include_played_free_games=1`, `format=json`.

- Valida **SteamID64**: exatamente 17 dígitos (`/^\d{17}$/`).
- Sem `STEAM_API_KEY` no `.env` → **503** com mensagem explicando o que configurar (não é bug, é falta de chave).
- Steam devolve `response.games` vazio/ausente quando o perfil é privado → **404** com mensagem pedindo perfil público.
- Converte `playtime_forever` (minutos) → **horas arredondadas**.
- Ordena do mais jogado para o menos jogado.
- Retorna `{ steam_appid, titulo, capa_url, horas_jogadas, ultimo_jogo_em }`.

Isso é o que vai alimentar o preenchimento automático de horas no formulário e a "biblioteca Steam" do perfil.

## 3.5 `src/routes/*.ts`

Só o mapeamento REST, sem lógica:
- `/api/reviews`: POST `/`, GET `/`, GET `/:id`, PUT `/:id`, DELETE `/:id`
- `/api/steam`: GET `/search`, GET `/user-games/:steamId`

## 3.6 `src/server.ts`

Ordem importa e ficou assim:

1. `cors` com **lista de origens** vinda de `CORS_ORIGIN` (aceita `http://localhost:5173,https://meuapp.com`). Requisições sem `Origin` (curl/Postman) passam; origem não listada recebe 403 via `AppError`.
2. `express.json({ limit: '1mb' })`.
3. `GET /api/health` → roda `SELECT 1` no pool.
4. Rotas de reviews e steam.
5. `notFoundHandler`.
6. `errorHandler` (sempre por último).
7. `app.listen` na `PORT` (default 3000).

Sobre Express 5 (a versão instalada, 5.3.0):
- Rejeições de Promise em handlers async são encaminhadas ao error handler automaticamente, mas eu chamo `next(error)` explicitamente para deixar o fluxo óbvio e independente de versão.
- `app.use('*')` não é mais válido, por isso o 404 é um middleware comum.

## 3.7 Outros ajustes

- **`.env.example`**: adicionei `CORS_ORIGIN` e `STEAM_API_KEY` (com nota de onde obter), mantendo o formato TiDB (`DB_PORT=4000`, `DB_SSL_CA_PATH` opcional).
- **`.gitignore`** do backend: adicionei `node_modules/` e `dist/` (o `.env` já era ignorado, com exceção do `.env.example`).
- **README**: a seção de execução agora lista `DB_PORT`, `CORS_ORIGIN` e `STEAM_API_KEY`.
- **Não criei `.env`** e **não commitei nada** — nada de credencial no Git, e as mudanças ficam para você revisar.

---

# 4. Fluxo completo de uma requisição

Exemplo `POST /api/reviews`:

```
React (5173) ──HTTP──▶ Express (3000)
                        │ CORS confere origem
                        │ express.json() parseia
                        │ router /api/reviews
                        │ validarCriacao()  ── inválido ──▶ 400 {error,message}
                        ▼
                    pool.getConnection()
                        │ BEGIN
                        │ INSERT jogos ... ON DUPLICATE KEY
                        │ SELECT id FROM jogos
                        │ INSERT reviews
                        │ COMMIT
                        ▼
                 TiDB Cloud (4000, TLS)
                        │
                        ▼
                  201 {id, message}
```

Erro em qualquer ponto → `ROLLBACK` → `next(err)` → `errorHandler` → JSON padronizado.

---

# 5. A parte do TiDB Cloud (detalhada)

Você está usando **TiDB Cloud**, que é compatível com o protocolo do MySQL. Isso permite usar `mysql2` e quase todo o SQL do guia, mas há diferenças que o código precisou considerar:

## 5.1 Conexão

| Item | MySQL local (guia) | TiDB Cloud (seu caso) |
|---|---|---|
| Host | `localhost` | `gateway01.<região>.prod.aws.tidbcloud.com` (varia) |
| Porta | `3306` | **`4000`** |
| TLS | opcional | **obrigatório** |
| Usuário | `root` | **com prefixo**, ex. `3xAbC123.root` |
| IP | livre | precisa estar na **allowlist** do cluster |

No código:
- `port: Number(process.env.DB_PORT) || 4000` — se esquecer a variável, ele tenta a porta certa do TiDB.
- `ssl: { minVersion: 'TLSv1.2' }` — sem isso o handshake é recusado.
- `DB_SSL_CA_PATH` é **opcional**: se você baixar o `ca.pem` no diálogo *Connect* do console e apontar o caminho, o pool valida o certificado com ele. No Windows, prefira barras normais (`C:/certs/ca.pem`) ou coloque o caminho entre aspas no `.env`.
- `dotenv` carrega o `.env` **antes** do pool ser criado (por isso o `dotenv.config()` também está no `database.ts`).

## 5.2 Por que o `/api/health` retornou 503

```json
{"status":"degradado","banco":"indisponível","timestamp":"..."}
```

Não é falha da API: **não existe `backend/.env`**, então `DB_HOST`/`DB_USER`/`DB_PASS` vão `undefined`. O servidor sobe normalmente (o pool do mysql2 é preguiçoso, só conecta na primeira query), e o health tenta `SELECT 1` e falha.

O endpoint foi desenhado exatamente para separar os dois mundos:
- API no ar, banco fora → `503 degradado`
- os dois no ar → `200 { status: "ok", banco: "conectado" }`

Ele **não** derruba o processo nem impede `/api/steam/search` de funcionar (que não usa banco — foi por isso que a busca da Steam funcionou nos testes).

## 5.3 Erros de conexão tratados

O handler global traduz:

| Código | Situação típica no TiDB Cloud | Resposta |
|---|---|---|
| `ETIMEDOUT` | IP não está na allowlist / firewall | 503 "Não foi possível conectar ao banco..." |
| `ECONNREFUSED` | host/porta errados | 503 idem |
| `ENOTFOUND` | host digitado errado | 503 idem |
| `ER_*` | SQL/schema divergente | 500 genérico + log no terminal |
| SSL/handshake | CA ausente ou TLS mal configurado | cai no 503/500 e o stack aparece no **console**, não na resposta |

Isso evita que o frontend receba stack trace, senha ou nome de tabela.

## 5.4 Compatibilidade do SQL usado

Tudo que está na Fase 1 e nas queries é suportado pelo TiDB:

- `ENGINE=InnoDB`, `utf8mb4` — aceitos (o TiDB mapeia para o próprio motor).
- `AUTO_INCREMENT`, `UNIQUE`, `FOREIGN KEY ... ON DELETE CASCADE`, índices — ok.
- `ENUM(...)` — ok.
- `CHECK (nota BETWEEN 1 AND 5)` — TiDB suporta e valida (versões atuais do Cloud são ≥ 7). Mesmo assim, **valido também na aplicação**, porque não quero depender da versão do cluster.
- `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` — ok.
- `INSERT ... ON DUPLICATE KEY UPDATE` — ok, inclusive é o padrão clássico para "upsert" de jogo.
- `BEGIN/COMMIT/ROLLBACK` — transações ok.

Ponto de atenção real de TiDB: em concorrência alta, transações podem retornar erros **retryable** (conflito de transação). No volume de um trabalho acadêmico (poucos usuários) isso não aparece; se um dia aparecer, a solução é reexecutar a transação.

## 5.5 Pool × limites do TiDB Cloud

- `connectionLimit: 10` está dentro do limite de conexões do cluster (Serverless/Dedicated permitem bem mais).
- Cada conexão é TLS, e o pool reaproveita: a primeira query paga o custo do handshake, as seguintes não.
- `waitForConnections` + `queueLimit: 0` = fila ilimitada esperando conexão. Em pico, requisições esperam em vez de falhar.

## 5.6 Latência e comportamento de nuvem

Seu banco não está no `localhost`: cada query tem latência de rede (tipicamente dezenas de ms, dependendo da região do cluster). Por isso:

- O CRUD faz **poucas queries por request** (o create faz 3 + BEGIN/COMMIT, inevitável pela regra de negócio).
- O `JOIN` do feed resolve jogo + review em **uma** ida ao banco (em vez de N+1).
- Se o cluster estiver suspenso/“acordando”, a primeira conexão pode demorar; o `timeout` padrão do mysql2 é generoso, mas o health serve para diagnosticar isso.

## 5.7 Como ligar de fato (passo a passo)

1. **Console do TiDB Cloud** → seu cluster → **Connect** → escolha *Node.js* / *mysql2*. De lá saem `host`, `port` (4000) e `user` com prefixo.
2. **Network Access / IP Access List** → adicione seu IP atual (ou `0.0.0.0/0` só para desenvolvimento). Sem isso: `ETIMEDOUT`.
3. **SQL Editor** → rode o DDL da Fase 1:
   ```sql
   CREATE DATABASE IF NOT EXISTS game_chest;
   USE game_chest;
   -- CREATE TABLE jogos ...
   -- CREATE TABLE reviews ...
   ```
   O `DB_NAME` do `.env` deve ser **exatamente** o nome do schema criado.
4. Crie `game-chest/backend/.env` (copie do `.env.example`):
   ```env
   PORT=3000
   DB_HOST=gateway01.xxx.prod.aws.tidbcloud.com
   DB_PORT=4000
   DB_USER=3xAbC123.root
   DB_PASS="sua-senha"
   DB_NAME=game_chest
   CORS_ORIGIN=http://localhost:5173
   STEAM_API_KEY=sua-chave
   ```
   Se a senha tiver `#`, espaço ou `$`, coloque entre aspas — o `dotenv` trata `#` como comentário.
5. `npm run dev` e abra `http://localhost:3000/api/health` → deve virar `200 {"status":"ok","banco":"conectado"}`.
6. Se der erro de certificado/TLS, baixe o **CA certificate** no diálogo Connect e preencha `DB_SSL_CA_PATH=C:/certs/ca.pem`.

---

# 6. O que testei e o que não testei

**Testado de verdade** (servidor compilado e rodando):
- `npx tsc --noEmit` → sem erros de tipo.
- `GET /api/steam/search?q=hollow` → 10 jogos reais da Steam.
- `GET /api/steam/search` (sem `q`) → `[]`.
- Rota inexistente → 404 no formato padrão.
- `POST /api/reviews` com corpo inválido → 400 com a lista de erros.
- `GET /api/steam/user-games/abc` → 400 "SteamID inválida".
- `GET /api/health` → 503 esperado (sem `.env`).

**Não testado** (impossível sem suas credenciais):
- CREATE/READ/UPDATE/DELETE gravando no seu TiDB.
- `user-games` com chave real da Steam.

Assim que o `.env` existir, o roteiro da Fase 3 é: criar uma review do Hollow Knight (payload do guia), listar, editar a nota, deletar — e conferir as linhas no SQL Editor do TiDB.

---

# 7. Resumo do que mudou no repositório

| Arquivo | Status |
|---|---|
| `src/server.ts` | **novo** |
| `src/controllers/reviewController.ts` | **novo** |
| `src/controllers/steamController.ts` | **novo** |
| `src/routes/reviewRoutes.ts` | **novo** |
| `src/routes/steamRoutes.ts` | **novo** |
| `src/middlewares/errorHandler.ts` | **novo** |
| `src/config/database.ts` | modificado (comentário removido, lógica mantida) |
| `.env.example` | modificado (+CORS_ORIGIN, +STEAM_API_KEY) |
| `.gitignore` | modificado (+node_modules, +dist) |
| `README.md` | modificado (bloco de env) |
| `atualizacoes.md` (raiz) | **novo** |
| `AGENTS.md` (raiz) | **novo** |

Nenhum commit foi feito e nenhum arquivo do frontend foi alterado.

Quer que eu prepare agora o `frontend/src/services/api.ts` e os tipos TypeScript (`Review`, `SteamGame`) já alinhados a esses contratos, ou prefere primeiro validar o CRUD com o `.env` do TiDB?
