# TECHNET AI Factory no GitHub

Este repositório está preparado para um fluxo de desenvolvimento multiagente usando o GitHub Copilot cloud agent.

## Como usar
### Pela aba Agents
1. Abra a aba de agentes do GitHub.
2. Selecione este repositório.
3. Escolha o custom agent `technet-orchestrator`.
4. Envie a tarefa com objetivo e critérios de aceite.
5. O agente trabalha em branch própria e pode abrir um pull request.

### Por Issue
1. Crie uma issue usando o template **TECHNET AI Task**.
2. Preencha objetivo, critérios de aceite e referências.
3. Atribua a issue ao Copilot.
4. Na atribuição, selecione `technet-orchestrator` como custom agent.
5. O Copilot inicia o trabalho e cria um PR.

## O que acontece internamente
O Orchestrator delega implementação ao Builder. Depois chama QA, Reviewer e UX Reviewer de forma independente. Se houver reprovação, o Builder recebe os defeitos e uma nova rodada começa.

O ciclo termina somente quando os quality gates passam ou quando o limite de iterações é atingido.

## Quality Gate automático
Todo PR para `main` executa `.github/workflows/ai-quality-gate.yml`, que:
- instala dependências;
- executa o build;
- sobe a aplicação localmente;
- executa um smoke test com Playwright;
- salva screenshot, trace e logs como artefatos.

## Segurança
O fluxo não precisa armazenar chave de modelo neste repositório quando executado pelo Copilot cloud agent. Segredos da aplicação não devem ser adicionados ao Git. Para testes que exijam serviços privados, use Agents secrets/variables ou mocks seguros.

## Estrutura
- `.github/agents/technet-orchestrator.agent.md`: coordenação e decisão;
- `.github/agents/technet-builder.agent.md`: implementação;
- `.github/agents/technet-reviewer.agent.md`: revisão técnica;
- `.github/agents/technet-qa.agent.md`: testes e navegador;
- `.github/agents/technet-ux-reviewer.agent.md`: revisão visual;
- `AGENTS.md`: protocolo obrigatório;
- `.github/copilot-instructions.md`: contexto do projeto;
- `.github/qa/`: smoke tests;
- `.github/workflows/ai-quality-gate.yml`: CI.

O Copilot cloud agent precisa estar habilitado para a conta/repositório para executar tarefas no GitHub.
