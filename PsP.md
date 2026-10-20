# **Game Chest — Guia de Implementação Completo (Do Zero ao 100%)**

Este guia descreve o processo de desenvolvimento da aplicação **Game Chest**, cobrindo desde a modelagem do banco de dados até a integração total entre o cliente React e a API Node.js/Express.

---

## **Sumário das Fases**
1. [Fase 0: Preparação e Arquitetura de Pastas](#fase-0-preparação-e-arquitetura-de-pastas)
2. [Fase 1: Banco de Dados MySQL](#fase-1-banco-de-dados-mysql)
3. [Fase 2: Construção da API Back-end](#fase-2-construção-da-api-back-end)
4. [Fase 3: Validação das Rotas e Testes de API](#fase-3-validação-das-rotas-e-testes-de-api)
5. [Fase 4: Construção do Front-end (React + Vite + Tailwind)](#fase-4-construção-do-front-end)
6. [Fase 5: Integração, Tratamento de Estados e Entrega](#fase-5-integração-e-requisitos-finais)

---

## **Fase 0: Preparação e Arquitetura de Pastas**

Crie o diretório raiz do projeto com a separação obrigatória entre cliente e servidor:

```bash
mkdir game-chest
cd game-chest
mkdir backend
```

A estrutura final do projeto seguirá este formato:

```text
game-chest/
├── backend/            # API RESTful (Node.js + Express + TypeScript)
└── frontend/           # SPA (React + Vite + TypeScript + Tailwind CSS)
```

---

## **Fase 1: Banco de Dados MySQL**

Abra o **MySQL Workbench** (ou terminal MySQL) e execute o script DDL abaixo para criar o banco de dados e as tabelas com integridade referencial:

```sql
CREATE DATABASE IF NOT EXISTS game_chest;
USE game_chest;

-- Tabela de metadados dos jogos (evita duplicação ao avaliar o mesmo jogo várias vezes)
CREATE TABLE IF NOT EXISTS jogos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    steam_appid INT UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    capa_url VARCHAR(512) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela principal de reviews dos usuários (CRUD)
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

-- Índices de performance para busca e filtros
CREATE INDEX idx_reviews_usuario ON reviews(usuario);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_jogos_steam_appid ON jogos(steam_appid);
```

---

## **Fase 2: Construção da API Back-end**

### **1. Inicialização e Dependências**

Navegue até a pasta `backend/` e instale as bibliotecas necessárias:

```bash
cd backend
npm init -y

# Dependências de produção
npm install express mysql2 cors dotenv

# Dependências de desenvolvimento e tipagens
npm install -D typescript @types/node @types/express @types/cors ts-node-dev
npx tsc --init
```

### **2. Configuração de Scripts (`package.json`)**

Adicione o script de inicialização com hot-reload no seu `package.json`:

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc"
}
```

### **3. Estrutura de Arquivos do Back-end**

Organize a pasta `backend/src/` da seguinte forma:

```text
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── reviewController.ts
│   │   └── steamController.ts
│   ├── routes/
│   │   ├── reviewRoutes.ts
│   │   └── steamRoutes.ts
│   ├── middlewares/
│   │   └── errorHandler.ts
│   └── server.ts
├── .env
├── package.json
└── tsconfig.json
```

### **4. Implementação dos Arquivos Principais**

#### **`.env`**
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=suasenha
DB_NAME=game_chest
```

#### **`src/config/database.ts`**
```typescript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'game_chest',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

#### **`src/controllers/steamController.ts`** (Proxy para contornar CORS)
```typescript
import { Request, Response } from 'express';

export const searchSteamGames = async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query || query.trim() === '') {
    return res.json([]);
  }

  try {
    const steamUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=portuguese&cc=BR`;
    const response = await fetch(steamUrl);
    const data: any = await response.json();

    const games = (data.items || []).map((item: any) => ({
      steam_appid: item.id,
      titulo: item.name,
      capa_url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`
    }));

    return res.json(games);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar o catálogo da Steam' });
  }
};
```

#### **`src/controllers/reviewController.ts`** (CRUD Completo)
```typescript
import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// CREATE: Cadastra ou vincula o jogo e insere a review
export const createReview = async (req: Request, res: Response) => {
  const { usuario, steam_appid, titulo, capa_url, horas_jogadas, status, nota, texto_review } = req.body;

  if (!usuario || !steam_appid || !titulo || !nota || !texto_review) {
    return res.status(400).json({ message: 'Campos obrigatórios não informados.' });
  }

  try {
    // 1. Garante que o jogo exista na tabela 'jogos'
    await pool.query(
      `INSERT INTO jogos (steam_appid, titulo, capa_url)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), capa_url = VALUES(capa_url)`,
      [steam_appid, titulo, capa_url]
    );

    // 2. Busca o ID interno do jogo
    const [gameRows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM jogos WHERE steam_appid = ?',
      [steam_appid]
    );
    const jogo_id = gameRows[0].id;

    // 3. Insere a review
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO reviews (usuario, jogo_id, horas_jogadas, status, nota, texto_review)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario, jogo_id, horas_jogadas || 0, status || 'Jogando', nota, texto_review]
    );

    return res.status(201).json({ id: result.insertId, message: 'Review criada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno ao salvar review.' });
  }
};

