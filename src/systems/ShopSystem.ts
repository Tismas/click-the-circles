import { System } from "../ecs/System";
import type { Game } from "../game/Game";
import {
  upgradeDefinitions,
  getUpgradeLevel,
  isUpgradeMaxed,
  isUpgradeUnlocked,
  getUpgradeCost,
  canAffordUpgrade,
  purchaseUpgrade,
  initializeUpgrades,
  type UpgradeDefinition,
  type UpgradeBranch,
  type UpgradeId,
} from "../game/Upgrades";
import { gameState, resetGameState } from "../game/GameState";
import { soundManager } from "../audio/SoundManager";
import { saveGame, clearSaveData, spawnEntities } from "../game/SaveManager";
import { clearAllEntities } from "../ecs/Component";
import { eventBus } from "../events/EventBus";

const TILE_SIZE = 64;
const TILE_GAP = 80;
const SUB_OFFSET = 80;
const BUTTON_SIZE = 50;

interface TilePosition {
  x: number;
  y: number;
  def: UpgradeDefinition;
}

const RESET_BUTTON_WIDTH = 100;
const RESET_BUTTON_HEIGHT = 30;

export class ShopSystem extends System {
  private _isOpen: boolean = false;
  private tilePositions: TilePosition[] = [];

  get isOpen(): boolean {
    return this._isOpen;
  }

  private setOpen(open: boolean): void {
    if (open && !this._isOpen) {
      eventBus.emit("shopOpened");
    }
    this._isOpen = open;
  }
  private hoveredUpgrade: UpgradeDefinition | null = null;
  private isButtonHovered: boolean = false;
  private isResetButtonHovered: boolean = false;
  private showResetConfirm: boolean = false;
  private buttonX: number = 0;
  private buttonY: number = 0;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isHoveringCircle: boolean = false;
  private lastTileCalcWidth: number = 0;
  private lastTileCalcHeight: number = 0;
  private flashTimers = new Map<UpgradeId, number>();
  private maxedTimers = new Map<UpgradeId, number>();
  private readonly FLASH_DURATION = 300;
  private readonly MAXED_EFFECT_DURATION = 1000;

  constructor(game: Game) {
    super(game);
    window.addEventListener("keydown", this.handleKeyDown);
    this.game.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.game.canvas.addEventListener("click", this.handleClick);
    this.game.canvas.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    this.game.canvas.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    window.addEventListener("resize", this.handleResize);
    this.updatePositions();
    
    eventBus.on("circleHoverChanged", ({ isHovering }) => {
      this.isHoveringCircle = isHovering;
      this.updateCursor();
    });
  }

  private handleTouchStart = (e: TouchEvent): void => {
    const touch = e.touches[0];
    if (!touch) return;
    this.mouseX = touch.clientX;
    this.mouseY = touch.clientY;
    this.isButtonHovered = this.checkButtonHover();
    this.isResetButtonHovered = this.checkResetButtonHover();
    this.updateHoveredUpgrade();
    this.handleClick(e as unknown as MouseEvent);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    const touch = e.touches[0];
    if (!touch) return;
    this.mouseX = touch.clientX;
    this.mouseY = touch.clientY;
    this.isButtonHovered = this.checkButtonHover();
    this.isResetButtonHovered = this.checkResetButtonHover();
    this.updateHoveredUpgrade();
  };

  private handleResize = (): void => {
    this.updatePositions();
  };

