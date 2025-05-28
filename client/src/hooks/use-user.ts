import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

// Define types for user data - adjust these to match your actual schema
type SelectUser = {
  id: number;
  username: string;
  hasCompletedOnboarding?: boolean;
  hasPlaidSetup?: boolean;
  email?: string;
  [key: string]: any; // For other potential fields
};

type InsertUser = Omit<SelectUser, 'id'> & {
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
};

type RequestResult = {
  ok: true;
  user?: SelectUser;
} | {
  ok: false;
  message: string;
};

interface LoginData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData extends Omit<InsertUser, 'id'> {}

const defaultFetchOptions = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
  },
};

async function fetchUser(): Promise<SelectUser | null> {
  try {
    console.log('Fetching user data...');
    const response = await fetch('/api/user', defaultFetchOptions);
    console.log('User fetch response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.log('User not authenticated (401)');
        return null;
      }

      if (response.status >= 500) {
        console.error(`Server error: ${response.status}: ${response.statusText}`);
        return null;
      }

      console.error(`API error: ${response.status}: ${await response.text()}`);
      return null;
    }

    const userData = await response.json();
    console.log('User data fetched successfully:', userData);
    return userData;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export function useUser() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Query for user data
  const { data: user, error, isLoading, refetch } = useQuery<SelectUser | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
    // Don't refetch on window focus to avoid unexpected redirects
    refetchOnWindowFocus: false,
  });

  // Handle login
  const loginMutation = useMutation<RequestResult, Error, LoginData>({
    mutationFn: async (userData) => {
      console.log('Login attempt for user:', userData.username);
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
          credentials: 'include',
        });

        console.log('Login response status:', response.status);

        if (!response.ok) {
          if (response.status >= 500) {
            return { ok: false, message: response.statusText };
          }
          const errorText = await response.text();
          console.error('Login failed:', errorText);
          return { ok: false, message: errorText };
        }

        const data = await response.json();
        console.log('Login successful, user data received:', data);
        return { ok: true, user: data.user };
      } catch (error) {
        console.error('Login error:', error);
        return { ok: false, message: error instanceof Error ? error.message : String(error) };
      }
    },
    onSuccess: async (data) => {
      console.log('Login mutation success, updating cache');
      
      // Immediately update the user in the cache
      if (data.ok && data.user) {
        console.log('Setting user data in cache');
        queryClient.setQueryData(['user'], data.user);
        
        // Fetch fresh user data to ensure session is established
        console.log('Fetching fresh user data after login');
        const freshUserData = await fetchUser();
        
        if (freshUserData) {
          console.log('Fresh user data fetched successfully after login');
          queryClient.setQueryData(['user'], freshUserData);
          
          // Redirect based on onboarding status
          if (freshUserData.hasCompletedOnboarding) {
            console.log('User has completed onboarding, redirecting to dashboard');
            setLocation('/dashboard');
          } else {
            console.log('User has not completed onboarding, redirecting to onboarding');
            setLocation('/onboarding');
          }
        } else {
          console.error('Failed to fetch fresh user data after login');
          // Still try to redirect based on the original data
          if (data.user.hasCompletedOnboarding) {
            setLocation('/dashboard');
          } else {
            setLocation('/onboarding');
          }
        }
      } else {
        // If no user data in response, fetch fresh data
        console.log('No user data in response, refreshing user data');
        await queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
    }
  });

  // Handle logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          const message = await response.text();
          return { ok: false, message };
        }

        return { ok: true };
      } catch (error) {
        return { 
          ok: false, 
          message: error instanceof Error ? error.message : String(error) 
        };
      }
    },
    onSuccess: () => {
      // Clear user data and redirect to landing page
      console.log('Logout successful, clearing cache');
      queryClient.setQueryData(['user'], null);
      queryClient.clear();
      setLocation('/');
    },
  });

  // Handle registration
  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: async (userData) => {
      console.log('Registration attempt for user:', userData.username);
      
      try {
        // First, register the user
        const response = await fetch('/api/register', {
          ...defaultFetchOptions,
          method: 'POST',
          body: JSON.stringify(userData),
        });

        console.log('Registration response status:', response.status);

        if (!response.ok) {
          if (response.status >= 500) {
            return { ok: false, message: response.statusText };
          }
          const errorText = await response.text();
          console.error('Registration failed:', errorText);
          return { ok: false, message: errorText };
        }

        const data = await response.json();
        console.log('Registration successful, user data received:', data);
        return { ok: true, user: data.user };
      } catch (error) {
        console.error('Registration error:', error);
        return { 
          ok: false, 
          message: error instanceof Error ? error.message : String(error) 
        };
      }
    },
    onSuccess: async (data) => {
      console.log('Registration mutation success, updating cache');
      
      // Immediately update the user in the cache
      if (data.ok && data.user) {
        console.log('Setting user data in cache after registration');
        queryClient.setQueryData(['user'], data.user);
        
        // Fetch fresh user data to ensure session is established
        console.log('Fetching fresh user data after registration');
        const freshUserData = await fetchUser();
        
        if (freshUserData) {
          console.log('Fresh user data fetched successfully after registration');
          queryClient.setQueryData(['user'], freshUserData);
          
          // For new registrations, always redirect to onboarding
          console.log('Redirecting new user to onboarding');
          setLocation('/onboarding');
        } else {
          console.error('Failed to fetch fresh user data after registration');
          // Still try to redirect to onboarding
          setLocation('/onboarding');
        }
      } else {
        // If no user data in response, fetch fresh data
        console.log('No user data in response after registration, refreshing');
        await queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    },
    onError: (error) => {
      console.error('Registration mutation error:', error);
    }
  });

  // Expose the API
  return {
    user,
    isLoading,
    error,
    refetch,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}
