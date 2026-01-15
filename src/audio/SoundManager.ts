type SoundType = "click" | "death" | "purchase" | "ballHit" | "ballBounce";

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.3;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  private createOscillator(
    frequency: number,
    type: OscillatorType,
    duration: number,
    volume: number = 1
  ): void {
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    const finalVolume = volume * this.masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  private createNoise(duration: number, volume: number = 1): void {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gainNode = ctx.createGain();
    const finalVolume = volume * this.masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
  }

  play(sound: SoundType): void {
    switch (sound) {
      case "click":
        this.playClick();
        break;
      case "death":
        this.playDeath();
        break;
      case "purchase":
        this.playPurchase();
        break;
      case "ballHit":
        this.playBallHit();
        break;
      case "ballBounce":
        this.playBallBounce();
        break;
    }
  }

  private playClick(): void {
    this.createOscillator(800, "sine", 0.08, 0.4);
    this.createOscillator(400, "sine", 0.05, 0.2);
  }

  private playDeath(): void {
    const ctx = this.getContext();
    const baseFreq = 150 + Math.random() * 50;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      40,
      ctx.currentTime + 0.3
    );

    const finalVolume = 0.3 * this.masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);

    this.createNoise(0.15, 0.3);
  }

  private playPurchase(): void {
    const ctx = this.getContext();

    const frequencies = [523, 659, 784];
    frequencies.forEach((freq, i) => {
      const delay = i * 0.08;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      const finalVolume = 0.3 * this.masterVolume;
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + 0.2
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + 0.2);
    });
  }

  private playBallHit(): void {
    this.createOscillator(1200, "sine", 0.06, 0.3);
    this.createOscillator(600, "triangle", 0.08, 0.2);
  }

  private playBallBounce(): void {
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      100,
      ctx.currentTime + 0.1
    );

    const finalVolume = 0.2 * this.masterVolume;
    gainNode.gain.setValueAtTime(finalVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.masterVolume;
  }
}

export const soundManager = new SoundManager();
