import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import LoginForm from '../LoginForm';
import RegisterForm from '../RegisterForm';

// Mock the auth context
const mockSignInWithGoogle = jest.fn();
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signInWithGoogle: mockSignInWithGoogle,
    logout: jest.fn()
  })
}));

describe('Google Sign-In Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LoginForm', () => {
    it('should render Google Sign-In button', () => {
      render(<LoginForm onToggleMode={jest.fn()} />);
      
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
    });

    it('should call signInWithGoogle when Google button is clicked', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined);
      
      render(<LoginForm onToggleMode={jest.fn()} />);
      
      const googleButton = screen.getByText('Sign in with Google');
      
      await act(async () => {
        fireEvent.click(googleButton);
      });
      
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when Google sign-in is in progress', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<LoginForm onToggleMode={jest.fn()} />);
      
      const googleButton = screen.getByText('Sign in with Google');
      
      await act(async () => {
        fireEvent.click(googleButton);
      });
      
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    it('should display error message when Google sign-in fails', async () => {
      const errorMessage = 'Failed to sign in with Google';
      mockSignInWithGoogle.mockRejectedValue(new Error(errorMessage));
      
      render(<LoginForm onToggleMode={jest.fn()} />);
      
      const googleButton = screen.getByText('Sign in with Google');
      
      await act(async () => {
        fireEvent.click(googleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('RegisterForm', () => {
    it('should render Google Sign-In button', () => {
      render(<RegisterForm onToggleMode={jest.fn()} />);
      
      expect(screen.getByText('Sign up with Google')).toBeInTheDocument();
    });

    it('should call signInWithGoogle when Google button is clicked', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined);
      
      render(<RegisterForm onToggleMode={jest.fn()} />);
      
      const googleButton = screen.getByText('Sign up with Google');
      
      await act(async () => {
        fireEvent.click(googleButton);
      });
      
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when Google sign-in is in progress', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<RegisterForm onToggleMode={jest.fn()} />);
      
      const googleButton = screen.getByText('Sign up with Google');
      
      await act(async () => {
        fireEvent.click(googleButton);
      });
      
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    it('should display error message when Google sign-in fails', async () => {
      const errorMessage = 'Failed to sign in with Google';
      mockSignInWithGoogle.mockRejectedValue(new Error(errorMessage));
      
      render(<RegisterForm onToggleMode={jest.fn()} />);
      
      const googleButton = screen.getByText('Sign up with Google');
      
      await act(async () => {
        fireEvent.click(googleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });
});
