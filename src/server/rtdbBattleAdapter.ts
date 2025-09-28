import { BattleState, BattleTeam, BattlePokemon } from '@/lib/team-battle-engine';

type RTDBSnapshot = {
  meta: any;
  public: any;
  private: Record<string, any>;
  turns?: Record<string, any>;
};

const STATUS_MAP: Record<string, BattlePokemon['status']> = {
  PAR: 'paralyzed',
  PSN: 'poisoned',
  BRN: 'burned',
  FRZ: 'frozen',
  SLP: 'asleep',
};

const PUBLIC_STATUS_MAP: Record<NonNullable<BattlePokemon['status']>, string> = {
  paralyzed: 'PAR',
  poisoned: 'PSN',
  burned: 'BRN',
  frozen: 'FRZ',
  asleep: 'SLP',
  confused: 'CNF',
};

export function rtdbSnapshotToBattleState(snapshot: RTDBSnapshot): BattleState {
  const { meta, public: publicState, private: privateState } = snapshot;

  if (!meta || !publicState || !privateState) {
    throw new Error('Incomplete RTDB snapshot');
  }

  const p1Uid: string = meta.players?.p1?.uid;
  const p2Uid: string = meta.players?.p2?.uid;

  if (!p1Uid || !p2Uid) {
    throw new Error('Missing players in meta');
  }

  const p1Private = privateState[p1Uid];
  const p2Private = privateState[p2Uid];

  const playerTeam = mapTeam(p1Private?.team ?? [], publicState.p1);
  const opponentTeam = mapTeam(p2Private?.team ?? [], publicState.p2);

  const battleLog = snapshot.turns?.[meta.turn]?.resolution?.log ?? [];

  return {
    player: playerTeam,
    opponent: opponentTeam,
    turn: meta.turn ?? 0,
    rng: meta.rng ?? Date.now(),
    battleLog,
    isComplete: meta.phase === 'ended',
    winner: meta.winnerUid
      ? meta.winnerUid === p1Uid
        ? 'player'
        : 'opponent'
      : undefined,
    phase:
      meta.phase === 'choosing'
        ? 'choice'
        : meta.phase === 'resolving'
        ? 'resolution'
        : meta.phase === 'replacement'
        ? 'replacement'
        : meta.phase ?? 'choice',
    actionQueue: [],
    field: publicState.field ?? {},
  };
}

export function applyBattleStateToSnapshot(
  snapshot: RTDBSnapshot,
  updated: BattleState
): RTDBSnapshot {
  const { meta, public: publicState, private: privateState, turns } = snapshot;
  const p1Uid: string = meta.players?.p1?.uid;
  const p2Uid: string = meta.players?.p2?.uid;

  if (!p1Uid || !p2Uid) {
    throw new Error('Missing players in meta');
  }

  const turnKey = String(meta.turn ?? 0);

  const clone = JSON.parse(JSON.stringify(snapshot)) as RTDBSnapshot;

  clone.meta.turn = updated.turn;
  clone.meta.phase = updated.phase === 'choice' ? 'choosing' : updated.phase === 'resolution' ? 'resolving' : updated.phase;
  clone.meta.version = (clone.meta.version ?? 0) + 1;
  clone.meta.winnerUid = updated.winner
    ? updated.winner === 'player'
      ? p1Uid
      : p2Uid
    : null;
  if (updated.isComplete) {
    clone.meta.phase = 'ended';
  }

  clone.public = clone.public || {};
  clone.public.field = updated.field;

  clone.public.p1 = updatePublicSide(clone.public.p1, updated.player);
  clone.public.p2 = updatePublicSide(clone.public.p2, updated.opponent);

  clone.private = clone.private || {};
  if (clone.private[p1Uid]) {
    clone.private[p1Uid].team = updatePrivateTeam(clone.private[p1Uid].team, updated.player);
  }
  if (clone.private[p2Uid]) {
    clone.private[p2Uid].team = updatePrivateTeam(clone.private[p2Uid].team, updated.opponent);
  }

  const newTurnKey = String(updated.turn);
  clone.turns = clone.turns || {};
  clone.turns[turnKey] = clone.turns[turnKey] || {};
  clone.turns[turnKey].resolution = {
    log: updated.battleLog,
    winner: clone.meta.winnerUid,
  };
  clone.turns[turnKey].choices = {}; // clear choices for completed turn

  if (!clone.turns[newTurnKey]) {
    clone.turns[newTurnKey] = {};
  }

  return clone;
}

