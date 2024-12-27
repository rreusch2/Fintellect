import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "../../db/index.js";
import type { Express } from "express";
import type { SelectUser } from "../../db/schema.js";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  passport.use(new LocalStrategy(
    { usernameField: 'username' },
    async (username, password, done) => {
      try {
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.username, username)
        });

        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // TODO: Add password verification
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: SelectUser, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
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
