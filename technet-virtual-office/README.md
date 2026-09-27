# Technet Central de IA — v2

Escritório isométrico inspirado na referência visual enviada pelo usuário, com arte original. Cinco especialistas, mesas clicáveis, ordens, fila com pausa, atividade, histórico e resultados para copiar/baixar.

## Executar

Requer Node.js 22 ou superior; não há dependências de terceiros.

```sh
npm run dev
# http://localhost:4173
npm test
npm run build
```

`public/` contém o frontend. `worker/index.js` implementa a API, compatível com Cloudflare Workers. `scripts/build.mjs` empacota a aplicação em `dist/server/` para Sites. O projeto publicado continua privado, usando a proteção de acesso da plataforma Sites.

## Conectar a IA

Configure segredos apenas no ambiente do servidor. **Nunca coloque uma chave em `public/`, no navegador ou em um commit.**

| Variável | Valor |
|---|---|
| `AI_PROVIDER` | `groq` ou `openai` |
| `AI_MODEL` | ID de um modelo de chat disponível na conta escolhida |
| `GROQ_API_KEY` | Chave secreta para Groq (se escolhido) |
| `OPENAI_API_KEY` | Chave secreta para OpenAI (se escolhido) |
| `AI_MODEL_ADA`, `AI_MODEL_LUNA`, `AI_MODEL_ATLAS`, `AI_MODEL_DAVI`, `AI_MODEL_MAYA` | Opcional: modelo específico por especialista, do mesmo provedor |

Para desenvolvimento, exporte as variáveis no terminal antes de iniciar `npm run dev`. Na publicação Sites, configure essas variáveis usando os segredos do projeto. Após configurar, clique em **Configurações → Verificar conexão**. Essa verificação confirma a presença da configuração; validade da chave e acesso ao modelo são verificados na primeira execução real.

O botão **Enviar ordem** sugere o especialista por termos do pedido e envia o contexto e a ordem ao provedor. Uma resposta válida produz uma entrega. Erros e falta de conexão ficam explícitos. Pedidos antigos só executam após clicar em **Executar pedido**; nenhuma conexão dispara retroativamente pedidos antigos. A fila executa uma tarefa por vez nesta sessão.

## Limites atuais

- A arte do escritório é um cenário com personagens desenhados; os status, atividades e controles são interativos. Não há circulação de avatares independentes.
- Ordens, resultados e histórico ficam no `localStorage` deste navegador; não há sincronização entre PCs.
- Os agentes geram texto/código. Não acessam automaticamente GitHub, WhatsApp ou outros sistemas da empresa, não alteram arquivos e não executam código gerado.
- Sem credencial/modelo configurados, ordens ficam aguardando conexão. **Ver em ação** é uma demonstração claramente identificada, não uma execução real de IA.
- Pausar bloqueia novas execuções; não interrompe uma requisição já enviada. Fechar a página interrompe o acompanhamento, e o provedor pode ter processado o pedido; repetir pode gerar outra cobrança.
- O servidor de desenvolvimento escuta em `0.0.0.0` para a prévia interna. Para uso exclusivamente local: `npm run dev -- --host 127.0.0.1`. Não exponha esse servidor com uma chave ativa à internet sem autenticação. No Sites, preserve o acesso privado.

## Verificação

`npm test` cobre seleção de agentes, requisições inválidas, origem, limite de corpo, ausência de configuração, resposta de provedor simulada, falhas sem vazamento de diagnóstico e arquivos servidos. A execução contra OpenAI/Groq depende da credencial da conta e não foi realizada nesta entrega.

Arte: imagem original gerada por IA a partir da direção visual do usuário. Sem uso de código ou assets do Habbo.