function mapTeam(teamData: any[], publicSide: any): BattleTeam {
  const pokemon: BattlePokemon[] = teamData.map((entry, index) => mapPokemon(entry, publicSide, index));

  return {
    pokemon,
    currentIndex: 0,
    faintedCount: pokemon.filter(p => p.currentHp <= 0).length,
    sideConditions: publicSide?.sideConditions ?? {},
  };
}

function mapPokemon(entry: any, publicSide: any, index: number): BattlePokemon {
  const isActive = index === 0;
  const publicData = isActive ? publicSide?.active : publicSide?.benchPublic?.[index - 1];

  const status = publicData?.status ? STATUS_MAP[publicData.status] ?? undefined : entry?.status;

  const boosts = publicData?.boosts ?? {
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
    acc: 0,
    eva: 0,
  };

  return {
    pokemon: entry.pokemon,
    level: entry.level ?? 50,
    currentHp: isActive ? publicData?.hp?.cur ?? entry.currentHp ?? entry.maxHp ?? 0 : entry.currentHp ?? entry.maxHp ?? 0,
    maxHp: isActive ? publicData?.hp?.max ?? entry.maxHp ?? 0 : entry.maxHp ?? 0,
    moves: (entry.moves ?? []).map((m: any) => ({
      id: m.id,
      pp: m.pp ?? m.maxPp ?? 0,
      maxPp: m.maxPp ?? m.pp ?? 0,
      disabled: m.disabled,
    })),
    status,
    statusTurns: entry.statusTurns,
    volatile: entry.volatile ?? {},
    currentAbility: entry.currentAbility ?? entry.pokemon?.abilities?.[0]?.ability?.name,
    originalAbility: entry.originalAbility ?? entry.pokemon?.abilities?.[0]?.ability?.name,
    abilityChanged: entry.abilityChanged ?? false,
    statModifiers: {
      attack: boosts.atk ?? 0,
      defense: boosts.def ?? 0,
      specialAttack: boosts.spa ?? 0,
      specialDefense: boosts.spd ?? 0,
      speed: boosts.spe ?? 0,
      accuracy: boosts.acc ?? 0,
      evasion: boosts.eva ?? 0,
    },
  };
}

function updatePublicSide(existing: any, team: BattleTeam): any {
  const clone = { ...(existing ?? {}) };
  const active = team.pokemon[0];

  clone.active = clone.active || {};
  clone.active.hp = {
    cur: active.currentHp,
    max: active.maxHp,
  };
  clone.active.status = active.status ? PUBLIC_STATUS_MAP[active.status] ?? null : null;
  clone.active.boosts = {
    atk: active.statModifiers.attack ?? 0,
    def: active.statModifiers.defense ?? 0,
    spa: active.statModifiers.specialAttack ?? 0,
    spd: active.statModifiers.specialDefense ?? 0,
    spe: active.statModifiers.speed ?? 0,
    acc: active.statModifiers.accuracy ?? 0,
    eva: active.statModifiers.evasion ?? 0,
  };

  const benchCount = Math.max(0, team.pokemon.length - 1);
  clone.benchPublic = Array.from({ length: benchCount }, (_, idx) => {
    const bench = (existing?.benchPublic ?? [])[idx] ?? {};
    const pokemon = team.pokemon[idx + 1];
    if (!pokemon) return bench;
    return {
      species: bench?.species ?? pokemon.pokemon?.name ?? `pokemon-${idx + 2}`,
      fainted: pokemon.currentHp <= 0,
      revealedMoves: bench?.revealedMoves ?? [],
    };
  });

  return clone;
}

function updatePrivateTeam(existingTeam: any[], team: BattleTeam): any[] {
  return (existingTeam ?? []).map((entry, index) => {
    const pokemon = team.pokemon[index];
    if (!pokemon) return entry;

    const statusCode = pokemon.status ? PUBLIC_STATUS_MAP[pokemon.status] ?? null : null;

    return {
      ...entry,
      currentHp: pokemon.currentHp,
      maxHp: pokemon.maxHp,
      status: statusCode,
      moves: (entry.moves ?? []).map((move: any, moveIndex: number) => {
        const updatedMove = pokemon.moves[moveIndex];
        if (!updatedMove) return move;
        return {
          ...move,
          pp: updatedMove.pp,
          maxPp: updatedMove.maxPp,
        };
      }),
      volatile: pokemon.volatile,
    };
  });
}
