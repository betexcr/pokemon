---
name: championships
description: >-
  Guides tournament brackets, seeding, and championship Firestore flows.
  Use when editing championshipService, bracket generation, championship UI,
  or generation-cap rules for tournaments.
---

# Championships

## Overview

Firestore-backed multiplayer tournaments: create → join → pick seats → start → bracket matches → optional battle room linking.

## Key files

| File | Role |
|------|------|
| `src/lib/championshipService.ts` | CRUD, join/leave, start, advance winner, forfeit |
| `src/lib/championship/bracket.ts` | Bracket generation, round names, seeding |
| `src/lib/championship/types.ts` | Championship, Match, Participant types |
| `src/lib/pokemon/nationalDexByGeneration.ts` | Generation cap for eligible Pokémon |
| `src/app/championship/page.tsx` | List / create championships |
| `src/app/championship/[id]/ChampionshipClient.tsx` | Detail, bracket, seat picker |
| `src/components/championship/` | BracketView, MatchCard, SeatPicker, ParticipantList |

## Firestore

Collection: `championships`

Typical document fields: `hostUid`, `status` (`open` | `in_progress` | `completed` | `cancelled`), `participants[]`, `bracket[]`, `maxGeneration`, `seats`.

## Flow

1. Host creates championship → `createChampionship()`
2. Players join with team → `joinChampionship()`
3. Optional seat picking / randomize seeds
4. Host starts → `startChampionship()` generates bracket
5. Match winners advanced → `advanceWinner()`; forfeits via `forfeitMatch()`
6. Matches can link to battle rooms via `setMatchRoom()`

## Generation cap

`maxGeneration` on championship limits eligible team Pokémon via `nationalDexByGeneration.ts`. UI shows formatted rule string to participants.

## Real-time updates

`onChampionshipChange(championshipId, callback)` subscribes to Firestore doc updates for live bracket UI.

## Testing

```bash
npm run test:unit   # includes src/lib/championship/__tests__/bracket.test.ts
```

## Rules

- Host-only actions: start, cancel, delete, randomize seeds
- Cannot update team after championship starts
- Cannot delete in-progress championship without cancel first
- Battle room linking requires auth + participant check

## Related

- Teams: `userTeams.ts` — participants select saved teams
- Multiplayer battles: linked via room ID on match cards
- [AGENTS.md](../../AGENTS.md) domain map
