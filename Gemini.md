# Diretrizes de Comunicação Gemini

- O usuário prefere se comunicar em português do Brasil.
- Todas as interações devem ser realizadas em português do Brasil.

## Observações sobre o Ambiente de Desenvolvimento

Para executar migrações do Prisma ou outros comandos que dependam de variáveis de ambiente definidas em `.env.local`, é necessário usar `npx dotenv -e .env.local --` antes do comando. Exemplo:
`npx dotenv -e .env.local -- npx prisma migrate dev --name <nome-da-migracao>`

## Tecnologias e Convenções
- O projeto utiliza CSS Modules para estilização de componentes.