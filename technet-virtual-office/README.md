# Technet Space

Protótipo navegável de escritório virtual inspirado na experiência de salas e presença do Gather, criado para a Technet. Projeto independente, sem uso de marca, código ou imagens do Gather.

## Rodar localmente

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173`. Também pode ser hospedado em qualquer serviço de arquivos estáticos. Não há etapa de build.

## O que funciona

- Quatro salas (Central de controle, Comercial, Operações e Convivência), mapa interativo e avatar controlado por WASD, setas ou clique.
- Quatro agentes representados no escritório; recomendação de encaminhamento por palavras do pedido.
- Registro de pedidos, painel de atividade e chat por sala, persistidos apenas no `localStorage` deste navegador.
- Layout para desktop e celular.

## Limites desta versão

Os agentes são representações visuais. O pedido é registrado e recebe uma **sugestão local**, mas nenhuma IA externa o executa. O chat é local; ainda não há sincronização entre usuários, autenticação, vídeo, áudio ou comunicação por proximidade. Para uso real da empresa, conectar uma API de execução de agentes e um backend com autenticação, presença e mensagens em tempo real. Nunca colocar chaves de API no JavaScript do navegador.
