import type { Language } from "./ui/menu/settings.types";

const LANGUAGE_KEY = "opencatan.language";

const PT: Record<string, string> = {
  "Singleplayer": "Um jogador",
  "Multiplayer": "Multijogador",
  "Settings": "Configuracoes",
  "Mock Game": "Jogo teste",
  "Your name": "Seu nome",
  "AI Opponents": "Oponentes IA",
  "Back": "Voltar",
  "Start Game": "Iniciar jogo",
  "Create Room": "Criar sala",
  "Join Room": "Entrar na sala",
  "Your Name": "Seu nome",
  "Your Color": "Sua cor",
  "Red": "Vermelho",
  "Blue": "Azul",
  "White": "Branco",
  "Orange": "Laranja",
  "Room Lobby": "Lobby da sala",
  "Room Code": "Codigo da sala",
  "Copy": "Copiar",
  "Copy to clipboard": "Copiar para a area de transferencia",
  "Leave Room": "Sair da sala",
  "Share the room code with friends to let them join": "Compartilhe o codigo da sala com amigos para eles entrarem",
  "e.g. ABCDEF": "ex. ABCDEF",
  "Waiting for host to start the game...": "Aguardando o anfitriao iniciar o jogo...",
  "Ready": "Pronto",
  "Graphics Preset": "Preset grafico",
  "Low": "Baixo",
  "Medium": "Medio",
  "High": "Alto",
  "Shadow Quality": "Qualidade das sombras",
  "High (2048)": "Alta (2048)",
  "Medium (1024)": "Media (1024)",
  "Low (512)": "Baixa (512)",
  "Off": "Desligado",
  "Ocean animation": "Animacao do oceano",
  "Flora & fauna animation": "Animacao de flora e fauna",
  "Show FPS counter": "Mostrar contador de FPS",
  "Language": "Idioma",
  "English": "Ingles",
  "Portuguese": "Portugues",
  "Reset Defaults": "Restaurar padroes",
  "Match Lobby": "Lobby da partida",
  "View who is still in the match and manage your presence.": "Veja quem ainda esta na partida e gerencie sua presenca.",
  "Back to Game": "Voltar ao jogo",
  "Rejoin Match": "Reentrar na partida",
  "Leave Match": "Sair da partida",
  "Game Over": "Fim de jogo",
  "Main Menu": "Menu principal",
  "Return To Lobby": "Voltar ao lobby",
  "Discard Resources": "Descartar recursos",
  "Confirm Discard": "Confirmar descarte",
  "Steal From": "Roubar de",
  "Escolha um jogador para roubar.": "Escolha um jogador para roubar.",
  "Skip (no steal)": "Pular (nao roubar)",
  "Waiting For Discard": "Aguardando descarte",
  "Match Info": "Info da partida",
  "Game Overview": "Visao geral",
  "Close": "Fechar",
  "Reference": "Referencia",
  "Build Costs": "Custos de construcao",
  "Check each cost and what your hand is missing.": "Confira cada custo e o que falta na sua mao.",
  "Beginner Help": "Ajuda para iniciantes",
  "Basic Rules": "Regras basicas",
  "Quick reminders for learning the match flow.": "Lembretes rapidos para aprender o fluxo da partida.",
  "Trade Table": "Mesa de troca",
  "Player Trade": "Troca entre jogadores",
  "Return to lobby": "Voltar ao lobby",
  "Build costs": "Custos de construcao",
  "Toggle FPS (F)": "Alternar FPS (F)",
  "Waiting for game state...": "Aguardando estado do jogo...",
  "Play": "Jogar",
  "Cards bought this turn cannot be played": "Cartas compradas neste turno nao podem ser jogadas",
  "Points": "Pontos",
  "Roll": "Rolagem",
  "Roll Dice": "Rolar dados",
  "Dev Card": "Carta dev.",
  "Bank Trade": "Troca banco",
  "Offer Trade": "Oferecer troca",
  "End Turn": "Encerrar turno",
  "Click a vertex to place settlement": "Clique em um vertice para colocar uma casa",
  "Click an edge to place road": "Clique em uma aresta para colocar uma estrada",
  "Choose a tile to move the robber": "Escolha um terreno para mover o ladrao",
  "Choose a tile to play the knight": "Escolha um terreno para jogar o cavaleiro",
  "Click road edge": "Clique na estrada",
  "of 2": "de 2",
  "wins!": "venceu!",
  "Choose two road edges": "Escolha duas arestas de estrada",
  "Development cards are not playable right now": "Cartas de desenvolvimento nao podem ser jogadas agora",
  "Choose a tile for the knight": "Escolha um terreno para o cavaleiro",
  "Bank trade not available right now": "Troca com o banco nao esta disponivel agora",
  "Emotes not implemented yet": "Emotes ainda nao foram implementados",
  "(you)": "(voce)",
  "(host)": "(anfitriao)",
  "READY": "PRONTO",
  "ACTIVE": "ATIVO",
  "LEFT": "SAIU",
  "not ready": "nao pronto",
  "Waiting for player...": "Aguardando jogador...",
  "Unready": "Nao pronto",
  "Waiting for at least one more player (and everyone ready)": "Aguardando pelo menos mais um jogador e todos ficarem prontos",
  "Your color": "Sua cor",
  "You left the match": "Voce saiu da partida",
  "You rejoined the match": "Voce voltou para a partida",
  "Player": "Jogador",
  "Bank": "Banco",
  "Create Offer": "Criar oferta",
  "Choose what you give, what you want back, and who should receive the proposal.": "Escolha o que voce oferece, o que quer receber e quem deve receber a proposta.",
  "Target Player": "Jogador alvo",
  "Preview": "Previa",
  "for": "por",
  "You Give": "Voce oferece",
  "You Receive": "Voce recebe",
  "Resource": "Recurso",
  "Quantity": "Quantidade",
  "Only one player trade can stay pending at a time.": "Apenas uma troca entre jogadores pode ficar pendente por vez.",
  "Send Offer": "Enviar oferta",
  "Trade With Bank": "Trocar com o banco",
  "Choose what to spend and what to receive from the bank. The required amount updates with your ports.": "Escolha o que gastar e o que receber do banco. A quantidade exigida muda conforme seus portos.",
  "Required": "Necessario",
  "The backend still validates the final bank trade.": "O servidor ainda valida a troca final com o banco.",
  "Refuse": "Recusar",
  "Accept": "Aceitar",
  "Cancel Offer": "Cancelar oferta",
  "Offer ID:": "ID da oferta:",
  "Proposer gives": "Proponente oferece",
  "Proposer receives": "Proponente recebe",
  "New trade proposals stay locked until this one is resolved.": "Novas propostas ficam bloqueadas ate esta ser resolvida.",
  "Waiting for answer": "Aguardando resposta",
  "Pending response": "Resposta pendente",
  "You offer": "Voce oferece",
  "You want": "Voce quer",
  "Minimize": "Minimizar",
  "Trade result": "Resultado da troca",
  "You offered": "Voce ofereceu",
  "You requested": "Voce pediu",
  "OK": "OK",
  "Trade unavailable": "Troca indisponivel",
  "You can open this panel anytime, but player trading is only available when the server says it is legal.": "Voce pode abrir este painel a qualquer momento, mas trocas entre jogadores so ficam disponiveis quando o servidor permitir.",
  "The player answered your proposal.": "O jogador respondeu sua proposta.",
  "Your proposal is waiting for the other player's decision.": "Sua proposta esta aguardando a decisao do outro jogador.",
  "A player sent you a proposal.": "Um jogador enviou uma proposta.",
  "Your current proposal is waiting for an answer.": "Sua proposta atual esta aguardando resposta.",
  "Exchange resources directly with the bank.": "Troque recursos diretamente com o banco.",
  "Set up a direct resource exchange with another player.": "Configure uma troca direta de recursos com outro jogador.",
  "No direct trade can be created right now.": "Nenhuma troca direta pode ser criada agora.",
  "Nothing selected": "Nada selecionado",
  "Choose a target player": "Escolha um jogador alvo",
  "Quantities must be at least 1": "Quantidades devem ser pelo menos 1",
  "Choose different resources to give and receive": "Escolha recursos diferentes para dar e receber",
  "You do not have enough resources for this offer": "Voce nao tem recursos suficientes para esta oferta",
  "You do not have enough resources for this bank trade": "Voce nao tem recursos suficientes para esta troca com o banco",
  "Bank trade executed": "Troca com o banco executada",
  "Trade accepted": "Troca aceita",
  "Trade refused": "Troca recusada",
  "Trade offer cancelled": "Oferta de troca cancelada",
  "You have": "Voce tem",
  "You currently have": "Voce tem atualmente",
  "resource(s).": "recurso(s).",
  "Must discard exactly": "Deve descartar exatamente",
  "selected": "selecionado",
  "Resources discarded": "Recursos descartados",
  "Selected:": "Selecionado:",
  "No one": "Ninguem",
  "Dice have not been rolled yet.": "Os dados ainda nao foram rolados.",
  "The game is waiting for the current player to continue.": "O jogo esta aguardando o jogador atual continuar.",
  "You must discard": "Voce deve descartar",
  "resource": "recurso",
  "resources": "recursos",
  "before the game can continue.": "antes que o jogo possa continuar.",
  "Waiting for": "Aguardando",
  "to discard resources.": "descartar recursos.",
  "Waiting for these players to discard resources:": "Aguardando estes jogadores descartarem recursos:",
  "The robber must be moved before normal play can continue.": "O ladrao deve ser movido antes que o jogo normal continue.",
  "sent you a trade offer. Open Trade to answer it.": "enviou uma oferta de troca. Abra Trocas para responder.",
  "Your trade offer to": "Sua oferta de troca para",
  "is still waiting for an answer.": "ainda esta aguardando resposta.",
  "and": "e",
  "are resolving a trade.": "estao resolvendo uma troca.",
  "still needs to place a setup road.": "ainda precisa colocar uma estrada inicial.",
  "Nothing special is blocking the game right now.": "Nada especial esta bloqueando o jogo agora.",
  "Place your starting settlement": "Coloque sua casa inicial",
  "Place your starting road": "Coloque sua estrada inicial",
  "Discard the required resources": "Descarte os recursos obrigatorios",
  "Roll the dice": "Role os dados",
  "Move the robber": "Mova o ladrao",
  "Build a road": "Construa uma estrada",
  "Build a settlement": "Construa uma casa",
  "Upgrade to a city": "Melhore para uma cidade",
  "Buy a development card": "Compre uma carta de desenvolvimento",
  "Play a development card": "Jogue uma carta de desenvolvimento",
  "Trade with the bank": "Troque com o banco",
  "Offer a trade to another player": "Ofereca uma troca a outro jogador",
  "Answer a trade offer": "Responda uma oferta de troca",
  "Cancel your pending trade offer": "Cancele sua oferta de troca pendente",
  "End your turn": "Encerre seu turno",
  "point": "ponto",
  "points": "pontos",
  "has Longest Road": "tem a Maior Estrada",
  "has Largest Army": "tem o Maior Exercito",
  "Playing now": "Jogando agora",
  "Resources in hand:": "Recursos na mao:",
  "Development cards:": "Cartas de desenvolvimento:",
  "Roads on board:": "Estradas no tabuleiro:",
  "Settlements:": "Casas:",
  "Cities:": "Cidades:",
  "Knights played:": "Cavaleiros jogados:",
  "The bank counts are not available right now.": "As contagens do banco nao estao disponiveis agora.",
  "Players are placing their first starting settlement and road.": "Os jogadores estao colocando a primeira casa e estrada iniciais.",
  "Players are placing their second starting settlement and road.": "Os jogadores estao colocando a segunda casa e estrada iniciais.",
  "The match is over. The winner reached the victory point goal.": "A partida acabou. O vencedor alcancou a meta de pontos de vitoria.",
  "The active player should roll the dice.": "O jogador ativo deve rolar os dados.",
  "The active player can trade and prepare their turn.": "O jogador ativo pode trocar e preparar o turno.",
  "The active player can build, buy cards, and keep trading if allowed.": "O jogador ativo pode construir, comprar cartas e continuar trocando se permitido.",
  "The active player can finish the turn.": "O jogador ativo pode encerrar o turno.",
  "Follow the current turn flow shown on the right side of the screen.": "Siga o fluxo do turno mostrado no lado direito da tela.",
  "What Is Happening Now": "O que esta acontecendo agora",
  "It is": "E a vez de",
  "'s turn.": ".",
  "Current step:": "Etapa atual:",
  "What You Should Know": "O que voce deve saber",
  "What You Can Do Right Now": "O que voce pode fazer agora",
  "You cannot act right now. You are probably waiting for another player or for the game to advance.": "Voce nao pode agir agora. Provavelmente esta aguardando outro jogador ou o jogo avancar.",
  "How To Win": "Como vencer",
  "Reach the victory point goal before everyone else. Build settlements and cities, and try to earn bonuses like": "Alcance a meta de pontos de vitoria antes dos outros. Construa casas e cidades, e tente ganhar bonus como",
  "Players": "Jogadores",
  "Bank Resources": "Recursos do banco",
  "This shows how many resource cards are still available in the bank.": "Isto mostra quantas cartas de recurso ainda estao disponiveis no banco.",
  "Army & Road": "Exercito e Estrada",
  "Close ranking": "Fechar ranking",
  "you": "voce",
  " knights": " cavaleiros",
  " roads": " estradas",
  "Largest Army card": "Carta de Maior Exercito",
  "Longest Road card": "Carta de Maior Estrada",
  "No players yet.": "Nenhum jogador ainda.",
  "No roads placed yet.": "Nenhuma estrada colocada ainda.",
  "Open ranking": "Abrir ranking",
  "Road": "Estrada",
  "Settlement": "Casa",
  "City": "Cidade",
  "Development Card": "Carta de desenvolvimento",
  "Builds one road edge.": "Constroi uma estrada em uma aresta.",
  "Places a new house on an empty vertex.": "Coloca uma nova casa em um vertice vazio.",
  "Upgrades one of your settlements.": "Melhora uma das suas casas para cidade.",
  "Buys one card from the development deck.": "Compra uma carta do baralho de desenvolvimento.",
  "You have enough resources.": "Voce tem recursos suficientes.",
  "Missing:": "Falta:",
  "Cost only.": "Apenas custo.",
  "Start or join a game to compare costs with your hand.": "Inicie ou entre em um jogo para comparar os custos com sua mao.",
  "Goal": "Objetivo",
  "Turn Flow": "Fluxo do turno",
  "Resource Production": "Producao de recursos",
  "Building": "Construcao",
  "Robber": "Ladrao",
  "Trading": "Trocas",
  "Development Cards": "Cartas de desenvolvimento",
  "Be the first player to reach the victory point goal.": "Seja o primeiro jogador a alcancar a meta de pontos de vitoria.",
  "Points usually come from settlements, cities, Longest Road, Largest Army, and some development cards.": "Pontos geralmente vem de casas, cidades, Maior Estrada, Maior Exercito e algumas cartas de desenvolvimento.",
  "On your turn, roll the dice first.": "No seu turno, role os dados primeiro.",
  "After rolling, collect resources, trade, build, buy development cards, or end your turn.": "Depois da rolagem, colete recursos, troque, construa, compre cartas de desenvolvimento ou encerre o turno.",
  "When a number is rolled, each tile with that number produces resources.": "Quando um numero sai nos dados, cada terreno com esse numero produz recursos.",
  "A settlement next to that tile collects 1 resource. A city collects 2.": "Uma casa ao lado daquele terreno coleta 1 recurso. Uma cidade coleta 2.",
  "Tiles with the robber do not produce resources.": "Terrenos com o ladrao nao produzem recursos.",
  "Roads must connect to your existing roads, settlements, or cities.": "Estradas devem se conectar as suas estradas, casas ou cidades existentes.",
  "Settlements must be at least two edges away from every other settlement or city.": "Casas devem ficar a pelo menos duas arestas de qualquer outra casa ou cidade.",
  "Cities upgrade your own settlements and produce more resources.": "Cidades melhoram suas casas e produzem mais recursos.",
  "If a 7 is rolled, players with too many cards may need to discard.": "Se sair 7, jogadores com cartas demais podem precisar descartar.",
  "The current player moves the robber to a tile.": "O jogador atual move o ladrao para um terreno.",
  "The robber blocks that tile and may let the current player steal from a nearby opponent.": "O ladrao bloqueia aquele terreno e pode permitir roubar um oponente proximo.",
  "You can trade resources with the bank or with other players when the turn allows it.": "Voce pode trocar recursos com o banco ou com outros jogadores quando o turno permitir.",
  "Ports can improve bank trade rates if you have a settlement or city on that port.": "Portos melhoram as taxas de troca com o banco se voce tiver uma casa ou cidade naquele porto.",
  "Development cards can help with resources, roads, victory points, or the robber.": "Cartas de desenvolvimento ajudam com recursos, estradas, pontos de vitoria ou o ladrao.",
  "Most development cards cannot be played on the same turn they were bought.": "A maioria das cartas de desenvolvimento nao pode ser jogada no mesmo turno em que foi comprada.",
  "Playing knights can help you compete for Largest Army.": "Jogar cavaleiros ajuda a disputar o Maior Exercito.",
  "Knight": "Cavaleiro",
  "Road Building": "Construcao de estradas",
  "Year of Plenty": "Ano de fartura",
  "Monopoly": "Monopolio",
  "Victory Point": "Ponto de vitoria",
  "Move robber": "Mover ladrao",
  "Place 2 roads": "Colocar 2 estradas",
  "Take 2 resources": "Pegar 2 recursos",
  "Claim one resource": "Tomar um recurso",
  "Passive point": "Ponto passivo",
  "Phase: ": "Fase: ",
  "Turn": "Turno",
  "Last roll:": "Ultima rolagem:",
  "Setup Round 1": "Rodada inicial 1",
  "Setup Round 2": "Rodada inicial 2",
  "Wood": "Madeira",
  "Brick": "Tijolo",
  "Sheep": "La",
  "Wheat": "Trigo",
  "Ore": "Minerio",
  "BRICK": "Tijolo",
  "LUMBER": "Madeira",
  "WOOL": "La",
  "GRAIN": "Trigo",
  "ORE": "Minerio",
};

