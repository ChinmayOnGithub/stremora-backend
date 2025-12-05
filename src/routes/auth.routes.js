import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

const router = Router();

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:8000"}/api/v1/auth/google/callback`,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // User exists, check if they signed up with Google
          if (!user.googleId) {
            // User exists but didn't sign up with Google
            user.googleId = profile.id;
            user.isEmailVerified = true; // Google emails are verified
            await user.save({ validateBeforeSave: false });
          }
          return done(null, user);
        }

        // Create new user with Google data
        const username = profile.emails[0].value.split("@")[0].toLowerCase() + Math.floor(Math.random() * 1000);
        
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          fullname: profile.displayName,
          username: username,
          avatar: profile.photos[0]?.value || "",
          password: Math.random().toString(36).slice(-12), // Random password (won't be used)
          isEmailVerified: true, // Google emails are pre-verified
          authProvider: "google",
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/?auth=failed` }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate tokens
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      // Save refresh token
      user.refreshToken = refreshToken.toString();
      await user.save({ validateBeforeSave: false });

      // Store tokens in localStorage via a redirect page
      const tokens = encodeURIComponent(JSON.stringify({ accessToken, refreshToken }));
      
      // Redirect to frontend with tokens in URL (will be handled by frontend)
      res.redirect(`${process.env.FRONTEND_URL}/?auth=success&tokens=${tokens}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL}/?auth=failed`);
    }
  }
);

export default router;
