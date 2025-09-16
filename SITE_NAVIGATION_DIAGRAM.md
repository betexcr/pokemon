# Pokémon Site Navigation Diagram

## Visual Site Map

```
                    ┌─────────────────────────────────────────┐
                    │              🏠 MAIN POKÉDEX            │
                    │                  (/)                    │
                    │  ┌─────────────────────────────────────┐ │
                    │  │  Header: [Back] [Title] [🌙] [🎮]  │ │
                    │  └─────────────────────────────────────┘ │
                    │                                         │
                    │  ┌─────────────────────────────────────┐ │
                    │  │        Pokémon Grid/List            │ │
                    │  │  [Pikachu] [Charizard] [Blastoise] │ │
                    │  │  [Venusaur] [Mewtwo] [Mew]         │ │
                    │  │  [Infinite Scroll...]              │ │
                    │  └─────────────────────────────────────┘ │
                    │                                         │
                    │  ┌─────────────────────────────────────┐ │
                    │  │        Filters & Search            │ │
                    │  │  [🔍 Search] [Type Filter] [Gen]   │ │
                    │  └─────────────────────────────────────┘ │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────┼───────────────────────┐
                    │                 │                       │
            ┌───────▼───────┐  ┌─────▼─────┐  ┌─────────────▼─────────┐
            │   📱 POKÉMON  │  │  📈 COMPARE│  │      🎮 HEADER ICONS   │
            │   DETAIL      │  │   PAGE     │  │                       │
            │  (/pokemon/[id]) │  │ (/compare) │  │ ┌─────────────────┐ │
            │                 │  │            │  │ │  🏗️ Team Builder │ │
            │ ┌─────────────┐ │  │ ┌────────┐ │  │ │     (/team)     │ │
            │ │ Pokémon Info│ │  │ │ Stats  │ │  │ └─────────────────┘ │
            │ │ Stats/Moves │ │  │ │ Chart  │ │  │                     │
            │ │ Evolution   │ │  │ │ Table  │ │  │ ┌─────────────────┐ │
            │ │ Types       │ │  │ │ Release│ │  │ │  ⚔️ Battles     │ │
            │ └─────────────┘ │  │ │ Anim.  │ │  │ │    (/battle)    │ │
            │                 │  │ └────────┘ │  │ └─────────────────┘ │
            │ [Back to Main]  │  │            │  │                     │
            └─────────────────┘  │ [Back]     │  │ ┌─────────────────┐ │
                                 │ [Clear]    │  │ │  📈 Compare     │ │
                                 └────────────┘  │ │   (enabled)     │ │
                                                 │ └─────────────────┘ │
                                                 └─────────────────────┘
                                                           │
                                                           ▼
                                                 ┌─────────────────────┐
                                                 │   🏗️ TEAM BUILDER   │
                                                 │      (/team)        │
                                                 │                     │
                                                 │ ┌─────────────────┐ │
                                                 │ │  6 Team Slots   │ │
                                                 │ │ [Poke1][Poke2]  │ │
                                                 │ │ [Poke3][Poke4]  │ │
                                                 │ │ [Poke5][Poke6]  │ │
                                                 │ └─────────────────┘ │
                                                 │                     │
                                                 │ ┌─────────────────┐ │
                                                 │ │  Move Selection │ │
                                                 │ │  Level Config   │ │
                                                 │ │  Save/Load      │ │
                                                 │ └─────────────────┘ │
                                                 │                     │
                                                 │ [Back] [Save Team] │
                                                 └─────────────────────┘
                                                           │
                                                           ▼
                                                 ┌─────────────────────┐
                                                 │    ⚔️ BATTLE PAGE    │
                                                 │     (/battle)       │
                                                 │                     │
                                                 │ ┌─────────────────┐ │
                                                 │ │ Select Your Team│ │
                                                 │ │ [Load Team]     │ │
                                                 │ └─────────────────┘ │
                                                 │                     │
                                                 │ ┌─────────────────┐ │
                                                 │ │ AI Opponents    │ │
                                                 │ │ [Gym Leaders]   │ │
                                                 │ │ [Champions]     │ │
                                                 │ └─────────────────┘ │
                                                 │                     │
                                                 │ [Back] [Online]     │
                                                 └─────────────────────┘
                                                           │
                                                           ▼
                                                 ┌─────────────────────┐
                                                 │   🏛️ BATTLE LOBBY   │
                                                 │     (/lobby)        │
                                                 │                     │
                                                 │ ┌─────────────────┐ │
                                                 │ │ Create Room     │ │
                                                 │ │ [+ Create]      │ │
                                                 │ └─────────────────┘ │
                                                 │                     │
                                                 │ ┌─────────────────┐ │
                                                 │ │ Available Rooms │ │
                                                 │ │ [Room 1] [Room 2]│ │
                                                 │ │ [Join Battle]   │ │
                                                 │ └─────────────────┘ │
                                                 │                     │
                                                 │ [Back]              │
                                                 └─────────────────────┘
                                                           │
                                                           ▼
                                                 ┌─────────────────────┐
                                                 │   🎮 BATTLE ROOM    │
                                                 │ (/lobby/[roomId])   │
                                                 │                     │
                                                 │ ┌─────────────────┐ │
                                                 │ │ Room Info       │ │
                                                 │ │ Players: 2/2    │ │
                                                 │ │ Status: Ready   │ │
                                                 │ └─────────────────┘ │
                                                 │                     │
                                                 │ ┌─────────────────┐ │
                                                 │ │ Team Selection  │ │
                                                 │ │ [Select Team]   │ │
                                                 │ └─────────────────┘ │
                                                 │                     │
                                                 │ ┌─────────────────┐ │
                                                 │ │ Battle Engine   │ │
                                                 │ │ [Start Battle]  │ │
                                                 │ └─────────────────┘ │
                                                 │                     │
                                                 │ [Back to Lobby]    │
                                                 └─────────────────────┘
```

