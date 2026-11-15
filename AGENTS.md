# AGENTS.md — Instruções para agentes de IA

Este arquivo vale para **todo agente (humano ou IA)** que trabalhar neste repositório.

## Regra obrigatória: toda alteração deve ser registrada

**Toda e qualquer alteração feita no projeto deve ser registrada em `atualizacoes.md`** (na raiz do repositório, ao lado deste arquivo), **no mesmo trabalho em que a alteração foi feita**, antes de considerar a tarefa concluída.

Se a alteração não estiver registrada em `atualizacoes.md`, a tarefa **não está concluída**.

### O registro deve conter

1. **Data** da alteração.
2. **Título curto** da entrega (ex.: "Fase 2 — API back-end").
3. **O que foi feito**, explicado de forma detalhada e em português.
4. **Arquivos criados, modificados ou removidos**, com caminho.
5. **Decisões técnicas e os motivos** (por que escolheu X em vez de Y).
6. **Como testar / validar** a alteração.
7. **O que não foi testado** e por quê.
8. **Próximos passos**, se aplicável.

### Formato

- Adicione a entrada **no topo**, logo abaixo do cabeçalho `# Atualizações — Game Chest`.
- Use o padrão:
  ```md
  ## AAAA-MM-DD — Título curto

  Descrição detalhada...
  ```
- Não apague entradas antigas: o arquivo é um histórico cronológico.
- Se uma alteração corrigir ou substituir outra, registre uma nova entrada explicando a correção.

---

## Contexto do projeto

**Game Chest** é um site de reviews de jogos com integração com a API da Steam (estilo Letterboxd/Backloggd), com diário de jogos, notas, horas jogadas, status de conclusão e biblioteca Steam.

### Estrutura

```text
Game-Chest/
├── atualizacoes.md      # histórico de alterações (obrigatório)
├── AGENTS.md            # este arquivo
├── README.md            # arquitetura, especificação da API e do banco
├── PsP.md               # guia de implementação passo a passo (fases 0 a 5)
└── game-chest/
    ├── backend/         # API REST (Node.js + Express 5 + TypeScript + mysql2)
    └── frontend/        # SPA (React 19 + Vite + TypeScript)
```

### Estado atual

- **Fase 0**: estrutura de pastas — concluída.
- **Fase 1**: banco de dados — schema definido no `README.md` (seção 6.2), hospedado no **TiDB Cloud**.
- **Fase 2**: API back-end — concluída (reviews CRUD + proxy Steam + health check). Detalhes em `atualizacoes.md`.
- **Fase 3**: validação das rotas com o banco real — concluída (health 200 + CRUD completo testado no TiDB).
- **Fase 4**: front-end — concluída (feed com destaque e lista, formulário de criação/edição, perfil com biblioteca Steam, responsivo, tema escuro). Detalhes em `atualizacoes.md`.
- **Fase 5**: integração e requisitos finais — pendente.

### Banco de dados

- **TiDB Cloud** (compatível com MySQL).
- Porta **4000**, **TLS obrigatório**, usuário com prefixo.
- IP do desenvolvedor precisa estar na allowlist do cluster.
- Credenciais ficam em `game-chest/backend/.env` (ignorado pelo Git). Use `game-chest/backend/.env.example` como base.
- **Nunca** commite `.env`, senhas ou chaves.

### Comandos úteis

```bash
# backend
cd game-chest/backend
npm run dev            # servidor com hot-reload (porta 3000)
npx tsc --noEmit       # checagem de tipos

# frontend
cd game-chest/frontend
npm run dev            # Vite (porta 5173)
npm run build          # build de produção
```

- Health check do backend: `GET http://localhost:3000/api/health`
- Contrato de erros da API: `{ "error": true, "message": "...", "timestamp": "..." }`
- CORS liberado para as origens definidas em `CORS_ORIGIN` (padrão `http://localhost:5173`).

---

## Boas práticas para alterações

- Siga a estrutura e o estilo já existentes (controllers / routes / middlewares / config).
- Mantenha o **contrato de resposta da API** documentado no `README.md` caso adicione ou mude endpoints.
- **Nunca** interpole entrada de usuário direto em SQL; use placeholders (`?`) e listas brancas para colunas/ordenação.
- Valide dados na aplicação **e** no banco.
- Datas trafegam em **ISO 8601 com offset** no fuso de `APP_TIMEZONE` (padrão `America/Sao_Paulo`); o banco permanece em UTC.
- Não vaze stack trace, SQL ou credenciais nas respostas HTTP.
- Antes de concluir: compile/valide o que mudou e registre em `atualizacoes.md`.
