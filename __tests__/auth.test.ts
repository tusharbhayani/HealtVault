import { useAuthStore } from '@/store/useAuthStore';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: false,
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.loading).toBe(false);
  });

  test('should handle sign in success', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const { supabase } = require('@/lib/supabase');

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: '123',
              email: 'test@example.com',
              full_name: 'Test User',
              subscription_status: 'free',
            },
            error: null,
          }),
        }),
      }),
    });

    const { signIn } = useAuthStore.getState();
    await signIn('test@example.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  test('should handle sign in failure', async () => {
    const { supabase } = require('@/lib/supabase');
    const error = new Error('Invalid credentials');

    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error,
    });

    const { signIn } = useAuthStore.getState();

    await expect(signIn('test@example.com', 'wrongpassword')).rejects.toThrow(
      'Invalid credentials'
    );
  });

  test('should handle sign up for new user', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    };
    const { supabase } = require('@/lib/supabase');

    supabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    supabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: '123',
              email: 'test@example.com',
              full_name: 'Test User',
              subscription_status: 'free',
            },
            error: null,
          }),
        }),
      }),
    });

    const { signUp } = useAuthStore.getState();
    await signUp('test@example.com', 'password123', 'Test User');

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User',
        },
        emailRedirectTo: undefined,
      },
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
  });

  test('should handle existing user during sign up', async () => {
    const { supabase } = require('@/lib/supabase');

    supabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: new Error('User already registered'),
    });

    const { signUp } = useAuthStore.getState();

    await expect(
      signUp('test@example.com', 'password123', 'Test User')
    ).rejects.toThrow('An account with this email already exists');
  });

  test('should handle sign out', async () => {
    const { supabase } = require('@/lib/supabase');
    supabase.auth.signOut.mockResolvedValue({ error: null });

    // Set initial state
    useAuthStore.setState({
      user: { id: '123' },
      profile: { id: '123', email: 'test@example.com' },
    });

    const { signOut } = useAuthStore.getState();
    await signOut();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  test('should create profile if it does not exist during loadProfile', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    };

    useAuthStore.setState({ user: mockUser });

    const { supabase } = require('@/lib/supabase');

    // Mock profile not found error
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValueOnce({
              data: null,
              error: { code: 'PGRST116' }, // Profile not found
            })
            .mockResolvedValueOnce({
              data: {
                id: '123',
                email: 'test@example.com',
                full_name: 'Test User',
                subscription_status: 'free',
              },
              error: null,
            }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    const { loadProfile } = useAuthStore.getState();
    await loadProfile();

    expect(supabase.from().insert).toHaveBeenCalledWith({
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
      subscription_status: 'free',
    });
  });

  test('should handle profile creation failure gracefully', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    };

    useAuthStore.setState({ user: mockUser });

    const { supabase } = require('@/lib/supabase');

    // Mock profile not found and creation failure
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // Profile not found
          }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({
        error: new Error('Profile creation failed'),
      }),
    });

    const { loadProfile } = useAuthStore.getState();
    await loadProfile();

    // Should still set a basic profile even if creation fails
    const state = useAuthStore.getState();
    expect(state.profile).toBeTruthy();
    expect(state.profile?.email).toBe('test@example.com');
  });
});
