# TECHNET AI HQ

Escritório virtual de agentes de IA com interface espacial inspirada em escritórios virtuais 2D.

## Versão online

https://technet-ai-hq-u88ubv.v2.appdeploy.ai/

## Funcionalidades

- mapa de escritório virtual com salas por departamento;
- avatar do usuário que se move pelo mapa;
- 10 agentes de IA clicáveis;
- painel contextual de cada agente;
- criação e execução de missões multiagente;
- aprovação humana para ações críticas;
- persistência de missões;
- interface responsiva.

## Playwright

O smoke test está em `playwright-smoke.js`.

Requisitos:

```bash
npm install playwright
npx playwright install chromium
node playwright-smoke.js
```

O código publicado usa o runtime AppDeploy para `@appdeploy/client` e `@appdeploy/sdk`.
