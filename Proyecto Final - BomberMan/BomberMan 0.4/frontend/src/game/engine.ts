/** Reglas puras del juego. Ninguna función depende de React ni de la plataforma. */
export type Cell = 'floor' | 'wall' | 'crate';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Position = { x: number; y: number };
export type Actor = Position & { id: 'player' | 'bot'; alive: boolean };
export type Bomb = Position & { id: number; owner: Actor['id']; fuse: number; range: number };
export type Flame = Position & { ttl: number };
export type GameStatus = 'playing' | 'won' | 'lost' | 'draw';
export type GameState = {
  board: Cell[][];
  actors: Actor[];
  bombs: Bomb[];
  flames: Flame[];
  status: GameStatus;
  nextBombId: number;
  elapsed: number;
};

export const WIDTH = 13;
export const HEIGHT = 11;
export const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const DELTAS: Record<Direction, Position> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const SPAWNS: Position[] = [{ x: 1, y: 1 }, { x: 11, y: 9 }];
const SPAWN_CLEAR = new Set(['1,1', '1,2', '2,1', '11,9', '10,9', '11,8']);

export const key = ({ x, y }: Position): string => `${x},${y}`;
export const adjacent = (p: Position, d: Direction): Position => ({ x: p.x + DELTAS[d].x, y: p.y + DELTAS[d].y });
const inside = ({ x, y }: Position): boolean => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
const same = (a: Position, b: Position): boolean => a.x === b.x && a.y === b.y;

/** Crea un mapa reproducible, con salidas libres alrededor de ambos puntos de inicio. */
export function createGame(): GameState {
  const board: Cell[][] = Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) => {
      if (x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1 || (x % 2 === 0 && y % 2 === 0)) return 'wall';
      if (SPAWN_CLEAR.has(`${x},${y}`)) return 'floor';
      return ((x * 17 + y * 31 + x * y * 7) % 9 < 4) ? 'crate' : 'floor';
    }),
  );
  return {
    board,
    actors: SPAWNS.map((p, index) => ({ ...p, id: index === 0 ? 'player' : 'bot', alive: true })),
    bombs: [], flames: [], status: 'playing', nextBombId: 1, elapsed: 0,
  };
}

export function canEnter(state: GameState, p: Position): boolean {
  return inside(p) && state.board[p.y][p.x] === 'floor' && !state.bombs.some(b => same(b, p));
}

function result(state: GameState): GameState {
  const player = state.actors.find(a => a.id === 'player')!;
  const bot = state.actors.find(a => a.id === 'bot')!;
  const status: GameStatus = player.alive && bot.alive ? 'playing' : player.alive ? 'won' : bot.alive ? 'lost' : 'draw';
  return { ...state, status };
}

/** Mueve un actor una casilla si no hay pared, bloque o bomba; devuelve un estado nuevo. */
export function moveActor(state: GameState, id: Actor['id'], direction: Direction): GameState {
  if (state.status !== 'playing') return state;
  const actor = state.actors.find(a => a.id === id);
  if (!actor?.alive) return state;
  const next = adjacent(actor, direction);
  if (!canEnter(state, next)) return state;
  const hit = state.flames.some(f => same(f, next));
  return result({ ...state, actors: state.actors.map(a => a.id === id ? { ...a, ...next, alive: !hit } : a) });
}

/** Coloca una única bomba activa por actor; devuelve el estado original si no procede. */
export function placeBomb(state: GameState, id: Actor['id']): GameState {
  if (state.status !== 'playing' || state.bombs.some(b => b.owner === id)) return state;
  const actor = state.actors.find(a => a.id === id);
  if (!actor?.alive || state.bombs.some(b => same(b, actor))) return state;
  return {
    ...state,
    nextBombId: state.nextBombId + 1,
    bombs: [...state.bombs, { x: actor.x, y: actor.y, id: state.nextBombId, owner: id, fuse: 2.4, range: 2 }],
  };
}

/** Propaga una explosión hasta la primera pared o caja por cada dirección. */
export function blastCells(board: Cell[][], bomb: Pick<Bomb, 'x' | 'y' | 'range'>): Position[] {
  const cells: Position[] = [{ x: bomb.x, y: bomb.y }];
  for (const direction of DIRECTIONS) {
    let p = { x: bomb.x, y: bomb.y };
    for (let distance = 0; distance < bomb.range; distance += 1) {
      p = adjacent(p, direction);
      if (!inside(p) || board[p.y][p.x] === 'wall') break;
      cells.push(p);
      if (board[p.y][p.x] === 'crate') break;
    }
  }
  return cells;
}

