# Technet Central de IA — v3

Escritório isométrico com arte original, cinco avatares independentes, animação de caminhada, circulação entre mesas e café, reuniões, ordens, fila e entregas.

## Usar as contas no computador

1. Instale **Node.js 22 ou superior**.
2. Baixe **Configurações → Baixar central para o computador** no site e extraia o ZIP. No GitHub, use a pasta `technet-virtual-office` desta branch.
3. Windows: abra `INICIAR-CENTRAL.cmd`. macOS/Linux/WSL: execute `npm run desktop` e abra **http://127.0.0.1:4173**. Não é necessário `npm install`.
4. Instale a versão nativa dos aplicativos oficiais desejados, faça login no terminal e reinicie a central para atualizar o PATH:

| Conta | Aplicativo | Login | Instalação oficial |
|---|---|---|---|
| ChatGPT | Codex CLI | `codex login` | https://developers.openai.com/codex/cli |
| Claude | Claude Code | `claude auth login` | https://code.claude.com/docs/en/quickstart |
| Google / Antigravity | Antigravity CLI | `agy` (sessão interativa inicial) | https://antigravity.google/docs/cli/install |

5. Em **Configurações**, clique em **Testar e usar**. O teste envia uma mensagem curta e consome uso da conta. Somente uma resposta válida habilita as ordens; encontrar o aplicativo instalado não é considerado conexão. A confirmação dura até reiniciar o servidor. O login e a disponibilidade dependem do plano e da política do provedor.

Esta integração reutiliza a autenticação mantida pelos aplicativos oficiais. Não controla as abas do ChatGPT/Claude, não importa conversas web, não pede senhas e não extrai cookies. No site hospedado, as contas locais não estão acessíveis: utilize a versão local para esse modo. A API do servidor permanece como opção separada.

Aplicativos `.cmd` instalados somente via npm não são executados como shell. Use os executáveis nativos ou instale/rode tudo no WSL. O servidor procura o PATH e os diretórios nativos usuais. Se o aplicativo não for encontrado, adicione seu diretório ao PATH e reinicie.

## Escritório e reuniões

- Os personagens caminham por uma rede de pontos do escritório. Quando recebem uma ordem, retornam à mesa. **Movimento** permite reduzir a animação, respeitando também a preferência do sistema.
- **Reunir equipe** aceita uma pauta e leva os cinco agentes à mesa de reunião.
- Depois da chegada, **Iniciar rodada com IA** realiza seis solicitações sequenciais: uma contribuição por especialista e uma síntese de Atlas. A ata completa é salva em **Minhas tarefas**, para copiar ou baixar.
- **Encerrar reunião** retorna os avatares às mesas. Sem IA conectada, a reunião espacial funciona, mas não produz falas ou decisões fictícias.
- A fila executa um pedido por vez. Pausar impede novos pedidos; não interrompe chamadas iniciadas. Pedidos antigos exigem execução explícita.

## Desenvolvimento e publicação

```sh
npm run dev
npm test
npm run build
```

Sem dependências externas. `public/` contém a interface; `public/world.js` controla rotas e animação; `worker/index.js` contém a API remota; `scripts/local-accounts.mjs` é o adaptador local. O build gera o ZIP local e o Worker em `dist/server/`. O projeto Sites preserva seu acesso privado.

### API hospedada

Configure somente no servidor: `AI_PROVIDER` (`openai` ou `groq`), `AI_MODEL` e `OPENAI_API_KEY` ou `GROQ_API_KEY`. Modelos individuais são opcionais via `AI_MODEL_ATLAS`, `AI_MODEL_ADA`, `AI_MODEL_LUNA`, `AI_MODEL_DAVI`, `AI_MODEL_MAYA`. Nunca coloque chaves em arquivos públicos ou commits. A verificação do servidor confirma configuração presente; a primeira execução valida a credencial com o provedor.

## Comportamento e limites

- Ordens, resultados e histórico ficam no navegador (localStorage), sem sincronização entre dispositivos. A execução precisa da página e do servidor abertos.
- Os agentes entregam texto e código. Não há acesso automático ao GitHub, WhatsApp ou sistemas da empresa, nem execução automática das entregas.
- O adaptador inicia CLIs com argumentos fixos, sem shell, em uma pasta temporária. Codex usa sandbox de leitura; Claude desativa ferramentas internas e MCP; Antigravity usa sandbox e preserva suas permissões nativas. Não são usados parâmetros para ignorar aprovações. As configurações locais dos próprios provedores continuam aplicáveis.
- Há limite de tamanho, prazo e concorrência, validação de origem e Host. O modo desktop escuta apenas loopback. Não exponha esse servidor local à rede/internet.
- Uma falha em reunião mantém as contribuições já recebidas na tela. A ata é registrada como concluída apenas ao finalizar todas as rodadas. Fechar a página pode perder a resposta; uma nova tentativa pode consumir uso novamente.
- **Ver em ação** é uma simulação visual identificada; não altera entregas reais.

## Verificação

14 testes automatizados: API, roteamento, limites, origem, falhas, serialização de CLI, execução sem shell e caminhos de ida/volta da reunião. Interface verificada em navegador. Autenticação e chamadas reais das três contas dependem do computador do usuário e não foram validadas com suas credenciais nesta entrega.

Referências oficiais consultadas em setembro de 2026:
- https://developers.openai.com/codex/noninteractive
- https://code.claude.com/docs/en/cli-reference
- https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
- https://antigravity.google/docs/cli/headless/

Arte original gerada por IA. Sem copiar código, marca ou assets do Habbo.

Correção de circulação: corredores externos às baias, assentos como destinos finais, orientação fixa ao sentar e camadas dos móveis por profundidade. Testes verificam que trajetos não atravessam as superfícies das mesas.
