# Click The Circles - Game Development Plan

## Overview

An incremental clicker game with ECS architecture. Single game screen with skill tree shop overlay. Cartoonish, colorful visual style with satisfying effects and sounds.

---

## Architecture

### ECS Structure

- **Entities**: Unique IDs representing game objects
- **Components**: Data-only classes (Position, Health, Velocity, Clickable, Visual, etc.)
- **Systems**: Logic processors (RenderSystem, ClickSystem, CollisionSystem, etc.)

### Core Modules

```
src/
├── main.ts              # Entry point, game loop
├── ecs/
│   ├── entity.ts        # Entity manager
│   ├── component.ts     # Component definitions
│   └── system.ts        # Base system class
├── systems/
│   ├── RenderSystem.ts
│   ├── ClickSystem.ts
│   ├── CollisionSystem.ts
│   ├── SpawnSystem.ts
│   ├── PassiveIncomeSystem.ts
│   └── ParticleSystem.ts
├── game/
│   ├── GameState.ts     # Global state (money, upgrades)
│   ├── UpgradeTree.ts   # Skill tree definitions
│   └── constants.ts     # Game balance values
├── ui/
│   ├── Shop.ts          # Skill tree UI
│   ├── HUD.ts           # Money display, etc.
│   └── Tooltip.ts       # Upgrade tooltips
├── audio/
│   └── SoundManager.ts  # Web Audio API sounds
└── utils/
    └── helpers.ts       # Utility functions
```

---

## Step-by-Step Implementation Plan

### Phase 1: Core Foundation ✅

Each step should be fully testable before moving on.

---

#### Step 1.1: Project Setup & Game Loop ✅

**Goal**: Basic canvas rendering with game loop

**Tasks**:

- Set up HTML canvas element (fullscreen)
- Create game loop with fixed timestep (60 FPS, 1 tick = 1/20 of a second)
- Implement delta time handling
- Add FPS counter for debugging

**Test**: Canvas shows, FPS counter

---

#### Step 1.2: ECS Core Implementation ✅

**Goal**: Basic ECS framework

**Tasks**:

- Create EntityManager (create, destroy, get entities)
- Create Component base structure with component types
- Create System base class with update method
- Implement component attachment/retrieval for entities

**Test**: Can create entity, attach components, retrieve them - show them in the console

---

#### Step 1.3: Basic Circle Rendering ✅

**Goal**: Render a single circle on screen

**Tasks**:

- Create components: `Position`, `Circle` (radius, color), `Renderable`
- Create `RenderSystem` that draws circles
- Spawn one test circle at center

**Test**: Single colorful circle visible at screen center

---

### Phase 2: Core Gameplay ✅

---

#### Step 2.1: Clickable Circles with Health ✅

**Goal**: Click circles to damage them

**Tasks**:

- Create `Health` component (current, max)
- Create `Clickable` component (radius for hit detection)
- Create `ClickSystem` that handles mouse clicks
- Implement point-in-circle collision detection
- Make circle readius based on it's health (the less health the smaller it is) and display current health inside the circle
- Visual feedback on click (scale pulse, color flash)

**Test**: Click circle → health decreases, visual feedback shows

---

#### Step 2.2: Money System ✅

**Goal**: Earn money from clicking

**Tasks**:

- Create `GameState` singleton with money property
- Award money = damage dealt on each click
- Create basic HUD showing money (top-right corner, large font)
- Add floating damage/money numbers on click

**Test**: Click circle → money increases, floating green "+1$" appears

---

#### Step 2.3: Circle Death & Respawn ✅

**Goal**: Circles die and respawn stronger

**Tasks**:

- Detect when health reaches 0
- Award bonus money = max health on death
- Respawn circle with 10% more max health
- Death visual effect (explosion particles)
- Respawn visual effect (grow-in animation)

**Test**: Kill circle → bonus money awarded → respawns with more health

---

#### Step 2.4: Multi-Circle Click Detection ✅

**Goal**: Clicks can hit multiple overlapping circles

**Tasks**:

- Modify ClickSystem to check ALL circles in click radius
- Damage all circles within click area
- Show combined floating numbers or multiple floaters

