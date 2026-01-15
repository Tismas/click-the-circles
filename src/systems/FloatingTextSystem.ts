import { System } from "../ecs/System";
import type { Game } from "../game/Game";
import { eventBus } from "../events/EventBus";
import { formatMoney } from "../utils/format";

interface FloatingText {
  x: number;
  y: number;
  startY: number;
  text: string;
  color: string;
  lifetime: number;
  maxLifetime: number;
  velocityY: number;
}

const floatingTexts: FloatingText[] = [];

function easeOutBounce(x: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}

function spawnFloatingText(
  x: number,
  y: number,
  text: string,
  color: string
): void {
  floatingTexts.push({
    x: x + (Math.random() - 0.5) * 20,
    y,
    startY: y,
    text,
    color,
    lifetime: 1000,
    maxLifetime: 1000,
    velocityY: -120,
  });
}

export class FloatingTextSystem extends System {
  constructor(game: Game) {
    super(game);
    eventBus.on("circleClicked", ({ circleX, circleY, damage }) => {
      spawnFloatingText(circleX, circleY, `+${formatMoney(damage)}`, "#ffd700");
    });
    eventBus.on("circleCollided", ({ circleX, circleY, circleRadius, damage }) => {
      spawnFloatingText(circleX, circleY - circleRadius - 10, `+${formatMoney(damage)}`, "#ffdd44");
    });
    eventBus.on("circleKilled", ({ x, y, bonusMoney }) => {
      if (bonusMoney > 0) {
        spawnFloatingText(x, y - 40, `+${formatMoney(bonusMoney)} BONUS!`, "#00ff88");
      }
    });
  }
  update(dt: number): void {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.lifetime -= dt;
      ft.y += (ft.velocityY * dt) / 1000;
      ft.velocityY += (150 * dt) / 1000;

      if (ft.lifetime <= 0) {
        floatingTexts.splice(i, 1);
      }
    }
  }

  render(): void {
    const ctx = this.game.ctx;

    for (const ft of floatingTexts) {
      const progress = 1 - ft.lifetime / ft.maxLifetime;
      const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
      
      const scaleProgress = Math.min(1, progress * 4);
      const bounceScale = easeOutBounce(scaleProgress);
      const baseScale = 0.5 + bounceScale * 0.5;
      const fadeScale = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
      const scale = baseScale * (0.8 + fadeScale * 0.2);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${Math.floor(26 * scale)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