const SERVER_PT: Record<string, string> = {
  "player cannot afford cost": "Jogador nao tem recursos suficientes para pagar o custo",
  "command rejected": "Comando recusado",
  "invalid player token": "Token de jogador invalido",
  "game not found": "Jogo nao encontrado",
  "websocket error": "Erro de WebSocket",
  "invalid websocket message": "Mensagem de WebSocket invalida",
  "unsupported message type": "Tipo de mensagem nao suportado",
  "room no longer exists": "A sala nao existe mais",
  "version mismatch": "Estado desatualizado",
  "state refreshed, try again": "Estado atualizado, tente novamente",
  "dice can only be rolled in main phase": "Os dados so podem ser rolados na fase principal",
  "resolve pending discards before rolling": "Resolva os descartes pendentes antes de rolar",
  "move robber before rolling again": "Mova o ladrao antes de rolar novamente",
  "dice already rolled this turn": "Os dados ja foram rolados neste turno",
  "player is not required to discard": "Este jogador nao precisa descartar",
  "player lacks resources to discard": "Jogador nao tem recursos suficientes para descartar",
  "cannot end turn outside main phase": "Nao e possivel encerrar o turno fora da fase principal",
  "must roll dice before ending turn": "Role os dados antes de encerrar o turno",
  "must move robber before ending turn": "Mova o ladrao antes de encerrar o turno",
  "pending discards must be resolved": "Descartes pendentes precisam ser resolvidos",
  "resolve pending trade offer before ending turn": "Resolva a oferta de troca pendente antes de encerrar o turno",
  "game is finished": "O jogo ja terminou",
  "cannot build road right now": "Nao e possivel construir estrada agora",
  "invalid road placement": "Posicionamento de estrada invalido",
  "road limit reached": "Limite de estradas atingido",
  "cannot build settlement right now": "Nao e possivel construir casa agora",
  "invalid settlement placement": "Posicionamento de casa invalido",
  "settlement limit reached": "Limite de casas atingido",
  "cannot build city right now": "Nao e possivel construir cidade agora",
  "invalid city upgrade": "Melhoria para cidade invalida",
  "city limit reached": "Limite de cidades atingido",
  "cannot buy development card right now": "Nao e possivel comprar carta de desenvolvimento agora",
  "development deck is empty": "O baralho de desenvolvimento esta vazio",
  "cannot play development cards during setup": "Nao e possivel jogar cartas de desenvolvimento durante a preparacao",
  "must roll before playing development cards": "Role os dados antes de jogar cartas de desenvolvimento",
  "resolve robber flow before playing development cards": "Resolva o fluxo do ladrao antes de jogar cartas de desenvolvimento",
  "victory point cards are not played": "Cartas de ponto de vitoria nao sao jogadas",
  "cannot play this development card": "Nao e possivel jogar esta carta de desenvolvimento",
  "invalid tile id": "Terreno invalido",
  "robber must be moved to a different tile": "O ladrao deve ser movido para um terreno diferente",
  "invalid robber victim": "Vitima do ladrao invalida",
  "invalid edge id": "Aresta invalida",
  "bank cannot satisfy year_of_plenty": "O banco nao tem recursos suficientes para Ano de Fartura",
  "invalid bank trade": "Troca com o banco invalida",
  "inactive players cannot trade": "Jogadores inativos nao podem trocar",
  "cannot trade with inactive player": "Nao e possivel trocar com jogador inativo",
  "another trade offer is already pending": "Ja existe outra oferta de troca pendente",
  "cannot trade with self": "Nao e possivel trocar consigo mesmo",
  "offering player lacks resources": "Jogador ofertante nao tem recursos suficientes",
  "receiving player lacks resources": "Jogador recebedor nao tem recursos suficientes",
  "no pending trade offer": "Nao ha oferta de troca pendente",
  "unknown trade offer id": "Oferta de troca desconhecida",
  "only target player can respond to this offer": "Apenas o jogador alvo pode responder esta oferta",
  "inactive players cannot respond to trades": "Jogadores inativos nao podem responder trocas",
  "only proposer can cancel this offer": "Apenas o proponente pode cancelar esta oferta",
  "action only available in main phase": "Acao disponivel apenas na fase principal",
  "inactive players cannot act": "Jogadores inativos nao podem agir",
  "only current player can perform this action": "Apenas o jogador atual pode fazer esta acao",
  "must roll dice first": "Role os dados primeiro",
  "must move robber first": "Mova o ladrao primeiro",
  "all required discards must be resolved first": "Todos os descartes obrigatorios precisam ser resolvidos primeiro",
  "desert cannot be traded": "Deserto nao pode ser trocado",
};

