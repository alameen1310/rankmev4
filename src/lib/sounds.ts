// Web Audio API-based sound effects for game feel
// No external files needed - generates tones programmatically

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('rankme_sounds', enabled ? '1' : '0');
  }

  isEnabled(): boolean {
    const saved = localStorage.getItem('rankme_sounds');
    if (saved !== null) this.enabled = saved === '1';
    return this.enabled;
  }

  // Correct answer: bright rising ding
  playCorrect() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.08); // G5
      osc.frequency.exponentialRampToValueAtTime(1047, ctx.currentTime + 0.15); // C6
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  // Wrong answer: low buzz
  playWrong() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  // Streak fire: ascending triple ding
  playStreak() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getCtx();
      const notes = [659, 784, 1047]; // E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch {}
  }

  // Victory fanfare: triumphant chord progression
  playVictory() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getCtx();
      const chords = [
        [523, 659, 784],    // C major
        [587, 740, 880],    // D major  
        [659, 830, 988],    // E major
        [784, 988, 1175],   // G major (resolve)
      ];
      chords.forEach((chord, ci) => {
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = ci === 3 ? 'sine' : 'triangle';
          osc.frequency.value = freq;
          const t = ctx.currentTime + ci * 0.2;
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.setValueAtTime(0.12, t + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, t + (ci === 3 ? 0.6 : 0.19));
          osc.start(t);
          osc.stop(t + (ci === 3 ? 0.6 : 0.2));
        });
      });
    } catch {}
  }

  // Defeat: descending tone
  playDefeat() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }

  // Tap / click feedback: quick pop
  playTap() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  // Countdown beep
  playCountdown() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  // Match found: exciting alert
  playMatchFound() {
    if (!this.isEnabled()) return;
    try {
      const ctx = this.getCtx();
      [880, 1047, 1319].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
