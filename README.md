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
  * Barra superior de filtros por **Status** (*Jogando*, *Zerado*, *Abandonado*, *Quero Jogar*) e ordenação por **Nota** ou **Data de Criação**.
  * Grid responsivo de cards (`GameCard`) contendo capa, título, nota em estrelas, horas declaradas e autor.

### **Rota 2: Gerenciador de Reviews (`/nova-review` e `/editar-review/:id`)**
* **Objetivo:** Interface única de formulário para criação (*Create*) ou edição (*Update*) de uma publicação.
* **Campos do Formulário:**
  * **Busca de Jogo:** Componente `SteamAutocompleteInput` que sugere jogos diretamente da loja Steam ao digitar.
  * **Metadados Automáticos:** Preenchimento automático da capa e do AppID do jogo selecionado.
  * **Horas Jogadas:** Input numérico ajustável (preenchido automaticamente via Steam API se disponível).
  * **Avaliação:** Seletor interativo `StarRating` (1 a 5 estrelas).
  * **Status de Conclusão:** Dropdown (*Jogando*, *Zerado*, *Abandonado*, *Quero Jogar*).
  * **Análise Textual:** Área de texto simples para comentários e crítica sobre a experiência.

### **Rota 3: Perfil do Usuário e Biblioteca (`/perfil`)**
* **Objetivo:** Exibição do resumo estatístico individual e gerenciamento das próprias reviews.
* **Identificação:** Nome de Usuário e SteamID informados e persistidos localmente no navegador via `localStorage`.
* **Estatísticas Rápidas (Painel Destaque):**
  * Total de jogos zerados.
  * Acúmulo total de horas registradas.
  * Média geral das notas atribuídas.
* **Listagem Pessoal:** Tabela ou grid com botões de ação para edição e remoção (com acionamento do `ConfirmModal`).

---

## **4. Componentes Reutilizáveis (Front-end)**

1. **`GameCard`**
   * *Propriedades:* `title`, `coverUrl`, `rating`, `status`, `playtime`, `username`.
   * *Função:* Exibir um resumo compacto visual das reviews no Feed e no Perfil.
2. **`SteamAutocompleteInput`**
   * *Propriedades:* `onSelectGame(gameData: Game)`.
   * *Função:* Campo de busca que implementa técnica de *Debounce* (300ms) para disparar requisições à API da Steam sem sobrecarregar a rede.
3. **`StarRating`**
   * *Propriedades:* `value`, `onChange(rating: number)`, `readOnly?: boolean`.
   * *Função:* Renderizar estrelas interativas preenchidas ou vazias baseadas na pontuação.
4. **`ConfirmModal`**
   * *Propriedades:* `isOpen`, `title`, `message`, `onConfirm()`, `onCancel()`.
   * *Função:* Janela modal sobreposta que bloqueia a interface para confirmação explícita de ações destrutivas (deleção de reviews).
5. **`LoadingSpinner`**
   * *Propriedades:* `size`, `color`.
   * *Função:* Elemento gráfico de progresso exibido enquanto dados assíncronos são trafegados via HTTP.

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
| **GET** | `/api/steam/search` | Proxy para busca na Steam Store (evita CORS) | 200 OK | 500 Server Error |
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Reviews / Diário dos Usuários
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    jogo_id INT NOT NULL,
    horas_jogadas INT NOT NULL DEFAULT 0,
    status ENUM('Jogando', 'Zerado', 'Abandonado', 'Quero Jogar') NOT NULL DEFAULT 'Jogando',
    nota INT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    texto_review TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_jogos FOREIGN KEY (jogo_id) REFERENCES jogos(id) ON DELETE CASCADE
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

# Configurar as variáveis de ambiente em um arquivo .env:
# DB_HOST=localhost
# DB_USER=root
# DB_PASS=suasenha
# DB_NAME=game_chest
# PORT=3000

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

# Iniciar o servidor de desenvolvimento do Vite
npm run dev
```
*A aplicação estará acessível no navegador através de `http://localhost:5173`.*

---

### **8.2 Roteiro de Demonstração para Apresentação**

1. **Acesso à Home (`/`):** Demonstre o carregamento dos cards existentes no feed, mostrando o funcionamento dos filtros por status (*Zerado*, *Jogando*) e a ordenação.
2. **Criação de Review (`/nova-review`):**
   * Digite o nome de um jogo famoso (ex: "Portal") no campo de autocomplete da Steam.
   * Exiba a seleção do jogo trazendo automaticamente a imagem de capa e metadados.
   * Preencha o status (*Zerado*), atribua uma nota (ex: 5 estrelas), insira as horas jogadas e escreva um texto demonstrativo.
   * Envie o formulário e observe o indicador de `LoadingSpinner`.
3. **Visualização no Perfil (`/perfil`):**
   * Navegue até a página de perfil do usuário.
   * Mostre a atualização automática dos cards estatísticos (Total de horas e jogos).
   * Localize a nova review cadastrada na lista pessoal.
4. **Edição do Registro (`/editar-review/:id`):**
   * Clique no botão de edição da review criada.
   * Altere a nota ou o texto descritivo.
   * Salve as modificações e valide a atualização visual instantânea.
5. **Exclusão com Modal Destrutivo:**
   * Clique no botão de deletar a review.
   * Mostre o componente `ConfirmModal` impedindo a deleção acidental.
   * Confirme a remoção e observe a limpeza dos dados na tela e a atualização das estatísticas gerais do usuário.
