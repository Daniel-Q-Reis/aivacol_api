Plataforma de Gestão de Frota · Aivacol (Dev backend senior)
🎯 Objetivo: Construir um backend pronto para produção, seguindo arquitetura limpa de forma estrita (PRINCIPAL E INVIOLAVEL -> irretratável e irrevogável)
Construir o backend do módulo de Gestão de Frota garantindo:
Arquitetura limpa
Segurança robusta
Testes automatizados
Escalabilidade
Padronização da modelagem

🛠️ Tecnologias Obrigatórias (devemos definir a melhor arquitetura para tornar os objetivos acima alcançados e de fácil manutenibilidade)
Tecnologia Versão mínima
Node.js 18+
NestJS 10+ (preferencial)
TypeORM —
SQL Server —
JWT —
Jest —
Redis Cache obrigatório


📊 Modelagem de Dados
Tabelas obrigatórias
Tabela models
Campo Descrição
id Identificador do modelo
name Nome do modelo
created_at Data de criação
updated_at Data de atualização
created_by Usuário responsável
Tabela vehicles
Campo Descrição
id Identificador
license_plate Placa
chassis Chassi
renavam Renavam
year Ano
model_id FK para models
created_at Criado em
updated_at Atualizado em
created_by Responsável

Tabelas adicionais (Obrigatório)
Implementar brands e users com seus relacionamentos, demonstrar domínio completo
do domínio.

Tabela brands 
Campo Descrição
id Identificador da marca
name Nome da marca
created_at Data de criação
updated_at Data de atualização
created_by Usuário responsável

Tabela users
Campo Descrição
id Identificador
nickname Nome curto
name Nome completo
email Email

📌 Requisitos Funcionais
Gestão de Model ( models ) — obrigatório
Criar, atualizar, consultar, remover
Gestão de Vehicle ( vehicles ) — obrigatório
Registrar
Atualizar
Listar / consultar
Remover

Gestão de Brand ( brands ) (obrigatório)
Criar, atualizar, consultar, remover
Associar models a uma brand

Segurança
Autenticação JWT obrigatória
Todas as rotas devem ser protegidas
Usuário padrão para seed: aivacol

Documentação Interativa (Obrigatório)Implementar Swagger / OpenAPI exposto na rota /api/docs.
Todos os endpoints devem conter decorators do Swagger documentando os contratos de entrada (@ApiBody), parâmetros, respostas de sucesso (200/201) e principais erros (400, 401, 404).
Disponibilizar um arquivo JSON com a Coleção do Postman atualizada na raiz do projeto.

Metadados obrigatórios em todas as entidades
created_at
updated_at
created_by
⚡ Cache com Redis (obrigatório)
Cache aplicado nas consultas de veículos
Expiração configurável via variável de ambiente
Invalidação automática ao criar, atualizar ou remover um veículo

Observabilidade e Telemetria (Obrigatório)
Logs Estruturados: Utilizar o NestJS Logger integrado.
Correlation IDs
Rastreabilidade de Requisições: Implementar um Interceptor global ou Middleware para capturar e registrar no console cada requisição HTTP contendo: Método, Rota, ID do Usuário autenticado (se houver), Tempo total de execução (em ms) e o Status Code final da resposta.
Tratamento Global de Erros: Implementar um ExceptionFilter customizado capturando HttpException para garantir que qualquer falha na API retorne uma resposta padronizada (contendo timestamp, path e mensagem limpa), além de logar o stack-trace interno no console do Docker

🧪 Testes (obrigatórios)
Cobertura mínima exigida: 90%
Regras de negócio
Serviços
Validações
Integrações mínimas
Ferramenta: Jest
Benchmark de Performance (Diferencial Sênior): Criar um script automatizado simples utilizando Autocannon ou k6 para rodar um teste de carga rápido nos endpoints de listagem de veículos. O objetivo é evidenciar a eficiência do Redis Cache em comparação com as batidas diretas no banco de dados SQL Server (pp. 1, 3). O comando para rodar o benchmark deve estar documentado no README.

