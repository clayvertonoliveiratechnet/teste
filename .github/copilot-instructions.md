# TechNET Rotas MDU — instruções para Copilot

Este repositório contém o sistema **TechNET Rotas MDU**, desenvolvido com React 19, Vite 7, Supabase/PostgreSQL e Firebase Hosting.

## Regras obrigatórias
- Antes de alterar código, leia `README.md`, `package.json` e os arquivos diretamente envolvidos.
- Preserve regras de negócio, RLS, autenticação e escopo por cidade.
- Nunca hardcode chaves, tokens, senhas ou credenciais.
- Não altere `main` diretamente. Trabalhe em branch/PR.
- Para mudanças de UI, valide a aplicação executando-a localmente e usando Playwright.
- Compare o comportamento antes/depois e procure regressões fora da área solicitada.
- Não considere uma tarefa concluída apenas porque o build passou.
- Se uma dependência ou variável de ambiente estiver ausente, documente a limitação e use mocks seguros somente para validação local.
- Não remova funcionalidades existentes para simplificar uma correção.

## Comandos principais
- Instalação: `npm ci`
- Desenvolvimento: `npm run dev -- --host 0.0.0.0`
- Build: `npm run build`
- Deploy: `npm run deploy`

## Critérios mínimos de qualidade
Uma alteração só pode ser considerada pronta quando:
1. o build passa;
2. não há erro fatal de runtime no fluxo alterado;
3. o fluxo principal afetado funciona no navegador;
4. não há regressão funcional evidente;
5. a UI permanece legível e coerente em desktop;
6. problemas apontados pelos revisores foram resolvidos ou explicitamente justificados com evidência.

Para tarefas delegadas ao Copilot cloud agent, prefira o custom agent `technet-orchestrator`.
