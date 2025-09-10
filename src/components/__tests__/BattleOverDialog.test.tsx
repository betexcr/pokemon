import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import BattleOverDialog from '../BattleOverDialog'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

const mockPush = jest.fn()
const mockRouter = {
  push: mockPush
}

const mockPlayerTeam = [
  {
    pokemon: {
      name: 'pikachu',
      sprites: { front_default: '/pikachu.png' }
    },
    currentHp: 0,
    maxHp: 100
  },
  {
    pokemon: {
      name: 'charizard',
      sprites: { front_default: '/charizard.png' }
    },
    currentHp: 50,
    maxHp: 100
  }
]

const mockOpponentTeam = [
  {
    pokemon: {
      name: 'blastoise',
      sprites: { front_default: '/blastoise.png' }
    },
    currentHp: 100,
    maxHp: 100
  }
]

describe('BattleOverDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('should not render when isOpen is false', () => {
    render(
      <BattleOverDialog
        isOpen={false}
        onClose={jest.fn()}
        winner="player"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
      />
    )

    expect(screen.queryByText('Victory!')).not.toBeInTheDocument()
  })

  it('should render victory dialog when player wins', () => {
    render(
      <BattleOverDialog
        isOpen={true}
        onClose={jest.fn()}
        winner="player"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
      />
    )

    expect(screen.getByText('Victory!')).toBeInTheDocument()
    expect(screen.getByText('Congratulations! You won the battle!')).toBeInTheDocument()
  })

  it('should render defeat dialog when player loses', () => {
    render(
      <BattleOverDialog
        isOpen={true}
        onClose={jest.fn()}
        winner="opponent"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
      />
    )

    expect(screen.getByText('Defeat!')).toBeInTheDocument()
    expect(screen.getByText('Better luck next time!')).toBeInTheDocument()
  })

  it('should render draw dialog when battle is a draw', () => {
    render(
      <BattleOverDialog
        isOpen={true}
        onClose={jest.fn()}
        winner="draw"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
      />
    )

    expect(screen.getByText('Draw!')).toBeInTheDocument()
    expect(screen.getByText('The battle ended in a draw!')).toBeInTheDocument()
  })

  it('should display player team correctly', () => {
    render(
      <BattleOverDialog
        isOpen={true}
        onClose={jest.fn()}
        winner="player"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
      />
    )

    expect(screen.getByText('Your Team')).toBeInTheDocument()
    expect(screen.getByText('Pikachu')).toBeInTheDocument()
    expect(screen.getByText('Charizard')).toBeInTheDocument()
    expect(screen.getByText('Fainted')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should display opponent team correctly', () => {
    render(
      <BattleOverDialog
        isOpen={true}
        onClose={jest.fn()}
        winner="player"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
      />
    )

    expect(screen.getByText('Opponent Team')).toBeInTheDocument()
    expect(screen.getByText('Blastoise')).toBeInTheDocument()
  })

  it('should handle multiplayer mode correctly', () => {
    render(
      <BattleOverDialog
        isOpen={true}
        onClose={jest.fn()}
        winner="player"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
        isMultiplayer={true}
        hostName="Player1"
        guestName="Player2"
      />
    )

    expect(screen.getByText('You Win!')).toBeInTheDocument()
    expect(screen.getByText('Congratulations! You defeated Player2!')).toBeInTheDocument()
    expect(screen.getByText("Player1's Team")).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn()
    render(
      <BattleOverDialog
        isOpen={true}
        onClose={mockOnClose}
        winner="player"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
      />
    )

    const closeButton = screen.getByLabelText('Close dialog')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should navigate to battle page when Back to Battles is clicked', () => {
    render(
      <BattleOverDialog
        isOpen={true}
        onClose={jest.fn()}
        winner="player"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
      />
    )

    const backButton = screen.getByText('Back to Battles')
    fireEvent.click(backButton)

    expect(mockPush).toHaveBeenCalledWith('/battle')
  })

  it('should call onClose when Close button is clicked', () => {
    const mockOnClose = jest.fn()
    render(
      <BattleOverDialog
        isOpen={true}
        onClose={mockOnClose}
        winner="player"
        playerTeam={mockPlayerTeam}
        opponentTeam={mockOpponentTeam}
      />
    )

    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