**Test**: Position circles to overlap → single click damages both

---

### Phase 3: Upgrade System Foundation ✅

---

#### Step 3.1: Upgrade Data Structure ✅

**Goal**: Define all upgrades in data

**Tasks**:

- Create `Upgrade` type with:
  - id, name, description, icon
  - maxLevel, currentLevel
  - baseCost, costMultiplier (if applicable)
  - unlockCondition (function or upgrade dependency)
  - effect (function called on purchase)
- Define upgrade tree structure (parent-child relationships)
- Create `UpgradeManager` to handle purchases and state

**Test**: Console log shows all upgrades with correct initial states

---

#### Step 3.2: Shop UI - Layout ✅

**Goal**: Skill tree visual layout

**Tasks**:

- Create shop overlay (semi-transparent background)
- Position upgrade nodes:
  - LEFT branch: Ball upgrades (expanding left from center)
  - TOP branch: Passive upgrades (expanding up)
  - RIGHT branch: Click/enemy upgrades (expanding right)
  - BOTTOM branch: QoL upgrades (expanding down)
- Draw connection lines between related upgrades
- Toggle shop with keyboard (e.g., Tab or S key) or a button in the bottom right corner

**Test**: Press Tab/click button → shop appears with placeholder boxes in cross pattern

---

#### Step 3.3: Shop UI - Upgrade Tiles ✅

**Goal**: Visual upgrade tiles with states

**Tasks**:

- Draw upgrade tiles as rounded squares with icons
- Implement border colors:
  - Gray + grayed out = locked or unaffordable
  - Yellow = unlocked (can purchase)
  - Green = maxed out
- Show level indicator (e.g., "3/10" or dots)
- Hover detection for tiles

**Test**: See tiles with different border colors, hover highlights tile

---

#### Step 3.4: Tooltips ✅

**Goal**: Informative tooltips on hover

**Tasks**:

- Create Tooltip component that follows mouse
- Show on hover:
  - Upgrade name
  - Description
  - Current level / max level
  - Cost (or "MAXED" if maxed)
  - Effect preview (e.g., "+1 damage")
- Style with cartoonish border/background

**Test**: Hover upgrade → tooltip appears with correct info

---

#### Step 3.5: Purchase Logic ✅

**Goal**: Buy upgrades with money

**Tasks**:

- Click tile to purchase (if affordable + unlocked)
- Deduct money
- Increment upgrade level
- Update unlock states of dependent upgrades
- Play purchase sound
- Visual feedback (tile pulse, sparkles)

**Test**: Have enough money → buy upgrade → money decreases, level increases

---

### Phase 4: Right Branch - Click Upgrades ✅

---

#### Step 4.1: Click Damage Upgrade ✅

**Goal**: Increase damage per click

**Tasks**:

- Implement "Click DMG" upgrade (max 10, cost 20$ each)
- Store clickDamage in GameState
- ClickSystem uses GameState.clickDamage

**Test**: Buy upgrade → clicks deal more damage

---

#### Step 4.2: Click Radius Upgrade ✅

**Goal**: Larger click area

**Tasks**:

- Implement "Click Radius" upgrade
- Unlocks when Click DMG is maxed (level 10)
- Max level 5, cost 200$ each, +10% radius per level
- Visualize click radius briefly on click

**Test**: Max click damage → radius upgrade unlocks → buy → click area larger

---

#### Step 4.3: More Circles Upgrade ✅

**Goal**: Spawn additional target circles

**Tasks**:

- Implement "More Circles" upgrade
- Unlocks when Click Radius is maxed
- Max level 5, cost 1000$ each
- Each level spawns +1 circle (starting at 10 hp)
- Can overlap existing circles but not balls

**Test**: Buy upgrade → new circle spawns, doesn't overlap balls that dmg circles

---

### Phase 5: Left Branch - Ball Upgrades ✅

---

#### Step 5.1: White Ball Spawn ✅

**Goal**: Bouncing ball that damages circles

**Tasks**:

