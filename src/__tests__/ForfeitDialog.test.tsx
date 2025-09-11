import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ForfeitDialog from '@/components/ForfeitDialog';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

describe('ForfeitDialog', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPush.mockClear();
  });

  it('renders when open', () => {
    render(
      <ForfeitDialog
        isOpen={true}
        opponentName="Test Opponent"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Battle Room')).toBeInTheDocument();
    expect(screen.getByText('Test Opponent forfeited the battle')).toBeInTheDocument();
    expect(screen.getByText('Back to Battle Lobby')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ForfeitDialog
        isOpen={false}
        opponentName="Test Opponent"
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByText('Battle Room')).not.toBeInTheDocument();
  });

  it('shows room finished message when isRoomFinished is true', () => {
    render(
      <ForfeitDialog
        isOpen={true}
        opponentName="Test Host"
        isRoomFinished={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Test Host ended the room')).toBeInTheDocument();
    expect(screen.getByText('The room host has left and the room is now finished. You can go back to the lobby to find or create a new battle room.')).toBeInTheDocument();
  });

  it('calls onClose and navigates to lobby when Back to Battle Lobby is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(
      <ForfeitDialog
        isOpen={true}
        opponentName="Test Opponent"
        onClose={mockOnClose}
      />
    );

    const backButton = screen.getByText('Back to Battle Lobby');
    fireEvent.click(backButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/lobby');
  });

  it('prevents closing when clicking outside the dialog', () => {
    const mockOnClose = jest.fn();
    
    render(
      <ForfeitDialog
        isOpen={true}
        opponentName="Test Opponent"
        onClose={mockOnClose}
      />
    );

    // Click on the backdrop
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('prevents closing when clicking on the dialog content', () => {
    const mockOnClose = jest.fn();
    
    render(
      <ForfeitDialog
        isOpen={true}
        opponentName="Test Opponent"
        onClose={mockOnClose}
      />
    );

    // Click on the dialog content
    const dialogContent = document.querySelector('.bg-white.rounded-xl');
    if (dialogContent) {
      fireEvent.click(dialogContent);
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