let currentLanguage: Language = readLanguage();
const originalTextNodes = new WeakMap<Text, string>();
const listeners = new Set<() => void>();
const translatedValues = new Set(Object.values(PT));

function readLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return stored === "pt" ? "pt" : "en";
  } catch {
    return "en";
  }
}

function writeLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Ignore disabled storage.
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(language: Language): void {
  if (language === currentLanguage) {
    translatePage();
    return;
  }
  currentLanguage = language;
  writeLanguage(language);
  for (const listener of listeners) {
    listener();
  }
  translatePage();
}

export function onLanguageChange(listener: () => void): void {
  listeners.add(listener);
}

export function t(text: string): string {
  return currentLanguage === "pt" ? PT[text] ?? text : text;
}

export function translateMessage(message: string): string {
  if (currentLanguage !== "pt") return message;
  const direct = PT[message];
  if (direct) return direct;

  const normalized = message.trim().toLowerCase();
  const server = SERVER_PT[normalized];
  if (server) return server;

  const dynamicMustDiscard = normalized.match(/^must discard exactly (\d+) resources?$/);
  if (dynamicMustDiscard) {
    return `Deve descartar exatamente ${dynamicMustDiscard[1]} recursos`;
  }

  const unsupported = normalized.match(/^unsupported message type: (.+)$/);
  if (unsupported) {
    return `Tipo de mensagem nao suportado: ${unsupported[1]}`;
  }

  const playerLacks = normalized.match(/^player \d+ lacks (.+)$/);
  if (playerLacks) {
    return `Jogador nao tem ${t(playerLacks[1].toUpperCase())}`;
  }

  const bankLacks = normalized.match(/^bank lacks (.+)$/);
  if (bankLacks) {
    return `Banco nao tem ${t(bankLacks[1].toUpperCase())}`;
  }

  return message;
}