// READ ALL: Lista reviews com filtros opcionais
export const listReviews = async (req: Request, res: Response) => {
  const { status, usuario } = req.query;
  let sql = `
    SELECT r.id, r.usuario, r.horas_jogadas, r.status, r.nota, r.texto_review, r.created_at,
           j.titulo, j.capa_url, j.steam_appid
    FROM reviews r
    JOIN jogos j ON r.jogo_id = j.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  if (usuario) {
    sql += ' AND r.usuario = ?';
    params.push(usuario);
  }

  sql += ' ORDER BY r.created_at DESC';

  try {
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao buscar reviews.' });
  }
};

// READ BY ID: Detalhe de uma review
export const getReviewById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, j.titulo, j.capa_url, j.steam_appid
       FROM reviews r
       JOIN jogos j ON r.jogo_id = j.id
       WHERE r.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Review não encontrada.' });
    }
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao consultar review.' });
  }
};

// UPDATE: Atualiza dados de uma review existente
export const updateReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { horas_jogadas, status, nota, texto_review } = req.body;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE reviews 
       SET horas_jogadas = ?, status = ?, nota = ?, texto_review = ?
       WHERE id = ?`,
      [horas_jogadas, status, nota, texto_review, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review não encontrada para atualização.' });
    }

    return res.json({ message: 'Review atualizada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao atualizar review.' });
  }
};

// DELETE: Exclui uma review por ID
export const deleteReview = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM reviews WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Review não encontrada para exclusão.' });
    }
    return res.json({ message: 'Review excluída com sucesso.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erro ao excluir review.' });
  }
};
```

#### **`src/routes/reviewRoutes.ts`**
```typescript
import { Router } from 'express';
import {
  createReview,
  listReviews,
  getReviewById,
  updateReview,
  deleteReview
} from '../controllers/reviewController';

const router = Router();

router.post('/', createReview);
router.get('/', listReviews);
router.get('/:id', getReviewById);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

export default router;
```

#### **`src/routes/steamRoutes.ts`**
```typescript
import { Router } from 'express';
import { searchSteamGames } from '../controllers/steamController';

const router = Router();
router.get('/search', searchSteamGames);

export default router;
```

#### **`src/server.ts`**
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reviewRoutes from './routes/reviewRoutes';
import steamRoutes from './routes/steamRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS para o endereço do Vite
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Registro de Rotas
app.use('/api/reviews', reviewRoutes);
app.use('/api/steam', steamRoutes);

// Middleware Global de Tratamento de Erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'Ocorreu um erro interno no servidor.',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

---

## **Fase 3: Validação das Rotas e Testes de API**

Inicie o servidor no terminal da pasta `backend`:

```bash
npm run dev
```

Abra o navegador ou uma extensão HTTP (como **Thunder Client** ou **Postman**) e execute os testes de verificação:

1. **Catálogo da Steam:** Acesse `http://localhost:3000/api/steam/search?q=hollow` e confirme se o retorno JSON lista os jogos encontrados.
2. **Criação (POST):** Envie um payload JSON para `http://localhost:3000/api/reviews`:
   ```json
   {
     "usuario": "PlayerOne",
     "steam_appid": 367520,
     "titulo": "Hollow Knight",
     "capa_url": "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/header.jpg",
     "horas_jogadas": 45,
     "status": "Zerado",
     "nota": 5,
     "texto_review": "Uma das melhores atmosferas dos metroidvanias."
   }
   ```
