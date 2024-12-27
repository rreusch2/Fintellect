import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "./db.js";

export function setupAuth(app: any) {
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        // Your user lookup and verification logic here
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email)
        });

        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // Verify password here
        // ...

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id)
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
} 