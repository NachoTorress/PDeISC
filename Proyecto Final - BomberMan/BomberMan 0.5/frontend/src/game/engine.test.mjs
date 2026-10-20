import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, moveActor, placeBomb, tick, decideBot } from './engine.ts';

test('el mapa deja salidas para ambos participantes', () => {
  const game = createGame();
  assert.equal(game.actors.length, 3);
  assert.equal(game.board[1][1], 'floor');
  assert.equal(game.board[9][11], 'floor');
  assert.equal(game.board[1][11], 'floor');
  assert.equal(game.board[2][2], 'wall');
});

test('el movimiento respeta paredes y bloques', () => {
  const game = createGame();
  assert.equal(moveActor(game, 'player', 'up'), game);
  assert.equal(moveActor(game, 'player', 'right').actors[0].x, 2);
  assert.equal(moveActor(game, 'player', 'down').actors[0].y, 2);
});

test('la bomba explota, destruye cajas y puede eliminar al jugador', () => {
  let game = placeBomb(createGame(), 'player');
  assert.equal(game.bombs.length, 1);
  assert.equal(placeBomb(game, 'player').bombs.length, 1);
  for (let i = 0; i < 25; i += 1) game = tick(game, 0.1);
  assert.equal(game.bombs.length, 0);
  assert.equal(game.actors[0].alive, false);
  assert.equal(game.status, 'lost');
});

test('el bot reconoce una bomba y busca salida', () => {
  const game = placeBomb(createGame(), 'bot');
  assert.equal(decideBot(game).type, 'move');
});

test('el bot se acerca a una caja y decide colocar una bomba', () => {
  const game = createGame();
  const first = decideBot(game);
  assert.equal(first.type, 'move');
  const next = moveActor(game, 'bot', first.direction);
  assert.equal(decideBot(next).type, 'bomb');
});

test('el segundo bot puede actuar desde su punto de inicio', () => {
  const game = createGame();
  const decision = decideBot(game, 'bot2');
  assert.notEqual(decision.type, 'wait');
});

test('la victoria 1P exige eliminar a los dos bots', () => {
  let game = createGame();
  game = { ...game, actors: game.actors.map(a => a.id === 'bot' ? { ...a, alive: false } : a) };
  assert.equal(moveActor(game, 'player', 'right').status, 'playing');
  const secondBot = game.actors.find(a => a.id === 'bot2');
  game = { ...game, bombs: [{ ...secondBot, id: 1, owner: 'player', fuse: 0, range: 0 }] };
  assert.equal(tick(game, 0.1).status, 'won');
});

test('el modo 2P local solo incluye a los jugadores y decide al ganador', () => {
  let game = createGame('local2p');
  assert.deepEqual(game.actors.map(a => a.id), ['player', 'player2']);
  assert.equal(game.board[9][11], 'floor');
  game = placeBomb(game, 'player2');
  assert.equal(game.bombs[0].owner, 'player2');
  for (let i = 0; i < 25; i += 1) game = tick(game, 0.1);
  assert.equal(game.status, 'won');
});
