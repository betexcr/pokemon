# Pokémon App Transition System Guide

This guide explains the comprehensive transition system implemented across the Pokémon app, providing smooth, canon-Pokémon-style animations throughout the user experience.

## 🎯 Overview

The transition system uses two main APIs:
- **View Transitions API** for page-level shared element transitions
- **Framer Motion** for component-level animations and complex effects

All transitions respect the `prefers-reduced-motion` accessibility setting and are optimized for performance.

## 🛣️ Route → Route Transitions

### Shared Element Transitions
- **Pokédex → Pokémon Detail**: Shared sprite grows with `viewTransitionName: pokemon-{id}`
- **Pokémon Detail → Pokédex**: Shared sprite shrinks (reverse)
- **Any → Compare**: Cards morph into compare tiles

```tsx
// Use LinkWithTransition with shared-element type
<LinkWithTransition href={`/pokemon/${pokemon.id}`} transitionType="shared-element">
  <div style={{ viewTransitionName: `pokemon-${pokemon.id}` }}>
    <PokemonCard pokemon={pokemon} />
  </div>
</LinkWithTransition>
```

### Special Route Transitions
- **Any → Battle**: BattleStartFlash + camera push (320-400ms)
- **Lobby → Battle Room**: Door/wipe reveal (260ms)
- **Team ↔ Battle**: Shared team chip → battle team bar + flash

## 🎨 In-Page Component Transitions

### Pokédex Page (/)
- **Grid ↔ List**: AnimatedGrid with staggered cards (180-220ms)
- **Filter/Search**: Quick scanline wipe, removed cards scale 0.96 + fade

```tsx
import AnimatedGrid from '@/components/AnimatedGrid';

<AnimatedGrid 
  items={pokemonList} 
  mode={viewMode} 
  onPokemonSelect={handleSelect}
  selectedPokemon={selected}
  comparisonList={comparison}
  onToggleComparison={handleToggle}
/>
```

### Pokémon Detail Page (/pokemon/[id])
- **Hero Aura**: Type-color pulse on mount (200ms)
- **Evolution Chain**: Left→right "link glow" between nodes (180ms)

```tsx
import PokemonHero from '@/components/PokemonHero';
import EvolutionChainTransition from '@/components/EvolutionChainTransition';

<PokemonHero pokemon={pokemon} />
<EvolutionChainTransition isExpanded={showEvolutions}>
  <EvolutionChain pokemon={pokemon} />
</EvolutionChainTransition>
```

### Team Builder (/team)
- **Add to Slot**: Tiny Pokéball throw → slot bounce (140ms)
- **Remove**: Ember/sparkle dissolve (280ms)
- **Move Select Panel**: Slide-up from bottom (200ms)

```tsx
import TeamSlotTransition from '@/components/TeamSlotTransition';
import MoveSelectPanel from '@/components/battle/MoveSelectPanel';

<TeamSlotTransition 
  slotIndex={index} 
  hasPokemon={hasPokemon} 
  action={action}
>
  <TeamSlot pokemon={pokemon} />
</TeamSlotTransition>

<MoveSelectPanel isOpen={showMoves} onClose={closeMoves}>
  <MoveList moves={moves} />
</MoveSelectPanel>
```

### Battle Page (/battle)
- **Battle Start**: BattleStartFlash (120ms flash → 200ms fade/push)
- **Use Move**: AttackAnimator → type FX (280-360ms)
- **On Hit**: HitShake (140-160ms) + HPBar tick-down (~600ms)
- **Status Apply**: StatusPopups queue (TTL ~1400ms)
- **Victory/Defeat**: Tilt + fade (380ms)

```tsx
import BattleStartFlash from '@/components/battle/BattleStartFlash';
import AttackAnimator from '@/components/battle/AttackAnimator';
import HitShake from '@/components/battle/HitShake';
import HPBar from '@/components/battle/HPBar';
import StatusPopups from '@/components/battle/StatusPopups';
import BattleEndTransition from '@/components/battle/BattleEndTransition';

// Battle start
{!introDone && <BattleStartFlash onDone={() => setIntroDone(true)} />}

// Move effects
<AttackAnimator kind="electric" from={allyPos} to={foePos} playKey={moveKey} />

// Hit effects
<HitShake playKey={hitKey}>
  <PokemonSprite />
</HitShake>

<HPBar max={maxHP} value={currentHP} />

// Status effects
<StatusPopups events={statusEvents} />

// End game
<BattleEndTransition result="victory" onComplete={handleVictory} />
```

