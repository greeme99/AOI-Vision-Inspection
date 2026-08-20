/**
 * Web Audio API를 활용한 무지연(Zero-latency) 검사 판정 사운드 신디사이저
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * 사운드 활성화/비활성화 설정
 */
export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * 합격 (OK) 차임음 재생: 맑고 경쾌한 C-E-G 메이저 코드 화음
 */
export function playOkSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.07);

      gain.gain.setValueAtTime(0, now + index * 0.07);
      gain.gain.linearRampToValueAtTime(0.18, now + index * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.3);
    });
  } catch (e) {
    console.warn("AudioContext play error:", e);
  }
}

/**
 * 불합격 (NG) 경고음 재생: 뚜렷하고 강한 2회 펄스 경고음
 */
export function playNgSound() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pulses = [0, 0.15]; // 2회 비프

    pulses.forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now + offset); // A3
      osc.frequency.exponentialRampToValueAtTime(140, now + offset + 0.12);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.22, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.14);
    });
  } catch (e) {
    console.warn("AudioContext play error:", e);
  }
}
