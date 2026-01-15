import { System } from "../ecs/System";
import type { Game } from "../game/Game";
import { eventBus } from "../events/EventBus";

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

function spawnParticle(config: {
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

function spawnParticleBurst(config: {
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

function spawnClickParticles(x: number, y: number): void {
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

function spawnDeathParticles(x: number, y: number, color: string): void {
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

function spawnBallHitParticles(x: number, y: number): void {
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

interface LightningSegment {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  lifetime: number;
  maxLifetime: number;
}

const lightningSegments: LightningSegment[] = [];

function spawnLightningSegments(
  segments: { fromX: number; fromY: number; toX: number; toY: number }[]
): void {
  const lifetime = 200;
  for (const seg of segments) {
    lightningSegments.push({
      ...seg,
      lifetime,
      maxLifetime: lifetime,
    });
  }
}

export class ParticleSystem extends System {
  constructor(game: Game) {
    super(game);
    eventBus.on("circleClicked", ({ clickX, clickY }) =>
      spawnClickParticles(clickX, clickY)
    );
    eventBus.on("circleKilled", ({ x, y, color }) =>
      spawnDeathParticles(x, y, color)
    );
    eventBus.on("circleCollided", ({ collisionX, collisionY }) =>
      spawnBallHitParticles(collisionX, collisionY)
    );
    eventBus.on("chainLightning", ({ segments }) =>
      spawnLightningSegments(segments)
    );
  }

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

    for (let i = lightningSegments.length - 1; i >= 0; i--) {
      lightningSegments[i].lifetime -= dt;
      if (lightningSegments[i].lifetime <= 0) {
        lightningSegments.splice(i, 1);
      }
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

    this.renderLightning(ctx);
  }

  private renderLightning(ctx: CanvasRenderingContext2D): void {
    for (const seg of lightningSegments) {
      const alpha = seg.lifetime / seg.maxLifetime;

      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 15;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      this.drawLightningBolt(ctx, seg.fromX, seg.fromY, seg.toX, seg.toY);
      ctx.stroke();

      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      this.drawLightningBolt(ctx, seg.fromX, seg.fromY, seg.toX, seg.toY);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawLightningBolt(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    const segments = 5;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    const jitter = 15;

    ctx.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
      const px = x1 + dx * i + (Math.random() - 0.5) * jitter;
      const py = y1 + dy * i + (Math.random() - 0.5) * jitter;
      ctx.lineTo(px, py);
    }

    ctx.lineTo(x2, y2);
  }
}
