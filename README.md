# **Game Chest — Especificação Técnica e Arquitetura do Sistema**

Documento de arquitetura de software, especificação de APIs, modelagem de dados e roteiro de demonstração para a plataforma **Game Chest**.

---

## **1. Visão Geral do Sistema**

### **1.1 Proposta da Aplicação**
O **Game Chest** é uma rede social e rastreador de jogos eletrônicos no estilo Letterboxd/Backloggd. A plataforma permite aos usuários registrar diários de jogos, publicar análises (reviews), acompanhar horas jogadas e manter um catálogo personalizado sincronizado diretamente com a biblioteca da **Steam**.

### **1.2 Arquitetura de Alto Nível**
O sistema adota uma **arquitetura cliente-servidor descentralizada**, com separação estrita entre a camada de apresentação (Front-end SPA) e a camada de serviços e negócios (Back-end RESTful API).

* **Front-end (Client):** Single Page Application responsável pelo renderizado dinâmico de telas, estado local da aplicação e integração via HTTP.
* **Back-end (Server):** API Node.js/Express responsável pela regra de negócios, intermediação de requisições de APIs de terceiros (Proxy) e persistência de dados.
* **Banco de Dados:** SGBD Relacional (MySQL) para armazenamento persistente e consistente das entidades do sistema.

---

## **2. Tecnologias Utilizadas**

| Camada | Tecnologia | Função Principal / Detalhes |
| :--- | :--- | :--- |
| **Front-end** | React (Vite) | Framework UI para criação de Single Page Applications de alto desempenho. |
| | TypeScript | Tipagem estática para garantia de contrato de dados e redução de erros em runtime. |
| | Tailwind CSS | Estilização utility-first orientada a componentes visuais responsivos em dark mode. |
| **Back-end** | Node.js + Express | Runtime e framework web para construção de APIs RESTful leves e assíncronas. |
| | TypeScript | Consistência de tipos entre chamadas externas e retornos das APIs internas. |
| **Banco de Dados** | MySQL 8.0+ | Sistema Gerenciador de Banco de Dados Relacional para persistência dos dados. |
| | `mysql2` (`createPool`) | Driver assíncrono para Node.js com gerenciamento otimizado de conexões (Pool). |
| **Comunicação** | Axios / Fetch API | Cliente HTTP para consumo de endpoints REST. |
| | CORS Middleware | Permitir chamadas oriundas exclusivamente da origem do Front-end (`http://localhost:5173`). |
| **APIs Externas** | Steam Web API | Integração com endpoints `storesearch` (autocomplete público) e `GetOwnedGames` (tempo de jogo). |

---

## **3. Estrutura de Telas e Rotas (Front-end)**

A aplicação conta com três visões principais acessíveis via roteamento SPA:

### **Rota 1: Feed da Comunidade (`/`)**
* **Objetivo:** Exibir as análises e atualizações mais recentes enviadas pela comunidade de usuários.
* **Componentes Visuais:**
  * Barra superior de filtros por **Status** (*Jogando*, *Zerado*, *Abandonado*, *Quero Jogar*) e ordenação por **Nota** ou **Data de Criação** (a barra só aparece quando há reviews ou um filtro ativo).
  * Resumo do arquivo em uma linha (`6 reviews no arquivo · 540 horas registradas · média 4,5`).
  * **Review em destaque:** a mais recente (ou a primeira da ordenação) ocupa um painel editorial com capa grande, texto expansível e autor.
  * **Lista do diário:** as demais reviews aparecem em linhas numeradas (`#0001`), com capa, status, data, horas, autor, nota e trecho do texto.

### **Rota 2: Gerenciador de Reviews (`/nova-review` e `/editar-review/:id`)**
* **Objetivo:** Interface única de formulário para criação (*Create*) ou edição (*Update*) de uma publicação.
* **Campos do Formulário:**
  * **Busca de Jogo:** Componente `SteamAutocompleteInput` que sugere jogos diretamente da loja Steam ao digitar.
  * **Metadados Automáticos:** Preenchimento automático da capa e do AppID do jogo selecionado.
   * **Horas Jogadas:** Input numérico ajustável (preenchido automaticamente via biblioteca Steam vinculada, quando o jogo estiver nela).
   * **Ficha do jogo:** Depois da seleção, a Steam devolve lançamento, desenvolvedor, gêneros e avaliação pública.
  * **Avaliação:** Seletor interativo `StarRating` (1 a 5 estrelas).
  * **Status de Conclusão:** Dropdown (*Jogando*, *Zerado*, *Abandonado*, *Quero Jogar*).
  * **Análise Textual:** Área de texto simples para comentários e crítica sobre a experiência.

### **Rota 3: Perfil do Usuário e Biblioteca (`/perfil`)**
* **Objetivo:** Exibição do resumo estatístico individual e gerenciamento das próprias reviews.
   * **Identificação:** Conta com e-mail e senha; a sessão usa cookie `httpOnly`. O vínculo Steam é opcional e usa OpenID oficial.
