# Relatorio de Testes - OpenCatan

Atualizado em: 07/06/2026

Este documento consolida os testes realizados no projeto OpenCatan, separando os resultados por tipo de teste. Todos os testes listados abaixo foram executados e considerados aprovados.

## Resumo Geral

| Grupo | Resultado | Status |
|---|---|---|
| Testes backend | `78 passed, 3 warnings` | Aprovado |
| Cobertura backend | `TOTAL 82%` | Aprovado |
| Frontend typecheck | `tsc --noEmit` sem erros | Aprovado |
| Frontend build | Vite build concluido com sucesso | Aprovado |
| Testes frontend Vitest | `7 passed (7)`, `32 passed (32)` | Aprovado |
| Testes E2E Playwright | `3 passed (21.0s)` | Aprovado |
| Aceitacao manual | Fluxo principal aprovado | Aprovado |
| Usabilidade/acessibilidade | Falhas corrigidas e reavaliadas | Aprovado |
| Portabilidade | Ambientes testados e aceitos | Aprovado |

Observacoes:

- Os avisos do backend sao warnings de depreciacao, nao falhas.
- O build do frontend apresentou warning de chunk maior que `500 kB`, mas concluiu com sucesso.
- A cobertura `82%` considera o total reportado pelo comando de coverage.

## 1. Testes de Unidade

Os testes de unidade validaram regras e funcoes isoladas do backend e do frontend.

### 1.1 Backend

Comandos executados:

```bash
cd /Users/pedrovrgss/faculdade/es2/OpenCatan/back
source .venv/bin/activate
pytest catan/tests/test_api_endpoints.py::test_create_game_and_fetch_state
pytest catan/tests
```

Retornos obtidos:

```text
1 passed, 3 warnings
78 passed, 3 warnings
```

Arquivos de teste executados:

- `back/catan/tests/test_api_endpoints.py`
- `back/catan/tests/test_board_topology.py`
- `back/catan/tests/test_development_card_api_actions.py`
- `back/catan/tests/test_game_flow.py`
- `back/catan/tests/test_lobby.py`
- `back/catan/tests/test_lobby_endpoints.py`
- `back/catan/tests/test_longest_road.py`
- `back/catan/tests/test_resource_production.py`
- `back/catan/tests/test_road_rules.py`
- `back/catan/tests/test_settlement_rules.py`

Principais comportamentos validados:

- Criacao de jogo e consulta de estado.
- Topologia padrao do tabuleiro.
- Regras de estrada.
- Regras de assentamento e cidade.
- Producao de recursos.
- Bloqueio de producao pelo ladrao.
- Fluxo de setup e transicao para fase principal.
- Rolagem de dados.
- Descarte quando sai 7.
- Cartas de desenvolvimento.
- Maior estrada.
- Lobby e sala multiplayer.
- Saida e retorno de jogadores.

Status: aprovado.

### 1.2 Cobertura do Backend

Comando executado:

```bash
pytest catan/tests --cov=catan --cov-report=term-missing --cov-report=html
```

Retorno obtido:

```text
78 passed, 3 warnings
TOTAL 82%
Coverage HTML written to dir htmlcov
```

Artefato gerado:

- `back/htmlcov/index.html`

Status: aprovado.

### 1.3 Frontend - Testes Unitarios com Vitest

Comando executado:

```bash
cd /Users/pedrovrgss/faculdade/es2/OpenCatan/front
npm run test
```

Retorno obtido:

```text
Test Files  7 passed (7)
Tests       32 passed (32)
```

Arquivos implementados:

- `front/src/state.test.ts`
- `front/src/three/board/positions.test.ts`
- `front/src/ui/commands.test.ts`
- `front/src/three/input/clickRouter.test.ts`
- `front/src/net/api.test.ts`
- `front/src/net/lobbyApi.test.ts`
- `front/src/net/ws.test.ts`

Principais comportamentos validados:

- Atualizacao do estado global do frontend.
- Identificacao de fase de setup.
- Identificacao de turno atual.
- Acoes legais disponiveis.
- Calculo de posicoes de tiles, vertices e arestas.
- Comandos de UI como rolar dado, comprar carta, troca com banco e fim de turno.
- Roteamento de cliques no tabuleiro para comandos da API.
- Fluxo de carta `road_building`.

Status: aprovado.

### 1.4 Frontend - Typecheck e Build

Comandos executados:

```bash
npm run typecheck
npm run build
```

Retornos obtidos:

```text
tsc --noEmit
vite build
built successfully
```

Observacao:

- O Vite exibiu warning de chunk maior que `500 kB`.
- O warning nao impediu o build e nao foi considerado falha.

Status: aprovado.

## 2. Testes de Integracao

Os testes de integracao validaram a comunicacao entre modulos do backend e o contrato entre frontend e backend.

### 2.1 Integracao Backend

Comando executado:

```bash
pytest catan/tests
```

Retorno obtido:

```text
78 passed, 3 warnings
```

Fluxos integrados validados:

- API HTTP de jogos.
- Comandos enviados para o backend.
- Snapshot via WebSocket.
- Broadcast de atualizacao de estado.
- Lobby multiplayer.
- Entrada e saida de sala.
- Ready de jogador convidado.
- Inicio de partida pelo host.
- Retorno de jogadores ao lobby.
- Rejeicoes esperadas de regras e de lobby.

Arquivos principais:

- `back/catan/tests/test_api_endpoints.py`
- `back/catan/tests/test_lobby.py`
- `back/catan/tests/test_lobby_endpoints.py`
- `back/catan/tests/test_development_card_api_actions.py`

Status: aprovado.

### 2.2 Contrato Front-Back

Comando executado:

```bash
npm run test
```

Retorno obtido:

```text
Test Files  7 passed (7)
Tests       32 passed (32)
```

Arquivos de contrato:

- `front/src/net/api.test.ts`
- `front/src/net/lobbyApi.test.ts`
- `front/src/net/ws.test.ts`

Comportamentos validados:

- `apiCreateGame` envia `POST /games` com `players`.
- `apiGetState` envia `player_token` quando existe.
- `apiGetState` omite `player_token` quando nao existe.
- `apiCommand` envia `player_token`, `command`, `payload`, `expected_version` e `request_id`.
- Rejeicao por `Version mismatch` atualiza o estado.
- Erro `401` exibe mensagem de token invalido.
- Erro `404` exibe mensagem de jogo inexistente.
- Erro de rede exibe mensagem apropriada.
- `apiReturnToLobby` envia token de jogo corretamente.
- API de lobby envia payloads corretos para criar sala, entrar, trocar cor, marcar pronto, sair e iniciar jogo.
- WebSocket conecta no endpoint esperado, pede snapshot, aplica snapshot e faz refetch apos `game_state_updated`.

Status: aprovado.

## 3. Testes de Sistema e Aceitacao

Os testes de sistema e aceitacao validaram o comportamento do OpenCatan em uso real ou proximo do real, envolvendo frontend, backend, navegador e usuarios.

### 3.1 Testes E2E com Playwright

Pre-condicao:

- Backend rodando em `http://localhost:8000`.
- Frontend iniciado/reutilizado pelo Playwright em `http://localhost:5173`.

Comando executado:

```bash
cd /Users/pedrovrgss/faculdade/es2/OpenCatan/front
npm run e2e
```

Retorno obtido:

```text
Running 3 tests using 1 worker

✓ 1 [chromium] main menu loads
✓ 2 [chromium] multiplayer lobby can create, join, ready and start a game
✓ 3 [chromium] joining an unknown room shows the backend rejection

3 passed (21.0s)
```

Cenarios validados:

- Menu principal carrega.
- Fluxo multiplayer cria sala.
- Segundo jogador entra na sala.
- Jogador convidado marca `Ready`.
- Host inicia a partida.
- Canvas/tabuleiro aparece apos inicio do jogo.
- Tentativa de entrar em sala inexistente mostra rejeicao do backend.

Arquivos:

- `front/playwright.config.ts`
- `front/e2e/opencatan.e2e.spec.ts`

Status: aprovado.

### 3.2 Aceitacao Manual

Resultado informado apos execucao manual:

| Item avaliado | Resultado |
|---|---|
| Abrir o jogo | Aprovado |
| Criar uma sala | Aprovado |
| Entrar na sala com outro jogador | Aprovado |
| Marcar Ready | Aprovado |
| Iniciar partida | Aprovado |
| Entender de quem e a vez | Aprovado |
| Fazer o setup inicial | Aprovado |
| Rolar dados | Aprovado |
| Construir estrada ou assentamento | Aprovado |
| Tentar uma acao invalida e entender a mensagem | Aprovado |
| Confirmar que o jogo parece jogavel sem ajuda tecnica | Aprovado |

Status: aprovado.

### 3.3 Usabilidade e Acessibilidade

As falhas identificadas inicialmente foram corrigidas e os criterios foram reavaliados como positivos.

| Criterio | Resultado final |
|---|---|
| Botoes principais sao faceis de achar | Aprovado |
| Textos sao compreensiveis | Aprovado |
| Da para entender de quem e a vez | Aprovado |
| Mensagens de erro explicam o problema | Aprovado |
| Dialogos podem ser fechados | Aprovado |
| Tela funciona em tamanho menor | Aprovado |
| Informacoes importantes nao dependem apenas de cor | Aprovado |
| Menu funciona minimamente com teclado | Aprovado |
| Contraste esta aceitavel | Aprovado |

Status: aprovado.

### 3.4 Portabilidade

Todos os testes de portabilidade foram realizados e aceitos.

| Ambiente | Validacoes realizadas | Resultado |
|---|---|---|
| Chrome | Tela inicial, lobby, inicio de partida e tabuleiro | Aprovado |
| Safari | Tela inicial, lobby, inicio de partida e tabuleiro | Aprovado |
| Firefox | Tela inicial, lobby, inicio de partida e tabuleiro | Aprovado |
| Tela menor/notebook | Interface responsiva e fluxo principal | Aprovado |
| Outro dispositivo na mesma rede | Acesso por endereco LAN e fluxo principal | Aprovado |

Status: aprovado.

## 4. Artefatos Gerados

| Artefato | Caminho |
|---|---|
| Relatorio DOCX final | `docs/relatorio_testes.docx` |
| Relatorio automatico dos testes backend | `back/test-reports/resultado-testes.docx` |
| Relatorio automatico em Markdown | `back/test-reports/resultado-testes.md` |
| Relatorio HTML de cobertura | `back/htmlcov/index.html` |
| Relatorio HTML do Playwright | `front/playwright-report/` |
| Evidencias Playwright | `front/test-results/` |

## 5. Conclusao

Os testes realizados demonstram que o OpenCatan passou nos principais criterios de verificacao e validacao definidos para o trabalho:

- As regras principais do backend foram verificadas por testes automatizados.
- O frontend passou em testes unitarios, typecheck e build.
- O contrato front-back foi validado com testes automatizados.
- O fluxo inicial do sistema foi validado por E2E com Playwright.
- A aceitacao manual confirmou a jogabilidade basica.
- Os pontos de usabilidade e acessibilidade foram corrigidos e aprovados.
- A portabilidade foi avaliada e aprovada nos ambientes testados.

Status geral: aprovado.