- Implement "White Ball" upgrade (max 1, cost 1000$)
- Unlocks when Click DMG is maxed
- Create `Velocity` component
- Create `Ball` component (damage, canCollide)
- Create `MovementSystem` for ball physics
- Ball bounces off screen edges
- Spawn ball at random position (not inside circles!)

**Test**: Buy white ball → ball appears, bounces around screen

---

#### Step 5.2: Ball-Circle Collision ✅

**Goal**: Ball damages circles on hit

**Tasks**:

- Create `CollisionSystem` for ball-circle interactions
- On collision: deal ball damage, earn money (same as clicking)
- Brief collision cooldown to prevent rapid hits
- Visual effect on collision (spark, ripple)

**Test**: Ball hits circle → circle takes damage, money earned

---

#### Step 5.3: Ball Damage & Speed Upgrades ✅

**Goal**: Improve ball stats

**Tasks**:

- Implement "Ball DMG" upgrade (unlocks with white ball)
  - +1 damage per level, cost 100$ each, max 10
- Implement "Ball Speed" upgrade (unlocks with white ball)
  - +5% speed per level, cost 100$ each, max 10

**Test**: Buy upgrades → ball deals more damage / moves faster

---

### Phase 6: Top Branch - Passive Income ✅

---

#### Step 6.1: Mining Drone Base ✅

**Goal**: Passive money generation

**Tasks**:

- Implement "Mining Drone" upgrade (max 10, cost 1000$)
- Creates passive income: 1$/sec per level
- Create `PassiveIncomeSystem`
- Show small drone icon or indicator when active

**Test**: Buy mining drone → money slowly increases over time

---

#### Step 6.2: Tick Speed Upgrade ✅

**Goal**: Faster passive income ticks

**Tasks**:

- Implement "Tick Speed" upgrade
- Unlocks when Mining Drone is purchased
- Max 15 levels, cost 10,000$ each
- Each level: -1 tick from generation cooldown (20 → 19 → 18...)

**Test**: Buy tick speed → passive income generates faster

---

#### Step 6.3: Value Upgrade ✅

**Goal**: More money per passive tick

**Tasks**:

- Implement "Value Upgrade"
- Unlocks when Mining Drone is purchased
- Max 15 levels, cost 10,000$ each
- Each level: +1$ per income tick

**Test**: Buy value upgrade → each passive tick gives more money

---

### Phase 7: Bottom Branch - QoL Upgrades ✅

---

#### Step 7.1: Click Hold Upgrade ✅

**Goal**: Hold mouse to auto-click

**Tasks**:

- Implement "Click Hold" upgrade (max 1, cost 500$)
- Unlocks when Click DMG is maxed
- When purchased, holding mouse deals damage every 20 ticks (1 "second")
- Track mouse held state
- Show visual indicator when hold-clicking

**Test**: Buy click hold → hold mouse → damage happens automatically

---

#### Step 7.2: Hold Speed Upgrade ✅

**Goal**: Faster hold-clicking

**Tasks**:

- Implement "Hold DMG Speed" upgrade
- Unlocks when Click Hold is purchased
- Max 15 levels, cost 2500$ each
- Each level: -1 tick from hold interval

**Test**: Buy hold speed → auto-damage happens more frequently

---

### Phase 8: Polish & Effects

---

#### Step 8.1: Particle System ✅

**Goal**: Reusable particle effects

**Tasks**:

- Create `Particle` component (lifetime, velocity, color, size, alpha)
- Create `ParticleSystem` for updating/rendering particles
- Implement particle emitter helper functions
- Do not use emojis for that
- Add particles for:
  - Click impact (radial burst)
  - Circle death (explosion)
  - Money earned (rising coins/sparkles)
  - Purchase (celebration burst)
  - Ball collision (sparks)

**Test**: Actions trigger appropriate particle effects

---

#### Step 8.2: Sound Effects ✅

**Goal**: Satisfying audio feedback

**Tasks**:

- Create `SoundManager` using Web Audio API
- Procedurally generate sounds (no external files):
  - Click: short "pop" sound
  - Damage: soft "thud"
  - Circle death: satisfying "explosion" with pitch variation
  - Money: coin "ding"
  - Purchase: "ka-ching" or level-up sound
  - Ball bounce: soft "boing"
  - Ball hit: "ping"
