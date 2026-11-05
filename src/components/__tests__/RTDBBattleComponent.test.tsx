// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import React from 'react';

/* ─── Mocks ─────────────────────────────────────────────────────────── */

const hookState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const forfeitHandler = vi.hoisted(() => vi.fn());
const trackEvent = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useBattleState', () => ({
  useBattleState: () => hookState.current,
}));

vi.mock('@/hooks/useMultiplayerBattle', () => ({
  useForfeit: () => forfeitHandler,
}));

vi.mock('@/lib/analytics', () => ({ trackEvent }));

vi.mock('@/lib/moveCache', () => ({
  getMove: vi.fn(async (id: string) => ({
    name: id,
    type: { name: id === 'thunderbolt' ? 'electric' : 'normal' },
    damage_class: { name: 'special' },
    power: 90,
    accuracy: 100,
    pp: 15,
    effect_entries: [],
  })),
}));

// Headless host-side resolver: talks to Firebase, irrelevant to rendering.
vi.mock('@/components/multiplayer/BattleTurnManager', () => ({
  BattleTurnManager: () => null,
}));

vi.mock('@/components/multiplayer/BattleEndScreen', () => ({
  BattleEndScreen: (props: { winner: string | null; endReason?: string }) => (
    <div data-testid="end-screen">
      winner:{String(props.winner)} reason:{String(props.endReason)}
    </div>
  ),
}));

vi.mock('@/components/battle/BattleSprite', async () => {
  const ReactMod = await import('react');
  return {
    BattleSprite: ReactMod.forwardRef(function BattleSpriteStub(
      props: { species: string; side: string; hp: { cur: number; max: number }; level: number },
      _ref,
    ) {
      return (
        <div data-testid={`sprite-${props.side}`}>
          {props.species} Lv{props.level} {props.hp.cur}/{props.hp.max}
        </div>
      );
    }),
  };
});

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img alt={String(props.alt ?? '')} src={String(props.src ?? '')} />,
}));

import RTDBBattleComponent from '../RTDBBattleComponent';

// jsdom does not implement scrolling; BattleTextBox auto-scrolls its log.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}

/* ─── Fixtures ──────────────────────────────────────────────────────── */

const ME = 'me-uid';
const OPP = 'opp-uid';

type Overrides = {
  meta?: Record<string, unknown> | null;
  pub?: Record<string, unknown> | null;
  [key: string]: unknown;
};

function setHook(overrides: Overrides = {}) {
  const meta =
    overrides.meta === null
      ? null
      : {
          phase: 'choosing',
          turn: 1,
          version: 1,
          players: { p1: { uid: ME, name: 'Ash' }, p2: { uid: OPP, name: 'Gary' } },
          ...(overrides.meta ?? {}),
        };
  const pub =
    overrides.pub === null
      ? null
      : {
          p1: { active: { species: 'pikachu', level: 50, hp: { cur: 90, max: 110 }, status: null, types: ['electric'] } },
          p2: { active: { species: 'eevee', level: 48, hp: { cur: 120, max: 130 }, status: null, types: ['normal'] } },
          battleLog: [],
          ...(overrides.pub ?? {}),
        };
  const { meta: _m, pub: _p, ...rest } = overrides;
  hookState.current = {
    loading: false,
    error: null,
    meta,
    pub,
    me: {
      currentIndex: 0,
      team: [
        { species: 'pikachu', hp: { cur: 90, max: 110 } },
        { species: 'bulbasaur', hp: { cur: 100, max: 120 } },
        { species: 'squirtle', hp: { cur: 0, max: 115 }, fainted: true },
      ],
    },
    meUid: ME,
    oppUid: OPP,
    connectionStatus: 'online',
    timeLeftSec: 25,
    legalMoves: [
      { id: 'thunderbolt', pp: 15, maxPp: 15 },
      { id: 'quick-attack', pp: 30, maxPp: 30 },
    ],
    legalSwitchIndexes: [1],
    chooseMove: vi.fn().mockResolvedValue(undefined),
    chooseSwitch: vi.fn().mockResolvedValue(undefined),
    forfeit: vi.fn(),
    ...rest,
  };
  return hookState.current as Record<string, ReturnType<typeof vi.fn>> & Record<string, unknown>;
}

