# Scripts do banco

Execute os scripts numerados em ordem:

1. `001_initial_schema.sql`: cria o esquema inicial da aplicação.
2. `002_security_rate_limits.sql`: adiciona o armazenamento persistente usado para limitar tentativas de autenticação e OTP.

`001_initial_schema.sql` cria o modelo PostgreSQL completo do MVP. Execute-o em um banco vazio com uma ferramenta compatível com PostgreSQL, por exemplo `psql`.

O script inclui enums, entidades do Auth.js, equipes, projetos, requisitos, ciclos de desenvolvimento/teste, históricos imutáveis, índices, uma view de progresso/gestor e uma proteção no banco contra atribuir projetos a equipes sem liderança ativa.

Para evolução cotidiana, use o modelo equivalente em `prisma/schema.prisma` e gere migrações Prisma. Não há `manager_id` nem `progress` em `projects`: ambos são derivados, conforme as regras do produto.