- Add volume control
- Ensure sounds don't overlap harshly (sound pooling)

**Test**: Each action has distinct, pleasant sound

---

#### Step 8.3: Visual Polish ✅

**Goal**: Cartoonish appealing style

**Tasks**:

- Circles: gradient fills, thick outlines, subtle shadow
- Health bars: rounded, color gradient (green → yellow → red)
- Background: subtle animated gradient or pattern
- UI elements: rounded corners, drop shadows, playful fonts
- Floating numbers: bounce animation, scale in/out
- Screen shake on big events (circle death)
- Smooth animations (easing functions)

**Test**: Game looks polished and visually cohesive

---

### Phase 9: Final Integration & Balance

---

#### Step 9.1: Save/Load System ✅

**Goal**: Persist progress

**Tasks**:

- Serialize GameState to JSON
- Save to localStorage on:
  - Every purchase
  - Periodic auto-save (every 30 seconds)
- Load on game start
- "New Game" option (clear save)

**Test**: Close browser → reopen → progress restored

---

#### Step 9.2: Game Balance Pass

**Goal**: Satisfying progression curve

**Tasks**:

- Adjust costs if progression feels too slow/fast
- Ensure all branches feel worthwhile
- Add visual milestones (effects when maxing upgrades)

**Test**: Full playthrough feels engaging and balanced

---

#### Step 9.3: Final Polish

**Goal**: Production-ready game

**Tasks**:

- Add simple tutorial hints (first-time player)
- Performance optimization (object pooling, render culling)
- Responsive canvas (handle window resize)
- Mobile touch support (optional)
- Final visual/audio pass

**Test**: Game runs smoothly, looks great, plays well

---

## Upgrade Tree Visual Reference

```
                    [Mining Drone]
                         |
              [Tick Speed] [Value]
                         |
                         |
[Ball DMG]──[White Ball]─┼─[Click DMG]──[Click Radius]──[More Circles]
[Ball Speed]─────────────┼─────────────────────────────────────────────
                         |
                         |
                    [Click Hold]
                         |
                   [Hold Speed]
```

---

## Constants Reference (Initial Balance)

| Upgrade       | Max Level | Base Cost | Effect         |
| ------------- | --------- | --------- | -------------- |
| Click DMG     | 10        | 20$       | +1 damage      |
| Click Radius  | 5         | 200$      | +10% radius    |
| More Circles  | 5         | 1000$     | +1 circle      |
| White Ball    | 1         | 1000$     | Spawn ball     |
| Ball DMG      | 10        | 100$      | +1 ball damage |
| Ball Speed    | 10        | 100$      | +5% speed      |
| Mining Drone  | 10        | 1000$     | +1$/sec        |
| Tick Speed    | 15        | 10000$    | -1 tick        |
| Value Upgrade | 15        | 10000$    | +1$/tick       |
| Click Hold    | 1         | 500$      | Enable hold    |
| Hold Speed    | 15        | 2500$     | -1 tick        |

---

## Technical Notes

- **Tick System**: 60 FPS, 1 "game second" = 20 ticks
- **No external libraries**: Pure TypeScript + Canvas API + Web Audio API
- **ECS Benefits**: Easy to add new features, clean separation of concerns
- **String unions over enums**: As per project rules
- **Testing approach**: Each step has clear, observable outcomes

---

## Icon Ideas (for upgrade tiles)

- Click DMG: 👆 or sword icon
- Click Radius: ⭕ expanding circles
- More Circles: ➕ with circles
- White Ball: ⚪ simple ball
- Ball DMG: 💥 impact
- Ball Speed: ⚡ lightning bolt
- Mining Drone: ⛏️ or 🤖
- Tick Speed: ⏱️ clock
- Value Upgrade: 💰 money bag
- Click Hold: 🖱️ or ✋ hand
- Hold Speed: 🔄 refresh arrows

---

Ready to begin implementation! Start with Phase 1, Step 1.1.