### Lobby Page (/lobby)
- **Create/Join Modal**: Pokéball pop-open (160ms)
- **Ready/Waiting**: Avatar pulse (240ms)

```tsx
import LobbyModal from '@/components/lobby/LobbyModal';
import AvatarPulse from '@/components/lobby/AvatarPulse';

<LobbyModal isOpen={showModal} onClose={closeModal}>
  <CreateRoomForm />
</LobbyModal>

<AvatarPulse isReady={isReady} isWaiting={isWaiting}>
  <UserAvatar user={user} />
</AvatarPulse>
```

### Battle Room (/lobby/[roomId])
- **Team Validation**: Invalid = red glow pulse x2 (120ms each); Valid = green tick pulse (180ms)
- **Chat Messages**: Pokéball pop (120ms)

```tsx
import TeamValidationTransition from '@/components/battle/TeamValidationTransition';
import ChatMessageTransition from '@/components/battle/ChatMessageTransition';
import LobbyTransition from '@/components/battle/LobbyTransition';

<LobbyTransition playKey={roomKey}>
  <BattleRoomContent />
</LobbyTransition>

<TeamValidationTransition isValid={isValid} playKey={validationKey}>
  <TeamDisplay team={team} />
</TeamValidationTransition>

<ChatMessageTransition playKey={messageKey}>
  <ChatMessage message={message} />
</ChatMessageTransition>
```

### Compare Page (/compare)
- **Add Pokémon**: Slide from side + charts line-draw (240ms)
- **Switch Metric**: Crossfade charts (120ms) with y-translation (6px)

```tsx
import CompareTransition from '@/components/CompareTransition';
import ChartTransition from '@/components/ChartTransition';

<CompareTransition pokemonId={pokemon.id} action="add">
  <PokemonComparisonCard pokemon={pokemon} />
</CompareTransition>

<ChartTransition playKey={chartKey}>
  <StatsChart data={stats} />
</ChartTransition>
```

## 🎨 Theme Transitions

### Theme Ripple
- **Theme Change**: Radial ripple recolor (420ms)
- **Usage**: Available via `useThemeRipple` hook

```tsx
import { useThemeRipple } from '@/hooks/useThemeRipple';

const ripple = useThemeRipple();

<button onClick={(e) => ripple(e, 'dark')}>
  Switch to Dark Theme
</button>
```

## 🔧 Technical Implementation

### Transition Types
The `LinkWithTransition` component supports different transition types:

```tsx
type TransitionType = 
  | 'shared-element'  // View Transitions API
  | 'battle-flash'    // BattleStartFlash
  | 'lobby-wipe'      // LobbyTransition
  | 'compare-morph'   // CompareTransition
  | 'default';        // Standard View Transition
```

### Accessibility
All transitions respect `prefers-reduced-motion`:

```tsx
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';

const reduce = useReducedMotionPref();

if (reduce) {
  return <>{children}</>; // Skip animations
}
```

### Performance Optimization
- GPU-friendly animations (opacity, transform)
- `requestAnimationFrame` for smooth updates
- Light DOM manipulation
- Deterministic animations using `playKey`

## 🎮 Battle FX System

The battle system includes comprehensive visual effects:

### Move Effects
- **Electric**: Lightning bolts with golden glow
- **Water**: Traveling droplet with ripples
- **Fire**: Ember projectile with flame burst
- **Grass**: Spinning leaf with rising particles
- **Ice**: Crystalline shard with frost burst
- **Psychic**: Energy projectile with concentric rings
- **Fairy**: Sparkling projectile with star particles

### Hit Effects
- **Screen Shake**: Subtle shake on impact
- **HP Bar**: Smooth tick-down with color changes
- **Status Popups**: Queued status effect notifications

## 🚀 Usage Examples

### Complete Battle Scene
```tsx
import BattleScene from '@/components/battle/BattleScene';

<BattleScene />
```

### Complete Transition Demo
Visit `/demo-complete-battle` to see all battle effects in action.

## 📱 Mobile Considerations

All transitions are optimized for mobile:
- Touch-friendly timing (slightly longer durations)
- Reduced motion complexity on smaller screens
- Battery-efficient animations

## 🎯 Best Practices

1. **Always use `playKey`** for deterministic animations in battle replays
2. **Respect accessibility** with `useReducedMotionPref`
3. **Use appropriate transition types** for different navigation contexts
4. **Keep animations fast** (typically 120-400ms) for Pokémon canon feel
5. **Test on mobile** to ensure smooth performance

This transition system provides a cohesive, polished experience that feels authentically Pokémon while maintaining excellent performance and accessibility standards.

