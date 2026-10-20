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
  const botClock = useRef(0);

  const move = useCallback((direction: Direction) => {
    setState(current => moveActor(current, 'player', direction));
  }, []);
  const bomb = useCallback(() => setState(current => placeBomb(current, 'player')), []);
  const restart = useCallback(() => {
    botClock.current = 0;
    setState(createGame());
  }, []);

  useEffect(() => {
    let lastTick = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const delta = Math.min((now - lastTick) / 1000, 0.25);
      lastTick = now;
      setState(current => {
        let next = tick(current, delta);
        botClock.current += delta;
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
    const held = new Set<string>();
    let repeatDelay: ReturnType<typeof setTimeout> | null = null;
    let repeat: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      held.clear();
      if (repeatDelay) clearTimeout(repeatDelay);
      if (repeat) clearInterval(repeat);
      repeatDelay = null;
      repeat = null;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.key];
      if (direction) {
        event.preventDefault();
        if (held.has(event.key)) return;
        held.add(event.key);
        move(direction);
        if (!repeatDelay && !repeat) repeatDelay = setTimeout(() => {
          repeatDelay = null;
          repeat = setInterval(() => {
            const latest = [...held].at(-1);
            if (latest) move(KEY_DIRECTIONS[latest]);
          }, 220);
          const latest = [...held].at(-1);
          if (latest) move(KEY_DIRECTIONS[latest]);
        }, 330);
      }
      if (event.key === ' ' || event.key.toLowerCase() === 'x') {
        event.preventDefault();
        if (!event.repeat) bomb();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      held.delete(event.key);
      if (held.size === 0) stop();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', stop);
    return () => {
      stop();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', stop);
    };
  }, [move, bomb]);

  return { state, move, bomb, restart };
}