* **Estatísticas Rápidas (Painel Destaque):**
  * Total de jogos zerados.
  * Acúmulo total de horas registradas.
  * Média geral das notas atribuídas.
* **Listagem Pessoal:** Tabela ou grid com botões de ação para edição e remoção (com acionamento do `ConfirmModal`).

---

## **4. Componentes Reutilizáveis (Front-end)**

Os nomes `isOpen`/`onConfirm` do planejamento original viraram `aberto`/`onConfirmar`; os componentes em uso hoje são:

1. **`ReviewRow`** — linha numerada do feed e do perfil (`review: Review`), com capa, status, data, horas, autor, estrelas e trecho do texto. O destaque do feed usa o mesmo conteúdo em um layout editorial (`Destaque`, em `pages/Home.tsx`).
2. **`SteamAutocompleteInput`** — busca na Steam com *debounce* de 300ms, navegação por setas, `Enter` para selecionar e aviso quando a busca não devolve jogos. Recebe `selecionado`, `onSelecionar` e `desabilitado`.
3. **`StarRating`** — estrelas interativas (`value`, `onChange`, `readOnly`, `size`), com rótulos acessíveis por estrela.
4. **`ConfirmModal`** — diálogo com foco inicial no “Cancelar”, fechamento por `Esc`/clique no fundo e estado `ocupado` durante a exclusão.
5. **`LoadingSpinner`** — indicador de progresso com texto configurável.
6. **`Cover`** — capa da Steam com fallback quando a imagem falha.
7. **`StatusBadge`**, **`EmptyState`**, **`ErrorBanner`**, **`StatsStrip`**, **`ReviewPreview`** e **`Navbar`** — status com ponto colorido, estado vazio com ação, erro com “Tentar de novo”, resumo estatístico, prévia ao vivo do formulário e navegação fixa.
8. **`GameCard`** — não foi necessário: o feed usa destaque + linhas (`ReviewRow`), o que evita a grade de cards idênticos.

---

## **5. Especificação da API RESTful (Back-end)**

Todos os endpoints retornam formato JSON e seguem os padrões de verbos HTTP e códigos de status semânticos.

### **5.1 Tabela de Endpoints**

| Método | Endpoint | Descrição | Status Sucesso | Status Erro |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/reviews` | Cadastra uma nova review no banco | 201 Created | 400 Bad Request |
| **GET** | `/api/reviews` | Lista reviews com filtros opcionais (`status`, `usuario`) | 200 OK | 500 Server Error |
| **GET** | `/api/reviews/:id` | Retorna o detalhe completo de uma review por ID | 200 OK | 404 Not Found |
| **PUT** | `/api/reviews/:id` | Atualiza os dados de uma review existente | 200 OK | 400, 404 |
| **DELETE** | `/api/reviews/:id` | Exclui uma review do sistema | 200 OK | 404 Not Found |
| **POST** | `/api/auth/registrar` | Cria conta e inicia sessão | 201 Created | 400, 409 |
| **POST** | `/api/auth/entrar` | Inicia sessão com e-mail e senha | 200 OK | 401 |
| **POST** | `/api/auth/sair` | Encerra sessão | 200 OK | — |
| **GET** | `/api/auth/eu` | Retorna a conta autenticada, ou `null` | 200 OK | — |
| **PUT** | `/api/auth/perfil` | Atualiza nome de exibição | 200 OK | 401, 400 |
| **GET** | `/api/auth/steam/vincular` | Inicia vínculo oficial via Steam OpenID | 302 Redirect | 401 |
| **GET** | `/api/auth/steam/retorno` | Valida retorno OpenID e grava SteamID64 | 302 Redirect | — |
| **POST** | `/api/auth/steam/desvincular` | Remove vínculo Steam | 200 OK | 401 |
| **GET** | `/api/steam/search` | Proxy para busca na Steam Store (evita CORS) | 200 OK | 500 Server Error |
| **GET** | `/api/steam/app/:appid` | Metadados e avaliação pública do catálogo Steam | 200 OK | 404, 502 |
| **GET** | `/api/steam/biblioteca` | Biblioteca da conta logada, somente jogos com horas | 200 OK | 400, 401, 503 |
| **GET** | `/api/steam/user-games/:steamId` | Consulta jogos e tempo de jogo de uma SteamID | 200 OK | 400, 500 |

### **5.2 Middlewares e Tratamento de Erros**
A aplicação utiliza um **Middleware Global de Erros** no Express. Exceções não tratadas são capturadas e formatadas na seguinte estrutura padrão:

```json
{
  "error": true,
  "message": "Descrição amigável sobre a falha ocorrida.",
  "timestamp": "2026-10-20T18:00:00.000Z"
}
```

---

## **6. Modelagem do Banco de Dados (MySQL)**

### **6.1 Diagrama Entidade-Relacionamento (Conceitual)**
* **`jogos`** $1 \longleftrightarrow N$ **`reviews`**  
*(Um jogo pode ter várias análises; cada análise pertence a um único jogo).*

### **6.2 Script SQL de Criação do Schema**

```sql
CREATE DATABASE IF NOT EXISTS game_chest;
USE game_chest;

