/**
 * Input System — Keyboard + Touch + Gamepad
 */

export interface InputState {
  throttle: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  jump: boolean;
  wheelie: boolean;
}

export class InputSystem {
  public state: InputState;
  private keys: Set<string> = new Set();
  private gamepadIndex: number = -1;

  constructor() {
    this.state = {
      throttle: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      jump: false,
      wheelie: false,
    };
    this.setupKeyboard();
    this.setupGamepad();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      this.updateState();
    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      this.keys.delete(key);
      this.updateState();
    });
  }

  private setupGamepad(): void {
    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = -1;
    });
  }

  private updateState(): void {
    this.state.throttle = this.keys.has('w') || this.keys.has('arrowup');
    this.state.brake = this.keys.has('s') || this.keys.has('arrowdown');
    this.state.steerLeft = this.keys.has('a') || this.keys.has('arrowleft');
    this.state.steerRight = this.keys.has('d') || this.keys.has('arrowright');
    this.state.jump = this.keys.has(' ');
    this.state.wheelie = this.keys.has('q');
    this.updateGamepad();
  }

  private updateGamepad(): void {
    const gp = navigator.getGamepads?.()[this.gamepadIndex];
    if (!gp) return;
    this.state.throttle = gp.axes[1] < -0.5 || gp.buttons[7]?.pressed;
    this.state.brake = gp.axes[1] > 0.5 || gp.buttons[6]?.pressed;
    this.state.steerLeft = gp.axes[0] < -0.5 || gp.buttons[14]?.pressed;
    this.state.steerRight = gp.axes[0] > 0.5 || gp.buttons[15]?.pressed;
    this.state.jump = gp.buttons[0]?.pressed;
    this.state.wheelie = gp.buttons[1]?.pressed;
  }

  getState(): InputState {
    return { ...this.state };
  }

  reset(): void {
    this.keys.clear();
    this.state = {
      throttle: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      jump: false,
      wheelie: false,
    };
  }
}
