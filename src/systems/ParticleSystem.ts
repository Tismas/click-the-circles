import { System } from "../ecs/System";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
  gravity: number;
  friction: number;
}

const particles: Particle[] = [];

export function spawnParticle(config: {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  lifetime: number;
  gravity?: number;
  friction?: number;
}): void {
  particles.push({
    x: config.x,
    y: config.y,
    vx: config.vx,
    vy: config.vy,
    color: config.color,
    size: config.size,
    lifetime: config.lifetime,
    maxLifetime: config.lifetime,
    gravity: config.gravity ?? 0,
    friction: config.friction ?? 1,
  });
}

export function spawnParticleBurst(config: {
  x: number;
  y: number;
  count: number;
  color: string;
  speed: number;
  size: number;
  lifetime: number;
  gravity?: number;
  friction?: number;
  spread?: number;
}): void {
  const spread = config.spread ?? Math.PI * 2;
  const startAngle = -spread / 2;

  for (let i = 0; i < config.count; i++) {
    const angle = startAngle + Math.random() * spread;
    const speed = config.speed * (0.5 + Math.random() * 0.5);
    spawnParticle({
      x: config.x,
      y: config.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: config.color,
      size: config.size * (0.5 + Math.random() * 0.5),
      lifetime: config.lifetime * (0.7 + Math.random() * 0.3),
      gravity: config.gravity,
      friction: config.friction,
    });
  }
}

export function spawnClickParticles(x: number, y: number): void {
  spawnParticleBurst({
    x,
    y,
    count: 8,
    color: "#ffd700",
    speed: 150,
    size: 6,
    lifetime: 400,
    friction: 0.95,
  });
}

export function spawnDeathParticles(x: number, y: number, color: string): void {
  spawnParticleBurst({
    x,
    y,
    count: 20,
    color,
    speed: 250,
    size: 10,
    lifetime: 600,
    gravity: 200,
    friction: 0.98,
  });

  spawnParticleBurst({
    x,
    y,
    count: 10,
    color: "#ffffff",
    speed: 180,
    size: 5,
    lifetime: 400,
    gravity: 150,
    friction: 0.96,
  });
}

export function spawnBallHitParticles(x: number, y: number): void {
  spawnParticleBurst({
    x,
    y,
    count: 6,
    color: "#ffff88",
    speed: 120,
    size: 4,
    lifetime: 300,
    friction: 0.92,
  });
}

export class ParticleSystem extends System {
  update(dt: number): void {
    const dtSeconds = dt / 1000;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.lifetime -= dt;
      if (p.lifetime <= 0) {
        particles.splice(i, 1);
        continue;
      }

      p.vy += p.gravity * dtSeconds;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x += p.vx * dtSeconds;
      p.y += p.vy * dtSeconds;
    }
  }

  render(): void {
    const ctx = this.game.ctx;

    for (const p of particles) {
      const alpha = p.lifetime / p.maxLifetime;
      const size = p.size * (0.5 + alpha * 0.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
