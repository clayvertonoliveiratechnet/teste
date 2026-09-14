# TechNET Rotas MDU

Sistema web para substituir o controle operacional da planilha **Acompanhamento - Construção MDU 2026**.

## Produção
- Firebase Hosting: https://technet-rotas-mdu-2026.web.app
- Banco e autenticação: Supabase/PostgreSQL
- Controle de acesso: RLS por papel e cidade

## Módulos
- Dashboard operacional por cidade, HPs, blocos, construções e alertas.
- Rota diária para Natal, Mossoró, Fortaleza e Recife.
- Consolidação automática na Base Geral quando uma obra é marcada como construída.
- Histórico automático para acesso negado e obstrução.
- Próximas rotas, metas, ranking e avaliação de equipes.
- Base histórica Geral migrada da planilha.
- Exportação CSV e trilha de auditoria.

## Stack
React 19 + Vite 7 + Supabase + Firebase Hosting.

## Desenvolvimento
```bash
npm install
npm run dev
```

## Build e deploy
```bash
npm run build
firebase deploy --only hosting --project technet-rotas-mdu-2026
```

## Migração da planilha
O script `scripts/gerar_migracao_sql.py` lê a exportação XLSX da planilha e gera `migracao_rotas.sql`.
O SQL de carga contém dados operacionais e não deve ser versionado.

```bash
python scripts/gerar_migracao_sql.py
npx supabase db query --linked --file migracao_rotas.sql
```

## Segurança
O front-end usa somente a chave publicável do Supabase. As tabelas `route_*` possuem RLS; ADMIN e GERENTE acessam todas as cidades, CONTROLADOR altera apenas a própria cidade e os demais perfis têm leitura da cidade vinculada.