## Navigation Flow Summary

### Primary Navigation Paths:

1. **🏠 Main → 📱 Detail**
   - Click any Pokémon → Individual page
   - Back button → Return to main

2. **🏠 Main → 📈 Compare**
   - Select Pokémon → Add to comparison
   - Click compare icon → Comparison page
   - Back button → Return to main

3. **🏠 Main → 🏗️ Team Builder**
   - Click team builder icon → Team builder
   - Build team → Save for battles
   - Back button → Return to main

4. **🏠 Main → ⚔️ Battles**
   - Click battle icon → Battle page
   - Select team → Choose opponent → Start battle
   - "Online Battles" → Lobby system

5. **⚔️ Battles → 🏛️ Lobby**
   - Click "Online Battles" → Lobby page
   - Create/join rooms → Battle rooms

6. **🏛️ Lobby → 🎮 Battle Room**
   - Create room → Room page
   - Join room → Room page
   - Battle → Results → Back to lobby

### Secondary Navigation:

- **Header Icons**: Quick access to main features
- **Back Buttons**: Consistent return navigation
- **Theme Toggle**: Switch between themes
- **User Menu**: Authentication and settings
- **Filters**: Advanced search and filtering

### Mobile Adaptations:

- **Touch Navigation**: Tap-friendly interactions
- **Responsive Layout**: Adapts to screen size
- **Swipe Gestures**: Natural mobile navigation
- **Modal Overlays**: Space-efficient on mobile

## Key Features by Page:

### 🏠 Main PokéDex
- Pokémon browsing and search
- Theme switching
- Comparison selection
- Quick navigation to all features

### 📱 Pokémon Detail
- Comprehensive Pokémon information
- Stats, moves, evolution chains
- Type effectiveness
- Related Pokémon links

### 🏗️ Team Builder
- 6-Pokémon team construction
- Move and level configuration
- Save/load teams with cloud sync
- Team validation

### ⚔️ Battle System
- AI battles against gym leaders
- Team selection from saved teams
- Mobile-optimized interactions
- Integration with team builder

### 🏛️ Battle Lobby
- Multiplayer battle coordination
- Room creation and joining
- Real-time room status
- User authentication required

### 🎮 Battle Room
- Real-time multiplayer battles
- Team selection and validation
- Battle synchronization
- Chat and messaging

### 📈 Comparison
- Side-by-side Pokémon analysis
- Interactive charts and tables
- Release animations
- Flexible Pokémon selection