function translateValue(value: string): string {
  return currentLanguage === "pt" ? PT[value] ?? value : value;
}

function translateAttribute(el: HTMLElement, attr: "title" | "placeholder" | "aria-label"): void {
  const value = el.getAttribute(attr);
  if (!value) return;
  const key = `i18nOriginal${attr.replace("-", "")}`;
  const dataset = el.dataset as Record<string, string | undefined>;
  let original = dataset[key] ?? value;
  if (
    dataset[key] &&
    value !== original &&
    value !== translateValue(original) &&
    !translatedValues.has(value)
  ) {
    original = value;
  }
  dataset[key] = original;
  el.setAttribute(attr, translateValue(original));
}

function translateTextNode(node: Text): void {
  let original = originalTextNodes.get(node) ?? node.textContent ?? "";
  const current = node.textContent ?? "";
  if (
    originalTextNodes.has(node) &&
    current !== original &&
    current !== translateValue(original) &&
    !translatedValues.has(current.trim())
  ) {
    original = current;
  }
  const trimmed = original.trim();
  if (!trimmed) return;
  originalTextNodes.set(node, original);
  node.textContent = original.replace(trimmed, translateValue(trimmed));
}

function translateElementText(el: HTMLElement): void {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      translateTextNode(node as Text);
    }
  }
}

export function translatePage(root: ParentNode = document): void {
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    translateElementText(el);
    translateAttribute(el, "title");
    translateAttribute(el, "placeholder");
    translateAttribute(el, "aria-label");
  }
}