-- Tabela de Jogos (Cache/Registro local de metadados da Steam)
CREATE TABLE IF NOT EXISTS jogos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    steam_appid INT UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    capa_url VARCHAR(512) NOT NULL,
    data_lancamento VARCHAR(40) NULL,
    desenvolvedor VARCHAR(255) NULL,
    genero VARCHAR(255) NULL,
    avaliacao_steam VARCHAR(120) NULL,
    avaliacao_percentual TINYINT UNSIGNED NULL,
    avaliacao_total INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Reviews / Diário dos Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    steam_id VARCHAR(17) NULL UNIQUE,
    steam_nome VARCHAR(100) NULL,
    avatar_url VARCHAR(512) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    usuario_id INT NULL,
    jogo_id INT NOT NULL,
    horas_jogadas INT NOT NULL DEFAULT 0,
    status ENUM('Jogando', 'Zerado', 'Abandonado', 'Quero Jogar') NOT NULL DEFAULT 'Jogando',
    nota INT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    texto_review TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_jogos FOREIGN KEY (jogo_id) REFERENCES jogos(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices para otimização de consultas do Feed e Filtros
CREATE INDEX idx_reviews_usuario ON reviews(usuario);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_jogos_steam_appid ON jogos(steam_appid);
```

---

## **7. Tratamento de Feedback e Estados da Interface**

1. **Estado de Carregamento (Loading):** Ativação de esqueletos visuais (*skeletons*) ou exibição do componente `LoadingSpinner` durante requisições assíncronas no evento de montagem de componentes ou submissão de formulários.
2. **Estado de Erro (Error Feedback):** Banner intuitivo exibido caso a API fique indisponível, informando a mensagem tratada do servidor ou indicando problemas de conexão local.
3. **Estado Vazio (Empty State):** Mensagens orientativas para o usuário quando buscas na Steam ou pesquisas por filtros na página inicial não retornam registros.

---

## **8. Roteiro de Entrega e Execução Local**

### **8.1 Passo a Passo para Inicialização**

#### **Configuração do Banco de Dados**
1. Inicie o serviço local do **MySQL** (porta padrão 3306).
2. Execute o script da Seção 6.2 no MySQL Workbench ou terminal.

#### **Configuração e Execução do Back-end**
```bash
# Navegar até a pasta do servidor
cd backend

# Instalar as dependências do projeto
npm install

# Configurar as variáveis de ambiente em um arquivo .env
# (use o backend/.env.example como base):
# DB_HOST=localhost
# DB_PORT=4000
# DB_USER=root
# DB_PASS=suasenha
# DB_NAME=game_chest
# PORT=3000
# CORS_ORIGIN=http://localhost:5173
# STEAM_API_KEY=chave-da-steam-web-api

# Executar a aplicação em modo de desenvolvimento
npm run dev
```
*O servidor estará operacional em `http://localhost:3000`.*

#### **Configuração e Execução do Front-end**
```bash
# Navegar até a pasta do projeto React
cd frontend

# Instalar as dependências do projeto
npm install

# Opcional: apontar para outra API (padrão: http://localhost:3000/api)
# copy .env.example .env

# Iniciar o servidor de desenvolvimento do Vite
npm run dev
```
*A aplicação estará acessível no navegador através de `http://localhost:5173`.*

---

### **8.2 Roteiro de Demonstração para Apresentação**

1. **Acesso à Home (`/`):** Demonstre o carregamento do destaque e da lista do diário no feed, mostrando o funcionamento dos filtros por status (*Zerado*, *Jogando*) e a ordenação.
2. **Criação de Review (`/nova-review`):**
   * Digite o nome de um jogo famoso (ex: "Portal") no campo de autocomplete da Steam.
   * Exiba a seleção do jogo trazendo automaticamente a imagem de capa e metadados.
   * Preencha o status (*Zerado*), atribua uma nota (ex: 5 estrelas), insira as horas jogadas e escreva um texto demonstrativo.
   * Envie o formulário e observe o indicador de `LoadingSpinner`.
3. **Visualização no Perfil (`/perfil`):**
   * Navegue até a página de perfil do usuário.
   * Mostre a atualização automática do resumo estatístico (Total de horas e jogos).
   * Localize a nova review cadastrada na lista pessoal.
4. **Edição do Registro (`/editar-review/:id`):**
   * Clique no botão de edição da review criada.
   * Altere a nota ou o texto descritivo.
   * Salve as modificações e valide a atualização visual instantânea.
5. **Exclusão com Modal Destrutivo:**
   * Clique no botão de deletar a review.
   * Mostre o componente `ConfirmModal` impedindo a deleção acidental.
   * Confirme a remoção e observe a limpeza dos dados na tela e a atualização das estatísticas gerais do usuário.
