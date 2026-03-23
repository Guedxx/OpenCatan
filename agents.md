## Propósito deste arquivo

Este documento orienta agentes, assistentes e contribuidores automatizados sobre como trabalhar neste projeto sem quebrar sua arquitetura e suas decisões centrais.

Este projeto é um jogo acadêmico inspirado em Catan, com arquitetura backend-first, sem game engine, com foco em separação de responsabilidades.

## Resumo do projeto

- Projeto acadêmico
- Inspirado em Catan
- Backend autoritativo
- Frontend majoritariamente renderizador
- Execução principal no navegador
- Monorepo com `apps` e `packages`

## Decisões arquiteturais obrigatórias

Todo agente deve respeitar estas decisões:

1. O backend é a fonte de verdade da partida.
2. O frontend não deve conter regra de negócio crítica.
3. O pacote de domínio deve ser desacoplado de framework, transporte e interface.
4. Toda validação de ação deve ocorrer no backend.
5. O frontend deve consumir snapshots e enviar intenções de ação.
6. O projeto deve permanecer simples e incremental.
7. Evitar dependências e abstrações desnecessárias.

## Estrutura esperada

```txt
apps/
  web/
  server/

packages/
  core/
  protocol/
```

## Responsabilidade de cada módulo

### `apps/web`

Pode conter:

- componentes React
- páginas
- renderização do tabuleiro
- HUD
- conexão com servidor
- estado local de interface
- envio de ações

Não pode conter como fonte de verdade:

- validação autoritativa de jogadas
- regras completas do jogo
- cálculo definitivo de ações possíveis
- estado oficial da partida

### `apps/server`

Pode conter:

- servidor HTTP
- Socket.IO
- gerenciamento de partidas
- controle de conexões
- orquestração de turnos
- aplicação de ações no estado
- snapshots enviados ao cliente

Deve ser o responsável por:

- validar ações
- aplicar regras
- manter o estado autoritativo

### `packages/core`

Pode conter:

- tipos de domínio
- geração de tabuleiro
- regras de construção
- regras de recursos
- regras de turno
- cálculos de pontuação
- transições de estado puras

Não deve conter:

- React
- Express
- Socket.IO
- código de UI
- detalhes de transporte
- dependência desnecessária de framework

### `packages/protocol`

Pode conter:

- tipos compartilhados
- DTOs
- snapshots
- eventos
- ações do cliente
- eventos do servidor

Deve funcionar como contrato estável entre web e server.

## Stack oficial

Utilizar preferencialmente:

- Node.js
- TypeScript
- pnpm workspaces
- Vite
- React
- Express
- Socket.IO
- boardgame.io

## Restrições atuais

Não adicionar sem pedido explícito:

- banco de dados
- autenticação
- Docker
- microserviços
- Redis
- filas
- lobby avançado
- bots
- persistência permanente
- refactors amplos sem necessidade
- UI complexa fora do escopo atual

## Diretrizes para geração de código

Ao gerar código:

- prefira soluções simples
- escreva código legível
- use nomes claros
- preserve separação entre domínio, servidor e cliente
- evite criar abstrações genéricas cedo demais
- evite mover lógica de domínio para a camada de interface
- evite acoplamento entre web e core que passe pelo servidor de forma inadequada
- mantenha tipagem explícita quando ela melhorar clareza

## Diretrizes específicas para frontend

O frontend deve:

- renderizar dados recebidos
- enviar ações do jogador
- destacar seleções possíveis com base no que o servidor informar
- manter apenas estado local de interface

O frontend não deve:

- inventar regra de jogo
- assumir que uma jogada é válida sem confirmação do backend
- duplicar lógica crítica do domínio, salvo para feedback visual não autoritativo

## Diretrizes específicas para backend

O backend deve:

- controlar o ciclo da partida
- validar toda ação recebida
- manter o estado da partida
- produzir snapshots apropriados por jogador
- separar informação pública e privada

Sempre que possível:

- use funções puras do core
- mantenha handlers finos
- concentre regra no domínio

## Diretrizes específicas para o domínio

No core, priorizar:

- funções puras
- dados serializáveis
- transições explícitas de estado
- modelagem clara de tabuleiro
- legibilidade antes de otimização

Modelos importantes esperados futuramente:

- `Tile`
- `Vertex`
- `Edge`
- `Player`
- `Building`
- `Road`
- `GameState`
- `TurnState`
- `MatchState`

## Comunicação cliente-servidor

Modelo preferido:

1. cliente conecta
2. servidor envia snapshot
3. cliente envia ação
4. servidor valida
5. servidor atualiza estado
6. servidor envia novo snapshot

Formato preferido:

- ações nomeadas explicitamente
- eventos de servidor claros
- tipos compartilhados em `packages/protocol`

## Convenções de nomenclatura

Preferências:

- código em inglês
- documentação em português
- eventos em formato semântico, por exemplo:
  - `server:hello`
  - `match:joined`
  - `match:state`
  - `match:error`
  - `player:action`

## Prioridades atuais

Ordem preferida de avanço:

1. scaffold do monorepo
2. conexão web-server
3. pacote protocol
4. pacote core com tipos/stubs
5. modelo inicial do tabuleiro
6. estado inicial da partida
7. primeiras ações do jogo
8. renderização básica do tabuleiro
9. evolução incremental das regras

## O que um agente não deve fazer

Um agente não deve:

- reestruturar o projeto inteiro sem necessidade
- transformar o frontend em fonte de verdade
- espalhar regra de negócio por componentes React
- introduzir infraestrutura que ainda não foi pedida
- trocar stack sem justificativa forte
- adicionar complexidade “por precaução”
- remover a separação entre core, server e web

## Regra final

Ao tomar decisões ambíguas, seguir esta prioridade:

1. preservar backend autoritativo
2. preservar domínio desacoplado
3. manter frontend simples
4. escolher a solução mais simples que funcione
5. deixar o projeto mais fácil de evoluir depois
