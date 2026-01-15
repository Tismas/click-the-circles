import "./style.css";
import { Game } from "./game/Game";
import { RenderSystem } from "./systems/RenderSystem";
import { ClickSystem } from "./systems/ClickSystem";
import { FloatingTextSystem } from "./systems/FloatingTextSystem";
import { HudSystem } from "./systems/HudSystem";
import { CircleLifecycleSystem } from "./systems/CircleLifecycleSystem";
import { ShopSystem } from "./systems/ShopSystem";
import { createEntity } from "./ecs/Entity";
import { addComponent } from "./ecs/Component";
import { getRandomCirclePosition } from "./utils/spawn";
import { initializeUpgrades } from "./game/Upgrades";

initializeUpgrades();

const game = new Game();

const clickSystem = new ClickSystem(game);
const shopSystem = new ShopSystem(game);
shopSystem.setClickSystem(clickSystem);

game.addSystem(clickSystem);
game.addSystem(new CircleLifecycleSystem(game));
game.addSystem(new RenderSystem(game));
game.addSystem(new HudSystem(game));
game.addSystem(new FloatingTextSystem(game));
game.addSystem(shopSystem);

const circleRadius = 60;
const initialPos = getRandomCirclePosition(
  game.canvas.width,
  game.canvas.height,
  circleRadius
);

const testCircle = createEntity();
addComponent(testCircle, "position", initialPos);
addComponent(testCircle, "circle", {
  radius: circleRadius,
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
