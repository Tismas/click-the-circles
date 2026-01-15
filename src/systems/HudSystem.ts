import { System } from "../ecs/System";
import { gameState } from "../game/GameState";

export class HudSystem extends System {
  render(): void {
    const ctx = this.game.ctx;

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";

    const moneyText = `$${Math.floor(gameState.money)}`;
    ctx.fillText(moneyText, this.game.canvas.width - 20, 20);
  }
}
