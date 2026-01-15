import { System } from "../ecs/System";
import { gameState } from "../game/GameState";
import { saveGame } from "../game/SaveManager";

const HINTS = [
  { trigger: "start", text: "Click circles to damage them and earn money!" },
  { trigger: "firstMoney", text: "Press TAB or S to open the Shop" },
  { trigger: "shopOpened", text: "Buy upgrades to increase your power!" },
] as const;

type HintTrigger = (typeof HINTS)[number]["trigger"];

let shownHints = new Set<string>();

export function getShownHints(): Set<string> {
  return shownHints;
}

export function setShownHints(hints: string[]): void {
  shownHints = new Set(hints);
}

export function clearShownHints(): void {
  shownHints = new Set();
}

export class TutorialSystem extends System {
  private currentHint: { trigger: HintTrigger; text: string } | null = null;
  private hintQueue: HintTrigger[] = [];

  init(): void {
    this.queueHint("start");
  }

  reset(): void {
    this.currentHint = null;
    this.hintQueue = [];
    this.queueHint("start");
  }

  private hasShownHint(trigger: HintTrigger): boolean {
    return shownHints.has(trigger);
  }

  private queueHint(trigger: HintTrigger): void {
    if (this.hasShownHint(trigger)) return;
    if (this.hintQueue.includes(trigger)) return;
    if (this.currentHint?.trigger === trigger) return;

    this.hintQueue.push(trigger);
    this.tryShowNextHint();
  }

  private tryShowNextHint(): void {
    if (this.currentHint) return;
    if (this.hintQueue.length === 0) return;

    const trigger = this.hintQueue.shift();
    if (!trigger) return;

    const hint = HINTS.find((h) => h.trigger === trigger);
    if (!hint) return;

    this.currentHint = { trigger, text: hint.text };
  }

  private clearCurrentHint(): void {
    if (this.currentHint) {
      shownHints.add(this.currentHint.trigger);
      this.currentHint = null;
      saveGame();
      this.tryShowNextHint();
    }
  }

  setShopOpened(opened: boolean): void {
    if (opened) {
      if (this.currentHint?.trigger === "firstMoney") {
        this.clearCurrentHint();
      }
      this.queueHint("shopOpened");
    }
  }

  notifyPurchase(): void {
    if (this.currentHint?.trigger === "shopOpened") {
      this.clearCurrentHint();
    }
  }

  update(_dt: number): void {
    if (gameState.money >= 1) {
      if (this.currentHint?.trigger === "start") {
        this.clearCurrentHint();
      }
      this.queueHint("firstMoney");
    }
  }

  render(): void {
    if (!this.currentHint) return;

    const ctx = this.game.ctx;
    const width = this.game.canvas.width;

    ctx.save();

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 200, 80, 400, 50, 10);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.currentHint.text, width / 2, 105);

    ctx.restore();
  }
}
