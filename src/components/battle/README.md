# Battle Components

This directory contains the enhanced battle components with animations, visual effects, and precise event handling.

## Components

### BattleSprite
A React component that displays individual Pokemon in battle with:
- Front/back sprite images based on battle position
- HP bars with color coding (green/yellow/red)
- Status effect indicators
- Volatile condition badges (Substitute, Protect, etc.)
- Field effect badges (Safeguard, Reflect, Light Screen)
- Type badges with proper colors
- Imperative animation API via `play(animName)`
- Safe HP handling (supports both `{cur, max}` and scalar formats)

**Usage:**
```tsx
import { BattleSprite, BattleSpriteRef } from './BattleSprite';

const spriteRef = useRef<BattleSpriteRef>(null);

// Trigger animation
await spriteRef.current?.play('damage');
```

### BattleScene
A complete battle interface that:
- Integrates with your existing `useBattleState` hook
- Renders both player and opponent Pokemon
- Supports structured events for precise animation control
- Provides move selection and Pokemon switching
- Shows battle status and turn information
- Includes projectile effects for attacks
- Handles field auras and effects

**Usage:**
```tsx
import { BattleScene, UIEvent } from './BattleScene';

// Basic usage
<BattleScene battleId="your-battle-id" />

// With structured events (more precise than log parsing)
const events: UIEvent[] = [
  { kind: "attack", actor: "p1", typeColor: "#ff0000" },
  { kind: "hit", target: "p2", crit: true }
];
<BattleScene battleId="your-battle-id" events={events} />

// With external state
<BattleScene battleId="your-battle-id" state={battleState} logs={logArray} />
```

## Event System

The component supports structured events for precise animation control:

```tsx
export type UIEvent =
  | { kind: "attack"; actor: "p1" | "p2"; typeColor?: string; special?: boolean }
  | { kind: "hit"; target: "p1" | "p2"; crit?: boolean }
  | { kind: "miss"; actor: "p1" | "p2" }
  | { kind: "protect"; target: "p1" | "p2" }
  | { kind: "feintBreak"; target: "p1" | "p2" }
  | { kind: "subFade"; target: "p1" | "p2" }
  | { kind: "perishTick"; target: "p1" | "p2"; count: number }
  | { kind: "ko"; target: "p1" | "p2" };
```

## Animations

The following Tailwind animations are available:
- `animate-shake` - For status effects like paralysis
- `animate-fadeOut` - For fainting Pokemon
- `animate-slideIn` - For Pokemon switching
- `animate-damage` - For taking damage
- `animate-heal` - For healing moves
- `animate-critical` - For critical hits
- `animate-status` - For ongoing status effects
- `animate-evolve` - For evolution
- `animate-mega` - For mega evolution
- `animate-beam` - For projectile attacks

## Features

### Projectile System
- Type-colored beams for attacks
- Automatic cleanup after animation
- Fixed Tailwind JIT compilation issues

### Field Auras
- Safeguard, Mist, Reflect, Light Screen indicators
- Proper mapping from Firebase field state
- Visual badges on Pokemon sprites

### HP Handling
- Safe reading of both `{hp: {cur, max}}` and `{hp, maxHp}` formats
- Automatic fallback for missing data

### Animation Sequencing
- Multi-event turn support with proper timing
- 30-140ms delays between events for smooth flow
- Prevents animation conflicts

## Integration

The battle runtime page now includes a toggle between:
- **Animated View** - New BattleScene with animations
- **Classic View** - Original RTDBBattleComponent

Both views use the same battle state and Firebase integration.

## Self-Subscribing Hook

Optional `useBattleFeed` hook for components that want to manage their own Firebase subscriptions:

```tsx
import { useBattleFeed } from '@/hooks/useBattleFeed';

const { pub, logs, meta } = useBattleFeed(battleId);
```
