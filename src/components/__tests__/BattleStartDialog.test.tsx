import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BattleStartDialog from '../BattleStartDialog';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node,
}));

describe('BattleStartDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnBattleStart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders when open', () => {
    render(
      <BattleStartDialog
        isOpen={true}
        onClose={mockOnClose}
        onBattleStart={mockOnBattleStart}
      />
    );

    expect(screen.getByText('BATTLE STARTING!')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('BATTLE LOADING')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <BattleStartDialog
        isOpen={false}
        onClose={mockOnClose}
        onBattleStart={mockOnBattleStart}
      />
    );

    expect(screen.queryByText('BATTLE STARTING!')).not.toBeInTheDocument();
  });

  it('shows countdown timer', async () => {
    render(
      <BattleStartDialog
        isOpen={true}
        onClose={mockOnClose}
        onBattleStart={mockOnBattleStart}
      />
    );

    // Initial countdown
    expect(screen.getByText('3')).toBeInTheDocument();

    // Fast forward 1 second
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Fast forward another second
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Fast forward final second
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText('GO!')).toBeInTheDocument();
    });
  });

  it('shows loading messages', async () => {
    render(
      <BattleStartDialog
        isOpen={true}
        onClose={mockOnClose}
        onBattleStart={mockOnBattleStart}
      />
    );

    // Initial message
    expect(screen.getByText('Initializing battle arena...')).toBeInTheDocument();

    // Fast forward to see message changes
    jest.advanceTimersByTime(400);
    await waitFor(() => {
      expect(screen.getByText('Loading trainer data...')).toBeInTheDocument();
    });
  });

  it('shows progress bar', async () => {
    render(
      <BattleStartDialog
        isOpen={true}
        onClose={mockOnClose}
        onBattleStart={mockOnBattleStart}
      />
    );

    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toBeInTheDocument();

    // Fast forward to see progress
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText(/33%/)).toBeInTheDocument();
    });
  });

  it('calls onBattleStart after countdown completes', async () => {
    render(
      <BattleStartDialog
        isOpen={true}
        onClose={mockOnClose}
        onBattleStart={mockOnBattleStart}
      />
    );

    // Fast forward through entire countdown + delay
    jest.advanceTimersByTime(3500);

    await waitFor(() => {
      expect(mockOnBattleStart).toHaveBeenCalled();
    });
  });

  it('uses Pocket Monk font family', () => {
    render(
      <BattleStartDialog
        isOpen={true}
        onClose={mockOnClose}
        onBattleStart={mockOnBattleStart}
      />
    );

    const title = screen.getByText('BATTLE STARTING!');
    expect(title).toHaveStyle('font-family: Pocket Monk, monospace');
  });

  it('shows battle start GIF', () => {
    render(
      <BattleStartDialog
        isOpen={true}
        onClose={mockOnClose}
        onBattleStart={mockOnBattleStart}
      />
    );

    const gif = screen.getByAltText('Battle Starting');
    expect(gif).toHaveAttribute('src', '/gen1/battle_start.gif');
  });
});