  private updatePositions(): void {
    this.buttonX = this.game.canvas.width - BUTTON_SIZE - 20;
    this.buttonY = this.game.canvas.height - BUTTON_SIZE - 20;
    this.calculateTilePositions();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Tab" || e.key === "s" || e.key === "S") {
      e.preventDefault();
      this.setOpen(!this._isOpen);
      this.showResetConfirm = false;
    }
  };

  private handleClick = (_e: MouseEvent): void => {
    if (!this._isOpen) {
      if (this.isButtonHovered) {
        this.setOpen(true);
      }
      return;
    }

    if (this.isResetButtonHovered) {
      if (this.showResetConfirm) {
        this.performReset();
        this.showResetConfirm = false;
      } else {
        this.showResetConfirm = true;
      }
      return;
    }

    this.showResetConfirm = false;

    if (this.hoveredUpgrade) {
      const result = purchaseUpgrade(this.hoveredUpgrade.id, gameState.money);
      if (result.success) {
        gameState.money -= result.cost;
        this.flashTimers.set(this.hoveredUpgrade.id, this.FLASH_DURATION);
        soundManager.play("purchase");

        eventBus.emit("upgradePurchased");

        if (isUpgradeMaxed(this.hoveredUpgrade.id)) {
          this.triggerMaxedEffect(this.hoveredUpgrade.id);
        }

        saveGame();
      }
    }
  };

  private triggerMaxedEffect(id: UpgradeId): void {
    this.maxedTimers.set(id, this.MAXED_EFFECT_DURATION);
  }

  private performReset(): void {
    clearSaveData();
    clearAllEntities();
    resetGameState();
    initializeUpgrades();
    spawnEntities();
    eventBus.emit("gameReset");
    this.setOpen(false);
  }

  private handleMouseMove = (e: MouseEvent): void => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    this.isButtonHovered = this.checkButtonHover();
    this.isResetButtonHovered = this.checkResetButtonHover();
    this.updateHoveredUpgrade();
    this.updateCursor();
  };

  private updateHoveredUpgrade(): void {
    if (!this.isOpen) {
      this.hoveredUpgrade = null;
      return;
    }

    this.hoveredUpgrade = null;
    for (const tile of this.tilePositions) {
      const halfSize = TILE_SIZE / 2;
      if (
        this.mouseX >= tile.x - halfSize &&
        this.mouseX <= tile.x + halfSize &&
        this.mouseY >= tile.y - halfSize &&
        this.mouseY <= tile.y + halfSize
      ) {
        this.hoveredUpgrade = tile.def;
        break;
      }
    }
  }

  private checkButtonHover(): boolean {
    return (
      this.mouseX >= this.buttonX &&
      this.mouseX <= this.buttonX + BUTTON_SIZE &&
      this.mouseY >= this.buttonY &&
      this.mouseY <= this.buttonY + BUTTON_SIZE
    );
  }

  private checkResetButtonHover(): boolean {
    if (!this.isOpen) return false;
    const resetX = 20;
    const resetY = this.game.canvas.height - 60;
    return (
      this.mouseX >= resetX &&
      this.mouseX <= resetX + RESET_BUTTON_WIDTH &&
      this.mouseY >= resetY &&
      this.mouseY <= resetY + RESET_BUTTON_HEIGHT
    );
  }

  private updateCursor(): void {
    if (
      this.isButtonHovered ||
      this.hoveredUpgrade ||
      this.isHoveringCircle ||
      this.isResetButtonHovered
    ) {
      this.game.canvas.style.cursor = "pointer";
    } else {
      this.game.canvas.style.cursor = "default";
    }
  }

  private calculateTilePositions(): void {
    const width = this.game.canvas.width;
    const height = this.game.canvas.height;

    if (
      width === this.lastTileCalcWidth &&
      height === this.lastTileCalcHeight
    ) {
      return;
    }

    this.lastTileCalcWidth = width;
    this.lastTileCalcHeight = height;
    this.tilePositions = [];
    const centerX = width / 2;
    const centerY = height / 2;

    for (const def of upgradeDefinitions) {
      const pos = this.getBranchPosition(
        def.branch,
        def.position,
        def.subPosition ?? 0,
        centerX,
        centerY
      );
      this.tilePositions.push({ x: pos.x, y: pos.y, def });
    }
  }

  private getBranchPosition(
    branch: UpgradeBranch,
    position: number,
    subPosition: number,
    centerX: number,
    centerY: number
  ): { x: number; y: number } {
    const offset = (position + 1) * TILE_GAP;
    const subOffset = subPosition * SUB_OFFSET;

    switch (branch) {
      case "right":
        return { x: centerX + offset, y: centerY + subOffset };
      case "left":
        return { x: centerX - offset, y: centerY + subOffset };
      case "top":
        return { x: centerX + subOffset, y: centerY - offset };
      case "bottom":
        return { x: centerX + subOffset, y: centerY + offset };
    }
  }

  update(dt: number): void {
    for (const [id, time] of this.flashTimers) {
      const newTime = time - dt;
      if (newTime <= 0) {
        this.flashTimers.delete(id);
      } else {
        this.flashTimers.set(id, newTime);
      }
    }

    for (const [id, time] of this.maxedTimers) {
      const newTime = time - dt;
      if (newTime <= 0) {
        this.maxedTimers.delete(id);
      } else {
        this.maxedTimers.set(id, newTime);
      }
    }
  }

  render(): void {
    if (!this.isOpen) {
      this.drawShopButton();
      return;
    }

    const ctx = this.game.ctx;
    const width = this.game.canvas.width;
    const height = this.game.canvas.height;

    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, width, height);

    this.drawConnectionLines(ctx);

    for (const tile of this.tilePositions) {
      this.drawUpgradeTile(ctx, tile);
    }

    if (this.hoveredUpgrade) {
      this.drawTooltip(ctx);
    }

    this.drawResetButton(ctx);

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Press TAB or S to close", width / 2, height - 30);
  }

  private drawResetButton(ctx: CanvasRenderingContext2D): void {
    const resetX = 20;
    const resetY = this.game.canvas.height - 60;

    if (this.showResetConfirm) {
      ctx.fillStyle = "#ff4444";
    } else if (this.isResetButtonHovered) {
      ctx.fillStyle = "#666666";
    } else {
      ctx.fillStyle = "#333333";
    }

    ctx.beginPath();
    ctx.roundRect(resetX, resetY, RESET_BUTTON_WIDTH, RESET_BUTTON_HEIGHT, 5);
    ctx.fill();

    ctx.strokeStyle = this.showResetConfirm ? "#ff6666" : "#555555";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = this.showResetConfirm ? "Confirm Reset?" : "New Game";
    ctx.fillText(
      text,
      resetX + RESET_BUTTON_WIDTH / 2,
      resetY + RESET_BUTTON_HEIGHT / 2
    );
  }

  private drawShopButton(): void {
    const ctx = this.game.ctx;

    if (this.isButtonHovered) {
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = "#1a1a2e";
    }
    ctx.beginPath();
    ctx.roundRect(this.buttonX, this.buttonY, BUTTON_SIZE, BUTTON_SIZE, 10);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "bold 14px Arial";
    if (this.isButtonHovered) {
      ctx.fillStyle = "#1a1a2e";
    } else {
      ctx.fillStyle = "#ffffff";
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "SHOP",
      this.buttonX + BUTTON_SIZE / 2,
      this.buttonY + BUTTON_SIZE / 2
    );
  }

  private drawConnectionLines(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 3;

    const halfSize = TILE_SIZE / 2;

    for (const tile of this.tilePositions) {
      const def = tile.def;
      if (!def.parent) continue;

      const parentTile = this.tilePositions.find(
        (t) => t.def.id === def.parent
      );
      if (!parentTile) continue;

      const dx = tile.x - parentTile.x;
      const dy = tile.y - parentTile.y;

      let startX = parentTile.x;
      let startY = parentTile.y;
      let endX = tile.x;
      let endY = tile.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        startX = parentTile.x + Math.sign(dx) * halfSize;
        endX = tile.x - Math.sign(dx) * halfSize;
      } else {
        startY = parentTile.y + Math.sign(dy) * halfSize;
        endY = tile.y - Math.sign(dy) * halfSize;
      }

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  private drawUpgradeTile(
    ctx: CanvasRenderingContext2D,
    tile: TilePosition
  ): void {
    const { x, y, def } = tile;
    const halfSize = TILE_SIZE / 2;
    const isHovered = this.hoveredUpgrade === def;

    const unlocked = isUpgradeUnlocked(def.id);
    const maxed = isUpgradeMaxed(def.id);

    const affordable = canAffordUpgrade(def.id, gameState.money);

    let borderColor: string;
    let bgColor: string;

    if (maxed) {
      borderColor = "#22c55e";
      bgColor = "rgba(34, 197, 94, 0.2)";
    } else if (unlocked && affordable) {
      borderColor = "#facc15";
      bgColor = "rgba(250, 204, 21, 0.2)";
    } else if (unlocked) {
      borderColor = "#9ca3af";
      bgColor = "rgba(156, 163, 175, 0.2)";
    } else {
      borderColor = "#4b5563";
      bgColor = "rgba(75, 85, 99, 0.2)";
    }

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x - halfSize, y - halfSize, TILE_SIZE, TILE_SIZE, 8);
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isHovered ? 4 : 3;
    ctx.stroke();

    if (!unlocked) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fill();
    }

    const flashTime = this.flashTimers.get(def.id);
    if (flashTime !== undefined) {
      const flashAlpha = flashTime / this.FLASH_DURATION;
      ctx.fillStyle = `rgba(255, 255, 100, ${flashAlpha * 0.7})`;
      ctx.beginPath();
      ctx.roundRect(x - halfSize, y - halfSize, TILE_SIZE, TILE_SIZE, 8);
      ctx.fill();
    }

    const maxedTime = this.maxedTimers.get(def.id);
    if (maxedTime !== undefined) {
      this.drawMaxedEffect(ctx, x, y, maxedTime);
    }

    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = unlocked ? "#ffffff" : "#888888";
    ctx.fillText(def.icon, x, y);

    const level = getUpgradeLevel(def.id);
    if (def.maxLevel > 1) {
      ctx.font = "12px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${level}/${def.maxLevel}`, x, y + halfSize - 4);
    }
  }

  private drawMaxedEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    timeRemaining: number
  ): void {
    const progress = 1 - timeRemaining / this.MAXED_EFFECT_DURATION;
    const numRays = 8;
    const maxRadius = 60;
    const rayLength = 20;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(progress * Math.PI * 0.5);

    const radius = progress * maxRadius;
    const alpha = 1 - progress;

    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      const innerX = Math.cos(angle) * radius;
      const innerY = Math.sin(angle) * radius;
      const outerX = Math.cos(angle) * (radius + rayLength * (1 - progress));
      const outerY = Math.sin(angle) * (radius + rayLength * (1 - progress));

      ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.lineTo(outerX, outerY);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  private drawTooltip(ctx: CanvasRenderingContext2D): void {
    const def = this.hoveredUpgrade;
    if (!def) return;

    const tile = this.tilePositions.find((t) => t.def === def);
    if (!tile) return;

    const padding = 12;
    const maxWidth = 220;
    const lineHeight = 20;
    const sectionGap = 8;

    ctx.font = "14px Arial";
    const descriptionLines = this.wrapText(
      ctx,
      def.description,
      maxWidth - padding * 2
    );

    const titleLineCount = 1;
    const descLineCount = descriptionLines.length;
    const statsLineCount = 2;

    const tooltipHeight =
      padding * 2 +
      titleLineCount * lineHeight +
      sectionGap +
      descLineCount * lineHeight +
      sectionGap +
      statsLineCount * lineHeight;

    let tooltipX = tile.x + TILE_SIZE / 2 + 10;
    let tooltipY = tile.y - tooltipHeight / 2;

    if (tooltipX + maxWidth > this.game.canvas.width) {
      tooltipX = tile.x - TILE_SIZE / 2 - maxWidth - 10;
    }
    if (tooltipY < 10) {
      tooltipY = 10;
    }
    if (tooltipY + tooltipHeight > this.game.canvas.height - 10) {
      tooltipY = this.game.canvas.height - tooltipHeight - 10;
    }

    ctx.fillStyle = "rgba(30, 30, 50, 0.95)";
    ctx.beginPath();
    ctx.roundRect(tooltipX, tooltipY, maxWidth, tooltipHeight, 8);
    ctx.fill();

    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    let y = tooltipY + padding;

    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(def.name, tooltipX + padding, y);
    y += lineHeight + sectionGap;

    ctx.font = "14px Arial";
    ctx.fillStyle = "#cccccc";
    for (const line of descriptionLines) {
      ctx.fillText(line, tooltipX + padding, y);
      y += lineHeight;
    }
    y += sectionGap;

    ctx.fillText(
      `Level: ${getUpgradeLevel(def.id)}/${def.maxLevel}`,
      tooltipX + padding,
      y
    );
    y += lineHeight;

    if (isUpgradeMaxed(def.id)) {
      ctx.font = "bold 14px Arial";
      ctx.fillStyle = "#22c55e";
      ctx.fillText("MAXED", tooltipX + padding, y);
    } else {
      ctx.fillText(`Cost: $${getUpgradeCost(def.id)}`, tooltipX + padding, y);
    }
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }
}
