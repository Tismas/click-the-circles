import "./style.css";
import { game } from "./game/gameInstance";
import { RenderSystem } from "./systems/RenderSystem";
import { ClickSystem } from "./systems/ClickSystem";
import { FloatingTextSystem } from "./systems/FloatingTextSystem";
import { HudSystem } from "./systems/HudSystem";
import { CircleLifecycleSystem } from "./systems/CircleLifecycleSystem";
import { ShopSystem } from "./systems/ShopSystem";
import { PassiveIncomeSystem } from "./systems/PassiveIncomeSystem";
import { MovementSystem } from "./systems/MovementSystem";
import { CollisionSystem } from "./systems/CollisionSystem";
import { ParticleSystem } from "./systems/ParticleSystem";
import { TutorialSystem } from "./systems/TutorialSystem";
import { SpikeSystem } from "./systems/SpikeSystem";
import { initializeUpgrades } from "./game/Upgrades";
import { loadGame, saveGame, spawnEntities } from "./game/SaveManager";

initializeUpgrades();

game.addSystem(new ClickSystem(game));
game.addSystem(new CircleLifecycleSystem(game));
game.addSystem(new PassiveIncomeSystem(game));
game.addSystem(new MovementSystem(game));
game.addSystem(new CollisionSystem(game));
game.addSystem(new SpikeSystem(game));
game.addSystem(new RenderSystem(game));
game.addSystem(new ParticleSystem(game));
game.addSystem(new HudSystem(game));
game.addSystem(new FloatingTextSystem(game));
game.addSystem(new ShopSystem(game));

const tutorialSystem = new TutorialSystem(game);
game.addSystem(tutorialSystem);

const loaded = loadGame();
if (!loaded) {
  spawnEntities();
}

tutorialSystem.init();

setInterval(() => {
  saveGame();
}, 30000);

game.start();
