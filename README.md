# Dev Track

Dev Track é uma aplicação interna para acompanhar projetos e requisitos de software pelo fluxo:

`Requisitos → Desenvolvimento → Testes → Concluído`

O produto é uma aplicação monolítica em Next.js, com autenticação, autorização contextual, gestão de equipes e projetos, cálculo automático de progresso e histórico auditável.

## Tecnologias

- Next.js 16 e React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Auth.js / NextAuth 5
- React Query
- React Hook Form e Zod
- Prisma 7 com PostgreSQL
- bcrypt para hash de senhas

## Requisitos

- Node.js compatível com Next.js 16
- npm
- PostgreSQL

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e configure:

   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/dev_track"
   AUTH_SECRET="uma-chave-segura-e-aleatoria"
   AUTH_GOOGLE_ID=""
   AUTH_GOOGLE_SECRET=""
   ```

   O provedor Google só aparece na interface quando as duas credenciais estão preenchidas. Configure no Google a callback `/api/auth/callback/google` para o domínio utilizado.

3. Prepare o banco de dados usando [db/scripts/001_initial_schema.sql](db/scripts/001_initial_schema.sql) ou o fluxo de migrações adotado pelo ambiente.

4. Gere o Prisma Client:

   ```bash
   npm run db:generate
   ```

5. Inicie a aplicação:

   ```bash
   npm run dev
   ```

## Primeiro administrador

Toda nova conta começa como `USER` e `PENDING`. Para liberar o primeiro administrador, registre uma conta e faça a promoção diretamente no banco uma única vez:

```sql
UPDATE users
SET system_role = 'ADMIN', status = 'ACTIVE'
WHERE email = 'administrador@empresa.com';
```

Depois disso, esse administrador poderá aprovar, rejeitar, suspender e reativar contas pela tela de usuários.

## Autenticação e autorização

- Credenciais e Google são suportados.
- Senhas são armazenadas somente como hashes bcrypt.
- Contas novas ficam pendentes de aprovação.
- Contas pendentes e suspensas não acessam funcionalidades de negócio.
- Sessões guardam apenas identidade, papel de sistema e situação da conta.
- Situação e papel são relidos do banco durante a resolução da sessão.
- Páginas protegidas e APIs validam a sessão no servidor.
- A visibilidade de projetos é limitada por administração, liderança ou associação à equipe.
- Ser `ADMIN` não concede automaticamente responsabilidade operacional de desenvolvedor, testador ou gestor.

A recuperação automática de senha ainda não está conectada a um provedor de e-mail. A página de ajuda orienta o usuário a procurar um administrador, sem afirmar que uma mensagem inexistente foi enviada.

## Formulários e tratamento de entrada

Todos os formulários da aplicação usam React Hook Form com schemas Zod compartilhados:

- login;
- registro de conta;
- criação de projeto.

Entradas são normalizadas no cliente para feedback imediato e obrigatoriamente processadas novamente no servidor. O tratamento inclui:

- normalização Unicode;
- remoção de caracteres de controle;
- remoção de delimitadores de HTML em texto persistido;
- normalização de espaços e quebras de linha;
- normalização de e-mail;
- listas permitidas para enums;
- validação estrita de identificadores e datas;
- limites de tamanho.

Senhas não são alteradas ou sanitizadas porque qualquer transformação mudaria a credencial fornecida. Elas são apenas validadas e então enviadas pelo canal seguro para verificação ou hash.

## Estrutura principal

```text
src/
├── app/                    # páginas, layouts e Route Handlers
├── components/             # componentes de domínio e shadcn/ui
├── lib/                    # Prisma, validação, sanitização e utilidades
├── server/                 # autorização e regras executadas no servidor
└── generated/prisma/       # Prisma Client gerado
```

## Scripts

```bash
npm run dev             # servidor de desenvolvimento
npm run build           # build de produção
npm run start           # inicia o build de produção
npm run lint            # ESLint
npm run typecheck       # verificação TypeScript
npm run prettier:fix    # formata o repositório
npm run db:generate     # gera o Prisma Client
npm run db:validate     # valida o schema Prisma
npm run db:pull         # introspecta o banco
npm run db:show         # abre o Prisma Studio
```

## Verificação antes de entregar

```bash
npm run prettier:fix
npm run lint
npm run typecheck
npm run db:validate
npm run build
```

Não adicione segredos ao repositório. Em produção, utilize HTTPS, uma chave `AUTH_SECRET` forte e URLs OAuth correspondentes ao domínio publicado.
