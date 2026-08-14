# Dev Track

Aplicação monolítica Next.js para acompanhar projetos e requisitos pelo fluxo Requisitos → Desenvolvimento → Testes → Concluído.

## Executar localmente

1. Copie `.env.example` para `.env` e informe uma instância PostgreSQL.
2. Execute `npm install`.
3. Execute `npm run db:generate`.
4. Aplique `db/scripts/001_initial_schema.sql` ou crie uma migração Prisma.
5. Execute `npm run dev`.

A interface inicial usa dados demonstrativos para tornar o produto navegável antes da configuração do banco. O modelo relacional e as regras centrais ficam em `prisma/`, `db/scripts/` e `src/server/domain/`.
