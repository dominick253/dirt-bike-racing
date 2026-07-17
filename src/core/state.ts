/**
 * State Machine — LOADING → TITLE → COUNTDOWN → RACE → RESULTS
 */

export enum GameState {
  LOADING = 'loading',
  TITLE = 'title',
  COUNTDOWN = 'countdown',
  RACE = 'race',
  RESULTS = 'results',
}

export interface StateEvent {
  from: GameState;
  to: GameState;
  data?: Record<string, unknown>;
}

export type StateHandler = (data?: Record<string, unknown>) => void;

export class StateMachine {
  private state: GameState = GameState.LOADING;
  private handlers: Map<GameState, StateHandler> = new Map();
  private listeners: Array<(event: StateEvent) => void> = [];

  on(state: GameState, handler: StateHandler): void {
    this.handlers.set(state, handler);
  }

  subscribe(listener: (event: StateEvent) => void): void {
    this.listeners.push(listener);
  }

  transition(to: GameState, data?: Record<string, unknown>): boolean {
    const validTransitions: Record<GameState, GameState[]> = {
      [GameState.LOADING]: [GameState.TITLE],
      [GameState.TITLE]: [GameState.COUNTDOWN, GameState.TITLE],
      [GameState.COUNTDOWN]: [GameState.RACE],
      [GameState.RACE]: [GameState.RESULTS],
      [GameState.RESULTS]: [GameState.TITLE, GameState.COUNTDOWN],
    };

    const allowed = validTransitions[this.state];
    if (!allowed?.includes(to)) return false;

    const event: StateEvent = { from: this.state, to, data };
    this.state = to;
    this.listeners.forEach((l) => l(event));
    this.handlers.get(to)?.(data);
    return true;
  }

  getState(): GameState {
    return this.state;
  }
}