implementações finais obrigatórias
Mensageria obrigatória utilizando RabbitMQ para disparar eventos de criação/atualização de veículos, e Auditoria obrigatória salvando os logs no MongoDB.

Auditoria
Registrar todas as interações do serviço em banco não relacional (MongoDB)
Docker
Dockerfile multistage
Docker Compose completo (app + SQL Server + Redis + RabbitMQ + MongoDB).

🏆 Critérios de Avaliação
Gerais
Clareza do código
Redundância e eficiência
Organização do projeto e estrutura de pastas
Boas práticas
Aderência ao problema
Qualidade do README
Específicos Backend
Arquitetura e modularização
Uso correto do TypeORM
Migrations bem definidas
Segurança com JWT
Implementação do Redis Cache
Testes Jest cobrindo corretamente
Qualidade das regras de negócio
Tratamento de erros e exceções
Boas práticas REST

📦 Entrega
Repositório no GitHub
Mock seed_vehicles.json incluído no repositório
README com instruções claras
# CHECKLIST DO DESAFIO

O README deve possuir obrigatoriamente uma seção denominada:

## ✅ Checklist do Desafio

Apresentada em formato de tabela.

Essa tabela deverá conter:

- requisito solicitado
- status
- observações

Exemplo:

| Critério | Status | Observação |
|----------|--------|------------|
| CRUD obrigatório | ✅ | Escopo do desafio |
| JWT | ✅ | Escopo do desafio |
| Redis | ✅ | Escopo do desafio |
| Testes | ✅ | Cobertura superior à exigida |
| Docker | ✅ | Compose completo |
| Swagger | ✅ | Extra para facilitar avaliação |
| Postman | ✅ | Extra |
| Benchmark | ✅ | Extra |
| Health Checks | ✅ | Extra |
| Observabilidade | ✅ | Extra |

Caso algum requisito não tenha sido implementado, ele deverá permanecer listado com o status adequado e uma justificativa técnica.
# DIFERENCIAIS DE ENGENHARIA

O README deverá possuir uma terceira seção denominada:

## 🚀 Diferenciais de Engenharia

Explicando brevemente decisões que demonstram maturidade técnica.

Exemplos:

- Por que determinada arquitetura foi escolhida.
- Por que determinadas tecnologias NÃO foram utilizadas.
- Como o projeto pode evoluir futuramente.
- Quais trade-offs foram considerados.
- Quais decisões priorizaram simplicidade.
- Quais decisões priorizaram escalabilidade.
- Como a observabilidade foi planejada.
- Como a segurança foi tratada.
- Como foi pensado o onboarding de novos desenvolvedores.

Essa seção deve mostrar o raciocínio de engenharia por trás do projeto, e não apenas listar tecnologias. (PODEMOS CRIAR ATÉ 3 ADRs em diretorio /docs)


Nunca omitir itens do desafio.
Scripts de execução (MUITO IMPORTANTE DE SER IMPLEMENTADO, UX DO EXAMINADOR)
Testes obrigatórios presentes e passando (Coverage acima de 90% unitários + e2e)

Passos finais CRITICOS:
### 🎯 Diretrizes Arquiteturais e Isolamento de Escopo (CRÍTICO)

