import { System } from "../ecs/System";

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  lifetime: number;
  maxLifetime: number;
  velocityY: number;
}

const floatingTexts: FloatingText[] = [];

export function spawnFloatingText(
  x: number,
  y: number,
  text: string,
  color: string
): void {
  floatingTexts.push({
    x,
    y,
    text,
    color,
    lifetime: 1000,
    maxLifetime: 1000,
    velocityY: -80,
  });
}

export class FloatingTextSystem extends System {
  update(dt: number): void {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.lifetime -= dt;
      ft.y += (ft.velocityY * dt) / 1000;

      if (ft.lifetime <= 0) {
        floatingTexts.splice(i, 1);
      }
    }
  }

  render(): void {
    const ctx = this.game.ctx;

    for (const ft of floatingTexts) {
      const alpha = Math.max(0, ft.lifetime / ft.maxLifetime);
      const scale = 0.8 + alpha * 0.4;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${Math.floor(24 * scale)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
