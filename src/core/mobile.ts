/**
 * Mobile Controls — Touch joystick + gas/brake buttons
 */

export interface MobileInputState {
  throttle: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  jump: boolean;
  wheelie: boolean;
}

export class MobileInputSystem {
  public state: MobileInputState;
  private joystickActive: boolean = false;
  private joystickStartX: number = 0;
  private joystickStartY: number = 0;
  private joystickKnob: HTMLElement | null = null;
  private joystickArea: HTMLElement | null = null;

  constructor() {
    this.state = {
      throttle: false,
      brake: false,
      steerLeft: false,
      steerRight: false,
      jump: false,
      wheelie: false,
    };
    this.setupJoystick();
    this.setupButtons();
  }

  private setupJoystick(): void {
    this.joystickArea = document.getElementById('joystick-area') as HTMLElement | null;
    this.joystickKnob = document.getElementById('joystick-knob') as HTMLElement | null;

    if (!this.joystickArea || !this.joystickKnob) return;
    const area = this.joystickArea;

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = area.getBoundingClientRect();
      this.joystickStartX = rect.left + rect.width / 2;
      this.joystickStartY = rect.top + rect.height / 2;
      this.joystickActive = true;
      this.updateJoystick(touch.clientX, touch.clientY);
    };

    const onMove = (e: TouchEvent) => {
      if (!this.joystickActive) return;
      e.preventDefault();
      const touch = e.touches[0];
      this.updateJoystick(touch.clientX, touch.clientY);
    };

    const onEnd = (e: TouchEvent) => {
      this.joystickActive = false;
      this.state.steerLeft = false;
      this.state.steerRight = false;
      if (this.joystickKnob) {
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
      }
    };

    this.joystickArea.addEventListener('touchstart', onStart, { passive: false });
    this.joystickArea.addEventListener('touchmove', onMove, { passive: false });
    this.joystickArea.addEventListener('touchend', onEnd);
    this.joystickArea.addEventListener('touchcancel', onEnd);
  }

  private updateJoystick(clientX: number, clientY: number): void {
    if (!this.joystickKnob || !this.joystickArea) return;
    const rect = this.joystickArea.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const maxDist = rect.width / 2 - 24;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    // Dead zone
    if (Math.abs(dx) > 15) {
      this.state.steerLeft = dx < 0;
      this.state.steerRight = dx > 0;
    } else {
      this.state.steerLeft = false;
      this.state.steerRight = false;
    }
  }

  private setupButtons(): void {
    const gasBtn = document.getElementById('mobile-gas') as HTMLElement | null;
    const brakeBtn = document.getElementById('mobile-brake') as HTMLElement | null;

    if (gasBtn) {
      gasBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.state.throttle = true;
      });
      gasBtn.addEventListener('touchend', () => {
        this.state.throttle = false;
      });
      gasBtn.addEventListener('touchcancel', () => {
        this.state.throttle = false;
      });
    }

    if (brakeBtn) {
      brakeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.state.brake = true;
      });
      brakeBtn.addEventListener('touchend', () => {
        this.state.brake = false;
      });
      brakeBtn.addEventListener('touchcancel', () => {
        this.state.brake = false;
      });
    }
  }

  getState(): MobileInputState {
    return { ...this.state };
  }

  reset(): void {
    this.state.throttle = false;
    this.state.brake = false;
    this.state.steerLeft = false;
    this.state.steerRight = false;
    this.state.jump = false;
    this.state.wheelie = false;
    this.joystickActive = false;
  }
}
