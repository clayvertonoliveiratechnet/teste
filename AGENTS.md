# TECHNET AI FACTORY

Este repositório usa um fluxo multiagente para mudanças realizadas por IA.

## Fluxo obrigatório
1. Entender o pedido e identificar critérios de aceite.
2. Delegar implementação para `technet-builder`.
3. Após a implementação, executar revisões independentes:
   - `technet-qa`: testes, runtime e Playwright;
   - `technet-reviewer`: código, regressões, arquitetura e segurança;
   - `technet-ux-reviewer`: qualidade visual e experiência do usuário.
4. Consolidar os achados.
5. Se existir blocker, teste quebrado ou regressão, devolver ao Builder com evidências.
6. Repetir até aprovação ou até 6 ciclos.
7. Se duas rodadas seguidas não melhorarem o resultado, exigir mudança de estratégia em vez de repetir a mesma correção.

## Regras de aprovação
Não aprovar quando houver:
- build quebrado;
- erro fatal no navegador;
- regressão funcional;
- blocker de segurança;
- sobreposição visual evidente ou fluxo inutilizável;
- critério de aceite não atendido.

## Evidência
Toda conclusão deve se apoiar em testes, diff, logs, screenshots ou comportamento reproduzível.
Evite afirmações como "corrigido" sem validação objetiva.

## Segurança
Nunca exponha segredos. Não grave credenciais em código, logs, screenshots ou commits.
