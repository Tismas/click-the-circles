import type { Game } from "../game/Game";

export abstract class System {
  protected game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  fixedUpdate(): void {}
  update(_dt: number): void {}
  render(): void {}
}