*   **Princípio de Inversão de Dependência (DIP):** O core do negócio (Casos de Uso/Services) deve ser totalmente agnóstico a ferramentas. Camadas de banco de dados (TypeORM), Cache (Redis), Mensageria (RabbitMQ) e Auditoria (MongoDB) não podem vazar para o domínio. Crie interfaces/portas limpas no domínio (ex: `IVehicleRepository`, `ICacheService`, `IEventPublisher`, `IAuditLogger`) e implemente-as estritamente na camada de infraestrutura.
*   **Desacoplamento de Componentes Bônus:** As implementações de Mensageria e Auditoria devem funcionar de forma totalmente assíncrona e resiliente. Utilize o padrão Observer / Eventos do NestJS (`EventEmitter`). Se o RabbitMQ ou o MongoDB caírem, as operações principais de CRUD de veículos no SQL Server não podem ser interrompidas.
*   **Estratégia de Testes:** Garantir a cobertura mínima exigida focando 90% em testes unitários dos Casos de Uso/Services. Para testes E2E, focar nos caminhos felizes e principais falhas das rotas HTTP, mockando serviços externos pesados se necessário para evitar testes frágeis (*flaky tests*).
*   **Postura de Entrega:** Agir com o rigor técnico de um engenheiro Sênior na qualidade do código, mas manter no README o escopo original alinhado com a vaga do desafio, justificando as adições como padrões de excelência de produção.
*   **Integração Contínua (CI - Diferencial Automático):** Criar um arquivo de workflow do GitHub Actions (`.github/workflows/ci.yml`) configurado para ser engatilhado em *Push* e *Pull Requests* na branch `main`. O pipeline deve conter passos simples, rápidos e focados: fazer o checkout do código, instalar as dependências do Node.js, rodar o linter e executar a suíte de testes unitários (`npm run test`). Não é necessário pipeline de Deploy (CD), o foco exclusivo do CI deve ser a garantia de qualidade (QA) do código entregue.

Em caso de conflito entre duas instruções, prevalece a seguinte ordem de prioridade:

Arquitetura limpa
Correção funcional
Testes automatizados
Segurança
Escalabilidade
Observabilidade
Performance
Documentação


O projeto será desenvolvido em:

Sistema Operacional:
Windows 11

Shell:
PowerShell 7.5 ou superior
(ambiente validado utilizando PowerShell 7.6.3)

Editor:
Visual Studio Code

Containerização:
Docker Desktop

Todos os comandos fornecidos devem ser compatíveis com PowerShell.

Nunca utilizar comandos exclusivos de Bash, salvo quando executados dentro de containers Docker.

Sempre privilegiar comandos multiplataforma.

Todo o desenvolvimento deve ocorrer através de Docker Compose.

Nada deverá depender de instalação local além de:

- Docker Desktop (já instalado)
- Git (já instalado, com GH para criar PRs direto em commando e ja configurado com as credenciais globais)
- PowerShell (já instalado)
- Visual Studio Code (já instalado)


O objetivo desse markdown é exclusivamente a fabricação de todo o implementation_plan.md seguido do task.md (o qual deve ser bastante glanular para a IA seguir cada passo de forma correta e ir marcando os ticks do que foi alcançado a cada etapa, dessa forma cobrindo todo o projeto) adicionalmente o projeto deve conter lint
lint:fix e typecheck em suas dependencias do docker, mantendo assim consistencia e evitando erros inesperados...
Por fim colocar uma regra inviolavel extra no implementation_plan.md e task.md (a criação de um arquivo struct.md pelas IAs executoras, o objetivo desse arquivo é ao final de cada ciclo rodar um git status (sempre que haver um created adicionar aquele diretorio nesse arquivo e com a explicação do que ele faz, dessa forma as ias evitam escrever arquivos duplicados e também nao precisam ficar imaginando o que ja existe, será um arquivo da verdade e de contexto para as ias acompanharem o projeto))
e por fim o MASTER.md o qual deve conter:
Contém:

visão geral
objetivos
arquitetura
regras
convenções
tecnologias
decisões
ordem de prioridade
restrições

Nenhum codigo deverá ser criado ou excecutado nesse momento, criar protocolo de inicio de sessao nesses mds
**PROTOCOLO DE INÍCIO DE SESSÃO (OBRIGATÓRIO)**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execute NESTA ORDEM antes de qualquer outra ação: (para ser passado para as IAs excecutoras, insterir isso no MASTER.md, implementation_plan e tb task.md)

Leia os arquivos abaixo na ordem:

MASTER.md

implementation_plan.md

task.md

struct.md

ACHIEVEMENTS.md (o que exatamente foi implementado naquele bloco/fase)

git status

git log --oneline -5
