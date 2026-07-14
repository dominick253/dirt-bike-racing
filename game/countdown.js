/**
 * Countdown System — 3-2-1-GO countdown sequence with visual/audio effects
 */

export function start(onComplete) {
  const display = document.getElementById('countdown-display');
  if (!display) return;
  
  let count = 3;
  
  function showNumber() {
    if (count > 0) {
      display.textContent = count.toString();
      display.className = 'show';
      
      // Audio cue for countdown beep
      playBeep(count * 100, 0.15);
      
      setTimeout(() => {
        display.className = '';
        count--;
        showNumber();
      }, 900);
    } else {
      // GO! moment
      display.textContent = 'GO!';
      display.className = 'show';
      
      // Special GO sound — higher pitch, louder
      playBeep(800, 0.3);
      playBeep(1200, 0.15);
      
      setTimeout(() => {
        display.className = '';
        onComplete();
      }, 800);
    }
  }
  
  showNumber();
}

function playBeep(frequency, duration) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio not available — continue silently
  }
}
