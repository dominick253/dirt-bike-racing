/**
 * State Machine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateMachine, GameState } from '../src/core/state';

describe('StateMachine', () => {
  let sm: StateMachine;

  beforeEach(() => {
    sm = new StateMachine();
  });

  it('should start in LOADING state', () => {
    expect(sm.getState()).toBe(GameState.LOADING);
  });

  it('should transition LOADING → TITLE', () => {
    expect(sm.transition(GameState.TITLE)).toBe(true);
    expect(sm.getState()).toBe(GameState.TITLE);
  });

  it('should transition TITLE → COUNTDOWN', () => {
    sm.transition(GameState.TITLE);
    expect(sm.transition(GameState.COUNTDOWN)).toBe(true);
    expect(sm.getState()).toBe(GameState.COUNTDOWN);
  });

  it('should transition COUNTDOWN → RACE', () => {
    sm.transition(GameState.TITLE);
    sm.transition(GameState.COUNTDOWN);
    expect(sm.transition(GameState.RACE)).toBe(true);
    expect(sm.getState()).toBe(GameState.RACE);
  });

  it('should transition RACE → RESULTS', () => {
    sm.transition(GameState.TITLE);
    sm.transition(GameState.COUNTDOWN);
    sm.transition(GameState.RACE);
    expect(sm.transition(GameState.RESULTS)).toBe(true);
    expect(sm.getState()).toBe(GameState.RESULTS);
  });

  it('should transition RESULTS → TITLE', () => {
    sm.transition(GameState.TITLE);
    sm.transition(GameState.COUNTDOWN);
    sm.transition(GameState.RACE);
    sm.transition(GameState.RESULTS);
    expect(sm.transition(GameState.TITLE)).toBe(true);
    expect(sm.getState()).toBe(GameState.TITLE);
  });

  it('should reject invalid transitions', () => {
    expect(sm.transition(GameState.RACE)).toBe(false);
    expect(sm.getState()).toBe(GameState.LOADING);
  });

  it('should reject going backwards', () => {
    sm.transition(GameState.TITLE);
    expect(sm.transition(GameState.LOADING)).toBe(false);
    expect(sm.getState()).toBe(GameState.TITLE);
  });

  it('should fire handler on state change', () => {
    let called = false;
    sm.on(GameState.TITLE, () => { called = true; });
    sm.transition(GameState.TITLE);
    expect(called).toBe(true);
  });

  it('should fire subscriber on state change', () => {
    let event: { from: GameState; to: GameState } | null = null;
    sm.subscribe((e) => { event = { from: e.from, to: e.to }; });
    sm.transition(GameState.TITLE);
    expect(event).not.toBeNull();
    expect(event!.from).toBe(GameState.LOADING);
    expect(event!.to).toBe(GameState.TITLE);
  });

  it('should allow TITLE → COUNTDOWN → RACE → RESULTS → TITLE chain', () => {
    sm.transition(GameState.TITLE);
    sm.transition(GameState.COUNTDOWN);
    sm.transition(GameState.RACE);
    sm.transition(GameState.RESULTS);
    sm.transition(GameState.TITLE);
    expect(sm.getState()).toBe(GameState.TITLE);
  });
});
