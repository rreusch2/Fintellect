export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  googleId?: string;
  hasPlaidSetup: boolean;
  hasCompletedOnboarding: boolean;
} 