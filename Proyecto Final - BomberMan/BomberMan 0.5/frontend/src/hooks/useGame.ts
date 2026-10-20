import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { createGame, decideBot, moveActor, placeBomb, tick } from '../game/engine';
import type { Direction, GameMode, GameState } from '../game/engine';

type HumanId = 'player' | 'player2';
type KeyBinding = { actor: HumanId; direction: Direction };

// El segundo teclado sigue el esquema IJKL del Snake anterior.
const KEY_DIRECTIONS: Record<string, KeyBinding> = {
  ArrowUp: { actor: 'player', direction: 'up' }, ArrowDown: { actor: 'player', direction: 'down' },
  ArrowLeft: { actor: 'player', direction: 'left' }, ArrowRight: { actor: 'player', direction: 'right' },
  w: { actor: 'player', direction: 'up' }, s: { actor: 'player', direction: 'down' },
  a: { actor: 'player', direction: 'left' }, d: { actor: 'player', direction: 'right' },
  i: { actor: 'player2', direction: 'up' }, k: { actor: 'player2', direction: 'down' },
  j: { actor: 'player2', direction: 'left' }, l: { actor: 'player2', direction: 'right' },
};

/** Coordina el motor compartido con reloj, bots y controles locales de cada jugador. */
export function useGame() {
  const [state, setState] = useState<GameState>(createGame);
  const botClock = useRef(0);

  const move = useCallback((direction: Direction) => {
    setState(current => moveActor(current, 'player', direction));
  }, []);
  const movePlayer2 = useCallback((direction: Direction) => {
    setState(current => moveActor(current, 'player2', direction));
  }, []);
  const bomb = useCallback(() => setState(current => placeBomb(current, 'player')), []);
  const bombPlayer2 = useCallback(() => setState(current => placeBomb(current, 'player2')), []);
  const restart = useCallback(() => {
    botClock.current = 0;
    setState(current => createGame(current.mode));
  }, []);
  const selectMode = useCallback((mode: GameMode) => {
    botClock.current = 0;
    setState(createGame(mode));
  }, []);

  useEffect(() => {
    let lastTick = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const delta = Math.min((now - lastTick) / 1000, 0.25);
      lastTick = now;
      setState(current => {
        let next = tick(current, delta);
        if (next.mode !== 'solo') return next;
        botClock.current += delta;
        if (botClock.current >= 0.38 && next.status === 'playing') {
          botClock.current = 0;
          for (const id of ['bot', 'bot2'] as const) {
            if (next.status !== 'playing') break;
            const decision = decideBot(next, id);
            if (decision.type === 'move') next = moveActor(next, id, decision.direction);
            if (decision.type === 'bomb') next = placeBomb(next, id);
          }
        }
        return next;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const held: Record<HumanId, Set<string>> = { player: new Set(), player2: new Set() };
    const delays: Record<HumanId, ReturnType<typeof setTimeout> | null> = { player: null, player2: null };
    const repeats: Record<HumanId, ReturnType<typeof setInterval> | null> = { player: null, player2: null };
    const moveFor = (actor: HumanId, direction: Direction) => (actor === 'player' ? move : movePlayer2)(direction);
    const stop = (actor: HumanId) => {
      held[actor].clear();
      if (delays[actor]) clearTimeout(delays[actor]);
      if (repeats[actor]) clearInterval(repeats[actor]);
      delays[actor] = null;
      repeats[actor] = null;
    };
    const repeatLatest = (actor: HumanId) => {
      const key = [...held[actor]].at(-1);
      if (key) moveFor(actor, KEY_DIRECTIONS[key].direction);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const binding = KEY_DIRECTIONS[key];
      if (binding && (binding.actor === 'player' || state.mode === 'local2p')) {
        event.preventDefault();
        const actor = binding.actor;
        if (held[actor].has(key)) return;
        held[actor].add(key);
        moveFor(actor, binding.direction);
        if (!delays[actor] && !repeats[actor]) {
          delays[actor] = setTimeout(() => {
            delays[actor] = null;
            repeatLatest(actor);
            repeats[actor] = setInterval(() => repeatLatest(actor), 220);
          }, 330);
        }
        return;
      }
      if (key === ' ' || key === 'x' || (state.mode === 'local2p' && key === 'o')) {
        event.preventDefault();
        if (!event.repeat) (key === 'o' ? bombPlayer2 : bomb)();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const binding = KEY_DIRECTIONS[key];
      if (!binding) return;
      held[binding.actor].delete(key);
      if (held[binding.actor].size === 0) stop(binding.actor);
    };
    const stopAll = () => { stop('player'); stop('player2'); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', stopAll);
    return () => {
      stopAll();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', stopAll);
    };
  }, [state.mode, move, movePlayer2, bomb, bombPlayer2]);

  return { state, move, bomb, restart, selectMode };
}