3. **Listagem (GET):** Acesse `http://localhost:3000/api/reviews` e confirme se a review recém-criada é listada.

---

## **Fase 4: Construção do Front-end**

Volte para a pasta raiz `game-chest/` e inicialize o projeto React:

```bash
cd ..
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom axios lucide-react
```

### **1. Configuração do Tailwind CSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Edite o arquivo `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Substitua todo o conteúdo de `src/index.css` por:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-slate-950 text-slate-100 min-h-screen antialiased;
}
```

### **2. Configuração do Cliente HTTP (`src/services/api.ts`)**

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});
```

### **3. Componentes Reutilizáveis (`src/components/`)**

#### **`LoadingSpinner.tsx`**
```tsx
export const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);
```

#### **`ConfirmModal.tsx`**
```tsx
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### **`StarRating.tsx`**
```tsx
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
}

export const StarRating = ({ value, onChange, readOnly = false }: StarRatingProps) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(star)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition`}
        >
          <Star
            size={20}
            className={star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
          />
        </button>
      ))}
    </div>
  );
};
```

#### **`GameCard.tsx`**
```tsx
import { StarRating } from './StarRating';
import { Clock } from 'lucide-react';

interface GameCardProps {
  titulo: string;
  capa_url: string;
  nota: number;
  status: string;
  horas_jogadas: number;
  usuario: string;
  texto_review: string;
}

export const GameCard = ({
  titulo,
  capa_url,
  nota,
  status,
  horas_jogadas,
  usuario,
  texto_review
}: GameCardProps) => {
  const statusColors: Record<string, string> = {
    'Zerado': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Jogando': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Abandonado': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Quero Jogar': 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col shadow-lg">
      <div className="h-44 overflow-hidden relative">
        <img src={capa_url} alt={titulo} className="w-full h-full object-cover" />
        <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-semibold ${statusColors[status] || 'bg-slate-800 text-slate-300'}`}>
          {status}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{titulo}</h3>
          <div className="flex items-center justify-between mb-3">
            <StarRating value={nota} readOnly />
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Clock size={14} />
              <span>{horas_jogadas}h</span>
            </div>
          </div>
          <p className="text-slate-300 text-sm line-clamp-3 mb-4">{texto_review}</p>
        </div>
        <div className="pt-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
          <span>Por: <strong className="text-slate-400">{usuario}</strong></span>
        </div>
      </div>
    </div>
  );
};
```

---

## **Fase 5: Integração e Requisitos Finais**

### **1. Barra de Navegação (`src/components/Navbar.tsx`)**
Crie uma barra de navegação com links fixos para as rotas `/` (Feed), `/nova-review` (Novo Registro) e `/perfil` (Painel do Usuário).

### **2. Configuração do Roteamento (`src/App.tsx`)**
Estruture o React Router DOM com as três rotas principais:

```tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { ReviewForm } from './pages/ReviewForm';
import { Profile } from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Game Chest
          </Link>
          <nav className="flex gap-4">
            <Link to="/" className="text-slate-300 hover:text-white text-sm font-medium transition">Feed</Link>
            <Link to="/nova-review" className="text-slate-300 hover:text-white text-sm font-medium transition">+ Avaliar</Link>
            <Link to="/perfil" className="text-slate-300 hover:text-white text-sm font-medium transition">Meu Perfil</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nova-review" element={<ReviewForm />} />
          <Route path="/editar-review/:id" element={<ReviewForm />} />
          <Route path="/perfil" element={<Profile />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
```

---

## **Execução dos Projetos em Desenvolvimento**

1. **Terminal 1 (Back-end):**
   ```bash
   cd backend
   npm run dev
   # Rodando na porta 3000
   ```

2. **Terminal 2 (Front-end):**
   ```bash
   cd frontend
   npm run dev
   # Rodando na porta 5173
   ```

Acesse `http://localhost:5173` no navegador para utilizar a aplicação completa.
