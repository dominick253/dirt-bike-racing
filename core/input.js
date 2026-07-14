/**
 * Input Manager — Keyboard, Mouse/PointerLock, and Gamepad support
 */

const keys = {};
let pointerLocked = false;
let cameraYaw = 0;
let cameraPitch = 0.2;
let gamepadState = { enabled: false };
const touchControls = { throttle: false, brake: false, steerLeft: false, steerRight: false };

export function init() {
  document.addEventListener('keydown', e => { keys[e.code] = true; if(e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  document.addEventListener('pointerlockchange', () => { pointerLocked = !!document.pointerLockElement; });
  document.addEventListener('mousemove', e => { if(pointerLocked){ cameraYaw -= e.movementX * 0.003; cameraPitch = Math.max(-0.3, Math.min(1.2, cameraPitch - e.movementY * 0.003)); } });
  checkGamepad();
  window.addEventListener('gamepadconnected', () => { gamepadState.enabled = true; });
  setupMobileControls();
}

function checkGamepad() {
  try { const gps = navigator.getGamepads?.(); if(gps) for(let i=0;i<gps.length;i++) if(gps[i]) { gamepadState.enabled=true; break; } } catch(e){}
}

function getGamepadInput() {
  checkGamepad();
  const gp = navigator.getGamepads?.()[0];
  if(!gp) return null;
  let throttle=0, brake=0, steer=0;
  // Standard gamepad layout: axis 7=RT(throttle), axis 6=LT(brake), axis 0=LStick(steer)
  if(gp.axes.length > 7) { throttle = Math.max(0, gp.axes[7] ?? 0); brake = Math.max(0, -(gp.axes[6] ?? 0)); }
  else { // some controllers use buttons for triggers
    if(gp.buttons[7]?.pressed && gp.buttons[7].value > 0.1) throttle = gp.buttons[7].value;
    if(gp.buttons[6]?.pressed && gp.buttons[6].value > 0.1) brake = gp.buttons[6].value;
  }
  if(Math.abs(gp.axes[0]) > 0.2) steer = gp.axes[0];

  // Alt: A=brake(button 0), B=gas override(button 1) — some controllers
  if(!throttle && gp.buttons[0]?.pressed && gp.buttons[0].value > 0.3) brake = Math.min(1, gp.buttons[0].value * 2);
  if(!throttle && gp.buttons[5]?.pressed) throttle = Math.min(1, gp.buttons[5].value ?? 0);

  return { throttle: Math.min(1, throttle), brake: Math.min(1, brake), steer };
}

export function getInputState() {
  let throttle=0, brake=0, steer=0, wheelie=0, compression=0;

  // Keyboard
  if(keys['KeyW'] || keys['ArrowUp']) throttle = 1;
  if(keys['KeyS'] || keys['ArrowDown']) brake = 1;
  if(keys['KeyA'] || keys['ArrowLeft']) steer = -1;
  if(keys['KeyD'] || keys['ArrowRight']) steer = 1;
  if(keys['Space']) wheelie = 1;
  if(keys['ShiftLeft'] || keys['ShiftRight']) compression = 1;

  // Gamepad overrides keyboard only when values are above deadzone
  const gp = getGamepadInput();
  if(gp && gamepadState.enabled && (gp.throttle > 0.05 || gp.brake > 0.05 || Math.abs(gp.steer) > 0.15)) {
    throttle = gp.throttle; brake = gp.brake; steer = gp.steer;
  }

  // Mobile touch
  if(touchControls.throttle && !keys['KeyW']) throttle = 1;
  if(touchControls.brake && !keys['KeyS']) brake = 1;
  if(touchControls.steerLeft) steer = Math.max(steer, -0.8);
  if(touchControls.steerRight) steer = Math.min(steer, 0.8);

  return { throttle: Math.min(1,throttle), brake: Math.min(1,brake), steer, wheelie, compression };
}

export function resetInput() {
  Object.keys(keys).forEach(k => keys[k] = false);
  touchControls.throttle=false; touchControls.brake=false;
  touchControls.steerLeft=false; touchControls.steerRight=false;
}

function setupMobileControls() {
  if(!('ontouchstart' in window) && navigator.maxTouchPoints < 1) return;
  const c = document.createElement('div');
  c.id = 'mobile-controls';
  c.innerHTML = `
    <button class="mobile-btn" id="btn-gas" style="position:absolute;bottom:80px;right:20px;width:64px;height:64px;background:rgba(255,106,0,.3);border:2px solid rgba(255,106,0,.5);border-radius:50%;color:#fff;font-size:1.5rem;">🔥</button>
    <button class="mobile-btn" id="btn-brake" style="position:absolute;bottom:10px;right:90px;width:64px;height:64px;background:rgba(255,106,0,.3);border:2px solid rgba(255,106,0,.5);border-radius:50%;color:#fff;font-size:1.5rem;">⬇️</button>
    <button class="mobile-btn" id="btn-left" style="position:absolute;bottom:10px;right:20px;width:64px;height:64px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);border-radius:50%;color:#fff;font-size:1.5rem;">⬅️</button>
    <button class="mobile-btn" id="btn-right" style="position:absolute;bottom:80px;right:90px;width:64px;height:64px;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);border-radius:50%;color:#fff;font-size:1.5rem;">➡️</button>`;
  c.style.cssText = 'position:fixed;z-index:60;pointer-events:auto;display:flex;gap:4px;';
  document.body.appendChild(c);

  const btns = { gas:'btn-gas', brake:'btn-brake', left:'btn-left', right:'btn-right' };
  Object.entries(btns).forEach(([key, id]) => {
    const el = document.getElementById(id); if(!el) return;
    ['touchstart','mousedown'].forEach(evt => el.addEventListener(evt, e=>{e.preventDefault(); touchControls[key]=true;}));
    ['touchend','mouseup','touchcancel'].forEach(evt => el.addEventListener(evt, ()=>{ touchControls[key]=false; }));
  });
}
