# TechNET Rotas MDU

Sistema web para substituir o controle operacional da planilha **Acompanhamento - Construção MDU 2026**.

## Módulos
- Dashboard operacional por cidade, HPs, blocos, construções e alertas.
- Rota diária para Natal, Mossoró, Fortaleza e Recife.
- Consolidação automática na Base Geral quando uma obra é marcada como construída.
- Histórico automático para acesso negado e obstrução.
- Próximas rotas, agenda semanal, metas, ranking e avaliação de equipes.
- Base histórica Geral migrada com 2.531 registros.
- Exportação CSV e trilha básica de auditoria.

## Stack
React + Vite, Firebase Realtime Database e Firebase Hosting.

## Desenvolvimento
```bash
npm install
npm run dev
```

## Build e deploy
```bash
npm run build
firebase deploy
```

## Migração da base Geral
Depois de publicar as regras do Realtime Database:
```bash
python scripts/importar-base.py
```

## Observação de segurança
A primeira versão foi implantada como ambiente interno com regras abertas para permitir uso imediato e migração. Antes de divulgar o endereço fora da equipe, habilite Firebase Authentication e altere as regras para exigir `auth != null`.
