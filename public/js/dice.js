/**
 * Dice & Sound Effects Module - Lucky Table Tài Xỉu
 * Quản lý sinh xúc xắc, hiệu ứng xoay 3D và âm thanh Web Audio API
 */

import { Storage } from './storage.js';

// Web Audio Context Singleton
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const Sound = {
  playChip() {
    if (typeof window === 'undefined' || !Storage.isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      // Ignore audio error
    }
  },

  playShake(durationMs = 1500) {
    if (typeof window === 'undefined' || !Storage.isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const bufferSize = ctx.sampleRate * (durationMs / 1000);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (durationMs / 1000));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + (durationMs / 1000));
    } catch (e) {
      // Ignore audio error
    }
  },

  playWin() {
    if (typeof window === 'undefined' || !Storage.isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
      });
    } catch (e) {
      // Ignore
    }
  },

  playLose() {
    if (typeof window === 'undefined' || !Storage.isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [440, 370, 311];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.25);
      });
    } catch (e) {
      // Ignore
    }
  },

  playOpenCup() {
    if (typeof window === 'undefined' || !Storage.isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {
      // Ignore
    }
  },

  playTick() {
    if (typeof window === 'undefined' || !Storage.isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Ignore
    }
  }
};

export const DiceManager = {
  /**
   * Sinh số ngẫu nhiên an toàn cho 1 viên xúc xắc (1-6)
   */
  rollSingleDie() {
    const cryptoObj = (typeof globalThis !== 'undefined' && globalThis.crypto) || (typeof window !== 'undefined' && window.crypto);
    if (cryptoObj && cryptoObj.getRandomValues) {
      const arr = new Uint32Array(1);
      cryptoObj.getRandomValues(arr);
      return (arr[0] % 6) + 1;
    }
    return Math.floor(Math.random() * 6) + 1;
  },

  /**
   * Sinh kết quả ngẫu nhiên 3 viên xúc xắc
   * @returns {[number, number, number]}
   */
  rollThreeDice() {
    return [
      this.rollSingleDie(),
      this.rollSingleDie(),
      this.rollSingleDie()
    ];
  },

  /**
   * Sinh xúc xắc tự nhiên theo cửa mong muốn (Smart Pity Engine)
   */
  rollDiceWithTarget(targetDoor) {
    for (let i = 0; i < 50; i++) {
      const dice = this.rollThreeDice();
      const evalRes = this.evaluateResult(dice);
      if (evalRes.result === targetDoor) return dice;
    }
    return targetDoor === 'tai' ? [4, 5, 3] : [2, 3, 2];
  },

  /**
   * Đánh giá kết quả Tài Xỉu
   * - Xỉu: 3 đến 9
   * - Tài: 10 đến 18
   * @param {Array<number>} dice 
   * @returns {{ sum: number, result: 'tai' | 'xiu', label: string }}
   */
  evaluateResult(dice) {
    const sum = dice[0] + dice[1] + dice[2];
    const isTai = sum >= 10 && sum <= 18;
    return {
      sum,
      result: isTai ? 'tai' : 'xiu',
      label: isTai ? 'TÀI' : 'XỈU'
    };
  },

  /**
   * Góc quay 3D tương ứng cho từng mặt xúc xắc
   */
  getFaceRotation(faceValue) {
    switch (faceValue) {
      case 1:
        return { x: 0, y: 0 };
      case 2:
        return { x: -90, y: 0 };
      case 3:
        return { x: 0, y: -90 };
      case 4:
        return { x: 0, y: 90 };
      case 5:
        return { x: 90, y: 0 };
      case 6:
        return { x: 0, y: 180 };
      default:
        return { x: 0, y: 0 };
    }
  },

  /**
   * Tạo HTML cho 1 viên xúc xắc 3D 6 mặt
   * @param {number} index
   */
  createDieElement(index) {
    if (typeof document === 'undefined') return null;
    const die = document.createElement('div');
    die.className = 'die-cube';
    die.id = `die-${index}`;
    die.dataset.index = index;

    die.innerHTML = `
      <div class="die-face face-1">
        <span class="pip pip-center red"></span>
      </div>
      <div class="die-face face-2">
        <span class="pip pip-top-left"></span>
        <span class="pip pip-bottom-right"></span>
      </div>
      <div class="die-face face-3">
        <span class="pip pip-top-left"></span>
        <span class="pip pip-center"></span>
        <span class="pip pip-bottom-right"></span>
      </div>
      <div class="die-face face-4">
        <span class="pip pip-top-left red"></span>
        <span class="pip pip-top-right red"></span>
        <span class="pip pip-bottom-left red"></span>
        <span class="pip pip-bottom-right red"></span>
      </div>
      <div class="die-face face-5">
        <span class="pip pip-top-left"></span>
        <span class="pip pip-top-right"></span>
        <span class="pip pip-center"></span>
        <span class="pip pip-bottom-left"></span>
        <span class="pip pip-bottom-right"></span>
      </div>
      <div class="die-face face-6">
        <span class="pip pip-top-left"></span>
        <span class="pip pip-top-right"></span>
        <span class="pip pip-mid-left"></span>
        <span class="pip pip-mid-right"></span>
        <span class="pip pip-bottom-left"></span>
        <span class="pip pip-bottom-right"></span>
      </div>
    `;

    return die;
  },

  /**
   * Đặt xúc xắc hiển thị mặt cụ thể với animation xoay
   * @param {HTMLElement} dieEl 
   * @param {number} faceValue 
   * @param {boolean} animate 
   */
  setDieFace(dieEl, faceValue, animate = true) {
    if (!dieEl) return;
    const baseRot = this.getFaceRotation(faceValue);
    if (!animate) {
      dieEl.style.transition = 'none';
      dieEl.style.transform = `rotateX(${baseRot.x}deg) rotateY(${baseRot.y}deg)`;
      return;
    }

    const extraTurnsX = (Math.floor(Math.random() * 3) + 2) * 360;
    const extraTurnsY = (Math.floor(Math.random() * 3) + 2) * 360;

    dieEl.style.transition = 'transform 1.2s cubic-bezier(0.2, 0.8, 0.3, 1)';
    dieEl.style.transform = `rotateX(${baseRot.x + extraTurnsX}deg) rotateY(${baseRot.y + extraTurnsY}deg)`;
  }
};