/** Avanza temporizadores, reacciones en cadena, destrucción y daño. delta está en segundos. */
export function tick(state: GameState, delta: number): GameState {
  if (state.status !== 'playing') return state;
  const seconds = Math.max(0, Math.min(delta, 0.25));
  const board = state.board.map(row => [...row]);
  const bombs = state.bombs.map(b => ({ ...b, fuse: b.fuse - seconds }));
  const flames = state.flames.filter(f => f.ttl > seconds).map(f => ({ ...f, ttl: f.ttl - seconds }));
  const exploded = new Set<number>();
  const burning = new Set(flames.map(key));
  let more = true;
  while (more) {
    more = false;
    for (const bomb of bombs) {
      if (exploded.has(bomb.id) || (bomb.fuse > 0 && !burning.has(key(bomb)))) continue;
      exploded.add(bomb.id);
      more = true;
      for (const p of blastCells(board, bomb)) {
        burning.add(key(p));
        if (board[p.y][p.x] === 'crate') board[p.y][p.x] = 'floor';
      }
    }
  }
  for (const cell of burning) {
    if (!flames.some(f => key(f) === cell)) {
      const [x, y] = cell.split(',').map(Number);
      flames.push({ x, y, ttl: 0.55 });
    }
  }
  const actors = state.actors.map(a => ({ ...a, alive: a.alive && !burning.has(key(a)) }));
  return result({ ...state, board, bombs: bombs.filter(b => !exploded.has(b.id)), flames, actors, elapsed: state.elapsed + seconds });
}

function dangerSet(state: GameState): Set<string> {
  const danger = new Set(state.flames.map(key));
  for (const bomb of state.bombs) for (const p of blastCells(state.board, bomb)) danger.add(key(p));
  return danger;
}

function firstStepTo(state: GameState, start: Position, isGoal: (p: Position) => boolean, forbidden: Set<string>): Direction | null {
  const visited = new Set([key(start)]);
  const queue: { p: Position; first: Direction | null }[] = [{ p: start, first: null }];
  while (queue.length) {
    const current = queue.shift()!;
    if (current.first && isGoal(current.p)) return current.first;
    for (const direction of DIRECTIONS) {
      const next = adjacent(current.p, direction);
      if (!canEnter(state, next) || visited.has(key(next)) || forbidden.has(key(next))) continue;
      visited.add(key(next));
      queue.push({ p: next, first: current.first ?? direction });
    }
  }
  return null;
}

export type BotDecision = { type: 'move'; direction: Direction } | { type: 'bomb' } | { type: 'wait' };

/** IA básica: escapa de líneas de explosión y busca cajas o al jugador. */
export function decideBot(state: GameState): BotDecision {
  const bot = state.actors.find(a => a.id === 'bot')!;
  const player = state.actors.find(a => a.id === 'player')!;
  if (state.status !== 'playing' || !bot.alive) return { type: 'wait' };
  const danger = dangerSet(state);
  const escape = firstStepTo(state, bot, p => !danger.has(key(p)), new Set());
  if (danger.has(key(bot))) return escape ? { type: 'move', direction: escape } : { type: 'wait' };

  const besideCrate = DIRECTIONS.some(d => {
    const p = adjacent(bot, d);
    return inside(p) && state.board[p.y][p.x] === 'crate';
  });
  const nearPlayer = (bot.x === player.x && Math.abs(bot.y - player.y) <= 2) ||
    (bot.y === player.y && Math.abs(bot.x - player.x) <= 2);
  if (!state.bombs.some(b => b.owner === 'bot') && (besideCrate || nearPlayer)) {
    const projected = placeBomb(state, 'bot');
    const futureDanger = dangerSet(projected);
    if (firstStepTo(projected, bot, p => !futureDanger.has(key(p)), new Set())) return { type: 'bomb' };
  }

  const target = firstStepTo(state, bot, p => {
    if (same(p, player)) return true;
    return DIRECTIONS.some(d => {
      const n = adjacent(p, d);
      return inside(n) && state.board[n.y][n.x] === 'crate';
    });
  }, danger);
  return target ? { type: 'move', direction: target } : { type: 'wait' };
}
