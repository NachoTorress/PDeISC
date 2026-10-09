import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { createGame, decideBot, moveActor, placeBomb, tick } from '../game/engine';
import type { Direction, GameState } from '../game/engine';

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
};

/** Coordina el motor puro con el reloj y las entradas locales de web y Android. */
export function useGame() {
  const [state, setState] = useState<GameState>(createGame);
  const lastMove = useRef(0);
  const botClock = useRef(0);

  const move = useCallback((direction: Direction) => {
    const now = Date.now();
    if (now - lastMove.current < 125) return;
    lastMove.current = now;
    setState(current => moveActor(current, 'player', direction));
  }, []);
  const bomb = useCallback(() => setState(current => placeBomb(current, 'player')), []);
  const restart = useCallback(() => {
    lastMove.current = 0;
    botClock.current = 0;
    setState(createGame());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setState(current => {
        let next = tick(current, 0.1);
        botClock.current += 0.1;
        if (botClock.current >= 0.38 && next.status === 'playing') {
          botClock.current = 0;
          const decision = decideBot(next);
          if (decision.type === 'move') next = moveActor(next, 'bot', decision.direction);
          if (decision.type === 'bomb') next = placeBomb(next, 'bot');
        }
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.key];
      if (direction) { event.preventDefault(); move(direction); }
      if (event.key === ' ' || event.key.toLowerCase() === 'x') { event.preventDefault(); bomb(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move, bomb]);

  return { state, move, bomb, restart };
}
