import "./style.css";
import { game } from "./game/gameInstance";
import { RenderSystem } from "./systems/RenderSystem";
import { ClickSystem } from "./systems/ClickSystem";
import { FloatingTextSystem } from "./systems/FloatingTextSystem";
import { HudSystem } from "./systems/HudSystem";
import { CircleLifecycleSystem } from "./systems/CircleLifecycleSystem";
import { ShopSystem } from "./systems/ShopSystem";
import { PassiveIncomeSystem } from "./systems/PassiveIncomeSystem";
import { initializeUpgrades } from "./game/Upgrades";
import { spawnCircle } from "./utils/spawn";

initializeUpgrades();

const clickSystem = new ClickSystem(game);
const shopSystem = new ShopSystem(game);
shopSystem.setClickSystem(clickSystem);

game.addSystem(clickSystem);
game.addSystem(new CircleLifecycleSystem(game));
game.addSystem(new PassiveIncomeSystem(game));
game.addSystem(new RenderSystem(game));
game.addSystem(new HudSystem(game));
game.addSystem(new FloatingTextSystem(game));
game.addSystem(shopSystem);

spawnCircle(game.canvas.width, game.canvas.height);

game.start();