const renderBattle = (props: Partial<React.ComponentProps<typeof RTDBBattleComponent>> = {}) =>
  render(<RTDBBattleComponent battleId="battle-1" {...props} />);

const moveButton = (id: string) => screen.getByTestId(`move-${id}`);

/* ─── Tests ─────────────────────────────────────────────────────────── */

describe('RTDBBattleComponent', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    forfeitHandler.mockReset();
    trackEvent.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  describe('loading and error states', () => {
    it('shows the loading state', () => {
      setHook({ loading: true });
      renderBattle();
      expect(screen.getByText('Initializing battle...')).toBeInTheDocument();
    });

    it('shows the error with retry and lobby actions', () => {
      setHook({ error: 'Battle not found' });
      renderBattle();
      expect(screen.getByRole('alert')).toHaveTextContent('Battle error: Battle not found');
      expect(screen.getByText('Battle ID: battle-1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      // next/link drops the trailing slash outside a configured Next app (trailingSlash lives in next.config)
      expect(screen.getByRole('link', { name: 'Return to lobby' }).getAttribute('href')).toMatch(/^\/lobby\/?$/);
    });

    it('waits when meta or public state has not arrived', () => {
      setHook({ pub: null });
      renderBattle();
      expect(screen.getByText('Waiting for battle data...')).toBeInTheDocument();
    });
  });

  describe('battle display', () => {
    it('shows phase, turn, timer and connection status', () => {
      setHook({ meta: { turn: 3 } });
      renderBattle();
      expect(screen.getByTestId('turn-counter')).toHaveTextContent('Turn 3');
      expect(screen.getByRole('timer')).toHaveTextContent('25s');
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('renders my active Pokémon on my side even when I am p2', () => {
      setHook({
        meUid: OPP,
        oppUid: ME,
      });
      renderBattle();
      expect(screen.getByTestId('sprite-player')).toHaveTextContent('eevee Lv48 120/130');
      expect(screen.getByTestId('sprite-opponent')).toHaveTextContent('pikachu Lv50 90/110');
    });

    it('prompts for the next action when the log is empty', () => {
      setHook();
      renderBattle();
      expect(screen.getByText('What will Pikachu do?')).toBeInTheDocument();
    });

    it('marks the timer urgent in the last 5 seconds', () => {
      setHook({ timeLeftSec: 4 });
      renderBattle();
      expect(screen.getByRole('timer')).toHaveClass('text-red-600');
    });

    it('shows the reconnecting banner', () => {
      setHook({ connectionStatus: 'reconnecting' });
      renderBattle();
      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
      expect(screen.getByText('Reconnecting to battle stream...')).toBeInTheDocument();
    });
  });

  describe('move selection', () => {
    it('lists legal moves with formatted names and PP', () => {
      setHook();
      renderBattle();
      expect(moveButton('thunderbolt')).toHaveTextContent('Thunderbolt');
      expect(moveButton('thunderbolt')).toHaveTextContent('PP: 15 / 15');
      expect(moveButton('quick-attack')).toHaveTextContent('Quick Attack');
    });

    it('submits the move, locks the action in and disables further choices', async () => {
      const hook = setHook();
      renderBattle();

      await act(async () => {
        fireEvent.click(moveButton('thunderbolt'));
      });

      expect(hook.chooseMove).toHaveBeenCalledWith('thunderbolt', undefined);
      expect(screen.getByText('Action locked in for turn 1')).toBeInTheDocument();
      expect(screen.getByText('Waiting for opponent…')).toBeInTheDocument();
      expect(moveButton('thunderbolt')).toHaveAttribute('aria-pressed', 'true');
      expect(moveButton('quick-attack')).toBeDisabled();
    });

    it('unlocks the action panel when submission fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const hook = setHook({ chooseMove: vi.fn().mockRejectedValue(new Error('network')) });
      renderBattle();

      await act(async () => {
        fireEvent.click(moveButton('thunderbolt'));
      });

      expect(hook.chooseMove).toHaveBeenCalled();
      await waitFor(() => expect(moveButton('thunderbolt')).not.toBeDisabled());
      expect(screen.queryByText('Action locked in for turn 1')).not.toBeInTheDocument();
      consoleError.mockRestore();
    });

    it('disables moves the server marks illegal and shows the reason', () => {
      setHook({
        legalMoves: [
          { id: 'thunderbolt', pp: 0, maxPp: 15, disabled: true, reason: 'No PP left' },
          { id: 'quick-attack', pp: 30, maxPp: 30 },
        ],
      });
      renderBattle();
      expect(moveButton('thunderbolt')).toBeDisabled();
      expect(moveButton('thunderbolt')).toHaveTextContent('No PP left');
      expect(moveButton('quick-attack')).not.toBeDisabled();
    });

    it('ignores clicks while the turn is resolving', () => {
      const hook = setHook({ meta: { phase: 'resolving' } });
      renderBattle();
      expect(screen.getByText('Waiting for opponent…')).toBeInTheDocument();
      expect(moveButton('thunderbolt')).toBeDisabled();
      fireEvent.click(moveButton('thunderbolt'));
      expect(hook.chooseMove).not.toHaveBeenCalled();
    });
  });

  describe('switching', () => {
    it('enables only legal, healthy, non-active bench slots', () => {
      setHook();
      renderBattle();
      const active = screen.getByTestId('switch-pikachu-0');
      const bench = screen.getByTestId('switch-bulbasaur-1');
      const fainted = screen.getByTestId('switch-squirtle-2');

      expect(active).toBeDisabled();
      expect(active).toHaveTextContent('Active');
      expect(bench).not.toBeDisabled();
      expect(bench).toHaveTextContent('HP: 100 / 120');
      expect(fainted).toBeDisabled();
      expect(fainted).toHaveTextContent('Fainted');
    });

    it('submits the switch', async () => {
      const hook = setHook();
      renderBattle();
      await act(async () => {
        fireEvent.click(screen.getByTestId('switch-bulbasaur-1'));
      });
      expect(hook.chooseSwitch).toHaveBeenCalledWith(1);
      expect(screen.getByText('Action locked in for turn 1')).toBeInTheDocument();
    });
  });

  describe('battle log', () => {
    it('shows the latest log lines with classification chips', () => {
      setHook({
        pub: {
          battleLog: [
            { type: 'move_used', message: 'Pikachu used thunderbolt!' },
            { type: 'damage_dealt', message: 'Eevee took 40 damage! (69% HP left)' },
          ],
        },
      });
      renderBattle();
      const log = screen.getByRole('log');
      expect(log).toHaveTextContent('Pikachu used thunderbolt!');
      expect(log).toHaveTextContent('Eevee took 40 damage!');
      expect(log).toHaveTextContent('Damage');
    });

    it('appends a server validation notice as an engine warning', () => {
      setHook({ pub: { battleLog: [], lastValidation: { turn: 2, p1: 'illegal_move' } } });
      renderBattle();
      expect(screen.getByRole('log')).toHaveTextContent('Server rejected illegal action(s) on turn 2.');
      expect(screen.getByRole('log')).toHaveTextContent('Engine');
    });
  });

  describe('battle end', () => {
    it('shows the end screen, hides the action panel and reports the winner', async () => {
      setHook({ meta: { phase: 'ended', winnerUid: ME, endedReason: 'victory' } });
      const onBattleComplete = vi.fn();
      renderBattle({ onBattleComplete });

      await waitFor(() => expect(screen.getByTestId('end-screen')).toHaveTextContent('winner:player'));
      expect(screen.queryByText('Choose Your Action')).not.toBeInTheDocument();
      expect(onBattleComplete).toHaveBeenCalledWith(ME);
      expect(trackEvent).toHaveBeenCalledWith('battle_completed', expect.objectContaining({ battleId: 'battle-1' }));
    });

    it('reports a loss from my perspective', async () => {
      setHook({ meta: { phase: 'ended', winnerUid: OPP, endedReason: 'forfeit' } });
      renderBattle();
      await waitFor(() => expect(screen.getByTestId('end-screen')).toHaveTextContent('winner:opponent reason:forfeit'));
    });
  });

  it('forfeit button calls the forfeit handler', () => {
    setHook();
    renderBattle();
    fireEvent.click(screen.getByTestId('forfeit-button'));
    expect(forfeitHandler).toHaveBeenCalled();
  });
});
