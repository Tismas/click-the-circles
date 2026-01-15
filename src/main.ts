import "./style.css";
import { Game } from "./game/Game";
import { RenderSystem } from "./systems/RenderSystem";
import { ClickSystem } from "./systems/ClickSystem";
import { createEntity } from "./ecs/Entity";
import { addComponent } from "./ecs/Component";

const game = new Game();

game.addSystem(new ClickSystem(game));
game.addSystem(new RenderSystem(game));

const testCircle = createEntity();
addComponent(testCircle, "position", {
  x: game.canvas.width / 2,
  y: game.canvas.height / 2,
});
addComponent(testCircle, "circle", {
  radius: 60,
  color: "#ff6b6b",
  outlineColor: "#ffffff",
  outlineWidth: 4,
});
addComponent(testCircle, "health", {
  current: 10,
  max: 10,
});
addComponent(testCircle, "clickable", {
  radius: 60,
});

game.start();
