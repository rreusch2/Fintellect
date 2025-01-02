import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import passport from 'passport';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials');
}

export function setupGoogleAuth() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: 'http://localhost:5001/api/auth/google/callback',
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google auth callback:', { 
            id: profile.id,
            email: profile.emails?.[0]?.value 
          });

          // Check if user exists
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.googleId, profile.id))
            .limit(1);

          if (existingUser) {
            console.log('Existing user found:', existingUser.id);
            return done(null, {
              ...existingUser,
              isNewUser: false
            });
          }

          // Create new user with onboarding flags explicitly set
          const [newUser] = await db
            .insert(users)
            .values({
              username: profile.emails?.[0]?.value?.split('@')[0] || `user${Date.now()}`,
              email: profile.emails?.[0]?.value,
              googleId: profile.id,
              googleEmail: profile.emails?.[0]?.value,
              avatar: profile.photos?.[0]?.value,
              hasPlaidSetup: false,
              hasCompletedOnboarding: false,
              consentVersion: null, // Explicitly set to null for new users
            })
            .returning();

          console.log('New user created:', newUser.id);
          return done(null, {
            ...newUser,
            isNewUser: true
          });
        } catch (error) {
          console.error('Google auth error:', error);
          return done(error as Error);
        }
      }
    )
  );
} 