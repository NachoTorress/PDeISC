import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, moveActor, placeBomb, tick, decideBot } from './engine.ts';

test('el mapa deja salidas para ambos participantes', () => {
  const game = createGame();
  assert.equal(game.board[1][1], 'floor');
  assert.equal(game.board[9][11], 'floor');
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
